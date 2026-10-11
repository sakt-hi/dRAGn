"use client";

import { useEffect } from "react";
import { Check, ExternalLink, FileText, X } from "lucide-react";

import { getDocumentPreviewSource } from "@/lib/documents/preview";
import type { DocumentItem } from "@/types/document";
import { MarkdownPreview } from "./markdown-preview";

interface DocumentPreviewDialogProps {
  sourceDocument: DocumentItem;
  onClose: () => void;
  onUse: (document: DocumentItem) => void;
}

export function DocumentPreviewDialog({ sourceDocument, onClose, onUse }: DocumentPreviewDialogProps) {
  const previewSource = getDocumentPreviewSource(sourceDocument);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="preview-title" className="flex h-dvh w-full flex-col overflow-hidden bg-white sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100vw-1.5rem)] sm:max-w-[1600px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 sm:gap-4 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><FileText className="size-[18px]" /></div>
            <div className="min-w-0 flex-1">
              <p className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-700 sm:block">Document preview</p>
              <h2 id="preview-title" className="truncate text-sm font-semibold tracking-[-0.03em] text-slate-950 sm:mt-0.5 sm:text-base">{sourceDocument.title}</h2>
              <div className="flex min-w-0 items-center gap-1.5 text-[9px] text-slate-500 sm:gap-2 sm:text-[11px]">
                <span className="hidden max-w-[12rem] truncate sm:inline" title={sourceDocument.filename}>{sourceDocument.filename}</span>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <span className="shrink-0 font-medium text-slate-700">{sourceDocument.document_type.toUpperCase()}</span>
                <span className="shrink-0">{sourceDocument.page_count ?? "—"} pages</span>
                <span className="shrink-0">{sourceDocument.chunk_count ?? "—"} chunks</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {previewSource && <a href={previewSource.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium text-indigo-700 transition-colors hover:bg-indigo-50 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:gap-1.5 sm:px-2 sm:text-xs"><span className="sm:hidden">Open</span><span className="hidden sm:inline">Open separately</span><ExternalLink className="size-3.5" /></a>}
            <button type="button" aria-label="Close preview" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><X className="size-[18px]" /></button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden bg-slate-100">
          {!previewSource ? (
            <div className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Preview is unavailable for this document.</div>
          ) : previewSource.format === "markdown" ? (
            <MarkdownPreview key={previewSource.url} url={previewSource.url} title={sourceDocument.title} />
          ) : previewSource.format === "pdf" || previewSource.format === "text" ? (
            <iframe key={previewSource.url} title={`Preview of ${sourceDocument.title}`} src={previewSource.url} className="h-full min-h-0 w-full border-0 bg-white" />
          ) : (
            <div className="m-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">This file format is not supported for preview yet.</div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-3 py-2.5 sm:px-5">
          <p className="hidden text-xs text-slate-500 sm:block">Ready to investigate this source?</p>
          <button type="button" onClick={() => onUse(sourceDocument)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:translate-y-px sm:w-auto sm:px-5 sm:text-[13px]"><Check className="size-4" />Use this document</button>
        </footer>
      </section>
    </div>
  );
}
