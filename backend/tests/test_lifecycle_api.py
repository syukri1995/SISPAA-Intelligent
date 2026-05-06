import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_lifecycle_create_and_actions(async_client: AsyncClient):
    # Create complaint (SUBMITTED -> ASSIGNED via AI)
    create = await async_client.post(
        "/complaints",
        json={"title": "Road issue", "description": "Pothole near sekolah, dangerous for motosikal", "email": "citizen@example.com"},
    )
    assert create.status_code == 200
    c = create.json()
    assert c["id"]
    assert c["status"] == "ASSIGNED"

    complaint_id = c["id"]

    # Officer endpoints require auth; expect 401 without token
    r = await async_client.post(f"/complaints/{complaint_id}/accept")
    assert r.status_code in (401, 403)

    # Citizen confirm/reject should fail unless RESOLVED
    r2 = await async_client.post(f"/complaints/{complaint_id}/confirm", json={"email": "citizen@example.com"})
    assert r2.status_code == 409

    # Actions endpoint exists
    actions = await async_client.get(f"/complaints/{complaint_id}/actions")
    assert actions.status_code == 200
    items = actions.json()
    assert isinstance(items, list)
    assert any(i["action_type"] in ("SUBMITTED", "ASSIGNED") for i in items)

