from datetime import datetime

from sqlalchemy import(
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.database import Base

import uuid

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    filename: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    document_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    source_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="demo"
    )

    source: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    size_bytes: Mapped[int] = mapped_column(
        BigInteger, nullable=False
    )

    page_count: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    chunk_count: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="ready"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    chunks = relationship(
        "Chunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )

class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id"),
        nullable=False,
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    text: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    section: Mapped[str] = mapped_column(
        String(255), nullable=True
    )

    document = relationship(
        "Document",
        back_populates="chunks"
    )

class UploadQuota(Base):
    __tablename__ = "upload_quotas"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    ip_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )

    upload_date: Mapped[str] = mapped_column(
        String(10), nullable=False
    )

    upload_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )


class DemoQuestion(Base):
    __tablename__ = "demo_questions"
    __table_args__ = (
        UniqueConstraint("document_id", "question_key"),
        UniqueConstraint("document_id", "sort_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_key: Mapped[str] = mapped_column(String(100), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )


class SavedDemoResult(Base):
    __tablename__ = "saved_demo_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sample_question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("demo_questions.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[list] = mapped_column(JSONB, nullable=False)
    evidence: Mapped[list] = mapped_column(JSONB, nullable=False)
    grounding_result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    retrieval_diagnosis: Mapped[dict] = mapped_column(JSONB, nullable=False)
    pipeline_trace: Mapped[dict] = mapped_column(JSONB, nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )


class DemoConversation(Base):
    __tablename__ = "demo_conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    initial_sample_question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("demo_questions.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )


class DemoTurn(Base):
    __tablename__ = "demo_turns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("demo_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_turn_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("demo_turns.id", ondelete="CASCADE"), nullable=True
    )
    turn_number: Mapped[int] = mapped_column(Integer, nullable=False)
    sample_question_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("demo_questions.id"), nullable=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    response_mode: Mapped[str] = mapped_column(String(12), nullable=False, default="saved")
    saved_result_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("saved_demo_results.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
