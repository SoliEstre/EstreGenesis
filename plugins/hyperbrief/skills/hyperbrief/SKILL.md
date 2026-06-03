---
name: hyperbrief
description: Use AFTER hyperbrief-trigger-check returns FULL_HYPERBRIEF or MINIMAL_BRIEF. Generates the 8-section decision-delegation brief (JSON IR + deterministic MD/HTML render) and emits a paired Constellation DECISION_REQUEST + HyperbriefCard envelope. MUST run when (a) escalation_sum >= 4, (b) any MUST-trigger fires (irreversibility>=2 / cross-module blast radius / external-party notification / resource threshold / supersedes prior decision), (c) Superscalar fan-out gate just opened a write/deploy/send lane, (d) Constellation A2A DECISION_REQUEST is inbound for response. SKIP when trigger-check returned AUTONOMOUS_DECIDE or BLOCK_FRAMING.
---

# Hyperbrief — 8-section decision brief generation

You are about to produce a Hyperbrief because `hyperbrief-trigger-check` returned `FULL_HYPERBRIEF` (or `MINIMAL_BRIEF` for Cynefin chaotic). Follow this pipeline strictly.

> **Core invariant**: you emit **JSON IR only**. The renderers (or the templates as fallback) produce MD and HTML. Do NOT write MD or HTML directly — it causes representation drift and turns the 8 sections into markdown cosplay.

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
| `audience_profile_fallback` | `{enabled: true, button_label, trigger_phrases_md}` per §5.6.7. HTML always surfaces re-render button. MD: monitor user response — if it contains any trigger phrase (default: `뭔 소리`, `안 읽혀`, `무슨 말`, `이해 안`, `더 쉽게`, `너무 어렵`, `다시 풀어`, `쉽게 다시`), regenerate brief at `{1,1,1}` BEFORE attempting any other answer. |

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

### §8 Recommendation — derived from §7

- **`recommendation_conditional`** — `{recommended, recommended_artifacts[], assumptions[], fallback_if_assumption_violated, switch_if}`. Single unconditional assertion forbidden.
- **`recommended_artifacts[]`** (§10.1 MUST-18 · AF-20) — when `recommended` references "apply X patch" / "add Y section" / "ship Z change", you MUST attach the actual artifact body. Each entry `{artifact_type: patch|spec|code|design|config|other, target_file, target_anchor, body, rationale_one_line}`. The reader must see the text they are voting on without an extra click. Empty `body` with a non-trivial reference is the structural failure surfaced by dogfood Entry 01.
- **`confidence`** — `{point_estimate (0-1), ci_90_low, ci_90_high, brittleness: tagged_text}`. If `point_estimate < 0.6` → set `downgraded_to_proposal_if_low_confidence = true` (label flips from "recommended" to "proposal candidate").
- **`cited_tree_node_ids`** — ≥ 1 node ID from §7. Missing → validator rejects.
- **`defeaters`** — ≥ 3 tagged_text (each flips the recommendation).
- **`pre_mortem_inline`** — 1 line.
- **`reversible_fallback`** — `{fallback_path, rollback_cost, trigger_conditions}`.
- **`falsification_trigger`** — `{what_to_observe, when, threshold}` (all 3 required).
- **`i_accept_irreversibility_required: true`** if `reversibility_class == one_way`.

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
    "ack_tier_required": "decided"
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

## Reference

Full spec: https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md
