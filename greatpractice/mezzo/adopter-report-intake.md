---
# === v0.1 lint-required ===
id: adopter-report-intake
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "an adopter, downstream peer, or port sends a dogfood report, a spec-gap report, a port report, or a «is this intended?» observation"
  then: "① reproduce at HEAD and confirm the MECHANISM, not just the symptom (walk the whole predicate path, not the quoted line) ② split the findings into patch-tier (same cut) and spec-tier (own cut, sequenced) ③ add the self-detecting check FIRST and show it catching the violation, then fix ④ close the loop: reply with cut details, ship the regression harness so they can run the same assertions, and ask for their measured list of the shared surface"
  format: command-check-decision
  source: stop-hook
lifecycle: consolidation
last_referenced_turn: 2026-09-05T00:00:00Z

# === lint-warn ===
title: Adopter Report Intake — verify the mechanism, split the tiers, guard first, close the loop
slug: adopter-report-intake
created_at: 2026-09-05T00:00:00Z
ratified_at: 2026-09-05T00:00:00Z
source_evidence:
  - CHANGELOG v2.5.138 → v2.5.140 (2026-07-09/10) — first full upstream↔adopter round trip: a headless hub-main adopter's reports B1–B4 and G1–G8 landed as three cuts, and the adopter's own §13.27 runtime was upstreamed
  - CHANGELOG v2.5.189 → v2.5.199 (2026-07-20/21) — eleven cuts in two days from three adopters, every one through the same pipeline (report → reproduce → cut → adoption verified at drift 0 → verbatim archive); v2.5.198 turned a pipeline by-product into contract §5.5 (pristine-copy adopters as a reference↔live drift sensor)
  - CHANGELOG v2.5.196 / v2.5.197 — the reconnect latch and cursor-hold fixes, both found because a second adopter cross-verified a first adopter's fix rather than trusting it
  - constellation/reference/runtime/scripts/keymgmt-authz-smoke.cjs — the regression harness shipped WITH the fix so the reporting adopter could run the same 24 assertions; loop-close as «you can check it too», not «we fixed it»
  - Greatpractice.md §5.4 (notability gate — 4+ independent tracks across distinct domains: migration, plugin schema, protocol, authz)

evidence_quality: high
recommendation_strength: SHOULD

maturity_score:
  frequency: 4
  depth: 4
  recency: 4
  cost: 5
  predictability: 3
  # sum: 20/25 ≥ 18 threshold ✓
  # frequency 4: every adopter contact since 2026-06-26; not daily, but never skipped once an adopter is joined
  # depth 4: four ordered steps with a sequencing rule (guard before fix) — mezzo-grade, not an atom
  # recency 4: last full instance 2026-08-01 (port report turned into an upstream audit); intake volume dropped in August as the adopter set stabilized
  # cost 5: a report reproduced only at the symptom level ships a fix that leaves the cause in place (measured: a «requireKey=false» diagnosis whose real cause was a reasonless socket close under requireKey=true)
  # predictability 3: steps ②–④ are mechanical; step ① is judgement (see phronesis_boundary)

last_validated_at: 2026-09-05T00:00:00Z
validation_cadence_days: 90
freshness_until: 2026-12-04T00:00:00Z
freshness_inherits_from: null

coherence: soft
edit_policy: owned
owner: EG-maintainers
audit_trail:
  - {ts: 2026-09-05T00:00:00Z, agent: claude-fable-5-1, action: create, prev_hash: null}
  - {ts: 2026-09-05T00:00:00Z, agent: claude-fable-5-1, action: ratify, prev_hash: null}

supersedes: []
superseded_by: null
kaizen_baseline_since: 2026-07-11
revision_history:
  - {ts: 2026-09-05T00:00:00Z, type: created, by: claude-fable-5-1, cost_tier: null}
  - {ts: 2026-09-05T00:00:00Z, type: ratify, by: claude-fable-5-1, cost_tier: null, note: "v2.6.120 — promoted from a probation memory practice (captured 2026-07-11, refined 2026-07-25 and 2026-08-01) at recommended (warn) level; the earlier draft slot named in the index was never written, so this file is the first codified form"}

surfaces:
  - {kind: spec, path: Constellation.md, inherits_freshness: false}
  - {kind: runtime, path: constellation/reference/runtime/scripts/keymgmt-authz-smoke.cjs, inherits_freshness: false}

parent: []
children:
  # Micro decomposition candidates — not yet written
  # - greatpractice/micro/reproduce-mechanism-at-head.md
  # - greatpractice/micro/guard-before-fix.md
  # - greatpractice/micro/loop-close-with-harness.md

phronesis_boundary: true
class: persistent

hash: null
deps: []
rrpv: 2
miss_count:
  compulsory: 0
  capacity: 0
  conflict: 0
  coherence: 0

_ratified_state:
  origin_cycle: v2.6.120
  revision_cycle: v2.6.120
  ratification_cycle: v2.6.120
  ratification_trigger: user_steering (Greatpractice §5.4 routing path b — promotion of a probation memory practice that had met the notability gate)
  notability_gate: pass
  maturation_gate_score: 20/25
  post_codify_evidence:
    n_data_points: 0
    validation_status: 'pre-codify evidence only (4+ tracks, 2026-06-26 → 2026-08-01); first post-codify instance pending the next adopter report'
  acknowledged_risk:
    - 'step ① is judgement-heavy — the warning can remind the maintainer to confirm the mechanism, it cannot confirm it for them; phronesis_boundary is set for that reason'
    - 'step ③ (guard before fix) costs a cut of latency on every intake; the measured payoff (a plugin-schema axis catching 18 violations on its first run) justifies it for spec-tier findings, less clearly for one-line patches'
    - 'the reverse direction — a port report auditing the upstream — is recorded in the body but not in the trigger; it fires on the same event, so the trigger covers it, but a future revision may want it as its own clause'
---

# Adopter Report Intake — verify the mechanism, split the tiers, guard first, close the loop

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b). `enforcement_level: recommended` and `phronesis_boundary: true` — the pipeline's ORDER is codified; the diagnosis inside step ① is not, and a warning that tries to do the diagnosis would be worse than none.

## §1. Problem Surface

An adopter's report is a snapshot from the moment they looked, taken from inside their copy. It is usually right about the symptom and often one layer off about the cause — measured: a report diagnosed «`requireKey=false` accepts the connection and nulls the permissions, so targeted A2A drops silently»; the real cause was `requireKey=true` closing the socket without a reason, with the frames pipelined behind HELLO lost at the transport. Reproducing the symptom and applying the proposed fix would have shipped a change and left the cause in place. A second report of the same shape found that the authz gate only judged connections that had sent HELLO — the reported defect was the visible half of a larger hole.

Two more things the intake keeps losing without a rule: findings of different weight end up in the same cut (a one-line patch waiting on a spec section, or a spec change smuggled into a patch), and the loop closes with «fixed» instead of with something the reporter can verify.

## §2. Practice Body — Command / Check / Decision 3-tuple

**Command** — on receipt:

1. **Reproduce at HEAD, confirm the mechanism.** Re-run the claim against the current code. Walk the whole path that makes the reported predicate true — not only the quoted line. Read the reporter's «question» sections as carefully as the «finding» sections; an observation sent without confidence («is this intended?») has twice been a separate defect. Tell reporters explicitly that low-confidence observations are wanted.
2. **Split the tiers.** Patch-tier (a bug, same cut) vs spec-tier (a new section or contract change, its own cut, sequenced after whatever it depends on). Write the split down before touching code.
3. **Guard before fix.** Add the check that would have caught it (an N-way axis, a smoke, a lint) and run it red on HEAD. Then fix, and run it green. A guard added after the fix has never been seen failing.
4. **Close the loop.** Reply with the cut identifiers and what was NOT done (what was left out, what was removed and why — the removed gate has been the more useful half of a reply once). Ship the regression harness in the reference so the reporter can run the same assertions. When the report touches a surface both sides implement (a filter set, a frame field, a name convention), ask for their measured list and compare — each side's own list is always consistent with its own emitter, so only the exchange finds the gap; if one appears, promote the list to a spec table and let each side keep its own parity check.

**Check** — four artifacts exist before the reply goes out: a reproduction note naming the mechanism, a tier split, a guard that was red then green, and a reply that names cuts and omissions.

**Decision** — any artifact missing → the intake is not done; do not send «fixed». A reproduction that only matches the symptom → back to step 1.

## §3. Evidence

- **Round trip 1** (v2.5.138–v2.5.140): a headless hub-main adopter's B1–B4 and G1–G8 reports; the adopter's own runtime was upstreamed in the third cut. First complete upstream↔adopter cycle.
- **Round trips at volume** (v2.5.189–v2.5.199): three adopters, eleven cuts in two days, each closed the same day at drift 0; two by-products became contract text (§5.5 pristine-copy adopters as a drift sensor; the blocked-not-failed classification).
- **Mechanism vs symptom** (2026-07-25, five cuts): the `requireKey` diagnosis above; the gate that judged only HELLO-bearing connections; a «question» that was a stale-presence defect; the 24-assertion authz smoke shipped with the fix.
- **The reverse direction** (2026-08-01): a port report that said «we also added the forwarded check on the board surface» pointed at the same place upstream — and a critical defect was there. The port was stronger than the original at one spot and exposed it. Corollary for the reply: send «what we did not do / removed / why», because success-only reports let the other side walk into the same trap.

## §4. Boundary

`phronesis_boundary: true`. Steps ②–④ are order and artifacts, and a hook can warn when they are skipped. Step ① is the part that cannot be reduced to a check — the whole point of it is that the reporter's framing may be wrong, and no rule tells you which layer the truth is on.

## §5. Composition

- Upstream of this entry: nothing codified yet; the natural macro parent is a communication-discipline entry that does not exist as a file (the index once listed one — corrected in this cut).
- Sibling: `a2a-relay-echo-verify` (the loop-close reply is an emit; that entry makes sure it left the building).
- Related spec: Constellation.md §13.16 (A2A intents, incl. the report/ack shapes the reply uses).
