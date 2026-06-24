---
id: decision-to-schedule-seam
title: How Hyperbrief Gates Superscalar Retire
type: concept
register_class: general
owner_spec: null
subject_field: [decision, scheduling]
status: active
superseded_by: null
aliases: []
definition:
  text: "How Hyperbrief's decision gate conditions entry into Superscalar's retire queue — an Explanation-tier link for a cross-module seam that has no single-module home."
glosses:
  - { register: plain, text: "the linking relationship where the decision-delegation module must pass an item before the work-cleanup module can retire it" }
terms:
  - { text: decision-schedule seam, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 2, distinct_sources: 1 } }
links: [four-score-escalation, retire-axis]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
---

A cross-module *seam* page: it explains a relationship that lives between two specs and therefore has no single-module owner (so `owner_spec: null`, Compendium is the legitimate home). A decision delegated through Hyperbrief's gate is a precondition for the corresponding item to enter Superscalar's retire-barrier — the seam is the *link*, not a restatement of either module's algorithm. Read `Hyperbrief.md` for the gate and `Superscalar.md` for the retire barrier; this page copies neither.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[four-score-escalation]] · [[retire-axis]]
<!-- compendium:obsidian:end -->
