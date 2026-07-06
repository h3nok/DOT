from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import OwnerContext, require_owner
from app.db.models import OrchestratorRun
from app.db.session import get_session
from app.domains.runs.schemas import OrchestratorRunRead

router = APIRouter(prefix="/v1/runs", tags=["runs"])


@router.get("/{run_id}", response_model=OrchestratorRunRead)
async def get_run(
    run_id: str,
    owner: OwnerContext = Depends(require_owner),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(OrchestratorRun).where(
            OrchestratorRun.id == run_id,
            OrchestratorRun.owner_id == owner.owner_id,
        )
    )
    run = result.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found.")
    return run


@router.post("/{run_id}/cancel", response_model=OrchestratorRunRead)
async def cancel_run(
    run_id: str,
    owner: OwnerContext = Depends(require_owner),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(OrchestratorRun).where(
            OrchestratorRun.id == run_id,
            OrchestratorRun.owner_id == owner.owner_id,
        )
    )
    run = result.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found.")
    if run.status in {"succeeded", "failed", "cancelled"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Run is already terminal: {run.status}.",
        )
    run.status = "cancelled"
    run.completed_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(run)
    return run
