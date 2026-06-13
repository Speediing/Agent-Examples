"""Approval gate and prompt helpers for the slack-bot Python port."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SideEffectRecord:
    kind: str
    id: str
    url: str


@dataclass
class ApprovalState:
    approved: bool = False
    rejected: bool = False
    side_effects: list[SideEffectRecord] = field(default_factory=list)


def create_approval_state() -> ApprovalState:
    return ApprovalState()


def approve(state: ApprovalState) -> None:
    state.approved = True
    state.rejected = False


def reject(state: ApprovalState) -> None:
    state.approved = False
    state.rejected = True


def can_execute_side_effects(state: ApprovalState) -> bool:
    return state.approved and not state.rejected


def record_side_effect(state: ApprovalState, record: SideEffectRecord) -> None:
    if not can_execute_side_effects(state):
        return
    state.side_effects.append(record)


def build_triage_prompt(thread_text: str) -> str:
    report = thread_text.strip() or "Checkout returns 503 after deploy. Users cannot pay."
    return "\n".join(
        [
            "You are the Slack Bug Triage Agent.",
            "Turn the Slack thread into a short triage plan a human can approve.",
            "Do not claim you created a ticket or opened a pull request.",
            "Return markdown with these sections:",
            "1. Summary",
            "2. Likely impact",
            "3. Proposed next steps",
            "4. What needs human approval",
            f"Slack thread:\n{report}",
        ]
    )
