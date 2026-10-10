import json
from pathlib import Path

from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models import Document, Chunk


INDEX_DIR = Path("data/index/demo")


def seed_demo_chunks():
    with SessionLocal() as session:
        documents = session.scalars(
            select(Document).where(
                Document.source_type == "demo",
                Document.status == "ready",
            )
        ).all()

        if not documents:
            raise RuntimeError("No demo documents found in the database.")

        total_inserted = 0

        for document in documents:
            document_index_dir = INDEX_DIR / str(document.id)
            chunks_path = document_index_dir / "chunks.json"

            if not chunks_path.exists():
                print(
                    f"Skipping {document.filename}: "
                    f"{chunks_path} not found"
                )
                continue

            # Prevent duplicate seeding
            existing_count = session.scalar(
                select(Chunk.id)
                .where(Chunk.document_id == document.id)
                .limit(1)
            )

            if existing_count is not None:
                print(
                    f"Skipping {document.filename}: "
                    "chunks already exist"
                )
                continue

            with open(chunks_path, "r", encoding="utf-8") as f:
                chunks = json.load(f)

            for chunk_data in chunks:
                chunk = Chunk(
                    document_id=document.id,
                    chunk_index=chunk_data["chunk_id"],
                    text=chunk_data["text"],
                    section=chunk_data.get("section"),
                )

                session.add(chunk)

            total_inserted += len(chunks)

            print(
                f"Inserted {len(chunks)} chunks → "
                f"{document.title}"
            )

        session.commit()

        print()
        print(f"TOTAL CHUNKS INSERTED: {total_inserted}")


if __name__ == "__main__":
    seed_demo_chunks()