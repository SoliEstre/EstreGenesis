// docs/promo/shared/data.js — single source of truth for promotional metrics.
// All numbers verifiable in the EstreGenesis repo: Superscalar.md §11 + CHANGELOG.md + git log.

window.EG_DATA = {
  meta: {
    version: 'v2.5.15',
    shipCount: 31,
    cycleHours: 24,
    e2ePRs: 5,
    canonicalPromotions: 2,
    redactionViolations: 0,
    mergeFailures: 0,
  },

  // Superscalar.md §11 Entry 06 — controlled A/B measurement (payment-backend, 9-dimension audit)
  // Arm A: Superscalar discipline OFF (naïve max-parallel)
  // Arm B: Superscalar discipline ON (design-freeze → consume → cross-cut → in-order retire + consistency gate + completeness critic)
  superscalarEntry06: {
    domain: 'payment-backend deep-dive (Java/Spring/MyBatis)',
    dimensions: 9, // 3 foundation + 5 consumer + 1 cross-cut
    metrics: [
      { key: 'components', label: { en: 'Components covered', ko: '컴포넌트 커버리지' }, a: 145, b: 144, unit: '', winner: 'tie', note: { en: 'Equivalent — both arms reached full source', ko: '동등 — 양 arm 모두 전체 소스 도달' } },
      { key: 'endpoints', label: { en: 'Endpoints enumerated', ko: '엔드포인트 enumerate' }, a: 314, b: 485, unit: '', winner: 'B', delta: '+54%', note: { en: 'B more exhaustive (auth matrix)', ko: 'B가 더 철저 (인증 매트릭스)' } },
      { key: 'crossrefs', label: { en: 'crossRefs (grounding)', ko: 'crossRefs (grounding)' }, a: 49, b: 107, unit: '', winner: 'B', delta: '+118%', highlight: true, note: { en: "B's headline win — grounded citations replace assumption", ko: 'B의 핵심 우위 — 추측 대신 실 계약 인용' } },
      { key: 'assumptions', label: { en: 'Assumptions (speculation)', ko: 'Assumptions (추측결핍)' }, a: 62, b: 37, unit: '', winner: 'B', delta: '−40%', highlight: true, note: { en: 'B replaced speculation with sourced fact', ko: 'B가 추측을 실 근거로 대체' } },
      { key: 'critical', label: { en: 'Critical findings', ko: 'Critical 발견' }, a: 13, b: 14, unit: '', winner: 'tie' },
      { key: 'high', label: { en: 'High findings', ko: 'High 발견' }, a: 36, b: 36, unit: '', winner: 'tie' },
      { key: 'wallclock', label: { en: 'Wall-clock', ko: 'Wall-clock' }, a: 8.9, b: 23.6, unit: 'min', winner: 'A', delta: '2.65× (A faster)', note: { en: 'Cost of phase serialisation, NOT parallel inefficiency', ko: '병렬 비효율 아닌 phase 직렬화 비용' } },
      { key: 'tokens', label: { en: 'Tokens', ko: 'Tokens' }, a: 1240000, b: 1340000, unit: 'M', winner: 'A', delta: '+8% (B)', display: { a: '1.24M', b: '1.34M' } },
      { key: 'agents', label: { en: 'Agents', ko: 'Agents' }, a: 9, b: 10, unit: '', winner: 'A', delta: '+1 (retire agent)' },
    ],
    bOnlyArtifacts: [
      { en: 'Dedup', ko: '중복 정리', detail: { en: '47 cross-dimension duplicates merged into 62 unique risk groups', ko: '47 차원교차 중복 → 62 unique risk-group 병합' } },
      { en: 'Consistency gate — real contradiction resolution', ko: 'Consistency gate — 실 모순 해소', detail: { en: 'USER_PASSWORD-class hash-algorithm contradiction: both arms found both halves, only B reconciled', ko: 'USER_PASSWORD-class 해시 알고리즘 모순: 양 arm 모두 양 면 발견했으나 B의 retire gate만 해소' }, headline: true },
      { en: 'Completeness critic', ko: 'Completeness critic', detail: { en: '11 named gaps mapped (next-iteration backlog)', ko: '11개 named gap 매핑 (다음 iteration backlog)' } },
      { en: 'S1…S16 cross-reference + X1…X4 new findings', ko: 'S1…S16 + X1…X4 신규 교차참조', detail: { en: '0 refutations + 16 confirmations + 6 severity escalations + 4 new findings with 3-dim cross-confirmation', ko: '0 refutation + 16 확정 + 6 severity escalation + 4 신규 (3차원 교차검증)' } },
    ],
    metaFinding: {
      en: 'Parallelism is not sufficient; orchestration discipline produces consistency.',
      ko: '병렬성은 충분조건이 아니다 — 오케스트레이션 규율이 정합성을 만든다.',
    },
  },

  // Constellation 24h dogfood — 5 e2e A2A PRs
  constellationPRs: [
    { num: 1, commit: '140fd64', sections: '§13.14 + §13.15', ins: 30, path: 'PR_LIVE chain', dogfood: '3 defects surfaced + resolved' },
    { num: 2, commit: 'bce10b1', sections: 'v2.4.10~v2.5.2 (6 sections)', ins: 293, path: 'PR_LIVE chain' },
    { num: 3, commit: 'fc90382', sections: '§13.16.12 dashboard render patterns', ins: 33, path: 'PR_LIVE chain' },
    { num: 4, commit: 'a3344d7', sections: '§13.11 rule 5 + §13.13.2 RRP draft', ins: 40, path: 'Manual fast-path' },
    { num: 5, commit: '1e2c3f9', sections: '§13.16.12 Pattern 7', ins: 19, path: 'Manual fast-path' },
  ],
  constellationTotalIns: 415,

  // Constellation Ship Timeline (v2.4.5 → v2.5.15)
  shipTimeline: [
    { v: 'v2.5.0', desc: { en: 'Superscalar v0.3 — lane-class cap split (read vs write)', ko: 'Superscalar v0.3 — lane-class cap 분할' } },
    { v: 'v2.5.1', desc: { en: 'cycle_b 11 patterns (§13.11/16.9/16.11 + dashboard-render-patterns)', ko: 'cycle_b 11 패턴' } },
    { v: 'v2.5.2', desc: { en: 'text synthesize SHOULD + 3-tier ack + 4-group + cycle-end probe', ko: 'text synthesize + 3-tier ack + 4-group + cycle-end probe' } },
    { v: 'v2.5.3', desc: { en: 'canonical gateway-client.eux promotion (12 dimensions SSoT)', ko: 'canonical gateway-client.eux 승격 (12 dim SSoT)' } },
    { v: 'v2.5.4', desc: { en: 'promotion-decisions/ Mode B seed', ko: 'promotion-decisions/ Mode B seed' } },
    { v: 'v2.5.5', desc: { en: '§13.16.12 — 6 dashboard render patterns', ko: '§13.16.12 dashboard render 6 패턴' } },
    { v: 'v2.5.6', desc: { en: 'Hermes 2nd handoff consolidation archive', ko: 'Hermes 2nd handoff archive' } },
    { v: 'v2.5.7', desc: { en: 'Superscalar v0.4 — Entry 06 controlled A/B + §1 meta-note', ko: 'Superscalar v0.4 — Entry 06 + §1 메타노트' } },
    { v: 'v2.5.8', desc: { en: 'Stop hook helper canonical promotion + cross-env env-vars', ko: 'Stop hook helper canonical + env-var' } },
    { v: 'v2.5.9', desc: { en: '§8 MCP integration spec + plugin marketplace scaffolding', ko: '§8 MCP + plugin marketplace' } },
    { v: 'v2.5.10', desc: { en: '§13.11 rule 5 — attachment transport-mode (source enum)', ko: '§13.11 rule 5 attachment transport' } },
    { v: 'v2.5.11', desc: { en: '§13.13.2 at-least-once relay RRP draft (v0.4 contract)', ko: '§13.13.2 at-least-once relay RRP' } },
    { v: 'v2.5.12', desc: { en: 'plugins/constellation Phase 2 MCP full impl', ko: 'plugin Phase 2 MCP 전체 구현' } },
    { v: 'v2.5.13', desc: { en: '§13.16.12 Pattern 7 — board fallback (defense layer)', ko: '§13.16.12 Pattern 7 — board fallback' } },
    { v: 'v2.5.14', desc: { en: 'RRP §10B — Manual fast-path codified', ko: 'RRP §10B Manual fast-path codify' } },
    { v: 'v2.5.15', desc: { en: '§13.13.2 v0.4 reference impl — pending queue + redelivery + LRU dedup', ko: '§13.13.2 v0.4 reference impl' } },
  ],

  // §13.x protocol additions
  protocolAdditions: [
    { sec: '§13.11 rule 5', label: { en: 'Attachment transport-mode', ko: '첨부 transport-mode' }, detail: 'source enum: local_path | embedded | url | chunked' },
    { sec: '§13.13.2', label: { en: 'At-least-once relay reliability', ko: 'At-least-once relay 신뢰성' }, detail: 'pending queue + redelivery + dedup' },
    { sec: '§13.16.12', label: { en: 'Dashboard render patterns (1-7)', ko: 'Dashboard render 패턴 (1-7)' }, detail: 'collapse/date-line/attachment/connection/upstream + TEXT_MESSAGE fallback' },
    { sec: '§8 MCP', label: { en: 'MCP integration', ko: 'MCP 통합' }, detail: '5 tools, full 3-tier ack, env auth' },
  ],
};
