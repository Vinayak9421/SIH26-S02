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

PRIORITY_WEIGHT = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1
}


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
        Computes geo-grid hotspot aggregates matching Section 17 & 26.
        """
        query = db.query(Issue).filter(
            Issue.status.in_(["open", "in_progress"]),
            Issue.latitude.isnot(None),
            Issue.longitude.isnot(None)
        )

        if department_key:
            query = query.filter(Issue.category == department_key)

        active_issues = query.all()

        # Group by hotspot_key
        clusters = {}
        for issue in active_issues:
            key = issue.hotspot_key or f"{round(issue.latitude, 3)}:{round(issue.longitude, 3)}"
            if key not in clusters:
                clusters[key] = []
            clusters[key].append(issue)

        hotspots = []
        for key, group in clusters.items():
            total_count = sum(iss.complaint_count for iss in group)
            avg_lat = sum(iss.latitude for iss in group) / len(group)
            avg_lon = sum(iss.longitude for iss in group) / len(group)
            
            # Dominant category
            categories = [iss.category for iss in group]
            dominant_cat = Counter(categories).most_common(1)[0][0] if categories else "sanitation"

            # Highest priority
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

        # Sort by report count descending
        hotspots.sort(key=lambda h: h.count, reverse=True)
        return hotspots

    @classmethod
    def get_map_issues(cls, db: Session, department_key: Optional[str] = None) -> List[MapIssueMarker]:
        """
        Returns active map-ready issue markers with GPS coordinates and priority.
        """
        query = db.query(Issue).filter(
            Issue.status.in_(["open", "in_progress"]),
            Issue.latitude.isnot(None),
            Issue.longitude.isnot(None)
        )

        if department_key:
            query = query.filter(Issue.category == department_key)

        issues = query.all()
        return [
            MapIssueMarker(
                id=str(i.id),
                title=i.title,
                category=i.category,
                priority=i.priority,
                status=i.status,
                complaint_count=i.complaint_count,
                latitude=i.latitude,
                longitude=i.longitude,
                address=i.address
            )
            for i in issues
        ]
