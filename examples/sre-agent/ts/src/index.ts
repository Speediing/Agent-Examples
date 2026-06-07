import { Agent, type SDKJsonValue } from "@cursor/sdk";
import {
  ALERTS,
  ERROR_LOGS,
  METRIC_SAMPLES,
  RECENT_DEPLOYMENTS,
  RUNBOOKS,
  SERVICE_HEALTH
} from "./mock-data.js";

try {
  const incident = process.argv.slice(2).join(" ").trim();
  const result = await Agent.prompt(buildPrompt(incident), {
    apiKey: requireEnv("CURSOR_API_KEY"),
    model: { id: requireEnv("CURSOR_MODEL") },
    local: {
      cwd: process.cwd(),
      customTools: {
        get_service_health: {
          description:
            "Return a health summary for a service: status, error rate, latency, and pool utilization.",
          inputSchema: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description:
                  "Service name, for example checkout-api or payments-worker"
              }
            },
            required: ["service"]
          },
          execute: (args) => {
            const service = readString(args.service);
            const health = SERVICE_HEALTH[service];

            return {
              found: Boolean(health),
              service,
              health: health ?? null,
              known_services: health ? [] : Object.keys(SERVICE_HEALTH)
            };
          }
        },
        get_recent_deployments: {
          description:
            "List recent deployments, optionally filtered to one service.",
          inputSchema: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Optional service name filter"
              },
              limit: {
                type: "number",
                description: "Maximum number of deployments to return"
              }
            }
          },
          execute: (args) => {
            const service = readOptionalString(args.service);
            const limit = readPositiveInt(args.limit, 5);
            const deployments = RECENT_DEPLOYMENTS.filter(
              (deployment) => !service || deployment.service === service
            ).slice(0, limit);

            return { deployments, count: deployments.length };
          }
        },
        get_alerts: {
          description:
            "Return active or historical alerts, optionally filtered by service.",
          inputSchema: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Optional service name filter"
              },
              active_only: {
                type: "boolean",
                description: "When true, return only unresolved alerts"
              }
            }
          },
          execute: (args) => {
            const service = readOptionalString(args.service);
            const activeOnly = args.active_only === true;
            const alerts = ALERTS.filter((alert) => {
              if (service && alert.service !== service) {
                return false;
              }

              if (activeOnly && alert.resolved) {
                return false;
              }

              return true;
            });

            return { alerts, count: alerts.length };
          }
        },
        query_metrics: {
          description:
            "Run a PromQL-style metrics query against the mock observability backend.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "PromQL expression to evaluate"
              }
            },
            required: ["query"]
          },
          execute: (args) => {
            const query = readString(args.query);
            const value = METRIC_SAMPLES[query];

            return {
              query,
              value: value ?? null,
              known_queries: Object.keys(METRIC_SAMPLES)
            };
          }
        },
        get_error_logs: {
          description:
            "Return recent error log lines for a service from the mock log store.",
          inputSchema: {
            type: "object",
            properties: {
              service: { type: "string" },
              limit: { type: "number" }
            },
            required: ["service"]
          },
          execute: (args) => {
            const service = readString(args.service);
            const limit = readPositiveInt(args.limit, 10);
            const lines = (ERROR_LOGS[service] ?? []).slice(0, limit);

            return { service, lines, count: lines.length };
          }
        },
        lookup_runbook: {
          description:
            "Find a structured investigation runbook for a symptom or incident type.",
          inputSchema: {
            type: "object",
            properties: {
              symptom: {
                type: "string",
                description:
                  "Short symptom description, for example checkout 503"
              }
            },
            required: ["symptom"]
          },
          execute: (args) => {
            const symptom = readString(args.symptom).toLowerCase();
            const runbook = RUNBOOKS.find((candidate) =>
              candidate.symptom.toLowerCase().includes(symptom)
            );

            return {
              found: Boolean(runbook),
              symptom,
              runbook: runbook ?? null,
              known_symptoms: runbook
                ? []
                : RUNBOOKS.map((candidate) => candidate.symptom)
            };
          }
        }
      }
    }
  });

  console.log(result.result ?? "");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function buildPrompt(incident: string): string {
  return [
    "You are the Site Reliability Agent.",
    "Investigate the incident using the available read-only observability tools.",
    "Correlate health, alerts, deployments, metrics, logs, and runbooks before concluding.",
    "Do not guess facts that a tool can return. Call tools until you have enough evidence.",
    "This example is read-only: recommend remediation steps but do not claim you applied changes.",
    "Return a concise incident report with these sections:",
    "1. Summary",
    "2. Timeline",
    "3. Root cause hypothesis",
    "4. Evidence (cite tool results)",
    "5. Recommended next actions",
    "6. Postmortem draft (bullets only)",
    `Incident report: ${incident || "checkout-api returning 503 errors after a deploy"}`
  ].join("\n");
}

function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: SDKJsonValue | undefined): string | undefined {
  const normalized = readString(value);
  return normalized || undefined;
}

function readPositiveInt(value: SDKJsonValue | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this SDK example.`);
  }
  return value;
}
