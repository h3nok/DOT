import datetime

import fastapi
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.models
import app.db.session
import app.domains.runs.schemas

router = fastapi.APIRouter(
    prefix="/v1/runs",
    tags=["runs"],
    # Binds every request in this router to the caller's tenant (ADR-0011).
    dependencies=[fastapi.Depends(app.db.session.get_tenant_session)],
)


@router.get("/{run_id}", response_model=app.domains.runs.schemas.OrchestratorRunRead)
async def get_run(
    run_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.db.models.OrchestratorRun:
    result: sqlalchemy.Result[tuple[app.db.models.OrchestratorRun]] = await session.execute(
        sqlalchemy.select(app.db.models.OrchestratorRun).where(
            app.db.models.OrchestratorRun.id == run_id,
            app.db.models.OrchestratorRun.owner_id == owner.owner_id,
        )
    )
    run: app.db.models.OrchestratorRun | None = result.scalar_one_or_none()
    if run is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Run not found."
        )
    return run


@router.post("/{run_id}/cancel", response_model=app.domains.runs.schemas.OrchestratorRunRead)
async def cancel_run(
    run_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.db.models.OrchestratorRun:
    result: sqlalchemy.Result[tuple[app.db.models.OrchestratorRun]] = await session.execute(
        sqlalchemy.select(app.db.models.OrchestratorRun).where(
            app.db.models.OrchestratorRun.id == run_id,
            app.db.models.OrchestratorRun.owner_id == owner.owner_id,
        )
    )
    run: app.db.models.OrchestratorRun | None = result.scalar_one_or_none()
    if run is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Run not found."
        )
    if run.status in {"succeeded", "failed", "cancelled"}:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_409_CONFLICT,
            detail=f"Run is already terminal: {run.status}.",
        )
    run.status = "cancelled"
    run.completed_at = datetime.datetime.now(datetime.UTC)
    await session.commit()
    await session.refresh(run)
    return run
