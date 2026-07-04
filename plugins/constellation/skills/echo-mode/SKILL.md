---
name: echo-mode
description: Toggle echo-mode for an agent — mirror its local human↔agent chat onto the Constellation board's real-time conversation channel, so a human at the board can see and drive the agent (remote-control substrate). Three levels — `off`, `on` (turn-final conversation), `mirror` (live activity stream: progress + thinking, chat-gateway/Telegram-bot feel). Use via `/echo-mode off|on|mirror|status [agentId]`. When enabled, the agent mirrors its turn output (and, at `mirror`, live tool/step progress + thinking narration) to its board channel, quotes board-originated prompts into the local chat before acting, and renders decisions as plain-text choices locally + a SelectionPrompt chip-card on the board (never a blocking local selection UI). Spec: Constellation.md §13.26.
---

# /echo-mode — mirror the local chat to the board (remote-control)

Bridges an agent's **local** client conversation (Claude Code / IDE / terminal) with the **board's** real-time conversation channel, both directions, so a human *watching the board* can also *drive* the agent through it. Full spec: **`Constellation.md §13.26`**. This skill is the SSoT for the runtime discipline; the `echo-emit.cjs` hooks (when installed) mechanize the outbound mirror.

## Invocation + levels

`/echo-mode off|on|mirror|status [agentId]` — no `agentId` targets the invoking agent; targeting another is main-authority gated.

| Level | Mirrors (local → board) |
|---|---|
| **off** | nothing |
| **on** | the human's prompt + the assistant's **turn-final text** + selection prompts (conversation echo) |
| **mirror** | everything in `on` **+ live progress** (tool calls, steps, run boundaries) **+ thinking narration/summary**, streamed *as the turn runs* (chat-gateway / Telegram-bot feel) |

**Board→local drive works at both `on` and `mirror`** — only the outbound richness differs. On any change, announce `EchoModeState { agentId, level, provenance }` to the board (idempotent) so the dashboard badges the agent and renders its channel as a live conversation.

## Protocol when enabled (§13.26.1–.2)

**Local → board (mirror out):**
- After each assistant turn, emit the turn's user-facing text to *this agent's* board channel as a `TEXT_MESSAGE` (streaming `TEXT_MESSAGE_START`/`_CONTENT`/`_END` if the client can stream). Both levels.
- Emit the **human's local prompt** that opened the turn as `UserPrompt { source:'user', text }`. **Do not re-emit a prompt that arrived from the board** — it is already there; just quote it locally (below).
- **`mirror` only** — stream live progress *as the turn runs*: tool calls → `TOOL_CALL_*` cards, steps → `STEP_*`, run boundaries → `RUN_STARTED`/`_FINISHED`, and thinking narration → short status `TEXT_MESSAGE`/`STEP` lines + a turn-end thinking summary. Not raw verbatim chain-of-thought (too verbose, no host thinking-hook) — progress + narration + summary.

**Board → local (drive in):**
- A `UserPrompt` arriving from the board (a human typed into the board's real-time window for this agent) is inbound via the normal inbox/watcher (§13.16). On receipt, **first echo it into the local chat as a quoted line** — `> board: <text>` — and *then* act on it. The local transcript must remain a faithful, self-contained record.

**Decisions / structured choices (§13.26.2 — the §13.17 reconciliation):**
Never present a blocking selection UI in the local chat while echo-mode is enabled (it would hold the turn and defeat remote-control). Instead: (1) local chat prints options as **plain text** (`1/2/3` or `a/b/c`) + accepts a **free-form prompt**; (2) the board gets a `SelectionPrompt` chip-card (§13.16.12 #406 UI6); (3) resolve on **either** surface — first wins, dim the other (`SelectionResolved`).

## Board-legibility formatting (§13.26.6)

Mirrored text lands in the board's conversation stream — format for it: **sequenced/numbered items each on their own line** (one `①`/`1.` per line, never an inline run-on), short lines preferred. A render-target rule, not a content rule.

## Default by join provenance (§13.26.3)

- **Human-joined** (a person issued its key / launched it) → default **off** — the human already has a direct client; mirroring is redundant.
- **Agent-spawned** (another agent called/spawned it — board-observer via `join-local.cjs`, sub-workers) → default **on** — the human has no direct client for it, so the board is the only way to see/drive it. (Escalate to `mirror` when live activity visibility is wanted.)

`/echo-mode <level> <agentId>` overrides per-agent; an explicit user instruction always beats the provenance default.

## Safety (§13.26.5)

- **Exposure is disclosure.** Echo-mode copies the local chat onto the board, so the board's access surface (§13.25 #5a) decides who can read it. **Warn (or refuse)** when the target board is exposed beyond loopback/allowlist; apply §13.14 redaction to emitted content. Remote-control convenience never overrides the access gate.
- `mirror` is action-granular (tool/step live) but still not token-streaming within a message; `on` is turn-granular. Treat the board audience as the disclosure scope.

## Spec source

`Constellation.md §13.26` (protocol SSoT) · §13.17 (main-chat choice → board) · §13.16 / §13.16.12 (inbox + dashboard conversation render) · §13.25 #5a (access surface) · §13.14 (redaction).
