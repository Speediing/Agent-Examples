import { createSlackBot } from "./bot.js";
import { createWebhookServer } from "./webhook.js";

const port = Number(process.env.PORT ?? 3000);
const bot = createSlackBot();
const { server, listen } = createWebhookServer(bot, port);

try {
  await listen();
  console.log(`cursor-examples Slack bot listening on http://localhost:${port}`);
  console.log(`Slack webhook URL: http://localhost:${port}/api/webhooks/slack`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  server.close();
  process.exitCode = 1;
}
