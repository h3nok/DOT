"""Grounded LLM for the DOT public twin.

Reuses Sullix's GenAI configuration (env names and Gemini models) but takes the
simplest path that needs no extra dependencies: the Google Generative Language
API with an API key, called via `requests`.

  GOOGLE_API_KEY / GEMINI_API_KEY   the key (either name works, Sullix-compatible)
  GENAI_MODEL                       model id, default "gemini-2.5-flash"

The twin is *grounded*: it answers only from DOT's public context (the published
profile graph plus the doctrine summary), and is instructed to refuse private
inference and never invent facts. When no key is configured, `generate` returns
None so callers fall back to canned context — so dev and offline still work.
"""

from io import TextIOWrapper
import json
import os
import typing

import requests


_MODEL: str = os.environ.get('GENAI_MODEL', 'gemini-2.5-flash')
_API_KEY: str = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY') or ''
_ENDPOINT: str = (
    'https://generativelanguage.googleapis.com/v1beta/models/'
    f'{_MODEL}:generateContent'
)

_PROFILE_DIR: str = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'data', 'profiles'
)

SYSTEM_RULES = (
    "You are the public twin for DOT — the living profile of Henok, a writer and "
    "systems architect working on Digital Organisms Theory. You speak in his "
    "place to visitors. Rules: answer only from the public context provided "
    "below; never invent private facts (no contact details, schedules, or "
    "personal data beyond what is given); if asked something the context does not "
    "cover, say so plainly and point to a relevant part of the graph. Be calm, "
    "concise (2-4 sentences), and never salesy. No emojis."
)


def is_enabled() -> bool:
    return bool(_API_KEY)


def _flatten_graph(node: dict[str, typing.Any], depth: int = 0) -> list[str]:
    lines: list[str] = []
    indent: str = '  ' * depth
    label = node.get('label', '')
    desc = node.get('description', '')
    body = node.get('body', '')
    head: str = f'{indent}- {label}'
    if desc:
        head += f': {desc}'
    lines.append(head)
    if body:
        snippet: str = ' '.join(str(body).split())
        if len(snippet) > 320:
            snippet: str = snippet[:317] + '...'
        lines.append(f'{indent}  {snippet}')
    for child in node.get('children', []) or []:
        lines.extend(_flatten_graph(child, depth + 1))
    return lines


def _load_profile_context(owner: str = 'self') -> str:
    path: str = os.path.join(_PROFILE_DIR, f'{owner}.json')
    if not os.path.exists(path):
        return ''
    try:
        with open(path, 'r', encoding='utf-8') as handle: TextIOWrapper[_WrappedBuffer]:
            stored = json.load(handle)
        graph = stored.get('graph')
        if not isinstance(graph, dict):
            return ''
        return '\n'.join(_flatten_graph(graph))
    except (OSError, json.JSONDecodeError):
        return ''


def build_context(owner: str = 'self') -> str:
    """Assemble the public grounding context the twin may answer from."""
    parts: list[str] = []
    profile: str = _load_profile_context(owner)
    if profile:
        parts.append('PROFILE GRAPH:\n' + profile)
    parts.append(
        'DOCTRINE (Digital Organisms Theory):\n'
        '- Consciousness is the first pattern that stabilized itself within an '
        'incomprehensible substrate and held.\n'
        '- A Self (little c) is an individuated strand of that one stabilized '
        'field — distinct but not separate.\n'
        '- Coherence is integration: a Self becoming more whole and truly '
        'connected; at its limit it is Love. Fragmentation is the opposite.\n'
        '- The platform refuses feeds, ads, and vanity metrics; it exists to '
        'increase coherence, not harvest attention.'
    )
    return '\n\n'.join(parts)


def generate(question: str, owner: str = 'self') -> str | None:
    """Return a grounded answer, or None when the LLM is not configured/failed."""
    if not _API_KEY:
        return None

    context: str = build_context(owner)
    prompt: str = (
        f'{SYSTEM_RULES}\n\n=== PUBLIC CONTEXT ===\n{context}\n\n'
        f'=== VISITOR QUESTION ===\n{question}\n\n=== ANSWER ==='
    )

    try:
        response: requests.Response = requests.post(
            f'{_ENDPOINT}?key={_API_KEY}',
            headers={'Content-Type': 'application/json'},
            data=json.dumps({
                'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
                'generationConfig': {
                    'temperature': 0.4,
                    'maxOutputTokens': 512,
                },
            }),
            timeout=20,
        )
        if response.status_code != 200:
            return None
        payload = response.json()
        candidates = payload.get('candidates') or []
        if not candidates:
            return None
        parts = candidates[0].get('content', {}).get('parts') or []
        text: str = ''.join(part.get('text', '') for part in parts).strip()
        return text or None
    except (requests.RequestException, ValueError, KeyError):
        return None
