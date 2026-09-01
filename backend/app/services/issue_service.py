from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.issue import Issue
from app.models.complaint import Complaint
from app.models.history import IssueStatusHistory, ComplaintStatusHistory
from app.schemas.issue import (
    IssueListItem,
    IssueDetailResponse,
    IssueUpdate,
    ResolveIssueResponse,
    LinkedComplaintPreview,
    IssueStatusTimelineItem
)
from app.services.ai.category_templates import CATEGORY_DEPARTMENT_MAPPING


class IssueService:

    @classmethod
    def list_issues(
        cls,
        db: Session,
        department_key: Optional[str] = None,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[IssueListItem]:
        """
        List issues for Authority Queue with department, status, and priority filters.
        """
        query = db.query(Issue)

        if department_key:
            query = query.filter(Issue.category == department_key)
        if status_filter:
            query = query.filter(Issue.status == status_filter)
        if priority_filter:
            query = query.filter(Issue.priority == priority_filter)

        # Ranked by priority score and creation date
        issues = query.order_by(desc(Issue.priority_score), desc(Issue.created_at)).offset(skip).limit(limit).all()

        items = []
        for issue in issues:
            dept_name = issue.department.name if issue.department else CATEGORY_DEPARTMENT_MAPPING.get(issue.category, issue.category.title())
            items.append(
                IssueListItem(
                    id=str(issue.id),
                    title=issue.title,
                    summary=issue.summary,
                    category=issue.category,
                    department_id=str(issue.department_id) if issue.department_id else None,
                    department_name=dept_name,
                    priority=issue.priority,
                    priority_score=issue.priority_score,
                    complaint_count=issue.complaint_count,
                    status=issue.status,
                    latitude=issue.latitude,
                    longitude=issue.longitude,
                    address=issue.address,
                    hotspot_key=issue.hotspot_key,
                    created_at=issue.created_at,
                    updated_at=issue.updated_at,
                    resolved_at=issue.resolved_at
                )
            )
        return items

    @classmethod
    def get_issue_detail(cls, db: Session, issue_id: str) -> Optional[IssueDetailResponse]:
        """
        Get comprehensive issue detail with linked complaint previews and status timeline.
        """
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            return None

        # Linked complaints
        complaint_previews = []
        for c in issue.complaints:
            complaint_previews.append(
                LinkedComplaintPreview(
                    id=str(c.id),
                    text=c.text,
                    priority=c.priority,
                    status=c.status,
                    address=c.address,
                    created_at=c.created_at
                )
            )

        # Status timeline
        timeline = []
        for hist in issue.status_history:
            timeline.append(
                IssueStatusTimelineItem(
                    status=hist.status,
                    note=hist.note,
                    changed_by=hist.changed_by,
                    created_at=hist.created_at
                )
            )

        dept_name = issue.department.name if issue.department else CATEGORY_DEPARTMENT_MAPPING.get(issue.category, issue.category.title())

        return IssueDetailResponse(
            id=str(issue.id),
            title=issue.title,
            summary=issue.summary,
            category=issue.category,
            department_id=str(issue.department_id) if issue.department_id else None,
            department_name=dept_name,
            assigned_officer_id=str(issue.assigned_officer_id) if issue.assigned_officer_id else None,
            priority=issue.priority,
            priority_score=issue.priority_score,
            complaint_count=issue.complaint_count,
            status=issue.status,
            latitude=issue.latitude,
            longitude=issue.longitude,
            address=issue.address,
            hotspot_key=issue.hotspot_key,
            created_at=issue.created_at,
            updated_at=issue.updated_at,
            resolved_at=issue.resolved_at,
            linked_complaints=complaint_previews,
            timeline=timeline
        )

    @classmethod
    def update_issue(
        cls,
        db: Session,
        issue_id: str,
        payload: IssueUpdate,
        changed_by_id: str
    ) -> Optional[IssueDetailResponse]:
        """
        Update issue status, priority, or assigned officer with status history.
        """
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            return None

        status_changed = False
        if payload.status and payload.status != issue.status:
            issue.status = payload.status
            status_changed = True
            if payload.status == "resolved":
                issue.resolved_at = datetime.utcnow()

        if payload.priority:
            issue.priority = payload.priority
        if payload.assigned_officer_id is not None:
            issue.assigned_officer_id = payload.assigned_officer_id

        issue.updated_at = datetime.utcnow()

        if status_changed or payload.note:
            db.add(IssueStatusHistory(
                issue_id=issue.id,
                status=issue.status,
                note=payload.note or f"Issue status changed to {issue.status}",
                changed_by=changed_by_id
            ))

        db.commit()
        db.refresh(issue)
        return cls.get_issue_detail(db, issue_id)

    @classmethod
    def resolve_issue(
        cls,
        db: Session,
        issue_id: str,
        changed_by_id: str,
        note: Optional[str] = None
    ) -> Optional[ResolveIssueResponse]:
        """
        Issue Resolution Cascade (Section 14):
        1. Set issues.status = resolved, resolved_at = now()
        2. Update all linked complaints still pending/in_progress to resolved
        3. Add issue and complaint status history records
        4. Return count of citizen complaints resolved
        """
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            return None

        now = datetime.utcnow()
        issue.status = "resolved"
        issue.resolved_at = now
        issue.updated_at = now

        db.add(IssueStatusHistory(
            issue_id=issue.id,
            status="resolved",
            note=note or "Issue resolved by department authority",
            changed_by=changed_by_id
        ))

        # Cascade resolution to linked citizen complaints
        unresolved_complaints = db.query(Complaint).filter(
            Complaint.issue_id == issue.id,
            Complaint.status.in_(["pending", "in_progress"])
        ).all()

        resolved_count = 0
        for complaint in unresolved_complaints:
            complaint.status = "resolved"
            complaint.updated_at = now
            db.add(ComplaintStatusHistory(
                complaint_id=complaint.id,
                status="resolved",
                note=f"Resolved automatically via Issue resolution: {issue.title}",
                changed_by=changed_by_id
            ))
            resolved_count += 1

        db.commit()

        return ResolveIssueResponse(
            issue_id=str(issue.id),
            status="resolved",
            resolved_at=now,
            linked_complaints_resolved_count=resolved_count,
            message=f"Issue '{issue.title}' and {resolved_count} linked citizen complaint(s) marked resolved."
        )

    @classmethod
    def unlink_complaint(
        cls,
        db: Session,
        complaint_id: str,
        changed_by_id: str
    ) -> Optional[Complaint]:
        """
        Overrides incorrect duplicate match: unlinks complaint and creates a separate new Issue.
        """
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None

        old_issue = complaint.issue
        if old_issue and old_issue.complaint_count > 1:
            old_issue.complaint_count -= 1

        # Create new separate issue
        new_issue = Issue(
            department_id=complaint.department_id,
            title=complaint.text[:80],
            summary=complaint.text[:200],
            category=complaint.ai_category or "general_review",
            representative_embedding=complaint.embedding,
            priority=complaint.priority,
            priority_score=complaint.priority_score,
            complaint_count=1,
            status="open",
            latitude=complaint.latitude,
            longitude=complaint.longitude,
            address=complaint.address
        )
        db.add(new_issue)
        db.flush()

        complaint.issue_id = new_issue.id
        complaint.duplicate_state = "none"
        complaint.duplicate_of_issue_id = None
        complaint.updated_at = datetime.utcnow()

        db.add(ComplaintStatusHistory(
            complaint_id=complaint.id,
            status=complaint.status,
            note="Unlinked from previous issue and assigned separate ticket by department admin",
            changed_by=changed_by_id
        ))

        db.commit()
        db.refresh(complaint)
        return complaint
