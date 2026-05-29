# v2.3.0 Seed Integration Manifest — Superscalar + Autonomous Execution

**Date**: 2026-05-29
**Driver**: main Delegate seq 123 (autonomous-execution 절대사항 다운스트림 전파) + dogfood telemetry seq 119 (Haiku worker 부적합 → autonomy precheck) + Superscalar Stage 1 dogfood Entry 01-03 안정
**Source of truth (already pinned in repo body)**:
- Superscalar.md §1-§9 (v2.2.4 골격), §2 issue_width `autonomy_available_workers` 차원 + autonomous dispatch rule (4300f4a), §4 Andon worker autonomy precheck (4300f4a), §11 Entry 01-03
- Constellation.md §4 watch-state discipline — Silent-disable WARN + **Autonomous execution (absolute)** (70fca72)

이 매니페스트는 위 본문을 시드 6종에 일관 압축 반영하기 위한 lane 매니페스트. 시드는 본문의 *압축 reflection*; 본문과 충돌하면 본문이 SSoT.

---

## 1. 새 두 원칙 (Master Core Principles 13, 14)

기존 1-12 유지. **13, 14 신규**:

> **13. Execution scheduling (Superscalar)** — When multiple lanes can be made independent, parallel dispatch beats serial when the cost-benefit gate clears (spawn overhead < parallel speedup, typically at ~30-60k token horizons). `issue_width` is bounded by **Anthropic effort band**, **pace_mode cap**, **Little's Law** (PM review throughput / avg task duration), **Kanban WIP ≈ team_size+1**, and **autonomy_available_workers** (workers with autonomous-mode active — non-autonomous workers can't be counted as dispatchable lanes because per-dispatch permission prompts collapse throughput). Optional — for projects whose pace_mode benefits from concurrent execution. Detail: § Execution Scheduling (separate module, referenced by URL).

> **14. Autonomous execution (absolute)** — When the next step is already defined (a `Phase` ordering, the `planned` track, a `blocked` clearance, an in-order retire queue), **proceed in order without asking** — pausing to confirm a defined-next-step is itself a violation of autonomous operation (which is *the* reason for adopting this seed in the first place). Gate only on: (a) **loss / external publish** (push · deploy · send · delete), (b) **a new major branch** (RRP / design decision — at the *decision point* only; the resulting `Phase A/B/C` plan is *decided execution*, not a re-gate), (c) **restart-requiring deploys** (apply autonomously, coordinate the *restart timing* only), (d) **explicit user steering**. Real misread to avoid: "RRP done → PM Phase plan set → 'should I start Phase A?'" — that's mistaking the just-closed RRP gate for a new gate. Phase A is decided execution; start it.

KO 번역:
> **13. 실행 스케줄링 (Superscalar)** — 여러 lane이 독립으로 분리 가능하고 cost-benefit 게이트(spawn 오버헤드 < 병렬 가속, 대개 ~30-60k 토큰 지평)가 통과되면 병렬 디스패치가 직렬보다 유리. `issue_width`는 **Anthropic effort band**, **pace_mode 상한**, **Little's Law**(PM 리뷰 throughput / 평균 작업 길이), **Kanban WIP ≈ 팀 크기+1**, **autonomy_available_workers**(오토모드 활성 워커 — 비-오토모드 워커는 매 dispatch마다 권한 창이 throughput을 무너뜨려 dispatchable lane으로 셀 수 없음)로 제한. 옵션 — 동시 실행이 pace_mode에 이득인 프로젝트용. 자세한 내용: § Execution Scheduling (별도 모듈, URL 참조).

> **14. 자율 실행 (절대)** — 다음 단계가 이미 정해져 있으면 (Phase 순서, planned 트랙, blocked 해제분, in-order retire 큐) **묻지 말고 순서대로 진행** — 정해진-다음-단계를 멈춰 묻는 것 자체가 자율 운영(애초에 이 시드를 도입한 *이유*) 위반. 게이트는 오직: (a) **손실 / 외부 발행** (push · deploy · send · delete), (b) **새 중대 분기** (RRP / 설계 결정 — *결정 시점* 만; 그 결과로 잡힌 `Phase A/B/C` 계획은 *결정된 실행*이라 재게이트 아님), (c) **재기동 필요 deploy** (적용은 자율, *재기동 타이밍* 만 조율), (d) **명시적 사용자 steering**. 실수 사례: "RRP 종료 → PM Phase 잡힘 → 'Phase A 할까요?'" — 방금 닫은 RRP 게이트를 새 게이트로 오인. Phase A는 결정된 실행; 시작하라.

---

## 2. 시드 6종 patch 매핑

각 시드의 **Core Principles 카운트 + § Execution Scheduling 위치 + AGENTS.md core rules 정합** 정정.

### Master EN — AI_Native_Project_Master_Seed_Prompt.md
- 헤더 주석: `version: v2.2.0` → `v2.3.0`; `date: 2026-05-28` → `2026-05-29`; changelog tail에 v2.3.0 entry 추가 (README와 동기).
- § Core Principles에 **원칙 13, 14** 추가 (위 문구).
- 새 § **Execution Scheduling (Superscalar)** 추가 (Constellation § 위치 옆 ~line 2276 부근). 본문은 **Superscalar.md URL reference + 1단락 요약**(Constellation 모듈 referenced 패턴 그대로):
  - 1단락 요약: "Superscalar is an optional execution-scheduling module that bounds `issue_width` by 5 dimensions, gates dispatch by cost-benefit (~30-60k crossover), and adds Andon health visibility + MAST guards. Use it when pace_mode benefits from concurrent lane dispatch. Implementation: see `Superscalar.md`."
- AGENTS.md template § 5 Core rules에 새 첫 줄 추가: **"Autonomous execution (absolute) — proceed in order on defined-next-step. Gate only on (a) loss/external publish, (b) new major branch decision-point, (c) restart-deploy timing, (d) explicit user steering."**
- Phase 0 (Working Language and Agent Tone) Q 추가: "Execution scheduling — `serial` (default; single-lane) or `parallel` (Superscalar; multiple-lane autonomous dispatch)? Speculation — `off` (default) or `on` (predicted-then-retired branches)? Default both off if unsure."

### Master KO — AI_Native_프로젝트_마스터_시드_프롬프트.md
- Master EN과 같은 patch, KO 번역.
- 위 KO 원칙 13/14 문구 사용.
- § 명 "실행 스케줄링 (Superscalar)" / 새 첫 줄 "자율 실행 (절대) — 정해진-다음-단계는 순서대로 진행. 게이트는 (a) 손실/외부 발행, (b) 새 중대분기 결정 시점, (c) 재기동-deploy 타이밍, (d) 명시 steering 만."

### Lite EN — AI_Native_Project_Seed_Prompt_Lite.md
- 헤더 주석 version + date 동일 범프.
- Lite의 Core Principles는 현재 § Multi-Agent Coordination 분산. **§ Agent Instructions에 원칙 13/14 신규 추가** (각 1-2문장 압축):
  - "**13. Execution scheduling (Superscalar)** — when lanes are independent and the cost-benefit gate clears (~30-60k crossover), parallel dispatch beats serial. issue_width bounded by effort band, pace_mode cap, Little's Law, Kanban WIP, and autonomy_available_workers. Optional. See `Superscalar.md`."
  - "**14. Autonomous execution (absolute)** — defined-next-step proceeds without asking. Gate only on: loss/external publish, new major branch decision-point, restart-deploy timing, explicit user steering. Pausing on defined-next-step is itself a violation."
- AGENTS.md template § 5 Core rules 첫 줄 정합 추가.
- Phase 0에 execution_scheduling 토글 추가.
- § Multi-Agent Coordination (condensed) 끝에 1-2줄 cross-reference.

### Lite KO — AI_Native_프로젝트_시드_프롬프트_Lite.md
- Lite EN과 같은 patch, KO 번역.

### Compact EN — AI_Native_Project_Seed_Prompt_Compact.md
- 헤더 주석 version + date 동일 범프.
- § Principles (현재 6-9 원칙)에 **15. autonomous-execution (absolute)** + **14. execution-scheduling (Superscalar, optional)** 추가 (Compact는 1줄 압축; 카운트가 Lite/Master와 다른 게 Compact 패턴 — 원칙 13~15 다 추가 또는 자율주행/Superscalar 단 한 원칙으로 묶음).
  - 권장: Compact의 § Principles 원칙 10 ("Autonomous execution — defined next-step → proceed without asking; gate only on loss/external publish, new major branch decision-point, restart-deploy timing, explicit user steering.") + 원칙 11 ("Execution scheduling — Superscalar optional module for parallel-lane dispatch when cost-benefit clears; see `Superscalar.md`.").
  - 즉 두 원칙만 1줄씩, 총 11번까지.
- § Multi-agent cadence 끝에 1줄 cross-reference.

### Compact KO — AI_Native_프로젝트_시드_프롬프트_Compact.md
- Compact EN과 같은 patch, KO 번역.

---

## 3. lane 매니페스트 (Superscalar Stage 1 dogfood)

| lane | 파일 짝 | 추정 토큰 | tier | autonomy precheck |
|---|---|---|---|---|
| L1 Master pair | Master EN + Master KO | ~50-70k | Opus | OK (subagent native autonomy) |
| L2 Lite pair | Lite EN + Lite KO | ~25-35k | Sonnet 권장 (작아서 가성비) | OK |
| L3 Compact pair | Compact EN + Compact KO | ~15-25k | Sonnet | OK |

issue_width = min(Anthropic effort band=large, pace_mode cap=burst, Little's Law=author review throughput로 6 파일 한 batch OK, Kanban WIP ≤ 4, autonomy_available_workers=3 native subagents) = **3**. 3 lane parallel.

**Dispatch 순서**: L1 (Master) 먼저 → L1 출력을 L2/L3 가이드로 사용. 그러나 자율 dispatch 원칙 + lane 독립 만족 → 3 lane 모두 동시 spawn 가능 (각 lane이 본 매니페스트만 보고 자기 tier 자율 압축). 본 매니페스트 자체가 가이드라 L1 출력 의존성 없음.

**선택**: 한 turn에 한 lane씩 단계 분할 (Master pair 먼저, 검증 후 Lite/Compact) — supervisor 검토 cycle 짧게 유지. 자율 dispatch 위반 아님 (이번 turn = decided execution: L1 spawn).

---

## 4. Phase C — finalize

L1-L3 완료 후:
- README.md badge v2.2.4 → v2.3.0, EN/KO changelog v2.3.0 entry.
- README.md count sync (시드 카운트 6, principle count Master 14 / Lite 14 / Compact 11).
- Superscalar.md 헤더 status: "Stage 1 dogfood baseline (Entry 01-03) → v2.3.0 시드 통합 완료"로 정정.
- Constellation.md changelog (있다면) v2.3.0 entry: 자율주행 본문 정착 + 시드 압축 반영.
- 단일 commit + tag v2.3.0 + push (author-gated).

---

## 5. autonomous execution declaration

본 매니페스트 작성 + L1-L3 spawn + Phase C finalize는 **모두 decided execution** (저자 사전 결정 + 메인 Delegate seq 123 정합). 따라서 자율 진행. 게이트는 (c) restart-deploy 없음 (시드는 실행 코드 아님), (a) push만 author-gated.
