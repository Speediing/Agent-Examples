import { describe, expect, it } from "vitest";
import {
  addNumbers,
  countWords
} from "../../examples/tool-calling-agent/ts/src/tools.js";
import {
  getAlerts,
  getRecentDeployments,
  getServiceHealth,
  lookupRunbook,
  queryMetrics
} from "../../examples/sre-agent/ts/src/tools.js";
import { reconcileSampleIds } from "../../examples/sample-id-reconciler/ts/src/tools.js";
import { runOmicsQc } from "../../examples/omics-qc-gate/ts/src/tools.js";
import { checkDatasetFreshness } from "../../examples/dataset-freshness-monitor/ts/src/tools.js";
import { normalize } from "./normalize.js";

describe("ts↔python deterministic parity", () => {
  it("matches tool-calling add output shape", () => {
    const ts = addNumbers({ numbers: [3, 9] });
    const py = {
      expression: "3 + 9",
      total: 12
    };
    expect(normalize(ts)).toEqual(normalize(py));
  });

  it("matches tool-calling word_count output shape", () => {
    expect(countWords({ text: "one two three" })).toEqual({ count: 3 });
  });

  it("matches sre handler outputs for checkout-api", () => {
    const health = getServiceHealth({ service: "checkout-api" });
    expect(health.found).toBe(true);
    expect(health.health?.status).toBe("critical");

    const deployments = getRecentDeployments({
      service: "checkout-api",
      limit: 1
    });
    expect(deployments.count).toBe(1);

    const alerts = getAlerts({ service: "checkout-api", active_only: true });
    expect(alerts.count).toBeGreaterThan(0);

    const metrics = queryMetrics({ query: "up" });
    expect(metrics.value).toBeNull();

    const runbook = lookupRunbook({ symptom: "checkout 503" });
    expect(runbook.found).toBe(true);
  });

  it("matches lifesci handler output shapes", () => {
    const sampleIds = reconcileSampleIds();
    expect(sampleIds.passed).toBe(false);
    expect(sampleIds.duplicate_barcodes.length).toBeGreaterThan(0);

    const qc = runOmicsQc();
    expect(qc.passed).toBe(false);
    expect(qc.zero_expression_genes).toContain("TP53");

    const freshness = checkDatasetFreshness();
    expect(freshness.passed).toBe(false);
    expect(freshness.breaches.length).toBeGreaterThan(0);
  });
});
