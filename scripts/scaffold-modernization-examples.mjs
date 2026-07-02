#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const examples = [
  {
    slug: "hello-world",
    packageName: "@cursor-examples/hello-world-ts",
    npmScript: "inventory:ts",
    usage: "npm run inventory:ts -- <owner>/<repo>",
    promptBuilder: "buildInventoryPrompt",
    promptArgs: "",
    agentSource: `export function buildInventoryPrompt(): string {
  return [
    "You are the inventory agent.",
    "Goal: map the legacy codebase so architects can plan a migration without manual archaeology.",
    "Use built-in tools to list files, read manifests, trace imports/COPY/includes, and detect frameworks.",
    "",
    "Produce assessment.md at the repo root with:",
    "  1. Languages and file counts (top five extensions with approximate LOC).",
    "  2. Runtime and framework versions from manifests (package.json, pom.xml, *.csproj, requirements.txt).",
    "  3. Dependency hotspots: modules with the highest fan-in or COPY/include chains longer than three hops.",
    "  4. Coupling map: list isolated candidates for a first pilot vs tightly coupled clusters to defer.",
    "  5. Duplicated logic: copy-pasted blocks or parallel implementations that should merge before porting.",
    "  6. Top three modernization risks, one sentence each, tied to a real file path.",
    "  7. Recommended first pilot: one bounded program or service with clear inputs/outputs.",
    "",
    "Also write coupling-map.md with a table: module, inbound deps, outbound deps, pilot_ready (yes/no), notes.",
    "Open a pull request titled 'Add codebase inventory'.",
    "Quote real file paths only. Do not invent files."
  ].join("\\n");
}`,
  },
  {
    slug: "score-modernization-risk",
    packageName: "@cursor-examples/score-modernization-risk-ts",
    npmScript: "assess:ts",
    usage: "npm run assess:ts -- <owner>/<repo>",
    promptBuilder: "buildRiskScorePrompt",
    promptArgs: "",
    agentSource: `export function buildRiskScorePrompt(): string {
  return [
    "You are the risk-scoring agent.",
    "Goal: write a deterministic risk score for the repo and commit it.",
    "",
    "Steps:",
    "  1. Write scripts/score-risk.ts that exports scoreRisk(inputs).",
    "  2. Manifest scoring rules:",
    "      - .NET Framework manifests: +4 each",
    "      - Java 8 (1.8) manifests:  +3 each",
    "      - Node engines < 18:        +2 each",
    "      - 'unknown' version fields: +2 each",
    "  3. Coupling rules (read coupling-map.md if present, else infer from imports/COPY):",
    "      - fan-in >= 8:              +3",
    "      - fan-out >= 12:            +2",
    "      - cyclic dependency cluster:+5",
    "  4. Test and observability rules:",
    "      - no tests/ directory:      +3",
    "      - coverage config missing:  +1",
    "     Severity: high (>=8), medium (2-7), low (<2).",
    "  5. Run the script against the actual repo. Write score, severity, blockers, and pilot candidates to risk.md.",
    "",
    "Open a PR titled 'Add modernization risk score'.",
    "The scoring rules belong in scripts/score-risk.ts. Do not put them in prose."
  ].join("\\n");
}`,
  },
  {
    slug: "upgrade-net-framework",
    packageName: "@cursor-examples/upgrade-net-framework-ts",
    npmScript: "transform:net:ts",
    usage: "npm run transform:net:ts -- <owner>/<repo>",
    promptBuilder: "buildNetUpgradePrompt",
    promptArgs: "",
    agentSource: `export function buildNetUpgradePrompt(): string {
  return [
    "You are the .NET modernization agent.",
    "Goal: move every .csproj from .NET Framework 4.x to net8.0 and ship a PR.",
    "",
    "Loop:",
    "  1. Find every .csproj file.",
    "  2. Set <TargetFramework> to net8.0 and remove <TargetFrameworkVersion>.",
    "  3. Run 'dotnet build'. If it fails, fix the failure and try again.",
    "  4. When the build is clean, run 'dotnet test'.",
    "",
    "Stop when 'dotnet test' exits zero. Never disable a failing test.",
    "Do not edit files outside the repo.",
    "Open a PR titled 'Upgrade to .NET 8' that lists every project changed."
  ].join("\\n");
}`,
  },
  {
    slug: "cover-before-refactor",
    packageName: "@cursor-examples/cover-before-refactor-ts",
    npmScript: "cover:ts",
    usage: "npm run cover:ts -- <owner>/<repo> <file>",
    promptBuilder: "buildCoveragePrompt",
    promptArgs: "file",
    extraArgv: "file",
    agentSource: `export function buildCoveragePrompt(target: string): string {
  return [
    "You are the characterization-test agent.",
    \`Goal: cover \${target} with tests so a future refactor cannot regress behaviour.\`,
    "",
    "Steps:",
    \`  1. Read \${target}.\`,
    "  2. Run the existing tests with coverage and read the per-file report.",
    \`  3. For each uncovered branch in \${target}, add a test under tests/ that pins current behaviour.\`,
    \`  4. Rerun tests with coverage. Stop when \${target} is at >= 80% line coverage.\`,
    "",
    \`Never modify \${target}. Only add files under tests/.\`,
    \`Open a PR titled 'Cover \${target}' that quotes the before / after coverage numbers.\`
  ].join("\\n");
}`,
  },
  {
    slug: "strangler-cutover",
    packageName: "@cursor-examples/strangler-cutover-ts",
    npmScript: "cutover:ts",
    usage: "npm run cutover:ts -- <owner>/<repo>",
    promptBuilder: "buildStranglerPrompt",
    promptArgs: "",
    agentSource: `export function buildStranglerPrompt(): string {
  return [
    "You are the strangler cutover agent.",
    "Goal: stage traffic to the modern target in the repo's traffic-split config and ship rollback-first PRs.",
    "",
    "Steps:",
    "  1. Read deploy/traffic-split.json. Fields: legacyWeight, modernWeight, errorBudgetPercent, smokeWindowMinutes.",
    "  2. Open a rollback PR first: set modernWeight to 0 and legacyWeight to 100.",
    "  3. Open a ramp PR with modernWeight at 5. After smokeWindowMinutes elapse, read error rate from deploy/metrics.snapshot.json.",
    "     Reject the snapshot if its generatedAt timestamp is older than the ramp PR merge time.",
    "  4. If error rate is inside errorBudgetPercent, open the next ramp PR (25, 50, 100). If not, merge the rollback PR and stop.",
    "",
    "Never ramp past 50% without a green smoke window.",
    "Never edit application source or deploy/metrics.snapshot.json (CI publishes that file). Only change deploy/traffic-split.json.",
    "Open each step as its own PR with the measured error rate quoted in the description."
  ].join("\\n");
}`,
  },
  {
    slug: "agentic-readiness-check",
    packageName: "@cursor-examples/agentic-readiness-check-ts",
    npmScript: "ara:ts",
    usage: "npm run ara:ts -- <owner>/<repo>",
    promptBuilder: "buildAraPrompt",
    promptArgs: "",
    agentSource: `export function buildAraPrompt(): string {
  return [
    "You are the agentic readiness analysis (ARA) agent.",
    "Goal: report which HTTP endpoints in this repo are safe for an AI agent to call autonomously.",
    "",
    "Steps:",
    "  1. Find every HTTP route handler in the repo.",
    "  2. For each route, score these five signals (yes / no):",
    "       idempotency      - header or argument named Idempotency-Key",
    "       rate_limit       - middleware or response header for rate limiting",
    "       auth             - explicit auth check on the route",
    "       structured_errors- structured error response, not free-form text",
    "       observability    - log or trace span on the handler",
    "  3. Score = 2 * (idempotency + rate_limit + auth + structured_errors). Max score is 8.",
    "     List observability separately; it does not change the score.",
    "  4. Group endpoints:",
    "       ready      - score 8 with zero blockers",
    "       needs_work - score 4-6 or missing one non-auth blocker",
    "       blocked    - missing auth or score < 4",
    "  An endpoint with score >= 8 but missing auth is blocked, never ready.",
    "",
    "Write the result to readiness.md and open a PR titled 'Add agentic readiness report'.",
    "Quote every endpoint with its source file and line. Do not invent routes."
  ].join("\\n");
}`,
  },
  {
    slug: "plan-modernization-waves",
    packageName: "@cursor-examples/plan-modernization-waves-ts",
    npmScript: "plan:ts",
    usage: "npm run plan:ts -- <owner>/<repo>",
    promptBuilder: "buildWavesPrompt",
    promptArgs: "",
    agentSource: `export function buildWavesPrompt(): string {
  return [
    "You are the wave-planning agent.",
    "Goal: read the service inventory in this repo and produce a modernization wave plan.",
    "",
    "Steps:",
    "  1. Read inventory.json. Expect entries with { name, dependsOn, criticality }.",
    "  2. Write scripts/plan-waves.ts that topologically orders the services:",
    "       - A service never moves before its dependencies.",
    "       - Within a wave, sort by criticality ascending (safer services first).",
    "       - Each wave holds at most six services. Throw on cycles.",
    "  3. Run the script and write waves.md with the wave order.",
    "  4. Add one risk per wave: dependencies that span teams, services with no tests, services that touch payments.",
    "",
    "Open a PR titled 'Add modernization wave plan' that quotes the full wave list.",
    "Keep the planning rules in scripts/plan-waves.ts. Do not paraphrase them in prose."
  ].join("\\n");
}`,
  },
  {
    slug: "containerize-legacy-app",
    packageName: "@cursor-examples/containerize-legacy-app-ts",
    npmScript: "containerize:ts",
    usage: "npm run containerize:ts -- <owner>/<repo>",
    promptBuilder: "buildContainerizePrompt",
    promptArgs: "",
    agentSource: `export function buildContainerizePrompt(): string {
  return [
    "You are the containerization agent.",
    "Goal: containerize the app and prove the image builds clean.",
    "",
    "Steps:",
    "  1. Detect the runtime: read package.json, pom.xml, requirements.txt, or *.csproj.",
    "  2. Write a multi-stage Dockerfile and a .dockerignore at the repo root.",
    "     The Dockerfile must start with FROM. Skip writes that would weaken it.",
    "  3. Run 'docker build -t modernization-build .'. On failure, fix the Dockerfile and retry.",
    "  4. Run 'docker scout quickview modernization-build'. Stop if any high-severity finding shows up.",
    "",
    "Never publish or push the image.",
    "Never edit application source. Write Dockerfile, .dockerignore, and deploy/ only.",
    "Open a PR titled 'Containerize the app' that quotes the image size and the CVE summary."
  ].join("\\n");
}`,
  },
  {
    slug: "upgrade-java-spring-boot",
    packageName: "@cursor-examples/upgrade-java-spring-boot-ts",
    npmScript: "upgrade:java:ts",
    usage: "npm run upgrade:java:ts -- <owner>/<repo>",
    promptBuilder: "buildJavaUpgradePrompt",
    promptArgs: "",
    agentSource: `export function buildJavaUpgradePrompt(): string {
  return [
    "You are the Java modernization agent.",
    "Goal: move every pom.xml to Java 21 and Spring Boot 3.3.0 and ship a green build.",
    "",
    "Loop:",
    "  1. Find every pom.xml.",
    "  2. Set <java.version>, <maven.compiler.source>, and <maven.compiler.target> to 21.",
    "     Set the spring-boot-starter-parent version to 3.3.0.",
    "  3. Run 'mvn -q verify'. On failure, fix the most common Spring Boot 3 issues:",
    "       - javax.* imports become jakarta.*",
    "       - removed JDK APIs (e.g. Thread.stop, finalizers)",
    "       - deprecated Spring auto-configuration beans",
    "  4. Repeat 'mvn verify' until it exits zero.",
    "",
    "Never disable a failing test.",
    "Open a PR titled 'Upgrade to Java 21 + Spring Boot 3.3' that lists every pom changed and every failure resolved."
  ].join("\\n");
}`,
  },
  {
    slug: "port-cobol-to-java",
    packageName: "@cursor-examples/port-cobol-to-java-ts",
    npmScript: "port:cobol:ts",
    usage: "npm run port:cobol:ts -- <owner>/<repo>",
    promptBuilder: "buildCobolPortPrompt",
    promptArgs: "",
    agentSource: `export function buildCobolPortPrompt(): string {
  return [
    "You are the mainframe modernization agent.",
    "Goal: port COBOL programs to idiomatic Java 21 with traceable business-rule parity.",
    "",
    "Phase A — reverse engineer (read only):",
    "  1. Read every .cob / .cbl under cobol/ and COPYBOOKS under copybooks/.",
    "  2. Write business-rules.md: for each program list rules in WHEN/THEN form",
    "     (inputs, conditions, outputs, rounding, audit fields). Quote COBOL line ranges.",
    "  3. Mark rules as confirmed (matches code literally) or needs_sme (ambiguous COPY, dates, rounding).",
    "",
    "Phase B — forward engineer (write Java + tests):",
    "  4. Port one pilot program first (lowest coupling per coupling-map.md if present).",
    "  5. For the pilot, write src/main/java/<Program>.java:",
    "       - PROCEDURE DIVISION paragraphs -> private static methods",
    "       - WORKING-STORAGE 01 records -> Java record classes",
    "       - PIC X(n) -> String, PIC 9(n) -> long, PIC 9(n)V9(m) -> BigDecimal",
    "       - PERFORM ... THRU -> sequenced method call group",
    "  6. Golden-test from fixtures/<program>/*.json ({ input, expected }).",
    "  7. Run 'mvn -q verify'. On failure, fix Java (not fixtures) and retry.",
    "",
    "Never edit COBOL source or JSON fixtures.",
    "Never port a second program until business-rules.md has zero needs_sme items for the pilot.",
    "Open a PR titled 'Port COBOL pilot to Java' listing the pilot program and test summary."
  ].join("\\n");
}`,
  },
];

function writeIndex(example) {
  const extraArgvBlock =
    example.extraArgv === "file"
      ? `
  const file = process.argv[3];
  if (!file) {
    throw new Error("Usage: ${example.usage}");
  }`
      : "";

  const promptCall =
    example.promptArgs === "file"
      ? `${example.promptBuilder}(file)`
      : `${example.promptBuilder}()`;

  return `import { ${example.promptBuilder} } from "./agent.js";
import {
  printCloudResult,
  submitCloudAgent,
} from "@cursor-examples/modernization-core";

try {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Usage: ${example.usage}");
  }${extraArgvBlock}

  const result = await submitCloudAgent({
    target,
    prompt: ${promptCall},
  });
  printCloudResult(result);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
`;
}

function writePackageJson(example) {
  return JSON.stringify(
    {
      name: example.packageName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        build: "tsc -p tsconfig.json",
        start: "node dist/index.js",
      },
      dependencies: {
        "@cursor-examples/modernization-core": "0.1.0",
        "@cursor/sdk": "^1.0.18",
      },
      devDependencies: {
        typescript: "^5.9.3",
      },
    },
    null,
    2,
  );
}

function writeTsConfig() {
  return JSON.stringify(
    {
      extends: "../../../tsconfig.base.json",
      compilerOptions: {
        outDir: "dist",
        rootDir: "src",
      },
      include: ["src/**/*.ts"],
    },
    null,
    2,
  );
}

for (const example of examples) {
  const base = path.join(root, "examples", example.slug, "ts");
  const src = path.join(base, "src");
  mkdirSync(src, { recursive: true });
  writeFileSync(path.join(src, "agent.ts"), `${example.agentSource}\n`);
  writeFileSync(path.join(src, "index.ts"), writeIndex(example));
  writeFileSync(path.join(base, "package.json"), `${writePackageJson(example)}\n`);
  writeFileSync(path.join(base, "tsconfig.json"), `${writeTsConfig()}\n`);
}

console.log(`Scaffolded ${examples.length} modernization examples.`);
