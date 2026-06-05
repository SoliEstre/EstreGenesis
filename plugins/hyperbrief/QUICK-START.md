# Hyperbrief — Quick Start (1 page)

> **What this is**: a one-page guide to go from `nothing installed` to `first Hyperbrief brief emitted` in about 5 minutes. For the full spec see [Hyperbrief.md](https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md); for installation depth see [README.md](README.md); for operational issues see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 30-second mental model

Hyperbrief 는 사용자에게 결정을 묻는 모든 시점에 대리자 (AI agent, 본문 안에서 일하는 AI 자동 작업자) 가 따르는 규율이에요. 결정 질문이 발생하면 두 단계 게이트를 통과합니다:

1. **자격 검증** (trigger-check 기술 (skill)): 이 질문이 정말 사용자 결정이 필요한가? 점수 4점 미만이면 대리자가 자율 결정 + 사후 알림 (post-notify), 4점 이상이면 다음 단계로.
2. **구조화 emit**: JSON 형식의 9섹션 중간 표현 (IR — intermediate representation) 을 대리자가 생성, 결정성 (determinism) 보장된 Node 도구가 그 IR 을 마크다운 + HTML 카드로 렌더링.

핵심 invariant: **같은 IR + 같은 옵션 → 바이트 일치 출력** (smoke test로 매 출시마다 검증).

## Install (3 단계)

### 1) Plugin 자체 설치

```bash
# Claude Code 세션에서 한 번:
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install hyperbrief@estregenesis-plugins
```

### 2) Node 의존 해소

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/renderers && npm install
cd ${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/mcp && npm install
```

(둘 다 단일 의존 `ajv ^8.17.0`, clean install 약 5초.)

### 3) Hook 등록 — **명시적 승인 게이트**

`.claude/settings.json` 에 PreToolUse + Stop 갈고리 (hook — 도구 호출 직전/턴 종료 시 자동 발화하는 검사 지점) 등록은 **별도 사용자 승인 필요** (Claude Code 의 auto-mode 분류기가 self-modification 으로 분류, 묵시적 적용 차단). README §⚠ 참조.

설치 후 다음 명령으로 동작 확인:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/hyperbrief/renderers
node bin/render.cjs --help
```

## First brief (30초 예제)

대리자가 사용자에게 "이거 어떻게 할까요?" 류 질문을 작성하려는 시점에 자동 호출돼요. 다음 두 결과 중 하나:

### Case A — 점수 < 4 + MUST-trigger 없음 (대부분의 일상 질문)

대리자가 자율 결정 + `BlockedStub` 카드만 사후 alert:

```
[hyperbrief auto-decided] choice=B, escalation_sum=2,
reason=reversible + low blast radius
```

### Case B — 점수 ≥ 4 OR MUST-trigger 발화 (중대 결정)

대리자가 9섹션 brief 생성. 화면에 마크다운 + HTML 카드 둘 다 표시:

```
§0 Decision Header  →  무엇 / 영향 / 가역성 / 결정자
§1 What to Decide   →  선택지 명시
§2 How It Plays Out →  각 선택지의 실행 절차
§3 Why Now          →  지금 결정해야 하는 이유
§4 Consequences     →  결과 매트릭스
§5 Decision Tree    →  RAPID-스타일 선택 트리
§6 Essence One-Line →  한 줄 정수
§7 Pre-Mortem       →  잘못됐을 때의 시나리오
§8 Recommendation   →  권장안 + 신뢰도 + 대안 + 가역 fallback
```

사용자는 카드 위 "뭔 소리야? 한국어로 번역해줘 (내가 알아들을 수 있는 말로)" 버튼 한 번으로 `L1.1.1` 톤 (가장 평이한 표현) 으로 재렌더링 가능.

## Where to read more

- **Spec 본문 (정본)**: [Hyperbrief.md](https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md) — 9섹션 IR 정의 + 21 MUST + 8 SHOULD + 26 안티패턴 + 채택자 절 §8.5/§11.3/§11.4
- **Plugin 사용**: [README.md](README.md) — Node 의존 + 환경 변수 + sidecar 배포
- **운영 문제 해법**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — hook 조용한 skip / 설정 파일 게이트 / `ajv` 버전 어긋남 / Constellation off fallback / 톤 버튼 지역화
- **MCP 서버 사용**: `mcp/` 폴더 + 4 도구 (`hyperbrief_render` / `hyperbrief_validate` / `decision_ledger_append` / `decision_ledger_query`)
- **시각화 사용**: `templates/brief.html.template` (mermaid + chart.js)

## License

Apache-2.0. EstreGenesis-bundled. 비공개 fork OK.
