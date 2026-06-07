import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./helpers.js";

const siteRepoPath =
  process.env.AGENT_EXAMPLE_SITE_PATH ??
  path.resolve(repoRoot, "../agent-example-site");

const packageScripts = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8")
).scripts as Record<string, string>;

function extractNpmScripts(command: string): string[] {
  const matches = [...command.matchAll(/npm run ([^\s]+)/g)];
  return matches.map((match) => match[1] ?? "").filter(Boolean);
}

function extractDocFields(source: string) {
  const paths = [...source.matchAll(/path:\s*"([^"]+)"/g)].map(
    (match) => match[1] ?? ""
  );
  const commands = [
    ...source.matchAll(/command:\s*'([^']+)'/g),
    ...source.matchAll(/command:\s*"([^"]+)"/g),
    ...source.matchAll(/command:\s*\n\s*"([^"]+)"/g),
    ...source.matchAll(/command:\s*\n\s*'([^']+)'/g)
  ].map((match) => match[1] ?? "");

  return { paths, commands };
}

describe("docs↔code parity", () => {
  it("aligns cookbook paths and npm scripts with this repository", () => {
    const postsSource = readFileSync(
      path.join(siteRepoPath, "app/blog/posts.ts"),
      "utf8"
    );
    const { paths, commands } = extractDocFields(postsSource);

    expect(paths.length).toBeGreaterThan(0);
    expect(commands.length).toBeGreaterThan(0);

    for (const examplePath of paths) {
      expect(examplePath.startsWith("examples/")).toBe(true);
      expect(
        readFileSync(path.join(repoRoot, examplePath, "ts/package.json"), "utf8")
      ).toContain('"name"');
    }

    for (const command of commands) {
      for (const script of extractNpmScripts(command)) {
        expect(packageScripts[script]).toBeTruthy();
      }
    }
  });
});
