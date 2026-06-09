import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Agent } from "@cursor/sdk";
import {
  buildSreResponsePrompt,
  createPrToolState,
  createSreResponseTools
} from "./response.js";
import { buildSrePrompt, createSreCustomTools } from "./tools.js";

const exampleDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const fixturesDir = path.join(exampleDir, "fixtures");
const argv = process.argv.slice(2);
const reportOnly = argv.includes("--report-only");
const autoApprove = argv.includes("--auto-approve");
const positionalArgs = argv.filter((arg) => !arg.startsWith("--"));

try {
  if (reportOnly) {
    const incident = positionalArgs.join(" ").trim();
    const result = await Agent.prompt(buildSrePrompt(incident), {
      apiKey: requireEnv("CURSOR_API_KEY"),
      model: { id: requireEnv("CURSOR_MODEL") },
      local: {
        cwd: process.cwd(),
        customTools: createSreCustomTools()
      }
    });

    console.log(result.result ?? "");
  } else {
    const alertPayload = await loadAlertPayload(positionalArgs);
    const prState = createPrToolState(autoApprove);
    const result = await Agent.prompt(buildSreResponsePrompt(alertPayload), {
      apiKey: requireEnv("CURSOR_API_KEY"),
      model: { id: requireEnv("CURSOR_MODEL") },
      local: {
        cwd: fixturesDir,
        customTools: createSreResponseTools(prState)
      }
    });

    console.log(result.result ?? "");

    if (prState.prs.length > 0) {
      console.log("\n── Pull requests opened ──");
      for (const pr of prState.prs) {
        console.log(
          `#${pr.number} ${pr.merged ? "MERGED" : pr.approved ? "APPROVED" : "OPEN"}: ${pr.title}`
        );
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function loadAlertPayload(args: string[]): Promise<string> {
  if (args.length > 0) {
    const inline = args.join(" ").trim();
    try {
      JSON.parse(inline);
      return inline;
    } catch {
      return JSON.stringify(
        {
          event: {
            event_type: "incident.triggered",
            data: {
              title: inline,
              service: { summary: "checkout-api" }
            }
          }
        },
        null,
        2
      );
    }
  }

  const alertPath = path.join(fixturesDir, "alert.json");
  return fs.readFile(alertPath, "utf8");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this SDK example.`);
  }
  return value;
}
