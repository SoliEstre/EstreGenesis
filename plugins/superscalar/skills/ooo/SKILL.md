---
name: ooo
description: "Out-of-order execution for the main lane — when a question arises mid-task, don't stall: register it as a one-line entry on a question scoreboard, resolve it yourself where a measurement can, bypass it otherwise, and keep executing everything that doesn't depend on it. Late answers steer the affected slice only. Includes an always-on toggle (/ooo on|off|status) and optional Constellation decisions-panel projection. Loss/external-publish gates are never bypassed."
---

# /ooo — question-scoreboard execution (비순차실행)

Superscalar §2 reorders **sub-agent lanes** around data hazards. The main lane itself still stalls on its most common hazard: a question to the human. Ask-and-wait is an in-order pipeline with one very slow operand — and human response latency is this module's founding bottleneck. `/ooo` gives the main lane's questions the same treatment the lanes already get: **a blocked item waits; the queue does not.**

Normative spec: `Superscalar.md §5.3`. This skill is the procedure.

## 1. Toggle contract

- State = **one marker file**: `.agent/ooo.json` — `{"on": true}`. Absent ⇒ off. No mirrors (§5.1's state-convergence lesson).
- `/ooo on` writes it · `/ooo off` removes it · `/ooo status` reads it back and reports the current scoreboard if one is open.
- **Default OFF** — the standing posture stays ask-and-wait unless the workspace opts in. ON is standing: every task runs with the scoreboard, no per-task ceremony.
- A one-shot `/ooo` invocation on a specific task runs that task under the scoreboard without writing the marker.

## 2. The scoreboard

When a question arises mid-task, register **one line** instead of stopping:

```
Q<n> · <the question, one line> · blocks: <item(s)> · meanwhile: <what proceeds / interim default>
```

The one-line format is a contract, not a style: if it won't compress to a line, it isn't a question — it's a decision, and it routes through the Hyperbrief trigger rubric (§3.1 interlock) instead. The compression is also what makes answering cheap: the human can answer any subset, in any order, whenever they surface.

**Question-inflation guard**: a question whose every answer leads to the same next action is not a question. Drop it before it costs anyone a read.

## 3. Resolution ladder (per question, in order)

1. **Self-resolve by measurement.** Read the file, run the check, reproduce the case. Most "questions" are unread files — a question answerable from the workspace never reaches the scoreboard.
2. **Bypass.** Reorder: execute every item that doesn't depend on the answer. The blocked item parks; the queue continues. This is the default outcome and the reason the skill exists.
3. **Assumption-run** — only where speculation is enabled per §4's gates: proceed under a **named** default with a revisit marker. A contradicting answer squashes and re-runs the affected slice only, never the whole task.
4. **Park.** Irreducible and speculation off → the item waits. Everything independent still proceeds.

The forbidden transition is the **silent guess** — an unnamed assumption is a bypass without a scoreboard entry, indistinguishable from confidence to every later reader.

## 4. What is never bypassed

Questions gating **loss or external publish** (push · deploy · send · delete · destructive ops) are not bypassable and not assumption-runnable — they park their item, in every mode, marker or no marker. `/ooo` moves the *waiting*, never the *gates*. Same for anything the workspace's standing rules gate on explicit approval.

## 5. Feedback intake — the steering half

- Answers arrive asynchronously: chat, decisions panel, inbound A2A. An answer wakes **only its dependents** (broadcast to the items that were blocked on it — not a global restart).
- A late answer that contradicts an assumption-run is **late steering**: squash the affected slice, re-run it, keep everything else.
- Where a Constellation board is joined, intake must be low-latency (the board's inbox watch cadence) — a scoreboard whose answers surface at next-session speed is in-order waiting with extra steps.
- At every item boundary, re-check the scoreboard before starting the next item.

## 6. Turn-end contract

Close each turn with the scoreboard delta, compactly: **answered** (and what they steered) · **open** (re-surfaced as the same one-liners) · **parked items** (what they wait on). Open questions are re-surfaced, never silently carried — a question the human never saw again was a silent guess with a paper trail.

## 7. Constellation projection (optional)

Where board-joined: open questions mirror to the **decisions panel** (the one-liner + the interim default), answers landing there are feedback intake like any other channel, and entries retire on resolution. Not board-joined → the chat scoreboard is the whole surface. The projection follows the board's content-tone policy where one is set.
