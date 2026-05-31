# DB P2 Mode-B Entry Runbook — operator step-by-step for safe Mode A → Mode B transition

> **Tier**: P1 EG 1차지식 supplement to `DB-P2-Guide.md` (mechanizes the §6.2 B-checklist into a runnable sequence).
> **Companion to**: `DB-P2-Guide.md` (the discipline + correctness spine) and `DB-P2-Benchmark-Framework.md` (the parallel-run effectiveness gates). This runbook is **operator-facing** — every section is a checklist the operator runs in order, with explicit verify steps and explicit failure handling.

---

## 0. When to use this runbook

Use this runbook when:

- The deployment is currently in **Mode A** (`state.json.modes.historyBackend == "jsonl"`).
- The operator has decided to enter **Mode B** to run parallel benchmarking per `DB-P2-Benchmark-Framework.md`.
- Either `node:sqlite` (Node ≥22.5 + `--experimental-sqlite`) OR `better-sqlite3` (npm) is available on the host (verify in §1.1 below).

Do NOT use this runbook to:

- Re-enter Mode B after an auto-revert — first investigate the discrepancy report per `DB-P2-Guide.md` §5.3 and resolve the underlying cause; only then re-enter (and on re-entry, the backfill will be partial, INSERT OR IGNORE; that case is documented in §2.3 below).
- Promote to Mode C — that is a separate gate; see `DB-P2-Guide.md` §6.3 + `DB-P2-Benchmark-Framework.md` §6.

---

## 1. Pre-flight checks (mechanized §6.2 B-checklist)

Run these checks IN ORDER. Each step has a verify action; do NOT proceed until the verify passes.

### 1.1 Backend probe verify

**Goal**: confirm `selectSqliteBackend()` succeeds with a valid driver BEFORE the mode flip. Refusing to start in Mode B after `state.json` is already flipped is a worse failure mode than this pre-flight check, because Mode A is no longer accessible without re-editing `state.json`.

**Step**: run a one-shot probe script. Recommended invocation (Windows PowerShell):

```powershell
# Probe node:sqlite first (preferred backend)
node --experimental-sqlite -e "const s = require('node:sqlite'); const db = new s.DatabaseSync(':memory:'); db.exec('CREATE TABLE t(x INT)'); console.log('node:sqlite OK, version=' + db.prepare('SELECT sqlite_version() AS v').get().v); db.close();"
```

If the above fails, probe `better-sqlite3`:

```powershell
# Probe better-sqlite3 (fallback)
node -e "const B = require('better-sqlite3'); const db = new B(':memory:'); db.exec('CREATE TABLE t(x INT)'); console.log('better-sqlite3 OK, version=' + db.prepare('SELECT sqlite_version() AS v').get().v); db.close();"
```

**Verify**: at least one of the two probes prints `OK` with a SQLite version string. If BOTH fail, STOP — Mode B entry is not viable on this host. Resolution paths:

- Upgrade Node to ≥22.5 and add `--experimental-sqlite` to the server's startup flags (preferred — `node:sqlite` is the strategic backend per `DB-P2-Guide.md` §3.1).
- Install `better-sqlite3`: `npm install better-sqlite3` (fallback).

Do NOT proceed past §1.1 with both probes failing — the server will refuse to start in Mode B per §7.1 of the Guide, and you will have a stuck server.

### 1.2 Disk space verify

**Goal**: confirm at least **2× current JSONL total size** is free on the disk that hosts `ws-history/`. This covers the SQLite `.db` (typically 1.2–1.5× JSONL per `DB-P2-Guide.md` §6.2) + WAL file (sized by checkpoint cadence) + headroom for the JSONL backup taken in §1.3 + buffer.

**Step**: measure current JSONL total size:

```powershell
# Sum active + archived JSONL sizes
$active = (Get-ChildItem -Recurse "ws-history" -Filter "*.jsonl" -Exclude "archived" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
$archived = (Get-ChildItem -Recurse "ws-history\archived" -Filter "*.jsonl" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
$total = $active + $archived
Write-Output "JSONL total: $total bytes ($([math]::Round($total / 1MB, 2)) MB); need ≥ $($total * 2) bytes free"
```

Measure free space:

```powershell
$drive = (Get-Item "ws-history").PSDrive
$free = (Get-PSDrive $drive).Free
Write-Output "Free: $free bytes ($([math]::Round($free / 1MB, 2)) MB)"
```

**Verify**: `$free >= $total * 2`. If insufficient, free disk space (archive old channels per `JsonlStore.archiveChannel` / `deleteChannel`, or move to a larger volume) BEFORE proceeding.

### 1.3 JSONL backup verify

**Goal**: snapshot the canonical JSONL store BEFORE any Mode-B activity. This is the rollback floor — if anything goes wrong during Mode B entry, the operator must be able to restore the pre-Mode-B state from this backup.

**Step**: copy `ws-history/` to a timestamped backup directory:

```powershell
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item -Recurse "ws-history" "ws-history.backup-$ts"
```

**Verify**: confirm the backup is complete and matches the source:

```powershell
# Compare total file counts and sizes
$srcCount = (Get-ChildItem -Recurse "ws-history" -File).Count
$bakCount = (Get-ChildItem -Recurse "ws-history.backup-$ts" -File).Count
$srcSize = (Get-ChildItem -Recurse "ws-history" -File | Measure-Object -Property Length -Sum).Sum
$bakSize = (Get-ChildItem -Recurse "ws-history.backup-$ts" -File | Measure-Object -Property Length -Sum).Sum
Write-Output "Source: $srcCount files, $srcSize bytes"
Write-Output "Backup: $bakCount files, $bakSize bytes"
if ($srcCount -eq $bakCount -and $srcSize -eq $bakSize) { Write-Output "BACKUP OK" } else { Write-Output "BACKUP MISMATCH — DO NOT PROCEED" }
```

**Verify**: `BACKUP OK` printed. If `BACKUP MISMATCH`, investigate (likely a permission issue or an active write during the copy — retry during a quiet moment).

**Operator confirmation required**: explicitly confirm "backup exists and includes archived files" before proceeding. The backup is the rollback floor; missing files in the backup means a non-rollback-able Mode B entry.

### 1.4 Zero-traffic window

**Goal**: ensure no event is in-flight during the mode flip. An event mid-flight when the mode changes risks partial-dual-write (per `DB-P2-Guide.md` §7.3) on the very first dual-write attempt — not an ideal start.

**Step**: open the dashboard and watch the live event feed. Confirm:

- No active streaming events for at least 60s.
- `pendingDeliveries == 0` (per §2.4 of the Guide).
- No watchers are mid-poll (check the dashboard's connection panel — connection count is stable, no rapid reconnects).

Best time: low-traffic hours per the deployment's traffic profile.

**Verify**: 60 consecutive seconds of no event activity. If activity resumes, wait another 60s before proceeding.

### 1.5 state.json edit + restart

**Goal**: flip the mode flag and restart the server cleanly.

**Step**:

1. **Stop the server gracefully**. Send SIGTERM (NOT SIGKILL — graceful shutdown lets pending events flush to JSONL):

   ```powershell
   # If running under a process supervisor (PM2, nssm, etc.), use that supervisor's stop command.
   # If running interactively, Ctrl-C the terminal that runs server.cjs.
   ```

   Wait for the server process to exit. Confirm by `Get-Process node` showing no stragglers, OR by checking the supervisor's status.

2. **Edit `state.json`**. Open with a text editor and change:

   ```json
   {
     "modes": {
       "historyBackend": "jsonl"
     }
   }
   ```

   to:

   ```json
   {
     "modes": {
       "historyBackend": "dual",
       "benchmarkActive": true
     }
   }
   ```

   The `benchmarkActive: true` line activates the telemetry hooks per `DB-P2-Benchmark-Framework.md` §5.2 — recommended for first-time Mode B entry. Omit it if you do not want telemetry collection (not recommended; without it, the Mode-C promotion gate in §6 of the Benchmark Framework cannot be defended with data).

   **Verify**: re-read `state.json` and confirm the edit is present:

   ```powershell
   Get-Content state.json
   ```

3. **Restart the server**. Use the same invocation as before, ensuring `--experimental-sqlite` is present if relying on `node:sqlite`:

   ```powershell
   node --experimental-sqlite server.cjs
   ```

4. **Watch the startup logs** for these markers IN ORDER:

   - `[DB P2] backend=node:sqlite (primary)` OR `[DB P2] backend=better-sqlite3 (fallback)` — backend probe succeeded (per `DB-P2-Guide.md` §3.3).
   - `SqliteStore.boot ...` — SQLite database opened, schema applied.
   - `backfillFromJsonl ...` — backfill pass started; progress logs every 500-row batch.
   - `backfillFromJsonl complete` — backfill finished.
   - `post-check count reconcile: PASS` — parity verified per `DB-P2-Guide.md` §4.2 post-check.

   If any of these markers is absent or replaced by an error, see §1.6.

### 1.6 Post-check count reconcile

**Goal**: confirm the §4.2 post-check PASS — this is the gate that activates Mode B.

**Step**: watch the log line `post-check count reconcile: PASS` from §1.5 step 4.

**Verify (PASS path)**: log line appears with `PASS`; dashboard shows Mode B active; no BlockerManifest emitted.

**Verify (FAIL path)**: log line appears with `FAIL` AND a discrepancy report is emitted (per `DB-P2-Guide.md` §5.3 shape). In this case:

1. Server SHOULD auto-revert `currentMode` to "jsonl" in-memory (`_autoRevert` per §7.4 of the Guide) AND emit a BlockerManifest.
2. `state.json.modes.historyBackend` REMAINS `"dual"` (operator intent preserved per §7.4 of the Guide).
3. Operator MUST investigate the discrepancy report BEFORE retry:
   - Read the report (location: emitted via `onBlocker` callback → surfaced on dashboard + live board).
   - Identify whether the drift is in `only_in_jsonl` (events missing from SQLite — backfill incomplete or backfill bug) or `only_in_sqlite` (events in SQLite not in JSONL — impossible in mode-B entry, indicates pre-existing SQLite state from a prior aborted Mode B).
   - Resolution:
     - If `only_in_sqlite > 0`: there's pre-existing SQLite state. Stop the server, delete `ws-history/history.db` and `history.db-wal`/`shm` files, restart from §1.5.
     - If `only_in_jsonl > 0` and small (< 10 events): likely an in-flight event during the mode flip despite §1.4. Stop server, edit `state.json.modes.historyBackend = "jsonl"`, restart in Mode A, wait for true quiescence, retry from §1.4.
     - If `only_in_jsonl > 0` and large: backfill is broken. Stop server, revert to Mode A, file a bug report with the discrepancy report attached. Do NOT retry until fix is shipped.

---

## 2. Backfill expectations — what the operator sees during Mode B entry

The backfill (per `DB-P2-Guide.md` §4) is a one-shot batched pass run automatically on Mode B entry. The operator does not invoke it; the server runs it as part of `historyStore.boot()`.

### 2.1 Backfill flow

1. **Pre-check** (`SqliteStore.count()`):
   - If 0 → full backfill.
   - If `>0 && < JsonlStore.count()` → partial backfill (resume from `max(id)`).
   - If `>= JsonlStore.count()` → skip backfill, run immediate count-reconcile.

2. **Backfill pass**: streams JSONL line-by-line, batches into chunks of 500, wraps each chunk in a SQLite transaction, INSERT OR IGNORE by event id.

3. **Post-check**: count-reconcile per §1.6 above.

### 2.2 Time estimate

Rough order-of-magnitude estimates (varies with disk + record size + SQLite backend; benchmark on your deployment for actuals):

| Event count | SSD estimate | Spinning-disk estimate |
|---|---|---|
| 10,000 | < 30 s | 1–3 min |
| 100,000 | 1–3 min | 10–30 min |
| 1,000,000 | 10–30 min | 100 min – 5 hours |

The `--experimental-sqlite` backend tends to be ~10–20% slower than `better-sqlite3` for backfill (subject to Node version + machine).

### 2.3 Progress logs

Per the recommended discipline (`DB-P2-Guide.md` §4.4 + history-store.cjs L383-398):

```
backfillFromJsonl batch 1/N (events 1-500) committed
backfillFromJsonl batch 2/N (events 501-1000) committed
...
backfillFromJsonl complete (N events, T seconds)
post-check count reconcile: PASS (jsonl=N, sqlite=N)
```

If progress stalls (no batch log line for >30s on SSD, >2min on spinning disk), investigate: check disk I/O via Task Manager / `Resource Monitor`, check log for SQLite errors. Do NOT kill the server during backfill — it can leave a partial SQLite state that next entry will partial-backfill on top of (per §4.1 of the Guide that is safe via INSERT OR IGNORE, but messier than a clean retry).

### 2.4 Backfill aborted mid-pass

If the server is killed or crashes mid-backfill:

1. Stop trying to recover automatically.
2. On next start, the pre-check will detect `SqliteStore.count() < JsonlStore.count()` and run a partial backfill (resume from `max(id)`).
3. INSERT OR IGNORE makes this safe — re-running backfill cannot duplicate events.
4. Post-check runs as normal.

This is why §4.3 of the Guide calls out idempotency as a contract — Mode B entry is resume-safe by design.

---

## 3. Operating in Mode B — day-to-day monitoring

Once Mode B is active, the operator monitors four signals on a recurring basis (recommended: dashboard glance per shift; full review weekly).

### 3.1 Reconcile pass rate

**Cadence**: server runs `reconcile()` every ~10 min OR every ~100 new events (per `DB-P2-Guide.md` §5.2).

**Expected**: every reconcile is PASS. The dashboard should show a flat `reconcile_pass_rate == 1.0` time-series.

**Action on FAIL**:

- Single FAIL: a discrepancy report is generated and emitted as BlockerManifest (subject=operator, tier 2-explicit per §5.3 of the Guide). Operator MUST review BEFORE the next reconcile cycle. Do NOT dismiss without reading the `only_in_jsonl` / `only_in_sqlite` lists.
- Two FAILs within 30 min: `_recordDrift` fires `_autoRevert` (per §7.4 of the Guide). Server flips to Mode A in-memory; state.json unchanged (operator intent preserved). Operator decision required — see §5 below.

### 3.2 Drift events

**Definition**: a single reconcile FAIL.

**Expected**: zero. Drift events in steady-state Mode B indicate a defect in dual-write atomicity (partial-write that the §7.3 logical transaction did not catch) OR a defect in `reconcile()` itself.

**Action**: every drift event triggers a BlockerManifest. Operator MUST read the discrepancy report before resuming.

### 3.3 Partial-fail events

**Definition**: `JsonlStore.append` succeeded but `SqliteStore.append` threw (or vice versa). Logged via `_recordPartialFail` (per `history-store.cjs` L538-541).

**Expected**: zero in steady-state. Bursts of partial-fails indicate disk pressure (ENOSPC), SQLite lock contention, or a SqliteStore bug.

**Action on threshold breach (3 within 10 min)**: `_autoRevert` triggers (per §7.3 of the Guide). Same operator decision path as drift event (§5 below).

### 3.4 Disk growth

**What to watch**: `disk_jsonl_active_bytes`, `disk_jsonl_archived_bytes`, `disk_sqlite_db_bytes`, `disk_sqlite_wal_bytes` (per `DB-P2-Benchmark-Framework.md` §2.2).

**Expected**: JSONL and SQLite `.db` grow together (both stores get every event). The `.db` size should track JSONL active size with a 1.2–1.5× factor. WAL grows between checkpoints, then drops at checkpoint.

**Action**:

- `.db` size grows faster than 2× JSONL: SQLite schema or indexes are bloated. Investigate.
- WAL size grows without bound (≥ 100MB and rising): WAL checkpoint cadence is broken. See `DB-P2-Guide.md` §11 OQ-1 for checkpoint discipline; investigate and possibly invoke `PRAGMA wal_checkpoint(TRUNCATE)` manually.
- Total disk usage approaches the §1.2 headroom: free space or archive channels BEFORE the disk fills (a full disk during Mode B can trigger partial-fail cascades).

---

## 4. Benchmarking activation

The detailed framework is in `DB-P2-Benchmark-Framework.md`. Quick pointers:

- **Activation**: set `state.json.modes.benchmarkActive = true` (done in §1.5 if you followed the recommended flow).
- **Metrics file**: `ws-history/metrics/benchmark-<modeB-entry-ts>.jsonl` — opened on Mode B entry, written every N=1000 events, closed on Mode C promotion or rollback.
- **Dashboard tab**: "DB Benchmark" tab reads the metrics file and renders p50/p95/p99 trends + reconcile / drift / partial-fail counters + disk-space stacked chart + current promotion-eligibility checklist.
- **Scheduled `exportJsonl()` diff**: runs every 6 hours; verifies byte-identical round-trip per `DB-P2-Guide.md` §9.1.
- **Sample sizing**: minimum 7 days + 10,000 events; recommended 30 days + 100,000 events (per `DB-P2-Benchmark-Framework.md` §3).

The framework's §6 specifies the combined correctness + effectiveness gates that, when ALL PASS, authorize the operator to consider Mode-C promotion.

---

## 5. Rollback procedure (Mode B → Mode A)

This is the **operator-driven** rollback. The `_autoRevert` path is *automatic* on drift/partial-fail thresholds (per `DB-P2-Guide.md` §7.3 + §7.4) and only flips the in-memory mode — the operator-driven rollback below makes the rollback durable across restarts by editing `state.json`.

### 5.1 When to roll back

- After `_autoRevert` fired AND the operator's investigation of the discrepancy / partial-fail concluded that staying in Mode B is not safe.
- After observing sustained performance degradation that fails the §6 effectiveness gates and is not improving with time.
- After WAL corruption (per §6.2 below).
- Operator preference (e.g., abandoning Mode B before promotion because operational considerations changed).

### 5.2 Rollback steps

1. **Stop the server gracefully** (SIGTERM, NOT SIGKILL):

   ```powershell
   # As in §1.5 step 1, use the supervisor's stop command OR Ctrl-C the interactive terminal.
   ```

   Wait for the server to exit fully.

2. **Edit `state.json`**:

   ```json
   {
     "modes": {
       "historyBackend": "jsonl"
     }
   }
   ```

   Optionally retain `benchmarkActive: true` if you want to collect a Mode A baseline post-rollback for the next Mode B attempt's reference distribution (per `DB-P2-Benchmark-Framework.md` §5.2 / §8 OQ-5).

3. **Preserve the SQLite database for forensic review**:

   ```powershell
   $ts = Get-Date -Format "yyyyMMdd-HHmmss"
   Move-Item "ws-history\history.db" "ws-history\sqlite-rollback-$ts.db"
   Move-Item "ws-history\history.db-wal" "ws-history\sqlite-rollback-$ts.db-wal" -ErrorAction SilentlyContinue
   Move-Item "ws-history\history.db-shm" "ws-history\sqlite-rollback-$ts.db-shm" -ErrorAction SilentlyContinue
   ```

   Do NOT delete the `.db` file — it's evidence. If the rollback was triggered by drift or corruption, the forensic review will need the `.db` to understand what went wrong. Move it; don't delete.

4. **Restart the server**:

   ```powershell
   node --experimental-sqlite server.cjs
   ```

   (The `--experimental-sqlite` flag is harmless in Mode A — the SQLite backend simply isn't loaded.)

5. **Verify Mode A active**:
   - Startup log shows `[DB P2] mode=jsonl, SQLite backend not initialized` (per `DB-P2-Guide.md` §3.3).
   - Dashboard shows Mode A active.
   - No BlockerManifests pending (any pre-rollback ones should be acknowledged separately).

6. **Document the rollback**: write a brief note to the deployment's operational log (or as a `rollback-<ts>.md` next to the promotion-decision artifacts directory) covering:
   - Trigger (drift / partial-fail / performance / manual).
   - Discrepancy report contents (if drift).
   - `sqlite-rollback-<ts>.db` path for future forensic reference.
   - Whether re-entry to Mode B is planned (and prereqs for it).

---

## 6. Failure scenarios + recovery quick reference

| Scenario | Symptom | Reference | Action summary |
|---|---|---|---|
| **Backend probe failure** | Both `node:sqlite` and `better-sqlite3` unavailable; server refuses to start in Mode B | `DB-P2-Guide.md` §7.1, §3.3 | Install a backend (`npm install better-sqlite3` OR upgrade Node + `--experimental-sqlite`) OR revert `state.json` to Mode A. DO NOT expect silent degrade — refuse-to-start is by design. |
| **WAL corruption** | `database disk image is malformed` errors; checksum failures; NULL rows | `DB-P2-Guide.md` §7.2 | Operator-driven rollback (§5 above). Preserve `.db` as `sqlite-corrupted-<ts>.db`. Re-enter Mode B optional (backfill from JSONL recreates `.db` from scratch). |
| **Drift event (single FAIL)** | BlockerManifest with discrepancy report (subject=operator, tier 2-explicit) | `DB-P2-Guide.md` §5.3, §7.4 | Read the report BEFORE next reconcile cycle. Investigate `only_in_jsonl` / `only_in_sqlite` lists. Do not dismiss; do not auto-resolve. |
| **Drift threshold (2 in 30 min)** | `_autoRevert` fires; in-memory mode flips to "jsonl"; BlockerManifest emitted | `DB-P2-Guide.md` §7.4 | Operator decision: re-enter Mode B (re-run backfill) OR persist Mode A (operator-driven rollback per §5 above to durable-flip `state.json`). |
| **Partial-fail threshold (3 in 10 min)** | `_autoRevert` fires; same as drift threshold | `DB-P2-Guide.md` §7.3 | Investigate the underlying cause (disk pressure / SQLite lock / SqliteStore bug) BEFORE re-entry. |
| **Disk full** | ENOSPC errors; partial-fail cascade | (operational) | Free disk space immediately (archive channels, move volume). If `_autoRevert` already fired, follow drift-threshold path. |
| **Server crash mid-backfill** | No `backfillFromJsonl complete` log; SQLite has partial state | §2.4 above | Restart server. Backfill auto-resumes from `max(id)` via INSERT OR IGNORE — safe by §4.3 of the Guide. |
| **Operator-side `state.json` typo** | Server boots in Mode A despite operator's intent to enter Mode B | (operator error) | Re-edit `state.json` carefully; common errors are trailing comma, wrong quotation marks, accidentally setting `"historyBackend": "sqlite"` (which would skip Mode B and try Mode C directly — refused by the §6 opt-in chain). |

---

## 7. Mode-C promotion checklist preview

Mode-C promotion is a separate, more demanding gate. This runbook does NOT cover the promotion; it only sets the stage. When the operator considers promotion eligible, refer to:

- **`DB-P2-Guide.md` §6.3** — C-checklist (correctness gates): N=10 consecutive reconcile PASSes, zero read-path errors ≥1 cycle, `exportJsonl()` round-trip verified, last backfill clean.
- **`DB-P2-Benchmark-Framework.md` §6** — effectiveness gates: performance thresholds, operational thresholds, robustness rehearsals, the promotion-decision artifact.
- **`DB-P2-Benchmark-Framework.md` §7** — rollback rehearsal protocol (a precondition).

Promotion is NEVER automated. The operator reads the metrics, writes the promotion-decision artifact (per Benchmark-Framework §6.3), and flips `state.json.modes.historyBackend = "sqlite"` by hand.

---

## 8. Communication discipline — surfacing mode changes

Every Mode A → Mode B transition (and every subsequent rollback or Mode-C promotion) MUST be visible on the live board and the dashboard. Silent mode changes are a discipline failure — operators downstream of the change should not have to read `state.json` to know what mode the server is in.

### 8.1 ServerNotice on mode entry

On Mode B entry (after the §1.6 post-check PASS), the server SHOULD emit:

```json
{
  "kind": "mode-change",
  "from": "A",
  "to": "B",
  "ts": "2026-06-01T...Z",
  "trigger": "operator-state.json-flip",
  "backfillEventCount": 12345,
  "backendKind": "node-sqlite"
}
```

Delivered to all connected boards via the existing ServerNotice channel. This is informational, not blocking.

### 8.2 BlockerManifest (informational tier) on Mode B entry

In addition to the ServerNotice, an **informational-tier** BlockerManifest SHOULD be emitted noting:

```
subject: operator
reason: "Mode B entry complete; parallel-run benchmark window open. Mode-C promotion blocked until DB-P2-Benchmark-Framework.md §6 gates PASS."
eg_side_action_waiting: "operator monitoring + Mode-C promotion decision per DB-P2-Benchmark-Framework.md §6"
tier: 0-informational (no escalation expected; visible on dashboard for situational awareness)
```

This is NOT an error — it's a *standing notice* that the deployment is in transitional Mode B. It dismisses automatically on Mode-C promotion or Mode B → Mode A rollback.

### 8.3 Rollback notice

On Mode B → Mode A rollback (operator-driven per §5 OR auto-revert per `DB-P2-Guide.md` §7.3/§7.4), emit:

```json
{
  "kind": "mode-change",
  "from": "B",
  "to": "A",
  "ts": "2026-06-01T...Z",
  "trigger": "operator-state.json-flip" | "auto-revert-drift" | "auto-revert-partial-fail" | "operator-rollback-wal-corruption",
  "discrepancyReportPath": "..." // present if triggered by drift; references the BlockerManifest payload
}
```

Plus the original BlockerManifest (tier 2-explicit per §7.4 of the Guide) for the actual auto-revert event.

### 8.4 Promotion notice (Mode C entry)

Out of scope for this runbook (see Benchmark Framework §6.3), but the same discipline applies: emit a `ServerNotice{kind:'mode-change', from:'B', to:'C'}` plus a permanent record in the promotion-decision artifact.

---

## Cross-references

- **`DB-P2-Guide.md`**: §3 backend probe · §4 backfill · §5 count reconcile · §6.2 B-checklist (this runbook mechanizes it) · §6.3 C-checklist (Mode-C promotion) · §7 failure modes (this runbook's §6 quick-reference) · §9 exportJsonl.
- **`DB-P2-Benchmark-Framework.md`**: §5 telemetry activation (this runbook's §4) · §6 promotion gates (this runbook's §7) · §7 rollback rehearsal protocol (precondition for promotion).
- **`constellation/history-store.eux`** (v1 distillation): @machine HistoryStoreMode (state transitions referenced throughout) · @source ranges for `selectSqliteBackend` (L246-279), `SqliteStore.boot` (L309-323), `backfillFromJsonl` (L383-398), `_autoRevert` (L546-550).
- **`Constellation.md` §13.20** (BlockerManifest format): every BlockerManifest emission in §1.6 post-check FAIL, §3.1-§3.3 mode-B monitoring failures, §6 quick-reference, §8.2 standing notice uses this shape.

---

## Changelog

- **v0.1 (2026-06-01)**: initial publication. Operator-facing runbook mechanizing `DB-P2-Guide.md` §6.2 B-checklist into a runnable sequence. Pairs with `DB-P2-Benchmark-Framework.md` (effectiveness gates) — both authored to support the operator's stated Mode-B → Mode-C promotion rationale ("두 솔루션 병행하면서 실효성 벤치마킹을 충분히 진행한 후 자료가 충분히 확보된 시점에서 DB Only로 전환").
