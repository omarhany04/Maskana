import hashlib
import re
import shutil
import threading
from pathlib import Path

import numpy as np
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from app.core.config import settings
from app.models.schemas import PropertyRecord, SearchMatch


class HashEmbeddings(Embeddings):
    def __init__(self, dimension: int) -> None:
        self.dimension = dimension

    def _embed(self, text: str) -> list[float]:
        vector = np.zeros(self.dimension, dtype=np.float32)
        tokens = re.findall(r"[a-z0-9]+", text.lower())

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
            index = int(digest[:8], 16) % self.dimension
            sign = 1 if int(digest[8:16], 16) % 2 == 0 else -1
            weight = 1 + (len(token) / 20)
            vector[index] += sign * weight

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector /= norm

        return vector.tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)


class PropertyVectorStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._embeddings = HashEmbeddings(settings.embedding_dim)

    def _company_path(self, company_id: str) -> Path:
        path = settings.vector_path / company_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def _build_document(self, property_record: PropertyRecord) -> Document:
        content = " | ".join(
            [
                property_record.title,
                property_record.description,
                property_record.location,
                property_record.address,
                property_record.property_type,
                property_record.reference_code,
                f"{property_record.bedrooms} bedrooms",
                f"{property_record.bathrooms} bathrooms",
                f"{property_record.area_sqm} sqm",
                f"price {property_record.price}",
            ]
        )

        return Document(
            page_content=content,
            metadata={
                "id": property_record.id,
                "companyId": property_record.company_id,
                "title": property_record.title,
                "description": property_record.description,
                "location": property_record.location,
                "propertyType": property_record.property_type,
                "price": property_record.price,
                "referenceCode": property_record.reference_code,
                "address": property_record.address,
                "bedrooms": property_record.bedrooms,
                "bathrooms": property_record.bathrooms,
                "areaSqm": property_record.area_sqm,
                "imageUrls": property_record.image_urls,
            },
        )

    def index_properties(self, company_id: str, properties: list[PropertyRecord]) -> int:
        with self._lock:
            company_path = self._company_path(company_id)
            if company_path.exists():
                shutil.rmtree(company_path, ignore_errors=True)
                company_path.mkdir(parents=True, exist_ok=True)

            if not properties:
                return 0

            documents = [self._build_document(property_record) for property_record in properties]
            store = FAISS.from_documents(documents, self._embeddings)
            store.save_local(str(company_path))
            return len(documents)

    def search(self, company_id: str, query: str, limit: int) -> list[SearchMatch]:
        company_path = self._company_path(company_id)
        index_file = company_path / "index.faiss"

        if not index_file.exists():
            return []

        store = FAISS.load_local(
            str(company_path),
            self._embeddings,
            allow_dangerous_deserialization=True,
        )
        matches = store.similarity_search_with_relevance_scores(query, k=limit)

        results: list[SearchMatch] = []
        for document, relevance in matches:
            metadata = document.metadata
            results.append(
                SearchMatch(
                    id=str(metadata["id"]),
                    companyId=str(metadata["companyId"]),
                    title=str(metadata["title"]),
                    description=str(metadata["description"]),
                    location=str(metadata["location"]),
                    propertyType=str(metadata["propertyType"]),
                    price=float(metadata["price"]),
                    referenceCode=str(metadata["referenceCode"]),
                    score=float(relevance),
                    metadata=metadata,
                )
            )

        return results


property_vector_store = PropertyVectorStore()

