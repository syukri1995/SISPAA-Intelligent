import pytest
from app.langgraph.graph import router_graph
from app.langgraph.state import RouterState

@pytest.mark.asyncio
async def test_langgraph_full_workflow():
    state_in: RouterState = {
        "complaint_id": "test-123",
        "complaint_text": "Pothole on Jalan Sudirman",
        "retry_count": 0
    }
    
    state_out = await router_graph.ainvoke(state_in)
    
    assert state_out["current_step"] == "Act"
    assert state_out["status"] == "COMPLETED"
    assert "work_order_id" in state_out
    assert "priority" in state_out
    assert state_out["agency"] == "DBKL"  # Based on heuristic fallback for "pothole"
    assert state_out["category"] == "Infrastructure Damage"

@pytest.mark.asyncio
async def test_langgraph_retry_logic():
    # If confidence < 0.7, it should retry the reason node up to 3 times.
    # We can test this by mocking the classifier to always return low confidence,
    # or by inspecting the should_retry logic directly.
    from app.langgraph.graph import should_retry
    
    # Condition: confidence < 0.7 and retry_count < 3
    state_retry: RouterState = {
        "confidence": 0.5,
        "retry_count": 1
    }
    assert should_retry(state_retry) == "retry"
    
    # Condition: retry_count reached 3
    state_act: RouterState = {
        "confidence": 0.5,
        "retry_count": 3
    }
    assert should_retry(state_act) == "act"
    
    # Condition: confidence >= 0.7
    state_high_conf: RouterState = {
        "confidence": 0.8,
        "retry_count": 0
    }
    assert should_retry(state_high_conf) == "act"
