# Roadmap

This is the public roadmap for `mcp-testbench`. It is re-evaluated after every
minor release based on user feedback. Items are ordered by priority.

## Now (v0.3)

- **`mcp-testbench audit`** — shipped in v0.3.0: local security & quality
  audit (rules A001–A010): tool-description linting, dangerous-tool detection,
  over-permissive schema signals, hidden-Unicode prompt-injection surface.
  All analysis is local; no LLM required. See [docs/audit.md](./docs/audit.md).
- **`--filter` CLI flag** — run a subset of checks/suites. Good first issue.
- **JUnit XML reporter** — GitLab CI / Jenkins / CircleCI compatibility.

## Next (v0.4)

- **Declared-permissions vs. actual-behavior probes** — extends `audit` with
  opt-in dynamic probes (e.g., a "read-only" tool that mutates state).
- **Snapshot testing** for tool outputs (`expect: snapshot`).
- **Coverage report** — which declared tools have test cases.

## Later

- **LLM-assisted semantic checks** (opt-in, bring-your-own-key,
  provider-swappable; never required for core functionality).
- **SSE / legacy transport support** for older servers.
- **Registry integration** — run the bench against a server listed in an MCP
  registry entry with one command.
- **Windows/macOS/Linux install-matrix CI** and provenance-signed releases.

## Non-goals

- Not a general-purpose unit test framework — it tests the MCP boundary only.
- Not an MCP server framework or SDK.
- No telemetry: `mcp-testbench` never phones home. All execution is local.

Have a use case that is not covered? [Open an issue](https://github.com/kero168/mcp-testbench/issues/new/choose).
