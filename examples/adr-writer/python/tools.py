from __future__ import annotations

import json
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]


def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def load_design_context(args: dict[str, object]) -> dict[str, object]:
    topic = _read_string(args.get("topic"))
    context = json.loads(
        (EXAMPLE_ROOT / "fixtures" / "design-context.json").read_text(encoding="utf-8")
    )
    return {
        "topic": topic or context["topic"],
        "related_files": context["related_files"],
        "constraints": context["constraints"],
        "options": context["options"],
        "count": len(context["related_files"]),
    }


def build_adr_writer_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the ADR Writer.",
            "ADR from design discussion.",
            "Call load_design_context before drafting. Cite related_files and options from tool output.",
            f"Task: {task or 'Draft an ADR from the design context fixture.'}",
        ]
    )


def create_adr_writer_custom_tools() -> dict[str, object]:
    return {
        "load_design_context": {
            "description": "Return related files, constraints, and options for an ADR from a fixture.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "ADR topic or decision title"},
                },
            },
            "execute": load_design_context,
        }
    }
