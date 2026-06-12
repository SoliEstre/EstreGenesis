---
name: roundnext
description: Run one full "what should happen next" round over the live board — ripeness-check planned items and start what is ready, re-examine blockers and unblock or derive unblocking work, scan the project for genuinely new next work across multiple dimensions, and route anything needing a human call to the decisions panel as a Hyperbrief briefing. Invoke when a work track closes, when idling feels wrong, or on a cadence.
---

# /roundnext — one planned/blocked/new-work round

Mechanizes the composition of Constellation §13.16.6 element 5 (planned-queue scan), §13.20 (blocker tracking + nudge), and §13.18 (autonomous execution) into a single invocable round. The output of a round is: work started, queues re-sorted, blockers acted on, new work registered, and human-gated items routed to the decisions panel — never a silent "nothing to do".

## Procedure (5 steps, in order)

**0. Load board truth** — read the live board state (`board_state_get` MCP tool, or the board's `state.json` directly). You need: `planned[]` (with `blocked`/`blockReason`/`when`), `current`, `decisions[]` (open ones), and recent `done[]` for context.

**1. Ripeness check on unblocked planned items** — for each planned item that is not blocked, ask: has its start condition arrived? (`when` reached, predecessor in `done[]`, ordering satisfied, no fresher priority above it.) If ripe → **start it now** (§13.18: a defined-next-step proceeds without asking). If not ripe, record why in one line (this becomes the priority rationale in step 2's sort).

**2. Blocker re-examination on blocked planned items** — for each `blocked: true` item, re-verify the blocker *now* (don't trust the recorded `blockReason` — blockers go stale silently: the external dependency may have shipped, the gate may have been decided, the precondition may have been met by unrelated work). If the blocker is gone → flip to unblocked; if it is also ripe, start it; otherwise merge into the priority sort. If still blocked, keep it and pass to step 3.

**3. Derive unblocking work for still-blocked items** — per §13.20: for each surviving blocker, ask *what would it take to clear this, and which part of that can be done from here, now?* (e.g. evidence the other side is waiting for, a prerequisite refactor, a reproduction, a nudge message per the §13.20 BlockerNudge cadence). Anything actionable becomes a new planned item (priority-sorted) — or starts immediately if it is small and ripe. If nothing is actionable from this side, ensure the blocker is visible on the board (BlockerManifest) and nudge cadence is armed.

**4. New-work scan (multi-dimensional)** — look beyond the queue: does the *current project state* imply next work not yet registered? Sweep several dimensions rather than one: pending release/version sync surfaces · doc/spec drift vs shipped code · verification gaps (things claimed but never machine-checked) · security/hygiene follow-ups · dogfood evidence worth capturing · cross-module interactions newly possible · user-stated intents not yet decomposed. Register findings as planned items with one-line rationale. Do NOT inflate: only work that is real now, not speculative backlog padding.

**5. Route human-gated items to the decisions panel** — anything from the queue or step 4 that needs a user call (loss/external-publish, a genuine design fork, strategy value judgments) must NOT be silently deferred or started: register it as a decisions-panel entry with a **Hyperbrief briefing** — default tone **L1.1.1** (plain-language audience, abbreviations expanded, jargon unpacked) unless the project specifies another level. Structure: §1 situation in plain words → §2 why it needs a call → §3 the question → §4 options with costs/benefits and a recommendation → §5 urgency note. Per §13.17, the decisions panel is the escalation route — no inline structured-choice prompts in main chat.

## Closing the round

- Re-sort `planned[]` by the priority rationale gathered above and write the board update (directly or via the board-worker delegation pattern, per workspace configuration).
- Report the round's delta in a few lines: started N / unblocked N / new-planned N / decisions-registered N / still-blocked N (with nudge state). A round that changes nothing should say *why* nothing changed — that is itself signal.
- This skill does not override §13.18 gates: it never pushes/deploys/sends/deletes on its own authority, and a genuinely new major fork goes to step 5, not to execution.
