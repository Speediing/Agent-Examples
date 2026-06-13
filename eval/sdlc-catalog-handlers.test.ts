import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lookupContext as duplicateLookup } from "../examples/duplicate-ticket-detector/ts/src/tools.js";
import { auditState as backlogAudit } from "../examples/backlog-groomer/ts/src/tools.js";
import { buildRoadmapDigestPrompt } from "../examples/roadmap-digest/ts/src/tools.js";
import { scanTarget as conventionScan } from "../examples/convention-reviewer/ts/src/tools.js";
import { getSignals as securitySignals } from "../examples/security-review-agent/ts/src/tools.js";
import { lookupContext as testCoverageLookup } from "../examples/test-coverage-agent/ts/src/tools.js";
import { buildEvalTraceGraderPrompt } from "../examples/eval-trace-grader/ts/src/tools.js";
import { buildReleaseNotesDrafterPrompt } from "../examples/release-notes-drafter/ts/src/tools.js";
import { getSignals as postmortemSignals } from "../examples/postmortem-drafter/ts/src/tools.js";
import { createRecord } from "../examples/alert-triage-bot/ts/src/tools.js";
import { createApprovalState } from "../examples/alert-triage-bot/ts/src/gate.js";
import { repoRoot } from "./helpers.js";

const catalog = JSON.parse(
  readFileSync(path.join(repoRoot, "scripts/sdlc-catalog.json"), "utf8"),
) as {
  stages: { id: string; label: string }[];
  examples: { stage: string }[];
};

describe("sdlc catalog coverage", () => {
  it("lists 50 roadmap examples", () => {
    expect(catalog.examples).toHaveLength(50);
  });

  it("covers every SDLC stage", () => {
    const stages = new Set(catalog.examples.map((entry) => entry.stage));
    for (const stage of catalog.stages.map((item) => item.id)) {
      expect(stages.has(stage)).toBe(true);
    }
  });
});

describe("sdlc pattern handler smoke", () => {
  it("LT lookup_context returns structured facts", () => {
    expect(duplicateLookup({ query: "checkout" }).count).toBeGreaterThan(0);
    expect(testCoverageLookup({}).found).toBe(true);
  });

  it("ATA audit_state returns actionable records", () => {
    expect(backlogAudit({ scope: "backlog" }).count).toBe(1);
  });

  it("PF prompt builders embed the task", () => {
    expect(buildRoadmapDigestPrompt("week 12")).toContain("week 12");
    expect(buildReleaseNotesDrafterPrompt("v1.2")).toContain("v1.2");
    expect(buildEvalTraceGraderPrompt("traces")).toContain("traces");
  });

  it("SFR scan_target returns violations", () => {
    expect(conventionScan({ target: "diff" }).count).toBe(1);
  });

  it("IAG get_signals returns evidence", () => {
    expect(securitySignals({ subject: "checkout-api" }).signal.evidence.length).toBeGreaterThan(0);
    expect(postmortemSignals({}).found).toBe(true);
  });

  it("CHAT side effects require approval", () => {
    const approval = createApprovalState();
    expect(createRecord({ plan: "plan", approval }).created).toBe(false);
  });
});
