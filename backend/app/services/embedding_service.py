import json
import math
import re
from typing import List, Optional
import numpy as np

class EmbeddingService:
    """
    Service for generating embeddings and computing vector similarity.
    """

    @classmethod
    def normalize_text(cls, text: str) -> str:
        """Clean and normalize complaint text"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """
        Generates a normalized embedding vector for the complaint text.
        Uses a robust token-frequency vector representation for offline resilience,
        readily upgradeable to OpenAI/HuggingFace embeddings.
        """
        normalized = cls.normalize_text(text)
        words = normalized.split()
        
        # Fixed 64-dimensional semantic hash vector projection
        vec = np.zeros(64, dtype=np.float32)
        if not words:
            return vec.tolist()

        for idx, word in enumerate(words):
            # Compute hash buckets for token semantic fingerprinting
            h = hash(word)
            bucket1 = abs(h) % 64
            bucket2 = abs(h >> 4) % 64
            vec[bucket1] += 1.0
            vec[bucket2] += 0.5

        # Normalize vector to unit length
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        return vec.tolist()

    @classmethod
    def serialize_embedding(cls, embedding: List[float]) -> str:
        """Serializes embedding list to JSON string for database storage"""
        return json.dumps(embedding)

    @classmethod
    def deserialize_embedding(cls, embedding_str: Optional[str]) -> Optional[List[float]]:
        """Deserializes JSON string back to list of floats"""
        if not embedding_str:
            return None
        try:
            return json.loads(embedding_str)
        except Exception:
            return None

    @classmethod
    def cosine_similarity(cls, vec_a: List[float], vec_b: List[float]) -> float:
        """Computes cosine similarity between two vector embeddings (0.0 to 1.0)"""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        similarity = float(np.dot(a, b) / (norm_a * norm_b))
        return max(0.0, min(1.0, similarity))
