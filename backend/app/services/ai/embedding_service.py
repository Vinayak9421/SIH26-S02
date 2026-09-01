import logging
import numpy as np
from typing import List

logger = logging.getLogger(__name__)

# Suppress noisy HTTP cache requests from HuggingFace, sentence_transformers, and httpx
for noisy_logger in ["httpx", "sentence_transformers", "huggingface_hub", "urllib3", "httpcore"]:
    logging.getLogger(noisy_logger).setLevel(logging.WARNING)

_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Loaded sentence-transformers model: all-MiniLM-L6-v2")
        except Exception as e:
            logger.warning(f"Could not load sentence-transformers: {e}. Using hash-based pseudo vector encoder fallback.")
            _model = "fallback"
    return _model

def generate_embedding(text: str) -> List[float]:
    if not text or not text.strip():
        return [0.0] * 384

    model = _get_model()
    if model != "fallback":
        try:
            vec = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
            return vec.tolist()
        except Exception as e:
            logger.error(f"Error encoding text: {e}")

    import hashlib
    seed_hash = hashlib.sha256(text.lower().encode('utf-8')).digest()
    rng = np.random.RandomState(int.from_bytes(seed_hash[:4], byteorder='little'))
    vec = rng.randn(384)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

def encode_texts(texts: List[str]) -> List[List[float]]:
    model = _get_model()
    if model != "fallback":
        try:
            vecs = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            return vecs.tolist()
        except Exception as e:
            logger.error(f"Error encoding multiple texts: {e}")

    return [generate_embedding(t) for t in texts]

class EmbeddingService:
    def encode_one(self, text: str) -> List[float]:
        return generate_embedding(text)

    def encode_many(self, texts: List[str]) -> List[List[float]]:
        return encode_texts(texts)
