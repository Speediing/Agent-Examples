import { Agent } from "@cursor/sdk";
import { Chat } from "chat";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { buildTriagePrompt } from "./agent.js";
import { approve, createApprovalState } from "./gate.js";
import { createTicket, openPr } from "./tools.js";

const approvalByThread = new Map<string, ReturnType<typeof createApprovalState>>();
const planByThread = new Map<string, string>();

export function createSlackBot() {
  const bot = new Chat({
    userName: "bug-triage",
    adapters: {
      slack: createSlackAdapter()
    },
    state: createMemoryState(),
    dedupeTtlMs: 600_000
  });

  bot.onNewMention(async (thread, message) => {
    await thread.subscribe();
    const threadId = thread.id;
    approvalByThread.set(threadId, createApprovalState());

    const prompt = buildTriagePrompt(message.text);
    const result = await Agent.prompt(prompt, {
      apiKey: requireEnv("CURSOR_API_KEY"),
      model: { id: requireEnv("CURSOR_MODEL") },
      local: { cwd: process.cwd() }
    });

    const plan = result.result ?? "No triage plan returned.";
    planByThread.set(threadId, plan);

    await thread.post(
      [
        plan,
        "",
        "Reply with `approve` to create a ticket and open a draft PR.",
        "Reply with `reject` to discard the plan."
      ].join("\n")
    );
  });

  bot.onSubscribedMessage(async (thread, message) => {
    const threadId = thread.id;
    const normalized = message.text.trim().toLowerCase();
    const approval = approvalByThread.get(threadId) ?? createApprovalState();
    approvalByThread.set(threadId, approval);
    const plan = planByThread.get(threadId) ?? message.text;

    if (normalized === "reject") {
      await thread.post("Rejected. No ticket or PR was created.");
      return;
    }

    if (normalized !== "approve") {
      await thread.post("Reply with `approve` or `reject` when you are ready.");
      return;
    }

    approve(approval);
    const ticket = createTicket({ plan, approval });
    const pr = openPr({ plan, repo: "platform/checkout", approval });

    await thread.post(
      [
        ticket.created
          ? `Ticket created: ${ticket.ticket?.id} (${ticket.ticket?.url})`
          : `Ticket not created: ${ticket.reason}`,
        pr.created
          ? `Draft PR opened: ${pr.pr?.id} (${pr.pr?.url})`
          : `PR not opened: ${pr.reason}`
      ].join("\n")
    );
  });

  return bot;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this SDK example.`);
  }
  return value;
}
