"""Repo read tools for the spec-drafter Python port."""

from __future__ import annotations

import os
from pathlib import Path


def read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def resolve_repo_path(root_dir: Path, relative_path: str) -> Path | None:
    normalized = os.path.normpath(relative_path).lstrip(os.sep)
    full_path = (root_dir / normalized).resolve()

    if not str(full_path).startswith(str(root_dir.resolve())):
        return None

    return full_path


def search_repo_files(
    root_dir: Path,
    query: object | None = None,
    limit: object | None = None,
) -> dict[str, object]:
    needle = read_string(query).lower()
    max_results = int(limit) if isinstance(limit, (int, float)) and limit > 0 else 20
    matches: list[str] = []

    for current_root, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [
            name
            for name in dirnames
            if name not in {"node_modules", "dist", ".git"}
        ]

        for filename in filenames:
            if len(matches) >= max_results:
                break

            relative_path = str(Path(current_root, filename).relative_to(root_dir))
            if not needle or needle in relative_path.lower():
                matches.append(relative_path)

        if len(matches) >= max_results:
            break

    return {"query": needle, "matches": matches, "count": len(matches)}


def read_repo_file(
    root_dir: Path,
    path: object | None = None,
    max_bytes: object | None = None,
) -> dict[str, object]:
    relative_path = read_string(path)
    byte_limit = int(max_bytes) if isinstance(max_bytes, (int, float)) and max_bytes > 0 else 12_000
    full_path = resolve_repo_path(root_dir, relative_path) if relative_path else None

    if not relative_path or full_path is None:
        return {
            "found": False,
            "path": relative_path,
            "content": None,
            "truncated": False,
            "reason": "Path must stay inside the repository root.",
        }

    try:
        content = full_path.read_text(encoding="utf-8")
    except OSError:
        return {
            "found": False,
            "path": relative_path,
            "content": None,
            "truncated": False,
            "reason": "File not found or unreadable.",
        }

    truncated = len(content) > byte_limit
    return {
        "found": True,
        "path": relative_path,
        "content": content[:byte_limit] if truncated else content,
        "truncated": truncated,
        "reason": f"Truncated to {byte_limit} bytes." if truncated else None,
    }


def build_spec_drafter_prompt(request: str) -> str:
    return "\n".join(
        [
            "You are the Spec Drafter Agent.",
            "Turn the feature request into a draft spec grounded in this repository.",
            "Use search_repo_files and read_repo_file before you name files, modules, or APIs.",
            "Do not invent code paths that the tools did not return.",
            "Return markdown with these sections:",
            "1. Summary",
            "2. Acceptance criteria",
            "3. Touched areas (cite file paths from tool results)",
            "4. Open questions for a human",
            "5. Risks and dependencies",
            f"Feature request: {request or 'Add a read-only spec drafter example to the cookbook.'}",
        ]
    )


def create_spec_drafter_custom_tools(root_dir: Path) -> dict[str, object]:
    return {
        "search_repo_files": {
            "description": (
                "Search the repository for file paths that match a substring. "
                "Use this before naming modules to change."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Substring to match against relative file paths",
                    },
                    "limit": {
                        "type": "number",
                        "description": "Maximum number of paths to return",
                    },
                },
            },
            "execute": lambda args: search_repo_files(
                root_dir,
                args.get("query"),
                args.get("limit"),
            ),
        },
        "read_repo_file": {
            "description": (
                "Read a text file from the repository checkout. "
                "Paths must stay inside the repo root."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Repo-relative file path",
                    },
                    "max_bytes": {
                        "type": "number",
                        "description": "Maximum bytes to return",
                    },
                },
                "required": ["path"],
            },
            "execute": lambda args: read_repo_file(
                root_dir,
                args.get("path"),
                args.get("max_bytes"),
            ),
        },
    }
