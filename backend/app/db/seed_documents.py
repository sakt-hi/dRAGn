import json
from pathlib import Path

from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models import Document


DOCUMENTS_DIR = Path("data/documents")
INDEX_DIR = Path("data/index")


DEMO_METADATA = {
    "employee-handbook": {
        "title": "Employee Handbook",
        "description": (
            "Company policies covering leave, remote work, "
            "security, conduct, and workplace guidelines."
        ),
        "document_type": "pdf",
    },
    "health-insurance-policy": {
        "title": "Health Insurance Policy",
        "description": (
            "Health insurance benefits, coverage limits, "
            "deductibles, co-payments, and exclusions."
        ),
        "document_type": "pdf",
    },
    "software-documentation": {
        "title": "Software Documentation",
        "description": (
            "Technical documentation covering APIs, "
            "authentication, configuration, and system usage."
        ),
        "document_type": "pdf",
    },
    "fitness-program-guide": {
        "title": "Fitness Program Guide",
        "description": (
            "A structured fitness guide covering workouts, "
            "progression, recovery, and training guidelines."
        ),
        "document_type": "pdf",
    },
    "cgrc-exam-notification-2026": {
        "title": "CGRC Digital Administration Assistant Examination 2026",
        "description": (
            "A fictional examination notification containing "
            "eligibility, age limits, reservations, fees, "
            "exam pattern, and important dates."
        ),
        "document_type": "pdf",
    },
    "azure": {
        "title": "Azure Documentation",
        "description": (
            "Azure technical documentation covering cloud "
            "services, concepts, configuration, and development."
        ),
        "document_type": "markdown",
    },
}


def get_page_count(chunks: list[dict]) -> int | None:
    pages = {
        chunk.get("page")
        for chunk in chunks
        if chunk.get("page") is not None
    }

    return len(pages) if pages else None


def seed_documents():
    with SessionLocal() as session:

        for document_id, metadata in DEMO_METADATA.items():

            index_dir = INDEX_DIR / document_id
            chunks_path = index_dir / "chunks.json"

            if not chunks_path.exists():
                print(
                    f"Skipping {document_id}: "
                    f"{chunks_path} not found"
                )
                continue

            with open(
                chunks_path,
                "r",
                encoding="utf-8",
            ) as f:
                chunks = json.load(f)

            source_files = list(
                DOCUMENTS_DIR.glob(
                    f"{document_id}.*"
                )
            )

            if not source_files:
                print(
                    f"Skipping {document_id}: "
                    "source document not found"
                )
                continue

            source_file = source_files[0]

            existing = session.scalar(
                select(Document).where(
                    Document.filename == source_file.name
                )
            )

            if existing:
                print(
                    f"Already exists: "
                    f"{source_file.name}"
                )
                continue

            document = Document(
                filename=source_file.name,
                title=metadata["title"],
                description=metadata["description"],
                document_type=metadata["document_type"],
                source_type="demo",
                source=str(source_file),
                size_bytes=source_file.stat().st_size,
                page_count=get_page_count(chunks),
                chunk_count=len(chunks),
                status="ready",
            )

            session.add(document)

            print(
                f"Adding: {metadata['title']} "
                f"({len(chunks)} chunks)"
            )

        session.commit()

    print("\nDemo document seeding complete.")


if __name__ == "__main__":
    seed_documents()