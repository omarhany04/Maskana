import re
from typing import Literal

from app.models.schemas import AnalyzeResponse


PROPERTY_TYPES = [
    "apartment",
    "villa",
    "townhouse",
    "penthouse",
    "duplex",
    "studio",
    "office",
    "shop",
    "land",
    "warehouse",
]

INTENT_KEYWORDS: dict[Literal["buy", "rent", "sell", "invest"], tuple[str, ...]] = {
    "buy": ("buy", "purchase", "own", "mortgage"),
    "rent": ("rent", "lease", "monthly"),
    "sell": ("sell", "list", "offload"),
    "invest": ("invest", "yield", "roi", "return"),
}


def _extract_budget(text: str) -> int | None:
    normalized = text.lower().replace(",", "")

    patterns = [
        r"(?:under|below|max|budget|up to)\s*\$?(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?",
        r"\$?(\d+(?:\.\d+)?)\s*(m|million|k|thousand)",
    ]

    for pattern in patterns:
        match = re.search(pattern, normalized)
        if not match:
            continue

        amount = float(match.group(1))
        suffix = (match.group(2) or "").lower()

        if suffix in {"m", "million"}:
            amount *= 1_000_000
        elif suffix in {"k", "thousand"}:
            amount *= 1_000

        return int(amount)

    return None



def _extract_location(text: str) -> str | None:
    match = re.search(r"(?:in|at|near)\s+([a-zA-Z][a-zA-Z\s-]{2,})", text)
    if not match:
        return None

    return match.group(1).strip().title()


def _extract_property_type(text: str) -> str | None:
    lowered = text.lower()
    for property_type in PROPERTY_TYPES:
        if property_type in lowered:
            return property_type.title()
    return None


def _extract_intent(text: str) -> Literal["buy", "rent", "sell", "invest", "unknown"]:
    lowered = text.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return intent
    return "unknown"


def analyze_query(query: str) -> AnalyzeResponse:
    lowered = query.lower()
    keywords = sorted({token for token in re.findall(r"[a-zA-Z]{3,}", lowered) if token not in {"with", "that", "this", "from"}})

    return AnalyzeResponse(
        budget=_extract_budget(query),
        location=_extract_location(query),
        propertyType=_extract_property_type(query),
        intent=_extract_intent(query),
        keywords=keywords[:12],
    )
