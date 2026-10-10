import time
from app.tracing.models import RAGTrace

class Tracer:
    def __init__(self, query:str):
        self.trace = RAGTrace(query=query)

    def start(self):
        return time.perf_counter()

    def finish(self, stage_name:str, start_time:float, data:dict | None = None, status:str = "completed"):
        latency_ms = (time.perf_counter() - start_time) * 1000
        self.trace.add_stage(name=stage_name, latency_ms=latency_ms, status=status, data=data)
        return self.trace

    def set_answer(self, answer:str):
        self.trace.answer = answer

    def get_trace(self):
        return self.trace