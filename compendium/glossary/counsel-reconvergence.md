---
id: counsel-reconvergence
title: Counsel (reconvergence mode) / Principal–Advisor
type: glossary
register_class: internal
owner_spec: Superscalar.md#151-the-return-contract--counsel-is-not-review
subject_field: [scheduling]
status: active
superseded_by: null
aliases: [principal-advisor, advisory-lane, non-gating-review]
definition:
  text: "The reconvergence mode in which a lane's output is offered rather than imposed: the advisor returns a perspective, the principal decides. Producer-Reviewer with the gate removed — the two shapes differ only at the merge, so the mode is declared at dispatch. See owner_spec."
glosses:
  - { register: expert, text: "non-gating reconvergence; advisory lane returns a perspective, not a verdict — no retire dependency, so Little's Law does not bind the width" }
  - { register: plain,  text: "asking someone for a second opinion instead of asking them for approval — you still decide" }
terms:
  - { text: counsel, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-08, occurrence_count: 1, distinct_sources: 1 } }
  - { text: principal-advisor, register: expert, role: variant,
      provenance: { source: spec, first_seen: 2026-08, occurrence_count: 1, distinct_sources: 1 } }
links: [divergence-reconvergence, issue-width]
audit: { created: 2026-08-02, updated: 2026-08-02, last_reviewed: 2026-08-02 }
---

# Counsel (reconvergence mode) / Principal–Advisor

A lane opened for **counsel** returns what it sees; it does not decide. The principal keeps the decision, records the counsel as one input, and may overrule it — writing down the reason when it does.

The distinction that carries weight is not what the advisor produces but **what the merge does with it**. A reviewer's block binds and stops a retire; an advisor's disagreement does not. Because the two shapes are indistinguishable at dispatch, the mode is stated in the request, and a lane left to infer it will follow whichever its prompt sounds like — adding a gate nobody approved, or removing one somebody intended.

Silence from an advisor means nothing. Absence of counsel is not consent.

**정의 원본 / Source:** [Superscalar.md §1.5.1](../../Superscalar.md#151-the-return-contract--counsel-is-not-review)

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[divergence-reconvergence]] · [[issue-width]]  
**정의 원본 / Source:** [Superscalar.md#151-the-return-contract--counsel-is-not-review](../../Superscalar.md#151-the-return-contract--counsel-is-not-review)
<!-- compendium:obsidian:end -->
