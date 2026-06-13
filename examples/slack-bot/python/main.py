from __future__ import annotations

import json
import os
import sys

from agent import approve, build_triage_prompt, create_approval_state, reject
from tools import create_ticket, open_pr


def main() -> int:
    argv = [arg for arg in sys.argv[1:] if arg not in {"--approve", "--reject", "--offline"}]
    thread_text = " ".join(argv).strip()
    approval = create_approval_state()

    if "--approve" in sys.argv:
        approve(approval)
    if "--reject" in sys.argv:
        reject(approval)

    plan = build_triage_prompt(thread_text)
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

    ticket = create_ticket(plan, approval)
    pr = open_pr(plan, approval)
    print(plan)
    print()
    print(
        json.dumps(
            {
                "approved": approval.approved,
                "rejected": approval.rejected,
                "ticket_created": ticket["created"],
                "pr_created": pr["created"],
                "side_effects": [
                    {"kind": item.kind, "id": item.id, "url": item.url}
                    for item in approval.side_effects
                ],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
