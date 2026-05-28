<!-- module: Constellation reference; layer: data-model; part-of: EstreGenesis 2.2 (draft); status: design-draft; date: 2026-05-28; license: Apache-2.0 -->

# Constellation reference — Board SSoT data model (`state.json` schema)

> **EstreGenesis 2.2 reference master copy — design draft.** This file specifies the **data model** behind a Constellation board: the schema of `state.json` (board SSoT) plus the surrounding server-side stores (per-channel history, key registry, feedback) that a real PM workflow board needs in order to render anything beyond a chat. An observed downstream migration (where the brewed dashboard could not surface PM workflow value beyond ping/pong-level chat) made it clear: **the gap a downstream hits first is not UI design — it's "what do I render?".** This schema closes that gap.
>
> **Use as a build reference, not a contract.** Only the **§2 A2A bridge interface** (from `Constellation.md`) is byte-identical across adopters. Field names and shapes below are the recommended baseline; nothing here forces a stack. Downstream projects extend `projects[]` (catalog), tweak `kind` enums, and may add domain fields — but **keep the generic skeleton** so a Constellation reference dashboard renders out of the box.
>
> **Ownership.** `state.json` is **owned and written by the main (PM) agent**. Workers report via `CUSTOM/WorkerReport`; the main reviews and *commits* board state. Workers never write the board directly (avoids multi-session collision). The server only **relays + records** — it does not author state.

---

## 1. Top-level shape

```jsonc
{
  "updatedAt":  "<ISO-8601 with offset>",   // last write by main; clients use as cache key
  "standby":    true,                        // top-level — infinite-wait flag. Distinct from modes (toggled by user / dashboard switch).
  "monitor":    "watching" | "idle" | ...,  // free-form short status hint the main displays in the header
  "modes":      { ... },                    // § 6 — operating modes (the §3 table in Constellation.md)
  "freeRequest":{ ... },                    // § 5 — last free-form user prompt, editable until reviewed
  "projects":   [ ... ],                    // § 4 — catalog of project tags (downstream-defined)
  "current":    [ ... ],                    // § 2 — currently in-progress task cards
  "done":       [ ... ],                    // § 2 — completed task entries (history; newest-first convention)
  "planned":    [ ... ],                    // § 2 — upcoming task cards (with block/wait state)
  "decisions":  [ ... ]                     // § 3 — review/decision panel items
}
```

All `*At` timestamps are ISO-8601 with timezone offset (`2026-05-28T03:00:00+09:00`). All `id` slugs are kebab-case, prefixed by track (`p-` planned, `d-` decisions, etc.) — convention, not enforced.

---

## 2. Task tracks — `current[]` / `done[]` / `planned[]`

Three arrays following the same **PM workflow** pattern: *current* (in-progress) · *done* (completed history) · *planned* (queued / blocked). The arrays differ only in which fields are required.

### Common task fields

| field | type | required | notes |
|---|---|---|---|
| `project` | string | ✓ | references `projects[].id` |
| `title` | string | ✓ | one-line, may carry status emoji (✅/⏳/⚠) |
| `detail` | string (markdown / limited HTML) | optional | long description; multi-paragraph allowed |
| `id` | string | recommended for `planned`; optional for `current`/`done` | stable slug for cross-reference |
| `ref` | string | optional in `done` | commit ref or report path |

### `current[]` — in-progress
```jsonc
{ "project": "estreux",
  "title": "Constellation v2.2.0 reference master copy — ⏳ EG state-schema + dashboard 1차 draft 대기." }
```
Usually a small array (1–3 entries). The main moves an entry from `planned` → `current` on start, and `current` → `done` on completion. **A `current[]` entry MAY also carry** `blocked` / `waiting` / `blockReason` / `unblock` / `proceedNote` (same shape as `planned[]` below) — useful when an in-progress task is temporarily paused by an external gate without demoting it back to `planned`, so priority and context stay visible. The dashboard SHOULD visually distinguish a *paused-current* chip from a *planned-blocked* chip (e.g. paused-current = amber, planned-blocked = grey).

### `done[]` — completed history
```jsonc
{ "project": "estreux",
  "title":   "✅ Constellation v2.1.1 push (EstreGenesis dd3888e) — EstreUX 참조 동기화 종료",
  "when":    "2026-05-28",
  "at":      "2026-05-28T02:35:00+09:00",
  "detail":  "...long markdown summary...",
  "ref":     "(this commit)"  // or a sha / report path
}
```
`when` is a YYYY-MM-DD date for grouping; `at` is the full ISO ts. Newest-first is the convention; the dashboard may also sort by `at` desc.

**Optional structured sub-fields** (additive to prose `detail`) for projects that want easier search/aggregation across history:

| field | type | notes |
|---|---|---|
| `commit` | string | sha or branch ref |
| `refs` | string[] | related `decisions[].id` / `planned[].id` / report paths |
| `followUps` | string[] | follow-up `planned[].id`s opened from this entry |

Prose remains the baseline (no field is required); these slots are purely additive and let a dashboard surface follow-up graphs without parsing prose.

### `planned[]` — queued / blocked
```jsonc
{ "id":          "p-migration-brew",
  "priority":    2,                  // number; smaller = higher priority
  "project":     "estreux",
  "title":       "차기: Constellation 2.0 마이그레이션 brew 루프 + 실구현 이관 + 플러그인 공개",
  "detail":      "...",
  "blocked":     true,               // currently blocked — render with a 'blocked' chip
  "waiting":     true,               // waiting on something external (author/upstream/etc.)
  "blockReason": "Phase B — 자체 dogfooding usage data + 라이브 LLM 실측 남음",  // why blocked
  "unblock":     "GA✓ · Phase A spike S1~S3 PASS·...",                          // what unblocks (next gate)
  "proceedNote": "저자 지시로 차기 버전 연기. 저자 착수 지시 대기."              // human-readable proceed condition
}
```
The two boolean flags are independent: `blocked` (technical/sequence block) vs `waiting` (waiting on a human/external gate). The dashboard renders them as distinct chips so the user sees *why nothing's moving*. The `blockReason` / `unblock` / `proceedNote` triplet is **optional but recommended as explicit slots** — burying the reason in `detail` prose (a common shortcut) leaves the dashboard unable to surface chips/badges for it.

---

## 3. Decision panel — `decisions[]`

The **review-and-decision queue** the human sees. This is the part rough-tier eux distillations missed and is essential to a working PM board.

```jsonc
{ "id":             "d-estreux-dist",
  "priority":       1,
  "project":        "estreux",
  "status":         "open" | "resolved",
  "kind":           "input" | "approval" | "choice",       // see below
  "question":       "📦 EstreUX 배포 — npm 런타임 제공? (다운스트림 brew 엔진 참조 오버헤드)",
  "detail":         "<b>RRP 리포트</b>: <code>reports/2026-05-28-...</code> ...",   // markdown / limited HTML
  "recommend":      "2-트랙 단계적 — 즉시 giget/git+ssh ... npm 발행 게이트는 사용자.", // agent's rationale
  "recommendChoice":"2-트랙 (즉시 해소 + npm 배포 준비)",                              // short label for the recommended option
  "options":        ["① ...", "② ...", "③ ..."],          // present only when kind === "choice"
  "reviewedText":   "2-트랙 (권장) — ...",                  // the human's decision text (editable until status=resolved closes it)
  "reviewedAt":     "2026-05-28T01:40:00+09:00"
}
```

**`kind` enum (extensible):**
- `input` — open-ended request for direction (no fixed options).
- `approval` — yes/no gate, often before an irreversible action (push/publish/delete).
- `choice` — pick from `options[]`.

**Lifecycle**: agent creates with `status:"open"` + `recommend`/`recommendChoice`. Human reviews → sets `reviewedText` (their decision, editable up to that point) and `reviewedAt`; status flips to `"resolved"`. The dashboard surfaces open decisions in a *blocking* panel (sorted by `priority`) and a collapsed "resolved 12건" counter. **Until reviewed, `reviewedText` is mutable** — the user can keep refining their answer.

**Reports convention** (recommended, not enforced): when a decision is preceded by research, link the report path in `detail` (e.g. `reports/<date>-<topic>.md`). This gives reviewers traceable rationale and is the pattern that makes the panel useful beyond a yes/no.

---

## 4. Projects catalog — `projects[]`

```jsonc
{ "id":     "estreux",
  "name":   "EstreUX",
  "color":  "#d9842b",
  "active": true        // optional — current focus project
}
```
**Downstream-defined catalog**, used as a tag for filtering and badge color across the dashboard. Every `current`/`done`/`planned`/`decisions` entry carries a `project` referencing one of these `id`s. EstreUF's catalog (`hub`/`fw`/`estreuv`/`estreux`/`estrelle`) is one example; a downstream project supplies its own.

This is the **primary EstreUF-specific axis** of the schema. Everything else is a generic PM pattern.

---

## 5. Free request — `freeRequest`

```jsonc
{ "reviewedText": "종료할 때는 에이전트 프롬프트 창에 직접 \"대기 종료\"라고...",
  "reviewedAt":   "2026-05-23T17:20:00+09:00"
}
```
A free-form user message **outside the decision queue** — used like a chat-prompt input for the main. Editable until reviewed (same rule as decisions' `reviewedText`). The dashboard typically renders it as an "any-time request" input box; the main treats it as a prompt. **Single-slot by design**: once a `freeRequest` is acted on, promote its outcome to `done[]` (if executed directly) or `decisions[]` (if it surfaced a review item), then clear the slot for the next request. Keeping `freeRequest` as a chat log would duplicate `decisions[]` and add noise.

---

## 6. Modes — `modes`

The runtime modes table (`Constellation.md §3`). The SSoT is `state.json.modes` (`.modes`) **plus the top-level `standby`** — not docs.

```jsonc
"modes": {
  "liveBoard":         true,    // server running, agents connect
  "wsRealtime":        true,    // WS realtime (chat/A2A/monitor)
  "autopilot":         true,    // main self-drives the worklist (default for the hosting agent)
  "newAgentAutoJoin":  true,    // new local agent auto-joins on first task
  "_note":             "자유 텍스트 메모(운영 상태 설명 — UI에 표시 가능)"
}
```
**`standby` is top-level** (not inside `modes`) — toggled by user request or the dashboard standby switch. ON = hold connection / poll even when idle; OFF = finish in-flight, then wait for prompt.

The `_note` field (underscore prefix = "schema-extra, UI-only memo") is free text the main writes for itself / the user.

---

## 7. Server-side stores (outside `state.json`)

`state.json` is the **board view**; channel history, keys, and feedback are separate stores the server owns. A complete reference dashboard renders all of them.

### `ws-history/<channelKey>.jsonl` — per-channel event history
- **Channel key = `agentId`** (not `channelId`/`threadId` — those are render-only badges/filters).
- Each line is a recorded WS event: compressed forms of `TEXT_MESSAGE_*` → single `TEXT_MESSAGE`, `TOOL_CALL_*` → single `TOOL_CALL` (with aggregated args/result), `RUN_STARTED`/`STEP_*` kept as-is, `CUSTOM` kept with `name`+`value`.
- Per-channel ring cap (recommended 200 entries; older trimmed on write).
- Long `result`/`content` (>2000) and `text` (>8000) are truncated at store-time with `…(truncated)` (live relay keeps full).

### `ws-history/archived/<channelKey>.jsonl` — closed channels
- Closing a channel (`CUSTOM/ArchiveChannel`) moves the file to `archived/`; it is excluded from the active scan / cap.
- On `RequestChannelHistory`, an archived channel is loaded back to active and the archived file is deleted (cold → active restore).

### `ws-keys.json` — registered keys
```jsonc
[ { "key": "uk-<hex>", "label": "<freeform>", "role": "upstream", "createdAt": "..." },
  { "key": "ck-<hex>", "label": "<freeform>", "role": "collab",   "createdAt": "..." } ]
```
Persisted, gitignored. Issued via `CUSTOM/RegisterUpstreamKey` or `RegisterCollabKey`; revoked via `Revoke*Key`. Roles map to §2 connection paths.

### `feedback.jsonl` + `feedback-atts/`
Append-only feedback entries (POST `/api/feedback`). Data-URL attachments are extracted to `feedback-atts/<ts-rand.ext>` and the entry keeps a `{stored: <path>, bytes, mime}` reference instead of the inline data-URL (keeps the JSONL light).

---

## 8. EstreUF-specific vs generic PM — the boundary

Per the upstream live-board main's boundary review (drawn from an observed downstream migration), the boundary is:

| Element | Verdict | Note |
|---|---|---|
| `decisions[]` shape | **generic** | EstreUF-specific = panel design details + some vocabulary in decision text |
| Channel group tabs (upstream/main/local/collab) | **generic** | A natural extension of the §2 role model |
| Task cards (`current`/`done`/`planned` + `blocked`/`waiting`) | **generic** | EstreUF-specific = catalog vocabulary (project ids, domain names) |
| `freeRequest` + resolved-count display | **generic** | A PM UX pattern, not EstreUF-only |
| `projects[]` catalog values | **EstreUF-specific** | Downstream-defined; a slot, not a fixed list |
| Long-form `detail` HTML formatting | **generic pattern, EstreUF UX choice** | Markdown is the safer baseline for portability |
| `reports/<date>-<topic>.md` reference convention | **generic** (recommended), **EstreUF-specific** (path layout) | Adopt the *idea*; let downstream pick the path |

When in doubt: if the field name is generic English/PM vocabulary, it's generic. If the *value* is a project name or domain catalog, that's the EstreUF-specific layer downstream replaces.

---

## 9. Authoring rules

- **The main writes `state.json` — exactly one writer at any moment.** SSoT protection = avoiding concurrent writes. Non-main agents (workers, upstream, collab) report via `CUSTOM/WorkerReport`; the main reviews, edits, and commits. After a graceful main handoff (`Constellation.md §2`), the new main becomes the sole writer and the previous main releases — *1-writer at any time*, never overlap. Direct writes from non-main agents would race in multi-session operation.
- **Server appends to history / keys / feedback.** Agents do not write those files directly either — they send WS events / hit HTTP endpoints, and the server records.
- **`reviewedText` is editable until the decision resolves.** The user can refine their answer; the agent waits for `status:"resolved"` (or an explicit signal) before acting.
- **`_underscore_prefixed` fields are UI-memos**, free text, not parsed by tools. Useful for the main to leave breadcrumbs.

---

## 10. Position within `constellation/reference/` (v2.2.0)

This file is one of four reference master artifacts planned for v2.2.0:

```
constellation/reference/
├── state-schema.md      ← this file (data model)
├── dashboard/           ← vanilla DOM master copy (EstreGenesis 1차 일반화 → main review)
├── gateway/             ← deps-0 reference WS adapter (main 1차 → EstreGenesis review)
└── runtime/             ← server / local-bridge / self-wake-watcher / watchdog source masters (main 1차)
```
Order of operations (per the upstream main's plan): **state-schema → dashboard** first (downstream unblock), then **gateway + runtime** after dashboard review closes (avoids contention).

---

## 11. Open items for review

For the upstream main's pass:
1. `decisions[].kind` enum — keep `input`/`approval`/`choice` only, or add `info` / `acknowledge`?
2. Should `current[]` allow `blockedBy` / `waiting` flags (like `planned`) for the "in-progress but stuck" state, or is that always an automatic `planned` demotion?
3. `done[].detail` is currently long-form prose; is there a structured sub-schema (commit · summary · references · follow-ups) worth standardizing, or is prose the right baseline?
4. Confirm: workers genuinely never write `state.json` directly even via a privileged channel? (Best practice; just want it on the record.)
5. `freeRequest` history — current schema is single-slot; does EstreUF ever keep prior `freeRequest`s, or is a one-shot input the established pattern?
