---
name: subscaler
description: "Tiered model composition — pick the right model tier AND effort per lane instead of running every lane on the main model. Invoke as /subscaler on|off|status, or consult before any Workflow / parallel fan-out to route each lane to a tier. Four tiers (T1 frontier-reasoning → T4 resident-observer), routing by task shape, per-harness binding keys and vendor-exact effort values in plugins/superscalar/model-registry.json (dated, replaceable). Default OFF; recommended ON for fan-outs. Spec: Superscalar.md §5.1."
---

# /subscaler — tiered model composition

`/superscalar` decides **how eagerly** to fan out. This skill decides **what each lane runs on** — tier *and* effort. The two are orthogonal; set them independently.

The mechanism that makes a tier drop safe is **spec completion before offload**: a fully-specified lane loses little from one tier down, an underspecified one loses a lot. Spec completeness is the quality moderator, not model size.

## Toggle contract

- State = **one marker file**: `.agent/subscaler.json` — `{"on": true, "family": "<vendor>", "effort": "<level>"}`. Read at invocation time; never mirror the state into other settings surfaces (duplicated per-role model bindings have shipped state-convergence bugs).
- `/subscaler on` writes it · `/subscaler off` removes it (or sets `"on": false`) · `/subscaler status` reads it back and reports where it would apply next.
- **Default OFF.** ON is recommended where fan-out has *already* forfeited the shared prompt cache. A delegated subagent starts cache-cold on its own model, so a small, cache-hot, deep-context edit loses money on delegation.

## Step 1 — read the registry, don't recall it

`plugins/superscalar/model-registry.json` is the source of truth for anything perishable: which models occupy which tier, their exact `apiModelId`, context windows, prices, **the vendor's exact effort values**, per-plan availability, and per-harness binding keys. Read it before binding a lane.

Never bind a model id from memory. Model ladders move monthly; the registry carries `asOf`, a `confirmedBy` URL per row, and a `caveats` list of what stayed unverified. If the model you want isn't in `models[]`, it isn't confirmed — check `caveats[]` before using it.

**If `revisit.date` has passed**, say so in the turn and treat every price/availability claim as provisional. Re-research is scheduled work (the registry's `revisit.watchlist` names what to check), not something to improvise mid-task.

## Step 2 — route each lane by its work shape

| Lane shape | Tier | Effort |
|---|---|---|
| Architecture · design decisions · ambiguous requirements | **T1** frontier-reasoning | vendor default; step up only on observed failure |
| Adversarial verification / red-team | **T1**, deliberately a **different family** than the author | raised |
| Spec-complete implementation | **T2** agentic-execution | default, dropping a rung once evals hold |
| Mechanical multi-file edit / migration | **T2** (T3 if each file is independently verifiable) | low–medium |
| Test authoring | **T2** | medium; raise when tests must infer intent |
| Long-context review | **T2** on a large-window model | medium — window and price bind, not depth |
| Read-only exploration / search | **T3** bulk-worker | low |
| Summarization / extraction | **T3** (T4 if the output schema is fixed) | low, or none/minimal where offered |
| Resident board / inbox watching | **T4** resident-observer | minimal/none |

**Retain on the main model** regardless of tier availability: architecture decisions · ambiguous-requirement interpretation · cross-cutting design · complex debugging · final review · deep shared-context coding (vendor guidance is explicit that shared-context coding fits multi-agent decomposition poorly).

Every delegated lane carries **explicit acceptance criteria + a test gate** written by the orchestrator before dispatch. The §2 cost-benefit gate runs FIRST (spawn at all?); this skill only picks the tier of lanes that pass it. The §3.1 Hyperbrief interlock for write/deploy/send lanes is unchanged.

## Step 3 — check availability before you bind

Tier ≠ entitlement. The registry's `planGating` records what each subscription actually exposes, and the gaps bite exactly where fan-out does:

- A frontier model can be *selectable* while its large-context variant needs credits — a wide fan-out on it can silently become a billing event.
- Team/Business seats often do **not** inherit the higher-multiplier headroom of the equivalent personal Pro tier; assuming the paid-team plan buys concurrency is a common planning error.
- Some harnesses' model pickers lag their own vendor API — a picker default can be a model the API has already shut down. Pin explicitly.
- Org policy can cap maximum effort per model per role, and in JSON/stream output or background agents **the clamp can apply silently** — a scripted lane may run below the effort you requested with no signal.

If the tier you want is unavailable, degrade **down a tier at the same effort** rather than sideways to an unverified model.

## Step 4 — bind per lane, using the harness's own keys

Exact keys per harness live in the registry's `harnessBinding` (Claude Code · Codex CLI · Cursor · Gemini CLI · Kimi Code · router layers). Two rules are spec-level, not data-level:

1. **Prefer per-invocation binding over any global env pin.** A pin can override even explicit per-lane choices, and a value excluded by org allowlist can fall back to the inherited model *silently*. Verify actual application when it matters.
2. **Bind effort together with the model.** Effort level names are not comparable across models — vendors state this outright — so a stored global effort number applied to whatever model is active is a meaningless number.

## Step 5 — effort, three load-bearing rules

- **Default first; escalate on evidence, not on principle.** Raise effort when you observed the model skip a file, skip the tests, or not double-check — not because the task feels important. Vendors document the top rung as prone to overthinking with diminishing returns: blanket-max is a documented anti-pattern, not merely expensive.
- **Step DOWN the ladder before stepping ACROSS tiers.** A generation bump usually means the new model's cheap rung beats the old model's expensive rung. Check that before downgrading tier.
- **Effort is a caching decision too.** Changing it mid-conversation invalidates the prompt cache (per model *and* per level). Pick one level at session start and vary effort *across* workloads, not within a cache-dependent session. Note also that low effort changes *tool behavior* — fewer, more combined tool calls — which in a search lane saves more than the token delta suggests.

## Off-signals (turn it back OFF / leave it off)

- Single-file or deep-context work where the main's prompt cache is hot.
- Lanes needing repeated orchestrator↔executor negotiation (round-trip overhead eats the saving).
- Latency-sensitive interactive work.
- Executor output shows style/convention drift the review pass keeps correcting — the correction cost is the signal.

## After every toggle: re-declare

If this workspace is joined to a Constellation board, the toggle is not finished until the board knows: emit an updated `OpsState` carrying `subscaler {on, ...}` alongside the measured model (Constellation §13.23.4 — change-triggered, latest-wins). Toggle + announce are one unit of work. (EG-ops helper: `node scripts/emit-ops-state.cjs`.) Not board-joined → skip.

## Composition

- Superscalar §5.1 — normative spec (tier vocabulary, routing rubric, registry contract, evidence base).
- `/superscalar` §5.2 — dispatch aggressiveness (orthogonal axis: how *many* lanes, not what they run on).
- Superscalar §2 cost-benefit gate · §3 budgets · §3.1 Hyperbrief interlock — all upstream of this toggle.
- Constellation §13.23.4 declaration events · §13.27.4 tier routing for resident unattended loops (separate jurisdiction, cross-linked).
