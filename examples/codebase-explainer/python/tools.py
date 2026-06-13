"""Repo read tools for the codebase-explainer Python port."""

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


def list_module_files(
    root_dir: Path,
    module_path: object | None = None,
    limit: object | None = None,
) -> dict[str, object]:
    module = read_string(module_path) or "."
    max_results = int(limit) if isinstance(limit, (int, float)) and limit > 0 else 30
    full_path = resolve_repo_path(root_dir, module)

    if full_path is None:
        return {
            "found": False,
            "module_path": module,
            "files": [],
            "count": 0,
            "reason": "Module path must stay inside the repository root.",
        }

    files: list[str] = []

    def walk(current_dir: Path) -> None:
        if len(files) >= max_results:
            return

        try:
            entries = list(current_dir.iterdir())
        except OSError:
            return

        for entry in sorted(entries):
            if len(files) >= max_results:
                return

            if entry.name in {"node_modules", "dist", ".git"}:
                continue

            relative_path = str(entry.relative_to(root_dir))
            if entry.is_dir():
                walk(entry)
            else:
                files.append(relative_path)

    if full_path.is_dir():
        walk(full_path)
    elif full_path.is_file():
        files.append(str(full_path.relative_to(root_dir)))
    else:
        return {
            "found": False,
            "module_path": module,
            "files": [],
            "count": 0,
            "reason": "Module path not found.",
        }

    return {
        "found": True,
        "module_path": module,
        "files": files,
        "count": len(files),
        "reason": None,
    }


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


def build_codebase_explainer_prompt(module_path: str, question: str) -> str:
    return "\n".join(
        [
            "You are the Codebase Explainer Agent.",
            "Explain the requested module for a developer who is new to this repository.",
            "Use list_module_files and read_repo_file before you describe structure or behavior.",
            "Do not invent files, exports, or runtime behavior that the tools did not return.",
            "Return markdown with these sections:",
            "1. What this module does",
            "2. Key files and entrypoints",
            "3. How data or control flows through it",
            "4. Where to start reading",
            "5. Safe next questions for a human owner",
            f"Module path: {module_path or 'examples/hello-world'}",
            f"Question: {question or 'How does this example work end to end?'}",
        ]
    )


def create_codebase_explainer_custom_tools(root_dir: Path) -> dict[str, object]:
    return {
        "list_module_files": {
            "description": (
                "List files under a repo-relative module path. "
                "Use this to map an unfamiliar subsystem."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "module_path": {
                        "type": "string",
                        "description": "Repo-relative directory or file path",
                    },
                    "limit": {
                        "type": "number",
                        "description": "Maximum number of files to return",
                    },
                },
            },
            "execute": lambda args: list_module_files(
                root_dir,
                args.get("module_path"),
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
