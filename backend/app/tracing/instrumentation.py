import time
from contextvars import ContextVar
from functools import wraps
from typing import Callable, Any

from app.tracing.models import RAGTrace


_current_trace: ContextVar[RAGTrace | None] = ContextVar(
    "current_trace",
    default=None,
)


def set_current_trace(trace: RAGTrace):
    _current_trace.set(trace)


def get_current_trace() -> RAGTrace | None:
    return _current_trace.get()


def clear_current_trace():
    _current_trace.set(None)


def trace_stage(
    stage_name: str,
    capture: Callable[[Any], dict] | None = None,
):
    """
    Automatically traces function execution.

    Records:
    - stage name
    - latency
    - success/failure
    - optional result metadata
    """

    def decorator(func: Callable):

        @wraps(func)
        def wrapper(*args, **kwargs):

            start = time.perf_counter()

            try:

                result = func(
                    *args,
                    **kwargs,
                )

                latency_ms = (
                    time.perf_counter() - start
                ) * 1000

                data = {}

                if capture:
                    try:
                        data = capture(result)
                    except Exception as capture_error:
                        data = {
                            "capture_error": str(
                                capture_error
                            )
                        }

                trace = get_current_trace()

                if trace:
                    trace.add_stage(
                        name=stage_name,
                        latency_ms=latency_ms,
                        status="completed",
                        data=data,
                    )

                return result

            except Exception as exc:

                latency_ms = (
                    time.perf_counter() - start
                ) * 1000

                trace = get_current_trace()

                if trace:
                    trace.add_stage(
                        name=stage_name,
                        latency_ms=latency_ms,
                        status="failed",
                        data={
                            "error": str(exc),
                            "error_type": type(exc).__name__,
                        },
                    )

                raise

        return wrapper

    return decorator