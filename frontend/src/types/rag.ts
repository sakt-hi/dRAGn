
export interface RetrievalConfig {
  dense_top_k?: number;
  sparse_top_k?: number;
  final_top_k?: number;
  rrf_k?: number;
  dense_weight?: number;
  sparse_weight?: number;
}

export interface QueryRequest {
  document_id: string;
  question: string;
  retrieval?: RetrievalConfig;
}

export interface Citation {
  id: number;
  valid: boolean;
  source?: string;
  page?: number | null;
  section?: string | null;
  chunk_id?: number | string;
  text?: string;
  retrieval?: {
    dense_rank?: number | null;
    dense_score?: number | null;
    bm25_rank?: number | null;
    bm25_score?: number | null;
    rrf_score?: number | null;
    decision?: string | null;
  };
}

export interface RetrievedChunk {
  final_rank?: number;
  chunk_id?: number | string;
  source?: string;
  page?: number | null;
  section?: string | null;
  rrf_score?: number;
  dense_rank?: number | null;
  dense_score?: number | null;
  dense_contribution?: number | null;
  bm25_rank?: number | null;
  bm25_score?: number | null;
  bm25_contribution?: number | null;
  retrieval_decision?: string;
  chunk?: {
    text?: string;
    [key: string]: unknown;
  };
  text?: string;
  [key: string]: unknown;
}

export interface TraceStage {
  name: string;
  data: Record<string, unknown>;
}

export interface RAGTrace {
  query: string;
  answer: string;
  stages: TraceStage[];
}

export interface RetrievalDiagnosis {
  health?: string;
  confidence?: string;
  agreement_score?: number;
  dominant_signal?: string;
  primary_chunk?: number;
  diagnosis?: string;
  [key: string]: unknown;
}

export interface GroundingResult {
  grounded?: boolean;
  status?: string;
  coverage?: number;
  citation_count?: number;
  valid_citations?: Array<{
    id: number;
    source: string;
    section?: string | null;
    chunk_id: number | string;
  }>;
  invalid_citations?: Array<{ id: number }>;
  diagnosis?: string;
  [key: string]: unknown;
}

export interface QueryResult {
  answer: string;
  citations: Citation[];
  trace: RAGTrace;
  retrieved_chunks: RetrievedChunk[];
  retrieval_diagnosis: RetrievalDiagnosis;
  grounding: GroundingResult;
  response_mode?: "saved_demo" | "live";
}

export interface DemoQuestion {
  id: string;
  question: string;
  category: string;
  sort_order: number;
  available: boolean;
}

export interface DemoTurn {
  id: string;
  turn_number: number;
  sample_question_id: string;
  question: string;
  answer: string;
  response_mode: "saved";
  saved_result_id: string;
  result: QueryResult;
  created_at: string;
}

export interface DemoConversation {
  id: string;
  document_id: string;
  initial_sample_question_id: string;
  turns: DemoTurn[];
  created_at: string;
}

export interface DemoQueryResponse {
  query_id: string;
  sample_question_id: string;
  document_id: string;
  response_mode: "saved_demo";
  result: QueryResult;
}
