from fastapi import APIRouter
from app.api.v1 import complaints, dashboard

api_router = APIRouter()

# Complaints API routes
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])

# Dashboard API routes
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard & Analytics"])
