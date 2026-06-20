import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { EvalCaseResult } from "./types.js";
import { evalConfig } from "./config.js";

export function writeFailureArtifact(result: EvalCaseResult): string | undefined {
  if (result.pass) {
    return undefined;
  }

  const artifactsDir = path.join(evalConfig.repoRoot, "eval", "artifacts");
  mkdirSync(artifactsDir, { recursive: true });

  const timestamp = result.evidence.finishedAt.replace(/[:.]/g, "-");
  const artifactPath = path.join(
    artifactsDir,
    `${result.caseId}-${timestamp}.json`
  );

  writeFileSync(
    artifactPath,
    JSON.stringify(
      {
        caseId: result.caseId,
        pass: result.pass,
        graderResults: result.graderResults,
        evidence: result.evidence
      },
      null,
      2
    ),
    "utf8"
  );

  return artifactPath;
}
