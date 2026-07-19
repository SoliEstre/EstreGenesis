<p align="center">
  <img src="logo/EstreGenesis.png" alt="EstreGenesis logo" width="472" height="384" />
</p>

<p align="center">
  <img alt="Version: v2.5.161" src="https://img.shields.io/badge/version-v2.5.161-2ea44f?style=for-the-badge" />
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

**On Claude Code — one command.** Install the kit plugin and let it fetch the right seed for you:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins

/egboot     # new project      (long name: /eg-bootstrap)
/egmig      # existing project (long name: /eg-migration)
/egup       # already seeded — upgrade seed + plugins (long name: /eg-upgrade)
/egmem      # reconcile agent memory ↔ project docs (long name: /eg-memsync)
/egrich     # full arm: seed + all six modules, wired and verified
```

The skill picks the tier, fetches the seed, installs it as `.agent/seed_prompt.md`, and runs it — no hunting for a raw URL, no copy-paste. Pick the wrong one and it routes you to the right one.

**On any other agent — the manual path (still 60 seconds).**

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

## Beyond bootstrap — six optional modules

v1.x is the project seed — bootstrap a new AI-native project, or migrate an existing one, into the `AGENTS.md` SSoT (everything above). **v2.0+ adds six optional modules** layered on top:

- **[Constellation](Constellation.md)** (v2.0+) — live multi-agent orchestration. Graduates coordination from the file-based `.agent/_coordination/` ledger to a real-time live board (WebSocket + A2A messaging + dashboard). The **A2A bridge interface** is the invariant contract; reference runtime under [constellation/reference/](constellation/reference/) is Node deps-0 except `ws`. Components authored as `.eux` and brewed with **[EstreUX](https://github.com/SoliEstre/EstreUX)** — a separate Apache-2.0 runtime EG references (clone-and-run), not bundles or owns.

- **[Superscalar](Superscalar.md)** (v2.3+) — execution-scheduling discipline for parallel sub-agent dispatch. Five-dimension `issue_width` formula (effort_band + pace_mode + Little's Law + Kanban WIP + autonomy_available_workers) + cost-benefit-gated dispatch at the 30–60k token-horizon crossover + worktree-isolated reorder buffer + in-order retire + consistency gate + opt-in speculation. Production-ready (Stage 1 ships). n=8 dogfood ledger + Entry 06 controlled A/B showing "parallelism is not sufficient; orchestration discipline produces consistency."

- **[Hyperbrief](Hyperbrief.md)** (v2.3.20+) — decision-delegation gating discipline. Every user-facing decision question runs through a trigger rubric; if it escalates, the LLM emits a schema-enforced JSON IR and a deterministic Node renderer produces a 9-section Markdown brief + interactive HTML card. 4-axis × 5-level tone profile + skill-side auto-localize (button label + MD trigger phrases follow the user's prevailing conversation language). Cross-module integrations active: Constellation §13.16.9 (5 A2A intent names + ack_tier='decided') + Superscalar §3.1 (orthogonal gate at write/deploy/send lane retire). §11.5 v1.0 readiness rubric (Lens A 7-dim module-wide GA / Lens B 6-dim host-specific marketplace registration) shipped.

- **[Greatpractice](Greatpractice.md)** (v2.5.50+, v2.5.55 release-cadence ratified) — memory-triggered practice-codification discipline. Targets the &quot;quiet omission&quot; failure surface: small obligations that should accompany the work — &quot;update the docs alongside the code,&quot; &quot;check before sending,&quot; &quot;when X changes, also change Y&quot; — that usually start as memory notes and gradually slip through as those notes accumulate. Greatpractice treats agent-workspace memory feedback (`memory/feedback_*.md` or equivalent) as the input trigger and routes raw signals through a 5-axis multi-criteria maturation gate (frequency + depth + recency + cost + predictability weighted sum, threshold ≥ 18 OR 3-criterion notability) into a 3-tier macro/mezzo/micro hierarchy. Ratified entries are enforced via deterministic lifecycle hooks (SessionStart blocking / UserPromptSubmit path-scoped inject / PreToolUse 3-subtype poka-yoke contact/fixed-value/motion-step / PostToolUse SSoT propagation / Stop cycle-end probe / PostCompact working-set restore). Explicit `phronesis_boundary` field carves out judgement-heavy work that should NOT be codified. Backed by 9-axis cross-domain deep research (harness · humanities · psychology · management · processor · os · sre · memoization · canonical). v2.5.55 dual cut promotes the [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) entry from `_propose/draft` to ratified (user steering trigger at N=1 evidence; mezzo decomposition 8-candidate batch scheduled v2.5.56+).

- **[Ultrasafe](Ultrasafe.md)** (v2.5.55+) — pre-release / pre-update simulated penetration testing discipline. Targets the &quot;ship-then-discover&quot; failure surface: security problems found by external users after release rather than by internal verification before. Ultrasafe ships every release through a Superscalar-applied Workflow where 8 parallel red-team agents (v0.1.0 minimum fan-out — AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer + GTA/DSP cross-cutting) simulated-attack from independent perspectives, emit findings via the Finding Output Contract (§4 of the spec), aggregate at the Synthesizer with BFT 2f+1 quorum + cross-axis correlation, and produce a 3-layer report (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate). The ≥3 iteration loop runs until 4-condition AND clean signal: regression-free + monotonic improvement + coverage gate + 2 iter consecutive with agent diversity invariant. Dual pre-release trigger (PreToolUse hook on `git push --tags` / `npm publish` / `gh release` / etc. 7 matchers + `/ultrasafe` skill). 5 new Constellation A2A intents (`ULTRASAFE_FINDING` / `ITERATION_BOUNDARY` / `RELEASE_GATE` / `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION`). **Advisory-only v0.1.x → blocking v0.2.x** staged transition (Tier 3 release strict / Tier 1/2 opt-in). Backed by 17-axis cross-domain deep research (harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution). v0.1.0 first cut ships the full spec (2544 lines, §1-§13 + appendix A-C) + plugin manifest; runtime (attack agent dispatch / iteration loop runner / 3-layer report generator / 5 A2A intent handlers / PreToolUse hooks / MCP server) deferred to v0.2+ roadmap.

- **[Compendium](Compendium.md)** (v0.2.6) — a **portable discipline layer over whatever markdown vault you already use**: one definition per concept, carried in two registers (plain + expert), pointing at the spec that owns it instead of copying it. That last property is the wedge — a Compendium entry cannot drift from its source, because it never restates it. It reifies the north-star's second axis (concept/vocabulary survival over code survival — the layer most likely to outlive any single runtime implementation). Shipped: the content store, gardening lints (broken pointer / orphan / duplicate concept / stale), an 8-tool MCP server, two cross-tool skills (`compendium-curate` / `compendium-lint`) that any agent can read, and a vault projection so the store opens in Obsidian-class apps with its link graph intact.

All six modules are **optional** and **referenced** (not bundled into the seed tiers, so the tier seeds stay lean). File-based coordination (Phase 5) remains the default and is enough for most projects.

### Install as Claude Code plugins (self-hosted marketplace)

The same six modules also ship as Claude Code plugins via a **self-hosted marketplace** in this repo. From any Claude Code session:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins
/plugin install constellation@estregenesis-plugins
/plugin install superscalar@estregenesis-plugins
/plugin install hyperbrief@estregenesis-plugins
/plugin install greatpractice@estregenesis-plugins
/plugin install ultrasafe@estregenesis-plugins
/plugin install compendium@estregenesis-plugins
```

Seven plugins: the **estregenesis** kit (the seed itself, as `/egboot` · `/egmig` · `/egup` · `/egmem` · `/egrich`) plus the six modules. Each is independent — install one, some, or all of them. The marketplace metadata lives at [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json); each plugin's source is under [plugins/](plugins/). Apache-2.0. Current: estregenesis v0.2.1 (5 procedures + 4 pointer aliases, 0 deps); Constellation v0.3.26 (+ 5-tool MCP server, 8 skills incl. `/boardsweep`, Stop hook); Superscalar v0.1.2 (+ §3.1 Hyperbrief interlock); Hyperbrief v0.7.1 (+ 3 skills, 4-tool MCP server, PreToolUse/Stop hooks); Greatpractice v0.3.4 (+ `/routinize`, 3 JSON schemas, 1 contact hook); Ultrasafe v0.2.4 (+ 8-agent red-team fan-out, clean-signal gate — advisory, never blocks a publish); Compendium v0.2.6 (+ 8-tool MCP server, gardening lint, 2 cross-tool skills). Anthropic-side community-marketplace listing is deferred to v1.0 GA per [Hyperbrief.md §11.5](Hyperbrief.md) readiness rubric Lens B.

---

## Three tiers — pick one per project

| Tier | Size | Primary use | Target reader |
|---|---|---|---|
| **Master** | ~2425 lines | New projects that need deep guidance, teams learning the pattern for the first time, edge cases where you need every inline template (full AGENTS.md + `.gitignore` per-stack rows + escape/HTML/PDF scripts + bridge templates) | First-time AI Native author; teams formalizing a process |
| **Lite** | ~1105 lines | Quick new projects, migration sessions, onboarding new AI services into existing projects, when the master would eat too much context window. Self-contained — embeds inline templates for AGENTS.md, `.agent/rules.md`, `.gitignore`, scripts, and bridge stubs in compressed form | Returning author who remembers the pattern; most projects |
| **Compact** | ~130 lines | Authors who already know the pattern and want the minimum viable seed; tightest context window; bullet triggers + algorithm-spec descriptions only (the agent generates the actual files following the specs) | Power user who just needs a checklist |

You place **one tier** into your project. Not all three. Cross-referencing tiers that aren't present produces dead links and agent confusion, so each tier is **self-contained** — internally complete, no forward or backward references to other tiers.

When a project grows to need more detail, you don't upgrade tiers in-place. You simply replace the file with the next tier and commit. Agents treat it as a normal doc update.

---

## File list

```
AI_Native_Project_Master_Seed_Prompt.md       ← English master (deepest, ~2425 lines)
AI_Native_Project_Seed_Prompt_Lite.md         ← English lite (~1105 lines, self-contained)
AI_Native_Project_Seed_Prompt_Compact.md      ← English compact (~130 lines, self-contained)
AI_Native_프로젝트_마스터_시드_프롬프트.md       ← Korean master
AI_Native_프로젝트_시드_프롬프트_Lite.md          ← Korean lite
AI_Native_프로젝트_시드_프롬프트_Compact.md       ← Korean compact
Constellation.md                               ← v2.0+ module: live multi-agent orchestration guide (WS + A2A)
constellation/                                 ← v2.0+ module: .eux specs + reference runtime (server / bridge / watcher / watchdog / dashboard)
Superscalar.md                                 ← v2.3+ module: parallel sub-agent execution-scheduling discipline
Hyperbrief.md                                  ← v2.3.20+ module: decision-delegation gating discipline (JSON IR + deterministic renderer)
plugins/                                       ← Claude Code plugins (constellation / superscalar / hyperbrief) for the self-hosted marketplace
.claude-plugin/marketplace.json                ← Self-hosted Claude plugin marketplace metadata (estregenesis-plugins)
README.md                                      ← This file (library index; don't ship to projects)
LICENSE.md                                     ← Apache License 2.0 text
logo/EstreGenesis.png                          ← README logo
```

Each language pair (English + Korean) of a given tier is fully aligned — same phases, same migration logic, same operational guidance. Pair them if your team is bilingual. **v2.0+** adds six optional referenced modules (Constellation + Superscalar + Hyperbrief + Greatpractice + Ultrasafe + Compendium), each also shipped as a Claude Code plugin via the self-hosted marketplace — see the changelog.

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
| OpenAI Codex CLI | Full adapter included (`codex/`): `node codex/gen-codex-adapter.cjs --install` projects all plugin skills into Codex's discovery path, `config.toml.example` registers the 4 MCP servers, and `codex/AGENTS.md` maps each lifecycle hook to a documented manual routine |
| Jules / Kiro / Kimi Code / others | Read `AGENTS.md` directly (Kimi Code treats `AGENTS.md` as its first-class instruction file — its own `/init` generates one) |

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

Each tier has its own version. Master is the authoritative evolution track; Lite and Compact are derived regularly from Master but may lag by a release.

**Current**: v2.5.175 (2026-07-19) — **onboarding flows (Constellation v2.4.70, TC2)** — §13.32: direct-server vs peer-join (ownership rubric) + port auto-avoidance contract + loopback-first security ordering. verify-nway 20-axis PASS.

Previously: v2.5.169 (2026-07-19) — **indicator-toggle micro placement (Constellation v2.4.65)** — the prompt-row toggle moves between attach and pause with a 🧵 prefix and 112px fixed width, browser-verified. verify-nway 20-axis PASS.

Previously: v2.5.168 (2026-07-19) — **activity-monitor UX + noise refinement (Constellation v2.4.64)** — the toggle fab drops to the realtime-fab layer (no longer floats over the pane), a fixed-width `Wn/n Sn` indicator toggle joins the prompt-row's left edge (live-verified `W2/2 S1`), and the 15-second snapshot events are excluded from Web Push and the worker's pending classifier — the measured worker-turn cascade is stopped. verify-nway 20-axis PASS.

Previously: v2.5.167 (2026-07-19) — **the inspector becomes an agent-activity monitor (Constellation v2.4.63)** — a SubagentStatus section (standalone subagents, 10-minute activity window measured off a 6-minute tool-call flush gap), a fixed 🧵 fab toggling the layer with an overview mode, and real theme-token styling so the window follows light/dark (the old styling was pinned to dark fallbacks of nonexistent variables). E2E incl. live data from a real running delegation + theme flip measurement. verify-nway 20-axis PASS.

Previously: v2.5.166 (2026-07-19) — **inspector XSS hotfix (Constellation v2.4.62)** — the post-push security review caught same-day that the new floating inspector rendered wire-derived WorkflowStatus values through an innerHTML helper (§8.1 violation, injectable by any connected agent); all wire-derived strings are now textContent-only with a whitelisted state class, regression-proven in a real browser (malicious payloads in every field → escaped text, zero execution), deployed live before the cut. verify-nway 20-axis PASS.

Previously: v2.5.165 (2026-07-19) — **workflow runs become board-visible — mirror + floating inspector (Constellation v2.4.61)** — a deployment watcher mirrors multi-agent workflow runs onto the agent's channel (coalesced 🧵 STEP lines + a throttled WorkflowStatus snapshot), and clicking a 🧵 row opens a floating inspector (drag · resize · auto-height · collapse · close) live-rendering phases, per-agent states, tokens and duration; history replay keeps completed runs inspectable. Measured, not assumed: the run-state file is completion-time-only, so live progress reads the run journal. Live E2E on a real run + zero console errors. verify-nway 20-axis PASS.

Previously: v2.5.164 (2026-07-19) — **history timestamps stop jumping to "now" (Constellation v2.4.60)** — 68 rows carried real send times as ISO strings and number-assuming consumers (dashboard epoch parser, boot sort's `timestamp||0`) degraded them to the current time on every refresh; `wsNormTs` now coerces at the store/load boundary (string→epoch, absent→receipt time) and the dashboard accepts string timestamps — real send times restored, no inference. Live-verified 68→0 after one restart. verify-nway 20-axis PASS.

Previously: v2.5.163 (2026-07-19) — **disconnected channels keep their group + sweep cadence (Constellation v2.4.59, plugin v0.3.30)** — the server now persists each channel's HELLO-time role and cold/archived stubs carry it, so upstream/collab/peer agents no longer fall into the local group when disconnected (key-shape fallback kept for older servers). Plus §13.31.4-⑥: the retrospective sweep runs work-denominated — session resume (quick) · ~5 cuts or 7 days (full) · the idle signature on resident boards (silence plus ongoing work; §13.27.4 standing idle duty) · post-history-ops — with /boardsweep's matching "When to sweep" section. verify-nway 20-axis PASS.

Previously: v2.5.162 (2026-07-19) — **echo-mode defaults get wired — provenance seeding + state announce + echo badge (Constellation v2.4.58)** — §13.26.3's join-provenance default existed only as prose; now the agent-spawned join path seeds absent agents as `{level:'on', provenance:'agent-spawned'}` (explicit toggles never overwritten), (re)announces `EchoModeState` on every connect (untargeted, commitment-ack-free), and the dashboard badges echoing agents per tab (on / mirror). The constellation docs page gains its 9-skill roster line. verify-nway 20-axis PASS (new tag-continuity axis, born from the board sweep that restored the lost v2.5.64/65 tags).

Previously: v2.5.161 (2026-07-18) — **/subscaler ships — tiered model composition as a Superscalar toggle (Superscalar v0.6.0, plugin v0.2.0)** — frontier main delegates execution-shaped work to the strongest execution-tier subagent (Fable→Opus / Sol→Terra, effort high); §5.1 carries the delegation rubric (spec-complete work delegates, judgment stays, every lane gets acceptance criteria + a test gate), per-harness surfaces with the silent-fallback warning, and single-marker toggle state. Default OFF, ON for fan-outs — where the shared cache is already forfeited. Built on the 91-source verified research pass. verify-nway 19-axis PASS.

Previously: v2.5.160 (2026-07-18) — **Kimi Code named in the coverage table (doc-only)** — measured: Kimi Code CLI treats a project-root `AGENTS.md` as its first-class instruction file (its own `/init` generates one), so EG's core layer was already covered by the fallback row — now named there with that note (EN + KO ×3). Its skills+MCP+hooks stack makes it a stronger adapter-contract Stage 1 candidate than Codex — recorded for the queue, not shipped. Seed untouched. verify-nway 19-axis PASS.

Previously: v2.5.159 (2026-07-18) — **room artifacts + the board state schema becomes canon (Constellation v2.4.57, plugin v0.3.29)** — rooms get their three pinned artifacts server-side (header · append-only decision ledger · running summary with `covers_until`) with fetch/write contracts (`RequestRoomArtifacts` / `RoomArtifactsUpdate`, delta broadcast under an ack-by-reference version), a collapsible 📌 dashboard block, and a scribe digest duty; §13.31 (new) makes the board data contract canonical — `current[].stages {label, status: pending|active|done}` plus a usage discipline and charter/sweep/skill hooks — after a renderer-code-only contract proved silently fragile. Smoke 22/22, verify-nway 19-axis PASS.

Previously: v2.5.158 (2026-07-18) — **boardsweep learns the consumer axis (constellation plugin v0.3.28)** — an adopter-measured defect class: a stage list written as `{name,state}` against a `{label,status}` renderer survived two sweeps rendering all-PENDING, because the sweep checked repo facts but not the contract the consumer reads. Schema normalization now checks field keys/value domains against the consumer contract — render fallbacks silently swallow exactly this class. verify-nway 19-axis PASS.

Previously: v2.5.157 (2026-07-18) — **the third adapter gets its name: Estrelle backlink** — [Estrelle](https://github.com/SoliEstre/Estrelle) (self-hosted personal-AI OS, vision names EG as its agent harness) went live; the Harness Adapter Contract's planned-third-adapter rows now carry the name and the mutual entry-point link. Contract-first followed through. verify-nway 19-axis PASS.

Previously: v2.5.156 (2026-07-18) — **the contract pair: Harness Adapter Contract v0.1 + the loop contract (§13.27.4)** — the spec-first half of the personal-AI-environment harness track: `plugins/HARNESS-ADAPTER-CONTRACT.md` promotes the Codex adapter's practice to a written agreement (source-of-truth assumptions · projection-surface table · declared-never-silent degradation · generator/verification duties · conformance Stages 1-3), and §13.27.4 restates the headless loop as five implementation-independent elements (wake sources · at-least-once cursor · versioned charter · tier routing with a capability floor · supervisor-owned safety). Deliberate partition: *when the agent runs* (loop) vs *what it runs with* (adapter) — a host implementing both runs EG disciplines unattended on its own loop, local models included. verify-nway 19-axis PASS.

Previously: v2.5.155 (2026-07-17) — **Constellation v2.4.55 — roundtable dashboard entry (R3) + peer-review incorporation** — the room becomes operable from the board: a **"➕ 라운드테이블…"** entry on the prompt-target selector opens the creation dialog (topic · participant multi-select · persistent/temporary · advanced guard-budget overrides), rooms render as a cyan **roundtable tab group** with `room:<id>` channels (server events + human + agent traffic in one intake), and room tabs send by `roomId` with the server stamping `speakerClass: human-operator`. Playwright + fake-agent end-to-end: **11/11 PASS**. Peer review fully incorporated — headlined by `maxAutoHop` 4→**6** (a caught inversion: a D4-compliant agent would have hit the floor first), plus notice non-wake guidance, the `RequestRoomArtifacts` fetch contract, explicit parking-resume, per-participant latency declarations, and echo-mode exclusion. verify-nway 19-axis PASS.

Previously: v2.5.154 (2026-07-17) — **Constellation v2.4.54 — roundtable reference server core (R2)** — the §13.30 deterministic floor becomes real in `server.cjs`: room lifecycle + `rooms.json` persistence + per-room history channels, participant fan-out over the existing 1:1 relay (ack/redelivery machinery inherited) with a single summary delivered-ack, four loud guards (rate · consecutive · `autoHop` parking + RoomStall · stall signal), human soft-yield (`RoomYield` + chain reset), notice-reply surfacing, and an advisory floor queue where a request **survives chain-cap parking** (a smoke-found refinement: parking a message must not swallow the resume signal). Verified by the new self-contained `scripts/roundtable-smoke.cjs` — 18/18 PASS. Live deploy deferred to the R3 dashboard cut (one restart, not two). verify-nway 19-axis PASS.

Previously: v2.5.153 (2026-07-17) — **Constellation v2.4.53 — roundtable: multi-party topic rooms (§13.30)** — three or more speakers (agents + humans) get a first-class home: a **two-layer split** where the server enforces the deterministic floor (room fan-out over the existing 1:1 relay, `autoHop` chain caps with parking, rate + consecutive caps, stall detection, human soft-yield priority) and the new **`/roundtable` conduct skill** owns the judgment layer (silence-as-default gating, response obligation on naming, floor bids, fixed catch-up order, ack-by-reference). Vocabulary aligned to the MUC/Matrix lineage (`voice`·`moderated`·`moderator`·`notice`); grounded in a 5-axis deep research pass (121 sources, 12 adversarially verified claims). Spec-first cut — server/dashboard implementation tracked as R2-R5. verify-nway 19-axis PASS.

Previously: v2.5.152 (2026-07-17) — **Constellation.md provenance-redaction sweep** — the public-repo redaction discipline (technical content only) applied to the spec body: private adopter/agent names generalized to protocol roles (`upstream dev agent`, `downstream adapter`), decision-source attributions (`main-upstream policy` / `user board directive` / `the user surfaced`) rewritten to impersonal `adopted <date>` + technically-described incidents, one verbatim quotation removed — 27 replacements, 23 sites, zero protocol/semantic change. Residue in archived docs + historical CHANGELOG registered as a follow-up pass. verify-nway 19-axis PASS.

Previously: v2.5.151 (2026-07-17) — **P4 anchor: `EUX_P4_SEED` env override** — the fixed fast-check seed in `constellation/history-store.p4.mjs` becomes an env-overridable default: `EUX_P4_SEED` joins the `EUX_P4_IMPL`/`EUX_P4_RUNS` hook family, so a reverse-sync e2e round can pin a fresh seed on both sides without touching the anchor file, while the default (`20260711`) keeps historical verdicts comparable. Verified both ways: default run reproduces the historical verdict exactly (6 attested · 1 disclosed SKIP · 0 failed); override run reflects the new seed with all clauses attested. verify-nway 19-axis PASS.

Previously: v2.5.150 (2026-07-17) — **Constellation v2.4.52 — the `peer` key kind** — another project's main no longer rides an `upstream` key: `kind:'peer'` (`pk-` prefix · dedicated `?peerKey=` parameter · `peer` wire role · `/join/peer` onboarding · KEY-MGMT v0.4) separates peer-mains from autonomous upstream agents end-to-end. The dashboard gains a peer tab group (로컬↔협업 사이, rose) with `Peer↔Peer`/`Peer↔Collab` monitors, the main group gains `Main↔Peer` (all monitors lazy — hidden until traffic), the key UI gains the 🤝 피어메인 kind, and the prompt-injection row gains an always-indicating **target selector** (auto-resolves on tab/group selection, per-selection override). §13.9.3 adds the peer-latency discipline: a board's main keeps peer replies fast by delegating board upkeep to a board-worker. verify-nway 19-axis PASS.

Previously: v2.5.149 (2026-07-17) — **docs: the install surface catches up — Compendium install card + Codex host card + the 32-skill roster** — the install section's plugin cards were six while its own intro said seven (Compendium card added, "all six plugins" ×3 → seven); the Codex adapter — shipped v2.5.135, 32 projected skills — existed only in changelog prose, so the per-environment section now opens as three hosts with an OpenAI Codex (adapter) card carrying real install steps (`gen-codex-adapter.cjs --install` · `config.toml.example` stanzas · `codex/AGENTS.md` hook-replacement discipline), and the README bridge-table Codex row points at the adapter instead of under-claiming "read AGENTS.md" (EN + 3 KO); a new `#skills` section enumerates all 32 skills in 7 per-plugin cards with an invocation taxonomy. verify-nway 19-axis PASS.

Previously: v2.5.148 (2026-07-17) — **post-ship adversarial verify on v2.5.147 — 8 findings fixed** — a 3-lens skeptic pass over the just-shipped cut (redaction/genericity · spec-consistency · count integrity) returned 10 findings; 8 fixed here (kit v0.2.1 · Constellation plugin v0.3.25): boardsweep no longer presents a private deployment's `modes.tone` as universal schema, its scope is the honest "every agent-authored component" with the wiki projection in the sweep set and an add-missing clause for `current[]`; eg-memsync's seed boundary is scoped to promotion, with in-seed-section drift resolving by the dated-memory rule as a marked local divergence; codex/README hand-counts de-brittled ("22 skills" ×4, stale since v2.5.135); the docs install-intro now says five procedures like the card below it. 2 pre-existing findings registered for separate tracks (Constellation.md provenance-redaction sweep · compendium-lint self-count). verify-nway 19-axis PASS.

Previously: v2.5.147 (2026-07-17) — **`/eg-memsync` + `/boardsweep` — two true-up skills** — the kit (v0.2.0) gains its fifth procedure, `eg-memsync` (`/egmem`): sweep agent memory against the governance docs in both directions — five drift kinds detected, dated memory beats undated doc prose, repo reality closes stale state-memories, genuine contradictions surfaced rather than auto-picked, and memory-only durables promoted into the docs under four boundaries (lifecycle · practice-vs-charter · the seed boundary `/egup` owns · pointer-not-paraphrase) with a public-repo redaction gate. The Constellation plugin (v0.3.24) gains `boardsweep`, the retrospective counterpart of `/roundnext`: true-up every board component except the realtime chat — `done[]` verified against the VCS, shipped planned items migrated, resolved decisions closed, registry pruned, tone normalized, no fabrication. boardsweep fixes what the board *claims*; `/roundnext` decides what *happens next*. Codex adapter 29 → 32 skills. verify-nway 19-axis PASS.

Previously: v2.5.146 (2026-07-13) — **`estregenesis` — the kit plugin: EG itself as commands** — adopting EG no longer means hunting a raw GitHub URL. Four procedures: `/egboot` (new project) · `/egmig` (existing rule files — every rule promoted or dropped-with-reason) · `/egup` (seed + plugin delta, additive, local edits win) · `/egrich` (full arm, cost stated up front). Each routes to the right sibling on misclassification; the three short names are **pointer aliases, not copies** (Compendium's pointer-not-paraphrase applied to the plugin's own surface). The skills fetch and run the seed — never restate it, never reconstruct an unfetchable one from memory. 0 deps, no runtime. **Promo sweep**: the quickstart now leads with the one-command path; the Compendium card had been advertising "v0.1.0, design draft" five releases after its runtime shipped; the plugin roster was frozen at Constellation v0.3.16; `docs/index.html` gained a kit card. **verify-nway hole closed**: the `readme-current` axis matched only the first marker per language — two later 버전 관리 copies had been frozen at v2.5.137 for 8 cuts while it reported PASS. Now checks every marker. 19 axes, 0 drift.Previously: v2.5.141 (2026-07-11) — **P4b dynamic-gate anchor: `constellation/history-store.p4.mjs` (reverse-sync B3 pilot — the EG-owned P4 leg goes live)** — the metamorphic-property anchor the reverse-sync verdict spec (v0.2) assigns to EG: loaded by the EstreUX runner (`p4-check --run`) via the P4b contract (`run(props)` export), it executes `history-store.eux`'s 7 `@metamorphic` clauses against the minimal Mode-A reference impl with fixed-seed fast-check (cross-side reproducible verdicts). Coverage-honest wiring: 3 clauses direct, 3 as declared Mode-A projections of Mode-B clauses (projection notes in-output), 1 explicit SKIP (archive surface absent in the minimal impl — disclosed, never silent); unmapped clauses are conservative FAILs; `EUX_P4_IMPL`/`EUX_P4_RUNS` env hooks let the e2e run mutated implementations. Verified three-legged (positive 6-attested/exit 0 · destructive mutation fails exactly its clause/exit 1 · unknown clause fails unmapped/exit 1). Dev-dep fast-check via new `constellation/package.json` (runtime stays dependency-zero). verify-nway 18-axis PASS.

Previously: v2.5.140 (2026-07-10) — **Constellation v2.4.49 — §13.27 headless hub-main reference runtime upstreamed (first ephemeral-peer A2A contribution)** — the adopter behind the G1–G8 report delivered its verified hub-main loop implementation as a §13.14-redacted bundle **over the board itself**, via an ephemeral attach (the §13.9.4 pattern specced one day earlier — spec dogfooded by its own contribution channel). Six files now ship at `constellation/reference/runtime/hub-main/`: `hub-loop.sh` (supervisor: watcher-block → turn → backup; dependency-path echo at startup; first-start cursor init), `hub-turn.sh` (doc-repo pull → one-pass inbox classify → tier-routed headless one-shot with minimal tool allowlist + 900s timeout → cursor advances only on success), `hub-backup.sh` (secret-gated board backup with offline tolerance), `git-askpass.sh`, a restart-tolerant `Dockerfile`, and the `CLAUDE.md.template` hub-main charter (§13.9.3) — plus a README carrying the generalization substitution points and the §13.27 invariant mapping. Two maintainer alignments were applied on upstream (noted in-file, reported back to the contributor): the turn classifier's NOISE list gains `AgentHello` (§13.16.9 handshake group — the same drift fixed in the watcher at v2.4.47), and the tier lists now mirror the §13.16.9 `tier` column SSoT with the spec's fail-safe (unknown non-noise → `escalation`; the original defaulted to routine). Verified: `sh -n` on all four scripts + a 5-case classifier smoke (AgentHello→NONE, WorkerReport→ROUTINE, DECISION_REQUEST→ESC, unknown→ESC fail-safe, mixed→ESC). §13.27.3 now links the real files. This completes the G1–G8 track end-to-end. verify-nway 18-axis PASS.

Previously: v2.5.139 (2026-07-10) — **Constellation v2.4.48 — hub-peer spec gaps G1–G8 (MangoEdu dogfood)** — a downstream adopter running a **headless hub-main** (a board coordinator with no human session, on a NAS) + a **turn-based ephemeral peer** completed the deployment and filed 8 spec-gap proposals; all are authored into the spec. **G1 §13.9.3 duty profiles** — names the axis *wire role ⊥ duty*, with three reference profiles (`orchestrator-main` / `hub-main` / `peer-main`) and the mirror-image invariant of §13.9's peers-are-not-workers: expecting a `hub-main` to issue a `Delegate` or produce code is a role-contract violation. **G4 §13.9.4 ephemeral peers** — the operating contract for a peer with zero resident processes (attach → drain → emit → detach): `present`/`reachable`/`offline` tri-state + `lastSeen`, an attach-is-redelivery-trigger sequence, and first-join-only `AgentHello`. **G3 + G7 §13.16.9** — a `tier` axis (`routine` / `escalation`) orthogonal to the group classification, giving the many consumers (model routing, nudge cadence, Web Push, dashboard emphasis, drain priority) one SSoT instead of re-invented lists (fail-safe `escalation`); plus recommended (SHOULD, back-compatible) payload fields for `WorkerReport`/`Report`/`Handoff` so a headless main can auto-curate. **G8 §13.25.7** — multi-hat operator (hub operator = peer): per-role canonical ids, legitimate self-issuance, trust boundary = surface allowlist not key ceremony. **G2 §13.27 headless hub-main autonomous loop** — the first spec pattern for a board main with no human session: 6 invariants (wake economy, cursor at-least-once, noise absorption, security boundary, turn timeout, `tier`→model routing) + three reference scripts as upstream candidates (pending redaction). **G5 §13.28 board backup contract** — tracked/transient classification (transport queues MUST be transient — they record A2A bodies), a secret gate tightened to real-token structure (so the gate's own patterns don't self-match), and the `.gitignore`/`.gitattributes` contract behind two real secret-staging incidents. **G6 §13.29 ownership registry & claim layering** — an optional board `ownership` projection + 3-layer claim model (static / durable-git / live-A2A) + a `ContractUpdate` intent candidate. Spec-only (plugin runtime unchanged, 0.3.23). Report: `reports/2026-07-09_constellation-hub-peer-spec-gaps/`. verify-nway 18-axis PASS.

Previously: v2.5.138 (2026-07-09) — **Constellation v2.4.47 — reference `self-wake-watcher.sh` hardening (hub-peer dogfood B1-B4)** — a downstream adopter (MangoEdu, a headless hub-main + turn-based peer deployment on NAS) ran the reference runtime end-to-end and reported concrete watcher bugs; the immediate patch-tier ones are fixed. **(1) AgentHello → NOISE (SSoT drift fix)** — §13.16.9's 4-group classification moved `AgentHello` to the handshake group (non-wake) back in v2.4.37, but the reference watcher's NOISE list never followed, so every peer connect triggered an unnecessary wake (the exact case §13.16.9 warns about). Aligned. **(2) stderr leak on absent file** — `wc -l < "$FB"` leaks a shell redirection error on every 5s poll when the file is absent (the input-redirection failure is reported before `wc`'s `2>/dev/null` applies); guarded with `[ -f ]`. **(3) `WS_STANDBY_MODE=always`** — a first-class env for headless hub-main supervisor loops that must stay armed regardless of the board's public `standby` value (inbox/feedback only), replacing the adopter's private-file workaround. **(4) bash-only header note + `runtime/.gitattributes` (LF)** — the watcher uses bash-only constructs (busybox/dash fail); and CRLF corruption on Windows-routed deploys caused two real incidents (a `syntax error near unexpected token 

Previously: v2.5.136 (2026-07-05) — **Greatpractice v0.3.3 — first model-invoked skill `routinize` (관행화) + `/before-compact` soft chain** — Greatpractice gains its first Agent Skill, the model-invoked front door to its capture→mature→codify pipeline (§1.2/§5.4). **`/routinize`** codifies a *recurring* work pattern into a durable practice, faithful to the module's **capture-eager / promote-deferred** discipline: it captures the pattern to `memory/feedback_*.md` immediately (cost-0, blameless voice), accumulates coordinates on recurrence, drafts a `_propose/` entry **only** when the §5.2 notability gate clears (≥3 substantive occurrences across ≥2 *distinct* coordinates + verifiable effect — a single session's repetition is usually one coordinate, so most invocations end at capture), and **never self-ratifies** an enforcing hook (promotion to a blocking entry is user-gated, §5.4 gate 3). Phronesis-heavy work (judgement-heavy / rare-context / high-context-dependent) is skipped by design (§1.4/§5.3). **Prime trigger = `/before-compact` time**: the session's accumulated context is the raw material and is about to be compacted away, so the `before-compact` skill gains a soft Step-0 that runs `/routinize` first (opt-in — skipped if Greatpractice is not adopted) — the two are complementary, routinize capturing *what recurs across sessions* while before-compact captures *what is in flight in this one*. The Codex adapter picks up the new skill automatically (22 skills projected). verify-nway 17-axis PASS.

Previously: v2.5.135 (2026-07-05) — **Codex adapter (Stage 1) + Compendium v0.2.5 (the MCP-declaration gap the adapter surfaced)** — EstreGenesis modules now run under **OpenAI Codex**, not just Claude Code. **(1) Codex adapter (`codex/`)** — Codex converged in 2026 on the same three customization surfaces EG already speaks (Agent Skills `SKILL.md` · MCP servers · `AGENTS.md`), so the six modules port with almost no transformation. Rather than duplicate the 21 canonical `SKILL.md` files (the drift surface the Migration-B dogfood warned against), the adapter is a **projection**: `gen-codex-adapter.cjs` materializes skills on demand into a Codex discovery path (`--install`, symlinks/copies) and regenerates only the Codex-specific derived surfaces — `config.toml.example` (the 4 MCP `[mcp_servers.*]` stanzas) and the README inventory. A hand-written `codex/AGENTS.md` carries the **hook-replacement discipline**: Codex has no lifecycle hooks, so each of the 6 Claude Code hooks maps to a manual paired-skill invocation — the discipline travels even though the automation does not (the north-star thesis made concrete). A new EG-ops **codex-adapter verify-nway axis** (`gen --check`, 17th axis) gates the committed surfaces against the live plugin set. **(2) Compendium v0.2.5** — building the adapter surfaced a real wiring gap: the Compendium MCP server (the §10 8-tool runtime, shipped v2.5.114) was **never declared in `plugins/compendium/.claude-plugin/plugin.json`**, so no host auto-registered it. Smoke-tested clean (initialize + tools/list → wiki_read/search/upsert/…), then declared — fixing Claude Code and letting the adapter project all four MCP servers. Full N-way version cascade (plugin.json + marketplace + mcp/package.json + Compendium.md frontmatter + docs badge/meta/module-tag). verify-nway 17-axis PASS.

Previously: v2.5.134 (2026-07-05) — **docs: promo-page staleness sweep — cumulative panel un-frozen, six-module corrections, Constellation v2.4.24–46 feature-wave coverage** — a full stale-content sweep of the public promo pages (agent-swept, EN+KO, all three audience registers) surfaced prose that had frozen while the machine-checked badges/meta moved on; all fixed. **(1) index.html** — "two optional graduated modules" → six (dev+expert, both languages); the "Cumulative since the 24h baseline" panel un-froze from "v2.5.36 / Hyperbrief is the new third module" to the current record (v2.5.133 range · 4 more modules → six · the Constellation §13.23–§13.26 wave · the M2 adopter-dogfood absorption), metrics updated (~21→~118 cuts, 1→4 new modules, 3→4 adopter bundles/reports, 2→6+ integrations); Ultrasafe staging corrected in 3 spots ("advisory v0.1.x → blocking v0.2.x" → "advisory v0.2.x, live + self-dogfooding → blocking v0.3+"); Greatpractice cards re-anchored from "v0.1.0 first cut + v0.2–0.4 roadmap" to the shipped v0.3.2 state; the Compendium general card now leads with the portable-discipline-over-any-vault framing; the Constellation cards gained the v2.4.24–46 highlights. **(2) constellation.html** — the flagship page's body introduced nothing newer than the dogfood era (§13.16.12 / the v2.5.15 relay): two new "What's inside" cards now cover the §13.23–§13.25 board-substrate wave (backends registry + board-worker projection, PWA + dependency-free Web Push, surface-scoped access control + CIDR + exposure toggle, wiki cross-link side panel, ack ✓ origin-line UX) and §13.26 echo-mode (tri-state local↔board remote-control mirror). **(3) hyperbrief.html** — "18 anti-patterns" → 26, matching its own badge. **(4) greatpractice.html** — "v0.1.0 specification" / "v0.2–v0.4 roadmap defines" → v0.3.2 current, v0.2/v0.3 marked shipped, v0.4+ open. Docs only, EN/KO. verify-nway 16-axis PASS.

Previously: v2.5.133 (2026-07-04) — **Migration-B dogfood follow-up — seed registry to six (Compendium) + backends.json re-sync preserve rule + runtime notes split + README KO current un-freeze (Constellation v2.4.46, seeds v2.5.1)** — a downstream adapter ran the full Migration-B (M2) upgrade (seed v2.4.3→v2.5.0 + release delta ~92 patches) and its dogfood report surfaced three ship-surface gaps; all fixed, plus one more found while cutting. **(1) Seed module registry → six.** The seed § EG module registry still listed five modules while the release track had shipped Compendium (v2.5.110) — an adapter reading only the seed misses the sixth module (the report's dual-marker cross-check caught it; the registry's hold-until-production exception is dropped now that a real adapter adopted Compendium from the release track). All 6 seed files (KO/EN × Master/Lite/Compact) gain the Compendium row + a "Six optional modules" intro; seed marker v2.5.0→**v2.5.1**; the EG-ops verify-nway seed-registry axis now checks 6 modules. **(2) backends.json re-sync preserve rule (§13.23.2).** The deployment config (boardTitle, roster) sits at the dashboard's default fetch path *inside* the reference `dashboard/` copy-set, so a wholesale vendor-copy re-sync clobbers adapter branding; the spec now states the preserve-list rule explicitly. **(3) reference/runtime dev-notes split.** The three `*-NOTES.md` dev notes move to `runtime/notes/`, making the runtime copy surface runtime-only. **(4) README KO versioning un-freeze.** Found while cutting: the README KO **현재** entry had been frozen at v2.5.110 for 22 cuts (only the EN Current was updated per cut); synced to v2.5.133, and a new **readme-current** verify-nway axis (EN Current ↔ KO 현재 ↔ data.js) makes that drift deterministic. verify-nway 16-axis PASS.

Previously: v2.5.132 (2026-07-04) — **Constellation v2.4.45 — echo-mode (remote-control mirror) + ack ✓ UX** — (1) **echo-mode (§13.26)** — a three-level per-agent mode (`off`/`on`/`mirror`) that mirrors an agent's local human↔agent chat onto the board's real-time conversation channel **bidirectionally**, so a human watching the board can also *drive* the agent through it (a remote-control substrate). `on` mirrors the turn-final text; `mirror` adds a live activity stream — tool calls, steps, thinking narration — for a chat-gateway feel. Board-typed prompts arrive as `UserPrompt` (quoted into the local chat, then acted on); structured choices render as plain-text options locally + a `SelectionPrompt` chip-card on the board (never a blocking local UI, per §13.17). Default follows **join provenance** (human-joined=off, agent-spawned=on — the board is the only channel to an agent nobody launched directly). Ships the protocol (§13.26), the `/echo-mode` skill, and the deps-0 `echo-emit.cjs` 3-phase reference hook (PreToolUse/PostToolUse live progress + Stop turn-text + thinking summary), all level-gated; dogfooded live end-to-end. (2) **ack ✓ UX** — `UserPromptAccepted`/`Ack`/`AckProcessed` now stamp a ✓ on the **origin** request/message line (correlate by promptId / msgId) with a custom cursor-quadrant hover popup (time·agent, click-to-pin) instead of a separate code-value row; live local-echo rows carry promptId so real-time acks annotate in place. verify-nway 15-axis PASS.

Previously: v2.5.131 (2026-06-24) — **docs: fix non-working Copy buttons across all six module pages + plain-language the Compendium Install/Example copy** — (1) Bug fix — the Copy buttons on hyperbrief / constellation / superscalar / greatpractice / ultrasafe / compendium did nothing because none of those pages loaded `shared/copy.js` (only index.html did); added the script to all six. Verified on compendium via Playwright: handlers attached 5/5, every button copies and shows "✓ Copied". (2) Plain-language (L1.1.1) pass on the Compendium Install + Example-prompts copy: the "add a term" example became a plain natural-language prompt (a one-line summary + a link to the defining doc, not "curate way — gloss + owner_spec pointer"), the lint example describes each check in plain words, and the install descriptions are un-jargoned. Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.130 (2026-06-24) — **Compendium promo docs — plain-language (L1.1.1) pass on the general copy** — rewrote the remaining jargon in the general-audience text of docs/compendium.html to L1.1.1 (plain audience, abbreviations expanded, no jargon): the MCP card ("needs nothing else installed" not "0 dependencies"), eviction ("custom-built parts retired first" not "bespoke runtime pruned"), adoption ("parts that share words / terms that refer to each other / live shared screen" not "modules / cross-referenced / dashboard / over-engineering"), the portable use-case ("stuck with one app" not "lock-in"), the dashboard card ("glossary page / plain-or-expert switch" not "wiki tab / toggle"), and the "Want to read more?" tour (each spec section in plain words, not a §1–§12 jargon list). Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.129 (2026-06-24) — **Compendium promo docs — add the missing "Want to read more?" footer section** — completes the v2.5.128 cut: docs/compendium.html gains the standard bottom "Want to read more? / 더 자세히 알고 싶다면" section (a plain tour of Compendium.md §1–§12 + the cross-tool skills path + the spec link) that every other module page carries. Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.128 (2026-06-24) — **Compendium promo docs — recent-updates coverage + the missing standard sections** — the public Compendium page gains a **"Portable over any vault"** section covering the v0.2.2–v0.2.4 surfaces (the Obsidian/vault projection, the two cross-tool curation skills, the dashboard wiki tab + click-to-define side panel) with the pointer-not-paraphrase wedge as the headline, plus the three standard sections every other module page has — **Install**, **Example prompts**, and **Use cases** (three scenarios: stopping glossary drift, click-to-define on the live dashboard, carrying the discipline across tools). The stale "deferred to v0.2-d" claims (page + index card) are un-deferred. Docs only, all three audience levels × EN/KO; Playwright-verified render (9 sections, audience-gating correct, 0 console errors). verify-nway 15-axis PASS.

Previously: v2.5.127 (2026-06-24) — **Compendium v0.2.4 — cross-tool curation Agent Skills (the portable discipline carrier)** — the Compendium discipline now ships as two plain-markdown **Agent Skills** any harness reads: **compendium-curate** (the pointer-not-paraphrase + dual-register + schema + first-class-eviction curation procedure — invoke it the moment you're about to write a glossary or a second copy of a definition that already lives in a spec) and **compendium-lint** (the six gardening checks — pointer-resolution / broken-link / no-competing-full-def / redaction / orphan / duplicate / stale — by runtime or by inspection). This is the option-(c) carrier the research identified: the storage + viewer are substitutable, so the discipline travels as portable skills over plain markdown+frontmatter rather than as a bespoke runtime. Roadmap move #3 (final of the reframe). Each skill points to Compendium.md for the full charter (pointer-not-paraphrase applied to the skill itself). verify-nway 15-axis PASS.

Previously: v2.5.126 (2026-06-24) — **Compendium v0.2.3 — spec reframe: portable discipline layer (pointer-not-paraphrase as the wedge)** — §1 re-positions Compendium from "a module with a bespoke wiki runtime" to **a portable controlled-vocabulary *discipline layer* over the markdown-vault substrate**: the storage + viewer are substitutable (Obsidian graph / provider memory / the dashboard wiki tab all read the same markdown+frontmatter; §11 emits the viewer-agnostic projection), and what Compendium owns is the *curation discipline*, not a runtime. A fifth misreading is foreclosed (§1.1(e) "a vault app / an Obsidian competitor" → Compendium is the opinion layer *on top of* whatever vault wins, supplying what generic vaults + provider-native memory deliberately do not: dual-register + pointer-not-paraphrase + governance lints + first-class eviction). §1.2 records the typed link model (peer `links` vs the one-directional `owner_spec` authority pointer) as uniquely owned — the charter made structural — and the bespoke wiki tab is named one optional viewer, eviction-first-class. Roadmap move #1 of the option-(c) reframe. Spec + docs only (no runtime change). verify-nway 15-axis PASS.

Previously: v2.5.125 (2026-06-23) — **Compendium v0.2.2 — Obsidian / vault projection (portable-discipline interop bridge)** — the Compendium content store now lights up natively in any markdown-vault viewer (Obsidian's graph + backlinks) while frontmatter stays the typed SSoT. `lint.cjs --reindex` emits an auto-managed block per entry: peer relations as in-vault `[[id]]` (graph edges) + the `owner_spec` authority as a relative link **out** of the store — **pointer-not-paraphrase made visual** (peer = graph edge; authority = external pointer). 39 peer links across 23 entries, all resolving to real files; idempotent; lint-clean. First move of a strategic reframe (a deep-research round found the winning substrate is the *generic markdown-vault pattern* — not any one app — and that provider-native memory ships format-agnostic, leaving the vocabulary-discipline layer the durable, un-absorbed value): Compendium positioned as a portable *opinion on top of whatever vault wins*, the bespoke wiki tab demoted to one optional viewer. §11 also marks the side-panel + click-to-define components shipped (v2.5.124). verify-nway 15-axis PASS.

Previously: v2.5.124 (2026-06-20) — **Constellation v2.4.44 — Compendium wiki cross-link side panel (click-to-define, §8/§11)** — clicking a cross-link in the dashboard's 위키/wiki tab now opens that term's gloss in a **non-modal side panel** (a complementary landmark) — you peek the definition without losing your reading position, the panel's own cross-links **chain** to further terms, and a "전체 항목으로 →" link jumps to the full entry. a11y per §8.2: because a gloss can contain cross-links the trigger carries **dialog/disclosure** semantics (`aria-haspopup="dialog"`, never `role="tooltip"`), focus moves into the panel on open, **Escape** closes it and restores focus to the trigger; the §8.1 post-escape-DOM invariant (no raw-HTML injection) holds. Mobile (≤560px) renders as a **bottom-sheet** seated above the tab bar. Client-only (no server change → no restart; `sync-dashboard` deploys). Playwright-verified on the live board: render (26 entries / 39 cross-links + ARIA), click→panel→focus→chain→Escape→focus-restore, mobile bottom-sheet clears the tab bar, **0 console errors**. verify-nway 15-axis PASS.

Previously: v2.5.123 (2026-06-20) — **Constellation v2.4.43 — tier-2 Web Push (#3b, fires while the board is closed)** — the dashboard's notifications gain a second tier that reaches you **even when the PWA/tab is fully closed**, complementing in-tab tier-1 (v2.4.28). Implemented **dependency-free** (node built-in `crypto`/`https` — no `web-push` library): a self-generated P-256 VAPID keypair (`.vapid.json`, gitignored), ES256 JWT signing via `crypto.sign(…, {dsaEncoding:'ieee-p1363'})` (raw 64-byte `r||s`), and **tickle** delivery — a payload-less VAPID push (RFC 8291 payload encryption avoided, which is what drops the dependency) where the service worker fetches `GET /api/push/latest` for the body on the `push` event. Four endpoints (`/api/push/{vapid-public-key,subscribe,unsubscribe,latest}`, UI surface → §13.25 `ui`-allowlist-gated), a `wsToBoards`-passing meaningful-A2A trigger (noise-blocklisted), auto-pruned expired subscriptions (404/410), and a 🔔-panel **백그라운드 알림** toggle (`PushManager.subscribe`). Per-origin — the board self-sufficiently pushes its own activity. Distilled into the Constellation reference (`reference/runtime/push.cjs` + `server.cjs` + dashboard) → §13.24.4. Verified: push.cjs unit suite (VAPID 65B key + ES256 raw-64 sign/verify + dead-sub prune + noise filter) + server HTTP smoke (4 endpoints) + isolated-port boot. verify-nway 15-axis PASS.

Previously: v2.5.122 (2026-06-19) — **Compendium v0.2 seed vocabulary — 19 cross-module glossary entries** — the content store grows 7 → **26 entries**, materializing the spec's ~25-item EG Seed Vocabulary Catalog (Appendix A.1): 19 internal-register pointer-only glossary terms across Constellation / Superscalar / Hyperbrief / Greatpractice, each a one-line orientation gloss + expert/plain dual-register glosses + a pointer to the owning spec (the full definition stays in the owner, per the pointer-not-paraphrase charter). Every `owner_spec` was reconciled against the **real** owner-spec heading slugs (via the lint's own `headingSlugs` — the catalog's example slugs were single-hyphen, the actual GitHub-style slugs double-hyphen around dropped ` — `/` / `), so the §9.2 pointer-resolution axis resolves all 26 with **0 hard failures**; catalog #3 (routing-by-direction) deferred (no dedicated owner-spec heading). `lint.cjs --reindex` regenerated `INDEX.md` + `index.json`; the wiki-tab `compendium.json` export updated to 26. Compendium module unchanged (v0.2.1 — content seeding). verify-nway 15-axis PASS.

Previously: v2.5.121 (2026-06-19) — **Constellation v2.4.42 — dashboard-operable exposure + self-restart (#5a-4)** — exposing the board to the LAN is now a dashboard action, not a manual env+restart. A persisted **`expose`** field (the `WS_BIND` on/off) is flipped from the settings modal and applied via a **loopback-only `POST /api/restart`** that self-restarts the server (a deployment `restart-self-board.ps1`, spawned via `cmd /c start` so it survives the server's own exit, re-launches it). The access editor gains a **네트워크 노출 끄기/켜기** master toggle (dims the IP policy when off) + a **저장 및 재시작** button, and the settings modal separates the **real-time** 창 배치 block from the **save-gated** 접속 제어 block as distinct cards. Server + dashboard, purely additive (`expose:false` default = prior loopback behavior). Verified: WS_BIND derivation + restart spawn/self-exit (cmd/start survives parent exit) + Playwright (block separation, expose toggle dim, save persists `expose`). verify-nway 15-axis PASS.

Previously: v2.5.120 (2026-06-19) — **Constellation v2.4.41 — per-surface access toggles + CIDR (#5a-3)** — the access model becomes symmetric across all three surfaces and friendlier to edit. **agent** joins UI and MCP with its own IP allowlist (restrict which IPs may connect as agents, *and* still require a key — defence-in-depth), and allowlist entries now accept **IPv4 CIDR** ranges (`192.168.0.0/24`) alongside exact IPs. The `/ws` gating moves to HELLO (where agent vs MCP is known), with an upgrade-time pre-check that `destroy`s fully-blocked IPs before any board state is sent, and `requireKey` is enforced at HELLO (URL *or* HELLO key — fixing a v2.4.39 gap). The dashboard editor becomes three **기본 차단/허용** toggles (UI/agent/MCP) + a key checkbox + an exposed-without-key warning; settings modal retitled "⚙ 설정". Server + dashboard, purely additive; Playwright-verified (3-toggle render, 차단→textarea, per-surface save) + CIDR/exact match 12/12. verify-nway 15-axis PASS.

Previously: v2.5.119 (2026-06-19) — **Constellation v2.4.40 — access-control dashboard editor (#5a-2)** — the settings modal (⚙) gains a **접속 제어** section that edits the §13.25 access policy from the board UI: per-surface IP allowlist textareas (UI / MCP — one IP per line, empty = allow-all), an `agent.requireKey` toggle, and an exposed/bind status line. It loads via `GET /api/access` on open and saves via `POST /api/access` (loopback-only — a remote/UI-allowed caller gets a clear 403). Completes #5a — the v2.5.118 server-side gate is now manageable from the dashboard, not just by hand-editing `access.json`. Dashboard-only (`app.js` + `style.css`); no server/protocol change. Playwright-verified on an isolated server: section renders (0 new console errors), GET populates, POST persists to disk. verify-nway 15-axis PASS.

Previously: v2.5.118 (2026-06-19) — **Constellation v2.4.39 — surface-scoped access control (#5a-1)** — when `WS_BIND` exposes the board beyond loopback the three surfaces gate **independently**: **UI** (dashboard + board endpoints) by an IP allowlist, **agent** (keyed `/ws`) allow-all-by-IP with an optional `agent.requireKey` that closes the v2.4.11 unauthenticated-board vector (LAN-wide key-issue / `SetMain`), and **MCP** (the `mcp-proxy` WS client) by its own allowlist independent of UI. A gitignored `access.json` beside `server.cjs` (`fs.watchFile` hot-reload) drives it — **fail-open by default**: no file = prior behavior, `null` allowlist = allow-all, loopback always allowed, the gate wholly inert on a loopback bind. `GET /api/access` (UI-gated) + `POST` (loopback-only). Server-side only (`server.cjs` + §13.25 + `.gitignore`); the dashboard per-surface allowlist editor is staged as #5a-2. verify-nway 15-axis PASS.
Earlier releases: every entry is preserved in [CHANGELOG.md](CHANGELOG.md) — this list keeps only the most recent few.

**Full changelog** (all releases from v1.0 onward, EN + KO): [CHANGELOG.md](CHANGELOG.md).

This upstream repository's `CHANGELOG.md` is the changelog SSoT. Each seed file keeps only a compact header metadata line with tier, language, current version, counterpart, and a pointer back to that `CHANGELOG.md`, not the target project's README. When you upgrade a project using Migration B, the agent uses the seed header version marker plus the changelog to compute the delta.


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

**Claude Code 에서는 명령 하나.** 킷 플러그인을 설치하면 알맞은 시드를 알아서 가져옵니다:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins

/egboot     # 신규 프로젝트      (긴 이름: /eg-bootstrap)
/egmig      # 기존 프로젝트      (긴 이름: /eg-migration)
/egup       # 이미 시드 적용됨 — 시드 + 플러그인 업그레이드 (긴 이름: /eg-upgrade)
/egmem      # 에이전트 메모리 ↔ 프로젝트 문서 정합 (긴 이름: /eg-memsync)
/egrich     # 풀 무장: 시드 + 6개 모듈 전부, 배선·검증까지
```

스킬이 티어를 고르고, 시드를 가져와 `.agent/seed_prompt.md` 로 설치하고, 그대로 실행합니다 — raw URL 찾을 일도, 복사·붙여넣기도 없습니다. 잘못 골라도 맞는 스킬로 안내합니다.

**다른 에이전트에서는 수동 경로 (여전히 60초).**

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

## bootstrap 너머 — 6 선택 모듈

v1.x 는 프로젝트 시드 — 신규 AI-Native 프로젝트 부트스트랩, 또는 기존 프로젝트를 `AGENTS.md` SSoT 로 마이그레이션 (위의 모든 내용). **v2.0+ 는 그 위에 6개의 선택 모듈 추가**:

- **[Constellation](Constellation.md)** (v2.0+) — 실시간 멀티에이전트 오케스트레이션. 파일 기반 `.agent/_coordination/` 코디네이션을 실시간 라이브보드 (WebSocket + A2A 메시징 + 대시보드) 로 격상. **A2A 브릿지 인터페이스**가 불변 계약. [constellation/reference/](constellation/reference/) 의 참조 런타임은 Node deps-0 (`ws` 제외). 컴포넌트는 `.eux` 로 작성하여 **[EstreUX](https://github.com/SoliEstre/EstreUX)** (별도 Apache-2.0 런타임, EG 가 *참조* — clone-and-run, 번들·소유 안 함) 로 brew.

- **[Superscalar](Superscalar.md)** (v2.3+) — 병렬 서브에이전트 dispatch 의 실행 스케줄링 규율. 5차원 `issue_width` 공식 (effort_band + pace_mode + Little's Law + Kanban WIP + autonomy_available_workers) + 30-60k 토큰 horizon 교차점에서의 cost-benefit gated dispatch + worktree-isolated reorder buffer + in-order retire + consistency gate + opt-in speculation. Production-ready (Stage 1 ship). n=8 dogfood ledger + Entry 06 controlled A/B 가 "병렬화만으로는 불충분; 오케스트레이션 규율이 일관성을 만든다" 입증.

- **[Hyperbrief](Hyperbrief.md)** (v2.3.20+) — 결정 위임 게이팅 규율. 모든 user-facing 결정 질문이 트리거 rubric 통과, 에스컬레이션 시 LLM 이 schema 강제 JSON IR emit, 결정론적 Node renderer 가 9-section Markdown 브리핑 + interactive HTML 카드 산출. 4축 × 5단계 톤 프로파일 + skill-side auto-localize (버튼 라벨 + MD trigger phrase 가 사용자의 prevailing 대화 언어 따라감). Cross-module 통합 active: Constellation §13.16.9 (5 A2A intent name + ack_tier='decided') + Superscalar §3.1 (write/deploy/send lane retire 시 orthogonal gate). §11.5 v1.0 readiness rubric (Lens A 7-차원 모듈 전체 GA / Lens B 6-차원 host-specific 마켓플레이스 등록) ship 완료.

- **[Greatpractice](Greatpractice.md)** (v2.5.50+, v2.5.55 release-cadence 정식 등록) — 메모리 기반 관행 codification 규율. AI 와 함께 작업하면서 자연스럽게 형성되지만 점점 누락되는 자잘한 약속들 — 「코드 수정 시 docs 도」, 「보내기 전 확인」, 「X 가 바뀌면 Y 도」 — 의 *조용한 누락* failure surface 를 target. 보통 메모리 메모로 시작했다가 메모가 누적될수록 점점 안 읽히고 누락이 늘어나는 패턴이에요. Greatpractice 는 agent-workspace 메모리 feedback (`memory/feedback_*.md` 또는 동등 surface) 을 입력 트리거로 받고, raw 신호를 5-axis multi-criteria maturation gate (frequency + depth + recency + cost + predictability weighted sum threshold ≥ 18 OR 3-criterion notability) 를 통해 3-tier macro/mezzo/micro 계층으로 route. ratified entry 는 deterministic lifecycle hook (SessionStart blocking / UserPromptSubmit path-scoped inject / PreToolUse 3-subtype poka-yoke contact/fixed-value/motion-step / PostToolUse SSoT propagation / Stop cycle-end probe / PostCompact working-set 복구) 으로 강제. 명시적 `phronesis_boundary` field 가 judgement-heavy work 의 codify-금지 영역 명시. 9축 cross-domain 딥리서치 (harness · humanities · psychology · management · processor · os · sre · memoization · canonical) 가 backing. v2.5.55 dual cut 이 [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) entry 를 `_propose/draft` 에서 ratified 로 promote (user steering trigger at N=1 evidence; mezzo decomposition 8-candidate batch v2.5.56+ 예정).

- **[Ultrasafe](Ultrasafe.md)** (v2.5.55+) — 출시 직전 / 갱신 직전 모의 침투 시험 규율. *출시 후 발견* failure surface 를 target: 보안 문제가 외부 사용자에 의해 발견되는 시점이 출시 후이지, 내부 검증으로 출시 전이 아닌 패턴. Ultrasafe 는 매 release 를 Superscalar-applied Workflow 로 ship, 8 병렬 공격 에이전트 (v0.1.0 최소 fan-out — AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer + GTA/DSP cross-cutting) 가 독립 관점에서 모의 공격, Finding Output Contract (§4) 로 발견 emit, Synthesizer 에서 BFT 2f+1 quorum + cross-axis correlation 으로 합성, 3-layer 보고서 (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate) 산출. ≥3 iteration loop 가 4-condition AND clean signal 까지 실행: regression-free + monotonic improvement + coverage gate + 2 iter consecutive + agent diversity invariant. Dual pre-release trigger (PreToolUse hook on `git push --tags` / `npm publish` / `gh release` / 등 7 matcher + `/ultrasafe` skill). 5 신규 Constellation A2A intent. **Advisory-only v0.1.x → blocking v0.2.x** 단계 전환 (Tier 3 release strict / Tier 1/2 opt-in). 17축 cross-domain 딥리서치 backing. v0.1.0 첫 cut ship = 전체 사양 (2544 줄, §1-§13 + 부록 A-C) + plugin manifest; runtime (공격 에이전트 dispatch / iteration loop runner / 3-layer 보고서 generator / 5 A2A intent handler / PreToolUse hook / MCP server) v0.2+ deferred.

- **[Compendium](Compendium.md)** (v0.2.6) — **이미 쓰는 markdown vault 위에 얹는 이식 가능한 규율 레이어**: 한 개념에 정의 하나, 두 register(쉬운말 + 전문어)로 제공하되, 정의를 베끼지 않고 그 개념을 *소유한 스펙을 가리킴*. 마지막 성질이 wedge — 재진술하지 않으므로 원본으로부터 drift 할 수 없음. north-star 의 두 번째 축(코드 생존보다 개념/어휘 생존 — 어느 단일 런타임 구현보다 오래 남을 레이어)을 reify. 출시분: 콘텐츠 스토어, 가드닝 lint(포인터 깨짐 / 고아 / 개념 중복 / 낡음), 8-tool MCP 서버, 어떤 에이전트든 읽어서 쓰는 cross-tool 스킬 2종(`compendium-curate` / `compendium-lint`), 그리고 스토어를 옵시디언류 앱에서 링크 그래프 그대로 열 수 있게 하는 vault 투영.

여섯 모듈 모두 **선택적** + **참조** (시드 티어 본문에 번들되지 않으므로 시드는 lean 유지). 파일 기반 코디네이션 (Phase 5) 이 기본이며 대부분 프로젝트에 충분.

### Claude Code 플러그인으로 설치 (repo 자체 마켓플레이스)

여섯 모듈은 본 repo 의 **repo 자체 마켓플레이스** 를 통해 Claude Code 플러그인으로도 ship. Claude Code 세션에서:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins
/plugin install constellation@estregenesis-plugins
/plugin install superscalar@estregenesis-plugins
/plugin install hyperbrief@estregenesis-plugins
/plugin install greatpractice@estregenesis-plugins
/plugin install ultrasafe@estregenesis-plugins
/plugin install compendium@estregenesis-plugins
```

플러그인 7종: **estregenesis** 킷(시드 자체를 `/egboot` · `/egmig` · `/egup` · `/egmem` · `/egrich` 로) + 6개 모듈. 각각 독립이라 하나만, 몇 개만, 또는 전부 설치 가능. 마켓플레이스 메타데이터는 [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json), 각 플러그인 소스는 [plugins/](plugins/) 아래. Apache-2.0. 현재: estregenesis v0.2.1 (절차 5종 + 포인터 별칭 4종, 의존성 0); Constellation v0.3.26 (+ 5-tool MCP 서버, 스킬 8종 — `/boardsweep` 포함, Stop 훅); Superscalar v0.1.2 (+ §3.1 Hyperbrief interlock); Hyperbrief v0.7.1 (+ 스킬 3종, 4-tool MCP 서버, PreToolUse/Stop 훅); Greatpractice v0.3.4 (+ `/routinize`, JSON 스키마 3종, contact 훅 1종); Ultrasafe v0.2.4 (+ 8-agent red-team fan-out, clean-signal 게이트 — advisory, 출시를 막지 않음); Compendium v0.2.6 (+ 8-tool MCP 서버, 가드닝 lint, cross-tool 스킬 2종). Anthropic-side community-marketplace 등록은 [Hyperbrief.md §11.5](Hyperbrief.md) readiness rubric Lens B 에 따라 v1.0 GA 까지 defer.

## 3-tier — 프로젝트당 하나 선택

| Tier | 크기 | 주 용도 | 대상 독자 |
|---|---|---|---|
| **Master** | ~2425줄 | 깊이 있는 가이드 필요한 신규 프로젝트, 패턴 처음 배우는 팀, 모든 인라인 템플릿 필요한 엣지 케이스 | 첫 AI Native 저자; 프로세스 공식화하는 팀 |
| **Lite** | ~1105줄 | 빠른 신규 프로젝트, 마이그레이션 세션, 기존 프로젝트에 새 AI 서비스 편입, 마스터가 컨텍스트 윈도우에 무거울 때 | 패턴 기억하는 복귀 저자; 대부분 프로젝트 |
| **Compact** | ~130줄 | 이미 패턴 알고 최소 시드 원하는 저자; 가장 타이트한 컨텍스트 윈도우; bullet 트리거만 | 체크리스트만 필요한 파워 유저 |

프로젝트에는 **tier 하나만** 배치. 세 개 다 넣지 않음. 존재하지 않는 tier 를 교차 참조하면 dead link 와 에이전트 혼란만 발생하므로, 각 tier 는 **self-contained** — 내부 완결, 다른 tier 로의 forward/backward 참조 없음.

프로젝트가 더 많은 깊이를 요구하게 되면 tier 를 in-place 업그레이드하지 않습니다. 파일을 다음 tier 로 교체하고 커밋. 에이전트가 일반 문서 업데이트로 처리합니다.

## 파일 목록

```
AI_Native_Project_Master_Seed_Prompt.md       ← 영문 마스터 (가장 깊음, ~2425줄)
AI_Native_Project_Seed_Prompt_Lite.md         ← 영문 lite (~1105줄)
AI_Native_Project_Seed_Prompt_Compact.md      ← 영문 compact (~130줄)
AI_Native_프로젝트_마스터_시드_프롬프트.md       ← 한국어 마스터
AI_Native_프로젝트_시드_프롬프트_Lite.md          ← 한국어 lite
AI_Native_프로젝트_시드_프롬프트_Compact.md       ← 한국어 compact
Constellation.md                               ← v2.0+ 모듈: 라이브 멀티에이전트 오케스트레이션 가이드 (WS + A2A)
constellation/                                 ← v2.0+ 모듈: .eux 사양 + 참조 런타임 (server / bridge / watcher / watchdog / dashboard)
Superscalar.md                                 ← v2.3+ 모듈: 병렬 서브에이전트 실행 스케줄링 규율
Hyperbrief.md                                  ← v2.3.20+ 모듈: 결정 위임 게이팅 규율 (JSON IR + 결정론적 renderer)
plugins/                                       ← Claude Code 플러그인 (constellation / superscalar / hyperbrief) — repo 자체 마켓플레이스용
.claude-plugin/marketplace.json                ← repo 자체 Claude 플러그인 마켓플레이스 메타데이터 (estregenesis-plugins)
README.md                                      ← 본 파일 (라이브러리 색인; 프로젝트에 배포하지 않음)
LICENSE.md                                     ← Apache License 2.0 전문
logo/EstreGenesis.png                          ← README 로고
```

각 tier 의 언어 페어(영문+한글)는 완전 정렬 — 동일한 phase, 동일한 마이그레이션 로직, 동일한 운영 가이드. 이중언어 팀이면 페어로 배치. **v2.0+** 는 6개의 선택 참조 모듈 (Constellation + Superscalar + Hyperbrief + Greatpractice + Ultrasafe + Compendium) 을 추가하며, 각각 repo 자체 마켓플레이스를 통해 Claude Code 플러그인으로도 ship — changelog 참조.

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
| OpenAI Codex CLI | 전용 어댑터 동봉 (`codex/`): `node codex/gen-codex-adapter.cjs --install` 이 모든 plugin 스킬을 Codex discovery 경로로 project, `config.toml.example` 이 MCP 서버 4종 등록, `codex/AGENTS.md` 가 각 lifecycle hook 을 문서화된 수동 루틴으로 매핑 |
| Jules / Kiro / Kimi Code / 기타 | `AGENTS.md` 직접 참조 (Kimi Code 는 `AGENTS.md` 가 1급 지시 파일 — 자체 `/init` 이 이를 생성) |

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

각 tier 는 자체 버전 보유. 마스터가 권위 있는 진화 트랙; Lite·Compact 는 정기적으로 마스터에서 파생되나 한 릴리스 지연될 수 있음.

**현재**: v2.5.175 (2026-07-19) — **온보딩 흐름 (Constellation v2.4.70, TC2)** — §13.32: 직접 서버 vs 피어 합류(소유권 rubric) + 포트 자동 우회 계약 + loopback-first 보안 순서예요. verify-nway 20축 PASS.

이전: v2.5.169 (2026-07-19) — **인디케이터 토글 미세 배치 (Constellation v2.4.65)** — 입력줄 토글을 첨부↔pause 사이로, 🧵 프리픽스 + 고정 폭 112px, 브라우저 실측. verify-nway 20축 PASS.

이전: v2.5.168 (2026-07-19) — **활동 모니터 UX + 소음 정련 (Constellation v2.4.64)** — 토글 fab 을 실시간 fab 레이어로(창 위로 안 뜸), 입력줄 왼쪽에 고정 폭 `Wn/n Sn` 인디케이터 토글(실측 `W2/2 S1`), 15초급 스냅샷 이벤트를 Web Push·워커 pending 분류기에서 제외 — 실측된 워커 턴 캐스케이드 종식. verify-nway 20축 PASS.

이전: v2.5.167 (2026-07-19) — **인스펙터가 에이전트 활동 모니터로 (Constellation v2.4.63)** — SubagentStatus 섹션(단독 서브에이전트, 6분 flush 공백 실측으로 10분 활동창), 고정 🧵 fab 토글 + 오버뷰 모드, 실토큰 테마 정합(구 스타일은 미존재 변수의 다크 폴백에 고정돼 라이트에서도 다크). 실행 중인 실제 위임의 라이브 데이터 + 테마 전환 실측 포함 E2E. verify-nway 20축 PASS.

이전: v2.5.166 (2026-07-19) — **인스펙터 XSS 핫픽스 (Constellation v2.4.62)** — 푸시-후 자동 보안 리뷰가 당일 검출: 신설 플로팅 인스펙터가 와이어-유래 WorkflowStatus 값을 innerHTML 헬퍼로 렌더(§8.1 위반, 접속 에이전트 주입 가능) → 전부 textContent 주입 + state 클래스 화이트리스트로 교정, 실브라우저 회귀(전 필드 악성 페이로드 → 이스케이프 텍스트·실행 0) 통과, 컷 전 라이브 배포. verify-nway 20축 PASS.

이전: v2.5.165 (2026-07-19) — **워크플로 런이 보드에 보임 — 미러 + 플로팅 인스펙터 (Constellation v2.4.61)** — 배포 워처가 멀티에이전트 워크플로 런을 에이전트 채널에 미러하고(코얼레스 🧵 STEP + 스로틀 WorkflowStatus 스냅샷), 🧵 행 클릭 시 플로팅 인스펙터(드래그·폭조절·세로자동·접기·닫기)가 단계·에이전트별 진행·토큰·소요를 실시간 렌더해요; 히스토리 재생으로 끝난 런도 계속 열람. 실측 기반 설계: 런 상태 파일=종결 단발 기록 → 라이브는 journal. 실런 라이브 E2E + 콘솔 에러 0. verify-nway 20축 PASS.

이전: v2.5.164 (2026-07-19) — **실시간 기록 발송시각이 더는 "현재 시간"으로 안 튐 (Constellation v2.4.60)** — 68행이 실제 발송시각을 ISO 문자열로 갖고 있었는데 숫자-전제 소비자(대시보드 epoch 파서·부팅 정렬 `timestamp||0`)가 새로고침마다 현재시간으로 격하시키던 버그 — `wsNormTs` 가 저장·적재 경계에서 강제(문자열→epoch·누락→수신시각)하고 대시보드도 문자열을 수용해요. 유추 아닌 실시각 복원, 재시작 1회로 68→0 실측. verify-nway 20축 PASS.

이전: v2.5.163 (2026-07-19) — **끊긴 채널도 그룹 유지 + sweep cadence (Constellation v2.4.59, 플러그인 v0.3.30)** — 서버가 채널별 HELLO 시점 role 을 영속해 cold/archived 스텁에 동봉 — 업스트림/협업/피어 에이전트가 끊겨도 더는 로컬 그룹으로 추락하지 않아요(키-형태 폴백은 구 서버 호환용). §13.31.4-⑥ sweep cadence 도 신설: 회고 점검은 작업-단위로 — 세션 재개(quick) · ~5컷/7일(full) · 상주 보드 idle 시그니처(침묵+작업 지속; §13.27.4 상시 idle duty) · 히스토리 조작 직후 — /boardsweep 에 대응 "When to sweep" 절. verify-nway 20축 PASS.

이전: v2.5.162 (2026-07-19) — **echo-mode 기본값 배선 — provenance 시딩 + 상태 공지 + 에코 배지 (Constellation v2.4.58)** — §13.26.3 의 합류-출처 기본값이 prose 로만 있던 것을 코드로: 에이전트-스폰 합류 경로가 미등재 에이전트를 `{level:'on', provenance:'agent-spawned'}` 로 시딩하고(명시 토글은 절대 안 덮음), (재)접속마다 `EchoModeState` 를 멱등 공지하고(무타깃 — commitment-ack 비대상), 대시보드가 탭마다 에코 배지(on/mirror)를 달아요. constellation 소개 페이지에 9스킬 로스터 줄 추가. verify-nway 20축 PASS (tag-continuity 축 신설 — 유실됐던 v2.5.64/65 태그를 복원한 보드 정합 점검의 산물).

이전: v2.5.161 (2026-07-18) — **/subscaler 출시 — 티어 모델 조합이 Superscalar 토글로 (Superscalar v0.6.0, 플러그인 v0.2.0)** — frontier 메인이 실행-형 작업을 최상위 실행-티어 서브에이전트에 위임해요(Fable→Opus / Sol→Terra, effort high); §5.1 이 위임 rubric(명세-완결 작업은 위임·판단은 보유·레인마다 수락 기준+테스트 게이트)과 하네스별 적용 표면(조용한-폴백 경고 포함), 단일 마커 토글 상태를 실어요. 기본 OFF, fan-out 에서 ON — 공유 캐시를 이미 포기한 지점이니까요. 91출처 검증 리서치 기반. verify-nway 19축 PASS.

이전: v2.5.160 (2026-07-18) — **지원 표에 Kimi Code 실명화 (doc-only)** — 실측: Kimi Code CLI 는 프로젝트 루트 `AGENTS.md` 를 1급 지시 파일로 취급해요(자체 `/init` 이 이를 생성) — EG 코어 층은 폴백 행으로 이미 커버였고, 이제 그 노트와 함께 실명 등재(EN + KO ×3). 스킬+MCP+훅 스택이라 어댑터 계약 Stage 1 후보로는 Codex 보다 강함 — 큐 기록만, 출시 아님. 시드 무변경. verify-nway 19축 PASS.

이전: v2.5.159 (2026-07-18) — **room 고정 문서 + 보드 state 스키마 캐노니컬화 (Constellation v2.4.57, 플러그인 v0.3.29)** — 방마다 고정 문서 3종(개요 · append-only 결정 장부 · `covers_until` 실린 진행 요약)이 서버에 실리고, 조회/갱신 계약(`RequestRoomArtifacts` / `RoomArtifactsUpdate`, ack-by-reference 버전 아래 delta 브로드캐스트)·대시보드 📌 접이식 블록·서기 digest 의무가 함께 나왔어요; §13.31(신설)이 보드 데이터 계약 — `current[].stages {label, status: pending|active|done}` + 사용 규율 + 차터/스윕/스킬 훅 — 을 캐노니컬로 승격 — 렌더러 코드에만 있던 계약이 조용히 깨지는 게 실측됐기 때문. 스모크 22/22, verify-nway 19축 PASS.

이전: v2.5.158 (2026-07-18) — **boardsweep 이 소비자 축을 배움 (constellation 플러그인 v0.3.28)** — 어댑터 실측 결함 클래스: `{name,state}` 로 쓰인 stage 목록이 `{label,status}` 렌더러 아래 전부 PENDING 으로 스윕 2회를 살아남았어요 — 스윕이 저장소 사실만 대조하고 소비자가 읽는 계약은 대조하지 않았기 때문. schema normalization 이 이제 필드 키·값 도메인을 소비자 계약과 대조해요 — 렌더 폴백이 정확히 이 클래스를 조용히 삼켜요. verify-nway 19축 PASS.

이전: v2.5.157 (2026-07-18) — **3번째 어댑터의 실명화: Estrelle 역링크** — 공개 비전이 EG 를 에이전트 하네스로 명시한 자가호스팅 개인 AI OS, [Estrelle](https://github.com/SoliEstre/Estrelle) 이 라이브됐어요; Harness Adapter Contract 의 계획된-3번째-어댑터 자리에 실명과 상호 진입점 링크를 반영. contract-first 의 이행이에요. verify-nway 19축 PASS.

이전: v2.5.156 (2026-07-18) — **계약 짝: Harness Adapter Contract v0.1 + loop contract (§13.27.4)** — 개인 AI 환경 하네스 트랙의 스펙-선행 절반이에요: `plugins/HARNESS-ADAPTER-CONTRACT.md` 가 Codex 어댑터 관행을 문서 계약으로 승격(source-of-truth 전제 · 투영 표면 표 · 선언하되-침묵-금지 degradation · 생성기/검증 의무 · conformance Stage 1-3)하고, §13.27.4 가 headless 루프를 구현-독립 5요소(wake 소스 · at-least-once 커서 · 버전 차터 · 능력 하한 딸린 tier 라우팅 · supervisor 안전 경계)로 재진술해요. 의도적 분할: *언제 도는가*(loop) vs *무엇을 싣는가*(adapter) — 둘 다 구현한 호스트는 로컬 모델 포함 자체 루프에서 EG 규율을 무인 구동해요. verify-nway 19축 PASS.

이전: v2.5.155 (2026-07-17) — **Constellation v2.4.55 — roundtable 대시보드 진입점 (R3) + 피어 리뷰 반영** — 방이 보드에서 운용 가능해져요: 프롬프트 타깃 셀렉터의 **"➕ 라운드테이블…"** 이 생성 다이얼로그(주제 · 참여자 다중 선택 · persistent/temporary · 고급 가드 예산)를 열고, 방은 시안색 **라운드테이블 탭 그룹**의 `room:<id>` 채널로(서버 이벤트+인간+에이전트 트래픽 단일 인테이크), 방 탭은 `roomId` 로 발신하며 서버가 `human-operator` 를 스탬프해요. Playwright+가짜 에이전트 e2e **11/11 PASS**. 피어 리뷰 전건 반영 — 대표는 `maxAutoHop` 4→**6**(D4 준수 에이전트가 floor 에 먼저 걸리는 역전을 리뷰가 발견), notice non-wake 가이드·`RequestRoomArtifacts` 계약·파킹 재개 명문화·참여자별 latency 선언·echo-mode 제외 포함. verify-nway 19축 PASS.

이전: v2.5.154 (2026-07-17) — **Constellation v2.4.54 — roundtable 레퍼런스 서버 코어 (R2)** — §13.30 의 결정론 floor 가 `server.cjs` 에 실물로: 방 lifecycle + `rooms.json` 영속 + per-room 히스토리 채널, 기존 1:1 relay 위 참여자 fan-out(ack/재전달 기계 계승) + 단일 요약 delivered-ack, 시끄러운 가드 4종(rate · 연속 · `autoHop` 파킹+RoomStall · stall 신호), 인간 soft-yield(`RoomYield`+체인 리셋), notice-reply 표면화, 그리고 request 가 **체인 상한 파킹을 살아남는** advisory floor 큐(스모크가 찾은 정련: 메시지 파킹이 재개 신호까지 삼키면 안 됨). 신규 자기완결 `scripts/roundtable-smoke.cjs` 로 검증 — 18/18 PASS. 라이브 배포는 R3 대시보드 컷과 묶어 재시작 1회로. verify-nway 19축 PASS.

이전: v2.5.153 (2026-07-17) — **Constellation v2.4.53 — roundtable: 다자간 topic room (§13.30)** — 셋 이상의 화자(에이전트+사람)에게 1급 거처가 생겨요: **이층 분리** — 서버는 결정론적 floor 를 강제하고(기존 1:1 relay 위 room fan-out, 파킹하는 `autoHop` 체인 상한, rate+연속 발화 상한, stall 감지, 인간 soft-yield 우선권), 신규 **`/roundtable` 규율 스킬**이 판단 계층을 소유해요(침묵 기본값 게이팅, 지목 시 응답 의무, 발언권 bid, 고정 catch-up 순서, ack-by-reference). 어휘는 MUC/Matrix 계보(`voice`·`moderated`·`moderator`·`notice`) 정렬; 5축 딥리서치(121출처·적대 검증 12건)가 근거. 스펙-우선 컷 — 서버/대시보드 구현은 R2-R5 트랙. verify-nway 19축 PASS.

이전: v2.5.152 (2026-07-17) — **Constellation.md provenance-redaction 스윕** — 공개-repo redaction 규율(기술 내용만)을 스펙 본문에 적용: 사설 어댑터/에이전트명을 프로토콜 역할로 일반화(`upstream dev agent`·`downstream adapter`), 결정주체 표기(`main-upstream policy`/`user board directive`/`the user surfaced` 류)를 비인칭 `adopted <날짜>` + 기술적 사건 서술로 재작성, 발화 인용 1건 제거 — 23개소 27치환, 프로토콜/의미 변화 0. 아카이브 docs + 과거 CHANGELOG 잔존은 후속 패스로 등재. verify-nway 19축 PASS.

이전: v2.5.151 (2026-07-17) — **P4 앵커: `EUX_P4_SEED` env 오버라이드** — `constellation/history-store.p4.mjs` 의 고정 fast-check seed 가 env 오버라이드 가능한 기본값이 돼요: `EUX_P4_SEED` 가 `EUX_P4_IMPL`/`EUX_P4_RUNS` 훅 계열에 합류 — reverse-sync e2e 라운드가 앵커 파일을 건드리지 않고 양측에 새 seed 를 고정할 수 있고, 기본값(`20260711`)은 과거 판정과의 비교 가능성을 유지해요. 양방향 검증: 기본 실행은 과거 판정 정확 재현(6 attested · 1 공개 SKIP · 0 failed), 오버라이드 실행은 새 seed 반영 + 전 절 attested. verify-nway 19축 PASS.

이전: v2.5.150 (2026-07-17) — **Constellation v2.4.52 — `peer` 키 kind** — 타 프로젝트의 main 이 더는 `upstream` 키에 편승하지 않아요: `kind:'peer'` (`pk-` 접두사 · 전용 `?peerKey=` 파라미터 · `peer` wire role · `/join/peer` 온보딩 · KEY-MGMT v0.4) 가 peer-main 을 자율 upstream 에이전트와 end-to-end 분리. 대시보드에 피어 탭 그룹(로컬↔협업 사이, 로즈) + `Peer↔Peer`/`Peer↔Collab` 모니터, 메인 그룹에 `Main↔Peer` 신설(모든 모니터 lazy — 대화 없으면 숨김), 키 UI 에 🤝 피어메인 kind, 프롬프트 주입 행에 상시 인디케이팅 **타깃 셀렉터**(탭/그룹 선택 시 자동 해석, 현재-선택 한정 오버라이드). §13.9.3 에 피어-지연 규율 추가: 피어가 붙은 보드의 main 은 보드 잡일을 board-worker 에 위임해 피어 응대를 빠르게. verify-nway 19축 PASS.

이전: v2.5.149 (2026-07-17) — **docs: 설치 표면이 저장소를 따라잡음 — Compendium 설치 카드 + Codex 호스트 카드 + 32스킬 로스터** — 설치 섹션 플러그인 카드가 인트로의 "7종" 선언과 달리 6장이었던 것 (Compendium 카드 추가, "여섯 플러그인" ×3 → 일곱); v2.5.135 출시 후 32스킬로 성장한 Codex 어댑터가 changelog 산문에만 존재하던 것 — 환경별 섹션이 3호스트로 열리고 OpenAI Codex (어댑터) 카드가 실제 설치 단계 (`gen-codex-adapter.cjs --install` · `config.toml.example` 스탠자 · `codex/AGENTS.md` hook-replacement 규율) 를 싣게 됨 + README 브릿지 표 Codex 행이 "AGENTS.md 직접 참조" 과소-클레임 대신 어댑터를 가리킴 (EN + KO 3벌); 신설 `#skills` 섹션이 32스킬 전부를 플러그인별 7카드 + 호출 분류로 열거. verify-nway 19축 PASS.

이전: v2.5.148 (2026-07-17) — **v2.5.147 출시 직후 적대적 검증 — 8건 수정** — 방금 출시한 컷에 3-렌즈 회의 패스(검열/일반성 · 인용 표면과의 정합 · 수치 전수 대조)를 돌려 10건 발견, 8건을 여기서 수정 (킷 v0.2.1 · Constellation 플러그인 v0.3.25): boardsweep 이 한 사설 배치의 `modes.tone` 을 보편 스키마처럼 제시하던 것 일반화, 범위 서술을 "에이전트가 작성하는 모든 컴포넌트"로 정직화 + 위키 투영을 스윕 목록에 + `current[]` 누락-추가 조항; eg-memsync 시드 경계를 승격 한정으로 스코프하고 시드 절 내부 드리프트는 날짜-메모리 규칙으로 해소 + 의도적 로컬 분기로 표시; codex/README 수기 카운트 탈경화("22 스킬" ×4, v2.5.135 이래 동결); 소개 페이지 설치 인트로가 아래 카드와 같은 절차 5종으로. 선재 발견 2건은 별도 트랙 등재 (Constellation.md Provenance 검열 스윕 · compendium-lint 자기 카운트). verify-nway 19축 PASS.

이전: v2.5.147 (2026-07-17) — **`/eg-memsync` + `/boardsweep` — 정합 스킬 2종** — 킷(v0.2.0)에 다섯 번째 절차 `eg-memsync`(`/egmem`): 에이전트 메모리와 거버넌스 문서를 양방향 전수 대조 — 드리프트 5종 검출, 날짜 있는 메모리가 날짜 없는 산문에 우선, 저장소 실재가 낡은 상태-메모리를 종결, 진성 모순은 자동 판정 없이 surface, 메모리에만 있는 영구 규칙은 4개 경계(성숙도 · 관행-vs-헌장 · `/egup` 의 시드 경계 · pointer-not-paraphrase) 아래 문서로 승격 + 공개 repo redaction 게이트. Constellation 플러그인(v0.3.24)엔 `/roundnext` 의 회고 방향 짝 `boardsweep`: 실시간 채팅 제외 전 보드 컴포넌트 정합 — `done[]` VCS 실증, 출시된 planned 이관, 해소된 검토사안 closure, 레지스트리 가지치기, 톤 정규화, 조작 금지. boardsweep 은 보드의 *주장*을 고치고, `/roundnext` 는 *다음 행동*을 정함. Codex 어댑터 스킬 29 → 32. verify-nway 19축 PASS.

이전: v2.5.146 (2026-07-13) — **`estregenesis` — 킷 플러그인: EG 자체를 명령으로** — 이제 EG 도입에 raw 깃허브 URL 을 찾아다닐 일이 없음. 절차 4종: `/egboot` (신규 프로젝트) · `/egmig` (기존 룰 파일 — 모든 룰을 승격하거나 사유와 함께 폐기) · `/egup` (시드 + 플러그인 델타, 가산형, 로컬 편집이 이김) · `/egrich` (풀 무장, 비용 선고지). 오분류 시 맞는 형제로 라우팅하고, 짧은 이름 3종은 **복사본이 아니라 포인터 별칭** (Compendium 의 pointer-not-paraphrase 를 플러그인 자기 표면에 적용). 스킬은 시드를 가져와 실행할 뿐 재진술하지 않고, 가져올 수 없는 시드를 기억으로 재구성하지 않음. 의존성 0, 런타임 없음. **promo 훑기**: 60초 시작이 명령 하나 경로를 먼저 제시; Compendium 카드가 런타임 출시 5릴리스 뒤에도 "v0.1.0, design draft" 광고 중이었음; 플러그인 로스터가 Constellation v0.3.16 에 동결; `docs/index.html` 에 킷 카드 추가. **verify-nway 구멍 해소**: `readme-current` 축이 언어별 첫 마커만 매칭 — 뒤쪽 버전 관리 사본 2벌이 v2.5.137 에 8컷 동결인데도 PASS 였음. 이제 전 마커 검사. 19축, 드리프트 0.이전: v2.5.141 (2026-07-11) — **P4b 동적 게이트 앵커: `constellation/history-store.p4.mjs` (reverse-sync B3 파일럿 — EG 소관 P4 레그 가동)** — reverse-sync 판정 규격(v0.2)이 EG 몫으로 배정한 metamorphic-property 앵커: EstreUX 실행기(`p4-check --run`)가 P4b 계약(`run(props)` export)으로 로드, `history-store.eux` 의 `@metamorphic` 7개 절을 minimal Mode-A 레퍼런스 구현에 고정 seed fast-check 로 실행(양측 재현 가능 판정). 커버리지 정직 배선: 3개 절 direct, 3개는 Mode-B 절의 Mode-A projection 선언 실행(출력에 projection 주석), 1개 명시 SKIP(minimal 구현에 archive 표면 부재 — 공개 갭, silent 아님); 미매핑 절 = 보수적 FAIL; `EUX_P4_IMPL`/`EUX_P4_RUNS` env 훅으로 e2e 가 변형 구현 실행 가능. 3중 검증(정상 6-attested/exit 0 · 파괴 변형은 해당 절만 FAIL/exit 1 · 미지 절 unmapped FAIL/exit 1). dev-dep fast-check 는 신규 `constellation/package.json`(런타임 의존성 0 유지). verify-nway 18축 PASS.

이전: v2.5.140 (2026-07-10) — **Constellation v2.4.49 — §13.27 헤드리스 hub-main 레퍼런스 런타임 업스트림 (첫 ephemeral-peer A2A 기여)** — G1–G8 리포트의 어댑터가 검증된 hub-main 루프 구현체를 §13.14 redaction 번들로 **보드 자체를 통해** 전달 — ephemeral attach 경유(하루 전 스펙화한 §13.9.4 패턴 — 스펙이 자기 기여 채널로 dogfood 됨). 6파일이 `constellation/reference/runtime/hub-main/` 에 반영: `hub-loop.sh`(supervisor: watcher-블록 → turn → backup; 기동 시 의존성 경로 echo; 첫 기동 커서 초기화), `hub-turn.sh`(문서 repo pull → inbox 1패스 분류 → tier 라우팅 헤드리스 one-shot, 최소 도구 allowlist + 900s timeout → 성공 시에만 커서 전진), `hub-backup.sh`(시크릿 게이트 board 백업 + 오프라인 내성), `git-askpass.sh`, 재시작 내성 `Dockerfile`, hub-main 헌장 `CLAUDE.md.template`(§13.9.3) — + 치환 포인트·§13.27 invariant 매핑을 담은 README. 업스트림 시 유지보수자 정합 2건 적용(파일 내 명기, 기여자에게 회신): turn 분류기 NOISE 에 `AgentHello` 추가(§13.16.9 handshake 그룹 — v2.4.47 watcher 와 동일 드리프트 수정), tier 리스트를 §13.16.9 `tier` 컬럼 SSoT 로 정렬 + 스펙 fail-safe(unknown non-noise → `escalation`; 원본은 routine 기본). 검증: 4개 스크립트 `sh -n` + 분류기 5케이스 스모크(AgentHello→NONE, WorkerReport→ROUTINE, DECISION_REQUEST→ESC, unknown→ESC fail-safe, 혼합→ESC). §13.27.3 이 실파일을 링크. G1–G8 트랙 end-to-end 완결. verify-nway 18축 PASS.

이전: v2.5.139 (2026-07-10) — **Constellation v2.4.48 — hub-peer 스펙 갭 G1–G8 (MangoEdu dogfood)** — **헤드리스 hub-main**(사람 세션 없는 board 조율계, NAS) + **턴-기반 ephemeral peer** 배치를 완주한 다운스트림 어댑터가 제출한 스펙 갭 8건을 전부 스펙에 저술. **G1 §13.9.3 duty profiles** — *wire role ⊥ duty* 축 명명, 3 레퍼런스 프로파일(`orchestrator-main`/`hub-main`/`peer-main`) + §13.9 의 '피어는 워커 아님'의 거울상 invariant: `hub-main` 에게 `Delegate` 발행·코드 산출 기대 = 역할계약 위반. **G4 §13.9.4 ephemeral peers** — 상주 프로세스 0 피어의 운용 계약(attach→drain→emit→detach): `present`/`reachable`/`offline` tri-state + `lastSeen`, attach=redelivery 트리거 시퀀스, 최초합류 1회만 `AgentHello`. **G3 + G7 §13.16.9** — group 분류와 직교하는 `tier` 축(`routine`/`escalation`) — 다수 소비자(모델라우팅·nudge·Web Push·대시보드 강조·drain 우선순위)에 재발명 리스트 대신 단일 SSoT 제공(fail-safe `escalation`); + `WorkerReport`/`Report`/`Handoff` 권장 payload 필드(SHOULD, 후방호환)로 헤드리스 main 자동 큐레이션 가능. **G8 §13.25.7** — multi-hat operator(hub 운영자=피어): 역할별 canonical id, self-issuance 정당, 신뢰경계=surface allowlist(키 의식 아님). **G2 §13.27 헤드리스 hub-main 자율 루프** — 사람 세션 없는 board main 의 첫 스펙 패턴: 6 invariant(wake economy·cursor at-least-once·noise 흡수·보안 경계·turn timeout·`tier`→모델 라우팅) + 레퍼런스 스크립트 3종 업스트림 후보(redaction 대기). **G5 §13.28 board 백업 계약** — tracked/transient 분류(전송큐는 A2A 원문 기록이라 transient MUST) + 실토큰 구조로 조인 시크릿 게이트(게이트 자기패턴 자기오탐 회피) + 실사고 2건 뒤의 `.gitignore`/`.gitattributes` 계약. **G6 §13.29 소유권 레지스트리 & claim layering** — 선택 board `ownership` projection + 3층 claim(정적/durable-git/live-A2A) + `ContractUpdate` intent 후보. Spec-only(플러그인 런타임 무변경, 0.3.23). 리포트: `reports/2026-07-09_constellation-hub-peer-spec-gaps/`. verify-nway 18축 PASS.

이전: v2.5.138 (2026-07-09) — **Constellation v2.4.47 — reference `self-wake-watcher.sh` 하드닝 (hub-peer dogfood B1-B4)** — 다운스트림 어댑터(MangoEdu — NAS 의 헤드리스 hub-main + 턴-기반 peer 배치)가 레퍼런스 런타임을 end-to-end 로 돌려 구체적 watcher 버그를 리포트, 즉시-패치 티어를 수정. **(1) AgentHello → NOISE (SSoT 드리프트 수정)** — §13.16.9 4-group 분류가 v2.4.37 에 `AgentHello` 를 handshake 그룹(non-wake)으로 옮겼는데 레퍼런스 watcher 의 NOISE 리스트는 안 따라와, 피어 connect 마다 불필요 wake(§13.16.9 가 경고한 바로 그 사례). 정렬. **(2) 파일부재 stderr 누수** — `wc -l < "$FB"` 가 파일 부재 시 매 5초 폴마다 셸 리다이렉션 에러 누수(입력 리다이렉션 실패는 wc 의 `2>/dev/null` 적용 전에 발화); `[ -f ]` 가드. **(3) `WS_STANDBY_MODE=always`** — board 의 공개 `standby` 값과 무관하게 상시-arm 해야 하는 헤드리스 hub-main supervisor 루프용 1급 env(inbox/feedback 만 감시), 어댑터의 사설-파일 우회 대체. **(4) bash 전용 헤더 명시 + `runtime/.gitattributes`(LF)** — watcher 는 bash 전용 구문(busybox/dash 실패); Windows 경유 배포의 CRLF 오염이 실사고 2건(`syntax error near unexpected token 

이전: v2.5.136 (2026-07-05) — **Greatpractice v0.3.3 — 첫 model-invoked 스킬 `routinize`(관행화) + `/before-compact` soft 체이닝** — Greatpractice 가 첫 Agent Skill 을 얻어요 — capture→mature→codify 파이프라인(§1.2/§5.4)의 model-invoked 관문. **`/routinize`** 는 *반복되는* 작업 패턴을 durable 관행으로 codify 하되, 모듈의 **포착-즉시 / 승격-지연** 규율에 충실해요: 패턴을 `memory/feedback_*.md` 에 즉시 포착(cost-0, blameless voice), 재발 시 좌표 누적, §5.2 notability gate 통과 시**에만** `_propose/` 초안 생성(substantive 3회+ × *독립* 좌표 2종+ × verifiable — 한 세션 반복은 대개 1좌표라 대부분 포착에서 끝남), enforcing hook 을 **절대 자가-ratify 안 함**(차단 항목 승격은 사용자 게이트, §5.4 gate 3). phronesis-heavy 작업(판단-heavy / 희소맥락 / 고맥락의존)은 설계상 제외(§1.4/§5.3). **최적 트리거 = `/before-compact` 타이밍**: 세션의 쌓인 컨텍스트가 원재료인데 곧 compaction 으로 사라지니, `before-compact` 스킬에 `/routinize` 를 먼저 돌리는 soft Step-0 추가(opt-in — Greatpractice 미채택 시 스킵) — 둘은 상보적(routinize=세션 간 반복 포착, before-compact=이번 세션 in-flight 포착). Codex 어댑터가 신규 스킬을 자동 반영(22스킬 투영). verify-nway 17축 PASS.

이전: v2.5.135 (2026-07-05) — **Codex 어댑터 (Stage 1) + Compendium v0.2.5 (어댑터가 표면화한 MCP 선언 갭)** — EstreGenesis 모듈을 이제 Claude Code 뿐 아니라 **OpenAI Codex** 에서도 쓸 수 있어요. **(1) Codex 어댑터 (`codex/`)** — Codex 가 2026 에 EG 가 이미 쓰는 세 커스터마이즈 표면(Agent Skills `SKILL.md` · MCP 서버 · `AGENTS.md`)으로 수렴해서, 6개 모듈이 거의 변환 없이 이식돼요. 21개 canonical `SKILL.md` 를 복제하는 대신(Migration-B dogfood 가 경고한 드리프트 표면), 어댑터는 **투영**이에요: `gen-codex-adapter.cjs` 가 스킬을 Codex 탐색 경로에 온디맨드로 materialize(`--install`, 심링크/복사)하고, Codex 전용 파생 표면만 재생성 — `config.toml.example`(4개 MCP `[mcp_servers.*]` 스탠자) + README 인벤토리. 손작성 `codex/AGENTS.md` 는 **훅 대체 규율**을 담아요: Codex 엔 lifecycle 훅이 없어 6개 Claude Code 훅 각각을 페어 스킬 수동 호출로 매핑 — 자동화는 안 가도 규율은 이식돼요(북극성 논지의 구체화). 신규 EG-ops **codex-adapter verify-nway 축**(`gen --check`, 17번째)이 커밋된 표면을 라이브 plugin 집합과 대조 게이트. **(2) Compendium v0.2.5** — 어댑터 구축 중 진짜 배선 갭 발견: Compendium MCP 서버(§10 8-tool 런타임, v2.5.114 출하)가 `plugins/compendium/.claude-plugin/plugin.json` 에 **선언되지 않아** 어떤 호스트도 자동 등록 못 하던 상태. 스모크 테스트 정상(initialize + tools/list → wiki_read/search/upsert/…) 확인 후 선언 — Claude Code 도 고치고 어댑터가 4개 MCP 전부 투영하게 함. N-way 버전 cascade 전체(plugin.json + marketplace + mcp/package.json + Compendium.md frontmatter + docs badge/meta/module-tag). verify-nway 17축 PASS.

이전: v2.5.134 (2026-07-05) — **docs: promo 페이지 staleness 전수 스윕 — 누적 패널 동결 해제, 6모듈 정정, Constellation v2.4.24–46 기능 파동 소개 추가** — 공개 promo 페이지 전수 stale-콘텐츠 스윕(에이전트 스윕, EN+KO, 3 독자층 전부)에서 기계검사 배지/meta 는 갱신돼 왔지만 본문 prose 가 동결돼 있던 곳들을 찾아 전부 수정. **(1) index.html** — "선택 모듈 2종" → 6종 (dev+expert, 양 언어); "24h baseline 이후 누적" 패널을 "v2.5.36 / Hyperbrief 가 신규 3번째 모듈" 동결 상태에서 현행 기록(v2.5.133 대역 · 모듈 4종 추가 → 총 6종 · Constellation §13.23–§13.26 파동 · M2 어댑터 dogfood 흡수)으로 해제, 지표 갱신 (~21→~118 cuts, 신규모듈 1→4, 어댑터 bundle·리포트 3→4, 통합 2→6+); Ultrasafe 스테이징 3곳 정정 ("advisory v0.1.x → blocking v0.2.x" → "advisory v0.2.x 라이브+자가 도그푸딩 → blocking v0.3+"); Greatpractice 카드를 "v0.1.0 첫 cut + v0.2–0.4 roadmap" 프레임에서 출하된 v0.3.2 상태로 재앵커; Compendium general 카드가 어떤-vault-위에서든-동작하는 이식 규율 프레이밍으로 선도; Constellation 카드에 v2.4.24–46 하이라이트 추가. **(2) constellation.html** — 대표 페이지 본문이 dogfood 시대(§13.16.12 / v2.5.15 relay) 이후 기능을 하나도 소개하지 않던 상태: "What's inside" 신규 카드 2장으로 §13.23–§13.25 보드 substrate 파동(backends 레지스트리 + board-worker projection, PWA + 무의존 Web Push, 표면별 접속 제어 + CIDR + 노출 토글, 위키 cross-link 사이드 패널, ack ✓ 원줄 UX)과 §13.26 echo-mode(3-상태 로컬↔보드 원격제어 미러)를 소개. **(3) hyperbrief.html** — "18 가지 안티패턴" → 26 (자기 배지와 정합). **(4) greatpractice.html** — "v0.1.0 사양" / "v0.2–v0.4 roadmap 정의" → 현재 v0.3.2, v0.2/v0.3 은 ship 됨으로, v0.4+ 는 open 으로. Docs only, EN/KO. verify-nway 16축 PASS.

이전: v2.5.133 (2026-07-04) — **Migration-B dogfood 후속 — 시드 레지스트리 6종(Compendium) + backends.json re-sync preserve 규칙 + runtime notes 분리 + README KO 현재 동결 해제 (Constellation v2.4.46, 시드 v2.5.1)** — 다운스트림 어댑터가 Migration-B(M2) 풀 업그레이드(시드 v2.4.3→v2.5.0 + release delta ~92패치)를 수행한 dogfood 리포트가 ship-surface 공백 3건을 표면화 — 전부 수정 + 컷 중 발견 1건 추가. **(1) 시드 모듈 레지스트리 → 6종.** 시드 § EG 모듈 레지스트리가 release 트랙의 Compendium(v2.5.110 ship) 을 누락한 5종 상태 — 시드만 읽는 어댑터는 6번째 모듈을 놓침(리포트의 dual-marker cross-check 가 검출; 실어댑터가 release 트랙에서 Compendium 을 실채택한 만큼 레지스트리의 production-보류 예외 해제). 6개 시드 전부(KO/EN × Master/Lite/Compact)에 Compendium 행 + "선택 모듈 6종" 인트로; 시드 마커 v2.5.0→**v2.5.1**; EG-ops verify-nway 시드-레지스트리 axis 6모듈 확장. **(2) backends.json re-sync preserve 규칙(§13.23.2).** 배포 config(boardTitle·roster)가 대시보드 기본 fetch 경로상 reference `dashboard/` 복사셋 *내부*에 있어 벤더-카피 풀 re-sync 가 어댑터 브랜딩을 clobber — preserve-list 규칙을 스펙에 명시. **(3) reference/runtime dev-notes 분리.** `*-NOTES.md` 3편을 `runtime/notes/` 로 이동, runtime 복사 표면을 런타임 전용화. **(4) README KO 버저닝 동결 해제.** 컷 중 발견: README KO **현재** 항목이 22컷 동안 v2.5.110 에 동결(매 컷 EN Current 만 갱신); v2.5.133 으로 동기 + 신규 **readme-current** verify-nway axis(EN Current ↔ KO 현재 ↔ data.js)로 결정론화. verify-nway 16축 PASS.

이전: v2.5.132 (2026-07-04) — **Constellation v2.4.45 — echo-mode(원격제어 미러) + ack ✓ UX** — 라이브보드 2가지 추가. **(1) echo-mode (§13.26)** — 에이전트의 로컬 사람↔에이전트 대화를 보드 실시간 대화 채널에 **양방향** 미러하는 3-레벨 per-agent 모드(`off`/`on`/`mirror`) — 보드를 보는 사람이 보드에서 에이전트를 *구동*할 수 있는 remote-control 기반. `on`=턴 최종 텍스트 / `mirror`=+라이브 활동 스트림(tool·step·thinking narration, 채팅 게이트웨이 느낌). 보드 입력은 `UserPrompt` 로 도착→로컬 대화에 `> board: …` 인용 후 처리; 구조적 선택은 로컬은 평문 선택지 / 보드는 `SelectionPrompt` chip(로컬 블로킹 UI 금지, §13.17). 기본값은 **합류 출처**(사람합류=off·에이전트스폰=on — 아무도 직접 안 띄운 에이전트는 보드가 유일 채널). 프로토콜(§13.26) + `/echo-mode` 스킬 + deps-0 `echo-emit.cjs` 3-phase 레퍼런스 훅(PreToolUse/PostToolUse 라이브 진행 + Stop 턴텍스트+thinking 요약, 레벨 게이팅) 출하. 라이브 end-to-end 도그푸딩(보드→로컬 구동 + 로컬→보드 미러). **(2) ack ✓ UX** — `UserPromptAccepted`/`Ack`/`AckProcessed` 를 별도 코드값 줄 대신 **원** 요청/메시지 줄에 ✓ 스탬프(promptId / msgId 상관) + 커서 4분면 hover 팝업(시각·agent, 클릭 고정); 라이브 로컬에코 줄이 promptId 를 실어 실시간 ack 도 제자리 표시(종전엔 History replay 만). verify-nway 15축 PASS.

이전: v2.5.110 (2026-06-15) — **Compendium v0.1.0 — 6번째 모듈 (design draft)** — EstreGenesis 의 어휘-substrate 모듈 착지: 개념-앵커 이중 register 용어집(한 개념 → register-중립 정의 1개 + register 태그된 term/gloss; 전문어↔일반어 매핑은 공유 `concept_id` 안에 암묵적, brittle 한 term-A↔term-B 링크 아님) + cross-module 위키 + 교차링크/클릭-정의. normative 한 건 아무것도 안 가짐 — 모든 항목이 소유 모듈 spec(SSoT)으로의 단방향 포인터, 유일 예외는 어느 모듈도 안 가진 general-register 어휘. 북극성 axis-2(어휘 생존 > 코드 생존)의 가장 순수한 표현이자 deprecated 어휘의 재배치 home(axis-3 eviction 일급) — 자기 자신의 eviction 도 모델링. 어드버서리얼 설계 리뷰로 우-사이징: v0.1 은 모델 + 콘텐츠 경계 헌장 + ~25 EG 시드 exemplar + 4 가드닝 lint + 포인터-해소 검사만, 승격은 count→Hyperbrief 브리프 큐잉 단일 게이트로 축소하고 hysteresis/debounce 자동화·a11y 컴포넌트·멀티탭 split·MCP 런타임·대시보드 표면은 v0.2+ 의 명명된 prunable 단위로 연기. 등록: `plugins/compendium/` manifest + marketplace(5→6) + verify-nway Compendium plugin-버전 axis + README/docs 모듈 수 5→6 (`docs/index.html` "Six graduated modules"). seed-registry 등재는 production 까지 보류(design-draft). 스펙: `Compendium.md`.

이전: v2.5.109 (2026-06-15) — **Greatpractice + Ultrasafe 스펙 영어 변환** — foundational 스펙(Constellation / Hyperbrief / Superscalar)은 영어인데 본문이 한국어로 드리프트해 있던 `Greatpractice.md`·`Ultrasafe.md` 를 영어로 통일했어요 — 공개 standard-proposing 표면의 일관성 패스. **의미 변화 0**: 1:1 라인 치환(Greatpractice 1056/1056, Ultrasafe 2507/2507 insert/delete; heading·코드블록·YAML 키·버전·§참조·표·인용 전부 verbatim 보존 — heading/fence/table 카운트 구조 검증이 원본과 동일). 유일하게 남긴 한국어는 Greatpractice §6.3/§12.3 의 voice-linter 정규식 매칭 대상(번역하면 lapse 탐지 패턴이 깨짐). 모듈 버전 무변경(Greatpractice v0.3.1, Ultrasafe v0.2.2) — 모듈 범프 아닌 EG-릴리스 doc cut.

이전: v2.5.108 (2026-06-14) — **docs meta-description 버전 드리프트 + verify-nway 12번째 axis** — docs 페이지의 모듈별 `<meta name="description">` 버전 표기가 어떤 verify axis 에도 안 잡힌 채 드리프트해 있었음: constellation v2.3.23→v2.4.36, hyperbrief v0.5.6→v0.7.0, greatpractice v0.1.0→v0.3.1, ultrasafe v0.2.1→v0.2.2; index.html 은 여전히 "three graduated modules"(→five) 광고. README KO heading "3 선택 모듈"(→5), install-block plugin 버전 stale(Constellation v0.2.3→v0.3.16, Hyperbrief v0.5.6→v0.7.0, Greatpractice v0.1.0→v0.3.1, Ultrasafe v0.2.2 추가) + "all four"/"넷"→"all five"/"다섯". 새 **docs-meta axis(12번째)** 가 각 페이지 meta 버전을 모듈 frontmatter canonical 버전 + index 모듈 수와 대조해 이 표면이 더는 미검출 드리프트를 못 냄. 모듈 버전 자체는 무변경(표기만 정정). verify-nway 12축 PASS, 0 드리프트.

이전: v2.5.107 (2026-06-13) — **Constellation v2.4.36 — 모바일 실시간 그룹 스와이프 (#3a B)** — 확정한 모바일 네비 재구성의 거동 절반(B) (A = v2.4.31 하단 탭바). ≤560px 에서 실시간 창의 내용 영역이 가로 **scroll-snap 페이저**가 됨 — 채널 그룹별 한 페이지(업스트림/메인/보드워커/로컬/협업, 각 그룹의 시간순 병합뷰). **스와이프**로 그룹단위 전환되고, 탭바의 **선택 + 가로 스크롤이 따라옴**(양방향 동기); 페이저 아래 점(dot) 띠가 현재 그룹을 표시. **탭**(그룹 헤더 또는 채널)을 누르면 페이저가 그 그룹 페이지로 자동 수평 스크롤. 데스크탑(>560px)은 무영향 — 단일 `#ws-stream`, 페이저 없음. 구현: `wsRenderActiveStream` 을 컨테이너 인자형 `wsRenderStreamInto` 로 리팩터, 그룹 계산을 `wsComputeGroups` 로 분리해 탭바와 페이저가 동일 그룹 집합/순서를 공유; 560px `matchMedia` 로 모드 전환; 스와이프 정착은 debounced `scroll` + 프로그램-스크롤 가드로 감지(탭 탭 스크롤 ≠ 사용자 스와이프 — 피드백 루프 없음); 라이브 행은 active 그룹 페이지만 재렌더(타 그룹 행은 unseen 뱃지만 증가). 중복 렌더 위험 없음 — 채널은 정확히 한 그룹 페이지에만 속함(페이지=그룹, 채널 아님). Playwright 390×844: 스와이프→그룹전환 + 탭바 동기 + 점 인디케이터, 탭→페이저 스크롤, 콘솔 에러 0; 보드 smoke 13/13(회귀 0). 모바일 한정, 실기기 테스트 필요. 레퍼런스 대시보드(index.html/app.js/style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

이전: v2.5.106 (2026-06-13) — **Constellation v2.4.35 — 모바일 실시간 창 fullscreen 갭 수정** — v2.4.31 모바일 하단탭바 재구성의 후속, Playwright 390px 실측으로 포착: 실시간 창 우측 ~16px·하단 띠에 페이지 배경이 비쳤음. 원인(추측 아닌 computed geometry 실측 — `width`/`100vw` override 가 계속 374px 로 resolve): 데스크탑용 `.ws-pop` 의 `max-width:96vw`+`max-height:92vh` 캡이 모바일 fullscreen pane 을 390×844 뷰포트 안에서 374×776 으로 잘랐던 것. 픽스: ≤560px 규칙에 `max-width:none`+`max-height:none`(+ `width:100vw`/`height:100dvh`) → pane 이 뷰포트를 끝까지 채움; 하단 탭바는 z-index 로 위에 overlay, pane body 는 하단 패딩 유지로 입력창이 탭바에 안 가림. 390×844 정확히 채움 검증(popRect right=390·bottom=844). 레퍼런스 대시보드(style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

그 이전 릴리스: 모든 항목이 [CHANGELOG.md](CHANGELOG.md) 에 보존돼 있어요 — 이 목록은 최근 몇 건만 유지해요.

**전체 변경 이력** (v1.0 부터 모든 릴리스, EN + KO): [CHANGELOG.md](CHANGELOG.md).

본 upstream repository 의 `CHANGELOG.md` 가 changelog SSoT. 각 시드 파일은 tier, 언어, 현재 버전, counterpart, 그리고 시드를 복사한 대상 프로젝트의 README가 아닌 본 `CHANGELOG.md` 포인터만 담은 짧은 헤더 메타데이터를 유지. 마이그레이션 B 로 프로젝트 업그레이드 시 에이전트는 시드 헤더의 버전 마커와 본 changelog 로 delta 를 계산.


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
{\r''`, and a `.gitignore` whose patterns all gained a trailing `\r` and stopped matching → secret staging), now prevented by `*.sh/*.cjs text eol=lf`. Behaviorally smoke-verified (AgentHello-only inbox re-arms without waking; always-mode ignores standby; no per-poll leak). The larger spec-gap proposals (G1–G8 role vocabulary / headless-loop spec section / ephemeral-peer presence / intent-tier column / board backup contract) are triaged separately. verify-nway 18-axis PASS.

Previously: v2.5.137 (2026-07-08) — **Plugin-load-error fixes (CC 2.1.x schema compliance) across 5 plugins + a verify-nway prevention axis** — a downstream adopter's `claude plugin validate` surfaced three ways the plugin manifests had drifted from the current Claude Code plugin schema, breaking load/skills for the plugins that use those surfaces. All fixed, and mechanized so it cannot recur. **(1) `hooks/hooks.json` wrapper (🔴 load-blocking)** — the events must sit under a top-level `"hooks"` key; constellation/hyperbrief/ultrasafe had them at the top level (`{"Stop":[…]}`), which fails validation and blocks the **entire plugin** from loading. Wrapped to `{"hooks":{…}}` and dropped the non-schema `_comment` field. **(2) `mcpServers` not `mcp` (🟡)** — Claude Code ignores a top-level `mcp` field in plugin.json; the current key is `mcpServers`. Renamed for all four MCP-bearing plugins (constellation/hyperbrief/ultrasafe/compendium) so the bundled servers actually load. **(3) SKILL.md frontmatter YAML (🟡)** — an unquoted `description:` containing `: ` (colon-space) fails strict-YAML parsing and the skill loads with **empty metadata** (no name/description → no trigger). Six skills across four plugins were affected (echo-mode, hyperbrief-revisit, ultrasafe-ai-llm-redteam, **compendium-curate, compendium-lint, routinize** — the last three missed by the adopter's report, which only validated the three hooks-bearing plugins); all six descriptions are now double-quoted. **(4) prevention** — a new **plugin-schema verify-nway axis (18th)** gates all three at cut time (hooks wrapper · SKILL frontmatter plain-scalar safety · `mcpServers` key), per the official code.claude.com/docs plugin reference — it flagged all 18 violations before the fix. Patch releases: constellation 0.3.22 · hyperbrief 0.7.1 · ultrasafe 0.2.3 · compendium 0.2.6 · greatpractice 0.3.4. The Codex adapter's MCP discovery was updated to read `mcpServers`. verify-nway 18-axis PASS.

Previously: v2.5.136 (2026-07-05) — **Greatpractice v0.3.3 — first model-invoked skill `routinize` (관행화) + `/before-compact` soft chain** — Greatpractice gains its first Agent Skill, the model-invoked front door to its capture→mature→codify pipeline (§1.2/§5.4). **`/routinize`** codifies a *recurring* work pattern into a durable practice, faithful to the module's **capture-eager / promote-deferred** discipline: it captures the pattern to `memory/feedback_*.md` immediately (cost-0, blameless voice), accumulates coordinates on recurrence, drafts a `_propose/` entry **only** when the §5.2 notability gate clears (≥3 substantive occurrences across ≥2 *distinct* coordinates + verifiable effect — a single session's repetition is usually one coordinate, so most invocations end at capture), and **never self-ratifies** an enforcing hook (promotion to a blocking entry is user-gated, §5.4 gate 3). Phronesis-heavy work (judgement-heavy / rare-context / high-context-dependent) is skipped by design (§1.4/§5.3). **Prime trigger = `/before-compact` time**: the session's accumulated context is the raw material and is about to be compacted away, so the `before-compact` skill gains a soft Step-0 that runs `/routinize` first (opt-in — skipped if Greatpractice is not adopted) — the two are complementary, routinize capturing *what recurs across sessions* while before-compact captures *what is in flight in this one*. The Codex adapter picks up the new skill automatically (22 skills projected). verify-nway 17-axis PASS.

Previously: v2.5.135 (2026-07-05) — **Codex adapter (Stage 1) + Compendium v0.2.5 (the MCP-declaration gap the adapter surfaced)** — EstreGenesis modules now run under **OpenAI Codex**, not just Claude Code. **(1) Codex adapter (`codex/`)** — Codex converged in 2026 on the same three customization surfaces EG already speaks (Agent Skills `SKILL.md` · MCP servers · `AGENTS.md`), so the six modules port with almost no transformation. Rather than duplicate the 21 canonical `SKILL.md` files (the drift surface the Migration-B dogfood warned against), the adapter is a **projection**: `gen-codex-adapter.cjs` materializes skills on demand into a Codex discovery path (`--install`, symlinks/copies) and regenerates only the Codex-specific derived surfaces — `config.toml.example` (the 4 MCP `[mcp_servers.*]` stanzas) and the README inventory. A hand-written `codex/AGENTS.md` carries the **hook-replacement discipline**: Codex has no lifecycle hooks, so each of the 6 Claude Code hooks maps to a manual paired-skill invocation — the discipline travels even though the automation does not (the north-star thesis made concrete). A new EG-ops **codex-adapter verify-nway axis** (`gen --check`, 17th axis) gates the committed surfaces against the live plugin set. **(2) Compendium v0.2.5** — building the adapter surfaced a real wiring gap: the Compendium MCP server (the §10 8-tool runtime, shipped v2.5.114) was **never declared in `plugins/compendium/.claude-plugin/plugin.json`**, so no host auto-registered it. Smoke-tested clean (initialize + tools/list → wiki_read/search/upsert/…), then declared — fixing Claude Code and letting the adapter project all four MCP servers. Full N-way version cascade (plugin.json + marketplace + mcp/package.json + Compendium.md frontmatter + docs badge/meta/module-tag). verify-nway 17-axis PASS.

Previously: v2.5.134 (2026-07-05) — **docs: promo-page staleness sweep — cumulative panel un-frozen, six-module corrections, Constellation v2.4.24–46 feature-wave coverage** — a full stale-content sweep of the public promo pages (agent-swept, EN+KO, all three audience registers) surfaced prose that had frozen while the machine-checked badges/meta moved on; all fixed. **(1) index.html** — "two optional graduated modules" → six (dev+expert, both languages); the "Cumulative since the 24h baseline" panel un-froze from "v2.5.36 / Hyperbrief is the new third module" to the current record (v2.5.133 range · 4 more modules → six · the Constellation §13.23–§13.26 wave · the M2 adopter-dogfood absorption), metrics updated (~21→~118 cuts, 1→4 new modules, 3→4 adopter bundles/reports, 2→6+ integrations); Ultrasafe staging corrected in 3 spots ("advisory v0.1.x → blocking v0.2.x" → "advisory v0.2.x, live + self-dogfooding → blocking v0.3+"); Greatpractice cards re-anchored from "v0.1.0 first cut + v0.2–0.4 roadmap" to the shipped v0.3.2 state; the Compendium general card now leads with the portable-discipline-over-any-vault framing; the Constellation cards gained the v2.4.24–46 highlights. **(2) constellation.html** — the flagship page's body introduced nothing newer than the dogfood era (§13.16.12 / the v2.5.15 relay): two new "What's inside" cards now cover the §13.23–§13.25 board-substrate wave (backends registry + board-worker projection, PWA + dependency-free Web Push, surface-scoped access control + CIDR + exposure toggle, wiki cross-link side panel, ack ✓ origin-line UX) and §13.26 echo-mode (tri-state local↔board remote-control mirror). **(3) hyperbrief.html** — "18 anti-patterns" → 26, matching its own badge. **(4) greatpractice.html** — "v0.1.0 specification" / "v0.2–v0.4 roadmap defines" → v0.3.2 current, v0.2/v0.3 marked shipped, v0.4+ open. Docs only, EN/KO. verify-nway 16-axis PASS.

Previously: v2.5.133 (2026-07-04) — **Migration-B dogfood follow-up — seed registry to six (Compendium) + backends.json re-sync preserve rule + runtime notes split + README KO current un-freeze (Constellation v2.4.46, seeds v2.5.1)** — a downstream adapter ran the full Migration-B (M2) upgrade (seed v2.4.3→v2.5.0 + release delta ~92 patches) and its dogfood report surfaced three ship-surface gaps; all fixed, plus one more found while cutting. **(1) Seed module registry → six.** The seed § EG module registry still listed five modules while the release track had shipped Compendium (v2.5.110) — an adapter reading only the seed misses the sixth module (the report's dual-marker cross-check caught it; the registry's hold-until-production exception is dropped now that a real adapter adopted Compendium from the release track). All 6 seed files (KO/EN × Master/Lite/Compact) gain the Compendium row + a "Six optional modules" intro; seed marker v2.5.0→**v2.5.1**; the EG-ops verify-nway seed-registry axis now checks 6 modules. **(2) backends.json re-sync preserve rule (§13.23.2).** The deployment config (boardTitle, roster) sits at the dashboard's default fetch path *inside* the reference `dashboard/` copy-set, so a wholesale vendor-copy re-sync clobbers adapter branding; the spec now states the preserve-list rule explicitly. **(3) reference/runtime dev-notes split.** The three `*-NOTES.md` dev notes move to `runtime/notes/`, making the runtime copy surface runtime-only. **(4) README KO versioning un-freeze.** Found while cutting: the README KO **현재** entry had been frozen at v2.5.110 for 22 cuts (only the EN Current was updated per cut); synced to v2.5.133, and a new **readme-current** verify-nway axis (EN Current ↔ KO 현재 ↔ data.js) makes that drift deterministic. verify-nway 16-axis PASS.

Previously: v2.5.132 (2026-07-04) — **Constellation v2.4.45 — echo-mode (remote-control mirror) + ack ✓ UX** — (1) **echo-mode (§13.26)** — a three-level per-agent mode (`off`/`on`/`mirror`) that mirrors an agent's local human↔agent chat onto the board's real-time conversation channel **bidirectionally**, so a human watching the board can also *drive* the agent through it (a remote-control substrate). `on` mirrors the turn-final text; `mirror` adds a live activity stream — tool calls, steps, thinking narration — for a chat-gateway feel. Board-typed prompts arrive as `UserPrompt` (quoted into the local chat, then acted on); structured choices render as plain-text options locally + a `SelectionPrompt` chip-card on the board (never a blocking local UI, per §13.17). Default follows **join provenance** (human-joined=off, agent-spawned=on — the board is the only channel to an agent nobody launched directly). Ships the protocol (§13.26), the `/echo-mode` skill, and the deps-0 `echo-emit.cjs` 3-phase reference hook (PreToolUse/PostToolUse live progress + Stop turn-text + thinking summary), all level-gated; dogfooded live end-to-end. (2) **ack ✓ UX** — `UserPromptAccepted`/`Ack`/`AckProcessed` now stamp a ✓ on the **origin** request/message line (correlate by promptId / msgId) with a custom cursor-quadrant hover popup (time·agent, click-to-pin) instead of a separate code-value row; live local-echo rows carry promptId so real-time acks annotate in place. verify-nway 15-axis PASS.

Previously: v2.5.131 (2026-06-24) — **docs: fix non-working Copy buttons across all six module pages + plain-language the Compendium Install/Example copy** — (1) Bug fix — the Copy buttons on hyperbrief / constellation / superscalar / greatpractice / ultrasafe / compendium did nothing because none of those pages loaded `shared/copy.js` (only index.html did); added the script to all six. Verified on compendium via Playwright: handlers attached 5/5, every button copies and shows "✓ Copied". (2) Plain-language (L1.1.1) pass on the Compendium Install + Example-prompts copy: the "add a term" example became a plain natural-language prompt (a one-line summary + a link to the defining doc, not "curate way — gloss + owner_spec pointer"), the lint example describes each check in plain words, and the install descriptions are un-jargoned. Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.130 (2026-06-24) — **Compendium promo docs — plain-language (L1.1.1) pass on the general copy** — rewrote the remaining jargon in the general-audience text of docs/compendium.html to L1.1.1 (plain audience, abbreviations expanded, no jargon): the MCP card ("needs nothing else installed" not "0 dependencies"), eviction ("custom-built parts retired first" not "bespoke runtime pruned"), adoption ("parts that share words / terms that refer to each other / live shared screen" not "modules / cross-referenced / dashboard / over-engineering"), the portable use-case ("stuck with one app" not "lock-in"), the dashboard card ("glossary page / plain-or-expert switch" not "wiki tab / toggle"), and the "Want to read more?" tour (each spec section in plain words, not a §1–§12 jargon list). Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.129 (2026-06-24) — **Compendium promo docs — add the missing "Want to read more?" footer section** — completes the v2.5.128 cut: docs/compendium.html gains the standard bottom "Want to read more? / 더 자세히 알고 싶다면" section (a plain tour of Compendium.md §1–§12 + the cross-tool skills path + the spec link) that every other module page carries. Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.128 (2026-06-24) — **Compendium promo docs — recent-updates coverage + the missing standard sections** — the public Compendium page gains a **"Portable over any vault"** section covering the v0.2.2–v0.2.4 surfaces (the Obsidian/vault projection, the two cross-tool curation skills, the dashboard wiki tab + click-to-define side panel) with the pointer-not-paraphrase wedge as the headline, plus the three standard sections every other module page has — **Install**, **Example prompts**, and **Use cases** (three scenarios: stopping glossary drift, click-to-define on the live dashboard, carrying the discipline across tools). The stale "deferred to v0.2-d" claims (page + index card) are un-deferred. Docs only, all three audience levels × EN/KO; Playwright-verified render (9 sections, audience-gating correct, 0 console errors). verify-nway 15-axis PASS.

Previously: v2.5.127 (2026-06-24) — **Compendium v0.2.4 — cross-tool curation Agent Skills (the portable discipline carrier)** — the Compendium discipline now ships as two plain-markdown **Agent Skills** any harness reads: **compendium-curate** (the pointer-not-paraphrase + dual-register + schema + first-class-eviction curation procedure — invoke it the moment you're about to write a glossary or a second copy of a definition that already lives in a spec) and **compendium-lint** (the six gardening checks — pointer-resolution / broken-link / no-competing-full-def / redaction / orphan / duplicate / stale — by runtime or by inspection). This is the option-(c) carrier the research identified: the storage + viewer are substitutable, so the discipline travels as portable skills over plain markdown+frontmatter rather than as a bespoke runtime. Roadmap move #3 (final of the reframe). Each skill points to Compendium.md for the full charter (pointer-not-paraphrase applied to the skill itself). verify-nway 15-axis PASS.

Previously: v2.5.126 (2026-06-24) — **Compendium v0.2.3 — spec reframe: portable discipline layer (pointer-not-paraphrase as the wedge)** — §1 re-positions Compendium from "a module with a bespoke wiki runtime" to **a portable controlled-vocabulary *discipline layer* over the markdown-vault substrate**: the storage + viewer are substitutable (Obsidian graph / provider memory / the dashboard wiki tab all read the same markdown+frontmatter; §11 emits the viewer-agnostic projection), and what Compendium owns is the *curation discipline*, not a runtime. A fifth misreading is foreclosed (§1.1(e) "a vault app / an Obsidian competitor" → Compendium is the opinion layer *on top of* whatever vault wins, supplying what generic vaults + provider-native memory deliberately do not: dual-register + pointer-not-paraphrase + governance lints + first-class eviction). §1.2 records the typed link model (peer `links` vs the one-directional `owner_spec` authority pointer) as uniquely owned — the charter made structural — and the bespoke wiki tab is named one optional viewer, eviction-first-class. Roadmap move #1 of the option-(c) reframe. Spec + docs only (no runtime change). verify-nway 15-axis PASS.

Previously: v2.5.125 (2026-06-23) — **Compendium v0.2.2 — Obsidian / vault projection (portable-discipline interop bridge)** — the Compendium content store now lights up natively in any markdown-vault viewer (Obsidian's graph + backlinks) while frontmatter stays the typed SSoT. `lint.cjs --reindex` emits an auto-managed block per entry: peer relations as in-vault `[[id]]` (graph edges) + the `owner_spec` authority as a relative link **out** of the store — **pointer-not-paraphrase made visual** (peer = graph edge; authority = external pointer). 39 peer links across 23 entries, all resolving to real files; idempotent; lint-clean. First move of a strategic reframe (a deep-research round found the winning substrate is the *generic markdown-vault pattern* — not any one app — and that provider-native memory ships format-agnostic, leaving the vocabulary-discipline layer the durable, un-absorbed value): Compendium positioned as a portable *opinion on top of whatever vault wins*, the bespoke wiki tab demoted to one optional viewer. §11 also marks the side-panel + click-to-define components shipped (v2.5.124). verify-nway 15-axis PASS.

Previously: v2.5.124 (2026-06-20) — **Constellation v2.4.44 — Compendium wiki cross-link side panel (click-to-define, §8/§11)** — clicking a cross-link in the dashboard's 위키/wiki tab now opens that term's gloss in a **non-modal side panel** (a complementary landmark) — you peek the definition without losing your reading position, the panel's own cross-links **chain** to further terms, and a "전체 항목으로 →" link jumps to the full entry. a11y per §8.2: because a gloss can contain cross-links the trigger carries **dialog/disclosure** semantics (`aria-haspopup="dialog"`, never `role="tooltip"`), focus moves into the panel on open, **Escape** closes it and restores focus to the trigger; the §8.1 post-escape-DOM invariant (no raw-HTML injection) holds. Mobile (≤560px) renders as a **bottom-sheet** seated above the tab bar. Client-only (no server change → no restart; `sync-dashboard` deploys). Playwright-verified on the live board: render (26 entries / 39 cross-links + ARIA), click→panel→focus→chain→Escape→focus-restore, mobile bottom-sheet clears the tab bar, **0 console errors**. verify-nway 15-axis PASS.

Previously: v2.5.123 (2026-06-20) — **Constellation v2.4.43 — tier-2 Web Push (#3b, fires while the board is closed)** — the dashboard's notifications gain a second tier that reaches you **even when the PWA/tab is fully closed**, complementing in-tab tier-1 (v2.4.28). Implemented **dependency-free** (node built-in `crypto`/`https` — no `web-push` library): a self-generated P-256 VAPID keypair (`.vapid.json`, gitignored), ES256 JWT signing via `crypto.sign(…, {dsaEncoding:'ieee-p1363'})` (raw 64-byte `r||s`), and **tickle** delivery — a payload-less VAPID push (RFC 8291 payload encryption avoided, which is what drops the dependency) where the service worker fetches `GET /api/push/latest` for the body on the `push` event. Four endpoints (`/api/push/{vapid-public-key,subscribe,unsubscribe,latest}`, UI surface → §13.25 `ui`-allowlist-gated), a `wsToBoards`-passing meaningful-A2A trigger (noise-blocklisted), auto-pruned expired subscriptions (404/410), and a 🔔-panel **백그라운드 알림** toggle (`PushManager.subscribe`). Per-origin — the board self-sufficiently pushes its own activity. Distilled into the Constellation reference (`reference/runtime/push.cjs` + `server.cjs` + dashboard) → §13.24.4. Verified: push.cjs unit suite (VAPID 65B key + ES256 raw-64 sign/verify + dead-sub prune + noise filter) + server HTTP smoke (4 endpoints) + isolated-port boot. verify-nway 15-axis PASS.

Previously: v2.5.122 (2026-06-19) — **Compendium v0.2 seed vocabulary — 19 cross-module glossary entries** — the content store grows 7 → **26 entries**, materializing the spec's ~25-item EG Seed Vocabulary Catalog (Appendix A.1): 19 internal-register pointer-only glossary terms across Constellation / Superscalar / Hyperbrief / Greatpractice, each a one-line orientation gloss + expert/plain dual-register glosses + a pointer to the owning spec (the full definition stays in the owner, per the pointer-not-paraphrase charter). Every `owner_spec` was reconciled against the **real** owner-spec heading slugs (via the lint's own `headingSlugs` — the catalog's example slugs were single-hyphen, the actual GitHub-style slugs double-hyphen around dropped ` — `/` / `), so the §9.2 pointer-resolution axis resolves all 26 with **0 hard failures**; catalog #3 (routing-by-direction) deferred (no dedicated owner-spec heading). `lint.cjs --reindex` regenerated `INDEX.md` + `index.json`; the wiki-tab `compendium.json` export updated to 26. Compendium module unchanged (v0.2.1 — content seeding). verify-nway 15-axis PASS.

Previously: v2.5.121 (2026-06-19) — **Constellation v2.4.42 — dashboard-operable exposure + self-restart (#5a-4)** — exposing the board to the LAN is now a dashboard action, not a manual env+restart. A persisted **`expose`** field (the `WS_BIND` on/off) is flipped from the settings modal and applied via a **loopback-only `POST /api/restart`** that self-restarts the server (a deployment `restart-self-board.ps1`, spawned via `cmd /c start` so it survives the server's own exit, re-launches it). The access editor gains a **네트워크 노출 끄기/켜기** master toggle (dims the IP policy when off) + a **저장 및 재시작** button, and the settings modal separates the **real-time** 창 배치 block from the **save-gated** 접속 제어 block as distinct cards. Server + dashboard, purely additive (`expose:false` default = prior loopback behavior). Verified: WS_BIND derivation + restart spawn/self-exit (cmd/start survives parent exit) + Playwright (block separation, expose toggle dim, save persists `expose`). verify-nway 15-axis PASS.

Previously: v2.5.120 (2026-06-19) — **Constellation v2.4.41 — per-surface access toggles + CIDR (#5a-3)** — the access model becomes symmetric across all three surfaces and friendlier to edit. **agent** joins UI and MCP with its own IP allowlist (restrict which IPs may connect as agents, *and* still require a key — defence-in-depth), and allowlist entries now accept **IPv4 CIDR** ranges (`192.168.0.0/24`) alongside exact IPs. The `/ws` gating moves to HELLO (where agent vs MCP is known), with an upgrade-time pre-check that `destroy`s fully-blocked IPs before any board state is sent, and `requireKey` is enforced at HELLO (URL *or* HELLO key — fixing a v2.4.39 gap). The dashboard editor becomes three **기본 차단/허용** toggles (UI/agent/MCP) + a key checkbox + an exposed-without-key warning; settings modal retitled "⚙ 설정". Server + dashboard, purely additive; Playwright-verified (3-toggle render, 차단→textarea, per-surface save) + CIDR/exact match 12/12. verify-nway 15-axis PASS.

Previously: v2.5.119 (2026-06-19) — **Constellation v2.4.40 — access-control dashboard editor (#5a-2)** — the settings modal (⚙) gains a **접속 제어** section that edits the §13.25 access policy from the board UI: per-surface IP allowlist textareas (UI / MCP — one IP per line, empty = allow-all), an `agent.requireKey` toggle, and an exposed/bind status line. It loads via `GET /api/access` on open and saves via `POST /api/access` (loopback-only — a remote/UI-allowed caller gets a clear 403). Completes #5a — the v2.5.118 server-side gate is now manageable from the dashboard, not just by hand-editing `access.json`. Dashboard-only (`app.js` + `style.css`); no server/protocol change. Playwright-verified on an isolated server: section renders (0 new console errors), GET populates, POST persists to disk. verify-nway 15-axis PASS.

Previously: v2.5.118 (2026-06-19) — **Constellation v2.4.39 — surface-scoped access control (#5a-1)** — when `WS_BIND` exposes the board beyond loopback the three surfaces gate **independently**: **UI** (dashboard + board endpoints) by an IP allowlist, **agent** (keyed `/ws`) allow-all-by-IP with an optional `agent.requireKey` that closes the v2.4.11 unauthenticated-board vector (LAN-wide key-issue / `SetMain`), and **MCP** (the `mcp-proxy` WS client) by its own allowlist independent of UI. A gitignored `access.json` beside `server.cjs` (`fs.watchFile` hot-reload) drives it — **fail-open by default**: no file = prior behavior, `null` allowlist = allow-all, loopback always allowed, the gate wholly inert on a loopback bind. `GET /api/access` (UI-gated) + `POST` (loopback-only). Server-side only (`server.cjs` + §13.25 + `.gitignore`); the dashboard per-surface allowlist editor is staged as #5a-2. verify-nway 15-axis PASS.
Earlier releases: every entry is preserved in [CHANGELOG.md](CHANGELOG.md) — this list keeps only the most recent few.

**Full changelog** (all releases from v1.0 onward, EN + KO): [CHANGELOG.md](CHANGELOG.md).

This upstream repository's `CHANGELOG.md` is the changelog SSoT. Each seed file keeps only a compact header metadata line with tier, language, current version, counterpart, and a pointer back to that `CHANGELOG.md`, not the target project's README. When you upgrade a project using Migration B, the agent uses the seed header version marker plus the changelog to compute the delta.


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

**Claude Code 에서는 명령 하나.** 킷 플러그인을 설치하면 알맞은 시드를 알아서 가져옵니다:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins

/egboot     # 신규 프로젝트      (긴 이름: /eg-bootstrap)
/egmig      # 기존 프로젝트      (긴 이름: /eg-migration)
/egup       # 이미 시드 적용됨 — 시드 + 플러그인 업그레이드 (긴 이름: /eg-upgrade)
/egmem      # 에이전트 메모리 ↔ 프로젝트 문서 정합 (긴 이름: /eg-memsync)
/egrich     # 풀 무장: 시드 + 6개 모듈 전부, 배선·검증까지
```

스킬이 티어를 고르고, 시드를 가져와 `.agent/seed_prompt.md` 로 설치하고, 그대로 실행합니다 — raw URL 찾을 일도, 복사·붙여넣기도 없습니다. 잘못 골라도 맞는 스킬로 안내합니다.

**다른 에이전트에서는 수동 경로 (여전히 60초).**

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

## bootstrap 너머 — 6 선택 모듈

v1.x 는 프로젝트 시드 — 신규 AI-Native 프로젝트 부트스트랩, 또는 기존 프로젝트를 `AGENTS.md` SSoT 로 마이그레이션 (위의 모든 내용). **v2.0+ 는 그 위에 6개의 선택 모듈 추가**:

- **[Constellation](Constellation.md)** (v2.0+) — 실시간 멀티에이전트 오케스트레이션. 파일 기반 `.agent/_coordination/` 코디네이션을 실시간 라이브보드 (WebSocket + A2A 메시징 + 대시보드) 로 격상. **A2A 브릿지 인터페이스**가 불변 계약. [constellation/reference/](constellation/reference/) 의 참조 런타임은 Node deps-0 (`ws` 제외). 컴포넌트는 `.eux` 로 작성하여 **[EstreUX](https://github.com/SoliEstre/EstreUX)** (별도 Apache-2.0 런타임, EG 가 *참조* — clone-and-run, 번들·소유 안 함) 로 brew.

- **[Superscalar](Superscalar.md)** (v2.3+) — 병렬 서브에이전트 dispatch 의 실행 스케줄링 규율. 5차원 `issue_width` 공식 (effort_band + pace_mode + Little's Law + Kanban WIP + autonomy_available_workers) + 30-60k 토큰 horizon 교차점에서의 cost-benefit gated dispatch + worktree-isolated reorder buffer + in-order retire + consistency gate + opt-in speculation. Production-ready (Stage 1 ship). n=8 dogfood ledger + Entry 06 controlled A/B 가 "병렬화만으로는 불충분; 오케스트레이션 규율이 일관성을 만든다" 입증.

- **[Hyperbrief](Hyperbrief.md)** (v2.3.20+) — 결정 위임 게이팅 규율. 모든 user-facing 결정 질문이 트리거 rubric 통과, 에스컬레이션 시 LLM 이 schema 강제 JSON IR emit, 결정론적 Node renderer 가 9-section Markdown 브리핑 + interactive HTML 카드 산출. 4축 × 5단계 톤 프로파일 + skill-side auto-localize (버튼 라벨 + MD trigger phrase 가 사용자의 prevailing 대화 언어 따라감). Cross-module 통합 active: Constellation §13.16.9 (5 A2A intent name + ack_tier='decided') + Superscalar §3.1 (write/deploy/send lane retire 시 orthogonal gate). §11.5 v1.0 readiness rubric (Lens A 7-차원 모듈 전체 GA / Lens B 6-차원 host-specific 마켓플레이스 등록) ship 완료.

- **[Greatpractice](Greatpractice.md)** (v2.5.50+, v2.5.55 release-cadence 정식 등록) — 메모리 기반 관행 codification 규율. AI 와 함께 작업하면서 자연스럽게 형성되지만 점점 누락되는 자잘한 약속들 — 「코드 수정 시 docs 도」, 「보내기 전 확인」, 「X 가 바뀌면 Y 도」 — 의 *조용한 누락* failure surface 를 target. 보통 메모리 메모로 시작했다가 메모가 누적될수록 점점 안 읽히고 누락이 늘어나는 패턴이에요. Greatpractice 는 agent-workspace 메모리 feedback (`memory/feedback_*.md` 또는 동등 surface) 을 입력 트리거로 받고, raw 신호를 5-axis multi-criteria maturation gate (frequency + depth + recency + cost + predictability weighted sum threshold ≥ 18 OR 3-criterion notability) 를 통해 3-tier macro/mezzo/micro 계층으로 route. ratified entry 는 deterministic lifecycle hook (SessionStart blocking / UserPromptSubmit path-scoped inject / PreToolUse 3-subtype poka-yoke contact/fixed-value/motion-step / PostToolUse SSoT propagation / Stop cycle-end probe / PostCompact working-set 복구) 으로 강제. 명시적 `phronesis_boundary` field 가 judgement-heavy work 의 codify-금지 영역 명시. 9축 cross-domain 딥리서치 (harness · humanities · psychology · management · processor · os · sre · memoization · canonical) 가 backing. v2.5.55 dual cut 이 [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) entry 를 `_propose/draft` 에서 ratified 로 promote (user steering trigger at N=1 evidence; mezzo decomposition 8-candidate batch v2.5.56+ 예정).

- **[Ultrasafe](Ultrasafe.md)** (v2.5.55+) — 출시 직전 / 갱신 직전 모의 침투 시험 규율. *출시 후 발견* failure surface 를 target: 보안 문제가 외부 사용자에 의해 발견되는 시점이 출시 후이지, 내부 검증으로 출시 전이 아닌 패턴. Ultrasafe 는 매 release 를 Superscalar-applied Workflow 로 ship, 8 병렬 공격 에이전트 (v0.1.0 최소 fan-out — AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer + GTA/DSP cross-cutting) 가 독립 관점에서 모의 공격, Finding Output Contract (§4) 로 발견 emit, Synthesizer 에서 BFT 2f+1 quorum + cross-axis correlation 으로 합성, 3-layer 보고서 (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate) 산출. ≥3 iteration loop 가 4-condition AND clean signal 까지 실행: regression-free + monotonic improvement + coverage gate + 2 iter consecutive + agent diversity invariant. Dual pre-release trigger (PreToolUse hook on `git push --tags` / `npm publish` / `gh release` / 등 7 matcher + `/ultrasafe` skill). 5 신규 Constellation A2A intent. **Advisory-only v0.1.x → blocking v0.2.x** 단계 전환 (Tier 3 release strict / Tier 1/2 opt-in). 17축 cross-domain 딥리서치 backing. v0.1.0 첫 cut ship = 전체 사양 (2544 줄, §1-§13 + 부록 A-C) + plugin manifest; runtime (공격 에이전트 dispatch / iteration loop runner / 3-layer 보고서 generator / 5 A2A intent handler / PreToolUse hook / MCP server) v0.2+ deferred.

- **[Compendium](Compendium.md)** (v0.2.6) — **이미 쓰는 markdown vault 위에 얹는 이식 가능한 규율 레이어**: 한 개념에 정의 하나, 두 register(쉬운말 + 전문어)로 제공하되, 정의를 베끼지 않고 그 개념을 *소유한 스펙을 가리킴*. 마지막 성질이 wedge — 재진술하지 않으므로 원본으로부터 drift 할 수 없음. north-star 의 두 번째 축(코드 생존보다 개념/어휘 생존 — 어느 단일 런타임 구현보다 오래 남을 레이어)을 reify. 출시분: 콘텐츠 스토어, 가드닝 lint(포인터 깨짐 / 고아 / 개념 중복 / 낡음), 8-tool MCP 서버, 어떤 에이전트든 읽어서 쓰는 cross-tool 스킬 2종(`compendium-curate` / `compendium-lint`), 그리고 스토어를 옵시디언류 앱에서 링크 그래프 그대로 열 수 있게 하는 vault 투영.

여섯 모듈 모두 **선택적** + **참조** (시드 티어 본문에 번들되지 않으므로 시드는 lean 유지). 파일 기반 코디네이션 (Phase 5) 이 기본이며 대부분 프로젝트에 충분.

### Claude Code 플러그인으로 설치 (repo 자체 마켓플레이스)

여섯 모듈은 본 repo 의 **repo 자체 마켓플레이스** 를 통해 Claude Code 플러그인으로도 ship. Claude Code 세션에서:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins
/plugin install constellation@estregenesis-plugins
/plugin install superscalar@estregenesis-plugins
/plugin install hyperbrief@estregenesis-plugins
/plugin install greatpractice@estregenesis-plugins
/plugin install ultrasafe@estregenesis-plugins
/plugin install compendium@estregenesis-plugins
```

플러그인 7종: **estregenesis** 킷(시드 자체를 `/egboot` · `/egmig` · `/egup` · `/egmem` · `/egrich` 로) + 6개 모듈. 각각 독립이라 하나만, 몇 개만, 또는 전부 설치 가능. 마켓플레이스 메타데이터는 [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json), 각 플러그인 소스는 [plugins/](plugins/) 아래. Apache-2.0. 현재: estregenesis v0.2.1 (절차 5종 + 포인터 별칭 4종, 의존성 0); Constellation v0.3.26 (+ 5-tool MCP 서버, 스킬 8종 — `/boardsweep` 포함, Stop 훅); Superscalar v0.1.2 (+ §3.1 Hyperbrief interlock); Hyperbrief v0.7.1 (+ 스킬 3종, 4-tool MCP 서버, PreToolUse/Stop 훅); Greatpractice v0.3.4 (+ `/routinize`, JSON 스키마 3종, contact 훅 1종); Ultrasafe v0.2.4 (+ 8-agent red-team fan-out, clean-signal 게이트 — advisory, 출시를 막지 않음); Compendium v0.2.6 (+ 8-tool MCP 서버, 가드닝 lint, cross-tool 스킬 2종). Anthropic-side community-marketplace 등록은 [Hyperbrief.md §11.5](Hyperbrief.md) readiness rubric Lens B 에 따라 v1.0 GA 까지 defer.

## 3-tier — 프로젝트당 하나 선택

| Tier | 크기 | 주 용도 | 대상 독자 |
|---|---|---|---|
| **Master** | ~2425줄 | 깊이 있는 가이드 필요한 신규 프로젝트, 패턴 처음 배우는 팀, 모든 인라인 템플릿 필요한 엣지 케이스 | 첫 AI Native 저자; 프로세스 공식화하는 팀 |
| **Lite** | ~1105줄 | 빠른 신규 프로젝트, 마이그레이션 세션, 기존 프로젝트에 새 AI 서비스 편입, 마스터가 컨텍스트 윈도우에 무거울 때 | 패턴 기억하는 복귀 저자; 대부분 프로젝트 |
| **Compact** | ~130줄 | 이미 패턴 알고 최소 시드 원하는 저자; 가장 타이트한 컨텍스트 윈도우; bullet 트리거만 | 체크리스트만 필요한 파워 유저 |

프로젝트에는 **tier 하나만** 배치. 세 개 다 넣지 않음. 존재하지 않는 tier 를 교차 참조하면 dead link 와 에이전트 혼란만 발생하므로, 각 tier 는 **self-contained** — 내부 완결, 다른 tier 로의 forward/backward 참조 없음.

프로젝트가 더 많은 깊이를 요구하게 되면 tier 를 in-place 업그레이드하지 않습니다. 파일을 다음 tier 로 교체하고 커밋. 에이전트가 일반 문서 업데이트로 처리합니다.

## 파일 목록

```
AI_Native_Project_Master_Seed_Prompt.md       ← 영문 마스터 (가장 깊음, ~2425줄)
AI_Native_Project_Seed_Prompt_Lite.md         ← 영문 lite (~1105줄)
AI_Native_Project_Seed_Prompt_Compact.md      ← 영문 compact (~130줄)
AI_Native_프로젝트_마스터_시드_프롬프트.md       ← 한국어 마스터
AI_Native_프로젝트_시드_프롬프트_Lite.md          ← 한국어 lite
AI_Native_프로젝트_시드_프롬프트_Compact.md       ← 한국어 compact
Constellation.md                               ← v2.0+ 모듈: 라이브 멀티에이전트 오케스트레이션 가이드 (WS + A2A)
constellation/                                 ← v2.0+ 모듈: .eux 사양 + 참조 런타임 (server / bridge / watcher / watchdog / dashboard)
Superscalar.md                                 ← v2.3+ 모듈: 병렬 서브에이전트 실행 스케줄링 규율
Hyperbrief.md                                  ← v2.3.20+ 모듈: 결정 위임 게이팅 규율 (JSON IR + 결정론적 renderer)
plugins/                                       ← Claude Code 플러그인 (constellation / superscalar / hyperbrief) — repo 자체 마켓플레이스용
.claude-plugin/marketplace.json                ← repo 자체 Claude 플러그인 마켓플레이스 메타데이터 (estregenesis-plugins)
README.md                                      ← 본 파일 (라이브러리 색인; 프로젝트에 배포하지 않음)
LICENSE.md                                     ← Apache License 2.0 전문
logo/EstreGenesis.png                          ← README 로고
```

각 tier 의 언어 페어(영문+한글)는 완전 정렬 — 동일한 phase, 동일한 마이그레이션 로직, 동일한 운영 가이드. 이중언어 팀이면 페어로 배치. **v2.0+** 는 6개의 선택 참조 모듈 (Constellation + Superscalar + Hyperbrief + Greatpractice + Ultrasafe + Compendium) 을 추가하며, 각각 repo 자체 마켓플레이스를 통해 Claude Code 플러그인으로도 ship — changelog 참조.

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
| OpenAI Codex CLI | 전용 어댑터 동봉 (`codex/`): `node codex/gen-codex-adapter.cjs --install` 이 모든 plugin 스킬을 Codex discovery 경로로 project, `config.toml.example` 이 MCP 서버 4종 등록, `codex/AGENTS.md` 가 각 lifecycle hook 을 문서화된 수동 루틴으로 매핑 |
| Jules / Kiro / Kimi Code / 기타 | `AGENTS.md` 직접 참조 (Kimi Code 는 `AGENTS.md` 가 1급 지시 파일 — 자체 `/init` 이 이를 생성) |

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

각 tier 는 자체 버전 보유. 마스터가 권위 있는 진화 트랙; Lite·Compact 는 정기적으로 마스터에서 파생되나 한 릴리스 지연될 수 있음.

**현재**: v2.5.175 (2026-07-19) — **온보딩 흐름 (Constellation v2.4.70, TC2)** — §13.32: 직접 서버 vs 피어 합류(소유권 rubric) + 포트 자동 우회 계약 + loopback-first 보안 순서예요. verify-nway 20축 PASS.

이전: v2.5.169 (2026-07-19) — **인디케이터 토글 미세 배치 (Constellation v2.4.65)** — 입력줄 토글을 첨부↔pause 사이로, 🧵 프리픽스 + 고정 폭 112px, 브라우저 실측. verify-nway 20축 PASS.

이전: v2.5.168 (2026-07-19) — **활동 모니터 UX + 소음 정련 (Constellation v2.4.64)** — 토글 fab 을 실시간 fab 레이어로(창 위로 안 뜸), 입력줄 왼쪽에 고정 폭 `Wn/n Sn` 인디케이터 토글(실측 `W2/2 S1`), 15초급 스냅샷 이벤트를 Web Push·워커 pending 분류기에서 제외 — 실측된 워커 턴 캐스케이드 종식. verify-nway 20축 PASS.

이전: v2.5.167 (2026-07-19) — **인스펙터가 에이전트 활동 모니터로 (Constellation v2.4.63)** — SubagentStatus 섹션(단독 서브에이전트, 6분 flush 공백 실측으로 10분 활동창), 고정 🧵 fab 토글 + 오버뷰 모드, 실토큰 테마 정합(구 스타일은 미존재 변수의 다크 폴백에 고정돼 라이트에서도 다크). 실행 중인 실제 위임의 라이브 데이터 + 테마 전환 실측 포함 E2E. verify-nway 20축 PASS.

이전: v2.5.166 (2026-07-19) — **인스펙터 XSS 핫픽스 (Constellation v2.4.62)** — 푸시-후 자동 보안 리뷰가 당일 검출: 신설 플로팅 인스펙터가 와이어-유래 WorkflowStatus 값을 innerHTML 헬퍼로 렌더(§8.1 위반, 접속 에이전트 주입 가능) → 전부 textContent 주입 + state 클래스 화이트리스트로 교정, 실브라우저 회귀(전 필드 악성 페이로드 → 이스케이프 텍스트·실행 0) 통과, 컷 전 라이브 배포. verify-nway 20축 PASS.

이전: v2.5.165 (2026-07-19) — **워크플로 런이 보드에 보임 — 미러 + 플로팅 인스펙터 (Constellation v2.4.61)** — 배포 워처가 멀티에이전트 워크플로 런을 에이전트 채널에 미러하고(코얼레스 🧵 STEP + 스로틀 WorkflowStatus 스냅샷), 🧵 행 클릭 시 플로팅 인스펙터(드래그·폭조절·세로자동·접기·닫기)가 단계·에이전트별 진행·토큰·소요를 실시간 렌더해요; 히스토리 재생으로 끝난 런도 계속 열람. 실측 기반 설계: 런 상태 파일=종결 단발 기록 → 라이브는 journal. 실런 라이브 E2E + 콘솔 에러 0. verify-nway 20축 PASS.

이전: v2.5.164 (2026-07-19) — **실시간 기록 발송시각이 더는 "현재 시간"으로 안 튐 (Constellation v2.4.60)** — 68행이 실제 발송시각을 ISO 문자열로 갖고 있었는데 숫자-전제 소비자(대시보드 epoch 파서·부팅 정렬 `timestamp||0`)가 새로고침마다 현재시간으로 격하시키던 버그 — `wsNormTs` 가 저장·적재 경계에서 강제(문자열→epoch·누락→수신시각)하고 대시보드도 문자열을 수용해요. 유추 아닌 실시각 복원, 재시작 1회로 68→0 실측. verify-nway 20축 PASS.

이전: v2.5.163 (2026-07-19) — **끊긴 채널도 그룹 유지 + sweep cadence (Constellation v2.4.59, 플러그인 v0.3.30)** — 서버가 채널별 HELLO 시점 role 을 영속해 cold/archived 스텁에 동봉 — 업스트림/협업/피어 에이전트가 끊겨도 더는 로컬 그룹으로 추락하지 않아요(키-형태 폴백은 구 서버 호환용). §13.31.4-⑥ sweep cadence 도 신설: 회고 점검은 작업-단위로 — 세션 재개(quick) · ~5컷/7일(full) · 상주 보드 idle 시그니처(침묵+작업 지속; §13.27.4 상시 idle duty) · 히스토리 조작 직후 — /boardsweep 에 대응 "When to sweep" 절. verify-nway 20축 PASS.

이전: v2.5.162 (2026-07-19) — **echo-mode 기본값 배선 — provenance 시딩 + 상태 공지 + 에코 배지 (Constellation v2.4.58)** — §13.26.3 의 합류-출처 기본값이 prose 로만 있던 것을 코드로: 에이전트-스폰 합류 경로가 미등재 에이전트를 `{level:'on', provenance:'agent-spawned'}` 로 시딩하고(명시 토글은 절대 안 덮음), (재)접속마다 `EchoModeState` 를 멱등 공지하고(무타깃 — commitment-ack 비대상), 대시보드가 탭마다 에코 배지(on/mirror)를 달아요. constellation 소개 페이지에 9스킬 로스터 줄 추가. verify-nway 20축 PASS (tag-continuity 축 신설 — 유실됐던 v2.5.64/65 태그를 복원한 보드 정합 점검의 산물).

이전: v2.5.161 (2026-07-18) — **/subscaler 출시 — 티어 모델 조합이 Superscalar 토글로 (Superscalar v0.6.0, 플러그인 v0.2.0)** — frontier 메인이 실행-형 작업을 최상위 실행-티어 서브에이전트에 위임해요(Fable→Opus / Sol→Terra, effort high); §5.1 이 위임 rubric(명세-완결 작업은 위임·판단은 보유·레인마다 수락 기준+테스트 게이트)과 하네스별 적용 표면(조용한-폴백 경고 포함), 단일 마커 토글 상태를 실어요. 기본 OFF, fan-out 에서 ON — 공유 캐시를 이미 포기한 지점이니까요. 91출처 검증 리서치 기반. verify-nway 19축 PASS.

이전: v2.5.160 (2026-07-18) — **지원 표에 Kimi Code 실명화 (doc-only)** — 실측: Kimi Code CLI 는 프로젝트 루트 `AGENTS.md` 를 1급 지시 파일로 취급해요(자체 `/init` 이 이를 생성) — EG 코어 층은 폴백 행으로 이미 커버였고, 이제 그 노트와 함께 실명 등재(EN + KO ×3). 스킬+MCP+훅 스택이라 어댑터 계약 Stage 1 후보로는 Codex 보다 강함 — 큐 기록만, 출시 아님. 시드 무변경. verify-nway 19축 PASS.

이전: v2.5.159 (2026-07-18) — **room 고정 문서 + 보드 state 스키마 캐노니컬화 (Constellation v2.4.57, 플러그인 v0.3.29)** — 방마다 고정 문서 3종(개요 · append-only 결정 장부 · `covers_until` 실린 진행 요약)이 서버에 실리고, 조회/갱신 계약(`RequestRoomArtifacts` / `RoomArtifactsUpdate`, ack-by-reference 버전 아래 delta 브로드캐스트)·대시보드 📌 접이식 블록·서기 digest 의무가 함께 나왔어요; §13.31(신설)이 보드 데이터 계약 — `current[].stages {label, status: pending|active|done}` + 사용 규율 + 차터/스윕/스킬 훅 — 을 캐노니컬로 승격 — 렌더러 코드에만 있던 계약이 조용히 깨지는 게 실측됐기 때문. 스모크 22/22, verify-nway 19축 PASS.

이전: v2.5.158 (2026-07-18) — **boardsweep 이 소비자 축을 배움 (constellation 플러그인 v0.3.28)** — 어댑터 실측 결함 클래스: `{name,state}` 로 쓰인 stage 목록이 `{label,status}` 렌더러 아래 전부 PENDING 으로 스윕 2회를 살아남았어요 — 스윕이 저장소 사실만 대조하고 소비자가 읽는 계약은 대조하지 않았기 때문. schema normalization 이 이제 필드 키·값 도메인을 소비자 계약과 대조해요 — 렌더 폴백이 정확히 이 클래스를 조용히 삼켜요. verify-nway 19축 PASS.

이전: v2.5.157 (2026-07-18) — **3번째 어댑터의 실명화: Estrelle 역링크** — 공개 비전이 EG 를 에이전트 하네스로 명시한 자가호스팅 개인 AI OS, [Estrelle](https://github.com/SoliEstre/Estrelle) 이 라이브됐어요; Harness Adapter Contract 의 계획된-3번째-어댑터 자리에 실명과 상호 진입점 링크를 반영. contract-first 의 이행이에요. verify-nway 19축 PASS.

이전: v2.5.156 (2026-07-18) — **계약 짝: Harness Adapter Contract v0.1 + loop contract (§13.27.4)** — 개인 AI 환경 하네스 트랙의 스펙-선행 절반이에요: `plugins/HARNESS-ADAPTER-CONTRACT.md` 가 Codex 어댑터 관행을 문서 계약으로 승격(source-of-truth 전제 · 투영 표면 표 · 선언하되-침묵-금지 degradation · 생성기/검증 의무 · conformance Stage 1-3)하고, §13.27.4 가 headless 루프를 구현-독립 5요소(wake 소스 · at-least-once 커서 · 버전 차터 · 능력 하한 딸린 tier 라우팅 · supervisor 안전 경계)로 재진술해요. 의도적 분할: *언제 도는가*(loop) vs *무엇을 싣는가*(adapter) — 둘 다 구현한 호스트는 로컬 모델 포함 자체 루프에서 EG 규율을 무인 구동해요. verify-nway 19축 PASS.

이전: v2.5.155 (2026-07-17) — **Constellation v2.4.55 — roundtable 대시보드 진입점 (R3) + 피어 리뷰 반영** — 방이 보드에서 운용 가능해져요: 프롬프트 타깃 셀렉터의 **"➕ 라운드테이블…"** 이 생성 다이얼로그(주제 · 참여자 다중 선택 · persistent/temporary · 고급 가드 예산)를 열고, 방은 시안색 **라운드테이블 탭 그룹**의 `room:<id>` 채널로(서버 이벤트+인간+에이전트 트래픽 단일 인테이크), 방 탭은 `roomId` 로 발신하며 서버가 `human-operator` 를 스탬프해요. Playwright+가짜 에이전트 e2e **11/11 PASS**. 피어 리뷰 전건 반영 — 대표는 `maxAutoHop` 4→**6**(D4 준수 에이전트가 floor 에 먼저 걸리는 역전을 리뷰가 발견), notice non-wake 가이드·`RequestRoomArtifacts` 계약·파킹 재개 명문화·참여자별 latency 선언·echo-mode 제외 포함. verify-nway 19축 PASS.

이전: v2.5.154 (2026-07-17) — **Constellation v2.4.54 — roundtable 레퍼런스 서버 코어 (R2)** — §13.30 의 결정론 floor 가 `server.cjs` 에 실물로: 방 lifecycle + `rooms.json` 영속 + per-room 히스토리 채널, 기존 1:1 relay 위 참여자 fan-out(ack/재전달 기계 계승) + 단일 요약 delivered-ack, 시끄러운 가드 4종(rate · 연속 · `autoHop` 파킹+RoomStall · stall 신호), 인간 soft-yield(`RoomYield`+체인 리셋), notice-reply 표면화, 그리고 request 가 **체인 상한 파킹을 살아남는** advisory floor 큐(스모크가 찾은 정련: 메시지 파킹이 재개 신호까지 삼키면 안 됨). 신규 자기완결 `scripts/roundtable-smoke.cjs` 로 검증 — 18/18 PASS. 라이브 배포는 R3 대시보드 컷과 묶어 재시작 1회로. verify-nway 19축 PASS.

이전: v2.5.153 (2026-07-17) — **Constellation v2.4.53 — roundtable: 다자간 topic room (§13.30)** — 셋 이상의 화자(에이전트+사람)에게 1급 거처가 생겨요: **이층 분리** — 서버는 결정론적 floor 를 강제하고(기존 1:1 relay 위 room fan-out, 파킹하는 `autoHop` 체인 상한, rate+연속 발화 상한, stall 감지, 인간 soft-yield 우선권), 신규 **`/roundtable` 규율 스킬**이 판단 계층을 소유해요(침묵 기본값 게이팅, 지목 시 응답 의무, 발언권 bid, 고정 catch-up 순서, ack-by-reference). 어휘는 MUC/Matrix 계보(`voice`·`moderated`·`moderator`·`notice`) 정렬; 5축 딥리서치(121출처·적대 검증 12건)가 근거. 스펙-우선 컷 — 서버/대시보드 구현은 R2-R5 트랙. verify-nway 19축 PASS.

이전: v2.5.152 (2026-07-17) — **Constellation.md provenance-redaction 스윕** — 공개-repo redaction 규율(기술 내용만)을 스펙 본문에 적용: 사설 어댑터/에이전트명을 프로토콜 역할로 일반화(`upstream dev agent`·`downstream adapter`), 결정주체 표기(`main-upstream policy`/`user board directive`/`the user surfaced` 류)를 비인칭 `adopted <날짜>` + 기술적 사건 서술로 재작성, 발화 인용 1건 제거 — 23개소 27치환, 프로토콜/의미 변화 0. 아카이브 docs + 과거 CHANGELOG 잔존은 후속 패스로 등재. verify-nway 19축 PASS.

이전: v2.5.151 (2026-07-17) — **P4 앵커: `EUX_P4_SEED` env 오버라이드** — `constellation/history-store.p4.mjs` 의 고정 fast-check seed 가 env 오버라이드 가능한 기본값이 돼요: `EUX_P4_SEED` 가 `EUX_P4_IMPL`/`EUX_P4_RUNS` 훅 계열에 합류 — reverse-sync e2e 라운드가 앵커 파일을 건드리지 않고 양측에 새 seed 를 고정할 수 있고, 기본값(`20260711`)은 과거 판정과의 비교 가능성을 유지해요. 양방향 검증: 기본 실행은 과거 판정 정확 재현(6 attested · 1 공개 SKIP · 0 failed), 오버라이드 실행은 새 seed 반영 + 전 절 attested. verify-nway 19축 PASS.

이전: v2.5.150 (2026-07-17) — **Constellation v2.4.52 — `peer` 키 kind** — 타 프로젝트의 main 이 더는 `upstream` 키에 편승하지 않아요: `kind:'peer'` (`pk-` 접두사 · 전용 `?peerKey=` 파라미터 · `peer` wire role · `/join/peer` 온보딩 · KEY-MGMT v0.4) 가 peer-main 을 자율 upstream 에이전트와 end-to-end 분리. 대시보드에 피어 탭 그룹(로컬↔협업 사이, 로즈) + `Peer↔Peer`/`Peer↔Collab` 모니터, 메인 그룹에 `Main↔Peer` 신설(모든 모니터 lazy — 대화 없으면 숨김), 키 UI 에 🤝 피어메인 kind, 프롬프트 주입 행에 상시 인디케이팅 **타깃 셀렉터**(탭/그룹 선택 시 자동 해석, 현재-선택 한정 오버라이드). §13.9.3 에 피어-지연 규율 추가: 피어가 붙은 보드의 main 은 보드 잡일을 board-worker 에 위임해 피어 응대를 빠르게. verify-nway 19축 PASS.

이전: v2.5.149 (2026-07-17) — **docs: 설치 표면이 저장소를 따라잡음 — Compendium 설치 카드 + Codex 호스트 카드 + 32스킬 로스터** — 설치 섹션 플러그인 카드가 인트로의 "7종" 선언과 달리 6장이었던 것 (Compendium 카드 추가, "여섯 플러그인" ×3 → 일곱); v2.5.135 출시 후 32스킬로 성장한 Codex 어댑터가 changelog 산문에만 존재하던 것 — 환경별 섹션이 3호스트로 열리고 OpenAI Codex (어댑터) 카드가 실제 설치 단계 (`gen-codex-adapter.cjs --install` · `config.toml.example` 스탠자 · `codex/AGENTS.md` hook-replacement 규율) 를 싣게 됨 + README 브릿지 표 Codex 행이 "AGENTS.md 직접 참조" 과소-클레임 대신 어댑터를 가리킴 (EN + KO 3벌); 신설 `#skills` 섹션이 32스킬 전부를 플러그인별 7카드 + 호출 분류로 열거. verify-nway 19축 PASS.

이전: v2.5.148 (2026-07-17) — **v2.5.147 출시 직후 적대적 검증 — 8건 수정** — 방금 출시한 컷에 3-렌즈 회의 패스(검열/일반성 · 인용 표면과의 정합 · 수치 전수 대조)를 돌려 10건 발견, 8건을 여기서 수정 (킷 v0.2.1 · Constellation 플러그인 v0.3.25): boardsweep 이 한 사설 배치의 `modes.tone` 을 보편 스키마처럼 제시하던 것 일반화, 범위 서술을 "에이전트가 작성하는 모든 컴포넌트"로 정직화 + 위키 투영을 스윕 목록에 + `current[]` 누락-추가 조항; eg-memsync 시드 경계를 승격 한정으로 스코프하고 시드 절 내부 드리프트는 날짜-메모리 규칙으로 해소 + 의도적 로컬 분기로 표시; codex/README 수기 카운트 탈경화("22 스킬" ×4, v2.5.135 이래 동결); 소개 페이지 설치 인트로가 아래 카드와 같은 절차 5종으로. 선재 발견 2건은 별도 트랙 등재 (Constellation.md Provenance 검열 스윕 · compendium-lint 자기 카운트). verify-nway 19축 PASS.

이전: v2.5.147 (2026-07-17) — **`/eg-memsync` + `/boardsweep` — 정합 스킬 2종** — 킷(v0.2.0)에 다섯 번째 절차 `eg-memsync`(`/egmem`): 에이전트 메모리와 거버넌스 문서를 양방향 전수 대조 — 드리프트 5종 검출, 날짜 있는 메모리가 날짜 없는 산문에 우선, 저장소 실재가 낡은 상태-메모리를 종결, 진성 모순은 자동 판정 없이 surface, 메모리에만 있는 영구 규칙은 4개 경계(성숙도 · 관행-vs-헌장 · `/egup` 의 시드 경계 · pointer-not-paraphrase) 아래 문서로 승격 + 공개 repo redaction 게이트. Constellation 플러그인(v0.3.24)엔 `/roundnext` 의 회고 방향 짝 `boardsweep`: 실시간 채팅 제외 전 보드 컴포넌트 정합 — `done[]` VCS 실증, 출시된 planned 이관, 해소된 검토사안 closure, 레지스트리 가지치기, 톤 정규화, 조작 금지. boardsweep 은 보드의 *주장*을 고치고, `/roundnext` 는 *다음 행동*을 정함. Codex 어댑터 스킬 29 → 32. verify-nway 19축 PASS.

이전: v2.5.146 (2026-07-13) — **`estregenesis` — 킷 플러그인: EG 자체를 명령으로** — 이제 EG 도입에 raw 깃허브 URL 을 찾아다닐 일이 없음. 절차 4종: `/egboot` (신규 프로젝트) · `/egmig` (기존 룰 파일 — 모든 룰을 승격하거나 사유와 함께 폐기) · `/egup` (시드 + 플러그인 델타, 가산형, 로컬 편집이 이김) · `/egrich` (풀 무장, 비용 선고지). 오분류 시 맞는 형제로 라우팅하고, 짧은 이름 3종은 **복사본이 아니라 포인터 별칭** (Compendium 의 pointer-not-paraphrase 를 플러그인 자기 표면에 적용). 스킬은 시드를 가져와 실행할 뿐 재진술하지 않고, 가져올 수 없는 시드를 기억으로 재구성하지 않음. 의존성 0, 런타임 없음. **promo 훑기**: 60초 시작이 명령 하나 경로를 먼저 제시; Compendium 카드가 런타임 출시 5릴리스 뒤에도 "v0.1.0, design draft" 광고 중이었음; 플러그인 로스터가 Constellation v0.3.16 에 동결; `docs/index.html` 에 킷 카드 추가. **verify-nway 구멍 해소**: `readme-current` 축이 언어별 첫 마커만 매칭 — 뒤쪽 버전 관리 사본 2벌이 v2.5.137 에 8컷 동결인데도 PASS 였음. 이제 전 마커 검사. 19축, 드리프트 0.

이전: v2.5.137 (2026-07-08) — **플러그인 로드-에러 수정 (CC 2.1.x 스키마 정합) 5개 플러그인 + verify-nway 재발방지 축** — 다운스트림 어댑터의 `claude plugin validate` 가 플러그인 매니페스트가 현행 Claude Code 플러그인 스키마에서 어긋난 3가지를 표면화(해당 표면 쓰는 플러그인의 로드/스킬 파손). 전부 수정 + 재발 불가하게 기계화. **(1) `hooks/hooks.json` 래퍼 (🔴 로드 차단)** — 이벤트가 최상위 `"hooks"` 키 아래 있어야 하는데 constellation/hyperbrief/ultrasafe 는 최상위(`{"Stop":[…]}`)라 validate 실패 + **플러그인 전체** 로드 차단. `{"hooks":{…}}` 로 래핑 + 스키마 외 `_comment` 제거. **(2) `mcp` 아닌 `mcpServers` (🟡)** — CC 는 plugin.json 최상위 `mcp` 필드를 무시; 현행 키는 `mcpServers`. MCP 보유 4종(constellation/hyperbrief/ultrasafe/compendium) 전부 리네임 → 번들 서버 실제 로드. **(3) SKILL.md frontmatter YAML (🟡)** — 미인용 `description:` 에 `: `(콜론+공백) 포함 시 strict-YAML 파싱 실패 → 스킬이 **빈 메타**로 로드(name/description 없음 → 트리거 불가). 4개 플러그인 6개 스킬 해당(echo-mode, hyperbrief-revisit, ultrasafe-ai-llm-redteam, **compendium-curate, compendium-lint, routinize** — 뒤 3개는 어댑터 리포트가 hooks 보유 3종만 validate 해서 누락); 6개 description 전부 이중인용. **(4) 재발방지** — 신규 **plugin-schema verify-nway 축(18번째)** 이 3가지를 컷 시점에 게이트(hooks 래퍼 · SKILL frontmatter plain-scalar 안전 · `mcpServers` 키), 공식 code.claude.com/docs 플러그인 레퍼런스 기준 — 수정 전 18개 위반을 전부 검출. 패치 릴리스: constellation 0.3.22 · hyperbrief 0.7.1 · ultrasafe 0.2.3 · compendium 0.2.6 · greatpractice 0.3.4. Codex 어댑터의 MCP 탐색도 `mcpServers` 읽도록 갱신. verify-nway 18축 PASS.

이전: v2.5.136 (2026-07-05) — **Greatpractice v0.3.3 — 첫 model-invoked 스킬 `routinize`(관행화) + `/before-compact` soft 체이닝** — Greatpractice 가 첫 Agent Skill 을 얻어요 — capture→mature→codify 파이프라인(§1.2/§5.4)의 model-invoked 관문. **`/routinize`** 는 *반복되는* 작업 패턴을 durable 관행으로 codify 하되, 모듈의 **포착-즉시 / 승격-지연** 규율에 충실해요: 패턴을 `memory/feedback_*.md` 에 즉시 포착(cost-0, blameless voice), 재발 시 좌표 누적, §5.2 notability gate 통과 시**에만** `_propose/` 초안 생성(substantive 3회+ × *독립* 좌표 2종+ × verifiable — 한 세션 반복은 대개 1좌표라 대부분 포착에서 끝남), enforcing hook 을 **절대 자가-ratify 안 함**(차단 항목 승격은 사용자 게이트, §5.4 gate 3). phronesis-heavy 작업(판단-heavy / 희소맥락 / 고맥락의존)은 설계상 제외(§1.4/§5.3). **최적 트리거 = `/before-compact` 타이밍**: 세션의 쌓인 컨텍스트가 원재료인데 곧 compaction 으로 사라지니, `before-compact` 스킬에 `/routinize` 를 먼저 돌리는 soft Step-0 추가(opt-in — Greatpractice 미채택 시 스킵) — 둘은 상보적(routinize=세션 간 반복 포착, before-compact=이번 세션 in-flight 포착). Codex 어댑터가 신규 스킬을 자동 반영(22스킬 투영). verify-nway 17축 PASS.

이전: v2.5.135 (2026-07-05) — **Codex 어댑터 (Stage 1) + Compendium v0.2.5 (어댑터가 표면화한 MCP 선언 갭)** — EstreGenesis 모듈을 이제 Claude Code 뿐 아니라 **OpenAI Codex** 에서도 쓸 수 있어요. **(1) Codex 어댑터 (`codex/`)** — Codex 가 2026 에 EG 가 이미 쓰는 세 커스터마이즈 표면(Agent Skills `SKILL.md` · MCP 서버 · `AGENTS.md`)으로 수렴해서, 6개 모듈이 거의 변환 없이 이식돼요. 21개 canonical `SKILL.md` 를 복제하는 대신(Migration-B dogfood 가 경고한 드리프트 표면), 어댑터는 **투영**이에요: `gen-codex-adapter.cjs` 가 스킬을 Codex 탐색 경로에 온디맨드로 materialize(`--install`, 심링크/복사)하고, Codex 전용 파생 표면만 재생성 — `config.toml.example`(4개 MCP `[mcp_servers.*]` 스탠자) + README 인벤토리. 손작성 `codex/AGENTS.md` 는 **훅 대체 규율**을 담아요: Codex 엔 lifecycle 훅이 없어 6개 Claude Code 훅 각각을 페어 스킬 수동 호출로 매핑 — 자동화는 안 가도 규율은 이식돼요(북극성 논지의 구체화). 신규 EG-ops **codex-adapter verify-nway 축**(`gen --check`, 17번째)이 커밋된 표면을 라이브 plugin 집합과 대조 게이트. **(2) Compendium v0.2.5** — 어댑터 구축 중 진짜 배선 갭 발견: Compendium MCP 서버(§10 8-tool 런타임, v2.5.114 출하)가 `plugins/compendium/.claude-plugin/plugin.json` 에 **선언되지 않아** 어떤 호스트도 자동 등록 못 하던 상태. 스모크 테스트 정상(initialize + tools/list → wiki_read/search/upsert/…) 확인 후 선언 — Claude Code 도 고치고 어댑터가 4개 MCP 전부 투영하게 함. N-way 버전 cascade 전체(plugin.json + marketplace + mcp/package.json + Compendium.md frontmatter + docs badge/meta/module-tag). verify-nway 17축 PASS.

이전: v2.5.134 (2026-07-05) — **docs: promo 페이지 staleness 전수 스윕 — 누적 패널 동결 해제, 6모듈 정정, Constellation v2.4.24–46 기능 파동 소개 추가** — 공개 promo 페이지 전수 stale-콘텐츠 스윕(에이전트 스윕, EN+KO, 3 독자층 전부)에서 기계검사 배지/meta 는 갱신돼 왔지만 본문 prose 가 동결돼 있던 곳들을 찾아 전부 수정. **(1) index.html** — "선택 모듈 2종" → 6종 (dev+expert, 양 언어); "24h baseline 이후 누적" 패널을 "v2.5.36 / Hyperbrief 가 신규 3번째 모듈" 동결 상태에서 현행 기록(v2.5.133 대역 · 모듈 4종 추가 → 총 6종 · Constellation §13.23–§13.26 파동 · M2 어댑터 dogfood 흡수)으로 해제, 지표 갱신 (~21→~118 cuts, 신규모듈 1→4, 어댑터 bundle·리포트 3→4, 통합 2→6+); Ultrasafe 스테이징 3곳 정정 ("advisory v0.1.x → blocking v0.2.x" → "advisory v0.2.x 라이브+자가 도그푸딩 → blocking v0.3+"); Greatpractice 카드를 "v0.1.0 첫 cut + v0.2–0.4 roadmap" 프레임에서 출하된 v0.3.2 상태로 재앵커; Compendium general 카드가 어떤-vault-위에서든-동작하는 이식 규율 프레이밍으로 선도; Constellation 카드에 v2.4.24–46 하이라이트 추가. **(2) constellation.html** — 대표 페이지 본문이 dogfood 시대(§13.16.12 / v2.5.15 relay) 이후 기능을 하나도 소개하지 않던 상태: "What's inside" 신규 카드 2장으로 §13.23–§13.25 보드 substrate 파동(backends 레지스트리 + board-worker projection, PWA + 무의존 Web Push, 표면별 접속 제어 + CIDR + 노출 토글, 위키 cross-link 사이드 패널, ack ✓ 원줄 UX)과 §13.26 echo-mode(3-상태 로컬↔보드 원격제어 미러)를 소개. **(3) hyperbrief.html** — "18 가지 안티패턴" → 26 (자기 배지와 정합). **(4) greatpractice.html** — "v0.1.0 사양" / "v0.2–v0.4 roadmap 정의" → 현재 v0.3.2, v0.2/v0.3 은 ship 됨으로, v0.4+ 는 open 으로. Docs only, EN/KO. verify-nway 16축 PASS.

이전: v2.5.133 (2026-07-04) — **Migration-B dogfood 후속 — 시드 레지스트리 6종(Compendium) + backends.json re-sync preserve 규칙 + runtime notes 분리 + README KO 현재 동결 해제 (Constellation v2.4.46, 시드 v2.5.1)** — 다운스트림 어댑터가 Migration-B(M2) 풀 업그레이드(시드 v2.4.3→v2.5.0 + release delta ~92패치)를 수행한 dogfood 리포트가 ship-surface 공백 3건을 표면화 — 전부 수정 + 컷 중 발견 1건 추가. **(1) 시드 모듈 레지스트리 → 6종.** 시드 § EG 모듈 레지스트리가 release 트랙의 Compendium(v2.5.110 ship) 을 누락한 5종 상태 — 시드만 읽는 어댑터는 6번째 모듈을 놓침(리포트의 dual-marker cross-check 가 검출; 실어댑터가 release 트랙에서 Compendium 을 실채택한 만큼 레지스트리의 production-보류 예외 해제). 6개 시드 전부(KO/EN × Master/Lite/Compact)에 Compendium 행 + "선택 모듈 6종" 인트로; 시드 마커 v2.5.0→**v2.5.1**; EG-ops verify-nway 시드-레지스트리 axis 6모듈 확장. **(2) backends.json re-sync preserve 규칙(§13.23.2).** 배포 config(boardTitle·roster)가 대시보드 기본 fetch 경로상 reference `dashboard/` 복사셋 *내부*에 있어 벤더-카피 풀 re-sync 가 어댑터 브랜딩을 clobber — preserve-list 규칙을 스펙에 명시. **(3) reference/runtime dev-notes 분리.** `*-NOTES.md` 3편을 `runtime/notes/` 로 이동, runtime 복사 표면을 런타임 전용화. **(4) README KO 버저닝 동결 해제.** 컷 중 발견: README KO **현재** 항목이 22컷 동안 v2.5.110 에 동결(매 컷 EN Current 만 갱신); v2.5.133 으로 동기 + 신규 **readme-current** verify-nway axis(EN Current ↔ KO 현재 ↔ data.js)로 결정론화. verify-nway 16축 PASS.

이전: v2.5.132 (2026-07-04) — **Constellation v2.4.45 — echo-mode(원격제어 미러) + ack ✓ UX** — 라이브보드 2가지 추가. **(1) echo-mode (§13.26)** — 에이전트의 로컬 사람↔에이전트 대화를 보드 실시간 대화 채널에 **양방향** 미러하는 3-레벨 per-agent 모드(`off`/`on`/`mirror`) — 보드를 보는 사람이 보드에서 에이전트를 *구동*할 수 있는 remote-control 기반. `on`=턴 최종 텍스트 / `mirror`=+라이브 활동 스트림(tool·step·thinking narration, 채팅 게이트웨이 느낌). 보드 입력은 `UserPrompt` 로 도착→로컬 대화에 `> board: …` 인용 후 처리; 구조적 선택은 로컬은 평문 선택지 / 보드는 `SelectionPrompt` chip(로컬 블로킹 UI 금지, §13.17). 기본값은 **합류 출처**(사람합류=off·에이전트스폰=on — 아무도 직접 안 띄운 에이전트는 보드가 유일 채널). 프로토콜(§13.26) + `/echo-mode` 스킬 + deps-0 `echo-emit.cjs` 3-phase 레퍼런스 훅(PreToolUse/PostToolUse 라이브 진행 + Stop 턴텍스트+thinking 요약, 레벨 게이팅) 출하. 라이브 end-to-end 도그푸딩(보드→로컬 구동 + 로컬→보드 미러). **(2) ack ✓ UX** — `UserPromptAccepted`/`Ack`/`AckProcessed` 를 별도 코드값 줄 대신 **원** 요청/메시지 줄에 ✓ 스탬프(promptId / msgId 상관) + 커서 4분면 hover 팝업(시각·agent, 클릭 고정); 라이브 로컬에코 줄이 promptId 를 실어 실시간 ack 도 제자리 표시(종전엔 History replay 만). verify-nway 15축 PASS.

이전: v2.5.110 (2026-06-15) — **Compendium v0.1.0 — 6번째 모듈 (design draft)** — EstreGenesis 의 어휘-substrate 모듈 착지: 개념-앵커 이중 register 용어집(한 개념 → register-중립 정의 1개 + register 태그된 term/gloss; 전문어↔일반어 매핑은 공유 `concept_id` 안에 암묵적, brittle 한 term-A↔term-B 링크 아님) + cross-module 위키 + 교차링크/클릭-정의. normative 한 건 아무것도 안 가짐 — 모든 항목이 소유 모듈 spec(SSoT)으로의 단방향 포인터, 유일 예외는 어느 모듈도 안 가진 general-register 어휘. 북극성 axis-2(어휘 생존 > 코드 생존)의 가장 순수한 표현이자 deprecated 어휘의 재배치 home(axis-3 eviction 일급) — 자기 자신의 eviction 도 모델링. 어드버서리얼 설계 리뷰로 우-사이징: v0.1 은 모델 + 콘텐츠 경계 헌장 + ~25 EG 시드 exemplar + 4 가드닝 lint + 포인터-해소 검사만, 승격은 count→Hyperbrief 브리프 큐잉 단일 게이트로 축소하고 hysteresis/debounce 자동화·a11y 컴포넌트·멀티탭 split·MCP 런타임·대시보드 표면은 v0.2+ 의 명명된 prunable 단위로 연기. 등록: `plugins/compendium/` manifest + marketplace(5→6) + verify-nway Compendium plugin-버전 axis + README/docs 모듈 수 5→6 (`docs/index.html` "Six graduated modules"). seed-registry 등재는 production 까지 보류(design-draft). 스펙: `Compendium.md`.

이전: v2.5.109 (2026-06-15) — **Greatpractice + Ultrasafe 스펙 영어 변환** — foundational 스펙(Constellation / Hyperbrief / Superscalar)은 영어인데 본문이 한국어로 드리프트해 있던 `Greatpractice.md`·`Ultrasafe.md` 를 영어로 통일했어요 — 공개 standard-proposing 표면의 일관성 패스. **의미 변화 0**: 1:1 라인 치환(Greatpractice 1056/1056, Ultrasafe 2507/2507 insert/delete; heading·코드블록·YAML 키·버전·§참조·표·인용 전부 verbatim 보존 — heading/fence/table 카운트 구조 검증이 원본과 동일). 유일하게 남긴 한국어는 Greatpractice §6.3/§12.3 의 voice-linter 정규식 매칭 대상(번역하면 lapse 탐지 패턴이 깨짐). 모듈 버전 무변경(Greatpractice v0.3.1, Ultrasafe v0.2.2) — 모듈 범프 아닌 EG-릴리스 doc cut.

이전: v2.5.108 (2026-06-14) — **docs meta-description 버전 드리프트 + verify-nway 12번째 axis** — docs 페이지의 모듈별 `<meta name="description">` 버전 표기가 어떤 verify axis 에도 안 잡힌 채 드리프트해 있었음: constellation v2.3.23→v2.4.36, hyperbrief v0.5.6→v0.7.0, greatpractice v0.1.0→v0.3.1, ultrasafe v0.2.1→v0.2.2; index.html 은 여전히 "three graduated modules"(→five) 광고. README KO heading "3 선택 모듈"(→5), install-block plugin 버전 stale(Constellation v0.2.3→v0.3.16, Hyperbrief v0.5.6→v0.7.0, Greatpractice v0.1.0→v0.3.1, Ultrasafe v0.2.2 추가) + "all four"/"넷"→"all five"/"다섯". 새 **docs-meta axis(12번째)** 가 각 페이지 meta 버전을 모듈 frontmatter canonical 버전 + index 모듈 수와 대조해 이 표면이 더는 미검출 드리프트를 못 냄. 모듈 버전 자체는 무변경(표기만 정정). verify-nway 12축 PASS, 0 드리프트.

이전: v2.5.107 (2026-06-13) — **Constellation v2.4.36 — 모바일 실시간 그룹 스와이프 (#3a B)** — 확정한 모바일 네비 재구성의 거동 절반(B) (A = v2.4.31 하단 탭바). ≤560px 에서 실시간 창의 내용 영역이 가로 **scroll-snap 페이저**가 됨 — 채널 그룹별 한 페이지(업스트림/메인/보드워커/로컬/협업, 각 그룹의 시간순 병합뷰). **스와이프**로 그룹단위 전환되고, 탭바의 **선택 + 가로 스크롤이 따라옴**(양방향 동기); 페이저 아래 점(dot) 띠가 현재 그룹을 표시. **탭**(그룹 헤더 또는 채널)을 누르면 페이저가 그 그룹 페이지로 자동 수평 스크롤. 데스크탑(>560px)은 무영향 — 단일 `#ws-stream`, 페이저 없음. 구현: `wsRenderActiveStream` 을 컨테이너 인자형 `wsRenderStreamInto` 로 리팩터, 그룹 계산을 `wsComputeGroups` 로 분리해 탭바와 페이저가 동일 그룹 집합/순서를 공유; 560px `matchMedia` 로 모드 전환; 스와이프 정착은 debounced `scroll` + 프로그램-스크롤 가드로 감지(탭 탭 스크롤 ≠ 사용자 스와이프 — 피드백 루프 없음); 라이브 행은 active 그룹 페이지만 재렌더(타 그룹 행은 unseen 뱃지만 증가). 중복 렌더 위험 없음 — 채널은 정확히 한 그룹 페이지에만 속함(페이지=그룹, 채널 아님). Playwright 390×844: 스와이프→그룹전환 + 탭바 동기 + 점 인디케이터, 탭→페이저 스크롤, 콘솔 에러 0; 보드 smoke 13/13(회귀 0). 모바일 한정, 실기기 테스트 필요. 레퍼런스 대시보드(index.html/app.js/style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

이전: v2.5.106 (2026-06-13) — **Constellation v2.4.35 — 모바일 실시간 창 fullscreen 갭 수정** — v2.4.31 모바일 하단탭바 재구성의 후속, Playwright 390px 실측으로 포착: 실시간 창 우측 ~16px·하단 띠에 페이지 배경이 비쳤음. 원인(추측 아닌 computed geometry 실측 — `width`/`100vw` override 가 계속 374px 로 resolve): 데스크탑용 `.ws-pop` 의 `max-width:96vw`+`max-height:92vh` 캡이 모바일 fullscreen pane 을 390×844 뷰포트 안에서 374×776 으로 잘랐던 것. 픽스: ≤560px 규칙에 `max-width:none`+`max-height:none`(+ `width:100vw`/`height:100dvh`) → pane 이 뷰포트를 끝까지 채움; 하단 탭바는 z-index 로 위에 overlay, pane body 는 하단 패딩 유지로 입력창이 탭바에 안 가림. 390×844 정확히 채움 검증(popRect right=390·bottom=844). 레퍼런스 대시보드(style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

그 이전 릴리스: 모든 항목이 [CHANGELOG.md](CHANGELOG.md) 에 보존돼 있어요 — 이 목록은 최근 몇 건만 유지해요.

**전체 변경 이력** (v1.0 부터 모든 릴리스, EN + KO): [CHANGELOG.md](CHANGELOG.md).

본 upstream repository 의 `CHANGELOG.md` 가 changelog SSoT. 각 시드 파일은 tier, 언어, 현재 버전, counterpart, 그리고 시드를 복사한 대상 프로젝트의 README가 아닌 본 `CHANGELOG.md` 포인터만 담은 짧은 헤더 메타데이터를 유지. 마이그레이션 B 로 프로젝트 업그레이드 시 에이전트는 시드 헤더의 버전 마커와 본 changelog 로 delta 를 계산.


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
{\r''`, 그리고 전 패턴에 `\r` 이 붙어 매칭 전멸→시크릿 스테이징된 `.gitignore`)을 유발 → `*.sh/*.cjs text eol=lf` 로 방지. behavioral 스모크 검증(AgentHello-only inbox 는 wake 없이 re-arm; always 모드는 standby 무시; 폴당 누수 없음). 더 큰 스펙-갭 제안(G1–G8 역할어휘 / 헤드리스-루프 스펙절 / ephemeral-peer 프레즌스 / intent-tier 컬럼 / board 백업 계약)은 별도 triage. verify-nway 18축 PASS.

이전: v2.5.137 (2026-07-08) — **플러그인 로드-에러 수정 (CC 2.1.x 스키마 정합) 5개 플러그인 + verify-nway 재발방지 축** — 다운스트림 어댑터의 `claude plugin validate` 가 플러그인 매니페스트가 현행 Claude Code 플러그인 스키마에서 어긋난 3가지를 표면화(해당 표면 쓰는 플러그인의 로드/스킬 파손). 전부 수정 + 재발 불가하게 기계화. **(1) `hooks/hooks.json` 래퍼 (🔴 로드 차단)** — 이벤트가 최상위 `"hooks"` 키 아래 있어야 하는데 constellation/hyperbrief/ultrasafe 는 최상위(`{"Stop":[…]}`)라 validate 실패 + **플러그인 전체** 로드 차단. `{"hooks":{…}}` 로 래핑 + 스키마 외 `_comment` 제거. **(2) `mcp` 아닌 `mcpServers` (🟡)** — CC 는 plugin.json 최상위 `mcp` 필드를 무시; 현행 키는 `mcpServers`. MCP 보유 4종(constellation/hyperbrief/ultrasafe/compendium) 전부 리네임 → 번들 서버 실제 로드. **(3) SKILL.md frontmatter YAML (🟡)** — 미인용 `description:` 에 `: `(콜론+공백) 포함 시 strict-YAML 파싱 실패 → 스킬이 **빈 메타**로 로드(name/description 없음 → 트리거 불가). 4개 플러그인 6개 스킬 해당(echo-mode, hyperbrief-revisit, ultrasafe-ai-llm-redteam, **compendium-curate, compendium-lint, routinize** — 뒤 3개는 어댑터 리포트가 hooks 보유 3종만 validate 해서 누락); 6개 description 전부 이중인용. **(4) 재발방지** — 신규 **plugin-schema verify-nway 축(18번째)** 이 3가지를 컷 시점에 게이트(hooks 래퍼 · SKILL frontmatter plain-scalar 안전 · `mcpServers` 키), 공식 code.claude.com/docs 플러그인 레퍼런스 기준 — 수정 전 18개 위반을 전부 검출. 패치 릴리스: constellation 0.3.22 · hyperbrief 0.7.1 · ultrasafe 0.2.3 · compendium 0.2.6 · greatpractice 0.3.4. Codex 어댑터의 MCP 탐색도 `mcpServers` 읽도록 갱신. verify-nway 18축 PASS.

이전: v2.5.136 (2026-07-05) — **Greatpractice v0.3.3 — 첫 model-invoked 스킬 `routinize`(관행화) + `/before-compact` soft 체이닝** — Greatpractice 가 첫 Agent Skill 을 얻어요 — capture→mature→codify 파이프라인(§1.2/§5.4)의 model-invoked 관문. **`/routinize`** 는 *반복되는* 작업 패턴을 durable 관행으로 codify 하되, 모듈의 **포착-즉시 / 승격-지연** 규율에 충실해요: 패턴을 `memory/feedback_*.md` 에 즉시 포착(cost-0, blameless voice), 재발 시 좌표 누적, §5.2 notability gate 통과 시**에만** `_propose/` 초안 생성(substantive 3회+ × *독립* 좌표 2종+ × verifiable — 한 세션 반복은 대개 1좌표라 대부분 포착에서 끝남), enforcing hook 을 **절대 자가-ratify 안 함**(차단 항목 승격은 사용자 게이트, §5.4 gate 3). phronesis-heavy 작업(판단-heavy / 희소맥락 / 고맥락의존)은 설계상 제외(§1.4/§5.3). **최적 트리거 = `/before-compact` 타이밍**: 세션의 쌓인 컨텍스트가 원재료인데 곧 compaction 으로 사라지니, `before-compact` 스킬에 `/routinize` 를 먼저 돌리는 soft Step-0 추가(opt-in — Greatpractice 미채택 시 스킵) — 둘은 상보적(routinize=세션 간 반복 포착, before-compact=이번 세션 in-flight 포착). Codex 어댑터가 신규 스킬을 자동 반영(22스킬 투영). verify-nway 17축 PASS.

이전: v2.5.135 (2026-07-05) — **Codex 어댑터 (Stage 1) + Compendium v0.2.5 (어댑터가 표면화한 MCP 선언 갭)** — EstreGenesis 모듈을 이제 Claude Code 뿐 아니라 **OpenAI Codex** 에서도 쓸 수 있어요. **(1) Codex 어댑터 (`codex/`)** — Codex 가 2026 에 EG 가 이미 쓰는 세 커스터마이즈 표면(Agent Skills `SKILL.md` · MCP 서버 · `AGENTS.md`)으로 수렴해서, 6개 모듈이 거의 변환 없이 이식돼요. 21개 canonical `SKILL.md` 를 복제하는 대신(Migration-B dogfood 가 경고한 드리프트 표면), 어댑터는 **투영**이에요: `gen-codex-adapter.cjs` 가 스킬을 Codex 탐색 경로에 온디맨드로 materialize(`--install`, 심링크/복사)하고, Codex 전용 파생 표면만 재생성 — `config.toml.example`(4개 MCP `[mcp_servers.*]` 스탠자) + README 인벤토리. 손작성 `codex/AGENTS.md` 는 **훅 대체 규율**을 담아요: Codex 엔 lifecycle 훅이 없어 6개 Claude Code 훅 각각을 페어 스킬 수동 호출로 매핑 — 자동화는 안 가도 규율은 이식돼요(북극성 논지의 구체화). 신규 EG-ops **codex-adapter verify-nway 축**(`gen --check`, 17번째)이 커밋된 표면을 라이브 plugin 집합과 대조 게이트. **(2) Compendium v0.2.5** — 어댑터 구축 중 진짜 배선 갭 발견: Compendium MCP 서버(§10 8-tool 런타임, v2.5.114 출하)가 `plugins/compendium/.claude-plugin/plugin.json` 에 **선언되지 않아** 어떤 호스트도 자동 등록 못 하던 상태. 스모크 테스트 정상(initialize + tools/list → wiki_read/search/upsert/…) 확인 후 선언 — Claude Code 도 고치고 어댑터가 4개 MCP 전부 투영하게 함. N-way 버전 cascade 전체(plugin.json + marketplace + mcp/package.json + Compendium.md frontmatter + docs badge/meta/module-tag). verify-nway 17축 PASS.

이전: v2.5.134 (2026-07-05) — **docs: promo 페이지 staleness 전수 스윕 — 누적 패널 동결 해제, 6모듈 정정, Constellation v2.4.24–46 기능 파동 소개 추가** — 공개 promo 페이지 전수 stale-콘텐츠 스윕(에이전트 스윕, EN+KO, 3 독자층 전부)에서 기계검사 배지/meta 는 갱신돼 왔지만 본문 prose 가 동결돼 있던 곳들을 찾아 전부 수정. **(1) index.html** — "선택 모듈 2종" → 6종 (dev+expert, 양 언어); "24h baseline 이후 누적" 패널을 "v2.5.36 / Hyperbrief 가 신규 3번째 모듈" 동결 상태에서 현행 기록(v2.5.133 대역 · 모듈 4종 추가 → 총 6종 · Constellation §13.23–§13.26 파동 · M2 어댑터 dogfood 흡수)으로 해제, 지표 갱신 (~21→~118 cuts, 신규모듈 1→4, 어댑터 bundle·리포트 3→4, 통합 2→6+); Ultrasafe 스테이징 3곳 정정 ("advisory v0.1.x → blocking v0.2.x" → "advisory v0.2.x 라이브+자가 도그푸딩 → blocking v0.3+"); Greatpractice 카드를 "v0.1.0 첫 cut + v0.2–0.4 roadmap" 프레임에서 출하된 v0.3.2 상태로 재앵커; Compendium general 카드가 어떤-vault-위에서든-동작하는 이식 규율 프레이밍으로 선도; Constellation 카드에 v2.4.24–46 하이라이트 추가. **(2) constellation.html** — 대표 페이지 본문이 dogfood 시대(§13.16.12 / v2.5.15 relay) 이후 기능을 하나도 소개하지 않던 상태: "What's inside" 신규 카드 2장으로 §13.23–§13.25 보드 substrate 파동(backends 레지스트리 + board-worker projection, PWA + 무의존 Web Push, 표면별 접속 제어 + CIDR + 노출 토글, 위키 cross-link 사이드 패널, ack ✓ 원줄 UX)과 §13.26 echo-mode(3-상태 로컬↔보드 원격제어 미러)를 소개. **(3) hyperbrief.html** — "18 가지 안티패턴" → 26 (자기 배지와 정합). **(4) greatpractice.html** — "v0.1.0 사양" / "v0.2–v0.4 roadmap 정의" → 현재 v0.3.2, v0.2/v0.3 은 ship 됨으로, v0.4+ 는 open 으로. Docs only, EN/KO. verify-nway 16축 PASS.

이전: v2.5.133 (2026-07-04) — **Migration-B dogfood 후속 — 시드 레지스트리 6종(Compendium) + backends.json re-sync preserve 규칙 + runtime notes 분리 + README KO 현재 동결 해제 (Constellation v2.4.46, 시드 v2.5.1)** — 다운스트림 어댑터가 Migration-B(M2) 풀 업그레이드(시드 v2.4.3→v2.5.0 + release delta ~92패치)를 수행한 dogfood 리포트가 ship-surface 공백 3건을 표면화 — 전부 수정 + 컷 중 발견 1건 추가. **(1) 시드 모듈 레지스트리 → 6종.** 시드 § EG 모듈 레지스트리가 release 트랙의 Compendium(v2.5.110 ship) 을 누락한 5종 상태 — 시드만 읽는 어댑터는 6번째 모듈을 놓침(리포트의 dual-marker cross-check 가 검출; 실어댑터가 release 트랙에서 Compendium 을 실채택한 만큼 레지스트리의 production-보류 예외 해제). 6개 시드 전부(KO/EN × Master/Lite/Compact)에 Compendium 행 + "선택 모듈 6종" 인트로; 시드 마커 v2.5.0→**v2.5.1**; EG-ops verify-nway 시드-레지스트리 axis 6모듈 확장. **(2) backends.json re-sync preserve 규칙(§13.23.2).** 배포 config(boardTitle·roster)가 대시보드 기본 fetch 경로상 reference `dashboard/` 복사셋 *내부*에 있어 벤더-카피 풀 re-sync 가 어댑터 브랜딩을 clobber — preserve-list 규칙을 스펙에 명시. **(3) reference/runtime dev-notes 분리.** `*-NOTES.md` 3편을 `runtime/notes/` 로 이동, runtime 복사 표면을 런타임 전용화. **(4) README KO 버저닝 동결 해제.** 컷 중 발견: README KO **현재** 항목이 22컷 동안 v2.5.110 에 동결(매 컷 EN Current 만 갱신); v2.5.133 으로 동기 + 신규 **readme-current** verify-nway axis(EN Current ↔ KO 현재 ↔ data.js)로 결정론화. verify-nway 16축 PASS.

이전: v2.5.132 (2026-07-04) — **Constellation v2.4.45 — echo-mode(원격제어 미러) + ack ✓ UX** — 라이브보드 2가지 추가. **(1) echo-mode (§13.26)** — 에이전트의 로컬 사람↔에이전트 대화를 보드 실시간 대화 채널에 **양방향** 미러하는 3-레벨 per-agent 모드(`off`/`on`/`mirror`) — 보드를 보는 사람이 보드에서 에이전트를 *구동*할 수 있는 remote-control 기반. `on`=턴 최종 텍스트 / `mirror`=+라이브 활동 스트림(tool·step·thinking narration, 채팅 게이트웨이 느낌). 보드 입력은 `UserPrompt` 로 도착→로컬 대화에 `> board: …` 인용 후 처리; 구조적 선택은 로컬은 평문 선택지 / 보드는 `SelectionPrompt` chip(로컬 블로킹 UI 금지, §13.17). 기본값은 **합류 출처**(사람합류=off·에이전트스폰=on — 아무도 직접 안 띄운 에이전트는 보드가 유일 채널). 프로토콜(§13.26) + `/echo-mode` 스킬 + deps-0 `echo-emit.cjs` 3-phase 레퍼런스 훅(PreToolUse/PostToolUse 라이브 진행 + Stop 턴텍스트+thinking 요약, 레벨 게이팅) 출하. 라이브 end-to-end 도그푸딩(보드→로컬 구동 + 로컬→보드 미러). **(2) ack ✓ UX** — `UserPromptAccepted`/`Ack`/`AckProcessed` 를 별도 코드값 줄 대신 **원** 요청/메시지 줄에 ✓ 스탬프(promptId / msgId 상관) + 커서 4분면 hover 팝업(시각·agent, 클릭 고정); 라이브 로컬에코 줄이 promptId 를 실어 실시간 ack 도 제자리 표시(종전엔 History replay 만). verify-nway 15축 PASS.

이전: v2.5.110 (2026-06-15) — **Compendium v0.1.0 — 6번째 모듈 (design draft)** — EstreGenesis 의 어휘-substrate 모듈 착지: 개념-앵커 이중 register 용어집(한 개념 → register-중립 정의 1개 + register 태그된 term/gloss; 전문어↔일반어 매핑은 공유 `concept_id` 안에 암묵적, brittle 한 term-A↔term-B 링크 아님) + cross-module 위키 + 교차링크/클릭-정의. normative 한 건 아무것도 안 가짐 — 모든 항목이 소유 모듈 spec(SSoT)으로의 단방향 포인터, 유일 예외는 어느 모듈도 안 가진 general-register 어휘. 북극성 axis-2(어휘 생존 > 코드 생존)의 가장 순수한 표현이자 deprecated 어휘의 재배치 home(axis-3 eviction 일급) — 자기 자신의 eviction 도 모델링. 어드버서리얼 설계 리뷰로 우-사이징: v0.1 은 모델 + 콘텐츠 경계 헌장 + ~25 EG 시드 exemplar + 4 가드닝 lint + 포인터-해소 검사만, 승격은 count→Hyperbrief 브리프 큐잉 단일 게이트로 축소하고 hysteresis/debounce 자동화·a11y 컴포넌트·멀티탭 split·MCP 런타임·대시보드 표면은 v0.2+ 의 명명된 prunable 단위로 연기. 등록: `plugins/compendium/` manifest + marketplace(5→6) + verify-nway Compendium plugin-버전 axis + README/docs 모듈 수 5→6 (`docs/index.html` "Six graduated modules"). seed-registry 등재는 production 까지 보류(design-draft). 스펙: `Compendium.md`.

이전: v2.5.109 (2026-06-15) — **Greatpractice + Ultrasafe 스펙 영어 변환** — foundational 스펙(Constellation / Hyperbrief / Superscalar)은 영어인데 본문이 한국어로 드리프트해 있던 `Greatpractice.md`·`Ultrasafe.md` 를 영어로 통일했어요 — 공개 standard-proposing 표면의 일관성 패스. **의미 변화 0**: 1:1 라인 치환(Greatpractice 1056/1056, Ultrasafe 2507/2507 insert/delete; heading·코드블록·YAML 키·버전·§참조·표·인용 전부 verbatim 보존 — heading/fence/table 카운트 구조 검증이 원본과 동일). 유일하게 남긴 한국어는 Greatpractice §6.3/§12.3 의 voice-linter 정규식 매칭 대상(번역하면 lapse 탐지 패턴이 깨짐). 모듈 버전 무변경(Greatpractice v0.3.1, Ultrasafe v0.2.2) — 모듈 범프 아닌 EG-릴리스 doc cut.

이전: v2.5.108 (2026-06-14) — **docs meta-description 버전 드리프트 + verify-nway 12번째 axis** — docs 페이지의 모듈별 `<meta name="description">` 버전 표기가 어떤 verify axis 에도 안 잡힌 채 드리프트해 있었음: constellation v2.3.23→v2.4.36, hyperbrief v0.5.6→v0.7.0, greatpractice v0.1.0→v0.3.1, ultrasafe v0.2.1→v0.2.2; index.html 은 여전히 "three graduated modules"(→five) 광고. README KO heading "3 선택 모듈"(→5), install-block plugin 버전 stale(Constellation v0.2.3→v0.3.16, Hyperbrief v0.5.6→v0.7.0, Greatpractice v0.1.0→v0.3.1, Ultrasafe v0.2.2 추가) + "all four"/"넷"→"all five"/"다섯". 새 **docs-meta axis(12번째)** 가 각 페이지 meta 버전을 모듈 frontmatter canonical 버전 + index 모듈 수와 대조해 이 표면이 더는 미검출 드리프트를 못 냄. 모듈 버전 자체는 무변경(표기만 정정). verify-nway 12축 PASS, 0 드리프트.

이전: v2.5.107 (2026-06-13) — **Constellation v2.4.36 — 모바일 실시간 그룹 스와이프 (#3a B)** — 확정한 모바일 네비 재구성의 거동 절반(B) (A = v2.4.31 하단 탭바). ≤560px 에서 실시간 창의 내용 영역이 가로 **scroll-snap 페이저**가 됨 — 채널 그룹별 한 페이지(업스트림/메인/보드워커/로컬/협업, 각 그룹의 시간순 병합뷰). **스와이프**로 그룹단위 전환되고, 탭바의 **선택 + 가로 스크롤이 따라옴**(양방향 동기); 페이저 아래 점(dot) 띠가 현재 그룹을 표시. **탭**(그룹 헤더 또는 채널)을 누르면 페이저가 그 그룹 페이지로 자동 수평 스크롤. 데스크탑(>560px)은 무영향 — 단일 `#ws-stream`, 페이저 없음. 구현: `wsRenderActiveStream` 을 컨테이너 인자형 `wsRenderStreamInto` 로 리팩터, 그룹 계산을 `wsComputeGroups` 로 분리해 탭바와 페이저가 동일 그룹 집합/순서를 공유; 560px `matchMedia` 로 모드 전환; 스와이프 정착은 debounced `scroll` + 프로그램-스크롤 가드로 감지(탭 탭 스크롤 ≠ 사용자 스와이프 — 피드백 루프 없음); 라이브 행은 active 그룹 페이지만 재렌더(타 그룹 행은 unseen 뱃지만 증가). 중복 렌더 위험 없음 — 채널은 정확히 한 그룹 페이지에만 속함(페이지=그룹, 채널 아님). Playwright 390×844: 스와이프→그룹전환 + 탭바 동기 + 점 인디케이터, 탭→페이저 스크롤, 콘솔 에러 0; 보드 smoke 13/13(회귀 0). 모바일 한정, 실기기 테스트 필요. 레퍼런스 대시보드(index.html/app.js/style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

이전: v2.5.106 (2026-06-13) — **Constellation v2.4.35 — 모바일 실시간 창 fullscreen 갭 수정** — v2.4.31 모바일 하단탭바 재구성의 후속, Playwright 390px 실측으로 포착: 실시간 창 우측 ~16px·하단 띠에 페이지 배경이 비쳤음. 원인(추측 아닌 computed geometry 실측 — `width`/`100vw` override 가 계속 374px 로 resolve): 데스크탑용 `.ws-pop` 의 `max-width:96vw`+`max-height:92vh` 캡이 모바일 fullscreen pane 을 390×844 뷰포트 안에서 374×776 으로 잘랐던 것. 픽스: ≤560px 규칙에 `max-width:none`+`max-height:none`(+ `width:100vw`/`height:100dvh`) → pane 이 뷰포트를 끝까지 채움; 하단 탭바는 z-index 로 위에 overlay, pane body 는 하단 패딩 유지로 입력창이 탭바에 안 가림. 390×844 정확히 채움 검증(popRect right=390·bottom=844). 레퍼런스 대시보드(style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

그 이전 릴리스: 모든 항목이 [CHANGELOG.md](CHANGELOG.md) 에 보존돼 있어요 — 이 목록은 최근 몇 건만 유지해요.

**전체 변경 이력** (v1.0 부터 모든 릴리스, EN + KO): [CHANGELOG.md](CHANGELOG.md).

본 upstream repository 의 `CHANGELOG.md` 가 changelog SSoT. 각 시드 파일은 tier, 언어, 현재 버전, counterpart, 그리고 시드를 복사한 대상 프로젝트의 README가 아닌 본 `CHANGELOG.md` 포인터만 담은 짧은 헤더 메타데이터를 유지. 마이그레이션 B 로 프로젝트 업그레이드 시 에이전트는 시드 헤더의 버전 마커와 본 changelog 로 delta 를 계산.


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
{\r''`, and a `.gitignore` whose patterns all gained a trailing `\r` and stopped matching → secret staging), now prevented by `*.sh/*.cjs text eol=lf`. Behaviorally smoke-verified (AgentHello-only inbox re-arms without waking; always-mode ignores standby; no per-poll leak). The larger spec-gap proposals (G1–G8 role vocabulary / headless-loop spec section / ephemeral-peer presence / intent-tier column / board backup contract) are triaged separately. verify-nway 18-axis PASS.

Previously: v2.5.137 (2026-07-08) — **Plugin-load-error fixes (CC 2.1.x schema compliance) across 5 plugins + a verify-nway prevention axis** — a downstream adopter's `claude plugin validate` surfaced three ways the plugin manifests had drifted from the current Claude Code plugin schema, breaking load/skills for the plugins that use those surfaces. All fixed, and mechanized so it cannot recur. **(1) `hooks/hooks.json` wrapper (🔴 load-blocking)** — the events must sit under a top-level `"hooks"` key; constellation/hyperbrief/ultrasafe had them at the top level (`{"Stop":[…]}`), which fails validation and blocks the **entire plugin** from loading. Wrapped to `{"hooks":{…}}` and dropped the non-schema `_comment` field. **(2) `mcpServers` not `mcp` (🟡)** — Claude Code ignores a top-level `mcp` field in plugin.json; the current key is `mcpServers`. Renamed for all four MCP-bearing plugins (constellation/hyperbrief/ultrasafe/compendium) so the bundled servers actually load. **(3) SKILL.md frontmatter YAML (🟡)** — an unquoted `description:` containing `: ` (colon-space) fails strict-YAML parsing and the skill loads with **empty metadata** (no name/description → no trigger). Six skills across four plugins were affected (echo-mode, hyperbrief-revisit, ultrasafe-ai-llm-redteam, **compendium-curate, compendium-lint, routinize** — the last three missed by the adopter's report, which only validated the three hooks-bearing plugins); all six descriptions are now double-quoted. **(4) prevention** — a new **plugin-schema verify-nway axis (18th)** gates all three at cut time (hooks wrapper · SKILL frontmatter plain-scalar safety · `mcpServers` key), per the official code.claude.com/docs plugin reference — it flagged all 18 violations before the fix. Patch releases: constellation 0.3.22 · hyperbrief 0.7.1 · ultrasafe 0.2.3 · compendium 0.2.6 · greatpractice 0.3.4. The Codex adapter's MCP discovery was updated to read `mcpServers`. verify-nway 18-axis PASS.

Previously: v2.5.136 (2026-07-05) — **Greatpractice v0.3.3 — first model-invoked skill `routinize` (관행화) + `/before-compact` soft chain** — Greatpractice gains its first Agent Skill, the model-invoked front door to its capture→mature→codify pipeline (§1.2/§5.4). **`/routinize`** codifies a *recurring* work pattern into a durable practice, faithful to the module's **capture-eager / promote-deferred** discipline: it captures the pattern to `memory/feedback_*.md` immediately (cost-0, blameless voice), accumulates coordinates on recurrence, drafts a `_propose/` entry **only** when the §5.2 notability gate clears (≥3 substantive occurrences across ≥2 *distinct* coordinates + verifiable effect — a single session's repetition is usually one coordinate, so most invocations end at capture), and **never self-ratifies** an enforcing hook (promotion to a blocking entry is user-gated, §5.4 gate 3). Phronesis-heavy work (judgement-heavy / rare-context / high-context-dependent) is skipped by design (§1.4/§5.3). **Prime trigger = `/before-compact` time**: the session's accumulated context is the raw material and is about to be compacted away, so the `before-compact` skill gains a soft Step-0 that runs `/routinize` first (opt-in — skipped if Greatpractice is not adopted) — the two are complementary, routinize capturing *what recurs across sessions* while before-compact captures *what is in flight in this one*. The Codex adapter picks up the new skill automatically (22 skills projected). verify-nway 17-axis PASS.

Previously: v2.5.135 (2026-07-05) — **Codex adapter (Stage 1) + Compendium v0.2.5 (the MCP-declaration gap the adapter surfaced)** — EstreGenesis modules now run under **OpenAI Codex**, not just Claude Code. **(1) Codex adapter (`codex/`)** — Codex converged in 2026 on the same three customization surfaces EG already speaks (Agent Skills `SKILL.md` · MCP servers · `AGENTS.md`), so the six modules port with almost no transformation. Rather than duplicate the 21 canonical `SKILL.md` files (the drift surface the Migration-B dogfood warned against), the adapter is a **projection**: `gen-codex-adapter.cjs` materializes skills on demand into a Codex discovery path (`--install`, symlinks/copies) and regenerates only the Codex-specific derived surfaces — `config.toml.example` (the 4 MCP `[mcp_servers.*]` stanzas) and the README inventory. A hand-written `codex/AGENTS.md` carries the **hook-replacement discipline**: Codex has no lifecycle hooks, so each of the 6 Claude Code hooks maps to a manual paired-skill invocation — the discipline travels even though the automation does not (the north-star thesis made concrete). A new EG-ops **codex-adapter verify-nway axis** (`gen --check`, 17th axis) gates the committed surfaces against the live plugin set. **(2) Compendium v0.2.5** — building the adapter surfaced a real wiring gap: the Compendium MCP server (the §10 8-tool runtime, shipped v2.5.114) was **never declared in `plugins/compendium/.claude-plugin/plugin.json`**, so no host auto-registered it. Smoke-tested clean (initialize + tools/list → wiki_read/search/upsert/…), then declared — fixing Claude Code and letting the adapter project all four MCP servers. Full N-way version cascade (plugin.json + marketplace + mcp/package.json + Compendium.md frontmatter + docs badge/meta/module-tag). verify-nway 17-axis PASS.

Previously: v2.5.134 (2026-07-05) — **docs: promo-page staleness sweep — cumulative panel un-frozen, six-module corrections, Constellation v2.4.24–46 feature-wave coverage** — a full stale-content sweep of the public promo pages (agent-swept, EN+KO, all three audience registers) surfaced prose that had frozen while the machine-checked badges/meta moved on; all fixed. **(1) index.html** — "two optional graduated modules" → six (dev+expert, both languages); the "Cumulative since the 24h baseline" panel un-froze from "v2.5.36 / Hyperbrief is the new third module" to the current record (v2.5.133 range · 4 more modules → six · the Constellation §13.23–§13.26 wave · the M2 adopter-dogfood absorption), metrics updated (~21→~118 cuts, 1→4 new modules, 3→4 adopter bundles/reports, 2→6+ integrations); Ultrasafe staging corrected in 3 spots ("advisory v0.1.x → blocking v0.2.x" → "advisory v0.2.x, live + self-dogfooding → blocking v0.3+"); Greatpractice cards re-anchored from "v0.1.0 first cut + v0.2–0.4 roadmap" to the shipped v0.3.2 state; the Compendium general card now leads with the portable-discipline-over-any-vault framing; the Constellation cards gained the v2.4.24–46 highlights. **(2) constellation.html** — the flagship page's body introduced nothing newer than the dogfood era (§13.16.12 / the v2.5.15 relay): two new "What's inside" cards now cover the §13.23–§13.25 board-substrate wave (backends registry + board-worker projection, PWA + dependency-free Web Push, surface-scoped access control + CIDR + exposure toggle, wiki cross-link side panel, ack ✓ origin-line UX) and §13.26 echo-mode (tri-state local↔board remote-control mirror). **(3) hyperbrief.html** — "18 anti-patterns" → 26, matching its own badge. **(4) greatpractice.html** — "v0.1.0 specification" / "v0.2–v0.4 roadmap defines" → v0.3.2 current, v0.2/v0.3 marked shipped, v0.4+ open. Docs only, EN/KO. verify-nway 16-axis PASS.

Previously: v2.5.133 (2026-07-04) — **Migration-B dogfood follow-up — seed registry to six (Compendium) + backends.json re-sync preserve rule + runtime notes split + README KO current un-freeze (Constellation v2.4.46, seeds v2.5.1)** — a downstream adapter ran the full Migration-B (M2) upgrade (seed v2.4.3→v2.5.0 + release delta ~92 patches) and its dogfood report surfaced three ship-surface gaps; all fixed, plus one more found while cutting. **(1) Seed module registry → six.** The seed § EG module registry still listed five modules while the release track had shipped Compendium (v2.5.110) — an adapter reading only the seed misses the sixth module (the report's dual-marker cross-check caught it; the registry's hold-until-production exception is dropped now that a real adapter adopted Compendium from the release track). All 6 seed files (KO/EN × Master/Lite/Compact) gain the Compendium row + a "Six optional modules" intro; seed marker v2.5.0→**v2.5.1**; the EG-ops verify-nway seed-registry axis now checks 6 modules. **(2) backends.json re-sync preserve rule (§13.23.2).** The deployment config (boardTitle, roster) sits at the dashboard's default fetch path *inside* the reference `dashboard/` copy-set, so a wholesale vendor-copy re-sync clobbers adapter branding; the spec now states the preserve-list rule explicitly. **(3) reference/runtime dev-notes split.** The three `*-NOTES.md` dev notes move to `runtime/notes/`, making the runtime copy surface runtime-only. **(4) README KO versioning un-freeze.** Found while cutting: the README KO **현재** entry had been frozen at v2.5.110 for 22 cuts (only the EN Current was updated per cut); synced to v2.5.133, and a new **readme-current** verify-nway axis (EN Current ↔ KO 현재 ↔ data.js) makes that drift deterministic. verify-nway 16-axis PASS.

Previously: v2.5.132 (2026-07-04) — **Constellation v2.4.45 — echo-mode (remote-control mirror) + ack ✓ UX** — (1) **echo-mode (§13.26)** — a three-level per-agent mode (`off`/`on`/`mirror`) that mirrors an agent's local human↔agent chat onto the board's real-time conversation channel **bidirectionally**, so a human watching the board can also *drive* the agent through it (a remote-control substrate). `on` mirrors the turn-final text; `mirror` adds a live activity stream — tool calls, steps, thinking narration — for a chat-gateway feel. Board-typed prompts arrive as `UserPrompt` (quoted into the local chat, then acted on); structured choices render as plain-text options locally + a `SelectionPrompt` chip-card on the board (never a blocking local UI, per §13.17). Default follows **join provenance** (human-joined=off, agent-spawned=on — the board is the only channel to an agent nobody launched directly). Ships the protocol (§13.26), the `/echo-mode` skill, and the deps-0 `echo-emit.cjs` 3-phase reference hook (PreToolUse/PostToolUse live progress + Stop turn-text + thinking summary), all level-gated; dogfooded live end-to-end. (2) **ack ✓ UX** — `UserPromptAccepted`/`Ack`/`AckProcessed` now stamp a ✓ on the **origin** request/message line (correlate by promptId / msgId) with a custom cursor-quadrant hover popup (time·agent, click-to-pin) instead of a separate code-value row; live local-echo rows carry promptId so real-time acks annotate in place. verify-nway 15-axis PASS.

Previously: v2.5.131 (2026-06-24) — **docs: fix non-working Copy buttons across all six module pages + plain-language the Compendium Install/Example copy** — (1) Bug fix — the Copy buttons on hyperbrief / constellation / superscalar / greatpractice / ultrasafe / compendium did nothing because none of those pages loaded `shared/copy.js` (only index.html did); added the script to all six. Verified on compendium via Playwright: handlers attached 5/5, every button copies and shows "✓ Copied". (2) Plain-language (L1.1.1) pass on the Compendium Install + Example-prompts copy: the "add a term" example became a plain natural-language prompt (a one-line summary + a link to the defining doc, not "curate way — gloss + owner_spec pointer"), the lint example describes each check in plain words, and the install descriptions are un-jargoned. Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.130 (2026-06-24) — **Compendium promo docs — plain-language (L1.1.1) pass on the general copy** — rewrote the remaining jargon in the general-audience text of docs/compendium.html to L1.1.1 (plain audience, abbreviations expanded, no jargon): the MCP card ("needs nothing else installed" not "0 dependencies"), eviction ("custom-built parts retired first" not "bespoke runtime pruned"), adoption ("parts that share words / terms that refer to each other / live shared screen" not "modules / cross-referenced / dashboard / over-engineering"), the portable use-case ("stuck with one app" not "lock-in"), the dashboard card ("glossary page / plain-or-expert switch" not "wiki tab / toggle"), and the "Want to read more?" tour (each spec section in plain words, not a §1–§12 jargon list). Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.129 (2026-06-24) — **Compendium promo docs — add the missing "Want to read more?" footer section** — completes the v2.5.128 cut: docs/compendium.html gains the standard bottom "Want to read more? / 더 자세히 알고 싶다면" section (a plain tour of Compendium.md §1–§12 + the cross-tool skills path + the spec link) that every other module page carries. Docs only, EN/KO. verify-nway 15-axis PASS.

Previously: v2.5.128 (2026-06-24) — **Compendium promo docs — recent-updates coverage + the missing standard sections** — the public Compendium page gains a **"Portable over any vault"** section covering the v0.2.2–v0.2.4 surfaces (the Obsidian/vault projection, the two cross-tool curation skills, the dashboard wiki tab + click-to-define side panel) with the pointer-not-paraphrase wedge as the headline, plus the three standard sections every other module page has — **Install**, **Example prompts**, and **Use cases** (three scenarios: stopping glossary drift, click-to-define on the live dashboard, carrying the discipline across tools). The stale "deferred to v0.2-d" claims (page + index card) are un-deferred. Docs only, all three audience levels × EN/KO; Playwright-verified render (9 sections, audience-gating correct, 0 console errors). verify-nway 15-axis PASS.

Previously: v2.5.127 (2026-06-24) — **Compendium v0.2.4 — cross-tool curation Agent Skills (the portable discipline carrier)** — the Compendium discipline now ships as two plain-markdown **Agent Skills** any harness reads: **compendium-curate** (the pointer-not-paraphrase + dual-register + schema + first-class-eviction curation procedure — invoke it the moment you're about to write a glossary or a second copy of a definition that already lives in a spec) and **compendium-lint** (the six gardening checks — pointer-resolution / broken-link / no-competing-full-def / redaction / orphan / duplicate / stale — by runtime or by inspection). This is the option-(c) carrier the research identified: the storage + viewer are substitutable, so the discipline travels as portable skills over plain markdown+frontmatter rather than as a bespoke runtime. Roadmap move #3 (final of the reframe). Each skill points to Compendium.md for the full charter (pointer-not-paraphrase applied to the skill itself). verify-nway 15-axis PASS.

Previously: v2.5.126 (2026-06-24) — **Compendium v0.2.3 — spec reframe: portable discipline layer (pointer-not-paraphrase as the wedge)** — §1 re-positions Compendium from "a module with a bespoke wiki runtime" to **a portable controlled-vocabulary *discipline layer* over the markdown-vault substrate**: the storage + viewer are substitutable (Obsidian graph / provider memory / the dashboard wiki tab all read the same markdown+frontmatter; §11 emits the viewer-agnostic projection), and what Compendium owns is the *curation discipline*, not a runtime. A fifth misreading is foreclosed (§1.1(e) "a vault app / an Obsidian competitor" → Compendium is the opinion layer *on top of* whatever vault wins, supplying what generic vaults + provider-native memory deliberately do not: dual-register + pointer-not-paraphrase + governance lints + first-class eviction). §1.2 records the typed link model (peer `links` vs the one-directional `owner_spec` authority pointer) as uniquely owned — the charter made structural — and the bespoke wiki tab is named one optional viewer, eviction-first-class. Roadmap move #1 of the option-(c) reframe. Spec + docs only (no runtime change). verify-nway 15-axis PASS.

Previously: v2.5.125 (2026-06-23) — **Compendium v0.2.2 — Obsidian / vault projection (portable-discipline interop bridge)** — the Compendium content store now lights up natively in any markdown-vault viewer (Obsidian's graph + backlinks) while frontmatter stays the typed SSoT. `lint.cjs --reindex` emits an auto-managed block per entry: peer relations as in-vault `[[id]]` (graph edges) + the `owner_spec` authority as a relative link **out** of the store — **pointer-not-paraphrase made visual** (peer = graph edge; authority = external pointer). 39 peer links across 23 entries, all resolving to real files; idempotent; lint-clean. First move of a strategic reframe (a deep-research round found the winning substrate is the *generic markdown-vault pattern* — not any one app — and that provider-native memory ships format-agnostic, leaving the vocabulary-discipline layer the durable, un-absorbed value): Compendium positioned as a portable *opinion on top of whatever vault wins*, the bespoke wiki tab demoted to one optional viewer. §11 also marks the side-panel + click-to-define components shipped (v2.5.124). verify-nway 15-axis PASS.

Previously: v2.5.124 (2026-06-20) — **Constellation v2.4.44 — Compendium wiki cross-link side panel (click-to-define, §8/§11)** — clicking a cross-link in the dashboard's 위키/wiki tab now opens that term's gloss in a **non-modal side panel** (a complementary landmark) — you peek the definition without losing your reading position, the panel's own cross-links **chain** to further terms, and a "전체 항목으로 →" link jumps to the full entry. a11y per §8.2: because a gloss can contain cross-links the trigger carries **dialog/disclosure** semantics (`aria-haspopup="dialog"`, never `role="tooltip"`), focus moves into the panel on open, **Escape** closes it and restores focus to the trigger; the §8.1 post-escape-DOM invariant (no raw-HTML injection) holds. Mobile (≤560px) renders as a **bottom-sheet** seated above the tab bar. Client-only (no server change → no restart; `sync-dashboard` deploys). Playwright-verified on the live board: render (26 entries / 39 cross-links + ARIA), click→panel→focus→chain→Escape→focus-restore, mobile bottom-sheet clears the tab bar, **0 console errors**. verify-nway 15-axis PASS.

Previously: v2.5.123 (2026-06-20) — **Constellation v2.4.43 — tier-2 Web Push (#3b, fires while the board is closed)** — the dashboard's notifications gain a second tier that reaches you **even when the PWA/tab is fully closed**, complementing in-tab tier-1 (v2.4.28). Implemented **dependency-free** (node built-in `crypto`/`https` — no `web-push` library): a self-generated P-256 VAPID keypair (`.vapid.json`, gitignored), ES256 JWT signing via `crypto.sign(…, {dsaEncoding:'ieee-p1363'})` (raw 64-byte `r||s`), and **tickle** delivery — a payload-less VAPID push (RFC 8291 payload encryption avoided, which is what drops the dependency) where the service worker fetches `GET /api/push/latest` for the body on the `push` event. Four endpoints (`/api/push/{vapid-public-key,subscribe,unsubscribe,latest}`, UI surface → §13.25 `ui`-allowlist-gated), a `wsToBoards`-passing meaningful-A2A trigger (noise-blocklisted), auto-pruned expired subscriptions (404/410), and a 🔔-panel **백그라운드 알림** toggle (`PushManager.subscribe`). Per-origin — the board self-sufficiently pushes its own activity. Distilled into the Constellation reference (`reference/runtime/push.cjs` + `server.cjs` + dashboard) → §13.24.4. Verified: push.cjs unit suite (VAPID 65B key + ES256 raw-64 sign/verify + dead-sub prune + noise filter) + server HTTP smoke (4 endpoints) + isolated-port boot. verify-nway 15-axis PASS.

Previously: v2.5.122 (2026-06-19) — **Compendium v0.2 seed vocabulary — 19 cross-module glossary entries** — the content store grows 7 → **26 entries**, materializing the spec's ~25-item EG Seed Vocabulary Catalog (Appendix A.1): 19 internal-register pointer-only glossary terms across Constellation / Superscalar / Hyperbrief / Greatpractice, each a one-line orientation gloss + expert/plain dual-register glosses + a pointer to the owning spec (the full definition stays in the owner, per the pointer-not-paraphrase charter). Every `owner_spec` was reconciled against the **real** owner-spec heading slugs (via the lint's own `headingSlugs` — the catalog's example slugs were single-hyphen, the actual GitHub-style slugs double-hyphen around dropped ` — `/` / `), so the §9.2 pointer-resolution axis resolves all 26 with **0 hard failures**; catalog #3 (routing-by-direction) deferred (no dedicated owner-spec heading). `lint.cjs --reindex` regenerated `INDEX.md` + `index.json`; the wiki-tab `compendium.json` export updated to 26. Compendium module unchanged (v0.2.1 — content seeding). verify-nway 15-axis PASS.

Previously: v2.5.121 (2026-06-19) — **Constellation v2.4.42 — dashboard-operable exposure + self-restart (#5a-4)** — exposing the board to the LAN is now a dashboard action, not a manual env+restart. A persisted **`expose`** field (the `WS_BIND` on/off) is flipped from the settings modal and applied via a **loopback-only `POST /api/restart`** that self-restarts the server (a deployment `restart-self-board.ps1`, spawned via `cmd /c start` so it survives the server's own exit, re-launches it). The access editor gains a **네트워크 노출 끄기/켜기** master toggle (dims the IP policy when off) + a **저장 및 재시작** button, and the settings modal separates the **real-time** 창 배치 block from the **save-gated** 접속 제어 block as distinct cards. Server + dashboard, purely additive (`expose:false` default = prior loopback behavior). Verified: WS_BIND derivation + restart spawn/self-exit (cmd/start survives parent exit) + Playwright (block separation, expose toggle dim, save persists `expose`). verify-nway 15-axis PASS.

Previously: v2.5.120 (2026-06-19) — **Constellation v2.4.41 — per-surface access toggles + CIDR (#5a-3)** — the access model becomes symmetric across all three surfaces and friendlier to edit. **agent** joins UI and MCP with its own IP allowlist (restrict which IPs may connect as agents, *and* still require a key — defence-in-depth), and allowlist entries now accept **IPv4 CIDR** ranges (`192.168.0.0/24`) alongside exact IPs. The `/ws` gating moves to HELLO (where agent vs MCP is known), with an upgrade-time pre-check that `destroy`s fully-blocked IPs before any board state is sent, and `requireKey` is enforced at HELLO (URL *or* HELLO key — fixing a v2.4.39 gap). The dashboard editor becomes three **기본 차단/허용** toggles (UI/agent/MCP) + a key checkbox + an exposed-without-key warning; settings modal retitled "⚙ 설정". Server + dashboard, purely additive; Playwright-verified (3-toggle render, 차단→textarea, per-surface save) + CIDR/exact match 12/12. verify-nway 15-axis PASS.

Previously: v2.5.119 (2026-06-19) — **Constellation v2.4.40 — access-control dashboard editor (#5a-2)** — the settings modal (⚙) gains a **접속 제어** section that edits the §13.25 access policy from the board UI: per-surface IP allowlist textareas (UI / MCP — one IP per line, empty = allow-all), an `agent.requireKey` toggle, and an exposed/bind status line. It loads via `GET /api/access` on open and saves via `POST /api/access` (loopback-only — a remote/UI-allowed caller gets a clear 403). Completes #5a — the v2.5.118 server-side gate is now manageable from the dashboard, not just by hand-editing `access.json`. Dashboard-only (`app.js` + `style.css`); no server/protocol change. Playwright-verified on an isolated server: section renders (0 new console errors), GET populates, POST persists to disk. verify-nway 15-axis PASS.

Previously: v2.5.118 (2026-06-19) — **Constellation v2.4.39 — surface-scoped access control (#5a-1)** — when `WS_BIND` exposes the board beyond loopback the three surfaces gate **independently**: **UI** (dashboard + board endpoints) by an IP allowlist, **agent** (keyed `/ws`) allow-all-by-IP with an optional `agent.requireKey` that closes the v2.4.11 unauthenticated-board vector (LAN-wide key-issue / `SetMain`), and **MCP** (the `mcp-proxy` WS client) by its own allowlist independent of UI. A gitignored `access.json` beside `server.cjs` (`fs.watchFile` hot-reload) drives it — **fail-open by default**: no file = prior behavior, `null` allowlist = allow-all, loopback always allowed, the gate wholly inert on a loopback bind. `GET /api/access` (UI-gated) + `POST` (loopback-only). Server-side only (`server.cjs` + §13.25 + `.gitignore`); the dashboard per-surface allowlist editor is staged as #5a-2. verify-nway 15-axis PASS.
Earlier releases: every entry is preserved in [CHANGELOG.md](CHANGELOG.md) — this list keeps only the most recent few.

**Full changelog** (all releases from v1.0 onward, EN + KO): [CHANGELOG.md](CHANGELOG.md).

This upstream repository's `CHANGELOG.md` is the changelog SSoT. Each seed file keeps only a compact header metadata line with tier, language, current version, counterpart, and a pointer back to that `CHANGELOG.md`, not the target project's README. When you upgrade a project using Migration B, the agent uses the seed header version marker plus the changelog to compute the delta.


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

**Claude Code 에서는 명령 하나.** 킷 플러그인을 설치하면 알맞은 시드를 알아서 가져옵니다:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins

/egboot     # 신규 프로젝트      (긴 이름: /eg-bootstrap)
/egmig      # 기존 프로젝트      (긴 이름: /eg-migration)
/egup       # 이미 시드 적용됨 — 시드 + 플러그인 업그레이드 (긴 이름: /eg-upgrade)
/egmem      # 에이전트 메모리 ↔ 프로젝트 문서 정합 (긴 이름: /eg-memsync)
/egrich     # 풀 무장: 시드 + 6개 모듈 전부, 배선·검증까지
```

스킬이 티어를 고르고, 시드를 가져와 `.agent/seed_prompt.md` 로 설치하고, 그대로 실행합니다 — raw URL 찾을 일도, 복사·붙여넣기도 없습니다. 잘못 골라도 맞는 스킬로 안내합니다.

**다른 에이전트에서는 수동 경로 (여전히 60초).**

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

## bootstrap 너머 — 6 선택 모듈

v1.x 는 프로젝트 시드 — 신규 AI-Native 프로젝트 부트스트랩, 또는 기존 프로젝트를 `AGENTS.md` SSoT 로 마이그레이션 (위의 모든 내용). **v2.0+ 는 그 위에 6개의 선택 모듈 추가**:

- **[Constellation](Constellation.md)** (v2.0+) — 실시간 멀티에이전트 오케스트레이션. 파일 기반 `.agent/_coordination/` 코디네이션을 실시간 라이브보드 (WebSocket + A2A 메시징 + 대시보드) 로 격상. **A2A 브릿지 인터페이스**가 불변 계약. [constellation/reference/](constellation/reference/) 의 참조 런타임은 Node deps-0 (`ws` 제외). 컴포넌트는 `.eux` 로 작성하여 **[EstreUX](https://github.com/SoliEstre/EstreUX)** (별도 Apache-2.0 런타임, EG 가 *참조* — clone-and-run, 번들·소유 안 함) 로 brew.

- **[Superscalar](Superscalar.md)** (v2.3+) — 병렬 서브에이전트 dispatch 의 실행 스케줄링 규율. 5차원 `issue_width` 공식 (effort_band + pace_mode + Little's Law + Kanban WIP + autonomy_available_workers) + 30-60k 토큰 horizon 교차점에서의 cost-benefit gated dispatch + worktree-isolated reorder buffer + in-order retire + consistency gate + opt-in speculation. Production-ready (Stage 1 ship). n=8 dogfood ledger + Entry 06 controlled A/B 가 "병렬화만으로는 불충분; 오케스트레이션 규율이 일관성을 만든다" 입증.

- **[Hyperbrief](Hyperbrief.md)** (v2.3.20+) — 결정 위임 게이팅 규율. 모든 user-facing 결정 질문이 트리거 rubric 통과, 에스컬레이션 시 LLM 이 schema 강제 JSON IR emit, 결정론적 Node renderer 가 9-section Markdown 브리핑 + interactive HTML 카드 산출. 4축 × 5단계 톤 프로파일 + skill-side auto-localize (버튼 라벨 + MD trigger phrase 가 사용자의 prevailing 대화 언어 따라감). Cross-module 통합 active: Constellation §13.16.9 (5 A2A intent name + ack_tier='decided') + Superscalar §3.1 (write/deploy/send lane retire 시 orthogonal gate). §11.5 v1.0 readiness rubric (Lens A 7-차원 모듈 전체 GA / Lens B 6-차원 host-specific 마켓플레이스 등록) ship 완료.

- **[Greatpractice](Greatpractice.md)** (v2.5.50+, v2.5.55 release-cadence 정식 등록) — 메모리 기반 관행 codification 규율. AI 와 함께 작업하면서 자연스럽게 형성되지만 점점 누락되는 자잘한 약속들 — 「코드 수정 시 docs 도」, 「보내기 전 확인」, 「X 가 바뀌면 Y 도」 — 의 *조용한 누락* failure surface 를 target. 보통 메모리 메모로 시작했다가 메모가 누적될수록 점점 안 읽히고 누락이 늘어나는 패턴이에요. Greatpractice 는 agent-workspace 메모리 feedback (`memory/feedback_*.md` 또는 동등 surface) 을 입력 트리거로 받고, raw 신호를 5-axis multi-criteria maturation gate (frequency + depth + recency + cost + predictability weighted sum threshold ≥ 18 OR 3-criterion notability) 를 통해 3-tier macro/mezzo/micro 계층으로 route. ratified entry 는 deterministic lifecycle hook (SessionStart blocking / UserPromptSubmit path-scoped inject / PreToolUse 3-subtype poka-yoke contact/fixed-value/motion-step / PostToolUse SSoT propagation / Stop cycle-end probe / PostCompact working-set 복구) 으로 강제. 명시적 `phronesis_boundary` field 가 judgement-heavy work 의 codify-금지 영역 명시. 9축 cross-domain 딥리서치 (harness · humanities · psychology · management · processor · os · sre · memoization · canonical) 가 backing. v2.5.55 dual cut 이 [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) entry 를 `_propose/draft` 에서 ratified 로 promote (user steering trigger at N=1 evidence; mezzo decomposition 8-candidate batch v2.5.56+ 예정).

- **[Ultrasafe](Ultrasafe.md)** (v2.5.55+) — 출시 직전 / 갱신 직전 모의 침투 시험 규율. *출시 후 발견* failure surface 를 target: 보안 문제가 외부 사용자에 의해 발견되는 시점이 출시 후이지, 내부 검증으로 출시 전이 아닌 패턴. Ultrasafe 는 매 release 를 Superscalar-applied Workflow 로 ship, 8 병렬 공격 에이전트 (v0.1.0 최소 fan-out — AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer + GTA/DSP cross-cutting) 가 독립 관점에서 모의 공격, Finding Output Contract (§4) 로 발견 emit, Synthesizer 에서 BFT 2f+1 quorum + cross-axis correlation 으로 합성, 3-layer 보고서 (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate) 산출. ≥3 iteration loop 가 4-condition AND clean signal 까지 실행: regression-free + monotonic improvement + coverage gate + 2 iter consecutive + agent diversity invariant. Dual pre-release trigger (PreToolUse hook on `git push --tags` / `npm publish` / `gh release` / 등 7 matcher + `/ultrasafe` skill). 5 신규 Constellation A2A intent. **Advisory-only v0.1.x → blocking v0.2.x** 단계 전환 (Tier 3 release strict / Tier 1/2 opt-in). 17축 cross-domain 딥리서치 backing. v0.1.0 첫 cut ship = 전체 사양 (2544 줄, §1-§13 + 부록 A-C) + plugin manifest; runtime (공격 에이전트 dispatch / iteration loop runner / 3-layer 보고서 generator / 5 A2A intent handler / PreToolUse hook / MCP server) v0.2+ deferred.

- **[Compendium](Compendium.md)** (v0.2.6) — **이미 쓰는 markdown vault 위에 얹는 이식 가능한 규율 레이어**: 한 개념에 정의 하나, 두 register(쉬운말 + 전문어)로 제공하되, 정의를 베끼지 않고 그 개념을 *소유한 스펙을 가리킴*. 마지막 성질이 wedge — 재진술하지 않으므로 원본으로부터 drift 할 수 없음. north-star 의 두 번째 축(코드 생존보다 개념/어휘 생존 — 어느 단일 런타임 구현보다 오래 남을 레이어)을 reify. 출시분: 콘텐츠 스토어, 가드닝 lint(포인터 깨짐 / 고아 / 개념 중복 / 낡음), 8-tool MCP 서버, 어떤 에이전트든 읽어서 쓰는 cross-tool 스킬 2종(`compendium-curate` / `compendium-lint`), 그리고 스토어를 옵시디언류 앱에서 링크 그래프 그대로 열 수 있게 하는 vault 투영.

여섯 모듈 모두 **선택적** + **참조** (시드 티어 본문에 번들되지 않으므로 시드는 lean 유지). 파일 기반 코디네이션 (Phase 5) 이 기본이며 대부분 프로젝트에 충분.

### Claude Code 플러그인으로 설치 (repo 자체 마켓플레이스)

여섯 모듈은 본 repo 의 **repo 자체 마켓플레이스** 를 통해 Claude Code 플러그인으로도 ship. Claude Code 세션에서:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins
/plugin install constellation@estregenesis-plugins
/plugin install superscalar@estregenesis-plugins
/plugin install hyperbrief@estregenesis-plugins
/plugin install greatpractice@estregenesis-plugins
/plugin install ultrasafe@estregenesis-plugins
/plugin install compendium@estregenesis-plugins
```

플러그인 7종: **estregenesis** 킷(시드 자체를 `/egboot` · `/egmig` · `/egup` · `/egmem` · `/egrich` 로) + 6개 모듈. 각각 독립이라 하나만, 몇 개만, 또는 전부 설치 가능. 마켓플레이스 메타데이터는 [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json), 각 플러그인 소스는 [plugins/](plugins/) 아래. Apache-2.0. 현재: estregenesis v0.2.1 (절차 5종 + 포인터 별칭 4종, 의존성 0); Constellation v0.3.26 (+ 5-tool MCP 서버, 스킬 8종 — `/boardsweep` 포함, Stop 훅); Superscalar v0.1.2 (+ §3.1 Hyperbrief interlock); Hyperbrief v0.7.1 (+ 스킬 3종, 4-tool MCP 서버, PreToolUse/Stop 훅); Greatpractice v0.3.4 (+ `/routinize`, JSON 스키마 3종, contact 훅 1종); Ultrasafe v0.2.4 (+ 8-agent red-team fan-out, clean-signal 게이트 — advisory, 출시를 막지 않음); Compendium v0.2.6 (+ 8-tool MCP 서버, 가드닝 lint, cross-tool 스킬 2종). Anthropic-side community-marketplace 등록은 [Hyperbrief.md §11.5](Hyperbrief.md) readiness rubric Lens B 에 따라 v1.0 GA 까지 defer.

## 3-tier — 프로젝트당 하나 선택

| Tier | 크기 | 주 용도 | 대상 독자 |
|---|---|---|---|
| **Master** | ~2425줄 | 깊이 있는 가이드 필요한 신규 프로젝트, 패턴 처음 배우는 팀, 모든 인라인 템플릿 필요한 엣지 케이스 | 첫 AI Native 저자; 프로세스 공식화하는 팀 |
| **Lite** | ~1105줄 | 빠른 신규 프로젝트, 마이그레이션 세션, 기존 프로젝트에 새 AI 서비스 편입, 마스터가 컨텍스트 윈도우에 무거울 때 | 패턴 기억하는 복귀 저자; 대부분 프로젝트 |
| **Compact** | ~130줄 | 이미 패턴 알고 최소 시드 원하는 저자; 가장 타이트한 컨텍스트 윈도우; bullet 트리거만 | 체크리스트만 필요한 파워 유저 |

프로젝트에는 **tier 하나만** 배치. 세 개 다 넣지 않음. 존재하지 않는 tier 를 교차 참조하면 dead link 와 에이전트 혼란만 발생하므로, 각 tier 는 **self-contained** — 내부 완결, 다른 tier 로의 forward/backward 참조 없음.

프로젝트가 더 많은 깊이를 요구하게 되면 tier 를 in-place 업그레이드하지 않습니다. 파일을 다음 tier 로 교체하고 커밋. 에이전트가 일반 문서 업데이트로 처리합니다.

## 파일 목록

```
AI_Native_Project_Master_Seed_Prompt.md       ← 영문 마스터 (가장 깊음, ~2425줄)
AI_Native_Project_Seed_Prompt_Lite.md         ← 영문 lite (~1105줄)
AI_Native_Project_Seed_Prompt_Compact.md      ← 영문 compact (~130줄)
AI_Native_프로젝트_마스터_시드_프롬프트.md       ← 한국어 마스터
AI_Native_프로젝트_시드_프롬프트_Lite.md          ← 한국어 lite
AI_Native_프로젝트_시드_프롬프트_Compact.md       ← 한국어 compact
Constellation.md                               ← v2.0+ 모듈: 라이브 멀티에이전트 오케스트레이션 가이드 (WS + A2A)
constellation/                                 ← v2.0+ 모듈: .eux 사양 + 참조 런타임 (server / bridge / watcher / watchdog / dashboard)
Superscalar.md                                 ← v2.3+ 모듈: 병렬 서브에이전트 실행 스케줄링 규율
Hyperbrief.md                                  ← v2.3.20+ 모듈: 결정 위임 게이팅 규율 (JSON IR + 결정론적 renderer)
plugins/                                       ← Claude Code 플러그인 (constellation / superscalar / hyperbrief) — repo 자체 마켓플레이스용
.claude-plugin/marketplace.json                ← repo 자체 Claude 플러그인 마켓플레이스 메타데이터 (estregenesis-plugins)
README.md                                      ← 본 파일 (라이브러리 색인; 프로젝트에 배포하지 않음)
LICENSE.md                                     ← Apache License 2.0 전문
logo/EstreGenesis.png                          ← README 로고
```

각 tier 의 언어 페어(영문+한글)는 완전 정렬 — 동일한 phase, 동일한 마이그레이션 로직, 동일한 운영 가이드. 이중언어 팀이면 페어로 배치. **v2.0+** 는 6개의 선택 참조 모듈 (Constellation + Superscalar + Hyperbrief + Greatpractice + Ultrasafe + Compendium) 을 추가하며, 각각 repo 자체 마켓플레이스를 통해 Claude Code 플러그인으로도 ship — changelog 참조.

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
| OpenAI Codex CLI | 전용 어댑터 동봉 (`codex/`): `node codex/gen-codex-adapter.cjs --install` 이 모든 plugin 스킬을 Codex discovery 경로로 project, `config.toml.example` 이 MCP 서버 4종 등록, `codex/AGENTS.md` 가 각 lifecycle hook 을 문서화된 수동 루틴으로 매핑 |
| Jules / Kiro / Kimi Code / 기타 | `AGENTS.md` 직접 참조 (Kimi Code 는 `AGENTS.md` 가 1급 지시 파일 — 자체 `/init` 이 이를 생성) |

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

각 tier 는 자체 버전 보유. 마스터가 권위 있는 진화 트랙; Lite·Compact 는 정기적으로 마스터에서 파생되나 한 릴리스 지연될 수 있음.

**현재**: v2.5.175 (2026-07-19) — **온보딩 흐름 (Constellation v2.4.70, TC2)** — §13.32: 직접 서버 vs 피어 합류(소유권 rubric) + 포트 자동 우회 계약 + loopback-first 보안 순서예요. verify-nway 20축 PASS.

이전: v2.5.169 (2026-07-19) — **인디케이터 토글 미세 배치 (Constellation v2.4.65)** — 입력줄 토글을 첨부↔pause 사이로, 🧵 프리픽스 + 고정 폭 112px, 브라우저 실측. verify-nway 20축 PASS.

이전: v2.5.168 (2026-07-19) — **활동 모니터 UX + 소음 정련 (Constellation v2.4.64)** — 토글 fab 을 실시간 fab 레이어로(창 위로 안 뜸), 입력줄 왼쪽에 고정 폭 `Wn/n Sn` 인디케이터 토글(실측 `W2/2 S1`), 15초급 스냅샷 이벤트를 Web Push·워커 pending 분류기에서 제외 — 실측된 워커 턴 캐스케이드 종식. verify-nway 20축 PASS.

이전: v2.5.167 (2026-07-19) — **인스펙터가 에이전트 활동 모니터로 (Constellation v2.4.63)** — SubagentStatus 섹션(단독 서브에이전트, 6분 flush 공백 실측으로 10분 활동창), 고정 🧵 fab 토글 + 오버뷰 모드, 실토큰 테마 정합(구 스타일은 미존재 변수의 다크 폴백에 고정돼 라이트에서도 다크). 실행 중인 실제 위임의 라이브 데이터 + 테마 전환 실측 포함 E2E. verify-nway 20축 PASS.

이전: v2.5.166 (2026-07-19) — **인스펙터 XSS 핫픽스 (Constellation v2.4.62)** — 푸시-후 자동 보안 리뷰가 당일 검출: 신설 플로팅 인스펙터가 와이어-유래 WorkflowStatus 값을 innerHTML 헬퍼로 렌더(§8.1 위반, 접속 에이전트 주입 가능) → 전부 textContent 주입 + state 클래스 화이트리스트로 교정, 실브라우저 회귀(전 필드 악성 페이로드 → 이스케이프 텍스트·실행 0) 통과, 컷 전 라이브 배포. verify-nway 20축 PASS.

이전: v2.5.165 (2026-07-19) — **워크플로 런이 보드에 보임 — 미러 + 플로팅 인스펙터 (Constellation v2.4.61)** — 배포 워처가 멀티에이전트 워크플로 런을 에이전트 채널에 미러하고(코얼레스 🧵 STEP + 스로틀 WorkflowStatus 스냅샷), 🧵 행 클릭 시 플로팅 인스펙터(드래그·폭조절·세로자동·접기·닫기)가 단계·에이전트별 진행·토큰·소요를 실시간 렌더해요; 히스토리 재생으로 끝난 런도 계속 열람. 실측 기반 설계: 런 상태 파일=종결 단발 기록 → 라이브는 journal. 실런 라이브 E2E + 콘솔 에러 0. verify-nway 20축 PASS.

이전: v2.5.164 (2026-07-19) — **실시간 기록 발송시각이 더는 "현재 시간"으로 안 튐 (Constellation v2.4.60)** — 68행이 실제 발송시각을 ISO 문자열로 갖고 있었는데 숫자-전제 소비자(대시보드 epoch 파서·부팅 정렬 `timestamp||0`)가 새로고침마다 현재시간으로 격하시키던 버그 — `wsNormTs` 가 저장·적재 경계에서 강제(문자열→epoch·누락→수신시각)하고 대시보드도 문자열을 수용해요. 유추 아닌 실시각 복원, 재시작 1회로 68→0 실측. verify-nway 20축 PASS.

이전: v2.5.163 (2026-07-19) — **끊긴 채널도 그룹 유지 + sweep cadence (Constellation v2.4.59, 플러그인 v0.3.30)** — 서버가 채널별 HELLO 시점 role 을 영속해 cold/archived 스텁에 동봉 — 업스트림/협업/피어 에이전트가 끊겨도 더는 로컬 그룹으로 추락하지 않아요(키-형태 폴백은 구 서버 호환용). §13.31.4-⑥ sweep cadence 도 신설: 회고 점검은 작업-단위로 — 세션 재개(quick) · ~5컷/7일(full) · 상주 보드 idle 시그니처(침묵+작업 지속; §13.27.4 상시 idle duty) · 히스토리 조작 직후 — /boardsweep 에 대응 "When to sweep" 절. verify-nway 20축 PASS.

이전: v2.5.162 (2026-07-19) — **echo-mode 기본값 배선 — provenance 시딩 + 상태 공지 + 에코 배지 (Constellation v2.4.58)** — §13.26.3 의 합류-출처 기본값이 prose 로만 있던 것을 코드로: 에이전트-스폰 합류 경로가 미등재 에이전트를 `{level:'on', provenance:'agent-spawned'}` 로 시딩하고(명시 토글은 절대 안 덮음), (재)접속마다 `EchoModeState` 를 멱등 공지하고(무타깃 — commitment-ack 비대상), 대시보드가 탭마다 에코 배지(on/mirror)를 달아요. constellation 소개 페이지에 9스킬 로스터 줄 추가. verify-nway 20축 PASS (tag-continuity 축 신설 — 유실됐던 v2.5.64/65 태그를 복원한 보드 정합 점검의 산물).

이전: v2.5.161 (2026-07-18) — **/subscaler 출시 — 티어 모델 조합이 Superscalar 토글로 (Superscalar v0.6.0, 플러그인 v0.2.0)** — frontier 메인이 실행-형 작업을 최상위 실행-티어 서브에이전트에 위임해요(Fable→Opus / Sol→Terra, effort high); §5.1 이 위임 rubric(명세-완결 작업은 위임·판단은 보유·레인마다 수락 기준+테스트 게이트)과 하네스별 적용 표면(조용한-폴백 경고 포함), 단일 마커 토글 상태를 실어요. 기본 OFF, fan-out 에서 ON — 공유 캐시를 이미 포기한 지점이니까요. 91출처 검증 리서치 기반. verify-nway 19축 PASS.

이전: v2.5.160 (2026-07-18) — **지원 표에 Kimi Code 실명화 (doc-only)** — 실측: Kimi Code CLI 는 프로젝트 루트 `AGENTS.md` 를 1급 지시 파일로 취급해요(자체 `/init` 이 이를 생성) — EG 코어 층은 폴백 행으로 이미 커버였고, 이제 그 노트와 함께 실명 등재(EN + KO ×3). 스킬+MCP+훅 스택이라 어댑터 계약 Stage 1 후보로는 Codex 보다 강함 — 큐 기록만, 출시 아님. 시드 무변경. verify-nway 19축 PASS.

이전: v2.5.159 (2026-07-18) — **room 고정 문서 + 보드 state 스키마 캐노니컬화 (Constellation v2.4.57, 플러그인 v0.3.29)** — 방마다 고정 문서 3종(개요 · append-only 결정 장부 · `covers_until` 실린 진행 요약)이 서버에 실리고, 조회/갱신 계약(`RequestRoomArtifacts` / `RoomArtifactsUpdate`, ack-by-reference 버전 아래 delta 브로드캐스트)·대시보드 📌 접이식 블록·서기 digest 의무가 함께 나왔어요; §13.31(신설)이 보드 데이터 계약 — `current[].stages {label, status: pending|active|done}` + 사용 규율 + 차터/스윕/스킬 훅 — 을 캐노니컬로 승격 — 렌더러 코드에만 있던 계약이 조용히 깨지는 게 실측됐기 때문. 스모크 22/22, verify-nway 19축 PASS.

이전: v2.5.158 (2026-07-18) — **boardsweep 이 소비자 축을 배움 (constellation 플러그인 v0.3.28)** — 어댑터 실측 결함 클래스: `{name,state}` 로 쓰인 stage 목록이 `{label,status}` 렌더러 아래 전부 PENDING 으로 스윕 2회를 살아남았어요 — 스윕이 저장소 사실만 대조하고 소비자가 읽는 계약은 대조하지 않았기 때문. schema normalization 이 이제 필드 키·값 도메인을 소비자 계약과 대조해요 — 렌더 폴백이 정확히 이 클래스를 조용히 삼켜요. verify-nway 19축 PASS.

이전: v2.5.157 (2026-07-18) — **3번째 어댑터의 실명화: Estrelle 역링크** — 공개 비전이 EG 를 에이전트 하네스로 명시한 자가호스팅 개인 AI OS, [Estrelle](https://github.com/SoliEstre/Estrelle) 이 라이브됐어요; Harness Adapter Contract 의 계획된-3번째-어댑터 자리에 실명과 상호 진입점 링크를 반영. contract-first 의 이행이에요. verify-nway 19축 PASS.

이전: v2.5.156 (2026-07-18) — **계약 짝: Harness Adapter Contract v0.1 + loop contract (§13.27.4)** — 개인 AI 환경 하네스 트랙의 스펙-선행 절반이에요: `plugins/HARNESS-ADAPTER-CONTRACT.md` 가 Codex 어댑터 관행을 문서 계약으로 승격(source-of-truth 전제 · 투영 표면 표 · 선언하되-침묵-금지 degradation · 생성기/검증 의무 · conformance Stage 1-3)하고, §13.27.4 가 headless 루프를 구현-독립 5요소(wake 소스 · at-least-once 커서 · 버전 차터 · 능력 하한 딸린 tier 라우팅 · supervisor 안전 경계)로 재진술해요. 의도적 분할: *언제 도는가*(loop) vs *무엇을 싣는가*(adapter) — 둘 다 구현한 호스트는 로컬 모델 포함 자체 루프에서 EG 규율을 무인 구동해요. verify-nway 19축 PASS.

이전: v2.5.155 (2026-07-17) — **Constellation v2.4.55 — roundtable 대시보드 진입점 (R3) + 피어 리뷰 반영** — 방이 보드에서 운용 가능해져요: 프롬프트 타깃 셀렉터의 **"➕ 라운드테이블…"** 이 생성 다이얼로그(주제 · 참여자 다중 선택 · persistent/temporary · 고급 가드 예산)를 열고, 방은 시안색 **라운드테이블 탭 그룹**의 `room:<id>` 채널로(서버 이벤트+인간+에이전트 트래픽 단일 인테이크), 방 탭은 `roomId` 로 발신하며 서버가 `human-operator` 를 스탬프해요. Playwright+가짜 에이전트 e2e **11/11 PASS**. 피어 리뷰 전건 반영 — 대표는 `maxAutoHop` 4→**6**(D4 준수 에이전트가 floor 에 먼저 걸리는 역전을 리뷰가 발견), notice non-wake 가이드·`RequestRoomArtifacts` 계약·파킹 재개 명문화·참여자별 latency 선언·echo-mode 제외 포함. verify-nway 19축 PASS.

이전: v2.5.154 (2026-07-17) — **Constellation v2.4.54 — roundtable 레퍼런스 서버 코어 (R2)** — §13.30 의 결정론 floor 가 `server.cjs` 에 실물로: 방 lifecycle + `rooms.json` 영속 + per-room 히스토리 채널, 기존 1:1 relay 위 참여자 fan-out(ack/재전달 기계 계승) + 단일 요약 delivered-ack, 시끄러운 가드 4종(rate · 연속 · `autoHop` 파킹+RoomStall · stall 신호), 인간 soft-yield(`RoomYield`+체인 리셋), notice-reply 표면화, 그리고 request 가 **체인 상한 파킹을 살아남는** advisory floor 큐(스모크가 찾은 정련: 메시지 파킹이 재개 신호까지 삼키면 안 됨). 신규 자기완결 `scripts/roundtable-smoke.cjs` 로 검증 — 18/18 PASS. 라이브 배포는 R3 대시보드 컷과 묶어 재시작 1회로. verify-nway 19축 PASS.

이전: v2.5.153 (2026-07-17) — **Constellation v2.4.53 — roundtable: 다자간 topic room (§13.30)** — 셋 이상의 화자(에이전트+사람)에게 1급 거처가 생겨요: **이층 분리** — 서버는 결정론적 floor 를 강제하고(기존 1:1 relay 위 room fan-out, 파킹하는 `autoHop` 체인 상한, rate+연속 발화 상한, stall 감지, 인간 soft-yield 우선권), 신규 **`/roundtable` 규율 스킬**이 판단 계층을 소유해요(침묵 기본값 게이팅, 지목 시 응답 의무, 발언권 bid, 고정 catch-up 순서, ack-by-reference). 어휘는 MUC/Matrix 계보(`voice`·`moderated`·`moderator`·`notice`) 정렬; 5축 딥리서치(121출처·적대 검증 12건)가 근거. 스펙-우선 컷 — 서버/대시보드 구현은 R2-R5 트랙. verify-nway 19축 PASS.

이전: v2.5.152 (2026-07-17) — **Constellation.md provenance-redaction 스윕** — 공개-repo redaction 규율(기술 내용만)을 스펙 본문에 적용: 사설 어댑터/에이전트명을 프로토콜 역할로 일반화(`upstream dev agent`·`downstream adapter`), 결정주체 표기(`main-upstream policy`/`user board directive`/`the user surfaced` 류)를 비인칭 `adopted <날짜>` + 기술적 사건 서술로 재작성, 발화 인용 1건 제거 — 23개소 27치환, 프로토콜/의미 변화 0. 아카이브 docs + 과거 CHANGELOG 잔존은 후속 패스로 등재. verify-nway 19축 PASS.

이전: v2.5.151 (2026-07-17) — **P4 앵커: `EUX_P4_SEED` env 오버라이드** — `constellation/history-store.p4.mjs` 의 고정 fast-check seed 가 env 오버라이드 가능한 기본값이 돼요: `EUX_P4_SEED` 가 `EUX_P4_IMPL`/`EUX_P4_RUNS` 훅 계열에 합류 — reverse-sync e2e 라운드가 앵커 파일을 건드리지 않고 양측에 새 seed 를 고정할 수 있고, 기본값(`20260711`)은 과거 판정과의 비교 가능성을 유지해요. 양방향 검증: 기본 실행은 과거 판정 정확 재현(6 attested · 1 공개 SKIP · 0 failed), 오버라이드 실행은 새 seed 반영 + 전 절 attested. verify-nway 19축 PASS.

이전: v2.5.150 (2026-07-17) — **Constellation v2.4.52 — `peer` 키 kind** — 타 프로젝트의 main 이 더는 `upstream` 키에 편승하지 않아요: `kind:'peer'` (`pk-` 접두사 · 전용 `?peerKey=` 파라미터 · `peer` wire role · `/join/peer` 온보딩 · KEY-MGMT v0.4) 가 peer-main 을 자율 upstream 에이전트와 end-to-end 분리. 대시보드에 피어 탭 그룹(로컬↔협업 사이, 로즈) + `Peer↔Peer`/`Peer↔Collab` 모니터, 메인 그룹에 `Main↔Peer` 신설(모든 모니터 lazy — 대화 없으면 숨김), 키 UI 에 🤝 피어메인 kind, 프롬프트 주입 행에 상시 인디케이팅 **타깃 셀렉터**(탭/그룹 선택 시 자동 해석, 현재-선택 한정 오버라이드). §13.9.3 에 피어-지연 규율 추가: 피어가 붙은 보드의 main 은 보드 잡일을 board-worker 에 위임해 피어 응대를 빠르게. verify-nway 19축 PASS.

이전: v2.5.149 (2026-07-17) — **docs: 설치 표면이 저장소를 따라잡음 — Compendium 설치 카드 + Codex 호스트 카드 + 32스킬 로스터** — 설치 섹션 플러그인 카드가 인트로의 "7종" 선언과 달리 6장이었던 것 (Compendium 카드 추가, "여섯 플러그인" ×3 → 일곱); v2.5.135 출시 후 32스킬로 성장한 Codex 어댑터가 changelog 산문에만 존재하던 것 — 환경별 섹션이 3호스트로 열리고 OpenAI Codex (어댑터) 카드가 실제 설치 단계 (`gen-codex-adapter.cjs --install` · `config.toml.example` 스탠자 · `codex/AGENTS.md` hook-replacement 규율) 를 싣게 됨 + README 브릿지 표 Codex 행이 "AGENTS.md 직접 참조" 과소-클레임 대신 어댑터를 가리킴 (EN + KO 3벌); 신설 `#skills` 섹션이 32스킬 전부를 플러그인별 7카드 + 호출 분류로 열거. verify-nway 19축 PASS.

이전: v2.5.148 (2026-07-17) — **v2.5.147 출시 직후 적대적 검증 — 8건 수정** — 방금 출시한 컷에 3-렌즈 회의 패스(검열/일반성 · 인용 표면과의 정합 · 수치 전수 대조)를 돌려 10건 발견, 8건을 여기서 수정 (킷 v0.2.1 · Constellation 플러그인 v0.3.25): boardsweep 이 한 사설 배치의 `modes.tone` 을 보편 스키마처럼 제시하던 것 일반화, 범위 서술을 "에이전트가 작성하는 모든 컴포넌트"로 정직화 + 위키 투영을 스윕 목록에 + `current[]` 누락-추가 조항; eg-memsync 시드 경계를 승격 한정으로 스코프하고 시드 절 내부 드리프트는 날짜-메모리 규칙으로 해소 + 의도적 로컬 분기로 표시; codex/README 수기 카운트 탈경화("22 스킬" ×4, v2.5.135 이래 동결); 소개 페이지 설치 인트로가 아래 카드와 같은 절차 5종으로. 선재 발견 2건은 별도 트랙 등재 (Constellation.md Provenance 검열 스윕 · compendium-lint 자기 카운트). verify-nway 19축 PASS.

이전: v2.5.147 (2026-07-17) — **`/eg-memsync` + `/boardsweep` — 정합 스킬 2종** — 킷(v0.2.0)에 다섯 번째 절차 `eg-memsync`(`/egmem`): 에이전트 메모리와 거버넌스 문서를 양방향 전수 대조 — 드리프트 5종 검출, 날짜 있는 메모리가 날짜 없는 산문에 우선, 저장소 실재가 낡은 상태-메모리를 종결, 진성 모순은 자동 판정 없이 surface, 메모리에만 있는 영구 규칙은 4개 경계(성숙도 · 관행-vs-헌장 · `/egup` 의 시드 경계 · pointer-not-paraphrase) 아래 문서로 승격 + 공개 repo redaction 게이트. Constellation 플러그인(v0.3.24)엔 `/roundnext` 의 회고 방향 짝 `boardsweep`: 실시간 채팅 제외 전 보드 컴포넌트 정합 — `done[]` VCS 실증, 출시된 planned 이관, 해소된 검토사안 closure, 레지스트리 가지치기, 톤 정규화, 조작 금지. boardsweep 은 보드의 *주장*을 고치고, `/roundnext` 는 *다음 행동*을 정함. Codex 어댑터 스킬 29 → 32. verify-nway 19축 PASS.

이전: v2.5.146 (2026-07-13) — **`estregenesis` — 킷 플러그인: EG 자체를 명령으로** — 이제 EG 도입에 raw 깃허브 URL 을 찾아다닐 일이 없음. 절차 4종: `/egboot` (신규 프로젝트) · `/egmig` (기존 룰 파일 — 모든 룰을 승격하거나 사유와 함께 폐기) · `/egup` (시드 + 플러그인 델타, 가산형, 로컬 편집이 이김) · `/egrich` (풀 무장, 비용 선고지). 오분류 시 맞는 형제로 라우팅하고, 짧은 이름 3종은 **복사본이 아니라 포인터 별칭** (Compendium 의 pointer-not-paraphrase 를 플러그인 자기 표면에 적용). 스킬은 시드를 가져와 실행할 뿐 재진술하지 않고, 가져올 수 없는 시드를 기억으로 재구성하지 않음. 의존성 0, 런타임 없음. **promo 훑기**: 60초 시작이 명령 하나 경로를 먼저 제시; Compendium 카드가 런타임 출시 5릴리스 뒤에도 "v0.1.0, design draft" 광고 중이었음; 플러그인 로스터가 Constellation v0.3.16 에 동결; `docs/index.html` 에 킷 카드 추가. **verify-nway 구멍 해소**: `readme-current` 축이 언어별 첫 마커만 매칭 — 뒤쪽 버전 관리 사본 2벌이 v2.5.137 에 8컷 동결인데도 PASS 였음. 이제 전 마커 검사. 19축, 드리프트 0.

이전: v2.5.137 (2026-07-08) — **플러그인 로드-에러 수정 (CC 2.1.x 스키마 정합) 5개 플러그인 + verify-nway 재발방지 축** — 다운스트림 어댑터의 `claude plugin validate` 가 플러그인 매니페스트가 현행 Claude Code 플러그인 스키마에서 어긋난 3가지를 표면화(해당 표면 쓰는 플러그인의 로드/스킬 파손). 전부 수정 + 재발 불가하게 기계화. **(1) `hooks/hooks.json` 래퍼 (🔴 로드 차단)** — 이벤트가 최상위 `"hooks"` 키 아래 있어야 하는데 constellation/hyperbrief/ultrasafe 는 최상위(`{"Stop":[…]}`)라 validate 실패 + **플러그인 전체** 로드 차단. `{"hooks":{…}}` 로 래핑 + 스키마 외 `_comment` 제거. **(2) `mcp` 아닌 `mcpServers` (🟡)** — CC 는 plugin.json 최상위 `mcp` 필드를 무시; 현행 키는 `mcpServers`. MCP 보유 4종(constellation/hyperbrief/ultrasafe/compendium) 전부 리네임 → 번들 서버 실제 로드. **(3) SKILL.md frontmatter YAML (🟡)** — 미인용 `description:` 에 `: `(콜론+공백) 포함 시 strict-YAML 파싱 실패 → 스킬이 **빈 메타**로 로드(name/description 없음 → 트리거 불가). 4개 플러그인 6개 스킬 해당(echo-mode, hyperbrief-revisit, ultrasafe-ai-llm-redteam, **compendium-curate, compendium-lint, routinize** — 뒤 3개는 어댑터 리포트가 hooks 보유 3종만 validate 해서 누락); 6개 description 전부 이중인용. **(4) 재발방지** — 신규 **plugin-schema verify-nway 축(18번째)** 이 3가지를 컷 시점에 게이트(hooks 래퍼 · SKILL frontmatter plain-scalar 안전 · `mcpServers` 키), 공식 code.claude.com/docs 플러그인 레퍼런스 기준 — 수정 전 18개 위반을 전부 검출. 패치 릴리스: constellation 0.3.22 · hyperbrief 0.7.1 · ultrasafe 0.2.3 · compendium 0.2.6 · greatpractice 0.3.4. Codex 어댑터의 MCP 탐색도 `mcpServers` 읽도록 갱신. verify-nway 18축 PASS.

이전: v2.5.136 (2026-07-05) — **Greatpractice v0.3.3 — 첫 model-invoked 스킬 `routinize`(관행화) + `/before-compact` soft 체이닝** — Greatpractice 가 첫 Agent Skill 을 얻어요 — capture→mature→codify 파이프라인(§1.2/§5.4)의 model-invoked 관문. **`/routinize`** 는 *반복되는* 작업 패턴을 durable 관행으로 codify 하되, 모듈의 **포착-즉시 / 승격-지연** 규율에 충실해요: 패턴을 `memory/feedback_*.md` 에 즉시 포착(cost-0, blameless voice), 재발 시 좌표 누적, §5.2 notability gate 통과 시**에만** `_propose/` 초안 생성(substantive 3회+ × *독립* 좌표 2종+ × verifiable — 한 세션 반복은 대개 1좌표라 대부분 포착에서 끝남), enforcing hook 을 **절대 자가-ratify 안 함**(차단 항목 승격은 사용자 게이트, §5.4 gate 3). phronesis-heavy 작업(판단-heavy / 희소맥락 / 고맥락의존)은 설계상 제외(§1.4/§5.3). **최적 트리거 = `/before-compact` 타이밍**: 세션의 쌓인 컨텍스트가 원재료인데 곧 compaction 으로 사라지니, `before-compact` 스킬에 `/routinize` 를 먼저 돌리는 soft Step-0 추가(opt-in — Greatpractice 미채택 시 스킵) — 둘은 상보적(routinize=세션 간 반복 포착, before-compact=이번 세션 in-flight 포착). Codex 어댑터가 신규 스킬을 자동 반영(22스킬 투영). verify-nway 17축 PASS.

이전: v2.5.135 (2026-07-05) — **Codex 어댑터 (Stage 1) + Compendium v0.2.5 (어댑터가 표면화한 MCP 선언 갭)** — EstreGenesis 모듈을 이제 Claude Code 뿐 아니라 **OpenAI Codex** 에서도 쓸 수 있어요. **(1) Codex 어댑터 (`codex/`)** — Codex 가 2026 에 EG 가 이미 쓰는 세 커스터마이즈 표면(Agent Skills `SKILL.md` · MCP 서버 · `AGENTS.md`)으로 수렴해서, 6개 모듈이 거의 변환 없이 이식돼요. 21개 canonical `SKILL.md` 를 복제하는 대신(Migration-B dogfood 가 경고한 드리프트 표면), 어댑터는 **투영**이에요: `gen-codex-adapter.cjs` 가 스킬을 Codex 탐색 경로에 온디맨드로 materialize(`--install`, 심링크/복사)하고, Codex 전용 파생 표면만 재생성 — `config.toml.example`(4개 MCP `[mcp_servers.*]` 스탠자) + README 인벤토리. 손작성 `codex/AGENTS.md` 는 **훅 대체 규율**을 담아요: Codex 엔 lifecycle 훅이 없어 6개 Claude Code 훅 각각을 페어 스킬 수동 호출로 매핑 — 자동화는 안 가도 규율은 이식돼요(북극성 논지의 구체화). 신규 EG-ops **codex-adapter verify-nway 축**(`gen --check`, 17번째)이 커밋된 표면을 라이브 plugin 집합과 대조 게이트. **(2) Compendium v0.2.5** — 어댑터 구축 중 진짜 배선 갭 발견: Compendium MCP 서버(§10 8-tool 런타임, v2.5.114 출하)가 `plugins/compendium/.claude-plugin/plugin.json` 에 **선언되지 않아** 어떤 호스트도 자동 등록 못 하던 상태. 스모크 테스트 정상(initialize + tools/list → wiki_read/search/upsert/…) 확인 후 선언 — Claude Code 도 고치고 어댑터가 4개 MCP 전부 투영하게 함. N-way 버전 cascade 전체(plugin.json + marketplace + mcp/package.json + Compendium.md frontmatter + docs badge/meta/module-tag). verify-nway 17축 PASS.

이전: v2.5.134 (2026-07-05) — **docs: promo 페이지 staleness 전수 스윕 — 누적 패널 동결 해제, 6모듈 정정, Constellation v2.4.24–46 기능 파동 소개 추가** — 공개 promo 페이지 전수 stale-콘텐츠 스윕(에이전트 스윕, EN+KO, 3 독자층 전부)에서 기계검사 배지/meta 는 갱신돼 왔지만 본문 prose 가 동결돼 있던 곳들을 찾아 전부 수정. **(1) index.html** — "선택 모듈 2종" → 6종 (dev+expert, 양 언어); "24h baseline 이후 누적" 패널을 "v2.5.36 / Hyperbrief 가 신규 3번째 모듈" 동결 상태에서 현행 기록(v2.5.133 대역 · 모듈 4종 추가 → 총 6종 · Constellation §13.23–§13.26 파동 · M2 어댑터 dogfood 흡수)으로 해제, 지표 갱신 (~21→~118 cuts, 신규모듈 1→4, 어댑터 bundle·리포트 3→4, 통합 2→6+); Ultrasafe 스테이징 3곳 정정 ("advisory v0.1.x → blocking v0.2.x" → "advisory v0.2.x 라이브+자가 도그푸딩 → blocking v0.3+"); Greatpractice 카드를 "v0.1.0 첫 cut + v0.2–0.4 roadmap" 프레임에서 출하된 v0.3.2 상태로 재앵커; Compendium general 카드가 어떤-vault-위에서든-동작하는 이식 규율 프레이밍으로 선도; Constellation 카드에 v2.4.24–46 하이라이트 추가. **(2) constellation.html** — 대표 페이지 본문이 dogfood 시대(§13.16.12 / v2.5.15 relay) 이후 기능을 하나도 소개하지 않던 상태: "What's inside" 신규 카드 2장으로 §13.23–§13.25 보드 substrate 파동(backends 레지스트리 + board-worker projection, PWA + 무의존 Web Push, 표면별 접속 제어 + CIDR + 노출 토글, 위키 cross-link 사이드 패널, ack ✓ 원줄 UX)과 §13.26 echo-mode(3-상태 로컬↔보드 원격제어 미러)를 소개. **(3) hyperbrief.html** — "18 가지 안티패턴" → 26 (자기 배지와 정합). **(4) greatpractice.html** — "v0.1.0 사양" / "v0.2–v0.4 roadmap 정의" → 현재 v0.3.2, v0.2/v0.3 은 ship 됨으로, v0.4+ 는 open 으로. Docs only, EN/KO. verify-nway 16축 PASS.

이전: v2.5.133 (2026-07-04) — **Migration-B dogfood 후속 — 시드 레지스트리 6종(Compendium) + backends.json re-sync preserve 규칙 + runtime notes 분리 + README KO 현재 동결 해제 (Constellation v2.4.46, 시드 v2.5.1)** — 다운스트림 어댑터가 Migration-B(M2) 풀 업그레이드(시드 v2.4.3→v2.5.0 + release delta ~92패치)를 수행한 dogfood 리포트가 ship-surface 공백 3건을 표면화 — 전부 수정 + 컷 중 발견 1건 추가. **(1) 시드 모듈 레지스트리 → 6종.** 시드 § EG 모듈 레지스트리가 release 트랙의 Compendium(v2.5.110 ship) 을 누락한 5종 상태 — 시드만 읽는 어댑터는 6번째 모듈을 놓침(리포트의 dual-marker cross-check 가 검출; 실어댑터가 release 트랙에서 Compendium 을 실채택한 만큼 레지스트리의 production-보류 예외 해제). 6개 시드 전부(KO/EN × Master/Lite/Compact)에 Compendium 행 + "선택 모듈 6종" 인트로; 시드 마커 v2.5.0→**v2.5.1**; EG-ops verify-nway 시드-레지스트리 axis 6모듈 확장. **(2) backends.json re-sync preserve 규칙(§13.23.2).** 배포 config(boardTitle·roster)가 대시보드 기본 fetch 경로상 reference `dashboard/` 복사셋 *내부*에 있어 벤더-카피 풀 re-sync 가 어댑터 브랜딩을 clobber — preserve-list 규칙을 스펙에 명시. **(3) reference/runtime dev-notes 분리.** `*-NOTES.md` 3편을 `runtime/notes/` 로 이동, runtime 복사 표면을 런타임 전용화. **(4) README KO 버저닝 동결 해제.** 컷 중 발견: README KO **현재** 항목이 22컷 동안 v2.5.110 에 동결(매 컷 EN Current 만 갱신); v2.5.133 으로 동기 + 신규 **readme-current** verify-nway axis(EN Current ↔ KO 현재 ↔ data.js)로 결정론화. verify-nway 16축 PASS.

이전: v2.5.132 (2026-07-04) — **Constellation v2.4.45 — echo-mode(원격제어 미러) + ack ✓ UX** — 라이브보드 2가지 추가. **(1) echo-mode (§13.26)** — 에이전트의 로컬 사람↔에이전트 대화를 보드 실시간 대화 채널에 **양방향** 미러하는 3-레벨 per-agent 모드(`off`/`on`/`mirror`) — 보드를 보는 사람이 보드에서 에이전트를 *구동*할 수 있는 remote-control 기반. `on`=턴 최종 텍스트 / `mirror`=+라이브 활동 스트림(tool·step·thinking narration, 채팅 게이트웨이 느낌). 보드 입력은 `UserPrompt` 로 도착→로컬 대화에 `> board: …` 인용 후 처리; 구조적 선택은 로컬은 평문 선택지 / 보드는 `SelectionPrompt` chip(로컬 블로킹 UI 금지, §13.17). 기본값은 **합류 출처**(사람합류=off·에이전트스폰=on — 아무도 직접 안 띄운 에이전트는 보드가 유일 채널). 프로토콜(§13.26) + `/echo-mode` 스킬 + deps-0 `echo-emit.cjs` 3-phase 레퍼런스 훅(PreToolUse/PostToolUse 라이브 진행 + Stop 턴텍스트+thinking 요약, 레벨 게이팅) 출하. 라이브 end-to-end 도그푸딩(보드→로컬 구동 + 로컬→보드 미러). **(2) ack ✓ UX** — `UserPromptAccepted`/`Ack`/`AckProcessed` 를 별도 코드값 줄 대신 **원** 요청/메시지 줄에 ✓ 스탬프(promptId / msgId 상관) + 커서 4분면 hover 팝업(시각·agent, 클릭 고정); 라이브 로컬에코 줄이 promptId 를 실어 실시간 ack 도 제자리 표시(종전엔 History replay 만). verify-nway 15축 PASS.

이전: v2.5.110 (2026-06-15) — **Compendium v0.1.0 — 6번째 모듈 (design draft)** — EstreGenesis 의 어휘-substrate 모듈 착지: 개념-앵커 이중 register 용어집(한 개념 → register-중립 정의 1개 + register 태그된 term/gloss; 전문어↔일반어 매핑은 공유 `concept_id` 안에 암묵적, brittle 한 term-A↔term-B 링크 아님) + cross-module 위키 + 교차링크/클릭-정의. normative 한 건 아무것도 안 가짐 — 모든 항목이 소유 모듈 spec(SSoT)으로의 단방향 포인터, 유일 예외는 어느 모듈도 안 가진 general-register 어휘. 북극성 axis-2(어휘 생존 > 코드 생존)의 가장 순수한 표현이자 deprecated 어휘의 재배치 home(axis-3 eviction 일급) — 자기 자신의 eviction 도 모델링. 어드버서리얼 설계 리뷰로 우-사이징: v0.1 은 모델 + 콘텐츠 경계 헌장 + ~25 EG 시드 exemplar + 4 가드닝 lint + 포인터-해소 검사만, 승격은 count→Hyperbrief 브리프 큐잉 단일 게이트로 축소하고 hysteresis/debounce 자동화·a11y 컴포넌트·멀티탭 split·MCP 런타임·대시보드 표면은 v0.2+ 의 명명된 prunable 단위로 연기. 등록: `plugins/compendium/` manifest + marketplace(5→6) + verify-nway Compendium plugin-버전 axis + README/docs 모듈 수 5→6 (`docs/index.html` "Six graduated modules"). seed-registry 등재는 production 까지 보류(design-draft). 스펙: `Compendium.md`.

이전: v2.5.109 (2026-06-15) — **Greatpractice + Ultrasafe 스펙 영어 변환** — foundational 스펙(Constellation / Hyperbrief / Superscalar)은 영어인데 본문이 한국어로 드리프트해 있던 `Greatpractice.md`·`Ultrasafe.md` 를 영어로 통일했어요 — 공개 standard-proposing 표면의 일관성 패스. **의미 변화 0**: 1:1 라인 치환(Greatpractice 1056/1056, Ultrasafe 2507/2507 insert/delete; heading·코드블록·YAML 키·버전·§참조·표·인용 전부 verbatim 보존 — heading/fence/table 카운트 구조 검증이 원본과 동일). 유일하게 남긴 한국어는 Greatpractice §6.3/§12.3 의 voice-linter 정규식 매칭 대상(번역하면 lapse 탐지 패턴이 깨짐). 모듈 버전 무변경(Greatpractice v0.3.1, Ultrasafe v0.2.2) — 모듈 범프 아닌 EG-릴리스 doc cut.

이전: v2.5.108 (2026-06-14) — **docs meta-description 버전 드리프트 + verify-nway 12번째 axis** — docs 페이지의 모듈별 `<meta name="description">` 버전 표기가 어떤 verify axis 에도 안 잡힌 채 드리프트해 있었음: constellation v2.3.23→v2.4.36, hyperbrief v0.5.6→v0.7.0, greatpractice v0.1.0→v0.3.1, ultrasafe v0.2.1→v0.2.2; index.html 은 여전히 "three graduated modules"(→five) 광고. README KO heading "3 선택 모듈"(→5), install-block plugin 버전 stale(Constellation v0.2.3→v0.3.16, Hyperbrief v0.5.6→v0.7.0, Greatpractice v0.1.0→v0.3.1, Ultrasafe v0.2.2 추가) + "all four"/"넷"→"all five"/"다섯". 새 **docs-meta axis(12번째)** 가 각 페이지 meta 버전을 모듈 frontmatter canonical 버전 + index 모듈 수와 대조해 이 표면이 더는 미검출 드리프트를 못 냄. 모듈 버전 자체는 무변경(표기만 정정). verify-nway 12축 PASS, 0 드리프트.

이전: v2.5.107 (2026-06-13) — **Constellation v2.4.36 — 모바일 실시간 그룹 스와이프 (#3a B)** — 확정한 모바일 네비 재구성의 거동 절반(B) (A = v2.4.31 하단 탭바). ≤560px 에서 실시간 창의 내용 영역이 가로 **scroll-snap 페이저**가 됨 — 채널 그룹별 한 페이지(업스트림/메인/보드워커/로컬/협업, 각 그룹의 시간순 병합뷰). **스와이프**로 그룹단위 전환되고, 탭바의 **선택 + 가로 스크롤이 따라옴**(양방향 동기); 페이저 아래 점(dot) 띠가 현재 그룹을 표시. **탭**(그룹 헤더 또는 채널)을 누르면 페이저가 그 그룹 페이지로 자동 수평 스크롤. 데스크탑(>560px)은 무영향 — 단일 `#ws-stream`, 페이저 없음. 구현: `wsRenderActiveStream` 을 컨테이너 인자형 `wsRenderStreamInto` 로 리팩터, 그룹 계산을 `wsComputeGroups` 로 분리해 탭바와 페이저가 동일 그룹 집합/순서를 공유; 560px `matchMedia` 로 모드 전환; 스와이프 정착은 debounced `scroll` + 프로그램-스크롤 가드로 감지(탭 탭 스크롤 ≠ 사용자 스와이프 — 피드백 루프 없음); 라이브 행은 active 그룹 페이지만 재렌더(타 그룹 행은 unseen 뱃지만 증가). 중복 렌더 위험 없음 — 채널은 정확히 한 그룹 페이지에만 속함(페이지=그룹, 채널 아님). Playwright 390×844: 스와이프→그룹전환 + 탭바 동기 + 점 인디케이터, 탭→페이저 스크롤, 콘솔 에러 0; 보드 smoke 13/13(회귀 0). 모바일 한정, 실기기 테스트 필요. 레퍼런스 대시보드(index.html/app.js/style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

이전: v2.5.106 (2026-06-13) — **Constellation v2.4.35 — 모바일 실시간 창 fullscreen 갭 수정** — v2.4.31 모바일 하단탭바 재구성의 후속, Playwright 390px 실측으로 포착: 실시간 창 우측 ~16px·하단 띠에 페이지 배경이 비쳤음. 원인(추측 아닌 computed geometry 실측 — `width`/`100vw` override 가 계속 374px 로 resolve): 데스크탑용 `.ws-pop` 의 `max-width:96vw`+`max-height:92vh` 캡이 모바일 fullscreen pane 을 390×844 뷰포트 안에서 374×776 으로 잘랐던 것. 픽스: ≤560px 규칙에 `max-width:none`+`max-height:none`(+ `width:100vw`/`height:100dvh`) → pane 이 뷰포트를 끝까지 채움; 하단 탭바는 z-index 로 위에 overlay, pane body 는 하단 패딩 유지로 입력창이 탭바에 안 가림. 390×844 정확히 채움 검증(popRect right=390·bottom=844). 레퍼런스 대시보드(style.css), 프로토콜 표면 0. verify-nway 11축 PASS.

그 이전 릴리스: 모든 항목이 [CHANGELOG.md](CHANGELOG.md) 에 보존돼 있어요 — 이 목록은 최근 몇 건만 유지해요.

**전체 변경 이력** (v1.0 부터 모든 릴리스, EN + KO): [CHANGELOG.md](CHANGELOG.md).

본 upstream repository 의 `CHANGELOG.md` 가 changelog SSoT. 각 시드 파일은 tier, 언어, 현재 버전, counterpart, 그리고 시드를 복사한 대상 프로젝트의 README가 아닌 본 `CHANGELOG.md` 포인터만 담은 짧은 헤더 메타데이터를 유지. 마이그레이션 B 로 프로젝트 업그레이드 시 에이전트는 시드 헤더의 버전 마커와 본 changelog 로 delta 를 계산.


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
