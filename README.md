<p align="center">
  <img src="logo/EstreGenesis.png" alt="EstreGenesis logo" width="472" height="384" />
</p>

<p align="center">
  <img alt="Version: v2.5.74" src="https://img.shields.io/badge/version-v2.5.74-2ea44f?style=for-the-badge" />
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

## Beyond bootstrap — five optional modules

v1.x is the project seed — bootstrap a new AI-native project, or migrate an existing one, into the `AGENTS.md` SSoT (everything above). **v2.0+ adds five optional modules** layered on top:

- **[Constellation](Constellation.md)** (v2.0+) — live multi-agent orchestration. Graduates coordination from the file-based `.agent/_coordination/` ledger to a real-time live board (WebSocket + A2A messaging + dashboard). The **A2A bridge interface** is the invariant contract; reference runtime under [constellation/reference/](constellation/reference/) is Node deps-0 except `ws`. Components authored as `.eux` and brewed with **[EstreUX](https://github.com/SoliEstre/EstreUX)** — a separate Apache-2.0 runtime EG references (clone-and-run), not bundles or owns.

- **[Superscalar](Superscalar.md)** (v2.3+) — execution-scheduling discipline for parallel sub-agent dispatch. Five-dimension `issue_width` formula (effort_band + pace_mode + Little's Law + Kanban WIP + autonomy_available_workers) + cost-benefit-gated dispatch at the 30–60k token-horizon crossover + worktree-isolated reorder buffer + in-order retire + consistency gate + opt-in speculation. Production-ready (Stage 1 ships). n=8 dogfood ledger + Entry 06 controlled A/B showing "parallelism is not sufficient; orchestration discipline produces consistency."

- **[Hyperbrief](Hyperbrief.md)** (v2.3.20+) — decision-delegation gating discipline. Every user-facing decision question runs through a trigger rubric; if it escalates, the LLM emits a schema-enforced JSON IR and a deterministic Node renderer produces a 9-section Markdown brief + interactive HTML card. 4-axis × 5-level tone profile + skill-side auto-localize (button label + MD trigger phrases follow the user's prevailing conversation language). Cross-module integrations active: Constellation §13.16.9 (5 A2A intent names + ack_tier='decided') + Superscalar §3.1 (orthogonal gate at write/deploy/send lane retire). §11.5 v1.0 readiness rubric (Lens A 7-dim module-wide GA / Lens B 6-dim host-specific marketplace registration) shipped.

- **[Greatpractice](Greatpractice.md)** (v2.5.50+, v2.5.55 release-cadence ratified) — memory-triggered practice-codification discipline. Targets the &quot;quiet omission&quot; failure surface: small obligations that should accompany the work — &quot;update the docs alongside the code,&quot; &quot;check before sending,&quot; &quot;when X changes, also change Y&quot; — that usually start as memory notes and gradually slip through as those notes accumulate. Greatpractice treats agent-workspace memory feedback (`memory/feedback_*.md` or equivalent) as the input trigger and routes raw signals through a 5-axis multi-criteria maturation gate (frequency + depth + recency + cost + predictability weighted sum, threshold ≥ 18 OR 3-criterion notability) into a 3-tier macro/mezzo/micro hierarchy. Ratified entries are enforced via deterministic lifecycle hooks (SessionStart blocking / UserPromptSubmit path-scoped inject / PreToolUse 3-subtype poka-yoke contact/fixed-value/motion-step / PostToolUse SSoT propagation / Stop cycle-end probe / PostCompact working-set restore). Explicit `phronesis_boundary` field carves out judgement-heavy work that should NOT be codified. Backed by 9-axis cross-domain deep research (harness · humanities · psychology · management · processor · os · sre · memoization · canonical). v2.5.55 dual cut promotes the [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) entry from `_propose/draft` to ratified (user steering trigger at N=1 evidence; mezzo decomposition 8-candidate batch scheduled v2.5.56+).

- **[Ultrasafe](Ultrasafe.md)** (v2.5.55+) — pre-release / pre-update simulated penetration testing discipline. Targets the &quot;ship-then-discover&quot; failure surface: security problems found by external users after release rather than by internal verification before. Ultrasafe ships every release through a Superscalar-applied Workflow where 8 parallel red-team agents (v0.1.0 minimum fan-out — AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer + GTA/DSP cross-cutting) simulated-attack from independent perspectives, emit findings via the Finding Output Contract (§4 of the spec), aggregate at the Synthesizer with BFT 2f+1 quorum + cross-axis correlation, and produce a 3-layer report (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate). The ≥3 iteration loop runs until 4-condition AND clean signal: regression-free + monotonic improvement + coverage gate + 2 iter consecutive with agent diversity invariant. Dual pre-release trigger (PreToolUse hook on `git push --tags` / `npm publish` / `gh release` / etc. 7 matchers + `/ultrasafe` skill). 5 new Constellation A2A intents (`ULTRASAFE_FINDING` / `ITERATION_BOUNDARY` / `RELEASE_GATE` / `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION`). **Advisory-only v0.1.x → blocking v0.2.x** staged transition (Tier 3 release strict / Tier 1/2 opt-in). Backed by 17-axis cross-domain deep research (harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution). v0.1.0 first cut ships the full spec (2544 lines, §1-§13 + appendix A-C) + plugin manifest; runtime (attack agent dispatch / iteration loop runner / 3-layer report generator / 5 A2A intent handlers / PreToolUse hooks / MCP server) deferred to v0.2+ roadmap.

All five modules are **optional** and **referenced** (not bundled into the seed tiers, so the tier seeds stay lean). File-based coordination (Phase 5) remains the default and is enough for most projects.

### Install as Claude Code plugins (self-hosted marketplace)

The same five modules also ship as Claude Code plugins via a **self-hosted marketplace** in this repo. From any Claude Code session:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install constellation@estregenesis-plugins
/plugin install superscalar@estregenesis-plugins
/plugin install hyperbrief@estregenesis-plugins
/plugin install greatpractice@estregenesis-plugins
/plugin install ultrasafe@estregenesis-plugins
```

Each plugin is independent — install one, two, three, or all four. The marketplace metadata lives at [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json); each plugin's source is under [plugins/](plugins/). Apache-2.0. The plugins are Phase 2 production-ready (Constellation v0.2.3 + MCP server with 5 tools; Superscalar v0.1.2 + §3.1 Hyperbrief interlock; Hyperbrief v0.5.6 + 3 skills + MCP server with 4 tools + PreToolUse/Stop hooks; Greatpractice v0.1.0 + 3 JSON schemas + 1 PreToolUse contact hook). Anthropic-side community-marketplace listing is deferred to v1.0 GA per [Hyperbrief.md §11.5](Hyperbrief.md) readiness rubric Lens B.

---

## Three tiers — pick one per project

| Tier | Size | Primary use | Target reader |
|---|---|---|---|
| **Master** | ~2440 lines | New projects that need deep guidance, teams learning the pattern for the first time, edge cases where you need every inline template (full AGENTS.md + `.gitignore` per-stack rows + escape/HTML/PDF scripts + bridge templates) | First-time AI Native author; teams formalizing a process |
| **Lite** | ~1100 lines | Quick new projects, migration sessions, onboarding new AI services into existing projects, when the master would eat too much context window. Self-contained — embeds inline templates for AGENTS.md, `.agent/rules.md`, `.gitignore`, scripts, and bridge stubs in compressed form | Returning author who remembers the pattern; most projects |
| **Compact** | ~120 lines | Authors who already know the pattern and want the minimum viable seed; tightest context window; bullet triggers + algorithm-spec descriptions only (the agent generates the actual files following the specs) | Power user who just needs a checklist |

You place **one tier** into your project. Not all three. Cross-referencing tiers that aren't present produces dead links and agent confusion, so each tier is **self-contained** — internally complete, no forward or backward references to other tiers.

When a project grows to need more detail, you don't upgrade tiers in-place. You simply replace the file with the next tier and commit. Agents treat it as a normal doc update.

---

## File list

```
AI_Native_Project_Master_Seed_Prompt.md       ← English master (deepest, ~2440 lines)
AI_Native_Project_Seed_Prompt_Lite.md         ← English lite (~1100 lines, self-contained)
AI_Native_Project_Seed_Prompt_Compact.md      ← English compact (~120 lines, self-contained)
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

Each language pair (English + Korean) of a given tier is fully aligned — same phases, same migration logic, same operational guidance. Pair them if your team is bilingual. **v2.0+** adds three optional referenced modules (Constellation + Superscalar + Hyperbrief), each also shipped as a Claude Code plugin via the self-hosted marketplace — see the changelog.

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

Each tier has its own version. Master is the authoritative evolution track; Lite and Compact are derived regularly from Master but may lag by a release.

**Current**: v2.5.74 (2026-06-10) — **ship-surface 진실성 un-claim (전수점검 careful 트랙) — Ultrasafe v0.2.1 · Greatpractice v0.2.1** — spec 이 **미존재 파일을 'v0.2.0 ship 단위'로 기술**하던 것을 실재 트리에 맞게 un-claim 정정 (doc-only, 기능/wire 변경 0): **(1) Ultrasafe.md §14.1 논리 역할 ↔ ship 표면 매핑 노트 신설 (normative)** — orchestrator / aggregator / clean-signal-gate 는 *논리 역할* (실표면 = 메인 에이전트 Workflow fan-out + synthesizer skill + MCP tools); `runtime/{orchestrator,aggregator,clean-signal-gate}.cjs` · `schemas/*.schema.json` · `mcp/tools/*.cjs` 는 v0.2.x 미출하 명시 (3 계약의 정본 = §4/§8.1, server.cjs ajv 는 파일 부재 시 graceful skip). **(2) §14.3 트리 실재화 + §15 헤더 skill 디렉토리 실명 8종** (`ultrasafe-ai-llm-redteam` · `-web-api-attacker` · `-supply-chain-auditor` · `-crypto-reviewer` · `-social-engineer` · `-methodology-compliance` · `-threat-model-lifecycle` · `-synthesizer`). **(3) §16.6/§17 실구현 정합** — MCP server entry 를 SDK-free 단일 파일 구조로 (기존 skeleton 은 미사용 `@modelcontextprotocol/sdk` + 미존재 `mcp/tools/` require 를 그림), hook 명세를 실동작으로 (15-패턴 매처 — §10.1 7종 중 `gh pr merge` 제외 사유 명시 — + self-contained 탐지/state/outbox/stderr; orchestrator spawn 하는 가짜 skeleton 제거), hooks.json 실파일 형식 반영. **(4) shipped 파일 동기** — ultrasafe plugin README 전면 재작성 (v0.1.0 stale "runtime 은 v0.2.x roadmap" → v0.2.x 실재 ship 목록 + 미출하 명시) + SKILL.md 6종의 orchestrator/schema stale ref 정정 + finding/audit 경로를 `.ultrasafe/` working-dir 컨벤션으로 통일 + mcp/package.json description·server.cjs 주석. **(5) Greatpractice.md §11.1** — design-시점 목표 트리를 'v0.1.0 ship surface' 로 기술하던 것을 실재 ship 목록 (3 schemas + 1 contact hook) 으로 정정 + 잉여분 (runtime 5종 cjs / hooks 3종 / skills 5종 / templates 3종 / settings 확장 / canonical tree 가상 entry 목록) 을 §11.2 deferred 표로 이동 + plugin README 라벨 동기 (v0.1.0 → v0.2.x). **(6) docs/ultrasafe.html** — cut-scope 섹션을 v0.1.0-as-current 에서 v0.1.0→v0.2.x 진행형으로 재작성 + 심층 narrative 의 stale-as-current "advisory v0.1.x → blocking v0.2.x" 서사 8곳 정정 (역사적 v0.1.0 기술·spec § 인용은 보존). **Module versions**: Ultrasafe v0.2.0 → **v0.2.1** (doc-only patch — plugin.json·mcp/package.json·server.cjs VERSION·marketplace 동기), Greatpractice v0.2.0 → **v0.2.1** (doc-only patch — plugin.json·marketplace 동기). 기타 모듈 변경 없음 (Constellation v2.4.12 · Superscalar v0.4.2 · Hyperbrief v0.6.0). Seed-tier v2.4.3 unchanged. **No wire change** — 스펙·문서·manifest 라벨 정합만. verify-nway PASS. 이로써 2026-06-10 전수점검의 패치-트랙 4건 (v2.5.71 보안 / v2.5.72 XSS / v2.5.73 라벨 / v2.5.74 ship-surface) 완결 — 가지치기류·마이너범프 이상은 별도 검토 트랙.

Previously: v2.5.73 (2026-06-10) — **doc/manifest 진실성 정정 (전수점검 보완, 모듈 버전 무변경)** — 전수점검에서 식별한 stale 버전 라벨(실제 모듈 버전과 표시 라벨 불일치)을 정정 — 모듈 *기능*은 그대로, 표시만 현행화: **(1) Greatpractice.md** 제목·리드 단락의 "design draft v0.1.0" → **v0.2.0** (frontmatter 는 이미 v0.2.0 인데 본문 라벨만 stale 했음). **(2) marketplace.json** hyperbrief 엔트리 "Wraps Hyperbrief.md v0.5.6" → **v0.6.0** (plugin 은 이미 0.6.0). **(3) docs/ultrasafe.html** customer-facing 요약(meta description + dev/expert 태그라인 + 본문 intro)의 "v0.1.0 / advisory v0.1.x → blocking v0.2.x" → **v0.2.0 / advisory v0.2.x → blocking v0.3+** (배지 line 66 의 올바른 framing 과 일치시킴 — blocking 전환이 v0.2→v0.3 로 밀린 것 반영). **Module versions**: 변경 없음 (Constellation v2.4.12 · Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No wire change** — 표시 라벨 정정만. verify-nway PASS. **다음 careful 트랙(별도)**: docs/ultrasafe.html 심층 narrative 의 advisory/blocking/tier 서술(~40 ref, 역사적 v0.1.0 언급 vs stale-as-current 문장별 판별 필요) + Ultrasafe §14.3 / Greatpractice §11.1 ship-surface 진실성(미존재 runtime 파일을 'ship 단위'로 기술 — un-claim 정정) 은 intertwined Ultrasafe-truth 리비전이라 judgment-heavy, 집중 패스로 분리.

Previously: v2.5.72 (2026-06-10) — **Constellation v2.4.12 대시보드 XSS 하드닝 패치 (전수점검 후속, dashboard render only)** — 전수점검에서 식별한 reference 대시보드의 첨부 미리보기 XSS 표면을 차단 (threat model: peer 에이전트가 A2A 로 첨부를 보내 보드에 stored content 를 넣을 수 있음): **(1) html 첨부 iframe `sandbox`** — [app.js](constellation/reference/dashboard/app.js) 의 html 첨부(`srcdoc`)·link 첨부(`src`) iframe 에 `sandbox`(빈 값 = 스크립트·동일출처 차단) 부여 → 첨부 HTML 의 `<script>`/`onerror` 가 same-origin 실행되거나 `window.parent` 로 대시보드 DOM/쿠키에 접근하던 것 차단. **(2) mermaid 첨부 `textContent` 주입** — raw 다이어그램 body 를 `innerHTML` 대신 `.textContent` 로 주입 (mermaid.run 이 element textContent 를 소스로 읽어 렌더 동작은 동일하나, `<img onerror>`/`<script>` 가 mermaid 파싱 전 실행되던 경로 제거). **Playwright 검증 5/5 PASS**: mermaid SVG 정상 렌더(textContent 회귀 없음) + mermaid `<img onerror>` 미실행 + html iframe `sandbox` 보유 + iframe 내 스크립트의 parent 접근 차단. **Module versions**: Constellation v2.4.11 → **v2.4.12** (patch — dashboard render only, **wire 무변경 · 서버 재기동 불필요**, 브라우저 새로고침만), plugin v0.3.11 → v0.3.12. Other modules unchanged. Seed-tier v2.4.3 unchanged. **No protocol wire change** — dashboard render hardening only. **Files**: dashboard/app.js (inner + outer self-board 양쪽 동기) + N-way sync. **잔여 dashboard 발견**(decisions detail/previewHtml raw render, attNewTab blob mermaid)은 operator-작성 채널(낮은 peer-주입 위험) + viz/layout tradeoff 라 별도 검토. 전체 점검 리포트: outer `/reports/2026-06-10-eg-full-audit.md`.

Previously: v2.5.71 (2026-06-10) — **Constellation v2.4.11 보안 하드닝 패치 (전수점검 후속)** — 시드+모듈+플러그인 전수점검(Workflow 10영역 survey + main 종합)에서 식별한 reference 런타임 보안 발견 중 **패치 차원(코드/사실정정, wire 무변경)** 3건 반영: **(1) secure-by-default bind** — reference [server.cjs](constellation/reference/runtime/server.cjs) 가 기본 `127.0.0.1`(loopback)에만 바인드, 네트워크 노출은 `WS_BIND=0.0.0.0` 명시 opt-in + 비-loopback 바인드 시 startup 경고. board(대시보드) 연결이 무인증 trusted-operator 로 키 발급·`SetMain` 을 허용하는 표면인데 기존 0.0.0.0 기본은 같은 LAN 의 누구나 키 발급/조회/SetMain 이 가능했음 — 무인증 board 우회(critical) + agentId role 스푸핑(high) + KeyList 평문 노출(high)의 **원격 벡터를 한 번에 차단**. **(2) WS 프레임 상한** — [ws-core.cjs](constellation/reference/runtime/ws-core.cjs) 가 단일 프레임 + fragmented 재조립 총량을 `WS_MAX_FRAME`(기본 16 MiB)로 상한, 거대 length 선언/continuation 무한누적 메모리 고갈 DoS 차단. **(3) credential gitignore + eux 사실정정** — server 가 `key.json`(keyStore) + legacy `ws-keys.json` + `local-keys/*.key` 에 키 전문을 저장하는데 inner `.gitignore` 미커버였음(평문 키 파일이 tracked 디렉토리에 생성 가능) → gitignore 블록 추가 + [server-keys.eux](constellation/server-keys.eux) 의 틀린 파일명 전제(`ws-keys.json` 단일 → 3-파일) 정정. **Module versions**: Constellation v2.4.10 → **v2.4.11** (patch — runtime 보안 하드닝, **기본 동작 wire 무변경**: board=loopback 전제는 기존 dogfood 와 동일), plugin v0.3.10 → v0.3.11. Other modules unchanged (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire break** — bind 기본값 변경(노출은 opt-in) + 프레임 상한 가드 + 자격증명 위생. **Files**: server.cjs + ws-core.cjs (inner + outer self-board 양쪽) + .gitignore + server-keys.eux + Constellation.md(§2 secure-by-default note + frontmatter v2.4.11 codicil) + N-way sync. **점검 리포트**: 전체 발견(보안 P0~P3 + 가지치기 + 보완 축)은 outer `/reports/2026-06-10-eg-full-audit.md`. 가지치기류·마이너범프 이상은 별도 검토 후 진행.

Previously: v2.5.70 (2026-06-08) — **Constellation v2.4.10 A2A PR System §13.22 distill + deadlock 서버 자동화 opt-in** — 두 normative 보강: **(1) §13.22 A2A PR System 정식 스펙화** — 기존 line 740 의 dangling §13.22 참조를 RRP 설계문서(`constellation/reference/docs/2026-06-01-a2a-pr-system-rrp.md`)에서 §13.19 수준 정식 normative 섹션으로 distill: **two-level abstraction**(Level 1 = A2A-only virtual PR — provider 없이 동작; Level 2 = Github PR provider-mediated) + **5 wire vocabulary**(`PRRequest`/`PRDraftReady`/`PRReviewAck`/`PRMergeRequest`·`PRMergeAck`/`PRStatusUpdate` + `sourceContentRef.kind` enum + 미인식 kind fail-safe reject) + **topology b**(local-bridge command 경유 — 에이전트가 직접 git 미접근) + **approval discipline**(trusted-mirror auto / standard opt-in 기본 / emergency) + **β′ mirror-branch-on-target** sourcing + **per-repo authority**(strict: role==main 만 merge gate) + **5-state lifecycle** state machine + §13.13(at-least-once)/§13.19(deadlock)/§13.20 composition. EG 는 프로토콜 스펙만 ship — PR-bot reference impl 은 adopter-side. **(2) §13.19.10 Q3 deadlock 서버 detector opt-in reference impl** — board-adapter strict 2-cycle detector 를 `runtime/server.cjs` 에 `WS_DEADLOCK_DETECT` env-gated(**기본 OFF**)로 추가: 활성 시 reply-pairing(`_a2aPending`)으로 wait-edge 근사 → 양측 threshold(`WS_DEADLOCK_PROBE_MS` 기본 120s) 초과 strict 2-cycle 시 `DeadlockProbe` board emit(중복 억제 `_deadlockSeen` + 해소 시 자동 clear). 기본 OFF 로 서버↔application 결합 미강제 — **canonical 검출은 여전히 에이전트측 turn-start wait-edge DFS(§13.19.3)**, quasi-deadlock 은 에이전트측 SLA 규율(§13.19.4). **Module versions**: Constellation v2.4.9 → **v2.4.10** (patch — spec distill + 서버 opt-in detector, **기본 동작 wire 무변경**), plugin v0.3.9 → v0.3.10. Other modules unchanged (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire break** — §13.22 는 신규 옵트인 vocabulary, deadlock detector 는 기본 OFF env-gated. **Files**: Constellation.md (§13.22 신규 섹션 + §13.19.10 Q3 opt-in 단락 + frontmatter v2.4.10 codicil) + runtime/server.cjs (deadlock detector, inner + outer self-board 양쪽) + N-way sync.

Previously: v2.5.69 (2026-06-08) — **Constellation v2.4.9 dashboard A2A 대화 카드 통일 + 인라인 re>summary 우선** — A2A 대화 timeline 에서 일부 메시지만 카드(아이콘+요약+펼침)로, 일부는 plain text row 로 흘러 불일치하던 것을 통일: **(1) 카드 미표시 항목 카드화** — 코디네이션 메시지 `Delegate`·`WorkerReport`·`WorkerAck`·`OnboardAck`·`AgentHello` + 미분류 객체-value `CUSTOM` 을 a2acard 로 (`WS_A2A_INTENT` 에 5종 추가 + 전용 text/user/ok 핸들러 제거해 카드 분기로 fall-through + generic else 객체값 → 카드). 단 `UserPrompt`(실제 대화, 마크다운 렌더)·`Command`/`Cancel`(제어)·`Ack`/`AckProcessed`/`Ping`/`Pong`(§13.13 alarm-fatigue dim 게이팅)·status 는 row 유지. **(2) 인라인 간략 표시 re > summary 우선** — 신규 카드 spec 의 `sum` + generic fallback `sum` 을 `re` 가 `summary` 보다 앞서도록 (`['re', ..., 'summary', ...]`); 기존 `Delegate` inline 이 summary 우선이던 것도 re 우선. **Module versions**: Constellation v2.4.8 → **v2.4.9** (patch — dashboard render only, wire 무변경), plugin v0.3.8 → v0.3.9. Other modules unchanged. Seed-tier v2.4.3 unchanged. **No protocol wire change** — dashboard render 표현만. **Files**: constellation/reference/dashboard/app.js (+ outer self-board 동기) + N-way sync.

Previously: v2.5.68 (2026-06-08) — **Constellation v2.4.8 dashboard EstreUF-parity 5-gap 이식** — 상류 원본(EstreUF) dashboard 와 전수 비교(3-agent 병렬)로 식별한 EstreUF-only 동작 5건 이식 (EG 는 대부분 동등/우위 — wsConfirm 다이얼로그·키관리 진화·anchor 위치·설정 모달 등; 이 5건이 갭): **(1) 검토사안 0개 뱃지 숨김** — `renderDecisions` 가 `_decBadge.hidden = (count===0)` 토글 (기존엔 textContent 만 갱신 + `#decisions-badge[hidden]` CSS 가 dead code 라 빨간 "0" pill 상시 노출). **(2) 메시지 발신-시각 보존** — `wsMsgEpoch`(m.timestamp → m.at ISO → null) + `wsRowTime` 으로 onWsEvent 최상단 `_t`/`_ts` 도출 → 모든 row push(status·user·TEXT·tool·attach·a2acard·selection) 통일. 기존엔 `row.ts=Date.now()` + 일부 `nowHM()` 이라 **새로고침·History replay 후 날짜변경선이 전부 "오늘"로 붕괴 + 그룹병합 정렬이 수신순서**였음 → 원본 발신 시각으로 고정. **(3) 닫은 세션 영구삭제 크로스보드 동기 + persist** — server 에 `DeleteChannelHistory` 핸들러 추가(`wsCloseChannelHist`+`wsToBoards`, CloseChannel 패턴 미러), client 에 inbound `DeleteChannelHistory`/`HistoryCleared` 핸들러. 기존엔 server 가 `DeleteChannelHistory` 미처리라 **🗑 삭제가 persist 안 돼 새로고침 시 부활 + 다중 브라우저 미동기**였음. **(4) `SelectionResolved` 라우팅-무관 조기 처리** — agent-outbound agentId 가드 앞에서 처리 (agentId 없는 서버 직접 reply 도 chip dim, 방어 커버리지). **(5) 그룹 선택 시 멤버 탭 이름 4-role 색상 틴트** — `grpSel` 로 `.nm` 에 그룹 cls 부여 + `.ws-tab .nm.{up,main,local,collab}` CSS (기존 2-role 상시색 → 선택 시 4-role 틴트). **Module versions**: Constellation v2.4.7 → **v2.4.8** (patch — dashboard parity + server `DeleteChannelHistory` 핸들러, wire 무변경: 기존 client→server 메시지의 server-side 처리 + board broadcast 추가), plugin v0.3.7 → v0.3.8. Other modules unchanged (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire break** — dashboard render + 기존 메시지 server 처리 보강. **Files**: constellation/reference/dashboard/app.js + style.css + runtime/server.cjs (+ outer self-board 양쪽 동기) + N-way sync.

Previously: v2.5.67 (2026-06-07) — **Constellation v2.4.7 단일 워크스페이스 멀티에이전트 session-aware routing (register-all + fail-safe) + dashboard 발급 버그 fix** — 같은 워크스페이스에 여러 Claude Code 세션(main + local worker 등)이 열리면 동일 Stop hook(`pre-send-probe --rearm`)을 공유 실행 → 동일 A2A cursor 경쟁(worker turn-end 가 main 의 surfacing cursor 를 먼저 advance → main 이 inbound 를 못 봄). 별도 워크스페이스 분리(IDE 창마다 확장 중복 로딩 + 하네스/문서 맥락 단절 비용)를 피하면서 **per-session env `CLAUDE_CODE_SESSION_ID`**(Claude Code 가 hook 프로세스에 주입 — `src=env` 확인)로 분기. **register-all 모델**: 모든 세션이 자기 소유 inbox 를 `<cwd>/.agent-sessions.json` 레지스트리에 선언, 각 hook 실행은 SELF 소유 inbox 만 처리 — (a) 미등록/식별불가 세션 → SKIP-ALL(fail-safe: cursor 미advance, 타 세션 surface 절대 비침범), (b) 타 세션 소유 inbox → skip, (c) 자기 소유 → 정상 처리. 신규 [register-session.cjs](constellation/reference/runtime/stop-hook/register-session.cjs)(세션 `{role, ownInboxes}` 등록/해제) + [pre-send-probe.cjs](constellation/reference/runtime/stop-hook/pre-send-probe.cjs) routing 블록 + [join-local.cjs](constellation/reference/runtime/scripts/join-local.cjs) v2.4.7(local 워커 OUTBOX drain = 워커 세션 append→송신 emit 경로 + full inbound 로깅으로 Delegate value 본문 read) + [server.cjs](constellation/reference/runtime/server.cjs) WS_PRIMARY_AGENT 미설정 startup 경고(미설정 시 메인 세션이 local 로 강등). **A2A inbox 저지연 수신 2층 기상**: 1차 = ≤5초 폴링 file Monitor(이벤트 즉시 기상), 2차 = ScheduleWakeup 긴 fallback heartbeat — ScheduleWakeup cadence(분 단위) 단독 의존 시 수신이 그만큼 지연. **dashboard 발급 버그 fix(Cut A 번들)**: `.ws-collab-*` cursor:move leak 차단(`.ws-pop-head` 의 cursor:move 가 발급 패널까지 상속) + (private self-board) KEY-MGMT 응답 핸들러 5종 drift fix(키 발급이 "발급 중…"에서 멈추던 근본원인). **라이브 검증**: local worker(board-observer) 왕복 라운드 — Delegate→WorkerAck/WorkerReport, main cursor 비충돌 직접 증명(worker 의 여러 turn-end 가 collab-self inbox 를 SKIP → main cursor 유지) + main 자동 수신(≤3초 file Monitor, 무nudge). **Module versions**: Constellation v2.4.6 → **v2.4.7**(patch — register-all routing + dashboard fix, wire 무변경), plugin v0.3.6 → v0.3.7. Other modules unchanged(Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire change** — runtime + Stop hook + dashboard render only. **다중 adopter 혜택**: 단일 워크스페이스 멀티세션 패턴은 Claude Code adopter 전반 generic — register-all routing + ≤5초 Monitor 2층 기상이 공개 reference 로 ship.

Previously: v2.5.66 (2026-06-07) — **Constellation v2.4.6 dashboard A2A 대화 UI 확충 patch** — 7 additive surfaces ported from sibling private dashboard reference: (1) sticky popup header `.ws-pop-h` (스크롤 시 제목줄/드래그/✕ 가림 방지 + 첫 row border-top 제거); (2) 날짜변경선 `.ws-dateline` (sticky top:0, ko-KR long form + 오늘/어제 라벨, wsRenderRow + wsRenderActiveStream 양 분기 삽입); (3) A2A-intent CUSTOM 카드 — `WS_A2A_INTENT` 18 intent dict (Report·BlockerManifest·BlockerNudge·ReviewSLAAck·PR* 7종·Deadlock/Preempt 3종·Mediation 2종·Escalation 2종 — 각 `{icon, label, sum[]}`) + `wsA2aSummary` (sum 키 순서대로 첫 비어있지 않은 string/number) + `wsA2aCardEl` (아이콘 + label + summary + body details key/value + 첨부 + 펼침 ◀ 토글) + `wsExtractA2aReport` (§13.16.12 Pattern 7 fallback — TEXT_MESSAGE.text 안 코드블록 JSON 을 envelope 로 승격, structured CUSTOM wrapper `{type:"CUSTOM",name:"Report"}` + `{type:"Report"}` 양쪽 잡음); (4) 첨부 칩 + 미리보기 모달 — `wsAttachments` (value.attachments[]/atts/files/attachment/zip/file 추출) + `wsAttIcon` (mime별 이모지) + `wsAttChipEl` (icon + filename + size + sha256 title + 👁 미리보기 + ⬇ 다운로드) + `wsAttPreview` (이미지/텍스트 모달, fetch + 40KB 절단). A2A 카드 + 일반 row 양쪽 적용; (5) SelectionPrompt chip 카드 (#406 UI6) — `wsSelectionCardEl` (issued/answered/cancelled 3-state + multiSelect picked + chosen 강조 + allowFreeText 입력 + 답/취소 버튼) + `wsAnswerSelection`/`wsCancelSelection` (board→server SelectionAnswer/SelectionCancel emit via wsSendOrch) + `wsRefreshSelectionCard` (in-place 재렌더) + `wsResolveSelection` (SelectionResolved broadcast 시 모든 같은 promptId 카드 dim); (6) 닫은 세션 삭제 UI3 + 연결상태 dot — `.ws-arch-item` flex 분리 + `.ws-arch-dot` (green=연결 / gray=끊김) + 🗑 개별 삭제 (`wsDeleteChannel` + DeleteChannelHistory CUSTOM emit + wsConfirm 확인) + 🗑 전체 삭제 (`wsDeleteAllChannels` + wsConfirm 확인); (7) self-attestation confirm/prompt 자체 다이얼로그 — `wsConfirm`(message, opts) / `wsPrompt`(message, initial, opts) Promise 헬퍼 (browser confirm/prompt 의존 제거 — IDE webview 환경 호환 + Escape/Enter 키 + danger 변형). 기존 revoke/relabel 도 async + wsConfirm/wsPrompt 사용으로 일원화. **Files modified** (4): [Constellation.md](Constellation.md) (frontmatter v2.4.5 → v2.4.6 + v2.4.6 codicil); [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) (v0.3.5 → v0.3.6); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js) (+357 lines: WS_A2A_INTENT 18 dict + 4 a2a helpers + 4 att helpers + 5 sel helpers + wsConfirm/wsPrompt + wsDeleteChannel/wsDeleteAllChannels + dateline 3 helpers + wsRenderRow/wsRenderActiveStream dateline 삽입 + wsRowEl a2acard/selection 분기 + onWsEvent SelectionPrompt/SelectionResolved/A2A-intent 분기 + TEXT_MESSAGE Pattern 7 승격 + wsRenderArchived dot/del/all 확장 + revoke/relabel async); [constellation/reference/dashboard/style.css](constellation/reference/dashboard/style.css) (+106 lines: .ws-pop-h sticky + 첫 row border-top 제거 + .ws-dateline + .ws-a2a* 11 클래스 + .ws-att* 14 클래스 (포함 .ws-att-modal) + .ws-sel* 16 클래스 + .ws-arch-dot + .ws-arch-lbl/.ws-arch-del/.ws-arch-all/.ws-arch-allbtn + .ws-confirm-modal* 7 클래스 + #decisions-badge[hidden]); [README.md](README.md) (badge + Current EN+KO); [docs/index.html](docs/index.html) (hero badge v2.5.65 → v2.5.66 + Constellation card module-tag v2.4.5 → v2.4.6); [docs/shared/data.js](docs/shared/data.js) (v2.5.65 → v2.5.66 + shipCount 81 → 82); [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) (metadata 0.3.11 → 0.3.12 + constellation v0.3.5 → v0.3.6 + descriptions); CHANGELOG. **Module versions**: Constellation v2.4.5 → **v2.4.6** (patch bump, additive UI feature add — render policy 확장만, wire 변경 없음), plugin v0.3.5 → v0.3.6. Other modules unchanged (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire change** — dashboard render only. **Self-application dogfood**: outer self-board (port 27878) sandbox 양쪽 동기 — 사용자 UI 시각 확인 → inner reference 역류 (v2.5.56/58/60/64 패턴 재사용).

Previously: v2.5.65 (2026-06-07) — **Constellation v2.4.5 incident hardening patch** — 2026-06-07 incident (duplicate same-agentId collab-client → server close(1005) + backoff reconnect loop → AgentHello flood + inbox.log 2.5GB runaway → Stop hook fs.readFileSync surface flood → API Usage Policy block) 후속 4-layer 안전장치: (a) new [constellation/reference/runtime/single-instance.cjs](constellation/reference/runtime/single-instance.cjs) helper (deps-0, agentId-scoped PID lock + alive check + stale auto-cleanup, reject-new policy with `console.error` + `process.exit(2)`); (b) helper applied to [gateway/main/ws-agent-client.cjs](constellation/reference/gateway/main/ws-agent-client.cjs) (lock: `.ws-agent-client.<agentId>.pid` at cwd) + [runtime/scripts/join-local.cjs](constellation/reference/runtime/scripts/join-local.cjs) (lock: `runtime/.join-local.<agentId>.pid`) + [runtime/watchdog.cjs](constellation/reference/runtime/watchdog.cjs) (lock: `runtime/.watchdog.<port>.pid`); [runtime/local-bridge.cjs](constellation/reference/runtime/local-bridge.cjs) retains its 2026-05-30 inline takeover guard (different policy for orphan-recovery context); (c) [runtime/stop-hook/pre-send-probe.cjs](constellation/reference/runtime/stop-hook/pre-send-probe.cjs) runaway protection — `PROBE_RUNAWAY_BYTES` env (32 MiB default) triggers streaming `countLinesStream` + auto cursor tail-advance + skip surface + alarm (`MAX_MEANINGFUL_SURFACE=50` cap with truncation summary for surface flood prevention); (d) new [runtime/scripts/runaway-recover.cjs](constellation/reference/runtime/scripts/runaway-recover.cjs) (deps-0 readline streaming) — extracts §13.16.9 allowlist-matched inbound from runaway backup → cleaned file + stats (incident validation: 2.5GB → 652KB / 341 meaningful lines, drops self-emission echoes + transport-only events). Light patch, no protocol wire change. **Files modified** (8): [Constellation.md](Constellation.md) (frontmatter v2.4.4 → v2.4.5 + v2.4.5 codicil); [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) (v0.3.4 → v0.3.5); [constellation/reference/runtime/single-instance.cjs](constellation/reference/runtime/single-instance.cjs) NEW (~50 lines); [constellation/reference/runtime/scripts/runaway-recover.cjs](constellation/reference/runtime/scripts/runaway-recover.cjs) NEW (~125 lines); [constellation/reference/runtime/stop-hook/pre-send-probe.cjs](constellation/reference/runtime/stop-hook/pre-send-probe.cjs) (+30 lines); [constellation/reference/runtime/watchdog.cjs](constellation/reference/runtime/watchdog.cjs) + [constellation/reference/runtime/scripts/join-local.cjs](constellation/reference/runtime/scripts/join-local.cjs) + [constellation/reference/gateway/main/ws-agent-client.cjs](constellation/reference/gateway/main/ws-agent-client.cjs) (guard import + acquire call); [.gitignore](.gitignore) (`.*.pid` patterns); [README.md](README.md) (badge + Current EN+KO); [docs/index.html](docs/index.html) (hero badge v2.5.64 → v2.5.65 + Constellation card module-tag v2.4.4 → v2.4.5); [docs/shared/data.js](docs/shared/data.js) (v2.5.64 → v2.5.65 + shipCount 80 → 81); [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) (metadata 0.3.10 → 0.3.11 + constellation v0.3.4 → v0.3.5 + descriptions); CHANGELOG. **Module versions**: Constellation v2.4.4 → **v2.4.5** (patch bump, back-compat hardening — guards are reject-new on duplicate, normal single-instance unaffected), plugin v0.3.4 → v0.3.5. Other modules unchanged (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire change** — runtime + Stop hook + recovery tool. **Multi-adopter benefit**: same incident pattern (duplicate-agentId reconnect loop → runaway inbox) is generic across Constellation adopters; public release surfaces the guard for Hermes / future adopters.

Previously: v2.5.64 (2026-06-07) — **Constellation v2.4.4 dashboard UI augment patch** — 4 corner-anchored position presets (`.ws-pop.pos-{tl,tr,bl,br}` 4 anchors stored in `constellation-ws-position` localStorage; drag/resize end normalized to active anchor's edge-distance via `wsRectToAnchorPos`; legacy `WS_UI.pos` left/top absolute auto-migrated; default 'br') + settings modal ⚙ in popup head (📂 right side) with 4 preset cards + anchor-behavior description + fab right-click context menu (center / key-issue / key-manage / settings — `wsKeyMgmt.openIssuePanel` newly exposed) + `.ws-fab` z-index 60→58 (popup covers fab) + arch-empty placeholder ("닫은 세션이 없어요") + folder emoji 🗂→📂 + header spacing compression (`.ws-conn` margin-bottom 12→8 + `.ws-h` margin 4/7→0/0). Light reference parity cut, no protocol wire change. User-direct intent (2026-06-07): "창 배치 기준" option — keep selected corner distance on viewport/popup resize + user drag also normalized to anchor + auto-migration of existing coords + arch placeholder + folder emoji + popup head spacing. **Files modified** (10): [Constellation.md](Constellation.md) (frontmatter v2.4.3 → v2.4.4 + v2.4.4 codicil); [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) (v0.3.3 → v0.3.4); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js) (+229 lines net: wsCurrentAnchor + wsRectToAnchorPos + wsApplyAnchorPos + wsLoadPositionPref + wsApplyPosition + setupWsSettings + setupWsContextMenu + wsKeyMgmt.openIssuePanel + drag/resize anchor normalization + wsLoadUI legacy migration + wsRenderArchived empty placeholder + 🗂→📂); [constellation/reference/dashboard/style.css](constellation/reference/dashboard/style.css) (+34 lines: 4 pos classes + ws-settings-modal/body + .ws-set-desc/.ws-set-hint + .ws-pos-grid/.ws-pos-card + .ws-fab-ctx/.ws-fab-ctx-item + .ws-arch-empty + .ws-fab z-index 60→58 + .ws-conn / .ws-h spacing); [constellation/reference/dashboard/index.html](constellation/reference/dashboard/index.html) (#ws-settings-btn ⚙ + 🗂→📂); [README.md](README.md) (badge + Current EN+KO); [docs/index.html](docs/index.html) (hero badge v2.5.63 → v2.5.64 + Constellation card module-tag v2.4.2 → v2.4.4); [docs/shared/data.js](docs/shared/data.js) (v2.5.63 → v2.5.64 + shipCount 79 → 80); [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) (metadata 0.3.9 → 0.3.10 + constellation v0.3.3 → v0.3.4 + descriptions); CHANGELOG. **Module versions**: Constellation v2.4.3 → **v2.4.4** (patch bump, additive UI augment), plugin v0.3.3 → v0.3.4. Other modules unchanged (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire change** — dashboard only. **Self-application dogfood**: self-board (port 27878) sandbox 에서 사용자 UI 피드백 + 즉시 적용 → inner reference 역류 (v2.5.56/58/60 패턴 재사용).

Previously: v2.5.63 (2026-06-06) — **Ultrasafe v0.2.0 runtime activation cut + Constellation v2.4.3 §13.16.13 5 신규 A2A intent 통합** (substantive — 가장 큰 cut). Workflow `wjdacz798` 3-phase 12-agent fan-out (Phase 1 spec → Phase 2 11 parallel: 8 attacker skills + 2 hooks + MCP server → Phase 3 Constellation §13.16 5 intent + plugin manifest + marketplace 통합 · 1192s wall-clock · 766k subagent tokens · 159 tool uses · 18 files modified, ~4700 new lines). User-direct intent (2026-06-06): "순서대로 진행" + "ultrasafe 넘어가면 양쪽 동시 진행" (hub 측 7 outbound batch proposal m-eg-outbound-7-batch-1780750000000 fire-and-forget 동반). **v0.2.0 runtime layer**: (1) [Ultrasafe.md](Ultrasafe.md) (+978 lines, 2544 → 3522): §14 Runtime Architecture + §15 8-Agent Fan-Out Detail + §16 MCP Server Tools (5) + §17 Hooks Spec (PreToolUse + Stop) + §18 Constellation 통합 (5 신규 intent runtime wire) + §19 Advisory vs Blocking Mode + Revision History v0.2.0. (2) **8 attacker SKILL.md** (총 ~2885 lines): [ultrasafe-ai-llm-redteam](plugins/ultrasafe/skills/ultrasafe-ai-llm-redteam/SKILL.md) (367 lines — prompt injection / model extraction / jailbreak / hallucination-leverage) + [ultrasafe-web-api-attacker](plugins/ultrasafe/skills/ultrasafe-web-api-attacker/SKILL.md) (417 lines — OWASP Top 10 + MITRE ATT&CK dual-taxonomy) + [ultrasafe-supply-chain-auditor](plugins/ultrasafe/skills/ultrasafe-supply-chain-auditor/SKILL.md) (283 lines — SCS 5-way attacker probe matrix) + [ultrasafe-crypto-reviewer](plugins/ultrasafe/skills/ultrasafe-crypto-reviewer/SKILL.md) (379 lines — C1-C15 crypto pattern catalog) + [ultrasafe-social-engineer](plugins/ultrasafe/skills/ultrasafe-social-engineer/SKILL.md) (378 lines — Stackelberg follower discipline + 4 sub-domains) + [ultrasafe-methodology-compliance](plugins/ultrasafe/skills/ultrasafe-methodology-compliance/SKILL.md) (287 lines) + [ultrasafe-threat-model-lifecycle](plugins/ultrasafe/skills/ultrasafe-threat-model-lifecycle/SKILL.md) (294 lines — STRIDE/PASTA) + [ultrasafe-synthesizer](plugins/ultrasafe/skills/ultrasafe-synthesizer/SKILL.md) (460 lines — cross-axis dedup + severity rank + 3-layer report). (3) **2 hooks**: [ultrasafe-trigger.cjs](plugins/ultrasafe/hooks/ultrasafe-trigger.cjs) (327 lines — PreToolUse, 7 publish-equivalent matchers, emits ULTRASAFE_RELEASE_GATE advisory) + [ultrasafe-clean-signal.cjs](plugins/ultrasafe/hooks/ultrasafe-clean-signal.cjs) (339 lines — Stop, 4-condition AND-gate evaluation, emits ULTRASAFE_ITERATION_BOUNDARY) + hooks.json registration. (4) **MCP server** [server.cjs](plugins/ultrasafe/mcp/server.cjs) (759 lines, 5 tools): `ultrasafe_run_fanout` + `ultrasafe_finding_aggregate` + `ultrasafe_clean_signal_check` + `ultrasafe_report_generate` + `ultrasafe_release_gate` (각 input/output JSON Schema + ajv validation + advisory mode marking 강제). (5) **Constellation v2.4.3 통합** (+90 lines): §13.16.13 wire-spec 신규 sub-section + §13.16.9 A2A-intent allowlist 5 신규 추가 (ULTRASAFE_FINDING / ULTRASAFE_ITERATION_BOUNDARY / ULTRASAFE_RELEASE_GATE / SECURITY_DISCLOSURE_INTAKE / MPCVD_COORDINATION) + 4-group classification table A2A-intent row + dual-mode advisory/blocking ack_tier mapping + cross-module wires (Hyperbrief paired DECISION_REQUEST on severity ≥ high + Greatpractice candidate flow for ratified findings + Superscalar retire-barrier composition at iteration boundaries). Additive minor — wire compatible with v2.4.2 (v0.3.2) adopters. **v0.2.x advisory invariant**: 모든 출력 (skill recommendations / hook emissions / MCP tool returns) 이 `advisory: true` flag — **NEVER block publish in v0.2.x**. Blocking mode (v0.3+) 는 paired Hyperbrief DECISION_REQUEST 통해 user gate 도입. **Files modified** (5 modified + 13 new = 18 files): [Ultrasafe.md](Ultrasafe.md), [Constellation.md](Constellation.md) (frontmatter v2.4.2 → v2.4.3 + §13.16.13 wire-spec + §13.16.9 allowlist), [plugins/ultrasafe/.claude-plugin/plugin.json](plugins/ultrasafe/.claude-plugin/plugin.json) (v0.1.0 → v0.2.0 + 본격 description + skills/hooks/mcp registration), [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) (v0.3.2 → v0.3.3 + Ultrasafe intent integration), [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) (metadata 0.3.8 → 0.3.9 + ultrasafe v0.1.0 → v0.2.0 + constellation v0.3.2 → v0.3.3 + descriptions); 13 신규: 8 SKILL.md + 2 hooks + hooks.json + mcp/server.cjs + mcp/package.json; [README.md](README.md), [docs/index.html](docs/index.html) (hero badge v2.5.62 → v2.5.63 + Ultrasafe card MODULE v0.1.0 → v0.2.0 + Ultrasafe v0.2.0 runtime badge), [docs/ultrasafe.html](docs/ultrasafe.html) (badges v0.1.0 → v0.2.0 + 신규 runtime badge), [docs/shared/data.js](docs/shared/data.js) (v2.5.62 → v2.5.63 + shipCount 78 → 79), [CHANGELOG.md](CHANGELOG.md). **Module versions**: Ultrasafe v0.1.0 → **v0.2.0** (minor bump, substantive runtime activation, advisory mode, back-compat preserved — v0.1.0 spec semantics 유지), plugin v0.1.0 → v0.2.0. Constellation v2.4.2 → **v2.4.3** (additive minor, Ultrasafe intent allowlist), plugin v0.3.2 → v0.3.3. Other modules unchanged (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0). Seed-tier v2.4.3 unchanged. **No protocol wire break** — 5 intent additive to allowlist, back-compat for non-Ultrasafe adopters. **Multi-agent orchestration dogfood 연속 3회** (mezzo batch → Hyperbrief v0.6 → Ultrasafe v0.2): pattern reuse 효과 누적 입증.

Previously: v2.5.62 (2026-06-06) — Hyperbrief v0.6.0 substantive 4-slot additive cut — `evaluation_lenses[]` (§0) + `recommended_methodology[]` (§8) + `maturity_anchor` (FullBrief top-level) + `term_pairing` (audience_profile_fallback 확장).** Workflow `w7hpkq8rk` 3-phase 9-agent fan-out (Phase 1 schema → Phase 2 7 parallel: renderer + 4 templates + 3 skills → Phase 3 spec + triage close, 718s wall-clock, 524k subagent tokens, +1188/-53 lines across 11 files). User-direct intent (2026-06-06): "순서대로 진행" + Workflow 다중 fan-out (mezzo batch pattern reuse). **4 슬롯 사양**: (a) `evaluation_lenses[]` — multi-lens scoring (id + dimensions + threshold + current + verdict + optional methodology_ref) for same decision (canonical: Hyperbrief.md §11.5 Lens A module GA vs Lens B host-marketplace). (b) `recommended_methodology[]` — meta-decision methodology references (id + name + version + anchor_path + applicability + rationale_one_line) — §11.5 readiness rubric 가 첫 self-application 사례. (c) `maturity_anchor` — arbitrary maturity labels (v1.0 / GA / production-ready / stable) MUST anchor measurement methodology via `anchor_methodology` ref → `recommended_methodology[].id`; current_score + threshold + gap_analysis + optional verdict (meets/near/short). (d) `term_pairing` — 4번째 tone axis: mode E/I/N (every/initial/none) + scope C/D/B/R (conversation/document/board/review) + retroactive_apply Y/N/prompt + I-mode low-frequency override (단위 안 총 빈도 ≤3 → forces every-pairing) + C-scope auto-non-retroactive (대화 범위 구조적으로 prompt 미발화) + short-command form Lx.M.S[+S][!|?]. Renderer (mini-engine.cjs +402 lines) implements 4 slot renderers (MD + HTML) + buildV06Sections composer + applyTermPairing post-processor (minimal default dictionary IR/ADR/GA/MCDA/RAPID/MCP + dictionary_inline override). **Back-compat**: 모든 4 슬롯 optional; 기존 v0.5.6 IR 가 v0.6 schema valid + 4 슬롯 빈 출력 (conditional rendering). **Smoke test**: legacy IR (no v0.6 slots) → 정상 render + determinism OK; v0.6 full IR (all 4 slots) → §v0.6 Extensions block 정상 + determinism OK. **Files modified** (16): [Hyperbrief.md](Hyperbrief.md) (frontmatter v0.5.6 → v0.6.0 + §3 §0 table + §4 §8 + §11.5 self-application + revision history); [plugins/hyperbrief/.claude-plugin/plugin.json](plugins/hyperbrief/.claude-plugin/plugin.json) (v0.5.6 → v0.6.0 + description); [plugins/hyperbrief/renderers/package.json](plugins/hyperbrief/renderers/package.json) (v0.5.6 → v0.6.0); [plugins/hyperbrief/mcp/package.json](plugins/hyperbrief/mcp/package.json) (v0.5.6 → v0.6.0); [plugins/hyperbrief/schema/hyperbrief.schema.json](plugins/hyperbrief/schema/hyperbrief.schema.json) (+165 lines, 4 slot definitions); [plugins/hyperbrief/renderers/mini-engine.cjs](plugins/hyperbrief/renderers/mini-engine.cjs) (+402 lines); [plugins/hyperbrief/templates/{brief,brief-stub}.{md,html}.template](plugins/hyperbrief/templates/) (4 files +329 lines total); [plugins/hyperbrief/skills/{hyperbrief,hyperbrief-trigger-check,hyperbrief-revisit}/SKILL.md](plugins/hyperbrief/skills/) (3 files +208 lines); [_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md](_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md) (close 4 candidates: #1, #2, #3, #7; v0.7+ pending: #4, #5, #6); [README.md](README.md); [docs/index.html](docs/index.html); [docs/hyperbrief.html](docs/hyperbrief.html); [docs/shared/data.js](docs/shared/data.js) (v2.5.61 → v2.5.62 + shipCount 77 → 78); [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) (metadata 0.3.7 → 0.3.8 + hyperbrief plugin v0.5.6 → v0.6.0); CHANGELOG. **Module versions**: Hyperbrief v0.5.6 → **v0.6.0** (minor bump — substantive 4-slot additive cut, back-compat preserved), plugin v0.5.6 → v0.6.0. Other modules unchanged (Constellation v2.4.2 · Superscalar v0.4.2 · Greatpractice v0.2.0 · Ultrasafe v0.1.0). Seed-tier v2.4.3 unchanged. **No protocol wire change** — schema entries 추가만, validator (ajv) + renderer + skills 호환. Multi-agent orchestration dogfood (2nd consecutive): mezzo batch pattern reuse with phase-staged fan-out (1 schema → 7 parallel apply → 1 spec sync).

Previously: v2.5.61 (2026-06-06) — Greatpractice v0.2.0 mezzo 8-batch ratification — release-cadence.md (macro) children decomposition pattern first batch demonstration.** Workflow `wk5a6jh5k` 병렬 fan-out (8 agents · 147s · 357k tokens) 로 8 mezzo entries 한꺼번에 작성 + ratify: [n-way-sync-registry](greatpractice/mezzo/n-way-sync-registry.md) (24/25 · 3 micro candidates) + [package-files-validate](greatpractice/mezzo/package-files-validate.md) (22/25 · 2 micro · conditional public-distribution) + [bin-entry-validate](greatpractice/mezzo/bin-entry-validate.md) (19/25 · 2 micro · conditional) + [link-integrity-check](greatpractice/mezzo/link-integrity-check.md) (19/25 · 2 micro · conditional) + [dry-run-smoke-test](greatpractice/mezzo/dry-run-smoke-test.md) (21/25 · 2 micro · conditional) + [pre-publish-user-gate](greatpractice/mezzo/pre-publish-user-gate.md) (24/25 · 3 micro · **phronesis_boundary=true** — autonomy boundary mechanism) + [naming-hygiene-grep](greatpractice/mezzo/naming-hygiene-grep.md) (19/25 · 2 micro · conditional) + [auth-2fa-discipline](greatpractice/mezzo/auth-2fa-discipline.md) (17/25 · 2 micro · conditional · notability-gate backing for sub-threshold maturation). Total ~1850 lines added (8 frontmatter ~720 + 8 body ~1130). Structure: v0.1.0 (1 macro + 1 mezzo) → **v0.2.0 (1 macro + 9 mezzo)**. Module: Greatpractice v0.1.0 → **v0.2.0** (minor bump — children decomposition pattern demonstration), plugin v0.1.0 → v0.2.0, marketplace metadata 0.3.6 → 0.3.7. Other modules unchanged (Constellation v2.4.2 · Superscalar v0.4.2 · Hyperbrief v0.5.6 · Ultrasafe v0.1.0). Seed-tier v2.4.3 unchanged. No protocol wire change — spec extension. Children list activation in `greatpractice/macro/release-cadence.md` (frontmatter `children:` 8 entries enabled, `_ratified_state.acknowledged_risk` 항목 v2.5.61 ratification 갱신). Per `feedback_release_versioning_cadence.md` — substantive ratification cut (8 entries decomposition pattern demonstration). Per `feedback_a2a_routing_by_direction.md` — 본 ship 통보 (EG-initiated proactive) 는 hub board (7878) outbox 로 push.

Previously: v2.5.60 (2026-06-06) — Constellation v2.4.2 dashboard UI 통합 patch — setupWsCollab 제거 + setupWsKeyMgmt 단일 통합 + UI5 모달 4 탭 + 이모지 통일 + 즉시 placeholder + 모달 폭 240→320**. Light reference parity cut, no protocol wire change. User-direct intent: 협업 (🔗) 별도 버튼이 setupWsKeyMgmt (현재 ⬆ 통합 모달) 와 중복 → 단일 통합 UI 로 정리 + 키 관리 창 4 탭 분리 + 이모지 시각 일관성. **Changes** (dashboard only): (a) **setupWsCollab 제거** — RegisterCollabKey transitional alias 응답 (`CollabKeyIssued`) 은 `wsKeyMgmt.setIssued({...,kind:'collab'})` 로 통합 forward (back-compat 보존). (b) **setupWsKeyMgmt 토글 🔑** (기존 ⬆ → 🔑) — 모든 kind 발행 단일 진입점. (c) **kind radio 순서** — ⬆ 업스트림 / 🏠 로컬워커 / 🔗 외부협업 + **기본값 local** + 선택 시 **라벨 input 자동 포커스** (`setTimeout(.focus())`). (d) **UI5 키 관리 모달 4 탭** — 전체 / ⬆ 업스트림 / 🏠 로컬워커 / 🔗 외부협업 + 활성 탭 필터링 + 각 행 이모지 발행 창과 동일 (⬆/🏠/🔗) + 모달 제목 **🔐** (기존 🗂). (e) **즉시 placeholder 렌더** — `openManager()` 가 `renderTable()` 호출 추가 (응답 대기 동안 빈 화면 방지). (f) **패널 폭 240→320** — kind 옵션 텍스트 한 줄 fit (`white-space: nowrap` + ellipsis fallback). **Files modified** (8): [Constellation.md](Constellation.md) (frontmatter version + v2.4.2 codicil); [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) (v0.3.1 → v0.3.2); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js); [constellation/reference/dashboard/style.css](constellation/reference/dashboard/style.css); [README.md](README.md) (badge + Current EN+KO); [docs/index.html](docs/index.html) (hero badge v2.5.59 → v2.5.60 + Constellation card module-tag v2.4.1 → v2.4.2); [docs/constellation.html](docs/constellation.html) (badges v2.4.1 → v2.4.2); [docs/shared/data.js](docs/shared/data.js) (v2.5.59 → v2.5.60 + shipCount 75 → 76); [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) (metadata 0.3.5 → 0.3.6 + constellation v0.3.1 → v0.3.2); CHANGELOG. **Module versions**: Constellation v2.4.1 → **v2.4.2** (patch bump, additive UI 통합), plugin v0.3.1 → v0.3.2. Other modules unchanged. Seed-tier v2.4.3 unchanged. **No protocol wire change** — server 측 변경 없음 (CollabKeyIssued 응답 그대로, dashboard 만 통합 처리). **Self-application dogfood**: v2.5.56-58 패턴 — self-board (port 27878) sandbox 에서 사용자 UI 피드백 + 즉시 적용 → inner reference 역류.

Previously: v2.5.59 (2026-06-06) — Promo docs 사용 가이드 통합 cut — 5 module pages + index.html marketplace/CLI-VS audience sections**. Light docs cut, no protocol wire change, no module version bump. Workflow `wd0bhh3qd` + agent `a9b100b0d32d15b64` outputs integrated. **6 docs/*.html files updated**: (1) [docs/constellation.html](docs/constellation.html) — 3 cards (Local Worker / External Collab / Upstream Peer) × (when + UI / Prompt / Transfer 3 sub-sections), v2.4.1 KEY-MGMT consistency (kind=local + 🏠 라디오 + roleDescription 발급 명시); (2) [docs/superscalar.html](docs/superscalar.html) — 5 cards (Codebase reconnaissance / Backend audit / Read-only fan-out / Multi-file disjoint edits / Refactoring shared contract); (3) [docs/hyperbrief.html](docs/hyperbrief.html) — 5 cards (Refactor module boundaries / Migrate DB infra / Onboard third-party API / Schema migration plan / Emergency hotfix); (4) [docs/greatpractice.html](docs/greatpractice.html) — 5 cards (Outbox JSON validation / SessionStart blocking / N-way sync drift / Procedure sequence / Phronesis boundary); (5) [docs/ultrasafe.html](docs/ultrasafe.html) — 4 cards (Patch release sweep / Major release attestation / Supply chain scan / Fix verification); (6) [docs/index.html](docs/index.html) — new `<section id="install">` (마켓플레이스 등록 + 5 플러그인 카드 + 설치 명령) + new `<section id="audience">` (CLI 이용자 vs Claude Code VS Code 확장 분기, 4 단계 각각). i18n compat: inline `<code>` 포함 항목은 `data-en-html` / `data-ko-html` variant 적용 (docs/shared/i18n.js innerHTML swap 호환). L1.1.1.I 톤 정렬 — 새 section 들에 `data-aud="general/dev/expert"` 분리 제거, 단일 톤 (general 청중) + `data-en` + `data-ko` 만 유지. **Module versions**: 모든 모듈 변경 없음 (Constellation v2.4.1, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0, Ultrasafe v0.1.0). Seed-tier v2.4.3 unchanged. No protocol wire change. **N-way sync**: README badge + Current EN+KO + docs/shared/data.js v2.5.58 → v2.5.59 + shipCount 74 → 75 + CHANGELOG EN+KO + 6 docs files.

Previously: v2.5.58 (2026-06-06) — Constellation v2.4.1 KEY-MGMT v0.3 extension — Local key (wire-private file-path/script-call) + roleDescription + kind dropdown UI. Substantive cut (additive, wire-compatible with v0.2). Substantive cut (additive, wire-compatible with v0.2). `KeyIssue.value` gains `kind: 'upstream'|'collab'|'local'` (default upstream, back-compat) + `roleDescription: string` (optional ≤256). **Local key (`lk-` prefix)** is wire-private: server stores key bytes to `local-keys/<label>.key` (atomic write+fsync), responds with `joinFile` + `joinScript: 'scripts/join-local.cjs'` + `joinHint` (한 줄 명령) — NOT the key. `/join/local?label=<label>` HTTP endpoint + `wsLocalOnboardMd` helper (label 만 받음, 키 URL 노출 0). `scripts/join-local.cjs` reference impl (env `LOCAL_KEY_FILE` 로 파일 읽음 → ws 합류). Dashboard UI4: kind radio (🔑 업스트림 / 🔗 협업 / 🏠 로컬) + roleDescription textarea + local 발급 시 명령 복사 버튼 (키 자체 안 보임). Dashboard UI5 modal: kind chip (🔑/🔗/🏠) + `🎭 roleDescription` chip per row. Onboarding md (collab/upstream/local 셋 다) 에 roleDescription 임베드. **Files modified** (12): [Constellation.md](Constellation.md) frontmatter v2.4.0 → v2.4.1; [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) v0.3.0 → v0.3.1; [constellation/reference/runtime/server.cjs](constellation/reference/runtime/server.cjs) (`wsIssueKey` `lk-` prefix + `keyValidateRoleDesc` + `keyValidateLabelSafe` + `wsKeyIssue` kind 분기 + `wsKeyList` roleDescription + `/join/local` + `wsLocalOnboardMd`); [constellation/reference/runtime/scripts/join-local.cjs](constellation/reference/runtime/scripts/join-local.cjs) (NEW ~55 줄 reference impl); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js) (kind radio + roleDescription textarea + local 분기 issued UI + modal kind chip + roleDescription chip); [constellation/reference/dashboard/style.css](constellation/reference/dashboard/style.css) (.ws-invite-kindrow/.ws-invite-kindopt/.ws-invite-roledesc/.ws-invite-roledesc-show/.ws-key-roledesc); [constellation/reference/WS-PROTOCOL-KEY-MGMT.md](constellation/reference/WS-PROTOCOL-KEY-MGMT.md) v0.2 → v0.3 IMPLEMENTED + §3.6 LocalKey + v0.3 changelog; README badge + Current EN+KO; docs/index.html hero badge v2.5.57 → v2.5.58 + Constellation card module-tag v2.4.0 → v2.4.1; docs/constellation.html badges; docs/shared/data.js v2.5.57 → v2.5.58 + shipCount 73 → 74; .claude-plugin/marketplace.json metadata 0.3.4 → 0.3.5 + constellation plugin v0.3.0 → v0.3.1; CHANGELOG. **Module versions**: Constellation v2.4.0 → **v2.4.1** (patch bump, additive backward-compatible); plugin v0.3.0 → v0.3.1. Other modules unchanged. **Wire change**: additive, back-compat (v0.2 callers default kind=upstream, roleDescription=null). **Self-application dogfood**: v2.5.57 패턴 재사용 — self-board sandbox → inner reference verbatim 역류.

Previously: v2.5.57 (2026-06-06) — Constellation v2.4.0 KEY-MGMT (WS-PROTOCOL-KEY-MGMT.md v0.2) — full EstreUF #406 patch parity. Substantive cut. Substantive cut: 5 canonical messages (`KeyIssue` / `KeyList` / `KeyRevoke` / `KeyLabel` / `AgentNameChanged`) + 5-state machine (ISSUED → ACTIVE → REVOKED_PENDING → REVOKED → DELETED) + `key.json` atomic-write persistence + 14-day TTL default + main-only permission gating + immediate/sessionEnd revocation modes + UI4 발급 패널 (⬆ 토글) + UI5 키 관리 모달 (목록 + revoke + label rename). `RegisterUpstreamKey` transitional alias 보존 (§3.1 retirement schedule). Distilled from EstreUF reference (`#406` patch, `app.js` line 2082-2199 + `server.cjs` line 251-422) — first substantive cut of the EG↔EstreUF bidirectional parity audit (workflow `wf_47ec564b-82d`, 21+7+13 items catalog, v2.5.57-66 roadmap). **v2.5.58 도 다음 cut**: Local key (`kind='local'`) + 역할 설명 (`roleDescription`) — UI 종류 선택 + 합류 에이전트 역할 안내 + 파일 경로/스크립트 호출 등록. **Files modified** (~10): [Constellation.md](Constellation.md) frontmatter v2.3.23 → v2.4.0 + protocol-line v2.4.0 codicil; [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) v0.2.4 → v0.3.0; [constellation/reference/runtime/server.cjs](constellation/reference/runtime/server.cjs) (17 함수 + keyStore + 4 핸들러 + permission gating + WS upgrade/HELLO upstreamKey 보관 + keyOnConnClose); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js) (setupWsKeyMgmt 함수 + buildModal + renderTable + 7 새 handler + ⬆ 토글 (사용자 선호)); [constellation/reference/dashboard/style.css](constellation/reference/dashboard/style.css) (.ws-key-modal/.ws-key-row/.ws-key-state CSS); [constellation/reference/WS-PROTOCOL-KEY-MGMT.md](constellation/reference/WS-PROTOCOL-KEY-MGMT.md) v0.1 DRAFT → v0.2 IMPLEMENTED + v0.3 트랙 (local kind + roleDescription) 명시; README badge + Current EN+KO; docs/shared/data.js meta.version v2.5.56 → v2.5.57 + shipCount 72 → 73; .claude-plugin/marketplace.json metadata.version 0.3.3 → 0.3.4 + constellation plugin v0.2.4 → v0.3.0; CHANGELOG.md EN+KO. **Module versions**: Constellation v2.3.23 → **v2.4.0** (minor bump), plugin v0.2.4 → v0.3.0. Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0, Ultrasafe v0.1.0 unchanged. Seed-tier v2.4.3 unchanged. **Protocol wire change**: 5 new canonical messages added; transitional alias `RegisterUpstreamKey` retained → back-compat 확보. **Self-application dogfood**: KEY-MGMT 변경 self-board (port 27878) sandbox 에서 발견 + 검증 → inner reference 역류 (v2.5.56 패턴 재사용). **다음**: docs 사용 가이드 통합 (workflow `wd0bhh3qd` + Constellation use cases agent `a9b100b0d32d15b64`) 은 후속 cut 으로 분할.

Previously: v2.5.56 (2026-06-06) — Constellation v2.3.23 dashboard reference parity — upstream invite UI symmetric to collab + onboarding md inline "A2A vs board" channel guide + archived-tab always-visible counter. Light reference-runtime cut, no protocol wire change. Distilled from EG self-board (port 27878) dogfood dual-board setup: (a) `UpstreamKeyIssued` now carries `joinUrl: "ws://host/ws?upstreamKey=<key>"` (was key-only), (b) `/join/upstream?key=<uk-…>` HTTP endpoint added beside `/join/collab` (returns dynamic onboarding md), (c) new `wsUpstreamOnboardMd(host, key)` helper symmetric to `wsCollabOnboardMd`, (d) both onboarding md inline a normative `wsChannelGuideMd()` section directing every joining agent to set `targetAgentId` explicitly on outbound CUSTOM (4-case table + 4 recommended rules + 3 anti-patterns), (e) dashboard `setupWsUpstream()` (⬆ button) symmetric to `setupWsCollab()` (🔗) with URL/key dual-copy buttons + `UpstreamKeyIssued` handler, (f) `#ws-arch-btn` always-visible counter (was auto-hidden when 0 closed tabs). **Files modified** (8): [Constellation.md](Constellation.md) (frontmatter version + v2.3.23 protocol line); [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) (v0.2.3 → v0.2.4); [constellation/reference/runtime/server.cjs](constellation/reference/runtime/server.cjs); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js); [constellation/reference/dashboard/index.html](constellation/reference/dashboard/index.html); README badge + Current EN+KO; docs/index.html hero badge + Constellation card module-tag; docs/constellation.html hero badge; docs/shared/data.js meta.version + shipCount 71 → 72; .claude-plugin/marketplace.json metadata.version 0.3.2 → 0.3.3 + constellation plugin version/description; CHANGELOG.md EN+KO. **Module versions**: Constellation v2.3.22 → **v2.3.23**, plugin v0.2.3 → v0.2.4. Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0, Ultrasafe v0.1.0 unchanged. Seed-tier v2.4.3 unchanged. **No protocol wire change** — `joinUrl` is additive to existing `UpstreamKeyIssued` value shape, `/join/upstream` is a new endpoint beside existing `/join/collab`. **Self-application dogfood**: cut's reference runtime change was discovered + verified live in `outer/collab-self/` (EG self-board sandbox); inner reference receives the patch verbatim — first case of self-board dogfood triggering reference parity.

Previously: v2.5.55 (2026-06-06) — Ultrasafe v0.1.0 first cut ship (5th optional module) + Greatpractice release-cadence promotion to ratified macro entry (dual cut). **Ultrasafe** is a pre-release / pre-update simulated penetration testing module — Superscalar-applied Workflow with 8 parallel red-team agents (v0.1.0 minimum fan-out) producing 3-layer synthesis reports (OSCAL + Hyperbrief IR + Greatpractice candidate). ≥3 iteration loop with 4-condition AND clean-signal gate. Backed by 17-axis cross-domain deep research at `reports/2026-06-05-ultrasafe-research/`. Advisory-only v0.1.x → blocking v0.2.x staged transition. **Files created** (4): [Ultrasafe.md](Ultrasafe.md) (2544 lines, §1-§13 + appendix A-C); [plugins/ultrasafe/.claude-plugin/plugin.json](plugins/ultrasafe/.claude-plugin/plugin.json); [plugins/ultrasafe/README.md](plugins/ultrasafe/README.md); [docs/ultrasafe.html](docs/ultrasafe.html). **Greatpractice ratification**: [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) promoted from `_propose/release-cadence.draft.md` (v2.5.55 user steering trigger at N=1 evidence; mezzo decomposition 8-candidate batch v2.5.56+ scheduled). `_propose/release-cadence.draft.md` rewritten as 1-line redirect stub. `greatpractice/INDEX.md` updated (macro tier 1 → 2 entries). **N-way sync**: README badge v2.5.54 → v2.5.55 + "four optional modules" → "five" (both EN + KO) + new Ultrasafe bullet (EN + KO) + Greatpractice bullet updated (ratification noted) + plugin install line updated; docs/index.html hero badge + module count 4 → 5 + Ultrasafe card placed between Greatpractice and Constellation (per Super → Hyper → Great → Ultra → Constell order); docs/{constellation,hyperbrief,superscalar,greatpractice,ultrasafe}.html nav order Super → Hyper → Great → Ultra → Constell; docs/shared/data.js meta.version + shipCount 70 → 71; CHANGELOG.md EN + KO entries; .claude-plugin/marketplace.json metadata.version 0.3.1 → 0.3.2 + ultrasafe plugin added. **No protocol wire change** — Constellation/Superscalar/Hyperbrief specs unchanged (Ultrasafe references Constellation §13.16.9 A2A intent extension as future work in v0.2+). Seed-tier remains **v2.4.3**. Most recent module cuts: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0 (release-cadence ratified at v2.5.55), **Ultrasafe v0.1.0**.

Previously: v2.5.54 (2026-06-05) — Hyperbrief docs L1.1.1.I 톤 일관 재렌더링 + candidate #7 사양 정정. v2.5.53 cycle 의 연속 — 사용자 입력으로 candidate #7 (tone-axis term-pairing) 사양 두 정정 추가: (a) C (conversation) scope 는 구조적으로 소급 적용 (retroactive) 대상 외, prompt/Y/N 모두 영향 없음; (b) I (initial) 모드 안에서 용어 사용 빈도 ≤ 3건이면 매번 병기 ("낮은 빈도 발동, low-frequency override") — 작성자 인지 부담 + 회상 어려움 + Hyperbrief brief 9-section 사이 거리 고려한 균질화. **Files modified** (5): [_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md](_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md) — candidate #7 spec 의 §2.4 에 "I 모드의 낮은 빈도 발동" 절 추가; [plugins/hyperbrief/QUICK-START.md](plugins/hyperbrief/QUICK-START.md) — 88 줄 → 92 줄 재렌더링 (≤3 use 용어 매번 병기 적용 — trigger-check / Node / hook / ajv / MUST-trigger / MD / JSON / HTML / BlockedStub / smoke test 등); [plugins/hyperbrief/TROUBLESHOOTING.md](plugins/hyperbrief/TROUBLESHOOTING.md) — 168 줄 → 173 줄 재렌더링 (≤3 use 용어 매번 병기 — matcher / trigger-check / sidecar / vendoring / fallback / diff / placeholder / clean install / schema validation / determinism 등); README.md (badge + Current line EN+KO 본 entry); docs/index.html (hero badge); docs/shared/data.js (meta.version + shipCount 69→70); CHANGELOG.md (본 entry EN+KO). **No protocol wire change, no schema change, no plugin runtime change** — pure spec refinement + docs re-render. Hyperbrief 모듈 version 변경 없음 (v0.5.6 유지). Lens B Lift 변동 없음 (재렌더링은 docs maturity 같은 dim 안 보강 — v2.5.53 의 +2 pts 유지). 시드 tier 는 **v2.4.3** 유지. 최근 모듈 cut: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0.

Previously: v2.5.53 (2026-06-05) — Hyperbrief docs maturity 보강 + v0.6 candidates triage register. Per Hyperbrief.md §11.5 readiness rubric — current Lens B (Claude marketplace registration) score 5.5 simple / 5.1 weighted (threshold 7.5). Docs maturity dimension (7/10) targeted by this cut. **Files created** (3): [plugins/hyperbrief/QUICK-START.md](plugins/hyperbrief/QUICK-START.md) — one-page quick start covering 30-second mental model + 3-step install + first brief walkthrough; [plugins/hyperbrief/TROUBLESHOOTING.md](plugins/hyperbrief/TROUBLESHOOTING.md) — operational FAQ catalogue covering T-1..T-8 (hook silent skip / settings.json approval gate / ajv version mismatch / Constellation off 4-way routing fallback / button localization / determinism regression / sidecar path / surface profile mismatch) + 5 one-line FAQ; [_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md](_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md) — schema candidates register, 7 candidates classified (4 → v0.6 / 3 → v0.7+ / 0 → reject), per-candidate sketch including new candidate #7 (tone-axis term-pairing E/I/N + scope C/D/B/R/A + retroactive-apply Y/N/prompt + short-command syntax `L1.I.C` / `L1.E.A`) entered from v2.5.53 cycle user input. **Files modified** (1): [Hyperbrief.md](Hyperbrief.md) gains §11.5.6 v0.6 candidates triage register pointing at the triage doc as operational SSoT. No schema change, no plugin runtime change, no protocol wire change — pure docs + triage register cut. Expected Lens B simple-mean lift: ~5.5 → ~5.8 (docs +2/6 dim). Seed-tier remains **v2.4.3**. Most recent module cuts: Constellation v2.3.22, Superscalar v0.4.2, **Hyperbrief v0.5.6** (with §11.5.6 register added), Greatpractice v0.1.0.

Previously: v2.5.52 (2026-06-05) — Greatpractice _propose/ release-cadence draft revision (hub 9-item schema + 0.4.0 N=1 evidence integrated). Continuation of v2.5.51 cycle: hub shared the trigger/then schema for each of the 9-item Pre-Publish checklist (hub `m-hub-gp-040-evidence-1780653318567`) + a fresh post-codify data point (EstreUX 0.4.0 publish on 2026-06-05, 0 omissions vs 0.3.0 baseline of 4 omissions, 100% reduction at N=1). Draft revised: §2 now carries the integrated 11-item body (9 hub-core + 2 EG-conditional naming/auth, with cross-mapped EG # ↔ Hub # numbering); new §4.4 Post-Codify Evidence Accumulation Log with N=1 / N=2 / N=3 tracker; §7 Status Tracker updated (`blocking_items[0]` resolved, body capture upgraded from "initial" → "v2.5.52 hub schema integrated"). Frontmatter source_evidence + revision_history + audit_trail updated; `_propose_state.post_codify_evidence` block added. **Light cut** — `greatpractice/_propose/release-cadence.draft.md` revision only (215 → ~310 lines, +95); no new ratified entries; module versions unchanged (Greatpractice v0.1.0). Promotion target unchanged — v2.5.5X or v2.6.0 when N≥2-3 post-codify cycles maintain 0 omissions OR user steering ratifies OR hub bidirectional cross-link triggers. Self-application dogfood: this very v2.5.52 cut's N-way sync exercises the 11-item checklist on the EG-side (release without npm — items 5/6/8/10/11 conditional-skip). Seed-tier remains **v2.4.3**. Most recent module cuts: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0.

Previously: v2.5.51 (2026-06-05) — Greatpractice _propose/ draft cut — release-cadence candidate (hub↔EG first dogfood cycle). Memory-triggered practice-codification dogfood: hub-side EstreUX 0.3.0 npm publish "quiet omission" incident (version bump 누락 + README stale + NOTICE missing + bin invalid, user-caught + hub release.md cd5e6be 9-item ratified checklist codify) + EG-side 16+ docs/promo sync miss across phase_3 cycle = combined evidence accumulated into [greatpractice/_propose/release-cadence.draft.md](greatpractice/_propose/release-cadence.draft.md) (215 lines, ~maturity 23/25 ≥ 18 threshold, notability gate 3-criterion pass, phronesis_boundary outside). Cross-axis convergence (sre release-preflight + humanities Gawande WHO + management standard work + canonical dual-mode-edit) 4-isomorphism. Hub release.md = sister surface (hub-scale instance per Greatpractice §10.4 "Schema only" adoption mode). Promotion to greatpractice/macro/release-cadence.md deferred to v2.5.5X — pending additional evidence (post-codify sync-miss recurrence reduction) OR user steering OR hub bidirectional cross-link trigger. This v2.5.51 cut is intentionally light — _propose draft + version bumps only; no new ratified entries, no plugin changes. Module versions unchanged (Greatpractice v0.1.0). Seed-tier remains **v2.4.3**. Most recent module cuts: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0.

Previously: v2.5.50 (2026-06-04) — Greatpractice v0.1.0 first cut ship (4th optional module). Greatpractice is a practice-codification discipline that captures repeatable work practices in a 3-tier hierarchy (macro/mezzo/micro) backed by 9-axis cross-domain deep research (harness · humanities · psychology · management · processor · os · sre · memoization · canonical — see [reports/2026-06-04-greatpractice-research/](reports/2026-06-04-greatpractice-research/)). v0.1.0 first cut ships: [Greatpractice.md](Greatpractice.md) spec (2220 lines, §1-§12 + 부록 A-C) + [greatpractice/_schema.md](greatpractice/_schema.md) entry frontmatter spec + [greatpractice/INDEX.md](greatpractice/INDEX.md) chunk summary + 1 ratified mezzo entry [outbox-json-validation](greatpractice/mezzo/outbox-json-validation.md) + 1 micro atom [outbox-append-json-roundtrip](greatpractice/micro/outbox-append-json-roundtrip.md) + [plugins/greatpractice/](plugins/greatpractice/) scaffold (3 JSON schemas + 1 PreToolUse contact hook). Multi-criteria 5-axis maturation gate (frequency + depth + recency + cost + predictability) replaces naive frequency-only signal. `phronesis_boundary` field carves out judgement-heavy work that should NOT be codified (humanities §3.9). v0.2-0.4 roadmap covers manifest hash + renderers + voice linter + MESI multi-agent coherence + CMMI L4 effectiveness measurement. Seed-tier (Master + Lite + Compact × EN/KO) is at **v2.4.3** (2026-06-03). Most recent module cuts: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, **Greatpractice v0.1.0**.

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

## bootstrap 너머 — 3 선택 모듈

v1.x 는 프로젝트 시드 — 신규 AI-Native 프로젝트 부트스트랩, 또는 기존 프로젝트를 `AGENTS.md` SSoT 로 마이그레이션 (위의 모든 내용). **v2.0+ 는 그 위에 5개의 선택 모듈 추가**:

- **[Constellation](Constellation.md)** (v2.0+) — 실시간 멀티에이전트 오케스트레이션. 파일 기반 `.agent/_coordination/` 코디네이션을 실시간 라이브보드 (WebSocket + A2A 메시징 + 대시보드) 로 격상. **A2A 브릿지 인터페이스**가 불변 계약. [constellation/reference/](constellation/reference/) 의 참조 런타임은 Node deps-0 (`ws` 제외). 컴포넌트는 `.eux` 로 작성하여 **[EstreUX](https://github.com/SoliEstre/EstreUX)** (별도 Apache-2.0 런타임, EG 가 *참조* — clone-and-run, 번들·소유 안 함) 로 brew.

- **[Superscalar](Superscalar.md)** (v2.3+) — 병렬 서브에이전트 dispatch 의 실행 스케줄링 규율. 5차원 `issue_width` 공식 (effort_band + pace_mode + Little's Law + Kanban WIP + autonomy_available_workers) + 30-60k 토큰 horizon 교차점에서의 cost-benefit gated dispatch + worktree-isolated reorder buffer + in-order retire + consistency gate + opt-in speculation. Production-ready (Stage 1 ship). n=8 dogfood ledger + Entry 06 controlled A/B 가 "병렬화만으로는 불충분; 오케스트레이션 규율이 일관성을 만든다" 입증.

- **[Hyperbrief](Hyperbrief.md)** (v2.3.20+) — 결정 위임 게이팅 규율. 모든 user-facing 결정 질문이 트리거 rubric 통과, 에스컬레이션 시 LLM 이 schema 강제 JSON IR emit, 결정론적 Node renderer 가 9-section Markdown 브리핑 + interactive HTML 카드 산출. 4축 × 5단계 톤 프로파일 + skill-side auto-localize (버튼 라벨 + MD trigger phrase 가 사용자의 prevailing 대화 언어 따라감). Cross-module 통합 active: Constellation §13.16.9 (5 A2A intent name + ack_tier='decided') + Superscalar §3.1 (write/deploy/send lane retire 시 orthogonal gate). §11.5 v1.0 readiness rubric (Lens A 7-차원 모듈 전체 GA / Lens B 6-차원 host-specific 마켓플레이스 등록) ship 완료.

- **[Greatpractice](Greatpractice.md)** (v2.5.50+, v2.5.55 release-cadence 정식 등록) — 메모리 기반 관행 codification 규율. AI 와 함께 작업하면서 자연스럽게 형성되지만 점점 누락되는 자잘한 약속들 — 「코드 수정 시 docs 도」, 「보내기 전 확인」, 「X 가 바뀌면 Y 도」 — 의 *조용한 누락* failure surface 를 target. 보통 메모리 메모로 시작했다가 메모가 누적될수록 점점 안 읽히고 누락이 늘어나는 패턴이에요. Greatpractice 는 agent-workspace 메모리 feedback (`memory/feedback_*.md` 또는 동등 surface) 을 입력 트리거로 받고, raw 신호를 5-axis multi-criteria maturation gate (frequency + depth + recency + cost + predictability weighted sum threshold ≥ 18 OR 3-criterion notability) 를 통해 3-tier macro/mezzo/micro 계층으로 route. ratified entry 는 deterministic lifecycle hook (SessionStart blocking / UserPromptSubmit path-scoped inject / PreToolUse 3-subtype poka-yoke contact/fixed-value/motion-step / PostToolUse SSoT propagation / Stop cycle-end probe / PostCompact working-set 복구) 으로 강제. 명시적 `phronesis_boundary` field 가 judgement-heavy work 의 codify-금지 영역 명시. 9축 cross-domain 딥리서치 (harness · humanities · psychology · management · processor · os · sre · memoization · canonical) 가 backing. v2.5.55 dual cut 이 [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) entry 를 `_propose/draft` 에서 ratified 로 promote (user steering trigger at N=1 evidence; mezzo decomposition 8-candidate batch v2.5.56+ 예정).

- **[Ultrasafe](Ultrasafe.md)** (v2.5.55+) — 출시 직전 / 갱신 직전 모의 침투 시험 규율. *출시 후 발견* failure surface 를 target: 보안 문제가 외부 사용자에 의해 발견되는 시점이 출시 후이지, 내부 검증으로 출시 전이 아닌 패턴. Ultrasafe 는 매 release 를 Superscalar-applied Workflow 로 ship, 8 병렬 공격 에이전트 (v0.1.0 최소 fan-out — AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer + GTA/DSP cross-cutting) 가 독립 관점에서 모의 공격, Finding Output Contract (§4) 로 발견 emit, Synthesizer 에서 BFT 2f+1 quorum + cross-axis correlation 으로 합성, 3-layer 보고서 (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate) 산출. ≥3 iteration loop 가 4-condition AND clean signal 까지 실행: regression-free + monotonic improvement + coverage gate + 2 iter consecutive + agent diversity invariant. Dual pre-release trigger (PreToolUse hook on `git push --tags` / `npm publish` / `gh release` / 등 7 matcher + `/ultrasafe` skill). 5 신규 Constellation A2A intent. **Advisory-only v0.1.x → blocking v0.2.x** 단계 전환 (Tier 3 release strict / Tier 1/2 opt-in). 17축 cross-domain 딥리서치 backing. v0.1.0 첫 cut ship = 전체 사양 (2544 줄, §1-§13 + 부록 A-C) + plugin manifest; runtime (공격 에이전트 dispatch / iteration loop runner / 3-layer 보고서 generator / 5 A2A intent handler / PreToolUse hook / MCP server) v0.2+ deferred.

다섯 모듈 모두 **선택적** + **참조** (시드 티어 본문에 번들되지 않으므로 시드는 lean 유지). 파일 기반 코디네이션 (Phase 5) 이 기본이며 대부분 프로젝트에 충분.

### Claude Code 플러그인으로 설치 (repo 자체 마켓플레이스)

다섯 모듈은 본 repo 의 **repo 자체 마켓플레이스** 를 통해 Claude Code 플러그인으로도 ship. Claude Code 세션에서:

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install constellation@estregenesis-plugins
/plugin install superscalar@estregenesis-plugins
/plugin install hyperbrief@estregenesis-plugins
/plugin install greatpractice@estregenesis-plugins
/plugin install ultrasafe@estregenesis-plugins
```

각 플러그인 독립 — 하나, 둘, 셋, 또는 넷 모두 설치 가능. 마켓플레이스 메타데이터는 [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json), 각 플러그인 소스는 [plugins/](plugins/) 아래. Apache-2.0. Phase 2 production-ready (Constellation v0.2.3 + 5-tool MCP 서버; Superscalar v0.1.2 + §3.1 Hyperbrief interlock; Hyperbrief v0.5.6 + 3 skill + 4-tool MCP 서버 + PreToolUse/Stop hook; Greatpractice v0.1.0 + 3 JSON schema + 1 PreToolUse contact hook). Anthropic-side community-marketplace 등록은 [Hyperbrief.md §11.5](Hyperbrief.md) readiness rubric Lens B 에 따라 v1.0 GA 까지 defer.

## 3-tier — 프로젝트당 하나 선택

| Tier | 크기 | 주 용도 | 대상 독자 |
|---|---|---|---|
| **Master** | ~2440줄 | 깊이 있는 가이드 필요한 신규 프로젝트, 패턴 처음 배우는 팀, 모든 인라인 템플릿 필요한 엣지 케이스 | 첫 AI Native 저자; 프로세스 공식화하는 팀 |
| **Lite** | ~1100줄 | 빠른 신규 프로젝트, 마이그레이션 세션, 기존 프로젝트에 새 AI 서비스 편입, 마스터가 컨텍스트 윈도우에 무거울 때 | 패턴 기억하는 복귀 저자; 대부분 프로젝트 |
| **Compact** | ~120줄 | 이미 패턴 알고 최소 시드 원하는 저자; 가장 타이트한 컨텍스트 윈도우; bullet 트리거만 | 체크리스트만 필요한 파워 유저 |

프로젝트에는 **tier 하나만** 배치. 세 개 다 넣지 않음. 존재하지 않는 tier 를 교차 참조하면 dead link 와 에이전트 혼란만 발생하므로, 각 tier 는 **self-contained** — 내부 완결, 다른 tier 로의 forward/backward 참조 없음.

프로젝트가 더 많은 깊이를 요구하게 되면 tier 를 in-place 업그레이드하지 않습니다. 파일을 다음 tier 로 교체하고 커밋. 에이전트가 일반 문서 업데이트로 처리합니다.

## 파일 목록

```
AI_Native_Project_Master_Seed_Prompt.md       ← 영문 마스터 (가장 깊음, ~2440줄)
AI_Native_Project_Seed_Prompt_Lite.md         ← 영문 lite (~1100줄)
AI_Native_Project_Seed_Prompt_Compact.md      ← 영문 compact (~120줄)
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

각 tier 의 언어 페어(영문+한글)는 완전 정렬 — 동일한 phase, 동일한 마이그레이션 로직, 동일한 운영 가이드. 이중언어 팀이면 페어로 배치. **v2.0+** 는 3개의 선택 참조 모듈 (Constellation + Superscalar + Hyperbrief) 을 추가하며, 각각 repo 자체 마켓플레이스를 통해 Claude Code 플러그인으로도 ship — changelog 참조.

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

각 tier 는 자체 버전 보유. 마스터가 권위 있는 진화 트랙; Lite·Compact 는 정기적으로 마스터에서 파생되나 한 릴리스 지연될 수 있음.

**현재**: v2.5.74 (2026-06-10) — **ship-surface 진실성 un-claim (전수점검 careful 트랙) — Ultrasafe v0.2.1 · Greatpractice v0.2.1** — spec 이 미존재 파일을 'ship 단위'로 기술하던 것을 실재 트리에 un-claim 정정 (doc-only, 기능/wire 변경 0): **(1)** Ultrasafe.md §14.1 논리 역할 매핑 노트 신설 — orchestrator/aggregator/clean-signal-gate 는 논리 역할 (실표면 = 메인 에이전트 Workflow fan-out + synthesizer skill + MCP tools); `runtime/*.cjs`·`schemas/*.schema.json`·`mcp/tools/*.cjs` 미출하 명시 (계약 정본 §4/§8.1, ajv graceful skip). **(2)** §14.3 트리 실재화 + §15 skill 디렉토리 실명 8종 (`ultrasafe-ai-llm-redteam` 등). **(3)** §16.6/§17 실구현 정합 — SDK-free 단일 파일 MCP server + hook 15-패턴 매처·self-contained 동작 (가짜 skeleton 제거) + hooks.json 실파일 형식. **(4)** shipped 파일 동기 — ultrasafe plugin README 재작성 + SKILL.md 6종 stale ref 정정 + `.ultrasafe/` working-dir 컨벤션 통일 + mcp/package.json·server.cjs 주석. **(5)** Greatpractice.md §11.1 — 목표 트리 'ship' 기술을 실재 목록(3 schemas + 1 hook)으로 정정 + 잉여분 §11.2 deferred 이동 + plugin README 라벨 동기. **(6)** docs/ultrasafe.html — cut-scope 섹션 v0.1.0→v0.2.x 재작성 + 심층 narrative stale-as-current 서사 8곳 정정 (역사적 기술 보존). **모듈 version**: Ultrasafe v0.2.0 → **v0.2.1**, Greatpractice v0.2.0 → **v0.2.1** (둘 다 doc-only patch, plugin·marketplace 동기). 기타 변경 없음. 시드 tier v2.4.3 유지. **wire 변경 없음**. verify-nway PASS. 전수점검 패치-트랙 4건 (v2.5.71-74) 완결 — 가지치기·마이너범프 이상은 별도 검토 트랙.

이전: v2.5.73 (2026-06-10) — **doc/manifest 진실성 정정 (전수점검 보완, 모듈 버전 무변경)** — stale 버전 라벨(표시 라벨 ≠ 실제 모듈 버전) 정정, 기능 무변경: **(1)** Greatpractice.md 제목·리드 "design draft v0.1.0" → **v0.2.0** (frontmatter 는 이미 v0.2.0). **(2)** marketplace.json hyperbrief "Wraps v0.5.6" → **v0.6.0**. **(3)** docs/ultrasafe.html 요약(meta+태그라인+intro) "v0.1.0 / advisory v0.1.x→v0.2.x blocking" → **v0.2.0 / advisory v0.2.x→v0.3+ blocking** (배지와 일치, blocking 전환 v0.2→v0.3 반영). **모듈 version 변경 없음**. 시드 tier v2.4.3 유지. **wire 변경 없음**. verify-nway PASS. **다음 careful 트랙(별도)**: docs/ultrasafe.html 심층 narrative(~40 ref 역사적/stale 판별) + Ultrasafe §14.3 / Greatpractice §11.1 ship-surface un-claim 은 judgment-heavy Ultrasafe-truth 리비전이라 집중 패스로 분리.

이전: v2.5.72 (2026-06-10) — **Constellation v2.4.12 대시보드 XSS 하드닝 패치 (전수점검 후속, dashboard render only)** — reference 대시보드 첨부 미리보기 XSS 표면 차단 (peer 가 A2A 로 첨부 주입 가능 전제): **(1) html 첨부 iframe `sandbox`** — `srcdoc`/`src` iframe 에 sandbox(스크립트·동일출처 차단) → 첨부 HTML 의 same-origin JS 실행/`window.parent` 접근 차단. **(2) mermaid `textContent` 주입** — raw body 를 innerHTML 대신 textContent 로 (mermaid 렌더 동일, `<img onerror>` 파싱-전 실행 차단). **Playwright 5/5 PASS** (SVG 렌더 회귀 없음 + onerror 미실행 + sandbox 보유 + parent 접근 차단). **모듈 version**: Constellation v2.4.11 → **v2.4.12**(patch, dashboard render only, wire 무변경 · 서버 재기동 불필요), plugin v0.3.11 → v0.3.12. 기타 변경 없음. 시드 tier v2.4.3 유지. **프로토콜 wire 변경 없음**. **Files**: dashboard/app.js(inner+outer 동기) + N-way sync. 잔여 dashboard 발견(decisions raw, attNewTab blob)은 operator 채널이라 별도 검토.

이전: v2.5.71 (2026-06-10) — **Constellation v2.4.11 보안 하드닝 패치 (전수점검 후속)** — 전수점검에서 나온 reference 런타임 보안 발견 중 패치 차원(코드/사실정정, wire 무변경) 3건: **(1) secure-by-default bind** — server.cjs 기본 `127.0.0.1` 바인드, 노출은 `WS_BIND=0.0.0.0` opt-in + 비-loopback 경고. board 연결이 무인증으로 키 발급·SetMain 하는 표면이라 기존 0.0.0.0 기본은 LAN 의 누구나 키 발급/조회/SetMain 가능했음(무인증 board 우회 critical + role 스푸핑 high + KeyList 평문 high 의 원격 벡터 차단). **(2) WS 프레임 상한** — ws-core.cjs `WS_MAX_FRAME`(16 MiB) 단일/재조립 총량 상한 (메모리 고갈 DoS 가드). **(3) credential gitignore + eux 정정** — key.json/ws-keys.json/local-keys/*.key gitignore 블록 추가(기존 미커버) + server-keys.eux 파일명 사실오류 정정. **모듈 version**: Constellation v2.4.10 → **v2.4.11**(patch, runtime 보안 하드닝, 기본 wire 무변경), plugin v0.3.10 → v0.3.11. 기타 모듈 변경 없음. 시드 tier v2.4.3 유지. **프로토콜 wire break 없음**. **Files**: server.cjs+ws-core.cjs(inner+outer) + .gitignore + server-keys.eux + Constellation.md + N-way sync. **점검 리포트**: outer `/reports/2026-06-10-eg-full-audit.md` (가지치기·마이너범프 이상은 별도 검토).

이전: v2.5.70 (2026-06-08) — **Constellation v2.4.10 A2A PR System §13.22 distill + deadlock 서버 자동화 opt-in** — 두 normative 보강: **(1) §13.22 A2A PR System 정식 스펙화** — 기존 line 740 dangling §13.22 참조를 RRP 설계문서에서 §13.19 수준 정식 normative 섹션으로 distill: two-level abstraction(Level 1 A2A-only virtual PR / Level 2 Github PR provider-mediated) + 5 wire vocabulary(`PRRequest`/`PRDraftReady`/`PRReviewAck`/`PRMergeRequest`·`Ack`/`PRStatusUpdate` + `sourceContentRef.kind` enum + 미인식 fail-safe reject) + topology b(local-bridge command) + approval discipline(trusted-mirror auto / standard opt-in 기본 / emergency) + β′ mirror-branch sourcing + per-repo authority(strict role==main merge gate) + 5-state lifecycle machine + §13.13/§13.19/§13.20 composition. EG 는 스펙만 ship, PR-bot reference impl 은 adopter-side. **(2) §13.19.10 Q3 deadlock 서버 detector opt-in** — board-adapter strict 2-cycle detector 를 `runtime/server.cjs` 에 `WS_DEADLOCK_DETECT` env-gated(**기본 OFF**)로 추가: 활성 시 reply-pairing 으로 wait-edge 근사 → threshold(`WS_DEADLOCK_PROBE_MS` 기본 120s) 초과 strict 2-cycle 시 `DeadlockProbe` emit. **canonical 검출은 여전히 에이전트측 turn-start DFS(§13.19.3)**, 서버는 보조. **모듈 version**: Constellation v2.4.9 → **v2.4.10**(patch, spec distill + 서버 opt-in detector, 기본 wire 무변경), plugin v0.3.9 → v0.3.10. 기타 모듈 변경 없음. 시드 tier v2.4.3 유지. **프로토콜 wire break 없음** — §13.22 옵트인 vocabulary + deadlock 기본 OFF. **Files**: Constellation.md(§13.22 + §13.19.10 Q3 단락 + frontmatter codicil) + runtime/server.cjs(inner+outer) + N-way sync.

이전: v2.5.69 (2026-06-08) — **Constellation v2.4.9 dashboard A2A 대화 카드 통일 + 인라인 re>summary 우선** — A2A timeline 에서 일부만 카드, 일부는 plain text 로 흐르던 불일치 통일: **(1)** 코디네이션 메시지 `Delegate`/`WorkerReport`/`WorkerAck`/`OnboardAck`/`AgentHello` + 미분류 객체 `CUSTOM` 을 a2acard 로(`WS_A2A_INTENT` 5종 추가 + 전용 핸들러 제거 + generic else 객체 카드화). `UserPrompt`(대화)·`Command`/`Cancel`(제어)·`Ack`/`Ping`/`Pong`(dim 게이팅)·status 는 row 유지. **(2)** 인라인 간략 표시 `re` > `summary` 우선(신규 spec sum + generic fallback sum re-first, Delegate inline 도 re 우선). **모듈 version**: Constellation v2.4.8 → **v2.4.9**(patch, dashboard render only), plugin v0.3.8 → v0.3.9. 기타 모듈 변경 없음. 시드 tier v2.4.3 유지. **프로토콜 wire 변경 없음**. **Files**: dashboard/app.js (+ outer 동기) + N-way sync.

이전: v2.5.68 (2026-06-08) — **Constellation v2.4.8 dashboard EstreUF-parity 5-gap 이식** — 상류 원본(EstreUF) dashboard 전수 비교로 식별한 EstreUF-only 동작 5건 (EG 는 대부분 동등/우위, 이 5건이 갭): **(1)** 검토사안 0개면 빨간 뱃지 숨김(`_decBadge.hidden=(count===0)`, 기존 dead CSS 활성화). **(2)** 메시지 발신-시각 보존 — `wsMsgEpoch`/`wsRowTime` 으로 `_t`/`_ts` 도출해 모든 row 통일, 새로고침·replay 후에도 날짜변경선·정렬·시각 원본 고정(기존 `Date.now()`/`nowHM()` 으로 "오늘" 붕괴 fix). **(3)** 닫은 세션 영구삭제 크로스보드 동기 + persist — server `DeleteChannelHistory` 핸들러(`wsCloseChannelHist`+`wsToBoards`) + client inbound 핸들러(기존 삭제 미persist→새로고침 부활 fix). **(4)** `SelectionResolved` 라우팅-무관 조기 처리(agentId 가드 앞). **(5)** 그룹 선택 시 멤버 탭 이름 4-role 색상 틴트(`grpSel`). **모듈 version**: Constellation v2.4.7 → **v2.4.8**(patch, dashboard parity + server 핸들러, wire 무변경), plugin v0.3.7 → v0.3.8. 기타 모듈 변경 없음. 시드 tier v2.4.3 유지. **프로토콜 wire break 없음**. **Files**: dashboard app.js+style.css + runtime/server.cjs (+ outer 동기) + N-way sync.

이전: v2.5.67 (2026-06-07) — **Constellation v2.4.7 단일 워크스페이스 멀티에이전트 session-aware routing (register-all + fail-safe) + dashboard 발급 버그 fix** — 같은 워크스페이스에 여러 Claude Code 세션(main + local worker)이 열리면 동일 Stop hook 을 공유 실행 → 동일 A2A cursor 경쟁(worker turn-end 가 main surfacing cursor 가로챔). 별도 워크스페이스 분리(IDE 창당 확장 중복 + 맥락 단절) 없이 **per-session `CLAUDE_CODE_SESSION_ID`**(hook env 주입)로 분기. **register-all**: 모든 세션이 자기 소유 inbox 를 `.agent-sessions.json` 레지스트리에 선언, hook 은 SELF 소유 inbox 만 처리 — 미등록=SKIP-ALL(fail-safe, 타 세션 surface 비침범) / 타 세션 소유 skip / 자기 소유만 처리. 신규 `register-session.cjs` + `pre-send-probe.cjs` routing + `join-local.cjs` v2.4.7(local 워커 outbox drain + full inbound 로깅) + `server.cjs` WS_PRIMARY_AGENT 미설정 경고(메인 local 강등 방지). **2층 기상**: 1차 ≤5초 file Monitor(즉시) + 2차 ScheduleWakeup 긴 fallback. **dashboard 발급 버그 fix(번들)**: `.ws-collab-*` cursor:move leak 차단 + KEY-MGMT 응답 핸들러 5종 drift fix("발급 중…" 멈춤 근본원인). **라이브 검증**: local worker 왕복 — main cursor 비충돌 증명 + main 자동 수신(≤3초 Monitor 무nudge). **모듈 version**: Constellation v2.4.6 → **v2.4.7**(patch, register-all routing + dashboard fix), plugin v0.3.6 → v0.3.7. 기타 모듈 변경 없음(Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). 시드 tier v2.4.3 유지. **프로토콜 wire 변경 없음** — runtime + Stop hook + dashboard render. **다중 adopter 혜택**: 단일 워크스페이스 멀티세션은 Claude Code adopter 전반 generic — register-all routing + ≤5초 Monitor 2층 기상 공개.

이전: v2.5.66 (2026-06-07) — **Constellation v2.4.6 dashboard A2A 대화 UI 확충 패치** — sibling private dashboard reference 에서 7 추가 표면 이식: (1) 단독 플로팅 창 sticky 헤더 `.ws-pop-h` (스크롤 시 제목줄/드래그/✕ 가림 방지 + 첫 row border-top 제거); (2) 날짜변경선 `.ws-dateline` (sticky top:0, ko-KR long form + 오늘/어제 라벨, wsRenderRow + wsRenderActiveStream 양 분기 삽입); (3) A2A-intent CUSTOM 카드 — `WS_A2A_INTENT` 18 intent 사전 (Report·BlockerManifest·BlockerNudge·ReviewSLAAck·PR* 7종·Deadlock/Preempt 3종·Mediation 2종·Escalation 2종 — 각 `{icon, label, sum[]}`) + `wsA2aSummary` (sum 키 순서대로 첫 비어있지 않은 string/number) + `wsA2aCardEl` (아이콘 + label + summary + body details key/value + 첨부 + 펼침 ◀ 토글) + `wsExtractA2aReport` (§13.16.12 Pattern 7 fallback — TEXT_MESSAGE.text 안 코드블록 JSON 을 envelope 로 승격, structured CUSTOM wrapper + bare type 양쪽 잡음); (4) 첨부 칩 + 미리보기 모달 — `wsAttachments` (value.attachments[]/atts/files/attachment/zip/file 추출) + `wsAttIcon` (mime별 이모지) + `wsAttChipEl` (icon + filename + size + sha256 title + 👁 미리보기 + ⬇ 다운로드) + `wsAttPreview` (이미지/텍스트 모달, fetch + 40KB 절단). A2A 카드 + 일반 row 양쪽 적용; (5) SelectionPrompt chip 카드 (#406 UI6) — `wsSelectionCardEl` (issued/answered/cancelled 3-state + multiSelect picked + chosen 강조 + allowFreeText 입력 + 답/취소 버튼) + `wsAnswerSelection`/`wsCancelSelection` (board→server SelectionAnswer/SelectionCancel emit via wsSendOrch) + `wsRefreshSelectionCard` (in-place 재렌더) + `wsResolveSelection` (SelectionResolved broadcast 시 모든 같은 promptId 카드 dim); (6) 닫은 세션 삭제 UI3 + 연결상태 dot — `.ws-arch-item` flex 분리 + `.ws-arch-dot` (green=연결 / gray=끊김) + 🗑 개별 삭제 + 🗑 전체 삭제 (wsConfirm 확인 + DeleteChannelHistory CUSTOM emit); (7) self-attestation confirm/prompt 자체 다이얼로그 — `wsConfirm`/`wsPrompt` Promise 헬퍼 (browser confirm/prompt 의존 제거 — IDE webview 환경 호환 + Escape/Enter 키 + danger 변형). 기존 revoke/relabel async + wsConfirm/wsPrompt 사용. **모듈 version**: Constellation v2.4.5 → **v2.4.6** (patch, additive UI feature add — render policy 확장만, wire 변경 없음), plugin v0.3.5 → v0.3.6. 기타 모듈 변경 없음 (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). 시드 tier v2.4.3 유지. **프로토콜 wire 변경 없음** — dashboard render only. **Self-application dogfood**: outer self-board (port 27878) sandbox 양쪽 동기 — 사용자 UI 시각 확인 → inner reference 역류 (v2.5.56/58/60/64 패턴 재사용).

이전: v2.5.65 (2026-06-07) — **Constellation v2.4.5 incident hardening 패치** — 2026-06-07 incident (동일 agentId 로 중복 collab-client 합류 → 서버 close(1005) + backoff reconnect loop → AgentHello 폭주 + inbox.log 2.5GB 폭증 → Stop hook 의 fs.readFileSync surface 폭주 → API Usage Policy 차단) 후속 4-layer 안전장치: (a) 신규 `runtime/single-instance.cjs` helper (deps-0, agentId 별 PID lock + alive 검사 + stale 자동 정리, reject-new 정책); (b) 4 client 적용 — gateway/main/ws-agent-client + scripts/join-local + runtime/watchdog (runtime/local-bridge 는 2026-05-30 inline takeover 가드 유지); (c) `runtime/stop-hook/pre-send-probe.cjs` runaway 보호 — `PROBE_RUNAWAY_BYTES` (기본 32 MiB) 초과 시 streaming `countLinesStream` + cursor 자동 tail-advance + surface skip + alarm + `MAX_MEANINGFUL_SURFACE=50` cap; (d) 신규 `runtime/scripts/runaway-recover.cjs` (deps-0 readline streaming) — backup 에서 §13.16.9 allowlist 매치 inbound 만 추출 → cleaned 파일 + 통계 (incident 검증: 2.5GB → 652KB / 341 의미 있는 line). 가벼운 패치, 프로토콜 wire 변경 없음. **모듈 version**: Constellation v2.4.4 → **v2.4.5** (patch, back-compat hardening — 가드는 reject-new 정책이라 정상 single-instance 동작 영향 없음), plugin v0.3.4 → v0.3.5. 기타 모듈 변경 없음 (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). 시드 tier v2.4.3 유지. **프로토콜 wire 변경 없음**. **다중 adopter 혜택**: 동일 incident 패턴 (중복 agentId reconnect loop → inbox 폭증) 은 Constellation adopter 전반 generic — public release 로 Hermes / 미래 adopter 도 같은 가드 받음.

이전: v2.5.64 (2026-06-07) — **Constellation v2.4.4 대시보드 UI 추가 패치** — 모서리-기준 4 anchor preset (`.ws-pop.pos-{tl,tr,bl,br}` — localStorage `constellation-ws-position` 영속; 드래그/리사이즈 종료 시 `wsRectToAnchorPos` 로 anchor 모서리 거리 정규화; 기존 `WS_UI.pos` left/top 절대좌표 자동 마이그레이션; 기본 anchor 'br') + 설정 모달 ⚙ (popup head 의 📂 우측) + 4 preset 카드 + 동작 설명 + fab 우클릭 컨텍스트 메뉴 (가운데 / 키 발행 / 키 관리 / 설정 — `wsKeyMgmt.openIssuePanel` 신규 노출) + `.ws-fab` z-index 60→58 (popup 이 fab 덮음) + arch-empty placeholder ("닫은 세션이 없어요") + 폴더 이모지 🗂→📂 + 헤더 영역 spacing 압축 (`.ws-conn` margin-bottom 12→8 + `.ws-h` margin 4/7→0/0). Light reference parity cut, 프로토콜 wire 변경 없음. 사용자 직접 의도 (2026-06-07): 창 배치 anchor preset (화면/창 크기 변경 시 모서리 거리 유지) + 사용자 드래그도 anchor 기준 자동 정규화 + 기존 좌표 마이그레이션 + arch placeholder + 폴더 이모지 + popup head 간격 spacing. **모듈 version**: Constellation v2.4.3 → **v2.4.4** (patch, additive UI augment), plugin v0.3.3 → v0.3.4. 기타 모듈 변경 없음 (Superscalar v0.4.2 · Hyperbrief v0.6.0 · Greatpractice v0.2.0 · Ultrasafe v0.2.0). 시드 tier v2.4.3 변경 없음. **프로토콜 wire 변경 없음** — dashboard 만. **Self-application dogfood**: self-board (port 27878) sandbox 에서 사용자 UI 피드백 + 즉시 적용 → inner reference 역류 (v2.5.56/58/60 패턴 재사용).

이전: v2.5.63 (2026-06-06) — **Ultrasafe v0.2.0 runtime activation cut + Constellation v2.4.3 §13.16.13 5 신규 A2A intent 통합** (substantive — 가장 큰 cut). Workflow `wjdacz798` 3-phase 12-agent fan-out (Phase 1 spec → Phase 2 11 병렬 (8 attacker skills + 2 hooks + MCP server) → Phase 3 Constellation 통합 · 1192초 · 766k subagent 토큰 · 159 tool uses · 18 파일 · ~4700 줄 신규). 사용자 직접 의도: "ultrasafe 넘어가면 양쪽 동시 진행" (hub 측 7 outbound batch 통보 fire-and-forget 동반). v0.2.0 runtime layer = Ultrasafe.md +978 줄 (§14-§19 신규) + 8 attacker SKILL.md (총 ~2885 줄) + 2 hooks (PreToolUse + Stop) + MCP server (5 tools, 759 줄) + Constellation v2.4.3 §13.16.13 wire-spec (5 신규 A2A intent allowlist + ack_tier dual-mode advisory/blocking + cross-module wires Hyperbrief/Greatpractice/Superscalar). **v0.2.x advisory invariant**: 모든 출력 `advisory: true` flag — publish 차단 0. Blocking mode v0.3+ 후속. **모듈**: Ultrasafe v0.1.0 → **v0.2.0** (minor, substantive runtime activation, advisory mode), plugin v0.1.0 → v0.2.0. Constellation v2.4.2 → **v2.4.3** (additive minor, intent allowlist), plugin v0.3.2 → v0.3.3. 기타 모듈 변경 없음. 프로토콜 wire break 없음 (additive). Multi-agent orchestration dogfood 연속 3회.

이전: v2.5.62 (2026-06-06) — Hyperbrief v0.6.0 substantive 4-slot additive cut — `evaluation_lenses[]` (§0) + `recommended_methodology[]` (§8) + `maturity_anchor` (FullBrief 최상위) + `term_pairing` (audience_profile_fallback 확장).** Workflow `w7hpkq8rk` 3-phase 9-agent fan-out (Phase 1 schema → Phase 2 7 병렬 → Phase 3 spec + triage close, 718초, 524k subagent 토큰, +1188/-53 줄, 11 파일). 사용자 직접 의도 + mezzo batch 패턴 재사용. 4 슬롯 모두 optional — 기존 v0.5.6 IR 가 v0.6 schema valid (back-compat). Renderer (mini-engine.cjs +402줄) 가 4 슬롯 MD + HTML rendering + term_pairing post-processor + minimal default dictionary 구현. Smoke test: legacy IR + v0.6 full IR 모두 determinism + back-compat OK. **모듈**: Hyperbrief v0.5.6 → **v0.6.0** (minor bump, substantive additive, back-compat 보존), plugin v0.5.6 → v0.6.0. 기타 모듈 unchanged. 프로토콜 wire 변경 없음 — schema entries 추가만. Multi-agent orchestration dogfood 연속 2회 (mezzo batch → Hyperbrief v0.6 phase-staged fan-out).

이전: v2.5.61 (2026-06-06) — Greatpractice v0.2.0 mezzo 8-batch ratification — release-cadence.md (macro) children decomposition pattern 의 첫 시연.** Workflow `wk5a6jh5k` 병렬 fan-out (8 agents · 147초 · 357k 토큰) 로 8 mezzo entries 동시 작성 + ratify. 8 entries 의 5-axis maturation 분포: 24 / 24 / 22 / 21 / 19 / 19 / 19 / 17 (threshold 18 — 위 5 + at-or-above 2 + below 1 with notability-gate backing). 신규 추가 ~1850줄 (frontmatter 8 × ~90 + 본문 8 × ~140). 구조 변화: v0.1.0 (1 macro + 1 mezzo) → **v0.2.0 (1 macro + 9 mezzo)**. 모듈: Greatpractice v0.1.0 → **v0.2.0** (minor bump — children decomposition pattern demonstration), plugin v0.1.0 → v0.2.0. 기타 모듈 변경 없음. 프로토콜 wire 변경 없음 — spec extension. release-cadence.md frontmatter `children:` 활성화 + `_ratified_state.acknowledged_risk` v2.5.61 ratification 갱신.

이전: v2.5.60 (2026-06-06) — Constellation v2.4.2 대시보드 UI 통합 patch — setupWsCollab 제거 + setupWsKeyMgmt 단일 통합 + UI5 모달 4 탭 + 이모지 통일 + 즉시 placeholder + 모달 폭 240→320**. Light reference parity cut, 프로토콜 wire 변경 없음. 사용자 직접 의도. 6 변경: (a) setupWsCollab (🔗 별도 버튼) 제거 — CollabKeyIssued 가 wsKeyMgmt.setIssued kind=collab fallback 으로 통합. (b) setupWsKeyMgmt 토글 🔑 (기존 ⬆). (c) kind radio 순서 ⬆ 업스트림 → 🏠 로컬워커 → 🔗 외부협업 + 기본값 local + 선택 시 라벨 포커스. (d) UI5 모달 4 탭 (전체/⬆/🏠/🔗) + 행 이모지 발행 창과 동일 + 모달 제목 🔐. (e) openManager() 가 즉시 renderTable() 호출 — placeholder 즉시 렌더. (f) 패널 폭 240→320 한 줄 fit. **수정 파일 8**: Constellation.md frontmatter v2.4.1 → v2.4.2 + plugin.json v0.3.1 → v0.3.2 + dashboard/app.js + dashboard/style.css + README badge + Current EN+KO + docs/index.html (hero + Constellation 카드 module-tag v2.4.1 → v2.4.2) + docs/constellation.html + docs/shared/data.js v2.5.60 + shipCount 76 + marketplace.json 0.3.6 + CHANGELOG. **모듈 version**: Constellation v2.4.1 → **v2.4.2** (patch). plugin v0.3.1 → v0.3.2. 기타 모듈 변경 없음. **프로토콜 wire 변경 없음** — server 측 그대로, dashboard 만 통합. **Self-application dogfood**: self-board sandbox 에서 사용자 UI 피드백 + 즉시 적용 → inner reference 역류.

이전: v2.5.59 (2026-06-06) — Promo docs 사용 가이드 통합 cut — 5 모듈 페이지 + index.html 마켓플레이스/청중 분기 section**. Light docs cut, 프로토콜 wire 변경 없음, 모듈 version 변경 없음. Workflow `wd0bhh3qd` + agent `a9b100b0d32d15b64` 출력 통합. **6 docs/*.html 갱신**: (1) [docs/constellation.html](docs/constellation.html) — 3 카드 (로컬 워커 / 외부 협업 / 업스트림 peer) × (when + UI / 프롬프트 / 합류 에이전트 전달 3 서브섹션), v2.4.1 KEY-MGMT 일관성 (`kind=local` + 🏠 라디오 + `roleDescription` 발급 명시); (2) [docs/superscalar.html](docs/superscalar.html) — 5 카드; (3) [docs/hyperbrief.html](docs/hyperbrief.html) — 5 카드 (Refactor / DB Migration / Third-party API / Schema Migration / Emergency Hotfix); (4) [docs/greatpractice.html](docs/greatpractice.html) — 5 카드 (Outbox JSON Validation / SessionStart Blocking / N-way Sync / Procedure Sequence / Phronesis Boundary); (5) [docs/ultrasafe.html](docs/ultrasafe.html) — 4 카드 (Patch release / Major release / Supply chain / Fix verification); (6) [docs/index.html](docs/index.html) — 신규 `<section id="install">` (마켓플레이스 등록 + 5 플러그인 카드 + 설치 명령) + 신규 `<section id="audience">` (CLI 이용자 vs Claude Code VS Code 확장 분기, 각 4 단계). i18n 호환: inline `<code>` 포함 항목은 `data-en-html` / `data-ko-html` variant 적용 (docs/shared/i18n.js innerHTML swap 호환). L1.1.1.I 톤 정렬 — 새 section 들에 `data-aud="general/dev/expert"` 분리 제거, 단일 톤 (general 청중) + `data-en` + `data-ko` 만 유지. **모듈 version**: 모든 모듈 변경 없음. 시드 tier v2.4.3 유지. **프로토콜 wire 변경 없음**.

이전: v2.5.58 (2026-06-06) — Constellation v2.4.1 KEY-MGMT v0.3 확장 — Local key + roleDescription + 종류 선택 UI. Substantive cut. Substantive cut (additive, v0.2 와 wire 호환). `KeyIssue.value` 가 `kind: 'upstream'|'collab'|'local'` (기본 upstream, back-compat) + `roleDescription: string` (선택 ≤256자) 수용. **Local 키 (`lk-` prefix)** 는 wire 비공개: server 가 키 바이트를 `local-keys/<label>.key` 에 원자적 write+fsync 로 저장, 응답에는 `joinFile` + `joinScript: 'scripts/join-local.cjs'` + `joinHint` (한 줄 명령) 만 포함 — 키 자체 미포함. `/join/local?label=<label>` HTTP endpoint + `wsLocalOnboardMd` (label 만 받음, URL 에 키 노출 0). `scripts/join-local.cjs` reference impl (env `LOCAL_KEY_FILE` 로 파일 읽고 ws 합류). Dashboard UI4: 종류 radio (🔑 업스트림 / 🔗 협업 / 🏠 로컬) + roleDescription textarea + local 발급 시 명령 복사 버튼 (키 자체 안 보임). Dashboard UI5 모달: 종류 chip + `🎭 roleDescription` chip per row. Onboard md (셋 다) 에 roleDescription 임베드. **수정 파일 12**: Constellation.md frontmatter v2.4.0 → v2.4.1; plugin.json v0.3.0 → v0.3.1; server.cjs (lk- prefix + 검증 + kind 분기 + /join/local + wsLocalOnboardMd); scripts/join-local.cjs (NEW); dashboard app.js + style.css (kind radio + roleDescription + local 분기 + 모달 chip); WS-PROTOCOL-KEY-MGMT.md v0.2 → v0.3 IMPLEMENTED + §3.6 LocalKey; README badge + Current EN+KO; docs/index.html + docs/constellation.html badges; docs/shared/data.js v2.5.58 + shipCount 74; marketplace.json 0.3.5 + constellation v0.3.1; CHANGELOG. **모듈 version**: Constellation v2.4.0 → **v2.4.1** (patch bump, additive back-compat); plugin v0.3.0 → v0.3.1. **Wire 변경**: additive (v0.2 호출자 기본 kind=upstream + roleDescription=null 유지). **Self-application dogfood**: v2.5.57 패턴 재사용.

이전: v2.5.57 (2026-06-06) — Constellation v2.4.0 KEY-MGMT (WS-PROTOCOL-KEY-MGMT.md v0.2) — EstreUF #406 patch 완전 parity. Substantive cut: 5 canonical 메시지 (`KeyIssue` / `KeyList` / `KeyRevoke` / `KeyLabel` / `AgentNameChanged`) + 5-state machine (ISSUED → ACTIVE → REVOKED_PENDING → REVOKED → DELETED) + `key.json` 원자적 write + 14일 TTL default + main 전용 권한 게이팅 + 즉시/세션 유지 폐기 두 모드 + UI4 발급 패널 (⬆ 토글) + UI5 키 관리 모달 (목록 + 폐기 + 라벨 변경). `RegisterUpstreamKey` 는 transitional alias 보존 (§3.1 retirement schedule). EstreUF reference (#406 patch) 에서 distill — EG↔EstreUF 양방향 parity 전수조사 (workflow `wf_47ec564b-82d`, 21+7+13 항목 catalog, v2.5.57-66 roadmap) 의 첫 substantive cut. **v2.5.58 다음 cut**: Local key (`kind='local'`) + 역할 설명 (`roleDescription`) — UI 종류 선택 + 합류 에이전트 역할 안내 + 파일 경로 / 스크립트 호출 등록. **수정 파일 ~10**: [Constellation.md](Constellation.md) frontmatter v2.3.23 → v2.4.0 + protocol-line codicil; [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) v0.2.4 → v0.3.0; [constellation/reference/runtime/server.cjs](constellation/reference/runtime/server.cjs) (17 함수 + keyStore + 4 핸들러 + permission gating + WS upgrade/HELLO upstreamKey 보관 + keyOnConnClose); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js) (setupWsKeyMgmt + buildModal + renderTable + 7 새 handler + ⬆ 토글); [constellation/reference/dashboard/style.css](constellation/reference/dashboard/style.css) (.ws-key-modal/.ws-key-row/.ws-key-state CSS); [constellation/reference/WS-PROTOCOL-KEY-MGMT.md](constellation/reference/WS-PROTOCOL-KEY-MGMT.md) v0.1 DRAFT → v0.2 IMPLEMENTED + v0.3 트랙 명시; README badge + Current EN+KO; docs/shared/data.js v2.5.56 → v2.5.57 + shipCount 72 → 73; .claude-plugin/marketplace.json metadata 0.3.3 → 0.3.4 + constellation v0.2.4 → v0.3.0; CHANGELOG.md EN+KO. **모듈 version**: Constellation v2.3.23 → **v2.4.0** (minor bump), plugin v0.2.4 → v0.3.0. Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0, Ultrasafe v0.1.0 변경 없음. **프로토콜 wire 변경**: 5 신규 canonical 메시지 추가; transitional alias 보존으로 back-compat 확보. **Self-application dogfood**: KEY-MGMT 변경 self-board (port 27878) sandbox 에서 발견 + 검증 → inner reference 역류. **다음**: docs 사용 가이드 통합 (workflow `wd0bhh3qd` + Constellation use cases agent `a9b100b0d32d15b64`) 은 후속 cut.

이전: v2.5.56 (2026-06-06) — Constellation v2.3.23 대시보드 reference parity — upstream 초대 UI 가 collab 과 대칭 + onboard md 안에 "A2A vs 보드" 채널 가이드 인라인 + 닫힌 탭 카운터 항상 표시. EG 자체 보드 (port 27878) dogfood dual-board 설정에서 distill: (a) `UpstreamKeyIssued` 가 `joinUrl: "ws://host/ws?upstreamKey=<key>"` 포함 (기존 키만), (b) `/join/upstream?key=<uk-…>` HTTP 엔드포인트 추가 (기존 `/join/collab` 옆), (c) `wsUpstreamOnboardMd(host, key)` 헬퍼 추가 (`wsCollabOnboardMd` 와 대칭), (d) 두 onboard md 안에 정형 `wsChannelGuideMd()` 섹션 인라인 — 합류 에이전트가 모든 outbound CUSTOM 에 `targetAgentId` 명시하도록 안내 (4-케이스 분류표 + 4 권장 룰 + 3 anti-pattern), (e) 대시보드 `setupWsUpstream()` (⬆ 버튼) 가 `setupWsCollab()` (🔗) 과 대칭 — URL 복사 / 키만 복사 두 버튼 + `UpstreamKeyIssued` handler, (f) `#ws-arch-btn` 항상 표시 (기존 닫은 탭 0개일 때 자동 숨김 — 발견성 fix). **수정 파일 8**: [Constellation.md](Constellation.md) (frontmatter version + v2.3.23 protocol 라인); [plugins/constellation/.claude-plugin/plugin.json](plugins/constellation/.claude-plugin/plugin.json) (v0.2.3 → v0.2.4); [constellation/reference/runtime/server.cjs](constellation/reference/runtime/server.cjs); [constellation/reference/dashboard/app.js](constellation/reference/dashboard/app.js); [constellation/reference/dashboard/index.html](constellation/reference/dashboard/index.html); README badge + Current EN+KO; docs/index.html hero badge + Constellation 카드 module-tag; docs/constellation.html hero badge; docs/shared/data.js meta.version + shipCount 71 → 72; .claude-plugin/marketplace.json metadata.version 0.3.2 → 0.3.3 + constellation plugin version/description; CHANGELOG.md EN+KO. **모듈 version**: Constellation v2.3.22 → **v2.3.23**, plugin v0.2.3 → v0.2.4. Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0, Ultrasafe v0.1.0 변경 없음. 시드 tier v2.4.3 변경 없음. **프로토콜 wire 변경 없음** — `joinUrl` 은 기존 `UpstreamKeyIssued` value shape 의 추가, `/join/upstream` 은 기존 `/join/collab` 옆 새 endpoint. **Self-application dogfood**: 본 cut 의 reference runtime 변경은 `outer/collab-self/` (EG 자체 보드 sandbox) 에서 발견 + 라이브 검증 → inner reference 에 verbatim 적용. 자체 보드 dogfood 가 reference parity 의 trigger 가 된 첫 사례.

이전: v2.5.55 (2026-06-06) — Ultrasafe v0.1.0 첫 cut ship (5번째 옵션 모듈) + Greatpractice release-cadence 정식 macro entry 등록 (dual cut). **Ultrasafe** 는 출시 직전 / 갱신 직전 모의 침투 시험 모듈 — Superscalar-applied Workflow + 8 병렬 공격 에이전트 (v0.1.0 최소 fan-out) 가 3-layer 합성 보고서 (OSCAL + Hyperbrief IR + Greatpractice candidate) 산출. ≥3 iteration loop + 4-condition AND clean-signal gate. 17축 cross-domain 딥리서치 `reports/2026-06-05-ultrasafe-research/` backing. Advisory-only v0.1.x → blocking v0.2.x 단계 전환. **신규 파일 4**: [Ultrasafe.md](Ultrasafe.md) (2544 줄, §1-§13 + 부록 A-C); [plugins/ultrasafe/.claude-plugin/plugin.json](plugins/ultrasafe/.claude-plugin/plugin.json); [plugins/ultrasafe/README.md](plugins/ultrasafe/README.md); [docs/ultrasafe.html](docs/ultrasafe.html). **Greatpractice 정식 등록**: [`greatpractice/macro/release-cadence.md`](greatpractice/macro/release-cadence.md) 가 `_propose/release-cadence.draft.md` 에서 promote (v2.5.55 user steering trigger at N=1 evidence; mezzo 분해 8-candidate batch v2.5.56+ 예정). `_propose/release-cadence.draft.md` 가 1줄 redirect stub 으로 재작성. `greatpractice/INDEX.md` 갱신 (macro tier 1 → 2 entries). **N-way sync**: README badge v2.5.54 → v2.5.55 + "four optional modules" → "five" (EN + KO 둘 다) + 신규 Ultrasafe bullet (EN + KO) + Greatpractice bullet 갱신 (정식 등록 명시) + plugin install line 갱신; docs/index.html hero badge + module count 4 → 5 + Ultrasafe card Greatpractice 와 Constellation 사이에 배치 (Super → Hyper → Great → Ultra → Constell 순서); docs/{constellation,hyperbrief,superscalar,greatpractice,ultrasafe}.html nav 순서 Super → Hyper → Great → Ultra → Constell; docs/shared/data.js meta.version + shipCount 70 → 71; CHANGELOG.md EN + KO 항목; .claude-plugin/marketplace.json metadata.version 0.3.1 → 0.3.2 + ultrasafe plugin 추가. **프로토콜 wire 변경 없음** — Constellation/Superscalar/Hyperbrief spec 변경 없음 (Ultrasafe 가 Constellation §13.16.9 A2A intent 확장을 v0.2+ future work 으로 참조). 시드 tier 는 **v2.4.3** 유지. 최근 모듈 cut: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0 (release-cadence v2.5.55 정식 등록), **Ultrasafe v0.1.0**.

이전: v2.5.54 (2026-06-05) — Hyperbrief 문서 L1.1.1.I 톤 일관 재렌더링 + candidate #7 사양 정정. v2.5.53 cycle 의 연속 — 사용자 입력으로 candidate #7 (톤축 용어 병기) 사양 두 정정 추가: (a) C (대화) 범위는 구조적으로 소급 적용 (retroactive) 대상 외, prompt/Y/N 모두 영향 없음; (b) I (첫만) 모드 안에서 용어 사용 빈도 ≤ 3건이면 매번 병기 ("낮은 빈도 발동, low-frequency override") — 작성자 인지 부담 + 회상 어려움 + Hyperbrief brief 9-section 사이 거리 고려한 균질화. **수정 파일 5**: [_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md](_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md) — candidate #7 spec 의 §2.4 에 "I 모드의 낮은 빈도 발동" 절 추가; [plugins/hyperbrief/QUICK-START.md](plugins/hyperbrief/QUICK-START.md) — 88 줄 → 92 줄 재렌더링 (≤3 use 용어 매번 병기 적용 — trigger-check / Node / hook / ajv / MUST-trigger / MD / JSON / HTML / BlockedStub / smoke test 등); [plugins/hyperbrief/TROUBLESHOOTING.md](plugins/hyperbrief/TROUBLESHOOTING.md) — 168 줄 → 173 줄 재렌더링 (≤3 use 용어 매번 병기 — matcher / trigger-check / sidecar / vendoring / fallback / diff / placeholder / clean install / schema validation / determinism 등); README.md (badge + Current 라인 EN+KO 본 entry); docs/index.html (hero badge); docs/shared/data.js (meta.version + shipCount 69→70); CHANGELOG.md (본 entry EN+KO). **프로토콜 wire 변경 없음, schema 변경 없음, plugin runtime 변경 없음** — 순수 사양 정정 + 문서 재렌더링. Hyperbrief 모듈 version 변경 없음 (v0.5.6 유지). Lens B 점수 변동 없음 (재렌더링은 docs maturity 같은 dim 안 보강 — v2.5.53 의 +2 pts 유지). 시드 tier 는 **v2.4.3** 유지. 최근 모듈 cut: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0.

이전: v2.5.53 (2026-06-05) — Hyperbrief 문서 성숙도 보강 + v0.6 사전 후보 정리표. Hyperbrief.md §11.5 readiness rubric 기준 현재 Lens B (Claude marketplace 등록) 점수 5.5 simple / 5.1 weighted (threshold 7.5). 본 cut 은 docs maturity 차원 (7/10) 발판. **신규 파일 3**: [plugins/hyperbrief/QUICK-START.md](plugins/hyperbrief/QUICK-START.md) — 한 페이지 빠른 시작 (30초 mental model + 3단계 install + 첫 brief 흐름); [plugins/hyperbrief/TROUBLESHOOTING.md](plugins/hyperbrief/TROUBLESHOOTING.md) — 운영 FAQ 카탈로그 T-1..T-8 (hook 조용한 skip / settings.json 승인 게이트 / ajv 버전 어긋남 / Constellation off 4-way fallback / 버튼 지역화 / 결정성 깨짐 / sidecar 경로 / surface profile mismatch) + 5 한 줄 FAQ; [_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md](_proposals/006_2026-06-03_hyperbrief/v06-candidates-triage.md) — 스키마 후보 정리표, 7 후보 분류 (4 → v0.6 / 3 → v0.7+ / 0 → 거절), 각 후보 사양 sketch 포함 (v2.5.53 cycle 사용자 입력 으로 신규 후보 #7 추가 — 톤축 용어 병기 E/I/N + 범위 C/D/B/R/A + 소급 적용 Y/N/prompt + 짧은 명령 형식 `L1.I.C` / `L1.E.A`). **수정 파일 1**: [Hyperbrief.md](Hyperbrief.md) 가 §11.5.6 v0.6 후보 정리표 절 추가 — triage 문서를 운영 SSoT 로 가리킴. Schema 변경 없음, plugin runtime 변경 없음, 프로토콜 wire 변경 없음 — 순수 문서 + triage 등록표 cut. Lens B simple mean 예상 변동: ~5.5 → ~5.8 (docs +2/6 dim). 시드 tier 는 **v2.4.3** 유지. 최근 모듈 cut: Constellation v2.3.22, Superscalar v0.4.2, **Hyperbrief v0.5.6** (§11.5.6 등록표 추가), Greatpractice v0.1.0.

이전: v2.5.52 (2026-06-05) — Greatpractice _propose/ release-cadence draft revision (hub 9-item schema + 0.4.0 N=1 evidence 통합). v2.5.51 cycle 의 연속: hub 가 9-item Pre-Publish checklist 의 각 항목 trigger/then schema (hub `m-hub-gp-040-evidence-1780653318567`) + 신선한 post-codify data point (EstreUX 0.4.0 publish 2026-06-05, 0 omissions vs 0.3.0 baseline 4 omissions, N=1 에서 100% reduction) 공유. Draft revision: §2 가 integrated 11-item body (9 hub-core + 2 EG-conditional naming/auth, cross-mapped EG # ↔ Hub # 번호) 보유; 신규 §4.4 Post-Codify Evidence Accumulation Log + N=1/N=2/N=3 tracker; §7 Status Tracker 갱신 (`blocking_items[0]` RESOLVED, body capture "initial" → "v2.5.52 hub schema integrated"). Frontmatter source_evidence + revision_history + audit_trail 갱신; `_propose_state.post_codify_evidence` block 추가. **Light cut** — `greatpractice/_propose/release-cadence.draft.md` revision only (215 → ~310 lines, +95); 신규 ratified entry 없음; 모듈 version 변경 없음 (Greatpractice v0.1.0). Promotion target 유지 — v2.5.5X or v2.6.0 when N≥2-3 post-codify cycle 0 omission 유지 OR user steering OR hub 양방향 cross-link trigger. Self-application dogfood: 본 v2.5.52 cut 의 N-way sync 가 11-item checklist 를 EG-side (npm 미포함 release — 항목 5/6/8/10/11 conditional-skip) 에서 실측. 시드 tier 는 **v2.4.3** 유지. 최근 모듈 cut: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0.

이전: v2.5.51 (2026-06-05) — Greatpractice _propose/ draft cut — release-cadence candidate (hub↔EG first dogfood cycle). 메모리 기반 practice-codification 의 첫 dogfood cycle: hub-side EstreUX 0.3.0 npm 첫 publish "quiet omission" incident (version bump 누락 + README stale + NOTICE 누락 + bin invalid, user 직접 catch + hub release.md cd5e6be 9-item ratified checklist codify) + EG-side phase_3 cycle 의 16+ docs/promo sync miss 누적 = 결합 evidence 를 [greatpractice/_propose/release-cadence.draft.md](greatpractice/_propose/release-cadence.draft.md) (215줄, maturity 23/25 ≥ 18 threshold, notability gate 3-criterion 통과, phronesis_boundary 외) 에 통합. Cross-axis convergence (sre release-preflight + humanities Gawande WHO + management standard work + canonical dual-mode-edit) 4-isomorphism. Hub release.md = sister surface (hub-scale instance per Greatpractice §10.4 "Schema only" adoption mode). greatpractice/macro/release-cadence.md 로 promote 는 v2.5.5X cut 으로 보류 — 추가 evidence (post-codify sync-miss recurrence rate 감소) OR user steering OR hub 양방향 cross-link trigger 후. 본 v2.5.51 cut 은 의도적으로 light — _propose draft + version bumps 만; 신규 ratified entry 없음, 플러그인 변경 없음. 모듈 version 변경 없음 (Greatpractice v0.1.0). 시드 tier 는 **v2.4.3** 유지. 최근 모듈 cut: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, Greatpractice v0.1.0.

이전: v2.5.50 (2026-06-04) — Greatpractice v0.1.0 첫 cut ship (4번째 옵션 모듈). Greatpractice 는 반복 작업 관행을 3-tier 계층 (macro/mezzo/micro) 에 codify 하는 discipline 모듈로, 9축 cross-domain 딥리서치 (harness · humanities · psychology · management · processor · os · sre · memoization · canonical — [reports/2026-06-04-greatpractice-research/](reports/2026-06-04-greatpractice-research/) 참조) 가 backing. v0.1.0 첫 cut ship: [Greatpractice.md](Greatpractice.md) spec (2220 줄, §1-§12 + 부록 A-C) + [greatpractice/_schema.md](greatpractice/_schema.md) entry frontmatter spec + [greatpractice/INDEX.md](greatpractice/INDEX.md) chunk summary + 1 ratified mezzo entry [outbox-json-validation](greatpractice/mezzo/outbox-json-validation.md) + 1 micro atom [outbox-append-json-roundtrip](greatpractice/micro/outbox-append-json-roundtrip.md) + [plugins/greatpractice/](plugins/greatpractice/) scaffold (3 JSON schema + 1 PreToolUse contact hook). 5-axis multi-criteria maturation gate (frequency + depth + recency + cost + predictability) 가 단순 frequency 합의를 대체. `phronesis_boundary` field 가 judgement-heavy work 의 codify-금지 영역을 명시 (humanities §3.9). v0.2-0.4 roadmap = manifest hash + renderers + voice linter + MESI multi-agent coherence + CMMI L4 effectiveness measurement. 시드 tier (Master + Lite + Compact × EN/KO) 는 **v2.4.3** (2026-06-03). 최근 모듈 cut: Constellation v2.3.22, Superscalar v0.4.2, Hyperbrief v0.5.6, **Greatpractice v0.1.0**.

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
