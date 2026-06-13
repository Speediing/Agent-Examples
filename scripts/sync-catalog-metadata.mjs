#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(rootDir, "scripts/sdlc-catalog.json"), "utf8"),
);

const allSlugs = [
  ...catalog.foundationExamples.map((entry) => entry.slug),
  ...catalog.examples.map((entry) => entry.slug),
];

const scriptName = (slug) => {
  if (slug === "hello-world") return "hello-world:ts";
  if (slug === "tool-calling-agent") return "tool-calling:ts";
  if (slug === "migration-agent") return "migration-agent:ts";
  if (slug === "bugbot") return "bugbot:validate";
  if (slug === "security-reviewer") return "security-reviewer:validate";
  return `${slug}:ts`;
};

const packagePath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

const preservedScripts = {
  build: packageJson.scripts.build,
  typecheck: packageJson.scripts.typecheck,
  test: packageJson.scripts.test,
  "test:llm": packageJson.scripts["test:llm"],
  "test:all": packageJson.scripts["test:all"],
  "migrate:python-ports":
    packageJson.scripts["migrate:python-ports"] ??
    "npm --workspace @cursor-examples/migration-agent-ts run start --",
};

const generatedScripts = Object.fromEntries(
  allSlugs.map((slug) => {
    const name = scriptName(slug);
    if (slug === "bugbot") {
      return [name, "npm --workspace @cursor-examples/bugbot-ts run start --"];
    }
    if (slug === "security-reviewer") {
      return [
        name,
        "npm --workspace @cursor-examples/security-reviewer-ts run start --",
      ];
    }
    return [
      name,
      `npm --workspace @cursor-examples/${slug}-ts run start --`,
    ];
  }),
);

packageJson.scripts = { ...preservedScripts, ...generatedScripts };
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

const parity = {
  paths: allSlugs.map((slug) => `examples/${slug}`),
  npmScripts: allSlugs.map((slug) => scriptName(slug)),
};

fs.writeFileSync(
  path.join(rootDir, "eval/fixtures/cookbook-parity.json"),
  `${JSON.stringify(parity, null, 2)}\n`,
);

console.log(
  `Synced ${allSlugs.length} examples to package.json and cookbook-parity.json`,
);
