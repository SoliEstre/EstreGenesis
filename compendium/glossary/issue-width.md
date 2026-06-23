---
id: issue-width
title: Issue Width
type: glossary
register_class: internal
owner_spec: Superscalar.md#1-concept-mapping
subject_field: [scheduling]
status: active
superseded_by: null
aliases: [dispatch-width]
definition:
  text: "Borrowed from CPU superscalar design — how many sub-agent tasks are dispatched in parallel per cycle. The scheduling discipline tunes issue width against the cost-benefit gate rather than maximizing it blindly. See owner_spec."
glosses:
  - { register: expert, text: "parallel dispatch degree per cycle (CPU-superscalar metaphor); bounded by the cost-benefit gate, not maximized" }
  - { register: plain,  text: "how many tasks are run at the same time — chosen deliberately, not just as many as possible" }
terms:
  - { text: issue width, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-05, occurrence_count: 7, distinct_sources: 2 } }
links: [divergence-reconvergence, speculation-gate]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Issue Width

한 사이클에 병렬 디스패치되는 서브에이전트 작업 수(superscalar 은유). 전체 정의는 owner_spec (`Superscalar.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[divergence-reconvergence]] · [[speculation-gate]]  
**정의 원본 / Source:** [Superscalar.md#1-concept-mapping](../../Superscalar.md#1-concept-mapping)
<!-- compendium:obsidian:end -->
