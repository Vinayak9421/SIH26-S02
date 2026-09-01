from typing import List
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db
from app.models.complaint import Complaint
from app.schemas.complaint import DashboardStats, HotspotItem

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns aggregate analytics for KPI cards, status charts, and category distributions.
    """
    complaints = db.query(Complaint).all()
    
    total = len(complaints)
    critical_high = sum(1 for c in complaints if c.priority in ["CRITICAL", "HIGH"])
    pending = sum(1 for c in complaints if c.status == "PENDING")
    in_progress = sum(1 for c in complaints if c.status == "IN_PROGRESS")
    resolved = sum(1 for c in complaints if c.status == "RESOLVED")
    duplicates = sum(1 for c in complaints if c.duplicate_of is not None)

    category_counts = Counter(c.category for c in complaints if c.category)
    priority_counts = Counter(c.priority for c in complaints if c.priority)
    status_counts = Counter(c.status for c in complaints if c.status)
    department_counts = Counter(c.department for c in complaints if c.department)

    return DashboardStats(
        total_complaints=total,
        critical_high_count=critical_high,
        pending_count=pending,
        in_progress_count=in_progress,
        resolved_count=resolved,
        duplicate_count=duplicates,
        category_distribution=dict(category_counts),
        priority_distribution=dict(priority_counts),
        status_distribution=dict(status_counts),
        department_distribution=dict(department_counts)
    )


@router.get("/hotspots", response_model=List[HotspotItem])
def get_dashboard_hotspots(db: Session = Depends(get_db)):
    """
    Returns map-ready complaint coordinates and cluster density for Leaflet / OpenStreetMap.
    """
    complaints_with_coords = db.query(Complaint).filter(
        Complaint.latitude.isnot(None),
        Complaint.longitude.isnot(None)
    ).all()

    hotspots = []
    for c in complaints_with_coords:
        # Weight by priority (Critical = 3, High = 2, Medium = 1, Low = 1)
        weight = 3 if c.priority == "CRITICAL" else (2 if c.priority == "HIGH" else 1)
        hotspots.append(
            HotspotItem(
                id=c.id,
                tracking_id=c.tracking_id,
                latitude=c.latitude,
                longitude=c.longitude,
                location_name=c.location_name,
                category=c.category,
                priority=c.priority or "MEDIUM",
                status=c.status or "PENDING",
                summary=c.summary,
                cluster_weight=weight
            )
        )

    return hotspots
