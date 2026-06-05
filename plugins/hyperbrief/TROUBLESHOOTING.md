# Hyperbrief — Troubleshooting Catalogue

> **What this is**: 운영 중 자주 발생하는 문제와 해법 모음. 안티패턴 코드 (AF-1 ~ AF-26) 는 [Hyperbrief.md](https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md) §10 본문 참조 — 본 문서는 *운영 시점* 의 진단/해결 절차에 집중해요. 빠른 시작은 [QUICK-START.md](QUICK-START.md).

## 진단 흐름 (시작 지점)

문제 발생 시 다음 순서로 좁히세요:

1. **Plugin 자체 설치 상태**: `/plugin list` 로 `hyperbrief@estregenesis-plugins` 가 있는가?
2. **Node 의존 해소 상태**: `${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/renderers/node_modules/ajv` 가 존재하는가?
3. **Hook 연결 상태**: `.claude/settings.json` 에 `PreToolUse` + `Stop` 항목이 있는가?
4. **Hook 발화 상태**: 결정 질문 시 `[hyperbrief alert]` 로그가 stderr 에 나오는가?
5. **렌더링 상태**: brief 호출 시 마크다운 + HTML 둘 다 emit 되는가?

각 단계의 실패는 다음 절의 해당 문제와 매칭.

---

## T-1. Hook 가 조용히 멈춤 (Silent skip)

**증상**: 사용자가 "어떻게 할까요?" 류 질문을 받는데 brief 가 안 나옴. stderr 에 `[hyperbrief alert]` 도 없음.

**진단**:
- `.claude/settings.json` 안 `hooks.PreToolUse` 배열에 `hyperbrief-trigger-check` 항목 있는지 확인
- 항목 있는데 발화 안 함 → matcher pattern 불일치 가능. `AskUserQuestion` matcher 만으로는 bash 기반 결정 질문 catch 못 함.

**해법**:
- `matcher` 패턴 확장: `"AskUserQuestion|Bash"` (Bash 매처는 `bash_filter.cjs` wrapper 가 결정-write/deploy/send 만 필터링)
- 또는 model self-invoke 의존도 강화 — skill 의 `description` 필드 가시성 점검 (Claude Code 가 description 을 보고 skill 자동 호출)

**근본 원인**: Hyperbrief 의 silent-skip detection layer 는 hook 가 있어야 작동. hook 미연결 시 trigger-check 호출 자체가 model 자율에만 의존.

## T-2. `.claude/settings.json` 편집 거부 (Auto-mode self-modification gate)

**증상**: 대리자가 마이그레이션 스크립트로 `.claude/settings.json` 수정 시도 → Claude Code 가 "agent-runtime self-modification" 으로 분류 + 차단.

**진단**: 차단은 의도된 안전 장치예요 (AF-X 의 silent injection 회피).

**해법**:
1. 대리자 출력에서 settings.json diff 를 사용자에게 직접 표시
2. 사용자가 명시적으로 승인 (또는 owner 가 settings.json commit)
3. 사용자 측 적용 후 `/plugin restart` 또는 Claude Code 재시작

**대안**: sidecar 배포 — `.hyperbrief/hooks/` 를 프로젝트 트리에 두고 owner 가 settings.json 자체를 한 번 commit. 이후 대리자는 hook 코드만 manipulate (settings.json 미수정).

**SSoT**: Hyperbrief.md §11.4 채택자 설치 노트 (host self-config approval gate).

## T-3. `ajv` 버전 어긋남 (Clean install reproduction issue)

**증상**: `node bin/render.cjs ...` 실행 시 `Error: ajv schema validation failed: data must be object` 또는 `Cannot find module 'ajv'`.

**진단**:
- `cd renderers && npm ls ajv` — 버전이 `8.x` 이상인가?
- `mcp/` 도 같은 확인 (`cd mcp && npm ls ajv`)
- Hyperbrief v0.5.2 bundle 008 H6 의 회복 대상 클래스 — clean install 시 ajv 가 `8.x` 가 아니면 schema validation 경로 깨짐.

**해법**:
1. `cd renderers && rm -rf node_modules package-lock.json && npm install`
2. mcp 도 동일
3. 확인: `npm ls ajv` 출력에 `ajv@8.17.x` (또는 그 이상)

**예방**: renderers + mcp 의 `package.json` 둘 다 `"ajv": "^8.17.0"` 명시 고정. v0.5.2 이전의 unpinned 범위는 회복됨.

**SSoT**: Hyperbrief.md §10.x H1 (ajv import + clean install 재현 검증).

## T-4. `Constellation` 보드 꺼짐 — 4-way 대체 동작 (Review queue routing fallback)

**증상**: Hyperbrief 가 `DECISION_REQUEST` 발화하는데 Constellation 보드가 안 보임. brief 가 어디로 갔는지 모름.

**진단**: Constellation 도달 여부에 따라 hook 가 4-way 라우팅:
- `CONSTELLATION_WS_URL` 환경 변수 + local outbox.jsonl 있음 → 보드 emit
- 환경 변수 없음 + `auto_generate_review_doc: on` → `.hyperbrief/pending-reviews/<id>.md` 자리표시자 생성
- 환경 변수 없음 + `auto_generate_review_doc: off` → stderr alert 만
- 환경 변수 없음 + `auto_generate_review_doc: ask` (기본) → stderr alert + setup 힌트

**해법** (어디로 갔는지 찾기):
1. `ls .hyperbrief/pending-reviews/` — 자리표시자 파일 있나?
2. 없으면 stderr 로그 확인 — `[hyperbrief alert]` 행에 brief id 보임
3. 그 id 로 ledger 검색: `node mcp/server.cjs decision_ledger_query --id <id>`

**예방**: `.claude/settings.json` 또는 `.env` 에 `auto_generate_review_doc=on` 설정 — Constellation off 라도 항상 파일 표면화.

**SSoT**: Hyperbrief.md §11.4 review-queue 라우팅 절.

## T-5. 톤 버튼 지역화 (Audience profile fallback button)

**증상**: brief 카드의 버튼이 "What? Just say it plainly." 영어로만 표시. 한국어 사용자는 의도 파악 어려움.

**진단**: skill 의 자동 지역화 발화 시점이 IR-emit 직전이에요. 사용자의 prevailing 대화 언어를 skill 이 분류 → 그 언어 기본값 IR 의 `audience_profile_fallback.button_label` 에 populate.

**한국어 기본값**: "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)"

**해법** (커스터마이즈):
- IR 작성 시점에 명시: `audience_profile_fallback.button_label: "<원하는 텍스트>"`
- 또는 skill 의 description 단에서 사용자 언어 분류 보정 (영어/한국어 외 — 일본어 등 — 도 EN/KO/JA 리터럴이 SKILL.md 에 reference 로 있음)

**SSoT**: Hyperbrief.md §5.6.7 + MUST-19 (auto-localize 규율).

## T-6. 결정성 깨짐 (Same IR → different output)

**증상**: 같은 IR 을 두 번 렌더링했는데 출력이 다름. smoke test 통과해야 하는데 안 함.

**진단**: 본 클래스는 H7 (v0.5.4) 에서 회복. strip-then-validate 순서 → validate-on-canonical-IR → deep-clone → strip-on-clone 으로 재정렬. v0.5.4 미만이면 영향.

**해법**:
1. plugin 버전 확인: `${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/.claude-plugin/plugin.json` 의 `version` 필드. `0.5.4` 미만이면 업그레이드.
2. 업그레이드: `/plugin install hyperbrief@estregenesis-plugins` 로 재설치 (최신).
3. 회복 확인: `cd renderers && node bin/smoke.cjs` (있다면) 또는 동일 IR 두 번 렌더링 후 diff.

**예방**: Hyperbrief.md 의 H1 ~ H7 emergency-fix history 참조 — 새 회복 클래스 발생 시 즉시 patch 출시.

**SSoT**: Hyperbrief.md §10.x H7 entry.

## T-7. Sidecar (vendored) 경로 어긋남

**증상**: plugin 을 marketplace 가 아닌 vendoring (트리 복사) 으로 설치했는데 hook 가 `${CLAUDE_PLUGIN_ROOT}` 경로를 찾으려다 실패.

**진단**: `${CLAUDE_PLUGIN_ROOT}` 는 marketplace 설치 시점 plugin 디렉토리. vendoring 시에는 adopter 프로젝트 트리 안.

**해법**: `hooks.json` 또는 `.claude/settings.json` 안 hook 명령 경로를 `$CLAUDE_PROJECT_DIR/<vendored-path>/` 로 재작성.

**예시**:
```json
{
  "type": "command",
  "command": "node $CLAUDE_PROJECT_DIR/.hyperbrief/hooks/trigger-advise.cjs"
}
```

**SSoT**: Hyperbrief.md §11.4 채택자 설치 노트 + `$CLAUDE_PROJECT_DIR` vs `${CLAUDE_PLUGIN_ROOT}` 절.

## T-8. Surface profile mismatch warning (AF-18)

**증상**: brief 카드에 `AF-18` 또는 `surface_profile_estimate.declared_vs_estimate_gap_warning: true` 표시.

**진단**: 렌더링된 표면의 효과적 audience profile (estimate) 이 IR 의 declared audience_profile 과 ≥2 축 어긋남. 일반적으로 *과도한 전문어* 또는 *과도한 평문화* 패턴.

**해법** (작성자 측):
- IR 의 `audience_profile` 을 실제 출력에 맞게 재선언 (예: L2 → L3)
- 또는 본문 어휘를 declared profile 에 맞춰 수정 (전문어 줄이기 또는 평문 보강)

**해법** (사용자 측):
- 카드 위 "뭔 소리야? 한국어로 번역해줘" 버튼 클릭 → `L1.1.1` floor fallback 재렌더링

**SSoT**: Hyperbrief.md §5.6.7-pre (declared vs estimate gap warning).

---

## FAQ — 한 줄 답변

- **Q**: Trigger-check 의 4-score 어떻게 계산?  
  **A**: Hyperbrief.md §2.1 trigger rubric — reversibility / blast_radius / novelty / info_asymmetry 각 0-3, 합 4 이상 + MUST-trigger 발화 시 FULL_HYPERBRIEF.

- **Q**: revisit_date 자동 등록?  
  **A**: `hyperbrief` skill 이 IR emit 시 `section_8.recommendation_conditional.revisit_date` 를 ledger 에 append. Stop hook 이 매 턴 ledger 스캔해 도래 시 알림.

- **Q**: Decision ledger 위치?  
  **A**: 두 곳. 사람 가독성용 `_proposals/<bundle>/dogfood-ledger.md` (recent-N rows), 기계 가독성용 `.agent/_decisions/<module>-ledger.jsonl` (append-only stream).

- **Q**: 같은 IR 을 hand-edit 후 재렌더링 안전?  
  **A**: 안전. 결정성 invariant 유지 — hash 변화 시 새 IR 로 ledger 에 append, 이전 IR 도 그대로 보존.

- **Q**: Hyperbrief 만 채택하고 Constellation 미설치 가능?  
  **A**: 가능. `auto_generate_review_doc: on` 으로 파일 기반 fallback (`.hyperbrief/pending-reviews/`). 단 board-level 협업 시각화는 부재.

---

*문제 추가 보고 또는 새 진단 절차 제안은 [github issues](https://github.com/SoliEstre/EstreGenesis/issues) — Hyperbrief 라벨로.*
