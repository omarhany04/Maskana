from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    IndexPropertiesRequest,
    IndexPropertiesResponse,
    LeadScoreRequest,
    LeadScoreResponse,
    SearchRequest,
    SearchResponse,
)
from app.services.analysis_service import analyze_query
from app.services.chat_service import generate_chat_response
from app.services.lead_scoring_service import score_lead
from app.services.search_service import semantic_property_search
from app.services.vector_store import property_vector_store

router = APIRouter()


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    return analyze_query(payload.query)


@router.post("/lead-score", response_model=LeadScoreResponse)
def lead_score(payload: LeadScoreRequest) -> LeadScoreResponse:
    return score_lead(payload.lead)


@router.post("/index/properties", response_model=IndexPropertiesResponse)
def index_properties(payload: IndexPropertiesRequest) -> IndexPropertiesResponse:
    indexed = property_vector_store.index_properties(payload.company_id, payload.properties)
    return IndexPropertiesResponse(indexed=indexed)


@router.post("/search", response_model=SearchResponse)
def search(payload: SearchRequest) -> SearchResponse:
    if not payload.company_id:
        raise HTTPException(status_code=400, detail="companyId is required for semantic search.")

    matches = semantic_property_search(company_id=payload.company_id, query=payload.query, limit=payload.limit)
    return SearchResponse(matches=matches)


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    if not payload.company_id:
        raise HTTPException(status_code=400, detail="companyId is required for chat.")

    return generate_chat_response(message=payload.message, company_id=payload.company_id)

