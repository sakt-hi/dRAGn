
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

function QueryPageContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") ?? undefined;

  return <DashboardOverview key={documentId ?? "no-document"} initialDocumentId={documentId} />;
}

export default function QueryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 text-sm text-slate-500">
          <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="size-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            Loading query workspace…
          </span>
        </div>
      }
    >
      <QueryPageContent />
    </Suspense>
  );
}
