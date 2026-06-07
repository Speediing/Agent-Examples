# Agent Eval Suite & Affordable CI — Plan (v2)

Status: plan for review (hardened after two adversarial review passes — GPT + Opus).
This is a **plan**, not an implementation. It targets the five Cursor SDK agents in
this repo and the docs site in the sibling `agent-example-site` repo.

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

## 2. Hard SDK facts (verified against `@cursor/sdk@1.0.18` in `node_modules`)

- `Agent.prompt()` returns `RunResult` with only `result?: string`, `status`,
  `durationMs` — **no tool-call trace** (`dist/cjs/run.d.ts`).
- A trace **is** available without refactoring the agents: `Agent.create()` +
  `agent.send(msg, { onStep })`, or `run.stream()` which yields `SDKMessage`. The
  union includes `SDKToolUseMessage` (`type: "tool_call"`, `name`, `args`, `result`,
  `call_id`, `status`) and `SDKAssistantMessage.content: (TextBlock|ToolUseBlock)[]`
  (`dist/cjs/messages.d.ts`). **This is the primary trace mechanism** — it keeps the
  example source byte-for-byte doc-faithful.
- Wrapping `customTools.execute` is **not** the primary approach: the example
  entrypoints run `Agent.prompt()` at import time (top-level `await`, `requireEnv`),
  so you cannot import their tool maps without invoking the agent, and extracting
  them would change the published snippets. Pure handlers (`add`, the SRE lookups)
  may be extracted into a side-effect-free module **for unit tests only**; if so,
  snippets must be updated and a parity allowlist maintained (§4.4).

## 3. Tiered architecture (keeps CI cheap and trustworthy)

### Tier 0 — Static & deterministic (no LLM, no API key, no network egress)
Runs on **every** push/PR. Fast, blocking. Must be *actually* deterministic:
- `npm ci`, lint, `tsc --noEmit`, `build` for both repos. (`npm ci`, not `install`,
  is required for the lockfile pin to mean anything.)
- Unit tests of **pure** functions: `add`, `word_count`, the 6 SRE handlers, URL
  resolution, and the migration **classifier** refactored to a pure function over
  injected `(tsMtime, pyMtime, exists)` (see §5).
- Accessibility scan vs the committed fixture: assert the **set of rule IDs only**
  (not counts, `nodeCount`, or selectors). Treat `color-contrast` as
  allowed-but-not-required, or switch the fixture to flat solid colors, because
  headless rendering makes contrast land in `incomplete` intermittently. Run in a
  pinned container with fixed viewport/locale/timezone/colorScheme/deviceScaleFactor.
- Negative/setup cases (deterministic, free): missing `CURSOR_API_KEY` /
  `CURSOR_MODEL` exits non-zero with the expected message; bad URL / missing file;
  malformed tool args don't crash handlers.

### Tier 1 — Behavioral LLM evals (needs `CURSOR_API_KEY` + model; costs money)
Gated triggers only (§6). Three grader classes, strongest first:
- **Trace assertions (primary, robust):** from the stream, assert the *allowed tool
  sequence*, args (as multisets/structured, e.g. `add` → `args.numbers` is a multiset
  equal to `[3,9]` — note the schema is `{ numbers }`, not a bare array), the
  tool-returned value, **no unexpected tool calls**, and **negative cases** (a tool
  that must *not* be called). SRE default incident must invoke **all six** tools (the
  prompt demands correlating health, alerts, deployments, metrics, logs, runbooks).
- **Grounding (gated on the trace, not on substrings):** the final answer must cite
  values that appeared in *tool results*, not strings already present in the prompt.
  This matters: the SRE prompt already contains `checkout-api`, `503`, and "pool", so
  a substring check proves nothing.
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
- `npm ci` + **exact** versions in the eval image; drop `^`/`~` for `@cursor/sdk`,
  `playwright`, `@axe-core/playwright`, `axe-core` in the eval lane. Lock Python deps.
- Playwright browser cache key = `hash(package-lock.json)` + Playwright version;
  install with `npx playwright install --with-deps chromium`.
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
where needed; cache npm + Playwright (version-keyed). Free Actions minutes on public
repos cover this (note: cache storage, artifact retention, and browser downloads are
*not* unlimited — set retention policies and don't depend on cache for correctness).

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
- `concurrency: cancel-in-progress` scoped to **PR-triggered** runs only — never on
  billed/nightly runs, to avoid orphaning in-flight spend.

### Cost controls (enforced in the runner, not aspirational)
Caps: max cases, max samples (N), max wall-clock, max output tokens, max tool calls
per case, **no automatic model-failure retries** (retries ≠ pass@k), and **fail-closed
if estimated cost > budget**. Cheapest capable pinned model.

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
1. Tier 0 only: pure-function tests (incl. refactored migration classifier),
   rule-ID-set a11y scan, negative/setup cases, docs `command`/`path` parity, CI.
   Zero LLM cost, immediate value.
2. Stream-based Tier 1 trace assertions on a tiny gated case set; grounding gated on
   trace; runner cost caps.
3. LLM-judge quality metric (non-blocking) + Tier 2 adversarial + randomized mocks.
4. Normalized TS↔Python parity + trace-shape behavioral parity (non-blocking).

## 9. Open questions
- Which cheap, stable model id do we pin for CI, and can we get a sandboxed key with a
  hard spend cap?
- Acceptable monthly eval budget + cadence (drives N and the cost table in §4.3)?
- Repo home for evals: this repo, the site repo, or a dedicated eval repo?
- Do we change the migration staleness signal (mtime → content hash / commit time) as
  part of this work, or only wrap the classifier for testing?
