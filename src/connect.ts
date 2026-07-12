import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ServerConfig } from "./types.js";

export interface Connection {
  client: Client;
  label: string;
  close: () => Promise<void>;
}

/** Split a command string into command + args (naive but predictable). */
export function splitCommand(command: string): { cmd: string; args: string[] } {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const clean = parts.map((p) => p.replace(/^"|"$/g, ""));
  const [cmd, ...args] = clean;
  if (!cmd) throw new Error(`Empty server command`);
  return { cmd, args };
}

export async function connect(server: ServerConfig, timeoutMs = 15000): Promise<Connection> {
  const client = new Client(
    { name: "mcp-testbench", version: "0.1.0" },
    { capabilities: {} },
  );

  if (server.url) {
    const transport = new StreamableHTTPClientTransport(new URL(server.url));
    await withTimeout(client.connect(transport), timeoutMs, "connect");
    return {
      client,
      label: server.url,
      close: async () => {
        await client.close();
      },
    };
  }

  const { cmd, args } = splitCommand(server.command!);
  const transport = new StdioClientTransport({
    command: cmd,
    args: [...args, ...(server.args ?? [])],
    env: { ...(process.env as Record<string, string>), ...(server.env ?? {}) },
    stderr: "pipe",
  });
  await withTimeout(client.connect(transport), timeoutMs, "connect");
  return {
    client,
    label: server.command!,
    close: async () => {
      await client.close();
    },
  };
}

export async function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms during ${what}`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
