"use client";

import { useState } from "react";
import { ChevronDown, LoaderCircle, SlidersHorizontal, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRAGQuery } from "@/hooks/use-rag-query";
import type { DocumentItem } from "@/types/document";
import type { QueryResult } from "@/types/rag";

interface QueryPanelProps {
  selectedDocument?: DocumentItem;
  hasResult: boolean;
  onResult: (result: QueryResult | null) => void;
}

const questionSuggestions = [
  "Summarize the key points",
  "Find important requirements",
  "Explain a specific section",
];

export function QueryPanel({ selectedDocument, hasResult, onResult }: QueryPanelProps) {
  const [question, setQuestion] = useState("");
  const queryMutation = useRAGQuery();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!selectedDocument || !trimmedQuestion || queryMutation.isPending) return;

    onResult(null);
    queryMutation.mutate(
      { document_id: selectedDocument.id, question: trimmedQuestion },
      { onSuccess: (result) => { setQuestion(""); onResult(result); } },
    );
  }

  function handleQuestionKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section aria-label="Ask a question" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-5 lg:px-7">
      <div className="pointer-events-auto mx-auto w-full max-w-4xl">
        {selectedDocument && !hasResult && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 px-1 sm:gap-2">
            <span className="mr-1 text-[10px] font-medium text-slate-400">Try:</span>
            {questionSuggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuestion(`${suggestion} in ${selectedDocument.title}.`)} className="min-h-8 rounded-full border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-3">
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/90 bg-white/95 p-1.5 shadow-[0_8px_28px_rgba(24,35,70,0.08)] backdrop-blur-2xl transition focus-within:border-indigo-200/90 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 sm:p-2">
            <label htmlFor="question" className="sr-only">Question</label>
            <Textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder={selectedDocument ? (hasResult ? "Ask another question about this document…" : "Ask a question about this document…") : "Choose a document above to start asking questions…"}
              aria-describedby="query-hint"
              required
              disabled={!selectedDocument}
              className="min-h-[52px] resize-y border-0 bg-transparent px-2.5 py-1.5 text-[13px] leading-5 shadow-none placeholder:text-slate-400 focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent sm:min-h-[56px]"
            />
            {queryMutation.isError && (
              <div role="alert" className="mx-2 mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                <span className="font-semibold">Query failed:</span> {queryMutation.error.message}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-1 pt-2">
              <div className="flex min-w-0 items-center gap-2">
                <details className="group relative">
                  <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                    <SlidersHorizontal className="size-3.5" />
                    <span>Retrieval settings</span>
                    <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="absolute bottom-11 left-0 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
                    <p className="text-xs font-semibold text-slate-800">Backend defaults</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">Retrieval configuration is managed by the current API. Results use the configured dense, BM25, and RRF pipeline.</p>
                  </div>
                </details>
                <span id="query-hint" className="hidden text-[10px] text-slate-400 sm:inline">Answers use retrieved passages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-1 font-mono text-[9px] text-slate-400 sm:inline">Ctrl / ⌘ Enter</span>
                <Button
                  type="submit"
                  disabled={!selectedDocument || !question.trim() || queryMutation.isPending}
                  className="h-9 min-w-[104px] gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm shadow-indigo-200/70 transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200/70 focus-visible:ring-indigo-500 active:translate-y-px disabled:shadow-none"
                >
                  {queryMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {queryMutation.isPending ? "Running…" : "Run query"}
                </Button>
              </div>
            </div>
        </form>
      </div>
    </section>
  );
}
