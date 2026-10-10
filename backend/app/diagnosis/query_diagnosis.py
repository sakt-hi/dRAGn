def diagnose_retrieval(results: list[dict]) -> dict:
    """
    Analyze the final RRF results and produce a query-level
    retrieval diagnosis.

    This is deterministic and does not use an LLM.
    """

    if not results:
        return {
            "health": "poor",
            "confidence": "low",
            "agreement_score": 0.0,
            "dominant_signal": "none",
            "primary_chunk": None,
            "diagnosis": "No relevant chunks were retrieved.",
        }

    # ---------------------------------------------------------
    # Primary result
    # ---------------------------------------------------------

    primary = results[0]

    dense_rank = primary.get("dense_rank")
    bm25_rank = primary.get("bm25_rank")

    # ---------------------------------------------------------
    # Primary evidence agreement
    # ---------------------------------------------------------

    if dense_rank is not None and bm25_rank is not None:

        rank_difference = abs(
            dense_rank - bm25_rank
        )

        if rank_difference <= 2:
            primary_agreement = 1.0
        elif rank_difference <= 5:
            primary_agreement = 0.5
        else:
            primary_agreement = 0.0

    else:
        primary_agreement = 0.0

    # ---------------------------------------------------------
    # Overall retrieval agreement
    # ---------------------------------------------------------

    agreement_count = 0
    comparable_count = 0

    for result in results:

        dense = result.get("dense_rank")
        bm25 = result.get("bm25_rank")

        if dense is None or bm25 is None:
            continue

        comparable_count += 1

        rank_difference = abs(
            dense - bm25
        )

        if rank_difference <= 2:
            agreement_count += 1

    if comparable_count:
        overall_agreement = (
            agreement_count / comparable_count
        )
    else:
        overall_agreement = 0.0

    # ---------------------------------------------------------
    # Final agreement score
    #
    # Give the primary evidence more importance because
    # it is the chunk most likely to influence generation.
    # ---------------------------------------------------------

    if comparable_count:
        agreement_score = (
            primary_agreement * 0.7
            + overall_agreement * 0.3
        )
    else:
        agreement_score = primary_agreement

    # ---------------------------------------------------------
    # Determine dominant signal
    # ---------------------------------------------------------

    if dense_rank is None and bm25_rank is not None:
        dominant_signal = "bm25"

    elif bm25_rank is None and dense_rank is not None:
        dominant_signal = "dense"

    elif dense_rank is None and bm25_rank is None:
        dominant_signal = "none"

    elif dense_rank <= 3 and bm25_rank <= 3:
        dominant_signal = "both"

    elif dense_rank < bm25_rank:
        dominant_signal = "dense"

    elif bm25_rank < dense_rank:
        dominant_signal = "bm25"

    else:
        dominant_signal = "both"

    # ---------------------------------------------------------
    # Health + confidence
    # ---------------------------------------------------------

    if (
        dense_rank is not None
        and bm25_rank is not None
        and dense_rank <= 3
        and bm25_rank <= 3
        and primary_agreement >= 0.5
    ):
        health = "good"
        confidence = "high"

        diagnosis = (
            "Dense and BM25 retrieval strongly agree on "
            "the primary evidence."
        )

    elif primary_agreement >= 0.5:
        health = "good"
        confidence = "high"

        diagnosis = (
            "The primary evidence is strongly supported "
            "by both dense and keyword retrieval."
        )

    elif dominant_signal == "dense":
        health = "moderate"
        confidence = "medium"

        diagnosis = (
            "Semantic retrieval is contributing more strongly "
            "than keyword retrieval."
        )

    elif dominant_signal == "bm25":
        health = "moderate"
        confidence = "medium"

        diagnosis = (
            "Keyword retrieval is contributing more strongly "
            "than semantic retrieval."
        )

    else:
        health = "moderate"
        confidence = "low"

        diagnosis = (
            "The primary evidence shows limited agreement "
            "between retrieval signals."
        )

    return {
        "health": health,
        "confidence": confidence,
        "agreement_score": round(
            agreement_score,
            3,
        ),
        "dominant_signal": dominant_signal,
        "primary_chunk": primary["chunk"]["chunk_id"],
        "diagnosis": diagnosis,
    }