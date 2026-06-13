from __future__ import annotations

import os
import sys

from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

from agent import build_risk_classifier_prompt
from tools import create_risk_classifier_custom_tools


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def main() -> int:
    title = " ".join(sys.argv[1:]).strip()
    result = Agent.prompt(
        build_risk_classifier_prompt(title),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(
                cwd=os.getcwd(),
                custom_tools=create_risk_classifier_custom_tools(),
            ),
        ),
    )
    print(result.result)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
