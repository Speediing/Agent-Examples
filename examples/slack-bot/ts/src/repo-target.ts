import path from "node:path";
import { fileURLToPath } from "node:url";
import type { InvokeContext } from "./invoke.js";

export type TargetRepoSource = "channel" | "default" | "local-root" | "examples-repo";

export type TargetRepo = {
  cloudRepoUrl?: string;
  localRepoRoot: string;
  label: string;
  source: TargetRepoSource;
};

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export function resolveExamplesRepoRoot(): string {
  return path.resolve(moduleDir, "../../../..");
}

export function normalizeRepoUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Repository URL cannot be empty.");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  return `https://${trimmed.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export function parseChannelRepos(
  raw = process.env.SLACK_CHANNEL_REPOS
): Record<string, string> {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(
      "SLACK_CHANNEL_REPOS must be valid JSON, e.g. {\"C0123\":\"https://github.com/acme/checkout\"}."
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("SLACK_CHANNEL_REPOS must be a JSON object of channel ID to repo URL.");
  }

  const repos: Record<string, string> = {};
  for (const [channelId, repoUrl] of Object.entries(parsed)) {
    if (typeof repoUrl !== "string" || !repoUrl.trim()) {
      throw new Error(`SLACK_CHANNEL_REPOS["${channelId}"] must be a non-empty repo URL.`);
    }
    repos[channelId] = normalizeRepoUrl(repoUrl);
  }

  return repos;
}

export function resolveTargetRepo(channelId?: string): TargetRepo {
  const examplesRoot = resolveExamplesRepoRoot();
  const localRoot = process.env.AGENT_REPO_ROOT?.trim()
    ? path.resolve(process.env.AGENT_REPO_ROOT)
    : examplesRoot;
  const channelRepos = parseChannelRepos();

  if (channelId && channelRepos[channelId]) {
    const cloudRepoUrl = channelRepos[channelId];
    return {
      cloudRepoUrl,
      localRepoRoot: localRoot,
      label: cloudRepoUrl,
      source: "channel"
    };
  }

  const defaultRepo = process.env.AGENT_DEFAULT_REPO?.trim();
  if (defaultRepo) {
    const cloudRepoUrl = normalizeRepoUrl(defaultRepo);
    return {
      cloudRepoUrl,
      localRepoRoot: localRoot,
      label: cloudRepoUrl,
      source: "default"
    };
  }

  if (process.env.AGENT_REPO_ROOT?.trim()) {
    return {
      localRepoRoot: localRoot,
      label: localRoot,
      source: "local-root"
    };
  }

  return {
    localRepoRoot: examplesRoot,
    label: "Agent-Examples (demo)",
    source: "examples-repo"
  };
}

export function buildInvokeContext(
  channelId: string | undefined,
  options: {
    apiKey: string;
    model: string;
    writesEnabled?: boolean;
  }
): InvokeContext & { target: TargetRepo } {
  const target = resolveTargetRepo(channelId);

  return {
    target,
    apiKey: options.apiKey,
    model: options.model,
    repoRoot: target.localRepoRoot,
    cloudRepoUrl: target.cloudRepoUrl,
    writesEnabled: options.writesEnabled ?? false
  };
}
