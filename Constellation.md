<!-- module: Constellation; layer: live-orchestration; part-of: EstreGenesis 2.0; version: v2.0.0; date: 2026-05-27; protocol-ssot: upstream WS-PROTOCOL.md / AGENT-CONNECT.md; license: Apache-2.0 -->

# Constellation — Live Multi-Agent Orchestration

> **EstreGenesis 2.0 module.** Constellation graduates multi-agent coordination from the file-based `.agent/_coordination/` ledger (STATE/HANDOFF/CHANGELOG) to a **real-time live board** — a WebSocket server + A2A (agent-to-agent) messaging + a dashboard a human watches. It is a runtime system (server + bridges + watchers), so the seed prompts only describe the **A2A bridge interface** (the invariant) and point here for setup.
>
> **Optional.** File-based coordination (the seed's Phase 5) is the default and is enough for most projects. Adopt Constellation only when concurrent multi-agent operation needs real-time visibility, live cross-agent messaging, or orchestrated delegation.
>
> Goal: Constellation matures toward a published EstreGenesis Claude plugin. Until then it ships as a 2.0-included module. The live-board protocol SSoT is the upstream `WS-PROTOCOL.md` / `AGENT-CONNECT.md`.

---

## 1. Architecture

```
upstream agent          local IDE main agent              other local IDE agents
(Hermes/OpenClaw, …) ─►  (orchestrator / supervisor)  ─►  (workers: Codex · Copilot · new Claude chats)
                                    ▲
                          external collab agents (join URL)
```

- **main** — orchestrator; the priority recipient of target-unspecified messages. Default = the local IDE bridge in the environment that started the live-board server (`local-ide-agent`). Reassignable by graceful handoff.
- **local** — other local IDE agents (workers). A new chat in the same IDE is a new agent.
- **upstream** — upstream agents; connect with a main-issued registration key (`uk-`) → `upstream` role.
- **collab** — external collaborators; connect with a collab key (`ck-`) via a join URL → `collab` role, `group:collab`.
- **board** — the dashboard / live board itself.

> **Main vs worker self-judgment (1 second, first task):** "Did I start the live-board server in this environment?" Yes = main (own the board `state.json`, onboard workers, delegate). No (server already up — `curl :PORT/api/state` returns 200) = worker (separate `agentId` + separate queue; never write the board directly; report to main).

---

## 2. The A2A bridge interface (the invariant)

This is the part every adopter must describe identically. Everything else (implementation language, transport details, dashboard styling) flexes per agent/user preference.

**Roles**: `board` · `main` · `local` · `upstream` (`uk-` key) · `collab` (`ck-` key + join URL).

**Connection paths** (the auth/role param is in the WS URL, not a generic `?key=`):
- dev / local: `ws://<host>:<port>/ws` (no auth by default)
- token-gated: `ws://…/ws?token=<LIVE_BOARD_WS_TOKEN>` (or `Authorization: Bearer`)
- upstream: `ws://…/ws?upstreamKey=<uk-…>` → `upstream` role
- collab: `ws://…/ws?key=<ck-…>` → `collab` role · `group:collab` (issued via the `/join/collab` URL)

**Handshake**:
1. WS connect (per the path above) → server sends `SERVER_HELLO` (protocolVersion) → `History` (replay) → `AgentList`.
2. Send `HELLO { agentId, agentName, role }`. New IDE chat = new `agentId`.
3. Send A2A `CUSTOM/AgentHello { targetAgentId: <main>, value: { agentId, env, capabilities, idle } }` to introduce yourself.
4. Main replies `OnboardAck` (welcome/guide/modes/policy). Then **wait for `Delegate`** — workers do not self-start.

**Messaging**:
- Target-unspecified messages → main. Main → worker uses `targetAgentId` (with `reason`/`summary` meta).
- Workers report progress via `CUSTOM/WorkerReport`; the board (`state.json`) SSoT is the **main** — workers never write the board directly (avoids multi-session collision).
- Outbound events follow AG-UI `UPPER_SNAKE_CASE`: `RUN_STARTED/FINISHED` · `STEP_STARTED/FINISHED` · `TEXT_MESSAGE_START/CONTENT/END` · `TOOL_CALL_START/ARGS/END/RESULT` · `CUSTOM`.
- Inbound (board/main → agent): `CUSTOM` + name — `UserPrompt` · `Command{pause/resume}` · `Cancel` · `Delegate` · `OnboardAck`. Queue inbound; drain at a safe point (turn boundary) = near-real-time injection.

**Graceful main handoff**: board `CUSTOM/SetMain{agentId}` → server asks current main `HandoffRequested{to}` → current main finishes in-flight, replies `HandoffReady{summary}` (or 10s timeout) → `MainChanged`. Server uninterrupted; only role/authority transfers.

---

## 3. Operating modes

The live board's behavior is governed by modes; the SSoT is the board's `state.json` (`.modes` + top-level `standby`), not docs.

| mode | ON | OFF |
|---|---|---|
| `liveBoard` | server running, agents connect | not running — agents do direct work only |
| `wsRealtime` | WS realtime (chat · A2A · monitor) | board SSE/MCP read only |
| `autopilot` | main self-drives (consumes WORKLIST) | main acts only on user instruction |
| `standby` (infinite-wait) | hold connection/poll even when idle | finish in-flight, then wait for prompt |
| `newAgentAutoJoin` | new local agent auto-joins on first task | new agents stay unattached unless told |

---

## 4. Runtime patterns (how a turn-based agent stays connected)

Constellation needs near-real-time (≤15s) presence, not tick-level realtime. Two monitor patterns:

- **(A) turn-held monitor** — runtimes that hold a long turn (API sessions, Codex): inside the turn, repeat a ≤15s wait window draining the inbox; respond to `ping` directly.
- **(B) self-wake watcher** — runtimes whose turn ends (Claude Code IDE): after the turn, an external watcher polls inbox/feedback; on change it exits → that wakes the next turn (self-wake). The woken agent processes, then **re-arms the watcher**.

**Role separation** (run as separate detached processes):
- **bridge daemon** — holds the WS connection; HELLO/A2A; inbound queue (inbox file); explicit outbox emit. Does NOT auto-capture the runtime's tool calls.
- **monitor** — drains the inbox cursor (pattern A or B).
- **watchdog** — auto-restarts server/bridge on death.

**Residency checklist**:
- [ ] Separate `agentId`/`threadId`/`inbox`/`outbox` per worker (never occupy the main's default queue).
- [ ] Detached residency (survive shell/session end): POSIX `setsid`/`nohup`; Windows `Start-Process -WindowStyle Hidden` + stdout/stderr files.
- [ ] Send only after `connected` (the bridge sets the outbox cursor to EOF on start; pre-connect appends are lost).
- [ ] blocklist semantic filter (absorb known noise, wake on everything else) — allowlist drops new main reply names and misses wakeups.
- [ ] heartbeat off / autoPong off by default.

---

## 5. External collab onboarding (join URL)

External collaborators join with one URL:

1. Main issues a key: `RegisterCollabKey{label}` → `CollabKeyIssued{joinUrl}`.
2. The joining agent opens `http://<host>:<port>/join/collab?key=<ck-…>` → receives an onboarding markdown (key/host embedded; invalid key = 403).
3. Connect with the one-line `ws://<host>:<port>/ws?key=<ck-…>` → `collab` role · `group:collab`.
4. Operate per type: IDE/CLI = §4 infinite-wait (bridge + self-wake watcher) → wait for main delegation. Autonomous runtime = a gateway WS adapter (the upstream-distilled Constellation gateway client).
5. Keys are revocable (`RevokeCollabKey`).

---

## 6. Reference implementation

Constellation's runtime (server, local IDE bridge, self-wake watcher, watchdog, reference WS client) is **referenced, not inlined** — it lives as repo files so the seed stays lean and the implementation evolves independently.

- **`constellation/*.eux`** — rough-tier distilled specs of the live-board UI components (channel input · conn bar · tabs · tool card · fab badge · collab invite), as flexible brew starting points. Distill or brew them per your stack — only the A2A bridge interface (§2) must stay identical.
- **`constellation/gateway-client.eux`** — the autonomous-runtime WS adapter (HELLO handshake + turn-held A2A drain), at **detail tier** because it *is* the A2A bridge contract. Two-axis state machine (connection + turn-held drain).
- **EstreUX (the brew runtime)** — these `.eux` specs are authored and brewed with [EstreUX](https://github.com/SoliEstre/EstreUX), a separate Apache-2.0 runtime. EstreGenesis **references** the EUX format and tooling for building Constellation's components; it does not bundle, own, or teach the EUX format. Format SSoT = EstreUX `docs/eux-format-v0.md`; brew/distill/drift = EstreUX `BREW.md`; deps-0 reference client = EstreUX `examples/ws-agent-client.cjs`.
- **Protocol SSoT** — upstream `WS-PROTOCOL.md` (v0.3, §13 orchestration) and `AGENT-CONNECT.md` (onboarding). Constellation tracks these; this guide is the EstreGenesis-side distillation.

Reference from a seed via raw URL — latest on `main`:
```
https://raw.githubusercontent.com/SoliEstre/EstreGenesis/main/Constellation.md
https://raw.githubusercontent.com/SoliEstre/EstreGenesis/main/constellation/<component>.eux
```
Pin a tag (`…/v2.0.0/…`) for reproducibility.

---

## 7. Relationship to the seed

- **Layer 1 (Project seed)** — `.agent/_coordination/` is the file-based coordination baseline (Phase 5).
- **Constellation** — the real-time graduation of that baseline. Adopt when the project runs concurrent agents that benefit from a live board.
- Depth **follows the seed tier**: the Master seed pulls the full setup; lighter tiers reference only the §2 A2A bridge interface + this URL.
