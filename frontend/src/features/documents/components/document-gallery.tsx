"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Code2,
  Dumbbell,
  Eye,
  FileText,
  Landmark,
  LoaderCircle,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import type { DocumentItem } from "@/types/document";

interface DocumentGalleryProps {
  documents: DocumentItem[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  onPreview: (document: DocumentItem) => void;
  onSelect: (document: DocumentItem) => void;
}

const documentStyles: Record<
  string,
  { icon: typeof BookOpen; tint: string; ink: string; wash: string; label: string }
> = {
  "Employee Handbook": { icon: BookOpen, tint: "bg-indigo-100", ink: "text-indigo-700", wash: "from-indigo-50 via-white to-white", label: "PEOPLE & POLICY" },
  "Health Insurance Policy": { icon: ShieldCheck, tint: "bg-teal-100", ink: "text-teal-700", wash: "from-teal-50 via-white to-white", label: "HEALTH & BENEFITS" },
  "Software Documentation": { icon: Code2, tint: "bg-sky-100", ink: "text-sky-700", wash: "from-sky-50 via-white to-white", label: "TECHNICAL GUIDE" },
  "Fitness Program Guide": { icon: Dumbbell, tint: "bg-orange-100", ink: "text-orange-700", wash: "from-orange-50 via-white to-white", label: "FITNESS & WELLNESS" },
  "CGRC Exam Notification 2026": { icon: Landmark, tint: "bg-rose-100", ink: "text-rose-700", wash: "from-rose-50 via-white to-white", label: "EXAM NOTIFICATION" },
  "Azure Documentation": { icon: Code2, tint: "bg-cyan-100", ink: "text-cyan-700", wash: "from-cyan-50 via-white to-white", label: "CLOUD DOCUMENTATION" },
};

const documentOrder = ["Employee Handbook", "Fitness Program Guide"];

function getDocumentStyle(document: DocumentItem) {
  return (
    documentStyles[document.title] ?? {
      icon: FileText,
      tint: "bg-slate-100",
      ink: "text-slate-700",
      wash: "from-slate-100 via-white to-white",
      label: document.document_type.toUpperCase(),
    }
  );
}

export function DocumentGallery({ documents, isPending, isError, errorMessage, onPreview, onSelect }: DocumentGalleryProps) {
  const [search, setSearch] = useState("");
  const [showColdStartNotice, setShowColdStartNotice] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setShowColdStartNotice(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setShowColdStartNotice(true), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [isPending]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...documents]
      .filter((document) =>
        !term || `${document.title} ${document.filename} ${document.description ?? ""}`.toLowerCase().includes(term),
      )
      .sort((a, b) => {
        const aPriority = documentOrder.indexOf(a.title);
        const bPriority = documentOrder.indexOf(b.title);
        const aRank = aPriority === -1 ? documentOrder.length : aPriority;
        const bRank = bPriority === -1 ? documentOrder.length : bPriority;
        return aRank - bRank || a.title.localeCompare(b.title);
      });
  }, [documents, search]);

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Start an investigation</p>
          <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-2xl">Choose a source</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">Preview a document or select one to ask a question and inspect its RAG pipeline.</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              aria-label="Search documents"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents…"
              className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-[13px] shadow-sm shadow-slate-200/30 placeholder:text-slate-400 focus-visible:border-indigo-300 focus-visible:ring-indigo-500/20"
            />
          </div>
          <span aria-live="polite" className="hidden shrink-0 text-xs text-slate-500 sm:block">
            {isPending ? "Loading" : isError ? "Unavailable" : `${filteredDocuments.length} of ${documents.length}`}
          </span>
        </div>
      </div>

      {isPending && (
        <>
          {showColdStartNotice && (
            <div role="status" aria-live="polite" className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2.5 text-xs text-indigo-950">
              <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-indigo-600" />
              <div>
                <p className="font-semibold">Waking the demo server</p>
                <p className="mt-0.5 leading-5 text-indigo-800">The first response can take up to a minute while the server starts. Keep this page open.</p>
              </div>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[270px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        </>
      )}

      {isError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-medium">Couldn’t load available sources.</p>
          <p className="mt-1 text-rose-700">{errorMessage ?? "Please try again."}</p>
        </div>
      )}

      {!isPending && !isError && documents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileText className="mx-auto size-8 text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-800">No ready documents found</p>
          <p className="mt-1 text-sm text-slate-500">Check that the backend has seeded the demo corpus.</p>
        </div>
      )}

      {!isPending && !isError && documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Search className="mx-auto size-7 text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-800">No matching documents</p>
          <p className="mt-1 text-sm text-slate-500">Try another title or filename.</p>
        </div>
      )}

      {!isPending && !isError && filteredDocuments.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredDocuments.map((document) => {
            const style = getDocumentStyle(document);
            const Icon = style.icon;
            return (
              <article
                key={document.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_14px_35px_rgba(36,46,87,0.10)] focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15"
              >
                <div className={`relative flex h-16 items-center justify-between overflow-hidden bg-gradient-to-br ${style.wash} px-4`}>
                  <span className={`flex size-10 items-center justify-center rounded-xl ${style.tint} ${style.ink} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                    <Icon className="size-5" />
                  </span>
                  <span className={`max-w-[65%] truncate text-[9px] font-semibold tracking-[0.13em] ${style.ink}`}>
                    {style.label}
                  </span>
                  <span className="pointer-events-none absolute -bottom-12 right-8 size-28 rounded-full border border-white/70" />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex-1">
                    <h3 className="truncate text-sm font-semibold tracking-[-0.02em] text-slate-900" title={document.title}>
                      {document.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 min-h-10 text-[12px] leading-5 text-slate-500">
                      {document.description ?? document.filename}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium uppercase tracking-wide text-slate-600">{document.document_type}</span>
                      <span>{document.page_count ?? "—"} pages</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{document.chunk_count ?? "—"} chunks</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => onPreview(document)}
                      className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-3"
                    >
                      <Eye className="size-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelect(document)}
                      className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200/70 transition-all hover:bg-indigo-700 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-3"
                    >
                      <Check className="size-3.5" />
                      Use document
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
