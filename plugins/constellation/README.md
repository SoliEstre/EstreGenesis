# Constellation plugin — Phase 2 production-ready (v0.2.3)

Bundles EstreGenesis's `Constellation.md` live-board orchestration as a Claude Code plugin: WebSocket server + A2A messaging + dashboard + Stop hook helper + MCP server (read board state + emit targeted A2A).

## ⚠️ Infrastructure requirements

**This plugin is a *client* to a separately-running Constellation infrastructure**, not a self-contained tool. Before the plugin's MCP tools can do meaningful work, the following must be running:

1. **Constellation WebSocket server** — a Node process at a URL you configure (typically `ws://localhost:7878/ws`). Canonical reference implementation: [`constellation/reference/runtime/server.cjs`](https://github.com/SoliEstre/EstreGenesis/blob/main/constellation/reference/runtime/server.cjs) in the EstreGenesis repo. Run it with `node server.cjs` (zero npm deps for the basic server; the `ws` package is needed for the MCP bridge in this plugin).
2. **A state file location** the WS server reads/writes (the `CONSTELLATION_STATE_PATH` env var).
3. **A role-keyed auth token** matching the server's accepted role (`CONSTELLATION_TOKEN` or one of `_UPSTREAM_KEY` / `_COLLAB_KEY`).

**What the plugin does WITHOUT a running server**:

- The plugin installs and loads without error (no crash on startup).
- The skills are present and described in the plugin's manifest but operate as documentation-only — they instruct the model to consult the MCP tools, which won't function without the WS server.
- The Stop hook degrades gracefully — it logs `[probe] inbox.log not found` to stderr and exits clean (no agent-side disruption).
- MCP tool calls (`board_state_get`, `a2a_emit`, etc.) will fail with connection errors until the WS server is up.

**Why this architecture**: Constellation is a peer-coordination layer for multi-agent live boards. The WS server holds shared state across multiple agents; bundling a single-process default server in the plugin would defeat the multi-agent purpose. This mirrors how database / messaging-bus / observability plugins in the marketplace require the user to run their own backing service.

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

## What's in v0.2.3

- v0.2.2 features (below) +
- **Infrastructure requirements section** added prominently at the top of the README per the community-marketplace policy for plugins that depend on user-provisioned external services (no formal disclosure schema yet, but precedent set by Airtable / MongoDB / PostgreSQL / GitHub / Stripe official plugins which all connect to user-managed accounts and external services).

## What's in v0.2.2

- v0.2.1 features (below) +
- **pre-send-probe.cjs ALLOWLIST extension + doubly-wrapped envelope inner-name fallback** (per EstreGenesis v2.5.20). Added `Request` / `Reply` / `Attachment` / `ArtifactManifest` / `ArtifactComplete` to the cycle-end probe's A2A-intent allowlist. Inner-name fallback handles envelopes where the outer `name` field carries the literal string `"CUSTOM"` instead of the MessageName (a non-standard envelope shape observed in some adapter implementations).

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
