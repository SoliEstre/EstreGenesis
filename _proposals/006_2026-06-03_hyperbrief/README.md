# 006 · 2026-06-03 · hyperbrief

> Inbound proposal bundle for a **new EstreGenesis top-level module — Hyperbrief** — a decision-delegation gating discipline that sits alongside `Constellation.md` and `Superscalar.md` at the repo root. The bundle synthesizes a six-axis deep-research pass (AI harness · humanities · psychology · management · philosophy · long-horizon development) into a concrete `Hyperbrief.md` SSoT + `plugins/hyperbrief/` Claude Code plugin scaffolding. The proposal asks the seed maintainer to absorb the module at `v2.5.14` and to extend `Constellation.md §13.16.9` allowlist + `Superscalar.md §3` irreversibility barrier to interlock with it.

## Bundle definition

The user surfaced a recurring failure mode: when AI agents reach a decision point and ask the user to choose, they tend to (a) bury the actual question inside a free-form prose dump, (b) anchor the user toward a single recommendation without surfacing the option space, (c) skip the epistemic provenance of their own claims, and (d) treat every decision request as if it had the same weight — both over-escalating trivia and under-escalating one-way doors. The bundle proposes that this is not a prompt-engineering bug but a missing **module-level discipline**: the act of *asking the user for a decision* deserves the same first-class treatment that Constellation gives to A2A messaging and Superscalar gives to fan-out scheduling.

Hyperbrief reframes the brief from "an information package" to a **gating ritual** with five enforced stages:

1. **Trigger rubric** — a Hyperbrief is only emitted when an explicit escalation score (irreversibility + blast radius + time horizon + reversal cost, summed) ≥ 4 *or* a MUST-trigger condition fires; otherwise the agent decides autonomously and post-notifies.
2. **Epistemic honesty surface** — every fact statement carries an inline `[verified|inferred|assumed|unknown]` tag plus optional provenance tag; the validator rejects untagged statements.
3. **Cognitive de-biasing** — 2×2 framing matrix instead of single-narrative consequences; pre-mortem as compulsory active-choice gate; meta-branch (`accept` / `reject-framing` / `defer` / `request-investigation`) on every decision tree.
4. **Reversibility-first decision governance** — RAPID roles in the header; Cynefin domain-adaptive `§7` tree format; reversibility badge (green/yellow/red); reversible-fallback paired with every recommendation.
5. **Post-decision learning loop** — `§9 Decision Capture` auto-registers a revisit date; outcome vs decision quality recorded for Brier-score calibration; Constellation `decisions[]` ledger accumulates.

The bundle also defines the IR-driven rendering pipeline (LLM emits a single `HyperbriefIR` JSON; deterministic Node renderers produce ADR-compatible MD and self-contained interactive HTML) and the Constellation `DECISION_REQUEST` / `DECISION_RESPONSE` / `DECISION_DEFER` / `DECISION_REJECT_FRAMING` envelope set with extended 3-tier ack (`received` → `acknowledged` → `decided`).

## Documents

| # | topic | en | ko | type |
|---|---|---|---|---|
| 001 | Six-axis deep research — AI harness · humanities · psychology · management · philosophy · long-horizon development | [001_research-6-axes.en.md](001_research-6-axes.en.md) | [001_research-6-axes.ko.md](001_research-6-axes.ko.md) | research synthesis |
| 002 | Synthesis (core thesis · cross-axis themes · tensions · refined 8-section spec · trigger criteria · normative rules) + design (module location · file layout · IR schema · MD/HTML templates · Constellation integration · trigger rules · adoption path) | [002_synthesis-and-design.en.md](002_synthesis-and-design.en.md) | [002_synthesis-and-design.ko.md](002_synthesis-and-design.ko.md) | design proposal (new module: `Hyperbrief.md` + `plugins/hyperbrief/`) |

## Closure log

| date | status | note |
|---|---|---|
| 2026-06-03 | drafted | Initial submission. Proposes new top-level module `Hyperbrief.md` (v0.1.0) + `plugins/hyperbrief/` (Phase 1: 2 skills + JSON schema + MD/HTML renderers + templates; Phase 2: PreToolUse hooks + MCP server). Asks seed maintainer to extend `Constellation.md §13.16.9` A2A-intent allowlist (4 new names + `HyperbriefCard`), extend `Constellation.md §13.13` ack 3-tier with `decided` tier semantics, and extend `Superscalar.md §3` irreversibility barrier to escalate to Hyperbrief on write-lane intents matching MUST-trigger conditions. No commit hash yet — awaiting review. |

## Privacy

Reverse-reference redacted per `_proposals/` privacy default — no adopter service names, hosts, IPs, repo paths/URLs, or internal doc identifiers appear. The proposal cites only published research literature (Anthropic prompt-engineering guidance, Habermas, Gadamer, Arendt, Sennett, Floridi, Tversky-Kahneman, Sweller, Klein, Drucker, Bezos, Snowden, Annie Duke, Saaty, Dixit-Pindyck, Bain RAPID, Toulmin, Popper, Jonas, Rawls, Ihde, Zagzebski, Lehman, Fowler, Hyrum's law, Ousterhout, Hickey, Postel) and EstreGenesis seed-internal references (`Constellation.md §13.11/§13.13/§13.16`, `Superscalar.md §2/§3/§5/§6/§11`). No commit hashes are cited.

---

# 006 · 2026-06-03 · hyperbrief

> EstreGenesis 의 새 최상위 모듈 — **Hyperbrief** — 도입 제안 묶음. `Constellation.md` 와 `Superscalar.md` 와 같은 레벨로 repo 루트에 자리하는 **결정 위임 게이팅 규율** 모듈. 6 축 딥리서치 (AI 하니스 · 인문학 · 심리학 · 경영학 · 철학 · 장기 개발론) 결과를 합쳐 구체적 `Hyperbrief.md` SSoT + `plugins/hyperbrief/` Claude Code 플러그인 스캐폴딩을 설계. 시드 유지자에게 `v2.5.14` 에서 모듈을 흡수하고, `Constellation.md §13.16.9` allowlist 및 `Superscalar.md §3` 비가역성 barrier 를 이 모듈과 연동되도록 확장할 것을 요청.

## 묶음 정의

사용자가 반복적으로 발견한 실패 패턴: AI 에이전트가 결정 지점에 도달해 사용자에게 선택을 물을 때 (a) 실제 질문을 자유 서술 prose 더미 안에 묻어버리고, (b) 옵션 공간을 표면화하지 않은 채 단일 권장으로 사용자를 앵커링하며, (c) 자기 주장의 인식적 출처를 생략하고, (d) 모든 결정 요청을 같은 무게로 다뤄 — 사소한 사안은 과잉 escalate, 일방향 결정은 과소 escalate. 이 묶음은 이것이 프롬프트 엔지니어링 버그가 아니라 **모듈 차원의 규율이 빠진** 문제로 본다. 사용자에게 결정을 묻는 행위 자체가 Constellation 의 A2A 통신, Superscalar 의 fan-out 스케줄링과 동격의 일등 시민 대우를 받아야 한다는 입장.

Hyperbrief 는 브리핑을 "정보 패키지" 가 아닌 **게이팅 의례** 로 재정의하며, 5 단계를 강제한다:

1. **Trigger rubric** — escalation 점수 (비가역성 + blast radius + 시간 지평 + 가역 비용, 합산) ≥ 4 이거나 MUST-trigger 조건 1 개 이상 충족 시에만 발동. 그 외에는 자체 결정 + 사후 통보.
2. **인식적 정직성 표면** — 모든 사실 진술에 `[verified|inferred|assumed|unknown]` inline tag + provenance tag 부착. 무태그는 validator reject.
3. **인지 디바이싱** — 단일 narrative 대신 2x2 framing matrix; pre-mortem 자유 입력을 active-choice gate 로 강제; 모든 결정 트리 루트에 `accept` / `reject-framing` / `defer` / `request-investigation` 메타 분기.
4. **가역성 우선 의사결정 거버넌스** — 헤더 RAPID 역할 표기; Cynefin 도메인 분기로 `§7` 트리 형식 자동 전환; reversibility 배지 (녹/황/적); 모든 권장에 reversible-fallback 짝.
5. **사후 학습 루프 폐쇄** — `§9 Decision Capture` 가 revisit date 자동 등록; outcome vs decision quality 기록으로 Brier 스코어 보정 누적; Constellation `decisions[]` ledger 누적.

또한 본 묶음은 IR 기반 렌더링 파이프라인 (LLM 은 `HyperbriefIR` 단일 JSON 만 생성; deterministic Node 렌더러가 ADR 호환 MD + self-contained interactive HTML 산출) 과 Constellation `DECISION_REQUEST` / `DECISION_RESPONSE` / `DECISION_DEFER` / `DECISION_REJECT_FRAMING` envelope set + 3 단계 ack 확장 (`received` → `acknowledged` → `decided`) 도 정의.

## 문서

| # | 주제 | en | ko | 유형 |
|---|---|---|---|---|
| 001 | 6 축 딥리서치 — AI 하니스 · 인문학 · 심리학 · 경영학 · 철학 · 장기 개발론 | [001_research-6-axes.en.md](001_research-6-axes.en.md) | [001_research-6-axes.ko.md](001_research-6-axes.ko.md) | 리서치 통합 |
| 002 | 합성 (core thesis · cross-axis themes · 긴장과 해소 · 정제된 8 섹션 사양 · trigger 기준 · 규범 규칙) + 설계 (모듈 위치 · 파일 레이아웃 · IR 스키마 · MD/HTML 템플릿 · Constellation 통합 · trigger 규칙 · 도입 경로) | [002_synthesis-and-design.en.md](002_synthesis-and-design.en.md) | [002_synthesis-and-design.ko.md](002_synthesis-and-design.ko.md) | 설계 제안 (신규 모듈: `Hyperbrief.md` + `plugins/hyperbrief/`) |

## Closure 로그

| 날짜 | 상태 | 노트 |
|---|---|---|
| 2026-06-03 | drafted | 초안 제출. 신규 최상위 모듈 `Hyperbrief.md` (v0.1.0) + `plugins/hyperbrief/` 제안 (Phase 1: 스킬 2 개 + JSON 스키마 + MD/HTML 렌더러 + 템플릿; Phase 2: PreToolUse 훅 + MCP 서버). 시드 유지자에게 `Constellation.md §13.16.9` A2A-intent allowlist 확장 (4 신규 이름 + `HyperbriefCard`), `Constellation.md §13.13` ack 3 단계에 `decided` 시멘틱 추가, `Superscalar.md §3` 비가역성 barrier 가 write-lane intent 가 MUST-trigger 조건 충족 시 Hyperbrief 로 escalate 하도록 확장을 요청. commit hash 미정 — 검토 대기. |

## 프라이버시

`_proposals/` 기본 프라이버시 정책 준수 — 도입 프로젝트 서비스명, 호스트, IP, repo 경로/URL, 내부 문서 식별자는 일체 등장하지 않음. 제안은 공개 학술 문헌 (Anthropic prompt-engineering 가이드, Habermas, Gadamer, Arendt, Sennett, Floridi, Tversky-Kahneman, Sweller, Klein, Drucker, Bezos, Snowden, Annie Duke, Saaty, Dixit-Pindyck, Bain RAPID, Toulmin, Popper, Jonas, Rawls, Ihde, Zagzebski, Lehman, Fowler, Hyrum's law, Ousterhout, Hickey, Postel) 와 EstreGenesis 시드 내부 참조 (`Constellation.md §13.11/§13.13/§13.16`, `Superscalar.md §2/§3/§5/§6/§11`) 만 인용. commit hash 인용 없음.
