import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSlackBot } from "../../ts/dist/bot.js";

const bot = createSlackBot();

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  if (request.method === "GET") {
    response
      .status(200)
      .send("cursor-examples Slack bot is running. POST /api/webhooks/slack");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).send("Method not allowed");
    return;
  }

  const slackHandler = bot.webhooks.slack;
  if (!slackHandler) {
    response.status(404).send("Slack adapter not configured");
    return;
  }

  const host = request.headers.host ?? "localhost";
  const url = `https://${host}${request.url ?? "/api/webhooks/slack"}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  }

  const body =
    typeof request.body === "string"
      ? request.body
      : request.body
        ? JSON.stringify(request.body)
        : undefined;

  const slackResponse = await slackHandler(
    new Request(url, {
      method: "POST",
      headers,
      body
    })
  );

  response.status(slackResponse.status);
  slackResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });
  response.send(Buffer.from(await slackResponse.arrayBuffer()));
}
