# Payments platform review rules

Bugbot merges this file with nested `.cursor/BUGBOT.md` files, dashboard team rules, and learned rules. See [Cursor Bugbot docs](https://cursor.com/docs/bugbot).

## Modular standards

- [Payments handler standards](docs/payments-standards.md)

## Flag idempotency key mistakes

If a changed file under `src/payments/**` passes a client token, session id, or card token to an `idempotencyKey` field, add a **blocking** bug titled "Unsafe idempotency key".

Body must explain that idempotency keys must be server-generated UUIDs, not client tokens. Suggest generating `crypto.randomUUID()` at the handler boundary.

## Require tests when payment handlers change

If the PR modifies files in `src/payments/**` and does not modify files in `tests/payments/**`, add a **blocking** bug titled "Missing payments tests".

Body: "Payment handler changes need matching unit or integration tests under `tests/payments/`."

## Leave generated lockfiles alone

Do not flag formatting-only churn in `package-lock.json` or `pnpm-lock.yaml` unless a dependency version changed.
