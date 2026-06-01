# Mode B Entry Baseline — 2026-06-01

Mode B (JSONL + SQLite dual-write, JSONL authoritative for reads) entry baseline.

## Decision context

| Field | Value |
|---|---|
| Mode A operating window | (operator: fill in start date) → 2026-06-01 |
| Total events processed in Mode A | (operator: fill in) |
| Mode B entry trigger | User decision 2026-06-01: "2 적용 선행" then "두 사항 순차로 메인에게 적용" — Mode B entry was chosen ahead of A2A PR system dogfooding |
| Mode B owner | Main upstream (production telemetry + dual-write operations) |
| EG-side responsibility | promotion-decisions artifact authorship; not Mode B operation |
| Reference | `DB-P2-Guide §3.1` (Mode B definition) + `DB-P2-Mode-B-Entry-Runbook` |

## Mode B entry preconditions (per Mode-B-Entry-Runbook)

Operator confirms each gate before Mode B entry. Mark each PASS/FAIL.

- [ ] `state.json.modes.historyBackend == "jsonl"` at entry-check time
- [ ] Last JSONL backup current (per Guide §6.2)
- [ ] `ws-history/` directory writable; disk has ≥ 2× current JSONL size free
- [ ] SQLite schema migration committed and tested in staging
- [ ] `_autoRevert` path tested in staging (Mode B → A rollback path live-fires within tolerance)
- [ ] Operator has reviewed `DB-P2-Benchmark-Framework §6` and understands the promotion decision framework
- [ ] BlockerManifest emission paths (probe-failure / WAL corruption / partial-fail / drift) at least one exercised in staging

## Mode B entry baseline metrics

Captured at Mode B entry time. Used as the Mode-A baseline against which Mode-C performance gates (§6.1.2) are evaluated.

> **Operator: fill in from `ws-history/metrics/benchmark-mode-a-<entry-ts>.jsonl`.**

| Metric | Mode A baseline value | Source |
|---|---|---|
| `append_latency_jsonl_ns.p50` | (operator) | benchmark-mode-a-<ts>.jsonl |
| `append_latency_jsonl_ns.p99` | (operator) | benchmark-mode-a-<ts>.jsonl |
| `query_latency_jsonl_ns_by_pattern[recent_50].p95` | (operator) | benchmark-mode-a-<ts>.jsonl |
| `query_latency_jsonl_ns_by_pattern[full_channel].p95` | (operator) | benchmark-mode-a-<ts>.jsonl |
| `count_latency_jsonl_ns.p99` | (operator) | benchmark-mode-a-<ts>.jsonl |
| `cold_start_time_ms` Mode A | (operator) | benchmark-mode-a-<ts>.jsonl |
| `recovery_time_after_crash_ms_modeA` | (operator) | benchmark-mode-a-<ts>.jsonl |
| Total events in JSONL at entry | (operator) | `wc -l ws-history/*.jsonl` |
| Active channel count | (operator) | `state.json.channels.length` |
| 7-day p95 message rate | (operator) | server metrics |

## Mode B entry sequence

Per `DB-P2-Mode-B-Entry-Runbook`:

1. [ ] Zero-traffic window confirmed (`§2.4` of Guide)
2. [ ] JSONL backup taken (filename: ____________ )
3. [ ] SQLite DB initialized (filename: `ws-history/history.db`, schema version: ____)
4. [ ] Backfill from JSONL → SQLite completed cleanly (entry post-check PASS)
5. [ ] `count-reconcile` N=1 PASS immediately post-backfill
6. [ ] `state.json.modes.historyBackend` remains `"jsonl"` (authoritative read source unchanged in Mode B)
7. [ ] Dual-write enabled (`state.json.modes.dualWriteSqlite = true` or equivalent)
8. [ ] First post-entry append observed in both JSONL and SQLite
9. [ ] `count-reconcile` N=2 PASS within 1 hour
10. [ ] Mode B operating-state ServerNotice emitted (`{kind:'mode-change', from:'A', to:'B'}`) and observed in dashboard

## Open questions for Mode B operating-cycle

> Operator: track these across the weekly snapshots; resolution feeds the §6.1 promotion gate readiness.

- OQ-1: `export_jsonl_full_latency_ms` operator-set threshold at production event count (Benchmark Framework §6.1.2 — provisional defaults are placeholders pending real measurements).
- OQ-2: `wal_checkpoint_duration_ms.p99` operator-set tolerance (provisional default 100 ms may be too tight for this deployment's checkpoint pressure).
- OQ-3: BlockerManifest emission paths to exercise in production (vs staging-only) — operator decides which paths are safe to exercise without real-incident risk.
- OQ-4: Rollback rehearsal cadence — once before promotion is the minimum; operator may choose more frequent rehearsal if confidence-building rounds are needed.

## Sign-off

- Operator name: __________
- Operator timestamp (ts of Mode B entry): __________
- EG agent attestation: this baseline was recorded by the EG agent on 2026-06-01 as the seed promotion-decisions artifact; the metric tables and gate checkboxes are intentionally left blank for the operator to fill from production telemetry.

## Next steps

1. Operator fills the baseline metrics table above from `benchmark-mode-a-<entry-ts>.jsonl`.
2. Operator runs the Mode B entry sequence and ticks each step.
3. Operator commits this artifact (with values filled) to git on Mode B entry day.
4. First `mode-b-weekly-<YYYY-MM-DD>.md` snapshot due 7 days after Mode B entry.
