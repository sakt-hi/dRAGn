import json
from pathlib import Path

import faiss
from sqlalchemy import select

from app.core.config import EMBEDDING_MODEL
from app.db.database import SessionLocal
from app.db.models import Document, Chunk
from app.ingestion.chunker import chunk_document
from app.ingestion.loader import load_document
from app.retrieval.embeddings import EmbeddingService


DOCUMENTS_DIR = Path("data/documents")
INDEX_DIR = Path("data/index")


def get_demo_documents() -> list[Path]:
    demo_dir = DOCUMENTS_DIR / "demo"

    if not demo_dir.exists():
        raise FileNotFoundError(
            f"Demo documents directory not found: {demo_dir}"
        )

    supported_extensions = {
        ".pdf",
        ".md",
        ".txt",
    }

    return sorted(
        path
        for path in demo_dir.iterdir()
        if path.is_file()
        and path.suffix.lower() in supported_extensions
    )


def get_document_record(filename: str) -> Document:
    with SessionLocal() as session:
        document = session.scalar(
            select(Document).where(
                Document.filename == filename,
                Document.source_type == "demo",
            )
        )

        if document is None:
            raise ValueError(
                f"No demo document record found in Supabase "
                f"for: {filename}"
            )

        return document


def save_chunks_to_database(
    document_id: str,
    chunks: list[dict],
):
    with SessionLocal() as session:

        document = session.get(
            Document,
            document_id,
        )

        if document is None:
            raise ValueError(
                f"Document not found: {document_id}"
            )

        # Remove existing chunks so re-indexing
        # always produces a clean database state.
        session.query(Chunk).filter(
            Chunk.document_id == document.id
        ).delete(
            synchronize_session=False
        )

        for chunk in chunks:
            db_chunk = Chunk(
                document_id=document.id,
                chunk_index=chunk["chunk_id"],
                text=chunk["text"],
                section=chunk.get("section"),
            )

            session.add(db_chunk)

        document.chunk_count = len(chunks)

        session.commit()

        print(
            f"Supabase chunks saved: {len(chunks)}"
        )


def build_index(
    file_path: str,
    document_id: str,
):
    file_path = Path(file_path)

    print(f"\n{'=' * 60}")
    print(f"Indexing: {file_path.name}")
    print(f"Document UUID: {document_id}")
    print(f"{'=' * 60}")

    pages = load_document(str(file_path))

    print(f"Loaded sections/pages: {len(pages)}")

    chunks = chunk_document(
        pages,
        source=str(file_path),
    )

    print(f"Created chunks: {len(chunks)}")

    if not chunks:
        raise ValueError(
            f"No chunks were created for {file_path}"
        )

    # ---------------------------------------------------------
    # Persist chunks in Supabase
    # ---------------------------------------------------------

    save_chunks_to_database(
        document_id=document_id,
        chunks=chunks,
    )

    # ---------------------------------------------------------
    # Generate embeddings
    # ---------------------------------------------------------

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    print(
        f"Loading embedding model: "
        f"{EMBEDDING_MODEL}"
    )

    embedding_service = EmbeddingService()

    embeddings = embedding_service.embed_documents(
        texts
    )

    print(
        f"Generated embeddings: "
        f"{len(embeddings)}"
    )

    # ---------------------------------------------------------
    # Build FAISS index
    # ---------------------------------------------------------

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatIP(dimension)

    index.add(embeddings)

    document_index_dir = (
        INDEX_DIR
        / "demo"
        / document_id
    )

    document_index_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    faiss_index_path = (
        document_index_dir
        / "faiss.index"
    )

    chunks_path = (
        document_index_dir
        / "chunks.json"
    )

    faiss.write_index(
        index,
        str(faiss_index_path),
    )

    with open(
        chunks_path,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            chunks,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("\nIndex created successfully!")

    print(
        f"FAISS index : {faiss_index_path}"
    )

    print(
        f"Chunks      : {chunks_path}"
    )

    print(
        f"Total chunks: {len(chunks)}"
    )


def build_all_demo_indexes():
    documents = get_demo_documents()

    if not documents:
        raise FileNotFoundError(
            f"No demo documents found in "
            f"{DOCUMENTS_DIR / 'demo'}"
        )

    print(
        f"Found {len(documents)} demo documents:\n"
    )

    for document in documents:
        print(f"  - {document.name}")

    for document in documents:

        db_document = get_document_record(
            document.name
        )

        print(
            f"\nDatabase document:"
            f" {db_document.title}"
        )

        build_index(
            file_path=str(document),
            document_id=str(db_document.id),
        )

    print(f"\n{'=' * 60}")
    print("ALL DEMO DOCUMENT INDEXES CREATED")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    build_all_demo_indexes()