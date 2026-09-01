from typing import List, Optional
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.issue import Issue
from app.models.complaint import Complaint
from app.schemas.analytics import (
    AnalyticsSummary,
    DepartmentBreakdown,
    PriorityBreakdown,
    HotspotItem,
    MapIssueMarker
)
from app.services.geocoding_service import geocode_address_sync

PRIORITY_WEIGHT = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1
}

# Fallback coordinates for major Indian cities — used when geocoding fails
CITY_FALLBACK_COORDS = {
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "jaipur": (26.9124, 75.7873),
    "lucknow": (26.8467, 80.9462),
    "ahmedabad": (23.0225, 72.5714),
    "surat": (21.1702, 72.8311),
    "noida": (28.5355, 77.3910),
    "gurugram": (28.4595, 77.0266),
    "gurgaon": (28.4595, 77.0266),
    "chandigarh": (30.7333, 76.7794),
    "bhopal": (23.2599, 77.4126),
    "indore": (22.7196, 75.8577),
    "patna": (25.5941, 85.1376),
    "nagpur": (21.1458, 79.0882),
}

DEFAULT_COORDS = (28.6139, 77.2090)  # Default: New Delhi


def _get_coords_for_issue(issue: Issue) -> tuple:
    """Get lat/lng for an issue. Geocodes from address if not stored."""
    if issue.latitude and issue.longitude:
        return issue.latitude, issue.longitude

    if issue.address:
        # Try city fallback first (faster, no network)
        addr_lower = issue.address.lower()
        for city, coords in CITY_FALLBACK_COORDS.items():
            if city in addr_lower:
                return coords

        # Try geocoding via Nominatim
        lat, lon = geocode_address_sync(issue.address)
        if lat and lon:
            # Persist to DB to avoid re-geocoding
            try:
                issue.latitude = lat
                issue.longitude = lon
            except Exception:
                pass
            return lat, lon

    return DEFAULT_COORDS


class AnalyticsService:

    @classmethod
    def get_summary(cls, db: Session, department_key: Optional[str] = None) -> AnalyticsSummary:
        """
        Calculates aggregate operational metrics for authority dashboard KPI cards.
        """
        issue_query = db.query(Issue)
        complaint_query = db.query(Complaint)

        if department_key:
            issue_query = issue_query.filter(Issue.category == department_key)
            complaint_query = complaint_query.filter(Complaint.ai_category == department_key)

        issues = issue_query.all()
        complaints = complaint_query.all()

        open_issues = sum(1 for i in issues if i.status in ["open", "in_progress"])
        critical_issues = sum(1 for i in issues if i.status in ["open", "in_progress"] and i.priority == "critical")
        high_priority_issues = sum(1 for i in issues if i.status in ["open", "in_progress"] and i.priority == "high")
        resolved_issues = sum(1 for i in issues if i.status == "resolved")

        linked_duplicates = sum(1 for c in complaints if c.duplicate_state == "linked")

        # Distributions for active issues
        active_issues = [i for i in issues if i.status in ["open", "in_progress"]]
        dept_counts = Counter(i.category for i in active_issues if i.category)
        prio_counts = Counter(i.priority for i in active_issues if i.priority)

        dept_breakdown = [DepartmentBreakdown(category=k, count=v) for k, v in dept_counts.items()]
        prio_breakdown = [PriorityBreakdown(priority=k, count=v) for k, v in prio_counts.items()]

        return AnalyticsSummary(
            open_issues=open_issues,
            critical_issues=critical_issues,
            high_priority_issues=high_priority_issues,
            linked_duplicate_complaints=linked_duplicates,
            resolved_issues=resolved_issues,
            department_breakdown=dept_breakdown,
            priority_breakdown=prio_breakdown
        )

    @classmethod
    def get_hotspots(cls, db: Session, department_key: Optional[str] = None) -> List[HotspotItem]:
        """
        Computes geo-grid hotspot aggregates. Geocodes issues without coordinates.
        """
        query = db.query(Issue).filter(
            Issue.status.in_(["open", "in_progress"])
        )

        if department_key:
            query = query.filter(Issue.category == department_key)

        active_issues = query.all()

        # Group by hotspot_key or geocoded location
        clusters = {}
        for issue in active_issues:
            lat, lon = _get_coords_for_issue(issue)
            key = issue.hotspot_key or f"{round(lat, 3)}:{round(lon, 3)}"
            if key not in clusters:
                clusters[key] = {"issues": [], "lat": lat, "lon": lon}
            clusters[key]["issues"].append(issue)

        hotspots = []
        for key, cluster_data in clusters.items():
            group = cluster_data["issues"]
            total_count = sum(iss.complaint_count for iss in group)
            avg_lat = sum(_get_coords_for_issue(iss)[0] for iss in group) / len(group)
            avg_lon = sum(_get_coords_for_issue(iss)[1] for iss in group) / len(group)

            categories = [iss.category for iss in group]
            dominant_cat = Counter(categories).most_common(1)[0][0] if categories else "sanitation"

            highest_prio = "low"
            highest_w = 0
            for iss in group:
                w = PRIORITY_WEIGHT.get(iss.priority, 1)
                if w > highest_w:
                    highest_w = w
                    highest_prio = iss.priority

            hotspots.append(
                HotspotItem(
                    hotspot_key=key,
                    latitude=round(avg_lat, 4),
                    longitude=round(avg_lon, 4),
                    count=total_count,
                    dominant_category=dominant_cat,
                    highest_priority=highest_prio
                )
            )

        try:
            db.commit()
        except Exception:
            db.rollback()

        hotspots.sort(key=lambda h: h.count, reverse=True)
        return hotspots

    @classmethod
    def get_map_issues(cls, db: Session, department_key: Optional[str] = None) -> List[MapIssueMarker]:
        """
        Returns active map-ready issue markers. Geocodes issues that have address but no coordinates.
        """
        query = db.query(Issue).filter(
            Issue.status.in_(["open", "in_progress"])
        )

        if department_key:
            query = query.filter(Issue.category == department_key)

        issues = query.all()

        markers = []
        for i in issues:
            lat, lon = _get_coords_for_issue(i)
            markers.append(
                MapIssueMarker(
                    id=str(i.id),
                    title=i.title,
                    category=i.category,
                    priority=i.priority,
                    status=i.status,
                    complaint_count=i.complaint_count,
                    latitude=lat,
                    longitude=lon,
                    address=i.address
                )
            )

        try:
            db.commit()
        except Exception:
            db.rollback()

        return markers
