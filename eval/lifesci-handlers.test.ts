import { describe, expect, it } from "vitest";
import { loadStudyContext } from "../examples/analysis-plan-drafter/ts/src/tools.js";
import { checkDatasetFreshness } from "../examples/dataset-freshness-monitor/ts/src/tools.js";
import {
  listAnalysisFiles,
  readAnalysisFile,
} from "../examples/inherited-analysis-explainer/ts/src/tools.js";
import { loadNotebookDraft } from "../examples/notebook-pipeline-drafter/ts/src/tools.js";
import { runOmicsQc } from "../examples/omics-qc-gate/ts/src/tools.js";
import { reconcileSampleIds } from "../examples/sample-id-reconciler/ts/src/tools.js";

describe("lifesci handlers", () => {
  it("lists inherited analysis fixture files", () => {
    const result = listAnalysisFiles({});
    expect(result.found).toBe(true);
    expect(result.files).toContain("analysis.R");
  });

  it("reads inherited analysis README", () => {
    const result = readAnalysisFile({ path: "README.md" });
    expect(result.found).toBe(true);
    expect(result.content).toContain("STUDY-042");
  });

  it("flags sample id collisions in fixture CSVs", () => {
    const result = reconcileSampleIds();
    expect(result.passed).toBe(false);
    expect(result.duplicate_barcodes.length).toBeGreaterThan(0);
    expect(result.warehouse_only_sample_ids).toContain("S005");
  });

  it("drafts a snakemake skeleton from notebook fixture", () => {
    const result = loadNotebookDraft();
    expect(result.study_id).toBe("STUDY-042");
    expect(result.notebook_code_cells).toBe(2);
    expect(result.snakemake_skeleton).toContain("rule step_1");
  });

  it("fails omics QC on zero-expression genes", () => {
    const result = runOmicsQc();
    expect(result.passed).toBe(false);
    expect(result.zero_expression_genes).toContain("TP53");
    expect(result.failed_samples).toContain("S003");
  });

  it("loads study context for analysis plan drafting", () => {
    const result = loadStudyContext();
    expect(result.study_id).toBe("STUDY-042");
    expect(result.primary_endpoint).toContain("GAPDH");
    expect(result.draft_gate).toContain("statistician");
  });

  it("detects dataset freshness SLA breaches", () => {
    const result = checkDatasetFreshness();
    expect(result.passed).toBe(false);
    expect(result.breaches.length).toBeGreaterThan(0);
  });
});
