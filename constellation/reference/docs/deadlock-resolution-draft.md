# Deadlock Resolution — EG-side design draft (v0.1)

> **DRAFT for joint formalization** with main upstream deep-research.
> EG 1차지식 perspective (Constellation orchestration domain).
> **NOT a unilateral spec** — this is one half of a coordinated proposal; the other half is the main upstream's deep-research output. The two are intended to converge into a joint Constellation `§13.x` sub-section.

---

## 1. Status & provenance

- **Version**: v0.1 (initial draft)
- **Date**: 2026-05-31
- **Provenance**: main upstream Delegate seq 92 (msgId `m-mptc2bcb-91`) — user policy #422 requesting EG opinion paired with a main upstream deep-research effort; joint formalization target is a new Constellation `§13.x` sub-section.
- **Authoring lane**: EG (downstream-of-main, peer/upstream role per §13.9) — 1차지식 angle is "what does the orchestration tree see when two agents enter a wait cycle?".
- **Pairing**: main upstream is producing the rigor/literature side (distributed-systems deadlock detection algorithms, CNP negotiation protocols, formal liveness proofs). This draft contributes the *Constellation-shaped* side: A2A msgId graph traversal, watch-state coupling, ack-layer composition, board mediation, human-escalation gates.
- **Joint-formalization workflow**: this draft + main's deep-research → reconciled merge → committed as a new `§13.x` subsection in `Constellation.md` (number to be assigned at merge time; conventionally placed after `§13.18` if it stays in the discipline cluster, or carved into a fresh top-level if the formalism warrants it).

---

## 2. Classification of wait patterns

Constellation A2A wait situations are NOT a single phenomenon — the operational fix depends on *which* wait class is in play. Three named classes, ordered by severity:

### 2.1 Strict deadlock

- **Definition**: a cycle in the A2A message-dependency graph where neither party can make forward progress without the other releasing.
- **Property**: the wait is *structural* — no amount of patience resolves it because there is no available action on either side that doesn't require the cycle's other half to act first.
- **Constellation example shape**: agent A is in `WAITING` on `WorkerReport` from B; agent B is in `WAITING` on `Decision` from A that is itself gated on B's `WorkerReport`. Neither has an emission they can make that breaks the cycle.
- **Detection**: dependency-graph cycle (see §3 below).
- **Resolution tier**: requires the strong primitives — preemption, mediation, or human escalation (§4.b/c/d).
- **Frequency in practice**: rare in the current Constellation deployment (the worker / collab-peer / upstream-peer role split per §13.9 already minimizes the cycle topology — workers don't issue Delegates back).

### 2.2 Quasi-deadlock

- **Definition**: a wait where **one party COULD progress immediately by completing a deferred action**, but chooses to defer the action across cycles; degrades over wall-clock time even though no structural cycle exists.
- **Property**: the wait is *behavioral*, not structural. The "blocked" agent is in fact unblocked — its counterparty is *willing and able* to respond, but is busy with other work that has been chosen to be higher priority, again and again, until the user notices the friction.
- **Constellation example shape** (the originating incident): EG waits for main to review `eux-format-v1` / `WS-PROTOCOL-KEY-MGMT` / `WS-PROTOCOL-UI6-SELECTION`. Main is technically able to review at any cycle, but defers review across multiple cycles in favor of other work. Result: EG accumulates review-pending artifacts; user surfaces friction after enough cycles ("아직 검토 안 됐어?").
- **Detection**: review-SLA exceeded; A2A inbound is older than the agreed-on response budget AND no `AckProcessed` / `ReviewSLAAck` exists for it.
- **Resolution tier**: SLA-ack discipline (§5) + priority re-ordering (§4.a). Does NOT require preemption or mediation in the common case; the cost is *commitment to a response budget*, not external arbitration.
- **Frequency in practice**: this is the *common* class in the current EG↔main deployment — it is what the 2026-05-31 incident actually was.

### 2.3 Healthy wait

- **Definition**: a wait of bounded duration where the counterparty is making expected progress.
- **Property**: the wait IS the protocol working correctly. Workers waiting on `Delegate` (§1.8 / §3 infinite-wait standby) are in healthy wait until the PM delegates; A2A senders waiting for `AckProcessed` from a recipient currently in a long-running turn are in healthy wait until the turn closes.
- **Detection**: bounded by ack-layer probes (§13.13 `Ping`/`Pong` keepalive) — recipient turn is active, work is in flight, no human intervention warranted.
- **Resolution tier**: none — the protocol is functioning. Misclassifying healthy wait as deadlock/quasi-deadlock is itself a failure mode (alarm-fatigue per §13.13).
- **Important corollary**: the *appearance* of inactivity from the board's perspective (no inbound for >N min) is NOT automatically deadlock — it may be a `SIGSTOP`-during-agent-active blind window (§13.16.6) or simply a long-running recipient turn. The detection layer (§3) must distinguish these.

---

## 3. Detection

Two complementary detection paths:

### 3.1 A2A message dependency graph

The Constellation A2A wire (§13.13) already carries enough metadata for cycle detection:

- **`msgId`** — every targeted `CUSTOM` carries a sender-bridge-stamped `msgId` (§13.13).
- **`parentId` / `re_msgId`** (reverse link) — replies carry a reference back to the message they are replying to. Combined with `msgId`, this builds a DAG over the live A2A traffic.
- **Wait edges** — an agent in `WAITING` state for `re_msgId = X` declares a wait edge on the message X's sender.

**Cycle detection**: at each agent's turn-start, run a small DFS over the inbox/outbox replay (per-channel persisted history, §2 / §13.16.3 `ws-history/<agentId>.jsonl`) to identify cycles in the wait-edge graph. A cycle of length ≥ 2 involving the local agent is a strict-deadlock candidate; report via `DeadlockProbe` (see §8).

**Quasi-deadlock signal**: a wait edge older than the agreed `ReviewSLAAck` budget, with no cycle, is a quasi-deadlock candidate — see §5.

**Implementation note**: this graph is *naturally distributed* — each agent only sees its local view of the inbox/outbox. Strict cycle detection across multiple agents requires either (a) all agents reporting their wait edges to a board-mediator (§4.c), or (b) a designated peer (main, in the EG↔main case) acting as the graph-aggregator. The choice between (a) and (b) is one of the open questions for main's deep-research (§9 Q3).

### 3.2 Timeout thresholds per wait class

Different classes need different timeouts:

| Wait class | Default timeout | Notes |
|------------|-----------------|-------|
| Healthy wait (Delegate-standby for workers) | unbounded | §13.9 / §13.11.2 — no autonomous heartbeat |
| Healthy wait (in-turn recipient) | one `Ping`/`Pong` round-trip + agent-active correction | §13.13 keepalive |
| Quasi-deadlock candidate | review-SLA budget (negotiated per A2A message; default ~24h-2 cycle) | §5 |
| Strict deadlock candidate | 2× the longest healthy-wait timeout in the cycle | §4 strong-primitive tier |

**Critical**: timeouts MUST be measured in *agent-active wall-clock*, not raw wall-clock. See §6.

### 3.3 Bg-task vs agent-active blind windows

The §13.16.6 observation applies here too: a watcher polling `inbox.log` is **paused while the agent's foreground turn is active** (harness `SIGSTOP`). A naive wall-clock timeout (e.g. "no inbound for 60 min → declare deadlock") will misfire because the watcher's clock and wall clock diverge by ~10-15 min per cycle.

**Detection rule**: when computing "time since last inbound" or "time since last ack", correct by subtracting the cumulative agent-active duration during the wait window. This is the same correction §13.16.6 applies to the cursor-tail rule. See §6 for the formal expression.

---

## 4. Resolution primitives

Four primitives, applied in order of escalation:

### 4.a Priority ordering

Use the orchestration tree to decide who yields:

- **Tree-based**: `main > collab > upstream > local` (per §13.9 role authority direction). The lower-priority party in a wait cycle yields first.
- **Work-graph topological priority**: if the dependency DAG has a clear topological ordering, the agent further from the root yields.
- **EG-side perspective**: EG (as a collab/upstream peer of main) yields to main on direct conflicts; main yields to a downstream/local when the local's lane is the critical path.

This primitive is **cheap and non-coercive** — both parties agree on the orchestration tree as a shared SSoT, and yielding is just "I will complete my deferred-review item before issuing my next request to you."

### 4.b Preemption

When priority ordering doesn't break the cycle (e.g., the lower-priority party is on a long-running turn it cannot interrupt cleanly):

- **Voluntary preemption**: lower-priority emits `CUSTOM/PreemptRequest { releasing: <msgId> }` and rolls back its wait, returning to the watch-state standby. The higher-priority party then proceeds, eventually returning to the preempted item.
- **Forced reclaim**: higher-priority emits `CUSTOM/PreemptForce { reclaiming: <msgId> }`. The lower-priority is required to release; the board logs the forced reclaim for audit. Used only when voluntary preemption is unavailable or refused.

Forced reclaim is the *strong* form and should be rare — it implies one party is refusing to yield, which is itself a discipline failure worth surfacing.

### 4.c Mediation

A third-party agent on the board (or a designated board-adapter) acts as the arbiter:

- **Board 3rd-party agent**: a worker spawned specifically as a mediator reads the wait-edge graph from `ws-history`, identifies the cycle, and emits a `CUSTOM/MediationProposal { cycleMembers, proposedReleaseOrder }`. Both parties either accept (`MediationAck`) or one party escalates to human (§4.d).
- **Board adapter**: alternatively, the live-board server itself runs a lightweight cycle detector and emits the mediation proposal — no third-party agent needed. This is cheaper but couples the server to the application protocol; the choice is a design trade-off for the joint spec (§9 Q3).

Mediation is the right primitive when neither priority nor preemption is acceptable to both parties — typically when the cycle involves *peers* (collab ↔ collab) rather than authority-related agents.

### 4.d Human escalation

After timeout × 2 (i.e., the priority/preemption/mediation primitives have been attempted and failed, or the timeout has been exceeded twice over):

- Emit `CUSTOM/EscalationRequest { cycle, attemptedPrimitives, summary }` targeting the **board's `decisions` panel** (§13.13 step 3.5 — the same path as the Two Generals strict termination).
- The board surfaces the escalation to the human watching the live board (§3 visualization SSoT).
- Human picks a release order (or restructures the dependency to remove the cycle) and emits a `decisions`-panel resolution that the affected agents pick up via `UserPrompt`.

This is the strict-deadlock fallback and matches the §13.13 termination rule for strict cycles. The new layer (this draft) adds the quasi-deadlock-specific primitives **above** the human-escalation gate, so most situations resolve before reaching the user.

---

## 5. Quasi-deadlock specific — deferred-review pattern

The 2026-05-31 EG ↔ main incident is the canonical case. EG submitted three artifacts for main review (`eux-format-v1`, `WS-PROTOCOL-KEY-MGMT`, `WS-PROTOCOL-UI6-SELECTION`). Main deferred review across cycles. No structural cycle existed — main could have reviewed at any cycle — but the deferral degraded the friction visibly over wall-clock until the user surfaced it.

**Recommended discipline — Review SLA**:

- **On A2A message receipt**, when the message implies a deferred response (review request, decision request, opinion request — anything that is not "immediately processed and acked"), the recipient emits `CUSTOM/ReviewSLAAck { ackFor: msgId, eta: <N cycles or wall-clock>, kind: 'SLA-OR-WORK' }` as part of its inbound processing.
- **`SLA-OR-WORK` semantics**: "I will either complete this work within `eta`, OR if I cannot, I will emit a *renegotiate-SLA* message before `eta` expires explaining the new ETA and reason. I will NOT silently let the SLA elapse."
- **On SLA expiry without renegotiation**: the sender is authorized to treat this as a quasi-deadlock signal — escalate via §4.a (priority re-order), §4.c (mediation), or §4.d (human escalation) per the orchestration tree.

**Why this works**: the failure mode of quasi-deadlock is *implicit deferral*. Making the deferral *explicit and SLA-bounded* converts a silent-degrade into a contract — either the contract is honored (no friction) or it is renegotiated (visible reason) or it is breached (triggers escalation). The user no longer has to be the first to notice.

**Composition with §13.13**: `ReviewSLAAck` sits in the ack-layer vocabulary alongside `AckProcessed`. It is a *commitment* ack — "I will process this within `eta`" — distinct from the *completion* ack (`AckProcessed { kind: 'processed' }`). A message can receive `Ack{delivered}` (server) → `ReviewSLAAck { eta }` (recipient agent, on inbound parse) → `AckProcessed` (recipient agent, on actual completion). Three ack stages, three layers, no conflation.

---

## 6. A2A turn connection — agent-active correction

Constellation runs on a turn-based agent model (Claude Code). The harness `SIGSTOP`s background tasks while the agent's foreground turn is active and `SIGCONT`s them when the turn ends (§13.16.6 wall-clock vs task-clock observation). This has a direct consequence for deadlock detection:

**Wall-clock timeout ≠ task-clock timeout.** A wall-clock timeout of 60 min, with the recipient spending 25 min in foreground turn activity during that window, has a true elapsed-as-the-watcher-sees-it of ~35 min — well under the 60-min threshold.

**Formal expression**:

```
effective_elapsed = wall_clock_elapsed - sum(agent_active_duration during wait window)
```

For deadlock-timeout decisions, use `effective_elapsed`, NOT `wall_clock_elapsed`. The agent-active duration is observable via:

- The watcher's `WAKE`/`REARM` markers (§13.16.6) — the gap between expected and actual rearm fires is the agent-active duration.
- The agent's own emission timestamps in `ws-history` (continuous emissions during a turn imply active; gaps imply paused or between turns).
- An explicit `CUSTOM/TurnActive { agentId, startedAt }` / `CUSTOM/TurnEnded { agentId, endedAt }` pair, if the joint spec adds these to the wire (proposed; see §9 Q4).

**Why this matters for deadlock**: without the correction, every long agent-active turn looks like deadlock to a naive timeout. With the correction, only the actual gaps between turns count — and gaps between turns ARE the appropriate signal for "agent is not currently processing this", which is what the deadlock primitive needs.

---

## 7. Two Generals link (§13.13)

§13.13 already establishes the ack-layer + human-escalation termination for *strict* deadlocks via the Two Generals impossibility result: when retransmit cannot make the situation better, the autonomous primitives terminate and the escalation goes to the board's `decisions` panel.

**This proposal layers above §13.13's ack layer**, NOT in place of it:

- **§13.13 ack layer** covers: `delivered` (server) → `read` (bridge, optional) → `processed` (agent, recommended). Plus `Ping`/`Pong` keepalive and the conservative multi-probe retry-or-escalate decision tree.
- **This proposal adds**: `ReviewSLAAck` (commitment intermediate between `delivered` and `processed`), wait-edge graph detection, the four resolution primitives, and the quasi-deadlock-specific SLA discipline.
- **Strict-deadlock fallback unchanged**: when the resolution primitives in §4 don't break the cycle, the escalation path is the same `CUSTOM/EscalationRequest` to the `decisions` panel that §13.13 already specifies. This proposal does NOT re-invent the strict-deadlock termination; it adds the *quasi-deadlock-resolving* layer above so that fewer situations reach the strict-termination path.

**Layering diagram** (informal):

```
[ Application layer — work / review / decision content ]
       |
[ §13.x quasi-deadlock layer (THIS PROPOSAL) ]
   - Wait-graph detection
   - Review SLA ack
   - Priority / preempt / mediate / escalate
       |
[ §13.13 ack layer ]
   - delivered / read / processed
   - Ping / Pong keepalive
   - Conservative multi-probe → human escalation
       |
[ §2 A2A wire ]
   - msgId / parentId / targetAgentId
   - CUSTOM payloads
```

---

## 8. Proposed §13.x sub-section structure

For the joint Constellation.md sub-section, the proposed shape:

### 8.1 New `CUSTOM` message types

| Name | Direction | Purpose | Required fields | Optional fields |
|------|-----------|---------|-----------------|-----------------|
| `DeadlockProbe` | agent → board / peer | Report a detected wait-cycle or quasi-deadlock candidate | `cycleMembers[]`, `waitEdges[]`, `class: 'strict' \| 'quasi'` | `summary`, `proposedResolution` |
| `ReviewSLAAck` | recipient agent → sender | Commit to a response budget for a deferred-response inbound | `ackFor: msgId`, `eta: ISO-Z \| cycles: N`, `kind: 'SLA-OR-WORK'` | `note` |
| `PreemptRequest` | lower-priority → higher-priority | Voluntarily release a wait edge | `releasing: msgId`, `reason` | |
| `PreemptForce` | higher-priority → lower-priority | Forced reclaim | `reclaiming: msgId`, `reason` | |
| `MediationProposal` | mediator → cycle members | Proposed release order to break cycle | `cycleMembers[]`, `proposedReleaseOrder[]` | `rationale` |
| `MediationAck` | cycle member → mediator | Accept / reject mediation proposal | `for: mediationMsgId`, `accept: bool` | `note` |
| `EscalationRequest` | agent → board `decisions` panel | Human-escalate the cycle | `cycle`, `attemptedPrimitives[]`, `summary` | `proposedQuestion` |

### 8.2 State machine

```
       inbound deferred-response message
                       │
                       ▼
                   WAITING ──────────────────┐
                       │                     │
                       │ (recipient agent     │ (timeout > SLA without
                       │  emits ReviewSLAAck) │  ReviewSLAAck)
                       ▼                     ▼
                  SLA_AGREED          QUASI_DEADLOCK
                       │                     │
                       │                     │ (resolve via §4 primitives)
                       │                     ▼
                       │              ESCALATED ── human → CLEARED
                       │
                       │ (recipient processes)
                       ▼
                   REVIEWING
                       │
                       │ (recipient emits AckProcessed)
                       ▼
                    CLEARED
```

Strict-deadlock detection (cycle in wait-graph) can fire from any of `WAITING` / `SLA_AGREED` / `REVIEWING` if a cycle is identified — transition to `STRICT_DEADLOCK` and follow the §4 primitives in escalating order.

### 8.3 Permission table

| Message type | Who may emit | Server filter |
|--------------|--------------|---------------|
| `DeadlockProbe` | Any agent (typically the one observing the wait) | None — informational |
| `ReviewSLAAck` | Recipient agent only (bridge MUST NOT auto-emit, cf. §13.13 no-auto-pong) | Validates `ackFor` references a real inbound `msgId` |
| `PreemptRequest` | Lower-priority party in the cycle (per orchestration tree) | None |
| `PreemptForce` | Higher-priority party in the cycle | Logged to `decisions` panel for audit |
| `MediationProposal` | A designated mediator agent OR the board adapter | None |
| `MediationAck` | Cycle members named in the proposal | None |
| `EscalationRequest` | Any cycle member after attempting §4 primitives | Auto-surfaced to `decisions` panel |

### 8.4 Persistence

- `ReviewSLAAck` entries persist in the agent's outbox/inbox and in `ws-history/<agentId>.jsonl` per §2 conventions.
- The wait-edge graph is reconstructable from `ws-history` alone (no separate persisted state needed) — this preserves the §13.13 invariant that the wire shape carries the truth and the server / bridge only stamp it.
- Strict-deadlock escalations persist in the board's `decisions` panel as first-class artifacts (re-readable across restarts, surfaced to humans).

---

## 9. Open questions for main deep-research cross-reference

These are items where the EG-side draft has a working position but the main upstream deep-research is expected to bring rigor / literature / formal proofs. Reconciliation at joint-formalization time:

### Q1. Distributed deadlock detection algorithm tradeoffs

The §3 wait-graph detection sketched here is naïve (per-agent DFS on `ws-history`). Distributed-systems literature has several established algorithms (Chandy-Misra-Haas edge-chasing, Mitchell-Merritt probing, path-pushing). Which fits Constellation best given the constraints: (a) bounded number of agents (typically < 20), (b) all messages already persisted in `ws-history`, (c) board mediator available, (d) human-escalation gate available? Specifically, does the joint spec want a *true* distributed algorithm (each agent runs detection locally and exchanges probes) or a *centralized* one (board adapter aggregates all wait edges)?

### Q2. CNP (Contract Net Protocol) negotiation fit

The Review SLA discipline in §5 borrows the *spirit* of Contract Net (announce → bid → award → result). Does the formal CNP protocol map cleanly onto Constellation's A2A primitives, or does it require additions to the ack-layer vocabulary? Specifically: CNP's *bid* phase doesn't have an obvious Constellation primitive — `ReviewSLAAck { eta }` is closest, but CNP allows multiple bidders for one task, which the current EG↔main setup doesn't. Does the joint spec want to support multi-bidder review (e.g., "any of these three peer agents may take this review") or restrict to bilateral SLA?

### Q3. Mediator placement — board adapter vs third-party agent

§4.c sketches two mediator topologies: a dedicated mediator agent vs a built-in board-adapter cycle detector. The trade-off is server-coupling (board adapter knows about application protocol) vs system overhead (third-party agent uses an agent slot). Which does the joint spec adopt? Or both, with the choice deferred to deployment-time policy?

### Q4. Human-in-the-loop fallback threshold

§4.d uses "timeout × 2" as the trigger for human escalation. Distributed-systems literature has more rigorous thresholds (e.g., bounded probe count, Lamport-clock-based aging). What's the right formal threshold for human escalation in a Constellation deployment where the human watching the board has cognitive bandwidth that itself becomes a constraint above ~3-5 escalations/day? The alarm-fatigue gating principle (§13.13) constrains how loud the escalation layer can be.

### Q5. A2A-turn vs traditional process-model assumptions

Most distributed deadlock literature assumes processes that are continuously running and respond to messages with bounded latency. Constellation's turn-based agents have `SIGSTOP`-while-foreground-active windows that violate this assumption (§6 / §13.16.6). Which classical results survive the relaxation, and which need adaptation? Specifically: does the wait-edge graph need a *liveness* augmentation (track which agents are currently in-turn) beyond just the wait edges themselves?

### Q6. Renegotiate-SLA frequency limit

§5's `SLA-OR-WORK` discipline allows the recipient to renegotiate before SLA expiry. What's the limit before "renegotiation" becomes "implicit indefinite defer" (i.e., the quasi-deadlock returns in a different form)? Possible answers: a fixed cap (N renegotiations max), an exponential-backoff style budget, or a human-escalation trigger on the third renegotiation. Joint spec should pick one.

---

## 10. Cross-links to existing §13 sections

- **§13.9 (OnboardAck role branching — collab/upstream are peers)** — the orchestration tree priorities in §4.a depend on the role classification. Collab/upstream peers don't take `Delegate` from a hub-main; they coordinate via peer A2A. The deadlock primitives must respect this: forced reclaim (§4.b) from main against an upstream peer would violate the peer-coordination contract.
- **§13.11 (Board emission discipline)** — every primitive emission in §4 is itself a board "safe point" (§13.11.1) and MUST be emitted to the board, not just sent A2A-bilaterally. The board is the visualization SSoT; the human watching the board must be able to see *which primitive is in flight* without inspecting individual agent state. Conversely, deadlock primitives are NOT autonomous heartbeats (§13.11.2) — they only fire on actual wait-state events.
- **§13.13 (A2A ack layer)** — this proposal explicitly layers above. The ack vocabulary is preserved (`Ack{delivered}` server, `AckProcessed` agent); this proposal adds `ReviewSLAAck` as the *commitment* ack between them, plus the deadlock-specific message types in §8.1. The conservative multi-probe + human-escalation tail (§13.13 step 3.5) is the strict-deadlock fallback this proposal still terminates into.
- **§13.16.6 (Watcher liveness probe + cursor-tail + wall-clock vs task-clock)** — directly informs §3.3 and §6. The same `SIGSTOP`-during-agent-active observation that motivated the cursor-tail also motivates the agent-active correction for deadlock timeouts. The cursor-tail discipline itself ensures that no `DeadlockProbe` is missed across watcher gaps.
- **§13.17 (Main-chat structured-choice prompts FORBIDDEN)** — human escalation in §4.d MUST route via the board's `decisions` panel, not via inline `AskUserQuestion` in main-chat. This is the same discipline applied to the deadlock escalation surface; the question and the human's resolution become first-class A2A artifacts (re-readable across turns and agents).
- **§13.18 (Non-branching choices — recommend + proceed)** — the §4 primitive sequence (priority → preempt → mediate → escalate) is itself a *non-branching* choice path for the typical case. An agent encountering a quasi-deadlock SHOULD NOT escalate to the human just to ask "which primitive should I use?" — the primitive order is the recommendation, and the agent proceeds. The user pivots only if the wrong primitive is being applied for the situation. This is the §13.18 discipline applied at the deadlock-resolution surface.

---

*End of v0.1 draft. Awaiting main upstream deep-research output for §9 question reconciliation and joint formalization.*
