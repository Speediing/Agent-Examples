---
name: modernization-risk-assess
description: Score modernization risk with deterministic rules in scripts/score-risk.ts. Use before wave planning or stack transforms.
---

# Modernization risk scoring

Commit a deterministic risk score derived from manifests, coupling, and test signals.

## Workflow

1. Run inventory first when coupling-map.md is missing.
2. Run `npm run assess:ts -- <owner>/<repo>`.
3. Review risk.md severity and blockers in the PR.
4. Defer high-severity repos until verify gates exist.

## Rules live in code

Scoring belongs in scripts/score-risk.ts, not prose in the PR body.
## Command

`npm run assess:ts -- <owner>/<repo>`

## Site guide

/score-modernization-risk on the modernization cookbook.
