import { simulateSlackTriage } from "./simulate.js";

const threadText = process.argv.slice(2).join(" ").trim();
const actionFlag = process.argv.find((arg) => arg === "--approve" || arg === "--reject");
const action =
  actionFlag === "--approve" ? "approve" : actionFlag === "--reject" ? "reject" : undefined;
const cleanedText = process.argv
  .slice(2)
  .filter((arg) => arg !== "--approve" && arg !== "--reject")
  .join(" ")
  .trim();

try {
  const result = await simulateSlackTriage(
    {
      text: cleanedText || threadText,
      action
    },
    {
      apiKey: process.env.CURSOR_API_KEY,
      model: process.env.CURSOR_MODEL,
      skipSdk: process.argv.includes("--offline")
    }
  );

  console.log(result.plan);
  console.log("");
  console.log(
    JSON.stringify(
      {
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
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
