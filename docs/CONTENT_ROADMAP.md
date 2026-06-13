# Content Roadmap — more examples across the SDLC

Status: All 50 roadmap examples plus `slack-bot` are scaffolded with TS (+ Python where applicable), cookbook guides grouped by SDLC stage on agent-example-site, and Tier 0 handler smoke tests. Wave 1 posts retain detailed copy; Waves 2–5 use generated guides you can deepen over time. This file remains the playbook for upgrading scaffolds into production agents.
and the cookbook posts in the sibling `agent-example-site` repo
(`app/blog/posts.ts`, `app/blog/guides.ts`).

The goal is twofold:

1. Ship a **flagship Slack-bot example** built on the Cursor SDK + the Vercel
   Chat SDK — the canonical "chat surface" recipe the cookbook is currently
   missing.
2. Define a **wave-based backlog of 50 examples** that staffs every SDLC stage —
   weighted toward plan and review, as the `agent-team-sdlc` guide argues — plus a
   per-example **definition of done** you (or a cloud agent) can run on repeat
   until the roster is complete.

Read this alongside `docs/EVAL_PLAN.md` (test architecture) and
`eval/manual/coverage-matrix.md` (current eval coverage). Follow
`AGENTS.md` for the test commands every change must pass.

---

## 1. Where the content stands today

### Runnable examples (`examples/`)

| Example | Pattern | SDLC stage it teaches | TS + Python |
| --- | --- | --- | --- |
| `hello-world` | Prompt-first starter | Plan | yes |
| `tool-calling-agent` | Local tool agent | Develop | yes |
| `accessibility-agent` | Scan, fix, re-scan | Review | yes |
| `migration-agent` | Audit then act | Release | yes |
| `sre-agent` | Investigate and gate | Operate | yes |

### Cookbook posts (`agent-example-site`)

`hello-world` (in `posts.ts`) plus seven guides in `guides.ts`:
`tool-calling-agent`, `accessibility-agent`, `migration-agent`, `sre-agent`,
`agent-evals`, `automations-vs-sdk`, `agent-team-sdlc`, `agent-team-enterprise`.

### The gap

The `agent-team-sdlc` guide maps **six SDLC stages** (plan, develop, review,
test, release, operate) to **six patterns**, and each stage links to exactly one
"floor" example. Two structural gaps follow:

- **Surfaces are thin.** The SDLC guide's surface table lists five surfaces
  (terminal, CI, webhooks, scheduled, **chat and approvals**). Chat only appears
  as the SRE agent's `request_approval` gate — there is **no runnable
  chat-triggered agent**. This is the Slack bot's slot.
- **One example per stage.** The `agent-team-enterprise` guide already enumerates
  a **23-seat roster**. Most of those seats have no runnable example to link to.
  The roadmap below promotes the highest-value seats into examples.

---

## 2. The repeatable playbook (run this once per example)

This is the loop to "run for a while." Each example is a self-contained unit of
work sized for one focused branch / one cloud-agent run. Do them one at a time,
in wave order (§4). Do **not** batch multiple examples into one PR — the eval and
parity wiring is per-example and reviews stay small.

### 2.1 Per-example steps

1. **Pick the next example** from the backlog (§4) and read its row plus the
   `agent-cookbook` skill (`agent-example-site/.cursor/skills/agent-cookbook`).
2. **Decide the deterministic/model boundary first.** Write down which facts code
   computes (scans, queries, validation, side effects) and which judgment the
   model owns (intent, tool choice, summary, plan). This boundary is the lesson.
3. **Scaffold the TS example** under `examples/<name>/ts/` following the existing
   shape: side-effect-free factory modules (`prompt`/`tools`/`classifier`) that
   *both* the CLI entrypoint (`index.ts`) and the evals import. Never duplicate
   prompt or tool definitions in tests (see `EVAL_PLAN.md` §2).
4. **Add the `cursorExample.pythonPort` manifest** to the TS `package.json`, then
   write the **Python port** under `examples/<name>/python/`. TS is the source of
   truth; Python mirrors behavior.
5. **Register the run command** in root `package.json` scripts (e.g.
   `"<name>:ts"`) and in `README.md`.
6. **Add Tier 0 tests** (`eval/` or `tests/`): pure-handler unit tests, a
   setup/negative case (missing key, bad input), and TS↔Python parity for any
   shared handler (normalized shape, never string equality — `EVAL_PLAN.md` §4.4).
7. **Add a Tier 1 case** in `eval/tier1/<name>.test.ts` if the agent calls the SDK
   with LLM-dependent behavior (trace assertion on allowed tool sequence +
   grounding). Add a **Tier 2** case in `eval/tier2/` for any new write/approval
   failure mode (SRE-style read-only contract, injection, fabrication).
8. **Wire docs↔code parity.** Add the example `path` and npm script to
   `eval/fixtures/cookbook-parity.json` so CI keeps the docs site honest.
9. **Write the cookbook post** in `agent-example-site` (`guides.ts`, or `posts.ts`
   for a fundamentals-tier recipe). Match the `agent-cookbook` structure: build
   steps that follow the real code path, explicit det/model boundary, safety/scope
   for any write tool, adaptation guidance. Set `slug`, `title`, `description`,
   `cookbook`, `role`, `category`, `form`, `path`, `command`.
10. **Slot the example into the SDLC framing.** Update the stage/surface tables in
    `agent-team-sdlc` and the roster in `agent-team-enterprise` so the new example
    is the link target for its seat.
11. **Record coverage** in `eval/manual/coverage-matrix.md`.

### 2.2 Definition of done (gate before the next example)

Run the full Tier 0 from `AGENTS.md`, from the repo root:

```sh
npm ci
npm run build
npx playwright install chromium   # only if the example uses Playwright
AGENT_EXAMPLE_SITE_PATH=../agent-example-site npm test
python3 -m pip install -r requirements-dev.txt
python3 -m pytest
npm run typecheck
```

And in `agent-example-site`:

```sh
npm run lint
npm run build
```

An example is **done** when: Tier 0 is green (incl. the live cross-repo
docs↔code parity check), the cookbook post renders and its links resolve, the
coverage matrix row exists, and — if it changed prompts/tools/handlers — the
Tier 1 case passes (`npm run test:llm` with a key). Only then start the next one.

### 2.3 Guardrails (apply to every example)

- **Single source of truth.** CLI and evals import the same factory modules.
- **Gate every write.** Read paths need no ceremony; write/side-effecting paths
  ship a gate with the example (scan-only, audit-before-act, or human approval),
  mirroring the ladder in `agent-team-sdlc` step 4.
- **Teaching prompts are not an eval optimization target** (`EVAL_PLAN.md` §9).
- **Keep TS↔Python parity** for shared handlers, normalized — not string-equal.
- **One example per PR.** Separate branch, separate review.

---

## 3. Flagship example — Slack bot on Cursor SDK + Vercel Chat SDK

This is the first item in the backlog and the highest-priority one. It fills the
empty "chat and approvals" surface and demonstrates a Cursor SDK agent triggered
by a real external system instead of argv.

### 3.1 What it teaches

The pattern is **chat-triggered agent with an approval gate**: a Slack thread
mention becomes a triaged plan, and an explicit human Approve click (not the
model) is what authorizes any side effect. It is the runnable version of the
Amplitude/Faire "Slack report → ticket → PR" story the SDLC guide already cites.

- **Vercel Chat SDK** (`chat` + `@chat-adapter/slack` + a state adapter) owns the
  Slack surface: webhook verification, thread/dedupe/locking, mentions, cards, and
  the Approve/Reject buttons.
- **Cursor SDK** (`@cursor/sdk`) owns the model work: `Agent.prompt` triages the
  thread into a structured plan; a **cloud agent** (`cloud.repos`) optionally opens
  a PR — the first example to demonstrate the cloud runtime, complementing the
  local-runtime examples.

### 3.2 The deterministic/model boundary (the lesson)

| Concern | Owner | Where |
| --- | --- | --- |
| Verify webhook signature, dedupe, thread state | Chat SDK (deterministic) | adapter + state backend |
| Decide *what* the report means, draft the plan | Cursor SDK (model) | `Agent.prompt` |
| Create the ticket / open the PR | Custom tool (deterministic side effect) | handler behind approval |
| Authorize the side effect | Human (deterministic) | Approve button → `onAction` |

The model never performs the side effect directly. It proposes; code executes only
after the Approve action fires. This is the same read-only-until-approved contract
the `sre-agent` teaches, now on a chat surface.

### 3.3 Architecture sketch

```
Slack @mention
  -> Chat SDK webhook (verify, dedupe, subscribe thread)
  -> Agent.prompt(buildTriagePrompt(thread))         [model: triage + plan]
  -> thread.post(<Card> plan + Approve/Reject)        [deterministic: render]
  -> onAction("approve")
       -> createTicket(plan)                          [deterministic side effect]
       -> Agent.prompt(..., { cloud: { repos } })     [optional: cloud agent PR]
       -> thread.post(ticket + PR links)
```

The bot logic is platform-agnostic Chat SDK code, so the same handler also serves
Teams/Discord by adding an adapter — call that out as the adaptation step.

### 3.4 Build outline (follows the §2 playbook)

- `examples/slack-bot/ts/src/bot.ts` — Chat SDK `new Chat({...})`, adapters, state,
  `onNewMention` / `onSubscribedMessage` / `onAction` handlers.
- `examples/slack-bot/ts/src/agent.ts` — `buildTriagePrompt(thread)` and the
  Cursor SDK call (factory module, imported by both bot and evals).
- `examples/slack-bot/ts/src/tools.ts` — `create_ticket`, `open_pr` handlers with
  JSON schemas and validation; both gated behind the approval action.
- `examples/slack-bot/ts/src/webhook.ts` — minimal HTTP entrypoint wiring
  `bot.webhooks.slack` to a route.
- Python port under `examples/slack-bot/python/`.

Before writing Chat SDK code, read the published docs the `chat-sdk` skill points
to in `node_modules/chat/docs/` (`getting-started`, `handling-events`, `actions`,
`cards`, `state`, `guides/slack-nextjs`).

### 3.5 Safety and scope

- Webhook signature verification on; dedupe TTL set; thread locking via the state
  adapter so concurrent events do not double-fire.
- `create_ticket` / `open_pr` only run inside the `onAction("approve")` path.
- Cloud-agent PRs land on a branch a person reviews — no push to main.
- Secrets (`SLACK_*`, `CURSOR_API_KEY`, state backend URL) from env; document the
  Slack app manifest and scopes in the cookbook prerequisites.

### 3.6 Eval coverage

- **Tier 0:** triage prompt builder is pure (unit + TS↔Python parity); tool
  handlers validate args; a "no approval → no side effect" unit test.
- **Tier 1:** trace assertion that triage calls `Agent.prompt` and grounds the plan
  in thread content; smoke output check.
- **Tier 2:** approval-gate contract (a Reject or missing approval must produce no
  ticket/PR); prompt-injection text in the Slack thread must not trigger a side
  effect. Record both rows in the coverage matrix.

### 3.7 Cookbook + SDLC wiring

- New post in `guides.ts`: `slug: "slack-bot"`, `category: "Workflows"`,
  `form: "SDK + Chat SDK"`, `command: 'npm run slack-bot:ts -- ...'`.
- Update `agent-team-sdlc`: make the **chat and approvals** surface row link to
  `/blog/slack-bot`, and add it to the Plan stage as the "bug report triage" seat.
- Update `agent-team-enterprise`: point the "Bug report triage" seat at the example.
- Add `examples/slack-bot` + `slack-bot:ts` to `eval/fixtures/cookbook-parity.json`.

---

## 4. The backlog — 50 examples by SDLC stage

Each row is one playbook run (§2). Tables are grouped by SDLC stage and weighted
toward plan and review, the stages the `agent-team-sdlc` guide says deserve the
most agents. Each example reuses one of the six shapes from that guide (or the
net-new **Chat** shape the Slack bot introduces) and slots into a seat the
`agent-team-enterprise` roster already names, so every example becomes a real
cookbook link target.

Pattern key: **PF** prompt-first · **LT** local tools · **SFR** scan, fix,
re-scan · **ATA** audit then act · **IAG** investigate and gate · **BE**
behavioral evals · **CHAT** chat-triggered + approval gate. "(writes)" marks a
side-effecting agent that must ship a gate.

Stage weighting: Plan 10 · Develop 8 · Review 10 · Test 7 · Release 7 · Operate 8.

### Plan (10)

| # | Example | Pattern | Surface / trigger | Lesson it adds | Wave |
| --- | --- | --- | --- | --- | --- |
| 1 | `slack-bot` | CHAT | Slack webhook | Chat SDK surface, cloud-agent PR, human-in-loop (flagship, §3) | 1 |
| 2 | `spec-drafter` | PF + repo read | Ticket / terminal | Ground a spec in the code the change touches | 1 |
| 3 | `codebase-explainer` | PF + repo read | Terminal | Explain an unfamiliar subsystem for onboarding | 1 |
| 4 | `duplicate-ticket-detector` | LT | Webhook (new issue) | Search issues + code for collisions before work starts | 2 |
| 5 | `backlog-groomer` | ATA | Scheduled | Link duplicates, flag stale tickets, surface obsoleted work | 2 |
| 6 | `prior-art-finder` | LT | Ticket / terminal | Surface existing implementations before building new | 3 |
| 7 | `roadmap-digest` | PF | Scheduled | One-post weekly summary of merged work and decisions | 3 |
| 8 | `adr-writer` | PF | Terminal | Draft an architecture decision record grounded in code | 3 |
| 9 | `estimation-helper` | LT | Ticket | Break a spec into tasks with the touched-files list | 4 |
| 10 | `requirements-clarifier` | CHAT | Slack | Turn a vague request into ranked clarifying questions | 4 |

### Develop (8) — fewest seats; Cursor already covers this interactively

| # | Example | Pattern | Surface / trigger | Lesson it adds | Wave |
| --- | --- | --- | --- | --- | --- |
| 11 | `scaffolding-agent` | LT (writes) | Terminal | Generate a new module from house conventions, gated | 4 |
| 12 | `dependency-updater` | ATA (writes) | Scheduled | Triage dependency bumps, gate the risky ones | 4 |
| 13 | `codemod-runner` | ATA (writes) | Terminal | Apply a codemod across files after a dry-run audit | 4 |
| 14 | `convention-fixer` | SFR (writes) | CI | Lint house style, auto-fix, re-scan to confirm | 3 |
| 15 | `boilerplate-generator` | LT (writes) | Terminal | Emit a CRUD endpoint/component from a schema | 5 |
| 16 | `type-error-explainer` | LT | Terminal | Read `tsc` output, explain, propose a fix | 5 |
| 17 | `db-migration-drafter` | LT (writes) | Terminal | Draft a migration from a schema diff, gated | 5 |
| 18 | `api-client-generator` | ATA (writes) | Scheduled | Regenerate clients when an OpenAPI spec drifts | 5 |

### Review (10) — heaviest stage; weight the roster here

| # | Example | Pattern | Surface / trigger | Lesson it adds | Wave |
| --- | --- | --- | --- | --- | --- |
| 19 | `pr-summarizer` | LT | CI (`pull_request`) | Read a diff, name the risky file, post a walkthrough | 1 |
| 20 | `risk-classifier` | LT | CI | Score PR risk and route low-risk vs high-risk | 1 |
| 21 | `convention-reviewer` | SFR | CI | Check house style on the diff and report violations | 2 |
| 22 | `api-contract-gate` | SFR | CI | Detect breaking API changes against a baseline | 2 |
| 23 | `security-review-agent` | IAG | CI | Flag risky patterns in a diff without fabricating | 2 |
| 24 | `codeowners-router` | LT | CI | Suggest reviewers from changed paths + history | 3 |
| 25 | `performance-budget-gate` | SFR | CI (preview) | Flag bundle/perf regressions on the preview build | 3 |
| 26 | `secret-scanner-gate` | SFR | CI | Block a diff that introduces a secret | 4 |
| 27 | `test-presence-gate` | SFR | CI | Require tests for changed application code | 4 |
| 28 | `license-compliance-gate` | ATA | CI | Audit new dependencies' licenses against policy | 5 |

### Test (7)

| # | Example | Pattern | Surface / trigger | Lesson it adds | Wave |
| --- | --- | --- | --- | --- | --- |
| 29 | `test-coverage-agent` | LT | CI / terminal | Find untested changed lines, propose tests | 2 |
| 30 | `eval-trace-grader` | BE | CI | Grade tool choice and grounding from agent traces | 2 |
| 31 | `flake-hunter` | ATA | Scheduled | Detect flaky tests from history and quarantine them | 3 |
| 32 | `test-generator` | LT (writes) | Terminal | Generate unit tests for a module, gated | 4 |
| 33 | `mutation-test-triager` | LT | CI | Run mutation tests, summarize surviving mutants | 5 |
| 34 | `snapshot-reviewer` | SFR | CI | Review snapshot diffs and approve safe churn | 5 |
| 35 | `fixture-freshness-auditor` | ATA | Scheduled | Flag stale test fixtures against current schemas | 5 |

### Release (7)

| # | Example | Pattern | Surface / trigger | Lesson it adds | Wave |
| --- | --- | --- | --- | --- | --- |
| 36 | `release-notes-drafter` | PF | CI (tag/release) | Summarize merged PRs into release notes | 3 |
| 37 | `rollout-watcher` | IAG | Webhook (`deployment_status`) | Watch post-deploy health and gate promotion | 3 |
| 38 | `change-ticket-drafter` | LT | CI | Draft a change/deploy ticket from the release diff | 4 |
| 39 | `feature-flag-reaper` | ATA (writes) | Scheduled | Find stale flags and propose their removal | 4 |
| 40 | `dependency-drift-auditor` | ATA | Scheduled | Compare lockfile against the registry, report drift | 4 |
| 41 | `version-bump-agent` | ATA (writes) | Scheduled | Bump semver from conventional commits, gated | 5 |
| 42 | `deprecation-notice-drafter` | PF | Scheduled | Draft deprecation notices for sunsetting APIs | 5 |

### Operate (8)

| # | Example | Pattern | Surface / trigger | Lesson it adds | Wave |
| --- | --- | --- | --- | --- | --- |
| 43 | `alert-triage-bot` | CHAT | Slack | Alert → triage + runbook suggestion (reuses #1's surface) | 2 |
| 44 | `postmortem-drafter` | IAG | Chat / webhook | Turn an incident timeline into a draft postmortem | 3 |
| 45 | `on-call-digest` | PF | Scheduled | Summarize overnight alerts into one digest | 3 |
| 46 | `cost-auditor` | ATA | Scheduled | Flag cost/perf anomalies, no false "fixed" claims | 3 |
| 47 | `runbook-freshness-auditor` | ATA | Scheduled | Replay runbooks against infra, flag stale steps | 4 |
| 48 | `log-anomaly-investigator` | IAG | Webhook | Investigate an error spike and gate any action | 4 |
| 49 | `slo-budget-reporter` | PF | Scheduled | Weekly error-budget report naming the spending commit | 5 |
| 50 | `incident-comms-drafter` | PF | Chat | Draft status-page / stakeholder updates during an incident | 5 |

Coverage notes:

- **Surfaces.** The backlog spreads across all five surfaces from the SDLC guide:
  terminal, CI, webhook, scheduled, and chat. CHAT examples (1, 10, 43) share the
  Slack bot's adapter, so build #1 first and the rest reuse its plumbing.
- **Write gates.** Every "(writes)" row ships a gate (scan-only, audit-before-act,
  or human approval) exactly as the `agent-team-sdlc` step-4 ladder requires.
- **Pattern reuse.** Most rows instantiate an existing shape on a new surface, so
  they reuse the eval scaffolding rather than inventing new test infrastructure.
  Only #1 (CHAT) and #30 (BE, reuses the `agent-evals` harness) add new lessons at
  the framework level.

---

## 5. Sequencing — how to run it for a while

Run by wave; within a wave, one example per branch/PR, each passing its §2.2
definition of done before the next starts. The **Wave** column in §4 assigns every
row — the themes below explain the ordering. Re-evaluate the remaining backlog
after each wave: if a stage already feels well-covered for your audience, defer or
drop its lower-wave rows rather than shipping examples that only repeat a shape.

- **Wave 1 — chat surface + the upstream bottleneck** (1, 2, 3, 19, 20). The Slack
  bot plus the top plan and review seats. Closes the empty chat surface and the
  plan/review weighting the SDLC guide argues for.
- **Wave 2 — review depth, test/eval foundation, triage reuse** (4, 5, 21, 22, 23,
  29, 30, 43). Stand up the eval grader (#30) early so later waves can lean on it.
- **Wave 3 — release + operate core, planning docs** (6, 7, 8, 14, 24, 25, 31, 36,
  37, 44, 45, 46). One credible seat per remaining stage.
- **Wave 4 — develop writes + remaining gates** (9, 10, 11, 12, 13, 26, 27, 32, 38,
  39, 40, 47, 48). The write-capable agents, once read-only patterns are proven.
- **Wave 5 — long-tail coverage** (15, 16, 17, 18, 28, 33, 34, 35, 41, 42, 49, 50).
  Round out each stage; build only the rows your audience will actually use.

A cloud agent can take one row at a time: give it this file, the target row, the
`agent-cookbook` skill, and `AGENTS.md`. Its task is "complete one playbook run
(§2) for example `<name>` and stop." Keep the per-example PRs independent so review
and the eval gates stay small.

### Tracking

Check rows off as they ship.

**Plan** — [x] 1 `slack-bot` · [x] 2 `spec-drafter` · [x] 3 `codebase-explainer` ·
[x] 4 `duplicate-ticket-detector` · [x] 5 `backlog-groomer` · [x] 6 `prior-art-finder` ·
[x] 7 `roadmap-digest` · [x] 8 `adr-writer` · [x] 9 `estimation-helper` ·
[x] 10 `requirements-clarifier`

**Develop** — [x] 11 `scaffolding-agent` · [x] 12 `dependency-updater` ·
[x] 13 `codemod-runner` · [x] 14 `convention-fixer` · [x] 15 `boilerplate-generator` ·
[x] 16 `type-error-explainer` · [x] 17 `db-migration-drafter` ·
[x] 18 `api-client-generator`

**Review** — [x] 19 `pr-summarizer` · [x] 20 `risk-classifier` ·
[x] 21 `convention-reviewer` · [x] 22 `api-contract-gate` ·
[x] 23 `security-review-agent` · [x] 24 `codeowners-router` ·
[x] 25 `performance-budget-gate` · [x] 26 `secret-scanner-gate` ·
[x] 27 `test-presence-gate` · [x] 28 `license-compliance-gate`

**Test** — [x] 29 `test-coverage-agent` · [x] 30 `eval-trace-grader` ·
[x] 31 `flake-hunter` · [x] 32 `test-generator` · [x] 33 `mutation-test-triager` ·
[x] 34 `snapshot-reviewer` · [x] 35 `fixture-freshness-auditor`

**Release** — [x] 36 `release-notes-drafter` · [x] 37 `rollout-watcher` ·
[x] 38 `change-ticket-drafter` · [x] 39 `feature-flag-reaper` ·
[x] 40 `dependency-drift-auditor` · [x] 41 `version-bump-agent` ·
[x] 42 `deprecation-notice-drafter`

**Operate** — [x] 43 `alert-triage-bot` · [x] 44 `postmortem-drafter` ·
[x] 45 `on-call-digest` · [x] 46 `cost-auditor` · [x] 47 `runbook-freshness-auditor` ·
[x] 48 `log-anomaly-investigator` · [x] 49 `slo-budget-reporter` ·
[x] 50 `incident-comms-drafter`

---

## 6. Open questions

- **Slack bot host.** Does the example ship a Next.js route (matches the Chat SDK
  `slack-nextjs` guide and the docs site's stack) or a framework-light Node HTTP
  entrypoint? A Next.js route reads closest to real deployments; a bare entrypoint
  is easier to run in Tier 0. Recommendation: bare entrypoint for the runnable
  example, Next.js route shown as the deploy step in the cookbook.
- **State backend in CI.** Chat SDK needs a state adapter. Use
  `@chat-adapter/state-memory` for the runnable example and tests; document Redis/PG
  for production.
- **Python parity for chat examples.** The Chat SDK is TypeScript-only. For the
  CHAT rows (1, 10, 43), either scope the Python port to the Cursor SDK half
  (matching the TS factory module) or mark them TS-only in the manifest. Decide
  before wiring parity tests.
- **Backlog size and audience.** Fifty examples over-cover some stages for an
  individual builder; they fit a platform team building an internal catalog.
  Confirm the audience before Wave 4 — it decides how much of Waves 4–5 to build
  versus defer. The waves are designed so stopping after Wave 3 still leaves every
  stage with at least one read-only and one gated example.
- **Repo capacity.** Fifty examples is ~3x the current workspace count. Decide
  whether they all live in this repo or whether some stages graduate to a dedicated
  catalog repo once the count grows (relates to the `EVAL_PLAN.md` §10 "repo home"
  question).
