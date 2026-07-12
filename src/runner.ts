import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CaseConfig, CheckResult, SuiteConfig } from "./types.js";
import { withTimeout } from "./connect.js";

interface CallOutcome {
  errored: boolean;
  text: string;
  durationMs: number;
  raw?: unknown;
  protocolError?: string;
}

async function callTool(
  client: Client,
  tool: string,
  args: Record<string, unknown>,
  timeoutMs: number,
): Promise<CallOutcome> {
  const t0 = Date.now();
  try {
    const res = await withTimeout(
      client.callTool({ name: tool, arguments: args }),
      timeoutMs,
      `tools/call ${tool}`,
    );
    const content = Array.isArray(res.content) ? res.content : [];
    const text = content
      .map((c: { type?: string; text?: string }) => (c.type === "text" ? (c.text ?? "") : ""))
      .join("\n");
    return { errored: res.isError === true, text, durationMs: Date.now() - t0, raw: res };
  } catch (e) {
    return {
      errored: true,
      text: "",
      durationMs: Date.now() - t0,
      protocolError: e instanceof Error ? e.message : String(e),
    };
  }
}

function evaluateCase(c: CaseConfig, outcome: CallOutcome): { status: "pass" | "fail"; detail?: string } {
  const exp = c.expect ?? {};
  const wantsError = exp.error === true;
  const wantsOk = exp.ok === true || (!wantsError && exp.ok !== false);

  if (wantsError && !outcome.errored) {
    return { status: "fail", detail: `expected an error, but the call succeeded` };
  }
  if (wantsOk && outcome.errored) {
    return {
      status: "fail",
      detail: `expected success, got error${outcome.protocolError ? `: ${outcome.protocolError}` : outcome.text ? `: ${truncate(outcome.text, 200)}` : ""}`,
    };
  }
  if (exp["result.contains"] !== undefined && !outcome.text.includes(exp["result.contains"])) {
    return {
      status: "fail",
      detail: `result does not contain "${exp["result.contains"]}" (got: ${truncate(outcome.text, 200)})`,
    };
  }
  if (exp["result.matches"] !== undefined) {
    const re = new RegExp(exp["result.matches"]);
    if (!re.test(outcome.text)) {
      return {
        status: "fail",
        detail: `result does not match /${exp["result.matches"]}/ (got: ${truncate(outcome.text, 200)})`,
      };
    }
  }
  if (exp["result.equals"] !== undefined && outcome.text !== exp["result.equals"]) {
    return {
      status: "fail",
      detail: `result differs from expected exact value (got: ${truncate(outcome.text, 200)})`,
    };
  }
  if (exp.maxDurationMs !== undefined && outcome.durationMs > exp.maxDurationMs) {
    return {
      status: "fail",
      detail: `took ${outcome.durationMs}ms (limit ${exp.maxDurationMs}ms)`,
    };
  }
  return { status: "pass" };
}

export async function runSuites(
  client: Client,
  suites: SuiteConfig[],
  timeoutMs: number,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const suite of suites) {
    for (let i = 0; i < suite.cases.length; i++) {
      const c = suite.cases[i];
      const label = c.name ?? `case ${i + 1}`;
      const outcome = await callTool(client, suite.tool, c.args ?? {}, timeoutMs);
      const verdict = evaluateCase(c, outcome);
      results.push({
        id: `S:${suite.name}:${label}`,
        title: `${suite.name} › ${label} (${suite.tool})`,
        status: verdict.status,
        detail: verdict.detail,
        durationMs: outcome.durationMs,
      });
    }
  }
  return results;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
