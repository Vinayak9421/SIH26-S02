import re
from typing import TypedDict, Optional, List
from app.services.ai.embedding_service import EmbeddingService
from app.services.ai.classification_service import CategoryClassifier
from app.services.ai.priority_service import compute_priority
from app.services.ai.duplicate_service import match_issue, IssueCandidate

# Singleton AI services for fast inference
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
    reason: Optional[str]


def normalize_text(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned


def analyze_complaint(
    text: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    active_issues: Optional[List[IssueCandidate]] = None
) -> AnalysisResult:
    """
    Unified AI Analysis Pipeline matching Section 25.
    1. Normalizes complaint text
    2. Generates 384-dimensional dense sentence embeddings
    3. Performs multilingual zero-shot classification & department routing
    4. Computes explainable priority score & reasons
    5. Matches against active Issues for semantic and geographic duplicate detection
    """
    embedder, classifier = get_ai_pipeline()
    clean_text = normalize_text(text)

    # 1. Generate 384-dimensional embedding
    embedding = embedder.encode_one(clean_text)

    # 2. Multilingual Category Classification
    cls_result = classifier.classify(clean_text, precomputed_vector=embedding)
    category = cls_result["category"]
    department = cls_result["department"]
    confidence = cls_result["confidence"]
    needs_human_review = cls_result["needs_human_review"]

    # 3. Duplicate and Issue Matching
    dup_result = match_issue(
        complaint_embedding=embedding,
        category=category,
        latitude=latitude,
        longitude=longitude,
        active_issues=active_issues or []
    )

    duplicate_state = dup_result.get("state", "none")
    matched_issue_id = dup_result.get("matched_issue_id")
    matched_issue_title = dup_result.get("matched_issue_title")
    similarity = dup_result.get("semantic_similarity")
    distance = dup_result.get("distance_meters")
    dup_reason = dup_result.get("reason")

    # 4. Priority Computation (with impact bonus if duplicate of existing issue)
    existing_reports_count = 0
    if active_issues and matched_issue_id:
        for iss in active_issues:
            if str(iss.id) == str(matched_issue_id):
                existing_reports_count = iss.complaint_count
                break

    prio_result = compute_priority(clean_text, existing_issue_count=existing_reports_count)

    return {
        "normalized_text": clean_text,
        "embedding": embedding,
        "category": category,
        "department_key": category,
        "department": department,
        "confidence": confidence,
        "needs_human_review": needs_human_review,
        "priority": prio_result.level,
        "priority_score": prio_result.score,
        "priority_reasons": prio_result.reasons,
        "duplicate_state": duplicate_state,
        "matched_issue_id": matched_issue_id,
        "matched_issue_title": matched_issue_title,
        "semantic_similarity": similarity,
        "distance_meters": distance,
        "reason": dup_reason
    }
