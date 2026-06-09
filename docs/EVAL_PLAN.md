# Agent Eval Suite & Affordable CI — Plan (v4)

Status: plan for review (converged after adversarial review rounds — GPT + Opus. v3
turned Phase 1 into an executable contract; v4 adds §9, the eval-driven improvement
loop. A review round on §9 concluded the *automated* flywheel is the wrong tool for a
static teaching repo with no production traffic, so §9 was reframed to a manual,
human-paced, sre-scoped loop with CI-enforced guardrails.) This is a **plan**, not an
implementation. It targets the five Cursor SDK agents in this repo and the docs site in
the sibling `agent-example-site` repo.

> "Foolproof" is a goal, not a claim. This plan separates **blocking** checks (which
> must be genuinely deterministic) from **stochastic quality signals** (which are
> tracked, not gated). Where we cannot make something deterministic, we say so.

## 1. What we are evaluating

| Agent | Path | Deterministic surface | LLM-dependent surface |
| --- | --- | --- | --- |
| hello-world | `examples/hello-world` | env-var error handling | greeting mentions name + "Cursor SDK" |
| tool-calling-agent | `examples/tool-calling-agent` | `add`, `word_count` handlers | model calls correct tool w/ correct args, grounds answer in result |
| accessibility-agent | `examples/accessibility-agent` | `scanAccessibility()` rule-ID set; `--scan-only` exit code | summary cites rule IDs actually returned |
| migration-agent | `examples/migration-agent` | port-audit **classifier** (pure fn); exit code | `--use-cursor-sdk` repairs ports (side-effectful) |
| sre-agent | `examples/sre-agent` | 6 mock tool handlers | report sections, grounding in trace, no false "applied" claims |

Cross-cutting axes (both **non-blocking** initially — see §4.3, §4.4):
- **TS↔Python parity** — normalized deterministic parity only; never text equality.
- **Docs↔code parity** — `command`/`path`/script alignment only; snippets are
  illustrative and already diverge from source on purpose (see §4.4).

## 2. Hard SDK facts (verified against `@cursor/sdk@1.0.18` type defs)

These were read from the installed `dist/cjs/*.d.ts`; a committed reference test
(§8 Phase 1) imports these types so the claim is **enforced by CI**, not narrative.

- `Agent.prompt()` returns `RunResult` with only `result?: string`, `status`,
  `durationMs` — **no tool-call trace, no token/cost field** (`dist/cjs/run.d.ts`).
- The trace comes from **`run.stream()`**, which yields `SDKMessage`. The union
  includes `SDKToolUseMessage` (`type: "tool_call"`, `name`, `args?: unknown`,
  `result?: unknown`, `call_id`, `status: "running"|"completed"|"error"`, and a
  `truncated?: { args?; result? }` flag) and `SDKAssistantMessage` whose
  `message.content` is `(TextBlock|ToolUseBlock)[]` (`dist/cjs/messages.d.ts`).
  Guard with `run.supports("stream")`.
- Do **not** confuse this with `send(msg, { onStep })`: `onStep` yields a
  `ConversationStep`, not an `SDKMessage` (`dist/cjs/agent.d.ts`). Tool-call
  assertions are driven from `run.stream()`.
- **Single source of truth to avoid testing a shadow agent.** Trace evals must run
  the *same* prompt + tool definitions the CLI ships, or a CLI regression can pass.
  So the small prerequisite refactor is: extract each agent's prompt builder and tool
  map into a **side-effect-free factory module** that *both* the CLI entrypoint and
  the eval import. The entrypoint keeps the top-level `await Agent.prompt(...)`; only
  the data (prompt string + tool map) moves. Pure handlers (`add`, the SRE lookups)
  come along for free as unit-testable functions.
- Because factory extraction changes the source, the published snippets stay
  **illustrative** (manual allowlist, §4.4) rather than literal-match — they already
  diverge from source on purpose.

## 3. Tiered architecture (keeps CI cheap and trustworthy)

### Tier 0 — Static & deterministic (no LLM, no API key, no network egress)
Runs on **every** push/PR. Fast, blocking. Must be *actually* deterministic:
- `pnpm install --frozen-lockfile`, lint, `tsc --noEmit`, `build` for both repos. (`pnpm install --frozen-lockfile`, not `install`,
  is required for the lockfile pin to mean anything.)
- Unit tests of **pure** functions: `add`, `word_count`, the 6 SRE handlers, URL
  resolution, and the migration **classifier** refactored to a pure function over
  injected `(tsMtime, pyMtime, exists)` (see §5).
- Accessibility scan vs the committed fixture: assert the **set of rule IDs only**
  (not counts, `nodeCount`, or selectors). Treat `color-contrast` as
  allowed-but-not-required, or switch the fixture to flat solid colors, because
  headless rendering makes contrast land in `incomplete` intermittently. Run in a
  pinned container with fixed viewport/locale/timezone/colorScheme/deviceScaleFactor.
- Negative/setup cases (deterministic, free) — **per-agent**, not blanket:
  hello-world / tool-calling / sre / accessibility-full throw and exit 1 on missing
  `CURSOR_API_KEY` / `CURSOR_MODEL`; **migration-agent does not** — its audit runs
  without a key and `--use-cursor-sdk` without a key prints `SKIPPED …` and returns,
  so its exit code reflects audit state, not env. Also: bad URL / missing file;
  malformed tool args don't crash handlers; `--scan-only` needs no key.

### Tier 1 — Behavioral LLM evals (needs `CURSOR_API_KEY` + model; costs money)
Gated triggers only (§6). Three grader classes, strongest first:
- **Trace assertions (primary, robust):** from `run.stream()`, assert the *allowed
  tool sequence*, args (as multisets/structured, e.g. `add` → `args.numbers` is a
  multiset equal to `[3,9]` — note the schema is `{ numbers }`, not a bare array),
  **no unexpected tool calls**, and **negative cases** (a tool that must *not* be
  called). Reading the stream safely (the fields are `unknown` and may truncate):
  dedupe `tool_call` events by `call_id`, assert only on `status: "completed"`,
  **skip/fail if `truncated.args` or `truncated.result` is set**, and derive the
  expected output by calling the *pure handler* with the observed args rather than
  trusting the streamed `result`.
- **SRE: require the causal core, not all six tools.** Demand
  `get_service_health` + `get_recent_deployments` plus at least one of
  `get_error_logs` / `get_alerts`. `query_metrics` and `lookup_runbook` are
  **optional** and must never be a grounding source: `query_metrics` only matches
  *exact* PromQL keys in `METRIC_SAMPLES` (e.g.
  `rate(http_requests_total{service="checkout-api",status=~"5.."}[5m])`), which a
  model won't emit verbatim, so it returns `value: null`.
- **Grounding (gated on the trace, not on substrings):** the final answer must cite
  values that appeared in *tool results* (health status, the specific deploy id/time,
  a log line), not strings already in the prompt. This matters: the SRE prompt
  already contains `checkout-api`, `503`, and "pool", so a substring check proves
  nothing. Also keep a thin `Agent.prompt()` **output smoke check** so the literal
  shipped entrypoint is exercised, not only the stream path.
- **LLM-as-judge (fuzzy quality only, non-blocking):** graded rubric for
  coherence/grounding using a **pinned, temp-0, cross-family** judge model; store
  rationales; re-calibrate on every judge/model bump; surface judge drift as its own
  alert. Never a blocking gate.

### Tier 2 — Adversarial / robustness (gated, non-blocking → blocking once stable)
- SRE must **not** claim it applied changes (read-only contract).
- Unknown service / unknown metric → reports "not found", does not fabricate.
- Prompt-injection text in the incident does not derail tool use or the read-only
  contract.
- Randomized-but-controlled mock incidents (decoy services/metrics, hidden expected
  facts) so a model cannot pass by memorizing the tiny default dataset.

## 4. Foolproofing the evals themselves (anti-flake, anti-gaming)

### 4.1 Determinism
- `pnpm install --frozen-lockfile` + **exact** versions in the eval image; drop `^`/`~` for `@cursor/sdk`,
  `playwright`, `@axe-core/playwright`, `axe-core` in the eval lane. Lock Python deps.
- Playwright browser cache key = `hash(package-lock.json)` + Playwright version;
  install with `pnpm exec playwright install --with-deps chromium`.
- A separate **scheduled dependency-drift job** bumps deps and re-baselines after
  human review, so security updates aren't blocked by pinning.

### 4.2 Anti-gaming
- Prefer trace signals + exit codes over text matching.
- Grounding gated on trace-returned values; randomized mock facts (§3 Tier 2).
- Require *absence* of unsupported facts and unexpected tool calls, not just presence.

### 4.3 Statistics (no rigor theater)
- Every stochastic case declares **N** (samples) and gates on the **Wilson score
  lower bound** of the pass rate, not the raw rate. The floor is derived from a
  measured baseline distribution, not guessed.
- Set temperature 0 / seed **if** the SDK exposes it; otherwise rely on N + Wilson.
- Single-sample checks are **advisory only**. Publish a cost-vs-confidence table for
  N ∈ {5,10,20,30} before choosing N. Small N ⇒ wide intervals ⇒ keep it advisory.

### 4.4 Parity, scoped honestly
- **TS↔Python:** assert only **normalized deterministic** parity — numeric equality
  (not string), explicit null rules. This will *surface real existing divergences*
  the parity test should flag as bugs: Python `add` formats `3.0` where TS yields `3`
  (`str(number)` vs `join`), Python tool-calling returns `result.result` (can be
  `None`) with no `?? ""` fallback, and SRE `get_service_health` descriptions differ
  between languages (descriptions steer the model). Behavioral LLM parity is
  **trace-shape only** (same tool set), non-blocking, and **doubles the LLM bill** —
  budget for that explicitly.
- **Docs↔code:** automate parity only for runnable `command`/`path` fields and
  `package.json` scripts. Snippets are paraphrased/elided and already differ from
  source (e.g. the SRE `get_service_health` snippet returns `{ found, health }` vs
  the real `{ found, service, health, known_services }`). Keep snippets behind a
  **manual allowlist**, not a literal-match gate.

## 5. The migration-audit problem (must fix before it can be evaluated)
The current audit decides `stale` vs `ok` by `latestTsMtime > pythonMtime`. **git does
not preserve mtimes**, so on a fresh CI checkout the ordering is arbitrary and the
blocking exit code becomes a coin flip. `listFiles` also recurses into `node_modules`
/ `dist`, so a prior `build` makes everything permanently `stale`.
- **Required refactor:** extract the classifier into a pure function over injected
  `(tsMtime, pyMtime, exists)` and unit-test all of `ok/stale/missing/created/error`
  in Tier 0. Exclude `node_modules`/`dist` from `listFiles`.
- **Recommended signal change:** replace mtime with a git-preserved signal — content
  hash, or `git log -1 --format=%ct <file>` (commit time) — so the staleness check is
  meaningful in CI at all. Any test that must exercise the filesystem path builds a
  temp fixture tree and sets mtimes explicitly (`touch -d`).
- **`--use-cursor-sdk` (side-effectful):** evaluate only in a disposable temp copy of
  the repo; assert a changed-file allowlist; validate the generated Python behaves;
  never run it in CI against the working tree, and never with the key on PR code.

## 6. Affordable CI (GitHub Actions) — secrets-safe

### Tier 0 workflow
`on: [push, pull_request]`. Minimal `permissions: { contents: read }`. Node + Python
where needed; cache pnpm + Playwright (version-keyed). "No network egress" applies to
**test execution**, not setup: `pnpm install --frozen-lockfile` and `pnpm exec playwright install` need the network
(or, better, a prebuilt container image that bakes deps + the pinned browser so the
test step itself is offline). Free Actions minutes on public repos cover this (cache
storage, artifact retention, and browser downloads are *not* unlimited — set retention
policies and don't depend on cache for correctness).

**Cross-repo docs↔code parity.** Actions does not have the sibling
`agent-example-site` checkout for free. Either (a) the parity job in this repo adds a
second `actions/checkout` with `repository: Speediing/agent-example-site` and a pinned
ref into a `path:`, or (b) the parity check lives in the site repo and pins this repo
instead. Pick one and pin the ref so the two repos can't silently drift the checkout.

### Tier 1 / Tier 2 workflow (secrets) — **never runs untrusted PR code with the key**
This is the load-bearing safety rule. Label gating + protected environments do **not**
sandbox fork code; a label is not a code review, and `pull_request_target` would run
attacker code with the secret in scope. Therefore:
- Triggers: `workflow_dispatch` (on a trusted ref), nightly `schedule` on `main`, and
  push to `main`. **No** `pull_request_target`; **no** label-triggered runs of fork
  HEAD with the key.
- Contributor PRs get evals only after a maintainer pushes the branch **in-repo**
  (or re-runs against a reviewed SHA).
- `permissions:` minimal; `CURSOR_API_KEY` in a protected environment **and** with a
  hard provider-side spend cap (defense in depth, not the only defense).
- Concurrency: cancel-in-progress for **PR-triggered** runs; for billed/nightly runs
  use a concurrency group that **queues without cancelling** (so a later push can't
  orphan in-flight spend, but two expensive runs also can't overlap) plus a hard job
  timeout.

### Cost controls (enforced in the runner, not aspirational)
`RunResult` exposes `durationMs` but **no token/cost field**, so runner caps key off
what we can actually measure: max cases, max samples (N), max wall-clock per case and
per job, max tool calls per case, and **no automatic model-failure retries**
(retries ≠ pass@k). True dollar enforcement comes from the **provider-side hard spend
cap on the key**, not a token estimate; only add token caps if a usage/billing API
exposes them. Cheapest capable pinned model.

### Caching caveat (correctness)
Cache **only Tier-0 deterministic artifacts** (scan results, audit output). A cache
keyed on `(case, prompt, model)` would freeze one sampled completion and collapse
pass@k to a single replay, hiding the very SDK/model regressions Tier 1 exists to
catch. If any LLM output is cached, it is a **historical baseline only**, keyed on
sample index + SDK version + model id + prompt-template version + grader version, and
never satisfies a fresh stochastic gate.

## 7. Operability
- **Named owner** for the eval suite + a documented **model-deprecation/rotation**
  procedure (a dead `CURSOR_MODEL` fails every Tier-1 case at once with an opaque
  error; pin a known-good default and monitor).
- Per-case **artifact** on failure: full trace + raw output + grader verdicts, so a
  red gate is debuggable.
- **Flake quarantine** list and a bounded, explicit **retry policy** distinct from
  pass@k.

## 8. Phasing

### Phase 1 — executable contract (Tier 0 only, zero LLM cost)
Concrete because "build both repos" isn't a command — this repo has **no `lint` or
`test` script** today (root `package.json` exposes only `build` + `start` wrappers);
the site has `lint`/`build`. Phase 1 therefore *adds* the harness, then wires CI:
1. Add Vitest to this repo (root dev dep + `"test": "vitest run"`), and a `pytest`
   config + locked `requirements-dev.txt` for the Python side.
2. Refactor the migration **classifier** to a pure function; exclude `node_modules`/
   `dist` from `listFiles`; unit-test all five statuses (§5).
3. Extract prompt/tool **factory modules** shared by CLI + tests (§2); add unit tests
   for `add`, `word_count`, the 6 SRE handlers, URL resolution.
4. a11y scan test asserting the **rule-ID set** against the fixture (§3 Tier 0).
5. Per-agent negative/setup tests (§3 Tier 0).
6. Docs `command`/`path` parity test (cross-repo checkout per §6).
7. A committed **type reference test** importing `RunResult`, `SDKMessage`,
   `SDKToolUseMessage` so the §2 SDK claims are CI-enforced.
8. Tier 0 workflow: `pnpm install --frozen-lockfile` → `pnpm run lint`/`build`/`test` (this repo + site),
   `tsc --noEmit`, pytest. Per-repo commands listed explicitly in the workflow.

### Phase 2 — Tier 1 (gated, costs money)
Stream-based trace assertions on a tiny case set, read safely (dedupe by `call_id`,
`completed` only, honor `truncated`); grounding gated on trace; runner cost caps;
provider spend cap. Resolve the open model-id question first.

### Phase 3
LLM-judge quality metric (non-blocking) + Tier 2 adversarial + randomized mocks.

### Phase 4
Normalized TS↔Python parity + trace-shape behavioral parity (non-blocking).

## 9. The improvement loop (what to build *after* the evals exist)

OpenAI's "Agent Improvement Loop" cookbook closes a flywheel: traces → human/LLM
feedback → reusable evals → HALO-style ranked diagnosis → a `codex_handoff.md` → a
coding agent edits the harness → re-run. It is a good pattern — **but it was designed
to mine real, diverse production traffic, and this repo has none.** Two structural
facts decide how much of it we should build:

- **Closed loop = overfitting machine.** Our only trace source would be the team's own
  small synthetic eval set against a near-fixed incident. With no external input
  distribution, "traces → evals → fix" can only optimize toward cases we already wrote.
  Held-out splits and significance tests cannot manufacture an input distribution that
  doesn't exist.
- **Objective conflict.** The example prompts are *published teaching artifacts*
  (`agent-example-site` renders them verbatim). "Optimize the harness to pass evals"
  contorts those prompts to fit mock-data quirks — which makes the lesson worse. The
  loop's objective opposes the repo's purpose.
- **One viable target.** Of the five agents, only **sre-agent** has enough harness
  surface to optimize. hello-world has no tools and a static prompt; tool-calling is a
  trivial 2-tool route; accessibility is a deterministic scan with a thin summary;
  migration's only LLM path is barred from CI (§5).

**Decision: build the manual, human-paced version; do not build the automated
flywheel for this repo.** The evals are a **necessary precondition, not a sufficient
safety net** — they make the loop *reviewable and bounded*, not "safe to close". The
automated apparatus (persist-everything, auto-ranking, auto-handoff to a write-capable
agent) is deferred until there is a real trace distribution (production usage) or a
second viable target.

### What to build now (manual loop, scoped to sre-agent)
1. **Periodic review, human-paced.** On the Tier-1 cadence, a human reads a sampled set
   of sre-agent traces + judge rationales and writes down failure modes.
2. **Cases first, authored independently of the fix.** A human (or a role/model
   isolated from whoever implements the fix) adds eval cases for each failure mode and
   commits them first. The implementer never sees new-case bodies — only the validation
   command and pass/fail.
3. **Human-written handoff, typed.** A `handoff.md` with a fixed schema: allowed files,
   **forbidden files**, exact validation command, the specific cases expected to flip,
   and a reviewer checklist. Target is the §2 guardrail/validation code — **not the
   published teaching prompts** (see scope rule below).
4. **Implement on a branch, gate, human-approve.** The branch must pass the whole suite
   incl. new cases; a human approves the diff (seeing the held-out delta + CI + trace
   citations + diff-scope report), then merges.

### Guardrails — enforced in CI, not just written in the handoff
- **Diff-scope allowlist (CI-enforced).** Fail any improvement PR whose diff touches
  `graders/`, held-out config/fixtures, thresholds, `.github/workflows`, lockfiles, or
  pinned versions — regardless of what the handoff says. Separate PR types for
  eval-cases, implementation, and grader/threshold changes.
- **Teaching prompts out of scope.** Loop-driven edits do **not** modify prompts/tool
  maps that `posts.ts` publishes. The loop touches guardrail/validation/routing code,
  or a forked non-teaching agent. Any teaching-prompt change is a normal human PR with
  docs reconciled (§4.4) — never an automated optimization.
- **Held-out is an isolation boundary, not a label.** Store held-out cases **outside
  the repo**; expose only aggregate pass/fail to the implementer; hide expected outputs
  and traces. Generate held-out from the §3 randomized-incident generator the optimizer
  never tunes; grade it with deterministic trace/grounding graders only (never the
  diagnosis-family judge). A held-out case **used as a gate is burned** — rotate in
  fresh seeds each cadence and track which seeds have been observed.
- **"Improvement" needs a delta test, not an absolute rate.** §4.3 gates an absolute
  Wilson bound; that does not test a *difference* between two noisy iterations. Require
  a **pre-registered paired delta test** (two-proportion / bootstrap CI on the
  difference, paired by case+seed), improvement CI lower bound > 0 on visible **and**
  non-inferiority on held-out, with multiplicity correction across cases and
  alpha-spending across cadences. Freeze N before looking; otherwise repeated looks
  ratchet on lucky samples.
- **Traces are untrusted input.** Tier-2 fixtures contain prompt-injection text *by
  design*; that text flows into diagnosis and any handoff. Treat all trace/label text
  as **data, hard-delimited, never instructions**; the implementer's write scope is
  path-allowlisted regardless. ("Never triggered by untrusted input" is not enough when
  the loop's own inputs are adversarial.)
- **De-correlate the model roles (incl. the implementer).** Different model families
  for agent, judge, feedback, diagnosis, **and implementer** — and state plainly that
  cross-family ≠ independent (shared training data still correlates errors), so this
  mitigates, not eliminates, bias. Pin every id (§10).
- **Diagnosis ≠ root cause.** A trace citation supports but doesn't prove a cause.
  Require a minimal repro or before/after ablation and human signoff on the diagnosis
  before any code change.
- **Coverage, not just observed failures.** Maintain a coverage matrix (agent × tool ×
  failure mode × adversarial axis) and add synthetic cases for high-risk gaps, so the
  suite isn't biased toward whatever the few traces happened to expose.

### Trace substrate (for diagnosis, separate from grading)
Persisting only deduped `tool_call` events drops exactly what's needed to diagnose
*prompt* failures. For the diagnosis substrate, also retain assistant `TextBlock`s and
`SDKThinkingMessage` (redacted), event ordering/timestamps, and the `truncated` flags —
and exclude truncated fields from evidence (recompute tool ground truth from the pure
handler, as §3 does). Reconcile with cost/privacy: persist **minimal metadata for all
runs + full traces for a sampled fraction + all failures under retention** (not "every
run", which contradicts §6/§7). Redact prompts/paths/URLs and forbid secrets/PII before
storing; keep trace artifacts **private**, not in public-repo CI output. Before building
any of this, evaluate the SDK's own `JsonlLocalAgentStore` / `SqliteLocalAgentStore`
(`@cursor/sdk`) rather than reinventing persistence.

## 10. Open questions
- Which cheap, stable model id do we pin for CI, and can we get a sandboxed key with a
  hard spend cap?
- Acceptable monthly eval budget + cadence (drives N and the cost table in §4.3)?
- Repo home for evals: this repo, the site repo, or a dedicated eval repo?
- Do we change the migration staleness signal (mtime → content hash / commit time) as
  part of this work, or only wrap the classifier for testing?
- Loop: pin the five distinct model ids (agent/judge/feedback/diagnosis/implementer);
  Promptfoo vs our own harness for the rubric layer; where (private) traces live +
  retention + sampling rate; held-out generator + split size + power + refresh/burn
  policy; and whether a non-teaching fork of sre-agent is the right loop target so the
  published prompts stay untouched.

## 10. Open questions
- Which cheap, stable model id do we pin for CI, and can we get a sandboxed key with a
  hard spend cap?
- Acceptable monthly eval budget + cadence (drives N and the cost table in §4.3)?
- Repo home for evals: this repo, the site repo, or a dedicated eval repo?
- Do we change the migration staleness signal (mtime → content hash / commit time) as
  part of this work, or only wrap the classifier for testing?
- Loop: Promptfoo vs our own harness for the rubric layer; where traces live (artifact
  store vs DB) plus retention + sampling rate; is the implementer a Cursor cloud agent
  via the SDK or a manually-triggered background agent; held-out split size and refresh
  policy?
