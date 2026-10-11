"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquareText, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

import { useInvestigations } from "@/hooks/use-investigations";
import { deleteInvestigation, renameInvestigation } from "@/lib/investigations/store";

interface InvestigationHistoryProps {
  activeId?: string;
  onNavigate?: () => void;
  className?: string;
}

export function InvestigationHistory({ activeId, onNavigate, className = "" }: InvestigationHistoryProps) {
  const { data: investigations = [], isPending, isError } = useInvestigations();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const openMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!openMenuId) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !openMenuRef.current?.contains(event.target)) {
        setOpenMenuId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  async function saveTitle(id: string) {
    try {
      await renameInvestigation(id, draftTitle);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["investigations"] }),
        queryClient.invalidateQueries({ queryKey: ["investigation", id] }),
      ]);
      setEditingId(null);
      setOpenMenuId(null);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not rename investigation.");
    }
  }

  async function removeInvestigation(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This removes its saved runs from this browser.`)) return;
    try {
      await deleteInvestigation(id);
      queryClient.removeQueries({ queryKey: ["investigation", id] });
      await queryClient.invalidateQueries({ queryKey: ["investigations"] });
      if (activeId === id) router.replace("/");
      onNavigate?.();
      setOpenMenuId(null);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete investigation.");
    }
  }

  return (
    <section aria-label="Saved investigations" className={className}>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recent investigations</p>
      {actionError && <p role="alert" className="mx-3 mb-2 rounded-lg bg-rose-500/10 px-2.5 py-2 text-[10px] leading-4 text-rose-200">{actionError}</p>}
      {isPending ? (
        <p className="px-3 py-2 text-[11px] text-slate-500">Loading history…</p>
      ) : isError ? (
        <p className="px-3 py-2 text-[11px] leading-5 text-slate-500">History is unavailable right now.</p>
      ) : investigations.length === 0 ? (
        <p className="px-3 py-2 text-[11px] leading-5 text-slate-500">Your completed queries will appear here.</p>
      ) : (
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
          {investigations.map((investigation) => {
            const active = investigation.id === activeId;
            const editing = investigation.id === editingId;
            const menuOpen = investigation.id === openMenuId;
            return (
              <div ref={menuOpen ? openMenuRef : undefined} key={investigation.id} className="group relative">
                {editing ? (
                  <form
                    className="flex items-center gap-1 rounded-lg bg-white/[0.06] p-1.5"
                    onSubmit={(event) => { event.preventDefault(); void saveTitle(investigation.id); }}
                  >
                    <input
                      autoFocus
                      aria-label="Investigation name"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      maxLength={100}
                      className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#0b1220] px-2 py-1.5 text-[11px] text-white outline-none focus:border-indigo-400"
                    />
                    <button type="submit" aria-label="Save investigation name" className="flex size-7 shrink-0 items-center justify-center rounded-md text-emerald-300 hover:bg-white/10"><Check className="size-3.5" /></button>
                    <button type="button" aria-label="Cancel rename" onClick={() => setEditingId(null)} className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/10"><X className="size-3.5" /></button>
                  </form>
                ) : (
                  <Link
                    href={`/query?investigationId=${encodeURIComponent(investigation.id)}`}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={`${investigation.title} · ${investigation.document_title}`}
                    className={`flex min-h-10 items-start gap-2.5 rounded-lg py-2 pl-3 pr-9 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${active ? "bg-indigo-500/15 text-indigo-200" : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"}`}
                  >
                    <MessageSquareText className={`mt-0.5 size-3.5 shrink-0 ${active ? "text-indigo-300" : "text-slate-500"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{investigation.title}</span>
                      <span className="mt-0.5 block truncate text-[9px] opacity-70">{investigation.document_title} · {investigation.run_count} {investigation.run_count === 1 ? "run" : "runs"}</span>
                    </span>
                  </Link>
                )}

                {!editing && (
                  <button
                    type="button"
                    aria-label={`Actions for ${investigation.title}`}
                    aria-expanded={menuOpen}
                    onClick={() => setOpenMenuId(menuOpen ? null : investigation.id)}
                    className={`absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 ${menuOpen ? "opacity-100" : "opacity-100 md:opacity-0"}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                )}

                {menuOpen && !editing && (
                  <div className="absolute right-1 top-9 z-40 w-40 rounded-xl border border-slate-700 bg-[#172235] p-1.5 shadow-xl shadow-black/30">
                    <button
                      type="button"
                      onClick={() => { setDraftTitle(investigation.title); setEditingId(investigation.id); setOpenMenuId(null); setActionError(null); }}
                      className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] text-slate-200 transition hover:bg-white/[0.08]"
                    >
                      <Pencil className="size-3.5 text-slate-400" /> Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeInvestigation(investigation.id, investigation.title)}
                      className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] text-rose-300 transition hover:bg-rose-500/10"
                    >
                      <Trash2 className="size-3.5" /> Delete investigation
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
