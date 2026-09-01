from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import numpy as np
from app.services.ai.geo_service import haversine_m
from app.config import settings


@dataclass
class IssueCandidate:
    id: str
    category: str
    title: str
    embedding: List[float]
    latitude: Optional[float]
    longitude: Optional[float]
    complaint_count: int
    status: str


def match_issue(
    complaint_embedding: List[float],
    category: str,
    latitude: Optional[float],
    longitude: Optional[float],
    active_issues: List[IssueCandidate]
) -> Dict[str, Any]:
    """
    Semantic and Spatial Duplicate Matching against active Issues.
    """
    if not active_issues:
        return {"state": "none"}

    query = np.array(complaint_embedding, dtype=np.float32)
    norm_q = np.linalg.norm(query)
    if norm_q > 0:
        query = query / norm_q

    best = None

    for issue in active_issues:
        # Match only within same category and active status
        if issue.category != category or issue.status == "resolved":
            continue

        if not issue.embedding:
            continue

        issue_vec = np.array(issue.embedding, dtype=np.float32)
        norm_i = np.linalg.norm(issue_vec)
        if norm_i > 0:
            issue_vec = issue_vec / norm_i

        similarity = float(np.dot(query, issue_vec))
        distance = haversine_m(latitude, longitude, issue.latitude, issue.longitude)

        # Distant reports (> 1000m) are treated as distinct local issues even if text is identical
        if distance is not None and distance > 1000:
            continue

        candidate = {
            "issue": issue,
            "similarity": similarity,
            "distance": distance
        }

        if best is None or candidate["similarity"] > best["similarity"]:
            best = candidate

    if best is None:
        return {"state": "none"}

    sim = best["similarity"]
    distance = best["distance"]

    # Decision rule: High similarity (>= 0.82) + close (<= 500m) -> Linked
    if sim >= settings.DUPLICATE_LINKED_THRESHOLD and (distance is None or distance <= settings.DUPLICATE_LINKED_MAX_DISTANCE_M):
        return {
            "state": "linked",
            "matched_issue_id": str(best["issue"].id),
            "matched_issue_title": best["issue"].title,
            "semantic_similarity": round(sim, 3),
            "distance_meters": round(distance) if distance is not None else None,
            "reason": "Same category, highly similar description, and nearby active issue"
        }

    # Decision rule: Moderate similarity (>= 0.74) + moderate distance (<= 750m) -> Possible
    if sim >= settings.DUPLICATE_POSSIBLE_THRESHOLD and (distance is None or distance <= settings.DUPLICATE_POSSIBLE_MAX_DISTANCE_M):
        return {
            "state": "possible",
            "matched_issue_id": str(best["issue"].id),
            "matched_issue_title": best["issue"].title,
            "semantic_similarity": round(sim, 3),
            "distance_meters": round(distance) if distance is not None else None,
            "reason": "Probable duplicate candidate found nearby"
        }

    return {"state": "none"}
