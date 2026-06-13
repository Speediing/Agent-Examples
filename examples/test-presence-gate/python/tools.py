from __future__ import annotations

import os
from pathlib import Path

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIFF_PATH = EXAMPLE_ROOT / "fixtures" / "missing-tests.diff"

APP_PREFIX = "src/"
TEST_PREFIXES = ("tests/", "test/", "__tests__/")


def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""


def _resolve_diff_path(override: str) -> Path:
    env = os.environ.get("PR_DIFF_PATH", "").strip()
    if override:
        return Path(override)
    if env:
        return Path(env)
    return DEFAULT_DIFF_PATH


async def read_pr_diff(args: dict[str, object]) -> dict[str, object]:
    diff_path = _resolve_diff_path(_read_string(args.get("diff_path")))
    try:
        content = diff_path.read_text(encoding="utf-8")
        return {
            "found": True,
            "diff_path": str(diff_path),
            "content": content,
            "line_count": len(content.splitlines()),
        }
    except OSError:
        return {
            "found": False,
            "diff_path": str(diff_path),
            "content": None,
            "line_count": 0,
        }


def _list_changed_files(diff: str) -> list[str]:
    files: set[str] = set()
    for line in diff.splitlines():
        if line.startswith("+++ b/") and not line.endswith("/dev/null"):
            files.add(line.removeprefix("+++ b/"))
    return sorted(files)


def _is_app_file(file_path: str) -> bool:
    return file_path.startswith(APP_PREFIX) and not any(
        prefix in file_path for prefix in TEST_PREFIXES
    )


def _is_test_file(file_path: str) -> bool:
    return any(file_path.startswith(prefix) for prefix in TEST_PREFIXES)


def _expected_test_globs(app_file: str) -> list[str]:
    path = Path(app_file)
    base = path.stem
    directory = str(path.parent).removeprefix("src/")
    return [
        f"tests/{directory}/{base}.test.ts",
        f"tests/{directory}/{base}.spec.ts",
        f"test/{directory}/{base}.test.ts",
    ]


def check_test_presence(args: dict[str, object]) -> dict[str, object]:
    diff = args.get("diff") if isinstance(args.get("diff"), str) else ""
    changed = _list_changed_files(diff)
    changed_tests = {file for file in changed if _is_test_file(file)}
    violations: list[dict[str, str]] = []

    for file in changed:
        if not _is_app_file(file):
            continue
        expected = _expected_test_globs(file)
        has_test = any(
            candidate in changed_tests or candidate in changed for candidate in expected
        )
        if not has_test:
            violations.append(
                {
                    "id": "test/missing-coverage",
                    "path": file,
                    "summary": (
                        "Application file changed without matching test in diff "
                        f"(expected one of: {', '.join(expected)})"
                    ),
                }
            )

    return {
        "target": "pr-diff",
        "changed_files": changed,
        "violations": violations,
        "count": len(violations),
        "passed": len(violations) == 0,
    }


def build_test_presence_gate_prompt(task: str) -> str:
    return "\n".join(
        [
            "You are the Test Presence Gate.",
            "Diff-based test presence gate.",
            "Read the PR diff, then call check_test_presence. Cite violation ids from tool output.",
            "Do not claim pass when passed is false.",
            f"Task: {task or 'Scan the PR diff for missing tests.'}",
        ]
    )


def create_test_presence_gate_custom_tools() -> dict[str, object]:
    return {
        "read_pr_diff": {
            "description": "Read the unified diff for the pull request.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "diff_path": {
                        "type": "string",
                        "description": "Optional path to a diff file",
                    }
                },
            },
            "execute": read_pr_diff,
        },
        "check_test_presence": {
            "description": "Parse a unified diff and fail when application files change without matching tests.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "diff": {"type": "string", "description": "Unified diff text"},
                },
                "required": ["diff"],
            },
            "execute": check_test_presence,
        },
    }
