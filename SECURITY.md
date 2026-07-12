# Security Policy

## Supported versions

The latest minor release receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.
Use GitHub's private vulnerability reporting on this repository
(Security tab → "Report a vulnerability").

You can expect an initial response within 7 days. Confirmed issues will be
fixed in a patch release, credited to the reporter unless anonymity is
requested.

## Scope notes

`mcp-testbench` spawns the server process you configure and connects to it as
an MCP client. It never sends your code or test results anywhere — there is
no telemetry of any kind in this package.
