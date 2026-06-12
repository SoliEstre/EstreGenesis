---
name: drillnow
description: Attack the highest-priority blocker right now — pick the top blocked item off the board, actively attempt to clear its blocker this turn (alternative routes, prerequisite work doable from here, tool substitution, escalated nudges), start the item if it unblocks, and re-prioritize honestly if it provably cannot be cleared at this point in time. The depth counterpart to /roundnext's breadth.
---

# /drillnow — clear the top blocker, now

Where `/roundnext` sweeps the whole queue (breadth), `/drillnow` picks the **single highest-priority blocked item** and spends the turn actually trying to clear it (depth). A drill ends in exactly one of two states: the blocker is gone and the work has started, or the blocker is *proven* uncllearable right now and the queue is re-prioritized around that proof. "Still blocked, unchanged" is not a valid exit.

## Procedure

**1. Target selection** — load board truth (`board_state_get` or `state.json`) and pick the highest-priority `blocked: true` planned item. Priority = board order unless a rationale says otherwise; skip items whose blocker is a *user decision gate* (those belong to the decisions panel, not to drilling — verify the panel entry exists, then take the next candidate). Announce the target in one line.

**2. Blocker decomposition** — restate the blocker as a concrete condition ("what exactly must become true?"), then split it into parts by who/what can move each: this-side-doable / other-party / environment / time. Recorded `blockReason`s are often coarser than reality — decomposition routinely reveals a this-side-doable part nobody registered.

**3. Active clearing attempts** (in escalating order of cost; stop at first success):
   - **Re-verify** — is the blocker already gone? (The dependency may have shipped, the precondition met by unrelated work.)
   - **This-side prerequisite work** — execute the doable parts now (collect the evidence the gate requires, build the reproduction, prepare the artifact the other party is waiting on).
   - **Alternative route** — can the item proceed in a reduced or re-ordered form that does not touch the blocked part? (Partial start beats full wait when the partial result is durable.)
   - **Tool/environment substitution** — missing tool: try installing it, or find an equivalent (a manual procedure, a different binary, a degraded-but-sufficient mode).
   - **Escalated nudge** — for other-party blockers, move up the §13.20 ladder one tier (polite ping → explicit reminder + ETA query → hard ETA) with the drill's findings attached (what this side has prepared makes a nudge concrete instead of nagging).
   - §13.18 gates hold throughout: no loss/external-publish/genuine-fork action as a "clearing attempt" — those route to the decisions panel.

**4. Exit A — cleared**: flip the item to unblocked; if it is also ripe, **start it now** and move it to `current`. Record what cleared it (the next blocker of this shape should take minutes, not a drill).

**5. Exit B — proven uncllearable now**: state *why* (which decomposed part is immovable, what event/date/party will move it), then **re-prioritize**: demote the item below everything currently actionable, promote what the drill revealed as doable (prerequisite work from step 3 becomes its own planned item if not finished), and update `blockReason` to the decomposed, verified form — the next drill or round starts from truth, not from the stale coarse reason. Arm the §13.20 nudge cadence if the blocker is other-party.

**6. Report** — a few lines: target, what was attempted, exit state (cleared-and-started / proven-blocked-with-reason), queue delta. Write the board update (directly or via the board-worker delegation pattern, per workspace configuration).

## Boundaries

- One target per drill (two only if the first resolves trivially at step 3's re-verify). Depth, not breadth — run `/roundnext` for the sweep.
- A drill that merely *re-describes* the blocker has failed its contract: exit B requires decomposition + re-prioritization + an updated `blockReason`, not a restatement.
- User-decision gates are never drilled — they are routed/verified on the decisions panel (§13.17) and excluded from target selection.
