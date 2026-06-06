---
name: hyperbrief
description: Use AFTER hyperbrief-trigger-check returns FULL_HYPERBRIEF or MINIMAL_BRIEF. Generates the 8-section decision-delegation brief (JSON IR + deterministic MD/HTML render) and emits a paired Constellation DECISION_REQUEST + HyperbriefCard envelope. MUST run when (a) escalation_sum >= 4, (b) any MUST-trigger fires (irreversibility>=2 / cross-module blast radius / external-party notification / resource threshold / supersedes prior decision), (c) Superscalar fan-out gate just opened a write/deploy/send lane, (d) Constellation A2A DECISION_REQUEST is inbound for response. SKIP when trigger-check returned AUTONOMOUS_DECIDE or BLOCK_FRAMING.
---

# Hyperbrief — 8-section decision brief generation

You are about to produce a Hyperbrief because `hyperbrief-trigger-check` returned `FULL_HYPERBRIEF` (or `MINIMAL_BRIEF` for Cynefin chaotic). Follow this pipeline strictly.

> **Core invariant**: you emit **JSON IR only**. The renderers (or the templates as fallback) produce MD and HTML. Do NOT write MD or HTML directly — it causes representation drift and turns the 8 sections into markdown cosplay.

> **v0.6 compatibility note**: This skill targets schema v0.6 (4 additive optional slots: `evaluation_lenses`, `recommended_methodology`, `maturity_anchor`, `term_pairing`). v0.5.6 callers/IRs remain valid — every v0.6 slot is optional. Omit any slot whose trigger condition (see §1.v06) does not fire.

## 0. Generation pipeline (staged, NOT single-shot)

```
1. compute escalation 4-score + classify reversibility, Cynefin domain, RAPID roles → §0
2. draft §1 (context horizon) + §6 (decision prompt)        ← frame the question first
3. draft §2 (blast radius) + §3 (incremental path) + §4 (why blocks)
4. draft §5 (consequences — heaviest section: 7 sub-blocks)
5. draft §7 (decision tree — meta-branch + 3 root nodes + Cynefin-adaptive format)
6. derive §8 (recommendation) as a FUNCTION of §7 — cite ≥ 1 node ID
7. self-critique: name 3 omissions → patch IR
8. validate IR against schema/hyperbrief.schema.json
9. render → emit Constellation DECISION_REQUEST + HyperbriefCard pair
10. register §9 Decision Capture (revisit_date + ledger_pointer)
```

Single-shot 8-section generation is **discouraged** — sections downstream of §5 collapse to hand-waving when the LLM holds all 8 in working memory simultaneously.

**v0.6 pipeline insertion**: between steps 6 and 7, run the **v0.6 slot scan** (§1.v06 below) — check each of the 4 triggers and populate any slot whose trigger fires. Slots are cross-referential (`evaluation_lenses[].methodology_ref` → `recommended_methodology[].id`; `maturity_anchor.anchor_methodology` → `recommended_methodology[].id`), so populate `recommended_methodology` first when multiple v0.6 slots fire together.

## 1. §0 Decision Header — 8 required fields

| Field | How to fill |
|---|---|
| `escalation` | 4 scores (0-3 each) + sum + `autonomy_refusal_reason` (1 line: "why not autonomous") |
| `reversibility_class` | `two_way` (rollback < 1h, no migration) / `one_way_with_migration_path` (rollback possible but costly) / `one_way` (no rollback) |
| `reversibility_badge_color` | green / yellow / red (mapped from class) |
| `rapid` | Recommender (you), Decider (usually user), Performer, Input-contributors, Agree-holders (veto) |
| `cynefin_domain` | clear (best practice) / complicated (expert analysis) / complex (probe-sense-respond) / chaotic (act-sense-respond) / confused (clarify first) |
| `decision_lineage` | `parent_decision_ids[]` (existing hb-* IDs this supersedes/depends on) + `assumed_invariants[]` (tagged claims that, if violated, invalidate this decision) |
| `deadline` | ISO8601 timestamp or `"no rush"` |
| `recommended_reading_minutes` | integer estimate |
| `stake` | `financial` / `reputation` / `tech_debt` — each tagged_text |
| `audience_profile` | 3-axis tone `{audience, abbreviation, jargon}` each 1-5. Default `{2, 2, 2}` per §5.6. Adapt surface prose density, acronym expansion, jargon glossing per axis — independently (do NOT collapse into one knob). |
| `audience_profile_fallback` | `{enabled: true, button_label, trigger_phrases_md}` per §5.6.7. HTML always surfaces re-render button. **Auto-localize at IR-emit time (MUST-19, v0.5.6)**: populate `button_label` AND `trigger_phrases_md` in the **user's prevailing conversation language** — you (the LLM) already know that language from the surrounding context. Reference literals: EN `"What? Just say it plainly."` + EN trigger list (`what?`, `huh?`, `say it plainly`, `i don't get it`, `too much jargon`, `try again simpler`, `in plain english`, `eli5`); KO `"뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)"` + KO trigger list (`뭔 소리`, `안 읽혀`, `무슨 말`, `이해 안`, `더 쉽게`, `너무 어렵`, `다시 풀어`, `쉽게 다시`, `한국어로`, `한국말로`); JA `"何これ？私が分かる言葉で。"` + analogous JA list; analogous for other languages. Mixed-language sessions follow the user's most recent prevailing-language signal. Schema defaults (Korean literals) apply ONLY when this skill is bypassed (IR-direct-call / test / programmatic invocation); in normal skill-driven flow you MUST populate per user's language. Hard override at `.hyperbrief/profile.json` (if present) takes precedence over auto-localize. MD: monitor user response — if it contains any trigger phrase (from the auto-localized list), regenerate brief at `{1,1,1}` BEFORE attempting any other answer. **v0.6 extension**: `audience_profile_fallback.term_pairing` — see §1.v06.D for command-form parsing (e.g. `L1.I.C+B`) + low-frequency override + C-scope auto-forward semantics. |

### 1.v06 v0.6 additive slot guidance (4 optional slots)

Each slot has a **trigger condition** (when to populate) and **fill discipline** (how). When the trigger does NOT fire, **omit the slot entirely** (do not emit empty objects or null — schema treats absence as "not applicable"). All 4 slots are optional and back-compat preserving.

#### 1.v06.A `section_0_decision_header.evaluation_lenses[]` — multi-lens scoring

**Trigger** (populate when ANY fires):
- The decision target is evaluated against ≥ 2 distinct lenses (different dimension sets / different weighting / different audience perspective). Canonical pattern: Hyperbrief.md §11.5 readiness rubric pair (Lens A = module GA-readiness internal-coherence dimensions; Lens B = host-marketplace external-readiness dimensions).
- A single lens yields a verdict that flips when evaluated under a second plausible lens (lens-sensitivity flag).
- The user/brief explicitly invokes the term "lens" / "관점" / "rubric" / "다관점" for the same decision target.

**Fill discipline**:
- Each item: `{id, name, dimensions[], threshold_simple_mean?, threshold_weighted_mean?, current_simple?, current_weighted?, verdict, methodology_ref?, rationale_one_line?}`.
- `id` lowercase snake/dot-form matching pattern; `dimensions[]` lists the axes being scored.
- `verdict` ∈ `below | at | above` — relative to the lens's own threshold, NOT cross-lens.
- `methodology_ref` — when this lens's scoring method is documented as a `recommended_methodology[]` entry, reference its `id`. Forces lens ↔ methodology audit trail.
- Threshold fields are OPTIONAL: report only what you actually computed. If you have current_simple but no defined threshold (exploratory scoring), emit current only.
- `rationale_one_line` is `tagged_text` — required when verdict diverges from another lens's verdict on the same target (lens-sensitivity disclosure).
- Two-lens minimum to be meaningful; single-lens fillings should NOT use this slot (just embed in §8 narrative).

**Cross-section coherence**: when `evaluation_lenses` is populated, §7 decision tree SHOULD include a node that branches on lens-disagreement (e.g. "lens A says below, lens B says above → which lens governs?"). §8 `recommendation_conditional.assumptions` MUST include which lens the recommendation defers to.

#### 1.v06.B `section_8_recommendation.recommended_methodology[]` — meta-decision tooling

**Trigger** (populate when ANY fires):
- The recommendation invokes a named evaluation method / rubric / framework that the reader needs to inspect to understand the verdict (not common-knowledge tools — those go to §8 narrative). Canonical: Hyperbrief.md §11.5 readiness rubric itself.
- An `evaluation_lenses[]` entry has `methodology_ref` — the referenced methodology MUST exist here.
- A `maturity_anchor.anchor_methodology` is referenced — same MUST exist here.
- The decision is meta-level (deciding how to decide future similar cases) — the methodology IS the artifact.

**Fill discipline**:
- Each item: `{id, name, version?, anchor_path, applicability[]?, rationale_one_line}`.
- `id` follows pattern `^[a-z0-9][a-z0-9_.-]*$` (dots allowed for versioned ids like `hyperbrief-v1-readiness-rubric.v2`).
- `anchor_path` — concrete pointer to the methodology body (e.g. `"Hyperbrief.md §11.5"` / `".agent/_methods/rubric-foo.md"`). Not a URL fragment — a navigable workspace anchor.
- `applicability[]` — short labels of decision types this methodology fits (e.g. `["module-GA-readiness", "marketplace-listing"]`). Optional but recommended for cross-decision reuse.
- `rationale_one_line` (tagged_text) — why THIS methodology fits THIS decision.
- Populate FIRST among v0.6 slots when multiple fire — lenses / maturity_anchor reference back to this slot's `id`s.

#### 1.v06.C `maturity_anchor` (FullBrief top-level) — anchored maturity claims

**Trigger** (populate when ANY fires):
- The recommendation, options, or any §1-§8 narrative invokes a maturity / readiness label that is inherently arbitrary without a measurement anchor: `"v1.0"`, `"GA"`, `"stable"`, `"production-ready"`, `"beta"`, `"RC"`, `"mature"`, `"하드닝 완료"`, `"운영 안정화"`, etc.
- The decision IS to assign such a label (release decision, version-bump decision).
- A maturity-class claim appears in §0 stake / §4d rejected_alternatives / §8 recommendation and a reasonable reader would ask "by what measure?".

**Fill discipline**:
- Required fields as a unit: `{claimed_label, anchor_methodology, current_score: {simple_mean, weighted_mean}, threshold: {simple_mean, weighted_mean}, gap_analysis}` — all 5 must be present together; partial fills fail schema.
- `claimed_label` — the literal label being claimed (e.g. `"v1.0 GA"`).
- `anchor_methodology` — `id` reference to a `recommended_methodology[]` entry (which MUST be populated in §1.v06.B).
- `current_score` / `threshold` — both simple_mean and weighted_mean required (numerical). When only one mean type is meaningful for the methodology, mirror the value (do not fabricate a different number; emit the same value in both fields with a clarifying gap_analysis note).
- `gap_analysis` — `tagged_text`, 1-3 sentences naming the largest gap dimension and what would close it.
- Optional `verdict` ∈ `meets | near | short` — convenience for renderer to color-badge. Derive from gap: `meets` if current >= threshold on both means; `near` if within 0.5 on weighted; `short` otherwise.
- When the maturity claim is asserted but the methodology lacks numerical scoring, do NOT populate this slot — instead disclose the unanchored claim in §0 stake or §8 brittleness, and consider adding a `recommended_methodology[]` entry to anchor future iterations.

#### 1.v06.D `audience_profile_fallback.term_pairing` — display policy + scope

**Trigger** (populate when ANY fires):
- The user issues a tone-profile command in the canonical form `<tone>.<mode>.<scope>[!|?]` (e.g. `L1.I.C`, `L1.E.A`, `L2.N.D`, `L1.I.C+B`).
- The decision surface spans multiple channels (Constellation board + dashboard + review line + document) and the brief needs a uniform term-pairing policy across them.
- The user explicitly requests abbreviation/jargon glossing behavior beyond the 3-axis `audience_profile` knob (which controls density, not display policy).
- Default when none of the above fires: `{mode: "N", scope: ["D"]}` (no pairing, document-scope only) — but **omit the slot** when absent unless renderer-side defaulting is preferred (schema-side default applies on validation).

**Command-form parsing** (skill does this BEFORE schema validation — schema sees canonical form only):
- Format: `<tone-profile>.<mode>.<scope>[suffix]`
  - `<tone-profile>` ∈ `L1.1.1` / `L1.1.2` / ... / `L2.2.2` / ... — feeds `audience_profile` (the 3-axis knob), NOT term_pairing.
  - `<mode>` ∈ `E` (every) / `I` (initial) / `N` (none).
  - `<scope>` — single letter or `+`-joined: `C` (conversation) / `D` (document) / `B` (board) / `R` (review). Shortcut: `A` expands to all four `[C, D, B, R]` — **skill expands `A` to the explicit array before populating the IR**; schema enum stays canonical (no `A` value).
  - `<suffix>` (optional): `!` = `retroactive_apply: "Y"` (force apply to past output in scope), `?` = `retroactive_apply: "prompt"` (ask). Default when suffix absent: `retroactive_apply: "prompt"`.
- Examples (canonical → IR):
  - `L1.I.C` → `audience_profile: {1,1,1}` + `term_pairing: {mode: "I", scope: ["C"], retroactive_apply: "prompt"}`.
  - `L1.E.A` → `audience_profile: {1,1,1}` + `term_pairing: {mode: "E", scope: ["C","D","B","R"], retroactive_apply: "prompt"}`.
  - `L2.N.D` → `audience_profile: {2,2,2}` + `term_pairing: {mode: "N", scope: ["D"], retroactive_apply: "prompt"}`.
  - `L1.I.C+B!` → `audience_profile: {1,1,1}` + `term_pairing: {mode: "I", scope: ["C","B"], retroactive_apply: "Y"}`.

**Low-frequency override (I-mode)**: when `mode == "I"` AND total occurrences of a given term within the scope unit are ≤ 3, the renderer treats that term as if `mode == "E"` (pair every occurrence). At ≥ 4, optimize to "first-mention pairing only" per canonical I semantics. This is renderer-applied; skill does NOT need to pre-classify terms — just emit the mode faithfully and let the renderer's frequency pass do the override.

**C-scope auto-forward semantics**: conversation scope (`C`) is structurally outside retroactive_apply (you cannot rewrite chat history). When `scope` contains `C`:
- If `C` is the ONLY scope element: `retroactive_apply` is moot — renderer/skill applies forward-only automatically; do NOT emit a prompt to the user about retroactive scope.
- If `C` is one of multiple scopes (e.g. `C+B`): C is treated as forward-only regardless of `retroactive_apply` value; the prompt (if `prompt`) applies only to D/B/R subset.

**Dictionary reference**: when term-pairing is active, the renderer needs to know which terms are abbrev/jargon. v0.6 schema accepts:
- `dictionary_ref` (string) — path/URL to an external dictionary file.
- `dictionary_inline` (object) — inline `{term: expansion}` map for one-off use.
- When neither is provided, the renderer falls back to a heuristic (uppercase-letter clusters as abbrev candidates) with a brittleness note. Skill SHOULD populate at least one when emitting term_pairing with non-N mode.

**Cross-module signal**: when `scope` includes `B` (board) or `R` (review), the skill MUST flag the IR for downstream Constellation re-emit on the affected channels (Hyperbrief.md §13 cross-module). Implementation: include a top-level `cross_module_reemit_required: true` hint when emitting the Constellation envelope pair (see §4 below).

## 2. §1-§9 IR generation — anti-pattern checklist per section

### §1 Context Horizon (3 cells)

- `preconditions` (≥ 1 tagged_text), `continuity_from_prior`, `scope_of_impact`, `forcing_function`
- **MUST NOT** paraphrase §6.
- Every assertion carries `[verified|inferred|assumed|unknown]` inline.

### §2 Blast Radius Surface

- 5 surface fields: `touched_modules` / `touched_contracts` / `touched_data_at_rest` / `touched_external_consumers` / `touched_operational_runbooks`
- Empty slots are `"verified empty"`, NEVER `"unknown"`.
- `coupling_delta`: `new_dependencies`, `new_consumers`, `interface_surface_delta`, `depth_to_interface_ratio_change`.
- `observability_increment`: if new coupling without new signal → "silent failure risk" flag.
- `hyrum_exposure_flag`: true if externally visible behavior changes.

### §3 Incremental Path Check

- `chosen_path ∈ {big_bang, incremental_strangler, branch_by_abstraction, feature_flag_gated}`
- If `big_bang`: MUST justify why each of strangler / branch-by-abstraction / feature_flag is **not possible**. Missing → set `tentative_flag_if_big_bang = true` and §8 downgrades to `tentative`.
- `milestones[]`: each `{label, rollback_possible: yes|partial|no, blast_radius_at_step}`.

### §4 Why — 4 blocks

- **4a `decision_driver`** — forcing function (why now).
- **4b `boundary_conditions`**:
  - `must_have` (≥ 2 — under 2 → reject; ask user for spec).
  - `should_have`, `nice_to_have`.
- **4c `hidden_assumptions`** (≥ 3 — "없음" is forbidden; option decomposition without hidden assumptions is impossible):
  - each `{assumption, if_violated}`.
- **4d `rejected_alternatives`** (≥ 2 OR `forcing_function_closes_option_space_justification`):
  - each `{alternative, rejection_reason}`.

### §5 Consequences — 7 sub-blocks (the heaviest section)

1. **`framing_matrix_2x2_plus_no_action`** — `{accept_gain, accept_loss, reject_gain, reject_loss, no_action}`. Single narrative forbidden.
2. **`reversibility_panel`** — `{rollback_cost: {time, money, relational_capital}, reversal_window, trigger_to_revisit}`.
3. **`mcda_table`** — `alternatives[]` (MUST include `do_nothing`) × `criteria[]` (derived from §4b boundary conditions) × `cells[]` (`{alternative, criterion, value, rationale}`). Empty cell forbidden — missing value is `"UNKNOWN+investigation_cost:<estimate>"`.
4. **`pre_mortem_scenarios`** (≥ 2) — each `{failure_path, early_warning_signal}`.
5. **`most_affected_stakeholder`** — `{stakeholder_id, first_person_restatement}` (1인칭으로 재서술).
6. **`null_option_cost`** — `{d30, d90, y1}` (do-nothing cost over time). 0 estimate → set `lehman_violation_flag = true`.
7. **`toulmin_predictions[]`** — each `{claim, grounds, warrant, qualifier: {point_estimate, ci_90_low, ci_90_high, most_likely_to_miss_scenario}, rebuttal}`. **Natural-language probability words forbidden** (`"likely"`, `"probably"`, `"아마도"`). `rebuttal != "none"`.

### §6 Decision Prompt — 3 slots + question

- `question_to_user` (MUST end with `?`).
- `essence_one_line`, `core_tradeoff_one_line`, `recommendation_with_confidence_one_line`.
- Optional `ai_view_vs_devils_advocate`.
- §6 alone MUST be sufficient to route a decision (self-coherence test: §6 → §8 reachable).

### §7 Decision Criteria Tree

- **`meta_branch`** (4 options, always available): `accept`, `reject_framing`, `defer`, `request_investigation`. Each is tagged_text describing what that branch leads to.
- **`root_nodes`** (3 standardized): `reversibility`, `blast_radius`, `time_pressure`.
- **`domain_format`** — Cynefin-adaptive:
  - `clear` / `complicated` → `tree_mermaid` (deterministic flowchart).
  - `complex` → `probe_safe_to_fail` (3 probes + observable signals).
  - `chaotic` → `single_action_card`.
- **`nodes[]`** — each `{node_id (^N\d+$), question, decision_relevance: tagged_text, children_ids[]}`. Decision-relevance test: every node must change the chosen option's identity. Failing nodes → prune.
- **`pruned_options[]`** — explicit `{option, exclusion_reason}`.
- `depth_warning: true` if tree depth > 3.
- **v0.6 cross-section coherence**: if `§0.evaluation_lenses` is populated with ≥ 2 lenses whose verdicts diverge, §7 SHOULD include a lens-arbitration node (e.g. "lens disagreement: which lens governs this decision?") — this is the node that §8 then cites.

### §8 Recommendation — derived from §7

- **`recommendation_conditional`** — `{recommended, recommended_artifacts[], assumptions[], fallback_if_assumption_violated, switch_if}`. Single unconditional assertion forbidden.
- **`recommended_artifacts[]`** (§10.1 MUST-18 · AF-20) — when `recommended` references "apply X patch" / "add Y section" / "ship Z change", you MUST attach the actual artifact body. Each entry `{artifact_type: patch|spec|code|design|config|other, target_file, target_anchor, body, rationale_one_line}`. The reader must see the text they are voting on without an extra click. Empty `body` with a non-trivial reference is the structural failure surfaced by dogfood Entry 01.
- **`recommended_methodology[]`** (v0.6 — see §1.v06.B for trigger + fill) — populate when the recommendation invokes a named meta-decision method. Required when `evaluation_lenses[].methodology_ref` or `maturity_anchor.anchor_methodology` references back here.
- **`confidence`** — `{point_estimate (0-1), ci_90_low, ci_90_high, brittleness: tagged_text}`. If `point_estimate < 0.6` → set `downgraded_to_proposal_if_low_confidence = true` (label flips from "recommended" to "proposal candidate").
- **`cited_tree_node_ids`** — ≥ 1 node ID from §7. Missing → validator rejects.
- **`defeaters`** — ≥ 3 tagged_text (each flips the recommendation).
- **`pre_mortem_inline`** — 1 line.
- **`reversible_fallback`** — `{fallback_path, rollback_cost, trigger_conditions}`.
- **`falsification_trigger`** — `{what_to_observe, when, threshold}` (all 3 required).
- **`i_accept_irreversibility_required: true`** if `reversibility_class == one_way`.
- **v0.6 cross-section coherence**: when `evaluation_lenses` is populated, `recommendation_conditional.assumptions[]` MUST include a tagged entry naming which lens the recommendation defers to. When `maturity_anchor` is populated and `verdict ∈ {near, short}`, `confidence.brittleness` MUST explicitly cite the maturity gap.

### §9 Decision Capture stub

- `revisit_date` (ISO8601 — heuristic: 30/90/180 days based on reversibility class).
- `ledger_pointer` — `.agent/_decisions/<decision_id>.json` (standalone) OR Constellation decision-ledger SSE id.
- `outcome_actual: null`, `outcome_vs_decision_quality_delta: null` (filled post-revisit by `hyperbrief-revisit` skill).
- `archive_config: {enabled: true, archive_path, elements: [brief_original, decision, related_user_prompts, recommended_artifacts_applied, meta_learnings]}` — default ON. When the user decides, persist all 5 elements to `archive_path` (default `.agent/_decisions/<id>.archive/` or `_proposals/<bundle>/dogfood-entry-NN.md` for proposals-tracked decisions). The archive is the load-bearing dev record per §9. Skip per-brief only when explicit `enabled: false` is set for low-value decisions.

## 3. Rendering — IR → MD + HTML

### If renderer scripts ARE available (Phase 2+):

```bash
node ${CLAUDE_PLUGIN_ROOT}/renderers/renderer-md.cjs   < ir.json > brief.md
node ${CLAUDE_PLUGIN_ROOT}/renderers/renderer-html.cjs < ir.json > brief.html
```

### If renderer scripts NOT available (Phase 1 fallback):

1. Read `templates/brief.md.template` and `templates/brief.html.template`.
2. Substitute `{{var_name}}` placeholders from IR.
3. Validate output against the templates' invariants (mermaid blocks present, all 8 sections rendered, active-choice gate present if `i_accept_irreversibility_required`).
4. Write to `.agent/_decisions/<decision_id>.md` and `.agent/_decisions/<decision_id>.html`.

**Do NOT** invent your own MD/HTML structure — use the templates. Drift between this skill's free-form output and the templates is the failure mode the IR design exists to prevent.

**v0.6 rendering note**: the 4 new slots have renderer-side handling in v0.6+ mini-engine. When using older renderers (pre-v0.6), the slots are silently dropped in MD/HTML — IR retains them for downstream tooling (Constellation re-emit / archive). Skill should NOT inline-render the new slots into the IR's narrative as a workaround; that defeats representation separation. Either upgrade the renderer or accept partial visualization.

## 4. Constellation emit (if Constellation present)

Emit **paired** envelopes:

```jsonc
// Envelope 1: routing + ack
{ "type": "CUSTOM",
  "name": "DECISION_REQUEST",
  "targetAgentId": "<user-board-agent>",
  "value": {
    "decision_id": "hb-YYYYMMDD-xxxxxx",
    "card_msg_id": "<msgId of paired HyperbriefCard>",
    "reversibility_class": "...",
    "reversibility_badge_color": "...",
    "escalation_sum": <int>,
    "deadline": "...",
    "rapid_decider": "user",
    "cynefin_domain": "...",
    "ack_tier_required": "decided",
    "cross_module_reemit_required": false  // v0.6: set true if term_pairing.scope includes B or R
  }
}

// Envelope 2: card body
{ "type": "CUSTOM",
  "name": "HyperbriefCard",
  "targetAgentId": "<user-board-agent>",
  "parentId": "<DECISION_REQUEST msgId>",
  "value": {
    "decision_id": "...",
    "ir": { /* full HyperbriefIR JSON */ },
    "render_artifacts": {
      "md_permalink": "file:///.../briefs/<id>.md",
      "html_inline_b64": "<base64 self-contained HTML>"
    },
    "expand_hint": "open inline HTML in board card; MD permalink for archive"
  }
}
```

**Pre-send probe (Constellation §13.16.10)**: BEFORE emit, read the inbox tail. If inbound contains `DECISION_REJECT_FRAMING` or `DEFER` for a parent decision in this lineage, ABORT this emit and surface the parent state first.

**Fallback (Pattern 7)**: if adopter doesn't recognize `HyperbriefCard`, prepend a standard prefix line to a `TEXT_MESSAGE`:

```
[Hyperbrief decision required | id=hb-YYYYMMDD-xxxxxx | reversibility=<class>(<color>) | deadline=<iso> | link=<md_permalink>]
```

**v0.6 cross-module re-emit**: when `term_pairing.scope` contains `B` (board) or `R` (review), set `cross_module_reemit_required: true` in Envelope 1. Receiving boards/review channels SHOULD re-render their existing surfaces with the new term-pairing policy applied (respecting `retroactive_apply`).

## 5. Standalone mode (no Constellation)

- Write `brief.md` and `brief.html` to `.agent/_decisions/<decision_id>.{md,html}`.
- Show file paths to the user directly.
- Decision receipt: prompt user inline; record outcome to `.agent/_decisions/<decision_id>.json`.

## 6. Revisit registration

After emit (regardless of mode), append a row to the local decision ledger:

```jsonc
{ "decision_id": "hb-YYYYMMDD-xxxxxx",
  "revisit_date": "YYYY-MM-DD",
  "reversibility_class": "...",
  "parent_decision_ids": [...],
  "assumed_invariants": [...],
  "ledger_pointer": ".agent/_decisions/<id>.json" }
```

`hyperbrief-revisit` skill scans this ledger at session-start / Stop / cron tick.

## 7. Anti-patterns — checklist before emit

- [ ] No untagged fact assertion.
- [ ] `§4b.must_have ≥ 2`, `§4c.hidden_assumptions ≥ 3`, `§4d.rejected_alternatives ≥ 2` (or forcing-function justification).
- [ ] §5 has all 7 sub-blocks; MCDA has no empty cell; Toulmin has no `"none"` rebuttal.
- [ ] No natural-language probability words anywhere.
- [ ] §6 `question_to_user` ends with `?`.
- [ ] §7 has meta-branch + 3 root nodes + Cynefin-appropriate format.
- [ ] §8 cites ≥ 1 §7 node ID + has falsification trigger + has reversible_fallback or `i_accept_irreversibility_required`.
- [ ] §0 reversibility_badge_color matches class; §9 revisit_date registered.
- [ ] Pre-send probe completed (no superseding inbound).
- [ ] **v0.6**: ran §1.v06 slot scan; populated each slot whose trigger fired; cross-references coherent (lens.methodology_ref + maturity_anchor.anchor_methodology both resolve to recommended_methodology[].id); evaluation_lenses populated → §8.assumptions cites lens; maturity_anchor verdict ∈ {near, short} → §8.confidence.brittleness cites gap; term_pairing scope ⊇ {B, R} → Envelope 1 sets cross_module_reemit_required.

## Reference

Full spec: https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md
