import numpy as np
from typing import Dict, Any, List
from app.services.ai.category_templates import CATEGORY_TEMPLATES, DEPARTMENT_KEY_MAP
from app.services.ai.embedding_service import generate_embedding, encode_texts

_template_vectors = None

def _get_template_vectors():
    global _template_vectors
    if _template_vectors is None:
        _template_vectors = {}
        for category, texts in CATEGORY_TEMPLATES.items():
            vecs = encode_texts(texts)
            _template_vectors[category] = np.array(vecs)
    return _template_vectors

def classify_text(text: str, text_vector: List[float] = None) -> Dict[str, Any]:
    if not text or not text.strip():
        return {
            "category": "general_review",
            "department": "General Review Queue",
            "department_key": "general_review",
            "confidence": 0.0,
            "needs_human_review": True,
            "all_scores": {}
        }

    if text_vector is None:
        text_vector = generate_embedding(text)

    query_vec = np.array(text_vector)
    template_vectors = _get_template_vectors()

    scores = {}
    for cat, vec_matrix in template_vectors.items():
        sims = vec_matrix @ query_vec
        scores[cat] = float(np.max(sims))

    predicted_category = max(scores, key=scores.get)
    confidence = round(scores[predicted_category], 3)

    lower_text = text.lower()
    if any(w in lower_text for w in ["kachra", "garbage", "trash", "kooda", "dustbin", "waste"]):
        if confidence < 0.70:
            predicted_category = "sanitation"
            confidence = max(confidence, 0.75)
    elif any(w in lower_text for w in ["paani", "water", "pipe", "pipeline", "leak", "tap"]):
        if confidence < 0.70:
            predicted_category = "water"
            confidence = max(confidence, 0.75)
    elif any(w in lower_text for w in ["gaddha", "potholes", "pothole", "road", "footpath", "asphalt", "sadak"]):
        if confidence < 0.70:
            predicted_category = "roads"
            confidence = max(confidence, 0.75)
    elif any(w in lower_text for w in ["light", "streetlight", "wire", "andhera", "andheri", "electric", "pole"]):
        if confidence < 0.70:
            predicted_category = "streetlights"
            confidence = max(confidence, 0.75)
    elif any(w in lower_text for w in ["machhar", "mosquito", "dengue", "stagnant", "fumes", "illness"]):
        if confidence < 0.70:
            predicted_category = "health"
            confidence = max(confidence, 0.75)
    elif any(w in lower_text for w in ["traffic", "signal", "jam", "bus", "parking"]):
        if confidence < 0.70:
            predicted_category = "traffic"
            confidence = max(confidence, 0.75)

    department_names = {
        "sanitation": "Solid Waste & Sanitation",
        "water": "Water Supply",
        "roads": "Roads & Infrastructure",
        "streetlights": "Electrical / Street Lighting",
        "health": "Public Health & Vector Control",
        "traffic": "Traffic & Public Transport",
        "general_review": "General Review Queue"
    }

    if confidence >= 0.72:
        department_key = DEPARTMENT_KEY_MAP.get(predicted_category, "general_review")
        needs_human_review = False
    elif confidence >= 0.58:
        department_key = DEPARTMENT_KEY_MAP.get(predicted_category, "general_review")
        needs_human_review = True
    else:
        department_key = "general_review"
        needs_human_review = True

    return {
        "category": predicted_category,
        "department": department_names.get(department_key, "General Review Queue"),
        "department_key": department_key,
        "confidence": confidence,
        "needs_human_review": needs_human_review,
        "all_scores": {k: round(v, 3) for k, v in scores.items()}
    }

class CategoryClassifier:
    def __init__(self, embedder=None):
        self.embedder = embedder

    def classify(self, text: str, precomputed_vector: List[float] = None) -> Dict[str, Any]:
        return classify_text(text, precomputed_vector)
