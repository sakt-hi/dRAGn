
import { FileSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueryResult } from "@/types/rag";

interface EvidencePanelProps {
  result: QueryResult;
}

export function EvidencePanel({ result }: EvidencePanelProps) {
  const chunks = result.retrieved_chunks;

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <FileSearch className="size-4 text-violet-600" />
          <CardTitle className="text-[14px] tracking-[-0.02em]">
            Retrieved evidence ({chunks.length})
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Inspect the ranked chunks returned by hybrid retrieval.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-5">
        {chunks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No retrieved chunks were returned.
          </p>
        ) : (
          chunks.map((item, index) => {
            const chunk = item.chunk;
            const text =
              typeof chunk?.text === "string"
                ? chunk.text
                : typeof item.text === "string"
                  ? item.text
                  : "Evidence text unavailable.";

            return (
              <details
                key={`${String(item.source ?? "source")}-${String(item.chunk_id ?? index)}`}
                className="group rounded-xl border border-slate-200 bg-white transition-all open:border-indigo-200 open:shadow-[0_4px_18px_rgba(79,70,229,0.07)]"
              >
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 rounded-xl p-4 outline-none transition-colors hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
                  <Badge variant="outline">
                    Final rank #{item.final_rank ?? index + 1}
                  </Badge>

                  {typeof item.rrf_score === "number" && (
                    <Badge variant="secondary">
                      RRF {item.rrf_score.toFixed(5)}
                    </Badge>
                  )}

                  {item.dense_rank != null && (
                    <Badge variant="outline">Dense #{item.dense_rank}</Badge>
                  )}

                  {item.bm25_rank != null && (
                    <Badge variant="outline">BM25 #{item.bm25_rank}</Badge>
                  )}

                  <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                    {String(item.source ?? "Unknown source")}
                  </span>

                  {item.page != null && (
                    <span className="text-xs text-slate-500">
                      Page {item.page}
                    </span>
                  )}
                </summary>

                <div className="border-t border-slate-100 px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {text}
                  </p>
                </div>
              </details>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
