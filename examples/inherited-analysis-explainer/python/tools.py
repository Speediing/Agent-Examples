"""Inherited analysis explainer handlers (Python port)."""

from __future__ import annotations

from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
FIXTURE_ROOT = EXAMPLE_ROOT / "fixtures" / "legacy-repo"


def read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def list_analysis_files(args: dict[str, object] | None = None) -> dict[str, object]:
    args = args or {}
    limit = args.get("limit")
    max_results = int(limit) if isinstance(limit, (int, float)) and limit > 0 else 20

    files = sorted(
        path.name
        for path in FIXTURE_ROOT.iterdir()
        if not path.name.startswith(".")
    )[:max_results]

    return {
        "found": True,
        "root": "fixtures/legacy-repo",
        "files": files,
        "count": len(files),
        "languages": ["R"],
    }


def read_analysis_file(args: dict[str, object] | None = None) -> dict[str, object]:
    args = args or {}
    relative_path = read_string(args.get("path"))
    fixture_root = FIXTURE_ROOT.resolve()

    if not relative_path:
        return {
            "found": False,
            "path": relative_path,
            "content": None,
            "reason": "Path must stay inside fixtures/legacy-repo.",
        }

    full_path = (FIXTURE_ROOT / relative_path).resolve()

    try:
        full_path.relative_to(fixture_root)
    except ValueError:
        return {
            "found": False,
            "path": relative_path,
            "content": None,
            "reason": "Path must stay inside fixtures/legacy-repo.",
        }

    if not full_path.is_file():
        return {
            "found": False,
            "path": relative_path,
            "content": None,
            "reason": "File not found.",
        }

    return {
        "found": True,
        "path": relative_path,
        "content": full_path.read_text(encoding="utf-8"),
        "reason": None,
    }


def build_inherited_analysis_explainer_prompt(question: str) -> str:
    return "\n".join(
        [
            "You are the Inherited Analysis Explainer.",
            "Help a scientist understand a legacy R analysis repository.",
            "Call list_analysis_files and read_analysis_file before describing structure.",
            "Do not invent files, paths, or parameters that tools did not return.",
            f"Question: {question or 'Where should I start reading this analysis repo?'}",
        ]
    )


def create_inherited_analysis_explainer_custom_tools() -> dict[str, object]:
    return {
        "list_analysis_files": {
            "description": "List files in the inherited analysis fixture repository.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "limit": {"type": "number", "description": "Maximum files to return"},
                },
            },
            "execute": lambda args: list_analysis_files(args),
        },
        "read_analysis_file": {
            "description": "Read a text file from the inherited analysis fixture repo.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File name inside legacy-repo"},
                },
                "required": ["path"],
            },
            "execute": lambda args: read_analysis_file(args),
        },
    }
