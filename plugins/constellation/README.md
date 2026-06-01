# Constellation plugin — Phase 1 prototype (v0.1.0)

Bundles EstreGenesis's `Constellation.md` (v2.3.13) live-board orchestration as a Claude Code plugin: WebSocket server + A2A messaging + dashboard + Stop hook helper + MCP server (read board state + emit targeted A2A).

## What this plugin gives you

- **MCP server**: `constellation-mcp` (`mcp/server.cjs`) — exposes board read interface (`board_state_get`, `board_history_tail`, `agent_list_get`) + write interface (`a2a_emit`, `a2a_wait_ack`) per `Constellation.md §8`. Phase 1 ships skeleton (real WS proxy is Phase 2).
- **Skills**:
  - `constellation-board` (model-invoked) — read board state via MCP
  - `constellation-a2a-emit` (model-invoked) — emit targeted A2A through MCP with §13.16.10 pre-send probe discipline
  - `constellation-start` (user-invoked) — start the WS server + local bridge
- **Stop hook**: `hooks/hooks.json` references the v2.5.8 canonical `pre-send-probe.cjs --rearm` at `constellation/reference/runtime/stop-hook/`

## Install (Phase 1 — repo-based)

```bash
# In Claude Code session, add the EG marketplace:
/plugin marketplace add SoliEstre/EstreGenesis

# Install the constellation plugin:
/plugin install constellation@estregenesis-plugins
```

## Configuration (env vars)

```bash
# Required (WS proxy + state.json access):
CONSTELLATION_WS_URL=ws://localhost:7878/ws
CONSTELLATION_STATE_PATH=/path/to/state.json

# Optional (one of, for role auth — see Constellation.md §8.4):
CONSTELLATION_UPSTREAM_KEY=uk-...
CONSTELLATION_COLLAB_KEY=ck-...
CONSTELLATION_TOKEN=...
```

## What's in v0.1.0 (Phase 1 prototype)

- Skill registration (3 skills + Stop hook)
- MCP server skeleton (stdio JSON-RPC + 5 tool registrations + stub responses)
- Plugin manifest (`plugin.json` declares MCP server, skills, hooks as a single bundle)

## Deferred to Phase 2 (v2.5.10+)

- Full WS proxy connection from the MCP server to the live board
- `a2a_wait_ack` with full §13.13 3-tier ack semantics
- Session-lifecycle AgentList integration (MCP session = logical agent presence)
- MCP `prompts/list` and `resources/list` (board state as MCP resource)
- Chunked transfer for large A2A payloads (composes with §13.11 attachment transport-mode currently under negotiation with hermes-dev-agent per outbox 295)

## Spec source

- `Constellation.md` (v2.3.13) — full SSoT including §8 MCP integration
- `constellation/reference/runtime/` — server.cjs + local-bridge.cjs + stop-hook/pre-send-probe.cjs
- `constellation/gateway-client.eux` (v2.5.3 canonical promotion) — distilled adapter spec

The plugin bundles these by reference (`mcp/server.cjs` proxies to the WS server; `hooks/hooks.json` references the v2.5.8 canonical Stop hook).

## License

Apache-2.0.
