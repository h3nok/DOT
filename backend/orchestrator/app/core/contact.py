"""Reversible sealing for the one address the platform must be able to answer.

ADR-0007 is blunt: private member data is encrypted before it is persisted, and
identity is looked up through blind indexes. `Member` therefore keeps only
`email_hash`, and nothing in the system can turn that back into an address.

A request to join is the narrow exception the ADR itself names. Someone hands
over an address for exactly one purpose — so a human can answer them — and a
hash cannot be answered. Storing plaintext instead would put every prospective
member's address in every backup and log of a product whose entire promise is
that it does not do that.

So the address is sealed with a key the database never holds. A dump on its own
yields nothing; reading an address requires the running service *and* the key
from the secret store. The blind index stays alongside it, so dedupe and lookup
never need to unseal anything.

`JOIN_CONTACT_KEY` is a urlsafe-base64 32-byte Fernet key:

    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

Rotation: keep the previous key in `JOIN_CONTACT_KEY_PREVIOUS` and both are
tried on open, so a rotation does not strand pending requests.
"""

from __future__ import annotations

import hashlib
import os

import cryptography.fernet


class ContactSealUnavailable(RuntimeError):
    """No key is configured, so no address may be accepted or read."""


def _keys() -> list[str]:
    """Current key first, then any previous key still valid for opening."""
    return [
        key
        for key in (
            os.environ.get("JOIN_CONTACT_KEY", "").strip(),
            os.environ.get("JOIN_CONTACT_KEY_PREVIOUS", "").strip(),
        )
        if key
    ]


def sealing_available() -> bool:
    """Whether the queue may accept an address at all."""
    return bool(_keys())


def blind_index(email: str) -> str:
    """Stable lookup handle. Matches the posture `Member.email_hash` takes."""
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()


def seal(email: str) -> str:
    """Encrypt an address for storage. Fails closed when unconfigured."""
    keys = _keys()
    if not keys:
        raise ContactSealUnavailable("JOIN_CONTACT_KEY is not configured.")
    token = cryptography.fernet.Fernet(keys[0].encode()).encrypt(email.strip().encode())
    return token.decode()


def open_sealed(sealed: str) -> str | None:
    """Recover an address, trying the previous key so rotation is not a cliff.

    Returns None rather than raising: one unreadable row must not take down the
    whole queue listing for the person trying to answer it.
    """
    for key in _keys():
        try:
            return cryptography.fernet.Fernet(key.encode()).decrypt(sealed.encode()).decode()
        except (cryptography.fernet.InvalidToken, ValueError):
            continue
    return None
