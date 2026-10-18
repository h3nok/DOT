"""Narrow Resend transport: untracked mail and authenticated operational callbacks."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from email.utils import formataddr, parseaddr

import fastapi
import httpx

import app.core.contact as contact

PUBLICATION_NAME = "The American Millennial Manifesto"


def configuration() -> dict:
    address = parseaddr(os.environ.get("EMAIL_FROM", "").strip())[1]
    return {
        "from": formataddr((PUBLICATION_NAME, address)) if address else "",
        "reply_to": os.environ.get("NEWSLETTER_REPLY_TO", "henok@sullix.com").strip(),
        "postal_address": os.environ.get("NEWSLETTER_POSTAL_ADDRESS", "").strip(),
        "site": os.environ.get("NEWSLETTER_SITE_URL", "https://dotheory.org").rstrip("/"),
        "api": os.environ.get("NEWSLETTER_PUBLIC_API_URL", "").rstrip("/"),
    }


def missing_configuration() -> list[str]:
    missing = []
    for name in (
        "RESEND_API_KEY",
        "EMAIL_FROM",
        "NEWSLETTER_POSTAL_ADDRESS",
        "NEWSLETTER_PUBLIC_API_URL",
        "NEWSLETTER_RESEND_DOMAIN_ID",
        "NEWSLETTER_WEBHOOK_SECRET",
    ):
        if not os.environ.get(name, "").strip() or os.environ.get(name) == "disabled":
            missing.append(name)
    if not contact.sealing_available():
        missing.append("JOIN_CONTACT_KEY")
    if os.environ.get("NEWSLETTER_ENABLED") != "true":
        missing.append("NEWSLETTER_ENABLED")
    return missing


async def readiness() -> dict:
    missing = missing_configuration()
    if missing:
        return {
            "ready": False,
            "reason": "Newsletter delivery needs sender setup.",
            "missing": missing,
        }
    cfg = configuration()
    if not cfg["api"].startswith("https://") or not cfg["site"].startswith("https://"):
        return {
            "ready": False,
            "reason": "Newsletter links require public HTTPS addresses.",
            "missing": [],
        }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.resend.com/domains/" + os.environ["NEWSLETTER_RESEND_DOMAIN_ID"],
                headers={"Authorization": "Bearer " + os.environ["RESEND_API_KEY"]},
            )
        domain = response.json() if response.status_code == 200 else {}
    except (httpx.HTTPError, ValueError):
        domain = {}
    sender_domain = parseaddr(cfg["from"])[1].partition("@")[2].lower()
    ready = bool(
        sender_domain
        and domain.get("name") == sender_domain
        and domain.get("status") == "verified"
        and domain.get("open_tracking") is False
        and domain.get("click_tracking") is False
    )
    return {
        "ready": ready,
        "reason": None
        if ready
        else "Verify the sender domain and disable both open and click tracking in Resend.",
        "missing": [],
    }


async def deliver(payload: dict, identity: str) -> tuple[str, str | None]:
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": "Bearer " + os.environ["RESEND_API_KEY"],
                    "Idempotency-Key": "newsletter/" + identity,
                },
                json=payload,
            )
        if response.status_code in {200, 201}:
            identity = response.json().get("id")
            if isinstance(identity, str) and 0 < len(identity) <= 128:
                return "accepted", identity
        # Never replay an ambiguous accept. Resend's deduplication expires in
        # 24 hours. Even years later, an uncertain row remains held for review.
        if response.status_code in {400, 401, 403, 404, 422, 429}:
            return "rejected", None
    except (httpx.HTTPError, ValueError):
        pass
    return "needs_review", None


def verify_event(raw: bytes, headers: dict) -> tuple[str, dict]:
    secret = os.environ.get("NEWSLETTER_WEBHOOK_SECRET", "")
    try:
        identity, timestamp = headers["svix-id"], headers["svix-timestamp"]
        if len(raw) > 65_536 or len(identity) > 128 or abs(time.time() - int(timestamp)) > 300:
            raise ValueError
        key = base64.b64decode(secret.removeprefix("whsec_"), validate=True)
        if len(key) < 16:
            raise ValueError
        expected = base64.b64encode(
            hmac.new(
                key, identity.encode() + b"." + timestamp.encode() + b"." + raw, hashlib.sha256
            ).digest()
        ).decode()
        if not any(
            hmac.compare_digest(signature, "v1," + expected)
            for signature in headers["svix-signature"].split()
        ):
            raise ValueError
        event = json.loads(raw)
        if not isinstance(event, dict):
            raise ValueError
        return identity, event
    except (KeyError, ValueError, TypeError):
        raise fastapi.HTTPException(400, "Invalid delivery callback.") from None
