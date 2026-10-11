import { BookOpen, CheckCircle2, ChevronDown, CircleAlert, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGroundingStatus } from "@/features/rag/format-grounding-status";
import type { QueryResult } from "@/types/rag";

interface GroundingPanelProps {
  result: QueryResult;
}

function getCoveragePercent(coverage: number): number {
  return Math.max(0, Math.min(100, Math.round(coverage <= 1 ? coverage * 100 : coverage)));
}

export function GroundingPanel({ result }: GroundingPanelProps) {
  const grounding = result.grounding;
  const verifiedCount = grounding.valid_citations?.length ?? result.citations.filter((citation) => citation.valid).length;
  const unverifiedCount = grounding.invalid_citations?.length ?? Math.max(0, result.citations.length - verifiedCount);
  const grounded = grounding.grounded === true || grounding.status === "grounded";
  const coverage = typeof grounding.coverage === "number" ? getCoveragePercent(grounding.coverage) : null;

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {grounded ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <CircleAlert className="size-4 shrink-0 text-amber-600" />}
            <CardTitle className="text-[14px] tracking-[-0.02em]">Grounding &amp; citations</CardTitle>
          </div>
          <Badge variant="outline" className={grounded ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}>
            {formatGroundingStatus(grounding.status)}
          </Badge>
        </div>
        <CardDescription className="text-xs">See how much of the answer is supported by verifiable source passages.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className={`rounded-xl border p-4 ${grounded ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`size-4 ${grounded ? "text-emerald-700" : "text-amber-700"}`} />
              <p className="text-xs font-semibold text-slate-800">Grounding assessment</p>
            </div>
            <p className={`mt-2 text-sm font-semibold ${grounded ? "text-emerald-800" : "text-amber-800"}`}>{formatGroundingStatus(grounding.status)}</p>
            {grounding.diagnosis && <p className="mt-1.5 text-[11px] leading-5 text-slate-600">{grounding.diagnosis}</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-800">Evidence coverage</p>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{coverage === null ? "Unavailable" : `${coverage}%`}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={coverage === null ? "Evidence coverage unavailable" : `Evidence coverage ${coverage}%`}>
              {coverage !== null && <div className={`h-full rounded-full transition-[width] ${grounded ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${coverage}%` }} />}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">{verifiedCount} verified</Badge>
              {unverifiedCount > 0 && <Badge variant="outline" className="border-amber-200 bg-white text-amber-700">{unverifiedCount} unverified</Badge>}
              {result.citations.length === 0 && <span className="text-[10px] text-slate-500">No citations returned</span>}
            </div>
          </div>
        </div>

        <section aria-label="Citation sources" className="border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-indigo-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Citations</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">{result.citations.length} cited {result.citations.length === 1 ? "source" : "sources"} in this answer</p>
            </div>
          </div>
          {result.citations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
              <BookOpen className="mx-auto size-5 text-slate-400" />
              <p className="mt-2 text-xs font-medium text-slate-700">No citations to inspect</p>
              <p className="mt-1 text-[11px] text-slate-500">This answer did not include source references.</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {result.citations.map((citation) => (
                <li key={`${citation.id}-${String(citation.chunk_id ?? citation.source ?? "source")}`}>
                  <details className="group/citation overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors open:border-indigo-200 open:bg-indigo-50/10">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 outline-none hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold tabular-nums text-indigo-700">{citation.id}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-800">{citation.source ?? `Citation ${citation.id}`}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{[citation.section, citation.page != null ? `Page ${citation.page}` : null, citation.chunk_id != null ? `Chunk ${citation.chunk_id}` : null].filter(Boolean).join(" · ") || "Source passage"}</span>
                      </span>
                      <Badge variant="outline" className={citation.valid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{citation.valid ? "Verified" : "Unverified"}</Badge>
                      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-slate-400 transition-transform group-open/citation:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
                      {citation.text ? <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">{citation.text}</p> : <p className="text-xs text-slate-500">Citation text is unavailable.</p>}
                      {citation.retrieval && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                        {citation.retrieval.dense_rank != null && <Badge variant="outline" className="text-[10px]">Dense #{citation.retrieval.dense_rank}</Badge>}
                        {citation.retrieval.bm25_rank != null && <Badge variant="outline" className="text-[10px]">BM25 #{citation.retrieval.bm25_rank}</Badge>}
                        {typeof citation.retrieval.rrf_score === "number" && <Badge variant="secondary" className="text-[10px]">RRF {citation.retrieval.rrf_score.toFixed(5)}</Badge>}
                        {citation.retrieval.decision && <Badge variant="outline" className="text-[10px]">{citation.retrieval.decision}</Badge>}
                      </div>}
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
