# Hyperbrief Dogfood Entry 01

> 📋 **자기적용 dogfood**: Hyperbrief v0.1 SSoT가 *자기 자신의 정독·정착 결정*에 처음 적용된 사이클의 박제 기록 (§9 `archive_config`).
>
> **decision_id**: `hb-20260603-a1b2c3`
> **decided_at**: 2026-06-03
> **decided_by**: SoliEstre
> **outcome**: ✅ **accept** — 대안 B (조건부 승인 + 2 patch) → 후속 사용자 보완 요청 3건 합류 → 총 **5 patches → v0.1.1**
> **revisit_date**: 2026-09-01
> **ledger_pointer**: `_proposals/006_2026-06-03_hyperbrief/dogfood-entry-01.md`

---

## 1. `brief_original.md` — 사용자가 본 브리핑 원문 (재구성)

본 사이클에서 사용자가 받은 브리핑은 2회 형태 변화를 거쳤다.

- **R1 (initial v0.1 spec strict)**: epistemic tag `[verified|inferred|assumed|unknown]` inline 강제 + 전 9 섹션 풀 — 사용자 피드백 *"솔직히 현재 브리핑 내용은 전혀 눈에 안들어와"*.
- **R2 (audience_profile L2/L2/L2 default, 톤 시스템 patch 후)**: 태그를 `확인됨/추론/가정/미상` 한국어로 prose에 녹임 + 표 + 자연 산문. 사용자 가독성 확인.
- **R3 (각 patch L1/L1/L1 간략 브리핑)**: 사용자 추가 요청 *"각 패치에 대해 톤 옵션 전체 level 1로 해서 간략 브리핑해줘"* — 비유 + 풀 서술 + 전문 용어 회피.

R2 본문의 §0~§9 골격은 본 archive와 동일 보존; R3 patch별 간략 브리핑은 본 archive `recommended_artifacts_applied.md` (4번 항목)에 patch 단위로 정리.

본 브리핑 IR 골격 (요약):

```jsonc
{
  "decision_id": "hb-20260603-a1b2c3",
  "section_0_decision_header": {
    "escalation": { "irreversibility": 2, "blast_radius": 2, "time_horizon": 2, "reversal_cost": 2, "sum": 8 },
    "reversibility_class": "one_way_with_migration_path",
    "reversibility_badge_color": "yellow",
    "rapid": {
      "recommender": "이 에이전트",
      "decider": "user (SoliEstre)",
      "performer": ["이 에이전트"],
      "input_contributors": ["6-axis subagents", "Hermes (간접)", "Constellation/Superscalar SSoT"],
      "agree_holders": ["user 단독"]
    },
    "cynefin_domain": "complicated",
    "deadline": "no rush",
    "recommended_reading_minutes": 5,
    "audience_profile": { "audience": 2, "abbreviation": 2, "jargon": 2 }
  },
  "section_8_recommendation": {
    "recommendation_conditional": {
      "recommended": "[inferred] 대안 B (조건부 승인 + §11.3 EstreUF + §10.3 Phase 1 fallback)",
      "recommended_artifacts": [
        { "artifact_type": "spec", "target_file": "Hyperbrief.md", "target_anchor": "§11.3", "body": "<patch 1 본문 — 본 archive recommended_artifacts_applied.md 참조>" },
        { "artifact_type": "spec", "target_file": "Hyperbrief.md", "target_anchor": "§10.3", "body": "<patch 2 본문 — 본 archive recommended_artifacts_applied.md 참조>" }
      ],
      "assumptions": ["[assumed] patch 2건이 사용자 추가 정독 없이 SSoT 흡수 가능", "[assumed] EstreUF/EG ledger 네임스페이스 분리 가능"],
      "fallback_if_assumption_violated": "[inferred] decision_id에 hb-eg-/hb-uf- prefix · schema minor patch",
      "switch_if": "[inferred] 사용자가 §5 비용 우려 표명 → 대안 D"
    },
    "confidence": { "point_estimate": 0.78, "ci_90_low": 0.65, "ci_90_high": 0.88 },
    "cited_tree_node_ids": ["N4"]
  }
}
```

---

## 2. `decision.json` — 결정 캡처

```json
{
  "meta_branch_chosen": "accept",
  "user_premortem": "둘 다 보완재라서 잘못될 시나리오 추측의 여지가 없는 편",
  "decided_at": "2026-06-03",
  "decided_by": "SoliEstre",
  "augmented_with_followup_patches": ["P3", "P4", "P5"],
  "version_after_decision": "v0.1.1"
}
```

---

## 3. `related_user_prompts.md` — 브리핑 ↔ 결정 사이 사용자 추가 prompt

브리핑 발행 후 → 결정 확정까지 사용자가 추가 prompt한 사안 (이게 v0.1.1 patches로 변환된 핵심 입력).

### 3.1 톤 시스템 도입 요청

> "결정 전에 일단, 우리가 EstreGenesis docs(promo html) 작성하면서 내용 톤을 3단계(일반인/개발자/전문-학술-)로 나눴었잖아? 거기에 중간 단계를 추가해서 총 5단계의 문서 톤을 설정할 수 있도록 하는걸 Herperbrief에 추가하고, 기본값은 일반(일반인)과 개발(개발자)의 중간단계로 하는걸로 반영해주고, 추가로 브리핑 본문에 축약 표현과 전문 표현을 어느 정도로 쓸건지도 각각 별도 설정값으로 마찬가지로 5단계(축약 5단계 & 전문표현 5단계)로 해서 추가하고, 이것도 level 2(1~5 중)를 기본값으로 하는걸로 반영해줘. 반영하고 기본값으로 브리핑 재작성해줘. 솔직히 현재 브리핑 내용은 전혀 눈에 안들어와."

→ 변환: §5.6 audience_profile 3축 × 5단계 system. 기본값 `{audience: 2, abbreviation: 2, jargon: 2}`. SSoT §5.6 + schema AudienceProfile + AF-17/18/19 + MUST-16/17 + SHOULD-5/6/7. R2 브리핑 재작성.

### 3.2 누락 본문 지적

> "patch 2건에 대한 사안 설명이 포함되어있는거 맞나? 구분이 잘 안돼"

→ 변환 (P3): §8.recommendation_conditional.recommended_artifacts[] schema slot (each `{artifact_type, target_file, target_anchor, body, rationale_one_line}`) + SSoT §8 spec + §10.1 MUST-18 + AF-20 + SKILL.md gloss. **본 dogfood가 발견한 v0.1 spec의 가장 load-bearing schema gap**.

### 3.3 L1 톤 간략 브리핑 요청

> "각 패치에 대해 톤 옵션 전체 level 1로 해서 간략 브리핑해줘."

→ 변환: P4 (톤-바닥 fallback affordance)의 운영 시연. patch 1 = "카페 가맹점이 같은 영수증 발급기를 함께 쓸 때 가맹점 코드 붙이는 약속". patch 2 = "본 건물 짓는 동안 임시 가설물 운영 규칙".

### 3.4 추가 보완 요청 3건

> "패치 추가 수락. 둘 다 보완재라서 잘못될 시나리오 추측의 여지가 없는 편. 그리고 방금 내가 추가 요청을 했던 상황 처럼, 주요 사안 설명 누락 방지 보완을 해야 할 것 같고, 톤 옵션 전체 최저 내용으로의 fallback 옵션(번역 또는 현재 언어 표기 포함 "뭔 소리야? 한국어로 번역해줘"-재치 차원의 표기- 버튼으로 트리거)도 포함시키는게 좋을 것 같아(html의 경우, md의 경우 md를 훑어본 사용자 응답이 이와 유사한 상황인 경우 생성해서 제공.) 그리고 결정 사항과 관련 추가 프롬프트한 사안은 브리핑 원문과 함께 개발문서 차원 중대결정 기록으로 박제하도록 하는 부분 추가(이 부분은 옵션이지만 기본값 on)하면 좋을 듯. 완료되면 변환 도구를 어떻게 하면 좋겠는지 후속 브리핑해줘."

→ 변환:
- **P3** (이미 3.2 발견 시점에 진단됨): SSoT §8 본문 강제 + schema slot + MUST-18 + AF-20.
- **P4**: §5.6.7 tone-floor fallback affordance + AudienceProfileFallback schema + HTML 항상 노출 버튼 + MD 트리거 phrases 감지 + AF-21/22 + MUST-19.
- **P5**: §9 archive_config (default ON) + 5-element bundle (brief_original + decision + related_user_prompts + recommended_artifacts_applied + meta_learnings) + schema ArchiveConfig + AF-23.
- **후속**: 변환 도구 (Phase 2 renderer) follow-up 브리핑 (별도 hb-* 신규 id).

---

## 4. `recommended_artifacts_applied.md` — 권장 artifact 5건의 실 적용 결과

### Patch 1 (§11.3 cross-seed adoption — EstreUF)

- **적용 상태**: ✅ 사용자 1차 요청 그대로 적용 (verbatim)
- **target**: `Hyperbrief.md` §11.3 신규 sub-section (§11.2 dogfood ledger 다음)
- **rationale_one_line**: `[verified]` 사용자가 EstreUF 도입 명시 → cross-seed 어댑터 규율을 SSoT에 명시

### Patch 2 (§10.3 Phase 1 transition rules)

- **적용 상태**: ✅ 사용자 1차 요청 그대로 적용 (verbatim)
- **target**: `Hyperbrief.md` §10.3 신규 sub-section (§10.2 SHOULD 다음)
- **rationale_one_line**: `[verified]` renderer 부재 구간의 운영 규칙 명시 — Pre-mortem γ (MD/HTML drift) 대응

### Patch 3 (§8 recommended_artifacts schema slot — 사용자 보완 요청 P3)

- **적용 상태**: ✅ 추가 보완 patch로 합류
- **target**: SSoT §8 본문 + `hyperbrief.schema.json` RecommendedArtifact $def + section_8 properties + MUST-18 + AF-20 + SKILL.md §8 가이드
- **rationale_one_line**: `[verified]` 본 dogfood Entry 01의 발견 — 사용자가 "patch 본문이 어디 있어?" 라고 지적 → v0.1 spec의 구조적 gap을 v0.1.1에서 메움

### Patch 4 (§5.6.7 tone-floor fallback affordance — 사용자 보완 요청 P4)

- **적용 상태**: ✅ 추가 보완 patch로 합류
- **target**: SSoT §5.6.7 + AudienceProfileFallback schema + brief.html.template 헤더 버튼 + SKILL.md `audience_profile_fallback` 항 + AF-21/22 + MUST-19
- **rationale_one_line**: `[verified]` knob 모르는 사용자도 단일 액션으로 floor 도달 가능하게 만드는 escape hatch

### Patch 5 (§9 archive_config — 사용자 보완 요청 P5)

- **적용 상태**: ✅ 추가 보완 patch로 합류 — *본 archive 파일이 그 결과물 자체*
- **target**: SSoT §9 본문 확장 + ArchiveConfig schema + section_9 properties + SKILL.md §9 가이드 + AF-23
- **rationale_one_line**: `[verified]` 결정 + 관련 사용자 prompt + 브리핑 원문 + 적용 artifact + 메타 학습을 단일 load-bearing 묶음으로 박제

---

## 5. `meta_learnings.md` — 본 사이클이 발견한 schema 갭 / 안티패턴 / 마찰

### 5.1 발견된 schema 갭 (v0.1 → v0.1.1로 메워짐)

1. **권장안 artifact body slot 부재** — §8.recommendation_conditional.recommended는 한 줄 텍스트. 권장안에 첨부될 patch body 등을 담을 슬롯 없음. → **P3 적용으로 메움 (`recommended_artifacts[]`)**. 본 dogfood 의 가장 load-bearing 발견.
2. **톤 설정 자체의 부재** — v0.1 spec은 단일 톤 가정. → **§5.6 audience_profile 3축 5단계로 메움**.
3. **톤 floor escape hatch 부재** — 3 knob 시스템은 knob을 모르는 사용자에게 비가시. → **§5.6.7 fallback affordance로 메움**.
4. **archive 운영 규칙 부재** — §9는 ledger_pointer만 있고 archive bundle 구조 미정의. → **§9 archive_config로 메움**.
5. **renderer 부재 구간 운영 규칙 부재** — Phase 1 ↔ Phase 2 사이의 fallback discipline 미명시. → **§10.3 Phase 1 transition rules로 메움**.
6. **cross-seed adoption 부재** — EstreUF 같은 별도 시드 도입 시 네임스페이스/장부 분리 규칙 미정의. → **§11.3로 메움**.

### 5.2 트리거된 안티패턴 (브리핑 자체에서)

- **AF-20 (recommendation opacity)** — R2 브리핑에서 발생. 사용자 3.2 prompt가 직접 surface → 메타 학습으로 변환되어 v0.1.1 MUST-18 정립.

### 5.3 마찰 보고

- **R1의 epistemic tag inline 부담**: bracket form `[verified]` `[inferred]` `[assumed]` 이 한국어 산문의 리듬을 자르고 의례적 prefix로 전락. → §5.6.6 (audience L1-L2 시 tag를 `확인됨` `추론` 등 한국어 단어로 prose에 녹임) 으로 해소.
- **R2 분량**: §5 7-block + §7 tree + §8 다 풀면 본문이 길어짐 — pre-mortem α (alert-fatigue) 의 표면화. → 본 dogfood Entry 01 cycle 시간 < 3분 미만은 아니나 절대값 측정은 다음 entry에서.

### 5.4 v0.1.1 ship summary

- 신규 sub-sections: §5.6 (+§5.6.1~§5.6.7), §10.3, §11.3
- 신규 §9 확장 (archive_config)
- 신규 §8 본문 확장 (recommended_artifacts)
- 신규 anti-patterns: AF-17, AF-18, AF-19, AF-20, AF-21, AF-22, AF-23 (총 7개 추가 → 16 → 23)
- 신규 normative rules: MUST-16, MUST-17, MUST-18, MUST-19 (4 추가) · SHOULD-5, SHOULD-6, SHOULD-7 (3 추가)
- 신규 schema $defs: `tone_level_1_5`, `AudienceProfile`, `AudienceProfileFallback`, `RecommendedArtifact`, `ArchiveConfig`
- §0 신규 required field: `audience_profile`
- §11.2 dogfood ledger Entry 01 적재 + §11.3 cross-seed adoption 신규
- frontmatter version: v0.1.0 → v0.1.1

### 5.5 다음 사이클 후보

- **Phase 2 renderer (변환 도구) 설계 결정** — 본 entry 결정 직후 follow-up 브리핑 발행 예정. 별도 hb-* id로 capture.
- **EstreUF adoption Entry 02** — EstreUF 측에서 hyperbrief 첫 도입 결정 cycle.
- **revisit 2026-09-01** — 90일 후 본 entry의 outcome_actual + Brier delta 측정.

---

*본 archive는 §9 archive_config (default ON) 의 첫 실 시연이며, 동시에 그 자체의 정당화이기도 함 — 이 5-element 묶음 없이는 본 사이클의 학습이 다음 cycle로 전달되지 않았을 것.*
