from __future__ import annotations
import os, sys
from cursor_sdk import Agent, AgentOptions, LocalAgentOptions
from tools import build_codemod_runner_prompt, create_codemod_runner_custom_tools

def main() -> int:
    task = " ".join(a for a in sys.argv[1:] if a != "--act")
    result = Agent.prompt(build_codemod_runner_prompt(task), AgentOptions(
        api_key=os.environ["CURSOR_API_KEY"], model=os.environ["CURSOR_MODEL"],
        local=LocalAgentOptions(cwd=os.getcwd(), custom_tools=create_codemod_runner_custom_tools()),
    ))
    print(result.result)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
