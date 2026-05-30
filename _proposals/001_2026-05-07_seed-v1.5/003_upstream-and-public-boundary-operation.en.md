# Proposal 003 — Upstream and Public-Boundary Operation Cases

> Operational patterns for projects that split local/project context from upstream-bound context, or that keep private agent docs outside a public/collaboration source repo.

## Why this is needed

Proposal 002 names the residency and folder shapes. This proposal fills in the operating rules those shapes need: when upstream split applies, how upstream folders are named, how mirrored docs stay consistent, how file origin is classified, how source folders inside agent-docs repos are guarded, how negotiations are archived, and how public docs avoid leaking private identifiers.

The pattern is generic. an upstream framework is one real case, but upstream operation is not upstream-specific.

## Pattern 1 — Upstream applicability

> Concrete operation: apply upstream split only when upstream-bound work is real, not merely because the project uses a library.

**The rule.** Use upstream split when both are true:

- The developer operates the upstream repo or has enough write authority to send changes there.
- The current project is where upstream-bound changes are first implemented, tested, or documented before being pushed upstream.

If the project merely consumes an external library and does not author upstream-bound changes, stay with the default `.agent/` layout and use `adaptation-map.md` only when needed.

## Pattern 2 — Upstream naming

> Concrete operation: default to `upstream/`, but allow a user-provided upstream name.

**Default.**

```
<scope-root>/
├── upstream/
└── project/
```

**Named upstream.** If the user names the upstream explicitly, use that folder name:

```
<scope-root>/
├── <upstream-name>/
└── project/
```

Examples: `.agent/upstream/`, `.agent/estreui/`, `.agent/payments-sdk/`, `.agent/internal-platform/`.

The chosen name must be recorded in the scope README and in `project/upstream-vs-local.md`.

## Pattern 3 — Mirror sync policy

> Concrete operation: when upstream docs/files are mirrored into the agent-docs scope for grep/read convenience, upstream remains the source of truth.

**The rule.** The upstream repo is the single source of truth for files under `upstream/` or `<upstream-name>/`. The local mirrored copy is a read optimization for agents working in the current scope; it shortens lookup paths but does not author upstream content.

**Sync trigger.** Any upstream docs/file add, rename, or substantial rewrite triggers a mirror sync in the next relevant local/agent-docs commit. The sync record names the upstream commit hash.

**Conflict resolution.** Upstream wins. Local deviations go into `project/upstream-vs-local.md` or another project-owned note, not into mirrored upstream files.

**Tooling.** A mirror-sync helper can be a simple one-way file copy. It does not need merge semantics if the mirrored folder is never locally authored.

## Pattern 4 — `upstream-vs-local.md` file-origin classification

> Concrete operation: a single classifier table tells agents whether a path is upstream-owned, project-owned, mirrored, or local-only.

Maintain `project/upstream-vs-local.md` as a classifier table:

| Path pattern | Origin | Sync direction | Local modification policy |
| --- | --- | --- | --- |
| `upstream/**` or `<upstream-name>/**` | upstream mirror | upstream → local | forbidden locally; modify upstream and resync |
| `project/**` | project-owned | none | free |
| `source/<upstream-files>` | upstream-bound | local → upstream, then resync | allowed only when paired with upstream plan/commit |
| `source/<project-files>` | project-owned | none | free |
| `scripts/<upstream-files>` | upstream-bound or mirror | depends on source-map | follow classifier row |
| `scripts/<project-files>` | project-owned | none | free |

This table is the prerequisite for mechanical checks such as "did this commit touch upstream-bound files without recording the upstream target?"

Update the classifier in the same commit as any structure change that adds a new file family.

## Pattern 5 — Source folder guard in agent-docs repos

> Concrete operation: private agent-docs repos may contain or link source projects for workspace access, but must not accidentally commit the source folder.

If the user says the source project folder is now inside the current workspace:

1. Verify the folder exists.
2. Determine whether it is a separate source repo or linked project folder that should not be committed into the agent-docs repo.
3. If yes, add its root-relative path to the root `.gitignore`.
4. Do not add guessed paths.
5. Do not duplicate an existing ignore entry.
6. If the folder is meant to be tracked as a submodule/gitlink, do not ignore it.

This pattern pairs with `source-map.md`, which records why the source folder is present and where the authoritative source repo lives.

## Pattern 6 — Dual archive

> Concrete operation: when a local project and an upstream/public project negotiate an interface across multiple rounds, preserve enough history on both sides to reconstruct the decision.

When the negotiation is a single-source-of-truth document family, pick one side as master and let the other side keep a redirect-only stub. When the negotiation is a conversation — replies, reviews, decisions made round by round — both sides may keep records.

If one side is private and the other public, the private side carries the full record. The public side carries sanitized cards: decision outcome, public-safe rationale, and no internal identifiers.

Use date-prefixed files in `archive/` (`YYYY-MM-DD_<topic>.md`). When the same round appears on both sides, align filenames so the round can be found mechanically.

## Pattern 7 — `legacy-design-rationale.md` value on the upstream side

> Concrete operation: an upstream library/platform that preserves why it set a design path aside helps downstream adopters evaluate future fit.

When upstream replaces an old design with a new one, do not leave commented-out code in source. Move the relevant snippet and rationale to `legacy-design-rationale.md` with:

- what the design tried to do
- why the project chose a different path
- when it might come back
- a self-contained snippet sufficient for future revival

Lifecycle:

- Revive: restore the snippet and remove the entry.
- Permanently drop: delete the entry. The doc carries living motivations only.

## Pattern 8 — Public-docs sanitization

> Concrete operation: public docs derived from private agent/project notes must not leak private host, tenant, partner, or service identifiers.

Maintain `project/public-boundary.md` or `project/style-guide.md` as a substitution policy:

- Service / brand names → neutral roles (`<host-application>`, `<embedded-library>`).
- Domain names → example domains (`host.example.com`, `embed.example.com`).
- Class / function names that bake in business domain → generic role names.
- Identifier suffixes that disclose tenant / partner names → strip or replace.

Apply the policy whenever a private note, case study, archive card, or implementation example crosses into upstream/public docs.

## Mount in the seed body

Recommended location: immediately after proposal 002's residency/folder-shape section. Title: **Upstream and Public-Boundary Operation**.

Catalog mapping:

| Catalog row | Pattern |
| --- | --- |
| L | Pattern 1 and 2 (upstream split and naming) |
| N | Pattern 3 (mirror sync policy) |
| M | Pattern 4 (`upstream-vs-local.md`) |
| J | Pattern 5 (source folder `.gitignore` guard) |
| O | Pattern 6 (dual archive) |
| Q | Pattern 7 (`legacy-design-rationale.md`) |
| I | Pattern 8 (public boundary / sanitization) |

## Reverse references

- upstream-named split and mirror case: bundle author's private host project plus public upstream repo context.
- Source sidecar, workspace-boundary, and `.gitignore` guard cases: seed maintainer review of this bundle, 2026-05-07.
