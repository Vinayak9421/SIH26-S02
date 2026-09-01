from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class LinkedComplaintPreview(BaseModel):
    id: str
    text: str
    priority: str
    status: str
    address: Optional[str] = None
    image_url: Optional[str] = None
    extracted_text_from_image: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class IssueStatusTimelineItem(BaseModel):
    status: str
    note: Optional[str] = None
    changed_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IssueListItem(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    category: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    priority: str
    priority_score: int
    complaint_count: int
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    hotspot_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IssueDetailResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    category: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    priority: str
    priority_score: int
    complaint_count: int
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    hotspot_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    linked_complaints: List[LinkedComplaintPreview] = []
    timeline: List[IssueStatusTimelineItem] = []

    model_config = ConfigDict(from_attributes=True)


class IssueUpdate(BaseModel):
    status: Optional[Literal["open", "in_progress", "resolved"]] = None
    priority: Optional[Literal["low", "medium", "high", "critical"]] = None
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    note: Optional[str] = None


class ResolveIssueResponse(BaseModel):
    issue_id: str
    status: str
    resolved_at: datetime
    linked_complaints_resolved_count: int
    message: str
