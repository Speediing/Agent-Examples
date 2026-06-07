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

## How to use these guides

Each example is a small agent teammate with a specific job. Start with the
TypeScript version because it is the canonical implementation, then compare the
Python port when you want to see the same idea in another SDK.

Read each guide in this order:

1. Understand the teammate's job and why an agent helps.
2. Run the command once with the default prompt or sample input.
3. Read the entrypoint to see what is deterministic local code and what is sent
   to Cursor.
4. Make one narrow change, then run the TypeScript and Python versions with the
   same input.

## Example guides

| Example | What it demonstrates | TypeScript | Python |
| --- | --- | --- | --- |
| `hello-world` | Minimal Cursor SDK prompt | `examples/hello-world/ts` | `examples/hello-world/python` |
| `migration-agent` | Uses Cursor SDK to update TS-to-Python ports | `examples/migration-agent/ts` | `examples/migration-agent/python` |
| `tool-calling-agent` | Cursor SDK local agent with custom tools | `examples/tool-calling-agent/ts` | `examples/tool-calling-agent/python` |

### `hello-world`

This is the smallest useful SDK loop. It reads a name from the command line,
builds a short prompt, calls `Agent.prompt`, and prints the model response.

Why it helps:

- It verifies credentials, model selection, and local working directory setup.
- It keeps the prompt visible, so readers can see exactly what Cursor receives.
- It gives you a safe place to change tone, instructions, and output shape
  before adding tools or file edits.

Code flow:

1. Read `process.argv` or `sys.argv`.
2. Build the prompt from short, ordered instructions.
3. Pass `CURSOR_API_KEY`, `CURSOR_MODEL`, and the repository `cwd` into the SDK.
4. Print `result.result`.

Run it:

```sh
npm run hello-world:ts -- "Ada"
python3 examples/hello-world/python/main.py "Ada"
```

### `tool-calling-agent`

This guide shows how to give Cursor deterministic local helpers. The agent can
decide when a tool is relevant, but the calculation still happens in code you
own.

Why it helps:

- Prompts handle intent and explanation.
- Tools handle facts, validation, and side effects.
- Structured tool results make the final answer easier to check.

Code flow:

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

This guide turns a maintenance problem into a repeatable agent workflow. The
TypeScript example is the source of truth, and the Python port should stay
aligned with it.

Why it helps:

- The default audit is deterministic and safe to run without credentials.
- The package metadata creates a clear link from each TypeScript example to its
  Python port.
- Cursor is only called after local code identifies stale or missing ports.

Code flow:

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