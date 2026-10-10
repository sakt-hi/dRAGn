from rank_bm25 import BM25Okapi


class BM25Retriever:
    def __init__(self, chunks):
        self.chunks = chunks

        tokenized = [
            chunk["text"].split()
            for chunk in chunks
        ]

        self.bm25 = BM25Okapi(tokenized)

    def search(self, query, top_k=10):
        scores = self.bm25.get_scores(
            query.lower().split()
        )

        indices = scores.argsort()[-top_k:][::-1]

        results = []

        for rank, index in enumerate(indices, start=1):
            chunk = self.chunks[index]

            results.append({
                "rank": rank,
                "chunk": chunk,
                "chunk_id": chunk["chunk_id"],
                "source": chunk["source"],
                "page": chunk.get("page"),
                "section": chunk.get("section"),
                "score": float(scores[index]),
            })

        return results