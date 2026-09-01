from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_department_admin
from app.schemas.analytics import AnalyticsSummary
from app.schemas.user import CurrentUser
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    category: Optional[str] = Query(None, description="Optional category filter"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Returns aggregate operational KPI metrics for dashboard cards and distribution charts.
    """
    dept_key = category
    if current_user.role == "department_admin" and current_user.department_key:
        dept_key = current_user.department_key

    return AnalyticsService.get_summary(db=db, department_key=dept_key)
