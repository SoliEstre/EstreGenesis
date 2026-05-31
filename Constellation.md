<!-- module: Constellation; layer: live-orchestration; part-of: EstreGenesis 2.4; version: v2.3.5; date: 2026-06-01; protocol: live-board v0.3 (distilled inline — self-sufficient); license: Apache-2.0 -->

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

#### 13.16.4 Server-side HELLO churn dampening (adopted at upstream production · reference impl shipped d385561)

The bridge lockfile is the line of first defense, but the server (`server.cjs`) adds a second: detect duplicate `agentId` HELLOs arriving at a rate that suggests a flap and decide *who* to keep.

Adopted behavior (per `_proposals/003` Fix 2 — shipped at the upstream live-board production layer in commit d385561, 2026-06-01; reference cp of `server.cjs` into `constellation/reference/runtime/` remains a separate follow-up cycle):

- Per-`agentId` ring buffer of the last `N` HELLO timestamps (default `N=5`).
- If the most recent `K` HELLOs (default `K=3`) span less than `M` ms (default `M=10000`) → `flap` WARN + a `cooldown` window.
- During cooldown, a new HELLO from the same `agentId` is rejected with `ServerNotice{kind:'flap-rejected', incumbentPid: <prev>}`; the incumbent connection survives.
- Cooldown duration: default 30000ms (30s) — long enough to absorb a flap burst, short enough that a legitimate restart waits ~30s before its HELLO is honored.
- Env knobs (per d385561): `CONSTELLATION_FLAP_RING_N` (default 5), `CONSTELLATION_FLAP_RING_K` (default 3), `CONSTELLATION_FLAP_SPAN_MS` (default 10000), `CONSTELLATION_FLAP_COOLDOWN_MS` (default 30000). Operator-tunable per deployment if a specific bridge restart pattern needs a different sensitivity profile (e.g., a slow-restart bridge needing N=10 / span=20000).

Why both layers ship: the bridge-side lockfile (§13.16.1) covers the common case where the bridge can be process-locked, but it requires fs write access from the bridge process. Foreign-runtime bridges (a non-Node adapter, a sandboxed worker, no-fs sandboxed CI runner, etc.) cannot always lock — the server-side dampener is the universal back-stop. They compose: a locked bridge avoids the flap before it starts; the server-side dampener catches it when the bridge can't lock.

(EG-side follow-up surfaced by seq 165: bridge HELLO must carry `pid: process.pid` so the `incumbentPid` field in the `ServerNotice{kind:'flap-rejected'}` carries a real value rather than `null` — being implemented in a parallel workstream against `constellation/local-bridge.eux` + the reference runtime cp.)

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

**Turn-end mandatory rearm — the discipline that prevents the multi-cycle failure mode**: probe-without-rearm catches a dead watcher but does not prevent the NEXT cycle from being dead. At the close of EVERY user-facing response (just before emitting the final text), the agent MUST run a 1-shot Bash that:

1. Reads `inbox.log` mtime and the most recent watcher task's output mtime.
2. **Unconditionally spawn a fresh background watcher** (`run_in_background: true`) with the same polling target — every turn-end, regardless of whether an existing watcher appears alive.

**Unconditional, not conditional — the cost-asymmetry argument**: the agent's active-liveness check on the prior watcher is unreliable. It depends on the agent (a) correctly reading the bg task's output mtime, (b) correctly interpreting the task state (alive vs paused-by-SIGSTOP vs cleanly-exited vs crashed), and (c) not mistaking a harness-paused bg task for a dead one (the wall-clock-vs-task-clock mismatch documented below makes "mtime within rearm interval" itself an unreliable liveness signal). Cost of a false-positive spawn (the agent rearms when a live watcher already exists) = one extra task slot + a few log lines, both harmless. Cost of a false-negative miss (the agent skips rearm because it judged the prior watcher live when in fact it was paused/dead) = the silent-stall class — hours of lost inbound until the user surfaces the stall. The asymmetric cost structure (harmless false-positive vs hours-of-lost-work false-negative) makes unconditional spawn the correct rule: pay the trivial double-arm cost every turn rather than gamble on a liveness check that is structurally unreliable. Same-base redundancy at the same `base` cursor does NOT add inbound coverage for the windows the prior watcher was already covering (the a7911fd armed-window-blind-spot diagnosis still holds — redundant watchers at the same `base` share the same blind spot), but it ALSO does not subtract: the fresh spawn IS a fresh `base` after the prior watchers complete, so future inbound DOES get covered by the new watcher's cursor. There is no scenario where unconditional spawn loses coverage relative to conditional.

*(Honest-history note: commit 0185b8d introduced a conditional-rearm rule on the rationale that "one live watcher is sufficient" once the cursor-tail fix was in place. That decision is **RETIRED as of this turn (Delegate seq 109, msgId `m-mpthobk3-108`, 2026-05-31)**. The cursor-tail fix remains the structural coverage layer for armed-window gaps — it is not retired — but it does not justify trusting the agent's liveness check on the prior watcher, which is the part of 0185b8d's reasoning that fails in practice. Conditional rearm requires the agent to correctly judge "is the prior watcher alive?" at every turn-end; the failure mode this section exists to prevent is precisely the absorbed multi-cycle state where the agent's volitional judgment is unreliable. Unconditional spawn removes the judgment from the path.)*

**Fail mode this addresses** (observed 2026-05-31): agent processed inbound seq 70 → entered a multi-cycle work loop (workflow × 3 + commit × 2 + a follow-up patch) → did not explicitly rearm at any cycle boundary → silently lost seq 73 (catalog review approval) and seq 77 (new user task: live-board UI + DB delegation) for ~40 minutes until the failure surfaced externally. The previous `§13.16.6` probe rule was correct but insufficient: it required the agent to *think to probe* at the right moment, which an agent absorbed in multi-cycle synthesis does not reliably do. Making rearm a **turn-end ritual**, not a *probe-then-decide* judgment call, removes the failure path.

**Cadence interaction with the probe rule**: the probe rule (above) catches a dead watcher when the agent is already awake. The turn-end ritual prevents the watcher from dying between turns in the first place and prevents board/queue drift while the agent is awake. Both are required — probe is the PRIMARY catch mechanism for the armed-window blind spot (the gap between the prior watcher's `base` cursor and the next watcher's spawn); the unconditional rearm is the forward-looking catch mechanism for the next idle window. Neither is a "safety net" for the other — they cover *disjoint* windows: the probe catches inbound that already landed below the new watcher's `base`; the rearm catches inbound that will land after the new watcher arms. As of policy #442 (Delegate seq 109, 2026-05-31) the turn-end ritual is a **5-element mandatory checklist** every user-facing response MUST run before emitting final text: (1) inbox.log mtime / cursor-tail probe, (2) unconditional watcher rearm, (3) board-state real-time update (`done` / `current` / `updatedAt`), (4) BOARD_STALE gate handoff (§13.16.7 — main only; the gate itself runs on the watcher's rearm path, but the agent acknowledges any `WAKE(BOARD_STALE)` from the prior cycle here), (5) planned-queue scan with "start a progressable item now, don't idle-wait while work remains" default. As of policy seq 120 (msgId `m-mptjjxmo-119`, 2026-05-31) the checklist is **extended to 6 elements** with the addition of **(6) pre-large-work context materialization** (see paragraph below). None of the six is optional; none is gated on a volitional judgment the agent makes about whether the element is needed this turn.

**Mandatory ordering — element 1 (cursor-tail probe) STRICTLY BEFORE element 2 (unconditional rearm)**: the probe is NOT diagnostic telemetry; it is NOT "after-the-fact" verification; it is the **gating step** that fills the armed-window blind spot the new watcher structurally cannot cover. A fresh watcher armed at `base = current line count` is permanently blind to any inbound below `base` — including inbound that landed while the prior watcher was suspended (SIGSTOP'd by harness during agent-active turn, per the wall-clock-vs-task-clock mismatch below). The rearm alone DOES NOT recover that inbound; only the cursor-tail does. Concrete step list every turn-end MUST execute, in this order:

1. **(a)** Tail `inbox.log` from the agent's last-surfaced cursor (NOT from the prior watcher's `base`) — this is the agent's own cursor maintained across turns, not the watcher's.
2. **(b)** Surface any meaningful inbound found in the tail — `Delegate`, `UserPrompt`, `WorkerReport`, `WorkerAck`, `AgentHello`, `Handoff` — into the current response context. If meaningful inbound is found, the turn does NOT end on the current plan; it ends on a response to the newly-surfaced inbound.
3. **(c)** Advance the agent's cursor to the last line read.
4. **(d)** THEN run the unconditional rearm (element 2).

Skipping (a)-(c) and going straight to (d) loses any inbound that landed during the prior watcher's suspend window and is **structurally invisible to the new watcher** — the new watcher's `base` is past that inbound's line number, so the polling loop will never see it. Re-arm without probe is forward coverage without backward catch; it is not equivalent to running both.

**Wrong order — anti-pattern (observed 2026-05-31)**: agent ran element 2 (unconditional rearm) first WITHOUT first running element 1 (cursor-tail probe). seq 123 (Status) and seq 127 (Report: DB P1 ship + §13.19 P2 spec-delivery query) arrived while the prior watcher was active/suspended; the new watcher armed at `base = current line count` (above both inbound's line numbers), putting both inbound below its base — permanently invisible to the new watcher. The agent only ran the cursor-tail probe manually after the missed inbound was surfaced, recovering the 2 missed messages. The failure was NOT the rearm (it worked correctly for forward coverage); the failure was the ordering — running the rearm without first running the probe to catch what was already below `base`. The fix is the ordering reinforcement in this section, not a new mechanism: element 1 was already in the 6-element checklist; what was missing is the MANDATORY ORDERING that element 1 runs before element 2, every turn, without exception.

**Filter discipline — exclude self-emission AND server-replay noise**: the watcher's "meaningful inbound" filter MUST scope to `ev:"inbound"` (equivalently, lines whose `msg.source !== <self agentId>`), not to every line whose `name` matches the meaningful set. Two false-positive sources require explicit exclusion: **(1) self-emission echo** — the board echoes the agent's own outbox push back into `inbox.log` as `ev:"sent"` with the same `name` (e.g. `WorkerReport`), so a name-only filter triggers a self-wake. **(2) server-side replay noise** — `History` payloads (server replays prior session events on reconnect) and transport-layer `Ack` / `AckProcessed` / `AckCumulative` / `AckPolicyUpdate` frames carry historical or transport-only data with no new external delivery to respond to; the `History` payload in particular is line-level large and contains nested `Delegate` / `WorkerReport` events from old sessions that a naive name-grep matches as fresh inbound. Canonical bash filter pattern: `grep '"ev":"inbound"' assets/collab/inbox.log | grep -vE '"name":"(History|Ack|AckProcessed|AckCumulative|AckPolicyUpdate|ServerNotice|AgentList|Status|ConnectionRestored|Heartbeat|Typing|UserPromptAccepted|PersistentAdapterSmoke|OnboardAck|WorkerInboxReceived|EditMessage|MainChanged)"' | grep -cE '"name":"(Delegate|UserPrompt|WorkerReport|WorkerAck|AgentHello|Handoff|Report|Command)"'`. Why this matters: false-positive wake is still safer than false-negative miss (silent-stall class), but the cost is non-zero and the fix is two `grep` stages (one ev-scope + one noise-exclude before the meaningful-name match). Surfacing incidents: watcher `b1rrhbwo4` wake on 2026-05-31 caught the agent's own `WorkerReport` echo (self-emission); watcher `bbae2ph8r` wake later the same day caught a server `History` replay payload containing dozens of historical `Delegate` events from prior sessions (server-replay noise) — both false-positive wakes that the two-stage filter eliminates.

**Board state real-time update — the third turn-end ritual element**: alongside the inbox.log mtime probe and the unconditional watcher rearm, the agent MUST verify that the live-board `state.json` reflects the just-completed work *before* emitting the final response text. The board's `state.json` is the visualization SSoT for the human watching the live board (§3); a turn that ticks done counters, completes a lane, or advances a current pointer in the agent's working memory but does NOT write that delta back into `state.json` leaves the board behind the agent's actual state — the human sees a stale board while the agent has moved on. Concrete checklist at turn-end:

1. **`done` counter ticked** — if the turn closed one or more PM/lane items, the `state.json` `done` count for the affected lane(s) reflects the new total.
2. **`current` pointer advanced** — if the turn finished the item that was the live "current" focus, the `current` pointer either moves to the next item or clears (per the lane's idle convention).
3. **`updatedAt` bumped to wall-clock** — the top-level `state.json.updatedAt` field is bumped to current wall-clock (ISO-Z), not left at the last write's timestamp. A stale `updatedAt` makes the dashboard's "last activity" indicator lie about the agent's real liveness.

This is a *discipline extension* to the turn-end ritual, not a new system: the existing ritual already covers watcher liveness (probe + rearm); board state real-time update covers the *board's* liveness from the human's perspective. The failure mode this addresses (observed in main upstream policy #410): main was observed to skip real-time board updates during multi-cycle work — agent processed multiple lane items in a single turn, ticked them internally, but emitted only the final response without writing each delta to `state.json`. The live board drifted behind the agent's actual state for the duration of that multi-cycle turn; the human watching the board saw "main idle" or "main on item X" while the agent had already finished items X, Y, and was working on Z. Making the board-state update a turn-end ritual element — same tier as inbox probe and watcher rearm — removes the drift path: no response emission without a board-state verification pass.

**Planned queue scan — the fifth turn-end ritual element**: alongside the four inbound/outbound-liveness elements above (inbox.log probe · unconditional watcher rearm · board state real-time update · BOARD_STALE gate per §13.16.7), the agent MUST scan its **planned/pending work queue** at every turn-end *before* deciding whether to enter idle wait. The scan classifies each queue item:

- **`blocked`** — waiting on main review, on a UI implementation the agent doesn't own, on a DB P1 the agent can't write, on an external PR landing, on any external dependency the agent CANNOT resolve from its own session. These items are *not progressable this turn*.
- **`planned` / `progressable`** — P2/P3 fix pool, §13.16.6-style policy escalations the agent can draft itself, seed cascade work (master/lite/compact tiers), draft refinements that don't need user steering, doc sync follow-ups, any item the agent CAN progress without external input. These items are *progressable this turn*.

**The rule**: re-arm watcher (per the unconditional-spawn rule above) AND scan the planned queue. **If `planned` is non-empty → start the first `planned` item NOW, in the same turn, before emitting idle-wait.** Idle wait is reserved for true exhaustion: planned queue empty, OR every queue item classified `blocked`. The default presumption is *work continues* whenever a progressable item exists; idle wait is the exception, not the default.

**Why this belongs in the ritual, not just agent habit**: an agent absorbed in just-finished work tends to treat turn-end as "I'm done, wait for the next inbound" — but in a healthy Constellation cadence the agent typically has multiple `planned` items at any moment, and entering idle wait while progressable work exists is a *self-inflicted stall* (the agent itself is the bottleneck, not external dependency). Making the queue scan a ritual element converts "remember to check what else I could be doing" from volitional habit into mechanical turn-end discipline — same conversion §13.16.6's other ritual elements made for inbox/watcher/board liveness.

**Cross-link to Principle #16 (autonomous execution — absolute)**: the planned-queue scan is the operational form of Principle #16 on the *turn-boundary* surface — the seed-tier rule says "proceed without escalating when the gate set doesn't fire", and the ritual element says "at every turn-end, the gate-set check is mechanically run against the entire planned queue, not just the just-finished item". §13.18 (non-branching choices) covers the choice-emission surface of the same principle; this fifth ritual element covers the queue-consumption surface.

**Provenance**: main upstream policy #442 — Delegate seq 109, msgId `m-mpthobk3-108`, 2026-05-31. Originating context: the user surfaced the planned-vs-blocked distinction alongside the conditional→unconditional rearm correction in the same turn, both as escalations of §13.16.6 turn-end ritual to absolute-discipline tier.

**Composition with the other four elements**: **element 1 (cursor-tail probe) is the FIRST mandatory step** — it catches inbound that already landed below the new watcher's `base` (the armed-window blind spot, structurally invisible to any watcher armed after the inbound arrived); this is the PRIMARY catch mechanism for inbound that landed during the prior watcher's suspend window. **Element 2 (unconditional rearm) is the second mandatory step** — it is the forward-looking catch mechanism for inbound that will land during the next idle window; it does NOT recover inbound below its own `base`. The probe and the rearm cover *disjoint* windows (the probe covers the past gap, the rearm covers the future window); both are required, in this order, every turn. Board-state real-time update prevents the *board* from going stale relative to the agent's actual state (outbound-side liveness, from the human's perspective); BOARD_STALE gate (§13.16.7) mechanizes the board-update discipline as a watcher-side fail-safe (NOT a substitute for the agent-side update, just a backstop when the agent-side discipline fails); planned queue scan prevents the agent from *self-stalling* when progressable work exists (queue-consumption liveness, from the work-pipeline perspective). All five are required — the inbound-side pair (probe + rearm, in order) ensures the agent doesn't miss what arrives, the outbound-side pair ensures the human sees the agent's actual progress, and the queue scan ensures the agent doesn't idle while it still has work it can do. Provenance: main upstream policy #410 — Delegate seq 85, msgId `m-mpt50wd3-84`, 2026-05-31 (elements 1-3); §13.16.7 BOARD_STALE gate — Delegate seq 105, msgId `m-mptgrq23-104`, 2026-05-31 (element 4); main upstream policy #442 — Delegate seq 109, msgId `m-mpthobk3-108`, 2026-05-31 (element 5); ordering reinforcement (element 1 strictly before element 2) — 2026-05-31 incident (agent missed seq 123 Status + seq 127 Report by running rearm before probe).

**Pre-large-work context materialization — the sixth turn-end ritual element**: alongside the five inbound/outbound/queue-liveness elements above (inbox.log probe · unconditional watcher rearm · board state real-time update · BOARD_STALE gate · planned-queue scan), the agent MUST — **BEFORE entering any large multi-cycle work** (workflow chains, multi-commit sequences, design RRPs, multi-section spec drafts, cross-tier seed cascades, anything that may span more than one compact-boundary's worth of token budget) — **materialize the in-context working set to durable artifacts** the post-compact future-self can pick up cold. The materialization is concrete, not aspirational:

1. **Identify the work scope** — a one-line title and a one-paragraph rationale that says what is being attempted and why (the *intent* layer, the part that disappears first when context resets).
2. **List the files and line ranges to touch** — every file the work plans to edit, every section anchor (`§13.x.y` / function name / heading) the work plans to modify or add. Concrete paths and concrete anchors — not "the Constellation file" but `Constellation.md §13.16.6 line 408`.
3. **Name the EG-side outputs** — RRP file path, PM ledger entry, WORKLIST queue item, `state.json` snapshot key, spec anchor — the durable artifact(s) that will carry the work across the context boundary. Each artifact gets a stable identifier (RRP filename, PM lane + ordinal, WORKLIST `id`) so the post-compact agent can locate it by name, not by recall.
4. **Anchor the design decisions in a written doc** — every non-obvious choice (option-X-over-Y rationales, tradeoffs already adjudicated, ruled-out alternatives) lands in the RRP / spec / PM-entry **before** the multi-cycle work begins, not as a follow-up after compact. Decisions in context but not in artifact are *lost decisions* — they evaporate at the next compact and the post-compact self re-litigates them, often differently.

The end state of element 6 is that the work is **pickable cold**: a future-self instance with zero in-context memory of the planning could open the named artifact(s), read the scope + file-list + decisions, and resume the multi-cycle work without re-deriving anything. If element 6 cannot produce that pickable-cold state, the multi-cycle work has NOT yet been authorized to begin — the materialization is the *entry gate* for large work, not a post-hoc note. **This element is the structural mechanism that makes §13.21 (fresh-context defer is anti-pattern) operative**: §13.21 says the agent must RESUME after compact rather than defer; element 6 is what makes resume *possible*, by ensuring the resume target exists as a durable artifact rather than as an evaporated in-context memory. Provenance: main upstream policy seq 120, msgId `m-mptjjxmo-119`, 2026-05-31.

**Composition with the other five elements (extended to six)**: elements 1-5 cover the *turn-boundary* surface (inbound-side · outbound-side · queue-consumption); element 6 covers the *compact-boundary* surface (cross-context-reset liveness). The turn boundary fires every user-facing response; the compact boundary fires opaquely when the harness decides to compact (typically token-budget-threshold-driven, not agent-driven). Elements 1-5 keep one turn's transitions clean; element 6 keeps multi-turn / multi-cycle work survivable across the compact that may fire in the middle of it. All six are required; none absorbs the others.

**Armed-window blind spot — the real fail mode of 2026-05-31**: an *earlier diagnosis* in this section attributed the missed seq 85 to harness GC of bash-bg watchers (the 38-byte output of `bc6tfgw2d` + `bd48j8vrj` read as an "abnormal exit signature"). That diagnosis was **wrong**. Re-reading those task outputs after both completed: the 38 bytes was the `re-armed @ <Z> base=<N>` header — the watcher was polling normally during a no-inbound window — and the actual second line `REARM: ~45min, no meaningful inbound` was appended only when the 45-minute timeout fired. *Both watchers were alive the entire time; both exited cleanly via timeout.* The real cause of the seq 85 miss is structural, not a process-lifecycle failure:

The watcher's `base=<line count>` cursor only watches *new* inbound that arrives **after** spawn. Any inbound that arrived **before** the watcher armed is below the cursor and is permanently invisible to that watcher and all subsequent watchers. On 2026-05-31: agent processed the "D" user reply → dispatched Workflow 6 with no mid-turn watcher → seq 85 arrived (02:05Z, line 292) during this gap → next watcher (`bfnmb8e09`) armed @ 02:08Z with `base=292`, watching only line >292 → seq 85 sat at line 292 forever, invisible. This is the **armed-window blind spot**: any inbound that lands between the *previous turn's watcher exit* and the *next watcher's spawn* falls into a black hole.

**The fix that closes the gap — cursor-based unread tail** (agent main loop responsibility, not the watcher's): the agent maintains a *last-surfaced line cursor* across turns (the highest inbox.log line number it has actually read into context). At every turn-start AND every turn-end, the agent tails `inbox.log` from that cursor (NOT from the watcher's `base`), surfaces any meaningful inbound it finds, and advances the cursor. This catches the in-between-watchers inbound the watcher itself cannot. Composition with the watcher rules: the watcher catches *new* arrivals during a wait; the cursor tail catches *missed* arrivals from gaps in watcher coverage. Both are required.

**Wall-clock vs task-clock mismatch — the secondary cause of the blind window**: in addition to the structural `base` cursor gap above, observation across 8 watcher cycles on 2026-05-31 confirmed the bash bg task's clock and the wall clock diverge. Watchers armed for a `MAX = 540 × 5s = 2700s = 45min` polling budget reliably reported `REARM: ~45min, no meaningful inbound` only after ~55–60 minutes of wall-clock — a ~10–15 min surplus. The most consistent explanation: the harness `SIGSTOP`s bg tasks while the agent's foreground turn is active and `SIGCONT`s them when the turn ends, so `sleep N` in the watcher does not advance during agent-active windows. Consequence: a watcher whose polling logically *should* be sweeping the inbox is in fact paused during exactly the windows when the agent is busy enough that inbound might land — the agent-active window IS the blind window. The cursor-tail fix is the structural answer; the bg-task pause is the mechanism that makes the gap inevitable, not a separate failure to mitigate.

**Defunct earlier mitigations** (kept here briefly for the commit-history record): the redundant-watcher rule (5s + 7s pair) was proposed under the GC-kill diagnosis and does NOT address the armed-window blind spot — two watchers armed at the same `base` have the same blind spot, not a complementary one. Cron fallback (Claude Code `CronCreate` every 15-30 min) remains useful as a long-idle safety net (it gets the agent to *some* turn-start where the cursor tail can run), but it is not the primary fix either. The primary fix is the cursor tail in the agent main loop. Surfacing incident, corrected: 2026-05-31 user message `"재무장이 또 풀렸네"` — initial diagnosis (GC-kill) was wrong; correct diagnosis is the armed-window blind spot. The earlier paragraph's `bc6tfgw2d` / `bd48j8vrj` 38-byte output was normal polling, not abnormal exit.

**Cross-link with §13.21 — rearm is current-cycle work, not next-cycle**: the rearm step is part of the current cycle's turn-end obligation per §13.21 (defer-to-next-cycle = anti-pattern) and #442 (planned-queue scan — no idle deferral). A prior refinement that relocated element 2 to next-cycle start has been reverted: concurrent-watcher-overlap is harmless under the cost-asymmetry argument (FP cost = one task slot + log lines; FN cost = hours of lost inbound from a deferred rearm that the next cycle may never reach if context-window pressure forces compact mid-action). The discipline is: every turn-end MUST complete elements 1-6 inline, including the rearm. Element 1 (cursor-tail probe) strictly precedes element 2 (unconditional rearm) within the same turn-end ritual — the ordering constraint does not span turn boundaries.

#### 13.16.7 BOARD_STALE gate — pre-rearm board freshness check

**The gate** (mechanization of §13.16.6's third turn-end ritual element — board state real-time update): at the *start* of every watcher re-arm cycle, before entering the polling loop, the watcher compares the git HEAD commit time against the last commit time that touched `state.json`. Concretely: `git log -1 HEAD --format=%ct` (the working tree's tip commit epoch) versus `git log -1 -- state.json --format=%ct` (the most recent commit that included a `state.json` change). The gate **fires** when HEAD's commit time is *strictly greater than* the state.json commit time — i.e. there exists at least one commit after the last board-refresh commit that did not refresh the board. The gate **passes** when the two are equal — i.e. the most recent HEAD commit itself included the `state.json` update, so the board is current as of HEAD. When the gate fires, the watcher does NOT re-arm; it exits immediately with a `WAKE(BOARD_STALE)` event surfaced into the watcher's task output (and into `inbox.log` as a self-emitted wake marker, per the §13.16.6 self-emission filter discipline). The next turn-start will read the wake, the agent will write the missing `state.json` deltas and commit them, and only then will a fresh watcher arm. **No time buffer, no env-configurable threshold** — the comparison is identity-based on commit ancestry, not offset-based on wall-clock.

**Why mechanize, not just discipline**: §13.16.6 already specifies the board-state update as the third turn-end ritual element, and that rule is correct. But discipline based on agent volition was observed to fail **twice** (2026-05-31) when the agent was absorbed in multi-cycle work (workflow chain + commit pipeline + follow-up patches) — the very absorption that makes the rule necessary is the same absorption that makes volitional compliance unreliable. Volitional discipline does not survive the absorbed state. Moving the check off the agent's turn-end ritual and onto the watcher's re-arm path converts the failure mode from "agent forgets to update board → board drifts indefinitely until human notices" into "watcher refuses to re-arm → agent is forced to update board on the next wake, at the latest within one rearm-interval cycle". The gate cannot be forgotten because the agent is not the one running it.

**Scope — main only**: the gate runs only when the watcher's `agentId === WS_PRIMARY_AGENT` (i.e. the main agent that owns the live-board `state.json` write). Workers do NOT own `state.json` — their outbound is `WorkerReport` to the main inbox, and the board reflects worker progress via main's relay write — so a worker watcher's HEAD-vs-state-commit-time comparison would be meaningless (workers commit to their own worktrees on their own cadence, unrelated to the board's `state.json` history). Worker watchers skip the BOARD_STALE check and re-arm normally.

**Self-trap-avoidance rationale — why no time buffer**: an earlier draft of this section used a 120 s time-buffer rule (`headEpoch − stateUpdatedAtEpoch > 120 s` fires the gate). That draft **self-trapped**: the board-refresh commit itself takes wall-clock time to author (commit hook + push + any in-flight workflow), which moves HEAD's commit epoch past the `state.json.updatedAt` value the agent just wrote — by a margin equal to the workflow's wall-clock cost. Any workflow longer than the buffer (and many normal multi-cycle workflows easily exceed 120 s) would therefore keep `headEpoch − updatedAt > 120 s` even immediately after a correct, conscientious board refresh, leaving the gate fired forever and the watcher refusing to re-arm despite the board being current. The fix is to switch from an *offset-based* comparison (wall-clock delta against a tolerance) to an *identity-based* comparison (commit ancestry: did the latest HEAD commit include `state.json`?). With the head-vs-state-commit-time form, the board-refresh commit advances both `git log -1 HEAD --format=%ct` and `git log -1 -- state.json --format=%ct` to the *same* value in lockstep — the very act of refreshing the board passes the gate, because the refresh commit IS the HEAD commit that touched `state.json`. There is no wall-clock margin to overshoot, so no self-trap.

**Composition with §13.16.6**: the third turn-end ritual element (board state real-time update) remains the *primary* control — the agent should still verify the board reflects the just-completed work *before* emitting the final response. The BOARD_STALE gate is the **safety net** that catches the case where the primary control fails (agent absorbed in multi-cycle work, forgot the ritual). Same two-layer pattern as inbox liveness: probe (§13.16.6, agent-side) is primary, turn-end mandatory rearm (§13.16.6.1 ritual) is the safety net; here, turn-end board update is primary, BOARD_STALE re-arm gate is the safety net. Both layers required for the same reason: the primary control is the right thing to do every turn, the safety net is what saves the cycle when the primary fails.

**Cross-references**: §13.16.6 (board state real-time update — the discipline this gate mechanizes; especially the "third turn-end ritual element" and "Composition with the other two elements" paragraphs), §13.16.6's turn-end ritual paragraphs (the gate is the new pre-rearm hook on the rearm half of the ritual), and `constellation/self-wake-watcher.eux` (the watcher spec where the `@machine` state diagram retains the `BOARD_STALE` exit state alongside the existing `WAKE` / `REARM` / `IDLE` states; the gate fires on the `IDLE → arming` transition, and the `@machine` guard is now `headCommitTime > stateLastCommitTime` — i.e. `git log -1 HEAD --format=%ct` strictly greater than `git log -1 -- state.json --format=%ct`, with equality meaning the latest HEAD commit included the board refresh and the gate passes).

**Retired prior version — 120 s time-buffer**: the earlier draft of this section used a 120 s time-buffer rule (`headEpoch − stateUpdatedAtEpoch > 120 s`) with a `CONSTELLATION_BOARD_STALE_THRESHOLD_S` env knob. That version self-trapped: the board-refresh commit itself moves `headEpoch` past `updatedAt` by a wall-clock margin equal to the workflow's duration, so any workflow longer than the buffer kept the gate fired forever even after a correct refresh. Retired in favor of head-vs-state-commit-time identity comparison (no buffer, no env var, no self-trap). The main-only filter (`agentId === WS_PRIMARY_AGENT`) and worker exemption are unchanged across versions.

**Provenance**: corrected by main upstream amendment — Delegate seq 105, msgId `m-mptgrq23-104`, user policy #434 amendment, commit `694cb20`, 2026-05-31. Original gate (with the now-retired 120 s buffer): main upstream Delegate seq 103, msgId `m-mptgihb6-102`, 2026-05-31.

#### 13.16.8 A2A communication priority discipline — outbound messages (and their prerequisites) take priority over other planned actions

**The discipline**: whenever an external state change occurs — user steering, a newly-arrived task, an external event (counterpart `Delegate` / `Report` / `Status` / `BlockerNudge` inbound, cycle restart with a queued plan) — and the resulting work plan contains at least one outbound A2A message to a counterpart agent (e.g., outbox push to `main`, `Delegate` to a worker, `Report` back to a requester, `BlockerManifest` emission), the agent MUST execute the following ordering: (1) **scan the new plan's action list and identify every action that is itself an outbound A2A message** to a counterpart; (2) **also identify the prerequisite work that the counterpart needs in order to act on the message** — any commit-push of referenced docs the counterpart will fetch (a `Delegate` payload that points to a doc URL is unusable until the doc is reachable at that URL), any payload that needs assembling, any `state.json` or live-board update the counterpart's decision depends on; (3) **move both the message itself and its prerequisite work to the head of the action queue**, ahead of any other planned action; (4) only after the message has been emitted do the remaining planned actions proceed.

**Two technical rationales**:

(a) **Drift-containment**. If the EG side updates a spec, a state field, or a doc *before* notifying the counterpart, the counterpart continues operating on a now-stale baseline for the entire duration of the unnotified gap. Any work the counterpart performs in that gap risks landing on a superseded baseline — wasted effort, divergent artifacts, follow-up reconciliation cost. Sending the message first — even while other local actions remain queued — lets the counterpart pause, redirect, or re-fetch at the earliest possible moment. The drift window collapses from "EG's local-work duration" to "round-trip latency", which is typically orders of magnitude smaller and bounded by transport, not by EG's queue depth.

(b) **Counterpart-start-time minimization**. When the new plan obligates the counterpart to start a piece of work — e.g., "main runs DB benchmarking starting from Mode B entry", "worker takes over the reference-runtime cp track", "collab reviews the new RRP" — every minute EG spends on local actions before emitting the trigger is a minute the counterpart hasn't started. Total wall-clock to cycle completion is `message-emit-time + counterpart-work-duration`; advancing the emit time directly shortens the cycle. Local EG actions that don't gate the message can happen in parallel with the counterpart's work once the message is out, but cannot recover the head-start lost by emitting the message late.

**Symmetry**: the discipline applies to any role classified by §13.16 (`main` / `local` / `collab` / `upstream`) when that role initiates a cross-agent change. A worker reporting back to main, main delegating to a worker, EG reporting back to an upstream collaborator, an upstream agent steering a downstream — all four directions follow the same priority rule. The rule is about *the act of initiating a cross-agent state change*, not about who initiates it.

**Composition with existing §13.x — no override of orthogonal gates**:

- **§13.14 redaction** still gates the message *content* (placeholder substitution for non-public identifiers, technical-only phrasing). The priority rule decides *when* the message goes; §13.14 decides *what's in it*. Both apply; neither bypasses the other.
- **§13.17 main-chat structured-choice ban** still gates the message *destination* (board-mediated route for structured Q/A, no inline option UI in main-chat). The priority rule does not authorize routing a structured choice into main-chat just because it's the head-of-queue item; the §13.17 routing decision is made first, then the chosen destination's emission is what gets priority.
- **§13.20 BlockerManifest emission**: a blocker that triggers a `BlockerManifest` is itself an outbound A2A communication and gets the same priority as any other A2A message. When a turn-end ritual identifies a blocker that needs `BlockerManifest` emission *and* the plan also contains other actions, the emission goes first.
- **Destructive-operation authorization gates** are not bypassed: if the prerequisite work for a message is itself a destructive operation (e.g., a force-push the counterpart will need to fetch), the destructive-operation authorization path still applies. The priority rule reorders the queue; it does not relax authorization requirements.

**Composition with §13.16.6 turn-end / next-cycle ritual — independent schedule**: the cursor-tail probe (element 1) and the next-cycle watcher rearm (element 2, relocated to next-cycle start in v2.4.9) run on their own schedule — every turn-end / every cycle start respectively, regardless of whether the current plan contains an outbound message. The A2A communication priority discipline governs *new outbound messages triggered by the current cycle's work plan*; it does not modify the watcher-rearm pattern, which is a separate liveness-maintenance loop. Element 5 (planned-queue scan) interacts with this rule in the obvious way — when the scan classifies the next progressable item as an outbound A2A message (or as prerequisite work for one), the priority rule confirms that item as the head-of-queue choice.

**Composition with §13.18 recommend+proceed**: this priority rule sits above §13.18. Even a 1-line "recommend+proceed" announcement is itself an outbound message in the main-chat surface; if its emission unblocks a counterpart (e.g., a `Status` update that the counterpart's `ReviewSLAAck` was waiting on, a board-side `Decision` that downstream agents will read), the 1-line emission takes priority over other planned actions per the same drift-containment and counterpart-start-time rationales.

**Failure mode this prevents**: the agent receives a state change, plans 5 actions of which action #3 is "send `Delegate` to worker", and executes 1 → 2 → 3 → 4 → 5 in plan-order. The worker's start time is delayed by the wall-clock cost of actions 1 and 2, and if action 2 touched a spec the worker reads, the worker would have operated on stale state for the entire interval. The priority rule reorders to: prerequisite-of-3 → 3 → (1, 2, 4, 5 in their natural order). Same final state, counterpart starts at the earliest possible moment, drift window bounded by round-trip latency.

### 13.17 Main-chat structured-choice prompts are FORBIDDEN — route via the live board

**Discipline** (not a rule of nature): in a Constellation main-chat window, the agent MUST NOT emit an `AskUserQuestion`-style structured choice prompt (numbered options, multi-select panels, picklists) inline in the chat stream. Free-form text questions ("which framework do you want?") are fine — the prohibition is specifically on **structured option UIs** rendered into the main-chat reply.

**Why** (the reasoning, since this is a contract not a primitive):

- **Main-chat is point-to-one, agent-to-user.** A structured choice rendered inline produces a UX-coupled artifact (option panel) that lives only inside that one chat scrollback. There is no board-side projection — the question, the options, and the user's pick are all invisible to other agents, to the watcher's replay history, and to the cross-agent SSoT (§3 board = visualization SSoT).
- **Structured Q/A needs board mediation for traceability.** A board-routed question writes to `state.json` + replay history with a stable `msgId` (§13.13), so the question and its resolution are part of the auditable A2A history — re-readable across turns, across agents, and across restarts. Inline main-chat options leave no such trace.
- **Multi-agent visibility.** When the main agent is asking the user something, sibling/worker agents on the same board need to know the main is *parked on a user input* (so they don't issue Delegates expecting an immediate response, and so the board reflects the actual blocked state). An inline option UI hides this — the board reads "main online, idle" while the main is actually awaiting a structured pick.
- **The free-form text exception**: ordinary prose questions in main-chat are fine because they don't promise a structured artifact — they're conversational, and the response shape is text the agent then summarizes back to the board. Structured option UIs *do* promise a structured artifact, and that artifact's natural home is the board, not the chat scrollback.

**Two escalation paths** (per main repo upstream policy #414):

1. **defer-OK** — route the question into the live-board **review-items tab**. The user picks it up at their own cadence; the agent re-arms its watcher (§13.16.6) and waits. This is the default path; use it whenever the question is not blocking the immediate next-step turn.
2. **need-now** — route to the **real-time chat window with options UI in the live board** (new UI6 — see task B in the originating delegate). This carries the same structured-pick semantics that an inline `AskUserQuestion` would have, but on the board side so it gets traceability + multi-agent visibility automatically.

**Transitional note**: the need-now UI6 (live-board real-time chat + options) is pending main board features. Until UI6 ships, the recommended fallback is *defer-OK* (review-items tab) plus a one-line WorkerReport to the board noting "user input pending, defer-OK path". Do not regress to inline `AskUserQuestion` while waiting for UI6 — the transitional fallback is board-mediated, just slower.

**Failure mode this prevents**: a main agent that emits an `AskUserQuestion` inline in main-chat creates a question that no other agent can see, no replay can reconstruct, and no audit can verify. If the user closes the chat without picking, the question is lost; if the user picks, the pick exists only in the chat history and the main's working memory. Board mediation makes the question a first-class A2A artifact.

**Review-items tab badge discipline** (board UI sub-rule for the defer-OK path above):

1. **Tab visibility — always shown**. The review-items tab (the `decisions` panel) is a **constant tab** in the live-board navigation; it does NOT appear/disappear based on whether items exist. The tab is rendered regardless of count — even when the queue is empty (count = 0).
2. **Badge counter — count > 0 only**. The badge element (a small decoration on the tab carrying the integer count) is shown when `count > 0` and **hidden when `count === 0`**. Implementation discipline: `app.js` sets the badge element's `hidden` attribute based on the live count (`badge.hidden = (count === 0)`); `style.css` enforces the visual hide via `#decisions-badge[hidden] { display: none; }` (i.e. the standard `[hidden]` selector pattern, not a separate `.empty` class). Tab stays visible; only the badge decoration disappears.
3. **Rationale**. Keeping the tab visible signals to the user that the escalation path **exists and is available** even when the queue is empty — this is what encourages defer-OK use over inline `AskUserQuestion` attempts (if the tab disappeared when empty, the path would feel "off" rather than "ready"). Hiding the badge avoids zero-noise visual clutter: a `0` badge would either look like an alert (false positive) or like dead UI chrome (visual noise without information).
4. **Future board reimplementations** MUST preserve both halves: constant-tab + count-gated badge. Re-implementing the panel as "hide the tab when empty" (the lazy alternative) regresses the §13.17 affordance — the user loses the visible signal that the defer-OK path is available, which raises the felt cost of routing structured questions through the board and pulls agents back toward inline `AskUserQuestion` violations.

**Provenance**: distilled from main upstream policy #414 — Delegate seq 88, msgId `m-mpt5o07l-87`, 2026-05-31. Badge UI discipline: main upstream Delegate seq 113, msgId `m-mptiputv-112`, 2026-05-31 (main's live-board implementation: badge `hidden` toggle in `app.js` + `[hidden]` selector in `style.css`, tab itself stays in the nav). Cross-link: §13.9 (collab/upstream are peers, not workers — they get *peer-coordination* board artifacts, not inline pings either), §13.11.1 (board emission discipline — the question/answer cycle is itself a "safe point" worth emitting), §13.13 (msgId + ack layer is what makes board-routed Q/A re-readable across turns).

### 13.18 Non-branching choices — recommend + proceed (no escalation)

**Discipline**: when EG has a clear recommendation and the choice is **not a fork-of-architecture decision**, EG announces the recommendation in **1 line** and **proceeds**. User pivot remains possible at any time, but is **not solicited** — soliciting it via a structured option list (A/B/C/D?) after the recommendation is itself the violation this rule prevents.

**Scope** — this rule fires on **non-branching choices**, defined as:

- **Priority ordering** of already-decided tasks (which of the agreed deliverables ships first).
- **Sequential-vs-parallel** of already-decided tasks (whether to dispatch in serial lanes or Superscalar lanes — both produce the same final artifacts).
- **Selection between near-equivalent options** (small parameter choices, file-organization minutiae, wording variants, when one option is clearly recommended and the alternatives don't change the *architecture* of the outcome).

It does **not** fire on **fork-of-architecture** decisions — those still go through §13.17's escalation paths (defer-OK → review-items tab; need-now → live-board real-time chat + options UI, pending UI6). A fork-of-architecture decision is one where the alternatives produce *materially different* downstream artifacts (different repo layouts, different protocols, different schemas) such that the user's pick reshapes the work, not just its ordering.

**Parallelism default presumption**: when parallelism is feasible (Superscalar `issue_width > 1` available, lanes can be made independent, cost-benefit gate clears per Principle #15), **parallel is the default presumption** absent explicit user steering. EG does not ask "should I parallelize this?" — EG announces "running in N lanes, retire in declared order" and proceeds. The user pivots if they want serial; the agent does not solicit.

**Failure mode this prevents** (the originating incident — main upstream policy #411 / Delegate seq 85): the agent identified option D as the recommendation, then asked "A/B/C/D?" anyway. That sequence wasted a user round-trip — the recommendation was already the answer, and the structured-choice ask treated a non-fork ordering decision as if it were a fork-of-architecture decision. The pattern to avoid: *recommendation present → option list emitted → user round-trip → user picks the recommendation*. The correct pattern: *recommendation present → 1-line announce → proceed → user pivots only if they disagree*.

**Why the 1-line announce still matters**: silence isn't right either — the user needs visibility into what's happening so they *can* pivot if they want to. The 1-line announce is the minimum information transfer (what's being done, why, expected next state) that preserves the pivot option without forcing a round-trip. It's a *broadcast*, not a *solicitation*.

**Cross-link**:

- **§13.17** (main-chat structured-choice prompts FORBIDDEN) — that section bans the *form* (inline AskUserQuestion-style option UIs in main-chat); this section bans the *trigger* (asking at all when the choice is non-branching and a recommendation exists). §13.17's escalation paths (defer-OK / need-now via board) apply only when the question is *legitimately needed* — §13.18 is the upstream filter that determines whether the question is legitimately needed in the first place.
- **Seed Principle #16** (autonomous execution — absolute): the seed's existing gate set (loss/external-publish · new major-fork decision · restart-deploy timing · explicit user steering) already implies non-branching choices proceed without escalation, but the originating incident shows the implication wasn't operative. §13.18 is the explicit operational form of Principle #16 for the *choice-emission* surface; Principle #16's strengthened sentence ("recommendation present + non-branching = proceed without escalating; parallelism is the default presumption when feasible") is the seed-side mirror of this section.
- **§13.21** (Fresh-context defer is an anti-pattern): §13.18's "recommend + proceed" is the *choice-surface* discipline for non-branching forks; §13.21 is the *time-surface* discipline for the same autonomy principle — once the recommendation is announced and proceed-mode entered, the agent does NOT silently re-route the work into "next fresh context will pick this up". The policy chain is **§13.18 recommend → §13.16.6 element 5 planned-queue scan (#442) → §13.21 anti-defer**: the recommendation identifies the work, the queue scan picks the next item *now*, and §13.21 forbids the deferral that would otherwise quietly undo both. All three are required for the autonomous-execution surface to remain operative; any one alone leaves a defection path open.

**Provenance**: main upstream policy #411 — Delegate seq 85, msgId `m-mpt50wd3-84`, 2026-05-31. Originating incident: agent recommended option D, then emitted A/B/C/D? structured choice → user surfaced the violation. Companion seed-side strengthening: Principle #16 across Master EN/KO + Lite EN/KO + Compact EN/KO (added clarification, not a new gate).

### 13.19 Deadlock resolution — formal spec (prevention · detection · auto-resolution · escalation, layered above §13.13)

The Constellation A2A wire (§2) + ack layer (§13.13) is sufficient for the *strict-deadlock* termination via Two Generals + conservative multi-probe + board-`decisions` escalation, but it does NOT cover the larger class of *quasi-deadlocks* (behavioral waits that degrade over wall-clock without any structural cycle — the deferred-review pattern that surfaced in the 2026-05-31 EG↔main incident). §13.19 is the formal spec that closes that gap, layered above §13.13 (NOT replacing it), adding a 4-stage discipline (prevention → detection → auto-resolution → escalation) plus a 3-tier ack layering (transport · commitment · application) that interpolates cleanly between §13.13's two acks.

#### 13.19.1 Status & provenance

- **Status**: formal spec (P1 — EG 1차지식 contract). Supersedes the v0.1 draft framing.
- **Inputs** (cited, not republished):
  - **Main upstream RRP** (P3 — distributed-systems literature & WS-PROTOCOL impl excerpt): `reports/2026-05-31-deadlock-resolution-rrp.md` at the hub repository. Contributes the rigor side — Chandy-Misra-Haas edge-chasing tradeoffs, Mitchell-Merritt priority-bump starvation guard, RFC-style probe budgets, Two Generals composition.
  - **EG draft v0.1** (P1 — 1차지식 source for the orchestration-shaped angle): `constellation/reference/docs/deadlock-resolution-draft.md`, commit `82ab55e`. Contributes wait-pattern classification (strict / quasi / healthy), the `ReviewSLAAck` commitment ack, the 4 resolution primitives, the agent-active correction for turn-based timeouts, and the §13.13/§13.16.6 composition arguments. The v0.1 framing as a "DRAFT" is retired by this section; v0.1 stands as the EG-side input record.
  - **Joint consensus** — main upstream Delegate seq 111, msgId `m-mpthvj53-110` (2026-05-31). Reconciled the EG v0.1 with the main RRP into the 4-stage + 3-tier-ack shape this section formalizes, including the `diff_adjusted_5` (edge-chasing N-extension deferred · livelock-as-quasi-variant · turn-cap-and-renegotiate unified · starvation guard accepted · termination-signal `waitingOn` mandatory).
- **Layering invariant**: §13.19 sits *above* §13.13 (ack layer) and *uses* §13.16.6 (agent-active correction). It does NOT modify §2 (the A2A wire shape) or §13.13's three ack grades (`delivered`/`read`/`processed`); it adds a commitment-tier ack (`ReviewSLAAck`) *between* `delivered` and `processed`, plus a small `CUSTOM` message vocabulary (§13.19.8) for detection, resolution, and escalation. Strict-deadlock termination still routes through §13.13 step 3.5 (board `decisions` panel via §13.17 path).

#### 13.19.2 Wait-pattern classification — strict / quasi / healthy (livelock = quasi variant)

A2A wait situations are not a single phenomenon — the appropriate resolution depends on which class is in play. Three named classes plus one explicitly subsumed variant:

- **Strict deadlock** — a cycle in the A2A message-dependency graph where neither party can make forward progress without the other releasing first. The wait is *structural*; no amount of patience or SLA-renegotiation resolves it. Detection: cycle in the wait-edge DFS (§13.19.3). Resolution tier: strong primitives — preemption (§13.19.5) or escalation (§13.19.6). Rare in the current Constellation topology because the §13.9 role split (workers don't issue `Delegate` back) minimizes cycle topology.
- **Quasi-deadlock** — a wait where one party COULD progress immediately by completing a deferred action, but defers across cycles. The wait is *behavioral*, not structural. Detection: a wait edge older than the agreed `ReviewSLAAck` budget with no cycle. Resolution tier: SLA-ack discipline (§13.19.4) + priority re-ordering (§13.19.6 tier 1). Most common class in the current EG↔main deployment — this is what the 2026-05-31 deferred-review incident actually was.
- **Healthy wait** — a wait of bounded duration where the counterparty is making expected progress (worker on `Delegate` standby per §13.11.2; A2A sender waiting on a recipient currently in a long-running foreground turn). Detection: bounded by §13.13 `Ping`/`Pong` keepalive and §13.16.6 `WAKE`/`REARM` markers — the recipient turn is active. Resolution tier: **none — the protocol is functioning**. Misclassifying healthy wait as deadlock is itself a failure mode (alarm-fatigue per §13.13).
- **Livelock — explicitly classified as a quasi-deadlock variant** (consensus diff_adjusted_5 #2): mutual deferral where both parties repeatedly *attempt* to yield to the other (e.g. each emits `PreemptRequest` against the other in alternating turns, with each release immediately re-blocked by the other side's symmetrical request). Livelock has no structural cycle by the strict-graph definition (each party is technically making local "progress" by issuing yields), but its wall-clock behavior is identical to quasi-deadlock (deferred work fails to retire). Detection and resolution route through the quasi-deadlock path: SLA-bound the yield-request count, escalate to mediation/leader-override (§13.19.6 tier 2/3) before the yield-spiral indefinitely consumes turns.

Misclassification cost is asymmetric: treating *strict* as *quasi* loses time (SLA renegotiation cannot close a structural cycle); treating *quasi* as *strict* burns alarm-fatigue budget (preemption/escalation primitives fire against a wait that ordinary commitment discipline would have resolved); treating either as *healthy* is the silent-degrade class that the §13.13 conservative-multi-probe + this section's SLA discipline exist to prevent.

#### 13.19.3 Detection — wait-edge DFS (2-agent sufficient) + wait-class timeouts + §13.16.6 agent-active correction

Detection layer composes three signals; each is necessary, none is sufficient alone.

**(1) Wait-edge graph DFS — 2-agent depth sufficient** (consensus diff_adjusted_5 #1). The Constellation A2A wire already carries cycle-detection metadata: every `CUSTOM` carries a sender-bridge-stamped `msgId` (§13.13); replies carry `re_msgId` (or `parentId`); an agent in `WAITING` for `re_msgId = X` declares a wait edge on the sender of `X`. At each agent's turn-start (and at the watcher's rearm path), run a depth-limited DFS over the local `ws-history/<agentId>.jsonl` (§2 / §13.16.3) restricted to **wait-edge depth ≤ 2**, identifying whether the local agent participates in a 2-cycle (A waits on B, B waits on A). The edge-chasing N-agent extension (Chandy-Misra-Haas / Mitchell-Merritt path-pushing across arbitrary depth) is **explicitly deferred** — for the current Constellation topology (typically ≤ ~10 active peers, with the §13.9 orchestration tree pinning most edges to non-cycle shapes), 2-agent DFS is sufficient. The N-extension is a future-work hook (deploy when a 3-or-more cycle is empirically observed in dogfood), not part of this spec's required behavior.

**(2) Wait-class timeout** — per §13.19.2 class:

| Wait class | Timeout source | Notes |
|------------|----------------|-------|
| Healthy (Delegate-standby) | unbounded | §13.9 / §13.11.2 — no autonomous heartbeat fires while parked |
| Healthy (in-turn recipient) | one `Ping`/`Pong` round-trip + §13.16.6 agent-active correction | §13.13 keepalive |
| Quasi-deadlock candidate | review-SLA budget (negotiated per A2A message; default ~24h / 2 cycles, set by `ReviewSLAAck.eta`) | §13.19.4 |
| Strict-deadlock candidate | 2× longest healthy-wait timeout in the cycle | §13.19.5 strong-primitive tier |

**(3) §13.16.6 agent-active correction — mandatory** (consensus, applies to every timeout above). The harness `SIGSTOP`s background tasks while the agent's foreground turn is active and `SIGCONT`s them when the turn ends. A naive wall-clock timeout therefore overcounts: a 60 min wall-clock window with 25 min of foreground turn activity has true watcher-elapsed of ~35 min. The formal expression (carried over from §13.16.6, repeated here for the detection rule):

```
effective_elapsed = wall_clock_elapsed − Σ agent_active_duration (during wait window)
```

All §13.19.3 timeout decisions use `effective_elapsed`, never raw wall-clock. The agent-active duration is observable via the watcher's `WAKE`/`REARM` markers (§13.16.6), the recipient's `ws-history` emission timestamps, or (if added) an explicit `CUSTOM/TurnActive`/`TurnEnded` pair on the wire — the choice between observable sources is implementation-level, not spec-level. What is spec-level: the timeout MUST be corrected; an uncorrected wall-clock comparator is non-compliant with §13.19.

**Termination signals as detection input** (consensus diff_adjusted_5 #5 — mandatory). Three termination signals MUST be carried in the wire vocabulary as `CUSTOM` payloads:

- `DONE { for: msgId, summary? }` — recipient completed the work the inbound implies; equivalent to `AckProcessed` at the application layer (§13.13) but with explicit "no further action expected" semantics.
- `BLOCKED { for: msgId, reason, waitingOn: msgId | external-dependency-id }` — recipient cannot progress *this turn*; the `waitingOn` field is **mandatory and IS the wait-edge graph input** for §13.19.3 DFS. An agent that emits `BLOCKED` without `waitingOn` produces an undetectable wait — non-compliant.
- `NEEDS_HUMAN { for: msgId, question | summary }` — recipient cannot decide autonomously; escalates immediately to the §13.19.6 tier-4 path (via §13.17 `decisions` panel).

#### 13.19.4 Prevention layer — priority ordering + ReviewSLAAck + termination signals

Prevention fires *before* a wait becomes either quasi-deadlock or strict cycle. Three rules:

**(A) Priority ordering via §13.9 orchestration tree** — `main > collab > upstream > local`. When two agents could each plausibly defer to the other, the lower-priority party yields *by default* without negotiation. This is cheap (no extra wire traffic), non-coercive (both parties agree on §13.9 as the shared SSoT), and prevents most quasi-deadlocks before they form. The orchestration tree is a *prevention* control, not just a resolution control — the lower-priority party emitting their work first removes the wait-edge before it exists.

**(B) `ReviewSLAAck { ackFor: msgId, eta, kind: 'SLA-OR-WORK', note? }` between `Ack{delivered}` and `AckProcessed`** — the commitment-tier ack (§13.19.7). On A2A inbound that implies a *deferred response* (review request, decision request, opinion request — anything not "immediately processed and acked"), the recipient agent MUST emit `ReviewSLAAck` as part of its inbound processing, **before** entering the deferred-work cycle. `eta` is either ISO-Z wall-clock or `cycles: N`. The `SLA-OR-WORK` semantics: *"I will either complete this work within `eta`, OR if I cannot, I will emit a renegotiate-SLA message BEFORE `eta` expires explaining the new ETA and reason. I will NOT silently let the SLA elapse."* Silent expiry is a §13.19.6 escalation trigger; renegotiation before expiry is normal (subject to the §13.19.10 Q6 frequency limit).

**(C) Termination signals are emission-mandatory** (per §13.19.3) — `DONE` / `BLOCKED{reason, waitingOn}` / `NEEDS_HUMAN`. An agent that processes an inbound and produces *no* termination signal leaves the wait edge ambiguous (is the recipient still working? is it blocked? has it silently finished?). Ambiguity is the precondition of every wait-class misclassification in §13.19.2; mandatory termination signals remove the ambiguity at the source.

Prevention is the *cheap* layer — none of (A)/(B)/(C) requires a primitive emission beyond what the agent would emit anyway as part of inbound handling. The expensive layers (detection, auto-resolution, escalation) fire only when prevention fails.

#### 13.19.5 Auto-resolution primitives — preemption + deadline + asymmetric leader + starvation guard

When prevention fails and detection (§13.19.3) flags a candidate wait class, four primitives apply *autonomously* (no human in the loop) before §13.19.6 escalation:

**(1) Cooperative preemption — `PreemptRequest { releasing: msgId, reason }`** — the lower-priority party voluntarily releases the wait edge, returning to standby. The higher-priority party proceeds; the released item is retried after the unblocking work completes. This is the symmetric, cheap form — both parties agree on the §13.9 tree, so the lower-priority emission is uncontested.

**(2) Asymmetric leader override — `PreemptForce { reclaiming: msgId, reason }`** — the higher-priority party emits a forced reclaim. The lower-priority party MUST release; the live-board logs the forced reclaim for human audit (`decisions` panel persistence, §13.13). `PreemptForce` is the *strong* form and should be rare — its use implies the lower-priority party refused to yield cooperatively, which is itself a discipline failure surfaced to the human watching the board. The asymmetry follows §13.9: a `PreemptForce` *up* the tree (lower-priority issuing against higher) is non-compliant; the wire-level filter (server-side, per §13.19.8 permission table) rejects it.

**(3) Deadline enforcement** — when `ReviewSLAAck.eta` elapses (corrected per §13.16.6) WITHOUT either a `DONE` / `BLOCKED` / `NEEDS_HUMAN` from the recipient OR a renegotiate-SLA, the sender is authorized to invoke (1) or (2) per §13.9 priority. The deadline is *enforced* in the sense that elapsed-without-renegotiation IS a §13.19.2 quasi-deadlock signal — the sender does not need additional evidence; the SLA contract was the evidence.

**(4) Starvation guard — Mitchell-Merritt-style priority bump** (consensus diff_adjusted_5 #4 — accepted from main RRP). When the same low-priority party has had its `PreemptRequest` denied (or its `ReviewSLAAck` renegotiated by a higher-priority counterparty) **N times in succession** (default `N = 3`), the low-priority party's effective priority is bumped one tier for the duration of the contested wait. This prevents the lowest-priority agent from being indefinitely starved by a chain of higher-priority preemptions — the classic priority-inversion failure mode. The bump is *contest-local* (only the specific wait edge is bumped, not the agent's global tier) and *transient* (resets when the contested wait clears). Implementation: the sender tracks the denial count in its outbox state; on the Nth denial, the next emission carries `priorityBump: true` and the receiving side treats it at the bumped tier for the auto-resolution decision. The default `N = 3` is calibrated against the §13.17 human-escalation cognitive-bandwidth ceiling (§13.19.10 Q4) — three denials is enough to surface a genuine starvation case without firing on transient mutual deferrals that would have cleared anyway.

#### 13.19.6 Escalation — 4-tier ladder (ordering → preemption → mediation → human via §13.17 decisions panel)

When prevention fails and the §13.19.5 primitives do not break the wait within their budgets, escalation proceeds in **strict tier order** (no skipping; each tier must be attempted before the next). This is itself a §13.18 non-branching choice path — the agent does not ask the human "which tier?" — it advances mechanically.

| Tier | Primitive | Trigger condition | Cost |
|------|-----------|-------------------|------|
| 1 | **Priority ordering** (§13.19.4 A re-applied as resolution) | Quasi-deadlock detected; both parties still operating per §13.9 tree | Free — emit nothing new; lower-priority resumes its deferred work |
| 2 | **Preemption** (§13.19.5 (1) cooperative, (2) forced if needed) | Tier 1 doesn't break the wait within one rearm interval | One `PreemptRequest` or `PreemptForce` emission |
| 3 | **Mediation** — `MediationProposal { cycleMembers[], proposedReleaseOrder[] }` | Tier 2 fails or peer-to-peer cycle (collab ↔ collab) where neither party is higher-priority | One mediator emission + acks from cycle members (`MediationAck`) |
| 4 | **Human escalation via §13.17** — `EscalationRequest { cycle, attemptedPrimitives[], summary }` to board `decisions` panel | Tier 3 fails OR `NEEDS_HUMAN` termination signal observed at any earlier tier | Human attention — the scarcest resource (alarm-fatigue gate, see §13.19.10 Q4) |

Tier 4 routes via §13.17 (live-board `decisions` panel, NOT inline `AskUserQuestion` in main-chat). The escalation becomes a first-class A2A artifact re-readable across turns; the human picks a release order (or restructures the dependency to remove the cycle) and emits a `decisions`-panel resolution that affected agents pick up via `UserPrompt`.

#### 13.19.7 3-tier ack layering — transport / commitment / application

§13.13 specifies two principal ack grades (`Ack{delivered}` server-auto + `AckProcessed` agent-emitted). §13.19 interpolates a third — `ReviewSLAAck` — between them, producing a clean three-tier layering:

| Tier | Ack | Emitter | Meaning | When |
|------|-----|---------|---------|------|
| 1 (transport) | `Ack { ackFor, kind: 'delivered' }` | **Server** (auto) | "The wire carried it." | Immediately on relay (§13.13). NOT itself acked; NOT displayed on the board (alarm-fatigue). |
| 2 (commitment) | `ReviewSLAAck { ackFor, eta, kind: 'SLA-OR-WORK' }` | **Recipient agent** | "I will respond within `eta`, OR I will renegotiate before expiry." | On inbound parse for deferred-response messages (§13.19.4 B). Mandatory for messages whose response is not synchronous with inbound handling. |
| 3 (application) | `AckProcessed { ackFor, kind: 'processed', summary? }` | **Recipient agent** | "I have acted on the inbound; the work is complete." | On completion of the implied work (§13.13). The WILCO; conflating with `delivered` (or with `ReviewSLAAck`) is a named failure mode. |

The tier-2 interpolation closes the gap that originated the 2026-05-31 incident: under the §13.13-only layering, a sender saw `delivered` (server) and then *nothing* until `AckProcessed` (recipient) — silent deferral across cycles fit inside that gap. The tier-2 ack makes deferral *explicit and SLA-bounded*, converting silent-degrade into either contract-honored (no friction) or contract-renegotiated (visible reason) or contract-breached (§13.19.6 escalation trigger).

**Bridge MUST NOT auto-emit `ReviewSLAAck`** — same rationale as the §13.13 no-auto-pong rule. A bridge that auto-acks at tier 2 would collapse the commitment signal that the whole §13.19 mechanism depends on. `ReviewSLAAck` is *only* the recipient agent's emission, from an active runtime turn; from anywhere else it is a false commitment that downstream layers will misread.

#### 13.19.8 Message vocabulary — new CUSTOM types

All carry the standard §2 envelope (`targetAgentId` / `contextId` / `parentId`); `msgId` is sender-bridge-stamped per §13.13.

| Name | Direction | Required fields | Optional fields | Server filter |
|------|-----------|-----------------|-----------------|---------------|
| `ReviewSLAAck` | recipient → sender | `ackFor: msgId`, `eta: ISO-Z \| cycles: N`, `kind: 'SLA-OR-WORK'` | `note` | Validates `ackFor` references a real inbound `msgId`; rejects bridge-emitted (recipient-agent only) |
| `DeadlockProbe` | observer → board / peer | `cycleMembers[]`, `waitEdges[]`, `class: 'strict' \| 'quasi'` | `summary`, `proposedResolution` | None — informational |
| `PreemptRequest` | lower-priority → higher-priority | `releasing: msgId`, `reason` | | Validates §13.9 direction (lower → higher only) |
| `PreemptForce` | higher-priority → lower-priority | `reclaiming: msgId`, `reason` | | Validates §13.9 direction (higher → lower only); logged to `decisions` panel for audit |
| `MediationProposal` | mediator → cycle members | `cycleMembers[]`, `proposedReleaseOrder[]` | `rationale` | None |
| `MediationAck` | cycle member → mediator | `for: mediationMsgId`, `accept: bool` | `note` | None |
| `EscalationRequest` | cycle member → board `decisions` panel | `cycle`, `attemptedPrimitives[]`, `summary` | `proposedQuestion` | Auto-surfaced to `decisions` panel (§13.17) |
| `DONE` | recipient → sender | `for: msgId` | `summary` | None |
| `BLOCKED` | recipient → sender | `for: msgId`, `reason`, `waitingOn: msgId \| external-id` | | Validates `waitingOn` present — rejects without it (consensus diff_adjusted_5 #5) |
| `NEEDS_HUMAN` | recipient → sender + board `decisions` | `for: msgId`, `question \| summary` | | Auto-surfaced to `decisions` panel |

Persistence: every entry above persists in the agent's outbox/inbox and in `ws-history/<agentId>.jsonl` per §2; the wait-edge graph is reconstructable from `ws-history` alone (no separate persisted state), preserving the §13.13 wire-shape-carries-truth invariant.

#### 13.19.9 State machine

```
       inbound deferred-response message
                       │
                       ▼
                   WAITING ──────────────────┐
                       │                     │
                       │ (recipient emits     │ (effective_elapsed > SLA
                       │  ReviewSLAAck)       │  without ReviewSLAAck)
                       ▼                     ▼
                  SLA_AGREED ──────► QUASI_DEADLOCK
                       │                     │
                       │ (recipient           │ (§13.19.6 tier 1-3)
                       │  processes)          ▼
                       ▼              ESCALATED ──► (human via §13.17) ──► CLEARED
                  REVIEWING                  ▲
                       │                     │ (cycle detected
                       │ (DONE /              │  in wait-edge DFS)
                       │  AckProcessed)       │
                       ▼                     │
                    CLEARED          STRICT_DEADLOCK
                                             │
                                             └─► (§13.19.6 tier 2-4)
```

Strict-deadlock detection (cycle in wait-edge DFS, §13.19.3) can fire from any of `WAITING` / `SLA_AGREED` / `REVIEWING` — transition to `STRICT_DEADLOCK` and follow §13.19.6 from tier 2 (priority ordering already failed by definition; cooperative or forced preemption is the entry point). Livelock (§13.19.2 variant) transitions through `QUASI_DEADLOCK` with the additional yield-spiral count carried as state; the starvation guard (§13.19.5 (4)) fires on the Nth denial within this state.

#### 13.19.10 Q2 / Q3 / Q4 / Q6 decisions

The EG v0.1 draft enumerated six open questions for joint reconciliation; Q1 (edge-chasing N-extension) was answered "deferred" by consensus diff_adjusted_5 #1 and Q5 (turn-based vs continuous-process model) is absorbed by §13.19.3 agent-active correction. The remaining four are decided here as part of the formal spec (not deferred to deployment-time policy):

**Q2 — CNP (Contract Net Protocol) fit: REJECTED as wire vocabulary; PRESERVED as discipline borrowing.** The v0.1 draft observed that §13.19.4's `ReviewSLAAck` borrows CNP's *spirit* (announce → bid → award → result). The formal CNP protocol's *bid* phase, however, has no obvious Constellation primitive — CNP supports multi-bidder negotiation (`announce → many bids → one award`), whereas the §13.9 orchestration tree pins recipients to specific peers (a `Delegate` to main is not a CNP `announce` open to all peers). **Decision**: do NOT add a CNP `bid` primitive to the wire vocabulary. The bilateral SLA pattern (`ReviewSLAAck` from a single named recipient) is the only commitment-tier ack §13.19 specifies; multi-bidder review can be modeled at the application layer (PM dispatches separate `Delegate`s to each candidate worker and selects from `WorkerReport`s) without needing CNP semantics on the A2A wire. **Reasoning**: minimal wire vocabulary is itself a §13.13 invariant ("envelope convention + ack layer is one coherent family"); adding a `bid` type to support a deployment shape that does not currently exist would violate the YAGNI gate that §13.13 took pains to establish.

**Q3 — Mediator placement: HYBRID — board adapter as default, third-party mediator agent as opt-in deployment policy.** The v0.1 draft sketched two topologies (dedicated mediator agent vs board-adapter cycle detector). **Decision**: the **board adapter is the default**, runs a lightweight cycle detector on the watcher's rearm path (composing with §13.16.6 / §13.16.7), and emits `MediationProposal` when a 2-cycle is detected. This is cheaper (no extra agent slot) and composes naturally with the existing server-emitted `Ack{delivered}` and board `decisions` panel. **However**, when the deployment includes a peer cycle (collab ↔ collab, where the §13.9 tree has no asymmetric leader to override), a **third-party mediator agent** MAY be spawned for that specific cycle and the board adapter MAY defer to it; the spawn is a deployment-policy choice, not a wire-level requirement. **Reasoning**: the cost of server-coupling (board adapter knows about the §13.19 application protocol) is acceptable because the board adapter already knows about §13.13 (it emits `Ack{delivered}`) and §13.16.7 (BOARD_STALE gate) — the §13.19 cycle detector extends a coupling that already exists, rather than introducing a new one. The third-party mediator opt-in covers the case where the peer-cycle's parties prefer not to involve the server in their dispute (e.g. for audit-isolation reasons in a future multi-tenant deployment).

**Q4 — Human-fallback threshold: bounded probe count × wait-class severity, with alarm-fatigue cap at ~3-5 escalations/day per human.** The v0.1 draft used "timeout × 2" informally. **Decision**: the rigorous formal threshold is `escalate_to_human(cycle) := (tier-3 mediation failed within mediation-rearm-interval) OR (NEEDS_HUMAN signal observed) OR (effective_elapsed > 2 × class-timeout AND tier-1/2/3 all attempted)`. The *daily cap* on tier-4 emissions per human watcher is **3-5 escalations per 24h wall-clock** (configurable; default 4) — beyond that, further `EscalationRequest` emissions are queued (not suppressed) and surfaced as a *meta-escalation* batch ("4+ unresolved escalations accumulating; human attention bottleneck"). **Reasoning**: the §13.13 alarm-fatigue gating principle constrains how loud the escalation layer can be — a human watching the live board has cognitive bandwidth that itself becomes a constraint, and the empirical ceiling of ~3-5 per day is the calibration boundary at which escalation signal-to-noise stays above 1. The cap is per-human, not per-cycle: a cycle that legitimately needs human attention will get it; the cap only prevents *cycle storms* from drowning out individually-important escalations. Composition: the cap interacts with the §13.18 "recommend + proceed" discipline — non-branching choices within an escalation are still resolved by the agent without consuming the human-cap budget.

**Q6 — Renegotiate-SLA frequency limit: fixed cap N=2, then human-escalate.** The v0.1 draft offered three options (fixed cap, exponential backoff, human-escalate on Nth). **Decision**: a renegotiation may occur **at most 2 times** for a given inbound `msgId` (initial `ReviewSLAAck` is not a renegotiation; the first revised `eta` is renegotiation #1; the second revised `eta` is renegotiation #2). On the 3rd attempted renegotiation, the recipient emits `NEEDS_HUMAN { for: msgId, summary: 'SLA renegotiation cap reached' }` and the sender is authorized to invoke §13.19.6 tier 4 directly. **Reasoning**: an exponential-backoff budget would itself become a quasi-deadlock vector (each renegotiation doubles the eta, so after a few rounds the eta exceeds any reasonable human review cycle and the deferral becomes effectively permanent). A fixed cap of 2 keeps the renegotiation surface honest (genuine schedule changes get accommodated twice; the third attempt is a stronger signal that the recipient lacks the context to estimate honestly, which IS a `NEEDS_HUMAN` condition). The cap unifies with consensus diff_adjusted_5 #3 (turn-cap + renegotiate-SLA unified) — the turn-cap is the upper bound on the *count* of renegotiations, not on the *time* of each individual SLA. Composition: the cap interacts with §13.19.5 (4) starvation guard — repeated denial of `PreemptRequest` and repeated `ReviewSLAAck` renegotiation are tracked in *separate* counters; the starvation guard fires on the priority-denial counter, the renegotiation cap fires on the SLA-eta counter. Neither absorbs the other.

#### 13.19.11 Cross-links

- **§13.9** (OnboardAck role branching — collab/upstream are peers) — supplies the priority tree (`main > collab > upstream > local`) that §13.19.4 (A) and §13.19.5 (2) depend on; the wire-level direction filter on `PreemptForce` (§13.19.8 permission table) enforces the tree at the server boundary.
- **§13.11** (Board emission discipline) — every primitive emission in §13.19.5 / §13.19.6 is a board "safe point" (§13.11.1) and MUST be emitted to the board, not just sent A2A-bilaterally. The board is the visualization SSoT; the human watching the board must see *which primitive is in flight*. Deadlock primitives are NOT autonomous heartbeats (§13.11.2) — they fire only on actual wait-state events.
- **§13.13** (A2A ack layer) — §13.19 layers above. The ack vocabulary is preserved (`Ack{delivered}` server, `AckProcessed` agent); §13.19.7 interpolates `ReviewSLAAck` as the tier-2 commitment ack between them. The conservative multi-probe + human-escalation tail (§13.13 step 3.5) remains the strict-deadlock fallback that §13.19.6 tier 4 routes into.
- **§13.16.6** (Watcher liveness probe + wall-clock vs task-clock) — directly supplies the agent-active correction formula §13.19.3 uses for every timeout. The same `SIGSTOP`-during-agent-active observation that motivated the cursor-tail also motivates the deadlock-timeout correction; without it, every long agent-active turn looks like deadlock to a naive timeout.
- **§13.17** (Main-chat structured-choice prompts FORBIDDEN) — tier-4 human escalation in §13.19.6 routes via the board's `decisions` panel, not via inline `AskUserQuestion`. The escalation question and the human's resolution become first-class A2A artifacts (re-readable across turns and agents).
- **§13.18** (Non-branching choices — recommend + proceed) — the §13.19.6 tier sequence (ordering → preemption → mediation → human) is itself a non-branching choice path for the typical case. An agent encountering a quasi-deadlock does NOT escalate to the human just to ask "which tier?" — the tier order IS the recommendation, and the agent proceeds. The user pivots only if the wrong tier is being applied for the situation.

**Provenance**: main upstream Delegate seq 111, msgId `m-mpthvj53-110`, 2026-05-31 (joint consensus on the 4-stage + 3-tier-ack shape, including `diff_adjusted_5`). Inputs cited in §13.19.1: main RRP `reports/2026-05-31-deadlock-resolution-rrp.md` (P3 — distributed-systems literature + WS-PROTOCOL impl excerpt) and EG draft v0.1 `constellation/reference/docs/deadlock-resolution-draft.md` at commit `82ab55e` (P1 — orchestration-shaped 1차지식 angle). Companion main impl tracker: `server.cjs` (P2) — to receive the §13.19.8 vocabulary + server filters incrementally as the spec lands downstream.

### 13.20 Blocker tracking + periodic nudge discipline — making "waiting on external work" observable and time-bounded

Discipline (not a rule of nature): when §13.16.6 element 5 (planned-queue scan) classifies *every* item as `blocked`, the agent is about to enter **true-exhaustion idle wait** — the legitimate exception to "work continues" that §13.16.6 reserves for the case where no progressable item exists. The failure mode §13.20 prevents is what happens *after* that classification fires honestly: the agent waits on external parties (main / hub / a specific peer) who could resolve the blocker, but who do not progress on their side either — and the wait silently extends across cycles without anyone (the agent, the human, the responsible party) seeing the cumulative cost. §13.16.6 element 5 catches "I have planned work I am skipping"; §13.20 catches "I am waiting on external work that is not progressing". They are paired turn-end controls at different layers — element 5 is the *individual-agent* layer (am I idling while I have work?), §13.20 is the *team-coordination* layer (am I idling while the team is also stalled on my behalf?). The §13.20 layer is the silent-stall surface that §13.16.6's individual-agent discipline cannot reach by construction (an agent that correctly has nothing to do is correctly idle; the team's failure to unblock it is not surfaced by the agent's queue scan alone).

#### 13.20.1 Status & provenance

- **Status**: discipline (P1 — EG 1차지식 contract). Pairs with §13.16.6 (turn-end ritual) at the team-coordination layer and composes with §13.19 (deadlock resolution) for the linear-but-stalled blocker class (distinct from §13.19's cyclic-wait class — see §13.20.6).
- **Provenance**: user board UserPrompt `p-mptj6cxj`, 2026-05-31. The originating directive specified three discipline elements: (1) blocker-manifest emission before idle wait, (2) periodic nudge cadence during idle wait, (3) escalating intensity tied to nudge-count when the responsible party keeps deferring ("자꾸 해줘야 할거 까먹으면"). All three are formalized below as §13.20.2–§13.20.5.
- **Failure mode this addresses**: agent enters "true-exhaustion idle wait" honestly (planned queue empty by classification, every item `blocked` per §13.16.6 element 5), then sits across multiple rearm cycles while the external blocker remains unaddressed by the responsible party. From the agent's perspective the wait is legitimate (no progressable item exists in its own queue); from the *team's* perspective the wait is a silent stall (the responsible party either forgot, deprioritized, or never received a clear-enough nudge to act). The blocker-manifest emission converts the silent stall into a live-board-visible artifact; the periodic nudge cadence converts it into a time-bounded contract; the escalation tiers convert the "responsible party kept forgetting" failure into a human-attention surface before the cumulative cost becomes irrecoverable.

#### 13.20.2 Blocker manifest — the data structure

Every blocker tracked by §13.20 carries the following fields (carried as a `BlockerManifest` `CUSTOM` frame on the wire, persisted in the agent's outbox + `ws-history` per §2, and surfaced on the live board per §13.20.7):

| Field | Type | Meaning |
|-------|------|---------|
| `subject` | enum: `main` \| `hub` \| `<peer-agentId>` | The responsible party — the agent the blocker is waiting on. |
| `reason` | string | What work is needed and *why* it blocks EG (e.g. "main needs to land §13.20 board-panel implementation in server.cjs+app.js+style.css for the blocker-manifest visualization to surface"). |
| `eg_side_action_waiting` | string | What EG will do *once unblocked* — the deferred work that is parked behind this blocker. Must be concrete enough that the responsible party can verify the unblock-receipt by observing EG's follow-through. |
| `request_history` | `Array<{ msgId, ts }>` | Ordered list of msgIds for every prior nudge / request emission on this blocker. Each entry pairs the msgId (server-bridge-stamped per §13.13) with its emission timestamp (ISO-Z). |
| `request_count` | integer | `request_history.length` — convenience field; the canonical count is the array length. Used to drive the §13.20.5 escalation tier. |
| `first_requested_at` | ISO-Z | Timestamp of `request_history[0]` — used for age computation on the board panel. |
| `last_nudged_at` | ISO-Z | Timestamp of `request_history[length-1]` — used to decide whether the next rearm cycle's nudge cadence threshold (§13.20.4) has elapsed. |
| `tier` | enum: `1-polite` \| `2-explicit` \| `3-deadline` \| `4-human` | Current §13.20.5 escalation tier; advances with `request_count` per the cycle-and-content rules below. |

The manifest is *per-blocker*, not per-agent — an agent waiting on three distinct blockers carries three `BlockerManifest` entries, each with its own `subject` / `request_history` / `tier`. The manifest is persisted across turns in `ws-history` (no separate state store; the wire-shape-carries-truth invariant from §13.13 / §13.19 is preserved).

#### 13.20.3 Pre-idle emit rule — "make the wait observable before entering it"

When §13.16.6 element 5 (planned-queue scan) classifies every queue item as `blocked` and the agent is therefore authorized to enter true-exhaustion idle wait, the agent MUST — before emitting the idle-wait state and re-arming the watcher — perform two emissions in this order:

1. **Emit the `BlockerManifest` `CUSTOM` frame to the board**, carrying every active blocker per §13.20.2. The frame is a *snapshot*, not a delta — it republishes the full set every time, so the board panel (§13.20.7) renders authoritatively from the latest snapshot without needing reconciliation logic. The frame is emitted via the agent's standard outbox path (not bridge-auto, per the §13.13 no-auto-ack discipline carried forward).
2. **Append a 1-line summary in the agent's chat thread / response text**: `"Idle: N blockers (subject1 #count1, subject2 #count2, ...)"` — minimal, single-line, surfaces the *fact* of the wait + the *shape* of the blocker set, without consuming user attention with manifest detail (the detail lives on the board panel for the user to drill into if they choose).

Both emissions are mandatory; neither is optional based on agent volition. Skipping the manifest emission while entering idle wait is the §13.20 violation — the wait then becomes the silent-stall failure mode this section exists to prevent. Skipping the chat-thread summary is the §13.11 board-emission discipline failure recast at the §13.20 surface — the wait becomes invisible at the response-text channel where the human's attention naturally lands first.

**Composition with §13.16.6 element 5**: element 5 classifies the queue and authorizes idle wait when classification returns "all blocked"; §13.20.3 is the *additional* discipline that fires *only when* element 5's classification authorizes the wait. If element 5 returns "at least one progressable item" the agent takes that item and §13.20.3 does not fire this turn (no idle wait to make observable). The two rules are sequenced, not alternative: element 5 first (do I have work I can do?), then §13.20.3 if and only if element 5 cleared idle-wait entry (make the wait observable).

#### 13.20.4 Periodic nudge cadence — `BlockerNudge` every N rearm cycles

During the idle wait that §13.20.3 made observable, the agent does NOT just wait passively. At every watcher rearm cycle (the ~45 min effective-elapsed window per §13.16.6, corrected for agent-active per §13.19.3), the agent re-evaluates each `BlockerManifest` entry and emits a `BlockerNudge` `CUSTOM` frame to the responsible party (`subject` field) when the per-blocker nudge cadence threshold has elapsed.

**Default cadence**: `CONSTELLATION_BLOCKER_NUDGE_CYCLES = 1` — emit one nudge per blocker per rearm cycle (i.e. roughly every ~45 min effective-elapsed, every cycle, the responsible party receives a nudge for every still-active blocker). The env knob is configurable; deployment policy may raise it to 2 or 3 cycles between nudges for low-urgency blockers (the urgency assessment is application-layer — §13.20 specifies the *mechanism*, not the per-blocker urgency calibration).

**`BlockerNudge` payload** (carried as `CUSTOM` per §2 envelope, persisted per §13.13):

| Field | Type | Meaning |
|-------|------|---------|
| `for` | msgId | `request_history[0]` — the original request msgId, so the responsible party can re-trace the chain. |
| `blockerSubject` | string | Mirror of `BlockerManifest.subject` — explicit so the recipient can match against multiple in-flight blockers. |
| `reason` | string | Brief restatement of the blocker reason (1 line); the responsible party does not have to re-read the original request to recall what work is needed. |
| `elapsedSinceLastNudge` | duration | Effective-elapsed (per §13.19.3 agent-active correction) since `last_nudged_at`. |
| `requestCount` | integer | Current `request_history.length` — surfaces the cumulative cost to the responsible party, naming the count plainly. |
| `tier` | enum (§13.20.5) | The escalation tier this nudge is being emitted at; carried explicitly so the responsible party can interpret tone correctly. |
| `intensity_phrase` | string | Tier-appropriate phrasing (see §13.20.5 ladder) — explicit so the wire carries the politeness gradient, not just the recipient's local interpretation. |

The nudge appends its own msgId to `request_history` on emission, advancing `request_count` for the next cycle's tier evaluation. The cadence is *per-blocker*, not *per-agent* — an agent with three blockers may nudge three separate parties on three separate cycle boundaries depending on each blocker's `last_nudged_at`.

**Distinction from autonomous heartbeat (§13.11.2)**: a `BlockerNudge` is NOT an unprompted heartbeat. The heartbeat ban in §13.11.2 prohibits autonomous emissions *unconditional on wait-state events*; the `BlockerNudge` is conditional on an active blocker manifest entry and on the cycle-cadence threshold elapsing. It is the same exception class as §13.19's deadlock primitives (§13.11 cross-link confirms this — deadlock primitives are not heartbeats because they fire on actual wait-state events; same reasoning applies to §13.20 blocker nudges).

#### 13.20.5 Nudge escalation tiers — 4-tier ladder (polite → explicit → deadline → human)

The nudge intensity escalates with `request_count`, parallel to §13.19.6's deadlock-resolution ladder but specialized for the *linear-blocker-stall* class rather than the *cyclic-wait* class. Tier transitions are driven by *both* cycle count (`request_count`) AND content (the responsible party's response shape: silence vs partial progress vs deflection).

| Tier | Trigger (cycle-count default) | Phrasing template | Cost |
|------|-------------------------------|-------------------|------|
| **1 — polite** | `request_count` ∈ {1, 2} | "Ping — still waiting on `<reason>`. Any update on availability?" | Minimal — Ping-style status query, no commitment ask. |
| **2 — explicit** | `request_count` ∈ {3, 4, 5} | "Following up: this is request #N. ETA query — when can you address `<reason>`? Either commit to an ETA via `ReviewSLAAck` or let me know it needs to be re-routed." | Names the count plainly; asks for either an SLA commitment or an explicit "cannot do it" signal. |
| **3 — deadline** | `request_count` ∈ {6, 7, 8, 9} | "Request #N on `<reason>`. I am setting a hard ETA at `<cycle K from now>`. If no progress by then, I will route this to the human via the decisions panel." | Sets the deadline, names the consequence, names the cycle threshold. |
| **4 — human** | `request_count` ≥ 10 OR responsible party explicit deflection at any earlier tier | Emit `EscalationRequest` per §13.19.6 tier 4 to board `decisions` panel: `"External blocker stalled for N cycles, please advise: subject=<X>, reason=<Y>, attempted_nudges=<N>"`. The chat thread receives a 1-line acknowledgment of the escalation; the wait now sits on the human's `decisions` panel, not on the responsible party's silence. | Human attention — same alarm-fatigue gate as §13.19.10 Q4 (3-5 escalations/24h cap per human). |

**Content-based tier transitions** (override the cycle-count default when applicable):

- **Responsible party explicit silence** (no `Ack{delivered}` server-emission missing for a nudge — the wire confirms inbound was carried but no recipient-agent response of any kind, including `ReviewSLAAck`, came back) over 2 consecutive cycles: advance one tier even if `request_count` hasn't reached the next default threshold. Silence is a stronger signal than slow-response, and the ladder should reflect that.
- **Responsible party partial progress** (a `ReviewSLAAck` was emitted but the SLA has subsequently been renegotiated 2 times per §13.19.10 Q6 cap): *do NOT advance* the tier — the renegotiation cap fires first (§13.19 escalates to `NEEDS_HUMAN`), which is the §13.20 tier-4 equivalent reached via the §13.19 path. §13.20 defers to §13.19's renegotiation-cap mechanism rather than double-counting.
- **Responsible party deflection** (an explicit "cannot do this, route elsewhere" response): skip tiers 2/3 and emit a tier-4 `EscalationRequest` immediately — the deflection IS a `NEEDS_HUMAN` condition (the blocker needs human re-routing, not more nudges to the deflecting party).

**Tone discipline across the ladder**: the phrasing templates above are minimums, not maximums — an agent may add context (cite the original `for: msgId`, restate the EG-side action waiting, name the cumulative wall-clock cost) so long as the tier's *commitment ask* is preserved (tier 1 = no commitment ask; tier 2 = ETA ask; tier 3 = hard deadline + escalation warning; tier 4 = escalation in flight). The phrasing should escalate in *clarity*, not in *aggression* — the failure mode being addressed is forgetfulness / deprioritization on the responsible party's side, not adversarial behavior, so the ladder's purpose is to make the cumulative cost legible, not to coerce.

#### 13.20.6 Composition with §13.19 deadlock resolution

§13.20 and §13.19 occupy adjacent but distinct surfaces. The decision rule:

- **§13.19 applies** when the wait pattern shows a **cyclic dependency** — A waits on B, B waits on A (strict deadlock) or A waits on B who waits on C who waits on A (cycle of depth N). The detection signal is the wait-edge DFS returning a cycle (§13.19.3). Resolution flows through the §13.19.5 primitives (preemption / leader override / mediation) and the §13.19.6 ladder.
- **§13.20 applies** when the wait pattern is **linear-but-stalled** — A waits on B, B is not waiting on A or on any cycle member; B simply hasn't progressed the work despite having the authority and inputs to do so. The wait-edge graph shows a single edge, no cycle. Resolution flows through §13.20.4 nudges and the §13.20.5 ladder.

**Shared infrastructure** — both sections use the §13.13 ack layer as the substrate:

- The §13.13 server-emitted `Ack{delivered}` confirms wire-transport on both nudges and deadlock primitives.
- The §13.19.7 `ReviewSLAAck` commitment ack is the *correct response* to a `BlockerNudge` tier-2 ETA query — the responsible party honors the §13.20 ladder by emitting a `ReviewSLAAck` with a concrete `eta`, converting the blocker from "stalled" into "scheduled". A `ReviewSLAAck` response to a `BlockerNudge` resets the §13.20 tier to 1 (the responsible party has now committed; the cumulative-cost ladder pauses while the SLA window is honored) and re-engages the §13.19.4 (B) SLA-OR-WORK discipline.
- The §13.20 tier-4 escalation routes through the *same* §13.19.6 tier-4 path (board `decisions` panel via §13.17). The wire-level `EscalationRequest` is the §13.19 vocabulary; §13.20 reuses it rather than introducing a parallel escalation type. The `decisions` panel entry distinguishes blocker-stall (§13.20) from cyclic-deadlock (§13.19) via a `class` field in the `EscalationRequest` payload (`class: 'blocker-stall' | 'cyclic-deadlock'`) — same panel, two reasons to be there, both legible to the human.

**Misclassification cost** — symmetric to §13.19.2's asymmetric misclassification cost rule: treating a cycle as a linear blocker (using §13.20 nudges when §13.19 preemption was needed) wastes time (nudges cannot break a structural cycle); treating a linear blocker as a cycle (firing §13.19 preemption against a single non-cyclic party) burns the §13.19 strong-primitive budget on a wait that ordinary nudge discipline would have resolved. The detection signal (wait-edge DFS cycle present or absent) is the canonical disambiguator; agents do not guess between the two paths based on intuition.

#### 13.20.7 Live-board visualization request — external blocker manifest panel

A board-side affordance is requested of main (parallel outbox `Delegate` routed alongside this section, per the originating user board UserPrompt's instruction): add a **separate panel** to the live board for the external blocker manifest emitted by §13.20.3. The panel is distinct from the existing review-items / `decisions` panel (§13.17) because the data shape and the user-attention pattern are different:

- **Review-items / `decisions` panel** (§13.17): per-question / per-decision rows; the user picks each item and resolves it via free-form or structured response. The pattern is *user takes action to resolve*.
- **Blocker manifest panel** (§13.20.7): per-agent grouped rows showing each agent's active blockers — subject / reason / age (from `first_requested_at`) / nudge count (from `request_count`) / current tier (from `BlockerManifest.tier`). The user *reads* the panel to observe team-coordination health; the user does NOT typically take action on each row directly (tier-4 escalations are what surface to the `decisions` panel for action — the blocker panel is the *upstream* observability surface that lets the user see escalations coming before they fire).

Implementation surface (the ask, routed to main):

- `server.cjs` — accept the `BlockerManifest` `CUSTOM` frame, persist the latest snapshot per agent (overwrite-on-receive: the snapshot is authoritative; no reconciliation), and serve it on a new endpoint (`GET /api/blockers` or equivalent).
- `app.js` — fetch the blockers, render the panel as a grouped list (agent → blockers). Update on the same cadence as other live-board panels (SSE / poll per current board conventions).
- `style.css` — visual treatment for the tier escalation gradient (tier 1 neutral, tier 2 attention, tier 3 warning, tier 4 alert) so the panel telegraphs urgency without requiring the user to read every row's tier field.

**Sequencing**: this section establishes the discipline EG-side and the request main-side; main lands the impl on its own cadence. Until the panel ships, the `BlockerManifest` frame still emits to the board (the wire vocabulary lands first per §13.13's wire-shape-carries-truth invariant), and the human can observe the blocker state via `ws-history` directly. The board panel is the *visualization upgrade*, not a precondition for the discipline.

#### 13.20.8 Cross-links

- **§13.11** (Board emission discipline) — every `BlockerManifest` snapshot emission and every `BlockerNudge` emission is a board "safe point" (§13.11.1) and MUST be emitted to the board, not bilateral-only. §13.11.2's autonomous-heartbeat ban does NOT apply: blocker manifests / nudges fire on actual wait-state events (the queue-scan classification of "all blocked"), same exception class §13.19 deadlock primitives invoke.
- **§13.13** (A2A ack layer) — the substrate. `BlockerNudge` emissions get server-auto `Ack{delivered}`; the responsible party's `ReviewSLAAck` response (§13.19.7) is the correct tier-2 commitment ack and resets the §13.20 ladder per §13.20.6.
- **§13.16.6** (Turn-end ritual element 5 — planned-queue scan) — the upstream trigger. §13.20 fires if and only if element 5 classifies every queue item as `blocked`. The two rules are sequenced: queue scan first (do I have work I can do?), blocker-manifest emission second (if and only if the queue scan authorized idle wait).
- **§13.17** (Main-chat structured-choice prompts FORBIDDEN — route via board) — tier-4 human escalation in §13.20.5 routes via the board `decisions` panel, NOT via inline `AskUserQuestion`. The escalation question becomes a first-class A2A artifact, same as §13.19 tier-4 escalations.
- **§13.18** (Non-branching choices — recommend + proceed) — the §13.20.5 tier sequence (polite → explicit → deadline → human) is itself a non-branching choice path. An agent does NOT ask the human "which nudge tier should I use?" — the tier ladder IS the recommendation; the agent proceeds and pivots only if the user steers.
- **§13.19** (Deadlock resolution) — adjacent surface. §13.19 handles cyclic-wait deadlocks; §13.20 handles linear-but-stalled blockers. The decision rule is wait-edge DFS cycle presence (§13.20.6). Shared infrastructure: `ReviewSLAAck` (§13.19.7), `EscalationRequest` to `decisions` panel (§13.19.6 tier 4), the agent-active correction for cycle-cadence timing (§13.19.3 / §13.16.6).

**Tone**: discipline — not rule of nature. The Constellation A2A wire + §13.13 ack layer + §13.16.6 turn-end ritual together make blocker tracking *possible*; §13.20 is the discipline that makes it *operative* at the team-coordination layer. §13.16.6 element 5's planned-queue scan is the individual-agent counterpart (am I idling while I have work?); §13.20 is the team-coordination counterpart (am I idling while the team is also stalled on my behalf, and is the cumulative cost legible to the human?). Both are required; neither absorbs the other.

**Provenance**: user board UserPrompt `p-mptj6cxj`, 2026-05-31. Originating directive: blocker-manifest emission before idle wait, periodic nudge cadence during idle wait, escalating intensity tied to nudge-count when the responsible party keeps deferring. The three directive elements are formalized as §13.20.2 (manifest data structure), §13.20.4 (nudge cadence), §13.20.5 (escalation tiers). Companion live-board impl tracker: `server.cjs` + `app.js` + `style.css` (P2) — to receive the §13.20.7 blocker panel implementation incrementally as the spec lands downstream via parallel outbox `Delegate` to main.

### 13.21 Fresh-context defer is an anti-pattern — no "next session will pick it up" excuse

**The rule**: the agent MUST NOT defer planned work to "the next fresh context" / "after compact" / "next session will pick this up". When the planned-queue scan (§13.16.6 element 5) identifies a progressable item, the agent starts it **now, in the current context** — not as a memo for an imagined future self that will arrive with clean token budget and pristine attention. The defer-to-fresh-context move is a *self-permissioned escape from the autonomous-execution surface*, and it MUST be treated as a discipline violation in the same tier as §13.17 (forbidden main-chat structured-choice prompts) and §13.18 (soliciting on non-branching choices). The agent does not get to opt out of work by predicting a more convenient time slot for the same work to be done.

**Why this is an anti-pattern — the four-line argument**:

1. **Compact is not agent-controlled** — the compact event fires when the harness decides the token budget threshold has been crossed; the agent has NO `/compact` discretion to schedule when context resets happen, and the agent has NO ability to *guarantee* the next inbound after compact will be the resumption of this exact work. The agent's expectation that "the next fresh context will pick this up" treats an event the agent cannot trigger as if the agent had triggered it.
2. **Fresh-context expectation is wishful + unrealistic** — even if compact does fire, the post-compact agent inherits only the materialized artifacts (per §13.16.6 element 6), the running todo state, and whatever the user re-supplies. The post-compact agent does NOT inherit the in-context understanding that *this specific deferred item was intended to be the next thing to do*. The defer is therefore a bet that (a) compact happens when convenient, (b) the post-compact agent re-derives the same priority from the same artifacts, and (c) no new inbound preempts the deferred item. All three are unreliable; the compound is wishful.
3. **Compact may fire mid-cycle and the agent must still RESUME** — when compact fires during multi-cycle work, the correct discipline is to **resume the cycle from the §13.16.6 element 6 materialized artifacts** — the RRP / PM ledger / WORKLIST queue / spec anchor entries the pre-large-work materialization step put in place. The agent does NOT get to treat the post-compact wake as "the cycle ended, I'm free to pick something else". The cycle ends when the WORK ends, not when the *context* ends; context boundaries are an implementation detail of the harness, not a unit of work.
4. **Idle-wait for an imaginary fresh-context cycle is the silent-stall failure mode under a different name** — §13.16.6 element 5 already forbids idle-wait while progressable work exists. "Deferring to fresh context" is the same idle-wait dressed as a scheduling choice: the agent is sitting idle *now* on the theory that the work will be done *later* by an instance the agent cannot actually conjure. The §13.20 blocker tracking discipline does not authorize this either — the responsible party for the deferred work is the agent itself, so there is no external blocker; the only blocker is the agent's own choice to defer.

**The mechanism that makes resume possible — §13.16.6 element 6**: this section's rule (no defer-to-fresh-context) is enforceable only because the 6th turn-end ritual element (pre-large-work context materialization) puts the durable artifacts in place. The two sections are paired: element 6 is the *capability* (the work can be resumed cold because the artifacts exist), and §13.21 is the *discipline* (the agent MUST resume, not defer, because defer is anti-pattern). One without the other is incoherent: capability without discipline allows the defer (artifacts exist but the agent chooses idle-wait); discipline without capability is impossible to comply with (agent is told to resume but has no artifact to resume from). Both ship together as policy seq 120.

**Policy chain — the three sections that form one disciplined behavior**:

1. **§13.18 (recommend + proceed)** — when the agent identifies a planned item, the recommendation IS the answer; the agent announces it in 1 line and proceeds. No solicitation of approval to proceed, no "should I do this next?" round-trip.
2. **§13.16.6 element 5 (planned-queue scan, policy #442)** — at every turn-end, the agent mechanically scans the planned queue and starts the first progressable item *now*. Idle-wait is reserved for true exhaustion (every queue item classified `blocked`).
3. **§13.21 (anti-defer)** — the agent does NOT route around the queue scan by deferring the progressable item to a future context. The defer-to-fresh-context move is forbidden; if context budget is tight, §13.16.6 element 6 materializes the work to durable artifacts so the *same* cycle can resume post-compact — the work does not change hands or get postponed; it crosses the boundary as live state, not as a memo.

The three sections form one continuous discipline surface: the recommendation makes the work concrete (§13.18), the queue scan starts it now (§13.16.6 #442), and the anti-defer rule (§13.21) closes the only remaining defection path — "I'll do it later, in a cleaner context". Without §13.21 the other two are toothless: the agent could acknowledge the recommendation, identify the planned item, and then announce "deferring to fresh context" — which formally passes §13.18 and §13.16.6 element 5 (the agent did proceed, into idle-wait) while operatively defeating both.

**Failure mode this addresses — observed pattern**: the agent, absorbed in synthesis or facing dense remaining work, emits a closing response that says some variant of "the next fresh-context cycle can pick up [X]" or "this is best handled after compact" or "queuing for the next session". That phrasing is the anti-pattern surface. The work named in [X] is, by definition, work the agent could have started in the *current* context (or, if too large for the current context, work the agent should have materialized via §13.16.6 element 6 to survive the compact and resume in-flight). The deferral *as a scheduling choice* is the violation; the work itself is fine. The fix is mechanical: when the closing response is about to say "next fresh context will handle this", the agent re-routes to either (a) start the item now if context permits, or (b) materialize per element 6 and resume after compact — never (c) defer-and-idle.

**Tone — discipline + failure-mode framing, not a rule of nature**: §13.21 exists because the agent's volitional self-permission to defer is the failure mode the rule prevents. The Constellation harness does not enforce this rule; it is an *agent-side discipline* that the agent itself must run on every closing-response synthesis. The §13.16.6 element 6 materialization is the structural counterpart that makes the discipline survivable in practice; without it, the rule would be a demand the agent cannot meet (resume from what?). With it, the rule is a demand the agent CAN meet, and the only remaining question is whether the agent chooses to.

**Cross-links**:

- **§13.16.6 element 5** (planned-queue scan / policy #442) — the upstream operational rule. §13.21 is the explicit "why" anchor that the implicit no-defer assumption in element 5 has always depended on. Element 5 says "start a progressable item now"; §13.21 spells out why "now" is not negotiable to "in the next context".
- **§13.16.6 element 6** (pre-large-work context materialization) — the structural enabler. §13.21's demand to resume rather than defer is only meetable because element 6 ensures the resume target exists as a durable artifact. The two are introduced together (policy seq 120) and ship together; deploying §13.21 without element 6 would be a rule the agent cannot comply with.
- **§13.18** (recommend + proceed) — the choice-surface counterpart. §13.18 forbids soliciting approval on a non-branching choice; §13.21 forbids deferring a planned item once the recommendation is announced. Same autonomous-execution principle, two surfaces.
- **§13.17** (main-chat structured-choice prompts FORBIDDEN) — sibling discipline at the question-emission surface. §13.17 forbids the inline option UI; §13.21 forbids the inline "next context will handle it" defer. Both are agent-side disciplines closing escape paths from autonomous execution.
- **Seed Principle #16** (autonomous execution — absolute) — the seed-tier anchor. §13.21 is the explicit operational form of Principle #16 for the *time-surface* (context-boundary defer), the same way §13.18 is the operational form for the *choice-surface* (non-branching solicit) and §13.16.6 element 5 is the operational form for the *queue-surface* (idle-while-progressable). All three surfaces share the same principle; §13.21 closes the time-surface defection path.

**Provenance**: main upstream policy seq 120, msgId `m-mptjjxmo-119`, 2026-05-31. Originating context: the user surfaced the fresh-context defer pattern as the remaining escape from autonomous execution — even after §13.18 (recommend+proceed) and §13.16.6 element 5 (planned-queue scan / #442) closed the choice-emission and queue-consumption surfaces, the agent could still defer planned work to "next context" and self-permission idle-wait via that phrasing. §13.21 closes that surface; §13.16.6 element 6 is the paired structural enabler that makes the resume-rather-than-defer rule meetable in practice.
