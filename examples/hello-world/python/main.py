from __future__ import annotations

import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class AgentInput:
    name: str


@dataclass(frozen=True)
class AgentResponse:
    message: str


def run_agent(agent_input: AgentInput) -> AgentResponse:
    name = agent_input.name.strip() or "there"

    return AgentResponse(
        message=f"Hello, {name}. This is your first Cursor SDK agent example."
    )


if __name__ == "__main__":
    name = " ".join(sys.argv[1:])
    response = run_agent(AgentInput(name=name))
    print(response.message)
