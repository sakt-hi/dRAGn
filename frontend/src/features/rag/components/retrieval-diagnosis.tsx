import { Activity, CheckCircle2, CircleAlert, Gauge, GitCompareArrows, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RetrievalDiagnosis } from "@/types/rag";

interface RetrievalDiagnosisProps {
  diagnosis: RetrievalDiagnosis;
}

export function RetrievalDiagnosisPanel({ diagnosis }: RetrievalDiagnosisProps) {
  const health = diagnosis.health ?? "Unavailable";
  const confidence = diagnosis.confidence ?? "Unavailable";
  const agreement = diagnosis.agreement_score;
  const agreementPercent = typeof agreement === "number" ? Math.max(0, Math.min(100, Math.round(agreement <= 1 ? agreement * 100 : agreement))) : null;
  const healthy = /healthy|good|high|strong/i.test(health);
  const unknownHealth = health === "Unavailable" || /unknown/i.test(health);

  const metrics = [
    { label: "Retrieval health", value: health, icon: healthy ? CheckCircle2 : CircleAlert, tone: healthy ? "text-emerald-700" : "text-amber-700" },
    { label: "Confidence", value: confidence, icon: Gauge, tone: "text-indigo-700" },
    { label: "Dominant signal", value: diagnosis.dominant_signal ?? "Unavailable", icon: Activity, tone: "text-violet-700" },
  ];

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {healthy ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <Activity className="size-4 shrink-0 text-violet-600" />}
            <CardTitle className="text-[14px] tracking-[-0.02em]">Retrieval diagnosis</CardTitle>
          </div>
          {!unknownHealth && <Badge variant="outline" className={healthy ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}>{health}</Badge>}
        </div>
        <CardDescription className="text-xs">Understand how the retrievers behaved and what influenced the final ranking.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500"><Icon className={`size-3.5 ${metric.tone}`} />{metric.label}</div>
                <p className={`mt-2 break-words text-sm font-semibold ${metric.value === "Unavailable" ? "text-slate-400" : "text-slate-800"}`}>{metric.value}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="size-4 text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Dense / BM25 agreement</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Overlap between semantic and keyword retrieval</p>
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-slate-900">{agreementPercent === null ? "Unavailable" : `${agreementPercent}%`}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={agreementPercent === null ? "Retriever agreement unavailable" : `Dense and BM25 agreement ${agreementPercent}%`}>
            {agreementPercent !== null && <div className="h-full rounded-full bg-indigo-500 transition-[width]" style={{ width: `${agreementPercent}%` }} />}
          </div>
        </div>

        {diagnosis.diagnosis ? (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-900"><Info className="size-3.5" />What the diagnosis means</div>
            <p className="text-xs leading-5 text-slate-700">{diagnosis.diagnosis}</p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500">No diagnostic explanation was returned for this run.</p>
        )}

        {diagnosis.primary_chunk != null && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">Primary evidence chunk</span>
            <Badge variant="secondary" className="tabular-nums">#{diagnosis.primary_chunk}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
