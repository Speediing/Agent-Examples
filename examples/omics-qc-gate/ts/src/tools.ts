import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const matrixPath = path.join(exampleRoot, "fixtures", "counts-matrix.csv");

function parseCountsMatrix(content: string) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0]?.split(",") ?? [];
  const sampleColumns = headers.slice(1);
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return {
      gene: values[0] ?? "",
      counts: values.slice(1).map((value) => Number(value)),
    };
  });
  return { sampleColumns, rows };
}

export function runOmicsQc() {
  const content = fs.readFileSync(matrixPath, "utf8");
  const { sampleColumns, rows } = parseCountsMatrix(content);

  const zeroGenes = rows
    .filter((row) => row.counts.every((count) => count === 0))
    .map((row) => row.gene);
  const lowGenes = rows
    .filter((row) => {
      const total = row.counts.reduce((sum, count) => sum + count, 0);
      return total > 0 && total < 100;
    })
    .map((row) => row.gene);

  const sampleTotals = sampleColumns.map((sample, index) => ({
    sample,
    total_reads: rows.reduce((sum, row) => sum + (row.counts[index] ?? 0), 0),
  }));

  const failedSamples = sampleTotals
    .filter((entry) => entry.total_reads < 500)
    .map((entry) => entry.sample);

  const passed = zeroGenes.length === 0 && failedSamples.length === 0;

  return {
    passed,
    gene_count: rows.length,
    sample_count: sampleColumns.length,
    zero_expression_genes: zeroGenes,
    low_total_read_genes: lowGenes,
    failed_samples: failedSamples,
    sample_totals: sampleTotals,
  };
}

export function buildOmicsQcGatePrompt(task: string): string {
  return [
    "You are the Omics QC Gate.",
    "Call run_omics_qc and summarize failures using only tool JSON.",
    "Do not invent p-values, sample ids, or gene names.",
    `Task: ${task || "Run QC on the counts matrix fixture."}`,
  ].join("\n");
}

export function createOmicsQcGateCustomTools() {
  return {
    run_omics_qc: {
      description: "Compute QC metrics on the synthetic counts matrix fixture.",
      inputSchema: { type: "object", properties: {} },
      execute: () => runOmicsQc(),
    },
  };
}
