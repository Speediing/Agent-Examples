"""Pure tool handlers and prompt builder for the SRE agent Python port.

Mirrors examples/sre-agent/ts/src/tools.ts. This module is intentionally
free of cursor_sdk imports so tests can import it without SDK credentials.
"""

from __future__ import annotations

from typing import Any, Mapping

from mock_data import (
    ALERTS,
    ERROR_LOGS,
    METRIC_SAMPLES,
    RECENT_DEPLOYMENTS,
    RUNBOOKS,
    SERVICE_HEALTH,
)


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


def run_get_service_health(args: Mapping[str, Any], _context: object = None) -> dict[str, Any]:
    service = read_string(args.get("service"))
    health = SERVICE_HEALTH.get(service)
    return {
        "found": health is not None,
        "service": service,
        "health": health,
        "known_services": [] if health else list(SERVICE_HEALTH.keys()),
    }


def run_get_recent_deployments(args: Mapping[str, Any], _context: object = None) -> dict[str, Any]:
    service = read_optional_string(args.get("service"))
    limit = read_positive_int(args.get("limit"), 5)
    deployments = [
        deployment
        for deployment in RECENT_DEPLOYMENTS
        if service is None or deployment["service"] == service
    ][:limit]
    return {"deployments": deployments, "count": len(deployments)}


def run_get_alerts(args: Mapping[str, Any], _context: object = None) -> dict[str, Any]:
    service = read_optional_string(args.get("service"))
    active_only = args.get("active_only") is True
    alerts = [
        alert
        for alert in ALERTS
        if (service is None or alert["service"] == service)
        and (not active_only or not alert["resolved"])
    ]
    return {"alerts": alerts, "count": len(alerts)}


def run_query_metrics(args: Mapping[str, Any], _context: object = None) -> dict[str, Any]:
    query = read_string(args.get("query"))
    return {
        "query": query,
        "value": METRIC_SAMPLES.get(query),
        "known_queries": list(METRIC_SAMPLES.keys()),
    }


def run_get_error_logs(args: Mapping[str, Any], _context: object = None) -> dict[str, Any]:
    service = read_string(args.get("service"))
    limit = read_positive_int(args.get("limit"), 10)
    lines = ERROR_LOGS.get(service, [])[:limit]
    return {"service": service, "lines": lines, "count": len(lines)}


def run_lookup_runbook(args: Mapping[str, Any], _context: object = None) -> dict[str, Any]:
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


def build_sre_prompt(incident: str) -> str:
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


def build_sre_response_prompt(alert_payload: str) -> str:
    return "\n".join(
        [
            "You are an on-call SRE agent. Each user message is a PagerDuty alert payload.",
            "Triage it to root cause and ship the minimal safe fix.",
            "",
            "local.cwd contains logs/, infra/, and runbooks/ for the alerting service.",
            "Use read-only observability tools first, then read and edit files in the checkout.",
            "",
            "Workflow for every alert:",
            "1. Call observability tools and read logs/ to identify the failure signature.",
            "2. Consult lookup_runbook, then find the root cause under infra/.",
            "3. Edit the manifest in place and produce a unified diff.",
            "4. open_pull_request(title, body, diff) with the fix.",
            "5. request_approval(summary) and wait for the human decision.",
            "6. Only if the result is approved, merge_pull_request(pr_number).",
            "",
            "Never call merge_pull_request unless request_approval returned approved.",
            "Keep the fix minimal — do not refactor unrelated config.",
            alert_payload,
        ]
    )
