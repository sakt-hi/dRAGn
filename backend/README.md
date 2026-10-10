# 🐉 dRAGn

### See what your RAG sees.

**dRAGn** is a visual debugging and retrieval intelligence platform for **Retrieval-Augmented Generation (RAG)** systems.

Instead of treating RAG as a black box, dRAGn lets developers inspect what happens between a user's question and the final AI answer — from document ingestion and chunking to retrieval, ranking, generation, citations, and grounding.

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

Every important stage can be inspected.

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

# 🧪 Retrieval Experiments

One of the core ideas behind dRAGn is experimentation.

Instead of changing retrieval parameters blindly, developers can compare different configurations.

```text
Experiment A

Dense Top-K       10
Sparse Top-K      10
Final Top-K        5
Dense Weight      0.7
Sparse Weight     0.3
```

versus:

```text
Experiment B

Dense Top-K       20
Sparse Top-K      10
Final Top-K        5
Dense Weight      0.5
Sparse Weight     0.5
```

The goal is to understand:

> Which retrieval configuration actually improves the system?

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
- React Flow
- Recharts

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

The repository contains a small demo corpus for experimenting with dRAGn.

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

User-uploaded documents and runtime-generated indexes are **not** committed.

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
git clone https://github.com/<your-username>/dragn.git
cd dragn
```

---

# 🐍 Backend Setup

```bash
cd backend
```

Activate the virtual environment:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
uv sync
```

Create your environment file:

```bash
cp .env.example .env
```

Configure:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=your_database_url
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
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

# 🖥️ Frontend

The frontend is being built with:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow
- Recharts

The frontend will provide a visual interface for:

- document selection
- querying
- retrieval inspection
- RAG pipeline visualization
- evidence inspection
- citations
- grounding
- retrieval diagnosis
- experiments

---

# 🔮 Roadmap

## Phase 1 — RAG Core

- [x] Document ingestion
- [x] Page-aware PDF extraction
- [x] Recursive chunking
- [x] Embeddings
- [x] FAISS dense retrieval
- [x] BM25 retrieval
- [x] Reciprocal Rank Fusion
- [x] Retrieval diagnosis
- [x] LLM generation
- [x] Citation resolution
- [x] Answer grounding
- [x] Pipeline tracing
- [x] Runtime retrieval configuration

## Phase 2 — Visual Debugger

- [ ] Next.js frontend
- [ ] Interactive RAG pipeline
- [ ] Retrieval score visualization
- [ ] Dense vs BM25 comparison
- [ ] Evidence inspector
- [ ] Citation visualization
- [ ] Grounding dashboard
- [ ] Query trace timeline

## Phase 3 — RAG Experiments

- [ ] Experiment creation
- [ ] Configuration comparison
- [ ] Retrieval evaluation
- [ ] Precision / recall metrics
- [ ] Retrieval quality dashboard
- [ ] Experiment history

## Phase 4 — User Workspaces

- [ ] Authentication
- [ ] Google SSO
- [ ] Private document uploads
- [ ] User-specific workspaces
- [ ] Query history
- [ ] Saved experiments

## Phase 5 — Production Retrieval

- [ ] Supabase Storage
- [ ] PostgreSQL pgvector
- [ ] Persistent embeddings
- [ ] Production document processing
- [ ] Background ingestion
- [ ] Scalable retrieval

---

# ☁️ Deployment Architecture

The target deployment architecture is:

```text
                    GitHub
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          Vercel               Render
             │                   │
             ▼                   ▼
       Next.js Frontend     FastAPI Backend
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                Supabase       Groq       Embeddings
                PostgreSQL                 / Models
                + Storage
                + pgvector
```

---

# 🎯 Why dRAGn?

Most RAG applications answer:

> "What did the AI say?"

dRAGn asks:

> **"Why did the AI say it?"**

And then goes one step further:

> **"Can we prove where that answer came from?"**

The long-term goal is to make RAG systems as observable and debuggable as traditional software systems.

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

# 📌 Status

**Early development**

The backend RAG pipeline is functional.

The visual debugging interface and experimentation platform are under active development.

---

## ⭐ If you find this project useful

Star the repository and follow the development of dRAGn.

**See what your RAG sees.** 🐉