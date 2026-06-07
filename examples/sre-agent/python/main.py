from __future__ import annotations

import os
import sys
from typing import Any, Mapping

from cursor_sdk import Agent, AgentOptions, CustomTool, LocalAgentOptions


ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))

SERVICE_HEALTH: dict[str, dict[str, Any]] = {
    "checkout-api": {
        "service": "checkout-api",
        "status": "critical",
        "error_rate_percent": 18.2,
        "latency_p99_ms": 1240,
        "request_rate_per_min": 420,
        "db_connection_pool_used_percent": 96,
        "notes": [
            "503 responses spiked after the latest deploy",
            "Connection pool saturation correlates with checkout failures",
        ],
    },
    "payments-worker": {
        "service": "payments-worker",
        "status": "degraded",
        "error_rate_percent": 4.1,
        "latency_p99_ms": 680,
        "request_rate_per_min": 95,
        "db_connection_pool_used_percent": 72,
        "notes": ["Retry queue depth is elevated but draining"],
    },
    "catalog-api": {
        "service": "catalog-api",
        "status": "healthy",
        "error_rate_percent": 0.3,
        "latency_p99_ms": 120,
        "request_rate_per_min": 880,
        "db_connection_pool_used_percent": 41,
        "notes": ["No active incident signals"],
    },
}

RECENT_DEPLOYMENTS: list[dict[str, str]] = [
    {
        "service": "checkout-api",
        "commit": "a91f2c1",
        "author": "morgan",
        "deployed_at": "2026-06-07T14:22:00Z",
        "summary": "Increase checkout worker concurrency and shrink DB pool size",
    },
    {
        "service": "payments-worker",
        "commit": "d04be88",
        "author": "lee",
        "deployed_at": "2026-06-07T11:05:00Z",
        "summary": "Tune retry backoff for card processor timeouts",
    },
    {
        "service": "catalog-api",
        "commit": "77ac010",
        "author": "sam",
        "deployed_at": "2026-06-06T18:40:00Z",
        "summary": "Cache warming for category pages",
    },
]

ALERTS: list[dict[str, Any]] = [
    {
        "id": "alert-4412",
        "service": "checkout-api",
        "severity": "critical",
        "fired_at": "2026-06-07T14:31:00Z",
        "message": "HTTP 5xx rate above 15% for checkout-api",
        "resolved": False,
    },
    {
        "id": "alert-4410",
        "service": "checkout-api",
        "severity": "warning",
        "fired_at": "2026-06-07T14:28:00Z",
        "message": "p99 latency above 900ms for checkout-api",
        "resolved": False,
    },
    {
        "id": "alert-4398",
        "service": "payments-worker",
        "severity": "warning",
        "fired_at": "2026-06-07T12:10:00Z",
        "message": "Retry queue depth above baseline",
        "resolved": True,
    },
]

ERROR_LOGS: dict[str, list[str]] = {
    "checkout-api": [
        "2026-06-07T14:31:12Z ERROR pool exhausted waiting for checkout-db connection",
        "2026-06-07T14:31:14Z ERROR request failed status=503 route=/v1/checkout",
        "2026-06-07T14:31:19Z ERROR circuit breaker open for checkout-db",
    ],
    "payments-worker": [
        "2026-06-07T12:11:03Z WARN retrying card capture attempt=3 processor=stripe",
    ],
}

METRIC_SAMPLES: dict[str, float] = {
    'rate(http_requests_total{service="checkout-api",status=~"5.."}[5m])': 18.2,
    'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service="checkout-api"}[5m]))': 1.24,
    'avg(db_connection_pool_used_percent{service="checkout-api"})': 96.0,
    'rate(http_requests_total{service="payments-worker",status=~"5.."}[5m])': 4.1,
}

RUNBOOKS: list[dict[str, Any]] = [
    {
        "symptom": "checkout 503",
        "steps": [
            "Confirm error rate and latency with get_service_health",
            "Check for a deploy within 30 minutes via get_recent_deployments",
            "Inspect connection pool saturation in metrics and error logs",
            "If pool size changed in the latest deploy, prepare a rollback or pool-size hotfix",
        ],
        "escalation": "Page checkout on-call if error rate stays above 10% for 10 minutes",
    },
    {
        "symptom": "database connection pool exhausted",
        "steps": [
            "Validate pool utilization with query_metrics",
            "Compare current config against the previous deploy",
            "Scale pool size or reduce worker concurrency",
            "Verify recovery with get_service_health after the change",
        ],
        "escalation": "Escalate to database platform if pool cannot be increased safely",
    },
]


def read_string(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def read_optional_string(value: Any) -> str | None:
    normalized = read_string(value)
    return normalized or None


def read_positive_int(value: Any, fallback: int) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return fallback
    if value < 1:
        return fallback
    return int(value)


def run_get_service_health(args: Mapping[str, Any], _context: object) -> dict[str, Any]:
    service = read_string(args.get("service"))
    health = SERVICE_HEALTH.get(service)
    return {
        "found": health is not None,
        "service": service,
        "health": health,
        "known_services": [] if health else list(SERVICE_HEALTH.keys()),
    }


def run_get_recent_deployments(args: Mapping[str, Any], _context: object) -> dict[str, Any]:
    service = read_optional_string(args.get("service"))
    limit = read_positive_int(args.get("limit"), 5)
    deployments = [
        deployment
        for deployment in RECENT_DEPLOYMENTS
        if service is None or deployment["service"] == service
    ][:limit]
    return {"deployments": deployments, "count": len(deployments)}


def run_get_alerts(args: Mapping[str, Any], _context: object) -> dict[str, Any]:
    service = read_optional_string(args.get("service"))
    active_only = args.get("active_only") is True
    alerts = [
        alert
        for alert in ALERTS
        if (service is None or alert["service"] == service)
        and (not active_only or not alert["resolved"])
    ]
    return {"alerts": alerts, "count": len(alerts)}


def run_query_metrics(args: Mapping[str, Any], _context: object) -> dict[str, Any]:
    query = read_string(args.get("query"))
    return {
        "query": query,
        "value": METRIC_SAMPLES.get(query),
        "known_queries": list(METRIC_SAMPLES.keys()),
    }


def run_get_error_logs(args: Mapping[str, Any], _context: object) -> dict[str, Any]:
    service = read_string(args.get("service"))
    limit = read_positive_int(args.get("limit"), 10)
    lines = ERROR_LOGS.get(service, [])[:limit]
    return {"service": service, "lines": lines, "count": len(lines)}


def run_lookup_runbook(args: Mapping[str, Any], _context: object) -> dict[str, Any]:
    symptom = read_string(args.get("symptom")).lower()
    runbook = next(
        (candidate for candidate in RUNBOOKS if symptom in candidate["symptom"].lower()),
        None,
    )
    return {
        "found": runbook is not None,
        "symptom": symptom,
        "runbook": runbook,
        "known_symptoms": [] if runbook else [candidate["symptom"] for candidate in RUNBOOKS],
    }


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


def build_prompt(incident: str) -> str:
    return "\n".join(
        [
            "You are the Site Reliability Agent.",
            "Investigate the incident using the available read-only observability tools.",
            "Correlate health, alerts, deployments, metrics, logs, and runbooks before concluding.",
            "Do not guess facts that a tool can return. Call tools until you have enough evidence.",
            "This example is read-only: recommend remediation steps but do not claim you applied changes.",
            "Return a concise incident report with these sections:",
            "1. Summary",
            "2. Timeline",
            "3. Root cause hypothesis",
            "4. Evidence (cite tool results)",
            "5. Recommended next actions",
            "6. Postmortem draft (bullets only)",
            f"Incident report: {incident or 'checkout-api returning 503 errors after a deploy'}",
        ]
    )


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}. Set it before running this SDK example.")
    return value


def run_agent(incident: str) -> str:
    result = Agent.prompt(
        build_prompt(incident),
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
