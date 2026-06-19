import { pathToFileURL } from "node:url";
import {
  buildAccessibilityPrompt,
  createAccessibilityCustomTools
} from "../../examples/accessibility-agent/ts/src/agent.js";
import { scanAccessibility } from "../../examples/accessibility-agent/ts/src/scan.js";
import {
  addNumbers,
  buildToolCallingPrompt,
  countWords,
  createToolCallingCustomTools
} from "../../examples/tool-calling-agent/ts/src/tools.js";
import {
  buildSrePrompt,
  createSreCustomTools,
  getAlerts,
  getErrorLogs,
  getRecentDeployments,
  getServiceHealth
} from "../../examples/sre-agent/ts/src/tools.js";
import { collectArtifactRefs } from "../lib/evidence.js";
import {
  allowedToolsOnly,
  citesValues,
  createGrader,
  fileBytesUnchanged,
  groundingFromHandlers,
  readOnlyContract,
  requireAnyTool,
  requireFinished,
  requireMinToolCalls,
  requireToolArgMultiset,
  requireTools
} from "../lib/graders/index.js";
import type { EvalCase, EvalContext } from "../lib/types.js";

const FIXTURE_RELATIVE = "examples/accessibility-agent/fixtures/page-with-issues.html";
const SCRATCH_RELATIVE =
  "examples/accessibility-agent/fixtures/eval-repair-scratch.html";

const SRE_HANDLERS = {
  get_service_health: getServiceHealth,
  get_recent_deployments: getRecentDeployments,
  get_alerts: getAlerts,
  get_error_logs: getErrorLogs
} as const;

function scratchUrl(ctx: EvalContext): string {
  const scratchPath = ctx.scratchPaths.get(SCRATCH_RELATIVE);
  if (!scratchPath) {
    throw new Error(`Missing scratch path for ${SCRATCH_RELATIVE}`);
  }

  return pathToFileURL(scratchPath).href;
}

function citesScannedRuleIds(): EvalCase["graders"][number] {
  return createGrader("cites-scanned-rule-id", (evidence, ctx) => {
    const ruleIds =
      ctx.scratchPaths.get("expectedRuleIds")?.split(",").filter(Boolean) ?? [];
    return citesValues(ruleIds).grade(evidence, ctx);
  });
}

function violationCountDropped(): EvalCase["graders"][number] {
  return createGrader("violation-count-dropped", async (evidence, ctx) => {
    const beforeCount = Number(ctx.scratchPaths.get("beforeViolationCount") ?? "0");
    const after = await scanAccessibility(scratchUrl(ctx));
    const pass = after.violationCount < beforeCount;
    return {
      grader: "violation-count-dropped",
      pass,
      message: pass
        ? undefined
        : `Expected violations to drop from ${beforeCount}, got ${after.violationCount}`
    };
  });
}

function citesWordCount(): EvalCase["graders"][number] {
  return createGrader("cites-word-count", (evidence) => {
    const call = evidence.completedToolCalls.find(
      (entry) => entry.name === "word_count"
    );
    if (!call) {
      return {
        grader: "cites-word-count",
        pass: false,
        message: "word_count was not called"
      };
    }

    const expected = countWords(call.args as { text?: string });
    const pass = evidence.finalOutput.includes(String(expected.count));
    return {
      grader: "cites-word-count",
      pass,
      message: pass ? undefined : `Expected count ${expected.count} in answer`
    };
  });
}

export const accessibilityCiteRulesCase: EvalCase = {
  id: "accessibility/cite-rules",
  stage: "test",
  tier: 1,
  harness: "cursor-sdk",
  description: "Scan a fixture page and cite rule IDs from the scan output.",
  workspace: {
    copyFiles: [{ from: FIXTURE_RELATIVE, to: SCRATCH_RELATIVE }],
    cleanupPaths: [SCRATCH_RELATIVE]
  },
  async prepare(ctx) {
    const scan = await scanAccessibility(scratchUrl(ctx));
    ctx.scratchPaths.set(
      "expectedRuleIds",
      scan.violations.map((violation) => violation.id).join(",")
    );
    ctx.scratchPaths.set(
      "fixtureSha256",
      collectArtifactRefs(ctx.repoRoot, [FIXTURE_RELATIVE])[0]!.sha256
    );
  },
  async run(ctx) {
    const targetUrl = scratchUrl(ctx);
    return {
      prompt: buildAccessibilityPrompt(targetUrl, ""),
      customTools: createAccessibilityCustomTools(targetUrl)
    };
  },
  graders: [requireFinished, requireTools(["scan_accessibility"]), citesScannedRuleIds()]
};

export const accessibilityRepairCase: EvalCase = {
  id: "accessibility/repair-fixture",
  stage: "test",
  tier: 1,
  harness: "cursor-sdk",
  description:
    "Repair a scratch copy of the accessibility fixture and reduce violations.",
  workspace: {
    copyFiles: [{ from: FIXTURE_RELATIVE, to: SCRATCH_RELATIVE }],
    cleanupPaths: [SCRATCH_RELATIVE]
  },
  async prepare(ctx) {
    const before = await scanAccessibility(scratchUrl(ctx));
    ctx.scratchPaths.set("beforeViolationCount", String(before.violationCount));
    ctx.scratchPaths.set(
      "fixtureSha256",
      collectArtifactRefs(ctx.repoRoot, [FIXTURE_RELATIVE])[0]!.sha256
    );
  },
  async run(ctx) {
    const targetUrl = scratchUrl(ctx);
    return {
      prompt: buildAccessibilityPrompt(targetUrl, ""),
      customTools: createAccessibilityCustomTools(targetUrl)
    };
  },
  graders: [
    requireFinished,
    requireMinToolCalls("scan_accessibility", 2),
    createGrader("file-bytes-unchanged", (evidence, ctx) => {
      const expectedSha = ctx.scratchPaths.get("fixtureSha256") ?? "";
      return fileBytesUnchanged(FIXTURE_RELATIVE, expectedSha).grade(evidence, ctx);
    }),
    violationCountDropped()
  ]
};

export const toolCallingAddCase: EvalCase = {
  id: "tool-calling/add-3-9",
  stage: "develop",
  tier: 1,
  harness: "cursor-sdk",
  description: "Call add with [3, 9] and ground the answer in the handler result.",
  async run() {
    return {
      prompt: buildToolCallingPrompt("add 3 and 9"),
      customTools: createToolCallingCustomTools()
    };
  },
  graders: [
    requireFinished,
    allowedToolsOnly(new Set(["add", "word_count"])),
    requireToolArgMultiset("add", [3, 9]),
    citesValues([String(addNumbers({ numbers: [3, 9] }).total)])
  ]
};

export const toolCallingWordCountCase: EvalCase = {
  id: "tool-calling/word-count",
  stage: "develop",
  tier: 1,
  harness: "cursor-sdk",
  description: "Call word_count for the default request and cite the count.",
  async run() {
    return {
      prompt: buildToolCallingPrompt(""),
      customTools: createToolCallingCustomTools()
    };
  },
  graders: [
    requireFinished,
    allowedToolsOnly(new Set(["add", "word_count"])),
    requireTools(["word_count"]),
    citesWordCount()
  ]
};

export const sreCheckout503Case: EvalCase = {
  id: "sre/checkout-503",
  stage: "operate",
  tier: 1,
  harness: "cursor-sdk",
  description:
    "Investigate checkout-api 503s with the causal tool core and stay read-only.",
  async run() {
    const incident = "checkout-api returning 503 after deploy";
    return {
      prompt: buildSrePrompt(incident),
      customTools: createSreCustomTools()
    };
  },
  graders: [
    requireFinished,
    requireTools(["get_service_health", "get_recent_deployments"]),
    requireAnyTool(["get_error_logs", "get_alerts"]),
    groundingFromHandlers(SRE_HANDLERS),
    readOnlyContract
  ]
};

export const evalCases: EvalCase[] = [
  accessibilityCiteRulesCase,
  accessibilityRepairCase,
  toolCallingAddCase,
  toolCallingWordCountCase,
  sreCheckout503Case
];

export function getEvalCase(caseId: string): EvalCase | undefined {
  return evalCases.find((evalCase) => evalCase.id === caseId);
}

export function listEvalCases(options?: { tier?: 0 | 1 | 2 }): EvalCase[] {
  if (options?.tier === undefined) {
    return evalCases;
  }

  return evalCases.filter((evalCase) => evalCase.tier === options.tier);
}
