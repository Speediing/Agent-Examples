import { copyFileSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildAccessibilityPrompt,
  createAccessibilityCustomTools
} from "../../examples/accessibility-agent/ts/src/agent.js";
import {
  defaultFixtureUrl,
  scanAccessibility
} from "../../examples/accessibility-agent/ts/src/scan.js";
import { evalConfig, llmEvalsEnabled, requireLlmEvals } from "../lib/config.js";
import { runLocalAgent, runPromptSmoke } from "../lib/run-agent.js";

const fixturePath = path.join(
  evalConfig.repoRoot,
  "examples/accessibility-agent/fixtures/page-with-issues.html"
);
const scratchPath = path.join(
  evalConfig.repoRoot,
  "examples/accessibility-agent/fixtures/eval-repair-scratch.html"
);

describe.skipIf(!llmEvalsEnabled())("tier1 accessibility-agent", () => {
  it("calls scan_accessibility and cites fixture rule IDs in the summary", async () => {
    requireLlmEvals();
    const targetUrl = defaultFixtureUrl();
    const scan = await scanAccessibility(targetUrl);
    const ruleIds = scan.violations.map((violation) => violation.id);
    expect(ruleIds.length).toBeGreaterThan(0);

    const prompt = buildAccessibilityPrompt(targetUrl, "");
    const customTools = createAccessibilityCustomTools(targetUrl);
    const outcome = await runLocalAgent({ prompt, customTools });
    const smoke = await runPromptSmoke({ prompt, customTools });

    expect(outcome.result.status).toBe("finished");
    expect(smoke.status).toBe("finished");

    const scanCalls = outcome.completedToolCalls.filter(
      (call) => call.name === "scan_accessibility"
    );
    expect(scanCalls.length).toBeGreaterThan(0);

    const answer = (outcome.result.result ?? "").toLowerCase();
    const citedRule = ruleIds.find((ruleId) =>
      answer.includes(ruleId.toLowerCase())
    );
    expect(citedRule).toBeTruthy();
  }, 180_000);

  it("repairs a local fixture copy, re-scans, and leaves the canonical fixture untouched", async () => {
    requireLlmEvals();
    const originalFixture = readFileSync(fixturePath, "utf8");
    copyFileSync(fixturePath, scratchPath);

    try {
      const scratchUrl = pathToFileURL(scratchPath).href;
      const before = await scanAccessibility(scratchUrl);
      expect(before.violationCount).toBeGreaterThan(0);

      const prompt = buildAccessibilityPrompt(scratchUrl, "");
      const customTools = createAccessibilityCustomTools(scratchUrl);
      const outcome = await runLocalAgent({ prompt, customTools });

      expect(outcome.result.status).toBe("finished");

      const scanCalls = outcome.completedToolCalls.filter(
        (call) => call.name === "scan_accessibility"
      );
      expect(scanCalls.length).toBeGreaterThanOrEqual(2);

      const after = await scanAccessibility(scratchUrl);
      expect(after.violationCount).toBeLessThan(before.violationCount);

      expect(readFileSync(fixturePath, "utf8")).toBe(originalFixture);
    } finally {
      rmSync(scratchPath, { force: true });
    }
  }, 300_000);
});
