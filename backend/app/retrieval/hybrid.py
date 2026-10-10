from app.core.config import DENSE_WEIGHT,SPARSE_WEIGHT, RRF_K
from app.diagnosis.retrieval import classify_retrieval_decision


def reciprocal_rank_fusion(
    dense_results,
    sparse_results,
    k=RRF_K,
    dense_weight=DENSE_WEIGHT,
    sparse_weight=SPARSE_WEIGHT,
):
    scores = {}
    chunks = {}
    metadata = {}

    # ---------------------------------------------------------
    # Dense Retrieval
    # ---------------------------------------------------------

    for rank, result in enumerate(dense_results, start=1):

        chunk_id = result["chunk"]["chunk_id"]

        contribution = dense_weight / (k + rank)

        scores[chunk_id] = (
            scores.get(chunk_id, 0)
            + contribution
        )

        chunks[chunk_id] = result["chunk"]

        metadata.setdefault(chunk_id, {})

        metadata[chunk_id]["dense_rank"] = rank
        metadata[chunk_id]["dense_score"] = result["score"]
        metadata[chunk_id]["dense_contribution"] = contribution

        # Preserve document metadata
        metadata[chunk_id]["source"] = result["chunk"].get("source")
        metadata[chunk_id]["page"] = result["chunk"].get("page")
        metadata[chunk_id]["section"] = result["chunk"].get("section")

    # ---------------------------------------------------------
    # Sparse / BM25 Retrieval
    # ---------------------------------------------------------

    for rank, result in enumerate(sparse_results, start=1):

        chunk_id = result["chunk"]["chunk_id"]

        contribution = sparse_weight / (k + rank)

        scores[chunk_id] = (
            scores.get(chunk_id, 0)
            + contribution
        )

        chunks[chunk_id] = result["chunk"]

        metadata.setdefault(chunk_id, {})

        metadata[chunk_id]["bm25_rank"] = rank
        metadata[chunk_id]["bm25_score"] = result["score"]
        metadata[chunk_id]["bm25_contribution"] = contribution

        # Preserve document metadata
        metadata[chunk_id]["source"] = result["chunk"].get("source")
        metadata[chunk_id]["page"] = result["chunk"].get("page")
        metadata[chunk_id]["section"] = result["chunk"].get("section")

    # ---------------------------------------------------------
    # Final Ranking
    # ---------------------------------------------------------

    ranked = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True,
    )

    results = []

    for final_rank, (chunk_id, score) in enumerate(
        ranked,
        start=1,
    ):

        meta = metadata[chunk_id]

        decision = classify_retrieval_decision(
            {
                **meta,
                "rrf_score": score,
            }
        )

        chunk = chunks[chunk_id]

        results.append(
            {
                "chunk": chunk,

                # Document metadata
                "chunk_id": chunk_id,
                "source": meta.get("source"),
                "page": meta.get("page"),
                "section": meta.get("section"),

                # Final ranking
                "final_rank": final_rank,
                "rrf_score": score,

                # Dense explanation
                "dense_rank": meta.get("dense_rank"),
                "dense_score": meta.get("dense_score"),
                "dense_contribution": meta.get(
                    "dense_contribution",
                    0,
                ),

                # BM25 explanation
                "bm25_rank": meta.get("bm25_rank"),
                "bm25_score": meta.get("bm25_score"),
                "bm25_contribution": meta.get(
                    "bm25_contribution",
                    0,
                ),

                # Retrieval diagnosis
                "retrieval_decision": decision,
            }
        )

    return results