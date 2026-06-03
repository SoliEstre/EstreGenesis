---
name: superscalar
description: Use BEFORE dispatching multiple sub-agents in parallel (Agent tool fan-outs, Workflow.parallel/pipeline, multi-lane Edit operations). Consult the issue_width formula to bound concurrency, apply the cost-benefit gate to decide spawn-vs-inline, honor the irreversibility barrier (write/deploy/send retire-gated), enforce in-order retire, and respect the v0.4 nested-repo worktree limitation. **v0.4.1 §3.1 Hyperbrief interlock** — for write/deploy/send lanes that pass the cost-benefit gate, also invoke `hyperbrief-trigger-check` (4-score escalation + 5 MUST-trigger); on FULL_HYPERBRIEF pause the lane and emit Constellation `DECISION_REQUEST + HyperbriefCard`, await `ack_tier='decided'`; read-only lanes are exempt by construction. Especially relevant when the work shape is "audit / cross-dimension consistency / handover-grade output" — where Entry 06's A/B measurement showed Arm B (discipline) catches the contradictions Arm A (naïve max-parallel) leaves silently unresolved.
---

# Superscalar — execution-scheduling discipline

You are about to dispatch parallel work. Before you do, run through this checklist.

## 1. issue_width formula (the concurrency cap)

Lane class matters. Read-only and write/worktree lanes have DIFFERENT caps:

```
issue_width_read  = min(effort_band, runtime_concurrency_ceiling, autonomy_available_workers)
issue_width_write = min(effort_band, pace_mode_cap, Little's-Law-review-throughput, Kanban-WIP, autonomy_available_workers)
```

- **effort_band** — Anthropic effort tier (Cautious 2-4× / Proactive 5-6× / Burst 6-8× / Sprint 9-10×)
- **pace_mode_cap** — write lanes only (Burst = 6, Sprint = unbounded modulo runtime ceiling)
- **Little's-Law** — write only (review throughput ÷ task duration; binds retire-merge)
- **Kanban-WIP** — write only (≈ team_size + 1; binds WAW/merge contention)
- **autonomy_available_workers** — both classes (Haiku-tier worker = 0 for autonomous lanes per dogfood telemetry)
- **runtime_concurrency_ceiling** — `min(16, cores - 2)` per workflow; `max parallel tool calls` per agent-tool fan-out

`effective_concurrent_lanes = min(policy_cap, runtime_ceiling)`. `issue_width_write` is a hard policy bound; `issue_width_read` is a soft preference under the runtime ceiling.

## 2. Cost-benefit gate (spawn vs inline)

Open a lane only when `estimated isolation + merge overhead < expected parallel/early-start benefit`. Inputs: worktree setup cost · task size · dependency fan-out · conflict likelihood · pace mode · downstream sensitivity. **Below threshold → run in-order in place.**

Empirical crossover (Entry 02 + 03): ~8k total work + disjoint files = inline wins. ~158k total work = spawn wins. The 30-60k band is where the gate decision flips.

## 3. Reorder buffer = worktree isolation (with v0.4 limitation)

Each OoO/speculative task runs in its own `git worktree` + branch. **v0.4 limitation**: `git worktree` worktrees the *parent* repo. If the write target is inside a **nested independent git repo** the parent does not track, the per-lane parent worktree does not contain the nested repo — lanes fall back to **branch isolation on the shared nested repo**. Same-file concurrent writes on the nested repo would produce a real WAW hazard despite `isolation: worktree` being honored at the parent level. Mitigations: (a) re-worktree the nested repo per lane, (b) guarantee file-disjointness + accept branch isolation, (c) detect nested-repo write targets and warn.

## 4. Irreversibility barrier (speculative lanes)

- ✅ Default-allowed in speculation: file read · code analysis · isolated codegen inside the worktree · sandboxed test runs.
- ❌ Default-forbidden: external API calls · shell with side effects · DB writes · deploys · deletions · sends/broadcasts. **These wait for retire.**

Speculation is opt-in, gated, Andon-bound. Default off.

## 5. In-order retire + consistency gate

Lanes finish out-of-order; the PM/main retires them **in declared order**. The retire stage runs:

1. **Dedup** — merge cross-lane duplicates into unique groups
2. **Consistency gate** — paired observations + line-grounded contradiction resolution (Entry 06: Arm B caught an algorithm contradiction Arm A left silently unresolved)
3. **Completeness critic** — union of gaps as the next-iteration backlog

**Without the retire stage, parallelism is not sufficient — naïve max-parallel produces speed at the cost of cross-lane coherence.** The wall-clock cost of the discipline (Entry 06: 2.65× Arm A) is the cost of phase serialisation, not parallel inefficiency.

## 6. Adoption thresholds (auto-tune signals)

| Signal | Threshold | Action |
|---|---|---|
| merge-conflict rate | `> 15%` | `issue_width_write -= 2` |
| speculative accuracy | `< 60%` over last 10 | spec off |
| concurrent token cost vs in-order | `> 3×` | cap re-tune |
| FM-1.3 detection | `≥ 1/session` | guard up |

## 7. Anti-patterns

- Dispatching write lanes without a manifest (FM-1.3/1.5/2.6 guards cannot fire)
- Skipping the cost-benefit gate on "small" fan-outs (the gate is unconditional)
- Treating speculation as default-on (cost-asymmetry inverts — misprediction flush is expensive)
- Speculative writes touching outward-facing or irreversible operations
- Confusing wall-clock cost with parallel inefficiency (Entry 06: cost is phase serialisation; parallelism inside each phase is identical)

---

**Reference**: full spec + dogfood ledger at https://github.com/SoliEstre/EstreGenesis/blob/main/Superscalar.md (v0.4 = §11 Entry 01-06).
