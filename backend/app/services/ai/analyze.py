import re
from typing import TypedDict, Optional, List, Dict, Any
from app.services.ai.unified_analyzer import analyze_complaint as unified_analyze, AnalysisResult as UnifiedAnalysisResult
from app.services.ai.embedding_service import EmbeddingService
from app.services.ai.classification_service import CategoryClassifier
from app.services.ai.priority_service import compute_priority
from app.services.ai.duplicate_service import match_issue, IssueCandidate

_embedder = None
_classifier = None

def get_ai_pipeline():
    global _embedder, _classifier
    if _embedder is None:
        _embedder = EmbeddingService()
    if _classifier is None:
        _classifier = CategoryClassifier(_embedder)
    return _embedder, _classifier

class AnalysisResult(TypedDict):
    normalized_text: str
    embedding: List[float]
    category: str
    department_key: str
    department: str
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
    extracted_text_from_image: Optional[str]
    reason: Optional[str]

def normalize_text(text: str) -> str:
    if not text:
        return ""
    cleaned = text.strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned

def analyze_complaint(
    text: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    image_filename: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    active_issues: Optional[List[Any]] = None
) -> AnalysisResult:
    """
    Unified AI Analysis Pipeline matching Section 25.
    Supports text, photo evidence, embeddings, classification, priority calculation, and duplicate matching.
    """
    # Convert IssueCandidate list to dicts if needed
    dict_issues = []
    if active_issues:
        for iss in active_issues:
            if isinstance(iss, dict):
                dict_issues.append(iss)
            else:
                dict_issues.append({
                    "id": str(getattr(iss, "id", "")),
                    "category": getattr(iss, "category", ""),
                    "title": getattr(iss, "title", ""),
                    "embedding": getattr(iss, "embedding", []),
                    "latitude": getattr(iss, "latitude", None),
                    "longitude": getattr(iss, "longitude", None),
                    "complaint_count": getattr(iss, "complaint_count", 0),
                    "status": getattr(iss, "status", "open")
                })

    res = unified_analyze(
        text=text,
        image_bytes=image_bytes,
        image_filename=image_filename,
        latitude=latitude,
        longitude=longitude,
        active_issues=dict_issues
    )

    department_names = {
        "sanitation": "Solid Waste & Sanitation",
        "water": "Water Supply",
        "roads": "Roads & Infrastructure",
        "streetlights": "Electrical / Street Lighting",
        "health": "Public Health & Vector Control",
        "traffic": "Traffic & Public Transport",
        "general_review": "General Review Queue"
    }

    dept_name = department_names.get(res["department_key"], "General Review Queue")

    return {
        "normalized_text": res["normalized_text"],
        "embedding": res["embedding"],
        "category": res["category"],
        "department_key": res["department_key"],
        "department": dept_name,
        "confidence": res["confidence"],
        "needs_human_review": res["needs_human_review"],
        "priority": res["priority"],
        "priority_score": res["priority_score"],
        "priority_reasons": res["priority_reasons"],
        "duplicate_state": res["duplicate_state"],
        "matched_issue_id": res["matched_issue_id"],
        "matched_issue_title": res["matched_issue_title"],
        "semantic_similarity": res["semantic_similarity"],
        "distance_meters": res["distance_meters"],
        "extracted_text_from_image": res["extracted_text_from_image"],
        "reason": f"Matched state: {res['duplicate_state']}" if res["duplicate_state"] != "none" else None
    }
