"""A purpose-limited, sealed inbox for the founder. No automatic visitor emails."""

from __future__ import annotations

import datetime
import hashlib
import hmac
import json
import os

import fastapi
import httpx
import sqlalchemy as sa
import sqlalchemy.ext.asyncio as sqlasync

import app.auth.dependencies as auth
import app.core.contact as sealing
import app.core.tenancy
import app.domains.contact.models as models
import app.domains.contact.schemas as schemas
import app.settings

LABELS = {
    "project": "Project discussion",
    "collaboration": "Collaboration",
    "writing": "Writing and inquiry",
    "speaking": "Speaking and media",
    "general": "General message",
    "privacy": "Privacy and data request",
}


def mail_available() -> bool:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    return bool(key and key != "disabled" and os.environ.get("EMAIL_FROM", "").strip())


def available() -> bool:
    settings = app.settings.get_settings()
    return bool(
        settings.CONTACT_EMAIL
        and sealing.sealing_available()
        and (mail_available() or settings.ENVIRONMENT not in {"production", "staging"})
    )


async def bind(session: sqlasync.AsyncSession) -> str:
    owner_id = app.settings.get_settings().CONTACT_OWNER_ID
    await app.core.tenancy.bind_tenant(session, owner_id)
    return owner_id


def require_steward(owner: auth.OwnerContext) -> None:
    settings = app.settings.get_settings()
    if settings.AUTH_MODE == "local_header" and owner.owner_id == settings.CONTACT_OWNER_ID:
        return
    if owner.role not in {"owner", "admin"}:
        raise fastapi.HTTPException(403, "This inbox belongs to the site owner.")
    if owner.role != "admin" and "owner:write" not in owner.scopes:
        raise fastapi.HTTPException(403, "Owner permission is required.")


def fingerprint(content: str) -> str:
    key = os.environ.get("JOIN_CONTACT_KEY", "").strip()
    if not key:
        raise fastapi.HTTPException(503, "Messages are temporarily unavailable.")
    return hmac.new(key.encode(), f"contact:{content}".encode(), hashlib.sha256).hexdigest()


async def deliver(*, to: str, subject: str, text: str, reply_to: str, key: str) -> str | None:
    if not mail_available():
        return None
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {os.environ['RESEND_API_KEY']}",
                    "Idempotency-Key": key,
                },
                json={
                    "from": os.environ["EMAIL_FROM"],
                    "to": [to],
                    "reply_to": reply_to,
                    "subject": subject,
                    "text": text,
                },
            )
        if response.status_code in {200, 201}:
            value = response.json().get("id")
            return value if isinstance(value, str) and value else None
    except (httpx.HTTPError, ValueError):
        # No address, text, provider error body, or credential enters the logs.
        pass
    return None


def content_of(row: models.ContactInquiry) -> dict:
    content = sealing.open_sealed(row.content_sealed)
    if content is None:
        raise fastapi.HTTPException(503, "This message cannot currently be opened.")
    return json.loads(content)


def read_inquiry(row: models.ContactInquiry) -> dict:
    return {
        "id": row.id,
        "purpose": row.purpose,
        "status": row.status,
        "notification_status": row.notification_status,
        "created_at": row.created_at,
        **content_of(row),
    }


async def inquiry(session: sqlasync.AsyncSession, inquiry_id: str) -> models.ContactInquiry:
    owner_id = await bind(session)
    row = await session.scalar(
        sa.select(models.ContactInquiry).where(
            models.ContactInquiry.owner_id == owner_id, models.ContactInquiry.id == inquiry_id
        )
    )
    if row is None:
        raise fastapi.HTTPException(404, "Message not found.")
    return row


async def notify(session: sqlasync.AsyncSession, row: models.ContactInquiry) -> None:
    await bind(session)
    content = content_of(row)
    settings = app.settings.get_settings()
    text = "\n".join(
        [
            f"{LABELS[row.purpose]} · {row.id}",
            f"From: {content['name']} <{content['email']}>",
            f"Organization: {content['organization'] or 'Not supplied'}",
            f"Timeline: {content['timeline'] or 'Not supplied'}",
            f"Budget: {content['budget'] or 'Not supplied'}",
            "",
            content["message"],
            "",
            f"Open the private inbox: {settings.FRONTEND_URL.rstrip('/')}/studio/inbox",
        ]
    )
    provider_id = await deliver(
        to=settings.CONTACT_EMAIL,
        subject=f"Website inquiry: {LABELS[row.purpose]} · {row.id}",
        text=text,
        reply_to=content["email"],
        key=f"contact-notice/{row.id}",
    )
    row.notification_status = "accepted" if provider_id else "failed"
    await session.commit()


async def receive(session: sqlasync.AsyncSession, payload: schemas.InquiryIn, key: str) -> str:
    if not available():
        raise fastapi.HTTPException(503, "Messages are temporarily unavailable. Please use email.")
    if payload.website:
        return "received"
    owner_id = await bind(session)
    data = payload.model_dump(mode="json", exclude={"consent", "website", "purpose"})
    serialized = json.dumps(data, sort_keys=True, ensure_ascii=False)
    digest = fingerprint(f"{payload.purpose}:{serialized}")
    row = await session.scalar(
        sa.select(models.ContactInquiry).where(
            models.ContactInquiry.owner_id == owner_id,
            models.ContactInquiry.submission_key == key,
        )
    )
    if row:
        if row.payload_hash != digest:
            raise fastapi.HTTPException(
                409, "This submission reference belongs to a different message."
            )
        return row.id
    row = models.ContactInquiry(
        owner_id=owner_id,
        submission_key=key,
        payload_hash=digest,
        purpose=payload.purpose,
        content_sealed=sealing.seal(serialized),
    )
    session.add(row)
    try:
        await session.commit()
    except sa.exc.IntegrityError:
        await session.rollback()
        # A concurrent retry shares the same key; never create a second inquiry.
        return await receive(session, payload, key)
    await notify(session, row)
    return row.id


async def list_inquiries(session: sqlasync.AsyncSession, page: int, status: str | None) -> dict:
    owner_id = await bind(session)
    query = sa.select(models.ContactInquiry).where(models.ContactInquiry.owner_id == owner_id)
    if status:
        query = query.where(models.ContactInquiry.status == status)
    rows = (
        await session.scalars(
            query.order_by(models.ContactInquiry.created_at.desc(), models.ContactInquiry.id.desc())
            .offset((page - 1) * 20)
            .limit(21)
        )
    ).all()
    return {
        "messages": [read_inquiry(row) for row in rows[:20]],
        "has_more": len(rows) > 20,
        "page": page,
    }


async def detail(session: sqlasync.AsyncSession, inquiry_id: str) -> dict:
    row = await inquiry(session, inquiry_id)
    replies = (
        await session.scalars(
            sa.select(models.ContactReply)
            .where(
                models.ContactReply.owner_id == row.owner_id,
                models.ContactReply.inquiry_id == row.id,
            )
            .order_by(models.ContactReply.created_at, models.ContactReply.id)
        )
    ).all()
    return {
        **read_inquiry(row),
        "replies": [
            {
                "id": reply.id,
                "status": reply.status,
                "created_at": reply.created_at,
                "message": sealing.open_sealed(reply.body_sealed),
                "submission_key": reply.submission_key,
            }
            for reply in replies
        ],
    }


async def reply(session: sqlasync.AsyncSession, inquiry_id: str, message: str, key: str) -> dict:
    row = await inquiry(session, inquiry_id)
    if not mail_available():
        raise fastapi.HTTPException(503, "Email delivery is unavailable. No reply was sent.")
    content = content_of(row)
    digest = fingerprint(f"reply:{row.id}:{message}")
    record = await session.scalar(
        sa.select(models.ContactReply).where(
            models.ContactReply.owner_id == row.owner_id,
            models.ContactReply.submission_key == key,
        )
    )
    now = datetime.datetime.now(datetime.UTC)
    if record:
        if record.payload_hash != digest:
            raise fastapi.HTTPException(409, "This reply reference belongs to different text.")
        if record.status == "sent":
            return {"status": "sent", "id": record.id}
        first = (
            record.created_at.replace(tzinfo=datetime.UTC)
            if record.created_at.tzinfo is None
            else record.created_at
        )
        previous = (
            record.attempt_at.replace(tzinfo=datetime.UTC)
            if record.attempt_at.tzinfo is None
            else record.attempt_at
        )
        if now - first > datetime.timedelta(hours=23):
            raise fastapi.HTTPException(
                409, "This attempt needs a delivery check before it can be resent."
            )
        if record.status == "sending" and now - previous < datetime.timedelta(seconds=60):
            raise fastapi.HTTPException(
                409, "This reply is already being sent. Refresh before retrying."
            )
        changed = await session.execute(
            sa.update(models.ContactReply)
            .where(
                models.ContactReply.owner_id == row.owner_id,
                models.ContactReply.id == record.id,
                sa.or_(
                    models.ContactReply.status == "failed",
                    sa.and_(
                        models.ContactReply.status == "sending",
                        models.ContactReply.attempt_at < now - datetime.timedelta(seconds=60),
                    ),
                ),
            )
            .values(status="sending", attempt_at=now)
            .execution_options(synchronize_session=False)
        )
        if not changed.rowcount:
            raise fastapi.HTTPException(409, "Refresh this conversation before retrying.")
        record.status = "sending"
        record.attempt_at = now
    else:
        record = models.ContactReply(
            owner_id=row.owner_id,
            inquiry_id=row.id,
            submission_key=key,
            payload_hash=digest,
            body_sealed=sealing.seal(message),
            status="sending",
            attempt_at=now,
        )
        session.add(record)
    try:
        await session.commit()
    except sa.exc.IntegrityError:
        await session.rollback()
        raise fastapi.HTTPException(
            409, "This reply is already being sent. Refresh before retrying."
        ) from None
    provider_id = await deliver(
        to=content["email"],
        subject=f"Re: {LABELS[row.purpose]} · {row.id}",
        text=f"{message}\n\nHenok Ghebrechristos\n{app.settings.get_settings().FRONTEND_URL}",
        reply_to=app.settings.get_settings().CONTACT_EMAIL,
        key=f"contact-reply/{record.id}",
    )
    await bind(session)
    record.status = "sent" if provider_id else "failed"
    record.provider_id = provider_id
    if provider_id:
        row.status = "replied"
    await session.commit()
    return {"status": record.status, "id": record.id}


async def remove(session: sqlasync.AsyncSession, inquiry_id: str) -> None:
    row = await inquiry(session, inquiry_id)
    await session.execute(
        sa.delete(models.ContactReply).where(
            models.ContactReply.owner_id == row.owner_id,
            models.ContactReply.inquiry_id == row.id,
        )
    )
    await session.delete(row)
    await session.commit()
