from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "real-estate-ai"
    service_version: str = "1.0.0"
    allowed_origins: str = "http://localhost:3000"
    vector_dir: str = "data/faiss"
    embedding_dim: int = 256

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="AI_",
        extra="ignore",
    )

    @property
    def origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def vector_path(self) -> Path:
        path = Path(self.vector_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
