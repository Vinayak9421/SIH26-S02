import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicIssue AI Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database connection URL
    DATABASE_URL: str = "postgresql://neondb_owner:your_password@ep-cool-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

    # Supabase / JWT Auth
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = "demo-secret-key-change-in-prod"

    # AI & Multilingual Model
    MODEL_NAME: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    OPENCAGE_API_KEY: str = ""


    # Duplicate Detection Parameters
    DUPLICATE_LINKED_THRESHOLD: float = 0.82
    DUPLICATE_POSSIBLE_THRESHOLD: float = 0.74
    DUPLICATE_LINKED_MAX_DISTANCE_M: int = 500
    DUPLICATE_POSSIBLE_MAX_DISTANCE_M: int = 750

    # Classification Thresholds
    CONFIDENCE_AUTO_ROUTE: float = 0.72
    CONFIDENCE_SUGGESTED_ROUTE: float = 0.58

    # CORS Allowed Origins
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def normalized_database_url(self) -> str:
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
