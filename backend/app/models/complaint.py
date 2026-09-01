import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Complaint(Base):
    """
    Complaint represents an individual citizen report linking to an underlying Issue.
    """
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # NeonDB column is 'user_id' (not citizen_id) — FK to profiles
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False, index=True)
    issue_id = Column(String(36), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    
    text = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    extracted_text_from_image = Column(Text, nullable=True)
    normalized_text = Column(Text, nullable=True)
    language_hint = Column(String(20), default="en", nullable=True)
    embedding = Column(Text, nullable=True)  # Serialized 384-dim vector
    
    # AI Classification
    ai_category = Column(String(100), nullable=True, index=True)
    ai_confidence = Column(Float, nullable=True)
    
    # Explainable Priority
    priority = Column(String(20), nullable=False, default="medium", index=True)  # low, medium, high, critical
    priority_score = Column(Integer, nullable=False, default=0)
    priority_reasons = Column(Text, nullable=True)  # Serialized JSON list of reasons
    
    # Duplicate Analysis
    duplicate_state = Column(String(20), nullable=False, default="none", index=True)  # none, possible, linked
    duplicate_of_issue_id = Column(String(36), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    
    # Status & GIS
    status = Column(String(50), nullable=False, default="pending", index=True)  # pending, in_progress, resolved, rejected
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    # Notes — NeonDB columns
    citizen_visible_note = Column(Text, nullable=True)   # Shown to citizen in tracking view
    internal_admin_note = Column(Text, nullable=True)    # Internal dept-admin only note
    
    # Citizen Satisfaction Rating
    satisfaction_rating = Column(Integer, nullable=True)  # 1 to 5 stars
    satisfaction_feedback = Column(Text, nullable=True)
    rated_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    citizen = relationship("Profile", back_populates="complaints", foreign_keys=[user_id])
    issue = relationship("Issue", back_populates="complaints", foreign_keys=[issue_id])
    department = relationship("Department", back_populates="complaints")
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")
