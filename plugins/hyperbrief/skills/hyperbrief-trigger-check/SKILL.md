---
name: hyperbrief-trigger-check
version: 0.6.0
description: ALWAYS run BEFORE composing any message that asks the user for a decision, approval, or choice. Cheap escalation rubric (4-score + 5 MUST-trigger conditions) that returns one of {AUTONOMOUS_DECIDE, FULL_HYPERBRIEF, MINIMAL_BRIEF, BLOCK_FRAMING}. Triggered by message-intent patterns ('괜찮을까요','할까요','should we','which option','approve','confirm','choose between','OK to') OR by Superscalar opening a write/deploy/send lane OR by inbound Constellation DECISION_REQUEST. Also routes audience-profile commands (tone L<n>.<n>.<n> + term_pairing L<n>.{E|I|N}.{C|D|B|R|A}[!|?]) to the hyperbrief skill for AudienceProfileFallback population. Invokes the full hyperbrief skill ONLY when outcome != AUTONOMOUS_DECIDE. Skip for pure read-only fan-outs.
---

# Hyperbrief Trigger Check — the escalation gate

You are about to ask the user a decision question, OR Superscalar just opened a write/deploy/send lane, OR an inbound `DECISION_REQUEST` arrived. **Before composing the message**, run this 30-second rubric.

## 1. Trigger detection

Run this skill if ANY of these apply:

- Next assistant message will contain `괜찮을까요` / `할까요` / `should we` / `which (one|option)` / `approve` / `confirm` / `choose between` / `OK to` / similar decision-soliciting patterns.
- Superscalar fan-out just opened a `write`/`deploy`/`send` lane (Superscalar's irreversibility barrier touches a default-forbidden action).
- Inbound A2A is `CUSTOM/DECISION_REQUEST` requiring response.
- About to call `AskUserQuestion` tool.

**Skip** if:

- All fan-out lanes are read-only (no side effects).
- This is a continuation of an already-decided plan within the same approved Phase (Constellation §4: "no confirming planned dispatch").

## 1.5 Audience-profile command routing (v0.6+)

Independent of the escalation rubric, certain user inputs are **audience-profile commands** that must be forwarded to the `hyperbrief` skill (which owns `AudienceProfileFallback` IR population) for parsing + persistence, regardless of whether a decision is being made.

Recognized command shapes (parse BEFORE the escalation rubric; if matched, route AND continue):

- **Tone profile**: `L<a>.<b>.<c>` (e.g. `L1.1.1`, `L2.2.2`) — sets `audience_profile_fallback.tone_profile`.
- **term_pairing command** (v0.6, additive): `L<a>.<mode>.<scope>[suffix]` where:
  - `mode` ∈ `{E, I, N}` (every / initial / none).
  - `scope` ∈ `{C, D, B, R}` (conversation / document / board / review) — multi-scope via `+` (e.g. `C+B`), or shortcut `A` (= `C+D+B+R`).
  - optional `suffix`: `!` (force retroactive_apply = Y), `?` (force retroactive_apply = prompt).
  - Examples: `L1.I.C` / `L1.E.A` / `L2.N.D` / `L1.I.C+B` / `L2.E.D!` / `L1.I.A?`.
- **Combined** (single token, dot-chained): tone command followed by term_pairing command in the same utterance — both apply.

Routing behavior:

1. Capture the matched command token(s) verbatim.
2. Invoke the `hyperbrief` skill with `{audience_profile_command: "<token>", caller_context: "trigger-check-routed"}` regardless of the escalation verdict below.
3. The `hyperbrief` skill is responsible for: command parsing → `AudienceProfileFallback` population (incl. `term_pairing.mode/scope/retroactive_apply`) → low-frequency override (≤3 occurrences in scope unit → I mode still pairs every occurrence) → C-scope auto-forward semantics (conversation scope skips retroactive prompt; documents/board/review honor `retroactive_apply`) → dictionary resolution (`dictionary_ref` or `dictionary_inline`, placeholder if absent).
4. Then proceed with the escalation rubric (§2-§6) for whatever else the user message contains.

If the user message is **only** an audience-profile command (no decision content), the verdict is `AUTONOMOUS_DECIDE` (profile updates are reversible, in-scope, agent-decider).

## 2. Escalation 4-score (each 0-3)

| Indicator | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| **Irreversibility** | trivially reversible | reversible with effort | reversible with migration cost | one-way |
| **Blast radius** | single file / local | one module | cross-module | cross-system / external |
| **Time horizon** | minutes | hours | days | weeks+ |
| **Reversal cost** | free | low | moderate | severe |

`escalation_sum = irreversibility + blast_radius + time_horizon + reversal_cost`.

## 3. MUST-trigger conditions (any one → FULL_HYPERBRIEF regardless of sum)

1. `irreversibility_score >= 2`.
2. Blast radius crosses a module boundary (`touched_contracts` non-empty OR `touched_external_consumers` non-empty).
3. Any `touched_external_consumers` requires out-of-band notification.
4. Resource estimate exceeds threshold (tokens > 200k OR money > $50 OR time > 4h OR new external API/service).
5. Decision supersedes a `parent_decision_id` of an existing decision.

## 4. Cynefin domain classification (4 quick questions)

| Question | Yes → |
|---|---|
| Is the cause-effect relationship known and well-documented (best practice exists)? | `clear` |
| Is it knowable through expert analysis (good practice exists)? | `complicated` |
| Are cause-effect only knowable in retrospect (probe-sense-respond)? | `complex` |
| Is the situation rapidly destabilizing (act-sense-respond)? | `chaotic` |
| If none of the above clearly applies | `confused` |

## 5. RAPID Decider identification (1 question)

"Who has formal authority + accountability for this decision's outcome?" Common answers:
- `user` — default for product/governance/identity decisions.
- `agent` — for low-stakes, fully reversible, in-scope-of-plan actions.
- `external` — escalation needed beyond user (legal, compliance, partner).

If Decider != `user` AND escalation_sum >= 4, route is still `FULL_HYPERBRIEF` but `rapid.decider` records the actual authority.

## 6. Routing decision

```
if cynefin_domain == "confused":
    return BLOCK_FRAMING
    # Emit DECISION_REJECT_FRAMING to self / user with reason "domain unclear; clarify first".
    # Do NOT proceed to a brief — domain confusion must be resolved before option enumeration.

if cynefin_domain == "chaotic":
    return MINIMAL_BRIEF
    # Single action card. §7 domain_format = "single_action_card".
    # Skip §3 / §5 details. Auto-schedule 24h retrospective via hyperbrief-revisit.

any_must_trigger = (
    irreversibility_score >= 2
    OR blast_radius_crosses_module
    OR external_consumer_needs_notification
    OR resource_above_threshold
    OR supersedes_prior_decision
)

if escalation_sum >= 4 OR any_must_trigger:
    return FULL_HYPERBRIEF
    # Invoke the `hyperbrief` skill with the staged generation pipeline.

return AUTONOMOUS_DECIDE
    # Decide autonomously + post-notify in ONE line (no brief, no question).
    # Format: "[decided autonomously, sum=<n>] <one-line summary of action + reversal path>"
```

## 7. Anti-trigger / suppression rules

- **Alert-fatigue self-throttle**: if rolling 20-cycle stats show `user_acceptance_rate > 70% AND user_premortem_input_avg_length < 30 chars`, raise the threshold from 4 to 5 for the next 10 cycles and emit a self-warning card to the user.
- **Time-pressure fallback**: if `deadline - now < 1h` AND `FULL_HYPERBRIEF` triggered AND full IR generation would exceed remaining time → emit `DECISION_DEFER` with reason "insufficient time for proper hyperbrief; recommend deadline extension OR autonomous-decision-with-post-notify acceptance" and surface the trade-off. **Do NOT shortcut sections** — partial briefs are worse than no brief.
- **Frame-rejection routing**: if user previously chose `reject_framing` on a parent decision, do NOT silently retry with a slightly-modified frame (anti-pattern AF-1 in Hyperbrief.md §6). Surface the parent's `reframing_reason` first.

## 8. Output contract

Return a structured handoff to the caller:

```jsonc
{
  "verdict": "AUTONOMOUS_DECIDE" | "FULL_HYPERBRIEF" | "MINIMAL_BRIEF" | "BLOCK_FRAMING",
  "escalation_sum": <int 0-12>,
  "scores": { "irreversibility": <0-3>, "blast_radius": <0-3>, "time_horizon": <0-3>, "reversal_cost": <0-3> },
  "must_triggers_fired": [ /* names of any conditions in §3 that fired */ ],
  "cynefin_domain": "clear" | "complicated" | "complex" | "chaotic" | "confused",
  "reversibility_class": "two_way" | "one_way_with_migration_path" | "one_way",
  "rapid_decider": "user" | "agent" | "external",
  "autonomy_refusal_reason": "<1 line — why this is not autonomous>", // null if verdict == AUTONOMOUS_DECIDE
  "audience_profile_command": "<token>" | null  // v0.6+: captured tone/term_pairing command if matched in §1.5; null otherwise
}
```

If `verdict == FULL_HYPERBRIEF` or `MINIMAL_BRIEF`, immediately invoke the `hyperbrief` skill with this handoff as context. If `verdict == AUTONOMOUS_DECIDE`, proceed with the decision and emit the one-line post-notify. If `verdict == BLOCK_FRAMING`, surface domain confusion to the user before any option enumeration. If `audience_profile_command != null`, the `hyperbrief` skill must also be invoked for command parsing + AudienceProfileFallback population (orthogonal to the verdict path).

## 9. Back-compat (v0.6 cut)

- v0.5.6 callers that do NOT emit an `audience_profile_command` field: unchanged behavior. The §1.5 routing simply does not fire (no match → no command captured → null in output).
- v0.5.6 IR shapes remain valid against the v0.6 schema (all 4 new slots are optional): `section_0_decision_header.evaluation_lenses`, `section_8_recommendation.recommended_methodology`, `maturity_anchor` (top-level), `audience_profile_fallback.term_pairing`. This skill does not depend on those slots being populated.
- New `version` field in frontmatter (`0.6.0`) is informational; callers that pin `name: hyperbrief-trigger-check` resolve unchanged.

## Reference

Full spec: https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md (§2 Trigger Rubric, §5.6 Audience Profile, §11.5 Readiness Rubric)
