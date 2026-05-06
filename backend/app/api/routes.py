from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Classification, Complaint, WorkOrder
from app.db.session import get_session
from app.langgraph.graph import router_graph
from app.langgraph.state import RouterState
from app.schemas.complaint import ComplaintCreate, ComplaintStatus
from app.schemas.logs import AuditLogOut
from app.services.agency_router import simulate_agency_work_order_post
from app.services.audit import audit, list_logs

router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"ok": True}


@router.post("/complaint", response_model=ComplaintStatus)
async def submit_complaint(payload: ComplaintCreate, session: AsyncSession = Depends(get_session)):
    try:
        complaint = Complaint(
            complaint_text=payload.complaint_text,
            location_text=payload.location_text,
            image_url=payload.image_url,
            email=payload.email,
            status="RECEIVED",
        )
        session.add(complaint)
        await session.commit()
        await session.refresh(complaint)

        complaint_id = str(complaint.id)
        await audit(session, complaint_id=complaint_id, event_type="COMPLAINT_RECEIVED", message="Complaint received")

        # Run LangGraph workflow (Sense → Reason (retry) → Act).
        state_in: RouterState = {
            "complaint_id": complaint_id,
            "complaint_text": complaint.complaint_text,
            "location_text": complaint.location_text,
            "image_url": complaint.image_url,
            "retry_count": 0,
        }
        state_out = await router_graph.ainvoke(state_in)

        await audit(
            session,
            complaint_id=complaint_id,
            event_type="SENSE_COMPLETED",
            message="Sense node completed",
            payload={"metadata": state_out.get("metadata", {})},
        )
        await audit(
            session,
            complaint_id=complaint_id,
            event_type="REASON_COMPLETED",
            message="Reason node completed",
            payload={
                "category": state_out.get("category"),
                "agency": state_out.get("agency"),
                "confidence": state_out.get("confidence"),
                "retries": state_out.get("retry_count"),
            },
        )

        # Persist classification
        classification = Classification(
            complaint_id=complaint.id,
            category=str(state_out.get("category", "Other")),
            agency=str(state_out.get("agency", "OTHER")),
            confidence=float(state_out.get("confidence", 0.0)),
            raw_json={
                "category": state_out.get("category"),
                "agency": state_out.get("agency"),
                "confidence": state_out.get("confidence"),
                "metadata": state_out.get("metadata", {}),
            },
        )
        session.add(classification)

        # Persist work order
        work_order = WorkOrder(
            id=str(state_out.get("work_order_id")),
            complaint_id=complaint.id,
            agency=str(state_out.get("agency", "OTHER")),
            priority=str(state_out.get("priority", "LOW")),
            description=str(state_out.get("work_order_description", "")),
            status="CREATED",
        )
        session.add(work_order)

        complaint.status = "COMPLETED"
        await session.commit()
        await session.refresh(complaint)

        complaint_created_at = complaint.created_at.isoformat() if complaint.created_at else None
        complaint_updated_at = complaint.updated_at.isoformat() if complaint.updated_at else None
        complaint_email = complaint.email
        complaint_text = complaint.complaint_text
        complaint_location = complaint.location_text
        complaint_status = complaint.status

        await audit(
            session,
            complaint_id=complaint_id,
            event_type="ACT_COMPLETED",
            message="Act node completed",
            payload={
                "work_order_id": str(work_order.id),
                "priority": work_order.priority,
                "email_preview": state_out.get("citizen_email_preview"),
            },
        )

        # Simulated routing call
        await simulate_agency_work_order_post(
            session,
            complaint_id=complaint_id,
            agency=work_order.agency,
            work_order_id=str(work_order.id),
            payload={
                "work_order_id": str(work_order.id),
                "agency": work_order.agency,
                "priority": work_order.priority,
                "description": work_order.description,
            },
        )

        return ComplaintStatus(
            complaint_id=complaint_id,
            status=complaint_status,
            current_step=state_out.get("current_step"),
            category=classification.category,
            agency=classification.agency,
            confidence=classification.confidence,
            work_order_id=str(work_order.id),
            priority=work_order.priority,
            citizen_email_preview=state_out.get("citizen_email_preview"),
            email=complaint_email,
            complaint_text=complaint_text,
            location_text=complaint_location,
            created_at=complaint_created_at,
            updated_at=complaint_updated_at,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Complaint processing failed: {exc}") from exc


@router.get("/status/{complaint_id}", response_model=ComplaintStatus)
async def get_status(complaint_id: str, session: AsyncSession = Depends(get_session)):
    if not complaint_id or len(complaint_id) < 8:
        raise HTTPException(status_code=400, detail="Invalid complaint id")

    q = select(Complaint).where(Complaint.id == complaint_id)
    res = await session.execute(q)
    complaint = res.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Not found")

    q2 = select(Classification).where(Classification.complaint_id == complaint.id)
    c2 = (await session.execute(q2)).scalar_one_or_none()
    q3 = select(WorkOrder).where(WorkOrder.complaint_id == complaint.id)
    w3 = (await session.execute(q3)).scalar_one_or_none()

    return ComplaintStatus(
        complaint_id=str(complaint.id),
        status=complaint.status,
        category=c2.category if c2 else None,
        agency=c2.agency if c2 else None,
        confidence=c2.confidence if c2 else None,
        work_order_id=str(w3.id) if w3 else None,
        priority=w3.priority if w3 else None,
        email=complaint.email,
        complaint_text=complaint.complaint_text,
        location_text=complaint.location_text,
        created_at=complaint.created_at.isoformat() if complaint.created_at else None,
        updated_at=complaint.updated_at.isoformat() if complaint.updated_at else None,
    )


@router.get("/complaint/{complaint_id}/status", response_model=ComplaintStatus)
async def get_complaint_status(complaint_id: str, session: AsyncSession = Depends(get_session)):
    return await get_status(complaint_id, session)


@router.get("/complaint/search", response_model=list[ComplaintStatus])
async def search_complaints(
    email: str = Query(..., description="Email address used to submit complaints"),
    session: AsyncSession = Depends(get_session),
):
    q = select(Complaint).where(Complaint.email == email).order_by(Complaint.created_at.desc())
    res = await session.execute(q)
    complaints = list(res.scalars().all())
    if not complaints:
        raise HTTPException(status_code=404, detail="No complaints found")

    results: list[ComplaintStatus] = []
    for complaint in complaints:
        c2 = (await session.execute(select(Classification).where(Classification.complaint_id == complaint.id))).scalar_one_or_none()
        w3 = (await session.execute(select(WorkOrder).where(WorkOrder.complaint_id == complaint.id))).scalar_one_or_none()
        results.append(
            ComplaintStatus(
                complaint_id=str(complaint.id),
                status=complaint.status,
                category=c2.category if c2 else None,
                agency=c2.agency if c2 else None,
                confidence=c2.confidence if c2 else None,
                work_order_id=str(w3.id) if w3 else None,
                priority=w3.priority if w3 else None,
                email=complaint.email,
                complaint_text=complaint.complaint_text,
                location_text=complaint.location_text,
                created_at=complaint.created_at.isoformat() if complaint.created_at else None,
                updated_at=complaint.updated_at.isoformat() if complaint.updated_at else None,
            )
        )

    return results


@router.get("/logs", response_model=list[AuditLogOut])
async def get_logs(limit: int = 200, session: AsyncSession = Depends(get_session)):
    logs = await list_logs(session, limit=limit)
    return [
        AuditLogOut(
            id=str(l.id),
            complaint_id=str(l.complaint_id) if l.complaint_id else None,
            event_type=l.event_type,
            message=l.message,
            payload=l.payload,
            created_at=l.created_at.isoformat(),
        )
        for l in logs
    ]


@router.get("/complaints/recent")
async def recent_complaints(limit: int = 25, session: AsyncSession = Depends(get_session)):
    q = select(Complaint).order_by(Complaint.created_at.desc()).limit(limit)
    res = await session.execute(q)
    items = list(res.scalars().all())
    out = []
    for c in items:
        c2 = (await session.execute(select(Classification).where(Classification.complaint_id == c.id))).scalar_one_or_none()
        out.append(
            {
                "id": str(c.id),
                "status": c.status,
                "timestamp": c.created_at.isoformat() if c.created_at else None,
                "category": c2.category if c2 else None,
                "agency": c2.agency if c2 else None,
                "confidence": c2.confidence if c2 else None,
            }
        )
    return out


@router.get("/metrics")
async def metrics(session: AsyncSession = Depends(get_session)):
    total_today_q = select(func.count(Complaint.id)).where(func.date(Complaint.created_at) == func.current_date())
    total_today = (await session.execute(total_today_q)).scalar_one()

    pending_q = select(func.count(Complaint.id)).where(Complaint.status != "COMPLETED")
    pending = (await session.execute(pending_q)).scalar_one()

    total_all_q = select(func.count(Complaint.id))
    total_all = (await session.execute(total_all_q)).scalar_one()

    # Prototype: "auto-resolved" == completed
    completed_q = select(func.count(Complaint.id)).where(Complaint.status == "COMPLETED")
    completed = (await session.execute(completed_q)).scalar_one()
    auto_resolved_pct = float(completed) / float(total_all) * 100.0 if total_all else 0.0

    return {
        "total_complaints_today": int(total_today),
        "pending_cases": int(pending),
        "auto_resolved_pct": round(auto_resolved_pct, 1),
        "avg_response_time_minutes": None,
    }


@router.post("/agency/{agency}/work-order")
async def agency_work_order(agency: str, payload: dict, session: AsyncSession = Depends(get_session)):
    complaint_id = payload.get("complaint_id")
    work_order_id = payload.get("work_order_id")
    await audit(
        session,
        complaint_id=complaint_id,
        event_type="AGENCY_API_RECEIVED",
        message=f"Agency endpoint received work order agency={agency} work_order_id={work_order_id}",
        payload=payload,
    )
    return {"ok": True, "agency": agency, "work_order_id": work_order_id}

