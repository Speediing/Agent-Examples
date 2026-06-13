import type { SDKJsonValue } from "@cursor/sdk";
import {
  canExecuteSideEffects,
  recordSideEffect,
  type ApprovalState
} from "./gate.js";
import { parseTriagePlan } from "./agent.js";

let ticketCounter = 1;
let prCounter = 1;

export function readString(value: SDKJsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function createTicket(args: {
  plan?: SDKJsonValue;
  approval?: SDKJsonValue;
}) {
  const approval = args.approval as ApprovalState | undefined;
  const planText = readString(args.plan);

  if (!approval || !canExecuteSideEffects(approval)) {
    return {
      created: false,
      reason: "Side effects require an explicit human approval.",
      ticket: null
    };
  }

  const plan = parseTriagePlan(planText);
  const ticket = {
    id: `BUG-${ticketCounter++}`,
    title: plan.ticketTitle,
    url: `https://tracker.example.com/issues/BUG-${ticketCounter - 1}`
  };

  recordSideEffect(approval, {
    kind: "ticket",
    id: ticket.id,
    url: ticket.url
  });

  return {
    created: true,
    reason: null,
    ticket
  };
}

export function openPr(args: {
  plan?: SDKJsonValue;
  repo?: SDKJsonValue;
  approval?: SDKJsonValue;
}) {
  const approval = args.approval as ApprovalState | undefined;
  const planText = readString(args.plan);
  const repo = readString(args.repo) || "platform/checkout";

  if (!approval || !canExecuteSideEffects(approval)) {
    return {
      created: false,
      reason: "Side effects require an explicit human approval.",
      pr: null
    };
  }

  const plan = parseTriagePlan(planText);
  const pr = {
    id: `PR-${prCounter++}`,
    branch: `fix/${plan.ticketTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
    repo,
    url: `https://github.com/example/${repo}/pull/${prCounter - 1}`
  };

  recordSideEffect(approval, {
    kind: "pr",
    id: pr.id,
    url: pr.url
  });

  return {
    created: true,
    reason: null,
    pr
  };
}

export function createSlackBotCustomTools(approval: ApprovalState) {
  return {
    create_ticket: {
      description:
        "Create a tracker ticket from an approved triage plan. Only runs after a human approves.",
      inputSchema: {
        type: "object",
        properties: {
          plan: {
            type: "string",
            description: "Approved triage plan text"
          }
        },
        required: ["plan"]
      },
      execute: (args: { plan?: SDKJsonValue }) =>
        createTicket({ ...args, approval })
    },
    open_pr: {
      description:
        "Open a draft pull request from an approved triage plan. Only runs after a human approves.",
      inputSchema: {
        type: "object",
        properties: {
          plan: {
            type: "string",
            description: "Approved triage plan text"
          },
          repo: {
            type: "string",
            description: "Repository slug, for example platform/checkout"
          }
        },
        required: ["plan"]
      },
      execute: (args: { plan?: SDKJsonValue; repo?: SDKJsonValue }) =>
        openPr({ ...args, approval })
    }
  };
}
