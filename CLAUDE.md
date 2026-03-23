# CLAUDE.md — cmem CLI

## What This Is

Standalone CLI for claude-mem persistent memory. Talks to the worker HTTP API on localhost:37777.

## Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict, ESM)
- **CLI:** Commander.js
- **Output:** chalk + cli-table3 (human), JSON (agent)
- **HTTP:** Built-in fetch (no axios)

## Build & Verify

After every code change:
```bash
bunx tsc --noEmit    # Zero type errors
bun test             # All tests pass
```

## Architecture

- **Thin HTTP client** — talks to worker, never reads SQLite/ChromaDB directly
- **Dual output** — human mode (TTY) vs agent mode (--json or piped)
- **Semantic exit codes** — 0=success, 1=API error, 2=connection, 3=validation, 4=not found, 5=internal
- **Input validation** — all user input validated before reaching worker API
- **Privacy** — `<private>` tags stripped from output (defense-in-depth)

## File Layout

See AGENTS.md for the complete module map.

## Conventions

- Every command exports `registerXCommand(program: Command)`
- Every command adds `--json` option
- Every command validates input → calls worker → formats output
- Error handling: try/catch with outputError + process.exit(code)
- Import paths use .js extension (ESM requirement)

## Testing

```bash
bun test                    # All tests
bun test tests/commands/    # Command tests only
```

Tests use bun:test. Never modify test expectations — fix the implementation.
