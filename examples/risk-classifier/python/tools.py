"""Diff and scoring tools for the risk-classifier Python port."""

from __future__ import annotations

import os
import re
from pathlib import Path


EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIFF_PATH = EXAMPLE_ROOT / "fixtures" / "sample.diff"

HIGH_RISK_PATTERNS: list[tuple[re.Pattern[str], int, str]] = [
    (re.compile(r"/payments/", re.I), 40, "Touches payment code."),
    (re.compile(r"/auth/", re.I), 35, "Touches authentication code."),
    (re.compile(r"gateway", re.I), 25, "Changes an external integration boundary."),
    (re.compile(r"migration", re.I), 20, "Touches schema or migration logic."),
]


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


def score_changed_files(changed_files: object | None = None) -> dict[str, object]:
    files = [item for item in changed_files if isinstance(item, str)] if isinstance(changed_files, list) else []
    scored: list[dict[str, object]] = []

    for file in files:
        score = 10
        reasons = ["File changed in the pull request."]
        for pattern, weight, reason in HIGH_RISK_PATTERNS:
            if pattern.search(file):
                score += weight
                reasons.append(reason)
        scored.append({"file": file, "score": score, "reasons": reasons})

    scored.sort(key=lambda item: int(item["score"]), reverse=True)
    top = scored[0] if scored else None
    total_score = sum(int(item["score"]) for item in scored)
    band = "high" if total_score >= 80 else "medium" if total_score >= 45 else "low"

    return {
        "files": scored,
        "count": len(scored),
        "total_score": total_score,
        "risk_band": band,
        "highest_risk_file": top["file"] if top else None,
        "highest_risk_score": top["score"] if top else 0,
    }


def build_risk_classifier_prompt(title: str) -> str:
    return "\n".join(
        [
            "You are the PR Risk Classifier Agent.",
            "Read the diff, list changed files, and call score_changed_files before you classify risk.",
            "Ground the risk band and routing recommendation in the tool result.",
            "Do not invent files or scores that the tools did not return.",
            "Return markdown with these sections:",
            "1. Risk band (low, medium, or high)",
            "2. Highest-risk file",
            "3. Routing recommendation",
            "4. Evidence from tool results",
            "5. What a human reviewer should focus on",
            f"Pull request title: {title or 'Add refund support to checkout'}",
        ]
    )


def create_risk_classifier_custom_tools() -> dict[str, object]:
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
        "score_changed_files": {
            "description": (
                "Score changed files with deterministic path rules and return a risk band."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "changed_files": {
                        "type": "array",
                        "items": {"type": "string"},
                    }
                },
                "required": ["changed_files"],
            },
            "execute": lambda args: score_changed_files(args.get("changed_files")),
        },
    }
