from app.core.config import (
    DENSE_TOP_K,
    SPARSE_TOP_K,
    FINAL_TOP_K,
)

from app.retrieval.embeddings import EmbeddingService
from app.retrieval.vector_store import VectorStore
from app.retrieval.bm25 import BM25Retriever
from app.retrieval.hybrid import reciprocal_rank_fusion
from app.generation.llm import LLMGenerator

from app.tracing.tracer import Tracer


INDEX_PATH = "data/index/faiss.index"
CHUNKS_PATH = "data/index/chunks.json"


question = input("\nAsk a question: ").strip()

if not question:
    raise ValueError("Question cannot be empty")


# ============================================================
# TRACE
# ============================================================

tracer = Tracer(question)


# ============================================================
# LOAD INDEX
# ============================================================

print("\nLoading index...")

vector_store = VectorStore.load(
    INDEX_PATH,
    CHUNKS_PATH
)

print(
    f"Total indexed chunks: "
    f"{len(vector_store.chunks)}"
)


# ============================================================
# QUERY
# ============================================================

embedding_service = EmbeddingService()

query_start = tracer.start()

query_embedding = embedding_service.embed_query(
    question
)

tracer.finish(
    "Query Embedding",
    query_start,
    data={
        "question": question,
        "embedding_model": "BAAI/bge-small-en-v1.5",
    }
)


# ============================================================
# DENSE RETRIEVAL
# ============================================================

dense_start = tracer.start()

dense_results = vector_store.search(
    query_embedding,
    top_k=DENSE_TOP_K
)

tracer.finish(
    "Dense Retrieval",
    dense_start,
    data={
        "top_k": DENSE_TOP_K,
        "results": [
            {
                "chunk_id": item["chunk"]["chunk_id"],
                "score": item["score"],
            }
            for item in dense_results
        ],
    }
)


# ============================================================
# BM25
# ============================================================

bm25_start = tracer.start()

bm25 = BM25Retriever(
    vector_store.chunks
)

sparse_results = bm25.search(
    question,
    top_k=SPARSE_TOP_K
)

tracer.finish(
    "BM25",
    bm25_start,
    data={
        "top_k": SPARSE_TOP_K,
        "results": [
            {
                "chunk_id": item["chunk"]["chunk_id"],
                "score": item["score"],
            }
            for item in sparse_results
        ],
    }
)


# ============================================================
# RRF
# ============================================================

rrf_start = tracer.start()

fused_results = reciprocal_rank_fusion(
    dense_results,
    sparse_results
)

final_results = fused_results[:FINAL_TOP_K]

tracer.finish(
    "RRF",
    rrf_start,
    data={
        "candidate_count": len(fused_results),
        "final_top_k": FINAL_TOP_K,
        "results": [
            {
                "chunk_id": item["chunk"]["chunk_id"],
                "rrf_score": item["rrf_score"],
            }
            for item in final_results
        ],
    }
)


# ============================================================
# GENERATION
# ============================================================

generation_start = tracer.start()

generator = LLMGenerator()

answer = generator.generate(
    question,
    final_results
)

tracer.finish(
    "Generation",
    generation_start,
    data={
        "model": "groq",
        "chunks_used": len(final_results),
    }
)

tracer.set_answer(answer)


# ============================================================
# DISPLAY ANSWER
# ============================================================

print("\n" + "=" * 60)
print("ANSWER")
print("=" * 60)

print(answer)


# ============================================================
# DISPLAY TRACE
# ============================================================

trace = tracer.get_trace()

print("\n" + "=" * 60)
print("dRAGn TRACE")
print("=" * 60)

print(f"\nQuery: {trace.query}\n")

for stage in trace.stages:

    print(
        f"{stage.name:20} "
        f"{stage.latency_ms:8.2f} ms"
    )

    if stage.name == "Dense Retrieval":

        print("\n  Dense Results:")

        for result in stage.data["results"]:
            print(
                f"    Chunk {result['chunk_id']:<4} "
                f"Score: {result['score']:.4f}"
            )

    elif stage.name == "BM25":

        print("\n  BM25 Results:")

        for result in stage.data["results"]:
            print(
                f"    Chunk {result['chunk_id']:<4} "
                f"Score: {result['score']:.4f}"
            )

    elif stage.name == "RRF":

        print("\n  RRF Results:")

        for result in stage.data["results"]:
            print(
                f"    Chunk {result['chunk_id']:<4} "
                f"RRF: {result['rrf_score']:.6f}"
            )

print(
    f"\nTotal latency: "
    f"{trace.total_latency_ms:.2f} ms"
)