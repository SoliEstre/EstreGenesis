---
id: speculation-gate
title: Speculation Gate
type: glossary
register_class: internal
owner_spec: Superscalar.md#speculation-is-speculative-divergence
subject_field: [scheduling]
status: active
superseded_by: null
aliases: [speculative-divergence]
definition:
  text: "The opt-in, andon-bound gate for speculative execution — dispatching work before its precondition is confirmed. Off by default (per the workspace serial + speculation-off policy); enabled only when the cost-benefit gate clears. See owner_spec."
glosses:
  - { register: expert, text: "speculative divergence = run-before-confirmed; opt-in + andon-bound, default off, cost-benefit-gated" }
  - { register: plain,  text: "starting work before you're sure it's needed — only turned on deliberately, with a quick stop-cord if it's wasteful" }
terms:
  - { text: speculation gate, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-05, occurrence_count: 5, distinct_sources: 2 } }
links: [issue-width, divergence-reconvergence]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Speculation Gate

전제 확정 전 작업을 띄우는 투기 실행의 opt-in·andon-bound 게이트. 전체 정의는 owner_spec (`Superscalar.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[issue-width]] · [[divergence-reconvergence]]  
**정의 원본 / Source:** [Superscalar.md#speculation-is-speculative-divergence](../../Superscalar.md#speculation-is-speculative-divergence)
<!-- compendium:obsidian:end -->
