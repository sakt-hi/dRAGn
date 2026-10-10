from sentence_transformers import SentenceTransformer

from app.core.config import EMBEDDING_MODEL

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(EMBEDDING_MODEL)

    def embed_documents(self, texts):
        return self.model.encode(texts, normalize_embeddings=True)

    def embed_query(self, query):
        return self.model.encode([query], normalize_embeddings=True)[0]