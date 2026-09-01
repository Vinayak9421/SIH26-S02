import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.database import init_db, check_db_connection
from app.routers import api_v1_router, health_router
from app.services.ai.analyze import get_ai_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# Suppress noisy HTTP cache requests from HuggingFace, sentence_transformers, and httpx
for noisy_logger in ["httpx", "sentence_transformers", "huggingface_hub", "urllib3", "httpcore"]:
    logging.getLogger(noisy_logger).setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database schema and pre-warms AI embedding model on startup.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} ({settings.ENVIRONMENT})...")

    # 1. Initialize DB Schema
    init_db()

    # 2. Check Database Connectivity
    is_healthy, db_msg = check_db_connection()
    logger.info(f"Database status: {'OK' if is_healthy else 'WARNING'} - {db_msg}")

    # 3. Pre-warm Multilingual SentenceTransformer Pipeline
    logger.info("Initializing AI Multilingual Intelligence Pipeline...")
    try:
        get_ai_pipeline()
        logger.info("AI Pipeline pre-warmed and ready.")
    except Exception as e:
        logger.warning(f"AI Pipeline pre-warm encountered notice: {e}")

    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for CivicIssue AI: Citizen Grievance Classification, Prioritization and Duplicate Detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Root Health & API Routers
app.include_router(health_router)
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/health",
        "api_v1_prefix": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
