
import {
  GitBranch,
  MessageSquareText,
  FileText,
} from "lucide-react";

import { AnswerPanel } from "@/features/rag/components/answer-panel";
import { EvidencePanel } from "@/features/rag/components/evidence-panel";
import { GroundingPanel } from "@/features/rag/components/grounding-panel";
import { RetrievalDiagnosisPanel } from "@/features/rag/components/retrieval-diagnosis";
import type { QueryResult } from "@/types/rag";
import type { DocumentItem } from "@/types/document";

interface QueryResultsProps {
  result: QueryResult;
  selectedDocument?: DocumentItem;
}

export function QueryResults({ result, selectedDocument }: QueryResultsProps) {
  return (
    <section className="min-w-0">
      {result.trace.query.trim() && (
        <div className="mb-4 flex justify-end sm:mb-5">
          <div className="w-full max-w-2xl rounded-2xl rounded-br-md border border-indigo-200/80 bg-indigo-100/70 px-3.5 py-3 sm:px-4">
            <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2">
              <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-indigo-700">
                <MessageSquareText className="size-3.5" />
                <span>You asked</span>
              </div>
              {selectedDocument && (
                <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500">
                  <FileText className="size-3.5 shrink-0 text-indigo-500" />
                  <span className="truncate">{selectedDocument.title}</span>
                </div>
              )}
            </div>
            <p className="whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-800 sm:text-sm sm:leading-6">{result.trace.query}</p>
          </div>
        </div>
      )}
      <div className="space-y-4 sm:space-y-5">
        <AnswerPanel result={result} />
        <EvidencePanel result={result} />
        <GroundingPanel result={result} />
        <RetrievalDiagnosisPanel diagnosis={result.retrieval_diagnosis} />

        <details className="group rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
          <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 outline-none transition hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><GitBranch className="size-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">Pipeline trace</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">Inspect the {result.trace.stages.length} stages behind this answer</span>
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{result.trace.stages.length} stages</span>
            <span aria-hidden="true" className="ml-1 text-slate-400 transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-slate-100 p-3 sm:p-5">
            {result.trace.stages.length === 0 ? (
              <p className="text-sm text-slate-500">No pipeline stages were returned for this query.</p>
            ) : (
              <ol className="space-y-2">
                {result.trace.stages.map((stage, index) => (
                  <li key={`${stage.name}-${index}`} className="rounded-xl border border-slate-200 px-3 py-2.5 sm:px-4">
                    <details className="group/stage">
                      <summary className="cursor-pointer list-none text-xs font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                        <span className="mr-2 font-semibold text-violet-600">{String(index + 1).padStart(2, "0")}</span>{stage.name}
                      </summary>
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">{JSON.stringify(stage.data, null, 2)}</pre>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}
