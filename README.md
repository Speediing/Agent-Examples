# Cursor SDK Agent Examples

TypeScript-first examples for building Cursor SDK agents, with matching Python
Cursor SDK ports for each agent. The TypeScript implementation is the source of
truth; Python ports are kept in sync from the TypeScript examples.

## Repository layout

```txt
examples/
  hello-world/
    ts/       # canonical implementation
    python/   # Python port
  migration-agent/
    ts/       # canonical implementation
    python/   # Python port
  tool-calling-agent/
    ts/       # canonical implementation
    python/   # Python port
```

Each example is independently runnable. Keep example-specific code inside its
language folder.

## How to use this cookbook

Each recipe builds one agent pattern from a runnable example. Start with the
TypeScript version because it is the canonical implementation, then compare the
Python port when you want to see the same idea in another SDK.

Read each recipe in this order:

1. Read the introduction to understand the agent job.
2. Check what you will learn and the prerequisites.
3. Run the command once with the default prompt or sample input.
4. Read the entrypoint to see what stays deterministic local code and what is
   sent to Cursor.
5. Make one narrow change, then run the TypeScript and Python versions with the
   same input.

## Recipes

| Example | What it demonstrates | TypeScript | Python |
| --- | --- | --- | --- |
| `hello-world` | Minimal Cursor SDK prompt | `examples/hello-world/ts` | `examples/hello-world/python` |
| `migration-agent` | Uses Cursor SDK to update TS-to-Python ports | `examples/migration-agent/ts` | `examples/migration-agent/python` |
| `tool-calling-agent` | Cursor SDK local agent with custom tools | `examples/tool-calling-agent/ts` | `examples/tool-calling-agent/python` |

### `hello-world`

Build the smallest useful SDK loop: collect command-line input, call
`Agent.prompt`, and print the model response.

What you will learn:

- How to call `Agent.prompt` from a local script.
- Why the working directory is still part of the agent context.
- How to keep setup failures readable when credentials are missing.

Prerequisites:

- `npm install` and `npm run build`
- `CURSOR_API_KEY` and `CURSOR_MODEL` exported in your shell

Recipe:

1. Run the TypeScript example.
2. Read the prompt construction in `examples/hello-world/ts/src/index.ts`.
3. Change one instruction, such as tone or output shape.
4. Run the Python port with the same input and compare the behavior.

Run it:

```sh
npm run hello-world:ts -- "Ada"
python3 examples/hello-world/python/main.py "Ada"
```

Takeaway: this recipe is your setup check. If it works, the same SDK loop can
carry tools, repository reads, and longer tasks.

### `tool-calling-agent`

Give Cursor deterministic local helpers. The agent decides when a tool is
relevant, but the calculation still happens in code you own.

What you will learn:

- How to register local custom tools with the Cursor SDK.
- Why tool descriptions and JSON schemas shape tool selection.
- How to validate SDK JSON arguments before running deterministic code.

Prerequisites:

- The `hello-world` recipe runs successfully.
- `npm run build`
- A request that clearly maps to a tool, such as `add 3 and 9`

Recipe:

1. Read the user request from the command line.
2. Register `add` and `word_count` as `customTools`.
3. Define each tool with a description, JSON input schema, and execute function.
4. Let Cursor choose the tool, receive the local result, and write the final
   answer.

Run it:

```sh
npm run tool-calling:ts -- "add 3 and 9"
python3 examples/tool-calling-agent/python/main.py "add 3 and 9"
```

Extend it by replacing `add` with a project-specific helper, such as reading
package metadata, checking a schema, or running a narrow repository audit.

### `migration-agent`

Turn a maintenance problem into a repeatable agent workflow. TypeScript is the
source of truth, and Python ports should stay aligned with it.

What you will learn:

- How to encode source-of-truth ownership in package metadata.
- Why deterministic audits should run before agentic repair.
- How to pass a focused set of stale or missing ports to Cursor.

Prerequisites:

- `npm install` and `npm run build`
- `cursorExample.pythonPort` metadata in each TypeScript package
- SDK credentials only for the repair step, not the audit

Recipe:

1. List every directory under `examples/`.
2. Read each `ts/package.json`.
3. Use `cursorExample.pythonPort` to locate the Python port.
4. Compare TypeScript source timestamps with the Python file timestamp.
5. Optionally send only stale or missing ports to Cursor for repair.

Run the local audit:

```sh
npm run migrate:python-ports
python3 examples/migration-agent/python/main.py
```

Ask Cursor to repair stale or missing ports:

```sh
CURSOR_API_KEY=... CURSOR_MODEL=... npm run migrate:python-ports -- --use-cursor-sdk
CURSOR_API_KEY=... CURSOR_MODEL=... python3 examples/migration-agent/python/main.py --use-cursor-sdk
```

Takeaway: local code finds the facts, then Cursor edits from a narrow brief.
That keeps the repair loop focused and reviewable.

## Setup

### TypeScript

```sh
npm install
npm run build
```

Set SDK credentials before running SDK-backed examples:

```sh
export CURSOR_API_KEY=...
export CURSOR_MODEL=...
```

Run an example:

```sh
npm run hello-world:ts -- "Ada"
npm run migration-agent:ts
npm run tool-calling:ts -- "add 3 and 9"
```

### Python

Install the Python Cursor SDK:

```sh
python3 -m pip install -r requirements.txt
```

Run an example:

```sh
python3 examples/hello-world/python/main.py "Ada"
python3 examples/migration-agent/python/main.py
python3 examples/tool-calling-agent/python/main.py "add 3 and 9"
```

## TypeScript-to-Python porting flow

1. Implement or update the TypeScript version first.
2. Run the migration check:

   ```sh
   npm run migrate:python-ports
   ```

3. If the script reports a stale or missing Python port, update the Python
   version to match the TypeScript behavior.
4. Re-run the TypeScript and Python examples with the same inputs and compare
   their outputs.

The Migration Agent intentionally does not treat Python as a second source of
truth. It reads the TypeScript example manifests and source timestamps, then
reports which Python ports need attention. If a Python port is missing, you can
ask it to create a placeholder:

```sh
npm run migrate:python-ports -- --write-stubs
```

The Migration Agent can also ask Cursor SDK to update stale or missing Python
ports:

```sh
CURSOR_API_KEY=... CURSOR_MODEL=... npm run migrate:python-ports -- --use-cursor-sdk
CURSOR_API_KEY=... CURSOR_MODEL=... python3 examples/migration-agent/python/main.py --use-cursor-sdk
```

By default, the command only runs the local audit, so it is safe to use without
a Cursor API key.

## Adding a new example

Use this shape:

```txt
examples/<example-name>/
  ts/
    package.json
    src/index.ts
  python/
    main.py
```

The TypeScript `package.json` must include:

```json
{
  "cursorExample": {
    "pythonPort": "../python/main.py"
  }
}
```

That metadata lets `npm run migrate:python-ports` find and validate the Python
port.