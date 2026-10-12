"""Run ten real RAG queries and save validated candidates for Supabase import."""

import json
from pathlib import Path
import sys
from typing import Any

from pydantic import BaseModel, ConfigDict

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.rag.pipeline import RAGPipeline


DOCUMENT_ID = "bc4ef00a-9ce2-4fa0-93a7-ef5bbbffa1e3"
QUESTION_PACK = Path("data/demo_questions.json")
OUTPUT = Path("data/saved_demo_results/employee-handbook.json")


class SavedResultPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    answer: str
    citations: list[dict[str, Any]]
    trace: dict[str, Any]
    retrieved_chunks: list[dict[str, Any]]
    retrieval_diagnosis: dict[str, Any]
    grounding: dict[str, Any]


def main() -> None:
    questions = json.loads(QUESTION_PACK.read_text(encoding="utf-8"))["employee-handbook.pdf"]
    pipeline = RAGPipeline()
    records = []

    for question in questions:
        result = pipeline.ask(question["question"], document_id=DOCUMENT_ID)
        payload = SavedResultPayload.model_validate(result)
        if not payload.answer.strip() or not payload.retrieved_chunks:
            raise ValueError(f"No answer or evidence was returned for {question['key']}.")
        if not payload.trace.get("stages") or payload.trace.get("query") != question["question"]:
            raise ValueError(f"The pipeline trace is incomplete or mismatched for {question['key']}.")
        records.append({"question_key": question["key"], "result": payload.model_dump()})
        print(f"Validated candidate {question['key']}.")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"schema_version": 1, "records": records}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} validated saved traces to {OUTPUT}.")


if __name__ == "__main__":
    main()
