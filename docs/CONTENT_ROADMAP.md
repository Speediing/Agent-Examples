# Content Roadmap — more examples across the SDLC

Status: plan for review. This is a **backlog plus a repeatable playbook**, not an
implementation. It targets the runnable examples in this repo (`examples/<name>/`)
and the cookbook posts in the sibling `agent-example-site` repo
(`app/blog/posts.ts`, `app/blog/guides.ts`).

The goal is twofold:

1. Ship a **flagship Slack-bot example** built on the Cursor SDK + the Vercel
   Chat SDK — the canonical "chat surface" recipe the cookbook is currently
   missing.
2. Define a **wave-based backlog** that fills every SDLC stage with at least one
   runnable example, plus a per-example **definition of done** you (or a cloud
   agent) can run on repeat until the roster is complete.

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

## 4. The backlog — examples by SDLC stage

Each row is one playbook run. Priority is the suggested order; "Wave" groups them
(§5). Patterns reuse the six shapes from `agent-team-sdlc`; net-new shapes are
flagged. Seats are drawn from the `agent-team-enterprise` 23-seat roster so each
example becomes a real link target.

| # | Example | Stage | Pattern | Surface / trigger | Net-new lesson | Wave |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `slack-bot` | Plan / Review | Chat-triggered + approval gate | Chat (Slack webhook) | Chat SDK surface, cloud-agent PR, human-in-loop | 1 |
| 2 | `spec-drafter` | Plan | Prompt-first + repo read | Terminal / ticket trigger | Ground a spec in code the change touches | 1 |
| 3 | `pr-summarizer` | Review | Local tool agent | CI (`pull_request`) | Read a diff, route by risk, post a walkthrough | 1 |
| 4 | `test-coverage-agent` | Test | Local tool agent | CI / terminal | Find untested changed lines, propose tests | 2 |
| 5 | `flake-hunter` | Test | Audit then act | Scheduled | Detect flaky tests from history, quarantine | 2 |
| 6 | `release-notes-drafter` | Release | Prompt-first | CI (tag/release) | Summarize merged PRs into release notes | 2 |
| 7 | `dependency-updater` | Develop / Release | Audit then act | Scheduled | Triage dependency bumps, gate risky ones | 3 |
| 8 | `scaffolding-agent` | Develop | Local tool agent (writes) | Terminal | Generate a new module from conventions, gated | 3 |
| 9 | `postmortem-drafter` | Operate | Investigate and gate | Chat / webhook | Turn an incident timeline into a draft postmortem | 3 |
| 10 | `cost-auditor` | Operate | Audit then act | Scheduled | Flag cost/perf anomalies, no false "fixed" claims | 4 |

Notes:

- **Wave 1** is the highest-leverage gap fill: it adds the chat surface (1) and
  the two stages the SDLC guide says deserve the most weight — plan (2) and review
  (3). Build these first.
- Items 4–10 each instantiate an existing pattern on a new surface, so they reuse
  the eval scaffolding rather than inventing new test infrastructure.
- The Chat SDK adapter from example 1 is reusable: `postmortem-drafter` (9) can run
  on the same surface, so build 1 before 9.
- Stop and re-evaluate the backlog after each wave. If a stage already feels
  well-covered for your audience, drop or defer its remaining rows rather than
  shipping examples that only repeat a shape.

---

## 5. Sequencing — how to run it for a while

Run waves in order; within a wave, one example per branch/PR, each passing its
§2.2 definition of done before the next starts.

- **Wave 1 — chat + the upstream stages** (examples 1–3): Slack bot, spec drafter,
  PR summarizer. Closes the surface gap and the plan/review weighting the SDLC
  guide argues for.
- **Wave 2 — test + release** (examples 4–6): coverage agent, flake hunter, release
  notes.
- **Wave 3 — develop + operate writes** (examples 7–9): dependency updater,
  scaffolding agent, postmortem drafter.
- **Wave 4 — operate tail** (example 10): cost auditor, plus any deferred rows.

A cloud agent can take one row at a time: give it this file, the target row, the
`agent-cookbook` skill, and `AGENTS.md`. Its task is "complete one playbook run
(§2) for example `<name>` and stop." Keep the per-example PRs independent so review
and the eval gates stay small.

### Tracking

Keep status in this section as rows ship (or move to a checklist):

- [ ] 1 `slack-bot`
- [ ] 2 `spec-drafter`
- [ ] 3 `pr-summarizer`
- [ ] 4 `test-coverage-agent`
- [ ] 5 `flake-hunter`
- [ ] 6 `release-notes-drafter`
- [ ] 7 `dependency-updater`
- [ ] 8 `scaffolding-agent`
- [ ] 9 `postmortem-drafter`
- [ ] 10 `cost-auditor`

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
- **Python parity for the Slack bot.** The Chat SDK is TypeScript-only. Either scope
  the Python port to the Cursor SDK triage half (matching the TS factory module) or
  mark this example TS-only in the manifest. Decide before wiring parity tests.
- **Backlog size.** Ten examples may over-cover some stages for the intended
  audience. Confirm the audience (individual builders vs platform teams) before
  Wave 3 — it decides whether `scaffolding-agent` and `cost-auditor` earn a slot.
