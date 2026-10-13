"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Menu, SquarePen, X } from "lucide-react";
import { InvestigationHistory } from "@/features/investigations/components/investigation-history";

interface AppHeaderProps {
  activeInvestigationId?: string;
  activeInvestigationTitle?: string;
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
        <span className="min-w-0 truncate text-xs font-semibold text-slate-800 sm:text-sm" title={title}>{title}</span>
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
