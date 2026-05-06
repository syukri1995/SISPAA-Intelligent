from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.lifecycle import ComplaintStatus, SlaPolicy
from app.db.models import ActionLog, Assignment, Complaint
from app.db.session import get_session
from app.schemas.lifecycle import (
    ActionLogOut,
    CitizenConfirmIn,
    CitizenRejectIn,
    ComplaintCreateV2,
    ComplaintOut,
    OfficerResolveIn,
)
from app.services.lifecycle_service import (
    auto_assign_after_ai,
    citizen_confirm,
    citizen_reject,
    create_complaint,
    log_action,
    officer_accept,
    officer_resolve,
    officer_start,
)
from app.langgraph.graph import router_graph
from app.langgraph.state import RouterState


router = APIRouter(prefix="/complaints", tags=["complaints"])


def _policy() -> SlaPolicy:
    return SlaPolicy(
        accept_within_hours=settings.sla_accept_within_hours,
        auto_close_after_days=settings.sla_auto_close_after_days,
        deadline_hours_low=settings.sla_deadline_hours_low,
        deadline_hours_medium=settings.sla_deadline_hours_medium,
        deadline_hours_high=settings.sla_deadline_hours_high,
    )


def _to_out(c: Complaint, a: Assignment | None) -> ComplaintOut:
    return ComplaintOut(
        id=str(c.id),
        title=c.title,
        description=(c.description or c.complaint_text),
        category=c.category,
        priority=c.priority,
        status=c.status,
        assigned_to=a.assigned_to if a else None,
        created_at=c.created_at.isoformat() if c.created_at else None,
        updated_at=c.updated_at.isoformat() if c.updated_at else None,
        assigned_at=a.assigned_at.isoformat() if a and a.assigned_at else None,
        accepted_at=a.accepted_at.isoformat() if a and a.accepted_at else None,
        started_at=a.started_at.isoformat() if a and a.started_at else None,
        resolved_at=a.resolved_at.isoformat() if a and a.resolved_at else None,
        closed_at=a.closed_at.isoformat() if a and a.closed_at else None,
        deadline_at=a.deadline_at.isoformat() if a and a.deadline_at else None,
        escalated_at=a.escalated_at.isoformat() if a and a.escalated_at else None,
        escalation_reason=a.escalation_reason if a else None,
    )


@router.post("", response_model=ComplaintOut)
async def post_complaints(payload: ComplaintCreateV2, session: AsyncSession = Depends(get_session)):
    """
    Create a complaint and run AI auto-routing.

    Strict flow:
    - creates complaint as SUBMITTED
    - runs AI (Sense→Reason) to determine category/agency/confidence/priority
    - sets complaint to ASSIGNED and creates/updates Assignment (assigned_at, deadline_at)
    """
    complaint = await create_complaint(
        session,
        title=payload.title,
        description=payload.description,
        email=str(payload.email) if payload.email else None,
        location_text=payload.location_text,
        image_url=payload.image_url,
    )

    # Run existing LangGraph workflow to preserve your AI logic.
    state_in: RouterState = {
        "complaint_id": str(complaint.id),
        "complaint_text": complaint.complaint_text,
        "location_text": complaint.location_text,
        "image_url": complaint.image_url,
        "retry_count": 0,
    }
    state_out = await router_graph.ainvoke(state_in)

    category = state_out.get("category")
    priority = state_out.get("priority") or "LOW"

    assignment = await auto_assign_after_ai(session, complaint=complaint, category=str(category) if category else None, priority=str(priority), policy=_policy())

    # We keep AI metadata in action log payload for traceability
    await log_action(
        session,
        complaint_id=str(complaint.id),
        action_type="AI_ROUTED",
        user_id=None,
        payload={
            "category": state_out.get("category"),
            "agency": state_out.get("agency"),
            "confidence": state_out.get("confidence"),
            "priority": state_out.get("priority"),
            "metadata": state_out.get("metadata", {}),
        },
    )

    await session.commit()
    await session.refresh(complaint)
    return _to_out(complaint, assignment)


@router.get("", response_model=list[ComplaintOut])
async def list_complaints(
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    q = select(Complaint).order_by(Complaint.created_at.desc()).limit(limit)
    if status:
        q = q.where(Complaint.status == status)
    res = await session.execute(q)
    complaints = list(res.scalars().all())

    # Fetch assignments in one go
    ids = [str(c.id) for c in complaints]
    a_map: dict[str, Assignment] = {}
    if ids:
        a_res = await session.execute(select(Assignment).where(Assignment.complaint_id.in_(ids)))
        for a in a_res.scalars().all():
            a_map[str(a.complaint_id)] = a

    return [_to_out(c, a_map.get(str(c.id))) for c in complaints]


@router.get("/{complaint_id}", response_model=ComplaintOut)
async def get_complaint(complaint_id: str, session: AsyncSession = Depends(get_session)):
    c = (await session.execute(select(Complaint).where(Complaint.id == complaint_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    a = (await session.execute(select(Assignment).where(Assignment.complaint_id == complaint_id))).scalar_one_or_none()
    return _to_out(c, a)


# Officer actions (JWT required)
@router.post("/{complaint_id}/accept", response_model=ComplaintOut)
async def accept_job(
    complaint_id: str,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await officer_accept(session, complaint_id=complaint_id, officer_user_id=str(user.id))
    await session.commit()
    c = (await session.execute(select(Complaint).where(Complaint.id == complaint_id))).scalar_one()
    a = (await session.execute(select(Assignment).where(Assignment.complaint_id == complaint_id))).scalar_one_or_none()
    return _to_out(c, a)


@router.post("/{complaint_id}/start", response_model=ComplaintOut)
async def start_work(
    complaint_id: str,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await officer_start(session, complaint_id=complaint_id, officer_user_id=str(user.id))
    await session.commit()
    c = (await session.execute(select(Complaint).where(Complaint.id == complaint_id))).scalar_one()
    a = (await session.execute(select(Assignment).where(Assignment.complaint_id == complaint_id))).scalar_one_or_none()
    return _to_out(c, a)


@router.post("/{complaint_id}/resolve", response_model=ComplaintOut)
async def mark_resolved(
    complaint_id: str,
    payload: OfficerResolveIn,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await officer_resolve(session, complaint_id=complaint_id, officer_user_id=str(user.id), proof_url=payload.proof_url)
    await session.commit()
    c = (await session.execute(select(Complaint).where(Complaint.id == complaint_id))).scalar_one()
    a = (await session.execute(select(Assignment).where(Assignment.complaint_id == complaint_id))).scalar_one_or_none()
    return _to_out(c, a)


# Citizen actions (email check if complaint has email)
@router.post("/{complaint_id}/confirm", response_model=ComplaintOut)
async def confirm_resolution(complaint_id: str, payload: CitizenConfirmIn, session: AsyncSession = Depends(get_session)):
    await citizen_confirm(session, complaint_id=complaint_id, citizen_email=str(payload.email) if payload.email else None)
    await session.commit()
    c = (await session.execute(select(Complaint).where(Complaint.id == complaint_id))).scalar_one()
    a = (await session.execute(select(Assignment).where(Assignment.complaint_id == complaint_id))).scalar_one_or_none()
    return _to_out(c, a)


@router.post("/{complaint_id}/reject", response_model=ComplaintOut)
async def reject_resolution(complaint_id: str, payload: CitizenRejectIn, session: AsyncSession = Depends(get_session)):
    await citizen_reject(
        session,
        complaint_id=complaint_id,
        citizen_email=str(payload.email) if payload.email else None,
        reason=payload.reason,
    )
    await session.commit()
    c = (await session.execute(select(Complaint).where(Complaint.id == complaint_id))).scalar_one()
    a = (await session.execute(select(Assignment).where(Assignment.complaint_id == complaint_id))).scalar_one_or_none()
    return _to_out(c, a)


@router.get("/{complaint_id}/actions", response_model=list[ActionLogOut])
async def get_actions(complaint_id: str, session: AsyncSession = Depends(get_session)):
    q = select(ActionLog).where(ActionLog.complaint_id == complaint_id).order_by(ActionLog.timestamp.asc())
    res = await session.execute(q)
    logs = list(res.scalars().all())
    return [
        ActionLogOut(
            id=str(l.id),
            complaint_id=str(l.complaint_id),
            action_type=l.action_type,
            user_id=l.user_id,
            payload=l.payload,
            timestamp=l.timestamp.isoformat() if l.timestamp else None,
        )
        for l in logs
    ]

