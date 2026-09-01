import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Complaint(Base):
    """
    SQLAlchemy Complaint Model corresponding to Section 8.1 of SIH26-S02 specification.
    Stores citizen grievances, AI classification, priority score, duplicate status, and GIS coordinates.
    """
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tracking_id = Column(String(50), unique=True, index=True, nullable=True)  # e.g., GRV-1001
    description = Column(Text, nullable=False)
    language = Column(String(20), default="en", nullable=True)
    
    # AI Classification & Routing
    category = Column(String(100), index=True, nullable=True)       # e.g., Water Supply, Electricity, Roads
    department = Column(String(100), index=True, nullable=True)     # e.g., Water Department
    priority = Column(String(20), index=True, default="MEDIUM")     # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), index=True, default="PENDING")      # PENDING, IN_PROGRESS, RESOLVED, REJECTED
    
    # GIS / Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)               # e.g., Sector 5, Ward 12
    
    # AI Metadata & Summaries
    ai_confidence = Column(Float, nullable=True)                     # e.g., 0.94
    summary = Column(Text, nullable=True)
    
    # Duplicate Detection & Semantic Links
    duplicate_of = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    similarity_score = Column(Float, nullable=True)                  # e.g., 0.92
    
    # Embedding vector serialization (stored as JSON string or pgvector)
    embedding_json = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Self-referencing relationship for duplicate complaints
    parent_complaint = relationship("Complaint", remote_side=[id], backref="duplicate_complaints")

    def __repr__(self):
        return f"<Complaint(id={self.id}, tracking_id='{self.tracking_id}', category='{self.category}', priority='{self.priority}')>"
