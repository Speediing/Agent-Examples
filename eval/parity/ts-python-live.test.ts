import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  addNumbers,
  buildToolCallingPrompt,
  countWords
} from "../../examples/tool-calling-agent/ts/src/tools.js";
import {
  buildSrePrompt,
  getAlerts,
  getErrorLogs,
  getRecentDeployments,
  getServiceHealth,
  lookupRunbook,
  queryMetrics
} from "../../examples/sre-agent/ts/src/tools.js";
import { buildHelloWorldPrompt } from "../../examples/hello-world/ts/src/agent.js";
import { buildAccessibilityPrompt } from "../../examples/accessibility-agent/ts/src/agent.js";
import { buildMigrationPrompt } from "../../examples/migration-agent/ts/src/prompt.js";
import { listAnalysisFiles, readAnalysisFile, buildInheritedAnalysisExplainerPrompt } from "../../examples/inherited-analysis-explainer/ts/src/tools.js";
import { reconcileSampleIds, buildSampleIdReconcilerPrompt } from "../../examples/sample-id-reconciler/ts/src/tools.js";
import { loadNotebookDraft, buildNotebookPipelineDrafterPrompt } from "../../examples/notebook-pipeline-drafter/ts/src/tools.js";
import { runOmicsQc, buildOmicsQcGatePrompt } from "../../examples/omics-qc-gate/ts/src/tools.js";
import { loadStudyContext, buildAnalysisPlanDrafterPrompt } from "../../examples/analysis-plan-drafter/ts/src/tools.js";
import { checkDatasetFreshness, buildDatasetFreshnessMonitorPrompt } from "../../examples/dataset-freshness-monitor/ts/src/tools.js";
import { normalize } from "./normalize.js";

const scriptPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "dump_python_outputs.py"
);

function pythonAvailable(): boolean {
  return spawnSync("python3", ["--version"]).status === 0;
}

const MIGRATION_SAMPLE = [
  {
    status: "stale",
    example: "sre-agent",
    message:
      "examples/sre-agent/python/main.py is older than the TypeScript source"
  }
];

describe.skipIf(!pythonAvailable())("ts↔python live parity", () => {
  const py = JSON.parse(
    execFileSync("python3", [scriptPath], { encoding: "utf8" })
  );

  it("matches tool-calling handler outputs and prompts", () => {
    expect(normalize(py.tool_calling.add)).toEqual(
      normalize(addNumbers({ numbers: [3, 9, 2.5] }))
    );
    expect(normalize(py.tool_calling.add_rejects_non_numbers)).toEqual(
      normalize(addNumbers({ numbers: [3, true, "4", 9] as never }))
    );
    expect(normalize(py.tool_calling.word_count)).toEqual(
      normalize(countWords({ text: "  one two   three " }))
    );
    expect(py.tool_calling.prompt).toBe(buildToolCallingPrompt("add 3 and 9"));
    expect(py.tool_calling.prompt_default).toBe(buildToolCallingPrompt(""));
  });

  it("matches sre handler outputs", () => {
    expect(normalize(py.sre.service_health_known)).toEqual(
      normalize(getServiceHealth({ service: "checkout-api" }))
    );
    expect(normalize(py.sre.service_health_unknown)).toEqual(
      normalize(getServiceHealth({ service: "ghost-api" }))
    );
    expect(normalize(py.sre.deployments_limited)).toEqual(
      normalize(getRecentDeployments({ service: "checkout-api", limit: 1 }))
    );
    expect(normalize(py.sre.deployments_bool_limit)).toEqual(
      normalize(getRecentDeployments({ limit: true }))
    );
    expect(normalize(py.sre.alerts_active)).toEqual(
      normalize(getAlerts({ service: "checkout-api", active_only: true }))
    );
    expect(normalize(py.sre.metrics_known)).toEqual(
      normalize(
        queryMetrics({
          query: 'avg(db_connection_pool_used_percent{service="checkout-api"})'
        })
      )
    );
    expect(normalize(py.sre.metrics_unknown)).toEqual(
      normalize(queryMetrics({ query: "up" }))
    );
    expect(normalize(py.sre.error_logs)).toEqual(
      normalize(getErrorLogs({ service: "checkout-api", limit: 2 }))
    );
    expect(normalize(py.sre.runbook_found)).toEqual(
      normalize(lookupRunbook({ symptom: "Checkout 503" }))
    );
    expect(normalize(py.sre.runbook_partial)).toEqual(
      normalize(lookupRunbook({ symptom: "checkout" }))
    );
    expect(normalize(py.sre.runbook_missing)).toEqual(
      normalize(lookupRunbook({ symptom: "disk full" }))
    );
  });

  it("matches prompt builders across all agents", () => {
    expect(py.sre.prompt).toBe(
      buildSrePrompt("checkout-api returning 503 after deploy")
    );
    expect(py.sre.prompt_default).toBe(buildSrePrompt(""));
    expect(py.hello_world.prompt).toBe(buildHelloWorldPrompt("Ada"));
    expect(py.hello_world.prompt_default).toBe(buildHelloWorldPrompt("   "));
    expect(py.accessibility.prompt).toBe(
      buildAccessibilityPrompt("file:///tmp/page.html", "focus on contrast")
    );
    expect(py.accessibility.prompt_no_instructions).toBe(
      buildAccessibilityPrompt("file:///tmp/page.html", "")
    );
    expect(py.migration.prompt).toBe(buildMigrationPrompt(MIGRATION_SAMPLE));
  });

  it("matches lifesci handler outputs and prompts", () => {
    expect(normalize(py.lifesci.sample_id)).toEqual(normalize(reconcileSampleIds()));
    expect(py.lifesci.sample_id_prompt).toBe(buildSampleIdReconcilerPrompt(""));
    expect(normalize(py.lifesci.omics_qc)).toEqual(normalize(runOmicsQc()));
    expect(py.lifesci.omics_qc_prompt).toBe(buildOmicsQcGatePrompt(""));
    expect(normalize(py.lifesci.dataset_freshness)).toEqual(
      normalize(checkDatasetFreshness())
    );
    expect(py.lifesci.dataset_freshness_prompt).toBe(
      buildDatasetFreshnessMonitorPrompt("")
    );
    expect(normalize(py.lifesci.inherited_list)).toEqual(
      normalize(listAnalysisFiles({}))
    );
    expect(normalize(py.lifesci.inherited_read)).toEqual(
      normalize(readAnalysisFile({ path: "README.md" }))
    );
    expect(py.lifesci.inherited_prompt).toBe(
      buildInheritedAnalysisExplainerPrompt("")
    );
    expect(normalize(py.lifesci.notebook_draft)).toEqual(normalize(loadNotebookDraft()));
    expect(py.lifesci.notebook_prompt).toBe(buildNotebookPipelineDrafterPrompt(""));
    expect(normalize(py.lifesci.analysis_plan)).toEqual(normalize(loadStudyContext()));
    expect(py.lifesci.analysis_plan_prompt).toBe(buildAnalysisPlanDrafterPrompt(""));
  });
});
