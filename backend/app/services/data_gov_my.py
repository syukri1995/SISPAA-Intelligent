from __future__ import annotations

import httpx


async def fetch_fuel_price_snapshot(limit: int = 3) -> dict:
    """
    Real external integration (api.data.gov.my).
    Dataset: data-catalogue?id=fuelprice
    """
    url = "https://api.data.gov.my/data-catalogue"
    params = {"id": "fuelprice", "limit": str(limit)}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return {"source": "api.data.gov.my", "dataset": "fuelprice", "data": r.json()}

