from app.tracing.models import RAGTrace
from app.tracing.instrumentation import (
    set_current_trace,
    clear_current_trace,
    trace_stage,
)


@trace_stage("Test Stage")
def slow_function():
    import time
    time.sleep(0.1)

    return "hello"


def main():

    trace = RAGTrace(
        query="instrumentation test"
    )

    set_current_trace(trace)

    result = slow_function()

    clear_current_trace()

    print("Result:", result)

    print("\nTrace:")
    print(trace.to_dict())


if __name__ == "__main__":
    main()