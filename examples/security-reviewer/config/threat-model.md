# Payments API threat model

Reference for Security Reviewer custom instructions and team onboarding.

## Assets

- Card tokens and charge ids in `src/payments/**`
- Session cookies and JWT validation in `src/auth/**`
- Admin routes under `src/admin/**`

## Trust boundaries

- Public HTTP handlers must validate session before calling payment gateways.
- Internal admin tools may call gateway APIs only through audited service accounts.

## Non-negotiable controls

- No hardcoded API keys in application source.
- No string-built SQL for user-controlled input.
- No `eval`, `exec`, or dynamic `Function` on request data.

## Review triggers

Security Reviewer should escalate when a PR:

- Relaxes auth checks on payment or refund routes
- Adds new outbound network calls from auth middleware
- Introduces agent tools that write production data without approval gates
