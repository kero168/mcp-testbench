export { loadConfig, validateConfig } from "./config.js";
export { connect, splitCommand } from "./connect.js";
export { runConformance } from "./conformance.js";
export { runAudit } from "./audit.js";
export { runSuites } from "./runner.js";
export { summarize } from "./report.js";
export type {
  TestkitConfig,
  ServerConfig,
  ConformanceConfig,
  AuditConfig,
  SuiteConfig,
  CaseConfig,
  ExpectConfig,
  CheckResult,
  CheckStatus,
  CheckSeverity,
  RunSummary,
} from "./types.js";
