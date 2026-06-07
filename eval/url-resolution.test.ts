import { describe, expect, it } from "vitest";
import {
  defaultFixtureUrl,
  resolveTargetUrl
} from "../examples/accessibility-agent/ts/src/scan.js";

describe("accessibility URL resolution", () => {
  it("defaults to the committed fixture when no input is provided", () => {
    expect(resolveTargetUrl(undefined)).toBe(defaultFixtureUrl());
  });

  it("preserves absolute http(s) URLs", () => {
    expect(resolveTargetUrl("https://example.com/page")).toBe(
      "https://example.com/page"
    );
  });

  it("resolves relative filesystem paths to file URLs", () => {
    const resolved = resolveTargetUrl(
      "examples/accessibility-agent/fixtures/page-with-issues.html"
    );
    expect(resolved.startsWith("file://")).toBe(true);
    expect(resolved).toContain("page-with-issues.html");
  });
});
