import { createApprovalState, type ApprovalState } from "./gate.js";

export type ThreadSession = {
  slug: string;
  task: string;
  plan: string;
  approval: ApprovalState;
};

export type SlackThreadState = {
  approvalSession?: ThreadSession;
};

const SESSION_MARKER_PREFIX = "cursor-session:";

type ThreadStateAccess = {
  state: Promise<SlackThreadState | null>;
  setState: (state: Partial<SlackThreadState>) => Promise<void>;
};

type ThreadMessageAccess = {
  allMessages: AsyncIterable<{ text?: string }>;
};

export function createThreadSession(
  slug: string,
  task: string,
  plan: string
): ThreadSession {
  return {
    slug,
    task,
    plan,
    approval: createApprovalState()
  };
}

export function encodeSessionMarker(session: ThreadSession): string {
  const payload = Buffer.from(
    JSON.stringify({
      slug: session.slug,
      task: session.task,
      plan: session.plan
    }),
    "utf8"
  ).toString("base64url");

  return `${SESSION_MARKER_PREFIX}${payload}`;
}

function decodeSessionMarker(text: string): ThreadSession | undefined {
  const markerIndex = text.lastIndexOf(SESSION_MARKER_PREFIX);
  if (markerIndex < 0) {
    return undefined;
  }

  const payload = text.slice(markerIndex + SESSION_MARKER_PREFIX.length).trim();
  if (!payload) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Pick<ThreadSession, "slug" | "task" | "plan">;

    return createThreadSession(parsed.slug, parsed.task, parsed.plan);
  } catch {
    return undefined;
  }
}

export async function recoverSessionFromThread(
  thread: ThreadMessageAccess
): Promise<ThreadSession | undefined> {
  let latest: ThreadSession | undefined;

  for await (const message of thread.allMessages) {
    const recovered = decodeSessionMarker(message.text ?? "");
    if (recovered) {
      latest = recovered;
    }
  }

  return latest;
}

export async function getThreadSession(
  thread: ThreadStateAccess & ThreadMessageAccess
): Promise<ThreadSession | undefined> {
  const state = await thread.state;
  if (state?.approvalSession) {
    return state.approvalSession;
  }

  return recoverSessionFromThread(thread);
}

export async function setThreadSession(
  thread: ThreadStateAccess,
  session: ThreadSession
): Promise<void> {
  await thread.setState({ approvalSession: session });
}

export async function clearThreadSession(
  thread: ThreadStateAccess
): Promise<void> {
  await thread.setState({ approvalSession: undefined });
}
