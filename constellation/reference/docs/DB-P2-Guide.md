# DB P2 Guide — `HistoryStore` SQLite migration discipline (mode-A → mode-B → mode-C)

> **Tier**: P1 EG 1차지식 guide (discipline + gates + rollback recommendations).
> **Not** the server.cjs spec body — main owns the `server.cjs` implementation surface and is free to refine the exact wire/code shape so long as the discipline contracts in §2–§9 hold. This document exists so that a main agent picking up DB P2 implementation cold has a single readable spine from which to reason.

---

## 1. Status & provenance

- **Version**: v0.1 — first publication of EG-side DB P2 guide.
- **Date**: 2026-05-31.
- **Tier**: P1 (EG 1차지식 — discipline / contract / gate recommendation). Not a wire-format spec; not normative on main's `server.cjs` line shape. The two normative anchors are the **mode chain** (§2) and the **count-reconcile gate** (§5) — everything else is recommendation tuned for the current single-server / single-main / file-state-backed deployment.
- **Provenance pins**:
  - **seq 79 DB RRP** (`m-mpt4mzo9-78`, 2026-05-31) — the originating agreement that fixed the three-mode migration shape: `HistoryStore` abstraction (P1) → `JsonlStore` + `SqliteStore` dual-write (P2) → db-primary (P3). The mode-letter naming (A / B / C) is this guide's convenience handle on top of seq 79's chain; the chain itself is unchanged.
  - **seq 144 trigger** (`m-mptlrmm3-143`, 2026-05-31) — main upstream Delegate requesting the EG-side P2 guide. This is the document that satisfies that delegate.
  - **Main P1 ship**: commit `5cd7fca` (HistoryStore interface + JsonlStore wrapping the current JSONL writer; `modes.historyBackend = "jsonl"` is the default and only value as of P1 ship). P2 starts here.
- **What this document is**:
  1. A migration-mode contract (mode-A jsonl-only · mode-B dual-write · mode-C db-primary).
  2. A backend-selection gate (`node:sqlite` primary + `better-sqlite3` fallback, deterministic per startup).
  3. A parity gate (count reconcile) that is the *only* safe signal for mode-B → mode-C promotion.
  4. A failure-recovery cookbook tied to the existing §13.20 BlockerManifest discipline.
- **What this document is NOT**:
  - A server.cjs line spec (main owns that — see §10 cross-links).
  - A schema RFC for the events table beyond the minimum mirror-JSONL-1:1 sketch in §8.
  - A retention / archival policy for JSONL files after mode C (open question — see §11).
- **Audience**: a main agent picking up DB P2 implementation, or an EG agent reviewing main's DB P2 PR. Readable cold — no out-of-document context required to understand the gates.

---

## 2. Migration mode chain — A · B · C

The migration is a strict three-step opt-in chain. **A fresh install always starts in mode A** (`modes.historyBackend = "jsonl"`). Each forward transition is operator-flipped after the preceding gate passes; each backward transition (rollback) is auto-triggered by a gate failure or manually invoked.

```
mode A  ────────►  mode B  ────────►  mode C
jsonl-only      dual-write+backfill    db-primary
   ▲                  │                    │
   │                  ▼                    ▼
   └─── rollback ─── mode A  ◄── rollback ── mode A or mode B
        (auto on count drift /         (auto on read-path err /
         WAL corruption / probe         WAL corruption; manual
         failure)                       at operator discretion)
```

### 2.1 Mode A — `jsonl-only` (current production, P1 floor)

- **`modes.historyBackend = "jsonl"`** (default for any fresh install).
- **Write path**: every event → `JsonlStore.append(event)` → existing JSONL file (atomic append: open, write, fsync, close per current server.cjs discipline). No SQLite touch.
- **Read path**: `JsonlStore.read*()` — same surface as P1 ship `5cd7fca`. SQLite backend is *not loaded* (no driver init, no file open). This matters for the probe (§3) — mode A means the `node:sqlite`/`better-sqlite3` gate is skipped entirely.
- **Invariants**:
  - Atomic write (append-then-fsync; no torn line).
  - No orphan (JSONL is the only store of record).
  - `JsonlStore.count() == on-disk event count` (trivially — only one store).
- **Mode-switch criteria** (A → B): operator flips `modes.historyBackend = "dual"` in `state.json`. No automatic promotion; mode B requires *intent* (operator must have run §3 probe and confirmed a backend choice).
- **Rollback path**: N/A (this *is* the floor). The reason mode A is the floor and not "no DB at all" is that `JsonlStore` is already in production at P1, so the rollback target is always a known-good state.

### 2.2 Mode B — `dual-write` + backfill (transitional)

- **`modes.historyBackend = "dual"`**.
- **Write path**: every event → `JsonlStore.append(event)` AND `SqliteStore.append(event)`. The two writes are wrapped in a *logical* transaction (see §7 partial-dual-write recovery): if either store throws, the other is reverted (JSONL by truncating the most recent line, SQLite by rolling back the transaction). On success, the event is durably present in both stores.
- **Read path**: `JsonlStore` is canonical for reads. SQLite is shadow-only in mode B. This minimizes the blast radius of a SQLite read bug — even if SqliteStore returns garbage for some queries, mode B does not surface that to clients.
- **Backfill**: on mode-B entry, run a one-shot batch backfill of all historical JSONL events into SQLite (see §4). The backfill is idempotent (INSERT OR IGNORE on event id) — re-running it is safe.
- **Invariants**:
  - Atomic dual-write (no event in only one store after a successful append).
  - No orphan (an event in JSONL must also be in SQLite once backfill completes).
  - Count reconcile (§5): `JsonlStore.count() == SqliteStore.count()` after backfill, and at every periodic checkpoint thereafter.
- **Mode-switch criteria** (B → C): see §6 — operator-driven opt-in after N consecutive count-reconcile PASSes + zero read-path errors for ≥1 operational cycle. This is the only safe promotion signal; do not auto-promote.
- **Rollback path** (B → A): triggered automatically on (a) count drift (§5), (b) WAL corruption (§7.2), or (c) repeated partial-dual-write failures (§7.3). Operator flips `modes.historyBackend = "jsonl"` back; SQLite file is preserved on disk for forensic review but no longer written to. The mode-B → mode-A rollback is *non-destructive* on JSONL (JSONL was the canonical store throughout mode B).

### 2.3 Mode C — `db-primary` (terminal state, opt-in)

- **`modes.historyBackend = "sqlite"`**.
- **Write path**: every event → `SqliteStore.append(event)`. JSONL is **not** written inline. Instead, JSONL is regenerated on demand via `SqliteStore.exportJsonl()` (§9) — this is the rollback safety net.
- **Read path**: `SqliteStore.read*()` is canonical. JSONL is no longer authoritative.
- **Invariants**:
  - Atomic write (SQLite transaction wraps the INSERT).
  - No orphan (single store of record).
  - `exportJsonl()` round-trip works at any time (§9) — this is the *terminal* safety invariant that justifies dropping inline JSONL writes.
- **Mode-switch criteria**: entry is operator opt-in only (§6). There is no further forward mode; mode C is the terminal state of this migration.
- **Rollback path** (C → B or C → A):
  - C → B: operator flips `modes.historyBackend = "dual"`. Server replays SQLite → JSONL via `exportJsonl()` to bring JSONL back to current, then resumes dual-writes. This is the recommended rollback if the operator wants to keep SQLite warm.
  - C → A: operator flips `modes.historyBackend = "jsonl"`. Server runs `exportJsonl()` once to materialize the canonical JSONL file, then stops writing to SQLite. Use this if SQLite is suspected of corruption and the operator wants to abandon it entirely. JSONL is the rollback floor — mode A is always reachable.

### 2.4 Zero-traffic gate (recommended)

All three mode transitions (A→B, B→C, C→B/A) SHOULD be performed during a zero-traffic window (no in-flight A2A messages, no active watchers). The server SHOULD refuse a mode flip if `pendingDeliveries > 0` and emit a `BlockerManifest` (§7.5) explaining the wait. This is a recommendation, not a hard contract — main may choose to allow live flips if the dual-write atomicity in §7.3 is judged sufficient. The conservative default is to require quiescence.

---

## 3. `node:sqlite` primary + `better-sqlite3` fallback gate

### 3.1 Why two backends

- **`node:sqlite`** (Node.js builtin, experimental as of Node 22.5+) is the strategic target — zero npm dependency, ships with Node, lifecycle bound to Node releases. This is the *primary* backend.
- **`better-sqlite3`** (npm package, mature synchronous SQLite driver) is the *fallback* — used when the Node runtime is too old, when `--experimental-sqlite` is absent, or when the `node:sqlite` import throws. This is the *fallback* backend.

### 3.2 The probe (deterministic, per-process-startup)

The backend choice is made **once per process startup**, recorded in a server-local variable, and never re-evaluated per-write. This determinism is load-bearing: a write that goes to `node:sqlite` and a subsequent write that goes to `better-sqlite3` would silently corrupt the dual-write invariant.

Probe pattern (recommendation):

```js
// Pseudocode — main owns the exact server.cjs shape.
function selectSqliteBackend() {
  // Step 1: Node version probe (semver compare against 22.5.0).
  const v = process.versions.node.split('.').map(n => parseInt(n, 10));
  const nodeOk = v[0] > 22 || (v[0] === 22 && v[1] >= 5);

  // Step 2: --experimental-sqlite flag probe.
  // Node 22.5+ requires this flag to expose the node:sqlite namespace.
  const flagOk = process.execArgv.includes('--experimental-sqlite')
    || (process.env.NODE_OPTIONS || '').includes('--experimental-sqlite');

  // Step 3: try the actual require — even if 1+2 pass, require can still fail
  // (e.g., experimental API removed in a patch release).
  if (nodeOk && flagOk) {
    try {
      const sqlite = require('node:sqlite');
      console.log('[DB P2] backend=node:sqlite (primary)');
      return { kind: 'node-sqlite', driver: sqlite };
    } catch (e) {
      console.warn('[DB P2] node:sqlite require failed, falling back:', e.message);
    }
  }

  // Step 4: fallback to better-sqlite3.
  try {
    const Better = require('better-sqlite3');
    console.log('[DB P2] backend=better-sqlite3 (fallback)');
    return { kind: 'better-sqlite3', driver: Better };
  } catch (e) {
    // Step 5: refuse to start in mode B/C if neither backend is available.
    if (mode === 'dual' || mode === 'sqlite') {
      throw new Error('[DB P2] No SQLite backend available; refuse to start in mode '
        + mode + '. Flip modes.historyBackend=jsonl to recover. Cause: ' + e.message);
    }
    // Mode A: no backend needed; continue without SQLite.
    console.log('[DB P2] mode=jsonl, SQLite backend not initialized');
    return null;
  }
}
```

### 3.3 Startup log discipline

The chosen backend MUST be logged at startup, with one of these exact prefixes (so log-scraping tooling can grep them deterministically):

- `[DB P2] backend=node:sqlite (primary)`
- `[DB P2] backend=better-sqlite3 (fallback)`
- `[DB P2] mode=jsonl, SQLite backend not initialized`

If the server is started in mode B or mode C and neither backend is available, the server MUST refuse to start (throw, exit with non-zero) — do not silently degrade to mode A, because the operator's intent (recorded in `state.json`) was to use SQLite. Silent degradation hides the failure from the operator.

### 3.4 Probe semantics summary

| Node version | `--experimental-sqlite` | `node:sqlite` require | `better-sqlite3` require | Chosen backend |
|---|---|---|---|---|
| ≥ 22.5 | present | succeeds | (not tried) | `node:sqlite` |
| ≥ 22.5 | present | fails | succeeds | `better-sqlite3` |
| ≥ 22.5 | absent | (not tried) | succeeds | `better-sqlite3` |
| < 22.5 | (irrelevant) | (not tried) | succeeds | `better-sqlite3` |
| any | any | fails or n/a | fails | refuse to start (mode B/C) or skip (mode A) |

---

## 4. Dual-write backfill (mode-B entry, one-shot)

### 4.1 What backfill is for

On mode-B entry, the historical JSONL file may already contain N events (potentially N=10⁴–10⁶ in a long-running deployment). SQLite is empty. Backfill is the one-shot operation that catches SQLite up to JSONL parity, so that subsequent dual-writes start from a consistent baseline.

Backfill is **separate from inline dual-writes**. It is NOT executed once per event for historical replay — that would multiply write cost by N. Instead, backfill is a single batched pass at mode-B entry, and the inline dual-write discipline only applies to *new* events appended after backfill completes.

### 4.2 Backfill flow

1. **Pre-check**: on mode-B entry, the server checks `SqliteStore.count()`. If 0, run full backfill. If >0 but < `JsonlStore.count()`, run partial backfill (resume from `max(id)` in SQLite — `INSERT OR IGNORE` makes this safe). If `>= JsonlStore.count()`, skip backfill (and trigger an immediate count-reconcile check per §5).
2. **Backfill pass**: stream the JSONL file line-by-line, batch events into chunks of ~500–1000, wrap each chunk in a SQLite transaction, and `INSERT OR IGNORE` each event by id.
3. **Post-check**: after backfill completes, run a count-reconcile (§5). If PASS, mode B is fully active. If FAIL, abort mode-B promotion (revert `modes.historyBackend` to `jsonl`), log the diff, and surface as `BlockerManifest` per §7.5.

### 4.3 Idempotency

Every event has a unique id (the event's existing JSONL id, mirrored 1:1 into the SQLite `events.id` PK — see §8). `INSERT OR IGNORE` makes each insert idempotent: re-running backfill is safe and produces the same final state. This matters because mode-B entry might be aborted partway (operator Ctrl-C, server crash, etc.); the next mode-B entry attempt should be able to resume cleanly.

### 4.4 Batched transactions (performance)

Without batching, each INSERT is its own transaction, which makes SQLite fsync per row — for 10⁵ events, that is on the order of 10⁵ fsyncs (potentially minutes on spinning disk, ~10s on SSD). Batching with a transaction wrapper of 500–1000 rows reduces this to ~100–200 fsyncs total (well under a minute even on slow disk).

Recommended batch size: 500 rows. Larger is faster but increases the rollback cost on transaction failure; 500 is a defensible midpoint. Main is free to tune.

### 4.5 Concurrency note

Backfill runs at mode-B entry, before any new inline events arrive (because mode B is only entered during a zero-traffic window per §2.4). If main chooses to allow live mode-B entry, then the backfill pass MUST be guarded against in-flight new events — either by suspending new appends until backfill completes (preferred) or by buffering new events and replaying them after backfill (more complex; not recommended for P2).

---

## 5. Count-reconciliation gate

### 5.1 The contract

```
JsonlStore.count()  ==  SqliteStore.count()
```

This equality is the **only safe signal** that the SQLite backend has parity with the JSONL backend. Without it, mode-B → mode-C promotion is unsafe.

### 5.2 When to check

- **After backfill** (mode-B entry, §4.2 post-check) — gates mode-B activation.
- **Periodically during mode B** — recommended cadence: every N=10 minutes, or every K=100 new events, whichever comes first. Main may tune.
- **Before mode-C promotion** (§6) — operator opt-in requires N=10 consecutive PASSes.

### 5.3 What "mismatch" means

If `JsonlStore.count() != SqliteStore.count()`, do NOT auto-resolve. Instead:

1. Abort the mode-B → mode-C promotion (if pending).
2. Generate a **discrepancy report** — list of event ids present in one store but not the other. The discrepancy report is a structured JSON object:
   ```json
   {
     "ts": "2026-05-31T...Z",
     "jsonl_count": 12345,
     "sqlite_count": 12343,
     "only_in_jsonl": ["evt-abc", "evt-def"],
     "only_in_sqlite": [],
     "investigation_hint": "two events missing from SQLite — check for partial-dual-write failure in §7.3"
   }
   ```
3. Surface the discrepancy as a `BlockerManifest` per §7.5 (subject = operator; reason = parity gate failed; eg_side_action_waiting = mode-C promotion).
4. Continue running in mode B (do not auto-rollback to mode A unless drift recurs — see §7.4 for the auto-rollback trigger).
5. Require operator review before either (a) re-running backfill, (b) rolling back to mode A, or (c) accepting the drift and proceeding.

### 5.4 Why no auto-resolve

The count gate exists precisely because dual-write atomicity is not perfect (race conditions, crash recovery, transaction-abort timing). Auto-resolving a drift would mask the underlying defect; operator review forces the discipline of understanding *why* the drift occurred before continuing.

---

## 6. Bootstrap opt-in design

### 6.1 Default state

A fresh install is **always mode A** (`modes.historyBackend = "jsonl"`). There is no auto-promotion to mode B or C. The operator must explicitly opt in by editing `state.json` (or by running an admin command if main provides one).

### 6.2 Mode-B opt-in checklist

Before flipping `modes.historyBackend = "dual"`, the operator MUST verify:

- [ ] Node runtime supports `node:sqlite` (≥ 22.5 + `--experimental-sqlite`) OR `better-sqlite3` is npm-installed.
- [ ] Disk space available for SQLite file (≥ JSONL file size, typically 1.2–1.5× JSONL — SQLite has overhead).
- [ ] Backup of current JSONL file (this is the rollback floor — do not start mode B without a JSONL backup).
- [ ] Zero-traffic window (§2.4) is achievable for the backfill duration (estimate: ~1 minute per 10⁵ events on SSD).

### 6.3 Mode-C opt-in checklist

Before flipping `modes.historyBackend = "sqlite"`, the operator MUST verify:

- [ ] Mode B has been running for ≥ 1 full operational cycle (recommended: 24 hours of typical traffic).
- [ ] Last backfill completed cleanly (no partial-fail in the mode-B entry post-check).
- [ ] **N = 10 consecutive count-reconcile PASSes** (this is the parity floor — see §5).
  - Rationale for N=10: balances detection-sensitivity-of-rare-drift against operator wait time. With N=10 at 10-minute cadence, this is ~100 minutes of clean parity before promotion. Main / operator may tune N upward (more conservative) but should not tune below 10.
- [ ] **Zero read-path errors** during mode B for ≥ 1 operational cycle (24 hours recommended). Read-path errors include: `SqliteStore.read*()` throwing, return shape mismatch vs `JsonlStore.read*()` for the same query, or any client-visible inconsistency.
- [ ] `exportJsonl()` round-trip verified (§9) — operator runs `SqliteStore.exportJsonl()` once and confirms the output JSONL is byte-equivalent (within event-ordering tolerance) to the canonical JSONL file. This is the safety-net verification.

### 6.4 Opt-in chain summary

```
fresh install                    → mode A  (jsonl-only, default)
operator flip + B-checklist      → mode B  (dual-write + backfill)
operator flip + C-checklist      → mode C  (db-primary)
```

There is no shortcut. A → C direct promotion is not supported; the operator must pass through mode B (and its parity gate) to reach mode C. This is by design — mode B is the *only* place where the count-reconcile gate has both stores available to compare.

---

## 7. Failure modes + recovery

### 7.1 `node:sqlite` probe failure

- **Mode A**: no impact (SQLite not loaded; mode A doesn't need it).
- **Mode B/C**: fall back to `better-sqlite3` per §3. If `better-sqlite3` is also unavailable, refuse to start (log `[DB P2] No SQLite backend available; refuse to start in mode X`; exit non-zero). Operator must either install `better-sqlite3` (`npm install better-sqlite3`) or flip mode back to `jsonl` in `state.json`.

### 7.2 SQLite WAL corruption

Symptoms: `database disk image is malformed` errors on read or write; checksum failures on WAL replay; unexpected NULLs in returned rows.

Recovery sequence:

1. Set `modes.historyBackend = "jsonl"` in `state.json` (immediate rollback to mode A — JSONL is unaffected and remains canonical).
2. Restart server (forces mode-A startup; SQLite backend is not loaded).
3. Verify server is healthy in mode A (JSONL reads/writes working, no errors).
4. Drop the corrupted SQLite file (move to `<dataDir>/sqlite-corrupted-<ts>.db` for forensic review; do not delete outright — preserves evidence).
5. (Optional, if operator wants to retry SQLite) re-enter mode B per §6.2; backfill from JSONL will recreate the SQLite database from scratch.

The recovery is **always possible** because JSONL is the rollback floor (§2.1). WAL corruption never threatens canonical data in mode A or mode B; only in mode C is JSONL not inline-current, and there `exportJsonl()` (§9) is the safety net.

### 7.3 Partial dual-write (mode B)

Scenario: `JsonlStore.append(event)` succeeds, `SqliteStore.append(event)` throws (or vice versa). Without a logical transaction, the event would be in one store but not the other — a count drift on the very next §5 check.

Recovery (logical transaction discipline):

- Wrap the dual-write in an explicit try/catch. On either store throwing:
  - If JSONL append succeeded and SQLite failed: **truncate the most recent JSONL line** to undo the append. JSONL is line-oriented, so this is a single `ftruncate(2)` to the previous offset. Log the abort.
  - If SQLite append succeeded and JSONL failed: **rollback the SQLite transaction**. (Implementation note: SQLite's per-statement autocommit means each INSERT is its own transaction by default; for dual-write atomicity, wrap the INSERT in an explicit `BEGIN` / `COMMIT` and only `COMMIT` after JSONL append succeeds. This makes JSONL append the "decision point" and SQLite the "commit point".)
- On repeated partial-dual-write failures (recommended threshold: 3 within 10 minutes), auto-revert to mode A per §7.4.

### 7.4 Count drift mid-mode-B → auto-revert to mode A

If the periodic count-reconcile (§5.2) detects drift twice within a short window (recommended: 2 drifts within 30 minutes), the server SHOULD auto-revert to mode A:

1. Set `modes.historyBackend = "jsonl"` (in-memory; do NOT mutate `state.json` automatically — leave that for the operator to confirm, so the operator's intent is preserved across restarts).
2. Stop writing to SQLite (subsequent writes go only to JSONL).
3. Emit a `BlockerManifest` per §13.20 with:
   - `subject = "operator"` (the human who flipped to mode B)
   - `reason = "DB P2 mode-B count drift detected (count-reconcile FAIL × 2 within 30min); auto-reverted to mode A in-memory"`
   - `eg_side_action_waiting = "operator review of discrepancy report + decision: re-enter mode B (re-run backfill) OR persist mode A (set state.json modes.historyBackend=jsonl)"`
   - Initial tier: `2-explicit` (this is a parity failure, not a polite nudge).

The auto-revert keeps the server *running* in a known-good state while surfacing the failure for operator review. Do not auto-resolve; do not silently continue in mode B with known drift.

### 7.5 BlockerManifest emission for DB P2 failures

All P2 gate failures (§7.1 missing backend, §7.2 WAL corruption, §7.3 repeated partial-write, §7.4 count drift, §5.3 mode-C promotion blocked) emit a `BlockerManifest` per §13.20 (see §10 cross-links). This makes the failure observable on the live board and time-bounded by the §13.20.5 escalation tiers. The DB P2 gate is not a silent background process — operators see failures via the same discipline that surfaces every other blocker.

---

## 8. Schema sketch — `events` table

Mirror JSONL field shape 1:1. Do not over-design. The goal is that an event written to JSONL and the same event written to SQLite are *semantically identical* (same id, same ts, same payload), so dual-write is a trivial copy and `exportJsonl()` is a trivial inverse.

```sql
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,           -- mirrors JSONL event id (server-bridge-stamped per §13.13)
  thread_id   TEXT NOT NULL,              -- A2A thread id (or "system" for non-thread events)
  agent_id    TEXT NOT NULL,              -- sender / subject agent id
  ts          TEXT NOT NULL,              -- ISO-Z timestamp (TEXT, not INTEGER — keep round-trip lossless)
  name        TEXT NOT NULL,              -- event name (e.g. "Delegate", "Ack", "UpstreamKeyIssued")
  value_json  TEXT NOT NULL,              -- full event body as JSON blob (the JSONL line, minus id/ts/name which are extracted columns)
  source      TEXT NOT NULL               -- "inline" | "backfill" | "import" — provenance tag
);

-- Indexes only on the read paths the existing code actually queries.
-- (Audit existing JSONL read calls before adding more indexes.)
CREATE INDEX IF NOT EXISTS idx_events_thread_ts ON events(thread_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_agent_ts  ON events(agent_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_ts        ON events(ts);
```

Notes:

- `id` is PRIMARY KEY — INSERT OR IGNORE keys off this. Mirrors the existing JSONL event id (do not generate a new id on insert; use the one from JSONL).
- `value_json` is the canonical event body. The three extracted columns (`thread_id`, `agent_id`, `ts`, `name`) are denormalized projections of `value_json` fields, used for indexed reads. On `exportJsonl()` the row is reconstructed by merging the columns back into `value_json` (or, more simply, `value_json` already contains all fields and the columns are derived — see §9).
- `source` provenance tag distinguishes inline writes (mode B dual-write or mode C primary) from backfill writes (§4) from future import flows. Useful for debugging count drift (§5.3): if `only_in_jsonl` are all `source != "backfill"`, the drift is in inline dual-write.
- **No additional indexes** beyond the three above unless a specific read path is identified. Over-indexing slows writes; the discipline is "index what is read, not what might be read someday".

---

## 9. `exportJsonl()` round-trip — the safety net

### 9.1 Contract

`SqliteStore.exportJsonl()` MUST produce a JSONL stream of all events such that the output is **byte-identical** to the canonical JSONL file, within the following tolerances:

1. **Event ordering**: events within the same `(thread_id, ts)` may be reordered if `ts` resolution is millisecond and two events share the same ms. Globally, events MUST be ordered by `ts` ascending; ties broken by `id` ascending (lexicographic).
2. **Whitespace**: trailing newline at EOF MUST match; intra-line whitespace MUST match (JSON serialization MUST use the same shape as the original JSONL writer — no pretty-printing, no extra spaces).
3. **Field order within each event JSON**: best-effort match. If the original JSONL writer used a deterministic field order (recommended: alphabetical, or insertion order if stable), `exportJsonl()` MUST replicate it.

### 9.2 Why this matters

`exportJsonl()` is the rollback floor for mode C. If a mode-C deployment hits SQLite corruption (§7.2) and the operator wants to roll back to mode A, the recovery sequence is:

1. Run `SqliteStore.exportJsonl()` → write to `<dataDir>/history-rebuild-<ts>.jsonl`.
2. Verify byte-identical against pre-mode-C backup (if available) — diff should be empty modulo new events added during mode C.
3. Replace the canonical JSONL file with the rebuild.
4. Flip `modes.historyBackend = "jsonl"`, restart.

Without byte-identical round-trip, the rollback would produce a JSONL file that downstream tools (log scrapers, audit pipelines, off-site backup diff tools) treat as different — undermining the rollback's value.

### 9.3 Verification

Recommended verification during mode-B operation (before mode-C promotion):

1. Run `SqliteStore.exportJsonl()` to a temp file.
2. Diff against the canonical JSONL file.
3. Diff should be empty (within §9.1 tolerances). If not, the round-trip is broken — do NOT promote to mode C.

This is part of the §6.3 mode-C opt-in checklist.

---

## 10. Cross-links

- **`Constellation.md` §13.20 — BlockerManifest discipline**: the wire-shape and escalation-tier rules for surfacing DB P2 failures. All §7 failure modes emit a `BlockerManifest`; the count-reconcile gate (§5) and the mode-C promotion gate (§6.3) are observable on the live board through this discipline. This guide does not re-spec §13.20 — it consumes it.
- **`Constellation.md` §13.19.4 — `ReviewSLAAck`**: if main needs to defer DB P2 work (e.g. mode-B implementation is blocked on an unrelated production fire), the deferral is captured via `ReviewSLAAck` with `eta` set to a realistic re-engagement time. Pairs with §13.20 — the blocker manifest tracks the wait; the `ReviewSLAAck` records the agreed-upon deferral budget.
- **`Constellation.md` §13.13 — A2A ack tier**: event id stamping (referenced in §8 `events.id`) flows from the §13.13 server-bridge-stamped msgId surface. The `id` column mirrors that.
- **Seed RRP**: seq 79 DB RRP (`m-mpt4mzo9-78`, 2026-05-31) — the originating agreement.
- **Main P1 ship commit**: `5cd7fca` — HistoryStore + JsonlStore landed in `server.cjs`. P2 starts from this commit.
- **This guide's commit**: `constellation/reference/docs/DB-P2-Guide.md` (v0.1, 2026-05-31). Commit hash TBD post-publication.
- **EUX v1**: this document is a discipline guide, not an `.eux` file. The `server.cjs` directives (e.g. `@machine` for HistoryStore mode FSM, `@ports` for write surface) are main's responsibility to author per `constellation/reference/docs/eux-format-v1.md`.

---

## 11. Open questions

Items requiring main upstream / operator decision before P2 is fully nailed down:

1. **WAL checkpoint cadence**: SQLite WAL mode requires periodic checkpoints to prevent unbounded WAL growth. What cadence? Options: (a) auto-checkpoint every N pages (SQLite default 1000 pages), (b) explicit `PRAGMA wal_checkpoint(TRUNCATE)` every M minutes, (c) checkpoint on graceful shutdown only. Recommendation: (a) + (c) — let SQLite auto-checkpoint, plus a forced TRUNCATE checkpoint on shutdown to keep WAL bounded across restarts. Main to confirm.
2. **Retention policy for old JSONL files after mode C**: in mode C, JSONL is regenerated on demand via `exportJsonl()` but is no longer the canonical store. Should the pre-mode-C JSONL file be (a) kept indefinitely as a frozen snapshot, (b) rotated by age (e.g. keep 90 days), (c) deleted after operator confirms mode C parity? Recommendation: (a) for the first 6 months post-mode-C (so any rollback to mode A has a known-good JSONL to fall back to without re-running `exportJsonl()`), then operator-decided. Open for main / operator policy.
3. **Schema migration discipline for future schema versions**: when the events table schema needs to change (new column, new index, new table), how is the migration applied? Recommendation: numbered migration files (`migrations/001_*.sql`, `002_*.sql`, ...) applied on startup, with a `schema_version` table tracking applied migrations. But P2 ships with v1 schema only — no migration discipline yet. Open for P3 / post-P3.
4. **Multi-server / replica story**: this guide assumes single-server / single-main / file-backed state. SQLite is local-file; replication is out of scope. If EG ever goes multi-server, the DB layer needs a different design (LiteFS? PostgreSQL? rqlite?). Explicitly out of scope for P2; flagged here so the assumption is visible.
5. **`exportJsonl()` performance ceiling**: for very large event counts (10⁷+), `exportJsonl()` could take minutes. Is that acceptable for the rollback use case? Recommendation: yes (rollback is rare; minutes are tolerable). But if mode-C deployments grow into the 10⁸ range, streaming export + parallel readers may be needed. Open for future tuning.
6. **`source` column values beyond inline/backfill/import**: should we add `replication`, `repair`, `manual-edit` source tags now (for future use), or keep the enum minimal? Recommendation: keep minimal — extend the enum only when a concrete use case appears. Flagging here for visibility.
7. **Backend probe semantics under mixed deployments**: if some EG instances run on Node 22.5+ with `node:sqlite` and others on Node 20 with `better-sqlite3`, are the SQLite files cross-compatible? Both drivers speak the same SQLite file format, so the answer is *probably yes*, but worth a smoke test before relying on it. Open for verification during mode-B rollout.

---

## Changelog

- **v0.1 (2026-05-31)**: initial publication. EG-side 1차지식 guide for DB P2. Responds to main upstream Delegate seq 144 (`m-mptlrmm3-143`). Builds on seq 79 RRP (`m-mpt4mzo9-78`) and main P1 ship commit `5cd7fca`.
