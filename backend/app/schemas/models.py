from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.ai.priority import PriorityFactor


class ComplaintBase(BaseModel):
    text: str
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    user_id: str | None = None


class ComplaintCreate(ComplaintBase):
    pass


class AnalysisResult(BaseModel):
    complaint_id: str | None = None
    detected_language: str
    normalized_text: str
    category: str
    department: str
    classification_confidence: float
    confidence_label: str
    priority: str
    priority_score: int
    priority_factors: list[PriorityFactor]
    priority_reasons: list[str]
    duplicate_detected: bool
    duplicate_confidence: float | None = None
    duplicate_relation: str | None = None
    matched_complaint_id: str | None = None
    matched_complaint_text: str | None = None
    matched_distance_m: float | None = None
    matched_similarity: float | None = None
    matched_at: str | None = None
    matched_status: str | None = None
    issue_id: str | None = None
    issue_title: str | None = None
    issue_complaint_count: int = 0
    recommended_action: str
    routing_department: str
    human_review: bool = False
    similarity_scores: dict[str, float] = {}


class ComplaintOut(ComplaintBase):
    id: str
    complaint_number: str
    department_id: str | None
    issue_id: str | None
    category: str
    priority: str
    priority_score: int
    status: str
    created_at: datetime
    updated_at: datetime
    analysis: AnalysisResult | None = None


class StatusUpdate(BaseModel):
    status: str
    changed_by: str | None = None


class IssueOut(BaseModel):
    id: str
    issue_number: str
    title: str
    description: str
    department_id: str | None
    category: str
    priority: str
    priority_score: int
    complaint_count: int
    status: str
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    updated_at: datetime


class IssueDetail(IssueOut):
    complaints: list[ComplaintOut] = []
    ai_summary: str | None = None


class DepartmentOut(BaseModel):
    id: str
    name: str
    description: str
    template: str


class DuplicateRelationOut(BaseModel):
    complaint_id: str
    matched_complaint_id: str
    similarity_score: float
    geo_distance: float
    relation_type: str


class StatusHistoryOut(BaseModel):
    id: str
    complaint_id: str
    status: str
    changed_by: str | None
    changed_at: datetime


class AnalyticsSummary(BaseModel):
    total_complaints: int
    pending: int
    critical: int
    resolved: int
    duplicates_detected: int
    active_issues: int
    by_department: dict[str, int]
    by_priority: dict[str, int]
    by_status: dict[str, int]
    duplicate_rate: float
    resolved_rate: float
    top_wards: list[dict[str, Any]]
