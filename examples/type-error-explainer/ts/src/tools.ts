import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SDKJsonValue } from "@cursor/sdk";

const exampleRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function loadTscOutput(): string {
  return fs.readFileSync(
    path.join(exampleRoot, "fixtures/tsc-output.txt"),
    "utf8",
  );
}

function parseTscErrors(output: string) {
  const errors: { code: string; file: string; line: number; message: string }[] = [];
  const lineRe = /^(.+)\((\d+),\d+\): error (TS\d+): (.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: Number(match[2]),
      code: match[3],
      message: match[4],
    });
  }
  return errors;
}

export function parseTscOutput(args: { output_path?: SDKJsonValue }) {
  const output = loadTscOutput();
  const errors = parseTscErrors(output);
  return {
    output_path: readString(args.output_path) || "fixtures/tsc-output.txt",
    errors,
    count: errors.length,
    primary_code: errors[0]?.code ?? "",
    primary_file: errors[0]?.file ?? "",
    hint: errors[0]?.message ?? "",
  };
}

export function buildTypeErrorExplainerPrompt(task: string): string {
  return [
    "You are the Type Error Explainer.",
    "Compiler output explainer.",
    "Call parse_tsc_output first. Cite error codes and file paths from tool output only.",
    `Task: ${task || "Explain TypeScript errors from the tsc fixture."}`,
  ].join("\n");
}

export function createTypeErrorExplainerCustomTools() {
  return {
    parse_tsc_output: {
      description: "Parse tsc compiler output from the example fixture into structured errors.",
      inputSchema: {
        type: "object",
        properties: {
          output_path: { type: "string", description: "Optional path label" },
        },
      },
      execute: (args: { output_path?: SDKJsonValue }) => parseTscOutput(args),
    },
  };
}
