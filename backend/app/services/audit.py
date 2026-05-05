from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuditLog


async def audit(session: AsyncSession, *, complaint_id: str | None, event_type: str, message: str, payload: dict | None = None) -> None:
    session.add(
        AuditLog(
            complaint_id=complaint_id,
            event_type=event_type,
            message=message,
            payload=payload,
        )
    )
    await session.commit()


async def list_logs(session: AsyncSession, limit: int = 200) -> list[AuditLog]:
    q = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    res = await session.execute(q)
    return list(res.scalars().all())

