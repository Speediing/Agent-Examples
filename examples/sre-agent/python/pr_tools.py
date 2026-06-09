"""Mock PR and approval handlers for the SRE response flow."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping


def read_string(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def read_positive_int(value: Any, fallback: int) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return fallback
    if value < 1:
        return fallback
    return int(value)


@dataclass
class PullRequestRecord:
    number: int
    title: str
    body: str
    diff: str
    merged: bool = False
    approved: bool = False


@dataclass
class PrToolState:
    auto_approve: bool = False
    prs: list[PullRequestRecord] = field(default_factory=list)


def create_pr_tool_state(auto_approve: bool = False) -> PrToolState:
    return PrToolState(auto_approve=auto_approve)


def run_open_pull_request(
    state: PrToolState, args: Mapping[str, Any], _context: object = None
) -> dict[str, Any]:
    title = read_string(args.get("title"))
    body = read_string(args.get("body"))
    diff = read_string(args.get("diff"))

    if not title or not body or not diff:
        return {
            "opened": False,
            "pr_number": None,
            "url": None,
            "error": "title, body, and diff are required",
        }

    pr_number = len(state.prs) + 1
    state.prs.append(
        PullRequestRecord(number=pr_number, title=title, body=body, diff=diff)
    )
    return {
        "opened": True,
        "pr_number": pr_number,
        "url": f"mock://infra/pull/{pr_number}",
        "error": None,
    }


def run_request_approval(
    state: PrToolState, args: Mapping[str, Any], _context: object = None
) -> dict[str, Any]:
    summary = read_string(args.get("summary"))
    if not summary:
        return {
            "decision": "rejected",
            "summary": None,
            "error": "summary is required",
            "message": None,
        }

    if not state.prs:
        return {
            "decision": "rejected",
            "summary": None,
            "error": "open_pull_request must run first",
            "message": None,
        }

    latest_pr = state.prs[-1]
    if not state.auto_approve:
        return {
            "decision": "pending",
            "summary": None,
            "error": None,
            "message": (
                "Human approval required. Re-run with --auto-approve for a "
                "non-interactive demo."
            ),
        }

    latest_pr.approved = True
    return {
        "decision": "approved",
        "summary": summary,
        "error": None,
        "message": None,
    }


def run_merge_pull_request(
    state: PrToolState, args: Mapping[str, Any], _context: object = None
) -> dict[str, Any]:
    pr_number = read_positive_int(args.get("pr_number"), 0)
    pr = next((record for record in state.prs if record.number == pr_number), None)

    if pr is None:
        return {
            "merged": False,
            "pr_number": None,
            "error": f"PR #{pr_number} not found",
        }

    if not pr.approved:
        return {
            "merged": False,
            "pr_number": None,
            "error": "PR is not approved. Call request_approval first.",
        }

    pr.merged = True
    return {"merged": True, "pr_number": pr.number, "error": None}
