-- Additive schema for deterministic saved-demo queries and multi-turn sessions.
-- Existing documents, chunks, and uploaded-document tables are reused as-is.

CREATE TABLE IF NOT EXISTS demo_questions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    question_key VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    category VARCHAR(40) NOT NULL,
    sort_order INTEGER NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_demo_questions_document_key UNIQUE (document_id, question_key),
    CONSTRAINT uq_demo_questions_document_order UNIQUE (document_id, sort_order)
);

CREATE INDEX IF NOT EXISTS ix_demo_questions_document_id
    ON demo_questions (document_id);
CREATE INDEX IF NOT EXISTS ix_demo_questions_published_order
    ON demo_questions (document_id, is_published, sort_order);

CREATE TABLE IF NOT EXISTS saved_demo_results (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    sample_question_id UUID NOT NULL UNIQUE REFERENCES demo_questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    citations JSONB NOT NULL,
    evidence JSONB NOT NULL,
    grounding_result JSONB NOT NULL,
    retrieval_diagnosis JSONB NOT NULL,
    pipeline_trace JSONB NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_saved_demo_results_document_id
    ON saved_demo_results (document_id);

CREATE TABLE IF NOT EXISTS demo_conversations (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    initial_sample_question_id UUID NOT NULL REFERENCES demo_questions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_demo_conversations_document_id
    ON demo_conversations (document_id);

CREATE TABLE IF NOT EXISTS demo_turns (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES demo_conversations(id) ON DELETE CASCADE,
    parent_turn_id UUID REFERENCES demo_turns(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    sample_question_id UUID REFERENCES demo_questions(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    response_mode VARCHAR(12) NOT NULL DEFAULT 'saved',
    saved_result_id UUID REFERENCES saved_demo_results(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_demo_turns_response_mode CHECK (response_mode IN ('saved', 'live'))
);

CREATE INDEX IF NOT EXISTS ix_demo_turns_conversation_id
    ON demo_turns (conversation_id, turn_number);
CREATE INDEX IF NOT EXISTS ix_demo_turns_parent_turn_id
    ON demo_turns (parent_turn_id);
