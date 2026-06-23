---
id: computed-moc
title: Computed MOC
type: glossary
register_class: general
owner_spec: null
subject_field: [vocabulary]
status: active
superseded_by: null
aliases: [computed-map-of-content, regenerated-index]
definition:
  text: "A map-of-content index auto-regenerated from frontmatter metadata — a navigation node that cannot drift because it is never hand-maintained."
glosses:
  - { register: expert, text: "a derived view that removes the rot risk of a hand-maintained MOC — source = frontmatter, INDEX.md is the projection" }
  - { register: plain,  text: "a way to rebuild the table of contents automatically from file information instead of editing it by hand" }
terms:
  - { text: computed MOC, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 6, distinct_sources: 2 } }
links: [atomic-note]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
---

A general-register concept owned by no module spec — Compendium is the legitimate single source of truth. The store's own `INDEX.md` is a computed MOC: regenerated from each entry's frontmatter, never hand-edited, so it cannot drift out of sync with the entries.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[atomic-note]]
<!-- compendium:obsidian:end -->
