from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.lifecycle import (
    ActionType,
    ComplaintStatus,
    SlaPolicy,
    deadline_for_priority,
    utc_now,
)
from app.db.models import ActionLog, Assignment, Complaint


async def _get_complaint(session: AsyncSession, complaint_id: str) -> Complaint:
    q = select(Complaint).where(Complaint.id == complaint_id)
    complaint = (await session.execute(q)).scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


async def _get_or_create_assignment(session: AsyncSession, complaint_id: str) -> Assignment:
    q = select(Assignment).where(Assignment.complaint_id == complaint_id)
    assignment = (await session.execute(q)).scalar_one_or_none()
    if assignment:
        return assignment
    assignment = Assignment(complaint_id=complaint_id)
    session.add(assignment)
    await session.flush()
    return assignment


async def log_action(
    session: AsyncSession,
    *,
    complaint_id: str,
    action_type: str,
    user_id: str | None,
    payload: dict[str, Any] | None = None,
) -> None:
    session.add(
        ActionLog(
            complaint_id=complaint_id,
            action_type=action_type,
            user_id=user_id,
            payload=payload,
        )
    )


async def create_complaint(
    session: AsyncSession,
    *,
    title: str | None,
    description: str,
    email: str | None,
    location_text: str | None = None,
    image_url: str | None = None,
) -> Complaint:
    complaint = Complaint(
        title=title,
        complaint_text=description,
        description=description,
        email=email,
        location_text=location_text,
        image_url=image_url,
        status=ComplaintStatus.SUBMITTED,
    )
    session.add(complaint)
    await session.flush()
    await log_action(session, complaint_id=str(complaint.id), action_type=ActionType.SUBMITTED, user_id=None)
    return complaint


async def auto_assign_after_ai(
    session: AsyncSession,
    *,
    complaint: Complaint,
    category: str | None,
    priority: str | None,
    policy: SlaPolicy,
) -> Assignment:
    # Strict: SUBMITTED -> ASSIGNED
    if complaint.status != ComplaintStatus.SUBMITTED:
        raise HTTPException(status_code=409, detail=f"Cannot auto-assign from status={complaint.status}")

    complaint.category = category
    complaint.priority = (priority or "LOW").upper()
    complaint.status = ComplaintStatus.ASSIGNED

    assignment = await _get_or_create_assignment(session, str(complaint.id))
    assignment.assigned_at = utc_now()
    assignment.deadline_at = deadline_for_priority(complaint.priority, policy=policy)
    assignment.assigned_to = None

    await log_action(
        session,
        complaint_id=str(complaint.id),
        action_type=ActionType.ASSIGNED,
        user_id=None,
        payload={"category": category, "priority": complaint.priority},
    )
    return assignment


async def officer_accept(
    session: AsyncSession,
    *,
    complaint_id: str,
    officer_user_id: str,
) -> None:
    complaint = await _get_complaint(session, complaint_id)
    assignment = await _get_or_create_assignment(session, complaint_id)

    if complaint.status != ComplaintStatus.ASSIGNED:
        raise HTTPException(status_code=409, detail="Cannot accept unless status is ASSIGNED")
    if assignment.accepted_at is not None:
        raise HTTPException(status_code=409, detail="Already accepted")

    complaint.status = ComplaintStatus.ACCEPTED
    assignment.assigned_to = officer_user_id
    assignment.accepted_at = utc_now()

    await log_action(session, complaint_id=complaint_id, action_type=ActionType.ACCEPTED, user_id=officer_user_id)


async def officer_start(
    session: AsyncSession,
    *,
    complaint_id: str,
    officer_user_id: str,
) -> None:
    complaint = await _get_complaint(session, complaint_id)
    assignment = await _get_or_create_assignment(session, complaint_id)

    if complaint.status != ComplaintStatus.ACCEPTED:
        raise HTTPException(status_code=409, detail="Cannot start unless status is ACCEPTED")
    if assignment.accepted_at is None:
        raise HTTPException(status_code=409, detail="Cannot start before acceptance")

    complaint.status = ComplaintStatus.IN_PROGRESS
    assignment.started_at = assignment.started_at or utc_now()

    await log_action(session, complaint_id=complaint_id, action_type=ActionType.STARTED, user_id=officer_user_id)


async def officer_resolve(
    session: AsyncSession,
    *,
    complaint_id: str,
    officer_user_id: str,
    proof_url: str | None = None,
) -> None:
    complaint = await _get_complaint(session, complaint_id)
    assignment = await _get_or_create_assignment(session, complaint_id)

    if complaint.status != ComplaintStatus.IN_PROGRESS:
        raise HTTPException(status_code=409, detail="Cannot resolve unless status is IN_PROGRESS")

    complaint.status = ComplaintStatus.RESOLVED
    assignment.resolved_at = utc_now()

    await log_action(
        session,
        complaint_id=complaint_id,
        action_type=ActionType.RESOLVED,
        user_id=officer_user_id,
        payload={"proof_url": proof_url} if proof_url else None,
    )


async def citizen_confirm(
    session: AsyncSession,
    *,
    complaint_id: str,
    citizen_email: str | None,
) -> None:
    complaint = await _get_complaint(session, complaint_id)
    assignment = await _get_or_create_assignment(session, complaint_id)

    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(status_code=409, detail="Cannot confirm unless status is RESOLVED")
    if complaint.email and citizen_email and complaint.email.lower() != citizen_email.lower():
        raise HTTPException(status_code=403, detail="Email does not match complaint record")

    complaint.status = ComplaintStatus.CLOSED
    assignment.closed_at = utc_now()

    await log_action(session, complaint_id=complaint_id, action_type=ActionType.CONFIRMED, user_id=None)
    await log_action(session, complaint_id=complaint_id, action_type=ActionType.CLOSED, user_id=None)


async def citizen_reject(
    session: AsyncSession,
    *,
    complaint_id: str,
    citizen_email: str | None,
    reason: str | None,
) -> None:
    complaint = await _get_complaint(session, complaint_id)
    assignment = await _get_or_create_assignment(session, complaint_id)

    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(status_code=409, detail="Cannot reject unless status is RESOLVED")
    if complaint.email and citizen_email and complaint.email.lower() != citizen_email.lower():
        raise HTTPException(status_code=403, detail="Email does not match complaint record")

    complaint.status = ComplaintStatus.IN_PROGRESS
    assignment.resolved_at = None

    await log_action(
        session,
        complaint_id=complaint_id,
        action_type=ActionType.REJECTED,
        user_id=None,
        payload={"reason": reason} if reason else None,
    )


async def run_sla_jobs(
    session: AsyncSession,
    *,
    policy: SlaPolicy,
) -> dict[str, int]:
    now = utc_now()

    # Escalate: not accepted within X hours after assigned_at
    escalated = 0
    q = (
        select(Assignment, Complaint)
        .join(Complaint, Complaint.id == Assignment.complaint_id)
        .where(Complaint.status == ComplaintStatus.ASSIGNED)
    )
    for assignment, complaint in (await session.execute(q)).all():
        if not assignment.assigned_at:
            continue
        if assignment.escalated_at is not None:
            continue
        if now >= assignment.assigned_at + timedelta(hours=int(policy.accept_within_hours)):
            assignment.escalated_at = now
            assignment.escalation_reason = f"Not accepted within {policy.accept_within_hours} hours"
            escalated += 1
            await log_action(
                session,
                complaint_id=str(complaint.id),
                action_type=ActionType.AUTO_ESCALATED,
                user_id=None,
                payload={"reason": assignment.escalation_reason},
            )

    # Auto-close: RESOLVED and no feedback after X days (based on resolved_at)
    auto_closed = 0
    q2 = (
        select(Assignment, Complaint)
        .join(Complaint, Complaint.id == Assignment.complaint_id)
        .where(Complaint.status == ComplaintStatus.RESOLVED)
    )
    for assignment, complaint in (await session.execute(q2)).all():
        if not assignment.resolved_at:
            continue
        if now >= assignment.resolved_at + timedelta(days=int(policy.auto_close_after_days)):
            complaint.status = ComplaintStatus.CLOSED
            assignment.closed_at = now
            auto_closed += 1
            await log_action(
                session,
                complaint_id=str(complaint.id),
                action_type=ActionType.AUTO_CLOSED,
                user_id=None,
                payload={"days": policy.auto_close_after_days},
            )
            await log_action(session, complaint_id=str(complaint.id), action_type=ActionType.CLOSED, user_id=None)

    return {"auto_escalated": escalated, "auto_closed": auto_closed}

