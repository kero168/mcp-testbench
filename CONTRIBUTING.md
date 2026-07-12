# Contributing to mcp-testkit

Thanks for your interest! All contributions are welcome — bug reports,
feature requests, docs fixes, and code.

## Development setup

```bash
git clone https://github.com/kero168/mcp-testkit.git
cd mcp-testkit
npm ci
npm run build
npm test
```

Try the CLI against the bundled sample server:

```bash
node dist/cli.js run --config examples/sample-server/mcptest.config.yaml
```

## Guidelines

- Keep dependencies minimal — this is a CLI people run via `npx` in CI.
- New conformance checks need an ID (`Cxxx`), a clear title, and must never
  produce false failures against a spec-compliant server. When unsure,
  emit `warn` instead of `fail`.
- Add or update integration tests in `test/` for behavior changes.
- Run `npm run lint && npm test` before opening a PR.

## Reporting bugs

Please include: your OS, Node version, the server you tested (language/SDK),
and the full CLI output. If you can, reduce it to a minimal config.
