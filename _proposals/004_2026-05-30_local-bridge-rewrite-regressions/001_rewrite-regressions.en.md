# local-bridge.cjs rewrite regressed proposal-002 fixes

- **Component**: `constellation/reference/runtime/local-bridge.cjs`
- **Found by**: a downstream adopter migrating the latest reference into its project
- **Severity**: Bug 1/2 **medium-high** (functional) · 3–5 low (generalization)
- **A2A contract impact**: none

## Context

The v2.2.x large rewrite of `local-bridge.cjs` (which correctly added the **§13.13 ack layer** and **§13.9 role-branched OnboardAck**) appears to have started from a pre-002 snapshot. It silently dropped the five fixes proposal 002 had already landed.

## Regression 1 — `state.json` loaded from parent dir (functional)

```js
// regressed:
try { const sp = path.join(DIR, '..', 'state.json'); … modes = (require(sp).modes) || {}; } catch {}
// re-applied (002 Bug 2):
try { const sp = path.join(DIR, 'state.json');       … modes = (require(sp).modes) || {}; } catch {}
```
In the flat `reference/runtime/` layout `state.json` is a **sibling** of `local-bridge.cjs` (and `server.cjs` already uses `path.join(DIR, 'state.json')`). The `'..'` form throws `MODULE_NOT_FOUND`, so **every `OnboardAck` ships `modes: {}`**.

## Regression 2 — bridge vs watcher inbox-file mismatch (functional)

```js
// bridge (regressed):
const INBOX  = … : path.join(DIR, 'ws-inbox.jsonl');
const OUTBOX = … : path.join(DIR, 'ws-outbox.jsonl');
```
But the sibling `self-wake-watcher.sh` defaults to **`inbox.jsonl`** (`INBOX="${WS_INBOX:-inbox.jsonl}"`). So out of the box the bridge **writes `ws-inbox.jsonl`** while the watcher **polls `inbox.jsonl`** — the bridge's inbound never wakes the agent's next turn (the watcher's whole purpose). Re-applied (002): bridge uses `inbox.jsonl` / `outbox.jsonl`, matching the watcher.

> **Root pattern**: two files that must agree (bridge `INBOX` default ↔ watcher `INBOX` default) are set independently in two files — a classic drift point. See the proposed guard below.

## Regressions 3–5 — generalization (cosmetic, adopter-confusing)

| # | regressed | re-applied (002) |
|---|---|---|
| 3 | header `ws-local-bridge.cjs — 로컬 IDE 에이전트(Claude Code 세션)` | `local-bridge.cjs — turn-based local IDE 에이전트` |
| 4 | `AGENT_NAME` default `'Local IDE (Claude)'` | `'Local IDE Agent'` |
| 5 | `OnboardAck.guide` `'dashboard/live/AGENT-CONNECT.md §1.5~1.8 · WS-PROTOCOL.md §13'` | `'AGENT-CONNECT.md · WS-PROTOCOL.md'` |

These re-introduce the upstream environment's private path/branding into the public reference (the §13.14 redaction surface).

## Fix — all five re-applied (absorbed)

`node --check` PASS after re-application. The §13.13 ack layer / §13.9 role branching / proposal-003 single-instance guard are untouched.

## Proposed regression guard

Add a tiny `node --test` on the reference runtime so a future rewrite that diverges fails CI:
```js
// 1) bridge resolves state.json to the sibling (not parent)
assert.ok(/path\.join\(DIR, 'state\.json'\)/.test(bridgeSrc));
assert.ok(!/path\.join\(DIR, '\.\.', 'state\.json'\)/.test(bridgeSrc));
// 2) bridge INBOX default === watcher INBOX default (no drift)
assert.equal(bridgeInboxDefault, watcherInboxDefault);   // both 'inbox.jsonl'
// 3) no env-specific path/branding leaked into the public reference (§13.14)
assert.ok(!/dashboard\/live\/|\(Claude Code 세션\)/.test(bridgeSrc));
```
This makes the "rewrite silently lost the generalization" class of regression a CI failure rather than a downstream discovery.
