import { describe, expect, it } from "vitest";
import { runNpmScript } from "./helpers.js";

function withoutSdkEnv() {
  return {
    CURSOR_API_KEY: "",
    CURSOR_MODEL: ""
  };
}

describe("agent setup and negative cases", () => {
  it("hello-world exits when SDK credentials are missing", () => {
    const result = runNpmScript("hello-world:ts", ['"Ada"'], withoutSdkEnv());
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/Missing CURSOR_API_KEY/);
  });

  it("tool-calling exits when SDK credentials are missing", () => {
    const result = runNpmScript(
      "tool-calling:ts",
      ['"add 3 and 9"'],
      withoutSdkEnv()
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/Missing CURSOR_API_KEY/);
  });

  it("sre-agent exits when SDK credentials are missing", () => {
    const result = runNpmScript(
      "sre-agent:ts",
      ['"checkout-api returning 503 after deploy"'],
      withoutSdkEnv()
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/Missing CURSOR_API_KEY/);
  });

  it("accessibility full agent exits when SDK credentials are missing", () => {
    const result = runNpmScript(
      "accessibility-agent:ts",
      ['"focus on critical issues"'],
      withoutSdkEnv()
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/Missing CURSOR_API_KEY/);
  });

  it("accessibility scan-only runs without SDK credentials", () => {
    const result = runNpmScript(
      "accessibility-agent:ts",
      ["--scan-only"],
      withoutSdkEnv()
    );
    expect(result.stdout).toMatch(/Violations:/);
    expect(result.status).toBe(1);
  });

  it("accessibility scan-only fails for a missing file", () => {
    const result = runNpmScript(
      "accessibility-agent:ts",
      ["--scan-only", "/tmp/does-not-exist-accessibility-fixture.html"],
      withoutSdkEnv()
    );
    expect(result.status).not.toBe(0);
  });

  it("migration-agent audit runs without SDK credentials", () => {
    const result = runNpmScript("migration-agent:ts", [], withoutSdkEnv());
    expect(result.stdout).toMatch(/OK|STALE|MISSING|ERROR/);
    expect(result.stderr + result.stdout).not.toMatch(/Missing CURSOR_API_KEY/);
  });

  it("migration-agent skips SDK repair when credentials are missing", () => {
    const result = runNpmScript(
      "migration-agent:ts",
      ["--use-cursor-sdk"],
      withoutSdkEnv()
    );
    expect(result.stdout).toMatch(/SKIPPED Cursor SDK migration/);
    expect(result.stderr + result.stdout).not.toMatch(/Missing CURSOR_API_KEY/);
  });
});
