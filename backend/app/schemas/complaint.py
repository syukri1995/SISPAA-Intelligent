from __future__ import annotations

from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    complaint_text: str = Field(min_length=5, max_length=8000)
    location_text: str | None = Field(default=None, max_length=512)
    image_url: str | None = Field(default=None, max_length=2048)


class ComplaintStatus(BaseModel):
    complaint_id: str
    status: str
    current_step: str | None = None
    category: str | None = None
    agency: str | None = None
    confidence: float | None = None
    work_order_id: str | None = None
    priority: str | None = None
    citizen_email_preview: str | None = None

