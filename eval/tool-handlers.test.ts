import { describe, expect, it } from "vitest";
import {
  addNumbers,
  countWords,
  readNumberArray
} from "../examples/tool-calling-agent/ts/src/tools.js";
import {
  getAlerts,
  getErrorLogs,
  getRecentDeployments,
  getServiceHealth,
  lookupRunbook,
  queryMetrics
} from "../examples/sre-agent/ts/src/tools.js";

describe("tool-calling handlers", () => {
  it("adds numbers and formats the expression", () => {
    expect(addNumbers({ numbers: [3, 9] })).toEqual({
      expression: "3 + 9",
      total: 12
    });
  });

  it("ignores non-number entries in add", () => {
    expect(readNumberArray(["x", 2, true])).toEqual([2]);
    expect(addNumbers({ numbers: ["x", 2] as unknown as number[] })).toEqual({
      expression: "2",
      total: 2
    });
  });

  it("counts words in text", () => {
    expect(countWords({ text: "one two three" })).toEqual({ count: 3 });
    expect(countWords({ text: "   " })).toEqual({ count: 0 });
  });
});

describe("sre handlers", () => {
  it("returns checkout-api health facts", () => {
    const result = getServiceHealth({ service: "checkout-api" });
    expect(result.found).toBe(true);
    expect(result.health?.status).toBe("critical");
  });

  it("lists known services when a service is unknown", () => {
    const result = getServiceHealth({ service: "unknown-service" });
    expect(result.found).toBe(false);
    expect(result.known_services).toContain("checkout-api");
  });

  it("filters deployments by service", () => {
    const result = getRecentDeployments({ service: "checkout-api", limit: 2 });
    expect(result.count).toBeGreaterThan(0);
    expect(result.deployments.every((item) => item.service === "checkout-api")).toBe(
      true
    );
  });

  it("returns active alerts for a service", () => {
    const result = getAlerts({ service: "checkout-api", active_only: true });
    expect(result.count).toBeGreaterThan(0);
    expect(result.alerts.every((alert) => !alert.resolved)).toBe(true);
  });

  it("returns null for unknown PromQL queries", () => {
    const result = queryMetrics({ query: "up" });
    expect(result.value).toBeNull();
    expect(result.known_queries.length).toBeGreaterThan(0);
  });

  it("returns error logs for a service", () => {
    const result = getErrorLogs({ service: "checkout-api", limit: 3 });
    expect(result.count).toBeGreaterThan(0);
    expect(result.lines.length).toBeLessThanOrEqual(3);
  });

  it("finds a runbook by symptom", () => {
    const result = lookupRunbook({ symptom: "checkout 503" });
    expect(result.found).toBe(true);
    expect(result.runbook?.steps.length).toBeGreaterThan(0);
  });
});
