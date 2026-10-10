from app.rag.pipeline import RAGPipeline

def print_trace(trace):

    print("\n" + "=" * 80)
    print("dRAGn TRACE")
    print("=" * 80)

    print(f"\nQuery: {trace.query}\n")

    for stage in trace.stages:

        print(
            f"{stage.name:20} "
            f"{stage.latency_ms:8.2f} ms "
            f"[{stage.status}]"
        )

    print(
        f"\nTotal latency: "
        f"{trace.total_latency_ms:.2f} ms"
    )


def main():

    question = input(
        "\nAsk a question: "
    ).strip()

    if not question:
        raise ValueError(
            "Question cannot be empty"
        )

    pipeline = RAGPipeline()

    result = pipeline.ask(question)

    trace_json = result["trace"].to_dict()

    # ----------------------------------------
    # ANSWER
    # ----------------------------------------

    print("\n" + "=" * 80)
    print("ANSWER")
    print("=" * 80)

    print(result["answer"])

    # ----------------------------------------
    # TRACE
    # ----------------------------------------

    print_trace(
        result["trace"]
    )

    # ----------------------------------------
    # TRACE JSON
    # ----------------------------------------

    print("\n" + "=" * 80)
    print("TRACE JSON")
    print("=" * 80)

    print(trace_json)


if __name__ == "__main__":
    main()