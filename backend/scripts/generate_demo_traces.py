"""Generate real, deterministic-at-display RAG trace candidates for demo questions."""

import json
from pathlib import Path
import sys
from typing import Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal
from app.db.models import Document
from app.rag.pipeline import RAGPipeline


QUESTION_PACK = Path("data/demo_questions.json")
OUTPUT = Path("data/saved_demo_results/demo-corpus.json")


class SavedResultPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    answer: str
    citations: list[dict[str, Any]]
    trace: dict[str, Any]
    retrieved_chunks: list[dict[str, Any]]
    retrieval_diagnosis: dict[str, Any]
    grounding: dict[str, Any]


def main() -> None:
    packs: dict[str, list[dict[str, Any]]] = json.loads(
        QUESTION_PACK.read_text(encoding="utf-8")
    )
    current = {"schema_version": 1, "documents": {}}
    if OUTPUT.exists():
        current = json.loads(OUTPUT.read_text(encoding="utf-8"))

    handbook_seed = Path("data/saved_demo_results/employee-handbook.json")
    if handbook_seed.exists():
        current.setdefault("documents", {}).setdefault(
            "employee-handbook.pdf",
            json.loads(handbook_seed.read_text(encoding="utf-8"))["records"],
        )

    existing_by_document = {
        filename: {record["question_key"]: record for record in records}
        for filename, records in current.get("documents", {}).items()
    }

    with SessionLocal() as session:
        docs = {
            document.filename: str(document.id)
            for document in session.scalars(
                select(Document).where(
                    Document.filename.in_(list(packs)),
                    Document.status == "ready",
                    Document.source_type == "demo",
                )
            ).all()
        }
    missing_documents = sorted(set(packs) - set(docs))
    if missing_documents:
        raise RuntimeError(f"Demo documents are not ready in the database: {missing_documents}")

    pipeline = RAGPipeline()
    summary = []
    for filename, questions in packs.items():
        records = existing_by_document.setdefault(filename, {})
        for question in questions:
            if question["key"] in records:
                continue
            result = pipeline.ask(question["question"], document_id=docs[filename])
            payload = SavedResultPayload.model_validate(result)
            if not payload.answer.strip():
                raise ValueError(f"Empty answer for {filename}:{question['key']}.")
            if payload.trace.get("query") != question["question"] or not payload.trace.get("stages"):
                raise ValueError(f"Incomplete or mismatched trace for {filename}:{question['key']}.")
            if not payload.retrieved_chunks:
                raise ValueError(f"No evidence was retrieved for {filename}:{question['key']}.")
            records[question["key"]] = {
                "question_key": question["key"],
                "result": payload.model_dump(),
            }
            print(f"Generated {filename}:{question['key']}.", flush=True)

        ordered = [records[question["key"]] for question in questions]
        summary.append(
            {
                "filename": filename,
                "questions": len(ordered),
                "grounded": sum(bool(row["result"]["grounding"].get("grounded")) for row in ordered),
                "without_citations": sum(not row["result"]["citations"] for row in ordered),
                "diagnoses": {
                    health: sum(row["result"]["retrieval_diagnosis"].get("health") == health for row in ordered)
                    for health in ("good", "moderate", "poor")
                },
            }
        )
        current["documents"][filename] = ordered

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)
    print(f"Wrote trace candidates to {OUTPUT}.", flush=True)


if __name__ == "__main__":
    main()
