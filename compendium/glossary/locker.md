---
id: locker
title: Locker
type: glossary
register_class: internal
owner_spec: Corporate.md#2-the-desk--two-space-contract
subject_field: [orchestration]
status: active
superseded_by: null
aliases: [public role folder]
definition:
  text: "A role’s tracked public directory — the sharing channel: write a document there and pass the path. Also the cross-host exchange, since a desk does not span hosts. See owner_spec."
glosses:
  - { register: expert, text: "tracked per-role public dir; default sharing is write-a-document-and-pass-the-path, and it is the cross-host exchange since desks are host-local" }
  - { register: plain,  text: "역할의 «공개 사물함» — 내용을 메시지로 밀지 않고 여기 문서를 쓴 다음 경로만 넘기는 게 기본이에요" }
terms:
  - { text: locker, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-07, occurrence_count: 26, distinct_sources: 5 } }
links: [desk, durable-role]
audit: { created: 2026-07-26, updated: 2026-07-26, last_reviewed: 2026-07-26 }
---

# Locker

역할의 공개 디렉토리(추적). 공유 기본형은 여기에 문서를 쓰고 경로를 넘기는 것이에요. 전체 정의는 owner_spec (`Corporate.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[desk]] · [[durable-role]]  
**정의 원본 / Source:** [Corporate.md#2-the-desk--two-space-contract](../../Corporate.md#2-the-desk--two-space-contract)
<!-- compendium:obsidian:end -->
