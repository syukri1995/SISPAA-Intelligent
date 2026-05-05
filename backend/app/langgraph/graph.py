from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.langgraph.state import RouterState, new_work_order_id
from app.services.classifier import classify_complaint
from app.services.data_gov_my import fetch_fuel_price_snapshot
from app.services.email import render_citizen_email
from app.services.priority import detect_priority


async def sense_node(state: RouterState) -> RouterState:
    complaint_text = state["complaint_text"]
    location_text = state.get("location_text")
    image_url = state.get("image_url")

    metadata: dict = {
        "length": len(complaint_text),
        "has_location": bool(location_text),
        "has_image": bool(image_url),
    }

    # Real external integration (api.data.gov.my) for enrichment/audit.
    try:
        metadata["fuelprice_snapshot"] = await fetch_fuel_price_snapshot(limit=3)
    except Exception as e:
        metadata["fuelprice_snapshot_error"] = str(e)

    return {
        **state,
        "metadata": metadata,
        "current_step": "Sense",
        "status": "SENSED",
    }


async def reason_node(state: RouterState) -> RouterState:
    result = await classify_complaint(state["complaint_text"])
    retry = int(state.get("retry_count", 0))

    return {
        **state,
        "category": result.category,
        "agency": result.agency,
        "confidence": float(result.confidence),
        "retry_count": retry + 1,
        "current_step": "Reason",
        "status": "CLASSIFIED",
        "metadata": {**state.get("metadata", {}), "classification_raw": result.raw},
    }


def should_retry(state: RouterState) -> str:
    conf = float(state.get("confidence", 0.0))
    retry_count = int(state.get("retry_count", 0))
    if conf < 0.7 and retry_count < 3:
        return "retry"
    return "act"


async def act_node(state: RouterState) -> RouterState:
    work_order_id = new_work_order_id()
    priority = detect_priority(state["complaint_text"])
    agency = state.get("agency", "OTHER")
    category = state.get("category", "Other")

    description = f"[{category}] {state['complaint_text']}".strip()
    email_preview = render_citizen_email(category=category, agency=agency, work_order_id=work_order_id, priority=priority)

    return {
        **state,
        "work_order_id": work_order_id,
        "priority": priority,
        "work_order_description": description,
        "citizen_email_preview": email_preview,
        "current_step": "Act",
        "status": "COMPLETED",
    }


def build_router_graph():
    g = StateGraph(RouterState)
    g.add_node("sense", sense_node)
    g.add_node("reason", reason_node)
    g.add_node("act", act_node)

    g.set_entry_point("sense")
    g.add_edge("sense", "reason")
    g.add_conditional_edges("reason", should_retry, {"retry": "reason", "act": "act"})
    g.add_edge("act", END)
    return g.compile()


router_graph = build_router_graph()

