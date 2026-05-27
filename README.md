<p align="center">
  <img src="logo/EstreGenesis.png" alt="EstreGenesis logo" width="472" height="384" />
</p>

<p align="center">
  <img alt="Version: v2.0.0" src="https://img.shields.io/badge/version-v2.0.0-2ea44f?style=for-the-badge" />
  <a href="LICENSE.md"><img alt="License: Apache 2.0" src="https://img.shields.io/badge/license-Apache_2.0-blue?style=for-the-badge" /></a>
  <img alt="Seed tiers: 3" src="https://img.shields.io/badge/seed_tiers-3-8250df?style=for-the-badge" />
  <img alt="Seed files: 6" src="https://img.shields.io/badge/seed_files-6-0969da?style=for-the-badge" />
  <img alt="Languages: English and Korean" src="https://img.shields.io/badge/languages-EN%20%7C%20KO-bf8700?style=for-the-badge" />
</p>

<p align="center">
  <img alt="Layer: AGENTS.md-first" src="https://img.shields.io/badge/layer-AGENTS.md--first-6e7781?style=for-the-badge" />
  <img alt="Mode: bootstrap and migration" src="https://img.shields.io/badge/mode-bootstrap_%2B_migration-0a7f5a?style=for-the-badge" />
  <img alt="Runtime: agent agnostic" src="https://img.shields.io/badge/runtime-agent_agnostic-c2410c?style=for-the-badge" />
  <img alt="Repository: public" src="https://img.shields.io/badge/repo-public-1a7f37?style=for-the-badge" />
</p>

<a id="english"></a>

# EstreGenesis — AGENTS.md-First AI Native Seed System

**Language**: **English** (below) · [한국어](#korean)

> **Run Claude, Cursor, Copilot, Gemini, and other AI coding agents on the same codebase without rule-file chaos.** AGENTS.md-first seed prompts that bootstrap or migrate an AI-native project into a service-agnostic operating system for multi-agent collaboration.

Copy one file into your new project. Paste it as the first message to any AI coding agent. The agent runs an **interactive bootstrap** (new project) or a **structured migration** (existing project) that leaves you with a service-agnostic operating system for AI collaboration.

## Start in 60 seconds

1. Pick one seed: **Lite** ([English](AI_Native_Project_Seed_Prompt_Lite.md) / [한국어](AI_Native_프로젝트_시드_프롬프트_Lite.md)) is the default; use **Compact** ([English](AI_Native_Project_Seed_Prompt_Compact.md) / [한국어](AI_Native_프로젝트_시드_프롬프트_Compact.md)) if you already know the pattern, or **Master** ([English](AI_Native_Project_Master_Seed_Prompt.md) / [한국어](AI_Native_프로젝트_마스터_시드_프롬프트.md)) if you want every inline template.
2. Copy it into your target project as `.agent/seed_prompt.md`.
3. Paste the same file as the first message to Claude Code, Cursor, Copilot, Gemini, Codex, Cline, Windsurf, or another coding agent.

The agent will ask the Phase 0-7 bootstrap/migration questions and generate `AGENTS.md`, `.agent/`, and the bridge files you choose.

---

## Why this exists

Most AI coding guides tell you how to talk to **one** model. Real projects don't stay monogamous — you end up with a `CLAUDE.md` next to a `.cursor/rules/` next to a stray `GEMINI.md`, and the rules start to contradict each other. When two agents edit the same file at the same time, there's no coordination layer. When a blocker takes three hours to solve, the next session has no memory of the fix.

This seed bakes in patterns tested during the intensive operation of the author's second AI Native project, run with **three concurrent AI agents** (Antigravity + GitHub Copilot + Claude Code). The focus areas:

- **Preventing repeat mistakes** — `.agent/_lessons/` records every surprising blocker with tags; next session greps before touching the area.
- **Document-layer separation** — `.agent/` (agent workspace) vs `docs/` (developer runbooks) vs `executive-docs/` (strategy) vs `dashboard/` (user-action backlog) — each with a specific audience, no mixing.
- **Repo residency boundaries** — Phase 2.5 decides whether the workspace is the source repo, a private agent-docs sidecar, a multi-project orchestration repo, or an upstream/local split before choosing the `.agent/` shape.
- **Service-agnostic bridges** — `AGENTS.md` is the single source of truth. Every AI service's rule file (CLAUDE.md, GEMINI.md, .cursor/rules/, .windsurfrules, .aider.conf.yml, …) points to it or imports it where the tool supports imports. Switch services freely, rules don't break.
- **Concurrent multi-agent safety** — `.agent/_coordination/` with STATE.md, HANDOFF.md, CHANGELOG.md prevents file-edit collisions and gives every agent a live map of who's doing what.
- **Research-driven decisions** — Significant branch points (strategy, tech selection, legal, market) trigger a Research → Report → Plan → Link loop with URL-sourced evidence and honest "source unverified" markers.

---

## Why not just `CLAUDE.md`?

The seed starts paying for itself when any of these scenarios show up:

| Scenario | Single rules file (CLAUDE.md, .cursor/rules, …) | EstreGenesis pattern |
|---|---|---|
| 2nd or 3rd AI service joins the project | Duplicate rules per service file; they drift over time | Bridge files point each tool back to `AGENTS.md` — SSoT stays single |
| Two agents edit the same file at once | No coordination layer; last write wins | `_coordination/HANDOFF.md` claim ledger + live `STATE.md` map |
| 3-hour blocker solved last week | Stuck in chat history, gone next session | `_lessons/` entry, grepped at task start |
| Project already has scattered rule files | Manual triage, no template | Migration A: audit → extract `AGENTS.md` → rewrite bridges |
| Strategic decision (stack, legal, market) | Ad-hoc chat, no audit trail | Research → Report → Plan → Link loop with URL evidence |
| Seed-bootstrapped project, new seed version released | Manual diff and apply | Migration B: numbered delta menu, additive only |

If none apply, a single rules file is fine. If one applies, EstreGenesis starts paying for itself. If two or more apply, the bridge-and-SSoT pattern stops being optional.

---

## Beyond bootstrap — Constellation (2.0)

v1.x is the project seed — bootstrap a new AI-native project, or migrate an existing one, into the `AGENTS.md` SSoT (everything above). **v2.0 adds Constellation**, one optional module: it graduates multi-agent coordination from the file-based `.agent/_coordination/` ledger to a real-time live board (WebSocket + A2A messaging + dashboard). The **A2A bridge interface** is the invariant contract; how much you adopt follows the seed tier.

Constellation ships as a **referenced module** ([Constellation.md](Constellation.md) + [constellation/](constellation/)) so the tier seeds stay lean. Its live-board UI components are authored as `.eux` and brewed with **EstreUX** — a separate runtime EstreGenesis *references*, not bundles or owns.

File-based coordination (Phase 5) remains the default and is enough for most projects; Constellation is for concurrent multi-agent operation that benefits from a live board. Skip it and you have the v1.x project seed.

---

## Three tiers — pick one per project

| Tier | Size | Primary use | Target reader |
|---|---|---|---|
| **Master** | ~2305 lines | New projects that need deep guidance, teams learning the pattern for the first time, edge cases where you need every inline template (full AGENTS.md + `.gitignore` per-stack rows + escape/HTML/PDF scripts + bridge templates) | First-time AI Native author; teams formalizing a process |
| **Lite** | ~1070 lines | Quick new projects, migration sessions, onboarding new AI services into existing projects, when the master would eat too much context window. Self-contained — embeds inline templates for AGENTS.md, `.agent/rules.md`, `.gitignore`, scripts, and bridge stubs in compressed form | Returning author who remembers the pattern; most projects |
| **Compact** | ~115 lines | Authors who already know the pattern and want the minimum viable seed; tightest context window; bullet triggers + algorithm-spec descriptions only (the agent generates the actual files following the specs) | Power user who just needs a checklist |

You place **one tier** into your project. Not all three. Cross-referencing tiers that aren't present produces dead links and agent confusion, so each tier is **self-contained** — internally complete, no forward or backward references to other tiers.

When a project grows to need more detail, you don't upgrade tiers in-place. You simply replace the file with the next tier and commit. Agents treat it as a normal doc update.

---

## File list

```
AI_Native_Project_Master_Seed_Prompt.md       ← English master (deepest, ~2305 lines)
AI_Native_Project_Seed_Prompt_Lite.md         ← English lite (~1070 lines, self-contained)
AI_Native_Project_Seed_Prompt_Compact.md      ← English compact (~115 lines, self-contained)
AI_Native_프로젝트_마스터_시드_프롬프트.md       ← Korean master
AI_Native_프로젝트_시드_프롬프트_Lite.md          ← Korean lite
AI_Native_프로젝트_시드_프롬프트_Compact.md       ← Korean compact
Constellation.md                               ← v2.0 module: live multi-agent orchestration guide (WS + A2A)
constellation/                                 ← v2.0 module: rough-tier .eux specs of live-board components + README
README.md                                      ← This file (library index; don't ship to projects)
LICENSE.md                                     ← Apache License 2.0 text
logo/EstreGenesis.png                          ← README logo
```

Each language pair (English + Korean) of a given tier is fully aligned — same phases, same migration logic, same operational guidance. Pair them if your team is bilingual. **v2.0** adds Constellation (live multi-agent orchestration) as a referenced module; its live-board components are brewed with the EstreUX runtime (referenced, not bundled) — see the changelog.

---

## Migration scenarios

For a new project, see [Start in 60 seconds](#start-in-60-seconds) above. To migrate an existing project, pick the path below — see [§ Migration details](#migration-details-the-unique-contribution) for red flags and edge cases per scenario.

### Migration A — existing project, no formal AI collaboration setup

1. Copy the **Lite** file into the project (Lite has the best migration prose).
2. Paste as first message.
3. Tell the agent: *"This project already exists — please audit first and propose migration."*
4. Agent enters **Migration A** mode: audits every `CLAUDE.md` / `.cursor/rules/` / scattered agent notes, presents inventory, proposes extraction of service-agnostic rules into a new `AGENTS.md` SSoT.
5. Review the extraction, approve, let the agent point bridge files back to `AGENTS.md`, reorganize `.agent/`, and record the migration in `.agent/_lessons/001_AI_Native_Migration.md`.

### Migration B — existing project, already seed-bootstrapped with an older version

1. Copy the current-version seed into the project (same tier as the previous one — don't tier-upgrade during a version migration).
2. Paste as first message.
3. Tell the agent: *"Project was bootstrapped with an earlier version of this seed — please upgrade additively."*
4. Agent enters **Migration B** mode: identifies starting version, diffs capabilities (missing research loop? missing multi-agent coordination? missing migration guides themselves?), presents numbered delta menu.
5. Review, approve selected deltas, agent applies additively — never rewriting existing user customizations.

### Migration C — hybrid

Parts of the project are seed-compliant, parts are ad-hoc. Agent runs **Migration C**: subsystem-by-subsystem, applying A or B as appropriate, documenting the hybrid origin.

---

## What the seed produces

After Phase 7 (bootstrap) or a migration completes, the default source-repo shape is:

```
your-project/
├── AGENTS.md                          ← single source of truth for all AI services
├── .agent/
│   ├── seed_prompt.md                 ← the seed file you placed (so agents can re-read)
│   ├── rules.md                       ← detailed work rules
│   ├── architecture.md                ← tech stack, data flow, dependencies
│   ├── _coordination/                 ← multi-agent workspace (if applicable)
│   │   ├── STATE.md                   ← live "who's doing what"
│   │   ├── HANDOFF.md                 ← file-claim ledger
│   │   └── CHANGELOG.md               ← completion log
│   ├── _contracts/                    ← API/Event/Type contracts between parts
│   ├── _questions/                    ← async cross-agent Q&A
│   │   ├── open/
│   │   └── resolved/
│   ├── _lessons/                      ← troubleshooting memory
│   └── PM/                            ← plans, 3-digit prefix
│       └── 001_Phase1_Plan.md
├── CLAUDE.md                          ← Claude Code bridge (points to AGENTS.md)
├── GEMINI.md                          ← Gemini bridge
├── .github/copilot-instructions.md    ← Copilot bridge
├── .cursor/rules/main.mdc             ← Cursor bridge
├── (other bridges based on your Phase 4 choices)
├── docs/                              ← developer runbooks (optional)
├── executive-docs/                    ← strategy, legal (optional, larger projects)
├── dashboard/                         ← user-action backlog (optional)
└── meetings/                          ← meeting records (optional)
```

Phase 2.5 may choose a non-default `<scope-root>` first: direct `.agent/` for ordinary source repos, `.agent/<unit-project-name>/` for multi-project orchestration, or `<scope-root>/project/` plus `<scope-root>/upstream/` for upstream-bound work. Sidecar setups add source-map/public-boundary docs and only add a source folder to `.gitignore` after the user identifies it and the agent verifies it exists in the workspace.

Every AI service that joins the project later reads `AGENTS.md` and is immediately productive. No service-specific onboarding, no "wait, what are the rules here?" — everything lives in one place.

---

## The operating loop (after bootstrap)

Every agent — the one you use daily, and any new one joining — follows this 8-step loop:

The list below uses default `.agent/` paths; replace them with `<scope-root>` when Phase 2.5 selected a non-default residency shape.

1. Read `AGENTS.md` (SSoT)
2. Read `.agent/rules.md` + `.agent/architecture.md`
3. Read `.agent/_coordination/STATE.md` (multi-agent projects only)
4. Grep `.agent/_lessons/` for tags related to the current task
5. Claim shared files in `.agent/_coordination/HANDOFF.md` before editing
6. Record blockers in `.agent/_questions/open/`
7. Log completion in `.agent/_coordination/CHANGELOG.md`, remove from STATE.md
8. Record surprises (>30 min investigations) in `.agent/_lessons/`

This is the OS of an AI-native project. Steps 4, 7, 8 are the memory. Steps 3, 5, 6 are the coordination. Steps 1, 2 are the constitution.

---

## Supported AI services (bridges scaffolded out of the box)

| Service | Bridge file |
|---|---|
| Claude Code | `CLAUDE.md` + `.claude/rules/` |
| Google Antigravity / Gemini CLI | `GEMINI.md` |
| GitHub Copilot (VS Code agent) | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/main.mdc` |
| Windsurf | `.windsurfrules` |
| Aider | `.aider.conf.yml` + read list |
| Continue.dev | `.continue/config.yaml` |
| Cline | `.clinerules/main.md` |
| Amazon Q Developer | `.amazonq/rules/main.md` |
| Zed / generic | `.rules` |
| OpenAI Codex CLI / Jules / Kiro / others | Read `AGENTS.md` directly |

Every bridge points the service back to `AGENTS.md` (or imports it where supported) plus whatever service-specific knobs that tool requires. Switching services is a no-op — the SSoT stays.

When a new AI service launches, you just add one more bridge file. The rule system doesn't have to change.

---

## Migration details (the unique contribution)

Bootstrap is useful. Migration is where this seed earns its keep. Three scenarios covered in every tier:

### Migration A — scattered AI files → `AGENTS.md` standard

Your project already has `CLAUDE.md` with 143 lines of rules, a `.cursor/rules/` with 89 lines, some `.agent/notes/decisions.md` that never got organized, and no single source of truth. The agent audits the inventory first (never scaffolds blind), extracts service-agnostic rules into a fresh `AGENTS.md`, rewrites each existing bridge file to import from it, reorganizes `.agent/` into the standard shape, and records what moved where in `.agent/_lessons/001_AI_Native_Migration.md`. Red flags — conflicting rules across bridges, prior git history in `.agent/`, custom coordination schemes the user prefers to keep — stop the agent and require explicit user decision before proceeding.

### Migration B — previous seed version → current

Project was bootstrapped with an older version of this seed (missing the research loop, multi-agent coordination layer, migration guides, or Bootstrap Residency checks). The agent identifies the starting version, diffs capabilities, presents a numbered menu of available deltas. The user picks which to apply. Every addition is marked with `<!-- added in seed vX.Y migration, YYYY-MM-DD -->` so future readers can trace lineage. **Existing user customizations are preserved** — the agent never re-runs the Phase 0-7 interview on a migrated project.

### Migration C — hybrid

Parts of the project are seed-compliant, parts are ad-hoc custom structure. The agent runs A on the custom parts, B on the seed-compliant parts, merges results in `AGENTS.md`, and documents the hybrid origin. Hybrid migrations often surface real business logic that a pure A or B would miss — the seed treats this as a high-value lessons-file opportunity, not a nuisance.

---

## Design principles

The seed reflects six opinions earned the hard way:

1. **Docs before code, not the other way around.** Every decision lives in a file. An agent that can't find the decision will reinvent (often differently from last time).
2. **One SSoT (`AGENTS.md`), many bridges.** Service proliferation is a given. Centralize shared rules, let each service keep its own knobs.
3. **Memory compounds through `_lessons/`.** A 30-minute debug session becomes a 30-second grep next time.
4. **Coordination is explicit, not implicit.** Multi-agent projects need STATE/HANDOFF/CHANGELOG. "Just trust each other not to collide" does not scale past two agents.
5. **Research-driven decisions for branch points.** Ad-hoc strategic decisions are how projects compound tech debt silently. Research → Report → Plan → Link turns every major choice into an auditable trail.
6. **Repo residency before doc shape.** Public/collab source repos, private agent-docs repos, multi-project orchestration, and upstream-bound work need different `<scope-root>` decisions before files are created.

---

## Versioning

Each tier has its own version. Master is the authoritative evolution track; Lite and Compact are derived regularly from Master but may lag by a release. Changes:

- **v1.0** (2026-04-18) — First edition (Master). Based on the author's second AI Native project.
- **v1.1** (2026-04-19) — Research → Report → Plan loop section added. Core Principle #7.
- **v1.2** (2026-04-20) — Migration A/B/C guides added. Bootstrap/Migration mode branching at top of Agent Instructions. Lite and Compact tiers initial release.
- **v1.3** (2026-05-02) — Two new core principles: #8 (Index ↔ body synchronization) and #9 (External-interface N-way sync). Six new sections: § Index Synchronization Policy · § External-Interface N-Way Sync · § Markdown Tilde Escape Policy · § RAG Index Optimization · § External Delivery Build Pipeline · § Document Inflation Prevention (appendix `<NN>b_*.md` pattern). All three tiers updated; Lite and Compact gain condensed forms of the same patterns. All additions distilled from real incidents in the author's second AI Native project's 2026-04-21 → 2026-05-02 operations: a one-week stale external-surface leak (drove the N-way sync policy), a last-minute markdown strikethrough in an external-delivery PDF (drove the tilde escape policy), another agent acting on a stale index (drove the index sync policy), and a project file capacity hitting 100% in a Claude project workspace (drove the RAG-friendly indexing rules).
- **v1.3.1** (2026-05-02) — Self-sufficient tooling: master seed § File Templates now embeds full inline scripts so the seed bootstraps a complete external-delivery toolchain without external references. New templates: `scripts/escape-md-tildes.mjs` (no-deps Node ≥18, idempotent, placeholder-protected algorithm), `scripts/build-md-to-html.mjs` (`marked`-based MD → A4 HTML with h2 page-break, project-language font stack), and convenience wrappers `scripts/build-pdf.ps1` (Windows) / `scripts/build-pdf.sh` (macOS/Linux) that chain the 3-step `escape → HTML → Chrome --print-to-pdf` pipeline. § Markdown Tilde Escape Policy gains an "Algorithm" subsection explaining why placeholder-based protection is mandatory (vs. naïve regex). § External Delivery Build Pipeline gains a "Why these specific tools" subsection (`marked` vs Puppeteer trade-offs, A4 page rules) and macOS/Linux Chrome equivalents. Lite and Compact tiers expand their § Markdown `~` Escape (condensed) sections with the placeholder algorithm summary and the cross-platform PDF pipeline; the master seed remains the single source for the inline scripts.
- **v1.3.2** (2026-05-02) — `.gitignore` template + cross-tier audit. **`.gitignore`**: Master § File Templates now embeds an inline template — Common (OS, IDE, env, logs) + per-stack rows for Node / Python / Go / Rust / JVM / C-C++ / Mobile / DB + a Seed-produced artifacts block using a `.generated.` infix convention so the rule precisely sweeps build outputs without trapping handcrafted attachments. **Cross-tier audit**: the README's stated principle ("each tier is self-contained — internally complete, no forward or backward references to other tiers") had been violated since v1.0; the v1.3.1 release made it worse by adding more cross-tier references. v1.3.2 brings the **Lite** and **Compact** tiers back into compliance — every "→ master seed § ..." cross-reference removed. Lite is now 909 / 912 lines (Korean / English) with a complete § File Templates section embedding inline AGENTS.md, `.agent/rules.md`, `.gitignore` (Common + Phase 2 stacks + seed artifacts), `scripts/escape-md-tildes.mjs` (compressed Node ≥18), `scripts/build-md-to-html.mjs` (compressed `marked` + A4 CSS), and stubs for all 11 supported AI service bridges. Compact is 119 lines per language with a new § Scaffold specs section providing algorithm-spec descriptions for each scaffold target — the agent reads the spec and generates the actual files. All three tiers now ship independently into a project repo as the README has always promised.
- **v1.3.4** (2026-05-03) — Enforcement Hook Architecture added. Master gains a full section describing two-layer enforcement: Layer 1 Claude Code `PreToolUse` plus Layer 2 `git pre-commit`, both backed by a single regex SSoT in `scripts/hooks/_patterns.mjs`; an idempotent installer creates the `.git/hooks/pre-commit` shim and merges `.claude/settings.local.json`; path matching, Bash quote/HEREDOC false-positive handling, tests, and cross-AI applicability are documented. Lite gets a condensed version, and Compact adds Principle #10 plus a sync-rules bullet.
- **v1.3.5** (2026-05-03) — Task Decomposition Strategy added. The seed now gives agents a cross-AI pattern for complex work with multiple decomposition paths: announce the chosen shape, proceed by judgment/inertia without stalling for confirmation, and accept explicit or implicit user pivots mid-flight. Master includes thresholds, inertia priority, per-AI tool mapping, and anti-patterns; Lite and Compact carry condensed forms.
- **v1.3.6** (2026-05-03) — External knowledge index auto-sync added under Index ↔ Body Sync. When a project mirrors structured folders into an external KB such as Claude memory, Notion, a wiki, or RAG metadata, pre-commit may call a dedicated sync script to update mechanical structure (counts, stubs, numbering, orphan warnings) while leaving semantic content human-curated. Master has the full subsection; Lite and Compact carry condensed clauses.
- **v1.3.7** (2026-05-03) — Phase 0 now captures agent reply tone after working language. Korean prompts offer six speech-level choices (`~니다`, `~에요/예요/어요`, `~음/슴/임`, casual peer tone, blunt challenge tone, or custom direction); English prompts carry equivalent tone choices. Default is to match the user's opening tone or use one notch more polite. Generated `AGENTS.md`, `.agent/rules.md`, and bridge stubs now record language and tone separately.
- **v1.4.0** (2026-05-03) — Applied the official EstreGenesis naming across document titles, anonymized source-project references for public release, and published the seed prompt library as a public repo. Content base: legacy private archive, commit `5944a50` (v1.3.6, 2026-05-03).
- **v1.4.1** (2026-05-06) — Metadata reconciliation. During the v1.3.6 → v1.4.0 absorption pass, the Master tier (KO/EN) Migration B delta tables omitted the v1.3.4 (Enforcement Hook Architecture), v1.3.5 (Task Decomposition Strategy), and v1.3.6 (External knowledge index auto-sync) rows that the four other tiers carried. v1.4.0 content is unchanged — the three rows are reinstated to restore 6-tier sync. The Master Phase 7 § File Scaffolding Checklist also gains an explicit optional `scripts/hooks/` block (Enforcement Hook Architecture is opt-in for projects with absolute rules worth enforcing). README v1.4.0 entry gains the legacy archive SHA for traceability.
- **v1.5.0** (2026-05-07) — Bootstrap Residency added across all six seed files. New Phase 2.5 decides whether the workspace is a source repo, private agent-docs sidecar, multi-project orchestration repo, or upstream/local split before choosing `<scope-root>`. It supports Minimal, Full manual, and repo-provider assisted bootstrap (GitHub, GitLab, Bitbucket, Azure DevOps, Gitea, Forgejo, self-hosted/local remotes, or user-provided repo lists), adds workspace-limited-agent warnings, defaults upstream folders to `upstream/` unless renamed by the user, and guards `.gitignore` sidecar-source entries with explicit user identification plus agent verification. Master also gains an Adoption Catalog with trigger conditions; Lite and Compact carry condensed forms.
- **v1.5.1** (2026-05-08) — Patch release from adoption feedback. All six seed headers now clarify that the changelog pointer means the **upstream EstreGenesis repository README.md**, not the target project's README.md after the seed is copied. KO Master also fixes v1.5.0 absorption leftovers: Phase 0 and Phase 4 closing lines now correctly point to Phase 7, the new Phase 2.5 sub-headings are localized, and the Adoption Catalog heading/table header are localized.
- **v1.6.0** (2026-05-09) — Agent-time vs human-time estimation. AI agents that estimate using human dev-team baselines inflate plans 5–10×, which causes calendar mismatches and erodes PM template usefulness. Phase 0 now asks one more question after language and tone: **execution pace mode** — Cautious 2–4× (free tier or local LLM like Continue.dev / Aider with local models, calibrated against output tokens-per-second), Proactive 5–6× (default for paid plans), Burst 6–8× (high-throughput plans), Sprint 9–10× (effectively unlimited tokens, max parallelism). Within each mode, task type adjusts the position: execution-heavy work hits the top, debugging the middle, research / strategy stays at ~1× regardless because human review is rate-limiting. Every duration estimate splits **agent active time** from **human review / approval time** plus a **calendar window** that absorbs handoff gaps. Mode is project-wide and switchable mid-project ("switch to sprint" / "drop to cautious") with automatic re-baselining of active PM estimates and a CHANGELOG entry. The seed self-calibrates against actuals: ±30%+ deltas log to `.agent/_lessons/` with the `estimation` tag, and after three+ such entries in the same mode the agent proposes a calibrated multiplier. Master gains Core Principle #11 plus a full § Agent-Time Estimation Policy section (two-axis framework, mode-switch protocol, self-calibration loop, anti-patterns, cross-AI applicability). Lite carries Principle #8 plus a condensed policy section. Compact carries Principle #13 inline. PM templates across all tiers updated to the split-time format. AGENTS.md Core rules line 1 now records language + tone + pace mode together.
- **v2.0.0** (2026-05-27) — Adds **Constellation** (Core Principle #12 / Lite #9 / Compact #14), one optional module. Multi-agent coordination graduates from the file-based `.agent/_coordination/` ledger to a real-time live board (WebSocket + A2A messaging + dashboard). The **A2A bridge interface** (roles board/main/local/upstream/collab · handshake · messaging · turn-based bridge-daemon + self-wake-watcher runtime pattern) is the invariant contract; adoption depth follows the seed tier. Constellation ships as a separate `Constellation.md` guide + `constellation/*.eux` component specs — including `gateway-client.eux`, the detail-tier A2A adapter — referenced from the tier seeds by raw GitHub URL so the seeds stay lean. Its live-board UI components are authored as `.eux` and brewed with **EstreUX**, a separate runtime EstreGenesis *references* (not bundles or owns); EstreGenesis does not own or teach the EUX format — it is a build-time dependency of Constellation, not a layer of the seed. File-based coordination (Phase 5) remains the default. The prior v1.6.0 state is preserved on the `1.x` branch; 2.0 is `main`. Constellation matures toward a published EstreGenesis Claude plugin.

This upstream repository README is the changelog SSoT. Each seed file keeps only a compact header metadata line with tier, language, current version, counterpart, and a pointer back to the upstream EstreGenesis repository README.md, not the target project's README.md. When you upgrade a project using Migration B, the agent uses the seed header version marker plus this changelog to compute the delta.

---

## Contributing

The seed is a living artifact. If you run it on a project and find:

- A **question the bootstrap interview should be asking** but doesn't → extend the relevant Phase.
- An **unnecessary question** that always gets "skip" → remove it.
- A **new AI service** that doesn't have a bridge template → add to Phase 4 + bridge templates.
- A **battle-tested multi-agent tip** not yet captured → extend the Multi-Agent Coordination Tips section (Master tier).
- A **counter-example of the research-driven decision loop** → extend the anti-patterns / self-audit checklist.
- A **new migration edge case** → extend § Migration Guides with a new scenario or red flag.

Changes to Master trickle to Lite and Compact as distillation. Only the Master should be edited for substantive content; Lite and Compact are tightened views of the same material.

---

## License

Copyright 2026 SoliEstre (Estre Soliette).

The seed prompts are licensed under the **Apache License 2.0**. You may copy, modify, and redistribute them under the terms in [LICENSE.md](LICENSE.md). The patterns encoded (document layer separation, SSoT via `AGENTS.md`, `.agent/_lessons/` memory loop, migration A/B/C scenarios) are intended as an **open standard** — adapt them to your stack, contribute improvements back.

The specific bridge-file format for each AI service follows each service's own convention. This seed does not claim any authority over the individual bridge formats — only over the unified pattern that makes them interoperate.

---

## Credits

Patterns distilled from running the author's second AI Native project through intensive multi-agent operation (Antigravity, Claude Code, GitHub Copilot). Every `_lessons/` entry in the seed descends from a real blocker that cost real time. Every migration red flag came from a real mistake.

If this seed saves you from making the same mistakes, great. If it helps you make *different* mistakes and contribute *new* lessons back, even better.

---

## Related reading

- **AGENTS.md standard** — convergence pattern for AI coding agents across Claude, Codex CLI, Jules, Kiro, and others. See `https://agents.md` if/when a community-maintained spec emerges; meanwhile every tier in this seed implements the pattern.
- **Model Context Protocol (MCP)** — Anthropic's open standard for AI tool integration. Relevant when your project wants AI agents to act *on* it (not just edit the code of it). Out of scope for the seed itself.
- **Claude Agent Skills** — Anthropic's skill packaging format. A seed-bootstrapped project can optionally ship a `skills/<project>/SKILL.md` for direct Claude integration.

These are ecosystem touchpoints, not seed prerequisites. The seed works independently of any of them.

---

<a id="korean"></a>

# EstreGenesis — AGENTS.md 우선 AI Native 시드 시스템 (한국어)

**언어**: [English](#english) · **한국어** (아래)

> **Claude·Cursor·Copilot·Gemini 등 여러 AI 코딩 에이전트를 같은 코드베이스에서 룰 파일 카오스 없이 운용.** AGENTS.md 우선 시드 프롬프트가 신규 AI Native 프로젝트를 부트스트랩하거나 기존 프로젝트를 마이그레이션해, 멀티에이전트 협업을 위한 서비스 중립 운영 체제로 만듭니다.

파일 하나를 새 프로젝트에 복사. AI 코딩 에이전트의 첫 메시지로 붙여넣기. 에이전트가 **대화형 부트스트랩**(신규 프로젝트) 또는 **체계적 마이그레이션**(기존 프로젝트)을 실행해, AI 협업을 위한 **서비스 중립 운영 체제**를 프로젝트에 남깁니다.

## 60초 시작

1. 시드 하나 선택: **Lite** ([English](AI_Native_Project_Seed_Prompt_Lite.md) / [한국어](AI_Native_프로젝트_시드_프롬프트_Lite.md))가 기본값. 패턴을 이미 알면 **Compact** ([English](AI_Native_Project_Seed_Prompt_Compact.md) / [한국어](AI_Native_프로젝트_시드_프롬프트_Compact.md)), 모든 인라인 템플릿이 필요하면 **Master** ([English](AI_Native_Project_Master_Seed_Prompt.md) / [한국어](AI_Native_프로젝트_마스터_시드_프롬프트.md))를 사용.
2. 대상 프로젝트에 `.agent/seed_prompt.md`로 복사.
3. 같은 파일을 Claude Code, Cursor, Copilot, Gemini, Codex, Cline, Windsurf 등 AI 코딩 에이전트의 첫 메시지로 붙여넣기.

에이전트가 Phase 0-7 부트스트랩/마이그레이션 질문을 진행하고 `AGENTS.md`, `.agent/`, 선택한 브릿지 파일을 생성합니다.

## 왜 존재하는가

대부분의 AI 코딩 가이드는 **하나**의 모델과 대화하는 법을 알려줍니다. 실제 프로젝트는 일부일처를 유지하지 못합니다 — `CLAUDE.md` 옆에 `.cursor/rules/`, 그 옆에 방치된 `GEMINI.md` 가 쌓이고, 규칙들이 서로 모순되기 시작합니다. 두 에이전트가 동시에 같은 파일을 편집할 때 코디네이션 레이어는 없습니다. 3시간 걸려 해결한 블로커는 다음 세션에서 기억되지 않습니다.

본 시드는 **3개 AI 에이전트 동시 운용**(Antigravity + GitHub Copilot + Claude Code)으로 돌린 Author의 두 번째 AI Native 프로젝트의 집중 운영 경험에서 추려낸 패턴을 내재화합니다. 초점:

- **같은 실수 반복 방지** — `.agent/_lessons/` 가 모든 예상 밖 블로커를 태그와 함께 기록; 다음 세션은 해당 영역 건드리기 전 grep.
- **문서 레이어 분리** — `.agent/`(에이전트 워크스페이스) vs `docs/`(개발자 런북) vs `executive-docs/`(전략) vs `dashboard/`(사용자 조치 백로그) — 각각 특정 독자, 섞이지 않음.
- **repo residency 경계** — Phase 2.5 가 작업공간이 소스 repo, 개인 개발/에이전트 문서 sidecar, 다중 프로젝트 오케스트레이션 repo, upstream/local split 중 무엇인지 먼저 정한 뒤 `.agent/` 모양을 선택.
- **서비스 중립 브릿지** — `AGENTS.md` 가 단일 SSoT. 모든 AI 서비스의 규칙 파일(CLAUDE.md, GEMINI.md, .cursor/rules/, .windsurfrules, .aider.conf.yml, …)이 이를 가리키거나, 도구가 지원하면 import. 서비스 자유롭게 전환해도 규칙 불변.
- **동시 멀티에이전트 안전성** — `.agent/_coordination/` 의 STATE.md·HANDOFF.md·CHANGELOG.md 가 파일 편집 충돌 예방 + 모든 에이전트에게 실시간 작업 맵 제공.
- **리서치 기반 의사결정** — 중대 분기점(전략·기술·법무·시장)에서 Research → Report → Plan → Link 루프가 발동, URL 출처와 "출처 미확인" 정직 마커를 동반.

## 그냥 `CLAUDE.md` 쓰면 안 되나?

다음 중 하나라도 해당되면 시드가 제값을 하기 시작:

| 시나리오 | 단일 룰 파일 (CLAUDE.md, .cursor/rules, …) | EstreGenesis 패턴 |
|---|---|---|
| 2번째·3번째 AI 서비스 합류 | 파일별 룰 복제, 시간이 지나며 drift | 각 브릿지 파일이 `AGENTS.md` 를 가리킴 — SSoT 단일 유지 |
| 두 에이전트가 동시에 같은 파일 편집 | 코디네이션 레이어 없음, last write wins | `_coordination/HANDOFF.md` claim 원장 + 실시간 `STATE.md` |
| 지난주 3시간 디버그한 블로커 | 채팅 기록에 매몰, 다음 세션엔 사라짐 | `_lessons/` 항목, 다음 세션 시작 전 grep |
| 프로젝트에 이미 산발적 룰 파일들 | 수동 정리, 템플릿 없음 | 마이그레이션 A: 감사 → `AGENTS.md` 추출 → 브릿지 재작성 |
| 전략·기술·법무 결정 | 즉흥 채팅, 감사 가능한 trail 없음 | Research → Report → Plan → Link 루프, URL 출처 동반 |
| 시드 부트스트랩된 프로젝트, 신버전 출시 | 수동 diff + 적용 | 마이그레이션 B: 번호 delta 메뉴, 가산적 적용 |

해당사항 없으면 단일 룰 파일로 충분. 하나라도 해당하면 EstreGenesis가 제값을 하기 시작하고, 둘 이상이면 브릿지 + SSoT 패턴은 더 이상 옵션이 아님.

## bootstrap 너머 — Constellation (2.0)

v1.x 는 프로젝트 시드 — 신규 AI-Native 프로젝트 부트스트랩, 또는 기존 프로젝트를 `AGENTS.md` SSoT 로 마이그레이션 (위의 모든 내용). **v2.0 은 Constellation 하나를 선택적 모듈로 추가**: 멀티에이전트 코디네이션을 파일 기반 `.agent/_coordination/` 에서 실시간 라이브보드(WebSocket + A2A 메시징 + 대시보드)로 격상. **A2A 브릿지 인터페이스**가 불변 계약, 도입 깊이는 시드 티어 따라감.

Constellation 은 **참조 모듈**로 ship ([Constellation.md](Constellation.md) + [constellation/](constellation/)) — tier 시드는 lean 유지. 라이브보드 UI 컴포넌트는 `.eux` 로 작성해 **EstreUX** 로 brew — EstreUX 는 EstreGenesis 가 *참조*하는 별도 런타임이고 번들·소유하지 않음.

파일 기반 코디네이션(Phase 5)이 기본이고 대부분 프로젝트엔 충분; Constellation 은 라이브보드가 도움 되는 동시 멀티에이전트 운영용. 안 쓰면 v1.x 프로젝트 시드 그대로.

## 3-tier — 프로젝트당 하나 선택

| Tier | 크기 | 주 용도 | 대상 독자 |
|---|---|---|---|
| **Master** | ~2305줄 | 깊이 있는 가이드 필요한 신규 프로젝트, 패턴 처음 배우는 팀, 모든 인라인 템플릿 필요한 엣지 케이스 | 첫 AI Native 저자; 프로세스 공식화하는 팀 |
| **Lite** | ~1070줄 | 빠른 신규 프로젝트, 마이그레이션 세션, 기존 프로젝트에 새 AI 서비스 편입, 마스터가 컨텍스트 윈도우에 무거울 때 | 패턴 기억하는 복귀 저자; 대부분 프로젝트 |
| **Compact** | ~115줄 | 이미 패턴 알고 최소 시드 원하는 저자; 가장 타이트한 컨텍스트 윈도우; bullet 트리거만 | 체크리스트만 필요한 파워 유저 |

프로젝트에는 **tier 하나만** 배치. 세 개 다 넣지 않음. 존재하지 않는 tier 를 교차 참조하면 dead link 와 에이전트 혼란만 발생하므로, 각 tier 는 **self-contained** — 내부 완결, 다른 tier 로의 forward/backward 참조 없음.

프로젝트가 더 많은 깊이를 요구하게 되면 tier 를 in-place 업그레이드하지 않습니다. 파일을 다음 tier 로 교체하고 커밋. 에이전트가 일반 문서 업데이트로 처리합니다.

## 파일 목록

```
AI_Native_Project_Master_Seed_Prompt.md       ← 영문 마스터 (가장 깊음, ~2305줄)
AI_Native_Project_Seed_Prompt_Lite.md         ← 영문 lite (~1070줄)
AI_Native_Project_Seed_Prompt_Compact.md      ← 영문 compact (~115줄)
AI_Native_프로젝트_마스터_시드_프롬프트.md       ← 한국어 마스터
AI_Native_프로젝트_시드_프롬프트_Lite.md          ← 한국어 lite
AI_Native_프로젝트_시드_프롬프트_Compact.md       ← 한국어 compact
Constellation.md                               ← v2.0 모듈: 라이브 멀티에이전트 오케스트레이션 가이드 (WS + A2A)
constellation/                                 ← v2.0 모듈: 라이브보드 컴포넌트 러프 티어 .eux + README
README.md                                      ← 본 파일 (라이브러리 색인; 프로젝트에 배포하지 않음)
LICENSE.md                                     ← Apache License 2.0 전문
logo/EstreGenesis.png                          ← README 로고
```

각 tier 의 언어 페어(영문+한글)는 완전 정렬 — 동일한 phase, 동일한 마이그레이션 로직, 동일한 운영 가이드. 이중언어 팀이면 페어로 배치. **v2.0** 은 Constellation(라이브 멀티에이전트 오케스트레이션)을 참조 모듈로 추가; 라이브보드 컴포넌트는 EstreUX 런타임(참조, 비번들)으로 brew — changelog 참조.

## 마이그레이션 시나리오

신규 프로젝트는 위의 [60초 시작](#60초-시작) 참조. 기존 프로젝트 마이그레이션은 아래 경로 중 하나 선택 — 시나리오별 red flag·엣지 케이스는 § 마이그레이션 상세 참조.

### 마이그레이션 A — 기존 프로젝트, 공식 AI 협업 셋업 없음

1. **Lite** 파일을 프로젝트에 복사 (Lite 가 최고의 마이그레이션 산문 보유).
2. 첫 메시지로 붙여넣기.
3. 에이전트에게: *"이 프로젝트는 이미 존재 — 먼저 감사하고 마이그레이션 제안해주세요."*
4. 에이전트가 **마이그레이션 A** 모드 진입: 모든 `CLAUDE.md` / `.cursor/rules/` / 산발적 에이전트 노트 감사, 인벤토리 제시, 서비스 중립 규칙 추출해 새 `AGENTS.md` SSoT 제안.
5. 추출 내용 검토·승인, 에이전트가 브릿지 파일들이 `AGENTS.md` 를 가리키도록 재작성, `.agent/` 재조직, `.agent/_lessons/001_AI_Native_Migration.md` 에 마이그레이션 기록.

### 마이그레이션 B — 기존 프로젝트, 구 버전 시드로 부트스트랩됨

1. 현 버전 시드를 프로젝트에 복사 (이전과 동일 tier — 버전 마이그레이션 중 tier 업그레이드 금지).
2. 첫 메시지로 붙여넣기.
3. 에이전트에게: *"프로젝트가 구 버전 시드로 부트스트랩됨 — 가산적으로 업그레이드해주세요."*
4. 에이전트가 **마이그레이션 B** 모드 진입: 시작 버전 파악, 역량 차이 산출(리서치 루프 없음? 멀티에이전트 코디네이션 없음? 마이그레이션 가이드 자체가 없음?), 번호 delta 메뉴 제시.
5. 검토·선택 delta 승인, 에이전트가 가산적 적용 — 기존 사용자 커스터마이제이션 재작성 절대 금지.

### 마이그레이션 C — 하이브리드

일부는 시드 준수, 일부는 애드혹. 에이전트가 **마이그레이션 C** 실행: 서브시스템별로 A 또는 B 적절히 적용, 하이브리드 기원 문서화.

## 시드가 생성하는 것

Phase 7 (부트스트랩) 또는 마이그레이션 완료 후 기본 소스 repo 모양:

```
your-project/
├── AGENTS.md                          ← 모든 AI 서비스의 단일 진실 원천
├── .agent/
│   ├── seed_prompt.md                 ← 배치한 시드 파일 (에이전트가 재읽기 가능)
│   ├── rules.md                       ← 상세 작업 규칙
│   ├── architecture.md                ← 기술 스택·데이터 플로우·의존성
│   ├── _coordination/                 ← 멀티에이전트 워크스페이스 (해당 시)
│   │   ├── STATE.md                   ← 실시간 "누가 뭘 하는지"
│   │   ├── HANDOFF.md                 ← 파일 claim 원장
│   │   └── CHANGELOG.md               ← 완료 로그
│   ├── _contracts/                    ← 파트 간 API/Event/Type 계약
│   ├── _questions/                    ← 비동기 에이전트 간 Q&A
│   │   ├── open/
│   │   └── resolved/
│   ├── _lessons/                      ← 트러블슈팅 메모리
│   └── PM/                            ← 계획, 3자리 접두어
│       └── 001_Phase1_Plan.md
├── CLAUDE.md                          ← Claude Code 브릿지 (AGENTS.md 참조)
├── GEMINI.md                          ← Gemini 브릿지
├── .github/copilot-instructions.md    ← Copilot 브릿지
├── .cursor/rules/main.mdc             ← Cursor 브릿지
├── (Phase 4 선택에 따른 기타 브릿지)
├── docs/                              ← 개발자 런북 (선택)
├── executive-docs/                    ← 전략·법무 (선택, 대규모 프로젝트)
├── dashboard/                         ← 사용자 조치 백로그 (선택)
└── meetings/                          ← 회의 기록 (선택)
```

Phase 2.5 가 먼저 비기본 `<scope-root>` 를 선택할 수 있음: 일반 소스 repo 는 `.agent/` 직접, 다중 프로젝트 오케스트레이션은 `.agent/<unit-project-name>/`, upstream-bound 작업은 `<scope-root>/project/` + `<scope-root>/upstream/`. Sidecar 구성은 source-map/public-boundary 문서를 추가하고, 사용자가 workspace 내부 소스 폴더를 알려주며 에이전트가 존재를 확인한 뒤에만 `.gitignore` 에 등록.

나중에 합류하는 모든 AI 서비스는 `AGENTS.md` 를 읽고 즉시 생산성 확보. 서비스별 온보딩 없음, "잠깐, 여기 규칙이 뭐지?" 없음 — 모든 게 한 곳에.

## 운영 루프 (부트스트랩 이후)

매일 쓰는 에이전트와 나중에 합류하는 모든 에이전트가 따르는 8단계:

아래 목록은 기본 `.agent/` 경로 기준. Phase 2.5 에서 비기본 residency shape 를 선택했다면 `<scope-root>` 로 치환.

1. `AGENTS.md` 읽기 (SSoT)
2. `.agent/rules.md` + `.agent/architecture.md` 읽기
3. `.agent/_coordination/STATE.md` 읽기 (멀티에이전트 프로젝트만)
4. 현재 태스크 관련 태그로 `.agent/_lessons/` grep
5. 공유 파일 편집 전 `.agent/_coordination/HANDOFF.md` 에 claim
6. 블로커는 `.agent/_questions/open/` 에 기록
7. 완료는 `.agent/_coordination/CHANGELOG.md` 에 로그, STATE.md 에서 제거
8. 놀라움(>30분 조사)은 `.agent/_lessons/` 에 기록

이게 AI-native 프로젝트의 OS. 4·7·8 단계가 메모리. 3·5·6 단계가 코디네이션. 1·2 단계가 헌법.

## 지원 AI 서비스 (즉시 스캐폴딩 가능한 브릿지)

| 서비스 | 브릿지 파일 |
|---|---|
| Claude Code | `CLAUDE.md` + `.claude/rules/` |
| Google Antigravity / Gemini CLI | `GEMINI.md` |
| GitHub Copilot (VS Code agent) | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/main.mdc` |
| Windsurf | `.windsurfrules` |
| Aider | `.aider.conf.yml` + read list |
| Continue.dev | `.continue/config.yaml` |
| Cline | `.clinerules/main.md` |
| Amazon Q Developer | `.amazonq/rules/main.md` |
| Zed / 범용 | `.rules` |
| OpenAI Codex CLI / Jules / Kiro / 기타 | `AGENTS.md` 직접 참조 |

모든 브릿지는 해당 서비스를 `AGENTS.md` 로 돌려보내며(지원 도구는 import), 여기에 해당 도구 특화 설정만 더함. 서비스 전환은 no-op — SSoT 유지.

새 AI 서비스 출시 시 브릿지 파일 하나 추가. 규칙 시스템은 변경 불필요.

## 마이그레이션 상세 (고유 기여)

부트스트랩은 유용. 마이그레이션은 이 시드가 진가를 발휘하는 부분. 모든 tier 에 3개 시나리오 커버:

### 마이그레이션 A — 산발적 AI 파일 → `AGENTS.md` 표준

프로젝트에 143줄 규칙의 `CLAUDE.md`, 89줄 `.cursor/rules/`, 정리 안 된 `.agent/notes/decisions.md` 가 있고, 단일 진실 원천 없음. 에이전트가 먼저 인벤토리 감사(맹목적 스캐폴딩 금지) → 서비스 중립 규칙을 새 `AGENTS.md` 로 추출 → 각 기존 브릿지를 그로부터 import 하도록 재작성 → `.agent/` 를 표준 형태로 재조직 → 무엇이 어디로 이동했는지 `.agent/_lessons/001_AI_Native_Migration.md` 에 기록. 경고 신호(브릿지 간 규칙 충돌·`.agent/` 의 이전 git 이력·사용자가 유지하고 싶은 커스텀 coordination)는 에이전트를 중지시키고 사용자 명시적 결정을 요구.

### 마이그레이션 B — 이전 시드 버전 → 현 버전

프로젝트가 구 버전 시드로 부트스트랩됨(리서치 루프 없음·멀티에이전트 코디네이션 없음·마이그레이션 가이드 없음·Bootstrap Residency 확인 없음 등). 에이전트가 시작 버전 파악, 역량 차이 산출, 번호 delta 메뉴 제시. 사용자가 적용할 것 선택. 모든 추가에 `<!-- seed vX.Y 마이그레이션에서 추가, YYYY-MM-DD -->` 마커를 달아 향후 독자가 계보 추적 가능. **기존 사용자 커스터마이제이션 보존** — 마이그레이션 프로젝트에 Phase 0-7 인터뷰 재실행 절대 금지.

### 마이그레이션 C — 하이브리드

일부는 시드 준수, 일부는 애드혹 커스텀. 커스텀 파트는 A, 시드 준수 파트는 B, `AGENTS.md` 에서 결과 병합, 하이브리드 기원 문서화. 하이브리드 마이그레이션은 순수 A 또는 B 가 놓칠 **실제 비즈니스 로직**을 종종 드러냄 — 시드는 이를 성가신 일이 아닌 고가치 lessons 파일 기회로 취급.

## 설계 원칙

어렵게 얻은 6개 의견:

1. **코드 전에 문서, 반대 아님.** 모든 결정은 파일에 존재. 결정을 찾지 못하는 에이전트는 재발명함(종종 지난번과 다르게).
2. **하나의 SSoT(`AGENTS.md`), 다수의 브릿지.** 서비스 확산은 기정사실. 공통 규칙을 중앙화, 각 서비스는 자기 knobs 유지.
3. **`_lessons/` 를 통한 메모리 복리.** 30분 디버그 세션이 다음번엔 30초 grep 이 됨.
4. **코디네이션은 명시적, 암묵적 아님.** 멀티에이전트 프로젝트는 STATE/HANDOFF/CHANGELOG 필요. "그냥 충돌 안 나도록 서로 신뢰해" 는 2개 에이전트 이상에서 안 통함.
5. **중대 분기점은 리서치 기반 의사결정.** 애드혹 전략 결정은 프로젝트가 조용히 기술 부채를 복리로 쌓는 방법. Research → Report → Plan → Link 가 모든 중대 선택을 감사 가능한 trail 로 전환.
6. **repo residency 가 문서 모양보다 먼저.** 공개/협업 소스 repo, 개인 agent-docs repo, 다중 프로젝트 오케스트레이션, upstream-bound 작업은 파일 생성 전 서로 다른 `<scope-root>` 결정이 필요.

## 버전 관리

각 tier 는 자체 버전 보유. 마스터가 권위 있는 진화 트랙; Lite·Compact 는 정기적으로 마스터에서 파생되나 한 릴리스 지연될 수 있음. 변경 이력:

- **v1.0** (2026-04-18) — 초판 (마스터). Author의 두 번째 AI Native 프로젝트 기반.
- **v1.1** (2026-04-19) — Research → Report → Plan 루프 섹션 추가. 핵심 원칙 #7.
- **v1.2** (2026-04-20) — 마이그레이션 A/B/C 가이드 추가. 에이전트 지침 상단 Bootstrap/Migration 모드 분기. Lite·Compact tier 초판 릴리스.
- **v1.3** (2026-05-02) — 핵심 원칙 2개 추가: #8 (인덱스 ↔ 본문 동기화) · #9 (외부 인터페이스 N-way sync). 신설 섹션 6개: § 인덱스 동기화 정책 · § 외부 인터페이스 N-way sync · § 마크다운 `~` escape 정책 · § RAG 인덱스 최적화 · § 외부 전달용 빌드 파이프라인 · § 문서 인플레이션 방지 (부록 `<NN>b_*.md` 패턴). 3 tier 모두 업데이트; Lite·Compact 는 동일 패턴의 축약본 추가. 모든 추가는 Author의 두 번째 AI Native 프로젝트의 2026-04-21 → 2026-05-02 운영 실측 사례에서 추출: 외부 표면이 일주일 stale 상태로 누락됨 (N-way sync 정책 동기), 외부 송부용 PDF 의 마지막-순간 마크다운 취소선 오작동 (tilde escape 정책 동기), 다른 에이전트가 옛 인덱스로 작업 (인덱스 동기화 정책 동기), Claude 프로젝트 워크스페이스의 파일 용량 100% 도달 (RAG 친화 인덱스 규칙 동기).
- **v1.3.1** (2026-05-02) — 자기 완결 툴링: 마스터 시드 § 파일 템플릿이 외부 송부용 툴체인 전체 inline 스크립트를 내장 — 시드만 가지고 전체 부트스트랩 가능. 신설 템플릿: `scripts/escape-md-tildes.mjs` (의존 없는 Node ≥18, idempotent, placeholder 보호 알고리즘), `scripts/build-md-to-html.mjs` (`marked` 기반 MD → A4 HTML + h2 page-break + 프로젝트 언어 폰트 스택), 편의 wrapper `scripts/build-pdf.ps1` (Windows) / `scripts/build-pdf.sh` (macOS/Linux) — 3 단계 `escape → HTML → Chrome --print-to-pdf` 파이프라인 chain. § 마크다운 `~` escape 정책에 "알고리즘" 서브섹션 추가 (placeholder 보호가 *왜* 필수인지 — 순진한 regex 의 함정). § 외부 전달용 빌드 파이프라인에 "왜 이 도구들인가" 서브섹션 (`marked` vs Puppeteer trade-off, A4 page rules) + macOS/Linux Chrome 등가물. Lite·Compact tier 의 § 마크다운 `~` escape (축약) 에 placeholder 알고리즘 요약과 크로스플랫폼 PDF 파이프라인 보강; 마스터 시드가 inline 스크립트의 단일 진실 원천 유지.
- **v1.3.2** (2026-05-02) — `.gitignore` 템플릿 + cross-tier 정합성 감사. **`.gitignore`**: 마스터 시드 § 파일 템플릿이 inline 템플릿 내장 — Common (OS, IDE, env, 로그) + Node / Python / Go / Rust / JVM / C-C++ / Mobile / DB 스택별 행 + 시드 산출물 블록 (`.generated.` infix 컨벤션 사용 — 빌드 산출물만 정확히 휩쓸고 수공 첨부는 보호). **Cross-tier 정합성 감사**: README 의 stated 원칙 ("각 tier 는 self-contained — 다른 tier 로의 forward/backward 참조 없음") 이 v1.0 부터 위반돼 왔고, v1.3.1 릴리스가 cross-tier 참조를 더 추가해 악화. v1.3.2 가 **Lite** 와 **Compact** tier 를 원칙 준수로 정상화 — 모든 "→ 마스터 시드 § ..." cross-reference 제거. Lite 는 909 / 912 줄 (한국어 / 영문) 에서 신설 § 파일 템플릿이 inline AGENTS.md, `.agent/rules.md`, `.gitignore` (Common + Phase 2 스택 + 시드 산출물), `scripts/escape-md-tildes.mjs` (압축 Node ≥18), `scripts/build-md-to-html.mjs` (압축 `marked` + A4 CSS), 11 종 지원 AI 서비스 브릿지 stub 모두 내장. Compact 는 119 줄/언어 에서 신설 § 스캐폴드 spec 가 각 스캐폴드 대상에 알고리즘-spec 묘사 — 에이전트가 spec 읽고 실제 파일 생성. 3 tier 모두 README 가 처음부터 약속해 온 *프로젝트 repo 에 독립 ship* 이제 준수.
- **v1.3.4** (2026-05-03) — 강제 훅 아키텍처 추가. Master 는 Layer 1 Claude Code `PreToolUse` + Layer 2 `git pre-commit` 2중 방어, 단일 regex SSoT `scripts/hooks/_patterns.mjs`, `.git/hooks/pre-commit` shim 및 `.claude/settings.local.json` 병합 installer, 경로 매칭·Bash 따옴표/HEREDOC false-positive 회피·테스트·cross-AI 적용 범위를 전체 섹션으로 설명. Lite 는 축약 섹션, Compact 는 원칙 #10 과 동기화 규칙 bullet 추가.
- **v1.3.5** (2026-05-03) — 작업 분해 전략 추가. 분해 경로가 여러 개인 복잡 작업에서 에이전트가 선택한 진행 형태를 announce 하고, 판단/관성에 따라 확인 대기 없이 진행하며, 사용자 피벗을 즉시 반영하는 cross-AI 행동 패턴을 추가. Master 는 임계값·관성 우선순위·AI 별 도구 매핑·안티패턴을 포함하고, Lite·Compact 는 축약 형태로 반영.
- **v1.3.6** (2026-05-03) — 인덱스 ↔ 본문 동기화에 외부 지식 인덱스 자동 동기화 추가. 프로젝트가 Claude 메모리·Notion·wiki·RAG 메타데이터 같은 외부 KB 에 구조화 폴더를 미러링하면, pre-commit 이 전용 sync 스크립트로 메커니컬 구조(카운트·stub·번호·orphan 경고)를 자동 갱신하고 의미 콘텐츠는 사람 큐레이션으로 유지. Master 는 전체 subsection, Lite·Compact 는 축약 절 반영.
- **v1.3.7** (2026-05-03) — Phase 0 이 작업 언어 다음에 에이전트 응답 말투를 선택하도록 확장. 한국어 프롬프트는 `~니다`, `~에요/예요/어요`, `~음/슴/임`, 친구/동료 말투, 직설 도전 말투, 직접 방향성 프롬프트 6가지를 제시하고, 영문 프롬프트는 이에 부합하는 tone 옵션을 제공. 기본값은 사용자가 대화를 건 톤과 동일하거나 한 단계 공손하게. 생성되는 `AGENTS.md`, `.agent/rules.md`, 브릿지 stub 이 언어와 말투를 분리 기록.
- **v1.4.0** (2026-05-03) — 문서 제목 전반에 EstreGenesis 정식 네이밍 적용, 소스 프로젝트 참조 공개용 익명화, public repo 공개. 콘텐츠 베이스: legacy private archive, commit `5944a50` (v1.3.6, 2026-05-03).
- **v1.4.1** (2026-05-06) — 메타데이터 정합화. v1.3.6 → v1.4.0 흡수 과정에서 Master tier (KO/EN) 의 마이그레이션 B delta 표에 v1.3.4 (강제 훅 아키텍처) · v1.3.5 (작업 분해 전략) · v1.3.6 (외부 지식 인덱스 자동 동기화) 행이 누락 — 다른 4 tier 는 정상 보유. v1.4.0 콘텐츠는 그대로 유지하고 누락된 3 행만 보강해 6-tier sync 복원. Master 의 Phase 7 § 파일 스캐폴딩 체크리스트에 옵션 `scripts/hooks/` 블록 명시 (강제 훅 아키텍처는 절대 규칙 강제가 필요한 프로젝트의 opt-in). README v1.4.0 항목에 legacy archive SHA 박제 추가.
- **v1.5.0** (2026-05-07) — 6개 시드 파일 전체에 Bootstrap Residency 추가. 새 Phase 2.5 가 `<scope-root>` 선택 전 작업공간이 소스 repo, 개인 agent-docs sidecar, 다중 프로젝트 오케스트레이션 repo, upstream/local split 중 무엇인지 결정. Minimal, Full manual, repo-provider assisted bootstrap 지원 (GitHub, GitLab, Bitbucket, Azure DevOps, Gitea, Forgejo, self-hosted/local remotes, 사용자 제공 repo 목록), workspace-limited agent 안내, upstream 폴더 기본값 `upstream/` 및 사용자 지정명 허용, sidecar 소스 폴더 `.gitignore` 등록은 사용자 식별 + 에이전트 확인 후로 제한. Master 는 트리거 조건이 있는 Adoption Catalog 를 추가하고 Lite·Compact 는 축약 반영.
- **v1.5.1** (2026-05-08) — 적용 프로젝트 피드백 기반 패치 릴리스. 6개 시드 헤더 모두에서 changelog 포인터가 시드를 복사한 대상 프로젝트의 README.md가 아니라 **upstream EstreGenesis repository README.md** 를 뜻한다고 명시. KO Master 는 v1.5.0 흡수 잔여 결함도 보정: Phase 0·Phase 4 마무리 줄을 Phase 7로 정정, 신규 Phase 2.5 sub-heading 한국어화, Adoption Catalog 제목/표 헤더 한국어화.
- **v1.6.0** (2026-05-09) — Agent-time vs human-time 추정. AI 에이전트가 인간 dev 팀 baseline 으로 추정하면 plan 이 5\~10× 부풀어 calendar mismatch 발생하고 PM 템플릿이 현실을 잘못 묘사. Phase 0 가 언어·말투 다음에 한 가지 더 묻도록 확장 — **실행 페이스 모드**: Cautious 2\~4× (무료 티어 또는 Continue.dev·로컬 모델 사용 Aider 같은 로컬 LLM, 출력 토큰/초 기준 추가 보정), Proactive 5\~6× (유료 플랜 기본값), Burst 6\~8× (고처리량 플랜), Sprint 9\~10× (사실상 무제한 토큰, 최대 병렬화). 각 모드 안에서 작업 유형이 위치 조정 — 실행 중심은 상단, 디버깅은 중간, 연구·전략은 인간 검토가 율속이라 모드 무관 ~1×. 모든 duration 추정은 **agent active time** 과 **human review / approval time** 분리 + handoff 갭 흡수하는 **calendar window**. 모드는 프로젝트 단위지만 진행 중 전환 가능 ("switch to sprint" / "drop to cautious") — 활성 PM 추정치 재산정 + CHANGELOG 기록 자동. `.agent/_lessons/` 자가 보정: ±30% 초과 delta 만 `estimation` 태그로 기록, 같은 모드에서 3개+ 누적 시 보정 multiplier 제안. Master 는 핵심 원칙 #11 + § Agent-Time 추정 정책 섹션 풀버전 (2축 프레임워크, 모드 전환 프로토콜, 자가 보정 루프, 안티패턴, cross-AI 적용성). Lite 는 원칙 #8 + 축약 정책 섹션. Compact 는 원칙 #13 인라인. PM 템플릿은 모든 tier 에서 split-time 형식으로 갱신. AGENTS.md 핵심 규칙 라인 1 이 언어 + 말투 + 페이스 모드 함께 기록.
- **v2.0.0** (2026-05-27) — **Constellation** 추가 (핵심원칙 #12 / Lite #9 / Compact #14), 선택적 모듈 하나. 멀티에이전트 코디네이션을 파일 기반 `.agent/_coordination/` 에서 실시간 라이브보드(WebSocket + A2A 메시징 + 대시보드)로 격상. **A2A 브릿지 인터페이스** (role board/main/local/upstream/collab · 핸드셰이크 · 메시징 · turn 기반 브릿지 데몬 + self-wake watcher 런타임 패턴) 가 불변 계약; 도입 깊이는 시드 티어 따라감. 별도 `Constellation.md` 가이드 + `constellation/*.eux` 컴포넌트 spec (`gateway-client.eux` = 디테일 티어 A2A 어댑터 포함) 으로 ship, tier 시드는 raw GitHub URL 로 참조해 lean 유지. 라이브보드 UI 컴포넌트는 `.eux` 로 작성해 **EstreUX** 로 brew — EstreUX 는 EstreGenesis 가 *참조*하는 별도 런타임(번들·소유 X); EstreGenesis 는 EUX 포맷을 소유·교육하지 않음 — EUX 는 Constellation 의 빌드타임 의존이지 시드의 레이어가 아님. 파일 기반 코디네이션(Phase 5)이 기본. 이전 v1.6.0 상태는 `1.x` 브랜치 보존; 2.0 은 `main`. Constellation 은 공개 EstreGenesis Claude 플러그인으로 성숙해 감.

이 upstream repository README가 changelog SSoT. 각 시드 파일은 tier, 언어, 현재 버전, counterpart, 그리고 대상 프로젝트의 README.md가 아닌 upstream EstreGenesis repository README.md 포인터만 담은 짧은 헤더 메타데이터를 유지. 마이그레이션 B 로 프로젝트 업그레이드 시 에이전트는 시드 헤더의 버전 마커와 본 changelog 로 delta 를 계산.

## 기여

시드는 살아있는 아티팩트. 프로젝트에서 운영하다가 발견하면:

- **부트스트랩 인터뷰가 물어야 하는데 안 물어보는 질문** → 해당 Phase 확장.
- 항상 "skip" 답 받는 **불필요한 질문** → 제거.
- 브릿지 템플릿 없는 **새 AI 서비스** → Phase 4 + 브릿지 템플릿에 추가.
- 아직 포착 안 된 **실전 검증 멀티에이전트 팁** → 마스터의 Multi-Agent Coordination Tips 확장.
- 리서치 기반 의사결정 루프의 **반례** → 안티패턴 / 자가 감사 체크리스트 확장.
- 새 **마이그레이션 엣지 케이스** → § 마이그레이션 가이드에 새 시나리오 또는 경고 신호 추가.

마스터 변경은 Lite·Compact 로 증류 형태로 흘러내림. 본질적 콘텐츠는 마스터만 편집, Lite·Compact 는 동일 재료의 타이트한 뷰.

## 라이선스

Copyright 2026 SoliEstre (Estre Soliette).

시드 프롬프트는 **Apache License 2.0** 하에 제공됨. [LICENSE.md](LICENSE.md)의 조건에 따라 복사·수정·재배포 가능. 내재화된 패턴(문서 레이어 분리, `AGENTS.md` 통한 SSoT, `.agent/_lessons/` 메모리 루프, 마이그레이션 A/B/C 시나리오)은 **오픈 표준** 의도 — 자기 스택에 맞게 각색, 개선 사항 다시 기여.

각 AI 서비스의 특정 브릿지 파일 포맷은 해당 서비스 자체 규약 따름. 본 시드는 개별 브릿지 포맷에 대한 권위 주장 없음 — 오직 그것들을 상호 운용하게 만드는 통합 패턴에 대해서만.

## 크레딧

Author의 두 번째 AI Native 프로젝트를 멀티에이전트(Antigravity·Claude Code·GitHub Copilot)로 집중 운용하며 추려낸 패턴. 시드의 모든 `_lessons/` 항목은 실제 시간을 소비한 실제 블로커에서 유래. 모든 마이그레이션 경고 신호는 실제 실수에서 왔음.

이 시드가 같은 실수를 막아주면 좋고, *다른* 실수를 만들어 *새* 교훈을 기여한다면 더 좋음.

## 관련 읽을거리

- **AGENTS.md 표준** — Claude·Codex CLI·Jules·Kiro 등 AI 코딩 에이전트의 수렴 패턴. 커뮤니티 유지 스펙이 나오면 `https://agents.md` 참조; 그전까지는 본 시드의 모든 tier 가 패턴 구현.
- **Model Context Protocol (MCP)** — Anthropic 의 AI 툴 통합 오픈 표준. AI 에이전트가 프로젝트 코드를 편집하는 것이 아니라 프로젝트 *위에서 행동*하길 원할 때 관련. 본 시드 범위 밖.
- **Claude Agent Skills** — Anthropic 의 스킬 패키징 포맷. 시드 부트스트랩된 프로젝트는 선택적으로 `skills/<project>/SKILL.md` 을 Claude 직접 통합용으로 배포 가능.

생태계 접점이지 시드 전제조건 아님. 시드는 이들과 독립적으로 작동.
