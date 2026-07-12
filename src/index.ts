export { loadConfig, validateConfig } from "./config.js";
export { connect, splitCommand } from "./connect.js";
export { runConformance } from "./conformance.js";
export { runSuites } from "./runner.js";
export { summarize } from "./report.js";
export type {
  TestkitConfig,
  ServerConfig,
  ConformanceConfig,
  SuiteConfig,
  CaseConfig,
  ExpectConfig,
  CheckResult,
  CheckStatus,
  RunSummary,
} from "./types.js";
