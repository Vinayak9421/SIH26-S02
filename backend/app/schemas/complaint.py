from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ComplaintCreate(BaseModel):
    text: str = Field(..., min_length=10, max_length=2000, description="Citizen complaint description")
    address: Optional[str] = Field(default=None, max_length=300, description="Address or landmark")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="GPS Latitude")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="GPS Longitude")


class ClassificationOutput(BaseModel):
    category: str
    department: str
    confidence: float
    needs_human_review: bool


class PriorityOutput(BaseModel):
    level: str
    score: int
    reasons: List[str]


class DuplicateOutput(BaseModel):
    state: Literal["none", "possible", "linked"]
    semantic_similarity: Optional[float] = None
    distance_meters: Optional[int] = None
    matched_issue_title: Optional[str] = None


class ComplaintSubmitResponse(BaseModel):
    complaint_id: str
    issue_id: str
    issue_action: Literal["created_new_issue", "linked_to_existing_issue", "possible_duplicate"]
    classification: ClassificationOutput
    priority: PriorityOutput
    duplicate: DuplicateOutput


class ComplaintTimelineItem(BaseModel):
    status: str
    note: Optional[str] = None
    changed_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintDetailResponse(BaseModel):
    id: str
    text: str
    status: str
    category: Optional[str] = None
    department: Optional[str] = None
    priority: str
    priority_score: int
    priority_reasons: List[str] = []
    duplicate_state: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    satisfaction_rating: Optional[int] = None
    satisfaction_feedback: Optional[str] = None
    rated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    issue_id: Optional[str] = None
    issue_title: Optional[str] = None
    issue_status: Optional[str] = None
    timeline: List[ComplaintTimelineItem] = []

    model_config = ConfigDict(from_attributes=True)


class ComplaintListItem(BaseModel):
    id: str
    text: str
    category: Optional[str] = None
    department: Optional[str] = None
    priority: str
    priority_score: int
    status: str
    duplicate_state: str
    issue_id: Optional[str] = None
    address: Optional[str] = None
    satisfaction_rating: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintStatusUpdate(BaseModel):
    status: Literal["pending", "in_progress", "resolved", "rejected"]
    note: Optional[str] = None


class ComplaintRatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Satisfaction rating from 1 to 5 stars")
    feedback: Optional[str] = Field(default=None, max_length=1000, description="Optional citizen feedback text")

