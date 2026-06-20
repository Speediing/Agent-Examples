import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixtureDir = path.join(exampleRoot, "fixtures");

type NotebookCell = { cell_type?: string; source?: string[] };

export function loadNotebookDraft() {
  const notebook = JSON.parse(
    fs.readFileSync(path.join(fixtureDir, "notebook.json"), "utf8"),
  ) as { cells?: NotebookCell[] };
  const manifest = JSON.parse(
    fs.readFileSync(path.join(fixtureDir, "manifest.json"), "utf8"),
  ) as { study_id?: string; inputs?: { path: string }[]; outputs?: string[] };

  const codeCells =
    notebook.cells?.filter((cell) => cell.cell_type === "code") ?? [];
  const stepNames = codeCells.map((_, index) => `step_${index + 1}`);

  const rules = [
    `config/config.yaml`,
    ...stepNames.map((name) => `results/${name}.done`),
    `rule all:\n    input:\n${stepNames.map((name) => `        "results/${name}.done"`).join("\n")}`,
    ...codeCells.map((cell, index) => {
      const preview = (cell.source ?? []).join("").slice(0, 80).replace(/\n/g, " ");
      return [
        `rule ${stepNames[index]}:`,
        "    output:",
        `        "results/${stepNames[index]}.done"`,
        "    shell:",
        `        'echo "TODO: port notebook cell ${index + 1}: ${preview}" > {output}'`,
        "",
      ].join("\n");
    }),
  ];

  return {
    study_id: manifest.study_id ?? "unknown",
    input_files: manifest.inputs?.map((item) => item.path) ?? [],
    output_files: manifest.outputs ?? [],
    notebook_code_cells: codeCells.length,
    snakemake_skeleton: rules.join("\n\n"),
    write_gate: "Human approval required before committing pipeline files.",
  };
}

export function buildNotebookPipelineDrafterPrompt(task: string): string {
  return [
    "You are the Notebook-to-Pipeline Drafter.",
    "Call draft_pipeline_skeleton and propose a Snakemake DAG from the notebook fixture.",
    "Treat snakemake_skeleton as a draft only. Remind the reader about write_gate.",
    `Task: ${task || "Draft a Snakemake skeleton from the notebook fixture."}`,
  ].join("\n");
}

export function createNotebookPipelineDrafterCustomTools() {
  return {
    draft_pipeline_skeleton: {
      description:
        "Read notebook + manifest fixtures and return a Snakemake skeleton string.",
      inputSchema: { type: "object", properties: {} },
      execute: () => loadNotebookDraft(),
    },
  };
}
