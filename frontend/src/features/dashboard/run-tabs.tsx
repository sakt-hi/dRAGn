"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquareText } from "lucide-react";
import type { InvestigationRun } from "@/lib/investigations/store";

interface RunTabsProps {
  runs: InvestigationRun[];
  activeRunId?: string;
  onSelectRun: (runId: string) => void;
}

export function RunTabs({ runs, activeRunId, onSelectRun }: RunTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const element = tabsRef.current;
    if (!element) return;

    const updateScrollState = () => {
      setCanScrollLeft(element.scrollLeft > 2);
      setCanScrollRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
    };

    updateScrollState();
    element.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [runs.length]);

  useEffect(() => {
    const activeTab = tabsRef.current?.querySelector<HTMLElement>("[aria-selected='true']");
    activeTab?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeRunId, runs.length]);

  function scrollTabs(direction: -1 | 1) {
    tabsRef.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {(canScrollLeft || canScrollRight) && (
        <button
          type="button"
          aria-label="Scroll to earlier runs"
          disabled={!canScrollLeft}
          onClick={() => scrollTabs(-1)}
          className="hidden size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-default disabled:opacity-30 sm:flex"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Runs in this investigation"
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onKeyDown={(event) => {
          if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
          const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']"));
          const currentTab = (event.target as HTMLElement).closest<HTMLButtonElement>("[role='tab']");
          const currentIndex = currentTab ? tabs.indexOf(currentTab) : -1;
          if (currentIndex < 0 || tabs.length === 0) return;
          event.preventDefault();
          const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
          tabs[nextIndex].focus();
          tabs[nextIndex].click();
        }}
      >
        {runs.map((run) => {
          const selected = (activeRunId ?? runs[runs.length - 1]?.id) === run.id;
          return (
            <button
              key={run.id}
              type="button"
              role="tab"
              id={`run-tab-${run.id}`}
              aria-selected={selected}
              aria-controls={`run-panel-${run.id}`}
              onClick={() => onSelectRun(run.id)}
              title={run.question}
              className={`flex h-9 max-w-[min(72vw,280px)] shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${selected ? "border-indigo-200 bg-indigo-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"}`}
            >
              <MessageSquareText className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{run.question}</span>
            </button>
          );
        })}
      </div>
      {(canScrollLeft || canScrollRight) && (
        <button
          type="button"
          aria-label="Scroll to later runs"
          disabled={!canScrollRight}
          onClick={() => scrollTabs(1)}
          className="hidden size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-default disabled:opacity-30 sm:flex"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
