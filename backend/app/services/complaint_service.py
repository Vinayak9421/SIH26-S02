import json
import logging
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.complaint import Complaint
from app.models.issue import Issue
from app.models.department import Department
from app.models.history import ComplaintStatusHistory, IssueStatusHistory
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintSubmitResponse,
    ClassificationOutput,
    PriorityOutput,
    DuplicateOutput,
    ComplaintDetailResponse,
    ComplaintListItem,
    ComplaintTimelineItem
)
from app.schemas.user import CurrentUser
from app.services.ai.analyze import analyze_complaint
from app.services.ai.duplicate_service import IssueCandidate
from app.services.ai.geo_service import get_hotspot_key
from app.services.ai.category_templates import CATEGORY_DEPARTMENT_MAPPING
import uuid as _uuid_mod

logger = logging.getLogger("uvicorn.error")


def _safe_uuid(val) -> Optional[str]:
    """Return val as str if it is a valid UUID, else None. Prevents demo admin string IDs from crashing uuid columns."""
    if val is None:
        return None
    try:
        _uuid_mod.UUID(str(val))
        return str(val)
    except (ValueError, AttributeError):
        return None


PRIORITY_RANK = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4
}


class ComplaintService:

    @staticmethod
    def get_active_issue_candidates(db: Session) -> List[IssueCandidate]:
        """Fetch all active open/in_progress issues for duplicate candidate matching"""
        active_issues = db.query(Issue).filter(Issue.status.in_(["open", "in_progress"])).all()
        candidates = []
        for issue in active_issues:
            emb = None
            if issue.representative_embedding:
                try:
                    emb = json.loads(issue.representative_embedding)
                except Exception:
                    emb = None

            candidates.append(
                IssueCandidate(
                    id=str(issue.id),
                    category=issue.category,
                    title=issue.title,
                    embedding=emb or [],
                    latitude=issue.latitude,
                    longitude=issue.longitude,
                    complaint_count=issue.complaint_count,
                    status=issue.status
                )
            )
        return candidates

    @staticmethod
    def get_or_create_department(db: Session, category_key: str) -> Optional[Department]:
        dept = db.query(Department).filter(Department.category_key == category_key).first()
        if not dept:
            name = CATEGORY_DEPARTMENT_MAPPING.get(category_key, category_key.title())
            dept = Department(
                name=name,
                category_key=category_key,
                description=f"Department managing {name}"
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
        return dept

    @classmethod
    def submit_complaint(
        cls,
        db: Session,
        payload: ComplaintCreate,
        current_user: CurrentUser
    ) -> ComplaintSubmitResponse:
        """
        Orchestrates Section 14 POST /complaints workflow:
        1. Fetch active issues
        2. Execute analyze_complaint()
        3. If linked -> link to Issue, increment count, upgrade priority
        4. Else -> create new Issue
        5. Persist complaint & status history
        6. Return ComplaintSubmitResponse
        """
        # 1. Fetch active candidate issues
        candidates = cls.get_active_issue_candidates(db)

        # 2. Run AI intelligence pipeline
        ai_res = analyze_complaint(
            text=payload.text,
            latitude=payload.latitude,
            longitude=payload.longitude,
            active_issues=candidates
        )

        category = ai_res["category"]
        dept = cls.get_or_create_department(db, category)
        department_id = dept.id if dept else None

        duplicate_state = ai_res["duplicate_state"]
        matched_issue_id = ai_res["matched_issue_id"]
        matched_title = ai_res["matched_issue_title"]
        similarity = ai_res["semantic_similarity"]
        distance = ai_res["distance_meters"]

        target_issue: Optional[Issue] = None
        issue_action: str = "created_new_issue"

        # 3. Duplicate Linking Flow
        if duplicate_state == "linked" and matched_issue_id:
            target_issue = db.query(Issue).filter(Issue.id == matched_issue_id).first()
            if target_issue:
                issue_action = "linked_to_existing_issue"
                target_issue.complaint_count += 1
                
                # Priority upgrade if incoming report has higher priority
                complaint_prio_rank = PRIORITY_RANK.get(ai_res["priority"], 2)
                issue_prio_rank = PRIORITY_RANK.get(target_issue.priority, 2)
                if complaint_prio_rank > issue_prio_rank:
                    target_issue.priority = ai_res["priority"]
                    target_issue.priority_score = max(target_issue.priority_score, ai_res["priority_score"])
                
                target_issue.updated_at = datetime.utcnow()

        if not target_issue:
            # 4. Create New Issue
            issue_title = payload.text.strip().split("\n")[0]
            if len(issue_title) > 90:
                issue_title = issue_title[:87] + "..."

            hotspot_key = get_hotspot_key(payload.latitude, payload.longitude)

            target_issue = Issue(
                department_id=str(department_id),
                title=issue_title,
                summary=payload.text[:200],
                category=category,
                representative_embedding=json.dumps(ai_res["embedding"]),
                priority=ai_res["priority"],
                priority_score=ai_res["priority_score"],
                complaint_count=1,
                status="open",
                latitude=payload.latitude,
                longitude=payload.longitude,
                address=payload.address,
                hotspot_key=hotspot_key
            )
            db.add(target_issue)
            db.flush()  # Generate target_issue.id

            # Add initial issue history
            db.add(IssueStatusHistory(
                issue_id=str(target_issue.id),
                status="open",
                note="New civic issue created from citizen report"
            ))

            if duplicate_state == "possible":
                issue_action = "possible_duplicate"
            else:
                issue_action = "created_new_issue"

        # 5. Create Complaint Record
        new_complaint = Complaint(
            user_id=str(current_user.id),
            issue_id=str(target_issue.id),
            department_id=str(department_id) if department_id else None,
            text=payload.text,
            normalized_text=ai_res["normalized_text"],
            embedding=json.dumps(ai_res["embedding"]),
            ai_category=category,
            ai_confidence=ai_res["confidence"],
            priority=ai_res["priority"],
            priority_score=ai_res["priority_score"],
            priority_reasons=json.dumps(ai_res["priority_reasons"]),  # json string -> jsonb cast by PostgreSQL
            duplicate_state=duplicate_state,
            duplicate_of_issue_id=str(matched_issue_id) if matched_issue_id and duplicate_state == "linked" else None,
            status="pending",
            latitude=payload.latitude,
            longitude=payload.longitude,
            address=payload.address
        )
        db.add(new_complaint)
        db.flush()

        # 6. Create Complaint Status History
        db.add(ComplaintStatusHistory(
            complaint_id=str(new_complaint.id),
            status="pending",
            note="Complaint submitted and AI analysis completed"
        ))

        db.commit()
        db.refresh(new_complaint)
        db.refresh(target_issue)

        return ComplaintSubmitResponse(
            complaint_id=str(new_complaint.id),
            issue_id=str(target_issue.id),
            issue_action=issue_action,
            classification=ClassificationOutput(
                category=category,
                department=ai_res["department"],
                confidence=ai_res["confidence"],
                needs_human_review=ai_res["needs_human_review"]
            ),
            priority=PriorityOutput(
                level=ai_res["priority"],
                score=ai_res["priority_score"],
                reasons=ai_res["priority_reasons"]
            ),
            duplicate=DuplicateOutput(
                state=duplicate_state,
                semantic_similarity=similarity,
                distance_meters=distance,
                matched_issue_title=matched_title or (target_issue.title if issue_action == "linked_to_existing_issue" else None)
            )
        )

    @classmethod
    def get_citizen_complaints(cls, db: Session, user_id: str) -> List[ComplaintListItem]:
        """Get all complaints for a citizen (uses user_id column in NeonDB)."""
        complaints = db.query(Complaint).filter(Complaint.user_id == user_id).order_by(desc(Complaint.created_at)).all()
        items = []
        for c in complaints:
            dept_name = c.department.name if c.department else (CATEGORY_DEPARTMENT_MAPPING.get(c.ai_category, c.ai_category) if c.ai_category else None)
            items.append(
                ComplaintListItem(
                    id=str(c.id),
                    text=c.text,
                    category=c.ai_category,
                    department=dept_name,
                    priority=c.priority,
                    priority_score=c.priority_score,
                    status=c.status,
                    duplicate_state=c.duplicate_state,
                    issue_id=str(c.issue_id) if c.issue_id else None,
                    address=c.address,
                    satisfaction_rating=c.satisfaction_rating,
                    created_at=c.created_at
                )
            )
        return items

    @classmethod
    def get_complaint_detail(cls, db: Session, complaint_id: str) -> Optional[ComplaintDetailResponse]:
        """Fetch full complaint detail with safe AI fields and status timeline"""
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None

        reasons = []
        if complaint.priority_reasons:
            if isinstance(complaint.priority_reasons, list):
                # NeonDB jsonb — already deserialized by SQLAlchemy/psycopg2
                reasons = [str(r) for r in complaint.priority_reasons]
            elif isinstance(complaint.priority_reasons, str):
                try:
                    parsed = json.loads(complaint.priority_reasons)
                    reasons = parsed if isinstance(parsed, list) else [str(parsed)]
                except Exception:
                    reasons = [complaint.priority_reasons]

        timeline_items = []
        for hist in complaint.status_history:
            timeline_items.append(
                ComplaintTimelineItem(
                    status=hist.status,
                    note=hist.note,
                    changed_by=str(hist.changed_by) if hist.changed_by else None,
                    created_at=hist.created_at
                )
            )

        dept_name = complaint.department.name if complaint.department else CATEGORY_DEPARTMENT_MAPPING.get(complaint.ai_category, complaint.ai_category)

        return ComplaintDetailResponse(
            id=str(complaint.id),
            text=complaint.text,
            status=complaint.status,
            category=complaint.ai_category,
            department=dept_name,
            priority=complaint.priority,
            priority_score=complaint.priority_score,
            priority_reasons=reasons,
            duplicate_state=complaint.duplicate_state,
            address=complaint.address,
            latitude=complaint.latitude,
            longitude=complaint.longitude,
            satisfaction_rating=complaint.satisfaction_rating,
            satisfaction_feedback=complaint.satisfaction_feedback,
            rated_at=complaint.rated_at,
            created_at=complaint.created_at,
            updated_at=complaint.updated_at,
            issue_id=str(complaint.issue.id) if complaint.issue else None,
            issue_title=complaint.issue.title if complaint.issue else None,
            issue_status=complaint.issue.status if complaint.issue else None,
            timeline=timeline_items
        )

    @classmethod
    def rate_complaint(
        cls,
        db: Session,
        complaint_id: str,
        citizen_id: str,
        rating: int,
        feedback: Optional[str] = None
    ) -> Optional[ComplaintDetailResponse]:
        """Citizen satisfaction rating for resolved complaints"""
        complaint = db.query(Complaint).filter(
            Complaint.id == complaint_id,
            Complaint.user_id == citizen_id
        ).first()
        if not complaint:
            return None

        complaint.satisfaction_rating = rating
        complaint.satisfaction_feedback = feedback
        complaint.rated_at = datetime.utcnow()
        complaint.updated_at = datetime.utcnow()

        db.add(ComplaintStatusHistory(
            complaint_id=str(complaint.id),
            status=complaint.status,
            note=f"Citizen rated resolution {rating}/5 stars" + (f": {feedback}" if feedback else ""),
            changed_by=_safe_uuid(citizen_id)
        ))

        db.commit()
        db.refresh(complaint)
        return cls.get_complaint_detail(db, complaint_id)

    @classmethod
    def update_complaint_status(
        cls,
        db: Session,
        complaint_id: str,
        new_status: str,
        note: Optional[str],
        changed_by_id: str
    ) -> Optional[Complaint]:
        """Updates individual complaint status with audit history"""
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None

        complaint.status = new_status
        complaint.updated_at = datetime.utcnow()

        db.add(ComplaintStatusHistory(
            complaint_id=str(complaint.id),
            status=new_status,
            note=note or f"Status updated to {new_status}",
            changed_by=_safe_uuid(changed_by_id)
        ))

        db.commit()
        db.refresh(complaint)
        return complaint
