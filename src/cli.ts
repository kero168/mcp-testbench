#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync, existsSync } from "node:fs";
import pc from "picocolors";
import { loadConfig, INIT_TEMPLATE, DEFAULT_CONFIG_FILES } from "./config.js";
import { connect } from "./connect.js";
import { runConformance } from "./conformance.js";
import { runSuites } from "./runner.js";
import { printGithubAnnotations, printJson, printPretty, summarize } from "./report.js";
import type { CheckResult, TestkitConfig } from "./types.js";

const program = new Command();

program
  .name("mcp-testkit")
  .description("Test any MCP server, in any language, with one command.")
  .version("0.1.0");

program
  .command("init")
  .description("Create a starter mcptest.config.yaml in the current directory")
  .action(() => {
    const target = DEFAULT_CONFIG_FILES[0];
    if (existsSync(target)) {
      console.error(pc.yellow(`${target} already exists — not overwriting.`));
      process.exitCode = 1;
      return;
    }
    writeFileSync(target, INIT_TEMPLATE, "utf8");
    console.log(pc.green(`Created ${target}`));
    console.log(pc.dim(`Edit the server command, then run: npx mcp-testkit run`));
  });

program
  .command("run")
  .description("Run conformance checks and test suites against an MCP server")
  .option("-c, --config <file>", "config file path")
  .option("--server <command>", "override: stdio server command (skips config file)")
  .option("--url <url>", "override: Streamable HTTP server URL (skips config file)")
  .option("--reporter <kind>", "pretty | json | github", "pretty")
  .option("--timeout <ms>", "per-call timeout in milliseconds", "15000")
  .action(async (opts: { config?: string; server?: string; url?: string; reporter: string; timeout: string }) => {
    let config: TestkitConfig;
    let label: string;

    if (opts.server || opts.url) {
      config = {
        server: opts.server ? { command: opts.server } : { url: opts.url },
        conformance: { enabled: true },
        suites: [],
      };
      label = opts.server ?? opts.url ?? "";
    } else {
      const loaded = loadConfig(opts.config);
      config = loaded.config;
      label = config.server.command ?? config.server.url ?? "";
    }

    const timeoutMs = config.timeoutMs ?? Number(opts.timeout) ?? 15000;
    const startedAt = Date.now();
    const checks: CheckResult[] = [];

    let close: (() => Promise<void>) | undefined;
    try {
      const conn = await connect(config.server, timeoutMs);
      close = conn.close;
      checks.push({ id: "C000", title: "server starts and completes MCP initialize handshake", status: "pass", durationMs: Date.now() - startedAt });

      if (config.conformance?.enabled !== false) {
        checks.push(...(await runConformance(conn.client, { skip: config.conformance?.skip, timeoutMs })));
      }
      if (config.suites && config.suites.length > 0) {
        checks.push(...(await runSuites(conn.client, config.suites, timeoutMs)));
      }
    } catch (e) {
      checks.push({
        id: "C000",
        title: "server starts and completes MCP initialize handshake",
        status: "fail",
        detail: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - startedAt,
      });
    } finally {
      try {
        await close?.();
      } catch {
        /* server teardown errors are not test failures */
      }
    }

    const summary = summarize(label, startedAt, checks);
    if (opts.reporter === "json") printJson(summary);
    else if (opts.reporter === "github") {
      printPretty(summary);
      printGithubAnnotations(summary);
    } else printPretty(summary);

    process.exitCode = summary.failed > 0 ? 1 : 0;
  });

program.parseAsync(process.argv);
