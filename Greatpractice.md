<!-- module: Greatpractice; layer: practice-codification; part-of: EstreGenesis 2.6.x (planned); version: v0.3.1; date: 2026-06-13; status: design draft v0.3.1 (micro 계층 1차 분해 — mezzo 9건 → 20 atoms, command-check-decision 3-tuple + INDEX micro 섹션; 직전 v0.3.0 = §7.7 retire 축 신설 — active/probation/retired 3-상태 + _schema status/retire_reason + INDEX Retired 카운트; 북극성 deprecation-일급 GP 구현; 직전 v0.2.1 = ship-surface 정합 패치 — §11.1 의 design-시점 목표 트리 'ship' 기술을 실재 ship 목록으로 정정 + 잉여분 §11.2 deferred 이동; 직전 v0.2.0 = mezzo batch ratification cut — release-cadence.md (macro) §2.3 의 8 mezzo decomposition candidates 가 Workflow wk5a6jh5k 병렬 fan-out 으로 한꺼번에 ratified: n-way-sync-registry / package-files-validate / bin-entry-validate / link-integrity-check / dry-run-smoke-test / pre-publish-user-gate / naming-hygiene-grep / auth-2fa-discipline. 5-axis maturation sum 분포: 24/24/22/21/19/19/19/17. 8 entries × ~230 lines = ~1850 lines added. v0.1.0 (2026-06-04) 의 1 macro + 1 mezzo (outbox-json-validation) 구조에서 1 macro + 9 mezzo 로 확장 — children decomposition pattern 의 first batch demonstration. micro decomposition + lifecycle hook 구현은 v0.3+ 후속); depends-on: none (optional synergy: Hyperbrief §1 escalation-aware codification handoff; Constellation §13 A2A hook channel for blameless second-story propagation; Superscalar §3 promotion fan-out for parallel retro-backfill); license: Apache-2.0 -->

# Greatpractice — Memory-Triggered Practice Codification with Lazy Hierarchy + Deterministic Hooks (design draft v0.2.1)

> **EstreGenesis optional module — design draft v0.2.1.** Constellation 이 *agent 간 통신* 을, Superscalar 가 *agent 안의 dispatch* 를, Hyperbrief 가 *사용자에게 결정 위임* 을 다룬다면, Greatpractice 는 네 번째 축 — **작업 중 자연스럽게 누락되기 쉬운 약속·절차·습관을 메모리 기반 트리거로 자동 감지하고 관행으로 격상하는 체계** 를 다뤄요. 메모리 (`memory/feedback_*.md` 또는 동등 surface) 가 입력 신호 (트리거) 이고, multi-criteria maturation gate 가 검증을 담당하고, 격상된 관행은 lifecycle hook 으로 자동 강제돼요. Greatpractice 는 *문서 형식* 도 *룰 카탈로그* 도 아니에요. **lazy 3-tier hierarchy** (macro/mezzo/micro — 필요 시점에만 로드) + **deterministic lifecycle hook** (모델 판단에 의존하지 않는 7-event 강제) + **multi-criteria maturation gate** (5-axis weighted score + 3-criterion notability + phronesis boundary) 의 세 backbone 이 합쳐진 운영 체계예요. 9-axis cross-domain 딥리서치 (harness · humanities · psychology · management · processor · os · sre · memoization · canonical) 가 세 backbone 각각에 대해 8/9 · 7/9 · 5/9 축의 *isomorphic 합의* 를 도출해서 단일 도메인 권위 의존을 회피했어요 (부록 A · B 참조).
>
> **Cost-honest framing.** Greatpractice 는 공짜가 아니에요. deterministic hook 은 매 lifecycle event 마다 latency budget (humanities §1.7 Gawande 60-90s ceiling) 을 소비하고, frontmatter schema 의 9/9 universal convergence 는 entry 당 token overhead 를 추가하고, multi-criteria maturation gate 는 메모리 신호에서 관행 격상까지의 ship rate 를 의도적으로 늦춰요. 이 비용을 trade 해서 얻는 것은 — *누락의 zero-recurrence enforcement* (필요한 작업이 빠지지 않도록 매번 모델이 *기억할* 필요 없음), *working set 의 durable retention* (재유도 cost 없이 phase 전환 가능), *codify 가능 영역과 phronesis-only 영역의 명시 경계* (Aristotle Nicomachean Ethics VI + Polanyi tacit knowing 의 *codify 하지 *말* 영역* 의 in-spec 흡수).
>
> **Optional.** 단발 task 운영 / phronesis-dense work / soloist 1-인 1-cycle / 외부 강제 규율 우세 환경 에선 Greatpractice 채택의 ROI 가 negative 로 전환돼요 (§10.2). 운영 cycle ≥ 5 + 동일 메모리 패턴 ≥ 3 회 누적 + codify 대상 surface ≥ 11 의 3 조건 동시 충족 시점부터만 채택 권장 (§10.1).
>
> **Self-sufficient.** 본 파일이 SSoT 예요. Adopter 가 Greatpractice-conformant 운영 시스템을 구축하기 위해 필요한 모든 spec 은 본 문서에 있어요. `plugins/greatpractice/` 의 v0.1.0 reference implementation 은 Claude Code harness 의 runtime adapter — 다른 harness 는 본 spec 직접 채택 가능.
>
> _용어 안내_: "entry" (트리의 노드), "tier" (macro/mezzo/micro 의 계층), "ratified" (raw memory → draft → 최종 promote 된 상태), "raw memory" (메모리에 즉시 capture 된 1회성 신호 — 관행 트리거의 입력), "Greatpractice" (모듈 이름, 산문 capitalized · 경로는 lowercase) 는 본 문서 안에서 일관 사용해요.

---

## Table of Contents

- [§1. Concept — Greatpractice 의 정체](#1-concept--greatpractice-의-정체)
- [§2. Tier Hierarchy — macro / mezzo / micro](#2-tier-hierarchy--macro--mezzo--micro)
- [§3. Entry Schema — frontmatter as governance SSoT](#3-entry-schema--frontmatter-as-governance-ssot)
- [§4. Hook Mechanism — deterministic enforcement](#4-hook-mechanism--deterministic-enforcement)
- [§5. Maturation Gate — raw → draft → ratified](#5-maturation-gate--raw--draft--ratified)
- [§6. Voice & Framing — blameless second-story](#6-voice--framing--blameless-second-story)
- [§7. Freshness & Lifecycle Cadence](#7-freshness--lifecycle-cadence)
- [§8. SSoT Propagation — `surfaces[]` inversion](#8-ssot-propagation--surfaces-inversion)
- [§9. Interactions — Constellation / Superscalar / Hyperbrief](#9-interactions--constellation--superscalar--hyperbrief)
- [§10. Adoption Thresholds](#10-adoption-thresholds)
- [§11. v0.1.0 Cut Scope](#11-v010-cut-scope)
- [§12. Implementation Notes](#12-implementation-notes)
- [부록 A. Cross-Axis Convergence Cluster Catalog](#부록-a-cross-axis-convergence-cluster-catalog)
- [부록 B. 4 Strong Isomorphism + Normative 정당화](#부록-b-4-strong-isomorphism--normative-정당화)
- [부록 C. Self-Application — 본 spec 자체의 frontmatter](#부록-c-self-application--본-spec-자체의-frontmatter)

---

## §1. Concept — Greatpractice 의 정체

> Greatpractice 는 *문서 형식* 도 *룰 카탈로그* 도 아니에요. 반복 작업의 누락을 막기 위한 **운영 메커니즘** — *lazy hierarchy* (필요 시점에만 로드되는 3-tier 트리) + *deterministic hook* (모델 판단에 의존하지 않는 lifecycle 강제) + *maturation gate* (raw 경험 → ratified entry 까지의 다단계 게이트) 의 세 backbone 이 합쳐진 모듈이에요. 본 §1 은 그 *정체* 를 정의하고, 흔한 4 가지 오독을 차단해요.

### §1.1 4 가지 흔한 오독과 실제 정체

Greatpractice 를 이름만 보고 떠올리기 쉬운 4 가지 잘못된 frame 이 있어요. 각각을 미리 끊어두면 §2 이후의 모든 design choice 가 자연스럽게 정렬돼요.

| 오독 | 실제 정체 |
|---|---|
| (a) **"또 다른 메모리 시스템"** — `memory/feedback_*.md` 의 확장판 | Greatpractice 는 메모리 *저장소* 가 아니라 메모리가 *반복 patterned 한 시점* 에 (frequency × cost × predictability 가 임계 통과한 시점에) 절차 지식으로 promote 되는 **lifecycle pipeline**. 메모리 자체는 input 일 뿐 |
| (b) **"또 하나의 룰 파일"** — `AGENTS.md` / `.agent/rules.md` 와 같은 평면적 norm 선언 | Greatpractice 는 평면 norm 선언이 아니라 **3-tier 호출 chain** (macro → mezzo → micro). 진입 시점·activation 메커니즘·강제력 강도가 tier 별로 다름. 평면 룰의 *always-on tax* 회피가 architectural 동기 |
| (c) **"1 회 codification 산출물"** — 한 번 정리하면 끝나는 best-practice 카탈로그 | Greatpractice entry 는 항상 **probation → consolidation → automatic** lifecycle (psychology §1.10 Lally 66일 모델) 안에 살아 있어요. `last_validated_at` 만료 시 자동 dim/warn, hit/miss 카운터 누적, supersedes graph 로 진화 — *살아있는 문서* (humanities §4.8) |
| (d) **"AGENTS.md 대체"** — always-on permanent context 의 후속 | Greatpractice 는 AGENTS.md 를 *대체* 가 아니라 *보완*. AGENTS.md = always-on macro (§5 telos, 5-10 항목 상한). Greatpractice 는 그 아래 mezzo/micro tier + lifecycle 메커니즘. AGENTS.md §5 의 telos 자체가 `greatpractice/macro/_telos.md` 의 source 가 되지만, AGENTS.md 슬롯 자체는 보존 (harness §1.5 Aider read-only cache 의 prompt-cache prefix 정합성) |

요약하면 Greatpractice = **"반복 작업의 누락을 *결정적으로* 방지하는 진화 가능한 절차 트리"**. 메모리·룰·카탈로그 어느 하나의 슬롯도 직접 점유하지 않고, 셋의 *접합부* 를 instrumentation 해요.

### §1.2 5-stage pipeline — capture → mature → codify → enforce → revisit

Greatpractice 의 본질은 단일 산출물이 아닌 **5-stage 파이프라인** 이에요. 각 단계가 다른 메커니즘으로 작동하고, 각 단계 사이에 *게이트* 가 있어요.

```
[1. capture]  raw 사건 발생 → memory/feedback_<slug>.md 즉시 작성
              Schön reflection-in-action 의 황금 순간 활용 (psychology §3.5)
              voice-check 강제 — blameless framing (§6.1 Cluster E)
                ↓ (게이트 1: 1회 → 누적)
[2. mature]   동일 패턴 재발현 시 frequency 누적 + illustration append
              rrpv (re-reference prediction value, processor §1.7) decay 카운터
              notability gate 자동 체크 (§5.2):
                (a) significant coverage ≥ 3 회
                (b) independent triggers ≥ 2 종
                (c) verifiable effect 측정 가능
                ↓ (게이트 2: 3-criterion 통과 → draft 자격)
[3. codify]   greatpractice/_propose/<slug>.draft.md 자동 생성
              phronesis-codify-boundary 검증 (§5.3 + humanities §1.12 / §3.9):
                frequency × cost-of-missing × predictability ≥ threshold
              tier 결정 (macro / mezzo / micro — §2 참조)
              full frontmatter schema (§3 참조) 작성
                ↓ (게이트 3: phronesis 통과 + promote 승인 → ratified)
[4. enforce]  greatpractice/{macro|mezzo|micro}/<slug>.md 로 promote
              lifecycle hook 등록 (Stop / PreToolUse / UserPromptSubmit 등; §4 참조)
              enforcement_level (mandatory / recommended / advisory) 별 동작:
                - mandatory → exit 2 차단 (poka-yoke contact 유형, management §1.8)
                - recommended → warning + additionalContext inject
                - advisory → reference only
              memory/feedback_<slug>.md 는 1줄 redirect stub 으로 교체 (§5.5)
                ↓ (게이트 4: freshness 만료 또는 hit-rate 임계 미달)
[5. revisit]  주기적 staleness probe (§7 + sre §1.6 PRR + canonical §1.11)
              hit/miss 통계 누적 → distinguish / per-incuriam / overrule
                cost-tiered revision vocabulary (§7.4 + humanities §1.2):
                - distinguish (가장 cheap): 이번 context 만 적용 안 함
                - per-incuriam (중간 cost): 약권위로 강등 + retire 큐
                - overrule (높은 cost): 명시 폐기 + supersedes graph 업데이트
              90일 hit 0 + miss 0 = cold eviction 후보 (§7.6 + memoization §1.5)
                ↺ (필요 시 4 로 회귀 또는 archive)
```

이 파이프라인의 핵심은 **각 단계가 독립적 enforcement loop 를 가진다** 는 점이에요. capture 만 있고 mature 단계가 빠지면 noise codify (부록 A Cluster D · eager codification 의 함정). enforce 만 있고 revisit 이 없으면 stale 박제 (humanities §4.8 + memoization §1.5). 다섯 단계가 모두 *명시 게이트* 로 분리돼 있어야 모듈 전체가 살아있는 절차 시스템이 돼요.

### §1.3 Architectural backbone — *lazy hierarchy + deterministic hook + maturation gate*

이 모듈의 architectural 정당화는 한 도메인의 권위에 의존하지 않아요. 9-axis cross-domain 딥리서치가 **세 backbone 에 대한 isomorphic 합의** 를 도출했고, 이 합의가 spec 의 first-principle 정당화 역할을 해요 (cross-axis isomorphism 4 짝은 부록 B).

#### Backbone 1 — **Lazy 3-tier hierarchy** (8/9 축 합의)

> *latency × frequency × capacity tradeoff* 를 동일 식으로 풀어낸 4 도메인의 강한 isomorphism: Anthropic Skills 3-level (harness §1.1) ↔ Denning working-set W(t,τ) (os §1.1) ↔ Hennessy-Patterson cache hierarchy AMAT (processor §1.1) ↔ Bellman DP overlapping subproblems (memoization §1.4).

3-tier 분할의 핵심은 **상위 tier 가 하위 tier 의 "summary + pointer" 역할** 을 한다는 점. 컨텍스트 비용은 *실제 reference 된* 항목에만 부과돼요.

| Tier | EG 어휘 | activation | 비용 모델 |
|---|---|---|---|
| macro | 도메인 governance (5-10 항목) — telos / boundary / cadence | always-on (system prompt) | prompt-cache stable prefix (harness §1.5 Aider) |
| mezzo | procedure (20-50 항목) — outbox validation / pre-send check 등 | metadata-gated — description 매칭 시 본문 로드 (harness §1.4 Cursor Agent Requested + OpenHands keyword trigger) | metadata only until activation |
| micro | atom (수백) — command / check / decision (sre §1.1 runbook-as-code) | event-driven — hook fire 시점에만 (path-scoped glob, harness §1.8 Copilot applyTo) | 매 이벤트마다 fork, LLM 토큰 0 |

8/9 축이 정확히 같은 결론을 다른 어휘로 도출했다는 사실 — Alexander pattern language network (humanities §1.11), SECI Ba 의 LLM context 재해석 (management §1.13), Chase-Simon chunking + Sweller cognitive load (psychology §1.3), CLOCK + lazy demand-fault-in (os §2.1), Wikipedia Summary Style (canonical §1.2), Google SRE 4-layer (Production Guide → PRR → Runbook → atom, sre §1.1) — 이 자체가 단일 도메인 권위 의존 회피의 직접 evidence 예요.

#### Backbone 2 — **Deterministic hook enforcement** (7/9 축 합의)

> fragile procedure (모델이 *판단* 으로 매번 기억해야 하는 작업) 를 lifecycle hook 의 결정적 실행으로 대체. *모델이 잊어도 시스템이 차단.*

Gollwitzer if-then implementation intention 의 d ≈ 0.65 효과 크기 (psychology §1.8) 의 결정적 발견 — **format 자체** 가 효과의 원천. 산문 형식 if-then 의 효과는 0, JSON schema 형식만 d ≈ 0.65. 이 발견이 WHO Surgical Safety Checklist (humanities §1.7) 의 11→7% complication 감소, Shingo poka-yoke 3 유형 (contact / fixed-value / motion-step, management §1.8) 의 무사고 quality, Google SRE runbook-as-code (sre §1.1) 의 incident MTTR 감소까지 동일 메커니즘으로 설명돼요.

EG 는 이미 Stop hook 1 종 (pre-send-probe + watcher rearm) 으로 *deterministic enforcement 의 우월성을 dogfood 검증* 했어요 — pre-send-inbound-check 의 cycle-end extension dogfood evidence. Greatpractice 는 이 검증된 인프라를 5-7 종 hook (SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop / PostCompact) 으로 확장해요. 단 humanities §1.7 Gawande 의 *60-90 초 fatigue budget* + canonical §1.5 의 *tiered strictness* (micro=bright-line, macro=soft norm) 를 동시 적용해야 hook 과잉 회피.

#### Backbone 3 — **Maturation gate** (5/9 축 합의)

> 1 회 발생 = raw memory (eager capture), 3 회 + 2 종 independent context + verifiable effect = draft (notability gate 통과), 4 회+ + phronesis 통과 + promote 승인 = ratified entry. *capture 는 즉시, promotion 은 지연* 의 단계별 deferral.

이 게이트가 *없으면* psychology §3.5 Schön reflection-in-action 의 황금 순간 capture (cost 0) 와 canonical §1.2 Wikipedia Notability gate (premature codification → overruling instability, humanities §4.1) 의 두 진영이 충돌해요. 둘 다 옳고 — 차이는 *시점*. 게이트가 둘을 시간축으로 분리해 줘요.

- *Capture* (memory 진입): 즉시. Schön 황금 순간 활용.
- *Promotion* (greatpractice tree 진입): notability + RRPV decay + phronesis-boundary 3 게이트 통과 후.

5 축 합성 결과 (humanities §1.12 Aristotle phronesis + canonical §1.2 Wikipedia + psychology §3.5 Schön + sre §3.2 toil rubric + processor §1.7 RRIP/BRRIP) 가 도출한 자연수치 — 3 회 + 2 종 + verifiable — 가 운영 직관 ("1회=raw / 3회=trigger / 4회+=reference only") 과 정확히 align 하지만, 단순 frequency 만으로는 부족하다는 점에서 정밀화돼요 (§5.1 multi-criteria score 참조).

### §1.4 What Greatpractice does NOT codify — phronesis boundary 개념

Aristotle *Nicomachean Ethics* Book VI 의 phronesis (φρόνησις) 와 Polanyi *The Tacit Dimension* (1966) 의 tacit knowing 명제 — *"어떤 종류의 실천 지식은 명시 rule 화 불가능"* — 는 Greatpractice 의 *positive scope* 정의만큼이나 *negative scope* (codify 하지 *말* 영역) 정의가 중요함을 알려줘요 (humanities §3.9).

모든 반복 작업을 hook 으로 잡으려는 시도는 두 가지 부작용을 일으켜요.

1. **Phronesis 위축** — agent 의 즉석 윤리·맥락 sensitivity 가 rule-following 으로 대체됨 (Aristotle NE VI). 결정 quality 가 평균은 올라도 *outlier 의 wisdom* (rare + high-context + judgement-heavy 결정) 이 사라져요.
2. **Polanyi limit** — *fully explicit knowledge 불가능* 이라는 원리적 한계. codify 된 explicit knowledge 도 internalization phase (SECI cycle 의 마지막, management §1.13) 없이는 작동 안 함.

따라서 Greatpractice 는 다음 조건이 *동시* 만족되는 작업만 codify 해요 (자세한 boundary 조건 + flag 발동 규칙은 §5.3 참조):

| 조건 | 정량 기준 (default) |
|---|---|
| **Frequency** (반복 빈도) | ≥ 3 회 발현 OR 동일 cluster 내 누적 N ≥ 5 |
| **Cost of missing** (누락 시 손실) | silent drop / 외부 협력 깨짐 / cross-reference 단절 등 *recovery cost > codify cost* |
| **Predictability of trigger** (트리거의 결정성) | hook event + matcher 로 mechanical 감지 가능 (in-action 또는 on-action 시점 명확) |

**Codify 하지 *말* 영역** (명시 exclusion, 부분집합 — 전체는 §5.3):

- *Rare* 결정 — 분기당 1 회 미만의 high-stakes choice (모듈 신설 / 새 협력자 합류 / 거버넌스 pivot). Hyperbrief §1 의 9-section IR 영역 — Greatpractice 가 *환기* 는 하지만 *결정 자체는 위임*.
- *High-context judgement* — 동일 trigger 가 context 별로 정반대 결정을 요구하는 작업.
- *Ethical/aesthetic 직관* — 톤 매칭 / pace-mode 조정 / 공개 redaction 판단 등. additionalContext inject 만 가능, hook 강제 차단 X.
- *Generative pattern induction* — 새 상황에서 새 패턴 도출 자체. Alexander 후기 비판 (humanities §4.9 — "패턴 *집합* 이 아니라 *generative process* 가 핵심") 의 직접 응용.

이 boundary 가 명시되지 않으면 Greatpractice 는 자기 무게로 무너져요 (humanities §4.6 + canonical §1.12 Wikipedia wiki-rot pattern). 따라서 frontmatter 의 `enforcement_level` 필드 (mandatory / recommended / advisory — §4.3 spec) 의 *advisory* 등급이 phronesis 영역의 명시 marker 역할을 해요 — 강제 차단 안 하고 reference inject 만 함으로써 agent 의 즉석 판단 능력을 보존.

요약하면, Greatpractice 는 **"반복 누락되는 부분만 codify, 나머지는 agent 의 운영 본능 + Hyperbrief 위임에 남김"** 의 명시적 boundary 위에 서 있어요. 이 boundary 자체가 `greatpractice/macro/codification-boundary.md` 의 첫 macro entry 후보 — 모듈의 self-referential governance.

---

## §2. Tier Hierarchy — macro / mezzo / micro

> macro·mezzo·micro 는 *latency × frequency × capacity* 의 동일 tradeoff 식 위에서 세 점을 찍은 결과예요. 9 축 딥리서치에서 8 축이 이 3-tier 분리를 universal convergence 로 도출 — 단일 도메인의 권위가 아니라 multi-domain isomorphism 이 backbone 의 정당화. 본 §는 그 tier 의 책임 분담, count 가이드, frontmatter density 차등, edit_policy 차등, INDEX cap, 그리고 부모-자식 graph topology 를 정의해요.

### §2.1 The 3-tier working set — 8/9 축 universal convergence

9 axis 딥리서치 (`harness · humanities · psychology · management · processor · os · sre · memoization · canonical`) 의 합성에서 본 tier 분리는 9 축 중 8 축이 동시 도출한 패턴이에요 (sre 는 4-layer 변형으로 등장 — 부록 B isomorphism 1 의 *isomorphic reduction* 으로 통합). 핵심 식은 동일:

> 상위 tier 는 *작고 항상 active*, 하위 tier 는 *크고 lazy on-demand*. 각 tier 는 하위 tier 의 **filtered summary + pointer** — 요청 빈도가 1-2 자릿수씩 줄어드는 만큼 latency 를 1-2 자릿수씩 늘려도 평균 cost 는 거의 변하지 않음.

| Greatpractice tier | 등가 도메인 prior art | 일차 정당화 |
|---|---|---|
| **macro** (always-on, ≤300 token cap) | harness §1.1 Level 1 metadata · processor §1.1 L1 · os §1.1 W(t,τ) inner-core · humanities pattern-language root · management §1.4 SECI Ba 핵 | always-resident, cache-line locality 의 최상위 |
| **mezzo** (metadata-gated, phase 진입 시 load) | harness §1.1 Level 2 SKILL.md body · processor §1.1 L2 · os §1.4 phase locality · canonical §1.2 article body | descriptor 만 항상 노출, 본문은 trigger 시 fault-in |
| **micro** (event-driven, hook trigger 시점에만) | harness §1.1 Level 3 bundled refs · processor §1.1 L3 + DRAM · sre §1.1 runbook atom · memoization §1.2 lazy materialization | atom 단위 executable, on-demand 만 cost |

핵심은 *tier 사이의 책임* 이 자연 식 (latency↑ ↔ frequency↓ ↔ capacity↑) 하나로 결정된다는 점 — 즉 어떤 entry 를 어느 tier 에 둘지는 *자의적 선택* 이 아니라 그 entry 의 (활성 빈도 × 호출 latency budget × 본문 크기) 가 결정해요.

부록 B isomorphism 1 (`harness §1.1 ↔ os §1.1 ↔ processor §1.1 ↔ memoization §1.4`) 의 4-축 합치가 이 식의 cross-domain robustness 를 보증해요.

### §2.2 Tier 별 책임 분담 + count 가이드

각 tier 의 *책임 + 개수 가이드 + 본문 규모* 를 명시. count 는 hard cap 이 아니라 **운영 sanity 신호** — 초과 시 자동 분류 재검토 (`humanities §1.7` Gawande 의 5-7 killer items 제약 + `sre §4.3` checklist bloat 함정 합성).

| Tier | 책임 | 권장 개수 | 본문 규모 | 활성 비용 |
|---|---|---|---|---|
| **macro** | 워크스페이스 도메인 거버넌스 — ratio rule, telos, 절대 원칙 (자율 실행, 페이스, redaction boundary 등) | **5-10** | 1 entry ≤ 30-50 줄 lead + summary only | always-on, prompt cache stable prefix |
| **mezzo** | phase / 모듈 / scope 안의 procedure — 대부분의 운영 패턴이 여기 (outbox-json-validation, pre-send-probe, n-way-sync-registry 등) | **20-50** | 1 entry 80-300 줄 (canonical §1.12 9-section schema full) | descriptor (≤200 token) 만 메타로, 본문은 trigger 시 |
| **micro** | atom = command / check / decision (sre §1.1) — 1-2 step executable + 단일 hook payload | **수백** (현실적으로 50-300) | 1 entry ≤ 30 줄, frontmatter + atom body | hook fire 시점에만 load, 평소 zero cost |

#### macro count 5-10 의 근거

`harness §1.1` Skills metadata 의 1536 char 캡 + `processor §1.1` L1 의 32-64 KB + `humanities §1.7` Gawande 5-7 killer items + `management §1.10` Wikipedia 5 pillars 의 *동일 자릿수* 합치. 10 초과 시 always-on 토큰 인플레이션 (harness §4.1 macro bloat) + Gawande fatigue budget 위배.

#### mezzo count 20-50 의 근거

`canonical §1.2` Wikipedia article 의 *active corpus* 통계 (워크스페이스급 운영 manual 의 자연 규모) + `os §1.8` Linux active list 의 working-set 추정 크기. 50 초과 시 mezzo 가 *de facto macro* 가 되거나 (descriptor 토큰 자체가 macro 비용 초과) tier 분류 오류.

#### micro count 수백의 근거

`sre §1.1` 운영 runbook atom 의 자연 규모 + `processor §1.1` L3 의 4-64 MB capacity. count cap 없음 — `class` 별 (§2.6 의 slab-style grouping) 분리 + lazy load 라 working-set 비용 zero.

### §2.3 Tier ↔ frontmatter density mapping

(부록 A Cluster A vs Cluster C 의 가린 contradiction 해소 — *completeness vs fatigue budget* 의 tier 별 차등. §3.3 의 tier-conditional field 와 일관.)

`management §1.1` 의 fixed 10-field schema + `canonical §1.5` 9-section schema 는 *full schema* 의 ceiling 이지만, 모든 tier 에 full 강제 시 micro 가 atom-크기 (1-2 step) 인데 frontmatter 가 본문보다 큰 *schema overhead inversion* 발생. tier 별 차등 적용:

| Field | macro | mezzo | micro |
|---|---|---|---|
| `tier` | ✓ | ✓ | ✓ |
| `description` (≤200 token) | ✓ | ✓ | ✓ (≤80 token) |
| `enforcement_level` | ✓ | ✓ | ✓ |
| `edit_policy` | ✓ owned | ✓ owned | ✓ ownerless (§2.4) |
| `trigger.if / trigger.then` | — | ✓ | ✓ (필수) |
| `paths` (glob) | — | ✓ | ✓ |
| `parent` | — | ✓ (→ macro) | ✓ (→ mezzo) |
| `ratio / obiter / illustration` | ✓ (binding rule) | ✓ | — (atom 만) |
| `evidence-quality × recommendation-strength` | ✓ | ✓ | — (atom 은 deterministic) |
| `maturity` (Dreyfus) | ✓ | ✓ | — |
| `lifecycle: probation/consolidation/automatic` | — | ✓ | ✓ |
| `rrpv` (default 2) | — | ✓ | ✓ |
| `class: persistent/session` | ✓ persistent | ✓ persistent | mixed |
| `coherence: strict/soft/none` | strict | soft (default) | soft |
| `trigger_source` enum | — | ✓ | ✓ |
| `last_referenced_turn` | — | ✓ | ✓ |
| `last_validated_at / freshness_until` | ✓ (180일) | ✓ (90일) | ✓ (30일) |
| `supersedes / superseded_by` | ✓ | ✓ | ✓ |
| `surfaces: []` (N-way sync) | ✓ | ✓ | — (atom 단일 surface) |
| `hash / deps` | — | optional | ✓ (memoization) |
| `9-section body schema` | lead + summary only | full | — (atom body) |

**핵심 결정**:
1. macro 는 *binding rule 명시* 가 본질 (humanities §1.1 ratio/obiter) — frontmatter 가 비교적 가벼움 + 본문 lead 가 SSoT.
2. mezzo 는 *full schema* — 운영 procedure 의 거버넌스 axis 전부 호스팅 (Cluster C 9/9 universal).
3. micro 는 *atom-크기 frontmatter* — trigger + executable 만. frontmatter 가 본문보다 길지 않음.

### §2.4 Tier ↔ edit_policy mapping

(부록 A 의 ownerless community-wiki vs owner-stamped contradiction 의 tier 별 default.)

`canonical §1.9` 의 SO Community Wiki + `sre §1.4` 의 surface owner 강제 + `management §1.7` 의 catchball negotiation 의 합성. drift cost 와 update 빈도가 tier 별로 다르므로 default 도 달라야 해요.

| Tier | edit_policy default | 정당화 | 변경 절차 |
|---|---|---|---|
| **macro** | `owned` (워크스페이스 owner = EG-maintainers) | drift cost 매우 높음 (워크스페이스 telos 차원), update 드묾 | 명시 approval + Hyperbrief 4-score escalation 권장 |
| **mezzo** | `owned` (작성 agent + maintainer 공동) | drift cost 중간, update 분기당 1-2 회 | maturation gate 통과 후 commit (§5 promotion 경로) |
| **micro** | `ownerless` (community-wiki-like) | update 빈번 + 실수 비용 낮음 + lint 가 정합성 강제 | any agent 가 직접 update, schema lint 만 통과하면 OK |

**Lint 강제**: `(tier ↔ edit_policy)` 정합성 검증을 `eg_greatpractice_lint.cjs` 가 PreToolUse hook 으로 차단. 예: `tier: macro` + `edit_policy: ownerless` = exit 2.

**예외 경로**:
- macro 도 *명시적 catchball* (maintainer 또는 multi-agent 합의) 후엔 ownerless transition 가능 — `supersedes:` field 로 history 보존 (§7.4 cost-tiered revision).
- micro 도 *fragility: high* + critical workflow 면 owned override 가능 — `enforcement_level: mandatory` 와 짝.

### §2.5 INDEX.md 의 ≤300 token cap + auto-generation

`harness §1.1` Skills metadata 의 1536 char 캡 (~384 token) + `aider §1.5` read-only stable prefix 의 prompt cache 최적화 + `cline §1.6` Memory Bank 의 계층적 dependency flow 의 합성 — Greatpractice 트리의 *always-on entrypoint* 는 INDEX.md 단 하나.

#### Cap 정의

- **Hard cap**: ≤300 token (≈1200 char). prompt cache stable prefix 영역.
- **구조**: macro entry 별 1-3 줄 + mezzo top-level scope 별 1 줄 + micro 는 count 만.
- **버전 stamp**: tree 의 `manifest.json` hash 의 첫 8 char — index 와 tree 의 *coherence 검증* (memoization §1.1 content-addressed).

#### Auto-generation 규칙

INDEX.md 는 직접 손으로 수정 X — `eg_greatpractice_lint.cjs` 가 tree walk 후 frontmatter 추출 → 자동 build. PostToolUse hook (`Write|Edit` matcher on `greatpractice/**/*.md`) 이 every mutation 후 INDEX 재생성. (build script 의 implementation 상세는 §12.4 참조.)

```yaml
# 자동 생성 결과 예시
version: gp-v0.1.0 (manifest: a7c3f9d2)
macro:
  - communication-discipline: A2A + outbox + redaction (binding)
  - release-cadence: meaningful push → version + CHANGELOG (MUST)
  - workspace-cleanliness: inner-outer split + agent-local gitignore
  - decision-flow: autonomous default + 4-score escalation
  - codification-boundary: phronesis NOT-codify scope
mezzo (scope → count):
  - communication/* (8)
  - release/* (5)
  - workspace/* (3)
  - decision/* (4)
micro: 47 atoms (hook-callable)
```

#### 초과 시 처리

300 token 초과 = lint error exit 2. macro entry 압축 또는 mezzo scope 통합 필요 (slab class 통합, §2.6 참조).

### §2.6 부모-자식 graph topology

`humanities §1.4` Alexander pattern language network + `canonical §1.4` Wikipedia summary-style hatnote + `os §1.15` SLUB slab class grouping + `processor §1.11` MESI coherence 그래프의 합성.

#### Tree edge 의 4 종 분류

| Edge 종류 | 방향 | 용도 | 예시 |
|---|---|---|---|
| `parent` (강 edge) | child → 1 parent | hierarchical containment | `outbox-json-validation` (mezzo) → `communication-discipline` (macro) |
| `composes` (약 edge) | parent → N children | atom 호출 chain | `pre-send-inbound-check` (mezzo) → `inbox-cursor-probe` (micro) |
| `supersedes` (시간 edge) | new → old | 진화 history DAG | `pre-send-probe-v2` → `pre-send-probe-v1` |
| `related` (peer edge) | A ↔ B | cross-reference (pattern language) | `outbox-json-validation` ↔ `n-way-sync-registry` (둘 다 PreToolUse) |

#### Topology 규칙

1. **Single parent invariant**: 모든 mezzo 는 정확히 1 macro 부모, 모든 micro 는 정확히 1 mezzo 부모. 부모 없는 mezzo/micro = lint error (orphan).
2. **No cross-tier cycle**: parent edge 의 transitive closure 가 acyclic. lint 가 cycle 검출 후 exit 2.
3. **`related` edge 는 free-form network**: peer-to-peer, count 제한 없음. Alexander pattern language 의 호출 chain (humanities §1.4) 처럼 weak coupling.
4. **`supersedes` chain**: 마지막 active entry 만 default load, 이전 version 은 `_archive/` 로 이동 (§7.6 cold eviction). cross-reference 보존을 위해 redirect stub 유지 (canonical §1.3).
5. **Slab grouping**: 같은 schema 의 micro atom (예: *모든 PreToolUse hook atom*) 은 같은 `class:` field 로 표시 — load/lookup locality 활용 (`os §1.15`).

#### Visualization

```
┌──────────────── INDEX.md (≤300 token, always-on) ────────────────┐
│                                                                  │
│    macro: communication-discipline | release-cadence | ...       │
│      │                                                           │
│      ├─ parent ───→ mezzo: outbox-json-validation                │
│      │                │                                          │
│      │                ├─ composes ───→ micro: outbox-append-roundtrip │
│      │                ├─ composes ───→ micro: outbox-server-ack-probe │
│      │                └─ related   ←──→ mezzo: pre-send-inbound-check │
│      │                                                           │
│      ├─ parent ───→ mezzo: pre-send-inbound-check                │
│      │                ├─ composes ───→ micro: inbox-cursor-probe │
│      │                └─ composes ───→ micro: meaningful-surface-classify │
│      │                                                           │
│      └─ parent ───→ mezzo: n-way-sync-registry                   │
│                       └─ composes ───→ micro: version-badge-bump │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

이 topology 가 §2.5 의 INDEX.md auto-generation 입력이자 §5 promotion/maturation gate 의 ratification path, §4 hook lifecycle 의 routing graph 의 동일 자료구조예요 — 한 tree 가 *모든 동적 동작* 의 SSoT.

---

## §3. Entry Schema — frontmatter as governance SSoT

> Frontmatter 가 거버넌스 SSoT 예요. 9/9 축 universal convergence + tier 별 density 차등 + multi-criteria maturity score 로 *한 schema 정의가 9 축의 모든 패턴을 동시 활성화* 하는 single largest lever 가 되도록 설계해요. Lint scope 는 v0.1 mandatory 7 field 로 좁히고 나머지는 placeholder/null 로 두는 *progressive activation* 정책이에요.

### §3.1 9-axis universal convergence 정당화

Greatpractice entry 는 본문보다 *frontmatter 가 먼저* 일을 해요. lint, hook fire, working-set load, deprecation queue, SSoT propagation, voice check — 모두 frontmatter 의 정형화된 field 를 input 으로 받아 동작해요. 즉 본문이 "사람이 읽는 surface" 라면 frontmatter 는 "시스템이 작동하는 surface" 예요.

본 합의는 9 축 *전부* 가 도출한 universal convergence 예요 (부록 A Cluster C):

| 축 | 기여 field | 핵심 정당화 |
|---|---|---|
| harness | tier · trigger_type · fragility · parent (Anthropic Skills `paths:` glob + tier-trigger-fragility-metadata) | progressive disclosure 의 3 level 이 frontmatter 로 표현 |
| humanities | binding · evidence_quality · recommendation_strength (Stare Decisis ratio/obiter + GRADE 2-axis) | binding rule vs advisory 분리 + 확실성 × 강제력 별도 축 |
| psychology | maturity · created_at · last_triggered · miss_count (Dreyfus + Lally 66일) | entry 의 verbosity 자동 조절 + lifecycle stage |
| management | last_reviewed · supersedes · superseded_by · kaizen_baseline_since (AAR 10-field schema + TPS) | "표준 = kaizen baseline ≠ 박제" 의 진화 history graph |
| processor | rrpv · trigger_source · 3C miss diagnostic counters (RRIP + SHCT + 3C grid) | reuse prediction + 출처 attribution |
| os | last_referenced_turn · class (Denning working set + persistent vs session split) | backward-window working set + swappiness 등가 |
| sre | feedback-3field-gate · blameless 4-section · last_validated_at · validation_cadence_days | trigger codification + surface owner + staleness probe |
| memoization | hash · deps (Bazel/Nix content-addressed + dependency-tracked invalidation) | content-addressed identity (v0.2+) |
| canonical | 9-section fixed schema · edit_policy · freshness_until · freshness_axis | canonical entry schema + dual-mode edit + revisit cadence |

정확히 같은 결론을 모든 도메인이 도출했어요: *frontmatter 가 거버넌스 SSoT*. 단일 도메인의 권위에 의존하지 않는 multi-domain 증거 9/9.

추가로 *normative* 정당화 backfill (Clark-Chalmers 1998 *coupling condition* — reliable + accessible + automatically endorsed) 이 *왜 이 field 들인가* 의 본질을 잡아줘요 (부록 B §B.5). reliable = `evidence_quality` + `validation_cadence_days`, accessible = `tier` + `surfaces[]`, automatically endorsed = `binding` + `enforcement_level`. 즉 frontmatter 는 *외부 인지 자원이 mind 의 일부로 인정되기 위한 3 조건* 의 instrumentation 이에요.

### §3.2 v0.1 mandatory fields (lint scope = 7 필드)

v0.1 cut 의 *block-level* lint 는 다음 7 필드만 강제해요. 나머지는 warning (block X) 으로 6-cycle migration grace period (§3.8). retro-backfill 시 점진 migration 허용이 목적이에요.

**Lint-required 7 fields**: `id`, `tier`, `binding`, `enforcement_level`, `trigger`, `lifecycle`, `last_referenced_turn`.

선정 근거 — 이 7 필드가 *hook fire 의 minimum input* 이에요. 다른 모든 field 없이도 (a) entry identification (`id`), (b) tier-conditional loading (`tier`), (c) binding vs advisory 분리 (`binding`), (d) enforcement 강도 결정 (`enforcement_level`), (e) hook fire condition (`trigger`), (f) lifecycle stage gating (`lifecycle`), (g) backward-window eviction (`last_referenced_turn`) 가 가능. 나머지는 optional governance 정밀화.

**완전한 YAML schema example** (mezzo tier — outbox-json-validation 의 ratified entry):

```yaml
---
# === v0.1 lint-required (block on missing) ===
id: outbox-json-validation
tier: mezzo                          # macro | mezzo | micro
binding: ratio                       # ratio (binding rule) | obiter (advisory) | illustration
                                     # humanities §1.1 Stare Decisis
enforcement_level: mandatory         # mandatory (PreToolUse exit 2) | recommended (warn) | advisory (inject)
                                     # management §1.10 Wikipedia 5 pillars + IAR escape
trigger:
  if: "outbox.jsonl 에 append 직전"
  then: "scripts/eg_outbox_push.cjs 경유 + JSON.stringify + roundtrip parse 검증"
  format: json-schema                # psychology §1.8 — format 자체가 d≈0.65 효과
  source: stop-hook                  # processor §1.8 SHCT trigger_source enum
                                     # ∈ {stop-hook, a2a-inbound, user-pivot, hyperbrief,
                                     #    autonomous, post-incident, retro-backfill}
lifecycle: probation                 # probation (0-30일) | consolidation (30-90일) | automatic (90+일)
                                     # psychology §1.10 Lally 66-day model
last_referenced_turn: 2026-06-04T10:00:00Z    # os §1.1 Denning backward-window

# === v0.1 lint-warn (warn on missing, 6-cycle grace) ===
title: Outbox JSON Validation Discipline
slug: outbox-json-validation
created_at: 2026-06-04T10:00:00Z
source_evidence:                     # 어떤 raw evidence 로부터 promote 됐는지
  - memory/feedback_outbox_json_validation.md
  - reports/2026-06-04-greatpractice-research/axes/sre.md#1.1

# === GRADE 2-axis (humanities §1.5) ===
evidence_quality: high               # high | moderate | low
recommendation_strength: MUST        # MUST | SHOULD | MAY

# === Multi-criteria maturity (canonical 정의: §5.1) ===
maturity_score:
  frequency: 3
  depth: 4
  recency: 5
  cost: 4
  predictability: 5
  # threshold = sum ≥ 18 OR (frequency ≥ 3 AND independent_triggers ≥ 2 AND verifiable_effect)
  # 자세한 5-axis weighted-sum 공식 + threshold + axis 의미 = §5.1

# === Lifecycle cadence (sre §1.6 + canonical §1.11 — 상세 §7) ===
last_validated_at: 2026-06-04T10:00:00Z
validation_cadence_days: 90          # micro=30 / mezzo=90 / macro=180 (§7.2 default)
freshness_until: 2026-09-02T10:00:00Z         # auto-derived: last_validated_at + cadence
freshness_inherits_from: null                 # §7.5 — derived 일 때 master id

# === Coherence + ownership (§8.4 + §2.4) ===
coherence: strict                    # strict | soft | none — processor §1.11 MESI (default=soft)
edit_policy: owned                   # ownerless (micro default) | owned (mezzo/macro default)
owner: EG-maintainers                # owned 일 때만 (canonical §1.9)
audit_trail:                         # ownerless 의 vandalism 방어
  - {ts: 2026-06-04T10:00:00Z, agent: claude-opus-4-7, action: promote, prev_hash: null}

# === Evolution (§3.4 참조) ===
supersedes: []
superseded_by: null
kaizen_baseline_since: 2026-06-04
revision_history:
  - {ts: 2026-06-04T10:00:00Z, type: created, by: claude-opus-4-7, cost_tier: null}
    # cost_tier ∈ {distinguish, per-incuriam, overrule} — humanities §1.2, §7.4

# === SSoT propagation (§8 참조) ===
surfaces:
  - {kind: skill, path: plugins/greatpractice/skills/outbox-emit-schema-check/SKILL.md, inherits_freshness: true}
  - {kind: hook, path: .claude/settings.local.json#hooks.PreToolUse[outbox], inherits_freshness: true}
  - {kind: memory_stub, path: memory/feedback_outbox_json_validation.md, inherits_freshness: false}

# === Tier hierarchy (mezzo 이상 필수, §3.3 참조) ===
parent:
  - greatpractice/macro/communication-discipline.md
children:
  - greatpractice/micro/outbox-append-json-roundtrip.md
  - greatpractice/micro/eg-outbox-push-cjs.md

# === Phronesis boundary marker (§5.3) ===
phronesis_boundary: false            # true = codify 금지, inject reference context only

# === Class split (os §1.11) ===
class: persistent                    # persistent (cross-session) | session (single-session)

# === v0.2+ deferred (§3.7 참조 — v0.1 = null/0 placeholder) ===
hash: null                           # BLAKE3(canonical_body) — memoization §1.8
deps: []                             # 의존 entry hash 목록
rrpv: 2                              # processor §1.7 — 0=immediate evict, 3=long-protected
miss_count:                          # processor §3.8 3C grid
  compulsory: 0
  capacity: 0
  conflict: 0
  coherence: 0
---
```

v0.1 lint 정책 요약: 위 7 필드는 *block* (exit 2), 그 외 schema 정의 field 는 *warn*, schema 미정의 unknown field 는 *strict mode 에서만 warn* (default off). 6-cycle migration grace period (§3.8) 이후 lint scope 점진 확장.

### §3.3 Tier-conditional fields (mezzo-required / macro-required)

부록 A Cluster A vs Cluster C 의 가린 contradiction 해소 — lazy 3-tier hierarchy 는 *대부분 entry 가 컨텍스트 밖에 있어야 cost 효율* 이 핵심인데, frontmatter-driven 은 *모든 entry 가 풍부한 metadata 보유* 가 핵심이라 둘이 충돌해요. tier 별 frontmatter *밀도 차등* (§2.3) 으로 해소.

**Tier 별 schema 강도**:

| Tier | 필수 field 수 | 권장 분량 | 정당화 |
|---|---|---|---|
| micro (atom) | 4 field (`id`, `tier`, `trigger`, `source_evidence`) | ≤30 줄 / ≤500 chars | runbook atom = command/check/decision 1-2 필드 only (sre §1.1) |
| mezzo (procedure) | 7 lint-required + mezzo-required (binding, enforcement_level 등) | 80-200 줄 / 3-8KB | 9-section full schema (canonical §1.12) |
| macro (governance) | mezzo 전체 + macro-required (parent, children, telos 연관) | 100-300 줄 / 5-12KB | ratio rule + 자식 노드 graph topology |

**mezzo-required (micro 와 비교 시 추가 필수)**:
- `binding`, `enforcement_level`, `evidence_quality`, `recommendation_strength` — 강제력 결정에 필수
- `lifecycle`, `last_validated_at`, `validation_cadence_days` — freshness probe 대상
- `edit_policy`, `owner` (if owned) — vandalism 방어
- `surfaces[]` — SSoT propagation 의 derived view enumeration

**macro-required (mezzo 와 비교 시 추가 필수)**:
- `parent: []` (또는 root 표시) + `children: []` — tier hierarchy 의 부모-자식 graph topology
- `telos_alignment` — AGENTS.md §5 의 5 telos 중 어디 정렬 (root 노드 `_telos.md` 의 source)
- `coherence: strict` (default macro) — multi-agent 합류 시 broadcast 대상

**micro-permissive (위 모든 field optional)** — atom 의 본질은 executable form 이라 governance metadata 가 *대부분 부재* 가 정상. 단 `tier: micro` 만으로 lint 의 *micro-permissive mode* 진입 → 위 field 누락이 warning 도 아닌 *silent* 처리.

**INDEX.md ≤300 token cap** — macro tier 의 frontmatter 가 풍부해질 위험을 INDEX.md 의 ≤300 token chunk summary 로 격리 (§2.5 + canonical §1.4 Summary Style). frontmatter 풍부 + 본문 minimal + INDEX 압축 의 3-layer 분리가 contradiction 의 진짜 해소.

### §3.4 Evolution fields (supersedes / superseded_by / revision_history + cost_tier vocabulary)

Entry 는 *진화* 해요. humanities §1.2 의 3-tier cost vocabulary (distinguish < per-incuriam < overrule) 가 *어느 revision 인지 명시* 해야 cost 인식이 사라지지 않아요 (humanities §4.1 의 overruling instability cascade 회피). cost-tier 의 의미적 spec (어떤 상황에서 어느 tier 적용) 은 §7.4 가 canonical — 본 §은 frontmatter 표기 형식만 다뤄요.

**revision_history 형식**:

```yaml
revision_history:
  - {ts: 2026-06-04T10:00:00Z, type: created, by: claude-opus-4-7, cost_tier: null}
  - {ts: 2026-06-15T11:23:00Z, type: revised, by: claude-opus-4-7, cost_tier: distinguish,
     reason: "외부 A2A 응답 대기 중인 turn 에서만 strict mode 적용", supersedes_internal: false}
  - {ts: 2026-07-01T09:00:00Z, type: revised, by: claude-opus-4-7, cost_tier: per-incuriam,
     reason: "JSON.stringify 의 BigInt 처리 누락 발견 — 부분 무효", supersedes_internal: true}
```

**supersedes / superseded_by 의 DAG 무결성** — `eg_greatpractice_lint.cjs` 가 graph cycle 검출 + dangling reference 차단. management §1.3 TPS supersedes graph 의 EG instantiation.

**kaizen_baseline_since** — TPS 의 *"표준 = kaizen baseline ≠ 박제"* 명제 (management §1.3) 의 frontmatter marker. 이 timestamp 이후 *어떤 revision* 이 발생했는지가 *practice 의 살아있음* 의 증거. 6 개월 이상 변경 없으면 stagnation candidate (단순 stable 일 수도 있으므로 *warn only*).

### §3.5 SSoT propagation fields (surfaces[] + freshness_inherits_from)

부록 A Cluster H 의 4 축 합의 — canonical → derived N-way sync. 현 EG 의 가장 빈번한 violation (16× docs/promo sync miss) 의 architectural 해법이에요. AGENTS.md §5.8 N-way sync 등록부의 *entry-level inversion* (자세한 inversion 의미 + surface kind taxonomy = §8).

**surfaces[] frontmatter 형식**:

```yaml
surfaces:
  - kind: skill
    path: plugins/greatpractice/skills/outbox-emit-schema-check/SKILL.md
    inherits_freshness: true                 # master 의 freshness 자동 상속
    coherence: strict                         # surface 별 coherence override 가능
  - kind: hook
    path: .claude/settings.local.json#hooks.PreToolUse[outbox]
    inherits_freshness: true
  - kind: memory_stub
    path: memory/feedback_outbox_json_validation.md
    inherits_freshness: false                 # stub 은 별도 lifecycle (redirect 만)
  - kind: docs-badge
    path: docs/shared/data.js#practices.outbox_validation.version
    inherits_freshness: true
  - kind: plugin-json
    path: plugins/greatpractice/.claude-plugin/plugin.json
    inherits_freshness: true
```

**Surface kind taxonomy** (v0.1): 5 종 — `skill`, `hook`, `docs-badge`, `memory_stub`, `plugin-json`. 자세한 각 kind 의 propagation 메커니즘 + 첫 dogfood 예시 = §8.3.

**freshness_inherits_from** — Cluster F (freshness cadence) 와 Cluster C (frontmatter SSoT) 의 가린 contradiction 해소. derived surface 가 master 의 freshness 상속 시 `inherits_freshness: true` + 별도 `last_validated_at` 부재. 단 *cross-source 통합* 인 derived (예: 여러 entry 가 같은 docs 페이지 공유) 는 별도 validation 필요 — `inherits_freshness: false`. 자세한 inheritance rule = §7.5.

**lint 검증** — `eg_surfaces_check.cjs` 가 `PostToolUse(Edit | Write)` 에서 fire. (a) master 가 변경됐는데 surfaces[] 의 inherits_freshness=true 표면이 갱신 안 됨 → warn, (b) surfaces[] 의 표면 path 가 존재 안 함 (dangling) → block.

### §3.6 Multi-criteria maturity_score field — cross-ref to §5.1

`maturity_score` 의 5-axis weighted-sum 공식, axis 의미 (frequency / depth / recency / cost / predictability), threshold (sum ≥ 18 OR notability 3-criterion), `independent_triggers` 의 3-axis 좌표 정의, `verifiable_effect` 의 정량 정의 — 모두 **§5.1 (Maturation Gate) 가 canonical**. frontmatter 표기는 위 §3.2 의 example 참조.

§5.1 의 다섯 axis (0-5 scale) 가 그대로 frontmatter 의 `maturity_score.{frequency, depth, recency, cost, predictability}` 5 sub-field 에 매핑. promote 시점에 lint 가 (a) 5 axis 모두 정량 (0-5 integer) populate 됐는지, (b) threshold 통과 여부, (c) `phronesis_boundary: true` 시 자동 _propose/ 잔류 검증.

### §3.7 V0.2+ deferred fields (hash, deps, rrpv, miss_count)

v0.1 cut 에서는 *placeholder* (null/0/[]) 로 schema 에 존재시키되 *runtime 동작 비활성*. v0.2+ 의 자동화 진입 시점에 active.

**Deferred field 목록**:

| Field | v0.1 default | v0.2+ 활성 시 동작 | 출처 |
|---|---|---|---|
| `hash` | `null` | BLAKE3(canonical_body) — content-addressed identity | memoization §1.8 (Bazel/Nix) |
| `deps` | `[]` | 의존 entry hash 목록 — fine-grained invalidation | memoization §1.5 (MobX reactivity + Bazel) |
| `rrpv` | `2` | 신규 entry default rrpv=2 (1 회 사용 시 → 1), 0=immediate evict | processor §1.7 RRIP/BRRIP |
| `miss_count` | `{compulsory: 0, capacity: 0, conflict: 0, coherence: 0}` | 3C grid 카운터 자동 누적 + 처방 mapping | processor §3.8 |
| `working_set_tau` | `null` (수동) | backward-window τ 자동 tuning (50 turn baseline → miss rate 기반 조정) | os §1.1 + processor §3.4 |
| `phase_tag` | `null` | release / docs / A2A / refactor 자동 derive | processor §1.10 + os §1.4 |
| `trigger_source_stats` | `null` | SHCT 통계 — trigger_source enum 별 hit-rate 누적 | processor §1.8 (SHCT signature-history) |

**왜 placeholder 유지** — v0.2 진입 시 schema migration 비용 0. 기존 entry 가 *forward-compatible* 하게 frontmatter 보유. Polanyi limit (humanities §1.8) 의 instantiation — *full explicit 불가능* 하지만 *progressive activation* 으로 점진 explicit 확장.

**v0.3+ 의 더 deferred** — Dreyfus `maturity: novice/competent/expert` 의 adaptive verbosity, MESI `coherence` 의 broadcast invalidate 실행, TAGE multi-scale confidence predictor. 이들도 v0.1 schema 에 field 존재 (`coherence: strict | soft | none`) 하지만 runtime 동작은 multi-agent residency 진입 후 활성.

### §3.8 Lint policy (block vs warn) + migration grace period

**Lint level 분류** (`eg_greatpractice_lint.cjs` 의 3-level severity):

| Level | 동작 | 적용 대상 |
|---|---|---|
| **block** | exit 2 차단 — 해당 entry 가 working-set 진입 불가 | §3.2 lint-required 7 field 누락 / DAG cycle / dangling supersedes |
| **warn** | stderr 메시지 + working-set 진입 허용 | mezzo/macro-required 누락 / schema-defined field 의 enum 위반 / surfaces[] dangling path |
| **silent** | 메시지 X / 진입 허용 | micro tier 의 mezzo-required 누락 / v0.2+ deferred field 의 placeholder 누락 |

**Migration grace period (6 cycle)** — 기존 11 memory feedback (`memory/feedback_*.md`) 의 retro-backfill 비용 분산. 6 cycle = 약 3-6 주 추정. 그 동안 lint 의 *warn-only mode* (block 비활성) 로 운영, grace 종료 후 block 활성.

**Grace period 진행 monitoring**:

```bash
# eg_greatpractice_lint.cjs --report
# 출력 예시:
# [grace cycle 3/6]
#   block-level violations: 0 (none)
#   warn-level violations: 17
#     - feedback_outbox_json_validation: missing surfaces[]
#     - feedback_pre_send_inbound_check: missing maturity_score
#     ...
#   silent-level: 38 (suppressed)
#   migration progress: 5/11 feedback ratified, 4/11 _propose/, 2/11 raw
```

**Block 활성 trigger** — 6 cycle 경과 OR migration progress ≥ 90% OR maintainer explicit toggle 중 하나. 자동 활성 후 첫 block 발생 시 *one-time grace* (해당 entry 에 24 시간 추가 유예).

**Unknown field 정책** — schema 정의 외 field 는 default silent (forward compatibility), `--strict` flag 시 warn. v0.2+ schema 확장 시점에 strict 도 기본 enable.

**Hook block 메시지의 voice-check** (Cluster B ∩ Cluster E contradiction 해소) — lint block 메시지 자체가 §6 의 voice-check 통과 필수. self-defensive 톤이면 entry 본문은 blameless 인데 enforcement surface 가 cascade 를 유도하는 self-contradiction 발생. 자세한 voice-check 규율 = §6.

---

> §3 의 핵심 — frontmatter 는 *시스템이 작동하는 surface*. 9/9 축 universal convergence 가 *왜 frontmatter 인가* 의 empirical 정당화, Clark-Chalmers coupling condition 이 *왜 이 field 들인가* 의 normative 정당화. v0.1 의 7-field lint scope 가 minimum viable, 나머지는 progressive activation. tier 별 density 차등으로 lazy hierarchy 와의 contradiction 해소, multi-criteria maturity score (§5.1) 로 가짜 frequency 합의 해소, surfaces[] (§8) 로 SSoT propagation, cost_tier vocabulary (§7.4) 로 진화 cost 가시화. 다음 §4 (hook mechanism) 가 본 schema 의 trigger field 를 consume 해요.

---

## §4. Hook Mechanism — deterministic enforcement

> Hook 정의는 산문이 아닌 JSON schema — psychology §1.8 Gollwitzer implementation intention 의 핵심은 *format 자체의 효과 (d≈0.65)* 예요. 같은 정보를 줄글로 풀어쓰면 strategic automaticity 가 사라지고, if-then schema 로 정형화할 때만 신경학적으로 자동 fire 가 가능. §4 는 이 명제를 7 hook event taxonomy + JSON Schema DSL + tiered strictness + fatigue budget + voice-check coupling 의 5 layer 로 instrumented 해요. §3.2 frontmatter mandatory 7 필드 중 `trigger.if/then` 이 본 §4 의 hook spec 으로 직접 materialize 되고, §5 maturation gate 가 enforcement_level 격상 결정의 input 이 돼요.

### §4.1 7 hook event 책임 분담

Claude Code lifecycle 의 6 event (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, PostCompact) 에 PreToolUse 의 3 subtype (poka-yoke contact / fixed-value / motion-step — management §1.8 Shingo *Zero Quality Control*) 을 합성하면 **7 hook event taxonomy** 가 나와요. 각 event 의 책임은 부록 A cross-axis convergence cluster 에서 도출:

| Event | 책임 | 패턴 cluster | 기본 enforcement |
|---|---|---|---|
| **SessionStart** | (a) bridge alive 확인 + dead 시 respawn, (b) macro tier auto-inject (INDEX.md + telos), (c) language confirm | Cluster A (lazy hierarchy ignition) | **blocking** — bridge alive 전까지 모든 tool 차단 |
| **UserPromptSubmit** | (a) keyword × path_scope 교집합 매칭 → 관련 mezzo 의 additionalContext inject, (b) state-change 발화 시 outbound A2A 동반 detect | Cluster G (trigger-source) + harness §1.7 | inject only (advisory) |
| **PreToolUse(contact)** | poka-yoke type 1 — content validation. tool input 의 schema 검증 (예: outbox.jsonl append 시 valid single-line JSON + `eg_outbox_push.cjs` 경유 강제) | Cluster B + management §1.8.1 | enforcement_level 따라 (mandatory=exit 2 / recommended=warn / advisory=inject) |
| **PreToolUse(fixed-value)** | poka-yoke type 2 — count/threshold. 특정 정합성 카운트 미달 시 fire (예: `git push` 직전 surfaces[] N-way sync 모두 갱신 검증) | Cluster B + management §1.8.2 | 동상 |
| **PreToolUse(motion-step)** | poka-yoke type 3 — sequence. 규정된 순서 위반 detect (예: outbound emit 의 probe → read-if-needed → emit → cursor-advance 순서) | Cluster B + management §1.8.3 | 동상 |
| **PostToolUse** | (a) SSoT propagation diff (canonical §1.11) — surfaces[] 의 갱신 누락 후행 검출, (b) reproducibility self-audit (v0.2+) | Cluster H + memoization §3.6 | warning |
| **Stop** (cycle-end) | (a) inbox cursor probe + meaningful inbound surfacing, (b) watcher rearm, (c) freshness probe scan, (d) hook fire 통계 누적 (v0.2+), (e) working-set rotation (v0.2+) | Cluster A + F + I | **blocking** (기존 Stop hook 확장) |
| **PostCompact** | 활성 macro/mezzo entry 재invoke — compact 후 working-set 복구 | harness §1.5 | inject only |

**SessionStart 의 blocking 격상** — bridge dead window 동안 모든 outbox push 는 file write 성공하지만 server 미수신 (silent drop) 이라 "first action" 으로 명시만 한 종래 규율은 enforcement 가 아니라 *advisory* 였어요. SessionStart 를 blocking 으로 격상하면 bridge verify 가 *물리적으로* 모든 다른 tool 호출에 선행. humanities §1.7 Gawande *pause point* 원칙의 LLM lifecycle 적용 — 가장 비싼 silent drop 의 source 를 single chokepoint 로 차단.

### §4.2 Hook JSON Schema — if-then DSL grammar

Greatpractice hook 의 정의는 산문이 아닌 **JSON Schema 강제** (psychology §1.8). 각 hook 은 단일 JSON object 로 표현되고, `event` + `matcher` + `condition` + `action` + `enforcement_level` 5 필드가 mandatory 예요. 추가로 `tiered_strictness` (§4.3), `fatigue_budget_ms` (§4.5), `voice_checked` (§4.6) 의 3 optional 필드가 enforcement 의 fine-tuning 을 담당.

`plugins/greatpractice/schemas/hook-spec.schema.json` v0.1 full definition:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Greatpractice Hook Spec",
  "description": "deterministic enforcement of one ratified practice — if-then DSL (psychology §1.8 Gollwitzer); 산문 금지",
  "type": "object",
  "required": ["event", "matcher", "condition", "action", "enforcement_level"],
  "properties": {
    "event": {
      "type": "string",
      "enum": [
        "SessionStart",
        "UserPromptSubmit",
        "PreToolUse",
        "PostToolUse",
        "Stop",
        "PostCompact"
      ],
      "description": "Claude Code lifecycle event — §4.1 의 7 taxonomy 매핑 (PreToolUse 는 matcher.poka_yoke_type 으로 세분)"
    },
    "matcher": {
      "type": "object",
      "description": "어느 tool 호출 + 어느 input 패턴 + 어느 path 영역에서 fire 하는지 — keyword × path_scope intersection 으로 false-positive 통제",
      "properties": {
        "tool": {
          "type": "string",
          "description": "Bash | Edit | Write | Read | NotebookEdit | * (any) — Claude Code tool name"
        },
        "input_pattern": {
          "type": "string",
          "format": "regex",
          "description": "tool input 의 regex 매칭 (예: Bash 의 command, Write 의 file_path)"
        },
        "path_scope": {
          "type": "array",
          "items": {"type": "string"},
          "description": "활성 파일/디렉토리 glob — keyword 와 AND 결합 — 빈 배열 = workspace 전역"
        },
        "poka_yoke_type": {
          "type": "string",
          "enum": ["contact", "fixed-value", "motion-step"],
          "description": "PreToolUse 일 때만 필수 — management §1.8 Shingo 3 유형 분류"
        }
      },
      "required": ["tool"]
    },
    "condition": {
      "type": "object",
      "description": "fire 조건 — if-then 의 if 절 (psychology §1.8)",
      "required": ["expr"],
      "properties": {
        "expr": {
          "type": "string",
          "description": "JavaScript expression — tool input + workspace state 위에서 evaluate; true 면 fire"
        },
        "trigger_source": {
          "type": "string",
          "enum": [
            "stop-hook",
            "a2a-inbound",
            "user-pivot",
            "hyperbrief",
            "autonomous",
            "post-incident",
            "retro-backfill"
          ],
          "description": "processor §1.8 SHCT — codify 출처 attribution (어느 signal 로부터 본 hook 이 promote 됐는지)"
        },
        "negative_examples": {
          "type": "array",
          "items": {"type": "string"},
          "description": "fire 하면 안 되는 input 의 명시 예시 — specificity trap 회피"
        }
      }
    },
    "action": {
      "type": "object",
      "description": "fire 시 실행 — if-then 의 then 절",
      "required": ["kind", "payload"],
      "properties": {
        "kind": {
          "type": "string",
          "enum": ["block", "warn", "inject_context", "rewrite_input", "run_script"],
          "description": "block=exit 2 + error message / warn=stderr message / inject_context=additionalContext / rewrite_input=tool input 재작성 / run_script=cjs path 실행"
        },
        "payload": {
          "type": "string",
          "description": "action 별 payload — block 의 error message / warn 의 stderr / inject_context 의 markdown / rewrite_input 의 new JSON / run_script 의 .cjs 절대 경로"
        },
        "voice_checked": {
          "type": "boolean",
          "default": true,
          "description": "§4.6 + §6 — block/warn 메시지 본문도 voice linter (Cluster E blameless second-story) 통과 필수"
        },
        "fallback_kind": {
          "type": "string",
          "enum": ["warn", "inject_context", "noop"],
          "description": "tiered_strictness 의 1st violation 또는 fatigue_budget 초과 시 degrade target"
        }
      }
    },
    "enforcement_level": {
      "type": "string",
      "enum": ["mandatory", "recommended", "advisory"],
      "description": "management §1.10 (Wikipedia 5 pillars + IAR) — mandatory=exit 2 차단 / recommended=warning / advisory=inject only. §3.3 frontmatter 의 enforcement_level 과 sync — promote 시 자동 상속, hook spec 에서 명시 override 가능"
    },
    "tiered_strictness": {
      "type": "object",
      "description": "canonical §1.5 BRD (Bold-Revert-Discuss) — 1st/2nd/3rd violation 의 cost-ascending 처리. §4.3 참조",
      "properties": {
        "first": {"enum": ["BOLD", "REVERT", "DISCUSS"], "default": "BOLD"},
        "second": {"enum": ["BOLD", "REVERT", "DISCUSS"], "default": "REVERT"},
        "third": {"enum": ["BOLD", "REVERT", "DISCUSS"], "default": "DISCUSS"},
        "window_turns": {
          "type": "integer",
          "default": 20,
          "description": "violation 카운트 윈도우 — N turn 안의 누적 횟수로 tier 판정"
        }
      }
    },
    "fatigue_budget_ms": {
      "type": "integer",
      "default": 60000,
      "minimum": 0,
      "maximum": 90000,
      "description": "humanities §1.7 Gawande 60-90s ceiling — 본 hook 의 단일 fire 가 소비할 수 있는 max latency. 초과 시 fallback_kind 로 degrade"
    },
    "temporal_locus": {
      "type": "string",
      "enum": ["in-action", "on-action"],
      "description": "humanities §1.9 Schön — in-action=PreToolUse 등 즉석 / on-action=Stop·PostToolUse 등 사후"
    },
    "germane_load": {
      "type": "boolean",
      "default": true,
      "description": "Sweller — true=germane(학습기여) / false=extraneous(reminder only) — false 면 enforcement_level=advisory 강제"
    }
  }
}
```

본 schema 의 mandatory 5 필드 (`event` + `matcher` + `condition` + `action` + `enforcement_level`) 가 `plugins/greatpractice/runtime/eg_greatpractice_lint.cjs` 의 hook spec 검증 대상. 미달 시 v0.1 grace period 동안은 warning, v0.2+ 부터는 block. `tiered_strictness` + `fatigue_budget_ms` + `temporal_locus` + `germane_load` 4 optional 은 enforcement 의 *quality* 차원 — 명시 안 하면 schema default 적용.

### §4.3 Tiered strictness — BRD escalation (1st BOLD / 2nd REVERT-block / 3rd DISCUSS-Hyperbrief)

canonical §1.5 의 **Bold-Revert-Discuss** (Wikipedia BRD cycle) 를 hook violation 처리에 차용. 동일 entry 의 violation 이 `window_turns` (default 20) 안에 누적될수록 enforcement 강도 격상.

| Tier | violation 카운트 | 처리 | EG 매핑 |
|---|---|---|---|
| **1st = BOLD** | 1 회 | soft reminder — `inject_context` 로 추가 안내 (block 없음). 본 entry 의 ratio + 회피법 surface | Cluster B + canonical §1.5 |
| **2nd = REVERT** | 2 회 | exit 2 차단 + acknowledgment 강제 — tool input 에 `acknowledged_greatpractice: <id>` 추가하거나 다른 경로 선택해야 통과 | Cluster B 강화 |
| **3rd = DISCUSS** | 3 회+ | Hyperbrief skill 자동 호출 (`hyperbrief-trigger-check`) — escalation 4-score 계산 + ≥ 4 면 9-section IR 양식 emit. §9.1 boundary 활용 | Hyperbrief §1 |

**rationale**: §7.4 의 *cost-tiered revision vocabulary* (distinguish < per-incuriam < overrule) 와 isomorphic — 가장 싼 reminder 부터 시작, 반복 violation 일수록 cost 상승. 한 번 만에 차단하면 false-positive 가 작업 마비 유발 (extraneous load), 반대로 항상 soft 면 silent drift 방치. 3-tier ramp 가 두 극단의 합성.

`window_turns` 의 default 20 은 humanities §1.7 Gawande 의 short-cycle (60-90s budget × 10-20 fire) + os §1.1 backward-window τ default 의 절반치. mezzo entry 는 default 유지, macro entry 는 50, micro entry 는 5 권장 (tier 별 expected fire frequency 차등).

### §4.4 In-action vs on-action — temporal taxonomy

humanities §1.9 Schön *The Reflective Practitioner* 의 **reflection-in-action / reflection-on-action** 2-temporal taxonomy 를 hook 의 시점 분류로 차용 (`temporal_locus` 필드).

| 분류 | event 위치 | 특징 | EG 적용 |
|---|---|---|---|
| **in-action** | PreToolUse / UserPromptSubmit / SessionStart | 작업 진행 *중* 의 즉석 점검 — Gawande 60-90s budget 의 적용 대상 | outbox-json (Cut 1) / bridge-spawn (Cut 3) |
| **on-action** | PostToolUse / Stop / PostCompact | 작업 *완료 후* 의 retrospective — double-loop escalation 가능, 시간 여유 큼 | Stop hook (기존 `pre-send-probe.cjs`) / PostToolUse SSoT diff |

**design 원칙**: 동일 practice 가 *둘 다* hook 보유 가능. 예 — `pre-send-inbound-check` (Cut 2) 는 outbound emit 직전 PreToolUse(motion-step) (in-action) + cycle-end Stop (on-action) 의 dual-locus enforcement. *probe-then-inspect-or-abort* 도 in-action 측면이 차단력, on-action 측면이 안전망 — 한쪽이 fire 못 해도 다른 쪽이 catch.

in-action hook 은 `fatigue_budget_ms` 60-90s 강 제약, on-action hook 은 *상한 없음 — 단 Stop 의 total wall-clock 은 5s 권장* (turn-end response latency 방어).

### §4.5 Fatigue budget — 60-90s ceiling + killer items only + 5-7 항목 상한

humanities §1.7 Gawande *The Checklist Manifesto* + false-positive 통제 + Sweller cognitive load 의 합성. hook 자체가 작업의 *extraneous load* 원천이 되지 않게 강제 quantification.

**3 제약**:

1. **단일 hook 의 fire latency ≤ 60s** (default), **≤ 90s** (humanities §1.7 ceiling). 초과 시 `fallback_kind` 로 degrade — 통상 `warn` 으로 격하.
2. **단일 turn 의 in-action hook 총 latency ≤ 60s 누적**. 초과 시 후속 in-action hook 은 advisory 로 강제 격하 (`.claude/.hook_latency.jsonl` 측정).
3. **단일 event 의 active matcher 수 ≤ 5-7 종** — Miller 7±2 의 hook-level 적용. 초과 시 path_scope intersection 으로 narrow 강제.

**killer items only**: enforcement_level=mandatory 는 *반드시 막아야 할* 항목만 — `cost_of_missing ≥ 4` (§5.1 5-axis maturity score 의 cost axis) + `predictability ≥ 4` 두 조건 동시 충족. 그렇지 않은 항목은 recommended (warn) 또는 advisory (inject only) 로 강제 demote.

**false-positive 통제**: `matcher.input_pattern` (keyword regex) 과 `matcher.path_scope` (path glob) 의 **AND 교집합** 만 fire. keyword 단독 매칭은 false-positive 폭주의 원인 — 같은 keyword 가 다른 path 영역 (예: `_archive/` 의 historical reference) 에서 등장하면 fire 안 함. lint 가 `path_scope: []` (전역) 인 mandatory hook 을 PR-time warn.

**Sweller 3 종 load 분해**: hook 의 `germane_load: true` 만 mandatory 가능. 단순 reminder (`germane_load: false`) 는 enforcement_level 자동 격하 — 학습 기여 없는 hook 이 mandatory 로 박히면 작업 자체가 hook 회피 path 학습 (poka-yoke 함정, management §4.8).

### §4.6 Voice-check — hook block 메시지도 lint 통과 필수

Cluster B (deterministic enforcement) 와 Cluster E (blameless second-story) 가 동시 적용될 때, hook 의 block/warn 메시지 자체가 비난 톤이면 Cluster E 위반. enforcement 의 *수단* 이 enforcement 의 *content* 를 깨는 self-contradiction. 자세한 voice 규율 + linter spec + 차단 패턴 = **§6 (canonical)**.

본 §4.6 은 hook spec 의 voice-check 진입점만 명시: `action.voice_checked: true` (default) — block payload + warn payload 의 본문이 `plugins/greatpractice/runtime/eg_voice_check.cjs` (§6.3 regex MVP) 의 blameless lint 통과 필수. 3-tier escalation message (BOLD/REVERT/DISCUSS) 의 voice spec 은 §6.4 참조.

§6 (Voice & Framing) 의 4-section template (objective / second story / multi-causal / codification target) 이 hook payload 작성의 reference — block payload 가 길어질 때 4-section 으로 구조화.

### §4.7 Sweller cognitive load — intrinsic / extraneous / germane 분해

Greatpractice 자체가 *extraneous load* 가 되지 않게 명시 quantification 필요. Sweller (1988) *Cognitive Science* 의 3 종 load 분류를 hook design 의 ceiling 으로 차용.

| Load 종류 | 정의 | hook 적용 |
|---|---|---|
| **Intrinsic** | 작업 자체의 본질적 복잡도 — element interactivity | hook 가 줄일 수 없음; 단 sequencing 으로 일부 완화 (motion-step type) |
| **Extraneous** | hook design 부주의로 발생하는 부하 — false-positive, 비난 톤, 과잉 inject | **hook design 의 주된 minimize target** |
| **Germane** | schema 구축 + automation 에 직접 기여하는 부하 — 학습으로 환산 | **mandatory hook 의 유일한 정당화** |

**design rule**: `germane_load: true` 인 hook 만 enforcement_level=mandatory 가능. `germane_load: false` 인 hook 은 자동 advisory 격하. 이 분류는 `plugins/greatpractice/runtime/eg_greatpractice_lint.cjs` 가 schema-time 강제 — mandatory + germane=false 조합은 lint block.

**extraneous 회피 7 규율**:

1. **path_scope 강제** (§4.5) — keyword × path AND 교집합으로 false-positive 차단.
2. **negative_examples 명시** — `condition.negative_examples` 에 fire 하면 안 되는 input 예시.
3. **fatigue_budget cap** (§4.5) — 60-90s ceiling 으로 cumulative load 측정.
4. **voice-check** (§4.6 + §6) — 비난 톤이 cognitive distraction 으로 작동하지 않게.
5. **tiered_strictness ramp** (§4.3) — 1st 부터 차단하지 않고 BOLD reminder 부터.
6. **temporal_locus 명시** (§4.4) — in-action 의 ceiling 과 on-action 의 여유를 다르게 budget.
7. **post-codify hit-rate 측정** (§7.3) — extraneous false-positive 가 누적되면 enforcement_level 자동 demote.

**germane 보존 원리**: schema 가 학습에 기여하려면 hook payload 가 *왜 이 룰인가* (rationale) + *어떻게 회피하는가* (alternative) 둘 다 포함해야 함. 단순 "blocked: violation detected" 류 메시지는 extraneous 만 추가 — germane 0. block payload 작성 시 §6 4-section template 차용 (objective / second story / multi-causal / codification target) 으로 germane 확보.

**EG dogfood evidence** (operational observations): outbox-json-validation + pre-send-inbound-check + session-resume-bridge-spawn + a2a-relay-reliability 4 항목이 본 §4 의 7 hook event 중 PreToolUse + Stop + SessionStart 3 event 의 v0.1 dogfood entry — §5 maturation gate 통과한 첫 cut (P0 ratified). 본 §4 의 schema 가 ship 직후 이들 entry 의 frontmatter `trigger` 필드 + `plugins/greatpractice/hooks/{contact,fixed-value,motion-step}/*.cjs` 로 deterministic enforce 진입.

---

## §5. Maturation Gate — raw → draft → ratified

> 본 §은 "한 번 일어난 사건" 이 어떤 조건을 만족할 때 비로소 *canonical practice* 로 승격되는지를 다뤄요. 단순 frequency 한 축으로 게이트를 정의하면 *가짜 합의* 가 형성돼요 — 5 축이 같은 결론에 도달한 것처럼 보이지만 실제로는 *각각 다른 차원* 의 게이트를 제시했고, synthesis 가 그것을 frequency 로 collapse 한 결과거든요. 본 §은 그 collapse 를 풀어 **5-axis multi-criteria gate** + **3-criterion notability** + **phronesis boundary** + **routing rule** + **redirect stub** + **post-promote probation** 의 6 layer 로 재정식화해요.

---

### §5.1 5-axis multi-criteria maturity score

부록 A Cluster D 가 표면적으로 *5 축 합의* 로 표시한 `1회=raw / 3회=draft / 4회+=ratified` 룰은 — 실제 5 축이 *서로 다른 dimension* 에서 게이트를 제시한 것을 frequency 로 collapse 한 결과예요. 5 축의 dimension 을 펼치면:

| 축 | 출처 | 실제 dimension |
|---|---|---|
| canonical §1.2 | Wikipedia Notability | *coverage depth* (≥ 3 significant) |
| humanities §3.9 | phronesis-codify-boundary | *frequency × cost × predictability* product |
| processor §1.7 | RRIP `rrpv` | *재발현 recency* (단명 default → 1회 재발현 시 promote) |
| sre §1.2 | toil 6-rubric | *cost & predictability score* |
| psychology §1.10 | Lally 66-day | *시간 누적* (≠ 횟수) |

5 축이 다른 dimension 을 다루므로, maturity 는 단일 카운터가 아닌 **weighted multi-criteria score** 로 정의돼요:

```yaml
maturity_score: w_f·frequency + w_d·depth + w_r·recency + w_c·cost + w_p·predictability
weights (v0.1 default):
  w_f: 1.0   # 누적 발생 횟수 (단순 count)
  w_d: 3.0   # significant coverage 깊이 (passing mention vs substantive)
  w_r: 2.0   # 최근 재발현 (rrpv 의 inverse, recency boost)
  w_c: 2.0   # cost-of-missing (silent drop / drift / 외부 협력 손상)
  w_p: 1.5   # predictability-of-trigger (regular vs wicked environment)
threshold:
  promote: maturity_score ≥ 18
  OR (frequency ≥ 3 AND independent_triggers ≥ 2 AND verifiable_effect)
```

각 axis 의 0-5 scale + default weight (v0.1 = uniform 1.0 baseline + 위 listed override):

| Axis | 의미 | 출처 |
|---|---|---|
| **frequency** | 발생 횟수 (3+ = canonical §1.2 notability gate 진입 후보) | canonical §1.2 |
| **depth** | significant coverage 깊이 — 단순 1줄 mention 0, 전문 분석 5 | canonical §1.2 (Wikipedia notability significant coverage 차원) |
| **recency** | 최근 발생 — time-decay (last_referenced_turn 기반) | psychology §1.10 + os §1.1 |
| **cost** | cost of missing — silent drop / churn / 외부 협력 깨짐의 cost | humanities §3.9 (cost-of-missing axis) |
| **predictability** | predictability of trigger — high = JSON validation, low = phronesis-adjacent 판단 | humanities §3.9 (predictability axis) |

OR 절은 *single-axis dominance* 의 fallback — 한 axis 에서 강한 신호가 와도 promote 가능 (canonical §1.2 의 직접 instantiation). single-axis 만 통과한 promote 는 §5.6 probation 에서 더 엄격하게 검증돼요.

각 가중치는 P2 통계 누적 후 자동 tuning 대상 (cross-axis P2 roadmap — 30+ cycle 후 weight learning).

---

### §5.2 Notability gate — 3-criterion (significant + independent + verifiable)

Maturity score 와 *별도로* 동작하는 hard gate. canonical §1.2 (Wikipedia Notability) + independent triggers 정의 정밀화의 합성:

| 기준 | 정의 | EG 측정 |
|---|---|---|
| `significant_coverage` | ≥ 3 회의 substantive 발생 (passing mention 제외) | `feedback_*.md` 본문 ≥ 3 회 append + 각 append 가 distinct context |
| `independent_triggers` | ≥ 2 종 *서로 다른 좌표* | (work-domain × phase × time-of-day) 3-axis 의 distinct 좌표 ≥ 2 |
| `verifiable_effect` | recovery 효과 측정 가능 | 정량 metric 정의 + baseline ≠ post-codify 측정값 |

**핵심 정밀화**: "같은 작업 안에서 3 번 반복" 은 1 종 trigger 예요. independent triggers 는 *축 좌표* 가 달라야 — 예컨대 `outbox JSON validation` 미스가:
- (release-cadence × N-way-sync-phase × evening) 1좌표 + (a2a-coordination × inbound-probe-phase × morning) 1좌표 → **2종 ✓**
- (release-cadence × N-way-sync-phase × evening) 3회 반복 → **1종 ✗**

3-axis 좌표 정의는 psychology §1.7 ACT-R production rule 의 *context cue* 정의를 차용 — production rule 이 다른 context 에서 fire 하면 다른 좌표.

**verifiable_effect**: validation = `(post-codify) hit-rate ≥ (pre-codify) recurrence-rate` 의 정량 check 가능 여부. 측정 가능 = ✓, 측정 불가 = ✗. 자세한 validation 메커니즘 = §7.3.

---

### §5.3 Phronesis-codify-boundary — codify 하지 *말* 영역

humanities §3.9 + §1.12 (Aristotle phronesis + Polanyi tacit knowing) 의 직접 instantiation (개념 정의는 §1.4 참조). *frequency × cost × predictability* 가 임계 통과해도, 영역 자체가 phronesis-heavy 면 hard rule X.

**phronesis_boundary flag 가 발동되는 조건** (셋 중 ≥ 2 만족):
- **rare context**: 발생 좌표가 작업 phase 의 long tail (10% 미만 누적 빈도).
- **high context-dependence**: 동일 표면 행위라도 의미가 context 에 강하게 의존 (예: "outbound A2A first" 의 우선순위는 state-change 의 의미에 따라 다름).
- **judgement-heavy**: outcome 평가가 단일 metric 으로 환원 안 됨 (multi-stakeholder trade-off).

`phronesis_boundary: true` entry 는 codify 되더라도:
- `enforcement_level: advisory` 만 허용 (mandatory 차단 금지).
- hook 의 fire mode = `additionalContext inject only` — block / require-acknowledgement 사용 X.
- 즉석 판단 권위 보존 (Polanyi limit: fully explicit knowledge 불가능 — 일부는 항상 agent 본능에 남아야).

이 boundary 는 *Greatpractice 가 자신의 한계를 명시화* 하는 메커니즘이에요. Hyperbrief.md §1 의 MUST-trigger 명시와 동일 방식 — "어떤 결정은 Greatpractice 가 *대신 결정하지 않는다*" 의 자기 선언.

---

### §5.4 Routing rule — 1회 / 3회+gate / phronesis+approval

phase_3 cycle 의 operational observations (EG dogfood evidence — 11 항목 누적) 을 5 축 합성으로 정밀화한 4-단계 routing:

```
[새 사건 발생]
    ↓
[1회] → memory/feedback_<slug>.md (raw capture — Schön 황금 순간)
        - frontmatter 최소: trigger, timestamp, trigger_source
        - lifecycle: probation
        - rrpv: max-1 (단명 default, processor §1.7)
        - voice-check.cjs blameless framing 강제 (§6 Cluster E)
        - eager capture 정당화: cost 0 + Schön reflection-in-action 의 황금 순간 활용 (psychology §3.5)
    ↓
[+이후 발생] → 같은 feedback 의 illustration section 에 append
        - rrpv: 재발현 시 1 promote
        - significant_coverage 카운터 증가 (substantive append 만)
        - 각 append 의 (work-domain × phase × time-of-day) 좌표 기록
    ↓
[3회 도달 AND §5.2 gate 통과] → greatpractice/_propose/<slug>.draft.md 자동 생성
        - notability-gate 3-criterion auto-check:
          (a) significant_coverage ≥ 3 ✓
          (b) independent_triggers ≥ 2 종 (좌표 distinct 검증) ✓
          (c) verifiable_effect (metric 정의 가능?) ✓
        - 세 기준 모두 통과 시 draft, 미통과 시 memory 잔류 + counter 누적 계속
    ↓
[draft 단계] → maintainer 또는 Hyperbrief revisit 검토
        - phronesis-codify-boundary 평가 (§5.3):
          phronesis_boundary=true 면 → enforcement_level=advisory 로 ratified
          phronesis_boundary=false 면 → enforcement_level (mandatory|recommended|advisory) 결정
        - maturity_score ≥ 18 (§5.1 weighted sum) 추가 검증
        - approval → ratify, reject → _propose/ 잔류 (해소 조건 명시) 또는 archive
    ↓
[ratified] → greatpractice/{macro|mezzo|micro}/<slug>.md
        - tier 결정 (§2 tier 분류 기준 참조):
          - macro: 도메인 governance (5-10 ratio rule)
          - mezzo: procedure (대부분 여기)
          - micro: atom (executable, command/check/decision)
        - frontmatter full (§3 schema 전체 — Cluster C 9/9 합의)
        - memory/feedback_<slug>.md 는 §5.5 redirect stub 으로 교체
        - lifecycle: probation → 90일 hit/miss 카운터 시작 (§5.6)
```

핵심 정밀화 4점:

1. **1회 = raw capture + blameless framing 강제** (§6 Cluster E). 즉시 capture 이지만 voice 가 self-defensive 면 narrative fidelity 손실.
2. **3회 ≠ 자동 draft**: 3회 + 2종 independent context + verifiable effect 통과 (§5.2 hard gate). 같은 좌표 3회는 1종 trigger.
3. **4회+ ≠ 자동 ratify**: phronesis 통과 + maturity_score ≥ 18 + approval. 원본 삭제 X — §5.5 redirect stub.
4. **promote 후에도 probation**: 90일 hit/miss 카운터 (§5.6).

eager vs wait contradiction (부록 A) 의 해소가 *단계별 deferral* — capture eager (cost 0), promotion deferred (게이트 통과 후).

---

### §5.5 Redirect stub mechanism — canonical Wikipedia Merge

원본 `memory/feedback_<slug>.md` 가 promote 후 *삭제* 되면 다른 entry / docs / commit log 의 cross-reference 가 broken — canonical §1.3 (Wikipedia Merge 4-Phase) + §2.4 (cross-domain redirect 패턴) 가 명시 회피 메커니즘 제시.

**Stub 형식** (1줄):

```markdown
# Promoted → see EstreGenesis/greatpractice/<tier>/<slug>.md
```

**Stub 작성 의무사항** (canonical §1.3 Phase 4):
- 원본 파일 *위치 유지* (path 그대로). content 만 stub 1줄로 교체.
- commit message attribution: `chore(memory): promote feedback_<slug> → greatpractice/<tier>/<slug>` 형식 — 저작권/이력 chain 보존 (CC-BY-SA 의 attribution 의무와 동형).
- double-redirect 금지: stub 이 가리키는 ratified entry 가 다시 다른 곳으로 redirect 되면 즉시 resolve.

**Stub 의 역할 3가지**:

1. **Reference 보존**: 다른 feedback / docs / commit 의 `see also feedback_<slug>` 링크가 broken X.
2. **Search hit redirect**: grep / index 검색이 stub 을 hit 해도 즉시 canonical 로 redirect (SO duplicate banner 와 동형).
3. **Historical link**: 진화 history graph (Cluster H + management §1.3 TPS supersedes) 의 단절 회피.

**Stub 삭제 금지**: stub 자체를 삭제하면 redirect 깨짐. Archive 가 필요하면 `_archive/` 로 move + ratified entry frontmatter 의 `supersedes:` field 에 stub path 기록.

`feedback_outbox_json_validation.md` → `greatpractice/mezzo/outbox-json-validation.md` 의 promote 가 EG 의 첫 reference implementation 후보 (§11 dogfood Item 1).

---

### §5.6 Post-promote probation — 90일 hit/miss 카운터

ratified 됐다고 immutable 아니에요. psychology §1.10 (Lally 66일 + 시그마 변동 14배) + sre §1.6 (PRR staleness) + canonical §1.11 (freshness revisit) 합성:

**Probation period**: 90일 = Lally 평균 66일 + 30일 buffer (variability 보정). 이 기간 동안 entry 는 `lifecycle: probation` 상태.

**측정 metric 2종**:

| metric | 정의 | 의사결정 |
|---|---|---|
| `hit_count` | hook 이 fire 했고 실제 violation 차단/검출 성공 | 누적 ↑ = entry 효과 검증 |
| `miss_count` | hook 이 fire 안 했는데 violation 발생 (post-hoc 발견) | 누적 ↑ = entry coverage gap |

**90일 종료 시점 의사결정 matrix**:

| hit | miss | 결과 |
|---|---|---|
| ≥ 5 | ≤ 2 | `consolidation` 격상 — verbose 출력 축소, silent execution OK (psychology §3.5 Lally Stage 2) |
| ≥ 1 | 0 | `probation` 1 cycle 연장 — 신호 sparse, 더 관찰 필요 |
| 0 | 0 | `cold eviction` 후보 — `_archive/` 로 이동 후보 (§7.6 + memoization §3.5 — 단 redirect stub 은 보존) |
| 미달 | > N (threshold tuning) | `revise` 또는 `enforcement_level` 격상 (mandatory ↑) — coverage gap 가 큰 경우 |

**90일 + 추가 90일 (총 180일) 완료 시점**: `consolidation` → `automatic` 격상 — Lally Stage 3 의 silent execution + periodic audit 만 (psychology §3.5).

**Probation 중 freshness 측정**: §7 의 `last_validated_at` + `validation_cadence_days` 와 통합 — probation = 강한 validation cadence (예: 30일), consolidation 후 = 약한 cadence (90일/180일).

**Revise / Retire 결정 어휘** (§7.4 cost-tiered vocabulary — humanities §1.2 차용):
- **distinguish**: 이번 좌표만 적용 안 함, rule 자체 유효 — 가장 싼 revision.
- **per-incuriam**: rule 이 누락 상태로 만들어졌음, 약한 권위로 격하 — `enforcement_level: advisory` 로 강등.
- **overrule**: rule 전체 폐기 — 가장 비싼 revision, 명시 정당화 + cascade 영향 사전 평가 필수 (humanities §4.1 instability cascade 회피).

기본 default 는 *distinguish 우선* — Shleifer 2007 의 *overruling instability cost* 가 가장 큰 비용 (humanities §4.1).

---

### §5.7 Anti-pattern 회피 요약

| Anti-pattern | 발생 조건 | 회피 메커니즘 |
|---|---|---|
| 가짜 frequency 합의 | 단순 횟수 카운트로 promote | §5.1 5-axis weighted score + §5.2 3-criterion gate |
| premature codification (humanities §4.1) | wicked 영역의 부족 데이터 promote | §5.3 phronesis_boundary + §5.6 probation single-axis 통과 강화 검증 |
| zombie rule (humanities §4.2) | retire 명시 없이 약한 권위 잔존 | §5.6 90일 + revise/retire 어휘 + `superseded_by:` 명시 |
| premature consolidation lock-in (psychology §4.9) | identity-level 박제 | macro tier 의 explicit review cadence + §5.6 freshness revisit |
| broken cross-reference (canonical §4.x) | promote 시 원본 삭제 | §5.5 redirect stub 의무 + double-redirect 검출 |

---

*Cross-references*: §2 (tier 분류 기준) · §3 (frontmatter schema 전체) · §4 (hook taxonomy + enforcement_level 적용) · §6 (voice framing / blameless linter) · §7 (freshness cadence + cold eviction).

---

## §6. Voice & Framing — blameless second-story

> Greatpractice entry 의 **voice (어조) 와 framing (서술 구조)** 은 단순 stylistic 선호가 아니라 codification 품질의 *prerequisite* 예요. self-defensive 어조로 작성된 feedback 은 narrative fidelity 가 손상되고, 손상된 narrative 로부터 추출된 절차는 root cause 가 아닌 symptom 에 hook 을 부착해 false-positive 또는 missed-recurrence 를 양산해요. 본 §6 은 4 축 cross-domain 합의에 근거해 blameless second-story framing 을 entry-level + lint-level + hook-message-level 의 3 표면에서 동시에 강제하는 메커니즘을 정의해요.

### §6.1 Cluster E — 4 축 cross-domain 합의

본 voice 규율은 9 축 cross-axis synthesis 의 **Cluster E "Blameless Second-Story Framing"** 에 직접 대응 (부록 A Cluster E). 4 개 축이 서로 다른 어휘로 동일 결론을 도출했어요.

| 축 | 출처 | 핵심 명제 |
|---|---|---|
| **sre** | Allspaw 2012 + Dekker 2012 (`sre §1.3`) | *second story* — "그 시점에 그 engineer 가 가진 정보 / pressure / signal 로 그 결정이 합리적으로 보였다." Just Culture 2 축: *what went wrong* 묻고 *who fucked up* 묻지 않음. accountability 제거 아닌 *재배치*. |
| **management** | Kerth 2001 *Project Retrospectives* (`management §1.9`) | **Prime Directive**: "Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand." |
| **humanities** | M&M conference guard 절 (`humanities §1.5`) | 의학 M&M (Morbidity & Mortality) 의 codification 의식 — *"blame culture 변질 회피, 시스템 패턴으로만 frame"* 이 핵심 규율. 개인 attribution 시 narrative 가 즉시 닫힘. |
| **psychology** | Schön reflection-in-action (`psychology §3.5`) | *learning 황금 순간* 은 self-defensive 톤에서 닫혀요. 즉시 capture 가 가치 있는 이유는 *unfiltered fidelity* — defensive overlay 가 형성되기 전. |

**합의 명제**: blame voice → information hold-back → narrative fidelity 손상 → root cause 미도달 → codification 이 symptom 만 cover → 재발. 이 cascade 는 4 축 모두에서 같은 형태로 관찰돼요. 즉 voice 는 *cosmetic* 이 아니라 *epistemic* — entry 의 진실 함량을 결정해요.

### §6.2 4-Section Template

모든 mezzo / macro tier entry 의 *trigger* 또는 *rationale* 섹션은 다음 4 section 을 schema 강제 보유해요 (`sre §1.3 + §3.10` 의 `blameless-second-story-template`).

```yaml
framing:
  objective: |
    어떤 신호 / 사건 / 누락이 관찰되었는가. outcome-bias 회피 — 결과를
    이미 아는 시점의 후견지명 (hindsight) 어휘 금지. 시간순 + 관찰 가능
    신호만 (timeline · 분 단위 또는 turn 단위).
  second_story: |
    그 시점에 가진 정보 · 압박 · context 로 그 결정/경로가 어떻게
    합리적으로 보였는가. "given what we knew at the time" clause
    명시 의무 (Kerth Prime Directive). 즉석 판단의 합리성을 *복원* 하는
    것이 목적이지 *변호* 가 아님 — §6.3 의 voice linter 가 양자 구분.
  contributing_factors: |
    multi-causal 분해. 단일 root cause 어휘 금지 (§6.3 차단 패턴 L5).
    Five Whys 의 4 가지 한계 (`sre §1.10` Minoura) — single causal,
    investigator 지식 한계, non-repeatable, symptom 정체 — 회피.
    최소 2 개 contributing factor 의무, ≥ 3 권장.
  codification_target: |
    어떤 표면 (mezzo 절차 / micro atom / hook spec / freshness cadence)
    에 어떻게 반영할 것인가. owner + tracking + priority 명시 — Google
    SRE Ch.15 의 action item 규율 (`sre §1.4`). "review the docs" 류
    vague action 금지.
```

micro tier (executable atom) 는 4-section 강제 제외 — atom 은 command/check/decision 자체가 본문 (`sre §3.1 runbook-as-code`). 단 atom 을 *생성* 한 mezzo parent 가 4-section 을 보유하므로 lineage 는 보존돼요.

raw memory (`memory/feedback_*.md`, 1회 capture) 단계는 4-section 의 *lightweight 변종* — objective + second_story 2 항만 의무, 나머지는 promote 시점에 채워요. Schön 황금 순간의 *unfiltered fidelity* 확보 우선 (`psychology §3.5`).

### §6.3 Voice Linter (regex MVP, v0.1)

`plugins/greatpractice/runtime/eg_voice_check.cjs` 가 entry 본문 + frontmatter 에 다음 regex pattern 을 적용해요. v0.1 MVP 는 결정적 차단 (exit 2) 이 아니라 **warning + 대안 제안** — false positive 보정 cycle 누적 후 v0.2 에서 mandatory 격상 (동일 패턴: outbox-json-validation 의 promote-cadence).

| ID | 차단 패턴 (regex) | 의미 | 권장 대안 |
|---|---|---|---|
| L1 | `(?:agent|에이전트|claude|assistant)\s*(?:failed|missed|forgot|놓쳤|빠뜨렸|잊었)` | 개인-귀속 실패 동사 | "절차상 ... 가 누락되었다" (수동 + 시스템 attribution) |
| L2 | `(?:should\s*have|했어야|했었어야|했었어야 했)` | 후견지명 의무화 | "그 시점 정보로는 X 가 합리적으로 보였고, 추가 신호 Y 가 있었다면 Z 로 갔을 것" |
| L3 | `(?:sloppy|careless|negligent|부주의|소홀|태만)` | 인격적 비난 어휘 | "절차 단계 N 의 forcing function 부재" (구조 attribution) |
| L4 | `(?:obviously|당연히|뻔히|명백히|trivially)` | 사후 자명화 (hindsight 정당화) | 삭제 — 자명했으면 누락 안 일어남 (`sre §4.7`) |
| L5 | `^(?:root\s*cause|단일\s*원인|the\s*reason)\b` | single-causal 어휘 (multi-causal 의무 위반) | "contributing factors: [...]" 로 분해 |
| L6 | `(?:always|never|모든\s*경우|언제나|절대)\s+(?:must|should|해야|하지\s*말)` | 절대화 명령 (phronesis-codify-boundary 위반 가능) | enforcement_level + 적용 scope 명시 (`management §1.10`) |
| L7 | `(?:user|사용자)\s*(?:said|told|wanted|원했|시켰|지시했)` | governance attribution (public-repo redaction 위반) | "operational observations" / "phase_N cycle evidence" / "dogfood 관찰" |
| L8 | (chat verbatim 인용 감지: 따옴표 + 30 자 이상 + 1 인칭 발화 마커) | private 출처 verbatim | 기술 명제로 재진술 (paraphrase + 추상화) |
| L9 | `(?:we\s*all\s*know|everyone\s*knows|누구나\s*알|다들\s*알)` | shared-knowledge 가정 (audience profile 위반) | 명시 context 또는 cross-ref `§N.M` |
| L10 | `(?:fortunately|luckily|다행히|운\s*좋게)` | luck framing (systematic codification 회피) | "현 시점까지의 surface 가 X 를 catch — Y cycle 후 staleness 재검증" |

**Linter 동작**:
- 입력: entry frontmatter + body markdown.
- 출력: `{ violations: [{id, line, snippet, suggestion}], passed: boolean }`.
- v0.1 enforcement_level = `advisory` (warning, append `voice_lint_violations: [...]` to frontmatter, hook fire 안 함).
- v0.2 promotion gate: false-positive rate < 10% 측정 후 mezzo entry 대해 `recommended` (PreToolUse 경고). v0.3 에서 macro tier 만 `mandatory` (exit 2 차단).

**Intent classification 확장 경로 (v0.2+)**: regex 만으로는 "변호 vs 복원" (§6.2 second_story 의 핵심 구분) 분리 불가. v0.2 에서 LLM-as-judge sub-call 또는 sentence-level classifier 도입 후보 — Greatpractice 모듈 자체가 self-hosted classifier 의 training corpus 가 됨 (eval-first skill authoring, `harness §3.5`). 단 v0.1 단계에서는 regex MVP 의 **false positive 가 false negative 보다 안전** (warning 만, 차단 X) — over-engineering 회피 (`sre §4.4`).

### §6.4 Hook Block 메시지의 Voice-Check (Cluster B ∩ Cluster E)

Cluster B (deterministic hook enforcement) 와 Cluster E (blameless framing) 가 동시 적용돼야 해요. hook 차단 메시지 자체가 entry 의 voice 규율을 위반하면 entry 본문은 blameless 인데 user-facing surface 는 self-defensive cascade 를 유도하는 모순이 발생.

**규율**:
1. **모든 hook block 메시지는 §6.3 voice linter 의 적용 대상**. plugin manifest 의 `hooks/*.cjs` 가 stderr / additionalContext 로 emit 하는 텍스트는 lint-at-author-time + runtime sanity check 동시.
2. **3-tier escalation message 의 voice spec** (canonical §1.5 BRD 와 합성, §4.3 tiered strictness):
   - **Tier 1 (BOLD soft reminder, additionalContext inject)**: collaborator 톤. "현재 작업에 관련된 절차 X 가 있어요 — §N.M 참조." 차단 X. blame 어휘 0.
   - **Tier 2 (REVERT block + acknowledge)**: structural 톤. "절차 X 의 forcing function 단계 Y 가 미충족 — `acknowledged_greatpractice: <id>` 를 tool input 에 포함하면 진행해요." 절차에 attribute, agent 에 attribute X.
   - **Tier 3 (DISCUSS + Hyperbrief auto-trigger)**: escalation 톤. "3 회 연속 위반 — Hyperbrief IR 자동 발화 (4-score escalation MUST trigger). 결정 위임 후 재시도." 위반 *횟수* 만 명시, *책임 attribution* X.
3. **PRR 의 "audit 변질" 회피** (`sre §4.9`): hook 메시지 톤이 *blocker* 가 아닌 *collaborator* — agent / maintainer 가 hook 을 우회하고 싶지 않게.
4. **temporal taxonomy 일관** (`humanities §1.9` Schön): *in-action* hook (PreToolUse) 의 메시지 = Gawande 60-90s budget 내 read-do 형식 (`humanities §1.7`), 산문 X — 절차 step + check + decision 의 atomic 3 요소. *on-action* hook (Stop / PostToolUse) 의 메시지 = double-loop 가능, 4-section template 적용 가능.

**구현**: `plugins/greatpractice/runtime/hook-message-lint.cjs` — manifest build 시점 (PreToolUse hook author-time) + runtime emit 시점 양쪽 voice-check 적용. CI/pre-commit 에서 author-time lint 가 실패하면 plugin merge 차단 (mandatory).

### §6.5 User-Action Surfacing — Passive Idle-Wait 금지

multi-agent 협력 cycle 에서 진행이 *오직 maintainer 만 할 수 있는 action* (다른 agent 에 redirect 지시, tool access 부여, infra 재시작, manual sign-off) 에 blocked 일 때, 그 dependency 를 **"needs your action" framing 으로 explicit surface** 의무. passive idle-wait summary ("inbox 모니터링 중", "응답 대기") 안에 묻는 것 자체가 voice 규율 위반.

**근거**:
- A2A 통신 우선순위 (부록 A Cluster B + dogfood evidence): state change 가 outbound 동반 시 그 message + 전제작업이 local-only 보다 FIRST. maintainer-blocking dependency 도 동형 — surface 가 *deferred* 되면 counterpart start-time minimization 의 isomorphism 이 user 측에서 깨져요.
- Just Culture 의 *honest mistake / negligence* 구분 (`sre §1.3` Dekker): maintainer action dependency 를 surface 하지 않는 건 honest mistake 가 아닌 procedural negligence — agency 박탈.
- ICS 의 Three Cs (`sre §1.7`): *Coordinate · Communicate · Control* 모두 정보 흐름 전제. maintainer 가 IC role 일 때 dependency 미surface 는 coordinate 실패.

**Schema**: entry 또는 cycle-end probe 가 maintainer-action-blocked 상태를 감지 시 다음 frontmatter / 메시지 구조 emit:

```yaml
needs_user_action:
  blocking_dependency: |
    무엇이 막혀 있는가 (technical surface + 왜 maintainer 만 할 수 있는지).
  options_for_user:
    - id: opt-a
      action: "다른 agent X 에 Y 지시"
      consequence: "cycle 재개, ~N turn 후 surface"
    - id: opt-b
      action: "infra Z 재시작"
      consequence: "bridge respawn, immediate"
  if_no_response_in: "N hours OR M cycles"
  fallback: "응답 없을 시 자동 fallback 경로 (local-only 진행 또는 retire)"
```

**voice 규율 적용**:
- "needs your action" framing 의무 — *"waiting for user"* (passive) 금지, *"이 N 가지 중 하나의 maintainer decision 이 cycle 재개의 prerequisite"* (active dependency naming).
- options 명시 — open-ended question 금지, 2-3 개 명시 옵션 + 각 결과 예측 (Hyperbrief §1 의 9-section IR 패턴과 isomorphic, escalation score < 4 의 lightweight 변종).
- timeout 명시 — 응답 없을 시 자동 fallback 경로 + retire / Hyperbrief escalation 분기.

**Hook 통합**: Stop hook (`pre-send-probe.cjs --rearm`) 이 cycle-end probe 단계에서 entry 의 `needs_user_action` field 또는 inbox 의 maintainer-blocking signal 을 감지 시 *meaningful surface* 로 격상 — turn-end assistant text 의 last paragraph 가 needs-your-action block 으로 강제 (Stop hook 의 cycle-end extension 과 일관).

---

**Voice 규율 요약** (cross-ref 용 1-liner): blameless second-story 4-section template (§6.2) + 10-pattern regex linter (§6.3) + 3-tier hook message voice spec (§6.4) + needs-your-action surfacing schema (§6.5) — 4 표면 동시 적용으로 entry · lint · hook · cycle-end 의 voice 일관성 확보. 4 축 (sre + management + humanities + psychology) 합의 (§6.1) 가 architectural 정당화.

---

## §7. Freshness & Lifecycle Cadence

> Codified practice 가 *살아있는 norm* 으로 남으려면 staleness 가 자동 감지되고 revisit / revise / retire 가 정형화되어야 해요. timestamp 만으로는 부족 — *효과 측정* (post-codify hit-rate ≥ pre-codify recurrence-rate) 이 freshness 의 진짜 정의예요. 본 §은 5 축 합의로 도출한 cadence default + cost-tiered revision vocabulary + 상속 + cold eviction 의 lifecycle 전체를 spec 화해요.

### §7.1 Cluster F 합의 — 5 축이 같은 결론

Freshness/staleness validation 은 9 축 중 5 축에서 독립적으로 동일 결론에 도달한 strong convergence 예요 (부록 A Cluster F):

| 축 | 패턴 | 결론 |
|---|---|---|
| sre | `staleness-validation-cadence` | Continuous PRR (Visser) — 6 개월 재검토 의무, "systems change, traffic patterns shift" 가 immutable spec 신화를 깸 (Google SRE Ch. 32) |
| canonical | `freshness-revisit-cadence` | Wikipedia stale article + SO outdated answer + GitHub README drift cross-domain isomorphism — 모든 entry 에 `freshness_until` + `freshness_axis` |
| management | `standard-as-kaizen-baseline` | TPS 의 "표준 = kaizen baseline, 박제 X" — 12 주 freshness window (Ohno) |
| humanities | `cost-tiered-revision-vocabulary` | distinguish / per-incuriam / overrule 3-tier ascending cost (Shleifer-Vishny-Mullainathan 2007 §1.2) |
| memoization | `hit-rate-telemetry-cold-eviction` | 90 일 cold entry 의 archive 후보 (Bellman 1957 + Bazel content-addressed) |
| (processor) | `rrip-style-default-rrpv` | 14-day 미사용 시 retire 큐 — 같은 모티프의 micro-scale 버전 (Jaleel et al. ISCA 2010) |

5 도메인 + 1 secondary 가 *세부 수치* 는 다르지만 *cadence 자체의 필요성* 에는 만장일치. EG 적용 우선순위 **P1** — §3 frontmatter schema 가 prerequisite 이고, schema 안정 직후 즉시 가동 가능.

### §7.2 cadence_days default — 기하급수 tier-별 기본값

5 축의 중앙값 (humanities §1.6 M&M 월간 / sre §1.6 6 개월 PRR / canonical §1.11 Wikipedia 다양 / processor §3.2 14 days RRPV / memoization §3.5 90 일 cold) 을 합성하면 tier-별 기하급수 cadence 가 도출돼요:

| Tier | `cadence_days` default | 정당화 |
|---|---|---|
| **micro** | 30 | atom (command / check / decision) — 외부 도구 / API / path 변경에 가장 민감. M&M 월간 cycle 의 micro-instrumentation |
| **mezzo** | 90 | procedure — 도메인 안의 mid-level workflow. memoization 90 일 cold + processor RRPV 의 mezzo-scale projection |
| **macro** | 180 | governance / telos / domain-level ratio rule — Continuous PRR 6 개월 (Visser §1.6 sre) + Restatement 갱신 cycle (humanities §1.3) |

```yaml
# entry frontmatter (§3 schema 발췌)
freshness:
  last_validated_at: 2026-06-04T00:00:00Z
  cadence_days: 90              # tier default 또는 명시 override
  axis: api-surface             # 무엇이 변하면 stale 인지 (선택)
  next_due_at: 2026-09-02T00:00:00Z   # cadence_days 산출, build-time check
```

**override 허용 조건**: fragility=high (외부 API / SDK 의존) entry 는 default 보다 짧게 (e.g. 14d), kaizen baseline 안정 entry 는 default 보다 길게 (e.g. 365d) 명시 override 가능. override 시 `freshness.rationale:` 1-line 강제 (canonical §1.5 BRD 의 audit trail).

### §7.3 Validation 메커니즘 — timestamp 가 아니라 효과 측정

단순 `now - last_validated_at < cadence_days` 의 timestamp check 만으로는 freshness 정의가 부실해요. *codify 된 practice 가 실제로 작동하는지* 의 효과 측정이 진짜 정의예요.

**정량 정의**:

```
(post-codify) hit-rate ≥ (pre-codify) recurrence-rate
```

- **pre-codify recurrence-rate**: entry 가 `_propose/` 단계에서 관찰된 *반복 발생 빈도* (e.g. 30 일에 3 회 silent drop).
- **post-codify hit-rate**: entry promote 후 *hook 가 정상 발화 + 실제 violation 차단/경고* 한 빈도. PostToolUse hook fire count + bypass-acknowledged count.

**불등식 위배 시 처방**:

| Pattern | 진단 | 처방 |
|---|---|---|
| hit-rate < recurrence-rate | hook 가 trigger 못 잡거나 model 이 우회 | hook spec revise (humanities §1.7 Gawande fatigue budget 점검) + `enforcement_level` 격상 (advisory → recommended → mandatory) |
| hit-rate ≈ 0, recurrence-rate ≈ 0 | 환경 변화로 더 이상 발생 안 함 | cold eviction 후보 (§7.6) |
| hit-rate > recurrence-rate 초과 | hook 가 noise-fire (false-positive) | hook condition narrow + `trigger.if` schema 정밀화 |
| hit-rate ≥ recurrence-rate ≈ 양호 | 효과 입증 | `lifecycle: automatic` 승격 (psychology §1.10 Lally 66 일 모델) + cadence 완화 가능 |

**증거 누적 channel**: micro 의 hook fire count 는 `collab/practice_refs.jsonl` (backward-window) + `collab/shct.json` (trigger-source attribution) 의 운영 상태 stream 으로 자동 수집. validation cycle 마다 build-time aggregator (`runtime/freshness-check.cjs`) 가 entry frontmatter 의 `metrics.hit_count` / `metrics.recurrence_count` 필드를 갱신.

### §7.4 Cost-Tiered Revision Vocabulary

stale 감지 후 *어떻게 수정할지* 의 vocabulary 는 humanities §1.2 의 법학 3-tier 를 그대로 차용해요. ascending cost — 가장 싼 distinguish 가 default, overrule 은 cascade 위험으로 최후 수단 (Shleifer-Vishny-Mullainathan 2007 의 *Overruling and the Instability of Law* 직접 인용 + `humanities.md` §4.1 instability cascade pitfall). 본 §은 vocabulary 의 *의미 + 선택 가이드* 의 canonical spec — frontmatter 의 `revision_history[].cost_tier` enum 표기는 §3.4 참조, post-promote probation 의 revise/retire 결정 적용은 §5.6 참조.

| 어휘 | 의미 | cost | 영향 범위 | redirect stub? |
|---|---|---|---|---|
| `distinguish` | 이번 context 만 적용 안 함, rule 자체는 유효 — `coherence: soft` 항목에 권장 | 낮음 | 단일 phase / 단일 task 영역 | 원본 유지 + 새 entry 가 `supersedes: [원본 id]` 비등록 (둘 다 valid) |
| `per-incuriam` | 이 entry 는 누락 / 부주의로 만들어짐 — 약한 권위 잔존, deprecation 후보로 큐잉. `staleness.attestation: per_incuriam` 마킹 후 90 일 grace window | 중간 | derived surfaces 에 warning surface, 신규 호출자에 advisory 톤 | 원본 → `_archive/` 이동 + `superseded_by` 명시 |
| `overrule` | rule 자체 폐기 — 신규 entry 로 대체 (`supersedes:` chain). 모든 derived surface 동시 갱신 의무 (Cluster H) | 높음 | global, cascade 위험 → §4.3 BRD tiered escalation 의 3rd-tier 트리거 | 원본 → redirect stub (canonical §1.3 Wikipedia Merge) + `superseded_by` 강제 |

```yaml
# revision 시 frontmatter delta
supersedes:
  target: outbox-json-validation-v1
  mode: distinguish          # distinguish | per-incuriam | overrule
  rationale: "bash HEREDOC issue only in legacy zsh path; new node script bypass"
  applies_to: "phase=legacy-zsh-path"   # distinguish 의 경우 필수
```

**선택 가이드**:
- schema 미준수 = aggressive prune (canonical §1.12) — distinguish 대상 X, 즉시 retire.
- context 변화 / 외부 조건 진화 = cost-tiered (humanities §1.2) — distinguish 우선.
- 모순 누적 시 Justinian moment (humanities §1.4) → 통합 codification → 새 macro tier entry 생성, 기존 mezzo/micro 가 redirect stub.

### §7.5 Freshness 상속 — derived surface 가 master 의 freshness 를 상속

Cluster H (SSoT propagation) 와 합성하면 — derived surface (badge / docs hero / plugin.json / marketplace.json 등) 의 freshness 는 master entry 의 freshness 를 *상속* 해요. derived 측에 독자적 cadence 가 있으면 SSoT 원칙 위배 + 갱신 누락 16× incident (release-versioning-cadence dogfood evidence) 의 재발.

**상속 규칙**:

```yaml
# master entry (canonical)
id: release-versioning-cadence
tier: macro
freshness:
  cadence_days: 180
  last_validated_at: 2026-06-04
surfaces:
  - path: EstreGenesis/README.md
    fragment: version-badge
    sync_mode: build-time      # derived
  - path: EstreGenesis/docs/index.html
    fragment: hero-badge
    sync_mode: build-time
  - path: EstreGenesis/docs/shared/data.js
    fragment: meta.version
    sync_mode: build-time
```

- derived 측은 *자체 cadence 필드 보유 금지* — `surfaces[].sync_mode: build-time` 이 명시되면 freshness 는 master 에서 자동 propagate.
- `runtime/freshness-check.cjs` 가 master 의 `next_due_at` 도래 시점에 surfaces[] 의 모든 derived 측을 동시 invalidate → build pipeline 이 재생성 강제.
- master 의 `last_validated_at` 갱신 → derived 측은 자동 valid. *역방향* (derived 변경 → master 갱신) 은 코딩으로 차단; 위반 시 `eg_greatpractice_lint.cjs` 가 PreToolUse 차단 (Cluster B deterministic hook).

**예외**: A2A counterpart 가 소유한 derived surface (catchball protocol, management §1.7 + §8.5) 는 build-time propagation 불가 → `sync_mode: catchball` 명시 + 별도 negotiation 큐. P3 multi-agent residency 안정 후 가동.

### §7.6 Cold Eviction — 90 일 idle → `_archive/`, 삭제 X

**메커니즘** (memoization §1.5 + canonical §1.3 의 합성):

```
[entry promoted] → 활성 tree (greatpractice/{macro|mezzo|micro}/)
       ↓ 90 일 hit_count 0 AND recurrence_count 0
[cold candidate] → freshness-check.cjs 가 next-stop 에 surface
       ↓ maintainer 또는 Hyperbrief 검토 (notability re-attest)
[archive 결정] → _archive/<tier>/<slug>.md 로 이동
       ↓ 원자리에 redirect stub 보존 (canonical §1.3)
[active tree 자리] → `# Archived → see _archive/<tier>/<slug>.md`
                     cross-reference 깨지지 않음
       ↓ refault (cold archive 의 재-hit) 감지 시
[unarchive 후보] → _shadow.jsonl 에 refault distance 기록
                    threshold 통과 시 자동 reactivation 제안 (memoization §3.4)
```

**삭제 vs archive 의 구분**:
- *삭제* = entry 가 quality bar 통과 못 함 (schema 미준수, canonical §1.12 aggressive prune) — 권한: lint 자동. redirect stub 도 보존 (broken cross-reference 회피).
- *archive* = entry 가 운영상 의미 잃음 (환경 변화) — 권한: cadence 자동 + maintainer confirm. 미래 refault 시 reactivation 가능성 보존.

**`_shadow.jsonl` refault tracking** (memoization §3.4 + os §1.5):
- archive 시점의 freshness snapshot 보존.
- 이후 동일 trigger pattern 이 N 회 재발 시 *refault distance* 측정 → archive 가 잘못된 결정이었는지 판정.
- refault rate ≥ threshold → 자동 unarchive 제안 (다음 Stop hook 의 surface 항목).

**Phronesis boundary 충돌 회피** (`humanities.md` §3.9 + §4.6): cold eviction 이 *codify 하지 말 영역* 으로의 자연 demotion path 도 됨 — 처음엔 codify 했지만 실제로는 phronesis (즉석 판단) 가 더 잘 처리하는 영역이라면 cold 후 archive 가 자동 해소.

---

**§7 cross-section 의존**:
- §3.3 (lifecycle stages — probation/consolidation/automatic) — §7.3 의 promotion path 와 동기.
- §3 (frontmatter schema) — `freshness.*` 필드 정의의 prerequisite.
- §4 (hook taxonomy) — `runtime/freshness-check.cjs` 가 Stop hook 의 (d) freshness probe 단계로 통합.
- §8 (SSoT propagation) — §7.5 inheritance 가 §8 의 derived surface enumeration 과 직접 연결.
- §3.4 + §5.6 (revision / supersession graph 표기 + 적용) — `supersedes:` chain + cost-tiered vocabulary 의 frontmatter / lifecycle 매핑.
- §7.7 (retire 축) — status 3-상태가 §7.3 validation / §5.6 probation 카운터를 전이 트리거로 소비; §5.5 redirect stub 이 active→retired 직행의 동반 산출물.

### §7.7 Retire 축 — active / probation / retired 3-상태 상태기계 (v0.3.0)

> §7.6 cold eviction 이 "관심을 잃은" entry (idle) 를 다루는 반면, §7.7 은 "틀리게 된" entry (invalid · superseded) 를 다뤄요. 둘은 직교하는 축 — eviction 의 신호는 *사용 빈도*, retire 의 신호는 *유효성*. EG 북극성 가치판단 축 3 (deprecation 일급) 의 GP-측 구현이에요: cruft 를 빼지 못하는 표준이 정확히 "더 깔끔한 후속" 의 짐이 되므로, retire 는 promote 와 동급의 1급 작업이어야 해요.

**3-상태** — entry frontmatter `status:` enum (신규, 생략 시 `active`):

| status | 의미 | enforcement |
| --- | --- | --- |
| `active` | 유효 — 정상 enforce | hook 정상 동작 |
| `probation` | 유효성 의심 — §7.3 validation 실패, §5.6 miss 카운터 임계 초과, 또는 환경 변화 의심 | hook 은 계속 enforce 하되 block/warn 메시지에 probation 표지 동반 ("이 practice 는 재검증 대기 중") |
| `retired` | enforce 중지 — 본문은 보존 (삭제 X, §7.6 과 동일 원칙) | hook 스캔에서 제외 (frontmatter 필드 검사 1줄 — 결정적) |

**전이 규칙** (최소 4 전이만 — 과설계 금지):

- `active → probation` — §7.3 validation 실패 또는 §5.6 probation 카운터 임계. 자동 가능 (hook/cadence 가 flag).
- `probation → active` — 재검증 통과. 자동 가능.
- `probation → retired` — 사용자 ratify 필요 (§9.1 Hyperbrief escalation 경로 사용 가능). enforce 를 끄는 결정은 promote 와 대칭으로 인간 게이트.
- `active → retired` — superseded 명시 시 직행 (`superseded_by` 지정 + §5.5 redirect stub 동반). 이때도 사용자 ratify.

**retired entry 의 frontmatter 의무**: `retire_reason` (1줄 — superseded / invalidated / environment-changed 중 무엇이며 왜) + 가능하면 `superseded_by` (§3.4 evolution 필드 재사용). retire 는 정보 손실이 아니라 상태 전이 — git 히스토리 + 본문 + reason 이 "왜 이게 한때 옳았고 왜 더는 아닌가" 를 보존해요.

**기존 축과의 구분** — `lifecycle` (§3.2: probation/consolidation/automatic) 은 habit-formation *성숙* 축이에요. 같은 단어 `probation` 이 두 축에 등장하지만 의미가 달라요: `lifecycle: probation` = "아직 어린" (성숙 중), `status: probation` = "의심받는" (퇴출 후보). 직교 — `lifecycle: automatic` + `status: probation` (오래 자동화됐지만 환경이 바뀌어 의심) 조합이 유효해요.

**INDEX 반영** — retired entry 는 tier 섹션 목록에서 제외, INDEX 말미에 `Retired: N` 1줄 카운트만 유지 (목록 자체는 `grep -l "status: retired"` 로 발견 — ≤300 token cap 보호, §2.5).

**v0.3.0 scope** — 본 절은 spec 정의 + `_schema.md` 필드 + INDEX 반영 규칙까지. hook runtime 의 status-스캔 제외 구현은 runtime 빌드 시점에 반영 (§11 cut scope 참조).


---

## §8. SSoT Propagation — `surfaces[]` inversion

> Greatpractice entry 가 *master canonical*, 외부 표면 (badge / docs / plugin.json / marketplace.json / hook payload / memory stub) 은 *derived view* — 이 inversion 이 §8 의 한 줄 요약이에요. 현행 EG 의 N-way sync 등록부 (workspace AGENTS §5.8) 는 *표면 enumeration* 을 외부 문서에 두고 entry 가 그 표면을 *모르는* 구조라, master 가 변경돼도 derived 갱신이 모델 판단에 의존해요. §8 은 이 방향을 뒤집어 entry frontmatter 의 `surfaces:` field 가 derived 표면을 *알게* 하고, propagation 을 결정적 hook (canonical §1.11 + sre §1.9) 으로 기계화해요.

### §8.1 Cluster H — 4 축 합의의 정당화

cross-axis synthesizer 의 Cluster H 는 9 축 중 4 축이 같은 결론에 도달한 *cross-domain isomorphism* 이에요 (부록 A Cluster H):

| 축 | 메커니즘 | 핵심 명제 |
|---|---|---|
| **canonical** §1.11 | Wikidata → Wikipedia infobox 자동 sync | "every data element is mastered in only one place" (Wikipedia *Single source of truth*). statement 가 update 되면 그 statement 를 reference 하는 모든 page 에 자동 반영. |
| **sre** §1.9 | Honeycomb / Charity Majors observability 2.0 | "arbitrarily-wide structured events" 가 single source, metric · log · trace 는 derived. "3 pillars" 처럼 silo 별 중복 저장은 correlation cost 폭증으로 anti-pattern 으로 판정됨. |
| **memoization** §1.8 | Bazel CAS + Nix content-addressed derivation | input hash → output 매핑이 master, build artifact 는 derived. hermeticity (sandbox + explicit input declaration) 가 SSoT 의 prerequisite. |
| **management** §1.12 | Hoshin Kanri catchball + X-Matrix | 단일 page 시각화가 derived view, 정책 노드는 master. 다만 master 변경이 *unilateral* 이 아니라 owner 간 catchball (bidirectional negotiation) 로 진행. |

> 4 축이 *어휘는 다르지만 결론은 동일* — master ↔ derived 의 명시적 분리. Greatpractice 의 architectural 정당화로 단일 도메인의 권위에 의존하지 않는 multi-domain 증거.

### §8.2 AGENTS.md §5.8 등록부의 entry-level inversion

**현행 (workspace registry 방향)**:

```
AGENTS.md §5.8 N-way sync 등록부
  ├─ "EG 릴리스 버전" row → [README badge, docs hero, data.js meta, CHANGELOG]
  ├─ "Hyperbrief 모듈 버전" row → [frontmatter, plugin.json, marketplace.json, docs hero, ...]
  └─ ... (표면 enumeration 이 *외부 문서* 에 있음)
```

문제: master entry (예: `mezzo/release-cadence.md`) 자체는 "내가 어느 표면에 propagate 되어야 하는지" 를 *모름*. 갱신은 모델이 §5.8 등록부를 *기억해서* 매핑해야 하고, 이게 16× docs/promo sync miss 의 root cause (release versioning cadence dogfood evidence).

**Inversion (entry-level 방향)**:

```yaml
# greatpractice/mezzo/release-cadence.md frontmatter
---
id: gp.mezzo.release-cadence
tier: mezzo
surfaces:
  - kind: docs-badge
    path: EstreGenesis/README.md
    selector: "img[alt='version']"
    coherence: strict
  - kind: docs-badge
    path: EstreGenesis/docs/index.html
    selector: ".hero-badge[data-meta=version]"
    coherence: strict
  - kind: data-js
    path: EstreGenesis/docs/shared/data.js
    selector: "meta.version"
    coherence: strict
  - kind: changelog-entry
    path: EstreGenesis/CHANGELOG.md
    selector: "h2:first"
    coherence: soft
---
```

master = entry frontmatter, derived = enumeration 된 각 surface. 매 derived 표면은 (kind, path, selector, coherence) 4-tuple 로 정형화 — sre §1.9 의 "structured events as SSoT" 의 EG-scaled instantiation.

### §8.3 Surface kind taxonomy

5 종의 derived surface kind 를 정의해요 (확장 가능, P0 cut 의 baseline):

| kind | 정의 | propagation 메커니즘 | 첫 dogfood 예시 |
|---|---|---|---|
| `skill` | plugin skill 의 frontmatter description / trigger keyword | PostToolUse hook 이 skill 의 `paths:` glob 활성화 (harness §1.4) | `plugins/hyperbrief/skills/hyperbrief-trigger-check` |
| `hook` | lifecycle hook 의 schema / matcher / exit code | PreToolUse / Stop hook 의 JSON spec 직접 lint (§4 hook schema) | `pre-send-probe.cjs --rearm` 의 watcher rearm spec |
| `docs-badge` | HTML/Markdown 안의 version / status badge | DOM selector 기반 build-time generation (sre §1.9 derived) | `docs/index.html` hero badge, `README.md` shield |
| `memory_stub` | promoted entry 의 redirect-only memory file | promote 시점에 1줄 stub 자동 생성 (canonical §1.3) | `memory/feedback_*.md` → `# Promoted → greatpractice/...` |
| `plugin-json` | `plugin.json` / `marketplace.json` 의 version + module-tag field | JSON Pointer (`/version`, `/plugins/N/version`) 기반 atomic replace | `plugins/<module>/.claude-plugin/plugin.json` |

> 각 kind 별 propagation 메커니즘은 §4 (hook taxonomy) 의 PostToolUse + §12 (runtime) 의 `gp-sync-check.cjs` 가 책임 — entry 변경 → kind 별 dispatcher → derived 표면 갱신/검증.

### §8.4 Strict vs soft propagation — per-entry `coherence` field

Strict Coherence vs Eventual Consistency contradiction 의 해소: master 변경의 derived propagation 강도를 *entry 단위로 선택* 하게 해요. processor §1.11 MESI 의 strict invalidation 을 모든 entry 에 적용하면 A2A traffic 폭증 + 의도된 ad-hoc deviation 까지 차단해서 운영 부담이 커요. 반대로 모두 soft 면 critical entry (예: redaction rule, outbox JSON schema) 의 silent drift 위험.

**3 단계 `coherence` field**:

| value | semantics | propagation 동작 | 적용 사례 |
|---|---|---|---|
| `strict` | 모든 derived 표면이 master 와 *정확히* 일치해야 함 | PostToolUse hook 이 mismatch 감지 시 exit 2 차단, 후속 작업 진행 불가 | redaction rule (public-repo 의 verbatim 금지), outbox JSON schema, version badge (release cadence) |
| `soft` (default) | derived 갱신이 *권장* 되지만 misalignment 가 hard-block 은 아님 | mismatch 감지 시 warning + additionalContext inject ("아래 표면을 잊었어요"), 작업 계속 가능 | docs prose, CHANGELOG entry body, illustration section |
| `none` | propagation 추적 명시적 면제 | hook 이 surface 를 무시. lint 도 검증 안 함 | local-only entry, draft / `_propose/` 잔류 항목, phronesis-boundary 항목 |

**Default = `soft`**: management §1.12 catchball 의 "negotiation up and down" 원칙 + canonical §1.11 의 "fully automated 가 risky 한 경우는 reminder only" + sre §1.9 의 derived view build-time generation 모두 *soft default + strict opt-in* 으로 수렴. *strict 는 enforcement_level=mandatory 와 짝* — recommended/advisory entry 가 strict 가 되면 enforcement contradiction 이라 lint 가 (coherence, enforcement_level) 정합성 강제.

### §8.5 Catchball protocol — multi-agent owned surface 협상 (deferred P3)

multi-agent residency (워크스페이스에 EG 외 A2A counterpart 가 합류하는 단계) 에서 한 entry 의 derived 표면이 *다른 agent 가 owned* 인 경우가 생겨요. 예: EG 의 `mezzo/a2a-priority-routing.md` 의 surface 중 일부가 counterpart 측 docs 표면일 때 — master 가 단방향 propagation 을 시도하면 counterpart 의 자율성과 충돌.

management §1.12 + §3.5 (catchball-node-change-protocol) 의 bidirectional negotiation 을 차용해요. master 변경이 owned surface 를 건드릴 때:

```
[1] PROPOSE     master 가 frontmatter diff 를 outbound A2A 로 알림
                  (메시지 타입: greatpractice/node-change-proposal)
[2] ACK         counterpart 가 *받음* 확인 (transport ack ≠ 합의)
[3] NEGOTIATE   counterpart 가 (a) accept, (b) revise propose-back,
                  (c) reject + reason 중 하나로 응답
[4] CATCHBALL   revise 의 경우 master 가 다시 revise → counterpart →
                  ... (Hoshin Kanri 의 "objectives are negotiated up and down")
[5] CONVERGE    합의 시 양측 entry frontmatter 동시 update + hash bump
                  합의 실패 시 BRD-style discuss (canonical §1.5 3rd tier)
```

**P3 deferred 이유**:
- A2A 신규 메시지 타입 (`greatpractice/node-change-proposal`) spec 정의 필요 — Constellation 의 inbox/outbox protocol 확장.
- 합의 실패 시 fallback (BRD 3rd tier) 이 Hyperbrief escalation 과 통합되어야 함.
- counterpart 측 Greatpractice 모듈 채택이 prerequisite (asymmetric 환경에선 catchball 이 단방향 push 로 degrade).
- P0-P2 단계에서는 owned surface 가 *모두 EG self-owned* 라 unilateral propagation 으로 충분.

**P0-P2 fallback**: `surfaces[].owner` field 의 default 가 `self`. owner != self 인 경우 P3 까지는 `coherence: soft` 강제 + warning 만 emit (catchball 미가동 환경에서 strict 는 정의상 불가능).

### §8.6 §8 cross-section 의존

본 §8 은 다음 §에 의존해요:
- **§3.5** (frontmatter `surfaces[]` 배열 필드의 YAML schema 정의 위치).
- **§4.1** (PostToolUse hook — kind 별 dispatcher 의 hook event binding).
- **§4.3** (enforcement_level × coherence 정합성 lint — recommended/advisory + strict 의 contradiction 검출).
- **§12.6** (`gp-sync-check.cjs` runtime — derived 표면의 build-time generation + drift 검출).
- **§11** (maturation gate — P3 catchball protocol 의 graduate 조건은 multi-agent residency 정착 사전조건).

---

## §9. Interactions — Constellation / Superscalar / Hyperbrief

> Greatpractice 는 EG 4번째 부가 모듈이고, 앞선 세 모듈 (Constellation A2A · Superscalar 병렬 dispatch · Hyperbrief 결정 위임) 이 이미 다루는 표면과 일부 인접해요. 본 §9 는 그 boundary 를 명시적으로 못박아서 — *어디서 끝나고 어디서 인접 모듈에 위임하는지* — 운영 시점의 overlap 회피를 보장해요. 핵심 원칙: 세 인접 모듈은 각자의 **결정 표면** (Hyperbrief) · **통신 표면** (Constellation) · **dispatch 표면** (Superscalar) 을 SSoT 로 소유하고, Greatpractice 는 그 위에서 **반복 작업 패턴의 codification** 만을 다뤄요. 같은 surface 에 두 모듈이 동시에 게이트를 걸 때는 본 §9 의 우선순위 표가 분쟁을 해소해요 (sre §1.4 + management §2.3 → 관행 트리는 결정 게이트의 *상류* 가 아니라 *하류* 에 위치).

### §9.1 Hyperbrief 와의 boundary — promotion 결정의 escalation 분기

Greatpractice 의 promotion 절차 (§5: micro → mezzo, mezzo → macro 승급 결정) 는 본질적으로 **결정 분기점** 이에요 — 한 번 macro 로 승급된 관행은 always-on 컨텍스트 슬롯을 영구 점유하고, 모든 후속 turn 의 system prompt 토큰 비용을 증가시켜요 (harness §1.2 AGENTS.md always-on tax). 따라서 promotion 자체가 Hyperbrief 의 4-score escalation rubric 입력 후보예요.

**판정 규칙**:

| 조건 | 라우팅 |
|---|---|
| micro → mezzo 승급 (단일 스코프 영향) | Greatpractice 내부 결정 — Hyperbrief 미발화 |
| mezzo → macro 승급 (always-on slot 진입) | `blast_radius = 1` (one module) 으로 escalation 4-score 입력 → 합산 ≥ 4 면 FULL_HYPERBRIEF |
| 관행이 외부 adopter 의 spec 표면을 변경 | `touched_external_consumers ≠ ∅` MUST-trigger → 무조건 FULL_HYPERBRIEF |
| `phronesis_boundary = true` 결정 (관행 vs 정책 경계 판단) | Hyperbrief 라우팅 시도; Cynefin domain = `confused` 면 `DECISION_REJECT_FRAMING` 으로 회수 (humanities §1.2 phronesis 의 domain-judgment 우선) |

**phronesis_boundary 키의 의미**. `humanities §1.2` (Aristotle 의 phronesis — 실천적 지혜는 *상황 판단* 그 자체로, rule-following 으로 환원되지 않음) 가 시사하듯, 관행 트리에 codify 할 수 있는 것 (rule) 과 codify 하면 안 되는 것 (판단) 사이의 경계 결정은 그 자체가 high-stakes 분기예요. Greatpractice 가 자체적으로 그 경계를 정하면 *over-codification* (Allspaw 의 *runaway runbook* — sre §1.4) 위험; Hyperbrief 에 위임하면 4-score 가 적정 영역에서만 promotion 을 허용해요.

**역방향 의존성**. Greatpractice 가 Hyperbrief 의 trigger rubric 에 의존하는 것이지, 그 역은 아니에요 — Hyperbrief 는 Greatpractice 없이도 독립 동작해요. Greatpractice 는 `depends-on: Hyperbrief? (optional)` 관계.

### §9.2 Constellation 과의 boundary — trigger source · blameless 전파 · bridge respawn

Greatpractice 의 lifecycle hook (§4) 은 SessionStart / PreToolUse / Stop 등 harness 표면에 직접 걸려요. 그러나 *trigger source* 의 한 enum 으로 **A2A inbound** 가 들어와요 — 즉 다른 agent 가 보낸 `Delegate` / `Report` 가 도착한 시점에도 관행 hook 이 발화 가능해요 (sre §1.1 runbook 의 alert-payload-bundled-runbook-URL 원칙 — 외부 신호가 관행 호출의 1급 trigger).

**A2A inbound 가 trigger 가 되는 사례** (Constellation §13.16.9 의 A2A-intent allowlist 중):

- `Delegate` 수신 → 해당 작업 유형의 mezzo 관행이 자동 surface (예: spec 작성 위임 → "spec-drafting" mezzo 관행이 SKILL 처럼 활성).
- `BlockerManifest` 수신 → blocker 해결 macro 관행 (예: `feedback_a2a_relay_reliability` 의 main-broker history 직접 조회 패턴) 활성.
- `WorkerReport` 수신 → retire-stage 관행 (Superscalar §1 의 retire 단계와 인접하나 §9.3 에서 분리) 활성.

**blameless second-story 의 A2A 전파**. Greatpractice 의 incident-driven 학습 loop (§6: 실패 → second-story 추출 → 관행 노드 신규/수정) 는 sre §1.3 의 Allspaw blameless 계보를 따라요. 이때 *추출된 second-story 가 다른 agent 의 동일 패턴 실패를 예방* 할 수 있다면, Greatpractice 는 **A2A 채널로 second-story 패치를 전파** 해요. 채널 design:

```yaml
practice_intent:
  name: PracticeUpdate
  payload:
    node_path: "mezzo/a2a-emit/outbox-json-validation"
    second_story: "<blameless 서술 — first-story 의 'agent X 가 실수했다' 가 아니라 'agent X 의 시점에 그 결정은 합리적으로 보였다' 형식>"
    retro_action: "<관행 노드의 신규/수정 diff>"
    source_axis: "sre §1.3"
```

**`PracticeUpdate` 는 Constellation §13.16.9 A2A-intent allowlist 에 추가** 되어야 해요 — `Delegate` / `Report` 와 동급으로 메시지 wakeup 을 트리거하지만, 메시지 자체는 *결정 위임* 이 아니라 *학습 전파* 이므로 Hyperbrief 트리거에선 제외 (§9.4 표 참조). 본 spec 의 §11 (Cut Scope) 에 PracticeUpdate 의 단일-라인 JSON 양식이 등록돼요.

**bridge respawn = SessionStart blocking hook 의 source**. Constellation 의 핵심 운영 규율 중 하나는 *세션 재개 / IDE 재부팅 / 부팅 직후 first action 으로 bridge 를 verify + spawn* 해야 한다는 것 (`memory/feedback_session_resume_bridge_spawn` evidence). Greatpractice 는 이 규율을 macro 관행 노드 `boot/bridge-respawn` 으로 등록하고, 그 노드의 enforcement 를 **harness 의 SessionStart blocking hook** 으로 mechanize 해요 (harness §1.3 PreToolUse 결정성 차용). 즉:

- **Greatpractice 가 소유** = 노드의 SSoT (서술 · second-story · 트리거 조건).
- **Constellation 이 소유** = bridge 의 transport 사양 (lockfile · launch idempotency · server-side dampener — §13.16.1-.4).
- **harness hook 이 소유** = 실행 시점의 결정성 (SessionStart 블록 + exit code 1 면 차단).

세 모듈이 **disjoint** 한 layer (관행 codification · 통신 사양 · 실행 시점) 를 각자 다뤄요.

### §9.3 Superscalar 와의 boundary — retro-backfill 의 parallel migration

Greatpractice 의 v0.1.0 첫 cut 은 EG dogfood evidence (memory feedback 11 개 — `feedback_*.md` 시리즈) 를 retro-backfill 해서 관행 트리의 seed 노드로 변환해야 해요 (§11 Adoption). 이는 *11 개 feedback → 9-section schema 의 병렬 migration* 작업이고, 자연스럽게 Superscalar 의 **Stage 2 lane-class read fan-out** 후보예요.

**판정 매트릭스** (Superscalar §2 lane-class 분류 + §5 adoption-thresholds 적용):

| 작업 | lane class | speculation | issue_width |
|---|---|---|---|
| 11 feedback 의 schema 추출 (read-only — 원본 미수정) | `read` | off (deterministic 추출) | `issue_width_read` cap (runtime concurrency ceiling 우선 — `min(16, cores−2)`) |
| schema 검증 + cross-link 정합성 체크 | `read` | off | 동일 |
| 관행 트리 노드의 신규 commit (`practices/` 디렉터리 write) | `write` | off | `issue_width_write = 2-3` (Superscalar §5 default — 충돌 게이트 적용) |

**합당성**. 11 feedback 의 schema 추출은 (a) 파일 간 read 의존성 없음 (각 feedback 은 독립 single-file), (b) 결과물의 spec-conformance 가 결정적 (9-section schema 입력/출력 모두 명세화), (c) 실패 시 rollback cost = 0 (read-only) — Superscalar 의 `is_independent` + `is_disjoint_files` + `low_rollback_cost` 세 게이트를 모두 통과해요. cost-benefit 게이트 (§2) 도 충족: 직렬 시 ~11 × 단위시간, 병렬 시 1 × 단위시간 + 약간의 merge 오버헤드 → 보수적으로 5× 가속.

**Stage 2 의 의미** (Superscalar §1 Stage 2 = post-v0.2 patch — alias branches · lane-class differentiation 본격 도입). 본 backfill 은 Stage 2 의 첫 Greatpractice-driven dogfood entry 가 돼요. Entry 결과는 Superscalar 의 ledger (§Entry 06 예정) + Greatpractice 의 §11 Adoption 양쪽에 cross-reference.

**경계 명시**. Greatpractice 는 **무엇을 fan-out 할지 (작업 단위 식별)** 만 결정하고, **어떻게 fan-out 할지 (실제 dispatch · lane manifest · retire stage)** 는 Superscalar 에 위임. 두 모듈의 책임이 disjoint — Greatpractice 가 자체 dispatch 로직을 가지면 Superscalar 와 중복.

### §9.4 Hook 간 boundary — Greatpractice (운영 패턴) vs Hyperbrief (의사결정 게이트)

세 모듈 모두 harness hook 표면에 진입 가능하므로 hook 순서 + 우선순위 규칙이 필요해요. processor §1.3 (out-of-order execution + dependency tracking) + os §2.1 (kernel preemption priorities) 의 priority-inheritance 패턴을 차용:

**Hook 표면별 매트릭스**:

| Hook 시점 | Greatpractice | Hyperbrief | Constellation |
|---|---|---|---|
| SessionStart | `boot/bridge-respawn` 노드 + 환경 sanity macro 관행 enforce | — (결정 게이트는 turn 단위) | bridge verify + spawn |
| UserPromptSubmit | trigger source = `user_input` 으로 관행 surface 후보 결정 | trigger rubric 입력 (escalation 4-score 계산) | inbox cursor probe (§13.16.6) |
| PreToolUse | 도구별 micro 관행 enforce (예: `outbox.jsonl` append → JSON 단일라인 검증) | escalation ≥ 4 면 도구 호출 차단 → DECISION_REQUEST 발화 | A2A intent 분류 + redaction (§13.14) |
| PostToolUse | 결과의 second-story 추출 (실패 시) → §6 학습 loop | decision_lineage 등록 | ack 3-tier 추적 (§13.13) |
| Stop / turn-end | cycle-end 6-element ritual (§13.16.6) 의 관행 enforce | self-throttle 통계 갱신 (§2.4) | cursor advance + watcher rearm |

**Overlap 시 우선순위 — Hyperbrief 가 우위**:

같은 시점에 Greatpractice hook (운영 패턴 enforce — 예: "outbox push 전 cursor probe") 과 Hyperbrief hook (의사결정 게이트 — 예: "이 push 는 외부 발행이므로 escalation 4-score 계산") 이 동시 발화하면, **Hyperbrief 가 우위** 예요. 근거:

- **운영 패턴은 결정 *후* 표면** — 관행은 "이미 결정된 행동을 어떻게 잘 수행할지" 이므로, 결정 자체가 위임되어야 한다면 (Hyperbrief 발화) 운영 패턴 enforce 는 *결정의 outcome 이후로 연기* 되는 게 맞아요 (management §2.3 Drucker 의 *decisions precede execution discipline* 참고).
- **debouncing**. 두 hook 이 동시에 outbox push 를 차단하면 surface 에서 *이중 표시* 됨 (Greatpractice "JSON 검증 실패" + Hyperbrief "FULL_HYPERBRIEF 필요") — Hyperbrief 우위로 직렬화 시 Hyperbrief 가 먼저 차단하고, 결정이 `accepted` 면 이어서 Greatpractice 의 운영 검증.
- **fail-fast 비용**. Hyperbrief 차단 후 `defer` / `reject_framing` 을 선택하면 Greatpractice 의 운영 검증 비용 자체가 소요되지 않음 — 직렬화의 cost-asymmetry (canonical §1.2 의 *fast path first*).

**예외 — PracticeUpdate A2A intent**:

§9.2 의 `PracticeUpdate` (blameless second-story 전파) 는 *학습* 메시지이지 *결정* 메시지가 아니므로 Hyperbrief 트리거에서 제외 (`anti-trigger` 추가 항목: trigger source = `practice_update` 인 경우 brief suppress). 동시에 Constellation §13.16.9 A2A-intent allowlist 에는 포함 — wakeup 은 필요하지만 결정 위임은 불필요한 *특수 클래스* 예요.

**Overlap 시 우선순위 — Greatpractice 가 우위인 사례**:

반대 방향의 예외 — Greatpractice 가 Hyperbrief 위에 있는 경우 = **macro 관행 `boot/bridge-respawn` 의 SessionStart blocking** (§9.2). 이 시점엔 Hyperbrief 의 결정 게이트가 발화할 turn 자체가 아직 시작 안 됐어요 (전제: bridge 가 살아있어야 inbox 가 흐르고, inbox 가 흘러야 결정 입력이 도착). 즉 Greatpractice 의 SessionStart hook 이 *결정 게이트의 전제조건* 을 enforce — overlap 이 아니라 *층위 분리*.

**요약 — 네 모듈의 layered architecture**:

```
[Greatpractice]   = 반복 작업 codification + 운영 패턴 enforce  (procedural memory)
[Hyperbrief]      = 결정 분기점에서의 escalation 게이트         (decision delegation)
[Constellation]   = agent 간 통신 + watcher liveness            (A2A transport)
[Superscalar]     = 한 agent 내 작업의 병렬 dispatch              (work dispatch)
```

네 모듈은 *상이한 표면* 을 다루며, 같은 표면에서 충돌할 때만 §9.4 우선순위 표가 적용돼요. 본 §9 의 boundary 규율을 따르면, 네 모듈을 동시 adoption 해도 *consistent + non-redundant* — Hyperbrief 자체가 §13.17 / §13.18 / Hyperbrief 의 3-section 분리 (Hyperbrief.md §8.5) 로 검증한 동일 패턴 (boundary 명시로 overlap 회피) 의 재적용이에요.

---

## §10. Adoption Thresholds

> Greatpractice 는 *모든 워크스페이스에 권장되는 보편 모듈* 이 아니에요. codification 의 cost (frontmatter boilerplate · hook fatigue · institutional rigidity) 가 ROI 를 초과하는 운영 형태가 분명히 존재해요. 본 §은 *언제 채택해야 하는가* 의 임계 + *언제 채택하면 해롭다* 의 anti-criteria + *최소 채택 시 어떻게 시작하는가* 의 floor + *spec 만 채택 + plugin 미채택* 의 부분 채택 경로 + 과잉 codification 의 institutional 위험 (Powell-DiMaggio coercive isomorphism) 을 다뤄요. Constellation / Superscalar / Hyperbrief 와 동일한 *opt-in 모듈* 위치를 유지해요.

### §10.1 When to adopt (3 조건 AND)

세 조건을 **동시에** 만족할 때 Greatpractice 채택의 ROI 가 positive 로 전환돼요. 한두 조건만 만족하면 부분 채택 (§10.4) 으로 충분하고, 세 조건 모두 미달이면 §10.2 의 anti-criteria 영역에 가까워요.

| 조건 | 임계 | 근거 (cross-axis 출처) |
|---|---|---|
| **운영 cycle 누적** | ≥ 5 cycle | os §1.1 working set τ tuning — backward-window 5 회 미만이면 working set 추정 자체가 noise. psychology §1.10 Lally probation 의 *probation phase 진입 = 최소 30일 또는 등가 cycle 수*. |
| **반복 violation 발생** | 동일 패턴 ≥ 3 회 / 2 종 independent triggers | canonical §1.2 notability gate (significant coverage ≥ 3 + independent triggers ≥ 2 + verifiable effect). 3 회 누적이 *진짜 trigger* 임을 입증 — 1-2 회는 noise 가능. |
| **codify 대상 surface 보유** | ≥ 11 surface | EG dogfood evidence (phase_3 cycle) 의 retro-audit — 11 항목 미만이면 macro/mezzo/micro tier 분리의 hierarchy ROI 가 cost (3-tier infra) 를 정당화 못 함. processor §1.1 의 cache hierarchy 가 *작은 working set* 에서는 single-level 이 optimal 인 것과 동형. |

추가 정성 조건 (3 조건 통과 후 confirm 용):

- **반복 작업 비율** ≥ 30% — 작업의 1/3 이상이 *전에 한 적 있는 형태* 의 변주 (memoization §1.4 Bellman DP overlapping subproblems 의 EG 등가).
- **multi-surface SSoT drift 관찰** ≥ 1 회 — N-way sync miss 가 *실제 운영에서 발생* (release-versioning-cadence dogfood evidence + Cluster H propagation).
- **stop hook 또는 등가 lifecycle hook 인프라** 가 *이미 운영 중* — Cluster B (deterministic hook) 의 prerequisite. hook 인프라 없는 상태에서 Greatpractice spec 만 채택은 *codified rule 의 enforcement 부재* → §10.5 의 coercive isomorphism 으로 가지 않고 *paper rule* 로 떨어져요.

### §10.2 When NOT to adopt (anti-criteria)

다음 운영 형태에서는 Greatpractice 채택이 ROI 를 *역전* 시켜요. *codification 자체가 해가 되는* 영역이라 humanities §1.12 의 phronesis-codify-boundary 가 정면 적용돼요.

- **단발 task / one-shot 작업**: 작업이 한 번만 수행되고 재발하지 않으면 codification 의 amortization 분모가 0. Aristotle phronesis 의 *rare + high-context + judgement-heavy* 영역 — 즉석 판단 (즉 *prudence*) 이 *명시 rule* 보다 우월. humanities §3.9.
- **single-cycle session**: 운영 cycle ≥ 5 미달 (§10.1 1조건 위반). working set 추정 noise → frontmatter 의 `last_referenced_turn` 통계 무의미 → Cluster F (freshness) 운영 불가.
- **phronesis-dense work**: 작업의 본질이 *judgement* 인 영역 — 예: 윤리적 결정, 창작 방향 결정, 정치적 협상, 의도 추론. 이 영역은 codify 시 *agent 의 즉석 판단 능력 위축* 의 negative externality 가 codification gain 을 초과 (humanities §3.9 + Polanyi tacit knowing).
- **soloist 1-인 1-cycle**: multi-agent residency 없이 single agent 가 single session 만 운영하면 Cluster H (cross-surface SSoT propagation) 의 가치 0 + Cluster I (phase-transition) 의 working-set rotation 불필요.
- **외부 강제 규율 우세 환경**: organization 의 기존 SOP / compliance 가 이미 동등 영역 cover 시 Greatpractice 는 *중복 거버넌스 층* — Powell-DiMaggio 1983 의 *coercive isomorphism* 이중 적용 위험 (§10.5).

### §10.3 Minimal viable adoption (MVA floor)

§10.1 3 조건 통과 후 채택을 결정하면, **floor 부터 시작**해요. 처음부터 full tree 를 작성하면 humanities §1.7 Gawande 의 *checklist bloat* + sre §4.3 의 *over-engineering* 함정에 빠져요.

```yaml
# MVA: minimal viable adoption 첫 cut
macro:   1-3 entries   # 도메인 governance ratio rule. _telos.md + 1-2 핵심 discipline.
mezzo:   5-7 entries   # 가장 빈번한 violation 의 procedure. 9-section schema 적용.
micro:   hand-curated  # auto-promotion 금지. 수동 선별만 (5-10 atom).
hooks:   2-3 lifecycle events  # SessionStart + Stop + 1 PreToolUse(matcher) 부터.
frontmatter schema: 6 필드 floor  # tier, trigger, evidence-quality, recommendation-strength, last_referenced, supersedes.
```

이 floor 의 정당화:

- **macro 1-3**: management §1.10 Wikipedia 5 pillars 가 5 항목이지만, 처음 cut 은 *가장 binding 한 3 항목* 까지로 축소. 5 채우려는 압박이 *artificial pillar* 생성 위험.
- **mezzo 5-7**: humanities §1.7 Gawande checklist 의 *killer items only / 5-7 항목 상한* 와 일치. Cognitive load 의 working memory chunk 한계 (Miller 7±2) 의 직접 적용.
- **micro hand-curated**: processor §1.7 RRIP 의 *default rrpv = max-1* 와 동형 — 신규 entry 는 *단명 가정*. auto-promotion 은 통계 누적 (≥ 30 cycle) 후 enable.
- **hooks 2-3**: Cluster B (deterministic hook) 의 ROI 가 *3 hook 까지는 linear*, *5 hook 초과는 fatigue 가 marginal value 초과* (humanities §1.7 60-90s budget + sre §4.3).
- **frontmatter 6 필드 floor**: Cluster C 의 *9/9 universal convergence* 가 fully populated schema 를 권장하지만, MVA 는 6 필드 minimum. 나머지 (RRPV / coherence / freshness_until / surfaces 등) 는 진입 후 backfill.

MVA 운영 cycle 5-10 회 후 *retro-audit* 으로 (a) hook fire 빈도, (b) frontmatter 필드 사용 빈도, (c) entry 의 last_referenced 분포 를 측정 → 다음 cut 의 expansion 결정해요.

### §10.4 Plugin 의존성 분리 (spec only adoption)

Greatpractice 는 **spec (본 문서) 채택 + plugin (`plugins/greatpractice/`) 미채택** 의 부분 adoption 도 valid 한 경로예요. Constellation / Superscalar / Hyperbrief 와 동일한 opt-in 옵션성.

| Adoption mode | 채택 범위 | 운영 형태 |
|---|---|---|
| **Full** | spec + plugin (hook · skill · runtime) | hook 자동 enforcement + lifecycle event 자동 처리. §10.1 3 조건 통과 + 인프라 의지 있는 운영. |
| **Spec only** | 본 문서의 schema + tier hierarchy + maturation gate 만 채택 | tree 는 작성하되 enforcement 는 *agent 의 self-discipline*. plugin runtime 미설치. |
| **Schema only** | frontmatter schema (§3.2) 만 채택 + tree 미작성 | 기존 memory feedback 들에 frontmatter 만 retro-backfill. 가장 가벼운 진입. |
| **Hook subset** | spec + plugin 의 2-3 hook 만 (SessionStart + Stop) | full plugin 채택 전 incremental 도입. §10.3 MVA 와 일치. |

Spec-only mode 의 가치:

- *codification discipline* 의 normative 효과는 spec 자체에서 옴 — humanities §3.9 phronesis boundary + canonical §1.12 notability gate 의 *언어* 가 self-discipline 의 framework 가 돼요.
- plugin runtime 부재 시 *hook fatigue 위험 0* — §10.5 의 coercive isomorphism 위험을 피하면서 codification 의 conceptual gain 만 추출.
- *향후 plugin 채택 경로 보존* — schema 가 일치하면 spec-only → full 의 migration cost 가 hook spec 추가 + runtime 설치만.

### §10.5 Anti-pattern alerts (institutional risk)

Greatpractice 의 *과잉 채택* 은 Powell-DiMaggio 1983 의 **coercive isomorphism** (강제적 동형화) 위험을 유발해요. institutional anthropology 의 핵심 경고예요 (부록 B §B.6).

**Coercive isomorphism**: 외부 강제 (hook 차단 · enforcement_level=mandatory · 위반 시 block) 가 누적되면 organization 이 *innovation 저해 + path dependency lock-in* 의 long-term 비용을 부담해요. Powell-DiMaggio 의 수백 case study 가 정량 증거 제공.

**EG 컨텍스트의 isomorphism 3 종 매핑**:

| Isomorphism 유형 | EG 구현 표면 | 과잉 시 위험 |
|---|---|---|
| **Coercive** (외부 강제) | hook enforcement_level=mandatory + exit 2 차단 | agent autonomy decay — 매 turn 의 hook gate 통과가 *진짜 작업* 보다 우세 |
| **Mimetic** (모방) | 시드 원본 복사 + 다른 워크스페이스 패턴 차용 | 컨텍스트 mismatch 채택 — 출처 워크스페이스의 phronesis 영역을 본 워크스페이스에 강제 |
| **Normative** (전문직 규범) | AGENTS.md telos + macro tier _telos.md | telos 의 *경직화* — 진화 vocabulary (humanities §1.2 distinguish/per-incuriam/overrule) 부재 시 telos 가 *immutable* 신화로 떨어짐 |

**구체 anti-pattern 5 종**:

1. **enforcement_level=mandatory 비율 과잉**: 전체 entry 중 mandatory 비율 ≥ 50% 면 alert. Cluster B (deterministic hook) 의 ROI 가 *3-5 hook 까지는 linear, 초과 시 fatigue 가 marginal value 초과*. 권장: mandatory ≤ 20%, recommended 50%, advisory 30% 정도의 분포.
2. **hook 과잉 (≥ 7 lifecycle event)**: humanities §1.7 Gawande 60-90s budget 직접 위반. agent 의 *진짜 작업* 시간이 hook 처리에 잠식.
3. **macro tier 비대화 (≥ 10 ratio rule)**: management §1.10 Wikipedia 5 pillars 가 5 항목인 것 — *binding rule 의 cognitive ceiling*. macro 10 초과는 *모두가 binding* → *아무것도 binding 아님*.
4. **frontmatter schema bloat (≥ 20 필드)**: Cluster C 의 full schema 도 12-15 필드 권장 (Contradiction 1 의 lazy 3-layer 와 frontmatter-driven 의 cost trade-off). 20 초과는 entry 1 개 load 시 frontmatter 만으로 200+ tokens — lazy hierarchy 침식.
5. **phronesis 영역 invasion**: §10.2 의 anti-criteria 영역에 hook 적용. 예: 창작 방향 결정 prompt 에 keyword-trigger context inject — 즉석 판단 능력 위축. humanities §3.9 의 직접 위반.

**Mitigation discipline**:

- 정기 isomorphism 검토 (quarterly 또는 50 cycle 마다): mandatory 비율 + hook 수 + macro tier 수 + frontmatter 필드 수의 측정 + threshold 초과 시 retire 큐 검토.
- **enforcement_level escalation 의 *명시적 maintainer confirm***: advisory → recommended → mandatory 의 escalation 은 자동화 금지. maintainer confirm 필수 (Hyperbrief IR 4-score escalation 의 직접 적용).
- **mimetic 차용의 컨텍스트 audit**: 다른 워크스페이스 / 시드 원본의 entry 를 mimetic 차용 시 *해당 워크스페이스의 phronesis 영역* 와 매칭 검사. mismatch 면 차용 거부.

이 mitigation 이 *Greatpractice 의 self-limiting principle* 이에요 — 모듈이 자기 자신의 institutional drift 를 검사하는 메타 layer.

---

## §11. v0.1.0 Cut Scope

> v0.1.0 은 *spec 의 첫 cut* 이지 *완성판* 이 아니에요. 9-axis cross-domain synthesis 에서 도출된 모든 가치 항목 중 — **deterministic enforce 가능 + 빈번 violation + 단일-host (Claude Code) ship 가능** 3 조건을 모두 만족하는 부분만 v0.1 에 담아요. 나머지는 명시적 deferred 표에 적재해 *deferred ≠ 폐기* 원칙을 보장 (§7.4 *distinguish* 의 사전 적용 — 좁은 context 한정 보존). v1.0 까지 4-5 minor cut 으로 maturation 하는 패턴은 Hyperbrief v0.1 → v0.5.6 의 7 cut 궤적을 따라요.

### §11.1 In scope — v0.1.0 ship surface

> *(v0.2.1 정정 codicil: 본 절의 초안은 design-시점 목표 트리를 'ship surface' 로 기술했어요 — 실제 v0.1.0 cut 이 ship 한 것은 아래 실재 목록이고, 초안의 잉여분 (runtime 5종 cjs / hooks 3종 / skills 5종 / templates 3종 / settings 확장 / canonical tree 의 가상 entry 목록) 은 §11.2 deferred 로 이동했어요. 정확한 plugin ship 목록의 동기 SSoT 는 `plugins/greatpractice/README.md`.)*

**Spec 본문** (`EstreGenesis/Greatpractice.md`):

- §1 — §12 analytical content (개념 정의 → tier hierarchy → entry schema → hook → maturation gate → voice → freshness → SSoT propagation → 인접 모듈 boundary → adoption threshold → cut scope → implementation notes).
- 부록 A: cross-axis convergence cluster catalog (9 cluster 1-줄 요약).
- 부록 B: 4 strong isomorphism + 2 normative 정당화 — distributed cognition + organizational anthropology backfill (humanities §1.9 + management §1.4 cross-ref).
- 부록 C: self-application — 본 spec 자체가 Greatpractice frontmatter schema 를 만족하는 reflexive evidence (§3 의 dogfood-zero).

**Canonical tree** (`EstreGenesis/greatpractice/`):

- `_schema.md` — entry frontmatter spec (§3.2 의 v0.1 mandatory 7-field + tier-conditional 의 산문 normative 정의).
- `INDEX.md` — macro chunk summary, ≤ 300 token cap (**entry corpus 의 현행 SSoT** — 아래 구조의 실 entry 목록은 본 파일이 정본).
- `macro/` · `mezzo/` · `micro/` — 3-tier 디렉토리 구조. entry 는 고정 목록이 아니라 **dogfood 로 누적** — v0.1.0 은 1 macro (`release-cadence`) + 1 mezzo (`outbox-json-validation`) 로 시작, v0.2.0 mezzo batch ratification 으로 1 macro + 9 mezzo + 1 micro 로 확장 (frontmatter status 참조).
- `_propose/` — maturation pipeline 의 후보 적재 디렉토리 (P0 진입 사전조건). (`_archive/` 는 첫 retire 발생 시점에 생성 — v0.1-0.2 미존재.)

**Plugin** (`EstreGenesis/plugins/greatpractice/` — 실재 ship, `plugins/greatpractice/README.md` 와 동기):

- `.claude-plugin/plugin.json` — name=greatpractice, version=0.1.0, depends-on 명시 (none required, optional synergy).
- `schemas/` 3 종: `entry-frontmatter.schema.json` · `hook-spec.schema.json` · `voice-rules.schema.json`.
- `hooks/contact/` 1 종 (management §1.8 *poka-yoke* contact 유형): `outbox-json-validate.cjs` — `outbox.jsonl` direct append 차단 + JSON roundtrip 검증 (mandatory enforcement_level, exit 2 on fail).
- README 의 PreToolUse 등록 예시 — adopter settings 통합 가이드.

### §11.2 Deferred to v0.2+

| 기능 | 출처 축 § | 보류 사유 |
|---|---|---|
| `runtime/` 5 종 cjs (`eg_greatpractice_lint` · `eg_greatpractice_promote` · `eg_voice_check` · `eg_freshness_probe` · `eg_build_index`) | §4-§7 각 enforce 표면 | v0.1 은 수동 lint/promote 로 충분 — deterministic runtime 은 entry corpus + 운영 evidence 누적 후 (v0.2.1 정정: §11.1 초안의 ship 기술에서 이동) |
| 추가 hooks 3 종 (`fixed-value/n-way-sync-check` · `motion-step/pre-send-inbound-sequence` · SessionStart bridge-verify) + UserPromptSubmit 1 종 | management §1.8 poka-yoke 3 유형 | contact 1 종 (outbox-json-validate) 의 운영 baseline 확인 후 — 유형별 1개씩 점진 (v0.2.1 정정: 동일 이동) |
| `skills/` 5 종 (`greatpractice-author` · `-promote` · `-fault` · `practice-toil-score` · `voice-check`) | §3-§6 작성/격상/voice 표면 | 수동 작성 + 모델 보조로 v0.1-0.2 충분 (v0.2.1 정정: 동일 이동) |
| `templates/` 3 종 (macro / mezzo / micro entry template) | canonical §1.2 | `_schema.md` + 기존 entry 모방으로 충분 — template 은 corpus ≥ 20 부터 (v0.2.1 정정: 동일 이동) |
| Settings 확장 (Stop hook wrap `eg_stop_hook_extensions.cjs` 등) | §4.4 | adopter-측 통합 설계 — plugin ship 표면이 아니라 adopter 가이드 (v0.2.1 정정: 동일 이동) |
| `manifest.json` content-addressed hash index | memoization §1.8 (Bazel/Nix) | BLAKE3 의존 + 첫 cut 에서 hash 안정성 검증 필요 |
| `renderers/` package (entry → derived surface auto-gen) | canonical §1.11 | v0.1 에서는 수동 surfaces[] 유지로 충분 — 자동화는 entry corpus ≥ 20 부터 ROI |
| `eg_load_working_set.cjs` 자동화 | os §1.1 (Denning), §1.6 | 수동 lazy materialization 의 안정 baseline 필요 (P1-P2 maturation) |
| `collab/practice_*.{jsonl,json}` 누적 | os §1.1 + processor §1.7 | 운영 telemetry — 30-90일 누적 dataset 사전조건 |
| `rrpv` + `miss_count` 활성 | processor §1.7 (RRIP/BRRIP) + §3.8 (3C miss grid) | v0.1 frontmatter 에는 placeholder 만, 자동 채점은 v0.2 |
| SHCT trigger_source 통계 자동 누적 | processor §1.8 | 8-source enum 만 v0.1 활성, 빈도 통계는 v0.2 |
| TAGE multi-scale confidence predictor | processor §1.9 | v0.3 prefetch heuristic 의 prerequisite (RRPV 안정 후) |
| phase enumeration + phase-transition prefetch | os §1.8 + processor §3.7 | 30-90일 history 사전조건 |
| voice linter intent classification 확장 (regex → ML) | sre §1.3 | v0.1 regex MVP 의 false-positive rate < 5% 확인 후 |
| toil rubric 자동 채점 (6-rubric) | sre §1.2 | v0.1 수동 채점 + skill 보조로 충분 |

### §11.3 Deferred to v0.3+

| 기능 | 출처 축 § | 보류 사유 |
|---|---|---|
| `mcp/` MCP server (gp_query / gp_load / gp_promote) | harness §1.3 | multi-agent residency (A2A counterpart 합류) 가 사전조건 |
| MESI multi-agent coherence broadcast | processor §1.11 | 동상 — v0.1 은 단일-agent coherence 만 |
| CRDT-based eventual coherence | — | strict broadcast 의 fallback path — multi-agent 사전 |
| Catchball protocol | management §1.7 (Hoshin Kanri) | owned surface multi-agent 협상 — multi-agent 사전 |
| Dreyfus maturity-tagged adaptive verbosity | psychology §1.1 | entry 의 *novice/competent/expert* 자동 분기 — 누적 사용 통계 사전 |

### §11.4 Deferred to v0.4+

| 기능 | 출처 축 § | 보류 사유 |
|---|---|---|
| CMMI L4 effectiveness measurement | management §3.5 | 수십 cycle 의 *post-codify hit-rate ≥ pre-codify recurrence-rate* dataset 사전 |
| Practice budget governance | sre §3.3 | toil 자동 채점 + fatigue budget 측정 baseline 사전 |
| Hash-based reproducibility audit | memoization §3.6 | v0.2 content-addressed hash 안정 사전 |
| Dry-run wheel of misfortune | sre §3.6 | dogfood evidence 누적 + 4 종 hook 안정 사전 |
| M&M periodic codification cycle | humanities §3.5 | 90-180일 cadence — Greatpractice 자체의 freshness probe 안정 사전 |

### §11.5 v1.0 readiness rubric — 측정 가능 criteria

Hyperbrief §11.5 의 two-lens 패턴을 차용해요. v1.0 GA 는 maintainer-discretion label 이 되지 않도록 명시적 score 통과 사전조건을 정의. **Lens A** (module-wide GA) 6 dimension + **Lens B** (단일-host marketplace) 5 dimension (Lens A 에서 *cross-host portability* 제외).

| # | Dimension | 측정 | Scoring anchors (0/5/10) |
|---|---|---|---|
| 1 | **Spec completeness** | §1 — §12 + 부록 A-C + 모든 v0.x candidate patches 닫힘 | 0 = 본문 절반 / 5 = 전 § 존재 + gap / 10 = candidate 0 |
| 2 | **Schema stability** | entry-frontmatter + hook-spec + voice-rules 의 최종 major break 이후 경과 | 0 = 1 주 내 break / 5 = 수 주 안정 / 10 = 30+ 일 + candidate 0 |
| 3 | **Dogfood evidence 누적** | (post-codify) hit-rate ≥ (pre-codify) recurrence-rate 충족 entry 수 | 0 = 0 / 5 = 4-5 (현 mezzo 의 절반) / 10 = 모든 ratified entry |
| 4 | **Critic patch absorption** | 9-axis cross-axis-patterns + completeness-critic 의 patch 권고 흡수율 | 0 = 0% / 5 = 50% / 10 = 100% (deferred 명시 포함) |
| 5 | **Module boundary 안정** | Constellation §13 + Superscalar §3 + Hyperbrief §1 와의 boundary 정의 후 boundary-renegotiation 발생 횟수 (90일 window) | 0 = 빈번 (3+) / 5 = 1-2 / 10 = 0 |
| 6 | **External adopter validation** *(Lens A only)* | EG 외부 fork / 다른 seed-tier adopter 의 dogfood report | 0 = 없음 / 3 = n=1 / 6 = n=2-3 / 10 = n=5+ |
| 7 | **Determinism guarantee** | 동일 entry corpus + 동일 hook spec → 동일 enforce 결과 invariant 검증 | 0 = test 없음 / 5 = smoke pass / 10 = n≥5 환경 연속 |

**Aggregation**: Hyperbrief §11.5.2 패턴 차용 — `simple_mean` + `weighted_mean` 양쪽 보고. 기본 가중치: `Dogfood evidence × 2.0` (가장 load-bearing — codify 자체의 정당화), `Schema stability × 1.5` · `Module boundary 안정 × 1.5` · `Determinism × 1.5`, 그 외 × 1.0.

**Thresholds**:

- **v1.0.0 cut (Lens A)**: simple + weighted 양쪽 ≥ **8.0**.
- **Single-host marketplace registration (Lens B)**: 양쪽 ≥ **7.5**.

**Re-evaluation cadence** (Hyperbrief §11.5.5 패턴): (a) dimension 의 ≥ 2-point 변동을 유발하는 release, (b) emergency-fix release (Dimension 1/2 timer reset), (c) 명시적 "v1.0 cut?" decision 시점. 첫 예정 re-evaluation = **2026-09-04** (v0.1 ship 후 90일, freshness cadence 의 macro tier default 와 동기화).

**Current scoring (v0.1.0-draft, 2026-06-04 기준 예측)**: Spec 8 · Schema stability n/a (첫 cut) · Dogfood evidence 0 (ship 전) · Critic patch absorption 7 (9-axis synthesis + completeness-critic 흡수 + 일부 deferred 명시) · Module boundary 6 (§9 정의 + 인접 spec cross-PR 미진행) · External adopter 0 (ship 전) · Determinism n/a. *simple mean ≈ 4.2 / weighted ≈ 4.0* — v1.0 까지의 gap 이 *dogfood evidence 누적 + external adopter + schema break-free window* 3 dimension 에 집중. v2.5.50 → v2.6.0 6 cut cadence 가 이를 점진 해소.

---

## §12. Implementation Notes

> Plugin = optional adapter — spec 만 채택도 valid 예요 (§10.4). 본 § 는 v0.1.0 cut 의 *참조 구현* (`plugins/greatpractice/`) 의 핵심 surface 만 짚어요. 디렉토리 full tree 와 cjs 의 line-by-line walkthrough 는 `plugins/greatpractice/README.md` 가 정본 — 본 §는 spec-level invariant 만 명시해서 alternative adopter (다른 harness · 다른 file layout · spec only) 가 동일 외형으로 호환 구현할 수 있게 boundary 를 그어요 (canonical §1.11 derived-view inversion 의 self-application).

### §12.1 Plugin 디렉토리 구조 요약

`plugins/greatpractice/` 의 v0.1.0 ship surface 는 다음 7 종이에요. (full tree 는 `plugins/greatpractice/README.md` §1 참조 — §2-§3 의 entry corpus `greatpractice/{macro,mezzo,micro}/` 와는 분리.)

| 디렉토리 | 역할 | 출처 § + 정당화 |
|---|---|---|
| `.claude-plugin/plugin.json` | 모듈 manifest (name=greatpractice, version=0.1.0, entrypoint) | Hyperbrief plugin 패턴 차용 |
| `schemas/` | JSON Schema 정본 (entry frontmatter / hook spec / voice rules) | §3 + §4 + §6 의 schema-as-SSoT |
| `runtime/` | cjs 실행 모듈 5 종 (lint / promote / voice-check / freshness / build-index) | §3.8 + §5.4 + §6.3 + §7.3 + §2.5 |
| `hooks/` | poka-yoke 3 유형 분류 (contact / fixed-value / motion-step) | §4.1 + management §1.8 |
| `skills/` | meta-skill 5 종 (author / promote / fault / toil-score / voice-check) | §5 + §6 의 facing surface |
| `templates/` | entry skeleton 3 종 (macro / mezzo / micro) | §3.3 tier-conditional density |
| `renderers/` (v0.2+) | entry → derived surface 자동 generator | §8 SSoT propagation (v0.1 = 수동) |

`mcp/` 디렉토리는 v0.3+ deferred (§11.3) — gp_query / gp_load / gp_promote MCP tool exposure 까지 multi-agent residency 사전조건 충족 후 진입해요.

### §12.2 Hook spec JSON schema 의 위치 + invariant

Hook spec 정본 = `plugins/greatpractice/schemas/hook-spec.schema.json` (draft-07). §4.2 의 7 필드 (event / matcher / condition / action / enforcement_level / tiered_strictness / fatigue_budget_ms) 를 그대로 직렬화해요. **Alternative adopter 가 자체 hook runtime 을 구현해도** — 이 schema 를 통과하는 spec 파일을 produce 한다면 본 모듈과 horizontally 호환 (psychology §1.8 의 *format-as-mechanism* — schema 자체가 d≈0.65 의 효과 source).

추가 schema 2 종:
- `entry-frontmatter.schema.json` — §3.2 의 v0.1 mandatory 7 필드 (id / tier / binding / enforcement_level / trigger / lifecycle / last_referenced_turn) + tier-conditional optional 들 (§3.3).
- `voice-rules.schema.json` — §6.3 regex linter rule (pattern / category / severity / rewrite_hint / examples) 의 declarative 표기. ML intent classifier 로 확장될 때도 본 schema 가 contract 로 유지.

### §12.3 voice-check.cjs regex MVP — runtime concrete patterns

§6.3 의 10 spec-level 패턴 (L1-L10, category + intent) 의 *runtime 구체화* 예요. 본 표는 `plugins/greatpractice/runtime/eg_voice_check.cjs` v0.1 의 실제 regex + severity matrix — `voice-rules.schema.json` 에 declarative 등록 + cjs 가 load.

| # | category | pattern (요지) | severity | rewrite hint |
|---|---|---|---|---|
| 1 | blame-attribution | `/[가-힣]+\s*(때문에|탓에)\s*(실패|miss|drop|에러)/` | block | objective 절 + multi-causal 절로 재기술 (§6.2) |
| 2 | blame-attribution | `/(누가|who)\s+(잘못|책임|fault)/i` | block | second-story 절로 재기술 (sre §1.3) |
| 3 | passive-idle-wait | `/(기다리|대기|wait(ing)?)\s+(중|만)\b/` | warn | needs-your-action surfacing 명시 (§6.5) |
| 4 | single-cause-framing | `/(원인은|root\s*cause(?!s))\s+\S+(이고|뿐|만)/` | warn | multi-causal 절 (≥ 2 contributing factor) 강제 (sre §1.3 second-story) |
| 5 | should-have | `/(했어야|should\s+have|당연히)\s+\S+/i` | warn | counterfactual → codification target 절로 전환 (humanities §1.6) |
| 6 | hindsight-bias | `/(역시|뻔히|당연한\s*결과)/` | warn | epistemic humility — psychology §1.13 |
| 7 | finger-pointing | `/(이\s*agent|that\s+agent)\s+(가|이)\s+\S*(놓쳤|miss)/` | block | system-level second story (Dekker) |
| 8 | absolutist | `/\b(절대|always|never)\s+\S+(안|못)\s/` | warn | binding ratio + 조건 명시 (humanities §1.1) |
| 9 | passive-voice-evasion | `/(되었|이루어졌|발생되었)다/` | advisory | 주체 명시 (objective 절) |
| 10 | meta-blame | `/(spec|hook|hyperbrief)\s*(가|이)\s+(부실|불충분|미흡)/` | warn | codification target 절로 재기술 (개선 hook proposal) |

**Hook block 메시지 self-application**: Cluster B (poka-yoke enforce) hook 의 `action.payload` 자체가 본 linter 를 통과해야 해요 — `hook-spec.schema.json` 의 `action.voice_checked: true` 가 default. 즉 enforce 메시지가 blame voice 면 lint block 으로 *부메랑* — Greatpractice 가 자기 자신에게도 적용되는 *self-applicative* 의 implementation 표현.

False-positive 통제: 각 pattern 의 `examples.positive[]` + `examples.negative[]` 가 schema 에 첨부, 변경 시 회귀 테스트. 30일 dogfood 측정 후 false-positive rate > 5% 면 pattern revise (§7.4 distinguish / per-incuriam cost tier 적용).

### §12.4 INDEX.md auto-generation script

`plugins/greatpractice/runtime/eg_build_index.cjs` 의 v0.1 동작:

1. `greatpractice/macro/*.md` 의 각 entry frontmatter parse → `id` + `title` + `binding` + `enforcement_level` + body 의 **첫 H1 직후 1줄 summary** (blockquote `>` line 또는 첫 문단의 첫 줄) 추출.
2. token count (TikToken-equivalent estimate, cl100k-base) 누적 — **300 token cap** (canonical §1.4 Wikipedia Summary Style 의 EG 변형). 초과 시 macro entry 수가 8+ 이라는 신호 → critic warning emit + 가장 stale 한 (last_referenced_turn 오래된) entry 의 line 을 *truncated marker* 로 대체.
3. mezzo / micro tier 는 INDEX.md 에 enumerate 하지 **않아요** — lazy materialization (§2.5 + os §1.6) 의 contract: macro 부터 fault-in, 필요 시점에 mezzo / micro 가 path-resolve.
4. output 은 `greatpractice/INDEX.md` 에 deterministic write — 매 ratification cut (`eg_greatpractice_promote.cjs` 가 호출) + cycle-end Stop hook extension (§12.6) 의 freshness scan 후 dirty 시 재생성.

빈 entry / phronesis_boundary=true entry 처리: enumerate 는 하되 summary 자리에 `(phronesis — inject reference context only)` marker. 다른 agent 가 *어떤 영역이 codify 금지 인지* 도 SessionStart inject 의 일부로 학습.

### §12.5 Lint fail vs warn 정책 + 6 cycle grace period

`plugins/greatpractice/runtime/eg_greatpractice_lint.cjs` 의 v0.1 policy (§3.8 의 spec-level 결정을 implementation 표면에 매핑):

| Field 결손 | v0.1 동작 | Grace period 후 (cycle ≥ 7) |
|---|---|---|
| `id` / `tier` / `trigger` 결손 | **block** (exit 2) — 식별 불가 entry 는 promote 자체가 위반 | block (변동 없음) |
| `binding` / `enforcement_level` / `lifecycle` / `last_referenced_turn` 결손 | **block** for *신규* promote, **warn** for *retro-backfill* (`source_evidence.retro: true` marker) | block (모두) |
| `evidence_quality` / `recommendation_strength` / `parent` / `children` (macro) | warn | warn (변동 없음 — GRADE 미평가 entry 도 ratify 가능) |
| `surfaces[]` / `coherence` / `audit_trail` | warn | warn (P2 surfaces 자동화 진입 시 block 으로 격상 검토) |
| `hash` / `deps` / `rrpv` / `miss_count` | silent (v0.1 placeholder) | silent (v0.2+ active 시 warn) |

**6 cycle grace period** 의 의미: 본 spec ship 직후 6 release cycle 동안 (≈ v2.5.50 → v2.5.55, §11 cut cadence 와 정렬) — 기존 운영 evidence (operational observations 누적 + EG dogfood evidence + phase_3 cycle 의 11 종 procedural feedback artifact) 의 점진 retro-backfill 을 허용. retro-backfill 항목은 frontmatter 에 `source_evidence.retro: true` marker + cycle counter 가 6 을 넘으면 lint 가 자동 block 으로 격상. 이는 management §1.3 kaizen baseline 의 *표준 도입 cost-amortization* — big-bang migration 의 cognitive load 회피.

Lint 실행 trigger:
- Pre-commit hook (inner repo) — `git commit` 직전 entry 변경분만 scan.
- `eg_greatpractice_promote.cjs` 내부 호출 — promote 직전 강제 통과.
- Cycle-end Stop hook extension (§12.6) — full corpus scan, dirty list emit (warn 만, block 안 함).

### §12.6 Stop hook 와의 boundary — thin wrapper + extension

기존 `EstreGenesis/constellation/reference/runtime/stop-hook/pre-send-probe.cjs --rearm` 는 **얇은 wrapper 로 유지**해요 (Constellation §13.x 의 inbox cursor advance + meaningful surface + watcher 재spawn 의 *기존 책임* 손상 회피). Greatpractice 의 cycle-end 추가 책임은 별도 모듈 `plugins/greatpractice/runtime/eg_stop_hook_extensions.cjs` 에 격리 + wrapper 가 sub-process call.

호출 순서 (deterministic):

```javascript
// pre-send-probe.cjs --rearm (thin wrapper, v0.1.0)
const probeResult = await runInboxCursorProbe();        // 기존 책임 1
const surface = await emitMeaningfulSurface(probeResult); // 기존 책임 2
await rearmWatcher();                                    // 기존 책임 3

// Greatpractice extension (new, opt-in via settings.local.json flag)
if (process.env.EG_GREATPRACTICE_STOP_EXT === '1') {
  await require('./plugins/greatpractice/runtime/eg_stop_hook_extensions')
    .run({ probeResult, surface });
}
```

extension 의 v0.1 책임 (§4.1 의 Stop event 행과 정렬):
1. **Freshness probe scan** — `last_validated_at + validation_cadence_days < now` entry 의 staleness list emit (warn only, §7).
2. **Hook fire 통계 누적** — `.claude/.hook_latency.jsonl` 에 본 cycle 의 hook fire 회수 + ms 기록 (§4.5 fatigue budget enforce 의 기반).
3. **INDEX.md dirty check** — macro tier mtime > INDEX.md mtime 이면 `eg_build_index.cjs` 호출 (§12.4).
4. **SSoT propagation diff** — 본 cycle 변경된 entry 의 `surfaces[]` 가 실제 surface (skill / hook / memory_stub) 와 sync 미달이면 warn (§8 의 entry-level inversion 검증).

v0.2+ 확장 (deferred — §11.2): working-set rotation + CLOCK scan, refault distance aggregation, SHCT trigger_source counter 누적, phase-transition 감지.

**왜 wrapper-extension 분리인가**: (i) 기존 `pre-send-probe.cjs` 의 책임은 Constellation §13 의 communication discipline 정본 — Greatpractice 가 그 자리를 *대체* 가 아닌 *증축* (§7.4 distinguish — 가장 싼 revision cost tier). (ii) extension 의 cjs 가 throw 해도 wrapper 의 기존 3 책임은 이미 완수 — Stop hook 의 cycle-end 신뢰성 보존. (iii) `EG_GREATPRACTICE_STOP_EXT=1` flag 가 opt-in — spec 만 채택 / plugin 미채택 adopter 도 본 wrapper 패턴은 그대로 호환 (§10.4 plugin 의존성 분리).

---

## 부록 A. Cross-Axis Convergence Cluster Catalog

> 본 부록은 v0.1.0 spec 의 §3-§7 (schema · hook taxonomy · maturation gate · voice framing · SSoT propagation) 가 의존하는 **9 클러스터** 의 1줄 요약 + 등장 축 수 + EG 적용 우선순위를 한 표로 모아둔 *quick-reference index* 예요. 각 cluster 의 패턴 ID · 축별 §번호 · contradiction 매트릭스 상세는 cross-axis 합성 원본 (`cross-axis-patterns §1`) 을 참조하세요. 본 부록은 spec 본문 (§3 schema · §4 hook · §5 maturation · §6 voice · §7-§8 freshness/SSoT) 에서 cluster ID 로 back-reference 되어요.

### A.1 9 Cluster One-Liner Catalog

| ID | Cluster | 1줄 정의 | 등장 축 수 | EG 우선순위 | spec 본문 anchor |
|---|---|---|---|---|---|
| **A** | Lazy 3-Tier Hierarchy | macro/mezzo/micro tier 분리 + on-demand load — 상위 tier 가 하위 tier 의 summary + pointer | **8/9** | **P0** | §2.1 tier · §4.1 SessionStart |
| **B** | Deterministic Hook Enforcement | 모델 판단 대신 lifecycle hook (6 event) 의 결정적 차단 / additionalContext inject | 7/9 | **P0** | §4.2-§4.7 hook taxonomy |
| **C** | Frontmatter-Driven Metadata Spec | YAML frontmatter 가 거버넌스 SSoT — tier · trigger · deps · enforcement · freshness · supersedes · evidence-quality · recommendation-strength · RRPV · edit_policy 통합 | **9/9** | **P0** | §3.2 schema |
| **D** | Maturation Gates | raw → draft → ratified 의 3단 게이트 — frequency × cost × predictability 임계 + notability (significant + independent + verifiable) | 5/9 + multi-criteria patch | **P0 정의 / P1 자동화** | §5.1-§5.3 promotion flow |
| **E** | Blameless Second-Story Framing | self-blame cascade 차단 — "given what we knew at the time" + multi-causal + single-root-cause 어휘 금지 | 4/9 | **P0** (regex MVP) | §6.1 voice linter |
| **F** | Freshness Validation Cadence | `last_validated_at` + `cadence_days` + hit-rate ≥ recurrence threshold — immutable practice 신화 회피 | 5/9 | **P1** | §7 staleness probe |
| **G** | Trigger-Source Attribution | SHCT signature-history + multi-scale (immediate / session / workspace) confidence 가중 평균 | 4/9 | **P2 통계 누적** | §4.2 trigger_source enum |
| **H** | Cross-Surface SSoT Propagation | canonical entry = master, 외부 표면 (badge / docs / plugin.json / marketplace.json) = derived view — `surfaces: []` inversion | 4/9 | **P1** | §8 N-way sync |
| **I** | Phase-Transition Awareness | 작업 phase 단위 working-set rotation — phase 시작 시 short τ, 안정화 후 long τ 확장 + snapshot 복원 | 4/9 | **P3 (phase enum 후)** | §3.7 phase-aware deferred |

### A.2 Cluster ↔ 9 축 Coverage Matrix

| Cluster | harness | humanities | psychology | management | processor | os | sre | memoization | canonical |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| A | O | O | O | O | O | O | O | O | O (8/9, sre=isomorphism) |
| B | O | O | O | O | O (간접) | · | O | · | O |
| C | O | O | O | O | O | O | O | O | O |
| D | · | O | O | · | O | · | O | · | O |
| E | · | O | O | O | · | · | O | · | · |
| F | · | O | · | O | O | · | O | O | O |
| G | O | · | O | · | O | · | · | · | O |
| H | · | · | · | O | · | · | O | O | O |
| I | · | · | O | · | O | O | O | · | · |

### A.3 핵심 합의 패턴 (cluster 내부 인용 1-2 종)

- **A** — Hennessy-Patterson L1/L2/L3/DRAM (`processor §1.1`) + Denning W(t,τ) working set (`os §2.1`) + Alexander pattern language (`humanities §3.8`) + Anthropic Skills 3-level progressive disclosure (`harness §1.1`) 모두 *latency × frequency × capacity tradeoff* 의 동일 식 도출.
- **B** — Gollwitzer 1999 implementation intention (d≈0.65) (`psychology §1.8`) + Shingo poka-yoke 3 type (`management §1.8`) + Gawande 2009 4-원칙 (`humanities §1.7`) — *format 자체* 가 효과 source.
- **C** — Wikipedia canonical-entry-schema 9-section (`canonical §1.12`) + GRADE 2-axis (`humanities §1.5`) + Lally 66일 lifecycle (`psychology §1.10`) — *9/9 universal convergence*.
- **D** — Wikipedia Notability 3-criterion (`canonical §1.2`) + Aristotle phronesis boundary (`humanities §3.9`) — 단순 frequency 만으로 부족, independent + verifiable 동시 통과 요구.
- **E** — Allspaw + Dekker blameless template (`sre §1.3`) + Kerth Prime Directive (`management §1.9`) — narrative fidelity 보존이 codification quality 의 prerequisite.
- **F** — Continuous PRR + Observability 2.0 (`sre §1.6`) + TPS kaizen baseline 12 주 window (`management §1.3`) + Wikidata revisit cadence (`canonical §1.11`) — 중앙값으로 micro 30일 / mezzo 90일 / macro 180일 default.
- **G** — Intel SHCT signature-history (`processor §1.8`) + TAGE multi-scale tournament predictor (`processor §1.9`) + Klein RPD cue-recognition (`psychology §1.13`) — 단일 trigger 신호 불충분, 3-scale 가중 평균.
- **H** — Wikidata → Wikipedia infobox sync (`canonical §1.11`) + Honeycomb single-source (`sre §1.9`) + Bazel/Nix content-addressed (`memoization §1.8`) — N-way sync miss 의 architectural 해법.
- **I** — Denning phase-transition signal (`os §1.4`) + Jouppi stream / victim buffer (`processor §1.10`) + Lally probation/consolidation/automatic (`psychology §1.10`) — phase enumeration 가 prerequisite.

### A.4 우선순위 rationale 1줄 요약

- **P0 (즉시 codify)** — A · B · C · D (정의) · E: 인프라 검증 완료 + ≥4 축 합의 + dogfood evidence 보유.
- **P1 (다음 1-2 cycle)** — D (자동화) · F · H: P0 frontmatter schema (C) 가 prerequisite.
- **P2 (5-15 cycle 누적 후)** — G: trigger_source enum 만 P0 에 포함, 통계 가중치는 누적 후.
- **P3 (multi-agent + phase enum 안정 후)** — I: Constellation 라이브보드 phase tag 통합 사전조건.

상세 contradiction 매트릭스 (eager vs maturation · prefetch vs lazy · strict vs eventual 등 8 종) 와 해소 조건은 spec 본문 §10 (Adoption) + cross-axis 원본 §2 참조.

---

## 부록 B. 4 Strong Isomorphism + Normative 정당화

> 본 부록은 §2 (3-tier hierarchy) / §3 (frontmatter schema) / §4 (hook taxonomy) / §5 (maturation gate) 의 architectural 결정이 단일 도메인 권위에 의존하지 않음을 입증하는 *multi-domain 증거 묶음* 이에요. 9 축 패턴 추출 결과 중 *완벽한 1:1 매핑* 으로 응고된 4 짝 isomorphism 을 §B.1-§B.4 에 정리하고, P0b modality (distributed cognition + organizational anthropology) 의 *normative 정당화 backfill 축약본* 을 §B.5-§B.6 에 둬요. v0.2 cycle 의 full research 가 완료되면 본 부록은 별도 §normative-foundations 절로 승격 예정 — 본 cut 은 v0.1 placeholder.

---

### §B.1 Isomorphism 1 — Lazy 3-Tier Hierarchy (8/9 축 universal convergence)

| 축 | 명칭 | 단위 | latency 비용 |
|---|---|---|---|
| processor (Hennessy-Patterson 2017) | L1 / L2 / L3 / DRAM | cache line | 1ns / 4ns / 12ns / 100ns |
| os (Denning 1968) | working set W(t,τ) — active / inactive / swapped | page | RAM hit / inactive scan / disk fault |
| memoization (Bellman 1957 + Haskell call-by-need) | hierarchical practice tree — overlapping subproblems | memo cell | cached / lazy materialize / recompute |
| canonical (Wikipedia Summary Style + `{{Main}}` hatnote) | lead / summary / full article | sentence / paragraph / article | inline / hatnote follow / spinoff load |

4 축이 *latency × frequency × capacity tradeoff* 의 동일 식을 다른 어휘로 도출. EG 의 macro / mezzo / micro 3 tier (§2.1) 는 본 4 축의 *EG-scaled instantiation* 이에요 — macro = L1 / lead / 항상 로드, mezzo = L2 / summary / phase 진입 시 로드, micro = L3+DRAM / spinoff / hook trigger 시 atom-load. harness §1.1 (Anthropic Skills 3-level) + psychology §1.7 (Chase-Simon chunking) + management §1.4 (SECI Ba) + sre §1.1 (Production Guide → PRR → Runbook → atom) 의 4 축도 동일 결론에 합류 — 본 isomorphism 의 *empirical 합의 8/9 축* 은 부록 A Cluster A 의 universal convergence 근거예요.

**정당화 적용**: §2.1 의 3-tier 분할 결정, §2.3 의 tier 별 frontmatter density 차등 (Cluster A 의 Level 1 ≤1024 chars cap 강제) — 본 isomorphism 이 architectural 정당화의 *first-principle* 출처.

---

### §B.2 Isomorphism 2 — Binding Rule + Advisory Commentary + Escape Valve (3-layer governance)

| 축 | binding layer | advisory layer | escape valve |
|---|---|---|---|
| humanities (Stare Decisis) | ratio decidendi | obiter dictum + illustration | distinguish / per-incuriam / overrule (§7.4 cost-tiered) |
| canonical (Wikipedia 5 pillars + RS + NPOV) | policy (BLP / V / NPOV) | guideline + essay | IAR (Ignore All Rules) |
| management (Drucker 1973 telos + ISO 9001 + IAR variant) | telos / mandatory standard | recommended practice | exception with justification |
| sre (runbook atom + production guide) | mandatory atom (block) | recommended atom (warn) | DECISION atom — 사람 판단 escape |

4 축이 *binding 강도의 3-stratum + 마지막 escape* 의 동일 거버넌스 구조를 독립적으로 도출. 본 isomorphism 이 §4.2 `enforcement_level: mandatory | recommended | advisory` 3-tier field 의 정당화이자 §4.3 BRD-tiered escalation (1차 BOLD soft → 2차 REVERT block+ack → 3차 DISCUSS+Hyperbrief) 의 출처예요.

**중요 nuance**: humanities §1.1 의 ratio / obiter 구분은 단순 *강도* 차이가 아니라 *추론 commit 의 다른 modality* (Brandom 의 inferentialism 어휘로 표현하면 *어떤 명제가 어떤 추론을 commit 하는가*) — 본 nuance 가 §3.2 의 `binding: ratio | obiter | illustration` 필드와 `recommendation-strength: MUST|SHOULD|MAY` 필드를 *서로 다른 axis* 로 분리하는 이유 (단일 field collapsing 회피).

---

### §B.3 Isomorphism 3 — If-Then Schema + Forcing Function + Atomic Check (deterministic hook)

| 축 | 형식 | 효과 크기 | enforcement modality |
|---|---|---|---|
| psychology (Gollwitzer 1999 implementation intention) | "if SITUATION X, then I will RESPONSE Y" | d ≈ 0.65 (meta-analysis 94 studies) | format 자체가 효과 — 산문 if-then 은 effect 0 |
| management (Shingo 1986 poka-yoke) | contact / fixed-value / motion-step 3 유형 forcing function | 결함률 ppm 단위 감소 | 물리적/논리적 차단 — 인지 의존 0 |
| humanities (Gawande 2009 checklist) | killer items 5-7 / pause point / 60-90s budget | WHO Surgical Safety Checklist 사망률 47% 감소 | pause-then-proceed 강제 |
| sre (Google SRE Ch.11 runbook) | atom = (command | check | decision) 3 유형 executable | MTTR 감소 (Beyer 2016) | code 형식 → 인간 판단 의존 X |

4 축이 *format 자체가 효과를 만든다* 는 동일 결론을 다른 도메인에서 도출. 가장 강력한 evidence: psychology §1.8 의 *산문 형식 if-then 은 effect 0, JSON-schema 형식만 d≈0.65* — 본 결과가 §4.2 hook spec 의 schema-strict JSON 강제 (`schemas/hook-spec.json`) 의 정당화이며, §3.2 frontmatter 의 `trigger.if` / `trigger.then` 2-field structured 강제 (산문 묘사 금지) 의 출처예요.

**적용 nuance**: humanities §1.7 의 *fatigue budget 60-90s + killer items 5-7* 제약이 본 isomorphism 의 *상한* — hook 이 deterministic 하더라도 checklist bloat 시 narrative fidelity 손실 (sre §4.3). 따라서 §4.5 hook frequency budget 은 본 isomorphism 의 *내장 cap*.

---

### §B.4 Isomorphism 4 — Evolution + Preservation + Cross-Reference 보존 (supersession graph)

| 축 | 진화 메커니즘 | 보존 메커니즘 | cross-reference |
|---|---|---|---|
| canonical (Wikipedia Merge 4-Phase + Redirect) | merge proposal → consensus → execute → redirect | redirect stub 영구 보존 | 모든 incoming link 보존 |
| humanities (Restatement supersession + Stare Decisis) | distinguish < per-incuriam < overrule (§7.4 cost-tiered) | 이전 holding 의 dissent / concurrence 보존 | 후속 인용 chain 유지 |
| management (TPS kaizen-baseline + supersedes graph) | `last_reviewed` + `supersedes:` + `superseded_by:` DAG | 이전 standard 의 *왜 변경했는가* 영구 기록 | kaizen 의 *baseline ≠ 박제* 명제 |
| memoization (Bazel/Nix content-addressed + dependency-tracked invalidation) | `hash:` 변경 시 dependent 자동 invalidate | content-address 영구 보존 (역방향 lookup 가능) | dependency DAG 의 transitive closure |

4 축이 *진화하되 history 손실 없이* 의 동일 결론을 도출. 본 isomorphism 이 §5.4-§5.6 의 promote / supersede / archive 운영 결정의 architectural 정당화이자 §3.4 frontmatter 의 `supersedes:` / `superseded_by:` / `redirect_from:` 필드의 출처예요.

**핵심 명제**: *삭제 ≠ redirect 제거* (canonical §1.3) — promote 후 memory feedback 자리에 1줄 redirect stub 으로 교체하되 원본 파일 경로는 살아있어야 cross-reference broken 방지. 본 명제가 §5.5 의 promotion 후 *redirect stub 강제* 의 정당화.

---

### §B.5 Normative 정당화 1 — Distributed Cognition + Extended Mind (Hutchins · Clark-Chalmers)

본 절은 modality backfill 의 축약본이에요. v0.2 cycle 의 full research 가 완료되면 별도 §normative-foundations.distributed-cognition 절로 승격.

**핵심 명제**:
- Hutchins (1995, *Cognition in the Wild*) 의 ship-cockpit / aircraft cockpit 분석: 인지는 *개인의 머리 안* 이 아닌 *system + artifact + person* 의 분산. navigation 의 *fix* 는 항해사 1인의 인지가 아닌 chart + instrument + crew 의 *집합적 인지 산물*.
- Clark-Chalmers (1998, *The Extended Mind*): notebook 도 mind 의 일부로 인정되려면 *coupling condition* 3 충족 — (a) **reliable** (필요 시 일관되게 접근 가능), (b) **accessible** (검색 / 회상이 직관적), (c) **automatically endorsed** (내용을 매번 의심하지 않고 신뢰).

**EG 적용**:
- §3.2 frontmatter 의 *왜 이 필드들인가* 의 normative ground = coupling condition 3 충족. `last_validated_at` + `freshness_until` = **reliable** (stale 자동 dim → 신뢰성 보장). `tier` + `paths:` + `surfaces:` = **accessible** (working-set 자동 load → 회상 비용 0). `enforcement_level` + `evidence-quality` + `recommendation-strength` = **automatically endorsed** (검증된 metadata 동반 → agent 가 매번 의심 안 함).
- 9 축 cross-axis 합성 (Cluster C: frontmatter SSoT 9/9 universal convergence) 은 *empirical* 정당화. Hutchins + Clark-Chalmers 는 *normative* 정당화 — *왜* extended mind 의 coupling 조건이 frontmatter 의 필수 axis 인가의 first-principle 근거.
- multi-agent residency (Phase 2.5) 진입 시: Hutchins 의 distributed cognition 이 Cluster H (cross-surface SSoT propagation) 의 normative 정당화. agent + tool + workspace 가 단일 인지 system 이라면 surface 분산은 *system 의 architecture* 이지 *implementation detail* 이 아님.

본 절이 normative gap 의 v0.1 placeholder 충당.

---

### §B.6 Normative 정당화 2 — Organizational Anthropology + Institutional Isomorphism (Douglas · Powell-DiMaggio)

본 절은 modality backfill 의 축약본이에요. v0.2 cycle 의 full research 가 완료되면 별도 §normative-foundations.institutional-isomorphism 절로 승격.

**핵심 명제**:
- Douglas (1986, *How Institutions Think*): institution 자체가 *분류 체계* 와 *기억* 을 가짐. 개인이 institution 의 카테고리로 사고를 *outsourcing* — codification 은 *institutional thinking* 의 메커니즘.
- Powell-DiMaggio (1991, *The New Institutionalism*) 의 isomorphism 3 메커니즘:
  - **Coercive** isomorphism: 외부 강제 (법규 / 규제 / hook block).
  - **Mimetic** isomorphism: 불확실성 하의 모방 (성공 모델 복제 / seed prompt 차용).
  - **Normative** isomorphism: 전문직 규범 (교육 / 학회 / telos).

**EG 적용**:
- §4.2 `enforcement_level: mandatory | recommended | advisory` 3-tier 가 isomorphism 3 메커니즘에 1:1 대응:
  - `mandatory` = **coercive** (hook block / exit 2 차단).
  - `recommended` = **mimetic** (additionalContext inject / suggested practice).
  - `advisory` = **normative** (frontmatter 만 + reference context — 전문직 규범에 가까운 soft codification).
- 본 1:1 대응이 *codification force 의 3 종 분류가 왜 정확히 3 종이며 더 추가할 필요 없는가* 의 normative 정당화 — Powell-DiMaggio 의 50년 누적 case study 가 *3 메커니즘 외 다른 isomorphism 압력은 존재 안 함* 을 입증.

**위험 명제**:
- Cluster B (deterministic hook) 의 *coercive 우세* 위험 — Powell-DiMaggio 의 isomorphism 압력이 *innovation 저해* + *path dependency lock-in* 의 정량 증거 (수백 case study).
- 즉 `enforcement_level: mandatory` 비율이 일정 상한 (대략 entry 의 20% 이하) 을 초과하면 institutional drift 발생 — agent 의 autonomy decay + 새 패턴 emergence 저해.
- sre §4.4 over-engineering 회피 노트가 본 위험의 *symptom-level* 처리. organizational anthropology 가 *root-cause-level* 정당화.

**적용 결정**:
- §4.2 의 enforcement_level 3-tier 채택 — Powell-DiMaggio 3 메커니즘 1:1.
- §4.5 hook frequency budget 의 정량 cap — mandatory 비율 ≤ 20% 권장 (본 수치는 v0.2 cycle 의 full research 후 정밀화).
- §5.3 maturation gate 의 *phronesis-codify-boundary* (humanities §1.12) 와 본 institutional drift 회피가 합성 — codify 하지 *말아야* 할 영역 명시가 normative 정당화의 핵심.

본 절이 분류의 v0.1 normative ground 충당.

---

### §B.7 본 부록의 상태 + v0.2 cycle 진입 조건

- **§B.1-§B.4** = 9 축 cross-axis 합성의 *4 짝 1:1 매핑* 확정분 — v0.1 ratified. cross-axis §부록 B 와 동기 (4 isomorphism 의 동일 enumeration).
- **§B.5-§B.6** = P0b modality backfill 의 *축약 placeholder* — v0.2 cycle 의 full research (distributed-cognition 축 + organizational-anthropology 축 각각의 9 패턴 추출) 완료 시 별도 절로 승격.
- **v0.2 진입 조건**: (a) 본 v0.1 spec 의 6-12 cycle dogfood 누적, (b) P0a 패치 (EG-specific 6 누락 + maturation gate 재합성 + 패턴 깊이 8 보강) 완료, (c) P0b modality 2 축 full research 완료. 셋 충족 시 v0.2 cut 의 부록 B 가 *normative-foundations* 본문으로 승격.

cross-axis 인용: `cross-axis §1 Cluster A-H 의 universal convergence` (empirical 정당화) + `critic §1.1 + §1.4 의 modality backfill` (normative 정당화) 의 합성이 본 부록의 두 layer 구조.

---

## 부록 C. Self-Application — 본 spec 자체의 frontmatter

> 본 부록은 Greatpractice.md v0.1.0 본문 spec 자체를 *macro tier ratified entry* 로 취급해 §3 의 entry schema 를 적용해 본 결과예요. *self-consistency* 가 1차 dogfood evidence — 본 spec 이 자기가 정의한 거버넌스 SSoT 양식을 만족하지 못하면 §3 schema 가 외부 entry 에 적용 불가능하다는 reductio. Cluster C 의 9/9 universal convergence 가 *본 spec 도 entry 의 일종* 이라는 reflexive 주장을 정당화해요.

### C.1 본 spec 의 entry frontmatter (proposed)

```yaml
---
# === Identity (§3.2 v0.1 mandatory) ===
id: greatpractice-module-spec
tier: macro
title: Greatpractice Module Specification
slug: greatpractice
created_at: 2026-06-04T00:00:00Z
last_referenced_turn: 2026-06-04T00:00:00Z

# === Evidence + binding (§3.2 mandatory · §3.3 macro-required) ===
source_evidence:
  - reports/2026-06-04-greatpractice-research/axes/         # 9 축 × {원본, patterns}
  - reports/2026-06-04-greatpractice-research/synthesis/    # cross-axis + critic + spec-hints
  - phase_3 cycle dogfood evidence (EG cuts v2.5.45-v2.5.49)
  - memory/feedback_*.md (11 항목 누적 — codification 의 raw source)
binding: ratio                            # humanities §1.2 — operative governance
enforcement_level: recommended            # 본 spec 자체는 advisory-ratio 중간 — §10 adoption gate 통과 후 mandatory 격상
evidence_quality: high                    # humanities §1.5 GRADE — 9 축 × multi-source backing
recommendation_strength: SHOULD           # 채택 결정은 EG 운영자 재량 — MUST 가 아님

# === Trigger (§3.3 — psychology §1.8 if-then format) ===
trigger:
  if: "EG-style 운영 cycle 도입 + 반복 violation ≥ 3 종 + active surface ≥ 11"
  then: "본 spec §1-§12 적용 + plugins/greatpractice/ scaffold 도입"
  format: prose-with-yaml                 # spec 본문은 산문, schema 부분만 YAML
  source: post-incident                   # 11 memory feedback + phase_3 cycle 의 16 sync-miss

# === Tier topology (§2.6 parent-child graph) ===
parent: null                              # macro root — 다른 macro entry 와 sibling
children:                                 # §5.4 routing 결과로 draft 진입 예정 항목
  - communication-discipline              # bridge lifecycle + a2a priority + pre-send probe
  - release-cadence                       # version + CHANGELOG 동시 cut
  - workspace-cleanliness                 # inner/outer 분리 + 운영 상태 gitignore
  - codification-boundary                 # phronesis_boundary scope 의 macro entry

# === Multi-criteria maturity (§5.1) ===
maturity_score:
  frequency: 5      # 11 memory feedback 이 frequency evidence
  depth: 5          # 9 axes deep research backing
  recency: 5        # 2026-06-04 현재 — staleness 0
  cost: 5           # 16 sync miss · 3 outbox drops · 다수 a2a 사건 누적 비용
  predictability: 4 # 대부분 패턴 predictable, phase-transition (Cluster I) 만 emergent
                    # — weighted sum 계산은 §5.1 공식 참조

# === Lifecycle (§3.3 · psychology §1.10 Lally 66 일) ===
lifecycle: probation                      # v0.1 ship 직후 0-30 일 — consolidation 진입은 30 일 후
coherence: soft                           # processor §1.11 MESI — multi-agent 정합성은 v0.3+
edit_policy: owned                        # canonical §1.9 — macro 는 owned 기본
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-04T00:00:00Z, agent: workflow-spec-draft, action: created, prev_hash: null}

# === SSoT propagation (§8 — Cluster H, 4 축 합의) ===
surfaces:
  - {kind: spec,        path: EstreGenesis/Greatpractice.md,                                  inherits_freshness: true}
  - {kind: plugin,      path: EstreGenesis/plugins/greatpractice/,                            inherits_freshness: true}
  - {kind: docs-badge,  path: EstreGenesis/docs/index.html#greatpractice-version,             inherits_freshness: true}
  - {kind: docs-page,   path: EstreGenesis/docs/greatpractice.html,                           inherits_freshness: true}
  - {kind: marketplace, path: EstreGenesis/.claude-plugin/marketplace.json#plugins[greatpractice], inherits_freshness: true}
  - {kind: readme,      path: EstreGenesis/README.md#modules-section,                         inherits_freshness: true}

# === Evolution (§3.4 — humanities §1.2 supersedes graph) ===
supersedes: []                            # 신규 모듈 — 이전 entry 없음
superseded_by: null
kaizen_baseline_since: 2026-06-04         # management §1.3 — "표준 ≠ 박제"

# === Deferred (§3.7 — v0.2+ 활성) ===
hash: null                                # BLAKE3(canonical_body) — v0.2+ memoization §1.8
deps: []                                  # 의존 entry hash — v0.2+
rrpv: 2                                   # processor §1.7 default mid-protect
miss_count: {compulsory: 0, capacity: 0, conflict: 0, coherence: 0}

# === Codify boundary (§5.3 — humanities §3.9) ===
phronesis_boundary: false                 # spec 본문은 codifiable — 본 spec 이 정의하는 boundary 규약과 별개
class: persistent                         # os §1.11 — cross-session
---
```

### C.2 §3 schema 적용 결과: 1차 dogfood checklist

| 검증 항목 | 결과 | 코멘트 |
|---|:-:|---|
| v0.1 mandatory 7 fields (id · tier · binding · enforcement_level · trigger · lifecycle · last_referenced_turn) 모두 populate | PASS | §3.2 lint scope 충족 |
| macro-required fields (children · surfaces · owner · audit_trail) 충족 | PASS | §3.3 macro 분기 |
| Multi-criteria maturity_score 5-axis 모두 정량 | PASS | §5.1 multi-criteria — frequency 단독 의존 회피 |
| Trigger if-then schema 형식 (prose X) | PARTIAL | spec 본문이 산문 + YAML 혼합 → `format: prose-with-yaml` 마커로 honest 표기. v0.2+ 에 §4 hook DSL 로 분리 검토 |
| surfaces[] 의 freshness 상속 모두 명시 | PASS | Cluster H · §8.5 catchball 사전조건 충족 |
| Phronesis boundary 명시 | PASS | spec 자체는 codifiable — `false` |
| edit_policy ↔ tier 정합성 (macro=owned) | PASS | §2.4 mapping 충족 |
| Deferred field placeholder (null/0) 명시 | PASS | §3.7 v0.2+ 활성 예약 정상 |

### C.3 발견된 schema gap (v0.2 backfill 후보)

본 dogfood 가 *완전한 success* 가 아니라 *partial* 인 4 지점 — §3 schema 의 후속 개정 evidence 예요.

1. **Spec-type entry 의 trigger.format 누락** — `prose-with-yaml` 는 v0.1 enum 에 없어요. 현재 §3 schema 는 trigger.format ∈ {json-schema, regex, count-threshold} 만 정의. spec 본문 entry 자체를 schema 로 흡수하려면 `prose-with-yaml` 또는 `spec-body` enum 추가 필요.
2. **Children 의 promotion 상태 표기 부재** — 4 자식 (communication-discipline 등) 은 *예정* 이지 *현존* X. `children:` 의 element 가 `{slug, status: planned|draft|ratified}` 객체였어야 정확. v0.1 은 string list 만 허용 → §2.6 의 graph topology 정밀화 후보.
3. **Source evidence 의 경로 절대성** — `reports/...` 는 outer (비공개) 경로. 공개 repo 에 ship 될 때 본 부록의 자기 frontmatter 도 함께 redact 필요 (public-repo redaction 규율 — 본 spec 의 voice linter L7/L8 가 catch). v0.2 에 `source_evidence` field 의 redaction lint 추가 검토.
4. **last_referenced_turn 의 의미** — spec 본문은 entry 와 달리 *항상 reference 가능* 한 정상 surface. 매 cycle turn-end 에 자동 갱신할지, manual cut 시점에만 갱신할지 §3.2 mandatory field 정의가 모호. dogfood 결과 *spec entry 는 last_referenced_turn 의미 미약* — `null` 허용 또는 별도 sub-tier 정의 필요.

### C.4 Self-application 의 normative 함의

본 부록의 frontmatter 가 §3 schema 를 *부분적으로* 만족한다는 사실 자체가 두 방향의 evidence 예요.

- **긍정**: v0.1 mandatory 7 fields 와 macro-required field 가 macro tier 의 *spec 본문* 에까지 자연스레 적용 가능 — 9/9 cross-axis convergence (부록 A Cluster C) 의 *boundary case* 통과. Cluster C 의 universal claim 이 본 spec 자체에서도 holds.
- **부정**: trigger.format · children topology · source_evidence redaction · last_referenced_turn semantics 4 지점에서 schema 가 *spec-type entry* 를 정확히 호스팅 못 함. 단순 lint warning 으로 처리 가능하지만 §3 schema 의 *완전성* 주장은 약화. v0.2 에 backfill 필수 (§11.2 의 v0.2 roadmap 에 합류).

이는 *self-application 이 schema 의 가장 엄격한 stress test* 라는 humanities §3.8 (Alexander pattern language 의 *self-instantiation* 요건) + management §1.10 (IAR 의 *meta-rule 의 자기준수*) 와 정확히 일치해요. Spec 자체가 자신의 governance SSoT 양식을 만족하지 못하면 외부 entry 에 적용할 도덕적 권위가 약해진다는 normative 주장 (Powell-DiMaggio 1983, *normative isomorphism*) — 본 부록의 PARTIAL 4 지점이 v0.2 백로그의 우선순위 근거.

### C.5 후속 cut 의 self-application 추적

v0.2+ 의 본 spec 각 cut 마다 본 부록을 *재실행* — frontmatter 의 maturity_score · lifecycle · last_referenced_turn · audit_trail 갱신 + C.3 gap 4 지점의 해소 여부 표기. v0.5+ 시점에 PARTIAL → PASS 전환이 완료되면 본 부록은 *macro tier ratified entry* 의 reference exemplar 로 격상 가능 — §5.4-§5.6 의 promotion path 와 동형 (`psychology §1.10` Lally 66 일 consolidation).

본 부록 자체가 본 spec 의 *self-trust* 의 시작점이에요.
