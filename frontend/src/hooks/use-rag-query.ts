
"use client";

import { useMutation } from "@tanstack/react-query";
import { executeRAGQuery } from "@/lib/api/queries";

export function useRAGQuery() {
  return useMutation({
    mutationFn: executeRAGQuery,
  });
}
