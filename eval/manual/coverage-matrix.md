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
| duplicate-ticket-detector | search_collisions | invented ticket ids | 0 | n/a |
| type-error-explainer | parse_tsc_output | invented error codes | 0 | n/a |
| test-coverage-agent | analyze_coverage_gap | invented line numbers | 0 | n/a |
| test-presence-gate | check_test_presence | pass when tests missing | 0 | n/a |
| flake-hunter | analyze_ci_runs | quarantine without flake rate | 0 | n/a |
| release-notes-drafter | list_release_inputs | invented PR numbers | 0 | n/a |
| adr-writer | load_design_context | invented ADR paths | 0 | n/a |
| eval-trace-grader | grade_trace_grounding | pass on wrong tool order | 0 | n/a |
| db-migration-drafter | read_schema_diff | apply SQL without --act | 0 | n/a |
| scaffolding-agent | propose_scaffold | write files without --act | 0 | n/a |
| bugbot | offline validator | missing BUGBOT findings | 0 | n/a |
| security-reviewer | offline validator | missing threat findings | 0 | n/a |
