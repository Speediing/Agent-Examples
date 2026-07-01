import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, type SDKCustomTool } from "@cursor/sdk";
import { AGENT_BY_SLUG } from "./catalog.js";
import { buildTriagePrompt } from "./agent.js";

export type InvokeContext = {
  apiKey: string;
  model: string;
  repoRoot: string;
  cloudRepoUrl?: string;
  writesEnabled: boolean;
};

export const CLOUD_FIRST_AGENT_SLUGS = new Set([
  "spec-drafter",
  "codebase-explainer",
  "sre-agent"
]);

export function shouldUseCloudAgent(
  slug: string,
  context: InvokeContext
): boolean {
  return Boolean(context.cloudRepoUrl && CLOUD_FIRST_AGENT_SLUGS.has(slug));
}

function augmentPromptForCloud(prompt: string, repoUrl: string): string {
  return [
    prompt,
    "",
    `Repository: ${repoUrl}`,
    "You are running as a Cursor cloud agent with access to this repository.",
    "Read files directly from the repository. Do not invent paths, exports, or behavior you did not inspect."
  ].join("\n");
}

async function runCloudPrompt(
  prompt: string,
  context: InvokeContext
): Promise<string> {
  if (!context.cloudRepoUrl) {
    throw new Error("Cloud repository URL is required for cloud agent runs.");
  }

  const result = await Agent.prompt(
    augmentPromptForCloud(prompt, context.cloudRepoUrl),
    {
      apiKey: context.apiKey,
      model: { id: context.model },
      cloud: {
        repos: [{ url: context.cloudRepoUrl }],
        autoCreatePR: false
      }
    }
  );

  return result.result ?? "No response returned.";
}

export type InvokeResult = {
  output: string;
  requiresApproval: boolean;
};

type PromptAgentModule = {
  buildPrompt: (task: string) => string;
  createTools?: (rootDir: string) => Record<string, SDKCustomTool>;
};

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function assertPathWithinRoot(resolvedPath: string, root: string): void {
  const normalized = path.resolve(resolvedPath);
  const normalizedRoot = path.resolve(root);
  if (
    normalized !== normalizedRoot &&
    !normalized.startsWith(normalizedRoot + path.sep)
  ) {
    throw new Error(`Diff path must be under ${normalizedRoot}`);
  }
}

async function withWritesEnabled<T>(
  enabled: boolean,
  fn: () => Promise<T>
): Promise<T> {
  if (!enabled) {
    return fn();
  }

  const originalArgv = process.argv;
  process.argv = [...originalArgv, "--act"];
  try {
    return await fn();
  } finally {
    process.argv = originalArgv;
  }
}

export function resolveRepoRoot(): string {
  return path.resolve(moduleDir, "../../../..");
}

function exampleModulePath(slug: string, file: string): string {
  return new URL(`../../../${slug}/ts/dist/${file}`, import.meta.url).pathname;
}

async function runPromptAgent(
  module: PromptAgentModule,
  task: string,
  context: InvokeContext,
  options: { cwd?: string; useRepoTools?: boolean } = {}
): Promise<string> {
  const result = await Agent.prompt(module.buildPrompt(task), {
    apiKey: context.apiKey,
    model: { id: context.model },
    local: {
      cwd: options.cwd ?? context.repoRoot,
      customTools: options.useRepoTools
        ? module.createTools?.(context.repoRoot)
        : module.createTools?.(context.repoRoot) ?? module.createTools?.("")
    }
  });

  return result.result ?? "No response returned.";
}

function parseCodebaseExplainerTask(
  task: string,
  options: { cloudRepo?: boolean } = {}
): {
  modulePath: string;
  question: string;
} {
  const defaultModulePath = options.cloudRepo ? "." : "examples/hello-world";
  const tokens = task.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return {
      modulePath: defaultModulePath,
      question: options.cloudRepo
        ? "What are the main modules and entrypoints in this repository?"
        : "How does this example work end to end?"
    };
  }

  const first = tokens[0];
  if (
    first.startsWith("examples/") ||
    first === "." ||
    (!options.cloudRepo && first.includes("/")) ||
    (options.cloudRepo && first.includes("/") && !first.includes(" "))
  ) {
    return {
      modulePath: first,
      question:
        tokens.slice(1).join(" ").trim() ||
        (options.cloudRepo
          ? "How does this part of the repository work?"
          : "How does this example work?")
    };
  }

  return {
    modulePath: defaultModulePath,
    question: task
  };
}

async function loadToolsModule(
  slug: string
): Promise<Record<string, unknown>> {
  return (await import(exampleModulePath(slug, "tools.js"))) as Record<
    string,
    unknown
  >;
}

async function loadAgentModule(slug: string): Promise<Record<string, unknown>> {
  return (await import(exampleModulePath(slug, "agent.js"))) as Record<
    string,
    unknown
  >;
}

async function invokeOfflineValidator(
  slug: "bugbot" | "security-reviewer",
  task: string
): Promise<string> {
  const mod = (await import(exampleModulePath(slug, "validate.js"))) as {
    validateBugbotDiff?: (diff: string) => unknown[];
    validateSecurityReviewerDiff?: (diff: string) => unknown[];
    loadDefaultDiff: () => Promise<string>;
    formatFindings: (findings: unknown[]) => string;
    resolveDiffPath: (override?: string) => string;
  };

  const exampleRoot = path.join(resolveRepoRoot(), "examples", slug);
  const diffPath = task.trim() ? mod.resolveDiffPath(task) : undefined;
  if (diffPath) {
    assertPathWithinRoot(diffPath, exampleRoot);
  }
  const diff = diffPath
    ? await fs.readFile(diffPath, "utf8")
    : await mod.loadDefaultDiff();

  const findings =
    slug === "bugbot"
      ? mod.validateBugbotDiff?.(diff) ?? []
      : mod.validateSecurityReviewerDiff?.(diff) ?? [];

  const header = diffPath
    ? `Validated diff: ${diffPath}`
    : "Validated bundled fixture diff.";

  return [header, mod.formatFindings(findings)].join("\n");
}

export async function invokeAgent(
  slug: string,
  task: string,
  context: InvokeContext
): Promise<InvokeResult> {
  const agent = AGENT_BY_SLUG.get(slug);
  if (!agent) {
    throw new Error(`Unknown agent slug: ${slug}`);
  }

  if (agent.offline) {
    return {
      output: await invokeOfflineValidator(
        slug as "bugbot" | "security-reviewer",
        task
      ),
      requiresApproval: false
    };
  }

  switch (slug) {
    case "hello-world": {
      const mod = await loadAgentModule(slug);
      return {
        output: await runCloudPrompt(
          (mod.buildInventoryPrompt as () => string)(),
          context
        ),
        requiresApproval: false
      };
    }
    case "slack-bot":
    case "alert-triage-bot": {
      const mod =
        slug === "slack-bot"
          ? { buildPrompt: buildTriagePrompt }
          : {
              buildPrompt: (
                (await loadAgentModule(slug)).buildAlertTriageBotPrompt as (
                  task: string
                ) => string
              )
            };

      return {
        output: await runPromptAgent(mod, task, context, {
          cwd: context.repoRoot
        }),
        requiresApproval: slug === "slack-bot"
      };
    }
    case "codebase-explainer": {
      const mod = await loadToolsModule(slug);
      const useCloud = shouldUseCloudAgent(slug, context);
      const parsed = parseCodebaseExplainerTask(task, { cloudRepo: useCloud });
      const buildPrompt = mod.buildCodebaseExplainerPrompt as (
        modulePath: string,
        question: string
      ) => string;
      const prompt = buildPrompt(parsed.modulePath, parsed.question);

      if (useCloud) {
        return {
          output: await runCloudPrompt(prompt, context),
          requiresApproval: false
        };
      }

      const createTools = mod.createCodebaseExplainerCustomTools as (
        rootDir: string
      ) => Record<string, SDKCustomTool>;

      const result = await Agent.prompt(prompt, {
        apiKey: context.apiKey,
        model: { id: context.model },
        local: {
          cwd: context.repoRoot,
          customTools: createTools(context.repoRoot)
        }
      });

      return {
        output: result.result ?? "No response returned.",
        requiresApproval: false
      };
    }
    case "accessibility-agent": {
      const mod = await loadAgentModule(slug);
      const buildPrompt = mod.buildAccessibilityPrompt as (
        targetUrl: string,
        userPrompt: string
      ) => string;
      const createTools = mod.createAccessibilityCustomTools as (
        defaultUrl: string
      ) => Record<string, SDKCustomTool>;
      const targetUrl =
        task.trim() || "examples/accessibility-agent/fixtures/sample-page.html";

      const result = await Agent.prompt(
        buildPrompt(targetUrl, "Audit this target from Slack."),
        {
          apiKey: context.apiKey,
          model: { id: context.model },
          local: {
            cwd: context.repoRoot,
            customTools: createTools(targetUrl)
          }
        }
      );

      return {
        output: result.result ?? "No response returned.",
        requiresApproval: false
      };
    }
    case "migration-agent": {
      const mod = await import(exampleModulePath(slug, "prompt.js"));
      const buildPrompt = mod.buildMigrationPrompt as (
        results: Array<{ status: string; example: string; message: string }>
      ) => string;

      const result = await Agent.prompt(
        [
          buildPrompt([]),
          "",
          "This Slack invocation is read-only. Do not edit files.",
          `User request: ${task || "Summarize how to audit Python port drift in this repo."}`
        ].join("\n"),
        {
          apiKey: context.apiKey,
          model: { id: context.model },
          local: { cwd: context.repoRoot }
        }
      );

      return {
        output: result.result ?? "No response returned.",
        requiresApproval: false
      };
    }
    default: {
      const mod = await loadToolsModule(slug);
      const buildPromptKey = Object.keys(mod).find((key) =>
        key.startsWith("build") && key.endsWith("Prompt")
      );

      if (!buildPromptKey) {
        throw new Error(`No prompt builder exported for ${slug}`);
      }

      const buildPrompt = mod[buildPromptKey] as (task: string) => string;
      const createToolsKey = Object.keys(mod).find((key) =>
        key.startsWith("create") && key.endsWith("CustomTools")
      );
      const createTools = createToolsKey
        ? (mod[createToolsKey] as (
            rootDir?: string
          ) => Record<string, SDKCustomTool>)
        : undefined;

      const promptTask =
        task.trim() ||
        `Run the ${agent.title} example with representative demo input.`;

      if (shouldUseCloudAgent(slug, context)) {
        return {
          output: await runCloudPrompt(buildPrompt(promptTask), context),
          requiresApproval: false
        };
      }

      const result = await withWritesEnabled(context.writesEnabled, () =>
        Agent.prompt(buildPrompt(promptTask), {
          apiKey: context.apiKey,
          model: { id: context.model },
          local: {
            cwd: context.repoRoot,
            customTools: createTools?.(context.repoRoot)
          }
        })
      );

      const output =
        agent.writes && slug !== "slack-bot" && !context.writesEnabled
          ? [
              result.result ?? "No response returned.",
              "",
              "This agent can write when run from the CLI with `--act`.",
              "The Slack router keeps write-capable examples in proposal mode."
            ].join("\n")
          : (result.result ?? "No response returned.");

      return {
        output,
        requiresApproval: false
      };
    }
  }
}

export async function invokeAgentOffline(
  slug: string,
  task: string
): Promise<InvokeResult> {
  const agent = AGENT_BY_SLUG.get(slug);
  if (!agent) {
    throw new Error(`Unknown agent slug: ${slug}`);
  }

  if (agent.offline) {
    return {
      output: await invokeOfflineValidator(
        slug as "bugbot" | "security-reviewer",
        task
      ),
      requiresApproval: false
    };
  }

  if (slug === "slack-bot" || slug === "alert-triage-bot") {
    const prompt =
      slug === "slack-bot"
        ? buildTriagePrompt(task)
        : (
            (await loadAgentModule(slug)).buildAlertTriageBotPrompt as (
              task: string
            ) => string
          )(task);

    return {
      output: [
        "Summary: Demo triage plan from offline simulator.",
        "Likely impact: payments blocked.",
        "Proposed next steps:",
        "1. Check recent deploy for checkout-api.",
        "2. Roll back if error rate is still elevated.",
        "What needs human approval: ticket creation and any remediation PR.",
        "",
        `Prompt preview:\n${prompt.slice(0, 240)}...`
      ].join("\n"),
      requiresApproval: slug === "slack-bot"
    };
  }

  return {
    output: [
      `Offline preview for \`${slug}\`.`,
      `Task: ${task || "(default demo input)"}`,
      "",
      "Start the live Slack bot with `npm run slack-bot:serve` or pass CURSOR_API_KEY to run the SDK call from CLI."
    ].join("\n"),
    requiresApproval: agent.writes
  };
}
