from datetime import datetime

from sqlalchemy import(
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

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