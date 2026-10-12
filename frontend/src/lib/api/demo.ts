import { apiClient } from "@/lib/api/client";
import type { DemoConversation, DemoQuestion, DemoQueryResponse, DemoTurn } from "@/types/rag";

export async function getDemoQuestions(documentId: string): Promise<DemoQuestion[]> {
  const response = await apiClient.get<DemoQuestion[]>(`/api/demo/documents/${encodeURIComponent(documentId)}/questions`);
  return response.data;
}

export async function getConversationFollowUps(conversationId: string): Promise<DemoQuestion[]> {
  const response = await apiClient.get<DemoQuestion[]>(`/api/demo/conversations/${encodeURIComponent(conversationId)}/follow-ups`);
  return response.data;
}

export async function createDemoConversation(sampleQuestionId: string): Promise<DemoConversation> {
  const response = await apiClient.post<DemoConversation>("/api/demo/conversations", {
    sample_question_id: sampleQuestionId,
  });
  return response.data;
}

export async function addDemoTurn(
  conversationId: string,
  sampleQuestionId: string,
  parentTurnId: string,
): Promise<DemoTurn> {
  const response = await apiClient.post<DemoTurn>(
    `/api/demo/conversations/${encodeURIComponent(conversationId)}/turns`,
    { sample_question_id: sampleQuestionId, parent_turn_id: parentTurnId },
  );
  return response.data;
}

export async function getSavedDemoQuery(questionId: string): Promise<DemoQueryResponse> {
  const response = await apiClient.get<DemoQueryResponse>(`/api/demo/queries/${encodeURIComponent(questionId)}`);
  return response.data;
}
