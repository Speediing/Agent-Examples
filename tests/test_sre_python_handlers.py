"""Tier 0 tests for the SRE agent Python handlers.

Mirrors the TypeScript expectations in eval/tool-handlers.test.ts so both
ports are pinned to the same behavior.
"""

from conftest import load_example_module

sre = load_example_module(
    "sre_tools",
    "examples/sre-agent/python/tools.py",
    package_dir="examples/sre-agent/python",
)


def test_service_health_known_service() -> None:
    result = sre.run_get_service_health({"service": "checkout-api"})
    assert result["found"] is True
    assert result["health"]["status"] == "critical"
    assert result["known_services"] == []


def test_service_health_unknown_service_lists_known() -> None:
    result = sre.run_get_service_health({"service": "ghost-api"})
    assert result["found"] is False
    assert result["health"] is None
    assert "checkout-api" in result["known_services"]


def test_recent_deployments_respects_service_and_limit() -> None:
    result = sre.run_get_recent_deployments({"service": "checkout-api", "limit": 1})
    assert result["count"] == 1
    assert result["deployments"][0]["service"] == "checkout-api"


def test_recent_deployments_rejects_bool_limit() -> None:
    result = sre.run_get_recent_deployments({"limit": True})
    assert result["count"] == 3


def test_alerts_active_only_filters_resolved() -> None:
    result = sre.run_get_alerts({"service": "checkout-api", "active_only": True})
    assert result["count"] == 2
    assert all(not alert["resolved"] for alert in result["alerts"])


def test_query_metrics_unknown_query_returns_none() -> None:
    result = sre.run_query_metrics({"query": "up"})
    assert result["value"] is None
    assert len(result["known_queries"]) > 0


def test_error_logs_limit() -> None:
    result = sre.run_get_error_logs({"service": "checkout-api", "limit": 2})
    assert result["count"] == 2


def test_lookup_runbook_matches_symptom_substring() -> None:
    result = sre.run_lookup_runbook({"symptom": "Checkout 503"})
    assert result["found"] is True
    assert result["runbook"]["symptom"] == "checkout 503"


def test_lookup_runbook_unknown_symptom_lists_known() -> None:
    result = sre.run_lookup_runbook({"symptom": "disk full"})
    assert result["found"] is False
    assert result["known_symptoms"] == [
        "checkout 503",
        "database connection pool exhausted",
    ]


def test_prompt_includes_incident_and_read_only_contract() -> None:
    prompt = sre.build_sre_prompt("checkout-api returning 503 after deploy")
    assert "checkout-api returning 503 after deploy" in prompt
    assert "read-only" in prompt
