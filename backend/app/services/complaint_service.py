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

logger = logging.getLogger("uvicorn.error")

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
                department_id=department_id,
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
                issue_id=target_issue.id,
                status="open",
                note="New civic issue created from citizen report"
            ))

            if duplicate_state == "possible":
                issue_action = "possible_duplicate"
            else:
                issue_action = "created_new_issue"

        # 5. Create Complaint Record
        new_complaint = Complaint(
            citizen_id=current_user.id,
            issue_id=target_issue.id,
            department_id=department_id,
            text=payload.text,
            normalized_text=ai_res["normalized_text"],
            embedding=json.dumps(ai_res["embedding"]),
            ai_category=category,
            ai_confidence=ai_res["confidence"],
            priority=ai_res["priority"],
            priority_score=ai_res["priority_score"],
            priority_reasons=json.dumps(ai_res["priority_reasons"]),
            duplicate_state=duplicate_state,
            duplicate_of_issue_id=matched_issue_id if duplicate_state == "linked" else None,
            status="pending",
            latitude=payload.latitude,
            longitude=payload.longitude,
            address=payload.address
        )
        db.add(new_complaint)
        db.flush()

        # 6. Create Complaint Status History
        db.add(ComplaintStatusHistory(
            complaint_id=new_complaint.id,
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
    def get_citizen_complaints(cls, db: Session, citizen_id: str) -> List[ComplaintListItem]:
        """Fetch citizen's own complaints"""
        complaints = db.query(Complaint).filter(Complaint.citizen_id == citizen_id).order_by(desc(Complaint.created_at)).all()
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
            try:
                reasons = json.loads(complaint.priority_reasons)
            except Exception:
                reasons = [complaint.priority_reasons]

        timeline_items = []
        for hist in complaint.status_history:
            timeline_items.append(
                ComplaintTimelineItem(
                    status=hist.status,
                    note=hist.note,
                    changed_by=hist.changed_by,
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
            created_at=complaint.created_at,
            updated_at=complaint.updated_at,
            issue_id=str(complaint.issue.id) if complaint.issue else None,
            issue_title=complaint.issue.title if complaint.issue else None,
            issue_status=complaint.issue.status if complaint.issue else None,
            timeline=timeline_items
        )

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
            complaint_id=complaint.id,
            status=new_status,
            note=note or f"Status updated to {new_status}",
            changed_by=changed_by_id
        ))

        db.commit()
        db.refresh(complaint)
        return complaint
