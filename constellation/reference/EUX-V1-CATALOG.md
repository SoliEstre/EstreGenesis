# EUX v1 Directive Usage Catalog — constellation/*.eux

## Context

This catalog is the EstreGenesis-side ratification companion to the main P1 v1 EUX directive draft (delegate seq 70, msgId `m-mpt1ja6p-69`, board inbound 2026-05-31). It is intended for two readers: (1) EstreUX SSoT review — confirming that the v1 four-directive signature (`@ports` / `@machine` / `@source` / `@deps`-absorbed) holds against real EG-side usage, and (2) EG drift-check `verify` — establishing the per-file baseline against which the contract gate will run. Scope: the 12 `constellation/*.eux` files surveyed via 3-lane parallel Workflow on 2026-05-31, focused on the 4 v1-candidate directives (`@ports`, `@machine`, `@source`, `@deps`). Findings from this catalog feed back into main upstream as ratification + open questions.

## Profile distribution

| File | Profile guess |
|------|---------------|
| gateway-client.eux | protocol |
| local-bridge.eux | protocol |
| self-wake-watcher.eux | backend |
| server.eux | backend |
| watchdog.eux | backend |
| ws-channel-input.eux | ui |
| ws-collab-invite.eux | ui |
| ws-conn-bar.eux | ui |
| ws-core.eux | protocol |
| ws-fab-badge.eux | ui |
| ws-tabs.eux | ui |
| ws-tool-card.eux | ui |

**Count summary**: ui = 6 · backend = 3 · protocol = 3 · machine = 0 · mixed = 0 (n=12).

## Per-file directive matrix

### gateway-client.eux

- **Profile**: protocol
- **@ports**: present. in=2 · cmd=2 · out=3 · deps=3.
  - Sample (in): `in   wsUrl    : string              # gateway endpoint ws://host:7878/ws`
  - Sample (cmd): `cmd  connect() : trigger physical connect — axis A connect dispatch (DISCONNECTED→CONNECTING)`
- **@machine**: present. name = `dual-axis (axis A connection lifecycle + axis B turn-held drain)`. states=2 enums (connState 4 + turnState 4) · dispatch=11 · guard=1 · derive=3.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps ws_send  : function            # physical WS frame send (1 frame = 1 JSON UTF-8)`
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - No `@source` directives present (v1 P1 expects source lineage for detail-tier components).
  - `@state` used but no `@ports.deps` placement validation — deps are correctly under `@ports`, not separate `@deps`.

### local-bridge.eux

- **Profile**: protocol
- **@ports**: present. in=6 · cmd=0 · out=1 · deps=3.
  - Sample (in): `in   wsUrl     : string          # ws://host:7878/ws (+ ?token= if set)`
  - Sample (out): `out  inboxAppend(rec) : append routed inbound {at,name,value,source} to inbox file for the agent`
- **@machine**: present. name = `connection lifecycle`. states=1 enum (connState 3) · dispatch=3 · guard=0 · derive=2.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps ws        : websocket       # injected WS client (the bridge owns the socket the agent can't hold)`
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - No `@source` directives present (v1 P1 expects source lineage for detail-tier components).
  - `@behavior` contains logic for AgentHello shape-mismatch detection with `console.warn` emission — this is application-level error handling, not a derive clause (should be clarified in `@machine` or separate `@diagnostics` if v1 formalism applies).
  - No `@cmd` in `@ports` despite AgentHello auto-reply logic — this reply behavior is described in `@behavior` but has no command interface declared.

### self-wake-watcher.eux

- **Profile**: backend
- **@ports**: present. in=4 · cmd=1 · out=1 · deps=3.
  - Sample (in): `in   inbox        : string         # inbox path to watch (WS_INBOX; worker uses its own queue, not main's)`
  - Sample (cmd): `cmd  arm()        : (re)start the poll loop from current cursors — called on launch and after each wake-process cycle`
- **@machine**: present. name = `watch cycle`. states=1 enum (watchState 3) · dispatch=4 · guard=3 · derive=4.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps clock        : sleep/timer    # injected poll timer (interval seconds)`
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - No `@source` directives present (v1 P1 expects source lineage for detail-tier components).
  - Optional input `feedback` parameter with null-disables-feature semantics — correctly documented in `@behavior arm()` with WARN emission (matches silent-disable principle).
  - Derive clause `cursor_unit` is extremely detailed and incident-driven; appropriate for a component with real operational history but may exceed the typical v1 derive scope (context-heavy rather than pattern-light).

### server.eux

- **Profile**: backend
- **@ports**: present. in=3 · cmd=0 · out=7 · deps=4.
  - Sample (in): `in   PORT              : number = 7878   # env.PORT`
  - Sample (out): `out  GET  /api/state        : current state.json (no-store)`
- **@machine**: present. name = `two-axis (connection role classification + main handoff)`. states=2 enums (connRole 4 + mainState 2) · dispatch=8 · guard=0 · derive=5.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps http             : node http server`
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - No `@source` directives present (v1 P1 expects source lineage for detail-tier components).
  - Large `@behavior` section (≈65 lines) with substantial business logic; v1 P1 signature does not define an explicit `@behavior` clause in the schema — this is v0 idiom. v1 may expect this detail to be split into `@machine` guards/derives or separate `@handlers` directives if formalizing beyond the 4-clause minimum.
  - Derive clauses are extensive and incident-driven (`source_stamp_truth` includes a real downstream issue); appropriate for a critical orchestration component but may exceed v1 derive scope (should consider `@incident` or `@rationale` sub-clauses if v1 formalism expands).

### watchdog.eux

- **Profile**: backend
- **@ports**: present. in=5 · cmd=0 · out=2 · deps=4.
  - Sample (in): `in   host       : string            # 127.0.0.1`
  - Sample (out): `out  restartServer() : detached-spawn server.cjs when server is down (cooldown-gated)`
- **@machine**: present. name = `watchdog state machine`. states=1 enum (2 states: WATCHING, RECONNECTING) · dispatch=5 · guard=0 · derive=2.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps ws         : websocket         # board-role connection used as a liveness probe`
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - `cmd` lines are empty in `@ports` but behavior describes multiple command handlers (`connectWs`, `onAgentList`, `checkServerAlive`, `restartServer`, `restartBridge`, `scheduleReconnect`, `backupTimer`, `gracefulExit`) — should be declared as `cmd` in `@ports`.
  - `@targets vanilla` is inappropriate for a backend/runtime component — should be `@targets runtime` or omitted.
  - `@expansion` template references v0.0.1 (outdated) but file uses v1-style `@machine` and `@ports`.

### ws-channel-input.eux

- **Profile**: ui
- **@ports**: present. in=2 (mislabeled — see drift) · cmd=2 · out=1 · deps=1.
  - Sample (cmd): `cmd setActive(key)        : host switches active channel — show its cached input`
  - Sample (out): `out onSend(targetAgentId, text, atts) : Ctrl+Enter / send — host issues UserPrompt`
- **@machine**: absent.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps storage : localStorage-like  # persist text + unified height (injected, mockable)`
- **v0 legacy directives**: @render / @persist used? **false** (but missing — see drift).
- **v1 drift findings**:
  - `cmd` lines are listed under the `in` header but the schema expects them under a separate sub-clause — format is ambiguous (lines 10-11 show `in` label but contents are `cmd` entries).
  - Missing explicit `@render` or `@targets` declaration for a UI component.
  - `@expansion` template references v0.0.5 but `@targets vanilla` is used inconsistently.

### ws-collab-invite.eux

- **Profile**: ui
- **@ports**: present. in=1 (mislabeled) · cmd=1 · out=1 · deps=1.
  - Sample (cmd): `cmd setIssued(payload)   : host injects {key, joinUrl, label} → status=issued`
  - Sample (out): `out onRegister(label)    : "issue key" click — host sends RegisterCollabKey`
- **@machine**: present. name = `status`. states=3 (idle initial, issuing, issued) · dispatch=2 · guard=0 · derive=0.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps clipboard : { writeText(s):Promise }  # injected, async, mockable`
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - `cmd` declaration format inconsistent — listed under the `in` label on line 8 but should be under an explicit `cmd` sub-clause.
  - Missing explicit `@render` or `@targets` declaration for a UI component.
  - `@machine` lacks initial-state marker in the dispatch table (should show which state is initial or use `(initial)` annotation on the state name).
  - `@expansion` template references v0.0.5.

### ws-conn-bar.eux

- **Profile**: ui
- **@ports**: present. in=1 (mislabeled) · cmd=1 · out=0 · deps=0.
  - Sample (cmd): `cmd setStatus(status, meta) : host injects connection state → re-render dot + meta`
- **@machine**: absent.
- **@source**: 0 entries.
- **deps format**: none.
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - `cmd` declaration format inconsistent — listed under a bare `cmd` label on line 9 mixing input signals with the `@ports` section.
  - Missing explicit `@render` or `@targets` declaration for a UI component.
  - Comment on line 10 `# no events-out · no deps` suggests empty out/deps — should be explicit empty sub-clauses or omitted entirely (current form is ambiguous).
  - `@expansion` template references v0.0.5 but file uses `@targets vanilla`.

### ws-core.eux

- **Profile**: protocol
- **@ports**: present. in=5 · cmd=6 · out=6 · deps=2.
  - Sample (cmd): `cmd  handleUpgrade(req, socket) → WSConn|null   : validate upgrade headers + sec-websocket-key + token → write \`HTTP/1.1 101 Switching Protocols\` + \`Sec-WebSocket-Accept\` → new WSConn; null on auth fail (401 written before destroy) or missing upgrade/key (socket.destroy without 4xx)`
  - Sample (out): `out  conn.send(objOrString) → boolean           : JSON.stringify if object → text frame 0x1; false if !alive or socket write throws`
- **@machine**: present. name = `WSConn`. states=2 (ALIVE initial, DEAD) · dispatch=4 · guard=0 · derive=4.
- **@source**: 0 entries.
- **deps format**: `@ports.deps` subclause. Sample: `deps crypto                                     : node:crypto (sha1 hash + randomBytes); non-Node targets (Bun / Deno / Workerd) substitute equivalents`
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - Missing `@render` or `@targets.ui` declaration — `@targets` is `vanilla` but no UI-layer directive is present (note: protocol profile, so this is the correct shape for v1 — `@targets vanilla` on a protocol component is a violation per v1 ratification below).
  - `@machine` directive lacks explicit name binding (should be `@machine <name>` per P1 signature, though `WSConn` is inferred from context).
  - Guard clauses in `@machine` should be explicit (e.g., `evt.display.status` check pattern) — currently no guards formalized in dispatch.
  - No `@source` directives referencing where code is actually implemented (protocol depends on `node:crypto` and `node:http` but no implementation file links).

### ws-fab-badge.eux

- **Profile**: ui
- **@ports**: present. in=0 · cmd=2 · out=1 · deps=0.
  - Sample (cmd): `cmd setUnseen(n) : host injects total unseen → refresh badge (clamp "99+", hide if 0 or open)`
  - Sample (out): `out onToggle()   : FAB click — host toggles the popup`
- **@machine**: absent.
- **@source**: 0 entries.
- **deps format**: none.
- **v0 legacy directives**: @render / @persist used? **false** (but missing on a UI component — see drift).
- **v1 drift findings**:
  - Missing `@render` or `@persist` directive — this is a UI component (`@targets vanilla`) but has no render specification per P1 v1.
  - No `@machine` for state transitions (open/unseen state changes are implicit in `@state` but un-machine'd).
  - No `@source` references to implementation file.
  - Missing `@deps` — no explicit dependency declarations (likely needs DOM/event handling but not formalized).

### ws-tabs.eux

- **Profile**: ui
- **@ports**: present. in=0 · cmd=1 · out=2 · deps=0.
  - Sample (cmd): `cmd setData(snap)  : host injects {channels, active} snapshot (partial merge → re-render)`
  - Sample (out): `out onSelect(key)  : tab id, or "group:<key>" on group-header click`
- **@machine**: absent.
- **@source**: 0 entries.
- **deps format**: none.
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - Missing `@render` or `@persist` directive — UI component but no P1 v1 render specification.
  - No `@machine` for tab/group state (active selection, group visibility states are implicit only).
  - No `@source` references to implementation.
  - Missing `@deps` — no explicit dependency declarations.

### ws-tool-card.eux

- **Profile**: ui
- **@ports**: present. in=0 · cmd=1 · out=0 · deps=0.
  - Sample (cmd): `cmd feed(evt) : inject START/ARGS/END/RESULT — aggregate by toolCallId. evt={phase, toolCallName, argsPreview, args, delta, resultPreview, content, display}`
- **@machine**: present. name = `tool`. states=3 (running initial, done, error) · dispatch=1 (ad-hoc) · guard=1 · derive=0.
- **@source**: 0 entries.
- **deps format**: none.
- **v0 legacy directives**: @render / @persist used? **false**.
- **v1 drift findings**:
  - Missing `@render` or `@persist` directive — UI component but no P1 v1 render specification.
  - `@machine` directive present but dispatch format is non-standard — uses ad-hoc `start→init(status=running)` notation rather than a formal `event → state` signature.
  - Guard is mixed with dispatch logic rather than separated (comment mentions guard but no formal `@guard` section).
  - No `@source` references to implementation.
  - Missing `@deps` — no explicit dependency declarations.

## Drift summary across all 12

- **Files with `@ports`**: 12/12.
- **Files with `@machine`**: 8/12 (gateway-client, local-bridge, self-wake-watcher, server, watchdog, ws-collab-invite, ws-core, ws-tool-card).
- **Files with `@source`**: 0/12.
- **Files with v0 `@render` / `@persist` still in use**: 0/12 (none surveyed retain these — but 5 UI files are *missing* `@render` where v1 expects it; see below).
- **Files with separate `@deps` (need to migrate to `@ports.deps`)**: 0/12. All deps-bearing files (gateway-client, local-bridge, self-wake-watcher, server, watchdog, ws-channel-input, ws-collab-invite, ws-core) already use the `@ports.deps` sub-clause form. This is strong EG-side evidence supporting the RRP Report A4 amendment (absorb `@deps` under `@ports.deps`, drop the standalone directive).
- **Files missing required v1 validation**:
  - Backend/protocol with no `@ports` sub-clause: none (all 6 backend/protocol files have at least one of in/cmd/out/deps).
  - `@machine` without `states`: none (all 8 machine-bearing files declare at least one states enum).
  - UI files with no machine where state transitions are implicit: 3 (ws-channel-input, ws-conn-bar, ws-fab-badge, ws-tabs) — non-blocking per v1 (machine optional for ui).
- **`@render` N/A or `@targets vanilla` misuse instances**:
  - `@targets vanilla` on non-UI components: **watchdog.eux** (backend), **ws-core.eux** (protocol). Both should switch to `@targets runtime` or omit.
  - UI files missing `@render` where v1 expects one for ui-profile: **ws-channel-input.eux**, **ws-conn-bar.eux**, **ws-fab-badge.eux**, **ws-tabs.eux**, **ws-tool-card.eux** (5/6 UI files). `ws-collab-invite.eux` is the only UI file with sufficient render-equivalent context via its `@machine status`.

## v1 Signature proposal (EG ratification of main P1 draft)

### @ports

- **Required**: at least one of `in` / `cmd` / `out` for **ui** or **mixed** profiles; at least one of `in` / `cmd` / `out` / `deps` for **backend** / **protocol** profiles.
- **Sub-clause syntax** (verbatim from main P1 + EG ratification):
  - `in:   <name>[: type]            #주석`
  - `cmd:  <sig> : <return>          #주석`
  - `out:  <name>[: type]            #주석`
  - `deps: <name>[→ <other>.eux]     #주석`
- **@ports.deps absorbs the standalone @deps** from RRP Report A4. **Rationale**: EG 12-file evidence — **8/12 files already use `@ports.deps`** and **0/12 use a standalone `@deps` directive**. The migration is already complete on the EG side; ratification is codification, not change.

### @machine

- **Required**: `states` enum.
- **Recommended**: `dispatch` list.
- **Optional**: `guard`, `derive`.
- **Profile-conditional**: required for **machine** and **protocol** profiles; optional elsewhere. EG ratification note: 3/3 protocol files (gateway-client, local-bridge, ws-core) already declare `@machine` — required-for-protocol holds against real usage. For **backend** profile we recommend "strongly recommended" rather than required (3/3 EG backend files happen to declare it, but the watchdog dispatch table has zero guards, suggesting backend machines are sometimes more about lifecycle observability than full guard formalism).

### @source

- **Optional but recommended** (provenance for drift-check). **Syntax**: `<file>(<Lstart-Lend>)[· ...]`.
- EG ratification gap: **0/12 files have `@source` today**. v1 should ship `@source` as recommended (not required) and let drift-check `verify` emit a WARN-tier nudge on missing provenance rather than a contract-gate FAIL. This preserves migration room while encoding the long-term direction.

### Deprecated v0 directives

- `@render` and `@persist`: **scope-limited to ui profile only**. Backend / protocol / machine profiles MUST NOT use them.
- `@render N/A` as a value is **forbidden** — omit the directive entirely.
- `@targets` must point to a real expansion target (e.g., a stack name registered in the EstreUX targets registry). A placeholder like `@targets vanilla` (or `estreuv`) on a non-UI component is a **v1 violation**. EG drift instances: `watchdog.eux` and `ws-core.eux` both ship `@targets vanilla` on non-UI profiles.

### Validation rules (drift-check --contract gate)

The `drift-check --contract` gate SHOULD enforce:

1. **Per-profile required fields**:
   - ui / mixed: `@ports` with at least one of in / cmd / out present.
   - backend / protocol: `@ports` with at least one of in / cmd / out / deps present.
   - machine / protocol: `@machine` with `states` enum present.
2. **Deprecated-directive forbidden list**:
   - `@render` and `@persist` outside ui profile → FAIL.
   - `@render N/A` (or any literal "N/A" / "none" placeholder) → FAIL.
   - `@targets <placeholder>` (vanilla / estreuv / TBD) on non-ui profile → FAIL.
3. **Deps-location uniformity**:
   - Standalone `@deps` directive → FAIL (must be `@ports.deps` sub-clause).
4. **Provenance recommendation**:
   - Missing `@source` on backend / protocol / machine profiles → WARN (not FAIL — recommended, not required, in v1).
5. **Sub-clause syntax**:
   - `cmd` entries listed under `in` label (the ws-channel-input / ws-collab-invite / ws-conn-bar pattern) → WARN with auto-fix suggestion.
6. **Machine integrity**:
   - `@machine` declared without any state in the states enum → FAIL.
   - `@machine` declared without an initial-state marker (`(initial)` annotation or first-state-implicit rule) → WARN.

## Open questions for main upstream

1. **Backend `@machine` requirement**: Should `@machine` on the **backend** profile be **required** or **strongly recommended**? EG data shows 3/3 backend files declare it, but watchdog has zero guards and the machine is mostly lifecycle observability. If `@machine` is required-with-guards-recommended, the contract gate needs a soft tier; if required-with-states-only, watchdog passes as-is.
2. **`@source` line-range precision**: Should `@source` line ranges be **byte-precise** (offset-based, survives content but not editor reformatting), **line-precise** (current 1-indexed line numbers, brittle to insertion), or **anchor-precise** (refers to a stable named marker, requires anchor convention in implementation files)? EG drift-check currently has no `@source` evidence to extrapolate from.
3. **`@behavior` clause status**: server.eux ships a ~65-line `@behavior` block that is neither `@machine` (it's prose-with-bullets) nor any of the v1 four-directive set. Does v1 (a) formalize `@behavior` as a fifth directive, (b) require migration into `@machine.derive` / `@machine.guard`, or (c) tolerate it as out-of-band documentation that drift-check ignores? Real risk: server.eux is the most critical orchestration file in the repo and a forced migration could lose incident context.
4. **`@derive` size budget**: self-wake-watcher's `cursor_unit` derive and server's `source_stamp_truth` derive both embed real incident history (4h outage, Report 2 Finding 1) in the derive clause. Does v1 want a budget (e.g., derive ≤ N lines) with overflow going to `@incident` / `@rationale` sub-clauses, or is incident-driven derive a deliberate part of the format?
5. **UI `@machine` recommendation tier**: 3/6 EG UI files (ws-channel-input, ws-conn-bar, ws-fab-badge, ws-tabs) have implicit state but no `@machine`. Should v1 (a) recommend `@machine` for any UI component with more than one observable state, (b) leave it fully optional for ui, or (c) introduce a lighter-weight `@state` directive for UI components that don't need full dispatch tables?

## Verify (drift-check 6-gate matrix — 2026-05-31)

**Summary**: 12 files surveyed against v1 spec — **5 PASS · 7 WARN · 0 FAIL** (no CI blockers). All FAIL-tier gates (G1 ports presence, G2 machine STRICT for protocol) pass for the entire constellation. WARN-tier issues cluster around (a) `@source` adoption gap (0/12, expected — WARN-tier in v1), (b) `cmd`-under-`in` label mislabeling on three UI files (auto-fixable per §3.6 rule 1), (c) ambiguous empty `out`/`deps` without explicit `# none` comment on `ws-conn-bar`, (d) non-standard `@machine` dispatch format on `ws-tool-card`. The 6 gates as evaluated: (1) per-profile required `@ports` sub-clauses; (2) `@machine` states+initial-marker (STRICT for protocol, soft-WARN for backend, OPTIONAL for ui); (3) every `states` enum value reachable via `dispatch` + entry-actions traceable; (4) `@derive` clauses cite a code anchor or named incident (WARN tier); (5) `@envelope` raw literal scan vs matching `.cjs` (server.cjs · ws-core.cjs · watchdog.cjs · local-bridge.cjs); (6) `@ports` `cmd` return-shape parity vs implementation (verified for ws-core `decodeFrame`/`handleUpgrade` against `ws-core.cjs` lines 34/51/117-122).

| File | Profile | G1 ports | G2 machine | G3 coverage | G4 derive | G5 envelope | G6 return | Overall |
|------|---------|----------|------------|-------------|-----------|-------------|-----------|---------|
| gateway-client.eux | protocol | PASS | PASS | PASS | WARN | N/A | PASS | **WARN** |
| local-bridge.eux | protocol | PASS | PASS | PASS | WARN | PASS | PASS | **WARN** |
| self-wake-watcher.eux | backend | PASS | PASS | PASS | PASS | N/A | PASS | **PASS** |
| server.eux | backend | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| watchdog.eux | backend | PASS | PASS | PASS | WARN | PASS | WARN | **WARN** |
| ws-channel-input.eux | ui | PASS | N/A | N/A | N/A | N/A | WARN | **WARN** |
| ws-collab-invite.eux | ui | PASS | PASS | PASS | N/A | N/A | WARN | **WARN** |
| ws-conn-bar.eux | ui | PASS | N/A | N/A | N/A | N/A | WARN | **WARN** |
| ws-core.eux | protocol | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| ws-fab-badge.eux | ui | PASS | N/A | N/A | N/A | N/A | PASS | **PASS** |
| ws-tabs.eux | ui | PASS | N/A | N/A | N/A | N/A | PASS | **PASS** |
| ws-tool-card.eux | ui | PASS | PASS | WARN | N/A | N/A | PASS | **WARN** |

**Counts**: PASS=5 · WARN=7 · FAIL=0 · TOTAL=12.

**Blockers** (FAIL-tier — would block CI): **none**. The constellation is v1-clean against all STRICT gates (G1 universally satisfied; G2 STRICT satisfied for all 3 protocol files; no `@deps` standalone; no forbidden `@render`/`@persist`; placeholder `@targets vanilla` on `watchdog.eux` + `ws-core.eux` is already noted as migration debt in §6.2 and is not gated by these 6 gates — that gate lives in the §4 G5 matrix-table of the spec, separately from this verify run).

**WARN summary** (recommended fixes, ordered by impact):
- **G4 derive anchors** (3 files: gateway-client, local-bridge, watchdog) — promote inline `@intent` provenance notes to explicit `@source` or anchor refs; not blocking but improves drift-check fidelity.
- **G6 cmd-label drift** (3 UI files: ws-channel-input, ws-collab-invite, ws-conn-bar) — `cmd` lines listed under `in:` label; auto-fix per §3.6 rule 1 (move to dedicated `cmd:` sub-clause).
- **G6 watchdog cmd/out mixing** — `restartServer`/`restartBridge` declared as `out:` but are internal-spawned commands; clarify per v1 sub-clause semantics in §3.6.
- **G3 ws-tool-card dispatch format** — non-standard `phase→action` notation rather than formal `state + event → state'`; reformulate per §3.7.
- **G4/G5 N/A rows** — runtime adapters (gateway-client agent-side, UI components) have no matching `.cjs` envelope to scan; these are vacuous-PASS but recorded as N/A to keep the matrix honest.

**Spec cross-reference**: gate definitions per `constellation/reference/docs/eux-format-v1.md` §4 (6-gate matrix) + §3.6 (`@ports` validation rules) + §3.7 (`@machine` STRICT tier dispatch).

## Provenance

- **Main P1 draft**: Delegate seq 70 (`l-mpt1ja6p-70`, msgId `m-mpt1ja6p-69`, board inbound 2026-05-31).
- **EG analysis**: 12 `constellation/*.eux` files, 3-lane parallel Workflow on 2026-05-31.
- **Drift-check verification**: 6-gate Verify matrix run 2026-05-31 (see §Verify above) — 5 PASS · 7 WARN · 0 FAIL.
