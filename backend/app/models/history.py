import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    # NeonDB: visibility controls public vs internal note display
    visibility = Column(String(20), nullable=False, default="user")  # 'user' (citizen-visible) or 'admin'
    changed_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="status_history")


class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_id = Column(String(36), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    # NeonDB: visibility controls public vs internal note display
    visibility = Column(String(20), nullable=False, default="user")  # 'user' (citizen-visible) or 'admin'
    changed_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    issue = relationship("Issue", back_populates="status_history")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    entity_type = Column(String(50), nullable=False)  # complaint, issue, department
    entity_id = Column(String(36), nullable=False)
    action = Column(String(50), nullable=False)
    before_data = Column(Text, nullable=True)  # JSON string
    after_data = Column(Text, nullable=True)   # JSON string
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class UserProfileDetails(Base):
    """
    Extended citizen profile details. Maps to NeonDB 'user_profile_details' table.
    One-to-one with profiles (ON DELETE CASCADE).
    Used for: city, locality, notification preferences, default map location, language.
    Frontend: CitizenProfile/Settings page, and nearby map centering.
    """
    __tablename__ = "user_profile_details"

    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    mobile_number = Column(Text, nullable=True)
    preferred_language = Column(Text, nullable=False, default="en")
    city = Column(Text, nullable=True)
    locality_or_ward = Column(Text, nullable=True)
    # Notification preferences
    notification_in_app = Column(Boolean, nullable=False, default=True)
    notification_email = Column(Boolean, nullable=False, default=False)
    # Default location for map centering (citizen's home area)
    default_latitude = Column(Float, nullable=True)
    default_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="profile_details")

