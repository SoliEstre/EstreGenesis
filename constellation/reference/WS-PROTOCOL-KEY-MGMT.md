# WS-PROTOCOL: Upstream Key Management (Draft v0.1)

**Status**: DRAFT — pending main implementation review
**Track**: WS-PROTOCOL extension (companion to §13.11 HELLO / §13.13 A2A ack)
**Provenance**:
- User feature **#406** (main hub, 2026-05-31) — Liveboard UI 5 items, of which 3 require upstream key management protocol
- main delegate **seq 77** (`m-mpt4dja7-76`) introduced the 5-item UI set
- main delegate **seq 83** (`m-mpt4xm75-82`) confirmed split: **main implements UI 1+2 first**; **UI 3 / 4 / 5 wait for this protocol draft**
- DB persistence path: **seq 79** (`m-mpt4mzo9-78`) — HistoryStore + node:sqlite RRP. Until that lands, key state lives in file-based `key.json` (atomic write + fsync).
- Lineage of existing key emit: `server.cjs:214/215` (`RegisterUpstreamKey` → `UpstreamKeyIssued`, `RegisterCollabKey` → `CollabKeyIssued`). This draft **supersedes** the upstream half of that pair while keeping the collab half untouched.

---

## 1. Scope & Non-Goals

### In scope (this draft)
- 5 message types covering upstream-key issue / list / revoke / label across the main hub WS surface
- State machine (`@machine`) for a single key's lifecycle
- Permission model — which role may invoke which message
- Persistence shape (`key.json`) for the pre-DB interim
- Envelope conventions inherited from `wscore.event('CUSTOM', { name, value })` and §13.13 ack tier

### Out of scope (followups)
- **Collab key surface** — `RegisterCollabKey` / `CollabKeyIssued` remain as-is (separate role; see `server.cjs:215`). Future RFC may unify under a single `Key*` namespace once DB lands.
- **HistoryStore-backed key store** — covered by seq 79 P2 (SqliteStore). This draft assumes file-based `key.json` and explicitly hands off persistence shape to the migration.
- **Token-based (no-key) auth** — `LIVE_BOARD_WS_TOKEN` env path is unchanged; key auth is the additive surface.
- **Multi-tenant / org boundaries** — single-server, single-main assumption (matches `WS_PRIMARY_AGENT`).

---

## 2. Envelope Conventions

All five message types ride the standard envelope already in use across §13.11 / §13.13:

```
{
  "type": "CUSTOM",
  "id":   "<auto>",            # transport msgId, server-stamped if absent
  "msgId": "<auto>",           # application msgId, used by §13.13 ack tier
  "name": "<one of the 5 names below>",
  "value": { ... },            # payload (see §3 per-type)
  "source":         "agent" | "server",
  "agentId":        "<sender agentId, if agent>",
  "targetAgentId":  "<recipient, when A2A>",
  "timestamp":      <ms>
}
```

### Sender side
- main → server requests **MUST** set a non-empty `msgId`. Server uses it as the `ackFor` echo on the response.
- Server-initiated broadcasts (only `AgentNameChanged` here) set `msgId` server-side; agents echo it in their `AckProcessed` if they choose to ack.

### Ack tier (§13.13)
- Every main → server request, on successful relay/handle, receives an automatic `Ack{ackFor:<msgId>, kind:'delivered'}` from the server (the existing `wsIsAckable` path — §13.13 invariant 2).
- The **application response** (`KeyIssued` / `KeyListResult` / `KeyRevoked` / `KeyLabeled`) is a separate CUSTOM frame and is **not** a substitute for `Ack{delivered}`. Both fire — `Ack` is transport-level "I relayed/handled it", the response is application-level "here is the result".
- `AckProcessed{ackFor}` from the requester is **optional** for these flows. The response itself is a sufficient processed-signal (it carries the result the requester needed).
- For the `AgentNameChanged` broadcast (server → agents), agents **MAY** emit `AckProcessed{ackFor:<the broadcast msgId>}` once they've reflected the rename in their display name / HELLO re-announce; main hub MAY use this for liveness audit but MUST NOT block on it.

---

## 3. Message Types

### 3.1 `KeyIssue` — main → server

Issue a new upstream key. Supersedes `RegisterUpstreamKey`.

**Request `value`**:
```jsonc
{
  "label":  "string",      // human label, e.g. "phone-claude", "co-pilot-laptop"
  "ttl":    1209600000     // optional. ms. default = 14d (1209600000). 0 = no expiry (discouraged).
}
```

**Response (server → main)** — `name: "KeyIssued"`, `value`:
```jsonc
{
  "key":      "u-<22 base62 chars>",      // opaque, server-generated, never reused
  "joinUrl":  "ws://host:7878/ws?upstreamKey=<key>",  // pre-formed URL for share
  "label":    "phone-claude",             // echo
  "ttl":      1209600000,                 // echo (post-clamp if server enforces min/max)
  "issuedAt": 1780193127639               // server clock, ms epoch
}
```

**Errors** (server → main, `name: "KeyError"`, `value: { code, message, re_msgId }`):
- `LIMIT_EXCEEDED` — too many active keys (default cap 32, configurable via env `WS_KEY_MAX_ACTIVE`)
- `INVALID_LABEL` — empty / >64 chars / control chars
- `INVALID_TTL` — negative or beyond cap

**Side effects**: new entry in `key.json` (state `ISSUED`); no broadcast.

---

### 3.2 `KeyList` — main → server

Enumerate all known keys (any state). Used by the UI 5 "key management window" to render the table.

**Request `value`**:
```jsonc
{
  "includeRevoked": false,  // optional. default false → only ISSUED/ACTIVE/REVOKED_PENDING
  "includeDeleted": false   // optional. default false. DELETED tombstones for audit only.
}
```

**Response (server → main)** — `name: "KeyListResult"`, `value`:
```jsonc
{
  "keys": [
    {
      "key":              "u-AbC123...",
      "label":            "phone-claude",
      "lastAgent":        "phone-agent-1",    // null if never connected
      "lastSeenAt":       1780193100000,      // ms. null if never connected
      "connectionStatus": "connected",        // "connected" | "disconnected" | "never"
      "ttl":              1209600000,
      "issuedAt":         1780193000000,
      "state":            "ACTIVE"            // see §4 machine
    }
    // ...
  ]
}
```

`lastAgent` / `lastSeenAt` are populated by the server's HELLO observer — whenever a connection arrives carrying this key (`?upstreamKey=` or HELLO `msg.upstreamKey`), the server updates these two fields in `key.json`.

`connectionStatus`:
- `connected`   — at least one live `conn` in `wsAgents` currently has `meta.upstreamKey === key`
- `disconnected` — has been seen before (`lastSeenAt != null`) but no live conn now
- `never`       — `lastSeenAt == null`

**Errors**: none expected at protocol level (empty list is valid).

---

### 3.3 `KeyRevoke` — main → server

Revoke a key. Two modes; both transition the key out of usable state but differ on whether currently-connected agents are kicked.

**Request `value`**:
```jsonc
{
  "key":  "u-AbC123...",
  "mode": "immediate"   // "immediate" | "sessionEnd"
}
```

Mode semantics:
- `"immediate"` — server **drops** every live conn with `meta.upstreamKey === key` (close code `4003 "key revoked"`), and the key cannot be used for new HELLOs starting now. Transition: `ACTIVE | ISSUED → REVOKED`.
- `"sessionEnd"` — currently-connected agents are **allowed to finish** their current session; new HELLOs with this key are rejected (`4003`). When the last live conn for this key closes naturally, the key transitions to `REVOKED`. Transition: `ACTIVE → REVOKED_PENDING` (then `REVOKED` on last-disconnect). On `ISSUED` (no live conn at request time), `sessionEnd` collapses to `immediate` semantics — transitions straight to `REVOKED`.

**Response (server → main)** — `name: "KeyRevoked"`, `value`:
```jsonc
{
  "key":               "u-AbC123...",
  "mode":              "immediate",
  "agentsDisconnected": 2,       // # of live conns just closed (0 for sessionEnd with active sessions)
  "agentsNotified":     2        // # of agents that received the close frame / pending-revoke notice
}
```

For `sessionEnd` with N active sessions:
- `agentsDisconnected = 0` (immediate)
- `agentsNotified = N` (server sends each a `name:"KeyRevokePending", value:{ key, mode:'sessionEnd' }` so the agent UI can surface "this key will revoke at session end")
- A second `KeyRevoked` frame fires to main when the key finally lands in `REVOKED` — same shape but `agentsDisconnected` reflects the natural-close count.

**Errors**:
- `KEY_NOT_FOUND` — unknown key
- `ALREADY_REVOKED` — key in `REVOKED` or `DELETED`
- `INVALID_MODE` — mode not in `{immediate, sessionEnd}`

**Side effects**: state transition (§4); persistence write; no `AgentNameChanged`.

---

### 3.4 `KeyLabel` — main → server

Rename a key's human label. **Side effect**: if the key currently has a connected agent, that agent receives an `AgentNameChanged` broadcast (§3.5) so it can update its own display name.

**Request `value`**:
```jsonc
{
  "key":      "u-AbC123...",
  "newLabel": "phone-claude-v2"
}
```

**Response (server → main)** — `name: "KeyLabeled"`, `value`:
```jsonc
{
  "key":      "u-AbC123...",
  "oldLabel": "phone-claude",
  "newLabel": "phone-claude-v2"
}
```

**Side effect (server → agent broadcast)** — fires **after** the `KeyLabeled` response, only to live conns whose `meta.upstreamKey === key`. See §3.5.

**Errors**:
- `KEY_NOT_FOUND`
- `INVALID_LABEL` — empty / >64 chars / control chars
- `NOOP_LABEL` — `newLabel === oldLabel` (server may also choose to silently 200 — implementer call)

---

### 3.5 `AgentNameChanged` — server → agent (broadcast / unicast)

Notify an agent that its upstream key's label was renamed. The agent SHOULD update its own display name and may choose to re-emit HELLO (`agentName`) so the board reflects it.

**Frame** (server-initiated, no request):
```jsonc
{
  "type": "CUSTOM",
  "name": "AgentNameChanged",
  "value": {
    "key":      "u-AbC123...",
    "oldLabel": "phone-claude",
    "newLabel": "phone-claude-v2"
  },
  "msgId": "<server-stamped>",
  "source": "server",
  "targetAgentId": "<the agent's agentId>"    // unicast — one frame per live conn for this key
}
```

**Delivery model**: one frame per live conn whose `meta.upstreamKey === key`. If 0 live conns, no broadcast fires (the label change still persists; next HELLO will see the new label via `KeyList`).

**Agent response (optional)**: `AckProcessed{ackFor: <broadcast msgId>}` once the rename is reflected in the agent's display name. main hub MAY surface this in the UI 5 row's connection-status column as a sub-indicator ("rename ack: ✓") but MUST NOT block on it.

**Agent freedom**: the broadcast is advisory — the agent is the source of truth for its own `agentName` (HELLO field). The key's `label` is the main hub's tag; the agent's `agentName` is the agent's self-declared identity. If the agent ignores the broadcast, the main hub UI surfaces the key by `label` and the live board surfaces the agent by `agentName` — they may diverge intentionally.

---

## 4. `@machine` — Key Lifecycle

### States

| State | Meaning | Live conn possible? | Key usable for new HELLO? |
|---|---|---|---|
| `ISSUED` | issued, never used | no | yes |
| `ACTIVE` | issued and at least one HELLO has been observed | yes (current or past) | yes |
| `REVOKED_PENDING` | `sessionEnd` revoke fired while a live conn existed; new HELLOs blocked | yes (existing only) | no |
| `REVOKED` | revoked; no live conns; no new HELLOs accepted | no | no |
| `DELETED` | tombstone — kept for audit, hidden from default `KeyList` | no | no |

### Transitions

| From | Event | To | Notes |
|---|---|---|---|
| (none) | `KeyIssue` handled | `ISSUED` | new row in `key.json` |
| `ISSUED` | first HELLO observed with this key | `ACTIVE` | `lastAgent` / `lastSeenAt` stamped |
| `ISSUED` | `KeyRevoke immediate` | `REVOKED` | no live conn to kick |
| `ISSUED` | `KeyRevoke sessionEnd` | `REVOKED` | collapses to immediate (no active session) |
| `ISSUED` | TTL expiry (server timer or lazy check on next HELLO) | `REVOKED` | TTL = `issuedAt + ttl` |
| `ACTIVE` | `KeyRevoke immediate` | `REVOKED` | server closes all live conns (close code 4003) |
| `ACTIVE` | `KeyRevoke sessionEnd` | `REVOKED_PENDING` | new HELLOs rejected; existing conns finish |
| `ACTIVE` | all live conns close naturally + no revoke | `ACTIVE` | stays ACTIVE (just `connectionStatus=disconnected`) |
| `ACTIVE` | TTL expiry | `REVOKED` | all live conns also closed (4003) |
| `REVOKED_PENDING` | last live conn closes | `REVOKED` | second `KeyRevoked` frame fires to main |
| `REVOKED_PENDING` | `KeyRevoke immediate` (escalation) | `REVOKED` | kicks remaining live conns |
| `REVOKED` | `KeyDelete` (admin op, future) | `DELETED` | tombstone for audit |

### Guards / derive (informational, not exhaustive)
- `guard isLive(key)` — `∃ conn in wsAgents : conn.meta.upstreamKey === key`
- `derive connectionStatus(key)` — see §3.2
- `derive isExpired(key)` — `Date.now() > key.issuedAt + key.ttl` (when `ttl > 0`)

### Invariants
1. `ISSUED → ACTIVE` is one-way (a key never demotes back to ISSUED even after disconnect).
2. `REVOKED → ACTIVE` is **impossible** — revocation is terminal. Re-enabling requires issuing a *new* key.
3. `DELETED` is hidden from `KeyList` unless `includeDeleted:true`. Persistence row is **kept** for audit (not deleted from `key.json`).
4. `KeyLabel` may fire in any non-terminal state (`ISSUED` / `ACTIVE` / `REVOKED_PENDING`). It is **rejected** on `REVOKED` / `DELETED` (`KEY_NOT_FOUND` or a dedicated `KEY_TERMINAL` code — implementer call).
5. `AgentNameChanged` only fires from `ACTIVE` (because `REVOKED_PENDING` keeps its label until full revoke — rename of a pending-revoke key is allowed but the broadcast still fires per §3.5 delivery model).

---

## 5. Permissions

| Message | Who may send | Server check |
|---|---|---|
| `KeyIssue` | main only | `isMain(conn)` — see role determination below |
| `KeyList` | main only | `isMain(conn)` |
| `KeyRevoke` | main only | `isMain(conn)` |
| `KeyLabel` | main only | `isMain(conn)` |
| `AgentNameChanged` | **server only** (outbound) | n/a (server-initiated); recipients are live conns of any non-main role (`local` / `collab` / `upstream`) whose `meta.upstreamKey === key` |

Non-main senders (`local` / `collab` / `upstream`) attempting any mutating `Key*` request receive `name:"KeyError", value:{ code:"PERMISSION_DENIED", re_msgId }` and the request is dropped. The error frame **does** carry `ackFor` so the sender's `_pendingAck` watermark advances (§13.13 invariant — error is still a relay-level "delivered"). Non-main roles remain eligible to **receive** `AgentNameChanged` broadcasts (§3.5) — they just cannot **mutate** keys.

**Role determination** (canonical — matches `server.cjs:167` `wsAgentRole(c)`):
- `wsAgentRole(conn)` returns one of `'main' | 'local' | 'collab' | 'upstream'`:
  - `'collab'`  — HELLO carried a collab-tier key (`meta.collab === true`)
  - `'upstream'` — HELLO carried an upstream key (`meta.upstream === true`)
  - `'main'`    — `agentId === WS_PRIMARY_AGENT` (the orchestrator hub; default `'main-agent'`, overridable via `WS_PRIMARY_AGENT` env)
  - `'local'`   — none of the above (default fallback; e.g., dashboard tabs, anonymous agents)
- **`isMain(conn)`** = `wsAgentRole(conn) === 'main'` — the **only** role permitted to issue `KeyIssue` / `KeyList` / `KeyRevoke` / `KeyLabel`. All other roles (`local`, `collab`, `upstream`) fail the gate.
- Implementation note: when this draft lands, `server.cjs` adds a single `if (!isMain(conn)) return keyError(conn, msg, 'PERMISSION_DENIED')` gate at the top of the `Key*` dispatcher branch.

---

## 6. Persistence — `key.json` (interim, pre-seq-79 DB)

Until HistoryStore + SqliteStore (seq 79) lands, key state lives in a single JSON file alongside `state.json`:

**Path**: `<dataDir>/key.json` (sibling of `state.json` — same directory the server writes board snapshots to).

**Shape**:
```jsonc
{
  "version": 1,
  "updatedAt": 1780193127639,
  "keys": [
    {
      "key":        "u-AbC123...",
      "label":      "phone-claude",
      "state":      "ACTIVE",
      "issuedAt":   1780193000000,
      "ttl":        1209600000,
      "lastAgent":  "phone-agent-1",
      "lastSeenAt": 1780193100000,
      "revokedAt":  null,             // ms when state entered REVOKED_PENDING or REVOKED
      "deletedAt":  null
    }
    // ...
  ]
}
```

### Write discipline
- **Atomic write**: `fs.writeFileSync(tmp, JSON.stringify(...))` → `fs.fsyncSync(fd)` → `fs.renameSync(tmp, key.json)`. (Same pattern as `state.json` snapshot writes — matches the §13.16 "snapshot integrity" discipline.)
- **Read on boot**: server loads `key.json` once at startup; if missing, initialize to `{version:1, keys:[]}`. If parse fails, **rename** the bad file to `key.json.corrupt-<ts>` and start fresh (do not silently overwrite — the corrupt file is forensic evidence).
- **Write triggers**: every state transition (§4) and every label rename (§3.4). Last-seen-at update on HELLO is **also** persisted but MAY be debounced (≤1s) to avoid write storms under rapid reconnect.

### Migration path (seq 79 handoff)
When seq 79 P1 (HistoryStore + JsonlStore) lands, a `KeyStore` abstraction parallel to HistoryStore will be introduced. The `key.json` shape above maps cleanly to a `keys` table:

```sql
CREATE TABLE keys (
  key         TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  state       TEXT NOT NULL,       -- ISSUED|ACTIVE|REVOKED_PENDING|REVOKED|DELETED
  issued_at   INTEGER NOT NULL,
  ttl         INTEGER NOT NULL,
  last_agent  TEXT,
  last_seen_at INTEGER,
  revoked_at  INTEGER,
  deleted_at  INTEGER
);
```

The 3-mode dual-write (A→B→C) from seq 79 RRP applies symmetrically: file-only → file+sqlite dual-write → sqlite-primary, with JSON kept as the rollback floor.

---

## 7. Wire Examples

### 7.1 Happy path: issue → list → label → revoke

```jsonc
// main → server
{ "type":"CUSTOM", "name":"KeyIssue", "msgId":"m-001",
  "value": { "label": "phone-claude" } }

// server → main (Ack{delivered} elided)
{ "type":"CUSTOM", "name":"KeyIssued", "value": {
    "key":"u-Abc...", "joinUrl":"ws://host:7878/ws?upstreamKey=u-Abc...",
    "label":"phone-claude", "ttl":1209600000, "issuedAt":1780193000000 } }

// later — main → server
{ "type":"CUSTOM", "name":"KeyList", "msgId":"m-002", "value":{} }

// server → main
{ "type":"CUSTOM", "name":"KeyListResult", "value": {
    "keys":[ { "key":"u-Abc...", "label":"phone-claude",
               "lastAgent":"phone-agent-1", "lastSeenAt":1780193100000,
               "connectionStatus":"connected", "ttl":1209600000,
               "issuedAt":1780193000000, "state":"ACTIVE" } ] } }

// main → server
{ "type":"CUSTOM", "name":"KeyLabel", "msgId":"m-003",
  "value": { "key":"u-Abc...", "newLabel":"phone-claude-v2" } }

// server → main
{ "type":"CUSTOM", "name":"KeyLabeled", "value": {
    "key":"u-Abc...", "oldLabel":"phone-claude", "newLabel":"phone-claude-v2" } }

// server → agent (unicast, msgId server-stamped)
{ "type":"CUSTOM", "name":"AgentNameChanged",
  "value": { "key":"u-Abc...", "oldLabel":"phone-claude", "newLabel":"phone-claude-v2" },
  "targetAgentId":"phone-agent-1", "source":"server" }

// main → server
{ "type":"CUSTOM", "name":"KeyRevoke", "msgId":"m-004",
  "value": { "key":"u-Abc...", "mode":"immediate" } }

// server → main
{ "type":"CUSTOM", "name":"KeyRevoked", "value": {
    "key":"u-Abc...", "mode":"immediate",
    "agentsDisconnected":1, "agentsNotified":1 } }
```

### 7.2 `sessionEnd` revoke with a live conn

```jsonc
// main → server
{ "type":"CUSTOM", "name":"KeyRevoke", "msgId":"m-010",
  "value": { "key":"u-Xyz...", "mode":"sessionEnd" } }

// server → main (immediate response)
{ "type":"CUSTOM", "name":"KeyRevoked", "value": {
    "key":"u-Xyz...", "mode":"sessionEnd",
    "agentsDisconnected":0, "agentsNotified":1 } }

// server → agent (advisory, the live one)
{ "type":"CUSTOM", "name":"KeyRevokePending",
  "value": { "key":"u-Xyz...", "mode":"sessionEnd" },
  "targetAgentId":"laptop-agent-2", "source":"server" }

// later — agent disconnects naturally; server fires second frame
// server → main
{ "type":"CUSTOM", "name":"KeyRevoked", "value": {
    "key":"u-Xyz...", "mode":"sessionEnd",
    "agentsDisconnected":1, "agentsNotified":1 } }
```

---

## 8. Open Questions for main Implementation Review

1. **`KeyDelete` admin op** — should this draft also specify the `REVOKED → DELETED` transition's RPC, or defer to a v0.2? (Current draft mentions DELETED as a state but no RPC fires it.)
2. **TTL refresh / extend** — is `KeyExtend{key, addTtl}` worth a 6th message, or do we treat keys as immutable-TTL (revoke + reissue is the renew path)?
3. **`PERMISSION_DENIED` audit** — should the server log every denied `Key*` RPC to a separate audit channel (`name:'KeySecurityAudit'` board emit) or only console.warn?
4. **`agentName` vs `label` reconciliation** — if an agent ignores `AgentNameChanged`, should the live board surface a small "label/name mismatch" badge, or is silent divergence fine (as this draft currently specifies)?
5. **`KeyList` pagination** — at scale (>200 keys), should `KeyList` accept `{ offset, limit }`? Current draft assumes single-shot full list.
6. **Per-key `connectionStatus` push** — should the server emit `KeyConnectionChanged{key, status}` proactively on HELLO / disconnect, or does the UI poll via `KeyList`? Push would mirror `AgentList` pattern.

---

## 9. Provenance & Cross-Refs

- **§13.11 HELLO handshake** — `agentId`/`role`/`upstreamKey` query-string path that `KeyIssue` produces. `joinUrl` in the `KeyIssued` response is exactly the §13.11 connect URL.
- **§13.13 A2A ack tier** — `Ack{delivered}` auto-fires on `Key*` relay; `AckProcessed` is optional and treated as advisory.
- **§13.16 turn-end rearm** — orthogonal (watcher liveness, not key auth). Mentioned only so reviewers see the discipline footprint.
- **seq 79 HistoryStore RRP** — `key.json` shape designed to migrate cleanly into a `keys` SQL table once `SqliteStore` lands. JSON remains rollback floor.
- **`server.cjs:214/215`** — existing `RegisterUpstreamKey` / `RegisterCollabKey` lines; this draft supersedes the upstream half (`RegisterUpstreamKey` → `KeyIssue`) and **leaves collab untouched**. Implementation MAY keep `RegisterUpstreamKey` as a thin alias for one minor version then remove.
- **`server-NOTES.md` §3** — envelope CUSTOM-wrap table will gain 5 new rows (`KeyIssued` / `KeyListResult` / `KeyRevoked` / `KeyLabeled` / `AgentNameChanged`) when this draft is implemented.

---

*Draft v0.1 — 2026-05-31. EG-side authored against main user feature #406 (seq 77/83). Awaiting main hub review before promotion to v1 and reference-implementation commit.*
