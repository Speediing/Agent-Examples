from __future__ import annotations
import os, sys
from cursor_sdk import Agent, AgentOptions, LocalAgentOptions
from tools import build_slo_budget_reporter_prompt

def main() -> int:
    task = " ".join(sys.argv[1:])
    result = Agent.prompt(build_slo_budget_reporter_prompt(task), AgentOptions(
        api_key=os.environ["CURSOR_API_KEY"], model=os.environ["CURSOR_MODEL"],
        local=LocalAgentOptions(cwd=os.getcwd()),
    ))
    print(result.result)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
