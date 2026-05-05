from __future__ import annotations

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: str
    complaint_id: str | None
    event_type: str
    message: str
    payload: dict | None
    created_at: str

