<!-- module: Hyperbrief; layer: decision-gating; part-of: EstreGenesis 2.5.x; version: v0.7.0; date: 2026-06-13; status: design draft v0.7.0 (post-response tone-estimate Stop hook — deferred candidate #5 landed via host-hook equivalence + estimateSurfaceProfile re-export + skill MUST-20 active-profile arming; 직전 v0.6.2 = §5.6.7 live-board decisions-panel fallback surface — Constellation composition, board card button + fallback-rerender feedback contract; 직전 v0.6.0 = substantive 4-slot additive cut — `recommended_methodology[]` (§8) + `evaluation_lenses[]` (§0) + `maturity_anchor` (FullBrief top-level) + `term_pairing` (§0 AudienceProfileFallback extension with mode E/I/N + scope C/D/B/R + retroactive_apply + I-mode low-frequency override + C-scope auto-non-retroactive + short-command form Lx.M.S+S! / Lx.M.S?); back-compat preserved — all 4 slots optional, existing v0.5.6 IRs validate against v0.6 schema; Workflow fan-out mezzo batch ratification pattern applied (7-agent parallel implementation: schema + renderer + 4 templates + 3 skills); v0.5.6 §5.6.7 auto-localize discipline preserved; v0.5.5 §11.5 v1.0 readiness rubric Lens A 5.3/4.9 + Lens B 5.5/5.1 — both sub-threshold — unchanged, candidates pending count v0.6 → 3 (v0.7+ register)); depends-on: none (optional synergy: Constellation §13 A2A — active, Superscalar §3.1 decision-delegation interlock — active); license: Apache-2.0 -->

# Hyperbrief — Decision-Delegation Gating Discipline

> **EstreGenesis optional module — design draft v0.1.** Where Constellation governs *how* agents talk to each other and Superscalar governs *how* an agent dispatches sub-work, Hyperbrief governs the third axis: **how an agent delegates decisions back to the user.** Hyperbrief is not a "briefing format." It is a **gating ritual** for the act of asking the user to decide — (a) a *trigger rubric* that decides whether the question should be asked at all, (b) an *epistemic-honesty surface* that forces the LLM to admit what it does not know, (c) a *cognitive-debiasing layout* (framing balance · progressive disclosure · active choice) that prevents the agent from steering the user into pre-baked consent, (d) a *reversibility-first governance* (RAPID / Cynefin / lexicographic reversibility priority) that classifies the decision before content, and (e) a *post-decision learning loop* (decision lineage + revisit trigger) that closes the feedback path most agents leave open.
>
> **The principal failure mode Hyperbrief targets** is the *sycophantic over-delegation loop* — an agent that masks its uncertainty by manufacturing artificial choice points, then nudges the user toward a pre-selected answer with framing tricks ("괜찮을까요?"), and never closes the learning loop. The opposite failure is *false autonomy* — an agent that decides a high-blast-radius, irreversible action alone and post-notifies. Hyperbrief is the **two-sided gate** between these: it both blocks unnecessary delegation (when the escalation score is low → autonomous decide + post-notify) and blocks unstructured delegation (when escalation is high → full 9-section IR required).
>
> **Schema-enforced, not free-form.** The LLM emits a single **JSON IR** that conforms to `hyperbrief.schema.json`; deterministic Node renderers (`renderer-md.cjs` / `renderer-html.cjs`) emit the Markdown ADR and the interactive HTML. The LLM never writes MD or HTML directly. This is the load-bearing constraint — without IR/render separation, the MD and HTML drift, and the "8 sections" become a markdown cosplay rather than a contract.
>
> **Optional.** A project without high-stakes decisions does not need Hyperbrief. Adopt it when (a) the agent has autonomous write capability, (b) cross-module or external-party blast radius is possible, or (c) prior decisions need supersession discipline.
>
> **Self-sufficient.** This file is the SSoT. Everything an adopter needs to implement a Hyperbrief-conformant gate is here. The plugin at `plugins/hyperbrief/` is a runtime adapter for Claude Code; other harnesses can adopt the spec directly.

---

## 1. Concept — what Hyperbrief actually is

| Common misreading | What Hyperbrief actually is |
|---|---|
| "A briefing template." | A trigger rubric + a schema + a renderer pipeline. |
| "Just write the 8 sections in MD." | LLM emits IR only; MD/HTML are deterministic renders. |
| "Helps the user decide better." | Blocks the agent from manufacturing decisions for the user; helps the user *refuse* the framing. |
| "Run it before every big change." | Run the trigger-check before *every* user-facing question; emit the full brief only when escalation ≥ 4 or a MUST-trigger condition fires. |

The **five-stage pipeline** (each stage MUST pass; failure routes to a different output):

```
trigger rubric  →  epistemic honesty  →  cognitive debiasing  →  reversibility governance  →  learning loop
   (gate)             (surface)              (debias)                  (classify)                 (close)
```

A request that fails the trigger rubric never produces a brief — the agent decides autonomously and post-notifies. A request that passes produces a brief whose every fact-statement carries an epistemic tag, whose every recommendation cites tree nodes, whose reversibility class is declared before any content, and whose revisit date is registered before the user even responds.

---

## 2. Trigger Rubric — Hyperbrief invocation itself is the first decision

The most expensive failure mode the rubric prevents: an agent that emits a Hyperbrief for trivial decisions desensitizes the user (alert fatigue → automatic "yes"), and an agent that does not emit one for high-stakes decisions surfaces no audit trail.

### 2.1 Escalation 4-score (each indicator 0-3)

| Indicator | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| **Irreversibility** | trivially reversible | reversible with effort | reversible with migration cost | one-way |
| **Blast radius** | single file/local | one module | cross-module | cross-system / external |
| **Time horizon** | minutes | hours | days | weeks+ |
| **Reversal cost** | free | low | moderate | severe |

`escalation_sum = irreversibility + blast_radius + time_horizon + reversal_cost` (range 0-12).

- `sum < 4` AND no MUST-trigger fires → **AUTONOMOUS_DECIDE** (agent decides, post-notifies in one line; brief generation is blocked).
- `sum ≥ 4` OR any MUST-trigger fires → **FULL_HYPERBRIEF** (emit full IR).

### 2.2 MUST-trigger conditions (any one alone → FULL_HYPERBRIEF)

1. `irreversibility_score ≥ 2` (anything not fully reversible).
2. Blast radius crosses a module boundary (any `touched_contracts` or `touched_external_consumers` non-empty).
3. Any `touched_external_consumers` requires out-of-band notification.
4. Resource estimate exceeds threshold (tokens > 200k OR money > $50 OR time > 4h OR new external API/service).
5. Decision supersedes a `parent_decision_id` in the decision lineage of an existing decision.

### 2.3 Anti-trigger conditions (suppress brief even if score ≥ 4)

- Read-only fan-out (no side effects; Superscalar's read lane is exempt by construction).
- Cynefin domain = `chaotic` → emit MINIMAL_BRIEF (single-action card + 24h retro auto-scheduled), not full brief.
- Cynefin domain = `confused` → emit `DECISION_REJECT_FRAMING` with reason `domain unclear; clarify first` instead of attempting a brief.

### 2.4 Self-throttle — alert-fatigue circuit breaker

Maintain rolling stats over last 20 hyperbriefs. If `user_acceptance_rate > 70% AND user_premortem_input_avg_length < 30 chars`, emit a self-warning card to the user ("Hyperbrief 자동 승인 패턴 감지 — trigger 임계 상향 권유") and raise `escalation_sum` threshold from 4 to 5 for next 10 cycles. This is the **anti-cosplay** guard: a Hyperbrief that is rubber-stamped is a Hyperbrief that has degenerated into ceremonial overhead.

---

## 3. §0 Decision Header — escalation justification + classifier

Before any content, the brief MUST declare:

| Field | Required content |
|---|---|
| `escalation` | the 4-score table + sum + "why this is not autonomous" (1 line) |
| `reversibility_class` | `two_way` / `one_way_with_migration_path` / `one_way` + badge color (green/yellow/red) |
| `rapid` | Recommender / Decider / Performer / Input-contributors / Agree-holders (veto) |
| `cynefin_domain` | `clear` / `complicated` / `complex` / `chaotic` / `confused` |
| `decision_lineage` | `parent_decision_ids[]` + `assumed_invariants[]` (parent invalidation auto-queues revisit) |
| `deadline` | ISO8601 timestamp or `"no rush"` |
| `recommended_reading_minutes` | integer |
| `stake` | `financial` / `reputation` / `tech_debt` estimates (each tagged) |
| `audience_profile` | 3-axis × 5-level tone profile `{audience, abbreviation, jargon}` — see §5.6. Default `{2, 2, 2}`. Renderer SHOULD adapt prose density + acronym/jargon expansion + sentence length to this profile. |
| `evaluation_lenses` *(v0.6, optional)* | Multi-lens scoring slot. Array of `{id, name, dimensions[], threshold_simple_mean?, threshold_weighted_mean?, current_simple, current_weighted, verdict: below|at|above, methodology_ref?, rationale_one_line?}`. Use when the SAME decision target is scored under DIFFERENT lenses (e.g., §11.5 Lens A module-wide GA vs Lens B host-specific marketplace registration). `methodology_ref` points to a `§8.recommended_methodology[].id` for audit-trail traceability. Empty slot means single-lens decision (no special semantics). |

**Why this comes before content.** The reader must classify the decision (reversibility · stakes · who decides · domain) in 30 seconds to route attention: skim / read carefully / escalate / defer / reject framing. Without §0, the reader scrolls into §1-§8 content with no prior — and content-first reading is exactly what framing effect exploits.

**`evaluation_lenses[]` rationale (v0.6).** Single-lens reporting hides cross-lens divergence. §11.5 itself is the first self-application case: Lens A (7-dim module-wide GA, threshold 8.0) and Lens B (6-dim Claude marketplace, threshold 7.5) both report the SAME decision target ("ready for v1.0 / for registration") with non-overlapping dimensions and non-equal thresholds. Without an explicit `evaluation_lenses[]` slot, a brief that reports "5.3/10" leaves the reader unable to recover which lens that score belongs to. The slot makes the lens-split a *schema-tier* invariant rather than prose-level convention. Back-compat: omit the slot for single-lens decisions; existing v0.5.6 IRs validate unchanged.

**`maturity_anchor` rationale (v0.6, FullBrief top-level optional).** Arbitrary labels (`v1.0`, `GA`, `production-ready`, `stable`) drift across spec body without anchored thresholds. The new top-level `maturity_anchor` field `{claimed_label, anchor_methodology, current_score: {simple_mean, weighted_mean}, threshold: {simple_mean, weighted_mean}, gap_analysis, verdict?: meets|near|short}` forces the IR author to (a) declare the claimed label explicitly, (b) reference a `§8.recommended_methodology[].id` as the anchoring rubric, (c) state current scores AND threshold values side-by-side, (d) provide a one-line gap analysis (`tagged_text` — epistemic-tagged). The `verdict` enum is convenience-only (renderer can compute from current-vs-threshold). Self-application: a `v1.0.0` cut brief MUST carry `maturity_anchor` with `anchor_methodology = "hyperbrief-v1-readiness-rubric"` referencing §11.5. Empty slot means decision is not a maturity-claim (no anchor required); v0.5.6 IRs validate unchanged.

---

## 4. §1-§9 Body — section-by-section spec

### §1 Context Horizon

3-cell structure — `preconditions` · `continuity_from_prior` · `scope_of_impact` · `forcing_function` (why now). Every assertion carries an epistemic tag. MUST NOT paraphrase §6 (validator rejects redundancy via cosine threshold).

### §2 Blast Radius Surface

5 surface fields — `touched_modules` · `touched_contracts` · `touched_data_at_rest` · `touched_external_consumers` · `touched_operational_runbooks`. Empty slots are `"verified empty"`, never `"unknown"` (unknown is a red flag). Plus `coupling_delta` (new dependencies, new consumers, interface surface delta, depth-to-interface ratio change) and `observability_increment`. `hyrum_exposure_flag` MUST be set when externally visible behavior changes.

### §3 Incremental Path Check

`chosen_path ∈ {big_bang, incremental_strangler, branch_by_abstraction, feature_flag_gated}`. If `big_bang`, MUST justify why strangler fig / branch-by-abstraction / feature flag are not possible — missing justification flips `tentative_flag_if_big_bang = true` and downgrades §8 from `recommended` to `tentative`. `milestones[]` each carry `rollback_possible ∈ {yes, partial, no}` and `blast_radius_at_step`.

**Position note.** §3 sits between §2 (what) and §4 (why) in the IR but is RENDERED AFTER §4-§7 in the MD/HTML. Reading procedure before deliberation triggers sunk-cost commitment and dampens §5 dissent. The renderer enforces the reordering.

### §4 Why — 4-block expansion

- **4a Decision Driver** — what forces this decision now.
- **4b Boundary Conditions** — `must_have` (≥ 2; under 2 → validator rejects and asks user for spec) · `should_have` · `nice_to_have`.
- **4c Hidden Assumptions** (≥ 3; "없음" is a lint failure — there is no option decomposition without hidden assumptions) — each item is `{assumption, if_violated}`.
- **4d Rejected Alternatives** (≥ 2 OR `forcing_function_closes_option_space_justification` text) — each item is `{alternative, rejection_reason}`.

### §5 Consequences — 7-block (the heaviest section)

- **5a Framing Matrix** — 2x2 `{accept_gain, accept_loss, reject_gain, reject_loss}` + 5th cell `no_action` (do-nothing baseline). Single narrative is forbidden.
- **5b Reversibility Panel** — `rollback_cost` (time / money / relational_capital) · `reversal_window` (D-N counter) · `trigger_to_revisit` (what signal triggers re-decision).
- **5c MCDA Table** — alternatives (MUST include `do_nothing`) × criteria (derived from §4b boundary conditions) × `{value, rationale}`. Empty cell forbidden — missing value MUST be `UNKNOWN+investigation_cost:<estimate>`.
- **5d Pre-mortem** — ≥ 2 scenarios, each `{failure_path, early_warning_signal}`.
- **5e Most-Affected Stakeholder** — first-person restatement from the stakeholder who bears the largest share of the cost.
- **5f Null Option Cost** — do-nothing cost at d30 / d90 / y1. Zero estimates flip `lehman_violation_flag` (Lehman's law: software in use must keep evolving; null cost is rarely zero).
- **5g Toulmin Predictions** — each `{claim, grounds, warrant, qualifier, rebuttal}`. `qualifier` is a `{point_estimate, ci_90_low, ci_90_high, most_likely_to_miss_scenario}` quadruple — no natural-language probability words (`"likely"`, `"probably"`, `"아마도"`) anywhere. `rebuttal` must not be `"none"` (Toulmin plausibility violation).

### §6 Decision Prompt

3 slots — `essence_one_line` · `core_tradeoff_one_line` · `recommendation_with_confidence_one_line` — plus the literal `question_to_user` (ends with `?`). Optional `ai_view_vs_devils_advocate` 2-column. §6 alone MUST be sufficient to route a decision (self-coherence test: §6 → §8 reachable).

### §7 Decision Criteria Tree

- **Meta-branch** (4 options, always available): `accept` · `reject_framing` · `defer` · `request_investigation`. Without the meta-branch, the agent has trapped the user inside its own frame.
- **Root nodes** (3 standardized): `reversibility` · `blast_radius` · `time_pressure`. Domain-specific questions start from depth 4.
- **Domain format** — Cynefin-adaptive:
  - `clear` / `complicated` → `tree_mermaid` (deterministic flowchart).
  - `complex` → `probe_safe_to_fail` (3 probes + observable signals; tree would be false confidence).
  - `chaotic` → `single_action_card` (immediate action + 24h retrospective).
- **Decision-relevance test** — every node must answer "does this question's answer change the chosen option?" Nodes that fail are pruned.
- **Pruned options** — explicitly listed with exclusion reasons.

### §8 Recommendation (the §7 function)

5 blocks:

1. `recommendation_conditional` — `{recommended, recommended_artifacts[], assumptions[], fallback_if_assumption_violated, switch_if}`. Single unconditional assertion is forbidden. **`recommended_artifacts[]`** — each `{artifact_type: patch | spec | code | design | config | other, target_file, target_anchor, body, rationale_one_line, language?, line_count?, body_hash?}`. If the recommendation references "apply X patch" / "add Y section" / "ship Z change", `body` MUST be the actual text/code the reader is voting on. Empty `body` with a non-trivial reference is AF-20 (recommendation opacity). **v0.5 sub-fields** for structured code artifacts (all auto-stamped by the renderer when absent — adopters MAY pre-populate to assert): `language` (RECOMMENDED string hint — `javascript`, `typescript`, `python`, `json`, `markdown`, `yaml`, `bash`, `diff`, etc. — drives renderer's syntax-aware fenced code-block / HTML syntax highlighting); `line_count` (integer, MUST equal `body.split('\n').length` — renderer auto-computes when absent and warns on mismatch when present-but-wrong); `body_hash` (sha256 hex of `body`, lowercase — renderer auto-computes when absent and warns on mismatch when present-but-wrong). The hash detects accidental tampering between IR emit and decision-archive read; the line count gives a stable comparison metric across cycles for drift detection.
2. `confidence` — `{point_estimate, ci_90_low, ci_90_high, brittleness}`. `confidence.point_estimate < 0.6` → auto-downgrade label from "recommended" to "proposal candidate".
3. `cited_tree_node_ids` — ≥ 1 node ID from §7.
4. `defeaters` — ≥ 3 conditions that flip the recommendation.
5. `pre_mortem_inline` + `reversible_fallback` (`{fallback_path, rollback_cost, trigger_conditions}`).
6. `falsification_trigger` — `{what_to_observe, when, threshold}`. Missing any of the three → validator rejects.
7. `i_accept_irreversibility_required: true` if `reversibility_class == one_way` (HTML renderer surfaces a checkbox gate).
8. **`recommended_methodology[]`** *(v0.6, optional)* — methodology bundles the recommendation was *evaluated by* (not the recommendation itself). Array of `{id, name, version?, anchor_path, applicability[]?, rationale_one_line}`. `id` pattern: `^[a-z0-9][a-z0-9_.-]*$` (dots allowed for versioned ids like `hyperbrief-v1-readiness-rubric.v0.5.5`). `anchor_path` points to the body location where the methodology is defined (e.g., `"Hyperbrief.md §11.5"`). `applicability[]` enumerates contexts where the methodology is reusable (e.g., `["module-GA", "marketplace-registration"]`). The slot's job is to make *meta-decision tooling* a first-class IR citizen, parallel to how `cited_tree_node_ids` makes §7 nodes first-class: a recommendation that was scored via a rubric MUST be able to carry that rubric's identity for downstream audit + reuse. Self-application: any §11.5 readiness-rubric brief MUST populate `recommended_methodology[]` with at least one entry pointing back to §11.5. Empty slot means recommendation was unstructured / qualitative-judgment (allowed); referencing `recommended_methodology[i].id` from `§0.evaluation_lenses[].methodology_ref` or from FullBrief-top-level `maturity_anchor.anchor_methodology` requires the matching id to exist in this array.

### §9 Decision Capture

`revisit_date` (ISO8601) + `ledger_pointer` (`.agent/_decisions/<id>.json` or Constellation decision-ledger SSE id). `outcome_actual` and `outcome_vs_decision_quality_delta` are filled post-revisit by the `hyperbrief-revisit` skill.

**`archive_config`** (optional, **default `enabled: true`**) — when enabled, the decision capture step preserves a development-record archive at `.agent/_decisions/<id>.archive/` (or `_proposals/<bundle>/dogfood-entry-NN.md` for proposals-tracked decisions). The archive bundles five elements as a single load-bearing unit:

1. **`brief_original.md`** — the full brief as the user saw it (the rendered MD, with the `audience_profile` that was active at decision time).
2. **`decision.json`** — `{meta_branch_chosen, user_premortem, decided_at, decided_by}`.
3. **`related_user_prompts.md`** — every user prompt between brief emission and final decision (the prompts that shaped the decision but aren't in the brief itself — e.g., "patch 2건에 대한 사안 설명이 포함되어있는거 맞나?" type drill-downs).
4. **`recommended_artifacts_applied.md`** — for each `§8.recommended_artifacts[]` element, whether it was applied verbatim, modified, or dropped, with the actual landed text.
5. **`meta_learnings.md`** — schema gaps surfaced, anti-patterns triggered, friction reports from the LLM's self-critique.

The archive is the **load-bearing development record** — it's how Hyperbrief decisions remain auditable after months. Adopters MAY disable per-brief (`archive_config.enabled: false`) for low-value decisions, but the default is ON because the marginal cost of archival is small and the lost context after disabling is unrecoverable.

**Layer separation — per-decision archive vs module-level ledger**. The per-decision `archive_config` above stores one decision's full bundle. The **module-level dogfood ledger** (§11.2) is the index over all decision archives within an adopter project — it is SHOULD-kept in an external file, not inside the SSoT body, to preserve the spec body's normative/cite-stable surface from operational telemetry drift. SSoT body retains only a recent-N-row index + pointer; the full ledger lives at `_proposals/<bundle>/dogfood-ledger.md` (human-readable) or `.agent/_decisions/<module>-ledger.jsonl` (machine-readable stream, append-only).

---

## 5. Epistemic Discipline (cross-section invariants)

### 5.1 4-tier epistemic tag (MUST be inline on every fact-assertion)

`[verified]` — directly observed in current context.
`[inferred]` — derived from observed facts via stated reasoning.
`[assumed]` — neither observed nor inferred; explicit assumption.
`[unknown]` — gap; investigation required.

### 5.2 Provenance tag (optional but recommended)

`[관찰]` `[추론]` `[외부:<source>]` `[가정]` — added after the epistemic tag.

### 5.3 Falsification trigger

Every recommendation MUST include a falsification trigger — `{what_to_observe, when, threshold}`. A claim with no falsifier is `vacuous` and gets weight 0 in the recommendation.

### 5.4 Low-confidence banner

If `(inferred_count + unknown_count) / total_assertions > 0.4`, the renderer auto-injects a "low-confidence" banner at the top of §0.

### 5.5 Brier loop

`hyperbrief-revisit` records outcome vs prediction; Brier score increments are appended to the ledger. Long-running adopters use this to calibrate confidence drift.

### 5.6 Audience-tuned rendering — `audience_profile` 3-axis × 5-level

The reader's cognitive context is not a constant. A brief that reads correctly at L3 (developer) is unreadable wallpaper at L1 (general) and verbose hand-holding at L5 (expert / academic). Hyperbrief therefore declares **three orthogonal tone axes**, each on a **5-level Likert-style scale**, registered in §0 `audience_profile`. Renderers MUST honor the profile; the LLM MUST adapt prose, not just terminology.

#### 5.6.1 `audience` — domain familiarity

Extends the existing EG promo HTML 3-tier (`general / dev / expert` — see `docs/shared/audience.js`) by inserting two interpolation tiers, giving a smooth ramp:

| Level | Persona | Concrete rendering rule |
|---|---|---|
| **L1** | 일반인 (general) | Analogies first, no acronyms without expansion, every technical noun gets a 1-line gloss the first time it appears, examples concrete and domain-anchored. |
| **L2** | 일반–개발 중간 (**default**) | Plain language by default, technical nouns allowed if the gloss is short or self-evident from context, code/jargon used sparingly and always with a parenthetical hint. Optimized for a literate non-specialist who codes occasionally or works adjacent to engineering. |
| **L3** | 개발자 (dev) | Standard engineering vocabulary assumed (HTTP, schema, IR, idempotent, ack-tier, etc.), no expansion of well-known acronyms, code references inline OK, architecture-level abstractions used without scaffolding. |
| **L4** | 개발–전문 중간 | L3 + domain-academic terms allowed without scaffolding (`falsification trigger`, `Toulmin qualifier`, `Cynefin probe-sense-respond`), inline citation of underlying frameworks rather than re-explanation. |
| **L5** | 전문 / 학술 (expert / academic) | Citation-dense, framework-level shorthand, mathematical or formal notation OK, prose assumes the reader can derive intermediate steps. |

#### 5.6.2 `abbreviation` — surface compression

How aggressively the renderer **shortens** prose (independent of vocabulary level). Useful when L4-L5 readers want dense L1-style sentences, or L1-L2 readers want unabbreviated full prose.

| Level | Rendering rule |
|---|---|
| **L1** | Full sentences, every clause complete, no contraction, no shortcuts. Maximally explicit. |
| **L2** (**default**) | Natural prose with light compression (some bullets, occasional symbols where they read more cleanly than words). |
| **L3** | Bullet-heavy, fragmented clauses OK, common compressions used (`→` for "leads to", `+` for "and", `vs` for "versus"). |
| **L4** | Telegraphic style, parentheticals for elaboration, symbolic operators preferred (`∴` `∵` `⇒` `≈`), table-first over prose-first. |
| **L5** | Maximum density, formal notation where applicable, every redundant word removed; reads as spec or theorem, not prose. |

#### 5.6.3 `jargon` — domain-term density

How frequently and with how little scaffolding the renderer uses **field-specific technical terms** (RAPID, Cynefin, MCDA, AHP, Toulmin, Hyrum's law, blast radius, idempotent, sycophancy, lexicographic priority, etc.).

| Level | Rendering rule |
|---|---|
| **L1** | Jargon avoided entirely; rephrased to plain-language equivalents (e.g., "결정 권한 배분 표" instead of "RAPID"). |
| **L2** (**default**) | Jargon allowed where the brief's anchor concept depends on it, but every first use carries a 1-line plain-language gloss. |
| **L3** | Jargon used freely if the term has a single canonical meaning in the field; gloss optional and short. |
| **L4** | Jargon used as primary vocabulary; underlying framework cited (`per Cynefin`, `Toulmin qualifier`) but not re-explained. |
| **L5** | Jargon assumed; citations terse (`(Snowden 2007)`, `(Toulmin 1958)`); reader expected to know the framework. |

#### 5.6.4 Orthogonality

The 3 axes are independent — `{audience: L3, abbreviation: L4, jargon: L1}` is valid (a developer wants short bullets but in plain language, no field jargon). Renderers MUST NOT collapse the three into a single "complexity" knob.

#### 5.6.5 Profile override scope

`audience_profile` is per-brief (registered in §0). It MAY be overridden at the adopter project level (`.hyperbrief/profile.json`) or session-level (user preference). Without override, the default is `{audience: 2, abbreviation: 2, jargon: 2}` — chosen because L2/L2/L2 is the highest-utility default for a literate non-specialist reader (the user who wrote the spec but is not currently in expert mode), and because anchoring at the middle of each scale preserves the reader's ability to slide either direction without re-orientation.

#### 5.6.6 Epistemic-tag interaction

Epistemic tags (`[verified|inferred|assumed|unknown]`) are content invariants, not rendering choices — they remain on every fact-assertion regardless of profile. However, the **rendering of the tag** adapts:

- L1-L2 `abbreviation` → tags rendered as inline parenthetical glosses (`확인됨` / `추론` / `가정` / `미상`) — short but readable in prose.
- L3 → tags rendered as the canonical bracket form (`[verified]` etc.) inline.
- L4-L5 → tags rendered as superscript or symbol shorthand (`ᵛ` `ⁱ` `ᵃ` `ᵘ`) per renderer style.

The IR field always carries the canonical bracket form; the surface rendering varies.

#### 5.6.7-pre `surface_profile_estimate` — declared-vs-effective drift detection (v0.5)

`audience_profile` (§5.6.1-5.6.3) is a *declaration* — what the brief intends to read like. Whether the *rendered surface* actually matches that declaration is a separate question that `audience_profile` alone cannot answer. Dogfood Entry 02 surfaced this as a load-bearing gap: a brief labeled `audience: 2` can still render with L3-L4-level English jargon density when the IR content itself is technical; the user is left re-applying the tone-floor fallback (§5.6.7 below) one cycle later than necessary.

v0.5 introduces a renderer-computed `surface_profile_estimate` (§0.surface_profile_estimate, schema `#/$defs/SurfaceProfileEstimate`) that runs heuristics over the rendered surface and reports an *estimated effective* profile alongside the declared one. The renderer also persists the raw metrics (`english_noun_ratio`, `avg_sentence_length_chars`, `jargon_terms_per_1000_tokens`, `first_use_gloss_present`, `bullet_density`, `epistemic_tag_form`) so adopters can calibrate the heuristic over time.

**AF-18 auto-warning rule**: when `|declared - estimate| >= 2` on any single axis, the renderer auto-injects a warning into the result's `warnings[]` (and the renderer SHOULD surface it as a banner near §0 in MD/HTML). The warning is *informational*, not blocking — the LLM may have valid reasons for the gap (e.g., an inherently technical IR content domain), and the user can dismiss it. But its presence puts the gap in front of the reader instead of letting it propagate silently into an unreadable brief.

**Why heuristics are not authoritative**: the estimate is a *drift surfacer*, not a judge. The declared `audience_profile` remains the IR's normative truth; the estimate surfaces when surface-vs-declaration drift exceeds a threshold so the LLM or the operator can reconcile. The estimate MUST NOT auto-override the declaration.

**Post-response tier (v0.7.0 — Stop-hook tone estimate)**: the declared-vs-effective question gets a third, *temporal* answer — after each response, a Stop-hook (`hooks/tone-estimate.cjs`, §11.4 advise mode) re-runs this same 6-heuristic estimate against the response the user actually received. Armed only while `.hyperbrief/active-profile.json` exists (written by the skill at IR-emit time per MUST-20; zero-cost otherwise), it compares the declared profile against the estimate and emits ONE advisory line on |Δ| ≥ 2 on any axis (renderer-consistent threshold), suggesting the §5.6.7 fallback re-render. Repeat advisories are suppressed per decision_id + gap signature (§2.4 alert-fatigue), the brief cycle is closed by deleting the file (24h TTL advisory as backstop). The deferred candidate #5 ("hook post-response tone evaluation layer") landed here once the host Stop hook was recognized as the PostResponse-equivalent timing — an extension of the existing §11.4 hook tier, not a new architectural layer.

#### 5.6.7 Tone-floor fallback affordance

A brief rendered at any non-L1 profile MUST also expose a one-action **tone-floor fallback** that re-renders the same IR at `{audience: 1, abbreviation: 1, jargon: 1}`. The reader's path to maximal plainness must never require knowing the three-axis vocabulary.

- **HTML surface**: a permanent button at the top of the card with playful copy wired to client-side re-render at `{1, 1, 1}`. The button MUST appear regardless of the current profile (yes, even when already at L1/L1/L1 — it then becomes a no-op confirming "this IS already the plainest version"). The button label is carried by `audience_profile_fallback.button_label`.
- **Auto-localization at IR-emit time (v0.5.6 — load-bearing default)**: the skill (LLM composing the IR) MUST populate `audience_profile_fallback.button_label` AND `audience_profile_fallback.trigger_phrases_md` in the **user's prevailing conversation language**, because the LLM already knows that language from the surrounding context at IR-emit time. Reference literals — English: `"What? Just say it plainly."`; Korean: `"뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)"`; Japanese: `"何これ？私が分かる言葉で。"`; analogous for other languages. The skill picks the appropriate literal per prevailing language; mixed-language sessions follow the user's most recent prevailing-language signal. Schema and renderer defaults (`button_label` Korean literal + Korean-only `trigger_phrases_md`) remain as the last-resort fallback for IR-direct-call / programmatic / test invocations where no conversational language is observable; in normal skill-driven flow this fallback never surfaces. Adopters who want a hard override for their reader-base MAY pin a static `button_label` / `trigger_phrases_md` in `.hyperbrief/profile.json` — the hard override takes precedence over the skill's auto-localize.
- **MD surface**: MD is static and has no button. Instead, the LLM monitors the user's response after delivering a brief. If the response matches `audience_profile_fallback.trigger_phrases_md` (which the skill populates in the user's language per the auto-localize discipline above; the schema's Korean default applies only when no skill-side population happened), the LLM MUST regenerate the brief at `{1, 1, 1}` and offer it BEFORE attempting any other answer.
- **Trigger-phrase update**: adopters MAY extend the trigger phrase list per their reader-base; the canonical default list lives in §0 `audience_profile_fallback.trigger_phrases_md`.
- **Telemetry-driven phrase learning (v0.5, opt-in)**: when `audience_profile_fallback.telemetry.enabled: true` and a `log_path` is configured, adopters MAY append a row per *confusion event* (user response that triggered the fallback, OR a user response that signaled confusion despite no auto-trigger — the latter caught by the user's explicit cue or a periodic offline review) to a JSONL phrase-learning log. A phrase that recurs `>= telemetry.promotion_threshold` times across distinct `decision_id`s is offered for promotion into the canonical `trigger_phrases_md` default set. The default is **off** to keep render behavior deterministic; opt-in requires explicit `telemetry.enabled: true`.
- **Why this exists**: §5.6 gives readers three independent knobs but knobs require knowing they exist. The fallback affordance is the **escape hatch** — a single visible exit to the floor, no knob-knowledge required. This pairs §5.6 with §7 meta-branch (both are voluntariness affordances at different layers).
- **Live-board decisions-panel surface (v0.6.2 — Constellation composition)**: when a brief is registered as a Constellation live-board decision entry (the §13.17 defer-OK route), the board card is a third surface alongside HTML and MD. Reference implementation (Constellation reference dashboard, v2.4.15): every non-resolved decision card renders a fallback button — label from the entry's `fallback.label` slot (populate it with the IR's `audience_profile_fallback.button_label` at registration time, honoring the auto-localize discipline above) with a plain default when absent; clicking POSTs a `{kind: "fallback-rerender", id, question}` row to the board's feedback channel. The brief-owning agent treats that row as the MD-surface trigger-phrase equivalent: regenerate the entry's `detail` one floor lower (or at `{1,1,1}` if already near-floor) and re-register — same escape-hatch contract, board-mediated. Board `detail` is rendered escaped with newline-to-break only (no HTML), so the re-render targets plain text with line structure.

#### 5.6.8 `term_pairing` — surface-display policy + scope + retroactive (v0.6)

The 3-axis tone profile (§5.6.1-5.6.3) controls *vocabulary level* + *abbreviation density* + *jargon density* but does NOT control *display policy* (every-occurrence vs first-occurrence vs none) and does NOT control *application scope* (conversation vs document vs board vs review). In a multi-surface environment (Constellation board panels + decision-archive MD + review-line items + ambient conversation) the same vocabulary level wants different display + scope policies per surface. v0.6 adds `audience_profile_fallback.term_pairing` as the precision control.

**Three sub-axes**:

| Sub-axis | Enum | Meaning |
|---|---|---|
| `mode` | `E` (every) / `I` (initial) / `N` (none, **default**) | How often a term gets the abbrev-or-full pairing displayed. `E` = every occurrence; `I` = first occurrence within the scope unit (subject to low-frequency override below); `N` = never paired. |
| `scope` | array of `C` (conversation) / `D` (document, **default `["D"]`**) / `B` (Constellation board) / `R` (review-line item). `A` is a shortcut expanding to `[C, D, B, R]`. | Which surface unit the policy applies to. Multi-select. Each scope unit counts independently for `I`-mode frequency. |
| `retroactive_apply` | `Y` / `N` / `prompt` (**default `prompt`**) | When the user changes the policy mid-stream, does the policy retroactively rewrite *already-rendered* prior outputs within the scope? `Y` = yes immediately; `N` = no (new outputs only); `prompt` = skill asks the user at change time. |

**Defaults summary**: `tone_profile = L2.2.2 / term_pairing.mode = N / term_pairing.scope = ["D"] / term_pairing.retroactive_apply = prompt`. The default is the legacy behavior — no term pairing, document-scoped, ask before retroactive.

**`I`-mode low-frequency override**: within a single scope unit, if the term's total occurrence count is **≤ 3**, the renderer pairs every occurrence regardless of `I` mode. From the 4th occurrence onward, `I` mode pairs only the first. Rationale: a term used 2-3 times across a long brief has large intervening distance between occurrences, so the reader has likely forgotten the abbreviation; pairing every occurrence costs little and avoids re-acquisition friction. From 4+ occurrences the abbreviation is stable enough that first-only pairing suffices. The author does not need to count occurrences manually — only the threshold (4) is required knowledge.

**`C` (conversation) scope auto-non-retroactive**: conversation scope is **structurally** exempt from retroactive_apply. Regardless of `Y` / `N` / `prompt`, when the policy change includes `C` scope, the new policy applies only to future outputs (the equivalent of `N` for the C portion). The skill MUST NOT prompt for retroactive C-rewrite. Rationale: rewriting historical conversational replies is (a) determinism-fragile (the original turn shaped subsequent user prompts), (b) high user cognitive load (the user re-reads turns they've already processed), (c) marginal consistency value. Persistent surfaces (D / B / R) retain the prompt/Y/N semantics because retroactive rewrite preserves uniform tone over a durable artifact.

**Short-command form** (skill parses; user-facing shorthand):

| Command | Expansion |
|---|---|
| `L1.I.C` | `tone_profile = L1.1.1` + `term_pairing.mode = I` + `scope = [C]` |
| `L1.E.A` | `tone_profile = L1.1.1` + `term_pairing.mode = E` + `scope = [C, D, B, R]` (A expands) |
| `L2.N.D` | `tone_profile = L2.2.2` + `term_pairing.mode = N` + `scope = [D]` |
| `L1.E.C+B` | multi-scope: `scope = [C, B]` |

Suffix modifiers:

- `!` (forced retroactive) — `L1.I.D!` → `retroactive_apply = Y` (rewrite immediately, no prompt).
- `?` (always prompt) — `L1.I.D?` → `retroactive_apply = prompt` (ask even when default would auto-apply).
- (no suffix) — `retroactive_apply = prompt` default applies (but C-scope auto-degrades to non-retroactive per the rule above).

**Why this is in §5.6 (not a separate section)**: term_pairing is an extension of the audience-profile fallback affordance — it inherits §5.6.7's job of giving readers a *precision dial* over how the rendered surface treats domain terminology. tone_profile picks the *level*; term_pairing picks the *display policy + scope + retroactive*. Combined, they form a complete tone-surface control vector.

**Implementation footprint**:

- `mini-engine.cjs` `applyTermPairing()` post-processor runs after primary IR-to-MD rendering, scans the rendered body for terms in the loaded dictionary, applies `mode` + low-frequency override per scope unit. v0.6 ships a minimal default dictionary (placeholder); adopters MAY inject a project-specific dictionary or override the default.
- `scope` including `B` (board) or `R` (review) triggers a Constellation A2A re-emit signal so the corresponding board/review surface re-renders with the new policy (cross-module surface §13).
- `retroactive_apply` triggers history rewrite — for `D` / `B` / `R` scopes only, when set to `Y` or when user confirms a `prompt`. Conversation scope (C) never triggers history rewrite.

---

## 6. Anti-patterns (16 fail modes)

| # | Anti-pattern | Where caught |
|---|---|---|
| AF-1 | Frame-rejection silent retry (agent tweaks the frame slightly and re-emits) | §7 meta-branch logging + main agent rule |
| AF-2 | Hidden assumptions empty | §4c validator |
| AF-3 | Rejected alternatives empty | §4d validator |
| AF-4 | MCDA table cell empty | §5c validator |
| AF-5 | Toulmin rebuttal == "none" | §5g validator |
| AF-6 | Natural-language probability words | §5g + §8 validator (regex) |
| AF-7 | Single narrative §5 (no 2x2 matrix) | §5a validator |
| AF-8 | Null option cost = 0 without justification | §5f Lehman flag |
| AF-9 | Reversibility = boolean instead of 3-class | §0 schema |
| AF-10 | Big-bang without strangler / branch / flag justification | §3 tentative flag |
| AF-11 | Untagged fact assertion | tagged_text schema pattern |
| AF-12 | Decision question that is not a question | §6 trailing-`?` check |
| AF-13 | §8 cites no tree nodes | §8 `cited_tree_node_ids` ≥ 1 |
| AF-14 | Missing falsification trigger | §8 validator |
| AF-15 | Active-choice gate bypassed (no user pre-mortem text) | HTML gate + DECISION_RESPONSE validation |
| AF-16 | Recommendation rubber-stamped > 70% | self-throttle (§2.4) |
| AF-17 | `audience_profile` missing or out-of-range | §0 schema (1-5 enforce) |
| AF-18 | Surface vocabulary mismatches declared `audience_profile` (e.g. L1 declared but jargon-dense) | renderer self-check + §5.6 alignment rule |
| AF-19 | 3 tone axes collapsed into a single "complexity" knob | §5.6.4 orthogonality rule |
| AF-20 | Recommendation cites an attached artifact (patch / spec / code) but body is missing from IR | §8 `recommended_artifacts[].body` required when referenced |
| AF-21 | HTML brief at non-L1 profile lacks tone-floor fallback button | §5.6.7 + HTML template self-check |
| AF-22 | MD brief: user expressed confusion (trigger phrase) but LLM did not regenerate at floor profile before answering | §5.6.7 + skill rule |
| AF-23 | Decision archived but related follow-up user prompts not captured | §9.archive_config record discipline |
| AF-24 | `recommended_artifacts[].body_hash` present but does not match sha256(body) | renderer auto-check + warn |
| AF-25 | `recommended_artifacts[].line_count` present but does not match `body.split('\n').length` | renderer auto-check + warn |
| AF-26 | Code/config/patch artifact missing `language` hint when `body` is a non-trivial code block | renderer SHOULD-warn + adopter discipline |

---

## 7. IR-driven Rendering Pipeline

```
LLM  ──emits──►  HyperbriefIR (JSON, schema-validated)  ──renderers──►  brief.md   (deterministic, ADR-compatible)
                                                       └─renderers──►  brief.html  (deterministic, interactive)
```

Renderers are pure functions: same IR → same output. The LLM never produces MD or HTML directly. This is the single defense against MD/HTML drift.

**Internal generation pipeline** (per-turn, not single-shot):
1. Compute escalation 4-score → route.
2. If FULL_HYPERBRIEF: generate §1 + §6 (frame + decision prompt).
3. Generate §2 + §3 + §4.
4. Generate §5 (the heavy section).
5. Generate §7.
6. Generate §8 as a function of §7 (cite node IDs).
7. Self-critique: identify 3 omissions; patch IR.
8. Validate IR against schema; if fail, retry the failed section.
9. Render MD + HTML deterministically.

---

## 8. Constellation Integration

Hyperbrief uses Constellation's A2A channel for delivery and ack tracking. Two envelopes ship as a pair:

- `CUSTOM/DECISION_REQUEST` — routing + ack semantics (small envelope).
- `CUSTOM/HyperbriefCard` — full IR + rendered MD permalink + HTML inline (base64).

### 8.1 New A2A intent names (add to Constellation §13.16.9 allowlist)

| Name | Direction | Purpose |
|---|---|---|
| `DECISION_REQUEST` | main → user-board | initial brief delivery |
| `DECISION_RESPONSE` | board → main | user's chosen meta-branch + pre-mortem text + irreversibility acceptance |
| `DECISION_DEFER` | board → main | user deferred; new revisit date |
| `DECISION_REJECT_FRAMING` | board → main | user rejected the frame entirely; reason + reframing hint |

### 8.2 Ack 3-tier extension

Constellation's existing tiers (`received` / `acknowledged` / `processed`) extend with a Hyperbrief-specific application tier:

- `received` — server hop reached (transport ack).
- `acknowledged` — board has rendered the card.
- `decided` — user has cleared the active-choice gate and POSTed the decision receipt.

`a2a_wait_ack(msgId, tier='decided', timeoutMs)` (Constellation MCP) MUST recognize the new tier (Phase 2 work).

### 8.3 Non-conformant adopter fallback (§13.16.12 Pattern 7)

If the adopter doesn't recognize `HyperbriefCard`, it falls back to `TEXT_MESSAGE`. Hyperbrief prepends a standard prefix line so the fallback is still useful:

```
[Hyperbrief decision required | id=hb-20260603-a1b2c3 | reversibility=one_way(red) | deadline=2026-06-10T18:00Z | link=<md_permalink>]
```

### 8.4 Decision ledger (Constellation `state.json` extension)

A top-level `decisions[]` array tracks `{decision_id, status, card_msg_id, reversibility_class, deadline, decider, outcome_chosen, user_premortem, revisit_date, parent_decision_ids, ledger_pointer}`. New SSE endpoint `/api/decisions/stream` broadcasts revisit-date arrivals + parent invalidations.

---

## 8.5 Constellation autonomous-execution layer — relation to §13.17 / §13.18 (v0.5.2 — bundle 008 M4)

Constellation defines two autonomous-execution discipline sections that share surface with Hyperbrief's escalation gate; the three sections compose without overlap once the boundaries are named.

- **`Constellation.md §13.17` (main-chat structured-choice forbidden)** — main chat MUST NOT emit structured choices (multi-option questions, numbered alternatives) as the agent's first move; the operator's first chat message expects free-form intake, not a forced menu. **Relation to Hyperbrief**: Hyperbrief's trigger rubric (§2) and its FULL_HYPERBRIEF output are NOT structured choices in §13.17's sense — they fire only AFTER the agent has formed a substantive proposal, surface the *recommended* path with confidence, and expose the meta-branch (accept / reject_framing / defer / request_investigation) as a *voluntariness affordance*, not as a forced menu. §13.17 forbids "what do you want to do — A, B, or C?" on first contact; Hyperbrief produces "I recommend X with confidence 0.78 — here is the brief, accept / refuse / defer / investigate as you prefer." The §13.17 rule and the Hyperbrief rubric are **complementary**: §13.17 covers the first-move surface, Hyperbrief covers the substantive-proposal-then-escalate surface; they cover different turn positions.
- **`Constellation.md §13.18` (autonomous-execution absolute principle)** — defined-next-step work (Phase ordering, planned-track items, blocked-clearance, in-order retire) MUST proceed without confirmation; gating fires only on (a) loss / external publish, (b) new major branch decision-point (RRP / design — at the decision point only), (c) restart-requiring deploys (coordinate timing only), (d) explicit user steering. **Relation to Hyperbrief**: §13.18's four gating conditions are the same conditions that map to Hyperbrief's MUST-trigger conditions (§2.2) — irreversibility ≥ 2 / cross-module blast / external-consumer notification / resource threshold / supersession of parent decision. §13.18 is the *general autonomous-execution principle* (proceed unless one of these fires); Hyperbrief is the *structured-brief discipline applied when §13.18 says "this one fires"*. The two are NOT alternatives — §13.18 governs whether to ask, Hyperbrief governs how to ask once the answer is "yes, ask". Adopters who already comply with §13.18 do not need to re-evaluate the gating logic at the Hyperbrief layer; the trigger-check rubric carries the same conditions in operational form.
- **Boundary summary**: §13.17 = first-move surface (no forced menus on contact). §13.18 = autonomous-execution principle (gating conditions enumerated). Hyperbrief = post-§13.18-pass structured brief (output discipline once gating fires). The three sections cover disjoint surfaces; adopting all three is consistent and non-redundant.

## 9. Superscalar Integration — orthogonal gates, serial evaluation

Hyperbrief and Superscalar are **orthogonal gates** evaluated **serially** at every fan-out decision and at every write/deploy/send action:

- **Superscalar** asks: "is this fan-out worth the cost?"
- **Hyperbrief** asks: "does this require user delegation?"

Read-only lanes are **exempt** from Hyperbrief by construction (no side effects). Write/deploy/send lanes that pass Superscalar's cost-benefit gate enter Hyperbrief's escalation check. If `FULL_HYPERBRIEF`, the lane is **paused** (Constellation `DECISION_REQUEST` in flight) while sibling reversible lanes continue under Superscalar latency-hiding. **Multi-lane batching** — Superscalar's `lane_manifest.sibling_lanes` lets Hyperbrief emit a single card with sibling lanes as MCDA alternative rows, preventing decision-flood. The Superscalar **retire stage** feeds Hyperbrief **§9 Decision Capture** automatically, closing the cross-module learning loop.

### Pseudocode

```
on fan_out_request(intent, lanes):
  if not superscalar.cost_benefit_gate(intent, lanes): return RUN_INLINE
  for lane in lanes:
    if lane.class == 'write' and lane.action in IRREVERSIBLE_ALLOWLIST:
      verdict = hyperbrief.trigger_check(lane.intent)
      if verdict == FULL_HYPERBRIEF:
        superscalar.pause_lane(lane)
        emit DECISION_REQUEST + HyperbriefCard for lane
        await ack_tier='decided' or timeout
        switch user_outcome:
          case reject_framing: superscalar.cancel_lane(lane)
          case defer:          superscalar.queue_lane(lane, defer_until)
          case accepted:       superscalar.resume_lane(lane)
          case investigate:    superscalar.spawn_research_lane(lane)
  superscalar.dispatch(lanes)
```

---

## 10. Normative Rules — MUST / SHOULD summary

### 10.1 MUST

1. Every user-facing decision question MUST first pass `hyperbrief-trigger-check`.
2. `escalation_sum < 4` AND no MUST-trigger → AUTONOMOUS_DECIDE; brief generation is blocked.
3. §0 Decision Header MUST declare all 8 fields (escalation · reversibility_class · rapid · cynefin_domain · decision_lineage · deadline · reading_minutes · stake).
4. Every fact-assertion in IR string fields MUST carry an epistemic tag `[verified|inferred|assumed|unknown]`.
5. `§4b.must_have ≥ 2`, `§4c.hidden_assumptions ≥ 3`, `§4d.rejected_alternatives ≥ 2` (or forcing-function justification).
6. `§5` MUST contain all 7 blocks (framing matrix · reversibility panel · MCDA · pre-mortem · stakeholder · null-option cost · Toulmin).
7. Natural-language probability words are FORBIDDEN; numerical CI required.
8. §7 MUST include meta-branch (4 options) + root nodes (3 standardized) + Cynefin-adaptive domain format.
9. §8 MUST cite ≥ 1 `§7` node ID; MUST include falsification trigger; MUST include reversible_fallback or set `i_accept_irreversibility_required`.
10. `reversibility_class == one_way` → HTML active-choice gate ("I accept irreversibility" checkbox) MUST be required before decision receipt POST.
11. User pre-mortem text input MUST be required before decision confirmation (active-choice gate).
12. §9 Decision Capture MUST register revisit_date + ledger_pointer at emit time.
13. LLM MUST NOT emit MD or HTML directly; output is JSON IR only. Renderers are pure functions.
14. Constellation `DECISION_REQUEST` + `HyperbriefCard` MUST be emitted as a pair; non-conformant adopter fallback uses prefixed `TEXT_MESSAGE`.
15. Pre-send probe (Constellation §13.16.10) MUST run before emit; supersession by inbound DEFER / REJECT_FRAMING MUST abort the emit.
16. §0 `audience_profile` MUST be present with all 3 axes (`audience`, `abbreviation`, `jargon`) each within `1..5`. Default is `{2, 2, 2}` when not overridden.
17. The 3 tone axes MUST remain orthogonal — renderers MUST NOT collapse them into a single complexity score (§5.6.4).
18. **Recommendation artifact disclosure** — when §8 `recommendation_conditional.recommended` references an artifact the user must inspect to decide (a patch, a code change, a spec edit, a design), the IR MUST include the artifact body in `§8.recommendation_conditional.recommended_artifacts[]`. Each artifact carries `{artifact_type, target_file, target_anchor, body, rationale_one_line}`. Surface rendering MUST present the artifact body inline (or, for HTML, in an always-expanded panel — NOT progressive disclosure) so the reader sees what they are voting on without an extra click. Closes AF-20 and the structural failure surfaced by dogfood Entry 01.
19. **Tone-floor fallback affordance + auto-localize** (§5.6.7) — HTML briefs at any profile MUST surface a single-click button re-rendering at `{1, 1, 1}`. The skill (LLM composing the IR) MUST populate `audience_profile_fallback.button_label` AND `audience_profile_fallback.trigger_phrases_md` in the user's prevailing conversation language at IR-emit time (the LLM knows this from the surrounding context). Schema and renderer defaults (`"뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)"` + Korean-only trigger list) are the last-resort fallback for IR-direct-call / programmatic / test invocations only — in skill-driven flow this fallback MUST NOT surface. Adopters MAY pin a hard override in `.hyperbrief/profile.json` to fix a single language for their reader-base. MD briefs MUST regenerate at floor profile when the user response matches `audience_profile_fallback.trigger_phrases_md` before attempting any other answer.
20. **`recommended_artifacts[].body_hash` + `.line_count` auto-stamping** (v0.5) — the renderer MUST auto-stamp these two sub-fields when absent (computed as `sha256(body)` lowercase hex and `body.split('\n').length` respectively). When present-but-stale (hash/count does not match the current body), the renderer MUST emit a warning (AF-24/AF-25) without overwriting the IR's stored values — the discrepancy is the actionable signal. `language` is RECOMMENDED for code/config/patch artifacts (AF-26 is SHOULD-only).
21. **`surface_profile_estimate` AF-18 declared-vs-effective drift warning** (v0.5) — the renderer MUST populate `§0.surface_profile_estimate` from the rendered surface, compute the gap against the declared `audience_profile`, and emit a warning (AF-18) when `|declared - estimate| >= 2` on any axis. The estimate MUST NOT auto-override the declared profile; the warning is informational and drives operator/LLM reconciliation, not silent reprofiling.

### 10.2 SHOULD

1. Generation pipeline SHOULD be staged (escalation → §1+§6 → §2-§4 → §5 → §7 → §8=f(§7) → self-critique → IR → render). Single-shot 8-section generation is discouraged.
2. HTML default view SHOULD show §0+§1+§5+§6+§7 expanded; §2/§3/§4/§8 progressive disclosure. Type-1 (one-way) decisions SHOULD default §8 expanded.
3. Telemetry SHOULD track user_acceptance_rate, average decision time, pre-mortem input length, epistemic tag distribution.
4. Brief header SHOULD display "이 질문에 답하지 않아도 됩니다 — 거부/보류/재구성 옵션이 §7 메타 분기에 있습니다" (visualize voluntariness per Floridi).
5. Renderers SHOULD surface a tone-profile chip near §0 (`A2·B2·J2`) so the reader can recalibrate one axis without re-rendering all three. Adopter project may bind `.hyperbrief/profile.json` for per-project defaults.
6. When `abbreviation ≥ 3`, body prose SHOULD be bullet-first; when `abbreviation ≤ 2`, body prose SHOULD be sentence-first. Epistemic tag surface form follows §5.6.6.
7. When `jargon ≤ 2`, every first use of a domain term (RAPID, Cynefin, MCDA, Toulmin, blast radius, idempotent, etc.) SHOULD carry a 1-line gloss; when `jargon ≥ 4`, glosses SHOULD be omitted to avoid condescension.
8. **Module-level dogfood ledger SHOULD live in an external file**, not inside the SSoT body — keep §11.2 to a recent-N-row index + pointer; full ledger at `_proposals/<bundle>/dogfood-ledger.md` (human) and/or `.agent/_decisions/<module>-ledger.jsonl` (machine, append-only). Reason: spec body and operational telemetry are different layers; mixing them inflates the SSoT, contaminates `git log Hyperbrief.md`, and destabilizes the hash external adopters pin against.

### 10.3 Phase 1 transition rules — renderer-absent fallback

`Hyperbrief.md` v0.1 ships skills + schema + templates but the deterministic Node renderers (`renderer-md.cjs` / `renderer-html.cjs`) land in v0.4.0 (Phase 2). Between v0.1.x and v0.4.0 the renderer is a known gap, and the LLM operates in **template-substitute mode**:

1. **IR-first invariant holds**: the LLM still emits the full `HyperbriefIR` JSON and persists it to `.agent/_decisions/<id>.json` before composing any user-facing surface.
2. **Template substitution**: the LLM reads `templates/brief.md.template` (and `brief.html.template` when an HTML artifact is requested) and substitutes `{{var_name}}` placeholders from the IR. Free-form MD/HTML composition that bypasses the template is **forbidden** (this is the same load-bearing constraint as §AF-11 IR-only emit).
3. **Drift-detection telemetry**: every Phase-1 emission appends one row to `.agent/_decisions/_drift-log.jsonl` with `{decision_id, ir_hash, render_token_count, manual_edit_distance_estimate}`. The hash + token count let Phase-2 renderer commissioning verify reproducibility against historical Phase-1 outputs.
4. **Tone profile honored in template mode**: the templates' default rendering matches `audience_profile = {2, 2, 2}` (§5.6.5). For overrides, the LLM re-renders the same IR by applying §5.6 axis rules at the placeholder-substitution step (NOT by regenerating IR text).
5. **Self-throttle stays active**: §2.4 alert-fatigue circuit breaker applies in Phase 1 as in Phase 2 — Phase-1 absence of deterministic rendering is NOT a justification to defer self-throttle telemetry.

When Phase 2 ships (v0.4.0) the renderer reads the same IR and produces the same Markdown / HTML modulo the tone-profile axes. The drift-log is the contract that verifies this.

**v0.4.0 status (2026-06-03 update)**: Phase 2 renderers shipped — `plugins/hyperbrief/renderers/mini-engine.cjs` (self-engineered placeholder substitution + ajv schema validation + 3-axis tone transform + determinism guarantee) + `bin/render.cjs` (CLI entry point) + `types.d.ts` (interface declarations) + `package.json` (single dep `ajv ^8.17.0`). MCP tool exposure (`hyperbrief_render`) deferred to v0.4.1 (separate cut). The transition rules above are **retained as historical record** (not deprecated) for three reasons: (a) renderer ship does not force simultaneous external-adopter migration, so the fallback discipline retains value; (b) Phase 1 operational experience captured in the body remains the basis for justifying future schema evolution; (c) `drift-log`'s semantics naturally evolve from "Phase 1 reproducibility anchor" to "Phase 1 template-substitute output vs Phase 2 renderer output backwards-compat regression check". **From v0.4.0 onward**, new briefs SHOULD use the mini-engine renderer; template-substitute fallback applies only in renderer-absent environments (Node <18, ajv not installed, sandboxes that disallow `require`).

---

## 11. Adoption — versioning + dogfood ledger

### 11.1 Adoption path (EG)

- **v0.1.0 (this draft)** — `Hyperbrief.md` SSoT + `plugins/hyperbrief/` Phase 1 (2 skills + IR schema + 2 renderers + 2 templates + hooks placeholder).
- **v0.2.0** — Constellation `DECISION_REQUEST/RESPONSE/DEFER/REJECT_FRAMING` + `HyperbriefCard` allowlist + ack_tier='decided' application-tier extension shipped at Constellation `version: v2.3.20` (EG cut v2.5.27); `a2a_wait_ack` MCP tool recognition of the new tier is queued under v0.4.2 follow-up.
- **v0.3.0** — Superscalar interlock shipped at Superscalar v0.4.1 (Superscalar.md §3.1 — orthogonal gate, serial evaluation; write/deploy/send lanes that pass cost-benefit gate also enter hyperbrief-trigger-check; read-only lanes exempt; multi-lane batching emits a single HyperbriefCard with sibling lanes as MCDA rows). EG cut v2.5.29.
- **v0.4.0** — Phase 2 deterministic Node renderer shipped (`plugins/hyperbrief/renderers/mini-engine.cjs` + `types.d.ts` + `bin/render.cjs` + `package.json` with single dep `ajv ^8.17.0`); determinism smoke test PASS. PreToolUse hook + MCP server deferred to v0.4.1+ cuts.
- **v0.4.1** — `§11.2` dogfood ledger externalized from SSoT body (layer separation per `§10.2 SHOULD-8`); `§5.6.7` / `§10.3` / `§11.3` prose English-normalized.
- **v0.4.2** — Constellation cascade shipped (Constellation v2.3.20: `§13.16.9` A2A-intent family 5 names + `ack_tier='decided'` application-tier extension; Constellation MCP server `a2a_wait_ack` recognizes `tier='decided'`). MCP server shipped (`plugins/hyperbrief/mcp/server.cjs` + `package.json`, single dep `ajv ^8.17.0`, exposes 4 tools `hyperbrief_render` / `hyperbrief_validate` / `decision_ledger_append` / `decision_ledger_query`); plugin manifest declares the MCP server. PreToolUse hook (decision-keyword detection auto-triggers rubric) deferred to v0.5.
- **v0.6.0** — Substantive 4-slot additive cut (EG cut v2.5.62, 2026-06-06): four new optional schema slots ratified from v2.5.53 cycle's v0.6 candidates register — (1) `§8.recommendation.recommended_methodology[]` (methodology bundles the recommendation was evaluated by — `{id, name, version?, anchor_path, applicability[]?, rationale_one_line}`; self-application: §11.5 readiness-rubric briefs MUST populate this slot); (2) `§0.decision_header.evaluation_lenses[]` (multi-lens scoring slot for same decision target under different dimension sets — `{id, name, dimensions[], threshold_simple_mean?, threshold_weighted_mean?, current_simple, current_weighted, verdict, methodology_ref?, rationale_one_line?}`; first self-application: §11.5 Lens A 7-dim vs Lens B 6-dim); (3) `FullBrief.maturity_anchor` (top-level optional anchoring slot for arbitrary maturity labels — `{claimed_label, anchor_methodology, current_score, threshold, gap_analysis, verdict?}` — forces the IR author to reference an anchored methodology + state thresholds + provide tagged gap analysis); (4) `§0.audience_profile_fallback.term_pairing` (surface-display policy + scope + retroactive-apply axis — `{mode: E/I/N, scope: [C/D/B/R], retroactive_apply: Y/N/prompt}` with low-frequency override (≤ 3 occurrences pair every time even under `I`) and C-scope auto-non-retroactive structural rule; short-command form `Lx.M.S+S! / Lx.M.S?` parses skill-side). All 4 slots are optional — existing v0.5.6 IRs validate unchanged against v0.6 schema. Implementation footprint: schema `881 lines` (+ 4 slot definitions); `mini-engine.cjs` `454 → 856 lines` (+ 4 slot renderers, MD + HTML twins, `buildV06Sections` / `buildV06SectionsHtml`, `applyTermPairing` post-processor, minimal default term dictionary, determinism verified, back-compat verified); brief.md.template `366 → 425 lines` (+ 4 conditional Handlebars-style blocks); brief.html.template `755 → 989 lines` (+ 4 id-based DOM slots + hydration JS); brief-stub MD + HTML templates extended (term_pairing surfaced inline on blocked-stub); 3 skills (`hyperbrief` / `hyperbrief-trigger-check` / `hyperbrief-revisit`) updated to version `0.6.0` with v0.6-slot awareness, audience-profile command routing (`Lx.M.S`), and v0.6-back-compat detection on revisit. Workflow fan-out mezzo batch ratification pattern: 7 parallel implementation agents (schema + renderer + 4 templates + 3 skills), 1 ratification agent (this entry + triage close). v0.6 candidate register snapshot post-ship: 4 ratified + 3 v0.7+ pending. Closes the v2.5.53 cycle's accumulated v0.6 candidates.
- **v0.5.6** — Tone-floor fallback auto-localize discipline codified (EG cut v2.5.41): §5.6.7 HTML-surface bullet rewritten to require skill-side population of `audience_profile_fallback.button_label` AND `audience_profile_fallback.trigger_phrases_md` in the user's prevailing conversation language at IR-emit time; schema and renderer defaults (Korean literals) demoted to last-resort fallback for IR-direct-call / programmatic / test invocations only — in normal skill-driven flow the Korean fallback MUST NOT surface for non-Korean users. Reference literals named for EN / KO / JA in §5.6.7. MUST-19 rewritten to fold in the auto-localize discipline as normative. `plugins/hyperbrief/skills/hyperbrief/SKILL.md` `audience_profile_fallback` row in section 1 extended with explicit reference EN/KO/JA literals + trigger lists. docs/promo (`docs/index.html` Hyperbrief card general-tier + `docs/hyperbrief.html` general-tier overview) updated to show both EN and KO button literals side-by-side with a "follows the user's language" / "사용자 언어에 따름" parenthetical. Closes the design conflation flagged by user on 2026-06-03 where the v0.5.0 "canonical EG default = plain Korean; adopters localize" framing made the Hyperbrief library appear language-hardcoded when in practice the skill knows the user's language and can populate accordingly.
- **v0.5.5** — v1.0 readiness rubric codified per dogfood Entry 04 (EG cut v2.5.40): new §11.5 introduces two evaluation lenses (Lens A 7-dim module-wide GA + Lens B 6-dim host-specific marketplace registration) with explicit dimension definitions, anchored scoring scale, dual aggregation (simple + weighted mean), current-state assessment (Lens A 5.3 simple / 4.9 weighted; Lens B 5.5 simple / 5.1 weighted — neither at threshold), gap analysis converging on emergency-fix cadence + external adopter validation as the binding constraints, and a re-evaluation cadence (≥ 2-point dimension move OR emergency-fix release OR explicit decision-point trigger). The rubric closes the failure mode where v1.0 GA label remained maintainer-arbitrary and where host-specific registration decisions were gated on cross-host validation without causal relevance. Entry 04 dogfood archive records the marketplace-registration deferral decision driven by the rubric's current scores (both lenses sub-threshold).
- **v0.5.4** — H7 emergency-fix (EG cut v2.5.38) per bundle 008 002 resync report: `mini-engine.cjs` `renderMd` / `renderHtml` reordered to validate-on-canonical-IR → deep-clone → strip-on-clone (previously strip-then-validate crashed every FullBrief in the validation-on default path because schema requires the §6.essence_one_line tagged_text prefix that the strip removed). IR original now invariant across rendering; archive_config sees pristine IR; surface still ships without the H1 heading bracket prefix. Same-class regression as H1 (clean-install validation-on path broken); fix is one ordering swap + one deep-clone insertion per render entrypoint. Adopter guidance added: §11.3 vendor-patch-vs-pure-mirror trade-off (turnaround-time-driven choice); §11.4 host self-config approval gate (settings.json edit requires user approval, not silent migration) + `$CLAUDE_PROJECT_DIR` vs `${CLAUDE_PLUGIN_ROOT}` for plugin-vs-sidecar deployments.
- **v0.5.3** — PreToolUse + Stop hooks activated (EG cut v2.5.37) in advise mode (exit 0 + stderr alert; never block). PreToolUse matchers: `AskUserQuestion` (always alert) + `Bash` (write/deploy/send whitelist via wrapper script — `git push` / `gh release` / `gh pr create|merge` / `npm publish` / `kubectl apply|delete|create` / `docker push` / `terraform apply` / etc.). Stop hook: scans `hyperbrief-ledger.jsonl` for `revisit_date` arrivals + scans `.hyperbrief/pending-reviews/` for unreviewed items + emits a single advisory line on either signal. **Review queue routing** (§11.4 below): when Constellation is reachable (`CONSTELLATION_WS_URL` + local outbox.jsonl), the hook posts a `DECISION_REQUEST` envelope to the board as a pending review item (the full `HyperbriefCard` follows when/if the agent generates the brief); when Constellation is off, behavior depends on `auto_generate_review_doc` config (`on` → write `.hyperbrief/pending-reviews/<id>.md` placeholder, `off` → stderr alert only, `ask` (default) → stderr alert + setup hint). All three cuts (advise/board/file) compose with the existing model-invoked `SKILL.md` description discipline — the hooks add a *silent-skip detection layer* without removing the agent's self-invoke responsibility. The Phase 2 PreToolUse-hook item from the v0.4.0 status entry is hereby closed.
- **v0.5.0** — schema v0.5 shipped (EG cut v2.5.30): `surface_profile_estimate` auto-computed by renderer with AF-18 declared-vs-effective drift warning; `recommended_artifacts[]` gains `language` / `line_count` / `body_hash` sub-fields (auto-stamped by renderer); `audience_profile_fallback.telemetry` opt-in phrase-learning structure; canonical `button_label` parenthetical universalization for adopter localization; new normative MUST-20 / MUST-21; new anti-patterns AF-24 / AF-25 / AF-26. Determinism invariant preserved (smoke test PASS post-additions). Dogfood ledger §11.2 Entry 03+ for real-case calibration (`user_acceptance_rate`, Brier score, pre-mortem text length distribution) is the v0.5 *measurement* track and remains in-progress.

### 11.2 Dogfood ledger — external file (layer separation)

The operational dogfood ledger is **not** accumulated inside this SSoT body. Spec body (normative, externally cited, low-change-frequency) and operational telemetry (descriptive, appended every entry, high-change-frequency) belong on separate layers; mixing them inflates the SSoT, contaminates `git log Hyperbrief.md` with operational noise, and destabilizes the hash that external adopters pin against.

Ledger storage (two canonical surfaces):

- **Canonical human-readable**: `_proposals/006_2026-06-03_hyperbrief/dogfood-ledger.md` — bundle-tracked, all Entry rows + per-entry meta-learnings summaries, this is the durable record.
- **Machine-readable stream (optional)**: `.agent/_decisions/hyperbrief-ledger.jsonl` — append-only one-row-per-line, adopter tooling friendly (gitignored under EG's workspace-cleanliness rule; reproduce locally as needed).

SSoT body keeps only the most recent 3 rows as a pointer + index:

| Recent entries | Decision id | Date | Outcome |
|---|---|---|---|
| Entry 04 | `hb-20260603-mktp04` | 2026-06-03 | Claude marketplace registration defer to v1.0 GA + §11.5 v1.0 readiness rubric codified (Lens A 7-dim + Lens B 6-dim, current scores ≈ 5/10 both lenses, gap binds on emergency-fix cadence + external adopter validation) |
| Entry 03 | `hb-20260603-hooke3` | 2026-06-03 | Advise-hook activation accept (alt-(a) PreToolUse + Stop + review-queue routing extension; closes the v0.4.0 deferred PreToolUse-hook item) |
| Entry 02 | `hb-20260603-r2nd02` | 2026-06-03 | Phase 2 renderer accept (alt-B mini-engine + ajv + CLI; MCP tool deferred to v0.4.1) |

Full ledger + Entry meta-learnings: `_proposals/006_2026-06-03_hyperbrief/dogfood-ledger.md`.

### 11.3 Cross-seed adoption — EstreUF + other EG-seed forks

Hyperbrief is one of several EG seed modules. Adopters that maintain a fork of the EG seed (notably **EstreUF**, the user-facing application derived from the 2026-05-07 seed v1.5) MAY import `Hyperbrief.md` + `plugins/hyperbrief/` into their own SSoT layer, observing the following adapter discipline:

- **`decision_id` namespace** — adopters MUST prefix `decision_id` with a project token. EstreUF uses `hb-uf-YYYYMMDD-xxxxxx`; EG itself uses `hb-eg-…`. (The unprefixed `hb-` form is a deprecation candidate; v0.1.1 Entry 01 retains the unprefixed form for backward compatibility.) The schema's `decision_id` pattern accepts this extension via adopter opt-in (project token replaces the `hb-` prefix).
- **Ledger isolation** — each adopter project maintains its own `.agent/_decisions/` directory. Cross-project aggregation is an explicit opt-in step (e.g., a shared dashboard reading both project ledgers).
- **Shared A2A intent names** — adopters using Constellation share the same five intent names (`DECISION_REQUEST/RESPONSE/DEFER/REJECT_FRAMING` + `HyperbriefCard`). Routing is by `targetAgentId`, not by namespace.
- **Schema version pinning** — adopters MUST declare which `hyperbrief.schema.json` major version they pin via one line in their adopter README, so cross-project ledger reads can apply the correct validator.

EstreUF dogfood ledger entries are recorded in EstreUF's own `_proposals/<bundle>/hyperbrief-ledger.md`. Entries that surface cross-cutting spec gaps (changes that should land in upstream `Hyperbrief.md`) are mirrored back to EG through the standard `_proposals/` lifecycle.

**Vendor patch vs pure mirror — adopter sync trade-off (v0.5.4, bundle 008 002 reflection)**: when a clean-install blocker is discovered (H1 / H7 / etc.), an adopter has two options for bridging the gap until upstream fixes it: (a) **vendor patch** — apply a local fix inside the vendored copy and continue running validation-on; (b) **pure mirror + workaround** — keep the vendored copy byte-identical to upstream and use a flag (e.g., `--skip-validate`) to bypass the broken default path until the upstream fix lands. The right choice depends on the *expected upstream turnaround time*: bundle 008 measured ~1 hour from report to fix for the EG-owner-as-adopter case (author-direct operation), so the second time a blocker surfaced (H7), the adopter chose pure-mirror-plus-workaround instead of vendor-patch, because a vendor patch applied at hour 1 becomes redundant by hour 2 and adds sync-debt for every subsequent rebase. Adopters running against a slower-turnaround upstream (independent fork, third-party seed mirror, sealed-release vendor) should default to vendor patch instead — the workaround cost compounds across the longer window. Either way, the choice should be **explicit in the adopter's project notes** so future contributors know whether the local diff is intentional drift or a temporary workaround.

### 11.4 Hook-tier review queue (v0.5.3 — Claude Code plugin-tier discipline)

The `plugins/hyperbrief/hooks/` directory ships with three components: `hooks.json` (the Claude Code hook registration), `trigger-advise.cjs` (the PreToolUse wrapper), and `revisit-scan.cjs` (the Stop wrapper). The hook layer is **plugin-tier** — a Claude Code-specific advise mechanism that adds a *silent-skip detection layer* on top of the `SKILL.md`-frontmatter model-invoked discipline. Other Claude-compatible hosts (Codex, Cursor, etc.) lack the PreToolUse hook concept and rely on the model-invoked discipline alone; the SSoT-tier rules in `Hyperbrief.md §1–§10` remain identical across all hosts.

**Hook contract** (advise mode — exit 0, never block):

- **PreToolUse `AskUserQuestion`** → always alert. The canonical user-facing-decision-question signal.
- **PreToolUse `Bash`** → alert only when the command matches a write/deploy/send whitelist (`git push`, `gh release`, `gh pr create|merge`, `npm publish`, `pnpm publish`, `yarn publish`, `kubectl apply|delete|create`, `docker push`, `terraform apply`, `gcloud …deploy`, `aws s3 cp|sync` etc., plus `curl -X POST|PUT|DELETE`). Routine Bash calls (`ls`, `cat`, `grep`, etc.) silently pass through.
- **Stop (tone, v0.7.0)** → `tone-estimate.cjs`: while `.hyperbrief/active-profile.json` is armed, deterministic 6-heuristic declared-vs-effective tone drift advisory on the last response (see §5.6.7-pre post-response tier). Zero-cost when unarmed.
- **Stop** → scans the decision ledger for `revisit_date ≤ today` (excluding rows with `outcome_actual` already filled) and scans `.hyperbrief/pending-reviews/` for unreviewed placeholders. Emits a single advisory line on either signal; silent otherwise.

**Review-queue routing** — what happens when a PreToolUse hook fires:

1. **Constellation reachable** (`CONSTELLATION_WS_URL` env set + a local `outbox.jsonl` path exists at one of: `$CONSTELLATION_OUTBOX_PATH`, `assets/collab/outbox.jsonl`, or `.constellation/outbox.jsonl`):
   - The hook appends a `DECISION_REQUEST` envelope to the outbox file. The envelope is a *pending-review placeholder* — it carries `decision_id`, `origin: "hyperbrief-hook"`, `pending: true`, `detected_tool`, `detected_intent`, `stage: "pending-review"`, `ack_tier_required: "decided"`. The full `HyperbriefCard` follows (paired by `parentId`) when/if the agent generates the actual brief — same envelope-pair design as §8 + Constellation §13.16.9.
   - The local Constellation bridge (`local-bridge.cjs`) relays the envelope to the board, and the board's decisions/review-items panel surfaces it.
   - Stderr advise: `[hyperbrief] 결정 시점 감지 (<tool>) — 검토 사안이 Constellation 보드에 등록되었습니다 (id: hb-…). 보드의 검토 사안 패널에서 확인 가능.`

2. **Constellation off** + `auto_generate_review_doc = "on"` (env `HYPERBRIEF_AUTO_GENERATE_REVIEW_DOC=on` or `.hyperbrief/config.json {auto_generate_review_doc: "on"}`):
   - The hook writes a placeholder Markdown file to `.hyperbrief/pending-reviews/<decision_id>.md` carrying the detected tool, intent, raw tool input (clipped to 4KB), and next-step instructions (request full brief now / leave for later review / archive after review).
   - Stderr advise: `[hyperbrief] 결정 시점 감지 (<tool>) — 검토 사안 문서 자동 생성됨: <path>.`

3. **Constellation off** + `auto_generate_review_doc = "ask"` (default): stderr advise only — `[hyperbrief] 결정 시점 감지 (<tool>). 검토 사안 문서 자동 생성을 켜시려면 .hyperbrief/config.json의 auto_generate_review_doc를 "on"으로 설정하세요. 현재 설정: "ask".`

4. **Constellation off** + `auto_generate_review_doc = "off"`: simple stderr alert, no file emitted.

**Why advise mode (not hard-block)**: §2.4's alert-fatigue circuit breaker exists precisely because a rubber-stamped Hyperbrief is a degenerate Hyperbrief. A hard-block hook would force every `AskUserQuestion` and every dangerous Bash call through a user confirm step — exactly the alert-fatigue path §2.4 is designed to prevent. Advise mode preserves the agent's responsibility (model-invoked self-invoke per `SKILL.md` description) while adding a *signal-of-silent-skip* layer: when the agent forgets to invoke `hyperbrief-trigger-check`, the hook leaves a visible trail (board review item, file placeholder, or stderr line) so the user can surface the gap rather than have it carry forward invisibly.

**Falsification triggers**:

- First-day hook fire count exceeds 10 → matcher scope too broad → tighten the Bash whitelist.
- One-week hook fire count is zero while user-facing decision-question samples are accumulating → matcher scope too narrow OR the hook is silently failing → check stderr propagation in the Claude Code host.
- Three or more consecutive board review items languish past their revisit_date without resolution → the Stop hook's advisory line is being ignored → consider adding a `notify-on-revisit` opt-in that escalates after N days.

**Cross-reference**: Constellation `§13.16.9` for the `DECISION_REQUEST` A2A-intent shape; Constellation `§13.16.10` for the pre-send probe discipline (the hook's emit goes through the same outbox that the probe scans); Hyperbrief `§8` for the `DECISION_REQUEST` + `HyperbriefCard` envelope-pair pattern that the hook plugs into.

### 11.5 v1.0 readiness rubric — two evaluation lenses (v0.5.5, dogfood Entry 04 reflection; v0.6.0 self-application — methodology + lenses + anchor slots)

**v0.6 self-application note**: §11.5 is the first canonical case for the v0.6 trio (`recommended_methodology[]` + `evaluation_lenses[]` + `maturity_anchor`). A future `v1.0.0` decision brief MUST populate (a) `§8.recommendation.recommended_methodology[]` with at least `{id: "hyperbrief-v1-readiness-rubric", name: "Hyperbrief v1.0 Readiness Rubric", version: "v0.5.5", anchor_path: "Hyperbrief.md §11.5", applicability: ["module-GA", "marketplace-registration"], rationale_one_line: "…"}`; (b) `§0.evaluation_lenses[]` with `[{id: "lens-a-module-ga", name: "Module-wide GA Readiness", dimensions: [7-dim ids], threshold_simple_mean: 8.0, threshold_weighted_mean: 8.0, current_simple: 5.3, current_weighted: 4.9, verdict: "below", methodology_ref: "hyperbrief-v1-readiness-rubric"}, {id: "lens-b-marketplace", …, verdict: "below"}]`; (c) `maturity_anchor` with `{claimed_label: "v1.0.0", anchor_methodology: "hyperbrief-v1-readiness-rubric", current_score: {simple_mean: 5.3, weighted_mean: 4.9}, threshold: {simple_mean: 8.0, weighted_mean: 8.0}, gap_analysis: "…", verdict: "short"}`. Before v0.6, §11.5's evaluation infrastructure had no schema-tier slots; the rubric existed only in prose. v0.6 promotes the same content to IR-citizen status — *brief-to-brief comparability* of maturity claims becomes a schema invariant rather than prose convention.

"v1.0 GA" is conventionally a maintainer-discretion label — Semver itself defines 1.0 only as "the public API is now stable", without prescribing what *stable* means. To avoid that label becoming arbitrary, Hyperbrief defines an explicit readiness rubric with **two evaluation lenses** that share most dimensions but diverge on one:

- **Lens A — module-wide GA readiness** (7 dimensions). Used to decide whether to cut a `v1.0.0` tag for the module SSoT + plugin. Includes `cross-host portability` because a module that claims "host-agnostic SSoT-tier discipline" at v1.0 should have at least one cross-host validation.
- **Lens B — host-specific marketplace registration readiness** (6 dimensions = Lens A minus `cross-host portability`). Used to decide whether to register the plugin on a specific host's marketplace (Claude Code's `claude-plugins-community`, hypothetical Cursor marketplace, etc.). Cross-host portability is structurally orthogonal to a single-host marketplace entry decision — a Claude-only marketplace listing does not depend on whether the same logic works on Cursor.

The lens-split prevents the failure mode where a single-host registration decision is gated on cross-host validation that has no causal relevance to that host's users, AND prevents the inverse — a v1.0 GA cut based on single-host validation alone that then surprises cross-host adopters when discovery starts.

#### 11.5.1 The 7 dimensions

| # | Dimension | What it measures | Scoring anchors |
|---|---|---|---|
| 1 | **Spec completeness** | Every normative rule + anti-pattern + adopter-guidance section explicit; v0.x candidate patches all closed | 0 = body half-written; 5 = all sections present with gaps; 10 = no unresolved v0.x candidate patches |
| 2 | **Schema stability** | Time since last schema major + remaining v0.x schema-candidate patches | 0 = schema major break last week + many candidates; 5 = stable for weeks + few candidates; 10 = 30+ days no-break + zero candidates pending |
| 3 | **External adopter validation** | Count + diversity of external adopters with dogfood / regression reports | 0 = no external adopter; 3 = n=1; 6 = n=2-3; 10 = n=5+ with diverse usage patterns |
| 4 | **Emergency-fix cadence settled** | Days since last emergency-fix release (blocker class) | 0 = within the day; 2 = within a week; 5 = within 2 weeks; 8 = 30 days; 10 = 60+ days |
| 5 | **Cross-host portability** *(Lens A only)* | Empirical validation on hosts other than the canonical (Claude Code) | 0 = no other host attempted; 4 = ported but unvalidated; 7 = one cross-host adopter with regression report; 10 = 2+ cross-host adopters |
| 6 | **Docs maturity** | README + spec + promo + quick-start + troubleshooting catalogue | 0 = README only; 7 = full normative SSoT + promo + adopter notes; 10 = + quick-start one-pager + troubleshooting catalogue |
| 7 | **Determinism guarantee** | Same-IR → same-output invariant verified across releases, including clean-install reproducibility | 0 = no test; 5 = smoke test passes; 8 = verified + adopter-side reproduction once; 10 = verified continuously across n≥5 adopter environments |

Lens B drops dimension #5 (`Cross-host portability`).

#### 11.5.2 Aggregation

Two complementary numbers, both reported:

- **Simple mean** — sum of dimension scores divided by dimension count. Reflects an "average preparedness" view.
- **Weighted mean** — apply per-dimension weights reflecting the dimension's load-bearing role for the lens. Canonical default weights: `Emergency-fix cadence × 2.0` (most load-bearing — a still-fluctuating module cannot be GA); `Schema stability × 1.5`, `External adopter validation × 1.5`, `Determinism guarantee × 1.5` (each is a hard-precondition class); other dimensions × 1.0. Adopters MAY tune the weights but MUST publish their chosen weights alongside the score so the result is interpretable.

A `v1.0.0` cut SHOULD require **both** means at ≥ 8.0 on Lens A. A marketplace registration on a given host SHOULD require **both** means at ≥ 7.5 on Lens B for that host.

#### 11.5.3 Current scoring (v0.5.5 — 2026-06-03)

**Lens A (module-wide GA readiness)** — 7 dimensions:

| Dim | Score | Brief evidence |
|---|---|---|
| Spec completeness | 8 | SSoT 350+ lines, 21 MUST + 8 SHOULD + 26 anti-patterns + §8.5/§11.3/§11.4 adopter sections shipped; v0.6 candidate patches enumerated |
| Schema stability | 5 | Last major: v0.6 (today, additive 4-slot cut — `recommended_methodology[]` + `evaluation_lenses[]` + `maturity_anchor` + `term_pairing`, back-compat preserved); 3 v0.7+ candidates pending (`surface_profile_estimate` technical-domain heuristic refinement + Hook post-response tone-evaluation layer + §11.4 host self-config gate guidance automation) |
| External adopter validation | 3 | n=1 external (MangoClass / bundle 008 + 002); EstreUF planned but not deployed |
| Emergency-fix cadence settled | 2 | Two blocker-class fixes today (v2.5.32 H1 ajv import + v2.5.38 H7 strip-then-validate ordering) within ~6 hours |
| Cross-host portability | 4 | SSoT-tier vs plugin-tier separation drawn (§11.4) but no Codex / Cursor adopter |
| Docs maturity | 7 | README + spec + promo + 4 dogfood archives; no one-page quick-start; no troubleshooting catalogue beyond AF-1..26 |
| Determinism guarantee | 8 | Smoke test passes across v0.4.0 → v0.5.4; verified once at bundle 008 clean-install ajv 8.x reproduction |

Simple mean: **5.3 / 10**. Weighted mean (default weights): **4.9 / 10**. Neither at the ≥ 8.0 v1.0 cut threshold.

**Lens B (Claude Code marketplace registration readiness)** — 6 dimensions (Lens A minus #5):

| Dim | Score |
|---|---|
| Spec completeness | 8 |
| Schema stability | 5 |
| External adopter validation | 3 |
| Emergency-fix cadence settled | 2 |
| Docs maturity | 7 |
| Determinism guarantee | 8 |

Simple mean: **5.5 / 10**. Weighted mean: **5.1 / 10**. Neither at the ≥ 7.5 marketplace-registration threshold.

#### 11.5.4 Gap to thresholds — what would close them

The Lens-A and Lens-B gaps converge on the same two load-bearing dimensions:

- **Emergency-fix cadence (currently 2)** needs to reach at least 5 (two weeks no-fix) to bring weighted mean over Lens B's 7.5 threshold by itself. The two-blocker day captured in v2.5.32 / v2.5.38 is the empirical anchor — the next 14 days are the first non-trivial test of fix-cadence stability.
- **External adopter validation (currently 3)** needs to reach at least 6 (n=2-3 with at least one non-EG-owner adopter beyond MangoClass). EstreUF activation is the canonical next step; one additional unrelated adopter would close most of the gap.

The other dimensions (schema stability, docs maturity, determinism, spec completeness) move forward incrementally with each cut and are not the binding constraint at present.

#### 11.5.5 Re-evaluation cadence

The rubric SHOULD be re-applied at the following events (each event triggers a new score row in §11.2 dogfood ledger or as a §6 addendum on an existing entry):

- Every release that bumps a dimension by ≥ 2 points (e.g., a new external adopter joining moves dimension #3 by 3, triggering re-score).
- Every emergency-fix release (resets dimension #4 timer, re-score even if other dimensions unchanged).
- At any explicit decision point that names the rubric (e.g., this Entry 04, or a future "ready for v1.0 cut?" decision).

The first scheduled re-evaluation is **2026-09-01** (90 days), the same date as the Entry 01-04 batch revisit per §9 archive_config defaults. Adopters running their own forks SHOULD adopt the same rubric and re-evaluation cadence so cross-project comparisons remain interpretable.

#### 11.5.6 v0.6 candidates triage register (v0.6.0 — 2026-06-06, post-ship snapshot)

The §11.5.3 *Schema stability* evidence column references the v0.7+ pending-candidate count; the full enumeration lives in `_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md` and is the operational SSoT.

**v0.6.0 ship snapshot (2026-06-06, this cut)**: 4 candidates ratified + closed, 3 candidates deferred to v0.7+.

- **v0.6 ratified + closed** (4 candidates, this cut — Workflow fan-out mezzo batch pattern):
  1. `recommended_methodology[]` — §8 recommendation slot for the rubric/framework the decision was scored under (§4 above).
  2. `evaluation_lenses[]` — §0 multi-lens scoring slot for the same decision target under different lens dimensions (§3 above; §11.5 itself is the first self-application case).
  3. `maturity_anchor` — FullBrief top-level slot tying arbitrary maturity labels (`v1.0` / `GA` / `stable`) to an anchored methodology + threshold + current-score + gap analysis.
  4. `term_pairing` — §0 AudienceProfileFallback extension with `mode` (E/I/N) + `scope` (C/D/B/R) + `retroactive_apply` (Y/N/prompt) sub-axes, plus low-frequency override (≤ 3 occurrences pair every time) and C-scope auto-non-retroactive structural rule. Short-command form `Lx.M.S+S! / Lx.M.S?` parses skill-side.
- **v0.7+ pending** (3 candidates, no status change):
  1. `surface_profile_estimate` technical-domain heuristic refinement (false-negative reduction via domain-jargon dictionary, blocked on external dictionary source).
  2. Hook post-response tone-evaluation layer (new architectural surface, blocked on Claude Code PostResponse hook timing-spec stabilization).
  3. §11.4 host self-config gate guidance automation (intentional safety gate; automation = silent injection risk, deferred pending adopter install-runbook failure evidence).

The triage doc carries per-candidate spec sketches (schema proposal, rationale, expected work size). Triage status moves are themselves dimension #2 score events per §11.5.5 cadence (≥ 2-pt move triggers re-score). This cut closes 4 of 7 pending → 3 pending — dim #2 schema-stability evidence column updated accordingly (§11.5.3).

---

**Adopter installation note — host self-config approval gate (v0.5.4, bundle 008 002 reflection)**: registering the hook with the running Claude Code session requires editing `.claude/settings.json` (or equivalent host config), which the host's auto-mode classifier treats as **agent-runtime self-modification** and blocks without explicit user approval. This is a separate gate from the general migration / file-edit flow — an adopter agent running an EG migration script CANNOT silently install the hook on the user's behalf; the user must explicitly approve the settings.json change (or the adopter project owner must commit the settings update). Adopters integrating Hyperbrief should surface this gate in their installation runbook so the operator understands that "hyperbrief plugin installed" and "hyperbrief hook connected" are two distinct steps. **`$CLAUDE_PROJECT_DIR` vs `${CLAUDE_PLUGIN_ROOT}`**: when Hyperbrief is installed as a Claude Code plugin via the marketplace, `hooks.json` references the wrapper scripts via `${CLAUDE_PLUGIN_ROOT}` (the plugin's install directory). When Hyperbrief is **vendored as a sidecar** (copy of the EG `plugins/hyperbrief/` tree into the adopter's own repo), the wrapper scripts live under the adopter's project tree, not the plugin install path; the hook command should then use `$CLAUDE_PROJECT_DIR/.hyperbrief/hooks/trigger-advise.cjs` (or wherever the adopter placed the vendored copy) for portability. The plugin-tier `hooks.json` ships with the `${CLAUDE_PLUGIN_ROOT}` form; vendored adopters MUST rewrite this when staging.

---

## 12. Versioning

`Hyperbrief.md` follows EG semver (`vMAJOR.MINOR.PATCH`). Plugin (`plugins/hyperbrief/`) tracks `Hyperbrief.md` minor version. Breaking schema changes (`hyperbrief-ir.schema.json`) bump major. Adopter contract: any tool that calls `hyperbrief_validate` MUST declare the schema major it supports.

---

*This module's principal claim: an agent's job is not to manufacture decisions for the user — it is to* **block the manufacture of decisions** *and to surface, with epistemic honesty, exactly the irreducible choice the user must make. Hyperbrief is the structural defense for that claim.*
