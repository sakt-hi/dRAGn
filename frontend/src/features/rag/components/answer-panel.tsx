import { useState } from "react";
import { BookOpen, Check, CheckCircle2, Copy, FileSearch, Sparkles, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnswerContent } from "@/features/rag/components/answer-content";
import { formatGroundingStatus } from "@/features/rag/format-grounding-status";
import type { QueryResult } from "@/types/rag";

interface AnswerPanelProps {
  result: QueryResult;
}

export function AnswerPanel({ result }: AnswerPanelProps) {
  const [copied, setCopied] = useState(false);
  const grounding = result.grounding;
  const isGrounded = grounding.grounded === true || grounding.status === "grounded";
  const copyButton = (
    <button
      type="button"
      onClick={copyAnswer}
      aria-label={copied ? "Answer copied" : "Copy answer"}
      title={copied ? "Copied" : "Copy answer"}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
  const groundingBadge = (
    <Badge
      variant="outline"
      className={isGrounded ? "gap-1 border-emerald-200 bg-emerald-50 text-emerald-700" : "gap-1 border-amber-200 bg-amber-50 text-amber-800"}
    >
      {isGrounded ? <CheckCircle2 className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
      {grounding.status ? formatGroundingStatus(grounding.status) : isGrounded ? "Grounded" : "Review evidence"}
    </Badge>
  );

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access may be unavailable in insecure contexts; keep the answer usable.
    }
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white via-white to-indigo-50/50 px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3 sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center justify-between gap-1.5">
                <CardTitle className="text-[14px] tracking-[-0.02em]">Generated answer</CardTitle>
                <span className="sm:hidden">{copyButton}</span>
              </div>
              <CardDescription className="mt-1 text-xs">Synthesized from the retrieved passages for this run.</CardDescription>
              <div className="mt-2 sm:hidden">{groundingBadge}</div>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {copyButton}
            {groundingBadge}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="border-l-2 border-violet-200 pl-4 sm:pl-5">
          <AnswerContent answer={result.answer} />
        </div>

        {result.citations.length === 0 && /【[^】]+】/.test(result.answer) && (
          <p className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>The answer includes source references the backend did not resolve. Treat those references as unverified.</span>
          </p>
        )}

        <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-2.5">
            <BookOpen className="size-3.5 shrink-0 text-indigo-600" />
            <span className="text-[11px] font-medium text-slate-700">{result.citations.length} {result.citations.length === 1 ? "citation" : "citations"}</span>
            {result.citations.length > 0 && <span className="ml-auto text-[10px] text-slate-500">Open Grounding tab to inspect</span>}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-2.5">
            <FileSearch className="size-3.5 shrink-0 text-violet-600" />
            <span className="text-[11px] font-medium text-slate-700">{result.retrieved_chunks.length} evidence {result.retrieved_chunks.length === 1 ? "chunk" : "chunks"}</span>
            <span className="ml-auto text-[10px] text-slate-500">Retrieved for this run</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
