from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api.deps import get_db
from app.models.complaint import Complaint
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintListItem,
    ComplaintStatusUpdate
)
from app.services.ai_service import AIService
from app.services.embedding_service import EmbeddingService
from app.services.duplicate_service import DuplicateService

router = APIRouter()


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db)
):
    """
    Intake and process a new citizen complaint.
    1. AI / NLP Classification & Summarization
    2. Vector Embedding Generation
    3. Semantic Duplicate Detection against existing DB records
    4. Persist to Neon PostgreSQL
    """
    # 1. AI Analysis
    ai_result = await AIService.process_complaint_text(payload.description)
    
    # 2. Embedding Generation
    embedding = EmbeddingService.generate_embedding(payload.description)
    embedding_json = EmbeddingService.serialize_embedding(embedding)
    
    # 3. Duplicate Detection
    duplicate_of, similarity_score = DuplicateService.evaluate_duplicate(
        db=db,
        new_embedding=embedding,
        category=ai_result.category
    )

    # 4. Generate tracking ID (e.g. GRV-1001)
    count = db.query(Complaint).count()
    tracking_id = f"GRV-{1001 + count}"

    # 5. Persist
    new_complaint = Complaint(
        tracking_id=tracking_id,
        description=payload.description,
        language=payload.language or "en",
        category=ai_result.category,
        department=ai_result.department,
        priority=ai_result.priority,
        status="PENDING",
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_name=payload.location_name,
        ai_confidence=ai_result.confidence,
        summary=ai_result.summary,
        duplicate_of=duplicate_of,
        similarity_score=similarity_score,
        embedding_json=embedding_json
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


@router.get("", response_model=List[ComplaintListItem])
def list_complaints(
    category: Optional[str] = Query(None, description="Filter by category"),
    department: Optional[str] = Query(None, description="Filter by department"),
    priority: Optional[str] = Query(None, description="Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search keyword"),
    is_duplicate: Optional[bool] = Query(None, description="Filter duplicate status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    List complaints for Authority Dashboard with multi-criteria filtering and pagination.
    """
    query = db.query(Complaint)

    if category:
        query = query.filter(Complaint.category == category)
    if department:
        query = query.filter(Complaint.department == department)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if is_duplicate is True:
        query = query.filter(Complaint.duplicate_of.isnot(None))
    elif is_duplicate is False:
        query = query.filter(Complaint.duplicate_of.is_(None))
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.description.ilike(search_pattern),
                Complaint.tracking_id.ilike(search_pattern),
                Complaint.summary.ilike(search_pattern),
                Complaint.location_name.ilike(search_pattern)
            )
        )

    complaints = query.order_by(desc(Complaint.created_at)).offset(skip).limit(limit).all()
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_detail(
    complaint_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve single complaint details by ID.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} not found"
        )
    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Authority action to update complaint status (e.g. PENDING -> IN_PROGRESS -> RESOLVED).
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} not found"
        )

    valid_statuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"]
    clean_status = payload.status.upper()
    if clean_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Must be one of {valid_statuses}"
        )

    complaint.status = clean_status
    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/seed-demo", status_code=status.HTTP_200_OK)
def seed_demo_complaints(db: Session = Depends(get_db)):
    """
    Seed initial sample grievances including the Golden Demo Water Outage pair from Section 11 & 12.
    """
    if db.query(Complaint).count() > 0:
        return {"message": "Database already contains complaints", "count": db.query(Complaint).count()}

    samples = [
        {
            "tracking_id": "GRV-1001",
            "description": "There has been no water supply in Sector 5 for three days.",
            "latitude": 28.5355,
            "longitude": 77.3910,
            "location_name": "Sector 5, Noida",
        },
        {
            "tracking_id": "GRV-1002",
            "description": "Severe voltage fluctuation and transformer spark in Sector 14 near community hall.",
            "latitude": 28.5410,
            "longitude": 77.3820,
            "location_name": "Sector 14",
        },
        {
            "tracking_id": "GRV-1003",
            "description": "Deep dangerous pothole on the main highway road near Apollo Hospital causing traffic jams.",
            "latitude": 28.5300,
            "longitude": 77.3990,
            "location_name": "Apollo Highway Crossing",
        },
        {
            "tracking_id": "GRV-1004",
            "description": "Garbage dump overflowing outside government primary school creating severe stench.",
            "latitude": 28.5380,
            "longitude": 77.3950,
            "location_name": "Sector 7 School Zone",
        }
    ]

    created_records = []
    for item in samples:
        ai_res = AIService.fallback_classify(item["description"])
        emb = EmbeddingService.generate_embedding(item["description"])
        emb_json = EmbeddingService.serialize_embedding(emb)

        complaint = Complaint(
            tracking_id=item["tracking_id"],
            description=item["description"],
            category=ai_res.category,
            department=ai_res.department,
            priority=ai_res.priority,
            status="PENDING",
            latitude=item["latitude"],
            longitude=item["longitude"],
            location_name=item["location_name"],
            ai_confidence=ai_res.confidence,
            summary=ai_res.summary,
            embedding_json=emb_json
        )
        db.add(complaint)
        created_records.append(complaint)

    db.commit()
    return {"message": "Demo complaints seeded successfully", "count": len(created_records)}
