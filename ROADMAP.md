# Roadmap

This is the public roadmap for `mcp-testbench`. It is re-evaluated after every
minor release based on user feedback. Items are ordered by priority.

## Now (v0.2)

- **GitHub Action wrapper** (`action.yml` in this repo) —
  `uses: kero168/mcp-testbench@v0.2` runs conformance checks + your suites in
  CI with zero setup.
- **`--timeout` and `--filter` CLI flags** — control per-check timeout and run
  a subset of checks/suites. Good first issues.
- **JUnit XML reporter** — GitLab CI / Jenkins / CircleCI compatibility.

## Next (v0.3)

- **`mcp-testbench audit`** — security & quality audit: tool-description
  linting, dangerous-name detection, declared-permissions vs. actual-behavior
  probes (e.g., a "read-only" tool that mutates state).
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
