"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";

import { AppHeader, RunTabs } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DocumentGallery } from "@/features/documents/components/document-gallery";
import { DocumentPreviewDialog } from "@/features/documents/components/document-preview-dialog";
import { DemoQuestionPicker, type DemoRunContext } from "@/features/rag/components/demo-question-picker";
import { QueryResults } from "@/features/rag/components/query-results";
import { useDemoDocuments } from "@/hooks/use-documents";
import { useInvestigation } from "@/hooks/use-investigations";
import { saveInvestigationRun, type InvestigationRun } from "@/lib/investigations/store";
import type { DocumentItem } from "@/types/document";
import type { QueryResult } from "@/types/rag";

interface DashboardOverviewProps {
  initialDocumentId?: string;
  initialInvestigationId?: string;
}

export function DashboardOverview({ initialDocumentId, initialInvestigationId }: DashboardOverviewProps) {
  const [optimisticRuns, setOptimisticRuns] = useState<InvestigationRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [historySaveError, setHistorySaveError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null);
  const { data: documents = [], isPending, isError, error } = useDemoDocuments();
  const investigation = useInvestigation(initialInvestigationId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedDocumentId = initialInvestigationId ? investigation.data?.document_id : initialDocumentId;
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId);
  const savedRuns = investigation.data?.runs ?? [];
  const runs = [...savedRuns, ...optimisticRuns.filter((run) => !savedRuns.some((saved) => saved.id === run.id))];
  const selectedRun = runs.find((run) => run.id === activeRunId) ?? runs[runs.length - 1];

  function chooseDocument(document: DocumentItem) {
    if (!document.demo_ready) return;
    setPreviewDocument(null);
    router.replace(`/query?documentId=${encodeURIComponent(document.id)}`);
  }

  function startOver() {
    router.replace("/");
  }

  async function handleResult(result: QueryResult, context: DemoRunContext) {
    if (!selectedDocument) return;
    result.response_mode = "saved_demo";
    const run: InvestigationRun = {
      id: window.crypto.randomUUID(),
      question: result.trace.query,
      result,
      created_at: new Date().toISOString(),
      conversation_id: context.conversationId,
      turn_id: context.turnId,
      sample_question_id: context.sampleQuestionId,
      response_mode: "saved_demo",
    };
    setOptimisticRuns((current) => [...current, run]);
    setActiveRunId(run.id);
    setHistorySaveError(null);
    try {
      const investigationId = await saveInvestigationRun(selectedDocument, initialInvestigationId, run);
      void queryClient.invalidateQueries({ queryKey: ["investigations"] });
      void queryClient.invalidateQueries({ queryKey: ["investigation", investigationId] });
      if (!initialInvestigationId) {
        router.replace(`/query?investigationId=${encodeURIComponent(investigationId)}`, { scroll: false });
      }
    } catch {
      setHistorySaveError("This result is visible now, but could not be saved to this browser's history.");
    }
  }

  return (
    <div className="h-dvh overflow-hidden bg-[var(--background)] text-slate-900">
      <div className="flex h-full min-h-0">
        <AppSidebar activeInvestigationId={initialInvestigationId} />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader
            activeInvestigationId={initialInvestigationId}
            activeInvestigationTitle={investigation.data?.title}
          />
          <main className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden">
            <section aria-live="polite" className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 ${runs.length > 0 ? "pb-24" : "pb-5"} sm:px-6 sm:pt-4 lg:px-8`}>
                {runs.length > 0 ? (
                  <div className="space-y-4" aria-label="Investigation runs">
                    {selectedRun && (
                      <article role="tabpanel" tabIndex={0} id={`run-panel-${selectedRun.id}`} aria-labelledby={`run-tab-${selectedRun.id}`} aria-label={`Run ${runs.findIndex((run) => run.id === selectedRun.id) + 1}`} className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        {runs.length > 1 && (
                          <div className="mb-2 h-12">
                            <RunTabs runs={runs} activeRunId={selectedRun.id} onSelectRun={setActiveRunId} compact />
                          </div>
                        )}
                        <QueryResults result={selectedRun.result} createdAt={selectedRun.created_at} />
                      </article>
                    )}
                    {historySaveError && <p role="status" className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{historySaveError}</p>}
                  </div>
                ) : initialInvestigationId && investigation.isPending ? (
                  <div role="status" className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-slate-500">
                    <span className="size-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    Loading saved investigation…
                  </div>
                ) : initialInvestigationId && investigation.isError ? (
                  <div role="alert" className="mx-auto mt-10 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This saved investigation could not be loaded. It may belong to another browser workspace.</div>
                ) : selectedDocument ? (
                  <div className="mx-auto w-full max-w-6xl px-1 py-5 sm:px-4 sm:py-8">
                      <div className="mb-5 flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:mb-6 sm:px-4">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><FileText className="size-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800">{selectedDocument.title}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">{selectedDocument.page_count ?? "—"} pages <span className="mx-1 text-slate-300">·</span> {selectedDocument.chunk_count ?? "—"} chunks</p>
                        </div>
                        <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:inline-flex">Source</span>
                        <button type="button" onClick={startOver} className="min-h-9 shrink-0 rounded-lg px-2.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Choose another</button>
                      </div>
                      <DemoQuestionPicker
                        document={selectedDocument}
                        hasResult={false}
                        askedQuestionIds={[]}
                        onResult={handleResult}
                      />
                  </div>
                ) : (
                  <DocumentGallery documents={documents} isPending={isPending} isError={isError} errorMessage={error?.message} onPreview={setPreviewDocument} onSelect={chooseDocument} />
                )}
            </section>
            {selectedDocument && runs.length > 0 && (
              <DemoQuestionPicker
                document={selectedDocument}
                hasResult
                conversationId={selectedRun?.conversation_id}
                parentTurnId={selectedRun?.turn_id}
                askedQuestionIds={runs.map((run) => run.sample_question_id).filter((id): id is string => Boolean(id))}
                onResult={handleResult}
              />
            )}
          </main>
        </div>
      </div>
      {previewDocument && <DocumentPreviewDialog sourceDocument={previewDocument} onClose={() => setPreviewDocument(null)} onUse={chooseDocument} />}
    </div>
  );
}
