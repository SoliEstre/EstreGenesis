# Hyperbrief plugin — Phase 1 prototype (v0.1.0)

EstreGenesis의 `Hyperbrief.md` (v0.1)를 Claude Code 플러그인으로 wrapping. 결정 위임 게이팅(decision-delegation gating)을 model-invoked skill로 노출하여, 사용자에게 결정을 묻는 모든 시점에 (a) 발동 자격을 검증하고 (b) 발동 시 schema-enforced 8섹션 JSON IR을 생성하며 (c) deterministic 렌더러로 MD/HTML을 동시 emit한다.

## 무엇을 주는가

- **Skill: `hyperbrief-trigger-check`** (`skills/hyperbrief-trigger-check/SKILL.md`) — 사용자에게 결정/승인/선택을 묻는 메시지를 작성하기 직전에 자동 호출되는 경량 게이트. escalation 4-score + 5 MUST-trigger condition을 계산해 `{AUTONOMOUS_DECIDE, FULL_HYPERBRIEF, MINIMAL_BRIEF, BLOCK_FRAMING}` 4개 결과 중 하나를 반환. 결과가 `AUTONOMOUS_DECIDE`가 아닐 때만 본 `hyperbrief` skill을 호출한다.
- **Skill: `hyperbrief`** (`skills/hyperbrief/SKILL.md`) — 본 모듈의 메인 skill. JSON IR 생성 + 두 렌더러 호출 + Constellation `DECISION_REQUEST` + `HyperbriefCard` 동시 emit + revisit-date 등록.
- **Skill: `hyperbrief-revisit`** (`skills/hyperbrief-revisit/SKILL.md`) — 결정 사후 학습 루프 폐쇄. revisit_date 도래 OR `assumed_invariant` 위반 시 발화. ledger에서 IR 로드 → 사용자에게 실제 결과 질문 → outcome-quality vs decision-quality delta 계산 → Brier 증분 ledger append.
- **JSON Schema: `schema/hyperbrief.schema.json`** — 8섹션 IR의 정형 스키마 (renderer + validator 공통 입력 계약). LLM은 이 스키마만 생성, MD/HTML은 코드가 렌더링.
- **Template: `templates/brief.md.template`** — MD 렌더러용 템플릿. ADR 호환 헤더 + mermaid 다이어그램 슬롯.
- **Template: `templates/brief.html.template`** — HTML 렌더러용 템플릿. chart.js + mermaid CDN 임베드. 인터랙티브 시각화(escalation radar / reversibility 배지 / MCDA radar with weight sliders / 우선순위 드래그 리스트 / active-choice gate).

## Infrastructure requirements

- **Node.js**: 렌더러는 별도로 ship되지 않으며, Phase 1에서는 LLM이 템플릿을 직접 채워 emit. Phase 2에서 `renderers/renderer-md.cjs` + `renderers/renderer-html.cjs`가 추가될 예정 (스키마 validation + 순수 함수 렌더).
- **Constellation**: optional synergy. Constellation이 설치되어 있으면 `DECISION_REQUEST` + `HyperbriefCard` envelope을 emit해 board UI에 결정 카드로 노출. 없으면 standalone 모드 — 사용자에게 brief.md + brief.html 파일 경로를 직접 표시.
- **Superscalar**: optional synergy. Superscalar의 fan-out 게이트가 비가역 lane을 열 때 본 plugin의 trigger-check를 호출하도록 보강 (Hyperbrief.md §9 참조).

## Install

### Option A — community marketplace (v0.2+ 예정)

```bash
# Claude Code 세션에서:
/plugin install hyperbrief@claude-community
```

### Option B — self-hosted EstreGenesis marketplace

```bash
# Claude Code 세션에서:
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install hyperbrief@estregenesis-plugins
```

## 빠른 사용법

설치 후 별도 호출 없이 자동 발견된다. 에이전트가 사용자에게 결정을 묻는 메시지를 작성하기 직전, `hyperbrief-trigger-check` skill의 frontmatter `description`이 호출 조건을 매칭한다.

명시적으로 발동하려면:

```
/hyperbrief draft <topic>
```

또는 자연어로 "이건 hyperbrief로 정리해줘" 같은 요청도 동일하게 작동.

### 일반 흐름

1. 에이전트가 결정 요청 의도 감지 → `hyperbrief-trigger-check` 자동 호출.
2. escalation 4-score 합산 + 5 MUST-trigger 평가.
3. 결과:
   - `AUTONOMOUS_DECIDE` (sum < 4 AND no MUST-trigger) → 에이전트가 결정 + 1줄 사후 통보.
   - `FULL_HYPERBRIEF` → `hyperbrief` skill 호출 → IR 생성 → MD + HTML emit → Constellation 카드 발송.
   - `MINIMAL_BRIEF` (Cynefin chaotic) → 단일 액션 카드 + 24h 회고 예약.
   - `BLOCK_FRAMING` (Cynefin confused) → `DECISION_REJECT_FRAMING` emit + 사용자에게 재구성 요청.
4. 사용자 결정 후 → Constellation `DECISION_RESPONSE` 수신 → §9 Decision Capture 업데이트 + revisit_date 등록.
5. revisit_date 도래 → `hyperbrief-revisit` skill 발화 → 실제 결과 회수 + Brier 증분.

## v0.1.0에 든 것 / Phase 2 로드맵

### v0.1.0 (Phase 1) — 본 release

- 3 skills (trigger-check + main + revisit)
- IR JSON Schema (draft-07 + 2020-12 호환)
- 2 templates (MD + HTML)
- hooks placeholder (`hooks/hooks.json` empty)

### Phase 2 (v0.2.0+)

- `renderers/renderer-md.cjs` + `renderers/renderer-html.cjs` — Node 순수 함수 렌더러 (ajv 스키마 validation + handlebars 템플릿).
- `mcp/server.cjs` — 4 tools (`hyperbrief_render`, `hyperbrief_validate`, `decision_ledger_append`, `decision_ledger_query`).
- `hooks/hooks.json` 활성화 — PreToolUse 매처 (AskUserQuestion / git push / gh release / Constellation A2A emit 직전에 trigger-check 자동 호출). Stop hook으로 revisit-date 도래 ledger 스캔.
- Constellation MCP의 `a2a_wait_ack`에 `tier='decided'` 인지 추가 (Constellation plugin과 협업 PR).
- Decision ledger를 Constellation `state.json`의 `decisions[]` 필드로 sync.

## Constellation / Superscalar와의 관계

```
사용자 요청
   │
   ▼
[main agent]
   │
   ├──> 1. Superscalar 게이트: "fan-out 할 가치가 있나?"  (cost-benefit)
   │       │
   │       ▼ (통과)
   │
   ├──> 2. Hyperbrief 게이트: "사용자가 인가해야 하나?"   (escalation 4-score)
   │       │
   │       ▼ (FULL_HYPERBRIEF)
   │
   ├──> 3. Constellation A2A emit: DECISION_REQUEST + HyperbriefCard
   │       │
   │       ▼ (사용자 응답 대기)
   │
   └──> 4. DECISION_RESPONSE 수신 → §9 Decision Capture → revisit_date 등록
```

- **Constellation**: A2A 운반자. Hyperbrief는 Constellation의 `CUSTOM` envelope을 빌려 카드를 운반하고, ack 3-tier에 `decided`를 추가.
- **Superscalar**: 직교 게이트. Read 전용 lane은 Hyperbrief 면제. Write/deploy/send lane이 Superscalar cost-benefit를 통과한 직후 Hyperbrief escalation check.

## Source spec

Hyperbrief 사양 전체는 EG repo:
https://github.com/SoliEstre/EstreGenesis/blob/main/Hyperbrief.md

플러그인의 skill은 압축된 체크리스트이며, 스펙이 SSoT다.

## License

Apache-2.0.
