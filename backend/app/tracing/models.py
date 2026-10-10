from dataclasses import dataclass, field
from typing import Any


@dataclass
class TraceStage:
    name: str
    status: str = "completed"
    latency_ms: float = 0.0
    data: dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        return {
            "name": self.name,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "data": self.data,
        }


@dataclass
class RAGTrace:
    query: str

    stages: list[TraceStage] = field(
        default_factory=list
    )

    answer: str | None = None

    total_latency_ms: float = 0.0

    def add_stage(
        self,
        name: str,
        latency_ms: float = 0.0,
        status: str = "completed",
        data: dict[str, Any] | None = None,
    ):

        stage = TraceStage(
            name=name,
            status=status,
            latency_ms=latency_ms,
            data=data or {},
        )

        self.stages.append(stage)

        self.total_latency_ms += latency_ms

        return stage

    def to_dict(self):

        return {
            "query": self.query,
            "answer": self.answer,
            "total_latency_ms": self.total_latency_ms,
            "stages": [
                stage.to_dict()
                for stage in self.stages
            ],
        }