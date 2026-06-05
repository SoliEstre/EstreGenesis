# Hyperbrief v0.6 Candidates — Triage Register

> **What this is**: dogfood Entry 04 (`dogfood-entry-04.md`) §5.1 / §5.5 + 본 v2.5.53 cycle 의 사용자 추가 입력으로부터 누적된 v0.6 사전 후보 안건들의 정리표. 각 항목별 *우선순위* (v0.6 통합 / v0.7+ 미룸 / 거절) + *상태* (definition 완성도) + *근거* 명시. Hyperbrief.md §11.5.3 *Schema stability* 점수 dimension 의 "candidates pending" 카운트 정합.

**작성 시점**: 2026-06-05 (v2.5.53 cut)  
**Hyperbrief 본 spec 버전**: v0.5.6  
**Entry 04 archive**: `dogfood-entry-04.md` (2026-06-03)  
**상위 SSoT**: `Hyperbrief.md` §11.5

---

## 1. 후보 안건 7 군 — 우선순위 정합

| # | 안건명 | 출처 | 우선순위 | 상태 | 추정 작업량 |
|---|---|---|---|---|---|
| 1 | `recommended_methodology[]` 슬롯 | Entry 04 §5.1.1 | **v0.6** | 사양 정의 부분 완료 | mid (schema + renderer) |
| 2 | `evaluation_lens` 필드 | Entry 04 §5.1.2 | **v0.6** | 사양 정의 부분 완료 | mid (schema + renderer) |
| 3 | `maturity_anchor` 필드 | Entry 04 §5.1.3 | **v0.6** | 사양 정의 부분 완료 | mid (schema + renderer) |
| 4 | `surface_profile_estimate` 기술 도메인 heuristic 보정 | Entry 03/04 §5.5 | v0.7 | 진단 명시, 보정 미정 | small (renderer heuristic only) |
| 5 | Hook post-response 톤 평가 layer | Entry 04 §5.5 | v0.7 | 개념만, 사양 부재 | large (hook + skill 새 layer) |
| 6 | §11.4 host self-config gate user-side guidance 자동화 | Entry 04 §5.5 | v0.7 | 진단 명시, 자동화 미정 | small-mid (skill + runbook) |
| 7 | 톤 + 용어 병기 + 적용 범위 + 소급 적용 옵션 | **v2.5.53 cycle 사용자 입력** | **v0.6** | 사양 정의 완료 (본 cycle) | mid (schema + skill + renderer) |

**v0.6 적재**: #1, #2, #3, #7 (총 4건)  
**v0.7+ 미룸**: #4, #5, #6 (총 3건)  
**거절**: 없음

---

## 2. v0.6 적재 항목 — 상세

### 2.1 안건 #1: `recommended_methodology[]` 슬롯

**무엇**: Hyperbrief 가 단발 결정을 박제하나, 결정에 사용된 *평가 방법론* (rubric / framework) 도 함께 박제하는 스키마 슬롯 부재. 본 §11.5 readiness rubric 같은 메타-결정 도구가 명시적 운반 슬롯 없음.

**사양 (proposal)**:

```json
"section_8_recommendation": {
  ...,
  "recommended_methodology": [
    {
      "id": "string",                // 식별자 (예: "hyperbrief-v1-readiness-rubric")
      "name": "string",              // 사람 가독 이름
      "version": "string",
      "anchor_path": "string",       // 본문 위치 (예: "Hyperbrief.md §11.5")
      "applicability": ["string"],   // 어디에 적용 가능 (예: ["module-GA", "marketplace-registration"])
      "rationale_one_line": "string"
    }
  ]
}
```

**근거**: §11.5 자체가 본 슬롯 없이 SSoT 본문에 inlined — 다음 maturity-claim 결정 시 재사용을 위해 schema-tier 슬롯 필요. dogfood Entry 04 의 핵심 발견.

### 2.2 안건 #2: `evaluation_lens` 필드

**무엇**: 같은 의사결정 대상을 서로 다른 lens (관점) 로 점수 매기는 경우의 schema 모델링 부재. §11.5 의 Lens A (모듈 전체 GA) vs Lens B (host-specific marketplace) 가 첫 사례.

**사양 (proposal)**:

```json
"section_0_decision_header": {
  ...,
  "evaluation_lenses": [
    {
      "id": "string",                  // 식별자 (예: "lens-a-module-ga")
      "name": "string",                // 사람 가독 이름
      "dimensions": ["string"],        // 차원 식별자 배열
      "threshold_simple_mean": "number",
      "threshold_weighted_mean": "number",
      "current_simple": "number",
      "current_weighted": "number",
      "verdict": "below | at | above"
    }
  ]
}
```

**근거**: 단일 lens 만 운반하면 cross-lens 일관성 결손 — Hyperbrief brief 1건이 multi-lens 결정 운반 가능해야 함.

### 2.3 안건 #3: `maturity_anchor` 필드

**무엇**: "v1.0" / "GA" / "production-ready" / "stable" 같은 자의적 라벨에 측정 가능한 anchored 기준 명시 의무. §11.5.1 의 anchor scoring 방식이 첫 codify.

**사양 (proposal)**:

```json
"maturity_anchor": {
  "claimed_label": "string",        // 자의적 라벨 (예: "v1.0", "GA")
  "anchor_methodology": "string",   // 평가 방법론 id (안건 #1 의 recommended_methodology[].id 참조)
  "current_score": {
    "simple_mean": "number",
    "weighted_mean": "number"
  },
  "threshold": {
    "simple_mean": "number",
    "weighted_mean": "number"
  },
  "gap_analysis": "string"          // 한 줄 정수
}
```

**근거**: 자의적 라벨이 spec body 전반에 분산되어 anchor-less 사용 시점에 silent semantics drift 위험. schema-tier 슬롯이 작성자에게 anchor methodology 참조 강제.

### 2.4 안건 #7: 톤 + 용어 병기 + 적용 범위 + 소급 적용 옵션

**무엇**: 기존 3축 톤 프로파일 (audience / abbreviation / jargon, 각 L1-L5) **외에** 두 새 분류축 추가:

1. **용어 병기 모드 (term-pairing mode)**: `E` (every, 매번) / `I` (initial, 첫만) / `N` (none, 안함)
2. **적용 범위 (scope)**: `C` (conversation, 대화) / `D` (document, 문서) / `B` (board, Constellation 대시보드) / `R` (review, 검토 사안) / `A` (all, 전반)
3. **소급 적용 (retroactive apply)**: 설정 변경 시점에 기존 내용도 즉시 재작성할지 묻기 — `Y` / `N` / 기본 `prompt`

**사양 (proposal)**:

```json
"audience_profile_fallback": {
  ...,
  "tone_profile": {
    "audience": 1,            // L1-L5
    "abbreviation": 1,        // L1-L5
    "jargon": 1               // L1-L5
  },
  "term_pairing": {
    "mode": "I",              // E | I | N
    "scope": ["C"],           // C | D | B | R 다중선택 가능, A = 모두 포함 shortcut
    "retroactive_apply": "prompt"   // Y | N | prompt (기본)
  }
}
```

**짧은 명령 형식** (skill 가 파싱):

| 한국어 자연어 | 코드 | 설명 |
|---|---|---|
| "톤 1 첫만 대화" | `L1.I.C` | 톤 L1.1.1 + initial + conversation |
| "톤 1 매번 전반" | `L1.E.A` | 톤 L1.1.1 + every + all (C+D+B+R) |
| "톤 2 안함 문서" | `L2.N.D` | 톤 L2.2.2 + none + document |
| "톤 1.1.1 매번 대화+보드" | `L1.E.C+B` | 명시 다축 + 다중 scope |

**suffix 추가**:
- `!` = 소급 적용 강제 (`L1.I.C!` → 묻지 않고 즉시 재작성)
- `?` = 항상 묻기 (`L1.I.C?`)
- 표기 없음 = 기본 `prompt`

**기본값**:
- `tone_profile`: `L2.2.2` (audience-dev / abbreviation-mid / jargon-mid)
- `term_pairing.mode`: `N` (병기 없음)
- `term_pairing.scope`: `["D"]` (문서 전반)
- `term_pairing.retroactive_apply`: `prompt`

**근거**: v2.5.53 cycle 의 사용자 입력. 톤 프로파일이 단일 레벨 axis 외에 *표시 정책* (병기 빈도) 과 *적용 범위* (대화 vs 문서 vs 보드 vs 검토) 도 정밀하게 제어 필요. 특히 multi-surface 환경 (Constellation 대시보드 + 검토 줄 등) 에서 각 surface 마다 다른 톤 적용 가능해야.

**소급 적용 의미**:
- 사용자가 톤 변경 명령 발화 시점에 skill 가 묻기:
  > "기존 내용도 즉시 반영해서 다시 쓸까요? (Y / N)"
- `Y`: 범위 안 모든 기존 출력 (대화 이전 답변 / 문서 이전 단락 / 보드 표시 텍스트 / 검토 줄 항목) 을 새 설정으로 재작성
- `N`: 새 설정은 이후 신규 출력에만 적용

**구현 함의**:
- mini-engine.cjs 가 표시 정책 (`term_pairing`) 을 IR 후처리 단계에 적용 — 용어 dictionary 가 필요 (어떤 단어가 abbrev/jargon 인지)
- 적용 범위 (`scope`) 가 board/review 포함하면 Constellation A2A 채널로 re-emit 신호
- 소급 적용은 history rewrite — 이전 메시지 / 문서 fetch + 재렌더링 + replace

---

## 3. v0.7+ 미룸 항목 — 단축 사양

### 3.1 안건 #4: `surface_profile_estimate` 기술 도메인 heuristic 보정

**왜 미룸**: 보정 방향이 진단만, 구체 alg 미정. v0.5 의 6 heuristic (english_noun_ratio + avg_sentence_length_chars + jargon_terms_per_1000_tokens + first_use_gloss_present + bullet_density + epistemic_tag_form) 의 false-negative 패턴은 *기술 도메인 어휘 사전* 필요. 사전 구축 자체가 별도 작업.

**v0.7 진입 조건**: 도메인별 jargon 사전 (예: `jargon-dict-tech.json` / `jargon-dict-finance.json` 등) 의 외부 source 합의 또는 1+ adopter 의 도메인 어휘 contribution.

### 3.2 안건 #5: Hook post-response 톤 평가 layer

**왜 미룸**: 새 architectural layer 도입. 현재 hook 는 PreToolUse + Stop 두 시점. Post-response 시점 신규 추가 시 Claude Code hook 시점 spec 확장 필요.

**v0.7 진입 조건**: Claude Code hook 시점 spec 의 PostResponse (또는 등가) 안정화 후. Hyperbrief 자체 변경보다 host platform 변경 의존.

### 3.3 안건 #6: §11.4 host self-config gate user-side guidance 자동화

**왜 미룸**: 현재 settings.json 편집 차단 게이트는 *의도된 안전 장치*. 자동화는 곧 silent injection 회피 정책 우회 위험. 사용자 측 guidance 강화 (한 페이지 install runbook 등) 가 더 안전한 path.

**v0.7 진입 조건**: 사용자 측 명시 요청 OR 1+ adopter 의 install runbook 실패 보고.

---

## 4. 다음 사이클 (post-v2.5.53) 진입 흐름

본 triage 가 v2.5.53 cut 의 *문서 산출물* — 실제 사전 변경은 안 함. 다음 단계:

1. **v2.5.54+** (별도 cut): v0.6 schema cut — 안건 #1/#2/#3/#7 통합 (스키마 + 렌더러 + skill 수정 + smoke test 결정성 재검증)
2. **EG cut 시점**: user steering 또는 자연 cadence 시점 (현재 emergency-fix cadence 안정 14+ days 이후 권장)
3. **재평가 trigger**: §11.5.5 cadence — 한 dimension 점수 ≥ 2 이동 시 자동 재산출

본 cut (v2.5.53) 의 schema stability 차원 효과:
- candidates "pending" 카운트 변동 없음 (모두 명시적 분류 완료 — pending → triaged)
- 단 *triaged* 와 *closed* 의 anchor 해석에 따라 +0~1 pt

본 cycle 의 docs maturity 차원 효과:
- one-page quick-start + troubleshooting catalogue 추가 → 7 → 9 (+2 pts)

**현재 추정 (post v2.5.53)**:
- Lens A simple mean: 5.3 + 2/7 ≈ 5.6 (threshold 8.0 미달)
- Lens B simple mean: 5.5 + 2/6 ≈ 5.8 (threshold 7.5 미달)

여전히 binding constraints (emergency-fix cadence + external adopter validation) 가 남음. 본 cut 은 *부수 dimension 보강* 의 단계적 진행.

---

## 5. 본 triage 의 self-application

본 문서 자체가 Hyperbrief 의 §1.5 (dogfood self-application) 의 또 다른 사례 — *결정 방법론* 을 박제하는 dogfood 패턴이 본 triage 의 *우선순위 결정 방법론* 에도 적용. 안건 #1 의 `recommended_methodology[]` 슬롯이 v0.6 에 ship 되면 본 triage 자체가 그 슬롯의 첫 사용 사례 (방법론 = "Hyperbrief v0.6 candidates triage rubric" — 우선순위 = high/medium/low + 의존성).

---

*마지막 수정: 2026-06-05 (v2.5.53 cycle).*
