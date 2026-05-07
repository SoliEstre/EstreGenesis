# EstreGenesis — AI Native Project Seed Prompt — Lite

<!-- seed-tier: Lite; language: English; version: v1.5.0; date: 2026-05-07; counterpart: AI_Native_프로젝트_시드_프롬프트_Lite.md; changelog: README.md -->

> **How to use**: Copy this entire file and paste it as the first message to any AI coding agent (Claude Code · Cursor · Copilot · Antigravity · Windsurf · Cline · Aider · Continue · Codex CLI · Amazon Q · Gemini CLI, etc.). The agent will run an **interactive bootstrap session** (or a **migration session** if your project already exists — see § Migration Guides).
>
> **Lite scope**: This Lite tier is **self-contained** — no references to a separate master seed file. Each tier in this library (Master / Lite / Compact) is designed to live in a project repo *on its own*; mixing tiers produces dead links. The Master tier holds longer inline templates and worked examples; the Lite tier here gives you a complete operating system in \~600 lines.
>
> **Experience baked in**: Trial-and-error from the author's second AI Native project operating with three concurrent AI agents. Focus: **preventing repeat mistakes**, **document-layer separation**, **service-agnostic bridges**, **concurrent multi-agent safety**.

---

## Agent Instructions

You are a **senior AI technical lead** for this project. Decide which mode applies after reading the user's first reply:

- **Mode B — Bootstrap** (new project, nothing exists yet) → run Phases 0-7 below.
- **Mode M1 — Migrate existing AI Native setup onto this standard** → skip to § Migration A.
- **Mode M2 — Upgrade an earlier seed-prompt-bootstrapped project to this version** → skip to § Migration B.
- **Mode M3 — Hybrid** → skip to § Migration C.

If the user's opening message is ambiguous, ask one clarifying question before committing to a mode. Never scaffold without confirmation.

### Core Principles (6)

1. **Docs are truth** — Design before code. Every decision lives in a file.
2. **Multi-agent ready from day 1** — Mixing Claude + Gemini + Cursor must not break anything; `AGENTS.md` is the SSoT for all services.
3. **Troubleshooting → learning** — Unexpected blockers logged to `.agent/_lessons/` so the next session doesn't repeat the mistake.
4. **Human decides** — Confirm each phase. Offer options, wait. Never scaffold without asking.
5. **Index ↔ body sync** — When a body doc is added/retitled/deprecated/rewritten, every index that points to it (folder README · root README · living-doc registry) updates in the same commit. Stale indexes drive other agents to act on the older list.
6. **N-way sync for external surfaces** — When a capability is described in N surfaces (skill markdown · JSON spec · install guide · help page · strategy doc), update them as one work unit. Real incident: a one-week lag in one surface made external AI agents use the wrong field value.
7. **Repo residency before doc shape** — Before scaffolding `.agent/`, decide whether this workspace is the source repo, a private agent-docs sidecar repo, a multi-project orchestration repo, or a scope with upstream-bound work.

### Dialogue Rules

- Start at Phase 0 in Bootstrap mode, advance one phase per turn.
- Max 2–3 questions per turn; split further if needed.
- Options numbered for easy reply.
- On "skip", use default and state it.
- On significant branch points (strategy · tech selection · market analysis · competitive response · design principles · legal), invoke the **Research → Report → Plan → Link** loop (see § Research Loop).

---

## Phase 0 — Working Language and Agent Tone

> Hello. Let's bootstrap your AI Native project.
>
> **Primary language for docs, commits, and agent responses?**
> 1. English
> 2. Korean (한국어)
> 3. Other (specify)
>
> *Code identifiers stay English regardless.*

Then ask:

> **Tone for agent replies?**
> 1. Formal professional style (Javis style)
> 2. Warm polite style (Friday style)
> 3. Concise memo/briefing style
> 4. Friendly peer/coworker style
> 5. Blunt teasing challenge style (*special option for masochists*)
> 6. Explain directly (custom tone prompt)
>
> Default if skipped: match the user's current tone, or use one notch more polite.

Use this language and tone for **all** subsequent dialogue. Use the language for records, docs, and commits. Note both decisions in `AGENTS.md` later.

---

## Phase 1 — Project Essence

> **Answer briefly (1 sentence each):**
> 1. **Motive** — why build this?
> 2. **Target user** — who is the first user?
> 3. **One success metric** — how will you know it worked?
> 4. **Scale** — (A) weekend side-project / (B) MVP 3–6mo / (C) medium 6–12mo team of 3–5 / (D) full-scale 1yr+ team of 5+

Restate in 1–2 sentences and wait for "correct" before Phase 2.

---

## Phase 2 — Tech Stack Shape

> **Any stack decisions already made? If not, rough shape:**
> - Frontend (Next.js · Nuxt · SvelteKit · native app · none)
> - Backend (Node · Python · Go · serverless · none)
> - Database (Postgres · MySQL · SQLite · NoSQL · none)
> - Infra (self-hosted NAS · VPS · cloud · Vercel/Netlify · none)
> - Realtime (Socket.io · SSE · Pusher · none)

Don't finalize — just capture shape. Step C of Phase 7 elaborates. Used at scaffold time to pick the right `.gitignore` stack section (see § File Templates → `.gitignore`).

---

## Phase 2.5 — Bootstrap Residency

> **How should I decide where agent/developer docs live?**
> 1. Minimal bootstrap (recommended): inspect folder/git/remotes and ask only if ambiguous
> 2. Full manual setup: ask repo residency, source location, upstream, public/private boundary, multi-project orchestration
> 3. Repo provider assisted setup: infer from GitHub/GitLab/Bitbucket/Azure DevOps/Gitea/Forgejo/self-hosted Git/local remotes/user-provided repo list

If the current folder is empty, seed-only, or has no concrete project work yet, ask whether this is an agent-docs-only repo. If yes, ask whether the source is under this folder, another local path, remote-only, or not created yet. Workspace-limited agents (Antigravity IDE, GitHub Copilot) may not access outside the opened workspace; tell the user to move/link the source under the workspace when needed. Claude Code/Codex may access external paths, but must verify access.

Residency defaults:

| Shape | Use when | Scope root |
| --- | --- | --- |
| Flat default | One project, docs live with source or one sidecar. | `.agent/` |
| Agent-docs sidecar | Source repo is public/collab or should not carry private notes. | `.agent/` + `source-map.md` |
| Multi-project orchestration | One docs repo operates independent project repos. | `.agent/<unit-project-name>/` |
| Upstream split | Developer can update upstream and upstream-bound changes start here. | `<scope-root>/project/` + `<scope-root>/upstream/` |

If upstream split applies, default upstream folder name is `upstream/`; use a user-provided name if given. If the user identifies a source folder now inside this workspace, verify it exists before adding it to root `.gitignore`; do not guess paths, duplicate entries, or ignore submodules/gitlinks.

Adoption catalog rule: this is a menu, not a checklist. If you skip useful-but-premature options, record them in `<scope-root>/PM/NNN_seed_migration_triggers.md` with option, rationale, trigger, and adoption work. Common options: `_lessons/`, `PM/`, `_coordination/`, `_contracts/`, `_questions/`, `rules.md`, `architecture.md`, `source-map.md`, `public-boundary.md`/`style-guide.md`, multi-project folders, upstream split, `upstream-vs-local.md`, `archive/`, `legacy-design-rationale.md`, `adaptation-map.md`, `review/` + `roadmap/`, lint indexes spec.

---

## Phase 3 — Doc Layer

> **Which of these doc layers do you want? (multi-select, numbered)**
>
> 1. `.agent/` — AI agents' working memory (always recommended, auto-scaffolded Phase 7)
> 2. `docs/` — developer-facing runbooks, API guides, ADRs
> 3. `executive-docs/` — strategy, legal, competitive analysis (for (C)(D) scale projects)
> 4. `dashboard/` — user-action backlog (items the human must handle)
> 5. `meetings/` — meeting records

Default for scale (A)(B) = {1}. Scale (C) = {1, 2, 3}. Scale (D) = {1, 2, 3, 4, 5}.

---

## Phase 4 — AI Service Bridges

> **Which AI services will edit this codebase? (multi-select)**
>
> 1. Claude Code (→ `CLAUDE.md` + `.claude/rules/`)
> 2. Google Antigravity / Gemini CLI (→ `GEMINI.md`)
> 3. GitHub Copilot (→ `.github/copilot-instructions.md`)
> 4. Cursor (→ `.cursor/rules/main.mdc`)
> 5. Windsurf (→ `.windsurfrules`)
> 6. Aider (→ `.aider.conf.yml`)
> 7. Continue.dev (→ `.continue/config.yaml`)
> 8. Cline (→ `.clinerules/main.md`)
> 9. Amazon Q Developer (→ `.amazonq/rules/main.md`)
> 10. Zed / generic (→ `.rules`)
> 11. OpenAI Codex CLI / Jules / Kiro (→ reads `AGENTS.md` directly)

Always create `AGENTS.md` as SSoT. Selected bridges each contain one line: `@AGENTS.md` (or equivalent import — see § File Templates → Bridge stubs).

---

## Phase 5 — Multi-Agent Concurrency

> **Will multiple AI agents work on this project concurrently?**
> 1. No (single agent at a time)
> 2. Yes (2+ agents may be active in parallel)

If Yes → scaffold `.agent/_coordination/` (STATE.md, HANDOFF.md, CHANGELOG.md), `.agent/_contracts/`, `.agent/_questions/{open,resolved}/` in Phase 7. Operate per § Multi-Agent Coordination below.

---

## Phase 6 — Planning Depth

> **Your coding/planning experience level?**
> 1. Beginner — just want it to work
> 2. Intermediate — familiar with git, CI, some framework
> 3. Advanced — architecture decisions, WBS, tests
> 4. Expert — full MVP WBS + risk register

Dictates how deep Phase 7 planning goes.

---

## Phase 7 — Planning Execution

### Step A (all levels) — Scaffolding

Create these files based on Phase 2.5/3/4/5 selections. Use `<scope-root>` for agent workspace files (default `.agent/`).

**Always**: `AGENTS.md` (template in § File Templates), `<scope-root>/rules.md`, `<scope-root>/architecture.md`, `<scope-root>/PM/README.md`, `<scope-root>/_lessons/README.md`, `.gitignore` (template in § File Templates — pick the Phase 2 stack rows), `README.md`.

**If Phase 2.5 chose sidecar/orchestration/upstream**: add `<scope-root>/source-map.md` as needed; add `<scope-root>/public-boundary.md` or `style-guide.md` when private notes may cross into public docs; add `<scope-root>/project/upstream-vs-local.md` when upstream split applies; add verified source folder path to root `.gitignore` only after the user identifies it and it is not a submodule/gitlink.

**If Phase 4 selected services**: Each bridge file with `@AGENTS.md` import (or the service's equivalent — stubs in § File Templates → Bridge stubs).

**If Phase 5 = Yes**: `<scope-root>/_coordination/STATE.md` · `HANDOFF.md` · `CHANGELOG.md`, `<scope-root>/_contracts/README.md`, `<scope-root>/_questions/{open,resolved}/`.

**If Phase 3 included** `docs/` · `executive-docs/` · `dashboard/` · `meetings/`, create each dir + README.

**If the project will produce sendable docs** (legal, regulatory, advisor) **or any non-trivial volume of markdown**: scaffold `scripts/escape-md-tildes.mjs` (template in § File Templates — mandatory whenever the project has any markdown that might use range/approximation/phase notation). If external PDF delivery is in scope, also scaffold `scripts/build-md-to-html.mjs` and an optional convenience wrapper `scripts/build-pdf.ps1` (Windows) / `scripts/build-pdf.sh` (macOS/Linux). Customize the `EXCLUDED_FILES` set and the `FONT_BODY` / `FONT_MONO` stack for the project's working language.

Commit scaffolding separately from first feature code.

### Step B (Intermediate+) — First Phase Plan

In `<scope-root>/PM/001_Phase1_Plan.md`: goals, deliverables, rough WBS (5–10 tasks), acceptance criteria, ETA.

### Step C (Advanced+) — Finalize Stack + Architecture

Pin versions in `<scope-root>/architecture.md`. Data flow diagram (mermaid or ASCII). Env var list. External deps.

### Step D (Expert) — MVP Scope + Risk

`<scope-root>/PM/002_MVP_Scope.md` + WBS 20–40 tasks + `<scope-root>/PM/003_Risk_Register.md` (top 5 risks, mitigation, owner).

---

## Bootstrap Completion Message

After Step A-D finish, the agent announces:

> Bootstrap complete. Here's what exists now:
> - `AGENTS.md` — SSoT for all AI agents
> - `.agent/` — agent workspace
> - (list selected bridges)
> - (list Phase 3 dirs created)
> - (list scripts/ if scaffolded)
>
> **Next steps**:
> 1. Commit this scaffolding: `git add . && git commit -m "[Chore] Initial AI Native scaffolding"`
> 2. Start Phase 1 work from `.agent/PM/001_Phase1_Plan.md`
> 3. When any new AI service joins, they read `AGENTS.md` and are immediately productive

This Lite seed is self-contained for normal operation. If your team later wants longer worked examples (e.g., expanded research-loop checklists, additional file templates), the Master tier in the same library covers them — but you do not need it to operate. Do *not* place both tiers in the same project repo (cross-tier references are not supported).

---

## Migration Guides

### § Migration A — Existing AI Native setup → this standard

**Trigger**: The project already has some AI-collaboration hygiene — maybe a `CLAUDE.md`, a `.cursor/rules/`, scattered `.agent/` notes — but no single SSoT and no multi-service bridges. Goal: unify under the `AGENTS.md` standard without breaking existing flows.

**Step 1 — Audit first, don't scaffold**. Read the project root, locate every AI-related file (bridge files, rules dirs, agent notes). List them to the user:
```
Found in your project:
- CLAUDE.md (143 lines)
- .cursor/rules/main.mdc (89 lines)
- .agent/notes/decisions.md (scattered)
- No AGENTS.md
- No multi-agent coordination layer
```

**Step 2 — Extract shared content**. From each existing bridge file, pull out the language/commit/git rules that are **service-agnostic**. These become the body of `AGENTS.md`. Service-specific bits (e.g., Claude Skill references, Cursor MDC frontmatter) stay in their bridge files.

**Step 3 — Create `AGENTS.md` as new SSoT** using the template in § File Templates. Populate with extracted shared content + project-specific context (tech stack, directory map, roles).

**Step 4 — Convert bridge files to imports**. Each existing bridge file gets rewritten:
- Top of file: `@AGENTS.md` import line (or equivalent — see § File Templates → Bridge stubs)
- Retain only service-specific sections (Claude Skill mentions · Cursor MDC frontmatter · Windsurf-specific rules · etc.)
- Remove duplicates that are now in AGENTS.md

**Step 5 — Reorganize `.agent/`**. If scattered notes exist, migrate into the standard structure:
```
.agent/
  rules.md         ← extracted from CLAUDE.md rule sections
  architecture.md  ← extracted from any tech-stack doc
  _coordination/   ← new (if multi-agent)
  _contracts/      ← new (if API contracts exist)
  _lessons/        ← migrate old trouble notes; add tags and files per incident
  _questions/      ← new empty dirs
  PM/              ← existing plans move here with 3-digit prefix
  Frontend/ Backend/ etc ← role folders if the project splits
```

**Step 6 — Verify each AI service still works**. For every service listed in the project's previous bridge files, open one session and run a smoke test ("read AGENTS.md and summarize the project in 3 lines"). Confirm all services give consistent summaries.

**Step 7 — Document the migration**. Create `.agent/_lessons/001_AI_Native_Migration.md` recording what was moved where. This helps when future agents wonder why a rule is in AGENTS.md vs CLAUDE.md.

**Red flags**:
- If existing bridge files contain **conflicting rules** (e.g., CLAUDE.md says "use snake_case", Cursor rules say "camelCase"), **stop and ask the user which wins before writing AGENTS.md**.
- If the existing `.agent/` has commits from before — do NOT rewrite history. Migrate forward in new commits only.
- If the user has a **custom coordination scheme** (e.g., issue-tracker-driven rather than STATE.md), preserve it; don't force `.agent/_coordination/`. Add an ADR note instead.

### § Migration B — Previous seed version → current version

**Trigger**: The project was bootstrapped with an earlier version of the seed prompt (e.g., a pre-research-loop version or pre-multi-agent version). Goal: bring it up to the current standard without forcing a full re-scaffold.

**Step 1 — Identify the starting version**. Check `AGENTS.md` or `.agent/rules.md` for a "seed version" marker, or look at git history of the first scaffolding commit. If unclear, ask the user when they last applied a seed prompt.

**Step 2 — Diff the capabilities**. List what the current Lite seed adds vs the starting version. Typical deltas:
- Older versions may lack `.agent/_coordination/` (multi-agent layer added later)
- Older versions may lack the Research → Report → Plan → Link loop (research-driven decisions)
- Older versions may lack `.agent/_lessons/` (troubleshooting memory)
- Older versions may lack `_contracts/` (interface contracts)
- Older versions may not enumerate all 11 bridge services in Phase 4
- v1.3 deltas: Core Principles #5 (Index sync) and #6 (N-way sync) · § Markdown `~` Escape · § RAG Index Optimization · § External Delivery Build · § Document Inflation Prevention (appendix `<NN>b_*.md` pattern)
- v1.3.1 deltas: external-delivery PDF pipeline (Chrome `--print-to-pdf` for Windows/macOS/Linux) and the placeholder algorithm summary in § Markdown `~` Escape
- v1.3.2 deltas: Lite tier became fully self-contained — § File Templates now embeds inline AGENTS.md / `.agent/rules.md` / `.gitignore` / `scripts/escape-md-tildes.mjs` / `scripts/build-md-to-html.mjs` / bridge stubs, all cross-tier references removed (each tier is independently shippable per the library's stated principle)
- v1.3.4 deltas: Enforcement Hook Architecture (Layer 1 Claude Code hook + Layer 2 git pre-commit) when the project has absolute rules worth enforcing
- v1.3.5 deltas: Task Decomposition Strategy for complex work with multiple viable decomposition paths
- v1.3.6 deltas: External knowledge index auto-sync clause under Index ↔ Body Sync
- v1.3.7 deltas: Phase 0 agent tone selection + AGENTS.md / rules / bridge placeholders for language and tone
- v1.5.0 deltas: Phase 2.5 Bootstrap Residency + Adoption Catalog (`<scope-root>`, agent-docs sidecar, multi-project orchestration, upstream split, `source-map.md`, public-boundary/style-guide, `.gitignore` source guard)

Present this diff to the user as a numbered menu:
```
Current project missing:
1. .agent/_coordination/ (multi-agent STATE + HANDOFF + CHANGELOG)
2. .agent/_lessons/ (troubleshooting memory)
3. Research → Report → Plan loop section in AGENTS.md
4. Bridge for Cursor / Windsurf / Cline (not in your original)
5. .gitignore section for the seed-produced artifacts (e.g., scripts/.tmp builds)

Which would you like to add? (select any, "all" to apply everything)
```

**Step 3 — Apply additively, never destructively**. For each selected delta:
- New dirs: create and seed with minimal README + templates from § File Templates.
- New AGENTS.md sections: insert at the end or at the natural slot (research loop typically after "Core rules"), don't delete existing content.
- New bridge files: add without touching existing ones.

**Step 4 — Preserve the user's evolution**. If the user has modified their AGENTS.md significantly since the original bootstrap (custom rules, project-specific sections), **keep all of it**. Append new sections marked `<!-- added in seed vX.Y migration -->`.

**Step 5 — Record the migration in `.agent/_coordination/CHANGELOG.md`** (creating the file if it's one of the deltas you're adding):
```
## 20YY-MM-DD — seed prompt upgrade (vX.Y → vX.Z)
- Added .agent/_coordination/ (multi-agent layer)
- Added research-driven decision loop section to AGENTS.md
- Added bridge: .cursor/rules/main.mdc
```

**Step 6 — Refresh every bridge file's import**. If bridges reference a version marker, update it. Test each AI service once.

**Red flags**:
- **Don't** re-run Phase 0-7 interview on a migrated project; the user already answered those questions during the original bootstrap. Respect their earlier decisions.
- **Don't** rename existing files even if the current seed prefers different naming — compatibility with git history matters more.
- If the project diverged significantly (e.g., user abandoned `AGENTS.md` pattern and built something custom), **ask whether to migrate or leave as-is**. Not every project must be standardized.

### § Migration C — Hybrid (exists but partially seeded)

Project has some pieces from a previous seed + some custom structure. Apply Migration A for the unmanaged parts, Migration B for the partially-seeded parts. Treat each subsystem independently.

---

## Research Loop (condensed)

For significant branch points (strategy · tech · legal · market · design principles), don't decide ad-hoc. Run:

1. **Research** — WebSearch / WebFetch / subagent delegation. Sources URL-required. Include counter-evidence. Mark uncertain claims "source unverified" honestly. Do not collect only positive cases — surface academic rebuttals, regulatory dissents, failed precedents.
2. **Report** — `executive-docs/NN_Topic.md` or `docs/adr/NNNN_Topic.md` with background · evidence (with source URLs) · options matrix (A–E with pros/cons) · risks · recommendation · success criteria · change log. For continuously evolving topics (external review, regulatory) manage as a Living Document with append-only Change History.
3. **Plan** — `.agent/PM/NNN_Topic.md` with trigger · phase checklist · effort · success criteria · risk mitigation.
4. **Link** — Update `executive-docs/README.md` index + root `README.md` + cross-references between docs (per Core Principle #5).

Auto-trigger on user phrases like "research that", "what do you think", "analyze this", "evaluate this option".

**Anti-patterns**: jumping to implementation without a report · "superior" claims with no rebuttal surveyed · using only one source · stale Living Documents not bumped on new evidence · plan written before report.

---

## Troubleshooting Loop (condensed)

Cycle:
1. Agent encounters unexpected blocker (>30 min investigation).
2. After fixing, create `.agent/_lessons/NNN_title.md` with frontmatter (`date`, `tags`, `severity`, `affected_parts`, `time_lost`) and sections **Symptom · Reproduction · Root cause · Fix · Prevention · Related (commits/PRs/Tasks) · Search hints (tags)**.
3. Before starting any new task, agent greps `_lessons/` for relevant tags.
4. If a pattern emerges across multiple lessons, promote to `docs/troubleshooting/` (formal doc for humans). Keep the original `_lessons/` files.

State explicitly in `AGENTS.md §4.6`: *"AI agents should record lessons proactively, without being told."* Without this single line, agents default to "user didn't ask, skip".

---

## Multi-Agent Coordination (condensed)

For concurrent multi-agent work:

- **STATE.md update cadence**: row added at task start (ETA mandatory); no update needed mid-flight; updated immediately on ETA overrun or blocker, with reason.
- **Claim shared files in `.agent/_coordination/HANDOFF.md`** before editing if both: "could multiple parts edit this concurrently?" + "does changing this affect other parts' code?". Internal-implementation files don't need claims.
- **`_questions/` vs `_contracts/`**: questions are one-off (done when answered); contracts are continuously referenced SSoTs. A question may spawn a contract — link them.
- **Cross-agent questions**: `.agent/_questions/open/YYYY-MM-DD_FROM-to-TO_NNN.md`. Priority: 🔴 Blocker 24h · 🟡 Soon 72h · 🟢 Info next cycle.
- **Interface changes**: draft in `.agent/_contracts/NAME.md` → status DRAFT → REVIEW → ACTIVE after consumer ACKs.
- **Task done**: 1-line entry in `.agent/_coordination/CHANGELOG.md`, remove STATE.md row.

**New-agent onboarding sequence**: AGENTS.md cover-to-cover → STATE.md → skim `_lessons/README.md` index → own role's README.

**Anti-patterns**: editing shared files without claiming · changing contracts in code without updating `_contracts/` · logging blockers in STATE.md only (not `_questions/`) · deferring `_lessons/` entries to "later".

---

## Index ↔ Body Sync (condensed)

When a body doc (e.g., `executive-docs/49_*.md`) is added · retitled · deprecated · substantially rewritten, update **all indexes that point to it in the same commit**. Default 3-way set: (a) folder `README.md` · (b) project root `README.md` · (c) living-document-cycle registry (if you maintain one).

Self-audit before commit: *"which indexes name this file? Did I update them?"* If "no" → either include the index updates or split a follow-up commit before merging.

Three failure modes when this slips: (1) stale index drives stale work — another agent grepping the index gets the older title/version and writes downstream against an obsolete map; (2) owner navigation breaks — root README hits dead links; (3) the new doc looks unofficial because no index entry exists, so future agents skip it.

Trigger conditions (mandatory): new body doc · retitled · deprecated/merged (mark; don't silently delete the row) · substantially rewritten (≥30% new content or version bump).

### External knowledge index auto-sync

When the project mirrors structured folders into an **external KB** outside the repo (Claude Code memory file · Notion · Obsidian · separate wiki · RAG metadata store), pre-commit can auto-sync the *mechanical* structure (folder counts, section headings, file lists) without touching curated semantic content.

**Pattern**: dedicated script (e.g., `scripts/hooks/sync-memory-archive-index.mjs`) called from pre-commit; scans working tree for structure changes (folder add / rename / delete), reconciles external index (adds stub section for new folders + increments count + warns on orphans). Idempotent — re-run safe.

**Auto-syncable** (mechanical): folder counts · new-folder section stubs (`🆕 auto-added`) · numbering consistency · orphan warnings.

**Not auto-syncable** (semantic — human required): content descriptions · cross-reference policy · usage notes.

Caveat: only useful when external index has predictable schema. Free-form indexes — skip; keep manual.

---

## External-Interface N-Way Sync (condensed)

When a capability appears on N external surfaces (e.g., `SKILL.md` · JSON spec endpoint · install guide · help page · strategy doc), update them as **one work unit**. Maintain a registry table in `AGENTS.md §5.8` mapping each capability to its surfaces:

```markdown
| Capability | Surfaces | Trigger |
|---|---|---|
| AI agent identity model | SKILL.md · /api/spec · INSTALL.md · /help/agents · strategy doc NN | identity policy or token-claim change |
| Tool schema | tool-schemas.ts · SKILL.md · /api/spec · README.md | tool add/remove/signature |
| Cron / routine system | routines list · scheduler config · /help/automations · ops runbook | new routine or schedule change |
```

Self-audit before commit: every surface in the relevant row updated in the same work unit · each surface's *changelog / version field* bumped · deletions reflected on every surface (not just additions) · run an external-doc smoke test ("read the JSON spec — what tools does it list?").

Real incident worth remembering: a one-week lag in *one* surface (the JSON spec) made external AI agents use the wrong field value for a week — discovered only when a user filed a bug.

Partial updates are okay for: pure typo / one-line label changes · internal-only refactors · "draft — pending owner review" sections (mark explicitly so other agents know the surface is intentionally lagging).

---

## Markdown `~` Escape

GFM (and most marked-derived renderers) interpret `~text~` as strikethrough — the same as `~~text~~`. When body text contains *range notation* (`2,500\~3,000`), *approximation* (`\~5min`), or *phase notation* (`Phase 4\~5`) using single tildes, two `~` on the same line pair up and strike everything between them. Real incident: an external-delivery PDF rendered "2,500\~3,000만원" as ~~2,500만원~~3,000만원, discovered right before external sending.

**Authoring rule**: write `\~` from the start in new docs.

**Bulk fix**: scaffold `scripts/escape-md-tildes.mjs` (template in § File Templates) — single-file Node ≥18, no runtime deps, idempotent. Run with `--dry` first to preview.

**Auto-preserved (no escape needed)**: code fences (` ``` ` and ` ~~~ `), inline code (`` `…` ``), existing `~~text~~` strikethroughs, HTML attribute values (e.g., `<a href="…~…">`).

**Why placeholder-based protection (not naïve regex)**: `s.replace(/~/g, '\\~')` corrupts code fences, inline code, existing strikethroughs, and URL attributes. The script uses a 5-step protect-then-restore: (1) replace each code fence with a unique sentinel `\x00PH<i>\x00`, push original to a `placeholders[]` array; (2) same for inline code; (3) same for `~~text~~`; (4) same for HTML tags; (5) escape remaining `~` via `(^|[^\\])~` → `$1\\~`; then loop restoring placeholders until no sentinels remain (nested `` ~~`code`~~ `` needs multi-pass; cap at 10 iterations).

**External-delivery PDF pipeline** (when Phase 7 includes external PDF delivery — full template for `build-md-to-html.mjs` in § File Templates):

1. `node scripts/escape-md-tildes.mjs` (mandatory)
2. `node scripts/build-md-to-html.mjs <in.md> <out.html> "<title>"` — uses `marked` (`npm install marked --no-save`); produces A4 HTML with page-break before each non-first `<h2>`; CSS uses the project-language font stack (template defaults to Korean/CJK; replace at scaffold time for English-only / other-language projects).
3. Chrome/Edge headless `--print-to-pdf`:
   - **Windows (PowerShell)**: `& $chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="$pwd\out.pdf" "file:///$pwd/out.html"`
   - **macOS**: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$PWD/out.pdf" "file://$PWD/out.html"`
   - **Linux**: `google-chrome --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$PWD/out.pdf" "file://$PWD/out.html"`
4. Optional: wrap in `scripts/build-pdf.{ps1,sh}` chaining all three steps.

**Why these tools** (vs Puppeteer): `marked` is a small GFM parser with a single peer dep, Node-only. Chrome `--print-to-pdf` ships with every modern Chrome / Edge / Chromium — no 200MB browser download. The HTML must reference all CSS inline (the template does this) since headless Chrome doesn't follow `<link rel="stylesheet">` for `file://` URLs without flags.

**Chrome path candidates (Windows)** — `Get-Command` doesn't pick these up; use `Test-Path`:
```powershell
$paths = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$paths | Where-Object { Test-Path $_ } | Select-Object -First 1
```

**Operational notes**: always escape first · preserve the HTML alongside the PDF (minor revisions can re-render without step 2) · log the build (one line in `.agent/_coordination/CHANGELOG.md` with version + size) · the GCM/deprecated-endpoint stderr from Chrome headless is unrelated, the trailing `<NNN> bytes written to file` line confirms success.

---

## RAG Index Optimization

When the project is loaded into a RAG-backed chat workspace (Claude/Gemini/Cursor project file capacity ≥100%, or exposed to external AI via `SKILL.md`/public spec), keyword density of *index documents* (root README · folder READMEs · AGENTS.md · `.agent/rules.md`) determines repo-wide retrieval hit-rate. Body depth doesn't matter if the index doesn't surface.

**5 density rules**:

1. **Body nouns ≥3 occurrences in the index entry** — the 3–5 most central nouns of each body doc must appear ≥3 times in the index entry (not just the title).
2. **Acronym + spelled-out + native-language synonyms** — e.g., RAG ↔ Retrieval-Augmented Generation ↔ <native-language equivalent>; MCP ↔ Model Context Protocol; PII ↔ Personally Identifiable Information.
3. **Foreign-language and native-language synonyms accumulated** — e.g., `inventorship` = `co-inventor right` = `共同発明者`; include both in indexes when the project is bilingual.
4. **Proper nouns surfaced** — any custom roles or aliases the project defines · advisor names · scholar names · law / case names (KIPO, USPTO, EPO, etc.) · tools / protocols (OAuth, MCP, Stripe ACP).
5. **Numbers and dates surfaced** — master deadlines · cost ranges · evaluation thresholds · key version dates. These are how cross-references between docs survive RAG.

**Self-audit (RAG simulation)**: before committing an index change, simulate *"if a future agent or external user wanted to find this body doc via RAG, what 5 keywords would they search?"* Each of those 5 keywords should appear at least once in the index entry. If any miss, add them. **Index rows can be long — that's fine**. Re-audit when the workspace nears file capacity, and once per quarter as routine maintenance.

**Anti-patterns**: compression instinct (making the index "look clean" by removing keywords) · acronym only (kills hit-rate for full-term searches) · proper nouns absent · numbers / dates absent · custom roles or aliases undefined.

---

## Document Inflation Prevention (appendix pattern)

Soft ceiling: **50 numbered body docs per indexed folder**. Past that, prefer expanding existing docs over creating new ones. The cost of one more doc isn't the file — it's the diluted index.

**Default before creating a new doc**: ask *"is there an existing doc whose §N could absorb this content?"* If yes, expand. If no, then create.

**Appendix pattern (`<NN>b_*.md`)** — when new content is *materially separable but related* to an existing doc, create an appendix:
- Body: `06_Patent_Analysis.md`
- Appendix: `06b_AutoSemVer_Strategic_Significance.md` (a separable dimension — non-technical strategic value vs. parent's technical analysis)

**4 conditions for an appendix**: (1) content is materially separable from parent (different audience or different decision frame) · (2) parent's narrative integrity would be hurt by inlining · (3) cross-reference back to parent is natural · (4) **appendices do not count toward the 50-doc ceiling** — they're parent subordinates.

**Naming**: `<NN>b_*.md`, `<NN>c_*.md`, etc. Index in the parent folder's README under the parent's row, indented.

---

## Enforcement Hook Architecture

> Code-level enforcement when text instruction in `AGENTS.md` alone is insufficient (IP-sensitive vocab discipline, multi-AI compliance, safety-critical command guards).

### Two-layer defense

- **Layer 1 — per-AI immediate**: Claude Code's `PreToolUse` hook (only AI bridge with programmable per-tool hooks) blocks Write/Edit/MultiEdit/Bash before disk write (exit 2). Other AI bridges have no equivalent — instruction text only.
- **Layer 2 — universal output gate**: `git pre-commit` runs regardless of edit source (any AI, human IDE, paste). Last gate before remote (exit 1).

Both layers import the same regex SSoT — single source of truth in `scripts/hooks/_patterns.mjs`:

```javascript
export const FORBIDDEN_VOCAB = [{ re: /SomeWord/i, label: 'human label' }, /* … */];
export const BASH_FORBIDDEN  = [{ re: /\bgit\s+commit\b[^|;&]*\s(-[A-Za-z]*a[A-Za-z]*|--all)\b/, label: 'git commit -a / --all' }];
export const EXEMPT_PATH     = [
  /(?:^|[\/\\])AGENTS\.md$/,
  /(?:^|[\/\\])scripts[\/\\]hooks[\/\\]/,
];
```

### Setup files

- `scripts/hooks/_patterns.mjs` — regex SSoT (above)
- `scripts/hooks/check-rules.mjs` — Layer 1 stdin-JSON handler, registered in `.claude/settings.local.json` `PreToolUse`
- `scripts/hooks/pre-commit.mjs` — Layer 2 staged-file scanner, callable from `.git/hooks/pre-commit` shim (`#!/bin/sh\nexec node scripts/hooks/pre-commit.mjs "$@"`)
- `scripts/hooks/install.mjs` — idempotent installer (creates `.git/hooks/pre-commit` chmod +x + merges `.claude/settings.local.json` hooks section)
- `scripts/hooks/__tests__/*.test.mjs` — `node --test` regression suite

### Critical gotchas

- **EXEMPT_PATH relative vs absolute**: PreToolUse passes absolute paths, pre-commit passes relative. Use `(?:^|[\/\\])` prefix to match both — `/[\/\\]scripts[\/\\]hooks[\/\\]/` fails on relative root-level.
- **Bash quote/HEREDOC stripping**: Strip quoted regions and HEREDOC bodies before matching banned flags (avoid false-positives from commit messages quoting the rule). Do **not** strip for vocab checks — forbidden words in commit messages should still block.
- **Per-machine state**: `.git/hooks/` and `.claude/settings.local.json` are gitignored. New clone = silently no enforcement. Document `node scripts/hooks/install.mjs` in `AGENTS.md` Core Rules.

### Cross-AI matrix

Only Claude Code provides Layer 1 (`PreToolUse`). All other AI bridges (Copilot · Gemini · Cursor · Codex · Cline · Continue · Aider · Windsurf · Amazon Q · Zed) and human IDE edits are caught only by Layer 2. Plan rules accordingly.

### Skip if

No absolute compliance rules · single-AI single-human project · hook-bug risk > marginal safety. The pattern pays off in legal/IP-sensitive vocab discipline · multi-AI compliance · safety-critical command guards (`--no-verify` / `git push --force` / `rm -rf` whitelists).

---

## Task Decomposition Strategy

> Cross-AI behavioral pattern for complex work with multiple decomposition paths (parallel vs sequential, subagent vs single-thread). Announce the choice at start → default to judgment / inertia → accept user pivot mid-flight. No stalling on confirmation (Auto-mode compatible).

### When to apply

- Materially different decomposition options exist (parallel vs sequential, etc.)
- Time difference non-trivial (≥30s saved by parallelization, OR meaningfully cleaner main context if isolated)
- Task structure ambiguous

Skip: single file read · known path · trivial command · one obvious decomposition · user already specified strategy.

### Announce format (1 sentence)

> {Strategy A} vs {Strategy B} — proceeding with {Choice} ({1-clause reason}). Redirect welcome.

### Inertia priority

1. Same-session prior decision (most natural)
2. Project memory `feedback_*.md` (persistent preference)
3. CHANGELOG patterns (same task type repeatedly handled same way)

More recent + more specific signal wins.

### Pivot recognition

- **Explicit**: "no", "wait", "differently", "redirect to" → immediate switch
- **Implicit**: scope change, new info added → pause + re-evaluate, announce updated plan
- **Ambiguous**: 1-line confirm ("continue with X, or switch to Y?")

### Per-AI mapping

- Claude Code: `Agent` tool with `subagent_type` (Explore · general-purpose · Plan); multiple Agent calls in one message → parallel
- Other AI bridges (Copilot · Gemini · Cursor · Codex · Cline · Continue · Aider · Windsurf · Amazon Q · Zed): no native subagent; sequential single-thread default; plan-then-execute via instruction text

Behavioral rule universal; implementation per-AI bridge.

### Anti-patterns

Announce on every prompt regardless of trade-off (noise) · wait for confirmation (Auto-mode violation) · ignore inertia, re-decide same way (wasted attention) · switch mid-task silently (loses redirect ability) · miss implicit pivots (continues old plan).

---

## File Templates

Inline templates the agent should write at scaffold time. Every template here is self-contained — no further references needed.

### `AGENTS.md`

```markdown
# AGENTS.md — [Project] Common Agent Guide (Source of Truth)

> Every AI coding agent reads this file. Each service's entry file bridges back here.

## 1. Context files (reading order)
1. `AGENTS.md` — this file
2. `.agent/rules.md` — working rules
3. `.agent/architecture.md` — tech stack & infra
4. `.agent/_coordination/STATE.md` — live agent activity (if multi-agent)
5. `.agent/_contracts/` — inter-part interface contracts
6. Your role folder's `README.md`

## 2. Role-based work
[Table from Phase 2 decisions]

## 3. AI service bridges
[Entry file list for services selected in Phase 4]
Rule change process: edit `AGENTS.md` only. Every bridge auto-follows.

## 4. Multi-agent coordination
- 4.1 Before starting: read `STATE.md` → check overlap → add row.
- 4.2 Before editing shared files: claim in `HANDOFF.md`.
- 4.3 Interface changes: edit under `.agent/_contracts/`, status DRAFT → REVIEW → ACTIVE.
- 4.4 Blockers: `.agent/_questions/open/YYYY-MM-DD_FROM-to-TO_NNN.md`. Priority: 🔴 24h · 🟡 72h · 🟢 info.
- 4.5 Done: one line in `CHANGELOG.md`, remove your row from `STATE.md`.
- 4.6 30-min+ blockers → `.agent/_lessons/NNN_*.md`. **AI agents record lessons proactively, without being told.**

## 5. Core rules
1. Language and tone: docs/commits in [Phase 0 language]; agent responses use [Phase 0 tone].
2. Documentation (3-digit numbering + Index): task logs in `.agent/[role]/001_Task.md`. Update the role README on every file add/change.
3. Git: commit format in §7. Never `git commit -a` (always `git add` → `git commit`).
4. Coordination first: STATE.md check → work → CHANGELOG.md record.
5. Accumulate troubleshooting experience in `.agent/_lessons/`.
6. Preserve the 3-layer doc separation: `.agent/` (agents) / `docs/` (devs) / `executive-docs/` (business).
7. **Index synchronization (mandatory)**: see seed § Index ↔ Body Sync.
8. **N-way sync for external surfaces (mandatory)**: see seed § External-Interface N-Way Sync; maintain the registry table here.
9. **Markdown `~` escape (mandatory)**: see seed § Markdown `~` Escape.
10. **RAG-friendly index density (recommended)**: see seed § RAG Index Optimization.

## 5.8 N-way sync registry
| Capability | Surfaces | Trigger |
|---|---|---|
| [filled in as project grows] | | |

## 6. Slash workflows (optional)
Define in `.agent/workflows/` if the project matures.

## 7. Commit message format
\```
[tag] title

- change 1
- technical decision

Co-Authored-By: <agent name>
\```
Tags: `[Feat]`, `[Fix]`, `[Docs]`, `[Style]`, `[Refactor]`, `[Chore]`.

## 8. References
- [docs/README.md] — human developer docs (if Phase 3 included)
- [executive-docs/README.md] — business strategy docs (if Phase 3 included)
- [.agent/_coordination/README.md] — coordination details
- [.agent/_lessons/README.md] — troubleshooting store
```

### `.agent/rules.md` (minimal)

```markdown
# Agent Work Rules

## Language and Tone
Docs/commits in [Phase 0 language]. Agent responses use [Phase 0 tone].

## Documentation
- `.agent/[role]/` — 3-digit numbered task files
- Update role README on every add/change

## Git
- Repo structure: [Phase 2 — single / split / monorepo]
- No `git commit -a` → always `git add` → `git commit`
- Commit message: [language], `[tag] title` format

## Coordination
- Read `.agent/_coordination/STATE.md` before work
- Claim shared files in HANDOFF.md
- Record completions in CHANGELOG.md

## Troubleshooting
- 30+ min blockers → `.agent/_lessons/NNN_*.md`
- Before any new task → grep `_lessons/` by tag
```

### `.gitignore`

Pick the **Common** block + the rows for the Phase 2 stacks the project uses + the **Seed-produced artifacts** block. Add stacks not listed here from the relevant `gitignore.io` template, but **always** include the Common and Seed-produced artifacts blocks.

```gitignore
# === Common ===
# OS
.DS_Store
Thumbs.db
desktop.ini
$RECYCLE.BIN/
.Spotlight-V100
.Trashes
ehthumbs.db

# IDE / editors
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
*.swp
*.swo
*~

# Env / secrets
.env
.env.*
!.env.example
*.pem
*.key
*.crt
secrets/
.secrets/

# Logs / debug
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# === Node / JavaScript / TypeScript (if Phase 2 includes Node, Next.js, Nuxt, SvelteKit, Vite, etc.) ===
node_modules/
.pnp
.pnp.js
.pnpm-store/
dist/
build/
out/
.next/
.nuxt/
.output/
.svelte-kit/
.turbo/
.cache/
coverage/
*.tsbuildinfo

# === Python (if Phase 2 includes Python, Django, FastAPI, Flask, etc.) ===
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
.venv/
venv/
env/
ENV/
*.egg-info/
.eggs/
.pytest_cache/
.mypy_cache/
.ruff_cache/
.tox/
htmlcov/
.coverage
.coverage.*

# === Go (if Phase 2 includes Go) ===
bin/
*.exe
*.exe~
*.dll
*.test
*.out
vendor/

# === Rust (if Phase 2 includes Rust) ===
target/
Cargo.lock  # (keep this committed for binaries; uncomment to ignore for libraries)
**/*.rs.bk

# === Java / JVM (if Phase 2 includes Kotlin, Scala, Java) ===
*.class
*.jar
*.war
*.ear
.gradle/
.idea/
build/
out/

# === Database / data files ===
*.sqlite
*.sqlite3
*.db
*.dump

# === Seed-produced artifacts ===
# Working drafts the seed-bootstrapped agents may create:
.agent/_questions/open/*.draft.md
.agent/scratch/

# External-delivery build outputs (commit the .md source; ignore generated HTML/PDF
# unless the project policy is to commit them — adjust per-project):
**/*.generated.html
**/*.generated.pdf
# If the project commits PDFs (e.g., external-delivery packets), comment out the above two lines.

# Tilde-escape script's dry-run intermediate (none — script is in-memory; no rule needed).
```

### `scripts/escape-md-tildes.mjs` (compressed inline — Lite)

```javascript
#!/usr/bin/env node
// Bulk-escape single `~` (GFM strikethrough trap) to `\~` across all .md files.
// Auto-preserves: code fences ``` / ~~~, inline code `, ~~strikethrough~~, HTML tags.
// Idempotent. Usage: node scripts/escape-md-tildes.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const EXCLUDES = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage', '.turbo', '.cache']);
const EXCLUDED_FILES = new Set([/* e.g. 'frontend/public/skills/<project>/SKILL.md' */]);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDES.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.isFile() && e.name.endsWith('.md')) {
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (!EXCLUDED_FILES.has(rel)) acc.push(full);
    }
  }
  return acc;
}

export function escapeTildes(s) {
  const ph = [];
  const push = (x) => { ph.push(x); return `\x00PH${ph.length - 1}\x00`; };
  s = s.replace(/(^|\n)(```[^\n]*\n[\s\S]*?\n```|~~~[^\n]*\n[\s\S]*?\n~~~)(?=\n|$)/g, (_, p, b) => p + push(b));
  s = s.replace(/`[^`\n]*`/g, push);
  s = s.replace(/~~(?!\s)(?:[^~\n]|~(?!~))+?(?<!\s)~~/g, push);
  s = s.replace(/<[a-zA-Z][^<>\n]*>/g, push);
  s = s.replace(/(^|[^\\])~/g, '$1\\~');
  for (let i = 0; i < 10 && s.includes('\x00PH'); i++) {
    s = s.replace(/\x00PH(\d+)\x00/g, (_, n) => ph[+n]);
  }
  if (s.includes('\x00')) throw new Error('placeholder restoration failed');
  return s;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = walk(ROOT);
  let changed = 0, delta = 0;
  for (const f of files) {
    const o = fs.readFileSync(f, 'utf8');
    const u = escapeTildes(o);
    if (o !== u) {
      delta += (u.match(/\\~/g) || []).length - (o.match(/\\~/g) || []).length;
      changed++;
      if (!DRY) fs.writeFileSync(f, u, 'utf8');
    }
  }
  console.log(`${DRY ? '[DRY] ' : ''}Changed: ${changed}/${files.length} · Tildes escaped (delta): ${delta}`);
}
```

### `scripts/build-md-to-html.mjs` (compressed inline — Lite)

Requires `marked` (`npm install marked --no-save` once). Replace the `FONT_BODY` / `FONT_MONO` stack with the project's working language.

```javascript
#!/usr/bin/env node
// MD → printable A4 HTML for outside delivery. Pair with Chrome --print-to-pdf.
// Usage: node scripts/build-md-to-html.mjs <input.md> <output.html> "Title"
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const [,, inputPath, outputPath, titleArg] = process.argv;
if (!inputPath || !outputPath) { console.error('Usage: ... <in.md> <out.html> "Title"'); process.exit(1); }
const md = fs.readFileSync(inputPath, 'utf8');
marked.setOptions({ gfm: true, breaks: false });
let html = marked.parse(md);
let firstH2 = false;
html = html.replace(/<h2\b/g, (m) => firstH2 ? '<div class="page-break"></div>\n' + m : (firstH2 = true, m));
const title = titleArg || path.basename(inputPath, '.md');
const FONT_BODY = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";  // ← replace per language
const FONT_MONO = "'D2Coding', 'Consolas', monospace";
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const out = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>
@page { margin: 2cm 2.5cm; size: A4; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: ${FONT_BODY}; font-size: 10.5pt; line-height: 1.7; color: #1a1a1a; }
h1 { font-size: 18pt; margin: 0 0 8pt; border-bottom: 2px solid #1a1a1a; padding-bottom: 6pt; page-break-after: avoid; }
h2 { font-size: 13pt; margin: 18pt 0 6pt; color: #2563eb; page-break-after: avoid; }
h3 { font-size: 11pt; margin: 14pt 0 4pt; page-break-after: avoid; }
h4 { font-size: 10.5pt; margin: 10pt 0 3pt; page-break-after: avoid; font-weight: 700; }
p { margin-bottom: 5pt; }  ol, ul { padding-left: 20pt; margin-bottom: 6pt; }  li { margin-bottom: 3pt; }
table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 9.5pt; page-break-inside: avoid; }
th, td { border: 1px solid #d1d5db; padding: 5pt 8pt; text-align: left; vertical-align: top; }
th { background: #f3f4f6; font-weight: 600; }
blockquote { background: #f9fafb; border-left: 3px solid #2563eb; padding: 8pt 12pt; margin: 10pt 0; font-size: 9.5pt; color: #4b5563; }
code { background: #f1f5f9; padding: 1pt 4pt; border-radius: 2pt; font-family: ${FONT_MONO}; font-size: 9.5pt; }
pre { background: #f1f5f9; padding: 8pt 12pt; border-radius: 3pt; margin: 8pt 0; font-size: 9pt; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
a { color: #2563eb; text-decoration: none; } strong { font-weight: 700; }
hr { border: none; border-top: 1px solid #e5e7eb; margin: 16pt 0; }
.page-break { page-break-before: always; }
</style></head><body>${html}</body></html>`;
fs.writeFileSync(outputPath, out, 'utf8');
console.log(`Wrote: ${outputPath}`);
```

### `scripts/build-pdf.{ps1,sh}` (optional convenience wrapper)

Skip if you'd rather invoke the 3-step chain manually. The PowerShell variant resolves Chrome/Edge from candidate paths; the bash variant uses `command -v google-chrome || command -v chromium-browser`. See § Markdown `~` Escape → External-delivery PDF pipeline for the exact commands.

### Bridge stubs (Phase 4 selections)

Each selected service gets one bridge file with a one-line `@AGENTS.md` import (or the service's equivalent) plus service-specific knobs.

**`CLAUDE.md`** (Anthropic Claude Code):
```markdown
@AGENTS.md

# Claude Code-specific instructions
- `.claude/rules/`: path-scoped rules
- Auto Memory: `~/.claude/projects/<project>/memory/`
- Slash commands: see `.agent/workflows/` (if defined)
- Co-Authored-By: `Claude <model> <noreply@anthropic.com>` (use the exact model line for the model in use; avoid model confusion)
```

**`GEMINI.md`** (Google Antigravity / Gemini CLI):
```markdown
# [Project] — Antigravity / Gemini Agent Entry Point
> AGENTS.md is SSoT. This file only adds Gemini-specific items.

[Phase 1 project summary in 1–2 sentences]

## Must read
1. AGENTS.md → 2. .agent/rules.md → 3. .agent/architecture.md → 4. .agent/_coordination/STATE.md

## Co-Authored-By
`Co-Authored-By: Gemini <model>`
```

**`.cursor/rules/main.mdc`** (Cursor):
```mdc
---
description: Project rules for Cursor
globs: ["**/*"]
alwaysApply: true
---

# Cursor entry
Source of Truth: `AGENTS.md` at root.

Must read: AGENTS.md → .agent/rules.md → .agent/architecture.md → .agent/_coordination/STATE.md → .agent/_contracts/

Claim shared files in `.agent/_coordination/HANDOFF.md` before editing.
Language/tone: [Phase 0 language] / [Phase 0 tone].
```

**`.windsurfrules`** (Windsurf):
```
# Windsurf entry
Source of Truth: root AGENTS.md.
Must read: AGENTS.md → .agent/rules.md → .agent/architecture.md → .agent/_coordination/STATE.md → .agent/_contracts/
Before editing shared files: claim in .agent/_coordination/HANDOFF.md.
Blockers: .agent/_questions/open/. Troubleshooting: .agent/_lessons/.
Language/tone: [Phase 0 language] / [Phase 0 tone].
```

**`.aider.conf.yml`** (Aider):
```yaml
read:
  - AGENTS.md
  - .agent/rules.md
  - .agent/architecture.md
  - .agent/_coordination/STATE.md
  - .agent/_coordination/HANDOFF.md
auto-commits: false
```

**`.continue/config.yaml`** (Continue.dev):
```yaml
name: [Project]
version: 1.0.0
rules:
  - |
    Source of Truth: AGENTS.md.
    Must read: AGENTS.md → .agent/rules.md → .agent/architecture.md → .agent/_coordination/STATE.md → .agent/_contracts/
    Before editing shared files: claim in .agent/_coordination/HANDOFF.md.
    Language/tone: [Phase 0 language] / [Phase 0 tone].
```

**`.github/copilot-instructions.md`** (GitHub Copilot), **`.clinerules/main.md`** (Cline), **`.amazonq/rules/main.md`** (Amazon Q), **`.rules`** (Zed / generic), and other services follow the same 3–6 line bridge pattern: name the SSoT (`AGENTS.md`), list the must-read order, mention the HANDOFF.md claim rule, declare the language and tone. **Service-specific knobs stay in the bridge file**; rules of universal scope go in `AGENTS.md`.
