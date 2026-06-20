import type { CaseRunInput } from "./types.js";

/**
 * The unit evals import and run. One object bundles prompt wiring, tools, and cwd
 * the same way your CLI entrypoint does, without top-level await side effects.
 */
export type EvalAgent = {
  send: (userMessage: string) => CaseRunInput | Promise<CaseRunInput>;
};
