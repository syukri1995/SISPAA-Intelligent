from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr


class ComplaintCreateV2(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str = Field(min_length=10, max_length=8000)
    email: EmailStr | None = None
    location_text: str | None = Field(default=None, max_length=512)
    image_url: str | None = Field(default=None, max_length=2048)


class ComplaintOut(BaseModel):
    id: str
    title: str | None
    description: str
    category: str | None
    priority: str | None
    status: str
    assigned_to: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    assigned_at: str | None = None
    accepted_at: str | None = None
    started_at: str | None = None
    resolved_at: str | None = None
    closed_at: str | None = None

    deadline_at: str | None = None
    escalated_at: str | None = None
    escalation_reason: str | None = None


class CitizenConfirmIn(BaseModel):
    email: EmailStr | None = None


class CitizenRejectIn(BaseModel):
    email: EmailStr | None = None
    reason: str | None = Field(default=None, max_length=1000)


class OfficerResolveIn(BaseModel):
    proof_url: str | None = Field(default=None, max_length=2048)


class ActionLogOut(BaseModel):
    id: str
    complaint_id: str
    action_type: str
    user_id: str | None
    payload: dict | None
    timestamp: str

