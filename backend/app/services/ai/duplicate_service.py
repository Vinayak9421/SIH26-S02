import numpy as np
from math import radians, sin, cos, sqrt, atan2
from typing import List, Dict, Any, Optional

EARTH_RADIUS_M = 6_371_000

class IssueCandidate:
    def __init__(self, id: str, category: str, title: str, embedding: List[float], latitude: Optional[float] = None, longitude: Optional[float] = None, complaint_count: int = 0, status: str = "open"):
        self.id = id
        self.category = category
        self.title = title
        self.embedding = embedding
        self.latitude = latitude
        self.longitude = longitude
        self.complaint_count = complaint_count
        self.status = status

def haversine_m(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> Optional[float]:
    if None in (lat1, lon1, lat2, lon2):
        return None
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return EARTH_RADIUS_M * 2 * atan2(sqrt(a), sqrt(1 - a))

def match_duplicate_issue(
    complaint_embedding: List[float],
    category: str,
    latitude: Optional[float],
    longitude: Optional[float],
    active_issues: List[Any]
) -> Dict[str, Any]:
    if not complaint_embedding or not active_issues:
        return {"duplicate_state": "none", "state": "none", "matched_issue_id": None, "matched_issue_title": None, "semantic_similarity": None, "distance_meters": None, "reason": None}

    query = np.array(complaint_embedding)
    best_candidate = None

    for issue in active_issues:
        iss_id = getattr(issue, "id", None) if not isinstance(issue, dict) else issue.get("id")
        iss_category = getattr(issue, "category", None) if not isinstance(issue, dict) else issue.get("category")
        iss_title = getattr(issue, "title", "Untitled Issue") if not isinstance(issue, dict) else issue.get("title", "Untitled Issue")
        iss_embedding = getattr(issue, "embedding", None) if not isinstance(issue, dict) else issue.get("embedding")
        iss_lat = getattr(issue, "latitude", None) if not isinstance(issue, dict) else issue.get("latitude")
        iss_lng = getattr(issue, "longitude", None) if not isinstance(issue, dict) else issue.get("longitude")

        if iss_category and iss_category != category:
            continue

        if not iss_embedding:
            continue

        similarity = float(np.dot(query, np.array(iss_embedding)))
        distance = haversine_m(latitude, longitude, iss_lat, iss_lng)

        if distance is not None and distance > 1000:
            continue

        candidate = {
            "issue_id": str(iss_id),
            "issue_title": iss_title,
            "similarity": similarity,
            "distance": distance
        }

        if best_candidate is None or candidate["similarity"] > best_candidate["similarity"]:
            best_candidate = candidate

    if best_candidate is None:
        return {"duplicate_state": "none", "state": "none", "matched_issue_id": None, "matched_issue_title": None, "semantic_similarity": None, "distance_meters": None, "reason": None}

    sim = best_candidate["similarity"]
    distance = best_candidate["distance"]

    if sim >= 0.82 and (distance is None or distance <= 500):
        return {
            "duplicate_state": "linked",
            "state": "linked",
            "matched_issue_id": best_candidate["issue_id"],
            "matched_issue_title": best_candidate["issue_title"],
            "semantic_similarity": round(sim, 3),
            "distance_meters": round(distance) if distance is not None else None,
            "reason": "Same category, high similarity, and nearby active issue"
        }

    if sim >= 0.74 and (distance is None or distance <= 750):
        return {
            "duplicate_state": "possible",
            "state": "possible",
            "matched_issue_id": best_candidate["issue_id"],
            "matched_issue_title": best_candidate["issue_title"],
            "semantic_similarity": round(sim, 3),
            "distance_meters": round(distance) if distance is not None else None,
            "reason": "Possible duplicate candidate"
        }

    return {"duplicate_state": "none", "state": "none", "matched_issue_id": None, "matched_issue_title": None, "semantic_similarity": round(sim, 3) if sim else None, "distance_meters": round(distance) if distance else None, "reason": None}

def match_issue(complaint_embedding, category, latitude, longitude, active_issues):
    return match_duplicate_issue(complaint_embedding, category, latitude, longitude, active_issues)
