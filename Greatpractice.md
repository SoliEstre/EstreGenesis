<!-- module: Greatpractice; layer: practice-codification; part-of: EstreGenesis 2.6.x (planned); version: v0.3.2; date: 2026-06-16; status: design draft v0.3.2 (P0b normative-foundations backfill — §B.5/§B.6 placeholders expanded with adversarially-verified primary sources + two v0.1 over-claims corrected [distributed-cognition coupling criteria are necessary-not-sufficient per cognitive-bloat; institutional isomorphism-inhibits-innovation + ≤20% mandatory cap → empirically contingent, no numeric threshold]; §B.7 marks P0b complete; prior v0.3.1 = micro tier first decomposition — 9 mezzo → 20 atoms, command-check-decision 3-tuple + INDEX micro section; prior v0.3.0 = §7.7 retire axis added — active/probation/retired 3-state + _schema status/retire_reason + INDEX Retired count; north-star deprecation-first-class GP implementation; prior v0.2.1 = ship-surface coherence patch — corrected §11.1's design-time goal-tree 'ship' description into the actual ship list + moved surplus to §11.2 deferred; prior v0.2.0 = mezzo batch ratification cut — the 8 mezzo decomposition candidates in release-cadence.md (macro) §2.3 were all ratified at once via Workflow wk5a6jh5k parallel fan-out: n-way-sync-registry / package-files-validate / bin-entry-validate / link-integrity-check / dry-run-smoke-test / pre-publish-user-gate / naming-hygiene-grep / auth-2fa-discipline. 5-axis maturation sum distribution: 24/24/22/21/19/19/19/17. 8 entries × ~230 lines = ~1850 lines added. Expanded from the v0.1.0 (2026-06-04) structure of 1 macro + 1 mezzo (outbox-json-validation) to 1 macro + 9 mezzo — first batch demonstration of the children decomposition pattern. micro decomposition + lifecycle hook implementation is a v0.3+ follow-up); depends-on: none (optional synergy: Hyperbrief §1 escalation-aware codification handoff; Constellation §13 A2A hook channel for blameless second-story propagation; Superscalar §3 promotion fan-out for parallel retro-backfill); license: Apache-2.0 -->

# Greatpractice — Memory-Triggered Practice Codification with Lazy Hierarchy + Deterministic Hooks (design draft v0.3.2)

> **EstreGenesis optional module — design draft v0.3.2.** If Constellation handles *inter-agent communication*, Superscalar handles *dispatch within an agent*, and Hyperbrief handles *decision delegation to the user*, then Greatpractice handles the fourth axis — **a system that uses memory-based triggers to automatically detect the commitments, procedures, and habits that are easily lapsed during work, and promotes them into practices.** Memory (`memory/feedback_*.md` or an equivalent surface) is the input signal (trigger), a multi-criteria maturation gate handles validation, and a promoted practice is automatically enforced by lifecycle hooks. Greatpractice is neither a *document format* nor a *rule catalog*. It is an operating system that fuses three backbones: a **lazy 3-tier hierarchy** (macro/mezzo/micro — loaded only at the point of need) + a **deterministic lifecycle hook** (7-event enforcement that does not depend on model judgment) + a **multi-criteria maturation gate** (5-axis weighted score + 3-criterion notability + phronesis boundary). A 9-axis cross-domain deep-research effort (harness · humanities · psychology · management · processor · os · sre · memoization · canonical) derived *isomorphic consensus* across 8/9 · 7/9 · 5/9 axes for each of the three backbones, avoiding dependence on a single-domain authority (see Appendix A · B).
>
> **Cost-honest framing.** Greatpractice is not free. The deterministic hook consumes a latency budget (humanities §1.7 Gawande 60-90s ceiling) at every lifecycle event, the frontmatter schema's 9/9 universal convergence adds per-entry token overhead, and the multi-criteria maturation gate deliberately slows the ship rate from a memory signal to practice promotion. What you trade this cost for is — *zero-recurrence enforcement of lapses* (the necessary work is not dropped, with no need for the model to *remember* it every time), *durable retention of the working set* (phase transitions are possible without re-derivation cost), and an *explicit boundary between the codifiable domain and the phronesis-only domain* (in-spec absorption of the *do-not-codify* domain from Aristotle Nicomachean Ethics VI + Polanyi tacit knowing).
>
> **Optional.** In one-shot task operation / phronesis-dense work / a soloist 1-person 1-cycle / an environment where external mandated discipline dominates, the ROI of adopting Greatpractice turns negative (§10.2). Adoption is recommended only from the point where the three conditions are simultaneously met: operating cycles ≥ 5 + the same memory pattern accumulated ≥ 3 times + codify-target surfaces ≥ 11 (§10.1).
>
> **Self-sufficient.** This file is the SSoT. Every spec an adopter needs to build a Greatpractice-conformant operating system is in this document. The v0.1.0 reference implementation in `plugins/greatpractice/` is a runtime adapter for the Claude Code harness — other harnesses can adopt this spec directly.
>
> _Terminology note_: "entry" (a node in the tree), "tier" (the macro/mezzo/micro layer), "ratified" (the state finally promoted from raw memory → draft → final), "raw memory" (a one-off signal captured immediately into memory — the input to a practice trigger), and "Greatpractice" (the module name, capitalized in prose · lowercase in paths) are used consistently within this document.

---

## Table of Contents

- [§1. Concept — What Greatpractice Is](#1-concept--what-greatpractice-is)
- [§2. Tier Hierarchy — macro / mezzo / micro](#2-tier-hierarchy--macro--mezzo--micro)
- [§3. Entry Schema — frontmatter as governance SSoT](#3-entry-schema--frontmatter-as-governance-ssot)
- [§4. Hook Mechanism — deterministic enforcement](#4-hook-mechanism--deterministic-enforcement)
- [§5. Maturation Gate — raw → draft → ratified](#5-maturation-gate--raw--draft--ratified)
- [§6. Voice & Framing — blameless second-story](#6-voice--framing--blameless-second-story)
- [§7. Freshness & Lifecycle Cadence](#7-freshness--lifecycle-cadence)
- [§8. SSoT Propagation — `surfaces[]` inversion](#8-ssot-propagation--surfaces-inversion)
- [§9. Interactions — Constellation / Superscalar / Hyperbrief](#9-interactions--constellation--superscalar--hyperbrief)
- [§10. Adoption Thresholds](#10-adoption-thresholds)
- [§11. v0.1.0 Cut Scope](#11-v010-cut-scope)
- [§12. Implementation Notes](#12-implementation-notes)
- [Appendix A. Cross-Axis Convergence Cluster Catalog](#appendix-a-cross-axis-convergence-cluster-catalog)
- [Appendix B. 4 Strong Isomorphisms + Normative Justification](#appendix-b-4-strong-isomorphisms--normative-justification)
- [Appendix C. Self-Application — this spec's own frontmatter](#appendix-c-self-application--this-specs-own-frontmatter)

---

## §1. Concept — What Greatpractice Is

> Greatpractice is neither a *document format* nor a *rule catalog*. It is an **operating mechanism** to prevent lapses in repetitive work — a module that fuses three backbones: a *lazy hierarchy* (a 3-tier tree loaded only at the point of need) + a *deterministic hook* (lifecycle enforcement that does not depend on model judgment) + a *maturation gate* (a multi-stage gate from raw experience → ratified entry). This §1 defines that *identity* and forecloses four common misreadings.

### §1.1 Four Common Misreadings and the Actual Identity

There are four wrong frames easily conjured by the name Greatpractice alone. Foreclosing each in advance makes every design choice from §2 onward align naturally.

| Misreading | Actual identity |
|---|---|
| (a) **"Yet another memory system"** — an extension of `memory/feedback_*.md` | Greatpractice is not a memory *store* but a **lifecycle pipeline** in which memory is promoted into procedural knowledge *at the moment it becomes repeatedly patterned* (at the point where frequency × cost × predictability crosses a threshold). The memory itself is merely input |
| (b) **"Just another rule file"** — a flat norm declaration like `AGENTS.md` / `.agent/rules.md` | Greatpractice is not a flat norm declaration but a **3-tier call chain** (macro → mezzo → micro). The entry point, activation mechanism, and enforcement strength differ per tier. Avoiding the *always-on tax* of flat rules is the architectural motive |
| (c) **"A one-shot codification artifact"** — a best-practice catalog that's done once you've organized it | A Greatpractice entry always lives inside a **probation → consolidation → automatic** lifecycle (psychology §1.10 Lally 66-day model). On `last_validated_at` expiry it auto-dims/warns, hit/miss counters accumulate, and it evolves via the supersedes graph — a *living document* (humanities §4.8) |
| (d) **"An AGENTS.md replacement"** — a successor to always-on permanent context | Greatpractice *complements* AGENTS.md rather than *replacing* it. AGENTS.md = always-on macro (§5 telos, 5-10 item cap). Greatpractice is the mezzo/micro tier + lifecycle mechanism beneath it. The telos of AGENTS.md §5 itself becomes the source of `greatpractice/macro/_telos.md`, but the AGENTS.md slot itself is preserved (harness §1.5 Aider read-only cache prompt-cache prefix coherence) |

In summary, Greatpractice = **"an evolvable procedure tree that *deterministically* prevents lapses in repetitive work."** It does not directly occupy any single slot among memory, rules, or catalog; it instruments the *junction* of the three.

### §1.2 5-stage pipeline — capture → mature → codify → enforce → revisit

The essence of Greatpractice is not a single artifact but a **5-stage pipeline**. Each stage operates by a different mechanism, and there is a *gate* between each stage.

```
[1. capture]  raw event occurs → memory/feedback_<slug>.md written immediately
              leveraging Schön reflection-in-action's golden moment (psychology §3.5)
              voice-check enforced — blameless framing (§6.1 Cluster E)
                ↓ (gate 1: one-off → accumulation)
[2. mature]   on recurrence of the same pattern, frequency accumulates + illustration appended
              rrpv (re-reference prediction value, processor §1.7) decay counter
              notability gate auto-check (§5.2):
                (a) significant coverage ≥ 3 times
                (b) independent triggers ≥ 2 kinds
                (c) verifiable effect measurable
                ↓ (gate 2: 3-criterion pass → draft eligibility)
[3. codify]   greatpractice/_propose/<slug>.draft.md auto-generated
              phronesis-codify-boundary check (§5.3 + humanities §1.12 / §3.9):
                frequency × cost-of-missing × predictability ≥ threshold
              tier determination (macro / mezzo / micro — see §2)
              full frontmatter schema (see §3) authored
                ↓ (gate 3: phronesis pass + promote approval → ratified)
[4. enforce]  promote to greatpractice/{macro|mezzo|micro}/<slug>.md
              register lifecycle hook (Stop / PreToolUse / UserPromptSubmit etc.; see §4)
              behavior per enforcement_level (mandatory / recommended / advisory):
                - mandatory → exit 2 block (poka-yoke contact type, management §1.8)
                - recommended → warning + additionalContext inject
                - advisory → reference only
              memory/feedback_<slug>.md is replaced by a 1-line redirect stub (§5.5)
                ↓ (gate 4: freshness expiry or hit-rate threshold shortfall)
[5. revisit]  periodic staleness probe (§7 + sre §1.6 PRR + canonical §1.11)
              hit/miss statistics accumulate → distinguish / per-incuriam / overrule
                cost-tiered revision vocabulary (§7.4 + humanities §1.2):
                - distinguish (cheapest): not applied in this context only
                - per-incuriam (medium cost): demoted to weak authority + retire queue
                - overrule (high cost): explicit retirement + supersedes graph update
              90 days hit 0 + miss 0 = cold eviction candidate (§7.6 + memoization §1.5)
                ↺ (return to 4 if needed, or archive)
```

The crux of this pipeline is that **each stage has its own independent enforcement loop**. With capture only and no mature stage, you get noise codification (Appendix A Cluster D · the trap of eager codification). With enforce only and no revisit, you get stale taxidermy (humanities §4.8 + memoization §1.5). Only when all five stages are separated by *explicit gates* does the whole module become a living procedure system.

### §1.3 Architectural backbone — *lazy hierarchy + deterministic hook + maturation gate*

This module's architectural justification does not rely on the authority of a single domain. A 9-axis cross-domain deep-research effort derived **isomorphic consensus across the three backbones**, and this consensus plays the role of the spec's first-principles justification (the 4 cross-axis isomorphism pairs are in Appendix B).

#### Backbone 1 — **Lazy 3-tier hierarchy** (8/9 axis consensus)

> A strong isomorphism across 4 domains that solve the *latency × frequency × capacity tradeoff* with the same equation: Anthropic Skills 3-level (harness §1.1) ↔ Denning working-set W(t,τ) (os §1.1) ↔ Hennessy-Patterson cache hierarchy AMAT (processor §1.1) ↔ Bellman DP overlapping subproblems (memoization §1.4).

The crux of the 3-tier split is that **a higher tier serves as the "summary + pointer" of the lower tier**. Context cost is charged only to items *actually referenced*.

| Tier | EG vocabulary | activation | cost model |
|---|---|---|---|
| macro | domain governance (5-10 items) — telos / boundary / cadence | always-on (system prompt) | prompt-cache stable prefix (harness §1.5 Aider) |
| mezzo | procedure (20-50 items) — outbox validation / pre-send check etc. | metadata-gated — body loaded on description match (harness §1.4 Cursor Agent Requested + OpenHands keyword trigger) | metadata only until activation |
| micro | atom (hundreds) — command / check / decision (sre §1.1 runbook-as-code) | event-driven — only at hook fire (path-scoped glob, harness §1.8 Copilot applyTo) | forked every event, 0 LLM tokens |

The fact that 8/9 axes derived exactly the same conclusion in different vocabulary — Alexander pattern language network (humanities §1.11), the LLM-context reinterpretation of SECI Ba (management §1.13), Chase-Simon chunking + Sweller cognitive load (psychology §1.3), CLOCK + lazy demand-fault-in (os §2.1), Wikipedia Summary Style (canonical §1.2), Google SRE 4-layer (Production Guide → PRR → Runbook → atom, sre §1.1) — is itself direct evidence of avoiding dependence on a single-domain authority.

#### Backbone 2 — **Deterministic hook enforcement** (7/9 axis consensus)

> Replace fragile procedure (work the model must remember every time by *judgment*) with the deterministic execution of lifecycle hooks. *Even if the model forgets, the system blocks.*

The decisive finding of Gollwitzer's if-then implementation intention with a d ≈ 0.65 effect size (psychology §1.8) — **the format itself** is the source of the effect. The effect of prose-form if-then is 0; only JSON schema form yields d ≈ 0.65. This finding explains the WHO Surgical Safety Checklist's (humanities §1.7) 11→7% complication reduction, the accident-free quality of Shingo poka-yoke's 3 types (contact / fixed-value / motion-step, management §1.8), and Google SRE runbook-as-code's (sre §1.1) incident MTTR reduction, all by the same mechanism.

EG has already *dogfood-verified the superiority of deterministic enforcement* with one kind of Stop hook (pre-send-probe + watcher rearm) — the cycle-end extension dogfood evidence of pre-send-inbound-check. Greatpractice extends this verified infrastructure to 5-7 kinds of hooks (SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop / PostCompact). But humanities §1.7 Gawande's *60-90 second fatigue budget* + canonical §1.5's *tiered strictness* (micro=bright-line, macro=soft norm) must be applied simultaneously to avoid hook over-proliferation.

#### Backbone 3 — **Maturation gate** (5/9 axis consensus)

> 1 occurrence = raw memory (eager capture), 3 occurrences + 2 kinds of independent context + verifiable effect = draft (notability gate passed), 4+ occurrences + phronesis pass + promote approval = ratified entry. The staged deferral of *capture is immediate, promotion is delayed*.

*Without* this gate, the two camps of psychology §3.5 Schön reflection-in-action's golden-moment capture (cost 0) and canonical §1.2 Wikipedia Notability gate (premature codification → overruling instability, humanities §4.1) collide. Both are right — the difference is *timing*. The gate separates the two along the time axis.

- *Capture* (memory entry): immediate. Leverages Schön's golden moment.
- *Promotion* (greatpractice tree entry): after passing the 3 gates of notability + RRPV decay + phronesis-boundary.

The natural figures derived by synthesizing 5 axes (humanities §1.12 Aristotle phronesis + canonical §1.2 Wikipedia + psychology §3.5 Schön + sre §3.2 toil rubric + processor §1.7 RRIP/BRRIP) — 3 occurrences + 2 kinds + verifiable — align exactly with operating intuition ("1 occurrence=raw / 3 occurrences=trigger / 4+=reference only"), but are refined in that frequency alone is insufficient (see §5.1 multi-criteria score).

### §1.4 What Greatpractice does NOT codify — the phronesis boundary concept

The phronesis (φρόνησις) of Aristotle's *Nicomachean Ethics* Book VI and the tacit-knowing thesis of Polanyi's *The Tacit Dimension* (1966) — *"some kinds of practical knowledge cannot be made into explicit rules"* — tell us that defining Greatpractice's *negative scope* (the *do-not*-codify domain) is as important as defining its *positive scope* (humanities §3.9).

An attempt to catch every repetitive task with a hook causes two side effects.

1. **Phronesis atrophy** — an agent's on-the-spot ethical and contextual sensitivity is replaced by rule-following (Aristotle NE VI). Decision quality may rise on average, but the *wisdom of the outlier* (rare + high-context + judgement-heavy decisions) disappears.
2. **Polanyi limit** — the principled limit that *fully explicit knowledge is impossible*. Even codified explicit knowledge does not work without an internalization phase (the last step of the SECI cycle, management §1.13).

Therefore Greatpractice codifies only work where the following conditions are *simultaneously* satisfied (for detailed boundary conditions + flag-firing rules, see §5.3):

| Condition | Quantitative criterion (default) |
|---|---|
| **Frequency** | ≥ 3 occurrences OR cumulative N ≥ 5 within the same cluster |
| **Cost of missing** | silent drop / broken external collaboration / severed cross-reference, etc. — *recovery cost > codify cost* |
| **Predictability of trigger** | mechanically detectable via hook event + matcher (in-action or on-action point is clear) |

**The *do-not*-codify domain** (explicit exclusion, a subset — the full set is in §5.3):

- *Rare* decisions — high-stakes choices occurring less than once per branch (a new module / a new collaborator joining / a governance pivot). The domain of Hyperbrief §1's 9-section IR — Greatpractice *raises awareness* but *delegates the decision itself*.
- *High-context judgement* — work where the same trigger demands opposite decisions depending on context.
- *Ethical/aesthetic intuition* — tone matching / pace-mode tuning / public-redaction judgment, etc. Only additionalContext inject is possible; no hard hook block.
- *Generative pattern induction* — deriving a new pattern in a new situation itself. A direct application of Alexander's later critique (humanities §4.9 — "not a *set* of patterns but the *generative process* is the crux").

Without this boundary made explicit, Greatpractice collapses under its own weight (humanities §4.6 + canonical §1.12 Wikipedia wiki-rot pattern). Therefore the *advisory* grade of the frontmatter's `enforcement_level` field (mandatory / recommended / advisory — §4.3 spec) serves as the explicit marker of the phronesis domain — by injecting a reference rather than hard-blocking, it preserves the agent's on-the-spot judgment.

In summary, Greatpractice stands on the explicit boundary of **"codify only the repeatedly-lapsed parts, leave the rest to the agent's operating instinct + Hyperbrief delegation."** This boundary itself is a candidate for the first macro entry of `greatpractice/macro/codification-boundary.md` — the module's self-referential governance.

---

## §2. Tier Hierarchy — macro / mezzo / micro

> macro·mezzo·micro are the result of plotting three points on the same *latency × frequency × capacity* tradeoff equation. In the 9-axis deep research, 8 axes derived this 3-tier separation as universal convergence — the backbone's justification is multi-domain isomorphism, not the authority of a single domain. This § defines those tiers' division of responsibility, count guide, frontmatter-density gradient, edit_policy gradient, INDEX cap, and the parent-child graph topology.

### §2.1 The 3-tier working set — 8/9 axis universal convergence

In the synthesis of the 9-axis deep research (`harness · humanities · psychology · management · processor · os · sre · memoization · canonical`), this tier separation is a pattern that 8 of the 9 axes derived simultaneously (sre appears as a 4-layer variant — unified via Appendix B isomorphism 1's *isomorphic reduction*). The core equation is identical:

> A higher tier is *small and always active*, a lower tier is *large and lazy on-demand*. Each tier is the **filtered summary + pointer** of the lower tier — the more reference frequency drops by 1-2 orders of magnitude, the more you can raise latency by 1-2 orders of magnitude while average cost barely changes.

| Greatpractice tier | equivalent domain prior art | primary justification |
|---|---|---|
| **macro** (always-on, ≤300 token cap) | harness §1.1 Level 1 metadata · processor §1.1 L1 · os §1.1 W(t,τ) inner-core · humanities pattern-language root · management §1.4 SECI Ba core | always-resident, the top of cache-line locality |
| **mezzo** (metadata-gated, load on phase entry) | harness §1.1 Level 2 SKILL.md body · processor §1.1 L2 · os §1.4 phase locality · canonical §1.2 article body | descriptor always exposed, body fault-in on trigger |
| **micro** (event-driven, only at hook trigger) | harness §1.1 Level 3 bundled refs · processor §1.1 L3 + DRAM · sre §1.1 runbook atom · memoization §1.2 lazy materialization | atom-unit executable, cost only on-demand |

The crux is that *responsibility between tiers* is decided by a single natural equation (latency↑ ↔ frequency↓ ↔ capacity↑) — i.e., which tier to place an entry in is not an *arbitrary choice* but is decided by that entry's (activation frequency × call latency budget × body size).

Appendix B isomorphism 1's (`harness §1.1 ↔ os §1.1 ↔ processor §1.1 ↔ memoization §1.4`) 4-axis agreement guarantees the cross-domain robustness of this equation.

### §2.2 Per-tier division of responsibility + count guide

Specify each tier's *responsibility + count guide + body size*. The count is not a hard cap but an **operational sanity signal** — on excess, auto re-examine the classification (synthesis of `humanities §1.7` Gawande's 5-7 killer items constraint + `sre §4.3` checklist bloat trap).

| Tier | responsibility | recommended count | body size | activation cost |
|---|---|---|---|---|
| **macro** | workspace domain governance — ratio rule, telos, absolute principles (autonomous execution, pace, redaction boundary, etc.) | **5-10** | 1 entry ≤ 30-50 lines lead + summary only | always-on, prompt cache stable prefix |
| **mezzo** | procedure within a phase / module / scope — most operating patterns are here (outbox-json-validation, pre-send-probe, n-way-sync-registry, etc.) | **20-50** | 1 entry 80-300 lines (canonical §1.12 9-section schema full) | descriptor (≤200 token) as metadata only, body on trigger |
| **micro** | atom = command / check / decision (sre §1.1) — 1-2 step executable + single hook payload | **hundreds** (realistically 50-300) | 1 entry ≤ 30 lines, frontmatter + atom body | load only at hook fire, zero cost otherwise |

#### Basis for macro count 5-10

The *same order of magnitude* agreement of `harness §1.1` Skills metadata's 1536 char cap + `processor §1.1` L1's 32-64 KB + `humanities §1.7` Gawande 5-7 killer items + `management §1.10` Wikipedia 5 pillars. Exceeding 10 means always-on token inflation (harness §4.1 macro bloat) + a violation of the Gawande fatigue budget.

#### Basis for mezzo count 20-50

`canonical §1.2` Wikipedia article's *active corpus* statistics (the natural size of a workspace-grade operating manual) + `os §1.8` Linux active list's working-set estimate size. Exceeding 50 means mezzo becomes a *de facto macro* (the descriptor token itself exceeds macro cost) or a tier-classification error.

#### Basis for micro count in the hundreds

`sre §1.1` operating runbook atom's natural size + `processor §1.1` L3's 4-64 MB capacity. No count cap — separation per `class` (the slab-style grouping of §2.6) + lazy load means working-set cost is zero.

### §2.3 Tier ↔ frontmatter density mapping

(Resolves the hidden contradiction of Appendix A Cluster A vs Cluster C — the per-tier gradient of *completeness vs fatigue budget*. Consistent with the tier-conditional field of §3.3.)

`management §1.1`'s fixed 10-field schema + `canonical §1.5`'s 9-section schema are the ceiling of the *full schema*, but forcing full on every tier produces a *schema overhead inversion* where micro is atom-sized (1-2 step) yet its frontmatter is larger than its body. Apply a per-tier gradient:

| Field | macro | mezzo | micro |
|---|---|---|---|
| `tier` | ✓ | ✓ | ✓ |
| `description` (≤200 token) | ✓ | ✓ | ✓ (≤80 token) |
| `enforcement_level` | ✓ | ✓ | ✓ |
| `edit_policy` | ✓ owned | ✓ owned | ✓ ownerless (§2.4) |
| `trigger.if / trigger.then` | — | ✓ | ✓ (required) |
| `paths` (glob) | — | ✓ | ✓ |
| `parent` | — | ✓ (→ macro) | ✓ (→ mezzo) |
| `ratio / obiter / illustration` | ✓ (binding rule) | ✓ | — (atom only) |
| `evidence-quality × recommendation-strength` | ✓ | ✓ | — (atom is deterministic) |
| `maturity` (Dreyfus) | ✓ | ✓ | — |
| `lifecycle: probation/consolidation/automatic` | — | ✓ | ✓ |
| `rrpv` (default 2) | — | ✓ | ✓ |
| `class: persistent/session` | ✓ persistent | ✓ persistent | mixed |
| `coherence: strict/soft/none` | strict | soft (default) | soft |
| `trigger_source` enum | — | ✓ | ✓ |
| `last_referenced_turn` | — | ✓ | ✓ |
| `last_validated_at / freshness_until` | ✓ (180 days) | ✓ (90 days) | ✓ (30 days) |
| `supersedes / superseded_by` | ✓ | ✓ | ✓ |
| `surfaces: []` (N-way sync) | ✓ | ✓ | — (atom single surface) |
| `hash / deps` | — | optional | ✓ (memoization) |
| `9-section body schema` | lead + summary only | full | — (atom body) |

**Core decisions**:
1. macro is essentially *binding-rule declaration* (humanities §1.1 ratio/obiter) — frontmatter is comparatively light + the body lead is the SSoT.
2. mezzo is *full schema* — hosts all governance axes of an operating procedure (Cluster C 9/9 universal).
3. micro is *atom-sized frontmatter* — trigger + executable only. The frontmatter is not longer than the body.

### §2.4 Tier ↔ edit_policy mapping

(The per-tier default of Appendix A's ownerless community-wiki vs owner-stamped contradiction.)

A synthesis of `canonical §1.9`'s SO Community Wiki + `sre §1.4`'s mandated surface owner + `management §1.7`'s catchball negotiation. Because drift cost and update frequency differ per tier, the defaults must differ too.

| Tier | edit_policy default | justification | change procedure |
|---|---|---|---|
| **macro** | `owned` (workspace owner = EG-maintainers) | drift cost very high (at the workspace-telos level), updates rare | explicit approval + Hyperbrief 4-score escalation recommended |
| **mezzo** | `owned` (authoring agent + maintainer jointly) | drift cost medium, updates 1-2 times per branch | commit after passing the maturation gate (§5 promotion path) |
| **micro** | `ownerless` (community-wiki-like) | frequent updates + low mistake cost + lint enforces coherence | any agent updates directly, OK as long as schema lint passes |

**Lint enforcement**: `eg_greatpractice_lint.cjs` blocks `(tier ↔ edit_policy)` coherence checks as a PreToolUse hook. e.g.: `tier: macro` + `edit_policy: ownerless` = exit 2.

**Exception paths**:
- macro can also transition to ownerless after an *explicit catchball* (maintainer or multi-agent consensus) — preserve history via the `supersedes:` field (§7.4 cost-tiered revision).
- micro can also be overridden to owned if *fragility: high* + critical workflow — paired with `enforcement_level: mandatory`.

### §2.5 INDEX.md's ≤300 token cap + auto-generation

A synthesis of `harness §1.1` Skills metadata's 1536 char cap (~384 token) + `aider §1.5` read-only stable prefix's prompt-cache optimization + `cline §1.6` Memory Bank's hierarchical dependency flow — the *always-on entrypoint* of the Greatpractice tree is INDEX.md alone.

#### Cap definition

- **Hard cap**: ≤300 token (≈1200 char). The prompt-cache stable-prefix region.
- **Structure**: 1-3 lines per macro entry + 1 line per mezzo top-level scope + count only for micro.
- **Version stamp**: the first 8 chars of the tree's `manifest.json` hash — the *coherence check* between index and tree (memoization §1.1 content-addressed).

#### Auto-generation rules

INDEX.md is not hand-edited directly — `eg_greatpractice_lint.cjs` walks the tree, extracts frontmatter → auto-builds. A PostToolUse hook (`Write|Edit` matcher on `greatpractice/**/*.md`) regenerates INDEX after every mutation. (For build-script implementation details, see §12.4.)

```yaml
# auto-generated result example
version: gp-v0.1.0 (manifest: a7c3f9d2)
macro:
  - communication-discipline: A2A + outbox + redaction (binding)
  - release-cadence: meaningful push → version + CHANGELOG (MUST)
  - workspace-cleanliness: inner-outer split + agent-local gitignore
  - decision-flow: autonomous default + 4-score escalation
  - codification-boundary: phronesis NOT-codify scope
mezzo (scope → count):
  - communication/* (8)
  - release/* (5)
  - workspace/* (3)
  - decision/* (4)
micro: 47 atoms (hook-callable)
```

#### Handling on excess

Exceeding 300 token = lint error exit 2. Requires macro-entry compression or mezzo-scope consolidation (slab class consolidation, see §2.6).

### §2.6 Parent-child graph topology

A synthesis of `humanities §1.4` Alexander pattern language network + `canonical §1.4` Wikipedia summary-style hatnote + `os §1.15` SLUB slab class grouping + `processor §1.11` MESI coherence graph.

#### The 4 kinds of tree edges

| Edge kind | direction | use | example |
|---|---|---|---|
| `parent` (strong edge) | child → 1 parent | hierarchical containment | `outbox-json-validation` (mezzo) → `communication-discipline` (macro) |
| `composes` (weak edge) | parent → N children | atom call chain | `pre-send-inbound-check` (mezzo) → `inbox-cursor-probe` (micro) |
| `supersedes` (temporal edge) | new → old | evolution history DAG | `pre-send-probe-v2` → `pre-send-probe-v1` |
| `related` (peer edge) | A ↔ B | cross-reference (pattern language) | `outbox-json-validation` ↔ `n-way-sync-registry` (both PreToolUse) |

#### Topology rules

1. **Single parent invariant**: every mezzo has exactly 1 macro parent, every micro has exactly 1 mezzo parent. A parentless mezzo/micro = lint error (orphan).
2. **No cross-tier cycle**: the transitive closure of parent edges is acyclic. Lint detects cycles then exit 2.
3. **`related` edge is a free-form network**: peer-to-peer, no count limit. Weak coupling like Alexander pattern language's call chain (humanities §1.4).
4. **`supersedes` chain**: only the last active entry is default-loaded, prior versions move to `_archive/` (§7.6 cold eviction). Keep a redirect stub to preserve cross-references (canonical §1.3).
5. **Slab grouping**: micro atoms of the same schema (e.g., *all PreToolUse hook atoms*) are marked with the same `class:` field — leveraging load/lookup locality (`os §1.15`).

#### Visualization

```
┌──────────────── INDEX.md (≤300 token, always-on) ────────────────┐
│                                                                  │
│    macro: communication-discipline | release-cadence | ...       │
│      │                                                           │
│      ├─ parent ───→ mezzo: outbox-json-validation                │
│      │                │                                          │
│      │                ├─ composes ───→ micro: outbox-append-roundtrip │
│      │                ├─ composes ───→ micro: outbox-server-ack-probe │
│      │                └─ related   ←──→ mezzo: pre-send-inbound-check │
│      │                                                           │
│      ├─ parent ───→ mezzo: pre-send-inbound-check                │
│      │                ├─ composes ───→ micro: inbox-cursor-probe │
│      │                └─ composes ───→ micro: meaningful-surface-classify │
│      │                                                           │
│      └─ parent ───→ mezzo: n-way-sync-registry                   │
│                       └─ composes ───→ micro: version-badge-bump │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

This topology is the input to §2.5's INDEX.md auto-generation, and is the same data structure as §5's promotion/maturation-gate ratification path and §4's hook-lifecycle routing graph — one tree is the SSoT of *all dynamic behavior*.

---

## §3. Entry Schema — frontmatter as governance SSoT

> Frontmatter is the governance SSoT. It is designed so that a 9/9 axis universal convergence + per-tier density gradient + multi-criteria maturity score make *a single schema definition simultaneously activate all 9-axis patterns* — the single largest lever. The lint scope is narrowed to the v0.1 mandatory 7 fields, leaving the rest as placeholder/null — a *progressive activation* policy.

### §3.1 9-axis universal convergence justification

A Greatpractice entry has its *frontmatter work before* the body. Lint, hook fire, working-set load, deprecation queue, SSoT propagation, voice check — all take the frontmatter's formalized fields as input to operate. That is, if the body is the "surface a human reads," the frontmatter is the "surface the system operates on."

This consensus is a universal convergence that *all* 9 axes derived (Appendix A Cluster C):

| Axis | contributed field | core justification |
|---|---|---|
| harness | tier · trigger_type · fragility · parent (Anthropic Skills `paths:` glob + tier-trigger-fragility-metadata) | the 3 levels of progressive disclosure expressed as frontmatter |
| humanities | binding · evidence_quality · recommendation_strength (Stare Decisis ratio/obiter + GRADE 2-axis) | binding rule vs advisory separation + certainty × enforcement as separate axes |
| psychology | maturity · created_at · last_triggered · miss_count (Dreyfus + Lally 66-day) | auto-adjust entry verbosity + lifecycle stage |
| management | last_reviewed · supersedes · superseded_by · kaizen_baseline_since (AAR 10-field schema + TPS) | the evolution-history graph of "standard = kaizen baseline ≠ taxidermy" |
| processor | rrpv · trigger_source · 3C miss diagnostic counters (RRIP + SHCT + 3C grid) | reuse prediction + source attribution |
| os | last_referenced_turn · class (Denning working set + persistent vs session split) | backward-window working set + swappiness equivalent |
| sre | feedback-3field-gate · blameless 4-section · last_validated_at · validation_cadence_days | trigger codification + surface owner + staleness probe |
| memoization | hash · deps (Bazel/Nix content-addressed + dependency-tracked invalidation) | content-addressed identity (v0.2+) |
| canonical | 9-section fixed schema · edit_policy · freshness_until · freshness_axis | canonical entry schema + dual-mode edit + revisit cadence |

Every domain derived exactly the same conclusion: *frontmatter is the governance SSoT*. Multi-domain evidence 9/9 that does not depend on the authority of a single domain.

Additionally, a *normative* justification backfill (Clark-Chalmers 1998 *coupling condition* — reliable + accessible + automatically endorsed) captures the essence of *why these fields* (Appendix B §B.5). reliable = `evidence_quality` + `validation_cadence_days`, accessible = `tier` + `surfaces[]`, automatically endorsed = `binding` + `enforcement_level`. That is, frontmatter is the instrumentation of the *3 conditions for an external cognitive resource to be recognized as part of the mind*.

### §3.2 v0.1 mandatory fields (lint scope = 7 fields)

The *block-level* lint of the v0.1 cut enforces only the following 7 fields. The rest are warning (no block) with a 6-cycle migration grace period (§3.8). The purpose is to allow gradual migration during retro-backfill.

**Lint-required 7 fields**: `id`, `tier`, `binding`, `enforcement_level`, `trigger`, `lifecycle`, `last_referenced_turn`.

Selection basis — these 7 fields are the *minimum input for a hook fire*. Even without all other fields, the following are possible: (a) entry identification (`id`), (b) tier-conditional loading (`tier`), (c) binding vs advisory separation (`binding`), (d) enforcement-strength determination (`enforcement_level`), (e) hook-fire condition (`trigger`), (f) lifecycle-stage gating (`lifecycle`), (g) backward-window eviction (`last_referenced_turn`). The rest are optional governance refinement.

**Full YAML schema example** (mezzo tier — the ratified entry of outbox-json-validation):

```yaml
---
# === v0.1 lint-required (block on missing) ===
id: outbox-json-validation
tier: mezzo                          # macro | mezzo | micro
binding: ratio                       # ratio (binding rule) | obiter (advisory) | illustration
                                     # humanities §1.1 Stare Decisis
enforcement_level: mandatory         # mandatory (PreToolUse exit 2) | recommended (warn) | advisory (inject)
                                     # management §1.10 Wikipedia 5 pillars + IAR escape
trigger:
  if: "just before append to outbox.jsonl"
  then: "go through scripts/eg_outbox_push.cjs + JSON.stringify + roundtrip parse check"
  format: json-schema                # psychology §1.8 — the format itself is the d≈0.65 effect
  source: stop-hook                  # processor §1.8 SHCT trigger_source enum
                                     # ∈ {stop-hook, a2a-inbound, user-pivot, hyperbrief,
                                     #    autonomous, post-incident, retro-backfill}
lifecycle: probation                 # probation (0-30 days) | consolidation (30-90 days) | automatic (90+ days)
                                     # psychology §1.10 Lally 66-day model
last_referenced_turn: 2026-06-04T10:00:00Z    # os §1.1 Denning backward-window

# === v0.1 lint-warn (warn on missing, 6-cycle grace) ===
title: Outbox JSON Validation Discipline
slug: outbox-json-validation
created_at: 2026-06-04T10:00:00Z
source_evidence:                     # which raw evidence it was promoted from
  - memory/feedback_outbox_json_validation.md
  - reports/2026-06-04-greatpractice-research/axes/sre.md#1.1

# === GRADE 2-axis (humanities §1.5) ===
evidence_quality: high               # high | moderate | low
recommendation_strength: MUST        # MUST | SHOULD | MAY

# === Multi-criteria maturity (canonical definition: §5.1) ===
maturity_score:
  frequency: 3
  depth: 4
  recency: 5
  cost: 4
  predictability: 5
  # threshold = sum ≥ 18 OR (frequency ≥ 3 AND independent_triggers ≥ 2 AND verifiable_effect)
  # detailed 5-axis weighted-sum formula + threshold + axis meaning = §5.1

# === Lifecycle cadence (sre §1.6 + canonical §1.11 — details §7) ===
last_validated_at: 2026-06-04T10:00:00Z
validation_cadence_days: 90          # micro=30 / mezzo=90 / macro=180 (§7.2 default)
freshness_until: 2026-09-02T10:00:00Z         # auto-derived: last_validated_at + cadence
freshness_inherits_from: null                 # §7.5 — master id when derived

# === Coherence + ownership (§8.4 + §2.4) ===
coherence: strict                    # strict | soft | none — processor §1.11 MESI (default=soft)
edit_policy: owned                   # ownerless (micro default) | owned (mezzo/macro default)
owner: EG-maintainers                # only when owned (canonical §1.9)
audit_trail:                         # vandalism defense for ownerless
  - {ts: 2026-06-04T10:00:00Z, agent: claude-opus-4-7, action: promote, prev_hash: null}

# === Evolution (see §3.4) ===
supersedes: []
superseded_by: null
kaizen_baseline_since: 2026-06-04
revision_history:
  - {ts: 2026-06-04T10:00:00Z, type: created, by: claude-opus-4-7, cost_tier: null}
    # cost_tier ∈ {distinguish, per-incuriam, overrule} — humanities §1.2, §7.4

# === SSoT propagation (see §8) ===
surfaces:
  - {kind: skill, path: plugins/greatpractice/skills/outbox-emit-schema-check/SKILL.md, inherits_freshness: true}
  - {kind: hook, path: .claude/settings.local.json#hooks.PreToolUse[outbox], inherits_freshness: true}
  - {kind: memory_stub, path: memory/feedback_outbox_json_validation.md, inherits_freshness: false}

# === Tier hierarchy (required mezzo and above, see §3.3) ===
parent:
  - greatpractice/macro/communication-discipline.md
children:
  - greatpractice/micro/outbox-append-json-roundtrip.md
  - greatpractice/micro/eg-outbox-push-cjs.md

# === Phronesis boundary marker (§5.3) ===
phronesis_boundary: false            # true = do-not-codify, inject reference context only

# === Class split (os §1.11) ===
class: persistent                    # persistent (cross-session) | session (single-session)

# === v0.2+ deferred (see §3.7 — v0.1 = null/0 placeholder) ===
hash: null                           # BLAKE3(canonical_body) — memoization §1.8
deps: []                             # list of dependency entry hashes
rrpv: 2                              # processor §1.7 — 0=immediate evict, 3=long-protected
miss_count:                          # processor §3.8 3C grid
  compulsory: 0
  capacity: 0
  conflict: 0
  coherence: 0
---
```

v0.1 lint policy summary: the 7 fields above are *block* (exit 2), other schema-defined fields are *warn*, and schema-undefined unknown fields are *warn only in strict mode* (default off). The lint scope expands gradually after the 6-cycle migration grace period (§3.8).

### §3.3 Tier-conditional fields (mezzo-required / macro-required)

Resolves the hidden contradiction of Appendix A Cluster A vs Cluster C — the crux of the lazy 3-tier hierarchy is *most entries must be out of context for cost efficiency*, while the crux of frontmatter-driven is *every entry holds rich metadata*, so the two conflict. Resolved via the per-tier frontmatter *density gradient* (§2.3).

**Per-tier schema strength**:

| Tier | required field count | recommended length | justification |
|---|---|---|---|
| micro (atom) | 4 fields (`id`, `tier`, `trigger`, `source_evidence`) | ≤30 lines / ≤500 chars | runbook atom = command/check/decision 1-2 fields only (sre §1.1) |
| mezzo (procedure) | 7 lint-required + mezzo-required (binding, enforcement_level, etc.) | 80-200 lines / 3-8KB | 9-section full schema (canonical §1.12) |
| macro (governance) | all of mezzo + macro-required (parent, children, telos linkage) | 100-300 lines / 5-12KB | ratio rule + child-node graph topology |

**mezzo-required (additional requirements vs micro)**:
- `binding`, `enforcement_level`, `evidence_quality`, `recommendation_strength` — required to determine enforcement strength
- `lifecycle`, `last_validated_at`, `validation_cadence_days` — targets of the freshness probe
- `edit_policy`, `owner` (if owned) — vandalism defense
- `surfaces[]` — derived-view enumeration of SSoT propagation

**macro-required (additional requirements vs mezzo)**:
- `parent: []` (or root marker) + `children: []` — parent-child graph topology of the tier hierarchy
- `telos_alignment` — which of AGENTS.md §5's 5 telos it aligns to (source of the root node `_telos.md`)
- `coherence: strict` (default macro) — broadcast target on multi-agent join

**micro-permissive (all fields above optional)** — the essence of an atom is executable form, so it is normal for governance metadata to be *mostly absent*. But `tier: micro` alone enters the lint's *micro-permissive mode* → a missing field above is not even a warning but *silent*.

**INDEX.md ≤300 token cap** — the risk of macro-tier frontmatter becoming rich is isolated by the ≤300 token chunk summary of INDEX.md (§2.5 + canonical §1.4 Summary Style). The 3-layer separation of rich frontmatter + minimal body + compressed INDEX is the real resolution of the contradiction.

### §3.4 Evolution fields (supersedes / superseded_by / revision_history + cost_tier vocabulary)

Entries *evolve*. The 3-tier cost vocabulary of humanities §1.2 (distinguish < per-incuriam < overrule) must *specify which revision it is* so that cost awareness does not disappear (avoiding the overruling-instability cascade of humanities §4.1). The semantic spec of the cost-tier (which tier applies in which situation) is canonical in §7.4 — this § covers only the frontmatter notation format.

**revision_history format**:

```yaml
revision_history:
  - {ts: 2026-06-04T10:00:00Z, type: created, by: claude-opus-4-7, cost_tier: null}
  - {ts: 2026-06-15T11:23:00Z, type: revised, by: claude-opus-4-7, cost_tier: distinguish,
     reason: "apply strict mode only on turns awaiting an external A2A response", supersedes_internal: false}
  - {ts: 2026-07-01T09:00:00Z, type: revised, by: claude-opus-4-7, cost_tier: per-incuriam,
     reason: "found a missing BigInt handling in JSON.stringify — partially invalid", supersedes_internal: true}
```

**DAG integrity of supersedes / superseded_by** — `eg_greatpractice_lint.cjs` detects graph cycles + blocks dangling references. The EG instantiation of the management §1.3 TPS supersedes graph.

**kaizen_baseline_since** — the frontmatter marker of TPS's *"standard = kaizen baseline ≠ taxidermy"* thesis (management §1.3). Which *revision* occurred after this timestamp is the evidence of a *practice being alive*. If unchanged for 6+ months, it's a stagnation candidate (could be simply stable, so *warn only*).

### §3.5 SSoT propagation fields (surfaces[] + freshness_inherits_from)

The 4-axis consensus of Appendix A Cluster H — canonical → derived N-way sync. It is the architectural solution to current EG's most frequent violation (16× docs/promo sync miss). The *entry-level inversion* of AGENTS.md §5.8's N-way sync registry (for the detailed inversion meaning + surface kind taxonomy, see §8).

**surfaces[] frontmatter format**:

```yaml
surfaces:
  - kind: skill
    path: plugins/greatpractice/skills/outbox-emit-schema-check/SKILL.md
    inherits_freshness: true                 # auto-inherits master's freshness
    coherence: strict                         # per-surface coherence override possible
  - kind: hook
    path: .claude/settings.local.json#hooks.PreToolUse[outbox]
    inherits_freshness: true
  - kind: memory_stub
    path: memory/feedback_outbox_json_validation.md
    inherits_freshness: false                 # stub has a separate lifecycle (redirect only)
  - kind: docs-badge
    path: docs/shared/data.js#practices.outbox_validation.version
    inherits_freshness: true
  - kind: plugin-json
    path: plugins/greatpractice/.claude-plugin/plugin.json
    inherits_freshness: true
```

**Surface kind taxonomy** (v0.1): 5 kinds — `skill`, `hook`, `docs-badge`, `memory_stub`, `plugin-json`. For each kind's detailed propagation mechanism + first dogfood example, see §8.3.

**freshness_inherits_from** — resolves the hidden contradiction of Cluster F (freshness cadence) and Cluster C (frontmatter SSoT). When a derived surface inherits the master's freshness, `inherits_freshness: true` + no separate `last_validated_at`. But a derived surface that is a *cross-source integration* (e.g., several entries share the same docs page) needs separate validation — `inherits_freshness: false`. For the detailed inheritance rule, see §7.5.

**lint check** — `eg_surfaces_check.cjs` fires on `PostToolUse(Edit | Write)`. (a) master changed but an inherits_freshness=true surface in surfaces[] not updated → warn, (b) a surface path in surfaces[] does not exist (dangling) → block.

### §3.6 Multi-criteria maturity_score field — cross-ref to §5.1

`maturity_score`'s 5-axis weighted-sum formula, axis meaning (frequency / depth / recency / cost / predictability), threshold (sum ≥ 18 OR notability 3-criterion), the 3-axis coordinate definition of `independent_triggers`, the quantitative definition of `verifiable_effect` — all are **canonical in §5.1 (Maturation Gate)**. For frontmatter notation, see the example in §3.2 above.

§5.1's five axes (0-5 scale) map directly to the frontmatter's `maturity_score.{frequency, depth, recency, cost, predictability}` 5 sub-fields. At promote time, lint checks (a) whether all 5 axes are populated quantitatively (0-5 integer), (b) whether the threshold is passed, (c) the auto _propose/ residency check when `phronesis_boundary: true`.

### §3.7 V0.2+ deferred fields (hash, deps, rrpv, miss_count)

In the v0.1 cut, they exist in the schema as *placeholder* (null/0/[]) but with *runtime behavior disabled*. Active at the point the v0.2+ automation is entered.

**Deferred field list**:

| Field | v0.1 default | behavior when active in v0.2+ | source |
|---|---|---|---|
| `hash` | `null` | BLAKE3(canonical_body) — content-addressed identity | memoization §1.8 (Bazel/Nix) |
| `deps` | `[]` | list of dependency entry hashes — fine-grained invalidation | memoization §1.5 (MobX reactivity + Bazel) |
| `rrpv` | `2` | new-entry default rrpv=2 (→ 1 on 1 use), 0=immediate evict | processor §1.7 RRIP/BRRIP |
| `miss_count` | `{compulsory: 0, capacity: 0, conflict: 0, coherence: 0}` | 3C grid counter auto-accumulation + prescription mapping | processor §3.8 |
| `working_set_tau` | `null` (manual) | auto-tuning of backward-window τ (50 turn baseline → adjusted on miss rate) | os §1.1 + processor §3.4 |
| `phase_tag` | `null` | auto-derive release / docs / A2A / refactor | processor §1.10 + os §1.4 |
| `trigger_source_stats` | `null` | SHCT statistics — per trigger_source enum hit-rate accumulation | processor §1.8 (SHCT signature-history) |

**Why keep placeholders** — schema migration cost 0 on v0.2 entry. Existing entries hold frontmatter *forward-compatibly*. An instantiation of the Polanyi limit (humanities §1.8) — *full explicit is impossible* but *progressive activation* gradually expands the explicit.

**Even more deferred in v0.3+** — the adaptive verbosity of Dreyfus `maturity: novice/competent/expert`, the broadcast-invalidate execution of MESI `coherence`, the TAGE multi-scale confidence predictor. These too have fields in the v0.1 schema (`coherence: strict | soft | none`), but runtime behavior activates after entering multi-agent residency.

### §3.8 Lint policy (block vs warn) + migration grace period

**Lint level classification** (the 3-level severity of `eg_greatpractice_lint.cjs`):

| Level | behavior | applies to |
|---|---|---|
| **block** | exit 2 block — that entry cannot enter the working set | §3.2 lint-required 7 fields missing / DAG cycle / dangling supersedes |
| **warn** | stderr message + working-set entry allowed | mezzo/macro-required missing / enum violation of a schema-defined field / surfaces[] dangling path |
| **silent** | no message / entry allowed | micro tier's mezzo-required missing / v0.2+ deferred field placeholder missing |

**Migration grace period (6 cycle)** — spreads the retro-backfill cost of the existing 11 memory feedbacks (`memory/feedback_*.md`). 6 cycles = an estimated ~3-6 weeks. During that time it runs in the lint's *warn-only mode* (block disabled), with block activated after grace ends.

**Grace period progress monitoring**:

```bash
# eg_greatpractice_lint.cjs --report
# output example:
# [grace cycle 3/6]
#   block-level violations: 0 (none)
#   warn-level violations: 17
#     - feedback_outbox_json_validation: missing surfaces[]
#     - feedback_pre_send_inbound_check: missing maturity_score
#     ...
#   silent-level: 38 (suppressed)
#   migration progress: 5/11 feedback ratified, 4/11 _propose/, 2/11 raw
```

**Block activation trigger** — one of: 6 cycles elapsed OR migration progress ≥ 90% OR maintainer explicit toggle. On the first block after auto-activation, a *one-time grace* (an additional 24-hour reprieve for that entry).

**Unknown field policy** — fields outside the schema definition default to silent (forward compatibility), warn on `--strict` flag. strict is also enabled by default at the point of v0.2+ schema expansion.

**Voice-check of hook block messages** (resolves the Cluster B ∩ Cluster E contradiction) — the lint block message itself must pass §6's voice-check. If the tone is self-defensive, the entry body is blameless yet the enforcement surface induces a cascade — a self-contradiction. For the detailed voice-check discipline, see §6.

---

> §3's crux — frontmatter is the *surface the system operates on*. The 9/9 axis universal convergence is the empirical justification of *why frontmatter*, and the Clark-Chalmers coupling condition is the normative justification of *why these fields*. The v0.1 7-field lint scope is minimum viable, the rest is progressive activation. Resolve the contradiction with the lazy hierarchy via the per-tier density gradient, resolve fake frequency consensus with the multi-criteria maturity score (§5.1), do SSoT propagation with surfaces[] (§8), and make evolution cost visible with the cost_tier vocabulary (§7.4). The next §4 (hook mechanism) consumes this schema's trigger field.

---

## §4. Hook Mechanism — deterministic enforcement

> A hook definition is a JSON schema, not prose — the core of psychology §1.8 Gollwitzer implementation intention is *the effect of the format itself (d≈0.65)*. If the same information is written out as prose, strategic automaticity disappears; only when it is formalized as an if-then schema does neurological automatic firing become possible. §4 instruments this proposition across 5 layers: 7 hook event taxonomy + JSON Schema DSL + tiered strictness + fatigue budget + voice-check coupling. Among the 7 mandatory fields of the §3.2 frontmatter, `trigger.if/then` materializes directly into the hook spec of this §4, and the §5 maturation gate becomes the input to the enforcement_level promotion decision.

### §4.1 7 hook event responsibility split

Composing the 6 events of the Claude Code lifecycle (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, PostCompact) with the 3 subtypes of PreToolUse (poka-yoke contact / fixed-value / motion-step — management §1.8 Shingo *Zero Quality Control*) yields the **7 hook event taxonomy**. The responsibility of each event is derived from the Appendix A cross-axis convergence cluster:

| Event | Responsibility | Pattern cluster | Default enforcement |
|---|---|---|---|
| **SessionStart** | (a) verify bridge alive + respawn if dead, (b) macro tier auto-inject (INDEX.md + telos), (c) language confirm | Cluster A (lazy hierarchy ignition) | **blocking** — block all tools until bridge alive |
| **UserPromptSubmit** | (a) keyword × path_scope intersection match → inject additionalContext of the relevant mezzo, (b) detect outbound A2A accompanying a state-change utterance | Cluster G (trigger-source) + harness §1.7 | inject only (advisory) |
| **PreToolUse(contact)** | poka-yoke type 1 — content validation. schema validation of tool input (e.g. when appending to outbox.jsonl, enforce valid single-line JSON + routing via `eg_outbox_push.cjs`) | Cluster B + management §1.8.1 | depends on enforcement_level (mandatory=exit 2 / recommended=warn / advisory=inject) |
| **PreToolUse(fixed-value)** | poka-yoke type 2 — count/threshold. fire when a specific consistency count falls short (e.g. verify all surfaces[] N-way sync are updated just before `git push`) | Cluster B + management §1.8.2 | same as above |
| **PreToolUse(motion-step)** | poka-yoke type 3 — sequence. detect violation of a prescribed order (e.g. the probe → read-if-needed → emit → cursor-advance order of an outbound emit) | Cluster B + management §1.8.3 | same as above |
| **PostToolUse** | (a) SSoT propagation diff (canonical §1.11) — after-the-fact detection of update lapses in surfaces[], (b) reproducibility self-audit (v0.2+) | Cluster H + memoization §3.6 | warning |
| **Stop** (cycle-end) | (a) inbox cursor probe + meaningful inbound surfacing, (b) watcher rearm, (c) freshness probe scan, (d) accumulate hook fire statistics (v0.2+), (e) working-set rotation (v0.2+) | Cluster A + F + I | **blocking** (extension of the existing Stop hook) |
| **PostCompact** | re-invoke active macro/mezzo entries — recover the working-set after compact | harness §1.5 | inject only |

**Promotion of SessionStart to blocking** — during the bridge dead window, every outbox push succeeds as a file write but is not received by the server (silent drop), so the conventional discipline of merely specifying it as the "first action" was *advisory*, not enforcement. Promoting SessionStart to blocking makes bridge verify *physically* precede every other tool call. This is the LLM-lifecycle application of the humanities §1.7 Gawande *pause point* principle — block the source of the most expensive silent drop at a single chokepoint.

### §4.2 Hook JSON Schema — if-then DSL grammar

A Greatpractice hook definition is **enforced as JSON Schema**, not prose (psychology §1.8). Each hook is expressed as a single JSON object, and the 5 fields `event` + `matcher` + `condition` + `action` + `enforcement_level` are mandatory. Additionally, the 3 optional fields `tiered_strictness` (§4.3), `fatigue_budget_ms` (§4.5), `voice_checked` (§4.6) handle the fine-tuning of enforcement.

`plugins/greatpractice/schemas/hook-spec.schema.json` v0.1 full definition:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Greatpractice Hook Spec",
  "description": "deterministic enforcement of one ratified practice — if-then DSL (psychology §1.8 Gollwitzer); prose forbidden",
  "type": "object",
  "required": ["event", "matcher", "condition", "action", "enforcement_level"],
  "properties": {
    "event": {
      "type": "string",
      "enum": [
        "SessionStart",
        "UserPromptSubmit",
        "PreToolUse",
        "PostToolUse",
        "Stop",
        "PostCompact"
      ],
      "description": "Claude Code lifecycle event — maps to the 7 taxonomy of §4.1 (PreToolUse is subdivided by matcher.poka_yoke_type)"
    },
    "matcher": {
      "type": "object",
      "description": "which tool call + which input pattern + which path region it fires on — false-positives controlled via keyword × path_scope intersection",
      "properties": {
        "tool": {
          "type": "string",
          "description": "Bash | Edit | Write | Read | NotebookEdit | * (any) — Claude Code tool name"
        },
        "input_pattern": {
          "type": "string",
          "format": "regex",
          "description": "regex match of the tool input (e.g. Bash's command, Write's file_path)"
        },
        "path_scope": {
          "type": "array",
          "items": {"type": "string"},
          "description": "active file/directory glob — AND-combined with keyword — empty array = workspace-wide"
        },
        "poka_yoke_type": {
          "type": "string",
          "enum": ["contact", "fixed-value", "motion-step"],
          "description": "required only when PreToolUse — management §1.8 Shingo 3-type classification"
        }
      },
      "required": ["tool"]
    },
    "condition": {
      "type": "object",
      "description": "fire condition — the if clause of if-then (psychology §1.8)",
      "required": ["expr"],
      "properties": {
        "expr": {
          "type": "string",
          "description": "JavaScript expression — evaluated over tool input + workspace state; fires if true"
        },
        "trigger_source": {
          "type": "string",
          "enum": [
            "stop-hook",
            "a2a-inbound",
            "user-pivot",
            "hyperbrief",
            "autonomous",
            "post-incident",
            "retro-backfill"
          ],
          "description": "processor §1.8 SHCT — codify source attribution (from which signal this hook was promoted)"
        },
        "negative_examples": {
          "type": "array",
          "items": {"type": "string"},
          "description": "explicit examples of inputs that must NOT fire — avoid the specificity trap"
        }
      }
    },
    "action": {
      "type": "object",
      "description": "executed on fire — the then clause of if-then",
      "required": ["kind", "payload"],
      "properties": {
        "kind": {
          "type": "string",
          "enum": ["block", "warn", "inject_context", "rewrite_input", "run_script"],
          "description": "block=exit 2 + error message / warn=stderr message / inject_context=additionalContext / rewrite_input=rewrite tool input / run_script=execute cjs path"
        },
        "payload": {
          "type": "string",
          "description": "per-action payload — block's error message / warn's stderr / inject_context's markdown / rewrite_input's new JSON / run_script's absolute .cjs path"
        },
        "voice_checked": {
          "type": "boolean",
          "default": true,
          "description": "§4.6 + §6 — the body of block/warn messages must also pass the voice linter (Cluster E blameless second-story)"
        },
        "fallback_kind": {
          "type": "string",
          "enum": ["warn", "inject_context", "noop"],
          "description": "degrade target on the 1st violation of tiered_strictness or when fatigue_budget is exceeded"
        }
      }
    },
    "enforcement_level": {
      "type": "string",
      "enum": ["mandatory", "recommended", "advisory"],
      "description": "management §1.10 (Wikipedia 5 pillars + IAR) — mandatory=exit 2 block / recommended=warning / advisory=inject only. Syncs with the §3.3 frontmatter enforcement_level — auto-inherited on promote, explicit override possible in the hook spec"
    },
    "tiered_strictness": {
      "type": "object",
      "description": "canonical §1.5 BRD (Bold-Revert-Discuss) — cost-ascending handling of 1st/2nd/3rd violation. See §4.3",
      "properties": {
        "first": {"enum": ["BOLD", "REVERT", "DISCUSS"], "default": "BOLD"},
        "second": {"enum": ["BOLD", "REVERT", "DISCUSS"], "default": "REVERT"},
        "third": {"enum": ["BOLD", "REVERT", "DISCUSS"], "default": "DISCUSS"},
        "window_turns": {
          "type": "integer",
          "default": 20,
          "description": "violation counting window — tier is judged by the cumulative count within N turns"
        }
      }
    },
    "fatigue_budget_ms": {
      "type": "integer",
      "default": 60000,
      "minimum": 0,
      "maximum": 90000,
      "description": "humanities §1.7 Gawande 60-90s ceiling — the max latency that a single fire of this hook may consume. On exceed, degrade to fallback_kind"
    },
    "temporal_locus": {
      "type": "string",
      "enum": ["in-action", "on-action"],
      "description": "humanities §1.9 Schön — in-action=on-the-spot such as PreToolUse / on-action=after-the-fact such as Stop·PostToolUse"
    },
    "germane_load": {
      "type": "boolean",
      "default": true,
      "description": "Sweller — true=germane (contributes to learning) / false=extraneous (reminder only) — if false, enforcement_level=advisory is enforced"
    }
  }
}
```

The 5 mandatory fields of this schema (`event` + `matcher` + `condition` + `action` + `enforcement_level`) are the hook spec validation target of `plugins/greatpractice/runtime/eg_greatpractice_lint.cjs`. On shortfall, it is a warning during the v0.1 grace period, and a block from v0.2+. The 4 optionals `tiered_strictness` + `fatigue_budget_ms` + `temporal_locus` + `germane_load` are the *quality* dimension of enforcement — if unspecified, the schema defaults apply.

### §4.3 Tiered strictness — BRD escalation (1st BOLD / 2nd REVERT-block / 3rd DISCUSS-Hyperbrief)

The **Bold-Revert-Discuss** of canonical §1.5 (Wikipedia BRD cycle) is borrowed for hook violation handling. The more violations of the same entry accumulate within `window_turns` (default 20), the more the enforcement strength is promoted.

| Tier | violation count | handling | EG mapping |
|---|---|---|---|
| **1st = BOLD** | 1 time | soft reminder — additional guidance via `inject_context` (no block). surface this entry's ratio + how to avoid | Cluster B + canonical §1.5 |
| **2nd = REVERT** | 2 times | exit 2 block + enforce acknowledgment — must add `acknowledged_greatpractice: <id>` to the tool input or choose another path to pass | Cluster B reinforced |
| **3rd = DISCUSS** | 3 times+ | auto-invoke Hyperbrief skill (`hyperbrief-trigger-check`) — compute escalation 4-score + emit 9-section IR form if ≥ 4. Uses the §9.1 boundary | Hyperbrief §1 |

**rationale**: isomorphic to the *cost-tiered revision vocabulary* of §7.4 (distinguish < per-incuriam < overrule) — start from the cheapest reminder, with cost rising as violations repeat. Blocking in a single shot causes false-positives to paralyze work (extraneous load); conversely, always-soft leaves silent drift unattended. The 3-tier ramp is the synthesis of the two extremes.

The default 20 of `window_turns` is half of humanities §1.7 Gawande's short-cycle (60-90s budget × 10-20 fires) + os §1.1 backward-window τ default. mezzo entries keep the default; macro entries are recommended at 50, micro entries at 5 (differentiated by per-tier expected fire frequency).

### §4.4 In-action vs on-action — temporal taxonomy

The **reflection-in-action / reflection-on-action** 2-temporal taxonomy of humanities §1.9 Schön *The Reflective Practitioner* is borrowed for the timing classification of hooks (`temporal_locus` field).

| Classification | event position | characteristic | EG application |
|---|---|---|---|
| **in-action** | PreToolUse / UserPromptSubmit / SessionStart | on-the-spot check *during* work — subject to the Gawande 60-90s budget | outbox-json (Cut 1) / bridge-spawn (Cut 3) |
| **on-action** | PostToolUse / Stop / PostCompact | retrospective *after* work completes — double-loop escalation possible, ample time | Stop hook (existing `pre-send-probe.cjs`) / PostToolUse SSoT diff |

**design principle**: the same practice can hold *both* hooks. e.g. `pre-send-inbound-check` (Cut 2) is dual-locus enforcement of PreToolUse(motion-step) (in-action) just before outbound emit + cycle-end Stop (on-action). For *probe-then-inspect-or-abort* too, the in-action side is the blocking force and the on-action side is the safety net — if one side fails to fire, the other catches it.

in-action hooks are under a hard `fatigue_budget_ms` 60-90s constraint; on-action hooks have *no upper bound — but Stop's total wall-clock is recommended at 5s* (defending turn-end response latency).

### §4.5 Fatigue budget — 60-90s ceiling + killer items only + 5-7 item cap

A synthesis of humanities §1.7 Gawande *The Checklist Manifesto* + false-positive control + Sweller cognitive load. Enforced quantification so that the hook itself does not become a source of *extraneous load* on the work.

**3 constraints**:

1. **A single hook's fire latency ≤ 60s** (default), **≤ 90s** (humanities §1.7 ceiling). On exceed, degrade to `fallback_kind` — usually demoted to `warn`.
2. **A single turn's total in-action hook latency ≤ 60s cumulative**. On exceed, subsequent in-action hooks are forcibly demoted to advisory (`.claude/.hook_latency.jsonl` measurement).
3. **A single event's active matcher count ≤ 5-7 types** — hook-level application of Miller 7±2. On exceed, narrow is enforced via path_scope intersection.

**killer items only**: enforcement_level=mandatory is only for items that *must be blocked* — both `cost_of_missing ≥ 4` (the cost axis of the §5.1 5-axis maturity score) + `predictability ≥ 4` satisfied simultaneously. Items that do not meet this are forcibly demoted to recommended (warn) or advisory (inject only).

**false-positive control**: only the **AND intersection** of `matcher.input_pattern` (keyword regex) and `matcher.path_scope` (path glob) fires. keyword-only matching is the cause of false-positive floods — if the same keyword appears in a different path region (e.g. historical reference in `_archive/`), it does not fire. The lint PR-time warns on a mandatory hook with `path_scope: []` (workspace-wide).

**Sweller 3-type load decomposition**: only a hook with `germane_load: true` can be mandatory. A pure reminder (`germane_load: false`) has its enforcement_level auto-demoted — if a hook with no learning contribution is pinned as mandatory, the work itself learns the hook-avoidance path (poka-yoke trap, management §4.8).

### §4.6 Voice-check — hook block messages must also pass the lint

When Cluster B (deterministic enforcement) and Cluster E (blameless second-story) apply simultaneously, if the hook's block/warn message itself has a blaming tone it violates Cluster E. A self-contradiction where the *means* of enforcement breaks the *content* of enforcement. The detailed voice discipline + linter spec + blocked patterns = **§6 (canonical)**.

This §4.6 specifies only the voice-check entry point of the hook spec: `action.voice_checked: true` (default) — the body of the block payload + warn payload must pass the blameless lint of `plugins/greatpractice/runtime/eg_voice_check.cjs` (§6.3 regex MVP). For the voice spec of the 3-tier escalation messages (BOLD/REVERT/DISCUSS), see §6.4.

The 4-section template of §6 (Voice & Framing) (objective / second story / multi-causal / codification target) is the reference for writing hook payloads — structure with the 4 sections when a block payload grows long.

### §4.7 Sweller cognitive load — intrinsic / extraneous / germane decomposition

Explicit quantification is needed so that Greatpractice itself does not become *extraneous load*. The 3-type load classification of Sweller (1988) *Cognitive Science* is borrowed as the ceiling of hook design.

| Load type | definition | hook application |
|---|---|---|
| **Intrinsic** | the essential complexity of the work itself — element interactivity | a hook cannot reduce it; but it can partially mitigate via sequencing (motion-step type) |
| **Extraneous** | load incurred by careless hook design — false-positives, blaming tone, over-injection | **the primary minimize target of hook design** |
| **Germane** | load contributing directly to schema-building + automation — convertible to learning | **the sole justification for a mandatory hook** |

**design rule**: only a hook with `germane_load: true` can be enforcement_level=mandatory. A hook with `germane_load: false` is auto-demoted to advisory. This classification is enforced at schema-time by `plugins/greatpractice/runtime/eg_greatpractice_lint.cjs` — the mandatory + germane=false combination is lint-blocked.

**7 disciplines for avoiding extraneous**:

1. **enforce path_scope** (§4.5) — block false-positives via keyword × path AND intersection.
2. **specify negative_examples** — examples of inputs that must NOT fire, in `condition.negative_examples`.
3. **fatigue_budget cap** (§4.5) — measure cumulative load with the 60-90s ceiling.
4. **voice-check** (§4.6 + §6) — so that a blaming tone does not act as cognitive distraction.
5. **tiered_strictness ramp** (§4.3) — start from a BOLD reminder instead of blocking from the 1st.
6. **specify temporal_locus** (§4.4) — budget the ceiling of in-action and the leeway of on-action differently.
7. **measure post-codify hit-rate** (§7.3) — if extraneous false-positives accumulate, the enforcement_level is auto-demoted.

**germane preservation principle**: for the schema to contribute to learning, the hook payload must include both *why this rule* (rationale) + *how to avoid* (alternative). A plain "blocked: violation detected" message only adds extraneous — germane 0. When writing the block payload, borrow the §6 4-section template (objective / second story / multi-causal / codification target) to secure germane.

**EG dogfood evidence** (operational observations): the 4 items outbox-json-validation + pre-send-inbound-check + session-resume-bridge-spawn + a2a-relay-reliability are the v0.1 dogfood entries for the 3 events PreToolUse + Stop + SessionStart among the 7 hook events of this §4 — the first cut to pass the §5 maturation gate (P0 ratified). Immediately after the schema of this §4 ships, these entries enter deterministic enforcement via their frontmatter `trigger` field + `plugins/greatpractice/hooks/{contact,fixed-value,motion-step}/*.cjs`.

---

## §5. Maturation Gate — raw → draft → ratified

> This § covers under what conditions a "single event that happened once" is finally promoted to a *canonical practice*. Defining the gate on the single axis of frequency forms a *false consensus* — it appears that 5 axes reached the same conclusion, but in reality each presented a gate on a *different dimension*, and the synthesis is the result of collapsing that into frequency. This § unwinds that collapse and reformulates it across 6 layers: **5-axis multi-criteria gate** + **3-criterion notability** + **phronesis boundary** + **routing rule** + **redirect stub** + **post-promote probation**.

---

### §5.1 5-axis multi-criteria maturity score

The `1 time=raw / 3 times=draft / 4 times+=ratified` rule that Appendix A Cluster D superficially marked as *5-axis consensus* is — the result of collapsing into frequency what the 5 axes actually presented as gates on *different dimensions*. Unfolding the dimension of each of the 5 axes:

| Axis | Source | Actual dimension |
|---|---|---|
| canonical §1.2 | Wikipedia Notability | *coverage depth* (≥ 3 significant) |
| humanities §3.9 | phronesis-codify-boundary | *frequency × cost × predictability* product |
| processor §1.7 | RRIP `rrpv` | *recurrence recency* (ephemeral default → promote on 1st recurrence) |
| sre §1.2 | toil 6-rubric | *cost & predictability score* |
| psychology §1.10 | Lally 66-day | *time accumulation* (≠ count) |

Since the 5 axes address different dimensions, maturity is defined not as a single counter but as a **weighted multi-criteria score**:

```yaml
maturity_score: w_f·frequency + w_d·depth + w_r·recency + w_c·cost + w_p·predictability
weights (v0.1 default):
  w_f: 1.0   # cumulative occurrence count (simple count)
  w_d: 3.0   # significant coverage depth (passing mention vs substantive)
  w_r: 2.0   # recent recurrence (inverse of rrpv, recency boost)
  w_c: 2.0   # cost-of-missing (silent drop / drift / damage to external collaboration)
  w_p: 1.5   # predictability-of-trigger (regular vs wicked environment)
threshold:
  promote: maturity_score ≥ 18
  OR (frequency ≥ 3 AND independent_triggers ≥ 2 AND verifiable_effect)
```

The 0-5 scale of each axis + default weight (v0.1 = uniform 1.0 baseline + the listed overrides above):

| Axis | Meaning | Source |
|---|---|---|
| **frequency** | occurrence count (3+ = candidate to enter the canonical §1.2 notability gate) | canonical §1.2 |
| **depth** | significant coverage depth — a plain 1-line mention 0, a substantive analysis 5 | canonical §1.2 (the Wikipedia notability significant-coverage dimension) |
| **recency** | recent occurrence — time-decay (based on last_referenced_turn) | psychology §1.10 + os §1.1 |
| **cost** | cost of missing — cost of silent drop / churn / broken external collaboration | humanities §3.9 (cost-of-missing axis) |
| **predictability** | predictability of trigger — high = JSON validation, low = phronesis-adjacent judgement | humanities §3.9 (predictability axis) |

The OR clause is the fallback for *single-axis dominance* — promote is possible even when a strong signal comes from one axis (a direct instantiation of canonical §1.2). A promote that passed only via a single axis is verified more strictly in the §5.6 probation.

Each weight is subject to auto-tuning after P2 statistics accumulate (cross-axis P2 roadmap — weight learning after 30+ cycles).

---

### §5.2 Notability gate — 3-criterion (significant + independent + verifiable)

A hard gate that operates *separately from* the maturity score. A synthesis of canonical §1.2 (Wikipedia Notability) + the refinement of the definition of independent triggers:

| Criterion | Definition | EG measurement |
|---|---|---|
| `significant_coverage` | ≥ 3 substantive occurrences (excluding passing mention) | ≥ 3 appends to the body of `feedback_*.md` + each append a distinct context |
| `independent_triggers` | ≥ 2 *distinct coordinates* | ≥ 2 distinct coordinates of the (work-domain × phase × time-of-day) 3-axis |
| `verifiable_effect` | recovery effect is measurable | quantitative metric defined + baseline ≠ post-codify measurement |

**core refinement**: "repeated 3 times within the same task" is 1 type of trigger. independent triggers must differ in their *axis coordinate* — e.g. if an `outbox JSON validation` miss occurs:
- (release-cadence × N-way-sync-phase × evening) 1 coordinate + (a2a-coordination × inbound-probe-phase × morning) 1 coordinate → **2 types ✓**
- (release-cadence × N-way-sync-phase × evening) repeated 3 times → **1 type ✗**

The 3-axis coordinate definition borrows the *context cue* definition of psychology §1.7 ACT-R production rule — if a production rule fires in a different context, it is a different coordinate.

**verifiable_effect**: whether the quantitative check of `(post-codify) hit-rate ≥ (pre-codify) recurrence-rate` is possible. measurable = ✓, not measurable = ✗. For the detailed validation mechanism = §7.3.

---

### §5.3 Phronesis-codify-boundary — the region NOT to codify

A direct instantiation of humanities §3.9 + §1.12 (Aristotle phronesis + Polanyi tacit knowing) (for the concept definition, see §1.4). Even if *frequency × cost × predictability* passes the threshold, if the region itself is phronesis-heavy then no hard rule.

**The conditions under which the phronesis_boundary flag activates** (satisfy ≥ 2 of the three):
- **rare context**: the occurrence coordinate is in the long tail of work phases (cumulative frequency below 10%).
- **high context-dependence**: even the same surface behavior has meaning strongly dependent on context (e.g. the priority of "outbound A2A first" differs by the meaning of the state-change).
- **judgement-heavy**: outcome evaluation does not reduce to a single metric (multi-stakeholder trade-off).

A `phronesis_boundary: true` entry, even when codified:
- allows only `enforcement_level: advisory` (mandatory blocking forbidden).
- the hook's fire mode = `additionalContext inject only` — no use of block / require-acknowledgement.
- preserves the authority of on-the-spot judgement (Polanyi limit: fully explicit knowledge is impossible — some part must always remain in the agent's instinct).

This boundary is the mechanism by which *Greatpractice makes its own limits explicit*. Same way as the MUST-trigger specification of Hyperbrief.md §1 — a self-declaration that "some decisions Greatpractice *does not decide on your behalf*".

---

### §5.4 Routing rule — 1 time / 3 times+gate / phronesis+approval

A 4-stage routing refined via 5-axis synthesis from the operational observations of the phase_3 cycle (EG dogfood evidence — 11 items accumulated):

```
[new event occurs]
    ↓
[1 time] → memory/feedback_<slug>.md (raw capture — Schön golden moment)
        - minimal frontmatter: trigger, timestamp, trigger_source
        - lifecycle: probation
        - rrpv: max-1 (ephemeral default, processor §1.7)
        - enforce voice-check.cjs blameless framing (§6 Cluster E)
        - eager-capture justification: cost 0 + use the golden moment of Schön reflection-in-action (psychology §3.5)
    ↓
[+subsequent occurrence] → append to the illustration section of the same feedback
        - rrpv: 1 promote on recurrence
        - increment significant_coverage counter (substantive appends only)
        - record the (work-domain × phase × time-of-day) coordinate of each append
    ↓
[reaches 3 times AND passes §5.2 gate] → auto-generate greatpractice/_propose/<slug>.draft.md
        - notability-gate 3-criterion auto-check:
          (a) significant_coverage ≥ 3 ✓
          (b) independent_triggers ≥ 2 types (verify coordinates are distinct) ✓
          (c) verifiable_effect (metric definable?) ✓
        - draft if all three criteria pass; on failure, remain in memory + keep accumulating the counter
    ↓
[draft stage] → review by maintainer or Hyperbrief revisit
        - evaluate phronesis-codify-boundary (§5.3):
          if phronesis_boundary=true → ratify as enforcement_level=advisory
          if phronesis_boundary=false → decide enforcement_level (mandatory|recommended|advisory)
        - additional verify maturity_score ≥ 18 (§5.1 weighted sum)
        - approval → ratify, reject → remain in _propose/ (specify resolution condition) or archive
    ↓
[ratified] → greatpractice/{macro|mezzo|micro}/<slug>.md
        - tier decision (see §2 tier classification criteria):
          - macro: domain governance (5-10 ratio rule)
          - mezzo: procedure (most go here)
          - micro: atom (executable, command/check/decision)
        - full frontmatter (the entire §3 schema — Cluster C 9/9 consensus)
        - replace memory/feedback_<slug>.md with the §5.5 redirect stub
        - lifecycle: probation → start the 90-day hit/miss counter (§5.6)
```

4 core refinements:

1. **1 time = raw capture + enforce blameless framing** (§6 Cluster E). Immediate capture, but if the voice is self-defensive, narrative fidelity is lost.
2. **3 times ≠ auto draft**: 3 times + pass 2 types of independent context + verifiable effect (§5.2 hard gate). 3 times at the same coordinate is 1 type of trigger.
3. **4 times+ ≠ auto ratify**: pass phronesis + maturity_score ≥ 18 + approval. No deletion of the original — §5.5 redirect stub.
4. **probation even after promote**: 90-day hit/miss counter (§5.6).

The resolution of the eager vs wait contradiction (Appendix A) is *staged deferral* — capture eager (cost 0), promotion deferred (after passing the gate).

---

### §5.5 Redirect stub mechanism — canonical Wikipedia Merge

If the original `memory/feedback_<slug>.md` is *deleted* after promote, cross-references in other entries / docs / commit logs break — canonical §1.3 (Wikipedia Merge 4-Phase) + §2.4 (cross-domain redirect pattern) present the explicit avoidance mechanism.

**Stub form** (1 line):

```markdown
# Promoted → see EstreGenesis/greatpractice/<tier>/<slug>.md
```

**Stub authoring obligations** (canonical §1.3 Phase 4):
- *keep the original file location* (path as-is). Replace only content with the 1-line stub.
- commit message attribution: `chore(memory): promote feedback_<slug> → greatpractice/<tier>/<slug>` form — preserve the authorship/history chain (isomorphic to the CC-BY-SA attribution obligation).
- forbid double-redirect: if the ratified entry the stub points to is redirected again elsewhere, resolve immediately.

**3 roles of the stub**:

1. **Reference preservation**: the `see also feedback_<slug>` links in other feedback / docs / commits do NOT break.
2. **Search hit redirect**: even if a grep / index search hits the stub, redirect immediately to canonical (isomorphic to the SO duplicate banner).
3. **Historical link**: avoid breaking the evolution-history graph (Cluster H + management §1.3 TPS supersedes).

**No deleting the stub**: deleting the stub itself breaks the redirect. If archiving is needed, move to `_archive/` + record the stub path in the `supersedes:` field of the ratified entry frontmatter.

The promote of `feedback_outbox_json_validation.md` → `greatpractice/mezzo/outbox-json-validation.md` is the first reference-implementation candidate of EG (§11 dogfood Item 1).

---

### §5.6 Post-promote probation — 90-day hit/miss counter

Being ratified does not mean immutable. A synthesis of psychology §1.10 (Lally 66 days + 14× sigma variation) + sre §1.6 (PRR staleness) + canonical §1.11 (freshness revisit):

**Probation period**: 90 days = Lally average 66 days + 30-day buffer (variability correction). During this period the entry is in `lifecycle: probation` state.

**2 measured metrics**:

| metric | definition | decision |
|---|---|---|
| `hit_count` | the hook fired and actually succeeded in blocking/detecting a violation | accumulation ↑ = entry effect verified |
| `miss_count` | the hook did not fire but a violation occurred (discovered post-hoc) | accumulation ↑ = entry coverage gap |

**Decision matrix at the 90-day endpoint**:

| hit | miss | result |
|---|---|---|
| ≥ 5 | ≤ 2 | promote to `consolidation` — reduce verbose output, silent execution OK (psychology §3.5 Lally Stage 2) |
| ≥ 1 | 0 | extend `probation` by 1 cycle — signal sparse, more observation needed |
| 0 | 0 | `cold eviction` candidate — candidate to move to `_archive/` (§7.6 + memoization §3.5 — but the redirect stub is preserved) |
| shortfall | > N (threshold tuning) | `revise` or promote `enforcement_level` (mandatory ↑) — when the coverage gap is large |

**At the completion of 90 days + an additional 90 days (180 days total)**: `consolidation` → promote to `automatic` — Lally Stage 3 silent execution + periodic audit only (psychology §3.5).

**Freshness measurement during probation**: integrated with §7's `last_validated_at` + `validation_cadence_days` — probation = strong validation cadence (e.g. 30 days), post-consolidation = weak cadence (90 days/180 days).

**Revise / Retire decision vocabulary** (§7.4 cost-tiered vocabulary — borrowed from humanities §1.2):
- **distinguish**: do not apply to this coordinate only, the rule itself stays valid — the cheapest revision.
- **per-incuriam**: the rule was made in a flawed state, demote to weak authority — downgrade to `enforcement_level: advisory`.
- **overrule**: discard the entire rule — the most expensive revision, requires explicit justification + prior assessment of cascade impact (avoid the humanities §4.1 instability cascade).

The base default is *distinguish first* — Shleifer 2007's *overruling instability cost* is the largest cost (humanities §4.1).

---

### §5.7 Anti-pattern avoidance summary

| Anti-pattern | Occurrence condition | Avoidance mechanism |
|---|---|---|
| false frequency consensus | promote via plain count | §5.1 5-axis weighted score + §5.2 3-criterion gate |
| premature codification (humanities §4.1) | promote on insufficient data in a wicked region | §5.3 phronesis_boundary + §5.6 stricter verification of single-axis-passed probation |
| zombie rule (humanities §4.2) | weak authority lingering without explicit retire | §5.6 90 days + revise/retire vocabulary + explicit `superseded_by:` |
| premature consolidation lock-in (psychology §4.9) | identity-level enshrinement | macro tier's explicit review cadence + §5.6 freshness revisit |
| broken cross-reference (canonical §4.x) | delete the original on promote | §5.5 redirect stub obligation + double-redirect detection |

---

*Cross-references*: §2 (tier classification criteria) · §3 (entire frontmatter schema) · §4 (hook taxonomy + enforcement_level application) · §6 (voice framing / blameless linter) · §7 (freshness cadence + cold eviction).

---

## §6. Voice & Framing — blameless second-story

> The **voice and framing (narrative structure)** of a Greatpractice entry is not a mere stylistic preference but a *prerequisite* for codification quality. Feedback written in a self-defensive tone has its narrative fidelity damaged, and a procedure extracted from a damaged narrative attaches a hook to the symptom rather than the root cause, mass-producing false-positives or missed-recurrence. This §6 defines, grounded in a 4-axis cross-domain consensus, the mechanism that enforces blameless second-story framing simultaneously across the 3 surfaces of entry-level + lint-level + hook-message-level.

### §6.1 Cluster E — 4-axis cross-domain consensus

This voice discipline corresponds directly to **Cluster E "Blameless Second-Story Framing"** of the 9-axis cross-axis synthesis (Appendix A Cluster E). The 4 axes derived the same conclusion with different vocabularies.

| Axis | Source | Core proposition |
|---|---|---|
| **sre** | Allspaw 2012 + Dekker 2012 (`sre §1.3`) | *second story* — "with the information / pressure / signals that engineer had at that time, that decision looked reasonable." Just Culture 2 axes: ask *what went wrong*, do not ask *who fucked up*. not removal of accountability but its *relocation*. |
| **management** | Kerth 2001 *Project Retrospectives* (`management §1.9`) | **Prime Directive**: "Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand." |
| **humanities** | M&M conference guard clause (`humanities §1.5`) | the codification ritual of medical M&M (Morbidity & Mortality) — *"avoid degeneration into blame culture, frame only as system patterns"* is the core discipline. on individual attribution the narrative closes instantly. |
| **psychology** | Schön reflection-in-action (`psychology §3.5`) | the *golden moment of learning* closes under a self-defensive tone. the reason immediate capture is valuable is *unfiltered fidelity* — before the defensive overlay forms. |

**Consensus proposition**: blame voice → information hold-back → damaged narrative fidelity → root cause not reached → codification covers only the symptom → recurrence. This cascade is observed in the same form across all 4 axes. That is, voice is not *cosmetic* but *epistemic* — it determines the truth content of the entry.

### §6.2 4-Section Template

The *trigger* or *rationale* section of every mezzo / macro tier entry holds the following 4 sections by schema enforcement (`sre §1.3 + §3.10` `blameless-second-story-template`).

```yaml
framing:
  objective: |
    What signal / event / lapse was observed. Avoid outcome-bias — forbid
    hindsight vocabulary from the result-already-known vantage. Chronological
    order + observable signals only (timeline · in minutes or in turns).
  second_story: |
    How, with the information · pressure · context held at that moment, the
    decision/path looked reasonable. "given what we knew at the time" clause
    obligated (Kerth Prime Directive). The goal is to *restore* the
    reasonableness of on-the-spot judgement, not *defend* it — §6.3 voice linter distinguishes.
  contributing_factors: |
    multi-causal decomposition. Forbid single-root-cause vocabulary (§6.3
    blocked pattern L5). Avoid the 4 limits of Five Whys (`sre §1.10` Minoura)
    — single causal, investigator-knowledge limit, non-repeatable, symptom
    stalling. Minimum 2 contributing factors obligated, ≥ 3 recommended.
  codification_target: |
    To which surface (mezzo procedure / micro atom / hook spec / freshness
    cadence) it will be reflected and how. Specify owner + tracking + priority
    — the action-item discipline of Google SRE Ch.15 (`sre §1.4`). Forbid
    vague actions of the "review the docs" kind.
```

The micro tier (executable atom) is exempt from the 4-section enforcement — for an atom, the command/check/decision itself is the body (`sre §3.1 runbook-as-code`). However, the mezzo parent that *generated* the atom holds the 4 sections, so the lineage is preserved.

The raw memory stage (`memory/feedback_*.md`, 1-time capture) is a *lightweight variant* of the 4 sections — only objective + second_story are obligated, the rest are filled in at promote time. Prioritize securing the *unfiltered fidelity* of the Schön golden moment (`psychology §3.5`).

### §6.3 Voice Linter (regex MVP, v0.1)

`plugins/greatpractice/runtime/eg_voice_check.cjs` applies the following regex patterns to the entry body + frontmatter. The v0.1 MVP is not a deterministic block (exit 2) but a **warning + alternative suggestion** — after accumulating false-positive correction cycles, it is promoted to mandatory in v0.2 (same pattern: the promote-cadence of outbox-json-validation).

| ID | Blocked pattern (regex) | Meaning | Recommended alternative |
|---|---|---|---|
| L1 | `(?:agent|에이전트|claude|assistant)\s*(?:failed|missed|forgot|놓쳤|빠뜨렸|잊었)` | individual-attribution failure verb | "procedurally ... was lapsed" (passive + system attribution) |
| L2 | `(?:should\s*have|했어야|했었어야|했었어야 했)` | hindsight obligation | "with the information at that time X looked reasonable, and had there been an additional signal Y it would have gone to Z" |
| L3 | `(?:sloppy|careless|negligent|부주의|소홀|태만)` | personal-blame vocabulary | "absence of a forcing function at procedure step N" (structural attribution) |
| L4 | `(?:obviously|당연히|뻔히|명백히|trivially)` | post-hoc obviousness (hindsight justification) | delete — if it were obvious the lapse would not have happened (`sre §4.7`) |
| L5 | `^(?:root\s*cause|단일\s*원인|the\s*reason)\b` | single-causal vocabulary (violates the multi-causal obligation) | decompose into "contributing factors: [...]" |
| L6 | `(?:always|never|모든\s*경우|언제나|절대)\s+(?:must|should|해야|하지\s*말)` | absolutized command (possible phronesis-codify-boundary violation) | specify enforcement_level + applicable scope (`management §1.10`) |
| L7 | `(?:user|사용자)\s*(?:said|told|wanted|원했|시켰|지시했)` | governance attribution (public-repo redaction violation) | "operational observations" / "phase_N cycle evidence" / "dogfood observation" |
| L8 | (chat verbatim quotation detection: quote marks + 30+ chars + 1st-person utterance marker) | verbatim from a private source | restate as a technical proposition (paraphrase + abstraction) |
| L9 | `(?:we\s*all\s*know|everyone\s*knows|누구나\s*알|다들\s*알)` | shared-knowledge assumption (audience-profile violation) | explicit context or cross-ref `§N.M` |
| L10 | `(?:fortunately|luckily|다행히|운\s*좋게)` | luck framing (avoids systematic codification) | "the surface up to the current point catches X — re-verify staleness after Y cycles" |

**Linter behavior**:
- input: entry frontmatter + body markdown.
- output: `{ violations: [{id, line, snippet, suggestion}], passed: boolean }`.
- v0.1 enforcement_level = `advisory` (warning, append `voice_lint_violations: [...]` to frontmatter, hook does not fire).
- v0.2 promotion gate: after measuring false-positive rate < 10%, `recommended` for mezzo entries (PreToolUse warning). In v0.3, `mandatory` (exit 2 block) for macro tier only.

**Intent classification extension path (v0.2+)**: regex alone cannot separate "defense vs restoration" (the core distinction of §6.2 second_story). In v0.2, an LLM-as-judge sub-call or a sentence-level classifier is a candidate for introduction — the Greatpractice module itself becomes the training corpus of a self-hosted classifier (eval-first skill authoring, `harness §3.5`). But at the v0.1 stage, in the regex MVP **a false positive is safer than a false negative** (warning only, no block) — avoid over-engineering (`sre §4.4`).

### §6.4 Voice-Check of the Hook Block Message (Cluster B ∩ Cluster E)

Cluster B (deterministic hook enforcement) and Cluster E (blameless framing) must apply simultaneously. If the hook block message itself violates the entry's voice discipline, a contradiction arises where the entry body is blameless but the user-facing surface induces a self-defensive cascade.

**Discipline**:
1. **Every hook block message is subject to the §6.3 voice linter**. The text that the plugin manifest's `hooks/*.cjs` emits as stderr / additionalContext is both lint-at-author-time + runtime sanity check.
2. **Voice spec of the 3-tier escalation messages** (synthesized with canonical §1.5 BRD, §4.3 tiered strictness):
   - **Tier 1 (BOLD soft reminder, additionalContext inject)**: collaborator tone. "There is a procedure X relevant to the current work — see §N.M." no block. blame vocabulary 0.
   - **Tier 2 (REVERT block + acknowledge)**: structural tone. "forcing-function step Y of procedure X is unmet — include `acknowledged_greatpractice: <id>` in the tool input to proceed." attribute to the procedure, not to the agent.
   - **Tier 3 (DISCUSS + Hyperbrief auto-trigger)**: escalation tone. "3 consecutive violations — Hyperbrief IR auto-fires (4-score escalation MUST trigger). retry after decision delegation." specify only the violation *count*, no *responsibility attribution*.
3. **Avoid PRR's "audit degeneration"** (`sre §4.9`): the hook message tone is *collaborator*, not *blocker* — so that the agent / maintainer does not want to bypass the hook.
4. **temporal taxonomy consistency** (`humanities §1.9` Schön): the message of an *in-action* hook (PreToolUse) = a read-do form within the Gawande 60-90s budget (`humanities §1.7`), no prose — the atomic 3 elements of procedure step + check + decision. the message of an *on-action* hook (Stop / PostToolUse) = double-loop possible, 4-section template applicable.

**Implementation**: `plugins/greatpractice/runtime/hook-message-lint.cjs` — apply voice-check both at manifest build time (PreToolUse hook author-time) + at runtime emit time. If author-time lint fails in CI/pre-commit, the plugin merge is blocked (mandatory).

### §6.5 User-Action Surfacing — no Passive Idle-Wait

In a multi-agent collaboration cycle, when progress is blocked on an *action only the maintainer can take* (redirect-instruct another agent, grant tool access, restart infra, manual sign-off), there is an obligation to **explicitly surface that dependency with "needs your action" framing**. Burying it inside a passive idle-wait summary ("monitoring inbox", "awaiting response") is itself a voice-discipline violation.

**Grounds**:
- A2A communication priority (Appendix A Cluster B + dogfood evidence): when a state change accompanies outbound, that message + its prerequisite work is FIRST before local-only. The maintainer-blocking dependency is isomorphic — if its surface is *deferred*, the isomorphism of counterpart start-time minimization breaks on the user's side.
- The *honest mistake / negligence* distinction of Just Culture (`sre §1.3` Dekker): not surfacing a maintainer-action dependency is not an honest mistake but procedural negligence — a deprivation of agency.
- The Three Cs of ICS (`sre §1.7`): *Coordinate · Communicate · Control* all presume information flow. When the maintainer is in the IC role, not surfacing a dependency is a coordinate failure.

**Schema**: when an entry or cycle-end probe detects a maintainer-action-blocked state, emit the following frontmatter / message structure:

```yaml
needs_user_action:
  blocking_dependency: |
    What is blocked (technical surface + why only the maintainer can do it).
  options_for_user:
    - id: opt-a
      action: "instruct another agent X to do Y"
      consequence: "cycle resumes, surface after ~N turns"
    - id: opt-b
      action: "restart infra Z"
      consequence: "bridge respawn, immediate"
  if_no_response_in: "N hours OR M cycles"
  fallback: "automatic fallback path when no response (proceed local-only or retire)"
```

**Voice-discipline application**:
- "needs your action" framing obligated — forbid *"waiting for user"* (passive), use *"one of these N maintainer decisions is the prerequisite for cycle resumption"* (active dependency naming).
- specify options — forbid open-ended questions, 2-3 explicit options + a predicted outcome for each (isomorphic to the 9-section IR pattern of Hyperbrief §1, a lightweight variant of escalation score < 4).
- specify timeout — automatic fallback path when no response + retire / Hyperbrief escalation branch.

**Hook integration**: when the Stop hook (`pre-send-probe.cjs --rearm`) detects an entry's `needs_user_action` field or a maintainer-blocking signal in the inbox at the cycle-end probe stage, promote it to a *meaningful surface* — the last paragraph of the turn-end assistant text is forced into a needs-your-action block (consistent with the Stop hook's cycle-end extension).

---

**Voice-discipline summary** (1-liner for cross-ref): blameless second-story 4-section template (§6.2) + 10-pattern regex linter (§6.3) + 3-tier hook message voice spec (§6.4) + needs-your-action surfacing schema (§6.5) — simultaneous application across 4 surfaces secures voice consistency of entry · lint · hook · cycle-end. The 4-axis (sre + management + humanities + psychology) consensus (§6.1) is the architectural justification.

---

## §7. Freshness & Lifecycle Cadence

> For a codified practice to remain a *living norm*, staleness must be auto-detected and revisit / revise / retire must be formalized. Timestamp alone is insufficient — *effect measurement* (post-codify hit-rate ≥ pre-codify recurrence-rate) is the true definition of freshness. This § specs out the entire lifecycle of the cadence default + cost-tiered revision vocabulary + inheritance + cold eviction derived from a 5-axis consensus.

### §7.1 Cluster F consensus — 5 axes, same conclusion

Freshness/staleness validation is a strong convergence where 5 of the 9 axes independently reached the same conclusion (Appendix A Cluster F):

| Axis | Pattern | Conclusion |
|---|---|---|
| sre | `staleness-validation-cadence` | Continuous PRR (Visser) — 6-month re-review obligation, "systems change, traffic patterns shift" breaks the immutable-spec myth (Google SRE Ch. 32) |
| canonical | `freshness-revisit-cadence` | the cross-domain isomorphism of Wikipedia stale article + SO outdated answer + GitHub README drift — `freshness_until` + `freshness_axis` on every entry |
| management | `standard-as-kaizen-baseline` | TPS's "standard = kaizen baseline, not enshrinement" — 12-week freshness window (Ohno) |
| humanities | `cost-tiered-revision-vocabulary` | distinguish / per-incuriam / overrule 3-tier ascending cost (Shleifer-Vishny-Mullainathan 2007 §1.2) |
| memoization | `hit-rate-telemetry-cold-eviction` | archive candidate for a 90-day cold entry (Bellman 1957 + Bazel content-addressed) |
| (processor) | `rrip-style-default-rrpv` | retire queue when unused for 14 days — a micro-scale version of the same motif (Jaleel et al. ISCA 2010) |

5 domains + 1 secondary differ in *detailed figures* but are unanimous on *the necessity of cadence itself*. EG application priority **P1** — the §3 frontmatter schema is the prerequisite, and it can go live immediately after the schema stabilizes.

### §7.2 cadence_days default — exponential per-tier defaults

Synthesizing the median of the 5 axes (humanities §1.6 M&M monthly / sre §1.6 6-month PRR / canonical §1.11 Wikipedia various / processor §3.2 14 days RRPV / memoization §3.5 90-day cold) yields a per-tier exponential cadence:

| Tier | `cadence_days` default | Justification |
|---|---|---|
| **micro** | 30 | atom (command / check / decision) — most sensitive to external tool / API / path changes. micro-instrumentation of the M&M monthly cycle |
| **mezzo** | 90 | procedure — mid-level workflow within a domain. memoization 90-day cold + the mezzo-scale projection of processor RRPV |
| **macro** | 180 | governance / telos / domain-level ratio rule — Continuous PRR 6 months (Visser §1.6 sre) + the Restatement update cycle (humanities §1.3) |

```yaml
# entry frontmatter (§3 schema excerpt)
freshness:
  last_validated_at: 2026-06-04T00:00:00Z
  cadence_days: 90              # tier default or explicit override
  axis: api-surface             # what, if it changes, makes it stale (optional)
  next_due_at: 2026-09-02T00:00:00Z   # computed from cadence_days, build-time check
```

**override allowance condition**: a fragility=high (external API / SDK dependent) entry may explicitly override shorter than the default (e.g. 14d), and a kaizen-baseline-stable entry longer than the default (e.g. 365d). On override, a 1-line `freshness.rationale:` is enforced (the audit trail of canonical §1.5 BRD).

### §7.3 Validation mechanism — not timestamp but effect measurement

A timestamp check of plain `now - last_validated_at < cadence_days` alone makes for a weak freshness definition. *Whether the codified practice actually works* — the effect measurement — is the true definition.

**Quantitative definition**:

```
(post-codify) hit-rate ≥ (pre-codify) recurrence-rate
```

- **pre-codify recurrence-rate**: the *repeat-occurrence frequency* observed while the entry was at the `_propose/` stage (e.g. 3 silent drops in 30 days).
- **post-codify hit-rate**: the frequency at which, after the entry was promoted, *the hook fired normally + actually blocked/warned a violation*. PostToolUse hook fire count + bypass-acknowledged count.

**Prescription when the inequality is violated**:

| Pattern | Diagnosis | Prescription |
|---|---|---|
| hit-rate < recurrence-rate | the hook fails to catch the trigger or the model bypasses it | revise the hook spec (check the humanities §1.7 Gawande fatigue budget) + promote `enforcement_level` (advisory → recommended → mandatory) |
| hit-rate ≈ 0, recurrence-rate ≈ 0 | no longer occurs due to environment change | cold eviction candidate (§7.6) |
| hit-rate > recurrence-rate exceeded | the hook noise-fires (false-positive) | narrow the hook condition + refine the `trigger.if` schema |
| hit-rate ≥ recurrence-rate ≈ good | effect proven | promote to `lifecycle: automatic` (psychology §1.10 Lally 66-day model) + cadence may be relaxed |

**Evidence accumulation channel**: micro's hook fire count is auto-collected via the operational-state streams `collab/practice_refs.jsonl` (backward-window) + `collab/shct.json` (trigger-source attribution). At each validation cycle, the build-time aggregator (`runtime/freshness-check.cjs`) updates the entry frontmatter's `metrics.hit_count` / `metrics.recurrence_count` fields.

### §7.4 Cost-Tiered Revision Vocabulary

The vocabulary for *how to revise* after detecting stale borrows the legal 3-tier of humanities §1.2 verbatim. ascending cost — the cheapest distinguish is the default, and overrule is the last resort due to cascade risk (a direct citation of Shleifer-Vishny-Mullainathan 2007's *Overruling and the Instability of Law* + `humanities.md` §4.1 instability cascade pitfall). This § is the canonical spec of the vocabulary's *meaning + selection guide* — for the `revision_history[].cost_tier` enum notation in frontmatter see §3.4, and for the revise/retire decision application of post-promote probation see §5.6.

| Vocabulary | Meaning | cost | scope | redirect stub? |
|---|---|---|---|---|
| `distinguish` | do not apply this context only, the rule itself stays valid — recommended for `coherence: soft` items | low | single phase / single task region | keep original + new entry does NOT register `supersedes: [original id]` (both valid) |
| `per-incuriam` | this entry was made by lapse / carelessness — weak authority lingers, queued as a deprecation candidate. mark `staleness.attestation: per_incuriam` then a 90-day grace window | medium | warning surface on derived surfaces, advisory tone for new callers | move original → `_archive/` + specify `superseded_by` |
| `overrule` | discard the rule itself — replace with a new entry (`supersedes:` chain). obligated to update all derived surfaces simultaneously (Cluster H) | high | global, cascade risk → triggers the 3rd-tier of §4.3 BRD tiered escalation | original → redirect stub (canonical §1.3 Wikipedia Merge) + enforce `superseded_by` |

```yaml
# frontmatter delta on revision
supersedes:
  target: outbox-json-validation-v1
  mode: distinguish          # distinguish | per-incuriam | overrule
  rationale: "bash HEREDOC issue only in legacy zsh path; new node script bypass"
  applies_to: "phase=legacy-zsh-path"   # required in the case of distinguish
```

**Selection guide**:
- schema non-compliance = aggressive prune (canonical §1.12) — not a distinguish target, retire immediately.
- context change / external-condition evolution = cost-tiered (humanities §1.2) — distinguish first.
- on contradiction accumulation, Justinian moment (humanities §1.4) → consolidating codification → create a new macro tier entry, with the existing mezzo/micro becoming redirect stubs.

### §7.5 Freshness inheritance — a derived surface inherits the master's freshness

Synthesizing with Cluster H (SSoT propagation) — the freshness of a derived surface (badge / docs hero / plugin.json / marketplace.json etc.) *inherits* the freshness of the master entry. If the derived side has its own cadence, it violates the SSoT principle + recurs the 16× update-lapse incident (release-versioning-cadence dogfood evidence).

**Inheritance rule**:

```yaml
# master entry (canonical)
id: release-versioning-cadence
tier: macro
freshness:
  cadence_days: 180
  last_validated_at: 2026-06-04
surfaces:
  - path: EstreGenesis/README.md
    fragment: version-badge
    sync_mode: build-time      # derived
  - path: EstreGenesis/docs/index.html
    fragment: hero-badge
    sync_mode: build-time
  - path: EstreGenesis/docs/shared/data.js
    fragment: meta.version
    sync_mode: build-time
```

- the derived side is *forbidden from holding its own cadence field* — if `surfaces[].sync_mode: build-time` is specified, freshness auto-propagates from the master.
- `runtime/freshness-check.cjs` simultaneously invalidates all derived sides in surfaces[] at the master's `next_due_at` arrival → the build pipeline forces regeneration.
- updating the master's `last_validated_at` → the derived side is auto-valid. The *reverse* (derived change → master update) is code-blocked; on violation, `eg_greatpractice_lint.cjs` blocks it at PreToolUse (Cluster B deterministic hook).

**Exception**: a derived surface owned by an A2A counterpart (catchball protocol, management §1.7 + §8.5) cannot use build-time propagation → specify `sync_mode: catchball` + a separate negotiation queue. Goes live after P3 multi-agent residency stabilizes.

### §7.6 Cold Eviction — 90 days idle → `_archive/`, no deletion

**Mechanism** (synthesis of memoization §1.5 + canonical §1.3):

```
[entry promoted] → active tree (greatpractice/{macro|mezzo|micro}/)
       ↓ 90 days hit_count 0 AND recurrence_count 0
[cold candidate] → freshness-check.cjs surfaces it at next-stop
       ↓ review by maintainer or Hyperbrief (notability re-attest)
[archive decision] → move to _archive/<tier>/<slug>.md
       ↓ preserve a redirect stub in place (canonical §1.3)
[active tree slot] → `# Archived → see _archive/<tier>/<slug>.md`
                     cross-references do not break
       ↓ on refault (re-hit of the cold archive) detection
[unarchive candidate] → record the refault distance in _shadow.jsonl
                    auto-propose reactivation on threshold pass (memoization §3.4)
```

**The deletion vs archive distinction**:
- *deletion* = the entry did not pass the quality bar (schema non-compliance, canonical §1.12 aggressive prune) — authority: lint automatic. the redirect stub is preserved too (avoid broken cross-reference).
- *archive* = the entry lost operational meaning (environment change) — authority: cadence automatic + maintainer confirm. preserves the possibility of reactivation on a future refault.

**`_shadow.jsonl` refault tracking** (memoization §3.4 + os §1.5):
- preserve the freshness snapshot at the archive time.
- when the same trigger pattern recurs N times thereafter, measure the *refault distance* → judge whether the archive was a wrong decision.
- refault rate ≥ threshold → auto-propose unarchive (a surface item of the next Stop hook).

**Avoiding Phronesis-boundary collision** (`humanities.md` §3.9 + §4.6): cold eviction also becomes a natural demotion path *into the region not to codify* — if it was codified at first but is actually a region that phronesis (on-the-spot judgement) handles better, archive after cold auto-resolves it.

---

**§7 cross-section dependencies**:
- §3.3 (lifecycle stages — probation/consolidation/automatic) — in sync with the §7.3 promotion path.
- §3 (frontmatter schema) — prerequisite for the `freshness.*` field definitions.
- §4 (hook taxonomy) — `runtime/freshness-check.cjs` is integrated as the (d) freshness probe stage of the Stop hook.
- §8 (SSoT propagation) — the §7.5 inheritance connects directly to the §8 derived-surface enumeration.
- §3.4 + §5.6 (revision / supersession graph notation + application) — the frontmatter / lifecycle mapping of the `supersedes:` chain + cost-tiered vocabulary.
- §7.7 (retire axis) — the status 3-states consume §7.3 validation / §5.6 probation counters as transition triggers; the §5.5 redirect stub is the accompanying artifact of an active→retired direct transition.

### §7.7 Retire axis — active / probation / retired 3-state state machine (v0.3.0)

> Whereas §7.6 cold eviction handles an entry that has "lost interest" (idle), §7.7 handles an entry that "became wrong" (invalid · superseded). The two are orthogonal axes — eviction's signal is *usage frequency*, retire's signal is *validity*. It is the GP-side implementation of EG north-star value-judgement axis 3 (deprecation as first-class): a standard that cannot prune cruft becomes precisely the burden of "a cleaner successor", so retire must be a first-class operation on par with promote.

**3-state** — entry frontmatter `status:` enum (new, `active` when omitted):

| status | meaning | enforcement |
| --- | --- | --- |
| `active` | valid — normal enforce | hook operates normally |
| `probation` | validity suspected — §7.3 validation failed, §5.6 miss counter exceeded threshold, or environment change suspected | the hook keeps enforcing but the block/warn message carries a probation marker ("this practice is awaiting re-validation") |
| `retired` | enforcement stopped — body is preserved (no deletion, same principle as §7.6) | excluded from the hook scan (1-line frontmatter field check — deterministic) |

**Transition rules** (only 4 minimal transitions — no over-design):

- `active → probation` — §7.3 validation failure or §5.6 probation counter threshold. can be automatic (hook/cadence flags).
- `probation → active` — re-validation passed. can be automatic.
- `probation → retired` — requires user ratify (the §9.1 Hyperbrief escalation path may be used). The decision to turn off enforcement is a human gate, symmetric with promote.
- `active → retired` — direct transition when superseded is specified (`superseded_by` specified + §5.5 redirect stub accompanying). user ratify here too.

**Frontmatter obligations of a retired entry**: `retire_reason` (1 line — which of superseded / invalidated / environment-changed and why) + if possible `superseded_by` (reuse the §3.4 evolution field). Retire is not information loss but a state transition — git history + body + reason preserve "why this was once right and why it no longer is".

**Distinction from the existing axis** — `lifecycle` (§3.2: probation/consolidation/automatic) is the habit-formation *maturity* axis. The same word `probation` appears on both axes but means differently: `lifecycle: probation` = "still young" (maturing), `status: probation` = "suspected" (eviction candidate). Orthogonal — the combination `lifecycle: automatic` + `status: probation` (long automated but suspected due to environment change) is valid.

**INDEX reflection** — retired entries are excluded from the tier-section lists, keeping only a 1-line `Retired: N` count at the end of INDEX (the list itself is found via `grep -l "status: retired"` — ≤300 token cap protection, §2.5).

**v0.3.0 scope** — this section covers spec definition + `_schema.md` field + INDEX reflection rule. The status-scan exclusion implementation of the hook runtime is reflected at runtime build time (see §11 cut scope).


---

## §8. SSoT Propagation — `surfaces[]` inversion

> The Greatpractice entry is the *master canonical*, and external surfaces (badge / docs / plugin.json / marketplace.json / hook payload / memory stub) are *derived views* — this inversion is the one-line summary of §8. The current EG N-way sync register (workspace AGENTS §5.8) places the *surface enumeration* in external documents, with a structure where the entry *does not know* about those surfaces, so even when the master changes the derived update depends on model judgment. §8 reverses this direction so that the `surfaces:` field of the entry frontmatter *knows* the derived surfaces, and mechanizes propagation with a deterministic hook (canonical §1.11 + sre §1.9).

### §8.1 Cluster H — justification of the 4-axis consensus

The Cluster H of the cross-axis synthesizer is a *cross-domain isomorphism* where 4 of the 9 axes reach the same conclusion (Appendix A Cluster H):

| Axis | Mechanism | Core proposition |
|---|---|---|
| **canonical** §1.11 | Wikidata → Wikipedia infobox auto sync | "every data element is mastered in only one place" (Wikipedia *Single source of truth*). When a statement is updated, it is automatically reflected on every page that references that statement. |
| **sre** §1.9 | Honeycomb / Charity Majors observability 2.0 | "arbitrarily-wide structured events" are the single source, and metric · log · trace are derived. Like the "3 pillars," duplicated storage per silo is judged an anti-pattern due to exploding correlation cost. |
| **memoization** §1.8 | Bazel CAS + Nix content-addressed derivation | the input-hash → output mapping is the master, and the build artifact is derived. hermeticity (sandbox + explicit input declaration) is a prerequisite of SSoT. |
| **management** §1.12 | Hoshin Kanri catchball + X-Matrix | the single-page visualization is the derived view, and the policy node is the master. However, master changes proceed not *unilaterally* but through catchball (bidirectional negotiation) among owners. |

> The 4 axes have *different vocabularies but identical conclusions* — an explicit separation of master ↔ derived. As the architectural justification of Greatpractice, this is multi-domain evidence that does not rely on the authority of a single domain.

### §8.2 The entry-level inversion of the AGENTS.md §5.8 register

**Current (workspace registry direction)**:

```
AGENTS.md §5.8 N-way sync register
  ├─ "EG release version" row → [README badge, docs hero, data.js meta, CHANGELOG]
  ├─ "Hyperbrief module version" row → [frontmatter, plugin.json, marketplace.json, docs hero, ...]
  └─ ... (the surface enumeration lives in *external documents*)
```

Problem: the master entry (e.g., `mezzo/release-cadence.md`) itself *does not know* "which surfaces I should propagate to." Updates require the model to map by *remembering* the §5.8 register, and this is the root cause of 16× docs/promo sync misses (release versioning cadence dogfood evidence).

**Inversion (entry-level direction)**:

```yaml
# greatpractice/mezzo/release-cadence.md frontmatter
---
id: gp.mezzo.release-cadence
tier: mezzo
surfaces:
  - kind: docs-badge
    path: EstreGenesis/README.md
    selector: "img[alt='version']"
    coherence: strict
  - kind: docs-badge
    path: EstreGenesis/docs/index.html
    selector: ".hero-badge[data-meta=version]"
    coherence: strict
  - kind: data-js
    path: EstreGenesis/docs/shared/data.js
    selector: "meta.version"
    coherence: strict
  - kind: changelog-entry
    path: EstreGenesis/CHANGELOG.md
    selector: "h2:first"
    coherence: soft
---
```

master = entry frontmatter, derived = each enumerated surface. Every derived surface is formalized as a (kind, path, selector, coherence) 4-tuple — an EG-scaled instantiation of sre §1.9's "structured events as SSoT."

### §8.3 Surface kind taxonomy

We define 5 kinds of derived surface (extensible, the baseline of the P0 cut):

| kind | definition | propagation mechanism | first dogfood example |
|---|---|---|---|
| `skill` | a plugin skill's frontmatter description / trigger keyword | PostToolUse hook activates the skill's `paths:` glob (harness §1.4) | `plugins/hyperbrief/skills/hyperbrief-trigger-check` |
| `hook` | a lifecycle hook's schema / matcher / exit code | directly lint the JSON spec of the PreToolUse / Stop hook (§4 hook schema) | the watcher rearm spec of `pre-send-probe.cjs --rearm` |
| `docs-badge` | a version / status badge inside HTML/Markdown | DOM-selector-based build-time generation (sre §1.9 derived) | `docs/index.html` hero badge, `README.md` shield |
| `memory_stub` | the redirect-only memory file of a promoted entry | auto-generate a 1-line stub at promotion time (canonical §1.3) | `memory/feedback_*.md` → `# Promoted → greatpractice/...` |
| `plugin-json` | the version + module-tag field of `plugin.json` / `marketplace.json` | JSON Pointer (`/version`, `/plugins/N/version`) based atomic replace | `plugins/<module>/.claude-plugin/plugin.json` |

> The propagation mechanism per kind is the responsibility of §4 (hook taxonomy) PostToolUse + §12 (runtime) `gp-sync-check.cjs` — entry change → per-kind dispatcher → derived surface update/verification.

### §8.4 Strict vs soft propagation — per-entry `coherence` field

Resolution of the Strict Coherence vs Eventual Consistency contradiction: it lets you *select per entry* the strength of derived propagation for a master change. If processor §1.11 MESI's strict invalidation is applied to every entry, A2A traffic explodes and even intended ad-hoc deviations are blocked, so the operational burden grows. Conversely, if everything is soft, there is a silent drift risk for critical entries (e.g., redaction rule, outbox JSON schema).

**3-level `coherence` field**:

| value | semantics | propagation behavior | application cases |
|---|---|---|---|
| `strict` | every derived surface must *exactly* match the master | when the PostToolUse hook detects a mismatch it blocks with exit 2, and subsequent work cannot proceed | redaction rule (the public-repo verbatim prohibition), outbox JSON schema, version badge (release cadence) |
| `soft` (default) | derived updates are *recommended* but misalignment is not a hard block | on mismatch detection, emit a warning + inject additionalContext ("you forgot the surfaces below"), and work can continue | docs prose, CHANGELOG entry body, illustration section |
| `none` | explicit exemption from propagation tracking | the hook ignores the surface. lint does not verify it either | local-only entry, draft / `_propose/` residual items, phronesis-boundary items |

**Default = `soft`**: management §1.12 catchball's "negotiation up and down" principle + canonical §1.11's "where fully automated is risky, reminder only" + sre §1.9's build-time generation of derived views all converge to *soft default + strict opt-in*. *strict pairs with enforcement_level=mandatory* — if a recommended/advisory entry becomes strict it is an enforcement contradiction, so lint enforces (coherence, enforcement_level) coherence.

### §8.5 Catchball protocol — negotiation of multi-agent owned surfaces (deferred P3)

At the multi-agent residency stage (the stage where an A2A counterpart other than EG joins the workspace), there are cases where a derived surface of an entry is *owned by another agent*. Example: when some of the surfaces of EG's `mezzo/a2a-priority-routing.md` are docs surfaces on the counterpart side — if the master attempts unilateral propagation, it conflicts with the counterpart's autonomy.

We borrow the bidirectional negotiation of management §1.12 + §3.5 (catchball-node-change-protocol). When a master change touches an owned surface:

```
[1] PROPOSE     master notifies the frontmatter diff over outbound A2A
                  (message type: greatpractice/node-change-proposal)
[2] ACK         counterpart confirms *receipt* (transport ack ≠ agreement)
[3] NEGOTIATE   counterpart responds with one of (a) accept, (b) revise propose-back,
                  (c) reject + reason
[4] CATCHBALL   in the revise case, master revises again → counterpart →
                  ... (Hoshin Kanri's "objectives are negotiated up and down")
[5] CONVERGE    on agreement, both entry frontmatters update simultaneously + hash bump
                  on agreement failure, BRD-style discuss (canonical §1.5 3rd tier)
```

**Why P3 deferred**:
- A new A2A message type (`greatpractice/node-change-proposal`) spec needs to be defined — an extension of Constellation's inbox/outbox protocol.
- The fallback on agreement failure (BRD 3rd tier) must be integrated with Hyperbrief escalation.
- Counterpart-side adoption of the Greatpractice module is a prerequisite (in an asymmetric environment, catchball degrades to a unilateral push).
- In the P0-P2 stages, owned surfaces are *all EG self-owned*, so unilateral propagation is sufficient.

**P0-P2 fallback**: the default of the `surfaces[].owner` field is `self`. When owner != self, until P3 we enforce `coherence: soft` + emit warning only (in an environment without catchball, strict is by definition impossible).

### §8.6 §8 cross-section dependencies

This §8 depends on the following §:
- **§3.5** (the location of the YAML schema definition for the frontmatter `surfaces[]` array field).
- **§4.1** (PostToolUse hook — the hook event binding of the per-kind dispatcher).
- **§4.3** (the enforcement_level × coherence coherence lint — detection of the recommended/advisory + strict contradiction).
- **§12.6** (`gp-sync-check.cjs` runtime — build-time generation + drift detection of derived surfaces).
- **§11** (maturation gate — the graduation condition for the P3 catchball protocol is a precondition of multi-agent residency settling in).

---

## §9. Interactions — Constellation / Superscalar / Hyperbrief

> Greatpractice is EG's 4th add-on module, and it is partly adjacent to surfaces that the three preceding modules (Constellation A2A · Superscalar parallel dispatch · Hyperbrief decision delegation) already cover. This §9 pins down that boundary explicitly — *where it ends and where it delegates to the adjacent module* — to guarantee overlap avoidance at operation time. Core principle: the three adjacent modules each own their **decision surface** (Hyperbrief) · **communication surface** (Constellation) · **dispatch surface** (Superscalar) as SSoT, and on top of those Greatpractice handles only the **codification of repeated-work patterns**. When two modules gate the same surface simultaneously, the priority table in this §9 resolves the dispute (sre §1.4 + management §2.3 → the practice tree sits not *upstream* of the decision gate but *downstream*).

### §9.1 Boundary with Hyperbrief — the escalation branch of promotion decisions

Greatpractice's promotion procedure (§5: the promotion decision for micro → mezzo, mezzo → macro) is essentially a **decision branch point** — a practice once promoted to macro permanently occupies an always-on context slot and increases the system-prompt token cost of every subsequent turn (harness §1.2 AGENTS.md always-on tax). Therefore promotion itself is a candidate input to Hyperbrief's 4-score escalation rubric.

**Decision rules**:

| Condition | Routing |
|---|---|
| micro → mezzo promotion (single-scope impact) | Greatpractice internal decision — Hyperbrief does not fire |
| mezzo → macro promotion (entry into always-on slot) | input to escalation 4-score with `blast_radius = 1` (one module) → if the sum ≥ 4, FULL_HYPERBRIEF |
| a practice changes an external adopter's spec surface | `touched_external_consumers ≠ ∅` MUST-trigger → unconditional FULL_HYPERBRIEF |
| `phronesis_boundary = true` decision (the practice vs policy boundary judgment) | attempt Hyperbrief routing; if Cynefin domain = `confused`, reclaim it with `DECISION_REJECT_FRAMING` (humanities §1.2 phronesis's domain-judgment priority) |

**The meaning of the phronesis_boundary key.** As `humanities §1.2` (Aristotle's phronesis — practical wisdom is *situational judgment* itself, not reducible to rule-following) implies, the decision of where the boundary lies between what can be codified into the practice tree (rule) and what must not be codified (judgment) is itself a high-stakes branch. If Greatpractice sets that boundary on its own, there is an *over-codification* risk (Allspaw's *runaway runbook* — sre §1.4); if delegated to Hyperbrief, the 4-score permits promotion only in the appropriate region.

**Reverse dependency.** It is Greatpractice that depends on Hyperbrief's trigger rubric, not the reverse — Hyperbrief operates independently even without Greatpractice. Greatpractice has a `depends-on: Hyperbrief? (optional)` relationship.

### §9.2 Boundary with Constellation — trigger source · blameless propagation · bridge respawn

Greatpractice's lifecycle hooks (§4) attach directly to harness surfaces such as SessionStart / PreToolUse / Stop. However, **A2A inbound** enters as one enum of the *trigger source* — that is, a practice hook can fire even at the moment a `Delegate` / `Report` sent by another agent arrives (sre §1.1 runbook's alert-payload-bundled-runbook-URL principle — an external signal is a first-class trigger for a practice invocation).

**Cases where A2A inbound becomes a trigger** (among the A2A-intent allowlist of Constellation §13.16.9):

- `Delegate` received → the mezzo practice for that work type auto-surfaces (e.g., spec-drafting delegation → the "spec-drafting" mezzo practice activates like a SKILL).
- `BlockerManifest` received → the blocker-resolution macro practice (e.g., the direct main-broker history lookup pattern of `feedback_a2a_relay_reliability`) activates.
- `WorkerReport` received → the retire-stage practice (adjacent to Superscalar §1's retire stage but separated in §9.3) activates.

**A2A propagation of the blameless second-story.** Greatpractice's incident-driven learning loop (§6: failure → second-story extraction → practice node creation/revision) follows the Allspaw blameless lineage of sre §1.3. At this point, if the *extracted second-story can prevent another agent's failure of the same pattern*, Greatpractice **propagates the second-story patch over the A2A channel**. Channel design:

```yaml
practice_intent:
  name: PracticeUpdate
  payload:
    node_path: "mezzo/a2a-emit/outbox-json-validation"
    second_story: "<blameless narrative — not the first-story 'agent X made a mistake' but the 'at agent X's vantage point, that decision looked reasonable' form>"
    retro_action: "<the new/revised diff of the practice node>"
    source_axis: "sre §1.3"
```

**`PracticeUpdate` must be added to the Constellation §13.16.9 A2A-intent allowlist** — it triggers a message wakeup on par with `Delegate` / `Report`, but since the message itself is *learning propagation* rather than *decision delegation*, it is excluded from Hyperbrief triggers (see the §9.4 table). The single-line JSON form of PracticeUpdate is registered in §11 (Cut Scope) of this spec.

**bridge respawn = the source of the SessionStart blocking hook.** One of Constellation's core operational disciplines is that *the first action right after session resume / IDE reboot / boot must verify + spawn the bridge* (`memory/feedback_session_resume_bridge_spawn` evidence). Greatpractice registers this discipline as the macro practice node `boot/bridge-respawn`, and mechanizes that node's enforcement as a **harness SessionStart blocking hook** (borrowing the determinism of harness §1.3 PreToolUse). That is:

- **Greatpractice owns** = the node's SSoT (narrative · second-story · trigger conditions).
- **Constellation owns** = the bridge's transport spec (lockfile · launch idempotency · server-side dampener — §13.16.1-.4).
- **the harness hook owns** = the determinism at execution time (SessionStart block + block if exit code 1).

The three modules each handle **disjoint** layers (practice codification · communication spec · execution time).

### §9.3 Boundary with Superscalar — the parallel migration of retro-backfill

Greatpractice's first v0.1.0 cut must retro-backfill EG dogfood evidence (11 memory feedbacks — the `feedback_*.md` series) and convert them into seed nodes of the practice tree (§11 Adoption). This is a *parallel migration of 11 feedbacks → 9-section schema* task, and naturally a candidate for Superscalar's **Stage 2 lane-class read fan-out**.

**Decision matrix** (applying Superscalar §2 lane-class classification + §5 adoption-thresholds):

| Task | lane class | speculation | issue_width |
|---|---|---|---|
| schema extraction of 11 feedbacks (read-only — originals not modified) | `read` | off (deterministic extraction) | `issue_width_read` cap (runtime concurrency ceiling first — `min(16, cores−2)`) |
| schema validation + cross-link coherence check | `read` | off | same |
| new commit of practice tree nodes (`practices/` directory write) | `write` | off | `issue_width_write = 2-3` (Superscalar §5 default — conflict gate applied) |

**Soundness.** The schema extraction of the 11 feedbacks (a) has no inter-file read dependencies (each feedback is an independent single-file), (b) the spec-conformance of the result is deterministic (the 9-section schema input/output are both specified), (c) the rollback cost on failure = 0 (read-only) — it passes all three of Superscalar's `is_independent` + `is_disjoint_files` + `low_rollback_cost` gates. The cost-benefit gate (§2) is also satisfied: serial ~11 × unit time vs parallel 1 × unit time + slight merge overhead → conservatively a 5× speedup.

**The meaning of Stage 2** (Superscalar §1 Stage 2 = post-v0.2 patch — full introduction of alias branches · lane-class differentiation). This backfill becomes the first Greatpractice-driven dogfood entry of Stage 2. The entry result cross-references both the Superscalar ledger (§Entry 06 planned) and Greatpractice's §11 Adoption.

**Boundary statement.** Greatpractice decides only **what to fan out (identifying work units)**, and delegates **how to fan out (the actual dispatch · lane manifest · retire stage)** to Superscalar. The two modules' responsibilities are disjoint — if Greatpractice held its own dispatch logic, it would duplicate Superscalar.

### §9.4 Inter-hook boundary — Greatpractice (operational patterns) vs Hyperbrief (decision gate)

Since all three modules can enter harness hook surfaces, hook ordering + priority rules are needed. We borrow the priority-inheritance pattern of processor §1.3 (out-of-order execution + dependency tracking) + os §2.1 (kernel preemption priorities):

**Matrix per hook surface**:

| Hook point | Greatpractice | Hyperbrief | Constellation |
|---|---|---|---|
| SessionStart | enforce the `boot/bridge-respawn` node + environment sanity macro practice | — (the decision gate is per-turn) | bridge verify + spawn |
| UserPromptSubmit | decide practice-surface candidates with trigger source = `user_input` | trigger rubric input (compute escalation 4-score) | inbox cursor probe (§13.16.6) |
| PreToolUse | enforce per-tool micro practices (e.g., `outbox.jsonl` append → JSON single-line validation) | if escalation ≥ 4, block the tool call → fire DECISION_REQUEST | A2A intent classification + redaction (§13.14) |
| PostToolUse | extract the second-story of the result (on failure) → §6 learning loop | register decision_lineage | ack 3-tier tracking (§13.13) |
| Stop / turn-end | enforce the practice of the cycle-end 6-element ritual (§13.16.6) | update self-throttle statistics (§2.4) | cursor advance + watcher rearm |

**Priority on overlap — Hyperbrief takes precedence**:

When at the same point a Greatpractice hook (enforce an operational pattern — e.g., "cursor probe before outbox push") and a Hyperbrief hook (decision gate — e.g., "this push is an external publication, so compute the escalation 4-score") fire simultaneously, **Hyperbrief takes precedence**. Rationale:

- **An operational pattern is a *post-decision* surface** — since a practice is "how to perform well an action that is already decided," if the decision itself should be delegated (Hyperbrief fires), it is correct to *defer the operational pattern enforce until after the decision outcome* (cf. management §2.3 Drucker's *decisions precede execution discipline*).
- **debouncing**. If two hooks block an outbox push simultaneously, the surface shows *doubled display* (Greatpractice "JSON validation failed" + Hyperbrief "FULL_HYPERBRIEF needed") — when serialized with Hyperbrief precedence, Hyperbrief blocks first, and if the decision is `accepted`, Greatpractice's operational validation follows.
- **fail-fast cost**. If after the Hyperbrief block one chooses `defer` / `reject_framing`, the cost of Greatpractice's operational validation itself is never incurred — the cost-asymmetry of serialization (canonical §1.2's *fast path first*).

**Exception — PracticeUpdate A2A intent**:

§9.2's `PracticeUpdate` (blameless second-story propagation) is a *learning* message, not a *decision* message, so it is excluded from Hyperbrief triggers (an additional `anti-trigger` item: when trigger source = `practice_update`, suppress the brief). At the same time it is included in the Constellation §13.16.9 A2A-intent allowlist — it is a *special class* that needs a wakeup but does not need decision delegation.

**Priority on overlap — cases where Greatpractice takes precedence**:

The exception in the opposite direction — the case where Greatpractice is above Hyperbrief = **the SessionStart blocking of the macro practice `boot/bridge-respawn`** (§9.2). At this point the very turn in which Hyperbrief's decision gate would fire has not yet started (premise: the bridge must be alive for the inbox to flow, and the inbox must flow for decision inputs to arrive). That is, Greatpractice's SessionStart hook enforces a *precondition of the decision gate* — not an overlap but a *layer separation*.

**Summary — the layered architecture of the four modules**:

```
[Greatpractice]   = repeated-work codification + operational pattern enforce  (procedural memory)
[Hyperbrief]      = the escalation gate at decision branch points              (decision delegation)
[Constellation]   = inter-agent communication + watcher liveness               (A2A transport)
[Superscalar]     = parallel dispatch of work within one agent                 (work dispatch)
```

The four modules handle *distinct surfaces*, and the §9.4 priority table applies only when they conflict on the same surface. If the boundary discipline of this §9 is followed, even adopting the four modules simultaneously stays *consistent + non-redundant* — this is a reapplication of the same pattern (overlap avoidance by explicit boundary) that Hyperbrief itself validated with the 3-section separation of §13.17 / §13.18 / Hyperbrief (Hyperbrief.md §8.5).

---

## §10. Adoption Thresholds

> Greatpractice is not a *universal module recommended for every workspace*. There clearly exist operational forms where the cost of codification (frontmatter boilerplate · hook fatigue · institutional rigidity) exceeds ROI. This § covers the threshold of *when to adopt* + the anti-criteria of *when adopting is harmful* + the floor of *how to start at minimal adoption* + the partial-adoption path of *spec only + plugin not adopted* + the institutional risk of over-codification (Powell-DiMaggio coercive isomorphism). It maintains the same *opt-in module* position as Constellation / Superscalar / Hyperbrief.

### §10.1 When to adopt (3 conditions, AND)

When the three conditions are satisfied **simultaneously**, the ROI of adopting Greatpractice turns positive. If only one or two conditions hold, partial adoption (§10.4) suffices, and if all three fall short, it is close to the anti-criteria region of §10.2.

| Condition | Threshold | Rationale (cross-axis source) |
|---|---|---|
| **operational cycle accumulation** | ≥ 5 cycles | os §1.1 working set τ tuning — below a backward-window of 5, the working-set estimate itself is noise. psychology §1.10 Lally probation's *entering the probation phase = at least 30 days or an equivalent cycle count*. |
| **recurrent violations occur** | the same pattern ≥ 3 times / 2 kinds of independent triggers | canonical §1.2 notability gate (significant coverage ≥ 3 + independent triggers ≥ 2 + verifiable effect). 3 accumulations prove it is a *real trigger* — 1-2 may be noise. |
| **possession of codify-target surfaces** | ≥ 11 surfaces | EG dogfood evidence (phase_3 cycle) retro-audit — below 11 items, the hierarchy ROI of macro/mezzo/micro tier separation cannot justify the cost (3-tier infra). Isomorphic to how processor §1.1's cache hierarchy is optimal as single-level for a *small working set*. |

Additional qualitative conditions (to confirm after passing the 3 conditions):

- **repeated-work ratio** ≥ 30% — at least 1/3 of work is a variation of a *form done before* (the EG equivalent of memoization §1.4 Bellman DP overlapping subproblems).
- **multi-surface SSoT drift observed** ≥ 1 time — an N-way sync miss *actually occurring in operation* (release-versioning-cadence dogfood evidence + Cluster H propagation).
- **stop hook or equivalent lifecycle hook infrastructure** *already in operation* — a prerequisite of Cluster B (deterministic hook). Adopting only the Greatpractice spec without hook infra is *codified rule with no enforcement* → it does not go to the coercive isomorphism of §10.5 but falls to a *paper rule*.

### §10.2 When NOT to adopt (anti-criteria)

In the following operational forms, adopting Greatpractice *inverts* ROI. It is a region where *codification itself is harmful*, so humanities §1.12's phronesis-codify-boundary applies head-on.

- **one-off task / one-shot work**: if a task is performed only once and never recurs, the amortization denominator of codification is 0. Aristotle phronesis's *rare + high-context + judgement-heavy* region — on-the-spot judgment (i.e., *prudence*) is superior to an *explicit rule*. humanities §3.9.
- **single-cycle session**: operational cycles ≥ 5 fall short (violates §10.1 condition 1). working-set estimate noise → the `last_referenced_turn` statistics of frontmatter become meaningless → Cluster F (freshness) cannot operate.
- **phronesis-dense work**: a region where the essence of the work is *judgement* — e.g., ethical decisions, creative-direction decisions, political negotiation, intent inference. In this region, when codified, the negative externality of *atrophy of the agent's on-the-spot judgment ability* exceeds the codification gain (humanities §3.9 + Polanyi tacit knowing).
- **soloist 1-person 1-cycle**: if a single agent operates only a single session without multi-agent residency, the value of Cluster H (cross-surface SSoT propagation) is 0 + the working-set rotation of Cluster I (phase-transition) is unnecessary.
- **environment dominated by external enforced discipline**: when the organization's existing SOP / compliance already covers the equivalent region, Greatpractice is a *redundant governance layer* — a risk of double application of Powell-DiMaggio 1983's *coercive isomorphism* (§10.5).

### §10.3 Minimal viable adoption (MVA floor)

If you decide to adopt after passing the 3 conditions of §10.1, **start from the floor**. Writing a full tree from the outset falls into the *checklist bloat* of humanities §1.7 Gawande + the *over-engineering* trap of sre §4.3.

```yaml
# MVA: minimal viable adoption first cut
macro:   1-3 entries   # domain governance ratio rule. _telos.md + 1-2 core disciplines.
mezzo:   5-7 entries   # procedure for the most frequent violation. 9-section schema applied.
micro:   hand-curated  # auto-promotion prohibited. manual selection only (5-10 atoms).
hooks:   2-3 lifecycle events  # start from SessionStart + Stop + 1 PreToolUse(matcher).
frontmatter schema: 6-field floor  # tier, trigger, evidence-quality, recommendation-strength, last_referenced, supersedes.
```

The justification of this floor:

- **macro 1-3**: management §1.10 Wikipedia 5 pillars is 5 items, but the first cut is reduced to *the 3 most binding items*. The pressure to fill 5 risks creating an *artificial pillar*.
- **mezzo 5-7**: matches the *killer items only / 5-7 item cap* of humanities §1.7 Gawande checklist. A direct application of cognitive load's working-memory chunk limit (Miller 7±2).
- **micro hand-curated**: isomorphic to processor §1.7 RRIP's *default rrpv = max-1* — a new entry is a *short-lived assumption*. Enable auto-promotion after statistics accumulate (≥ 30 cycles).
- **hooks 2-3**: Cluster B (deterministic hook)'s ROI is *linear up to 3 hooks*, and *beyond 5 hooks the fatigue exceeds the marginal value* (humanities §1.7 60-90s budget + sre §4.3).
- **frontmatter 6-field floor**: Cluster C's *9/9 universal convergence* recommends a fully populated schema, but the MVA is a 6-field minimum. The rest (RRPV / coherence / freshness_until / surfaces, etc.) are backfilled after entry.

After 5-10 MVA operational cycles, measure via *retro-audit* (a) hook fire frequency, (b) frontmatter field usage frequency, (c) the last_referenced distribution of entries → decide the next cut's expansion.

### §10.4 Plugin dependency separation (spec only adoption)

Greatpractice's partial adoption of **spec (this document) adopted + plugin (`plugins/greatpractice/`) not adopted** is also a valid path. The same opt-in optionality as Constellation / Superscalar / Hyperbrief.

| Adoption mode | Adoption scope | Operational form |
|---|---|---|
| **Full** | spec + plugin (hook · skill · runtime) | hook auto-enforcement + automatic lifecycle event handling. operation that passes the §10.1 3 conditions + has infra willingness. |
| **Spec only** | adopt only the schema + tier hierarchy + maturation gate of this document | write the tree but enforcement is *the agent's self-discipline*. plugin runtime not installed. |
| **Schema only** | adopt only the frontmatter schema (§3.2) + tree not written | retro-backfill only frontmatter onto existing memory feedbacks. the lightest entry. |
| **Hook subset** | spec + only 2-3 hooks of the plugin (SessionStart + Stop) | incremental introduction before full plugin adoption. matches §10.3 MVA. |

The value of Spec-only mode:

- the normative effect of *codification discipline* comes from the spec itself — the *language* of humanities §3.9 phronesis boundary + canonical §1.12 notability gate becomes the framework of self-discipline.
- in the absence of plugin runtime, *hook fatigue risk is 0* — extract only the conceptual gain of codification while avoiding the coercive isomorphism risk of §10.5.
- *preserves a future plugin adoption path* — if the schema matches, the migration cost from spec-only → full is only adding the hook spec + installing the runtime.

### §10.5 Anti-pattern alerts (institutional risk)

*Over-adoption* of Greatpractice induces the **coercive isomorphism** (forced isomorphization) risk of Powell-DiMaggio 1983. It is a core warning of institutional anthropology (Appendix B §B.6).

**Coercive isomorphism**: when external coercion (hook blocks · enforcement_level=mandatory · block on violation) accumulates, the organization bears the long-term cost of *innovation suppression + path dependency lock-in*. Powell-DiMaggio's hundreds of case studies provide the quantitative evidence.

**Mapping of the 3 isomorphism kinds in the EG context**:

| Isomorphism type | EG implementation surface | Risk when excessive |
|---|---|---|
| **Coercive** (external coercion) | hook enforcement_level=mandatory + exit 2 block | agent autonomy decay — passing the hook gate of every turn becomes dominant over *real work* |
| **Mimetic** (imitation) | copying the seed original + borrowing patterns from other workspaces | context-mismatch adoption — forcing the source workspace's phronesis region onto this workspace |
| **Normative** (professional norms) | AGENTS.md telos + macro tier _telos.md | *rigidification* of the telos — without an evolution vocabulary (humanities §1.2 distinguish/per-incuriam/overrule), the telos falls to an *immutable* myth |

**5 concrete anti-patterns**:

1. **excessive enforcement_level=mandatory ratio**: alert if the mandatory ratio among all entries ≥ 50%. Cluster B (deterministic hook)'s ROI is *linear up to 3-5 hooks, and beyond that the fatigue exceeds the marginal value*. Recommended: a distribution of about mandatory ≤ 20%, recommended 50%, advisory 30%.
2. **excessive hooks (≥ 7 lifecycle events)**: a direct violation of the humanities §1.7 Gawande 60-90s budget. The agent's *real work* time is eroded by hook processing.
3. **macro tier bloat (≥ 10 ratio rules)**: management §1.10 Wikipedia 5 pillars being 5 items — the *cognitive ceiling of binding rules*. macro beyond 10 means *everything is binding* → *nothing is binding*.
4. **frontmatter schema bloat (≥ 20 fields)**: Cluster C's full schema also recommends 12-15 fields (the cost trade-off between Contradiction 1's lazy 3-layer and frontmatter-driven). Beyond 20, loading a single entry costs 200+ tokens from frontmatter alone — eroding the lazy hierarchy.
5. **phronesis region invasion**: applying hooks to the anti-criteria region of §10.2. Example: keyword-trigger context injection into a creative-direction decision prompt — atrophy of on-the-spot judgment ability. A direct violation of humanities §3.9.

**Mitigation discipline**:

- periodic isomorphism review (quarterly or every 50 cycles): measure the mandatory ratio + hook count + macro tier count + frontmatter field count + review the retire queue on threshold exceedance.
- **explicit maintainer confirm for *enforcement_level escalation***: the advisory → recommended → mandatory escalation must not be automated. maintainer confirm is mandatory (direct application of the Hyperbrief IR 4-score escalation).
- **context audit of mimetic borrowing**: when mimetically borrowing an entry from another workspace / seed original, check matching against *that workspace's phronesis region*. If there is a mismatch, refuse the borrowing.

This mitigation is *Greatpractice's self-limiting principle* — a meta layer where the module inspects its own institutional drift.

---

## §11. v0.1.0 Cut Scope

> v0.1.0 is the *first cut of the spec*, not the *finished version*. Among all value items derived from the 9-axis cross-domain synthesis, only the portion that satisfies all 3 conditions of — **deterministic-enforceable + frequent violation + single-host (Claude Code) shippable** — goes into v0.1. The rest is loaded into an explicit deferred table to guarantee the *deferred ≠ discarded* principle (a preemptive application of §7.4 *distinguish* — preservation limited to a narrow context). The pattern of maturing through 4-5 minor cuts up to v1.0 follows the 7-cut trajectory of Hyperbrief v0.1 → v0.5.6.

### §11.1 In scope — v0.1.0 ship surface

> *(v0.2.1 correction codicil: the draft of this section described the design-time target tree as the 'ship surface' — what the actual v0.1.0 cut shipped is the real list below, and the draft's surplus (runtime 5 cjs / hooks 3 / skills 5 / templates 3 / settings extension / the virtual-entry list of the canonical tree) was moved to §11.2 deferred. The synchronization SSoT of the exact plugin ship list is `plugins/greatpractice/README.md`.)*

**Spec body** (`EstreGenesis/Greatpractice.md`):

- §1 — §12 analytical content (concept definition → tier hierarchy → entry schema → hook → maturation gate → voice → freshness → SSoT propagation → adjacent-module boundary → adoption threshold → cut scope → implementation notes).
- Appendix A: cross-axis convergence cluster catalog (1-line summary of 9 clusters).
- Appendix B: 4 strong isomorphisms + 2 normative justifications — distributed cognition + organizational anthropology backfill (humanities §1.9 + management §1.4 cross-ref).
- Appendix C: self-application — reflexive evidence that this spec itself satisfies the Greatpractice frontmatter schema (the dogfood-zero of §3).

**Canonical tree** (`EstreGenesis/greatpractice/`):

- `_schema.md` — entry frontmatter spec (the prose normative definition of §3.2's v0.1 mandatory 7-field + tier-conditional).
- `INDEX.md` — macro chunk summary, ≤ 300 token cap (**the current SSoT of the entry corpus** — for the actual entry list of the structure below, this file is the canonical source).
- `macro/` · `mezzo/` · `micro/` — 3-tier directory structure. entries are not a fixed list but **accumulated by dogfood** — v0.1.0 starts with 1 macro (`release-cadence`) + 1 mezzo (`outbox-json-validation`), and expands to 1 macro + 9 mezzo + 1 micro by the v0.2.0 mezzo batch ratification (see frontmatter status).
- `_propose/` — the candidate-loading directory of the maturation pipeline (a precondition of P0 entry). (`_archive/` is created at the moment the first retire occurs — nonexistent in v0.1-0.2.)

**Plugin** (`EstreGenesis/plugins/greatpractice/` — real ship, synchronized with `plugins/greatpractice/README.md`):

- `.claude-plugin/plugin.json` — name=greatpractice, version=0.1.0, depends-on stated (none required, optional synergy).
- `schemas/` 3 kinds: `entry-frontmatter.schema.json` · `hook-spec.schema.json` · `voice-rules.schema.json`.
- `hooks/contact/` 1 kind (management §1.8 *poka-yoke* contact type): `outbox-json-validate.cjs` — blocks direct append to `outbox.jsonl` + JSON roundtrip validation (mandatory enforcement_level, exit 2 on fail).
- the README's PreToolUse registration example — the adopter settings integration guide.

### §11.2 Deferred to v0.2+

| Feature | Source axis § | Deferral reason |
|---|---|---|
| `runtime/` 5 cjs (`eg_greatpractice_lint` · `eg_greatpractice_promote` · `eg_voice_check` · `eg_freshness_probe` · `eg_build_index`) | §4-§7 each enforce surface | v0.1 is sufficient with manual lint/promote — deterministic runtime comes after entry corpus + operational evidence accumulate (v0.2.1 correction: moved from the §11.1 draft's ship description) |
| 3 additional hooks (`fixed-value/n-way-sync-check` · `motion-step/pre-send-inbound-sequence` · SessionStart bridge-verify) + 1 UserPromptSubmit | management §1.8 poka-yoke 3 types | after confirming the operational baseline of the 1 contact kind (outbox-json-validate) — incrementally one per type (v0.2.1 correction: same move) |
| `skills/` 5 kinds (`greatpractice-author` · `-promote` · `-fault` · `practice-toil-score` · `voice-check`) | §3-§6 authoring/promotion/voice surfaces | manual authoring + model assistance is sufficient for v0.1-0.2 (v0.2.1 correction: same move) |
| `templates/` 3 kinds (macro / mezzo / micro entry template) | canonical §1.2 | `_schema.md` + imitation of existing entries is sufficient — templates only from corpus ≥ 20 (v0.2.1 correction: same move) |
| Settings extension (Stop hook wrap `eg_stop_hook_extensions.cjs`, etc.) | §4.4 | adopter-side integration design — not a plugin ship surface but an adopter guide (v0.2.1 correction: same move) |
| `manifest.json` content-addressed hash index | memoization §1.8 (Bazel/Nix) | BLAKE3 dependency + hash stability verification needed in the first cut |
| `renderers/` package (entry → derived surface auto-gen) | canonical §1.11 | manual surfaces[] maintenance is sufficient in v0.1 — automation has ROI only from entry corpus ≥ 20 |
| `eg_load_working_set.cjs` automation | os §1.1 (Denning), §1.6 | needs a stable baseline of manual lazy materialization (P1-P2 maturation) |
| `collab/practice_*.{jsonl,json}` accumulation | os §1.1 + processor §1.7 | operational telemetry — a 30-90 day accumulated dataset precondition |
| `rrpv` + `miss_count` active | processor §1.7 (RRIP/BRRIP) + §3.8 (3C miss grid) | v0.1 frontmatter has only placeholders, auto-scoring is v0.2 |
| SHCT trigger_source statistics auto-accumulation | processor §1.8 | only the 8-source enum is active in v0.1, frequency statistics are v0.2 |
| TAGE multi-scale confidence predictor | processor §1.9 | prerequisite of the v0.3 prefetch heuristic (after RRPV stability) |
| phase enumeration + phase-transition prefetch | os §1.8 + processor §3.7 | a 30-90 day history precondition |
| voice linter intent classification extension (regex → ML) | sre §1.3 | after confirming the false-positive rate < 5% of the v0.1 regex MVP |
| toil rubric auto-scoring (6-rubric) | sre §1.2 | manual scoring + skill assistance is sufficient for v0.1 |

### §11.3 Deferred to v0.3+

| Feature | Source axis § | Deferral reason |
|---|---|---|
| `mcp/` MCP server (gp_query / gp_load / gp_promote) | harness §1.3 | multi-agent residency (A2A counterpart joining) is a precondition |
| MESI multi-agent coherence broadcast | processor §1.11 | same as above — v0.1 is single-agent coherence only |
| CRDT-based eventual coherence | — | the fallback path of strict broadcast — multi-agent precondition |
| Catchball protocol | management §1.7 (Hoshin Kanri) | owned surface multi-agent negotiation — multi-agent precondition |
| Dreyfus maturity-tagged adaptive verbosity | psychology §1.1 | auto-branching of the entry's *novice/competent/expert* — accumulated usage statistics precondition |

### §11.4 Deferred to v0.4+

| Feature | Source axis § | Deferral reason |
|---|---|---|
| CMMI L4 effectiveness measurement | management §3.5 | a dataset of dozens of cycles' *post-codify hit-rate ≥ pre-codify recurrence-rate* precondition |
| Practice budget governance | sre §3.3 | toil auto-scoring + fatigue budget measurement baseline precondition |
| Hash-based reproducibility audit | memoization §3.6 | v0.2 content-addressed hash stability precondition |
| Dry-run wheel of misfortune | sre §3.6 | dogfood evidence accumulation + 4 kinds of hook stability precondition |
| M&M periodic codification cycle | humanities §3.5 | 90-180 day cadence — Greatpractice's own freshness probe stability precondition |

### §11.5 v1.0 readiness rubric — measurable criteria

We borrow the two-lens pattern of Hyperbrief §11.5. v1.0 GA defines explicit score-passing preconditions so it does not become a maintainer-discretion label. **Lens A** (module-wide GA) 6 dimensions + **Lens B** (single-host marketplace) 5 dimensions (excluding *cross-host portability* from Lens A).

| # | Dimension | Measure | Scoring anchors (0/5/10) |
|---|---|---|---|
| 1 | **Spec completeness** | §1 — §12 + Appendix A-C + all v0.x candidate patches closed | 0 = half the body / 5 = all § exist + gap / 10 = candidate 0 |
| 2 | **Schema stability** | the elapsed time since the final major break of entry-frontmatter + hook-spec + voice-rules | 0 = break within 1 week / 5 = stable for several weeks / 10 = 30+ days + candidate 0 |
| 3 | **Dogfood evidence accumulation** | the number of entries satisfying (post-codify) hit-rate ≥ (pre-codify) recurrence-rate | 0 = 0 / 5 = 4-5 (half of current mezzo) / 10 = all ratified entries |
| 4 | **Critic patch absorption** | the absorption rate of the patch recommendations of 9-axis cross-axis-patterns + completeness-critic | 0 = 0% / 5 = 50% / 10 = 100% (including explicit deferred) |
| 5 | **Module boundary stability** | the number of boundary-renegotiations that occur (90-day window) after defining the boundary with Constellation §13 + Superscalar §3 + Hyperbrief §1 | 0 = frequent (3+) / 5 = 1-2 / 10 = 0 |
| 6 | **External adopter validation** *(Lens A only)* | the dogfood report of an EG external fork / another seed-tier adopter | 0 = none / 3 = n=1 / 6 = n=2-3 / 10 = n=5+ |
| 7 | **Determinism guarantee** | same entry corpus + same hook spec → same enforce result invariant verification | 0 = no test / 5 = smoke pass / 10 = n≥5 environments in a row |

**Aggregation**: borrowing the Hyperbrief §11.5.2 pattern — report both `simple_mean` + `weighted_mean`. Default weights: `Dogfood evidence × 2.0` (the most load-bearing — the justification of codify itself), `Schema stability × 1.5` · `Module boundary stability × 1.5` · `Determinism × 1.5`, the rest × 1.0.

**Thresholds**:

- **v1.0.0 cut (Lens A)**: both simple + weighted ≥ **8.0**.
- **Single-host marketplace registration (Lens B)**: both ≥ **7.5**.

**Re-evaluation cadence** (Hyperbrief §11.5.5 pattern): (a) a release causing a ≥ 2-point change in a dimension, (b) an emergency-fix release (Dimension 1/2 timer reset), (c) the moment of an explicit "v1.0 cut?" decision. First scheduled re-evaluation = **2026-09-04** (90 days after the v0.1 ship, synchronized with the macro tier default of the freshness cadence).

**Current scoring (v0.1.0-draft, prediction as of 2026-06-04)**: Spec 8 · Schema stability n/a (first cut) · Dogfood evidence 0 (pre-ship) · Critic patch absorption 7 (9-axis synthesis + completeness-critic absorption + some explicit deferred) · Module boundary 6 (§9 definition + adjacent-spec cross-PR not yet in progress) · External adopter 0 (pre-ship) · Determinism n/a. *simple mean ≈ 4.2 / weighted ≈ 4.0* — the gap to v1.0 is concentrated in the 3 dimensions of *dogfood evidence accumulation + external adopter + schema break-free window*. The v2.5.50 → v2.6.0 6-cut cadence gradually resolves this.

---

## §12. Implementation Notes

> The plugin = an optional adapter — adopting only the spec is also valid (§10.4). This § touches only the core surfaces of the v0.1.0 cut's *reference implementation* (`plugins/greatpractice/`). The full directory tree and the line-by-line walkthrough of the cjs are canonical in `plugins/greatpractice/README.md` — this § states only spec-level invariants, drawing the boundary so an alternative adopter (a different harness · a different file layout · spec only) can implement compatibly with the same external shape (the self-application of canonical §1.11's derived-view inversion).

### §12.1 Plugin directory structure summary

The v0.1.0 ship surface of `plugins/greatpractice/` is the following 7 kinds. (For the full tree, see `plugins/greatpractice/README.md` §1 — separated from the entry corpus `greatpractice/{macro,mezzo,micro}/` of §2-§3.)

| Directory | Role | Source § + justification |
|---|---|---|
| `.claude-plugin/plugin.json` | module manifest (name=greatpractice, version=0.1.0, entrypoint) | borrowing the Hyperbrief plugin pattern |
| `schemas/` | JSON Schema canonical (entry frontmatter / hook spec / voice rules) | the schema-as-SSoT of §3 + §4 + §6 |
| `runtime/` | 5 cjs execution modules (lint / promote / voice-check / freshness / build-index) | §3.8 + §5.4 + §6.3 + §7.3 + §2.5 |
| `hooks/` | poka-yoke 3-type classification (contact / fixed-value / motion-step) | §4.1 + management §1.8 |
| `skills/` | 5 meta-skills (author / promote / fault / toil-score / voice-check) | the facing surface of §5 + §6 |
| `templates/` | 3 entry skeletons (macro / mezzo / micro) | §3.3 tier-conditional density |
| `renderers/` (v0.2+) | entry → derived surface auto-generator | §8 SSoT propagation (v0.1 = manual) |

The `mcp/` directory is v0.3+ deferred (§11.3) — entry into gp_query / gp_load / gp_promote MCP tool exposure comes after satisfying the multi-agent residency precondition.

### §12.2 The location + invariant of the hook spec JSON schema

Hook spec canonical = `plugins/greatpractice/schemas/hook-spec.schema.json` (draft-07). It serializes the 7 fields of §4.2 (event / matcher / condition / action / enforcement_level / tiered_strictness / fatigue_budget_ms) as-is. **Even if an alternative adopter implements its own hook runtime** — if it produces a spec file that passes this schema, it is horizontally compatible with this module (psychology §1.8's *format-as-mechanism* — the schema itself is a d≈0.65 effect source).

2 additional schemas:
- `entry-frontmatter.schema.json` — §3.2's v0.1 mandatory 7 fields (id / tier / binding / enforcement_level / trigger / lifecycle / last_referenced_turn) + tier-conditional optionals (§3.3).
- `voice-rules.schema.json` — the declarative notation of §6.3's regex linter rule (pattern / category / severity / rewrite_hint / examples). This schema remains as the contract even when extended to an ML intent classifier.

### §12.3 voice-check.cjs regex MVP — runtime concrete patterns

This is the *runtime concretization* of §6.3's 10 spec-level patterns (L1-L10, category + intent). This table is the actual regex + severity matrix of `plugins/greatpractice/runtime/eg_voice_check.cjs` v0.1 — declaratively registered in `voice-rules.schema.json` + loaded by the cjs.

| # | category | pattern (gist) | severity | rewrite hint |
|---|---|---|---|---|
| 1 | blame-attribution | `/[가-힣]+\s*(때문에|탓에)\s*(실패|miss|drop|에러)/` | block | re-describe with an objective clause + a multi-causal clause (§6.2) |
| 2 | blame-attribution | `/(누가|who)\s+(잘못|책임|fault)/i` | block | re-describe with a second-story clause (sre §1.3) |
| 3 | passive-idle-wait | `/(기다리|대기|wait(ing)?)\s+(중|만)\b/` | warn | explicit needs-your-action surfacing (§6.5) |
| 4 | single-cause-framing | `/(원인은|root\s*cause(?!s))\s+\S+(이고|뿐|만)/` | warn | enforce a multi-causal clause (≥ 2 contributing factors) (sre §1.3 second-story) |
| 5 | should-have | `/(했어야|should\s+have|당연히)\s+\S+/i` | warn | convert counterfactual → codification-target clause (humanities §1.6) |
| 6 | hindsight-bias | `/(역시|뻔히|당연한\s*결과)/` | warn | epistemic humility — psychology §1.13 |
| 7 | finger-pointing | `/(이\s*agent|that\s+agent)\s+(가|이)\s+\S*(놓쳤|miss)/` | block | system-level second story (Dekker) |
| 8 | absolutist | `/\b(절대|always|never)\s+\S+(안|못)\s/` | warn | explicit binding ratio + conditions (humanities §1.1) |
| 9 | passive-voice-evasion | `/(되었|이루어졌|발생되었)다/` | advisory | explicit subject (objective clause) |
| 10 | meta-blame | `/(spec|hook|hyperbrief)\s*(가|이)\s+(부실|불충분|미흡)/` | warn | re-describe with a codification-target clause (an improvement-hook proposal) |

**Hook block message self-application**: the `action.payload` of the Cluster B (poka-yoke enforce) hook must itself pass this linter — `hook-spec.schema.json`'s `action.voice_checked: true` is the default. That is, if an enforce message is in a blame voice, it *boomerangs* into a lint block — an implementation expression of the *self-applicative* in which Greatpractice applies to itself as well.

False-positive control: each pattern's `examples.positive[]` + `examples.negative[]` are attached to the schema, with regression tests on change. After 30 days of dogfood measurement, if the false-positive rate > 5%, revise the pattern (apply the §7.4 distinguish / per-incuriam cost tier).

### §12.4 INDEX.md auto-generation script

The v0.1 behavior of `plugins/greatpractice/runtime/eg_build_index.cjs`:

1. parse each entry frontmatter of `greatpractice/macro/*.md` → extract `id` + `title` + `binding` + `enforcement_level` + the body's **1-line summary right after the first H1** (the blockquote `>` line or the first line of the first paragraph).
2. accumulate the token count (TikToken-equivalent estimate, cl100k-base) — **300 token cap** (the EG variant of canonical §1.4 Wikipedia Summary Style). On exceedance, it is a signal that the macro entry count is 8+ → emit a critic warning + replace the line of the most stale (oldest last_referenced_turn) entry with a *truncated marker*.
3. the mezzo / micro tiers are **not** enumerated in INDEX.md — the contract of lazy materialization (§2.5 + os §1.6): fault-in from macro, and mezzo / micro path-resolve at the point of need.
4. the output is a deterministic write to `greatpractice/INDEX.md` — regenerated every ratification cut (called by `eg_greatpractice_promote.cjs`) + when dirty after the freshness scan of the cycle-end Stop hook extension (§12.6).

Handling of empty / phronesis_boundary=true entries: enumerate them but place a `(phronesis — inject reference context only)` marker in the summary slot. Other agents also learn *which region is codify-prohibited* as part of the SessionStart inject.

### §12.5 Lint fail vs warn policy + 6 cycle grace period

The v0.1 policy of `plugins/greatpractice/runtime/eg_greatpractice_lint.cjs` (mapping the spec-level decisions of §3.8 onto the implementation surface):

| Field absence | v0.1 behavior | After the grace period (cycle ≥ 7) |
|---|---|---|
| `id` / `tier` / `trigger` absence | **block** (exit 2) — an unidentifiable entry's promote is itself a violation | block (no change) |
| `binding` / `enforcement_level` / `lifecycle` / `last_referenced_turn` absence | **block** for *new* promote, **warn** for *retro-backfill* (`source_evidence.retro: true` marker) | block (all) |
| `evidence_quality` / `recommendation_strength` / `parent` / `children` (macro) | warn | warn (no change — even a GRADE-unevaluated entry can ratify) |
| `surfaces[]` / `coherence` / `audit_trail` | warn | warn (consider promotion to block when entering P2 surfaces automation) |
| `hash` / `deps` / `rrpv` / `miss_count` | silent (v0.1 placeholder) | silent (warn when active in v0.2+) |

**The meaning of the 6 cycle grace period**: for 6 release cycles right after this spec ships (≈ v2.5.50 → v2.5.55, aligned with the §11 cut cadence) — it permits gradual retro-backfill of existing operational evidence (accumulated operational observations + EG dogfood evidence + the 11 procedural feedback artifacts of the phase_3 cycle). A retro-backfill item has a `source_evidence.retro: true` marker in frontmatter + when the cycle counter exceeds 6, lint auto-promotes to block. This is the *standard-introduction cost-amortization* of management §1.3 kaizen baseline — avoiding the cognitive load of a big-bang migration.

Lint execution triggers:
- Pre-commit hook (inner repo) — scan only the entry changes right before `git commit`.
- internal call by `eg_greatpractice_promote.cjs` — forced pass right before promote.
- Cycle-end Stop hook extension (§12.6) — full corpus scan, dirty list emit (warn only, no block).

### §12.6 Boundary with the Stop hook — thin wrapper + extension

The existing `EstreGenesis/constellation/reference/runtime/stop-hook/pre-send-probe.cjs --rearm` is **kept as a thin wrapper** (avoiding damage to the *existing responsibilities* of Constellation §13.x's inbox cursor advance + meaningful surface + watcher respawn). Greatpractice's additional cycle-end responsibilities are isolated in the separate module `plugins/greatpractice/runtime/eg_stop_hook_extensions.cjs` + the wrapper makes a sub-process call.

Call order (deterministic):

```javascript
// pre-send-probe.cjs --rearm (thin wrapper, v0.1.0)
const probeResult = await runInboxCursorProbe();        // existing responsibility 1
const surface = await emitMeaningfulSurface(probeResult); // existing responsibility 2
await rearmWatcher();                                    // existing responsibility 3

// Greatpractice extension (new, opt-in via settings.local.json flag)
if (process.env.EG_GREATPRACTICE_STOP_EXT === '1') {
  await require('./plugins/greatpractice/runtime/eg_stop_hook_extensions')
    .run({ probeResult, surface });
}
```

The extension's v0.1 responsibilities (aligned with the Stop event row of §4.1):
1. **Freshness probe scan** — emit the staleness list of entries with `last_validated_at + validation_cadence_days < now` (warn only, §7).
2. **Hook fire statistics accumulation** — record this cycle's hook fire count + ms in `.claude/.hook_latency.jsonl` (the basis of §4.5 fatigue budget enforce).
3. **INDEX.md dirty check** — if macro tier mtime > INDEX.md mtime, call `eg_build_index.cjs` (§12.4).
4. **SSoT propagation diff** — if the `surfaces[]` of entries changed this cycle is under-synced with the actual surfaces (skill / hook / memory_stub), warn (the entry-level inversion verification of §8).

v0.2+ extensions (deferred — §11.2): working-set rotation + CLOCK scan, refault distance aggregation, SHCT trigger_source counter accumulation, phase-transition detection.

**Why the wrapper-extension separation**: (i) the responsibility of the existing `pre-send-probe.cjs` is canonical to the communication discipline of Constellation §13 — Greatpractice is an *extension*, not a *replacement*, of that place (§7.4 distinguish — the cheapest revision cost tier). (ii) even if the extension's cjs throws, the existing 3 responsibilities of the wrapper are already complete — preserving the cycle-end reliability of the Stop hook. (iii) the `EG_GREATPRACTICE_STOP_EXT=1` flag is opt-in — even a spec-only / plugin-not-adopted adopter can use this wrapper pattern as-is (§10.4 plugin dependency separation).

---

## Appendix A. Cross-Axis Convergence Cluster Catalog

> This appendix is a *quick-reference index* that gathers, in a single table, the one-line summaries, axis-appearance counts, and EG adoption priorities of the **9 clusters** on which §3-§7 of the v0.1.0 spec (schema · hook taxonomy · maturation gate · voice framing · SSoT propagation) depend. For each cluster's pattern ID · per-axis §number · contradiction-matrix detail, refer to the cross-axis synthesis original (`cross-axis-patterns §1`). This appendix is back-referenced by cluster ID from the spec body (§3 schema · §4 hook · §5 maturation · §6 voice · §7-§8 freshness/SSoT).

### A.1 9-Cluster One-Liner Catalog

| ID | Cluster | One-line definition | Axis count | EG priority | spec body anchor |
|---|---|---|---|---|---|
| **A** | Lazy 3-Tier Hierarchy | macro/mezzo/micro tier separation + on-demand load — the upper tier holds the lower tier's summary + pointer | **8/9** | **P0** | §2.1 tier · §4.1 SessionStart |
| **B** | Deterministic Hook Enforcement | deterministic block / additionalContext inject by lifecycle hook (6 events) instead of model judgment | 7/9 | **P0** | §4.2-§4.7 hook taxonomy |
| **C** | Frontmatter-Driven Metadata Spec | YAML frontmatter is the governance SSoT — tier · trigger · deps · enforcement · freshness · supersedes · evidence-quality · recommendation-strength · RRPV · edit_policy unified | **9/9** | **P0** | §3.2 schema |
| **D** | Maturation Gates | the 3-stage gate raw → draft → ratified — frequency × cost × predictability thresholds + notability (significant + independent + verifiable) | 5/9 + multi-criteria patch | **P0 definition / P1 automation** | §5.1-§5.3 promotion flow |
| **E** | Blameless Second-Story Framing | blocks the self-blame cascade — "given what we knew at the time" + multi-causal + banning single-root-cause vocabulary | 4/9 | **P0** (regex MVP) | §6.1 voice linter |
| **F** | Freshness Validation Cadence | `last_validated_at` + `cadence_days` + hit-rate ≥ recurrence threshold — avoids the immutable-practice myth | 5/9 | **P1** | §7 staleness probe |
| **G** | Trigger-Source Attribution | SHCT signature-history + multi-scale (immediate / session / workspace) confidence-weighted average | 4/9 | **P2 statistics accrual** | §4.2 trigger_source enum |
| **H** | Cross-Surface SSoT Propagation | canonical entry = master, external surfaces (badge / docs / plugin.json / marketplace.json) = derived view — `surfaces: []` inversion | 4/9 | **P1** | §8 N-way sync |
| **I** | Phase-Transition Awareness | working-set rotation per work phase — short τ at phase start, long τ expansion after stabilization + snapshot restore | 4/9 | **P3 (after phase enum)** | §3.7 phase-aware deferred |

### A.2 Cluster ↔ 9-Axis Coverage Matrix

| Cluster | harness | humanities | psychology | management | processor | os | sre | memoization | canonical |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| A | O | O | O | O | O | O | O | O | O (8/9, sre=isomorphism) |
| B | O | O | O | O | O (indirect) | · | O | · | O |
| C | O | O | O | O | O | O | O | O | O |
| D | · | O | O | · | O | · | O | · | O |
| E | · | O | O | O | · | · | O | · | · |
| F | · | O | · | O | O | · | O | O | O |
| G | O | · | O | · | O | · | · | · | O |
| H | · | · | · | O | · | · | O | O | O |
| I | · | · | O | · | O | O | O | · | · |

### A.3 Core Consensus Patterns (1-2 citations within each cluster)

- **A** — Hennessy-Patterson L1/L2/L3/DRAM (`processor §1.1`) + Denning W(t,τ) working set (`os §2.1`) + Alexander pattern language (`humanities §3.8`) + Anthropic Skills 3-level progressive disclosure (`harness §1.1`) all derive the same *latency × frequency × capacity tradeoff* formula.
- **B** — Gollwitzer 1999 implementation intention (d≈0.65) (`psychology §1.8`) + Shingo poka-yoke 3 types (`management §1.8`) + Gawande 2009 4-principle (`humanities §1.7`) — the *format itself* is the source of the effect.
- **C** — Wikipedia canonical-entry-schema 9-section (`canonical §1.12`) + GRADE 2-axis (`humanities §1.5`) + Lally 66-day lifecycle (`psychology §1.10`) — *9/9 universal convergence*.
- **D** — Wikipedia Notability 3-criterion (`canonical §1.2`) + Aristotle phronesis boundary (`humanities §3.9`) — simple frequency alone is insufficient; independent + verifiable must pass simultaneously.
- **E** — Allspaw + Dekker blameless template (`sre §1.3`) + Kerth Prime Directive (`management §1.9`) — preserving narrative fidelity is a prerequisite for codification quality.
- **F** — Continuous PRR + Observability 2.0 (`sre §1.6`) + TPS kaizen baseline 12-week window (`management §1.3`) + Wikidata revisit cadence (`canonical §1.11`) — medians give defaults of micro 30 days / mezzo 90 days / macro 180 days.
- **G** — Intel SHCT signature-history (`processor §1.8`) + TAGE multi-scale tournament predictor (`processor §1.9`) + Klein RPD cue-recognition (`psychology §1.13`) — a single trigger signal is insufficient; 3-scale weighted average.
- **H** — Wikidata → Wikipedia infobox sync (`canonical §1.11`) + Honeycomb single-source (`sre §1.9`) + Bazel/Nix content-addressed (`memoization §1.8`) — the architectural remedy for N-way sync miss.
- **I** — Denning phase-transition signal (`os §1.4`) + Jouppi stream / victim buffer (`processor §1.10`) + Lally probation/consolidation/automatic (`psychology §1.10`) — phase enumeration is a prerequisite.

### A.4 Priority Rationale One-Liners

- **P0 (codify immediately)** — A · B · C · D (definition) · E: infrastructure validation complete + ≥4-axis consensus + dogfood evidence in hand.
- **P1 (next 1-2 cycles)** — D (automation) · F · H: the P0 frontmatter schema (C) is a prerequisite.
- **P2 (after 5-15 cycles of accrual)** — G: only the trigger_source enum is included in P0; statistical weighting comes after accrual.
- **P3 (after multi-agent + phase enum stabilizes)** — I: precondition is integrating the Constellation live-board phase tag.

For the detailed contradiction matrix (8 kinds: eager vs maturation · prefetch vs lazy · strict vs eventual, etc.) and resolution conditions, refer to spec body §10 (Adoption) + cross-axis original §2.

---

## Appendix B. 4 Strong Isomorphisms + Normative Justification

> This appendix is a *multi-domain evidence bundle* demonstrating that the architectural decisions of §2 (3-tier hierarchy) / §3 (frontmatter schema) / §4 (hook taxonomy) / §5 (maturation gate) do not depend on a single domain authority. Among the 9-axis pattern-extraction results, the 4 pairs of isomorphism that congealed into *perfect 1:1 mappings* are organized in §B.1-§B.4, and the *abridged normative-justification backfill* of the P0b modality (distributed cognition + organizational anthropology) is placed in §B.5-§B.6. Once the v0.2 cycle's full research is complete, this appendix is slated to be promoted to a separate §normative-foundations section — this cut is a v0.1 placeholder.

---

### §B.1 Isomorphism 1 — Lazy 3-Tier Hierarchy (8/9-axis universal convergence)

| Axis | Name | Unit | latency cost |
|---|---|---|---|
| processor (Hennessy-Patterson 2017) | L1 / L2 / L3 / DRAM | cache line | 1ns / 4ns / 12ns / 100ns |
| os (Denning 1968) | working set W(t,τ) — active / inactive / swapped | page | RAM hit / inactive scan / disk fault |
| memoization (Bellman 1957 + Haskell call-by-need) | hierarchical practice tree — overlapping subproblems | memo cell | cached / lazy materialize / recompute |
| canonical (Wikipedia Summary Style + `{{Main}}` hatnote) | lead / summary / full article | sentence / paragraph / article | inline / hatnote follow / spinoff load |

The 4 axes derive the same *latency × frequency × capacity tradeoff* formula in different vocabularies. EG's macro / mezzo / micro 3-tier (§2.1) is the *EG-scaled instantiation* of these 4 axes — macro = L1 / lead / always loaded, mezzo = L2 / summary / loaded on phase entry, micro = L3+DRAM / spinoff / atom-loaded on hook trigger. The 4 axes harness §1.1 (Anthropic Skills 3-level) + psychology §1.7 (Chase-Simon chunking) + management §1.4 (SECI Ba) + sre §1.1 (Production Guide → PRR → Runbook → atom) also converge on the same conclusion — the *empirical consensus of 8/9 axes* for this isomorphism is the basis for the universal convergence of Cluster A in Appendix A.

**Justification application**: the 3-tier split decision of §2.1, the per-tier frontmatter density differentiation of §2.3 (enforcing Cluster A's Level 1 ≤1024 chars cap) — this isomorphism is the *first-principle* source of the architectural justification.

---

### §B.2 Isomorphism 2 — Binding Rule + Advisory Commentary + Escape Valve (3-layer governance)

| Axis | binding layer | advisory layer | escape valve |
|---|---|---|---|
| humanities (Stare Decisis) | ratio decidendi | obiter dictum + illustration | distinguish / per-incuriam / overrule (§7.4 cost-tiered) |
| canonical (Wikipedia 5 pillars + RS + NPOV) | policy (BLP / V / NPOV) | guideline + essay | IAR (Ignore All Rules) |
| management (Drucker 1973 telos + ISO 9001 + IAR variant) | telos / mandatory standard | recommended practice | exception with justification |
| sre (runbook atom + production guide) | mandatory atom (block) | recommended atom (warn) | DECISION atom — human-judgment escape |

The 4 axes independently derive the same governance structure of *3 strata of binding strength + a final escape*. This isomorphism is the justification for the §4.2 `enforcement_level: mandatory | recommended | advisory` 3-tier field and the source of the §4.3 BRD-tiered escalation (1st BOLD soft → 2nd REVERT block+ack → 3rd DISCUSS+Hyperbrief).

**Important nuance**: the ratio / obiter distinction of humanities §1.1 is not merely a difference in *strength* but a *different modality of inferential commitment* (expressed in Brandom's inferentialism vocabulary, *which proposition commits which inference*) — this nuance is the reason §3.2 separates the `binding: ratio | obiter | illustration` field and the `recommendation-strength: MUST|SHOULD|MAY` field into *distinct axes* (avoiding single-field collapsing).

---

### §B.3 Isomorphism 3 — If-Then Schema + Forcing Function + Atomic Check (deterministic hook)

| Axis | Format | Effect size | enforcement modality |
|---|---|---|---|
| psychology (Gollwitzer 1999 implementation intention) | "if SITUATION X, then I will RESPONSE Y" | d ≈ 0.65 (meta-analysis 94 studies) | the format itself is the effect — prose if-then has effect 0 |
| management (Shingo 1986 poka-yoke) | contact / fixed-value / motion-step 3-type forcing function | defect-rate reduction in ppm units | physical/logical block — zero cognitive dependence |
| humanities (Gawande 2009 checklist) | killer items 5-7 / pause point / 60-90s budget | WHO Surgical Safety Checklist mortality down 47% | enforces pause-then-proceed |
| sre (Google SRE Ch.11 runbook) | atom = (command | check | decision) 3-type executable | MTTR reduction (Beyer 2016) | code form → no human-judgment dependence |

The 4 axes derive the same conclusion that *the format itself creates the effect* across different domains. The strongest evidence: psychology §1.8's finding that *prose-form if-then has effect 0, only JSON-schema form yields d≈0.65* — this result is the justification for the schema-strict JSON enforcement of the §4.2 hook spec (`schemas/hook-spec.json`), and the source of §3.2 frontmatter's `trigger.if` / `trigger.then` 2-field structured enforcement (prose description banned).

**Application nuance**: the constraint of humanities §1.7's *fatigue budget 60-90s + killer items 5-7* is the *upper bound* of this isomorphism — even if the hook is deterministic, checklist bloat causes loss of narrative fidelity (sre §4.3). Therefore the §4.5 hook frequency budget is the *built-in cap* of this isomorphism.

---

### §B.4 Isomorphism 4 — Evolution + Preservation + Cross-Reference Preservation (supersession graph)

| Axis | Evolution mechanism | Preservation mechanism | cross-reference |
|---|---|---|---|
| canonical (Wikipedia Merge 4-Phase + Redirect) | merge proposal → consensus → execute → redirect | redirect stub permanently preserved | all incoming links preserved |
| humanities (Restatement supersession + Stare Decisis) | distinguish < per-incuriam < overrule (§7.4 cost-tiered) | the dissent / concurrence of the prior holding preserved | subsequent citation chain maintained |
| management (TPS kaizen-baseline + supersedes graph) | `last_reviewed` + `supersedes:` + `superseded_by:` DAG | permanent record of *why the prior standard was changed* | kaizen's *baseline ≠ embalmed* thesis |
| memoization (Bazel/Nix content-addressed + dependency-tracked invalidation) | on `hash:` change, dependents auto-invalidate | content-address permanently preserved (reverse lookup possible) | transitive closure of the dependency DAG |

The 4 axes derive the same conclusion of *evolving without losing history*. This isomorphism is the architectural justification for the promote / supersede / archive operational decisions of §5.4-§5.6 and the source of §3.4 frontmatter's `supersedes:` / `superseded_by:` / `redirect_from:` fields.

**Core thesis**: *deletion ≠ redirect removal* (canonical §1.3) — after promotion, replace with a one-line redirect stub in the memory feedback slot, but the original file path must stay alive to prevent broken cross-references. This thesis is the justification for the *enforced redirect stub* after promotion in §5.5.

---

### §B.5 Normative Justification 1 — Distributed Cognition + Extended Mind (Hutchins · Clark-Chalmers)

> **P0b research status: complete (axis 1).** This subsection is the verified backfill of the distributed-cognition modality — sources are primary papers (Clark & Chalmers 1998; Rupert 2004; Adams & Aizawa 2008; Allen-Hermanson 2013), the Stanford Encyclopedia of Philosophy, and peer-reviewed journals, adversarially cross-checked. Its promotion to a standalone `§normative-foundations.distributed-cognition` *body* section is reserved for the v0.2 cut (§B.7).

**Core theses**:
- Hutchins (1995, *Cognition in the Wild*): cognition is distributed across *system + artifact + person*, not inside one head. A navigation *fix* is the collective cognitive product of chart + instrument + crew, not a single navigator's act.
- Clark & Chalmers (1998, *The Extended Mind*) — the **parity principle**: if part of the world does a job that, were it done in the head, we would unhesitatingly call cognitive, then that part *is* part of the cognitive process. Parity is the *motivating principle*; it is distinct from — and must not be conflated with — the operational coupling criteria below.
- The **coupling criteria** (Otto's notebook, four features): (1) reliable / a constant, consistently available; (2) directly accessible without difficulty; (3) automatically endorsed on retrieval; (4) consciously endorsed at some past point. C&C explicitly *rank* them: features 1-3 "certainly play a crucial role," while the 4th is "arguable." The criteria are **graded, not binary** — as a resource lacks them, cognitive status "gradually falls off," with genuinely indeterminate intermediate cases.

**EG application**:
- The normative ground for *why these fields* in §3.2 frontmatter = the coupling criteria. `last_validated_at` + `freshness_until` = **reliable**; `tier` + `paths:` + `surfaces:` = **accessible**; `enforcement_level` + `evidence_quality` + `recommendation_strength` = **automatically endorsed**.
- The crucial-vs-arguable ranking is a *primary-source warrant for the enforcement tiering*: reliability / accessibility / automatic-endorsement are load-bearing (mandatory-eligible); provenance / past conscious endorsement is the *contested* criterion and is therefore best kept **advisory** — adopting it as a gate re-privileges an internal subject (Rupert 2004) and so should not be load-bearing.
- The graded model justifies the mandatory → recommended → advisory *spectrum* plus an explicit indeterminate zone: borderline entries are not force-classified.
- Cluster C (frontmatter SSoT 9/9 convergence) is the *empirical* justification; distributed cognition is the *normative* one. On multi-agent residency (Phase 2.5), Hutchins grounds Cluster H (cross-surface SSoT propagation): if agent + tool + workspace are one cognitive system, surface distribution is *system architecture*, not an implementation detail.

**Boundary — what this does NOT license**:
- The coupling criteria are **necessary quality criteria, not a sufficiency test.** The "cognitive bloat" objection (Rupert 2004; Adams & Aizawa, *The Bounds of Cognition*, 2008; Allen-Hermanson 2013, *Superdupersizing the Mind*) shows reliability + accessibility + trust are "satisfied far too easily" — absent a further constraint, *every* constantly-consulted trusted source would count as cognition. Greatpractice therefore does **not** claim a codified practice *becomes* the agent's mind merely by being relied upon (the coupling-constitution fallacy: causal reliance ≠ constitution).
- The defensible framing is **embedded** (a resource the agent leans on; Rupert's rival HEMC), not literally **extended / constitutive** — same design force, lower metaphysical commitment, and it is the boundary that keeps codification from over-reaching. It dovetails with the phronesis-codify boundary (§5.3) and the institutional over-codification limit (§B.6).

This subsection completes the v0.1 placeholder's normative gap (P0b axis 1).

---

### §B.6 Normative Justification 2 — Organizational Anthropology + Institutional Isomorphism (Douglas · Powell-DiMaggio)

> **P0b research status: complete (axis 2).** Verified backfill of the institutional-isomorphism modality. The headline result: the empirical record *qualifies* rather than confirms the fear that mandatory standardization mechanically suppresses innovation, and supplies **no numeric threshold** — which corrects two v0.1 over-claims (below). Promotion to a `§normative-foundations.institutional-isomorphism` *body* section is reserved for the v0.2 cut (§B.7).

**Core theses**:
- Douglas (1986, *How Institutions Think*): an institution performs cognition on behalf of its members — it *classifies, confers identity, remembers and forgets*. Codification is a mechanism of the "social control of cognition." The thesis is dual: classification systems are tied to the institutional order *yet remain held in individual consciousness*. (Used here as a *framing warrant*, not an empirical law — Douglas's program is influential but its strong form is empirically under-tested.)
- DiMaggio & Powell (1983, *The Iron Cage Revisited*, ASR 48:147-160) — three *analytically distinct* mechanisms of isomorphic change:
  - **Coercive**: formal/informal pressure from depended-on organizations + cultural expectations; stems from political influence and the problem of legitimacy ("felt as force, as persuasion, or as invitations to join in collusion").
  - **Mimetic**: modeling on organizations perceived as more legitimate/successful under uncertainty — ubiquity owed to "the universality of mimetic processes" rather than "concrete evidence that the adopted models enhance efficiency."
  - **Normative**: professionalization — formal education legitimated in a university-produced cognitive base + professional networks that diffuse models across organizations.
  - The authors stress this is *analytic*: "the types are not always empirically distinct."

**EG application (interpretive bridge)**:
- The §4.2 `enforcement_level: mandatory | recommended | advisory` 3-tier maps *by analogy* to the three mechanisms: `mandatory` ≈ coercive (hook block), `recommended` ≈ mimetic (additionalContext inject / suggested model), `advisory` ≈ normative (frontmatter-only soft codification). This is an EG analogical bridge, **not** a claim the sources make; and because D&P warn the types are not always distinct, the tiers are analytic and may overlap. (The v0.1 claim of an *exact* 1:1 with "exactly 3, no pressure outside them" is retracted — Beckert 2010 adds a fourth mechanism, *competition*, outside D&P's three.)
- Isomorphism is **decoupled from efficiency**: D&P find isomorphic processes "improve organizational transactions" but "do not necessarily increase internal efficiency." So an entry's value is coherence / identity / legitimacy — efficiency is a *separate* claim requiring its own evidence.

**Risk thesis — corrected by the empirical record**:
- The v0.1 spec asserted (citing Powell-DiMaggio) that isomorphic pressure *inhibits innovation* and causes path-dependency lock-in. The verified literature **does not support this as a general law**:
  - Hambrick, Finkelstein, Cho & Jackson (2004, *Isomorphism in Reverse*, Research in Organizational Behavior 26:307-350): across 18 industries / 162 regressions (1980-2000), more than **twice** as much evidence of increased *heterogeneity* as homogeneity — directly contradicting the iron-cage hypothesis. D&P were "correct about the forces," but those forces are contingent, not monotonic.
  - Heugens & Lander (2009, *AMJ* 52(1):61-85 meta-analysis): the influence of social structure is **"weak"** (agency is substantial); adopting isomorphic templates is net performance-*improving*, not harmful.
  - Beckert (2010, *Institutional Isomorphism Revisited*, Sociological Theory 28(2)): the same mechanisms are **directionally indeterminate** — under different conditions they drive *divergence* as readily as convergence; the iron cage is conditional and "may not exist at all."
- **Corrected design principle**: a `mandatory` entry neither inherently calcifies nor inherently enables — the outcome is *condition-dependent*. The module's job is to make the *conditions* legible (is the rule still serving its end? is it drifting?), not to assume a fixed safe ratio. This is the root-cause-level justification behind the symptom-level over-engineering note (sre §4.4); the open theoretical task (Beckert) is to characterize the conditions under which a mechanism homogenizes vs. enables.

**The quantitative cap — retracted as unverified**:
- The v0.1 spec recommended a `mandatory` ratio ≤ ~20%. The research **verified that no such evidence-based numeric threshold exists** in this literature (a full-text check of Beckert 2010 for threshold / percent / maximum / tolerable confirmed the absence). The ≤20% figure is therefore reclassified as an **unverified operational heuristic**, not a literature-grounded bound. The defensible discipline is qualitative: *keep the `mandatory` tier minimal and condition-aware*; the standardization↔novelty relationship is non-monotonic, so both over- and under-codification carry cost. (Removing the numeric cap from the §4.5 hook-frequency budget is a v0.2-cut change — see §B.7.)

**Application decisions**:
- Adopt the §4.2 enforcement_level 3-tier as an *analytic* bridge to the three mechanisms (overlap permitted; not an exact partition).
- Treat the ≤20% mandatory ratio as a *heuristic* pending replacement by a condition-aware maturation rule, not a hard cap.
- The phronesis-codify boundary (§5.3) + the distributed-cognition sufficiency boundary (§B.5) + this institutional *contingency* together define the *do-not-over-codify* domain — the heart of the normative justification.

This subsection completes the v0.1 placeholder's normative ground (P0b axis 2) and corrects two v0.1 over-claims (innovation-inhibition-as-law; the ≤20% numeric cap).

---

### §B.7 Status of This Appendix + v0.2 Cycle Entry Conditions

- **§B.1-§B.4** = the confirmed *4-pair 1:1 mappings* of the 9-axis cross-axis synthesis — v0.1 ratified. Synced with cross-axis §Appendix B (the same enumeration of the 4 isomorphisms).
- **§B.5-§B.6** = the **verified P0b modality backfill** (research complete). Both abridged placeholders are now expanded subsections grounded in adversarially cross-checked primary sources (~9 patterns per axis), and two v0.1 over-claims have been corrected: the distributed-cognition coupling criteria are *necessary, not sufficient* (cognitive-bloat boundary, §B.5), and the institutional "isomorphism inhibits innovation + ≤20% mandatory cap" claim is *empirically contingent with no numeric threshold* (§B.6). Promotion from Appendix B to a standalone *normative-foundations body* section remains a v0.2-cut restructure.
- **v0.2 entry conditions**: (a) 6-12 cycles of dogfood accrual on this v0.1 spec — *pending*, (b) completion of the P0a patch (6 EG-specific lapses + maturation gate re-synthesis + pattern depth 8 reinforcement) — *pending*, (c) completion of the P0b modality 2-axis full research — **✓ complete**. When all three are met, the v0.2 cut promotes Appendix B to the *normative-foundations* body and removes the unverified ≤20% numeric cap from §4.5.

cross-axis citation: the synthesis of `cross-axis §1 Cluster A-H universal convergence` (empirical justification) + `critic §1.1 + §1.4 modality backfill` (normative justification) is the two-layer structure of this appendix.

---

## Appendix C. Self-Application — the frontmatter of this spec itself

> This appendix is the result of treating the Greatpractice.md v0.1.0 body spec itself as a *macro tier ratified entry* and applying the entry schema of §3 to it. *Self-consistency* is the primary dogfood evidence — it is a reductio that if this spec cannot satisfy the governance SSoT form it defines for itself, then the §3 schema is inapplicable to external entries. Cluster C's 9/9 universal convergence justifies the reflexive claim that *this spec is also a kind of entry*.

### C.1 The entry frontmatter of this spec (proposed)

```yaml
---
# === Identity (§3.2 v0.1 mandatory) ===
id: greatpractice-module-spec
tier: macro
title: Greatpractice Module Specification
slug: greatpractice
created_at: 2026-06-04T00:00:00Z
last_referenced_turn: 2026-06-04T00:00:00Z

# === Evidence + binding (§3.2 mandatory · §3.3 macro-required) ===
source_evidence:
  - reports/2026-06-04-greatpractice-research/axes/         # 9 axes × {original, patterns}
  - reports/2026-06-04-greatpractice-research/synthesis/    # cross-axis + critic + spec-hints
  - phase_3 cycle dogfood evidence (EG cuts v2.5.45-v2.5.49)
  - memory/feedback_*.md (11 items accrued — the raw source of codification)
binding: ratio                            # humanities §1.2 — operative governance
enforcement_level: recommended            # this spec itself is mid-point advisory-ratio — promoted to mandatory after passing the §10 adoption gate
evidence_quality: high                    # humanities §1.5 GRADE — 9-axis × multi-source backing
recommendation_strength: SHOULD           # the adoption decision is at the EG operator's discretion — not MUST

# === Trigger (§3.3 — psychology §1.8 if-then format) ===
trigger:
  if: "EG-style operational cycle introduced + recurring violations ≥ 3 kinds + active surfaces ≥ 11"
  then: "apply this spec §1-§12 + introduce plugins/greatpractice/ scaffold"
  format: prose-with-yaml                 # the spec body is prose, only the schema part is YAML
  source: post-incident                   # 11 memory feedback + 16 sync-misses of the phase_3 cycle

# === Tier topology (§2.6 parent-child graph) ===
parent: null                              # macro root — sibling to other macro entries
children:                                 # items slated to enter draft as a result of §5.4 routing
  - communication-discipline              # bridge lifecycle + a2a priority + pre-send probe
  - release-cadence                       # version + CHANGELOG cut simultaneously
  - workspace-cleanliness                 # inner/outer separation + gitignore operational state
  - codification-boundary                 # the macro entry of phronesis_boundary scope

# === Multi-criteria maturity (§5.1) ===
maturity_score:
  frequency: 5      # the 11 memory feedback are the frequency evidence
  depth: 5          # 9-axes deep research backing
  recency: 5        # as of 2026-06-04 — staleness 0
  cost: 5           # 16 sync misses · 3 outbox drops · accrued cost of numerous a2a incidents
  predictability: 4 # most patterns predictable, only phase-transition (Cluster I) is emergent
                    # — for the weighted-sum computation, refer to the §5.1 formula

# === Lifecycle (§3.3 · psychology §1.10 Lally 66 days) ===
lifecycle: probation                      # 0-30 days right after v0.1 ship — consolidation entry is after 30 days
coherence: soft                           # processor §1.11 MESI — multi-agent coherence is v0.3+
edit_policy: owned                        # canonical §1.9 — macro is owned by default
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-04T00:00:00Z, agent: workflow-spec-draft, action: created, prev_hash: null}

# === SSoT propagation (§8 — Cluster H, 4-axis consensus) ===
surfaces:
  - {kind: spec,        path: EstreGenesis/Greatpractice.md,                                  inherits_freshness: true}
  - {kind: plugin,      path: EstreGenesis/plugins/greatpractice/,                            inherits_freshness: true}
  - {kind: docs-badge,  path: EstreGenesis/docs/index.html#greatpractice-version,             inherits_freshness: true}
  - {kind: docs-page,   path: EstreGenesis/docs/greatpractice.html,                           inherits_freshness: true}
  - {kind: marketplace, path: EstreGenesis/.claude-plugin/marketplace.json#plugins[greatpractice], inherits_freshness: true}
  - {kind: readme,      path: EstreGenesis/README.md#modules-section,                         inherits_freshness: true}

# === Evolution (§3.4 — humanities §1.2 supersedes graph) ===
supersedes: []                            # new module — no prior entry
superseded_by: null
kaizen_baseline_since: 2026-06-04         # management §1.3 — "standard ≠ embalmed"

# === Deferred (§3.7 — v0.2+ active) ===
hash: null                                # BLAKE3(canonical_body) — v0.2+ memoization §1.8
deps: []                                  # dependent entry hash — v0.2+
rrpv: 2                                   # processor §1.7 default mid-protect
miss_count: {compulsory: 0, capacity: 0, conflict: 0, coherence: 0}

# === Codify boundary (§5.3 — humanities §3.9) ===
phronesis_boundary: false                 # the spec body is codifiable — separate from the boundary convention this spec defines
class: persistent                         # os §1.11 — cross-session
---
```

### C.2 §3 schema application result: primary dogfood checklist

| Verification item | Result | Comment |
|---|:-:|---|
| v0.1 mandatory 7 fields (id · tier · binding · enforcement_level · trigger · lifecycle · last_referenced_turn) all populated | PASS | §3.2 lint scope satisfied |
| macro-required fields (children · surfaces · owner · audit_trail) satisfied | PASS | §3.3 macro branch |
| Multi-criteria maturity_score all 5 axes quantified | PASS | §5.1 multi-criteria — avoids frequency-alone dependence |
| Trigger if-then schema form (no prose) | PARTIAL | spec body mixes prose + YAML → honest marking with the `format: prose-with-yaml` marker. Consider splitting into §4 hook DSL in v0.2+ |
| surfaces[] all specify freshness inheritance | PASS | Cluster H · §8.5 catchball precondition satisfied |
| Phronesis boundary specified | PASS | the spec itself is codifiable — `false` |
| edit_policy ↔ tier consistency (macro=owned) | PASS | §2.4 mapping satisfied |
| Deferred field placeholder (null/0) specified | PASS | §3.7 v0.2+ active reservation normal |

### C.3 Discovered schema gaps (v0.2 backfill candidates)

The 4 points where this dogfood is *partial* rather than a *complete success* — they are evidence for the subsequent revision of the §3 schema.

1. **Missing trigger.format for spec-type entry** — `prose-with-yaml` is not in the v0.1 enum. The current §3 schema defines only trigger.format ∈ {json-schema, regex, count-threshold}. To absorb the spec body entry itself into a schema, a `prose-with-yaml` or `spec-body` enum addition is needed.
2. **Absent promotion-status notation for children** — the 4 children (communication-discipline, etc.) are *planned*, not *extant*. The element of `children:` should have been a `{slug, status: planned|draft|ratified}` object to be precise. v0.1 allows only a string list → a candidate for precision-tuning the graph topology of §2.6.
3. **Absoluteness of source evidence paths** — `reports/...` is an outer (private) path. When shipped to the public repo, this appendix's own frontmatter must also be redacted (public-repo redaction discipline — this spec's voice linter L7/L8 catches it). Consider adding a redaction lint for the `source_evidence` field in v0.2.
4. **Meaning of last_referenced_turn** — unlike an entry, the spec body is a normal surface that is *always referenceable*. Whether to auto-update it at every cycle turn-end or only at manual cut points — the §3.2 mandatory field definition is ambiguous. The dogfood result: *for a spec entry, last_referenced_turn is weak in meaning* — `null` allowance or a separate sub-tier definition is needed.

### C.4 The normative implications of self-application

The very fact that this appendix's frontmatter *partially* satisfies the §3 schema is itself evidence in two directions.

- **Positive**: the v0.1 mandatory 7 fields and macro-required fields apply naturally even to the *spec body* of the macro tier — passing the *boundary case* of the 9/9 cross-axis convergence (Appendix A Cluster C). Cluster C's universal claim holds for this spec itself too.
- **Negative**: at the 4 points of trigger.format · children topology · source_evidence redaction · last_referenced_turn semantics, the schema does not host a *spec-type entry* precisely. It can be handled as a simple lint warning, but the *completeness* claim of the §3 schema is weakened. Backfill is mandatory in v0.2 (joins the v0.2 roadmap of §11.2).

This aligns exactly with humanities §3.8 (the *self-instantiation* requirement of Alexander's pattern language) + management §1.10 (IAR's *self-compliance of the meta-rule*), namely that *self-application is the schema's most stringent stress test*. The normative claim that if the spec itself cannot satisfy its own governance SSoT form, then its moral authority to apply it to external entries is weakened (Powell-DiMaggio 1983, *normative isomorphism*) — the PARTIAL 4 points of this appendix are the prioritization basis for the v0.2 backlog.

### C.5 Self-application tracking of subsequent cuts

At every cut of this spec in v0.2+, *re-run* this appendix — update the frontmatter's maturity_score · lifecycle · last_referenced_turn · audit_trail + note whether the 4 C.3 gap points are resolved. Once the PARTIAL → PASS transition completes around v0.5+, this appendix can be promoted to a reference exemplar of a *macro tier ratified entry* — isomorphic to the promotion path of §5.4-§5.6 (`psychology §1.10` Lally 66-day consolidation).

This appendix itself is the starting point of this spec's *self-trust*.
