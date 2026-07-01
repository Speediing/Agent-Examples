---
name: modernization-workbench
description: Operate the Next.js modernization workbench: catalog transforms, submit cloud runs, track PRs.
---

# Modernization workbench

Browser UI for submitting Cursor cloud transforms with Vercel-native deploy flow.

## Workflow

1. Open /workbench on the example site.
2. Add target repos to the portfolio.
3. Pick a catalog transform or define a custom one.
4. Submit — the API calls the Cursor SDK with autoCreatePR.
5. Track run ID and PR URL in the run history panel.

## Environment

Set CURSOR_API_KEY and CURSOR_MODEL in Vercel project settings for API routes.