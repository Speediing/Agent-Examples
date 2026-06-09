from __future__ import annotations

import json
import os
import sys

from cursor_sdk import Agent, AgentOptions, CustomTool, LocalAgentOptions

from pr_tools import (
    PrToolState,
    create_pr_tool_state,
    run_merge_pull_request,
    run_open_pull_request,
    run_request_approval,
)
from tools import (
    build_sre_prompt,
    build_sre_response_prompt,
    run_get_alerts,
    run_get_error_logs,
    run_get_recent_deployments,
    run_get_service_health,
    run_lookup_runbook,
    run_query_metrics,
)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
EXAMPLE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURES_DIR = os.path.join(EXAMPLE_DIR, "fixtures")

OBSERVABILITY_TOOLS = {
    "get_service_health": CustomTool(
        description=(
            "Return a health summary for a service: status, error rate, latency, "
            "and pool utilization."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "service": {
                    "type": "string",
                    "description": "Service name, for example checkout-api",
                }
            },
            "required": ["service"],
        },
        execute=run_get_service_health,
    ),
    "get_recent_deployments": CustomTool(
        description="List recent deployments, optionally filtered to one service.",
        input_schema={
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "limit": {"type": "number"},
            },
        },
        execute=run_get_recent_deployments,
    ),
    "get_alerts": CustomTool(
        description="Return active or historical alerts, optionally filtered by service.",
        input_schema={
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "active_only": {"type": "boolean"},
            },
        },
        execute=run_get_alerts,
    ),
    "query_metrics": CustomTool(
        description="Run a PromQL-style metrics query against the mock observability backend.",
        input_schema={
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
        execute=run_query_metrics,
    ),
    "get_error_logs": CustomTool(
        description="Return recent error log lines for a service from the mock log store.",
        input_schema={
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "limit": {"type": "number"},
            },
            "required": ["service"],
        },
        execute=run_get_error_logs,
    ),
    "lookup_runbook": CustomTool(
        description="Find a structured investigation runbook for a symptom or incident type.",
        input_schema={
            "type": "object",
            "properties": {"symptom": {"type": "string"}},
            "required": ["symptom"],
        },
        execute=run_lookup_runbook,
    ),
}


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def create_response_tools(state: PrToolState) -> dict[str, CustomTool]:
    return {
        **OBSERVABILITY_TOOLS,
        "open_pull_request": CustomTool(
            description="Open a pull request against the infra repo with the proposed fix.",
            input_schema={
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "body": {"type": "string"},
                    "diff": {"type": "string"},
                },
                "required": ["title", "body", "diff"],
            },
            execute=lambda args, context=None: run_open_pull_request(state, args, context),
        ),
        "request_approval": CustomTool(
            description="Ask the on-call human to approve the proposed PR before merging.",
            input_schema={
                "type": "object",
                "properties": {"summary": {"type": "string"}},
                "required": ["summary"],
            },
            execute=lambda args, context=None: run_request_approval(state, args, context),
        ),
        "merge_pull_request": CustomTool(
            description="Merge an approved pull request.",
            input_schema={
                "type": "object",
                "properties": {"pr_number": {"type": "number"}},
                "required": ["pr_number"],
            },
            execute=lambda args, context=None: run_merge_pull_request(state, args, context),
        ),
    }


def load_alert_payload(args: list[str]) -> str:
    if args:
        inline = " ".join(args).strip()
        try:
            json.loads(inline)
            return inline
        except json.JSONDecodeError:
            return json.dumps(
                {
                    "event": {
                        "event_type": "incident.triggered",
                        "data": {
                            "title": inline,
                            "service": {"summary": "checkout-api"},
                        },
                    }
                },
                indent=2,
            )

    with open(os.path.join(FIXTURES_DIR, "alert.json"), encoding="utf-8") as handle:
        return handle.read()


def run_report_only(incident: str) -> str:
    result = Agent.prompt(
        build_sre_prompt(incident),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(cwd=ROOT_DIR, custom_tools=OBSERVABILITY_TOOLS),
        ),
    )
    return result.result or ""


def run_response_flow(args: list[str], auto_approve: bool) -> str:
    state = create_pr_tool_state(auto_approve)
    result = Agent.prompt(
        build_sre_response_prompt(load_alert_payload(args)),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(cwd=FIXTURES_DIR, custom_tools=create_response_tools(state)),
        ),
    )
    output = result.result or ""

    if state.prs:
        output += "\n\n── Pull requests opened ──\n"
        for pr in state.prs:
            status = "MERGED" if pr.merged else "APPROVED" if pr.approved else "OPEN"
            output += f"#{pr.number} {status}: {pr.title}\n"

    return output


if __name__ == "__main__":
    try:
        argv = sys.argv[1:]
        report_only = "--report-only" in argv
        auto_approve = "--auto-approve" in argv
        positional = [arg for arg in argv if not arg.startswith("--")]

        if report_only:
            print(run_report_only(" ".join(positional).strip()))
        else:
            print(run_response_flow(positional, auto_approve))
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
