# Hyperbrief — Quick Start (한 페이지)

> **이 문서는**: "아무것도 설치 안 한 상태" 에서 "첫 Hyperbrief 브리핑 (이하 brief) 출력" 까지 약 5분 안에 가는 한 페이지 안내문이에요. 전체 사양은 [Hyperbrief.md](https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md), 설치 상세는 [README.md](README.md), 운영 문제 해법은 [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 30초 개념 모델

Hyperbrief 는 사용자에게 결정을 묻는 모든 시점에 AI 자동 작업자 (이하 대리자) 가 따르는 규율 (모듈) 이에요. 결정 질문이 발생하면 두 단계 문을 통과합니다:

1. **자격 검증** (발동 자격 검사 기술, trigger-check): 이 질문이 정말 사용자 결정이 필요한가? 위험도 점수 4점 미만이면 대리자가 자율 결정 + 사후 알림 (post-notify), 4점 이상이면 다음 단계로.
2. **구조화 출력**: 자바스크립트 객체 표기 형식 (JSON) 의 9섹션 중간 표현 (이하 IR) 을 대리자가 생성, 결정성 (같은 입력 → 같은 출력 보장 성질) 가진 노드 도구 (Node) 가 그 IR 을 마크다운 (MD) + 웹 페이지 형식 (HTML) 카드로 그려요.

핵심 불변식 (invariant): **같은 IR + 같은 옵션 → 바이트 일치 출력** (기본 동작 검사, smoke test 로 매 출시마다 검증).

## 설치 (3 단계)

### 1) 플러그인 (Claude Code 가 부르는 외부 모듈, 이하 plugin) 자체 설치

```bash
# Claude Code 세션에서 한 번:
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install hyperbrief@estregenesis-plugins
```

### 2) Node (노드 자바스크립트 도구) 의존 해소

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/renderers && npm install
cd ${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/mcp && npm install
```

- `npm` 은 노드 패키지 관리자 (이하 npm).
- 두 디렉토리 다 단일 의존 = `ajv` (JSON 형식 검사기) `^8.17.0`. 깨끗한 설치 시 약 5초.

### 3) 갈고리 (도구 호출 직전 / 턴 종료 시 자동 발화하는 검사 지점, hook) 등록 — **명시적 승인 문**

`.claude/settings.json` 에 두 종류 갈고리 (hook) (`PreToolUse` + `Stop`) 등록은 **별도 사용자 승인 필요**. Claude Code 의 자동 모드 분류기가 본 변경을 "대리자 런타임 자기 수정" (self-modification) 으로 분류하고 묵시적 적용을 차단해요. 자세히는 [README.md](README.md) 의 ⚠ 절.

설치 후 다음 명령으로 동작 확인 (Node 실행):

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/renderers
node bin/render.cjs --help
```

`ajv` (JSON 형식 검사기) 가 같이 부르기 가능한지도 자동 확인돼요.

## 첫 brief (30초 예제)

대리자가 사용자에게 "이거 어떻게 할까요?" 종류 질문을 작성하려는 시점에 발동 자격 검사 (trigger-check) 가 자동 호출돼요. 다음 두 결과 중 하나:

### 경우 A — 위험도 < 4 + 강제 발동 조건 (MUST-trigger) 발화 없음 (대부분의 일상 질문)

대리자가 자율 결정 + 차단된 그루터기 카드 (BlockedStub) 만 사후 표시:

```
[hyperbrief auto-decided] choice=B, escalation_sum=2,
reason=reversible + low blast radius
```

`escalation_sum` 은 위험도 합계 (escalation_sum). 4 미만이면 자율 결정 충분. 강제 발동 조건 (MUST-trigger) 도 부재해야 본 경우 A 발화.

### 경우 B — 위험도 ≥ 4 또는 MUST-trigger 발화 (중대 결정)

대리자가 9섹션 brief 생성. 화면에 마크다운 (MD) + 웹 페이지 형식 (HTML) 카드 둘 다 표시:

```
§0 Decision Header  →  무엇 / 영향 / 가역성 / 결정자
§1 What to Decide   →  선택지 명시
§2 How It Plays Out →  각 선택지의 실행 절차
§3 Why Now          →  지금 결정해야 하는 이유
§4 Consequences     →  결과 매트릭스
§5 Decision Tree    →  선택 나무 (RAPID 양식)
§6 Essence One-Line →  한 줄 정수
§7 Pre-Mortem       →  잘못됐을 때의 시나리오
§8 Recommendation   →  권장안 + 신뢰도 + 대안 + 가역 대체 동작
```

각 brief 가 결정 기록부 (ledger) 에 추가돼요 — 사후 재방문 (이하 revisit) 가능. 결정 기록부 (ledger) 위치는 `_proposals/<bundle>/dogfood-ledger.md` (사람 가독) + `.agent/_decisions/<module>-ledger.jsonl` (기계 가독).

사용자는 카드 위 "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)" 버튼을 한 번 누르면 `L1.1.1` 톤 (가장 평이한 표현) 으로 다시 그려져요. MD + HTML 둘 다 새 톤 적용.

## 더 읽을거리

- **본 사양 (정본)**: [Hyperbrief.md](https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md) — 9섹션 IR 정의 + 21 MUST + 8 SHOULD + 26 회피 패턴 + 채택자 절 §8.5/§11.3/§11.4
- **plugin 사용**: [README.md](README.md) — Node 의존 + 환경 변수 + 별도 vendoring (sidecar) 배포
- **운영 문제 해법**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — 갈고리 (hook) 조용한 우회 / 설정 파일 문 / `ajv` (JSON 형식 검사기) 버전 어긋남 / Constellation 꺼짐 대체 동작 / 톤 버튼 지역화
- **모델 컨텍스트 프로토콜 (MCP) 서버 사용**: `mcp/` 폴더 + 4 도구 (`hyperbrief_render` / `hyperbrief_validate` / `decision_ledger_append` / `decision_ledger_query`)
- **시각화 사용**: `templates/brief.html.template` (mermaid + chart.js)

## 라이선스

Apache-2.0. EstreGenesis 묶음. 비공개 fork 가능.
