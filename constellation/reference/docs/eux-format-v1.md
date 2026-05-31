# EstreUX `.eux` Format v1 — Formal Specification

## Status

- **Version**: v1 (formalization of P1 directive signature).
- **Status**: DRAFT — pending main hub final review. EG-side ratification complete (12-file empirical catalog + 5 open-question resolutions).
- **Date**: 2026-05-31.
- **SSoT**: This document. The EG empirical catalog (`constellation/reference/EUX-V1-CATALOG.md`) is the ratification companion and supplies the per-file evidence.
- **Provenance**:
  - Main upstream **Delegate seq 70** — `m-mpt1ja6p-69` (P1 4-directive signature: `@ports` / `@machine` / `@source` / `@deps`-absorbed-into-`@ports.deps`; this "4-directive" count is the **P1 sub-slice**, not the full v1 set — see §2 canonical phrasing: v1 has 9 directives total).
  - Main upstream **Delegate seq 73** — `m-mpt2zmss-72` (5 open-question answers: backend `@machine` soft-WARN, `@source` line-precise, `@behavior` 5th directive doc-tier, `@derive` no budget with optional `@rationale`/`@incident` split, UI `@state` light vs `@machine` dispatch).
  - EG-side catalog publish — `e57af29` (`constellation/reference/EUX-V1-CATALOG.md`, 12-file analysis).
- **Owners**: EstreUX SSoT (specification) + EstreGenesis reference (empirical evidence + drift-check `verify` contract gate).
- **Open work** (see §Open Work for P2/P3): anchor-precise `@source` convention, full drift-check `--contract` implementation, profile↔Superscalar `issue_width` lane mapping, render/persist UI sub-spec.

## 1. Profiles

Every `.eux` file declares (explicitly via `@targets` or implicitly via directive composition) one of five **profiles**. The profile decides which directives are required, which are forbidden, and which validation tier applies.

| Profile | One-line | Typical example |
|---------|---------|-----------------|
| **ui** | A DOM/widget component intended for a browser-side stack target. | `ws-tabs.eux`, `ws-fab-badge.eux` |
| **backend** | A long-running runtime/server-side component. | `server.eux`, `watchdog.eux` |
| **protocol** | A wire-format / transport-layer specification, runtime-agnostic. | `ws-core.eux`, `gateway-client.eux` |
| **machine** | A pure state-machine / formal-model component with no I/O surface. | (reserved; no EG instances yet) |
| **mixed** | A component that spans two profiles (e.g., UI + protocol bridge). Must justify in `@rationale`. | (reserved; no EG instances yet) |

Profile is not a free-form tag. The drift-check `--contract` gate uses the profile to choose the per-directive tier (STRICT / soft-WARN / WARN / doc-tier) — see §4 Drift-Check Matrix.

## 2. Directive Set (overview)

**Canonical directive-count phrasing (v1 SSoT)**: v1 has **9 directives total: 5 formal/tier-gated (`@ports`, `@machine`, `@source`, `@behavior`, `@render`/`@persist`) + 4 structural (`@component`, `@intent`, `@expansion`, `@targets`, `@state`) — note that v0 had 8 with `@behavior` added in v1**. The structural cluster lists 5 directive names because `@state` is grouped under "structural (ui-light)" — it counts toward the structural set conceptually even though it is documented as ui-light. When a passage in this spec, the catalog, or any companion doc cites a different count (e.g., "5 formal" alone, "8 v0 directives", "4-directive P1 signature", "4 structural"), it is referring to a sub-slice (P1 core, v0 baseline, structural-minus-state, etc.) and should be read against this canonical phrasing as the SSoT.

v1 defines **9 directives** total. Five are **formal** (subject to drift-check at some tier); four are **structural / documentary**.

| # | Directive | Tier (default) | Required for |
|---|-----------|---------------|--------------|
| 1 | `@component` | structural | all profiles |
| 2 | `@intent` | structural | all profiles |
| 3 | `@expansion` | structural | all profiles |
| 4 | `@targets` | structural | all profiles |
| 5 | `@state` | structural (ui-light) | ui (light reactive state); optional elsewhere |
| 6 | `@ports` | **STRICT** | backend, protocol (≥1 sub-clause); ui (≥1 of in/cmd/out) |
| 7 | `@machine` | **STRICT** for protocol/machine; **soft-WARN** for backend; optional for ui | protocol, machine |
| 8 | `@source` | **WARN** | recommended for backend, protocol, machine |
| 9 | `@behavior` | **doc-tier** (no gate) | optional, all profiles |

Two **optional sub-clauses** (introduced under `@behavior` or `@machine`):

- `@rationale` — design-decision context, intent-vs-mechanism narrative. Doc-tier.
- `@incident` — operational-history breadcrumbs (outage causes, regression triggers, downstream-adoption pitfalls). Doc-tier.

Both are **soft-recommended overflow** for over-long `@derive` clauses or critical-component context that does not fit in `@machine`. They are never required and never gate.

The two v0 UI-only directives `@render` and `@persist` remain valid **only for the ui profile** (see §3.10). They are out of scope of this v1 P1 formalization and will be addressed in P2 (render/persist UI sub-spec).

## 3. Directive Specifications

### 3.1 `@component`

- **Syntax**: `@component <kebab-name>`
- **Required**: all profiles.
- **Tier**: structural (drift-check checks presence + name uniqueness across the constellation; not a content gate).
- **Constraints**:
  - Name must be `kebab-case` and match the filename stem (e.g., `server.eux` → `@component live-board-server` is fine; the constraint is uniqueness, not exact-match — but if the stem and component diverge, `@rationale` should note why).
  - One `@component` per file.

### 3.2 `@intent`

- **Syntax**: `@intent <free-form prose>` (one block, multi-paragraph allowed).
- **Required**: all profiles.
- **Tier**: structural.
- **Constraints**:
  - Must state *what* the component is and *why* it exists in one paragraph minimum.
  - May contain envelope/wire-protocol notes for protocol-profile components.
  - May embed `@source` inline as `(Distilled from <file>(<Lstart-Lend>))` — this is the v0 idiom and remains valid; the explicit `@source` directive is the v1-preferred form (§3.8).

### 3.3 `@expansion`

- **Syntax**: `@expansion temperature=<float> model=<id> template=estreux/v<major>.<minor>.<patch>`
- **Required**: all profiles.
- **Tier**: structural.
- **Constraints**:
  - `template` must reference a registered EstreUX template version. v1 introduces `estreux/v1.0.0`. Files using `estreux/v0.x.x` are valid in v1 but emit a WARN nudge under drift-check (migration hint).
  - `temperature` and `model` are advisory; they document the expansion regime that produced or should reproduce this distillation.

### 3.4 `@targets`

- **Syntax**: `@targets <target-name>[, <target-name>...]`
- **Required**: all profiles.
- **Tier**: structural with **STRICT** validation on placeholder values.
- **Constraints**:
  - Must point to a real expansion target registered in the EstreUX targets registry.
  - **Forbidden placeholders** (drift-check FAIL on non-ui profile): `vanilla`, `estreuv`, `TBD`, `none`, `N/A`.
  - For UI profile, `vanilla` is permitted as the canonical "no-framework browser stack" target.
  - For backend / protocol profile, use `runtime` (Node/Bun/Deno generic) or a specific stack name.

### 3.5 `@state`

- **Syntax**:
  ```
  @state
  <name> : <type>[= <default>]     # comment
  <name> : <type>[= <default>]     # comment
  ```
- **Required**: optional everywhere; **light-required** for ui profile components that have observable reactive state but no `@machine` dispatch table (see §3.7).
- **Tier**: structural.
- **Constraints**:
  - Each line declares one state field with a type and optional default literal.
  - Comments use `#`.
  - For ui profile: `@state` is the v0 idiom for declaring reactive state without a full state-machine dispatch table. v1 ratifies this as the **light** end of the spectrum (`@state` light ↔ `@machine` heavy).
  - For backend / protocol profile: `@state` declares process-resident registries, caps, and configuration constants. Drift-check verifies default-literal parity against `@source` (e.g., `WS_PRIMARY_ID` default must match the implementation's literal).

### 3.6 `@ports` (STRICT, v1 P1 core)

- **Syntax**:
  ```
  @ports
    in:   <name>[: <type>][= <default>]     # comment
    cmd:  <signature> : <return>            # comment
    out:  <name>[: <type>]                  # comment
    deps: <name>[→ <other>.eux]             # comment
  ```
- **Required**:
  - **ui / mixed**: at least one of `in` / `cmd` / `out`.
  - **backend / protocol**: at least one of `in` / `cmd` / `out` / `deps`.
- **Tier**: **STRICT** (drift-check FAIL on missing required sub-clause; FAIL on standalone `@deps` directive).
- **Sub-clause semantics**:
  - `in` — inbound configuration, environment, or signal inputs. Pure data flowing **into** the component at boot or per-event.
  - `cmd` — callable commands the host can invoke on the component. Has a signature `name(args) : return-type` and may have a `→ <state-transition>` suffix in the comment.
  - `out` — outbound signals, side effects, callbacks, or events the component raises. Pure data flowing **out**.
  - `deps` — injected dependencies (sockets, clocks, storage, other components). The optional `→ <other>.eux` suffix marks a cross-`.eux` link.
- **`@deps` absorption** (v1 ratification of RRP Report A4):
  - The v0 standalone `@deps` directive is **deprecated**. Dependencies MUST be declared under `@ports.deps`.
  - Empirical evidence: 8/8 EG deps-bearing files already use `@ports.deps`; 0/12 use a standalone `@deps`. v1 codifies the reality.
  - Drift-check: standalone `@deps` → **FAIL** (auto-fix suggestion: move under `@ports.deps`).
- **Drift-check validation rules**:
  1. `cmd` entries listed under an `in` label (the ws-channel-input / ws-collab-invite / ws-conn-bar pattern) → **WARN** with auto-fix suggestion.
  2. Bare `cmd` label without parent `@ports` → **WARN** with auto-fix suggestion.
  3. `cmd` return shape must match the implementation's return destructure if `@source` is present → **WARN** (e.g., `ws-core.decodeFrame` returning `{fin, opcode, payload, totalLen} | null`).
  4. Empty `out` or `deps` sub-clause without explicit `# none` comment → **WARN** (ambiguous).
  5. `deps` cross-link target (`→ <other>.eux`) must resolve to an existing `.eux` file → **WARN**.

- **Cmd-clause tier vs G6 return-shape parity (clarification)**: The §3.6 `cmd` sub-clause and the catalog's runtime check G6 (return-shape parity) operate at two **complementary levels**, not contradictory ones. The §3.6 `cmd` sub-clause is the **structural gate**: drift-check emits **WARN** on a missing/misplaced `cmd` label (rules 1–2 above) because the absence is a documentation/syntactic gap, not necessarily a runtime defect. The catalog's G6 runtime check is the **runtime parity gate**: when an implementation `.cjs` exists and the `.eux` `cmd` signature's declared return shape disagrees with the implementation's actual destructure, that is a hard contract mismatch and is treated as **STRICT** at the runtime-observation level (catalog C6 / G6). In short: structural WARN on missing-or-mislabeled `cmd`; runtime STRICT on shape-mismatched `cmd`. A file can pass §3.6 structurally (cmd present, well-placed) and still fail G6 at runtime (cmd shape diverged from `.cjs`), or vice-versa. They are intentionally separate concerns and should be read together, not collapsed.

### 3.7 `@machine` (STRICT for protocol/machine; soft-WARN for backend)

- **Syntax**:
  ```
  @machine <name>
    states:
      <enum-name>: <s1>(initial) | <s2> | <s3> | ...
      [<enum-name-2>: ...]
    dispatch:
      <state> + <event> → <state'>     # optional inline comment
      ...
    guard:
      <guard-name>: <condition>         # optional, may be empty
      ...
    derive:
      <derived-name>: <derivation>      # optional; may be paragraph-form
      ...
  ```
- **Required**:
  - **protocol**: required (STRICT — FAIL on absence). Empirical: 3/3 EG protocol files declare it.
  - **machine**: required (STRICT — FAIL on absence). This is definitional.
  - **backend**: **strongly recommended** (drift-check tier: **soft-WARN** — emit WARN on absence, never FAIL). Empirical: 3/3 EG backend files have it, but `watchdog.eux` has zero guards (lifecycle-observability machine, not full-guard machine). v1 explicitly permits this shape.
  - **ui**: optional. Use `@state` (§3.5) for light reactive state; introduce `@machine` only when dispatch / transitions are needed.
- **Tier**:
  - **STRICT** on `states` enum presence (any profile that has `@machine` must declare at least one states enum — FAIL otherwise).
  - **STRICT** on initial-state marker (`(initial)` annotation OR first-state-implicit convention — FAIL on ambiguity for protocol/machine profile; WARN for backend).
  - **soft-WARN** on `dispatch` presence for backend (lifecycle-observability machine permitted with states-only).
  - Doc-tier on `guard` and `derive` (no gate; size-unbudgeted per Q4 answer).
- **Sub-clause semantics**:
  - `states` — finite enumeration of states, possibly across multiple state axes (e.g., `gateway-client` declares `connState 4 + turnState 4` for dual-axis). One state per axis must be marked `(initial)`.
    - **Initial-state convention (P3 resolution for G2 ambiguity)**: when a `states: A · B · C` enum list does not mark any state with `(initial)`, drift-check applies the convention **"the first state in the list is implicit-initial"**. To override the implicit-first convention, declare an explicit `initial: <state>` annotation on a separate line beneath the states list, OR mark the chosen state with the inline `(initial)` suffix. The two forms are equivalent and either is honored. Example:
      ```
      states:
        connState: DISCONNECTED · CONNECTING · CONNECTED · CLOSED
      initial: DISCONNECTED            # optional explicit override; equivalent to first-in-list
      ```
      Or inline:
      ```
      states:
        connState: DISCONNECTED(initial) · CONNECTING · CONNECTED · CLOSED
      ```
      For multi-axis machines, the `initial:` line may list one initial per axis (e.g., `initial: connState=DISCONNECTED, turnState=IDLE`). Drift-check WARN if both inline `(initial)` and explicit `initial:` are present and disagree.
  - `dispatch` — explicit `state + event → state'` transitions. Recommended for protocol; optional for backend.
  - `guard` — boolean conditions that gate transitions. Optional everywhere.
  - `derive` — derived/computed quantities or invariants (e.g., `cursor_unit` in self-wake-watcher). May embed incident history; no size budget (see Q4 answer). Use `@incident` / `@rationale` optional sub-clauses for very long derive blocks (soft).

### 3.8 `@source` (WARN-tier provenance)

- **Syntax**: `@source <file>(<Lstart-Lend>)[· <file>(<Lstart-Lend>)...]`
- **Required**: optional, **recommended** for backend / protocol / machine profiles.
- **Tier**: **WARN** (drift-check emits WARN on missing `@source` for backend/protocol/machine profiles; never FAIL in v1).
- **Constraints**:
  - **Line precision**: line-precise, 1-indexed (per Q2 answer). Byte-precision and anchor-precision are deferred to P3.
  - Brittle to line-number drift in the source file — but since the directive is WARN-tier, the brittleness is tolerable for v1.
  - Multiple source ranges separated by `·` for components distilled from several files (e.g., `server.cjs(165-204) · wscore.cjs(330-368)`).
  - Path is repo-relative. Drift-check may verify the path exists → WARN on missing file.
- **Migration**: 0/12 EG files currently have explicit `@source`. v1 ships the directive as WARN-tier to allow gradual adoption. Many files embed source provenance inside `@intent` (e.g., `(Distilled from constellation/reference/runtime/server.cjs)`); these remain valid but should be promoted to explicit `@source` over time.

### 3.9 `@behavior` (doc-tier, v1 P1 5th directive)

- **Syntax**: free-form prose. May use bullets, paragraphs, sub-headings. No structural schema.
- **Required**: optional, all profiles.
- **Tier**: **doc-tier** (no drift-check gate). Per Q3 answer.
- **Purpose**:
  - Capture application-level logic, error-handling discipline, edge-case behavior, and orchestration narrative that does not fit cleanly into `@machine` guards/derives.
  - Preserve operational context for critical components (e.g., `server.eux`'s ~65-line behavior block) without forcing migration that would lose incident history.
- **Soft recommendation**: critical logic *can* be migrated into `@machine.guard` / `@machine.derive` for stronger formalism, but this is never forced. The v0 idiom of `@behavior` prose is ratified in v1.
- **Optional sub-clauses** (introduced under `@behavior` or as siblings):
  - `@rationale` — the *why* behind a design decision (e.g., "we keep JSONL as SSoT despite SQLite primary because rollback must be free").
  - `@incident` — operational history breadcrumbs (e.g., "4h outage 2026-05-29: cursor_unit set to bytes instead of lines").
  - Both are doc-tier. Use them when `@behavior` or `@machine.derive` grow long enough to harm readability — they are an overflow valve, not a requirement.

### 3.10 v0 carryovers: `@render` and `@persist` (UI-only, P2 scope)

- **Scope**: **ui profile only**. Backend / protocol / machine profiles MUST NOT use these directives — drift-check FAIL.
- **`@render N/A`** (or any literal `N/A` / `none` placeholder) is **forbidden** in v1 — omit the directive entirely.
- **`@render` is optional on ui-profile components that are template-rendered upstream**: when the parent component owns the DOM template and the child component contributes only via `@ports.cmd`/`@state`, bare omission of `@render` is v1-conformant. The catalog notes 5/6 UI files (ws-channel-input, ws-conn-bar, ws-fab-badge, ws-tabs, ws-tool-card) currently omit `@render` for exactly this reason and are NOT in violation. Only `@render N/A` placeholder or `@render` on backend/protocol/machine profile is forbidden.
- Full v1 syntax + semantics for `@render` and `@persist` is **deferred to P2** (UI render/persist sub-spec). For v1 P1, the rules are negative-only: forbidden outside ui, no placeholder values, omit-don't-stub, and bare-omission permitted for upstream-template-rendered children.

## 4. Drift-Check 6-Gate Matrix

The `drift-check --contract` gate enforces v1 conformance at six points. Each gate has an explicit tier per profile.

| # | Gate | Description | ui | backend | protocol | machine | mixed |
|---|------|-------------|----|---------|----------|---------|-------|
| G1 | **Per-profile required `@ports`** | ≥1 of in/cmd/out (ui/mixed) or ≥1 of in/cmd/out/deps (backend/protocol) | **STRICT** | **STRICT** | **STRICT** | optional | **STRICT** |
| G2 | **`@machine` presence + states-enum** | `@machine` with at least one states enum and initial-state marker | optional | **soft-WARN** | **STRICT** | **STRICT** | per-half |
| G3 | **Deprecated `@render` / `@persist` outside ui** | These directives are ui-only | (allowed) | **STRICT FAIL** | **STRICT FAIL** | **STRICT FAIL** | per-half |
| G4 | **Standalone `@deps` directive** | `@deps` must live under `@ports.deps`, never standalone | **STRICT FAIL** | **STRICT FAIL** | **STRICT FAIL** | **STRICT FAIL** | **STRICT FAIL** |
| G5 | **`@targets` placeholder on non-ui** | `vanilla` / `estreuv` / `TBD` / `none` / `N/A` forbidden outside ui | (allowed for `vanilla`) | **STRICT FAIL** | **STRICT FAIL** | **STRICT FAIL** | **STRICT FAIL** |
| G6 | **`@source` provenance missing** | `@source` directive recommended for non-ui detail-tier components | (allowed missing) | **WARN** | **WARN** | **WARN** | **WARN** |

**Tier definitions**:

- **STRICT** — drift-check `--contract` exits non-zero (CI block).
- **STRICT FAIL** — drift-check `--contract` exits non-zero with a forbidden-construct error message (CI block, no auto-fix).
- **soft-WARN** — drift-check `--contract` emits a WARN line but exits zero. (Backend `@machine` per Q1 answer.)
- **WARN** — drift-check `--contract` emits a WARN line but exits zero. (Provenance recommendations per Q2 answer.)
- **doc-tier** — no gate. `@behavior` / `@rationale` / `@incident` are not checked at all.
- **optional** — no gate; presence is acceptable but not required.

**Additional ports-level validation** (all profiles, all tiers as listed in §3.6):
- `cmd` under `in` label → WARN with auto-fix.
- `cmd` return-shape parity vs `@source` destructure → WARN.
- Empty `out` / `deps` without `# none` → WARN.
- `deps` cross-link `→ <other>.eux` unresolvable → WARN.

## 5. Profile × Directive Matrix

Cross-reference of which directives apply at which tier for each profile.

| Directive | ui | backend | protocol | machine | mixed |
|-----------|----|---------|----------|---------|-------|
| `@component` | required | required | required | required | required |
| `@intent` | required | required | required | required | required |
| `@expansion` | required | required | required | required | required |
| `@targets` | required (`vanilla` ok) | required (no placeholder) | required (no placeholder) | required (no placeholder) | required (no placeholder) |
| `@state` | recommended (light) | optional | optional | optional | optional |
| `@ports` | **STRICT** (≥1 of in/cmd/out) | **STRICT** (≥1 of in/cmd/out/deps) | **STRICT** (≥1 of in/cmd/out/deps) | optional | **STRICT** |
| `@machine` | optional (use `@state` light) | **soft-WARN** (recommended; states-only OK) | **STRICT** (required) | **STRICT** (required) | per-half |
| `@source` | optional | **WARN** (recommended) | **WARN** (recommended) | **WARN** (recommended) | **WARN** (recommended) |
| `@behavior` | optional (doc) | optional (doc) | optional (doc) | optional (doc) | optional (doc) |
| `@rationale` (sub) | optional (doc) | optional (doc) | optional (doc) | optional (doc) | optional (doc) |
| `@incident` (sub) | optional (doc) | optional (doc) | optional (doc) | optional (doc) | optional (doc) |
| `@render` (v0) | optional (P2 sub-spec) | **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN** | per-half |
| `@persist` (v0) | optional (P2 sub-spec) | **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN** | per-half |

**Reading the table**:
- A `STRICT` cell means drift-check `--contract` fails on absence or violation.
- A `WARN` / `soft-WARN` cell means drift-check emits a WARN line but does not fail.
- An `optional` cell means presence is acceptable but not required and not warned.
- A `FORBIDDEN` cell means drift-check fails on presence.

## 6. Migration from v0

### 6.1 What changes from v0

| v0 idiom | v1 status | Migration action |
|----------|-----------|------------------|
| `@deps` (standalone directive) | **REMOVED** | Move entries under `@ports.deps`. Standalone `@deps` → drift-check FAIL. |
| `@render N/A` literal value | **FORBIDDEN** | Delete the directive entirely. Empty `@render` not allowed; omit it. |
| `@render` on non-ui component | **FORBIDDEN** | Delete the directive. Re-classify profile if UI render is genuinely needed. |
| `@persist` on non-ui component | **FORBIDDEN** | Delete the directive. Move persistence logic to `@ports.deps` (e.g., `deps storage : localStorage-like`). |
| `@targets vanilla` on backend / protocol | **FORBIDDEN** | Change to `@targets runtime` or a specific stack name. |
| `@expansion template=estreux/v0.x.x` | DEPRECATED (WARN) | Bump to `estreux/v1.0.0` when the file is next touched. Not auto-required. |
| `@source` embedded in `@intent` as `(Distilled from ...)` | RATIFIED | Continue as-is OR promote to explicit `@source` directive (recommended). |
| `@behavior` prose block | RATIFIED as 5th directive | No change. Now formally recognized. |
| `cmd` entries under an `in` label | DRIFT (WARN) | Move to a separate `cmd:` sub-clause under `@ports`. |
| `@machine` without explicit name | WARN | Add `@machine <name>` per P1 signature. |

### 6.2 EG-side migration status (per `EUX-V1-CATALOG.md`)

- `@deps` → `@ports.deps`: **already complete** (0/12 standalone, 8/8 deps-bearing under `@ports`).
- `@render` / `@persist` cleanup: **complete** (0/12 retain v0 forms; 5/6 UI files are *missing* `@render`, which is **intentional and v1-conformant** — the UI profile makes `@render` optional when the UI is template-rendered upstream by a parent component; only `@render N/A` placeholder or `@render` on backend/protocol is forbidden per §3.10 + §4 G3. The P2 UI render/persist sub-spec will formalize the upstream-template-rendered convention, not impose a blanket `@render`-required rule).
- `@targets vanilla` on non-ui: **2 violations remain** (`watchdog.eux` backend, `ws-core.eux` protocol). Migration: change to `@targets runtime`.
- `@source` adoption: **0/12** — gradual migration; v1 WARN-tier allows time.
- `@machine` name binding: **1 file** (`ws-core.eux`) lacks explicit name binding — migrate to `@machine WSConn`.

### 6.3 Recommended migration order

1. **Mechanical FAIL fixes first** (G3, G4, G5 from the 6-gate matrix): remove forbidden `@render` / `@persist` / standalone `@deps` / placeholder `@targets`. These are 100% mechanical and unblock CI.
2. **`@machine` name + initial-state markers** (G2 STRICT for protocol/machine): add explicit names and `(initial)` annotations.
3. **`@source` adoption** (G6 WARN): promote `(Distilled from ...)` notes in `@intent` to explicit `@source` directives over time. No deadline; WARN-tier.
4. **`@expansion` template bump** (WARN): bump `estreux/v0.x.x` → `estreux/v1.0.0` when files are next touched.

## 7. Open Work (P2 / P3)

### 7.1 P2 — UI render/persist sub-spec

- Full v1 syntax + semantics for `@render` and `@persist` (UI profile).
- Empirical scope: 5/6 EG UI files currently lack `@render`. P2 must decide whether `@render` is **required** for ui profile or **strongly recommended** (WARN-tier like `@source`).
- Sub-questions:
  - Should `@render` describe DOM shape, event bindings, or both?
  - How does `@render` interact with `@state` (light reactive) and `@machine` (heavy dispatch)?
  - What does `@persist` look like for non-`localStorage` UI persistence (IndexedDB, BroadcastChannel, etc.)?

### 7.2 P3 — `@source` anchor-precise convention

- Replace / supplement line-precise `@source` with anchor-precise references (stable named markers in implementation files).
- Requires a convention in implementation files (e.g., `// @anchor:<name>` JS/TS comments).
- Survives editor reformatting and most refactors; brittleness goes away.
- Migration: line-precise `@source` remains valid; anchor-precise is additive.

### 7.3 Drift-check `--contract` implementation

- Full implementation of the 6-gate matrix in the EG drift-check tool.
- Includes per-profile tier dispatch, auto-fix suggestions for WARN-level issues, and CI integration.
- Verify phase to produce a per-file pass/fail/warn matrix for all 12 `constellation/*.eux` files.

### 7.4 Profile ↔ Superscalar `issue_width` lane mapping

- Per Superscalar §11 Entry 04, profile types map naturally to Superscalar `issue_width` lanes:
  - `protocol` → parallel-3 lane (multi-file analysis, decoder/encoder pairs).
  - `machine` → serial-only lane (state-machine derivation is inherently sequential).
  - `backend` → speculative lane (lifecycle observability + recovery paths).
  - `ui` → parallel lane (independent components, low cross-coupling).
  - `mixed` → composite lane (half-and-half, route by sub-section).
- Profile-specific cost models for the 5-axis cost-benefit gate.

### 7.5 Mixed-profile detailed semantics

- v1 reserves `mixed` profile but no EG instances exist. P2/P3 should define:
  - Sub-section delimiters within a single `.eux` file (e.g., `## ui-half` / `## protocol-half` sub-headings).
  - Per-half tier dispatch (each half gets its profile's tier rules).
  - `@rationale` requirement for declaring mixed profile (must justify why a single file spans two profiles rather than splitting).

- **P3 resolution — mixed per-half fallback rule**: in the absence of formal per-half delimiters, drift-check applies the **per-half fallback** rule: a file declaring `@targets ... profile=mixed` (or implicitly classified as mixed via dual-half directive composition) is validated by **applying each profile's tier rules to its respective half**, with the file-level profile `mixed` indicating the split. Concretely: if a file contains both ui-style directives (e.g., `@render` / `@state` light) and backend/protocol-style directives (e.g., `@machine` with dispatch + `@source` provenance), drift-check (a) groups directive blocks by profile-affinity, (b) applies ui tier rules to the ui-half block, and (c) applies the backend/protocol tier rules to the backend/protocol-half block. The 6-gate matrix §4 "per-half" cells (G2, G3, G6) operate under this fallback. The `mixed` profile label is therefore a **split marker**, not a third tier-set. When formal sub-headings (`## ui-half` / `## protocol-half`) are introduced in a future P2/P3 revision, they will make the split explicit and override the directive-affinity grouping; until then, directive-affinity grouping is the v1 fallback.

### 7.6 Machine-profile detailed semantics

- v1 reserves `machine` profile but no EG instances exist. P2/P3 should define:
  - Required form for pure state-machine components (no I/O — so `@ports` is optional).
  - Whether `machine` profile requires a formal verification anchor (e.g., a TLA+ or Alloy spec link via `@source`).
  - How `machine`-profile components are referenced from `backend` / `protocol` components (cross-link convention).

## Appendix A — Resolved Open Questions (from seq 73)

| # | Question | Answer (seq 73 / m-mpt2zmss-72) | v1 reflection |
|---|----------|--------------------------------|---------------|
| Q1 | Backend `@machine` requirement tier | **Strongly recommended** (states recommended, guards optional). Drift-check **soft-WARN** not FAIL. `watchdog.eux` (zero guards) passes as-is. Backend machine = lifecycle observability is permitted. | §3.7 + G2 in §4. |
| Q2 | `@source` line-range precision | **Line-precise** (1-indexed) for v1. Anchor-precise convention deferred to P3. `@source` is WARN-tier so brittleness is tolerable. | §3.8 + §7.2. |
| Q3 | `@behavior` clause status | **(a) Formalize as 5th directive** — free-form prose, doc-tier (no gate). Critical logic *recommended* to migrate to `@machine.guard` / `@machine.derive` but NOT forced (avoid incident-context loss in `server.eux`). | §3.9. |
| Q4 | `@derive` size budget | **No forced budget** (incident-driven derive deliberately permitted). Long derives *recommended* to spill into optional `@rationale` / `@incident` sub-clauses (soft, readability-only). Operational history is an asset. | §3.7 + §3.9. |
| Q5 | UI `@machine` recommendation tier | **(c) Compromise** — ui keeps `@state` (light reactive) as the default; `@machine` is optional for UI and only used when dispatch/transitions are needed. Role split: `@state` (ui-light) ↔ `@machine` (dispatch-heavy). | §3.5 + §3.7. |

## Appendix B — Provenance Trail

- **Main P1 directive signature**: Delegate seq 70, `m-mpt1ja6p-69`, board inbound 2026-05-31.
- **EG empirical catalog**: `constellation/reference/EUX-V1-CATALOG.md`, commit `e57af29`, 12-file analysis.
- **Main 5-Q ratification**: Delegate seq 73, `m-mpt2zmss-72`, board inbound 2026-05-31.
- **This specification**: drafted on 2026-05-31 from the above three artifacts. Pending main hub final review before publish-merge.

## Appendix C — Versioning

- **v1.0.0** — this document. P1 4-directive signature + `@behavior` 5th + 6-gate drift-check matrix. (The "4-directive" + "5th" phrasing here refers to the P1-formal sub-slice; the full v1 set is 9 directives per the §2 canonical phrasing.)
- **v1.x** — minor clarifications, additional WARN-tier checks, no breaking changes.
- **v2** — reserved for breaking changes (e.g., directive renames, profile additions, schema migration).
- v1 documents are forward-compatible with v0 except for the migrations listed in §6.1. The migrations are mechanical and the catalog evidence shows the EG repo is ~95% already at v1 shape.
