import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

describe("mcp-testkit CLI (integration)", () => {
  it("passes against the well-behaved sample server", async () => {
    const { stdout } = await run("node", [
      "dist/cli.js",
      "run",
      "--config",
      "examples/sample-server/mcptest.config.yaml",
    ]);
    expect(stdout).toContain("12 passed");
    expect(stdout).not.toContain("failed");
  }, 30000);

  it("reports JSON with a machine-readable summary", async () => {
    const { stdout } = await run("node", [
      "dist/cli.js",
      "run",
      "--config",
      "examples/sample-server/mcptest.config.yaml",
      "--reporter",
      "json",
    ]);
    const summary = JSON.parse(stdout);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBeGreaterThanOrEqual(10);
    expect(Array.isArray(summary.checks)).toBe(true);
  }, 30000);

  it("fails with exit code 1 when the server command is broken", async () => {
    await expect(
      run("node", ["dist/cli.js", "run", "--server", "node ./does-not-exist.js", "--timeout", "5000"]),
    ).rejects.toMatchObject({ code: 1 });
  }, 30000);
});
