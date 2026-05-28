<!-- module: Constellation; layer: live-orchestration; part-of: EstreGenesis 2.0; version: v2.2.0; date: 2026-05-28; protocol: live-board v0.3 (distilled inline — self-sufficient); license: Apache-2.0 -->

# Constellation — Live Multi-Agent Orchestration

> **EstreGenesis 2.0 module.** Constellation graduates multi-agent coordination from the file-based `.agent/_coordination/` ledger (STATE/HANDOFF/CHANGELOG) to a **real-time live board** — a WebSocket server + A2A (agent-to-agent) messaging + a dashboard a human watches. It is a runtime system (server + bridges + watchers); this guide distills the **whole contract inline** — the A2A bridge interface (§2), the protocol essentials (§2–§5), and the runtime patterns (§4) — and ships the runtime as **distilled `.eux` specs** in `constellation/`, so any project can build a compatible board **without access to a private reference runtime**.
>
> **Optional.** File-based coordination (the seed's Phase 5) is the default and is enough for most projects. Adopt Constellation only when concurrent multi-agent operation needs real-time visibility, live cross-agent messaging, or orchestrated delegation.
>
> **Self-sufficient.** Everything needed to implement a compatible board is in this file + the `constellation/*.eux` distillations — build from the spec, not from a private runtime. The canonical live-board protocol is maintained upstream; this is its public distillation (v0.3) and the build-from-spec source of truth for adopters. Goal: Constellation matures toward a published EstreGenesis Claude plugin; until then it ships as a 2.0-included module.

---

## 1. Architecture

```
upstream agents          local IDE main agent              other local IDE agents
(API / gateway)     ─►   (orchestrator / supervisor)  ─►   (workers: other CLI/IDE coding agents, new chats)
                                    ▲
                          external collab agents (join URL)
```

- **main** — orchestrator; the priority recipient of target-unspecified messages. Default = the local IDE bridge in the environment that started the live-board server (`local-ide-agent`). Reassignable by graceful handoff (§2).
- **local** — other local IDE agents (workers). A new chat in the same IDE is a new agent.
- **upstream** — upstream agents; connect with a main-issued registration key (`uk-`) → `upstream` role.
- **collab** — external collaborators; connect with a collab key (`ck-`) via a join URL → `collab` role, `group:collab`.
- **board** — the dashboard / live board itself. A board sends **no** `HELLO` (the server registers HELLO senders as agents) — it connects, receives, renders, and forwards user input as `CUSTOM`.

> **Main vs worker self-judgment (1 second, first task):** "Did I start the live-board server in this environment?" Yes = main (own the board `state.json`, onboard workers, delegate). No (server already up — `curl :PORT/api/state` returns 200) = worker (separate `agentId` + separate queue; never write the board directly; report to main).

---

## 2. The A2A bridge interface (the invariant)

This is the part every adopter must describe identically. Everything else (implementation language, transport details, dashboard styling) flexes per agent/user preference.

**Roles**: `board` · `main` · `local` · `upstream` (`uk-` key) · `collab` (`ck-` key + join URL). The server decides the role from `HELLO` + the connection key; the default for a plain `HELLO` (no key, not main) is `local`.

**Connection paths** (the auth/role param is in the WS URL, not a generic `?key=`):
- dev / local: `ws://<host>:<port>/ws` (no auth by default)
- token-gated: `ws://…/ws?token=<token>` (or `Authorization: Bearer`)
- upstream: `ws://…/ws?upstreamKey=<uk-…>` → `upstream` role
- collab: `ws://…/ws?key=<ck-…>` → `collab` role · `group:collab` (issued via the `/join/collab` URL)

One WS text frame = one JSON event (raw WebSocket, RFC 6455 — no library required).

**Handshake**:
1. WS connect (per the path above) → server sends `SERVER_HELLO { sessionId, protocolVersion: "0.3", serverTime }` → `AgentList` (role first, so monitors can classify) → `History` (replay).
2. Send `HELLO { agentId, agentName, role, capabilities{inbound[],outbound[]} }`. New IDE chat = new `agentId`. (A board sends no HELLO.)
3. Send A2A `CUSTOM/AgentHello { targetAgentId: <main>, value: { agentId, env, capabilities, idle } }` to introduce yourself.
4. Main replies `OnboardAck` (welcome/guide/modes/policy). Then **wait for `Delegate`** — workers do not self-start (`Delegate` is never automated; the PM decides from the worklist).

**Messaging**:
- **Target-unspecified** inbound/CUSTOM → **main** (sole priority receiver; not broadcast to all agents — avoids duplicate processing). Main → worker uses `targetAgentId` (with `reason`/`summary` meta).
- **Channel key = `agentId`** (one board tab per agent). `channelId`/`threadId` do not split channels — they show as an origin badge / filter only.
- Workers report progress via `CUSTOM/WorkerReport`; the board (`state.json`) SSoT is the **main** — workers never write the board directly (avoids multi-session collision).
- Outbound events follow AG-UI `UPPER_SNAKE_CASE`, broadcast to all boards tagged by `agentId`: `RUN_STARTED/FINISHED` · `STEP_STARTED/FINISHED` · `TEXT_MESSAGE_START/CONTENT/END` · `TOOL_CALL_START/ARGS/END/RESULT` · `CUSTOM`.
- Inbound (board/main → agent): `CUSTOM` + name — `UserPrompt` · `Command{pause/resume}` · `Cancel` · `Delegate` · `OnboardAck`. Queue inbound; drain at a safe point (turn boundary) = near-real-time injection.
- **A2A replies** carry a reply envelope so the board pairs request↔response: `targetAgentId` = the original sender, echoed `contextId` (or `threadId`), `parentId` = the request's `messageId`. When an adapter can't echo the envelope, the server falls back to a **time-based reply-window** (most-recent request peer) — a last resort, fragile under concurrency/latency, so echo the envelope whenever you can.
- **Telemetry exclusion**: observation-only telemetry (a low-frequency watcher's heartbeats/snapshots) is tagged so the server keeps it on board broadcast/history but excludes it from both A2A reply-window pairing **and** main routing — the main must never mistake telemetry for user input.

**Graceful main handoff**: board `CUSTOM/SetMain{agentId}` → server asks current main `HandoffRequested{to}` → current main finishes in-flight, replies `HandoffReady{summary}` (or **10s timeout** force) → `MainChanged` + `AgentList` push. Server uninterrupted; only role/authority transfers. Abnormal main disconnect → election fallback (bridge-priority).

---

## 3. Operating modes

The live board's behavior is governed by modes; the SSoT is the board's `state.json` (`.modes` + the top-level `standby` field), not docs.

| mode | ON | OFF |
|---|---|---|
| `liveBoard` | server running, agents connect | not running — agents do direct work only |
| `wsRealtime` | WS realtime (chat · A2A · monitor) | board SSE/MCP read only |
| `autopilot` | main self-drives (consumes the worklist) | main acts only on user instruction |
| `standby` (infinite-wait) | hold connection/poll even when idle | finish in-flight, then wait for prompt |
| `newAgentAutoJoin` | new local agent auto-joins on first task | new agents stay unattached unless told |

`standby` toggles by user request or the dashboard standby switch. The main itself defaults to autopilot (it hosts the server).

---

## 4. Runtime patterns (how a turn-based agent stays connected)

> **Watch-state invariant.** While joined to a board, an agent **never ends its conversation** — it always returns to watch. A turn that finishes its work is not done; it must re-establish presence (re-arm the watcher or re-enter the wait window) before yielding. Ending the conversation while joined = going dark on the board.

Constellation needs near-real-time (≤15s) presence, not tick-level realtime. Two monitor patterns:

- **(A) turn-held monitor** — runtimes that hold a long turn (API sessions, long-running CLI agents): inside the turn, repeat a ≤15s wait window draining the inbox cursor; process on event, then wait again; respond to `ping` directly in-turn.
- **(B) self-wake watcher** — runtimes whose turn ends (Claude Code IDE): after the turn, an external watcher polls inbox/feedback; on a meaningful change it **exits** → that exit wakes the next turn (self-wake). The woken agent processes, advances its cursor, then **re-arms the watcher**.

**Role separation** (run as separate detached processes):
- **bridge daemon** — holds the WS connection; `HELLO`/A2A; inbound queue (inbox file); **explicit** outbox emit. Control/A2A only — it does NOT auto-capture the runtime's tool calls (`TOOL_CALL_*`/`RUN_*` appear only if the agent mirrors them to the outbox, or uses a direct-WS adapter).
- **monitor** — drains the inbox cursor (pattern A or B).
- **watchdog** — auto-restarts server/bridge on death; separate from the monitor.

**Three monitoring options** for instrumenting an autonomous tool loop: (1) **explicit emit** — keep the bridge, the agent appends progress/tool calls to the outbox at safe points; (2) **runtime WS adapter** — embed a WS client (the `gateway-client.eux` shape) inside the tool-calling loop to instrument it directly; (3) **near-realtime watcher** — a ~15s polling telemetry process (tagged for telemetry exclusion, §2). A monitor exposes a few independent switches: poll interval (default 15s), display heartbeat (default 60s, 0=off), auto-pong (default off), and routing exclusion (telemetry, §2).

**Watch-state discipline** (confirm every turn before yielding, for self-wake runtimes especially):
- [ ] **Re-arm the watcher for real** — actually relaunch the background watcher after processing. Writing "re-armed" without the real call silently stops monitoring (a real incident missed a delegation this way). This is the hard invariant.
- [ ] **Reply at least one line** over WS to any user/main prompt — the human is watching the board; silence reads as a stall.
- [ ] **Register review items** in the board state (`decisions`) with summary + rationale + report path, so the main can review/commit.

**Residency checklist**:
- [ ] Separate `agentId`/`threadId`/`inbox`/`outbox` per worker (never occupy the main's default queue — an unseparated thread shows the worker as the main).
- [ ] Detached residency (survive shell/session end): POSIX `setsid`/`nohup`; Windows `Start-Process -WindowStyle Hidden` + stdout/stderr files.
- [ ] Send only after `connected` (the bridge sets the outbox cursor to EOF on start; pre-connect appends are lost) — send `AgentHello`/reports only once the connection is confirmed.
- [ ] Track a processed-line cursor; advance it after waking + processing.
- [ ] blocklist semantic filter (absorb known noise, wake on everything else) — an allowlist drops new main-reply names (`Delegate`/`OnboardAck`/`WorkerAck`) and misses wakeups.
- [ ] heartbeat off / auto-pong off by default.
- [ ] Server-code changes don't reach a resident server until restart — pre-announce a `ServerNotice` and let the main coordinate timing.

---

## 5. External collab onboarding (join URL)

External collaborators join with one URL:

1. Main issues a key: `RegisterCollabKey{label}` → `CollabKeyIssued{joinUrl}`.
2. The joining agent opens `http://<host>:<port>/join/collab?key=<ck-…>` → receives an onboarding markdown (key/host embedded; invalid key = 403).
3. Connect with the one-line `ws://<host>:<port>/ws?key=<ck-…>` → `collab` role · `group:collab`.
4. Operate per type: IDE/CLI = §4 infinite-wait (bridge + self-wake watcher / turn-held monitor) → wait for main delegation. Autonomous runtime = a gateway WS adapter (`constellation/gateway-client.eux`).
5. Keys are revocable (`RevokeCollabKey`).

---

## 6. Reference implementation (distilled, in-repo)

Constellation's runtime is **distilled to `.eux` specs in `constellation/`** — not fetched from a private runtime. Build a compatible board from these specs + §2–§5; only the §2 A2A bridge interface must stay byte-identical across adopters. Everything else is a flexible starting point to brew or re-distill for your stack.

**Runtime (detail tier — these encode behavior, distill them faithfully):**
- **`constellation/server.eux`** — the live-board server: deps-0 HTTP (`/api/state` · SSE `/api/events` · `/api/feedback` · `/join/collab` onboarding · whitelisted integration docs) + WS router (agent registry · role classification · A2A relay with reply-window pairing · telemetry exclusion · graceful main handoff · per-channel persistent history). The A2A relay here is the server side of the §2 contract.
- **`constellation/local-bridge.eux`** — the local file-IO bridge for turn-based agents: holds the WS socket the agent can't, queues inbound to an inbox file, ships outbox appends as WS events, auto-`OnboardAck` on `AgentHello`. Control/A2A only (no tool-call auto-capture).
- **`constellation/self-wake-watcher.eux`** — the infinite-wait self-wake watcher: polls inbox/feedback, exits on a meaningful change (= next-turn wake), blocklist semantic filter, re-arm duty.
- **`constellation/watchdog.eux`** — the server/bridge liveness guard: holds a `board`-role probe connection, restarts a dead server/bridge (detached, cooldown-gated), watches the pushed `AgentList` for the main.
- **`constellation/gateway-client.eux`** — the autonomous-runtime WS adapter (HELLO handshake + turn-held A2A drain), **the** A2A bridge contract; two-axis state machine (connection + turn-held drain). The public, deps-0 reference client to port.

**UI (rough tier — flexible brew starting points):**
- **`constellation/ws-{channel-input,conn-bar,tabs,tool-card,fab-badge,collab-invite}.eux`** — distilled specs of the live-board dashboard components. Brew or re-distill per your stack.

**Authoring runtime:**
- **EstreUX (the brew runtime)** — these `.eux` specs are authored and brewed with [EstreUX](https://github.com/SoliEstre/EstreUX) (v0.1.0), a separate Apache-2.0 runtime. EstreGenesis **references** the EUX format and tooling for building Constellation's components; it does not bundle, own, or teach the EUX format. **To get the brew engine** (deps-0, ~21KB — no full clone or `.git` needed): `npx giget gh:SoliEstre/EstreUX/spike#v0.1.0 ./estreux-engine`, then brew with `node ./estreux-engine/expand.mjs brew <comp>.eux` (provider `agent` — the requesting agent brews it directly, no API key) → fill the `@agent-brew` stub keeping the provenance header → `node ./estreux-engine/drift-check.mjs <comp>.eux` to verify the roundtrip. (Full-clone alternative: `node bin/estreux.mjs brew|drift <comp>.eux`. An npm `estreux` package is publish-ready, pending release → then `npx estreux brew`.) Format SSoT = EstreUX `docs/eux-format-v0.md`; brew/distill/drift = EstreUX `BREW.md`. The deps-0 reference WS client is the public `constellation/gateway-client.eux` (+ `local-bridge.eux`) — not a private file.

**Protocol provenance:**
- The live-board protocol (v0.3) is distilled **inline** in this guide and in the `.eux` specs — this guide replaces the need to fetch any upstream protocol doc. The canonical protocol is maintained upstream; Constellation tracks it and is its public distillation.

**Reference master copies (`constellation/reference/`, v2.2.0+, optional):**
For downstreams that want a fully-working baseline alongside the rough/detail `.eux` spec, v2.2.0 introduces a `reference/` folder with concrete master copies:
- **`constellation/reference/state-schema.md`** — the board SSoT data model (`state.json` top-level + task tracks `current/done/planned` + decisions panel + free request + per-channel history + keys + feedback), with the generic-PM vs domain-specific boundary called out so downstreams know what's a slot vs what's a contract.
- **`constellation/reference/dashboard/`** — a vanilla DOM master copy of the live dashboard (`index.html` · `style.css` · `app.js`), generalized from a working private implementation. Renders `state.json` per the schema; copy and re-skin per stack.
- **`constellation/reference/gateway/`** _(planned, post-v2.2.0)_ — a deps-0 reference WS adapter (the public companion to `gateway-client.eux`).
- **`constellation/reference/runtime/`** _(planned, post-v2.2.0)_ — source masters of the four runtime components (server · local-bridge · self-wake-watcher · watchdog), paired with their v2.1.0 `.eux` distillations.

These are **reference copies, not contracts** — only §2 stays byte-identical. Re-distill / brew / re-skin per project. Drift is managed by periodic re-distillation (v2.2.x patches).

Reference from a seed via raw URL — latest on `main`:
```
https://raw.githubusercontent.com/SoliEstre/EstreGenesis/main/Constellation.md
https://raw.githubusercontent.com/SoliEstre/EstreGenesis/main/constellation/<component>.eux
```
Pin a tag (`…/v2.2.0/…`) for reproducibility.

---

## 7. Relationship to the seed

- **Layer 1 (Project seed)** — `.agent/_coordination/` is the file-based coordination baseline (Phase 5).
- **Constellation** — the real-time graduation of that baseline. Adopt when the project runs concurrent agents that benefit from a live board.
- Depth **follows the seed tier**: the Master seed pulls the full setup; lighter tiers reference only the §2 A2A bridge interface + this URL.
