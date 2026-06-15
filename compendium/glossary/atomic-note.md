---
id: atomic-note
title: Atomic Note
type: glossary
register_class: general
owner_spec: null
subject_field: [vocabulary]
status: active
superseded_by: null
aliases: [atomic-entry, single-concept-note]
definition:
  text: "A note scoped to exactly one idea and addressed by a stable immutable id, composed with others by linking rather than nesting — the unit that makes a computed MOC and rename-safe cross-linking possible."
glosses:
  - { register: expert, text: "one-concept-per-file with an opaque immutable id; links over hierarchy (Zettelkasten lineage)" }
  - { register: plain,  text: "keep one idea per note and connect notes by links, instead of burying ideas inside big documents" }
terms:
  - { text: atomic note, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 3, distinct_sources: 1 } }
links: [computed-moc]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
---

A general-register concept owned by no module spec. The entry/page model of this store is atomic: one concept per file, an immutable `id` as the link anchor, and outbound `links` mirrored in frontmatter so backlinks can be computed rather than hand-maintained.
