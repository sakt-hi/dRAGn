import json

import faiss
import numpy as np


class VectorStore:
    def __init__(self, dimension: int):
        self.index = faiss.IndexFlatIP(dimension)
        self.chunks = []

    def add(self, embeddings, chunks):
        embeddings = np.array(
            embeddings,
            dtype="float32",
        )

        self.index.add(embeddings)
        self.chunks.extend(chunks)

    def search(self, query_embedding, top_k=10):
        query_embedding = np.array(
            [query_embedding],
            dtype="float32",
        )

        scores, indices = self.index.search(
            query_embedding,
            top_k,
        )

        results = []

        for rank, (score, index) in enumerate(
            zip(scores[0], indices[0]),
            start=1,
        ):
            if index == -1:
                continue

            chunk = self.chunks[index]

            results.append(
                {
                    "rank": rank,
                    "chunk": chunk,
                    "chunk_id": chunk["chunk_id"],
                    "source": chunk["source"],
                    "page": chunk.get("page"),
                    "section": chunk.get("section"),
                    "score": float(score),
                }
            )

        return results

    @classmethod
    def load(
        cls,
        index_path: str,
        chunks_path: str,
    ):
        """
        Load a document-specific FAISS index
        and its corresponding chunks.
        """

        index = faiss.read_index(index_path)

        with open(
            chunks_path,
            "r",
            encoding="utf-8",
        ) as f:
            chunks = json.load(f)

        store = cls(index.d)

        store.index = index
        store.chunks = chunks

        return store