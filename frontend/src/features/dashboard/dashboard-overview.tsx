"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DocumentGallery } from "@/features/documents/components/document-gallery";
import { DocumentPreviewDialog } from "@/features/documents/components/document-preview-dialog";
import { QueryPanel } from "@/features/rag/components/query-panel";
import { QueryResults } from "@/features/rag/components/query-results";
import { useDocuments } from "@/hooks/use-documents";
import type { DocumentItem } from "@/types/document";
import type { QueryResult } from "@/types/rag";

interface DashboardOverviewProps {
  initialDocumentId?: string;
}

export function DashboardOverview({ initialDocumentId }: DashboardOverviewProps) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null);
  const { data: documents = [], isPending, isError, error } = useDocuments();
  const router = useRouter();
  const selectedDocument = documents.find((document) => document.id === initialDocumentId);

  function chooseDocument(document: DocumentItem) {
    setPreviewDocument(null);
    setResult(null);
    router.replace(`/query?documentId=${encodeURIComponent(document.id)}`);
  }

  function startOver() {
    setResult(null);
    router.replace("/");
  }

  return (
    <div className="h-dvh overflow-hidden bg-[var(--background)] text-slate-900">
      <div className="flex h-full min-h-0">
        <AppSidebar />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden">
            <section aria-live="polite" className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 ${selectedDocument ? (result ? "pb-36" : "pb-48 sm:pb-40") : "pb-5"} sm:px-6 sm:pt-4 lg:px-8`}>
                {result ? (
                  <QueryResults result={result} selectedDocument={selectedDocument} />
                ) : selectedDocument ? (
                  <div className="flex min-h-[30vh] flex-col items-center justify-center px-3 py-8 sm:px-8">
                      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><FileText className="size-5" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Selected document</p>
                            <h2 className="mt-1 truncate text-sm font-semibold text-slate-900">{selectedDocument.title}</h2>
                            <p className="mt-0.5 text-[10px] text-slate-500">{selectedDocument.page_count ?? "—"} pages <span className="mx-1 text-slate-300">·</span> {selectedDocument.chunk_count ?? "—"} chunks</p>
                          </div>
                          <button type="button" onClick={startOver} className="min-h-9 shrink-0 rounded-lg px-2 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Choose another</button>
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <p className="text-xs font-medium text-slate-700">Your answer and retrieval trace will appear here</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">Write a question below or start with one of the suggested prompts.</p>
                        </div>
                      </div>
                  </div>
                ) : (
                  <DocumentGallery documents={documents} isPending={isPending} isError={isError} errorMessage={error?.message} onPreview={setPreviewDocument} onSelect={chooseDocument} />
                )}
            </section>
            {selectedDocument && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-background via-background/85 to-transparent backdrop-blur-[2px]" />}
            {selectedDocument && <QueryPanel selectedDocument={selectedDocument} hasResult={Boolean(result)} onResult={setResult} />}
          </main>
        </div>
      </div>
      {previewDocument && <DocumentPreviewDialog sourceDocument={previewDocument} onClose={() => setPreviewDocument(null)} onUse={chooseDocument} />}
    </div>
  );
}
