# Agent Examples — agent instructions

This repo ships five Cursor SDK agent examples with a tiered eval suite. When you
change agent behavior, prompts, tools, or Python ports, run the relevant tests and
extend the suite when coverage is missing.

See `docs/EVAL_PLAN.md` for architecture and phasing. See `eval/manual/coverage-matrix.md`
for the current coverage map.

## Before you finish agent work

Always run **Tier 0** (no API key, deterministic):

```sh
npm ci
npm run build
npx playwright install chromium   # first run / after lockfile changes
AGENT_EXAMPLE_SITE_PATH=../agent-example-site npm test
python3 -m pip install -r requirements-dev.txt
python3 -m pytest
npm run typecheck
```

Run **Tier 1/2 LLM evals** when you change prompts, tool maps, handler logic that
affects traces, or anything an LLM must do correctly:

```sh
export CURSOR_API_KEY=...
export CURSOR_MODEL=...   # or CURSOR_AGENT_MODEL
npm run test:llm
```

Or run everything:

```sh
npm run test:all
python3 -m pytest
```

Do not skip tests because a change “looks small.” Tier 0 is fast and blocks on every
PR. LLM evals catch regressions in tool choice, grounding, and read-only contracts.

## What each test tier covers

| Tier | Command | Needs key | Use when |
| --- | --- | --- | --- |
| 0 | `npm test` | No | Handlers, classifiers, scans, setup/negative cases, docs↔code parity |
| 1 | `npm run test:llm` (tier1) | Yes | Trace assertions, grounding, smoke output for each agent |
| 2 | `npm run test:llm` (tier2) | Yes | SRE adversarial cases (unknown service, injection, metrics contract) |
| parity | `eval/parity/*`, pytest | Mixed | TS↔Python deterministic handler parity |

## Where tests live

```txt
eval/                          # @cursor-examples/agent-eval package
  index.ts                     # public API
  cli.ts                       # npm run eval:list / eval:run
  cases/                       # SDLC task case catalog
  lib/                         # runner, evidence, workspace, graders
  tier1/                       # LLM behavioral evals per agent
  tier2/                       # adversarial / robustness
  parity/                      # TS↔Python parity
  *.test.ts                    # Tier 0 unit + integration tests
tests/                         # pytest (migration classifier, Python parity)
docs/EVAL_PLAN.md              # full eval design
```

## Adding or updating tests

Add tests when you:

- **Add a new example** under `examples/<name>/`
  - Extract prompt builders and tool maps into side-effect-free modules (see
    `examples/*/ts/src/tools.ts`, `agent.ts`, `classifier.ts`) so CLI and evals
    share the same definitions.
  - Add Tier 0 handler/setup tests in `eval/` or `tests/`.
  - Add a Tier 1 case in `eval/tier1/<agent>.test.ts` if the agent calls the SDK
    with LLM-dependent behavior.
  - Register `cursorExample.pythonPort` in `ts/package.json` and extend migration
    classifier tests if applicable.
  - Update `eval/manual/coverage-matrix.md`.

- **Change a pure handler or classifier**
  - Update or add unit tests in `eval/tool-handlers.test.ts`,
    `eval/migration-classifier.test.ts`, or `tests/test_python_parity.py`.
  - Keep TS and Python ports aligned; parity tests assert normalized shapes, not
    string equality.

- **Change prompts or custom tools**
  - Update the shared factory module, not only `index.ts` / `main.py`.
  - Re-run `npm run test:llm` for that agent.
  - Adjust trace graders in `eval/tier1/` if expected tool names, args, or
    grounding rules changed.

- **Change runnable commands or example paths** (in this repo or the docs site)
  - Update root `package.json` scripts and the matching fields in
    `agent-example-site/app/blog/posts.ts`.
  - Update `eval/fixtures/cookbook-parity.json` so CI keeps parity coverage.
  - Run `AGENT_EXAMPLE_SITE_PATH=../agent-example-site npm test` locally for the
    live cross-repo check against `app/blog/posts.ts`.

- **Add a new failure mode worth guarding** (especially SRE)
  - Add a Tier 2 case in `eval/tier2/` before fixing behavior when possible.
  - Record the row in `eval/manual/coverage-matrix.md`.

Prefer **trace assertions** (`run.stream()` via `eval/lib/run-agent.ts`) over
brittle full-output string matching. Recompute tool results from pure handlers
instead of trusting streamed `result` fields. Do not gate CI on LLM-as-judge alone.

## Patterns to preserve

- **Single source of truth:** CLI entrypoints import factory modules; evals import
  the same modules. Avoid duplicating prompt or tool definitions in tests.
- **Migration audit:** use the pure classifier in `classifier.ts` / `classifier.py`;
  staleness uses git commit time with mtime fallback (`git-signal.ts`).
- **Side-effectful paths:** do not run `migration-agent --use-cursor-sdk` repair in
  CI against the working tree.
- **Teaching prompts:** published cookbook copy in `agent-example-site` is not an
  optimization target for automated eval loops (see `docs/EVAL_PLAN.md` §9).

## CI

- **Tier 0** — `.github/workflows/tier-0-eval.yml` on every push/PR
- **Tier 1** — `.github/workflows/tier-1-eval.yml` on `main`, schedule, and
  `workflow_dispatch` (requires `CURSOR_API_KEY` in the `cursor-eval` environment)
