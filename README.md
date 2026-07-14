# mcp-testbench

> Test any MCP server, in any language, with one command.

[![CI](https://github.com/kero168/mcp-testbench/actions/workflows/ci.yml/badge.svg)](https://github.com/kero168/mcp-testbench/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mcp-testbench)](https://www.npmjs.com/package/mcp-testbench)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

There are **20,000+ MCP servers** in the wild — and no standard way to test one.
Unit test frameworks only see your own language. `mcp-testbench` connects to your
server **as a real MCP client** and verifies it over the protocol itself, so it
works with servers written in TypeScript, Python, Go, Rust, or anything else.

## Quick start

```bash
# Zero-install: point it at any stdio MCP server
npx mcp-testbench run --server "npx -y @modelcontextprotocol/server-everything"

# Or add it to your project
npm i -D mcp-testbench
npx mcp-testbench init     # creates mcptest.config.yaml
npx mcp-testbench run
```

## What it checks

**Built-in conformance checks** (no configuration needed):

| ID | Check |
|----|-------|
| C000 | Server starts and completes the MCP `initialize` handshake |
| C001 | Handshake exposes server name & version |
| C002 | Server declares capabilities |
| C010 | `tools/list` returns a valid tool list |
| C011 | Every tool has a meaningful description |
| C012 | Every tool declares an object-typed input JSON Schema |
| C013 | Tool names use safe characters |
| C020 | Missing required arguments are rejected gracefully |
| C030 | `resources/list` works when declared |
| C040 | `prompts/list` works when declared |

**Your own test cases**, written declaratively in YAML:

```yaml
# mcptest.config.yaml
server:
  command: "node dist/index.js"

suites:
  - name: search tool
    tool: search
    cases:
      - args: { query: "hello" }
        expect:
          ok: true
          result.contains: "hello"
      - args: {}
        expect:
          error: true    # missing required arg must fail cleanly
```

Supported expectations: `ok`, `error`, `result.contains`, `result.matches`
(regex), `result.equals`, `maxDurationMs`.

## Security & quality audit

`mcp-testbench audit` inspects any server's declared tools for security and
quality smells — entirely locally: no LLM, no network beyond your server.

```bash
npx mcp-testbench audit --server "node dist/index.js"
npx mcp-testbench audit --url "http://localhost:3000/mcp" --reporter json
```

| ID | Audit check | Severity |
|----|-------------|----------|
| A001 | Tool descriptions are substantive and free of injection-style wording ("ignore previous instructions", tool shadowing, "don't tell the user") | warn |
| A002 | Destructive / exec-capable tools (delete, exec, shell, ...) document confirmation or safety notes | warn |
| A003 | No unconstrained string arguments accepting arbitrary commands, paths, or URLs | info |
| A010 | No invisible or control Unicode characters hidden in tool/schema descriptions | error |

Findings are reported as warnings (exit code 0) so you can adopt the audit
incrementally; pass `--strict` to make any warning fail the run. Details and
rule rationale: [docs/audit.md](./docs/audit.md).

## Use it in CI

```yaml
# .github/workflows/mcp.yml
- run: npx mcp-testbench run --reporter github
```

The `github` reporter emits GitHub Actions annotations for every failure.
Exit code is `1` when any check fails, so your pipeline fails too.
A `json` reporter is available for any other CI system.

## Transports

| Transport | Config |
|-----------|--------|
| stdio | `server.command: "node dist/index.js"` |
| Streamable HTTP | `server.url: "http://localhost:3000/mcp"` |

## Why protocol-level testing?

Language-level unit tests can't catch what actually breaks MCP clients:
malformed tool schemas, missing capability declarations, crashes on invalid
arguments, or handshake regressions. `mcp-testbench` exercises exactly what a
real client (Claude, ChatGPT, Cursor, or any MCP host) will see.

## Roadmap

`mcp-testbench audit` shipped in v0.3.0. Next up (see [ROADMAP.md](./ROADMAP.md)):

- Declared-permissions vs. actual-behavior probes (e.g. a "read-only" tool
  that mutates state)
- Snapshot testing for tool outputs
- Coverage report (which tools have test cases)
- LLM-assisted semantic checks (opt-in, bring your own key)

## Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
The `examples/sample-server` directory contains a minimal server used by the
test suite; it doubles as a reference for trying the CLI locally.

## License

[MIT](./LICENSE)
