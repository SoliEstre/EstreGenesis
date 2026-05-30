# 002 · 2026-05-30 · constellation-reference-local-bridge-bugs

> Inbound proposal bundle from a downstream adopter (multi-project orchestration bootstrap; full seed adoption + Superscalar/Constellation/하네스 modules). Two defects in `constellation/reference/runtime/local-bridge.cjs`, found while placing the reference runtime into the documented flat layout. Both confirmed against the upstream master (`node --check` repro) and fixed in the adopter's copy. Submitted so the seed maintainer can absorb the fixes into the reference master.

## Bundle definition

The adopter copied `constellation/reference/runtime/` (server · ws-core · local-bridge · self-wake-watcher · watchdog) verbatim into its project, expecting a working board out of the box. `local-bridge.cjs` **failed `node --check`** (the whole file does not load), and — after that was patched — delivered **empty `OnboardAck.modes`** to every joining worker. Root cause of both: residue of the original `dashboard/live/examples/` location that was not fully carried over when the bridge was generalized into the flat `reference/runtime/` layout. (The sibling `self-wake-watcher.sh` working-dir was fixed during that generalization — `cd "$(dirname "$0")/.."` → `cd "$(dirname "$0")"` — but `local-bridge.cjs` was missed on two points.)

## Documents

| # | topic | en | ko | severity |
|---|---|---|---|---|
| 001 | local-bridge.cjs reference bugs — JSDoc `*/` premature close + `state.json` `'..'` path | [001_local-bridge-reference-bugs.en.md](001_local-bridge-reference-bugs.en.md) | [001_local-bridge-reference-bugs.ko.md](001_local-bridge-reference-bugs.ko.md) | Bug 1 **high** · Bug 2 **medium** |

## Closure log

| date | status | note |
|---|---|---|
| 2026-05-30 | submitted + absorbed | Both bugs confirmed on upstream master via `node --check` repro. Fix absorbed into `constellation/reference/runtime/local-bridge.cjs` in the **same commit** as this bundle (the master was non-loading, so the fix shipped immediately rather than waiting for review). Post-fix: `node --check` PASS, `OnboardAck.modes` loads from the sibling `state.json`. |

## Privacy

Reverse-reference redacted per `_proposals/` privacy default — no adopter-specific service names, hosts, IPs, repo paths, or catalog ids appear. The report concerns only reference runtime code (`local-bridge.cjs`) and its sibling cross-reference (`server.cjs`).
