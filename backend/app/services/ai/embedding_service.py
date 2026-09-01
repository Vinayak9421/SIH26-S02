import logging
from typing import List
import numpy as np

logger = logging.getLogger("uvicorn.error")

_model_instance = None


class EmbeddingService:
    """
    Multilingual Dense Embedding Service using sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2.
    Produces 384-dimensional normalized vectors.
    """

    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        global _model_instance
        self.model_name = model_name
        self.dim = 384

        if _model_instance is not None:
            self.model = _model_instance
        else:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading multilingual embedding model: {self.model_name}...")
                self.model = SentenceTransformer(self.model_name)
                _model_instance = self.model
                logger.info("Multilingual embedding model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformer ({e}). Using deterministic token-hash vector fallback.")
                self.model = None

    def encode_one(self, text: str) -> List[float]:
        """Encode single text into a normalized 384-dimensional vector"""
        if not text or not text.strip():
            return [0.0] * self.dim

        if self.model is not None:
            vector = self.model.encode(text, normalize_embeddings=True)
            return vector.tolist()

        # Fallback 384-dim normalized hash projection
        return self._fallback_encode(text)

    def encode_many(self, texts: List[str]) -> List[List[float]]:
        """Encode list of texts into normalized 384-dimensional vectors"""
        if not texts:
            return []

        if self.model is not None:
            vectors = self.model.encode(texts, normalize_embeddings=True)
            return vectors.tolist()

        return [self._fallback_encode(t) for t in texts]

    def _fallback_encode(self, text: str) -> List[float]:
        words = text.lower().split()
        vec = np.zeros(self.dim, dtype=np.float32)
        if not words:
            return vec.tolist()

        for word in words:
            h = hash(word)
            for shift in range(0, 32, 8):
                bucket = (abs(h >> shift) ^ (len(word) * 31)) % self.dim
                vec[bucket] += 1.0

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()
