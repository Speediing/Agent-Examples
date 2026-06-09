# Checkout 503 / connection pool exhausted

When checkout-api returns 503 after a deploy:

1. Confirm error rate and latency with observability tools.
2. Check for a deploy within 30 minutes.
3. Inspect connection pool saturation in metrics and error logs.
4. Compare `DB_POOL_MAX_CONNECTIONS` against worker concurrency in the infra manifest.
5. Open a pull request that restores a safe pool size — do not patch live resources directly.

Escalate to checkout on-call if error rate stays above 10% for 10 minutes.
