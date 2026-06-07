import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "./helpers.js";

const siteRepoPath =
  process.env.AGENT_EXAMPLE_SITE_PATH ??
  path.resolve(repoRoot, "../agent-example-site");

const postsPath = path.join(siteRepoPath, "app/blog/posts.ts");
const siteRepoAvailable = existsSync(postsPath);

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

describe.skipIf(!siteRepoAvailable)(
  "docs↔code parity (requires agent-example-site checkout)",
  () => {
    it("aligns cookbook paths and npm scripts with this repository", () => {
      const postsSource = readFileSync(postsPath, "utf8");
      const { paths, commands } = extractDocFields(postsSource);

      expect(paths.length).toBeGreaterThan(0);
      expect(commands.length).toBeGreaterThan(0);

      for (const examplePath of paths) {
        if (!examplePath.startsWith("examples/")) {
          continue;
        }

        expect(
          readFileSync(
            path.join(repoRoot, examplePath, "ts/package.json"),
            "utf8"
          )
        ).toContain('"name"');
      }

      for (const command of commands) {
        for (const script of extractNpmScripts(command)) {
          expect(packageScripts[script]).toBeTruthy();
        }
      }
    });
  }
);

describe("docs↔code parity fixture", () => {
  it("aligns committed cookbook metadata with this repository", () => {
    const fixturePath = path.join(
      repoRoot,
      "eval/fixtures/cookbook-parity.json"
    );
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      paths: string[];
      npmScripts: string[];
    };

    for (const examplePath of fixture.paths) {
      expect(examplePath.startsWith("examples/")).toBe(true);
      expect(
        readFileSync(
          path.join(repoRoot, examplePath, "ts/package.json"),
          "utf8"
        )
      ).toContain('"name"');
    }

    for (const script of fixture.npmScripts) {
      expect(packageScripts[script]).toBeTruthy();
    }
  });
});
