# Hyperbrief Dogfood Entry 02

> 📋 **자기적용 dogfood**: Hyperbrief v0.1.1 SSoT가 *변환 도구 (Phase 2 renderer) 설계 결정*에 적용된 두 번째 사이클의 박제 기록 (§9 `archive_config`).
>
> **decision_id**: `hb-20260603-r2nd02`
> **decided_at**: 2026-06-03
> **decided_by**: SoliEstre
> **outcome**: ✅ **accept** — 대안 B (자체 mini-engine + ajv + CLI/MCP 양형 인터페이스) → MCP tool 노출은 v0.4.1 deferred 판단 후 적용
> **revisit_date**: 2026-09-01
> **ledger_pointer**: `_proposals/006_2026-06-03_hyperbrief/dogfood-entry-02.md`
> **archive_path** (실 시연): 본 파일 = 박제 그 자체

---

## 1. `brief_original.md` — 사용자가 본 브리핑 원문 (재구성)

본 사이클에서 사용자가 받은 브리핑은 2회 형태 변화를 거쳤다.

- **R1 (audience_profile L2/L2/L2 default 선언, 실제 surface는 L3-L4 수준 영어 jargon 비율 과다)**: Mustache · Handlebars · ajv · ESM · MCP tool · CDN · escape · byte · hash · determinism · IR · renderer · mini-engine · placeholder · substitution · CLI 등 영어 기술 명사가 본문에 다수 노출. 사용자가 정확히 §5.6.7 fallback trigger 발화: *"이게 level 2라고? 한국어로 부탁해"*.
- **R2 (L1/L1/L1 재렌더 + trigger_phrases_md 누락 항목 추가)**: "본사 카페와 가맹점 카페의 공유 영수증 발급기" 비유 + "본 건물 짓는 동안 임시 가설물" 비유 + 일상어 + 풀 서술 + 전문 용어 회피. 사용자 가독성 회복 후 결정 진행.

R1 → R2 전환 자체가 본 entry의 첫 학습 — `audience_profile = {2, 2, 2}` 라고 *선언*해도 *실제 surface*가 L2 가 아닐 수 있음 (declared profile vs effective profile gap). 자동 측정 가능한 지표가 schema에 없음 → 본 entry의 schema 갭 후보 (5.4 참고).

본 브리핑 IR 골격:

```jsonc
{
  "decision_id": "hb-20260603-r2nd02",
  "section_0_decision_header": {
    "escalation": { "irreversibility": 1, "blast_radius": 1, "time_horizon": 1, "reversal_cost": 1, "sum": 4 },
    "reversibility_class": "one_way_with_migration_path",
    "reversibility_badge_color": "yellow",
    "rapid": {
      "recommender": "이 에이전트",
      "decider": "user (SoliEstre)",
      "performer": ["이 에이전트"],
      "input_contributors": ["dogfood Entry 01 학습", "v0.1.1 §10.3 transition rules", "EG Node 컨벤션"],
      "agree_holders": ["user 단독"]
    },
    "cynefin_domain": "complicated",
    "deadline": "no rush",
    "recommended_reading_minutes": 3,
    "audience_profile": { "audience": 2, "abbreviation": 2, "jargon": 2 }
  },
  "section_8_recommendation": {
    "recommendation_conditional": {
      "recommended": "[inferred] 대안 B (자체 mini-engine + ajv + CLI/MCP 양형)",
      "recommended_artifacts": [
        { "artifact_type": "code", "target_file": "plugins/hyperbrief/renderers/types.d.ts", "body": "<인터페이스 약속 — 본 archive recommended_artifacts_applied.md 참조>" },
        { "artifact_type": "code", "target_file": "plugins/hyperbrief/renderers/mini-engine.cjs", "body": "<핵심 변환 도구 — 본 archive recommended_artifacts_applied.md 참조>" },
        { "artifact_type": "config", "target_file": "plugins/hyperbrief/renderers/package.json", "body": "<외부 의존 명세 — 본 archive 참조>" },
        { "artifact_type": "code", "target_file": "plugins/constellation/mcp/server.cjs", "body": "<다른 에이전트가 호출 가능한 형태로 등록 — 본 archive 참조>" }
      ],
      "assumptions": [
        "[assumed] Node 18+가 어댑터 표준",
        "[assumed] chart.js + mermaid CDN 호출 허용",
        "[assumed] ajv 8.x major stable"
      ],
      "fallback_if_assumption_violated": "[inferred] CDN 차단 시 self-contained mode v0.4.1; ajv ESM 전환 시 자체 validate 회귀",
      "switch_if": "[inferred] 외부 어댑터가 mustache 호환 강력 요청 시 대안 D"
    },
    "confidence": { "point_estimate": 0.80, "ci_90_low": 0.68, "ci_90_high": 0.90 },
    "cited_tree_node_ids": ["N4"]
  }
}
```

---

## 2. `decision.json` — 결정 캡처

```json
{
  "meta_branch_chosen": "accept",
  "user_premortem": "(명시 입력 없음; 사용자가 R1을 거부하고 L1 재렌더 요구한 시점에 implicit 위험으로 'AI가 자기 톤 약속을 지키지 않는다'가 surface됨)",
  "decided_at": "2026-06-03",
  "decided_by": "SoliEstre",
  "agent_judgment_calls": [
    "MCP tool 노출은 v0.4.1 deferred — plugins/hyperbrief/mcp/ 디렉토리 신규 생성 부담을 본 cut에서 분리 (사용자 위임: '임시 patch 대체? 를 지금 할지는 네가 판단')",
    "§10.3 Phase 1 transition rules는 deprecate하지 않고 historical record로 유지 + deprecation note만 추가 (외부 adopter 미동시 이주 + Phase 1 운영 경험 보존)"
  ],
  "version_after_decision": "v0.4.0"
}
```

---

## 3. `related_user_prompts.md` — 브리핑 ↔ 결정 사이 사용자 추가 prompt

### 3.1 톤 fallback 트리거 발화

> "이게 level 2라고? 한국어로 부탁해"

→ 변환: AF-22 (MD brief: 사용자 confusion trigger 발화 but no regen) 자기 인정 + `audience_profile_fallback.trigger_phrases_md` default에 누락 항목 추가 (`한국어로`, `한국말로`, `level 2 라고`, `L2 라고`, `이게 level`, `이게 L`) + 본 entry 브리핑 R1 → R2 (L1/L1/L1) 재렌더.

### 3.2 단계적 ship 지시

> "반영하되 기존에 추가 patch로 대응하고 있던 부분이 있으니까 그 상태 기준으로 push 한 뒤 도구 추가(임시 patch 대체? 를 지금 할지는 네가 판단.) 버전을 추가 push"

→ 변환:
- (a) trigger phrase 추가 + v0.1.1 5 patches 묶음을 **v2.5.23** 으로 먼저 ship.
- (b) Phase 2 renderer 구현을 **v2.5.24** 로 별도 ship.
- (c) §10.3 임시 patch 대체 여부는 *에이전트 판단* — 결정: **historical record 유지 + deprecation note 추가** (5.5 5번째 항목 참조).

---

## 4. `recommended_artifacts_applied.md` — 권장 4 artifact 의 실 적용 결과

### Artifact 1: `plugins/hyperbrief/renderers/types.d.ts`

- **적용 상태**: ✅ verbatim — 41 lines.
- **rationale_one_line**: `[verified]` 인터페이스 약속을 먼저 선언해두면 구현 교체 시 호환성 보존.

### Artifact 2: `plugins/hyperbrief/renderers/mini-engine.cjs`

- **적용 상태**: ✅ 골격 → 실 구현으로 확장 (브리핑 골격 ~150 LoC → 실 구현 ~210 LoC).
- **확장 내역**:
  - Stable JSON canonicalization (모든 depth에 sorted keys) — 결정성 hash 보장
  - Schema validation via ajv (`getValidator()` lazy load + graceful fallback when not installed)
  - Tone axis transforms 3종 — `applyAudienceTransform` (L1-L2 → 한국어 단어형, L4-L5 → superscript ᵛⁱᵃᵘ) · `applyAbbreviationTransform` (L3 → 글머리, L4 → 전보 형식 + 기호 연산자) · `applyJargonTransform` (L1-L2 → `JARGON_GLOSS` 사전 첫 등장 시 적용)
  - `renderMd` / `renderHtml` 양형 + warnings 누적
- **rationale_one_line**: `[verified]` 같은 IR → 같은 출력 byte 보장이 v0.4.0의 load-bearing 약속.
- **결정성 smoke test**: PASS — MD/HTML 모두 같은 IR 두 번 렌더 시 byte-identical (hash 일치).

### Artifact 3: `plugins/hyperbrief/renderers/package.json`

- **적용 상태**: ✅ 브리핑 골격에 metadata 보강 (description + types + license + author + repository).
- **rationale_one_line**: `[verified]` 외부 의존 ajv 단 1개로 최소화 — Constellation의 ws 외 추가 dep 0~1 의 should-have 달성.

### Artifact 4: `plugins/hyperbrief/renderers/bin/render.cjs` (브리핑에는 미명시, 사용자 명령 "도구 추가" 의 자연 보완)

- **적용 상태**: ✅ CLI 진입점 신규 — 116 lines.
- **확장 사유**: 브리핑 골격은 `bin/render.cjs` 의 본문을 명시하지 않았으나 `package.json.bin` 에 등록만 있었음. CLI 가 없으면 mini-engine 호출 표면이 require() 만 — `npx hyperbrief-render` 같은 외부 사용성 부재. CLI 보완.
- **CLI 인자**: `--format md|html` · `--ir <path>` (또는 stdin) · `--audience N` · `--abbreviation N` · `--jargon N` · `--self-contained` · `--skip-validate` · `--help`. Exit codes 0/1/2/3.
- **rationale_one_line**: `[verified]` MCP tool 노출이 v0.4.1 deferred 인 상황에서 CLI 가 immediate sole 외부 호출 표면.

### Artifact 5 (deferred): `plugins/hyperbrief/mcp/server.cjs` — MCP tool 노출

- **적용 상태**: ⏸️ **v0.4.1 deferred** (에이전트 판단).
- **deferred 사유**: 본 cut 의 범위 통제 — `plugins/hyperbrief/mcp/` 디렉토리 신규 생성 + Constellation MCP server 와 별개 MCP server 작성은 v0.4.0 의 minimal core 와 별개 작업으로 판단. Constellation 측 `plugins/constellation/mcp/server.cjs` 에 tool 통합도 의존성 cross-cutting 으로 부담. 본 cut 은 renderer module + CLI 만, MCP 통합은 별도 cut.
- **사용자 지시 정합성**: 사용자가 "임시 patch 대체? 를 지금 할지는 네가 판단" 으로 cut 범위 위임. MCP 노출도 같은 위임 범위 안에 있다고 판단.

---

## 5. `meta_learnings.md` — 본 사이클이 발견한 schema 갭 / 안티패턴 / 마찰

### 5.1 발견된 schema 갭 후보 (향후 patch 후보)

1. **Declared vs effective audience_profile gap** — IR `audience_profile` 은 *선언* 만이고, 실제 surface 가 그 declared level 에 부합하는지 자동 측정 지표가 schema 에 없음. 본 entry R1 → R2 전환의 근본 원인. 후보 patch: `epistemic_distribution` 옆에 `surface_profile_estimate` (auto-computed; jargon 비율 / 영어 명사 비율 / 문장 길이 평균 등) 추가 + declared vs estimate gap > 1.0 시 renderer warning.
2. **trigger_phrases_md default 의 culture-bound 누락** — "이게 level 2 라고?" 같은 *self-reference* 식 confusion expression 이 default 에 없었음. 사용자 발화 패턴은 다양 → trigger phrases 의 지속적 학습 필요. 후보: adopter feedback ledger 에서 trigger phrase 자동 학습 (telemetry 차원, 사용자 opt-in).
3. **`recommended_artifacts[]` 의 `body` field 가 정형 코드일 때의 schema** — 현재 `body: string` 단일 필드. 코드 artifact 라면 `language` (정형 hint) + `line_count` (대조 metric) 같은 sub-field 권장. 후보: v0.5 schema patch.

### 5.2 트리거된 안티패턴

- **AF-22 (MD brief: user confusion trigger 발화에도 미재생성)** — R1 단계에서 발화. trigger_phrases_md default 가 사용자 발화 패턴을 커버하지 못해 자동 재렌더가 안 됨. 본 entry 가 trigger 목록 보강 후 spec discipline 회복.
- **AF-18 (surface vocabulary mismatches declared audience_profile)** — R1 에서 발화. declared L2 / effective L3-L4. renderer self-check 미작동 (5.1 1번 schema 갭의 표현).

### 5.3 마찰 보고

- **R1 영어 jargon 비율 과다**: 변환 도구 설계 결정은 본질적으로 기술적 (Mustache · ajv · MCP · CDN 등). 그러나 `audience_profile = {2, 2, 2}` 선언과 어긋남. → 본 entry 의 핵심 학습: **declared profile 은 anchor, surface 는 actively control 해야**. mini-engine 의 `applyJargonTransform` 의 `JARGON_GLOSS` 사전은 이 학습의 첫 codification.
- **§10.3 deprecate vs keep 판단**: 사용자가 "임시 patch 대체?" 라고 묻고 "네가 판단" 으로 위임. 에이전트는 *유지 + deprecation note 추가* 선택. 사유: (a) Phase 2 renderer ship 직후에도 외부 adopter 가 즉시 옮겨가지 않음, (b) Phase 1 운영 경험이 historical record 로 가치, (c) drift-log 의 의미가 "Phase 1 vs Phase 2 backwards-compat 회귀 검증" 으로 자연 진화. 만약 *대체* 했다면 (a) 외부 adopter 의 transition rules 부재 + (b) 운영 경험 휘발 + (c) drift-log 의 의미 손실.

### 5.4 v0.4.0 ship summary

- 신규 파일 4 (renderers/): `types.d.ts` (41 lines) · `mini-engine.cjs` (~210 lines) · `bin/render.cjs` (~116 lines) · `package.json`
- 신규 npm 의존 1: `ajv ^8.17.0`
- Hyperbrief.md §10.3 deprecation note 1 paragraph 추가 (본문 유지)
- Hyperbrief.md frontmatter version v0.1.1 → v0.4.0 + status 갱신
- §11.2 dogfood ledger Entry 02 적재
- 결정성 invariant smoke test PASS (MD/HTML 양형, run1 == run2)
- MCP tool 노출 (`hyperbrief_render`) deferred to v0.4.1

### 5.5 다음 사이클 후보

- **v0.4.1 cut** — MCP tool 노출 (`plugins/hyperbrief/mcp/server.cjs` 신규 또는 Constellation MCP server 통합) + self-contained HTML assets 모드 (CDN 차단 환경용) + `JARGON_GLOSS` 사전 확장.
- **v0.5 cut** — schema patch (surface_profile_estimate · recommended_artifacts.body sub-fields · trigger_phrases 자동 학습 telemetry) + 외부 adopter 의 첫 도입 dogfood Entry.
- **EstreUF dogfood Entry 01-N** — EstreUF 측 첫 도입 사이클. cross-seed adoption discipline (`hb-uf-` namespace) 실증.
- **revisit 2026-09-01** — 90일 후 본 entry 의 outcome_actual + Brier delta 측정 (변환 도구의 사용 빈도 + warning 발생률 + 외부 adopter 의존).

---

*본 archive 는 §9 archive_config 의 두 번째 실 시연이며, 동시에 Phase 2 renderer ship 의 권한 위임 사이클 (사용자 → 에이전트 판단 → 박제) 의 첫 사례. Entry 01 이 "사용자 명시 + 5 patches" 사이클이었다면, Entry 02 는 "사용자 위임 + 에이전트 판단 + scope 통제" 사이클.*
