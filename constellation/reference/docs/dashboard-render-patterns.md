<!-- module: Constellation reference; layer: dashboard-render-patterns; part-of: EstreGenesis 2.5; version: v0.1.0; date: 2026-06-01; license: Apache-2.0 -->

# Dashboard render patterns — Constellation board UI guide

> **Companion to `Constellation.md`.** Constellation's wire protocol (§13.11 envelope, §13.16.9 classification) governs what the server sends and how the receiver classifies it. This document covers everything **above** the wire — the render-side patterns that make a Constellation board *usable* once the bytes arrive. The wire spec alone is not enough to build a board: a renderer that displays envelopes as raw JSON technically conforms to the wire contract while delivering an unusable UI. The patterns below were surfaced through dogfooding the reference dashboard against an active multi-agent session over 2026-05~06, and are recorded here so downstream Constellation adopters can reuse the patterns instead of rediscovering them.
>
> **Scope.** These are render-side patterns, not contracts. Adapt the pattern shape to your stack (vanilla DOM / framework / native); the *what* is portable, the *how* is your runtime's idiom. Where a pattern depends on a wire-side invariant, the wire-side rule is named explicitly and linked back to `Constellation.md` by section.

---

## §1 Introduction

The reference dashboard (`constellation/reference/dashboard/index.html` + `style.css` + `app.js`) ships a vanilla-DOM master copy of a working Constellation board: it consumes the `state.json` SSoT (per `constellation/reference/state-schema.md`), renders the per-channel chat panel, surfaces the agent roster, and provides the dashboard chrome (banners, indicators, key-management UI). It is a starting point; downstream adopters are expected to re-skin or re-implement it for their stack while preserving the **behavioral patterns** that make the board usable.

This document captures eight such behavioral patterns. They share three common properties:

1. **Wire-protocol-adjacent, not wire-protocol.** Each pattern sits at the render tier. None of them changes the §13.11 envelope shape. Adopters who change the wire shape break compatibility; adopters who change the render side stay compatible while diverging in surface UX.
2. **Surfaced through dogfood, not foreseen at design.** Each pattern documented here corresponds to a defect or rough edge observed in an active session. The dashboard worked "well enough" before the dogfood; after, eight specific render-side patches landed and stuck. The pattern descriptions below are abstracted from those patches — adopters get the abstraction without needing to reproduce the dogfood cycle that surfaced it.
3. **Composable.** The patterns can be adopted independently in any order. Adopting §3 (collapse pitfall) without §2 (A2A row interaction) yields a usable board with a non-interactive chat list; adopting §2 without §3 yields an interactive list with a subtle visual bug. The patterns are presented in roughly the order an adopter is likely to encounter the underlying need.

The patterns reference commit SHAs of the upstream reference dashboard for implementation traceability (without quoting code — the SHA plus the function name is sufficient for an adopter who wants to read the implementation). The reference implementation is the canonical source; this document is the abstraction layer.

---

## §2 A2A row interaction — hover preview, click pin, drag mobility

**Pattern.** A2A messages on the board chat panel afford **three discovery stages**, each invoked by a more deliberate gesture than the prior stage:

1. **Glanceable summary** — the row in the chat list always shows the envelope's name, target, and a one-line subject. No interaction required.
2. **Hover preview** — moving the cursor over the row opens a *non-modal 4-quadrant peek panel* that renders the envelope body (the `value` field) without committing the user to a deep read. The peek panel positions itself in the quadrant of the viewport diagonally opposite the row, so it does not obscure the row or the surrounding context. Moving the cursor off the row dismisses the peek.
3. **Click pin** — clicking the row converts the peek into a **pinned floating panel** with three controls: a pin badge (visual confirmation the panel is now sticky), a close button (`✕`), and a header drag handle. The pinned panel remains visible until explicitly closed; it does not dismiss on cursor-off. Multiple pins can be open simultaneously for side-by-side reading.
4. **Drag arrangement** — the floating panel can be dragged by its header to any position on the board. The drag uses a **relative-cursor offset** (the panel does not snap its top-left to the cursor; instead it preserves the offset between the cursor and the panel's top-left at drag-start). Multi-panel drags compose into ad-hoc workspace arrangements (e.g., two pinned A2A envelopes side-by-side for comparison).

**Why three stages.** The single-stage default (everything inlined in the row, always expanded) crashes the chat panel as soon as envelope bodies grow past a few lines. The single-stage alternative (everything collapsed, click-to-expand-in-place) makes side-by-side comparison impossible — only one body can be expanded at a time, and the act of expanding one collapses the previous. The three-stage form covers the three real user needs (skim, deep-read, compare) with progressively more deliberate gestures.

**Implementation outline.** Reference impl: `wsRowHover` (the 4-quadrant positioner — quadrant choice is a function of the row's bounding rect relative to viewport center), `wsA2aCardEl` (the row element factory — attaches hover and click handlers), the click handler hydrates the floating panel (creates the pinned DOM node, transfers content from the peek panel), the header drag handler tracks `mousedown → mousemove → mouseup` with a stored offset. Reference commits: `0b97e7a` (initial three-stage shape), `d01c881` (pin/close controls), `a84868a` (header drag with relative-cursor offset).

**Pitfalls.** The peek panel's 4-quadrant positioner must clamp to the viewport (not just to the document) — a row near the bottom edge of the scroll region produces a peek that overflows the viewport unless the positioner accounts for `window.innerHeight` separately from `document.documentElement.scrollHeight`. The pinned panel's drag handler must `event.preventDefault()` on the header `mousedown` to suppress text selection during drag.

---

## §3 Collapse `[hidden]` CSS pitfall + triangle indicator direction

**Pattern.** When a board element supports a collapse toggle, two render-side details govern whether the toggle actually works:

**Detail A — the `[hidden]` CSS pitfall.** The HTML5 spec assigns the global `hidden` attribute a default UA stylesheet rule of `[hidden] { display: none }`. This rule applies *only* if no more-specific `display` rule overrides it. A site stylesheet that sets `display: flex` (or `grid`, `inline-block`, etc.) on the collapsing element silently overrides the UA's `[hidden] { display: none }` — the element's `hidden` attribute toggles in the DOM but the element remains visible because `display: flex` (specificity higher than UA's `display: none`) wins.

**Symptom.** The collapse toggle appears to work (the indicator updates, the `hidden` attribute toggles in DOM Inspector), but the collapsed body stays on screen. Diagnosis by sight: "I clicked the chevron but nothing happened." Diagnosis by DOM Inspector: "but `hidden=""` is set on the element." Diagnosis by computed style: "but `display: flex` is winning."

**Fix.** Add an explicit, more-specific rule:
`.ws-a2a-body[hidden] { display: none }` (or the equivalent selector for the project's class names — the key is the `[hidden]` attribute selector combined with the body's class to win specificity over `display: flex`).

The fix is one CSS line. The diagnostic time is hours if the bug surfaces in production without prior awareness of the UA-vs-site-stylesheet specificity rule. Naming the pattern surfaces the awareness; adopters who read this document patch their stylesheet on day one and never hit the bug.

**Detail B — triangle indicator direction.** When a row carries a collapse toggle button, the button's icon conveys state:

- **Expanded state** — `▾` (downward-pointing triangle). The triangle "points at" the visible content below. Universal convention; users read it without hesitation.
- **Collapsed state** — `◀` (left-pointing triangle), **not** `▸` (right-pointing). The collapsed indicator points to the *left*, semantically conveying "the content is on the left of / before this button" — i.e., the content has been collapsed back into the row to the left of the indicator. The right-pointing alternative `▸` reads as "click to expand to the right," which is fine in tree views but wrong on a chat row where the collapsed content is *not* to the right (it is the row itself).

Toggle button placement: the indicator button sits at the **rightmost end of the row**, separated from the row's click handler by a small gutter. The button must not propagate its `click` event to the row's outer handler (otherwise clicking the toggle also pins the floating panel from §2, producing a confusing double-action). The standard fix is `event.stopPropagation()` in the toggle's click handler — but this conflicts with rows that *use* the propagation for other purposes. The cleaner rule: the toggle button sits as a sibling, not a descendant, of the row's clickable region, so propagation doesn't reach the row's handler in the first place.

**Implementation outline.** Reference impl: `.ws-a2a-body[hidden] { display: none }` in the stylesheet (commit `16490ba`); triangle indicator with `▾` / `◀` glyphs and rightmost-of-row placement (commit `201ccf7` — `wsA2aRowToggle`). The `stopPropagation`-vs-sibling decision is implementation-local; both work as long as the row's outer handler does not double-fire.

---

## §4 Board render card form — envelope summary card vs raw TEXT fallback

**Pattern.** A2A-intent CUSTOM messages (per §13.16.9 allowlist) render on the board chat panel as **envelope summary cards**, not as raw JSON or raw text. The card form is:

```
[icon] name • targetAgentId • brief subject
       ↓ (collapsible)
       full value body, syntax-highlighted, scrollable if large
```

The icon is mime/name-mapped (e.g., `Report` → 📊, `Delegate` → 🎯, `PRRequest` → 🔁) — a glanceable visual hash distinct from text. The summary line carries the three highest-information fields: `name` (envelope class), `targetAgentId` (the routing endpoint, abbreviated to short form), and `subject` (the first ~80 chars of `value.re` or `value.summary` if present, else the first key of `value`). The collapsible body section renders the full `value` JSON with syntax highlighting and a max-height scroll if the body exceeds ~400px.

**Board-directed CUSTOM** (the §13.16.9 board-directed allowlist — `Status`, `Typing`, `UserPromptAccepted`, `ConnectionRestored`, etc.) render as their own UX surface, not as cards. Examples:

- `Status` — a system-notice strip at the top or bottom of the chat panel, color-coded by state (`online` / `offline` / `error`).
- `Typing` — a typing indicator chip at the input area.
- `ConnectionRestored` — a banner that auto-dismisses after a few seconds.
- `Heartbeat` — not rendered on the chat panel at all (consumed by the liveness indicator only).

**Fallback for unknown `type`** — when an envelope arrives without `type:"CUSTOM"` (sender omitted it, server failed to stamp), the dashboard's render path falls back to `TEXT_MESSAGE` rendering: the entire envelope is displayed as plain text in the chat panel, including the JSON braces. This fallback is the *user-visible symptom* of the server-side type-normalization defect described in `Constellation.md §13.11.3` rule 1. With the server-side stamp in place, the fallback path is unreachable in practice; without it, every type-omitting agent produces a chat panel full of raw JSON text.

**Implementation outline.** Reference impl: `wsA2aCardEl` (the card factory — branches on `msg.name` against the §13.16.9 allowlist; falls through to `wsTextMessageEl` for unknown types); `wsStatusStripEl`, `wsTypingChipEl`, `wsConnectionBannerEl` (board-directed UX surface renderers). Reference commit: `b228ff4` (initial card form + per-name UX surface dispatch).

**Pitfall.** A card form that renders `value` as JSON without syntax highlighting is barely better than raw text. Syntax highlighting (Prism / Highlight.js / hand-rolled JSON tokenizer) is part of the pattern, not optional. Without it, deep-read of a card's body is effectively reading raw JSON.

---

## §5 Date-line divider — sticky midnight boundary

**Pattern.** When the message stream spans midnight, the chat panel inserts a **date-line divider row** at the boundary. The divider:

- **Text** — the local date in the viewer's time zone, formatted per locale. The reference impl uses `오늘 / 어제` ("today" / "yesterday") for the most recent two dates and an absolute `YYYY-MM-DD` label for older dates. English locale equivalent: "Today" / "Yesterday" / `YYYY-MM-DD`.
- **Decoration** — surrounding wavy dividers (`～ ～`) per the reference design language. Adopters may substitute their stack's divider idiom; the pattern is "visible row separator, not a thin line."
- **Sticky positioning** — `position: sticky; top: <header-height>; z-index: <below-header>`. The most recent date label stays visible as the user scrolls down through the day's messages; when the user scrolls past the next day's first message, the *next day's* date label takes over the sticky slot, and the prior day's label scrolls away. The sticky behavior gives the user a continuous "what day am I currently reading" signal without consuming permanent chrome space.

**Why this matters.** Multi-day chat streams are common on a Constellation board (an active agent session easily spans a workweek). Without date-line dividers, "what day did this happen?" requires hovering each row to read its timestamp. With dividers, the scroll position alone answers the question; the divider acts as a calendar gutter.

**Implementation outline.** Reference impl: the chat-panel renderer iterates messages in chronological order and inserts a divider node every time `new Date(epoch).toDateString()` changes from the prior message's date. The divider node is a `.ws-date-divider` element styled `sticky` against the chat panel's scroll container, not against the viewport (which would conflict with the page header). Reference commit: `201ccf7` (initial sticky date-divider).

**Pitfall.** The sticky `top` offset must account for the chat panel's own header (if any), not just the page header. Setting `top: 0` against the chat container often produces a divider that overlaps the column header. The right offset is `top: <chat-panel-header-height>` measured at runtime (since the header may vary in height across responsive breakpoints).

---

## §6 A2A attachment chip — inline file references in card bodies

**Pattern.** When an A2A message carries `value.attachments[]`, each attachment renders as an **attachment chip** inside the card body (§4), not as a separate row. The chip has four parts:

1. **Mime icon** — a small glyph mapped from the attachment's `mime` field (e.g., `image/*` → 🖼️, `application/pdf` → 📄, `text/markdown` → 📝, `application/zip` → 🗜️). The mapping is a small lookup table; unknown mimes fall back to a generic file icon.
2. **Filename** — the attachment's `name` field, truncated with ellipsis if it exceeds ~30 chars.
3. **Size** — the attachment's `size` field, formatted as a human-readable unit (`1.2 MB` / `420 KB`).
4. **Preview / download affordances** — clicking the chip opens a preview modal (for previewable mimes: images, PDFs, plain text); a separate download icon on the chip downloads the attachment regardless of mime.

**Why a chip, not a row.** Attachments are *part of the message*, not a separate event. Rendering them as separate rows creates a visual disjoint (the user sees "Report" and below it three orphan-looking file rows). Rendering as chips inside the card body keeps the attachment-message association visible: the chip is literally inside the card that carries the message.

**Chip ordering.** Multiple attachments render as a row of chips in the order they appear in the `attachments[]` array. The chips wrap to a new line if they exceed the card body's width.

**Implementation outline.** Reference impl: `wsAttachmentChipEl` (the chip factory — accepts an attachment object, returns a chip element); the card body's renderer iterates `value.attachments` and appends chips after the JSON body section. Mime icon table is a static map. Preview modal is a separate component (`wsAttachmentPreviewModal`) that the chip's click handler invokes. Reference commit: `201ccf7` (initial attachment chip).

**Wire-side note.** The `attachments[]` field is a render-tier concern; the §13.11 envelope shape says nothing about it. Adopters who carry attachments via a different field name (`files[]`, `media[]`) adjust the chip renderer's source field, not the wire. The chip pattern is portable across the field-name choice.

---

## §7 Closed-session connection indicator — green vs gray dot

**Pattern.** Every agent in the agent roster (the side panel that lists `main` / workers / collab / upstream agents) carries a **connection state dot** next to its name:

- **Green dot** — the agent is currently connected. The dot is filled (`●`) and tinted with the system's "online" green.
- **Gray dot** — the agent has been seen historically (its channel exists in `state.json` with prior history) but is currently disconnected. The dot is filled (`●`) and tinted gray; alternatively a hollow ring (`○`) carries the same semantic with sometimes-better visual distinction on dense rosters.

The agent's name remains visible regardless of connection state — a disconnected agent's row is not removed from the roster (that would lose the channel context); instead the row's dot updates and the row may shift to a "history-only" section of the roster for clearer grouping.

**Why this matters.** Without a connection indicator, a disconnected agent in the roster reads identically to a connected one. The operator cannot tell whether "is `worker-3` still in the room?" or "did `worker-3` finish and leave?" without inspecting connection logs. The dot answers the question at a glance.

**Tooltip details.** Hovering the dot surfaces the precise connection state: `connected since 14:32` (green) or `disconnected since 11:08` (gray). The timestamp uses the same local-time render rule as §2 (computed `new Date(epoch).toTimeString()`, not the wire-format ISO string).

**Implementation outline.** Reference impl: `wsAgentRosterEl` renders one row per agent in `state.json.agents`; each row carries a `.ws-conn-dot` element whose class is `online` / `offline` based on the agent's current connection state (tracked separately from the persisted roster — connection state is the live socket map, not a JSON field). A `MainChanged` / `AgentList` push updates the dot states in place. Reference commit: `201ccf7` (initial dot indicator + history-only grouping).

**Composition.** Pairs with §13.13's `delivered` ack semantics: a `gray` dot means "the wire is down for this agent" — the server's `delivered` ack will not arrive, the sender's probe-then-escalate flow (per §13.13 step 3.4) is triggered. The indicator is the operator's visual cue that the §13.13 layer is exercising its escalation path.

---

## §8 Upstream A2A general-tab detection — source-set-agnostic envelope classification

**Pattern.** The dashboard's "general tab" (a non-channel-specific view that aggregates A2A traffic across all peers, typically pinned at the top of the chat panel or in a dedicated tab) displays messages that match the **A2A-intent detection rule**. The detection rule (also codified at `Constellation.md §13.11.3` rule 2) is:

```
isA2AMessage(msg) ←
    msg.source !== "user"
  ∧ msg.source !== "board"
  ∧ msg.targetAgentId
  ∧ msg.targetAgentId !== <self-agentId>
```

**The fix this codifies.** A prior version of the dashboard's general-tab detection used `msg.source === "agent"` as the positive condition. This worked for messages emitted by local IDE bridges (which stamp `source = "agent"`), but **silently false-negatived all upstream A2A traffic**. Upstream agents (Hermes-style autonomous-runtime gateways and any compatible reimplementation) emit `source = <their-agentId>` — a nonstandard but conformant source value chosen by the upstream runtime. The positive-set assumption (`source === "agent"`) rejected those messages from the general tab, and operators reported "upstream A2A is invisible on the dashboard."

The fix is the source-set-agnostic detection rule: the negation pattern (`source` is neither `user` nor `board`) plus the `targetAgentId` presence-and-mismatch check. This rule classifies a message as A2A iff:

- It is not a user-typed message (`source !== "user"`).
- It is not a board-system message (`source !== "board"` — board sends its own broadcast notifications under that source).
- It has a routing target (`targetAgentId` is present).
- The target is not the viewer (`targetAgentId !== self-agentId` — the viewer's own inbox is the channel-specific tab, not the general tab).

Any other `source` value — `agent`, `<upstream-agentId>`, `<local-worker-agentId>` — passes the detection and lands on the general tab.

**Why the negation pattern is portable.** Upstream emitters are not bound to a fixed `source` vocabulary by the §2 protocol. The server is the authoritative source for `source` only when the sender omits it (§13.11.3 timestamp/source/type normalization composes for absent values); when the sender provides a `source`, the server passes it through. Receivers cannot rely on `source` being any specific value — they can only rely on it being *not* one of the two reserved values (`user`, `board`). The detection rule embodies this.

**Implementation outline.** Reference impl: `wsClassifyMessage(msg)` returns one of `'user' | 'board' | 'a2a' | 'self'`, used by the chat-panel router to decide tab assignment and by the agent-side inbound classifier to decide whether to surface the message in the agent's inbox queue. The function uses the negation pattern above. Reference commit: `201ccf7` (initial source-set-agnostic detection — the fix for the upstream-A2A-invisible defect).

**Composition.** This pattern is the **receiver-side** half of the rule codified at `Constellation.md §13.11.3` rule 2. The server-side half (the server may stamp `source` when the sender omits it) is independent — the receiver must not assume the server-stamped value is always `agent`, because upstream senders provide their own `source`.

---

## Implementation references appendix

The patterns above abstract over a series of reference-dashboard commits. The mapping (without quoting code — SHA + filename + function name) is:

| Pattern | Reference commit | Files / functions |
|---|---|---|
| §2 A2A row interaction — hover | `0b97e7a` | dashboard `app.js` — `wsRowHover`, `wsA2aCardEl` |
| §2 A2A row interaction — pin | `d01c881` | dashboard `app.js` — pin/close/header-drag handlers |
| §2 A2A row interaction — drag | `a84868a` | dashboard `app.js` — header drag with relative-cursor offset |
| §3 Collapse `[hidden]` CSS pitfall | `16490ba` | dashboard `style.css` — `.ws-a2a-body[hidden] { display: none }` |
| §3 Triangle indicator | `201ccf7` | dashboard `app.js` — `wsA2aRowToggle` |
| §4 Card form | `b228ff4` | dashboard `app.js` — `wsA2aCardEl`, `wsStatusStripEl`, `wsTypingChipEl` |
| §5 Date-line divider | `201ccf7` | dashboard `app.js` + `style.css` — `.ws-date-divider` |
| §6 Attachment chip | `201ccf7` | dashboard `app.js` — `wsAttachmentChipEl`, `wsAttachmentPreviewModal` |
| §7 Connection indicator | `201ccf7` | dashboard `app.js` + `style.css` — `.ws-conn-dot`, `wsAgentRosterEl` |
| §8 Upstream A2A detection | `201ccf7` | dashboard `app.js` — `wsClassifyMessage` |

The reference dashboard (`constellation/reference/dashboard/`) carries the canonical implementation. The commits above are upstream-source references that downstream Constellation adopters can read for implementation detail; the patterns above are the abstraction that survives re-implementation in any stack.

---

## Cross-references to `Constellation.md`

- **§13.11 envelope** — the wire-protocol layer. Rule 1 (`type` normalization), rule 2 (A2A-intent detection), rule 3 (timestamp obligation + client-local render) are the server- and receiver-side invariants that this document's patterns depend on. §4 (card form) breaks if rule 1 fails; §8 (upstream detection) is the receiver-side instance of rule 2; §5 (date divider) and §7 (connection indicator tooltip) depend on rule 3.
- **§13.16.9 classification** — the SSoT for which `name` values are A2A-intent vs board-directed. §4 (card form) branches on this classification; §2 (row interaction) applies only to A2A-intent cards.
- **§13.16.11 KEY-MGMT** — the unified key-management contract. The dashboard's key-management modal (a distinct UI surface, not covered by the eight patterns above because it is its own dedicated screen rather than a chat-panel pattern) renders the `kind`-enum badge per key.
- **`constellation/reference/state-schema.md`** — the `state.json` data model that the dashboard renders. The patterns above are render-side decisions about *how* to present that data; the schema is the *what*.

---

## Versioning + scope

This document carries its own version (`v0.1.0` at the head — independent from `Constellation.md`'s frontmatter). Future render-side patterns surfaced through additional dogfood cycles append as new sections or new sub-sections; the existing sections remain stable as the abstraction layer for adopters who re-implement the dashboard. Wire-protocol changes are codified in `Constellation.md`, not here.

The patterns are descriptive, not prescriptive: an adopter who chooses a different render idiom (e.g., a chord-based gesture instead of hover-then-click for the three discovery stages of §2) is conformant as long as the underlying user need is met. The naming convention "A2A row interaction" / "collapse pitfall" / "card form" gives adopters a shared vocabulary; the specific gestures or visual choices are local.
