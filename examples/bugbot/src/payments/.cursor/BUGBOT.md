# Payments module rules

Applied when Bugbot reviews changes under `src/payments/**`.

## Refunds need explicit authorization

If a new or changed function under `src/payments/**` calls `gateway.refund` or posts to `/refunds` without checking caller role or charge ownership, add a **blocking** bug titled "Refund path missing authorization".

## No silent amount coercion

If `normalizeAmount` or similar helpers change monetary values without logging or documenting rounding policy, add a non-blocking bug asking for an audit trail or test that covers fractional cents.
