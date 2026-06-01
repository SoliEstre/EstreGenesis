# Superscalar Stage 1 — Downstream Dogfooding Report (n=7)

> **From**: a downstream adopter — real-time chat-service microservices; full seed adoption including the Superscalar and Constellation modules; Burst pace mode (`issue_width` cap = 6).
> **Re**: `Superscalar.md` v0.2 Stage 1 — `§2` issue_width formula · `§5` adoption thresholds · `§11` dogfood log.
> **Sample**: n = 7 retired lanes over ~3 days. Case-based ledger, measured values only (no synthetic/theoretical numbers).

This is the downstream half of the `§11` dogfood-log loop. The adopter has accumulated 7 real Stage-1 lane dispatches and reports the telemetry that feeds the `§5` adoption thresholds and the `§2` issue_width calibration. One actionable signal, several confirmations, and an honest unexercised-surface list.

## 1. Case ledger summary

| # | Task class | Mechanism | width | OoO | spec | conflict | outcome |
|---|---|---|---|---|---|---|---|
| 1 | internal PM-doc refresh | board worker (A2A) | 2 | Y | off | none | retired |
| 2–6 | codebase context sweeps (UI / style / git-history mapping) ×5 | read-only subagent | 2 | Y | off | NA (read-only) | retired |
| 7 | seed-upgrade delta-mapping (this report's own research) | workflow: 7 readers + synthesis | **7** | Y | off | NA (read-only) | retired |

Mechanism mix: 1 board-worker (A2A relay), 5 read-only research subagents, 1 workflow fan-out. OoO = Y on all (ready-first dispatch). **Write lanes: max width = 1** (scope-isolated single file). **Read-only lanes: 6.** **Speculation = 0/7. Worktree-isolation direct use = 0/7.**

## 2. Headline finding — read/write lane-class cap asymmetry (actionable)

**Observation (case 7)**: a research fan-out dispatched **7 read-only reader lanes** (each mapping a disjoint slice of the work) plus a synthesis barrier — the **first dispatch to exceed the `issue_width` cap of 6**, and it had **zero downside**.

**Why exceeding the cap was harmless for this lane class**: the cap's binding constraints are all *write-lane* concerns that do not apply to read-only research lanes:

| `issue_width` dimension (`§2`) | binds write lanes? | binds read-only fan-out? |
|---|---|---|
| effort band | yes | yes (large/complex task → band ≥ 10) |
| pace_mode cap (Burst = 6) | yes | artificial here — see `R2` |
| Little's Law (review throughput ÷ task duration) | yes (retire-merge is review-gated) | **no** — read lanes retire by *consumption into synthesis*, not by review-gated merge |
| Kanban WIP ≈ team_size + 1 | yes (WAW / merge contention) | **no** — disjoint read scopes share no mutable contract; conflict = NA |
| autonomy_available_workers | yes | yes (all 7 were native auto workers) |

A read-only lane has **no store buffer, no retire-merge ordering, no WAW hazard** — it is disposable (output consumed by the synthesis barrier, never merged into a shared surface). The two terms that actually throttle write width (Little's Law, Kanban WIP) **do not bind**; the only real ceilings are `effort_band` and a raw concurrency limit.

**Proposal P1**: make the `§2` `issue_width` formula **lane-class-aware**. The current single cap is implicitly write-lane-shaped. A read-only / analysis lane class (no irreversible effects, no retire-merge, disposable on synthesis) could carry a **higher cap** than the write / worktree lane class — e.g.

```
issue_width_read  = min(effort_band, runtime_concurrency_ceiling, autonomy_available_workers)
issue_width_write = min(effort_band, pace_mode_cap, Little's-Law, Kanban-WIP, autonomy_available_workers)
```

dropping the Little's-Law and Kanban-WIP terms (which only model retire-merge contention) for read lanes. This inherits the same boundary `§3` already draws for the irreversibility barrier (read/analyze = default-allowed; write/deploy/send = retire-gated).

## 3. Confirmations (n=7 corroborates existing policy)

- **Latency-hiding thesis — confirmed.** All 7 lanes hid agent-time during review-wait or independent-work windows. Write-lane width never exceeded 1; the real bottleneck is review throughput + independent-work availability, not model throughput. The agent-time-vs-human-time premise is the dominant value driver in practice, not raw parallelism.
- **Speculation off-by-default — held (0/7).** No case simultaneously met the three ask-triggers (high-confidence likely branch + low downstream sensitivity + meaningful latency saving). The conservative default cost nothing; the speculation-discard log stayed empty, as designed.
- **MAST FM-1.3 (duplicate work) = 0.** Case 7's 7 readers used area-disjoint manifests; no two lanes overlapped. The lane-manifest cross-check (`§3`–`§4` / MAST guard) was effective even at width 7. FM-1.5 / FM-2.6 not triggered.
- **In-order retire held** — declared order preserved at the synthesis/merge step in all multi-lane cases; finish-order ≠ retire-order caused no inconsistency.

## 4. `§5` adoption-threshold readout

All thresholds green at n=7:

| Signal | Threshold | Measured (n=7) | Status |
|---|---|---|---|
| avg merge-conflict rate | `> 15%` → `issue_width −= 2` | 0% (0/1 write-mergeable; read-only = NA) | OK |
| speculative accuracy (last 10) | `< 60%` → spec off | n/a (0 spec) | — |
| concurrent token cost vs in-order | `> 3×` → cap re-tune | qualitative: hidden latency > token premium; case 7 spent its fan-out tokens entirely during review-wait | OK |
| FM-1.3 detection | `≥ 1/session` → guard up | 0 | OK |

No threshold tripped; no auto-adjustment fired. Case 7's cap-exceed was a read-only lane (conflict = NA), so it does not count against the merge-conflict signal.

## 5. Relation to Entry 04 (and what this does *not* cover)

Entry 04 (`§11`, downstream full-stack A/B) measured **in-lane sub-split ROI** at a fixed width of 4 — finding *scope / traceability / `[estimate]→[confirmed]` > equal-scope efficiency*, with +127% wall-clock flagged as a sequential-single-dashboard artifact.

These 7 cases are **orthogonal**:
- Entry 04 varied **depth inside a lane**. This report varies **cross-lane fan-out during review-wait** (latency-hiding).
- This adopter has **0 worktree-isolation and 0 speculation cases**, so it **cannot corroborate** Entry 04's ROI separation or its in-lane-overhead estimate.
- What it adds that Entry 04 did not surface: the **read/write cap asymmetry** — Entry 04 held width at 4 (below cap) and never probed the read-only-fan-out-above-cap regime.

Complementary inputs to `§5`; neither subsumes the other.

## 6. Unexercised surface (honest gaps)

Not yet exercised by this adopter:
- **worktree-isolation lanes (0/7)** — mechanisms used were board-worker A2A, read-only subagents, and workflow fan-out. The ROB-isolation boundary (`§3`) has no telemetry yet; first same-file write-conflict pressure would trigger it.
- **speculation (0/7)** — no ask-trigger met; Stage 2/3 features (register renaming, memory disambiguation, value prediction) have zero data.
- **wide *write* fan-out** — write width never exceeded 1, so the merge-conflict / Kanban-WIP terms are untested from the write side.

Implication: the conservative Stage-1 defaults are strongly validated (cost nothing, prevented nothing useful), but provide **no signal** for advancing to Stage 2/3 — consistent with the "trigger after the speculation-discard log accumulates 30+ entries" gate.

## 7. Requests to upstream

- **R1 — lane-class cap split** (`§2`/`§5`): evaluate a read-only lane class with a higher cap (drop the Little's-Law + Kanban-WIP terms, which model retire-merge contention read lanes lack). Case 7 is the empirical anchor: width 7 read-only, zero downside, cap 6 the only nominal "no".
- **R2 — policy cap vs runtime concurrency ceiling** (clarification): in a workflow-based fan-out, actual concurrency is bounded by the runtime (`min(16, cores − 2)` per workflow), separate from the policy `issue_width` cap (6). Case 7 ran 7 because the runtime permitted it while policy said 6. Is the policy `issue_width` intended to bind read-only fan-out at all, or is it a write/worktree-lane governor with the runtime ceiling governing read fan-out? Today the two diverge silently; `§2` could name the relationship explicitly.

Both requests are **read-side calibration** only — they do not touch the irreversibility barrier, the Andon discipline, the budget circuit-breaker, or speculation gating, all of which this adopter confirms working as specified.

---
*Privacy: per `_proposals/` default — no adopter service names, hosts, IPs, repo paths, or internal doc ids; identifiers generalized to role; concerns only `Superscalar.md` policy surface.*
