import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(Text, nullable=True)
    email = Column(Text, nullable=True, unique=True)
    role = Column(String(50), nullable=False, default="citizen")  # citizen, department_admin, super_admin
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="profiles")
    complaints = relationship("Complaint", back_populates="citizen")
    assigned_issues = relationship("Issue", back_populates="assigned_officer")
