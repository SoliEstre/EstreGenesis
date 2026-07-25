---
name: corporate-status
version: 0.1.0
description: "Use to report or declare the current state of a durable-role organization — which seats exist, what each is doing, and which toggles actually apply to each — per Corporate.md. Invoke when asked how the organization stands, after any seat changes state, on reconnect to a live board, or before delegating work so the target seat's real posture is known. Resolves the three-layer toggle chain through the single resolver (never by reading a layer directly), then emits CorporateChart and RoleState so a board renders declared truth instead of inference. Reports absence as unknown rather than as idle."
---

# Corporate Status — resolve, then declare

Spec SSoT: `Corporate.md` §5 (toggle resolution), §10 (wire declarations), §11 (projection). Constellation §13.33 carries the wire side.

## 1. Resolve toggles through the resolver only (§5.2)

```
node plugins/corporate/resolve.cjs --role <role> --json
node plugins/corporate/resolve.cjs                     # organization layer
```

**Never read `.agent/superscalar.json`, `.agent/subscaler.json`, a group's `overrides`, or a desk's `toggles.json` directly.** Many layers, exactly one resolver — that is the discipline that keeps a precedence chain from degenerating into mirrored state. The resolver returns `resolved` plus `provenance` naming the winning layer per toggle, so you can explain *why* a value holds without touching a layer yourself.

If `.agent/corporate.json` is absent the resolver takes the identity path (§5.4) and returns the organization layer verbatim — which is the correct answer for a project that has not adopted Corporate. That is not an error and needs no comment.

To re-verify the invariant itself: `node plugins/corporate/resolve.cjs --selftest`.

## 2. Declare, do not narrate (§10)

Two events, both in Constellation's declaration class — change-triggered, latest-wins, server-persisted, machine-consumed noise for humans. **Never periodic.**

- **`CorporateChart`** — emitted by `main` only. Structure: `org`, `hosts[]`, `roles[]`, `links[]`, `groups[]`, `rooms[]`. Re-emit on every structural change **and on every reconnect** (idempotent + latest-wins makes the reconnect announce free, and a fresh server has no memory of prior declarations).
- **`RoleState`** — per seat, or by `main` on the seat's behalf: `{ role, status, task?, taskRef?, since, blockReason?, budgetUsed? }`. `status` ∈ `idle | working | blocked | waiting-gate | offline`.

Two rules that decide whether the declaration is worth anything:

- **Declare only measured truth.** Report what you can actually observe. A harness that cannot measure its own per-request effort omits `effort` rather than guessing it. An omitted field is honest; a plausible one is not.
- **Declare resolved values only** (§5.3). What goes on the wire is the output of step 1, never one layer of the chain. A status surface asserting an unresolved layer reads as truth and is worse than an empty one.

Point `taskRef` at a board entry id where one exists, so the chart and the work registry agree **by reference** rather than by restating each other.

## 3. Report

For each seat: role, status, current task one-liner, tier/model/effort **as resolved**, residency class, host, and budget consumption if declared. Then the organization view: seat count against `seatCeiling` if one is declared, the residency mix, and any seat whose state has not been declared recently.

**Absence is not idleness** (Constellation §13.33.3-1). A seat with no recent `RoleState` is **unknown**, and must be reported that way. Rendering or reporting unknown as idle is the render-fallback failure in a new place: the surface looks healthiest exactly when the data is missing.

**No fabrication.** A field the roster does not carry is absent, not defaulted. If the roster is missing, say the organization is undeclared rather than describing one.
