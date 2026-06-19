# Manual sre-agent improvement loop handoff (see docs/EVAL_PLAN.md §9)

## Allowed files

- `eval/lib/**`
- `examples/sre-agent/ts/src/tools.ts` (guardrail/validation only — not published prompt text in `posts.ts`)

## Forbidden files

- `eval/cases/**` (held-out case bodies), `eval/tier1/**`, `eval/tier2/**`
- `.github/workflows/**`
- `package-lock.json`, pinned version files
- `agent-example-site/app/blog/posts.ts`

## Validation command

```sh
npm run test:all
python3 -m pytest
```

## Cases expected to flip

- List case ids here before implementation begins.

## Reviewer checklist

- [ ] Diff stays within allowed files
- [ ] Teaching prompts unchanged
- [ ] Full Tier 0 + Tier 1 suite green on the branch
- [ ] Trace artifacts attached for any stochastic failure
