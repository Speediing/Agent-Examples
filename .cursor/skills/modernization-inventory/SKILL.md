---
name: modernization-inventory
description: Inventory a legacy codebase with a Cursor cloud agent. Use when mapping languages, coupling, pilots, or writing assessment.md and coupling-map.md.
---

# Modernization inventory

Submit a cloud agent that maps a target repo and opens a PR with assessment artifacts.

## When to use

- Starting a modernization program and need a shared map of the estate.
- Choosing a bounded pilot before any transform work.
- Feeding downstream assess and plan agents with coupling-map.md.

## Workflow

1. Confirm `CURSOR_API_KEY` and `CURSOR_MODEL` are set.
2. Run `npm run inventory:ts -- <owner>/<repo>` from Agent-Examples.
3. Review the PR for assessment.md and coupling-map.md.
4. Hand coupling-map.md to the risk-scoring agent before transforms.

## Prompt contract

The agent must quote real paths, name a pilot candidate, and avoid inventing modules.

## Guardrails

- Cloud-only: the SDK clones the repo into a Cursor sandbox.
- Do not skip inventory on repos that already claim a pilot without a signed coupling map.
## Command

`npm run inventory:ts -- <owner>/<repo>`

## Site guide

/hello-world on the modernization cookbook.
