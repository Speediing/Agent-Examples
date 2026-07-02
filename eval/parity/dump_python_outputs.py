"""Dump deterministic Python handler and prompt outputs as JSON.

Run by eval/parity/ts-python-live.test.ts, which compares this output against
the live TypeScript implementations. Uses importlib with unique module names
because several examples ship files named tools.py or agent.py.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from types import ModuleType

ROOT = Path(__file__).resolve().parents[2]


def load(module_name: str, relative: str, package_dir: str | None = None) -> ModuleType:
    path = ROOT / relative
    added = str(ROOT / package_dir) if package_dir else None
    if added:
        sys.path.insert(0, added)
    try:
        spec = importlib.util.spec_from_file_location(module_name, path)
        if spec is None or spec.loader is None:
            raise ImportError(f"cannot load {path}")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module
    finally:
        if added:
            sys.path.remove(added)


tool_calling = load(
    "parity_tool_calling_tools", "examples/tool-calling-agent/python/tools.py"
)
sre = load(
    "parity_sre_tools",
    "examples/sre-agent/python/tools.py",
    package_dir="examples/sre-agent/python",
)
hello_world = load("parity_hello_world_agent", "examples/hello-world/python/agent.py")
accessibility = load(
    "parity_accessibility_agent", "examples/accessibility-agent/python/agent.py"
)
migration = load("parity_migration_prompt", "examples/migration-agent/python/prompt.py")

MIGRATION_SAMPLE = [
    {
        "status": "stale",
        "example": "sre-agent",
        "message": "examples/sre-agent/python/main.py is older than the TypeScript source",
    }
]

output = {
    "tool_calling": {
        "add": tool_calling.run_add_tool({"numbers": [3, 9, 2.5]}, None),
        "add_rejects_non_numbers": tool_calling.run_add_tool(
            {"numbers": [3, True, "4", 9]}, None
        ),
        "word_count": tool_calling.run_word_count_tool(
            {"text": "  one two   three "}, None
        ),
        "prompt": tool_calling.build_tool_calling_prompt("add 3 and 9"),
        "prompt_default": tool_calling.build_tool_calling_prompt(""),
    },
    "sre": {
        "service_health_known": sre.run_get_service_health({"service": "checkout-api"}),
        "service_health_unknown": sre.run_get_service_health({"service": "ghost-api"}),
        "deployments_limited": sre.run_get_recent_deployments(
            {"service": "checkout-api", "limit": 1}
        ),
        "deployments_bool_limit": sre.run_get_recent_deployments({"limit": True}),
        "alerts_active": sre.run_get_alerts(
            {"service": "checkout-api", "active_only": True}
        ),
        "metrics_known": sre.run_query_metrics(
            {"query": 'avg(db_connection_pool_used_percent{service="checkout-api"})'}
        ),
        "metrics_unknown": sre.run_query_metrics({"query": "up"}),
        "error_logs": sre.run_get_error_logs({"service": "checkout-api", "limit": 2}),
        "runbook_found": sre.run_lookup_runbook({"symptom": "Checkout 503"}),
        "runbook_partial": sre.run_lookup_runbook({"symptom": "checkout"}),
        "runbook_missing": sre.run_lookup_runbook({"symptom": "disk full"}),
        "prompt": sre.build_sre_prompt("checkout-api returning 503 after deploy"),
        "prompt_default": sre.build_sre_prompt(""),
    },
    "hello_world": {
        "prompt": hello_world.build_inventory_prompt(),
        "prompt_default": hello_world.build_inventory_prompt(),
    },
    "accessibility": {
        "prompt": accessibility.build_accessibility_prompt(
            "file:///tmp/page.html", "focus on contrast"
        ),
        "prompt_no_instructions": accessibility.build_accessibility_prompt(
            "file:///tmp/page.html", ""
        ),
    },
    "migration": {
        "prompt": migration.build_migration_prompt(MIGRATION_SAMPLE),
    },
}

json.dump(output, sys.stdout)
