---
id: pre-send-probe
title: Pre-send Probe
type: glossary
register_class: internal
owner_spec: Constellation.md#13166-watcher-liveness-probe-discipline
subject_field: [a2a]
status: active
superseded_by: null
aliases: [cursor-tail-probe, cycle-end-probe]
definition:
  text: "The read-before-write discipline: before every outbound emit (and at every turn-close) probe the inbox from the last-surfaced cursor for meaningful inbound, then incorporate-or-abort. Constellation A2A has no in-flight rejection, so stale-context sends silently drift. See owner_spec."
glosses:
  - { register: expert, text: "cursor-tail probe before each emit + cycle-end rearm — at-most-once relay has no in-flight reject, so read-before-write prevents stale-context drift" }
  - { register: plain,  text: "always check for new incoming messages right before sending, so you don't reply based on outdated information" }
terms:
  - { text: pre-send probe, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 10, distinct_sources: 3 } }
links: [a2a-intent-family, ack-tier]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# Pre-send Probe

발신·턴종료 전 인박스를 커서부터 probe 해 stale-context 발신을 막는 규율. 전체 정의는 owner_spec (`Constellation.md`) 가 SSoT.
