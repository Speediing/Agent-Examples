import type { SDKJsonValue } from "@cursor/sdk";
import { readPositiveInt, readString } from "./tools.js";

export type PullRequestRecord = {
  number: number;
  title: string;
  body: string;
  diff: string;
  merged: boolean;
  approved: boolean;
};

export type PrToolState = {
  prs: PullRequestRecord[];
  autoApprove: boolean;
};

export function createPrToolState(autoApprove = false): PrToolState {
  return { prs: [], autoApprove };
}

export function openPullRequest(
  state: PrToolState,
  args: {
    title?: SDKJsonValue;
    body?: SDKJsonValue;
    diff?: SDKJsonValue;
  }
) {
  const title = readString(args.title);
  const body = readString(args.body);
  const diff = readString(args.diff);

  if (!title || !body || !diff) {
    return {
      opened: false,
      pr_number: null,
      url: null,
      error: "title, body, and diff are required"
    };
  }

  const prNumber = state.prs.length + 1;
  state.prs.push({
    number: prNumber,
    title,
    body,
    diff,
    merged: false,
    approved: false
  });

  return {
    opened: true,
    pr_number: prNumber,
    url: `mock://infra/pull/${prNumber}`,
    error: null
  };
}

export function requestApproval(
  state: PrToolState,
  args: { summary?: SDKJsonValue }
) {
  const summary = readString(args.summary);

  if (!summary) {
    return {
      decision: "rejected",
      summary: null,
      error: "summary is required",
      message: null
    };
  }

  const latestPr = state.prs.at(-1);
  if (!latestPr) {
    return {
      decision: "rejected",
      summary: null,
      error: "open_pull_request must run first",
      message: null
    };
  }

  if (!state.autoApprove) {
    return {
      decision: "pending",
      summary: null,
      error: null,
      message:
        "Human approval required. Re-run with --auto-approve for a non-interactive demo."
    };
  }

  latestPr.approved = true;
  return { decision: "approved", summary, error: null, message: null };
}

export function mergePullRequest(
  state: PrToolState,
  args: { pr_number?: SDKJsonValue }
) {
  const prNumber = readPositiveInt(args.pr_number, 0);
  const pr = state.prs.find((record) => record.number === prNumber);

  if (!pr) {
    return {
      merged: false,
      pr_number: null,
      error: `PR #${prNumber} not found`
    };
  }

  if (!pr.approved) {
    return {
      merged: false,
      pr_number: null,
      error: "PR is not approved. Call request_approval first."
    };
  }

  pr.merged = true;
  return { merged: true, pr_number: pr.number, error: null };
}
