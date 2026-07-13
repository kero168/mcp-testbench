# Configuration reference

`mcp-testbench` reads `mcptest.config.yaml` from the current directory
(override with `--config path.yaml`). CLI flags override config values.

## Top level

```yaml
server:            # how to reach the server under test
  command: "..."   # stdio: full shell command
  url: "..."       # OR Streamable HTTP endpoint

suites: []         # your test cases (optional — conformance checks always run)
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

## CLI flags

| Flag | Description |
|---|---|
| `--server "<cmd>"` | stdio server command (overrides config) |
| `--url "<url>"` | Streamable HTTP endpoint (overrides config) |
| `--config <path>` | alternate config file |
| `--reporter pretty\|github\|json` | output format (default `pretty`) |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | all checks and suites passed |
| 1 | at least one failure |
