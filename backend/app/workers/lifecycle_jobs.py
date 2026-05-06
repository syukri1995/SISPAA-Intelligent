from __future__ import annotations

import asyncio

from app.core.config import settings
from app.core.lifecycle import SlaPolicy
from app.db.session import SessionLocal
from app.services.lifecycle_service import run_sla_jobs


_task: asyncio.Task | None = None


def _policy() -> SlaPolicy:
    return SlaPolicy(
        accept_within_hours=settings.sla_accept_within_hours,
        auto_close_after_days=settings.sla_auto_close_after_days,
        deadline_hours_low=settings.sla_deadline_hours_low,
        deadline_hours_medium=settings.sla_deadline_hours_medium,
        deadline_hours_high=settings.sla_deadline_hours_high,
    )


async def _loop() -> None:
    interval = max(10, int(settings.lifecycle_job_interval_seconds))
    while True:
        try:
            async with SessionLocal() as session:
                await run_sla_jobs(session, policy=_policy())
                await session.commit()
        except Exception:
            # Best-effort background job; failures should not crash API.
            pass
        await asyncio.sleep(interval)


def start_lifecycle_jobs() -> None:
    global _task
    if _task and not _task.done():
        return
    _task = asyncio.create_task(_loop())

