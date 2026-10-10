def classify_retrieval_decision(result: dict) -> str:
    """
    Classify how dense and sparse retrieval contributed
    to the final RRF ranking.
    """

    dense_rank = result.get("dense_rank")
    bm25_rank = result.get("bm25_rank")

    # Chunk was only found by dense retrieval
    if dense_rank is not None and bm25_rank is None:
        return "semantic_winner"

    # Chunk was only found by BM25
    if dense_rank is None and bm25_rank is not None:
        return "keyword_winner"

    # Safety fallback
    if dense_rank is None or bm25_rank is None:
        return "unknown"

    # Both retrievers strongly agree
    if dense_rank <= 3 and bm25_rank <= 3:
        return "strong_agreement"

    # Dense retrieval strongly prefers this chunk
    if dense_rank <= 3 and bm25_rank >= 7:
        return "semantic_winner"

    # BM25 strongly prefers this chunk
    if bm25_rank <= 3 and dense_rank >= 7:
        return "keyword_winner"

    # Both retrieved it, but neither strongly dominates
    return "balanced"