#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const skills = [
  {
    name: "modernization-inventory",
    description:
      "Inventory a legacy codebase with a Cursor cloud agent. Use when mapping languages, coupling, pilots, or writing assessment.md and coupling-map.md.",
    guideSlug: "hello-world",
    npmScript: "inventory:ts",
    stage: "discover",
    body: `# Modernization inventory

Submit a cloud agent that maps a target repo and opens a PR with assessment artifacts.

## When to use

- Starting a modernization program and need a shared map of the estate.
- Choosing a bounded pilot before any transform work.
- Feeding downstream assess and plan agents with coupling-map.md.

## Workflow

1. Confirm \`CURSOR_API_KEY\` and \`CURSOR_MODEL\` are set.
2. Run \`npm run inventory:ts -- <owner>/<repo>\` from Agent-Examples.
3. Review the PR for assessment.md and coupling-map.md.
4. Hand coupling-map.md to the risk-scoring agent before transforms.

## Prompt contract

The agent must quote real paths, name a pilot candidate, and avoid inventing modules.

## Guardrails

- Cloud-only: the SDK clones the repo into a Cursor sandbox.
- Do not skip inventory on repos that already claim a pilot without a signed coupling map.`,
  },
  {
    name: "modernization-risk-assess",
    description:
      "Score modernization risk with deterministic rules in scripts/score-risk.ts. Use before wave planning or stack transforms.",
    guideSlug: "score-modernization-risk",
    npmScript: "assess:ts",
    stage: "assess",
    body: `# Modernization risk scoring

Commit a deterministic risk score derived from manifests, coupling, and test signals.

## Workflow

1. Run inventory first when coupling-map.md is missing.
2. Run \`npm run assess:ts -- <owner>/<repo>\`.
3. Review risk.md severity and blockers in the PR.
4. Defer high-severity repos until verify gates exist.

## Rules live in code

Scoring belongs in scripts/score-risk.ts, not prose in the PR body.`,
  },
  {
    name: "modernization-net-transform",
    description:
      "Upgrade .NET Framework projects to .NET 8 with a cloud agent build loop. Use for net48 → net8.0 migrations.",
    guideSlug: "upgrade-net-framework",
    npmScript: "transform:net:ts",
    stage: "transform",
    body: `# .NET framework upgrade

Loop dotnet build and dotnet test until green, then open an upgrade PR.

## Workflow

1. Cover critical modules first when tests are missing.
2. Run \`npm run transform:net:ts -- <owner>/<repo>\`.
3. Review every .csproj diff and failing-test fixes.
4. Run Bugbot on the PR before merge.

## Guardrails

- Never disable failing tests to green the build.
- Stop when dotnet test exits zero.`,
  },
  {
    name: "modernization-java-upgrade",
    description:
      "Upgrade Java 8 / Spring Boot 2 estates to Java 21 and Spring Boot 3.3 with mvn verify loops.",
    guideSlug: "upgrade-java-spring-boot",
    npmScript: "upgrade:java:ts",
    stage: "transform",
    body: `# Java and Spring Boot upgrade

Modernize pom.xml targets and fix javax → jakarta regressions until mvn verify passes.

## Workflow

1. Run \`npm run upgrade:java:ts -- <owner>/<repo>\`.
2. Scan the PR for pom changes and import fixes.
3. Confirm Flyway baselines when legacy migrations block startup.`,
  },
  {
    name: "modernization-cobol-port",
    description:
      "Port COBOL pilots to Java with business-rules.md, SME gates, and golden fixtures.",
    guideSlug: "port-cobol-to-java",
    npmScript: "port:cobol:ts",
    stage: "transform",
    body: `# COBOL to Java port

Reverse engineer WHEN/THEN rules, gate on SME sign-off, then forward engineer one pilot.

## Workflow

1. Ensure coupling-map.md names the pilot program.
2. Run \`npm run port:cobol:ts -- <owner>/<repo>\`.
3. Block merge while business-rules.md has needs_sme rows.
4. Attach sme-review.md checklist to the PR.`,
  },
  {
    name: "modernization-containerize",
    description:
      "Containerize legacy apps with multi-stage Dockerfiles and docker scout gates.",
    guideSlug: "containerize-legacy-app",
    npmScript: "containerize:ts",
    stage: "transform",
    body: `# Containerize legacy app

Detect runtime, write Dockerfile + .dockerignore, prove docker build and scout pass.

## Guardrails

- Do not edit application source.
- Never publish or push images from the agent run.`,
  },
  {
    name: "modernization-wave-plan",
    description:
      "Plan modernization waves from inventory.json with topological ordering scripts.",
    guideSlug: "plan-modernization-waves",
    npmScript: "plan:ts",
    stage: "plan",
    body: `# Wave planning

Produce waves.md from inventory.json with deterministic plan-waves.ts rules.`,
  },
  {
    name: "modernization-readiness",
    description:
      "Score HTTP endpoints for agentic readiness (auth, idempotency, rate limits).",
    guideSlug: "agentic-readiness-check",
    npmScript: "ara:ts",
    stage: "assess",
    body: `# Agentic readiness analysis

Group routes into ready, needs_work, and blocked buckets in readiness.md.`,
  },
  {
    name: "modernization-cover",
    description:
      "Add characterization tests before refactors until a target file reaches 80% line coverage.",
    guideSlug: "cover-before-refactor",
    npmScript: "cover:ts",
    stage: "verify",
    body: `# Cover before refactor

Pin behaviour with tests only — never edit the file under test.`,
  },
  {
    name: "modernization-strangler-cutover",
    description:
      "Stage strangler traffic ramps with rollback-first PRs and error-budget gates.",
    guideSlug: "strangler-cutover",
    npmScript: "cutover:ts",
    stage: "cutover",
    body: `# Strangler cutover

Edit deploy/traffic-split.json only. Open rollback PR before any ramp.`,
  },
  {
    name: "modernization-workbench",
    description:
      "Operate the Next.js modernization workbench: catalog transforms, submit cloud runs, track PRs.",
    guideSlug: null,
    npmScript: null,
    stage: "program",
    body: `# Modernization workbench

Browser UI for submitting Cursor cloud transforms with Vercel-native deploy flow.

## Workflow

1. Open /workbench on the example site.
2. Add target repos to the portfolio.
3. Pick a catalog transform or define a custom one.
4. Submit — the API calls the Cursor SDK with autoCreatePR.
5. Track run ID and PR URL in the run history panel.

## Environment

Set CURSOR_API_KEY and CURSOR_MODEL in Vercel project settings for API routes.`,
  },
];

for (const skill of skills) {
  const dir = path.join(root, ".cursor", "skills", skill.name);
  mkdirSync(dir, { recursive: true });

  const frontmatter = `---
name: ${skill.name}
description: ${skill.description}
---

`;

  const footer =
    skill.guideSlug != null
      ? `\n## Site guide\n\n/${skill.guideSlug} on the modernization cookbook.\n`
      : "";

  const npmBlock =
    skill.npmScript != null
      ? `\n## Command\n\n\`npm run ${skill.npmScript} -- <owner>/<repo>\`\n`
      : "";

  writeFileSync(
    path.join(dir, "SKILL.md"),
    `${frontmatter}${skill.body}${npmBlock}${footer}`,
  );
}

console.log(`Wrote ${skills.length} modernization skills.`);
