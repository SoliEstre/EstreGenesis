# Proposal 002 — `.agent/` Folder Shape for Library and Host Projects

> The seed body's Phase 3 (Document Management Structure) treats every project as if it were a single role — *the project*. Real adoption splits along role lines: a project may be a host, a library, both at once (a library + reference-host hybrid), or a host that mirrors a third-party library's docs. The `.agent/` folder shape that fits each is different.

## Why this is needed

Phase 3 currently scaffolds `.agent/` as a flat folder of role-agnostic documents (`adaptation-map.md`, `domain-glossary.md`, `architecture.md`, etc.). That works for the dominant case — a single-role host project. It does not give clear guidance for:

- **Pure library projects** where most documents are about the library itself and the question of "host" is meaningless.
- **Host projects that mirror a public library's docs into their own `.agent/`** so agents working in the host repo have the library's documents grep-reachable without context-switching across repos.
- **Hybrid repos** that are a library *and* its live reference host at once — both roles share one repo and need their documents kept distinguishable.

Without named scenarios and a decision tree, every adopting project re-invents the layout. Some end up with library docs and host-specific docs mingled into a single flat folder; others split inconsistently and break tooling (lint, mirror sync) that assumes one shape.

## Four scenarios

### Scenario 1 — Pure host (the seed v1.4 default)

```
.agent/
├── README.md
├── adaptation-map.md
├── domain-glossary.md
├── architecture.md             (if Adoption Catalog row G is adopted)
├── _lessons/
├── PM/
└── ...
```

Phase 3's current shape covers this. No change needed. The catalog row F (`rules.md`) and row G (`architecture.md`) plug in here when their triggers fire.

### Scenario 2 — Pure library

```
.agent/
├── README.md
├── core/                       (or library/)
│   ├── <topic>.md              (library mental model, public APIs, internal architecture)
│   └── ...
├── integration/                (or guides/)
│   ├── adoption-guide.md       (how a host adopts the library)
│   ├── migration-guide.md      (how a host upgrades across library versions)
│   └── ...
├── _lessons/
├── PM/
└── ...
```

The split between `core/` (the library itself, role: maintainer-facing) and `integration/` (host-facing guides, role: adopter-facing) is the analogue of "host vs. project context" in Scenario 4 below — but here the second role is *the host that adopts this library*, who is a notional reader rather than a present project.

This split is optional. A small library can keep `.agent/` flat. The trigger for splitting: integration guides accumulate enough that they lose discoverability inside a flat folder.

### Scenario 3 — Host that mirrors an external library's docs

```
.agent/
├── README.md
├── <library-name>/             (mirrored from the public library's repo, kept in sync)
│   ├── README.md
│   ├── <topic>.md
│   ├── review/
│   ├── roadmap/
│   └── ...
└── project/                    (this host's own context)
    ├── README.md
    ├── adaptation-map.md
    ├── domain-glossary.md
    ├── upstream-vs-local.md    (catalog row O — names which files are mirror vs. host-extension)
    ├── style-guide.md          (catalog row O — sanitization rules for any docs that go public)
    ├── _lessons/
    ├── PM/
    ├── archive/                (catalog row J — external negotiations by date)
    └── ...
```

Top-level split: `<library-name>/` for the mirrored library docs and `project/` for the host's own context. The mirrored folder is a one-way pull from the upstream library repo (proposal 003 details the mirror-sync policy).

This is the shape an EstreUI-adopting host project applied. The split is what makes the host's own context (under `project/`) survive when the library docs (under the library-name folder) are fully resynced from upstream — no conflict, no merge pain.

### Scenario 4 — Library + reference-host hybrid (single repo)

```
.agent/
├── README.md
├── <library-name>/             (library role — same content as Scenario 2's core/+integration/)
│   ├── core/
│   ├── integration/
│   ├── review/
│   ├── roadmap/
│   └── ...
└── project/                    (reference-host role — same content as Scenario 3's project/)
    ├── adaptation-map.md
    ├── _lessons/
    ├── PM/
    └── ...
```

Less common but real: a single repo holds the library code in one path and the reference-host application (e.g., a demo app, a live test harness) in another. Both roles have document needs and they must be distinguishable.

The shape mirrors Scenario 3 but with no upstream mirror — the `<library-name>/` folder is authored in this repo, not synced from elsewhere.

## Decision tree

```
Q1. Does this repo author or publish a library?
    No → Scenario 1 (pure host).
    Yes → Q2.
Q2. Does this repo also host a reference application built on top of that library?
    No → Scenario 2 (pure library).
    Yes → Q3.
Q3. Is the library code in the same repo as the reference host, or in a separate repo?
    Same repo → Scenario 4 (hybrid).
    Separate repo, this repo is the host → Scenario 3 (host with mirrored library docs).
    Separate repo, this repo is the library → Scenario 2 here, host is elsewhere (Scenario 3 there).
```

The tree's leaves correspond directly to the four scenarios.

## Mount in the seed body

Phase 3 (Document Management Structure) currently shows one shape. The proposal: keep Phase 3's shape as **Scenario 1**, then add a "Other shapes" subsection that names Scenarios 2 / 3 / 4 with the decision tree.

Scenario 3 and 4 link forward to proposal 003 for the operational rules that govern them (mirror sync, upstream-vs-local, etc.). Scenario 2's optional `core/` + `integration/` split is named here but does not need a separate proposal — the trigger and adoption work fit on a single Adoption Catalog row.

## Catalog rows added

- **Row P** — `<library-name>/` + `project/` top-level split. Trigger: Scenario 3 or 4 applies. Anchor: `.agent/` root. Adoption work: rename existing flat `.agent/` contents into `project/`, create `<library-name>/`, update README.
- Existing **catalog row O** (`upstream-vs-local` + `style-guide` pair) lights up specifically when Scenario 3 is selected.

## Real adoption case

An EstreUI-adopting host project applies Scenario 3. Top-level split is `.agent/estreui/` (mirrored from the public EstreUI repo) and `.agent/project/` (host's own context). The mirror folder is bilingual (catalog row L) because EstreUI publishes both languages. The host's own folder is single-language (Korean) because it is private and does not cross language boundaries.

The host's `project/` folder gradually filled in catalog rows H (`open-implementation-markers.md`), I (`legacy-design-rationale.md`), J (`archive/`), K (`adaptation-map.md`), and the `_lessons/` + `PM/` from v1.4. Each row was adopted at its own trigger — none required ripping up the layout.

## Reverse references

- Scenario 3 case: bundle author's private host project. Folder layout exactly as shown above. Walkthrough on request.
- Scenario 2 reference (incremental adoption guide for a pure library): EstreUI repo (public), forthcoming when its own `.agent/` reaches Scenario 2's split trigger. The library-side application of this proposal is a v1.5 follow-up, not a v1.5 dependency.
