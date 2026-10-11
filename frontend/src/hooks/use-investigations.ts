"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvestigation, getInvestigations } from "@/lib/investigations/store";

export function useInvestigations() {
  return useQuery({
    queryKey: ["investigations"],
    queryFn: getInvestigations,
  });
}

export function useInvestigation(id?: string) {
  return useQuery({
    queryKey: ["investigation", id],
    queryFn: () => getInvestigation(id!),
    enabled: Boolean(id),
  });
}
