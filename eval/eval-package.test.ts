import { describe, expect, it } from "vitest";
import {
  accessibilityCiteRulesCase,
  evalCases,
  getEvalCase,
  listEvalCases
} from "./cases/index.js";
import {
  allGradersPassed,
  citesValues,
  gradeAll,
  requireFinished,
  requireTools
} from "./lib/graders/index.js";
import { prepareWorkspace, cleanupWorkspace } from "./lib/workspace.js";
import type { RunEvidence } from "./lib/types.js";

describe("agent eval package", () => {
  it("registers SDLC cases with unique ids", () => {
    const ids = evalCases.map((evalCase) => evalCase.id);
    expect(ids.length).toBe(new Set(ids).size);
    expect(getEvalCase("accessibility/cite-rules")).toBe(accessibilityCiteRulesCase);
  });

  it("filters cases by requiresModel", () => {
    const modelCases = listEvalCases({ requiresModel: true });
    expect(modelCases.every((evalCase) => evalCase.requiresModel)).toBe(true);
    expect(modelCases.length).toBeGreaterThan(0);
  });

  it("grades evidence with composable graders", async () => {
    const evidence: RunEvidence = {
      caseId: "fixture",
      requestIds: [],
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:00:01.000Z",
      finalOutput: "image-alt is missing on the hero image",
      status: "finished",
      prompt: "audit the page",
      messages: [],
      completedToolCalls: [
        {
          callId: "call-1",
          name: "scan_accessibility",
          args: { url: "file:///tmp/page.html" },
          status: "completed",
          truncated: false
        }
      ],
      workspace: {
        cwd: "/tmp",
        gitBefore: "abc",
        gitAfter: "abc",
        diff: ""
      },
      tests: [],
      artifacts: []
    };

    const ctx = prepareWorkspace();
    const results = await gradeAll(
      [requireFinished, requireTools(["scan_accessibility"]), citesValues(["image-alt"])],
      evidence,
      ctx
    );
    cleanupWorkspace(ctx);

    expect(allGradersPassed(results)).toBe(true);
  });

  it("seeds and cleans up scratch workspaces", () => {
    const seed = accessibilityCiteRulesCase.workspace;
    const ctx = prepareWorkspace(seed);
    expect(ctx.scratchPaths.get(seed!.cleanupPaths[0]!)).toBeTruthy();
    cleanupWorkspace(ctx, seed);
  });
});
