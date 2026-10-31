"""The reader list — the open door (ADR-0025).

`app.domains.join` decides nothing about admission and neither does this, but
for the opposite reason: there is nothing here to be admitted to. Someone read
Book One and wants to know when there is more. That is the whole relationship,
and it must stay separable from membership — the two tables are never joined.

Three rules the endpoints below are built around:

* **Confirmed or it does not exist.** A row without `confirmed_at` is never sent
  to and never counted. Without that, the list is a list of addresses anyone can
  put anyone else on.
* **The address is sealed, never plain** (ADR-0007). No key, no subscriptions —
  the endpoint refuses rather than holding an address it promised to protect.
* **Leaving is free.** The unsubscribe token is derived, needs no session, and
  the endpoint answers identically whether or not it matched, so it can never be
  used to test whether an address is on the list.
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


def _purpose(publication: str, include_all: bool) -> str:
    # The OTP is bound to the consent shown before sending it. It cannot be
    # replayed to broaden a subscription, sign in, or request membership.
    return "reader" if publication == "all" else "reader_amm_all" if include_all else "reader_amm"


def readers_available() -> bool:
    """Only open when addresses can be sealed and confirmation can be delivered."""
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    environment = os.environ.get("ORCHESTRATOR_ENVIRONMENT", "development")
    delivery_available = bool(api_key and api_key != "disabled") or environment not in {
        "production",
        "staging",
    }
    return app.core.contact.sealing_available() and delivery_available


async def subscribe(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    email: str,
    source: str,
    *,
    publication: str = "all",
    include_all: bool = False,
) -> dict:
    """Record the address unconfirmed and send a code that proves it."""
    if not readers_available():
        # Fail closed, exactly as the join queue and the support plane do.
        return {"ok": False, "error": "The reader list is not open yet.", "status": 503}

    email_hash = app.core.contact.blind_index(email)
    now = _now()
    purpose = _purpose(publication, include_all)

    recent = await session.scalar(
        sqlalchemy.select(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.purpose.in_(["reader", "reader_amm", "reader_amm_all"]),
        )
        .order_by(app.db.models.OtpCode.created_at.desc())
        .limit(1)
    )
    if recent:
        elapsed = (now - app.domains.auth.service.as_utc(recent.created_at)).total_seconds()
        if elapsed < _RESEND_COOLDOWN_SECONDS:
            wait = int(_RESEND_COOLDOWN_SECONDS - elapsed)
            return {
                "ok": False,
                "error": f"Please wait {wait}s before asking for another code.",
                "status": 429,
            }

    existing = await session.scalar(
        sqlalchemy.select(app.db.models.ReaderSubscription).where(
            app.db.models.ReaderSubscription.email_hash == email_hash,
            app.db.models.ReaderSubscription.publication == publication,
        )
    )
    if existing:
        # Subscribing again is not a second subscription, and saying "you are
        # already on the list" would leak that the address is known to anyone
        # who can type it. Refresh quietly; confirmation decides the rest.
        existing.email_sealed = app.core.contact.seal(email)
    else:
        # The id is minted here rather than at flush because the unsubscribe
        # fingerprint is derived from it and the column is NOT NULL.
        subscription_id = app.db.models.make_id("reader")
        token = app.core.contact.derive_unsubscribe_token(subscription_id)
        session.add(
            app.db.models.ReaderSubscription(
                id=subscription_id,
                email_hash=email_hash,
                email_sealed=app.core.contact.seal(email),
                unsubscribe_token_hash=app.core.contact.token_fingerprint(token),
                source=source,
                publication=publication,
            )
        )

    await session.execute(
        sqlalchemy.update(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.purpose.in_(["reader", "reader_amm", "reader_amm_all"]),
        )
        .values(used_at=now)
    )

    code = f"{secrets.randbelow(1_000_000):06d}"
    session.add(
        app.db.models.OtpCode(
            email_hash=email_hash,
            code_hash=bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode(),
            purpose=purpose,
            expires_at=now + datetime.timedelta(seconds=_CODE_TTL_SECONDS),
        )
    )
    await session.commit()

    sent = await app.domains.auth.service.send_code_email(email, code, purpose=purpose)
    if not sent:
        return {"ok": False, "error": "Could not send the code. Try again.", "status": 502}

    result: dict = {"ok": True, "expires_in": _CODE_TTL_SECONDS}
    if os.environ.get("RESEND_API_KEY", "").strip() in {"", "disabled"}:
        result["dev_code"] = code
    return result


async def confirm(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    email: str,
    code: str,
    *,
    publication: str = "all",
    include_all: bool = False,
) -> dict:
    """Complete the double opt-in. Never mints a session — this is not a sign-in."""
    email_hash = app.core.contact.blind_index(email)
    now = _now()

    record = await session.scalar(
        sqlalchemy.select(app.db.models.OtpCode)
        .where(
            app.db.models.OtpCode.email_hash == email_hash,
            app.db.models.OtpCode.used_at.is_(None),
            app.db.models.OtpCode.expires_at > now,
            app.db.models.OtpCode.purpose == _purpose(publication, include_all),
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
    row = await session.scalar(
        sqlalchemy.select(app.db.models.ReaderSubscription).where(
            app.db.models.ReaderSubscription.email_hash == email_hash,
            app.db.models.ReaderSubscription.publication == publication,
        )
    )
    if not row:
        return {"ok": False, "error": "That subscription is no longer open.", "status": 404}

    row.confirmed_at = row.confirmed_at or now
    # Someone who left and came back is subscribed again, not permanently barred
    # by their own earlier decision.
    row.unsubscribed_at = None
    row.unsubscribe_token_hash = app.core.contact.token_fingerprint(
        app.core.contact.derive_unsubscribe_token(row.id)
    )
    if publication == "amm" and include_all:
        general = await session.scalar(
            sqlalchemy.select(app.db.models.ReaderSubscription).where(
                app.db.models.ReaderSubscription.email_hash == email_hash,
                app.db.models.ReaderSubscription.publication == "all",
            )
        )
        if general is None:
            identity = app.db.models.make_id("reader")
            general = app.db.models.ReaderSubscription(
                id=identity,
                email_hash=email_hash,
                email_sealed=app.core.contact.seal(email),
                publication="all",
                source="amm",
                unsubscribe_token_hash=app.core.contact.token_fingerprint(
                    app.core.contact.derive_unsubscribe_token(identity)
                ),
            )
            session.add(general)
        general.confirmed_at = general.confirmed_at or now
        general.unsubscribed_at = None
    await session.commit()

    return {"ok": True, "unsubscribe_token": app.core.contact.derive_unsubscribe_token(row.id)}


async def unsubscribe(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    token: str,
    *,
    all_publications: bool = False,
) -> dict:
    """Leave the list. No session, no reason, no confirmation step.

    Always reports success. A token that matches nothing and a token that
    matched are indistinguishable from outside, so this cannot be used to test
    whether an address is on the list.
    """
    row = await session.scalar(
        sqlalchemy.select(app.db.models.ReaderSubscription).where(
            app.db.models.ReaderSubscription.unsubscribe_token_hash
            == app.core.contact.token_fingerprint(token)
        )
    )
    if row:
        if all_publications:
            await session.execute(
                sqlalchemy.update(app.db.models.ReaderSubscription)
                .where(app.db.models.ReaderSubscription.email_hash == row.email_hash)
                .values(unsubscribed_at=_now())
            )
        elif row.unsubscribed_at is None:
            row.unsubscribed_at = _now()
        await session.commit()
    return {"ok": True}


async def remove_reader(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    reader_id: str,
) -> bool:
    """The steward takes one subscription off the list, as the reader's own link would."""
    row = await session.get(app.db.models.ReaderSubscription, reader_id)
    if row is None:
        return False
    row.unsubscribed_at = row.unsubscribed_at or _now()
    await session.commit()
    return True


async def list_readers(
    session: sqlalchemy.ext.asyncio.AsyncSession,
) -> list[dict]:
    """The list, for the steward's sending tool. Confirmed and still subscribed.

    Each row carries a freshly derived unsubscribe token so every message can
    include a working link without the server ever having stored one.
    """
    rows = (
        await session.scalars(
            sqlalchemy.select(app.db.models.ReaderSubscription)
            .where(
                app.db.models.ReaderSubscription.confirmed_at.is_not(None),
                app.db.models.ReaderSubscription.unsubscribed_at.is_(None),
            )
            .order_by(app.db.models.ReaderSubscription.created_at.asc())
        )
    ).all()

    return [
        {
            "id": row.id,
            # An unopenable row is shown rather than hidden: losing the key must
            # be visible to the steward, not silently shrink the list.
            "email": app.core.contact.open_sealed(row.email_sealed),
            "source": row.source,
            "publication": row.publication,
            "confirmed_at": row.confirmed_at,
            "created_at": row.created_at,
            "unsubscribe_token": app.core.contact.derive_unsubscribe_token(row.id),
        }
        for row in rows
    ]
