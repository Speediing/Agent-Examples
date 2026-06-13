from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass

from agent import build_requirements_clarifier_prompt


@dataclass
class ApprovalState:
    approved: bool = False
    rejected: bool = False


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


def create_record(plan: str, approval: ApprovalState) -> dict[str, object]:
    if not can_execute_side_effects(approval):
        return {
            "created": False,
            "reason": "Side effects require an explicit human approval.",
            "record": None,
        }
    return {
        "created": True,
        "reason": None,
        "record": {"id": "requirements-clarifier-1", "url": "https://tracker.example.com/requirements-clarifier/1"},
    }


def main() -> int:
    text = " ".join(a for a in sys.argv[1:] if a not in {"--approve", "--reject", "--offline"})
    approval = create_approval_state()
    if "--approve" in sys.argv:
        approve(approval)
    if "--reject" in sys.argv:
        reject(approval)

    plan = build_requirements_clarifier_prompt(text)
    if "--offline" not in sys.argv and os.getenv("CURSOR_API_KEY") and os.getenv("CURSOR_MODEL"):
        from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

        result = Agent.prompt(
            plan,
            AgentOptions(
                api_key=os.environ["CURSOR_API_KEY"],
                model=os.environ["CURSOR_MODEL"],
                local=LocalAgentOptions(cwd=os.getcwd()),
            ),
        )
        plan = result.result or plan

    record = create_record(plan, approval)
    print(plan)
    print(json.dumps({"approved": approval.approved, "record_created": record["created"]}, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
