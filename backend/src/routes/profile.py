import datetime
from io import TextIOWrapper
from io import TextIOWrapper
import json
import os
import typing

import flask
import flask_cors

import src.routes.auth


profile_bp = flask.Blueprint('profile', __name__)

# File-backed store for the profile graph. One JSON document per owner, kept in
# a data directory beside the app. This is intentionally simple: the profile
# graph is a single small document, read often and written rarely (only by its
# owner), so a durable file store is the right amount of machinery for launch.
_DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'profiles')

# Owner write token. Override in production via DOT_OWNER_TOKEN. Reads are public;
# writes require this shared secret so the public graph cannot be overwritten.
_OWNER_TOKEN: str = os.environ.get('DOT_OWNER_TOKEN', 'dev-owner-token')

# Guard against absurd documents (the graph is small by design).
_MAX_BYTES = 256 * 1024


def _safe_owner(owner: str) -> str:
    cleaned: str = ''.join(c for c: str in owner if c.isalnum() or c in ('-', '_')).strip()
    return cleaned or 'self'


def _path_for(owner: str) -> str:
    os.makedirs(_DATA_DIR, exist_ok=True)
    return os.path.join(_DATA_DIR, f'{_safe_owner(owner)}.json')


def _is_node(value: typing.Any) -> bool:
    return (
        isinstance(value, dict)
        and isinstance(value.get('id'), str)
        and isinstance(value.get('label'), str)
    )


@profile_bp.route('/profile/graph', methods=['GET'])
@flask_cors.cross_origin()
def get_graph() -> flask.Response:
    """Return the stored profile graph for an owner, or an empty payload."""
    owner: str = flask.request.args.get('owner', 'self')
    path: str = _path_for(owner)

    graph: typing.Any = None
    updated_at: str | None = None
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as handle: TextIOWrapper[_WrappedBuffer]:
                stored = json.load(handle)
            graph = stored.get('graph')
            updated_at = stored.get('updated_at')
        except (OSError, json.JSONDecodeError):
            graph = None

    response: flask.Response = flask.make_response(flask.jsonify({
        'success': True,
        'data': {
            'owner': _safe_owner(owner),
            'graph': graph,
            'updated_at': updated_at,
        },
    }))
    response.headers['Cache-Control'] = 'no-store, max-age=0'
    return response


@profile_bp.route('/profile/graph', methods=['PUT'])
@flask_cors.cross_origin()
def put_graph() -> tuple[flask.Response, int] | flask.Response:
    """Persist the profile graph for an owner. Requires an authenticated owner."""
    # Preferred: an authenticated owner session (OTP sign-in). Legacy fallback:
    # the shared owner token, kept so existing deploys keep working.
    session = src.routes.auth.current_user()
    authorized = bool(session and session.get('is_owner'))
    if not authorized:
        token: str = flask.request.headers.get('X-Owner-Token', '')
        authorized: bool = bool(_OWNER_TOKEN) and token == _OWNER_TOKEN
    if not authorized:
        return flask.jsonify({'success': False, 'error': 'Not authorized.'}), 401

    if (flask.request.content_length or 0) > _MAX_BYTES:
        return flask.jsonify({'success': False, 'error': 'Graph too large.'}), 413

    data: dict[str, typing.Any] = flask.request.get_json(silent=True) or {}
    owner: str = str(data.get('owner', 'self'))
    graph: typing.Any = data.get('graph')

    if not _is_node(graph):
        return flask.jsonify({
            'success': False,
            'error': 'Graph must be a node with an id and label.',
        }), 400

    updated_at: str = datetime.datetime.utcnow().isoformat()
    payload: dict[str, typing.Any] = {'graph': graph, 'updated_at': updated_at}

    path: str = _path_for(owner)
    tmp_path: str = f'{path}.tmp'
    try:
        with open(tmp_path, 'w', encoding='utf-8') as handle: TextIOWrapper[_WrappedBuffer]:
            json.dump(payload, handle, ensure_ascii=False)
        os.replace(tmp_path, path)
    except OSError:
        return flask.jsonify({'success': False, 'error': 'Could not persist graph.'}), 500

    return flask.jsonify({
        'success': True,
        'data': {'owner': _safe_owner(owner), 'updated_at': updated_at},
    })
