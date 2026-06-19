import { describe, expect, it } from "vitest";
import {
  accessibilityCiteRulesCase,
  accessibilityRepairCase
} from "../cases/index.js";
import { llmCasesEnabled } from "../lib/runner.js";
import { runEvalCase } from "../lib/runner.js";
import { runPromptSmoke } from "../lib/run-agent.js";
import {
  buildAccessibilityPrompt,
  createAccessibilityCustomTools
} from "../../examples/accessibility-agent/ts/src/agent.js";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { copyFileSync, rmSync } from "node:fs";
import { evalConfig } from "../lib/config.js";

const fixturePath = path.join(
  evalConfig.repoRoot,
  "examples/accessibility-agent/fixtures/page-with-issues.html"
);
const scratchPath = path.join(
  evalConfig.repoRoot,
  "examples/accessibility-agent/fixtures/eval-repair-scratch.html"
);

describe.skipIf(!llmCasesEnabled())("model evals accessibility-agent", () => {
  it("calls scan_accessibility and cites fixture rule IDs in the summary", async () => {
    const result = await runEvalCase(accessibilityCiteRulesCase);
    expect(result.pass).toBe(true);
    if (!result.pass) {
      console.error(result.graderResults);
    }
  }, 180_000);

  it("repairs a local fixture copy, re-scans, and leaves the canonical fixture untouched", async () => {
    const result = await runEvalCase(accessibilityRepairCase);
    expect(result.pass).toBe(true);
    if (!result.pass) {
      console.error(result.graderResults);
    }
  }, 300_000);

  it("keeps the Agent.prompt smoke path finishing", async () => {
    copyFileSync(fixturePath, scratchPath);

    try {
      const targetUrl = pathToFileURL(scratchPath).href;
      const prompt = buildAccessibilityPrompt(targetUrl, "");
      const customTools = createAccessibilityCustomTools(targetUrl);
      const smoke = await runPromptSmoke({ prompt, customTools });
      expect(smoke.status).toBe("finished");
    } finally {
      rmSync(scratchPath, { force: true });
    }
  }, 180_000);
});
