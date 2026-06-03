# Hyperbrief Dogfood Entry 04

> 📋 **자기적용 dogfood**: Hyperbrief v0.5.4 SSoT가 *Anthropic Claude 공식 plugin marketplace 등록 결정 + v1.0 readiness rubric codification* 에 적용된 네 번째 사이클의 박제 기록 (§9 `archive_config`).
>
> **decision_id**: `hb-20260603-mktp04`
> **decided_at**: 2026-06-03
> **decided_by**: SoliEstre
> **outcome**: ✅ **defer marketplace registration to v1.0 GA + codify §11.5 v1.0 readiness rubric** (사용자 명시 확장: "1.0 기준이 자의적 — rubric 먼저 세우는 게 우선" + "Claude marketplace 등록 판단 평가에서는 cross-host 차원 제외") → v0.5.5
> **revisit_date**: 2026-09-01
> **ledger_pointer**: `_proposals/006_2026-06-03_hyperbrief/dogfood-entry-04.md`

---

## 1. `brief_original.md` — 사용자가 본 브리핑 원문 (재구성)

본 사이클에서 사용자가 받은 브리핑은 4회 형태 변화를 거쳤다.

- **R1 (declared L2/L2/L2, effective L3-L4 영어 jargon)**: marketplace / community / safety screening / nightly sync / commit SHA pinning / discoverability / governance / novel category / first-mover / framing matrix / MCDA / Toulmin 등 영어 기술 용어 본문 절반 가까이 노출. 사용자 fallback trigger 발화 *"한국어로"* (AF-22).
- **R2 (L1/L1/L1 비유 + 평이한 한국어)**: "공식 가게 / 자유 진열대 / 초안 버전 / 가져다 쓰는 사람" 비유 도입. 3 길 (가길 즉시 / 나길 정식 출시 후 / 다길 영영 우리 동네) + 잘못될 수 있는 일 + 권장 + 결정 요청.
- **R3 (사용자 critique: "1.0 표기 자의적, rubric 먼저")**: 사용자가 *"애초에 정식 출시라고 하는 1.0 버전이라는건 생각보다 많이 자의적인 표기라, 그 기준을 먼저 세우는게 우선일 것 같고, 일단은 현재 상태로 하지만, 현재 수준이 1.0이 score 10이라고 할 때 어느정도인지 평가할 필요 있음"* 명시. 7 차원 rubric 정의 + 각 차원 현재 점수 + 합산 (단순 5.3 / 가중 4.9) 산출.
- **R4 (사용자 추가 critique: "Claude marketplace 판단에서는 cross-host 제외")**: 사용자가 *"애초에 정식 출시라고 하는 1.0 버전 ... 현재 안건은 Claude 용 플러그인을 게시하는 기준이니까 다른 툴에서의 사용에 대해서는 공식 마켓 등록 판단 평가에서만은 제외하는게 맞을 듯"* 명시. 두 평가 자 (Lens A 7-dim 모듈 전체 / Lens B 6-dim host-specific marketplace) 분리. Lens B 점수 별도 산출 (단순 5.5 / 가중 5.1).

R1→R2 가 톤 fallback, R3→R4 가 *평가 자체의 방법론* 개선 — 두 종류의 user feedback 이 한 사이클 안에 동시 발생. 본 dogfood 가 처음으로 *방법론-tier* user critique 를 흡수한 케이스.

본 브리핑 IR 골격:

```jsonc
{
  "decision_id": "hb-20260603-mktp04",
  "section_0_decision_header": {
    "escalation": { "irreversibility": 2, "blast_radius": 3, "time_horizon": 2, "reversal_cost": 2, "sum": 9 },
    "reversibility_class": "one_way_with_migration_path",
    "reversibility_badge_color": "yellow",
    "rapid": { "decider": "user (SoliEstre)", "recommender": "이 에이전트" },
    "cynefin_domain": "complicated",
    "deadline": "no rush",
    "audience_profile": { "audience": 2, "abbreviation": 2, "jargon": 2 }
  },
  "section_8_recommendation": {
    "recommendation_conditional": {
      "recommended": "[inferred] 대안 C — v1.0 GA cut 후 Claude community marketplace 등록 + v1.0 기준은 두 평가 자 (Lens A 7-dim 모듈 전체 / Lens B 6-dim Claude-specific) 로 명시",
      "assumptions": ["[assumed] Anthropic 측 community marketplace nightly sync 정책 대 EG fix cadence 가 호환", "[assumed] EstreUF / 추가 외부 어댑터가 30일 안에 확보 가능", "[assumed] 사용자 confirmed: cross-host portability 차원이 Claude-only marketplace 등록 결정과 무관"]
    },
    "confidence": { "point_estimate": 0.75, "ci_90_low": 0.60, "ci_90_high": 0.85 },
    "cited_tree_node_ids": ["N3"]
  }
}
```

---

## 2. `decision.json` — 결정 캡처

```json
{
  "meta_branch_chosen": "request_investigation → accept (after investigation + rubric codification)",
  "user_premortem": "(not explicit — 사용자가 implicit 으로 surface: 'novel category 라 first-mover 가치 손실 위험'은 R2 에서 인지했으나 'cross-host 차원 제외해도 lens B 점수 sub-threshold' 인 점이 더 결정적)",
  "decided_at": "2026-06-03",
  "decided_by": "SoliEstre",
  "agent_judgment_calls": [
    "두 평가 자를 SSoT 본문에 codify (§11.5) — 결정 자체보다 *결정의 방법론* 박제가 더 load-bearing (재평가 시 같은 자로 점수 비교 가능)",
    "dimension 가중치 default 제시 (수정 빈도 × 2.0, 양식·검증·결정성 × 1.5, 나머지 × 1.0) — adopter 가 tune 가능하나 publish 의무",
    "v1.0 cut threshold (Lens A ≥ 8.0 양 평균) vs marketplace 등록 threshold (Lens B ≥ 7.5 양 평균) 분리 — 정식 출시는 더 보수적 기준이 자연",
    "재평가 cadence — ≥ 2점 차원 이동 OR emergency-fix 시점 OR explicit decision-point trigger (adopter 도 같은 cadence 권장)"
  ],
  "version_after_decision": "v0.5.5"
}
```

---

## 3. `related_user_prompts.md` — 브리핑 ↔ 결정 사이 사용자 추가 prompt

### 3.1 톤 fallback trigger 발화

> "한국어로"

→ 변환: AF-22 자기 인정 + L1/L1/L1 재렌더링 ("공식 가게 / 자유 진열대 / 초안 버전" 비유 도입). v2.5.30 default trigger 목록에 이미 포함된 `한국어로` 가 model self-invoke 만으로는 자동 fallback 안 됨 → hook 활성화 (v2.5.37) 효과의 자기-증명 사이클.

### 3.2 1.0 표기 자의성 critique

> "애초에 정식 출시라고 하는 1.0 버전이라는건 생각보다 많이 자의적인 표기라, 그 기준을 먼저 세우는게 우선일 것 같고, 일단은 현재 상태로 하지만, 현재 수준이 1.0이 score 10이라고 할 때 어느정도인지 평가할 필요 있음."

→ 변환: 7 차원 rubric 정의 + 차원별 0-10 anchored 점수 + 합산 (단순 + 가중). 결정 자체 (즉시 등록 vs defer) 보다 *결정 기준* 을 base layer 로 올림. 본 critique 가 본 cycle 의 가장 load-bearing user input — 단발 결정 → 재사용 가능 방법론으로 전환.

### 3.3 Claude-specific lens critique

> "1.0의 기준으로서는 문제없으나, 현재 안건은 Claude 용 플러그인을 게시하는 기준이니까 다른 툴에서의 사용에 대해서는 공식 마켓 등록 판단 평가에서만은 제외하는게 맞을 듯."

→ 변환: Lens A (7-dim 모듈 전체) vs Lens B (6-dim host-specific marketplace) 분리. 동일 모듈을 *서로 다른 평가 lens* 로 점수 매김. 단발 rubric 이 host-specific 변형 가능 framework 으로 격상.

---

## 4. `recommended_artifacts_applied.md` — 권장 artifact 의 실 적용 결과

### Artifact 1: `Hyperbrief.md §11.5 v1.0 readiness rubric` 신규 sub-section

- **적용 상태**: ✅ 본문 codify — Lens A 7-dim + Lens B 6-dim + 차원별 scoring anchors + 가중치 default + 현재 점수 (Lens A 5.3 simple / 4.9 weighted; Lens B 5.5 simple / 5.1 weighted) + gap 분석 (emergency-fix cadence + external adopter validation 가 binding constraint) + 재평가 cadence
- **target**: `Hyperbrief.md` §11.4 끝과 §11.4 adopter installation note 사이
- **rationale_one_line**: `[verified]` 사용자 R3 + R4 critique 가 결정 자체보다 *결정 방법론* 박제를 더 load-bearing 으로 surface

### Artifact 2: `Hyperbrief.md §11.1 v0.5.5 entry` 신규

- **적용 상태**: ✅ adoption path 에 v0.5.5 항목 추가 — rubric codify + Entry 04 박제 명시
- **rationale_one_line**: `[verified]` v0.5.4 → v0.5.5 의 spec body 변경 추적

### Artifact 3: `Hyperbrief.md frontmatter v0.5.4 → v0.5.5` bump

- **적용 상태**: ✅ status string 이 rubric codify + current scores + marketplace registration deferral 명시
- **rationale_one_line**: `[verified]` frontmatter version + status string 정합

### Artifact 4: `_proposals/006/dogfood-ledger.md` + `Hyperbrief.md §11.2` Entry 04 row 추가

- **적용 상태**: ✅ 외부 ledger + SSoT body recent-3 인덱스 양쪽 갱신
- **rationale_one_line**: `[verified]` §11.2 외부 분리 (v0.4.1) 규율 정합

### Artifact 5: Plugin manifest + 3 package.json `0.5.4 → 0.5.5` bump

- **적용 상태**: ✅ plugin / renderers / mcp 모두
- **rationale_one_line**: `[verified]` 전체 module 버전 정합

### Artifact 6: Promo 페이지 catch-up (hyperbrief.html + index.html + data.js)

- **적용 상태**: ✅ badge / meta description / data.js shipCount
- **rationale_one_line**: `[verified]` 외부 surface 정합

---

## 5. `meta_learnings.md` — 본 사이클이 발견한 schema 갭 / 안티패턴 / 마찰

### 5.1 발견된 schema 갭 (v0.6+ 후보)

이전 Entry 의 갭 외 본 cycle 신규:

1. **결정 방법론 자체의 박제 메커니즘** — 본 cycle 의 가장 load-bearing 발견. Hyperbrief 가 단발 결정을 박제하나, *결정 자체의 평가 방법론* 을 박제하는 슬롯 없음. v0.6 후보: `recommended_methodology[]` 슬롯 — 권장안 외 *결정에 사용된 평가 rubric / framework* 도 함께 박제 (예: 본 §11.5 rubric 같은 메타-결정 도구).
2. **lens-split (다중 평가 시점)** — 동일 의사결정 대상을 서로 다른 lens 로 점수 매기는 경우의 모델링 부재. 본 cycle 이 첫 사례 (Lens A 모듈 / Lens B host-specific). v0.6 후보: schema 의 `evaluation_lens` 필드 — 같은 IR 에 multiple lens score 운반 가능.
3. **자의적 표기 명시화** — "v1.0", "production-ready", "GA", "stable" 같은 자의적 라벨에 대해 *측정 가능한 anchored 기준* 명시 의무. 본 cycle 의 §11.5 가 첫 codify. v0.6 후보: schema 의 `maturity_anchor` 필드 — 자의적 라벨 사용 시 기준 명시 강제.

### 5.2 트리거된 안티패턴

- **AF-22** (MD brief: user confusion trigger but no auto-regen) — R1 → R2 단계에서 발화. trigger_phrases_md default 의 `한국어로` 가 매치되었으나 hook 활성화 (v2.5.37) 의 effective 는 host self-config 승인 게이트 미통과 (별도 사용자 액션) 상태이므로 model self-invoke 만으로 작동. 본 사이클 직전 v2.5.38 §11.4 의 *호스트 self-config 게이트* 명시가 정확히 본 fallback 미작동의 원인 — 자기-증명 cycle 의 또 다른 layer.
- **AF-18** (surface vocabulary mismatches declared audience_profile) — R1 단계 발화. `surface_profile_estimate` 의 기술 도메인 false-negative (Entry 03 5.1 1번 schema 갭) 가 본 cycle 에서도 재발 — heuristic 보정 후보 v0.6 patch 가 여전히 명시 상태.

### 5.3 마찰 보고

- **R1 → R4 의 4-step 톤·방법론 boost**: 사용자 critique 2건 (R3 자의성 + R4 lens-split) 이 단발 결정을 *재사용 가능 방법론* 으로 격상. 본 패턴의 load-bearing 효과는 *향후 모든 maturity-claim 결정* (예: EstreUF v1.0 cut, 다른 모듈의 marketplace 등록) 이 동일 rubric 사용 가능 → cross-project comparison 정합성 보장.
- **사용자 critique 가 SSoT 본문 변경을 강하게 driven** — Entry 01 (5 patches landed in v0.1.1) 패턴의 변형. 단 본 cycle 의 변경은 *결정 자체* 가 아닌 *결정 방법론* — 두 종류의 spec body 변경의 distinction 명시 가능 (v0.6 schema patch 후보 #1 과 합쳐 codify).

### 5.4 v0.5.5 ship summary

- 신규 sub-section 1: `Hyperbrief.md §11.5 v1.0 readiness rubric` (~70 lines — 두 lens 정의 + 7 차원 + scoring anchors + 가중 평균 + 현재 점수 + gap 분석 + re-evaluation cadence)
- §11.1 v0.5.5 entry 신규 (adoption path)
- §11.2 dogfood ledger recent-3 인덱스에 Entry 04 row + 외부 ledger 행 추가
- frontmatter v0.5.4 → v0.5.5
- plugin manifest + 2 package.json `0.5.4 → 0.5.5` bump
- promo catch-up (hyperbrief.html badge + meta + index card + data.js)
- 결정성 invariant 무영향 (본 cut 은 spec body + manifest, runtime 코드 변경 없음)

### 5.5 다음 사이클 후보

- **v0.6 cut 후보 (확장)**:
  - 본 cycle 의 신규 schema 갭 3건 (`recommended_methodology[]` / `evaluation_lens` / `maturity_anchor`)
  - Entry 03 의 갭 (surface_profile_estimate 기술 도메인 false-negative + hook post-response tone evaluation layer)
  - 본 cycle 의 §11.4 host self-config gate 의 *user-side guidance* 추가 (현재 어댑터 측 install runbook 권고만 있음, EG 자체에는 절차적 자동화 부재)
- **90일 (2026-09-01) 재평가** — §11.5 rubric 으로 v0.5.5 점수 재산출. 그 시점에 emergency-fix cadence + external adopter validation 이 어디까지 진행됐는지 측정. 점수 이동 ≥ 2 면 자동 트리거.
- **EstreUF dogfood Entry 01** — 외부 adopter validation 차원 (현재 3점) 을 6점 이상으로 끌어올리는 핵심 단계. 가장 큰 short-term 이득.
- **첫 30일 무수정 baseline** — emergency-fix cadence (현재 2점) 을 5점 이상으로. 단발 cut 으로는 도달 불가, *시간 경과* 가 유일한 방법.

---

*본 archive 는 §9 archive_config 의 네 번째 실 시연이며, 본 cycle 이 *결정 방법론 자체를 박제* 한 첫 사례 — Entry 01-03 의 패턴 (단발 결정 박제) 에서 진화. 사용자 critique 2건 (R3 자의성 + R4 lens-split) 이 결정의 base layer 를 spec body 본문에 codify 시킴으로써 향후 모든 maturity-claim 결정이 같은 rubric 사용 가능. Hyperbrief 의 자기-증명 사이클의 또 다른 layer — 본 모듈이 결정-위임을 규율한다면, 본 cycle 은 그 규율의 *평가 기준 자체* 도 박제되어야 함을 시연.*
