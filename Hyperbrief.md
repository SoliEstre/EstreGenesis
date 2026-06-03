<!-- module: Hyperbrief; layer: decision-gating; part-of: EstreGenesis 2.5.x; version: v0.1.1; date: 2026-06-03; status: design draft v0.1.1 (6-axis research + dogfood Entry 01 patches — 5 additions: §5.6 audience_profile + §5.6.7 tone fallback + §8 recommended_artifacts + §9 archive_config + §10.3 Phase 1 transition + §11.3 cross-seed adoption); depends-on: none (optional synergy: Constellation §13 A2A, Superscalar §3 cost-benefit gate); license: Apache-2.0 -->

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

**Why this comes before content.** The reader must classify the decision (reversibility · stakes · who decides · domain) in 30 seconds to route attention: skim / read carefully / escalate / defer / reject framing. Without §0, the reader scrolls into §1-§8 content with no prior — and content-first reading is exactly what framing effect exploits.

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

1. `recommendation_conditional` — `{recommended, recommended_artifacts[], assumptions[], fallback_if_assumption_violated, switch_if}`. Single unconditional assertion is forbidden. **`recommended_artifacts[]`** — each `{artifact_type: patch | spec | code | design | other, target_file, target_anchor, body, rationale_one_line}`. If the recommendation references "apply X patch" / "add Y section" / "ship Z change", `body` MUST be the actual text/code the reader is voting on. Empty `body` with a non-trivial reference is AF-20 (recommendation opacity).
2. `confidence` — `{point_estimate, ci_90_low, ci_90_high, brittleness}`. `confidence.point_estimate < 0.6` → auto-downgrade label from "recommended" to "proposal candidate".
3. `cited_tree_node_ids` — ≥ 1 node ID from §7.
4. `defeaters` — ≥ 3 conditions that flip the recommendation.
5. `pre_mortem_inline` + `reversible_fallback` (`{fallback_path, rollback_cost, trigger_conditions}`).
6. `falsification_trigger` — `{what_to_observe, when, threshold}`. Missing any of the three → validator rejects.
7. `i_accept_irreversibility_required: true` if `reversibility_class == one_way` (HTML renderer surfaces a checkbox gate).

### §9 Decision Capture

`revisit_date` (ISO8601) + `ledger_pointer` (`.agent/_decisions/<id>.json` or Constellation decision-ledger SSE id). `outcome_actual` and `outcome_vs_decision_quality_delta` are filled post-revisit by the `hyperbrief-revisit` skill.

**`archive_config`** (optional, **default `enabled: true`**) — when enabled, the decision capture step preserves a development-record archive at `.agent/_decisions/<id>.archive/` (or `_proposals/<bundle>/dogfood-entry-NN.md` for proposals-tracked decisions). The archive bundles five elements as a single load-bearing unit:

1. **`brief_original.md`** — the full brief as the user saw it (the rendered MD, with the `audience_profile` that was active at decision time).
2. **`decision.json`** — `{meta_branch_chosen, user_premortem, decided_at, decided_by}`.
3. **`related_user_prompts.md`** — every user prompt between brief emission and final decision (the prompts that shaped the decision but aren't in the brief itself — e.g., "patch 2건에 대한 사안 설명이 포함되어있는거 맞나?" type drill-downs).
4. **`recommended_artifacts_applied.md`** — for each `§8.recommended_artifacts[]` element, whether it was applied verbatim, modified, or dropped, with the actual landed text.
5. **`meta_learnings.md`** — schema gaps surfaced, anti-patterns triggered, friction reports from the LLM's self-critique.

The archive is the **load-bearing development record** — it's how Hyperbrief decisions remain auditable after months. Adopters MAY disable per-brief (`archive_config.enabled: false`) for low-value decisions, but the default is ON because the marginal cost of archival is small and the lost context after disabling is unrecoverable.

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

#### 5.6.7 Tone-floor fallback affordance

A brief rendered at any non-L1 profile MUST also expose a one-action **tone-floor fallback** that re-renders the same IR at `{audience: 1, abbreviation: 1, jargon: 1}`. The reader's path to maximal plainness must never require knowing the three-axis vocabulary.

- **HTML surface**: a permanent button at the top of the card with playful copy ("뭔 소리야? 한국어로 번역해줘" or equivalent) wired to client-side re-render. The button MUST appear regardless of the current profile (yes, even when already at L1/L1/L1 — it then becomes a no-op confirming "this IS already the plainest version"). The button label is configurable via `audience_profile_fallback.button_label`.
- **MD surface**: MD is static and has no button. Instead, the LLM monitors the user's response after delivering a brief. If the response matches `audience_profile_fallback.trigger_phrases_md` (default set includes `뭔 소리`, `안 읽혀`, `무슨 말`, `이해 안`, `더 쉽게`, `너무 어렵`, `다시 풀어`, etc.), the LLM MUST regenerate the brief at `{1, 1, 1}` and offer it BEFORE attempting any other answer.
- **Trigger-phrase update**: adopters MAY extend the trigger phrase list per their reader-base; the canonical default list lives in §0 `audience_profile_fallback.trigger_phrases_md`.
- **Why this exists**: §5.6 gives readers three independent knobs but knobs require knowing they exist. The fallback affordance is the **escape hatch** — a single visible exit to the floor, no knob-knowledge required. This pairs §5.6 with §7 meta-branch (both are voluntariness affordances at different layers).

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
19. **Tone-floor fallback affordance** (§5.6.7) — HTML briefs at any profile MUST surface a single-click button re-rendering at `{1, 1, 1}` ("뭔 소리야? 한국어로 번역해줘" or configurable). MD briefs MUST regenerate at floor profile when the user response matches `audience_profile_fallback.trigger_phrases_md` before attempting any other answer.

### 10.2 SHOULD

1. Generation pipeline SHOULD be staged (escalation → §1+§6 → §2-§4 → §5 → §7 → §8=f(§7) → self-critique → IR → render). Single-shot 8-section generation is discouraged.
2. HTML default view SHOULD show §0+§1+§5+§6+§7 expanded; §2/§3/§4/§8 progressive disclosure. Type-1 (one-way) decisions SHOULD default §8 expanded.
3. Telemetry SHOULD track user_acceptance_rate, average decision time, pre-mortem input length, epistemic tag distribution.
4. Brief header SHOULD display "이 질문에 답하지 않아도 됩니다 — 거부/보류/재구성 옵션이 §7 메타 분기에 있습니다" (visualize voluntariness per Floridi).
5. Renderers SHOULD surface a tone-profile chip near §0 (`A2·B2·J2`) so the reader can recalibrate one axis without re-rendering all three. Adopter project may bind `.hyperbrief/profile.json` for per-project defaults.
6. When `abbreviation ≥ 3`, body prose SHOULD be bullet-first; when `abbreviation ≤ 2`, body prose SHOULD be sentence-first. Epistemic tag surface form follows §5.6.6.
7. When `jargon ≤ 2`, every first use of a domain term (RAPID, Cynefin, MCDA, Toulmin, blast radius, idempotent, etc.) SHOULD carry a 1-line gloss; when `jargon ≥ 4`, glosses SHOULD be omitted to avoid condescension.

### 10.3 Phase 1 transition rules — renderer-absent fallback

`Hyperbrief.md` v0.1은 skills + schema + templates까지 ship하지만 결정론적 Node renderer(`renderer-md.cjs` / `renderer-html.cjs`)는 v0.4.0 (Phase 2)에서 ship됩니다. v0.1.x ~ v0.4.0 구간은 renderer가 known gap이며 LLM은 **template-substitute 모드**로 운영됩니다.

1. **IR-first invariant 유지**: LLM은 여전히 전체 `HyperbriefIR` JSON을 emit하고 `.agent/_decisions/<id>.json`에 사용자 surface 작성 전에 persist MUST.
2. **템플릿 substitution**: LLM은 `templates/brief.md.template` (HTML 산출물 요청 시 `brief.html.template`도) 을 읽어 `{{var_name}}` placeholder를 IR로 substitute. 템플릿 우회하는 자유형 MD/HTML 작성은 금지 (이게 §AF-11 IR-only emit과 동일한 load-bearing 제약).
3. **Drift 감지 telemetry**: Phase 1 emit마다 `.agent/_decisions/_drift-log.jsonl`에 `{decision_id, ir_hash, render_token_count, manual_edit_distance_estimate}` 한 행 append. ir_hash + token_count는 Phase 2 renderer commissioning 시 Phase 1 산출물 대조 검증의 contract.
4. **톤 프로파일은 템플릿 모드에서도 적용**: 템플릿 기본 렌더는 `audience_profile = {2, 2, 2}` (§5.6.5)에 정렬. override 시 LLM은 동일 IR에 §5.6 축 규칙을 placeholder substitution 단계에 적용하여 재렌더 (IR 재생성 아님).
5. **Self-throttle 계속 작동**: §2.4 alert-fatigue circuit breaker는 Phase 1에서도 동일하게 작동. renderer 부재가 self-throttle telemetry 유예 사유가 되지 않음.

Phase 2 ship (v0.4.0) 시 renderer는 동일 IR을 읽어 톤 프로파일 축을 제외하면 동일한 Markdown / HTML을 산출. drift-log는 이 일치를 검증하는 contract.

---

## 11. Adoption — versioning + dogfood ledger

### 11.1 Adoption path (EG)

- **v0.1.0 (this draft)** — `Hyperbrief.md` SSoT + `plugins/hyperbrief/` Phase 1 (2 skills + IR schema + 2 renderers + 2 templates + hooks placeholder).
- **v0.2.0** — Constellation `DECISION_REQUEST/RESPONSE/DEFER/REJECT_FRAMING` + `HyperbriefCard` allowlist (Constellation v0.3.0); `a2a_wait_ack` recognizes `tier='decided'`.
- **v0.3.0** — Superscalar interlock (Superscalar.md §3 adds irreversibility-gate → hyperbrief-trigger-check escalation).
- **v0.4.0** — Phase 2 hooks (PreToolUse on AskUserQuestion / git push / gh release / A2A emit) + MCP server (`hyperbrief_render`, `hyperbrief_validate`, `decision_ledger_append`, `decision_ledger_query`).
- **v0.5.0** — dogfood ledger §11 Entry 01-05 (real cases with retention of user_acceptance_rate, Brier score, pre-mortem text length distribution).

### 11.2 Dogfood ledger

| Entry | Decision id | Date | Reversibility | Outcome | Brier delta | Archive |
|---|---|---|---|---|---|---|
| 01 | `hb-20260603-a1b2c3` | 2026-06-03 | `one_way_with_migration_path` 🟡 | accept (대안 B + 5 patches) | _pending revisit 2026-09-01_ | `_proposals/006_2026-06-03_hyperbrief/dogfood-entry-01.md` |

**Entry 01 meta-learnings (그 결정이 v0.1.1 SSoT에 반영시킨 것)**:

- §5.6 audience_profile 3축 5단계 (사용자가 첫 브리핑이 안 읽힌다고 즉시 피드백 → L2/L2/L2 기본값 도입)
- §5.6.7 tone-floor fallback affordance (HTML 버튼 + MD 트리거 구 — knob 모르는 사용자도 floor 도달 보장)
- §8 recommended_artifacts[] schema slot (사용자가 "patch 본문이 어디 있어?" 라고 지적 → §8 권장안에 첨부될 artifact body를 IR에 강제로 슬롯화)
- §9 archive_config (옵션, default ON) — 결정 + 관련 추가 사용자 prompt + 브리핑 원문을 개발문서 차원으로 박제
- §10.3 Phase 1 transition rules (renderer 부재 구간의 운영 규칙)
- §11.3 cross-seed adoption (EstreUF 도입 경로)

### 11.3 Cross-seed adoption — EstreUF + 기타 EG-seed forks

Hyperbrief는 EG 시드 모듈 중 하나입니다. EG 시드를 분기해 운영하는 어댑터 (특히 2026-05-07 seed v1.5에서 파생된 사용자향 애플리케이션 EstreUF) 는 `Hyperbrief.md` + `plugins/hyperbrief/`를 자기 SSoT 레이어로 임포트할 수 있으며, 다음 어댑터 규율을 준수합니다.

- **decision_id 네임스페이스** — 어댑터는 `decision_id` 접두어를 프로젝트 토큰으로 분리 MUST. EstreUF는 `hb-uf-YYYYMMDD-xxxxxx`, EG 본체는 `hb-eg-…` (`hb-` 단독 prefix는 deprecation 후보; 본 v0.1.1 entry 01은 호환 유지 차원에서 단독 prefix). 이는 schema의 `decision_id` 패턴 확장(어댑터 opt-in 시 `hb-` 접두어를 프로젝트 토큰으로 치환)으로 허용됩니다.
- **장부 분리** — 각 어댑터 프로젝트는 자체 `.agent/_decisions/` 디렉토리를 유지합니다. cross-project 집계는 별도 opt-in 단계(예: 두 장부를 함께 읽는 공유 대시보드).
- **A2A 인텐트 공유** — Constellation을 쓰는 어댑터는 동일한 5개 인텐트 이름 (`DECISION_REQUEST/RESPONSE/DEFER/REJECT_FRAMING` + `HyperbriefCard`)을 공유합니다. 라우팅은 네임스페이스가 아니라 `targetAgentId` 기준.
- **schema 버전 고정** — 어댑터는 자신이 핀하는 `hyperbrief.schema.json` major 버전을 자신의 README 한 줄로 선언 MUST → cross-project 장부 read 시 올바른 validator 적용.

EstreUF dogfood ledger 엔트리는 EstreUF 자체 `_proposals/<bundle>/hyperbrief-ledger.md`에 기록됩니다. cross-cutting spec gap을 드러내는 엔트리 (상위 `Hyperbrief.md`에 반영되어야 하는 변경)는 표준 `_proposals/` lifecycle을 통해 EG로 미러링됩니다.

---

## 12. Versioning

`Hyperbrief.md` follows EG semver (`vMAJOR.MINOR.PATCH`). Plugin (`plugins/hyperbrief/`) tracks `Hyperbrief.md` minor version. Breaking schema changes (`hyperbrief-ir.schema.json`) bump major. Adopter contract: any tool that calls `hyperbrief_validate` MUST declare the schema major it supports.

---

*This module's principal claim: an agent's job is not to manufacture decisions for the user — it is to* **block the manufacture of decisions** *and to surface, with epistemic honesty, exactly the irreducible choice the user must make. Hyperbrief is the structural defense for that claim.*
