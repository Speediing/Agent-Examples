#!/usr/bin/env node
/**
 * Patch Agent-Examples tools.ts mock data to topic-specific fixtures.
 * Keeps docs and runnable examples aligned.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/sdlc-catalog.json"), "utf8"),
);
const fixtures = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/example-fixtures.json"), "utf8"),
);

const ACRONYMS = new Set([
  "api",
  "db",
  "slo",
  "adr",
  "oidc",
  "pr",
  "ci",
  "sdk",
  "crud",
  "eu",
  "semver",
]);

function agentName(slug) {
  return slug
    .split("-")
    .map((p) => (ACRONYMS.has(p) ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

function patchLookup(file, slug, facts) {
  let src = fs.readFileSync(file, "utf8");
  const factLines = facts
    .map((f) => `      { key: "${f.key}", value: "${f.value}" }`)
    .join(",\n");
  src = src.replace(
    /facts: \[[\s\S]*?\],\n    count: \d+/,
    `facts: [\n${factLines}\n    ],\n    count: ${facts.length}`,
  );
  src = src.replace(/You are the [^."\\]+/g, `You are the ${agentName(slug)}`);
  fs.writeFileSync(file, src);
}

function patchScan(file, slug, v) {
  let src = fs.readFileSync(file, "utf8");
  src = src.replace(
    /violations: \[[\s\S]*?\],\n    count: 1/,
    `violations: [\n      { id: "${v.id}", path: "${v.path}", summary: "${v.summary}" }\n    ],\n    count: 1`,
  );
  src = src.replace(/You are the [^."\\]+/g, `You are the ${agentName(slug)}`);
  fs.writeFileSync(file, src);
}

function patchAudit(file, slug, a) {
  let src = fs.readFileSync(file, "utf8");
  src = src.replace(
    /actionable: \[\{ id: "[^"]+", kind: "[^"]+", summary: "[^"]+" \}\]/,
    `actionable: [{ id: "${a.id}", kind: "${a.kind}", summary: "${a.summary}" }]`,
  );
  src = src.replace(/You are the [^."\\]+/g, `You are the ${agentName(slug)}`);
  fs.writeFileSync(file, src);
}

let patched = 0;
for (const entry of catalog.examples) {
  const file = path.join(root, "examples", entry.slug, "ts/src/tools.ts");
  if (!fs.existsSync(file)) continue;

  if (fixtures.lookup[entry.slug]) {
    patchLookup(file, entry.slug, fixtures.lookup[entry.slug]);
    patched++;
  } else if (fixtures.scan[entry.slug]) {
    patchScan(file, entry.slug, fixtures.scan[entry.slug]);
    patched++;
  } else if (fixtures.audit[entry.slug]) {
    patchAudit(file, entry.slug, fixtures.audit[entry.slug]);
    patched++;
  }
}

console.log(`Patched ${patched} example tools.ts files.`);
