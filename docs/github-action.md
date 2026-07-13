# GitHub Action

This repository ships a reusable composite action so any MCP server repo can
add protocol-level testing with four lines of YAML.

## Usage

```yaml
- uses: kero168/mcp-testbench@main        # pin to a tag once v0.2 is released
  with:
    server: "node dist/index.js"          # or use `url:` for HTTP servers
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `server` | no | — | stdio command of the server under test |
| `url` | no | — | Streamable HTTP endpoint (overrides `server`) |
| `config` | no | — | path to `mcptest.config.yaml` |
| `version` | no | `latest` | mcp-testbench version to run |

If neither `server` nor `url` is given, the action expects a
`mcptest.config.yaml` in the working directory.

## What you get

- All built-in conformance checks (C000–C040) plus your YAML suites
- Failures surface as **GitHub annotations** on the PR
- Non-zero exit code fails the job

## Full example

```yaml
name: MCP conformance
on: [push, pull_request]
jobs:
  mcp:
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
