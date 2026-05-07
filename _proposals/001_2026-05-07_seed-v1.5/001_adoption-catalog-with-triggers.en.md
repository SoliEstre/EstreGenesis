# Proposal 001 — Adoption Catalog with Triggers

> Concrete operation of the partial-adoption discipline. Without a named meta-pattern, every adopting project that picks "only some" of the seed standards either drops the rest silently (and forgets why they were dropped) or copy-pastes the rejection rationale across separate notes that drift.

## Why this is needed

Seed v1.4 already follows an additive-not-destructive philosophy in **Migration Guides** — adopting projects are explicitly told that they may pick portions of the standard. In practice, picking portions is the common case: many projects need `_lessons/` and `PM/` immediately but find `_coordination/` / `_contracts/` / `_questions/` premature for their team size or interface complexity.

The body, however, leaves a gap: *how does the adopting project remember why it skipped the rest, and when to revisit?* Two failure modes follow:

1. **Silent drift** — the project applies a partial subset, then forgets the rejection criteria. Years later a new agent re-evaluates the same standard and either re-adopts blindly or re-rejects without a record.
2. **Scattered rationale** — the project writes the rejection criteria in commit messages, ad-hoc planning docs, or AGENTS.md prose. Each location ages differently; none is the single source of truth.

A simple, named meta-pattern resolves both: **partial adoption with trigger preservation** — record, in one durable artifact, *what was deferred*, *why it was deferred*, *what condition would trigger adoption*, and *what work that adoption would entail*.

## The meta-pattern

When applying any seed standard family with multiple options, the adopting project:

1. Adopts the options that earn their cost in the project's *current* operating shape.
2. Defers the remaining options.
3. Captures each deferred option in a single **trigger table** with these columns:

| # | Option | Anchor (where it would mount) | Trigger (when to adopt) | Adoption work (what to scaffold) |
| --- | --- | --- | --- | --- |

4. Stores the trigger table in a stable location — under `PM/` is recommended, since trigger-driven adoption is conceptually a multi-step task with a deferred "begin" step.

5. When a trigger condition fires, the row is consulted, the adoption work is performed, and the row is marked DONE in the table (or moved to a separate completed-rows section).

## Real adoption case

An EstreUI-adopting host project applied seed v1.4 and adopted only `_lessons/` and `PM/`. It captured the other five standard areas (`rules.md`, `architecture.md`, `_coordination/`, `_contracts/`, `_questions/`) in `PM/001_seed_migration_triggers.md` with rejection rationales tied to *the project's current operating shape*:

- **Single-agent operation** → `_coordination/` / `_questions/` would not earn their cost.
- **AGENTS.md kept compact** (9-rule §3 covers all current policy) → `rules.md` separation would obscure rather than clarify.
- **Architecture body lives in the adopted library's docs folder** → a separate `architecture.md` is premature until host-specific architecture (routing, service worker, external integrations) accumulates enough mass.

When any of those operating-shape conditions later changes (a second agent joins, AGENTS.md §3 grows past ~50 lines, host-specific architecture accumulates), the row in `PM/001` is the entry point — no re-derivation, no re-discovery.

## The option catalog (proposed v1.5 absorption)

The meta-pattern naturally absorbs all the smaller proposals 002 ~ N from the same bundle and from future bundles. Rather than scatter each option as its own seed-body section, v1.5 can carry **one Adoption Catalog table** that lists every name-able option together:

| # | Option | Trigger (when to adopt) | Anchor in `.agent/` | Adoption work |
| --- | --- | --- | --- | --- |
| A | `_lessons/` (troubleshooting ledger) | 30+ minute blockers or non-obvious behaviors recur. | `.agent/<role>/_lessons/` | Folder + README with template + index. |
| B | `PM/` (multi-step task tracker) | Tasks span more than one sitting or have DEFERRED options. | `.agent/<role>/PM/` | Folder + README + numbered task files. |
| C | `_coordination/` (multi-agent STATE/HANDOFF/CHANGELOG) | Two or more agents working on the same repo concurrently. | `.agent/<role>/_coordination/` | STATE.md + HANDOFF.md + CHANGELOG.md + AGENTS.md coordination section. |
| D | `_contracts/` (interface contracts) | Cross-part interfaces (API, events, types) edited together in single commits with growing frequency. | `.agent/<role>/_contracts/` | api/ events/ types/ subfolders with DRAFT → REVIEW → ACTIVE lifecycle. |
| E | `_questions/` (async Q&A) | With option C — single-agent operation gives this no value. | `.agent/<role>/_questions/` | open/ resolved/ subfolders + priority rules. |
| F | `rules.md` (work rules) | AGENTS.md §3 grows past ~50 lines or workspace-specific rules diverge from project-wide AGENTS. | `.agent/<role>/rules.md` | Markdown file + AGENTS.md §1 row. |
| G | `architecture.md` (tech stack & shape) | Host-specific architecture (routing, SW, external integrations) accumulates enough that the existing library docs are no longer the right home. | `.agent/<role>/architecture.md` | Markdown file with diagrams + external-deps list. |
| H | `open-implementation-markers.md` (deferred-marker punch list) | `// TODO` / `// FIXME` / inline-comment markers scatter across code and a punch list earns its cost. | `.agent/<role>/open-implementation-markers.md` | Single markdown with same-commit-removal discipline. |
| I | `legacy-design-rationale.md` (set-aside design preservation) | Commented-out old code accumulates in source files and readability drops. | `.agent/<role>/legacy-design-rationale.md` | Single markdown with revival/permanent-drop discipline. |
| J | `archive/` (external-conversation by-date) | External-interface negotiations span multiple rounds and pre-contract conversation has preservation value. | `.agent/<role>/archive/` | Folder + dated-prefix file convention + README. |
| K | `adaptation-map.md` (external-library use mapping) | The project's own code increasingly uses an external library and a "what-of-mine-uses-what-of-theirs" map earns its cost. | `.agent/<role>/adaptation-map.md` | Single markdown. |
| L | bilingual docs parallel (`*.en.md` + `*.ko.md`) | Public-facing docs need to support multiple working languages. | every doc that becomes public-facing | parallel files convention, README split. |
| M | `review/` + `roadmap/` split | Found-bug list and planned-improvement list both accumulate enough that a single list is unmanageable. | `.agent/<role>/review/` + `.agent/<role>/roadmap/` | Two folders + READMEs as dashboards. |
| N | lint indexes spec | Index ↔ file consistency drifts often enough that automation pays back. | repo root or `.agent/lint.mjs` | Lint script + check-list spec. |
| O | upstream-vs-local + style-guide pair | The project operates as a library + reference-host hybrid. | proposal 002 / 003 territory | Two markdowns (file-origin classifier + sanitization rules). |

Rows A ~ G are the seed v1.4 standards (already named in the body, this catalog just centralizes them). Rows H ~ O are net-new options proposed by this bundle and the cases that follow it.

The catalog is a **menu**, not a checklist. An adopting project picks rows that earn their cost *now* and writes a `PM/NNN_seed_migration_triggers.md` that lists the unpicked rows verbatim. Future bundles extend the catalog with new rows — never deprecate existing rows in place; mark them with a "superseded by" note instead.

## Where to mount in the seed body

Recommended location: a new chapter immediately after **Migration Guides**, titled **Adoption Catalog with Triggers**. Migration Guides is the right neighbor because both chapters concern *how* a project adopts the seed.

The chapter itself runs short — the table is the bulk, the prose is just the meta-pattern statement and a one-paragraph reference back to Migration Guides' additive-not-destructive principle.

## Affected existing seed sections

- **Migration Guides** — add a one-line forward reference to the new chapter at the section head.
- **Phase 3 (Document Management Structure)** — proposal 002 plugs in here; the catalog rows about `.agent/` folder shape link out to 002.
- **Index Synchronization Policy** — row N (lint indexes spec) links here; if the policy gains a "spec" appendix, that is the destination.

## Migration cost for the seed

Net-add only. No existing chapter is rewritten. Adopting projects already on v1.4 see this catalog as additive — they read the catalog, find their existing `_lessons/` and `PM/` rows already represented, and gain the option to scaffold any of the new rows when triggers fire. Projects on v1.5+ that bootstrap fresh start by reading the catalog instead of the original Phase 3 + Migration Guides sequentially.

## Reverse references

- The trigger-table-as-PM-task pattern: case in the bundle author's private host project (commit hashes available on request — search the bundle author's host repo).
- Migration Guides additive-not-destructive principle: existing seed body, near line 1194.
