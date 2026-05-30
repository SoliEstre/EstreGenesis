# 004 · 2026-05-30 · local-bridge-rewrite-regressions

> Inbound proposal bundle from a downstream adopter. While **migrating** the latest `constellation/reference/runtime/local-bridge.cjs` (the v2.2.x rewrite that added the §13.13 ack layer + §13.9 role-branched OnboardAck), the adopter found that the rewrite **silently regressed five fixes already accepted in proposal 002** — two of them **functional**. This bundle re-applies all five to the reference master (absorbed this commit) and proposes a regression guard so a future rewrite doesn't lose them again.

## Bundle definition

Proposal 002 (`002_…_constellation-reference-local-bridge-bugs`) generalized `local-bridge.cjs` for the flat `reference/runtime/` layout and fixed a `state.json` path bug. The later large rewrite (commits adding the §13.13 ack layer + role-branched OnboardAck) appears to have been based on a pre-002 snapshot, so it **re-introduced**:

**Functional regressions**
1. **`state.json` sibling path** — back to `path.join(DIR, '..', 'state.json')` (002 Bug 2). In the flat runtime layout `state.json` is a sibling, so `OnboardAck.modes` loads `{}` from the parent dir again.
2. **inbox / outbox naming** — back to `ws-inbox.jsonl` / `ws-outbox.jsonl`, but the sibling `self-wake-watcher.sh` still defaults to **`inbox.jsonl`**. So the bridge writes one file and the watcher polls another → **bridge inbound never wakes the watcher** unless both are run with an explicit matching `WS_INBOX`.

**Generalization regressions** (cosmetic but adopter-confusing)
3. header comment `ws-local-bridge.cjs — 로컬 IDE 에이전트(Claude Code 세션)` (002 → `local-bridge.cjs — turn-based local IDE 에이전트`).
4. `AGENT_NAME` default `'Local IDE (Claude)'` (002 → `'Local IDE Agent'`).
5. `OnboardAck.guide` `'dashboard/live/AGENT-CONNECT.md §1.5~1.8 · WS-PROTOCOL.md §13'` (002 → `'AGENT-CONNECT.md · WS-PROTOCOL.md'`).

All five re-applied; `node --check` PASS. The §13.13 ack layer, §13.9 role branching, and proposal-003 single-instance guard are **preserved** — only the regressed lines changed.

## Documents

| # | topic | en | ko | severity |
|---|---|---|---|---|
| 001 | local-bridge rewrite regressed proposal-002 fixes (state.json path + inbox/watcher naming mismatch + generalization) | [001_rewrite-regressions.en.md](001_rewrite-regressions.en.md) | [001_rewrite-regressions.ko.md](001_rewrite-regressions.ko.md) | Bug1/2 **medium-high** (functional) · 3–5 low |

## Closure log

| date | status | note |
|---|---|---|
| 2026-05-30 | submitted + absorbed | All five regressions re-applied to `constellation/reference/runtime/local-bridge.cjs` this commit (`node --check` PASS). Proposes a **regression guard**: a tiny `node --test` asserting (a) bridge `state.json` resolves to the sibling, (b) bridge `INBOX` default === watcher `INBOX` default — so a future rewrite that diverges fails CI. |

## Privacy
Reverse-reference redacted per `_proposals/` default — no adopter-specific tokens.
