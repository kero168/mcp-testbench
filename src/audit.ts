import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CheckResult, CheckSeverity } from "./types.js";
import { withTimeout } from "./connect.js";

interface ToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/** Audit rule metadata. Severity classifies impact; status stays warn-centric. */
const RULES: ReadonlyArray<{ id: string; title: string; severity: CheckSeverity }> = [
  { id: "A001", title: "tool descriptions are substantive and free of injection-style wording", severity: "warn" },
  { id: "A002", title: "destructive or exec-capable tools document confirmation/safety", severity: "warn" },
  { id: "A003", title: "no unconstrained string arguments accepting arbitrary commands, paths, or URLs", severity: "info" },
  { id: "A010", title: "no invisible or control Unicode characters in tool/schema descriptions", severity: "error" },
];

function rule(id: string): { id: string; title: string; severity: CheckSeverity } {
  return RULES.find((r) => r.id === id)!;
}

/** A001: descriptions shorter than this (after trim) are flagged. */
const MIN_DESCRIPTION_LENGTH = 10;

/** A001: injection-style wording that has no business in a tool description. */
const INJECTION_PATTERNS: ReadonlyArray<{ re: RegExp; label: string }> = [
  { re: /\b(ignore|disregard|forget)\s+(all\s+|any\s+)?(previous|prior|above|earlier|preceding)\b/i, label: "override-previous-instructions" },
  { re: /\bnew\s+(system\s+)?instructions?\s*:/i, label: "injected-instructions" },
  { re: /\b(do\s+not|don'?t|never)\s+(tell|inform|notify|warn|show|reveal\s+to|mention\s+to)\s+(the\s+)?user\b/i, label: "hide-from-user" },
  { re: /\bwithout\s+(telling|informing|notifying|asking)\s+(the\s+)?user\b/i, label: "hide-from-user" },
  { re: /\balways\s+(use|call|invoke|prefer|run)\s+this\s+tool\b/i, label: "tool-shadowing" },
  { re: /\bbefore\s+(using|calling|invoking)\s+any\s+other\s+tool\b/i, label: "tool-shadowing" },
  { re: /<\/?\s*(system|instructions?)\s*>/i, label: "markup-injection" },
];

/** A002: tool names that suggest destructive or execution capability. */
const DANGEROUS_NAME =
  /(^|[_\-.\s])(delete|remove|rm|rmdir|destroy|drop|erase|wipe|purge|truncate|kill|terminate|exec|execute|eval|spawn|shell|sh|bash|cmd|sudo|chmod|chown|format)([_\-.\s]|$)/i;

/** A002: descriptions that advertise destructive behavior. */
const DESTRUCTIVE_DESC = /\b(deletes?|destroys?|drops?|erases?|wipes?|purges?|permanently\s+removes?)\b/i;

/** A002: descriptions that advertise command/code execution. */
const EXEC_DESC = /\b(executes?|runs?|evals?|evaluates?)\b[^.!?]*\b(shell|system|terminal|arbitrary|commands?|scripts?|code|sql)\b/i;

/** A002: safety language that mitigates a dangerous tool. */
const CONFIRMATION_RE =
  /\b(confirm|confirmation|are\s+you\s+sure|irreversible|cannot\s+be\s+undone|can'?t\s+be\s+undone|destructive|use\s+with\s+caution|requires?\s+(explicit\s+)?(user\s+)?(approval|confirmation|consent)|asks?\s+(the\s+)?user\s+(for|to|before)|dry[\s-]?run)\b/i;

/** A003: argument names that signal over-broad string inputs. */
const ARG_SIGNALS: ReadonlyArray<{ re: RegExp; kind: string }> = [
  { re: /^(command|cmd|shell|script|code|exec|eval|sql)$|[_-](command|cmd|script|code|sql)$/i, kind: "an arbitrary command/code" },
  { re: /^(path|file|filename|filepath|dir|directory|folder|dest|destination|src|source)$|[_-](path|file|filename|dir|directory|folder)$/i, kind: "an arbitrary filesystem path" },
  { re: /^(url|uri|endpoint|link|href|host|hostname|address)$|[_-](url|uri|endpoint|host)$/i, kind: "an arbitrary URL/host" },
];

/**
 * A010: invisible / control codepoint ranges usable to hide instructions from
 * human reviewers: C0/C1 controls (minus tab/LF/CR), soft hyphen, Arabic
 * letter mark, zero-width characters, line/paragraph separators, bidi
 * embedding/override/isolate controls, word joiners, BOM, and Unicode tag
 * characters (U+E0000-U+E007F). Deliberately excludes U+200D (ZWJ) and
 * U+FE00-U+FE0F (variation selectors), which appear in legitimate emoji.
 */
const INVISIBLE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0000, 0x0008], // C0 controls before tab
  [0x000b, 0x000c], // VT, FF
  [0x000e, 0x001f], // C0 controls after CR
  [0x007f, 0x009f], // DEL + C1 controls
  [0x00ad, 0x00ad], // soft hyphen
  [0x061c, 0x061c], // Arabic letter mark
  [0x200b, 0x200c], // zero-width space, ZWNJ (ZWJ excluded)
  [0x200e, 0x200f], // LRM, RLM
  [0x2028, 0x2029], // line / paragraph separator
  [0x202a, 0x202e], // bidi embedding & override
  [0x2060, 0x2064], // word joiner & invisible operators
  [0x2066, 0x2069], // bidi isolates
  [0xfeff, 0xfeff], // BOM / zero-width no-break space
  [0xe0000, 0xe007f], // Unicode tag characters
];

/**
 * Local security & quality audit of a connected MCP server.
 * Static analysis of tools/list output only -- no LLM, no external network.
 */
export async function runAudit(
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

  const caps = client.getServerCapabilities() ?? {};
  if (!caps.tools) {
    for (const r of RULES) push({ ...r, status: "skip", detail: "server does not declare tools capability" });
    return results;
  }

  let tools: ToolInfo[] = [];
  const t0 = Date.now();
  try {
    const res = await withTimeout(client.listTools(), timeoutMs, "tools/list");
    tools = (res.tools ?? []) as ToolInfo[];
  } catch (e) {
    const detail = `tools/list failed: ${e instanceof Error ? e.message : String(e)}`;
    for (const r of RULES) push({ ...r, severity: "error", status: "fail", detail, durationMs: Date.now() - t0 });
    return results;
  }

  push(auditDescriptions(tools));
  push(auditDangerousTools(tools));
  push(auditSchemaSignals(tools));
  push(auditInvisibleUnicode(tools));
  return results;
}

/** A001 -- tool description lint. */
function auditDescriptions(tools: ToolInfo[]): CheckResult {
  const findings: string[] = [];
  for (const t of tools) {
    const desc = (t.description ?? "").trim();
    if (desc.length < MIN_DESCRIPTION_LENGTH) {
      findings.push(`${t.name}: description too short (${desc.length} chars)`);
    }
    for (const p of INJECTION_PATTERNS) {
      const m = desc.match(p.re);
      if (m) findings.push(`${t.name}: injection-style wording [${p.label}]: "${truncate(m[0], 60)}"`);
    }
  }
  return verdict("A001", tools, findings);
}

/** A002 -- dangerous name/description without confirmation language. */
function auditDangerousTools(tools: ToolInfo[]): CheckResult {
  const findings: string[] = [];
  for (const t of tools) {
    const desc = t.description ?? "";
    const dangerous = DANGEROUS_NAME.test(t.name) || DESTRUCTIVE_DESC.test(desc) || EXEC_DESC.test(desc);
    if (dangerous && !CONFIRMATION_RE.test(desc)) {
      findings.push(`${t.name}: destructive/exec-capable but no confirmation or safety note in description`);
    }
  }
  return verdict("A002", tools, findings);
}

/** A003 -- over-permissive declared-schema signals. */
function auditSchemaSignals(tools: ToolInfo[]): CheckResult {
  const findings: string[] = [];
  for (const t of tools) {
    const props = (t.inputSchema as { properties?: Record<string, unknown> } | undefined)?.properties ?? {};
    for (const [argName, raw] of Object.entries(props)) {
      const p = (raw ?? {}) as Record<string, unknown>;
      if (p.type !== "string" || isConstrained(p)) continue;
      const signal = ARG_SIGNALS.find((s) => s.re.test(argName));
      if (signal) findings.push(`${t.name}.${argName}: unconstrained string accepts ${signal.kind}`);
    }
  }
  return verdict("A003", tools, findings);
}

/** A010 -- prompt-injection surface: hidden Unicode in descriptions. */
function auditInvisibleUnicode(tools: ToolInfo[]): CheckResult {
  const findings: string[] = [];
  for (const t of tools) {
    const texts: Array<[string, string]> = [["description", t.description ?? ""]];
    collectDescriptions(t.inputSchema, "inputSchema", texts);
    for (const [where, text] of texts) {
      const found = findInvisible(text);
      if (found.length) findings.push(`${t.name} @ ${where}: ${found.join(" ")}`);
    }
  }
  return verdict("A010", tools, findings);
}

function verdict(id: string, tools: ToolInfo[], findings: string[]): CheckResult {
  const r = rule(id);
  return {
    ...r,
    status: findings.length > 0 ? "warn" : "pass",
    detail: findings.length > 0 ? findings.join("; ") : `${tools.length} tool(s) clean`,
  };
}

function isConstrained(p: Record<string, unknown>): boolean {
  return Array.isArray(p.enum) || p.const !== undefined || typeof p.pattern === "string";
}

/** Collect every `description` string nested anywhere inside a JSON schema. */
function collectDescriptions(node: unknown, path: string, out: Array<[string, string]>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectDescriptions(v, `${path}[${i}]`, out));
    return;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === "description" && typeof v === "string") out.push([`${path}.${k}`, v]);
    else collectDescriptions(v, `${path}.${k}`, out);
  }
}

/** List invisible/control codepoints found in `text`, e.g. ["U+200B(x2)"]. */
function findInvisible(text: string): string[] {
  const counts = new Map<string, number>();
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (!INVISIBLE_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)) continue;
    const key = `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([k, n]) => (n > 1 ? `${k}(x${n})` : k));
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}...` : s;
}
