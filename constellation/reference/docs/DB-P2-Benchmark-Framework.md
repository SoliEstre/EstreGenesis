# DB P2 Benchmark Framework — Mode-B parallel-run effectiveness gates for Mode-C promotion

> **Tier**: P1 EG 1차지식 supplement to `DB-P2-Guide.md` (effectiveness gates layered on top of the correctness gates in §5/§6.3).
> **Companion to**: `DB-P2-Guide.md` (the discipline + correctness spine) and `DB-P2-Mode-B-Entry-Runbook.md` (the operator entry procedure). This document does NOT redefine the mode chain; it defines the *evidence catalog* the operator collects during Mode B so the Mode-B → Mode-C promotion in §6.3 can be defended with data rather than wishful thinking.

---

## 1. Purpose — what "실효성 (real effectiveness)" means for Mode-C promotion

The DB-P2-Guide §6.3 gate (N=10 consecutive count-reconcile PASSes + zero read-path errors + `exportJsonl()` round-trip) is a **correctness gate**. It answers exactly one question: "are the two stores in parity?" That question is necessary but not sufficient for the operator's stated promotion rationale, which is broader:

> "두 솔루션 병행하면서 실효성 벤치마킹을 충분히 진행한 후 자료가 충분히 확보된 시점에서 DB Only로 전환"
>
> (Run both solutions in parallel, benchmark effectiveness sufficiently, then promote to DB-only when the data is sufficient.)

"실효성 (real effectiveness)" subsumes correctness but adds three further dimensions:

1. **Performance** — does SQLite append/query/recovery actually win (or at least tie) on the operations that matter? Latency p50/p95/p99, throughput under burst, query cost by filter pattern, recovery latency, disk footprint.
2. **Operational ergonomics** — is SQLite cheaper to operate? Backup time, restore time, cold-start time, WAL-checkpoint impact on tail latency, observability surface (can the operator see what's happening?).
3. **Recovery characteristics** — when things go wrong, how do the two backends behave? Crash recovery, disk-full, partial-write, probe failure, Node version downgrade — measured, not assumed.

This framework defines the **effectiveness gates** the operator runs in parallel with the §6.3 correctness gate. Both must pass before promotion is defensible.

Concretely, this document specifies:

- §2 — the metrics catalog (what to measure)
- §3 — sample sizing (how much data is "enough")
- §4 — comparison methodology (apples-to-apples discipline)
- §5 — data collection mechanics (where metrics come from)
- §6 — the promotion decision framework (combined correctness + effectiveness gates)
- §7 — the rollback rehearsal protocol (a precondition for promotion)
- §8 — open questions needing main / operator input

This is a **discipline document**, not a benchmark script. Main upstream owns the server.cjs telemetry hooks; this doc tells main what to emit and tells the operator what to do with the emissions.

---

## 2. Metrics catalog — what to measure during Mode-B parallel-run

The catalog is grouped into four buckets: **correctness · performance · operational · robustness**. Every metric has a name, a definition, a collection point, and a promotion-relevance note.

### 2.1 Correctness metrics

The §5 / §6.3 gates already define these; this section catalogs them in metric form so they can be reported alongside performance numbers in a single dashboard view.

| Metric | Definition | Collection point | Promotion relevance |
|---|---|---|---|
| `reconcile_pass_rate` | `(PASS_count) / (PASS_count + FAIL_count)` over the benchmark window | `HistoryStoreMux.reconcile()` outcome (L532-537) | Must be 1.0 for ≥ N=10 consecutive checks (§6.3) |
| `drift_count` | Number of count-reconcile FAILs in the benchmark window | `_recordDrift` invocations (L542-545) | Must be 0 for the promotion-eligibility window (recommended ≥14 days) |
| `partial_fail_count` | Number of partial-dual-write failures in the benchmark window | `_recordPartialFail` invocations (L538-541) | Must be 0 for the promotion-eligibility window (recommended ≥14 days) |
| `export_jsonl_byte_identical_pass_rate` | Fraction of scheduled `exportJsonl()` diffs against canonical JSONL that come back empty (within §9.1 tolerances) | Scheduled job in §5.3 | Must be 1.0 for the promotion-eligibility window |
| `event_id_collision_rate` | Count of `INSERT OR IGNORE` invocations where the row was *ignored* (i.e. id already existed) outside the backfill pass | SqliteStore.append on L352 (instrument the ignore branch) | Must be 0 during inline dual-write — collisions during backfill (§4.3) are normal and not counted |
| `backfill_idempotency` | Re-run backfill `backfillFromJsonl` on a snapshotted .db and verify final state matches | Out-of-band rehearsal (run once before promotion) | Must produce identical state — flags broken idempotency before it hides a real failure |

### 2.2 Performance metrics

The performance bucket measures the **per-operation cost** the two stores impose. These are the metrics the operator needs to defend the promotion to anyone asking "is SQLite actually better?"

| Metric | Definition | Collection point | Promotion relevance |
|---|---|---|---|
| `append_latency_jsonl_ns` | Wall-clock ns from `JsonlStore.append(ev)` entry to fsync return; reported as p50/p95/p99 | Stamp at L75 entry + L88 exit | Baseline — Mode A behavior; SQLite must not be catastrophically worse |
| `append_latency_sqlite_ns` | Wall-clock ns from `SqliteStore.append(ev)` entry (BEGIN if explicit tx) to COMMIT return; reported as p50/p95/p99 | Stamp at L352 entry + COMMIT exit | Mode B inline cost; promotion gate: p99 SQLite append ≤ 2× JSONL p99 |
| `append_latency_dual_ns` | Wall-clock ns from mux `append(ev)` entry to mux exit (both stores, logical transaction) | Stamp at L508-521 entry + exit | The cost the *operator's clients* actually see in Mode B; tracks the cost of dual-write atomicity |
| `query_latency_jsonl_ns` | Wall-clock ns per `JsonlStore.query(filter)`, broken down by filter pattern (channel-only / thread+time-range / agent+time-range) | Stamp at L92-102 entry + exit | Baseline — Mode A read cost |
| `query_latency_sqlite_ns` | Same as above, for `SqliteStore.query(filter)` | Stamp at L356-368 entry + exit | Promotion gate: p95 SQLite query ≤ JSONL p95 for each filter pattern (SQLite indexes should win on indexed paths; ≤ tolerates ties) |
| `count_latency_jsonl_ns` | Wall-clock ns for `JsonlStore.count()` | Stamp at L114 | Frequently called by reconcile + dashboard refresh; tail latency matters |
| `count_latency_sqlite_ns` | Wall-clock ns for `SqliteStore.count()` | Stamp at L379 | Same |
| `export_jsonl_full_latency_ms` | Wall-clock ms for `SqliteStore.exportJsonl()` to complete a full export from the live `.db` | Stamp at L371-376 entry + stream-end | Mode-C rollback floor cost; promotion gate: ≤ Y seconds for the operator's current event count (Y is operator-set; see §8 OQ-3) |
| `disk_jsonl_active_bytes` | `du` of active `ws-history/` (excluding `archived/`) | Sampled every 10 min | Tracks operational growth |
| `disk_jsonl_archived_bytes` | `du` of `ws-history/archived/` | Sampled every 10 min | Tracks operational growth |
| `disk_sqlite_db_bytes` | `du` of `ws-history/history.db` | Sampled every 10 min | SQLite overhead vs JSONL — typically 1.2–1.5× per DB-P2-Guide §6.2 |
| `disk_sqlite_wal_bytes` | `du` of `ws-history/history.db-wal` and `-shm` | Sampled every 10 min | Bounded by WAL checkpoint cadence (§8 OQ-1) — unbounded growth flags a checkpoint problem |

### 2.3 Operational metrics

The operational bucket measures the **cost of running** each backend. These are slow-moving metrics — sampled hourly or per-event — but they dominate the operator's actual workload.

| Metric | Definition | Collection point | Promotion relevance |
|---|---|---|---|
| `recovery_time_after_crash_ms_modeA` | Wall-clock ms from server-process-start to first event served, after a `kill -9` simulating crash, in Mode A (JSONL-only) | Out-of-band rehearsal; measured per rehearsal | Baseline |
| `recovery_time_after_crash_ms_modeB` | Same, in Mode B (JSONL canonical + SQLite warmup) | Out-of-band rehearsal | Should be ≥ Mode A (SQLite open + WAL replay is extra work); flag if dramatically worse |
| `recovery_time_after_crash_ms_modeC_simulated` | Same, in Mode C — simulated by flipping to mode C in a staging env before measuring | Out-of-band rehearsal | Promotion gate: ≤ Mode A within an operator-set tolerance (e.g. 2×) |
| `wal_checkpoint_frequency_per_hour` | Count of `PRAGMA wal_checkpoint(TRUNCATE)` invocations per hour (auto + explicit) | SqliteStore.boot/_openDb instrumentation (L309-323) + `close` (L468) | Tracks WAL discipline; spikes flag durability anomalies |
| `wal_checkpoint_duration_ms` | Wall-clock ms each checkpoint takes; reported as p50/p95/p99 | Stamp around the checkpoint call | Tail-latency contributor; promotion gate: p99 checkpoint ≤ operator-set tolerance |
| `backup_restore_time_s_modeA` | Wall-clock s to restore from a tarball of `ws-history/` (JSONL only) | Out-of-band rehearsal | Baseline; very fast |
| `backup_restore_time_s_modeB` | Same, but tarball includes JSONL + `.db` + WAL | Out-of-band rehearsal | Slower than A by SQLite size factor; flag if unworkable |
| `backup_restore_time_s_modeC` | Same, but tarball is `.db` only + `exportJsonl()` re-materializes JSONL | Out-of-band rehearsal | Promotion gate: ≤ operator-set tolerance for the operator's current event count |
| `cold_start_time_ms` | Wall-clock ms from `node server.cjs` start to "ready to serve" (first WS connection accepted) | Stamp around `historyStore.boot()` (L492-505) | Mode A: pure JSONL replay. Mode B: JSONL replay + SQLite open + WAL replay. Mode C: SQLite open only. Promotion gate: Mode C ≤ Mode A (SQLite should win cold-start vs JSONL replay) |

### 2.4 Robustness metrics

The robustness bucket is measured by **failure injection rehearsals**. These cannot be observed passively — the operator must deliberately break things and watch the recovery path.

| Metric | Definition | Collection / rehearsal | Promotion relevance |
|---|---|---|---|
| `disk_full_recovery_path` | What does the server do when disk fills mid-write? Does it ENOSPC cleanly, partial-fail, or corrupt? | Inject by capping a tmpfs at JSONL size + 5% headroom; write until full | Promotion gate: partial-fail counter increments + auto-revert path triggers as designed (§7.3) |
| `wal_corruption_recovery_path` | What does the server do when the WAL file is truncated mid-replay? | Inject by `truncate -s 0 history.db-wal` between writes | Promotion gate: server refuses to read garbage; operator rollback path (§7.2) works |
| `partial_write_recovery_path` | Simulate JSONL append succeeds but SQLite throws (and vice versa) | Inject by patching SqliteStore.append to throw on every Nth call; observe `_recordPartialFail` counter + auto-revert at threshold | Promotion gate: auto-revert triggers within §7.3 threshold (3 in 10 min) |
| `probe_failure_path` | Simulate `node:sqlite` removed AND `better-sqlite3` absent at boot in Mode B | Inject by uninstalling `better-sqlite3` and launching without `--experimental-sqlite` | Promotion gate: server refuses to start, exits non-zero, emits BlockerManifest (§7.1) |
| `node_version_downgrade_path` | Simulate operator boots on Node 22.4 (no `node:sqlite`) after running on Node 22.5+ | Switch Node version via `nvm`; boot | Promotion gate: falls back to `better-sqlite3` cleanly if installed; refuses cleanly if not |
| `auto_revert_latency_ms` | Wall-clock ms from drift/partial-fail threshold breach to `_autoRevert` complete (mode flipped in-memory) | Stamp at `_autoRevert` L546-550 entry + exit | Promotion gate: ≤ operator-set tolerance (recommended ≤ 100 ms — sub-perceptible) |
| `blocker_manifest_emit_latency_ms` | Wall-clock ms from failure detection to BlockerManifest delivered to onBlocker callback | Stamp at failure detection + `_emitBlocker` L551-553 | Promotion gate: ≤ 1 s — fast surfacing |
| `operator_notification_path` | Does the BlockerManifest actually reach the operator's review surface (dashboard + live board)? | Rehearsal: force a drift, verify BlockerManifest appears on dashboard | Promotion gate: appears within escalation tier 2-explicit window per §13.20.5 |

---

## 3. Sample sizing — what counts as "data sufficient"?

The user's promotion rationale hinges on "자료가 충분히 확보된 시점 (when data is sufficiently accumulated)". This section makes "sufficient" concrete.

### 3.1 Minimum sample

**Floor**: N=10,000 events processed in Mode B **AND** ≥ 7 days continuous Mode B uptime, **whichever is later**.

Rationale:

- 10,000 events is the minimum sample for stable p99 tail-latency estimates (below this, the p99 is one or two samples — noise, not signal).
- 7 days catches at least one full weekday-weekend cycle (traffic patterns differ) and several full WAL-checkpoint cycles (so checkpoint-induced tail latency is sampled, not just steady-state).
- "Whichever is later" prevents both pathologies: a high-traffic deployment that hits 10k events in 2 hours has not actually observed the operational envelope; a low-traffic deployment that takes 30 days to reach 10k events but already exhibits 7+ checkpoint cycles can promote on the time floor.

### 3.2 Recommended sample

**Recommended**: 30 days continuous Mode B uptime **AND** ≥ 100,000 events **AND** at least one full operational cycle observed end-to-end.

"One full operational cycle" is defined as observing each of:

- A board update churn event (operator edits the live board, server emits `BoardUpdate`).
- An agent join/leave burst (multiple agents connect/disconnect within a 60s window).
- A dashboard reload with full history pull (operator refreshes `dashboard.html`; server serves the History envelope per §13.x).
- A `closeChannel` and a subsequent `loadChannel` (cold-storage round-trip).
- At least one scheduled `exportJsonl()` byte-identical diff against canonical JSONL.
- At least one WAL checkpoint (auto or shutdown-triggered).

The 30-day window typically captures all of the above naturally; if any are absent at day 30, extend the window until they appear. Promotion without observing the operational cycle is "data insufficient" by definition.

### 3.3 "Enough" gate — per-metric stability

A metric is "stable enough for promotion" when:

- Its 7-day rolling variance is under an operator-set threshold (see §8 OQ-1 for the threshold value). Provisional default: **CV (coefficient of variation) ≤ 0.15** for p50 metrics; **≤ 0.30** for p99 metrics (tail noise tolerated more loosely).
- No drift event in the last 14 days.
- No partial-fail in the last 14 days.
- `reconcile_pass_rate` = 1.0 in the last 14 days.

If any metric fails the stability gate, the operator must either extend the benchmark window or investigate the source of instability before promotion. The framework does NOT auto-promote — the operator owns the decision (§6).

### 3.4 What "enough" never means

It does NOT mean:

- Hitting N=10 reconcile PASSes in 100 minutes and immediately promoting. The §6.3 N=10 is a *floor*, not a *target*; this framework requires it to hold across the full benchmark window.
- Promoting because performance gates pass once. Single-shot benchmarks miss tail behavior; only sustained measurement counts.
- Promoting because the operator is impatient. The benchmark window is the cost of buying confidence; cutting it short is buying false confidence.

---

## 4. Comparison methodology — apples-to-apples discipline

Mode-B parallel-run is structurally biased in some directions and against the bias in others. This section documents the disciplines that prevent the bias from corrupting the comparison.

### 4.1 The sequential-not-parallel cost discipline

In Mode B, every event triggers BOTH `JsonlStore.append` AND `SqliteStore.append`, wrapped in a logical transaction (§7.3 of the Guide). The cost the *client* sees is `append_latency_dual_ns` — this is NOT the sum of the two stores' individual append latencies, because the two operations are partially overlapped (JSONL fsync can be in flight while SQLite is binding parameters, etc.).

**Discipline**: report all three numbers:

- `append_latency_jsonl_ns` (Mode A would see this)
- `append_latency_sqlite_ns` (Mode C would see this)
- `append_latency_dual_ns` (Mode B clients see this)

When comparing JSONL-only vs SQLite-only (the actual Mode A vs Mode C comparison the operator is making the promotion decision on), use the first two. The dual number is the *Mode-B transitional cost*, not the steady-state target.

### 4.2 Disk space — report all three sizes

Per §2.2, `disk_*` metrics measure four distinct things: active JSONL, archived JSONL, SQLite `.db`, SQLite WAL. The operator needs ALL FOUR for capacity planning, plus the totals per mode:

- Mode A total = `disk_jsonl_active_bytes + disk_jsonl_archived_bytes`
- Mode B total = `disk_jsonl_active_bytes + disk_jsonl_archived_bytes + disk_sqlite_db_bytes + disk_sqlite_wal_bytes`
- Mode C total = `disk_sqlite_db_bytes + disk_sqlite_wal_bytes` (JSONL not inline-written; pre-mode-C JSONL retained per §11 OQ-2 of the Guide is a separate line item)

**Discipline**: every disk-space report includes all four raw sizes plus the three derived totals. Do not pretend Mode B disk cost is just the SQLite addition — the dual presence is the actual operational reality during Mode B, and Mode C's disk cost is what the operator will live with post-promotion.

### 4.3 Recovery — same crash, all modes

The recovery rehearsals (§2.3 `recovery_time_after_crash_ms_*` and §2.4 robustness metrics) MUST use the **same crash scenario** across all three modes for the comparison to be meaningful.

**Discipline**: a recovery rehearsal protocol that runs ALL THREE modes against the same sequence:

1. Start server in mode X with N events already present.
2. Send 100 events at 10 events/sec.
3. `kill -9` the server at event 50.
4. Restart in mode X.
5. Measure time to first event served + final event count present.
6. Repeat for X ∈ {A, B, C}.

Differences in N, traffic rate, or kill timing make the modes incomparable. Document the protocol in the promotion-decision artifact (§6.3) so a future reader can replay it.

### 4.4 Query patterns — match the production read mix

Per §2.2, query latency is broken down by filter pattern. The operator MUST measure the patterns that production actually issues, not a synthetic mix.

**Discipline**: extract the production read mix from a 7-day sample of `query()` invocations (filter shape distribution), then run the benchmark with that exact mix. If the production mix is 80% thread+time-range / 15% agent+time-range / 5% channel-only, the benchmark mix should match.

If the production mix is unknown (instrumentation missing), add the instrumentation BEFORE starting the benchmark. Benchmarking against a guessed mix is benchmarking against nothing.

### 4.5 Clock discipline

All timestamps used for latency calculation MUST come from `process.hrtime.bigint()` (monotonic nanosecond clock). Wall-clock timestamps (`Date.now()`, ISO strings) are NTP-skew-prone and not safe for sub-millisecond measurement.

**Discipline**: latency metrics are stamped in `hrtime.bigint()` ns; metrics emitted to disk include both the hrtime delta (the measurement) AND a wall-clock ts (for human-readable correlation), but the wall-clock ts MUST NOT be used for arithmetic.

---

## 5. Data collection mechanics — where do the metrics come from?

### 5.1 Server-side telemetry hooks

Main upstream owns `server.cjs` and `history-store.cjs`. This framework requests the following telemetry extensions (specifics open per §8 OQ-2):

- **Per-event latency stamps** at the points listed in §2.2 collection points. Each stamp is a `hrtime.bigint()` ns reading; the delta between paired stamps is the metric.
- **Counter dumps** every N events (recommended N=1000) — emits a JSONL line to the metrics file with `{ts, event_count_window, p50/p95/p99 per latency metric, count metrics, disk snapshot}`.
- **Aggregation discipline**: per-event stamps are NOT written to disk individually (that would multiply write cost by 2× per event). They are accumulated in an in-memory ring buffer and dumped as percentiles on the periodic counter dump.

The recommended emission format is JSONL (one metric record per line), one file per mode-B benchmark window, opened on Mode B entry and closed on Mode C promotion or rollback:

```
ws-history/metrics/benchmark-<modeB-entry-ts>.jsonl
```

Each line is a metric snapshot:

```json
{
  "ts": "2026-06-01T12:34:56Z",
  "event_count_window": 1000,
  "event_count_total": 23456,
  "append_latency_jsonl_ns": {"p50": 1234, "p95": 5678, "p99": 9012},
  "append_latency_sqlite_ns": {"p50": 2345, "p95": 6789, "p99": 10123},
  "append_latency_dual_ns": {"p50": 3456, "p95": 7890, "p99": 11234},
  "query_latency_jsonl_ns_by_pattern": {
    "thread+ts_range": {"p50": ..., "p95": ..., "p99": ...},
    "agent+ts_range": {"p50": ..., "p95": ..., "p99": ...},
    "channel_only":   {"p50": ..., "p95": ..., "p99": ...}
  },
  "query_latency_sqlite_ns_by_pattern": { /* same shape */ },
  "count_latency_jsonl_ns": {"p50": ..., "p95": ..., "p99": ...},
  "count_latency_sqlite_ns": {"p50": ..., "p95": ..., "p99": ...},
  "reconcile_pass_count_window": 6,
  "reconcile_fail_count_window": 0,
  "drift_count_window": 0,
  "partial_fail_count_window": 0,
  "disk_jsonl_active_bytes": 123456789,
  "disk_jsonl_archived_bytes": 234567890,
  "disk_sqlite_db_bytes": 345678901,
  "disk_sqlite_wal_bytes": 12345678,
  "wal_checkpoint_frequency_window": 1,
  "wal_checkpoint_duration_ms": {"p50": 12, "p95": 45, "p99": 89}
}
```

### 5.2 Activation flag

Telemetry is OFF by default (zero overhead in normal operation). The operator opts in by setting:

```json
// state.json
{
  "modes": {
    "historyBackend": "dual",
    "benchmarkActive": true
  }
}
```

When `benchmarkActive: true` and `historyBackend == "dual"`, the server initializes the telemetry path and starts writing to the metrics file. Toggle off at any time by setting `benchmarkActive: false` and restarting (graceful shutdown closes the current metrics file).

**Discipline**: do NOT retroactively measure. The benchmark window starts at Mode B entry; metrics from before Mode B entry are Mode A baseline and should be collected in a separate file `baseline-modeA-<entry-ts>.jsonl` during a pre-flight Mode A measurement pass (recommended: 7-day Mode A baseline before flipping to Mode B).

### 5.3 Scheduled jobs

Two scheduled jobs run in addition to per-event telemetry:

1. **`exportJsonl()` byte-identical diff** — runs every 6 hours during the benchmark window. Steps: (a) call `SqliteStore.exportJsonl()` to a temp file; (b) diff against canonical JSONL within §9.1 tolerances; (c) emit a metrics line with `{ts, diff_byte_count, diff_event_count, pass: true|false}`; (d) if FAIL, emit a BlockerManifest per §7.5 (the round-trip is broken — DO NOT promote).

2. **Recovery rehearsal** — out-of-band, operator-initiated. Recommended cadence: once per benchmark window per mode. NOT auto-scheduled (it requires deliberate operator action — see §7).

### 5.4 Dashboard surfacing

A new dashboard tab — provisional name **"DB Benchmark"** — reads the `metrics/benchmark-*.jsonl` files and renders:

- Time-series chart of p50/p95/p99 for each latency metric (JSONL vs SQLite vs Dual).
- Time-series of `reconcile_pass_rate`, `drift_count`, `partial_fail_count` (sparkline + counter).
- Disk-space stacked area chart (active JSONL + archived JSONL + SQLite db + SQLite WAL).
- Current "promotion eligibility" status — a checklist of the §6 gates with PASS/FAIL/PENDING per gate.
- Days remaining in the recommended 30-day window.

The tab spec is **open** (see §8 OQ-2); this section names what it needs to surface, not how it renders.

### 5.5 State.json hooks recap

```json
{
  "modes": {
    "historyBackend": "jsonl" | "dual" | "sqlite",   // mode A | B | C per §6 of the Guide
    "benchmarkActive": true | false                  // telemetry on/off, only meaningful in mode "dual"
  }
}
```

`benchmarkActive` is ignored in modes `jsonl` and `sqlite` (no parallel-run to benchmark). The operator may set it in Mode A for baseline collection, in which case it triggers Mode A baseline telemetry (per §5.2) only.

---

## 6. Promotion decision framework — when is "data sufficient"?

The user's promotion rationale ("자료가 충분히 확보된 시점") becomes operationally meaningful only when **all** the following gates pass simultaneously. The framework distinguishes **quantitative** gates (machine-verifiable) from **qualitative** gates (operator judgment).

### 6.1 Quantitative gates

All must PASS for promotion eligibility:

1. **Correctness gates from DB-P2-Guide §6.3** (verbatim):
   - Mode B running ≥ 1 full operational cycle (this framework recommends ≥ 30 days per §3.2).
   - Last backfill completed cleanly (no partial-fail in mode-B entry post-check).
   - **N=10 consecutive count-reconcile PASSes** AT THE TIME OF PROMOTION CHECK.
   - **Zero read-path errors** during mode B for ≥ 1 operational cycle (this framework recommends the full benchmark window).
   - `exportJsonl()` round-trip verified byte-identical at least once in the benchmark window (this framework recommends the 6-hourly scheduled diff in §5.3 all PASS).

2. **Performance gates** (this framework's addition):
   - `append_latency_sqlite_ns.p99` ≤ 2× `append_latency_jsonl_ns.p99` (SQLite append is allowed to be twice as slow at p99 — beyond that, the Mode-C client experience would degrade).
   - `query_latency_sqlite_ns_by_pattern[X].p95` ≤ `query_latency_jsonl_ns_by_pattern[X].p95` for each pattern X. SQLite indexes should win on indexed paths; tying is acceptable; losing on a known indexed path is a promotion blocker (investigate the index before proceeding).
   - `count_latency_sqlite_ns.p99` ≤ `count_latency_jsonl_ns.p99` (counts are O(1) in SQLite via the events table; if not, indexing is broken).
   - `export_jsonl_full_latency_ms` ≤ operator-set threshold for the current event count (see §8 OQ-3 — provisional default: ≤ 30 s for 100,000 events, ≤ 5 min for 1,000,000 events).

3. **Operational gates** (this framework's addition):
   - `recovery_time_after_crash_ms_modeC_simulated` ≤ operator-set tolerance vs `recovery_time_after_crash_ms_modeA` (provisional default: ≤ 2× Mode A).
   - `wal_checkpoint_duration_ms.p99` ≤ operator-set tolerance (provisional default: ≤ 100 ms — tail latency from checkpoint should not be visible to clients).
   - `backup_restore_time_s_modeC` ≤ operator-set tolerance (provisional default: ≤ 2× Mode A).
   - `cold_start_time_ms` in mode C ≤ `cold_start_time_ms` in mode A (SQLite should win cold-start vs JSONL replay).

### 6.2 Qualitative gates

Subjective, but logged as part of the promotion-decision artifact (§6.3):

1. **Operator confidence**: a written statement from the operator on why they believe Mode C is the right move now. This is not pro-forma — it forces the operator to articulate the reasoning, which surfaces unstated concerns.
2. **Rollback rehearsal completed**: see §7. Mode B → Mode A rollback must have been exercised end-to-end at least once in a controlled environment, and the rehearsal logged.
3. **BlockerManifest paths exercised**: at least one of the four BlockerManifest emission paths (probe-failure / WAL corruption / partial-fail / drift) must have been exercised in a controlled environment, and the operator must have observed the manifest arrive on the dashboard within the §13.20.5 escalation tier window.

### 6.3 Promotion decision artifact

When the operator decides to promote, they write a decision artifact:

```
constellation/reference/docs/promotion-decisions/promotion-decision-<YYYY-MM-DD>.md
```

The artifact records:

- **Data window**: start ts (Mode B entry) + end ts (promotion check) + total event count processed.
- **Quantitative gate outcomes**: a checklist of every §6.1 gate with PASS/FAIL + the actual measured value vs the threshold. FAIL outcomes block promotion.
- **Qualitative gate outcomes**: the operator confidence statement (free-form, recommended ≥ 200 words covering "what data convinced you" and "what remaining risk you're accepting"); the rollback rehearsal log reference; the BlockerManifest exercise log reference.
- **Sign-off**: operator name + ts.
- **Pointer to the metrics file**: `ws-history/metrics/benchmark-*.jsonl` retained alongside the artifact for forensic review post-promotion.

The artifact lives in git history (committed to the EG repo) so the promotion decision is durably reviewable. If the promotion turns out to have been premature, the artifact tells future operators what evidence the decision was based on — which is the precondition for a useful post-mortem.

### 6.4 No quorum, no automation

Promotion is **operator-only**. The framework does NOT automate the decision even when all gates PASS — the operator must read the metrics, write the artifact, and flip `modes.historyBackend = "sqlite"` by hand. Automation here would amount to "promote when gates pass" — which is the same as "promote when the operator has not yet noticed a problem", which is exactly the failure mode this framework exists to prevent.

---

## 7. Rollback rehearsal protocol

A precondition for Mode-C promotion is that the operator has successfully rolled back from Mode B → Mode A at least once in a controlled environment. The rehearsal exercises the full `_autoRevert` path + state.json revert + BlockerManifest acknowledgment, so when (not if) a real rollback is needed in production, the path is known-working and the operator's muscle memory is current.

### 7.1 Rehearsal environment

Run the rehearsal in a **staging deployment** that mirrors production state (event count, channel count, WS connection count) within an order of magnitude. Production rehearsal is acceptable IF and only IF the operator has confirmed:

- A zero-traffic window (per §2.4 of the Guide) is achievable.
- The pre-mode-B JSONL backup (per §6.2 of the Guide) is current.
- Stakeholders have been notified.

Staging is preferred — production rehearsal is a fallback for deployments that lack a staging environment.

### 7.2 Rehearsal procedure

1. **Confirm Mode B is active** — `state.json.modes.historyBackend == "dual"`, dashboard shows Mode B, `reconcile_pass_rate == 1.0` for the last 24h.
2. **Force a partial-fail event** — inject by temporarily patching `SqliteStore.append` to throw on every Nth call, OR by capping disk and writing until ENOSPC. Observe `_recordPartialFail` increment in logs.
3. **Repeat until threshold** — drive the partial-fail counter to 3 within 10 min, triggering `_autoRevert`.
4. **Observe auto-revert** — confirm: (a) in-memory mode flipped to "jsonl"; (b) `state.json.modes.historyBackend` UNCHANGED (still "dual"); (c) BlockerManifest emitted to dashboard within §13.20.5 tier 2-explicit window; (d) subsequent appends go only to JSONL; (e) no count drift introduced.
5. **Operator-side revert** — operator edits `state.json.modes.historyBackend = "jsonl"` (confirming the auto-revert intent), restarts server. Confirm server boots clean in Mode A.
6. **Preserve forensic artifacts** — `.db` file moved to `sqlite-rollback-rehearsal-<ts>.db`; metrics file closed and archived.
7. **Log the rehearsal** — write `rollback-rehearsal-<ts>.md` next to the promotion decision artifact (§6.3). Include the trigger mechanism, observed latencies (auto_revert_latency_ms, blocker_manifest_emit_latency_ms), and operator sign-off.

### 7.3 What a failed rehearsal means

If any step fails:

- Auto-revert does not trigger at threshold → `_recordPartialFail` instrumentation is broken; promotion is BLOCKED until fixed.
- `state.json` gets mutated by auto-revert → operator intent preservation is broken (per §7.4 of the Guide); promotion BLOCKED.
- BlockerManifest does not reach dashboard → notification path is broken; promotion BLOCKED.
- Server fails to boot clean in Mode A after operator-side revert → JSONL rollback floor is broken; promotion BLOCKED.

A failed rehearsal is the framework working as designed — it caught a defect before production. Fix the defect, re-rehearse, then continue.

### 7.4 Rehearsal cadence

- **Pre-promotion**: at least once before Mode-C promotion (this is a §6.2 qualitative gate).
- **Post-promotion**: recommended every 6 months in Mode C, exercising Mode C → Mode B → Mode A rollback. The Guide §2.3 documents the Mode C rollback paths; rehearsing them keeps the muscle memory current.

---

## 8. Open questions

Items needing main upstream / operator decision before the framework is fully operational:

1. **Variance threshold for §3.3 "enough" gate** — what CV (coefficient of variation) value counts as "stable enough"? Provisional defaults: 0.15 for p50, 0.30 for p99. Tighter (e.g. 0.10 / 0.20) gives more confidence but extends the benchmark window. Operator preference + production traffic shape determine the right value. **Decision required before benchmark window starts.**

2. **Metrics emission format and dashboard tab spec** — §5.1 sketches a JSONL emission shape and §5.4 names a dashboard tab. Main upstream owns the implementation. Open questions: (a) is JSONL the right format vs Prometheus-style metrics? (b) does the dashboard tab live in `dashboard.html` or a separate page? (c) what authentication/access-control applies to the metrics file (it contains operational data — not secret, but not for public consumption)? **Decision required before §5 telemetry hooks land in `server.cjs` / `history-store.cjs`.**

3. **`export_jsonl_full_latency_ms` thresholds at scale** — provisional defaults are ≤ 30 s for 100,000 events and ≤ 5 min for 1,000,000 events, but the actual operator tolerance depends on how often `exportJsonl()` is invoked in practice (Mode C rollback frequency = very rare; scheduled diff frequency = every 6 hours per §5.3). If 6-hourly diffs at 1M events take 5 min, that's 2% of the diff cadence — acceptable. If they take 30 min, that's 8% — borderline. **Operator to set the threshold based on their event count growth projection.**

4. **Per-event vs sampled telemetry trade-off** — §5.1 recommends per-event hrtime stamps accumulated in-memory and dumped as percentiles per 1000 events. Alternative: sample every Nth event (e.g. every 10th) to reduce in-memory ring buffer size. Per-event is more accurate (no sampling bias) but uses more memory for high-traffic deployments. **Decision needed if memory pressure becomes a concern; default per-event for now.**

5. **Mode A baseline window** — §5.2 recommends a 7-day Mode A baseline before flipping to Mode B, so the operator has a JSONL-only reference distribution to compare Mode B's JSONL-side metrics against. This adds 7 days to the timeline. **Operator decision: collect the baseline (recommended for first-time Mode B entry) or skip (acceptable for re-entry after a previous Mode B → Mode A rollback, where the baseline is already known).**

---

## Cross-references

- **`DB-P2-Guide.md`**: §3 backend probe · §4 backfill · §5 count reconcile · §6 opt-in chain · §6.3 Mode-C C-checklist (the correctness gate this framework supplements) · §7 failure modes · §9 exportJsonl round-trip.
- **`DB-P2-Mode-B-Entry-Runbook.md`**: §1 pre-flight (mechanizes the §6.2 B-checklist) · §4 benchmarking activation (pointer to this framework's §5).
- **`constellation/history-store.eux`** (v1 distillation): @state lines for drift/partial-fail counters · @ports for `reconcile` cmd · @source line-ranges for instrumentation points (JsonlStore L39-215 · SqliteStore L286-469 · HistoryStoreMux L475-567).
- **`Constellation.md` §13.20** (BlockerManifest format): every BlockerManifest emission in §2.4 robustness rehearsals and §6.2 qualitative gates uses this shape.

---

## Changelog

- **v0.1 (2026-06-01)**: initial publication. Effectiveness-gate framework supplementing the correctness gates in `DB-P2-Guide.md` §5/§6.3. Authored to support the operator's stated Mode-B → Mode-C promotion rationale ("두 솔루션 병행하면서 실효성 벤치마킹을 충분히 진행한 후 자료가 충분히 확보된 시점에서 DB Only로 전환"). Pairs with `DB-P2-Mode-B-Entry-Runbook.md` (operator entry procedure, same commit).
