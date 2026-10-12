"""Import generated demo traces after applying migration 001."""

import json
from pathlib import Path
import sys
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal
from app.db.models import DemoQuestion, Document, SavedDemoResult


class SavedResultPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    answer: str
    citations: list[dict[str, Any]]
    trace: dict[str, Any]
    retrieved_chunks: list[dict[str, Any]]
    retrieval_diagnosis: dict[str, Any]
    grounding: dict[str, Any]


def main() -> None:
    question_packs = json.loads(Path("data/demo_questions.json").read_text(encoding="utf-8"))
    candidate_data = json.loads(Path("data/saved_demo_results/demo-corpus.json").read_text(encoding="utf-8"))
    if candidate_data.get("schema_version") != 1:
        raise ValueError("Unsupported saved-result schema version.")
    candidate_packs = candidate_data.get("documents", {})
    if set(candidate_packs) != set(question_packs):
        raise ValueError("Candidate document set does not exactly match the demo question packs.")

    with SessionLocal() as session:
        published = []
        for filename, question_data in question_packs.items():
            document = session.scalar(select(Document).where(Document.filename == filename))
            if document is None or document.status != "ready" or document.source_type != "demo":
                raise RuntimeError(f"The demo document {filename} is not ready in Supabase.")

            records = candidate_packs[filename]
            candidates = {record["question_key"]: record["result"] for record in records}
            if len(candidates) != len(records):
                raise ValueError(f"Duplicate question keys were found for {filename}.")
            if len(question_data) < 10 or len({item["id"] for item in question_data}) != len(question_data):
                raise ValueError(f"{filename} must have at least ten questions with distinct stable IDs.")
            if set(candidates) != {item["key"] for item in question_data}:
                raise ValueError(f"Candidate trace keys do not match the question pack for {filename}.")

            questions: list[tuple[DemoQuestion, SavedResultPayload]] = []
            for item in question_data:
                payload = SavedResultPayload.model_validate(candidates[item["key"]])
                if payload.trace.get("query") != item["question"] or not payload.answer.strip() or not payload.retrieved_chunks or not payload.trace.get("stages"):
                    raise ValueError(f"Saved result failed validation for {filename}:{item['key']}.")
                question = session.scalar(
                    select(DemoQuestion).where(
                        DemoQuestion.document_id == document.id,
                        DemoQuestion.question_key == item["key"],
                    )
                )
                if question is None:
                    question = DemoQuestion(
                        id=uuid.UUID(item["id"]),
                        document_id=document.id,
                        question_key=item["key"],
                        question=item["question"],
                        category=item["category"],
                        sort_order=item["sort_order"],
                        is_published=False,
                    )
                    session.add(question)
                elif question.id != uuid.UUID(item["id"]) or question.question != item["question"]:
                    raise ValueError(f"Database question changed for {filename}:{item['key']}; regenerate its trace first.")
                questions.append((question, payload))

            session.flush()
            for question, payload in questions:
                saved = session.scalar(
                    select(SavedDemoResult).where(SavedDemoResult.sample_question_id == question.id)
                )
                values = {
                    "document_id": document.id,
                    "answer": payload.answer,
                    "citations": payload.citations,
                    "evidence": payload.retrieved_chunks,
                    "grounding_result": payload.grounding,
                    "retrieval_diagnosis": payload.retrieval_diagnosis,
                    "pipeline_trace": payload.trace,
                    "schema_version": 1,
                }
                if saved is None:
                    saved = SavedDemoResult(id=uuid.uuid4(), sample_question_id=question.id, **values)
                    session.add(saved)
                else:
                    for key, value in values.items():
                        setattr(saved, key, value)
                question.is_published = True
            published.append((document.title, len(questions)))

        session.commit()
        for title, count in published:
            print(f"Published {count} saved traces for {title}.")


if __name__ == "__main__":
    main()
