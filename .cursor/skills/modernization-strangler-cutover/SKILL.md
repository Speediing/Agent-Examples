---
name: modernization-strangler-cutover
description: Stage strangler traffic ramps with rollback-first PRs and error-budget gates.
---

# Strangler cutover

Edit deploy/traffic-split.json only. Open rollback PR before any ramp.
## Command

`npm run cutover:ts -- <owner>/<repo>`

## Site guide

/strangler-cutover on the modernization cookbook.
