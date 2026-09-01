import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Issue(Base):
    """
    Issue represents the underlying civic problem acted upon by authorities.
    Many Complaints link to One Issue.
    """
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="NO ACTION"), nullable=False, index=True)
    # assigned_officer_id not yet in NeonDB — will be added via migration
    assigned_officer_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    assigned_officer_name = Column(String(100), nullable=True)
    title = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    representative_embedding = Column(Text, nullable=True)  # Serialized 384-dim JSON vector; NeonDB stores as pgvector
    priority = Column(String(20), nullable=False, default="medium", index=True)  # low, medium, high, critical
    priority_score = Column(Integer, nullable=False, default=0)
    complaint_count = Column(Integer, nullable=False, default=0)  # NeonDB default is 0
    status = Column(String(50), nullable=False, default="open", index=True)  # open, in_progress, resolved
    # Extra NeonDB columns
    ai_confidence = Column(Float, nullable=True)
    needs_human_review = Column(Boolean, nullable=False, default=False)
    created_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    last_updated_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    hotspot_key = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="issues")
    assigned_officer = relationship("Profile", back_populates="assigned_issues", foreign_keys=[assigned_officer_id])
    complaints = relationship("Complaint", back_populates="issue", foreign_keys="Complaint.issue_id")
    status_history = relationship("IssueStatusHistory", back_populates="issue", cascade="all, delete-orphan")
