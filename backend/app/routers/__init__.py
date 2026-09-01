from fastapi import APIRouter
from .health import router as health_router
from .complaints import router as complaints_router
from .issues import router as issues_router
from .analytics import router as analytics_router
from .map import router as map_router
from .departments import router as departments_router
from .auth import router as auth_router

api_v1_router = APIRouter()

# Include feature routers under API v1
api_v1_router.include_router(auth_router)
api_v1_router.include_router(complaints_router)
api_v1_router.include_router(issues_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(map_router)
api_v1_router.include_router(departments_router)

__all__ = ["api_v1_router", "health_router"]
