# Configuration reference

`mcp-testbench` reads `mcptest.config.yaml` from the current directory
(override with `--config path.yaml`). CLI flags override config values.

## Top level

```yaml
server:            # how to reach the server under test
  command: "..."   # stdio: full shell command
  url: "..."       # OR Streamable HTTP endpoint

suites: []         # your test cases (optional — conformance checks always run)

audit:             # used by `mcp-testbench audit` (optional)
  skip: []         # audit rule ids to skip, e.g. ["A003"]
```

## `server`

| Key | Type | Description |
|---|---|---|
| `command` | string | stdio transport. The command is spawned and spoken to over stdin/stdout. |
| `url` | string | Streamable HTTP transport. Takes precedence over `command` if both set. |

## `suites[]`

| Key | Type | Description |
|---|---|---|
| `name` | string | Label shown in reports |
| `tool` | string | Tool name to call for every case in this suite |
| `cases[]` | list | Individual calls |

## `cases[]`

| Key | Type | Description |
|---|---|---|
| `args` | object | Arguments passed to the tool |
| `expect` | object | Expectations (below). All listed expectations must hold. |

## Expectations

| Keyword | Meaning |
|---|---|
| `ok: true` | Call must succeed (no protocol error, `isError` not set) |
| `error: true` | Call must fail gracefully (a proper MCP error — not a crash) |
| `result.contains: "str"` | Text content includes the substring |
| `result.matches: "regex"` | Text content matches the regular expression |
| `result.equals: "str"` | Text content equals the string exactly |
| `maxDurationMs: 2000` | Call completes within the given milliseconds |

## `audit`

Used by the `audit` subcommand — see [audit.md](./audit.md).

| Key | Type | Description |
|---|---|---|
| `skip` | string[] | Audit rule ids to skip, e.g. `["A003"]` |

## CLI flags

Shared by `run` and `audit`:

| Flag | Description |
|---|---|
| `--server "<cmd>"` | stdio server command (overrides config) |
| `--url "<url>"` | Streamable HTTP endpoint (overrides config) |
| `--config <path>` | alternate config file |
| `--reporter pretty\|github\|json` | output format (default `pretty`) |
| `--timeout <ms>` | per-call timeout (default 15000) |
| `--strict` | `audit` only: exit 1 when any audit check warns |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | all checks and suites passed (warnings do not fail the run) |
| 1 | at least one failure, or a warning under `audit --strict` |
