import type { SDKCustomTool, SDKMessage } from "@cursor/sdk";
import type { NormalizedToolCall } from "./trace.js";

export type SdlcStage =
  | "plan"
  | "develop"
  | "review"
  | "test"
  | "release"
  | "operate";

export type EvalTier = 0 | 1 | 2;

export type EvalHarness = "cursor-sdk" | "production-cli";

export type WorkspaceSeed = {
  copyFiles: { from: string; to: string }[];
  cleanupPaths: string[];
};

export type EvalContext = {
  repoRoot: string;
  workspaceDir: string;
  scratchPaths: Map<string, string>;
};

export type CaseRunInput = {
  prompt: string;
  customTools?: Record<string, SDKCustomTool>;
  cwd?: string;
};

export type TestRunRecord = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type ArtifactRef = {
  path: string;
  sha256: string;
};

export type WorkspaceSnapshot = {
  cwd: string;
  gitBefore: string;
  gitAfter: string;
  diff: string;
};

export type RunEvidence = {
  caseId: string;
  tier: EvalTier;
  runId?: string;
  requestIds: string[];
  startedAt: string;
  finishedAt: string;
  finalOutput: string;
  status: string;
  prompt: string;
  messages: SDKMessage[];
  completedToolCalls: NormalizedToolCall[];
  workspace: WorkspaceSnapshot;
  tests: TestRunRecord[];
  artifacts: ArtifactRef[];
};

export type GraderResult = {
  grader: string;
  pass: boolean;
  message?: string;
};

export type Grader = {
  name: string;
  grade: (
    evidence: RunEvidence,
    ctx: EvalContext
  ) => GraderResult | Promise<GraderResult>;
};

export type EvalCase = {
  id: string;
  stage: SdlcStage;
  tier: EvalTier;
  harness: EvalHarness;
  description: string;
  workspace?: WorkspaceSeed;
  prepare?: (ctx: EvalContext) => Promise<void>;
  run: (ctx: EvalContext) => Promise<CaseRunInput>;
  graders: Grader[];
  postRun?: (ctx: EvalContext, evidence: RunEvidence) => Promise<void>;
};

export type EvalCaseResult = {
  caseId: string;
  pass: boolean;
  evidence: RunEvidence;
  graderResults: GraderResult[];
  artifactPath?: string;
};
