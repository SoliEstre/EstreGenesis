<!-- module: Superscalar; layer: execution-scheduling; part-of: EstreGenesis 2.5.0 (seed-integrated); status: Stage 1 dogfood baseline (§11 Entry 01-05) + autonomy-aware (v2.2.4 telemetry-integrated) + lane-class-aware (v0.3 read/write cap split); seed-integration: v2.3.0 (2026-05-29) — Master #13 / Lite #10 / Compact #15; date: 2026-06-01; version: v0.3.0; depends-on: none (optional synergy: Constellation); license: Apache-2.0 -->

# Superscalar — Aggressive Sub-Agent Execution Scheduling (design draft v0.3)

> **EstreGenesis optional module — design draft v0.2 (deep-research integrated).** Where the base seed runs tasks **in declared order**, Superscalar borrows processor-architecture techniques to drive an agent's **own sub-agents** more aggressively: issue several independent tasks at once (*superscalar*), run ready tasks regardless of declared order (*out-of-order / OoO*), and — opt-in — start the likely branch of a gate *before* it resolves (*speculation / branch prediction*). The payoff is **latency hiding**: the real bottleneck in agent work is human review/approval time, not token throughput — so doing useful independent work during that wait shortens wall-clock time. (Natural apex of v1.6.0's *agent-time vs human-time* split.)
>
> **What v0.2 adds.** A 3-axis deep-research review (processor architecture / agent harness / work communication & management) validated the 1st scope (OoO baseline + gated speculation) as aligned with computer-architecture canon (Smith-Pleszkun 1988 ROB, Tomasulo 1967) and industry-verified patterns (Claude Code worktree isolation, Anthropic multi-agent ≈90.2% lift). This draft folds in the Stage-1 hardening — `issue_width` formula, read-only speculation scope, Toyota Andon transparency, deterministic budgets, MAST failure-mode anti-patterns — and stages future-work hooks (Stage 2/3 — register renaming, memory disambiguation, value prediction). See §9 for foundations and references.
>
> **Costs tokens.** OoO reordering is cheap and safe; speculation trades tokens (and possibly discarded work) for latency. Speculation is **off by default**, asked per use with its trade-off + downstream-sensitivity shown, and scoped/toggleable.
>
> **Independent module.** Unlike Constellation (a heavy live-board runtime), Superscalar rides the agent's **native sub-agent mechanism** (e.g. the Task tool + `git worktree` — Claude Code's `isolation: worktree` is the direct industrial analog) — low overhead, no server. Constellation is **not required**; if present it can optionally visualize the scoreboard and may empirically aid detection of MAST FM-1.3/2.6 cases (§7).
>
> _Plain-language note: "superscalar / out-of-order / speculation" are CPU terms; each section restates them plainly so any agent — not just ones that know the metaphor — can execute it._

---

## 1. Concept mapping

| Processor | Superscalar (agent) | Stage | Notes |
|---|---|---|---|
| Superscalar issue (many instr/cycle) | dispatch several sub-agents at once | 1 | `issue_width` formula, §2 |
| Out-of-order execution | run tasks whose deps are met, ignoring declared order | 1 | needs a dependency graph (DAG) |
| Reorder buffer (ROB) | each task in its own **git worktree/branch**; result held until retire | 1 | isolation = architectural-state safety |
| In-order retire/commit | PM (main) reviews + merges results **in declared order** | 1 | user-visible order preserved |
| Hazard detection (RAW/WAR/WAW) | dependency + file-conflict analysis before dispatch/merge | 1 | misjudged deps → broken merge |
| Branch prediction | predict a gating decision (approval/test/A·B) and start the likely path early | 1 | **speculation — opt-in, gated** |
| Misprediction flush | discard the worktree/branch | 1 | flush cost = tokens already spent |
| Speculative store buffer | speculative writes stay in the isolated worktree, never `main` | 1 | the irreversibility barrier |
| **Register renaming** (Tomasulo) | same-file conflicts run in parallel via *alias branches* (`.alt-N` suffix), PM merges | 2 | removes WAR/WAW *without* serialization |
| **Memory disambiguation** | dispatch on path-guess; verify at retire (rollback if guess was wrong) | 2 | low-priority lanes that resolve to no-conflict become free wins |
| **Value prediction** | predict the gating outcome from `.agent/_lessons/` history (later) | 3 | v1 uses user-supplied confidence |

Stages: **1** = this draft / immediate ship · **2** = post-v0.2 patch · **3** = experimental.

---

## 2. Core — out-of-order scheduling (Stage 1, default-eligible)

- **Dependency DAG, not declared order.** Read the WORKLIST as a graph: an edge = "B needs A's output / touches A's files." Dispatch any task whose predecessors are done; declared order is only a tie-breaker.
- **`issue_width` is a lane-class-aware dynamic cap.** Two lane classes carry distinct caps because their hazard surfaces differ:

  ```
  issue_width_write = min(
    Anthropic effort band(task complexity),     // simple lookup → 1 agent · comparison → 2-4 · complex research → 10+
    pace_mode cap,                              // Cautious 2 · Proactive 4 · Burst 6 · Sprint 8
    Little's Law: PM_review_throughput / avg_task_duration,
    Kanban WIP ≈ (team_size + 1),
    autonomy_available_workers                  // workers with autonomous-mode active (see §4 worker autonomy precheck)
  )

  issue_width_read = min(
    Anthropic effort band(task complexity),
    runtime_concurrency_ceiling,                // physical bound (e.g. workflow min(16, cores - 2)); see "policy cap vs runtime ceiling" below
    autonomy_available_workers
  )
  ```

  **Why the split.** The two terms dropped from `issue_width_read` — Little's Law (review throughput) and Kanban WIP — model **retire-merge contention** that read-only lanes structurally don't have: no store buffer, no retire-merge ordering, no WAW hazard, and the lane's output is disposable on synthesis (consumed by the synthesis barrier, never merged into a shared mutable surface). Read-only / analysis lanes (subagent context sweeps, workflow read fan-outs, telemetry reads) carry **no irreversible side effects** — they inherit the same boundary §3 already draws for the irreversibility barrier (read / analyze = default-allowed; write / deploy / send = retire-gated). The pace_mode cap is also dropped from the read class because pace_mode is a *retire-side throughput* governor (PM review tempo), not a read-side fan-out governor.

  **What still binds on write lanes.** The binding constraint on write lanes is rarely raw model capacity — it's usually **PM review throughput** (Little's Law makes that explicit), Kanban WIP (prevents WIP blow-up under WAW / merge contention), the Anthropic effort band (keeps simple tasks from over-dispatching), and pace_mode (v1.6.0 — user-chosen ceiling). The `autonomy_available_workers` dimension excludes workers that lack autonomous-mode on both classes (every A2A send / tool call becomes a user-synchronous permission prompt, which collapses Little's Law throughput regardless of nominal worker count).

### Policy cap vs runtime concurrency ceiling

The `issue_width_*` caps above are **policy bounds**. A separate **runtime concurrency ceiling** is the physical bound the underlying mechanism enforces — e.g. a workflow fan-out is bounded by `min(16, cores − 2)` per workflow; an agent-tool fan-out is bounded by the harness's max parallel tool calls. The two govern different surfaces and **do not subsume each other**:

```
effective_concurrent_read_lanes  = min(issue_width_read,  runtime_concurrency_ceiling)
effective_concurrent_write_lanes = min(issue_width_write, runtime_concurrency_ceiling)
```

**Which dominates depends on the mechanism.** For workflow-based read fan-outs, the runtime ceiling typically dominates (the policy cap is conservative and frequently above the runtime cap, so the runtime cap is the binding term). For agent-tool-based fan-outs, the policy cap typically dominates (the harness's parallel-tool ceiling is usually high enough that policy bites first).

**Hard vs soft.** `issue_width_write` is a **hard policy bound** — exceeding it is a policy violation regardless of runtime headroom (retire-merge contention scales with concurrent writes, and Little's Law caps it from the demand side). `issue_width_read` is a **soft preference** subject to the runtime ceiling above it: a read-only fan-out that exceeds `issue_width_read` but stays under `runtime_concurrency_ceiling` is **not** a policy violation (no retire-merge hazard, disposable on synthesis) — it is at most a calibration signal that the policy cap may be set conservatively for read fan-outs in this environment. Dogfood data point: an `issue_width_read = 6` policy cap was exceeded at width 7 in a workflow fan-out (case 7 in §11 Entry 05) with zero downside; the runtime ceiling (≥ 7 per the workflow's own cap) was the actual governor, and policy did not need to intervene.

The §5 adoption thresholds use this distinction: the `merge-conflict rate > 15%` gate binds `issue_width_write` only.

- **Autonomous dispatch** (the §4 watch-state autonomous principle, applied at dispatch-time): once a lane's predecessors are done and its task is part of the *declared* plan (`Phase` ordering, `planned` queue, in-order retire, blocked clearance), the scheduler dispatches it **without asking**. Confirming a planned dispatch is itself a Little's Law throughput leak (every confirmation is a user-synchronous gate) and is the same violation that Constellation.md §4 names at retire-time. Gates apply *only* at decision points: a new major branch (RRP / design), a push / deploy / external publish, or explicit user steering — never at the start of an already-decided `Phase`.

  **Operational note** — Little's Law inputs use a **rolling window** (e.g. last 7 retires), never the instantaneous value (PM throughput swings with time-of-day, fatigue, task complexity). **Cold start** (no measurement data yet) — drop the Little's Law input entirely and rely on the other three until enough history accumulates.
- **In-order retire.** Even when tasks finish out of order, the PM **merges them in declared order**, so user-visible history and dependent steps stay coherent (precise, in-order retirement).
- **Hazard check before dispatch.** If two ready tasks touch the same files/contracts (WAW/WAR), serialize or fence (Stage 1) — or use *alias branches* (Stage 2, see §1) to parallelize without serialization.
- **No prediction here** — every dispatched task is one the plan already calls for. This part is reversible and safe enough to enable broadly (still cost-gated, §3).

---

## 3. Reorder buffer = worktree isolation + cost-benefit gate + budget circuit breaker

- **Each OoO/speculative task runs in its own `git worktree` + branch** (same repo, shared `.git` — far cheaper than full clone; Claude Code's `isolation: worktree` is the direct industrial analog). That worktree is the task's private architectural state = its ROB entry.
- **Retire = PM review + merge, in order.** The main/PM agent verifies the branch (deps resolved · tests · no hazard) and merges. A merge conflict is a hazard the PM resolves — exactly WAW/WAR resolution.
- **Cost-benefit gate (per lane spin-up):** open an isolated lane only when *estimated isolation + merge overhead < expected parallel / early-start benefit*. Inputs: worktree setup cost, task size, dependency fan-out, conflict likelihood, pace mode, **downstream sensitivity** (§4). Below threshold → run in-order in place.
- **Irreversibility barrier — speculative side-effects are LLM-specific worse than CPU.** Read / analyze / isolated codegen may run in a lane. **Speculative write-side tools require explicit allowlist** — by default *outward-facing or irreversible* operations are **forbidden** in speculative lanes:
  - ✅ default-allowed in speculation: file read, code analysis, isolated codegen inside the worktree, sandboxed test runs.
  - ❌ default-forbidden: external API calls, shell commands with side effects, DB writes, deploys, deletions, sends/broadcasts. (These wait for retire.)
  - The "store buffer" auto-isolates everything in a CPU; in an LLM this barrier is *manual* — keep the allowlist tight and auditable.
- **Deterministic budgets (circuit breaker).** Do NOT ask the LLM to estimate its own cost — MAST FM-1.5 *"Unaware of termination conditions"* is one of the most common failure modes (~12% of traces). The harness enforces hard caps:
  - per OoO lane: `max ≤ 50k tokens` (configurable)
  - per speculative lane: `max ≤ 30k tokens` (tighter — wasted on misprediction)
  - total concurrent lanes: `max ≤ 200k tokens` aggregated
  - exceeded → automatic `abort` of that lane; the user is notified via the harness's notification channel — **Constellation board chip flips red + notification** when Constellation is present, otherwise **stderr / log / non-zero exit code**. (Anthropic production operators report the same conclusion: cost-circuit-breakers are mandatory because misbehavior compounds geometrically. Empirical baselines: ~4× chat-to-agent, ~15× multi-agent — the caps above are intentionally conservative and may be tightened *or* loosened with operational data.)
- **Lane manifest (prerequisite for §7 MAST guards).** Every lane (OoO or speculative) registers with the harness on dispatch:

  ```
  { lane_id,
    intent,                  // declared action (one-line natural-language)
    gate_dependency,         // which gate's outcome this lane assumes (speculative only)
    planned_commit_subject,  // for FM-1.3 duplicate-work cross-check vs sibling lanes
    sibling_lanes }          // other active lanes for cross-check / SIGTERM targeting
  ```

  The harness uses this manifest to enforce §7's FM-1.3 / FM-1.5 / FM-2.6 guards (duplicate-work cross-check, gate-resolve SIGTERM to dependent speculative lanes, announce-vs-action audit). **Without the manifest, those guards cannot fire** — treat manifest registration as part of lane dispatch, not optional metadata.

---

## 4. Speculation (Stage 1 — opt-in, gated, Andon-bound)

- **What it is.** Starting the *likely* branch of a not-yet-resolved gate (user approval, review verdict, a test outcome, an A/B choice) before it resolves, so the result is ready the instant the gate clears.
- **Off by default.** When the agent spots a high-value speculation, it **asks the user** with the trade-off shown:
  - predicted branch + agent's confidence
  - latency saved if right
  - token / discard cost if wrong
  - **downstream sensitivity** — *if wrong, how much of the speculative work has to be redone?* (low = read/summarize, high = interface design or contract change). Low-sensitivity work is the natural speculation target; high-sensitivity work usually waits.

  The user supplies the confidence (acting as the branch predictor); no automatic history-based predictor in v1 (Stage 3, fed by `.agent/_lessons/`).
- **Two-stage announce** (Spectre lesson — *micro-architectural* side effects in CPUs become *cognitive* side effects in LLM/user space; even discarded work leaves an anchor):
  1. *"considering X"* — no work started; just shown on the board / told to user.
  2. After user `ack` → *"executing X (speculative lane <name>)"* — only then does the lane spawn.
- **Default scope = read-only tools.** Per §3, speculation may not touch outward / irreversible side effects. Even on opt-in, the safe default scope is *read · analyze · isolated codegen · sandboxed tests* — explicit toggle required to widen.
- **Toggle + scope.** Global on/off, plus scope limits ("speculate on read/analysis only" · "never on code that will be committed" · "only within this task"). Switchable mid-project.
- **Andon 3-element transparency** (Toyota Production System / Jidoka) — **enforced by the harness** (not the lane itself — a misbehaving lane cannot opt out), mandatory for every speculative lane:
  1. **Visual signal** — board chip colored distinctly (amber = speculative, green = retired, grey = planned, red = aborted). Speculation MUST be visible. **Runtime process liveness is part of this visibility** — a watcher / scheduler / coordinator process dying silently (e.g. via a nested `run_in_background` spawn losing its child on parent exit) while lane chips still show green is the same silent-disable pattern at the runtime layer (real incident, 2026-05-29: an upstream main's watcher died this way after a push and ~30 min of inbound traffic went silently missed despite every surface signal — server, standby, HTTP — looking healthy). Surface tooling should expose process liveness alongside lane state (Stage 2/3 boost — adds a runtime-chip dimension to the existing lane chips). **Worker autonomy precheck** — before counting a worker as a dispatchable lane (i.e. before counting it in `autonomy_available_workers` of the §2 `issue_width` formula), verify the worker has autonomous mode active and protocol compliance (no per-action permission prompt; proper §13.9 `AgentHello` on join; self-state tracking accurate). A worker without autonomous mode is a *user-synchronous node*, not a parallel lane — every A2A send / tool call becomes a permission gate at the user, which is the same Little's Law collapse the autonomous-dispatch §2 rule prevents. Empirical: an upstream main observed Haiku-tier workers fail this precheck (auto-mode unavailable + permission per A2A + protocol non-compliance) and treated them as non-dispatchable on critical paths; Opus + Sonnet workers passed. Surface tooling should show worker autonomy state alongside the lane chip — a non-autonomous worker should render as a *manual* node (distinct from a planned lane), not silently count toward `issue_width`.
  2. **Pull-the-cord (`/stop-spec`)** — single user command discards all speculative lanes immediately. Honor latency = the next instruction; never silently continue after a stop.
  3. **Root-cause logging** — on misprediction (lane discarded), the harness appends a structured entry to **`.agent/_lessons/spec-discard/`** (a separate sub-directory so speculation history doesn't mix with general troubleshooting): branch predicted · branch actual · sensitivity · cost in tokens · cause · **`detection-source`** — `human-visual` (caught live on the board) vs `post-hoc-analysis` (caught only by retrospective log review). Feeds the §6 measurement signal and Stage-3 value prediction.
- **Misprediction = isolated flush.** Discard the worktree/branch (the user never silently receives unrequested merged work). Spending is bounded by §3's circuit breakers; trust impact is bounded by Andon (no surprises).
- **Constellation §13.11 board-emission link.** When Constellation is the scoreboard, Andon Visual signal composes with Constellation `§13.11.1` (mandatory progress emission at safe points — the observer reconstructs lane flow without reading agent-hidden state) and `§13.11.2` (no autonomous heartbeat during idle — false-alive on the board; real incident: `codex-watch.cjs` removed). Visual signal here IS §13.11.1 in practice — silent lane chips after a worker dies is exactly the failure §13.11.2 names. A2A reliability (`§13.13` ack layer — `msgId` + server-auto `Ack{delivered}` board-hidden + optional `AckProcessed` WILCO + Ping/Pong as application liveness probe, **not retransmit**; Two Generals termination on persistent silence) composes orthogonally — ack layer is silent by design and won't fill emission gaps; the two §s cover complementary failure modes.

---

## 5. Options, toggles, and adoption thresholds

- Bootstrap / migration adds an **execution-scheduling** choice: `in-order` (default, safe) | `superscalar` (OoO core); under superscalar, `speculation: off (default) | ask | scoped`.
- **Pace-mode link (v1.6.0):** issue-width band + speculation appetite scale with Cautious → Sprint (one input to the §2 formula, not the sole one).
- **Token-budget caps** — see §3. Treat as hard ceilings, not soft hints.
- Recorded in `AGENTS.md` core rules alongside language / tone / pace.

**Adoption thresholds — switch behavior dynamically when these fire.** The threshold values are unchanged from prior versions; what is new is which **lane class** each one binds (see §2 for the read/write split):

| Signal | Threshold | Action | Binds |
|---|---|---|---|
| Average merge-conflict rate | `> 15%` | `issue_width_write -= 2` (until rate recovers); investigate hazard mis-detection | **write only** (read-only lanes have no merge surface; conflict = NA) |
| Speculative accuracy (lane retired vs discarded) | `< 60%` on last 10 speculations (rolling) | recommend `speculation: off` for next use; prompt user to recalibrate confidence input | symmetric (both classes — speculation is a separate axis from lane class) |
| Concurrent-mode token cost vs equivalent in-order | `> 3×` (vs Anthropic baselines of ~4× chat→agent, ~15× multi-agent — be conservative) | re-evaluate cost-benefit gate inputs; tighten budget circuit breakers (§3) | symmetric |
| MAST FM-1.3 step-repetition detections | `≥ 1 per session` | strengthen duplicate-work guard (§7); reduce `issue_width` on the affected class | symmetric (apply the reduction to the lane class where the duplicate-work was observed) |

The merge-conflict gate's narrowing to `issue_width_write` reflects the §2 hazard analysis: Little's Law and Kanban WIP terms only bind retire-merge contention, which read-only lanes structurally don't have. A cap-exceeding read-only fan-out (e.g. case 7 in §11 Entry 05 — width 7 read-only at policy cap 6, zero downside) **does not** count against the merge-conflict signal. The other three signals apply symmetrically because they govern cross-cutting concerns (speculation accuracy / token cost / duplicate-work) rather than retire-merge contention specifically.

---

## 6. Optional Constellation synergy

Superscalar needs no server. But if Constellation is already running, the live board can double as the **scoreboard / ROB view** — lanes as channels, retires as merge events, speculative lanes flagged amber per Andon (§4). Beyond visualization, the board may *empirically* improve MAST FM-1.3 / FM-2.6 detection (duplicate work · announce-vs-action mismatch) because cross-lane progress is human-visible.

**Measurement procedure** — every `.agent/_lessons/spec-discard/` entry (§4) records a `detection-source` field: `human-visual` (caught live by the user / PM scanning the board) vs `post-hoc-analysis` (caught only by retrospective log review). The per-session ratio of `human-visual` detections is the empirical signal for whether the board (when on) is doing the catching. Track over time; if the ratio stays high with Constellation on and drops sharply when off, the hypothesis is supported. Purely optional; the scheduler logic is identical without the board.

---

## 7. Anti-patterns

Built on the original five plus targeted MAST coverage (multi-agent system failure taxonomy, Cemri et al. NeurIPS 2025):

- Speculating on irreversible / outward effects (barrier violation, §3).
- Wide issue without hazard analysis → corrupted merges.
- Silent speculation (no announce) → "why did you do unrequested work" + trust loss; Andon (§4) is the structural fix.
- Speculating on low-confidence / cheap-to-wait / high-sensitivity gates → pure token waste (failed cost-benefit).
- Out-of-order *retire* (merging out of declared order) → incoherent history / broken deps.
- **Duplicate-work across lanes (MAST FM-1.3, ~13%).** Two lanes redo the same task because the DAG missed an edge. Guard: each lane's planned-commit subject is cross-checked against sibling lanes' before dispatch; conflict → abort one lane.
- **Speculative-lane termination ignorance (MAST FM-1.5, ~12%).** A speculative lane keeps running after its gate has resolved (the branch is dead). Guard: the gate's resolver sends `SIGTERM` to dependent speculative lanes immediately; the harness enforces, not the lane.
- **Announce-vs-action mismatch (MAST FM-2.6, ~13%).** A lane announced "predicting X" but actually does Y. Guard: on every tool call, check the lane's running annotation against its declared intent; mismatch → abort + log.
- **Shared mutable contract → fence-only.** Common interfaces / shared function signatures / common type files cannot be parallel-issued — must be design-frozen or formally arbitrated before parallel work (concurrent-engineering "design-freeze milestone"). This is the WAW hazard at the architectural level.

---

## 8. Relationship to the seed

- **Base seed** = in-order execution (default).
- **Superscalar** = optional aggressive scheduler over the agent's native sub-agents; independent of Constellation; an evolution of §Task Decomposition Strategy (v1.3.5).
- Depth follows the seed tier as usual; lighter tiers reference only the §2 core + this file.

---

## 9. Foundations & references

This design was validated against three bodies of work via a 3-axis deep-research review (2026-05-28).

**Processor architecture (the canon):**
- Smith, J. E. & Pleszkun, A. R. (1988). *Implementing Precise Interrupts in Pipelined Processors.* — ROB origin; the in-order-retire pattern of §3 is its direct analog.
- Tomasulo, R. M. (1967). *An Efficient Algorithm for Exploiting Multiple Arithmetic Units.* IBM System/360 Model 91 — register renaming (Stage-2 alias-branch pattern, §1).
- Mutlu, O. et al. (2003). *Runahead Execution.* HPCA, Test-of-Time award — analog of running a no-side-effect "read-ahead" lane during a stall.
- Kocher, P. et al. (2018). *Spectre Attacks: Exploiting Speculative Execution.* — origin of §4's two-stage announce mitigation (micro-architectural / cognitive side effects survive rollback).
- Hennessy, J. & Patterson, D. *Computer Architecture: A Quantitative Approach.* — general reference.

**Agent orchestration (industry):**
- Anthropic (2025). *How we built our multi-agent research system.* — ~90.2% lift, ~15× tokens, effort-scaling rule (§2), production cost-circuit-breaker pattern (§3).
- Claude Code docs — *Run parallel sessions with worktrees*, `isolation: worktree` — the direct industrial analog of §3.
- Cemri, M. et al. (2025). *Why Do Multi-Agent LLM Systems Fail? (MAST).* NeurIPS 2025 Datasets & Benchmarks Track Spotlight, arXiv:2503.13657 — 14 failure modes; §7 anti-patterns cover FM-1.3 / FM-1.5 / FM-2.6 explicitly.
- Leviathan et al. (ICML 2023, arXiv:2211.17192), Hua et al. (ICLR 2025, arXiv:2410.00079), Dynamic Speculative Planning (arXiv:2509.01920), Microsoft PASTE (arXiv:2603.18897) — speculative decoding / planning literature; this module is the agent-task analog.

**Work communication & management (organizational science):**
- Goldratt, E. (1997). *Critical Chain Project Management.* — feeding chain (OoO, §2) and buffer concept (§3 budgets).
- Toyota Production System — Jidoka / Andon — §4's three-element transparency is Andon adopted verbatim.
- Bogus / Molenaar / Diekmann, ASCE *Journal of Construction Engineering and Management* (2005–2013) — fast-tracking sensitivity model (§4 downstream-sensitivity term).
- Atlassian / Planview Kanban WIP limits, Little's Law, *team size + 1* — §2 formula.
- Edmondson (Harvard Business School) — psychological safety; CCL / SHRM trust research — why silent speculation costs trust asymmetrically (§4 Andon rationale).

---

## 10. Future work (Stages 2 & 3)

**Stage 2 — post-v0.2 patch:**
- *Register renaming* (alias-branch pattern, §1): same-file conflicts run parallel via `.alt-N` branches, PM merges with conflict resolution. Removes WAR/WAW serialization.
- *Memory disambiguation*: speculative dispatch on path-guess, verify at retire; cheap no-conflict cases become free wins.
- *Per-lane checkpoint*: explicit tag-commits before merges so rollback is `git reset` in ≤ 1 second.
- *Sensitivity-aware speculation UI*: show projected downstream rework alongside confidence (§4).

**Stage 3 — experimental:**
- *Value prediction*: feed `.agent/_lessons/spec-discard/` (the §4 misprediction log) into a confidence-estimation model so the agent can pre-suggest speculation worth doing. Andon (§4) still applies — predictor *recommends*, user still acks.

(The optional Constellation visualization mentioned in §6 — including its measurement procedure — also rides on the §4 logging infrastructure once Stage 3 ships, but the *scoreboard* itself is available at Stage 1 already.)

---

## 11. Dogfood log (Stage 1 baselines)

The first real-world Stage 1 application is recorded here as the seed of empirical data for Stage 2/3 tuning. Each entry is one issue-window worth of measurements.

### Entry 01 — 2026-05-29 · Constellation Phase C reference generalization

- **Scope**: upstream live-board main generalized 4 runtime files (`server.cjs` · `local-bridge.cjs` · `watchdog.cjs` · `self-wake-watcher.sh`) into `constellation/reference/runtime/` for Constellation v2.2.2.
- **Dispatch**: 3 sub-agent lanes (L1 = local-bridge + self-wake-watcher · L2 = watchdog · L3 = server), main as supervisor + ROB.
- **`issue_width`** = 3 (binding constraint: Kanban floor `team_size + 1`).
- **Speculation**: off (Phase C scope was already-decided work — no branch to predict).
- **Retire order**: in-order C2 → C3 → C4 over declared sequence; single batch review at the end.
- **MAST guards**: FM-1.3 / FM-1.5 / FM-2.6 all trivially satisfied — each lane owned a disjoint file set with no shared mutable contract (natural WAW avoidance from the file-scope split).
- **Token budgets** (per §3): L1 62k · L2 38k · L3 58k. The 50k per-lane cap was narrowly exceeded twice (L1 by 24%, L3 by 16%); aggregated 158k stayed comfortably under the 200k total cap.
  - *Calibration note*: the cap may need to widen to ~65k for codegen-heavy lanes; flag for re-tuning once a few more entries accumulate.
- **Andon §4**: visual signal applied (lane chips orange → green at retire). No spec-discard entries (speculation off).
- **Wall-clock**: ≈ 8 min total (≈ 6 min lanes in parallel + ≈ 2 min supervisor spot-check). Theoretical serial baseline ≈ 3 × 6 min = 18 min → roughly 2.25× wall-clock compression (sub-linear because retire is single-threaded).
- **Outcome**: clean commit `7fee20e` (`v2.2.2`); no rework; NOTES §1 disclaimer added as a single follow-up to handle grep-pattern meta-mentions (caught at supervisor spot-check, not lane work).

This first entry validates the §2 / §3 / §7 design at issue_width=3 with no speculation; it gives no signal yet on §4 speculation behavior or the §5 `< 60% accuracy` threshold (no speculative lanes were dispatched). Stage 2 / 3 work should aim to start collecting that signal.

### Entry 02 — 2026-05-29 · upstream live-board Report 2 fixes (cost-benefit gate selects *inline*)

- **Scope**: 3-Finding patches (Constellation.md §2 AgentHello wire-shape literal · `self-wake-watcher.eux` cursor unit + self-heal · `reference/dashboard/app.js` A2A classifier).
- **Cost-benefit gate (§3) evaluation**: 3 candidate lanes — each Edit was on a *disjoint* file (P3a / P3b / P3c, MAST FM-1.3/1.5/2.6 trivially satisfied by file split). Estimated lane sizes: P3a ~3k · P3b ~3k · P3c ~2k = total ≈ 8k. Estimated lane-spawn + manifest + retire overhead ≈ 2-3k each = ≈ 6-9k. → **Spawn overhead ≈ parallel benefit**; per §3 ("only spin up an isolated lane when isolation+merge overhead < expected parallel/early-start benefit"), the gate selected **`issue_width = 1` (inline in-order)** despite the disjoint-file pre-condition.
- **Dispatch**: inline in P3a → P3c → P3b order (no DAG edge between them — declared order was arbitrary).
- **Speculation**: off (all three Findings were already-decided fixes with verified upstream shim code).
- **Wall-clock**: ≈ 5 min inline (P1 fetch ~30s · P2 review 1m · P3 three Edits ~3m · P4 relay ~30s). Theoretical 3-lane parallel: ≈ 4-5 min after the overhead. **Gate decision was correct** — parallel would have saved < 1 min net.
- **Tokens** (approximate, per-phase): P1 fetch ~3k · P2 Read artifacts ~6k · P3 Edits ~6k · P4 relay ~2k → ≈ 17k total, **comfortably under** the §3 single-lane cap (50k) and aggregated cap (200k).
- **MAST guards**: FM-1.3 / FM-1.5 / FM-2.6 — N/A (single lane); the disjoint-file property held *as a property of the work*, not of the dispatch.
- **Andon §4**: visual signal applied in reporting (lane chip language used — amber on start, green on retire); no `/stop-spec` events; no `.agent/_lessons/spec-discard/` entries (speculation off).
- **Outcome**: clean v2.2.3 push (commit alongside this Entry 02 record).
- **Calibration signal — first data point for inline-vs-spawn boundary**: at ≈ 8k total work and disjoint files, the gate selects inline. The boundary likely lies somewhere between **Entry 01** (~158k total → spawn obviously wins) and **Entry 02** (~8k total → inline obviously wins). Stage 2 work could target a controlled-size experiment around the 30–60k band to find the empirical crossover.

### Entry 03 — 2026-05-29 · v2.2.4 patch (Report 2 follow-up: server-stamped truth + leniency-WARN + role hint clarification + runtime liveness extension)

- **Scope**: 4-file disjoint patches — `constellation/server.eux` (sourceStampFallback + targetFallback + new derive `source_stamp_truth`) · `constellation/local-bridge.eux` (AgentHello recognition broadened + WARN) · `Constellation.md` §2 (role-field hint vs truth clarification) · `Superscalar.md` §4 (runtime process liveness added to Visual signal element).
- **Cost-benefit gate (§3)**: 4 candidate lanes (disjoint file MAST guarantee). Estimated lane sizes: server.eux ~4k · local-bridge.eux ~2k · Constellation.md ~1k · Superscalar.md ~2k = total ≈ 9k. Estimated spawn overhead ≈ 2-3k × 4 = ≈ 8-12k. **Inline still wins** (same shape as Entry 02; the lane count rose from 3→4 but the per-lane size stayed small, so the gate decision did not flip). `issue_width = 1` (inline in-order).
- **Speculation**: off (main's opinions were direct prescriptions, no branch).
- **Tokens** (approximate): P1 fetch = 0 (main's relay was the source) · P2 Read anchor regions (server.eux/local-bridge.eux) ~3k · P3 five Edits ~6k · P4 relay ~2k → ≈ 11k total.
- **Wall-clock**: ≈ 4 min inline.
- **MAST**: N/A single-lane; disjoint-file property held as a property of the work.
- **Andon §4**: visual signal applied in reporting; no `/stop-spec` events; spec-discard log unchanged.
- **Outcome**: clean v2.2.4 push.
- **Calibration confirmation**: Entry 02 → Entry 03 confirms the inline gate is stable across 3 vs 4 disjoint-lane scope at small per-lane size. Empirical crossover for *spawn-wins* likely still in the 30-60k band hypothesized at Entry 02; will need a Stage 2 controlled experiment to pin down.

### Entry 04 — 2026-05-30 · downstream full-stack distillation A/B re-run (controlled measurement)

- **Scope**: a downstream adopter's payment-stack `.eux` distillation A/B re-run on the same 4 components. The 1st-pass full-stack experiment had been measurement-invalidated by external interruptions (rate-limit / account-switch / `_proposals/003` flap / IDE restart); the upstream main directly dispatched worker subagents for a controlled re-run. arm A (naive parallel, 4 lanes one-component-each) vs arm B (Superscalar discipline, 4 lanes that *further sub-decompose inside the lane* into 15 `.eux` files).
- **`issue_width`**: 4 both arms. Superscalar's discipline here operates *inside* each lane (sub-split + self-QA tree under the lane), not via cross-lane width.
- **Speculation**: off (already-decided component scope, both arms).
- **Measurements**:
  - Tokens — arm A 433,951 · arm B 549,730 → **+26.7%**.
  - Wall-clock — arm A 229.7s · arm B 521.1s → **+126.8%**. ⚠️ **Measurement caveat (load-bearing)**: this is *sequential* arm-execution on a single dashboard, NOT concurrent-lane time. It measures the in-lane sub-split + self-QA *serial* overhead of the discipline, not its headline benefit (parallel-lane latency hiding). Reading +127% as "Superscalar is 2× slower" is the misread the caveat exists to prevent. A truly concurrent measurement needs a different harness (concurrent dashboards per arm — a §13.16-class operational point in `Constellation.md`).
  - Files / lines — arm A 4 / 385L · arm B 15 / 1319L → 3.75× files, 3.4× lines (the sub-split is *visible* on disk as well as inside the lane).
- **Quality jury**: LLM subagent, 5-axis (format / fidelity / coverage / discovery / decomposition). Both arms scored equivalent on the same 4 components. ⚠️ **Caveat on LLM-as-judge**: the drift-check RRP (2026-05-29) measured LLM-as-judge inter-annotator agreement at κ ≈ 0.1-0.2 and ruled it unfit as a gating measurement. This Entry weights the **source-line spot-check (13/13 match against actual source)** as primary objective evidence; the 5-axis score is *supporting*, not load-bearing. Methodologically, this is `§7` anti-pattern avoidance — the score is published but its weight is bounded.
- **Hallucination**: 0 both arms. The §4 Andon hallucination-cost concern is bounded when both lanes operate under source-grounded distillation discipline; the cost being measured here is *time and tokens*, not *quality drift*.
- **Discovery payoff — Superscalar's actual gain**: arm B's *expanded coverage* (3.75× files) surfaced **3 new real bugs in the expansion territory** that arm A did not reach — a multi-hour confirmation timeout in a financial-process flow (operationally severe: orphaned authorizations) · a phone-number-suffix authentication-bypass at a fixed-digit match (operationally severe: auth bypass) · a hardcoded test deep-link in a release-channel binary (operationally severe: test-environment leakage to production). Each is a class-defining operational severity, not a cosmetic find. The token surplus (+117k) bought *coverage*, and the coverage caught bugs naive single-pass would not.
- **MAST guards**: FM-1.3 / FM-1.5 / FM-2.6 — disjoint file scope per lane in both arms (no shared mutable contract). arm B's in-lane sub-split was tree-structured (parent → children) so no WAW. N/A on cross-lane re-entry (single-arm-at-a-time measurement).
- **Andon §4**: visual signal applied (both arms reported lane status); no `/stop-spec` events; spec-discard log unchanged (speculation off).
- **Outcome — ROI separation** (the headline calibration signal):
  - **Token ROI = positive**: +27% tokens bought ~3× scope expansion + 3 operationally-severe real bugs in the expansion territory. Token-per-marginal-bug favorable.
  - **Time ROI = weak (in this measurement environment)**: +127% wall-clock is 4.7× the token-increase rate, but mostly *expansion-driven* (B made 3.75× more output). Held to *equal scope*, the in-lane overhead alone is ~+15-20% (jury estimate, weighted per the LLM-as-judge caveat above).
  - **Therefore**: Superscalar's value is **scope · traceability · `[estimate] → [confirmed]` confidence**, not equal-scope efficiency. *"Broad, handover-grade distillation"* → Superscalar discipline justified. *"Fast core extraction"* → naive arm A sufficient (core security / consistency findings caught at −27% tokens, −56% time, with one bug-class A actually caught more sharply than B). The §5 adoption-thresholds table gains its first quantified anchor here.
- **Calibration signal — both arms surface their characteristic gain**: a clean first dogfood entry where the *trade-off itself* is the result. A's tighter precision on its own scope (one race-condition bug caught more sharply than B) and B's broader coverage + new bugs are both real; the choice is workload-dependent, not arm-dominant. Stage 2's adoption-threshold tuning has its first calibrated reference point.

### Entry 05 — 2026-06-01 · downstream adopter Stage 1 dogfooding (n=7) — read/write lane-class cap asymmetry

- **Source**: downstream adopter — real-time chat-service microservices; full seed adoption incl. the Superscalar and Constellation modules; Burst pace mode (`issue_width` cap = 6); n = 7 retired lanes over ~3 days; case-based ledger, measured values only.
- **Case mix**: 1 board-worker A2A (PM-doc refresh, width 2) · 5 read-only research subagents (codebase context sweeps, width 2 each) · 1 workflow fan-out (seed-upgrade delta-mapping = 7 reader lanes + synthesis barrier — exceeded policy cap 6, zero downside). Speculation = 0/7 · worktree-isolation direct use = 0/7 · OoO = Y on all (ready-first dispatch). Write lanes: max width = 1 (scope-isolated single file); read-only lanes: 6.
- **`§2` confirmations**:
  - **Latency-hiding thesis — confirmed.** All 7 lanes hid agent-time during review-wait or independent-work windows. Write-lane width never exceeded 1; the real bottleneck is review throughput + independent-work availability, not model throughput.
  - **Speculation off-by-default — held (0/7).** No case simultaneously met the three ask-triggers (high-confidence likely branch + low downstream sensitivity + meaningful latency saving). The conservative default cost nothing.
  - **MAST FM-1.3 (duplicate work) = 0.** Case 7's 7 readers used area-disjoint manifests; no two lanes overlapped. The lane-manifest cross-check (§3 / §4 / §7 MAST guards) was effective even at width 7. FM-1.5 / FM-2.6 not triggered.
  - **In-order retire held.** Declared order preserved at the synthesis/merge step in all multi-lane cases.
- **`§5` adoption-threshold readout — all green at n=7**:

  | Signal | Threshold | Measured (n=7) | Status |
  |---|---|---|---|
  | avg merge-conflict rate | `> 15%` → `issue_width_write -= 2` | 0% (0/1 write-mergeable; read-only = NA) | OK |
  | speculative accuracy (last 10) | `< 60%` → spec off | n/a (0 spec) | — |
  | concurrent token cost vs in-order | `> 3×` → cap re-tune | qualitative: hidden latency > token premium; case 7 spent fan-out tokens entirely during review-wait | OK |
  | FM-1.3 detection | `≥ 1/session` → guard up | 0 | OK |

  No threshold tripped; no auto-adjustment fired. Case 7's cap-exceed was a read-only lane (conflict = NA), so it does not count against the merge-conflict signal — empirical confirmation of the §5 lane-class differentiation.
- **Unexercised surface**: worktree-isolation 0/7 (mechanisms used were board-worker A2A, read-only subagents, workflow fan-out — the ROB-isolation boundary §3 has no telemetry from this entry) · speculation 0/7 (Stage 2/3 features have zero data from this entry) · wide *write* fan-out = 0 (write width never exceeded 1, so the merge-conflict / Kanban-WIP terms are untested from the write side in this entry). Implication: the conservative Stage-1 defaults are strongly validated (cost nothing, prevented nothing useful), but this entry alone provides no signal for advancing to Stage 2/3 — consistent with the "speculation-discard log accumulates 30+ entries" gate.
- **Relation to Entry 04**: complementary, not redundant. Entry 04 varied **in-lane depth** at fixed width 4 (below cap); Entry 05 varies **cross-lane fan-out during review-wait** (latency-hiding) and probes the read-only-fan-out-above-cap regime Entry 04 did not reach. Neither subsumes the other; both feed §5.
- **Outcome — P1 + R1 + R2 reflected upstream**:
  - **P1 — lane-class cap asymmetry (actionable)**: case 7's width-7 read-only fan-out with zero downside is the empirical anchor for the §2 read/write split adopted at v0.3.0.
  - **R1 — `§2`/`§5` lane-class cap split**: adopted in §2 (`issue_width_read` drops Little's Law + Kanban-WIP terms — they only model retire-merge contention) and §5 (merge-conflict gate binds `issue_width_write` only).
  - **R2 — policy cap vs runtime concurrency ceiling relationship**: clarified in §2's new "Policy cap vs runtime concurrency ceiling" sub-section. `issue_width_write` is a hard policy bound; `issue_width_read` is a soft preference subject to the runtime ceiling above it. Effective concurrent lanes = `min(policy_cap, runtime_ceiling)`; which dominates is mechanism-dependent (workflow fan-out → runtime dominates; agent-tool fan-out → policy dominates).
- **Cross-reference**: `_proposals/005_2026-06-01_superscalar-dogfooding-stage1/` — full bundle (EN + KO twin + README).
- **Calibration signal**: first dogfood entry to probe the read-lane class above policy cap; resolves a previously-silent divergence between the single-cap formula and runtime ceilings on read-only fan-outs. Stage 2 work on the write side (worktree-isolation + wide-write merge-conflict) remains unaddressed by this entry — the Entry 01-04 baselines retain primacy on those surfaces.
