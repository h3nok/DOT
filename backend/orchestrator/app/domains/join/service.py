"""The request-to-join queue.

Invite-only (ADR-0001) decides who is admitted. This decides nothing — it only
records that someone asked, and that the address they gave is one they actually
hold. Verification is the whole point: an unverified queue is a list of
addresses anyone can put anyone else on.

Two rules the endpoints below are built around:

* **The address is sealed, never plain** (ADR-0007, `app.core.contact`). If no
  key is configured the queue refuses requests rather than quietly storing
  addresses it promised to protect.
* **Asking twice is not a second request.** Re-requesting refreshes the code and
  the reason on the same row, so the queue cannot be inflated and a person who
  mistypes their reason is not stuck with it.
"""

from __future__ import annotations

import datetime
import logging
import os
import secrets

import bcrypt
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.core.contact
import app.db.models
import app.domains.auth.service

logger = logging.getLogger(__name__)

_CODE_TTL_SECONDS = 900
_RESEND_COOLDOWN_SECONDS = 45
_MAX_ATTEMPTS = 5


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC)


def _as_utc(value: datetime.datetime) -> datetime.datetime:
    return value if value.tzinfo else value.replace(tzinfo=datetime.UTC)


async def request_join(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    email: str,
    reason: str | None,
) -> dict:
    """Record the request and send a code proving the address."""
    if not app.core.contact.sealing_available():
        # Fail closed. Accepting an address with nowhere safe to put it is worse
        # than declining it, and mirrors how the support plane refuses without
        # its Stripe keys.
        return {
            "ok": False,
            "error": "Requests are not open yet.",
            "status": 503,
        }

    email_hash = app.core.contact.blind_index(email)
    now = _now()

    recent = await session.scalar(
        sqlalchemy.select(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.purpose == "join",
        )
        .order_by(app.db.models.OtpCode.created_at.desc())
        .limit(1)
    )
    if recent:
        elapsed = (now - _as_utc(recent.created_at)).total_seconds()
        if elapsed < _RESEND_COOLDOWN_SECONDS:
            wait = int(_RESEND_COOLDOWN_SECONDS - elapsed)
            return {
                "ok": False,
                "error": f"Please wait {wait}s before asking for another code.",
                "status": 429,
            }

    existing = await session.scalar(
        sqlalchemy.select(app.db.models.JoinRequest).where(
            app.db.models.JoinRequest.email_hash == email_hash
        )
    )
    if existing:
        # Already answered? Then this is not a new request, and saying so would
        # leak that the address is known. Refresh quietly and send a code.
        existing.email_sealed = app.core.contact.seal(email)
        if reason:
            existing.reason = reason
    else:
        session.add(
            app.db.models.JoinRequest(
                email_hash=email_hash,
                email_sealed=app.core.contact.seal(email),
                reason=reason,
            )
        )

    await session.execute(
        sqlalchemy.update(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.purpose == "join",
        )
        .values(used_at=now)
    )

    code = f"{secrets.randbelow(1_000_000):06d}"
    session.add(
        app.db.models.OtpCode(
            email_hash=email_hash,
            code_hash=bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode(),
            purpose="join",
            expires_at=now + datetime.timedelta(seconds=_CODE_TTL_SECONDS),
        )
    )
    await session.commit()

    sent = await app.domains.auth.service.send_code_email(email, code, purpose="join")
    if not sent:
        return {"ok": False, "error": "Could not send the code. Try again.", "status": 502}

    result: dict = {"ok": True, "expires_in": _CODE_TTL_SECONDS}
    if not os.environ.get("RESEND_API_KEY"):
        result["dev_code"] = code
    return result


async def verify_join(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    email: str,
    code: str,
) -> dict:
    """Confirm the address. Never mints a session — this is not a sign-in."""
    email_hash = app.core.contact.blind_index(email)
    now = _now()

    record = await session.scalar(
        sqlalchemy.select(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.expires_at > now,
            app.db.models.OtpCode.purpose == "join",
        )
        .order_by(app.db.models.OtpCode.created_at.desc())
        .limit(1)
    )
    if not record:
        return {"ok": False, "error": "That code expired. Ask for a new one.", "status": 400}

    if record.attempts >= _MAX_ATTEMPTS:
        record.used_at = now
        await session.commit()
        return {"ok": False, "error": "Too many attempts. Ask for a new code.", "status": 429}

    if not bcrypt.checkpw(code.encode(), record.code_hash.encode()):
        record.attempts += 1
        await session.commit()
        remaining = max(_MAX_ATTEMPTS - record.attempts, 0)
        return {"ok": False, "error": f"Incorrect code. {remaining} attempts left.", "status": 400}

    record.used_at = now
    pending = await session.scalar(
        sqlalchemy.select(app.db.models.JoinRequest).where(
            app.db.models.JoinRequest.email_hash == email_hash
        )
    )
    if not pending:
        return {"ok": False, "error": "That request is no longer open.", "status": 404}

    pending.verified_at = pending.verified_at or now
    await session.commit()
    return {"ok": True}


async def list_requests(
    session: sqlalchemy.ext.asyncio.AsyncSession,
) -> list[dict]:
    """The queue, for the person who answers it. Verified requests only.

    Ordered oldest-first because that is the order a human works through, not
    because position is a rank anyone earns or is shown.
    """
    rows = (
        await session.scalars(
            sqlalchemy.select(app.db.models.JoinRequest)
            .where(app.db.models.JoinRequest.verified_at.is_not(None))
            .order_by(app.db.models.JoinRequest.created_at.asc())
        )
    ).all()

    return [
        {
            "id": row.id,
            # An unopenable row is shown rather than hidden: losing the key
            # should be visible to the steward, not silently shrink the queue.
            "email": app.core.contact.open_sealed(row.email_sealed),
            "reason": row.reason,
            "status": row.status,
            "verified_at": row.verified_at,
            "created_at": row.created_at,
        }
        for row in rows
    ]
