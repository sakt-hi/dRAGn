
import { apiClient } from "@/lib/api/client";
import type { QueryRequest, QueryResult } from "@/types/rag";

export async function executeRAGQuery(
  request: QueryRequest,
): Promise<QueryResult> {
  const response = await apiClient.post<QueryResult>(
    "/api/query",
    request,
  );

  return response.data;
}
