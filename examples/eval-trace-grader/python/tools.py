from __future__ import annotations

import json
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]


def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def _load_trace(case_id: str) -> dict[str, object]:
    fixture = json.loads(
        (EXAMPLE_ROOT / "fixtures" / "sample-trace.json").read_text(encoding="utf-8")
    )
    if case_id and case_id != fixture["case_id"]:
        return {**fixture, "case_id": case_id}
    return fixture


def load_trace_fixture(args: dict[str, object]) -> dict[str, object]:
    case_id = _read_string(args.get("case_id")) or "accessibility-agent-tier1"
    fixture = _load_trace(case_id)
    calls = fixture["completed_tool_calls"]
    return {
        "case_id": fixture["case_id"],
        "tool_names": [call["name"] for call in calls],
        "expected_tool_order": fixture["expected_tool_order"],
        "grounding_rules": fixture["grounding_rules"],
        "count": len(calls),
    }


def grade_trace_grounding(args: dict[str, object]) -> dict[str, object]:
    fixture = _load_trace(_read_string(args.get("case_id")))
    actual = [call["name"] for call in fixture["completed_tool_calls"]]
    expected = fixture["expected_tool_order"]
    tool_order_match = actual == expected
    return {
        "case_id": fixture["case_id"],
        "tool_order_match": tool_order_match,
        "expected_tool_order": expected,
        "actual_tool_order": actual,
        "grounding_rules": fixture["grounding_rules"],
        "passed": tool_order_match,
    }


def build_eval_trace_grader_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Eval Trace Grader.",
            "Behavioral eval grader.",
            "Call load_trace_fixture then grade_trace_grounding. Explain pass/fail using tool output only.",
            f"Task: {task or 'Grade an agent trace fixture for tool order and grounding.'}",
        ]
    )


def create_eval_trace_grader_custom_tools() -> dict[str, object]:
    return {
        "load_trace_fixture": {
            "description": "Load a tier1-style trace fixture with expected tool order.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "case_id": {"type": "string", "description": "Eval case id"},
                },
            },
            "execute": load_trace_fixture,
        },
        "grade_trace_grounding": {
            "description": "Compare completed tool calls against expected order.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "case_id": {"type": "string", "description": "Eval case id"},
                },
            },
            "execute": grade_trace_grounding,
        },
    }
