import { afterEach, describe, expect, it } from "vitest";
import { shouldUseCloudAgent } from "../examples/slack-bot/ts/src/invoke.js";
import {
  normalizeRepoUrl,
  parseChannelRepos,
  resolveTargetRepo
} from "../examples/slack-bot/ts/src/repo-target.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("slack repo targeting", () => {
  it("normalizes bare GitHub URLs", () => {
    expect(normalizeRepoUrl("github.com/acme/checkout")).toBe(
      "https://github.com/acme/checkout"
    );
  });

  it("prefers a channel mapping over the default repo", () => {
    process.env.AGENT_DEFAULT_REPO = "https://github.com/acme/default";
    process.env.SLACK_CHANNEL_REPOS = JSON.stringify({
      C_CHECKOUT: "https://github.com/acme/checkout"
    });

    expect(resolveTargetRepo("C_CHECKOUT")).toEqual({
      cloudRepoUrl: "https://github.com/acme/checkout",
      localRepoRoot: expect.any(String),
      label: "https://github.com/acme/checkout",
      source: "channel"
    });
  });

  it("falls back to AGENT_DEFAULT_REPO when no channel mapping exists", () => {
    process.env.AGENT_DEFAULT_REPO = "https://github.com/acme/monorepo";

    const target = resolveTargetRepo("C_UNKNOWN");
    expect(target.cloudRepoUrl).toBe("https://github.com/acme/monorepo");
    expect(target.source).toBe("default");
  });

  it("uses AGENT_REPO_ROOT for local-only mode", () => {
    delete process.env.AGENT_DEFAULT_REPO;
    delete process.env.SLACK_CHANNEL_REPOS;
    process.env.AGENT_REPO_ROOT = "/data/repos/checkout";

    const target = resolveTargetRepo();
    expect(target.cloudRepoUrl).toBeUndefined();
    expect(target.localRepoRoot).toBe("/data/repos/checkout");
    expect(target.source).toBe("local-root");
  });

  it("rejects invalid SLACK_CHANNEL_REPOS JSON", () => {
    process.env.SLACK_CHANNEL_REPOS = "not-json";
    expect(() => parseChannelRepos()).toThrow(/valid JSON/);
  });

  it("routes cloud-first agents through cloud.repos when configured", () => {
    expect(
      shouldUseCloudAgent("spec-drafter", {
        apiKey: "key",
        model: "model",
        repoRoot: "/tmp",
        cloudRepoUrl: "https://github.com/acme/checkout",
        writesEnabled: false
      })
    ).toBe(true);

    expect(
      shouldUseCloudAgent("hello-world", {
        apiKey: "key",
        model: "model",
        repoRoot: "/tmp",
        cloudRepoUrl: "https://github.com/acme/checkout",
        writesEnabled: false
      })
    ).toBe(true);
  });
});
