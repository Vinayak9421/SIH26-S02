from typing import TypedDict, Optional, List, Dict, Any
from app.services.ai.image_extractor import extract_text_from_image
from app.services.ai.embedding_service import generate_embedding
from app.services.ai.classification_service import classify_text
from app.services.ai.priority_service import compute_priority
from app.services.ai.duplicate_service import match_duplicate_issue

class AnalysisResult(TypedDict):
    extracted_text_from_image: Optional[str]
    combined_text: str
    normalized_text: str
    embedding: List[float]
    category: str
    department_key: str
    confidence: float
    needs_human_review: bool
    priority: str
    priority_score: int
    priority_reasons: List[str]
    duplicate_state: str
    matched_issue_id: Optional[str]
    matched_issue_title: Optional[str]
    semantic_similarity: Optional[float]
    distance_meters: Optional[int]

def analyze_complaint(
    text: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    image_filename: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    active_issues: Optional[List[Dict[str, Any]]] = None
) -> AnalysisResult:
    """
    Unified AI Ingestion Entry Point.
    Processes complaint text and optional image artifact, produces 384-dim vector embeddings,
    classifies department, calculates priority score & risk reasons, and detects duplicates.
    """
    active_issues = active_issues or []
    extracted_image_text = None

    # 1. Image extraction if image provided
    if image_bytes:
        extracted_image_text = extract_text_from_image(image_bytes, image_filename)

    # 2. Combine user text & image extracted description
    primary_text = text.strip() if text and text.strip() else (extracted_image_text or "Unspecified civic complaint submission")
    
    text_parts = []
    if text and text.strip():
        text_parts.append(text.strip())
    if extracted_image_text and extracted_image_text.strip():
        text_parts.append(f"[Image Evidence]: {extracted_image_text.strip()}")

    combined_text = " ".join(text_parts) if text_parts else primary_text
    normalized_text = combined_text.lower()

    # 3. Vector Embedding
    embedding = generate_embedding(combined_text)

    # 4. Semantic Classification (Primary text focused)
    clf_res = classify_text(primary_text, embedding)

    # 5. Priority Engine
    prio_res = compute_priority(combined_text, len(active_issues))

    # 6. Duplicate Matcher
    dup_res = match_duplicate_issue(
        complaint_embedding=embedding,
        category=clf_res["category"],
        latitude=latitude,
        longitude=longitude,
        active_issues=active_issues
    )

    return AnalysisResult(
        extracted_text_from_image=extracted_image_text,
        combined_text=combined_text,
        normalized_text=normalized_text,
        embedding=embedding,
        category=clf_res["category"],
        department_key=clf_res["department_key"],
        confidence=clf_res["confidence"],
        needs_human_review=clf_res["needs_human_review"],
        priority=prio_res.level,
        priority_score=prio_res.score,
        priority_reasons=prio_res.reasons,
        duplicate_state=dup_res["duplicate_state"],
        matched_issue_id=dup_res["matched_issue_id"],
        matched_issue_title=dup_res["matched_issue_title"],
        semantic_similarity=dup_res["semantic_similarity"],
        distance_meters=dup_res["distance_meters"]
    )
