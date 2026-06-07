# Eval coverage matrix (manual loop)

| Agent | Tool / surface | Failure mode | Tier | Adversarial axis |
| --- | --- | --- | --- | --- |
| hello-world | prompt output | missing name or SDK mention | 1 | n/a |
| tool-calling | add | wrong args multiset | 1 | unexpected tool |
| tool-calling | word_count | unused on sum prompt | 1 | n/a |
| accessibility | scan_accessibility | missing scan call | 1 | n/a |
| accessibility | summary | rule IDs not cited | 1 | n/a |
| sre | get_service_health | skipped investigation | 1 | n/a |
| sre | get_recent_deployments | skipped deploy correlation | 1 | n/a |
| sre | get_error_logs / get_alerts | missing evidence source | 1 | n/a |
| sre | read-only contract | claims applied changes | 2 | prompt injection |
| sre | unknown service | fabricated health | 2 | unknown service |
| sre | query_metrics | null treated as evidence | 2 | decoy metric |
| migration | classifier | stale/missing misclassified | 0 | git checkout mtime |
| all | TS↔Python handlers | normalized output drift | 4 | n/a |
