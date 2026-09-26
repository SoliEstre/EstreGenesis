# WS-PROTOCOL: Key Management (v0.5 — IMPLEMENTED)

**Status**: **v0.5 IMPLEMENTED** — Constellation v2.4.167 separates expiry from revocation (derived `phase`, grace-period renewal on request, `KeyPurge`, closed lifetime set). v0.4 (Constellation v2.4.52) added `kind: 'peer'`. Wire-compatible with v0.4 callers except that a new `KeyIssue` with a `ttl` outside the allowed set (including `0`) is now refused `INVALID_TTL`, and a connection that presents two distinct keys is refused `key-ambiguous` (§3.10).
**Track**: WS-PROTOCOL extension (companion to §13.11 HELLO / §13.13 A2A ack)

> **v0.5 changelog (Constellation v2.4.167, §13.25.19)** — expiry is not revocation: expiry no longer writes `REVOKED` (stored or derived); a derived `phase` (`active` / `standby` / `dormant` / `revoking` / `revoked` / `deleted`) replaces the `REVOKED`-means-expired view; `standby` keys renew on reconnect when the holder carries the renewal marker (`renew=1` / `renewRequest: true`) and the policy `keys.graceRenew` allows it; `ConnectionRejected` carries `phase` / `renewable` / `graceUntil`; lifetimes are 15 / 30 / 90 days (`ttlDays`) with per-kind defaults; `KeyRenew` (§3.7) and `KeyPurge` (§3.8) are specified here; `KeyRevoke` accepts expired keys; invariant 2 is limited to explicit revocation. Hardening in the same release: one presented key per connection (`key-ambiguous`); revoked and purged keys refused by name (`key-revoked`) whatever the legacy registry says; identity failures during standby renewal reported under their own codes, and standby renewal limited to keys already bound and to the issuance cap (§3.9, §3.10); `KeyPurge` takes `{keyRefs}` or `{all: true}` only, and its tombstone keeps a `keyHash` that blocks re-adoption (§3.8); startup finalizes orphaned `REVOKED_PENDING` rows and removes revoked keys from the legacy registry (§6); local key strings leave every reply (§3.6); `KeyListResult` reports `graceRenew` and `ttlAny` (§3.2).

> **v0.4 changelog (Constellation v2.4.52)** — additive:
> - **`KeyIssue.value.kind`** gains **`'peer'`** — peer-main key (§13.9.3): the main of another project attaching for cross-project coordination. Key prefix `pk-`; join via `ws://…/ws?peerKey=<pk-…>` (dedicated URL parameter — a peer key MUST NOT ride `upstreamKey`) or `/join/peer?key=<pk-…>` (dynamic onboarding md). Resolves to the **`peer` wire role** — a peer shape like collab/upstream (autonomous, no Delegate-wait, no SetMain), distinct from `upstream` whose intended occupant is an autonomous external agent. Before v0.4 a peer-main had to ride an upstream key, conflating the two in classification, key management, and dashboard grouping.
> - **Dashboard** — UI4 kind radio gains 🤝 피어메인; UI5 manager gains a peer filter tab + 🤝 kind chip; the realtime window gains a peer tab group (로컬↔협업 사이) + `Main↔Peer` / `Peer↔Peer` / `Peer↔Collab` monitors (lazy — hidden until traffic) + a prompt-target selector (§13.23.4).
> - **Role determination** — `wsAgentRole` returns `'peer'` for `pk-` keyed connections (precedence: collab > peer > upstream > main > local).
> - **Back-compat**: v0.3 callers unaffected; unknown-kind coercion at the reference server still defaults to `upstream` for pre-v0.4 issuers.
>
> **v0.3 changelog (Constellation v2.4.1, EG v2.5.58)** — additive:
> - **`KeyIssue.value.kind`** — `'upstream'` (default, back-compat) | `'collab'` | `'local'`.
> - **`KeyIssue.value.roleDescription`** — optional string ≤256 chars (allows `\n\t`, no other control chars). 합류 에이전트에게 전달될 역할 설명.
> - **§3.6 Local Key (`kind: 'local'`)** — 로컬 워커 합류 시 키 사용 + 파일 경로 / 스크립트 호출 등록. **Wire-private**: 키 자체 (`lk-` prefix) 는 `KeyIssued` 응답에 포함 안 됨; 서버가 `${DIR}/local-keys/<label>.key` 파일에 atomic write+fsync 로 저장하고 응답에는 `joinFile` + `joinScript: 'scripts/join-local.cjs'` + `joinHint` (한 줄 명령) 만 포함. 로컬 워커는 `scripts/join-local.cjs` 가 `LOCAL_KEY_FILE` env 로 파일 경로 받음 → 파일에서 키 읽기 → ws 합류. local 라벨은 `/^[a-zA-Z0-9_-]+$/` (파일명 safety). 보안 (외부 wire 노출 0) + 사용성 (URL 공유 없음, 로컬 명령 한 줄) 가치.
> - **§3.2 `KeyList` 응답 확장** — 각 key entry 에 `roleDescription` 포함. local kind 의 경우 `key: null` (wire-private 유지) + label/joinFile 만.
> - **`/join/local?label=<label>` HTTP endpoint** — label 만 받음 (키 URL 노출 안 함), 활성 local 키 찾으면 `wsLocalOnboardMd(host, label, roleDescription)` 반환.
> - **Dashboard UI4** — kind radio (🔑 업스트림 / 🔗 협업 / 🏠 로컬) + `roleDescription` textarea (역할 설명). local 발급 시 키 자체 안 보이고 `joinHint` (한 줄 명령) + `joinFile` 표시 + "명령 복사" 버튼.
> - **Dashboard UI5 모달** — 각 행에 `🏠` local kind chip + `🎭 <roleDescription>` chip 표시.
> - **Onboarding md (collab/upstream/local 셋 다)** — `roleDescription` 임베드 ("역할 (메인이 부여한 의도)" 섹션).
> - **Back-compat**: v0.2 caller (kind 미명시) → 기본 `upstream` 유지. roleDescription 누락 → null. 기존 `RegisterUpstreamKey` transitional alias 영향 없음.
>
> **v0.2 changelog (v2.4.0)**: title scope generalized from "Upstream" to "Key Management". RegisterUpstreamKey 는 §3.1 retirement schedule 따라 transitional alias 보존.
**Provenance**:
- User feature **#406** (main hub, 2026-05-31) — Liveboard UI 5 items, of which 3 require upstream key management protocol
- main delegate **seq 77** (`m-mpt4dja7-76`) introduced the 5-item UI set
- main delegate **seq 83** (`m-mpt4xm75-82`) confirmed split: **main implements UI 1+2 first**; **UI 3 / 4 / 5 wait for this protocol draft**
- DB persistence path: **seq 79** (`m-mpt4mzo9-78`) — HistoryStore + node:sqlite RRP. Until that lands, key state lives in file-based `key.json` (atomic write + fsync).
- Lineage of existing key emit: `server.cjs:214/215` (`RegisterUpstreamKey` → `UpstreamKeyIssued`, `RegisterCollabKey` → `CollabKeyIssued`). This draft **supersedes** the upstream half of that pair while keeping the collab half untouched. Per main upstream seq 113 reconciliation (msgId `m-mptiputv-112`), the legacy `RegisterUpstreamKey` handler is **retained as a transitional backward-compat alias** (not removed) — see §3.1 Retirement schedule.

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

Issue a new upstream key. **Supersede target** of `RegisterUpstreamKey`. `KeyIssue` is the **canonical / preferred** call for all new code; `RegisterUpstreamKey` is retained as a **transitional backward-compat alias**, deprecated since v0.2 (see "Retirement schedule" below).

**Reconciliation note (main upstream seq 113, msgId `m-mptiputv-112`)**: a prior framing of this section (EG commit `0ffdba0`) declared the legacy handler "removed". Main upstream's v0.2 ship instead **kept** the legacy `RegisterUpstreamKey` handler for backward compatibility ("메인은 하위호환 남김"). This section is reconciled to that runtime truth: legacy is **retained for a transitional period** and emits a server `WARN` log on each use; new code MUST target `KeyIssue`.

**Canonical vs transitional alias — what the table below describes**: `KeyIssue` is a **new implementation** that replaces the prior generic key-issue path for upstream-key registration. The behavioral-delta table compares the **transitional alias** (`RegisterUpstreamKey`, still accepted for backward compatibility) against the **canonical replacement** (`KeyIssue`, preferred for all new code). It is **not** a comparison between a retired call and its replacement — both calls are currently dispatchable on the server.

| Aspect | `RegisterUpstreamKey` (transitional alias, `server.cjs:214`) | `KeyIssue` (canonical, this draft) |
|---|---|---|
| **Default TTL** | Inherited from generic key-issue path (no upstream-specific default; effectively unbounded / session-lifetime) | Chosen from the closed set **15 / 30 / 90 days**; per-kind default (`upstream` 30 days) since v0.5 — 14 days before it (see "TTL semantics" below) |
| **Label-generation policy** | Free-form, no validation beyond non-empty; collisions tolerated (multiple keys could share a label) | Validated (`>0` and `≤64` chars, no control chars); uniqueness **not** enforced at server but UI 5 surfaces collisions; supports `KeyLabel` rename with `AgentNameChanged` broadcast side effect |
| **Visibility scope** | Emitted into the generic board stream (`UpstreamKeyIssued` event, mixed with collab key events on the same channel) | Scoped to the **main hub only** as a direct response (`KeyIssued`); no board broadcast — keys are not part of the public board surface. `KeyList` is the canonical enumeration RPC, also main-only |
| **State machine** | Implicit — key exists or it doesn't; no `REVOKED_PENDING` transient | Explicit five-state `@machine` (§4); `REVOKED_PENDING` allows graceful session-end |
| **Persistence** | Ephemeral / in-memory under the prior path | `key.json` atomic-write + fsync; migration path to `keys` SQL table (seq 79) |
| **Permission gate** | Implicit (any caller on the server-internal path) | Explicit `isMain(conn)` check; non-main senders receive `PERMISSION_DENIED` |

**Migration discipline**: `RegisterCollabKey` is left **untouched** (see §1 out-of-scope; collab key surface is a separate role). A future RFC may unify under a single `Key*` namespace once DB lands.

#### Retirement schedule (transitional alias)

| Phase | Status of `RegisterUpstreamKey` | Server behavior |
|---|---|---|
| **NOW** (v0.2, current) | **Deprecated**, accepted | Handler dispatches normally; server emits a `WARN` log on every invocation (`legacy RegisterUpstreamKey called by <agentId>; migrate to KeyIssue`). No client-visible error; no `KeyError{DEPRECATED}` frame — silent on the wire, loud in the log. |
| **Removal** | **No fixed date**. Removal is gated on "EG repo migration verified zero-traffic on the legacy path" — i.e., the WARN log shows no hits for a full rolling window (≥7 days) across all known consumers, **and** the EG-side caller audit (grep + runtime telemetry) confirms no remaining `RegisterUpstreamKey` emit. | Handler returns `KeyError{ code: "DEPRECATED_REMOVED", message: "RegisterUpstreamKey was removed; use KeyIssue", re_msgId }`. The frame still carries `ackFor` (§13.13 invariant). |

**Why no fixed-version removal**: a v0.3 hard-cut would force a coordinated EG↔main flag-day. The zero-traffic gate is safer — it lets the WARN log do the load-bearing work of confirming migration completion, and the removal lands as a non-event once telemetry says it's safe. (Per main upstream seq 113 ship discipline.)

#### Migration guide — legacy → canonical

Callers using `RegisterUpstreamKey` should migrate to `KeyIssue`:

```jsonc
// LEGACY (transitional alias, deprecated since v0.2 — server emits WARN on use):
{ "type":"CUSTOM", "name":"RegisterUpstreamKey", "msgId":"m-...",
  "value": { "alias": "phone-claude", "label": "phone-claude" } }

// CANONICAL (preferred for all new code):
{ "type":"CUSTOM", "name":"KeyIssue", "msgId":"m-...",
  "value": { "label": "phone-claude", "ttlDays": 30, "kind": "upstream" } }
```

Field mapping: `RegisterUpstreamKey{alias, label}` → `KeyIssue{label, ttlDays, kind: "upstream"}`. The `alias` field collapses into `label` (the canonical replacement has no separate alias concept — label is the single human identifier).

**TTL semantics — intentional v0.2 behavioral fix** (not a regression; *historical — v0.2 to v0.4, superseded by the v0.5 paragraph below*): the legacy path had no upstream-specific TTL default and effectively ran session-lifetime. `KeyIssue` defaults to **14 days** (`1209600000` ms). This is an **intentional** v0.2 behavioral correction (the legacy default was unbounded-by-accident, not by design). Migrating callers that **want** session-lifetime semantics MUST set `ttl` explicitly — either to a chosen bounded value, or to `0` (no expiry; discouraged but supported, see §4.1 `ttl === 0` semantics). Callers that simply want a sane bounded lifetime can omit `ttl` and accept the default.

**Superseded in v0.5 (Constellation v2.4.167, §13.25.19)** — the lifetime is no longer a free millisecond value. The allowed set is **15, 30 and 90 days** (`KEY_TTL_CHOICES_DAYS`); an omitted lifetime takes the kind's default (`KEY_TTL_DEFAULT_DAYS`: `local` 90, `peer` 30, `collab` 30, `upstream` 30). `ttl: 0` is **refused** on new issuance, also under the test bypass below — "no expiry" survives only on keys that already carry it (legacy adoption, Constellation §13.25.10). Keys issued under the former 14-day default keep that length until their next renewal (§3.7). The transitional aliases register with the kind's default. Test fixtures that need sub-day lifetimes set env `WS_KEY_TTL_ANY=1`, which admits any positive millisecond value, logs a warning at boot, and is reported as `ttlAny: true` on `KeyListResult` (§3.2).

**Request `value`**:
```jsonc
{
  "label":   "string",     // human label, e.g. "phone-claude", "co-pilot-laptop"
  "kind":    "upstream",   // optional. upstream (default) | collab | local | peer — closed set, unknown → UNKNOWN_KIND
  "ttlDays": 30,           // optional (preferred). one of 15 | 30 | 90. absent → the kind's default
  "ttl":     2592000000    // optional (compatibility). ms; accepted only when it equals a member of the set. 0 → INVALID_TTL
}
```

**Response (server → main)** — `name: "KeyIssued"`, `value`:
```jsonc
{
  "key":      "u-<22 base62 chars>",      // opaque, server-generated, never reused
  "joinUrl":  "ws://host:7878/ws?upstreamKey=<key>",  // pre-formed URL for share (declared public host if any, else loopback — unchanged since v2.4.0)
  "joinUrls": [                           // v2.4.85 §13.25.8 — every address the server knows, so the issuer picks instead of guessing
    { "host": "localhost:7878",    "scope": "loopback", "iface": "loopback", "url": "ws://localhost:7878/ws?upstreamKey=<key>",    "reachable": true },
    { "host": "192.168.0.12:7878", "scope": "lan",      "iface": "Wi-Fi",    "url": "ws://192.168.0.12:7878/ws?upstreamKey=<key>", "reachable": false }
  ],
  "bind":     "127.0.0.1",                // v2.4.85 — actual listen bind (reachable is derived from this, not from intent)
  "exposed":  false,                      // v2.4.85 — false = loopback-only bind, so every non-loopback row is reachable:false
  "label":    "phone-claude",             // echo
  "ttl":      2592000000,                 // resolved lifetime in ms (30 days here)
  "issuedAt": 1780193127639,              // server clock, ms epoch
  "keyRef":   "kr-…",                     // non-secret stable handle (Constellation §13.25.12) — every management verb accepts it
  "expiresAt": 1782785127639              // (renewedAt ?? issuedAt) + ttl — carried, never to be recomputed by consumers
}
```

`joinUrls` ordering is **declared public host → loopback → LAN IPv4 → global IPv6** (link-local excluded), capped at 12 entries. It is purely additive: consumers that read only `joinUrl` are unaffected. `kind: 'local'` is unchanged — wire-private, no URL (§3.6).

**Authorization (v2.4.87, Constellation §13.25.9)** — every message in this protocol, plus the transitional `Register*` / `Revoke*` aliases and `SetMain`, is an **operator** verb:

- agent-surface connection (`HELLO` seen) → permitted only when the resolved role is `main`; `local` / `upstream` / `peer` / `collab` get `PERMISSION_DENIED`, through the aliases as well as the canonical verbs.
- board-surface connection (no `HELLO`) → permitted from loopback, or from an address that passes the `ui` allowlist. An exposed board with no `ui` allowlist keeps the prior open behavior and says so in the boot log.

Prior to v2.4.87 the gate keyed off `conn.meta.role === 'agent'`, which is set only in the `HELLO` branch — so a connection that never sent `HELLO` was treated as an operator, and `agent.requireKey` (also `HELLO`-time) did not apply. Adopter-reported; the alias ordering was the visible half.

**`adoptedFromLegacy` (v2.4.87)** — `KeyList` rows carry this boolean. `true` means the key was found in the legacy registry at boot and adopted into `keyStore` so it could be managed at all; there is no issuance record behind it. Adoption never revokes — surfacing a live credential for operator judgment beats silently invalidating a working one.

**Errors** (server → main, `name: "KeyError"`, `value: { code, message, re_msgId }`):
- `LIMIT_EXCEEDED` — too many active keys (default cap 32, configurable via env `WS_KEY_MAX_ACTIVE`)
- `INVALID_LABEL` — empty / >64 chars / control chars
- `INVALID_TTL` — a lifetime outside the allowed set (15 / 30 / 90 days), including `0` (also under `WS_KEY_TTL_ANY`); the error carries the allowed values (`allowedDays`, `allowedMs`). (Before v0.5: negative or beyond an unnamed cap.)
- `UNKNOWN_KIND` — `kind` present but not in the closed set (absent is the default, not an error — Constellation §13.16.11)

**Side effects**: new entry in `key.json` (state `ISSUED`); no broadcast.

---

### 3.2 `KeyList` — main → server

Enumerate all known keys (any state). Used by the UI 5 "key management window" to render the table.

**Request `value`**:
```jsonc
{
  "includeRevoked": false,  // optional. default false → explicitly revoked rows omitted. Expired keys (standby / dormant) are NOT revoked and are listed by default (v0.5)
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
      "ttl":              2592000000,
      "issuedAt":         1780193000000,
      "state":            "ACTIVE",           // stored state — see §4 machine. Never "REVOKED" for an expired key (v0.5)
      "keyRef":           "kr-…",
      "expiresAt":        1782785000000,
      "renewedAt":        null,
      "renewCount":       0,
      "revokedAt":        null,               // set ⇔ explicit revocation
      "phase":            "active",           // v0.5 derived: active | standby | dormant | revoking | revoked | deleted (§4)
      "graceUntil":       null,               // v0.5: standby / dormant only — max(expiresAt, lastSeenAt) + grace
      "ttlDays":          30,                 // v0.5: present when ttl is in the allowed set; absent for legacy lengths (e.g. the former 14 days) and ttl 0
      "ttlChoices":       [15, 30, 90]        // v0.5: the allowed set, so a surface renders the choice without hard-coding it
    }
    // ...
  ],
  // v0.5 list-level fields — the policy as the server applies it, so a surface need not assume it
  "ttlChoices":  [15, 30, 90],
  "ttlDefaults": { "local": 90, "peer": 30, "collab": 30, "upstream": 30 },
  "graceMs":     259200000,               // standby window (WS_KEY_GRACE_MS)
  "graceRenew":  true,                    // access.json keys.graceRenew — standby renewal on request is on
  "ttlAny":      false                    // true when the test-only WS_KEY_TTL_ANY bypass is on; a surface SHOULD warn
}
```

`key` is `null` for `kind: 'local'` rows (§3.6) and for `revoked` / `deleted` rows: a finished key's string has no further use, and every verb selects by `keyRef`.

**Capability detection.** A management surface SHOULD derive what the server supports from the list-level fields rather than assume it. A list without them comes from a pre-v0.5 server, which refuses the period choice, `KeyPurge`, and revoke or relabel on an expired key, so those controls are hidden, and a surface that has not yet received a list behaves the same way. A `standby` row is shown as renewing on its own only when `graceRenew` is `true`. The policy is changed through `/api/access` (Constellation §13.25.5), which replaces the whole policy, so a writer reads the current policy first and changes only `keys.graceRenew`.

`lapsed` (v2.4.103) remains on the row for compatibility and is `true` exactly when `phase` is `standby` or `dormant`. New consumers SHOULD read `phase`.

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
  "key":               "u-AbC123...",   // null for kind local (v0.5, §3.6)
  "keyRef":            "kr-…",
  "mode":              "immediate",
  "agentsDisconnected": 2,       // # of live conns just closed (0 for sessionEnd with active sessions)
  "agentsNotified":     2,       // # of agents that received the close frame / pending-revoke notice
  "error":             "…"       // v0.5, only on failure: the legacy registry write failed. The key is still refused at admission (§3.10), but the file on disk still lists it
}
```

For `sessionEnd` with N active sessions:
- `agentsDisconnected = 0` (immediate)
- `agentsNotified = N` (server sends each a `name:"KeyRevokePending", value:{ key, keyRef, mode:'sessionEnd' }` so the agent UI can surface "this key will revoke at session end"; `key` is `null` for kind local)
- A second `KeyRevoked` frame fires to main when the key finally lands in `REVOKED` — same shape but `agentsDisconnected` reflects the natural-close count.

The key may be selected by `keyRef` instead of `key` (the only selector for `kind: 'local'`). Revocation is accepted in phases `active`, `standby` and `dormant`: an expired key is revocable. `immediate` is also accepted on `revoking` (`REVOKED_PENDING`) as an escalation. Before v0.5 an expired key answered `ALREADY_REVOKED`, because expiry read as `REVOKED`, so an operator could not retire a key they no longer wanted, and renewal was the only verb that changed anything.

**Errors**:
- `KEY_NOT_FOUND` — unknown key
- `ALREADY_REVOKED` — phase `revoked` or `deleted` only (explicitly revoked or purged). Never returned for an expired key.
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
  "key":      "u-AbC123...",   // null for kind local (v0.5, §3.6)
  "keyRef":   "kr-…",
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

### 3.6 (reserved — local keys)

Referenced from the v0.3 changelog and from Constellation §13.25.11 / §13.25.12 as "§3.6 Local Key". The behaviour is specified in the v0.3 changelog entry above: a local key is written to a file and never put on the wire. This number is kept for those references.

**v0.5 — every frame, not only issuance and listing.** A server frame that names a `local` key carries `key: null` and selects it by `keyRef`: `KeyIssued`, `KeyListResult` rows, `KeyRenewed`, `KeyLabeled`, `KeyRevoked` (both modes, including the second `sessionEnd` frame to the main), and `KeyRevokePending`. Before v0.5 the last three carried the string, and a main whose bridge records inbound frames kept it on disk after the key was purged. Other kinds still carry `key` for compatibility. Server logs name keys by fingerprint, including the anonymous-HELLO line, which used to print the raw frame. `KeyPurge` of a local key deletes every file in `local-keys/` whose content is that key, whatever its name, since relabelling does not rename the file.

---

### 3.7 `KeyRenew` — operator → server (Constellation §13.25.12, v2.4.103; lifetime rule v0.5)

Start a new validity window for an existing key. **The key string does not change**, so the holder reconnects with what it already has. Renewal is also the only way to *change* a key's lifetime: there is no separate verb.

**Request `value`**:
```jsonc
{
  "keyRef":  "kr-…",   // or "key" (compatibility); keyRef is the only selector for kind local
  "ttlDays": 90        // optional. one of 15 | 30 | 90 (or "ttl" in ms, same set)
}
```

Lifetime rule: the requested lifetime; else the key's own `ttl` when it is in the allowed set; else the kind's default. So a key issued under the former 14-day default moves into the set on its first renewal. The new window starts now: `renewedAt = now`, `expiresAt = now + ttl`.

**Same-period exception (v0.5).** A request with `ttl` (ms), no `ttlDays`, and a value equal to the key's current `ttl` means "the same period again". It is accepted even when that value is outside the set and is resolved as if no lifetime were given, so a 14-day key moves to its kind's default. Renewal clients written before the set existed echo the key's own lifetime; refusing that would break renewal for every such key. Any other out-of-set value is `INVALID_TTL`, and `ttlDays` has no exception.

**Response** — `name: "KeyRenewed"`, `value`: `{ key (null for local), keyRef, label, kind, ttl, ttlDays, issuedAt, renewedAt, expiresAt, wasLapsed, prevPhase, phase, renewCount, error? }`. Live connections holding the key receive a value-free `KeyRenewed{ keyRef, label, expiresAt, ttl, wasLapsed }`.

**Side effects (v0.5, MUST)**: clears `expiredAt`; when the stored `state` is `REVOKED` with no `revokedAt` (the pre-v0.5 expiry write), restores it to `ACTIVE` if `lastSeenAt` is set, else `ISSUED`; resets the expiry-notice bookkeeping so a later expiry is announced again.

**Accepted phases**: `active`, `standby`, `dormant`.

**Errors**: `KEY_NOT_FOUND` · `NOT_RENEWABLE` (phase `revoked` / `revoking` / `deleted` — revocation is terminal) · `NO_EXPIRY` (the key has `ttl: 0`) · `INVALID_TTL` (outside the allowed set, `0` included, apart from the same-period exception).

**Authorization**: operator verb (Constellation §13.25.9). The one server-initiated renewal, standby renewal on request (§3.9), is not reachable through this verb.

---

### 3.8 `KeyPurge` — operator → server (v0.5)

Retire revoked rows. Operator verb (in the same gate as every `Key*` verb).

**Request `value`** — exactly one of two shapes:
```jsonc
{ "keyRefs": ["kr-…", "kr-…"] }   // only these rows (those not eligible are skipped)
{ "all": true }                   // every eligible row
```
Anything else (`keyRefs` that is not an array, an empty `value`, `{}`) → `KeyError{code: "INVALID_ARGUMENT"}`. A purge cannot be undone, so "everything" is never inferred from a missing or malformed argument. A surface SHOULD send the `keyRefs` of the rows it displays rather than `all`, so a key revoked after the list was fetched is not purged unseen.

**Eligible**: `revokedAt` set **and** state not `REVOKED_PENDING`. A row still finishing a `sessionEnd` revocation is not purged under it.

**Effect — a tombstone, not a deletion**: the row stays in `key.json` with `key: null` (the secret is gone), `keyHash: "sha256:<hex of the key>"`, `deletedAt` stamped and `state: "DELETED"`. Invariant 3 is preserved. The audit question "did this `keyRef` exist and when was it revoked" stays answerable, and the credential no longer sits on disk. The hash lets the server recognize the purged key without holding it: admission refuses it `key-revoked` (§3.10), and startup never re-adopts a legacy-registry key whose hash matches a tombstone (§6), which would otherwise return it as a new key with `ttl: 0`. For `kind: 'local'`, every `local-keys/*.key` file whose content is the key is deleted (§3.6).

**Response** — `name: "KeyPurged"`, `value`: `{ count, keyRefs, error? }`. If the `key.json` write fails, the rows are rolled back and the reply is `{ count: 0, keyRefs: [], error }`. If it succeeds, `error` lists any legacy-registry write or local-key-file deletion that failed. Failures are never swallowed.

---

### 3.9 `key-expired` refusal and the renewal marker (v0.5)

A presented key is checked at both admission sites (the upgrade for URL keys, HELLO for body keys) by one shared predicate (Constellation §13.25.13).

**Renewal marker** — the holder asks "renew me if I am in standby" when it connects:
- URL key: query parameter `renew=1`
- HELLO body key: `renewRequest: true`

The marker has no effect outside the `standby` phase. It never extends an `active` key and never revives a `dormant` or `revoked` one. Clients therefore SHOULD send it on every attempt, and the reference clients do. A URL-key connection SHOULD carry the marker in its HELLO as well, because the HELLO site re-checks the URL key.

**Grace conditions** — a `standby` key is renewed only when all of these hold (Constellation §13.25.19):
- **G1 policy** — `keys.graceRenew` in `access.json` is on (default `true`; the operator can switch it off from the key-management window);
- **G2 bound** — the key has a `boundAgent` (set at issuance or on first use) or a `lastAgent`. An unbound key, never used and issued without a `boundAgent`, has no identity to check, so a leaked one could extend its own life and bind itself in the same step; it is left to the operator;
- **G3 cap** — the active-key count is below `WS_KEY_MAX_ACTIVE`, since a renewed key counts as active again;
- **I identity** — at HELLO: an agent id is declared, the identity binding matches, and it is not a local key presented remotely.

**Where the renewal is applied** — only after the holder's identity is settled. At the upgrade site the server does not yet know which agent presents a URL key, so a `standby` key with the marker and G1–G3 holding passes the upgrade unrenewed, and the renewal is applied at the HELLO site once I holds. A key-bearing connection receives no board state before its HELLO verdict (Constellation §13.25.14), so the client-visible behaviour is the same.

**Client classification** — by `renewable`, not `phase` alone: `renewable: 'request'` on a `standby` refusal is transient (a server between versions) and is not surfaced; `renewable: 'operator'` (`dormant`, or a `standby` key the server will not renew) needs a human and is surfaced once per streak with the remedy. Every other code (§3.10) is surfaced as its own cause.

**Predicate outcome for an expired or finished key**:

| phase | marker | G1–G3 | I (HELLO) | result |
|---|---|---|---|---|
| `standby` | yes | all hold | passes | **renewed and admitted** — lifetime rule of §3.7, `renewedBy: 'grace-request'`, `renewCount++`, one log line, `ServerNotice{kind:'key-renewed', keyRef, label, via:'grace-request', expiresAt}` to boards and the main (notice group — wakes no agent) |
| `standby` | yes | any | fails | refused with the identity code unchanged (`agent-id-required` · `local-key-remote` · `key-identity-mismatch`), never `key-expired` |
| `standby` | no | all hold | — | refused `key-expired`, `renewable: 'request'` |
| `standby` | any | any fails | — | refused `key-expired`, `renewable: 'operator'`, hint names the failed condition — a client treats this as `dormant` |
| `dormant` | any | any | — | refused `key-expired`, `renewable: 'operator'` |
| `revoked` / `deleted` | any | any | — | refused `key-revoked`, `renewable: 'none'` |

At the HELLO site an identity failure is reported ahead of G1–G3. At the upgrade site identity is not yet known, so a URL key failing G1–G3 is refused there with `renewable: 'operator'`.

**Refusal frame** — sent before `SERVER_HELLO`'s board payload (Constellation §13.25.13 / §13.25.14), then the socket closes:
```jsonc
{ "type":"CUSTOM", "name":"ConnectionRejected", "source":"server",
  "value": { "code":"key-expired", "phase":"standby", "renewable":"request",
             "graceUntil":1783044000000, "label":"phone-claude", "expiresAt":1782785000000,
             "hint":"…" } }
// dormant: "phase":"dormant", "renewable":"operator", no graceUntil,
// hint: the board's operator renews it from the key-management window and the same key reconnects
```

`phase` and `renewable` are carried at **both** admission sites. Before v0.5 the HELLO-site refusal carried neither the label nor the expiry.

---

### 3.10 The presented key and admission refusal codes (v0.5)

**One presented key per connection (MUST).** A key may arrive in the URL parameters `key`, `peerKey`, `upstreamKey`, `collabKey` (each possibly repeated) and in the HELLO fields of the same names. The server collects every non-empty value from both places. More than one distinct value → refused `key-ambiguous`. Otherwise the single value is **the** presented key, the one input for role flags, the admission predicate (§3.9), identity pinning, `requireKey`, logging, and the connection matching that `KeyRevoke` uses. Before v0.5 each site judged the first non-empty value but granted the upstream role whenever `upstreamKey` alone was valid, so `?key=<junk>&upstreamKey=<dormant key>` skipped the expiry and binding checks, gained the dormant key's role, and could not be found by an immediate revocation of that key.

**Refusal codes** — carried as `code` in the `ConnectionRejected` body (`source: 'server'`). At the upgrade site the socket then closes with `4003`; at HELLO it closes with `4403`.

| `code` | Site | When | `renewable` | Remedy |
|---|---|---|---|---|
| `key-ambiguous` | upgrade · HELLO | more than one distinct key presented | — | send one key |
| `key-revoked` | upgrade · HELLO | phase `revoked` or `deleted`, recognized by value or by tombstone `keyHash`; refused even when the legacy registry still lists the key | `none` | the operator issues a new key |
| `key-expired` | upgrade · HELLO | phase `standby` or `dormant` and not renewed (§3.9) | `request` · `operator` | `request`: reconnect with the marker; `operator`: the operator renews |
| `agent-id-required` | HELLO | a `standby` key with the marker, HELLO without an agent id | — | declare the agent id |
| `local-key-remote` | HELLO | a `local` key presented from a non-loopback address | — | use a collab / peer / upstream key |
| `key-identity-mismatch` | HELLO | the key is bound to a different agent id | — | reuse the bound identity's connection, or have the operator revoke and reissue |
| `key-required` | HELLO | `agent.requireKey` and no valid key from a non-loopback address | — | present a valid key |

The lifetime refusals (`key-expired`, `key-revoked`) carry the key's `label`. No refusal carries the key string.

---

## 4. `@machine` — Key Lifecycle

### States

| State | Meaning | Live conn possible? | Key usable for new HELLO? |
|---|---|---|---|
| `ISSUED` | issued, never used | no | yes |
| `ACTIVE` | issued and at least one HELLO has been observed | yes (current or past) | yes |
| `REVOKED_PENDING` | `sessionEnd` revoke fired while a live conn existed; new HELLOs blocked | yes (existing only) | no |
| `REVOKED` | **explicitly** revoked (`revokedAt` set); no live conns; no new HELLOs accepted | no | no |
| `DELETED` | tombstone — kept for audit (key string removed by `KeyPurge`), hidden from default `KeyList` | no | no |

**Expiry is not a stored state (v0.5).** The five states above record what an operator or a first connection *did*. Expiry is a matter of time, so it lives in the derived **phase** and never in `state`. Before v0.5 expiry wrote `REVOKED` into `state` without `revokedAt`, and renewal never reset it. A key refused once and then renewed was therefore accepted on the wire and terminal on every management verb: hidden from the default list, `ALREADY_REVOKED` on revoke, refused relabelling.

### Phase (derived at read time — v0.5, Constellation §13.25.19)

`expiresAt = (renewedAt ?? issuedAt) + ttl` (`ttl: 0` = no expiry). `graceUntil = max(expiresAt, lastSeenAt) + GRACE`, `GRACE` = 3 days (`KEY_GRACE_MS`, env `WS_KEY_GRACE_MS`). Evaluated top to bottom:

| `phase` | Condition | New connection | Renewal |
|---|---|---|---|
| `deleted` | `deletedAt` set | refused `key-revoked` (matched by `keyHash`) | no |
| `revoking` | state `REVOKED_PENDING` | refused (existing sessions finish) | no |
| `revoked` | `revokedAt` set | refused `key-revoked`, whatever the legacy registry says | no |
| `active` | `ttl: 0` or `now < expiresAt` | admitted | operator (`KeyRenew`) |
| `standby` | expired, `now < graceUntil` | admitted and renewed with the renewal marker when the grace conditions hold; otherwise refused (§3.9) | on request (§3.9) · operator |
| `dormant` | expired, `now ≥ graceUntil` | refused, `renewable: 'operator'` | operator only |

`lastSeenAt` is in `graceUntil` because expiry is checked only at admission. A connection held open across its expiry instant is not cut, so a key in continuous use would otherwise be `dormant` the moment its holder restarted after three days. To keep this true, the expiry sweep (§4.1) refreshes `lastSeenAt` for every key with an open connection.

### Transitions

| From | Event | To | Notes |
|---|---|---|---|
| (none) | `KeyIssue` handled | `ISSUED` | new row in `key.json` |
| `ISSUED` | first HELLO observed with this key | `ACTIVE` | `lastAgent` / `lastSeenAt` stamped |
| `ISSUED` | `KeyRevoke immediate` | `REVOKED` | no live conn to kick |
| `ISSUED` | `KeyRevoke sessionEnd` | `REVOKED` | collapses to immediate (no active session) |
| `ACTIVE` | `KeyRevoke immediate` | `REVOKED` | server closes all live conns (close code 4003) |
| `ACTIVE` | `KeyRevoke sessionEnd` | `REVOKED_PENDING` | new HELLOs rejected; existing conns finish |
| `ACTIVE` | all live conns close naturally + no revoke | `ACTIVE` | stays ACTIVE (just `connectionStatus=disconnected`) |
| `ISSUED` / `ACTIVE` | TTL expiry | *(unchanged)* | v0.5: phase becomes `standby`, later `dormant`; `expiredAt` stamped once on the first refused admission. **State is not written.** (v0.4 wrote `REVOKED` here.) |
| `ISSUED` / `ACTIVE` in `standby` | admission with renewal marker, grace conditions and identity holding | `ACTIVE` | renewed in the admission predicate (§3.9); an unbound key fails G2 and is not renewed this way |
| `ISSUED` / `ACTIVE` (any non-revoked phase) | `KeyRenew` | unchanged | clears `expiredAt`; new window |
| `REVOKED` **without** `revokedAt` (pre-v0.5 expiry write) | `KeyRenew`, or load-time normalization | `ACTIVE` (seen) / `ISSUED` | repairs the v0.4 shape; load logs one line with the count |
| `REVOKED_PENDING` | last live conn closes | `REVOKED` | second `KeyRevoked` frame fires to main |
| `REVOKED_PENDING` | `KeyRevoke immediate` (escalation) | `REVOKED` | kicks remaining live conns |
| `REVOKED_PENDING` | server restart | `REVOKED` | v0.5: finalized at startup, `revokedAt` kept, one log line — the live conn and the grace timer do not survive a restart |
| `REVOKED` | `KeyPurge` (§3.8) | `DELETED` | tombstone: `key: null`, `keyHash`, `deletedAt` stamped, row kept |

### 4.1 TTL expiry — lazy detection (canonical) + sweep for notices

The **canonical** detection model is **lazy**, and since v0.5 it writes no transition:

- **Lazy (canonical)** — no timer is armed per key. Expiry is evaluated when a key is presented at either admission site (the upgrade for a URL key, HELLO for a body key; one shared predicate — Constellation §13.25.13). An expired key is decided by its phase (§3.9): renewed and admitted, or refused with `ConnectionRejected{code:'key-expired', phase, renewable, …}` and closed. The refusal stamps `expiredAt` if it is unset and MUST NOT write `revokedAt` or `state: 'REVOKED'`.
  - A connection already open when its key crosses `expiresAt` is **not** cut. Expiry is enforced at admission only. (v0.4 said the next inbound frame would close it; the reference never did, and the grace rule above relies on that.)
  - `KeyList` computes `phase` / `graceUntil` on demand.
- **Why lazy is canonical** — no timer overhead per key, no risk of a sweeper missing a heartbeat, no drift between the `key.json` truth and the server's in-memory state when the timer-vs-disk race triggers under restart. Expiry is a **read-time invariant**, not a write-time event.

**Periodic sweep** — notices and liveness only, never correctness (reference: every 6 h, env `WS_KEY_EXPIRY_SWEEP_MS`):
- **Before expiry**: inside the warning window (3 days, `WS_KEY_EXPIRY_WARN_MS`) each key is announced at most once per day (`WS_KEY_EXPIRY_WARN_REPEAT_MS`) on the server log, a server-attributed `ServerNotice{kind:'key-expiry'}`, and a `KeyExpiringSoon` notice to the holder's live connection.
- **After expiry**: once per phase change and never again (`lastExpiryNoticePhase` on the row): entering `standby` ("renews automatically when the holder reconnects") and entering `dormant` ("renew from the key-management window"). v0.4-era servers repeated the notice daily with no end condition.
- **Liveness**: refreshes `lastSeenAt` to now for every key with an open connection, so `graceUntil` follows actual use.
- The sweep never closes connections and never writes `state`.

**`ttl === 0` semantics** (no expiry) — since v0.5 refused on new issuance and kept only on keys that already carry it (legacy adoption). Such keys are always `active` until an explicit `KeyRevoke`; `KeyRenew` answers `NO_EXPIRY`.

### Guards / derive (informational, not exhaustive)
- `guard isLive(key)` — `∃ conn in wsAgents : conn.meta.upstreamKey === key`
- `derive connectionStatus(key)` — see §3.2
- `derive expiresAt(key)` — `key.ttl > 0 ? (key.renewedAt ?? key.issuedAt) + key.ttl : 0` (v0.4 wrote `issuedAt + ttl`, which is wrong for any renewed key)
- `derive isExpired(key)` — `expiresAt(key) > 0 && Date.now() > expiresAt(key)`
- `derive phase(key)` — see the phase table above

### Invariants
1. `ISSUED → ACTIVE` is one-way (a key never demotes back to ISSUED even after disconnect).
2. **Explicit revocation is terminal**: a key with `revokedAt` set never returns to `ISSUED` / `ACTIVE`, and re-enabling it requires issuing a *new* key. This invariant covers explicit revocation only. **Expiry is not revocation**: an expired key never acquires `revokedAt` or `state: 'REVOKED'`, and returns to use by renewal (automatic in `standby` on request, operator in `dormant`) with the same key string.
3. `DELETED` is hidden from `KeyList` unless `includeDeleted:true`. Persistence row is **kept** for audit (not deleted from `key.json`); `KeyPurge` removes the key string, not the row.
4. `KeyLabel` may fire in any non-terminal state (`ISSUED` / `ACTIVE` / `REVOKED_PENDING`), which includes expired keys in `standby` / `dormant`. It is **rejected** on `REVOKED` / `DELETED` (`KEY_NOT_FOUND` or a dedicated `KEY_TERMINAL` code — implementer call).
5. `AgentNameChanged` only fires from `ACTIVE` (because `REVOKED_PENDING` keeps its label until full revoke — rename of a pending-revoke key is allowed but the broadcast still fires per §3.5 delivery model).
6. **`REVOKED_PENDING` transient — no new requests accepted from the revoked-role identity.** During the `REVOKED_PENDING → REVOKED` transient, the **only** activity permitted on the key is the **current in-flight turn** of the existing live conn — that turn is allowed to complete, and frames internal to it (turn streaming, tool results, A2A ack frames the existing session already opened) ride through. **Every other inbound frame is rejected**:
   - Any new `SelectionAnswer`, new HELLO re-announce, or any other request originating from a conn where `wsAgentRole(conn) === <the revoked role>` AND `meta.upstreamKey === <the REVOKED_PENDING key>` → server responds with `SelectionError` (for selection-path frames) or `KeyError{ code: "KEY_REVOKE_PENDING", re_msgId }` (for other request types). The conn is **not** closed by this rejection — closure is deferred to natural session end per the `sessionEnd` contract.
   - "New request" means any frame that opens a **new** logical interaction (new turn, new selection, new tool call series). Continuation frames of the **existing** in-flight turn (the one already running when `KeyRevoke sessionEnd` was issued) are not "new" and are allowed through.
   - The transient terminates by **whichever comes first** of:
     - The current in-flight turn closes naturally (the canonical exit path) → state transitions to `REVOKED`, second `KeyRevoked` frame fires to main per §3.3.
     - A configurable **grace period** elapses (env `WS_KEY_REVOKE_PENDING_GRACE_MS`, default **`300000`** — 5 minutes). On grace expiry, the server force-closes the live conn (close code `4003 "key revoke pending grace expired"`) and transitions to `REVOKED`. The grace bound exists so a stuck or wedged session cannot indefinitely hold a `sessionEnd` revoke open.
   - During the transient, `KeyList` continues to surface the key with `state: "REVOKED_PENDING"` so the UI can show "revoking…" status. `KeyLabel` against a `REVOKED_PENDING` key remains allowed (per invariant 4) — the rename persists and the `AgentNameChanged` broadcast still fires to the live conn for that key.

---

## 5. Permissions

| Message | Who may send | Server check |
|---|---|---|
| `KeyIssue` | main only | `isMain(conn)` — see role determination below |
| `KeyList` | main only | `isMain(conn)` |
| `KeyRevoke` | main only | `isMain(conn)` |
| `KeyLabel` | main only | `isMain(conn)` |
| `KeyRenew` | main only (operator) | `isMain(conn)` — standby renewal on request (§3.9) is a server decision under operator policy, not a verb any agent can call |
| `KeyPurge` | main only (operator) | `isMain(conn)` |
| `AgentNameChanged` | **server only** (outbound) | n/a (server-initiated); recipients are live conns of any non-main role (`local` / `collab` / `upstream` / `peer`) whose `meta.upstreamKey === key` |

Non-main senders (`local` / `collab` / `upstream` / `peer`) attempting any mutating `Key*` request receive `name:"KeyError", value:{ code:"PERMISSION_DENIED", re_msgId }` and the request is dropped. The error frame **does** carry `ackFor` so the sender's `_pendingAck` watermark advances (§13.13 invariant — error is still a relay-level "delivered"). Non-main roles remain eligible to **receive** `AgentNameChanged` broadcasts (§3.5) — they just cannot **mutate** keys.

**Role determination** (canonical — matches `server.cjs` `wsAgentRole(c)`):
- `wsAgentRole(conn)` returns one of `'main' | 'local' | 'collab' | 'upstream' | 'peer'` (v0.4):
  - `'collab'`  — HELLO carried a collab-tier key (`meta.collab === true`)
  - `'peer'`    — HELLO carried a peer-main key (`meta.peer === true`, `pk-` prefix — v0.4)
  - `'upstream'` — HELLO carried an upstream key (`meta.upstream === true`)
  - `'main'`    — `agentId === WS_PRIMARY_AGENT` (the orchestrator hub; default `'main-agent'`, overridable via `WS_PRIMARY_AGENT` env)
  - `'local'`   — none of the above (default fallback; e.g., dashboard tabs, anonymous agents)
- **`isMain(conn)`** = `wsAgentRole(conn) === 'main'` — the **only** role permitted to issue `KeyIssue` / `KeyList` / `KeyRevoke` / `KeyLabel`. All other roles (`local`, `collab`, `upstream`, `peer`) fail the gate.
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
      "ttl":        2592000000,
      "lastAgent":  "phone-agent-1",
      "lastSeenAt": 1780193100000,
      "revokedAt":  null,             // ms when an operator revoked it (REVOKED_PENDING or REVOKED) — never set by expiry
      "deletedAt":  null,             // ms when KeyPurge tombstoned it (key → null)
      "keyHash":    null,             // v0.5, tombstones only: "sha256:" + hex of the purged key — lets the server recognize it without holding it
      "ref":        "kr-…",           // non-secret handle, surfaced as keyRef
      "kind":       "upstream",
      "renewedAt":  null,             // start of the current window when renewed
      "renewCount": 0,
      "renewedBy":  null,             // v0.5: "grace-request" when the last renewal was a standby renewal on request
      "expiredAt":  null,             // v0.5 meaning: first observed expiry (record only; cleared by renewal) — not a state
      "lastExpiryNoticePhase": null   // v0.5: last phase announced by the sweep (standby | dormant), so each is announced once
    }
    // ...
  ]
}
```

### Write discipline
- **Atomic write**: `fs.writeFileSync(tmp, JSON.stringify(...))` → `fs.fsyncSync(fd)` → `fs.renameSync(tmp, key.json)`. (Same pattern as `state.json` snapshot writes — matches the §13.16 "snapshot integrity" discipline.)
- **Read on boot**: server loads `key.json` once at startup; if missing, initialize to `{version:1, keys:[]}`. If parse fails, **rename** the bad file to `key.json.corrupt-<ts>` and start fresh (do not silently overwrite — the corrupt file is forensic evidence).
- **Write triggers**: every state transition (§4) and every label rename (§3.4). Last-seen-at update on HELLO is **also** persisted but MAY be debounced (≤1s) to avoid write storms under rapid reconnect.

### Startup repairs (v0.5)
The reference server runs these once at boot, in this order; each is idempotent and logs one line when it changes anything:
1. **Finalize orphaned revocations** — every `REVOKED_PENDING` row becomes `REVOKED` (`revokedAt` kept). The live conn and grace timer it waited on do not survive a restart, and an unfinalized row is neither purgeable nor released from the active-key cap.
2. **Heal the legacy registry** — every key the record shows as revoked or purged (by value or by tombstone `keyHash`) is removed from the legacy role registry (`ws-keys.json`). The two stores can disagree after a failed write, a hand restore or a backup rollback; admission refuses such keys `key-revoked` regardless (§3.10), and this step removes the stale entry.
3. **Adopt legacy-only keys** (Constellation §13.25.10) — skipping any key whose hash matches a tombstone, which would otherwise return a purged key as a new `ttl: 0` key.
4. **Normalize the pre-v0.5 expiry write** — `REVOKED` without `revokedAt` → `ACTIVE` / `ISSUED` (§4 transitions).

Write failures of the legacy registry are reported as `error` on `KeyRevoked` and `KeyPurged`, the same contract as `key.json` failures.

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
    "label":"phone-claude", "ttl":2592000000, "issuedAt":1780193000000 } }

// later — main → server
{ "type":"CUSTOM", "name":"KeyList", "msgId":"m-002", "value":{} }

// server → main
{ "type":"CUSTOM", "name":"KeyListResult", "value": {
    "keys":[ { "key":"u-Abc...", "label":"phone-claude",
               "lastAgent":"phone-agent-1", "lastSeenAt":1780193100000,
               "connectionStatus":"connected", "ttl":2592000000,
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

1. **`KeyDelete` admin op** — should this draft also specify the `REVOKED → DELETED` transition's RPC, or defer to a v0.2? (Current draft mentions DELETED as a state but no RPC fires it.) — **Resolved v0.5**: `KeyPurge` (§3.8), a tombstone transition.
2. **TTL refresh / extend** — is `KeyExtend{key, addTtl}` worth a 6th message, or do we treat keys as immutable-TTL (revoke + reissue is the renew path)? — **Resolved**: `KeyRenew` (§3.7, Constellation v2.4.103) restarts the window with the same key string; v0.5 adds standby renewal on request (§3.9).
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
- **`server.cjs:214/215`** — existing `RegisterUpstreamKey` / `RegisterCollabKey` lines; this draft **supersedes** the upstream half (`RegisterUpstreamKey` → `KeyIssue`) and **leaves collab untouched**. Per main upstream seq 113 (msgId `m-mptiputv-112`) reconciliation, the legacy `RegisterUpstreamKey` handler is **RETAINED for a transitional backward-compat period** — deprecated since v0.2, emits a server `WARN` log on each use, scheduled for removal when EG-side migration is verified zero-traffic on the legacy path (no fixed version cut). See §3.1 canonical-vs-transitional-alias table for the concrete behavioral deltas between the two dispatchable handlers (default TTL, label-generation policy, visibility scope, state machine, persistence, permission gate) and the "Retirement schedule" sub-section for the removal gate. New code MUST target `KeyIssue`; existing legacy callers SHOULD migrate per the §3.1 migration guide.
- **`server-NOTES.md` §3** — envelope CUSTOM-wrap table will gain 5 new rows (`KeyIssued` / `KeyListResult` / `KeyRevoked` / `KeyLabeled` / `AgentNameChanged`) when this draft is implemented.

---

*Draft v0.1 — 2026-05-31. EG-side authored against main user feature #406 (seq 77/83). Awaiting main hub review before promotion to v1 and reference-implementation commit.*

*Reconciliation 2026-05-31 (post-main-upstream seq 113, msgId `m-mptiputv-112`): §3.1 reframed from "supersede + remove legacy" to "supersede + transitional backward-compat alias" with retirement schedule gated on EG-side zero-traffic verification (no fixed version cut). Behavioral-delta table content preserved; relationship semantics updated. §9 cross-ref and §1 provenance reflowed to match. Supersedes the framing in EG commit `0ffdba0`.*
