from typing import Dict, Any, Tuple
import numpy as np
from app.services.ai.embedding_service import EmbeddingService
from app.services.ai.category_templates import CATEGORY_TEMPLATES, CATEGORY_DEPARTMENT_MAPPING
from app.config import settings


class CategoryClassifier:
    """
    Template-based zero-shot semantic classifier using multilingual sentence embeddings.
    """

    def __init__(self, embedder: EmbeddingService):
        self.embedder = embedder
        self.templates = CATEGORY_TEMPLATES
        self.template_vectors = {
            category: np.array(embedder.encode_many(texts), dtype=np.float32)
            for category, texts in self.templates.items()
        }

    def classify(self, text: str, precomputed_vector: list[float] = None) -> Dict[str, Any]:
        """
        Classifies complaint text against category template embeddings.
        Returns predicted category, department, confidence, and human review flag.
        """
        if precomputed_vector is not None:
            vector = np.array(precomputed_vector, dtype=np.float32)
        else:
            vector = np.array(self.embedder.encode_one(text), dtype=np.float32)

        # Dot product against all template vectors in each category
        scores = {}
        for category, vectors in self.template_vectors.items():
            if len(vectors) > 0:
                sims = vectors @ vector
                scores[category] = float(np.max(sims))
            else:
                scores[category] = 0.0

        best_category = max(scores, key=scores.get)
        confidence = float(scores[best_category])

        # Apply confidence policy
        if confidence >= settings.CONFIDENCE_AUTO_ROUTE:
            final_category = best_category
            needs_human_review = False
        elif confidence >= settings.CONFIDENCE_SUGGESTED_ROUTE:
            final_category = best_category
            needs_human_review = True
        else:
            final_category = "general_review"
            needs_human_review = True

        department = CATEGORY_DEPARTMENT_MAPPING.get(final_category, "General Review Queue")

        return {
            "category": final_category,
            "department": department,
            "confidence": round(confidence, 3),
            "needs_human_review": needs_human_review,
            "all_scores": {k: round(v, 3) for k, v in scores.items()}
        }
