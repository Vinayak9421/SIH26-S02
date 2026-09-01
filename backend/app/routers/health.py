from fastapi import APIRouter
from app.core.database import check_db_connection
from app.config import settings

router = APIRouter()


@router.get("/health", tags=["Health"])
def health():
    """
    Health check endpoint for deployment validation and integration testing.
    """
    db_healthy, msg = check_db_connection()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": {
            "connected": db_healthy,
            "message": msg
        }
    }
