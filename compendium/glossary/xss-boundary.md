---
id: xss-boundary
title: XSS Boundary (esc)
type: glossary
register_class: internal
owner_spec: Constellation.md#131612-dashboard-render-patterns--interaction-date-line-attachment-connection-upstream-visibility
subject_field: [safety]
status: active
superseded_by: null
aliases: [esc-boundary, dashboard-xss]
definition:
  text: "The dashboard render discipline that all agent-supplied content is escaped (esc()) post-escape before insertion — attachments via sandboxed iframe, mermaid via textContent — so untrusted A2A/board content cannot execute as script. See owner_spec."
glosses:
  - { register: expert, text: "esc()-only render boundary + sandboxed-iframe attachments + textContent mermaid; untrusted content never parsed as live HTML" }
  - { register: plain,  text: "everything other agents send is treated as plain text when shown, so it can't run hidden code in the dashboard" }
terms:
  - { text: xss boundary, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 5, distinct_sources: 2 } }
links: [a2a-intent-family]
audit: { created: 2026-06-19, updated: 2026-06-19, last_reviewed: 2026-06-19 }
---

# XSS Boundary (esc)

대시보드가 에이전트 콘텐츠를 esc() 후에만 렌더하는 경계. 전체 정의는 owner_spec (`Constellation.md`) 가 SSoT.

<!-- compendium:obsidian:start (auto — lint.cjs --reindex; do not hand-edit) -->
**관련 / Related:** [[a2a-intent-family]]  
**정의 원본 / Source:** [Constellation.md#131612-dashboard-render-patterns--interaction-date-line-attachment-connection-upstream-visibility](../../Constellation.md#131612-dashboard-render-patterns--interaction-date-line-attachment-connection-upstream-visibility)
<!-- compendium:obsidian:end -->
