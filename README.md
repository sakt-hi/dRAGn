# 🐉 dRAGn

### See what your RAG sees.

**dRAGn** is a visual debugging and retrieval intelligence platform for **Retrieval-Augmented Generation (RAG)** systems. The repository includes a locally runnable full app on `main` and a lightweight, curated demo mode on [`codex/demo-query-playground`](https://github.com/sakt-hi/dRAGn/tree/codex/demo-query-playground).

Instead of treating RAG as a black box, dRAGn lets developers inspect the path from a user's question to the final answer: retrieval, ranking, evidence, generation, citations, grounding, and pipeline trace.

---

## 🚨 The Problem

Building a RAG application is relatively easy.

Understanding **why it failed** is not.

A RAG system can produce a bad answer because:

- the right chunk was never retrieved
- semantic search missed an exact keyword
- keyword search missed semantic meaning
- dense and sparse retrieval disagreed
- ranking pushed the useful evidence down
- irrelevant context reached the LLM
- the LLM generated an unsupported answer
- citations pointed to the wrong evidence
- chunking destroyed important context

Most RAG applications only show the final answer.

Developers need to see what happened underneath.

---

## 💡 The Idea

dRAGn turns RAG into an observable pipeline.

```text
                    User Query
                        │
                        ▼
                ┌────────────────┐
                │ Query Embedding│
                └───────┬────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       Dense Retrieval       BM25 Retrieval
              │                   │
              └─────────┬─────────┘
                        ▼
              Reciprocal Rank Fusion
                        │
                        ▼
               Retrieval Diagnosis
                        │
                        ▼
                   Top Evidence
                        │
                        ▼
                    LLM / Groq
                        │
                        ▼
                 Citation Resolution
                        │
                        ▼
                 Answer Grounding
                        │
                        ▼
                    Final Answer
```

The playground exposes the key stages of a RAG query so developers can inspect how an answer was produced.

---

# 🔍 What dRAGn Does

## 1. Document Ingestion

Understand how source documents enter the RAG system.

dRAGn extracts:

- document metadata
- pages
- sections
- text
- chunk boundaries
- chunk sizes

The platform maintains page-aware evidence so retrieved information can be traced back to its original source.

---

## 2. Chunking Inspection

See exactly how documents are divided into retrieval units.

Current chunking uses recursive text splitting with configurable:

- chunk size
- chunk overlap
- structural separators

This makes it possible to investigate whether retrieval problems originate from poor chunk boundaries.

---

## 3. Hybrid Retrieval

dRAGn combines two fundamentally different retrieval signals.

### Dense Retrieval

Uses vector embeddings to identify semantically similar content.

```text
Question
   ↓
Embedding
   ↓
Vector Search
   ↓
Semantic Matches
```

### BM25 Retrieval

Uses lexical matching to identify keyword-level relevance.

```text
Question
   ↓
Token Matching
   ↓
BM25
   ↓
Keyword Matches
```

### Why both?

Semantic search is good at meaning.

BM25 is good at exact terminology.

Combining them can provide stronger retrieval than relying on either signal alone.

---

# ⚡ Reciprocal Rank Fusion

dRAGn combines dense and sparse retrieval using **Reciprocal Rank Fusion (RRF)**.

```text
Dense Results ─────┐
                   ├──► RRF ──► Final Ranking
BM25 Results ──────┘
```

The retrieval configuration can be experimented with using:

- Dense Top-K
- Sparse Top-K
- Final Top-K
- RRF K
- Dense Weight
- Sparse Weight

This makes retrieval behavior measurable rather than hidden.

---

# 🧠 Retrieval Diagnosis

dRAGn doesn't stop at showing retrieved chunks.

It attempts to explain **why the retrieval system selected them**.

### Strong Agreement

```text
Dense       #1
BM25        #2
RRF         #1

Diagnosis:
Dense and BM25 retrieval strongly agree on the primary evidence.
```

### Semantic Winner

```text
Dense       #1
BM25        #9

Diagnosis:
Semantic retrieval found evidence that keyword retrieval did not prioritize.
```

### Keyword Winner

```text
Dense       #8
BM25        #1

Diagnosis:
Keyword retrieval found a strong lexical match missed by semantic ranking.
```

This turns retrieval results into actionable debugging information.

---

# 📚 Evidence Inspector

Every retrieved chunk can be connected back to its source.

```text
Source
Employee Handbook

Page
2

Chunk
8

Dense Rank
#1

BM25 Rank
#2

RRF Rank
#1
```

> Don't just show developers what the model answered.  
> Show them the evidence that led to the answer.

---

# 🔗 Citation Resolution

Generated answers contain citations that are resolved against retrieved evidence.

Example:

```text
Employees receive 18 days of annual leave per calendar year.[1]
```

dRAGn resolves `[1]` to the underlying evidence:

```text
Citation #1
    ↓
Employee Handbook
    ↓
Page 2
    ↓
Chunk 8
```

This allows developers to inspect whether generated claims actually have supporting evidence.

---

# 🛡️ Answer Grounding

dRAGn evaluates whether the generated answer is supported by the retrieved evidence.

Example:

```text
Grounding
──────────────
Status      Grounded
Coverage    100%
Citations   1
```

The objective is to distinguish supported answers from unsupported claims.

---

## 🔧 Retrieval Configuration

Each investigation can be run with configurable dense, sparse, and final top-K values, RRF K, and dense/sparse weights. Inspect the resulting evidence and diagnosis to understand how those settings affect a query.

---

# 🏗️ Architecture

dRAGn is structured as a monorepo.

```text
dRAGn
│
├── frontend/
│   └── Next.js + TypeScript
│
├── backend/
│   ├── app/
│   │   ├── ingestion/
│   │   ├── retrieval/
│   │   ├── generation/
│   │   ├── diagnosis/
│   │   ├── tracing/
│   │   ├── rag/
│   │   └── db/
│   │
│   └── data/
│       ├── documents/
│       └── index/
│
└── README.md
```

---

# 🧰 Tech Stack

## Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Supabase
- FAISS
- BM25
- Sentence Transformers
- Groq
- Pydantic

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Retrieval

- Dense Vector Search
- BM25
- Reciprocal Rank Fusion
- BGE-small embeddings

## Documents

- PDF
- Markdown
- Text

---

# 📊 Current Demo Corpus

The playground uses a curated demo corpus so the same questions can be explored consistently.

```text
backend/data/documents/demo/

├── employee-handbook.pdf
├── health-insurance-policy.pdf
├── software-documentation.pdf
├── fitness-program-guide.pdf
├── cgrc-exam-notification-2026.pdf
└── azure.md
```

Pre-built demo indexes are also included:

```text
backend/data/index/demo/
```

These demo assets are intentionally committed to the repository.

The current playground is limited to these curated demo documents. Custom uploads and private workspaces are outside this release.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

- Python 3.11+
- `uv`
- Git
- a Groq API key
- PostgreSQL / Supabase database

## Clone the repository

```bash
git clone https://github.com/sakt-hi/dRAGn.git
cd dRAGn
```

---

# 🔌 API

## Health

```http
GET /health
```

## List documents

```http
GET /api/documents
```

## Get document

```http
GET /api/documents/{document_id}
```

## Preview document

```http
GET /api/documents/{document_id}/preview
```

## Query RAG

```http
POST /api/query
```

Example:

```json
{
  "document_id": "document-uuid",
  "question": "How many annual leave days are provided per year?"
}
```

Optional retrieval configuration:

```json
{
  "document_id": "document-uuid",
  "question": "How many annual leave days are provided per year?",
  "retrieval": {
    "dense_top_k": 10,
    "sparse_top_k": 10,
    "final_top_k": 5,
    "rrf_k": 60,
    "dense_weight": 0.7,
    "sparse_weight": 0.3
  }
}
```

---

# 🖥️ Playground Features

The current interface supports the complete demo investigation flow:

- Browse the curated source documents and preview PDFs or Markdown.
- Ask a question or use a suggested prompt.
- Review the generated answer and its citations.
- Inspect ranked evidence chunks and their dense, BM25, and RRF ranks.
- Check citation grounding and evidence coverage.
- Review retrieval health, confidence, and dense/BM25 agreement.
- Trace the request through the pipeline stages.
- Tune retrieval settings and ask follow-up questions within an investigation.

## Two ways to explore dRAGn

### Full app — `main`

Run the full app locally to ask questions against the demo documents with the live RAG backend. This mode requires a Groq API key, a PostgreSQL-compatible database, and the compute needed to run the embedding and retrieval pipeline.

### Curated demo — `codex/demo-query-playground`

The [demo branch](https://github.com/sakt-hi/dRAGn/tree/codex/demo-query-playground) provides an interactive showcase built around predefined questions and saved responses. It presents the same kinds of insights—answers, evidence, citations, grounding, retrieval diagnosis, and pipeline traces—without requiring free-form model generation for every question. It is a guided demo, rather than an unrestricted chatbot.

Neither version is currently hosted as a public service. The full app needs dedicated backend, database, and model infrastructure; the demo branch is available in the repository for local setup.

## Run locally

### Backend

1. Install Python 3.11+ and [`uv`](https://docs.astral.sh/uv/).
2. Configure the backend environment:

   ```bash
   cd backend
   uv sync
   cp .env.example .env
   ```

3. Set `GROQ_API_KEY`, `GROQ_MODEL`, and `DATABASE_URL` in `backend/.env`.
4. Start the API:

   ```bash
   uv run uvicorn app.main:app --reload
   ```

   The API runs at `http://127.0.0.1:8000`; interactive API docs are at `http://127.0.0.1:8000/docs`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in `frontend/.env.local` so the frontend can reach the local API.

---

# 🎯 Why dRAGn?

Most RAG applications answer:

> "What did the AI say?"

dRAGn asks:

> **"Why did the AI say it?"**

And then goes one step further:

> **"Can we prove where that answer came from?"**

The goal is to make RAG systems more observable and debuggable by showing the evidence and processing path behind each answer.

---

# 🧭 Project Philosophy

dRAGn is built around one principle:

```text
Don't just evaluate the answer.

Understand the entire path that produced it.
```

A RAG system should not be a black box.

It should be inspectable.

---

# 📌 Project Status

**Complete for the current project scope.** `main` contains the locally runnable, live RAG application, and `codex/demo-query-playground` contains the guided demo experience. No additional development phases are planned.

The project is not currently hosted. Authentication, private user workspaces, arbitrary document uploads, and production-scale hosting are outside this release.

---

## ⭐ If you find this project useful

Star the repository to save the project.

**See what your RAG sees.** 🐉
