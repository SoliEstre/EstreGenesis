---
id: deterministic-hook
title: Deterministic Hook
type: glossary
register_class: internal
owner_spec: Greatpractice.md#4-hook-mechanism--deterministic-enforcement
subject_field: [codification]
status: active
superseded_by: null
aliases: [hook-mechanism, enforcement-hook]
definition:
  text: "Greatpractice's enforcement mechanism — a deterministic if-then hook fired on lifecycle events, with tiered strictness (1st bold / 2nd revert-block / 3rd discuss). Hook block messages must themselves pass the voice lint. See owner_spec."
glosses:
  - { register: expert, text: "7-event if-then hook DSL with tiered BRD escalation; the hook's own block message is voice-linted" }
  - { register: plain,  text: "an automatic rule-checker that nudges, then blocks, then asks for discussion when a practice is violated" }
terms:
  - { text: deterministic hook, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 8, distinct_sources: 2 } }
links: [tier-hierarchy, maturation-gate, phronesis-boundary]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Deterministic Hook

라이프사이클 이벤트에 발화하는 if-then 강제 훅. 전체 정의는 owner_spec (`Greatpractice.md`) 가 SSoT.
