import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SIH26-S02 Grievance Intelligence Backend"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://neondb_owner:your_password@ep-cool-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

    # AI Keys
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Similarity & Vector Search
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.85
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def normalized_database_url(self) -> str:
        """
        Normalize database url for SQLAlchemy with psycopg2 driver if postgresql is used.
        """
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
