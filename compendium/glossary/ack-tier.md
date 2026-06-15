---
id: ack-tier
title: Ack Tier
type: glossary
register_class: internal
owner_spec: Constellation.md#1313-a2a-message-reliability--the-ack-layer
subject_field: [a2a]
status: active
superseded_by: null
aliases: [ack-level, acknowledgment-tier]
definition:
  text: "The tier distinction in A2A acknowledgment — a transport-tier Ack is separate from the recipient agent surfacing the message body. Full definition lives in owner_spec."
glosses:
  - { register: expert, text: "transport-tier Ack != recipient inbox body arrival (at-most-once relay)" }
  - { register: plain,  text: "a 'delivered' signal does not mean the other side actually read it" }
terms:
  - { text: ack tier, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-05, occurrence_count: 12, distinct_sources: 3 } }
  - { text: ack level, register: expert, role: hidden_search_only,
      provenance: { source: conversation, first_seen: 2026-06, occurrence_count: 4, distinct_sources: 2 } }
redaction_pass: 2026-06-15
links: []
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
---

Orientation primer only — the normative definition is owned by [`Constellation.md` §13.13](../../Constellation.md#1313-a2a-message-reliability--the-ack-layer). Compendium holds a one-line gloss plus the pointer; it does **not** restate the ack-layer contract. For the three-tier transport / commitment / application model and the at-least-once relay semantics, read the owner spec.
