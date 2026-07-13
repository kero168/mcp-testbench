# Governance

`mcp-testbench` is an open-source project released under the MIT license.
This document describes how the project is run today and how that will evolve
as the community grows.

## Current model: Maintainer-led

The project is currently maintained by its author, [@kero168](https://github.com/kero168)
(primary maintainer), who has final say on:

- Roadmap and scope (see [ROADMAP.md](./ROADMAP.md))
- Merging pull requests and cutting releases
- Security response (see [SECURITY.md](./SECURITY.md))

All substantive decisions are made **in public** — in issues, pull requests, or
GitHub Discussions. There is no private decision channel.

## How decisions are made

1. **Small changes** (bug fixes, docs, tests): open a PR directly. A maintainer
   reviews within the SLA below.
2. **New features / behavior changes**: open an issue first describing the
   problem and proposed approach. Get a thumbs-up from a maintainer before
   investing significant work.
3. **Breaking changes / new check IDs (Cxxx)**: require an RFC-style issue
   labeled `rfc`, open for comment for at least 7 days.

## Maintainer response SLA (target)

- First response to new issues: within 48 hours (median)
- First review on PRs: within 72 hours (median)

## Becoming a maintainer

Contributors who have landed several meaningful PRs, participate in reviews,
and demonstrate good judgment may be invited to become **core maintainers**
with triage access first, then write access. The current list lives in
[MAINTAINERS.md](./MAINTAINERS.md).

## Succession / bus factor

If the primary maintainer becomes unresponsive for more than 60 days, core
maintainers may collectively assume release authority. If no core maintainers
exist at that time, the npm package and repository will be offered to a
suitable steward (e.g., an active downstream user or a community organization)
rather than left unmaintained.

## Changes to governance

Changes to this document are proposed via PR and announced in release notes.
