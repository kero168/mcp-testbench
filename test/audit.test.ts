import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const SAMPLE = "node examples/sample-server/server.mjs";

interface Check {
  id: string;
  status: string;
  severity?: string;
  detail?: string;
}

describe("mcp-testbench audit (integration)", () => {
  it("passes a clean server with zero findings", async () => {
    const { stdout } = await run("node", [
      "dist/cli.js", "audit", "--server", SAMPLE, "--reporter", "json",
    ]);
    const summary = JSON.parse(stdout);
    expect(summary.failed).toBe(0);
    expect(summary.warned).toBe(0);
    const ids = summary.checks.map((c: Check) => c.id);
    for (const id of ["A000", "A001", "A002", "A003", "A010"]) {
      expect(ids).toContain(id);
    }
  }, 30000);

  it("flags the intentionally unsafe sample tools, with severities", async () => {
    const { stdout } = await run(
      "node",
      ["dist/cli.js", "audit", "--server", SAMPLE, "--reporter", "json"],
      { env: { ...process.env, SAMPLE_SERVER_UNSAFE: "1" } },
    );
    const summary = JSON.parse(stdout);
    // Audit findings are warn-centric: warnings, not failures (exit code 0).
    expect(summary.failed).toBe(0);
    expect(summary.warned).toBe(4);

    const byId: Record<string, Check> = Object.fromEntries(
      summary.checks.map((c: Check) => [c.id, c]),
    );

    // A001: too-short description + injection-style wording
    expect(byId.A001.status).toBe("warn");
    expect(byId.A001.severity).toBe("warn");
    expect(byId.A001.detail).toContain("note: description too short");
    expect(byId.A001.detail).toMatch(/delete_path: injection-style wording/);

    // A002: dangerous tools without confirmation language
    expect(byId.A002.status).toBe("warn");
    expect(byId.A002.severity).toBe("warn");
    expect(byId.A002.detail).toContain("run_shell");
    expect(byId.A002.detail).toContain("delete_path");

    // A003: unconstrained command/path/url string arguments
    expect(byId.A003.status).toBe("warn");
    expect(byId.A003.severity).toBe("info");
    expect(byId.A003.detail).toContain("run_shell.command");
    expect(byId.A003.detail).toContain("delete_path.path");
    expect(byId.A003.detail).toContain("fetch_url.url");

    // A010: hidden Unicode in a tool description
    expect(byId.A010.status).toBe("warn");
    expect(byId.A010.severity).toBe("error");
    expect(byId.A010.detail).toContain("delete_path");
    expect(byId.A010.detail).toContain("U+200B");
  }, 30000);

  it("exits 1 with --strict when any audit check warns", async () => {
    await expect(
      run("node", ["dist/cli.js", "audit", "--server", SAMPLE, "--strict"], {
        env: { ...process.env, SAMPLE_SERVER_UNSAFE: "1" },
      }),
    ).rejects.toMatchObject({ code: 1 });
  }, 30000);

  it("fails with exit code 1 when the server command is broken", async () => {
    await expect(
      run("node", ["dist/cli.js", "audit", "--server", "node ./does-not-exist.js", "--timeout", "5000"]),
    ).rejects.toMatchObject({ code: 1 });
  }, 30000);
});
