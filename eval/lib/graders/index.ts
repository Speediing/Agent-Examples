import {
  assertReadOnlyContract,
  collectGroundingValues,
  findNovelGroundingCitation
} from "../grounding.js";
import { numbersMultiset } from "../trace.js";
import type { Grader, GraderResult, RunEvidence } from "../types.js";

export function createGrader(
  name: string,
  grade: Grader["grade"]
): Grader {
  return { name, grade };
}

export async function gradeAll(
  graders: Grader[],
  evidence: RunEvidence,
  ctx: Parameters<Grader["grade"]>[1]
): Promise<GraderResult[]> {
  const results: GraderResult[] = [];
  for (const grader of graders) {
    results.push(await grader.grade(evidence, ctx));
  }
  return results;
}

export function allGradersPassed(results: GraderResult[]): boolean {
  return results.every((result) => result.pass);
}

export const requireFinished: Grader = createGrader(
  "require-finished",
  (evidence) => ({
    grader: "require-finished",
    pass: evidence.status === "finished",
    message:
      evidence.status === "finished"
        ? undefined
        : `Expected status finished, got ${evidence.status}`
  })
);

export function requireTools(toolNames: string[]): Grader {
  return createGrader(`require-tools:${toolNames.join(",")}`, (evidence) => {
    const observed = new Set(evidence.completedToolCalls.map((call) => call.name));
    const missing = toolNames.filter((name) => !observed.has(name));
    return {
      grader: `require-tools:${toolNames.join(",")}`,
      pass: missing.length === 0,
      message:
        missing.length === 0 ? undefined : `Missing tools: ${missing.join(", ")}`
    };
  });
}

export function allowedToolsOnly(allowed: Set<string>): Grader {
  return createGrader("allowed-tools-only", (evidence) => {
    const unexpected = evidence.completedToolCalls
      .map((call) => call.name)
      .filter((name) => !allowed.has(name));
    return {
      grader: "allowed-tools-only",
      pass: unexpected.length === 0,
      message:
        unexpected.length === 0
          ? undefined
          : `Unexpected tools: ${unexpected.join(", ")}`
    };
  });
}

export function requireToolArgMultiset(
  toolName: string,
  expected: number[]
): Grader {
  return createGrader(`require-tool-args:${toolName}`, (evidence) => {
    const call = evidence.completedToolCalls.find((entry) => entry.name === toolName);
    if (!call) {
      return {
        grader: `require-tool-args:${toolName}`,
        pass: false,
        message: `Tool ${toolName} was not called`
      };
    }

    const observed = numbersMultiset(call.args).sort((left, right) => left - right);
    const wanted = [...expected].sort((left, right) => left - right);
    const pass =
      observed.length === wanted.length &&
      observed.every((value, index) => value === wanted[index]);

    return {
      grader: `require-tool-args:${toolName}`,
      pass,
      message: pass
        ? undefined
        : `Expected args ${wanted.join(",")}, got ${observed.join(",")}`
    };
  });
}

export function groundingFromHandlers(
  handlers: Record<string, (args: Record<string, unknown>) => unknown>
): Grader {
  return createGrader("grounding-from-handlers", (evidence) => {
    const recomputed = evidence.completedToolCalls
      .filter((call) => call.name in handlers)
      .map((call) => handlers[call.name]!(call.args));

    const groundingValues = collectGroundingValues(recomputed);
    const citation = findNovelGroundingCitation(
      evidence.finalOutput,
      groundingValues,
      evidence.prompt
    );

    return {
      grader: "grounding-from-handlers",
      pass: Boolean(citation),
      message: citation ? undefined : "Final answer did not cite novel tool output"
    };
  });
}

export function citesValues(values: string[]): Grader {
  return createGrader("cites-values", (evidence) => {
    const answer = evidence.finalOutput.toLowerCase();
    const cited = values.find((value) => answer.includes(value.toLowerCase()));
    return {
      grader: "cites-values",
      pass: Boolean(cited),
      message: cited ? undefined : `Expected one of: ${values.join(", ")}`
    };
  });
}

export const readOnlyContract: Grader = createGrader(
  "read-only-contract",
  (evidence) => {
    try {
      assertReadOnlyContract(evidence.finalOutput);
      return { grader: "read-only-contract", pass: true };
    } catch (error) {
      return {
        grader: "read-only-contract",
        pass: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

export function fileBytesUnchanged(
  relativePath: string,
  expectedSha256: string
): Grader {
  return createGrader(`file-bytes-unchanged:${relativePath}`, (evidence, ctx) => {
    const artifact = evidence.artifacts.find(
      (entry) => entry.path === relativePath
    );
    const pass = artifact?.sha256 === expectedSha256;
    return {
      grader: `file-bytes-unchanged:${relativePath}`,
      pass,
      message: pass
        ? undefined
        : `Expected sha256 ${expectedSha256}, observed ${artifact?.sha256 ?? "missing"} for ${relativePath}`
    };
  });
}

export function workspaceDiffOnlyAllows(allowedPaths: string[]): Grader {
  return createGrader("workspace-diff-only-allows", (evidence) => {
    const changedPaths = evidence.workspace.diff
      .split("\n")
      .filter((line) => line.startsWith("+++ b/") || line.startsWith("--- a/"))
      .map((line) => line.replace(/^(--- a\/|\+\+\+ b\/)/, ""))
      .filter((value, index, array) => array.indexOf(value) === index);

    const unexpected = changedPaths.filter(
      (changedPath) => !allowedPaths.includes(changedPath)
    );

    return {
      grader: "workspace-diff-only-allows",
      pass: unexpected.length === 0,
      message:
        unexpected.length === 0
          ? undefined
          : `Unexpected diff paths: ${unexpected.join(", ")}`
    };
  });
}

export function requireMinToolCalls(toolName: string, minimum: number): Grader {
  return createGrader(`require-min-tool-calls:${toolName}`, (evidence) => {
    const count = evidence.completedToolCalls.filter(
      (call) => call.name === toolName
    ).length;
    return {
      grader: `require-min-tool-calls:${toolName}`,
      pass: count >= minimum,
      message:
        count >= minimum
          ? undefined
          : `Expected at least ${minimum} ${toolName} calls, got ${count}`
    };
  });
}

export function requireAnyTool(toolNames: string[]): Grader {
  return createGrader(`require-any-tool:${toolNames.join("|")}`, (evidence) => {
    const observed = new Set(evidence.completedToolCalls.map((call) => call.name));
    const matched = toolNames.find((name) => observed.has(name));
    return {
      grader: `require-any-tool:${toolNames.join("|")}`,
      pass: Boolean(matched),
      message: matched ? undefined : `Expected one of: ${toolNames.join(", ")}`
    };
  });
}
