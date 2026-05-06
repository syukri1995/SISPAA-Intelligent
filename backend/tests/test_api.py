import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_healthz(async_client: AsyncClient):
    response = await async_client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

@pytest.mark.asyncio
async def test_submit_complaint(async_client: AsyncClient):
    payload = {
        "complaint_text": "Jalan rosak teruk dekat Johor",
        "location_text": "Johor",
        "email": "test@example.com"
    }
    response = await async_client.post("/complaint", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] is not None
    assert data["status"] == "COMPLETED"
    assert data["agency"] in ["DBKL", "APAD", "KKM", "OTHER"]
    
    # Check status endpoint
    complaint_id = data["complaint_id"]
    status_resp = await async_client.get(f"/status/{complaint_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["complaint_id"] == complaint_id

@pytest.mark.asyncio
async def test_get_logs(async_client: AsyncClient):
    # submit a complaint first
    await async_client.post("/complaint", json={
        "complaint_text": "Test complaint for logs"
    })
    
    response = await async_client.get("/logs?limit=10")
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    assert "event_type" in logs[0]
