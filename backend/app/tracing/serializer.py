from typing import Any


def serialize_trace(trace) -> dict[str, Any]:
    """
    Convert the internal RAGTrace object into a stable,
    frontend-friendly JSON structure.
    """

    return {
        "query": trace.query,
        "answer": trace.answer,
        "stages": [
            {
                "name": stage.name,
                "data": stage.data,
            }
            for stage in trace.stages
        ],
    }