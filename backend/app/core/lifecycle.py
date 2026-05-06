from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


class ComplaintStatus:
    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

    ALL = {SUBMITTED, ASSIGNED, ACCEPTED, IN_PROGRESS, RESOLVED, CLOSED}


class ActionType:
    SUBMITTED = "SUBMITTED"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    STARTED = "STARTED"
    RESOLVED = "RESOLVED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    AUTO_ESCALATED = "AUTO_ESCALATED"
    AUTO_CLOSED = "AUTO_CLOSED"


@dataclass(frozen=True)
class SlaPolicy:
    accept_within_hours: int
    auto_close_after_days: int
    deadline_hours_low: int
    deadline_hours_medium: int
    deadline_hours_high: int


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def deadline_for_priority(priority: str | None, *, policy: SlaPolicy) -> datetime:
    p = (priority or "LOW").upper()
    hours = policy.deadline_hours_low
    if p == "HIGH":
        hours = policy.deadline_hours_high
    elif p == "MEDIUM":
        hours = policy.deadline_hours_medium
    return utc_now() + timedelta(hours=int(hours))

