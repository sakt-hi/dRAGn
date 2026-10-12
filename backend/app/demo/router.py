from datetime import datetime
from typing import Any, Literal
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select

from app.db.database import SessionLocal
from app.db.models import (
    DemoConversation,
    DemoQuestion,
    DemoTurn,
    Document,
    SavedDemoResult,
)


router = APIRouter(prefix="/api/demo", tags=["saved demo"])


class DemoDocumentOut(BaseModel):
    id: uuid.UUID
    filename: str
    title: str
    description: str | None
    document_type: str
    source_type: str
    page_count: int | None
    chunk_count: int | None
    sample_question_count: int
    available_question_count: int
    demo_ready: bool


class DemoQuestionOut(BaseModel):
    id: uuid.UUID
    question: str
    category: str
    sort_order: int
    available: bool


class QueryResultOut(BaseModel):
    model_config = ConfigDict(extra="allow")

    answer: str
    citations: list[dict[str, Any]]
    trace: dict[str, Any]
    retrieved_chunks: list[dict[str, Any]]
    retrieval_diagnosis: dict[str, Any]
    grounding: dict[str, Any]


class DemoQueryOut(BaseModel):
    query_id: uuid.UUID
    sample_question_id: uuid.UUID
    document_id: uuid.UUID
    response_mode: Literal["saved_demo"] = "saved_demo"
    result: QueryResultOut


class StartConversationIn(BaseModel):
    sample_question_id: uuid.UUID


class AddTurnIn(BaseModel):
    sample_question_id: uuid.UUID
    parent_turn_id: uuid.UUID


class DemoTurnOut(BaseModel):
    id: uuid.UUID
    turn_number: int
    sample_question_id: uuid.UUID
    question: str
    answer: str
    response_mode: Literal["saved"]
    saved_result_id: uuid.UUID
    result: QueryResultOut
    created_at: datetime


class ConversationOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    initial_sample_question_id: uuid.UUID
    turns: list[DemoTurnOut]
    created_at: datetime


def _unavailable(detail: str = "This saved demo result is not available yet.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "SAVED_RESULT_UNAVAILABLE", "message": detail},
    )


def is_demo_ready(sample_question_count: int, available_question_count: int) -> bool:
    return sample_question_count >= 10 and available_question_count >= 10


def validate_document_boundary(question_document_id: uuid.UUID, conversation_document_id: uuid.UUID) -> None:
    if question_document_id != conversation_document_id:
        raise HTTPException(status_code=400, detail="Follow-up question belongs to a different document.")


def prioritize_follow_ups(questions: list[DemoQuestionOut], asked_counts: dict[uuid.UUID, int]) -> list[DemoQuestionOut]:
    return sorted(
        questions,
        key=lambda question: (
            asked_counts.get(question.id, 0) > 0,
            asked_counts.get(question.id, 0),
            question.sort_order,
        ),
    )


def _result_payload(saved: SavedDemoResult) -> QueryResultOut:
    try:
        return QueryResultOut.model_validate(
            {
                "answer": saved.answer,
                "citations": saved.citations,
                "trace": saved.pipeline_trace,
                "retrieved_chunks": saved.evidence,
                "retrieval_diagnosis": saved.retrieval_diagnosis,
                "grounding": saved.grounding_result,
            }
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INVALID_SAVED_RESULT", "message": "A saved demo result failed schema validation."},
        ) from error


def _published_result(session, question_id: uuid.UUID) -> tuple[DemoQuestion, SavedDemoResult]:
    row = session.execute(
        select(DemoQuestion, SavedDemoResult)
        .join(SavedDemoResult, SavedDemoResult.sample_question_id == DemoQuestion.id)
        .where(
            DemoQuestion.id == question_id,
            DemoQuestion.is_published.is_(True),
            SavedDemoResult.schema_version == 1,
        )
    ).first()
    if row is None:
        raise _unavailable()
    return row[0], row[1]


def _turn_out(turn: DemoTurn, saved: SavedDemoResult) -> DemoTurnOut:
    return DemoTurnOut(
        id=turn.id,
        turn_number=turn.turn_number,
        sample_question_id=turn.sample_question_id,
        question=turn.question,
        answer=turn.answer,
        response_mode="saved",
        saved_result_id=saved.id,
        result=_result_payload(saved),
        created_at=turn.created_at,
    )


@router.get("/documents", response_model=list[DemoDocumentOut])
def get_demo_documents():
    with SessionLocal() as session:
        documents = session.scalars(
            select(Document)
            .where(Document.status == "ready", Document.source_type == "demo")
            .order_by(Document.title)
        ).all()
        output = []
        for document in documents:
            question_count = session.scalar(
                select(func.count(DemoQuestion.id)).where(
                    DemoQuestion.document_id == document.id
                )
            ) or 0
            available_count = session.scalar(
                select(func.count(DemoQuestion.id))
                .join(SavedDemoResult, SavedDemoResult.sample_question_id == DemoQuestion.id)
                .where(
                    DemoQuestion.document_id == document.id,
                    DemoQuestion.is_published.is_(True),
                    SavedDemoResult.schema_version == 1,
                )
            ) or 0
            output.append(
                DemoDocumentOut(
                    id=document.id,
                    filename=document.filename,
                    title=document.title,
                    description=document.description,
                    document_type=document.document_type,
                    source_type=document.source_type,
                    page_count=document.page_count,
                    chunk_count=document.chunk_count,
                    sample_question_count=question_count,
                    available_question_count=available_count,
                    demo_ready=is_demo_ready(question_count, available_count),
                )
            )
        return output


@router.get("/documents/{document_id}/questions", response_model=list[DemoQuestionOut])
def get_document_questions(document_id: uuid.UUID):
    with SessionLocal() as session:
        document = session.get(Document, document_id)
        if document is None or document.source_type != "demo" or document.status != "ready":
            raise HTTPException(status_code=404, detail="Demo document not found.")

        rows = session.execute(
            select(DemoQuestion, SavedDemoResult.id)
            .outerjoin(SavedDemoResult, SavedDemoResult.sample_question_id == DemoQuestion.id)
            .where(DemoQuestion.document_id == document_id)
            .order_by(DemoQuestion.sort_order, DemoQuestion.id)
        ).all()
        return [
            DemoQuestionOut(
                id=question.id,
                question=question.question,
                category=question.category,
                sort_order=question.sort_order,
                available=bool(question.is_published and result_id),
            )
            for question, result_id in rows
        ]


@router.get("/queries/{query_id}", response_model=DemoQueryOut)
def get_saved_query(query_id: uuid.UUID):
    with SessionLocal() as session:
        question, saved = _published_result(session, query_id)
        return DemoQueryOut(
            query_id=question.id,
            sample_question_id=question.id,
            document_id=question.document_id,
            result=_result_payload(saved),
        )


@router.get("/queries/{query_id}/follow-ups", response_model=list[DemoQuestionOut])
def get_query_follow_ups(query_id: uuid.UUID):
    with SessionLocal() as session:
        question, _ = _published_result(session, query_id)
        return _available_questions(session, question.document_id, exclude_id=question.id)


def _available_questions(session, document_id: uuid.UUID, exclude_id: uuid.UUID | None = None):
    query = (
        select(DemoQuestion, SavedDemoResult.id)
        .join(SavedDemoResult, SavedDemoResult.sample_question_id == DemoQuestion.id)
        .where(
            DemoQuestion.document_id == document_id,
            DemoQuestion.is_published.is_(True),
            SavedDemoResult.schema_version == 1,
        )
    )
    if exclude_id:
        query = query.where(DemoQuestion.id != exclude_id)
    return [
        DemoQuestionOut(
            id=question.id,
            question=question.question,
            category=question.category,
            sort_order=question.sort_order,
            available=True,
        )
        for question, _ in session.execute(query.order_by(DemoQuestion.sort_order)).all()
    ]


@router.post("/conversations", response_model=ConversationOut, status_code=201)
def create_conversation(request: StartConversationIn):
    with SessionLocal() as session:
        question, saved = _published_result(session, request.sample_question_id)
        conversation = DemoConversation(
            id=uuid.uuid4(),
            document_id=question.document_id,
            initial_sample_question_id=question.id,
        )
        turn = DemoTurn(
            id=uuid.uuid4(),
            conversation_id=conversation.id,
            parent_turn_id=None,
            turn_number=1,
            sample_question_id=question.id,
            question=question.question,
            answer=saved.answer,
            response_mode="saved",
            saved_result_id=saved.id,
        )
        session.add_all([conversation, turn])
        session.commit()
        session.refresh(conversation)
        session.refresh(turn)
        return ConversationOut(
            id=conversation.id,
            document_id=conversation.document_id,
            initial_sample_question_id=conversation.initial_sample_question_id,
            turns=[_turn_out(turn, saved)],
            created_at=conversation.created_at,
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: uuid.UUID):
    with SessionLocal() as session:
        conversation = session.get(DemoConversation, conversation_id)
        if conversation is None:
            raise HTTPException(status_code=404, detail="Demo conversation not found.")
        rows = session.execute(
            select(DemoTurn, SavedDemoResult)
            .join(SavedDemoResult, SavedDemoResult.id == DemoTurn.saved_result_id)
            .where(DemoTurn.conversation_id == conversation_id)
            .order_by(DemoTurn.turn_number, DemoTurn.created_at)
        ).all()
        return ConversationOut(
            id=conversation.id,
            document_id=conversation.document_id,
            initial_sample_question_id=conversation.initial_sample_question_id,
            turns=[_turn_out(turn, saved) for turn, saved in rows],
            created_at=conversation.created_at,
        )


@router.get("/conversations/{conversation_id}/follow-ups", response_model=list[DemoQuestionOut])
def get_conversation_follow_ups(conversation_id: uuid.UUID):
    with SessionLocal() as session:
        conversation = session.get(DemoConversation, conversation_id)
        if conversation is None:
            raise HTTPException(status_code=404, detail="Demo conversation not found.")
        rows = session.execute(
            select(DemoTurn.sample_question_id, func.count(DemoTurn.id))
            .where(
                DemoTurn.conversation_id == conversation_id,
                DemoTurn.sample_question_id.is_not(None),
            )
            .group_by(DemoTurn.sample_question_id)
        ).all()
        asked_counts = {question_id: count for question_id, count in rows}
        questions = _available_questions(session, conversation.document_id)
        return prioritize_follow_ups(questions, asked_counts)


@router.post("/conversations/{conversation_id}/turns", response_model=DemoTurnOut, status_code=201)
def add_conversation_turn(conversation_id: uuid.UUID, request: AddTurnIn):
    with SessionLocal() as session:
        conversation = session.get(DemoConversation, conversation_id)
        if conversation is None:
            raise HTTPException(status_code=404, detail="Demo conversation not found.")
        parent = session.get(DemoTurn, request.parent_turn_id)
        if parent is None or parent.conversation_id != conversation.id:
            raise HTTPException(status_code=400, detail="Parent turn does not belong to this conversation.")
        question, saved = _published_result(session, request.sample_question_id)
        validate_document_boundary(question.document_id, conversation.document_id)

        turn = DemoTurn(
            id=uuid.uuid4(),
            conversation_id=conversation.id,
            parent_turn_id=parent.id,
            turn_number=(session.scalar(
                select(func.max(DemoTurn.turn_number)).where(DemoTurn.conversation_id == conversation.id)
            ) or 0) + 1,
            sample_question_id=question.id,
            question=question.question,
            answer=saved.answer,
            response_mode="saved",
            saved_result_id=saved.id,
        )
        session.add(turn)
        session.commit()
        session.refresh(turn)
        return _turn_out(turn, saved)
