# Architecture

`mcp-testbench` is intentionally small. This document explains the moving
parts so contributors can find their way around in minutes.

```
             ┌───────────────┐
 CLI (src/cli.ts)             │  commander-based entry: run / init
             └──────┬────────┘
                    │
             ┌──────▼────────┐
             │ Config loader │  mcptest.config.yaml → typed Config
             └──────┬────────┘
                    │
             ┌──────▼────────┐
             │   Runner      │  orchestrates: connect → checks → suites
             └──┬───────┬────┘
                │       │
   ┌────────────▼──┐ ┌──▼─────────────┐
   │ Conformance   │ │ Suite executor │  user YAML cases → expectations
   │ checks (Cxxx) │ └──┬─────────────┘
   └────────────┬──┘    │
                │       │
             ┌──▼───────▼────┐
             │ MCP client    │  @modelcontextprotocol/sdk
             │ (stdio/HTTP)  │  connects to the server under test
             └──────┬────────┘
                    │
             ┌──────▼────────┐
             │  Reporters    │  pretty / github / json
             └───────────────┘
```

## Key design decisions

1. **Protocol-level, language-agnostic.** The server under test is a black
   box reached through a real MCP client (stdio or Streamable HTTP). This is
   what makes the tool useful for Python/Go/Rust servers, not just TypeScript.
2. **Checks are data.** Each conformance check has a stable ID (C000, C010…),
   a description, and a run function. New checks are added in one place and
   IDs are never reused — they are a public, documented contract.
3. **Expectations are declarative.** YAML in, results out. No user-written
   JavaScript required, which keeps suites portable and reviewable.
4. **Reporters are pluggable.** A reporter receives structured events; the
   `github` reporter maps failures to workflow annotations, `json` is for
   any other CI.
5. **No network calls except to the server under test.** No telemetry.

## Directory map

| Path | What lives here |
|---|---|
| `src/cli.ts` | CLI entry (`run`, `init`) |
| `src/` | Runner, checks, suite executor, reporters, config |
| `test/` | Vitest tests, run against `examples/sample-server` |
| `examples/sample-server` | Minimal reference MCP server used in tests |
| `action.yml` | Reusable GitHub Action wrapper |

## Adding a conformance check

1. Pick the next free ID in the right band (C0xx protocol, C01x tools, …).
2. Implement the check next to the existing ones.
3. Add a test in `test/` using the sample server (extend it if needed).
4. Document the check in the README table and CHANGELOG.
