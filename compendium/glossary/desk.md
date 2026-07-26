---
id: desk
title: Desk
type: glossary
register_class: internal
owner_spec: Corporate.md#2-the-desk--two-space-contract
subject_field: [orchestration]
status: active
superseded_by: null
aliases: [workertable]
definition:
  text: "A role’s private, gitignored working directory holding its charter, memory, and session. The harness runs here, which is how the charter gets nearest-wins precedence. Paired with the locker, the public half. See owner_spec."
glosses:
  - { register: expert, text: "gitignored per-role cwd holding charter/memory/session; running the harness here is how charter precedence is obtained (discovery ends at cwd)" }
  - { register: plain,  text: "역할마다 하나씩 갖는 «자기 책상» — 그 역할의 지시서·기억·진행상황이 들어있고 공유되지 않아요" }
terms:
  - { text: desk, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-07, occurrence_count: 47, distinct_sources: 8 } }
links: [locker, charter, durable-role]
audit: { created: 2026-07-26, updated: 2026-07-26, last_reviewed: 2026-07-26 }
---

# Desk

역할의 사설 작업 디렉토리(gitignore). 하네스를 여기서 돌리는 것이 차터 우선권을 얻는 방법이에요. 전체 정의는 owner_spec (`Corporate.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[locker]] · [[charter]] · [[durable-role]]  
**정의 원본 / Source:** [Corporate.md#2-the-desk--two-space-contract](../../Corporate.md#2-the-desk--two-space-contract)
<!-- compendium:obsidian:end -->
