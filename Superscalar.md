<!-- module: Superscalar; layer: execution-scheduling; part-of: EstreGenesis 2.x (draft); status: design-draft; date: 2026-05-28; depends-on: none (optional synergy: Constellation); license: Apache-2.0 -->

# Superscalar — Aggressive Sub-Agent Execution Scheduling (design draft)

> **EstreGenesis optional module — design draft.** Where the base seed runs tasks **in declared order**, Superscalar borrows processor-architecture techniques to drive an agent's **own sub-agents** more aggressively: issue several independent tasks at once (*superscalar*), run ready tasks regardless of declared order (*out-of-order / OoO*), and — opt-in — start the likely branch of a gate *before* it resolves (*speculation / branch prediction*). The payoff is **latency hiding**: the real bottleneck in agent work is human review/approval time, not token throughput — so doing useful independent work during that wait shortens wall-clock time. (This is the natural apex of v1.6.0's *agent-time vs human-time* split.)
>
> **It costs tokens.** OoO reordering is cheap and safe; speculation trades tokens (and possibly discarded work) for latency. So speculation is **off by default**, asked per-use with its trade-off shown, and scoped/toggleable.
>
> **Independent module.** Unlike Constellation (a heavy live-board runtime: WS server + dashboard + resident processes), Superscalar rides the agent's **native sub-agent mechanism** (e.g. the Task tool) — low overhead, no server. Constellation is **not required**; if it happens to be running it can optionally visualize the scoreboard. Adopt Superscalar when a project has enough independent parallel work to repay the orchestration overhead.
>
> _Plain-language note: "superscalar / out-of-order / speculation" are CPU terms; each section restates them plainly so any agent — not just ones that know the metaphor — can execute it._

---

## 1. Concept mapping

| Processor | Superscalar (agent) | Note |
|---|---|---|
| Superscalar issue (many instr/cycle) | dispatch several sub-agents at once | issue width = max concurrent sub-agents |
| Out-of-order execution | run tasks whose deps are met, ignoring declared order | needs a dependency graph (DAG) |
| Reorder buffer (ROB) | each task in its own **git worktree/branch**; result held until retire | isolation = architectural-state safety |
| In-order retire/commit | PM (main) reviews + merges results **in declared order** | user-visible order preserved |
| Hazard detection (RAW/WAR/WAW) | dependency + file-conflict analysis before dispatch/merge | misjudged deps → broken merge |
| Branch prediction | predict a gating decision (approval/test/A·B) and start the likely path early | **speculation — opt-in** |
| Misprediction flush | discard the worktree/branch | flush cost = tokens already spent |
| Speculative store buffer | speculative writes stay in the isolated worktree, never `main` | the irreversibility barrier |

## 2. Core — out-of-order scheduling (the safe, default-eligible part)

- **Dependency DAG, not declared order.** Read the WORKLIST as a graph: an edge = "B needs A's output / touches A's files." Dispatch any task whose predecessors are done; declared order is only a tie-breaker.
- **Issue width = concurrent sub-agents**, tied to the v1.6.0 pace mode (Cautious → narrow, Sprint → wide), capped by a token budget.
- **In-order retire.** Even when tasks finish out of order, the PM **merges them in declared order**, so user-visible history and dependent steps stay coherent (precise, in-order retirement).
- **Hazard check before dispatch.** If two ready tasks touch the same files/contracts (WAW/WAR), serialize or fence them — do not parallel-dispatch.
- **No prediction here** — every dispatched task is one the plan already calls for. This part is reversible and safe enough to enable broadly (still cost-gated, §3).

## 3. Reorder buffer = worktree isolation + cost-benefit gate

- **Each OoO/speculative task runs in its own `git worktree` + branch** (same repo, shared `.git` — far cheaper than a full clone). That worktree is the task's private architectural state = its ROB entry.
- **Retire = PM review + merge, in order.** The main/PM agent verifies the branch (deps resolved · tests · no hazard) and merges. A merge conflict is a hazard the PM resolves — exactly WAW/WAR resolution.
- **Cost-benefit gate (the go/no-go, evaluated each time):** open an isolated lane only when *estimated isolation + merge overhead < expected parallel / early-start benefit*. Inputs: worktree setup cost, task size, dependency fan-out, conflict likelihood, pace mode. Below threshold → just run in-order in place. (Agent analog of "don't bother speculating a cheap, almost-certain branch.")
- **Irreversibility barrier:** read / analyze / isolated codegen may run in a lane; anything **outward-facing or irreversible** (external API, push, deploy, deletion, sending messages) must **not** run speculatively — it waits for retire (the commit point). Mirrors the store-buffer rule.

## 4. Speculation (opt-in, gated)

- **What it is:** starting the *likely* branch of a not-yet-resolved gate (user approval, review verdict, a test outcome, an A/B choice) before it resolves, so the result is ready the instant the gate clears.
- **Off by default.** When the agent spots a high-value speculation it **asks the user**, showing the trade-off: predicted branch + confidence · latency saved if right · token/discard cost if wrong. The user supplies the confidence (acting as the branch predictor). No automatic history-based predictor in v1 (possible later, fed by `.agent/_lessons/`).
- **Toggle + scope.** Global on/off, plus scope limits ("speculate on read/analysis only" · "never on code that will be committed" · "only within this task"). Switchable mid-project.
- **Always transparent + isolated.** A speculative lane is announced ("predicting X → prepping in a branch; discarded if wrong") and lives in its own worktree. Misprediction = discard the branch (pipeline flush); the user never silently receives unrequested merged work.

## 5. Options & toggles (bootstrap / migration)

- Bootstrap/Migration adds an **execution-scheduling** choice: `in-order` (default, safe) | `superscalar` (OoO core); under superscalar, `speculation: off (default) | ask | scoped`.
- **Pace-mode link (v1.6.0):** issue width + speculation appetite scale with Cautious → Sprint.
- **Token budget cap:** a ceiling on concurrent lanes + speculative spend so misprediction can't run away.
- Recorded in `AGENTS.md` core rules alongside language / tone / pace.

## 6. Optional Constellation synergy

Superscalar needs no server. But if Constellation is already running, the live board can double as the **scoreboard / ROB view** — lanes as channels, retires as merge events, speculative lanes flagged. Purely optional visualization; the scheduler logic is identical without it.

## 7. Anti-patterns

- Speculating on irreversible / outward effects (barrier violation).
- Wide issue without hazard analysis → corrupted merges.
- Silent speculation (no announce) → "why did you do unrequested work" + trust loss.
- Speculating on low-confidence or cheap-to-wait gates → pure token waste (failed cost-benefit).
- Out-of-order *retire* (merging out of declared order) → incoherent history / broken deps.

## 8. Relationship to the seed

- **Base seed** = in-order execution (default).
- **Superscalar** = optional aggressive scheduler over the agent's native sub-agents; independent of Constellation; an evolution of §Task Decomposition Strategy (v1.3.5).
- Depth follows the seed tier as usual; lighter tiers reference only the §2 core + this file.
