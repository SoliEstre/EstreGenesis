# WS-PROTOCOL: UI6 Selection Prompts (Draft v0.1)

**Status**: DRAFT — pending main implementation review
**Track**: WS-PROTOCOL extension (companion to §13.11 HELLO / §13.13 A2A ack; **independent** of `WS-PROTOCOL-KEY-MGMT.md`)
**Provenance**:
- User feature **#406** (main hub, 2026-05-31) — Liveboard UI 5-item set; UI 6 is the **6th** item added in the same feature thread (live-board real-time chat window with agent-emitted option prompts).
- main delegate **seq 77** (`m-mpt4dja7-76`) introduced the 5-item UI set; UI 6 was tacked on as a chat-thread interactivity ask.
- main delegate **seq 88** (`m-mpt5o07l-87`, 2026-05-31) — "UI 4·5 키관리와 함께 server.cjs 프로토콜 묶음 설계" — requested this draft alongside `WS-PROTOCOL-KEY-MGMT.md`. **Bundling decision** (this draft): keep KEY-MGMT and UI6 in **separate files** — see §0 below.
- Lineage of board-side chat surface: the existing `wscore.event('message', {...})` and board feedback channel (no separate persistence layer).

---

## 0. Bundling Decision — Why a Separate File

This draft was authored in the same turn as `WS-PROTOCOL-KEY-MGMT.md` (seq 88). The orchestrator asked which of three packaging options to take:

- **(a)** extend `WS-PROTOCOL-KEY-MGMT.md` with a UI6 sub-section + rename to `WS-PROTOCOL-UI-CONTROL.md`
- **(b)** keep KEY-MGMT separate + new `WS-PROTOCOL-UI6-SELECTION.md`  ← **chosen**
- **(c)** both files stay + new `UI-CONTROL-OVERVIEW.md` linking them

**Pick: (b).** Justification by the cohesion criteria the orchestrator named:

| Axis | KEY-MGMT (UI 4/5) | UI6 Selection | Shared? |
|---|---|---|---|
| State | persistent (`key.json` → SQL on seq 79) | **ephemeral** (in-memory in board) | no |
| Permissions | **main only** (admin RPC) | any-role agent emits; **user** answers via board | no |
| Persistence | atomic-write `key.json` + future `keys` table | none (board feedback channel logs only) | no |
| Lifecycle | 5 states + TTL + dual-mode revoke | 3 states (ISSUED/ANSWERED/CANCELLED) | no |
| UI surface | main hub admin window | live-board chat thread | no |
| Envelope (§13.13) | inherits standard CUSTOM-wrap | inherits standard CUSTOM-wrap | **yes — but by reference, not by file** |

The only shared surface is the §13.13 envelope, and both drafts inherit it by cross-ref — that does **not** demand co-location.

**Why not (a)**: KEY-MGMT is already near-final (pending main hub sign-off per seq 83). Folding UI6 into it would force a re-review of the entire combined draft and dilute the focused review of the admin RPC surface. The rename to `UI-CONTROL` would also be misleading — UI4/5 is *upstream-key control* (an auth/identity concern), UI6 is *chat interactivity* (a UX concern). Calling both "UI-CONTROL" papers over a real abstraction boundary.

**Why not (c)**: A linker overview file with no technical content is busywork. Cross-refs in the §9 of each draft (and in `server-NOTES.md` §3 when implementation lands) carry the linkage at zero extra-file cost.

**Why (b) is right**: Each file is independently reviewable, ships at its own velocity, and the abstraction boundary (auth/identity vs chat UX) is preserved in the filesystem layout. When `server.cjs` implements both, the dispatcher branches will be in two clearly-separable code blocks; the docs match.

---

## 1. Scope & Non-Goals

### In scope
- 3 message types covering agent-emitted option prompts and user responses on the live board
- `@machine` for a single SelectionPrompt's lifecycle (ISSUED → ANSWERED → CANCELLED)
- Permission model — any role may emit a prompt; only the addressed user (via board UI) may answer; the board may cancel
- Ephemeral state model (no separate persistence layer)
- Envelope conventions inherited from `wscore.event('CUSTOM', { name, value })` and §13.13 ack tier

### Out of scope (followups)
- **Persistence of prompt/answer pairs** — the existing board feedback channel logs the wire frames; no separate `selections.json` or DB table is introduced. If a future product need demands query-by-prompt-ID across sessions, that's a v0.2 RFC.
- **Prompt branching / decision trees** — this draft handles single-prompt single-answer. Multi-step wizard flows are out of scope; the agent can emit a follow-up `SelectionPrompt` after receiving an `SelectionAnswer`, but the protocol itself does not encode the branching graph.
- **Rich-media options** — option `label` and `description` are plain text. Markdown / image options are out of scope (board renders chips as plain text).
- **Cross-agent prompt federation** — a prompt is emitted by one agent in its own thread; it is not multicast across agent threads.

---

## 2. Envelope Conventions

All three message types ride the standard §13.13 envelope:

```jsonc
{
  "type": "CUSTOM",
  "id":   "<auto>",            // transport msgId, server-stamped if absent
  "msgId": "<auto>",           // application msgId, used by §13.13 ack tier
  "name": "<SelectionPrompt | SelectionAnswer | SelectionCancel>",
  "value": { ... },            // payload (see §3 per-type)
  "source":         "agent" | "board" | "server",
  "agentId":        "<sender agentId, if agent>",
  "targetAgentId":  "<recipient, when board → agent>",
  "timestamp":      <ms>
}
```

### Sender side
- Agent → server requests (`SelectionPrompt`) **MUST** set a non-empty `msgId`. Server uses it as `ackFor` on the relay `Ack{delivered}`. The `value.promptId` is **separate** from `msgId` and is the application-level handle the agent uses to correlate the answer.
- Board → server frames (`SelectionAnswer`, `SelectionCancel`) **MUST** also set `msgId`. The board generates `promptId` echoes from the original prompt it is responding to (the board never invents new `promptId`s).

### Ack tier (§13.13) — UI6 scope

**Selection frames are descoped from §13.13's auto-`Ack{delivered}` relay rule.** Per main upstream Delegate seq 98 (msgId `m-mptcdsh8-97`) review, the existing §13.13 ack layer scopes its auto-`Ack{delivered}` emission to **A2A relay only** — the server fires the ack on agent-outbound A2A frames (cf. `WS-PROTOCOL:247` + `server.cjs:384-388` ack gate), NOT on board↔agent traffic. Selection frames transit board↔agent (board is the user's proxy; server forwards `SelectionAnswer` from the board to the originating agent), so they fall outside the existing ack-layer scope. Earlier drafts of this section asserted that *every* relay of these three frames gets an auto `Ack{delivered}` — that wording was incorrect and is corrected here:

- **No auto `Ack{delivered}` on Selection frames.** The application-level answer IS the acknowledgement. `SelectionAnswer` reaching the originating agent is the confirmation that `SelectionPrompt` was delivered, rendered, and answered. `SelectionCancel` reaching the agent is the confirmation that the prompt is no longer active. No separate transport-level ack is emitted by the server on the relay path.
- **`AckProcessed{ackFor}` remains optional** for all three (unchanged from the original draft). An agent that wants a delivery-receipt signal independent of the answer MAY emit `AckProcessed{ackFor:<msgId>}` from the board's chip-render hook, but this is purely application-level and not server-mandated.
- **`msgId` is still set** on every Selection frame (per the standard CUSTOM envelope convention) — it is used for application-level correlation (e.g., the agent's `_pendingPrompt` map keyed by `msgId`), not for the §13.13 ack-layer watermark.
- **Future option**: if a follow-up cycle decides to amend §13.13's scope to include board↔agent traffic, the descope above can be reversed in lockstep. UI6 alone cannot assert that amendment — it would touch every Constellation message type, not just Selection. Joint formalization required.

---

## 3. Message Types

### 3.1 `SelectionPrompt` — agent → server → board

The agent publishes an option prompt into its own chat thread. The board renders it as inline option chips below the most recent agent message.

**`value`**:
```jsonc
{
  "promptId":     "p-<22 base62 chars>",   // agent-generated, opaque to server
  "text":         "Which deploy target?",  // prompt text shown above the chips
  "options": [
    { "label": "staging",    "description": "deploys to staging.example.com" },
    { "label": "production", "description": "deploys to www.example.com" },
    { "label": "canary",     "description": "10% traffic split" }
  ],
  "allowFreeText": false,         // if true, board renders a free-text field alongside the chips
  "multiSelect":   false,         // if true, chips become multi-select (checkboxes); false → single-select (radio)
  "agentId":       "deploy-bot",  // echo of source agent for board's per-thread routing
  "timestamp":     1780193127639  // ms epoch, agent-stamped
}
```

**Field constraints**:
- `promptId` — opaque to server; agent MUST ensure uniqueness within its own thread. Recommended pattern: `p-` + 22 base62 chars (same shape as `msgId` minus prefix).
- `text` — 1..2000 chars. Plain text (board may apply its standard markdown render — same rules as regular chat messages).
- `options` — 1..16 entries. Each `label` is 1..64 chars; `description` is optional, 0..200 chars.
- `allowFreeText` — boolean. When true, the board renders a text input in addition to chips; the user MAY answer with chips only, free-text only, or both (subject to `multiSelect` for the chip part).
- `multiSelect` — boolean. When false, the user picks at most one chip (radio). When true, the user picks any subset (checkboxes).
- `agentId` — echo of the emitting agent. The board uses this to place the chips in the correct thread.

**Board behavior on receipt**:
- Render chips inline in the agent's thread, immediately after the agent's most recent message bubble.
- Track the prompt as `ISSUED` in the board's in-memory `selections` map (keyed by `promptId`).
- Set a soft client-side timeout (default 5 min, configurable via board setting) — on timeout, the board fires `SelectionCancel{ promptId, reason:'timeout' }`.

**Errors** (server → agent, `name: "SelectionError"`, `value: { code, message, re_msgId }`):
- `INVALID_PROMPT_ID` — `promptId` empty, too long, or duplicates an active prompt from the same agent
- `INVALID_OPTIONS` — `options` >16 entries, or any option fails label/description constraints. **An empty `options:[]` is VALID provided `allowFreeText:true`** (free-text-only prompt — matches main upstream policy #414 mode (b) "비포함 프롬프트"). The error fires only when `options:[]` is paired with `allowFreeText:false` (the prompt would be unanswerable).
- `INVALID_TEXT` — `text` empty or >2000 chars

**Side effects**: none server-side (no persistence); board adds entry to its in-memory map; emit is logged via the board feedback channel (standard board frame log).

---

### 3.2 `SelectionAnswer` — user → board → server → agent

The user responds via the board UI (chip click + optional free-text submit). The board emits this frame; the server relays it to the originating agent.

**`value`**:
```jsonc
{
  "promptId":      "p-AbC123...",       // echo of the SelectionPrompt
  "selectedLabels": ["production"],     // array of label strings chosen by the user
  "freeText":       "deploy at 14:00",  // optional. present only if SelectionPrompt.allowFreeText was true AND user typed something
  "answeredAt":     1780193200000       // ms epoch, board-stamped (board client clock)
}
```

**Field constraints**:
- `promptId` — MUST match a prompt the board currently tracks as `ISSUED`. If the board doesn't know the promptId (e.g. board reloaded), it MUST NOT emit this frame.
- `selectedLabels` — 0..N entries (N = original `options.length`). When the original `multiSelect` was false, length MUST be 0 or 1. Each label MUST be one of the original `options[].label`.
- `freeText` — present only when the original `allowFreeText` was true. 0..2000 chars. Absent (or empty string) means the user did not provide free-text.
- At least one of `selectedLabels` (non-empty) or `freeText` (non-empty) MUST be present — an "empty" answer is not a valid `SelectionAnswer`; the board should fire `SelectionCancel{reason:'user-dismiss'}` instead.
- `answeredAt` — board's local clock; agent SHOULD treat it as advisory (board clock may skew from server clock).

**Server behavior on receipt**:
- Look up the originating agent by `promptId` — the server maintains a transient `promptId → agentId` map (in-memory, populated when `SelectionPrompt` is relayed). If the agent is no longer connected, server emits `SelectionError{code:'AGENT_OFFLINE', re_msgId}` back to the board.
- Relay the frame to the originating agent (unicast) with `source:"board"` preserved.
- Drop the `promptId → agentId` entry from the transient map (single-answer model).

**Agent behavior on receipt**:
- Correlate by `promptId` to the prompt it originally emitted.
- Process the answer in agent-defined application logic (e.g. proceed with selected deploy target).
- The agent MAY emit a follow-up `SelectionPrompt` (chained flow) — fresh `promptId` required.

**Errors** (server → board):
- `PROMPT_NOT_FOUND` — `promptId` unknown to the server's transient map (already answered/cancelled, or never relayed)
- `AGENT_OFFLINE` — originating agent has no live conn
- `INVALID_LABELS` — `selectedLabels` contains a label not in the original options
- `MULTI_SELECT_VIOLATION` — `selectedLabels.length > 1` when the original `multiSelect` was false

**Side effects**: server clears the `promptId → agentId` entry; board transitions `promptId` state to `ANSWERED` in its local map (kept until thread close, for UI display of the answered chips); the answer frame is logged via the board feedback channel.

---

### 3.3 `SelectionCancel` — board → server → agent

The board cancels an outstanding prompt. Three reasons; semantics differ only in the `reason` field — the protocol effect is identical (drop the prompt, notify the agent).

**`value`**:
```jsonc
{
  "promptId": "p-AbC123...",
  "reason":   "user-dismiss"      // "user-dismiss" | "timeout" | "thread-close"
}
```

**Reason semantics**:
- `"user-dismiss"` — user clicked a dismiss/close button on the chips widget without selecting anything.
- `"timeout"` — board's soft timeout (default 5 min) elapsed without an answer.
- `"thread-close"` — the thread containing the prompt was closed (board UI tab closed, agent disconnected on the board side, or the user navigated away). The board fires this **best-effort** before tearing down the thread state.

**Server behavior on receipt**:
- Look up `promptId` in the transient `promptId → agentId` map.
- Relay to the originating agent (unicast, `source:"board"` preserved).
- Drop the map entry.
- If `promptId` unknown, **silently drop** (no error frame). Cancel-of-unknown-prompt is benign — the prompt may have already been answered, or this is a late retry after thread reload. No auto `Ack{delivered}` is emitted on the relay path (Selection frames are descoped from §13.13's auto-ack rule — see §3.4 Ack tier).

**Agent behavior on receipt**:
- Correlate by `promptId`. Mark the prompt as `CANCELLED` in agent-side state.
- Application logic: agent decides whether to retry, fall back to a default, or abort the workflow.

**Errors**: none — `SelectionCancel` is fire-and-forget; the relay `Ack{delivered}` is the only feedback.

**Side effects**: server clears the `promptId → agentId` entry; board transitions `promptId` state to `CANCELLED` in its local map (may be immediately purged or kept briefly for UI fade-out); the cancel frame is logged via the board feedback channel.

---

## 4. `@machine` — SelectionPrompt Lifecycle

### States

| State | Meaning | Where tracked |
|---|---|---|
| `ISSUED` | prompt emitted by agent, relayed to board, chips rendered | board in-memory map; server `promptId → agentId` map |
| `ANSWERED` | user submitted a `SelectionAnswer`; relayed to agent | board in-memory map (display-only, until thread close); server map entry **cleared** |
| `CANCELLED` | board emitted `SelectionCancel` for any reason; relayed to agent | board in-memory map (display-only, until thread close); server map entry **cleared** |

### Transitions

| From | Event | To | Notes |
|---|---|---|---|
| (none) | `SelectionPrompt` relayed (agent → board) | `ISSUED` | server adds `promptId → agentId`; board adds chips |
| `ISSUED` | `SelectionAnswer` relayed (board → agent) | `ANSWERED` | server clears map entry |
| `ISSUED` | `SelectionCancel{reason:'user-dismiss'}` relayed | `CANCELLED` | server clears map entry |
| `ISSUED` | `SelectionCancel{reason:'timeout'}` relayed | `CANCELLED` | board-side timer fires |
| `ISSUED` | `SelectionCancel{reason:'thread-close'}` relayed (best-effort) | `CANCELLED` | board may fail to send if tab closes abruptly; server-side map entry then leaks until the originating agent disconnects (see invariant 4) |
| `ANSWERED` | (terminal) | `ANSWERED` | no further transitions; UI may show chips with the chosen label highlighted |
| `CANCELLED` | (terminal) | `CANCELLED` | no further transitions; UI may show chips dimmed/struck-through |

### Guards / derive
- `guard isActive(promptId)` — server: `promptId ∈ promptToAgent` map; board: `selections[promptId]?.state === 'ISSUED'`
- `derive timeoutAt(promptId)` — board-side only: `promptIssuedAt + boardSelectionTimeoutMs` (default 5 min)

### Invariants
1. **Single-answer**: a `SelectionPrompt` resolves to **exactly one** terminal frame — either `SelectionAnswer` or `SelectionCancel`. A second answer/cancel for the same `promptId` after terminal state MUST be dropped server-side (`PROMPT_NOT_FOUND` for late `SelectionAnswer`; silent drop for late `SelectionCancel`).
2. **Ephemeral**: there is **no** persistence layer. On server restart, all `promptId → agentId` entries are gone; outstanding prompts on connected boards become orphans. The board MAY detect this on reconnect (e.g. by observing a HELLO/reconnect event) and auto-cancel its in-memory entries with `reason:'thread-close'`.
3. **Agent-thread scoped**: a prompt lives in exactly one agent thread (its emitting agent's). Closing that thread (`thread-close`) cancels all its outstanding prompts.
4. **Map leak on abrupt close**: if the board fails to fire `SelectionCancel` (e.g. browser crash) **and** the agent stays connected, the server's `promptId → agentId` entry leaks. Mitigation: server SHOULD purge entries on agent disconnect (sweep the map when a conn closes). This is the only janitorial work the server does for this protocol.

---

## 5. Permissions

| Message | Who may send | Server check |
|---|---|---|
| `SelectionPrompt` | **any agent role** | `conn.meta.role ∈ {'main','local','collab','upstream'}` — i.e. any authenticated agent conn (canonical role set per `server.cjs:167`, aligned with WS-PROTOCOL-KEY-MGMT §5). No admin gate. |
| `SelectionAnswer` | **board only** (proxy for user) | `conn.meta.role !== 'agent'` — i.e. the conn did NOT send a HELLO with an `agentId` (board conns do not carry a role in the runtime; agent role assignment happens at HELLO). Equivalent: any conn that is NOT an authenticated agent. Single-board assumption holds. |
| `SelectionCancel` | **board only** | same as `SelectionAnswer`. |

**Role notes**:
- The user is **not** a WS principal. The board acts as the user's proxy on the wire — `SelectionAnswer` originates in the board UI (chip click) and the board client serializes it. The server trusts the board frame as user intent.
- `SelectionPrompt` deliberately has the loosest permissions: any agent in any role (main / local / collab / upstream) can ask the user a question. This mirrors the existing agent chat surface (any agent can post a message to its own thread).
- The earlier draft of this table used `conn.meta.role === 'board'` as the SelectionAnswer check — that wording is incorrect against the actual runtime, which leaves board conns without any `meta.role` assignment (HELLO is the only path that sets `meta.role`, and the board does not send HELLO per §1 architecture). Using `role === 'board'` would reject every SelectionAnswer the board ever sends. The corrected check (`role !== 'agent'`, equivalent to "not an authenticated agent conn") is consistent with the existing board-frame handling elsewhere in the server.
- **Collab answer allowance**: collab peers (§13.9) MAY *also* answer a `SelectionPrompt` if the prompt explicitly opts in via an optional `audience` field (default audience is the human user via the board; opting in to collab allows peer-agent answers — useful for cross-agent coordination prompts). When `audience` is absent the default board-only rule above applies.
- An agent attempting `SelectionAnswer` or `SelectionCancel` receives `SelectionError{code:'PERMISSION_DENIED', re_msgId}` and the request is dropped. The error frame carries `re_msgId` for application-level correlation; per §3.4 ack-tier descope, no transport-level `Ack{delivered}` is emitted on this path. The sender treats receipt of the error frame itself as the answer.

---

## 6. Persistence — None (Ephemeral by Default)

Per orchestrator requirement (seq 88), **no separate persistence layer** is introduced for selection prompts. The justification:

1. **Prompts are conversational**: they belong to the chat thread, not to durable system state. If the chat thread is cleared, the prompts go with it.
2. **The board feedback channel already logs frames**: every `SelectionPrompt`, `SelectionAnswer`, `SelectionCancel` is captured by the existing `wscore.event('CUSTOM',...)` feedback log path. If forensic recovery is ever needed, the frames are in the feedback log — no separate store required.
3. **Operational simplicity**: no `selections.json`, no atomic write discipline, no migration to seq 79 SQL. Server restart drops the in-memory map; clients reconcile via invariant 2 (auto-cancel on reconnect).

**Server-side state**: a single in-memory `Map<promptId, agentId>` in `server.cjs`, populated on `SelectionPrompt` relay and cleared on `SelectionAnswer` / `SelectionCancel` / agent disconnect.

**Board-side state**: in-memory `selections: Map<promptId, {state, prompt, issuedAt, ...}>` in the board client. Cleared on thread close or page reload.

**Agent-side state**: agent's own application memory — the protocol does not dictate how the agent tracks its outstanding prompts. Recommended: a `Map<promptId, resolver>` so the agent can correlate the eventual answer/cancel to the original emit site (e.g. a Promise resolver).

---

## 7. Wire Examples

### 7.1 Happy path: prompt → answer

```jsonc
// agent → server
{ "type":"CUSTOM", "name":"SelectionPrompt", "msgId":"m-100",
  "agentId":"deploy-bot",
  "value": {
    "promptId":"p-001",
    "text":"Which deploy target?",
    "options":[
      {"label":"staging","description":"deploys to staging.example.com"},
      {"label":"production","description":"deploys to www.example.com"}
    ],
    "allowFreeText":false,
    "multiSelect":false,
    "agentId":"deploy-bot",
    "timestamp":1780193127639
  } }

// server → board (relayed; Ack{delivered} to agent elided)
// (same frame, source preserved as "agent")

// later — board → server (user clicked "production")
{ "type":"CUSTOM", "name":"SelectionAnswer", "msgId":"m-101",
  "source":"board",
  "value": {
    "promptId":"p-001",
    "selectedLabels":["production"],
    "answeredAt":1780193200000
  } }

// server → agent (relayed; targetAgentId set to "deploy-bot")
// (Ack{delivered} to board elided)
```

### 7.2 Multi-select with free-text

```jsonc
// agent → server
{ "type":"CUSTOM", "name":"SelectionPrompt", "msgId":"m-200",
  "agentId":"survey-bot",
  "value": {
    "promptId":"p-002",
    "text":"Which environments need a smoke test? (you can also add notes)",
    "options":[
      {"label":"staging"},
      {"label":"production"},
      {"label":"canary"}
    ],
    "allowFreeText":true,
    "multiSelect":true,
    "agentId":"survey-bot",
    "timestamp":1780193300000
  } }

// board → server (user selected two + typed a note)
{ "type":"CUSTOM", "name":"SelectionAnswer", "msgId":"m-201",
  "source":"board",
  "value": {
    "promptId":"p-002",
    "selectedLabels":["staging","canary"],
    "freeText":"skip prod, recent incident",
    "answeredAt":1780193380000
  } }
```

### 7.3 Timeout cancel

```jsonc
// agent → server (prompt emitted)
{ "type":"CUSTOM", "name":"SelectionPrompt", "msgId":"m-300",
  "value": { "promptId":"p-003", "text":"Continue?", "options":[
    {"label":"yes"},{"label":"no"}], "allowFreeText":false, "multiSelect":false,
    "agentId":"watcher-bot", "timestamp":1780193400000 } }

// 5 minutes pass without answer — board fires
{ "type":"CUSTOM", "name":"SelectionCancel", "msgId":"m-301",
  "source":"board",
  "value": { "promptId":"p-003", "reason":"timeout" } }

// server → agent (relayed)
// agent's application logic: treat as implicit "no" or retry, agent's call
```

### 7.4 Thread close (best-effort)

```jsonc
// user closes the agent thread tab; board fires before teardown
{ "type":"CUSTOM", "name":"SelectionCancel", "msgId":"m-400",
  "source":"board",
  "value": { "promptId":"p-004", "reason":"thread-close" } }

// if browser crashes instead, this frame never fires; server map entry leaks
// until the emitting agent disconnects (invariant 4 sweep).
```

---

## 8. Open Questions for main Implementation Review

1. **Free-text length cap** — current draft says 0..2000 chars matching prompt `text`. Should free-text be capped lower (e.g. 500) to avoid abuse of the chat thread as a long-form input vector? Or unlimited (treat as a regular chat message)?
2. **Timeout default** — 5 min picked arbitrarily. Should it be configurable per-prompt (`SelectionPrompt.timeoutMs`) or per-board (single setting)?
3. **Multiple boards** — single-board assumption matches current arch. If a future deploy has two board clients connected at once, both render the chips; first answer wins, second board's `SelectionAnswer` for the same `promptId` gets `PROMPT_NOT_FOUND`. Acceptable, or should the protocol broadcast a "prompt resolved" frame to all boards to dim/remove the chips?
4. **Agent self-cancel** — should the agent be able to cancel its own prompt (e.g. condition changed, no longer need the answer)? Currently `SelectionCancel` is board-only. Adding `agent → server → board` direction would let the agent retract chips before timeout. Worth a 4th message direction or just keep agent waiting?
5. **Option `description` rendering** — board renders chips with the label as the chip text; `description` is shown as tooltip? Below the chip? Inline expanded? Implementation choice or protocol-specified?
6. **Answer audit beyond feedback channel** — should the server emit a `name:"SelectionAudit"` board-side frame on every prompt resolution (answer or cancel) for explicit logging, or is the feedback channel's frame capture sufficient?

---

## 9. Provenance & Cross-Refs

- **§13.11 HELLO handshake** — orthogonal (the board's identity as a board principal is established at HELLO; this draft assumes that's already done).
- **§13.13 A2A ack tier** — `Ack{delivered}` auto-fires on `Selection*` relay; `AckProcessed` optional and advisory (see §2).
- **§13.11 board emission discipline** — the existing `wscore.event` board-frame capture path logs these frames as the feedback channel record (no separate persistence — see §6).
- **`WS-PROTOCOL-KEY-MGMT.md` (sibling draft)** — independent file; shares only the §13.13 envelope. See §0 for the bundling decision rationale.
- **User feature seq 77 #406** — UI 6 (live-board chat interactivity) was the 6th item added to the UI feature set after the initial 5-item batch.
- **main delegate seq 88 / msgId `m-mpt5o07l-87` / 2026-05-31** — orchestrator turn that requested this draft alongside KEY-MGMT, with the explicit instruction "묶음 설계" (bundle design) — interpreted per §0 as "design them in the same turn, package them per cohesion" rather than "merge into one file".
- **`server.cjs` future hook** — implementation will add a single dispatcher branch for `SelectionPrompt|SelectionAnswer|SelectionCancel` in the CUSTOM message handler. The branch is independent of (and ordered after) the `Key*` branch from KEY-MGMT.
- **`server-NOTES.md` §3** — envelope CUSTOM-wrap table will gain 3 new rows (`SelectionPrompt` / `SelectionAnswer` / `SelectionCancel`) when this draft is implemented.

---

*Draft v0.1 — 2026-05-31. EG-side authored against main user feature #406 / seq 77 / seq 88. Awaiting main hub review before promotion to v1 and reference-implementation commit. Companion to `WS-PROTOCOL-KEY-MGMT.md` (independent file per §0 bundling decision).*
