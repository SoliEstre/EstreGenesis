---
name: compendium-curate
version: 0.2.4
description: Use when adding or maintaining a controlled-vocabulary entry in a Compendium-style knowledge store — a cross-cutting glossary/wiki where one concept carries one register-neutral definition + an expert gloss + a plain gloss, and every internal term POINTS to its owning spec instead of restating it. Invoke the moment you are about to write a glossary, a "Terms" section, a "what is X" primer, or a second copy of a definition that already lives in a spec/doc — or when curating an agent knowledge vault and you want the pointer-not-paraphrase + dual-register + first-class-eviction discipline. Portable + runtime-agnostic: plain markdown + frontmatter, works over any vault viewer (a dashboard wiki tab, an Obsidian graph, a provider memory store). For the full normative charter see Compendium.md (this skill is the actionable procedure, not a restatement).
---

# Compendium Curate — the pointer-not-paraphrase vocabulary discipline

You are about to record vocabulary. A generic note/vault tool will happily let you **paraphrase** a definition that already lives somewhere authoritative — and that copy will rot the moment the source changes. This skill is the *opinion* that a generic vault does not have. The store is plain markdown+frontmatter (any viewer reads it); what you are applying is the **discipline**.

## The one rule (the wedge): pointer-not-paraphrase

An **internal-register** entry — a term whose authoritative definition is owned by some spec/doc — carries **a one-line orientation gloss + a pointer to the owner**, and **never** restates the owner's normative content. Restating creates a *second source of truth* that drifts. Compendium is a **source of information, not a source of truth**: authority is one-directional, `entry → owner_spec`.

> If you find yourself copying an algorithm, a schema, a score formula, a numbered rule, a payload shape, or a version number — **stop**. Write a one-line gloss and a pointer instead.

The **sole exception**: **general-register** vocabulary that *no spec owns* (`owner_spec: null`). For that alone the entry IS the full-definition SSoT (nothing competes, zero conflict).

## Dual register — one concept, two glosses

Every entry anchors **one concept** and carries two glosses so a reader at either altitude is served:
- **expert** gloss — dense, jargon-OK, for someone who knows the neighborhood.
- **plain** gloss — jargon unpacked, for someone meeting the term cold.

The two glosses describe the *same* concept; they are not two definitions. (This is the L2.2.2 dual-register convention.)

## The frontmatter schema (the governance SSoT)

The frontmatter — not the prose — is the source of truth a tool reads. Minimum shape:

```yaml
---
id: <kebab-case, == filename>          # immutable; the wikilink target
title: <Human Title>
type: glossary | concept | index
register_class: internal | general     # internal → owner_spec required; general → owner_spec null
owner_spec: <File.md#heading-slug> | null   # the authority pointer (one-directional, may point OUT of the store)
status: active | superseded
superseded_by: <id> | null
aliases: [<other surface forms>]
definition:
  text: "<one register-neutral sentence; ends in 'See owner_spec.' for internal>"
glosses:
  - { register: expert, text: "<dense one-liner>" }
  - { register: plain,  text: "<unpacked one-liner>" }
links: [<peer-ids>]                     # peer relations (term↔term); NOT the authority pointer
audit: { created: <YYYY-MM-DD>, updated: <YYYY-MM-DD> }
---
<body: a thin orientation primer that ENDS in the pointer — never a restatement.>
```

**Typed links — do not flatten them.** `links` are *peer* relations (term↔term). `owner_spec` is the *authority* pointer to the owner (often **outside** this store). A generic vault has one undifferentiated link type; keeping these two distinct *is* the charter made structural (in a graph viewer, peers are in-vault edges, authorities are pointers out).

## The definition-quality gate — admit the right things

Compendium curates **settled, cross-cutting, controlled vocabulary** — not experiential signal (that is a memory log's job) and not project-local jargon with one use site. Admit a term when it is (a) reused across modules/contexts, (b) has a stable referent, and (c) a one-line gloss + pointer genuinely helps orientation. When unsure, do not admit — an empty slot is cheaper than a rotting copy.

## Eviction is first-class — relocate, don't delete

When a term is superseded, **do not delete** it. Set `status: superseded` + `superseded_by: <new-id>` and keep the redirect. The store is the relocation home for deprecated vocabulary; a reader following an old reference lands on the redirect, not a 404. (A standard that cannot prune becomes the cruft it warned about — so model your own eviction.)

## Self-check before you finish (the gardening lints)

Run these — by tool if a `lint` runtime exists (see the `compendium-lint` skill), else by eye:
- **broken-link** — every `links` id + every `owner_spec` resolves to a real entry / a real heading in the named file.
- **pointer-resolution** — `owner_spec` is `<file>#<slug>` and the slug is an *actual* heading in that file.
- **no-competing-full-def** — an internal entry's `definition.text` is a one-line gloss, not a restatement (hard cap on length).
- **orphan** — no inbound `links` and not an index → reconsider (is it really cross-cutting?).
- **duplicate-concept** — two active entries that share a concept and contradict → merge or supersede.
- **stale** — `updated` lags a superseding note.

## Why this is portable (and why it survives)

The storage and the viewer are substitutable — provider-native memory, Obsidian, and a bespoke dashboard all read the same markdown+frontmatter, and any of them can replace the others. What does **not** come for free from any of them is this discipline. So the durable thing you are producing is the *vocabulary + the curation rules*, not a runtime. Keep the frontmatter the typed SSoT; let viewers be viewers.

> Full charter, schema rationale, and lint definitions: **Compendium.md** (§1 identity · §2 content boundary · §4 schema · §5 dual register · §8 cross-link/click-to-define · §9 lints · §12 eviction). This skill points; it does not paraphrase.
