import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixtureDir = path.join(exampleRoot, "fixtures");

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0]?.split(",") ?? [];
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export function reconcileSampleIds() {
  const lims = parseCsv(fs.readFileSync(path.join(fixtureDir, "lims.csv"), "utf8"));
  const metadata = parseCsv(
    fs.readFileSync(path.join(fixtureDir, "metadata.csv"), "utf8"),
  );
  const warehouse = parseCsv(
    fs.readFileSync(path.join(fixtureDir, "warehouse.csv"), "utf8"),
  );

  const barcodeToLims = new Map<string, string[]>();
  for (const row of lims) {
    const list = barcodeToLims.get(row.barcode) ?? [];
    list.push(row.sample_id);
    barcodeToLims.set(row.barcode, list);
  }

  const duplicateBarcodes = [...barcodeToLims.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([barcode, sample_ids]) => ({ barcode, sample_ids }));

  const warehouseIds = new Set(warehouse.map((row) => row.sample_id));
  const limsIds = new Set(lims.map((row) => row.sample_id));
  const warehouseOnly = [...warehouseIds].filter((id) => !limsIds.has(id));
  const limsOnly = [...limsIds].filter((id) => !warehouseIds.has(id));

  const metadataDupes = metadata
    .map((row) => row.barcode)
    .filter((barcode, index, all) => all.indexOf(barcode) !== index);

  const passed =
    duplicateBarcodes.length === 0 &&
    warehouseOnly.length === 0 &&
    limsOnly.length === 0 &&
    metadataDupes.length === 0;

  return {
    passed,
    counts: {
      lims_rows: lims.length,
      metadata_rows: metadata.length,
      warehouse_rows: warehouse.length,
    },
    duplicate_barcodes: duplicateBarcodes,
    warehouse_only_sample_ids: warehouseOnly,
    lims_only_sample_ids: limsOnly,
    metadata_duplicate_barcodes: [...new Set(metadataDupes)],
  };
}

export function buildSampleIdReconcilerPrompt(task: string): string {
  return [
    "You are the Sample ID Reconciler.",
    "Call reconcile_sample_ids and explain collisions using only tool JSON.",
    "Do not invent sample ids or barcodes.",
    `Task: ${task || "Reconcile sample ids across LIMS, metadata, and warehouse exports."}`,
  ].join("\n");
}

export function createSampleIdReconcilerCustomTools() {
  return {
    reconcile_sample_ids: {
      description:
        "Match barcodes and sample ids across LIMS, metadata, and warehouse fixture CSVs.",
      inputSchema: { type: "object", properties: {} },
      execute: () => reconcileSampleIds(),
    },
  };
}
