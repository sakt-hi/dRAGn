import re


def verify_answer_grounding(
    answer: str,
    citations: list[dict],
) -> dict:
    """
    Verify that all citation references in the answer
    were successfully resolved to retrieved evidence.
    """

    citation_ids = [
        int(match)
        for match in re.findall(
            r"\[(\d+)\]",
            answer,
        )
    ]

    # Remove duplicates while preserving order.
    citation_ids = list(dict.fromkeys(citation_ids))

    if not citation_ids:
        return {
            "grounded": False,
            "status": "no_citations",
            "citation_count": 0,
            "valid_citations": [],
            "invalid_citations": [],
            "coverage": 0.0,
            "diagnosis": (
                "The answer contains no verifiable citations."
            ),
        }

    citation_map = {
        citation["id"]: citation
        for citation in citations
    }

    valid_citations = []
    invalid_citations = []

    for citation_id in citation_ids:
        citation = citation_map.get(citation_id)

        if citation and citation.get("valid"):
            valid_citations.append(citation)
        else:
            invalid_citations.append(
                {
                    "id": citation_id,
                }
            )

    coverage = (
        len(valid_citations) / len(citation_ids)
        if citation_ids
        else 0.0
    )

    if coverage == 1.0:
        grounded = True
        status = "grounded"
        diagnosis = (
            "All citations in the answer resolve to retrieved evidence."
        )

    elif coverage >= 0.5:
        grounded = False
        status = "partially_grounded"
        diagnosis = (
            "Some citations resolve to retrieved evidence, "
            "but at least one citation could not be resolved."
        )

    else:
        grounded = False
        status = "poorly_grounded"
        diagnosis = (
            "Most citations in the answer could not be "
            "resolved to retrieved evidence."
        )

    return {
        "grounded": grounded,
        "status": status,
        "citation_count": len(citation_ids),
        "valid_citations": [
            {
                "id": citation["id"],
                "source": citation["source"],
                "section": citation["section"],
                "chunk_id": citation["chunk_id"],
            }
            for citation in valid_citations
        ],
        "invalid_citations": invalid_citations,
        "coverage": round(coverage, 3),
        "diagnosis": diagnosis,
    }