import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type TraceFixture = {
  case_id: string;
  expected_tool_order: string[];
  completed_tool_calls: { name: string; args: Record<string, unknown> }[];
  grounding_rules: string[];
};

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadTraceFixture(caseId?: string): TraceFixture {
  const raw = fs.readFileSync(
    path.join(exampleRoot, "fixtures/sample-trace.json"),
    "utf8",
  );
  const fixture = JSON.parse(raw) as TraceFixture;
  if (caseId && caseId !== fixture.case_id) {
    return { ...fixture, case_id: caseId };
  }
  return fixture;
}

export function loadTraceFixtureTool(args: { case_id?: SDKJsonValue }) {
  const caseId = readString(args.case_id) || "accessibility-agent-tier1";
  const fixture = loadTraceFixture(caseId);
  return {
    case_id: fixture.case_id,
    tool_names: fixture.completed_tool_calls.map((call) => call.name),
    expected_tool_order: fixture.expected_tool_order,
    grounding_rules: fixture.grounding_rules,
    count: fixture.completed_tool_calls.length,
  };
}

export function gradeTraceGrounding(args: { case_id?: SDKJsonValue }) {
  const fixture = loadTraceFixture(readString(args.case_id));
  const actual = fixture.completed_tool_calls.map((call) => call.name);
  const expected = fixture.expected_tool_order;
  const tool_order_match =
    actual.length === expected.length &&
    actual.every((name, index) => name === expected[index]);

  return {
    case_id: fixture.case_id,
    tool_order_match,
    expected_tool_order: expected,
    actual_tool_order: actual,
    grounding_rules: fixture.grounding_rules,
    passed: tool_order_match,
  };
}

export function buildEvalTraceGraderPrompt(task: string): string {
  return [
    "You are the Eval Trace Grader.",
    "Behavioral eval grader.",
    "Call load_trace_fixture then grade_trace_grounding. Explain pass/fail using tool output only.",
    `Task: ${task || "Grade an agent trace fixture for tool order and grounding."}`,
  ].join("\n");
}

export function createEvalTraceGraderCustomTools() {
  return {
    load_trace_fixture: {
      description: "Load a tier1-style trace fixture with expected tool order and grounding rules.",
      inputSchema: {
        type: "object",
        properties: {
          case_id: { type: "string", description: "Eval case id" },
        },
      },
      execute: (args: { case_id?: SDKJsonValue }) => loadTraceFixtureTool(args),
    },
    grade_trace_grounding: {
      description: "Compare completed tool calls in the fixture against expected order.",
      inputSchema: {
        type: "object",
        properties: {
          case_id: { type: "string", description: "Eval case id" },
        },
      },
      execute: (args: { case_id?: SDKJsonValue }) => gradeTraceGrounding(args),
    },
  };
}
