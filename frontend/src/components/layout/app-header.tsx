"use client";

import { useState } from "react";
import Link from "next/link";
import { Bug, Menu, Sparkles, X } from "lucide-react";

const pages = [
  { href: "/", label: "New investigation", icon: Sparkles },
];

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = "New investigation";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex h-[60px] items-center justify-between px-4 sm:h-[64px] sm:px-6 lg:px-8">
        <div className="hidden items-center gap-2 text-[13px] md:flex">
          <span className="text-slate-400">Workspace</span>
          <span className="text-slate-300">/</span>
          <span className="truncate font-medium text-slate-800">{title}</span>
        </div>

        <div className="flex min-w-0 items-center gap-2.5 md:hidden">
          <Link href="/" aria-label="dRAGn home" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-200">
              <Bug className="size-[17px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.04em] text-slate-950">dRAGn</span>
          </Link>
          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-slate-200" />
          <span className="truncate text-xs font-medium text-slate-600">{title}</span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            <span className="size-1.5 rounded-full bg-teal-500" />
            Demo corpus
          </span>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Main navigation" className="border-t border-slate-100 bg-white px-3 py-2.5 shadow-lg shadow-slate-900/5 md:hidden">
          <p className="px-3 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">Workspace</p>
          <div className="space-y-1">
            {pages.map((page) => {
              const Icon = page.icon;

              return (
                <Link
                  key={page.href}
                  href={page.href}
                  aria-current="page"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-xl bg-indigo-50 px-3 text-[13px] font-medium text-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Icon className="size-4" />
                  {page.label}
                  <span className="ml-auto size-1.5 rounded-full bg-indigo-600" />
                </Link>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 px-3 pt-2.5 text-[10px] text-slate-500">
            <span className="size-1.5 rounded-full bg-teal-500" /> Demo corpus
          </div>
        </nav>
      )}
    </header>
  );
}
