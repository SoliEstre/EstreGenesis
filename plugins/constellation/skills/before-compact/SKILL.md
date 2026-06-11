---
name: before-compact
description: Materialize in-context volatile details into the compact-handoff file before compaction — procedure conventions (env vars, call rules, paths), in-flight cycle anchors, unrecorded decisions, and active resource IDs. Invoke before a manual /compact or whenever context feels long. Pairs with the PreCompact/SessionStart hook pair (constellation/reference/runtime/pre-compact/).
---

# /before-compact — compact-survival handoff materialization

Write the things that exist only in the current context — and nowhere on disk — into the compact-handoff file (default `.agent/compact-handoff.md`, or the path your `HANDOFF_PATH` hook env points at). The PreCompact hook snapshots the *environment* (git state) deterministically and the SessionStart(compact) hook re-injects the file; this skill owns the half no script can collect: **what is in the model's head**.

This mechanizes Constellation §13.16.6 element 6 (pre-large-work context materialization) and is what makes §13.21 (fresh-context defer is an anti-pattern) operative for the *procedural* layer.

## Procedure

1. **Scan for volatile details** from this session:
   - **Procedure conventions**: script call requirements (env vars, arguments, ordering), policies agreed this session that are not yet in memory/guides. (Observed failure class: a required env-var prefix on one script call lived only in-context, was dropped by a compaction summary, and the post-compact agent reverted to the script's default — misrouting messages until a human noticed.)
   - **In-flight cycle anchors**: files touched so far + next step + the reasoning behind the current approach (if a track doc already holds this, record only the pointer).
   - **Unrecorded decisions**: user decisions from this session not yet in a durable artifact.
   - **Active resources**: background tasks / monitors / workflow run IDs + how to resume each.
2. **Update the standing card** — edit the handoff file's standing-card section:
   - Update existing entries in place; append new ones; delete stale ones. Keep the card short (≤ ~15 entries) — the whole file re-enters context after every compaction, so length is a recurring tax.
   - Never touch the auto-snapshot block (between the `AUTO-SNAPSHOT` markers) — the PreCompact hook owns it.
3. **Promote durables** — entries that have become permanent discipline belong in memory files or guides; promote them there and shrink the card entry to a pointer.
4. **Report + recommend** — state what was recorded in 1-3 lines; if the user intended a manual compact, recommend running `/compact` now. (For auto-compact readiness, recording alone completes the skill.)

## Non-goals

- Environment state (git HEAD / dirty / tags) — the PreCompact hook snapshots it automatically.
- Re-summarizing the work — the compaction summarizer does that well. This skill exists for what the summarizer reliably *misses*: conventions, anchors, and resume handles.
