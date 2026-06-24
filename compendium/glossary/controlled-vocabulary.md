---
id: controlled-vocabulary
title: Controlled Vocabulary
type: glossary
register_class: general
owner_spec: null
subject_field: [vocabulary]
status: active
superseded_by: null
aliases: [controlled-vocab, term-control]
definition:
  text: "A curated term set in which each concept has one preferred label plus admitted and hidden synonyms, so the same concept is not split across rival words and the same word is not overloaded across concepts."
glosses:
  - { register: expert, text: "preferred / admitted / hidden_search_only labels per concept — collision control over an open term space" }
  - { register: plain,  text: "agree on one main name per idea (and list the other names it goes by) so people do not talk past each other" }
terms:
  - { text: controlled vocabulary, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 4, distinct_sources: 2 } }
links: [compendium-module-spec, superseded-by]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
---

A general-register concept owned by no module spec. It names the problem Compendium's concept-anchored model solves: different-word-same-concept and same-word-different-meaning drift across surfaces. One concept node carries one definition + register-tagged terms, rather than a brittle word-to-word mapping.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[compendium-module-spec]] · [[superseded-by]]
<!-- compendium:obsidian:end -->
