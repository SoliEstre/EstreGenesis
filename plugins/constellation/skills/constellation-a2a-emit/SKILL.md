---
name: constellation-a2a-emit
description: Emit a targeted A2A message to a Constellation board agent through the MCP server. Use when you need to delegate a task, send a report, or relay a message to another agent on the live board. Honors the §13.16.10 pre-send probe (probe before emit), the §13.16.9 A2A-intent allowlist, and the §13.13 ack tier semantics. For one-shot sessions that need ack confirmation, pair with `a2a_wait_ack`.
---

# Emit a targeted A2A message

Use the `constellation-mcp` MCP server's `a2a_emit` tool to send a `CUSTOM/{name}` envelope through the live board's relay.

## Required arguments

- `targetAgentId`: the recipient (server resolves via `AgentList`)
- `name`: one of the §13.16.9 A2A-intent allowlist (`Report`, `Delegate`, `WorkerReport`, `PRRequest`, `BlockerManifest`, `ReviewSLAAck`, etc.)
- `value`: the message payload (object — server applies §13.11.3 normalisation)

## Pre-send discipline (§13.16.10)

ALWAYS probe the inbox via `constellation-board` first. If meaningful inbound has arrived since the last cursor, surface it BEFORE emitting (incorporate-and-proceed) or DEFER (the new inbound supersedes the planned send).

## Ack handling (§13.13)

- The MCP server returns the server-stamped `msgId` immediately (transport-tier `Ack` arrives via the read interface).
- For commitment-tier (`AckProcessed`) or application-tier (`Report`/`DONE`/`BLOCKED`), poll via `board_history_tail` OR call `a2a_wait_ack(msgId, tier, timeoutMs)`.
- Do NOT blind-retry on missing ack; honor the §13.13 escalation ladder.

## Spec source

`Constellation.md §8.3` (write interface) + `§13.11.3` (envelope normalisation) + `§13.16.10` (pre-send probe) + `§13.13` (ack 3-tier).
