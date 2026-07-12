# mcp-testkit

> Test any MCP server, in any language, with one command.

[![CI](https://github.com/kero168/mcp-testkit/actions/workflows/ci.yml/badge.svg)](https://github.com/kero168/mcp-testkit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mcp-testkit)](https://www.npmjs.com/package/mcp-testkit)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

There are **20,000+ MCP servers** in the wild — and no standard way to test one.
Unit test frameworks only see your own language. `mcp-testkit` connects to your
server **as a real MCP client** and verifies it over the protocol itself, so it
works with servers written in TypeScript, Python, Go, Rust, or anything else.

## Quick start

```bash
# Zero-install: point it at any stdio MCP server
npx mcp-testkit run --server "npx -y @modelcontextprotocol/server-everything"

# Or add it to your project
npm i -D mcp-testkit
npx mcp-testkit init     # creates mcptest.config.yaml
npx mcp-testkit run
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

## Use it in CI

```yaml
# .github/workflows/mcp.yml
- run: npx mcp-testkit run --reporter github
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
arguments, or handshake regressions. `mcp-testkit` exercises exactly what a
real client (Claude, ChatGPT, Cursor, or any MCP host) will see.

## Roadmap

- `mcp-testkit audit` — security & quality audit: tool-description linting,
  declared-permissions vs. actual-behavior probes
- Snapshot testing for tool outputs
- Coverage report (which tools have test cases)
- GitHub Action wrapper
- LLM-assisted semantic checks (opt-in, bring your own key)

## Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
The `examples/sample-server` directory contains a minimal server used by the
test suite; it doubles as a reference for trying the CLI locally.

## License

[MIT](./LICENSE)
