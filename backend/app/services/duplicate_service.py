from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.services.embedding_service import EmbeddingService
from app.core.config import settings


class DuplicateService:
    """
    Duplicate Detection & Similarity Clustering Service.
    Implements nearest-neighbor comparison based on embedding vectors.
    """

    @classmethod
    def find_nearest_complaint(
        cls,
        db: Session,
        new_embedding: List[float],
        category: Optional[str] = None,
        exclude_id: Optional[int] = None
    ) -> Tuple[Optional[Complaint], float]:
        """
        Finds the highest similarity existing complaint in the database.
        Returns (best_match_complaint, max_similarity_score).
        """
        query = db.query(Complaint).filter(Complaint.embedding_json.isnot(None))
        if exclude_id:
            query = query.filter(Complaint.id != exclude_id)
        
        # Optionally prioritize same category if available
        existing_complaints = query.all()
        
        best_match: Optional[Complaint] = None
        highest_score = 0.0

        for complaint in existing_complaints:
            existing_vec = EmbeddingService.deserialize_embedding(complaint.embedding_json)
            if not existing_vec:
                continue
            
            similarity = EmbeddingService.cosine_similarity(new_embedding, existing_vec)
            
            # Boost score slightly if category and location match
            if similarity > highest_score:
                highest_score = similarity
                best_match = complaint

        return best_match, round(highest_score, 4)

    @classmethod
    def evaluate_duplicate(
        cls,
        db: Session,
        new_embedding: List[float],
        category: Optional[str] = None,
        threshold: Optional[float] = None
    ) -> Tuple[Optional[int], Optional[float]]:
        """
        Evaluates if the new complaint is a duplicate.
        Returns (parent_complaint_id, similarity_score) if score >= threshold, else (None, score).
        """
        if threshold is None:
            threshold = settings.DUPLICATE_SIMILARITY_THRESHOLD

        best_match, score = cls.find_nearest_complaint(db, new_embedding, category=category)
        
        if best_match and score >= threshold:
            # If the best match is itself a duplicate, point to the original root parent
            root_parent_id = best_match.duplicate_of if best_match.duplicate_of else best_match.id
            return root_parent_id, score
        elif best_match and score >= 0.60:
            # Related issue but below strict duplicate threshold
            return None, score
        
        return None, (score if best_match else None)
