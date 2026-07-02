---
name: modernization-net-transform
description: Upgrade .NET Framework projects to .NET 8 with a cloud agent build loop. Use for net48 → net8.0 migrations.
---

# .NET framework upgrade

Loop dotnet build and dotnet test until green, then open an upgrade PR.

## Workflow

1. Cover critical modules first when tests are missing.
2. Run `npm run transform:net:ts -- <owner>/<repo>`.
3. Review every .csproj diff and failing-test fixes.
4. Run Bugbot on the PR before merge.

## Guardrails

- Never disable failing tests to green the build.
- Stop when dotnet test exits zero.
## Command

`npm run transform:net:ts -- <owner>/<repo>`

## Site guide

/upgrade-net-framework on the modernization cookbook.
