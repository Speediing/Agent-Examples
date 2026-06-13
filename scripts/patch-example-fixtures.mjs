#!/usr/bin/env node
/**
 * Patch Agent-Examples tools.ts and tools.py mock data to topic-specific fixtures.
 * Keeps TS/Python ports and runnable examples aligned.
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

function patchLookupPy(file, slug, facts) {
  let src = fs.readFileSync(file, "utf8");
  const factLines = facts
    .map((f) => `            {"key": "${f.key}", "value": "${f.value}"}`)
    .join(",\n");
  src = src.replace(
    /"facts": \[[\s\S]*?\],\n        "count": \d+/,
    `"facts": [\n${factLines}\n        ],\n        "count": ${facts.length}`,
  );
  src = src.replace(/"You are the [^"]+"/g, `"You are the ${agentName(slug)}."`);
  fs.writeFileSync(file, src);
}

function patchScanPy(file, slug, v) {
  let src = fs.readFileSync(file, "utf8");
  src = src.replace(
    /"violations": \[[\s\S]*?\],\n        "count": 1/,
    `"violations": [\n            {\n                "id": "${v.id}",\n                "path": "${v.path}",\n                "summary": "${v.summary}",\n            }\n        ],\n        "count": 1`,
  );
  src = src.replace(/"You are the [^"]+"/g, `"You are the ${agentName(slug)}."`);
  fs.writeFileSync(file, src);
}

function patchAuditPy(file, slug, a) {
  let src = fs.readFileSync(file, "utf8");
  src = src.replace(
    /"actionable": \[\{"id": "[^"]+", "kind": "[^"]+", "summary": "[^"]+"\}\]/,
    `"actionable": [{"id": "${a.id}", "kind": "${a.kind}", "summary": "${a.summary}"}]`,
  );
  src = src.replace(/"You are the [^"]+"/g, `"You are the ${agentName(slug)}."`);
  fs.writeFileSync(file, src);
}

function patchExample(file, slug, lang) {
  if (fixtures.lookup[slug]) {
    if (lang === "py") patchLookupPy(file, slug, fixtures.lookup[slug]);
    else patchLookup(file, slug, fixtures.lookup[slug]);
    return true;
  }
  if (fixtures.scan[slug]) {
    if (lang === "py") patchScanPy(file, slug, fixtures.scan[slug]);
    else patchScan(file, slug, fixtures.scan[slug]);
    return true;
  }
  if (fixtures.audit[slug]) {
    if (lang === "py") patchAuditPy(file, slug, fixtures.audit[slug]);
    else patchAudit(file, slug, fixtures.audit[slug]);
    return true;
  }
  return false;
}

let patched = 0;
for (const entry of catalog.examples) {
  const tsFile = path.join(root, "examples", entry.slug, "ts/src/tools.ts");
  const pyFile = path.join(root, "examples", entry.slug, "python/tools.py");

  if (fs.existsSync(tsFile) && patchExample(tsFile, entry.slug, "ts")) patched++;
  if (fs.existsSync(pyFile) && patchExample(pyFile, entry.slug, "py")) patched++;
}

console.log(`Patched ${patched} example tools files.`);
