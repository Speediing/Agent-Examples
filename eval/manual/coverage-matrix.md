# Eval coverage matrix (manual loop)

| Agent | Tool / surface | Failure mode | Suite | Adversarial axis |
| --- | --- | --- | --- | --- |
| hello-world | prompt output | missing name or SDK mention | model | n/a |
| tool-calling | add | wrong args multiset | model | unexpected tool |
| tool-calling | word_count | unused on sum prompt | model | n/a |
| tool-calling | word_count | count not grounded in handler result | model | n/a |
| accessibility | scan_accessibility | missing scan call | model | n/a |
| accessibility | summary | rule IDs not cited | model | n/a |
| accessibility | local repair | no re-scan after edits / canonical fixture mutated | model | side-effect containment |
| sre | get_service_health | skipped investigation | model | n/a |
| sre | get_recent_deployments | skipped deploy correlation | model | n/a |
| sre | get_error_logs / get_alerts | missing evidence source | model | n/a |
| sre | read-only contract | claims applied changes | adversarial | prompt injection |
| sre | unknown service | fabricated health | adversarial | unknown service |
| sre | query_metrics | null treated as evidence | adversarial | decoy metric |
| migration | classifier | stale/missing misclassified | unit | git checkout mtime |
| migration | prompt builder | TS↔Python wording drift | unit | n/a |
| spec-drafter | search_repo_files / read_repo_file | invented file paths | unit | n/a |
| codebase-explainer | list_module_files / read_repo_file | invented module map | unit | n/a |
| pr-summarizer | read_pr_diff / list_changed_files | risky file not grounded | model | n/a |
| risk-classifier | score_changed_files | risk band not grounded | model | n/a |
| slack-bot | triage prompt | missing thread grounding | model | n/a |
| slack-bot | approval gate | side effect without approval | adversarial | prompt injection |
| sre | all handlers (Python) | TS↔Python output drift | unit | n/a |
| all | prompt builders | TS↔Python prompt drift (live exec) | unit | n/a |
| duplicate-ticket-detector | search_collisions | invented ticket ids | unit | n/a |
| type-error-explainer | parse_tsc_output | invented error codes | unit | n/a |
| test-coverage-agent | analyze_coverage_gap | invented line numbers | unit | n/a |
| test-presence-gate | check_test_presence | pass when tests missing | unit | n/a |
| flake-hunter | analyze_ci_runs | quarantine without flake rate | unit | n/a |
| release-notes-drafter | list_release_inputs | invented PR numbers | unit | n/a |
| adr-writer | load_design_context | invented ADR paths | unit | n/a |
| eval-trace-grader | grade_trace_grounding | pass on wrong tool order | unit | n/a |
| db-migration-drafter | read_schema_diff | apply SQL without --act | unit | n/a |
| scaffolding-agent | propose_scaffold | write files without --act | unit | n/a |
| bugbot | offline validator | missing BUGBOT findings | unit | n/a |
| security-reviewer | offline validator | missing threat findings | unit | n/a |
