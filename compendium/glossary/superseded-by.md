---
id: superseded-by
title: superseded_by
type: glossary
register_class: general
owner_spec: null
subject_field: [vocabulary]
status: active
superseded_by: null
aliases: [replaced-by, skos-replacedby]
definition:
  text: "The frontmatter field that records a deprecation redirect from an evicted entry to its replacement (skos:replacedBy) — making eviction a first-class, traceable redirect rather than a silent delete."
glosses:
  - { register: expert, text: "skos:replacedBy on the entry — status:superseded + superseded_by:<id>, old surfaces collapse into aliases" }
  - { register: plain,  text: "instead of deleting an outdated term, mark it replaced and point to the new one, so old links still resolve" }
terms:
  - { text: superseded_by, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 5, distinct_sources: 2 } }
links: []
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
---

A general-register concept owned by no module spec. It is the mechanism by which this store models eviction first-class (north-star axis-3): a renamed or absorbed term is never dropped — its entry flips to `status: superseded` with a `superseded_by` pointer, and the old surface joins `aliases`. Isomorphic with the Greatpractice retire axis.
