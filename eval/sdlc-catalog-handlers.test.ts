import { analyzeCiRuns } from "../examples/flake-hunter/ts/src/tools.js";
import { checkTestPresence } from "../examples/test-presence-gate/ts/src/tools.js";
import { searchCollisions } from "../examples/duplicate-ticket-detector/ts/src/tools.js";
import { analyzeCoverageGap } from "../examples/test-coverage-agent/ts/src/tools.js";
import { listReleaseInputs } from "../examples/release-notes-drafter/ts/src/tools.js";
import { gradeTraceGrounding } from "../examples/eval-trace-grader/ts/src/tools.js";
import { getSignals as postmortemSignals } from "../examples/postmortem-drafter/ts/src/tools.js";
import { createRecord } from "../examples/alert-triage-bot/ts/src/tools.js";
import { createApprovalState } from "../examples/alert-triage-bot/ts/src/gate.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "./helpers.js";

const catalog = JSON.parse(
  readFileSync(path.join(repoRoot, "scripts/sdlc-catalog.json"), "utf8"),
) as {
  stages: { id: string; label: string }[];
  examples: { stage: string; recommendedForm?: string }[];
  foundationExamples: { recommendedForm?: string }[];
};

describe("sdlc catalog coverage", () => {
  it("lists 21 curated SDLC examples", () => {
    expect(catalog.examples).toHaveLength(21);
  });

  it("covers every SDLC stage", () => {
    const stages = new Set(catalog.examples.map((entry) => entry.stage));
    for (const stage of catalog.stages.map((item) => item.id)) {
      expect(stages.has(stage)).toBe(true);
    }
  });

  it("assigns a production home to every catalog entry", () => {
    const allowed = new Set(["Automation", "SDK", "Built-in", "Either"]);
    for (const entry of [...catalog.examples, ...catalog.foundationExamples]) {
      expect(allowed.has(entry.recommendedForm ?? "")).toBe(true);
    }
  });
});

describe("sdlc pattern handler smoke", () => {
  it("LT search_collisions returns structured collision records", () => {
    const duplicate = searchCollisions({ query: "checkout" });
    expect(duplicate.count).toBeGreaterThan(0);
    expect(duplicate.matches[0]?.prior_art_module).toContain("refund");
    const coverage = analyzeCoverageGap({ file: "src/payments/checkout.ts" });
    expect(coverage.uncovered_count).toBeGreaterThan(0);
  });

  it("ATA analyze_ci_runs computes flake rates from fixture", async () => {
    const flaky = await analyzeCiRuns({ test_file: "payments.integration.test.ts" });
    expect(flaky.is_flaky).toBe(true);
    expect(flaky.count).toBe(1);
    const stable = await analyzeCiRuns({ test_file: "checkout.unit.test.ts" });
    expect(stable.is_flaky).toBe(false);
    expect(stable.count).toBe(0);
  });

  it("PF list_release_inputs returns grounded release or digest items", () => {
    const release = listReleaseInputs({ scope: "v2.4.0" });
    expect(release.mode).toBe("release_notes");
    expect(release.count).toBeGreaterThan(0);
    const digest = listReleaseInputs({ scope: "overnight on-call alerts" });
    expect(digest.mode).toBe("on_call_digest");
    expect(digest.count).toBeGreaterThan(0);
  });

  it("BE grade_trace_grounding asserts tool order from fixture", () => {
    const grade = gradeTraceGrounding({ case_id: "accessibility-agent-tier1" });
    expect(grade.passed).toBe(true);
    expect(grade.actual_tool_order).toEqual(grade.expected_tool_order);
  });

  it("SFR check_test_presence flags missing tests in diff", () => {
    const diffPath = path.join(
      repoRoot,
      "examples/test-presence-gate/fixtures/missing-tests.diff",
    );
    const diff = readFileSync(diffPath, "utf8");
    const result = checkTestPresence({ diff });
    expect(result.passed).toBe(false);
    expect(result.count).toBe(1);
    expect(result.violations[0]?.path).toBe("src/payments/refund.ts");
  });

  it("IAG get_signals returns evidence", () => {
    expect(postmortemSignals({}).found).toBe(true);
    expect(postmortemSignals({ subject: "checkout-outage" }).signal.evidence.length).toBeGreaterThan(0);
  });

  it("CHAT side effects require approval", () => {
    const approval = createApprovalState();
    expect(createRecord({ plan: "plan", approval }).created).toBe(false);
  });
});
