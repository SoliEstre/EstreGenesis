# Constellation plugin — Phase 2 production-ready (v0.2.1)

Bundles EstreGenesis's `Constellation.md` live-board orchestration as a Claude Code plugin: WebSocket server + A2A messaging + dashboard + Stop hook helper + MCP server (read board state + emit targeted A2A).

## What this plugin gives you

- **MCP server**: `constellation-mcp` (`mcp/server.cjs`) — exposes board read interface (`board_state_get`, `board_history_tail`, `agent_list_get`) + write interface (`a2a_emit`, `a2a_wait_ack`) per `Constellation.md §8`.
- **Skills**:
  - `constellation-board` (model-invoked) — read board state via MCP
  - `constellation-a2a-emit` (model-invoked) — emit targeted A2A through MCP with §13.16.10 pre-send probe discipline
  - `constellation-start` (user-invoked) — start the WS server + local bridge
- **Stop hook**: `hooks/hooks.json` runs the bundled `pre-send-probe.cjs --rearm` at `hooks/pre-send-probe.cjs` (self-contained inside the plugin directory; no external paths required).

## Install

### Option A — community marketplace (recommended once approved)

```bash
# In a Claude Code session:
/plugin install constellation@claude-community
```

### Option B — self-hosted EstreGenesis marketplace

```bash
# In a Claude Code session:
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install constellation@estregenesis-plugins
```

After install, resolve the npm dependency if it was not auto-resolved by the plugin installer:

```bash
cd <plugin-cache>/constellation/mcp && npm install
```

## Configuration

### MCP server (required for the WS proxy + state access)

```bash
CONSTELLATION_WS_URL=ws://localhost:7878/ws
CONSTELLATION_STATE_PATH=/path/to/state.json

# One of, for role auth — see Constellation.md §8.4:
CONSTELLATION_UPSTREAM_KEY=uk-...
CONSTELLATION_COLLAB_KEY=ck-...
CONSTELLATION_TOKEN=...
```

### Stop hook (optional — point the bundled probe at your inbox)

The Stop hook script `pre-send-probe.cjs` works out of the box but only does meaningful work if it can find your A2A inbox file. Set these env vars in the shell environment Claude Code launches from:

```bash
INBOX_PATH=/absolute/path/to/your/inbox.log              # required to enable probing
CURSOR_FILE_PATH=/absolute/path/to/.last-surfaced-cursor # optional; defaults next to INBOX_PATH
WATCHER_SCRIPT=/absolute/path/to/watcher-rearm.cjs       # optional; if absent the agent-side rearm is canonical
```

Without `INBOX_PATH` the hook degrades gracefully — it logs `[probe] inbox.log not found` to stderr and exits clean, so the rest of your Claude Code session is unaffected.

## What's in v0.2.1

- v0.2.0 features (below) +
- **Stop hook self-containment**: `pre-send-probe.cjs` is now bundled inside `plugins/constellation/hooks/` rather than referenced through a relative path that escaped the plugin directory. The plugin now works on any host that copies only the plugin tree to a cache directory (i.e. every standard Claude Code plugin install path, including the community marketplace).

## What's in v0.2.0 (Phase 2 production-ready)

- Skill registration (3 skills + Stop hook)
- **MCP server full impl** (`mcp/server.cjs` + `mcp/package.json` declaring `ws ^8.18.0` dependency):
  - Live WS proxy connection to the Constellation server (peer-coordination handshake: SERVER_HELLO → HELLO → AgentHello)
  - **5 tools fully implemented**: `board_state_get` · `board_history_tail` (cursor + §13.16.9 v2.5.2 meaningful filter) · `agent_list_get` · `a2a_emit` (§13.11 rule 5 attachment-aware) · `a2a_wait_ack` (**full §13.13 3-tier**: delivered/commitment/application)
  - **§13.13.2 idempotent receiver dedup** (seen-msgId LRU 1024/1h; duplicates emit `AckProcessed { dedupHit: true }` automatically)
  - **Chunked transfer reassembly** (ArtifactManifest + ArtifactChunk + ArtifactComplete; per §13.11 rule 5 + §13.13.2)
  - Session-lifecycle AgentList integration (MCP session = logical agent presence; close → server marks absent on next AgentList)
- Plugin manifest declares MCP server, skills, hooks as a single bundle.

## Deferred to Phase 3 (v2.5.12+)

- MCP `prompts/list` and `resources/list` (board state as MCP resource — currently `board_state_get` tool only)
- v0.4 reference-implementation: server.cjs pending queue + redelivery scheduler (per §13.13.2 §13.13.2 server-side state — Phase 3 ships the server complement to this plugin's receiver-side dedup)
- Telemetry sink: redelivery counts + dedup-hit rates + RelayUnreachable rates (calibration data for §13.13.2 default-tuning)

## Spec source

- `Constellation.md` — full SSoT including §8 MCP integration
- `constellation/reference/runtime/` — server.cjs + local-bridge.cjs + stop-hook/pre-send-probe.cjs (the canonical reference copies; the plugin's `mcp/server.cjs` and `hooks/pre-send-probe.cjs` are bundled copies that ship with the plugin so an installed cache directory is self-contained).
- `constellation/gateway-client.eux` — distilled adapter spec

## License

Apache-2.0.
