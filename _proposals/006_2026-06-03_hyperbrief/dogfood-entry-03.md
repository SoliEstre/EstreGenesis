# Hyperbrief Dogfood Entry 03

> 📋 **자기적용 dogfood**: Hyperbrief v0.5.2 SSoT가 *PreToolUse + Stop hook 활성화 + 검토 사안 큐 도입 결정* 에 적용된 세 번째 사이클의 박제 기록 (§9 `archive_config`).
>
> **decision_id**: `hb-20260603-hooke3`
> **decided_at**: 2026-06-03
> **decided_by**: SoliEstre
> **outcome**: ✅ **accept** — 대안 (a) advise hook (PreToolUse `AskUserQuestion` + `Bash` whitelist + Stop ledger scan, exit 0 + stderr) + **사용자 확장**: Constellation 검토 사안 보드 자동 등록 / standalone 자동 생성 옵션 (on/off/ask, 기본 ask) → v0.5.3
> **revisit_date**: 2026-09-01
> **ledger_pointer**: `_proposals/006_2026-06-03_hyperbrief/dogfood-entry-03.md`

---

## 1. `brief_original.md` — 사용자가 본 브리핑 원문 (재구성)

본 사이클에서 사용자가 받은 브리핑은 2회 형태 변화를 거쳤다.

- **R1 (declared L2/L2/L2, effective L4)**: silent skip, alert fatigue, MCDA, Toulmin, false-positive, matcher, stderr, exit code, advice/hard-block, cross-host portability 등 영어 기술 용어 절반 가까이 노출. 사용자 피드백 *"음....역시 한국어로 부탁해"* — AF-22 fallback trigger 발화 (trigger_phrases_md default `한국어로` 매칭).
- **R2 (L1/L1/L1)**: "자동 알림 종" 비유 + 평이한 한국어 풀어쓰기. 세 가지 길 비교표 (가길 알림만 / 나길 차단형 / 다길 미루기) + 세 가지 울리는 순간 (결정 묻는 순간 / 위험 명령어 / 한 차례 끝). 사용자 가독성 회복 후 결정 진행.

본 dogfood 가 발견한 schema/운영 갭 (5.1 참조): declared vs effective audience_profile gap 이 *결정 도메인이 기술적일 때* 더 크게 나타남 — v0.5의 `surface_profile_estimate` heuristics 가 본 R1 단계에서 AF-18 warning emit 했어야 함 (재현 필요).

---

## 2. `decision.json` — 결정 캡처

```json
{
  "meta_branch_chosen": "accept",
  "user_premortem": "(implicit) 알림이 너무 자주 잘못 울리거나 사용자가 무시하기 시작하면 종 효과가 거의 없어지는 경우",
  "decided_at": "2026-06-03",
  "decided_by": "SoliEstre",
  "agent_judgment_calls": [
    "기본값 'ask' (사용자가 첫 발화 시 명시 설정 권유) — 사용자가 첫 사용 시 설정 결정할 기회 보장",
    "Bash 화이트리스트 12개 (git push / gh release / gh pr / npm-pnpm-yarn publish / kubectl / docker push / terraform / gcloud deploy / aws / curl -X) — 본 결정에 사용자 명시 없으나 일반적 위험 명령어 set",
    "Stop hook 도 동시 활성화 (revisit_date 도래 + pending-reviews 스캔) — 사용자 확장 요청이 PreToolUse 만 명시했으나 Stop 도 자연 묶음"
  ],
  "version_after_decision": "v0.5.3"
}
```

---

## 3. `related_user_prompts.md` — 브리핑 ↔ 결정 사이 사용자 추가 prompt

### 3.1 fallback trigger 발화

> "음....역시 한국어로 부탁해."

→ 변환: AF-22 자기 인정 + 톤 L1/L1/L1 재렌더링 ("자동 알림 종" 비유 도입, "silent skip" → "잊어버리는 일", "alert fatigue" → "종이 너무 자주 울려서 사용자가 무시", "matcher" → "어떤 도구 사용 시 종 울릴지 정하는 규칙").

### 3.2 사용자 확장 명시

> "권장대로 하고, Constellation 사용상태면 검토사안에 올려서 지연 검토 및 결정 가능하도록 제공하고 알림에도 검토사안에서 확인 가능하다고 명시하는걸로 하면 어떨까? Constellation 미사용이면 hyperbrief 검토 사안 문서로 작성해둘지를 묻거나 사용자 선택에 따라 항상 자동생성하거나 하는 식으로 적용하면 어떨까?"

→ 변환: hook 의 역할이 단순 "stderr 알림" 에서 **검토 사안 큐 등록기** 로 확장. 4-way 분기 도입:
- Constellation on → DECISION_REQUEST 보드 등록 + 알림에 "보드 검토사안에서 확인 가능"
- Constellation off + `auto_generate_review_doc=on` → `.hyperbrief/pending-reviews/<id>.md` 자동 생성
- Constellation off + `auto_generate_review_doc=ask` (기본) → 알림 + 설정 안내
- Constellation off + `auto_generate_review_doc=off` → 알림만

이 확장이 본 결정의 핵심 가치 — 기존 v0.4 status 의 "PreToolUse hook (decision-keyword detection auto-triggers rubric)" 단순 명세에서 **두-단계 검토 큐** (placeholder → full HyperbriefCard) 로 진화. Constellation §8 의 `DECISION_REQUEST` + `HyperbriefCard` envelope-pair 패턴과 자연 합류 (이미 v2.5.27 에서 §13.16.9 에 진입).

---

## 4. `recommended_artifacts_applied.md` — 권장 4 artifact 의 실 적용 결과

### Artifact 1: `plugins/hyperbrief/hooks/hooks.json`

- **적용 상태**: ✅ Phase 1 placeholder → 활성화 (PreToolUse `AskUserQuestion` + `Bash` matcher + Stop `*` matcher)
- **rationale_one_line**: `[verified]` v0.1.0 부터 placeholder 였던 hook 자리를 채움

### Artifact 2: `plugins/hyperbrief/hooks/trigger-advise.cjs` (~190 LoC)

- **적용 상태**: ✅ 브리핑 골격 (~50 LoC) → 실 구현 (~190 LoC)
- **확장 내역**:
  - 4-way 분기 routing (Constellation on / off + on/off/ask)
  - Bash 화이트리스트 12 패턴 (git push / gh release / gh pr / npm publish 등)
  - Constellation 감지 (env + outbox 경로 3 후보)
  - DECISION_REQUEST envelope 생성 + outbox append
  - Standalone placeholder MD 생성 (.hyperbrief/pending-reviews/<id>.md)
  - 한국어 stderr 알림 (사용자 환경 기본 L2)
  - exit 0 항상 (advise mode invariant)
- **smoke test PASS**: 4 시나리오 (AskUserQuestion + Bash safe + Bash dangerous + Stop empty ledger) 모두 의도대로 동작 — `node --check` syntax OK, stderr 출력 예상대로

### Artifact 3: `plugins/hyperbrief/hooks/revisit-scan.cjs` (~85 LoC)

- **적용 상태**: ✅ 브리핑 골격 (~40 LoC) → 실 구현 (~85 LoC)
- **확장 내역**:
  - 두 가지 신호 (revisit_date 도래 + pending-reviews 잔존) 통합 단일 advisory line emit
  - silent (둘 다 0건) 시 알림 없음
- **rationale_one_line**: `[verified]` Stop hook 이 ledger + pending-reviews 양쪽 cover

### Artifact 4: `Hyperbrief.md §11.4` 신규 sub-section (60+ lines)

- **적용 상태**: ✅ 신규 추가 — hook contract / review-queue routing / why advise mode / falsification triggers / cross-reference
- **rationale_one_line**: `[verified]` v0.5.3 운영 규율을 SSoT 본문에 정착 (plugin-tier 한정 명시 — cross-host portability 보호)

### Artifact 5: `Hyperbrief.md §11.1` v0.5.3 entry 신규

- **적용 상태**: ✅ adoption path 에 v0.5.3 항목 추가 (v0.5.0 entry 앞에 삽입)
- **rationale_one_line**: `[verified]` v0.4.0 status 의 "deferred to v0.4.1+" carry 가 본 cut 으로 closes 됨을 명시

---

## 5. `meta_learnings.md` — 본 사이클이 발견한 schema 갭 / 안티패턴 / 마찰

### 5.1 발견된 schema 갭 / 운영 갭

1. **`surface_profile_estimate` heuristic 의 기술 도메인 false-negative** — v0.5에서 정의된 declared-vs-effective gap warning (AF-18) 이 R1 브리핑에서 emit 됐어야 했으나 (declared L2 / effective L4) silent. 추정 원인: `english_noun_ratio` heuristic 의 임계값이 *순수 산문* 기준 — 기술 도메인 본문 (코드 블록 + 영어 식별자 인용) 에서는 자연 영어 명사 비율이 높아져 false-negative. v0.6 후보 patch: `english_noun_ratio` 측정에서 fenced code block + 인용 토큰 제외.
2. **`trigger_phrases_md` 의 `한국어로` 패턴 매치가 본 cycle 에서 자동 fallback 발화 안 함** — trigger phrase 목록에 `한국어로` 가 v2.5.30 부터 default 포함되어 있으나, 본 cycle 의 사용자 발화 `한국어로 부탁해` 가 hook 매처 (plugin-tier) 없이는 model self-invoke 만으로 작동 — model 이 다른 메타 결정 (artifact body 첨부 등) 우선순위 하에 fallback 발화 잊음. **본 결정의 hook 활성화가 정확히 이 silent skip 위험을 차단하는 메커니즘** — 자기-증명 사이클.

### 5.2 트리거된 안티패턴 (브리핑 자체에서)

- **AF-22** (MD brief: user confusion trigger but no auto-regen) — R1 단계에서 발화. 사용자가 `한국어로` 매처 발화했으나 자동 재렌더링 없이 사용자가 명시 surface (Entry 02 와 동일 패턴 재발). hook 활성화로 향후 자동 detect 가능 (단 *현 user 발화* 직후 발생이 아니라 *직전 agent 응답* 의 톤 evaluation 이 필요 — 이건 별도 layer, v0.6 후보).
- **AF-18** (surface vocabulary mismatches declared audience_profile) — R1 단계 발화 + 5.1 1번 schema 갭의 표현 (heuristic 이 catch 못함).

### 5.3 마찰 보고

- **R1 영어 jargon 비율**: 변환 도구 결정 (Entry 02) 과 동일 패턴 재발 — *결정 자체가 기술적* 일 때 declared L2/L2/L2 가 effective L3-L4 로 미끄러짐. mini-engine 의 `JARGON_GLOSS` 사전이 cover 안 하는 신규 용어 (silent skip, alert fatigue, false-positive 등 + matcher / stderr / exit code / wrapper script) 가 prose 에 자유 노출. v0.6 후보: `JARGON_GLOSS` 사전 확장 + heuristic 사전 외 영어 명사 비율 보조 계측.
- **사용자 확장의 큰 가치**: 단순 "stderr 알림" 에서 "검토 큐 등록기" 로 의 확장이 hook 의 본질 가치를 크게 격상. *지연 검토 + 결정 deferral* 메커니즘이 §2.4 self-throttle 의 "결정 즉시 처리" 압력을 줄이고 사용자의 메타 인지 부담 분산.

### 5.4 v0.5.3 ship summary

- 신규 파일 2 (`hooks/`): `trigger-advise.cjs` (~190 LoC) · `revisit-scan.cjs` (~85 LoC)
- `hooks.json` Phase 1 placeholder → PreToolUse 2 matcher (AskUserQuestion + Bash) + Stop 1 matcher 활성
- Hyperbrief.md §11.4 신규 sub-section (60+ lines) — hook contract / review-queue routing / 4-way 분기 / advise mode rationale / falsification trigger / cross-reference
- Hyperbrief.md §11.1 v0.5.3 entry 신규 (v0.4.0 "deferred to v0.4.1+" carry close)
- Hyperbrief.md frontmatter v0.5.2 → v0.5.3 + status 갱신
- §11.2 dogfood ledger Entry 03 적재
- plugin manifest + sibling package.json `0.5.2 → 0.5.3` bump
- 결정성 invariant 무영향 (hook 은 runtime advise layer, renderer 와 별개)

### 5.5 다음 사이클 후보

- **v0.6 cut 후보**:
  - `surface_profile_estimate` heuristic 의 기술 도메인 false-negative 보정 (fenced code block 제외 / `JARGON_GLOSS` 확장)
  - hook 의 "직전 agent 응답 톤 evaluation" layer (post-response AF-18 detection)
  - `notify-on-revisit` 옵션 (Stop hook 의 advisory 가 N일 무시 시 escalation)
- **7일 telemetry 측정**:
  - hook 발화 빈도 (10/day 초과 → matcher 좁히기 / 0.1/day 미만 → matcher 넓히기)
  - 사용자 transcript stderr 메시지 노출 확인 (Claude Code 의 advise-mode 동작 검증)
  - DECISION_REQUEST 보드 등록 동작 (Constellation on 시점 검증)
- **EstreUF cross-seed adoption** — 본 hook 메커니즘이 cross-seed adopter 에 어떻게 카피되는지 (EstreUF 자체 `.hyperbrief/config.json` + outbox 경로 결정)

---

*본 archive 는 §9 archive_config 의 세 번째 실 시연이며, hook activation 결정 사이클이 동시에 그 hook 의 자기-검증 cycle 이기도 함 — `한국어로 부탁해` 트리거의 silent miss (model self-invoke 만으로 작동 부족) 가 hook 활성화의 정당화 근거를 자기-제공.*
