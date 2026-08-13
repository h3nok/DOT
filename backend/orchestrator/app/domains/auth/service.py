"""OTP sign-in and session management — orchestrator-native auth domain."""

from __future__ import annotations

import datetime
import hashlib
import logging
import os
import secrets
import time

import bcrypt
import httpx
import jwt
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.db.models
import app.settings

logger: logging.Logger = logging.getLogger("dot_orchestrator.auth")

_CODE_TTL_SECONDS = 10 * 60  # 10 minutes
_RESEND_COOLDOWN_SECONDS = 45
_MAX_ATTEMPTS = 5
_SESSION_TTL_SECONDS = 7 * 24 * 3600  # 7 days
_INVITE_TTL_SECONDS = 14 * 24 * 3600  # 14 days
_ALGORITHM = "HS256"


# ── Helpers ───────────────────────────────────────────────────────────────────


def _hash_email(email: str) -> str:
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _now_utc() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)


def _is_owner_email(email: str) -> bool:
    owner_emails: set[str] = {
        e.strip().lower()
        for e in os.environ.get("DOT_OWNER_EMAILS", "nkenok@gmail.com").split(",")
        if e.strip()
    }
    return email.strip().lower() in owner_emails


def _mint_session_jwt(member: app.db.models.Member, email: str) -> str:
    settings: app.settings.Settings = app.settings.get_settings()
    now = int(time.time())
    payload = {
        "sub": member.id,
        "owner_id": member.id,
        "role": member.role,
        "scopes": ["member"] if member.role == "member" else ["member", "owner:write"],
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": now,
        "exp": now + _SESSION_TTL_SECONDS,
        # is_owner is informational; authorization uses role/scopes.
        "is_owner": _is_owner_email(email),
    }
    return jwt.encode(payload, settings.SERVICE_AUTH_SECRET, algorithm=_ALGORITHM)


async def send_code_email(email: str, code: str, *, purpose: str = "signin") -> bool:
    """Send via Resend; fall back to console log in dev.

    Shared with the join queue, which needs the same delivery but must not tell
    someone they are signing in when they are asking to be let in.
    """
    joining: bool = purpose == "join"
    subject: str = f"Confirm your DOT request: {code}" if joining else f"Your DOT code: {code}"
    lead: str = (
        "Confirm the address for your request to join DOT"
        if joining
        else "Your sign-in code for DOT"
    )
    api_key: str = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        logger.info("[OTP] DEV CODE (%s) for %s: %s", purpose, email, code)
        return True
    from_addr: str = os.environ.get("EMAIL_FROM", "DOT <onboarding@resend.dev>")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r: httpx.Response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": from_addr,
                    "to": [email],
                    "subject": subject,
                    "html": (
                        f'<div style="font-family:ui-sans-serif,system-ui,sans-serif;'
                        f'max-width:420px;margin:0 auto;padding:24px">'
                        f'<p style="font-size:14px;color:#555">{lead}</p>'
                        f'<p style="font-size:34px;font-weight:700;letter-spacing:8px;'
                        f'margin:12px 0;color:#111">{code}</p>'
                        f'<p style="font-size:12px;color:#999">Expires in 10 minutes. '
                        f"If you did not request this, you can ignore it.</p></div>"
                    ),
                },
            )
        return r.status_code in (200, 201)
    except httpx.HTTPError as exc:
        logger.error("[OTP] Resend send failed: %s", exc)
        return False


# ── OTP request ───────────────────────────────────────────────────────────────


async def request_otp(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    email: str,
) -> dict:
    email_hash: str = _hash_email(email)
    now: datetime.datetime = _now_utc()

    # Enforce cooldown: reject if an unused code was issued within the window.
    recent: app.db.models.OtpCode | None = await session.scalar(
        sqlalchemy.select(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.purpose == "signin",
        )
        .order_by(app.db.models.OtpCode.created_at.desc())
        .limit(1)
    )
    if recent:
        elapsed: float = (now - recent.created_at.replace(tzinfo=datetime.UTC)).total_seconds()
        if elapsed < _RESEND_COOLDOWN_SECONDS:
            wait = int(_RESEND_COOLDOWN_SECONDS - elapsed)
            return {
                "ok": False,
                "error": f"Please wait {wait}s before requesting another code.",
                "status": 429,
            }

    # Invalidate prior active codes.
    await session.execute(
        sqlalchemy.update(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.purpose == "signin",
        )
        .values(used_at=now)
    )

    code: str = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()

    session.add(
        app.db.models.OtpCode(
            email_hash=email_hash,
            code_hash=code_hash,
            purpose="signin",
            expires_at=now + datetime.timedelta(seconds=_CODE_TTL_SECONDS),
        )
    )
    await session.commit()

    sent: bool = await send_code_email(email, code)
    if not sent:
        return {"ok": False, "error": "Could not send code. Try again.", "status": 502}

    result: dict = {"ok": True, "expires_in": _CODE_TTL_SECONDS}
    if not os.environ.get("RESEND_API_KEY"):
        result["dev_code"] = code
    return result


# ── OTP verify ────────────────────────────────────────────────────────────────


async def verify_otp(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    email: str,
    code: str,
    display_name: str | None,
) -> dict:
    email_hash: str = _hash_email(email)
    now: datetime.datetime = _now_utc()

    record: app.db.models.OtpCode | None = await session.scalar(
        sqlalchemy.select(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.expires_at > now,
            app.db.models.OtpCode.purpose == "signin",
        )
        .order_by(app.db.models.OtpCode.created_at.desc())
        .limit(1)
    )
    if not record:
        return {"ok": False, "error": "Code expired. Request a new one.", "status": 400}

    if record.attempts >= _MAX_ATTEMPTS:
        record.used_at = now
        await session.commit()
        return {"ok": False, "error": "Too many attempts. Request a new code.", "status": 429}

    if not bcrypt.checkpw(code.encode(), record.code_hash.encode()):
        record.attempts += 1
        await session.commit()
        remaining: int = max(_MAX_ATTEMPTS - record.attempts, 0)
        return {"ok": False, "error": f"Incorrect code. {remaining} attempts left.", "status": 400}

    # Correct — consume the code.
    record.used_at = now

    # Upsert member.
    member: app.db.models.Member | None = await session.scalar(
        sqlalchemy.select(app.db.models.Member).where(app.db.models.Member.email_hash == email_hash)
    )
    if member:
        member.last_signed_in_at = now
        if display_name and not member.display_name:
            member.display_name = display_name
    else:
        role: str = "owner" if _is_owner_email(email) else "member"
        member = app.db.models.Member(
            email_hash=email_hash,
            display_name=display_name,
            role=role,
            last_signed_in_at=now,
        )
        session.add(member)

    await session.commit()
    await session.refresh(member)

    token: str = _mint_session_jwt(member, email)
    return {
        "ok": True,
        "token": token,
        "user": {
            "id": member.id,
            "display_name": member.display_name,
            "role": member.role,
            "is_owner": _is_owner_email(email),
        },
    }


# ── Invite issuance ───────────────────────────────────────────────────────────


async def issue_invite(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    issued_by_id: str,
) -> dict:
    raw_token: str = secrets.token_urlsafe(32)
    token_hash: str = _hash_token(raw_token)
    expires_at: datetime.datetime = _now_utc() + datetime.timedelta(seconds=_INVITE_TTL_SECONDS)

    session.add(
        app.db.models.InviteCode(
            token_hash=token_hash,
            issued_by=issued_by_id,
            expires_at=expires_at,
        )
    )
    await session.commit()
    return {"token": raw_token, "expires_at": expires_at.isoformat()}


async def accept_invite(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    raw_token: str,
    member_id: str,
) -> bool:
    token_hash: str = _hash_token(raw_token)
    now: datetime.datetime = _now_utc()
    invite: app.db.models.InviteCode | None = await session.scalar(
        sqlalchemy.select(app.db.models.InviteCode).where(
            app.db.models.InviteCode.token_hash == token_hash,
            app.db.models.InviteCode.accepted_at.is_(None),
            app.db.models.InviteCode.revoked_at.is_(None),
            app.db.models.InviteCode.expires_at > now,
        )
    )
    if not invite:
        return False
    invite.accepted_by = member_id
    invite.accepted_at = now
    await session.commit()
    return True


async def check_invite(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    raw_token: str,
) -> dict:
    """Report whether a token is still open, without revealing who it was for."""

    token_hash: str = _hash_token(raw_token)
    now: datetime.datetime = _now_utc()
    invite: app.db.models.InviteCode | None = await session.scalar(
        sqlalchemy.select(app.db.models.InviteCode).where(
            app.db.models.InviteCode.token_hash == token_hash,
            app.db.models.InviteCode.accepted_at.is_(None),
            app.db.models.InviteCode.revoked_at.is_(None),
            app.db.models.InviteCode.expires_at > now,
        )
    )
    if not invite:
        return {"valid": False}
    issuer: app.db.models.Member | None = (
        await session.get(app.db.models.Member, invite.issued_by) if invite.issued_by else None
    )
    return {
        "valid": True,
        "invited_by": issuer.display_name if issuer else None,
        "expires_at": invite.expires_at.isoformat(),
    }


async def list_circle(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
) -> dict:
    """Members who joined through this member's invites."""

    rows: sqlalchemy.Result[
        tuple[app.db.models.InviteCode, app.db.models.Member]
    ] = await session.execute(
        sqlalchemy.select(app.db.models.InviteCode, app.db.models.Member)
        .join(app.db.models.Member, app.db.models.Member.id == app.db.models.InviteCode.accepted_by)
        .where(
            app.db.models.InviteCode.issued_by == owner_id,
            app.db.models.InviteCode.accepted_at.is_not(None),
        )
        .order_by(app.db.models.InviteCode.accepted_at.asc())
    )
    members: list[dict] = [
        {
            "display_name": member.display_name,
            "joined_at": invite.accepted_at.isoformat() if invite.accepted_at else None,
        }
        for invite, member in rows.all()
    ]
    return {"owner_id": owner_id, "count": len(members), "members": members}
