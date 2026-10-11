
import { Card, CardContent } from "@/components/ui/card";

interface MetricsGridProps {
  documentCount: number;
  chunkCount: number;
}

export function MetricsGrid({
  documentCount,
  chunkCount,
}: MetricsGridProps) {
  const metrics = [
    {
      label: "Demo documents",
      value: String(documentCount).padStart(2, "0"),
      note: "Available in workspace",
    },
    {
      label: "Indexed chunks",
      value: chunkCount.toLocaleString(),
      note: "Across the demo corpus",
    },
    {
      label: "Retrieval methods",
      value: "02",
      note: "Dense + BM25",
    },
    {
      label: "Pipeline stages",
      value: "10",
      note: "Inspectable trace stages",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card
          key={metric.label}
          className="gap-3 border-slate-200/80 bg-white shadow-none"
        >
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">{metric.label}</p>

            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {metric.value}
            </div>

            <p className="mt-1 text-xs text-slate-400">{metric.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
