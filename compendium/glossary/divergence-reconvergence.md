---
id: divergence-reconvergence
title: Divergence–Reconvergence
type: glossary
register_class: internal
owner_spec: Superscalar.md#15-topology--divergence-reconvergence-and-the-four-patterns
subject_field: [scheduling]
status: active
superseded_by: null
aliases: [reconvergence-mode, fan-out-fan-in]
definition:
  text: "The fan-out/fan-in topology of parallel sub-agent work — tasks diverge to run independently then reconverge at a barrier where results are merged. One of the four dispatch patterns. See owner_spec."
glosses:
  - { register: expert, text: "fan-out → independent execution → reconvergence barrier (merge); one of the four §1.5 patterns" }
  - { register: plain,  text: "split work to run in parallel, then bring the results back together at a meeting point" }
terms:
  - { text: divergence reconvergence, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-05, occurrence_count: 6, distinct_sources: 2 } }
links: [issue-width, speculation-gate]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Divergence–Reconvergence

병렬 작업의 fan-out/fan-in 토폴로지. 전체 정의는 owner_spec (`Superscalar.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[issue-width]] · [[speculation-gate]]  
**정의 원본 / Source:** [Superscalar.md#15-topology--divergence-reconvergence-and-the-four-patterns](../../Superscalar.md#15-topology--divergence-reconvergence-and-the-four-patterns)
<!-- compendium:obsidian:end -->
