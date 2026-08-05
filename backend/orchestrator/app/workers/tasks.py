import asyncio

from app.db.models import FootprintImport
import app.auth.dependencies
import app.db.session
import app.domains.graph.service
import app.workers.broker


@app.workers.broker.dramatiq.actor(queue_name="orchestrator-smoke")
def smoke_workflow(message: str = "ok") -> dict[str, str]:
    """Minimal worker task used to verify worker/broker wiring."""

    return {"status": "processed", "message": message}


async def _process_footprint_import(import_id: str, owner_id: str) -> dict[str, str]:
    owner = app.auth.dependencies.OwnerContext(owner_id=owner_id, actor_id="orchestrator-worker")
    # Workers are tenants too — bind before touching tenant tables (ADR-0011).
    async with app.db.session.tenant_session(owner_id) as session:
        footprint_import: FootprintImport = await app.domains.graph.service.process_import(
            session,
            owner,
            import_id,
        )
        return {"status": footprint_import.status, "import_id": footprint_import.id}


@app.workers.broker.dramatiq.actor(queue_name="footprint-imports")
def process_footprint_import(import_id: str, owner_id: str) -> dict[str, str]:
    """Process a queued footprint import into graph nodes and edges."""

    return asyncio.run(_process_footprint_import(import_id, owner_id))
