
import { BookOpen, CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueryResult } from "@/types/rag";
import { AnswerContent } from "@/features/rag/components/answer-content";
import { formatGroundingStatus } from "@/features/rag/format-grounding-status";

interface AnswerPanelProps {
  result: QueryResult;
}

export function AnswerPanel({ result }: AnswerPanelProps) {
  const grounding = result.grounding;

  const isGrounded =
    grounding.grounded === true || grounding.status === "grounded";

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/40 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-600" />
            <CardTitle className="text-[14px] tracking-[-0.02em]">Answer</CardTitle>
          </div>

          <Badge
            variant="outline"
            className={
              isGrounded
                ? "gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                : "gap-1 border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {isGrounded ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <TriangleAlert className="size-3.5" />
            )}
            {grounding.status ? formatGroundingStatus(grounding.status) : isGrounded ? "Grounded" : "Review evidence"}
          </Badge>
        </div>

        <CardDescription className="text-xs">
          Generated from the selected document&apos;s retrieved context.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <AnswerContent answer={result.answer} />

        {result.citations.length > 0 && (
          <section aria-label="Cited sources" className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="size-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sources</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">{result.citations.length} cited source{result.citations.length === 1 ? "" : "s"} from your documents</p>
              </div>
            </div>
            <ol className="space-y-2">
              {result.citations.map((citation) => (
                <li key={`${citation.id}-${String(citation.chunk_id ?? citation.source ?? "source")}`}>
                  <details className="group rounded-xl border border-slate-200 bg-white transition-colors open:border-indigo-200 open:bg-indigo-50/20">
                    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-3 outline-none hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[11px] font-semibold text-indigo-700">{citation.id}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-800">{citation.source ?? `Citation ${citation.id}`}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{[citation.section, citation.page != null ? `Page ${citation.page}` : null].filter(Boolean).join(" · ") || "Source passage"}</span>
                      </span>
                      <Badge variant="outline" className={citation.valid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{citation.valid ? "Verified" : "Unverified"}</Badge>
                    </summary>
                    {citation.text && <p className="border-t border-slate-100 px-3 py-3 text-xs leading-5 text-slate-600">{citation.text}</p>}
                  </details>
                </li>
              ))}
            </ol>
          </section>
        )}

        {result.citations.length === 0 && /【[^】]+】/.test(result.answer) && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            The answer includes source references that the backend did not resolve. Treat those references as unverified.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
          <span>
            {result.citations.length} citation
            {result.citations.length === 1 ? "" : "s"}
          </span>

          <span aria-hidden="true">·</span>

          <span>
            {result.retrieved_chunks.length} evidence chunks retrieved
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
