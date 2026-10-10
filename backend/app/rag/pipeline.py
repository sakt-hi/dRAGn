import uuid
from pathlib import Path

from app.core.config import (
    DENSE_TOP_K,
    SPARSE_TOP_K,
    FINAL_TOP_K,
    RRF_K,
    DENSE_WEIGHT,
    SPARSE_WEIGHT,
)

from app.retrieval.embeddings import EmbeddingService
from app.retrieval.vector_store import VectorStore
from app.retrieval.bm25 import BM25Retriever
from app.retrieval.hybrid import reciprocal_rank_fusion

from app.generation.llm import LLMGenerator
from app.generation.response import build_structured_citations

from app.tracing.models import RAGTrace
from app.tracing.instrumentation import (
    set_current_trace,
    clear_current_trace,
    trace_stage,
)
from app.tracing.serializer import serialize_trace

from app.diagnosis.query_diagnosis import diagnose_retrieval
from app.diagnosis.grounding import verify_answer_grounding


INDEX_DIR = Path("data/index")
DEMO_INDEX_DIR = INDEX_DIR / "demo"


class RAGPipeline:

    def __init__(
        self,
        index_path: str | None = None,
        chunks_path: str | None = None,
    ):
        print("Loading dRAGn RAG pipeline...")

        self.default_index_path = index_path
        self.default_chunks_path = chunks_path

        self.embedding_service = EmbeddingService()
        self.generator = LLMGenerator()

        # These are loaded lazily when a document is selected.
        self.vector_store = None
        self.bm25 = None
        self.current_document_id = None

        # Preserve backwards compatibility if an explicit
        # index/chunks path is provided.
        if index_path and chunks_path:
            self._load_document_index(
                index_path=index_path,
                chunks_path=chunks_path,
                document_id=None,
            )

        print("RAG pipeline ready.")

    def _load_document_index(
        self,
        index_path: str,
        chunks_path: str,
        document_id: str | None,
    ):
        """
        Load the FAISS and BM25 indexes for one document.
        """

        if not Path(index_path).exists():
            raise FileNotFoundError(
                f"FAISS index not found: {index_path}"
            )

        if not Path(chunks_path).exists():
            raise FileNotFoundError(
                f"Chunks file not found: {chunks_path}"
            )

        # Avoid reloading the same document for every query.
        if (
            document_id is not None
            and self.current_document_id == document_id
            and self.vector_store is not None
            and self.bm25 is not None
        ):
            return

        print(
            f"Loading document index: "
            f"{document_id or index_path}"
        )

        self.vector_store = VectorStore.load(
            index_path,
            chunks_path,
        )

        self.bm25 = BM25Retriever(
            self.vector_store.chunks
        )

        self.current_document_id = document_id

        print(
            f"Loaded "
            f"{len(self.vector_store.chunks)} chunks"
        )

    def _resolve_document_index(
        self,
        document_id: str | None,
    ):
        if not document_id:
            raise ValueError(
                "document_id is required."
            )

        document_id = str(document_id).strip()

        try:
            uuid.UUID(document_id)
        except ValueError as exc:
            raise ValueError(
                f"Invalid document_id: {document_id}"
            ) from exc

        document_index_dir = (
            DEMO_INDEX_DIR / document_id
        )

        index_path = (
            document_index_dir / "faiss.index"
        )

        chunks_path = (
            document_index_dir / "chunks.json"
        )

        if not document_index_dir.exists():
            raise FileNotFoundError(
                f"Index directory not found for "
                f"document: {document_id}"
            )

        if not index_path.exists():
            raise FileNotFoundError(
                f"FAISS index not found for "
                f"document: {document_id}"
            )

        if not chunks_path.exists():
            raise FileNotFoundError(
                f"Chunks file not found for "
                f"document: {document_id}"
            )

        return (
            str(index_path),
            str(chunks_path),
        )
        
    @trace_stage(
        "Query Embedding",
        capture=lambda result: {
            "embedding_dimensions": len(result),
        },
    )
    def _embed_query(self, question: str):

        return self.embedding_service.embed_query(
            question
        )

    @trace_stage(
        "Dense Retrieval",
        capture=lambda results: {
            "top_k": len(results),
            "results": [
                {
                    "rank": rank,
                    "chunk_id": item["chunk"]["chunk_id"],
                    "source": item["chunk"]["source"],
                    "page": item["chunk"].get("page"),
                    "section": item["chunk"].get("section"),
                    "score": item["score"],
                    "text": item["chunk"]["text"],
                }
                for rank, item in enumerate(
                    results,
                    start=1,
                )
            ],
        },
    )
    def _dense_retrieve(
        self,
        query_embedding,
        top_k,
    ):

        return self.vector_store.search(
            query_embedding,
            top_k=top_k,
        )

    @trace_stage(
        "BM25",
        capture=lambda results: {
            "top_k": len(results),
            "results": [
                {
                    "rank": rank,
                    "chunk_id": item["chunk"]["chunk_id"],
                    "source": item["chunk"]["source"],
                    "page": item["chunk"].get("page"),
                    "section": item["chunk"].get("section"),
                    "score": item["score"],
                    "text": item["chunk"]["text"],
                }
                for rank, item in enumerate(
                    results,
                    start=1,
                )
            ],
        },
    )
    def _sparse_retrieve(
        self,
        question: str,
        top_k,
    ):

        return self.bm25.search(
            question,
            top_k=top_k,
        )

    @trace_stage(
        "RRF",
        capture=lambda results: {
            "final_top_k": len(results),
            "results": [
                {
                    "rank": rank,
                    "chunk_id": item["chunk"]["chunk_id"],
                    "source": item["chunk"]["source"],
                    "section": item["chunk"].get("section"),

                    "dense_rank": item.get("dense_rank"),
                    "dense_score": item.get("dense_score"),
                    "dense_contribution": item.get(
                        "dense_contribution"
                    ),

                    "bm25_rank": item.get("bm25_rank"),
                    "bm25_score": item.get("bm25_score"),
                    "bm25_contribution": item.get(
                        "bm25_contribution"
                    ),

                    "rrf_score": item["rrf_score"],
                    "retrieval_decision": item.get(
                        "retrieval_decision"
                    ),
                }
                for rank, item in enumerate(
                    results,
                    start=1,
                )
            ],
        },
    )
    def _fuse_results(
        self,
        dense_results,
        sparse_results,
        rrf_k,
        dense_weight,
        sparse_weight,
        final_top_k,
    ):

        fused_results = reciprocal_rank_fusion(
            dense_results,
            sparse_results,
            k=rrf_k,
            dense_weight=dense_weight,
            sparse_weight=sparse_weight,
        )

        return fused_results[:final_top_k]

    @trace_stage(
        "Generation",
        capture=lambda result: {
            "answer_length": len(result),
        },
    )
    def _generate(
        self,
        question: str,
        results,
    ):

        return self.generator.generate(
            question,
            results,
        )

    def ask(
        self,
        question: str,
        retrieval_config=None,
        document_id: str | None = None,
    ):

        # ---------------------------------------------------------
        # Resolve retrieval configuration
        # ---------------------------------------------------------

        dense_top_k = (
            retrieval_config.dense_top_k
            if retrieval_config
            and retrieval_config.dense_top_k is not None
            else DENSE_TOP_K
        )

        sparse_top_k = (
            retrieval_config.sparse_top_k
            if retrieval_config
            and retrieval_config.sparse_top_k is not None
            else SPARSE_TOP_K
        )

        final_top_k = (
            retrieval_config.final_top_k
            if retrieval_config
            and retrieval_config.final_top_k is not None
            else FINAL_TOP_K
        )

        rrf_k = (
            retrieval_config.rrf_k
            if retrieval_config
            and retrieval_config.rrf_k is not None
            else RRF_K
        )

        dense_weight = (
            retrieval_config.dense_weight
            if retrieval_config
            and retrieval_config.dense_weight is not None
            else DENSE_WEIGHT
        )

        sparse_weight = (
            retrieval_config.sparse_weight
            if retrieval_config
            and retrieval_config.sparse_weight is not None
            else SPARSE_WEIGHT
        )

        # ---------------------------------------------------------
        # Load selected document index
        # ---------------------------------------------------------

        index_path, chunks_path = (
            self._resolve_document_index(
                document_id
            )
        )

        self._load_document_index(
            index_path=index_path,
            chunks_path=chunks_path,
            document_id=document_id,
        )

        # ---------------------------------------------------------
        # Create trace
        # ---------------------------------------------------------

        trace = RAGTrace(
            query=question
        )

        set_current_trace(trace)

        trace_stage(
            "Document Selection",
            capture=lambda _: {
                "document_id": document_id,
                "index_path": index_path,
                "chunks_path": chunks_path,
                "chunk_count": len(
                    self.vector_store.chunks
                ),
            },
        )(lambda: None)()

        trace_stage(
            "Retrieval Configuration",
            capture=lambda _: {
                "dense_weight": dense_weight,
                "sparse_weight": sparse_weight,
                "dense_top_k": dense_top_k,
                "sparse_top_k": sparse_top_k,
                "final_top_k": final_top_k,
                "rrf_k": rrf_k,
            },
        )(lambda: None)()

        try:

            # -----------------------------------------------------
            # Query embedding
            # -----------------------------------------------------

            query_embedding = self._embed_query(
                question
            )

            # -----------------------------------------------------
            # Dense retrieval
            # -----------------------------------------------------

            dense_results = self._dense_retrieve(
                query_embedding,
                top_k=dense_top_k,
            )

            # -----------------------------------------------------
            # Sparse retrieval
            # -----------------------------------------------------

            sparse_results = self._sparse_retrieve(
                question,
                top_k=sparse_top_k,
            )

            # -----------------------------------------------------
            # Hybrid fusion
            # -----------------------------------------------------

            final_results = self._fuse_results(
                dense_results,
                sparse_results,
                rrf_k=rrf_k,
                dense_weight=dense_weight,
                sparse_weight=sparse_weight,
                final_top_k=final_top_k,
            )

            # -----------------------------------------------------
            # Retrieval diagnosis
            # -----------------------------------------------------

            retrieval_diagnosis = diagnose_retrieval(
                final_results
            )

            trace.add_stage(
                name="Retrieval Diagnosis",
                data=retrieval_diagnosis,
            )

            # -----------------------------------------------------
            # Generation
            # -----------------------------------------------------

            answer = self._generate(
                question,
                final_results,
            )

            # -----------------------------------------------------
            # Citation resolution
            # -----------------------------------------------------

            citations = build_structured_citations(
                answer,
                final_results,
            )

            trace.add_stage(
                name="Citation Resolution",
                data={
                    "citation_count": len(citations),
                    "resolved": sum(
                        1
                        for citation in citations
                        if citation.get("valid")
                    ),
                    "invalid": sum(
                        1
                        for citation in citations
                        if not citation.get("valid")
                    ),
                    "citations": [
                        {
                            "id": citation["id"],
                            "valid": citation["valid"],
                            "chunk_id": citation.get(
                                "chunk_id"
                            ),
                            "source": citation.get(
                                "source"
                            ),
                            "section": citation.get(
                                "section"
                            ),
                        }
                        for citation in citations
                    ],
                },
            )

            # -----------------------------------------------------
            # Grounding verification
            # -----------------------------------------------------

            grounding = verify_answer_grounding(
                answer,
                citations,
            )

            trace.add_stage(
                name="Answer Grounding",
                data=grounding,
            )

            trace.answer = answer

            return {
                "answer": answer,
                "citations": citations,
                "trace": serialize_trace(trace),
                "retrieved_chunks": final_results,
                "retrieval_diagnosis": retrieval_diagnosis,
                "grounding": grounding,
            }

        finally:
            clear_current_trace()