
import { apiClient } from "@/lib/api/client";
import type { DocumentItem } from "@/types/document";

export async function getDocuments(): Promise<DocumentItem[]> {
  const response = await apiClient.get<DocumentItem[]>("/api/documents");
  return response.data;
}