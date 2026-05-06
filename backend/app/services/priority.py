from __future__ import annotations


def detect_priority(complaint_text: str) -> str:
    t = complaint_text.lower()
    high = ["accident", "urgent", "injury", "danger", "fire", "collapsed", "bleeding"]
    medium = [
        "broken",
        "delay",
        "jam",
        "not working",
        "malfunction",
        "leak",
        "banjir",
        "pothole",
        "jalan rosak",
        "rosak teruk",
        "scam",
        "ripoff",
        "overcharge",
        "asked for rm",
        "tanpa meter",
        "without meter",
    ]

    if any(k in t for k in high):
        return "HIGH"
    if any(k in t for k in medium):
        return "MEDIUM"
    return "LOW"

