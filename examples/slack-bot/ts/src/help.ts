import { AGENT_CATALOG, type AgentDefinition, type AgentStage } from "./catalog.js";

const STAGE_ORDER: AgentStage[] = [
  "plan",
  "develop",
  "review",
  "test",
  "release",
  "operate"
];

function formatAgentLine(agent: AgentDefinition): string {
  const flags = [
    agent.offline ? "offline" : null,
    agent.writes ? "writes" : null
  ]
    .filter(Boolean)
    .join(", ");

  const suffix = flags ? ` (${flags})` : "";
  return `• \`${agent.slug}\` — ${agent.title}${suffix}`;
}

export function buildHelpMessage(): string {
  const lines = [
    "I route mentions to every Cursor SDK example in this repo.",
    "",
    "Usage: `@cursor-examples <agent-slug> <task>`",
    "Examples:",
    "• `@cursor-examples spec-drafter Add dark mode to settings`",
    "• `@cursor-examples sre-agent checkout-api 503 after deploy`",
    "• `@cursor-examples codebase-explainer examples/hello-world How does it work?`",
    "",
    "Reply `help` or `list` to see this menu.",
    "Agents with `writes` post a plan first; reply `approve` or `reject` before side effects run.",
    "",
    "Available agents:"
  ];

  for (const stage of STAGE_ORDER) {
    const agents = AGENT_CATALOG.filter((agent) => agent.stage === stage);
    if (agents.length === 0) {
      continue;
    }

    lines.push("", `*${stage.charAt(0).toUpperCase()}${stage.slice(1)}*`);
    lines.push(...agents.map(formatAgentLine));
  }

  return lines.join("\n");
}
