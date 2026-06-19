---
id: board-worker
title: Board Worker
type: glossary
register_class: internal
owner_spec: Constellation.md#13233-board-worker-is-a-projected-role-not-a-wire-role
subject_field: [orchestration]
status: active
superseded_by: null
aliases: [board-observer]
definition:
  text: "A projected dashboard role (not a wire role) for an agent dedicated to maintaining the live board — derived from the backends.json registry, shown as its own tab group. The board worker mutates state.json on the main's delegation. See owner_spec."
glosses:
  - { register: expert, text: "projected (not wire) role from backends.json; a delegated agent that maintains the live board state.json" }
  - { register: plain,  text: "an agent whose job is to keep the live status board updated, shown as its own group on the dashboard" }
terms:
  - { text: board worker, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 7, distinct_sources: 2 } }
links: [collab-key, blocker-tracking]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Board Worker

라이브 보드 유지 전담의 투영(projected) 역할. 전체 정의는 owner_spec (`Constellation.md`) 가 SSoT.
