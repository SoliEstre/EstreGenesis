---
name: hyperbrief-revisit
description: Invoke when a stored Hyperbrief decision's revisit_date is reached, OR when an assumed_invariant in decision_lineage is violated by recent A2A signals, OR at session-start / Stop hook / 6h cron tick to scan the ledger. Loads the original IR, prompts user for actual outcome, computes outcome-quality vs decision-quality delta (Brier score increment), appends retrospective to ledger, supersedes/affirms decision_id chain. Closes the learning loop that fire-and-forget briefs leave open.
---

# Hyperbrief Revisit — close the learning loop

You are scanning the decision ledger for decisions whose `revisit_date` has arrived (or whose `assumed_invariants` have been violated), OR a specific `decision_id` has been handed to you for review.

## 1. Trigger conditions

Run this skill if ANY of these apply:

- Session-start / Stop hook / 6h cron tick → scan ledger for `revisit_date <= now AND outcome_actual == null`.
- Inbound A2A signal contradicts an `assumed_invariant` in any active decision's lineage.
- User explicitly invokes `/hyperbrief revisit <decision_id>`.
- `hyperbrief` skill's parent-decision check found a stale parent.

## 2. Ledger scan

Locate the ledger at one of:

- Standalone: `.agent/_decisions/*.json` (one file per decision_id).
- Constellation-integrated: Constellation `state.json` → `decisions[]` array, OR SSE endpoint `/api/decisions/stream`.

For each entry where `revisit_date <= now AND outcome_actual == null`:

1. Load the original IR (full JSON).
2. Surface to the user as a `HyperbriefRevisit` card (or inline text in standalone mode).
3. Block other low-priority work until the user responds (revisit > new work).

## 3. The 8-question retrospective

Ask the user, ONE question at a time (avoid framing-effect batching):

1. **Outcome** — "이 결정의 실제 결과는 어땠습니까? 1-2 문장으로." (Free-form text → `outcome_actual`.)
2. **Confidence delta** — "결정 당시 confidence는 `<original_confidence.point_estimate>` 였습니다. 지금 돌아보면 적절했습니까? (under-confident / well-calibrated / over-confident)"
3. **Falsifier check** — "결정에 부착된 falsification trigger (`<what_to_observe>` at `<when>`, threshold `<threshold>`)는 trip 됐습니까? (yes / no / not yet measurable)"
4. **Assumed-invariant check** — "결정 당시 가정 (`<assumed_invariants[]>`)은 여전히 유효합니까? 위반된 것이 있다면 어떤 것?"
5. **Pre-mortem hit** — "결정 당시 pre-mortem 시나리오 (`<pre_mortem_scenarios[].failure_path>`) 중 실제로 발생한 것이 있습니까?"
6. **Defeater check** — "결정 당시 defeaters (`<defeaters[]>`) 중 fire된 것이 있습니까?"
7. **Decision quality** — "결과의 좋고 나쁨과 별개로, *그 시점에 그 정보로* 결정 자체는 합리적이었습니까? (Y/N + 이유)"
8. **Successor decision** — "이 결정을 supersede 하거나 affirm 하는 후속 결정이 필요합니까? (yes — open new hyperbrief / no — affirm / partial — defer to next checkpoint)"

## 4. Brier increment computation

For each `toulmin_predictions[]` and `§8.confidence` that has a `point_estimate`:

```
brier_increment = (actual_outcome_binary - point_estimate)^2
```

Append the increment + cumulative average to the ledger entry:

```jsonc
{ "decision_id": "hb-...",
  "outcome_actual": "<user text>",
  "decision_quality": "reasonable" | "premature" | "biased" | "lucky",
  "outcome_quality_vs_decision_quality_delta": "outcome-better-than-decision" | "aligned" | "outcome-worse-than-decision",
  "brier_increment": { "predictions": [...], "cumulative_average": <float> },
  "assumed_invariants_status": { "<inv1>": "still valid" | "violated", ... },
  "successor_action": "new_brief:<new_id>" | "affirmed" | "deferred:<new_date>" }
```

## 5. Lineage propagation

If `successor_action == "new_brief:<new_id>"`:

- The new brief's `parent_decision_ids[]` MUST include this `decision_id`.
- This decision's `status` flips to `"superseded_by:<new_id>"`.

If `assumed_invariants_status` shows any violation:

- All descendant decisions (decisions whose `parent_decision_ids[]` contains this id) MUST be revisited next.
- Auto-queue them to the top of the revisit queue.

## 6. Constellation integration

If Constellation is present:

- Emit `CUSTOM/HyperbriefRevisit` card to the user-board for inline rendering.
- POST the completed retrospective to `/api/decisions/<id>/retrospective`.
- Subscribe to `/api/decisions/stream` for live invalidation events.

## 7. Standalone mode

- Write retrospective JSON to `.agent/_decisions/<id>.retro.json`.
- Update `.agent/_decisions/<id>.json` with `status` change.
- If `successor_action == new_brief`, invoke the `hyperbrief` skill with `parent_decision_ids` pre-populated.

## 8. Anti-patterns

- **Outcome-decision quality conflation** (anti-pattern AF-17): a bad outcome from a reasonable decision is a calibration signal, NOT a decision-quality failure. Surface this distinction to the user (question 7 above is the gate).
- **Hindsight-bias retrofit**: do NOT let the user re-grade the decision higher just because the outcome was good (or lower because bad). Question 7's framing ("그 시점에 그 정보로") is the debias.
- **Stale revisit ignore**: if `revisit_date - now > 30d` (overdue more than 30 days), surface it as a `[stale-revisit]` flag, do not silently skip.

## Reference

Full spec: https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md (§9 Decision Capture + §5 Epistemic Discipline → Brier loop)
