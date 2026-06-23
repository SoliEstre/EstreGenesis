---
id: blocker-tracking
title: Blocker Tracking
type: glossary
register_class: internal
owner_spec: Constellation.md#1320-blocker-tracking--periodic-nudge-discipline--making-waiting-on-external-work-observable-and-time-bounded
subject_field: [orchestration]
status: active
superseded_by: null
aliases: [blocker-manifest, periodic-nudge]
definition:
  text: "The discipline of making 'waiting on external work' observable and time-bounded — a blocker manifest data structure + a periodic BlockerNudge cadence + a 4-tier nudge escalation (polite → explicit → deadline → human). See owner_spec."
glosses:
  - { register: expert, text: "blocker manifest + BlockerNudge every N rearm cycles + 4-tier nudge escalation; waiting becomes observable, not silent" }
  - { register: plain,  text: "when work is stuck waiting on someone else, the system keeps it visible and pings on a schedule instead of quietly stalling" }
terms:
  - { text: blocker tracking, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 9, distinct_sources: 2 } }
links: [deadlock-resolution]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Blocker Tracking

외부 작업 대기를 관찰 가능·시한 있게 만드는 규율(blocker manifest + 주기 nudge). 전체 정의는 owner_spec (`Constellation.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[deadlock-resolution]]  
**정의 원본 / Source:** [Constellation.md#1320-blocker-tracking--periodic-nudge-discipline--making-waiting-on-external-work-observable-and-time-bounded](../../Constellation.md#1320-blocker-tracking--periodic-nudge-discipline--making-waiting-on-external-work-observable-and-time-bounded)
<!-- compendium:obsidian:end -->
