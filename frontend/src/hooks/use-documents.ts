
"use client";

import { getDocuments } from "@/lib/api/documents";
import { useQuery } from "@tanstack/react-query";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });
}
