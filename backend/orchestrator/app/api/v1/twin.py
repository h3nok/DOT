import fastapi
import slowapi
import slowapi.util
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.session
import app.domains.twin.conversation
import app.domains.twin.schemas
import app.domains.twin.service

router = fastapi.APIRouter(
    prefix="/v1/twin",
    tags=["twin"],
    # Binds every request in this router to the caller's tenant (ADR-0011).
    dependencies=[fastapi.Depends(app.db.session.get_tenant_session)],
)

_limiter = slowapi.Limiter(key_func=slowapi.util.get_remote_address)


@router.post("/ask", response_model=app.domains.twin.schemas.TwinAskResponse)
@_limiter.limit("20/minute")
async def ask(
    request: fastapi.Request,
    payload: app.domains.twin.schemas.TwinAskRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.twin.schemas.TwinAskResponse:
    """Ask a twin. Answers are grounded in graph nodes or they are refused."""

    return await app.domains.twin.service.ask(session, owner, payload)


@router.get("/conversations", response_model=app.domains.twin.schemas.TwinConversationList)
async def list_conversations(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.twin.schemas.TwinConversationList:
    conversations = await app.domains.twin.conversation.list_conversations(session, owner)
    return app.domains.twin.schemas.TwinConversationList(
        conversations=[
            app.domains.twin.conversation.to_conversation_schema(conversation)
            for conversation in conversations
        ]
    )


@router.post("/conversations/messages", response_model=app.domains.twin.schemas.TwinMessageResponse)
@_limiter.limit("20/minute")
async def send_message(
    request: fastapi.Request,
    payload: app.domains.twin.schemas.TwinMessageRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.twin.schemas.TwinMessageResponse:
    """Continue a thread, or start one by omitting `conversation_id`."""

    try:
        conversation, answer = await app.domains.twin.conversation.send(session, owner, payload)
    except app.domains.twin.conversation.ConversationNotFoundError:
        raise fastapi.HTTPException(status_code=404, detail="conversation not found") from None

    return app.domains.twin.schemas.TwinMessageResponse(
        conversation=app.domains.twin.conversation.to_conversation_schema(conversation),
        answer=answer,
    )


@router.get(
    "/conversations/{conversation_id}", response_model=app.domains.twin.schemas.TwinMessageList
)
async def get_conversation(
    conversation_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.twin.schemas.TwinMessageList:
    try:
        conversation, messages = await app.domains.twin.conversation.list_messages(
            session, owner, conversation_id
        )
    except app.domains.twin.conversation.ConversationNotFoundError:
        raise fastapi.HTTPException(status_code=404, detail="conversation not found") from None

    return app.domains.twin.schemas.TwinMessageList(
        conversation=app.domains.twin.conversation.to_conversation_schema(conversation),
        messages=[
            app.domains.twin.conversation.to_message_schema(message) for message in messages
        ],
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    try:
        await app.domains.twin.conversation.delete_conversation(session, owner, conversation_id)
    except app.domains.twin.conversation.ConversationNotFoundError:
        raise fastapi.HTTPException(status_code=404, detail="conversation not found") from None
    return fastapi.Response(status_code=204)
