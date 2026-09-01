from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ComplaintBase(BaseModel):
    description: str = Field(..., min_length=5, description="Original citizen complaint text")
    language: Optional[str] = Field("en", description="Detected or specified language")
    latitude: Optional[float] = Field(None, description="GIS Latitude coordinate")
    longitude: Optional[float] = Field(None, description="GIS Longitude coordinate")
    location_name: Optional[str] = Field(None, description="Descriptive location (e.g., Sector 5, Ward 12)")


class ComplaintCreate(ComplaintBase):
    """Citizen complaint submission request schema"""
    pass


class AIClassificationResult(BaseModel):
    """Structured AI output schema corresponding to Section 6.2 & 6.3"""
    category: str = Field(..., description="Complaint category (e.g., Water Supply, Electricity, Roads)")
    department: str = Field(..., description="Responsible authority/department")
    priority: str = Field("MEDIUM", description="CRITICAL, HIGH, MEDIUM, LOW")
    summary: str = Field(..., description="Concise AI-generated summary")
    confidence: float = Field(0.95, description="Model classification confidence score (0.0 to 1.0)")
    urgency_score: Optional[int] = Field(None, description="Calculated urgency score based on transparent scoring rule")
    explanation: Optional[str] = Field(None, description="AI reasoning for priority or routing")


class DuplicateMatch(BaseModel):
    """Matched similar or duplicate complaint details"""
    complaint_id: int
    tracking_id: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    similarity_score: float
    is_duplicate: bool = False


class ComplaintResponse(BaseModel):
    """Full complaint response schema"""
    id: int
    tracking_id: Optional[str] = None
    description: str
    language: Optional[str] = "en"
    category: Optional[str] = None
    department: Optional[str] = None
    priority: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    ai_confidence: Optional[float] = None
    summary: Optional[str] = None
    duplicate_of: Optional[int] = None
    similarity_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ComplaintListItem(BaseModel):
    """Lightweight complaint item schema for dashboard lists and tables"""
    id: int
    tracking_id: Optional[str] = None
    description: str
    category: Optional[str] = None
    department: Optional[str] = None
    priority: str
    status: str
    location_name: Optional[str] = None
    summary: Optional[str] = None
    duplicate_of: Optional[int] = None
    similarity_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintStatusUpdate(BaseModel):
    """Authority status update payload"""
    status: str = Field(..., description="Target status: PENDING, IN_PROGRESS, RESOLVED, REJECTED")
    notes: Optional[str] = Field(None, description="Optional administrative notes for the status change")


class DashboardStats(BaseModel):
    """Aggregate analytics for authority dashboard KPI cards and charts"""
    total_complaints: int
    critical_high_count: int
    pending_count: int
    in_progress_count: int
    resolved_count: int
    duplicate_count: int
    category_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    department_distribution: Dict[str, int]


class HotspotItem(BaseModel):
    """GIS Hotspot and cluster representation for Leaflet map"""
    id: int
    tracking_id: Optional[str] = None
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    category: Optional[str] = None
    priority: str
    status: str
    summary: Optional[str] = None
    cluster_weight: int = 1
