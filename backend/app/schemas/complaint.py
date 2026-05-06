from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr


class ComplaintCreate(BaseModel):
    complaint_text: str = Field(min_length=5, max_length=8000)
    location_text: str | None = Field(default=None, max_length=512)
    image_url: str | None = Field(default=None, max_length=2048)
    email: EmailStr | None = Field(default=None, description="Email for public users to track their complaint")


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
    email: str | None = None
    complaint_text: str | None = None
    location_text: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

