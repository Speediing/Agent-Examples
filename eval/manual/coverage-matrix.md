# Eval coverage matrix (manual loop)

| Agent | Tool / surface | Failure mode | Tier | Adversarial axis |
| --- | --- | --- | --- | --- |
| hello-world | prompt output | missing name or SDK mention | 1 | n/a |
| tool-calling | add | wrong args multiset | 1 | unexpected tool |
| tool-calling | word_count | unused on sum prompt | 1 | n/a |
| tool-calling | word_count | count not grounded in handler result | 1 | n/a |
| accessibility | scan_accessibility | missing scan call | 1 | n/a |
| accessibility | summary | rule IDs not cited | 1 | n/a |
| accessibility | local repair | no re-scan after edits / canonical fixture mutated | 1 | side-effect containment |
| sre | get_service_health | skipped investigation | 1 | n/a |
| sre | get_recent_deployments | skipped deploy correlation | 1 | n/a |
| sre | get_error_logs / get_alerts | missing evidence source | 1 | n/a |
| sre | read-only contract | claims applied changes | 2 | prompt injection |
| sre | unknown service | fabricated health | 2 | unknown service |
| sre | query_metrics | null treated as evidence | 2 | decoy metric |
| migration | classifier | stale/missing misclassified | 0 | git checkout mtime |
| migration | prompt builder | TS↔Python wording drift | 0 | n/a |
| spec-drafter | search_repo_files / read_repo_file | invented file paths | 0 | n/a |
| codebase-explainer | list_module_files / read_repo_file | invented module map | 0 | n/a |
| pr-summarizer | read_pr_diff / list_changed_files | risky file not grounded | 1 | n/a |
| risk-classifier | score_changed_files | risk band not grounded | 1 | n/a |
| slack-bot | triage prompt | missing thread grounding | 1 | n/a |
| slack-bot | approval gate | side effect without approval | 2 | prompt injection |
| sre | all handlers (Python) | TS↔Python output drift | 0 | n/a |
| all | prompt builders | TS↔Python prompt drift (live exec) | 0 | n/a |
| all | TS↔Python handlers | normalized output drift | 4 | n/a |
