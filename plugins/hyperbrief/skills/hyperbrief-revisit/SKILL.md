---
name: hyperbrief-revisit
version: 0.6.0
description: "Invoke when a stored Hyperbrief decision's revisit_date is reached, OR when an assumed_invariant in decision_lineage is violated by recent A2A signals, OR at session-start / Stop hook / 6h cron tick to scan the ledger. Loads the original IR, prompts user for actual outcome, computes outcome-quality vs decision-quality delta (Brier score increment), appends retrospective to ledger, supersedes/affirms decision_id chain. Closes the learning loop that fire-and-forget briefs leave open. v0.6: aware of 4 new schema slots (evaluation_lenses / recommended_methodology / maturity_anchor / term_pairing) — back-compat with v0.5.6 IRs preserved."
---

# Hyperbrief Revisit — close the learning loop

You are scanning the decision ledger for decisions whose `revisit_date` has arrived (or whose `assumed_invariants` have been violated), OR a specific `decision_id` has been handed to you for review.

## 0. Schema version awareness (v0.6.0)

본 skill 은 schema v0.6.0 인지. v0.5.6 → v0.6.0 변경 사항:

- **v0.5.6 IR 도 v0.6 schema 에 valid 유지** (back-compat). 모든 신규 슬롯은 optional — 기존 ledger 항목 마이그레이션 불요.
- **신규 슬롯 4 종** (revisit 시점에 비어있을 수 있음 — 그 자체로 흠결 아님):
  1. `section_0_decision_header.evaluation_lenses[]` — 같은 결정에 대한 multi-lens 점수 (예: Lens A 모듈 GA / Lens B host marketplace).
  2. `section_8_recommendation.recommended_methodology[]` — 결정에 사용된 평가 방법론 박제 (예: `hyperbrief-v1-readiness-rubric`).
  3. `maturity_anchor` (top-level, optional) — 자의적 라벨 (v1.0/GA/stable) 에 측정 가능한 anchored 기준.
  4. `AudienceProfileFallback.term_pairing` — tone 프로파일의 표시 정책 + 적용 범위 (mode E/I/N · scope C/D/B/R · retroactive_apply).
- **v0.5.6 caller 도 v0.6 skill 호환**: 이전 버전 IR 를 그대로 입력해도 본 skill 동작. 신규 슬롯 부재 시 retrospective 질문에서 "옵션으로 채우기" 만 제시 (강제 아님).

## 1. Trigger conditions

Run this skill if ANY of these apply:

- Session-start / Stop hook / 6h cron tick → scan ledger for `revisit_date <= now AND outcome_actual == null`.
- Inbound A2A signal contradicts an `assumed_invariant` in any active decision's lineage.
- User explicitly invokes `/hyperbrief revisit <decision_id>`.
- `hyperbrief` skill's parent-decision check found a stale parent.
- **v0.6 추가**: `maturity_anchor.claimed_label` 이 부착된 결정의 경우, anchor methodology 의 current_score 가 threshold 를 (재)교차했는지 감지된 시점.

## 2. Ledger scan

Locate the ledger at one of:

- Standalone: `.agent/_decisions/*.json` (one file per decision_id).
- Constellation-integrated: Constellation `state.json` → `decisions[]` array, OR SSE endpoint `/api/decisions/stream`.

For each entry where `revisit_date <= now AND outcome_actual == null`:

1. Load the original IR (full JSON). **Schema version 확인** — v0.5.6 / v0.6.0 둘 다 처리. 누락 슬롯은 정상 (back-compat).
2. Surface to the user as a `HyperbriefRevisit` card (or inline text in standalone mode).
3. Block other low-priority work until the user responds (revisit > new work).

## 3. The 8-question retrospective (+ v0.6 옵션 4 질문)

Ask the user, ONE question at a time (avoid framing-effect batching):

1. **Outcome** — "이 결정의 실제 결과는 어땠어요? 1-2 문장으로." (Free-form text → `outcome_actual`.)
2. **Confidence delta** — "결정 당시 confidence 는 `<original_confidence.point_estimate>` 였어요. 지금 돌아보면 적절했어요? (under-confident / well-calibrated / over-confident)"
3. **Falsifier check** — "결정에 부착된 falsification trigger (`<what_to_observe>` at `<when>`, threshold `<threshold>`) 는 trip 됐어요? (yes / no / not yet measurable)"
4. **Assumed-invariant check** — "결정 당시 가정 (`<assumed_invariants[]>`) 은 여전히 유효해요? 위반된 것이 있다면 어떤 것?"
5. **Pre-mortem hit** — "결정 당시 pre-mortem 시나리오 (`<pre_mortem_scenarios[].failure_path>`) 중 실제로 발생한 것이 있어요?"
6. **Defeater check** — "결정 당시 defeaters (`<defeaters[]>`) 중 fire 된 것이 있어요?"
7. **Decision quality** — "결과의 좋고 나쁨과 별개로, *그 시점에 그 정보로* 결정 자체는 합리적이었어요? (Y/N + 이유)"
8. **Successor decision** — "이 결정을 supersede 하거나 affirm 하는 후속 결정이 필요해요? (yes — open new hyperbrief / no — affirm / partial — defer to next checkpoint)"

### 3.1 v0.6 옵션 질문 (신규 슬롯이 비어있고 사용자가 채우길 원하는 경우만)

기존 결정이 v0.5.6 IR 이라 4 신규 슬롯 중 일부가 비어있을 때, retrospective 끝에 1-line 옵션으로 제시 ("필요하면 채울 수 있어요 / 건너뛰어도 돼요"):

9. **evaluation_lenses** (slot empty 시) — "이 결정을 multi-lens 로 재평가해볼 lens (관점) 가 있어요? (예: 모듈 GA lens vs host marketplace lens) 없으면 skip."
10. **recommended_methodology** (slot empty 시) — "이 결정에 사용한 평가 방법론 (rubric/framework) 을 박제할 만한 것이 있어요? (예: readiness rubric §11.5 같은 메타-결정 도구) 없으면 skip."
11. **maturity_anchor** (slot empty + 결정이 라벨링 결정 시) — "이 결정이 'v1.0/GA/stable' 같은 자의적 maturity 라벨을 부착했다면, anchor methodology + threshold 명시해볼래요? 라벨링 결정 아니면 skip."
12. **term_pairing** (AudienceProfile slot empty 시) — "tone 프로파일에 term_pairing (약어 병기 정책: mode E/I/N · scope C/D/B/R) 추가할래요? 기본 N/[D] 로 두려면 skip."

**규율**: 옵션 질문은 skip 이 기본. 사용자가 명시적으로 채우길 원할 때만 진행. 빈 슬롯 자체는 흠결 신호 아님 (v0.5.6 vintage 결정의 정상 상태).

## 4. Brier increment computation

For each `toulmin_predictions[]` and `§8.confidence` that has a `point_estimate`:

```
brier_increment = (actual_outcome_binary - point_estimate)^2
```

Append the increment + cumulative average to the ledger entry:

```jsonc
{ "decision_id": "hb-...",
  "schema_version_at_decision": "0.5.6" | "0.6.0",
  "schema_version_at_revisit": "0.6.0",
  "outcome_actual": "<user text>",
  "decision_quality": "reasonable" | "premature" | "biased" | "lucky",
  "outcome_quality_vs_decision_quality_delta": "outcome-better-than-decision" | "aligned" | "outcome-worse-than-decision",
  "brier_increment": { "predictions": [...], "cumulative_average": <float> },
  "assumed_invariants_status": { "<inv1>": "still valid" | "violated", ... },
  "successor_action": "new_brief:<new_id>" | "affirmed" | "deferred:<new_date>",
  "v06_slots_filled": { "evaluation_lenses": <bool>, "recommended_methodology": <bool>, "maturity_anchor": <bool>, "term_pairing": <bool> } }
```

### 4.1 v0.6 추가 retrospective 지표 (해당 슬롯이 채워진 결정 한정)

- **`evaluation_lenses` 가 있던 결정**: 각 lens 의 verdict (below/at/above) 가 실제 결과와 정렬됐는지 lens-by-lens 평가. 일치 lens / 불일치 lens 카운트 retrospective 에 기록.
- **`recommended_methodology` 가 있던 결정**: 박제된 방법론이 retrospective 시점에도 여전히 적용 가능한지 (`applicability` 검증). 방법론 자체의 수명도 추적.
- **`maturity_anchor` 가 있던 결정**: `current_score` vs `threshold` 의 gap 이 결정 당시 vs revisit 시점 사이에 어떻게 변했는지 (gap 축소 / 확대 / 유지). `verdict` (meets/near/short) 변화 기록.
- **`term_pairing` 이 있던 결정**: `retroactive_apply` 가 prompt/Y 였다면 실제 소급 적용이 surface (D/B/R) 에 일관되게 반영됐는지 점검 (C 는 자동 forward 라 점검 외).

## 5. Lineage propagation

If `successor_action == "new_brief:<new_id>"`:

- The new brief's `parent_decision_ids[]` MUST include this `decision_id`.
- This decision's `status` flips to `"superseded_by:<new_id>"`.
- **v0.6**: 후속 brief 가 v0.6 schema 로 발행되면, 부모 결정의 `evaluation_lenses` / `recommended_methodology` / `maturity_anchor` 를 inherit 가능 (skill `hyperbrief` 가 부모 IR 참조 시 신규 슬롯도 후보로 surface).

If `assumed_invariants_status` shows any violation:

- All descendant decisions (decisions whose `parent_decision_ids[]` contains this id) MUST be revisited next.
- Auto-queue them to the top of the revisit queue.

## 6. Constellation integration

If Constellation is present:

- Emit `CUSTOM/HyperbriefRevisit` card to the user-board for inline rendering.
- POST the completed retrospective to `/api/decisions/<id>/retrospective`.
- Subscribe to `/api/decisions/stream` for live invalidation events.
- **v0.6**: `term_pairing.scope` 에 `B` (board) 포함된 결정이 revisit 될 때, 보드 채널로 re-emit 신호 전송 (소급 적용 surface 갱신 트리거). `retroactive_apply == "Y"` 면 자동, `"prompt"` 면 사용자 확인 후.

## 7. Standalone mode

- Write retrospective JSON to `.agent/_decisions/<id>.retro.json`.
- Update `.agent/_decisions/<id>.json` with `status` change.
- If `successor_action == new_brief`, invoke the `hyperbrief` skill with `parent_decision_ids` pre-populated.
- **v0.6**: v0.5.6 IR 을 revisit 후 신규 슬롯 일부를 채워 갱신하는 경우, 원본 ledger 항목은 `schema_version` 만 `0.6.0` 으로 bump 하고 신규 슬롯 append. 기존 필드는 건드리지 않음 (in-place additive migration).

## 8. Anti-patterns

- **Outcome-decision quality conflation** (anti-pattern AF-17): a bad outcome from a reasonable decision is a calibration signal, NOT a decision-quality failure. Surface this distinction to the user (question 7 above is the gate).
- **Hindsight-bias retrofit**: do NOT let the user re-grade the decision higher just because the outcome was good (or lower because bad). Question 7's framing ("그 시점에 그 정보로") is the debias.
- **Stale revisit ignore**: if `revisit_date - now > 30d` (overdue more than 30 days), surface it as a `[stale-revisit]` flag, do not silently skip.
- **v0.6 슬롯 강제 채움**: v0.5.6 vintage 결정의 빈 신규 슬롯을 retrofit 강제 금지. 옵션 질문은 skip-by-default. 빈 슬롯 = 흠결 NOT, 단지 그 결정이 그 차원에서 평가되지 않았다는 사실 기록일 뿐.
- **Schema-version drift silent**: revisit 시점에 schema version mismatch (decision v0.5.6 / current v0.6.0) 를 ledger 에 기록하지 않고 silent migrate 금지. `schema_version_at_decision` + `schema_version_at_revisit` 양쪽 명시.

## Reference

Full spec: https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md (§9 Decision Capture + §5 Epistemic Discipline → Brier loop)
v0.6 change log: Hyperbrief.md frontmatter + CHANGELOG.md entry for v0.6.0 minor bump (additive 4 slots, back-compat).
