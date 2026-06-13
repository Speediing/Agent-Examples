"""Gated side-effect tools for the slack-bot Python port."""

from __future__ import annotations

from agent import ApprovalState, can_execute_side_effects, record_side_effect, SideEffectRecord

_ticket_counter = 1
_pr_counter = 1


def create_ticket(plan: str, approval: ApprovalState | None) -> dict[str, object]:
    global _ticket_counter

    if approval is None or not can_execute_side_effects(approval):
        return {
            "created": False,
            "reason": "Side effects require an explicit human approval.",
            "ticket": None,
        }

    ticket_id = f"BUG-{_ticket_counter}"
    _ticket_counter += 1
    ticket = {
        "id": ticket_id,
        "title": plan.splitlines()[0].strip("# ").strip() or "Bug report from Slack",
        "url": f"https://tracker.example.com/issues/{ticket_id}",
    }
    record_side_effect(
        approval,
        SideEffectRecord(kind="ticket", id=ticket["id"], url=ticket["url"]),
    )
    return {"created": True, "reason": None, "ticket": ticket}


def open_pr(plan: str, approval: ApprovalState | None, repo: str = "platform/checkout") -> dict[str, object]:
    global _pr_counter

    if approval is None or not can_execute_side_effects(approval):
        return {
            "created": False,
            "reason": "Side effects require an explicit human approval.",
            "pr": None,
        }

    pr_id = f"PR-{_pr_counter}"
    _pr_counter += 1
    pr = {
        "id": pr_id,
        "branch": "fix/slack-bug-triage",
        "repo": repo,
        "url": f"https://github.com/example/{repo}/pull/{_pr_counter - 1}",
    }
    record_side_effect(
        approval,
        SideEffectRecord(kind="pr", id=pr["id"], url=pr["url"]),
    )
    return {"created": True, "reason": None, "pr": pr}
