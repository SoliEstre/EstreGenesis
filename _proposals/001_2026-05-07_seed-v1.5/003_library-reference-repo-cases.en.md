# Proposal 003 — Library + Reference-Host Hybrid Operation Cases

> Five operational patterns specific to Scenario 3 (`host that mirrors a library's docs`) and Scenario 4 (`library + reference host hybrid`) from proposal 002. The seed body has no equivalent guidance today; adopting projects in these scenarios re-derive each pattern.

## Why this is needed

Proposal 002 names the shapes. This proposal fills in *the operational rules that those shapes need to function*: how the mirror stays consistent, how documents are classified by origin, how external negotiations are archived on both sides, why preserved design rationale matters specifically for libraries, and how the library's own public docs avoid leaking adopter identifiers.

Each pattern below corresponds to one or more rows in the Adoption Catalog from proposal 001. They are described together here because they share a common context (library + reference-host operation) and reference each other operationally.

## Pattern 1 — Mirror sync policy

> Concrete operation: when host `<library-name>/` exists as a one-way pull from the upstream library repo, *both* the upstream and the host commit must be considered when reading the docs.

**The rule.** The upstream library repo is the **single source of truth** for files under `<library-name>/`. The host's mirrored copy is a read-optimization for agents working in the host repo — it shortens grep paths but never authors content.

**Sync trigger.** Any commit to upstream library docs (file add / rename / substantial rewrite) triggers a host-side mirror sync in the same author's next host-side commit. The host commit message names the upstream commit hash for traceability.

**Conflict resolution.** Upstream wins. If the host needs to record host-specific deviation, it goes into `project/upstream-vs-local.md` (Pattern 2), not into the mirrored file.

**Tooling.** A mirror-sync helper script (host-side) reads upstream HEAD and copies files into `<library-name>/`. The script is intentionally simple — file copy, not merge — because the host never authors in this folder.

**Real adoption case.** An EstreUI-adopting host project syncs `.agent/estreui/` from the public EstreUI repo. Each host-side mirror sync commit names the upstream commit hash in its message ("Synced upstream …"). The pattern survived ~50+ upstream commits (dark mode, quick panel, noti banner, timeline, etc.) without merge friction because the host's `project/` folder is fully outside the mirrored region.

## Pattern 2 — `upstream-vs-local.md` — file-origin classification

> Concrete operation: a single classifier table tells agents whether a given file in the host repo is mirror-from-upstream or host-own.

**The rule.** Maintain `project/upstream-vs-local.md` as a classifier table:

| Path pattern | Origin | Sync direction | Host-side modification policy |
| --- | --- | --- | --- |
| `<library-name>/**` | mirror | upstream → host (one-way pull) | forbidden — modify upstream and resync |
| `project/**` | host-own | none | free |
| `scripts/<library-files>` | mirror | upstream → host | forbidden |
| `scripts/<host-files>` | host-own | none | free |
| `styles/<library-files>` | mirror | upstream → host | forbidden |
| `styles/<host-files>` | host-own | none | free |

**Why a separate file.** This classification is the *prerequisite* for Pattern 1. Without it, an agent making a code change does not know whether to push the change upstream first or to commit it host-side. The table makes the answer mechanical.

**Maintenance.** When the project structure changes (new mirrored module, new host-only file family), update this table in the same commit as the structure change.

**Real adoption case.** An EstreUI-adopting host project keeps `project/upstream-vs-local.md` and grew it row-by-row as new framework files joined the mirror set. The table doubles as the lint script's input — checks like "if this commit modifies a mirrored file, was the corresponding upstream commit also recorded?" become possible because every file's origin is one table lookup away.

## Pattern 3 — Dual archive (host-side + library-side mirroring of conversations)

> Concrete operation: when host and library negotiate (e.g., an external embed integration spec across multiple rounds), *both* sides keep an archive folder. Neither side is authoritative in isolation; together they reconstruct the negotiation.

**The rule.** When the negotiation is a single-source-of-truth document family (specs, contracts, proposals), pick one side as the master and have the other side keep a redirect-only stub. When the negotiation is a *conversation* — replies, reviews, decisions made round-by-round — both sides keep the full record. Conversations are inherently two-sided and asymmetric archives lose context.

**File naming.** Each side uses `archive/` (Adoption Catalog row J) with date-prefixed filenames (`YYYY-MM-DD_<topic>.md`). When the same round shows up in both archives, file names are aligned so that "round 3 of topic X" lands at the same filename on both sides.

**Privacy interaction.** When one side is private and the other public, the private side carries the full conversation; the public side carries only sanitized cards (decision outcomes, no internal identifiers). Pattern 5 governs the sanitization rules.

**Real adoption case.** An external chat library and the EstreUI-adopting host project negotiated an embed integration spec across five rounds (v1 ~ v5). Each round produced a reply on the host side and an updated spec on the library side. The host's `project/archive/` carries the host-authored replies; the library carries the spec versions; the round numbers align across both archives. When a question came up about why a particular field was renamed, both sides could grep their archive by date and find the matching round.

## Pattern 4 — `legacy-design-rationale.md` value on the library side

> Concrete operation: a public library that preserves *why* it set a design path aside (in addition to *what* the path was) earns adopter trust at low cost.

**The rule.** When a library replaces an old design with a new one, do not just delete the old code. Move the old code to `library/legacy-design-rationale.md` along with: what the design tried to do, why the project chose a different path, when it might come back, and a self-contained snippet so a future maintainer can revive it without git archaeology.

**Why this matters more for libraries than for hosts.** A host's old code only matters to the host's own future agents. A library's old code may matter to *every adopter who ever evaluates whether the library has a feature they need*. An adopter searching the library for "did this ever do X?" finds the rationale doc and gets a complete answer (yes, it was sketched, here is why we chose not to ship it, here is the snippet). That converts a "no, this library can't do X" rejection into a "we know how to do X but chose not to — here's the trade-off" conversation.

**Lifecycle.**

- *Revive*: pull the snippet from the rationale doc, restore it, remove the entry.
- *Permanently drop*: delete the entry. The doc only carries living motivations.

**Real adoption case.** An EstreUI-adopting host project authored a library-side `legacy-design-rationale.md` for a dynamic root-tab fetch design that the framework set aside in favor of static markup conventions. The single entry preserves the JSON shape the old design expected, the boot-time call site, and the external dependencies a revival would need to verify. Future adopters who need server-driven menu structures can find this entry and start there. (See EstreUI public repo, file `.agent/estreui/legacy-design-rationale.{en,ko}.md`.)

## Pattern 5 — Public-docs sanitization (`style-guide.md`)

> Concrete operation: when a library's public docs include code examples, those examples must not leak the identifiers of any private host that adopts the library.

**The rule.** Maintain `project/style-guide.md` as a substitution policy:

- Service / brand names → neutral roles (`<host-application>`, `<embedded-library>`).
- Domain names → example domains (`host.example.com`, `embed.example.com`).
- Class / function names that bake in business domain → generic role names.
- Identifier suffixes that disclose tenant / partner names → strip or replace.

**When it fires.** Whenever a host-side document is a candidate for promotion to library-side public docs (e.g., a host-derived case study becomes a library-side adoption guide), the substitution policy is applied before the doc crosses the boundary.

**Why on the library side too.** A library that wants to use a real adopter as a case study must sanitize before publishing. Without a written policy, the sanitization is ad-hoc and the next person doing it picks different substitutions, leaking identifiers gradually.

**Real adoption case.** This very proposal bundle uses Pattern 5 — the bundle author's private host project is the source of every case in 001 / 002 / 003, and every identifier was substituted per the host's own `style-guide.md` before the proposal was authored. EstreUI itself is named directly because EstreUI is public; its identifiers do not require sanitization.

## Mount in the seed body

Recommended location: a new chapter immediately after the Phase 3 "Other shapes" subsection added by proposal 002. Title: **Library + Reference-Host Hybrid Operation**. The chapter contains the five patterns as numbered subsections with the same `> Concrete operation: …` quote-prefix the seed body uses elsewhere (Index Synchronization Policy, External-Interface N-Way Sync, etc.).

Each pattern's Adoption Catalog row corresponds to a row added by proposal 001 (rows H, I, J, O) plus net-new ones for Patterns 1 / 2 / 3:

| Catalog row | Pattern |
| --- | --- |
| Q | Pattern 1 (mirror sync policy) |
| O | Pattern 2 (`upstream-vs-local.md`) — already in 001's catalog under O |
| R | Pattern 3 (dual archive) — extension of row J for the library + reference-host case |
| I | Pattern 4 (legacy-design-rationale value) — already in 001's catalog under I, this proposal adds the library-specific motivation |
| O | Pattern 5 (`style-guide.md`) — already in 001's catalog under O |

## Reverse references

- Patterns 1 / 2 / 3 / 5 cases: bundle author's private host project. Walkthrough on request.
- Pattern 4 case: EstreUI public repo, file path given above. The host commit that triggered the pattern's documentation is in the host's private repo (hash available on request).
