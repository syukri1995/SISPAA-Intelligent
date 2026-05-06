from __future__ import annotations

from typing import Annotated
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import WorkOrder, Complaint, Classification
from app.db.user_models import User
from app.db.session import get_session
from app.services.auth import decode_access_token
from app.core.dependencies import get_current_user_id, get_current_user
from app.core.constants import UserRole

router = APIRouter(prefix="/worker", tags=["worker"])


@router.get("/dashboard")
async def worker_dashboard(
    user: Annotated[User, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """Get worker dashboard metrics."""
    # Only workers, supervisors, and admins can access
    if user.role not in [UserRole.WORKER.value, UserRole.SUPERVISOR.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    user_id = str(user.id)
    
    # Work orders assigned to this worker
    assigned_q = select(func.count(WorkOrder.id)).where(
        (WorkOrder.assigned_to == user_id) & (WorkOrder.status != "COMPLETED")
    )
    assigned_count = (await session.execute(assigned_q)).scalar_one()

    # Pending work orders in their agency
    pending_q = select(func.count(WorkOrder.id)).where(WorkOrder.status == "PENDING")
    pending_count = (await session.execute(pending_q)).scalar_one()

    # Completed work orders by this worker
    completed_q = select(func.count(WorkOrder.id)).where(
        (WorkOrder.assigned_to == user_id) & (WorkOrder.status == "COMPLETED")
    )
    completed_count = (await session.execute(completed_q)).scalar_one()

    return {
        "assigned_to_me": int(assigned_count),
        "pending_in_agency": int(pending_count),
        "completed_by_me": int(completed_count),
    }


@router.get("/my-work-orders")
async def my_work_orders(
    user: Annotated[User, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """Get all work orders assigned to current worker."""
    user_id = str(user.id)
    q = (
        select(WorkOrder)
        .where(WorkOrder.assigned_to == user_id)
        .order_by(WorkOrder.created_at.desc())
    )
    result = await session.execute(q)
    work_orders = list(result.scalars().all())

    return [
        {
            "id": wo.id,
            "agency": wo.agency,
            "priority": wo.priority,
            "status": wo.status,
            "description": wo.description,
            "assigned_at": wo.assigned_at.isoformat() if wo.assigned_at else None,
            "created_at": wo.created_at.isoformat() if wo.created_at else None,
        }
        for wo in work_orders
    ]


@router.get("/pending-work-orders")
async def pending_work_orders(
    user: Annotated[User, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """Get all pending work orders (for assignment by supervisors/admins)."""
    # Only supervisors and admins can view pending work orders
    if user.role not in [UserRole.SUPERVISOR.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Supervisors and admins only")
    
    q = select(WorkOrder).where(WorkOrder.status == "PENDING").order_by(WorkOrder.created_at.asc())
    result = await session.execute(q)
    work_orders = list(result.scalars().all())

    out = []
    for wo in work_orders:
        # Get complaint details
        complaint_q = select(Complaint).where(Complaint.id == wo.complaint_id)
        complaint = (await session.execute(complaint_q)).scalar_one_or_none()

        # Get classification
        classification_q = select(Classification).where(Classification.complaint_id == wo.complaint_id)
        classification = (await session.execute(classification_q)).scalar_one_or_none()

        out.append(
            {
                "id": wo.id,
                "complaint_id": wo.complaint_id,
                "complaint_text": complaint.complaint_text if complaint else None,
                "category": classification.category if classification else None,
                "agency": wo.agency,
                "priority": wo.priority,
                "description": wo.description,
                "status": wo.status,
                "created_at": wo.created_at.isoformat() if wo.created_at else None,
            }
        )

    return out


@router.post("/assign/{work_order_id}")
async def assign_work_order(
    work_order_id: str,
    user: Annotated[User, Depends(get_current_user)],
    assign_to_user_id: str = Body(..., embed=True),
    session: AsyncSession = Depends(get_session),
):
    """Assign a work order to a worker (supervisor/admin only)."""
    # Only supervisors and admins can assign
    if user.role not in [UserRole.SUPERVISOR.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Supervisors and admins only")
    
    # Get work order
    q = select(WorkOrder).where(WorkOrder.id == work_order_id)
    wo = (await session.execute(q)).scalar_one_or_none()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Update assignment
    wo.assigned_to = assign_to_user_id
    wo.assigned_by = str(user.id)
    wo.assigned_at = datetime.now(timezone.utc)
    wo.status = "IN_PROGRESS"

    await session.commit()

    return {
        "id": wo.id,
        "status": wo.status,
        "assigned_to": wo.assigned_to,
        "assigned_at": wo.assigned_at.isoformat(),
    }


@router.post("/complete/{work_order_id}")
async def complete_work_order(
    work_order_id: str,
    user: Annotated[User, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
):
    """Mark a work order as completed."""
    user_id = str(user.id)
    
    # Get work order
    q = select(WorkOrder).where(WorkOrder.id == work_order_id)
    wo = (await session.execute(q)).scalar_one_or_none()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Only assigned worker can complete
    if wo.assigned_to != user_id:
        raise HTTPException(status_code=403, detail="Only assigned worker can complete")

    wo.status = "COMPLETED"
    wo.completed_at = datetime.now(timezone.utc)

    # Update complaint status
    complaint_q = select(Complaint).where(Complaint.id == wo.complaint_id)
    complaint = (await session.execute(complaint_q)).scalar_one_or_none()
    if complaint:
        complaint.status = "COMPLETED"

    await session.commit()

    return {
        "id": wo.id,
        "status": wo.status,
        "completed_at": wo.completed_at.isoformat(),
    }
