from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.audit import audit


async def simulate_agency_work_order_post(
    session: AsyncSession, *, complaint_id: str, agency: str, work_order_id: str, payload: dict
) -> None:
    await audit(
        session,
        complaint_id=complaint_id,
        event_type="AGENCY_ROUTED",
        message=f"Simulated routing to agency={agency} work_order_id={work_order_id}",
        payload={"agency": agency, "work_order_id": work_order_id, "payload": payload},
    )

