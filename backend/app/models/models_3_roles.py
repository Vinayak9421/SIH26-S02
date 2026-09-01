import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    Enum,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base

class AppRole(str, enum.Enum):
    USER = "user"
    DEPARTMENT_ADMIN = "department_admin"
    SUPER_ADMIN = "super_admin"

class ComplaintStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class IssueStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DuplicateState(str, enum.Enum):
    NONE = "none"
    POSSIBLE = "possible"
    LINKED = "linked"


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    category_key = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    profiles = relationship("Profile", back_populates="department")
    issues = relationship("Issue", back_populates="department")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    role = Column(Enum(AppRole), default=AppRole.USER, nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="profiles")
    profile_details = relationship("UserProfileDetail", back_populates="profile", uselist=False)
    complaints = relationship("Complaint", back_populates="user")


class UserProfileDetail(Base):
    __tablename__ = "user_profile_details"

    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    mobile_number = Column(String(20), nullable=True)
    preferred_language = Column(String(20), default="en", nullable=False)
    city = Column(String(100), nullable=True)
    locality_or_ward = Column(String(100), nullable=True)
    notification_in_app = Column(Boolean, default=True, nullable=False)
    notification_email = Column(Boolean, default=False, nullable=False)
    default_latitude = Column(Float, nullable=True)
    default_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship
    profile = relationship("Profile", back_populates="profile_details")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    priority_score = Column(Integer, default=0, nullable=False)
    priority_reasons = Column(JSON, default=list, nullable=False)
    
    complaint_count = Column(Integer, default=0, nullable=False)
    status = Column(Enum(IssueStatus), default=IssueStatus.OPEN, nullable=False)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    hotspot_key = Column(String(100), nullable=True)
    
    ai_confidence = Column(Numeric(4, 2), nullable=True)
    needs_human_review = Column(Boolean, default=False, nullable=False)
    
    created_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    last_updated_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    department = relationship("Department", back_populates="issues")
    complaints = relationship("Complaint", back_populates="issue")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    issue_id = Column(String(36), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    text = Column(Text, nullable=False)
    normalized_text = Column(Text, nullable=True)
    language_hint = Column(String(20), nullable=True)
    
    ai_category = Column(String(100), nullable=True)
    ai_confidence = Column(Numeric(4, 2), nullable=True)
    
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    priority_score = Column(Integer, default=0, nullable=False)
    priority_reasons = Column(JSON, default=list, nullable=False)
    
    duplicate_state = Column(Enum(DuplicateState), default=DuplicateState.NONE, nullable=False)
    duplicate_of_issue_id = Column(String(36), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.PENDING, nullable=False)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    
    citizen_visible_note = Column(Text, nullable=True)
    internal_admin_note = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="complaints")
    issue = relationship("Issue", back_populates="complaints")


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(String(36), primary_key=True, index=True)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(ComplaintStatus), nullable=False)
    note = Column(Text, nullable=True)
    visibility = Column(String(50), default="user", nullable=False)
    changed_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id = Column(String(36), primary_key=True, index=True)
    issue_id = Column(String(36), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(IssueStatus), nullable=False)
    note = Column(Text, nullable=True)
    visibility = Column(String(50), default="user", nullable=False)
    changed_by = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, index=True)
    actor_id = Column(String(36), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    action = Column(String(100), nullable=False)
    before_data = Column(JSON, nullable=True)
    after_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
