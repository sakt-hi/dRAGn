import os

from fastapi import FastAPI,Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models import Document

from app.rag.pipeline import RAGPipeline
import uuid

from fastapi import HTTPException
from app.ingestion.loader import load_document
from pathlib import Path


app = FastAPI(
    title="dRAGn API",
    description="Visual RAG Debugger & Retrieval Intelligence Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RetrievalConfig(BaseModel):
    dense_top_k: Optional[int] = None
    sparse_top_k: Optional[int] = None
    final_top_k: Optional[int] = None

    rrf_k: Optional[int] = None

    dense_weight: Optional[float] = None
    sparse_weight: Optional[float] = None

class QueryRequest(BaseModel):
    document_id: uuid.UUID
    question: str
    retrieval: Optional[RetrievalConfig] = None


# Load the RAG pipeline once when the API starts
pipeline = RAGPipeline()

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred while processing the request.",
            }
        },
    )


@app.get("/")
def root():
    return {
        "name": "dRAGn",
        "message": "Visual RAG Debugger API",
        "version": "0.1.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }

@app.get("/api/documents")
def get_documents():
    with SessionLocal() as session:
        documents = session.scalars(
            select(Document)
            .where(Document.status == "ready")
            .order_by(Document.id)
        ).all()

        return [
            {
                "id": document.id,
                "filename": document.filename,
                "title": document.title,
                "description": document.description,
                "document_type": document.document_type,
                "source_type": document.source_type,
                "page_count": document.page_count,
                "chunk_count": document.chunk_count,
                "status": document.status,
            }
            for document in documents
        ]

@app.get("/api/documents/{document_id}")
def get_document(document_id: uuid.UUID):
    with SessionLocal() as session:
        document = session.get(
            Document,
            document_id,
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found",
            )

        return {
            "id": document.id,
            "filename": document.filename,
            "title": document.title,
            "description": document.description,
            "document_type": document.document_type,
            "source_type": document.source_type,
            "page_count": document.page_count,
            "chunk_count": document.chunk_count,
            "status": document.status,
            "created_at": document.created_at,
        }

@app.get("/api/documents/{document_id}/preview")
def preview_document(document_id: uuid.UUID):
    with SessionLocal() as session:
        document = session.get(
            Document,
            document_id,
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found",
            )

        if document.status != "ready":
            raise HTTPException(
                status_code=409,
                detail=f"Document is not ready: {document.status}",
            )

        if document.source_type != "demo":
            raise HTTPException(
                status_code=400,
                detail="Preview is currently available only for demo documents.",
            )

        file_path = (
            Path("data")
            / "documents"
            / "demo"
            / document.filename
        )

        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Source document file not found.",
            )

        pages = load_document(str(file_path))

        return {
            "document_id": document.id,
            "title": document.title,
            "filename": document.filename,
            "page_count": document.page_count,
            "pages": [
                {
                    "page": page["page"],
                    "text": page["text"],
                }
                for page in pages
            ],
        }

@app.post("/api/query")
def query(request: QueryRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    with SessionLocal() as session:
        document = session.get(
            Document,
            request.document_id,
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found",
            )

        if document.status != "ready":
            raise HTTPException(
                status_code=409,
                detail=f"Document is not ready: {document.status}",
            )

    result = pipeline.ask(
        question,
        retrieval_config=request.retrieval,
        document_id=str(request.document_id),
    )

    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
    )