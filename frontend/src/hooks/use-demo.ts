"use client";

import { useQuery } from "@tanstack/react-query";
import { getConversationFollowUps, getDemoQuestions } from "@/lib/api/demo";

export function useDemoQuestions(documentId?: string, conversationId?: string) {
  return useQuery({
    queryKey: conversationId
      ? ["demo-follow-ups", conversationId]
      : ["demo-questions", documentId],
    queryFn: () => conversationId
      ? getConversationFollowUps(conversationId)
      : getDemoQuestions(documentId!),
    enabled: Boolean(conversationId || documentId),
  });
}
