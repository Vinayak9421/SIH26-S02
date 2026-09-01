from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user, require_department_admin
from app.schemas.issue import (
    IssueListItem,
    IssueDetailResponse,
    IssueUpdate,
    ResolveIssueResponse
)
from app.schemas.user import CurrentUser
from app.services.issue_service import IssueService

router = APIRouter(prefix="/issues", tags=["Issues (Authority Operations)"])


@router.get("", response_model=List[IssueListItem])
async def list_issues(
    category: Optional[str] = Query(None, description="Filter by category/department key"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (open, in_progress, resolved)"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by priority (critical, high, medium, low)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Authority Issue Queue: returns priority-ranked issues filtered by department and status.
    """
    dept_key = category
    if current_user.role == "department_admin" and current_user.department_key:
        dept_key = current_user.department_key

    return IssueService.list_issues(
        db=db,
        department_key=dept_key,
        status_filter=status_filter,
        priority_filter=priority_filter,
        skip=skip,
        limit=limit
    )


@router.get("/{issue_id}", response_model=IssueDetailResponse)
async def get_issue_detail(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Returns full Issue details including linked complaint previews and status timeline.
    """
    issue = IssueService.get_issue_detail(db=db, issue_id=issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found"
        )
    return issue


@router.patch("/{issue_id}", response_model=IssueDetailResponse)
async def update_issue(
    issue_id: str,
    payload: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Authority action to update issue status, priority, or assigned officer.
    """
    updated = IssueService.update_issue(
        db=db,
        issue_id=issue_id,
        payload=payload,
        changed_by_id=current_user.id
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found"
        )
    return updated


@router.post("/{issue_id}/resolve", response_model=ResolveIssueResponse)
async def resolve_issue(
    issue_id: str,
    note: Optional[str] = Query(None, description="Optional resolution note"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_department_admin)
):
    """
    Authority action: Resolves the underlying Issue and automatically resolves all linked citizen complaints.
    """
    resolved_res = IssueService.resolve_issue(
        db=db,
        issue_id=issue_id,
        changed_by_id=current_user.id,
        note=note
    )
    if not resolved_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found"
        )
    return resolved_res
