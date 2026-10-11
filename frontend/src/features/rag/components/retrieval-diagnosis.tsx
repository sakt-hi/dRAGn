
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Gauge,
  GitCompareArrows,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RetrievalDiagnosis } from "@/types/rag";

interface RetrievalDiagnosisProps {
  diagnosis: RetrievalDiagnosis;
}

export function RetrievalDiagnosisPanel({
  diagnosis,
}: RetrievalDiagnosisProps) {
  const health = diagnosis.health ?? "Unknown";
  const confidence = diagnosis.confidence ?? "Unknown";
  const agreement = diagnosis.agreement_score;
  const agreementPercent =
    typeof agreement === "number"
      ? Math.round(agreement <= 1 ? agreement * 100 : agreement)
      : null;

  const healthy =
    /healthy|good|high|strong/i.test(health);

  const metrics = [
    {
      label: "Retrieval health",
      value: health,
      icon: Activity,
    },
    {
      label: "Confidence",
      value: confidence,
      icon: Gauge,
    },
    {
      label: "Dense / BM25 agreement",
      value: agreementPercent === null ? "Unavailable" : `${agreementPercent}%`,
      icon: GitCompareArrows,
    },
    {
      label: "Dominant signal",
      value: diagnosis.dominant_signal ?? "Unavailable",
      icon: Activity,
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 bg-white py-0 shadow-[0_8px_30px_rgba(24,35,70,0.045)]">
      <CardHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          {healthy ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : (
            <CircleAlert className="size-4 text-amber-600" />
          )}
          <CardTitle className="text-[14px] tracking-[-0.02em]">Retrieval diagnosis</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Signals that help explain the quality of retrieved evidence.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-200/90 bg-white p-3.5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon className="size-3.5" />
                  {metric.label}
                </div>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        {diagnosis.diagnosis && (
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Diagnostic explanation</p>
              <Badge variant="outline">Backend assessment</Badge>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {diagnosis.diagnosis}
            </p>
          </div>
        )}

        {diagnosis.primary_chunk != null && (
          <p className="text-xs text-slate-500">
            Primary evidence chunk: {diagnosis.primary_chunk}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
