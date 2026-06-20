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
sample_id = load(
    "parity_sample_id_tools",
    "examples/sample-id-reconciler/python/tools.py",
)
omics_qc = load(
    "parity_omics_qc_tools",
    "examples/omics-qc-gate/python/tools.py",
)
dataset_freshness = load(
    "parity_dataset_freshness_tools",
    "examples/dataset-freshness-monitor/python/tools.py",
)
inherited_analysis = load(
    "parity_inherited_analysis_tools",
    "examples/inherited-analysis-explainer/python/tools.py",
)
notebook_pipeline = load(
    "parity_notebook_pipeline_tools",
    "examples/notebook-pipeline-drafter/python/tools.py",
)
analysis_plan = load(
    "parity_analysis_plan_tools",
    "examples/analysis-plan-drafter/python/tools.py",
)

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
        "prompt": hello_world.build_hello_world_prompt("Ada"),
        "prompt_default": hello_world.build_hello_world_prompt("   "),
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
    "lifesci": {
        "sample_id": sample_id.reconcile_sample_ids(),
        "sample_id_prompt": sample_id.build_sample_id_reconciler_prompt(""),
        "omics_qc": omics_qc.run_omics_qc(),
        "omics_qc_prompt": omics_qc.build_omics_qc_gate_prompt(""),
        "dataset_freshness": dataset_freshness.check_dataset_freshness(),
        "dataset_freshness_prompt": dataset_freshness.build_dataset_freshness_monitor_prompt(""),
        "inherited_list": inherited_analysis.list_analysis_files({}),
        "inherited_read": inherited_analysis.read_analysis_file({"path": "README.md"}),
        "inherited_prompt": inherited_analysis.build_inherited_analysis_explainer_prompt(""),
        "notebook_draft": notebook_pipeline.load_notebook_draft(),
        "notebook_prompt": notebook_pipeline.build_notebook_pipeline_drafter_prompt(""),
        "analysis_plan": analysis_plan.load_study_context(),
        "analysis_plan_prompt": analysis_plan.build_analysis_plan_drafter_prompt(""),
    },
}

json.dump(output, sys.stdout)
