# Proposal 001 — Bootstrap Residency and Adoption Catalog

> Concrete operation of partial adoption, with one extra first step for v1.5: before choosing `.agent/` documents, decide where the agent documents live relative to the source repository.

## Why this is needed

Seed v1.4 already follows an additive-not-destructive philosophy in **Migration Guides**. Adopting projects may pick portions of the standard and preserve existing workflows. In practice, partial adoption is common: many projects need `_lessons/` and `PM/` immediately but find `_coordination/`, `_contracts/`, or `_questions/` premature for their team size or interface complexity.

The v1.5 proposal review surfaced a higher-order gap: sometimes the current working folder is not, and should not become, the source repository. A public source repo, a collaboration repo, or a repo owned by another organization may need a separate private agent-docs repo. If the seed asks only "which `.agent/` folders should we scaffold?", it misses the more important first question: **where should agent/developer operation documents reside?**

Two failure modes follow:

1. **Silent partial-adoption drift** — the project adopts a subset, forgets why the rest was deferred, then re-evaluates the same choices later without a record.
2. **Wrong repo residency** — private planning, agent notes, or sanitized case material are created inside a public/collaboration source repo because the bootstrap assumed source and agent docs share one repo.

v1.5 should name both controls:

- **Bootstrap residency check** — decide whether the current folder is the source repo, a private agent-docs sidecar repo, or a multi-project orchestration repo.
- **Partial adoption with trigger preservation** — record deferred options, rationale, trigger, and adoption work in one durable trigger table.

## Initial bootstrap mode

Before Phase 3 asks about document folders, the seed should ask the user which bootstrap style to use:

1. **Minimal bootstrap (recommended)** — inspect the current folder, git state, remotes, and obvious repo shape; ask only when the decision is ambiguous.
2. **Full manual setup** — ask every repo residency, source-location, upstream, public/private boundary, and multi-project orchestration question explicitly.
3. **Repo provider assisted setup** — use a repo provider, local git metadata, or a user-provided repo list to infer the setup before asking manual questions.

Provider-assisted setup must not be GitHub-only. Supported sources:

- GitHub
- GitLab
- Bitbucket
- Azure DevOps
- Gitea / Forgejo / self-hosted Git
- Local git remotes scan
- User-provided repo list or repo summary

Security rule: do not ask the user to paste passwords or raw access tokens into chat. For private repo access, prefer an installed connector, an authenticated CLI, or a user-provided repo summary. For public repos, usernames, org names, and repo URLs are enough.

If provider-assisted setup cannot classify the repo shape confidently, fall back to a two-choice prompt:

- Minimal bootstrap (recommended)
- Full manual setup

## Empty-or-seed-only folder check

When the current working folder is empty, contains only the seed prompt, or contains files with no concrete project work yet, run this check before scaffolding:

1. Is this working folder intended to be a **developer/agent-docs-only repo**?
2. If yes, is the source project already present under this folder, present at another local path, remote-only, or not created yet?
3. Does the source repo already exist locally or remotely, or should the bootstrap create a new source project?

Tool access warning:

- Workspace-limited agents such as Antigravity IDE or GitHub Copilot may not be able to read outside the opened workspace. If the source project is outside the workspace, tell the user to move it under the working folder or link it there.
- Claude Code and Codex can often access external paths, but the agent must still verify actual read/write access before relying on that path.

If the user later says the source project folder is now inside the current workspace, the agent verifies that the folder exists. If it is a separate source repo or linked project folder that should not be committed into the agent-docs repo, add its root-relative path to the root `.gitignore` automatically. Do not add guessed paths before the user identifies the folder. Do not duplicate existing ignore entries. If the user wants the source folder tracked as a submodule/gitlink, do not add it to `.gitignore`.

## The meta-pattern

When applying any seed standard family with multiple options, the adopting project:

1. Adopts the options that earn their cost in the project's current operating shape.
2. Defers the remaining options.
3. Captures each deferred option in a single **trigger table** with these columns:

| # | Option | Anchor (where it would mount) | Trigger (when to adopt) | Adoption work (what to scaffold) |
| --- | --- | --- | --- | --- |

4. Stores the trigger table in the current scope's `PM/` folder. For a single-project setup this is `.agent/PM/`; for a multi-project orchestration setup it may be `.agent/<unit-project-name>/PM/`.
5. When a trigger condition fires, the row is consulted, the adoption work is performed, and the row is marked DONE or moved to a completed-rows section.

## Scope roots

The catalog uses `<scope-root>` to avoid hard-coding one layout:

| Situation | `<scope-root>` |
| --- | --- |
| Single source repo with agent docs in the same repo | `.agent/` |
| Agent-docs-only sidecar repo for one source project | `.agent/` |
| Multi-project orchestration repo | `.agent/<unit-project-name>/` |
| Upstream split inside one selected scope | `<scope-root>/project/` for local/project context, `<scope-root>/upstream/` or `<scope-root>/<upstream-name>/` for upstream context |

Default single-project adoption remains flat under `.agent/`. Do not introduce `<unit-project-name>/`, `project/`, or `upstream/` folders unless their trigger applies.

## The option catalog (proposed v1.5 absorption)

The catalog is a **menu**, not a checklist. An adopting project picks rows that earn their cost now and writes a `PM/NNN_seed_migration_triggers.md` for deferred rows.

| # | Option | Trigger (when to adopt) | Anchor | Adoption work |
| --- | --- | --- | --- | --- |
| A | `_lessons/` (troubleshooting ledger) | 30+ minute blockers or non-obvious behaviors recur. | `<scope-root>/_lessons/` | Folder + README with template + index. |
| B | `PM/` (multi-step task tracker) | Tasks span more than one sitting or have deferred options. | `<scope-root>/PM/` | Folder + README + numbered task files. |
| C | `_coordination/` (multi-agent STATE/HANDOFF/CHANGELOG) | Two or more agents work on the same repo concurrently. | `<scope-root>/_coordination/` | STATE.md + HANDOFF.md + CHANGELOG.md + AGENTS.md coordination section. |
| D | `_contracts/` (interface contracts) | Cross-part APIs, events, or types change together often enough that a written contract pays back. | `<scope-root>/_contracts/` | api/ events/ types/ subfolders with DRAFT → REVIEW → ACTIVE lifecycle. |
| E | `_questions/` (async Q&A) | Option C is adopted and questions need durable async routing. | `<scope-root>/_questions/` | open/ resolved/ subfolders + priority rules. |
| F | `rules.md` (work rules) | AGENTS.md grows too large or scope-specific rules diverge from project-wide rules. | `<scope-root>/rules.md` | Markdown file + AGENTS.md read-order entry. |
| G | `architecture.md` (tech stack and shape) | Scope-specific architecture accumulates enough that existing docs are no longer the right home. | `<scope-root>/architecture.md` | Markdown file with diagrams + external dependency list. |
| H | `source-map.md` (source repo locator) | Agent docs live outside the source repo, or one agent-docs repo points to multiple source repos. | `<scope-root>/source-map.md` | Record source repo URL/path, branch, local checkout, access notes, and current source commit. |
| I | `public-boundary.md` / `style-guide.md` | Source repo is public/collaborative, or docs may be promoted from private agent notes to public docs. | `<scope-root>/public-boundary.md` or `<scope-root>/style-guide.md` | Sanitization and no-leak rules for names, domains, services, tenants, and examples. |
| J | Agent-docs `.gitignore` guard | A separate source folder is placed or linked under the agent-docs repo. | root `.gitignore` | After user identifies the folder, verify it exists and add its root-relative path unless it is a submodule/gitlink. |
| K | Multi-project orchestration folders | One agent-docs repo operates several independent project repos. | `.agent/<unit-project-name>/` | Ask whether to use per-project scope folders; create one scope root per independent project. |
| L | Upstream split | The developer operates or can write to an upstream repo, and upstream-bound changes are first implemented in the current project. | `<scope-root>/upstream/` + `<scope-root>/project/` by default | Create upstream and project folders; allow a user-provided upstream folder name. |
| M | `upstream-vs-local.md` | Upstream-bound and local-only files need mechanical classification. | `<scope-root>/project/upstream-vs-local.md` | Classifier table with path pattern, origin, sync direction, and modification policy. |
| N | Mirror sync policy | Upstream docs/files are mirrored into the current agent-docs scope for search/read convenience. | `<scope-root>/upstream/` or `<scope-root>/<upstream-name>/` | One-way copy/sync discipline; record upstream commit hash in sync commits or sync log. |
| O | `archive/` (external conversation by date) | External-interface negotiations span multiple rounds and pre-contract conversation has preservation value. | `<scope-root>/archive/` | Folder + dated-prefix file convention + README. |
| P | `open-implementation-markers.md` | TODO/FIXME/deferred markers scatter across code and a punch list earns its cost. | `<scope-root>/open-implementation-markers.md` | Single markdown with same-commit-removal discipline. |
| Q | `legacy-design-rationale.md` | Commented-out or set-aside designs need preservation without staying in source files. | `<scope-root>/legacy-design-rationale.md` | Single markdown with revive/permanent-drop lifecycle. |
| R | `adaptation-map.md` | The scope increasingly uses an external library and a use map earns its cost. | `<scope-root>/adaptation-map.md` | Single markdown mapping local usage to external/library surfaces. |
| S | Bilingual docs parallel (`*.en.md` + `*.ko.md`) | Public-facing docs need multiple working languages. | every public-facing doc | Parallel file convention and README index split. |
| T | `review/` + `roadmap/` split | Bug/review findings and planned improvements both accumulate enough that one list is noisy. | `<scope-root>/review/` + `<scope-root>/roadmap/` | Two folders + READMEs as dashboards. |
| U | lint indexes spec | Index ↔ file consistency drifts often enough that automation pays back. | repo root or `<scope-root>/lint.mjs` | Lint script + checklist spec. |

Rows A-G are the existing seed standards, expressed through `<scope-root>`. Rows H-U are v1.5 additions or clarifications produced by this bundle review.

## Real adoption case

An upstream-adopting host project applied seed v1.4 and adopted only `_lessons/` and `PM/` at first. It captured the other standard areas in a trigger table with rejection rationales tied to the project's current operating shape:

- Single-agent operation → `_coordination/` / `_questions/` would not earn their cost.
- Compact AGENTS.md → `rules.md` separation would obscure rather than clarify.
- Architecture body lived in the adopted library's docs folder → a separate host-specific `architecture.md` was premature.

The v1.5 review generalizes that lesson: the trigger table still works, but it must be mounted after the bootstrap residency decision has chosen the correct `<scope-root>`.

## Where to mount in the seed body

Recommended location:

1. Add **Bootstrap Residency Check** before Phase 3, after the initial bootstrap/migration mode selection.
2. Add **Adoption Catalog with Triggers** near Phase 3, with a short forward reference from Migration Guides.
3. Update Phase 3 so the default `.agent/` shape is explicitly the single-project default, not the only valid residency shape.

## Affected existing seed sections

- **Bootstrap / Migration mode branching** — add the minimal/manual/provider-assisted setup choice.
- **Phase 3 (Document Management Structure)** — consume the chosen `<scope-root>` and link to proposal 002's shape decision tree.
- **Migration Guides** — add a forward reference to the catalog for partial adoption and trigger preservation.
- **Index Synchronization Policy** — row U links here; if the policy gains a lint/spec appendix, that is the destination.

## Migration cost for the seed

Mostly additive, but not purely net-add: existing templates that hard-code `.agent/rules.md`, `.agent/architecture.md`, `.agent/_coordination/STATE.md`, or `.agent/PM/` must either preserve the flat default or become `<scope-root>`-aware when a non-default layout is chosen. The default path remains unchanged for ordinary single-project bootstraps.

## Reverse references

- Trigger-table-as-PM-task pattern: case in the bundle author's private host project (hash-only references available out-of-band).
- Empty/source-sidecar and workspace-boundary concerns: seed maintainer review of this bundle, 2026-05-07.
- Migration Guides additive-not-destructive principle: existing seed body, near line 1194.
