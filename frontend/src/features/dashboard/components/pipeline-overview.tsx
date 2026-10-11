
import {
  FileSearch,
  GitBranch,
  Layers3,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stages = [
  {
    name: "Query embedding",
    detail: "Vector representation",
    icon: Sparkles,
  },
  {
    name: "Dense retrieval",
    detail: "Semantic similarity",
    icon: Layers3,
  },
  {
    name: "BM25 retrieval",
    detail: "Keyword relevance",
    icon: FileSearch,
  },
  {
    name: "Rank fusion",
    detail: "Reciprocal rank fusion",
    icon: GitBranch,
  },
  {
    name: "Generation",
    detail: "Evidence-grounded answer",
    icon: Workflow,
  },
];

export function PipelineOverview() {
  return (
    <Card className="gap-0 border-slate-200/80 bg-white py-0 shadow-none">
      <CardHeader className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Pipeline overview</CardTitle>
            <CardDescription className="mt-1">
              The path your question follows.
            </CardDescription>
          </div>
          <Workflow className="size-5 text-slate-400" />
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="space-y-0">
          {stages.map((stage, index) => {
            const Icon = stage.icon;

            return (
              <div
                key={stage.name}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                {index !== stages.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-slate-200" />
                )}

                <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium">{stage.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {stage.detail}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="ml-auto h-5 shrink-0 text-[10px] text-slate-500"
                >
                  Ready
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 p-3">
          <p className="text-xs leading-5 text-slate-500">
            Run a query to inspect real retrieval scores, evidence, citations,
            and grounding results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
