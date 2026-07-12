#!/usr/bin/env node
/**
 * Minimal MCP server used by mcp-testbench's own test suite and as a living example.
 * Implements one well-behaved tool and one intentionally sloppy tool.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "sample-echo-server", version: "1.0.0" });

server.tool(
  "echo",
  "Echo back the provided message, uppercased when shout=true.",
  { message: z.string().describe("Text to echo"), shout: z.boolean().optional() },
  async ({ message, shout }) => ({
    content: [{ type: "text", text: shout ? message.toUpperCase() : message }],
  }),
);

server.tool(
  "add",
  "Add two numbers and return the sum as text.",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
