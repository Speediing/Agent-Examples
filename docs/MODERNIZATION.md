# Agent Examples — modernization examples

Runnable cloud-agent recipes for the [Modernization Cookbook](https://github.com/Speediing/agent-example-site).

## Quick commands

| Stage | Command | Example path |
| --- | --- | --- |
| Discover | `npm run inventory:ts -- <owner>/<repo>` | `examples/hello-world` |
| Assess | `npm run assess:ts -- <owner>/<repo>` | `examples/score-modernization-risk` |
| Plan | `npm run plan:ts -- <owner>/<repo>` | `examples/plan-modernization-waves` |
| Transform | `npm run transform:net:ts -- <owner>/<repo>` | `examples/upgrade-net-framework` |
| Verify | `npm run cover:ts -- <owner>/<repo> <file>` | `examples/cover-before-refactor` |
| Cutover | `npm run cutover:ts -- <owner>/<repo>` | `examples/strangler-cutover` |

See root `package.json` for the full script list. Each example imports `@cursor-examples/modernization-core` for the shared cloud submit helper.

## Agent skills

Portable workflows live in `.cursor/skills/modernization-*`. Copy them into your own repo or browse them on the cookbook site at `/skills`.

## Workbench

The companion site ships a Next.js workbench at `/workbench` that calls the same prompts through API routes — deploy on Vercel with `CURSOR_API_KEY` and `CURSOR_MODEL` set.
