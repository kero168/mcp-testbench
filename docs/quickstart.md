# 5-minute quick start

Goal: run your first protocol-level test against a real MCP server in under
5 minutes.

## 1. Run against a public sample server (no install)

```bash
npx mcp-testbench run --server "npx -y @modelcontextprotocol/server-everything"
```

You should see the built-in conformance checks (C000–C040) execute and pass.

## 2. Point it at YOUR server

stdio server:

```bash
npx mcp-testbench run --server "node dist/index.js"
# or: --server "python -m my_mcp_server"   (any language works)
```

Streamable HTTP server:

```bash
npx mcp-testbench run --url "http://localhost:3000/mcp"
```

## 3. Add your own test cases

```bash
npm i -D mcp-testbench
npx mcp-testbench init          # writes mcptest.config.yaml
```

Edit `mcptest.config.yaml`:

```yaml
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
          error: true
```

Run it:

```bash
npx mcp-testbench run
```

## 4. Put it in CI

```yaml
# .github/workflows/mcp.yml
name: MCP conformance
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npm run build
      - uses: kero168/mcp-testbench@main
        with:
          server: "node dist/index.js"
```

Done. Every push now verifies your server exactly the way a real MCP client
(Claude, ChatGPT, Cursor, …) will see it.

## 5. Audit it (optional)

```bash
npx mcp-testbench audit --server "node dist/index.js"
```

Four local security checks (A001–A010) lint your tool descriptions and schemas
for prompt-injection surface, dangerous tools without confirmation notes, and
over-broad string arguments. No LLM, no network. See [audit.md](./audit.md).

## Troubleshooting

- **C000 fails / hangs**: your server may be writing logs to stdout. MCP stdio
  servers must keep stdout strictly for protocol JSON — send logs to stderr.
- **Command not found**: `npx mcp-testbench` requires Node.js ≥ 20.
- Something else? [Open an issue](https://github.com/kero168/mcp-testbench/issues/new/choose).
