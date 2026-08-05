"""Conversations: the twin holds a thread instead of isolated questions.

Persistence sits outside the ask loop on purpose. `service.ask` stays a pure
grounded function; this module decides what it remembers. Every turn is stored
with the citations it actually shipped, so a thread can be audited later without
re-running the model against a graph that has since changed.
"""

from __future__ import annotations

import datetime
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.models
import app.domains.twin.model as model
import app.domains.twin.schemas as schemas
import app.domains.twin.service as service

#: A title is a handle, not a summary; the first question is the best one there
#: is until the member renames it.
TITLE_MAX_CHARS = 80

ROLE_MEMBER = "member"
ROLE_TWIN = "twin"


class ConversationNotFoundError(Exception):
    """Raised when a conversation does not exist for this requester."""


def derive_title(question: str) -> str:
    collapsed: str = " ".join(question.split())
    if len(collapsed) <= TITLE_MAX_CHARS:
        return collapsed or "New conversation"
    return f"{collapsed[: TITLE_MAX_CHARS - 1].rstrip()}…"


async def _load(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    conversation_id: str,
) -> app.db.models.TwinConversation:
    # Filtering by owner here rather than checking after the fetch: a missing
    # conversation and someone else's conversation must be indistinguishable.
    result = await session.execute(
        sqlalchemy.select(app.db.models.TwinConversation).where(
            app.db.models.TwinConversation.id == conversation_id,
            app.db.models.TwinConversation.owner_id == requester.owner_id,
        )
    )
    conversation: app.db.models.TwinConversation | None = result.scalar_one_or_none()
    if conversation is None:
        raise ConversationNotFoundError(conversation_id)
    return conversation


async def list_conversations(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    *,
    limit: int = 50,
) -> list[app.db.models.TwinConversation]:
    result = await session.execute(
        sqlalchemy.select(app.db.models.TwinConversation)
        .where(app.db.models.TwinConversation.owner_id == requester.owner_id)
        .order_by(
            app.db.models.TwinConversation.last_message_at.desc().nullslast(),
            app.db.models.TwinConversation.created_at.desc(),
        )
        .limit(min(limit, 200))
    )
    return list(result.scalars().all())


async def list_messages(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    conversation_id: str,
    *,
    limit: int = 200,
) -> tuple[app.db.models.TwinConversation, list[app.db.models.TwinMessage]]:
    conversation: app.db.models.TwinConversation = await _load(
        session, requester, conversation_id
    )
    result = await session.execute(
        sqlalchemy.select(app.db.models.TwinMessage)
        .where(app.db.models.TwinMessage.conversation_id == conversation_id)
        .order_by(app.db.models.TwinMessage.seq)
        .limit(min(limit, 500))
    )
    return conversation, list(result.scalars().all())


async def _recent_turns(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    conversation_id: str,
) -> list[tuple[str, str]]:
    result = await session.execute(
        sqlalchemy.select(app.db.models.TwinMessage)
        .where(app.db.models.TwinMessage.conversation_id == conversation_id)
        .order_by(app.db.models.TwinMessage.seq.desc())
        .limit(service.HISTORY_TURNS)
    )
    messages: list[app.db.models.TwinMessage] = list(result.scalars().all())
    # Refusals are excluded: replaying "I could not ground that" teaches the twin
    # nothing and spends context that retrieved material needs.
    return [
        (message.role, message.content)
        for message in reversed(messages)
        if message.refusal_code is None
    ]


async def delete_conversation(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    conversation_id: str,
) -> None:
    conversation: app.db.models.TwinConversation = await _load(
        session, requester, conversation_id
    )
    await session.delete(conversation)
    await session.commit()


async def send(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    payload: schemas.TwinMessageRequest,
    client: model.ModelClient | None = None,
) -> tuple[app.db.models.TwinConversation, schemas.TwinAskResponse]:
    subject_owner_id: str = payload.owner_id or requester.owner_id

    if payload.conversation_id is None:
        conversation = app.db.models.TwinConversation(
            owner_id=requester.owner_id,
            subject_owner_id=subject_owner_id,
            title=derive_title(payload.question),
        )
        session.add(conversation)
        await session.flush()
        history: list[tuple[str, str]] = []
    else:
        conversation = await _load(session, requester, payload.conversation_id)
        subject_owner_id = conversation.subject_owner_id
        history = await _recent_turns(session, conversation.id)

    session.add(
        app.db.models.TwinMessage(
            conversation_id=conversation.id,
            seq=conversation.message_count,
            role=ROLE_MEMBER,
            content=payload.question,
        )
    )

    answer: schemas.TwinAskResponse = await service.ask(
        session,
        requester,
        schemas.TwinAskRequest(question=payload.question, owner_id=subject_owner_id),
        client=client,
        history=history,
    )

    session.add(
        app.db.models.TwinMessage(
            conversation_id=conversation.id,
            seq=conversation.message_count + 1,
            role=ROLE_TWIN,
            content=answer.answer,
            citations=[citation.model_dump() for citation in answer.citations],
            refusal_code=answer.refusal_code,
        )
    )
    conversation.message_count += 2
    conversation.last_message_at = datetime.datetime.now(datetime.UTC)
    await session.commit()
    await session.refresh(conversation)
    return conversation, answer


def to_conversation_schema(
    conversation: app.db.models.TwinConversation,
) -> schemas.TwinConversation:
    return schemas.TwinConversation(
        id=conversation.id,
        title=conversation.title,
        subject_owner_id=conversation.subject_owner_id,
        message_count=conversation.message_count,
        created_at=conversation.created_at,
        last_message_at=conversation.last_message_at,
    )


def to_message_schema(message: app.db.models.TwinMessage) -> schemas.TwinMessage:
    citations: list[dict[str, typing.Any]] = message.citations or []
    return schemas.TwinMessage(
        id=message.id,
        role=message.role,
        content=message.content,
        citations=[schemas.Citation(**citation) for citation in citations],
        refusal_code=message.refusal_code,
        created_at=message.created_at,
    )
