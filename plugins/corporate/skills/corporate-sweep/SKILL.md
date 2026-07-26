---
name: corporate-sweep
version: 0.1.0
description: "Use to run the eviction sweep that keeps a durable-role organization from growing monotonically — raising seats that no longer justify themselves, per Corporate.md. Invoke on the declared cadence, whenever a dynamic organization is at its seat ceiling and something new wants a seat, or when the organization feels larger than the work. Evaluates the candidate tests, raises candidates to the human gate surface with a briefing, and never removes a seat on its own authority. Required machinery for any dynamic organization: automating growth without automating shrinkage is a one-way ratchet."
---

# Corporate Sweep — the shrink half of the mechanism

Spec SSoT: `Corporate.md` §7.4 (eviction procedure) and §7.5 (why a dynamic organization must automate this). This skill is the sweep; **disposal is the human's** (§12).

**Why this exists.** Creation fires on a signal that occurs often — work arrives that no current seat fits. Dissolution fires on a signal that requires *looking back* — nothing happened here for a while. An unautomated backward-looking check does not run, so an organization with automated creation and manual eviction grows monotonically, and every surviving seat taxes every future decomposition. That is framework gravity applied to an org chart.

## 1. Gather ground truth

- The roster `.agent/corporate.json` — seats, `createdFor`, `seatCeiling`, residency classes.
- Per-seat evidence: delegations received, locker deliverables produced, practice entries attributable to the seat, budget consumed. **Counts come from executing a command, never from estimation** — a miscounted sweep argues for the wrong eviction.
- The resource axis as it stands *now* (§4), which may have changed since the roster was written.

## 2. Evaluate the candidate tests (§7.4)

Any one is sufficient to **raise** a candidate. None is sufficient to act.

1. **No practice** — zero practice entries attributable to the seat over N cycles (§8.3: one signal read in both directions — practice implies a seat, absence of practice implies its removal). **Two exclusions, or this test manufactures candidates.** A seat that declares no `owns[]` boundary cannot be attributed practice at all, so its zero is a property of the measurement rather than of the seat; and a seat that has never been staffed has had no opportunity to accumulate, so its zero dates from the roster rather than from disuse. Both are reported as unmeasurable, and the N-cycle window for a staffed seat starts at staffing, not at declaration.
2. **No delegations** — nothing routed to the seat over N cycles.
3. **Covered elsewhere** — its duty falls entirely inside another seat's boundary. This is a **merge**, not a deletion: say which seat absorbs it.
4. **Unaffordable** — the resource axis no longer funds its residency class even at the lowest rung.
5. **Reason no longer restatable** — `createdFor` names a signal that has since stopped holding, or the seat has no `createdFor` at all (§7.5-4).

State N explicitly in the report rather than implying it. A sweep whose window is undeclared cannot be argued with.

## 3. Raise, never remove

Route each candidate to the **same gate surface as every other decision** (§12) — a live board's decisions panel with a briefing, or the file-backed panel where there is no board. The briefing gives: the seat, which test fired, the evidence with its counts, what absorbs the duty if anything, and the cost of keeping it.

**Automatic creation with automatic destruction is a system that reorganizes itself while nobody is reading.** The sweep produces a list. A human disposes.

## 4. Execute an approved eviction (§7.4)

In order, and none of it optional:

1. **Archive the desk** — the private working directory is retired, not deleted in place.
2. **Retain the locker.** The record outlives the seat. Other seats' records reference its deliverables, and breaking those references to tidy the chart trades one visible seat for invisible dangling pointers.
3. Remove from the roster.
4. **Re-wire reporting edges** — anything that reported to the seat now reports somewhere real. An orphaned edge is worse than a retired seat.
5. Emit the chart change (`CorporateChart`, latest-wins) so the board stops rendering a seat that no longer exists.
6. **Record the reason** where the decision is auditable.

## 5. Ceiling arithmetic

If the organization is dynamic and at `seatCeiling`, the next creation is **conditional on an eviction**. Present the trade explicitly — which seat leaves so this one can exist. Without a ceiling, "we will prune later" is the only policy, and it is not one.

## Report

Candidates raised (with the test that fired and the counts) · evictions executed under prior approval · seats confirmed healthy · the window N used · seat count against ceiling. **A sweep that changes nothing should say why** — a healthy organization is a real result, and stating it is what makes the next sweep's finding credible.
