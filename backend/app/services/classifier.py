from __future__ import annotations

import json
import re
from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class ClassificationResult:
    category: str
    agency: str
    confidence: float
    raw: dict


def _heuristic_classify(text: str) -> ClassificationResult:
    t = text.lower()

    # Priority keywords used later too; keep confidence slightly higher when severe.
    severe = any(k in t for k in ["accident", "urgent", "injury", "danger", "collapsed", "fire"])

    if any(k in t for k in ["bus", "lrt", "mrt", "train", "rapid", "bas", "teksi", "grab", "public transport"]):
        return ClassificationResult(
            category="Public Transport Issue",
            agency="APAD",
            confidence=0.78 if severe else 0.74,
            raw={"mode": "heuristic"},
        )

    if any(k in t for k in ["clinic", "hospital", "doctor", "medicine", "appointment", "kkm", "healthcare"]):
        return ClassificationResult(
            category="Healthcare Service",
            agency="KKM",
            confidence=0.80 if severe else 0.76,
            raw={"mode": "heuristic"},
        )

    if any(k in t for k in ["pothole", "road", "jalan", "lampu", "streetlight", "drain", "longkang", "banjir"]):
        return ClassificationResult(
            category="Infrastructure Damage",
            agency="DBKL",
            confidence=0.79 if severe else 0.73,
            raw={"mode": "heuristic"},
        )

    if any(k in t for k in ["toilet", "park", "playground", "rubbish", "trash", "bin", "public facility"]):
        return ClassificationResult(
            category="Public Facilities",
            agency="DBKL",
            confidence=0.75,
            raw={"mode": "heuristic"},
        )

    return ClassificationResult(
        category="Other",
        agency="OTHER",
        confidence=0.60,
        raw={"mode": "heuristic"},
    )


async def classify_complaint(text: str) -> ClassificationResult:
    """
    Uses Groq if GROQ_API_KEY is configured; otherwise falls back to heuristic.
    Returns strictly-typed JSON shape: {category, agency, confidence}
    """
    if not settings.groq_api_key:
        return _heuristic_classify(text)

    try:
        # Lazy import to keep local installs simple.
        from groq import AsyncGroq  # type: ignore

        client = AsyncGroq(api_key=settings.groq_api_key)

        system = (
            "You are a GovTech complaint router. "
            "Classify a complaint into one of: "
            "Infrastructure Damage, Public Transport Issue, Healthcare Service, Public Facilities, Other. "
            "Then map to agency: DBKL for city issues/facilities/infrastructure, APAD for public transport, KKM for healthcare, OTHER otherwise. "
            "Return ONLY valid JSON with keys: category (string), agency (string), confidence (number 0-1)."
        )
        user = f"Complaint:\n{text}"

        resp = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=200,
        )

        content = resp.choices[0].message.content or ""
        # Best-effort JSON extraction (guards against accidental prose).
        m = re.search(r"\{[\s\S]*\}", content)
        payload = json.loads(m.group(0) if m else content)

        category = str(payload.get("category", "Other"))
        agency = str(payload.get("agency", "OTHER"))
        confidence = float(payload.get("confidence", 0.0))

        return ClassificationResult(
            category=category,
            agency=agency,
            confidence=max(0.0, min(1.0, confidence)),
            raw={"mode": "groq", "model": settings.groq_model, "response": payload},
        )
    except Exception as exc:
        fallback = _heuristic_classify(text)
        return ClassificationResult(
            category=fallback.category,
            agency=fallback.agency,
            confidence=fallback.confidence,
            raw={"mode": "heuristic-fallback", "error": str(exc)},
        )

