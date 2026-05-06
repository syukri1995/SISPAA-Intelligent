from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Complaint
from app.db.session import get_session


router = APIRouter(prefix="/insights", tags=["insights"])


def _bucket_day(ts: datetime) -> str:
    return ts.astimezone(timezone.utc).strftime("%Y-%m-%d")


@router.get("")
async def get_insights(session: AsyncSession = Depends(get_session)):
    """
    Smart Insights Panel data:
    - common categories
    - simple trend detection (last 7 days vs previous 7 days)
    - recommended actions (rule-based text suggestions; can be upgraded to LLM)
    """
    now = datetime.now(timezone.utc)
    start_14 = now - timedelta(days=14)

    q = select(Complaint).where(Complaint.created_at >= start_14)
    rows = list((await session.execute(q)).scalars().all())

    # Category counts
    categories = [c.category or "Uncategorized" for c in rows]
    cat_counts = Counter(categories)
    top_categories = [{"category": k, "count": int(v)} for k, v in cat_counts.most_common(8)]

    # Daily counts for chart
    per_day = defaultdict(int)
    for c in rows:
        if c.created_at:
            per_day[_bucket_day(c.created_at)] += 1
    trend_series = [{"day": d, "count": per_day[d]} for d in sorted(per_day.keys())]

    # Rising issues: compare last 7d vs previous 7d
    mid = now - timedelta(days=7)
    prev = [c.category or "Uncategorized" for c in rows if c.created_at and start_14 <= c.created_at < mid]
    last = [c.category or "Uncategorized" for c in rows if c.created_at and mid <= c.created_at <= now]
    prev_counts = Counter(prev)
    last_counts = Counter(last)

    rising = []
    for k, v in last_counts.items():
        pv = prev_counts.get(k, 0)
        if pv == 0 and v >= 3:
            rising.append({"category": k, "delta": int(v), "direction": "up"})
        elif pv > 0:
            change = (v - pv) / pv
            if change >= 0.5 and v >= 3:
                rising.append({"category": k, "delta": int(v - pv), "direction": "up"})
    rising = sorted(rising, key=lambda x: x["delta"], reverse=True)[:5]

    # Suggested actions (simple rules)
    actions = []
    for item in rising:
        cat = item["category"]
        if "Infrastructure" in cat or "Road" in cat:
            actions.append({"title": "Deploy rapid repair team", "detail": "Increase field inspections and prioritize pothole / drainage reports in hotspot areas."})
        elif "Transport" in cat:
            actions.append({"title": "Coordinate with operators", "detail": "Investigate route delays, enforce fare rules, and increase enforcement at key stations."})
        elif "Healthcare" in cat:
            actions.append({"title": "Escalate facility audit", "detail": "Review staffing and maintenance at affected facilities and open a fast-track incident channel."})
        else:
            actions.append({"title": "Supervisor review", "detail": "Improve routing rules and confirm responsible agency for this category."})
    if not actions and top_categories:
        actions.append({"title": "Focus resources", "detail": f"Most common category is {top_categories[0]['category']}. Consider a targeted response plan."})

    return {
        "top_categories": top_categories,
        "trend_series": trend_series,
        "rising": rising,
        "suggested_actions": actions[:4],
    }

