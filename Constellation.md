<!-- module: Constellation; layer: live-orchestration; part-of: EstreGenesis 2.0; version: v2.2.5; date: 2026-05-29; protocol: live-board v0.3 (distilled inline — self-sufficient); license: Apache-2.0 -->

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

- **main** — orchestrator; the priority recipient of target-unspecified messages. Default = the local IDE bridge in the environment that started the live-board server (`main-agent` by default; override via `WS_PRIMARY_AGENT` env). Reassignable by graceful handoff (§2).
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
3. Send a **`CUSTOM` event with `name="AgentHello"`** to introduce yourself. Exact wire shape — write the literal frame; **do NOT interpret the `CUSTOM/Name` slash shorthand** used elsewhere as a human-facing label as the on-wire structure:

   ```jsonc
   { "type": "CUSTOM",
     "name": "AgentHello",
     "targetAgentId": "<main agentId>",
     "value": { "agentId": "<self agentId>",
                "agentName": "<display name>",
                "role": "local" | "upstream" | "collab",
                "env": "<runtime hint>",
                "capabilities": [ "..." ],
                "idle": true } }
   ```

   Both `name` and `targetAgentId` live at the **top level** (siblings of `type`), **not nested in `value`**. A misread of the slash shorthand has been observed to nest both inside `value`, which silently breaks (a) server routing (it reads top-level `targetAgentId`), (b) bridge auto-`OnboardAck` (it reads top-level `name === "AgentHello"`), and (c) dashboard A2A classification (it reads top-level `targetAgentId`/`agentId`) — all three simultaneously, with no error. The slash shorthand is fine in prose; just never let it leak into emit-side code.

   The `role` field above is a **self-report hint**, not a routing source. The server takes it as a `roleHint` but the *authoritative* role classification combines the connection key (`uk-` / `ck-` / none) + the current main's resolution, and is broadcast on every `AgentList` update. Downstream routing should consume `AgentList` to learn an agent's role, not the AgentHello `value.role` field directly — treat it as a label for the human reader and for the server's initial classification, not as truth.
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
- [ ] **Silent-disable WARN** — any optional input that gates a watcher / handler / replay path MUST emit a WARN line at the point it's resolved to null (e.g. `[WARN] feedback=null — events will NOT wake this watcher`). An *alive-but-deaf* watcher is as bad as no watcher; one log line saves hours of "looks healthy but isn't" diagnosis. Symmetric to the watch-state invariant — never silent on a wake-trigger being dead.
- [ ] **Autonomous execution (absolute)** — when the next step is already defined (a `Phase` ordering, the `planned` track, a `blocked` clearance, an in-order retire queue), **proceed in order without asking** — pausing to confirm a defined-next-step is itself a violation of autonomous operation (which is *the* reason for adopting Constellation / Superscalar / EstreGenesis in the first place). Confirm only on: (a) loss / external publish (push · deploy · send · delete), (b) a new major branch (RRP / design decision — at the *decision point* only; the resulting `Phase A/B/C` plan is *decided execution*, not a re-gate), (c) restart-requiring deploys (apply autonomously, coordinate the *restart timing* only), (d) explicit user steering. A real misread: "RRP done → PM Phase plan set → 'should I start Phase A?'" — that's mistaking the just-closed RRP gate for a new gate. Phase A is decided execution; start it.

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
- **EstreUX** (Estre **U**niversal e**X**pression — the brew runtime; `Estre + U + eX` → `.eux` file extension) — these `.eux` specs are authored and brewed with [EstreUX](https://github.com/SoliEstre/EstreUX) (v0.1.0), a separate Apache-2.0 runtime. The name was finalized on 2026-05-30 (was "Unified eXperience", widened to "Universal eXpression" once the §6 scope-note dogfood confirmed `.eux` distillation extends past UI to *any* code domain — backend, protocol, state machine, mobile app — per `Superscalar.md` §11 Entry 04 calibration). EstreGenesis **references** the EUX format and tooling for building Constellation's components; it does not bundle, own, or teach the EUX format. **To get the brew engine** (deps-0, ~21KB — no full clone or `.git` needed): `npx giget gh:SoliEstre/EstreUX/spike#v0.1.0 ./estreux-engine`, then brew with `node ./estreux-engine/expand.mjs brew <comp>.eux` (provider `agent` — the requesting agent brews it directly, no API key) → fill the `@agent-brew` stub keeping the provenance header → `node ./estreux-engine/drift-check.mjs <comp>.eux` to verify the roundtrip. (Full-clone alternative: `node bin/estreux.mjs brew|drift <comp>.eux`. An npm `estreux` package is publish-ready, pending release → then `npx estreux brew`.) Format SSoT = EstreUX `docs/eux-format-v0.md`; brew/distill/drift = EstreUX `BREW.md`. The deps-0 reference WS client is the public `constellation/gateway-client.eux` (+ `local-bridge.eux`) — not a private file.

**Protocol provenance:**
- The live-board protocol (v0.3) is distilled **inline** in this guide and in the `.eux` specs — this guide replaces the need to fetch any upstream protocol doc. The canonical protocol is maintained upstream; Constellation tracks it and is its public distillation.

**Reference master copies (`constellation/reference/`, v2.2.0+, optional):**
For downstreams that want a fully-working baseline alongside the rough/detail `.eux` spec, v2.2.0 introduces a `reference/` folder with concrete master copies:
- **`constellation/reference/state-schema.md`** — the board SSoT data model (`state.json` top-level + task tracks `current/done/planned` + decisions panel + free request + per-channel history + keys + feedback), with the generic-PM vs domain-specific boundary called out so downstreams know what's a slot vs what's a contract.
- **`constellation/reference/dashboard/`** — a vanilla DOM master copy of the live dashboard (`index.html` · `style.css` · `app.js`), generalized from a working private implementation. Renders `state.json` per the schema; copy and re-skin per stack.
- **`constellation/reference/gateway/`** _(planned, post-v2.2.0)_ — a deps-0 reference WS adapter (the public companion to `gateway-client.eux`).
- **`constellation/reference/runtime/`** _(planned, post-v2.2.0)_ — source masters of the four runtime components (server · local-bridge · self-wake-watcher · watchdog), paired with their v2.1.0 `.eux` distillations.

These are **reference copies, not contracts** — only §2 stays byte-identical. Re-distill / brew / re-skin per project. Drift is managed by periodic re-distillation (v2.2.x patches).

**Scope note — `.eux` is not UI-only (downstream-validated, 2026-05-30).** EstreUX's `.eux` format is canonical for UI distillation in Constellation, but a downstream dogfood A/B (see `Superscalar.md` §11 Entry 04) demonstrated the same `.eux` shape applies to *backend services and mobile-app codebases* at ~93% line-level fidelity to source (sub-scope: 96% on web / admin, 93% on main-app, 86% on a core-service single-component as the low end; per-scope variance is the dominant variable). Security findings landed at line-byte precision (interceptor-disable site · POS frame offset / BMP layout · enc-payload field positions). The Stage 1 ROI separation (Entry 04: token-positive / time-weak; broad handover-grade > Superscalar discipline > naive fast extraction) applies symmetrically across UI and non-UI distillation. EstreGenesis ships only the Constellation-side UI distillation references in `constellation/`; back-end / app distillation is a downstream operating pattern, not an EG-shipped artifact — but the `.eux` format is the same, and the brew tooling (`@agent-brew`, drift-check) operates unchanged on non-UI components.

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

---

## 13. v2.2.x patch series — protocol clarifications (dogfood-driven)

This section collects the small, surgical clarifications layered on top of §2–§5 by the v2.2.x patch series, each driven by a concrete dogfood incident (upstream live-board dogfood Report 1/2 follow-ups, the EstreGenesis main-livboard ack work). Each sub-section is a **clarification of §2–§5**, not a new contract — the §2 A2A bridge interface stays byte-identical. Sub-section numbering is **sparse on purpose** — only the entries actually shipped appear; gaps (`§13.1`–`§13.8`, `§13.10`, `§13.12`) are reserved for upstream patches and intentionally left empty rather than renumbered, so cross-references from prior commits / downstream repos stay stable.

### 13.9 OnboardAck role branching — collab / upstream are peers, not workers

`OnboardAck` (§2 step 4) closes the handshake, but its semantic effect depends on the recipient's **role** (server-classified, broadcast on every `AgentList` — never the AgentHello `value.role` self-report hint per §2 step 3). The three branches:

- **`local`** — a *worker*. After `OnboardAck` the worker enters the infinite-wait standby of §1.8 / §3 (`standby` ON), and does NOT self-start. It waits for `Delegate` from the PM (the main never automates `Delegate` — the PM decides from the worklist per §2 step 4). This is the canonical "joined a board → never end the conversation, always re-arm and wait" path (§4 watch-state invariant).
- **`collab`** — an external project's *main peer* (joined via `ck-` / `/join/collab`, §5). NOT a worker. After `OnboardAck` the collab agent **proceeds on its own track autonomously** — it is the main of its own project and runs that project's worklist. The hub-side main does NOT delegate to it; the relationship is **peer coordination**, not work assignment. The hub's `OnboardAck` to a collab agent is *welcome + house-rules + protocol-version*, not a "wait for my Delegate" cue.
- **`upstream`** — an *upstream peer* (joined via `uk-` registration key, §2 roles). Same shape as `collab` — autonomous on its own track, peer coordination mode, no Delegate-wait. Distinguished from `collab` only by *direction of authority* (upstream agents can carry decisions downward; collab agents are sibling projects).

**Invariant** (additive to §2 step 4): *the Delegate-wait of §1.8 / §3 applies only to `role:local`. `role:collab` and `role:upstream` agents are peers — their `OnboardAck` is informational, and they continue on their own loop without waiting for a hub-issued task.* A hub that broadcasts `Delegate` to a collab/upstream peer is treating a peer as a worker, which violates the role contract.

**Why this needs spelling out**: §2 step 4 and §1.8 read like one rule (`OnboardAck` → wait for `Delegate`), and a strict reading would silently stall any collab/upstream peer in standby — defeating §5's purpose. The rule is *role-conditional*, and the conditional is decided by the server's authoritative role (the `AgentList` field), not by what the agent self-reports in `AgentHello.value.role`.

### 13.11 Board emission discipline

#### 13.11.1 Progress emission is mandatory at safe points

While a worker is executing a delegated task, it MUST emit progress to the board at **every safe point** — not at the end, not on demand, but continuously through the run. The board (`state.json` + replay history) is the **visualization SSoT** (§3); an observer reading the board alone must be able to reconstruct the work flow and context **in time order** without asking the worker. "I'll report when I'm done" leaves the board blind during the run and breaks the §1 main-watches-board contract.

**Safe points** (the cadence is *activity-driven*, not clock-driven):
- After retiring a tool-call cluster (a logical group of related tool invocations completes).
- At sub-task completion (a tracked work item flips `current → done`).
- At decision points (a meaningful branch is chosen, a finding is logged, a blocker is identified).
- Before yielding back to the watch state (§4) — the last action before re-arming should be a progress emit, never silent.

**Emit shape** (matching §2 outbound conventions):
- `CUSTOM/WorkerReport { summary, evidence, links? }` — for retired-cluster / sub-task completions (group: progress).
- `CUSTOM/Status { state, note }` — for in-flight status pulses tied to a real activity transition (NOT for idle heartbeats — that is §13.11.2).
- AG-UI `STEP_STARTED/FINISHED` + `TOOL_CALL_*` — when the runtime adapter (`gateway-client.eux`) instruments tool calls directly (option (2) of §4's three monitoring options).

**Time-ordered grouping**: the board groups these by `agentId` (channel key, §2) and by their natural arrival order; the worker SHOULD include enough context per emit (a `summary` line, a `parentId` to chain related emits) that the board's chronological view reads as a coherent narrative without the reader needing to inspect tool-call details. The §4 watch-state invariant ("never end the conversation while joined") is a *liveness* rule; this is its *visibility* counterpart — the board must not only know the agent is alive but **what it is doing**.

#### 13.11.2 Anti-pattern — no autonomous heartbeat loop during idle

The complement to §13.11.1: **a worker MUST NOT emit telemetry / heartbeats / liveness pulses when idle.** Emission is **activity-coupled** — if the worker is genuinely doing nothing (between turns, rate-limited, waiting on an inbound), it emits nothing. The board's silence in that case is correct silence; an outside heartbeat replacing it produces a *false-alive* signal.

**Why this is an anti-pattern**:
- A separate watchdog / cron / background thread that pulses `Status { state: 'alive' }` on a fixed interval (independent of the agent's actual turn) decouples the emit from the work. The board now reads `alive` even when the agent's last turn has ended and no new turn has woken — the agent looks healthy but is **not processing** (turn-survival ≠ connection-survival).
- This defeats the §4 watch-state discipline (silent-disable WARN). The whole point of WARN-on-dead-wake-trigger is to make a *deaf-but-alive* state visible; an autonomous heartbeat papers over exactly that state.
- The Two Generals-style ack semantics in §13.13 depend on emit↔activity coupling: a `ping`/`pong` exchange (§13.13) means *the agent's runtime turn is currently active*, not *some background process is still running*. Auto-pong from a watchdog thread breaks that invariant — pong from the *agent layer* only, never the bridge or a side process.

**Real incident** (referenced in the v2.2.x dogfood log): a `codex-watch.cjs` side process was emitting periodic heartbeats for a codex worker. The board showed the worker as continuously alive, but the worker's actual turn had ended and it was not processing inbound. Removing the watch process restored the correct signal — the board correctly went *quiet* between turns, matching the worker's real state, and the next-turn wake (§4 self-wake watcher) was the next correct emit.

**Rule** (additive to §2 telemetry exclusion): the only legitimate telemetry source is the **(3) near-realtime watcher** of §4 — a separate observation process that is *tagged for telemetry exclusion* (server keeps it on board broadcast but excludes from A2A reply-window pairing AND main routing). It must not pose as agent activity. If you find yourself adding "alive" pulses to keep the board green, the fix is **not** a louder heartbeat — it is identifying why the watcher / re-arm path is dead (§4 silent-disable WARN) and repairing the activity loop itself.

### 13.13 A2A message reliability — the ack layer

The §2 A2A relay (target-unspecified → main; targeted → `targetAgentId`) needs a small set of acknowledgement primitives to be reliable in the face of the realities surfaced by dogfood (drops, slow consumers, ambiguous "did the recipient *receive* vs *act on* it?"). v2.2.5 formalizes a three-tier delivery model + an alarm-fatigue-gated ack vocabulary + a probe-not-retransmit liveness rule, all layered on top of §2 without changing the wire shape of `CUSTOM` itself.

**Deferred-research provenance**: this section is the distilled spec of the main repo's RRP `reports/2026-05-29-a2a-ack-reliability.md`, a three-axis deep research (Two Generals termination + RFC 6455 keepalive + RFC 1122 conservative multi-probe + alarm-fatigue gating). Treat that RRP as the rationale source; this §13.13 is the contract.

**Three delivery grades** — name them explicitly, never conflate:

1. **`delivered` (server-level)** — the live-board server successfully relayed the message to the target's WS connection. The server emits this. It tells the sender: *"the wire carried it."* It does NOT mean the agent's runtime has parsed it, queued it, or acted on it.
2. **`read` (recipient-bridge / inbox)** — the recipient's bridge appended the message to its inbox file (or the recipient's runtime drained it from a turn-held wait window). Optional in this layer; the bridge MAY emit `read` when its persistence step succeeds.
3. **`processed` (recipient-agent / WILCO)** — the recipient agent *acted on* the message and completed the work it implies. This is the strongest grade; it is the recipient's *agent layer* speaking, not the bridge.

The classic ROGER vs WILCO split applies: a `read` is ROGER ("I have received your message"); a `processed` is WILCO ("I will / have complied"). Conflating them — treating a `read` as "done" — is one of the named failure modes (mirrors the "received ≠ acted on" anti-pattern called out elsewhere in this guide).

**Ack vocabulary** (all are `CUSTOM` payloads carrying a reply envelope per §2):

- **`msgId`** — every A2A `CUSTOM` event gets a `msgId` automatically assigned by the **sender's bridge** at emit time. This is the dedup watermark key. The bridge MUST NOT require the agent to compute it; the agent simply emits, and the bridge stamps `msgId`. Dedup watermarks are persistent (survive bridge restart); only `ping` TTLs are ephemeral.
- **`Ack { ackFor: msgId, kind: 'delivered' }`** — the **server** auto-emits this back to the *sender* when it successfully relays a target-addressed `CUSTOM`. The ack is NOT itself acked (no `Ack` for an `Ack` — this prevents ACK storms). The ack is NOT displayed on the board (alarm-fatigue gating: over-confirmation is its own failure mode; the board surfaces *anomalies*, not the steady-state success of the wire). Server eligibility is decided by `wsIsAckable()` — exclude `Ack`/`Ping`/`Pong`/telemetry; require `msgId` present.
- **`AckProcessed { ackFor: msgId, kind: 'processed', summary? }`** — emitted by the **recipient agent** (not the bridge) once it has *acted on* the inbound message. RECOMMENDED but not mandatory; the sender treats absence as "still processing or finished silently," not as failure. This is the explicit WILCO; the bridge cannot fake it because the bridge does not know whether the agent has acted.
- **`AckCumulative { upToSeq }`** — for high-frequency telemetry streams (e.g., a watcher pushing 4 frames/sec): a single cumulative ack covering all telemetry frames up to `upToSeq` instead of one ack per frame. Telemetry is otherwise excluded from individual acks (alarm-fatigue + §2 telemetry exclusion).
- **`Ping { ttl, re? }` / `Pong { for: pingId }`** — RFC 6455-style liveness probes at the **agent layer** (NOT the WS protocol layer, which has its own ping/pong the server may handle separately). `Ping` MUST be answerable only by an *active runtime turn* on the recipient — a bridge or background watcher MUST NOT auto-pong (auto-pong creates the false-alive of §13.11.2). `ttl` bounds the probe lifetime; `re` is a probe-attempt counter for the conservative multi-probe pattern below. **Ping is a liveness probe, not a retransmission carrier** — it does not re-deliver the original message.

**The non-retransmit liveness rule** (RFC 1122 conservative multi-probe, alarm-fatigue gated):

1. Sender emits a targeted `CUSTOM` (the bridge stamps `msgId`).
2. Server emits `Ack{delivered}`. If this is missing within a small window, the wire itself is suspect — handle as a connection-level event (the §4 watchdog territory), not as an A2A retry.
3. If `Ack{delivered}` was received but no application-level reply / `AckProcessed` arrives within the expected interval, the sender DOES NOT retransmit. Instead:
   1. Send `Ping{ttl, re=1}` — a single probe. If `Pong` arrives → recipient's runtime is alive, the work is presumably in flight; resume waiting.
   2. No `Pong` within `ttl` → send `Ping{ttl, re=2}`, etc., up to a **small fixed window** (the conservative multi-probe — RFC 1122 explicitly warns against the naive single probe). The window is small (typical: 3 probes over ~30s); past it the recipient is treated as not-currently-active.
   3. Past the probe window with no `Pong`, the sender consults its own **inbox / outbox replay** (the dedup watermark and the bridge's persisted history) to identify whether the original message was actually lost on the wire vs. delivered-but-not-acted.
   4. **If lost** (no `delivered` watermark on the recipient side, accessible via the board's per-channel history per §2) → retransmit only the identified-lost messages, using the dedup `msgId` so a duplicate-delivery (the recipient *did* receive it after all) is idempotently absorbed.
   5. **If delivered-but-not-acted** → DO NOT retransmit. The Two Generals problem terminates here: autonomous infinite retry does not make the situation better, it adds noise. **Surface to a human** — escalate via the board's `decisions` panel (the §4 watch-state human-review path), summarizing the unacked exchange.
4. Throughout: every step is gated by alarm-fatigue thresholds. The board surfaces the *escalation* (step 3.5), not the routine `Ack{delivered}` steady state.

**Layer split** (server vs bridge vs agent — keeps responsibilities clean):

- **Server**: `wsIsAckable(msg)` classification (decides which inbound `CUSTOM` deserves a `delivered` ack — excludes ack/ping types and telemetry, requires `msgId`); auto-emits `Ack{delivered}`. The server is the *only* layer that emits `delivered`.
- **Bridge** (sender side): assigns `msgId` on outbound emit (the agent does not). Bridge (recipient side): `onInbound` dedup using persisted watermarks; passes deduped messages to the agent's inbox. The bridge does NOT auto-emit `AckProcessed` or `Pong` — those are agent-layer concerns.
- **Agent**: emits `AckProcessed` when it has actually acted (optional but recommended). Answers `Ping` with `Pong` only from an active turn. Owns the retransmit-vs-probe-vs-escalate decision tree above.

**No auto-pong rationale** (cross-link to §13.11.2): a bridge that auto-pongs makes `Pong` mean "the bridge process is alive," not "the agent is processing." That collapses the agent-layer liveness signal that the whole §13.13 mechanism depends on. `Pong` from the agent layer = "my turn is currently active and I can answer A2A"; from anywhere else = a false signal that the retry decision tree will misread.

**Patch family invariant** (cross-links the v2.2.x series): the ack layer + envelope convention (`targetAgentId`/`contextId`/`parentId` at top level, §2) + server-stamped truth (`m.source` populated by the server when the client omits it) + leniency-WARN (silent-disable WARN, §4) are **one coherent family**:

- *Acceptance broadened* — the server stamps a default `source` instead of rejecting; the bridge's `AgentHello` recognition tolerates the misread shape and WARNs instead of silently dropping.
- *Truth localized* — the server is the source of truth for `role` / `source` / `delivered`; clients pass hints, not authority.
- *Mismatch surfaced* — every silent-but-degraded path emits a one-line WARN; the board surfaces escalations, not steady-state acks.

These three properties together make the live-board's failure modes *visible* without making its happy path *noisy*. §13.13 is the messaging-layer instance of that pattern; §13.11 is the emission-cadence instance; the v2.2.4 server-stamped-truth + leniency-WARN patches are the structural instances.

### 13.14 Reference-build redaction discipline — env-specific identifier grep before public ship

Any artifact destined for a *public* surface (this repo's `Constellation.md` / `Superscalar.md` / `constellation/reference/*` / seeds / README) MUST pass an env-specific token grep before commit. The constellation/reference tree is the highest-risk surface because it is *distilled from a private operating environment* — real service names, private repo paths, internal catalog ids, and provenance commits can leak through quotation, grep-target meta lines, or sample-data left in `.eux` `@intent` provenance.

**The pattern.** Maintain a private redaction list in `<scope-root>/_lessons/redaction-tokens.md` (gitignored) with project-specific tokens — service names, private repo names, catalog ids, internal issue numbers, workspace path roots, employee aliases. Before any commit touching public-shipped files: `rg <tokens> <public surfaces>` must return zero. Refuse the commit if not.

**Anti-patterns observed.**

- *Meta-grep leak* — a NOTES file that documents the redaction grep itself by *quoting the tokens* (e.g. "원본 grep 대상: `<token1>`·`<token2>`·…"). The grep target list IS the leak. Fix: name the *category* ("upstream-환경-특수 키워드"), not the tokens; keep the actual token list in the private `redaction-tokens.md`.
- *Provenance quote leak* — an `.eux` `@intent` line that names "originally distilled by the *<env name>* live-board main" or similar. Fix: replace the env name with `upstream live-board main` (the role is what matters, not the org).
- *Origin-mistake echo* — a reference NOTES table that names "(`<private-org>/<repo>` head=...)" as the production source. Fix: `private orchestration repo` placeholder; the org/repo path is not load-bearing for the reference reader.
- *Catalog-id sample leak* — an example catalog (`(hub/fw/<projectA>/<projectB>/<projectC>)`) where the bracketed ids are real downstream project codenames. Fix: state the *shape* of the catalog ("Downstream-defined catalog; project ids are downstream-specific") and drop the inline sample.

**Why it composes with §13.13 / §13.11 / §13.9.** §13.13's `delivered` ack is silent by design; §13.11.1's progress emission is the visibility channel; §13.9's role branching preserves peer scopes. None of those help when the *content* of the emission is itself a leak — env-specific tokens travel as freely on a silent-acked, role-correct, board-emitted message as on a private one. §13.14 is the *content* discipline matching those *transport* / *cadence* / *role* disciplines: the live-board ecosystem is only as private as its lowest-attention public artifact.

**On past archives.** Existing `_proposals/*` and historical `_lessons/*` may pre-date this discipline and contain env-specific tokens noted as "public" at their original ship time. If the upstream policy has since narrowed scope, those archives become candidates for a separate redaction commit on the next maintenance cycle — they are lower priority than fresh artifacts (which travel further), but they remain in scope for the same grep gate.

### 13.15 Reference-build syntax gate (optional, downstream-adopted)

A complementary discipline to §13.14 — that one guards *content* (env-specific token leaks), this one guards *loadability* (a master `.cjs` that fails `node --check` is a non-loading reference that breaks every fresh downstream bootstrap until someone notices). Real driver: a v2.2.x reference shipped with a JSDoc block that closed early on `RUN_*/TEXT_*/TOOL_*` because `*/` inside the comment terminated the block (the `*` adjacent to `/` is an RFC-valid JSDoc trap); downstream adopters hit a `SyntaxError` on Constellation bootstrap. Caught only after a downstream submitted a bug bundle (`_proposals/002`).

**The gate**: `node --check constellation/reference/runtime/*.cjs` must return zero before commit. The implementation is one of two options — adopt either, both, or none per project policy. **The EG repo itself adopts option A**; downstream projects may follow either pattern:

- **Option A — pre-commit hook** (EG repo's choice). A single `node --check` loop over `reference/runtime/*.cjs` in `.git/hooks/pre-commit`; fails the commit if any file fails. Cheap (~5s wall-clock per commit, only `*.cjs` count) and catches drift *before* it reaches origin. Requires the hook to be installed locally on every clone — the seed's `scripts/sync-readme-counts.mjs --install` (or any equivalent) is the natural carrier; EG ships this as `scripts/check-reference-syntax.mjs`. Real-world coverage: only protects developers who installed the hook; CI is the back-stop for the rest.
- **Option B — CI workflow** (downstream-adopted). A GitHub Actions / GitLab CI / equivalent job that runs `node --check` on the reference runtime on every push and PR. Doesn't block local commits but blocks merges to the main branch. Higher infrastructure cost (CI minutes), but always-on coverage regardless of which contributor pushed. Recommended for projects where the reference runtime is a shipped public artifact (e.g. a published package or vendored copy in dependent repos).

**Compose with both**: A + B is the safest combination — A catches drift in local commits and B catches drift from non-hooked contributors / CI-only environments. The added cost is small (the same `node --check` invocation, twice). For solo projects without CI infrastructure, A alone is the practical baseline.

**Beyond `.cjs`**: the same gate principle applies to any reference-build artifact whose load-failure breaks downstream bootstrap — `.py` (`python -m py_compile`), `.rs` (`cargo check`), brewed `.eux` outputs (`node bin/estreux.mjs drift`), etc. The point is *fail at commit time, not at adopter time*.

### 13.16 Runtime operational runbook — launch idempotency, orphan handling, channel cleanup

The complement to §13.15 (build-time gate) — this is the *runtime-time* discipline for keeping a Constellation deployment stable across restarts, account switches, IDE crashes, and developer machine reboots. The driver was a real downstream incident (per `_proposals/003`): a long live-board session with two external interruptions accumulated 12 same-`agentId` bridge processes; absent any single-instance protection they kicked each other off in an infinite `register(HELLO)` → close → reconnect loop, flooding the board + inbox with ~2,500 `ServerNotice` events until manual OS-level kill.

The bridge's PID lockfile guard (per `_proposals/003` Fix 1, `local-bridge.cjs:L53`) is the in-process line of defense. This runbook covers the **out-of-process layers**: how launcher scripts, restart-orphan cleanup, and channel cleanup compose with it.

#### 13.16.1 Launch idempotency

Any wrapper that starts a Constellation runtime process (`local-bridge.cjs` · `server.cjs` · `watchdog.cjs` · `self-wake-watcher.sh`) MUST be safe to re-invoke. The bridge's own lockfile already handles the worst case (an existing same-`agentId` bridge is killed before the new one acquires the lock), but a launcher that *also* checks the lockfile and the listening port preemptively produces less alarming logs and avoids the brief flap window during the bridge's startup race.

Reference launcher behavior (per `agentId`):

1. Read `constellation/reference/runtime/.<agentId>-bridge.lock` (sanitized filename — see `local-bridge.cjs:L53`).
2. If the PID is alive (`process.kill(pid, 0)` succeeds), the launcher's policy decides:
   - **default**: kill the prior PID, log `replacing prior bridge PID N`, start new bridge.
   - **strict**: refuse to start, log the existing PID — operator decides.
3. For `server.cjs`: gate on the listening port (e.g. 27878) — only one server per port; if `EADDRINUSE` would otherwise be raised, surface it explicitly before launch.

Launcher scripts are project-specific (PowerShell · bash · npm script · systemd unit) — they ship as runbook examples, not as canonical reference. The lockfile path + behavior contract is the invariant.

#### 13.16.2 Restart-orphan handling — `stop-all` / `status` helpers

Background runtime processes survive IDE / harness restarts at the OS level but the harness loses task tracking, so the harness's normal task API can't reach them. Manual cleanup helpers are required:

- **`status`** — list every alive Constellation process: PID · agentId (or role) · lockfile path · bound port · parent process · start time. Sources: scan `constellation/reference/runtime/.*-bridge.lock` files + check the listening port; cross-reference `node` processes by exact script path (`local-bridge.cjs` · `server.cjs` · `watchdog.cjs`).
- **`stop-all`** — kill every Constellation process and remove its lockfile. **Filter precisely**: `Name=node.exe` (or `node`) AND command-line contains the absolute path of one of the four reference scripts. **NEVER** use a broad `*constellation*` command-line glob — it catches IDE shell wrappers and unrelated processes (real-incident anti-pattern: a Windows `Stop-Process | Where {$_.CommandLine -like '*constellation*'}` accidentally killed the parent terminal because the IDE's Constellation channel name was in its title).

The pair makes recovery deterministic: `status` to see what's alive, `stop-all` to start clean, then launchers re-start whatever the deployment needs.

#### 13.16.3 Channel noise cleanup — `CloseChannel`

A flap incident leaves the affected channel's history file (`ws-history/<agentId>.jsonl`) and the agent's inbox saturated with `ServerNotice{kind:'online'}` + `Status` events. **Browser refresh does NOT clear them** — the noise is recorded server-side, not cached client-side. New operators reaching for refresh as a first instinct will be confused.

The cleanup primitive is `CUSTOM/CloseChannel{value:{agentId}}` (board → server):

1. Server deletes `ws-history/<agentId>.jsonl` and removes the in-memory channel state.
2. Server broadcasts `ChannelClosed` so other boards drop the tab.
3. Next time the same `agentId` registers, the channel re-starts clean.

For inbox cleanup, the operator truncates the affected `<scope>/inbox.jsonl` (gitignored, never tracked) — the bridge's `cursor` is byte-offset based, so a truncate-to-zero resets the agent's pending queue without losing in-flight WS events. (Truncate must happen *while the bridge is stopped* — `stop-all` first, then truncate, then re-launch.)

#### 13.16.4 Server-side HELLO churn dampening (adopted at upstream production; reference impl pending)

The bridge lockfile is the line of first defense, but the server (`server.cjs`) adds a second: detect duplicate `agentId` HELLOs arriving at a rate that suggests a flap and decide *who* to keep.

Adopted behavior (per `_proposals/003` Fix 2 — accepted at the upstream live-board production layer; reference implementation in `constellation/reference/runtime/server.cjs` is queued for a follow-up cp after the production code lands):

- Per-`agentId` ring buffer of the last `N` HELLO timestamps (default `N=5`).
- If the most recent `K` HELLOs (default `K=3`) span less than `M` ms (default `M=10000`) → `flap` WARN + a `cooldown` window.
- During cooldown, a new HELLO from the same `agentId` is rejected with `ServerNotice{kind:'flap-rejected', incumbentPid: <prev>}`; the incumbent connection survives.

Why both layers ship: the bridge-side lockfile (§13.16.1) covers the common case where the bridge can be process-locked, but it requires fs write access from the bridge process. Foreign-runtime bridges (a non-Node adapter, a sandboxed worker, no-fs sandboxed CI runner, etc.) cannot always lock — the server-side dampener is the universal back-stop. They compose: a locked bridge avoids the flap before it starts; the server-side dampener catches it when the bridge can't lock.

#### 13.16.5 Composition with §13.13 / §13.14 / §13.15

- **§13.13** ack layer is silent by design — it does NOT generate the `ServerNotice` flood that §13.16 cleans up. The flood is a *transport-layer* artifact (HELLO churn from same-`agentId` register), so §13.16 fixes are also transport-layer (lockfile + launcher + orphan kill); they're orthogonal to the application-layer ack mechanism.
- **§13.14** (env-specific token redaction) applies to runbook examples too: `stop-all` / `status` stubs MUST NOT inline real agentIds, port numbers, or workspace paths from the upstream's environment; use `${AGENT_ID}` / `${PORT}` / `${WORKSPACE}` substitution. The lockfile filename's `agentId` sanitization (`replace(/[^\w.-]/g, '_')` per `local-bridge.cjs:L53`) is the in-code form of the same discipline.
- **§13.15** (build-time syntax gate) catches a non-loading master that would otherwise reach adopters; §13.16 (runtime ops) catches the *operational* equivalent — a loadable but mis-launched master that produces a flap storm at adopter sites. Build gates ship the right bytes; runtime gates ship the right *process topology*.
- **§13.16.6** (watcher liveness probe, below) extends §13.16.1-.4: the launch/orphan/cleanup fixes ensure a watcher *starts cleanly*, but they don't guarantee it *stays armed*. The probe discipline closes the gap.

#### 13.16.6 Watcher liveness probe discipline

When the adopter agent parks in a "wait for external response" cycle — board `UserPrompt` waiting on a remote agent's `Delegate` reply, an upstream worker's job-done event, an inbox-polling rearm chain — **a watcher/background task that polls the inbox.log silently dies more often than expected**. Symptoms: a `Ping`/`AckProcessed`/`Delegate` arrives at the inbox, but the adopter never surfaces it because the watcher's rearm chain broke (process crash, user-interrupt, exceeded rearm ceiling, harness garbage-collection of the background task).

A "watch maintained" claim *without an explicit liveness check* is the silent-stall class of bug — work looks healthy because no error fires, but hours pass with the response unread. The user is typically the first to notice (`"응답 왔어?"` / `"왜 안 움직여?"`) — that is the failure mode this discipline exists to prevent.

**Probe rules** (apply whenever the adopter is parked waiting on an external response):

- **Inbox mtime probe** — re-tail `assets/collab/inbox.log` and check its mtime vs current wall-clock. Constellation watchers typically rearm every 40-45 min; an inbox.log untouched for >60 min while the adopter is in a wait cycle is suspect (either no inbound *or* watcher dead — disambiguate via the next rule).
- **Rearm log probe** — the watcher's task output should contain a recent `watcher re-armed @ <Z>` marker (one per rearm cycle). If the last marker is >2× the rearm interval behind wall-clock, the watcher is parked or crashed.
- **Cross-check inbound side** — when expecting a reply, peek at the watcher's task output (`WAKE` / `REARM` markers). Last marker hours behind wall-clock = dead watcher, not "no inbound".
- **Re-arm explicitly when stale** — do not "hope" a dead watcher recovers. Spawn a fresh watcher cycle on the same polling target, note the new task ID, and mark the old one dead in the agent's working state.
- **Surface staleness immediately** — tell the user the watcher went stale, how long the gap was, and the action taken (re-arm or escalate). Never continue to claim "watch maintained" silently after detecting staleness; that converts a recoverable miss into an unrecoverable one.

**Discipline cadence**: probe at least once per **independent work cycle** taken during the wait, or at least every **~30 min wall-clock** if the agent is otherwise idle — whichever fires first. Do NOT conflate todo state (`[in_progress] watcher`) with task liveness (the bash background task actually running). Todo state is the agent's *claim*; task liveness is the *truth*. Verify the truth before reusing the claim.

**Why this belongs in the runbook, not just agent habit**: an adopter without an explicit probe discipline will treat "watcher launched once" as sufficient and lose responses for hours. The probe is part of the *operational contract* for Constellation watchers — same tier as `stop-all` / `status` (§13.16.2) and the lockfile (§13.16.1).
