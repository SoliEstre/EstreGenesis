# Hyperbrief — 문제 해법 카탈로그 (Troubleshooting Catalogue)

> **이 문서는**: 운영 중 자주 발생하는 문제와 해법 모음. 회피 패턴 코드 (이하 안티패턴 — AF-1 ~ AF-26) 는 [Hyperbrief.md](https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md) §10 본문 참조. 본 문서는 *운영 시점* 의 진단/해결 절차에 집중해요. 빠른 시작은 [QUICK-START.md](QUICK-START.md).

## 진단 흐름 (시작 지점)

문제 발생 시 다음 순서로 좁히세요:

1. **플러그인 자체 설치 상태** (Claude Code 가 부르는 외부 모듈, 이하 plugin): `/plugin list` 로 `hyperbrief@estregenesis-plugins` 가 있는가?
2. **노드 자바스크립트 도구 (Node) 의존 해소 상태**: `${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/renderers/node_modules/ajv` 가 존재하는가? (`ajv` = JSON 형식 검사기, 이하 ajv).
3. **갈고리 연결 상태** (도구 호출 직전 / 턴 종료 시 자동 발화하는 검사 지점, 이하 hook): `.claude/settings.json` 에 `PreToolUse` + `Stop` 항목이 있는가?
4. **hook 발화 상태**: 결정 질문 시 `[hyperbrief alert]` 기록이 표준 오류 출력 (이하 stderr) 에 나오는가?
5. **렌더링 상태**: 브리핑 (이하 brief) 호출 시 마크다운 (MD) + 웹 페이지 형식 (HTML) 둘 다 출력 (emit) 되는가?

각 단계의 실패는 다음 절의 해당 문제와 매칭.

---

## T-1. hook 가 조용히 멈춤 (silent skip)

**증상**: 사용자가 "어떻게 할까요?" 종류 질문을 받는데 brief 가 안 나옴. stderr 에 `[hyperbrief alert]` 도 없음.

**진단**:
- `.claude/settings.json` 안 `hooks.PreToolUse` 배열에 `hyperbrief-trigger-check` (발동 자격 검사 기술, trigger-check) 항목 있는지 확인
- 항목 있는데 발화 안 함 → 매처 (matcher) 패턴 불일치 가능. `AskUserQuestion` 매처 (matcher) 만으로는 bash 기반 결정 질문 catch 못 함.

**해법**:
- 매처 (matcher) 패턴 확장: `"AskUserQuestion|Bash"` (Bash 매처는 `bash_filter.cjs` 감싸기 스크립트가 결정-write/deploy/send 만 거름)
- 또는 모델 자율 호출 (self-invoke) 의존도 강화 — 기술 (이하 skill) 의 `description` 필드 가시성 점검 (Claude Code 가 description 을 보고 skill 자동 호출)

**근본 원인**: Hyperbrief 의 조용한 우회 감지 층 (silent skip 감지 층) 은 hook 가 있어야 작동. hook 미연결 시 trigger-check (발동 자격 검사 기술) 호출 자체가 모델 자율에만 의존.

## T-2. `.claude/settings.json` 편집 거부 (자동 모드 자기 수정 문)

**증상**: 대리자가 마이그레이션 스크립트로 `.claude/settings.json` 수정 시도 → Claude Code 가 "대리자 런타임 자기 수정" (self-modification) 으로 분류 + 차단.

**진단**: 차단은 의도된 안전 장치예요 (묵시적 주입 — silent injection 회피).

**해법**:
1. 대리자 출력에서 settings.json 의 변경 차이 (diff) 를 사용자에게 직접 표시
2. 사용자가 명시적으로 승인 (또는 소유자가 settings.json commit)
3. 사용자 측 적용 후 `/plugin restart` 또는 Claude Code 재시작

**대안**: 복사 별도 배치 (sidecar) — `.hyperbrief/hooks/` 를 프로젝트 트리에 두고 소유자가 settings.json 자체를 한 번 commit. 이후 대리자는 hook 코드만 조작 (settings.json 미수정). 복사 별도 배치 (sidecar) 경로 자세히는 §T-7.

**정본** (Single Source of Truth, 이하 SSoT): [Hyperbrief.md](https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md) §11.4 채택자 설치 노트 (호스트 자기 설정 승인 문).

## T-3. `ajv` 버전 어긋남 (깨끗한 설치 재현 문제)

**증상**: `node bin/render.cjs ...` 실행 시 `Error: ajv schema validation failed: data must be object` 또는 `Cannot find module 'ajv'`.

**진단**:
- `cd renderers && npm ls ajv` — 버전이 `8.x` 이상인가?
- `mcp/` 도 같은 확인 (`cd mcp && npm ls ajv`)
- Hyperbrief v0.5.2 묶음 (bundle) 008 H6 의 회복 대상 부류 — 깨끗한 설치 (clean install) 시 ajv 가 `8.x` 가 아니면 사전 검증 (schema validation) 경로 깨짐.

**해법**:
1. `cd renderers && rm -rf node_modules package-lock.json && npm install`
2. `mcp` 도 동일 — 깨끗한 설치 (clean install) 재수행
3. 확인: `npm ls ajv` 출력에 `ajv@8.17.x` (또는 그 이상)

**예방**: `renderers` + `mcp` 의 `package.json` 둘 다 `"ajv": "^8.17.0"` 명시 고정. v0.5.2 이전의 풀린 범위는 회복됨 (사전 검증 — schema validation 경로 안정).

**SSoT**: Hyperbrief.md §10.x H1 (ajv import + clean install 재현 검증).

## T-4. Constellation 보드 꺼짐 — 4-갈래 대체 동작 (검토 줄 분기)

**증상**: Hyperbrief 가 `DECISION_REQUEST` 발화하는데 Constellation 보드가 안 보임. brief 가 어디로 갔는지 모름.

**진단**: Constellation 도달 여부에 따라 hook 가 4-갈래 분기 (4-way routing) 됨:
- `CONSTELLATION_WS_URL` 환경 변수 (WebSocket 주소) + 로컬 `outbox.jsonl` 있음 → 보드 출력 (emit)
- 환경 변수 없음 + `auto_generate_review_doc: on` → `.hyperbrief/pending-reviews/<id>.md` 자리표시자 (placeholder) 생성
- 환경 변수 없음 + `auto_generate_review_doc: off` → stderr 알림 만
- 환경 변수 없음 + `auto_generate_review_doc: ask` (기본) → stderr 알림 + 설정 힌트

**해법** (어디로 갔는지 찾기):
1. `ls .hyperbrief/pending-reviews/` — 자리표시자 (placeholder) 파일 있나?
2. 없으면 stderr 기록 확인 — `[hyperbrief alert]` 행에 brief 식별자 (id) 보임
3. 그 id 로 결정 기록부 (이하 ledger) 검색: `node mcp/server.cjs decision_ledger_query --id <id>`

**예방**: `.claude/settings.json` 또는 `.env` 에 `auto_generate_review_doc=on` 설정 — Constellation 꺼져 있어도 항상 파일로 표면화 (대체 동작 — fallback 활성).

**SSoT**: Hyperbrief.md §11.4 검토 줄 (review queue) 분기 절.

## T-5. 톤 버튼 지역화 (청중 프로파일 대체 동작 버튼)

**증상**: brief 카드의 버튼이 "What? Just say it plainly." 영어로만 표시. 한국어 사용자는 의도 파악 어려움.

**진단**: skill 의 자동 지역화 (localization) 발화 시점이 IR 발화 직전이에요 (중간 표현, 이하 IR). 사용자의 주로 사용하는 (prevailing) 대화 언어를 skill 이 분류 → 그 언어 기본값 IR 의 `audience_profile_fallback.button_label` 에 채워넣음 (populate).

**한국어 기본값**: "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)"

**해법** (작성자 측 커스터마이즈):
- IR 작성 시점에 명시: `audience_profile_fallback.button_label: "<원하는 텍스트>"`
- 또는 skill 의 description 단에서 사용자 언어 분류 보정 (영어 / 한국어 외 — 일본어 등 — 도 EN/KO/JA 리터럴이 `SKILL.md` 에 참조로 있음)

**SSoT**: Hyperbrief.md §5.6.7 + MUST-19 (자동 지역화 — localization 규율).

## T-6. 결정성 깨짐 (같은 IR → 다른 출력)

**증상**: 같은 IR 을 두 번 렌더링했는데 출력이 다름. 기본 동작 검사 (smoke test) 통과해야 하는데 안 함.

**진단**: 본 부류는 H7 (v0.5.4) 에서 회복. 제거 후 검증 (strip-then-validate) 순서 → 정본 IR 에 검증 (validate-on-canonical-IR) → 깊은 복제 (deep-clone) → 복제본에서 제거 (strip-on-clone) 으로 재정렬. v0.5.4 미만이면 영향 받음. 깊은 복제 (deep-clone) 가 원본 IR 의 불변성 보장.

**해법**:
1. plugin 버전 확인: `${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/.claude-plugin/plugin.json` 의 `version` 필드. `0.5.4` 미만이면 업그레이드.
2. 업그레이드: `/plugin install hyperbrief@estregenesis-plugins` 로 재설치 (최신).
3. 회복 확인: `cd renderers && node bin/smoke.cjs` (있다면) 또는 동일 IR 두 번 렌더링 후 변경 차이 (diff).

**예방**: Hyperbrief.md 의 H1 ~ H7 긴급 수정 (emergency-fix) 이력 참조 — 새 회복 부류 발생 시 즉시 patch 출시. 결정성 (determinism — 같은 입력 → 같은 출력 보장 성질) 불변식 매번 재검증.

**SSoT**: Hyperbrief.md §10.x H7 항목.

## T-7. 복사 별도 배치 (sidecar) 경로 어긋남

**증상**: plugin 을 marketplace 가 아닌 복사 (vendoring) 으로 설치했는데 hook 가 `${CLAUDE_PLUGIN_ROOT}` 경로를 찾으려다 실패.

**진단**: `${CLAUDE_PLUGIN_ROOT}` 는 marketplace 설치 시점의 plugin 디렉토리. 복사 (vendoring) 시에는 채택자 프로젝트 트리 안.

**해법**: `hooks.json` 또는 `.claude/settings.json` 안 hook 명령 경로를 `$CLAUDE_PROJECT_DIR/<vendored-path>/` 로 재작성. 복사 별도 배치 (sidecar) 의 표준 패턴.

**예시**:
```json
{
  "type": "command",
  "command": "node $CLAUDE_PROJECT_DIR/.hyperbrief/hooks/trigger-advise.cjs"
}
```

**SSoT**: Hyperbrief.md §11.4 채택자 설치 노트 + `$CLAUDE_PROJECT_DIR` vs `${CLAUDE_PLUGIN_ROOT}` 절.

## T-8. 표면 프로파일 어긋남 경고 (AF-18)

**증상**: brief 카드에 `AF-18` 또는 `surface_profile_estimate.declared_vs_estimate_gap_warning: true` 표시.

**진단**: 렌더링된 표면의 효과적 청중 프로파일 (이하 audience profile — 추정치 estimate) 이 IR 의 선언된 (declared) audience_profile 과 ≥2 축 어긋남. 일반적으로 *과도한 전문어* 또는 *과도한 평문화* 패턴. 추정치 (estimate) 는 6 가지 휴리스틱 (영문 명사 비율 + 평균 문장 길이 + 전문어 빈도 + 첫 사용 풀어쓰기 존재 + 글머리표 밀도 + 인식론적 태그 형식) 으로 산출. 선언 (declared) 값은 작성자가 IR 에 직접 명시.

**해법** (작성자 측):
- IR 의 `audience_profile` 을 실제 출력에 맞게 재선언 (예: L2 → L3)
- 또는 본문 어휘를 선언된 (declared) audience profile 에 맞춰 수정 (전문어 줄이기 또는 평문 보강)

**해법** (사용자 측):
- 카드 위 "뭔 소리야? 한국어로 번역해줘" 버튼 클릭 → `L1.1.1` 최저 대체 동작 (floor fallback) 으로 다시 렌더링

**SSoT**: Hyperbrief.md §5.6.7-pre (declared vs estimate 어긋남 경고).

---

## 자주 묻는 질문 (FAQ — 한 줄 답변)

- **Q**: trigger-check 의 4-score 어떻게 계산?  
  **A**: Hyperbrief.md §2.1 trigger 채점표 — 가역성 (reversibility) / 영향 범위 (blast radius) / 새로움 (novelty) / 정보 비대칭 (info asymmetry) 각 0-3, 합 4 이상 + 강제 발동 조건 (MUST-trigger) 발화 시 `FULL_HYPERBRIEF`.

- **Q**: 재방문 일자 (revisit_date) 자동 등록?  
  **A**: `hyperbrief` skill 이 IR 발화 시 `section_8.recommendation_conditional.revisit_date` 를 ledger 에 추가. Stop hook 이 매 턴 ledger 살펴 도래 시 알림.

- **Q**: 결정 ledger 위치?  
  **A**: 두 곳. 사람 가독성용 `_proposals/<bundle>/dogfood-ledger.md` (최근 N 행 — 묶음 bundle 별 분리), 기계 가독성용 `.agent/_decisions/<module>-ledger.jsonl` (추가 전용 흐름).

- **Q**: 같은 IR 을 손으로 편집 후 다시 렌더링 안전?  
  **A**: 안전. 결정성 (determinism) 불변식 유지 — 해시 (hash) 변화 시 새 IR 로 ledger 에 추가, 이전 IR 도 그대로 보존.

- **Q**: Hyperbrief 만 채택하고 Constellation 미설치 가능?  
  **A**: 가능. `auto_generate_review_doc: on` 으로 파일 기반 대체 동작 (fallback) — `.hyperbrief/pending-reviews/`. 단 보드 차원 협업 시각화는 부재.

---

*문제 추가 보고 또는 새 진단 절차 제안은 [GitHub 문제 보고](https://github.com/SoliEstre/EstreGenesis/issues) — Hyperbrief 라벨로.*
