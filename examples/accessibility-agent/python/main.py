from __future__ import annotations

import os
import sys
from pathlib import Path

from cursor_sdk import Agent, AgentOptions, CustomTool, LocalAgentOptions

from agent import build_accessibility_prompt
from scan import print_scan_result, resolve_target_url, scan_accessibility


ROOT_DIR = Path(__file__).resolve().parents[3]


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def run_agent(target_url: str, user_prompt: str) -> str:
    def run_scan_tool(args: dict[str, object], _context: object) -> dict[str, object]:
        url_value = args.get("url")
        url = resolve_target_url(str(url_value)) if isinstance(url_value, str) else target_url
        result = scan_accessibility(url)

        return {
            "url": result.url,
            "violationCount": result.violation_count,
            "violations": [
                {
                    "id": violation.id,
                    "impact": violation.impact,
                    "description": violation.description,
                    "help": violation.help,
                    "helpUrl": violation.help_url,
                    "nodeCount": violation.node_count,
                    "targets": violation.targets,
                }
                for violation in result.violations
            ],
        }

    custom_tools = {
        "scan_accessibility": CustomTool(
            description="Runs an axe-core accessibility scan against a URL or local HTML file.",
            input_schema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Absolute URL, file:// URL, or filesystem path to scan.",
                    }
                },
                "required": ["url"],
            },
            execute=run_scan_tool,
        )
    }

    result = Agent.prompt(
        build_accessibility_prompt(target_url, user_prompt),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(cwd=str(ROOT_DIR), custom_tools=custom_tools),
        ),
    )
    return result.result


def main() -> int:
    args = [arg for arg in sys.argv[1:] if arg]
    scan_only = "--scan-only" in args
    positional_args = [arg for arg in args if arg != "--scan-only"]

    if scan_only:
        target_url = resolve_target_url(positional_args[0] if positional_args else None)
        result = scan_accessibility(target_url)
        print_scan_result(result)
        return 1 if result.violation_count > 0 else 0

    target_url = resolve_target_url(positional_args[0] if positional_args else None)
    user_prompt = " ".join(positional_args[1:]).strip()
    print(run_agent(target_url, user_prompt))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
