from __future__ import annotations


def render_citizen_email(category: str, agency: str, work_order_id: str, priority: str) -> str:
    return (
        "Subject: Update on your SISPAA complaint\n\n"
        "Assalamualaikum / Salam sejahtera,\n\n"
        "Thank you for your report. Our system has processed your complaint and routed it to the responsible authority.\n\n"
        f"- Category: {category}\n"
        f"- Agency: {agency}\n"
        f"- Priority: {priority}\n"
        f"- Work Order ID: {work_order_id}\n\n"
        "You may quote the Work Order ID for follow-up. We will provide updates as the case progresses.\n\n"
        "Regards,\n"
        "SISPAA Intelligent Router\n"
    )

