import json
import os
from pathlib import Path
import unittest
from types import SimpleNamespace
from uuid import UUID, uuid4
from unittest.mock import patch
from unittest.mock import patch

from fastapi import HTTPException

from app.diagnosis.query_diagnosis import diagnose_retrieval
from app.demo.router import (
    AddTurnIn,
    DemoDocumentOut,
    DemoQuestionOut,
    _result_payload,
    _published_result,
    add_conversation_turn,
    is_demo_ready,
    prioritize_follow_ups,
    validate_document_boundary,
)
from app.main import live_queries_enabled


class DemoContractTests(unittest.TestCase):
    def test_demo_document_response_includes_source_type_for_preview_resolution(self):
        self.assertIn("source_type", DemoDocumentOut.model_fields)

    def test_every_demo_question_pack_has_ten_distinct_stable_questions(self):
        packs = json.loads(Path("data/demo_questions.json").read_text(encoding="utf-8"))
        self.assertEqual(len(packs), 6)
        for question_pack in packs.values():
            self.assertGreaterEqual(len(question_pack), 10)
            self.assertEqual(len({item["question"].strip().casefold() for item in question_pack}), len(question_pack))
            self.assertEqual(len({item["key"] for item in question_pack}), len(question_pack))
            self.assertEqual(len({UUID(item["id"]) for item in question_pack}), len(question_pack))
            self.assertEqual({item["sort_order"] for item in question_pack}, set(range(1, len(question_pack) + 1)))

    def test_retrieval_diagnosis_distinguishes_good_moderate_and_poor_overlap(self):
        def hit(dense_rank, bm25_rank):
            return {
                "dense_rank": dense_rank,
                "bm25_rank": bm25_rank,
                "chunk": {"chunk_id": 7},
            }

        self.assertEqual(diagnose_retrieval([hit(1, 2)]) ["health"], "good")
        self.assertEqual(diagnose_retrieval([hit(1, 5)]) ["health"], "moderate")
        self.assertEqual(diagnose_retrieval([hit(1, 9)]) ["health"], "poor")

    def test_handbook_trace_candidates_are_grounded_and_match_questions(self):
        questions = json.loads(
            Path("data/demo_questions.json").read_text(encoding="utf-8")
        )["employee-handbook.pdf"]
        candidates = json.loads(
            Path("data/saved_demo_results/employee-handbook.json").read_text(encoding="utf-8")
        )
        by_key = {item["key"]: item["question"] for item in questions if item["sort_order"] <= 10}
        results = {item["question_key"]: item["result"] for item in candidates["records"]}

        self.assertEqual(set(results), set(by_key))
        for key, result in results.items():
            self.assertEqual(result["trace"]["query"], by_key[key])
            self.assertTrue(result["answer"].strip())
            self.assertTrue(result["retrieved_chunks"])
            self.assertTrue(result["trace"]["stages"])
            self.assertTrue(result["grounding"]["grounded"])
            self.assertTrue(result["citations"])
            self.assertTrue(all(citation["valid"] for citation in result["citations"]))
            self.assertNotRegex(result["answer"], r"\[\d+\]")

    def test_full_demo_corpus_contains_real_grounded_and_low_coverage_examples(self):
        packs = json.loads(Path("data/demo_questions.json").read_text(encoding="utf-8"))
        corpus = json.loads(Path("data/saved_demo_results/demo-corpus.json").read_text(encoding="utf-8"))["documents"]
        self.assertEqual(set(corpus), set(packs))
        diagnoses = set()
        for filename, questions in packs.items():
            results = {record["question_key"]: record["result"] for record in corpus[filename]}
            self.assertEqual(set(results), {question["key"] for question in questions})
            self.assertGreaterEqual(len(results), 10)
            no_citation = 0
            for question in questions:
                result = results[question["key"]]
                self.assertEqual(result["trace"]["query"], question["question"])
                self.assertTrue(result["trace"].get("stages"))
                self.assertTrue(result["retrieved_chunks"])
                health = result["retrieval_diagnosis"]["health"]
                diagnoses.add(health)
                if not result["grounding"]["grounded"]:
                    self.assertEqual(result["citations"], [])
                    no_citation += 1
            self.assertGreaterEqual(no_citation, 2)
        self.assertTrue({"good", "moderate", "poor"}.issubset(diagnoses))

    def test_document_is_published_only_after_ten_results_are_available(self):
        self.assertFalse(is_demo_ready(0, 0))
        self.assertFalse(is_demo_ready(9, 9))
        self.assertFalse(is_demo_ready(10, 9))
        self.assertTrue(is_demo_ready(10, 10))
        self.assertTrue(is_demo_ready(12, 11))

    def test_unavailable_saved_result_returns_not_found(self):
        class EmptySession:
            def execute(self, _statement):
                class EmptyResult:
                    @staticmethod
                    def first():
                        return None

                return EmptyResult()

        with self.assertRaises(HTTPException) as raised:
            _published_result(EmptySession(), uuid4())
        self.assertEqual(raised.exception.status_code, 404)
        self.assertEqual(raised.exception.detail["code"], "SAVED_RESULT_UNAVAILABLE")

    def test_follow_up_rejects_questions_from_another_document(self):
        with self.assertRaises(HTTPException) as raised:
            validate_document_boundary(uuid4(), uuid4())
        self.assertEqual(raised.exception.status_code, 400)

    def test_turn_endpoint_enforces_conversation_document_boundary(self):
        document_a = uuid4()
        document_b = uuid4()
        conversation_id = uuid4()
        parent_id = uuid4()
        sample_question_id = uuid4()
        conversation = SimpleNamespace(id=conversation_id, document_id=document_a)
        parent = SimpleNamespace(id=parent_id, conversation_id=conversation_id)
        question = SimpleNamespace(id=sample_question_id, document_id=document_b)
        saved_result = SimpleNamespace(id=uuid4())

        class FakeSession:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def get(self, model, _id):
                return conversation if model.__name__ == "DemoConversation" else parent

        with (
            patch("app.demo.router.SessionLocal", return_value=FakeSession()),
            patch("app.demo.router._published_result", return_value=(question, saved_result)),
            self.assertRaises(HTTPException) as raised,
        ):
            add_conversation_turn(
                conversation_id,
                AddTurnIn(sample_question_id=sample_question_id, parent_turn_id=parent_id),
            )
        self.assertEqual(raised.exception.status_code, 400)

    def test_saved_result_response_requires_all_inspection_payloads(self):
        saved = SimpleNamespace(
            answer="Grounded answer",
            citations=[{"id": 1, "valid": True}],
            pipeline_trace={"query": "question", "answer": "Grounded answer", "stages": []},
            evidence=[{"chunk_id": 4}],
            retrieval_diagnosis={"health": "good"},
            grounding_result={"grounded": True},
        )
        result = _result_payload(saved)
        self.assertEqual(result.answer, "Grounded answer")
        self.assertEqual(len(result.citations), 1)
        self.assertEqual(len(result.retrieved_chunks), 1)

        saved.pipeline_trace = None
        with self.assertRaises(HTTPException) as raised:
            _result_payload(saved)
        self.assertEqual(raised.exception.status_code, 500)

    def test_follow_ups_put_unasked_questions_first(self):
        already_asked = DemoQuestionOut(
            id=uuid4(), question="Asked", category="policy", sort_order=1, available=True
        )
        not_asked = DemoQuestionOut(
            id=uuid4(), question="New", category="policy", sort_order=2, available=True
        )

        prioritized = prioritize_follow_ups(
            [already_asked, not_asked], {already_asked.id: 1}
        )
        self.assertEqual([item.id for item in prioritized], [not_asked.id, already_asked.id])

    def test_live_query_flag_can_disable_public_inference(self):
        with patch.dict(os.environ, {"ENABLE_LIVE_QUERIES": "false"}):
            self.assertFalse(live_queries_enabled())
        with patch.dict(os.environ, {"ENABLE_LIVE_QUERIES": "true"}):
            self.assertTrue(live_queries_enabled())


if __name__ == "__main__":
    unittest.main()
