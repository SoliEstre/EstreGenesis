---
name: speculation
description: "Speculation-authorization mode toggle (Superscalar §4). Invoke as /speculation off|auto|on|always|status to set who authorizes a speculative lane — starting the likely branch of an unresolved gate before it resolves. Marker .agent/speculation.json, default off. The modes graduate along downstream sensitivity: `auto` asks per speculation with the four-element trade-off, `on` pre-authorizes low-sensitivity lanes (read/analyze/summarize/sandboxed-test inside the worktree) while high-sensitivity ones still ask, `always` pre-authorizes every lane that stays inside the §3 irreversibility barrier. One constraint governs all modes and cannot be read past: the mode changes WHO authorizes, never WHAT a lane may touch — no mode reaches a write, deploy, send, or delete. Andon transparency (visual signal, /stop-spec pull-cord, misprediction logging) is unconditional in every mode including always: pre-authorization removes the question, not the visibility. Orthogonal to /superscalar (how many lanes) and /subscaler (what each lane runs on)."
---

# `/speculation` — who authorizes a speculative lane

`/superscalar` decides **how many** lanes. `/subscaler` decides **what each lane runs on**. This skill decides **who signs off on a speculative one** — a lane that starts the likely branch of a gate that has not resolved yet (an approval, a review verdict, a test outcome, an A/B choice), so the result is ready the instant the gate clears.

Speculation is the one dispatch class that spends tokens on work that may be thrown away. That is why it has its own toggle instead of riding the dispatch-aggressiveness one: fanning out more lanes and *betting* on an unresolved branch fail differently and want to be tuned separately.

Normative spec: `Superscalar.md §4`. Read it before changing this skill — in particular the two-stage announce and the Andon three elements, which this toggle does not modify.

## 0. Toggle contract

State = **one marker file**: `.agent/speculation.json` → `{"mode": "off"|"auto"|"on"|"always", "since": "<date>", "note": "<why>"}`. **Absent ⇒ `off`.** Read it at dispatch time; never mirror the mode into other settings surfaces — duplicated per-lane bindings have shipped state-convergence bugs.

- `/speculation off` — write `off` (or delete the marker)
- `/speculation auto` — write `auto`
- `/speculation on` — write `on`
- `/speculation always` — write `always`
- `/speculation status` — read it back and report the mode **plus where it would apply to the work in front of you**. A toggle without a read-back is a setting nobody can confirm, and an unconfirmable setting drifts from what its owner believes it to be.

## 1. What each mode authorizes

| Mode | Low downstream sensitivity (read · analyze · summarize · sandboxed test, inside the worktree) | High downstream sensitivity (interface design, contract change — work largely redone if the prediction was wrong) |
|---|---|---|
| `off` **(default)** | no lane | no lane |
| `auto` | ask per speculation | ask per speculation |
| `on` | **pre-authorized** | ask |
| `always` | **pre-authorized** | **pre-authorized** |

The axis is not new. §4 already says low-sensitivity work is the natural speculation target and high-sensitivity work usually waits; `on` is that sentence expressed as a threshold rather than as advice. If you cannot say which side of the threshold a lane sits on, it sits on the high side — the classification is part of the proposal, not an afterthought.

When a mode asks, it asks with §4's four elements: predicted branch + confidence · latency saved if right · token/discard cost if wrong · downstream sensitivity. The human supplies the confidence; there is no history-based predictor at this stage.

## 2. The barrier is not a mode

**The mode changes who authorizes a lane, never what a lane may touch.** §3's irreversibility barrier is unaffected by every mode, `always` included.

Read the other way it says something stronger: **there is no mode in which speculation reaches a write, a deploy, a send, or a delete.** No operator setting turns speculation into an outward-facing action. A deployment that wants a wider *scope* changes the scope limits (§4 — "read/analysis only", "never on code that will be committed", "only within this task"), which is a separate and deliberately narrower decision than changing who signs off.

If a speculative lane's *retire-time* commit would cross the barrier, that commit is the side-effecting action and it enters Hyperbrief's gate on its own — not the speculative work that produced it.

## 3. Andon is unconditional

All three elements hold at every mode, `always` included:

1. **Visual signal** — the lane's chip is distinctly colored and speculation is visible.
2. **Pull-the-cord (`/stop-spec`)** — one command discards every speculative lane; honor latency is the next instruction.
3. **Misprediction logging** — a discarded lane appends a structured entry under `.agent/_lessons/spec-discard/`.

Pre-authorization removes the *question*, not the *visibility*. Dropping the announcement at `always` would make the loudest mode the quietest one — the inverse of what the two-stage announce exists to produce, and the shape of every silent-disable failure this module tracks.

## 4. Which mode, and when to step back down

Raise on evidence, not on principle:

- **`off` → `auto`** when gates are actually blocking measured wall-clock and the branch is genuinely predictable. If nothing is waiting on a gate, speculation has nothing to buy.
- **`auto` → `on`** when the per-speculation ask has become a formality on low-sensitivity lanes — the same answer several times running. That repetition is the evidence; a feeling that it would be faster is not.
- **`on` → `always`** only where the high-sensitivity classification has itself proven reliable, because `always` is the mode that stops testing it.

Step back down when any of these show up: misprediction rate high enough that discard cost exceeds latency saved (§6 measurement, not impression) · a discarded lane's output found its way into the answer anyway (the isolation is leaking, and no mode is safe until that is fixed) · reviewers correcting speculative work more than they correct requested work · a gate whose outcome the speculation itself influenced, which is not prediction but pressure.

`off` is never changed automatically. The other three may be demoted by an evidenced signal, and the demotion says so in the turn.

## 5. After every toggle: re-declare

If this workspace is joined to a Constellation board, the toggle is not finished until the board knows: emit an updated `OpsState` carrying `speculation {mode}` (Constellation.md §13.23.4 — change-triggered, latest-wins). Toggle + announce are one unit of work. (EG-ops helper: `node scripts/emit-ops-state.cjs`.) Not board-joined → skip.

## 6. Composition

- `Superscalar.md §4` — normative spec (what speculation is, the four-element trade-off, two-stage announce, Andon, isolated flush).
- `Superscalar.md §3` — the irreversibility barrier and the spend circuit breakers. Upstream of this toggle and unmoved by it.
- `Superscalar.md §3.1` — the Hyperbrief interlock, which applies to a retire-time commit, not to the speculative lane.
- `/superscalar` §5.2 — dispatch aggressiveness (how many lanes). Orthogonal.
- `/subscaler` §5.1 — tier per lane (what each runs on). Orthogonal.
- `/ooo` §5.3 — the question scoreboard. Related but distinct: OoO moves the *waiting* without betting, so it is cheap and safe where speculation is neither. Prefer it first; a question that OoO can bypass does not need a speculative lane.
