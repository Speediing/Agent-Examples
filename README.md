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

Each recipe teaches one agent pattern by walking through the code you would
write to build it yourself. Start with the TypeScript version because it is the
canonical implementation, then compare the Python port when you want to see the
same idea in another SDK.

Read each recipe in this order:

1. Read the introduction to understand the agent job.
2. Check what you will learn and the prerequisites.
3. Read the build steps: input boundary, prompt contract, SDK call, local
   tools or audit code, and verification.
4. Run the command once with the default prompt or sample input.
5. Read the entrypoint to see what stays deterministic local code and what is
   sent to Cursor.
6. Make one narrow change, then run the TypeScript and Python versions with the
   same input.

## Recipes

| Example | What it demonstrates | TypeScript | Python |
| --- | --- | --- | --- |
| `hello-world` | Minimal Cursor SDK prompt | `examples/hello-world/ts` | `examples/hello-world/python` |
| `migration-agent` | Uses Cursor SDK to update TS-to-Python ports | `examples/migration-agent/ts` | `examples/migration-agent/python` |
| `tool-calling-agent` | Cursor SDK local agent with custom tools | `examples/tool-calling-agent/ts` | `examples/tool-calling-agent/python` |

### `hello-world`

Build the smallest useful SDK loop yourself: command-line input, prompt
contract, SDK options, and script-friendly output.

What you will learn:

- How to structure an agent entrypoint around input, prompt, SDK options, and
  output.
- How to write a prompt contract that names the role, task, and output
  constraint.
- How to adapt the starter loop to your own use case before adding tools.

Prerequisites:

- `npm install` and `npm run build`
- `CURSOR_API_KEY` and `CURSOR_MODEL` exported in your shell

Build it:

1. Decide the agent job in one sentence.
2. Read command-line input with `process.argv`.
3. Build a prompt from short ordered instructions.
4. Call `Agent.prompt` with `CURSOR_API_KEY`, `CURSOR_MODEL`, and `local.cwd`.
5. Print `result.result` and keep setup errors readable.
6. Replace the greeting prompt with your own prompt-first workflow.

Run it:

```sh
npm run hello-world:ts -- "Ada"
python3 examples/hello-world/python/main.py "Ada"
```

Takeaway: this recipe gives you the skeleton for any prompt-first local agent.
Keep the skeleton and replace the prompt contract with your own workflow.

### `tool-calling-agent`

Build an agent that plans with Cursor but delegates facts, validation, and side
effects to local tools.

What you will learn:

- How to decide which parts of the workflow belong in tools instead of the
  prompt.
- How to define a custom tool with a description, JSON schema, and execute
  handler.
- How to validate SDK JSON arguments before local code acts on them.

Prerequisites:

- The `hello-world` recipe runs successfully.
- `npm run build`
- One deterministic operation you want your own agent to perform locally.

Build it:

1. Choose what the model should not guess.
2. Write a tool description that tells Cursor when the tool is useful.
3. Define a narrow JSON schema for the tool input.
4. Validate SDK JSON values inside the handler.
5. Return structured data, not a polished sentence.
6. Attach the tools under `local.customTools` in `Agent.prompt`.

Run it:

```sh
npm run tool-calling:ts -- "add 3 and 9"
python3 examples/tool-calling-agent/python/main.py "add 3 and 9"
```

Adapt it by replacing `add` with a project-specific helper, such as reading
package metadata, checking a schema, querying an internal API, or running a
narrow repository audit.

### `migration-agent`

Build a two-phase maintenance agent: deterministic local audit first, focused
Cursor repair second.

What you will learn:

- How to model an agent workflow as deterministic audit plus agentic repair.
- How to encode source-of-truth ownership in package metadata.
- How to give Cursor a focused repair prompt instead of asking it to rediscover
  everything.

Prerequisites:

- `npm install` and `npm run build`
- `cursorExample.pythonPort` metadata in each TypeScript package
- SDK credentials only for the repair step, not the audit

Build it:

1. Split the workflow into audit, repair, and verification phases.
2. Declare the source-of-truth contract in `cursorExample.pythonPort`.
3. Build a local scanner that validates package metadata.
4. Classify repository state into `ok`, `missing`, `stale`, and `error`.
5. Filter actionable results before calling Cursor.
6. Send Cursor the narrow repair brief and the local repository boundary.

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
Reuse the shape for generated clients, docs pages, design-system examples, or
configuration drift checks.

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