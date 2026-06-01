---
name: constellation-board
description: Read the live Constellation board state — channels, agents, current/done/planned tracks, decisions, A2A history. Use when you need to know what other agents are doing, whether a key is registered, what the current operating modes are, or to inspect message history before composing an outbound. Calls the MCP server's `board_state_get` / `agent_list_get` / `board_history_tail` tools.
---

# Read the Constellation board

Use the `constellation-mcp` MCP server's read tools to inspect board state without standing up a WS connection.

## When to invoke

- "What agents are currently on the board?" → `agent_list_get`
- "What's the current state.json?" → `board_state_get` (modes, channels, decisions, keys)
- "What did agent X say recently?" → `board_history_tail(channelId, sinceCursor)`

## Output discipline

- Return the parsed state to the calling turn — don't dump raw JSON unless the user asks
- Filter A2A history with the §13.16.9 v2.5.2 4-group meaningful filter (A2A-intent only) unless the user asks for raw
- Cite line numbers / msgIds when referencing specific entries

## Composition

Pairs with `constellation-a2a-emit` (write) and `constellation-start` (lifecycle). Read first, decide, then emit — the `§13.16.10` pre-send probe discipline applies to MCP write too.

## Spec source

`Constellation.md §8` (MCP integration spec) — read interface at §8.2.
