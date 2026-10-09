from __future__ import annotations

import datetime
import hashlib
import json
import re
import secrets
import urllib.parse

import cryptography.fernet
import fastapi
import httpx
import sqlalchemy as sa
import sqlalchemy.exc
import sqlalchemy.ext.asyncio

import app.auth.dependencies as auth
import app.core.tenancy
import app.domains.academy.policy
import app.domains.academy.service
import app.domains.distribution.models as models
import app.settings


def _utc(value: datetime.datetime) -> datetime.datetime:
    return value.replace(tzinfo=datetime.UTC) if value.tzinfo is None else value


def configured() -> bool:
    settings = app.settings.get_settings()
    if not all(
        (
            settings.LINKEDIN_CLIENT_ID,
            settings.LINKEDIN_CLIENT_SECRET,
            settings.LINKEDIN_REDIRECT_URI,
            settings.PUBLISHING_TOKEN_KEY,
        )
    ):
        return False
    try:
        cryptography.fernet.Fernet(settings.PUBLISHING_TOKEN_KEY.encode())
    except (ValueError, TypeError):
        return False
    try:
        uri = urllib.parse.urlsplit(settings.LINKEDIN_REDIRECT_URI)
    except ValueError:
        return False
    return (
        uri.scheme == "https"
        and bool(uri.hostname)
        and not uri.username
        and uri.path == "/v1/distribution/linkedin/callback"
        and not uri.query
        and not uri.fragment
    )


async def _bind(session: sqlalchemy.ext.asyncio.AsyncSession, owner: auth.OwnerContext) -> None:
    await app.core.tenancy.bind_tenant(session, owner.owner_id)


async def _connection(
    session: sqlalchemy.ext.asyncio.AsyncSession, owner: auth.OwnerContext
) -> models.PublishingConnection | None:
    await _bind(session, owner)
    return (
        await session.execute(
            sa.select(models.PublishingConnection).where(
                models.PublishingConnection.owner_id == owner.owner_id,
                models.PublishingConnection.actor_id == owner.actor_id,
                models.PublishingConnection.platform == "linkedin",
            )
        )
    ).scalar_one_or_none()


async def connection_status(
    session: sqlalchemy.ext.asyncio.AsyncSession, owner: auth.OwnerContext
) -> dict:
    row = await _connection(session, owner)
    return {
        "configured": configured(),
        "connected": bool(
            configured() and row and _utc(row.expires_at) > datetime.datetime.now(datetime.UTC)
        ),
        "display_name": row.display_name if row else None,
        "expires_at": row.expires_at if row else None,
    }


async def authorize(session: sqlalchemy.ext.asyncio.AsyncSession, owner: auth.OwnerContext) -> str:
    auth.ensure_write_scope(owner)
    if not configured():
        raise fastapi.HTTPException(
            503, "LinkedIn publishing needs application setup before an account can be connected."
        )
    await _bind(session, owner)
    now = datetime.datetime.now(datetime.UTC)
    await session.execute(
        sa.delete(models.PublishingAuthorization).where(
            models.PublishingAuthorization.owner_id == owner.owner_id,
            models.PublishingAuthorization.actor_id == owner.actor_id,
            sa.or_(
                models.PublishingAuthorization.expires_at < now,
                models.PublishingAuthorization.used_at.is_not(None),
            ),
        )
    )
    state = secrets.token_urlsafe(32)
    session.add(
        models.PublishingAuthorization(
            id=hashlib.sha256(state.encode()).hexdigest(),
            owner_id=owner.owner_id,
            actor_id=owner.actor_id,
            expires_at=now + datetime.timedelta(minutes=10),
        )
    )
    await session.commit()
    settings = app.settings.get_settings()
    return "https://www.linkedin.com/oauth/v2/authorization?" + urllib.parse.urlencode(
        {
            "response_type": "code",
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
            "state": state,
            "scope": "openid profile w_member_social",
        }
    )


async def complete_authorization(
    session: sqlalchemy.ext.asyncio.AsyncSession, owner: auth.OwnerContext, *, state: str, code: str
) -> None:
    if not configured():
        raise fastapi.HTTPException(503, "LinkedIn publishing is not configured.")
    await _bind(session, owner)
    now = datetime.datetime.now(datetime.UTC)
    claimed = await session.execute(
        sa.update(models.PublishingAuthorization)
        .where(
            models.PublishingAuthorization.id == hashlib.sha256(state.encode()).hexdigest(),
            models.PublishingAuthorization.owner_id == owner.owner_id,
            models.PublishingAuthorization.actor_id == owner.actor_id,
            models.PublishingAuthorization.expires_at > now,
            models.PublishingAuthorization.used_at.is_(None),
        )
        .values(used_at=now)
    )
    await session.commit()
    if claimed.rowcount != 1:
        raise fastapi.HTTPException(
            400, "The connection request expired or was already used. Start again from Studio."
        )
    settings = app.settings.get_settings()
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                },
            )
            response.raise_for_status()
            token = response.json()
            access_token = token["access_token"]
            expires_in = int(token["expires_in"])
            if not isinstance(access_token, str) or not access_token or expires_in <= 0:
                raise ValueError("Invalid authorization response")
            granted = token.get("scope")
            if (
                granted is not None
                and "w_member_social" not in str(granted).replace(",", " ").split()
            ):
                raise ValueError("Publishing permission was not granted")
            profile = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile.raise_for_status()
            identity = profile.json()
            person = identity["sub"]
            if not isinstance(person, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", person):
                raise ValueError("Invalid member identity")
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        raise fastapi.HTTPException(
            502, "LinkedIn could not complete the connection. Start again from Studio."
        ) from None
    sealed = (
        cryptography.fernet.Fernet(settings.PUBLISHING_TOKEN_KEY.encode())
        .encrypt(access_token.encode())
        .decode()
    )
    row = await _connection(session, owner)
    if row is None:
        row = models.PublishingConnection(
            owner_id=owner.owner_id, actor_id=owner.actor_id, platform="linkedin"
        )
        session.add(row)
    row.person_id = person
    row.display_name = str(identity.get("name") or "LinkedIn account")[:256]
    row.token_sealed = sealed
    row.expires_at = now + datetime.timedelta(seconds=expires_in)
    await session.commit()


async def disconnect(
    session: sqlalchemy.ext.asyncio.AsyncSession, owner: auth.OwnerContext
) -> None:
    auth.ensure_write_scope(owner)
    await _bind(session, owner)
    for model in (models.PublishingConnection, models.PublishingAuthorization):
        await session.execute(
            sa.delete(model).where(
                model.owner_id == owner.owner_id, model.actor_id == owner.actor_id
            )
        )
    await session.commit()


async def _release(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: auth.OwnerContext,
    work_id: str,
    number: int,
):
    auth.ensure_write_scope(owner)
    work = await app.domains.academy.service.get_work(
        session, work_id=work_id, actor_id=owner.actor_id
    )
    await app.domains.academy.policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=owner.actor_id,
        action="release",
        program_id=work.program_id,
    )
    row = await app.domains.academy.service.delivery_release(
        session, work_id=work_id, number=number
    )
    if work.kind != "essay" or row.withdrawn_at is not None:
        raise fastapi.HTTPException(
            409, "Only a current public writing release can be distributed."
        )
    return row


def copy_read(row: models.DistributionCopy) -> dict:
    stale = row.status == "sending" and _utc(row.approved_at) < datetime.datetime.now(
        datetime.UTC
    ) - datetime.timedelta(minutes=1)
    return {
        "platform": row.platform,
        "status": "needs_review" if stale else row.status,
        "external_url": row.external_url,
        "error_code": "outcome_unknown" if stale else row.error_code,
    }


async def copies(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: auth.OwnerContext,
    work_id: str,
    number: int,
) -> list[dict]:
    release = await _release(session, owner, work_id, number)
    await _bind(session, owner)
    rows = (
        (
            await session.execute(
                sa.select(models.DistributionCopy).where(
                    models.DistributionCopy.owner_id == owner.owner_id,
                    models.DistributionCopy.actor_id == owner.actor_id,
                    models.DistributionCopy.release_id == release.release_id,
                )
            )
        )
        .scalars()
        .all()
    )
    return [copy_read(row) for row in rows]


def native_url(work_id: str, number: int) -> str:
    base = app.settings.get_settings().FRONTEND_URL.rstrip("/")
    return f"{base}/writing/{urllib.parse.quote(work_id, safe='')}/releases/{number}"


async def share_linkedin(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: auth.OwnerContext,
    work_id: str,
    number: int,
) -> dict:
    release = await _release(session, owner, work_id, number)
    connection = await _connection(session, owner)
    if (
        not configured()
        or connection is None
        or _utc(connection.expires_at) <= datetime.datetime.now(datetime.UTC)
    ):
        raise fastapi.HTTPException(409, "Connect LinkedIn before sharing this released piece.")
    try:
        token = (
            cryptography.fernet.Fernet(app.settings.get_settings().PUBLISHING_TOKEN_KEY.encode())
            .decrypt(connection.token_sealed.encode())
            .decode()
        )
    except (cryptography.fernet.InvalidToken, ValueError):
        raise fastapi.HTTPException(
            409, "Reconnect LinkedIn before sharing this released piece."
        ) from None
    url = native_url(work_id, number)
    text = "\n\n".join(value for value in (release.title, release.summary, url) if value)
    payload = {
        "author": f"urn:li:person:{connection.person_id}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "ARTICLE",
                "media": [
                    {"status": "READY", "originalUrl": url, "title": {"text": release.title}}
                ],
            },
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    lookup = sa.select(models.DistributionCopy).where(
        models.DistributionCopy.owner_id == owner.owner_id,
        models.DistributionCopy.actor_id == owner.actor_id,
        models.DistributionCopy.release_id == release.release_id,
        models.DistributionCopy.platform == "linkedin",
    )
    row = (await session.execute(lookup)).scalar_one_or_none()
    if row:
        # Even an unknown outcome is never automatically sent twice. A failed
        # definite rejection requires a fresh, explicit author action.
        if row.status != "failed":
            return copy_read(row)
        claim = await session.execute(
            sa.update(models.DistributionCopy)
            .where(
                models.DistributionCopy.id == row.id,
                models.DistributionCopy.owner_id == owner.owner_id,
                models.DistributionCopy.status == "failed",
            )
            .values(
                status="sending",
                error_code=None,
                payload_hash=digest,
                approved_at=datetime.datetime.now(datetime.UTC),
            )
        )
        await session.commit()
        if claim.rowcount != 1:
            raise fastapi.HTTPException(409, "Another sharing request is already running.")
        row.status = "sending"
        row.error_code = None
    else:
        row = models.DistributionCopy(
            owner_id=owner.owner_id,
            actor_id=owner.actor_id,
            release_id=release.release_id,
            platform="linkedin",
            status="sending",
            payload_hash=digest,
            approved_at=datetime.datetime.now(datetime.UTC),
        )
        session.add(row)
        try:
            await session.commit()
        except sqlalchemy.exc.IntegrityError:
            await session.rollback()
            await _bind(session, owner)
            existing = (await session.execute(lookup)).scalar_one()
            return copy_read(existing)
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.post(
                "https://api.linkedin.com/v2/ugcPosts",
                json=payload,
                headers={"Authorization": f"Bearer {token}", "X-Restli-Protocol-Version": "2.0.0"},
            )
        post_id = response.headers.get("X-RestLi-Id", "")
        if response.status_code == 201 and re.fullmatch(r"urn:li:(?:share|ugcPost):\d+", post_id):
            row.status = "published"
            row.external_url = f"https://www.linkedin.com/feed/update/{post_id}/"
        elif 400 <= response.status_code < 500:
            row.status = "failed"
            row.error_code = "linkedin_rejected"
        else:
            row.status = "needs_review"
            row.error_code = "outcome_unknown"
    except httpx.HTTPError:
        row.status = "needs_review"
        row.error_code = "outcome_unknown"
    await _bind(session, owner)
    await session.commit()
    return copy_read(row)


async def record_copy(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: auth.OwnerContext,
    work_id: str,
    number: int,
    *,
    platform: str,
    url: str,
) -> dict:
    release = await _release(session, owner, work_id, number)
    try:
        parsed = urllib.parse.urlsplit(url)
        host = (parsed.hostname or "").lower()
        port = parsed.port
    except ValueError:
        raise fastapi.HTTPException(
            422, "Use a valid HTTPS address for the published piece."
        ) from None
    domain = {"linkedin": "linkedin.com", "substack": "substack.com", "medium": "medium.com"}[
        platform
    ]
    if (
        parsed.scheme != "https"
        or parsed.username
        or parsed.password
        or port not in (None, 443)
        or not (host == domain or host.endswith("." + domain))
        or parsed.path in ("", "/")
        or any(character.isspace() for character in url)
    ):
        raise fastapi.HTTPException(
            422, "Use the HTTPS address of the published piece on the selected platform."
        )
    await _bind(session, owner)
    row = (
        await session.execute(
            sa.select(models.DistributionCopy).where(
                models.DistributionCopy.owner_id == owner.owner_id,
                models.DistributionCopy.actor_id == owner.actor_id,
                models.DistributionCopy.release_id == release.release_id,
                models.DistributionCopy.platform == platform,
            )
        )
    ).scalar_one_or_none()
    if row and copy_read(row)["status"] == "sending":
        raise fastapi.HTTPException(
            409, "A sharing request is running. Wait for it to finish before recording a link."
        )
    if row is None:
        row = models.DistributionCopy(
            owner_id=owner.owner_id,
            actor_id=owner.actor_id,
            release_id=release.release_id,
            platform=platform,
        )
        session.add(row)
    row.status = "recorded"
    row.external_url = url
    row.error_code = None
    row.payload_hash = hashlib.sha256(url.encode()).hexdigest()
    row.approved_at = datetime.datetime.now(datetime.UTC)
    await session.commit()
    return copy_read(row)
