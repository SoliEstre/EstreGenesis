---
name: boardsweep
description: "True-up every agent-authored live-board component — verify done entries against the repo's actual history, migrate finished planned items, close resolved decisions, correct current, prune the registry, refresh the wiki projection, normalize tone/schema. Excluded by contract: the realtime chat, user-authored slots, and mode/policy texts. Retrospective accuracy only: this skill fixes what the board claims; /roundnext decides what happens next. Invoke on a cadence, after a batch of work landed off-board, or whenever the board smells stale."
---

# /boardsweep — one full board true-up (every agent-authored component)

The complement of `/roundnext` on the time axis: roundnext is **forward-looking** (which planned item should start, which blocker to attack), boardsweep is **retrospective** (is what the board currently says actually true?). A board that isn't swept accumulates ghost claims — done entries whose identifiers resolve to nothing, planned items that quietly shipped, decisions that stay "open" after the work answered them, a current lane describing last week. A sweep changes recorded facts; it never starts work.

## 0. Load board truth + ground truth

- **Board** — read the live state (`board_state_get` MCP tool, or the board's `state.json` directly). The sweep set is **every agent-authored component**: `done[]`, `planned[]`, `current[]`, `decisions[]`, the project registry, the wiki/vocabulary projection where the board carries one, and the meta fields (`updatedAt` etc.).
- **Excluded — never rewritten by a sweep**:
  - the realtime chat / per-channel message history (in the reference runtime, the `ws-history` store and everything the conversation channels carry) — that layer is a *record of what was said*, not a claim to true-up;
  - user-authored slots (free-request fields, feedback queues) — user speech is not the agent's to edit;
  - the board's mode/policy texts — the sweep **obeys** whatever policies they carry (content tone, grouping, routing or the workspace's equivalents) and may flag a violation, but changing a policy is a human call, not a sweep action.
- **Ground truth** — the VCS log and tags, the release CHANGELOG, the live track documents, and any deterministic checkers the project ships (a version-sync verifier, a vocabulary lint). Prefer running a checker once over re-deriving its result by hand.

## 1. Sweep each component (the per-component contract)

- **`done[]`** — every entry's identifiers (commit, ref/tag, date) must resolve against the VCS; an entry that resolves to nothing is corrected or flagged, never silently kept. Work that landed but was never registered gets added with real identifiers. Ordering and schema follow the board's state schema (required fields present, newest-first where the schema says so).
- **`current[]`** — must describe what is in flight *right now*. Finished → migrate to `done[]` with real identifiers; abandoned → remove, recording the reason on the way out; in-flight work that was never registered → added (a start that skipped the planned → current move is exactly the drift a sweep catches).
- **`planned[]`** — facts only: items that already shipped migrate to `done[]`; recorded `blockReason`s are re-verified against present reality and **corrected as records** (acting on a newly-unblocked item is `/roundnext`'s job, not the sweep's; the record correction itself is a shared edge by design — roundnext's blocker re-examination fixes the same records for the items it is about to schedule, the sweep's pass covers the full queue); duplicates merge.
- **`decisions[]`** — an open item whose question has since been answered by landed work is closed with the resolution recorded (the cut-closure discipline: a release is not closed until the decisions it resolves are). Briefing facts that drifted get corrected; the question itself is the human's and is not reworded away.
- **registry (projects)** — every id referenced by swept items exists; entries nothing references any more are pruned.
- **wiki / vocabulary tab** — where the board projects a vocabulary store, delegate wholesale to that store's own lint + reindex (Compendium's `compendium-lint`); the sweep does not re-implement gardening checks.
- **tone + schema normalization** — swept content is (re)written at the board's configured content tone, where the board defines one (a `modes` policy field or the workspace's equivalent), identifiers preserved verbatim. **No fabrication**: a fact that cannot be verified is marked as unverified or left out — a plausible-sounding entry is worse than a gap.

## 2. Write + verify

- Write through the workspace's configured write path: the board-worker delegation pattern where a worker owns `state.json` (single-line JSON envelopes, validated by round-trip parse), direct file edit otherwise (preserve the file's formatting, bump `updatedAt`).
- Re-read the state (API or file) and confirm the sweep actually landed — a write that silently failed reports as if it had succeeded.

## 3. Report + chain

- Report the sweep delta in a few lines: done corrected/added N · planned migrated/corrected N · decisions closed N · current fixed N · registry pruned N · tone-normalized N. A sweep that changes nothing should say **why** nothing changed — that is a healthy board, and it is signal.
- If the sweep exposed anything actionable (an item now unblocked, priorities visibly wrong), recommend or chain into `/roundnext` — scheduling belongs there.
- Standing gates unchanged: a sweep never pushes/deploys/sends/deletes on its own authority, and mode/policy changes route to the decisions panel.
