import { simulateAlertTriageBotChat } from "./simulate.js";

const text = process.argv
  .slice(2)
  .filter((arg) => arg !== "--approve" && arg !== "--reject" && arg !== "--offline")
  .join(" ")
  .trim();
const actionFlag = process.argv.find((arg) => arg === "--approve" || arg === "--reject");
const action =
  actionFlag === "--approve" ? "approve" : actionFlag === "--reject" ? "reject" : undefined;

try {
  const result = await simulateAlertTriageBotChat(
    { text, action },
    {
      apiKey: process.env.CURSOR_API_KEY,
      model: process.env.CURSOR_MODEL,
      skipSdk: process.argv.includes("--offline")
    }
  );
  console.log(result.plan);
  console.log(JSON.stringify({
    approved: result.approval.approved,
    record_created: result.record.created
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
