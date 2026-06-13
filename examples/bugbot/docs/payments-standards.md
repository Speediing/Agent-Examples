# Payments handler standards

Shared source of truth for payment review rules. Reference this file from `.cursor/BUGBOT.md` so IDE rules and Bugbot stay aligned.

## Idempotency

- Generate idempotency keys server-side with `crypto.randomUUID()`.
- Never reuse card tokens, session ids, or client-supplied identifiers as idempotency keys.

## Refunds

- Verify the caller may refund the charge before calling the gateway.
- Log charge id, actor, and reason for every refund attempt.

## Tests

- Every change under `src/payments/**` needs a matching update under `tests/payments/**`.
