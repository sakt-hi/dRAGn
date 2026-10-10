import json
import time
from pathlib import Path

import faiss

from app.ingestion.loader import load_document
from app.ingestion.chunker import chunk_document
from app.retrieval.embeddings import EmbeddingService
from app.retrieval.vector_store import VectorStore


INDEX_DIR = Path("data/index")


class IngestionService:

    def __init__(self):
        self.embedding_service = EmbeddingService()

    def ingest(self, document_path: str):

        trace = []

        # -------------------------
        # 1. Extract
        # -------------------------
        start = time.perf_counter()

        text = load_document(document_path)

        latency = (time.perf_counter() - start) * 1000

        trace.append({
            "stage": "Extract",
            "status": "completed",
            "latency_ms": latency,
            "data": {
                "characters": len(text),
            },
        })

        # -------------------------
        # 2. Chunk
        # -------------------------
        start = time.perf_counter()

        chunks = chunk_document(
            text,
            Path(document_path).name,
        )

        latency = (time.perf_counter() - start) * 1000

        trace.append({
            "stage": "Chunk",
            "status": "completed",
            "latency_ms": latency,
            "data": {
                "chunks_created": len(chunks),
            },
        })

        # -------------------------
        # 3. Embeddings
        # -------------------------
        start = time.perf_counter()

        texts = [
            chunk["text"]
            for chunk in chunks
        ]

        embeddings = self.embedding_service.embed_documents(
            texts
        )

        latency = (time.perf_counter() - start) * 1000

        trace.append({
            "stage": "Embedding",
            "status": "completed",
            "latency_ms": latency,
            "data": {
                "embedding_model": "BAAI/bge-small-en-v1.5",
                "vectors_created": len(embeddings),
                "dimensions": embeddings.shape[1],
            },
        })

        # -------------------------
        # 4. Build FAISS index
        # -------------------------
        start = time.perf_counter()

        vector_store = VectorStore(
            embeddings.shape[1]
        )

        vector_store.add(
            embeddings,
            chunks,
        )

        INDEX_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        faiss.write_index(
            vector_store.index,
            str(INDEX_DIR / "faiss.index"),
        )

        with open(
            INDEX_DIR / "chunks.json",
            "w",
            encoding="utf-8",
        ) as f:
            json.dump(
                chunks,
                f,
                ensure_ascii=False,
                indent=2,
            )

        latency = (time.perf_counter() - start) * 1000

        trace.append({
            "stage": "Index",
            "status": "completed",
            "latency_ms": latency,
            "data": {
                "index": "FAISS",
                "chunks_indexed": len(chunks),
            },
        })

        return {
            "document": Path(document_path).name,
            "chunks": len(chunks),
            "trace": trace,
        }