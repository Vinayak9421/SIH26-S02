import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Profile(Base):
    """
    Maps to NeonDB 'profiles' table.
    Roles via app_role enum: 'citizen', 'user' (legacy), 'department_admin', 'super_admin'.
    """
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(Text, nullable=False)
    email = Column(Text, nullable=True, unique=True)
    # NeonDB app_role enum: citizen, user, department_admin, super_admin
    role = Column(String(50), nullable=False, default="citizen")
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Columns added via safe migration (phone, password_hash, last_login)
    phone = Column(String(20), nullable=True)
    password_hash = Column(Text, nullable=True)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    department = relationship("Department", back_populates="profiles")
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.user_id")
    assigned_issues = relationship("Issue", back_populates="assigned_officer", foreign_keys="Issue.assigned_officer_id")
    profile_details = relationship("UserProfileDetails", back_populates="user", uselist=False, cascade="all, delete-orphan")



