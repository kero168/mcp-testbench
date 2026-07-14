# Security & quality audit (`mcp-testbench audit`)

`mcp-testbench audit` connects to your MCP server as a real client, reads its
declared tools (`tools/list`), and lints them for security and quality smells.

Everything runs **locally and statically**: no LLM, no telemetry, no network
traffic beyond the connection to your own server. No tool is ever called.

## Usage

```bash
# stdio server
npx mcp-testbench audit --server "node dist/index.js"

# Streamable HTTP server
npx mcp-testbench audit --url "http://localhost:3000/mcp"

# or reuse your mcptest.config.yaml
npx mcp-testbench audit --config mcptest.config.yaml
```

Flags: `--reporter pretty|json|github` (default `pretty`), `--timeout <ms>`
(default 15000), `--strict` (see below).

## Rules

| ID | Rule | Severity |
|----|------|----------|
| A000 | Server starts and completes the MCP `initialize` handshake | — |
| A001 | Tool descriptions are substantive and free of injection-style wording | warn |
| A002 | Destructive or exec-capable tools document confirmation/safety | warn |
| A003 | No unconstrained string arguments accepting arbitrary commands, paths, or URLs | info |
| A010 | No invisible or control Unicode characters in tool/schema descriptions | error |

### A001 — tool description lint

Flags descriptions that are:

- **too short** (fewer than 10 characters after trimming) — a real client
  cannot pick the right tool from a description like `"ok"`;
- **injection-style** — wording that tries to steer the model rather than
  describe the tool, e.g. "ignore previous instructions", "new instructions:",
  "do not tell the user", "always use this tool", "before calling any other
  tool", or embedded `<system>` markup.

### A002 — dangerous tools without confirmation language

A tool is considered dangerous when its **name** matches delete/exec/shell-style
patterns (`delete`, `rm`, `drop`, `wipe`, `exec`, `eval`, `shell`, `sudo`, ...)
or its **description** advertises destructive behavior or command/code
execution. Dangerous tools should say so: the rule warns when the description
contains no confirmation or safety language ("asks the user to confirm",
"irreversible", "destructive", "dry-run", ...).

### A003 — over-permissive schema signals

Enumerates top-level `string` arguments whose names signal over-broad input —
`command`/`cmd`/`script`/`sql` (arbitrary code), `path`/`file`/`directory`
(arbitrary filesystem access), `url`/`endpoint`/`host` (arbitrary network
targets) — and that declare **no constraint** (`enum`, `const`, or `pattern`).
This is an informational signal: such arguments are sometimes legitimate, but
they are the classic shape of an over-permissioned tool.

### A010 — prompt-injection surface: hidden Unicode

Scans every tool description **and every `description` string nested in the
input schema** for characters that are invisible to human reviewers but visible
to models: C0/C1 control characters, zero-width characters, bidi controls,
word joiners, BOM, soft hyphens, and Unicode tag characters (U+E0000-U+E007F).
These are the primary carrier for hidden prompt-injection payloads, hence
severity `error`. Emoji building blocks (ZWJ, variation selectors) are excluded
to avoid false positives.

## Severity model and exit codes

Audit findings are reported with status `warn` (warn-centric by design) plus a
`severity` classification: `info`, `warn`, or `error`. Reporters render it:

- `pretty` shows a `[info]`/`[warn]`/`[error]` label per finding;
- `json` includes a `severity` field on each check;
- `github` maps severity to `::notice`/`::warning`/`::error` annotations.

| Situation | Exit code |
|---|---|
| No findings | 0 |
| Findings (warnings) | 0 |
| Findings with `--strict` | 1 |
| Connection or `tools/list` failure | 1 |

## Skipping rules

```yaml
# mcptest.config.yaml
audit:
  skip: ["A003"]
```

## Try it

The bundled sample server has an opt-in unsafe mode that trips every rule:

```bash
SAMPLE_SERVER_UNSAFE=1 npx mcp-testbench audit \
  --server "node examples/sample-server/server.mjs"
```

## Scope

The audit inspects what the server **declares** — it does not call tools or
observe behavior. Declared-permissions vs. actual-behavior probes are on the
[roadmap](../ROADMAP.md). A clean audit is a hygiene signal, not a security
certification.
