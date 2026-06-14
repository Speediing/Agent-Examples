import { createApprovalState, type ApprovalState } from "./gate.js";

export type ThreadSession = {
  slug: string;
  task: string;
  plan: string;
  approval: ApprovalState;
};

const sessionsByThread = new Map<string, ThreadSession>();

export function getThreadSession(threadId: string): ThreadSession | undefined {
  return sessionsByThread.get(threadId);
}

export function setThreadSession(threadId: string, session: ThreadSession): void {
  sessionsByThread.set(threadId, session);
}

export function clearThreadSession(threadId: string): void {
  sessionsByThread.delete(threadId);
}

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
