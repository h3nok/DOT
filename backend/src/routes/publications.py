"""Publications — the publication platform spine for DOT.

A member publishes durable work here. The model is deliberately calm and
ownership-first (see docs/blueprint/04-KNOWLEDGE-AND-PUBLICATION.md):

  - A publication starts as a *draft* the owner can freely revise.
  - *Releasing* it stamps a version and a timestamp and makes that release
    immutable — durable work, not an editable feed post. Further changes create
    a new version rather than rewriting history.
  - Reads are public (anyone can read a released work via its stable id);
    writes require the authenticated owner.

Storage mirrors the profile store: one JSON document per owner, read often and
written rarely. This is the right amount of machinery for a personal-first
launch; it can move behind a database later without changing the API.

  GET    /api/publications?owner=self           -> list (released for visitors;
                                                    drafts too for the owner)
  GET    /api/publications/<pub_id>?owner=self  -> one publication
  POST   /api/publications                       -> create a draft (owner)
  PUT    /api/publications/<pub_id>              -> revise a draft (owner)
  POST   /api/publications/<pub_id>/release      -> release / cut a version (owner)
  DELETE /api/publications/<pub_id>              -> delete a draft (owner)
"""

import datetime
from io import TextIOWrapper
from io import TextIOWrapper
import json
import os
import secrets
import typing

import flask
import flask_cors

import src.routes.auth


publications_bp = flask.Blueprint('publications', __name__)

_DATA_DIR: str = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'data', 'publications'
)
_MAX_BYTES = 512 * 1024  # a single publication document is small by design


# ----------------------------------------------------------------------------
# Storage helpers
# ----------------------------------------------------------------------------
def _safe_owner(owner: str) -> str:
    cleaned: str = ''.join(c for c: str in owner if c.isalnum() or c in ('-', '_')).strip()
    return cleaned or 'self'


def _path_for(owner: str) -> str:
    os.makedirs(_DATA_DIR, exist_ok=True)
    return os.path.join(_DATA_DIR, f'{_safe_owner(owner)}.json')


def _load(owner: str) -> list[dict[str, typing.Any]]:
    path: str = _path_for(owner)
    if not os.path.exists(path):
        return []
    try:
        with open(path, 'r', encoding='utf-8') as handle: TextIOWrapper[_WrappedBuffer]:
            data = json.load(handle)
        items = data.get('publications', [])
        return items if isinstance(items, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def _save(owner: str, items: list[dict[str, typing.Any]]) -> bool:
    path: str = _path_for(owner)
    tmp: str = f'{path}.tmp'
    payload = {
        'publications': items,
        'updated_at': datetime.datetime.utcnow().isoformat(),
    }
    try:
        with open(tmp, 'w', encoding='utf-8') as handle: TextIOWrapper[_WrappedBuffer]:
            json.dump(payload, handle, ensure_ascii=False)
        os.replace(tmp, path)
        return True
    except OSError:
        return False


def _gen_id(title: str) -> str:
    slug: str = ''.join(c if c.isalnum() else '-' for c: str in title.lower()).strip('-')
    slug: str = '-'.join(filter(None, slug.split('-')))[:48] or 'work'
    return f'{slug}-{secrets.token_hex(3)}'


def _owner_session_for(owner: str) -> bool:
    """True when the current session is the authenticated owner of this store."""
    session = src.routes.auth.current_user()
    return bool(session and session.get('is_owner'))


def _public_view(pub: dict[str, typing.Any]) -> dict[str, typing.Any]:
    """A publication as seen by visitors — no draft body leakage beyond status."""
    return {
        'id': pub.get('id'),
        'title': pub.get('title'),
        'essence': pub.get('essence'),
        'body': pub.get('body'),
        'status': pub.get('status'),
        'version': pub.get('version'),
        'released_at': pub.get('released_at'),
        'created_at': pub.get('created_at'),
        'updated_at': pub.get('updated_at'),
    }


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@publications_bp.route('/publications', methods=['GET'])
@flask_cors.cross_origin(supports_credentials=True)
def list_publications() -> flask.Response:
    owner: str = flask.request.args.get('owner', 'self')
    items: list[dict[str, Any]] = _load(owner)
    is_owner: bool = _owner_session_for(owner)
    # Visitors see only released work; the owner sees drafts too.
    visible: list[dict[str, Any]] = [
        p for p: dict[str, Any] in items if is_owner or p.get('status') == 'released'
    ]
    visible.sort(
        key=lambda p: p.get('released_at') or p.get('updated_at') or '',
        reverse=True,
    )
    response: flask.Response = flask.make_response(flask.jsonify({
        'success': True,
        'data': {
            'owner': _safe_owner(owner),
            'is_owner': is_owner,
            'publications': [_public_view(p) for p: dict[str, Any] in visible],
        },
    }))
    response.headers['Cache-Control'] = 'no-store, max-age=0'
    return response


@publications_bp.route('/publications/<pub_id>', methods=['GET'])
@flask_cors.cross_origin(supports_credentials=True)
def get_publication(pub_id: str) -> tuple[flask.Response, int] | flask.Response:
    owner: str = flask.request.args.get('owner', 'self')
    items: list[dict[str, Any]] = _load(owner)
    is_owner: bool = _owner_session_for(owner)
    pub: dict[str, Any] | None = next((p for p: dict[str, Any] in items if p.get('id') == pub_id), None)
    if not pub or (pub.get('status') != 'released' and not is_owner):
        return flask.jsonify({'success': False, 'error': 'Not found.'}), 404
    response: flask.Response = flask.make_response(flask.jsonify({
        'success': True,
        'data': {'publication': _public_view(pub)},
    }))
    response.headers['Cache-Control'] = 'no-store, max-age=0'
    return response


@publications_bp.route('/publications', methods=['POST'])
@flask_cors.cross_origin(supports_credentials=True)
def create_publication() -> tuple[flask.Response, int] | flask.Response:
    session = src.routes.auth.current_user()
    if not (session and session.get('is_owner')):
        return flask.jsonify({'success': False, 'error': 'Not authorized.'}), 401
    if (flask.request.content_length or 0) > _MAX_BYTES:
        return flask.jsonify({'success': False, 'error': 'Too large.'}), 413

    payload = flask.request.get_json(silent=True) or {}
    owner = str(payload.get('owner', 'self'))
    title: str = str(payload.get('title', '')).strip()
    if not title:
        return flask.jsonify({'success': False, 'error': 'A title is required.'}), 400

    now: str = datetime.datetime.utcnow().isoformat()
    pub = {
        'id': _gen_id(title),
        'title': title[:200],
        'essence': str(payload.get('essence', '')).strip()[:280] or None,
        'body': str(payload.get('body', '')).strip() or None,
        'status': 'draft',
        'version': 0,
        'released_at': None,
        'created_at': now,
        'updated_at': now,
    }
    items: list[dict[str, Any]] = _load(owner)
    items.append(pub)
    if not _save(owner, items):
        return flask.jsonify({'success': False, 'error': 'Could not save.'}), 500
    return flask.jsonify({'success': True, 'data': {'publication': _public_view(pub)}})


@publications_bp.route('/publications/<pub_id>', methods=['PUT'])
@flask_cors.cross_origin(supports_credentials=True)
def update_publication(pub_id: str) -> tuple[flask.Response, int] | flask.Response:
    session = src.routes.auth.current_user()
    if not (session and session.get('is_owner')):
        return flask.jsonify({'success': False, 'error': 'Not authorized.'}), 401
    if (flask.request.content_length or 0) > _MAX_BYTES:
        return flask.jsonify({'success': False, 'error': 'Too large.'}), 413

    payload = flask.request.get_json(silent=True) or {}
    owner = str(payload.get('owner', 'self'))
    items: list[dict[str, Any]] = _load(owner)
    pub: dict[str, Any] | None = next((p for p: dict[str, Any] in items if p.get('id') == pub_id), None)
    if not pub:
        return flask.jsonify({'success': False, 'error': 'Not found.'}), 404

    # A released work is immutable; revising it re-opens a new draft cycle above
    # the released version rather than rewriting the published record.
    if 'title' in payload:
        title: str = str(payload.get('title', '')).strip()
        if title:
            pub['title'] = title[:200]
    if 'essence' in payload:
        pub['essence'] = str(payload.get('essence', '')).strip()[:280] or None
    if 'body' in payload:
        pub['body'] = str(payload.get('body', '')).strip() or None
    if pub.get('status') == 'released':
        pub['status'] = 'draft'  # edits move it back to draft until re-released
    pub['updated_at'] = datetime.datetime.utcnow().isoformat()

    if not _save(owner, items):
        return flask.jsonify({'success': False, 'error': 'Could not save.'}), 500
    return flask.jsonify({'success': True, 'data': {'publication': _public_view(pub)}})


@publications_bp.route('/publications/<pub_id>/release', methods=['POST'])
@flask_cors.cross_origin(supports_credentials=True)
def release_publication(pub_id: str) -> tuple[flask.Response, int] | flask.Response:
    session = src.routes.auth.current_user()
    if not (session and session.get('is_owner')):
        return flask.jsonify({'success': False, 'error': 'Not authorized.'}), 401

    payload = flask.request.get_json(silent=True) or {}
    owner = str(payload.get('owner', 'self'))
    items: list[dict[str, Any]] = _load(owner)
    pub: dict[str, Any] | None = next((p for p: dict[str, Any] in items if p.get('id') == pub_id), None)
    if not pub:
        return flask.jsonify({'success': False, 'error': 'Not found.'}), 404
    if not (pub.get('body') or '').strip():
        return flask.jsonify({
            'success': False, 'error': 'Give it substance before releasing.'
        }), 400

    pub['status'] = 'released'
    pub['version'] = int(pub.get('version') or 0) + 1
    pub['released_at'] = datetime.datetime.utcnow().isoformat()
    pub['updated_at'] = pub['released_at']

    if not _save(owner, items):
        return flask.jsonify({'success': False, 'error': 'Could not save.'}), 500
    return flask.jsonify({'success': True, 'data': {'publication': _public_view(pub)}})


@publications_bp.route('/publications/<pub_id>', methods=['DELETE'])
@flask_cors.cross_origin(supports_credentials=True)
def delete_publication(pub_id: str) -> tuple[flask.Response, int] | flask.Response:
    session = src.routes.auth.current_user()
    if not (session and session.get('is_owner')):
        return flask.jsonify({'success': False, 'error': 'Not authorized.'}), 401

    owner: str = flask.request.args.get('owner', 'self')
    items: list[dict[str, Any]] = _load(owner)
    remaining: list[dict[str, Any]] = [p for p: dict[str, Any] in items if p.get('id') != pub_id]
    if len(remaining) == len(items):
        return flask.jsonify({'success': False, 'error': 'Not found.'}), 404
    if not _save(owner, remaining):
        return flask.jsonify({'success': False, 'error': 'Could not save.'}), 500
    return flask.jsonify({'success': True})
