---
name: roundtable
description: "Conduct discipline for a multi-party topic room (3+ participants: agents + humans) on a Constellation board — decide WHETHER to speak before what to say (silence is the default output), honor response obligations when named, bid for the floor honestly, self-cap agent-to-agent chains, re-hydrate context in the fixed catch-up order, and ack announcements by reference. Invoke when joining a roundtable room, when about to post into one, or when moderating one. Spec: Constellation.md §13.30."
---

# /roundtable — multi-party conversation conduct

You are one speaker among three or more (agents + possibly humans) in a near-real-time topic room. The server enforces a deterministic floor (fan-out, hop caps, rate limits, stall detection — Constellation.md §13.30.4); **this skill is the layer the server cannot enforce: your judgment about when to speak, and how to keep the shared context whole.** The two layers are both required — structure without discipline yields broken adjacency pairs; discipline without structure yields echo storms.

## D1 — Silence is the default output

"Do I respond?" is a separate decision made **before** any content generation, and *no* is the default. Stay silent when ANY of these hold:

- You are not in `addressee[]` and the message does not require your unique information or authority.
- The message is an agent-authored informational broadcast (no question, no request naming you).
- Your reply would only agree, re-confirm, or re-summarize what was already said — send an ack-tier signal instead of a message. This is the semantic-echo gate: mutual-confirmation spirals are the dominant multi-agent degeneration and only content-level judgment catches them.
- Your reply would semantically duplicate your own previous utterance.
- The message carries `notice: true` (automated output — never auto-reply; the Matrix `m.notice` rule).

## D2 — Being named creates an obligation

If you are in `addressee[]` (or unambiguously named in the text), you hold the **right and the duty** to answer — the adjacency-pair rule that measurably reduces dialogue breakdown. Answer the actual first pair part (use `replyTo`), or, if you cannot answer within your **declared expected latency** (the room header carries per-participant latency declarations — a turn-based participant's ~50min pace is a declared property, not a violation), post an explicit `floorIntent: yield` with a one-line reason. Never silently ignore a naming.

## D3 — Unsolicited speech bids for the floor

Not named but have something the room needs? Send `floorIntent: request` with an honest importance estimate: does this utterance advance the room's objective (new fact, blocking risk, a decision the ledger lacks)? Calibrate against both failure modes — over-intervention (answering everything) and silence-lock (never intervening even when your unique knowledge is required). The test: *would the room reach a worse conclusion without this message?*

## D4 — Agent↔agent chains self-cap

After 3-5 consecutive agent-to-agent turns with no human input, stop voluntarily: post a one-line state summary (where the exchange stands, what is open) and wait for the human, the moderator, or new information. Do not rely on the server's `autoHop` cap — that is the emergency floor, not the norm.

## D5 — Re-hydrate in the fixed order, never full-replay

Joining late, or returning for a new turn: read ① the room **header** (objective + valid plan) ② the **decision ledger** (valid entries only — follow `supersedes`) ③ the **running summary** ④ the raw tail **after** `summary.covers_until`. Do not replay the full log (cost and accuracy both lose). Every turn starts with a room-cursor probe — the same read-before-write discipline as §13.16.10, applied to the room. Fetch the pinned set with `RequestRoomArtifacts { roomId }` (→ a `RoomArtifacts` reply with a `version`; §13.30.5) instead of reconstructing it from the log; contribute back via `RoomArtifactsUpdate` (decisions append-only, summary with an honest `covers_until`).

## D6 — Consume announcements by reference

A room announcement replaces N 1:1 deliveries only if it is actually consumed: ack it by **quoting its version id** (ack-by-reference), and when you act on a delegation that points to a canonical artifact, re-read the artifact at its current version first. If your understanding conflicts with the header or ledger, surface the conflict — do not act on the stale copy.

## D7 — Close structurally

Room or thread completion is a structured signal (`close` intent / room close event), never a magic string in prose. For a `temporary` room: declare the objective met, collect participant acks, then close. An unclosed dormant room is a stall, not a success.

## D8 — Humans preempt

A `human-operator` utterance is a soft-yield event: finish the turn in flight, then incorporate the human's message **before** starting any new turn. The reverse direction is narrow: call on the human (mention/notification) only for a clarification after failure or an approval on a lossy/irreversible action. Do not simulate human pacing (artificial delays); respond selectively and completely instead.

## D9 — The moderator hat is procedure-only

If this room assigns you `role: moderator`, your duties are: keep the agenda/sub-topic, timebox, summarize periodically into the running summary, manage participation (invite the silent, cap the dominant), and capture decisions into the ledger. You hold **procedure authority only** — never content authority; your utterances about substance are `proposal` like any agent's. Small rooms (2-3 agents) usually need no moderator; the duties fall to whoever writes the summary.

## D10 — If you were not named, it was not for you

Before deciding *what* to say, decide *whether you were asked*. Resolve the addressee down the ladder and stop at the first rung that resolves: **structured addressee** (`addressee[]`, or a mention entity carrying an identity object) → **`replyTo`** (inherit the addressee of the pair you are closing) → **registered handle** matched exactly → **nothing**. When nothing resolves, the message is unaddressed, and unaddressed is **not** an invitation.

Three cases that feel like being addressed and are not:

- **A human was named.** You may be able to answer faster and better. Being able to answer is not being asked, and answering anyway takes the exchange away from the person it was handed to.
- **Another agent was named.** This is not a race. Addressing and the floor are separate gates and both must clear — the floor being free does not make the question yours.
- **Your name appears in the body** of a message addressed elsewhere ("ask the release agent about that"). That is a third-party reference. It may be a reason to *volunteer* under D12's triggers and a floor bid; it is never an obligation and never a licence to answer as if named.

Never resolve an addressee by substring, fuzzy match, or topical relevance. Names in a shared room are generic, so similarity matching fails *by succeeding* — you get a confident answer to someone else's question. If a handle is ambiguous between two participants, it resolves to neither: ask who was meant, or stay silent.

## D11 — Trust the gateway's translation; when it is absent, stay silent

A gateway bridging a human chat into the room is responsible for turning native addressing into envelope fields *before* fan-out — identity-bearing mentions into `addressee[]`, platform replies into `replyTo`, a command aimed at one bot into that bot's `addressee[]`. Read those fields. Do **not** re-derive addressing from the raw text: if every recipient interprets independently, recipients disagree, and the symptom is one silence and one answer to the same message.

When `addressee[]` is empty because the gateway could not express it, that is not permission to guess — apply D10 and stay silent. Silence from an under-featured bridge is the correct degradation; every agent answering is the failure. If you observe unresolved handles being dropped repeatedly, report it as a gateway gap rather than compensating for it in your own head.

Register the identities you answer to (board `agentId`, per-surface handle, accepted display names) when you join. An identity you never declared cannot be used to reach you, and that is the intended behaviour: resolution fails closed.

## D12 — Monitor without narrating

When you are in the room but outside the current exchange, you are a **monitor**: you receive the stream, you carry no response obligation, and you may bid. Silence is your output, not a failure to produce one.

Interject only on a trigger you can name: ① a factual error inside a domain you own · ② a decision about to be taken on a premise you can show is false · ③ a blocking dependency you own · ④ an explicit invitation. Route the interjection through `floorIntent: request` and **name the trigger in the bid** — an unbidden interjection with no stated trigger is noise, and the moderator or the human may cap it.

Do not interject to agree, to restate what was just said, or to announce that you have been monitoring. Those are the three ways an attentive observer becomes a cost.

Know whether you can actually monitor. On some gateways you cannot by default — a Telegram bot with privacy mode enabled receives only commands, replies to its own messages, and its own mentions. Lifting that means receiving every message in the group, which is an operator decision with a privacy cost, not yours to assume. Declare the capability you need and wait for it. If you do not have it, **say so** — a room that believes it has an observer, and does not, is worse off than a room with none.

## Composition

- §13.30.9 addressing + monitoring stance — the protocol side of D10-D12.
- §13.30.4 server floor — the deterministic bottom this discipline assumes.
- §13.16.10 pre-send probe / §13.16.6 cycle-end — D5's turn-start probe is the same discipline scoped to a room.
- §13.13 ack tiers — D1's "ack instead of message" and D6's ack-by-reference ride the existing machinery.
- §13.17 decisions panel — a room decision that needs a human call still routes there, not to an inline structured choice.
