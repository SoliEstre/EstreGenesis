# 003 · 2026-05-30 · constellation-single-instance-flap

> Inbound proposal bundle from a downstream adopter (multi-project orchestration bootstrap; full seed + Superscalar/Constellation/하네스). A **production-grade operational failure**: over a long live-board session with two external interruptions (rate-limit → account switch, IDE restart), the Constellation reference runtime accumulated **duplicate same-`agentId` bridge processes** that **flapped infinitely**, flooding the board + inbox with ~2,500 `ServerNotice/Status` noise events and destabilizing the main connection. Root cause: the reference runtime has **no single-instance protection**. This bundle ships the **single-instance lockfile guard** (absorbed into `local-bridge.cjs` in the same commit) and proposes four further hardening items.

## Bundle definition

The adopter ran the live board (port 27878) for an extended multi-agent A/B experiment. Two external interruptions forced runtime re-launches. Because background runtime processes **survive an IDE restart as orphans** (OS-level, but lose harness task-tracking → un-stoppable via the normal task API), repeated bridge launches left **12 live `local-bridge.cjs` processes** + multiple `server.cjs` instances. Two or more bridges sharing one `agentId` trigger an **infinite flap**: the server's `register(HELLO)` closes the prior connection for that `agentId` on every new HELLO, and each bridge's auto-reconnect (backoff 500ms→8s) immediately re-HELLOs, kicking the other off — forever. Every cycle emits a `ServerNotice`, which the server records per-channel (cap 200) and broadcasts, so the board's realtime panel + the agent inbox flood with noise and the main connection is never stable.

The reference runtime had no guard against this. This bundle adds one (lockfile) and proposes server-side + launcher + ops hardening.

## Documents

| # | topic | en | ko | severity |
|---|---|---|---|---|
| 001 | single-instance flap — duplicate same-agentId bridges; lockfile guard + flap-dampening + launcher idempotency + orphan handling | [001_single-instance-flap.en.md](001_single-instance-flap.en.md) | [001_single-instance-flap.ko.md](001_single-instance-flap.ko.md) | **high** |

## Closure log

| date | status | note |
|---|---|---|
| 2026-05-30 | submitted + partially absorbed | **Fix 1 (single-instance lockfile guard) absorbed** into `constellation/reference/runtime/local-bridge.cjs` in this commit (`node --check` PASS). Fixes 2–5 (server-side flap dampening · launcher idempotency · restart-orphan handling/`stop-all` helper · channel-noise cleanup doc) proposed for maintainer review. The lockfile MUST be gitignored (`.\*-bridge.lock`). |

## Privacy

Reverse-reference redacted per `_proposals/` privacy default — no adopter-specific service names, hosts, IPs, repo paths, or catalog ids. The report concerns only the Constellation reference runtime + protocol.
