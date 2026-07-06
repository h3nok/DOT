"""OTP sign-up / sign-in for DOT.

Adapted from the Sullix auth flow (request OTP -> verify -> session), trimmed to
what DOT needs for launch: a single owner (and future members) signing in with a
six-digit email code. No passwords.

  POST /api/otp/request   { email }            -> sends a 6-digit code
  POST /api/otp/verify    { email, code }      -> sets a signed session cookie
  GET  /api/otp/session                          -> current session (or null)
  POST /api/otp/logout                           -> clears the session

Email delivery reuses Sullix's provider: Resend's REST API via RESEND_API_KEY.
Without a key (local dev) the code is logged to the server console instead, so
the whole flow works offline.

Security properties carried over from Sullix:
  - cryptographically secure 6-digit codes (secrets.randbelow)
  - short expiry (10 min) and one active code per email+purpose
  - max attempts (5) to stop brute force; codes are single-use
  - send rate limiting (45s cooldown)
  - the owner allow-list gates who may author the profile graph
"""

import datetime
import json
import os
import secrets
import sqlite3
import time
import typing

import flask
import flask_cors
import requests
import itsdangerous


auth_bp = flask.Blueprint('auth', __name__)

_DB_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'auth.db')
_SECRET: str = os.environ.get('DOT_AUTH_SECRET', 'dot-dev-auth-secret-change-me')
_SESSION_COOKIE = 'dot_session'
_SESSION_MAX_AGE = 7 * 24 * 3600  # 7 days
_CODE_TTL = 10 * 60  # 10 minutes
_RESEND_COOLDOWN = 45  # seconds between sends
_MAX_ATTEMPTS = 5

# Email (Resend) — same provider/secret as Sullix.
_RESEND_API_KEY: str = os.environ.get('RESEND_API_KEY', '')
_EMAIL_FROM: str = os.environ.get('EMAIL_FROM', 'DOT <onboarding@resend.dev>')

# Owner allow-list: only these emails may author the profile graph. Comma list
# in DOT_OWNER_EMAILS; defaults to Henok's address.
_OWNER_EMAILS: set[str] = {
    e.strip().lower()
    for e: str in os.environ.get('DOT_OWNER_EMAILS', 'nkenok@gmail.com').split(',')
    if e.strip()
}

_serializer = itsdangerous.URLSafeTimedSerializer(_SECRET, salt='dot-session')
_invite_serializer = itsdangerous.URLSafeTimedSerializer(_SECRET, salt='dot-invite')
_INVITE_MAX_AGE = 14 * 24 * 3600  # an invitation is good for 14 days


# ----------------------------------------------------------------------------
# Storage
# ----------------------------------------------------------------------------
def _db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
    conn: sqlite3.Connection = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute(
        '''CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at REAL NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            used_at REAL,
            created_at REAL NOT NULL
        )'''
    )
    conn.execute(
        '''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            created_at REAL NOT NULL,
            last_signed_in REAL
        )'''
    )
    # The circle: who is connected to whom. Personal-first — it begins with just
    # the owner and grows one accepted invitation at a time. A connection is
    # directional (owner_email gained member_email) but rendered as a circle.
    conn.execute(
        '''CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_email TEXT NOT NULL,
            member_email TEXT NOT NULL,
            member_name TEXT,
            note TEXT,
            created_at REAL NOT NULL,
            UNIQUE(owner_email, member_email)
        )'''
    )
    return conn


def _now() -> float:
    return time.time()


def _generate_code() -> str:
    return f'{secrets.randbelow(1_000_000):06d}'


def _normalize_email(value: typing.Any) -> str | None:
    email: str = str(value or '').strip().lower()
    if '@' not in email or '.' not in email.split('@')[-1] or len(email) > 254:
        return None
    return email


def _is_owner(email: str) -> bool:
    return email.lower() in _OWNER_EMAILS


# ----------------------------------------------------------------------------
# Email delivery (Resend REST API, with dev fallback)
# ----------------------------------------------------------------------------
def _send_code_email(email: str, code: str) -> bool:
    if not _RESEND_API_KEY:
        # Local dev: no provider configured — surface the code so the flow works
        # offline (also echoed in the request response; see request_code).
        print(f'[OTP] DEV CODE for {email}: {code}', flush=True)
        return True

    try:
        response: requests.Response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {_RESEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            data=json.dumps({
                'from': _EMAIL_FROM,
                'to': [email],
                'subject': f'Your DOT code: {code}',
                'html': (
                    f'<div style="font-family:ui-sans-serif,system-ui,sans-serif;'
                    f'max-width:420px;margin:0 auto;padding:24px">'
                    f'<p style="font-size:14px;color:#555">Your sign-in code for DOT</p>'
                    f'<p style="font-size:34px;font-weight:700;letter-spacing:8px;'
                    f'margin:12px 0;color:#111">{code}</p>'
                    f'<p style="font-size:12px;color:#999">Expires in 10 minutes. '
                    f'If you did not request this, you can ignore it.</p></div>'
                ),
            }),
            timeout=10,
        )
        return response.status_code in (200, 201)
    except requests.RequestException as exc: requests.RequestException:
        flask.current_app.logger.error('[OTP] Resend send failed: %s', exc)
        return False


# ----------------------------------------------------------------------------
# Session
# ----------------------------------------------------------------------------
def _issue_session(response: flask.Response, user: sqlite3.Row) -> None:
    token: str = _serializer.dumps({'uid': user['id'], 'email': user['email']})
    response.set_cookie(
        _SESSION_COOKIE,
        token,
        max_age=_SESSION_MAX_AGE,
        httponly=True,
        samesite='Lax',
        secure=bool(os.environ.get('DOT_COOKIE_SECURE')),
    )


def current_user() -> dict[str, typing.Any] | None:
    """Resolve the current session, or None. Reusable by other routes."""
    token: str | None = flask.request.cookies.get(_SESSION_COOKIE)
    if not token:
        return None
    try:
        data = _serializer.loads(token, max_age=_SESSION_MAX_AGE)
    except itsdangerous.BadSignature:
        return None
    email: str = str(data.get('email', '')).lower()
    return {
        'id': data.get('uid'),
        'email': email,
        'is_owner': _is_owner(email),
    }


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@auth_bp.route('/otp/request', methods=['POST'])
@flask_cors.cross_origin(supports_credentials=True)
def request_code() -> tuple[flask.Response, int] | flask.Response:
    payload = flask.request.get_json(silent=True) or {}
    email: str | None = _normalize_email(payload.get('email'))
    if not email:
        return flask.jsonify({'success': False, 'error': 'Enter a valid email.'}), 400

    conn: sqlite3.Connection = _db()
    try:
        recent = conn.execute(
            '''SELECT created_at FROM otp_codes
               WHERE email = ? AND used_at IS NULL
               ORDER BY created_at DESC LIMIT 1''',
            (email,),
        ).fetchone()
        if recent and (_now() - recent['created_at']) < _RESEND_COOLDOWN:
            wait = int(_RESEND_COOLDOWN - (_now() - recent['created_at']))
            return flask.jsonify({
                'success': False,
                'error': f'Please wait {wait}s before requesting another code.',
            }), 429

        code: str = _generate_code()
        # Invalidate prior active codes, then store the new one.
        conn.execute(
            'UPDATE otp_codes SET used_at = ? WHERE email = ? AND used_at IS NULL',
            (_now(), email),
        )
        conn.execute(
            '''INSERT INTO otp_codes (email, code, expires_at, created_at)
               VALUES (?, ?, ?, ?)''',
            (email, code, _now() + _CODE_TTL, _now()),
        )
        conn.commit()
    finally:
        conn.close()

    sent: bool = _send_code_email(email, code)
    if not sent:
        return flask.jsonify({'success': False, 'error': 'Could not send code.'}), 502

    data: dict[str, typing.Any] = {'email': email, 'expires_in': _CODE_TTL}
    # Dev convenience: when no email provider is configured, return the code so
    # local sign-in works without a mailbox. Never happens once RESEND_API_KEY
    # (or another provider) is set in production.
    if not _RESEND_API_KEY:
        data['dev_code'] = code

    return flask.jsonify({'success': True, 'data': data})


@auth_bp.route('/otp/verify', methods=['POST'])
@flask_cors.cross_origin(supports_credentials=True)
def verify_code() -> tuple[flask.Response, int] | flask.Response:
    payload = flask.request.get_json(silent=True) or {}
    email: str | None = _normalize_email(payload.get('email'))
    code: str = str(payload.get('code', '')).strip()
    name: str | None = str(payload.get('name', '')).strip() or None

    if not email or not code.isdigit() or len(code) != 6:
        return flask.jsonify({'success': False, 'error': 'Enter the 6-digit code.'}), 400

    conn: sqlite3.Connection = _db()
    try:
        record = conn.execute(
            '''SELECT * FROM otp_codes
               WHERE email = ? AND used_at IS NULL AND expires_at > ?
               ORDER BY created_at DESC LIMIT 1''',
            (email, _now()),
        ).fetchone()

        if not record:
            return flask.jsonify({'success': False, 'error': 'Code expired. Request a new one.'}), 400

        if record['attempts'] >= _MAX_ATTEMPTS:
            conn.execute('UPDATE otp_codes SET used_at = ? WHERE id = ?', (_now(), record['id']))
            conn.commit()
            return flask.jsonify({'success': False, 'error': 'Too many attempts. Request a new code.'}), 429

        if not secrets.compare_digest(record['code'], code):
            conn.execute(
                'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?',
                (record['id'],),
            )
            conn.commit()
            remaining = _MAX_ATTEMPTS - (record['attempts'] + 1)
            return flask.jsonify({
                'success': False,
                'error': f'Incorrect code. {max(remaining, 0)} attempts left.',
            }), 400

        # Correct: consume the code and upsert the user.
        conn.execute('UPDATE otp_codes SET used_at = ? WHERE id = ?', (_now(), record['id']))
        existing = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            conn.execute('UPDATE users SET last_signed_in = ? WHERE id = ?', (_now(), existing['id']))
            user = conn.execute('SELECT * FROM users WHERE id = ?', (existing['id'],)).fetchone()
        else:
            conn.execute(
                'INSERT INTO users (email, name, created_at, last_signed_in) VALUES (?, ?, ?, ?)',
                (email, name, _now(), _now()),
            )
            user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        conn.commit()
    finally:
        conn.close()

    response: flask.Response = flask.make_response(flask.jsonify({
        'success': True,
        'data': {
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'is_owner': _is_owner(email),
            },
        },
    }))
    _issue_session(response, user)
    return response


@auth_bp.route('/otp/session', methods=['GET'])
@flask_cors.cross_origin(supports_credentials=True)
def me() -> flask.Response:
    user: dict[str, Any] | None = current_user()
    return flask.jsonify({'success': True, 'data': {'user': user}})


@auth_bp.route('/otp/logout', methods=['POST'])
@flask_cors.cross_origin(supports_credentials=True)
def logout() -> flask.Response:
    response: flask.Response = flask.make_response(flask.jsonify({'success': True}))
    response.delete_cookie(_SESSION_COOKIE)
    return response


# ----------------------------------------------------------------------------
# Invitations — invite-only by design. A signed-in member mints a tokenized
# invitation link; the token carries who invited whom and expires. Validation
# is entirely server-side (signed + time-limited); the client is never trusted.
# ----------------------------------------------------------------------------
@auth_bp.route('/invite/create', methods=['POST'])
@flask_cors.cross_origin(supports_credentials=True)
def create_invite() -> tuple[flask.Response, int] | flask.Response:
    user: dict[str, Any] | None = current_user()
    if not user:
        return flask.jsonify({'success': False, 'error': 'Sign in to invite.'}), 401

    payload = flask.request.get_json(silent=True) or {}
    # Optional: bind the invite to a specific email and a personal note.
    to_email: str | None = _normalize_email(payload.get('email')) if payload.get('email') else None
    note: str | None = str(payload.get('note', '')).strip()[:280] or None

    token: str = _invite_serializer.dumps({
        'from': user['email'],
        'to': to_email,
        'note': note,
    })

    base: str = flask.request.host_url.rstrip('/')
    link: str = f'{base}/DOT/?invite={token}'

    return flask.jsonify({
        'success': True,
        'data': {
            'token': token,
            'link': link,
            'to': to_email,
            'expires_in': _INVITE_MAX_AGE,
        },
    })


@auth_bp.route('/invite/check', methods=['GET'])
@flask_cors.cross_origin(supports_credentials=True)
def check_invite() -> tuple[flask.Response, int] | flask.Response:
    token: str = flask.request.args.get('token', '').strip()
    if not token:
        return flask.jsonify({'success': False, 'error': 'No invitation token.'}), 400
    try:
        data = _invite_serializer.loads(token, max_age=_INVITE_MAX_AGE)
    except itsdangerous.BadSignature:
        return flask.jsonify({'success': False, 'error': 'This invitation is invalid or has expired.'}), 400

    return flask.jsonify({
        'success': True,
        'data': {
            'from': data.get('from'),
            'to': data.get('to'),
            'note': data.get('note'),
        },
    })


def _primary_owner() -> str:
    """The single owner email the personal-first profile belongs to."""
    return sorted(_OWNER_EMAILS)[0] if _OWNER_EMAILS else 'self'


def _resolve_owner_email(owner: str) -> str:
    """Map a public owner handle ('self') to the owner's email key."""
    owner = (owner or '').strip().lower()
    if not owner or owner == 'self':
        return _primary_owner()
    return owner


def _display_name(email: str, name: str | None) -> str:
    if name and name.strip():
        return name.strip()
    return email.split('@')[0]


@auth_bp.route('/invite/accept', methods=['POST'])
@flask_cors.cross_origin(supports_credentials=True)
def accept_invite() -> tuple[flask.Response, int] | flask.Response:
    """A signed-in visitor accepts an invitation, joining the inviter's circle."""
    user: dict[str, Any] | None = current_user()
    if not user:
        return flask.jsonify({
            'success': False, 'error': 'Sign in to accept this invitation.'
        }), 401

    payload = flask.request.get_json(silent=True) or {}
    token: str = str(payload.get('token', '')).strip()
    if not token:
        return flask.jsonify({'success': False, 'error': 'No invitation token.'}), 400
    try:
        data = _invite_serializer.loads(token, max_age=_INVITE_MAX_AGE)
    except itsdangerous.BadSignature:
        return flask.jsonify({
            'success': False, 'error': 'This invitation is invalid or has expired.'
        }), 400

    inviter: str = str(data.get('from', '')).strip().lower()
    member: str = str(user.get('email', '')).strip().lower()
    if not inviter or not member:
        return flask.jsonify({'success': False, 'error': 'Could not resolve identities.'}), 400
    if inviter == member:
        return flask.jsonify({'success': False, 'error': 'You cannot accept your own invite.'}), 400

    conn: sqlite3.Connection = _db()
    try:
        row = conn.execute('SELECT name FROM users WHERE email = ?', (member,)).fetchone()
        member_name: typing.Any | None = row['name'] if row else None
        conn.execute(
            '''INSERT OR IGNORE INTO connections
               (owner_email, member_email, member_name, note, created_at)
               VALUES (?, ?, ?, ?, ?)''',
            (inviter, member, member_name, str(data.get('note') or '')[:280] or None, _now()),
        )
        conn.commit()
    finally:
        conn.close()

    return flask.jsonify({
        'success': True,
        'data': {'owner': inviter, 'member': member},
    })


@auth_bp.route('/circle', methods=['GET'])
@flask_cors.cross_origin(supports_credentials=True)
def get_circle() -> flask.Response:
    """The owner's circle — personal-first, starting with just the owner."""
    owner_email: str = _resolve_owner_email(flask.request.args.get('owner', 'self'))
    conn: sqlite3.Connection = _db()
    try:
        owner_row = conn.execute(
            'SELECT name FROM users WHERE email = ?', (owner_email,)
        ).fetchone()
        rows: list[Any] = conn.execute(
            '''SELECT member_email, member_name, note, created_at
               FROM connections WHERE owner_email = ?
               ORDER BY created_at DESC''',
            (owner_email,),
        ).fetchall()
    finally:
        conn.close()

    members = [
        {
            'name': _display_name(r['member_email'], r['member_name']),
            'note': r['note'],
            'joined_at': datetime.datetime.utcfromtimestamp(
                r['created_at']
            ).isoformat() if r['created_at'] else None,
        }
        for r in rows
    ]

    response: flask.Response = flask.make_response(flask.jsonify({
        'success': True,
        'data': {
            'owner': _display_name(owner_email, owner_row['name'] if owner_row else None),
            'count': len(members),
            'members': members,
        },
    }))
    response.headers['Cache-Control'] = 'no-store, max-age=0'
    return response

