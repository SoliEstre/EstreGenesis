// docs/shared/data.js — single source of truth for promotional metrics.
// All numbers verifiable in the EstreGenesis repo: Superscalar.md §11 + CHANGELOG.md + git log.

window.EG_DATA = {
  meta: {
    version: 'v2.5.183',
    shipCount: 91,
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
      { key: 'components', label: {
          general: { en: 'Components covered', ko: '다룬 컴포넌트 수' },
          dev: { en: 'Components covered', ko: '컴포넌트 커버리지' },
          expert: { en: 'Components covered', ko: '컴포넌트 커버리지' },
        }, a: 145, b: 144, unit: '', winner: 'tie', note: { en: 'Equivalent — both arms reached full source', ko: '동등 — 양 arm 모두 전체 소스 도달' } },
      { key: 'endpoints', label: {
          general: { en: 'API endpoints found', ko: '찾아낸 API 엔드포인트 수' },
          dev: { en: 'Endpoints enumerated', ko: '엔드포인트 enumerate' },
          expert: { en: 'Endpoints enumerated', ko: '엔드포인트 enumerate' },
        }, a: 314, b: 485, unit: '', winner: 'B', delta: '+54%', note: { en: 'B more exhaustive (auth matrix)', ko: 'B가 더 철저 (인증 매트릭스)' } },
      { key: 'crossrefs', label: {
          general: { en: 'Sourced citations (more is better)', ko: '근거 인용 수 (많을수록 좋음)' },
          dev: { en: 'crossRefs (grounding)', ko: 'crossRefs (grounding)' },
          expert: { en: 'crossRefs (grounding)', ko: 'crossRefs (grounding)' },
        }, a: 49, b: 107, unit: '', winner: 'B', delta: '+118%', highlight: true, note: { en: "B's headline win — grounded citations replace assumption", ko: 'B의 핵심 우위 — 추측 대신 실 계약 인용' } },
      { key: 'assumptions', label: {
          general: { en: 'Speculative statements (fewer is better)', ko: '추측에 의존한 진술 수 (적을수록 좋음)' },
          dev: { en: 'Assumptions (speculation)', ko: '추측성 진술 (Assumptions)' },
          expert: { en: 'Speculative claims (assumptions)', ko: '추측성 진술 (assumptions)' },
        }, a: 62, b: 37, unit: '', winner: 'B', delta: '−40%', highlight: true, note: { en: 'B replaced speculation with sourced fact', ko: 'B가 추측을 실 근거로 대체' } },
      { key: 'critical', label: {
          general: { en: 'Critical-severity findings', ko: '치명적 수준 발견' },
          dev: { en: 'Critical findings', ko: 'Critical 발견' },
          expert: { en: 'Critical findings', ko: 'Critical 발견' },
        }, a: 13, b: 14, unit: '', winner: 'tie' },
      { key: 'high', label: {
          general: { en: 'High-severity findings', ko: '심각한 수준 발견' },
          dev: { en: 'High findings', ko: 'High 발견' },
          expert: { en: 'High findings', ko: 'High 발견' },
        }, a: 36, b: 36, unit: '', winner: 'tie' },
      { key: 'wallclock', label: {
          general: { en: 'Time taken (minutes)', ko: '걸린 시간 (분)' },
          dev: { en: 'Wall-clock time', ko: 'Wall-clock 시간' },
          expert: { en: 'Wall-clock', ko: 'Wall-clock' },
        }, a: 8.9, b: 23.6, unit: 'min', winner: 'A', delta: '2.65× (A faster)', note: { en: 'Cost of phase serialisation, NOT parallel inefficiency', ko: '병렬 비효율 아닌 phase 직렬화 비용' } },
      { key: 'tokens', label: {
          general: { en: 'Tokens used (millions)', ko: '사용한 토큰 (백만)' },
          dev: { en: 'Tokens', ko: '토큰' },
          expert: { en: 'Tokens', ko: '토큰' },
        }, a: 1240000, b: 1340000, unit: 'M', winner: 'A', delta: '+8% (B)', display: { a: '1.24M', b: '1.34M' } },
      { key: 'agents', label: {
          general: { en: 'Number of agents', ko: '에이전트 수' },
          dev: { en: 'Agents', ko: 'Agents' },
          expert: { en: 'Agents', ko: 'Agents' },
        }, a: 9, b: 10, unit: '', winner: 'A', delta: '+1 (retire agent)' },
    ],
    bOnlyArtifacts: [
      {
        label: {
          general: { en: 'Cleaning up overlapping findings', ko: '겹치는 발견 정리' },
          dev: { en: 'Cross-dimension deduplication', ko: '차원 간 중복 정리' },
          expert: { en: 'Cross-dimension deduplication', ko: '차원 간 중복 정리' },
        },
        detail: {
          general: {
            en: "When nine independent dimensions look at the same code, they often surface the same issue several times over. In this audit, 47 such overlapping findings were merged in Arm B into 62 unique risk groups. Arm A skips this step entirely, so the same risk is reported repeatedly as if each occurrence were a separate problem.",
            ko: '9개 차원이 같은 코드를 각자 들여다보면 자연스럽게 같은 문제를 여러 번 발견하게 됩니다. 이번 점검에서는 그렇게 겹치는 47건의 항목이 Arm B에서 62개의 고유한 위험 그룹으로 묶였습니다. Arm A는 이 정리 단계를 건너뛰기 때문에, 동일한 위험이 마치 별개의 문제인 듯 여러 번 보고됩니다.',
          },
          dev: {
            en: "Arm B's retire stage merges 47 cross-dimension duplicate findings — surfaced independently across the nine dimensions of the audit — into 62 unique risk groups. Arm A omits this deduplication step entirely, allowing identical risks to be reported as separate findings under different dimension headings.",
            ko: 'Arm B의 retire 단계가 9개 차원에 걸쳐 독립적으로 발견된 47건의 차원 간 중복 항목을 62개의 고유 risk-group으로 병합합니다. Arm A에서는 이 dedup 단계가 전혀 수행되지 않기 때문에, 동일한 위험이 서로 다른 차원의 표제 아래 별개의 발견으로 중복 보고되는 결과가 발생합니다.',
          },
          expert: {
            en: "In Arm B, the retire stage merges 47 cross-dimension duplicate observations, identified across the nine dimensions of the audit, into 62 unique risk groups. This deduplication operation is absent in Arm A; consequently, identical risks are reported as separate findings under disparate dimension headings.",
            ko: 'Arm B의 retire 단계는 audit의 9개 차원에 걸쳐 식별된 47건의 차원 간 중복 관찰을 62개의 고유 risk-group으로 병합한다. 본 deduplication 작업은 Arm A에 부재하며, 그 결과 동일한 위험이 상이한 차원의 표제 아래 별개의 발견으로 중복 보고된다.',
          },
        },
      },
      {
        headline: true,
        label: {
          general: { en: 'Catching a real contradiction', ko: '실제 모순 잡아내기' },
          dev: { en: 'Consistency gate — real contradiction resolution', ko: 'Consistency gate — 실 모순 해소' },
          expert: { en: 'Consistency gate — reconciliation of contradictions', ko: 'Consistency gate — 모순의 reconciliation' },
        },
        detail: {
          general: {
            en: "The specification said user passwords were hashed one way; the actual code used a different way. Both approaches saw both halves of this contradiction during the run, but only Arm B paired the two observations together and flagged the discrepancy as a real problem. In the naïve arm, the two halves remained as separate, unconnected notes.",
            ko: '사용자 비밀번호의 해시 방식이 사양에는 한 가지로 적혀 있었지만, 실제 코드에서는 다른 방식이 쓰이고 있었습니다. 두 방식 모두 실행 중에 이 모순의 양 절반을 각각 보긴 했으나, 두 관찰을 서로 연결해 실제 문제로 짚어낸 것은 Arm B뿐이었습니다. 단순 병렬 쪽에서는 두 절반이 서로 연결되지 않은 별개의 메모로 남았습니다.',
          },
          dev: {
            en: "Both arms surfaced the two halves of a USER_PASSWORD-class hash-algorithm contradiction — the foundation specification declaring one algorithm whilst three consumer code paths used another. However, only the consistency gate at Arm B's retire stage paired the two observations and reconciled them into a confirmed contradiction; in Arm A the two halves remained independent findings, neither of which was on its own sufficient to surface the underlying defect.",
            ko: '양 arm 모두 USER_PASSWORD-class 해시 알고리즘 모순의 양 절반 — foundation 사양은 한 알고리즘을 선언하고 있었으나, 3개의 consumer 코드 경로는 다른 알고리즘을 사용하고 있었음 — 을 표면화시켰습니다. 그러나 두 관찰을 짝지어 실 모순으로 reconciliation한 것은 Arm B의 retire 단계 consistency gate가 유일하며, Arm A에서는 두 절반이 독립된 발견으로 잔존했을 뿐, 어느 쪽도 단독으로는 기저의 결함을 표면화하기에 충분하지 않았습니다.',
          },
          expert: {
            en: "Both arms surfaced both halves of a USER_PASSWORD-class hash-algorithm contradiction, namely a divergence between the algorithm declared in the foundation specification and the algorithm observed in the consumer execution paths. Only Arm B, by means of the consistency gate at its retire stage, paired the two structurally distinct observations and reconciled them into a confirmed contradiction; in Arm A the observations subsisted as independent findings, neither of which was, taken in isolation, sufficient to surface the underlying defect.",
            ko: '양 arm은 모두 USER_PASSWORD에 해당하는 해시 알고리즘 모순의 양 절반, 즉 foundation 사양에 선언된 알고리즘과 consumer 실행 경로에서 관찰된 알고리즘 사이의 불일치를 표면화시켰다. 그러나 Arm B만이 retire 단계의 consistency gate를 통하여 구조적으로 분리된 두 관찰을 짝지어 실 모순으로 reconciliation하였으며, Arm A에서는 양 관찰이 독립된 발견으로 잔존하였을 뿐, 단독으로는 기저 결함의 표면화에 이르지 못하였다.',
          },
        },
      },
      {
        label: {
          general: { en: 'Surveying what was missed', ko: '빠진 부분 파악하기' },
          dev: { en: 'Completeness critic — gap mapping', ko: 'Completeness critic — 빈틈 매핑' },
          expert: { en: 'Completeness critic — gap survey', ko: 'Completeness critic — gap survey' },
        },
        detail: {
          general: {
            en: 'Identifies eleven specific areas the audit did not fully cover and turns them into a backlog for the next round. The step prevents the audit from concluding without anyone knowing what was left unexamined.',
            ko: '점검에서 충분히 다루지 못한 영역 11곳을 짚어내 다음 작업을 위한 backlog로 만듭니다. 무엇이 빠졌는지 모른 채로 점검이 끝나버리는 일이 없도록 막아주는 단계입니다.',
          },
          dev: {
            en: "Arm B's retire stage maps eleven named completeness gaps and forwards them as a backlog for the next iteration. Arm A lacks this survey entirely, so when the run concludes there is no record of which regions remained uncovered.",
            ko: 'Arm B의 retire 단계가 11개의 명명된 completeness gap을 매핑하여 다음 iteration의 backlog로 전달합니다. Arm A에는 해당 survey가 부재하기 때문에, 실행이 종료되는 시점에 어떤 영역이 cover되지 않았는지가 기록되지 않습니다.',
          },
          expert: {
            en: "Arm B's retire stage enumerates eleven named completeness gaps left uncovered by the audit and forwards them as a backlog for the subsequent iteration. Arm A lacks the corresponding survey; consequently, the set of uncovered regions remains indeterminate at the conclusion of the run.",
            ko: 'Arm B의 retire 단계는 audit에서 cover되지 아니한 11개의 명명된 completeness gap을 매핑하여, 후속 iteration의 backlog로 forwarding한다. Arm A에는 해당 survey가 부재하므로, 실행 종료 시점에 uncovered 영역의 집합은 미확정 상태로 잔존한다.',
          },
        },
      },
      {
        label: {
          general: { en: 'Re-checking earlier findings + adding new ones', ko: '이전 발견 재확인 + 새 발견 추가' },
          dev: { en: 'Cross-confirmation of findings — S1–S16 plus new X1–X4', ko: '발견의 교차 확인 — S1–S16 및 신규 X1–X4' },
          expert: { en: 'Cross-confirmation of findings — S1 through S16 with new X1 through X4', ko: '발견의 교차 확인 — S1–S16 및 신규 X1–X4' },
        },
        detail: {
          general: {
            en: 'All sixteen findings carried over from earlier audits were re-confirmed during this run, and not a single one was refuted. Six of them were raised in severity, and four entirely new findings were added — each independently confirmed from three different angles.',
            ko: '이전 점검에서 보고된 16개 발견이 이번 실행에서 모두 재확정되었고, 그중 한 건도 부정되지 않았습니다. 그중 6건은 심각도가 상향 조정되었으며, 새로운 4건의 발견이 추가되었고, 각각은 서로 다른 3개 차원에서 독립적으로 확인되었습니다.',
          },
          dev: {
            en: 'All sixteen findings carried forward from prior audits (S1–S16) were re-confirmed during this run, with no refutations recorded. Six of them were escalated in severity, and four new findings (X1–X4) were added, each cross-confirmed across three or more dimensions independently.',
            ko: '이전 audit에서 표면화된 16개 발견(S1–S16) 전체가 본 실행에서 재확정되었으며, refutation은 한 건도 발생하지 않았습니다. 그중 6건의 severity가 상향되었고, X1–X4의 4개 신규 발견이 추가되었으며, 각 신규 발견은 3개 이상의 차원에서 독립적으로 cross-confirmation되었습니다.',
          },
          expert: {
            en: 'The present run produced no refutations across the sixteen findings (S1–S16) carried forward from prior audits, all sixteen having been re-confirmed. Six of these were thereby escalated in severity, and four new findings (X1–X4) were introduced, each independently cross-confirmed across three or more dimensions.',
            ko: '본 실행은 선행 audit에서 표면화된 16개 발견(S1–S16) 전반에 대하여 어떠한 refutation도 산출하지 아니하였으며, 16건 모두를 재확정하였다. 그중 6건의 severity가 상향 조정되었고, 4건의 신규 발견(X1–X4)이 추가되었으며, 각 신규 발견은 3개 이상의 차원에 걸쳐 독립적으로 cross-confirmation되었다.',
          },
        },
      },
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
    {
      sec: '§13.11 rule 5',
      label: {
        general: { en: 'Declaring how an attachment travels', ko: '첨부 파일의 전달 방식을 명시하기' },
        dev: { en: 'Attachment transport-mode', ko: '첨부 transport-mode' },
        expert: { en: 'Attachment transport-mode discipline', ko: '첨부 transport-mode 규율' },
      },
      detail: {
        general: {
          en: "When a message has a file attached, the sender must now declare how that file travels — by local path, embedded directly in the message body, by URL link, or as a chunked transfer. With the mode made explicit up front, the receiver can pick the correct handling path before the file even arrives.",
          ko: '메시지에 파일을 첨부할 때, 발신자는 그 파일이 어떻게 전달되는지를 미리 명시해야 합니다 — 로컬 경로 · 본문 내장 · URL 링크 · 청크 전송 중 하나로요. 전달 방식이 미리 명시되어 있으면, 수신자는 파일이 도착하기 전에 어떤 방식으로 처리할지 미리 정해둘 수 있습니다.',
        },
        dev: {
          en: "The attachment envelope must declare one of four transport modes in its `source` field — local_path, embedded, url, or chunked. This lets the receiver select the appropriate handling path in advance for file payloads that cross environment boundaries, removing the need for content-based inference.",
          ko: '첨부 envelope의 `source` 필드에 local_path · embedded · url · chunked의 네 가지 transport-mode 중 하나를 반드시 명시하도록 규정합니다. 이를 통해 환경 간 경계를 넘는 파일 페이로드에 대해 수신 측이 처리 경로를 사전에 선택할 수 있게 되며, 내용 기반 추론에 의존할 필요가 없어집니다.',
        },
        expert: {
          en: "The attachment envelope is required to declare, by means of its `source` field, exactly one of four transport modes — local_path, embedded, url, and chunked. This discipline ensures that the receiver may select the appropriate handling path in advance for any file payload traversing inter-environment boundaries, thereby obviating content-based inference at the receiver.",
          ko: '첨부 envelope에 대하여 local_path, embedded, url, chunked의 네 transport-mode 중 정확히 하나를 source 필드를 통해 선언하도록 요구한다. 본 규율은 환경 간 경계를 넘는 임의의 파일 페이로드에 대하여 수신자가 처리 경로를 사전에 결정할 수 있도록 보장하며, 이에 따라 수신 측에서의 내용 기반 추론을 배제한다.',
        },
      },
    },
    {
      sec: '§13.13.2',
      label: {
        general: { en: "Making sure messages don't get lost", ko: '메시지가 사라지지 않도록 보장' },
        dev: { en: 'At-least-once relay reliability', ko: 'At-least-once relay 신뢰성' },
        expert: { en: 'At-least-once relay semantics', ko: 'At-least-once relay 의미론' },
      },
      detail: {
        general: {
          en: "A rule that keeps messages from quietly disappearing in transit. The server holds onto each outbound message until delivery is confirmed; if no confirmation comes back, it sends it again. The receiver filters duplicates so the same message gets processed only once, even when it arrives twice.",
          ko: '메시지가 전달 도중에 조용히 사라지는 일이 없도록 막아주는 규칙입니다. 서버는 보낸 메시지를 도착 확인이 들어올 때까지 보관하다가, 확인이 오지 않으면 다시 보냅니다. 수신 측은 같은 메시지가 두 번 도착하더라도 한 번만 처리되도록 중복을 걸러냅니다.',
        },
        dev: {
          en: 'A server-side pending queue retains each outbound message until an ACK is received, removing it on ACK and retransmitting in the absence of one. The receiver guarantees that the same message is not processed twice through an LRU deduplication keyed by message ID. The relay\'s reliability tier accordingly rises from at-most-once to at-least-once.',
          ko: '서버 측 pending queue가 outbound 메시지를 ACK 수신 시점까지 보존하다가, ACK 수신 시에는 제거하고 ACK 부재 시에는 재전송합니다. 수신 측은 message ID 기반 LRU dedup을 통해 동일 메시지가 두 번 처리되지 않도록 보장하며, 이로써 relay의 신뢰성 등급이 at-most-once에서 at-least-once로 상승합니다.',
        },
        expert: {
          en: "The server-side pending queue retains each outbound message until acknowledgement, removing it upon ACK receipt and triggering retransmission in its absence. The receiver guards against duplicate processing of the same message by means of an LRU deduplication keyed on message identifier. The mechanism thereby elevates the relay's reliability tier from at-most-once to at-least-once.",
          ko: '서버 측 pending queue는 ACK 수신 시점까지 outbound 메시지를 보존하며, ACK 수신 시 이를 제거하고 ACK 부재 시에는 재전송을 트리거한다. 수신 측은 message ID에 기반한 LRU deduplication을 통해 동일 메시지의 이중 처리를 방지한다. 본 메커니즘은 이로써 relay의 신뢰성 등급을 at-most-once에서 at-least-once로 격상시킨다.',
        },
      },
    },
    {
      sec: '§13.16.12',
      label: {
        general: { en: 'Rules for how the shared dashboard behaves', ko: '공유 대시보드의 동작 규칙' },
        dev: { en: 'Dashboard render patterns (1–7)', ko: 'Dashboard render 패턴 (1–7)' },
        expert: { en: 'Dashboard render patterns', ko: 'Dashboard render 패턴' },
      },
      detail: {
        general: {
          en: "Seven rules describing how the shared dashboard must behave: a collapse indicator for long messages, a date divider between days, attachment cards for files, a connection indicator for who's online, upstream tab re-exposure, upstream A2A classification, and a fallback that quietly recovers attachment cards even when a sender uses the wrong format.",
          ko: '공유 대시보드가 어떻게 동작해야 하는지를 7개의 규칙으로 정리한 것입니다 — 긴 메시지의 접힘 표시, 날짜가 바뀔 때의 구분선, 파일 첨부 카드, 누가 접속 중인지 보여주는 표시, 업스트림 탭의 재노출, 업스트림 A2A 분류, 그리고 발신자가 잘못된 형식으로 보내도 첨부 카드를 조용히 복구해주는 fallback이 포함됩니다.',
        },
        dev: {
          en: "Seven protocol-tier UI behaviours codified during the dogfood run: the collapse indicator, the date-line divider, attachment chips, the connection indicator, upstream tab re-exposure, upstream A2A classification, and a TEXT_MESSAGE-to-A2A-card fallback acting as a defence layer for non-conformant senders. A conformant dashboard implementation is required to satisfy all seven.",
          ko: 'dogfood 실행 과정에서 codify된 7개의 protocol-tier UI 행위 규약입니다 — collapse indicator, 날짜 divider, 첨부 chip, 연결 indicator, 업스트림 탭의 재노출, 업스트림 A2A 분류, 그리고 비정합 발신자에 대한 방어 계층으로 동작하는 TEXT_MESSAGE → A2A card fallback. 정합한 대시보드 구현이라면 이 7개를 모두 충족해야 합니다.',
        },
        expert: {
          en: 'A normative set of seven protocol-tier UI behaviours codified during the dogfood run — namely the collapse indicator, the date-line divider, attachment chips, the connection indicator, upstream tab re-exposure, upstream A2A classification, and a TEXT_MESSAGE-to-A2A-card fallback constituting a defence layer against non-conformant senders. Any conformant dashboard implementation is required to satisfy all seven.',
          ko: 'dogfood 실행 중 codify된 7개의 protocol-tier UI 행위 규약으로 구성된 규범적 집합이다. 즉 collapse indicator, 날짜 divider, 첨부 chip, 연결 indicator, 업스트림 탭의 재노출, 업스트림 A2A 분류, 그리고 비정합 발신자에 대한 방어 계층으로 동작하는 TEXT_MESSAGE → A2A card fallback이 이에 해당하며, 정합한 대시보드 구현은 이를 전부 충족하여야 한다.',
        },
      },
    },
    {
      sec: '§8 MCP',
      label: {
        general: { en: 'Letting Claude Code sessions join the workspace', ko: 'Claude Code 세션을 작업 공간에 합류시키기' },
        dev: { en: 'MCP integration', ko: 'MCP 통합' },
        expert: { en: 'MCP integration specification', ko: 'MCP 통합 사양' },
      },
      detail: {
        general: {
          en: 'Lets a Claude Code session join the live workspace as a first-class participant — reading what is happening, sending messages, and waiting for responses. Comprises five MCP tools, the 3-tier acknowledgement model, and authentication via environment variables.',
          ko: 'Claude Code 세션이 실시간 작업 공간에 정식 참여자로 합류할 수 있게 해줍니다 — 진행 상황을 읽고, 메시지를 보내고, 응답을 기다릴 수 있도록요. 5개의 MCP 도구, 3단계 확인 모델, 그리고 환경 변수 기반의 인증으로 구성됩니다.',
        },
        dev: {
          en: 'Five MCP tools (board_state_get, board_history_tail, agent_list_get, a2a_emit, a2a_wait_ack), the full 3-tier acknowledgement model, and role-keyed environment-variable authentication. The MCP session lifecycle is mapped onto logical agent presence, so the host appears as a participant in the dashboard for as long as the session is alive.',
          ko: '5개의 MCP 도구(board_state_get · board_history_tail · agent_list_get · a2a_emit · a2a_wait_ack), 전체 3-tier acknowledgement 모델, 그리고 역할 기반 환경 변수 인증으로 구성됩니다. MCP 세션의 lifecycle은 논리적 에이전트의 presence에 매핑되며, 이에 따라 host는 세션이 살아있는 동안 대시보드에 참여자로 표시됩니다.',
        },
        expert: {
          en: 'An integration specification comprising five MCP tools — board_state_get, board_history_tail, agent_list_get, a2a_emit, and a2a_wait_ack — the full 3-tier acknowledgement model, and role-keyed environment-variable authentication. The MCP session lifecycle is mapped onto logical presence within the AgentList, by which means the host AI session is admitted as a first-class agent within the system.',
          ko: '5개의 MCP 도구 — board_state_get, board_history_tail, agent_list_get, a2a_emit, a2a_wait_ack — 와, 전체 3-tier acknowledgement 모델, 그리고 역할 기반 환경 변수 인증으로 구성되는 통합 사양이다. MCP 세션의 생명주기는 AgentList 상의 논리적 presence에 사상되며, 이로써 host AI 세션은 본 시스템 내에서 정식 에이전트로 admitted된다.',
        },
      },
    },
  ],
};
