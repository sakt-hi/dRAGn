"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, LoaderCircle, Search, Sparkles } from "lucide-react";

import { addDemoTurn, createDemoConversation } from "@/lib/api/demo";
import { useDemoQuestions } from "@/hooks/use-demo";
import type { DocumentItem } from "@/types/document";
import type { DemoQuestion, QueryResult } from "@/types/rag";

export interface DemoRunContext {
  conversationId: string;
  turnId: string;
  sampleQuestionId: string;
}

interface DemoQuestionPickerProps {
  document: DocumentItem;
  hasResult: boolean;
  conversationId?: string;
  parentTurnId?: string;
  askedQuestionIds: string[];
  onResult: (result: QueryResult, context: DemoRunContext) => void;
}

export function DemoQuestionPicker({
  document,
  hasResult,
  conversationId,
  parentTurnId,
  askedQuestionIds,
  onResult,
}: DemoQuestionPickerProps) {
  const [open, setOpen] = useState(!hasResult);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const questionsQuery = useDemoQuestions(document.id, hasResult ? conversationId : undefined);
  const asked = useMemo(() => new Set(askedQuestionIds), [askedQuestionIds]);
  const categories = useMemo(
    () => [...new Set((questionsQuery.data ?? []).map((question) => question.category))].sort(),
    [questionsQuery.data],
  );
  const questions = useMemo(() => {
    const items = questionsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    return [...items].filter((question) =>
      (category === "all" || question.category === category)
      && (!term || question.question.toLowerCase().includes(term)),
    ).sort((left, right) => {
      const leftAsked = asked.has(left.id);
      const rightAsked = asked.has(right.id);
      return Number(leftAsked) - Number(rightAsked) || left.sort_order - right.sort_order;
    });
  }, [asked, category, questionsQuery.data, search]);

  async function chooseQuestion(question: DemoQuestion) {
    if (!question.available || activeId) return;
    setActiveId(question.id);
    setErrorMessage(null);
    try {
      if (conversationId && parentTurnId) {
        const turn = await addDemoTurn(conversationId, question.id, parentTurnId);
        turn.result.response_mode = "saved_demo";
        onResult(turn.result, {
          conversationId,
          turnId: turn.id,
          sampleQuestionId: question.id,
        });
      } else {
        const conversation = await createDemoConversation(question.id);
        const turn = conversation.turns[0];
        turn.result.response_mode = "saved_demo";
        onResult(turn.result, {
          conversationId: conversation.id,
          turnId: turn.id,
          sampleQuestionId: question.id,
        });
      }
      setOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "This saved result could not be loaded.");
    } finally {
      setActiveId(null);
    }
  }

  const questionList = (
    <div className="space-y-3">
      {!questionsQuery.isPending && !questionsQuery.isError && (questionsQuery.data?.length ?? 0) > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a question…"
                aria-label="Search sample questions"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
              />
            </label>
            <span className="text-[10px] font-medium text-slate-500" aria-live="polite">
              {questions.length} of {questionsQuery.data?.length ?? 0} questions
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Filter questions by topic">
            {[{ value: "all", label: "All topics" }, ...categories.map((value) => ({ value, label: value }))].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                aria-pressed={category === item.value}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${category === item.value ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {questionsQuery.isPending ? (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <LoaderCircle className="size-4 animate-spin text-indigo-600" /> Loading saved questions…
        </div>
      ) : questionsQuery.isError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          Couldn’t load sample questions. {questionsQuery.error.message}
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
          {questionsQuery.data?.length ? "No questions match these filters. Try another topic or search term." : "No validated saved questions are available for this document yet. Arbitrary questions are not processed in saved-demo mode."}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {questions.map((question) => {
            const alreadyAsked = asked.has(question.id);
            const loading = activeId === question.id;
            const questionNumber = String(question.sort_order).padStart(2, "0");
            return (
              <button
                key={question.id}
                type="button"
                disabled={!question.available || Boolean(activeId)}
                onClick={() => void chooseQuestion(question)}
                className="group flex min-h-[82px] items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_8px_20px_rgba(36,46,87,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:hover:border-slate-200"
              >
                <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold tabular-nums ${alreadyAsked ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"}`}>
                  {loading ? <LoaderCircle className="size-4 animate-spin" /> : alreadyAsked ? <Check className="size-4" /> : questionNumber}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold leading-[1.35rem] text-slate-800 group-hover:text-indigo-800 group-disabled:text-slate-400">{question.question}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] uppercase tracking-wide text-slate-400">
                    <span>{question.category}</span>
                    {alreadyAsked && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 normal-case tracking-normal text-slate-500">Asked</span>}
                    {!question.available && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 normal-case tracking-normal text-amber-700">Trace unavailable</span>}
                  </span>
                </span>
                {question.available && <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
      {errorMessage && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{errorMessage}</p>}
    </div>
  );

  if (!hasResult) {
    return (
      <section aria-label="Saved demo questions" className="mt-6 space-y-3.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Question explorer</p>
            <h3 className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-900">What would you like to investigate?</h3>
            <p className="mt-1 text-xs text-slate-500">Pick a curated question to open its saved answer and complete RAG trace.</p>
          </div>
          {!questionsQuery.isPending && !questionsQuery.isError && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" /> {questionsQuery.data?.filter((question) => question.available).length ?? 0} validated
            </span>
          )}
        </div>
        {questionList}
      </section>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-5 lg:px-7">
      <div className="pointer-events-auto relative mx-auto flex w-full flex-col items-end">
        {open && (
          <section aria-label="Follow-up questions" className="mb-3 max-h-[min(52dvh,480px)] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_16px_60px_rgba(15,23,42,0.20)] backdrop-blur-md sm:p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Choose a follow-up</h3>
                <p className="mt-1 text-[11px] text-slate-500">Questions already asked are moved to the end. Responses use saved demo traces for {document.title}.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">Close</button>
            </div>
            {questionList}
          </section>
        )}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-indigo-600 px-5 text-xs font-semibold text-white shadow-lg shadow-indigo-300/60 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Sparkles className="size-4" /> {open ? "Hide questions" : "Ask a follow-up"}
        </button>
      </div>
    </div>
  );
}
