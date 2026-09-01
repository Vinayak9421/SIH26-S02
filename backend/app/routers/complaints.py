from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.dependencies import get_db, get_current_user, require_department_admin
from app.models.complaint import Complaint
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintSubmitResponse,
    ComplaintDetailResponse,
    ComplaintListItem,
    ComplaintStatusUpdate,
    ComplaintRatingCreate
)
from app.schemas.user import CurrentUser
from app.services.complaint_service import ComplaintService
from app.services.issue_service import IssueService
from app.services.ai.category_templates import CATEGORY_DEPARTMENT_MAPPING, normalize_category


router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Intake citizen complaint, run AI analysis, match/link Issue, persist and return structured AI result.
    """
    return ComplaintService.submit_complaint(
        db=db,
        payload=payload,
        current_user=current_user
    )


@router.get("/mine", response_model=List[ComplaintListItem])
async def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Returns citizen's own submitted complaints with status and linked issue.
    """
    return ComplaintService.get_citizen_complaints(db=db, user_id=current_user.id)


@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
async def get_complaint_detail(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Returns complaint detail, safe AI insights, and status timeline.
    """
    complaint = ComplaintService.get_complaint_detail(db=db, complaint_id=complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )
    return complaint


@router.get("", response_model=List[ComplaintListItem])
async def list_department_complaints(
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by priority"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Authority endpoint: Returns department-scoped complaint list.
    """
    query = db.query(Complaint)

    # If department_admin, scope to their assigned department unless super_admin
    dept_key = current_user.department_key if (current_user.role == "department_admin" and current_user.department_key) else category
    if dept_key:
        norm_cat = normalize_category(dept_key)
        try:
            import uuid as _uuid_mod
            _uuid_mod.UUID(str(dept_key))
            is_uuid = True
        except Exception:
            is_uuid = False

        if is_uuid:
            query = query.filter(
                or_(
                    Complaint.department_id == dept_key,
                    Complaint.ai_category == norm_cat
                )
            )
        else:
            query = query.filter(
                or_(
                    Complaint.ai_category == norm_cat,
                    Complaint.ai_category == dept_key
                )
            )



    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if priority_filter:
        query = query.filter(Complaint.priority == priority_filter)

    complaints = query.order_by(desc(Complaint.created_at)).offset(skip).limit(limit).all()
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


@router.patch("/{complaint_id}/status", response_model=ComplaintDetailResponse)
async def update_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Authority action to update individual complaint status with audit note.
    """
    updated = ComplaintService.update_complaint_status(
        db=db,
        complaint_id=complaint_id,
        new_status=payload.status,
        note=payload.note,
        changed_by_id=current_user.id
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )
    return ComplaintService.get_complaint_detail(db=db, complaint_id=complaint_id)


@router.post("/{complaint_id}/unlink-issue", response_model=ComplaintDetailResponse)
async def unlink_complaint_from_issue(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Department Admin override: unlinks complaint from incorrectly matched Issue and creates separate Issue.
    """
    unlinked = IssueService.unlink_complaint(
        db=db,
        complaint_id=complaint_id,
        changed_by_id=current_user.id
    )
    if not unlinked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found"
        )
    return ComplaintService.get_complaint_detail(db=db, complaint_id=complaint_id)


@router.post("/{complaint_id}/rate", response_model=ComplaintDetailResponse)
async def rate_complaint(
    complaint_id: str,
    payload: ComplaintRatingCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Citizen satisfaction rating (1-5 stars) and feedback for resolved complaints.
    """
    updated = ComplaintService.rate_complaint(
        db=db,
        complaint_id=complaint_id,
        citizen_id=current_user.id,  # rate_complaint internally uses user_id column
        rating=payload.rating,
        feedback=payload.feedback
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found or not owned by current user"
        )
    return updated

