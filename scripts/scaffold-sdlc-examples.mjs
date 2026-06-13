#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(rootDir, "scripts/sdlc-catalog.json"), "utf8")
);

function toPascal(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toAgentName(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toPythonName(slug) {
  return slug.replace(/-/g, "_");
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function tsPackageJson(slug) {
  return {
    name: `@cursor-examples/${slug}-ts`,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      build: "tsc -p tsconfig.json",
      start: "node dist/index.js"
    },
    cursorExample: {
      pythonPort: "../python/main.py",
      ...(slug.includes("slack") || slug.includes("clarifier") || slug.includes("alert-triage")
        ? { chatSurface: true }
        : {})
    },
    devDependencies: { typescript: "^5.9.3" },
    dependencies: { "@cursor/sdk": "^1.0.18" }
  };
}

function tsConfig() {
  return {
    extends: "../../../tsconfig.base.json",
    compilerOptions: { outDir: "dist", rootDir: "src" },
    include: ["src/**/*.ts"]
  };
}

function buildPromptFn(slug, title, lesson) {
  const fn = `build${toPascal(slug)}Prompt`;
  return `export function ${fn}(task: string): string {
  return [
    "You are the ${toAgentName(slug)}.",
    "${lesson}.",
    \`Task: \${task || "Run the ${slug} example with a realistic input."}\`
  ].join("\\n");
}`;
}

function ltToolsTs(slug, title, lesson) {
  const fn = `build${toPascal(slug)}Prompt`;
  return `import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupContext(args: { query?: SDKJsonValue }) {
  const query = readString(args.query).toLowerCase() || "${slug}";
  return {
    query,
    found: true,
    facts: [
      { key: "example", value: "${slug}" },
      { key: "lesson", value: "${lesson}" },
      { key: "pattern", value: "local-tools" }
    ],
    count: 3
  };
}

export function ${fn}(task: string): string {
  return [
    "You are the ${toAgentName(slug)}.",
    "${lesson}.",
    "Call lookup_context before you summarize.",
    "Do not invent facts the tool did not return.",
    \`Task: \${task || "Run the ${slug} example."}\`
  ].join("\\n");
}

export function create${toPascal(slug)}CustomTools() {
  return {
    lookup_context: {
      description: "Return deterministic context facts for the ${slug} example.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Short task or topic string" }
        }
      },
      execute: (args: { query?: SDKJsonValue }) => lookupContext(args)
    }
  };
}
`;
}

function pfToolsTs(slug, lesson) {
  return `${buildPromptFn(slug, "", lesson)}
`;
}

function sfrToolsTs(slug, lesson) {
  const fn = `build${toPascal(slug)}Prompt`;
  return `import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scanTarget(args: { target?: SDKJsonValue }) {
  const target = readString(args.target) || "sample-input";
  return {
    target,
    violations: [
      { id: "${slug}-rule-1", impact: "moderate", summary: "Example violation for ${slug}" }
    ],
    count: 1,
    passed: false
  };
}

export function ${fn}(task: string): string {
  return [
    "You are the ${toAgentName(slug)}.",
    "${lesson}.",
    "Call scan_target and cite violation ids from the tool result.",
    \`Task: \${task || "Scan the sample input for ${slug}."}\`
  ].join("\\n");
}

export function create${toPascal(slug)}CustomTools() {
  return {
    scan_target: {
      description: "Scan the target input and return structured violations.",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "Path, diff snippet, or label to scan" }
        }
      },
      execute: (args: { target?: SDKJsonValue }) => scanTarget(args)
    }
  };
}
`;
}

function ataToolsTs(slug, lesson, writes) {
  const fn = `build${toPascal(slug)}Prompt`;
  return `import type { SDKJsonValue } from "@cursor/sdk";

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function auditState(args: { scope?: SDKJsonValue }) {
  const scope = readString(args.scope) || "${slug}";
  return {
    scope,
    drift_detected: true,
    actionable: [{ id: "1", kind: "${slug}", summary: "Example drift record for audit" }],
    count: 1,
    writes_enabled: ${writes ? "process.argv.includes('--act')" : "false"}
  };
}

export function ${fn}(task: string): string {
  return [
    "You are the ${toAgentName(slug)}.",
    "${lesson}.",
    "Call audit_state first. ${writes ? "Only recommend writes when audit_state.writes_enabled is true." : "This example is audit-only."}",
    \`Task: \${task || "Audit scope for ${slug}."}\`
  ].join("\\n");
}

export function create${toPascal(slug)}CustomTools() {
  return {
    audit_state: {
      description: "Return deterministic audit records for the ${slug} example.",
      inputSchema: {
        type: "object",
        properties: {
          scope: { type: "string", description: "Audit scope label" }
        }
      },
      execute: (args: { scope?: SDKJsonValue }) => auditState(args)
    }
  };
}
`;
}

function iagToolsTs(slug, lesson) {
  const fn = `build${toPascal(slug)}Prompt`;
  return `import type { SDKJsonValue } from "@cursor/sdk";

const SIGNALS: Record<string, { status: string; evidence: string[] }> = {
  "${slug}": { status: "investigating", evidence: ["signal-a", "signal-b"] }
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getSignals(args: { subject?: SDKJsonValue }) {
  const subject = readString(args.subject) || "${slug}";
  const signal = SIGNALS[subject] ?? SIGNALS["${slug}"];
  return { subject, found: true, signal, known_subjects: Object.keys(SIGNALS) };
}

export function ${fn}(task: string): string {
  return [
    "You are the ${toAgentName(slug)}.",
    "${lesson}.",
    "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
    \`Incident or subject: \${task || "${slug} investigation"}\`
  ].join("\\n");
}

export function create${toPascal(slug)}CustomTools() {
  return {
    get_signals: {
      description: "Return mock investigation signals for the ${slug} example.",
      inputSchema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Service, diff, or incident label" }
        }
      },
      execute: (args: { subject?: SDKJsonValue }) => getSignals(args)
    }
  };
}
`;
}

function chatBundle(slug, lesson) {
  const pascal = toPascal(slug);
  const agentTs = `export function build${pascal}Prompt(threadText: string): string {
  const report = threadText.trim() || "Example ${slug} thread input.";
  return [
    "You are the ${toAgentName(slug)}.",
    "${lesson}.",
    "Do not claim you created a ticket or opened a pull request.",
    \`Thread:\\n\${report}\`
  ].join("\\n");
}
`;
  const gateTs = fs.readFileSync(path.join(rootDir, "examples/slack-bot/ts/src/gate.ts"), "utf8");
  const toolsTs = `import type { SDKJsonValue } from "@cursor/sdk";
import { canExecuteSideEffects, recordSideEffect, type ApprovalState } from "./gate.js";

export function createRecord(args: { plan?: SDKJsonValue; approval?: ApprovalState }) {
  if (!args.approval || !canExecuteSideEffects(args.approval)) {
    return { created: false, reason: "Side effects require an explicit human approval.", record: null };
  }
  const record = { id: "${slug}-1", url: "https://tracker.example.com/${slug}/1" };
  recordSideEffect(args.approval, { kind: "ticket", id: record.id, url: record.url });
  return { created: true, reason: null, record };
}
`;
  const simulateTs = `import { Agent } from "@cursor/sdk";
import { approve, createApprovalState, reject } from "./gate.js";
import { build${pascal}Prompt } from "./agent.js";
import { createRecord } from "./tools.js";

export async function simulate${pascal}Chat(thread: { text: string; action?: "approve" | "reject" }, options: { apiKey?: string; model?: string; skipSdk?: boolean } = {}) {
  const approval = createApprovalState();
  const prompt = build${pascal}Prompt(thread.text);
  let plan = "Summary: example triage plan for ${slug}.";
  if (!options.skipSdk && options.apiKey && options.model) {
    const result = await Agent.prompt(prompt, { apiKey: options.apiKey, model: { id: options.model }, local: { cwd: process.cwd() } });
    plan = result.result ?? plan;
  }
  if (thread.action === "approve") approve(approval);
  if (thread.action === "reject") reject(approval);
  const record = createRecord({ plan, approval });
  return { plan, approval, record };
}
`;
  return { agentTs, gateTs, toolsTs, simulateTs };
}

function toolsForPattern(entry) {
  const { slug, pattern, lesson, writes } = entry;
  if (pattern === "CHAT") {
    throw new Error("CHAT handled separately");
  }
  switch (pattern) {
    case "PF":
      return pfToolsTs(slug, lesson);
    case "LT":
      return ltToolsTs(slug, entry.title, lesson);
    case "SFR":
      return sfrToolsTs(slug, lesson);
    case "ATA":
      return ataToolsTs(slug, lesson, writes);
    case "IAG":
      return iagToolsTs(slug, lesson);
    case "BE":
      return beToolsTs(slug);
    default:
      throw new Error(`Unknown pattern ${pattern}`);
  }
}

function beToolsTs(slug) {
  return `export function build${toPascal(slug)}Prompt(task: string): string {
  return [
    "You are the Eval Trace Grader.",
    "Describe how behavioral evals grade tool choice and grounding from run.stream() traces.",
    "Point readers to eval/tier1 and eval/lib in Agent-Examples.",
    \`Task: \${task || "Explain trace grading for agent evals."}\`
  ].join("\\n");
}
`;
}

function indexTs(slug, pattern) {
  const promptFn = `build${toPascal(slug)}Prompt`;
  if (pattern === "CHAT") {
    return `import { simulate${toPascal(slug)}Chat } from "./simulate.js";

const text = process.argv
  .slice(2)
  .filter((arg) => arg !== "--approve" && arg !== "--reject" && arg !== "--offline")
  .join(" ")
  .trim();
const actionFlag = process.argv.find((arg) => arg === "--approve" || arg === "--reject");
const action =
  actionFlag === "--approve" ? "approve" : actionFlag === "--reject" ? "reject" : undefined;

try {
  const result = await simulate${toPascal(slug)}Chat(
    { text, action },
    {
      apiKey: process.env.CURSOR_API_KEY,
      model: process.env.CURSOR_MODEL,
      skipSdk: process.argv.includes("--offline")
    }
  );
  console.log(result.plan);
  console.log(JSON.stringify({
    approved: result.approval.approved,
    record_created: result.record.created
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
`;
  }

  const usesTools = ["LT", "SFR", "ATA", "IAG"].includes(pattern);
  if (!usesTools) {
    return `import { Agent } from "@cursor/sdk";
import { ${promptFn} } from "./tools.js";

try {
  const task = process.argv.slice(2).join(" ").trim();
  const result = await Agent.prompt(${promptFn}(task), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: { cwd: process.cwd() }
  });
  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing \${name}.\`);
  return value;
}
`;
  }

  return `import { Agent } from "@cursor/sdk";
import { ${promptFn}, create${toPascal(slug)}CustomTools } from "./tools.js";

try {
  const task = process.argv.slice(2).filter((a) => a !== "--act").join(" ").trim();
  const result = await Agent.prompt(${promptFn}(task), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: { cwd: process.cwd(), customTools: create${toPascal(slug)}CustomTools() }
  });
  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing \${name}.\`);
  return value;
}
`;
}

function pythonReadStringHelper() {
  return `
def _read_string(value: object | None) -> str:
    return value.strip() if isinstance(value, str) else ""
`;
}

function pythonLtTools(slug, lesson) {
  const py = toPythonName(slug);
  return `from __future__ import annotations
${pythonReadStringHelper()}
def lookup_context(args: dict[str, object]) -> dict[str, object]:
    query = _read_string(args.get("query")).lower() or "${slug}"
    return {
        "query": query,
        "found": True,
        "facts": [
            {"key": "example", "value": "${slug}"},
            {"key": "lesson", "value": "${lesson}"},
            {"key": "pattern", "value": "local-tools"},
        ],
        "count": 3,
    }

def build_${py}_prompt(task: str) -> str:
    return "\\n".join([
        "You are the ${toAgentName(slug)}.",
        "${lesson}.",
        "Call lookup_context before you summarize.",
        "Do not invent facts the tool did not return.",
        f"Task: {task or 'Run the ${slug} example.'}",
    ])

def create_${py}_custom_tools() -> dict[str, object]:
    return {
        "lookup_context": {
            "description": "Return deterministic context facts for the ${slug} example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Short task or topic string"},
                },
            },
            "execute": lookup_context,
        }
    }
`;
}

function pythonPfTools(slug, lesson) {
  const py = toPythonName(slug);
  return `from __future__ import annotations

def build_${py}_prompt(task: str) -> str:
    return "\\n".join([
        "You are the ${toAgentName(slug)}.",
        "${lesson}.",
        f"Task: {task or 'Run the ${slug} example with a realistic input.'}",
    ])
`;
}

function pythonBeTools(slug) {
  const py = toPythonName(slug);
  return `from __future__ import annotations

def build_${py}_prompt(task: str) -> str:
    return "\\n".join([
        "You are the Eval Trace Grader.",
        "Describe how behavioral evals grade tool choice and grounding from run.stream() traces.",
        "Point readers to eval/tier1 and eval/lib in Agent-Examples.",
        f"Task: {task or 'Explain trace grading for agent evals.'}",
    ])
`;
}

function pythonSfrTools(slug, lesson) {
  const py = toPythonName(slug);
  return `from __future__ import annotations
${pythonReadStringHelper()}
def scan_target(args: dict[str, object]) -> dict[str, object]:
    target = _read_string(args.get("target")) or "sample-input"
    return {
        "target": target,
        "violations": [
            {
                "id": "${slug}-rule-1",
                "impact": "moderate",
                "summary": "Example violation for ${slug}",
            }
        ],
        "count": 1,
        "passed": False,
    }

def build_${py}_prompt(task: str) -> str:
    return "\\n".join([
        "You are the ${toAgentName(slug)}.",
        "${lesson}.",
        "Call scan_target and cite violation ids from the tool result.",
        f"Task: {task or 'Scan the sample input for ${slug}.'}",
    ])

def create_${py}_custom_tools() -> dict[str, object]:
    return {
        "scan_target": {
            "description": "Scan the target input and return structured violations.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Path, diff snippet, or label to scan"},
                },
            },
            "execute": scan_target,
        }
    }
`;
}

function pythonAtaTools(slug, lesson, writes) {
  const py = toPythonName(slug);
  const auditOnly = writes
    ? "Only recommend writes when audit_state.writes_enabled is true."
    : "This example is audit-only.";
  return `from __future__ import annotations

import sys
${pythonReadStringHelper()}
def audit_state(args: dict[str, object]) -> dict[str, object]:
    scope = _read_string(args.get("scope")) or "${slug}"
    return {
        "scope": scope,
        "drift_detected": True,
        "actionable": [{"id": "1", "kind": "${slug}", "summary": "Example drift record for audit"}],
        "count": 1,
        "writes_enabled": "--act" in sys.argv,
    }

def build_${py}_prompt(task: str) -> str:
    return "\\n".join([
        "You are the ${toAgentName(slug)}.",
        "${lesson}.",
        "Call audit_state first. ${auditOnly}",
        f"Task: {task or 'Audit scope for ${slug}.'}",
    ])

def create_${py}_custom_tools() -> dict[str, object]:
    return {
        "audit_state": {
            "description": "Return deterministic audit records for the ${slug} example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "scope": {"type": "string", "description": "Audit scope label"},
                },
            },
            "execute": audit_state,
        }
    }
`;
}

function pythonIagTools(slug, lesson) {
  const py = toPythonName(slug);
  return `from __future__ import annotations
${pythonReadStringHelper()}
SIGNALS: dict[str, dict[str, object]] = {
    "${slug}": {"status": "investigating", "evidence": ["signal-a", "signal-b"]}
}

def get_signals(args: dict[str, object]) -> dict[str, object]:
    subject = _read_string(args.get("subject")) or "${slug}"
    signal = SIGNALS.get(subject, SIGNALS["${slug}"])
    return {"subject": subject, "found": True, "signal": signal, "known_subjects": list(SIGNALS)}

def build_${py}_prompt(task: str) -> str:
    return "\\n".join([
        "You are the ${toAgentName(slug)}.",
        "${lesson}.",
        "Investigate with get_signals. This example is read-only: recommend actions but do not claim you applied changes.",
        f"Incident or subject: {task or '${slug} investigation'}",
    ])

def create_${py}_custom_tools() -> dict[str, object]:
    return {
        "get_signals": {
            "description": "Return mock investigation signals for the ${slug} example.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Service, diff, or incident label"},
                },
            },
            "execute": get_signals,
        }
    }
`;
}

function pythonTools(slug, pattern, lesson, writes = false) {
  const py = toPythonName(slug);
  if (pattern === "CHAT") {
    return `from __future__ import annotations

def build_${py}_prompt(thread_text: str) -> str:
    return "\\n".join([
        "You are the ${toAgentName(slug)}.",
        "${lesson}.",
        "Do not claim you created a ticket or opened a pull request.",
        f"Thread:\\n{thread_text or 'Example ${slug} thread.'}",
    ])
`;
  }
  switch (pattern) {
    case "PF":
      return pythonPfTools(slug, lesson);
    case "LT":
      return pythonLtTools(slug, lesson);
    case "SFR":
      return pythonSfrTools(slug, lesson);
    case "ATA":
      return pythonAtaTools(slug, lesson, writes);
    case "IAG":
      return pythonIagTools(slug, lesson);
    case "BE":
      return pythonBeTools(slug);
    default:
      throw new Error(`Unknown pattern ${pattern}`);
  }
}

function pythonMain(slug, pattern) {
  const py = toPythonName(slug);
  const usesTools = ["LT", "SFR", "ATA", "IAG"].includes(pattern);
  if (pattern === "CHAT") {
    return `from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass

from agent import build_${py}_prompt


@dataclass
class ApprovalState:
    approved: bool = False
    rejected: bool = False


def create_approval_state() -> ApprovalState:
    return ApprovalState()


def approve(state: ApprovalState) -> None:
    state.approved = True
    state.rejected = False


def reject(state: ApprovalState) -> None:
    state.approved = False
    state.rejected = True


def can_execute_side_effects(state: ApprovalState) -> bool:
    return state.approved and not state.rejected


def create_record(plan: str, approval: ApprovalState) -> dict[str, object]:
    if not can_execute_side_effects(approval):
        return {
            "created": False,
            "reason": "Side effects require an explicit human approval.",
            "record": None,
        }
    return {
        "created": True,
        "reason": None,
        "record": {"id": "${slug}-1", "url": "https://tracker.example.com/${slug}/1"},
    }


def main() -> int:
    text = " ".join(a for a in sys.argv[1:] if a not in {"--approve", "--reject", "--offline"})
    approval = create_approval_state()
    if "--approve" in sys.argv:
        approve(approval)
    if "--reject" in sys.argv:
        reject(approval)

    plan = build_${py}_prompt(text)
    if "--offline" not in sys.argv and os.getenv("CURSOR_API_KEY") and os.getenv("CURSOR_MODEL"):
        from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

        result = Agent.prompt(
            plan,
            AgentOptions(
                api_key=os.environ["CURSOR_API_KEY"],
                model=os.environ["CURSOR_MODEL"],
                local=LocalAgentOptions(cwd=os.getcwd()),
            ),
        )
        plan = result.result or plan

    record = create_record(plan, approval)
    print(plan)
    print(json.dumps({"approved": approval.approved, "record_created": record["created"]}, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
`;
  }
  if (!usesTools) {
    return `from __future__ import annotations
import os, sys
from cursor_sdk import Agent, AgentOptions, LocalAgentOptions
from tools import build_${py}_prompt

def main() -> int:
    task = " ".join(sys.argv[1:])
    result = Agent.prompt(build_${py}_prompt(task), AgentOptions(
        api_key=os.environ["CURSOR_API_KEY"], model=os.environ["CURSOR_MODEL"],
        local=LocalAgentOptions(cwd=os.getcwd()),
    ))
    print(result.result)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
`;
  }
  return `from __future__ import annotations
import os, sys
from cursor_sdk import Agent, AgentOptions, LocalAgentOptions
from tools import build_${py}_prompt, create_${py}_custom_tools

def main() -> int:
    task = " ".join(a for a in sys.argv[1:] if a != "--act")
    result = Agent.prompt(build_${py}_prompt(task), AgentOptions(
        api_key=os.environ["CURSOR_API_KEY"], model=os.environ["CURSOR_MODEL"],
        local=LocalAgentOptions(cwd=os.getcwd(), custom_tools=create_${py}_custom_tools()),
    ))
    print(result.result)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
`;
}

const existing = new Set(
  fs.readdirSync(path.join(rootDir, "examples"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
);

let created = 0;
for (const entry of catalog.examples) {
  if (existing.has(entry.slug)) continue;

  const base = path.join(rootDir, "examples", entry.slug);
  writeFile(path.join(base, "ts/package.json"), JSON.stringify(tsPackageJson(entry.slug), null, 2) + "\n");
  writeFile(path.join(base, "ts/tsconfig.json"), JSON.stringify(tsConfig(), null, 2) + "\n");
  if (entry.pattern === "CHAT") {
    const chat = chatBundle(entry.slug, entry.lesson);
    writeFile(path.join(base, "ts/src/agent.ts"), chat.agentTs);
    writeFile(path.join(base, "ts/src/gate.ts"), chat.gateTs);
    writeFile(path.join(base, "ts/src/tools.ts"), chat.toolsTs);
    writeFile(path.join(base, "ts/src/simulate.ts"), chat.simulateTs);
    writeFile(path.join(base, "ts/src/index.ts"), indexTs(entry.slug, entry.pattern));
  } else {
    writeFile(path.join(base, "ts/src/tools.ts"), toolsForPattern(entry));
    writeFile(path.join(base, "ts/src/index.ts"), indexTs(entry.slug, entry.pattern));
  }
  writeFile(
    path.join(base, "python/tools.py"),
    pythonTools(entry.slug, entry.pattern, entry.lesson, entry.writes)
  );
  writeFile(
    path.join(base, "python/agent.py"),
    entry.pattern === "CHAT"
      ? pythonTools(entry.slug, entry.pattern, entry.lesson, entry.writes)
      : `from tools import build_${toPythonName(entry.slug)}_prompt\n\n__all__ = ["build_${toPythonName(entry.slug)}_prompt"]\n`
  );
  writeFile(path.join(base, "python/main.py"), pythonMain(entry.slug, entry.pattern));
  created++;
  console.log(`created ${entry.slug}`);
}

// Update package.json scripts
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
for (const entry of catalog.examples) {
  const script = `${entry.slug}:ts`;
  pkg.scripts[script] = `npm --workspace @cursor-examples/${entry.slug}-ts run start --`;
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// Update cookbook-parity.json
const parityPath = path.join(rootDir, "eval/fixtures/cookbook-parity.json");
const parity = {
  paths: catalog.examples.map((e) => `examples/${e.slug}`),
  npmScripts: catalog.examples.map((e) => `${e.slug}:ts`)
};
// include foundation examples paths for parity? docs only checks roadmap ones in fixture - add foundations too
for (const f of catalog.foundationExamples) {
  parity.paths.unshift(`examples/${f.slug}`);
  parity.npmScripts.unshift(`${f.slug.replace("tool-calling-agent", "tool-calling").replace("accessibility-agent", "accessibility-agent").replace("migration-agent", "migration-agent").replace("sre-agent", "sre-agent").replace("hello-world", "hello-world")}:ts`);
}
// fix script names for foundations
parity.npmScripts = [
  "hello-world:ts",
  "tool-calling:ts",
  "accessibility-agent:ts",
  "migration-agent:ts",
  "migrate:python-ports",
  "sre-agent:ts",
  ...catalog.examples.map((e) => `${e.slug}:ts`)
];
parity.paths = [
  ...catalog.foundationExamples.map((f) => `examples/${f.slug}`),
  ...catalog.examples.map((e) => `examples/${e.slug}`)
];
fs.writeFileSync(parityPath, JSON.stringify(parity, null, 2) + "\n");

const customPythonPorts = new Set([
  "slack-bot",
  "spec-drafter",
  "codebase-explainer",
  "pr-summarizer",
  "risk-classifier",
]);

let refreshed = 0;
for (const entry of catalog.examples) {
  if (customPythonPorts.has(entry.slug)) continue;

  const base = path.join(rootDir, "examples", entry.slug);
  const toolsPath = path.join(base, "python/tools.py");
  if (!fs.existsSync(toolsPath)) continue;

  writeFile(toolsPath, pythonTools(entry.slug, entry.pattern, entry.lesson, entry.writes));
  writeFile(path.join(base, "python/main.py"), pythonMain(entry.slug, entry.pattern));
  if (entry.pattern === "CHAT") {
    writeFile(
      path.join(base, "python/agent.py"),
      pythonTools(entry.slug, entry.pattern, entry.lesson, entry.writes)
    );
  }
  if (entry.pattern === "PF") {
    writeFile(path.join(base, "ts/src/tools.ts"), toolsForPattern(entry));
  }
  refreshed++;
}

console.log(`Scaffolded ${created} new examples; refreshed ${refreshed} catalog ports.`);
