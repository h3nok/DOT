from datetime import datetime

from pydantic import BaseModel


class OrchestratorRunRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    owner_id: str
    workflow_type: str
    status: str
    idempotency_key: str | None
    requested_by: str | None
    input_ref: dict | None
    output_ref: dict | None
    error_code: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
