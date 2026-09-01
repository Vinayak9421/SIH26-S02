import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, check_db_connection
from app.api.v1.api_router import api_router

# Setup logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    Initializes database schema and validates connection on startup.
    """
    logger.info(f"Starting {settings.PROJECT_NAME}...")
    
    # Initialize DB tables
    init_db()
    
    # Check DB connectivity
    is_healthy, msg = check_db_connection()
    if is_healthy:
        logger.info(f"Database connection status: OK - {msg}")
    else:
        logger.warning(f"Database connection status: ATTENTION - {msg}")
        
    yield
    logger.info("Shutting down application...")


# FastAPI Application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for SIH26-S02 Citizen Grievance Intelligence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint providing API information and documentation links"""
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/health",
        "api_v1_prefix": settings.API_V1_STR
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Service health check endpoint verifying server status and database connectivity.
    """
    db_healthy, db_message = check_db_connection()
    
    status_str = "healthy" if db_healthy else "degraded"
    status_code = status.HTTP_200_OK if db_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": status_str,
            "server": "running",
            "database": {
                "connected": db_healthy,
                "message": db_message,
                "target_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "configured"
            }
        }
    )


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
