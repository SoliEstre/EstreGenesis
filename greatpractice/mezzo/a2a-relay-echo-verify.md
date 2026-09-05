---
# === v0.1 lint-required ===
id: a2a-relay-echo-verify
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "an A2A frame was just handed to a bridge (outbox.jsonl append, or an emit tool that appends for you)"
  then: "before saying «sent», poll the bridge's inbox log for that msgId's ev:'sent' echo with a bounded wait (≤10s); RELAYED → proceed; MISSING → treat the bridge as dead, respawn it, re-push, and only then claim delivery"
  format: command-check-decision
  source: stop-hook
lifecycle: consolidation
last_referenced_turn: 2026-09-05T00:00:00Z

# === lint-warn ===
title: A2A Relay-Echo Verify — an outbox append is not a delivery
slug: a2a-relay-echo-verify
created_at: 2026-09-05T00:00:00Z
ratified_at: 2026-09-05T00:00:00Z
source_evidence:
  - Constellation.md §13.13.2 (at-least-once relay + commitment-tier acks — the server's pending queue is cleared by the recipient's AckProcessed, so a frame the bridge never sent has no entry to clear)
  - Constellation.md §13.16.10 (pre-send probe — the sibling discipline on the inbound side; this entry closes the outbound side)
  - constellation/reference/runtime/scripts/join-collab.cjs — the reference bridge appends an `ev:'sent'` line to the inbox log for every frame it actually put on the wire; that line is the only evidence a file append became a transmission
  - CHANGELOG v2.5.197 (2026-07-20) — bridge outbox cursor-hold on disconnect, the silent-drop observability gap this practice detects from the caller's side
  - EG maintenance dogfood, a2a-coordination × post-emit, 2026-07-04 → 2026-07-11 across many sessions: applied to every emit, zero undetected drops; the dead-bridge window on session resume was the case that made the echo mandatory

evidence_quality: high
recommendation_strength: SHOULD

maturity_score:
  frequency: 5
  depth: 3
  recency: 5
  cost: 4
  predictability: 5
  # sum: 22/25 ≥ 18 threshold ✓
  # frequency 5: fires on every emit — the most frequent contact point in an A2A-joined workspace
  # depth 3: single grep-and-decide; the depth is in the consequence (a resend + bridge respawn), not the check
  # recency 5: the echo poll is what every push in the 2026-09-05 key-renewal round used to confirm the server's KeyRenewed
  # cost 4: a silent drop is a counterpart that never hears you — no error, no retry, a plan waiting on a reply that was never asked for
  # predictability 5: fully mechanizable — msgId in, RELAYED|MISSING out

last_validated_at: 2026-09-05T00:00:00Z
validation_cadence_days: 90
freshness_until: 2026-12-04T00:00:00Z
freshness_inherits_from: null

coherence: soft
edit_policy: owned
owner: EG-maintainers
audit_trail:
  - {ts: 2026-09-05T00:00:00Z, agent: claude-fable-5-1, action: create, prev_hash: null}
  - {ts: 2026-09-05T00:00:00Z, agent: claude-fable-5-1, action: ratify, prev_hash: null}

supersedes: []
superseded_by: null
kaizen_baseline_since: 2026-07-11
revision_history:
  - {ts: 2026-09-05T00:00:00Z, type: created, by: claude-fable-5-1, cost_tier: null}
  - {ts: 2026-09-05T00:00:00Z, type: ratify, by: claude-fable-5-1, cost_tier: null, note: "v2.6.120 — promoted from a probation memory practice (captured 2026-07-11) at recommended (warn) level; 3+ substantive occurrences across ≥2 coordinates per Greatpractice §5.4"}

surfaces:
  - {kind: sibling, path: greatpractice/mezzo/outbox-json-validation.md, inherits_freshness: false}
  - {kind: spec, path: Constellation.md, inherits_freshness: false}

parent: []
children:
  # Micro decomposition candidates — not yet written
  # - greatpractice/micro/relay-echo-grep.md (bounded poll for ev:'sent' + msgId → RELAYED|MISSING)
  # - greatpractice/micro/bridge-respawn-then-repush.md (MISSING → respawn bridge, re-append, re-poll)

phronesis_boundary: false
class: persistent

hash: null
deps: []
rrpv: 2
miss_count:
  compulsory: 0
  capacity: 0
  conflict: 0
  coherence: 0

_ratified_state:
  origin_cycle: v2.6.120
  revision_cycle: v2.6.120
  ratification_cycle: v2.6.120
  ratification_trigger: user_steering (Greatpractice §5.4 routing path b — promotion of a probation memory practice that had met the notability gate)
  notability_gate: pass
  maturation_gate_score: 22/25
  post_codify_evidence:
    n_data_points: 1
    validation_status: 'inherited from the pre-codify dogfood run (2026-07-04 → 07-11, every emit); first post-codify instances are the 2026-09-05 key-renewal pushes, each confirmed by the server echo'
  acknowledged_risk:
    - 'the echo proves the BRIDGE transmitted, not that the counterpart processed — processing is a separate ack tier (Constellation §13.13.2); do not read RELAYED as «done»'
    - 'a bridge that echoes but whose socket the server has silently closed is outside this check — that class is caught by the bridge-side reconnect latch (CHANGELOG v2.5.196), not by the caller'
    - 'the poll bound (~10s) is a workspace default; a bridge that drains its outbox on a slower interval needs a matching bound, or every push reads MISSING'
---

# A2A Relay-Echo Verify — an outbox append is not a delivery

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b). Promoted at `enforcement_level: recommended` — a warning, not a block — because the check is cheap and the failure it catches is silent, but the remedy (respawn a bridge, re-push) is a judgement the caller should still make deliberately.

## §1. Problem Surface

A file-append bridge turns «send» into two steps: the caller appends a frame to `outbox.jsonl`, and a separate bridge process drains that file onto a WebSocket. The append succeeds whether or not the bridge is alive. When the bridge is dead — a session resumed after a reboot, a supervisor that had not respawned it yet, a socket the server closed without a reason — the file write returns success and **nothing reaches the server**. There is no error to catch, no retry to fire, and no notification: the counterpart simply never hears you, and your plan waits on a reply to a question that was never asked.

The reference bridge writes one line into its log for every frame it actually transmits — `{"ev":"sent","name":"<intent>","msgId":"<msgId>"}` (`join-collab.cjs`; workspace bridges that log the whole frame put the same `msgId` under `msg`). That line is the only evidence that an append became a transmission. Reading it is the whole practice.

## §2. Practice Body — Command / Check / Decision 3-tuple

**Command** — after the append (or after an emit tool that appends for you), poll the inbox log for the echo of the frame's `msgId`, bounded:

```
# pseudo — any language; the shape is «tail the inbox log from the append point, look for ev:'sent' + msgId, give up after ~10s»
start = size(inbox.log) before the append
poll every 500ms, up to 10s:
  if any new line has ev == 'sent' and msg.msgId == <msgId>  → RELAYED
MISSING otherwise
```

**Check** — `RELAYED` or `MISSING`. Nothing in between: an append with no echo is MISSING even if the bridge process is alive, because a live process that is not draining is the same outcome as a dead one.

**Decision** —
- `RELAYED` → proceed. You may now say «sent». You may **not** say «delivered» or «processed» — those are separate ack tiers (Constellation §13.13.2), and a frame can be relayed and still bounce.
- `MISSING` → do not claim anything. Verify the bridge (pid file + heartbeat), respawn it through the workspace's normal launcher, re-append the same frame (same `msgId` — at-least-once makes the duplicate harmless), poll again. Only a second `RELAYED` closes the loop.

## §3. Evidence

- **Pre-codify run** (2026-07-04 → 2026-07-11): every emit in the maintenance workspace ran the echo poll; zero drops went undetected. The case that made it mandatory was a session resumed into a dead-bridge window — the outbox grew, the server saw nothing, and the echo poll was the only signal.
- **Observability gap it pairs with**: CHANGELOG v2.5.197 (bridge outbox cursor-hold on disconnect) fixed the bridge side of the same class; this practice is the caller side, and it stays useful when the bridge in use is not the reference one.
- **Post-codify**: the 2026-09-05 key-renewal round (five renewals across two boards) used the echo to confirm the server's `KeyRenewed` frame for each one — including one push the pre-send probe blocked, which the poll would have reported as MISSING had the caller not read the probe output.

## §4. Boundary

Mechanical. No judgement lives in the check; the judgement is in the remedy (how to respawn a bridge in *this* workspace), which is why the level is `recommended` rather than `mandatory` — the warning tells the caller to look, it does not pick the launcher for them.

## §5. Composition

- Sibling: `outbox-json-validation` (the append must be valid single-line JSON — that entry guards the write, this one guards the transmission).
- Sibling discipline on the inbound side: Constellation §13.16.10 pre-send probe (read before you write). Together they bracket an emit: probe → append → echo.
- Micro decomposition candidates named in `children` — the grep atom and the respawn-then-repush atom.
