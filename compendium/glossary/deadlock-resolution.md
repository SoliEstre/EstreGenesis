---
id: deadlock-resolution
title: Deadlock Resolution
type: glossary
register_class: internal
owner_spec: Constellation.md#1319-deadlock-resolution--formal-spec-prevention--detection--auto-resolution--escalation-layered-above-1313
subject_field: [orchestration]
status: active
superseded_by: null
aliases: [deadlock-detection]
definition:
  text: "Constellation's layered handling of agents stuck waiting on each other — prevention, DFS wait-edge detection (2-agent sufficient), auto-resolution, and a 4-tier escalation ladder ending at the human via the decisions panel. See owner_spec."
glosses:
  - { register: expert, text: "wait-edge DFS detection + auto-resolution + 4-tier escalation, layered above the §13.13 ack layer" }
  - { register: plain,  text: "when two agents are each waiting on the other and nothing moves, the system detects it and breaks the standoff (or asks a person)" }
terms:
  - { text: deadlock resolution, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-05, occurrence_count: 10, distinct_sources: 3 } }
links: [blocker-tracking, ack-tier]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Deadlock Resolution

서로 기다리며 멈춘 에이전트를 탐지·해소하는 계층 규약. 전체 정의는 owner_spec (`Constellation.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[blocker-tracking]] · [[ack-tier]]  
**정의 원본 / Source:** [Constellation.md#1319-deadlock-resolution--formal-spec-prevention--detection--auto-resolution--escalation-layered-above-1313](../../Constellation.md#1319-deadlock-resolution--formal-spec-prevention--detection--auto-resolution--escalation-layered-above-1313)
<!-- compendium:obsidian:end -->
