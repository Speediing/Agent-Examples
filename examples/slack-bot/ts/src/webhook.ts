import { createServer, type IncomingMessage } from "node:http";
import type { Chat } from "chat";

async function toWebRequest(
  request: IncomingMessage,
  url: URL
): Promise<Request> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  }

  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  return new Request(url, {
    method: request.method ?? "GET",
    headers,
    body: body ? new Uint8Array(body) : undefined
  });
}

export function createWebhookServer(
  bot: Chat,
  port = Number(process.env.PORT ?? 3000)
) {
  const server = createServer(async (request, response) => {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`
    );

    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end(
        "cursor-examples Slack bot is running. POST /api/webhooks/slack"
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/webhooks/slack") {
      const handler = bot.webhooks.slack;
      if (!handler) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Slack adapter not configured");
        return;
      }

      const slackResponse = await handler(await toWebRequest(request, url));
      response.writeHead(
        slackResponse.status,
        Object.fromEntries(slackResponse.headers.entries())
      );
      response.end(Buffer.from(await slackResponse.arrayBuffer()));
      return;
    }

    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });

  return {
    server,
    listen() {
      return new Promise<void>((resolve, reject) => {
        server.listen(port, () => resolve());
        server.on("error", reject);
      });
    },
    port
  };
}
