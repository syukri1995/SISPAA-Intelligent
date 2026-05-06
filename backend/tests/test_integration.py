import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_full_pipeline_execution(async_client: AsyncClient):
    """
    Integration test: Input complaint -> full pipeline -> verify outputs.
    """
    payload = {
        "complaint_text": "The hospital emergency room is completely flooded and dangerous",
        "location_text": "Kuala Lumpur Hospital",
        "email": "citizen@example.com"
    }
    
    # 1. Input complaint
    post_resp = await async_client.post("/complaint", json=payload)
    assert post_resp.status_code == 200
    data = post_resp.json()
    
    complaint_id = data["complaint_id"]
    work_order_id = data["work_order_id"]
    
    # 2. Verify pipeline execution results
    assert data["category"] in ["Healthcare Service", "Infrastructure Damage"]
    assert data["agency"] in ["KKM", "DBKL"]
    assert data["status"] == "COMPLETED"
    assert work_order_id is not None
    assert data["priority"] == "HIGH"  # 'flooded'/'dangerous' triggers high priority
    
    # 3. Verify logs created
    logs_resp = await async_client.get(f"/logs?limit=50")
    assert logs_resp.status_code == 200
    logs = logs_resp.json()
    
    complaint_logs = [log for log in logs if log.get("complaint_id") == complaint_id]
    events = [log["event_type"] for log in complaint_logs]
    
    assert "COMPLAINT_RECEIVED" in events
    assert "SENSE_COMPLETED" in events
    assert "REASON_COMPLETED" in events
    assert "ACT_COMPLETED" in events
