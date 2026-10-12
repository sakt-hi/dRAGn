"use client";

import { useState } from "react";
import {
  Activity,
  ChevronsDownUp,
  ChevronRight,
  ChevronsUpDown,
  FileSearch,
  GitBranch,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnswerPanel } from "@/features/rag/components/answer-panel";
import { EvidencePanel } from "@/features/rag/components/evidence-panel";
import { GroundingPanel } from "@/features/rag/components/grounding-panel";
import { RetrievalDiagnosisPanel } from "@/features/rag/components/retrieval-diagnosis";
import type { QueryResult } from "@/types/rag";

type ResultTab = "evidence" | "grounding" | "diagnosis" | "trace";

interface QueryResultsProps {
  result: QueryResult;
  createdAt?: string;
}

function formatQuestionTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const localDayNumber = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86_400_000;
  const dayDifference = localDayNumber(now) - localDayNumber(date);
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (dayDifference === 0) return `Today · ${time}`;
  if (dayDifference === 1) return `Yesterday · ${time}`;

  const localizedDate = date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return `${localizedDate} · ${time}`;
}

function PipelineTracePanel({ result }: { result: QueryResult }) {
  const stages = result.trace.stages;
  const [expandedStages, setExpandedStages] = useState<Set<number>>(() => new Set());
  const allExpanded = stages.length > 0 && expandedStages.size === stages.length;

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-violet-600" />
          <CardTitle className="text-[14px] tracking-[-0.02em]">Pipeline trace</CardTitle>
          <span className="ml-auto rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-violet-700">{stages.length} {stages.length === 1 ? "stage" : "stages"}</span>
        </div>
        <CardDescription className="text-xs">Follow the request through each step. Expand a stage to inspect its returned details.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {stages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
            <GitBranch className="mx-auto size-5 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700">No trace stages available</p>
            <p className="mt-1 text-xs text-slate-500">The API did not return pipeline details for this query.</p>
          </div>
        ) : (
          <>
          <div className="mb-3 flex justify-end gap-1">
            <button
              type="button"
              aria-label={allExpanded ? "Collapse all pipeline stages" : "Expand all pipeline stages"}
              onClick={() => setExpandedStages(allExpanded ? new Set() : new Set(stages.map((_, index) => index)))}
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {allExpanded ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>
          <ol className="relative space-y-2 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-slate-200">
            {stages.map((stage, index) => {
              const detailCount = Object.keys(stage.data ?? {}).length;
              return (
              <li key={`${stage.name}-${index}`} className="relative">
                <details
                  open={expandedStages.has(index)}
                  onToggle={(event) => {
                    const isOpen = event.currentTarget.open;
                    setExpandedStages((previous) => {
                      const next = new Set(previous);
                      if (isOpen) next.add(index);
                      else next.delete(index);
                      return next;
                    });
                  }}
                  className="group/stage overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors open:border-violet-200 open:bg-violet-50/10"
                >
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-3 py-2.5 outline-none transition hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:px-4 [&::-webkit-details-marker]:hidden">
                    <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-[10px] font-bold tabular-nums text-violet-700 shadow-sm">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800">{stage.name}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">{detailCount} {detailCount === 1 ? "detail" : "details"} returned</span>
                    </span>
                    <span className="hidden text-[10px] text-slate-400 sm:inline">{`Stage ${index + 1} of ${stages.length}`}</span>
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-400 transition-transform duration-200 group-open/stage:rotate-90" />
                  </summary>
                  <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
                    {detailCount > 0 ? (
                      <pre className="max-h-96 overflow-auto rounded-lg border border-slate-200/80 bg-white p-3 text-[11px] leading-5 text-slate-700 [scrollbar-width:thin]">{JSON.stringify(stage.data, null, 2)}</pre>
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-xs text-slate-500">This stage returned no additional details.</p>
                    )}
                  </div>
                </details>
              </li>
              );
            })}
          </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function QueryResults({ result, createdAt }: QueryResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("evidence");
  const tabs: { id: ResultTab; label: string; mobileLabel: string; count?: number; icon: typeof FileSearch }[] = [
    { id: "evidence", label: "Evidence", mobileLabel: "Evidence", count: result.retrieved_chunks.length, icon: FileSearch },
    { id: "grounding", label: "Grounding & citations", mobileLabel: "Grounding", count: result.citations.length, icon: ShieldCheck },
    { id: "diagnosis", label: "Diagnosis", mobileLabel: "Diagnosis", icon: Activity },
    { id: "trace", label: "Pipeline trace", mobileLabel: "Trace", icon: GitBranch },
  ];

  function renderActivePanel() {
    switch (activeTab) {
      case "evidence": return <EvidencePanel result={result} />;
      case "grounding": return <GroundingPanel result={result} />;
      case "diagnosis": return <RetrievalDiagnosisPanel diagnosis={result.retrieval_diagnosis} />;
      case "trace": return <PipelineTracePanel result={result} />;
    }
  }

  return (
    <section className="min-w-0">
      {result.trace.query.trim() && (
        <div className="mb-4 flex justify-end sm:mb-5">
          <div className="w-fit max-w-2xl rounded-2xl rounded-br-md border border-indigo-200/80 bg-indigo-100/70 px-3.5 py-3 sm:px-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-700">
              <MessageSquareText className="size-3.5" />
              <span>You asked</span>
            </div>
            <p className="whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-800 sm:text-sm sm:leading-6">{result.trace.query}</p>
            {createdAt && (
              <div className="mt-1.5 flex justify-end">
                <time dateTime={createdAt} className="text-[9px] text-slate-500">
                  {formatQuestionTimestamp(createdAt)}
                </time>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        <AnswerPanel result={result} />
        <div role="tablist" aria-label="Run inspection details" className="flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
          {tabs.map(({ id, label, mobileLabel, count, icon: Icon }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-label={label}
                id={`inspection-tab-${id}`}
                aria-selected={selected}
                aria-controls="inspection-panel"
                onClick={() => setActiveTab(id)}
                className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-2 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:gap-2 sm:px-3 sm:text-xs ${selected ? "border-b-indigo-600 text-indigo-700" : "border-b-transparent text-slate-500 hover:border-b-slate-300 hover:text-slate-800"}`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{label}</span>
                {count != null && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${selected ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>{count}</span>}
              </button>
            );
          })}
        </div>
        <div id="inspection-panel" role="tabpanel" tabIndex={0} aria-labelledby={`inspection-tab-${activeTab}`} className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          {renderActivePanel()}
        </div>
      </div>
    </section>
  );
}
