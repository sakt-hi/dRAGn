"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Menu, MessageSquareText, SquarePen, X } from "lucide-react";
import { InvestigationHistory } from "@/features/investigations/components/investigation-history";
import type { InvestigationRun } from "@/lib/investigations/store";

interface AppHeaderProps {
  activeInvestigationId?: string;
  activeInvestigationTitle?: string;
}

function formatRunAge(timestamp: string): string {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (elapsedSeconds < 60) return "just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 2592000) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return `${Math.floor(elapsedSeconds / 2592000)}mo ago`;
}

export function RunTabs({ runs, activeRunId, onSelectRun, compact = false }: { runs: InvestigationRun[]; activeRunId?: string; onSelectRun?: (runId: string) => void; compact?: boolean }) {
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
    tabsRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  }

  return (
    <div className={`flex h-full min-w-0 items-center gap-1.5 ${compact ? "justify-start" : "justify-end"}`}>
      {(canScrollLeft || canScrollRight) && (
        <button type="button" aria-label="Scroll to earlier runs" disabled={!canScrollLeft} onClick={() => scrollTabs(-1)} className={`${compact ? "hidden md:flex" : "flex"} size-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-indigo-700 disabled:cursor-default disabled:opacity-30`}>
          <ChevronLeft className="size-4" />
        </button>
      )}
      <div
        ref={tabsRef}
        className={`flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${compact ? "py-1" : "border-b border-slate-200 sm:gap-4"}`}
        role="tablist"
        aria-label="Runs in this investigation"
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
        {runs.map((run, index) => {
          const selected = (activeRunId ?? runs[runs.length - 1].id) === run.id;
          return (
            <button
              key={run.id}
              type="button"
              role="tab"
              id={`run-tab-${run.id}`}
              aria-selected={selected}
              aria-label={`Run ${index + 1}: ${run.question}`}
              aria-controls={`run-panel-${run.id}`}
              onClick={() => onSelectRun?.(run.id)}
              title={run.question}
              className={compact
                ? `flex h-9 max-w-[240px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-left text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${selected ? "border-indigo-600 bg-indigo-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"}`
                : `relative flex h-full min-h-[48px] min-w-[122px] max-w-[240px] shrink-0 cursor-pointer flex-col items-start justify-center border-b-2 border-x-0 border-t-0 bg-transparent px-1.5 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:min-w-[160px] sm:px-2 ${selected ? "border-b-indigo-600" : "border-b-transparent hover:border-b-slate-300"}`}
            >
              {compact ? (
                <>
                  <MessageSquareText aria-hidden="true" className={`size-3.5 shrink-0 ${selected ? "text-indigo-100" : "text-slate-400"}`} />
                  <span className="min-w-0 truncate">{run.question || `Run ${index + 1}`}</span>
                </>
              ) : (
                <>
                  <span className={`w-full truncate text-[10px] font-semibold sm:text-[11px] ${selected ? "text-indigo-700" : "text-slate-600"}`}>Run {index + 1} · {run.question}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-400 sm:text-[10px]">
                {selected && <><span className="size-1.5 rounded-full bg-teal-500" /><span className="font-medium text-teal-700">Current</span><span aria-hidden="true">·</span></>}
                {formatRunAge(run.created_at)}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {(canScrollLeft || canScrollRight) && (
        <button type="button" aria-label="Scroll to later runs" disabled={!canScrollRight} onClick={() => scrollTabs(1)} className={`${compact ? "hidden md:flex" : "flex"} size-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-indigo-700 disabled:cursor-default disabled:opacity-30`}>
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}

export function AppHeader({ activeInvestigationId, activeInvestigationTitle }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = activeInvestigationTitle ?? (activeInvestigationId ? "Investigation" : "Start investigation");

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[56px] items-center gap-0 px-1 md:hidden">
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/" aria-label="dRAGn home" className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <Image src="/dragn-icon.svg" alt="" width={32} height={32} priority className="size-8" />
          </Link>
          <span className="shrink-0 text-sm font-semibold tracking-[-0.04em] text-slate-900">dRAGn</span>
        </div>
        <Link
          href="/"
          aria-label="Start a new investigation"
          title="Start a new investigation"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <SquarePen className="size-[18px]" />
        </Link>
      </div>
      <div className="hidden min-h-[72px] items-center px-5 md:flex lg:px-8">
        <div className="flex h-6 min-w-0 items-center">
          <span className="truncate text-sm font-semibold text-slate-800" title={title}>{title}</span>
        </div>
      </div>

      {menuOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden" id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 z-0 bg-slate-950/40 backdrop-blur-[2px]" />
          <nav aria-label="Main navigation" className="absolute inset-y-0 left-0 z-10 flex w-[min(84vw,320px)] flex-col border-r border-slate-200 bg-white px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1rem)] shadow-2xl shadow-slate-950/20">
            <div className="mb-8 flex items-center gap-3">
              <Image src="/dragn-icon.svg" alt="" width={40} height={40} className="size-10" />
              <span className="flex-1 text-base font-semibold tracking-[-0.04em] text-slate-900">dRAGn</span>
              <button type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><X className="size-5" /></button>
            </div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Workspace</p>
            <Link href="/" onClick={() => setMenuOpen(false)} aria-current={!activeInvestigationId ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${!activeInvestigationId ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <SquarePen className="size-4" />
              Start investigation
            </Link>
            <InvestigationHistory activeId={activeInvestigationId} onNavigate={() => setMenuOpen(false)} className="mt-7 flex min-h-0 flex-1 flex-col overflow-hidden text-slate-800 [&>p]:text-slate-400 [&_a]:text-slate-600 [&_a:hover]:text-slate-900 [&_a[aria-current=page]]:bg-indigo-50 [&_a[aria-current=page]]:text-indigo-700 [&_a[aria-current=page]_svg]:text-indigo-600" />
          </nav>
        </div>,
        document.body,
      )}
    </header>
  );
}
