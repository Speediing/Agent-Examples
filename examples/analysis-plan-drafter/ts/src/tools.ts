import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixtureDir = path.join(exampleRoot, "fixtures");

export function loadStudyContext() {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(fixtureDir, "study-metadata.json"), "utf8"),
  ) as {
    study_id?: string;
    phase?: string;
    modality?: string;
    arms?: string[];
    primary_endpoint?: string;
    prior_sap_path?: string;
  };
  const priorSap = fs.readFileSync(
    path.join(fixtureDir, metadata.prior_sap_path ?? "prior-sap.md"),
    "utf8",
  );

  return {
    study_id: metadata.study_id ?? null,
    phase: metadata.phase ?? null,
    modality: metadata.modality ?? null,
    arms: metadata.arms ?? [],
    primary_endpoint: metadata.primary_endpoint ?? null,
    prior_sap_excerpt: priorSap.split("\n").slice(0, 12).join("\n"),
    draft_gate: "Draft only. A statistician must approve before submission.",
  };
}

export function buildAnalysisPlanDrafterPrompt(task: string): string {
  return [
    "You are the Analysis Plan Drafter.",
    "Call load_study_context and draft SAP sections grounded in the returned JSON.",
    "Do not invent endpoints, arms, or methods not present in tool output.",
    `Task: ${task || "Draft an analysis plan outline for STUDY-042."}`,
  ].join("\n");
}

export function createAnalysisPlanDrafterCustomTools() {
  return {
    load_study_context: {
      description: "Load study metadata and a prior SAP excerpt from fixtures.",
      inputSchema: { type: "object", properties: {} },
      execute: () => loadStudyContext(),
    },
  };
}
