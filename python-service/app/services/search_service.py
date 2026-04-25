import re
from dataclasses import dataclass

from app.models.schemas import SearchMatch
from app.services.analysis_service import analyze_query
from app.services.vector_store import property_vector_store


BEDROOM_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}


@dataclass(frozen=True)
class SearchConstraints:
    max_price: int | None
    min_bedrooms: int | None
    property_type: str | None
    location: str | None


def _extract_min_bedrooms(query: str) -> int | None:
    lowered = query.lower()
    numeric_match = re.search(r"\b(\d+)\s*(?:bed|beds|bedroom|bedrooms|bd|br)\b", lowered)
    if numeric_match:
        return int(numeric_match.group(1))

    for word, value in BEDROOM_WORDS.items():
        if re.search(rf"\b{word}\s*(?:bed|beds|bedroom|bedrooms)\b", lowered):
            return value

    return None


def _build_constraints(query: str) -> SearchConstraints:
    analysis = analyze_query(query)
    return SearchConstraints(
        max_price=analysis.budget,
        min_bedrooms=_extract_min_bedrooms(query),
        property_type=analysis.property_type,
        location=analysis.location,
    )


def _metadata_number(match: SearchMatch, key: str) -> float | None:
    value = match.metadata.get(key)
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _text_tokens(value: str | None) -> list[str]:
    if not value:
        return []

    return [token for token in re.findall(r"[a-z0-9]+", value.lower()) if len(token) >= 2]


def _matches_location(match: SearchMatch, location: str | None) -> bool:
    tokens = _text_tokens(location)
    if not tokens:
        return True

    haystack = " ".join(
        [
            match.location,
            str(match.metadata.get("address", "")),
            match.title,
            match.description,
        ]
    ).lower()

    return all(token in haystack for token in tokens)


def _matches_property_type(match: SearchMatch, property_type: str | None) -> bool:
    if not property_type:
        return True

    expected = property_type.lower()
    actual = match.property_type.lower()
    return expected in actual or actual in expected


def _matches_constraints(match: SearchMatch, constraints: SearchConstraints) -> bool:
    if constraints.max_price is not None and match.price > constraints.max_price:
        return False

    bedrooms = _metadata_number(match, "bedrooms")
    if constraints.min_bedrooms is not None and bedrooms is not None and bedrooms < constraints.min_bedrooms:
        return False

    if not _matches_property_type(match, constraints.property_type):
        return False

    return _matches_location(match, constraints.location)


def semantic_property_search(company_id: str, query: str, limit: int) -> list[SearchMatch]:
    constraints = _build_constraints(query)
    fetch_limit = max(limit * 5, 20)
    matches = property_vector_store.search(company_id=company_id, query=query, limit=fetch_limit)

    has_constraints = any(
        [
            constraints.max_price is not None,
            constraints.min_bedrooms is not None,
            constraints.property_type,
            constraints.location,
        ]
    )
    if not has_constraints:
        return matches[:limit]

    return [match for match in matches if _matches_constraints(match, constraints)][:limit]
