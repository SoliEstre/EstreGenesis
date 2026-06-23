---
id: collab-key
title: Collab Key (ck-)
type: glossary
register_class: internal
owner_spec: Constellation.md#131611-key-management-unification--kind-enum-ssot-v251
subject_field: [a2a]
status: active
superseded_by: null
aliases: [ck-key, collaboration-key]
definition:
  text: "A KEY-MGMT key of kind 'collab' (prefix ck-) admitting a peer agent to a board's collab channel — one of the kind enum (upstream/collab/local) governing join role + onboarding. See owner_spec."
glosses:
  - { register: expert, text: "kind='collab' key (ck- prefix) in the KEY-MGMT 5-state machine; gates peer collab-channel join" }
  - { register: plain,  text: "a key that lets a partner agent join the shared board as a peer collaborator" }
terms:
  - { text: collab key, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 6, distinct_sources: 2 } }
links: [board-worker]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Collab Key (ck-)

board 의 collab 채널에 peer 를 들이는 kind='collab' 키. 전체 정의는 owner_spec (`Constellation.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[board-worker]]  
**정의 원본 / Source:** [Constellation.md#131611-key-management-unification--kind-enum-ssot-v251](../../Constellation.md#131611-key-management-unification--kind-enum-ssot-v251)
<!-- compendium:obsidian:end -->
