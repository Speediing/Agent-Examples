import { Agent } from "@cursor/sdk";
import { Chat } from "chat";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { approve, reject } from "./gate.js";
import { buildHelpMessage } from "./help.js";
import { invokeAgent, resolveRepoRoot } from "./invoke.js";
import { parseSlackMessage } from "./router.js";
import {
  clearThreadSession,
  createThreadSession,
  encodeSessionMarker,
  getThreadSession,
  setThreadSession,
  type SlackThreadState
} from "./thread-state.js";
import { createTicket, openPr } from "./tools.js";

export function createSlackBot() {
  const bot = new Chat<Record<"slack", ReturnType<typeof createSlackAdapter>>, SlackThreadState>({
    userName: "cursor-examples",
    adapters: {
      slack: createSlackAdapter()
    },
    state: createMemoryState(),
    dedupeTtlMs: 600_000
  });

  bot.onNewMention(async (thread, message) => {
    await thread.subscribe();
    await clearThreadSession(thread);

    const parsed = parseSlackMessage(message.text);

    if (parsed.kind === "help") {
      await thread.post(buildHelpMessage());
      return;
    }

    await thread.post(`Running \`${parsed.slug}\`...`);

    try {
      const result = await invokeAgent(parsed.slug, parsed.task, {
        apiKey: requireEnv("CURSOR_API_KEY"),
        model: requireEnv("CURSOR_MODEL"),
        repoRoot: resolveRepoRoot(),
        writesEnabled: false
      });

      if (result.requiresApproval) {
        const session = createThreadSession(
          parsed.slug,
          parsed.task,
          result.output
        );
        await setThreadSession(thread, session);

        await thread.post(
          [
            result.output,
            "",
            "Reply with `approve` to create a ticket and open a draft PR.",
            "Reply with `reject` to discard the plan.",
            encodeSessionMarker(session)
          ].join("\n")
        );
        return;
      }

      await thread.post(result.output);
    } catch (error) {
      await thread.post(
        error instanceof Error ? error.message : String(error)
      );
    }
  });

  bot.onSubscribedMessage(async (thread, message) => {
    const normalized = message.text.trim().toLowerCase();
    const session = await getThreadSession(thread);

    if (!session) {
      const reparsed = parseSlackMessage(message.text);
      if (reparsed.kind === "help") {
        await thread.post(buildHelpMessage());
        return;
      }

      if (reparsed.kind === "invoke") {
        await thread.post(
          "Start a new mention with `@cursor-examples <agent-slug> <task>`."
        );
      }
      return;
    }

    if (normalized === "reject") {
      if (session.approval.rejected) {
        await thread.post("This plan was already rejected.");
        return;
      }

      reject(session.approval);
      await clearThreadSession(thread);
      await thread.post("Rejected. No ticket or PR was created.");
      return;
    }

    if (normalized !== "approve") {
      await thread.post("Reply with `approve` or `reject` when you are ready.");
      return;
    }

    if (session.slug !== "slack-bot") {
      await thread.post(
        "This thread only supports approve/reject for the `slack-bot` triage flow."
      );
      return;
    }

    if (session.approval.approved) {
      await thread.post("This plan was already approved.");
      return;
    }

    approve(session.approval);
    await setThreadSession(thread, session);

    const ticket = createTicket({
      plan: session.plan,
      approval: session.approval
    });
    const pr = openPr({
      plan: session.plan,
      repo: "platform/checkout",
      approval: session.approval
    });

    await clearThreadSession(thread);

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
