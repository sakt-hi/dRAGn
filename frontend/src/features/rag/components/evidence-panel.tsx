import { useState } from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, FileSearch, Hash, Layers3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueryResult, RetrievedChunk } from "@/types/rag";

interface EvidencePanelProps {
  result: QueryResult;
}

function getChunkText(item: RetrievedChunk): string {
  if (typeof item.chunk?.text === "string") return item.chunk.text;
  if (typeof item.text === "string") return item.text;
  return "Evidence text unavailable.";
}

export function EvidencePanel({ result }: EvidencePanelProps) {
  const chunks = result.retrieved_chunks;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());
  const allExpanded = chunks.length > 0 && chunks.every((item, index) => expandedItems.has(`${String(item.source ?? "source")}-${String(item.chunk_id ?? index)}`));

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileSearch className="size-4 shrink-0 text-violet-600" />
            <CardTitle className="text-[14px] tracking-[-0.02em]">Retrieved evidence</CardTitle>
          </div>
          <Badge variant="secondary" className="tabular-nums">{chunks.length} {chunks.length === 1 ? "chunk" : "chunks"}</Badge>
        </div>
        <CardDescription className="text-xs">Ranked passages returned by dense and BM25 retrieval, combined with RRF.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-4 sm:p-5">
        {chunks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
            <FileSearch className="mx-auto size-5 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700">No evidence retrieved</p>
            <p className="mt-1 text-xs text-slate-500">The retrieval pipeline did not return any chunks for this question.</p>
          </div>
        ) : (
          <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-slate-500">Open a passage to inspect its full text and retrieval metadata.</p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={allExpanded ? "Collapse all evidence passages" : "Expand all evidence passages"}
                onClick={() => setExpandedItems(allExpanded ? new Set() : new Set(chunks.map((item, index) => `${String(item.source ?? "source")}-${String(item.chunk_id ?? index)}`)))}
                className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {allExpanded ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
                {allExpanded ? "Collapse all" : "Expand all"}
              </button>
            </div>
          </div>
          {chunks.map((item, index) => {
            const text = getChunkText(item);
            const rank = item.final_rank ?? index + 1;
            const itemKey = `${String(item.source ?? "source")}-${String(item.chunk_id ?? index)}`;
            const location = [item.source, item.section, item.page != null ? `Page ${item.page}` : null]
              .filter((part): part is string => Boolean(part))
              .join(" · ");

            return (
              <details
                key={itemKey}
                open={expandedItems.has(itemKey)}
                onToggle={(event) => {
                  const isOpen = event.currentTarget.open;
                  setExpandedItems((previous) => {
                    const next = new Set(previous);
                    if (isOpen) next.add(itemKey);
                    else next.delete(itemKey);
                    return next;
                  });
                }}
                className="group/evidence overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors open:border-indigo-200 open:bg-indigo-50/10"
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 p-3.5 outline-none transition hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold tabular-nums text-indigo-700">{rank}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800">Final rank #{rank}</span>
                      {typeof item.rrf_score === "number" && <Badge variant="secondary" className="h-5 bg-indigo-50 text-[10px] text-indigo-700">RRF {item.rrf_score.toFixed(5)}</Badge>}
                      {item.dense_rank != null && <Badge variant="outline" className="h-5 text-[10px]">Dense #{item.dense_rank}</Badge>}
                      {item.bm25_rank != null && <Badge variant="outline" className="h-5 text-[10px]">BM25 #{item.bm25_rank}</Badge>}
                    </span>
                    <span className="mt-1.5 block truncate text-[11px] text-slate-500">{location || "Source details unavailable"}</span>
                  </span>
                  <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 text-slate-400 transition-transform group-open/evidence:rotate-180" />
                </summary>

                <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-5">
                  <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-700 sm:text-sm">{text}</p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
                    {item.chunk_id != null && <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1"><Hash className="size-3" />Chunk {item.chunk_id}</span>}
                    {item.retrieval_decision && <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1"><Layers3 className="size-3" />{item.retrieval_decision}</span>}
                  </div>
                </div>
              </details>
            );
          })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
