from uuid import UUID
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict


class DepartmentBreakdown(BaseModel):
    category: str
    count: int


class PriorityBreakdown(BaseModel):
    priority: str
    count: int


class AnalyticsSummary(BaseModel):
    open_issues: int
    critical_issues: int
    high_priority_issues: int
    linked_duplicate_complaints: int
    resolved_issues: int
    department_breakdown: List[DepartmentBreakdown]
    priority_breakdown: List[PriorityBreakdown]


class HotspotItem(BaseModel):
    hotspot_key: str
    latitude: float
    longitude: float
    count: int
    dominant_category: str
    highest_priority: str


class MapIssueMarker(BaseModel):
    id: Union[str, UUID]
    title: str
    category: str
    priority: str
    status: str
    complaint_count: int
    latitude: float
    longitude: float
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DepartmentResponse(BaseModel):
    id: Union[str, UUID]
    name: str
    category_key: str
    description: Optional[str] = None
    active: bool

    model_config = ConfigDict(from_attributes=True)
