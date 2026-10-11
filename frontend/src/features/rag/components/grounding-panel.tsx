
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueryResult } from "@/types/rag";
import { formatGroundingStatus } from "@/features/rag/format-grounding-status";

interface GroundingPanelProps {
  result: QueryResult;
}

function formatCoverage(coverage: number): string {
  const percentage = coverage <= 1 ? coverage * 100 : coverage;
  return `${Math.round(percentage)}%`;
}

export function GroundingPanel({ result }: GroundingPanelProps) {
  const grounding = result.grounding;
  const verifiedCount = grounding.valid_citations?.length ?? result.citations.filter((citation) => citation.valid).length;
  const unverifiedCount = grounding.invalid_citations?.length ?? Math.max(0, result.citations.length - verifiedCount);
  const grounded = grounding.grounded === true || grounding.status === "grounded";

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          {grounded ? <CheckCircle2 className="size-4 text-emerald-600" /> : <TriangleAlert className="size-4 text-amber-600" />}
          <CardTitle className="text-[14px] tracking-[-0.02em]">Grounding &amp; citations</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Check whether the answer is supported by its cited sources.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <p className="text-[10px] text-slate-500">Grounding status</p>
            <p className={`mt-1 text-xs font-semibold ${grounded ? "text-emerald-700" : "text-amber-700"}`}>{formatGroundingStatus(grounding.status)}</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <p className="text-[10px] text-slate-500">Evidence coverage</p>
            <p className="mt-1 text-xs font-semibold text-slate-800">{typeof grounding.coverage === "number" ? formatCoverage(grounding.coverage) : "Unavailable"}</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <p className="text-[10px] text-slate-500">Citation check</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{verifiedCount} verified</Badge>
              {unverifiedCount > 0 && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{unverifiedCount} unverified</Badge>}
            </div>
          </div>
        </div>

        {grounding.diagnosis && <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">{grounding.diagnosis}</p>}
      </CardContent>
    </Card>
  );
}
