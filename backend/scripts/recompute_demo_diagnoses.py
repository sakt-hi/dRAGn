"""Refresh saved trace diagnoses after a deterministic diagnosis rule change."""

import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.diagnosis.query_diagnosis import diagnose_retrieval


RESULTS = Path("data/saved_demo_results/demo-corpus.json")


def main() -> None:
    payload = json.loads(RESULTS.read_text(encoding="utf-8"))
    summary = {}
    for filename, records in payload["documents"].items():
        counts = {"good": 0, "moderate": 0, "poor": 0}
        for record in records:
            result = record["result"]
            diagnosis = diagnose_retrieval(result["retrieved_chunks"])
            result["retrieval_diagnosis"] = diagnosis
            for stage in result["trace"].get("stages", []):
                if stage.get("name") == "Retrieval Diagnosis":
                    stage["data"] = diagnosis
                    break
            counts[diagnosis["health"]] = counts.get(diagnosis["health"], 0) + 1
        summary[filename] = counts

    RESULTS.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
