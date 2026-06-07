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
  sre-agent/
    ts/       # canonical implementation
    python/   # Python port
```

Each example is independently runnable. Keep example-specific code inside its
language folder.

## Examples

| Example | What it demonstrates | TypeScript | Python |
| --- | --- | --- | --- |
| `hello-world` | Minimal Cursor SDK prompt | `examples/hello-world/ts` | `examples/hello-world/python` |
| `migration-agent` | Uses Cursor SDK to update TS-to-Python ports | `examples/migration-agent/ts` | `examples/migration-agent/python` |
| `tool-calling-agent` | Cursor SDK local agent with custom tools | `examples/tool-calling-agent/ts` | `examples/tool-calling-agent/python` |
| `sre-agent` | Incident triage agent with read-only observability tools | `examples/sre-agent/ts` | `examples/sre-agent/python` |

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
npm run sre-agent:ts -- "checkout-api returning 503 after deploy"
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
python3 examples/sre-agent/python/main.py "checkout-api returning 503 after deploy"
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