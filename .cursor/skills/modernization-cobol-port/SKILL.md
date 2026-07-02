---
name: modernization-cobol-port
description: Port COBOL pilots to Java with business-rules.md, SME gates, and golden fixtures.
---

# COBOL to Java port

Reverse engineer WHEN/THEN rules, gate on SME sign-off, then forward engineer one pilot.

## Workflow

1. Ensure coupling-map.md names the pilot program.
2. Run `npm run port:cobol:ts -- <owner>/<repo>`.
3. Block merge while business-rules.md has needs_sme rows.
4. Attach sme-review.md checklist to the PR.
## Command

`npm run port:cobol:ts -- <owner>/<repo>`

## Site guide

/port-cobol-to-java on the modernization cookbook.
