from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.ai import router as ai_router
from app.core.config import settings

app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

