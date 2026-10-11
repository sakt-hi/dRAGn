"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bug, GitBranch, FlaskConical, ShieldCheck, Sparkles } from "lucide-react";

const navigation = [
  { label: "New investigation", href: "/", icon: Sparkles },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[252px] shrink-0 flex-col border-r border-white/10 bg-[#111827] px-4 py-5 text-slate-100 md:flex">
      <Link href="/" className="group mb-9 flex items-center gap-3 rounded-xl px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 text-white shadow-lg shadow-indigo-950/30 transition-transform group-hover:rotate-[-4deg]">
          <Bug className="size-[21px]" />
        </span>
        <span>
          <span className="block text-[17px] font-semibold tracking-[-0.04em] text-white">dRAGn</span>
          <span className="mt-0.5 block text-[11px] tracking-wide text-slate-400">RAG observability</span>
        </span>
      </Link>

      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Workspace
      </div>
      <nav aria-label="Main navigation" className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/"
            ? pathname === "/" || pathname.startsWith("/query")
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                active
                  ? "bg-indigo-500/15 font-medium text-indigo-200 shadow-[inset_2px_0_0_0_rgb(129,140,248)]"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
              }`}
            >
              <Icon className={`size-[17px] transition-colors ${active ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300"}`} />
              {item.label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-indigo-300" />}
            </Link>
          );
        })}
      </nav>

      <div className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Inspect
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-slate-500" aria-label="Query traces are available after running a query">
          <GitBranch className="size-[17px]" />
          Query traces
          <span className="ml-auto rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-500">IN QUERY</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-slate-600" aria-disabled="true">
          <FlaskConical className="size-[17px]" />
          Saved investigations
          <span className="ml-auto text-[10px] text-slate-600">SOON</span>
        </div>
      </div>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-200">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          Demo workspace
        </div>
        <p className="text-[11px] leading-[1.65] text-slate-400">
          Explore the sample corpus and inspect the evidence behind each answer.
        </p>
      </div>
    </aside>
  );
}
