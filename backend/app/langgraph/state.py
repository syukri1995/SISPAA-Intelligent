from __future__ import annotations

import uuid
from typing import Literal, TypedDict


Category = Literal[
    "Infrastructure Damage",
    "Public Transport Issue",
    "Healthcare Service",
    "Public Facilities",
    "Other",
]

Agency = Literal["DBKL", "APAD", "KKM", "OTHER"]
Priority = Literal["LOW", "MEDIUM", "HIGH"]


class RouterState(TypedDict, total=False):
    complaint_id: str
    complaint_text: str
    location_text: str | None
    image_url: str | None

    # Sense
    metadata: dict

    # Reason
    category: Category
    agency: Agency
    confidence: float
    retry_count: int

    # Act
    work_order_id: str
    priority: Priority
    work_order_description: str
    citizen_email_preview: str

    # UI
    current_step: str
    status: str


def new_work_order_id() -> str:
    return str(uuid.uuid4())

