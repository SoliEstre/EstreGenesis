# Hyperbrief — Synthesis and Module Design

> Synthesis of the six-axis deep research (document 001) into a single design proposal: a new EstreGenesis top-level module `Hyperbrief.md` alongside `Constellation.md` and `Superscalar.md`, plus a `plugins/hyperbrief/` Claude Code plugin scaffolding. The document is in two parts: **Part A — Synthesis** distills the cross-axis convergences and tensions, refines the 8-section spec, and consolidates the normative rules; **Part B — Design** specifies module location, file layout, IR JSON schema, MD/HTML templates, Constellation A2A integration, machine-readable trigger rules, Superscalar interlock, and the adoption path.

---

# Part A — Synthesis

## A.1 Core thesis

Hyperbrief is a **gating ritual** that regulates *the very act of an AI asking the user for a decision*. It is not an information package — it is a five-stage pipeline:

1. **Delegation-eligibility verification** (trigger rubric) — does this matter even qualify for user delegation, or should the agent decide and post-notify?
2. **Epistemic-honesty enforcement** — every claim carries an inline tag, every recommendation a falsifier, every option set its pruned alternatives, every option decomposition its hidden assumptions.
3. **Cognitive de-biasing** — 2×2 framing matrix instead of single narrative; progressive disclosure with soft gates; active-choice pre-mortem; reject-the-framing meta-branch as a first-class option.
4. **Reversibility-first decision governance** — RAPID roles; Cynefin domain-adaptive tree formats; reversibility-as-lexicographic-prior; reversible-fallback paired with every recommendation.
5. **Post-decision learning loop** — decision lineage; revisit-date auto-registration; outcome-vs-decision-quality retrospective; Brier-score calibration; alert-fatigue self-throttle.

The 8 sections are not a markdown format — they are required fields in a JSON IR that is rendered deterministically into MD and HTML by code, not by the LLM. The module's essential function is not "help make better decisions" but **structurally prevent the agent from dragging the user into a consent-coercion circuit**.

## A.2 Cross-axis themes (convergence)

Ten load-bearing themes where multiple axes independently arrived at the same diagnosis through different vocabularies. Convergence is the synthesis's strongest signal — when six unrelated disciplines reach the same prescription, the prescription is structural, not stylistic.

### Theme 1 — Trigger Rubric: firing Hyperbrief is the first decision

**Supporting axes**: AI Harness, Philosophy, Management, Psychology, Long-horizon Development.

All five axes independently warn that "if Hyperbrief fires on every branch, alert fatigue and false escalation hollow out the module itself". AI Harness specifies 5 yes/no conditions (irreversibility / blast radius / external notification / resource threshold / prior-decision supersession); Philosophy specifies Jonas's 4-indicator minimax (irreversibility / scale / time horizon / reversal cost); Management combines Bezos Type 1/2 with Cynefin domain; Psychology demands alarm-fatigue statistical tracking; Development supplies reversibility classification. Five different vocabularies, one shared gate.

**Design consequence**: §0 *Escalation Justification* meta-header above the 8-section body, with 4–5 quantitative scores plus a one-line "why the AI did not decide autonomously". Score-sum below threshold blocks brief generation and routes to *autonomous decide + post-notify*.

### Theme 2 — Reversibility as lexicographic prior

**Supporting axes**: Philosophy, Management, Development, Humanities.

Philosophy (Jonas's responsibility asymmetry + precautionary principle), Management (Bezos Type 1/2 + Real Options), Development (one-way door + strangler-fig incremental paths), Humanities (Arendt's act-irreversibility) all derive — through different justifications — that "reversible and irreversible options must not be computed at the same EV". All also converge that reversibility cannot be a boolean: a 0–3 scale + rollback cost + reversal window + point-of-no-return multidimensional representation is required.

**Design consequence**: §0 reversibility badge (green / yellow / red); §5 reversibility panel (rollback cost + reversal window + trigger-to-revisit); §7 decision-tree root node fixed as reversibility check; §8 *Reversible Fallback* paired mandatorily. When the recommendation is irreversible, an explicit "I accept irreversibility" checkbox is forced.

### Theme 3 — Epistemic honesty surface

**Supporting axes**: AI Harness, Philosophy, Development, Humanities.

AI Harness demands a 4-tier epistemic tag `[verified | inferred | assumed | unknown]`; Philosophy demands Toulmin's six elements (qualifier + rebuttal) plus Bayesian calibration plus Popper's falsification trigger; Development demands `verified | inferred | assumed | unknown` tags plus an inferred-proportion threshold warning; Humanities demands Habermas sincerity plus provenance tagging (`[observed]` / `[inferred]` / `[external:source]` / `[assumed]`). The shared diagnosis: *"when guesses and facts print at the same weight, the user cannot perceive the thickness of mediation"*.

**Design consequence**: inline epistemic tags mandatory on every fact statement; untagged statements rejected by the validator. HTML renders the brief's overall epistemic shape as a doughnut chart ("70 % verified, 20 % inferred, 10 % unknown"). When `inferred + unknown > 40 %`, an automatic "low-confidence — additional reconnaissance recommended" header banner appears.

### Theme 4 — Anti-anchoring of the recommendation

**Supporting axes**: AI Harness, Psychology, Humanities, Management, Philosophy.

Psychology (anchoring + default + IKEA), Humanities (Gadamer's hermeneutic pre-understanding disclosure + Sennett's dialogic), AI Harness (`§8 = f(§7)` functional dependency), Management (MECE conditional recommendation: "X assuming A,B / fallback Y / switch Z"), Philosophy (virtue epistemology's confidence + falsifier paired) all diagnose "single recommendation + last position = the prior seven sections collapse into justification machinery". Six fields naming the same failure mode in six vocabularies.

**Design consequence**: §8 restructured into 5 blocks — Recommendation + Epistemic Profile + Defeaters + Pre-mortem + Reversible Fallback. Single declarative recommendation forbidden. Recommendations not citing §7 node IDs are invalid. In HTML, §8 defaults to collapsed and expands only after §7 is passed. The word "AI recommendation" is downgraded to "AI estimate" or "tentative recommendation".

### Theme 5 — Right to refuse the framing as first branch

**Supporting axes**: Humanities, Psychology, Philosophy.

Humanities (Floridi's informed consent voluntariness + Habermas's freedom-from-coercion in ideal speech), Psychology (default effect over-delegation prevention), Philosophy (a brief with a single option or false dichotomy is itself unfit) independently arrive at "if you only present yes / no / option-A / option-B, the framing is already coerced". The options the helpful-mode AI narrows down violate user autonomy.

**Design consequence**: §7 decision tree's top branch hardcodes `reject-framing` / `defer` / `request-investigation` meta-branches. §8 mandates `pruned options + exclusion reasons`. The brief's header carries a notice: "You don't have to answer this question". Constellation A2A response types add a `frame-rejection` enum.

### Theme 6 — Decision lineage and learning-loop closure

**Supporting axes**: Management, Development, AI Harness.

Management (Annie Duke's decision journal + OODA loop), Development (ADR's supersedes / superseded by + parent_decisions graph), AI Harness (Brier-score cumulative calibration + recommendation-adoption-rate statistics) all diagnose: "with only the decision-time brief and no post-hoc outcome linkage, the same agent repeats the same traps". For Hyperbrief to become a time-axis learning asset, decision-outcome pairing must be part of the module.

**Design consequence**: §0 includes `decision_lineage` (parent_ids[]); new §9 *Decision Capture* (chosen option + confidence at the time + falsification trigger + revisit date). Constellation accumulates a `decision ledger` index. When the revisit date arrives, an "actual outcome + outcome quality vs. decision quality retrospective" card auto-fires.

### Theme 7 — Pre-mortem as compulsory epistemic ritual

**Supporting axes**: Management, Psychology, Philosophy, Humanities.

Klein's pre-mortem (prospective hindsight) independently derived from 4 axes: Management (HBR 2007 empirical), Psychology (active choice + sunk-cost block), Philosophy (operational form of the falsification trigger), Humanities (Sennett's subjunctive mood). A single technique satisfying 4 axes' justification paths simultaneously is rare — load-bearing strength is highest here.

**Design consequence**: §5b or pre-§8 *Pre-mortem* subsection forced: "if this recommendation is a clear failure 6 months from now, the most likely failure path + early warning signal". Before decision confirmation, ≥ 1 sentence of user-typed pre-mortem free-input (active-choice gate). Without it, decision confirmation is blocked.

### Theme 8 — Single source of truth via deterministic IR rendering

**Supporting axes**: AI Harness, Long-horizon Development.

AI Harness ("LLM stochastic sampling causes drift when MD/HTML are generated separately") + Development (Constellation §13.11 attachment transport-mode discipline forbidding source-of-truth split) reach the same conclusion. The LLM emits only the IR (JSON); MD/HTML rendering must be deterministic code to preserve information coherence across the same decision context.

**Design consequence**: pipeline `LLM → Hyperbrief JSON IR → MD renderer (code) / HTML renderer (code)`. Mermaid diagrams and chart.js data live as data fields in the JSON; the LLM never produces MD / HTML / mermaid free-form. Prompt-level prohibition.

### Theme 9 — Cynefin / domain-adaptive tree format

**Supporting axes**: Management, Psychology, Philosophy.

Management (Snowden Cynefin: deterministic decision tree only in Clear / Complicated; probe-sense-respond in Complex; act-now in Chaotic) + Psychology (rank-and-preview interaction to block checkbox IKEA effect) + Philosophy (information-gain principle: cheapest discriminator first) share the diagnosis: "checkbox decision tree is a false-confidence engine when misapplied to the wrong domain".

**Design consequence**: Cynefin domain judgment before entering §7. Clear/Complicated → mermaid decision tree (checkbox leaves + node IDs); Complex → 3 safe-to-fail probes + observation indicators; Chaotic → "act now + 24h retrospective scheduled" single card. Root 3 nodes fixed as (reversibility, blast radius, time pressure).

### Theme 10 — Constellation A2A type discipline

**Supporting axes**: AI Harness, Long-horizon Development, Management.

AI Harness (new DECISION_REQUEST/DECISION_RESPONSE message types) + Development (Constellation §13.13.2 at-least-once relay + ack 3-tier) + Management (RAPID role tagging + pending-queue drain). Plain TEXT_MESSAGE fallback loses both ack semantics and redelivery guarantees, destroying decision traceability.

**Design consequence**: Hyperbrief cards as `DECISION_REQUEST` A2A type with ack tier extended to 3 (received / acknowledged / decided). User decisions return as `DECISION_RESPONSE`, draining the sender's pending queue. Non-compliant adopters get a `decision response required` metadata flag in the fallback message header (transport-tier).

## A.3 Tensions and their resolutions

Seven structural tensions between axes — places where two legitimate principles collide. Each is resolved by a structural mechanism, not by picking a winner.

| # | Tension | Axes in conflict | Resolution |
|---|---|---|---|
| 1 | **Recommendation clarity vs. user autonomy** — Management requires "a brief without a recommendation is not a decision tool"; Humanities + Psychology warn "a single recommendation is anchoring + hermeneutic violence". | management × humanities × psychology × philosophy | Express the recommendation as a function: `§8 = f(§7 node IDs + weights)`. Five-block structure (recommendation + 3 defeaters + pre-mortem + reversible fallback + confidence + brittleness). Forbid single assertion; present competing options + trade-offs while letting the AI track which weight assumption supports which branch. The user can slider-adjust weights to recompute in their own context. |
| 2 | **8-section enforcement vs. cognitive-load ceiling** — Management + Development require "deep brief for Type 1 decisions"; Psychology warns "without progressive disclosure users read only §1 + §6 + §8". | management × development × psychology × ai_harness | Door-type classifier reconciles: Type 1 (irreversible) — all 8 sections default expanded. Type 2 (reversible) — §0 + §1 + §6 + §8 minimal default + others progressive disclosure. §7 (the action-forcing point) is always expanded. §4 and §8 must be expanded ≥ 1 time before decision confirmation (soft gate). "Depth proportional to decision grade", not uniform enforcement or indiscriminate abbreviation. |
| 3 | **Numeric probability enforcement vs. calibration collapse risk** — Philosophy + AI Harness require numeric probabilities, but AI Harness's own warning: the model may safety-spam everything as `assumed`. | philosophy × ai_harness | Pair numeric probability with brittleness statement mandatorily. "Point estimate 0.7 / 90 % CI [0.5, 0.85] / one-line scenario in which this estimate misses". A bare single number is an anchoring risk, so the brittleness statement carries the load. Cumulative Brier-score tracking + epistemic-tag distribution monitoring self-detect calibration collapse (validator warns when all statements tag as `[assumed]`). Few-shot examples teach the normal range of verified / inferred / assumed / unknown distribution. |
| 4 | **Hidden Assumptions enforcement vs. LLM motivated reasoning** — Philosophy requires explicit assumptions, but AI Harness warns committing to a conclusion first lets evidence be selected toward it. | philosophy × ai_harness | Resolved by staged generation pipeline + IR dependencies: (a) §0 escalation score → (b) §1 · §6 frame + decision prompt → (c) §2 · §3 · §4 (why + hidden assumptions + rejected alternatives) → (d) §5 (2×2 framing matrix + pre-mortem + reversibility panel) → (e) §7 decision tree → (f) §8 = f(§7 node IDs + weights) → (g) self-critique (identify 3 omissions) → (h) finalize IR → (i) render. Forcing hidden assumptions to surface in §4 means §8 hasn't been written yet — motivated-selection circuit blocked. |
| 5 | **Default-option presentation vs. default-effect over-delegation** — Psychology + Management need satisficing protection (default options), but Psychology's own warning: default effect causes over-delegation. | psychology × management × humanities | The default option is wrapped in "AI estimate (1 option) + what you lose by adopting it + deliberately excluded options + reject/defer/reframe meta-options". To adopt, the user types one sentence — "I agree with this recommendation because of X" — instead of an "accept AI recommendation" button (active-choice gate). IKEA effect inverted as a de-biasing device. When recommendation adoption rate exceeds 70 %, a self-warning card fires. |
| 6 | **MD ADR-compatibility vs. HTML interactive richness** — Development wants archival ADR-compatible MD; Psychology + AI Harness want interactive visualization. | development × psychology × ai_harness | Single IR, two deterministic renderers branching. MD: ADR-compatible static format (Title / Status / Context / Decision / Consequences) + mermaid blocks only, GitHub-flavored standard. HTML: self-contained interactive (chart.js radar/gauge/doughnut + mermaid + weight sliders + collapsible + decision-receipt form). Information drift between the two is impossible for the same decision; MD settles as archived ADR while HTML serves as live decision interface. Constellation cards pair HTML expand fallback + MD permalink. |
| 7 | **Urgency acceptance vs. urgency as coercion** — Management requires deadline specification; Humanities + Psychology warn "urgency itself is a coercion mechanism". | management × humanities × psychology | Deadline field stated in §0, but when AI uses "urgent / critical / must decide now", auto-surface "ground for this urgency: [external deadline fact / AI estimate / system constraint]" with epistemic tag. Brief-quality gates (epistemic tag + falsifier + reversibility classification) cannot be omitted under time pressure. When time is insufficient, the fallback is not brief abbreviation but "recommend deferral + request investigation approval". |

## A.4 Refined 8-section spec

The original "1 brief overview / 2 what / 3 how / 4 why / 5 consequences / 6 three-line / 7 decision tree / 8 recommendation" is restructured. Below are 8 sections + a new §0 header and §9 capture stub. Each section gets: name (with rationale for the rename) / purpose / content rules / anti-patterns / visual recommendations.

### §0 Decision Header (new)

*Rationale.* Five axes (Management · Philosophy · Development · AI Harness · Psychology) converge that "decision-grade metadata must be identifiable in 30 seconds before the body". The original lacked this escalation-justification + classifier meta block, which is the starting point of trigger gating and responsibility attribution.

*Purpose.* Before reading the body, the user immediately grasps "this decision's grade · reversibility · urgency · responsibility structure" and routes (read / postpone / escalate / refuse). A self-verification gate for why the AI did not decide autonomously.

*Content rules.*
- **MUST**: 4-indicator escalation scores (irreversibility 0–3, blast radius 0–3, time horizon 0–3, reversal cost 0–3) + sum. Sum < 4 blocks brief generation and routes to "AI autonomous decision + post-notify".
- **MUST**: reversibility class `{two_way / one_way / one_way_with_migration_path}` + badge color (green / yellow / red).
- **MUST**: RAPID roles — Recommender (agent_id) / Decider (user) / Performer / Input-contributors / Agree (veto-holders).
- **MUST**: Cynefin domain judgment (Clear / Complicated / Complex / Chaotic / Confused) — §7 tree format branches on this.
- **MUST**: `decision_lineage` {parent_decision_ids[], assumed_invariants[]} — parent discard auto-enqueues review.
- **MUST**: deadline (ISO8601 or "no rush") + recommended reading time + stake (estimated financial / reputational / tech-debt impact).
- **SHOULD**: "one line on why the AI did not decide autonomously" — justifying the delegation itself.

*Anti-patterns.*
- Skipping the 4 scores and writing the body — origin of false escalation or false autonomy.
- Reversibility as boolean only — "hard but possible to reverse" misclassified as reversible.
- Missing RAPID — post-hoc "the AI recommended" vs. "the user decided" ping-pong closes the learning loop.

*Visual recommendations.* MD: header table (4 scores + reversibility text color code + RAPID row). HTML: large reversibility badge (green / yellow / red circle, top-left) + chart.js radar for 4-indicator scores + Cynefin domain color label + mini mermaid graph for decision_lineage (parent → current node).

### §1 Context Horizon (renamed from "brief overview")

*Rationale.* Humanities (Gadamer pre-understanding / horizon) and Psychology (context pre-activation + Endsley situation awareness) converge that "context-less fact summary induces guessing, not understanding". A single one-line summary is insufficient; the historical continuity in which the decision stands must be made explicit.

*Purpose.* Give the user the hermeneutic horizon (preconditions · continuity with prior decisions · context) from which to view this decision. Let them reconstruct their position before facing §6's decision prompt.

*Content rules.*
- **MUST**: 3-subsection structure — (a) preconditions, (b) continuity from prior decisions, (c) scope of impact.
- **MUST**: explicit forcing function for "why is the decision needed now?" — external deadline vs. AI estimate.
- **SHOULD**: summary of last N turns of conversation or prior-decision link (`decision_id` format).
- **SHOULD**: estimated time the user should invest in this brief (e.g., "3 min read").
- **MUST**: inline epistemic tag on every fact statement.

*Anti-patterns.*
- Content duplication with §6 (cosine similarity threshold → validator reject).
- Listing facts without context — Gadamerian self-alienation.
- Unfounded urgency vocabulary ("urgent", "critical") — urgency without epistemic tag operates as coercion.

*Visual recommendations.* MD: 3-subsection bullets. HTML: text on the left, mermaid timeline on the right (prior decisions → current) visualizing decision lineage + mini doughnut chart for epistemic-tag distribution.

### §2 What — Blast Radius Surface (original "what" expanded)

*Rationale.* Development (Hyrum + SRE blast radius) and AI Harness (coupling delta) diagnose "without specifying the change surface, the user assents to a global change that looks local". Blast radius enters the §0 header score, but the body needs an explicit surface enumeration.

*Purpose.* Concretely list the surface this decision touches in code · contracts · data · external dependents · operational procedures. Let the user visually identify the impact range.

*Content rules.*
- **MUST**: 5 blast-radius surface fields — `{touched_modules, touched_contracts, touched_data_at_rest, touched_external_consumers, touched_operational_runbooks}`. Empty slots must be `verified empty`; `unknown` is red-flag.
- **MUST**: coupling delta — `{new_dependencies, new_consumers, interface_surface_delta(+N methods/+M fields), depth_to_interface_ratio_change}`.
- **SHOULD**: observability cost — `{new_signals_needed, debuggability_delta}`. New coupling/data flow with zero observability increment → "silent failure risk" warning.
- **SHOULD**: Hyrum exposure check — risk of externally visible behavior change becoming de facto contract.

*Anti-patterns.*
- Expressing blast radius only as line-count — Hyrum-law evasion failure.
- Leaving `unknown` slots — un-investigated misread as verified empty.
- Adding new coupling with zero observability — silent failure zone comes free.

*Visual recommendations.* MD: 5-field table (rows = surface type, columns = touched / empty / unknown). HTML: same table + per-surface chip visualization + mermaid component diagram for new dependencies / new consumer flows. Hyrum-exposure items in red highlight.

### §3 How — Incremental Path Check (original "how" + incremental path verification, repositioned after §4 · §5)

*Rationale.* Development (strangler fig + branch-by-abstraction + feature flag) requires "before outputting a big-bang recommendation, force the three incremental path checks". To avoid Psychology's sunk-cost priming, §3 is repositioned after §4 · §5 (reordered from original): reading procedural details first robs essential doubt of weight.

*Purpose.* Procedural implementation of the recommendation. Make explicit big-bang vs. incremental-path review so a one-way decision can be converted into a two-way decision when possible.

*Content rules.*
- **MUST**: if big-bang recommendation, state (a) why strangler fig is impossible (b) why branch-by-abstraction is impossible (c) why feature flag is impossible. Without explicit answers, downgrade to `tentative`.
- **MUST**: milestone list with each milestone's rollback feasibility.
- **SHOULD**: traceable to §2's blast-radius surface (which step affects which surface).
- **MUST**: epistemic tag — distinguishing inferred procedure from verified procedure.

*Anti-patterns.*
- Outputting big-bang while skipping incremental path review.
- Single-phase procedure without milestones — rollback point unclear.
- Reading §3 procedural details before §5 outcome → sunk-cost priming robs §5 doubt of weight (core reason for the reorder).

*Visual recommendations.* MD: stepwise checklist + rollback feasibility icon per step. HTML: mermaid sequenceDiagram or Gantt chart for milestones, with rollback-cost hover tooltip per milestone.

### §4 Why + Boundary Conditions + Hidden Assumptions + Rejected Alternatives (original "why" 4-split expansion)

*Rationale.* Management (Drucker boundary conditions), Philosophy (transcendental hidden assumptions), Development (ADR rejected alternatives), AI Harness (staged generation to block motivated reasoning) all derive the need to split the single "why".

*Purpose.* Surface the decision's necessity · satisfaction spec · implicit premises · rejected alternatives all together to block post-decision negotiation eroding must-haves or the same decision being re-litigated.

*Content rules.*
- **MUST**: 4a Decision Driver — forcing function (why now?).
- **MUST**: 4b Boundary Conditions — must-have (decision void if violated) / should-have (negotiable but costly) / nice-to-have, three tiers. < 2 must-haves stops brief generation and returns a specification question to the user.
- **MUST**: 4c Hidden Assumptions — ≥ 3 premises adopted to decompose the options. "none" fails lint (assumption-less decomposition is impossible).
- **MUST**: 4d Rejected Alternatives — ≥ 2 alternatives + each rejection reason. ≤ 1 requires "why the forcing function closes the alternative space".
- **MUST**: every statement bears epistemic tag + provenance tag.

*Anti-patterns.*
- Filling Hidden Assumptions with "none" → self-deception.
- ≤ 1 Rejected Alternatives → false dichotomy enforcement.
- Missing boundary conditions → must-haves quietly bartered post-decision (Drucker's most frequent failure mode).
- AI-estimated forcing function stated as external deadline → blocked by epistemic tag.

*Visual recommendations.* MD: 4-split header + boundary-conditions 3-tier table (must / should / nice). HTML: 4-split card layout, boundary conditions in priority color codes, hidden assumptions each with "if this assumption fails → option space invalid" toggle, rejected alternatives as mermaid branch diagram (rejected branches grayed).

### §5 Consequences — Framing Matrix + Reversibility Panel + Pre-mortem + Most-Affected Stakeholder + MCDA Table (original "consequences" multi-layered)

*Rationale.* Psychology (2×2 framing matrix), Philosophy (Toulmin qualifier + rebuttal, Rawls reversed veil), Management (MCDA + reversibility panel + Klein pre-mortem), Development (do-nothing cost + time-axis cost) all refuse single narrative and demand multi-layered structure. The heaviest section in Hyperbrief.

*Purpose.* Present the consequences across 5 facets simultaneously — framing balance + reversibility + failure scenarios + externalities + quantitative comparison — blocking framing effect and single-narrative subordination.

*Content rules.*
- **MUST**: 2×2 framing matrix — rows = {accept, reject} × columns = {gain, loss} + "no-action (do nothing)" as 5th quadrant. Single narrative forbidden.
- **MUST**: Reversibility Panel — rollback cost (time / money / relational capital) + reversal window (D-N day countdown) + trigger-to-revisit (what signal forces re-decision).
- **MUST**: MCDA table — rows = alternatives (including do-nothing), columns = evaluation criteria (derived from §4b boundary conditions), cells = quantitative or 5-point scale + one-line rationale. Unknown cells = UNKNOWN + investigation-cost estimate. Empty cells forbidden.
- **MUST**: 2 pre-mortem scenarios — (a) if the recommendation is a clear failure in 6 months, the most likely failure path (b) the path's early warning signal.
- **MUST**: Most-Affected Stakeholder perspective restatement — 1-line outcome from the perspective of the actor bearing the most cost. If unidentifiable, warning signal.
- **MUST**: Null Option Cost — do-nothing's `{30d / 90d / 1y}` cost estimate. Reported as 0 flags Lehman-law violation.
- **MUST**: Toulmin 5 fields per option's outcome prediction — {claim, grounds, warrant, qualifier (probability), rebuttal (refutation condition)}.
- **MUST**: every prediction / probability as numeric interval (point estimate + 90 % CI + most plausible miss-scenario). Natural-language probability ("probably", "likely") forbidden.

*Anti-patterns.*
- Single gain-frame or single loss-frame narrative — framing effect direct hit.
- Do-nothing as zero-cost baseline — Lehman-law violation.
- Empty MCDA cells — "A feels better" rationalization.
- Rebuttal "none" — Toulmin plausibility failure.
- Reversibility as boolean only.
- Reasoning collapse late in narrative leaves pre-mortem and stakeholder restatement hand-waved.

*Visual recommendations.* MD: 2×2 matrix (mermaid quadrantChart or table), MCDA table, reversibility panel as text table. HTML: 2×2 as chart.js scatter quadrant or mermaid quadrantChart; MCDA with user-adjustable weight sliders + radar chart for alternative comparison; reversibility as D-N day countdown widget + color gauge; pre-mortem as 2 expandable cards; stakeholder as mermaid actor diagram; Null Option Cost as time-axis line chart (30d / 90d / 1y); Toulmin with qualifier labels per arrow.

### §6 Decision Prompt (renamed from "three-line summary")

*Rationale.* AI Harness ("§1 and §6 overlap in function → redefine one as decision prompt"), Humanities (Gadamer Wirkungsgeschichte: compression is always interpretation, so single summary is forbidden), Philosophy (self-coherence test: reading three lines alone must reach the same recommendation) require §6's role to separate into "the precise question the user must answer + one-line option summaries".

*Purpose.* Compress exactly what the user must answer, which options are competing, what the core trade-off is. Even without the body, §6 alone enables decision routing (approve / refuse / postpone / reframe).

*Content rules.*
- **MUST**: slot format — (1) one-line essence (2) one-line core trade-off (3) one-line recommendation + confidence.
- **MUST**: self-coherence test — reading §6 alone must reach §8's recommendation. Validator checks §6 ↔ §8 coherence.
- **MUST**: cosine similarity threshold with §1 → reject as redundant if exceeded.
- **SHOULD**: "AI view summary" + "imagined opponent view summary" two-column contrast, or "fact / contested point / what the summary misses" three-block structure.
- **MUST**: the precise question the user must answer stated as an interrogative.

*Anti-patterns.*
- Paraphrase of §1 — lazy-fill pattern.
- Free-form 3 lines (slot violation) — availability heuristic direct hit.
- Single-perspective summary — Wirkungsgeschichte violation.
- Verbatim repetition of §8's recommendation wording in §6 — anchoring reinforcement.

*Visual recommendations.* MD: 3-slot explicit table (essence / trade-off / recommendation+confidence). HTML: left (AI view) vs. right (opponent view) two-column cards; decision prompt as large interrogative header for visual emphasis.

### §7 Decision Criteria Tree (original "decision tree") — Cynefin-Adaptive + Meta-Branch + Ranked + Information-Gain Ordered

*Rationale.* Management (Cynefin domain-adaptive format), Humanities (reject-framing / defer / request-investigation meta-branches), Psychology (rank-and-preview to avoid checkbox IKEA), Philosophy (cheapest discriminator first + Minimal Information Set), Development (root 3 nodes standardized: reversibility / blast radius / time pressure) all reject the simple checkbox tree and require multi-axis restructuring. §8 recommendation is *derived as a function of this section*.

*Purpose.* Identify the minimum information set genuinely sufficient for the decision; let the user surface their own priorities; guarantee the right to refuse framing via meta-branches. Serves as §8's function input.

*Content rules.*
- **MUST**: top-level meta-branch — `accept / reject-framing / defer / request-investigation` 4 branches hardcoded.
- **MUST**: root 3 nodes standardized — (reversibility, blast radius, time pressure). Domain questions from level 4.
- **MUST**: Cynefin domain-adaptive format — Clear/Complicated → mermaid decision tree (checkbox leaves + node IDs); Complex → 3 safe-to-fail probes + observation indicators; Chaotic → "act now + 24h retrospective scheduled" single card.
- **MUST**: every node's decision-relevance test — "does the answer to this question make the user choose a different option?" Fail → removed.
- **MUST**: node IDs assigned — §8 recommendation must cite node IDs.
- **SHOULD**: user-reorderable ranked list (drag) + per-item live preview "if you make this top priority, here is the conclusion".
- **SHOULD**: Pruned options — "deliberately excluded options + reasons". Pruned 0 requires explicit declaration.
- **SHOULD**: tree depth > 3 → cognitive load warning.

*Anti-patterns.*
- Mixing fact and value in checkboxes — user escapes value judgment by fleeing to facts.
- Missing meta-branch — every response inside AI-set framing (Floridi voluntariness violation).
- Forcing deterministic decision tree on Complex domain — false confidence.
- Auto-conclusion after check — IKEA-effect rationalization.
- Missing pruned options — false dichotomy enforcement.

*Visual recommendations.* MD: mermaid flowchart (meta-branch → root 3 nodes → domain questions), with node IDs on leaves. HTML: interactive mermaid + draggable priority list, real-time preview panel, visualization auto-switches by Cynefin domain (Complex → probe diagram, Chaotic → single action card), Pruned options as collapsed "show pruned" toggle.

### §8 Recommendation (original "recommendation" 5-block restructure)

*Rationale.* All six axes converge on splitting the single declarative recommendation into a 5-block conditional structure.

*Purpose.* Present the recommendation as a function of §7 with explicit assumptions, defeaters, pre-mortem, reversible fallback, and confidence — never as a single unconditional assertion.

*Content rules.*
- **MUST**: Recommendation + assumptions (conditional: "X assuming A,B / fallback Y if A fails / switch Z if B tightens").
- **MUST**: Confidence numeric.
- **MUST**: ≥ 1 cited §7 node ID.
- **MUST**: 3 Defeaters (any flips the recommendation).
- **MUST**: Pre-mortem inline.
- **MUST**: Reversible Fallback pair (fallback path + rollback cost + trigger conditions).
- **MUST**: Falsification trigger (observation target + time + threshold).
- **MUST**: irreversible recommendation forces "I accept irreversibility" checkbox.
- **MUST**: confidence < 0.6 → "recommendation" downgraded to "proposal candidate".

*Anti-patterns.*
- Single declarative recommendation.
- Missing reversible fallback — structurally produces "non-reversible recommendation".
- Citing no §7 node ID — recommendation disconnected from tree.
- "Falsifier: none" — vacuous, weight 0.

*Visual recommendations.* MD: 5-block structure + 3-defeaters list + fallback table + checkbox if irreversible. HTML: chart.js gauge for confidence; collapsed by default (expands after §7 traversal); active-choice gate (pre-mortem textarea + irreversibility checkbox if applicable) immediately above the confirm button.

### §9 Decision Capture (new — learning-loop closure)

*Rationale.* Synthesis fail-mode "Fire-and-forget brief" makes the same agent repeat the same traps 6 months later — the costliest leak. revisit-date card emission reuses Constellation's existing cron / Stop hook infrastructure, making Phase 1 implementation feasible.

*Purpose.* Auto-register revisit date; record outcome vs. decision-quality delta; accumulate Brier-score calibration; supersede / affirm `decision_id` chain.

*Content rules.*
- **MUST**: revisit_date (ISO8601) + ledger_pointer (`.agent/_decisions/<id>.json` or Constellation ledger SSE id).
- **MUST**: outcome_actual (filled post-revisit).
- **MUST**: outcome_vs_decision_quality_delta (filled post-revisit).

*Visual recommendations.* HTML: footer section with revisit countdown + Constellation `/api/decision-response` POST form (chosen meta-branch + user pre-mortem + accepted irreversibility flag).

## A.5 Trigger criteria (machine-readable summary)

- **MUST trigger** (any one fires FULL_HYPERBRIEF): irreversibility score ≥ 2; blast radius crosses module boundary; external notification required; resource threshold exceeded; supersedes prior decision_id.
- **MUST trigger** (sum-based): escalation 4-indicator sum ≥ 4.
- **SHOULD trigger**: inferred + assumed + unknown > 40 %; explicit value-judgment > fact-judgment; do-nothing cost > threshold at 30d/90d/1y.
- **NOT trigger** (autonomous decide + post-notify): sum < 4 AND no MUST condition fires; Type 2 reversible; Clear domain with verified all-must-haves-met single option.
- **Anti-trigger** (alert-fatigue self-throttle): recommendation auto-adoption > 70 % over last 20 cycles → raise trigger threshold by one step + send self-warning card.

## A.6 Failure modes prevented (16)

Schema-cosplay · sycophantic over-delegation · anchoring slide to recommendation · framing capture · false dichotomy / pruned-options hiding · calibration collapse / hallucinated certainty · reversibility blindness · Lehman-law violation (null option cost = 0) · decision orphaning · fire-and-forget brief (no learning loop) · boundary-condition slippage · alert fatigue / auto-approval pattern · MD ↔ HTML information drift · Constellation A2A type fallback · motivated reasoning by recommender · time-pressure quality drift. Each failure mode is blocked by a specific structural mechanism documented in the refined 8-section spec above and the design's machine-readable trigger rules below.

## A.7 Normative rules summary

Consolidated rule list. Each rule is enforceable at validator / renderer / prompting level. The complete enforcement chain forms the `Hyperbrief.md` SSoT in Part B.

- **MUST** — all decision-request output passes through Hyperbrief JSON IR; LLM emits only IR; MD/HTML rendered by deterministic code.
- **MUST** — emit §0 with escalation 4-indicator sum < 4 routing to autonomous decide + post-notify; sum ≥ 4 OR any of 5 MUST-trigger conditions fires Hyperbrief.
- **MUST** — §0 includes reversibility class + RAPID + Cynefin + decision_lineage + deadline + stake.
- **MUST** — every fact statement carries inline epistemic tag + provenance; > 40 % inferred + unknown → low-confidence banner.
- **MUST** — §4 has 4 blocks (Decision Driver / Boundary Conditions ≥ 2 must-haves / Hidden Assumptions ≥ 3 / Rejected Alternatives ≥ 2).
- **MUST** — §5 has 6 blocks (2×2 framing + Reversibility Panel + MCDA + 2 pre-mortems + Most-Affected Stakeholder + Toulmin 5 fields). Null Option Cost zero flags Lehman violation.
- **MUST** — natural-language probability forbidden; numeric interval mandatory.
- **MUST** — §7 has meta-branch + root 3 nodes + Cynefin-adaptive + node IDs assigned.
- **MUST** — §8 is 5-block (Recommendation + Confidence + Defeaters 3 + Pre-mortem + Reversible Fallback); ≥ 1 §7 node ID cited; irreversible forces "I accept" checkbox.
- **MUST** — big-bang recommendation states 3 incremental-path impossibility reasons or downgrades to tentative.
- **MUST** — Falsification trigger (3 components: target, time, threshold) mandatory.
- **MUST** — pre-decision user pre-mortem free-input (active-choice gate).
- **MUST** — §9 Decision Capture auto-registers; revisit-date triggers retrospective card.
- **MUST** — Constellation card emits as `DECISION_REQUEST` with ack tier `decided`; non-compliant adopter falls back with `decision response required` metadata flag.
- **SHOULD** — staged generation pipeline (9 stages).
- **SHOULD** — accept-rate / decision-time / pre-mortem-missing-rate / epistemic-distribution cumulative statistics + self-warning on threshold cross.
- **SHOULD** — HTML default view §0 + §1 + §5 + §7 + §6; §4 / §8 require expansion before confirmation; Type 1 default expanded.
- **SHOULD** — header notice on user's right to refuse.

---

# Part B — Module Design

## B.1 Module location decision

The root SSoT is `C:\Dev\EstreGenesis\Hyperbrief.md`, sitting at the same level as `Constellation.md` and `Superscalar.md`, with the same header comment convention: `<!-- module: Hyperbrief; layer: decision-gating; part-of: EstreGenesis 2.5.x; ... -->`. The plugin is at `C:\Dev\EstreGenesis\plugins\hyperbrief\`.

**Six decision axes for the design:**

(1) **Root SSoT + plugin directory bifurcation.** EG's existing two modules (Constellation / Superscalar) both adopt this pattern. Hyperbrief applies the same pattern without adding new semantics — learning cost is zero. The SSoT markdown is the *spec source*; the plugin is the *Claude Code runtime adapter*. The two co-evolve under the same version; SSoT is the citation surface (license / spec); the plugin is the model-discovery (invoke) surface.

(2) **Deterministic IR-rendering enforced from Phase 1.** Synthesis's most load-bearing fail-mode ("information drift between MD and HTML") occurs when the LLM produces both formats directly. Therefore LLM output is JSON IR only, and MD/HTML renderers are code (Node scripts). Even in Phase 1, `renderer-md.cjs` / `renderer-html.cjs` ship — shipping only a skill in Phase 1 and adding renderers in Phase 2 would let IR drift sit for 6 months.

(3) **Constellation integration via CUSTOM/HyperbriefCard first-class type + DECISION_REQUEST/RESPONSE A2A split.** Add `DECISION_REQUEST` / `DECISION_RESPONSE` / `DECISION_DEFER` / `DECISION_REJECT_FRAMING` (4 names) to Constellation §13.16.9 A2A-intent allowlist. Non-compliant adopters use §13.16.12 Pattern 7 (TEXT_MESSAGE fallback) with a header meta prefix `[Hyperbrief decision required — see linked card]`.

(4) **Trigger rubric as bidirectional gate** — §0 escalation sum < 4 blocks Hyperbrief firing AND sum ≥ 4 blocks decision-request without Hyperbrief. This single mechanism operationalizes Synthesis's "Hyperbrief firing is itself the first decision".

(5) **Orthogonal to Superscalar but serially evaluated at the same event.** Even after Superscalar's cost-benefit gate passes a fan-out, lanes touching external notification / irreversibility / cross-system blast radius escalate to Hyperbrief. Superscalar's gate asks "is this fan-out worth doing?"; Hyperbrief asks "does the user need to authorize this fan-out itself?" Complementary — Synthesis's "external notification required" trigger condition is the natural hook from Superscalar's lane manifest to Hyperbrief.

(6) **§9 Decision Capture + revisit-date ship in v1.** Synthesis's "Fire-and-forget brief" fail-mode is the costliest leak. revisit-date card emission reuses Constellation's existing cron / Stop hook infrastructure, making Phase 1 implementation feasible.

The Hyperbrief.md declares `depends-on: none (optional synergy: Constellation §13 A2A, Superscalar §3 cost-benefit gate)` in its metadata.

## B.2 File layout

| Path | Purpose | Sketch |
|---|---|---|
| `Hyperbrief.md` | Root SSoT — single source of truth for the Hyperbrief specification (external citation surface). | Meta header comment + 11 sections: §1 Concept (Hyperbrief as decision-delegation ritual; bidirectional block of schema-cosplay and sycophantic over-delegation), §2 Trigger Rubric (4-indicator escalation score + 5 MUST conditions + Anti-trigger), §3 §0 Decision Header spec, §4 8-section body spec + §9 Decision Capture, §5 Epistemic Discipline, §6 Anti-patterns + 16 fail-mode mapping, §7 IR-driven Rendering Pipeline, §8 Constellation Integration, §9 Superscalar collaboration, §10 Adoption thresholds, §11 Reference dogfood ledger placeholder. Echoes Constellation.md / Superscalar.md tone and structure. |
| `plugins/hyperbrief/.claude-plugin/plugin.json` | Claude Code plugin manifest. | Conforms to Constellation/Superscalar plugin.json schema. `name=hyperbrief`, `version=0.1.0`, description names Phase 1 (skill + renderer scripts) and Phase 2 roadmap (PreToolUse hook + MCP server). `homepage` = Hyperbrief.md raw URL. `mcp` block omitted in Phase 1. |
| `plugins/hyperbrief/README.md` | Installer-facing README. | Mirrors Superscalar README structure — section 1 (what you get), 2 (install options A: claude-community marketplace / B: self-hosted EstreGenesis marketplace), 3 (v0.1.0 contents / Phase 2 roadmap), 4 (quick usage), 5 (relationship with Constellation/Superscalar), 6 (spec source link to Hyperbrief.md raw URL). |
| `plugins/hyperbrief/skills/hyperbrief/SKILL.md` | Model-invoked main skill — auto-discovered before any decision request. | Frontmatter: `name: hyperbrief / description: Use BEFORE asking the user to approve, choose between options, or commit to any action whose reversal cost is non-trivial. MUST invoke when (a) next message would contain '괜찮을까요/할까요/which/should we' patterns AND any of {irreversibility≥2, cross-module blast radius, external-party notification, resource threshold, prior-decision supersede}, (b) Superscalar fan-out gate just opened a write/deploy/send lane, (c) Constellation A2A DECISION_REQUEST is inbound. SKIP when escalation 4-score sum < 4 (autonomous decide + post-notify instead).` Body: trigger-rubric pseudocode + §0 6-field guide + §1–§9 IR JSON filling guide + renderer invocation + Constellation co-emit + revisit-date registration + 7 anti-patterns. |
| `plugins/hyperbrief/schema/hyperbrief-ir.schema.json` | Hyperbrief JSON IR's formal schema — shared input contract for validator and renderers. | JSON Schema 2020-12. Root `HyperbriefIR` with 10 top-level fields (§0 ~ §9). Every fact-statement string field forces `tagged_text` pattern. Escalation sum < 4 → schema branches to `blocked` stub (oneOf: full IR vs blocked stub). |
| `plugins/hyperbrief/renderers/renderer-md.cjs` | IR → ADR-compatible MD deterministic renderer. | Node CJS. stdin JSON → schema validate (ajv) → per-section deterministic string assembly → stdout MD. Mermaid block auto-selects by `cynefin_domain`. Natural-language probability words trigger validation fail. Front-matter is ADR-compatible (`# ADR-{decision_id} — {title} / Status / Date / Reversibility badge / RAPID roles`). |
| `plugins/hyperbrief/renderers/renderer-html.cjs` | IR → interactive self-contained HTML deterministic renderer. | Node CJS. IR → single HTML5 file (chart.js + mermaid CDN-embedded or inline). §0 reversibility badge color gauge, §0 4-indicator radar, §5 MCDA radar with weight sliders, epistemic-tag doughnut, Reversibility Panel D-N countdown widget, §7 interactive mermaid tree + draggable priority list, §8 progressive disclosure, active-choice-gate (pre-mortem textarea + 'I accept irreversibility' checkbox), Decision Receipt POST form. All data injected directly from IR JSON — LLM never touches HTML body. |
| `plugins/hyperbrief/templates/md-template.hbs` | MD renderer's Handlebars (or mustache) template — section skeleton. | `{{#hyperbrief}}` blocks with §0–§9 headings + IR variable slots. Conditional blocks (`{{#if blocked}}` → blocked stub, `{{else}}` → full brief), mermaid diagram placeholders, irreversibility checkbox line. Template itself is deterministic — all values injected from IR. |
| `plugins/hyperbrief/templates/html-template.hbs` | HTML renderer template — chart.js/mermaid embed positions + component slots. | `<head>` with CDN/inline chart.js + mermaid + minimal CSS. `<body>` is grid layout 10 regions (§0 header / §1 context / §2 table / §3 steps / §4 4-split / §5 MCDA+radar+pre-mortem / §6 decision prompt / §7 interactive tree / §8 collapsed-by-default recommendation + active gate / §9 receipt form). Dynamic data via `data-ir-path='...'` attributes referenced from a single `<script id='hyperbrief-ir' type='application/json'>` block — bulk hydration at the page bottom. |
| `plugins/hyperbrief/skills/hyperbrief-trigger-check/SKILL.md` | Lightweight gate skill invoked at every user-request-decision point by the model. | Frontmatter: `name: hyperbrief-trigger-check / description: ALWAYS run before composing any message that asks the user for a decision, approval, or choice. Computes escalation 4-score + 5-condition rubric, returns one of {AUTONOMOUS_DECIDE, FULL_HYPERBRIEF, MINIMAL_BRIEF, BLOCK_FRAMING}. Cheaper than full hyperbrief skill — invokes hyperbrief skill only if outcome ≠ AUTONOMOUS_DECIDE.` Body: 30-second pseudocode (per-indicator 0–3 scoring matrix + Cynefin 4-question judgment + RAPID Decider identification). Outcome branching guide. |
| `plugins/hyperbrief/skills/hyperbrief-revisit/SKILL.md` | Post-decision learning loop closure skill — fired when revisit-date arrives. | Frontmatter: `name: hyperbrief-revisit / description: Invoke when a stored decision's revisit_date is reached, or when an assumed_invariant in decision_lineage is violated. Loads the original IR from decision ledger, prompts user for actual outcome, computes outcome-quality vs decision-quality delta (Brier score increment), appends retrospective to ledger, supersedes/affirms decision_id chain.` Body: ledger location, retrospective 8 questions, supersede rule. |
| `plugins/hyperbrief/hooks/hooks.json` | (Phase 2 reserved) PreToolUse / Stop hook registration. | Phase 1 commits placeholder file with `{}` empty object + comment. Phase 2 registers PreToolUse matcher for `AskUserQuestion` / `Bash(git push|gh ...)` / outbound A2A emit, auto-invoking hyperbrief-trigger-check. Stop hook scans for revisit-date arrival → triggers hyperbrief-revisit. |

## B.3 Output schema (HyperbriefIR JSON Schema 2020-12 — excerpt)

The full schema lives at `plugins/hyperbrief/schema/hyperbrief-ir.schema.json` (Phase 1 shipping artifact). The core constructs:

- `$id` and `oneOf: [FullBrief, BlockedStub]` — schema branches based on escalation sum.
- `tagged_text` pattern: `^\[(verified|inferred|assumed|unknown)\](\[(관찰|추론|외부:[^\]]+|가정)\])?\s+\S.+$` — enforces inline epistemic + optional provenance tag on every fact-statement string.
- `score_0_3` integer constraint applied to all escalation indicators.
- `BlockedStub` requires `status: "blocked_low_escalation"`, decision_id, escalation_header, and the autonomous action taken.
- `FullBrief` is a 10-field object: `decision_id` (pattern `^hb-[0-9]{8}-[a-z0-9]{6}$`), `section_0_decision_header` through `section_9_decision_capture_stub`, plus a computed `epistemic_distribution` block for the HTML doughnut chart.

Each section enforces its content rules via `required` arrays and `minItems` constraints:

- `section_0_decision_header` requires `escalation`, `reversibility_class`, `rapid`, `cynefin_domain`, `decision_lineage`, `deadline`, `recommended_reading_minutes`, `stake`.
- `section_4_why_block.boundary_conditions.must_have` has `minItems: 2`.
- `section_4_why_block.hidden_assumptions` has `minItems: 3`, each item being `{assumption: tagged_text, if_violated: tagged_text}`.
- `section_4_why_block.rejected_alternatives` has `minItems: 2`.
- `section_5_consequences_block.pre_mortem_scenarios` has `minItems: 2`.
- `section_5_consequences_block.mcda_table.alternatives` has `minItems: 2` with description noting `"MUST include 'do_nothing'"`.
- `section_5_consequences_block.toulmin_predictions[].rebuttal` is required (no missing or "none").
- `section_5_consequences_block.framing_matrix_2x2_plus_no_action` requires all 5 quadrants `{accept_gain, accept_loss, reject_gain, reject_loss, no_action}`.
- `section_5_consequences_block.toulmin_predictions[].qualifier` is an object with `point_estimate` (0–1), `ci_90_low`, `ci_90_high`, `most_likely_to_miss_scenario`.
- `section_6_decision_prompt.question_to_user` requires the description `"MUST end with '?'"` (enforced by the renderer's post-validate check).
- `section_7_decision_tree.meta_branch` requires all 4 meta-branches `{accept, reject_framing, defer, request_investigation}`.
- `section_7_decision_tree.root_nodes` requires `{reversibility, blast_radius, time_pressure}`.
- `section_7_decision_tree.domain_format` enum is `{tree_mermaid, probe_safe_to_fail, single_action_card}`.
- `section_7_decision_tree.nodes[].node_id` pattern: `^N[0-9]+$`.
- `section_8_recommendation.cited_tree_node_ids` has `minItems: 1` with pattern matching node IDs.
- `section_8_recommendation.defeaters` has `minItems: 3`.
- `section_8_recommendation.falsification_trigger` requires `{what_to_observe, when, threshold}`.
- `section_8_recommendation.reversible_fallback` is required (when path is `"none"`, the badge auto-promotes reversibility to red).

## B.4 MD template outline (excerpt)

The MD renderer assembles a deterministic structure aligned to ADR Nygard format:

```markdown
# ADR-{decision_id} — {essence_one_line}

<!-- Hyperbrief v0.1 — rendered from IR. Do not hand-edit; edit ir.json and re-render. -->

| Field | Value |
|---|---|
| Status | {status} |
| Reversibility | {reversibility_class} ({badge_color_emoji}) |
| Decider | {rapid.decider} |
| Cynefin Domain | {cynefin_domain} |
| Deadline | {deadline} |
| Reading time | {recommended_reading_minutes} min |

## §0 Decision Header — Escalation Justification
[4-indicator score table + autonomy refusal reason + decision lineage mermaid]

## §1 Context Horizon
[preconditions + continuity + scope + forcing function]

## §2 What — Blast Radius Surface
[5-field surface table + coupling delta + Hyrum exposure flag]

## §4 Why
### 4a · Decision Driver
### 4b · Boundary Conditions (must / should / nice)
### 4c · Hidden Assumptions (≥ 3, with if-violated)
### 4d · Rejected Alternatives (≥ 2 with reasons)

## §5 Consequences
### 5a · Framing Matrix (2×2 + no-action) — mermaid quadrantChart
### 5b · Reversibility Panel (rollback cost / reversal window / trigger-to-revisit)
### 5c · MCDA Table (alternatives × criteria, rows include do-nothing)
### 5d · Pre-mortem (2 scenarios + early warnings)
### 5e · Most-Affected Stakeholder — first-person blockquote
### 5f · Null Option Cost (30d / 90d / 1y; Lehman violation flag if 0)
### 5g · Toulmin Predictions (claim / grounds / qualifier / rebuttal)

## §3 How — Incremental Path Check
[Strangler/BBA/Feature-flag table + tentative flag + milestone table]

## §6 Decision Prompt
[question_to_user as quote + 3-slot table + AI view vs devil's advocate]

## §7 Decision Criteria Tree
[meta-branch list + Cynefin-adaptive mermaid + pruned options]

## §8 Recommendation
[conditional recommendation + confidence + brittleness + cited node IDs +
 defeaters list + pre-mortem inline + reversible fallback + falsification trigger +
 "I accept irreversibility" checkbox if applicable]

## §9 Decision Capture
[revisit date + ledger pointer + outcome placeholder]

---
*Pre-mortem input required before confirming this decision (active-choice gate).*
*Rendered from `ir.json` by `renderer-md.cjs`. Do not hand-edit.*
```

## B.5 HTML template outline (excerpt)

The HTML renderer produces a single self-contained HTML5 file. Key design:

- **IR injected once** as `<script id="hyperbrief-ir" type="application/json">{IR_JSON}</script>`; all components hydrate from this on `DOMContentLoaded`.
- **Reversibility badge** as a 60 px circle (green / yellow / red) top-left of §0.
- **chart.js renders**: escalation radar (4 indicators), MCDA radar (alternatives × criteria, with weight sliders), 2×2 framing scatter quadrant, null-option line chart (30d / 90d / 1y), confidence gauge, epistemic-tag doughnut.
- **mermaid renders**: decision lineage graph, blast-radius coupling diagram, milestone Gantt, §7 Cynefin-adaptive tree (or probe diagram or single action card).
- **Progressive disclosure**: §0 + §1 + §5 + §6 + §7 default-visible; §2 / §3 / §4 / §8 in `<details>` collapsed; §8 expands only after §7 is interacted with.
- **Meta-branch buttons** above the §7 tree: `accept` (green) / `reject-framing` (red) / `defer` (yellow) / `request-investigation` (blue).
- **Active-choice gate**: a pre-mortem `<textarea>` is required; `confirm-decision-btn` is `disabled` until input length > 10 chars AND (if irreversible recommendation) "I accept irreversibility" checkbox is checked.
- **Decision Receipt form** at the bottom POSTs to Constellation `/api/decision-response` with `decision_id`, `chosen_meta_branch`, `user_premortem`, `accepted_irreversibility` fields.
- **Header notice** prepended to the body: "You don't have to answer this question — refuse / defer / reframe options are in §7's meta-branches".
- **Low-confidence banner** auto-displays when `inferred + unknown > 40 %`.

## B.6 Constellation integration

### Envelope set

Constellation's §13.16.9 A2A-intent allowlist gets four new names plus `HyperbriefCard`. The sender emits two envelopes as a set:

1. **`DECISION_REQUEST`** — lightweight envelope for routing / dedup / ack tracking.

```jsonc
{ "type": "CUSTOM",
  "name": "DECISION_REQUEST",
  "targetAgentId": "<user-board-agent>",
  "value": {
    "decision_id": "hb-20260603-a1b2c3",
    "card_msg_id": "<msgId of paired HyperbriefCard>",
    "reversibility_class": "one_way",
    "reversibility_badge_color": "red",
    "escalation_sum": 9,
    "deadline": "2026-06-10T18:00Z",
    "rapid_decider": "user",
    "cynefin_domain": "complicated",
    "ack_tier_required": "decided"
  }
}
```

2. **`HyperbriefCard`** — card body (IR + rendered HTML inline).

```jsonc
{ "type": "CUSTOM",
  "name": "HyperbriefCard",
  "targetAgentId": "<user-board-agent>",
  "parentId": "<DECISION_REQUEST msgId>",
  "value": {
    "decision_id": "hb-20260603-a1b2c3",
    "ir": { /* Full HyperbriefIR JSON */ },
    "render_artifacts": {
      "md_permalink": "file:///.../briefs/hb-20260603-a1b2c3.md",
      "html_inline_b64": "<base64 of self-contained HTML>"
    },
    "expand_hint": "open inline HTML in board card; MD permalink for archive"
  }
}
```

### Ack 3-tier extension (Hyperbrief-specific)

Constellation's existing 3-tier is `received` (transport) / `acknowledged` (commitment) / `processed` (application). Hyperbrief subdivides application-tier:

- `received` — server hop reached (immediate transport ack).
- `acknowledged` — user board renders the card (Stop hook or client beacon).
- `decided` — user passes active-choice-gate + decision-receipt POST completes (Hyperbrief-specific application tier).

`a2a_wait_ack(msgId, tier='decided', timeoutMs)` MCP tool (Phase 2 extension to plugins/constellation/mcp/server.cjs) recognizes this tier. Timeout triggers Constellation §13.13 escalation ladder (nudge or fallback — e.g., downgrade to autonomous-decide-with-post-notify).

### Non-compliant adopter (§13.16.12 Pattern 7) — TEXT_MESSAGE fallback

When the Constellation board doesn't recognize `HyperbriefCard`, §13.16.12 Pattern 7 fallback renders as `TEXT_MESSAGE`. Hyperbrief minimizes information loss by forcing a standard prefix on the first line of the card body:

```
[Hyperbrief decision required | id=hb-20260603-a1b2c3 | reversibility=one_way(red) | deadline=2026-06-10T18:00Z | link=<md_permalink>]
... §6 question_to_user ...
... §6 essence + tradeoff + recommendation ...
```

This lets non-compliant adopters: (a) track by `decision_id` for humans, (b) recognize urgency via reversibility-color in text, (c) reach the full brief via the MD permalink.

### Decision ledger — `state.json` extension + SSE endpoint

Add new top-level field `decisions[]` to Constellation board's `state.json`:

```jsonc
"decisions": [
  { "decision_id": "hb-20260603-a1b2c3",
    "status": "pending" | "decided" | "deferred" | "framing_rejected",
    "card_msg_id": "...",
    "reversibility_class": "one_way",
    "deadline": "...",
    "decider": "user",
    "outcome_chosen": null,
    "user_premortem": null,
    "revisit_date": "2026-09-03",
    "parent_decision_ids": ["hb-..."],
    "ledger_pointer": ".agent/_decisions/hb-20260603-a1b2c3.json"
  }
]
```

New SSE endpoint `/api/decisions/stream` broadcasts revisit-date arrivals and parent-discard events. `hyperbrief-revisit` skill subscribes to this stream.

### Board UI rendering component

Adjacent to the existing chip area in Constellation board, add a `Decision Card` zone:

- **Card top**: reversibility badge (large green/yellow/red circle, top-left), escalation-score chip (top-right), Cynefin domain label, deadline countdown.
- **Body**: `HyperbriefCard.value.render_artifacts.html_inline_b64` embedded as `<iframe sandbox srcdoc=...>` (XSS isolation + chart.js works).
- **Bottom**: 4 meta-branch buttons (accept / reject-framing / defer / request-investigation). Click auto-emits the appropriate `DECISION_RESPONSE` / `DECISION_DEFER` / `DECISION_REJECT_FRAMING` envelope.

### AckProcessed → AckDecided mapping

For non-compliant adopters, when a generic `AckProcessed` arrives, Hyperbrief promotes it to `decided` tier but, if `value.decision_outcome` is missing, sets an `unknown_outcome` flag + asks the user as fallback. Compliant adopters return `AckDecided { outcome: 'accepted' | 'rejected_framing' | 'deferred' | 'investigation_requested', user_premortem: '...', accepted_irreversibility: bool }`.

## B.7 Machine-readable trigger rules

Compact rule list. Suitable for `Hyperbrief.md §2` and as the source of `hyperbrief-trigger-check` skill body.

1. If next assistant message contains any of `['괜찮을까요','할까요','should we','which option','approve','confirm','choose between','OK to']`, MUST run `hyperbrief-trigger-check` BEFORE composing the message; bypassing is invalid output (anti-sycophantic-over-delegation gate).

2. Define `escalation_sum = irreversibility(0-3) + blast_radius(0-3) + time_horizon(0-3) + reversal_cost(0-3)`. If sum < 4 AND no MUST-trigger fires, route = `AUTONOMOUS_DECIDE` + post-notify (do NOT emit hyperbrief; emit one-line post-decision summary). If sum ≥ 4 OR any MUST-trigger fires, route = `FULL_HYPERBRIEF` (emit IR + render + `DECISION_REQUEST`).

3. **MUST-trigger conditions** (any one → `FULL_HYPERBRIEF` regardless of escalation_sum): (a) irreversibility_score ≥ 2, (b) blast_radius crosses module boundary (any touched_contracts non-empty OR any touched_external_consumers non-empty), (c) any touched_external_consumers requires out-of-band notification, (d) resource_estimate exceeds threshold (tokens > 200k OR money > $50 OR time > 4h OR new external API/service), (e) supersedes any prior decision_id in `decision_lineage.parent_decision_ids` of an existing decision.

4. **Cynefin auto-routing**: domain == `chaotic` → `MINIMAL_BRIEF` (single-action card, no §3/§5, immediate-action + 24h-retrospective auto-scheduled). domain == `complex` → §7 domain_format = `probe_safe_to_fail`, §5 MCDA weights relaxed. domain == `confused` → block `FULL_HYPERBRIEF` and emit `DECISION_REJECT_FRAMING` with reason="domain unclear; clarify first".

5. **Superscalar interlock**: BEFORE Superscalar opens any write/deploy/send lane (issue_width_write > 0 AND chosen lane contains action in §3 irreversibility barrier "default-forbidden" list — external API, shell side effect, DB write, deploy, deletion, send/broadcast), MUST run `hyperbrief-trigger-check` on that lane's intent. If `FULL_HYPERBRIEF` triggered, PAUSE the Superscalar fan-out, emit `DECISION_REQUEST`, wait for ack_tier='decided' OR timeout-fallback. Read lanes (issue_width_read only) are exempt — no Hyperbrief gate.

6. **Schema validation gates** (validator MUST reject; LLM MUST retry): (1) any fact-assertion-positioned string lacking epistemic tag → reject; (2) §4b must_have.length < 2 → reject + return 'specification incomplete' question; (3) §4c hidden_assumptions.length < 3 → reject; (4) §4d rejected_alternatives.length < 2 AND no forcing_function justification → reject; (5) §5g any rebuttal missing or == 'none' → reject; (6) §5c any cell empty → reject (UNKNOWN+investigation_cost required); (7) §5f any of {d30, d90, y1} == 0 → set lehman_violation_flag=true; (8) §6.question_to_user not ending with '?' → reject; (9) §8 cited_tree_node_ids.length < 1 → reject; (10) §8 falsification_trigger any of {what_to_observe, when, threshold} missing → reject.

7. **Reversibility downgrade**: if reversibility_class == 'one_way' AND §8.reversible_fallback.fallback_path == 'none' AND §8.confidence.point_estimate < 0.75 → auto-downgrade to `proposal_candidate` AND require "I accept irreversibility" checkbox AND surface §5b reversibility_panel in §6 area.

8. **Big-bang interlock**: if §3.chosen_path == 'big_bang' AND any of {strangler_fig_check, branch_by_abstraction_check, feature_flag_check} == 'not_explored' OR tag 'unknown' → set §3.tentative_flag_if_big_bang = true AND §8 status MUST be 'tentative'.

9. **Alert-fatigue self-throttle**: rolling stats over last 20 hyperbriefs — if user_acceptance_rate > 70 % AND user_premortem_input_avg_length < 30 chars → emit self-warning card AND increment escalation_sum threshold from 4 to 5 for next 10 cycles.

10. **Constellation A2A discipline**: BEFORE emitting `DECISION_REQUEST`/`HyperbriefCard`, MUST run constellation-board read-tail (the §13.16.10 pre-send probe). If inbound contains `DECISION_REJECT_FRAMING` or `DEFER` for a parent in this lineage, ABORT this emit and surface the parent decision state first.

11. **Revisit trigger**: at session-start AND every Stop hook AND every 6h cron tick, `hyperbrief-revisit` MUST scan decision-ledger for `(revisit_date <= now AND outcome_actual == null)` OR `(any assumed_invariant violated per recent A2A signals)`. For each match, emit `CUSTOM/HyperbriefRevisit` card and block other low-priority work until acknowledged.

12. **Time-pressure fallback**: IF `deadline - now < 1h` AND `FULL_HYPERBRIEF` triggered AND full IR generation would exceed remaining time, do NOT shortcut sections — emit `DECISION_DEFER` with reason="insufficient time for proper hyperbrief; recommend deadline extension OR autonomous-decision-with-post-notify acceptance".

13. **Frame-rejection routing**: if §7 user clicks reject-framing, main agent MUST log decision_id with status='framing_rejected', append user's reframing_reason to ledger, AND treat the originating task as 'requires reframing' — do NOT silently retry with a slightly-modified frame.

## B.8 Superscalar interlock — orthogonal gates evaluated serially

**Conceptual separation:**

- **Superscalar gate**: "is this fan-out *worth doing*?" — cost / benefit / hazard / worktree isolation computed to determine lane count and lane class.
- **Hyperbrief gate**: "does the user need to *authorize* this fan-out (or single action)?" — irreversibility / blast radius / external notification / resource / prior-decision supersede.

The two are *orthogonal* (different dimensions). But at the same decision event they are *serially evaluated* — even when Superscalar's cost-benefit passes, Hyperbrief can block fan-out pending decision.

**Serial evaluation pseudocode:**

```
on fan_out_request(intent, lanes):
  # Stage 1 — Superscalar cost-benefit gate
  if not superscalar.cost_benefit_gate(intent, lanes):
    return RUN_INLINE   # fan-out not worth doing

  # Stage 2 — Hyperbrief escalation check (after Superscalar gate passed)
  for lane in lanes:
    if lane.class == 'write' and lane.action in IRREVERSIBLE_ALLOWLIST:
      verdict = hyperbrief.trigger_check(lane.intent)
      if verdict == FULL_HYPERBRIEF:
        superscalar.pause_lane(lane)
        emit DECISION_REQUEST + HyperbriefCard for lane
        await ack_tier='decided' or timeout
        if   user_outcome == reject_framing: superscalar.cancel_lane(lane)
        elif user_outcome == defer:          superscalar.queue_lane(lane, defer_until)
        elif user_outcome == accepted:       superscalar.resume_lane(lane)
        elif user_outcome == investigate:    superscalar.spawn_research_lane(lane)
      elif verdict == MINIMAL_BRIEF:
        emit one-line summary, proceed
      elif verdict == AUTONOMOUS_DECIDE:
        proceed without ask

  # Stage 3 — Normal dispatch
  superscalar.dispatch(lanes)
```

**Five reinforcement points:**

1. **Superscalar §3 irreversibility barrier ↔ Hyperbrief MUST-trigger (a)**: Superscalar blocks irreversible actions inside speculation lanes ("default-forbidden"); Hyperbrief forces user visibility for irreversibility-score ≥ 2 — same dimension, different depth.
2. **Superscalar Lane Manifest ↔ Hyperbrief §0 RAPID**: lane_manifest (intent + gate_dependency + planned_commit_subject + sibling_lanes) maps directly onto RAPID roles. When a lane escalates to Hyperbrief, RAPID's decider / performer / recommender are explicit.
3. **Superscalar §6 adoption thresholds ↔ Hyperbrief alert-fatigue self-throttle**: Superscalar lowers issue_width on merge-conflict > 15 %; Hyperbrief raises escalation threshold on user_acceptance > 70 %. Same self-adjustment pattern (operational signal → policy adjustment). Phase 2 recommendation: share telemetry channel (Constellation board stats SSE).
4. **Superscalar Entry 06 retire stage ↔ Hyperbrief §9 Decision Capture**: Superscalar's retire stage (dedup + consistency + completeness critic) consolidates lane outcomes into a single decision. §9 closes that decision's outcome via time-axis retrospective. Phase 2: Superscalar PM agent auto-calls `hyperbrief-revisit-schedule` after retire.
5. **Superscalar §2 issue_width_read ↔ Hyperbrief exempt**: read-only fan-out is exempt from Hyperbrief gate (no side effects). Explicit in both SKILL.md files — blocks false-positive gating.

**Conflict management:**

1. **Latency conflict**: pausing lanes breaks Superscalar's latency-hiding. **Resolution**: Hyperbrief is gate-only — IR / render generation runs in a *background speculative lane* (reusing Superscalar's §1 speculation). Only `DECISION_REQUEST` is emitted immediately; while waiting for user response, other read lanes and reversible write lanes continue. Retire-time verification on user response.

2. **Decision flood**: one fan-out triggering 5 hyperbriefs causes alert fatigue. **Resolution**: use Superscalar's `sibling_lanes` in lane_manifest — Hyperbrief enters batch mode, consolidating sibling lanes into a single HyperbriefCard with multi-option §5 MCDA. User authorizes N lanes in one decision.

3. **Speculative-lane Hyperbrief blocking**: when speculation-lane allowlist is expanded to include irreversible actions, Hyperbrief must block. **Resolution**: extending the speculation allowlist is itself a Hyperbrief MUST-trigger matter — Superscalar SKILL.md explicitly notes "speculation allowlist addition = configuration decision = requires Hyperbrief".

**`Hyperbrief.md §9` integration statement (for SSoT-level declaration):**

> *"Hyperbrief and Superscalar are orthogonal gates evaluated serially at every fan-out decision and at every write/deploy/send action — Superscalar asks 'is this fan-out worth the cost', Hyperbrief asks 'does this require user delegation'. Read-only lanes are exempt from Hyperbrief by construction. Write/deploy/send lanes that pass Superscalar's cost-benefit gate enter Hyperbrief's escalation check; if FULL_HYPERBRIEF, the lane is paused (Constellation DECISION_REQUEST in flight) while sibling reversible lanes continue under Superscalar latency-hiding. Multi-lane batching prevents decision-flood. The retire stage (Superscalar) feeds the decision-capture stage (Hyperbrief §9) automatically, closing the cross-module learning loop."*

## B.9 Adoption path

### EG main (this repo)

1. **v2.5.14 — initial Hyperbrief ship**: commit `Hyperbrief.md v0.1.0` (root SSoT) + `plugins/hyperbrief/` (2 skills + schema + 2 renderers + templates). CHANGELOG: "feat(hyperbrief): v0.1.0 — decision-delegation gating SSoT + plugin (skill + IR schema + MD/HTML deterministic renderers; Phase 1)".
2. **v2.5.15 — Constellation A2A allowlist extension**: add 4 names + `HyperbriefCard` to `Constellation.md §13.16.9`; add `tier='decided'` recognition to `plugins/constellation/mcp/server.cjs` `a2a_wait_ack`; add Decision Card zone to board UI (Constellation v0.3.0).
3. **v2.5.16 — Superscalar interlock ship**: add "§3b irreversibility-gate → escalate to hyperbrief-trigger-check" paragraph to `Superscalar.md §3 cost-benefit gate`; explicit Hyperbrief-gate invocation in `plugins/superscalar` SKILL.md.
4. **v2.5.17 — Phase 2 hooks + MCP**: activate `plugins/hyperbrief/hooks/hooks.json` (PreToolUse matchers = AskUserQuestion / git push / gh release / A2A emit); add `plugins/hyperbrief/mcp/server.cjs` with tools `hyperbrief_render`, `hyperbrief_validate`, `decision_ledger_append`, `decision_ledger_query`.
5. **v2.5.18 — dogfood ledger begins**: `Hyperbrief.md §11` accumulates actual use cases entries 01–05. Publish telemetry: user_acceptance_rate / Brier score / pre-mortem input length distribution.

### Adapters (external agent gateways like Hermes)

Hermes-EG (or equivalent gateway) is the standing path for external agents to join the EG board. Adoption is *graceful-degradation first*:

1. **Level 0 — passthrough**: Hermes relays `DECISION_REQUEST` / `HyperbriefCard` envelopes as-is to external agents. Unrecognized → Constellation §13.16.12 Pattern 7 TEXT_MESSAGE fallback (standard prefix auto-prepended). Adapter code: 0 lines.
2. **Level 1 — outcome-tier shim**: Hermes parses external agent's plain text response with keyword matching to infer DECISION_RESPONSE outcome ("agree" → accepted, "later" → deferred, "no" → rejected). `value.confidence < 1` metadata flag attached. ~30 lines of shim.
3. **Level 2 — full Hyperbrief consumer**: Hermes adapter parses `HyperbriefCard.value.ir` and converts to external agent's native prompt (injecting only §6 decision_prompt + §8 recommendation_conditional into the external LLM's system prompt). `ack_tier='decided'` response converts to `DECISION_RESPONSE` envelope. Adapter README gets "Hyperbrief v0.1 conformant" badge.
4. **Shared library**: publish `plugins/hyperbrief/schema/hyperbrief-ir.schema.json` as npm `@estregenesis/hyperbrief-ir` package so adapters can share schema validation.

### External users (claude-community marketplace)

Same path Superscalar / Constellation already used:

1. **Self-hosted marketplace first**: `/plugin marketplace add SoliEstre/EstreGenesis` → `/plugin install hyperbrief@estregenesis-plugins`. Always tracks main branch HEAD.
2. **claude-community marketplace application**: at v0.2.0 (after Phase 2 hooks + MCP verification), PR to claude-community. Once approved: `/plugin install hyperbrief@claude-community`.
3. **Standalone mode**: works without Constellation — Hyperbrief is a standalone skill (LLM emits IR → local renderer produces MD/HTML → user sees the two file paths directly). Decision-ledger as file-based `.agent/_decisions/` (fallback when Constellation absent). README explicitly: "Constellation optional synergy".
4. **README quick start**: after install, the first decision request auto-discovers the skill → trigger-check skill outputs escalation score → on `FULL_HYPERBRIEF`, IR JSON + both renders + card preview shown to user.
5. **Anthropic plugin discovery listing**: same as Constellation/Superscalar — `homepage` field points to the raw GitHub URL for LLM-discoverable spec.

---

## Closing — module scaffolding next steps

The synthesis converged. The design is concretely sized — Phase 1 ships in ~12 files (1 root SSoT + 1 plugin.json + 1 plugin README + 2 SKILL.md + 1 JSON schema + 2 renderers + 2 templates + 2 reserved skill SKILL.md). Phase 1 commit can land in v2.5.14 with a small CHANGELOG entry.

Recommended next moves for the maintainer review:

1. **Verify the §0 escalation rubric thresholds** (sum < 4 → autonomous; sum ≥ 4 → fire) against 5–10 historical decision moments in this repo to ensure neither over-fires (alert fatigue) nor under-fires (silent risk).
2. **Decide the §9 ledger storage**: file-based `.agent/_decisions/` only (Phase 1) vs. Constellation `state.json.decisions[]` from v0.1 (Phase 1 + Constellation v0.3.0 in one cycle).
3. **Decide Phase 2 scope split**: hooks-only (faster) vs. hooks + MCP server (heavier but unlocks IR validation as a tool). The MCP tool `hyperbrief_validate` would let *other* agents validate Hyperbrief IRs before emit, valuable for the Hermes Level-2 adapter.
4. **Verify Constellation §13.16.9 allowlist extension does not collide** with any in-flight A2A intent name in adopter projects (4 new names are unique enough but worth a one-pass check).
5. **Set Brier-score baseline** — the first decisions captured in §11 dogfood ledger set the initial calibration; this is also when adopters should expect "AI confidence will be re-weighted by accumulated accuracy" as a user-facing trust mechanism.

This bundle requests absorption of `Hyperbrief.md` as a top-level module at `v2.5.14` and the three linked extensions to Constellation / Superscalar / state.json described above. Closure log will be updated in `_proposals/006_2026-06-03_hyperbrief/README.md` upon maintainer decision.
