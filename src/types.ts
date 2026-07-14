/** Configuration file schema (mcptest.config.yaml) */
export interface TestkitConfig {
  server: ServerConfig;
  /** Built-in conformance checks. Default: all enabled. */
  conformance?: ConformanceConfig;
  /** Security & quality audit checks (`mcp-testbench audit`). */
  audit?: AuditConfig;
  suites?: SuiteConfig[];
  /** Global timeout for a single tool call, ms. Default 15000. */
  timeoutMs?: number;
}

export interface ServerConfig {
  /** Command line to launch a stdio server, e.g. "node dist/index.js" */
  command?: string;
  /** Extra args (optional, can also be embedded in command) */
  args?: string[];
  /** Environment variables passed to the server process */
  env?: Record<string, string>;
  /** URL of a Streamable HTTP server (mutually exclusive with command) */
  url?: string;
  transport?: "stdio" | "http";
}

export interface ConformanceConfig {
  enabled?: boolean;
  /** Skip specific rule ids */
  skip?: string[];
}

export interface AuditConfig {
  /** Skip specific audit rule ids (e.g. ["A003"]) */
  skip?: string[];
}

export interface SuiteConfig {
  name: string;
  /** Tool to exercise in this suite */
  tool: string;
  cases: CaseConfig[];
}

export interface CaseConfig {
  name?: string;
  args: Record<string, unknown>;
  expect?: ExpectConfig;
}

export interface ExpectConfig {
  /** Expect the call to succeed (isError !== true). Default true unless `error` is set. */
  ok?: boolean;
  /** Expect the call to fail with a tool error or protocol error */
  error?: boolean;
  /** Substring that must appear in the concatenated text content */
  "result.contains"?: string;
  /** Regex (string) the text content must match */
  "result.matches"?: string;
  /** Exact match for the full text content */
  "result.equals"?: string;
  /** Maximum duration in ms */
  maxDurationMs?: number;
}

/** Results */
export type CheckStatus = "pass" | "fail" | "skip" | "warn";

/** Impact classification for audit findings (audit checks are warn-centric). */
export type CheckSeverity = "info" | "warn" | "error";

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  /** Severity of the finding (set by audit checks; reporters render it). */
  severity?: CheckSeverity;
  detail?: string;
  durationMs?: number;
}

export interface RunSummary {
  serverLabel: string;
  startedAt: string;
  durationMs: number;
  checks: CheckResult[];
  passed: number;
  failed: number;
  warned: number;
  skipped: number;
}
