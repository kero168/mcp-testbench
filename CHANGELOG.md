# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Japanese README (`README.ja.md`)
- Governance docs: `GOVERNANCE.md`, `MAINTAINERS.md`, `SUPPORT.md`,
  `CODE_OF_CONDUCT.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `CITATION.cff`
- Issue and PR templates
- Reusable GitHub Action (`action.yml`) — run mcp-testbench in any workflow
- CodeQL and OpenSSF Scorecard workflows, Dependabot config

## [0.1.0] - 2026-07-12

### Added
- Initial release.
- MCP protocol-level test runner: connects to any stdio or Streamable HTTP MCP
  server as a real client.
- 10 built-in conformance checks (C000–C040): handshake, capabilities,
  tool schemas, error handling, resources, prompts.
- Declarative YAML test suites (`mcptest.config.yaml`) with expectations:
  `ok`, `error`, `result.contains`, `result.matches`, `result.equals`, `maxDurationMs`.
- Reporters: `pretty` (default), `github` (Actions annotations), `json`.
- `init` command to scaffold a config.
- Example server (`examples/sample-server`) used by the test suite.

[Unreleased]: https://github.com/kero168/mcp-testbench/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kero168/mcp-testbench/releases/tag/v0.1.0
