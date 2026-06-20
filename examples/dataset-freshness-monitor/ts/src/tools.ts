import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const catalogPath = path.join(exampleRoot, "fixtures", "datasets.json");

type DatasetRecord = {
  dataset: string;
  owner: string;
  sla_hours: number;
  last_landed_at: string;
  as_of: string;
};

function hoursBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return (end - start) / (1000 * 60 * 60);
}

export function checkDatasetFreshness() {
  const records = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as DatasetRecord[];
  const breaches = records
    .map((record) => {
      const ageHours = hoursBetween(record.last_landed_at, record.as_of);
      return {
        dataset: record.dataset,
        owner: record.owner,
        sla_hours: record.sla_hours,
        age_hours: Math.round(ageHours * 10) / 10,
        breached: ageHours > record.sla_hours,
      };
    })
    .filter((entry) => entry.breached);

  return {
    passed: breaches.length === 0,
    dataset_count: records.length,
    breaches,
    checked_at: records[0]?.as_of ?? null,
  };
}

export function buildDatasetFreshnessMonitorPrompt(task: string): string {
  return [
    "You are the Dataset Freshness Monitor.",
    "Call check_dataset_freshness and triage SLA breaches using only tool JSON.",
    "Recommend an owner from the tool output for each breach.",
    `Task: ${task || "Check dataset landing SLAs."}`,
  ].join("\n");
}

export function createDatasetFreshnessMonitorCustomTools() {
  return {
    check_dataset_freshness: {
      description: "Compare dataset landing times against SLA thresholds in fixtures.",
      inputSchema: { type: "object", properties: {} },
      execute: () => checkDatasetFreshness(),
    },
  };
}
