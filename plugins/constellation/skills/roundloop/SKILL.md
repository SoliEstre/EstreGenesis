---
name: roundloop
description: "Repeat /roundnext rounds until the queue can no longer be advanced by this agent alone, then hand back the list of decisions only a human can make. Specified by how it stops: registering work is not progress (so the loop cannot feed itself on its own new-work scan), six termination conditions are declared before the first round rather than discovered mid-run, a round completes when its board write is measured rather than sent, and repetition grants no authority a single round lacked. Invoke to drain a queue unattended, or to find out what is actually blocking."
---

# /roundloop — repeat rounds until the remainder is not self-actionable

Repeats `/roundnext` until the queue can no longer be advanced by this agent alone. Contract: `Constellation.md §13.34`. The product of a run is **the list of things only a human can decide** — not the round count, and not a longer backlog.

Read §13.34 before changing anything here. In particular: registering work is not doing work (§13.34.1), and a round is complete when its board write is *measured*, not when it is sent (§13.34.3).

## 0. Preflight — declare the envelope, then read the board

State the caps **before the first round**, in the opening line of the run: max rounds, the dry-round threshold K (default 2), and any wall-clock or token budget. A cap discovered mid-run is not a cap (§13.34.2-3). If the operator gave a bound ("3 rounds", "until the P2s are gone"), that bound replaces the default and is echoed back.

Then load board truth once (`board_state_get`, or the board's `state.json`): `planned[]` with `blocked`/`blockReason`, `current[]`, open `decisions[]`, recent `done[]`.

**Register the loop as in-flight work** (§13.34.5) so the operator can see it exists and stop it: one `current[]` entry, id `c-roundloop`, whose detail line carries the round index and the dry count. Remove it when the loop stops. A loop nobody can see is a loop nobody can interrupt.

## 1. Loop body — per round

1. **Run one round** exactly as `/roundnext` specifies (all five steps, in order). Do not abbreviate the round because it is inside a loop; the blocker re-examination and the new-work scan are what keep later rounds honest.
2. **Barrier** (§13.34.3): wait for the board write to land, then *measure* it — worker report received, or a state condition confirmed by reading. Never compute the next round's ripeness from pre-write state. This is the difference between a loop and a race.
3. **Score the round** against the productivity predicate (§13.34.1):
   - **productive** ⟸ work was started, or a blocker was cleared with evidence.
   - **not productive** ⟸ everything else, including a round that registered new planned items, re-sorted the queue, refreshed a `blockReason`, or wrote a gate. Those are useful; they are not progress.
   Keep a running ledger: round index, productive?, what made it so, dry-count.
4. **Check the guards** in order and stop at the first that fires — dry rounds ≥ K · remainder not self-actionable · any cap reached · stall (same item started twice with no `done[]` delta) · context pressure · operator interrupt. Guards are checked at the round boundary, never mid-round, so the board is never left half-written.

## 2. What the loop must not do (§13.34.4)

It inherits one round's authority and gains nothing by repeating. Specifically: it does not resolve a gate, does not widen its own caps, does not flip a blocked item to unblocked without the evidence a single round would have needed, and does not decide a human-gated fork because that fork is the only thing left. It also does not invent work to stay alive — under §13.34.1 that is scored as a dry round anyway, which is the intended pressure.

The standing gates of `/roundnext` still hold: nothing is pushed, deployed, sent, or deleted on the loop's own authority beyond what one round may do under the project's policy.

## 3. Terminal report

Name the stop condition — a loop that stops without naming it is indistinguishable from a crash (§13.34.2). Then, in a few lines:

- **rounds** run, and the ledger in one line each (productive / dry, with the one-phrase reason).
- **totals**: started N · blockers cleared N · new planned N · gates registered N · still blocked N.
- **the remainder, as a decision list** — this is the point of the run. For each surviving item: what it waits on, and whose call it is. Group by addressee (operator / peer / external), because that is the axis the reader acts on.
- **resume pointer** if a cap or context pressure stopped the run rather than exhaustion: which round index, which item was next, and the dry-count at the time.

Finally, remove the `c-roundloop` entry from `current[]`. If the run ended on context pressure, do that as part of the handoff so the board does not claim a loop that no longer exists.

## 4. Honest non-starts

If the harness cannot hold state across rounds (a print-mode CLI with no session persistence), run a single round and say the loop was declined and why (§13.34.6). Simulating loop semantics without the dry-count and stall history produces a run that cannot detect its own stalling. Likewise, if the board is unreachable, a loop cannot honor its barrier — run one round with the file-based fallback and stop.
