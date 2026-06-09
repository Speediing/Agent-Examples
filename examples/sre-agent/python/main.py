from __future__ import annotations

import os
import sys

from cursor_sdk import Agent, AgentOptions, CustomTool, LocalAgentOptions

from tools import (
    build_sre_prompt,
    run_get_alerts,
    run_get_error_logs,
    run_get_recent_deployments,
    run_get_service_health,
    run_lookup_runbook,
    run_query_metrics,
)


ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))

CUSTOM_TOOLS = {
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


def run_agent(incident: str) -> str:
    result = Agent.prompt(
        build_sre_prompt(incident),
        AgentOptions(
            api_key=require_env("CURSOR_API_KEY"),
            model=require_env("CURSOR_MODEL"),
            local=LocalAgentOptions(cwd=ROOT_DIR, custom_tools=CUSTOM_TOOLS),
        ),
    )
    return result.result or ""


if __name__ == "__main__":
    try:
        incident = " ".join(sys.argv[1:]).strip()
        print(run_agent(incident))
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
