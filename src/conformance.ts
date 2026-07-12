import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CheckResult } from "./types.js";
import { withTimeout } from "./connect.js";

interface ToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * Built-in, server-agnostic conformance checks.
 * These run against ANY MCP server over the protocol itself.
 */
export async function runConformance(
  client: Client,
  opts: { skip?: string[]; timeoutMs?: number } = {},
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const skip = new Set(opts.skip ?? []);
  const timeoutMs = opts.timeoutMs ?? 15000;

  const push = (r: CheckResult) => {
    if (skip.has(r.id)) results.push({ ...r, status: "skip", detail: "skipped by config" });
    else results.push(r);
  };

  // C001: server info present
  const started = Date.now();
  const serverVersion = client.getServerVersion();
  push({
    id: "C001",
    title: "initialize handshake exposes server name & version",
    status: serverVersion?.name ? "pass" : "fail",
    detail: serverVersion ? `${serverVersion.name}@${serverVersion.version ?? "?"}` : "no serverInfo returned",
    durationMs: Date.now() - started,
  });

  // C002: capabilities declared
  const caps = client.getServerCapabilities() ?? {};
  const capList = Object.keys(caps);
  push({
    id: "C002",
    title: "server declares at least one capability",
    status: capList.length > 0 ? "pass" : "warn",
    detail: capList.length ? capList.join(", ") : "empty capabilities object",
  });

  // C010: tools/list succeeds (if capability declared)
  let tools: ToolInfo[] = [];
  if (caps.tools) {
    const t0 = Date.now();
    try {
      const res = await withTimeout(client.listTools(), timeoutMs, "tools/list");
      tools = (res.tools ?? []) as ToolInfo[];
      push({
        id: "C010",
        title: "tools/list returns a valid tool list",
        status: "pass",
        detail: `${tools.length} tool(s)`,
        durationMs: Date.now() - t0,
      });
    } catch (e) {
      push({
        id: "C010",
        title: "tools/list returns a valid tool list",
        status: "fail",
        detail: String(e),
        durationMs: Date.now() - t0,
      });
    }

    // C011: every tool has a name and description
    if (tools.length > 0) {
      const missingDesc = tools.filter((t) => !t.description || t.description.trim().length < 3);
      push({
        id: "C011",
        title: "every tool has a meaningful description",
        status: missingDesc.length === 0 ? "pass" : "warn",
        detail:
          missingDesc.length === 0
            ? undefined
            : `missing/short description: ${missingDesc.map((t) => t.name).join(", ")}`,
      });

      // C012: input schemas are structurally valid JSON Schema objects
      const badSchema = tools.filter((t) => {
        const s = t.inputSchema;
        return !s || typeof s !== "object" || (s as { type?: string }).type !== "object";
      });
      push({
        id: "C012",
        title: "every tool declares an object-typed input JSON Schema",
        status: badSchema.length === 0 ? "pass" : "fail",
        detail:
          badSchema.length === 0
            ? undefined
            : `invalid inputSchema: ${badSchema.map((t) => t.name).join(", ")}`,
      });

      // C013: tool names follow safe naming (no spaces / weird chars)
      const badNames = tools.filter((t) => !/^[a-zA-Z0-9_\-.]+$/.test(t.name));
      push({
        id: "C013",
        title: "tool names use safe characters",
        status: badNames.length === 0 ? "pass" : "warn",
        detail: badNames.length ? badNames.map((t) => t.name).join(", ") : undefined,
      });

      // C020: calling a tool with clearly invalid arguments fails gracefully
      const target = pickToolWithRequiredArg(tools);
      if (target) {
        const t1 = Date.now();
        try {
          const res = await withTimeout(
            client.callTool({ name: target.name, arguments: {} }),
            timeoutMs,
            `tools/call ${target.name}`,
          );
          const errored = res.isError === true;
          push({
            id: "C020",
            title: "missing required argument is rejected gracefully",
            status: errored ? "pass" : "warn",
            detail: errored
              ? `tool "${target.name}" returned isError=true as expected`
              : `tool "${target.name}" accepted empty args despite required fields`,
            durationMs: Date.now() - t1,
          });
        } catch {
          // A protocol-level error is also acceptable graceful rejection
          push({
            id: "C020",
            title: "missing required argument is rejected gracefully",
            status: "pass",
            detail: `tool "${target.name}" rejected the call with a protocol error`,
            durationMs: Date.now() - t1,
          });
        }
      }
    }
  } else {
    push({ id: "C010", title: "tools/list returns a valid tool list", status: "skip", detail: "server does not declare tools capability" });
  }

  // C030: resources/list works if declared
  if (caps.resources) {
    const t2 = Date.now();
    try {
      const res = await withTimeout(client.listResources(), timeoutMs, "resources/list");
      push({
        id: "C030",
        title: "resources/list returns a valid resource list",
        status: "pass",
        detail: `${res.resources?.length ?? 0} resource(s)`,
        durationMs: Date.now() - t2,
      });
    } catch (e) {
      push({ id: "C030", title: "resources/list returns a valid resource list", status: "fail", detail: String(e), durationMs: Date.now() - t2 });
    }
  }

  // C040: prompts/list works if declared
  if (caps.prompts) {
    const t3 = Date.now();
    try {
      const res = await withTimeout(client.listPrompts(), timeoutMs, "prompts/list");
      push({
        id: "C040",
        title: "prompts/list returns a valid prompt list",
        status: "pass",
        detail: `${res.prompts?.length ?? 0} prompt(s)`,
        durationMs: Date.now() - t3,
      });
    } catch (e) {
      push({ id: "C040", title: "prompts/list returns a valid prompt list", status: "fail", detail: String(e), durationMs: Date.now() - t3 });
    }
  }

  return results;
}

function pickToolWithRequiredArg(tools: ToolInfo[]): ToolInfo | undefined {
  return tools.find((t) => {
    const schema = t.inputSchema as { required?: string[] } | undefined;
    return Array.isArray(schema?.required) && schema.required.length > 0;
  });
}
