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

## What's in v0.2.0 (Phase 2 production-ready)

- Skill registration (3 skills + Stop hook)
- **MCP server full impl** (`mcp/server.cjs` + `mcp/package.json` declaring `ws ^8.18.0` dependency):
  - Live WS proxy connection to the Constellation server (peer-coordination handshake: SERVER_HELLO → HELLO → AgentHello)
  - **5 tools fully implemented**: `board_state_get` · `board_history_tail` (cursor + §13.16.9 v2.5.2 meaningful filter) · `agent_list_get` · `a2a_emit` (§13.11 rule 5 attachment-aware) · `a2a_wait_ack` (**full §13.13 3-tier**: delivered/commitment/application)
  - **§13.13.2 idempotent receiver dedup** (seen-msgId LRU 1024/1h; duplicates emit `AckProcessed { dedupHit: true }` automatically)
  - **Chunked transfer reassembly** (ArtifactManifest + ArtifactChunk + ArtifactComplete; per §13.11 rule 5 + §13.13.2)
  - Session-lifecycle AgentList integration (MCP session = logical agent presence; close → server marks absent on next AgentList)
- Plugin manifest (`plugin.json` v0.2.0 declares MCP server, skills, hooks as a single bundle)

## Install (with npm dependency)

```bash
# In Claude Code session:
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install constellation@estregenesis-plugins

# Plugin install must resolve the npm dep — if not auto-resolved:
cd plugins/constellation/mcp && npm install
```

## Deferred to Phase 3 (v2.5.12+)

- MCP `prompts/list` and `resources/list` (board state as MCP resource — currently `board_state_get` tool only)
- v0.4 reference-implementation: server.cjs pending queue + redelivery scheduler (per §13.13.2 §13.13.2 server-side state — Phase 3 ships the server complement to this plugin's receiver-side dedup)
- Telemetry sink: redelivery counts + dedup-hit rates + RelayUnreachable rates (calibration data for §13.13.2 default-tuning)

## Spec source

- `Constellation.md` (v2.3.13) — full SSoT including §8 MCP integration
- `constellation/reference/runtime/` — server.cjs + local-bridge.cjs + stop-hook/pre-send-probe.cjs
- `constellation/gateway-client.eux` (v2.5.3 canonical promotion) — distilled adapter spec

The plugin bundles these by reference (`mcp/server.cjs` proxies to the WS server; `hooks/hooks.json` references the v2.5.8 canonical Stop hook).

## License

Apache-2.0.
