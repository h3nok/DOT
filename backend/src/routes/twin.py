import datetime
import re
import typing

import flask
import flask_cors

import src.services


twin_bp = flask.Blueprint('twin', __name__)

PUBLIC_CONTEXT: dict[str, dict[str, str]] = {
    'book': {
        'title': 'First civic object',
        'answer': 'The Book Room comes first because it is a durable public object: source-traced, slow enough to resist feed pressure, and useful before membership mechanics exist.',
    },
    'invite': {
        'title': 'Invite access',
        'answer': 'Invite access is deliberately gated so the platform can protect attention and trust before it scales participation.',
    },
    'privacy': {
        'title': 'Privacy posture',
        'answer': 'The target architecture uses zero-retention guest questions, application-layer encryption before persistence, tenant-scoped keys, and blind identity indexes so infrastructure providers cannot read member content or map people by raw identifiers.',
    },
    'default': {
        'title': 'Public twin context',
        'answer': 'The guest twin answers only from public graph context: identity, reading, invitation, design rules, archive, trust, and contact. It should not infer private facts about the person.',
    },
}


def _classify_question(question) -> str:
    normalized = question.lower()

    if re.search(r'privacy|encrypt|data|cloud|provider|identity|anonymous', normalized):
        return 'privacy'
    if re.search(r'book|read|writing|source', normalized):
        return 'book'
    if re.search(r'invite|join|access|member', normalized):
        return 'invite'
    return 'default'


@twin_bp.route('/twin/ask', methods=['POST'])
@flask_cors.cross_origin()
def ask_twin() -> tuple[flask.Response, typing.Literal[400]] | flask.Response:
    """Return a public-context guest twin answer without persisting the question."""
    data = flask.request.get_json(silent=True) or {}
    question: str = str(data.get('question', '')).strip()

    if len(question) < 3:
        return flask.jsonify({
            'success': False,
            'error': 'Question must be at least 3 characters.'
        }), 400

    if len(question) > 280:
        return flask.jsonify({
            'success': False,
            'error': 'Question must be 280 characters or fewer.'
        }), 400

    context_key: str = _classify_question(question)
    context: dict[str, str] = PUBLIC_CONTEXT[context_key]

    # Prefer a grounded LLM answer when configured; otherwise fall back to the
    # canned public context so dev/offline still works. Either way the question
    # is never persisted.
    answer: str = context['answer']
    title: str = context['title']
    mode: str = 'guest_public_context'
    llm_answer: str | None = src.services.llm.generate(question)
    if llm_answer:
        answer = llm_answer
        title = 'DOT twin'
        mode = 'grounded_llm'

    response: flask.Response = flask.make_response(flask.jsonify({
        'success': True,
        'data': {
            'mode': mode,
            'retention': 'none',
            'context': context_key,
            'title': title,
            'answer': answer,
            'privacy': {
                'stored': False,
                'identity_collected': False,
                'training_allowed': False,
            },
        },
        'timestamp': datetime.datetime.utcnow().isoformat(),
    }))
    response.headers['Cache-Control'] = 'no-store, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=()'
    return response
