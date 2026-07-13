# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-14

### Added
- **Reusable GitHub Action** (`action.yml`) — run mcp-testbench in any workflow:
  `uses: kero168/mcp-testbench@v0.2.0`
- Japanese README (`README.ja.md`)
- Governance docs: `GOVERNANCE.md`, `MAINTAINERS.md`, `SUPPORT.md`,
  `CODE_OF_CONDUCT.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `CITATION.cff`
- Issue and PR templates; `docs/` (quickstart, config reference, Action guide)
- CodeQL and OpenSSF Scorecard workflows, Dependabot config
- Automated npm releases via GitHub Actions with OIDC trusted publishing and provenance

### Changed
- `commander` 12 → 15 (CLI flags and help output manually verified)
- `actions/checkout` v4 → v7, `actions/setup-node` v4 → v6 in CI

## [0.1.0] - 2026-07-12

### Added
- Initial release.
- MCP protocol-level test runner: connects to any stdio or Streamable HTTP MCP
  server as a real client.
- 10 built-in conformance checks (C000–C040): handshake, capabilities,
  tool schemas, error handling, resources, prompts.
- Declarative YAML test suites (`mcptest.config.yaml`) with expectations:
  `ok`, `error`, `result.contains`, `result.matches`, `result.equals`, `maxDurationMs`.
- `--timeout <ms>` per-call timeout flag.
- Reporters: `pretty` (default), `github` (Actions annotations), `json`.
- `init` command to scaffold a config.
- Example server (`examples/sample-server`) used by the test suite.

[0.2.0]: https://github.com/kero168/mcp-testbench/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kero168/mcp-testbench/releases/tag/v0.1.0
