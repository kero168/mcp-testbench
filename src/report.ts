import pc from "picocolors";
import type { CheckResult, RunSummary } from "./types.js";

export function summarize(serverLabel: string, startedAt: number, checks: CheckResult[]): RunSummary {
  return {
    serverLabel,
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    checks,
    passed: checks.filter((c) => c.status === "pass").length,
    failed: checks.filter((c) => c.status === "fail").length,
    warned: checks.filter((c) => c.status === "warn").length,
    skipped: checks.filter((c) => c.status === "skip").length,
  };
}

const ICON: Record<CheckResult["status"], string> = {
  pass: pc.green("✓"),
  fail: pc.red("✗"),
  warn: pc.yellow("!"),
  skip: pc.dim("-"),
};

const SEVERITY_LABEL: Record<string, string> = {
  info: pc.cyan("[info]"),
  warn: pc.yellow("[warn]"),
  error: pc.red("[error]"),
};

function severityTag(c: CheckResult): string {
  if (!c.severity || (c.status !== "warn" && c.status !== "fail")) return "";
  return ` ${SEVERITY_LABEL[c.severity] ?? ""}`;
}

export function printPretty(summary: RunSummary): void {
  console.log();
  console.log(pc.bold(`mcp-testbench › ${summary.serverLabel}`));
  console.log();
  for (const c of summary.checks) {
    const dur = c.durationMs !== undefined ? pc.dim(` (${c.durationMs}ms)`) : "";
    console.log(`  ${ICON[c.status]} ${c.title}${severityTag(c)}${dur}`);
    if (c.detail && c.status !== "pass") {
      console.log(pc.dim(`      ${c.detail}`));
    }
  }
  console.log();
  const parts = [
    pc.green(`${summary.passed} passed`),
    summary.failed ? pc.red(`${summary.failed} failed`) : null,
    summary.warned ? pc.yellow(`${summary.warned} warnings`) : null,
    summary.skipped ? pc.dim(`${summary.skipped} skipped`) : null,
  ].filter(Boolean);
  console.log(`  ${parts.join(pc.dim(" · "))}  ${pc.dim(`${summary.durationMs}ms`)}`);
  console.log();
}

export function printJson(summary: RunSummary): void {
  console.log(JSON.stringify(summary, null, 2));
}

/** GitHub Actions annotations for failed/warning checks. Severity, when
 * present, picks the annotation level (error / warning / notice). */
export function printGithubAnnotations(summary: RunSummary): void {
  for (const c of summary.checks) {
    if (c.status !== "fail" && c.status !== "warn") continue;
    const level =
      c.severity === "error" ? "error"
      : c.severity === "warn" ? "warning"
      : c.severity === "info" ? "notice"
      : c.status === "fail" ? "error"
      : "warning";
    console.log(`::${level} title=mcp-testbench ${c.id}::${c.title}${c.detail ? ` — ${c.detail}` : ""}`);
  }
}
