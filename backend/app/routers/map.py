from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_department_admin, get_current_user
from app.schemas.analytics import HotspotItem, MapIssueMarker
from app.schemas.user import CurrentUser
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/map", tags=["GIS & Hotspots"])


@router.get("/nearby", response_model=List[MapIssueMarker])
async def get_nearby_issues(
    category: Optional[str] = Query(None, description="Optional category filter"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Citizen-accessible: Returns anonymized active issue markers with GPS coordinates for nearby map & trending widgets.
    """
    markers = AnalyticsService.get_map_issues(db=db, department_key=category)
    return markers[:limit]


@router.get("/issues", response_model=List[MapIssueMarker])
async def get_map_issues(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Returns active issue markers with GPS coordinates and priority weights for Leaflet / OpenStreetMap.
    """
    dept_key = category
    if current_user.role == "department_admin" and current_user.department_key:
        dept_key = current_user.department_key

    return AnalyticsService.get_map_issues(db=db, department_key=dept_key)


@router.get("/hotspots", response_model=List[HotspotItem])
async def get_map_hotspots(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Returns geo-grid hotspot clusters with centroid coordinates and severity metrics.
    """
    dept_key = category
    if current_user.role == "department_admin" and current_user.department_key:
        dept_key = current_user.department_key

    return AnalyticsService.get_hotspots(db=db, department_key=dept_key)

