# Superscalar Stage 1 — Downstream Dogfooding Report (n=8)

> **From**: a downstream adopter — real-time chat-service microservices; full seed adoption including the Superscalar and Constellation modules; Burst pace mode (`issue_width` cap = 6).
> **Re**: `Superscalar.md` v0.2 Stage 1 — `§2` issue_width formula · `§3` reorder-buffer / worktree isolation · `§5` adoption thresholds · `§11` dogfood log.
> **Sample**: n = 8 retired lanes over ~3 days. Case-based ledger, measured values only (no synthetic/theoretical numbers).

This is the downstream half of the `§11` dogfood-log loop. Two actionable signals: (1) the read/write lane-class cap asymmetry (from the n=7 update), and (2) **a structural limitation of worktree isolation on nested independent repos** (new in case 8 — directly relevant to `§3`). Plus policy confirmations and an honest unexercised-surface list.

## 1. Case ledger summary

| # | Task class | Mechanism | width | OoO | spec | conflict | outcome |
|---|---|---|---|---|---|---|---|
| 1 | internal PM-doc refresh | board worker (A2A) | 2 | Y | off | none | retired |
| 2–6 | codebase context sweeps (UI / style / git-history mapping) ×5 | read-only subagent | 2 | Y | off | NA (read-only) | retired |
| 7 | seed-upgrade delta-mapping (this report's own research) | workflow: 7 readers + synthesis | **7** | Y | off | NA (read-only) | retired |
| 8 | 2 parallel UI write tasks (window title-bar context menu + dark-mode token refactor) + 1 read-only research lane | Agent tool `isolation:"worktree"` (2 write) + read-only (1) | **3** | Y | off | none (disjoint files; see §2b) | retired |

Mechanism mix: 1 board-worker, 5 read-only research subagents, 1 workflow fan-out, **1 worktree write dispatch (case 8 — first write-lane parallelism + first worktree use)**. OoO = Y on all. **Write lanes: max width = 2** (case 8's two disjoint UI tasks). **Read-only lanes: 6.** **Speculation = 0/8. Worktree-isolation: first use in case 8 — but see the §3 caveat below.**

## 2. Finding A — read/write lane-class cap asymmetry (from n=7, still actionable)

**Observation (case 7)**: a research fan-out dispatched **7 read-only reader lanes** plus a synthesis barrier — the **first dispatch to exceed the `issue_width` cap of 6**, with zero downside. Case 8 adds the first multi-lane **write** data point: 2 write lanes, disjoint files, 0 merge conflict.

The cap's binding constraints are write-lane concerns that do not apply to read-only research lanes:

| `issue_width` dimension (`§2`) | binds write lanes? | binds read-only fan-out? |
|---|---|---|
| effort band | yes | yes |
| pace_mode cap (Burst = 6) | yes | artificial here — see `R2` |
| Little's Law (review throughput ÷ task duration) | yes (retire-merge is review-gated) | **no** — read lanes retire by consumption into synthesis |
| Kanban WIP ≈ team_size + 1 | yes (WAW / merge contention) | **no** — disjoint read scopes share no mutable contract |
| autonomy_available_workers | yes | yes |

A read-only lane has no store buffer, no retire-merge ordering, no WAW hazard — disposable. The two terms that throttle write width (Little's Law, Kanban WIP) do not bind read lanes; only `effort_band` and a raw concurrency limit do.

**Proposal P1**: make the `§2` `issue_width` formula **lane-class-aware** — a read-only/analysis lane class (no irreversible effects, no retire-merge, disposable on synthesis) could carry a higher cap than the write/worktree lane class:

```
issue_width_read  = min(effort_band, runtime_concurrency_ceiling, autonomy_available_workers)
issue_width_write = min(effort_band, pace_mode_cap, Little's-Law, Kanban-WIP, autonomy_available_workers)
```

This inherits the boundary `§3` already draws for the irreversibility barrier (read/analyze default-allowed; write/deploy/send retire-gated).

## 2b. Finding B (new, case 8) — worktree isolation does not span nested independent repos

`§3` maps the Reorder Buffer to `git worktree` isolation: each write lane runs in its own worktree of the repo, the ROB's isolation boundary. Case 8 — the adopter's **first worktree write-lane dispatch** — surfaced a structural limitation: **the agent-tool worktree isolation worktrees the PARENT repo, but does not span a nested *independent* git repo inside it.**

The adopter's frontend is a separate git repository nested inside the parent project repo (not tracked by the parent — a common monorepo-adjacent shape: a parent orchestration/docs repo with a separate app repo inside). When two write lanes were dispatched with `isolation:"worktree"`, the parent-repo worktree each lane received **did not contain the nested frontend repo at all**. The lanes therefore fell back to working in the **real (shared) nested frontend repo**, each on its own *branch* — **branch isolation, not worktree isolation**. The shared working tree was cross-visible: one lane observed the other's uncommitted changes mid-flight.

**Why it didn't break here**: the two lanes touched **disjoint files**, so the separate-branch merges were clean (0 conflict). But the ROB isolation `§3` promises was **not** actually achieved — had the lanes touched the same file, the shared working tree would have produced a real WAW hazard *despite* the `isolation:"worktree"` request being honored at the parent level.

**Implication for `§3`**: the worktree-as-ROB mapping holds only when the write target lives inside the worktreed repo. For projects with **nested independent sub-repos**, Stage-1 should either (a) worktree the *nested* repo per lane (not just the parent), or (b) fall back to a file-disjointness guarantee + branch isolation (what happened here by luck). **Request R3** (below): document the limitation + mitigations, and have the harness detect nested-repo write targets and either re-worktree the nested repo or warn that isolation degraded to branch-level.

## 3. Confirmations (n=8 corroborates existing policy)

- **Latency-hiding thesis — confirmed.** All lanes hid agent-time during review-wait / independent-work windows. The real bottleneck is review throughput + independent-work availability, not model throughput.
- **MAST FM-1.3 (duplicate work) = 0.** Case 7's readers and case 8's write lanes both used disjoint scopes; no two lanes overlapped. The lane-manifest cross-check held at width 7 and at the first parallel-write dispatch.
- **In-order retire held** — declared order preserved at every synthesis/merge step; finish-order ≠ retire-order caused no inconsistency.
- **Speculation off-by-default — held (0/8).** No case met the three ask-triggers simultaneously; the speculation-discard log stayed empty.

## 4. `§5` adoption-threshold readout

All thresholds green at n=8:

| Signal | Threshold | Measured (n=8) | Status |
|---|---|---|---|
| avg merge-conflict rate | `> 15%` → `issue_width −= 2` | 0% (0/3 write-mergeable: case 1 + case 8's two lanes; read-only excluded) | OK |
| speculative accuracy (last 10) | `< 60%` → spec off | n/a (0 spec) | — |
| concurrent token cost vs in-order | `> 3×` → cap re-tune | qualitative: hidden latency > token premium; tokens spent during review-wait | OK |
| FM-1.3 detection | `≥ 1/session` → guard up | 0 | OK |

No threshold tripped. Case 7's cap-exceed was a read-only lane (conflict = NA); case 8's two write lanes merged clean.

## 5. Relation to Entry 04

Entry 04 (`§11`) measured **in-lane sub-split ROI** at a fixed width of 4 — *scope/traceability/`[estimate]→[confirmed]` > equal-scope efficiency*.

These cases remain largely **orthogonal**: Entry 04 varied depth *inside* a lane; this adopter varied **cross-lane fan-out during review-wait** (latency-hiding). Case 8 is the adopter's first *worktree write* lane, but its two lanes were independent UI tasks (not in-lane sub-split), so it still does **not** corroborate Entry 04's in-lane-overhead estimate. What case 8 adds instead is the §2b worktree-isolation caveat — a limitation Entry 04's single-arm sequential measurements would not surface (it never ran two concurrent worktree write lanes on a nested-repo target).

## 6. Unexercised surface (honest gaps)

- **worktree-isolation: now exercised once (case 8), but only at the parent-repo level** — the nested-repo target degraded it to branch isolation (§2b). A *same-repo* same-file concurrent write (the case worktree isolation is meant for) has **not** been stress-tested.
- **speculation (0/8)** — no ask-trigger met; Stage 2/3 features have zero data.
- **wide write fan-out** — write width reached 2 (case 8); the merge-conflict / Kanban-WIP terms are still lightly tested from the write side (disjoint files, no real contention yet).

**Secondary lesson (verification depth)**: in case 8, a write lane's output passed a *structural* self-verification (the new UI menu element + its 4 actions rendered in the live DOM) but carried a *behavioral* bug (two of the actions applied their effect only on widget reopen, not live) that only **user behavioral testing** caught. Lesson for lane self-verification discipline: **presence verification ≠ behavioral verification** — a lane verifying an interactive feature should be instructed to exercise the action→state-change path, not just confirm the control renders. (Adjacent to MAST FM-2.6 announce-vs-action: "implemented X" passed structurally while X's runtime effect was incomplete.)

## 7. Requests to upstream

- **R1 — lane-class cap split** (`§2`/`§5`): evaluate a read-only lane class with a higher cap (drop the Little's-Law + Kanban-WIP terms). Case 7 is the empirical anchor: width 7 read-only, zero downside.
- **R2 — policy cap vs runtime concurrency ceiling** (`§2` clarification): runtime concurrency (`min(16, cores − 2)` per workflow) is separate from the policy `issue_width` cap (6); case 7 ran 7 because the runtime permitted it while policy said 6. `§2` could name the relationship explicitly (policy cap governs retire-merged lanes; the runtime ceiling governs disposable read fan-out).
- **R3 (new) — worktree isolation on nested independent repos** (`§3`): the worktree-as-ROB mapping silently degrades to branch isolation when the write target is a nested independent git repo not tracked by the worktreed parent (§2b). `§3` could (a) document the limitation + the two mitigations (worktree the nested repo per lane / guarantee file-disjointness), and (b) suggest the harness detect nested-repo write targets and warn or re-worktree.

All three are calibration/correctness signals on the read and worktree surfaces — they do not touch the irreversibility barrier, the Andon discipline, the budget circuit-breaker, or speculation gating, all of which this adopter confirms working as specified.

---
*Privacy: per `_proposals/` default — no adopter service names, hosts, IPs, repo paths, or internal doc ids; identifiers generalized to role; concerns only `Superscalar.md` policy surface.*
