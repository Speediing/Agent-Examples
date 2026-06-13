from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

Severity = Literal["critical", "high", "medium"]

EXAMPLE_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class SecurityFinding:
    rule: str
    severity: Severity
    title: str
    path: str
    detail: str


def resolve_diff_path(override: str | None = None) -> Path:
    if override and override.strip():
        candidate = Path(override.strip())
        return candidate if candidate.is_absolute() else Path.cwd() / candidate
    return EXAMPLE_ROOT / "fixtures" / "pr-auth-bypass.diff"


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


def validate_security_reviewer_diff(diff: str) -> list[SecurityFinding]:
    findings: list[SecurityFinding] = []

    session_text = "\n".join(added_lines_for_file(diff, "src/auth/session.ts"))
    if re.search(
        r"if\s*\(\s*!session\s*\)[\s\S]*return true", session_text
    ) or re.search(r"isAdmin\([\s\S]*null[\s\S]*return true", session_text, re.S):
        findings.append(
            SecurityFinding(
                rule="auth-bypass",
                severity="critical",
                title="Admin check treats missing session as admin",
                path="src/auth/session.ts",
                detail="isAdmin returns true when session is null. Missing auth must deny access.",
            )
        )

    refund_text = "\n".join(added_lines_for_file(diff, "src/payments/refund.ts"))
    if re.search(r"sk_live_|api[_-]?key\s*=\s*['\"][^'\"]+['\"]", refund_text, re.I):
        findings.append(
            SecurityFinding(
                rule="hardcoded-secret",
                severity="critical",
                title="Live API key committed to source",
                path="src/payments/refund.ts",
                detail="Gateway credential appears in source. Load from a secret manager.",
            )
        )

    if re.search(r"`[^`]*\$\{[^}]+\}[^`]*`", refund_text) and re.search(
        r"SELECT|INSERT|UPDATE", refund_text, re.I
    ):
        findings.append(
            SecurityFinding(
                rule="sql-injection",
                severity="high",
                title="User input concatenated into SQL",
                path="src/payments/refund.ts",
                detail="Build SQL with parameterized queries instead of template literals.",
            )
        )

    admin_text = "\n".join(added_lines_for_file(diff, "src/admin/tools.ts"))
    if re.search(r"\beval\s*\(", admin_text):
        findings.append(
            SecurityFinding(
                rule="dangerous-eval",
                severity="critical",
                title="Agent tool executes arbitrary shell via eval",
                path="src/admin/tools.ts",
                detail="Admin tool uses eval on user-supplied command text. Remove or gate behind human approval.",
            )
        )

    return findings


def format_findings(findings: list[SecurityFinding]) -> str:
    if not findings:
        return "No Security Reviewer rule violations detected in the fixture diff."
    return "\n\n".join(
        f"[{finding.severity}] {finding.title}\n"
        f"  rule: {finding.rule}\n"
        f"  path: {finding.path}\n"
        f"  {finding.detail}"
        for finding in findings
    )
