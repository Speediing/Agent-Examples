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

function normalize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : Math.round(value * 1000) / 1000;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, normalize(nested)]);

    return Object.fromEntries(entries);
  }

  return value;
}

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
});
