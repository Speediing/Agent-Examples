export type {
  ArtifactRef,
  CaseRunInput,
  EvalCase,
  EvalCaseResult,
  EvalContext,
  EvalHarness,
  Grader,
  GraderResult,
  RunEvidence,
  SdlcStage,
  TestRunRecord,
  WorkspaceSeed,
  WorkspaceSnapshot
} from "./lib/types.js";

export {
  prepareWorkspace,
  cleanupWorkspace,
  captureWorkspaceSnapshot,
  readFileBytes
} from "./lib/workspace.js";

export {
  buildRunEvidence,
  collectArtifactRefs,
  extractRequestIds
} from "./lib/evidence.js";

export { runLocalAgent, runPromptSmoke } from "./lib/run-agent.js";
export type { AgentRunOutcome } from "./lib/run-agent.js";

export {
  dedupeCompletedToolCalls,
  numbersMultiset,
  multisetEqual
} from "./lib/trace.js";
export type { NormalizedToolCall } from "./lib/trace.js";

export {
  collectGroundingValues,
  findNovelGroundingCitation,
  assertReadOnlyContract
} from "./lib/grounding.js";

export {
  createGrader,
  gradeAll,
  allGradersPassed,
  requireFinished,
  requireTools,
  allowedToolsOnly,
  requireToolArgMultiset,
  groundingFromHandlers,
  citesValues,
  readOnlyContract,
  fileBytesUnchanged,
  workspaceDiffOnlyAllows,
  requireMinToolCalls,
  requireAnyTool
} from "./lib/graders/index.js";

export { runEvalCase, llmCasesEnabled } from "./lib/runner.js";
export { writeFailureArtifact } from "./lib/artifacts.js";

export {
  evalCases,
  getEvalCase,
  listEvalCases,
  accessibilityCiteRulesCase,
  accessibilityRepairCase,
  toolCallingAddCase,
  toolCallingWordCountCase,
  sreCheckout503Case
} from "./cases/index.js";

export { evalConfig, llmEvalsEnabled, requireLlmEvals } from "./lib/config.js";
