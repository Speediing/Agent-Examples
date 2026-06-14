import { simulateSlackTriage } from "./simulate.js";
import { buildHelpMessage } from "./help.js";
import { invokeAgentOffline, invokeAgent, resolveRepoRoot } from "./invoke.js";
import { parseSlackMessage } from "./router.js";
import { listAgentSlugs } from "./catalog.js";

try {
  const args = process.argv.slice(2);
  const offline = args.includes("--offline");
  const serve = args.includes("--serve");
  const showHelp = args.includes("--help");
  const act = args.includes("--act");
  const actionFlag = args.find((arg) => arg === "--approve" || arg === "--reject");
  const action =
    actionFlag === "--approve"
      ? "approve"
      : actionFlag === "--reject"
        ? "reject"
        : undefined;

  const cleanedArgs = args.filter(
    (arg) =>
      arg !== "--offline" &&
      arg !== "--serve" &&
      arg !== "--help" &&
      arg !== "--act" &&
      arg !== "--approve" &&
      arg !== "--reject"
  );

  if (serve) {
    await import("./serve.js");
  } else if (showHelp) {
    console.log(buildHelpMessage());
    console.log("");
    console.log(`Registered agents: ${listAgentSlugs().length}`);
  } else {
    const messageText = cleanedArgs.join(" ").trim();
    const parsed = parseSlackMessage(messageText);

    if (parsed.kind === "help" && !messageText) {
      console.log(buildHelpMessage());
    } else if (parsed.kind === "invoke") {
      if (parsed.slug === "slack-bot") {
        const result = await simulateSlackTriage(
          {
            text: parsed.task || messageText,
            action
          },
          {
            apiKey: process.env.CURSOR_API_KEY,
            model: process.env.CURSOR_MODEL,
            skipSdk: offline
          }
        );

        console.log(result.plan);
        console.log("");
        console.log(
          JSON.stringify(
            {
              agent: "slack-bot",
              approved: result.approval.approved,
              rejected: result.approval.rejected,
              ticket_created: result.ticket.created,
              pr_created: result.pr.created,
              side_effects: result.approval.sideEffects
            },
            null,
            2
          )
        );
      } else {
        const context = {
          apiKey: process.env.CURSOR_API_KEY ?? "",
          model: process.env.CURSOR_MODEL ?? "",
          repoRoot: resolveRepoRoot(),
          writesEnabled: act
        };

        const result =
          offline || !context.apiKey || !context.model
            ? await invokeAgentOffline(parsed.slug, parsed.task)
            : await invokeAgent(parsed.slug, parsed.task, context);

        console.log(result.output);
        console.log("");
        console.log(
          JSON.stringify(
            {
              agent: parsed.slug,
              requires_approval: result.requiresApproval,
              offline
            },
            null,
            2
          )
        );
      }
    } else {
      console.log(buildHelpMessage());
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
