import { describe, expect, it } from "vitest";
import { listAgentSlugs, AGENT_BY_SLUG } from "../examples/slack-bot/ts/src/catalog.js";
import { buildHelpMessage } from "../examples/slack-bot/ts/src/help.js";
import { parseSlackMessage } from "../examples/slack-bot/ts/src/router.js";
import catalogJson from "../scripts/sdlc-catalog.json" with { type: "json" };

describe("slack multi-agent router", () => {
  it("registers every catalog and foundation example", () => {
    const expectedSlugs = [
      ...catalogJson.examples.map((example) => example.slug),
      ...catalogJson.foundationExamples.map((example) => example.slug)
    ].sort();

    expect(listAgentSlugs().sort()).toEqual(expectedSlugs);
  });

  it("parses agent slugs from mention text", () => {
    expect(parseSlackMessage("spec-drafter Add dark mode")).toEqual({
      kind: "invoke",
      slug: "spec-drafter",
      task: "Add dark mode"
    });
  });

  it("strips bot mentions before routing", () => {
    expect(
      parseSlackMessage("<@U123> codebase-explainer examples/hello-world entry flow")
    ).toEqual({
      kind: "invoke",
      slug: "codebase-explainer",
      task: "examples/hello-world entry flow"
    });
  });

  it("defaults unknown text to slack-bot triage", () => {
    expect(parseSlackMessage("checkout-api returns 503 after deploy")).toEqual({
      kind: "invoke",
      slug: "slack-bot",
      task: "checkout-api returns 503 after deploy"
    });
  });

  it("returns help for unknown slugs only when explicitly requested", () => {
    expect(parseSlackMessage("help")).toEqual({
      kind: "help"
    });
  });

  it("includes offline validators in the help menu", () => {
    const help = buildHelpMessage();
    expect(help).toContain("`bugbot`");
    expect(help).toContain("`security-reviewer`");
    expect(help).toContain("`sre-agent`");
    expect(AGENT_BY_SLUG.get("hello-world")?.offline).toBe(false);
    expect(AGENT_BY_SLUG.get("bugbot")?.offline).toBe(true);
  });
});
