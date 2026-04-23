from app.models.schemas import SearchMatch
from app.services.vector_store import property_vector_store


def semantic_property_search(company_id: str, query: str, limit: int) -> list[SearchMatch]:
    return property_vector_store.search(company_id=company_id, query=query, limit=limit)

