---
id: a2a-intent-family
title: A2A Intent Family
type: glossary
register_class: internal
owner_spec: Constellation.md#13169-message-classification-by-intent-board-directed-vs-a2a-intent
subject_field: [a2a]
status: active
superseded_by: null
aliases: [a2a-intent, intent-allowlist]
definition:
  text: "The classification of agent-to-agent CUSTOM messages by named intent (Report, Delegate, BlockerManifest, ULTRASAFE_*, etc.) on an allowlist, splitting board-directed from a2a-intent so the dashboard + watcher treat each correctly. See owner_spec."
glosses:
  - { register: expert, text: "named-intent allowlist (4-group classification) — board-directed vs a2a-intent; drives card render + meaningful-inbound filter" }
  - { register: plain,  text: "messages between agents are tagged by what they're for, so the board and the watcher know how to handle each kind" }
terms:
  - { text: a2a intent family, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 8, distinct_sources: 2 } }
links: [ack-tier, pre-send-probe, xss-boundary, asterism]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# A2A Intent Family

에이전트 간 메시지를 의도(intent) 이름으로 분류하는 allowlist. 전체 정의는 owner_spec (`Constellation.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[ack-tier]] · [[pre-send-probe]] · [[xss-boundary]] · [[asterism]]  
**정의 원본 / Source:** [Constellation.md#13169-message-classification-by-intent-board-directed-vs-a2a-intent](../../Constellation.md#13169-message-classification-by-intent-board-directed-vs-a2a-intent)
<!-- compendium:obsidian:end -->
