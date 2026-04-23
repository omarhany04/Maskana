from app.models.schemas import ChatReference, ChatResponse
from app.services.analysis_service import analyze_query
from app.services.search_service import semantic_property_search


def generate_chat_response(message: str, company_id: str) -> ChatResponse:
    analysis = analyze_query(message)
    matches = semantic_property_search(company_id=company_id, query=message, limit=3)

    if matches:
        lead_in = []
        for match in matches:
            lead_in.append(
                f"{match.title} in {match.location} at {int(match.price):,} with a relevance score of {match.score:.2f}."
            )

        answer = (
            f"Intent detected: {analysis.intent}. "
            f"Budget: {analysis.budget if analysis.budget is not None else 'not specified'}. "
            f"Primary location: {analysis.location or 'not specified'}. "
            f"Recommended properties: {' '.join(lead_in)}"
        )
    else:
        answer = (
            f"Intent detected: {analysis.intent}. "
            "No indexed properties matched closely enough. Add or refresh tenant property data in the vector index and try again."
        )

    return ChatResponse(
        answer=answer,
        references=[
            ChatReference(propertyId=match.id, title=match.title, score=match.score)
            for match in matches
        ],
    )

