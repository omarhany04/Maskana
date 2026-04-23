from typing import Any, Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    query: str = Field(min_length=2)


class AnalyzeResponse(BaseModel):
    budget: int | None
    location: str | None
    property_type: str | None = Field(alias="propertyType")
    intent: Literal["buy", "rent", "sell", "invest", "unknown"]
    keywords: list[str]

    model_config = {
        "populate_by_name": True,
    }


class LeadPayload(BaseModel):
    full_name: str = Field(alias="fullName")
    email: str | None = None
    phone: str | None = None
    source: str
    budget: float | None = None
    location: str | None = None
    property_type: str | None = Field(default=None, alias="propertyType")
    intent: str | None = None
    notes: str | None = None
    status: str

    model_config = {
        "populate_by_name": True,
    }


class LeadScoreRequest(BaseModel):
    lead: LeadPayload


class LeadScoreResponse(BaseModel):
    score: int
    classification: Literal["cold", "warm", "hot"]
    reasoning: list[str]


class PropertyRecord(BaseModel):
    id: str
    company_id: str = Field(alias="companyId")
    title: str
    description: str
    location: str
    address: str
    property_type: str = Field(alias="propertyType")
    price: float
    bedrooms: int
    bathrooms: int
    area_sqm: float = Field(alias="areaSqm")
    reference_code: str = Field(alias="referenceCode")
    image_urls: list[str] = Field(default_factory=list, alias="imageUrls")

    model_config = {
        "populate_by_name": True,
    }


class IndexPropertiesRequest(BaseModel):
    company_id: str = Field(alias="companyId")
    properties: list[PropertyRecord]

    model_config = {
        "populate_by_name": True,
    }


class IndexPropertiesResponse(BaseModel):
    indexed: int


class SearchRequest(BaseModel):
    query: str = Field(min_length=2)
    company_id: str | None = Field(default=None, alias="companyId")
    limit: int = Field(default=10, ge=1, le=20)

    model_config = {
        "populate_by_name": True,
    }


class SearchMatch(BaseModel):
    id: str
    company_id: str = Field(alias="companyId")
    title: str
    description: str
    location: str
    property_type: str = Field(alias="propertyType")
    price: float
    reference_code: str = Field(alias="referenceCode")
    score: float
    metadata: dict[str, Any]

    model_config = {
        "populate_by_name": True,
    }


class SearchResponse(BaseModel):
    matches: list[SearchMatch]


class ChatRequest(BaseModel):
    message: str = Field(min_length=2)
    company_id: str | None = Field(default=None, alias="companyId")
    lead_id: str | None = Field(default=None, alias="leadId")

    model_config = {
        "populate_by_name": True,
    }


class ChatReference(BaseModel):
    property_id: str = Field(alias="propertyId")
    title: str
    score: float

    model_config = {
        "populate_by_name": True,
    }


class ChatResponse(BaseModel):
    answer: str
    references: list[ChatReference]
