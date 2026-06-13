from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

Severity = Literal["blocking", "non-blocking"]

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class BugbotFinding:
    rule: str
    severity: Severity
    title: str
    path: str
    detail: str


def resolve_diff_path(override: str | None = None) -> Path:
    if override and override.strip():
        candidate = Path(override.strip())
        return candidate if candidate.is_absolute() else Path.cwd() / candidate
    return EXAMPLE_ROOT / "fixtures" / "pr-idempotency-bug.diff"


def list_changed_files(diff: str) -> list[str]:
    files: list[str] = []
    seen: set[str] = set()
    for line in diff.splitlines():
        match = re.match(r"^\+\+\+ b/(.+)$", line)
        if match and match.group(1) != "/dev/null":
            path = match.group(1)
            if path not in seen:
                seen.add(path)
                files.append(path)
    return files


def added_lines_for_file(diff: str, file_path: str) -> list[str]:
    lines: list[str] = []
    current_file: str | None = None
    in_hunk = False
    for line in diff.splitlines():
        file_match = re.match(r"^\+\+\+ b/(.+)$", line)
        if file_match:
            current_file = file_match.group(1)
            in_hunk = False
            continue
        if line.startswith("@@"):
            in_hunk = current_file == file_path
            continue
        if not in_hunk or current_file != file_path:
            continue
        if line.startswith("+") and not line.startswith("+++"):
            lines.append(line[1:])
    return lines


def validate_bugbot_diff(diff: str) -> list[BugbotFinding]:
    findings: list[BugbotFinding] = []
    changed_files = list_changed_files(diff)
    payments_changed = any(path.startswith("src/payments/") for path in changed_files)
    payments_tests_changed = any(
        path.startswith("tests/payments/") for path in changed_files
    )

    checkout_text = "\n".join(added_lines_for_file(diff, "src/payments/checkout.ts"))

    if re.search(r"idempotencyKey:\s*token\b", checkout_text) or re.search(
        r"idempotencyKey:\s*[^,\n}]+token", checkout_text
    ):
        findings.append(
            BugbotFinding(
                rule="unsafe-idempotency-key",
                severity="blocking",
                title="Unsafe idempotency key",
                path="src/payments/checkout.ts",
                detail="Client token reused as idempotencyKey. Generate a server-side UUID instead.",
            )
        )

    if (
        payments_changed
        and re.search(r"gateway\.refund|/refunds", checkout_text)
        and not re.search(r"authorize|ownership|role|permission", checkout_text, re.I)
    ):
        findings.append(
            BugbotFinding(
                rule="refund-missing-authorization",
                severity="blocking",
                title="Refund path missing authorization",
                path="src/payments/checkout.ts",
                detail="New refund path calls gateway.refund without an authorization check.",
            )
        )

    if payments_changed and not payments_tests_changed:
        findings.append(
            BugbotFinding(
                rule="missing-payments-tests",
                severity="blocking",
                title="Missing payments tests",
                path="src/payments/",
                detail="Payment handler files changed without matching tests under tests/payments/.",
            )
        )

    return findings


def format_findings(findings: list[BugbotFinding]) -> str:
    if not findings:
        return "No Bugbot rule violations detected in the fixture diff."
    return "\n\n".join(
        f"[{finding.severity}] {finding.title}\n"
        f"  rule: {finding.rule}\n"
        f"  path: {finding.path}\n"
        f"  {finding.detail}"
        for finding in findings
    )
