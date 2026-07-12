import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
import type { TestkitConfig } from "./types.js";

export const DEFAULT_CONFIG_FILES = [
  "mcptest.config.yaml",
  "mcptest.config.yml",
  ".mcptest.yaml",
];

export function loadConfig(path?: string): { config: TestkitConfig; path: string } {
  const candidate = path ?? DEFAULT_CONFIG_FILES.find((f) => existsSync(f));
  if (!candidate || !existsSync(candidate)) {
    throw new Error(
      `Config file not found. Create one with \`mcp-testkit init\` or pass --config <file>.`,
    );
  }
  const raw = readFileSync(candidate, "utf8");
  const config = parse(raw) as TestkitConfig;
  validateConfig(config, candidate);
  return { config, path: candidate };
}

export function validateConfig(config: TestkitConfig, source: string): void {
  if (!config || typeof config !== "object") {
    throw new Error(`${source}: config is empty or not a mapping`);
  }
  if (!config.server || (!config.server.command && !config.server.url)) {
    throw new Error(`${source}: server.command or server.url is required`);
  }
  if (config.server.command && config.server.url) {
    throw new Error(`${source}: server.command and server.url are mutually exclusive`);
  }
  for (const suite of config.suites ?? []) {
    if (!suite.name) throw new Error(`${source}: every suite needs a name`);
    if (!suite.tool) throw new Error(`${source}: suite "${suite.name}" needs a tool`);
    if (!Array.isArray(suite.cases) || suite.cases.length === 0) {
      throw new Error(`${source}: suite "${suite.name}" needs at least one case`);
    }
  }
}

export const INIT_TEMPLATE = `# mcp-testkit configuration
# Docs: https://github.com/kero168/mcp-testkit
server:
  # Command that starts your MCP server over stdio:
  command: "node dist/index.js"
  # ...or test a running Streamable HTTP server instead:
  # url: "http://localhost:3000/mcp"

# Built-in protocol conformance checks (handshake, schemas, error handling)
conformance:
  enabled: true

# Your own test cases against specific tools
suites: []
#  - name: search returns results
#    tool: search
#    cases:
#      - args: { query: "hello" }
#        expect:
#          ok: true
#          result.contains: "hello"
#      - args: {}
#        expect:
#          error: true   # missing required arg should fail cleanly
`;
