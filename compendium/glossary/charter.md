---
id: charter
title: Charter
type: glossary
register_class: internal
owner_spec: Corporate.md#22-charter-specificity--precedence-not-load-order-must
subject_field: [orchestration]
status: active
superseded_by: null
aliases: [role charter]
definition:
  text: "A role’s written contract, living in its desk. Specificity comes from precedence, not load order: discovery runs root-to-cwd, so the charter wins by being merged last. See owner_spec."
glosses:
  - { register: expert, text: "per-role instruction file in the desk; nearest-wins by precedence (root→cwd discovery, charter merged last), never by a claimed reversed load order" }
  - { register: plain,  text: "역할에게 주는 «직무 지시서» — 프로젝트 공통 본문과 부딪힐 땐 이 지시서가 이기지만, 남보다 먼저 읽혀서가 아니에요" }
terms:
  - { text: charter, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-07, occurrence_count: 109, distinct_sources: 15 } }
links: [desk, durable-role]
audit: { created: 2026-07-26, updated: 2026-07-26, last_reviewed: 2026-07-26 }
---

# Charter

역할의 written contract. 데스크에 놓이고, 순서가 아니라 **우선권**으로 특수성을 얻어요(root→cwd 탐색의 마지막 병합). 전체 정의는 owner_spec (`Corporate.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[desk]] · [[durable-role]]  
**정의 원본 / Source:** [Corporate.md#22-charter-specificity--precedence-not-load-order-must](../../Corporate.md#22-charter-specificity--precedence-not-load-order-must)
<!-- compendium:obsidian:end -->
