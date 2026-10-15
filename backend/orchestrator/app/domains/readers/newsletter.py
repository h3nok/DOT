"""AMM editions reference released writing; email is a separate deliberate action."""

from __future__ import annotations

import asyncio
import datetime as dt
import hashlib
import html
import json
import urllib.parse

import fastapi
import markdown_it
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import app.auth.dependencies as auth
import app.core.contact as contact
import app.db.models as db
import app.domains.academy.evidence_charts as charts
import app.domains.academy.policy as policy
import app.domains.academy.service as academy
import app.domains.readers.mail as mail
import app.domains.readers.models as models
import app.integrations.object_store as objects

TITLE = mail.PUBLICATION_NAME


def require_editor(owner: auth.OwnerContext) -> None:
    if owner.role != "admin" and (owner.role != "owner" or "owner:write" not in owner.scopes):
        raise fastapi.HTTPException(403, "Newsletter delivery belongs to the site owner.")


def now() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


def utc(value: dt.datetime) -> dt.datetime:
    return value if value.tzinfo else value.replace(tzinfo=dt.UTC)


async def released(session: AsyncSession, work_id: str, number: int):
    row = await academy.delivery_release(session, work_id=work_id, number=number)
    if (
        row.withdrawn_at
        or row.kind != "essay"
        or row.manifest.get("presentation", {}).get("series") != TITLE
    ):
        raise fastapi.HTTPException(409, "Choose a public AMM edition that has not been withdrawn.")
    return row


def eligible():
    suppression = sa.orm.aliased(db.ReaderSubscription)
    any_suppressed = sa.exists(
        sa.select(suppression.id).where(
            suppression.email_hash == db.ReaderSubscription.email_hash,
            suppression.suppressed_at.is_not(None),
        )
    )
    return (
        db.ReaderSubscription.publication == "amm",
        db.ReaderSubscription.confirmed_at.is_not(None),
        db.ReaderSubscription.unsubscribed_at.is_(None),
        db.ReaderSubscription.suppressed_at.is_(None),
        ~any_suppressed,
    )


async def read_campaign(session: AsyncSession, campaign: models.NewsletterCampaign) -> dict:
    counts = dict(
        (
            await session.execute(
                sa.select(models.NewsletterDelivery.state, sa.func.count())
                .where(models.NewsletterDelivery.campaign_id == campaign.id)
                .group_by(models.NewsletterDelivery.state)
            )
        ).all()
    )
    # A process interruption after the provider call is never labelled unsent.
    stale = (
        await session.scalar(
            sa.select(sa.func.count())
            .select_from(models.NewsletterDelivery)
            .where(
                models.NewsletterDelivery.campaign_id == campaign.id,
                models.NewsletterDelivery.state == "sending",
                models.NewsletterDelivery.attempted_at < now() - dt.timedelta(minutes=2),
            )
        )
        or 0
    )
    if stale:
        counts["sending"] = counts.get("sending", 0) - stale
        counts["needs_review"] = counts.get("needs_review", 0) + stale
    audience = (
        await session.scalar(
            sa.select(sa.func.count()).select_from(db.ReaderSubscription).where(*eligible())
        )
        or 0
    )
    return {
        "id": campaign.id,
        "work_id": campaign.work_id,
        "release_number": campaign.release_number,
        "title": campaign.envelope["title"],
        "payload_hash": campaign.payload_hash,
        "approved_at": campaign.approved_at,
        "cancelled_at": campaign.cancelled_at,
        "counts": counts,
        "eligible_readers": audience,
        "envelope": campaign.envelope,
    }


async def get_campaign(session: AsyncSession, identity: str, *, lock: bool = False):
    query = sa.select(models.NewsletterCampaign).where(models.NewsletterCampaign.id == identity)
    row = await session.scalar(query.with_for_update() if lock else query)
    if not row:
        raise fastapi.HTTPException(404, "Newsletter edition not found.")
    return row


async def prepare(
    session: AsyncSession, owner: auth.OwnerContext, work_id: str, number: int
) -> dict:
    require_editor(owner)
    work = await academy.get_work(session, work_id=work_id, actor_id=owner.actor_id)
    await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=owner.actor_id,
        action="release",
        program_id=work.program_id,
    )
    row = await released(session, work_id, number)
    # Lock the immutable public projection to serialize duplicate preparation.
    await session.execute(
        sa.select(type(row)).where(type(row).release_id == row.release_id).with_for_update()
    )
    campaign = await session.scalar(
        sa.select(models.NewsletterCampaign)
        .where(
            models.NewsletterCampaign.release_id == row.release_id,
            models.NewsletterCampaign.publication == "amm",
        )
        .with_for_update()
    )
    if campaign and campaign.approved_at:
        return await read_campaign(session, campaign)
    body = await objects.get_object_store().get_text(row.body_ref)
    if hashlib.sha256(body.encode()).hexdigest() != row.manifest["revision"]["content_hash"]:
        raise fastapi.HTTPException(409, "The released manuscript failed its integrity check.")
    if len(body.encode()) > 250_000:
        raise fastapi.HTTPException(
            422, "This edition is too long for email. Prepare a shorter released letter."
        )
    cfg = mail.configuration()
    url = f"{cfg['site']}/writing/{work_id}/releases/{number}"
    parser = markdown_it.MarkdownIt("commonmark", {"html": False}).enable("table")

    # Email does not embed external images. The designed edition and artwork
    # remain one deliberate click away, with no remote image request on open.
    def image_rule(tokens, index, options, env):
        return (
            "<span>[Image: " + html.escape(tokens[index].content) + " — see the web edition]</span>"
        )

    parser.renderer.rules["image"] = image_rule
    original_fence = parser.renderer.rules["fence"]

    def fence_rule(tokens, index, options, env):
        if tokens[index].info.strip() == "evidence-chart":
            return charts.render_html(tokens[index].content)
        return original_fence(tokens, index, options, env)

    parser.renderer.rules["fence"] = fence_rule

    def link_rule(tokens, index, options, env):
        token = tokens[index]
        href = token.attrGet("href") or ""
        if href.startswith("#"):
            token.attrSet("href", url + href)
        elif not urllib.parse.urlsplit(href).scheme:
            token.attrSet("href", urllib.parse.urljoin(cfg["site"] + "/", href))
        return parser.renderer.renderToken(tokens, index, options, env)

    parser.renderer.rules["link_open"] = link_rule
    sources = [source.get("external_uri", "") for source in row.manifest.get("sources", [])]
    source_text = "\n\nSources\n" + "\n".join(sources) if sources else ""
    source_html = (
        "<h2>Sources</h2><ul>"
        + "".join(f"<li>{html.escape(source)}</li>" for source in sources)
        + "</ul>"
        if sources
        else ""
    )
    envelope = {
        **cfg,
        "title": row.title,
        "subject": f"AMM · {row.title}",
        "url": url,
        "html": (
            '<article style="max-width:640px;margin:0 auto;font:17px/1.7 Georgia,serif;'
            'color:#232525;background:#f6f1e7;padding:24px;overflow-wrap:anywhere">'
            '<header style="border-bottom:2px solid #232525;padding-bottom:20px">'
            '<span style="display:inline-block;font:bold 28px/1 sans-serif;'
            'letter-spacing:-1px;color:#a73524">AMM</span>'
            f'<p style="font:12px/1.6 sans-serif;letter-spacing:1px">{TITLE.upper()}</p>'
            "</header>"
            f"<h1>{html.escape(row.title)}</h1><p>By Henok Ghebrechristos · Version {number}</p>"
            f'<p><a href="{html.escape(url, quote=True)}">Read this edition on the website</a></p>'
            f"{parser.render(body)}{source_html}<hr /><p>End of edition.</p></article>"
        ),
        "text": (
            f"{TITLE}\n\n{row.title}\nBy Henok Ghebrechristos · Version {number}"
            f"\n\nRead on the website: {url}\n\n"
            f"{charts.plain_text(body)}{source_text}\n\nEnd of edition."
        ),
    }
    digest = hashlib.sha256(json.dumps(envelope, sort_keys=True).encode()).hexdigest()
    if len(envelope["html"].encode()) > 90_000:
        raise fastapi.HTTPException(
            422, "The rendered email is too long. Publish a shorter letter for email delivery."
        )
    if campaign is None:
        campaign = models.NewsletterCampaign(
            publication="amm",
            release_id=row.release_id,
            work_id=work_id,
            release_number=number,
            envelope=envelope,
            payload_hash=digest,
        )
        session.add(campaign)
    else:
        campaign.envelope, campaign.payload_hash = envelope, digest
    await session.commit()
    return await read_campaign(session, campaign)


async def approve(
    session: AsyncSession, owner: auth.OwnerContext, identity: str, payload_hash: str
) -> dict:
    require_editor(owner)
    readiness = await mail.readiness()
    if not readiness["ready"]:
        raise fastapi.HTTPException(503, readiness["reason"])
    campaign = await get_campaign(session, identity, lock=True)
    await released(session, campaign.work_id, campaign.release_number)
    if campaign.payload_hash != payload_hash:
        raise fastapi.HTTPException(
            409, "The email changed. Open its preview again before approving."
        )
    if campaign.cancelled_at:
        raise fastapi.HTTPException(409, "This mailing has been cancelled.")
    if not campaign.approved_at:
        if any(campaign.envelope.get(key) != value for key, value in mail.configuration().items()):
            raise fastapi.HTTPException(409, "Sender settings changed. Prepare the preview again.")
        campaign.approved_by, campaign.approved_at = owner.actor_id, now()
        # Freeze recipient identities once; new subscribers never receive an
        # old edition as a side effect of resuming an interrupted send.
        ids = await session.scalars(sa.select(db.ReaderSubscription.id).where(*eligible()))
        session.add_all(
            [
                models.NewsletterDelivery(
                    campaign_id=campaign.id, subscription_id=identity, state="pending"
                )
                for identity in ids
            ]
        )
        await session.commit()
    return await read_campaign(session, campaign)


def message(campaign: models.NewsletterCampaign, subscriber: db.ReaderSubscription) -> dict:
    envelope = campaign.envelope
    token = contact.derive_unsubscribe_token(subscriber.id)
    # Refresh the hash after key rotation when this capability is re-issued.
    subscriber.unsubscribe_token_hash = contact.token_fingerprint(token)
    leave = f"{envelope['site']}/readers/leave?publication=amm#{token}"
    all_leave = f"{envelope['site']}/readers/leave?publication=all&scope=all#{token}"
    one_click = f"{envelope['api']}/v1/newsletters/one-click?token={token}"
    footer = (
        f"You subscribed to {TITLE}.\n{envelope['postal_address']}"
        f"\nReply: {envelope['reply_to']}\nUnsubscribe from AMM: {leave}"
        f"\nLeave all writing lists: {all_leave}"
    )
    footer_html = (
        '<footer style="max-width:640px;margin:auto;padding:24px;font:12px/1.7 sans-serif">'
        f"You subscribed to {TITLE}.<br />{html.escape(envelope['postal_address'])}<br />"
        f'<a href="{html.escape(leave, quote=True)}">Unsubscribe from AMM</a> · '
        f'<a href="{html.escape(all_leave, quote=True)}">Leave all writing lists</a></footer>'
    )
    return {
        "from": envelope["from"],
        "reply_to": envelope["reply_to"],
        "to": [contact.open_sealed(subscriber.email_sealed)],
        "subject": envelope["subject"],
        "html": envelope["html"] + footer_html,
        "text": envelope["text"] + "\n\n" + footer,
        "tags": [{"name": "publication", "value": "amm"}],
        "headers": {
            "List-Unsubscribe": f"<{one_click}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    }


async def dispatch(session: AsyncSession, owner: auth.OwnerContext, identity: str) -> dict:
    require_editor(owner)
    readiness = await mail.readiness()
    if not readiness["ready"]:
        raise fastapi.HTTPException(503, readiness["reason"])
    campaign = await get_campaign(session, identity)
    if not campaign.approved_at or campaign.cancelled_at:
        raise fastapi.HTTPException(409, "This mailing is not approved for delivery.")
    await released(session, campaign.work_id, campaign.release_number)
    # A bounded batch fits a request. Records survive page closure/process loss.
    # There is no unsupervised background mailing or unbounded request loop.
    candidates = list(
        await session.scalars(
            sa.select(models.NewsletterDelivery.id)
            .where(
                models.NewsletterDelivery.campaign_id == identity,
                models.NewsletterDelivery.state == "pending",
            )
            .order_by(models.NewsletterDelivery.id)
            .limit(5)
        )
    )
    for delivery_id in candidates:
        await session.refresh(campaign)
        if campaign.cancelled_at:
            break
        await released(session, campaign.work_id, campaign.release_number)
        claimed = await session.execute(
            sa.update(models.NewsletterDelivery)
            .where(
                models.NewsletterDelivery.id == delivery_id,
                models.NewsletterDelivery.state == "pending",
            )
            .values(state="sending", attempted_at=now())
            .returning(models.NewsletterDelivery.subscription_id)
        )
        subscription_id = claimed.scalar_one_or_none()
        if not subscription_id:
            continue
        subscriber = await session.scalar(
            sa.select(db.ReaderSubscription)
            .where(db.ReaderSubscription.id == subscription_id, *eligible())
            .execution_options(populate_existing=True)
        )
        delivery = await session.get(models.NewsletterDelivery, delivery_id)
        if not subscriber:
            delivery.state = "skipped"
            await session.commit()
            continue
        payload = message(campaign, subscriber)
        if not payload["to"][0]:
            delivery.state, delivery.error_code = "rejected", "address_unavailable"
            await session.commit()
            continue
        # Persist the claim BEFORE calling the provider. A lost response stays
        # held for review and is never retried as a fresh send.
        await session.commit()
        state, provider_id = await mail.deliver(payload, delivery_id)
        delivery.state, delivery.provider_id = state, provider_id
        delivery.error_code = (
            "provider_rejected"
            if state == "rejected"
            else "outcome_unknown"
            if state == "needs_review"
            else None
        )
        await session.commit()
        if state != "accepted":
            break
        await asyncio.sleep(0.6)
    return await read_campaign(session, campaign)


async def cancel(session: AsyncSession, owner: auth.OwnerContext, identity: str) -> dict:
    require_editor(owner)
    campaign = await get_campaign(session, identity, lock=True)
    campaign.cancelled_at = campaign.cancelled_at or now()
    await session.execute(
        sa.update(models.NewsletterDelivery)
        .where(
            models.NewsletterDelivery.campaign_id == identity,
            models.NewsletterDelivery.state == "pending",
        )
        .values(state="skipped", error_code="cancelled")
    )
    await session.commit()
    return await read_campaign(session, campaign)


async def retry_rejected(session: AsyncSession, owner: auth.OwnerContext, identity: str) -> dict:
    require_editor(owner)
    campaign = await get_campaign(session, identity, lock=True)
    if not campaign.approved_at or campaign.cancelled_at:
        raise fastapi.HTTPException(409, "This mailing is not approved for delivery.")
    await released(session, campaign.work_id, campaign.release_number)
    await session.execute(
        sa.update(models.NewsletterDelivery)
        .where(
            models.NewsletterDelivery.campaign_id == identity,
            models.NewsletterDelivery.state == "rejected",
            models.NewsletterDelivery.provider_id.is_(None),
        )
        .values(state="pending", error_code=None)
    )
    await session.commit()
    return await read_campaign(session, campaign)


async def callback(session: AsyncSession, identity: str, event: dict) -> None:
    kinds = {
        "email.delivered": "delivered",
        "email.bounced": "bounced",
        "email.complained": "complained",
        "email.suppressed": "suppressed",
        "email.failed": "rejected",
    }
    event_type = event.get("type")
    kind = kinds.get(event_type) if isinstance(event_type, str) else None
    if not kind or await session.get(models.NewsletterEvent, identity):
        return
    data = event.get("data")
    provider_id = data.get("email_id") if isinstance(data, dict) else None
    if not isinstance(provider_id, str) or len(provider_id) > 128:
        raise fastapi.HTTPException(400, "Invalid delivery callback.")
    row = await session.scalar(
        sa.select(models.NewsletterDelivery)
        .where(models.NewsletterDelivery.provider_id == provider_id)
        .with_for_update()
    )
    if row is None:
        # The provider account also handles OTP and contact mail. Acknowledge
        # those events without storing their recipients or repeatedly retrying.
        tags = data.get("tags")
        if not isinstance(tags, dict) or tags.get("publication") != "amm":
            return
        # May precede persistence of the send response. Ask the provider to
        # retry, so a fast bounce cannot disappear before suppression is saved.
        raise fastapi.HTTPException(503, "Delivery receipt not available yet.")
    if await session.get(models.NewsletterEvent, identity):
        return
    if row.state not in {"bounced", "complained", "suppressed"}:
        row.state = kind
    if kind in {"bounced", "complained", "suppressed"}:
        subscriber = await session.get(db.ReaderSubscription, row.subscription_id)
        await session.execute(
            sa.update(db.ReaderSubscription)
            .where(db.ReaderSubscription.email_hash == subscriber.email_hash)
            .values(suppressed_at=now())
        )
    session.add(models.NewsletterEvent(id=identity))
    # Retain dedupe ids only for the provider retry horizon, no event payloads.
    await session.execute(
        sa.delete(models.NewsletterEvent).where(
            models.NewsletterEvent.received_at < now() - dt.timedelta(days=30)
        )
    )
    await session.commit()
