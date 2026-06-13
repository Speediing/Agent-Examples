"""Diff tools for the pr-summarizer Python port."""

from __future__ import annotations

import os
from pathlib import Path


EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIFF_PATH = EXAMPLE_ROOT / "fixtures" / "sample.diff"


def read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def resolve_diff_path(override: str | None = None) -> Path:
    if override:
        return Path(override)
    env_path = os.getenv("PR_DIFF_PATH")
    if env_path:
        return Path(env_path)
    return DEFAULT_DIFF_PATH


def read_pr_diff(diff_path: object | None = None) -> dict[str, object]:
    path = resolve_diff_path(read_string(diff_path) or None)
    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        return {
            "found": False,
            "diff_path": str(path),
            "content": None,
            "line_count": 0,
        }

    return {
        "found": True,
        "diff_path": str(path),
        "content": content,
        "line_count": len(content.splitlines()),
    }


def list_changed_files(diff: object | None = None) -> dict[str, object]:
    text = diff if isinstance(diff, str) else ""
    files: list[str] = []

    for line in text.splitlines():
        if line.startswith("+++ b/") and not line.endswith("/dev/null"):
            files.append(line.removeprefix("+++ b/"))

    return {"changed_files": files, "count": len(files)}


def build_pr_summarizer_prompt(title: str) -> str:
    return "\n".join(
        [
            "You are the PR Summarizer Agent.",
            "Read the pull request diff with your tools before you write the walkthrough.",
            "Name the riskiest changed file and explain why it matters.",
            "Do not invent files or behavior that the diff tools did not return.",
            "Return markdown with these sections:",
            "1. Summary",
            "2. What changed",
            "3. Riskiest file and why",
            "4. What to read first",
            "5. Questions for the author",
            f"Pull request title: {title or 'Add refund support to checkout'}",
        ]
    )


def create_pr_summarizer_custom_tools() -> dict[str, object]:
    return {
        "read_pr_diff": {
            "description": (
                "Read the unified diff for the pull request. "
                "Defaults to the example fixture when PR_DIFF_PATH is unset."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "diff_path": {
                        "type": "string",
                        "description": "Optional absolute or repo-relative path to a diff file",
                    }
                },
            },
            "execute": lambda args: read_pr_diff(args.get("diff_path")),
        },
        "list_changed_files": {
            "description": (
                "Parse a unified diff and return the changed file paths from +++ b/ headers."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "diff": {
                        "type": "string",
                        "description": "Unified diff text",
                    }
                },
                "required": ["diff"],
            },
            "execute": lambda args: list_changed_files(args.get("diff")),
        },
    }
