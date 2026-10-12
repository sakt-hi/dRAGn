
"use client";

import { getDemoDocuments, getDocuments } from "@/lib/api/documents";
import { useQuery } from "@tanstack/react-query";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });
}

export function useDemoDocuments() {
  return useQuery({
    queryKey: ["demo-documents"],
    queryFn: getDemoDocuments,
  });
}
