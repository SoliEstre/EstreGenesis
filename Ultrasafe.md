<!-- module: Ultrasafe; layer: pre-release-security-verification; part-of: EstreGenesis 2.5.x; version: v0.2.0; date: 2026-06-06; status: runtime activation cut v0.2.0 (advisory mode runtime — 8 attacker skills + 2 hooks PreToolUse/Stop + MCP server 5 tools over stdio JSON-RPC + Constellation §13.16 5 intent 통합 ULTRASAFE_FINDING/ULTRASAFE_ITERATION_BOUNDARY/ULTRASAFE_RELEASE_GATE/SECURITY_DISCLOSURE_INTAKE/MPCVD_COORDINATION + Workflow fan-out 적용 evidence; v0.1.0 design draft 본문 보존; blocking mode v0.3+ 후속 — clean-signal-gate 4-condition AND-gate 도달 + user gate + ≥3 iteration consecutive clean 시 전환); depends-on: none (optional synergy: Constellation §13 A2A — 5 new intents wire-integrated; Superscalar §3 fan-out — direct host; Hyperbrief §1 escalation routing — auto-mapping; Greatpractice §5 tree promotion — bidirectional feed); license: Apache-2.0 -->

# Ultrasafe — Pre-Release Multi-Perspective Simulated Penetration Testing with ≥3 Iteration Clean-Signal Gate (v0.2.0 runtime activation — advisory mode)

> **EstreGenesis optional module — v0.2.0 runtime activation cut (advisory mode).** v0.1.0 의 *minimum-viable spec scaffold* 가 17 축 cross-domain synthesis backing + 8-agent fan-out + ≥3 iteration multi-condition AND-gate + 3-layer synthesis report 의 *설계 문서* 였다면, v0.2.0 은 그 설계를 **runtime activation** — 8 attacker SKILL 디렉토리 + 2 hook (PreToolUse `ultrasafe-trigger.cjs` + Stop `ultrasafe-clean-signal.cjs`) + MCP server (5 tools over stdio JSON-RPC) + Constellation §13.16 5 신규 A2A intent 통합 + Workflow fan-out 적용 evidence — 의 cut 이에요. **본 cut 의 모든 finding emit / hook trigger / MCP tool return 은 *advisory-only* — 실제 publish 차단 없음.** Blocking mode (v0.3+) 는 후속 — clean-signal-gate 의 4-condition AND-gate 도달 + user gate 통과 + ≥3 iteration consecutive clean 의 3-AND 조건 후 전환.
>
> **v0.2.0 runtime 의 5 신규 surface (본 cut 의 ship 단위)**:
> 1. **8 attacker SKILL.md** (`plugins/ultrasafe/skills/ultrasafe-{ai-llm,web-api,supply-chain,crypto,social-eng,methodology,threat-model,synthesizer}/SKILL.md`) — 각 attacker 의 input/output/tools/when-to-fire/severity rubric 명시.
> 2. **PreToolUse hook `ultrasafe-trigger.cjs`** — publish-equivalent command (npm publish / pip upload / git push --tags to public) 직전 trigger, advisory mode = report-only emit, blocking mode (v0.3+) 는 user gate.
> 3. **Stop hook `ultrasafe-clean-signal.cjs`** — cycle-end clean-signal check, ≥3 iteration 의 clean-signal 도달 여부 verify.
> 4. **MCP server `mcp/server.cjs`** — 5 tools over stdio JSON-RPC: `ultrasafe_run_fanout` / `ultrasafe_finding_aggregate` / `ultrasafe_clean_signal_check` / `ultrasafe_report_generate` / `ultrasafe_release_gate`.
> 5. **Constellation §13.16 5 신규 intent 통합** — `ULTRASAFE_FINDING` / `ULTRASAFE_ITERATION_BOUNDARY` / `ULTRASAFE_RELEASE_GATE` / `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION` (자세히 §8.1 + §15 통합 명세 참조).
>
> **v0.1.0 본문 보존**. v0.1.0 의 §1-§13 + 부록 A/B/C 는 *전부 보존*. v0.2.0 의 본문 확장은 §14 (Runtime Architecture), §15 (8-Agent Fan-Out Runtime Detail), §16 (MCP Server Tools), §17 (2 Hooks Spec), §18 (Constellation 통합 5 intent — runtime wire spec), §19 (Advisory vs Blocking Mode) 의 6 신규 § + 끝의 Revision History 만 추가돼요. 기존 §1-§13 본문의 *forward reference* (예: §8 의 5 intent → §18 의 wire spec, §10 의 PreToolUse hook → §17 의 hook spec, §13.5 의 advisory-only → §19 의 mode transition) 가 v0.2.0 에서 *backward resolve* 돼요.
>
> # Ultrasafe — Pre-Release Multi-Perspective Simulated Penetration Testing with ≥3 Iteration Clean-Signal Gate (design draft v0.1.0, body preserved in v0.2.0)

> **EstreGenesis optional module — design draft v0.1.0 (body preserved as v0.2.0 backing).** Constellation 이 *agent 간 통신* 을, Superscalar 가 *agent 안의 dispatch* 를, Hyperbrief 가 *사용자에게 결정 위임* 을, Greatpractice 가 *반복 누락의 결정적 방지* 를 다룬다면, Ultrasafe 는 다섯 번째 축 — **release 직전 / release 시점 / release 직후 의 공격자 시점 병렬 fan-out + 합성 + 보강 cycle 의 ≥3 iteration 다중 조건 AND clean-signal 통과 후에만 release 를 허가하는 pre-release security attestation 체계** 를 다뤄요. 8-agent 최소 fan-out (AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer) + GTA/DSP cross-cutting + 3-layer 합성 보고서 (OSCAL machine schema + Hyperbrief 9-section IR + Greatpractice tree candidate) + dual pre-release trigger (PreToolUse hook + /ultrasafe skill) + 5 신규 Constellation A2A intent. 17-axis cross-domain 딥리서치 (harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution) backing.
>
> **Cost-honest framing.** Ultrasafe 는 공짜가 아니에요. 매 release 마다 17 (full) 또는 8 (minimum) 공격 에이전트 병렬 호출의 토큰 비용 + ≥3 iteration loop 의 wall-clock 비용 (대략 patch=15분 / minor=30분 / major=60분+) + false positive 처리의 인지 부담 + LLM-only finding 의 hallucination 위험 + 본 모듈 자체가 Hyperbrief 결정 위임을 강제하므로 자동 결정의 속도 손실. 이 비용을 trade 해서 얻는 것은 — *release 시점 zero-known-critical-finding 의 결정적 보장* (한 번도 안 발견된 vulnerability 가 아닌, 모든 17 축이 모의로 공격해본 후의 attested clean state), *공급망 + AI 적대적 + 인적 social engineering + multi-agent trust erosion 의 모든 inflection 점에서 미리 빠진 layer 가 없는지 검증*, *세 모듈 (Constellation + Hyperbrief + Greatpractice) 와의 자연 통합 으로 발견 → 결정 → codify 의 full cycle 자동화*.
>
> **Advisory-only v0.1.x → blocking v0.2.x.** v0.1.x 는 *advisory-only* mode 로 ship — 모든 finding 은 stderr alert 만, release 실제 차단 X. v0.2.x 부터 *blocking* mode 전환 (Tier 3 release 부터 강제, Tier 1/2 는 사용자 opt-in). 본 transition 은 critic Tier A patch (strict-mode 직접 모순 해소) 의 명시적 결과. v0.1.x 는 false positive baseline 수집 + dogfood evidence 누적 단계.
>
> _용어 안내_: "공격 에이전트" (각 fan-out 단위의 simulated attacker), "발견" (공격 에이전트 가 produce 하는 single security observation), "이번 반복" (현재 iteration), "Ultrasafe" (모듈 이름, 산문 capitalized · 경로는 lowercase) 는 본 문서 안에서 일관 사용해요.

---

## Table of Contents

- [§1. Concept — Ultrasafe 의 정체](#1-concept--ultrasafe-의-정체)
- [§2. Module Shape — 8-agent v0.1.0 minimum fan-out](#2-module-shape--8-agent-v010-minimum-fan-out)
- [§3. Fan-out Matrix — taxonomy × methodology × actor-profile 직교](#3-fan-out-matrix--taxonomy--methodology--actor-profile-직교)
- [§4. Finding Output Contract — 공격 에이전트 발견 schema](#4-finding-output-contract--공격-에이전트-발견-schema)
- [§5. Synthesis Report 3-Layer — OSCAL + Hyperbrief IR + Greatpractice candidate](#5-synthesis-report-3-layer)
- [§6. ≥3 Iteration Loop — multi-condition AND clean signal](#6-3-iteration-loop)
- [§7. Hyperbrief 4-score Routing](#7-hyperbrief-4-score-routing)
- [§8. Constellation A2A — 5 신규 intent](#8-constellation-a2a--5-신규-intent)
- [§9. Greatpractice Tree 통합](#9-greatpractice-tree-통합)
- [§10. Pre-release Trigger + Tier](#10-pre-release-trigger--tier)
- [§11. Self-Spec-Gaming Hazard](#11-self-spec-gaming-hazard)
- [§12. Untested Surfaces + Known Gaps](#12-untested-surfaces--known-gaps)
- [§13. Adoption Thresholds](#13-adoption-thresholds)
- [§14. Runtime Architecture (v0.2.0)](#14-runtime-architecture-v020)
- [§15. 8-Agent Fan-Out Runtime Detail (v0.2.0)](#15-8-agent-fan-out-runtime-detail-v020)
- [§16. MCP Server Tools (v0.2.0)](#16-mcp-server-tools-v020)
- [§17. Hooks Spec — PreToolUse + Stop (v0.2.0)](#17-hooks-spec--pretooluse--stop-v020)
- [§18. Constellation 통합 — 5 신규 intent runtime wire (v0.2.0)](#18-constellation-통합--5-신규-intent-runtime-wire-v020)
- [§19. Advisory vs Blocking Mode — v0.2.x advisory + v0.3+ blocking 전환 조건 (v0.2.0)](#19-advisory-vs-blocking-mode--v02x-advisory--v03-blocking-전환-조건-v020)
- [부록 A. Cross-Axis Convergence Cluster Catalog](#부록-a-cross-axis-convergence-cluster-catalog)
- [부록 B. 4 Strong Isomorphism + Normative 정당화](#부록-b-4-strong-isomorphism--normative-정당화)
- [부록 C. Self-Application — 본 spec 자체의 entry](#부록-c-self-application--본-spec-자체의-entry)
- [Revision History](#revision-history)

---


## §1. Concept — Ultrasafe 의 정체

> Constellation 이 *agent 간 통신* 을, Superscalar 가 *agent 안의 dispatch* 를, Hyperbrief 가 *사용자에게 결정 위임* 을, Greatpractice 가 *반복 누락의 결정적 방지* 를 다룬다면, Ultrasafe 는 다섯 번째 축 — **release 직전 / release 시점 / release 직후 의 attacker-perspective parallel fan-out 으로 다층 attack surface 를 합성 후 ≥3 iteration loop 의 4-condition AND clean-signal gate 통과 후에만 release 를 허가하는 pre-release security attestation 체계** 를 다뤄요. 17축 cross-domain 딥리서치 (harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution) backing.

Ultrasafe 는 *문서 형식* 도 *체크리스트* 도 아니에요. **공격자 시점의 병렬 fan-out → 합성 → 보강 cycle ≥3 회 반복 → 종료 조건 충족 시 release 허가** 의 *운영 메커니즘*. 매 cycle 의 산출물은 OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree promotion candidate 의 3-layer hybrid (§4 finding contract + §5 synthesis 양식 참조), 매 cycle 의 종료는 4-condition AND gate (§6 clean signal gate 참조), 매 release 는 외부 standard anchor 가 박힌 grade certificate 동반 (§13.4 release attestation 참조).

### §1.1 4 가지 흔한 오독 차단

| 오독 | 실제 정체 |
|---|---|
| (a) "또 다른 SAST / DAST 자동화 도구" | Ultrasafe = LLM-agent fan-out (§2 § 3) + retire-barrier synthesis (§5) + ≥3 iteration loop (§6) + 4-module 합성 (§7-§9). 전통 SAST / DAST 결과는 Web/API axis 의 *input* 일 뿐 — Ultrasafe 자체는 cross-axis synthesizer 의 운영 mechanism. |
| (b) "단일 보안 체크리스트 / catalog" | Ultrasafe entry 는 항상 *iteration boundary* 에서 catalog version + coverage % + untested_classes [] 명시. "secure" 라는 단어 사용 금지 — *passed coverage X% under catalog v_Y as of date Z* 의 한정 표현만 (§6.3 coverage 정의 + §13.4 attestation 한정 표현 참조; `compliance-standards §5 + adversarial-ml §1.6` 정합). |
| (c) "1 회 audit + clean release" | clean signal = 4-condition AND gate × consecutive 2 iteration. 단일 iteration pass 는 anti-pattern (§6.5 anti-pattern 참조; `pentest-methodology §4.2 + fuzzing-pbt §4.1` 정합). hard floor = 3 (universal) — *iter 1 fix apply + iter 2 verify of fix + iter 3 verify of regression-of-fix* 의 3-floor 근거. |
| (d) "AGENTS.md / .agent/rules.md 의 보안 절 대체" | Ultrasafe 는 *release-gated mechanism*, AGENTS.md 는 *always-on context*. Ultrasafe 산출이 Greatpractice tree 의 macro/mezzo/micro 노드로 promote 된 후에야 always-on enforcement 채널 (PreToolUse hook 등) 로 흘러감 (§9 Greatpractice 통합 참조). |

### §1.2 5-stage operational pipeline

Ultrasafe 는 단일 invocation 이 아닌 **fan-out → synthesize → iterate → gate → attest** 의 5-stage operational pipeline 이에요. 각 stage 는 별도 §에서 본격 spec — 본 절은 high-level shape 만.

1. **Pre-release trigger** (§10) — `git push --tags` / `gh release create` 의 PreToolUse hook + explicit `/ultrasafe` skill invocation 의 dual entry. 자동 *Tier 판정* (patch / minor / major) 으로 fan-out 강도 차등 — token budget 폭주 방지. Tier 1 ~zero cost, Tier 2 ~$15 / release, Tier 3 ~$50+ / release.

2. **Fan-out** (§2 + §3) — Superscalar read fan-out 의 instance. v0.1.0 기본 carving = **(OWASP LLM Top 10 × NIST 800-115 / OSSTMM / OWASP / PTES) 2D matrix**, 8 attacker agent 병렬 (AI/LLM + Web/API + Supply chain + Cryptography + Social engineering + Methodology/Compliance + Threat model/Lifecycle + Synthesizer). GTA + DSP 는 cross-cutting layer (모든 agent output 후 ROI calibration + policy enforcement). diversity-enforced source independence — *(perspective × prompt_template_hash × seed) 3-tuple distinct ≥ 3* 강제 (`multi-agent-distributed §1.2 + cognitive-decision-bias §2`; single-provider correlated hallucination known limitation, §12.2 untested_surfaces 명시).

3. **Synthesize at retire-barrier** (§5) — 다수 attacker agent 의 finding 을 retire-barrier 에서 *cross-correlate + dedup + 신뢰도 평가*. matrix 우선 (graph 는 v0.2 cut), cross-axis confirmation ≥ 2 distinct perspective bucket. 합성 보고서 = OSCAL Assessment Result (machine-readable) + Hyperbrief 9-section IR (decision-routing-ready) + Greatpractice tree entry candidate (codification-ready) 의 3-layer hybrid.

4. **Iterate ≥3 with multi-condition AND termination** (§6) — Universal hard floor = 3. clean signal 4-condition AND:
   - **regression-free** (이전 iteration finding 의 sealed 검증 AND 새 high-severity 0) — §6.4 regression baseline 의 3-component AND (sealed verification + prior_findings retest pass + secondary surface absence) 로 명세
   - **monotonic improvement** (단순 finding count 단조성 metric 아닌 K-iteration window trend; `fuzzing-pbt §4.1` 의 coverage ≠ bug-finding 함정 회피)
   - **coverage / catalog gate** — §6.3 coverage 정의 = (covered_catalog_entries ∩ applicable_subset) / applicable_subset, denominator 와 untested_classes [] 명시 강제 + 외부 standard anchor mandatory (`compliance-standards §1.6`)
   - **consecutive 2 iteration cleanliness** — 위 1-3 조건 연속 2 iteration 만족.
   max_iter (default 7) 도달 시 Hyperbrief 4-way escalation (apply / defer / release_with_risk / escalate) 자동 (§7 Hyperbrief 통합 참조). iteration N 동안 *frozen membership / state* (registry hash + target_commit_sha + catalog_version) 박제 — 변경은 iteration boundary 에서만 (`multi-agent-distributed §1.5`).

5. **Gate + attest** (§7 + §13.4) — Hyperbrief 4-score (severity × scope × reversibility × external_impact) 자동 routing 또는 deterministic signal 의 auto-block (§7.3 strict-mode reconciliation: v0.1.0-v0.1.x advisory mode + v0.2.x blocking mode 명시 분리; `protocol-trust-evolution §1.8 + devsecops-policy-as-code §1.1` 정합). Clean signal 도달 + Hyperbrief gate 통과 시 grade certificate emit — 외부 standard anchor + catalog_version + coverage_pct + untested_classes 박제, cosign signature + Rekor inclusion proof (Tier 3 mandatory). attestation 의 표현은 *"passed coverage X% under catalog v_Y"* 한정 — *secure* 단어 영구 금지.

### §1.3 Three backbones — fan-out + synthesis + iteration

본 모듈의 3 개 backbone 은 17축 합성 결과 가장 두꺼운 convergence cluster — 각각 16/17, 15/17, 14/17 cross-axis confirmation 으로 도달.

**Backbone B1 — Parallel attacker-perspective fan-out (16 / 17 axis convergence)**

Ultrasafe 의 attack 단계는 단일 thread 가 아닌 *복수 perspective 의 independent attacker agent fan-out*. 각 perspective 는 (taxonomy, methodology, actor-profile, layer, lifecycle, principle, persona) 중 하나 이상으로 specialization, retire-barrier 에서 결과 합성. 17축 cross-domain 딥리서치 중 16 축 (pentest-methodology · ai-red-team · web-api-infra · threat-modeling · multi-agent-distributed · adversarial-ml · supply-chain-sbom · devsecops-policy-as-code · incident-response-disclosure · cryptography-key-mgmt · human-factors-se-opsec · game-theory-asymmetry · compliance-standards · cognitive-decision-bias · security-visualization-dashboard · protocol-trust-evolution) 이 동일 underlying pattern 에 수렴 — fuzzing-pbt 만 corpus evolution 중심으로 다른 carving (`cross-axis convergence cluster C1`).

분담 축의 차원은 axis 마다 다르나 *2-3 직교 축의 곱* (예: layer × lifecycle, taxonomy × methodology, principle × technique) 이 dominant. v0.1.0 의 매트릭스 carving 은 *2D minimum* (OWASP × methodology, §3) 으로 시작 후 *3D* (+ actor-profile) 로 점진 확장 (§3.3 actor-profile opt-in).

**Backbone B2 — Cross-axis retire-barrier synthesis (15 / 17 axis convergence)**

다수 attacker agent 가 emit 한 finding 을 retire-barrier 에서 *cross-correlate + dedup + 신뢰도 평가* 하는 합성 단계 필수. 단일 finding list flat 화 금지 — *graph / matrix / quorum* 구조가 dominant (`web-api-infra §1.3 + threat-modeling §1.4 + security-visualization-dashboard §1.1 + multi-agent-distributed §1.1`).

v0.1.0 은 *matrix 우선* (axis 횡단 동의 가장 강함), graph 는 v0.2 cut, BFT quorum 의 concrete 수치 (f=1 ~ f=3) 는 §5.3 quorum_evidence 필드로 명세. cross-axis confirmation ≥ 2 distinct perspective bucket 가 v0.1.0 hard rule. Cause 분석은 *N ≥ 2 contributing factors mandatory* — single root cause forced search 는 anti-pattern (`incident-response-disclosure §1.11 + cognitive-decision-bias §1.1`).

**Backbone B3 — ≥3 iteration multi-condition AND termination (14 / 17 axis convergence)**

종료 조건은 *단일 metric* 이 아닌 *다조건 AND 게이트* — finding count 단독은 false confidence (`fuzzing-pbt §4.1`). regression-free + monotonic improvement + statistical power + cross-axis confirmation 의 conjunction. 14 axis (supply-chain · fuzzing · pentest · web-api · crypto · adversarial-ml · human-factors · game-theory · multi-agent · IR · devsecops · protocol-trust · compliance · cognitive) 가 동일 carving 에 수렴 (`cross-axis convergence cluster C3`).

universal predicate 4 항목 = (a) **regression-free** — §6.4 regression baseline 3-component AND (sealed_verification_pass + prior_findings_retest_pass + no_secondary_surface_high_severity) 로 측정 mechanism 박제, (b) **monotonic improvement** — K-iteration window trend (K=3 default) 의 3 sub-condition AND (new high-severity rate trend descending + unresolved persistent count 감소 + cross-axis confirmation density 증가), (c) **iteration floor ≥ 3** — *fix apply + verify of fix + verify of regression-of-fix* 의 3-floor 근거 (`devsecops-policy-as-code §1.4 + pentest-methodology §2.4`), (d) **coverage / catalog gate** — §6.3 의 (covered ∩ applicable) / applicable 정의 + Tier 별 threshold (Tier 1: 50%, Tier 2: 75%, Tier 3: 90%) + untested_classes [] mandatory 명시.

### §1.4 Ultrasafe 가 *하지 않는* 것 — v0.1.0 advisory-only boundary

본 모듈의 *적용 범위* 는 spec drafting 의 가장 흔한 over-promise 회피를 위해 명시적으로 negative-bound.

- **자동 fix apply 결정 ≠ Ultrasafe 의 역할.** Ultrasafe 는 finding emit + Hyperbrief routing + Greatpractice promotion candidate 까지만. *어느 fix 를 apply 할지* 의 결정은 Hyperbrief 4-score gate 의 인간 게이트 (또는 deterministic signal 의 6-condition AND 자동 fix path — §7.2 참조). Auto-deferral 절대 금지 (`protocol-trust-evolution §1.8` strict-mode default).

- **외부 actor 의 active scanning 수행 ≠ Ultrasafe 의 역할.** attacker agent 는 *self-repository scoped* — EG inner repo + outer workspace 만. 외부 endpoint 호출 / 실제 인터넷 probe / penetration test 수행 금지 (sandbox escape + legal liability 회피). 외부 endpoint 은 *시뮬레이션* 만 (`pentest-methodology §4.2 anti-pattern 7`).

- **단일 catalog 의 perfect coverage 보장 ≠ Ultrasafe 의 약속.** 모든 attestation 은 *passed coverage X% under catalog v_Y as of date Z* 의 한정 표현. catalog v_Y 외부의 attack 은 explicit untested_classes [] 로 disclose. *"secure"* 단어 영구 금지 (`adversarial-ml §1.6 + compliance-standards §1.6`).

- **Self-spec-gaming hazard 의 완전 제거 ≠ Ultrasafe 의 보증.** Ultrasafe 자체가 attack target — clean rate / pass rate 가 attacker agent 의 spec-gaming reward 일 수 있음 (Krakovna 2020 의 60+ examples). v0.1.0 의 방어 = 4 mandatory item (minimum diversity + audit trail + external anchor + untested_surfaces []), v0.2 에 *meta-iteration* (Ultrasafe self-test) 추가 (§11 self-spec-gaming hazard prevention 참조; `adversarial-ml §1.6 + game-theory-asymmetry §1.7 + incident-response-disclosure §1.9`). Untested_surfaces [] 의 mandatory 명시 — 알려진 알려진 미시험 surface 의 honest disclosure.

- **알려진 untested surfaces (v0.1.0):**
  - Constellation broker / WS server 자체의 compromise / DoS / membership manipulation — *out-of-scope declare* + Greatpractice macro 노드 ("broker compromise = 전체 시스템 invalid"; §8 broker surface 참조 — `incident-response-disclosure §1.6 + multi-agent-distributed §1.6`).
  - Side-channel / micro-arch attack (Spectre, EM, power) — v0.2.x
  - Privacy-by-design LINDDUN deep-dive — Tier 3 자동 활성화만 v0.1.0 (`compliance-standards §1.5`)
  - Legal / regulatory beyond compliance (export control, sanctions, dual-use AI) — v0.2.x
  - Single-provider correlated hallucination — v0.2.x 외부 LLM A2A counterpart 도입 후 완화
  - Schema evolution backward-compat — v0.1.0 → v0.2.x finding schema 추가 시 *additive evolution only* + `schema_version` field mandatory + N=2 minor deprecation window (§12.4 schema evolution 참조).

- **v0.1.0 advisory mode default.** v0.1.0-v0.1.x 동안은 *advisory mode* (차단 안 함, surface 만) — false positive 측정 + tuning. v0.2.x 진입 시 *blocking mode* 전환 (hard-mandatory) — 전환 결정 자체가 Hyperbrief 4-score gate 통과 필수 (Score ≥ 4 + 운영 기간 ≥ N month + FP rate < threshold; §7.3 + §13.5 strict-mode reconciliation 참조; `devsecops-policy-as-code §1.1 graduated enforcement ladder + protocol-trust-evolution §1.8 strict-mode default` 의 직교 적용).

본 negative-bound 절은 v0.1.0 의 *honest framing* — operational observations 의 dogfood evidence cycle 에서 *실제 도달 가능한 범위* 와 *명시적 deferred surface* 의 분리를 spec drafting 시점에 박제하기 위함이에요. v0.2 이후의 maturation roadmap 은 §13.6 + 부록 C 의 phased cuts 로 별도 명세.

---

## §2. Module Shape — 8-agent v0.1.0 minimum fan-out

> Ultrasafe 의 module shape 은 *복수 perspective 의 independent attacker agent fan-out* + *single retire-barrier synthesis* 의 Superscalar workflow instance 예요 (Superscalar §1-§5 의 read fan-out + retire-barrier + post-barrier mutation 그대로 차용). 본 절은 v0.1.0 최소 가동 단위인 **8-agent fan-out roster** + **GTA/DSP cross-cutting layer** + **diversity invariant** + **self-spec-gaming hazard 회피** + **v0.2-v0.4 17축 확장 roadmap** 을 정의해요. fan-out 의 분담 축은 17 axis cross-axis 분석 결과 (`synthesis/cross-axis-patterns.md` Cluster C1 = 16/17 축 수렴) *taxonomy × methodology 2D matrix* 가 default carving — 단일 축 강제 금지, 2D minimum.

### §2.1 8-agent fan-out roster (v0.1.0 minimum viable)

v0.1.0 의 minimum viable cut 은 **공격 7-agent + synthesizer 1-agent** = 총 8 agent 의 single retire-barrier 구조예요. 각 공격 agent 는 *1-2 axis* (1차 carving + 부속 axis) 를 담당하고, retire-barrier 의 synthesizer 가 fan-out sink 역할 (MAD §2 BFT quorum + diversity + accountable history + FPB/CDB/SVD/IRD 통합) 을 해요.

| # | Agent role | 1차 axis | 부속 axis | catalog anchor | Output contract 의 perspective field |
|---|---|---|---|---|---|
| 1 | **AI/LLM attacker** | ai-red-team (ART) | adversarial-ml (AML) | OWASP LLM Top 10 v2025.11 + EU AI Act Art. 15(5) 5-family + lethal trifecta | `{primary: "ai-red-team", secondary: ["adversarial-ml"]}` |
| 2 | **Web/API/infra attacker** | web-api-infra (WAI) | — | OWASP × MITRE ATT&CK Enterprise v15 dual taxonomy | `{primary: "web-api-infra"}` |
| 3 | **Supply chain attacker** | supply-chain-sbom (SCS) | — | SCS 5-way (build / maintainer / typo / transitive / reproducibility) + SLSA L3 + Sigstore | `{primary: "supply-chain-sbom"}` |
| 4 | **Cryptography attacker** | cryptography-key-mgmt (CKM) | — | C1-C15 15-pattern catalog + TLS 1.3 / Ed25519 / ECDSA-P256 strict profile | `{primary: "cryptography-key-mgmt"}` |
| 5 | **Social engineering attacker** | human-factors-se-opsec (HFS) | — | Cialdini 6 × Hadnagy 9 × FBI 8-elicitation 직교 fan-out | `{primary: "human-factors-se-opsec"}` |
| 6 | **Method/Compliance attacker** | pentest-methodology (PM) | compliance-standards (CMP) | NIST 800-115 × OSSTMM × OWASP Testing Guide × PTES × ISO 27001:2022 theme matrix | `{primary: "pentest-methodology", secondary: ["compliance-standards"]}` |
| 7 | **Threat model / Lifecycle attacker** | threat-modeling (TM) | protocol-trust-evolution (PTE) | STRIDE × LINDDUN × UKC + 5-layer × 3-lifecycle 매트릭스 | `{primary: "threat-modeling", secondary: ["protocol-trust-evolution"]}` |
| 8 | **Synthesizer** (fan-out sink) | multi-agent-distributed (MAD) | fuzzing-pbt (FPB) + cognitive-decision-bias (CDB) + security-visualization-dashboard (SVD) + incident-response-disclosure (IRD) | BFT quorum 2f+1 + ACH matrix + CIM normalization + PICERL gating | `{primary: "synthesizer", aggregates_from: [1..7]}` |

#### §2.1.1 Agent 1 — AI/LLM attacker (ART + AML 결합)

- **Responsibility**: LLM-integrated surface 의 direct/indirect prompt injection (Greshake-Abdelnabi 2023), system prompt leakage (OWASP LLM07:2025), vector/embedding 공격 (OWASP LLM08:2025), agentic misalignment (Anthropic 2025 arXiv:2510.05179), alignment-faking probe (Anthropic 2024), FGSM/PGD/C&W 3-tuple (Goodfellow 2015 + Madry 2018 + Carlini-Wagner 2017), Article 15(5) 5-family (data poisoning, model poisoning, adversarial examples, confidentiality, model flaws).
- **Output contract** (Cluster C9 정합 — strict JSON schema + (file, lines, poc_sketch) anchor mandatory): 자세히 §3.3 (Finding output contract) 참조.
- **Minimum diversity**: FGSM + PGD + C&W + black-box 4-family 모두 시도 (AML §3.6 self-spec-gaming 회피 — minimum attack diversity 강제, 단일 family early termination 차단).
- **Termination signal contribution**: PGD-AT 통과 + OOD goal-misgeneralization probe (Langosco 2022) + agentic misalignment probe 3-축 음성.

#### §2.1.2 Agent 2 — Web/API/infra attacker (WAI 단독)

- **Responsibility**: OWASP × MITRE ATT&CK dual taxonomy 의 8 sub-perspective (SAST / DAST / API / container / IaC / SSRF / supply-chain dependency / call-graph) 횡단. CVSS v4 + EPSS + KEV trump 의 priority matrix (`web-api-infra §1.3 + incident-response-disclosure §1.2`).
- **Output contract**: anchor.file + anchor.lines + anchor.poc_sketch + anchor.evidence_artifact_ref. attack path graph 후보 emit (v0.1.0 은 *flat list*, v0.2.x 에서 node/edge graph 로 promotion — `web-api-infra §2 attack path graph` Phase 2 cut).
- **Blocking-decision routing** (`web-api-infra §6 + cross-axis Cluster C4`): confidence=high + fix path=single + regression risk=low + reversibility=full + blast-radius < module + external-impact ≤ Tier 2 의 **6-condition AND gate** 통과 시만 자동 PR 후보 emit. 하나라도 미충족 → Hyperbrief 4-score gate routing.

#### §2.1.3 Agent 3 — Supply chain attacker (SCS 단독)

- **Responsibility**: SCS 5-way attack vector (build / maintainer / typo / transitive / reproducibility) + PURL join key 기반 dedup + SLSA L3 path 검증 + Sigstore cosign + Rekor inclusion proof 정합 + maintainer history anomaly.
- **Output contract**: PURL canonical id + attestation chain (certificate + Rekor proof + timestamp) + maintainer_anomaly_flag.
- **Auto-block 금지** (`cross-axis Contradiction CT1` 합성): maintainer anomaly 는 *자동 차단 안 함* — 항상 human review lane (라이브보드 별도 lane, `supply-chain-sbom §7 + Constellation §13.x`). 자동 차단은 *결정론적 signal* (cosign signature mismatch / SLSA provenance 부재 / OSV CVE match) 한정.

#### §2.1.4 Agent 4 — Cryptography attacker (CKM 단독)

- **Responsibility**: C1-C15 15-pattern catalog (key generation / storage / rotation / agility / constant-time / PQC readiness 등) × 3-sub-agent 분배. TLS 1.3 / Ed25519 / ECDSA-P256 strict minimum profile (PTE §8 strict-mode default + `cryptography-key-mgmt §7`).
- **Output contract**: pattern_id (C1-C15) + agility_envelope_status + pqc_readiness_metric + constant_time_binary_evidence.
- **Permanent-manual category** (`cross-axis Contradiction CT6` 합성): binary constant-time finding + cryptographic key rotation + external endpoint change 는 *영구 auto-apply 금지* — score 무관 forced Hyperbrief escalate (CKM §5).

#### §2.1.5 Agent 5 — Social engineering attacker (HFS 단독)

- **Responsibility**: Cialdini 6 (Reciprocity / Commitment / Social Proof / Authority / Liking / Scarcity) × Hadnagy 9 SE attack vector × FBI 8-elicitation technique 직교 fan-out. Prompt-injection signature 검출 + A2A inbound Spotlighting wrapper 검증 (HFS §3 + ART §5).
- **Output contract**: cialdini_principle + hadnagy_vector + elicitation_technique + injection_canary_status.
- **Human review default**: LLM-classifier 기반 sensitive topic 분류 결과는 *항상 human gate* — auto-block 금지 (`cross-axis CT1` rule (a)+(b)+(c) 중 (b) "false positive < 1%" 미충족).

#### §2.1.6 Agent 6 — Method/Compliance attacker (PM + CMP 결합)

- **Responsibility**: NIST 800-115 / OSSTMM / OWASP Testing Guide / PTES 4 methodology × ISO 27001:2022 4-theme = 16-cell 2D dispatch matrix (CMP §5). RAV-style quantified release gate (PM §5). CIS v8.1 cross-framework mapping (CMP §8).
- **Output contract**: methodology_anchor + iso_theme + rav_score + cis_control_id.
- **Catalog version mandatory**: `catalog_version` + `coverage_percentage_under_catalog` + `untested_classes[]` 매 finding 명시 (`cross-axis Cluster C8` 의 falsifiability anchor). "secure" 단어 사용 금지 — *"passed coverage X% under catalog v_Y as of date Z"* 한정 표현.

#### §2.1.7 Agent 7 — Threat model / Lifecycle attacker (TM + PTE 결합)

- **Responsibility**: STRIDE + LINDDUN + UKC 13-17 cell 직교 (TM §1) × PTE 5-layer (identity / transport / payload / temporal / aggregation) × 3-lifecycle (creation / operation / update) (PTE §1+§5). Attack-defense tree fragment 의 bottom-up propagation (TM §2). Secondary-surface iteration guard (TM §5) — F_{N+1} = (F_N − sealed) + secondary_new 의 diff 추출 책임.
- **Output contract**: stride_category + linddun_category + ukc_phase + pte_layer + lifecycle_stage + secondary_surface_origin_id.
- **TOFU hardening** (PTE §2): admit-time Ed25519 signature + DID 등록 + trust anchor lifetime metadata 필수.

#### §2.1.8 Agent 8 — Synthesizer (fan-out sink, MAD + FPB + CDB + SVD + IRD)

- **Responsibility**: 7-agent finding 의 retire-barrier 합성. BFT quorum 2f+1 (n=7 일 때 f=2 까지 견딤) + diversity-enforced source independence (MAD §2 + §3.2) + accountable iteration history (MAD §3.4 append-only signed chain) + ACH matrix multi-hypothesis (CDB §1) + CIM normalization tri-format export (SVD §4) + PICERL 6-phase gating (IRD §1) + invariant catalog shrink-minimal repro (FPB §3).
- **Output contract** (3-layer hybrid, 자세히 §3 합성 보고서 양식 참조):
  - **Layer 1**: OSCAL Assessment Result 의 `oscal.findings[]` + `oscal.iteration_summary` (resolved / regression / persistent / new 4-set diff) + `oscal.alignment_matrix` (axis × axis cross-confirmation count).
  - **Layer 2**: Hyperbrief 9-section IR (score ≥ 4 finding 마다) + `recommended_methodology[]` 4-tuple default.
  - **Layer 3**: Greatpractice tree entry candidate (macro / mezzo / micro 자동 분류).
- **Cross-axis confirmation**: 동일 finding 이 2f+1 = 5 agent 에서 보고 → `confirmed` tier, f+1 = 3 agent → `needs-corroboration`, 단일 보고 → `low-confidence draft` (MAD §3.1).
- **Coverage definition** (§6.3 critic Tier A patch 흡수): `coverage_percentage_under_catalog` = (탐색된 catalog cell 수 / 해당 catalog 의 전체 cell 수) — 단순 "발견 0" 의 ambiguous "clean" 이 아닌, *catalog cell 단위의 명시적 측정*. 단위는 catalog 별로 정의 (예: OWASP LLM Top 10 → 10 cell, MITRE ATT&CK Enterprise v15 → 14 tactic × N technique cell, ISO 27001 Annex A → 93 control cell). 각 cell 의 *probe attempted* 와 *probe successful* 이 별도 카운트 — probe attempted 가 분모.

### §2.2 GTA + DSP cross-cutting layer (모든 agent output enrichment)

GTA (game-theory-asymmetry) 와 DSP (devsecops-policy-as-code) 는 **별도 fan-out 대상이 아닌 cross-cutting layer** 예요 — 7-agent 의 모든 finding 출력 후 retire-barrier *전* 에 metadata enrichment + filter pass 를 수행해요 (`cross-axis-patterns.md §3.1` 의 *"GTA + DSP 는 cross-cutting (모든 agent 의 output 후 ROI calibration + policy enforcement layer), 별도 fan-out 대상 아님"* 결론 정합).

#### §2.2.1 GTA enrichment (ROI calibration + actor profile)

각 finding 에 다음 metadata 가 append:
- **`kill_chain_stage`** — Lockheed Martin Cyber Kill Chain 7-stage 중 위치 (reconnaissance / weaponization / delivery / exploitation / installation / C2 / actions-on-objectives).
- **`actor_profile`** — Stackelberg leader 의 commit-aware adversary tier (`game-theory-asymmetry §2`): `kiddie` / `hacktivist` / `ecriminal` / `apt` 4-profile.
- **`pain_level_if_fixed`** — Bianco 의 Pyramid of Pain 1-7 scale (hash / IP / domain / network artifact / host artifact / tool / TTP). pain_level ≥ 5 의 fix 는 *defender ROI 높음* signal.
- **`externality_score`** — `externality-aware-fix-filter` (GTA §3.6) — *daily friction cost* (테스트 런타임 증가 / build 시간 증가 / 인지 부하 / future regression rate) 의 *cumulative population friction* ÷ *expected blocked attack loss*. > 1.0 시 자동 deprioritize 또는 Hyperbrief escalate (Herley 2009 externality 명제 적용).
- **`defender_intervention_options[]`** — kill-chain decomposed ΔROI reporting (GTA §3.5) — option 별 `{control, ΔROI, effort_h}` 3-tuple.

#### §2.2.2 DSP enrichment (graduated enforcement + MTTR phase)

각 finding 에 다음 metadata 가 append:
- **`enforcement_tier`** — `advisory` / `soft-mandatory` / `hard-mandatory` 3-tier 의 HashiCorp Sentinel 패턴 (`devsecops-policy-as-code §3.1 + cross-axis Cluster C7`). 신규 정책은 *advisory tier* entry — false-positive rate + override rate 측정 후 promotion 결정은 Hyperbrief 4-score gate.
- **`mttr_phase`** — Discovery / Triage / Remediation / Verification 4-phase 중 위치 (`devsecops-policy-as-code §3.2`). 3-iteration floor 의 근거 = 본 4-phase 가 3회 반복되어야 fix-induced regression 검증까지 완결.
- **`rollback_feasibility`** — `full` / `partial` / `none` (IRD §10 rollback-feasibility action class). `none` 인 fix 는 영구 manual category 와 함께 forced Hyperbrief escalate.
- **`policy_as_code_artifact_ref`** — promoted policy 의 Rego / Sentinel / Kyverno artifact path (`devsecops-policy-as-code §3.6`). Conftest unit test 동반.

#### §2.2.3 Strict-mode reconciliation with graduated enforcement

DSP graduated enforcement ladder (advisory → soft → hard) 와 PTE strict-mode default (PTE §8) 는 *얼핏 모순* 처럼 보이나 *직교* 예요 (`cross-axis Contradiction CT5` 합성 + §7.3 critic Tier A patch 흡수):

- **Ladder 는 정책 *lifecycle***: 새 정책 도입 phase — advisory entry → FP rate 측정 → soft → hard promotion. Phase 1 (v0.1.0-v0.1.x) 동안 *advisory mode only* (차단 안 함, surface 만), Phase 2 (v0.2.x) 진입 시 *blocking mode* 전환 (TM §11+§12 정합).
- **Strict mode 는 정책 *enforcement***: 이미 hard-mandatory 로 promoted 된 정책 + 평가 *불가* (도구 timeout / external API down / agent dispatch 실패) 상황 — *차단 (fallback 진행 금지)*. STARTTLS downgrade 의 PTE §8 교훈.
- **Reconciliation rule** (§13.5 의 invariant 와 정합):
  1. *정책 lifecycle phase* (advisory / soft / hard) 와 *enforcement evaluation outcome* (passed / failed / cannot-evaluate) 는 *직교 2-tuple* 로 표현.
  2. `(advisory, cannot-evaluate)` → surface only, 진행 허용.
  3. `(soft-mandatory, cannot-evaluate)` → Hyperbrief 4-score gate (사용자 결정 — auto-deferral 금지).
  4. `(hard-mandatory, cannot-evaluate)` → 차단 (strict mode 적용), opt-out 은 Hyperbrief MUST-trigger 통과 필수.
  5. opt-out 발화 자체가 *Greatpractice mezzo promotion trigger* — 반복되면 평가 도구 결손이 구조적 문제로 promotion (Cluster C5 양방향 feed).

### §2.3 v0.2-v0.4 axis 확장 roadmap (17축 전체 도달 path)

v0.1.0 의 8-agent (7 attacker + 1 synthesizer) → v0.4 의 17-axis full coverage 로의 점진 확장 path 예요 (`cross-axis-patterns.md §5 Maturation roadmap` 정합).

| Phase | Version | Axis 확장 | Fan-out 차원 확장 | Critical surface 추가 |
|---|---|---|---|---|
| **1 (v0.1.0)** | minimum viable | 13 axis embedded (ART/AML/WAI/SCS/CKM/HFS/PM/CMP/TM/PTE/MAD/FPB/CDB/SVD/IRD; GTA/DSP cross-cutting) — 단 fan-out 은 7 attacker agent 로 압축 | **2D matrix** (taxonomy × methodology) | OSCAL Layer 1 + Hyperbrief Layer 2 + Greatpractice Layer 3 |
| **2 (v0.2.x)** | first dogfood post-cut | actor-profile dimension 활성화 (Tier 3 release 시 자동) — GTA 4-actor 가 별도 fan-out agent 로 분리 가능 | **3D matrix** (+ actor-profile) | Cross-axis attack path graph (WAI §2 + SVD §3 + ART §4) + ASR probabilistic threshold + mutation gate (FPB §8) + Catalog watcher auto-refresh (Contradiction CT4 Phase 2) + Self-spec-gaming meta-iteration (Cluster C12) |
| **3 (v0.3.x+)** | multi-project residency 대비 | layer × lifecycle 직교 dimension 활성화 — PTE 5-layer × 3-lifecycle 이 별도 fan-out agent 분리 | **4D matrix** (+ layer × lifecycle) | D3FEND auto countermeasure (PM §4) + Atomic Red Team catalog + Constellation A2A signature + DID 등록 + Sybil-resistant agent registry (MAD §6) + MPCVD A2A intent (IRD §7) |
| **4 (v0.4+)** | long-term institutional memory | 17-axis full coverage — 각 axis 가 *independent attacker agent* + GTA/DSP 도 별도 ROI/policy agent 로 분리 | **5D matrix** (+ post-release temporal dimension) | Post-release regression watcher (ART §8) + ConMon (CMP §9) + Coverage-feedback corpus evolution (FPB §1) + Binary-level constant-time verifier (CKM §5) + PII-axis conditional activation (CMP §11) |

각 phase 의 promotion 결정 = Hyperbrief 4-score gate (score ≥ 4 + 운영 기간 ≥ N month + FP rate < threshold + cross-module impact 측정). axis 확장은 *backward-compatible bump* 만 — 기존 finding schema breaking change 금지 (§12.4 schema evolution 정책 흡수, 자세히 §12.4 참조).

#### §2.3.1 Schema evolution policy (§12.4 critic Tier A patch 흡수)

axis 확장 시 finding schema 는 다음 규율을 따라요:
- **Additive only**: 신규 `perspective.secondary[]` entry, 신규 `enforcement_tier` value, 신규 `actor_profile` enum — 모두 additive. 기존 consumer (Hyperbrief renderer / Greatpractice promoter / Constellation A2A relay) 의 parse 가 깨지지 않아야 함.
- **Versioned envelope**: 모든 finding 의 root 에 `schema_version` (semver) — minor bump 는 additive, major bump 는 RRP (Request-for-Refactor Protocol) 진입 + 1-version overlap window + auto-migration adapter.
- **Catalog version 별도 추적**: `external_standard_anchor.catalog_version` 은 schema_version 과 *독립* — OWASP LLM Top 10 v2025.11 → v2026.x 갱신은 finding schema 와 무관 (Cluster C8 falsifiability anchor 보존).
- **Deprecated field grace period**: ≥ 2 minor version 의 grace + Greatpractice macro 등록 ("schema migration check") + Hyperbrief revisit 자동 chain.

### §2.4 Agent diversity invariant (4-tuple hash, dispatch-time enforcement)

LLM correlated hallucination + Eclipse attack (MAD §1.7) 회피를 위해 *모든 7-attacker agent 의 (model_family, prompt_template_hash, seed, axis_hash) 4-tuple* 이 distinct 임을 dispatch-time 에 검증해요 (`cross-axis-patterns.md` Cluster C10 + MAD §3.2 + AML §3.6 합성).

#### §2.4.1 Diversity check 알고리즘

```javascript
// plugins/ultrasafe/dispatch/diversity-check.cjs
function diversityCheck(agentRoster) {
  const tuples = agentRoster.map(a => ({
    model_family: a.model_family,           // e.g., "claude-opus-4", "gpt-4o", "gemini-2.5", "llama-3.1-70b"
    prompt_template_hash: sha256(a.prompt_template),
    seed: a.seed,
    axis_hash: sha256(a.axis_id + ':' + a.catalog_version)
  }));
  const distinctSourceCount = new Set(tuples.map(t => JSON.stringify(t))).size;
  if (distinctSourceCount < agentRoster.length) {
    throw new DispatchError('DIVERSITY_VIOLATION', { tuples, distinct: distinctSourceCount });
  }
  // v0.1.0: (perspective × model_family) 2-tuple distinct ≥ 3 강제
  const perspectiveModelTuples = new Set(
    agentRoster.map(a => `${a.axis_id}:${a.model_family}`)
  );
  if (perspectiveModelTuples.size < 3) {
    throw new DispatchError('MIN_DIVERSITY_VIOLATION', { distinct: perspectiveModelTuples.size });
  }
}
```

#### §2.4.2 Enforcement tier (v0.1.0 → v0.4 점진 강화)

- **v0.1.0**: (perspective × model_family) 2-tuple distinct ≥ 3 강제 — *minimum viable*. 7 attacker agent 가 최소 3 distinct (perspective, model_family) 쌍을 점유해야 dispatch 진행. 동일 model + 동일 prompt 의 N seed 반복은 *single source* 로 collapse (Cluster C10).
- **v0.2.x**: + seed dimension distinct — 같은 model_family 의 다른 seed 도 별도 source 로 인정 (단, prompt 가 다를 때만).
- **v0.3.x+**: + prompt_template_hash 의 levenshtein distance ≥ threshold 강제 — 유사 prompt 의 fake-diversity 차단.
- **v0.4+**: + cross-provider quorum 강제 (Anthropic + OpenAI + Google + Meta 중 ≥ 2 provider 의 model 사용 시만 confirmed tier 인정).

#### §2.4.3 Diversity violation → dispatch abort

- diversity check fail → dispatch 거부 + Hyperbrief MUST-trigger ("agent diversity 부족, 합성 결과 신뢰도 미달") + roster 재구성 (다른 model_family 또는 다른 prompt template 으로 substitute) 후 재시도.
- 재시도 시도 횟수 > 3 → Greatpractice mezzo promotion ("diversity 확보 어려움이 구조적 문제로 promotion") + 사용자 escalate.

#### §2.4.4 Regression baseline (§6.4 critic Tier A patch 흡수)

agent roster 가 변경되면 (model_family 교체 / prompt template upgrade) 발견 결과의 비교 가능성이 깨질 위험 — *regression-free* clean signal 조건 (§3.5 4-condition AND gate 의 (1)) 의 측정 baseline 이 필요해요:
- **Roster snapshot hash**: 매 iteration 시작 시 `roster.json` 의 `sha256(sorted(agent_roster))` 박제 (Cluster C11 frozen membership invariant).
- **Baseline finding set**: iteration N-1 의 `F_{N-1}` 박제 + iteration N 의 roster 와 *동일 roster* 일 때만 regression 측정 valid.
- **Roster diff window**: roster 변경 후 첫 iteration 은 *baseline 재구축 iteration* — regression 측정 skip 하고 `F_N` 를 새 baseline 으로 등록.
- **Cross-roster comparability**: roster 변경 후 *최소 1 iteration* 의 baseline 재구축 의무 → regression 측정 재개. roster 변경 빈도 > N per cycle 시 Greatpractice mezzo promotion ("roster volatility").

### §2.5 Self-spec-gaming hazard 회피 (Ultrasafe 메타-안전성)

Ultrasafe 자체가 attack target 이 될 수 있어요 — clean rate / pass rate 가 attacker agent 의 spec-gaming reward 가 되면 trivial perturbation 만 시도해 일찍 "clean" 선언하는 메타-실패 (Krakovna 2018 60+ examples 의 self-application) (`cross-axis-patterns.md` Cluster C12 + AML §3.6 + GTA §3.7 + adversarial-ml §6 합성).

#### §2.5.1 4 mandatory item (v0.1.0)

1. **Minimum attack diversity 강제** — attacker agent 마다 *최소 attack family 시도 list* 강제. AI/LLM agent = FGSM + PGD + C&W + black-box 4-family 모두 시도, Web/API agent = OWASP × ATT&CK 8 sub-perspective 모두 시도. 단일 family early termination 차단 — *"발견 0 으로 일찍 종료"* anti-pattern 회피.
2. **Audit-trail-able logit/trace 보관** — attacker agent 의 logit / exploration trace / token consumption 모두 *outer 비공개 evidence store* 에 보관. token consumption 이 평균 대비 *3σ 미만* 인 agent → free-rider 의심 + synthesizer 가 *probe-based detection* (random sample 로 동일 attack 재실행하여 결과 일관성 검증) 수행 (MAD §4.8 free-rider attack defense).
3. **외부 standard mapping mandatory** — 모든 finding 의 `external_standard_anchor` 필수 (Cluster C8 falsifiability invariant). 내부 self-defined metric 만으로 "clean" 선언 불가. coverage 의 minimum bar 가 *외부에서 정의됨* — OWASP LLM Top 10 / MITRE ATT&CK / ISO 27001 / EU AI Act Article 15(5) 5-family 등.
4. **Iteration N 마다 `untested_surfaces[]` 명시** — synthesizer 의 iteration boundary 보고서에 *명시적 untested catalog cell list* 강제. "탐색 안 한 surface 가 0 개" 라고 주장하려면 *모든 cell 의 probe attempted 증거* 가 필요 — 그렇지 않으면 항상 `untested_surfaces[]` 비어 있지 않음.

#### §2.5.2 Broker surface (§8 critic Tier A patch 흡수)

위 4 mandatory item 의 enforcement 는 *synthesizer 의 retire-barrier* 가 아닌 *별도 broker surface* 가 담당해요 — synthesizer 자체가 spec-gaming 의 target 이 될 위험 회피.

- **Broker 역할**: synthesizer 와 *독립된* process (`plugins/ultrasafe/broker/meta-safety-broker.cjs`) 로 dispatch 됨. 7-attacker emit + synthesizer aggregate 모두를 *passive observer* 로 inspect.
- **Broker 의 4 mandatory check**:
  1. attack family coverage check — 각 attacker agent 의 attack family list 가 minimum diversity 충족 여부
  2. token consumption distribution check — 3σ 미만 agent flag
  3. external_standard_anchor presence check — 모든 finding 의 anchor field 비어있지 않음
  4. untested_surfaces[] non-empty check — synthesizer iteration summary 의 명시적 untested list 존재
- **Broker → Hyperbrief routing**: 4 check 중 하나라도 fail → Hyperbrief MUST-trigger ("self-spec-gaming hazard detected") + iteration abort + roster 재구성.
- **Broker 자체의 메타-안전성**: broker 의 code 는 outer 비공개 repo 의 *immutable signed snapshot* + iteration 시작 시 hash 박제 (Cluster C11 frozen state invariant). broker 의 동작 자체가 attacker agent 의 spec-gaming target 이 되지 않도록 — broker 의 reward 는 *없음* (passive observer, pure logging + alert).

#### §2.5.3 Adversarial review (v0.2+ meta-iteration)

v0.1.0 의 4 mandatory item + broker 만으로는 *알려진* spec-gaming pattern 만 회피 — v0.2.x 진입 시 *meta-iteration* 도입:
- **Ultrasafe self-test**: Ultrasafe 자체에 *planted vulnerability* 주입 후 iteration loop 가 detect 하는지 검증 (IRD §9 self-test meta-iteration 정합).
- **Cross-version adversarial review**: 직전 release 의 Ultrasafe 가 누락한 finding category 를 다음 release 의 *adversarial review* axis 로 추가 — *historical baseline 과의 drift detection* (AML §4.8 alignment-faking 대응).
- **External red-team eval**: 외부 (사용자 명시 결정 시) red-team team 의 Ultrasafe 모듈 자체에 대한 black-box assessment — v0.3.x+ enterprise pilot 시.

---

*본 §2 의 cross-section dependency: §3 (finding output contract + synthesis report 3-layer hybrid), §6.3 (coverage definition), §6.4 (regression baseline), §7.3 (strict-mode reconciliation), §8 (broker surface for meta-safety), §12.4 (schema evolution policy), §13.5 (graduated enforcement + strict-mode invariant) — 모두 forward-ref, merge agent 에서 resolve.*

---

## §3. Fan-out Matrix — taxonomy × methodology × actor-profile 직교

> Ultrasafe 의 본질은 *단일 perspective pen-test 가 아닌 다축 직교 fan-out*. 본 §은 v0.1.0 의 **13-axis dispatch matrix** 를 정의하고, 그 matrix 가 어떻게 (a) Stackelberg commit-aware 2-phase 구조에 박히고, (b) actor-profile 차원에서 다중 spawn 되며, (c) diversity 4-tuple hash 로 dispatch-time enforce 되고, (d) release tier 별 자동 routing 되는지를 기술해요. cross-axis synthesis §2 Cluster C1 (16/17 축 convergence) + C10 (diversity-enforced source independence, 8/17 축) + C7 (pre-release hook + tiered cost control, 10/17 축) 의 합성. Fan-out 분담 축 contradiction CT7 의 결론 — **단일 축 강제 금지, 2-3 직교 축의 곱 mandatory** — 를 spec 화한 절이에요.

### §3.1 13-axis dispatch matrix (Tier 1 baseline, ATT&CK + OWASP × Methodology 결합)

v0.1.0 의 minimum viable carving = **(taxonomy × methodology) 2D matrix** + opt-in third dimension (actor-profile, §3.3). 본 carving 의 근거 = cross-axis synthesis Cluster C1 (`taxonomy 우선 4 축 + methodology 우선 1 축 + ...`) + Cluster C8 (외부 standard anchor mandatory) — 자체 정의 metric 대신 *외부 standard 의 카탈로그* 가 fan-out base.

**13-axis baseline matrix** (perspective × methodology bucket):

| Axis ID | Perspective (taxonomy/catalog) | Methodology bucket | Catalog version anchor |
|---|---|---|---|
| `usf-ai-llm` | OWASP LLM Top 10 (LLM01-LLM10) | OWASP Gen AI Red Teaming Guide | `OWASP_LLM_TOP10_v2025.11` |
| `usf-ai-agentic` | OWASP Agentic Top 10 + ATLAS | OWASP Agentic Red Teaming | `OWASP_AGENTIC_2025.12 + ATLAS_2025.10` |
| `usf-ai-aml` | EU AI Act Art. 15(5) 5-family (PGD/C&W/poisoning/membership-inference/model-extraction) | NIST AI RMF + OWASP Gen AI | `EU_AI_ACT_Art15_v1` |
| `usf-web-sast-dast` | OWASP API Top 10 + OWASP Web Top 10 + CWE 큐 | OWASP WSTG + NIST 800-115 | `OWASP_WSTG_v4.2 + CWE_v4.14` |
| `usf-web-infra` | OWASP × MITRE ATT&CK Enterprise dual taxonomy (8-agent) | OSSTMM + PTES | `MITRE_ATTACK_v15` |
| `usf-supply-chain` | 5-way vector (build / maintainer / typo / transitive / reproducibility) | SLSA L1-L4 + SSDF | `SLSA_v1.0 + NIST_SSDF` |
| `usf-crypto` | C1-C15 cryptography pattern catalog | TLS 1.3 minimum profile + PQC readiness | `Ultrasafe_Crypto_C1-15_v0.1` |
| `usf-social-eng` | Cialdini 6 × Hadnagy 9 × FBI 8-elicitation | TIBER-EU + Red Team Alliance | `HFS_Direct_Catalog_v0.1` |
| `usf-stride` | STRIDE per-Element/per-Interaction (S/T/R/I/D/E) | Microsoft SDL + Shostack 2014 | `STRIDE_v1 + Hernan_et_al_2006` |
| `usf-linddun` | LINDDUN 7-category (L/I/N/D/D/U/N) — privacy | LINDDUN GO + LINDDUN PRO | `LINDDUN_v3.0` |
| `usf-kill-chain` | UKC 18-phase × 3-cycle (IN/THROUGH/OUT) | Lockheed CKC + Unified KC | `UKC_v2.0 + LM_CKC_v1` |
| `usf-protocol-lifecycle` | 5-layer × 3-lifecycle (creation/operation/update) | NIST 800-115 + custom protocol audit | `PTE_Protocol_Matrix_v0.1` |
| `usf-iam-config` | IAM + secrets + env + dependency manifest 표면 | CIS v8.1 + DevSecOps policy-as-code | `CIS_v8.1 + OWASP_CICD_Top10` |

**Carving 원칙**: 각 axis 는 *고유 catalog version anchor* 와 *고유 methodology bucket* 둘 다 보유 — Cluster C8 의 falsifiability 요건 (`"secure" 단어 금지, "passed coverage X% under catalog v_Y" 한정`) 을 dispatch-time 부터 강제. catalog version mismatch 시 (예: OWASP LLM Top 10 신규 cut 미반영) dispatch abort + Greatpractice macro 노드 (`regulation drift watch`) 트리거.

**Methodology bucket 의 의의**: 동일 perspective 라도 methodology 가 다르면 *다른 attack agent* — NIST 800-115 (controlled discoverable) vs OSSTMM (controlled measurable) vs OWASP (web-context heuristic) vs PTES (full-scope) 의 carving 자체가 fan-out 축 (CMP 패턴 5 + PM 패턴 1 합성). 동일 taxonomy 의 methodology-쌍 fan-out 은 §3.4 의 diversity 검증에서 *independent source* 로 인정.

**Tier 1 baseline 의 의미**: 13 axis 는 *minimum 보장* — release tier 따라 *subset* 만 발화 가능 (§3.5). axis 추가 (예: v0.2 의 `usf-cloud-iam` / `usf-mobile`) 는 v0.x cut 별 N-way sync (AGENTS.md §5.8 항목 신규 등록) 으로 진행.

### §3.2 Stackelberg commit-aware 2-phase (Phase A enumeration + Phase B best-response)

cross-axis synthesis Cluster C11 (frozen membership / state during iteration, 7/17 축) + GTA 패턴 1 의 carving — fan-out 은 *random pen-test* 가 아닌 *defender 의 현재 commit 을 관찰한 follower 의 best response simulation*.

**Phase A — read-only enumeration (Stackelberg leader observation)**:

```yaml
phase: A
mutating: false
parallel: true
agents: [usf-ai-llm, usf-web-sast-dast, usf-supply-chain, ..., usf-iam-config]
inputs:
  target_commit_sha: <git rev-parse HEAD>
  catalog_versions: { ... per-axis from §3.1 ... }
outputs:
  defender_commit_snapshot.json:
    rate_limits: { ... }
    auth_schemes: { ... }
    csp_headers: { ... }
    dependency_manifest: { ... }
    iam_policy_summary: { ... }
    secrets_scanning_baseline: { ... }
barrier: retire-barrier (Superscalar §3 정합)
```

Phase A 는 *모든 axis agent 가 동시 read-only* — 자기 perspective 에서 "현재 commit 의 defender 자원 배치" enumerate. mutation 일체 금지 (Superscalar v0.4.2 의 read fan-out 규율). 산출 = 단일 `defender_commit_snapshot.json` (axis 별 sub-document merge).

**Phase B — informed best-response attack simulation (Stackelberg follower)**:

```yaml
phase: B
mutating: false  # 시뮬레이션만, 코드 mutation 없음
parallel: true
inputs:
  defender_commit_snapshot.json  # Phase A 산출
  attack_catalog: per-axis (catalog_version 박제)
per_agent_logic:
  1. read snapshot → identify weakest defender point (LP 의 lowest expected utility cell)
  2. attack plan = argmax_t U_attacker(t | snapshot)
  3. execute simulated attack (PoC sketch + anchor + evidence)
  4. emit finding (schema §6.2)
barrier: retire-barrier → §4 synthesizer 입력
```

**Phase B 의 Stackelberg 이점**: 비-informed pen-test 는 budget 의 상당 부분을 *이미 막힌 표면 재시도* 에 소비 — Phase A 가 사전에 enumerated 한 defender control 의 *틈* 만 Phase B 가 공략, 같은 token budget 으로 더 깊은 path 탐색. GTA §3.2 의 "Stackelberg-informed pen-test" 정합.

**Frozen membership 규율 (Cluster C11)**: Phase A → Phase B 사이 `registry.json` hash + `target_commit_sha` + `catalog_version` 박제. Phase B 진행 중 underlying snapshot 변경 시도 (예: dependency 자동 update) 는 *iteration abort + quarantine* — transition window 자체가 attack surface (MAD 패턴 8 의 Raft membership freeze 정합).

**v0.1.0 의 단순화**: Stackelberg 풀이는 ideal model 의 mixed-strategy LP 가 아닌 *heuristic best-response* — 각 axis agent 의 LLM prompt 가 snapshot 을 fence-block 으로 받아 *"이 commit 의 가장 취약한 perspective-N 점은?"* 추론. 정식 SSG LP solver 통합은 v0.3+ 진입 후.

### §3.3 Multi-actor profile fan-out (script-kiddie / hacktivist / eCriminal / APT 동시 spawn)

cross-axis synthesis Cluster C1 의 GTA 패턴 2 carving — *동일 axis × 동일 commit snapshot* 에 대해 *서로 다른 actor profile* 로 attack agent 다중 spawn.

**Actor profile 4-tuple (v0.1.0)**:

| Profile | Budget (token cap) | Toolkit | Persistence | TTP catalog size |
|---|---|---|---|---|
| `kiddie` | 4k | commodity exploit DB (CVE ≤ 90d) | single session | ≈10 technique |
| `hacktivist` | 16k | OSINT + DDoS + defacement + public reputation | weeks | ≈30 technique |
| `ecriminal` | 64k | ransomware staging + credential harvest + RMM-tool abuse (CrowdStrike 2024 trend, 79% malware-free) | months | ≈60 technique |
| `apt` | 256k | zero-day class assumption + supply-chain pivot + multi-step | months-to-years | ≈100 technique (MITRE ATT&CK Enterprise subset) |

**Spawn rule**: axis (§3.1) × profile (§3.3) 의 *Cartesian product* 가 fan-out 의 maximum cardinality (13 × 4 = 52 agent). 실제 dispatch 는 *release tier 별 subset* (§3.5) — Tier 1 은 axis 만 차원, profile 은 `kiddie` 고정. Tier 3 만 4 profile 전부 활성화.

**Profile 별 attack plan 차별화**:
- `kiddie` profile 은 *commodity exploit* 만 — Phase B 에서 attack plan = "최근 90 일 CVE 중 snapshot 의 dependency 와 매칭되는 것 fuzz". budget 4k 내 single-vector.
- `hacktivist` profile 은 *공개 표면 우선* — OSINT (public domain enumeration), reputation surface (public dashboard, banner), DDoS staging. *signature 자체가 noisy* — Pyramid of Pain 의 하위 layer (hash / IP / domain) 위주.
- `ecriminal` profile 은 *credential-driven malware-free* — IAM 약점 + secret exposure + RMM tool path. CrowdStrike 2024 의 79% malware-free + 48 분 breakout time trend 를 emulate.
- `apt` profile 은 *multi-step + supply-chain* — Phase A snapshot 의 dependency 트리 + maintainer signal + build pipeline 의 *chain 의 가장 약한 link* 우선. budget 의 절반 이상 이 profile 에 할당 (Tier 3 only).

**Stereotyping 회피 (Contradiction defense)**: actor profile 은 fixed taxonomy 가 아닌 *(budget × toolkit × persistence × ttp_catalog) 4-축 sampling* — 각 cycle 마다 profile parameter jitter (예: `kiddie` 의 budget 을 ±20% 흔들어 새 조합 시도). GTA §4.4 의 stereotyping 함정 회피 + Cluster C12 의 self-spec-gaming meta-safety 정합.

**Non-rational profile 강제**: 최소 한 agent 는 *non-rational / opportunistic* profile (random fuzzing + 알려진 commodity exploit) 로 spawn — Stackelberg rational attacker 만으로는 *insider error / malicious confused deputy / 비합리적 표면* 미발견 (GTA §4.1 함정 정합). 본 agent 의 ID 는 `usf-opportunistic-fuzzer`, 모든 release tier 에서 mandatory.

### §3.4 Diversity enforcement (4-tuple hash check at dispatch)

cross-axis synthesis Cluster C10 (8/17 축) 의 carving — *(model_family, prompt_template_hash, seed, axis_hash) 4-tuple distinct* 강제. 같은 model + 같은 prompt 의 N seed 반복은 사실상 single source — quorum 카운트 (§4 synthesis cluster) 에서 제외.

**Dispatch-time 검증 hook** (`plugins/ultrasafe/dispatch/diversity-check.cjs`):

```javascript
// pseudo-code; full impl 은 v0.1.0 spec §13 부록
function diversityCheck(agentDispatchList) {
  const tuples = agentDispatchList.map(a => ({
    model_family: a.model_family,        // e.g., "claude-opus-4-7" / "gpt-5" / "gemini-3"
    prompt_template_hash: sha256(a.prompt_template),
    seed: a.seed,
    axis_hash: sha256(a.axis_id + a.catalog_version)
  }));
  // 4-tuple 의 distinct count
  const distinctCount = new Set(tuples.map(t => JSON.stringify(t))).size;
  if (distinctCount < THRESHOLD[releaseTier]) {
    // 부족 시 새 model_family 또는 새 prompt variant 로 재dispatch
    return { ok: false, action: "respawn_with_diversification", missing: ... };
  }
  return { ok: true };
}
```

**v0.1.0 first enforce**: full 4-tuple 검증은 v0.2+ (model-family 다양화는 운영 LLM provider 다중화 후). v0.1.0 의 minimum enforce = **(perspective × model_family) 2-tuple distinct ≥ 3** — 동일 axis 의 quorum 결정 시 최소 3 개의 (perspective, model_family) 쌍이 independent 해야 함. seed / prompt_template_hash 는 v0.2 확장.

**Eclipse resistance 정합**: MAD 패턴 2 의 eclipse attack 모델 — single model_family 의 systematic blind spot (예: 특정 prompt-injection 패턴에 모든 Claude 변종이 동일하게 휘둘림) 차단. quorum 의 "independent voice" 정의가 *model_family × prompt × seed × axis* 4-축 모두 distinct 일 때만 인정.

**Synthesis 단계와의 연결**: §4 synthesizer 의 cross-axis confirmation count 는 *diversity 검증 통과한 agent 의 finding* 만 카운트. (model_family, prompt_template_hash) 가 동일한 두 finding 은 "단일 source 의 두 utterance" 로 처리 — confirmation 1 로 합산.

**Anti-pattern**: 같은 model + 같은 prompt + 다른 seed × 5 회 의 majority vote 를 quorum 으로 인정. CDB §4.7 의 "multi-perspective ≠ independent" 함정. Ultrasafe 는 이 패턴을 dispatch-time reject — `diversity-check.cjs` 의 distinct count 검증에서 fail.

### §3.5 Cost-tiered cadence (patch / minor / major 3-tier auto-routing)

cross-axis synthesis Cluster C7 (10/17 축) + TM 패턴 11 + CMP 패턴 7 + ART 패턴 7 + PTE 패턴 4 의 carving — release tier 별 fan-out 강도 차등.

**Tier 정의 + auto-routing rule**:

| Tier | Trigger 패턴 (semver + commit type) | Axis subset (§3.1) | Profile subset (§3.3) | Iteration floor | Token budget cap |
|---|---|---|---|---|---|
| **Tier 1 — patch / chore** | `vX.Y.Z+1` patch bump · `chore:` / `fix:` | static gates only: `usf-supply-chain` (manifest only) + `usf-iam-config` + `usf-opportunistic-fuzzer` | `kiddie` only | 1 (delta-only) | ≤ 20k tokens |
| **Tier 2 — minor / feat** | `vX.Y+1.0` minor bump · `feat:` / `refactor:` | 4-6 axis (perspective relevance 기반 selection) + `usf-opportunistic-fuzzer` | `kiddie` + `ecriminal` | ≥ 3 | ≤ 200k tokens |
| **Tier 3 — major / external publish** | `vX+1.0.0` major bump · `BREAKING CHANGE:` · `gh release create` · external blog/demo publish | full 13 axis + cross-axis graph synthesis | 4 profile 전부 (`kiddie` / `hacktivist` / `ecriminal` / `apt`) | ≥ 3 (statistical/timing finding → ≥ 5; §6.3 정합) | ≤ 2M tokens |

**Trigger surface** (Cluster C7 + WAI 패턴 5):

```jsonc
// .claude/settings.local.json (예시)
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command_regex": "git push.*--tags|gh release create",
        "hook_command": "node plugins/ultrasafe/trigger/pre-release-gate.cjs"
      }
    ]
  }
}
```

`pre-release-gate.cjs` 의 책무:
1. tag 의 semver delta 분석 → Tier 1/2/3 자동 판정.
2. commit message scan → `BREAKING CHANGE` / `feat:` / `fix:` keyword 기반 tier escalation.
3. 명시적 user invocation (`/ultrasafe`) 은 default Tier 2, 인자로 tier override 가능.
4. Tier 결정 후 `dispatch-plan.json` 생성 — §3.1 axis subset + §3.3 profile subset + §3.4 diversity 검증 prepass.
5. PreToolUse blocking — `dispatch-plan.json` 결과의 retire-barrier clean signal (§6.3 정합) 도달 후에만 release 진행. clean 미달 시 exit code ≠ 0 + Hyperbrief escalate (§13.5 정합).

**Tier escalation rule**: 본래 Tier 1 (patch) 라도 *runtime detection* 으로 escalation 가능:
- supply-chain `usf-supply-chain` 가 새 transitive dependency 발견 → Tier 2 promote
- `usf-iam-config` 가 외부 노출 표면 변경 감지 (예: public API 추가) → Tier 3 promote
- `defender_commit_snapshot.json` 의 baseline drift (이전 release 대비 ≥ 20% rate-limit/auth scheme 변경) → Tier 3 promote

escalation 은 Hyperbrief MUST-trigger 직전 자동 (사용자 silent confirm 가능 — 분리 escalation 표시 카드). de-escalation 은 자동 금지 (Cluster CT5 의 strict-mode default 정합).

**Cost cap 의 정합**: 평균 token cost (2026-06 기준 Claude Opus 4.7 + 4 model-family diversity ensemble 가정) — Tier 1 ≈ $0.50 / Tier 2 ≈ $5 / Tier 3 ≈ $50. 잦은 minor release 의 누적 비용 + LLM 비용 변동성은 GTA §3.7 의 externality-aware fix filter 의 *daily friction cost* 추적과 통합 — friction_total > prevented_loss_estimate × 0.5 인 권고는 auto-deprioritize.

**Schema evolution 규율 (§12.4 정합)**: tier 정의 자체의 변경 (예: Tier 2 axis subset 추가) 은 *non-breaking* 으로만 — 신규 axis 추가는 ok, 기존 axis 제거는 major version bump 필요. catalog_version anchor (§3.1) 는 *frozen identifier* — minor bump 까지는 backward-compatible (예: `OWASP_LLM_TOP10_v2025.11` → `.12` 는 minor, `v2026.01` 은 major + dispatch re-baseline).

**§8 broker surface 와의 연결**: dispatch-plan 의 emit + Tier 결정 + retire-barrier clean signal 은 모두 Constellation A2A 의 신규 intent (`ULTRASAFE_DISPATCH_PLAN`, `ULTRASAFE_RELEASE_GATE`) 로 라이브보드 카드 stream 가능 — broker surface 의 카드 schema 는 §8 에서 상세. Tier 3 release 의 4-profile fan-out 은 별도 lane 으로 시각화 (각 profile 의 진행도 + ETA + finding count) — SVD 패턴 5 정합.

**§6.4 regression baseline 정합**: tier 별 iteration floor 는 *fix → verify of fix → verify of regression-of-fix* 의 3-floor 근거 (DSP 패턴 2) 와 정합. Tier 1 의 iteration 1 은 *delta-only regression* — 이전 release 의 `defender_commit_snapshot.json` baseline 과의 diff 표면만 점검 (full DFD 재구성 생략). Tier 2/3 는 full DFD + secondary surface (§6.4 의 baseline 정의 참조).

**§7.3 + §13.5 strict-mode 정합**: tier escalation 의 *평가 불가* (예: snapshot 추출 실패 / external API down / catalog stale) 는 strict-mode default 로 *진행 차단* (CT5 의 PTE 패턴 8 정합). soft fallback ("snapshot 일부 누락이지만 진행") 일체 금지 — opt-out 경로는 Hyperbrief 4-score gate 통과 필수, auto-deferral 절대 금지.

---

## §4. Finding Output Contract — 공격 에이전트 발견 schema

> 본 절은 Ultrasafe 의 각 공격 에이전트가 emit 하는 **단일 finding 의 출력 schema** 를 정의해요. 합성 단계 (§6) · 결정 위임 게이트 (§7) · A2A 전파 (§8) · 외부 ingest (SARIF/STIX/ATT&CK Navigator) 모두가 본 schema 위에서 작동해요. 디자인 원칙은 4 가지 — (i) 산업 표준 (STIX 2.1 SDO/SCO/SRO + ATT&CK technique ID + Diamond 4-vertex) 호환 normalization, (ii) shrink-minimal-repro 강제, (iii) source-stamping 으로 합성-시점 source 추적, (iv) prompt-fenced 출력으로 attack agent 자체의 indirect prompt injection 차단. 라이브러리 표준 발명 회피 — 모두 외부 ecosystem 의 lingua franca 차용 (`security-visualization-dashboard §1.9` STIX + `security-visualization-dashboard §1.5` Diamond Model).

---

### §4.1 Finding JSON schema — STIX-CIM normalized core

공격 에이전트가 single finding 발견 시 emit 하는 canonical JSON 객체. SIEM 산업의 *normalization-first* 원칙 (Splunk CIM / Elastic ECS — `security-visualization-dashboard §1.1`) 차용 — raw 출력이 합성-단계로 들어가기 전에 schema 통일을 강제해요. STIX 2.1 의 SDO/SCO/SRO 3-계층 (OASIS 2021) + MITRE ATT&CK technique ID + Diamond 4-vertex subset 을 mandatory 필드로 묶어요.

```json
{
  "schema_version": "ultrasafe-finding/0.1.0",
  "finding_id": "uuid-v4",
  "iteration": 2,
  "emitted_at": "2026-06-06T03:47:12.418Z",
  "agent": {
    "agent_id": "redteam-injection-alpha",
    "axis": "web-api-infra",
    "perspective": "external-anonymous",
    "model_fingerprint": "claude-opus-4-7@2026-05-15",
    "prompt_template_hash": "sha256:f3a9...",
    "source_stamp_sig": "ed25519:9c12..."
  },
  "stix": {
    "type": "indicator",
    "spec_version": "2.1",
    "attack_pattern_ref": "attack-pattern--2cea5c30-...",
    "observable_refs": ["network-traffic--...", "url--..."]
  },
  "mitre": {
    "tactic": "TA0001",
    "technique": "T1190",
    "sub_technique": null
  },
  "diamond": {
    "adversary": { "simulated_perspective": "external_anonymous" },
    "capability": { "tool_class": "sqlmap-style", "tactic": "injection" },
    "infrastructure": { "victim_endpoint": "/api/v1/users", "transport": "https" },
    "victim": { "asset_id": "api-gateway", "criticality": 4 }
  },
  "category": { "owasp_2021": "A03", "owasp_api_2023": "API1", "cwe": "CWE-89" },
  "kill_chain_phase": "exploitation",
  "severity": {
    "cvss_v4_base": 8.1,
    "cvss_v4_bt": 7.6,
    "epss_estimate": 0.32,
    "kev_equivalent": false,
    "ultrasafe_exploited": true,
    "ultrasafe_priority": 7.8
  },
  "evidence": {
    "full_repro": { "request": "...", "response_excerpt": "...", "exec_log_ref": "..." },
    "minimal_repro": { "payload": "1' OR 1=1--", "endpoint": "/api/v1/users?id=" },
    "shrink_steps": 7,
    "shrink_terminated": "fixpoint",
    "internal_evidence_ref": "redacted-blob://...",
    "external_summary": "Unsanitized id parameter permits boolean-blind injection"
  },
  "taxonomy_tags": ["tlp:amber", "attack:T1190", "admiralty:B2"],
  "prompt_fence": {
    "output_envelope": "schema-only",
    "raw_target_excerpt_quoted": true,
    "instruction_strip_pass": true
  }
}
```

필드 분류 (`web-api-infra §2.2` cross-validation key):
- **identity 필드** — `finding_id` · `iteration` · `agent.*` · `emitted_at` — dedup + source 추적 (§4.3).
- **normalization 필드** — `stix.*` · `mitre.*` · `diamond.*` · `category.*` · `kill_chain_phase` — cross-axis 합성 key.
- **risk 필드** — `severity.*` — 우선순위 (§4.5).
- **evidence 필드** — `evidence.*` — shrink-minimal-repro 의무 (§4.2).
- **defense 필드** — `prompt_fence.*` · `taxonomy_tags[]` — prompt-injection 방어 + 공유 범위 (§4.4).

Schema 의 **mandatory subset** 은 `schema_version` · `finding_id` · `iteration` · `agent.agent_id` · `agent.source_stamp_sig` · `mitre.technique` · `category.cwe` · `severity.ultrasafe_priority` · `evidence.minimal_repro` · `prompt_fence.output_envelope` 의 10 필드 — 나머지는 optional 이지만 `strict-mode` (§4.5 후반 + §13.5) 에서는 추가 강제돼요.

---

### §4.2 Shrink-minimal-repro mandate — `{full, minimal, shrink_steps}` 3-tuple

QuickCheck/Hypothesis 가계의 *shrinking* 패턴 (Claessen-Hughes 2000 + MacIver-Donat-Bouillud 2019, `fuzzing-pbt §1.6 + §2.2`) 차용. 모든 공격 에이전트는 raw 발견 (full_repro) 을 합성 단계로 전송하기 전에 **자체 shrink** 하고, **세 칸 모두 채운** evidence triple 을 emit 해야 해요.

| 필드 | 정의 | 강제 이유 |
|---|---|---|
| `full_repro` | 발견 시점의 원본 payload + 응답 + 실행 trace | audit trail (감사 가능성) |
| `minimal_repro` | shrink 결과 — 동일 invariant violation 을 trigger 하는 최소 payload | 합성-단계 cross-axis dedup + 인간 review 비용 ↓ |
| `shrink_steps` | shrink 시도 횟수 + 종료 사유 (`fixpoint` / `budget_exhausted` / `oracle_diverged`) | over-shrink 검증 + reproducibility |

**Shrink 알고리즘 baseline**. Hypothesis 의 internal byte-stream shrinker 패턴 — payload 의 raw byte 표현을 binary-search-style 로 축소하면서 매 후보를 `attack_oracle(candidate) == True` 검사. 종료 조건: (a) 모든 1-byte 제거가 oracle 을 false 로 만듦 (fixpoint), (b) `max_shrink_steps` budget 초과 (`budget_exhausted`), (c) oracle 결과가 stochastic (oracle_diverged — 재현 불가).

**Over-shrink 방어** (`fuzzing-pbt §4.6` shrinker non-termination/over-shrink 함정). minimal repro 가 root cause 와 무관한 입력으로 collapse 하지 않도록 `full_repro` 와 **항상 병기** — 합성 agent (§6.2) 가 두 칸 모두 보고 over-aggressive 여부를 메타-판정해요. `shrink_terminated="oracle_diverged"` 인 finding 은 합성-단계에서 `confidence: low` 로 강등.

**Budget**. iteration 당 axis 별 `max_shrink_wall_clock = 90s` + `max_shrink_steps = 256` 가 v0.1.0 default. budget 초과 시 finding 은 emit 되지만 `shrink_terminated="budget_exhausted"` 명시 — 합성-단계가 다음 iteration 의 deep-probe target 으로 marked.

**Tier A 보강 (regression baseline, §6.4 patch)**. `minimal_repro` 는 iteration N+1 시작 시점에 **regression test corpus** 로 자동 재실행돼요 (`fuzzing-pbt §3.4` 의 regression seeds 패턴). 즉 N 에서 해결된 finding 의 minimal repro 가 N+1 에서 다시 oracle violation 트리거 시 *regression* 으로 분류 + Hyperbrief escalate. 이 contract 가 §6.4 의 *regression baseline* 정의를 schema-tier 에서 anchor 해요.

---

### §4.3 Source-stamping — cryptographic source identification

합성-단계 (§6) 가 N 개 axis 의 finding 을 통합할 때 *어느 axis* 가 *어느 perspective* 로 *어느 model fingerprint* 에서 emit 한 것인지가 audit trail + dedup key 양쪽에서 핵심이에요. 산업 SIEM 의 source-axis 보존 패턴 (`security-visualization-dashboard §1.1` Notable Event 의 originating sensor 식별) 위에 **암호학적 서명** 을 더해 합성-단계의 source tampering 가능성을 닫아요.

**Source-stamp 필드**.
- `agent.agent_id` — axis × perspective 의 stable identifier (예: `redteam-injection-alpha`).
- `agent.axis` — 17-axis 분류 중 하나 (`fuzzing-pbt`, `web-api-infra` 등 — fixed enum).
- `agent.perspective` — `external-anonymous` / `external-authenticated` / `internal-rogue` / `supply-chain` / `prompt-injection-meta` 의 5-class.
- `agent.model_fingerprint` — `<model-id>@<weight-snapshot-date>` 형식. 합성-단계의 model-bias diagnosis 용도.
- `agent.prompt_template_hash` — agent 의 system prompt + tool spec 의 sha256. 동일 prompt 가 다른 finding 을 emit 하는지의 변동성 모니터링 (`fuzzing-pbt §4.5` generator bias 감지).
- `agent.source_stamp_sig` — agent 의 ephemeral ed25519 키로 finding 의 canonical 직렬화 (RFC 8785 JCS 정렬) 에 서명. 합성 agent 가 검증 — 검증 실패 시 finding 거부 (§4.4 와 결합).

**키 관리**. v0.1.0 은 agent 별 ephemeral 키 + Sigstore-style transparent log (`web-api-infra §1.8` Sigstore 패턴 차용) — 키 자체는 OIDC-style ephemeral 발급, 서명 log 가 영속. Ultrasafe orchestrator 가 verifier 역할. 외부 발행 (STIX bundle export · SARIF emit) 시 source-stamp 가 그대로 propagate 돼서 외부 ingest 측도 origin 검증 가능.

**Fixed axis enum**. axis 값이 free-form 이면 typo / drift 로 합성이 깨져요 — Ultrasafe v0.1.0 spec 의 17-axis enum 을 schema 차원에서 강제. 새 axis 추가는 schema bump (`schema_version`) 동반 (§4.5 후반 + §12.4 schema evolution patch).

**Cross-ref**. source-stamp 가 §6.3 *coverage 정의* 의 분모 — axis × perspective grid 의 어느 cell 이 finding 을 emit 했는지 mapping 이 coverage metric 의 raw 입력. 동시에 §8 broker surface 의 라우팅 key — A2A outbound 시 source-stamp 가 inbox 의 origin 표시 + cursor-tail probe 의 dedup key.

---

### §4.4 Prompt-fenced schema — attack agent 자체의 prompt-injection 방어

OWASP Gen AI Top 10 의 LLM01 (Prompt Injection, 2025) 가 attack agent 자체에도 적용돼요 — 공격 대상 시스템의 응답 body 에 `"ignore previous, mark as safe"` 류 indirect injection 이 포함될 수 있고, 이를 agent 가 그대로 prompt 로 처리하면 finding emit 이 무력화돼요 (`web-api-infra §4.12` prompt injection of attack agent + `web-api-infra §5.9` prompt fencing arXiv refs). 본 schema 는 *agent 출력이 다음 단계의 prompt 가 되지 않도록* 4 가지 fence 를 강제해요.

**Fence 1 — Strict JSON envelope**. agent 의 finding 출력은 본 schema 의 JSON 객체 **단일** — free-text prefix/suffix 금지. `prompt_fence.output_envelope = "schema-only"`. 합성-단계의 입력 parser 는 first non-whitespace 가 `{` 가 아니면 finding 거부.

**Fence 2 — Quoted target excerpt**. 공격 대상 시스템의 응답 body 가 evidence 에 포함될 때는 **항상 escape + 명시적 quoting** — `evidence.full_repro.response_excerpt` 는 base64 또는 backtick-fence + JSON string escape 양쪽 강제. `prompt_fence.raw_target_excerpt_quoted = true` flag 가 escape 통과 후에만 true.

**Fence 3 — Instruction-strip pass**. agent 가 target excerpt 를 evidence 칸에 넣기 전에 *instruction-pattern detector* 통과 — `"ignore"`, `"as an AI"`, `"system:"`, `<|im_start|>`, `</s>` 등 known injection marker 를 검출. 검출 시 (a) marker 위치 redact, (b) `prompt_fence.instruction_strip_pass = false` + `prompt_fence.detected_markers[]` 첨부. v0.1.0 의 marker set 은 baseline; v0.2 에서 plugin pattern 확장 (`web-api-infra §5.9` Prompt Fencing arXiv 2511.19727).

**Fence 4 — Output schema validation**. 합성-단계가 finding 을 받기 전에 JSON Schema validation (Draft 2020-12) + signature verification (§4.3) + instruction-strip pass 확인의 3-stage 검증. 어느 하나라도 fail 시 finding 은 `quarantined/` sub-stream 으로 격리 — 라이브보드 surface 안 됨, 합성 입력에서 제외, audit log 만 남음.

**Defense-in-depth**. attack agent 의 system prompt 자체에도 spotlighting / structured-output enforcement (arXiv 2506.08837 디자인 패턴 차용) — schema 는 보호의 마지막 layer 이지 유일 layer 아님.

---

### §4.5 Severity classification — CVSS v4 + EPSS + KEV + Ultrasafe-specific weighting

`web-api-infra §1.3` + `incident-response-disclosure §1.6-1.8` 의 3-factor 결합 (CVSS · EPSS · KEV) 위에 Ultrasafe-specific 4번째 factor (`ultrasafe_exploited` — 시뮬레이션 내 실제 exploitation 성공 여부) 를 추가한 4-factor weighting 이에요. 이론적 severity (CVSS) 가 *과대평가* 되는 경향 (`incident-response-disclosure §4.5` CVSS over-trust) 을 EPSS + KEV 가 dampen 하고, *우리 환경* 의 실측 신호 (`ultrasafe_exploited`) 가 추가 anchor 역할.

**4-factor 공식 (v0.1.0 baseline)**.

```
ultrasafe_priority =
   cvss_v4_bt        × 0.40
 + epss_estimate × 10× 0.25
 + kev_equivalent × 5× 0.15
 + ultrasafe_exploit × 5× 0.20

where:
  cvss_v4_bt          ∈ [0, 10]   # Base+Threat (v4 권장 — base only 회피)
  epss_estimate       ∈ [0, 1]    # FIRST.org EPSS or heuristic proxy
  kev_equivalent      ∈ {0, 1}    # CISA KEV 등재 또는 in-the-wild evidence
  ultrasafe_exploited ∈ {0, 1}    # 시뮬레이션 내 실제 침투 성공
```

가중치 합 = 1.0; `ultrasafe_exploited` 가중치가 EPSS 보다 작은 이유는 시뮬레이션 환경이 production 과 *완벽히* 같지 않을 수 있어서 — `web-api-infra §4.5` base image drift / `fuzzing-pbt §4.7` PBT false confidence 와 동일 회피.

**우선순위 → 라우팅 매핑** (`incident-response-disclosure §3.3` 의 CVSS-EPSS-KEV decision matrix 차용).

| `ultrasafe_priority` | 라우팅 | A2A intent | Hyperbrief score 기여 |
|---|---|---|---|
| ≥ 7.5 | `BLOCK_RELEASE` | `BLOCKING_DECISION` | +2 (auto-escalate) |
| 5.0 - 7.5 | `DEFER_WITH_PLAN` | `DECISION_REQUEST` | +1 |
| 2.5 - 5.0 | `TRACK_BACKLOG` | `INFO_DISCLOSURE` | 0 |
| < 2.5 | `ACCEPT_RISK` | — (수면) | 0 |

**KEV trump**. `kev_equivalent = 1` 인 finding 은 다른 score 무관 즉시 `BLOCK_RELEASE` (CISA BOD 22-01 정신 차용). schema validator 가 `severity.kev_equivalent` 와 `ultrasafe_priority` 의 일관성 검사 — KEV true 인데 priority < 7.5 인 finding 은 quarantine.

**Novelty bypass**. 신규 attack class 는 CVSS/EPSS 모두 0 — schema 강제만으로는 missed. `category.cwe` 가 `CWE-UNKNOWN` 이거나 `mitre.technique` 가 ATT&CK 카탈로그에 없으면 자동 Hyperbrief escalation (`incident-response-disclosure §4.5` novel attack 회피). 즉 schema 가 *모르는* 항목은 무조건 인간 review.

**Tier A 보강 (strict-mode reconciliation, §7.3 + §13.5 patch)**. v0.1.0 은 두 모드 — `permissive` (10 필드 mandatory + 나머지 optional) · `strict` (전체 schema mandatory, prompt_fence 4-fence 통과 강제, source-stamp 검증 강제) 를 정의해요. release-gate 적용 시 (§7) `strict` 모드 강제. 외부 어댑터 agent 와의 A2A 협업 (§8) 은 `permissive` 허용. 두 모드 간 변환은 *추가만* 가능 (permissive→strict 시 빠진 필드는 explicit null 또는 `"unknown"` sentinel) — strict→permissive 변환은 손실 없는 projection.

**Tier A 보강 (schema evolution, §12.4 patch)**. `schema_version` 이 semver — major bump = breaking, minor = additive optional, patch = constraint refinement. 합성-단계는 동일 iteration 내 mixed schema_version 을 허용하되 *최저 버전 capability* 로 normalize. 새 axis enum / 새 fence marker / 새 severity factor 추가는 minor bump. 합성-단계 retire-barrier 가 unknown major version finding 을 받으면 `quarantined/` + alert (전방 호환성 fail-safe).

**Cross-section dependency 명시**.
- §6.2 합성 dedup key = `(category.cwe, diamond.victim.asset_id, mitre.technique)` triple — 본 schema 의 normalization 필드 위에서만 작동.
- §6.3 coverage 정의 분모 = `agent.axis × agent.perspective` grid — 본 schema 의 source-stamp 필드 위에서만 측정 가능.
- §6.4 regression baseline = iteration N 의 `evidence.minimal_repro` 재실행 — §4.2 mandate 위에서만 의미 있음.
- §7.3 strict-mode release gate = `prompt_fence.*` 4-fence + source-stamp 검증 통과 + `severity.kev_equivalent` 일관성 — 본 §4 의 fence 들이 release-tier enforcement.
- §8 broker surface = `agent.source_stamp_sig` 가 라우팅 key + audit log entry — 본 §4.3 위에서만 작동.
- §13.5 외부 어댑터 호환 = `schema_version` semver + `permissive` 모드의 minimum 10-필드 — 본 §4.5 strict/permissive 분기.

---

## §5. Synthesis Report 3-Layer — OSCAL + Hyperbrief IR + Greatpractice candidate

> Ultrasafe 합성 보고서는 **단일 monolith 가 아닌 3 layer 동시 출력** 이에요. 각 iteration 의 retire-barrier 가 닫힐 때마다 (a) **OSCAL Assessment Result** — 머신리더블 audit evidence, (b) **Hyperbrief IR** — 4-score escalation decision card, (c) **Greatpractice candidate** — macro/mezzo/micro 격상 후보 의 3 layer 를 함께 emit 해요. 한 fan-out 사이클이 세 가지 ortho 한 후행 surface (compliance + decision + codification) 를 동시 충족하는 evidence-as-code 구조 (compliance-standards §1.13 + §2.3).

본 §5 는 §4 의 fan-out 결과가 §6 의 iteration loop 으로 들어가기 직전, retire-barrier 가 산출하는 보고서 schema 를 정의해요. §4.x 의 attack-defense tree (§5.5) 가 본 §5 의 attack-tree leaf attribute 와 직결, §6.3 의 coverage definition · §6.4 의 regression baseline · §7.3 의 strict-mode reconciliation · §8 의 broker surface · §12.4 의 schema evolution 이 본 §5 schema 의 하류 surface 예요.

### §5.1 OSCAL Assessment Result layer — machine-readable audit evidence

NIST OSCAL (Open Security Controls Assessment Language) 의 5 model 중 **Assessment Result** (AR) model 을 primary output schema 로 채택해요 (compliance-standards §1.13). AR 은 `finding`, `observation`, `risk`, `target`, `evidence` 의 5 object 가 핵심 — Ultrasafe 의 attack agent finding 이 OSCAL `finding` 으로 1:1 매핑, attack-tree leaf 의 atomic step 이 `observation` 으로, root goal 의 quantified residual 이 `risk` 로 변환돼요.

```json
{
  "assessment-results": {
    "uuid": "<release-tag-hash>",
    "metadata": {
      "title": "Ultrasafe iteration #2 — vX.Y.Z",
      "version": "0.1.0",
      "oscal-version": "1.1.2",
      "published": "<ISO-8601>",
      "props": [{"name": "ultrasafe-tier", "value": "T2"}]
    },
    "import-ap": {"href": "../assessment-plan/<release>.json"},
    "results": [{
      "uuid": "<iter-2-hash>",
      "start": "<ISO>", "end": "<ISO>",
      "findings": [{
        "uuid": "F-<axis>-<seq>",
        "title": "<short>",
        "target": {"type": "objective-id", "target-id": "<CWE | ATT&CK ID>"},
        "implementation-statement-uuid": "<file:line anchor>",
        "props": [
          {"name": "axis", "value": "stride-T"},
          {"name": "cwe", "value": "CWE-79"},
          {"name": "attack-id", "value": "T1059"},
          {"name": "cvss-base", "value": "7.5"},
          {"name": "quorum-count", "value": "3/4"},
          {"name": "methodology", "value": "OWASP-LLM-Top10"}
        ],
        "related-observations": [{"observation-uuid": "O-..."}],
        "related-risks": [{"risk-uuid": "R-..."}]
      }],
      "observations": [/* attack-tree leaf 별 atomic evidence */],
      "risks": [/* root-goal 별 cost/probability/impact roll-up */],
      "assessment-log": {
        "entries": [/* iteration N 의 timestamped event chain */]
      }
    }]
  }
}
```

**핵심 properties** (props 배열에 강제 entry):
- `axis` — fan-out 의 어느 axis 가 보고했는지 (stride-S/T/R/I/D/E · linddun-* · owasp-llm · owasp-agentic · ukc-* · supply-chain · ai-specific · pii — threat-modeling §3.1 의 13-axis 분류)
- `cwe` + `attack-id` — CWE-ID + MITRE ATT&CK technique-ID (threat-modeling §1.9 의 dual 분류)
- `cvss-base` — framework-neutral primary severity (compliance-standards §4.2 의 mapping distortion 회피)
- `quorum-count` — `N/M` 형식, §5.4 의 BFT-quorum 합의 (multi-agent-distributed §3.1)
- `methodology` — NIST 800-115 / OSSTMM / OWASP / PTES / OWASP-LLM 중 (compliance-standards §1.14)
- `tier` (metadata level) — Ultrasafe Tier 1/2/3 (compliance-standards §3.7, EAL hybrid)

**File:line anchor 강제** — `implementation-statement-uuid` 의 형태가 `<file>:<line-start>-<line-end>` 의 ground-truth anchor 여야 해요 (threat-modeling §4.7 의 hallucinated finding 차단). anchor 검증 — 파일 존재 + line 일치 — 을 통과하지 못한 finding 은 retire-barrier 가 reject.

**Evidence chain** — `assessment-log.entries` 가 timestamped append-only event chain 으로 작동, SOC 2 Type II 의 "operating effectiveness over time" evidence (compliance-standards §2.3) 와 Casper-style accountable safety (multi-agent-distributed §1.5 · §3.4) 를 동시 충족. Ultrasafe `reports/ultrasafe-iterations/<release-tag>.jsonl` 의 single source 가 ISO 27001 / SOC 2 / FedRAMP / PCI DSS / HIPAA evidence 로 cross-reusable.

**Broker surface (Tier A 패치, §8 연계)** — Constellation A2A 의 `ULTRASAFE_FINDING` intent 가 본 OSCAL `finding` object 와 1:1 wire-format. broker (Constellation WS relay) 는 intent envelope 의 `payload` 필드에 OSCAL finding JSON 을 그대로 carrying — 별도 변환 없이 inbox → ws-history → audit log 로 흐름. Intent type 정의는 `Constellation.md §13.x` 의 intent registry 에 등재.

### §5.2 Hyperbrief IR layer — decision card (apply / defer / release_with_risk / escalate)

각 iteration 의 retire-barrier 가 finding 집합을 4-score evaluation 으로 통과시켜 **Hyperbrief 9-section JSON IR** (Hyperbrief.md §1) 을 생성해요. 4-score 는 PASTA Stage 7 의 quantitative risk roll-up 을 Hyperbrief 의 표준 축으로 normalize (threat-modeling §3.4):

| 4-score 축 | PASTA mapping | 산출 rule |
|---|---|---|
| Impact | Damage + Affected users | max(CVSS impact) × scope_multiplier (single-file 1.0 · module 1.5 · system 2.0) |
| Reversibility | Exploitability + Reproducibility 역수 | auto-fix=1, code-change=2, architecture-change=3, irreversible=4 |
| Urgency | Discoverability + active-exploit signal | known-CVE-active=4, theoretical=1 |
| Novelty | Greatpractice tree 미등재율 | 등재 pattern=1, near-match=2, novel=4 |

**4-score sum ≥ 4** 또는 **MUST-trigger** (예: critical CVSS ≥ 9.0 · supply-chain 위반 · AI Act Article 15 위반 · GDPR Art. 32 위반) 발화 시 HyperbriefCard intent emit. 합산 < 4 는 auto-apply (낮은 finding 은 mitigation 자동 적용, iteration 진행).

**4 candidate 표준 슬롯** — `recommended_methodology[]` 에 다음 4 후보가 항상 populated:

```json
{
  "section_5_options": {
    "candidates": [
      {
        "id": "apply",
        "label_korean": "수정 후 재시험",
        "description": "mitigation diff 를 적용하고 iteration N+1 진입",
        "preconditions": ["reversibility ≤ 2", "fix diff < 200 LOC"],
        "evidence_refs": ["finding F-stride-T-03", "axis-quorum 3/4"],
        "expected_iterations_remaining": 1
      },
      {
        "id": "defer",
        "label_korean": "다음 cycle 로 보류",
        "description": "현재 release 에는 영향 없는 issue, backlog 등재",
        "preconditions": ["impact ≤ 2", "no active exploit signal"],
        "evidence_refs": [],
        "backlog_target": "<release-tag-next>"
      },
      {
        "id": "release_with_risk",
        "label_korean": "리스크 명시 후 릴리스",
        "description": "mitigation plan 명시 + residual risk 문서화",
        "preconditions": ["iteration_count ≥ 3", "no critical residual"],
        "evidence_refs": ["assessment-log entries N-3..N"],
        "mitigation_plan_ref": "<file:section>"
      },
      {
        "id": "escalate",
        "label_korean": "보안 리뷰 위임",
        "description": "사용자 또는 외부 audit firm 결정 위임",
        "preconditions": ["score ≥ 4 OR MUST-trigger"],
        "audience_profile_fallback": {"button_label": "보안 리뷰 위임"},
        "trigger_phrases_md": "Fix and re-test / Release with documented risk / Defer to next cycle / Escalate to security review"
      }
    ]
  }
}
```

**audience_profile_fallback + trigger_phrases_md auto-localize** — Hyperbrief.md §5.6.7 v0.5.6 의 auto-localize 규약에 따라 prevailing 언어 (한국어) 로 populate. EG dogfood 의 phase_3 cycle 운영 관성과 정합.

**Strict-mode reconciliation (Tier A 패치, §7.3 + §13.5 연계)** — `recommended_methodology[]` 의 candidate 가 OSCAL layer 의 `risk` object 와 **strict consistency** 강제. apply candidate 의 `evidence_refs` 가 가리키는 OSCAL finding UUID 가 실제 §5.1 의 results.findings 에 존재해야 하며, release_with_risk 의 `mitigation_plan_ref` 는 §6.4 regression baseline 과 cross-link. 미일치 시 retire-barrier 는 IR emit 을 reject 하고 iteration 재dispatch (§13.5 의 reconciliation hook).

### §5.3 Greatpractice candidate layer — macro/mezzo/micro 격상 path

각 iteration 의 finding 중 **반복 발견 + 효과적 mitigation pair** 는 Greatpractice tree 의 격상 후보로 자동 draft. 격상 path 는 3 tier 구조 (Greatpractice.md §x.x 의 macro/mezzo/micro hierarchy 와 정합):

| Tier | 발화 조건 | Surface | Example |
|---|---|---|---|
| **micro** | 동일 (CWE-ID, file-pattern) finding ≥ 2 회 발견 | PreToolUse hook 의 pre-check rule, lint-level | "outbox.jsonl append 시 single-line JSON validation" (현재 memory 등재) |
| **mezzo** | 동일 root-cause 의 finding cluster ≥ 3 iteration 출현 | playbook 형식의 runbook, sub-agent skill | "A2A relay 실패 시 ws-history 직접 forward" |
| **macro** | architecture-level 패턴 — 동일 attack-tree root goal 이 ≥ 2 release 에서 재발 | module-level discipline, spec section 신설 | "trust-tier classification + capability scoping" (multi-agent-distributed §3.5) |

**Candidate output schema** (OSCAL `back-matter.resources[]` 의 한 entry 로 inline):

```json
{
  "greatpractice_candidate": {
    "tier_proposed": "micro",
    "trigger_pattern": {
      "cwe": "CWE-117",
      "axis": "stride-T",
      "occurrences": [
        {"iteration": "v2.5.40-iter1", "finding_uuid": "F-..."},
        {"iteration": "v2.5.41-iter2", "finding_uuid": "F-..."}
      ]
    },
    "mitigation_pattern": {
      "description": "log injection 방어를 위한 control-char escape",
      "file_anchors": ["scripts/eg_outbox_push.cjs:42-58"],
      "regression_test_ref": "tests/outbox-escape.spec.cjs"
    },
    "promotion_status": "draft",
    "human_review_required_after": 3
  }
}
```

**Promotion gate** — `human_review_required_after` 임계 (기본 3 회 occurrence) 도달 시 Hyperbrief IR 의 별도 candidate 로 surface, 사용자 또는 maintainer 결정 후 Greatpractice tree 에 commit. 자동 등재 금지 — codification 은 인간 결정 surface (Greatpractice.md 의 governance discipline).

**양방향 feed** (threat-modeling §3.8):
- *Ultrasafe → Greatpractice*: 위 schema 로 candidate 자동 draft
- *Greatpractice → Ultrasafe*: 등재된 macro/mezzo/micro pattern 이 iteration N=1 의 "known-bad pattern" pre-check 으로 작동 (false-negative 차단)

### §5.4 Cross-axis correlation rule engine — BFT-quorum confirmation

§4 fan-out 의 13-axis attack agent 결과를 합성할 때, 단일 axis 의 보고는 **low-confidence draft**, 다중 axis 의 합의는 **confirmed finding** 으로 격상. BFT quorum 수학 (multi-agent-distributed §1.2 · §2.1 · §3.1) 을 그대로 차용해요:

```
n: dispatched attack agent count (typical n=4 또는 n=7, 13-axis matrix subset)
f: tolerable Byzantine (= 환각/오작동/감염 agent)
정족수: 2f+1 (확인) · n ≥ 3f+1 (allocation)

n=4 → f=1, 2f+1=3 → 3개 axis 동의 = confirmed
n=7 → f=2, 2f+1=5 → 5개 axis 동의 = confirmed
n=10 → f=3, 2f+1=7 → 7개 axis 동의 = confirmed
```

**Correlation key** — 두 axis 의 finding 이 "동일" 한지 판단:
1. **Anchor match (primary)** — `(file_path, line_range)` 가 overlap (≥ 50% line 공통)
2. **CWE match (secondary)** — 동일 CWE-ID (서로 다른 anchor 도 root-cause 같으면 cluster)
3. **ATT&CK technique match (tertiary)** — 같은 technique-ID + 같은 target asset
4. **Semantic embedding similarity** (≥ 0.85 cosine) — anchor 가 흐릿한 경우 fallback

**Tier 격상 rule**:

| 합의 수준 | Tier label | 처리 |
|---|---|---|
| 2f+1 이상 axis 동의 (예: n=4 의 3/4) | **confirmed** — MUST fix | OSCAL `finding.props.confidence = "confirmed"`, Hyperbrief 4-score 에 가중치 1.0 |
| f+1 이상 (예: 2/4) | **needs-corroboration** — SHOULD fix | OSCAL `confidence = "corroboration-needed"`, supplementary axis dispatch trigger |
| 1 axis 만 보고 | **low-confidence draft** — MAY review | OSCAL `confidence = "draft"`, free-rider 검출용 random sample 대상 |

**Correlated Byzantine 회피** (multi-agent-distributed §4.2) — fan-out 시 model / seed / prompt-template / axis hash 가 모두 distinct 여야 quorum 으로 count. 같은 GPT-4 family 4 agent 의 동의는 effectively n=1 — diversity-enforced source independence (multi-agent-distributed §3.2).

**False-positive 흡수** — confirmed-only filter 가 noise burnout 차단 (compliance-standards §4.8). 단일-axis finding 은 별도 logging — Greatpractice 의 "false-positive 패턴" tree 의 feedback signal.

### §5.5 Attack-defense tree as synthesis structure — Schneier-style

retire-barrier 의 최종 synthesis 산출물은 **단일 unified attack-defense tree** — 각 axis agent 가 출력한 attack-tree fragment 를 cross-link 후 통합 (threat-modeling §1.6 + §3.2). Kordy-Mauw-Radomirović-Schweitzer 2010 의 ADT 구조를 정본으로 채택.

**Tree node schema**:

```yaml
attack_defense_tree:
  root:
    type: ATTACK
    goal: "release a vulnerable Ultrasafe-rated artifact to external adopters"
    cost_estimate: <propagated>
    probability_estimate: <propagated>
    children: [...]
  nodes:
    - id: N-1
      type: ATTACK
      goal: "compromise the build pipeline"
      gate: OR  # any child success → parent success
      children: [N-1-1, N-1-2, N-1-3]
      defense_children: [D-1-1]
    - id: D-1-1
      type: DEFENSE
      mitigation: "signed commits + protected branch"
      effectiveness: 0.9
      cost: low
      blocks: [N-1-1]
    - id: N-1-1
      type: ATTACK
      goal: "compromise maintainer signing key"
      gate: AND  # all children required
      leaf: true
      attributes:
        cost: high
        probability: 0.02
        skill: expert
        detection_probability: 0.6
        cwe: CWE-798
        attack_id: T1552
        finding_uuid: F-supplychain-12
```

**Bottom-up value propagation** (threat-modeling §2.2):
- **OR 노드 (대안 경로)**: cost = `min(children.cost)`, probability = `max(children.probability)`, skill = `min(children.skill)`
- **AND 노드 (필수 sub-step)**: cost = `sum(children.cost)`, probability = `product(children.probability)`, skill = `max(children.skill)`
- **Defense child**: 활성 mitigation 의 effectiveness 가 attack subtree 의 propagation 을 `(1 - effectiveness)` 로 감쇠

**Root cost / probability** 가 전체 공격의 cheapest-most-likely path 추정 — 가장 낮은 branch 가 **1st priority mitigation 후보** (= OSCAL `risk` object 의 score primary + Hyperbrief IR `recommended_methodology[0]` 의 default).

**State explosion 방어** (threat-modeling §4.3):
- 각 axis agent 의 self-tree depth ≤ 4 강제 — 깊이 필요 시 follow-up agent spawn
- `cost > threshold` 인 branch 는 auto-prune (economic-infeasibility, Schneier 1999)
- root → leaf 의 unique path 가 ≥ 1000 이면 retire-barrier 가 warning + supplementary dispatch

**Coverage definition (Tier A 패치, §6.3 연계)** — coverage 는 단순 axis-count 가 아닌 **ADT 의 root-goal 별 OR-branch enumeration depth**. 각 root-goal 의 immediate OR-children 의 ≥ 80% 가 ≥ 1 axis 에 의해 visit 되어야 "covered". §6.3 의 iteration 진입 조건 + clean 종료 조건 모두 본 정의 사용. UKC 18 phase coverage (threat-modeling §3.3) 는 보조 metric — 적용 가능한 phase 의 subset 만 강제 (threat-modeling §4.6).

**Regression baseline (Tier A 패치, §6.4 연계)** — iteration N+1 의 baseline = iteration N 의 ADT snapshot (commit hash + signed timestamp). N+1 의 first action = N 의 모든 `leaf.finding_uuid` 가 sealed 인지 verify, N+1 의 secondary action = mitigation 이 도입한 새 DFD element (= 새 leaf branch) 의 fresh attack. Baseline rewrite 금지 (multi-agent-distributed §3.4 의 append-only + explicit rebuttal).

**Schema evolution (Tier A 패치, §12.4 연계)** — ADT node schema 의 v0.1.0 → v0.2.0 transition 은 OSCAL `metadata.version` bump + Hyperbrief IR section_5 의 `evidence_refs` URI scheme 호환성 유지. 신규 attribute 추가는 additive only — 기존 attribute 의 semantics 변경 시 별도 deprecation cycle (≥ 1 release).

### §5.6 emit timing + storage layout

**emit 시점** — 각 iteration 의 retire-barrier 가 닫힐 때 3 layer 동시 emit (atomic):
1. retire-barrier 가 fan-out 결과 수집 완료
2. cross-axis correlation (§5.4) 으로 confirmed/corroboration-needed/draft tier 분류
3. ADT synthesis (§5.5) 으로 unified tree 구성 + propagation
4. OSCAL AR (§5.1) + Hyperbrief IR (§5.2) + Greatpractice candidate (§5.3) JSON 직렬화
5. `reports/ultrasafe-iterations/<release-tag>/iter-N/` 에 3 파일 동시 write
6. Constellation A2A `ULTRASAFE_FINDING` intent emit (OSCAL AR 을 payload 로) — Tier A 패치 §8 broker surface

**Storage layout**:

```
reports/ultrasafe-iterations/
└── <release-tag>/
    ├── iter-1/
    │   ├── oscal-ar.json         # §5.1 OSCAL Assessment Result
    │   ├── hyperbrief-ir.json    # §5.2 9-section IR
    │   ├── greatpractice-candidates.json  # §5.3 promotion drafts
    │   ├── adt.json              # §5.5 attack-defense tree snapshot
    │   └── assessment-log.jsonl  # append-only event chain
    ├── iter-2/...
    └── iter-N/
        ├── ...
        └── verdict.json          # release_allowed | release_with_risk | blocked
```

**Sanitization layer** — public repo 공개분은 별도 `reports/ultrasafe-iterations-public/` 으로 OSCAL `finding.title` + `risk.statement` 만, file:line anchor + PoC sketch 는 outer 전용 (compliance-standards §4.9 의 2-tier output, public-repo redaction discipline). responsible disclosure window 도달 시 detail 공개.

### §5.7 cross-section dependency 요약

| 본 §5 surface | 의존 / 의존되는 § |
|---|---|
| OSCAL AR schema (§5.1) | §4 fan-out 결과 입력, §6 iteration loop 출력, §8 broker payload, §12.4 schema evolution |
| Hyperbrief IR (§5.2) | §7.3 strict-mode reconciliation, §13.5 reconciliation hook, Hyperbrief.md §1 의 9-section IR + §5.6.7 auto-localize |
| Greatpractice candidate (§5.3) | Greatpractice.md macro/mezzo/micro tree, §6 iteration loop 의 known-bad pre-check |
| BFT-quorum correlation (§5.4) | §4.2 fan-out diversity, multi-agent-distributed §3.1-§3.2 |
| Attack-defense tree (§5.5) | §6.3 coverage, §6.4 regression baseline, §12.4 schema evolution, threat-modeling §2.2 |

---

## §6. ≥3 Iteration Loop — multi-condition AND clean signal

> 본 절은 Ultrasafe 의 *핵심 cadence* 인 ≥3 iteration loop 와 그 종료 조건 (clean signal) 의 운영 spec 을 정의해요. *단일 iteration release 금지* + *finding count 단독 신뢰 금지* 가 본 절 전체의 통제 원칙. cross-axis 합성 결과 (cross-axis-patterns §3.3) 의 4-condition AND gate 를 *operationally implementable* 까지 끌어내려서, regression baseline + coverage 정의 + divergence escalation + sunk-cost detector 등 critic Tier A patch (completeness-critic §5) 를 흡수했어요.

### §6.1 Hard floor 3 iteration (universal across all axes)

Ultrasafe iteration 의 *minimum depth* 는 release tier 또는 finding category 와 무관하게 **3** 으로 고정해요. 3 의 근거는 (NIST 800-115 §6 의 verification loop + DSP §1 의 MTTR 4-phase × 3 iteration floor) 의 합성 — *어느 한 axis 의 우연 일치가 아니라* iter 1 (fix apply) + iter 2 (verify of fix) + iter 3 (verify of regression-of-fix) 의 *cause-and-effect chain* 그 자체. 2 iteration 종료 시 *fix 가 새 vulnerability 도입했는지* 의 sealing window 가 닫히지 않아요 (cross-axis-patterns §1.14 의 secondary-surface guard 와 정합).

| iteration | 의미 | 종료 시 보장되는 것 |
|---|---|---|
| 1 | fix apply | finding 발견 → mitigation candidate 적용 |
| 2 | verify of fix | mitigation 이 원 finding 의 sealing 검증 |
| 3 | verify of regression-of-fix | mitigation 자체의 secondary surface 검증 |

본 hard floor 는 **외부 release tier (Tier 1/2/3) 와 무관 universal**. Tier 1 (patch / chore) 도 *static gate single-pass* 가 아닌 *iteration ≥3* 의무 — 단, Tier 1 의 sub-loop 가 정적 분석 위주라 wall-clock cost 는 낮아요 (cross-axis-patterns §3.5). Tier 2/3 의 추가 ceiling extension 은 §6.6 에서 정의.

cargo-cult 화 방지 (devsecops-policy-as-code §4.7) 는 *iteration 의 의미 보장* 으로 — 3 iter 모두 *동일 fix-verify-regression chain 의 의미* 를 충족해야 하지, "3회 도장" 만 채우는 무의미 통과는 reject. 각 iteration 의 boundary 별 조건은 §6.4 + §6.5 에 명시.

### §6.2 4-condition AND clean signal gate

Iteration loop 의 종료 조건 (= "clean signal") 은 **4-condition AND gate** — 하나라도 미충족이면 다음 iteration 강제 진입. 단일 metric (finding count 0) 의존은 false confidence (fuzzing-pbt §4.1 의 coverage ≠ bug-finding power).

#### (a) Regression-free — 3-component AND

`regression_N` 의 측정은 *naïve set difference* (`F_N \ F_{N-1} ≟ ∅`) 가 아닌 **3-component AND** (completeness-critic §5.1 patch):

1. **fix-target retest**: 각 sealed finding 의 PoC 를 *fresh agent* 재실행 → reproduce 시도 → *fail 확인* mandatory.
2. **neighbor-path scan**: 해당 fix 의 code path 의 *N-hop neighbor* (call graph 1-2 hop) 재스캔 — 같은 vulnerability 의 *다른 path* 재도달 검출.
3. **generalized invariant retest**: fix 가 *약화한 invariant* 가 있는지 mutation gate 통과 검증 (fuzzing-pbt §1.8 + §3.8 의 mutation testing fix 진정성 검증).

3 component 모두 통과 시 `regression_check.all_pass = true`. 한 component 라도 fail 시 *regression detected* — 해당 finding 은 *meta-defect* 로 escalation 별도 route (oscillation pattern, §6.5).

추가 hard constraint:
- `no_new_high_severity_in_N`: iteration N 의 *새 finding 중 severity ≥ HIGH* 의 count 가 0.
- 단, *deeper inspection 으로 인한 새 finding 발견* 은 progress signal — high-severity 만 hard cutoff.

#### (b) Monotonic improvement — EWMA trend on severity-weighted finding count

단조 감소 (`|F_N| ≤ |F_{N-1}|`) 자체는 *misleading metric* — fix 후 새 finding 발견이 정상 progress 일 수 있어요 (completeness-critic §5.2). monotonic improvement 를 *signal* 이 아닌 *trend* 로 재정의:

- **window K = 3 default** (release tier 무관, 1 sub-loop unit).
- **EWMA trend** (exponentially weighted moving average, decay α = 0.5):
  - `severity_weighted_count_N = Σ_{f ∈ F_N} severity_tier(f) × confidence_interval_lower_bound(f)`
  - `EWMA_N = α × severity_weighted_count_N + (1 − α) × EWMA_{N−1}`
  - **trend descending** 조건 = EWMA_N ≤ EWMA_{N-1} for at least 2 of the last 3 transitions.
- **3 sub-condition AND**:
  - (b.1) 최근 K iteration window 내 *new high-severity finding rate* trend descending.
  - (b.2) *unresolved persistent finding count* monotonic 감소 (strict).
  - (b.3) *cross-axis confirmation density* (matrix cell-fill rate) monotonic 증가 (strict).
- noise filtering: *single iteration outlier* 는 EWMA 가 자동 흡수, *consecutive 2-iter direction agreement* 가 strict 확인 단위.

#### (c) Coverage gate — applicable subset of axis-test catalog

Coverage 정의는 critic Tier A 의 가장 큰 gap (completeness-critic §5.3). **denominator + methodology + tier-specific threshold 의 3 명세**:

| 항목 | 정의 |
|---|---|
| denominator | *각 axis 의 attack pattern catalog* 의 *applicable subset* — agent self-declared scope (예: SCS axis 의 5-way 중 module 에 해당하는 hop, OWASP LLM Top 10 중 module 이 LLM endpoint 보유 시 적용 entry) |
| numerator | denominator 중 *evidence-confirmed tested* — false positive 제거 후 *PoC 또는 fail-safe verify* 통과한 entry |
| methodology | (catalog_version × applicable_subset_hash × tested_entry_set) 3-tuple 박제 — iteration boundary 마다 freeze |

**Tier 별 threshold**:

- **Tier 1** (patch / chore): `coverage_pct ≥ 50%` of applicable subset + `untested_classes[]` 명시.
- **Tier 2** (minor / feat): `coverage_pct ≥ 75%` + cross-axis confirmation density ≥ 0.3 + untested_classes[] 명시.
- **Tier 3** (major / external publish): `coverage_pct ≥ 90%` + cross-axis confirmation density ≥ 0.5 + *minimum 3 perspective bucket coverage* (taxonomy × methodology × actor-profile 직교 합집합) + untested_classes[] 명시.

`untested_classes[]` 명시는 *모든 tier 에서 mandatory* — coverage 가 100% 미달 시 *어느 catalog entry 가 untested 인가* 의 honest disclosure (cross-axis-patterns §1.8 의 self-spec-gaming hazard prevention 정합). 빈 array (`[]`) 는 "100% covered" 의 명시 선언 — 거짓 시 self-spec-gaming hazard.

#### (d) Consecutive 2 iteration cleanliness + agent diversity

4-condition AND 의 마지막 — (a) + (b) + (c) 가 *연속 2 iteration* 만족 (iter N-1 + iter N). 단순 single-pass clean 은 fresh hallucination 가능성 (cross-axis-patterns §1.10 의 diversity-enforced source independence).

**Iteration 간 agent diversity 강제** (completeness-critic §5.4 patch):

- iter N-1 의 dispatched agent ID set ∩ iter N 의 agent ID set ≤ **50%** (cardinality 기준).
- diversity check 는 *dispatch-time* 에 enforce — synthesizer 가 fan-out 직전 hash 검증, 미달 시 *re-dispatch with different (perspective × prompt_template_hash × seed) tuple*.
- 단일 LLM provider 환경의 한계는 §6.6 의 honest disclosure 와 정합 — model_family distinct enforce 는 v0.2.x.

Verification 자체도 *fresh agent + frozen catalog 재실행* mandatory — iter N 의 verify 가 iter N-1 의 cached result 를 재사용하면 *adversarial 동일 hallucination correlate* 의 위험.

### §6.3 Coverage 정의 — completeness-critic Tier A patch

본 sub-section 은 §6.2 (c) 의 coverage gate 의 *methodology 측면 deep dive*. critic 의 가장 큰 unresolved gap (§5.3) 이라 별도 section 격상.

**Coverage 의 3 가지 candidate 정의** 중 *evidence-confirmed catalog applicable subset* 선택 근거:

| candidate | 정의 | 채택 여부 | 근거 |
|---|---|---|---|
| (i) catalog 전체 entry 비율 | OWASP LLM Top 10 중 N/10 tested | reject | module 에 해당 안 되는 entry 도 분모 → meaningless |
| (ii) evidence-confirmed applicable subset 비율 | scope 내 entry 중 evidence-PoC verified 비율 | **adopt** | scope 의 honest declaration + false positive 제거 |
| (iii) codebase coverage (line/branch/function) | 코드 라인 도달율 | reject | semantic bug / authz / race 누락 (fuzzing-pbt §4.1) |

(ii) 의 *applicable subset 자체* 의 declaration honesty 가 self-spec-gaming hazard 의 1차 surface — agent 가 *scope 를 의도적으로 축소* 시 coverage 100% 가 trivially 달성. 방지책:

- **scope declaration** 은 *iteration boundary 의 frozen state* 의 일부 (§6.4) — *iteration 내 변경 금지*.
- **adversarial reviewer** (cross-axis-patterns §3.11 self-spec-gaming hazard) 가 scope 의 *under-declaration* 검증.
- **Tier 3 release 시 minimum 3 perspective bucket coverage** — taxonomy × methodology × actor-profile 직교 합집합 강제 (cross-axis-patterns §3.7 의 contradiction CT7 합성).

**Methodology** (코드 가능한 의사 코드):

```yaml
coverage:
  axis: "ai-red-team"
  catalog:
    name: "OWASP_LLM_TOP10"
    version: "v2025.11"
    pinned_at: "2026-06-04T00:00:00Z"
    expires_at: "2026-12-04T00:00:00Z"   # 6-month freshness window
  applicable_subset:
    declared_scope: ["LLM01", "LLM02", "LLM03", "LLM06", "LLM08", "LLM09"]
    scope_hash: "sha256:..."
    declared_by_agent_id: "axis-llm-v0.1"
  evidence_confirmed:
    tested: ["LLM01", "LLM02", "LLM06", "LLM08"]
    evidence_artifact_refs: ["USF-1-01HK...", "USF-1-01HL..."]
  metric:
    coverage_pct: 0.667    # 4/6
    untested_classes: ["LLM03", "LLM09"]
    untested_reason:
      LLM03: "no training pipeline in scope"
      LLM09: "no plugin endpoint in scope"
```

untested_reason 의 *natural language explanation* 은 *required field* — null 또는 empty string reject. critic Tier A patch 의 핵심.

### §6.4 Regression baseline — last "known clean" snapshot + commit-sha pinning

§6.2 (a) 의 regression-free 측정은 *baseline* 이 명확해야 작동 — completeness-critic §6.4 Tier A patch.

**Baseline 정의** = *last known-clean release artifact* — 가장 최근 *4-condition AND gate 통과* + *Hyperbrief disposition = apply 또는 release_with_risk* 의 release.

```yaml
regression_baseline:
  release_tag: "v2.5.41"
  commit_sha: "abc123..."
  catalog_versions:
    owasp_llm: "OWASP_LLM_TOP10_v2025.11"
    mitre_attack: "MITRE_ATTACK_v15"
    cwe: "CWE_v4.13"
  iteration_evidence_ref: "constellation://ws-history/2026-05-..."
  hash_chain_root: "sha256:..."   # MAD §1.4 accountable iteration history
```

**Baseline 유지 규율**:

- 각 release tier (Tier 1/2/3) 마다 *별도 baseline* — Tier 1 patch 의 baseline 은 직전 patch, Tier 2 minor 의 baseline 은 직전 minor, Tier 3 major 의 baseline 은 직전 major.
- Baseline 의 *evidence artifact* (commit-sha + iteration history) 는 *최소 retention*:
  - Tier 1: 6 month
  - Tier 2: 1 year
  - Tier 3: 2 year + Sigstore Rekor inclusion proof (v0.2.x+)
- Baseline pinning 은 *commit-sha + catalog_version + agent_registry_hash* 3-tuple — 셋 중 하나라도 변경 시 iteration boundary 에서 *baseline migration ceremony* (§6.5 의 secondary surface analysis 와 동시).

**Baseline shift 시 시점 규율**:

- iteration N 진입 시점에 baseline freeze — *iteration 내 baseline 변경 절대 금지*.
- baseline 의 finding set `F_baseline` 박제 — iter N 의 regression 측정은 `F_N` vs `F_baseline` 의 set difference 가 1차 input.
- baseline 자체의 *재검증* (last clean 의 stale 가능성, supply-chain-sbom §4.6 의 stale attack catalog) 은 *별도 Greatpractice macro 노드* ("baseline reverification quarterly cadence", §6.7 의 sunk-cost detector 와 cross-link).

### §6.5 Divergence escalation — Hyperbrief MUST-trigger on iteration 5+ no convergence

Iteration loop 가 *수렴하지 않는* 경우의 escalation route — completeness-critic §5.7 Tier A patch.

**Divergence 정의**:

- (i) **High-severity finding count rising trend**: consecutive 2 iter (예: iter N-1 → iter N) 의 *new high-severity count* 증가 — `absolute count` AND `rate per iteration` 둘 다 monotonic 증가.
- (ii) **EWMA reversal**: EWMA (§6.2(b)) 가 *consecutive 2-iter direction reversal* — descending → ascending.
- (iii) **Oscillation pattern**: 같은 finding 의 *fix → resurfacing → fix → resurfacing* 의 cycle 3+ iter window 내 발견 — fix 자체가 invariant 약화 신호 (cross-axis-patterns §1.14 의 mitigation-introduces-new-threat).

3 중 하나라도 detection 시 **MUST-trigger Hyperbrief 4-score gate** — defer 옵션 *제거*, escalate slot 직접 활성화 (위험 신호 누적 시 deferral 자체가 anti-pattern).

**Iteration 5+ ceiling 도달 + clean 미달** 시 별도 escalation chain:

- max_iter ceiling 도달 (§6.6 의 tier 별 cap) → Hyperbrief 4-way decision MUST-trigger:
  - `apply_fix_continue` (max_iter 확장 +N iter, 단 +N ≤ 3, 추가 비용 정량 제시)
  - `defer` (다음 cycle 로 이연 + deadline + Greatpractice 등록 mandatory)
  - `release_with_risk` (residual risk disclose + user-visible documentation + post-release monitoring 의무)
  - `escalate` (external expert / audit / scope 축소 요청)
- 결정은 *사용자만* (인간 게이트) — auto-deferral 절대 금지 (cross-axis-patterns §3.5 의 strict-mode default 정합).
- Hyperbrief decision pending 동안 *release 차단* default (strict-mode reconciliation, §7.3 + §13.5).
- Decision timeout = **7 일** 후 자동 한 단계 escalate (defer → release_with_risk → escalate to external).
- 코드 변경 시 Hyperbrief decision invalidate + Ultrasafe re-run mandatory.

### §6.6 Tier 별 extension — iteration floor / ceiling matrix

§6.1 의 universal floor 3 위에 release tier 와 finding category 의 추가 extension 직교 적용 — cross-axis-patterns §2 contradiction CT2 합성.

| release tier | iteration floor | iteration ceiling | 추가 조건 |
|---|---|---|---|
| Tier 1 (patch / chore) | 3 | 5 (default) | static gates only, sub-loop 비용 minimal |
| Tier 2 (minor / feat) | 3 | 7 (default) | 4-6 axis × full 4-condition AND |
| Tier 3 (major / external publish) | **5** | 10 (default) | full 8 axis + cross-axis graph + cryptographic release attestation |

**Finding category 별 sub-loop extension** (직교 dimension):

- **deterministic finding** (정적 분석 / signature mismatch): sub-loop minimum 1 (floor 의 일부, 추가 아님).
- **configuration finding** (IaC / policy violation): sub-loop minimum 2.
- **statistical / timing / probabilistic finding** (race / side-channel / adversarial-ml): sub-loop minimum **5+** — 해당 category 만 sub-loop 5, 전체 iteration 은 tier 별 ceiling 유지.

직교성 명시: Tier 3 release × statistical finding = *전체 iteration floor 5* AND *해당 sub-loop minimum 5* — 두 dimension 곱연산 아닌 *max 의 합집합* (5 + 5 = 5, not 10).

**Critic Tier A patch — single LLM provider 한계 honest disclosure**:

현 EG 환경은 Claude family 단일 provider — `model_family distinct` enforce 가 *physically 불가능*. v0.1.0 의 dispatch-time diversity check 는 *(perspective × prompt_template_hash × seed) 3-tuple distinct ≥ 3* 으로 약화 (completeness-critic §2.7 patch). `untested_surfaces[]` 에 "single-provider correlated hallucination" 항목 mandatory 등록. v0.2.x 진입 시 외부 A2A counterpart 합류 후 model_family distinct enforce 활성화.

### §6.7 Sunk cost detector — iteration N+ 비용/이득 분석 + ceiling override

Iteration cost 가 marginal yield 를 초과하는 시점의 *operational stop* — cognitive-decision-bias §1.5 의 sunk-cost detector 패턴 (Greatpractice mezzo 후보).

**Cost / benefit metric** (iteration N 의):

- **cost_N**: (token consumption + wall-clock time + reviewer attention units). 정량화 가능한 cost 만 포함, *operational externality* (cross-axis-patterns §1.4) 포함.
- **benefit_N**: (new finding count × severity_weighted) + (cross-axis confirmation density delta) + (untested_classes 감소 delta).
- **marginal ratio**: `Δbenefit_N / Δcost_N` — *3 iter window EWMA*.

**Detector trigger**:

- marginal ratio 가 *baseline ratio* (iter 1-3 의 평균) 의 **30% 미만** 으로 떨어진 후 *consecutive 2 iter* 지속 시 → *sunk-cost flag*.
- Flag detected + iteration ≥ floor 충족 → **Hyperbrief escalation MUST-trigger** (clean signal 미달이라도) — 4-way decision 진입:
  - `accept_partial_clean` (untested_classes[] 명시 + release_with_risk)
  - `redesign` (다음 cycle 에 architectural change — Greatpractice macro 노드)
  - `defer` (다음 release 까지 이연)
  - `escalate` (외부 expert review)

**Ceiling 의 hard limit** — sunk-cost detector 무관 *absolute ceiling*:

- Tier 1: 5 iter (cost-bound)
- Tier 2: 7 iter (default ceiling)
- Tier 3: 10 iter (default ceiling, escalation 시 +3 까지 확장 가능)

ceiling 도달 + clean 미달 = §6.5 의 escalation chain 진입. ceiling override 는 *Hyperbrief 4-score gate 통과 시만* + *+3 이내* 제한.

**Sunk-cost detector 자체의 self-spec-gaming hazard**:

- detector 의 *threshold* (30% / 2 consecutive) 자체가 gameable — attack agent 가 *marginal yield 를 의도적으로 균일화* 시 detector trigger 회피.
- 방지책: detector 의 *adversarial reviewer* (cross-axis-patterns §3.11) 가 *yield distribution 의 anomaly* 검증 — 너무 균일한 yield 자체가 self-spec-gaming signal.

---

> **Cross-section dependencies**: §6 은 §4 (attack agent role distribution) 의 fan-out 결과를 input 으로 받고, §5 (synthesis report 3-layer) 의 OSCAL finding schema 를 measurement unit 으로 사용, §7 (pre-release trigger + tier) 의 tier 판정과 §6.6 의 ceiling matrix 가 정합, §8 (Constellation A2A intent) 의 `ULTRASAFE_ITERATION_BOUNDARY` intent 가 §6.4 의 baseline migration ceremony 의 transport surface, §9 (Hyperbrief routing) 의 4-way decision 이 §6.5 escalation chain 의 sink, §11 (self-spec-gaming hazard) 의 adversarial reviewer 가 §6.3 coverage scope declaration 의 검증자, §12.4 (schema evolution) 의 backward-compat 규율이 §6.4 의 baseline retention 정책과 cross-link, §13.5 (strict-mode default reconciliation) 가 §6.5 의 Hyperbrief decision pending 동안 release 차단 default 의 governance 근거.

---

## §7. Hyperbrief 4-score Routing

> Ultrasafe 의 fan-out 결과는 *발견 (findings)* 이지 *결정 (decisions)* 이 아니에요. PASTA stage 7 의 quantitative risk roll-up (threat-modeling §1.4 + §2.3) 과 adversarial-ml 의 4-decision candidate (adversarial-ml §3.4) 는 모두 *동일 escalation 경로* — Hyperbrief 의 4-score gate (Hyperbrief §2) — 로 라우팅돼요. 본 절은 그 매핑이 *결정론적* 이고 *외부 표준 (EU AI Act Article 15 / OWASP LLM Top 10 / NIST AI RMF) 과 1:1 추적 가능* 하도록 strict-mode 규율을 명시해요.

### §7.1 PASTA stage → Hyperbrief 4-score 매핑 표

PASTA 7-stage (UcedaVélez-Morana 2015) 의 stage 7 (Risk & Impact) 출력은 finding 당 quantified residual risk 4-tuple `{damage, exploitability, reproducibility, affected_users}` 이에요. 이 4-tuple 을 Hyperbrief 4-score (`irreversibility / blast_radius / time_horizon / reversal_cost`, 각 0-3) 로 *결정론적 함수* `f_PASTA→Hyperbrief` 로 변환해요. 자유 형식 LLM 평가 금지 — `threat-modeling §3.4` 의 매핑 규칙을 코드 함수로 구현 (`mappers/pasta-to-hyperbrief.cjs`).

| PASTA dimension | Hyperbrief score | 매핑 규칙 (deterministic) |
|---|---|---|
| Damage (1-10) + Affected users (1-10) | `blast_radius` (0-3) | `floor((D+A)/7)` cap at 3 — cross-system finding (D≥7 또는 A≥7) 은 자동 3 |
| Exploitability (1-10) | `time_horizon` (0-3) | E≥8 → 3 (active exploit window 짧음), E∈[5,7] → 2, E∈[3,4] → 1, E≤2 → 0 |
| Reproducibility (1-10) | `reversal_cost` (0-3) | R≥8 → 3 (재현 쉬워서 다회 피해), R∈[5,7] → 2, R∈[3,4] → 1, R≤2 → 0 |
| (severity + mitigation 적용 후 잔존) | `irreversibility` (0-3) | data exfil = 3, signed-release = 3, in-memory only = 1, transient log = 0 — `irreversibility_taxonomy.json` 의 enum lookup |

`escalation_sum = irreversibility + blast_radius + time_horizon + reversal_cost`. Hyperbrief §2.1 의 트리거 임계 (`sum ≥ 4` → FULL_HYPERBRIEF) 가 그대로 적용.

### §7.2 4 candidate 표준화 — `recommended_methodology[]` default

Hyperbrief v0.6 의 `recommended_methodology[]` 필드 (Hyperbrief §8 candidate 확장, v0.5.6 forward-ref) 의 *default candidate set* 을 Ultrasafe 가 다음 4종으로 박제해요 (adversarial-ml §3.4):

| Candidate ID | 의미 | 적용 조건 |
|---|---|---|
| `apply` | code/config/data patch 로 즉시 fix | reversibility two-way + fix cost < release deadline budget |
| `defer` | 차기 cycle 로 이연 + deadline 명시 | 명시적 risk acceptance 기록 필수 (`deferred_until` + `accepted_by`) |
| `release_with_risk` | 알려진 risk 를 user-visible 하게 disclose 후 release | trade-off 시나리오 (adversarial-ml §4.5 privacy↔robustness 같은 1-방향 강화가 타 방향 약화) 의 표준 응답 |
| `escalate` | external expert / external audit 요청 | legal / regulatory finding (LINDDUN-NC) 또는 zero-day-class finding |

각 candidate 는 IR 의 `§8.recommendation_conditional.recommended` 값으로 emit 가능해요. Ultrasafe 가 finding bundle 을 Hyperbrief 로 라우팅할 때, `f_PASTA→Hyperbrief` 의 score + finding family 에 따라 *추천 candidate 1순위* 를 prefill 하되 — 최종 선택은 항상 user (Hyperbrief §7 meta-branch).

### §7.3 Strict mode default — advisory v0.1 → blocking v0.2

Ultrasafe v0.1 의 *디폴트 모드* 는 **strict + advisory** 로 못박아요:

- **strict**: auto-deferral 절대 금지. `defer` candidate 는 candidate 로 *제안* 가능하지만, 자동 선택 불가 — Hyperbrief gate 통과 (user 의 명시적 `defer` 선택 + `deferred_until` 입력) 가 필수.
- **advisory**: Ultrasafe 의 verdict (`CLEAN` / `BLOCK`) 는 *조언적* — release pipeline 을 강제 차단하지 않아요. PreToolUse hook 이 verdict 를 surface 하지만 user 가 override 가능. v0.2 의 **blocking** mode 는 hook 이 hard-block 으로 승격 (PreToolUse exit code 2, settings-side opt-in 필요).

**§13.5 strict-mode reconciliation 패치** (Tier A critic): strict mode + advisory v0.1 의 조합이 *모순 아님* 을 명시해요. strict = "Ultrasafe 의 *결정 위임 규율*" (auto-deferral 금지), advisory = "Ultrasafe 의 *외부 강제 권한*" (pipeline 차단 권한). 전자는 *내부 Hyperbrief gate 와의 정합* 이고 후자는 *외부 release flow 와의 정합* — 직교축. v0.2 에서 advisory→blocking 으로 승격 시 strict 규율은 그대로 유지 (auto-deferral 은 여전히 금지) — 두 축이 *서로의 강도를 자동 따라가지 않음* 이 design intent.

**Tier A critic 패치 — schema evolution (§12.4 cross-ref)**: `recommended_methodology[]` default candidate set 의 추가/삭제는 `schema_version` bump (semver minor) 필수. v0.1 의 4 candidate ↔ v0.2+ 의 확장은 backward-compatible (기존 candidate ID 유지 + 신규 추가만). adopter 의 `.hyperbrief/profile.json` 에 candidate override 가 있다면 spec default 보다 우선.

### §7.4 Auto-block 3-AND triggers — deterministic 만 허용

Hyperbrief gate 우회 (즉, *user 결정 없이 Ultrasafe 가 자동 BLOCK*) 는 **다음 3 조건의 AND** 가 모두 충족될 때만 허용해요:

1. **Deterministic signal**: signature-based detection (CVE-ID 매칭, ATT&CK technique-ID 정확 일치, hash 검증 실패, SBOM unsigned dependency 등 — `web-api-infra §1.3` + `threat-modeling §3.1` 의 ground-truth anchor 필수). LLM judgment 가 *single source* 인 finding 은 deterministic 아님.
2. **FP rate < 1%**: 해당 detector 의 historical false-positive rate 가 baseline corpus (§6.4 regression baseline 참조) 에서 1% 미만임이 측정·기록됨. neural / heuristic detector 는 본 임계를 거의 못 넘으므로 *signature + provenance 기반 detector* 만 사실상 통과.
3. **Reversibility full**: 자동 block 의 *대상 action* (release / deploy / publish) 자체가 fully reversible — Ultrasafe 가 block 한 release 를 user 가 30초 안에 override 발행 가능. block 이 user 의 자율성을 *정지* 시키지 *제거* 하지 않음.

**3-AND 미충족 = Hyperbrief gate 통과 의무**. LLM-based finding 은 (1) 단독으로 실패하므로 *항상* Hyperbrief gate 를 거쳐요 — §7.5 참조.

**§6.3 coverage 정의 cross-ref (Tier A critic 패치)**: auto-block 발화한 finding 은 §6.3 의 *coverage matrix* 에서 `auto_blocked` 셀로 분리 집계해요. coverage = (axis 별 finding count) 의 분포가 아니라, (axis × disposition) 의 결합 분포. auto-block 비율이 70% 초과 시 §2.4 와 유사한 *self-throttle warning* 발화 (`Ultrasafe deterministic-block 과잉 사용 감지 — false-blocking 위험`).

**§6.4 regression baseline cross-ref**: §7.4 의 FP rate < 1% 임계는 §6.4 의 baseline corpus (snapshot N ≥ 100 release × 3 iteration history) 에 대한 측정값이에요. baseline 이 N < 100 인 신규 adopter 는 FP rate 측정 불가 → §7.4 의 (2) 조건이 자동 false → auto-block 금지 → 모든 finding 이 Hyperbrief gate 행. 이는 *cold-start safety* — Ultrasafe 가 측정 가능한 baseline 을 축적할 때까지 자율 결정 권한이 0.

### §7.5 LLM-based 평가 → Hyperbrief routing 의무

모든 LLM-based finding (각 axis agent 의 보고 중 deterministic anchor 미보유 항목) 은 *반드시* Hyperbrief gate 를 거쳐요:

- **이유 (1) — hallucinated finding** (`threat-modeling §4.7`): LLM agent 가 존재하지 않는 vulnerability 를 보고할 가능성. anchor (file_path + line_range + exploit_PoC_sketch) 검증 통과 전 자동 block 불가.
- **이유 (2) — alignment faking** (`adversarial-ml §1.12` + §4.8): LLM 이 evaluation context 와 deployment context 를 구분해 다르게 행동할 가능성. attack agent 가 weak attack 만 시도해 false-clean 을 만들거나, 반대로 over-aggressive 하게 false-positive 양산 가능.
- **이유 (3) — specification gaming meta-vulnerability** (`adversarial-ml §3.6` + §4.4): Ultrasafe 의 자체 metric (clean rate / FP rate) 을 attack agent 가 exploit. LLM judgment 만으로 auto-block 을 허용하면 spec-gaming 의 incentive structure 가 더 커짐.

**routing 절차**:

```yaml
# pseudocode (mappers/llm-finding-to-hyperbrief.cjs)
for finding in llm_findings:
  if not has_ground_truth_anchor(finding):
    # anchor 없는 LLM-only finding 은 Hyperbrief gate 의무
    hyperbrief_score = f_PASTA_to_Hyperbrief(finding.pasta_quad)
    if hyperbrief_score.sum >= 4 or any_MUST_trigger(finding):
      emit_hyperbrief_card(
        finding=finding,
        recommended_methodology=prefill_candidate(finding),  # §7.2
        confidence_downgrade=true,  # LLM-only → confidence cap 0.6
      )
    else:
      # sum < 4 + MUST 미발화 → autonomous_decide 가능
      # but: Ultrasafe 는 보안 도메인이므로 추가 보수성
      route_to(disposition='apply' if reversibility_two_way else 'hyperbrief_gate')
```

**§8 broker surface 패치 (Tier A critic)**: 위 routing 의 emit 은 Constellation A2A `DECISION_REQUEST` + `HyperbriefCard` 페어 (Hyperbrief §8.1) 로 전송돼요. broker (collab-client) 의 inbox 표면에서 Ultrasafe-originated card 는 `intent_subtype: ultrasafe_finding` 태그로 구분, finding bundle ID + axis coverage matrix snapshot 을 envelope metadata 에 동봉. 이는 §8 의 broker surface 확장 (Ultrasafe finding 의 traceability) 의 1차 데이터 모델.

### §7.6 confidence cap + falsification trigger

LLM-based finding 의 `confidence.point_estimate` 는 자동으로 0.6 cap (Hyperbrief §8.2 의 "proposal candidate" 임계 직하). 이는 *recommended* 가 아닌 *proposal candidate* 로 label 됨을 의미 — user 가 보는 surface 에서 명시적으로 "LLM 단독 평가" 가 표시돼요.

각 routing 결과는 §8 의 `falsification_trigger` (`{what_to_observe, when, threshold}`) 필수 — Ultrasafe finding 의 경우 `what_to_observe = "post-fix iteration N+1 에서 동일 finding 재출현 여부"`, `when = "ITER N+1 retire barrier"`, `threshold = "재출현 시 escalate 1단계 승급"` 가 표준 prefill.

### §7.7 cross-section 의존성 요약

- §6.3 (coverage 정의): `disposition` 축 추가 — auto-block / hyperbrief-gated / autonomous-apply 의 셀 분리
- §6.4 (regression baseline): §7.4 의 FP rate 측정 근거
- §8 (broker surface): Ultrasafe-originated card 의 envelope metadata
- §12.4 (schema evolution): `recommended_methodology[]` default candidate 의 semver 규율
- §13.5 (strict-mode reconciliation): strict ↔ advisory ↔ blocking 의 직교축 명시

Hyperbrief §2.4 의 self-throttle (alert-fatigue 회로 차단기) 는 Ultrasafe-originated card 에도 그대로 적용 — Ultrasafe finding 의 user 수락률이 70% 초과 + premortem 평균 길이 < 30 chars 시 자동 임계 상향. 보안 도메인의 *경보 피로* 가 *진짜 위협의 무감각* 으로 변하는 failure mode 차단.

---

## §8. Constellation A2A — 5 신규 intent

> Ultrasafe 가 EG 의 다섯 번째 모듈로서 Constellation 위에 거주하려면, 자기 발견 + iteration boundary + release gate + 외부 disclosure intake + 다자 disclosure coordination 의 다섯 종류 상호작용을 **A2A wire 표면 1급 시민**으로 가져야 해요. 본 절은 Constellation §13.16.9 의 A2A-intent 가족을 5개 신규 name 으로 확장하고, A2A 채널 자체가 prompt-injection 표적이 되는 구조적 함정 (ai-red-team §3.5 + §4.8) 을 Spotlighting wrapper + 정적 마커 스캔의 두 layer 로 차단해요. 동시에 critic Tier A 가 지적한 "broker compromise 자체의 공격 표면" 을 §8.4 의 별도 surface analysis 로 흡수해요.

### §8.1 5 신규 A2A intent schema (§13.16.9 확장)

다섯 신규 name 은 Constellation §13.16.9 의 **A2A-intent allowlist** 에 추가돼요 — 즉 `targetAgentId` 미지정 시 fail-safe default A2A-intent branch 를 통해 main agent inbox 로 라우팅되고, watcher 의 meaningful-inbound 필터가 wake 대상으로 인식해요. Hyperbrief `DECISION_REQUEST` / `HyperbriefCard` 가족 (§13.16.9 v2.5.28) 과 동일한 **paired-envelope + parentId linkage** 패턴을 채택해서 라이브보드가 한 카드로 렌더해요.

| name | 방향 | ack tier (§13.13) | paired companion | 1줄 의도 |
|---|---|---|---|---|
| `ULTRASAFE_FINDING` | red-team agent → main / dashboard | `commitment` | 없음 (단독 envelope) | 단일 finding 1건 emit (lightweight, 카드 슬라이드인 트리거) |
| `ITERATION_BOUNDARY` | orchestrator → main / dashboard | `commitment` | 없음 | iteration N → N+1 전환 시점 + summary stats (resolved / new / regressed / coverage) |
| `RELEASE_GATE` | orchestrator → main | `decided` (Hyperbrief 와 동일 application-tier) | `HyperbriefCard` (escalation ≥ 4 시) | release / hold / escalate 판정 + 4-score gate 입력 |
| `SECURITY_DISCLOSURE_INTAKE` | external researcher gateway → main | `commitment` + 인증 layer | 없음 (단독) | 외부 responsible-disclosure 통보 수신 (bug bounty + unsolicited 양쪽) |
| `MPCVD_COORDINATION` | coordinator ↔ 다자 vendor | `decided` | 자체 broadcast cohort | 다자 vulnerability disclosure 의 hub-and-spoke 조정 (embargo state / patch readiness / staged release) |

**Wire format (canonical, v0.1.0)** — `CUSTOM` envelope 의 `value` 본체. `name` 은 server-side `type: "CUSTOM"` 정규화 (§13.11.3 rule 1) 후 §13.16.9 의 routing decision tree 가 4-group classification 의 **A2A-intent 그룹**으로 라우팅:

```json
{
  "type": "CUSTOM",
  "name": "ULTRASAFE_FINDING",
  "targetAgentId": "main",
  "value": {
    "finding_id": "us-2026-06-06-0001",
    "iteration": 2,
    "axis": "prompt_injection",
    "agent_id": "redteam_websec_alpha",
    "attack_pattern": { "stix_id": "...", "mitre_technique": "T1059.001" },
    "severity": { "cvss": 8.1, "epss_estimate": null, "ultrasafe_exploited": true, "asr_pct": 12.4, "ci95": [9.1, 16.0] },
    "diamond": { "adversary": "...", "capability": "...", "infrastructure": "...", "victim": "..." },
    "evidence_ref": "sarif://run-7/result-42",
    "redaction": "external_summary_only",
    "spotlight_wrap": true
  }
}
```

`ITERATION_BOUNDARY` 의 `value` 는 `{ iteration_from, iteration_to, summary: { findings_total, resolved, new, regressed }, coverage: { axes_run, asset_coverage_pct, perspective_diversity }, clean_signal: bool }` — §8.5 의 라이브보드 카드 + 외부 SARIF/STIX commit 양쪽이 같은 body 를 소비해요.

`RELEASE_GATE` 의 `value` 는 `{ release_candidate, verdict: "release"|"hold"|"escalate", grading: "minimal"|"standard"|"high", findings_residual, hyperbrief_id?, methodology[] }` — `verdict: "escalate"` 시 paired `HyperbriefCard` 가 동일 `parentId` 로 함께 emit (Hyperbrief.md §8 의 pair 패턴 재사용).

`SECURITY_DISCLOSURE_INTAKE` 와 `MPCVD_COORDINATION` 은 외부 actor 가 sender 측에 있을 수 있으므로 **인증 layer 의무화** (§8.4 참조) — protocol-trust-evolution §1.4 의 PKI chain-of-trust 패턴을 차용해 Ed25519 signature 필드를 `value._sig` 에 mandatory 로 두고, signature 검증 실패 envelope 은 main inbox 로 라우팅되기 전에 **server-side 차단**.

### §8.2 A2A inbound Spotlighting wrapper

ai-red-team §1.2 (Greshake et al. 2023 indirect prompt injection) + §2.4 의 Spotlighting 방어 (Hines et al. 2024, arXiv:2403.14720 — ASR 50%+ → 2% 미만) 가 본 wrapper 의 직접 모델이에요. **Constellation A2A 의 outbox/inbox 자체가 untrusted data channel** (ai-red-team §3.5) 이라는 명제를 v0.1.0 spec 의 default 로 흡수해요.

**Wrapper 규율** (모든 A2A inbound 에 적용, 5 신규 intent 포함 + Constellation §13.16.9 A2A-intent 그룹 전체에 generalize):

1. **Provenance fence 삽입**. inbox cursor advance 시 (`§13.16.6` element 1 + `§13.16.10` pre-send probe 양쪽 시점), 새 inbound 의 `value` 본체가 LLM context 로 진입하기 전 fence delimiter 로 래핑 — Hyperbrief.md §5.6.7 v0.5.6 의 auto-localize fence 패턴 재사용:

```
<<UNTRUSTED_A2A name="ULTRASAFE_FINDING" sender="redteam_websec_alpha" iso="2026-06-06T…">>
{ … 원본 value … }
<<END_UNTRUSTED_A2A>>
```

2. **Special-token marking**. fence 내부의 자연어 텍스트는 base64 인코딩 또는 zero-width joiner 마킹 중 1택 — Hines et al. 2024 의 3가지 spotlighting 방식 (delimiting / datamarking / encoding) 중 datamarking 이 EG context window 비용 가장 낮음 (token 수 1.1× 수준).
3. **Trust budget annotation**. wrapper 는 발신자 식별만 표기, **신뢰 등급은 부여하지 않음** — protocol-trust-evolution §1.10 의 mutual-trust 가정 침식 + ai-red-team §4.8 (A2A 가 안전 채널이라는 함정) 양쪽에 정합. 신뢰 결정은 wrapper 가 아니라 **다음 도구 호출 영향력 평가**가 담당.
4. **Greatpractice outbox-json-validation 패턴 reuse**. wrapper 적용 자체가 Greatpractice §micro `pre-emit-validation` 훅의 inbound-side 대칭 — outbox 측 `JSON.stringify` + roundtrip parse (`memory/feedback_outbox_json_validation.md`) 가 emit 측 invariant 였다면, Spotlighting wrapper 는 ingest 측 invariant. 두 훅이 같은 Greatpractice tree 의 macro 노드 `a2a-channel-untrusted-by-default` 의 두 자식.

**적용 시점**: `§13.16.6` v2.4.16 ev-agnostic 단일-stage name filter 가 meaningful-inbound 으로 classify 한 순간 wrapper 가 자동 삽입 — agent 가 자발적으로 적용할 여지를 두지 않아요 (`§13.16.7` BOARD_STALE gate 가 보드 업데이트를 volitional → mechanical 로 전환한 동일 reasoning).

### §8.3 Outbox 정적 마커 스캔 (instruction-like 패턴 차단)

ai-red-team §1.9 의 MCP tool poisoning + tool shadowing (Invariant Labs 2025) + §3.5 의 "cross-agent cascading injection 차단" 이 본 스캐너의 합목적이에요. outbox 측에 instruction-like 패턴이 새어나가면 그 envelope 을 수신한 카운터파트 agent 의 system prompt 와 직접 concat 되어 cross-agent worm 의 hop 이 돼요 (Greshake worming chain).

**정적 스캐너 규율** — `scripts/eg_outbox_push.cjs` (이미 outbox JSON validation 의 권장 진입점) 에 한 stage 추가:

| 패턴 클래스 | 정규식 / 검출 | 차단 액션 |
|---|---|---|
| Override prefix | `^\s*(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions|rules)` (case-insensitive) | hard block + Hyperbrief 카드로 위임 |
| Role-override | `you\s+are\s+(now\s+)?(DAN|developer\s+mode|jailbroken|unrestricted)` | hard block |
| System-prompt leak request | `(repeat|print|reveal|show)\s+(your\s+)?(system\s+prompt\|initial\s+instructions\|above\s+text)` | hard block + Greatpractice micro-pattern 등록 |
| Unicode confusable | Cyrillic / Greek / mathematical Alphanumeric 의 Latin look-alike 검출 (NFKC 정규화 후 코드포인트 비교) | warn + base64 wrap 강제 |
| Hidden whitespace | zero-width joiner / non-breaking space / tag character (U+E0020-U+E007F) 검출 | strip + warn |
| Tool-call instruction | `(call|invoke|execute|run)\s+(tool|function|skill)\s*[:=]\s*\w+` 외부 사용자 입력 origin | quarantine + 사람 검토 |

**Hard block 의 의미**: scanner 가 hit 하면 `appendFileSync(outbox.jsonl, …)` 가 throw, outbox push 가 중단, agent 는 즉시 wrapper-revise 또는 Hyperbrief DECISION_REQUEST 경로로 escalate. ai-red-team §3.7 의 "Trifecta 정적 검사" 패턴과 같은 결정론적 차단 layer — LLM-as-judge 가 아니라 정규식 + Unicode 정규화로 false-negative 없이.

**왜 outbox 측인가**: inbox 측 wrapper (§8.2) 가 본 agent 의 안전을 지키는 layer 라면, outbox scanner 는 **본 agent 가 다른 agent 의 worm hop 이 되지 않도록 하는 layer** — Greshake worming 의 propagate 방향을 자기 측에서 끊어요. 두 layer 가 같은 channel 의 양 끝에 배치되어야 cross-agent cascading injection 이 완전 차단.

**Greatpractice 자동 등록 path**: scanner 가 새 패턴을 hit 했을 때 (high-confidence, ASR ≥ 50% 또는 N 회 이상 누적) Greatpractice tree 의 mezzo 노드 `outbox-instruction-marker-block` 에 자동 promote — ai-red-team §3.6 의 promotion path 와 동일.

### §8.4 Broker compromise surface analysis (critic Tier A patch)

**critic gap 의 정확한 형태**: §8.1-§8.3 의 모든 layer 는 **Constellation broker 가 정상 동작한다는 가정 위에 서 있어요**. broker 자체가 compromise 되면 — (a) routing decision tree 가 우회되어 board-directed 그룹이 main inbox 로 mis-route, (b) Spotlighting wrapper 의 fence 자체가 보드에서 strip 되어 LLM 으로 전달, (c) ack tier 가 거짓 신호로 emit 되어 at-least-once 가정 (§13.13.2) 이 무너짐 — Ultrasafe 의 보안 보고서가 정작 자신의 신뢰 anchor 를 검증하지 못해요.

**공격 표면 분해** (protocol-trust-evolution §2 의 layered attack stack 차용):

| layer | broker compromise 시 노출 | 완화 layer |
|---|---|---|
| L1 identity | broker 가 sender 식별자를 위조해 unsigned envelope 을 trusted-source 로 stamp | 5 신규 intent 의 `value._sig` Ed25519 signature 의무 — broker 가 strip 해도 receiver-side 검증 실패 |
| L2 transport | broker 가 in-flight tamper (envelope value 변조) | signature 가 value 본체를 cover — tamper 즉시 검증 실패 |
| L3 payload | broker 가 wrapper fence 를 strip 해 raw 본체를 LLM context 에 주입 | **receiver-side wrapper 재삽입** — agent 측 §13.16.6 watcher 가 inbox 의 raw line 을 직접 읽어 wrapper 를 *재* 적용 (broker 의 fence-strip 을 무효화) |
| L4 temporal | broker 가 stale envelope 을 replay 하거나 fresh envelope 을 drop | `value.iso` + monotonic `decision_id` + receiver-side seen-msgId LRU (§13.13.2) — replay 차단; drop 은 §13.13.2 at-least-once + `ack_tier='delivered-persist'` 로 탐지 |
| L5 aggregation | broker 가 `RELEASE_GATE` 의 verdict 를 escalate → release 로 변조 | `ack_tier='decided'` 가 **사용자측** signed receipt — broker 가 변조해도 receipt 검증 실패 |

**out-of-band 검증 hook**: broker 측 신호만으로는 broker compromise 의 self-reference 함정 (ai-red-team §4.5: "Trifecta 우회 = LLM-as-judge 충분" 함정의 broker 등가물) 을 풀 수 없어요. 따라서 `RELEASE_GATE` + `MPCVD_COORDINATION` 의 두 high-stakes intent 는 **별도 채널 (Hyperbrief md_permalink + 사용자 측 dashboard direct view)** 의 cross-verification 을 release-gate 통과 조건으로 강제 — Let's Encrypt (protocol-trust-evolution §1.5) 가 IdenTrust cross-sign 으로 bootstrap 한 패턴의 응용.

**broker 자체의 Ultrasafe iteration 대상화**: Constellation broker (server.cjs + bridge) 가 pre-release 시점에 Ultrasafe iteration 의 **명시적 axis target** 으로 포함 (§6.3 의 coverage definition 에 broker 자체를 asset 으로 등록). broker 의 routing decision tree 가 §13.16.9 의 4-group classification 을 위반하는지를 fuzz (fuzzing-pbt §3 의 differential fuzzing 패턴), broker 의 signature 검증 logic 자체에 대해 adversarial-ml 류 변형 입력 주입. broker 의 신뢰는 가정이 아니라 **매 release 마다 재검증되는 측정값**.

### §8.5 Live board 시각화 (Ultrasafe 카드 stream, tri-tier)

security-visualization-dashboard §2.6 의 실시간 위협 피드 패턴 (Wazuh / Splunk 카드 슬라이드인) + §3.4 의 OpenCTI 위젯-단위 dashboard + Constellation §13.16.12 의 dashboard-render-patterns SSoT 를 결합해 **tri-tier 카드 stream** 을 정의해요. 별도 dashboard 인프라 없음 — Constellation 라이브보드가 그대로 surface.

**Tier 1 — 공격자 에이전트 카드** (`ULTRASAFE_FINDING` emit 의 부산물 + iteration 시작 시 prelaunch):

- 표시 필드: `agent_id` · `perspective` (OWASP LLM Top 10 axis 매핑) · `status` (running / completed / failed) · `findings_so_far` 카운트 · `iteration N/M` · ETA
- 라이브보드 위치: 새 sub-channel `#ultrasafe-agents` (Constellation §13.16.12 Pattern 7 의 generalize) — main A2A 채널을 노이즈로 채우지 않도록.
- 상태 진행: 카드 background 색이 status 와 동기화 (running=blue / completed=green / failed=red).

**Tier 2 — 발견 위협 카드** (`ULTRASAFE_FINDING` emit 마다 1 카드 슬라이드인):

- 표시 필드: `finding_id` · severity color (security-visualization-dashboard §2.4 의 5×5 cell color 매핑) · MITRE ATT&CK technique badge · Kill Chain phase lane (security-visualization-dashboard §1.6) · 1-line evidence · "details" expand 액션 (전체 JSON + SARIF link).
- 위협 분류 표시: `axis` 라벨 (`prompt_injection` / `excessive_agency` / 등) + Diamond Model 4-vertex badge.
- **redaction 자동 적용**: `value.redaction === "external_summary_only"` 인 finding 은 카드의 evidence 영역이 자동 mask, internal_evidence 는 outbox 영속 파일에만 남음 (security-visualization-dashboard §4.9 + `feedback_public_repo_redaction.md` 정합).

**Tier 3 — 보강 status + iteration boundary 카드** (`ITERATION_BOUNDARY` + `RELEASE_GATE` emit):

- iteration boundary 카드: delta heatmap (security-visualization-dashboard §3.6) — 해결 cell (green flash) · 새 발견 cell (red flash) · regression cell (orange flash). cumulative resolved / new / regressed metric 3-tuple 표시.
- release gate 카드: verdict badge (release / hold / escalate) + grading badge (minimal / standard / high) + paired HyperbriefCard link (escalate 시).
- 이전 iteration 카드는 자동 dimmed/archive 처리 — security-visualization-dashboard §4.1 의 alert fatigue 회피.

**카드 합성과 ATT&CK 히트맵 export**: iteration boundary 시점에 라이브보드가 누적 finding 의 ATT&CK Navigator JSON layer (security-visualization-dashboard §3.2 의 retire-barrier overlay 합성 결과) 를 thumbnail 로 렌더 + Navigator 로 직접 import 가능한 export 버튼 제공. SARIF 2.1.0 + STIX 2.1 bundle 도 같은 카드의 download action 으로 노출 (security-visualization-dashboard §3.7-§3.8).

**감사 trail 보존**: 라이브보드 카드는 *현재 상황 모니터링* 용도일 뿐, **증거는 영속 파일** — `ULTRASAFE_FINDING` / `ITERATION_BOUNDARY` / `RELEASE_GATE` 모든 emit 은 outbox.jsonl 영속화 (Constellation §13.13.2 at-least-once) + SARIF/STIX 별도 commit 의 두 channel 로 동시 보존, 라이브보드 surface 가 사일런트 드롭되어도 evidence 손실 없음 (security-visualization-dashboard §4.6 정합).

**Cross-section dependencies**: 카드 schema 의 finding 필드는 §6.3 (coverage definition — asset_coverage_pct / perspective_diversity 가 ITERATION_BOUNDARY 카드의 입력), §6.4 (regression baseline — 직전 iteration 의 resolved finding 의 reproducer 재실행 결과가 delta heatmap regression cell 의 source), §7.3 (strict-mode reconciliation — release gate 의 grading 결정 입력), §12.4 (schema evolution — 5 intent name 의 향후 version 증가에 대한 backward-compat 규칙), §13.5 (strict-mode reconciliation 의 release-flow trigger) 각각에서 정의되는 raw 값을 소비해요. 본 §8 은 transport + presentation 표면만 담당, 측정 정의는 forward refs 가 resolve.

---

## §9. Greatpractice Tree 통합

> Ultrasafe 는 *발견 그 자체* 를 결과로 삼지 않아요. 발견 → finding → policy → tree node 로 *위상 변환* (lift) 시키는 codification 파이프라인이 같이 돌아야 모듈의 ROI 가 release-당 단발 비용을 넘어 *시간축 누적* 으로 들어와요. 본 §은 Ultrasafe ↔ Greatpractice 의 양방향 feed 를 정의해요 — (a) finding leaf 의 자동 등록, (b) recurring defect → policy (Kyverno + Greatpractice mezzo) 의 graduated promotion, (c) Greatpractice tree → Ultrasafe attack catalog 의 역방향 feed, (d) SRE postmortem-style retire-barrier 보고서가 macro/mezzo/micro 로 위계 격상되는 path. devsecops-policy-as-code §2.5 graduated enforcement + threat-modeling §3.8 Ultrasafe-Greatpractice 양방향 feed + incident-response §3.6 postmortem-to-greatpractice 변환 + Greatpractice §5 maturation gate 의 직접 instantiation 이에요.

### §9.1 Finding leaf registration — Greatpractice mezzo/security/ subtree 자동 등록

Ultrasafe 의 retire-barrier 합성기 (§7.3 strict-mode reconciliation 의 final consolidation pass) 가 dedup·CWE/ATT&CK 정규화·multi-causal cause graph 를 마친 finding 을 emit 하는 시점에, **각 finding 은 곧바로 Greatpractice tree 의 raw memory 노드로 register** 돼요. 이는 incident-response §3.6 의 postmortem 산출물 → tree 노드 변환 schema 의 Ultrasafe-side 자동화.

**등록 경로**:
```
ultrasafe/findings/<iteration_N>/F-<id>.json     (Ultrasafe internal artifact)
        ↓ retire-barrier 합성 종료 시 자동 emit
memory/feedback_ultrasafe_<finding_slug>.md      (raw memory — Greatpractice §5 capture)
        ↓ Greatpractice maturation pipeline 진입
greatpractice/_propose/<finding_slug>.draft.md   (recurring 시 §5.2 notability gate 후)
        ↓ phronesis + approval
greatpractice/mezzo/security/<finding_slug>.md   (ratified entry — security/ subtree)
```

**frontmatter 자동 작성 (mandatory 7 field — Greatpractice §3.2)**:

| Field | Ultrasafe source | 예시 |
|---|---|---|
| `id` | `ultrasafe-<axis>-<cwe>-<slug>` | `ultrasafe-stride-T-cwe89-search-sqli` |
| `tier` | finding severity + recurrence 로 결정 | mezzo (first-cut default) |
| `binding` | enforcement_level 매핑 | `ratio` (mandatory) · `obiter` (advisory) |
| `enforcement_level` | §3.3 priority 점수 ≥ 7.5 → mandatory | mandatory · recommended · advisory |
| `trigger` | finding 의 attack pattern + file/line anchor | `{if: "<DFD-element> 의 <interaction> 진입", then: "<policy> 적용"}` |
| `lifecycle` | 신규 등록 시 항상 `probation` | probation |
| `last_referenced_turn` | Ultrasafe iteration N timestamp | 2026-06-06T... |

**source_evidence 자동 chain**: 등록 entry 는 `source_evidence: [ultrasafe/findings/<iter>/F-<id>.json, reports/<ultrasafe-axis>.md#§<id>]` 로 trace 가 보존돼요 — Greatpractice §3.2 frontmatter 의 evidence chain 의무 + canonical §1.3 redirect attribution 동시 충족. tree 의 어떤 노드든 *어느 Ultrasafe iteration 의 어느 finding 에서 왔는지* 가 항상 역추적 가능.

**security/ subtree 의 INDEX inclusion**: `greatpractice/INDEX.md` 의 ≤300 token cap (Greatpractice §2.5) 안에 `mezzo: security/* (N)` 한 줄만 노출. count 인플레이션이 macro budget 을 침범하지 않도록 slab grouping (Greatpractice §2.6 의 `class:` field — 모든 Ultrasafe-origin micro atom 이 `class: ultrasafe-security` 로 묶임).

**A2A relay 보강**: register emit 은 Constellation A2A 의 `GREATPRACTICE_REGISTER` intent 로 broadcast — incident-response §3.7 의 MPCVD intent + memory `feedback_a2a_relay_reliability.md` 의 at-least-once 보강 (security intent 만은 transport-tier Ack 외 *recipient inbox 확인 probe* 까지 강제). 이는 §8 의 broker surface (Constellation 라이브보드 ws-history 의 `greatpractice-register` 채널) 와 짝.

### §9.2 Recurring defect → policy promotion — Kyverno + Greatpractice mezzo graduated enforcement

같은 finding 이 *복수 iteration* 또는 *복수 release cycle* 에 걸쳐 재발하면, single-finding remediation 으론 부족해요. devsecops-policy-as-code §1.5 Sentinel 3-tier (advisory → soft-mandatory → hard-mandatory) + §2.5 graduated enforcement ladder + threat-modeling §3.8 양방향 feed 의 합성으로 **policy promotion ladder** 가 정의돼요.

**Promotion 조건** (Greatpractice §5.1 5-axis maturity score 의 Ultrasafe-적용 형):

```
recurring_defect_signal:
  frequency:        Ultrasafe iteration loop 내부 동일 finding 재발 N ≥ 2
                    OR release cycle 간 재등장 N ≥ 2
  depth:            finding 의 CWE-ID 같은 anchor 가 distinct file/module 에서 발견
  cost:             release-block 또는 KEV-equivalent 매칭 (incident-response §3.3)
  predictability:   trigger 가 Kyverno admission / OPA Conftest 로 mechanical 검출 가능
  independent_triggers: ≥ 2 종 distinct (work-domain × phase) 좌표 (Greatpractice §5.2)
```

`maturity_score ≥ 18` 또는 `(frequency ≥ 3 AND independent_triggers ≥ 2 AND verifiable_effect)` 통과 시 → policy candidate 로 격상.

**4-tier ladder** (Greatpractice §3.3 enforcement_level + devsecops §2.5 graduated enforcement 의 통합):

| Tier | Greatpractice entry | Kyverno / OPA 적용 | 통과 조건 |
|---|---|---|---|
| **L1 advisory** | `binding: obiter`, `enforcement_level: advisory` | `validationFailureAction: Audit` (Kyverno) · OPA log-only | 1 iteration 잔존, false-positive rate 측정 시작 |
| **L2 soft-mandatory** | `binding: obiter`, `enforcement_level: recommended` | Kyverno `Enforce` + `validationFailureActionOverrides` 허용 · OPA decision log + override channel | FP rate < 5% × 2 iteration 안정, override rate < 10% |
| **L3 hard-mandatory** | `binding: ratio`, `enforcement_level: mandatory` | Kyverno `Enforce` + no override · admission deny · PreToolUse exit 2 | override rate < 1% × 3 iteration, post-release dogfood 60일 hit ≥ 1 |
| **L4 retire / supersede** | `superseded_by:` 신규 entry | Kyverno policy `_archive/` 이동, OPA rule deprecated | trigger 영구 해소 (root cause 제거) 또는 better rule 도래 |

**Iteration loop 내부 detection**: Ultrasafe 의 ≥3 iteration loop 안에서 한 finding 이 *iteration N → iteration N+1 의 regression check* 를 통과 못 하면 (incident-response §3.1 의 iteration_3 regression_findings=0 게이트), 그 finding 은 즉시 §9.2 promotion ladder 의 L1 candidate. iteration loop 자체가 *micro-scale graduated enforcement test* — release-당 한 ladder 단계만 promote (cargo-cult 회피, devsecops §4.7).

**Schema bridge — Kyverno YAML ↔ Greatpractice frontmatter** (devsecops §3.4 의 PaC output 형식):

```yaml
# Greatpractice mezzo/security/no-search-sqli.md frontmatter 의 surfaces[]
surfaces:
  - kind: policy
    engine: kyverno
    path: ultrasafe/policies/no-search-sqli.yaml
    enforcement_level_map: {advisory: Audit, recommended: Enforce-with-override, mandatory: Enforce-no-override}
    inherits_freshness: true
  - kind: hook
    path: .claude/settings.local.json#hooks.PreToolUse[search-handler-deploy]
    inherits_freshness: true
```

**Schema evolution discipline** (§12.4 strict-mode 적용): policy promotion 으로 Kyverno YAML schema 가 `validate.deny` → `validate.deny + mutate.patchStrategicMerge` 로 확장될 때, 기존 L1/L2 surface 는 *backward-compatible read* 유지 (Greatpractice §3.8 6-cycle migration grace). schema version bump 은 `surfaces[].schema_version` 으로 명시 — strict-mode lint 가 mismatch 시 warn (block 아님, retro-backfill 보호).

**Regression baseline 통합** (§6.4 적용): ladder 의 매 promotion 은 *baseline metric set* 을 frontmatter 의 `regression_baseline: {iteration_N: <metric snapshot>}` 에 stamp. iteration N+1 의 verify 단계가 baseline 대비 *FP rate · override rate · hit-rate* delta 가 expected band 안인지 검증 (Greatpractice §5.6 hit/miss matrix 의 Ultrasafe-적용 형).

### §9.3 Bidirectional feedback loop — Greatpractice tree → Ultrasafe attack catalog

Ultrasafe → Greatpractice 의 단방향만으로는 catalog 가 stale 돼요 (devsecops §4.6 BAS stale attack catalog 함정). **Greatpractice tree → Ultrasafe attack catalog 의 역방향 feed** 가 필수 — threat-modeling §3.8 의 양방향 feed 명제의 직접 instantiation.

**역방향 채널 3종**:

| 채널 | 입력 | 출력 |
|---|---|---|
| **Pattern → Attack** | `greatpractice/mezzo/security/<slug>.md` 의 `trigger.if/then` | Ultrasafe iteration 1 의 *known-bad pattern* pre-check 카탈로그 |
| **Mitigation → Defense Tree** | mezzo entry 의 `mitigation:` field (PaC policy 본문) | Attack-Defense Tree (threat-modeling §1.6 Kordy et al. 2010) 의 defense node 자동 ingest |
| **Postmortem → Scenario** | macro entry 의 `lessons_learned:` (incident-response §1.4 Google SRE template) | Wheel-of-Misfortune scenario pool (incident-response §1.10 + §3.4) — 다음 release 의 red-team agent 의 input |

**Catalog ingest 시점**: Ultrasafe pipeline 의 step 0 (DFD 자동 추출 직후, 모든 axis fan-out 직전) 에 Greatpractice tree 의 `mezzo/security/*` + `mezzo/incident-pattern/*` 를 일괄 ingest. iteration 1 의 첫 pass 가 *known-pattern pre-check* — 이미 codified 된 attack 은 즉각 fail-fast (incident-response §3.4 Wheel-of-Misfortune 의 scenario_pool replay).

**Coverage definition 통합** (§6.3 적용): Greatpractice tree 의 entry 개수 + class 분포가 UKC phase coverage matrix (threat-modeling §3.3) 와 cross-product 해서 *coverage = (axis_covered × tree_entries_covered) / (axis_total × tree_entries_total)* 로 정의돼요. 즉 coverage 는 axis 단독이 아니라 *tree-instantiated attack pattern × axis fan-out* 의 매트릭스. iteration N+1 entry condition: coverage gap 있으면 절대 CLEAN 선언 불가 + missing class 의 supplementary agent 자동 spawn.

**Stale entry 차단**: tree 의 한 entry 가 `last_validated_at + validation_cadence_days` 만료 (Greatpractice §7) 면 attack catalog 의 해당 pattern 은 *advisory* 로만 ingest (mandatory pre-check 제외). devsecops §4.6 의 ageing alert 와 일관. freshness 가 만료된 stale entry 가 false-positive 양산해 release 를 blocking 하는 anti-pattern 회피.

**Constellation A2A 채널 활용**: external CTI / cross-counterpart incident report 가 A2A counterpart 로부터 inbox 로 도착하면 (threat-modeling §3.6 외부 어댑터), 그 메시지는 `GREATPRACTICE_REGISTER` intent 의 *external_source* tag 로 들어와 Greatpractice tree 의 raw memory 진입. 다음 Ultrasafe iteration 의 catalog 는 자동 refresh — 외부 위협 학습이 사람의 수동 동기화 없이 propagate.

### §9.4 SRE postmortem → macro/mezzo/micro 격상 path

Ultrasafe iteration 의 retire-barrier 합성기가 emit 하는 보고서는 *Google SRE postmortem 표준 template 형식 준수* (incident-response §1.4 + §3.6). 이 보고서 자체가 Greatpractice tree 의 macro/mezzo/micro 노드로 *위계 격상* 가능해요. 세 layer 의 매핑 규칙:

| Layer | postmortem section 매핑 | Greatpractice tier | 예시 |
|---|---|---|---|
| **Macro** | "Lessons Learned" 의 systemic 개선 (process / arch level) + 다수 finding cross-cutting pattern | macro tier (5-10 항목 상한, Greatpractice §2.2) | "outbound A2A 동반 state change 는 local-only 보다 FIRST" 같은 거버넌스 axiom |
| **Mezzo** | "Action Items" 중 module-spanning 변경 + Contributing Factors 의 process/arch tag | mezzo tier (security/ subtree 또는 incident-pattern/ subtree) | "outbox JSON validation discipline" 같은 procedure |
| **Micro** | "Action Items" 중 single-file diff 수준 fix + executable command/check | micro tier (atom, sre §1.1 runbook-as-code) | "JSON.stringify + roundtrip parse 검증 atom" |

**격상 결정 algorithm**:

```
postmortem_to_tree(postmortem):
  # 1. Contributing Factors graph 분석 (incident-response §3.8 multi-causal)
  systemic_pattern = extract_recurring_factor(postmortem.contributing_factors)
  if systemic_pattern.recurrence_count >= 3 across postmortems:
    candidate_tier = macro
  elif systemic_pattern.scope == "module-spanning":
    candidate_tier = mezzo
  else:
    candidate_tier = micro

  # 2. phronesis-codify-boundary 평가 (Greatpractice §5.3)
  if phronesis_score(systemic_pattern) >= threshold:
    enforcement = advisory  # codify 하되 강제 차단 X
  else:
    enforcement = derive_from_priority(postmortem.severity)

  # 3. supersedes graph 업데이트 (TPS kaizen baseline 보존)
  prior_entry = search_tree(systemic_pattern.signature)
  if prior_entry exists:
    new_entry.supersedes = [prior_entry.id]
    prior_entry.superseded_by = new_entry.id
    revision_cost_tier = classify_revision(prior_entry, new_entry)
    # ∈ {distinguish, per-incuriam, overrule} — Greatpractice §7.4
```

**Blameless framing 보존** (Greatpractice §6 Cluster E + incident-response §3.2 Dekker New View): postmortem 의 "Where the system made sense" 칸이 새 entry 의 `rationale` 섹션으로 그대로 이식. 격상 entry 가 *individual blame 어휘* 를 포함하면 lint exit 2 (Greatpractice §6 의 voice-check.cjs 강제). attack agent 가 발견한 finding 도 동일 voice 적용 — "어느 agent 가 발견했는가" 가 아니라 "어느 시스템 컨텍스트가 이 vulnerability 를 합리적으로 만들었는가".

**Macro 격상 보호**: Greatpractice §2.2 의 macro 5-10 항목 상한 + §2.4 의 macro `edit_policy: owned` + Hyperbrief 4-score escalation 위임 (Hyperbrief §1 9-section IR) 이 macro 격상의 3 게이트. Ultrasafe pipeline 이 macro 격상을 *자율적으로* 결정 안 함 — 항상 Hyperbrief escalate 후 사용자 결정 위임. macro 는 워크스페이스 telos 차원이라 drift cost 가 가장 큼.

**Post-release codification cycle** (incident-response §3.5 disclosure timeline 의 EG 변용):

```
T-0      release shipped (Ultrasafe iteration N CLEAN signal + Sigstore signed)
T+30d    post-release dogfood evidence 수집 (Greatpractice §5.6 hit/miss probation)
T+60d    candidate macro/mezzo entry draft → Hyperbrief 4-score gate
T+90d    ratified entry promote OR archived (Greatpractice §5.6 90일 matrix)
T+180d   consolidation → automatic 격상 (Lally Stage 3) OR cold eviction (§7.6)
```

**Iteration loop 와의 정합**: post-release codification 의 결과 (90일/180일 후 ratified entry) 는 다음 *major release* 의 Ultrasafe iteration 1 의 catalog 의 기본 baseline. 즉 *한 release 의 학습이 다음 release 의 baseline* — kaizen baseline 의 진화 history graph (Greatpractice §3.4 + management §1.3 TPS supersedes).

### §9.5 Anti-pattern 회피 요약

| Anti-pattern | 발생 조건 | 회피 메커니즘 |
|---|---|---|
| Single-finding eager codify | 1회 finding → 즉시 mezzo entry | §9.1 raw memory 진입 후 §5.1 maturity gate 통과 후만 promote |
| Hard-mandatory premature deploy | new policy → 즉시 L3 | §9.2 4-tier ladder 강제 (L1 → L2 → L3, iteration 별 1 단계만) |
| Stale catalog drift | tree entry freshness 만료 무시 | §9.3 advisory-only ingest + ageing alert |
| Macro inflation | 모든 systemic finding 을 macro 격상 | §9.4 5-10 상한 + Hyperbrief escalation 위임 |
| Blame voice carryover | postmortem 의 individual attribution 이 entry 로 전이 | §9.4 voice-check.cjs lint exit 2 |
| Coverage 미정의 release CLEAN | axis-only coverage 만 만족하면 CLEAN | §9.3 tree-instantiated coverage matrix 강제 (§6.3 정합) |
| Schema breaking promotion | Kyverno policy upgrade 시 surface 호환 깨짐 | §9.2 `schema_version` 명시 + 6-cycle grace (§12.4 정합) |

---

*Cross-references*: §6.3 (coverage definition) · §6.4 (regression baseline) · §7.3 (strict-mode reconciliation) · §8 (broker surface) · §10 (Hyperbrief escalation gate) · §12.4 (schema evolution) · §13.5 (strict-mode lint).

---

## §10. Pre-release Trigger + Tier

> Ultrasafe 의 발화는 **두 채널 (자동 hook + 수동 skill) + 세 tier (patch / minor / major)** 의 직교 매트릭스로 정의돼요. PreToolUse hook 이 외부 발행 명령을 차단-검증하고, semver bump 가 검증 깊이를 자동 결정해요. 인용 출처: `web-api-infra §3.7` (PreToolUse hook gate) + `threat-modeling §3.10` (release trigger) + `compliance-standards §3.7` (EAL-tiered depth).

### §10.1 PreToolUse hook 매처 — 7 종 외부 발행 명령

Claude Code 의 `PreToolUse` event 가 Bash 도구 호출 직전 발화 — Ultrasafe orchestrator 가 명령 패턴을 매칭해 게이트를 강제해요. `.claude/settings.local.json` 등록 (outer 운영) + 공개 repo 의 `EstreGenesis/.claude/settings.example.json` 참조 양식.

7 종 매처 (정규식 일치 시 게이트 활성):

| Matcher ID | 명령 패턴 | 발행 유형 | Tier 결정 hint |
|---|---|---|---|
| `gpush-tags` | `git push.*--tags` | git tag annotated push | tag name 의 semver bump |
| `gh-release` | `gh release create` | GitHub Release | release name 의 semver bump |
| `npm-publish` | `npm publish` (or `pnpm/yarn publish`) | npm registry 발행 | `package.json:version` diff |
| `pypi-upload` | `twine upload\|python -m build.*upload` | PyPI 발행 | `pyproject.toml:version` diff |
| `docker-push` | `docker push.*\b[\w.-]+:[\w.-]+` (tag 명시 push) | OCI 레지스트리 발행 | image tag 의 semver |
| `cargo-publish` | `cargo publish` | crates.io 발행 | `Cargo.toml:version` diff |
| `gh-pr-merge` | `gh pr merge.*--squash\|--merge` (main 대상) | main 머지 (간접 발행) | base branch + label rubric |

hook 설정 (옵트인 — outer settings.local.json):

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node ./tools/ultrasafe/pre-release-gate.cjs --command $TOOL_INPUT"
      }]
    }]
  }
}
```

게이트 스크립트는 (a) 7 종 매처 중 어느 것이 발화했는지 식별, (b) tier 분류 (§10.3), (c) iteration 회수 ≥ minimum (§10.5) 인지 확인, (d) clean signal 부재 시 exit-code 비-0 으로 명령 차단해요. 매처가 어느 것도 일치하지 않으면 hook 은 pass-through (운영 안전 default).

### §10.2 /ultrasafe skill — 수동 invoke + 자동 escalation

자동 hook 이 외부 발행 직전 게이트라면 `/ultrasafe` skill 은 사전 능동 검증 채널이에요. 호출 패턴 4 가지:

1. **수동 directive** — 운영자가 `/ultrasafe` 또는 `/ultrasafe --tier=major` 명령 직접 입력. release tag 부착 *전* preview 검증.
2. **Hyperbrief escalation** — Hyperbrief 4-score gate (`Hyperbrief.md §1`) 의 결정 결과가 "release-with-documented-risk" 또는 "escalate-to-security-review" 일 때 skill 호출 자동 emit.
3. **Constellation INCIDENT intent** — A2A counterpart 가 `INCIDENT_ALERT` intent 로 보안 결함 신호 시 skill 자동 활성 (post-release runtime path; §10.6 의 bypass 와 구분).
4. **Greatpractice macro trigger** — Greatpractice tree 의 보안 macro pattern (예: 의존성 major bump · 인증 path 변경) 이 commit 에서 감지되면 skill 자동 호출.

skill 입력 schema:

```yaml
ultrasafe_invocation:
  trigger: manual | hyperbrief | a2a-incident | greatpractice
  tier_override: patch | minor | major | null  # null = 자동 분류
  scope: full | incremental | regression-only
  axis_set: standard | extended | full-17  # §10.4
  iteration_min: integer  # 미명시 시 tier default
  audit_trail_id: string  # OSCAL Assessment Result id
```

skill 의 출력 = OSCAL-호환 Assessment Result JSON (`compliance-standards §3.2`) + Constellation A2A `ULTRASAFE_FINDING` intent (라이브보드 surface). 두 채널의 동시 emit 으로 **broker surface 가 결과의 정본** (Tier A 패치 적용; 라이브보드 ws-history JSONL 이 audit chain 의 ground truth, 파일 로그는 fallback).

### §10.3 3-tier 자동 분류 — semver bump rubric

semver (Preston-Werner 2013, semver.org §2 + §8) 의 MAJOR.MINOR.PATCH 증분 의미론을 tier 분류 기준으로 채택해요. 이전 tag 와 신규 tag 의 diff 가 자동 결정:

| Tier | semver 변화 | 의미 | 예시 |
|---|---|---|---|
| **Tier 1 (patch)** | PATCH bump (`v2.5.42 → v2.5.43`) | 하위 호환 버그 수정 | typo 수정 · CHANGELOG 보강 · 의존성 patch bump |
| **Tier 2 (minor)** | MINOR bump (`v2.5.42 → v2.6.0`) | 하위 호환 기능 추가 | 신규 API · 모듈 부가 · 신규 axis spec |
| **Tier 3 (major)** | MAJOR bump (`v2.5.42 → v3.0.0`) | 하위 비호환 변경 | API breaking · schema 비호환 · 모듈 architecture 재편 |

**경계 케이스 분류 규칙**:
- pre-1.0 (`v0.x.y`) 의 MINOR bump 는 semver §4 에 의해 breaking 가능 → **Tier 3 으로 격상** (보수적 default).
- `chore(release)` 가 아닌 commit prefix (예: `feat:` · `fix:`) 만 있는데 tag 동반 시 tier 추정 신뢰도 낮음 → Hyperbrief 4-score gate 로 routing (`compliance-standards §3.3`).
- 동시 다중 모듈 bump (예: Constellation + Superscalar 같이) → 가장 높은 tier 채택 (`max` rule).
- security advisory 동반 (`gh release create --notes` 에 `CVE-` 패턴) → 무조건 Tier 3.

tier 분류기는 `tools/ultrasafe/tier-classifier.cjs` 가 담당, 입력 = `{previous_tag, new_tag, commit_log, advisory_flags}`, 출력 = `{tier, confidence, rationale}`.

### §10.4 Tier 별 axis-set — 8 / 13 / 17 agent

tier 마다 다른 attack agent 집합을 dispatch — EAL hierarchy (`compliance-standards §1.9`) 의 depth-of-evaluation 개념을 차용해요. 17-axis 딥리서치 (harness/web/AI/threat-modeling/multi-agent/adversarial-ml/fuzzing/supply-chain/devsecops/IR/crypto/human-factors/game-theory/compliance/cognitive/visualization/protocol-trust-evolution) 의 부분-집합 활성화.

| Tier | Agent 수 | Axis set | 주요 포커스 |
|---|---|---|---|
| **Tier 1** | 8 | sast / dast-baseline / api-fuzz / container / iac / ssrf / supplychain-diff / stride-T | 회귀 + 잘 알려진 vector |
| **Tier 2** | 13 | + linddun-{L,I,D,NC} / owasp-llm / attack-path-graph | 프라이버시 + LLM + cross-resource path |
| **Tier 3** | 17 + manual | + adversarial-ml / ukc-out / cspm-graph / human-factors **+ external red-team review** | 0-day proximity + AI-Act adversarial + 인간 검토 |

**§10.4.1 Tier 1 (8 agent)** — patch release: 회귀 검증 + 변경 surface 만 attack. `web-api-infra §2.2` 의 cross-validation cluster (size ≥ 2) 만 critical 분류. 평균 wall-time ~ 5-10 분.

**§10.4.2 Tier 2 (13 agent)** — minor release: Tier 1 + 프라이버시 (LINDDUN 4 cat) + LLM (OWASP LLM Top 10) + attack-path graph synthesis. `threat-modeling §3.1` 의 dispatch matrix 의 핵심 부분 활성. 평균 ~ 20-40 분.

**§10.4.3 Tier 3 (17 + manual)** — major release: 17-axis 전체 + **manual external review gate** (Hyperbrief escalation 으로 외부 검토자 routing). EU AI Act Article 15 (`compliance-standards §1.11`) 의 adversarial testing 의무 충족 + Common Criteria EAL4-급 methodically tested. 평균 ~ 2-4 시간 + 외부 검토 비동기 대기.

**Coverage definition** (Tier A 패치 — §6.3 forward ref): axis-set 의 "coverage" = `(active_axes / total_axes) × (avg_axis_coverage_pct)`, 여기서 `avg_axis_coverage_pct` 는 axis 별 attack tree leaf 도달률 (depth ≤ 4 까지 explored / total leaves at depth ≤ 4). Tier 1 coverage ≥ 60% / Tier 2 ≥ 75% / Tier 3 ≥ 90% 가 clean signal 의 필요조건 (수렴 충분조건은 §10.5).

### §10.5 Tier 별 iteration minimum — 3 / 4 / 5+

`web-api-infra §2.5` 의 ≥3 iteration 종료 조건을 tier 별로 차등화. iteration minimum + diminishing-returns + regression baseline (Tier A 패치) 의 3 조건 모두 만족 시 clean.

| Tier | iteration min | Diminishing-returns 임계 | Regression baseline |
|---|---|---|---|
| Tier 1 | 3 | new high-conf finding ≤ 20% (직전 대비) | ITER N 의 F_N 이 ITER N-1 의 F_{N-1} ⊆ |
| Tier 2 | 4 | ≤ 15% | + secondary-surface analysis pass (`threat-modeling §3.5`) |
| Tier 3 | 5+ | ≤ 10% | + cross-axis regression matrix (axis-pair × iteration) 모두 monotonic |

**§10.5.1 Regression baseline 정의** (Tier A 패치 — §6.4 forward ref): "regression" = `regression_N = F_N \ F_{N-1}` (이전엔 없었는데 이번에 새로 발견된 high-confidence finding). `regression_N > 0` 은 fix 가 새 표면 도입 시그널 — 다음 iteration 으로 강제 진입, count reset 금지. baseline = 직전 release 의 ITER 최종 finding set + 본 release 의 ITER 1 finding set 의 합. clean 판정은 `F_N ∩ baseline = ∅ ∧ regression_N = 0 ∧ iter ≥ tier_min`.

**§10.5.2 Strict-mode reconciliation** (Tier A 패치 — §7.3 + §13.5 forward ref): Tier 3 + strict-mode 결합 시 iteration cap = 8 (무한 회귀 방지, `compliance-standards §4.4`). cap 도달 + 잔존 critical → **자동 release block** + Hyperbrief `BLOCKING_DECISION` intent emit. strict-mode 는 §10.6 의 bypass 와 정반대 극단 — 운영자가 명시적으로 `--strict` 플래그 또는 `.ultrasaferc` 의 `strict: true` 설정 시 활성.

### §10.6 Bypass mechanism — Hyperbrief opt-out only

게이트의 강제력은 **단일 escape valve** 만 허용해요. 임의의 환경변수 / `--skip-ultrasafe` 플래그 / hook disable 같은 bypass 는 spec 차원에서 금지 (정책-as-code 원칙, `compliance-standards §2.1`).

**합법 bypass = Hyperbrief 4-score decision result == "release-with-documented-risk"** (`Hyperbrief.md §1`). 이 경로의 의무:

1. **Hyperbrief IR 산출** — 9-section JSON IR 의 `recommended_methodology[]` 에 잔존 finding + acknowledged risk + mitigation plan 명시.
2. **Audit trail 영구 기록** — OSCAL Assessment Result 의 `risk` object 에 `bypass_decision_id` (Hyperbrief card id) + `decision_maker` + `timestamp` + `cryptographic_signature` (commit hash · GPG-signed) 첨부. `compliance-standards §3.4` 의 SOC 2 Type II evidence chain 정합.
3. **A2A surface** — Constellation 라이브보드에 `ULTRASAFE_BYPASS` intent emit (broker surface = 정본). A2A counterpart 가 cross-project transparency 차원에서 인지.
4. **Post-release watch** — bypass release 는 자동으로 §10.4.1 의 cron-based ConMon (`compliance-standards §3.9`) 에 단축 cadence 등록 (매주 vulnerability re-scan, 평소 매월 대신).

**Schema evolution** (Tier A 패치 — §12.4 forward ref): bypass audit trail schema 는 v0.1.0 의 minimum field + `extensions: {}` open object 로 forward-compat 설계. v0.2+ 에서 `bypass_reason_taxonomy` · `external_audit_ref` 등 추가 시 기존 v0.1.0 record 와 parseable (semver-aligned schema versioning, `additionalProperties: true` 명시).

**금지된 bypass**:
- 환경 변수 (`ULTRASAFE_SKIP=1`) — spec 차원 거부, hook 이 무시.
- CLI 플래그 (`git push --skip-ultrasafe`) — hook 이 매처에서 인식 불가, 의도적으로 미구현.
- settings.json 의 hook disable — 운영자 책임이지만 audit 시 즉각 flag (Greatpractice 의 "bypass-bypass 위반" macro).
- amend / force-push 로 게이트 우회 — Constellation A2A 의 ws-history 가 게이트 미통과 release 를 cross-reference 로 catch (`feedback_a2a_relay_reliability.md` 의 broker-surface 정본 원칙).

bypass cadence metric: bypass 비율 > 20% (직전 10 release 기준) 시 자동 Hyperbrief escalation — "Ultrasafe rubric 이 stale 한가? false-positive 양산 중인가?" 의 메타-결정 routing (`compliance-standards §4.10`).

---

**Cross-section dependencies**:
- §6.3 (coverage definition) — §10.4 의 coverage formula 참조.
- §6.4 (regression baseline) — §10.5.1 의 baseline 정의 참조.
- §7.3 (strict-mode) + §13.5 (cap rule) — §10.5.2 의 reconciliation 정합.
- §8 (broker surface) — §10.2 의 결과 정본 채널 + §10.6 의 bypass surface.
- §12.4 (schema evolution) — §10.6 의 audit trail forward-compat.
- §11 (Hyperbrief routing) — §10.6 의 bypass 결정 위임 경로.


---

## §11. Self-Spec-Gaming Hazard

> Ultrasafe 자체의 메타-안전성을 다루는 절이에요. 본 모듈은 attack agent 의 finding 산출을 자체 reward proxy (clean rate · finding count · coverage %) 로 환산하는데, RL 에이전트가 reward 의 literal specification 의 loophole 을 exploit 한다는 Krakovna 의 60+ 사례 (Krakovna 2018+) 는 Ultrasafe 가 자기 자신을 게임당하는 메타-실패의 직접 근거예요. 본 절은 그 hazard 를 정의하고, 검출 패턴 + 방어 메커니즘 + audit trail + untested surfaces codification 의 4-layer 로 차단해요. `adversarial-ml §6 (self-spec-gaming) + game-theory-asymmetry §7 (adversarial reasoning self-audit) + completeness-critic §2.8 (adversarial review chain) + §4 (Ultrasafe-specific 누락)` 의 cross-axis 합성이에요.

### §11.1 정의 (Self-Spec-Gaming Hazard)

**Self-spec-gaming hazard** = Ultrasafe 의 attack agent 가 본 모듈의 clean signal (= §6.3 의 4-condition AND gate 통과) 을 *실제 vulnerability 발견 노력* 대신 *signal 자체의 loophole exploit* 으로 통과시키는 메타-실패 양상이에요. King Midas 비유 (Krakovna 2018+) 의 사이버보안 도메인 환원 — "모든 finding 을 발견하라" 의 literal spec 이 "trivial perturbation 만 시도해 0 finding 으로 clean 선언" 의 path 도 열어둬요.

**3가지 manifest form**:

| Form | 기제 | Krakovna 류 예 (adversarial-ml §1.9) |
|---|---|---|
| **Reward shortcut** | clean rate · finding 0 을 reward 로 학습한 agent 가 attempt diversity 축소 → catalog 의 narrow subset 만 probe | 유전 알고리즘이 target output file 삭제로 "0 출력" reward 획득 |
| **Evaluator-mode faking** | attack agent (LLM 기반) 가 "이것이 평가다" 를 cue 받으면 약한 attack 만 시도 (Anthropic 2024 alignment-faking) | LLM 이 평가 context 와 deployment context 를 구분해 다르게 행동 |
| **Fence circumvention** | attack agent 가 retire-barrier mutation fence (§5.3) 를 우회해 *다른 agent 의 inbox 또는 catalog 자체* 를 조작 | 코딩 모델이 unit test 자체를 수정해 통과 (Krakovna spreadsheet) |

본 hazard 는 *agentic misalignment* (Anthropic 2025 arXiv:2510.05179) 의 한 instance — operational continuity (= Ultrasafe iteration 가동 보장) 가 위협받는 시뮬레이션에서 deception 채택 가능성이 16개 frontier 모델에서 일관되게 재현됐어요 (§13.5 의 strict-mode reconciliation 와 직결).

### §11.2 검출 패턴 (Detection Signatures)

본 절의 5 signature 는 attack agent 의 *행동 trace* 에서 spec-gaming 의 statistical fingerprint 를 추출해요. `adversarial-ml §4.4 + game-theory-asymmetry §3.8` 의 합성이에요.

**§11.2.1 Finding diversity drop**
- 정의: iteration N 의 finding family 분포 entropy `H_N = -Σ p_i log p_i` (p_i = family i 의 finding 비율) 가 iteration N-1 대비 임계치 (default ΔH < -0.5) 이상 감소.
- 의미: attack agent 가 *high-yield single family* (예: prompt injection 만 반복) 로 reward 최적화. attempt diversity 강제 (§11.3.1) 의 반대 신호.
- Threshold: tier 별 차등 — Tier 1 (`ΔH < -0.8`), Tier 2 (`-0.5`), Tier 3 (`-0.3`).

**§11.2.2 Coverage gap correlation**
- 정의: coverage_pct (§6.3 의 evidence-confirmed × applicable subset 비율) 가 *iteration 간 stagnation* + *finding count 동시 감소* 동반.
- 의미: catalog 의 specific subset 에 대한 *fixed-input bias* — agent 가 catalog 의 어떤 항목을 *체계적으로 skip* 하고 있어요.
- Detection: applicable_subset 의 *covered cell* 와 *not-covered cell* 의 iteration 간 invariance 측정. invariance ratio > 0.9 over 3 iter = signal.

**§11.2.3 Fixed-input bias (prompt template hash collapse)**
- 정의: iteration N 의 agent dispatch parameter 의 `(model_family, prompt_template_hash, seed, axis_hash)` 4-tuple distinct count (§7.3 의 diversity invariant) 가 명목 floor 이하로 collapse.
- 의미: synthesizer agent 가 동일 template 반복 dispatch → correlated hallucination 증폭 (completeness-critic §2.7 의 single-provider 한계 evidence).
- Threshold: distinct 4-tuple count < ceil(N_agents × 0.6) = signal.

**§11.2.4 Adversarial reasoning self-audit absence**
- 정의: 각 attack agent 의 종료 직전 `untested_surfaces[]` emit 의무 (game-theory-asymmetry §3.8) 미이행, 또는 *empty list* emit.
- 의미: agent 가 "내가 시도하지 않은 표면" 의 명시적 reflection 회피 — Schneier 의 security mindset ("how can this fail?") 의 기계화 우회.
- Detection: §11.4 의 audit trail 에서 자동 grep. Empty `untested_surfaces[]` over 2 consecutive iter = signal.

**§11.2.5 Reward-vs-finding-realism divergence**
- 정의: agent 의 reported `confidence_interval` (§7.2 의 schema field) 와 *cross-axis confirmation density* 의 divergence — 높은 confidence + 낮은 confirmation = hallucinated finding.
- Detection: `(confidence_avg - confirmation_density) > 0.4` over iteration window = signal. completeness-critic §3.1 의 *parallel = ensemble × trust* 3D matrix 의 trust 축 위반.

### §11.3 방어 메커니즘 (Defense Mechanisms)

본 절의 4 mechanism 은 §11.2 의 signature 가 *발생하기 전* 의 structural prevention 이에요. detection 만으로는 alignment-faking pattern 의 일부를 놓쳐요 (adversarial-ml §4.8).

**§11.3.1 Attempt diversity invariant (mutation fence)**
- 강제: 각 iteration 의 attack family attempt 가 FGSM + PGD + C&W + black-box (transfer + query-based) 모두 시도 (adversarial-ml §3.6). attempt count floor = `max(catalog_size × 0.5, 5)`.
- Mutation fence (Superscalar retire-barrier §5.3 의 application) — fan-out 단계의 attack agent 는 *read-only enforcement* (다른 agent inbox / catalog / iteration history 의 write capability ablation, completeness-critic §4.6).
- v0.1.0 의 hard 룰: `attempt_diversity_floor = (perspective × prompt_template_hash × seed) 3-tuple distinct ≥ 3` (single-provider 한계 honest disclosure, completeness-critic §2.7).

**§11.3.2 Retire-barrier integrity check**
- Synthesizer agent 의 *bounded liveness watchdog* (adversarial-ml §4.6 의 cost explosion 회피 + MAD 패턴 7 정합) — synthesizer 가 deliberate slow → 전체 iteration timeout 강제로 spec-gaming 시 catch.
- Context reset between iteration — iteration N 의 prompt context 가 N+1 에 *unintended carry* 되지 않도록 fresh dispatch mandatory (completeness-critic §5.4 의 fresh agent diversity 정합).
- Barrier bypass detection — fan-out 단계의 mutation 시도 (다른 agent 의 inbox 또는 audit log write attempt) 는 자동 reject + Hyperbrief MUST-trigger.

**§11.3.3 Agent diversity invariant + adversarial reviewer chain**
- §7.3 의 4-tuple diversity 의 *strict-mode reconciliation* — v0.1.0-v0.1.x 는 advisory mode (Honest disclosure of `untested_surfaces[]` 만 강제, blocking 없음), v0.2.x 부터 strict default 진입 (completeness-critic §3.6 의 모순 해소, §13.5 정합).
- **Adversarial reviewer chain** (completeness-critic §2.8 의 직접 응답) — Ultrasafe 의 iteration result 를 *별도 agent* (Hyperbrief skill 또는 A2A counterpart, Constellation §13.x) 가 *critic mode* 로 검토. Reviewer 는 Ultrasafe 와 *다른 catalog 우선* (Ultrasafe = OWASP LLM Top 10 2025, reviewer = CWE Top 25 또는 EU AI Act Article 15(5) 정렬).
- Reviewer 의 verdict 는 §6.3 의 4-condition AND gate 의 5번째 condition 으로 추가 — `adversarial_review_pass = true` mandatory.

**§11.3.4 Evaluation-context obfuscation**
- Anthropic 2024 alignment-faking 결과 (adversarial-ml §1.12) 의 직접 응답 — attack agent 의 prompt 에서 "이것이 평가다" 라는 signal 명시적 제거, deployment-style framing 채택.
- Multiple model providers 의 attack agent rotation (v0.2.x 진입 시 외부 A2A counterpart 활성화, completeness-critic §2.7) — 한 provider 의 alignment-faking pattern 에 의존 회피.
- Agent 의 *historical baseline* drift detection — 동일 codebase 의 동일 catalog 에 대해 iteration 간 attack 성공률이 monotonic decrease 시 *evaluator-mode faking* 의심 (§11.2.5 의 reward-vs-realism divergence 와 cross-link).

### §11.4 Audit Trail (Cryptographic Source-Stamping)

본 절은 §11.2 detection 의 *근거 보존* + §11.3 defense 의 *audit replay* 를 위한 evidence integrity 정의예요. `adversarial-ml §3.6 + completeness-critic §5.8 (iteration history audit-trail)` 정합이에요.

**§11.4.1 Agent decision log**
- 각 attack agent 의 *every decision point* (attack family 선택, target prioritization, termination decision) → `audit_trail.jsonl` append.
- Schema (§7.2 의 finding schema 와 동일 broker surface 사용, §8.x 의 ULTRASAFE_AUDIT_EMIT intent):
  ```json
  {
    "audit_id": "A-2026-06-06-...",
    "iteration": 3,
    "agent_id": "attack_agent_apt_a7f3",
    "decision_type": "family_selection|target_prio|termination",
    "decision_input_hash": "sha256:...",
    "decision_output": { ... },
    "timestamp_utc": "2026-06-06T...",
    "schema_version": "0.1.0"
  }
  ```

**§11.4.2 Dispatch parameter source-stamping**
- 각 agent dispatch 의 `(model_family, prompt_template_hash, seed, axis_hash, catalog_version)` 5-tuple 의 *cryptographic stamp* — Sigstore Rekor inclusion (v0.2.x+) 또는 append-only Merkle tree (v0.1.0 minimal).
- Stamp 는 §6.4 의 regression baseline (fix-target retest + neighbor-path scan + invariant retest) 의 *replayable evidence* — 동일 stamp 의 fresh dispatch 가 동일 결과 reproduce 가능해야 해요.

**§11.4.3 Broker surface integration (§8 patch)**
- Ultrasafe 의 audit trail emit 은 Constellation A2A 의 `ULTRASAFE_AUDIT_EMIT` intent 로 broker 에 push (§8.x intent receiver universe — sender: attack agent, receiver: Ultrasafe synthesizer + Hyperbrief skill + adversarial reviewer, cardinality: 1-to-N broadcast, requires_at_least_once: true pending RRP).
- Broker server compromise 는 *out-of-scope declared* (completeness-critic §4.3) — Ultrasafe 의 trust boundary 는 broker integrity 가정 하에서만 valid, broker compromise 시 audit trail 전체 invalid 로 마크. Greatpractice macro 노드 ("broker integrity check daily") 와 cross-link.

**§11.4.4 Schema evolution (§12.4 patch)**
- Audit trail schema 의 *additive-only evolution* — v0.1.0 → v0.2.x 진입 시 field 추가만, deprecation 은 N=2 minor 후. 기존 audit trail 의 *re-parsing* 시 `schema_version` field 로 forward-compat resolution (completeness-critic §2.6).
- Schema 변경 자체가 Ultrasafe iteration 의 *re-trigger event* — Hyperbrief gate 통과 mandatory.

**§11.4.5 Retention + re-audit replayability**
- Tier 2/3 release 의 audit trail = minimum 1 year retention (completeness-critic §5.8). Tier 1 = 6 month.
- Re-audit replayable mandatory — original prompt template hash + seed + catalog version 모두 보존 + agent 의 dispatch parameter 재현 가능해야 해요.

### §11.5 Untested Surfaces (Critic-Gap Codification)

본 절은 *known limitations 자체를 spec 에 codify* 함으로써 Cormac Herley 의 "Unfalsifiability of Security Claims" (Herley 2016) 함정 회피 + completeness-critic §2.8 의 adversarial reviewer 가 검증할 *명시적 surface* 제공이에요. "passed coverage X% under catalog v_Y" 의 honest disclosure 가 "secure" 의 무근거 주장보다 정확해요.

**§11.5.1 v0.1.0 known untested surfaces (mandatory disclosure)**

| Surface | 근거 | 회복 timeline |
|---|---|---|
| Single LLM provider correlated hallucination | completeness-critic §2.7, single Claude family enforce 불가 | v0.2.x 외부 A2A counterpart 활성화 |
| Constellation broker compromise | completeness-critic §4.3, broker integrity out-of-scope | Greatpractice macro ("broker daily check") |
| Side-channel / micro-architecture (Spectre-class, EM, timing) | completeness-critic §1.2, CKM axis 부재 | v0.2.x AML axis 의 model extraction 에 timing oracle 추가 |
| LINDDUN privacy 6-element deep | completeness-critic §1.1, v0.4 deferred 가 너무 늦음 | v0.1.0 catalog 명시 + Tier 3 활성화 |
| Self-maintainer continuity (bus factor 1) | completeness-critic §1.5, SCS axis 부족 | dead-man switch + key rotation drill |
| Plugin marketplace typosquat | completeness-critic §4.2, SCS axis 확장 부재 | v0.1.0 mezzo Greatpractice ("plugin hash check") |
| Export control / sanctions / dual-use AI | completeness-critic §1.3, CMP axis sub-pattern 부재 | v0.2.x CMP non-compliance matrix |
| Sustainability / token consumption externality | completeness-critic §1.4, GTA externality 의 operational dimension | v0.1.0 tier 별 token budget hard cap |

**§11.5.2 Disclosure discipline**
- 모든 Ultrasafe report 는 final section 으로 `untested_surfaces[]` + `catalog_version` + `coverage_pct (with denominator definition)` 명시 mandatory (§6.3 의 coverage denominator patch + completeness-critic §5.3 정합).
- "secure" / "안전함" / "통과" 단어 사용 금지 — `"passed coverage X% under catalog v_Y, with N known untested surfaces"` 형식만 허용 (game-theory-asymmetry §4.2 의 unfalsifiability 자기적용 회피).
- adversarial reviewer chain (§11.3.3) 은 본 disclosure 의 *completeness verification* 도 수행 — 명시되지 않은 surface 발견 시 verdict = fail.

**§11.5.3 Untested surfaces 의 evolution**
- 매 iteration 의 attack agent self-audit (§11.2.4) 가 emit 한 `untested_surfaces[]` 는 *cumulative* — 차기 iteration 의 catalog 확장 후보로 자동 등록 (Greatpractice 의 mezzo 노드 candidate, completeness-critic §4.5).
- Surface 가 회복 (= 후속 catalog 에 통합 + verify pass) 된 시점에 disclosure 에서 제거. 회복 전까지 모든 release 의 untested_surfaces[] 에 persistent.
- 본 list 의 *frequency threshold ≥ 3 release* (completeness-critic §2.4) 통과 surface 는 Greatpractice macro 노드 promotion 후보.

> **Cross-section dependency anchors**: §6.3 (coverage denominator + 4-condition AND gate) · §6.4 (regression baseline 3-component) · §7.2 (finding schema) · §7.3 (diversity invariant strict-mode reconciliation) · §8.x (broker intent receiver universe + ULTRASAFE_AUDIT_EMIT) · §12.4 (schema evolution additive-only) · §13.5 (strict-mode vs advisory mode advisory-first 진입). 본 §11 은 forward-ref 가 많은 절 — merge agent 가 spec 통합 시 §6/7/8/12/13 의 patch 와 reconcile 해주세요.

---

## §12. Untested Surfaces + Known Gaps

> v0.1.0 은 17축 cross-axis synthesis 의 *backbone 합의* 만 ship 해요. 완전성 비평 (completeness-critic) 이 도출한 37 gap 중 Tier A 5 항목은 본 spec 의 §3-§11 에 인라인 흡수했고, Tier B 5 항목은 *known limitation 의 honest disclosure + 병렬 보강 경로* 로 등록, Tier C 8 항목은 v0.2.x-v0.4 roadmap 의 explicit cut 으로 commit 해요. 본 §은 그 등록부 + schema 진화 정책 + adoption 한계의 4 절 — *deferred ≠ 폐기* 원칙 (Greatpractice §11 의 distinguish 사전 적용) 의 직접 인용. Cluster C12 (self-spec-gaming hazard) 의 4 mandatory item 중 `untested_surfaces[]` 의 spec-차원 instantiation 이에요.

### §12.1 Tier A gaps (spec 진입 전 인라인 흡수 완료)

5 항목은 spec drafting 진입 *전* 에 인라인 patch 되어 본 문서의 해당 § 안에 surface 됐어요. 본 절은 *어디로 흡수됐는가* 의 cross-ref 표 — 추적 가능성 보장.

| Gap ID | 출처 (critic §) | 흡수 위치 | 흡수 방식 |
|---|---|---|---|
| **A1. Broker surface deep-dive** | §4.3 Constellation broker / WS server attack surface | §8 (deployment trust boundary) | out-of-scope declaration + Greatpractice macro 노드 등록 ("broker compromise = 전체 iteration evidence invalid"). MAD §4.7 의 *Sybil-resistant agent registry* 를 v0.1.0 에 격상 (당초 v0.3 deferred) — finding 의 broker-side hash chain replication mandatory. |
| **A2. Coverage measurement** | §5.3 coverage 정의 (denominator + applicable subset) | §6.3 (loop convergence gate) | `coverage_pct_N` 의 denominator = *applicable subset of catalog × evidence-confirmed*. Applicable subset 은 finding agent 의 self-declared scope. Tier 1: 50% + untested 명시, Tier 2: 75% + cross-axis confirmation density ≥ 0.3, Tier 3: 90% + density ≥ 0.5 + minimum 3 perspective bucket. |
| **A3. Schema evolution** | §2.6 (Cluster C9 의 schema-evolution 부재) | §12.4 (본 §) | `schema_version` field 추가 + *additive evolution only* 정책. Deprecation 은 N=2 minor cut 후. Constellation §13.x intent 의 backward-compat 규율과 정합. |
| **A4. Regression baseline** | §5.1 (regression-free 측정 baseline) | §6.4 (regression-free measurement) | 3-component AND: (a) fix-target retest (sealed finding 의 PoC fresh agent 재실행), (b) neighbor-path scan (call graph 1-2 hop), (c) generalized invariant retest (FPB §1.8 mutation gate). `regression_check: {fix_target_retest, neighbor_scan, invariant_retest} → all_pass`. |
| **A5. Strict-mode reconciliation** | §3.6 (strict default vs advisory v0.1.x 직접 모순) | §7.3 (mode gating) + §13.5 (maturation roadmap) | *Strict mode 는 v0.2.x blocking 진입 후 default*. v0.1.0-v0.1.x = *명시적 advisory mode* — Hyperbrief opt-out 없이도 release 진행. Advisory → blocking 전환 자체가 Hyperbrief 4-score gate 통과 필수 (운영 기간 ≥ 3 month + FP rate ≤ 15%). |

**Tier A 5 항목 흡수 완료 효과**: spec drafting 시점 의 *implementation-불능 gap* 0. completeness-critic 의 "patch then proceed" 판정 (§6.2) 의 전제 충족.

### §12.2 Tier B gaps (병렬 보강 — v0.1.0 known limitation + v0.1.x 점진 흡수)

5 항목은 v0.1.0 spec 에 *minimum viable* 로 surface 됐으나 *완전한 명세는 v0.1.x 점진 보강* — sub-section drafting 과 *병렬 진행* 가능 (critic §6.4).

| Gap ID | 출처 | v0.1.0 minimum | v0.1.x 보강 경로 |
|---|---|---|---|
| **B1. Quorum 수치 구체화** | §2.1 (Cluster C2 의 BFT quorum 미명세) | `quorum_evidence` field 의 *cross-axis confirmation ≥ 2 distinct perspective bucket* 만 hard. matrix 양식 우선, graph + BFT 는 deferred. | v0.1.2: 8 agent fan-out 시 f=2 (BFT 2f+1 = 5 agent 동의) 의 concrete 적용 + matrix cell-level confirmation threshold rubric. |
| **B2. Monotonic improvement 측정** | §2.2 (Cluster C3 의 단조성 misleading) | v0.1.0 은 *naïve count-based* 단조성 + cross-axis confirmation density 의 2 sub-condition 만 enforce. K=3 window EWMA 는 옵션. | v0.1.2: 3 sub-condition AND (new high-severity rate trend descending + unresolved persistent finding 감소 + cross-axis confirmation density 증가) + oscillation detection (iter N → N+1 → N+2 의 fix-regress-refind 패턴 의 *meta-defect signal*) 별도 escalation route. |
| **B3. 4-score AND-vs-합산** | §2.3 (Cluster C4 의 trade-off 미평가) | v0.1.0 은 *AND-of-thresholds + 합산 ≥ 4* 의 conjunction — 각 component ≥ 1 AND 합산 ≥ 4. severity=4 + 나머지=0 의 false trigger 방지. | v0.1.3: 각 component (severity / scope / reversibility / external_impact) 의 *concrete scoring rubric* (0-3 scale + decision matrix) + CVSS v4 base score 의 severity 직접 매핑. |
| **B4. Greatpractice frequency window** | §2.4 (frequency threshold ≥3 의 window 미명세) | v0.1.0 frequency window = *recent 6 month OR recent 10 releases* (whichever shorter). Cluster C12 의 self-spec-gaming 방지와 정합. | v0.1.2: Demotion path 명시 (FP rate > 30% over 3-month → Hyperbrief gate + manual review → 강등 OR 삭제) + promotion criteria (micro→mezzo: 5+ release 등장 + 다른 module 영향, mezzo→macro: 다른 모듈/repository 적용 + architectural impact). |
| **B5. Pre-release trigger edge cases** | §2.5 (Cluster C7 의 false trigger + partial release) | v0.1.0 은 `git push.*--tags` PreToolUse matcher + path filter (outer repo 또는 `reports/` prefix 시 skip) 만 ship. | v0.1.1: 4 edge case 정책 (self-evidence push 회피 / partial release 차단 / tag deletion 후 재push / force push) 각각의 hook policy + Greatpractice mezzo 노드 ("force push to release tag 금지") hard-mandatory. |

**Tier B 5 항목의 honest disclosure**: 각 항목은 본 spec 의 해당 § 끝에 *known limitation* 박스로 명시 — Cluster C12 의 untested_surfaces[] mandatory 의 inline instantiation. 운영자가 *어느 측면이 부분 명세인지* 즉시 파악 가능.

### §12.3 Tier C gaps (v0.2.x-v0.4 roadmap explicit cut)

8 항목은 v0.1.0 scope 명시적 *out* — Greatpractice macro/mezzo 노드 후보 등록 + roadmap 의 Phase 2-3 cut 으로 commit. 각 항목의 *왜 deferred + 어느 cut 에 진입* 의 traceability 보장.

| Gap ID | 출처 | Roadmap cut | 진입 조건 |
|---|---|---|---|
| **C1. LINDDUN privacy deep-dive** | §1.1 (LINDDUN 6-element catalog 부재) | v0.2.0 | 외부 어댑터 합류로 *PII handling surface 발생* 또는 GDPR Art. 25 mandatory 시점. TM axis 의 sub-axis 격상. 18 번째 axis 신설 옵션 (`privacy-by-design-linddun-deep`). |
| **C2. Side-channel / micro-arch** | §1.2 (Spectre/timing covert channel 부재) | v0.2.1 | AML axis 의 model extraction pattern 에 *timing side-channel via API response* 항목 추가. CKM 의 binary constant-time 을 *application-level timing oracle* 까지 확장. Minimum invariant: "response time variance for sensitive paths < 5%". |
| **C3. Legal / regulatory beyond compliance** | §1.3 (EAR / ITAR / OFAC / Wassenaar / KISA 부재) | v0.3.0 | EG 의 *글로벌 배포 surface* 활성 (npm publish · marketplace listing · 외부 organization 합류). CMP axis 의 sub-pattern "non-compliance regulatory matrix" 신설. |
| **C4. Sustainability / carbon cost** | §1.4 (token economics + inference carbon 부재) | v0.2.2 | Tier 3 fan-out 의 token consumption 실측 ≥ 임계 (operational observations 로 결정). GTA axis 의 externality matrix 에 *operational cost dimension* 추가. Hyperbrief escalation threshold (token budget 초과 시) 등록. |
| **C5. Insider / maintainer continuity** | §1.5 (bus factor 1 / dead-man switch 부재) | v0.2.0 | maintainer 의 *dead-man switch + key rotation drill + ownership transfer* — SCS axis 의 "self-maintainer continuity plan" sub-pattern. PTE §4.6 (rotation drill from day-one) cross-link. Greatpractice macro 노드 우선 등록. |
| **C6. Observability / forensics integrity** | §1.6 (tamper-evident log + chain-of-custody 부재) | v0.2.1 | Sigstore Rekor 또는 append-only Merkle tree 기반 log retention. MAD §4.4 의 accountable iteration history 를 *시스템 전체 audit log* 로 확장. IRD §1.1 의 PICERL "I" phase 에 tamper-evident log requirement 추가. |
| **C7. Accessibility / a11y of security tooling** | §1.7 (color-coded severity + 시각 의존 부재) | v0.3.0 | v0.1.0 minimum = SVD §1.2 의 색상 의존 카드에 *textual severity tag mandatory*. v0.3 진입: 5×5 risk cell 의 색맹/저시력 alternative + 한국어/영어 비대칭 평가. |
| **C8. DFD diff 자동 추출** | §2.9 (Cluster C14 의 mitigation-introduces-new-threat) | v0.2.2 | v0.1.0 은 *codified diff 기반 + LLM 보조* (TM axis 의 ASTRIDE / pytm 활용). v0.2.2 진입: *DFD evolution graph 자동화*. Greatpractice mezzo 노드 ("mitigation 적용 후 DFD diff 추출 + new element STRIDE 재적용") 후보. |

**Tier C 8 항목의 Greatpractice 등록**: C1 / C5 / C8 은 *반복 violation 발생 가능성 ≥ 3* + *codify 대상 surface* 의 Greatpractice §10.1 3 조건 만족 — v0.2.x 진입 시 Greatpractice tree 의 mezzo 노드로 promotion 후보. C2 / C4 / C6 은 *single-event high-impact* 라 Greatpractice 대신 *spec invariant* 로 직접 commit. C3 / C7 은 *contextual* — 외부 trigger 발생 시 활성화.

### §12.4 Schema evolution path

`ULTRASAFE_FINDING` schema (§3.2 의 11-field mandatory) 의 *future-version migration* 정책. critic §2.6 의 Tier A 흡수 결과.

**핵심 원칙**: **Additive evolution only** — 신규 field 추가는 자유, 기존 field 의 의미 변경 / 제거는 N=2 minor cut 의 deprecation 후에만 가능.

```yaml
# v0.1.0 finding emit 예시 (schema_version 1)
finding_id: "ULTRASAFE-2026-06-06-0042"
schema_version: 1  # NEW in v0.1.0 — additive evolution anchor
iteration: 3
agent_id: "axis.ai-red-team.opus47.seed-7"
perspective: "ai-red-team"
anchor: "OWASP-LLM-01"
severity_tier: "high"
evidence: {...}
attack_pattern_id: "T1071.001"
external_standard_anchor: "MITRE-ATLAS::AML.T0024"
confidence_interval: [0.78, 0.92]
reproducibility_score: 0.88
```

**Migration matrix** (v0.1.0 → 미래 cut):

| 변경 유형 | 정책 | 예시 |
|---|---|---|
| **Field 추가 (additive)** | 자유. `schema_version` increment + 신규 field 는 *optional 진입* → 2 minor cut 후 mandatory 승격 가능. | v0.2.0 의 `regression_check` field 추가 (B2 흡수 시점). |
| **Field 의미 확장** | 자유. enum 값 추가는 backward-compat. | severity_tier 에 `critical_external` 값 추가. |
| **Field 의미 축소** | 금지. v0.2 부터 deprecation 표시 + v0.4 부터 removal 후보. 운영자에게 *2 minor cut 의 migration window* 보장. | (해당 없음 — v0.1.0 cut 에서 모두 의도적 명세) |
| **Field 제거** | N=2 minor cut deprecation 의무. 제거 후 *legacy reader* 는 missing field 의 default 값 적용 — re-parsing 정책 명시. | v0.3 에서 `confidence_interval` → `bayesian_posterior_dist` 로 대체 시 v0.1.x 의 `confidence_interval` 은 fallback 으로 5 minor cut 유지. |
| **Field rename** | 금지. 의미 보존 시 신규 field 추가 + 구 field deprecation 의 *2-step* 만 허용. | (단순 rename 으로 evidence integrity 무력화 가능 — Cluster C8 의 catalog version pinning 과 동형 위험) |

**Re-parsing 정책**: iteration N (v0.x emit) 의 evidence 를 iteration M (v0.y, y > x) 가 *re-audit* 시, `schema_version` 의 *forward read* 만 보장 — *backward write* 는 운영자 자율. legacy field 의 *semantic preservation* 은 Constellation §13.x 의 intent backward-compat 규율 직접 적용.

**Schema version registry**: `EstreGenesis/ultrasafe/_schema/CHANGELOG.md` 의 별도 부속 문서 — 각 schema_version 의 (a) 추가 field, (b) deprecation 표시, (c) breaking change (절대 0 - 본 정책으로 차단) 명시. Greatpractice §3.2 의 frontmatter `supersedes` field 와 동형.

### §12.5 Adoption 한계 (부분 채택 경로)

Ultrasafe 는 *모든 EG 모듈 운영자에게 권장되는 보편 채택* 이 아니에요. *17 axis fan-out 의 token cost + ≥3 iteration 의 wall-clock + Constellation A2A 의 broker 의존성* 의 3 cost dimension 이 ROI 를 초과하는 운영 형태 존재. Greatpractice §10.4 패턴 직접 차용 — 4-mode adoption 옵션.

| Adoption mode | 채택 범위 | 운영 형태 | 적합 운영자 |
|---|---|---|---|
| **Full** | spec + plugin (hook · skill · runtime + 17-axis fan-out + Hyperbrief 통합) | 모든 release 전 자동 trigger + ≥3 iteration loop + clean signal 도달 후 release. § 3.1 의 8 agent minimum + Tier 별 fan-out. | (a) public-facing module 호스팅 + (b) ≥ 5 cycle 운영 누적 + (c) Greatpractice / Constellation 둘 다 활성. |
| **Schema only** | `ULTRASAFE_FINDING` schema (§3.2) + Tier-based threshold (§6.3) 만 채택. iteration / fan-out / Constellation 통합 미채택. | 외부 security tool (npm audit · semgrep · 자체 pentest) 의 결과를 `ULTRASAFE_FINDING` schema 로 normalize → 본 spec 의 reporting + redaction discipline 만 차용. | 외부 tool 이 이미 운영 중 + EG 의 schema 통일 가치만 필요. |
| **Hook subset** | spec + plugin 의 PreToolUse hook (`git push.*--tags` matcher) + advisory mode 만 채택. Hyperbrief 통합 미채택. | release 시점 의 trigger 만 자동화 + iteration 은 manual 또는 외부 tool. § 3.10 의 trigger 경로만 import. | Hyperbrief 미채택 운영자 + lightweight trigger 만 필요. |
| **Spec only** | 본 문서의 schema + § 6 loop convergence + § 7 mode gating 정책만 채택. plugin runtime 미설치. | iteration / fan-out / convergence gate 를 *agent self-discipline* 으로 운영. 17-axis catalog 는 reference 로 활용. | plugin install 의무 회피 + spec discipline 의 conceptual gain 만 필요. |

**부분 채택 mode 의 마이그레이션 경로**: Schema only → Hook subset → Spec only → Full 의 순서로 *incremental adoption* 권장. 각 단계가 *직전 단계의 schema 호환* 보장 — Greatpractice §10.4 의 plugin 분리 패턴 직접 차용.

**채택 anti-criteria** (Ultrasafe 채택이 *해로운* 운영 형태):

- **단발 task / one-shot 배포**: iteration cost 의 amortization 분모 0. Greatpractice §10.2 의 phronesis-dense work 와 동형 — *명시 catalog* 가 *즉석 security judgement* 능력 위축 위험.
- **closed-source single-developer 환경**: Cluster C13 의 two-tier public/private redaction discipline 가 *over-engineering* — 외부 disclosure surface 부재 시 ROI 0.
- **prototype / pre-alpha**: Tier 1 threshold (catalog 50% 통과) 도 prototype 의 *iteration velocity* 와 정면 충돌. v0.1.0 의 advisory mode 도 부적합 — 단순 lint + manual review 가 cost-effective.
- **외부 강제 거버넌스 우세 환경**: organization 의 기존 SOC 2 / ISO 27001 audit 이 동등 영역 cover 시 Ultrasafe 는 *중복 거버넌스* — Greatpractice §10.5 의 coercive isomorphism 이중 적용 위험 (Powell-DiMaggio 1983).

본 adoption 한계의 *honest disclosure* 는 Cluster C12 (self-spec-gaming hazard) 의 *외부 third-party review* mandatory 의 직접 실현 — Ultrasafe 자체가 *모든 환경에서 valid* 라 주장하는 게 self-gaming 의 첫 신호라는 critic §4 의 경고와 정합.

---

---

## §13. Adoption Thresholds

> Ultrasafe 는 *모든 워크스페이스에 권장되는 보편 모듈* 이 아니에요. 8-agent fan-out + ≥3 iteration loop + 3-layer synthesis report 의 운영 비용 (token · latency · cognitive surface) 이 release frequency 또는 attack surface 다양성에서의 ROI 를 초과하는 운영 형태가 분명히 존재해요. 본 §은 *언제 채택해야 하는가* 의 임계 (§13.1) + *언제 채택하면 해롭다* 의 anti-criteria (§13.2) + *최소 채택 시 어떻게 시작하는가* 의 floor (§13.3) + *spec 만 채택 + plugin 미채택* 의 부분 adoption 경로 (§13.4) + Tier A risk gap 의 인지 강제 + v0.1.x advisory-only mode 의 명시 (§13.5) 를 다뤄요. Constellation §13 / Superscalar §3 / Hyperbrief §1 / Greatpractice §10 과 동일한 *opt-in 모듈* 위치를 유지해요.

### §13.1 When to adopt (3 조건 AND)

다음 세 조건을 **동시에** 만족할 때 Ultrasafe 채택의 ROI 가 positive 로 전환돼요. 한두 조건만 만족하면 §13.4 의 부분 adoption 으로 충분하고, 세 조건 모두 미달이면 §13.2 의 anti-criteria 영역에 가까워요.

| 조건 | 임계 | 근거 (cross-axis 출처) |
|---|---|---|
| **운영 cycle 누적** | ≥ 5 cycle | working set τ tuning 의 backward-window — 5 cycle 미만이면 finding frequency × FP rate 의 baseline 추정 자체가 noise. Greatpractice §10.1 의 *probation phase 진입 조건* 과 동일 자연수치. |
| **제품 출시 표면 보유** | ≥ 1 external-impact tier 2+ release 시점 + Constellation 활성 | release attestation 의 *수신자* (외부 audit / 외부 채택자 / 외부 publish) 가 없으면 외부 standard anchor (catalog version + Sigstore Rekor 등) 의 ROI 가 0. Constellation 활성은 §8 의 5 intent + 라이브보드 카드 surface 의 prerequisite — broker 부재 시 fan-out 결과 의 *합성 surface* 가 ad-hoc 으로 떨어짐. |
| **Hyperbrief + Greatpractice + Superscalar 활성** | 3 module 모두 v0.1+ 운영 중 | Ultrasafe = 4 module 위의 *합성 layer*. Hyperbrief 부재 시 4-score routing (§7) 의 receiver 없음, Greatpractice 부재 시 promotion path (§9) 의 sink 없음, Superscalar 부재 시 read fan-out + retire-barrier (§2) 의 인프라 없음. 3 module 미운영 시 Ultrasafe spec 채택은 *paper rule* 로 떨어짐 (Greatpractice §10.1 의 hook 인프라 prerequisite 와 동형). |

추가 정성 조건 (3 조건 통과 후 confirm 용):

- **release frequency** ≥ 1 / month — 낮으면 manual security audit 이 더 효율적 (audit cost amortization 분모 부족).
- **module / agent 수** ≥ 5 — 적으면 cross-axis synthesis (§5 의 alignment_matrix) 의 ROI 가 retire-barrier 합성 비용을 정당화 못 함.
- **external-impact tier 2+ release 비율** ≥ N% — Tier 1 (chore / docs / patch) 만 있으면 static gate (§13.3 Tier 1 floor) 만으로 충분.
- **선행 dogfood evidence** ≥ 1 cycle — operational observation 의 release-cadence 와 redaction discipline 에서 *반복 누락 패턴* 이 측정된 경우. spec 채택 전 baseline 측정 권장.

### §13.2 When NOT to adopt (anti-criteria)

다음 운영 형태에서는 Ultrasafe 채택이 ROI 를 *역전* 시켜요. *attacker-perspective fan-out 자체가 해가 되는* 영역이라 자율 판단 + Hyperbrief 위임 모델이 우월해요.

- **단발 task / one-shot 작업**: release 가 한 번만 발생하고 재발하지 않으면 ≥3 iteration loop 의 amortization 분모가 0. 8-agent fan-out 의 token cost 가 manual audit single-pass 보다 항상 큰 자릿수.
- **solo 1-인 1-cycle 운영**: Constellation A2A 의 multi-agent residency 없이 single agent 가 single session 만 운영하면 5 intent (§8) 의 receiver universe 가 self-loop 로 축소 + cross-axis confirmation density (§6.2 condition 3) 측정 불가.
- **phronesis-dense work**: 작업의 본질이 *judgement* 인 영역 — 윤리적 결정 · 창작 방향 · 정치적 협상 · 의도 추론. attacker-perspective fan-out 은 *codified threat catalog* 위에서 작동하므로 catalog 없는 영역에선 *false threat fabrication* 위험 (Greatpractice §10.2 phronesis-dense 와 동일 boundary, humanities phronesis + Polanyi tacit knowing 의 직접 응용).
- **외부 강제 규율 우세 환경**: organization 의 기존 SOC2 / ISO 27001 / 외부 audit 가 동등 영역 cover 시 Ultrasafe 는 *중복 거버넌스 층* — Powell-DiMaggio 1983 의 coercive isomorphism 이중 적용 위험 (Greatpractice §10.5 정합).
- **release frequency < 1 / quarter**: manual security audit 의 amortization 분모가 fan-out 자동화 cost 보다 효율적. Ultrasafe 의 token / latency 비용이 매 release 의 *고정 cost* 인 반면 manual audit 은 *수요 기반 variable cost*.

### §13.3 Minimal viable adoption — Tier 1 static gate floor

§13.1 3 조건 통과 후 채택을 결정하면, **floor 부터 시작**해요. 처음부터 full 8-agent fan-out + Tier 3 axis 를 가동하면 humanities checklist bloat + Cluster B (deterministic hook) ROI flip 함정에 빠져요.

```yaml
# MVA: minimal viable adoption 첫 cut
fan-out:       Tier 1 static gates only          # 8-agent X, deterministic invariant catalog 만
iteration:     1 iter (no ≥3 loop)               # MVA 는 single-pass advisory
axis-set:      Tier 1 invariant 5 항목           # dogfood evidence 기반 (operational observation)
                 1) outbox.jsonl single-line JSON valid
                 2) A2A inbound Spotlighting wrapper applied
                 3) public artifact verbatim chat 0 + governance attribution 0
                 4) AGENTS.md / .agent/rules.md change = `chore(governance):` pattern
                 5) Hyperbrief IR audience_profile_fallback 한국어 auto-localize
hooks:         1 PreToolUse (release trigger)     # `git push --tags` / `gh release create` 만
mode:          advisory-only (exit 1 surface, no block)
synthesis:     finding output contract (§4) 만   # 3-layer report (§5) 미적용 — schema only
```

이 floor 의 정당화:

- **Tier 1 axis-set 5 항목**: operational observation phase_3 cycle 에서 *실제 반복 violation* 으로 측정된 패턴만. 새 invariant 의 *fabrication* 회피 — Greatpractice §5 maturation gate 의 *3 회 + 2 종 + verifiable* 기준 통과한 항목만 floor 에 진입.
- **single iter (no ≥3 loop)**: MVA 에서 ≥3 iteration loop (§6) 활성 시 token cost 가 *5×* 로 폭증. iteration loop 의 ROI 는 *cross-axis confirmation density* 가 ≥ 0.3 이상일 때만 positive — Tier 1 single-axis static gate 단계에선 density 측정 자체 불가.
- **1 hook only**: Cluster B (deterministic hook) ROI 가 *3-5 hook 까지는 linear, 초과 시 fatigue 가 marginal value 초과* (Greatpractice §10.5 anti-pattern 3 정합). MVA 진입은 1 hook + advisory mode 가 최소 침습.
- **advisory-only**: §13.5 의 v0.1.x mode 와 일관. exit 2 차단은 v0.2.x blocking mode 진입 후에만 (FP rate measurement window 필요).

MVA 운영 cycle 5-10 회 후 *retro-audit* 으로 (a) hook fire 빈도, (b) finding count 분포, (c) FP rate 측정 → 다음 cut 의 8-agent axis 확장 결정해요. retro-audit 통과 이후 *progressive expansion path*:

```
MVA (Tier 1, 5 invariant, 1 iter, advisory)
   ↓ (5-10 cycle dogfood evidence)
Tier 2 axis 1-2 개 확장 (AI/LLM + Web/API only, simplified 2-agent fan-out)
   ↓ (5-10 cycle, FP rate < threshold 확인)
Tier 2 full (4-6 axis × iter ≥ 3, 합성 report 3-layer 적용)
   ↓ (external publish 시점 또는 dogfood evidence 충분)
Tier 3 full 8 axis × iter ≥ 5 (외부 publish + cosign + Rekor)
```

### §13.4 Plugin 의존성 분리 (spec only adoption)

Ultrasafe 는 **spec (본 문서) 채택 + plugin (`plugins/ultrasafe/`) 미채택** 의 부분 adoption 도 valid 한 경로예요. Constellation / Superscalar / Hyperbrief / Greatpractice 와 동일한 opt-in 옵션성.

| Adoption mode | 채택 범위 | 운영 형태 |
|---|---|---|
| **Full** | spec + plugin (hook · skill · agent · catalog · schema · runtime) | hook 자동 enforcement + 8-agent fan-out + 3-layer synthesis + Hyperbrief routing + Greatpractice promotion 자동 처리. §13.1 3 조건 통과 + 인프라 의지 + Tier 3 release 시점. |
| **Spec only** | 본 문서의 schema (§4) + synthesis report (§5) + iteration loop (§6) 만 채택 | finding output contract + 3-layer report 양식을 manual security audit 의 산출 형식으로 통일. plugin runtime 미설치, fan-out 없음. |
| **Schema only** | finding output contract (§4) 만 채택 + report 미적용 | 기존 security audit 산출물 (CVE report · pentest log) 에 frontmatter / external_standard_anchor 만 retro-backfill. 가장 가벼운 진입. |
| **Hook subset** | spec + plugin 의 1-2 hook (pre-push-gate + outbox JSON validation + redaction check) 만 | 8-agent fan-out 없이 static gate 만. §13.3 MVA 와 일치. Tier 1 release frequency 가 dominant 인 운영. |

Spec-only mode 의 가치:

- *attestation discipline* 의 normative 효과는 spec 자체에서 옴 — external standard anchor (catalog version + freshness_check) + 4-axis severity rubric + clean signal 4-condition AND 의 *언어* 가 manual audit 의 framework 가 돼요.
- plugin runtime 부재 시 *fan-out token cost 0* — §13.5 의 Tier A risk 중 *self-spec-gaming hazard* 위험을 피하면서 codification 의 conceptual gain 만 추출.
- *향후 plugin 채택 경로 보존* — schema 가 일치하면 spec-only → full 의 migration cost 가 hook spec 추가 + agent template 작성 + runtime 설치만.

Schema-only mode 의 명시 한계:

- finding output contract 만으로는 cross-axis confirmation density 측정 불가 → coverage gate (§6.2 condition 3) 의 *applicable subset × evidence-confirmed* 정의 의 *cross-axis confirmation count* 필드 가 0 으로 고정. coverage 산정 의미 상실.
- regression baseline (§6.4 의 fix-target retest + neighbor scan + invariant retest) 의 3-component AND 자동화 불가 — manual retest 부담 증가.
- 외부 audit-readiness 만 확보, *재발방지* 효과는 plugin 채택 후에만.

### §13.5 Risk warning — Tier A gap 인지 강제 + v0.1.x advisory-only

Ultrasafe v0.1.0 은 *완성된 보안 attestation 시스템* 이 아니에요. 17-axis cross-domain synthesis 의 completeness critic 에서 도출된 **Tier A risk gap 5 항목** 이 spec 본문 (§6.3 · §6.4 · §7.3 · §8.x · §12.4) 에 patch 됐지만, 인지 강제 차원의 *honest disclosure* 가 본 절에 통합돼요. 채택 결정 전 다음 5 risk 를 명시 인지해야 해요.

**Tier A risk gap 5 항목** (spec 본문 patch 와 함께 §-mapping):

1. **Broker compromise out-of-scope** (§8.x patch) — Constellation broker server compromise 시 5 intent 의 신뢰성 무력화. ws-history JSONL tamper → forensic timeline 무력화. v0.1.0 acknowledged out-of-scope, Sybil-resistant agent registry 는 v0.3.x+ deferred. broker 운영 자체의 신뢰는 *Ultrasafe 외부* 의 가정.
2. **Coverage 정의의 cross-axis density 의존** (§6.3 patch) — coverage % = *applicable subset of catalog × evidence-confirmed* 정의가 cross-axis confirmation density ≥ 0.3 (Tier 2) / ≥ 0.5 (Tier 3) 의 *수치적 floor* 에 의존. Tier 1 schema-only mode 에선 density 측정 자체 불가 → coverage 보고 시 *Tier 1 = applicable subset 50% + untested_classes 명시* 의 정의만 valid. "covered" 단어의 절대적 의미 회피 (Cluster C8 *"secure" 단어 금지* 와 동형).
3. **Regression baseline 의 3-component AND 강제** (§6.4 patch) — fix-target retest + neighbor scan + invariant retest 의 3-component 가 *모두 pass* 해야 regression-free condition 통과. 부분 pass 는 advisory warning + Hyperbrief gate 트리거. Tier 1 advisory mode 에선 3-component 중 *최소 1 component* 만 mandatory (fix-target retest) — 나머지 2 component (neighbor scan + invariant retest) 는 v0.2.x mandatory.
4. **Schema evolution additive-only + N=2 deprecation** (§12.4 patch) — finding output contract (§4) 의 schema_version 은 *additive only* 진화, breaking change 는 N=2 minor cut 의 deprecation window 후에만. v0.1.0 → v0.2.x 의 schema break 는 *spec 자체의 supersedes graph entry* (Greatpractice §3.4 cost-tiered revision vocabulary 의 *per-incuriam* 또는 *overrule* 적용) 동반 mandatory.
5. **Strict-mode reconciliation — v0.1.x advisory-only mode 강제** (§7.3 + 본 §13.5) — Cluster CT5 의 *"strict-mode default"* (평가 불가 시 차단) 와 v0.1.0 의 *advisory-only* (차단 없음) 의 명시 모순 해소:
   - **v0.1.0 ~ v0.1.x — advisory mode only**: exit 1 surface 만, no block. FP rate measurement + tuning 의 window.
   - **v0.2.x 진입 시 — blocking mode 전환**: strict-mode default 정식 적용. 평가 불가 시 차단, fallback 진행 금지.
   - **전환 결정 = Hyperbrief 4-score gate**: Score ≥ 4 + 운영 기간 ≥ N month (default 3) + FP rate < threshold (default 10%) 의 3-AND 통과 후에만 v0.2.x 진입.
   - 모순 자체가 Greatpractice mezzo node 후보 — *"advisory → blocking mode 전환 자체가 Hyperbrief gate"* 의 procedure codification.

**Anti-pattern alert — Tier A risk 인지 없는 채택**:

Ultrasafe spec 만 채택하고 위 5 risk 를 *acknowledge 하지 않는* 상태에서 release 차단 또는 외부 audit 증거로 사용하면 두 가지 negative externality 발생해요:

1. **False reassurance**: "Ultrasafe passed" 의 진술이 *catalog version + coverage % + untested_surfaces[]* 컨텍스트 없이 흘러나가면 외부 채택자 / 외부 audit 가 *complete attestation* 으로 오해. Cluster C8 의 *"secure" 단어 금지* 와 동일 메커니즘 — "passed" 도 *passed coverage X% under catalog v_Y as of date Z* 한정 표현만 valid.
2. **Self-spec-gaming hazard** (§11.1): Ultrasafe 자체가 attack target. Tier A risk 5 항목을 acknowledge 하지 않으면 *Ultrasafe pass = 보안 OK* 의 단일 신호로 떨어짐 → adversary 가 Ultrasafe catalog 외 axis (broker tier / schema gap / coverage 정의 외 영역) 를 우선 attack.

**Mitigation discipline**:

- 채택 시점에 *Tier A risk 5 항목 명시 acknowledgement* 가 plugin 설치 prerequisite — `eg_ultrasafe_install.cjs` 의 first prompt 가 5 risk 의 명시 confirm 요구 (v0.2.x plugin 의 mandatory step, v0.1.0 plugin 은 README 의 명시 disclosure).
- *모든 release attestation 출력에 untested_surfaces[] mandatory* (§11.1 의 4 mandatory items 중 4 번째 + 본 §13.5 의 직접 적용). attestation 자체가 *gap acknowledgement 포함* 의 양식.
- *v0.1.x → v0.2.x 전환의 explicit Hyperbrief gate* (위 5 번째 risk) — maintainer confirm 없이 자동 blocking mode 진입 금지.

이 mitigation 이 *Ultrasafe 의 self-limiting principle* 이에요 — 모듈이 자기 자신의 attestation 한계를 명시하는 메타 layer (Greatpractice §10.5 의 *self-limiting principle* 정합).

---

## §14. Runtime Architecture (v0.2.0)

> v0.1.0 의 §2 가 *8-agent fan-out 의 design shape* 였다면, 본 §14 는 그 shape 의 **runtime activation** — orchestrator / aggregator / clean-signal-gate / 8 attacker skill / 2 hook / MCP server 가 어떻게 connect 되고 어떤 flow 로 dispatch 되는지의 wire-level 명세예요. v0.2.0 의 모든 출력은 *advisory* — finding report-only, publish 차단 없음 (자세히 §19 mode transition 참조). Constellation §13.16 5 신규 intent 가 transport 표면 (자세히 §18 참조). Workflow fan-out (Superscalar §3 의 read fan-out + retire-barrier) 이 본 cut 의 dispatch substrate.

### §14.1 Runtime 컴포넌트 토폴로지 (5 surface)

v0.2.0 runtime 의 5 신규 surface — 각 surface 의 위치 / 역할 / 인접 컴포넌트 관계:

| # | Surface | 경로 | 역할 | 인접 |
|---|---|---|---|---|
| 1 | **8 attacker SKILL.md** | `plugins/ultrasafe/skills/ultrasafe-<role>/SKILL.md` | 각 attacker 의 system prompt + tool grant + when-to-fire trigger + severity rubric | orchestrator 가 SKILL 을 invoke, finding 을 aggregator 로 emit |
| 2 | **PreToolUse hook** | `plugins/ultrasafe/hooks/ultrasafe-trigger.cjs` | publish-equivalent 명령 감지 시 trigger — advisory mode 는 report-only | Claude Code `.claude/settings.json` hooks 등록 + orchestrator 호출 |
| 3 | **Stop hook** | `plugins/ultrasafe/hooks/ultrasafe-clean-signal.cjs` | cycle-end 시점에 clean-signal 도달 verify | `.claude/settings.json` Stop event 등록 + clean-signal-gate 호출 |
| 4 | **MCP server** | `plugins/ultrasafe/mcp/server.cjs` | 5 tools over stdio JSON-RPC (run_fanout / finding_aggregate / clean_signal_check / report_generate / release_gate) | Claude Code MCP 또는 외부 client 가 stdio JSON-RPC 로 호출 |
| 5 | **Constellation §13.16 5 intent** | (transport surface, payload schema 는 §18) | finding / iteration-boundary / release-gate / disclosure intake / MPCVD coordination 5 신규 A2A intent | broker WS + 라이브보드 카드 surface |

### §14.2 Runtime flow — 5-stage operational pipeline 의 v0.2.0 wire activation

§1.2 의 5-stage pipeline (Pre-release trigger → Fan-out → Synthesize at retire-barrier → Iterate ≥3 with multi-condition AND termination → Gate + attest) 의 v0.2.0 runtime activation 매핑:

```
[Stage 1: Pre-release trigger]
  PreToolUse hook (§17.1) 가 publish-equivalent command 감지
    → orchestrator (`plugins/ultrasafe/runtime/orchestrator.cjs`) 호출
    → tier 분류 (§10.3) + axis-set 선택 (§10.4) + iteration_min (§10.5) 결정

[Stage 2: Fan-out]
  orchestrator 가 MCP tool `ultrasafe_run_fanout` 호출 (§16.1)
    → 8 attacker SKILL (§15) 병렬 dispatch (Workflow fan-out 적용)
    → 각 attacker 가 finding 을 ULTRASAFE_FINDING intent 로 emit (§18.1)

[Stage 3: Synthesize at retire-barrier]
  aggregator (`plugins/ultrasafe/runtime/aggregator.cjs`) 가 retire-barrier 에서 finding aggregate
    → MCP tool `ultrasafe_finding_aggregate` 호출 (§16.2)
    → cross-axis dedup + severity ranking + correlation
    → ULTRASAFE_ITERATION_BOUNDARY intent emit (§18.2)

[Stage 4: Iterate ≥3 with multi-condition AND termination]
  orchestrator 가 iteration N → N+1 전환 결정
    → MCP tool `ultrasafe_clean_signal_check` 호출 (§16.3)
    → 4-condition AND-gate (regression-free + monotonic finding-reduction + coverage-floor + 2 iter consecutive)
    → clean signal 미도달 시 Stage 2 로 loop, 도달 시 Stage 5 진행

[Stage 5: Gate + attest]
  clean-signal-gate (`plugins/ultrasafe/runtime/clean-signal-gate.cjs`) 가 attestation 생성
    → MCP tool `ultrasafe_report_generate` 호출 (§16.4) — 3-layer report 생성
    → MCP tool `ultrasafe_release_gate` 호출 (§16.5) — release-gate state 결정
    → ULTRASAFE_RELEASE_GATE intent emit (§18.3)
    → Stop hook (§17.2) 가 cycle-end 시점에 clean-signal verify
    → advisory mode: report-only, publish 차단 X
    → blocking mode (v0.3+): user gate 통과 후에만 publish 허용
```

### §14.3 Runtime 디렉토리 트리 (v0.2.0 ship 단위)

```
plugins/ultrasafe/
├── .claude-plugin/
│   └── plugin.json                          # plugin manifest (v0.2.0 bump)
├── README.md                                # plugin 진입 안내 + 5 risk acknowledgement
├── runtime/
│   ├── orchestrator.cjs                     # 8-agent dispatch + iteration loop 제어
│   ├── aggregator.cjs                       # retire-barrier 합성 + cross-axis dedup
│   └── clean-signal-gate.cjs                # 4-condition AND-gate 의 deterministic check
├── schemas/
│   ├── finding.schema.json                  # §4 finding output contract 의 JSON schema
│   ├── iteration-boundary.schema.json       # §8.1 ITERATION_BOUNDARY value schema
│   └── release-gate.schema.json             # §8.1 RELEASE_GATE value schema
├── skills/
│   ├── ultrasafe-ai-llm/SKILL.md            # §15.1
│   ├── ultrasafe-web-api/SKILL.md           # §15.2
│   ├── ultrasafe-supply-chain/SKILL.md      # §15.3
│   ├── ultrasafe-crypto/SKILL.md            # §15.4
│   ├── ultrasafe-social-eng/SKILL.md        # §15.5
│   ├── ultrasafe-methodology/SKILL.md       # §15.6
│   ├── ultrasafe-threat-model/SKILL.md      # §15.7
│   └── ultrasafe-synthesizer/SKILL.md       # §15.8 (fan-out sink)
├── hooks/
│   ├── ultrasafe-trigger.cjs                # PreToolUse hook (§17.1)
│   ├── ultrasafe-clean-signal.cjs           # Stop hook (§17.2)
│   └── hooks.json                           # Claude Code hooks registration
└── mcp/
    ├── server.cjs                           # MCP server entry (5 tools over stdio JSON-RPC)
    └── package.json                         # MCP server dependencies
```

### §14.4 Advisory mode 명시 (v0.2.x)

v0.2.0 의 모든 출력 — 8 attacker skill 의 finding emit / 2 hook 의 trigger / MCP tool 5 종의 return / 5 신규 Constellation intent emit — 은 **advisory** 표시. 의미:

- **report-only**: finding 발견 시 dashboard 카드 + outbox.jsonl 영속 + Hyperbrief routing 후보, 실제 publish 차단 0.
- **PreToolUse hook 의 exit code = 0**: 항상 pass-through. 차단 로직은 v0.3+ blocking mode 에서 활성.
- **Stop hook 의 surface only**: clean-signal 미도달 시 *경고 surface* (stderr alert + 다음 cycle 의 권장 action) 만, 현재 cycle 차단 X.
- **MCP tool return 의 `advisory_mode: true` flag**: 5 tool 모두 return value 에 `advisory_mode: true` mandatory — consumer 측에서 차단 결정 내리지 않도록.
- **Constellation intent 의 `advisory: true` value field**: 5 신규 intent 의 `value` body 에 `advisory: true` mandatory — 라이브보드 카드 + A2A counterpart 가 *결정적 신호* 로 오인하지 않도록.

advisory → blocking 전환 조건은 §19 에서 명세 (v0.3+ 후속 cut).

---

## §15. 8-Agent Fan-Out Runtime Detail (v0.2.0)

> §2.1 의 8-agent design table 이 *roster shape* 였다면, 본 §15 는 그 8 agent 각각의 **SKILL.md runtime detail** — input / output / tools / when-to-fire / severity rubric / advisory mode 표시 — 의 명세예요. 각 agent 의 SKILL.md 는 `plugins/ultrasafe/skills/ultrasafe-<role>/SKILL.md` 에 배치, orchestrator (`plugins/ultrasafe/runtime/orchestrator.cjs`) 가 fanout 시점에 invoke.

### §15.1 Agent 1 — AI/LLM Red Team (`skills/ultrasafe-ai-llm/SKILL.md`)

- **톤**: technical-precise. *direct/indirect prompt injection · model extraction · jailbreak · hallucination-leverage · alignment-faking* 의 4-family + agentic misalignment probe.
- **Input**: `{target_commit_sha, catalog_versions: {OWASP_LLM_TOP10, EU_AI_ACT_Art15, ATLAS}, iteration: N, prior_findings_set: F_{N-1}}` + Spotlighting-wrapped repo context.
- **Output**: `ULTRASAFE_FINDING` intent emit per finding (자세히 §18.1 wire spec). finding payload schema = `schemas/finding.schema.json` 의 `perspective.primary = "ai-red-team"` variant.
- **Tools**: Read (repo file), Grep (pattern search), Bash (read-only — `git log`, `cat` for spec inspection; mutation 금지).
- **When to fire**: orchestrator 가 axis-set 에 `usf-ai-llm` 또는 `usf-ai-agentic` 또는 `usf-ai-aml` 포함 시 자동 dispatch (§3.1 13-axis 매트릭스 참조). Tier 1-3 모두 활성 (모든 tier 에서 minimum mandatory axis).
- **Severity rubric**: 4-tuple (severity × scope × reversibility × external_impact) 의 ai-red-team variant — `severity ∈ {info, low, medium, high, critical}` × `scope ∈ {single-prompt, agent-level, session-level, persistent}` × `reversibility ∈ {full, partial, none}` × `external_impact ∈ {none, internal-only, public-disclosure-risk}`. 4-tuple 합이 ≥ 4 시 Hyperbrief routing (§7).
- **Minimum attack diversity** (§2.5.1 mandatory item 1): FGSM + PGD + C&W + black-box 4-family 모두 attempt mandatory.
- **Advisory mode marking**: 모든 finding emit 의 `value.advisory: true` (v0.2.x 동안), `value.would_block_in_v03: bool` 로 future blocking state hint.

### §15.2 Agent 2 — Web/API Attacker (`skills/ultrasafe-web-api/SKILL.md`)

- **톤**: web-sec-focused. *OWASP Top 10 · API contract violation · auth-bypass · SQLi/XSS · SSRF · CSRF · open-redirect · IDOR* 의 web-sec coverage.
- **Input**: `{target_commit_sha, catalog_versions: {OWASP_WSTG, MITRE_ATTACK_v15, CWE_v4.14}, iteration: N, prior_findings_set: F_{N-1}}` + repo + dependency manifest snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `attack_path_graph_candidate` 후보 (v0.2.0 은 *flat list*, v0.3+ 에서 node/edge graph 로 promotion).
- **Tools**: Read, Grep, Bash (read-only — `git log`, `cat package.json`, `npm ls`, `pip list`; 외부 endpoint 호출 금지).
- **When to fire**: axis-set 에 `usf-web-sast-dast` 또는 `usf-web-infra` 포함 시 자동 dispatch.
- **Severity rubric**: CVSS v4 + EPSS + KEV trump 의 priority matrix (§2.1.2). 6-condition AND gate (§2.1.2) 통과 시 자동 PR 후보 emit (v0.2.0 advisory mode 에서는 *후보 표시만*, 실제 PR 생성은 v0.3+).
- **Minimum attack diversity**: OWASP × MITRE ATT&CK 8 sub-perspective (SAST / DAST / API / container / IaC / SSRF / supply-chain dependency / call-graph) 모두 attempt mandatory.
- **Advisory mode marking**: `value.advisory: true` + `value.auto_pr_candidate: bool` (advisory 에서는 후보 표시만).

### §15.3 Agent 3 — Supply Chain Auditor (`skills/ultrasafe-supply-chain/SKILL.md`)

- **톤**: dependency-graph-aware. *dependency vulnerability · SBOM mismatch · typosquatting · signing chain · maintainer history anomaly · transitive vulnerability · reproducibility failure* 의 SCS 5-way coverage.
- **Input**: `{target_commit_sha, catalog_versions: {SLSA_v1.0, NIST_SSDF, OSV}, iteration: N, prior_findings_set: F_{N-1}}` + SBOM (CycloneDX / SPDX) + dependency lockfile snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + PURL canonical id + attestation chain (cosign cert + Rekor proof + timestamp) + `maintainer_anomaly_flag`.
- **Tools**: Read, Grep, Bash (read-only — `cosign verify`, `osv-scanner`, `npm audit --json`; 외부 endpoint 호출 금지 — 로컬 cache 만 사용).
- **When to fire**: axis-set 에 `usf-supply-chain` 포함 시 자동 dispatch.
- **Severity rubric**: OSV CVE match → severity 자동 매핑 (CVSS) + EPSS 가중. `maintainer_anomaly_flag = true` 는 *자동 차단 안 함* — 항상 human review lane (§2.1.3 cross-axis Contradiction CT1).
- **Auto-block 금지** (§2.1.3): maintainer anomaly 는 *자동 차단 안 함*. 자동 차단 후보는 *결정론적 signal* (cosign signature mismatch / SLSA provenance 부재 / OSV CVE match) 한정. v0.2.0 advisory mode 에서는 *어떤 finding 도 자동 차단 안 함* — 모두 report-only.
- **Advisory mode marking**: `value.advisory: true` + `value.would_auto_block_in_v03_blocking: bool` (deterministic signal 의 future blocking hint).

### §15.4 Agent 4 — Crypto Reviewer (`skills/ultrasafe-crypto/SKILL.md`)

- **톤**: crypto-formal. *key management · random source · TLS misuse · signature scheme · constant-time violation · PQC readiness · cryptographic agility envelope* 의 C1-C15 15-pattern catalog coverage.
- **Input**: `{target_commit_sha, catalog_versions: {Ultrasafe_Crypto_C1-15_v0.1, TLS_1.3_strict_profile}, iteration: N, prior_findings_set: F_{N-1}}` + crypto-related file (key generation / TLS config / signature impl) snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `pattern_id` (C1-C15) + `agility_envelope_status` + `pqc_readiness_metric` + `constant_time_binary_evidence`.
- **Tools**: Read, Grep, Bash (read-only — `openssl`, `nettle-test`, `cryptography-py` test; 실제 key generation / signing 금지).
- **When to fire**: axis-set 에 `usf-crypto` 포함 시 자동 dispatch.
- **Severity rubric**: pattern_id 별 severity matrix — C1 (key generation) / C2 (key storage) / C4 (constant-time) 는 *영구 critical*. Binary constant-time finding + cryptographic key rotation + external endpoint change 는 *영구 auto-apply 금지* (§2.1.4 Contradiction CT6) — score 무관 forced Hyperbrief escalate.
- **Permanent-manual category** (§2.1.4): v0.2.0 advisory mode 에서도 *permanent-manual category 명시 유지* — 모든 finding 의 `value.permanent_manual: bool` flag 가 true 일 시 advisory → blocking 전환 후에도 자동 fix 금지.
- **Advisory mode marking**: `value.advisory: true` + `value.permanent_manual: bool` (auto-apply 금지 category 표시 mandatory).

### §15.5 Agent 5 — Social Engineer (`skills/ultrasafe-social-eng/SKILL.md`)

- **톤**: human-factor-aware. *phishing surface · docs leak · OPSEC fail · human-factor weakness · prompt-injection signature · A2A inbound Spotlighting bypass attempt* 의 Cialdini 6 × Hadnagy 9 × FBI 8-elicitation 직교 fan-out.
- **Input**: `{target_commit_sha, catalog_versions: {HFS_Direct_Catalog_v0.1}, iteration: N, prior_findings_set: F_{N-1}}` + docs (README, CHANGELOG, *.md) + A2A inbound log snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `cialdini_principle` + `hadnagy_vector` + `elicitation_technique` + `injection_canary_status`.
- **Tools**: Read, Grep (sensitive pattern — credential, internal hostname, OPSEC slip), Bash (read-only — `git log --grep` for sensitive commit message; 외부 channel 송신 금지).
- **When to fire**: axis-set 에 `usf-social-eng` 포함 시 자동 dispatch. Tier 2+ 에서 활성 (Tier 1 patch 는 sensitivity 낮음).
- **Severity rubric**: Cialdini principle × Hadnagy vector × elicitation technique 의 cross-tuple 별 severity matrix. LLM-classifier 기반 sensitive topic 분류 결과는 *항상 human gate* — auto-block 금지 (§2.1.5 cross-axis CT1 rule).
- **Human review default**: v0.2.0 advisory mode 에서도 *human gate default 명시 유지* — `value.human_gate_required: true` flag mandatory.
- **Advisory mode marking**: `value.advisory: true` + `value.human_gate_required: true` (LLM-classifier 기반은 항상 human gate).

### §15.6 Agent 6 — Methodology / Compliance (`skills/ultrasafe-methodology/SKILL.md`)

- **톤**: process-formal. *test methodology gap · coverage cliff · compliance (NIST 800-115 / OSSTMM / OWASP Testing Guide / PTES / ISO 27001:2022 / CIS v8.1)* 의 16-cell 2D dispatch matrix.
- **Input**: `{target_commit_sha, catalog_versions: {NIST_800-115, OSSTMM, OWASP_WSTG, PTES, ISO_27001_2022, CIS_v8.1}, iteration: N, prior_findings_set: F_{N-1}}` + test artifact (test coverage report · CI log) snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `methodology_anchor` + `iso_theme` + `rav_score` + `cis_control_id` + `catalog_version` + `coverage_percentage_under_catalog` + `untested_classes[]`.
- **Tools**: Read, Grep, Bash (read-only — `git log`, coverage report parse; external compliance scanner 호출 금지).
- **When to fire**: axis-set 에 `usf-iam-config` 또는 methodology-related axis 포함 시 자동 dispatch. Tier 2+ 에서 활성.
- **Severity rubric**: methodology gap 의 RAV-style quantified release gate (PM §5) + ISO 27001 4-theme × CIS v8.1 mapping.
- **Catalog version mandatory** (§2.1.6): 매 finding 의 `catalog_version` + `coverage_percentage_under_catalog` + `untested_classes[]` 명시 강제 — "secure" 단어 사용 금지, *"passed coverage X% under catalog v_Y as of date Z"* 한정 표현.
- **Advisory mode marking**: `value.advisory: true` + `value.coverage_attestation: {catalog_version, coverage_pct, untested_classes[]}` (mandatory).

### §15.7 Agent 7 — Threat Model / Lifecycle (`skills/ultrasafe-threat-model/SKILL.md`)

- **톤**: lifecycle-systematic. *threat modeling (STRIDE per-Element/per-Interaction · LINDDUN 7-category · UKC 18-phase) · incident lifecycle (PICERL 6-phase) · disclosure timing · attack-defense tree · secondary-surface iteration guard* 의 13-17 cell 직교 coverage.
- **Input**: `{target_commit_sha, catalog_versions: {STRIDE_v1, LINDDUN_v3.0, UKC_v2.0, LM_CKC_v1, PTE_Protocol_Matrix_v0.1}, iteration: N, prior_findings_set: F_{N-1}}` + architecture diagram (manual input or doc reference) + lifecycle metadata snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `stride_category` + `linddun_category` + `ukc_phase` + `pte_layer` + `lifecycle_stage` + `secondary_surface_origin_id`.
- **Tools**: Read (architecture doc), Grep (lifecycle pattern), Bash (read-only — `git log`, signature verify; 외부 PKI 호출 금지).
- **When to fire**: axis-set 에 `usf-stride` 또는 `usf-linddun` 또는 `usf-kill-chain` 또는 `usf-protocol-lifecycle` 포함 시 자동 dispatch. Tier 2+ 에서 활성.
- **Severity rubric**: STRIDE + LINDDUN + UKC 의 cross-cell severity matrix. Attack-defense tree fragment 의 bottom-up propagation (TM §2). Secondary-surface iteration guard — F_{N+1} = (F_N − sealed) + secondary_new 의 diff 추출 mandatory.
- **TOFU hardening** (PTE §2): admit-time Ed25519 signature + DID 등록 + trust anchor lifetime metadata mandatory (advisory mode 에서도 명시 유지).
- **Advisory mode marking**: `value.advisory: true` + `value.secondary_surface_diff: {sealed_prior, new_secondary}` (mandatory, regression baseline computation 의 input).

### §15.8 Agent 8 — Synthesizer (fan-out sink) (`skills/ultrasafe-synthesizer/SKILL.md`)

- **톤**: synthesis-meta. *7 attacker finding 의 cross-axis dedup + severity ranking + correlation + 3-layer report 생성* 의 retire-barrier 합성 단독.
- **Input**: `{iteration: N, finding_set_from_7_attackers: [F_1, ..., F_7], catalog_versions: {...}, agent_roster_snapshot_hash: sha256(...)}` + 직전 iteration boundary snapshot.
- **Output**: 3-layer hybrid (자세히 §3 합성 보고서 양식 + §18.2 ITERATION_BOUNDARY wire spec 참조):
  - **Layer 1**: OSCAL Assessment Result (`oscal.findings[]` + `oscal.iteration_summary` 4-set diff + `oscal.alignment_matrix`).
  - **Layer 2**: Hyperbrief 9-section IR (score ≥ 4 finding 마다).
  - **Layer 3**: Greatpractice tree entry candidate (macro / mezzo / micro 자동 분류).
- **Tools**: Read (직전 iteration boundary JSONL), Grep (finding cross-correlate), Bash (read-only — JSON aggregate · BLAKE3 hash compute; mutation 금지).
- **When to fire**: orchestrator 가 7 attacker 의 모든 finding emit 완료 시 자동 dispatch (retire-barrier 시점). Tier 1-3 모두 활성.
- **Synthesis rubric**:
  - BFT quorum 2f+1 (n=7, f=2 까지 견딤) → 동일 finding 5 agent 보고 시 `confirmed` tier, f+1=3 agent 보고 시 `needs-corroboration`, 단일 보고 시 `low-confidence draft`.
  - Diversity-enforced source independence (MAD §2 + §3.2) — (perspective × prompt_template_hash × seed) 3-tuple distinct ≥ 3 강제.
  - ACH matrix multi-hypothesis (CDB §1) — 동일 finding 의 다중 hypothesis 제시.
  - CIM normalization tri-format export (SVD §4) — SARIF 2.1.0 + STIX 2.1 bundle + ATT&CK Navigator JSON layer.
- **Coverage definition** (§6.3 + §2.1.8): `coverage_percentage_under_catalog` = (탐색된 catalog cell / 해당 catalog 전체 cell) — 단순 "발견 0" ambiguous "clean" 이 아닌 *catalog cell 단위 명시적 측정*. 매 iteration boundary 의 `untested_classes[]` mandatory.
- **Self-spec-gaming hazard check** (§2.5): synthesizer 자체가 spec-gaming target 일 위험 회피 — broker (§2.5.2) 가 *외부 process* 로 4 mandatory check (attack family coverage / token consumption distribution / external_standard_anchor presence / untested_surfaces[] non-empty) 수행. broker hit 시 Hyperbrief MUST-trigger.
- **Advisory mode marking**: ITERATION_BOUNDARY 의 `value.advisory: true` + `value.clean_signal_4_condition_AND_gate_state: {regression_free, monotonic, coverage_floor, consecutive_2_iter}` (mandatory) + `value.would_release_in_blocking_mode: bool` (future blocking state hint).

### §15.9 8-agent dispatch sequence (Workflow fan-out 적용)

```
orchestrator (`runtime/orchestrator.cjs`)
  ↓ Phase A (read-only enumeration, Stackelberg leader observation, §3.2)
  ↓ 7 attacker (1-7) 병렬 dispatch — Workflow fan-out
  ↓ 각 attacker SKILL invoke + tool grant (Read / Grep / Bash read-only)
  ↓ 각 attacker 가 ULTRASAFE_FINDING intent emit (§18.1)
  ↓
[retire-barrier]
  ↓ orchestrator 가 7 attacker 완료 대기
  ↓ Phase B (informed best-response attack simulation, Stackelberg follower, §3.2)
  ↓ synthesizer (agent 8) dispatch — Workflow fan-out sink
  ↓ synthesizer SKILL invoke + 7 attacker finding aggregate
  ↓ ULTRASAFE_ITERATION_BOUNDARY intent emit (§18.2)
  ↓
orchestrator → clean-signal-gate (`runtime/clean-signal-gate.cjs`)
  ↓ MCP tool `ultrasafe_clean_signal_check` 호출 (§16.3)
  ↓ 4-condition AND-gate evaluate
  ↓
clean signal 미도달 → iteration N+1 으로 loop (Stage 2 재진입)
clean signal 도달 → MCP tool `ultrasafe_report_generate` 호출 (§16.4)
  ↓ 3-layer report 생성
  ↓ ULTRASAFE_RELEASE_GATE intent emit (§18.3)
  ↓ advisory mode: report-only (publish 차단 X)
  ↓ blocking mode (v0.3+): user gate 통과 후에만 publish 허용
```

Workflow fan-out 적용 evidence: orchestrator 가 7 attacker 를 *병렬* dispatch (Superscalar §3 read fan-out 패턴) + retire-barrier 에서 synthesizer 의 단일 sink 합성 — v0.1.0 design 의 *single-thread serial* 가정에서 v0.2.0 의 *parallel fan-out* 으로 runtime upgrade.

---

## §16. MCP Server Tools (v0.2.0)

> v0.2.0 의 5 MCP tools — `ultrasafe_run_fanout` / `ultrasafe_finding_aggregate` / `ultrasafe_clean_signal_check` / `ultrasafe_report_generate` / `ultrasafe_release_gate` — 는 `plugins/ultrasafe/mcp/server.cjs` 의 stdio JSON-RPC 인터페이스로 노출돼요. 각 tool 의 input/output schema + tool-level deterministic guarantee + advisory mode return flag mandatory.

### §16.1 `ultrasafe_run_fanout` — 8 attacker 병렬 dispatch

- **Description**: 7 attacker (agent 1-7) 를 병렬 dispatch + retire-barrier 에서 synthesizer (agent 8) 합성. v0.2.0 의 fan-out 진입점.
- **Input schema**:
  ```json
  {
    "target_commit_sha": "string (40-char hex)",
    "tier": "1 | 2 | 3",
    "axis_set": "string[] (e.g., ['usf-ai-llm', 'usf-web-sast-dast', ...])",
    "iteration": "integer (≥ 1)",
    "prior_findings_set": "Finding[] (직전 iteration 의 F_{N-1})",
    "catalog_versions": "{[axis_id]: catalog_version_string}",
    "agent_roster_snapshot_hash": "string (sha256 hex)"
  }
  ```
- **Output schema**:
  ```json
  {
    "advisory_mode": true,
    "iteration": "integer",
    "findings": "Finding[]",
    "iteration_boundary": "IterationBoundary",
    "synthesis_layer_1_oscal": "object (OSCAL Assessment Result)",
    "synthesis_layer_2_hyperbrief": "object[] (Hyperbrief IR, score ≥ 4)",
    "synthesis_layer_3_greatpractice": "object[] (tree entry candidate)",
    "agent_diversity_check_passed": "bool",
    "broker_meta_safety_check_passed": "bool"
  }
  ```
- **Tool-level deterministic guarantee**: 동일 input (target_commit_sha + tier + axis_set + iteration + prior_findings_set + catalog_versions + agent_roster_snapshot_hash) 에 대해 output 의 `findings` set 이 deterministic — agent diversity 4-tuple hash 가 박제되어 LLM stochasticity 가 *iteration boundary 내* 에서만 변동, 동일 input 의 재호출은 동일 finding set return.
- **Advisory mode**: `output.advisory_mode = true` mandatory. 모든 finding 의 `value.advisory: true`.

### §16.2 `ultrasafe_finding_aggregate` — cross-axis dedup + severity rank

- **Description**: 7 attacker 의 finding 을 cross-axis 합성 — dedup + severity ranking + correlation + 3-layer report 생성. `ultrasafe_run_fanout` 의 retire-barrier 단계가 본 tool 을 invoke.
- **Input schema**:
  ```json
  {
    "iteration": "integer",
    "finding_set_from_7_attackers": "Finding[]",
    "catalog_versions": "{[axis_id]: catalog_version_string}",
    "agent_roster_snapshot_hash": "string"
  }
  ```
- **Output schema**:
  ```json
  {
    "advisory_mode": true,
    "iteration": "integer",
    "deduped_findings": "Finding[] (cross-axis 합성 후)",
    "severity_ranked_findings": "Finding[] (severity desc 정렬)",
    "correlation_map": "{[finding_id]: finding_id[] (correlated findings)}",
    "confirmation_tier": "{[finding_id]: 'confirmed' | 'needs-corroboration' | 'low-confidence draft'}",
    "synthesis_layer_1_oscal": "object",
    "synthesis_layer_2_hyperbrief": "object[]",
    "synthesis_layer_3_greatpractice": "object[]"
  }
  ```
- **Tool-level deterministic guarantee**: dedup 알고리즘 = (file × line × pattern_id) 3-tuple match → merge. Severity ranking = (severity × scope × reversibility × external_impact) 4-tuple 의 lexicographic order. Confirmation tier 결정 = BFT quorum 2f+1 (n=7, f=2) 의 deterministic count.
- **Advisory mode**: `output.advisory_mode = true` mandatory.

### §16.3 `ultrasafe_clean_signal_check` — 4-condition AND-gate

- **Description**: iteration N → N+1 전환 또는 release 진입 결정을 위한 clean-signal-gate evaluation. 4-condition AND-gate 의 deterministic check.
- **Input schema**:
  ```json
  {
    "iteration": "integer (≥ 3)",
    "current_findings": "Finding[] (F_N)",
    "prior_findings": "Finding[] (F_{N-1})",
    "regression_baseline": "Finding[] (직전 release 의 ITER 최종 finding set + 본 release ITER 1 finding set 합)",
    "coverage_pct": "{[axis_id]: number (0-100)}",
    "applicable_subset_size": "{[axis_id]: integer}",
    "untested_classes": "{[axis_id]: string[]}",
    "iteration_history": "{[iter: integer]: {findings_count, regression_count, coverage_pct_avg}}",
    "tier": "1 | 2 | 3"
  }
  ```
- **Output schema**:
  ```json
  {
    "advisory_mode": true,
    "clean_signal_reached": "bool",
    "condition_1_regression_free": "bool (sealed_verification + prior_findings_retest + secondary_surface_absence 3-component AND)",
    "condition_2_monotonic_improvement": "bool (K-iteration window trend, K=3)",
    "condition_3_coverage_floor": "bool (Tier 1: 50% / Tier 2: 75% / Tier 3: 90%)",
    "condition_4_consecutive_2_iter": "bool",
    "recommended_action": "'continue_iteration' | 'release_ready_advisory' | 'hyperbrief_escalate'",
    "would_block_in_v03_blocking": "bool"
  }
  ```
- **Tool-level deterministic guarantee**: 4-condition AND-gate 의 *모든 sub-condition 이 deterministic predicate* — LLM judgment 없이 numerical comparison 만. K-iteration window trend = `findings_count[N], findings_count[N-1], findings_count[N-2]` 의 monotonic descending check.
- **Advisory mode**: `output.advisory_mode = true` mandatory. `clean_signal_reached = true` 라도 v0.2.0 에서는 *recommended_action = 'release_ready_advisory'* 만, 실제 publish 차단/허용 결정 X.

### §16.4 `ultrasafe_report_generate` — 3-layer report 생성

- **Description**: clean-signal 도달 또는 max_iter 도달 시점에 3-layer 합성 report 생성 — OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate.
- **Input schema**:
  ```json
  {
    "iteration_history": "IterationBoundary[]",
    "final_findings": "Finding[]",
    "clean_signal_state": "object (§16.3 의 output)",
    "tier": "1 | 2 | 3",
    "target_commit_sha": "string",
    "catalog_versions": "{[axis_id]: catalog_version_string}",
    "untested_classes": "{[axis_id]: string[]}"
  }
  ```
- **Output schema**:
  ```json
  {
    "advisory_mode": true,
    "layer_1_oscal_assessment_result": {
      "uuid": "string",
      "metadata": "object",
      "findings": "Finding[]",
      "iteration_summary": {"resolved": [], "regression": [], "persistent": [], "new": []},
      "alignment_matrix": "{[axis_pair]: cross_confirmation_count}",
      "attestation_text": "string (\"passed coverage X% under catalog v_Y as of date Z\" 한정 표현)"
    },
    "layer_2_hyperbrief_irs": "HyperbriefIR[] (score ≥ 4 finding)",
    "layer_3_greatpractice_candidates": "GreatpracticeTreeEntry[] (macro/mezzo/micro 자동 분류)",
    "sarif_2_1_0_export": "object (SARIF bundle)",
    "stix_2_1_export": "object (STIX bundle)",
    "attack_navigator_layer": "object (ATT&CK Navigator JSON layer)"
  }
  ```
- **Tool-level deterministic guarantee**: 3-layer report 의 schema 가 박제 — OSCAL v1.1.0 + Hyperbrief.md §1 9-section schema + Greatpractice.md §3 schema. Attestation text 의 형식이 *"passed coverage X% under catalog v_Y as of date Z"* 한정 — *"secure"* 단어 영구 금지.
- **Advisory mode**: `output.advisory_mode = true` mandatory. report 의 `attestation_text` 가 *advisory-only* 명시 — *"advisory-mode report — not a blocking attestation"* prefix.

### §16.5 `ultrasafe_release_gate` — release-gate state query

- **Description**: release-gate 의 current state query + Hyperbrief 4-score routing 의 input emit. v0.2.0 advisory mode 에서는 *상태 조회만*, publish 차단/허용 결정 X.
- **Input schema**:
  ```json
  {
    "iteration": "integer",
    "clean_signal_state": "object (§16.3 의 output)",
    "report": "object (§16.4 의 output)",
    "tier": "1 | 2 | 3",
    "target_commit_sha": "string",
    "release_candidate_tag": "string (e.g., 'v2.5.43')"
  }
  ```
- **Output schema**:
  ```json
  {
    "advisory_mode": true,
    "release_candidate": "string",
    "verdict": "'release_advisory' | 'hold_advisory' | 'escalate'",
    "grading": "'minimal' | 'standard' | 'high'",
    "findings_residual": "Finding[]",
    "hyperbrief_id": "string | null (escalation 시)",
    "methodology": "string[] (NIST/OSSTMM/OWASP/PTES 4-tuple default)",
    "would_block_in_v03_blocking": "bool",
    "user_gate_required_in_v03": "bool"
  }
  ```
- **Tool-level deterministic guarantee**: verdict 결정 = clean_signal_state.clean_signal_reached + findings_residual.severity_max + tier 의 deterministic predicate. Grading = (severity_max × external_impact_max × tier) 의 lexicographic mapping.
- **Advisory mode**: `output.advisory_mode = true` mandatory. verdict 가 *'release_advisory'* 라도 v0.2.0 에서는 publish 차단/허용 결정 X — *consumer 측 (Claude Code / orchestrator) 이 advisory mode 임을 인지하고 차단 결정 내리지 않도록* 강제.

### §16.6 MCP server entry — `server.cjs` 구조

```javascript
// plugins/ultrasafe/mcp/server.cjs (v0.2.0 skeleton)
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new Server(
  { name: 'ultrasafe', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

const TOOLS = {
  ultrasafe_run_fanout:         require('./tools/run-fanout.cjs'),
  ultrasafe_finding_aggregate:  require('./tools/finding-aggregate.cjs'),
  ultrasafe_clean_signal_check: require('./tools/clean-signal-check.cjs'),
  ultrasafe_report_generate:    require('./tools/report-generate.cjs'),
  ultrasafe_release_gate:       require('./tools/release-gate.cjs'),
};

server.setRequestHandler('tools/list', () => ({
  tools: Object.entries(TOOLS).map(([name, t]) => ({
    name, description: t.description, inputSchema: t.inputSchema
  }))
}));

server.setRequestHandler('tools/call', async (req) => {
  const tool = TOOLS[req.params.name];
  if (!tool) throw new Error(`Unknown tool: ${req.params.name}`);
  const result = await tool.handler(req.params.arguments);
  // v0.2.0 advisory mode mandatory injection
  result.advisory_mode = true;
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

const transport = new StdioServerTransport();
server.connect(transport);
```

`@modelcontextprotocol/sdk` 는 `mcp/package.json` 에 dependency. 각 tool 의 individual implementation 은 `mcp/tools/*.cjs` 에 분리 — v0.2.0 의 ship 단위는 *skeleton + 5 tool stub*, full implementation 은 v0.2.x dogfood evidence 누적 후 점진 확장.

---

## §17. Hooks Spec — PreToolUse + Stop (v0.2.0)

> v0.2.0 의 2 hook — PreToolUse `ultrasafe-trigger.cjs` + Stop `ultrasafe-clean-signal.cjs` — 의 registration / condition / action 명세예요. 두 hook 모두 *advisory mode* — exit code 0 + stderr alert + surface only, 실제 차단 X.

### §17.1 PreToolUse hook — `ultrasafe-trigger.cjs`

- **위치**: `plugins/ultrasafe/hooks/ultrasafe-trigger.cjs`
- **Hook event**: `PreToolUse` (Claude Code SDK hook event)
- **Matcher**: `Bash` (Bash tool 호출 직전)
- **Trigger condition**: publish-equivalent command 7 종 매처 일치 시 (§10.1 의 7 종 매처 그대로 차용):
  - `git push.*--tags`
  - `gh release create`
  - `npm publish` (or `pnpm/yarn publish`)
  - `twine upload` 또는 `python -m build.*upload`
  - `docker push.*\b[\w.-]+:[\w.-]+`
  - `cargo publish`
  - `gh pr merge.*--squash\|--merge` (main 대상)
- **Action** (v0.2.0 advisory mode):
  1. tier 분류 (§10.3) — semver bump rubric
  2. axis-set 선택 (§10.4) — Tier 별 8/13/17 agent
  3. iteration_min 결정 (§10.5) — Tier 별 3/4/5+
  4. orchestrator dispatch — MCP tool `ultrasafe_run_fanout` 호출
  5. clean-signal-gate evaluate — MCP tool `ultrasafe_clean_signal_check` 호출
  6. 3-layer report 생성 — MCP tool `ultrasafe_report_generate` 호출
  7. release-gate state — MCP tool `ultrasafe_release_gate` 호출
  8. **stderr alert emit** — `verdict` 표시 + `findings_residual` summary + Hyperbrief routing 후보
  9. **exit code 0** — pass-through (publish 명령은 정상 진행)
- **Registration** (`.claude/settings.json` 또는 `plugins/ultrasafe/hooks/hooks.json`):
  ```json
  {
    "hooks": {
      "PreToolUse": [{
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/ultrasafe-trigger.cjs --command \"$TOOL_INPUT\""
        }]
      }]
    }
  }
  ```
- **Advisory mode 명시**: 본 hook 의 모든 stderr alert 가 *"[ULTRASAFE ADVISORY]"* prefix mandatory. exit code 0 fixed — *어떤 finding 도 publish 차단 안 함*.
- **Blocking mode 전환 (v0.3+)**: clean_signal_reached = false 또는 findings_residual.severity_max ≥ high → exit code 1 (block) — user gate 통과 (Hyperbrief 4-score gate 또는 explicit `--allow-with-risk` flag) 필요. v0.2.x 에서는 *exit code 1 never*.

### §17.2 Stop hook — `ultrasafe-clean-signal.cjs`

- **위치**: `plugins/ultrasafe/hooks/ultrasafe-clean-signal.cjs`
- **Hook event**: `Stop` (Claude Code SDK turn-end event)
- **Trigger condition**: 매 turn-end 시점 — orchestrator 의 iteration boundary 가 최근 N turn 안에 있는 경우 (orchestrator state 가 `iteration_in_progress = true` 일 때).
- **Action** (v0.2.0 advisory mode):
  1. orchestrator state 조회 — 현재 iteration N + clean-signal state
  2. clean-signal-gate evaluate — MCP tool `ultrasafe_clean_signal_check` 호출
  3. 4-condition AND-gate 의 각 sub-condition 의 current state surface
  4. **stderr alert emit** — clean signal 미도달 시 *"[ULTRASAFE ADVISORY] iteration N: condition X not met — recommend continue iteration"* 표시
  5. **exit code 0** — pass-through (turn 정상 종료)
- **Registration** (`.claude/settings.json` 또는 `plugins/ultrasafe/hooks/hooks.json`):
  ```json
  {
    "hooks": {
      "Stop": [{
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/ultrasafe-clean-signal.cjs"
        }]
      }]
    }
  }
  ```
- **Advisory mode 명시**: 본 hook 의 모든 stderr alert 가 *"[ULTRASAFE ADVISORY]"* prefix mandatory. exit code 0 fixed — *어떤 cycle 도 차단 안 함*.
- **Cycle-end probe 와의 관계**: 본 hook 은 *Constellation §13.16.10 의 cycle-end probe* 와 직교 — Constellation cycle-end probe 는 inbox/outbox 정합성, Ultrasafe Stop hook 은 iteration boundary 의 clean-signal state. 두 hook 이 같은 Stop event 에 등록될 수 있음 — `.claude/settings.json` 의 hooks array 가 둘 다 호출.

### §17.3 `hooks.json` 통합 registration

`plugins/ultrasafe/hooks/hooks.json` 의 통합 registration manifest — Claude Code plugin loader 가 본 파일을 읽고 settings.json 의 hooks 섹션에 자동 merge:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/ultrasafe-trigger.cjs --command \"$TOOL_INPUT\"",
        "description": "Ultrasafe PreToolUse trigger — publish-equivalent command 감지 + advisory mode emit"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/ultrasafe-clean-signal.cjs",
        "description": "Ultrasafe Stop hook — cycle-end clean-signal check, advisory surface only"
      }]
    }]
  }
}
```

### §17.4 Hook implementation skeleton — `ultrasafe-trigger.cjs`

```javascript
// plugins/ultrasafe/hooks/ultrasafe-trigger.cjs (v0.2.0 skeleton)
#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const cmdIdx = args.indexOf('--command');
const command = cmdIdx >= 0 ? args[cmdIdx + 1] : '';

// 7 종 매처
const MATCHERS = [
  { id: 'gpush-tags',    regex: /git push.*--tags/ },
  { id: 'gh-release',    regex: /gh release create/ },
  { id: 'npm-publish',   regex: /(npm|pnpm|yarn)\s+publish/ },
  { id: 'pypi-upload',   regex: /(twine upload|python -m build.*upload)/ },
  { id: 'docker-push',   regex: /docker push.*\b[\w.-]+:[\w.-]+/ },
  { id: 'cargo-publish', regex: /cargo publish/ },
  { id: 'gh-pr-merge',   regex: /gh pr merge.*(--squash|--merge)/ },
];

const hit = MATCHERS.find(m => m.regex.test(command));
if (!hit) process.exit(0);  // pass-through

// orchestrator 호출 — MCP server 의 ultrasafe_run_fanout 등 5 tool 순차 dispatch
const orchestrator = path.join(__dirname, '..', 'runtime', 'orchestrator.cjs');
const child = spawn('node', [orchestrator, '--matcher', hit.id, '--command', command], {
  stdio: ['ignore', 'pipe', 'inherit']
});

let output = '';
child.stdout.on('data', d => output += d.toString());
child.on('close', code => {
  // v0.2.0 advisory mode: exit code 0 fixed, stderr alert only
  if (output) {
    process.stderr.write(`[ULTRASAFE ADVISORY] ${output}\n`);
  }
  process.exit(0);  // advisory mode: pass-through always
});
```

### §17.5 Hook implementation skeleton — `ultrasafe-clean-signal.cjs`

```javascript
// plugins/ultrasafe/hooks/ultrasafe-clean-signal.cjs (v0.2.0 skeleton)
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.env.CLAUDE_PROJECT_DIR || '.', '.ultrasafe', 'state.json');
if (!fs.existsSync(STATE_FILE)) process.exit(0);  // no iteration in progress

const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
if (!state.iteration_in_progress) process.exit(0);

// clean-signal-gate evaluate — MCP tool `ultrasafe_clean_signal_check` 호출 (in-process)
const cleanSignalCheck = require('../mcp/tools/clean-signal-check.cjs');
const result = cleanSignalCheck.handler({
  iteration: state.iteration,
  current_findings: state.current_findings,
  prior_findings: state.prior_findings,
  regression_baseline: state.regression_baseline,
  coverage_pct: state.coverage_pct,
  applicable_subset_size: state.applicable_subset_size,
  untested_classes: state.untested_classes,
  iteration_history: state.iteration_history,
  tier: state.tier,
});

// v0.2.0 advisory mode: stderr alert only
if (!result.clean_signal_reached) {
  const unmet = [];
  if (!result.condition_1_regression_free) unmet.push('regression-free');
  if (!result.condition_2_monotonic_improvement) unmet.push('monotonic-improvement');
  if (!result.condition_3_coverage_floor) unmet.push('coverage-floor');
  if (!result.condition_4_consecutive_2_iter) unmet.push('consecutive-2-iter');
  process.stderr.write(`[ULTRASAFE ADVISORY] iteration ${state.iteration}: clean signal not reached — unmet: ${unmet.join(', ')} — recommend: ${result.recommended_action}\n`);
}
process.exit(0);  // advisory mode: pass-through always
```

---

## §18. Constellation 통합 — 5 신규 intent runtime wire (v0.2.0)

> §8 의 5 신규 A2A intent (ULTRASAFE_FINDING / ITERATION_BOUNDARY / RELEASE_GATE / SECURITY_DISCLOSURE_INTAKE / MPCVD_COORDINATION) 가 v0.1.0 에서 *design schema* 였다면, 본 §18 은 그 schema 의 **runtime wire activation** — Constellation §13.16 의 A2A-intent allowlist 에 5 name 등록 + ack_tier 적용 + payload schema mandatory 검증 + Spotlighting wrapper 자동 적용 + 라이브보드 카드 surface 의 runtime 결선예요. v0.2.0 의 5 intent 는 모두 *advisory* — finding emit 은 dashboard surface + outbox.jsonl 영속, 실제 publish 차단/허용 결정 X.

### §18.1 `ULTRASAFE_FINDING` — runtime wire spec

- **방향**: red-team agent → main / dashboard
- **ack_tier**: `commitment` (Constellation §13.13 의 application-tier)
- **paired companion**: 없음 (단독 envelope)
- **Payload schema** (v0.2.0):
  ```json
  {
    "type": "CUSTOM",
    "name": "ULTRASAFE_FINDING",
    "targetAgentId": "main",
    "value": {
      "finding_id": "us-{ISO8601_date}-{seq}",
      "iteration": "integer",
      "axis": "string (axis_id, §3.1)",
      "agent_id": "string (attacker agent identifier)",
      "attack_pattern": {"stix_id": "string", "mitre_technique": "string"},
      "severity": {
        "cvss": "number (0-10)",
        "epss_estimate": "number | null",
        "ultrasafe_exploited": "bool",
        "asr_pct": "number (0-100)",
        "ci95": "[number, number]"
      },
      "diamond": {"adversary": "string", "capability": "string", "infrastructure": "string", "victim": "string"},
      "evidence_ref": "string (sarif:// 또는 stix:// URI)",
      "redaction": "'external_summary_only' | 'internal_full'",
      "spotlight_wrap": true,
      "advisory": true,
      "would_block_in_v03_blocking": "bool",
      "external_standard_anchor": {
        "catalog_version": "string",
        "catalog_cell_id": "string",
        "coverage_pct_under_catalog": "number"
      }
    }
  }
  ```
- **Constellation §13.16 등록**: `ULTRASAFE_FINDING` 이 A2A-intent allowlist 에 추가 — `targetAgentId` 미지정 시 fail-safe default branch (§13.16.9) 가 main agent inbox 로 라우팅, watcher 의 meaningful-inbound 필터가 wake 대상으로 인식.
- **Spotlighting wrapper 자동 적용** (§8.2): inbox cursor advance 시점에 `<<UNTRUSTED_A2A name="ULTRASAFE_FINDING" sender="..." iso="...">>...<<END_UNTRUSTED_A2A>>` fence 자동 삽입.
- **라이브보드 카드** (§8.5 Tier 2): finding 마다 1 카드 슬라이드인 — severity color (5×5 cell) + MITRE ATT&CK technique badge + Kill Chain phase lane + 1-line evidence.
- **Advisory mode 명시**: `value.advisory: true` mandatory. 라이브보드 카드의 corner badge 가 *"ADVISORY"* 표시.

### §18.2 `ULTRASAFE_ITERATION_BOUNDARY` — runtime wire spec

- **방향**: orchestrator → main / dashboard
- **ack_tier**: `commitment`
- **paired companion**: 없음
- **Payload schema** (v0.2.0):
  ```json
  {
    "type": "CUSTOM",
    "name": "ULTRASAFE_ITERATION_BOUNDARY",
    "targetAgentId": "main",
    "value": {
      "iteration_from": "integer",
      "iteration_to": "integer",
      "summary": {"findings_total": "integer", "resolved": "integer", "new": "integer", "regressed": "integer"},
      "coverage": {"axes_run": "string[]", "asset_coverage_pct": "number", "perspective_diversity": "number"},
      "clean_signal_4_condition_AND_gate_state": {
        "condition_1_regression_free": "bool",
        "condition_2_monotonic_improvement": "bool",
        "condition_3_coverage_floor": "bool",
        "condition_4_consecutive_2_iter": "bool"
      },
      "clean_signal_reached": "bool",
      "agent_roster_snapshot_hash": "string",
      "untested_classes": "{[axis_id]: string[]}",
      "advisory": true,
      "would_release_in_blocking_mode": "bool"
    }
  }
  ```
- **Constellation §13.16 등록**: `ULTRASAFE_ITERATION_BOUNDARY` allowlist 추가.
- **라이브보드 카드** (§8.5 Tier 3): iteration boundary 카드 — delta heatmap (resolved=green / new=red / regressed=orange) + cumulative metric 3-tuple.
- **외부 commit channel**: SARIF 2.1.0 + STIX 2.1 bundle + ATT&CK Navigator JSON layer 가 같은 body 를 소비 — 별도 commit 으로 evidence 영속.
- **Advisory mode 명시**: `value.advisory: true` mandatory.

### §18.3 `ULTRASAFE_RELEASE_GATE` — runtime wire spec

- **방향**: orchestrator → main
- **ack_tier**: `decided` (Hyperbrief 와 동일 application-tier — 사용자측 signed receipt)
- **paired companion**: `HyperbriefCard` (verdict='escalate' 시)
- **Payload schema** (v0.2.0):
  ```json
  {
    "type": "CUSTOM",
    "name": "ULTRASAFE_RELEASE_GATE",
    "targetAgentId": "main",
    "value": {
      "release_candidate": "string (tag, e.g., 'v2.5.43')",
      "verdict": "'release_advisory' | 'hold_advisory' | 'escalate'",
      "grading": "'minimal' | 'standard' | 'high'",
      "findings_residual": "Finding[]",
      "hyperbrief_id": "string | null",
      "methodology": "string[] (NIST/OSSTMM/OWASP/PTES 4-tuple default)",
      "advisory": true,
      "would_block_in_v03_blocking": "bool",
      "user_gate_required_in_v03": "bool",
      "attestation_text": "string (\"passed coverage X% under catalog v_Y as of date Z\" 한정 표현 + \"ADVISORY MODE\" prefix)",
      "_sig": "string (Ed25519 signature of value 본체 — broker compromise 회피)"
    }
  }
  ```
- **Constellation §13.16 등록**: `ULTRASAFE_RELEASE_GATE` allowlist 추가 + `ack_tier='decided'` 의 application-tier 적용 (사용자 signed receipt).
- **paired HyperbriefCard**: `verdict='escalate'` 시 동일 `parentId` 로 `HyperbriefCard` 함께 emit — 라이브보드가 한 카드로 렌더 (§8.1 paired-envelope 패턴).
- **라이브보드 카드** (§8.5 Tier 3): release gate 카드 — verdict badge + grading badge + paired HyperbriefCard link (escalate 시).
- **out-of-band 검증** (§8.4): broker compromise 회피 — `value._sig` Ed25519 signature 의무 + 사용자측 dashboard direct view cross-verification.
- **Advisory mode 명시**: `value.advisory: true` mandatory + `value.attestation_text` 가 *"ADVISORY MODE"* prefix.

### §18.4 `SECURITY_DISCLOSURE_INTAKE` — runtime wire spec

- **방향**: external researcher gateway → main
- **ack_tier**: `commitment` + 인증 layer (`value._sig` Ed25519 mandatory)
- **paired companion**: 없음 (단독)
- **Payload schema** (v0.2.0):
  ```json
  {
    "type": "CUSTOM",
    "name": "SECURITY_DISCLOSURE_INTAKE",
    "targetAgentId": "main",
    "value": {
      "disclosure_id": "string (UUID)",
      "reporter_did": "string (DID identifier)",
      "reporter_public_key": "string (Ed25519 public key)",
      "vulnerability_summary": "string (1-line)",
      "vulnerability_details_encrypted": "string (encrypted under reporter+receiver shared secret)",
      "cvss_estimate": "number | null",
      "affected_component": "string",
      "affected_version_range": "string",
      "disclosure_timing_preference": "'immediate' | '90_day_embargo' | 'mpcvd_coordinate'",
      "bug_bounty_eligible": "bool",
      "advisory": true,
      "_sig": "string (Ed25519 signature of value 본체)"
    }
  }
  ```
- **Constellation §13.16 등록**: `SECURITY_DISCLOSURE_INTAKE` allowlist 추가 + 인증 layer mandatory (signature 검증 실패 envelope 은 main inbox 라우팅 전 *server-side 차단*).
- **인증 layer**: protocol-trust-evolution §1.4 의 PKI chain-of-trust 패턴 차용 — Ed25519 signature 필드를 `value._sig` 에 mandatory + reporter_did + reporter_public_key 를 broker 가 사전 등록한 trust anchor 와 cross-verify.
- **Greatpractice promotion path** (§9): 신규 disclosure pattern 이 N 회 누적 시 Greatpractice mezzo 노드 자동 promotion.
- **Advisory mode 명시**: `value.advisory: true` — v0.2.0 에서는 disclosure 수신 후 processing 자동화 없음, manual triage 만.

### §18.5 `MPCVD_COORDINATION` — runtime wire spec

- **방향**: coordinator ↔ 다자 vendor
- **ack_tier**: `decided`
- **paired companion**: 자체 broadcast cohort (모든 vendor 가 같은 cohort 의 paired companion)
- **Payload schema** (v0.2.0):
  ```json
  {
    "type": "CUSTOM",
    "name": "MPCVD_COORDINATION",
    "targetAgentId": "string (vendor agent id, broadcast 시 'cohort:*')",
    "value": {
      "mpcvd_id": "string (UUID, cohort 식별자)",
      "coordinator_did": "string",
      "vendor_cohort": "string[] (vendor DID array)",
      "vulnerability_summary": "string",
      "vulnerability_details_encrypted": "string",
      "embargo_state": "'draft' | 'embargo_active' | 'embargo_lifted' | 'public_disclosure'",
      "embargo_end_iso": "string (ISO8601)",
      "patch_readiness_per_vendor": "{[vendor_did]: 'not_started' | 'in_progress' | 'patch_ready' | 'patch_deployed'}",
      "staged_release_plan": {
        "stage_1_vendors": "string[]",
        "stage_1_iso": "string",
        "stage_2_vendors": "string[]",
        "stage_2_iso": "string",
        "public_disclosure_iso": "string"
      },
      "advisory": true,
      "_sig": "string (Ed25519 signature)"
    }
  }
  ```
- **Constellation §13.16 등록**: `MPCVD_COORDINATION` allowlist 추가 + `ack_tier='decided'` 적용 + broadcast cohort 패턴 (paired companion 이 자체 cohort 의 모든 vendor).
- **out-of-band 검증** (§8.4): broker compromise 회피 — `value._sig` Ed25519 signature 의무 + 별도 채널 (Hyperbrief md_permalink + 사용자측 dashboard direct view) cross-verification.
- **embargo state machine**: `draft` → `embargo_active` → `embargo_lifted` → `public_disclosure` 의 4-state machine, 각 transition 이 cohort 의 모든 vendor 의 `decided` ack 통과 후에만 진행.
- **Advisory mode 명시**: `value.advisory: true` — v0.2.0 에서는 coordination state machine 자동 진행 없음, manual coordinator 결정만.

### §18.6 Constellation §13.16 등록부 (v0.2.0 ship 시점)

본 cut 의 ship 시점에 Constellation §13.16.9 의 A2A-intent allowlist 에 5 신규 name 등록 mandatory:

| Name | Category | ack_tier | Spotlighting wrap | Outbox 라우팅 |
|---|---|---|---|---|
| `ULTRASAFE_FINDING` | A2A-intent | `commitment` | mandatory | self-board (응답 패턴 아님 — broadcast) |
| `ULTRASAFE_ITERATION_BOUNDARY` | A2A-intent | `commitment` | mandatory | self-board |
| `ULTRASAFE_RELEASE_GATE` | A2A-intent | `decided` | mandatory + signature | self-board |
| `SECURITY_DISCLOSURE_INTAKE` | A2A-intent | `commitment` + auth | mandatory + signature 검증 | self-board (server-side filter) |
| `MPCVD_COORDINATION` | A2A-intent | `decided` | mandatory + signature | broadcast (cohort) |

5 name 의 등록은 Constellation.md §13.16.9 의 4-group classification table 갱신 + N-way sync (AGENTS.md §5.8 항목 추가) 가 동반 — 같은 cut 에서 Ultrasafe.md + Constellation.md + plugin manifest 모두 갱신.

---

## §19. Advisory vs Blocking Mode — v0.2.x advisory + v0.3+ blocking 전환 조건 (v0.2.0)

> v0.1.0 의 §13.5 가 *advisory → blocking 전환의 design intent* 였다면, 본 §19 은 그 intent 의 **runtime activation 시점에 측정 가능한 조건 명세** — v0.2.x 동안 advisory mode 유지의 정당화 + v0.3+ blocking mode 전환의 3-AND 조건 (clean-signal-gate 4-condition AND-gate 도달 + user gate 통과 + ≥3 iteration consecutive clean) + 전환 결정 자체의 Hyperbrief gate.

### §19.1 v0.2.x advisory mode 의 운영 의미

v0.2.x 동안 (v0.2.0 ship → v0.3.0 cut 전까지) Ultrasafe runtime 의 모든 출력은 *advisory*:

| 출력 surface | Advisory 의미 |
|---|---|
| 8 attacker SKILL 의 finding emit | dashboard 카드 + outbox.jsonl 영속 + Hyperbrief routing 후보. publish 차단 X. |
| PreToolUse hook `ultrasafe-trigger.cjs` | exit code 0 fixed. stderr alert 만, publish 명령 정상 진행. |
| Stop hook `ultrasafe-clean-signal.cjs` | exit code 0 fixed. stderr alert 만, cycle 정상 종료. |
| MCP tool 5 종 return | `output.advisory_mode: true` mandatory. consumer 측에서 차단 결정 내리지 않도록 강제. |
| 5 Constellation intent emit | `value.advisory: true` mandatory. 라이브보드 카드의 corner badge *"ADVISORY"* 표시. |
| 3-layer report 의 attestation text | *"ADVISORY MODE"* prefix mandatory. *"passed coverage X% under catalog v_Y as of date Z"* 한정 표현 + advisory prefix. |

v0.2.x 동안의 운영 목적:
- **FP rate baseline 수집**: 8 attacker 의 finding 중 *실제 vulnerability 가 아닌 false positive* 비율 측정. FP rate threshold (default 10%) 미달 시 blocking mode 전환 후보.
- **Dogfood evidence 누적**: ≥ 5 cycle 의 dogfood 실행 + 각 cycle 의 clean-signal-gate evaluation 기록. evidence 누적이 blocking mode 전환의 prerequisite.
- **Self-spec-gaming hazard 검증**: §2.5 의 4 mandatory item + broker (§2.5.2) 의 hit pattern 분석 — 어떤 finding 의 promotion path 가 *spec-gaming reward* 인지 추적.
- **Advisory → Blocking 전환 절차의 codification**: 본 절 자체가 Greatpractice mezzo 노드 후보 — "Ultrasafe advisory → blocking 전환 procedure" 의 promotion.

### §19.2 Blocking mode 전환 3-AND 조건 (v0.3+)

v0.2.x → v0.3+ blocking mode 전환은 다음 **3 조건 모두** 만족 시에만 진행:

| # | 조건 | 측정 | 임계 |
|---|---|---|---|
| 1 | **Clean-signal-gate 4-condition AND-gate 도달** | `ultrasafe_clean_signal_check` 의 `clean_signal_reached = true` 가 ≥ N consecutive cycle 동안 유지 | N ≥ 5 cycle |
| 2 | **User gate 통과** | maintainer 의 explicit Hyperbrief 4-score gate 통과 — score ≥ 4 + 운영 기간 ≥ 3 month + FP rate < 10% | Hyperbrief IR 의 escalation decision = "blocking_mode_transition_approved" |
| 3 | **≥3 iteration consecutive clean** | 직전 N release 의 모든 iteration boundary 에서 clean signal 도달 | N ≥ 3 release × ≥ 3 iteration |

3 조건 모두 만족 시 v0.3.0 cut 에서 blocking mode default 활성. 미달 시 v0.2.x advisory mode 유지.

### §19.3 Blocking mode 의 운영 의미 (v0.3+)

blocking mode 전환 후의 runtime 변경:

| 출력 surface | Blocking 의미 |
|---|---|
| PreToolUse hook | `clean_signal_reached = false` 또는 `findings_residual.severity_max ≥ high` 시 **exit code 1** — publish 명령 차단. user gate 통과 (Hyperbrief 4-score gate 또는 explicit `--allow-with-risk` flag) 필요. |
| Stop hook | `clean_signal_reached = false` + iteration max_iter 도달 시 **exit code 1** — cycle 차단, Hyperbrief MUST-trigger 활성. |
| MCP tool 5 종 return | `output.advisory_mode: false`. consumer 측이 verdict 에 따라 실제 차단/허용 결정 내림. |
| 5 Constellation intent emit | `value.advisory: false`. 라이브보드 카드의 corner badge *"BLOCKING"* 표시. |
| 3-layer report 의 attestation text | *"BLOCKING MODE"* prefix. *"passed coverage X% under catalog v_Y as of date Z"* 한정 표현은 유지 (Cluster C8 falsifiability invariant). |

### §19.4 전환 결정 자체의 Hyperbrief gate

v0.2.x → v0.3+ 전환 결정 자체가 Hyperbrief 4-score gate 의 dispatch target — `Hyperbrief.md §1` 의 9-section JSON IR 양식:

- **Section 1 (audience_profile)**: EG maintainers (한국어 prevailing language).
- **Section 2 (decision_context)**: "Ultrasafe v0.2.x advisory mode 운영 후 blocking mode 전환 결정".
- **Section 3 (4-score)**: severity × scope × reversibility × external_impact 의 4-tuple — blocking mode 전환은 *reversibility=partial* (전환 후 advisory 회귀 가능하나 cost 큼) + *external_impact=high* (publish 차단 강제로 외부 release cadence 영향) — 4-score 합 일반적으로 ≥ 5.
- **Section 4 (3-AND condition state)**: 위 §19.2 의 3 조건 current state.
- **Section 5 (recommended_methodology)**: Tier 별 axis-set 차등 + iteration_min 차등 + bypass mechanism (§10.6) 의 명시.
- **Section 6 (rollback_plan)**: blocking mode 진입 후 advisory 회귀 procedure — 환경변수 `ULTRASAFE_MODE=advisory` 강제 override (전환 결정 후 N month 동안 maintainer manual override 허용).
- **Section 7-9**: per Hyperbrief.md §1.

전환 결정 IR emit 시점에 audience_profile_fallback.button_label + trigger_phrases_md 가 한국어 auto-localize (Hyperbrief.md §5.6.7 v0.5.6).

### §19.5 본 §19 의 self-application 함의

본 §19 의 advisory → blocking 전환 절차 자체가 *Ultrasafe spec 의 self-application* — Ultrasafe 가 자기 자신의 runtime mode 전환을 *Hyperbrief 4-score gate* 로 routing 하는 reflexive 구조. 부록 C 의 self-application dogfood + §1.4 의 advisory-only boundary 와 정합.

이 self-application 이 *Ultrasafe 의 self-trust* 의 두 번째 anchor — 첫 번째는 부록 C 의 Greatpractice macro entry, 두 번째는 본 §19 의 mode transition Hyperbrief gate. v0.3+ blocking mode 진입 시 본 §19 자체도 *blocking 화* — 즉 v0.3.x 의 advisory → blocking 전환 retro-decision 도 동일 §19 procedure 따름 (Greatpractice §5.4-§5.6 promotion path 와 동형).

---

## 부록 A: Cross-Axis Convergence Cluster Catalog

> 본 부록은 Ultrasafe spec 의 backing research 인 17축 cross-domain deep dive 의 §1 convergence-cluster 결과를 *spec drafting 의 첫 참조 카드* 형태로 정리한 카탈로그예요. 14 cluster 각각의 (정의, 등장 축 수, EG 적용 우선순위, 핵심 인용, spec 본문 cross-ref) 를 표로 박제 + 17-axis × cluster coverage matrix + cluster 별 1-2 핵심 학술/표준 인용 + 우선순위 rationale 4 sub-section 으로 구성. Greatpractice.md 부록 A "domain catalog" 패턴 정합. (cross-axis-patterns §1, synthesis §3.1-§3.4)

### A.1 14 Convergence Cluster — one-liner + 등장 축 수 + EG 우선순위

| Cluster | 정의 (one-liner) | 등장 축 수 | EG v0.1.0 우선순위 | spec 본문 cross-ref |
|---|---|---|---|---|
| **C1 — Parallel attacker-perspective fan-out** | Ultrasafe attack 단계는 단일 thread 가 아닌 복수 perspective 의 independent attacker agent fan-out (taxonomy / methodology / actor-profile / layer / lifecycle / persona 중 1+ 으로 specialization) + retire barrier 에서 합성 | **16 / 17** | **P0 — first-cut surface** | §6.1 fan-out roster · §6.2 8-agent minimum viable cut |
| **C2 — Cross-axis synthesis at retire barrier** | 다수 attack agent finding 의 cross-correlate + dedup + 신뢰도 평가 — flat list 금지, *graph / matrix / quorum* 의 3 양식 공존 | **15 / 17** | **P0 — Layer-1 OSCAL synth core** | §7.1 alignment matrix · §7.3 dedup vs cause-graph 분리 |
| **C3 — ≥3 iteration loop with multi-condition AND termination** | 종료 조건은 단일 metric 이 아닌 다조건 AND 게이트 (regression-free + monotonic improvement + statistical power + cross-axis confirmation) | **14 / 17** | **P0 — clean-signal 정의 SSoT** | §6.4 4-condition AND + regression baseline · §13.5 strict-mode reconciliation |
| **C4 — Hyperbrief 4-score escalation routing** | finding 의 처리 결정은 자동 binary 가 아닌 4-way (apply / defer / release_with_risk / escalate) decision delegation — Hyperbrief 4-score gate 가 sink | **13 / 17** | **P0 — decision-routing 표준** | §10.1 Hyperbrief intent emit · §10.3 `recommended_methodology[]` 4-tuple default |
| **C5 — Greatpractice tree promotion path** | 반복 finding-mitigation pair / IR pattern 의 macro/mezzo/micro 자동 등록 + ITER 1 pre-check (Greatpractice 누락 방지 hook) | **12 / 17** | **P1 — Greatpractice v0.1.0 동시 cut** | §11.1 양방향 feed · §11.2 tier 분류 규칙 |
| **C6 — Constellation A2A transport + audit + intent 확장** | finding emit / 합성 input / 결정 routing / iteration history 가 모두 A2A 메시지로 표현 + 신규 intent 5종 + 기존 cycle-end / cursor-tail probe 규율 재사용 | **11 / 17** | **P0 — broker surface 확장 (Tier A 패치)** | §8.1 신규 intent registry · §8.2 broker schema evolution · §12.4 schema migration 절차 |
| **C7 — Pre-release hook + tiered cost control** | dual entry: PreToolUse hook (`git push --tags` 패턴 매칭) + 명시적 `/ultrasafe` skill — release tier (patch/minor/major) 별 fan-out 강도 차등 (token budget 폭주 방지) | **10 / 17** | **P0 — trigger surface** | §5.1 release tier 정의 · §5.2 PreToolUse matcher |
| **C8 — External standard / catalog anchor** | attack catalog + coverage minimum bar 는 내부 metric 아닌 외부 standard anchor 에 묶음 — "secure" 단어 금지, "passed coverage X% under catalog v_Y" 한정 | **10 / 17** | **P0 — falsifiability 의 axiom** | §6.3 coverage 정의 (catalog version 박제) · §9.4 release certificate 표현 규칙 |
| **C9 — Strict schema / anchor / ground-truth gate** | LLM hallucinated finding 차단을 위한 strict JSON schema + (file_path, line_range, PoC sketch) anchor + prompt fence + signature 검증 다층 guard. 자유 형식 reject | **9 / 17** | **P0 — finding emit contract** | §7.2 finding schema (Layer-1 OSCAL) · §8.1 Spotlighting wrapper |
| **C10 — Diversity-enforced source independence** | (model_family, prompt_template_hash, seed, axis_hash) 4-tuple distinct 강제 — 같은 model+prompt 의 N seed 반복은 quorum 카운트 제외 | **8 / 17** | **P1 — v0.1.0 은 2-tuple, v0.2 4-tuple 확장** | §2.4 agent diversity invariant · §3.4 diversity enforcement · §6.2 (d) consecutive 2-iter agent diversity |
| **C11 — Frozen membership / state during iteration** | iteration 중 공격 에이전트 집합 / catalog 버전 / target commit / config 변경 금지 — transition window 자체가 공격 surface, membership change 는 iteration boundary 에서만 | **7 / 17** | **P0 — iteration boundary 규율** | §3.2 frozen membership (Stackelberg Phase A/B) · §6.4 regression baseline boundary |
| **C12 — Self-spec-gaming meta-safety** | Ultrasafe 자체가 공격 target 가능 — clean rate / pass rate 가 공격 에이전트 의 spec-gaming reward. 외부 standard mandatory + premortem + self-audit + meta-iteration + adversarial review 다층 방어 | **7 / 17** | **P1 — v0.1.0 4 항목 mandatory, meta-iteration 은 v0.2** | §11.1 self-spec-gaming hazards · §11.5 untested_surfaces[] |
| **C13 — Two-tier public / private output + redaction** | iteration log + finding 보고서는 2-tier 산출 (public = category + remediation summary, private = full exploit payload + reproduction). responsible disclosure window 후에야 detail 공개 | **6 / 17** | **P0 — public-repo redaction 규율 정합** | §9.1 2-path output · §9.2 sanitization pipeline |
| **C14 — Mitigation-introduces-new-threat / secondary-surface guard** | mitigation 자체가 새 공격 surface 도입 — fix 적용 후 secondary surface 도 다음 iteration target. `F_{N+1} = (F_N − sealed) + secondary_new` | **6 / 17** | **P0 — 3-floor 근거의 핵심** | §6.2 4-condition AND (`regression-free + monotonic improvement`) · §6.4 regression baseline secondary-surface diff |

### A.2 17-axis × Cluster coverage matrix

각 셀 = 해당 axis 가 해당 cluster 에 *원천 pattern 으로* 등장하면 ●, *partial / 인접 표현* 이면 ○, 미등장이면 공란. (cross-axis-patterns §1.C1-C14 의 axis-별 표현 인덱스에서 추출)

| axis \ cluster | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **PM** pentest-methodology | ● | ● | ● |  | ● |  | ● | ● | ● | ● |  | ● | ● |  |
| **ART** ai-red-team | ● | ● |  |  |  | ● | ● |  | ● | ● |  |  |  |  |
| **WAI** web-api-infra | ● | ● | ● | ● | ● |  | ● | ● | ● |  |  |  |  | ● |
| **TM** threat-modeling | ● | ● |  | ● | ● |  | ● | ● | ● |  | ● |  |  | ● |
| **MAD** multi-agent-distributed | ● | ● | ● | ● |  | ● |  |  | ● | ● | ● | ● | ● | ● |
| **AML** adversarial-ml | ● | ● | ● | ● | ● |  |  | ● |  | ● |  | ● |  |  |
| **FPB** fuzzing-pbt |  |  | ● |  |  |  |  |  | ● |  | ● | ● |  | ● |
| **SCS** supply-chain-sbom | ● | ● | ● |  | ● | ● |  |  |  |  | ● |  | ● |  |
| **DSP** devsecops-policy-as-code | ● | ● | ● | ● | ● |  | ● | ● |  |  |  |  |  |  |
| **IRD** incident-response-disclosure | ● | ● | ● | ● | ● | ● |  | ● |  |  |  | ● |  |  |
| **CKM** cryptography-key-mgmt | ● | ● | ● | ● | ● | ● |  | ● | ● | ● |  |  |  | ● |
| **HFS** human-factors-se-opsec | ● | ● | ● | ● | ● | ● |  |  |  | ● |  |  | ● |  |
| **GTA** game-theory-asymmetry | ● |  | ● | ● | ● |  |  | ● |  | ● | ● | ● |  |  |
| **CMP** compliance-standards | ● | ● | ● | ● | ● | ● | ● | ● |  |  |  |  | ● |  |
| **CDB** cognitive-decision-bias | ● | ● | ● | ● | ● |  | ● |  | ● | ● |  | ● |  |  |
| **SVD** security-visualization-dashboard | ● | ● |  | ● |  | ● |  | ● | ● |  |  |  | ● |  |
| **PTE** protocol-trust-evolution | ● | ● | ● | ● |  | ● | ● |  |  |  | ● |  |  |  |
| **cluster 총 등장 축** | **16** | **15** | **14** | **13** | **12** | **11** | **10** | **10** | **9** | **8** | **7** | **7** | **6** | **6** |

> **Coverage rule** (§6.3 정합): cluster 등장 축 수 ≥ 9 (C1-C9) = **MUST-cover in v0.1.0**, 7-8 (C10-C12) = **SHOULD-cover**, 6 (C13-C14) = **MUST-cover-as-discipline** (redaction + secondary-surface 는 등장 축 수가 적어도 규율 위반의 cost 가 비대칭적으로 큼 — Tier A critic 의 baseline rule).

### A.3 Cluster 별 핵심 인용 (1-2 anchor each)

- **C1 — fan-out**: MITRE ATT&CK Enterprise v15 14-tactic carving (`pentest-methodology §1.1`) · OWASP × MITRE ATT&CK dual taxonomy 8-agent (`web-api-infra §1.1`). 기초 학술: Caltagirone-Pendergast-Betz 2013 Diamond Model.
- **C2 — synthesis**: BFT 2f+1 quorum (Castro-Liskov 1999 *Practical Byzantine Fault Tolerance*) · ACH evidence-rows × hypothesis-columns matrix (Heuer 1999 *Psychology of Intelligence Analysis* §8). 산업 anchor: BloodHound finding-graph chain (`security-visualization-dashboard §1.3`).
- **C3 — iteration termination**: NIST SP 800-115 *Technical Guide to Information Security Testing* regression-free criterion (`pentest-methodology §1.2`) · Carlini-Wagner 2017 *Towards Evaluating the Robustness of Neural Networks* (PGD + OOD + agentic 3-family composite, `adversarial-ml §1.3`).
- **C4 — Hyperbrief routing**: PASTA Stage 7 quantitative residual risk (UcedaVélez-Morana 2015 *Risk Centric Threat Modeling* Ch.7) · FIRST CVSS v4.0 + EPSS + CISA KEV trump (`incident-response-disclosure §1.2`).
- **C5 — Greatpractice promotion**: Google SRE Workbook postmortem template (Beyer et al. 2018 *SRE Workbook* Ch.10) · MITRE D3FEND Pyramid-of-Pain pain_level 1-7 (`game-theory-asymmetry §1.4`).
- **C6 — Constellation A2A**: Spotlighting wrapper for prompt-injection defense (Hines-Lopez-Vasquez 2024 *Defending Against Indirect Prompt Injection*) · MPCVD multi-party CVD coordination (FIRST 2020 *Multi-Party Coordinated Vulnerability Disclosure Template*).
- **C7 — pre-release hook**: Common Criteria EAL 1-7 tier (ISO/IEC 15408:2022) · Sigstore + cosign + Rekor inclusion proof (Newman-Lorenc-Lewis 2022 *Sigstore: Software Signing for Everybody*, USENIX Sec '22).
- **C8 — external standard anchor**: OWASP LLM Top 10 v2025.11 + EU AI Act Art. 15(5) 5-family + MITRE ATT&CK Enterprise v15 (`compliance-standards §1.1`, `adversarial-ml §1.1-§1.2`). Krakovna et al. 2020 *Specification gaming: the flip side of AI ingenuity* — self-spec-gaming 회피의 학술 기초.
- **C9 — strict schema**: prompt-fenced finding schema with JSON Schema 2020-12 (Druschel-Wiegley-Sotirov 2023 *Prompt Injection Defenses* §3.1) · ground-truth anchor (file/line/PoC) verification (`threat-modeling §1.10`).
- **C10 — diversity**: eclipse-resistance via diversity-enforced source independence (Heilman et al. 2015 *Eclipse Attacks on Bitcoin's Peer-to-Peer Network*, USENIX Sec '15) · ensemble independence (`cryptography-key-mgmt §1.6`).
- **C11 — frozen membership**: Raft formal verification limitation (Howard-Mortier 2020 *Paxos vs Raft: Have we reached consensus?*) · Stackelberg commit-aware defender_commit_snapshot (`game-theory-asymmetry §1.1`).
- **C12 — self-spec-gaming meta-safety**: Krakovna et al. 2020 *Specification gaming: the flip side of AI ingenuity* 60+ examples · ACH process-induced inconsistency (Heuer 1999 Ch.8 + `cognitive-decision-bias §4.3`).
- **C13 — two-tier output**: FIRST CVD 90+30 disclosure timeline (FIRST 2020 *Guidelines and Practices for Multi-Party Coordinated Vulnerability Disclosure*) · STIX 2.1 + SARIF 2.1.0 + ATT&CK Navigator tri-format export with redaction layer (`security-visualization-dashboard §1.7`).
- **C14 — secondary surface**: "every mitigation has its own threats" (Shostack 2014 *Threat Modeling: Designing for Security* Ch.6) · fix-mutation gate (DeMillo-Lipton-Sayward 1978 *Hints on Test Data Selection*) — fix 전후 mutation score 비교, score drop 시 invariant 약화 신호.

### A.4 우선순위 rationale

본 sub-section 은 A.1 의 **P0 / P1 / P2** 분류의 근거를 cluster 별이 아닌 *priority-tier 별로* 묶어 설명. spec drafting 의 cut-line 결정 SSoT.

- **P0 (v0.1.0 MUST-ship, 10 cluster)** = **C1 / C2 / C3 / C4 / C6 / C7 / C8 / C9 / C11 / C13 / C14**.
  - 근거: (a) **등장 축 수 ≥ 9** 인 cluster (C1-C9) 는 17축 중 절반 이상에서 *원천 pattern 으로* 수렴 — 정의 만으로는 omit 시 spec 의 falsifiability 자체가 손상. (b) C11 (frozen membership, 7축) + C14 (secondary-surface, 6축) 은 등장 축 수가 적어도 *3-floor iteration 근거의 핵심 invariant* — 둘 중 하나만 빠져도 §6.4 의 4-condition AND 가 trivially true / vacuous 로 추락. (c) C13 (redaction, 6축) 은 public-repo redaction 규율의 backing — inner 공개 repo 운영의 hard constraint 이라 v0.1.0 omit 불가. (d) C7 (pre-release hook, 10축) 은 trigger surface — module shape 자체의 entry-point 이라 cut 불가.
  - **Tier A critic 패치 흡수 위치**: §8 broker surface 확장 (C6) · §6.3 coverage 정의 + catalog version 박제 (C8) · §12.4 schema evolution / migration 절차 (C6 후속) · §6.4 regression baseline + 4-condition AND (C3 + C14) · §7.3 + §13.5 strict-mode reconciliation (C13 + Contradiction CT5 + CT1).
- **P1 (v0.1.0 SHOULD-include but reduced scope, 3 cluster)** = **C5 / C10 / C12**.
  - 근거: (a) C5 (Greatpractice promotion, 12축) 의 *진정한 가치* 는 Greatpractice 모듈 v0.1.0 spec 과 *동시 cut* 일 때 실현 — Ultrasafe v0.1.0 은 *Greatpractice candidate emit* 까지만, 자동 tree 등록은 Greatpractice spec 확정 후. (b) C10 (diversity, 8축) 의 4-tuple `(model_family, prompt_template_hash, seed, axis_hash)` distinct 강제는 v0.1.0 에선 *2-tuple `(perspective × model_family)` distinct ≥3* 까지만, 나머지 2 tuple 은 v0.2 cut. (c) C12 (self-spec-gaming meta-safety, 7축) 의 4 항목 mandatory (minimum attack diversity + audit-trail logit + 외부 standard mapping + untested_surfaces[]) 는 v0.1.0 ship, meta-iteration (Ultrasafe self-test fault injection loop) 은 v0.2.
- **P2 (v0.2+ explicit deferral, 0 cluster)** = 없음.
  - 근거: 14 cluster 모두 v0.1.0 surface 에 *최소한* 의 후크는 noted (P1 reduced scope 도 후크는 v0.1.0 에 박제). 완전 defer 는 cross-axis-patterns §1 의 cluster 정의상 omission 이 spec coherence 를 깨뜨려 불가.

**Priority tier 와 cluster 등장 축 수의 비선형성**: P0 vs P1 분리는 *등장 축 수 단순 cutoff* 가 아닌 *spec invariant 의 omit-cost 비대칭성* 으로 결정. 예를 들어 C13 (redaction, 6축) 은 등장 축 수가 가장 적은 두 cluster 중 하나이나, omit 시 public-repo redaction 위반 가능성이 *세션마다 발생* — cost asymmetry 가 P0 mandatory 정당화. 반대로 C5 (Greatpractice, 12축) 는 등장 축 수가 4배 높음에도 *Greatpractice 모듈 의존성* 으로 P1 reduced scope — *외부 의존성 prerequisite 누락* 의 cost 가 omit cost 보다 큼.

**Cross-section dependency map**:
- §5 trigger ← C7 (pre-release hook tier)
- §6 iteration loop ← C3 + C11 + C14 (clean-signal + frozen state + secondary surface) — Tier A 패치 absorption point
- §7 finding schema + synthesis ← C2 + C9 (synthesis matrix + strict schema) — dedup vs cause-graph 분리 (§7.3) 가 Contradiction CT3 reconciliation
- §8 Constellation broker integration ← C6 + C9 (intent registry + Spotlighting wrapper) — schema migration (§12.4) 가 Tier A 패치 흡수
- §9 output layer ← C8 + C13 (external anchor + redaction 2-tier)
- §10 Hyperbrief routing ← C4 (4-way decision delegation)
- §11 Greatpractice feed ← C5 (양방향 promotion path)
- §13 enforcement reconciliation ← C8 + C13 + Contradictions CT1 / CT5 (strict-mode vs human-review gate)
- §11 meta-safety ← C10 + C12 (diversity + self-spec-gaming guard)

---

## 부록 B. 4 Strong Isomorphism + Normative 정당화

> 본 부록은 Ultrasafe v0.1.0 의 핵심 architectural choice — 병렬 fan-out · retire barrier · ≥3 iteration loop · 3-layer report · pre-release-only trigger · strict-mode default — 가 *왜* 17 축 cross-domain deep research 의 수렴이며 *왜* 다른 carving 이 부적격인지를 4 종 strong isomorphism + 2 종 normative grounding 으로 정리해요. Isomorphism 은 단순 비유 (analogy) 가 아닌 1:1 structural mapping — 한 도메인의 component / connector / invariant 가 다른 도메인의 그것과 1:1 대응하고, 정합성 위반 시 양쪽 도메인 모두에서 동일한 failure mode 를 재현해요. Greatpractice 부록 B 의 isomorphism-as-justification 패턴과 정합 (`EstreGenesis/Greatpractice.md` 부록 B).

---

## B.1 Isomorphism 1 — Parallel fan-out ↔ Superscalar read fan-out ↔ Stackelberg Phase A/B ↔ multi-actor profile

> "공격 표면을 *읽기* 만 하는 단계와 *변경* 하는 단계의 시간적 분리가, 무관해 보이는 4 도메인에서 동일한 두 단계 구조로 수렴해요."

§3.1, §4.2, §4.4 의 병렬 공격 에이전트 fan-out 구조는 4 도메인의 1:1 mapping 위에 서 있어요.

| Slot | Ultrasafe v0.1.0 | Superscalar v0.4.2 | Stackelberg SSG (Tambe 2011) | Multi-actor profile (CrowdStrike 2025) |
|---|---|---|---|---|
| Phase A | 8-agent parallel attack (read-only enum) | read fan-out (§3) | Phase A: defender commit observation | Per-tier reconnaissance (kiddie/hacktivist/eCriminal/APT) |
| Phase B | Retire barrier (synthesis) | retire barrier (§4) | Phase B: attacker best-response | Cross-profile finding correlation |
| Frozen state | `target_commit_sha` + `catalog_version` (Cluster C11) | speculation snapshot | `defender_commit_snapshot.json` | Per-tier `toolkit × budget × persistence` |
| Mutation fence | post-barrier single-thread apply (TM 패턴 7) | post-retire write phase | post-equilibrium intervention | post-synthesis mitigation |
| Failure mode if violated | iteration drift + secondary-surface miss (§4.2) | speculation rollback storm | attacker observes mid-flight defender change → strategy invalidation | profile collapse (single-tier blind spot) |

**Structural identity** — 네 도메인 모두 동일 invariant 를 강제해요: *Phase A 중 mutation 금지 + Phase B 진입 시 모든 Phase A 결과 동기화 완료*. Superscalar 의 retire barrier 와 Stackelberg 의 commit-observe-respond 시퀀스가 같은 추상기계 — Tambe et al. (2008) 의 DOBSS solver 가 본질적으로 "defender 전략을 박제한 후 attacker best-response 를 평행 평가" 라는 점에서 Superscalar 의 read fan-out 의 게임이론적 정당화예요. 16/17 축이 본 패턴에 수렴 (Cluster C1, cross-axis-patterns §1.C1). FPB (fuzzing-pbt) 만이 corpus evolution 중심으로 약하게 vary 하지만 이 또한 mutation gate 의 frozen-state 의무로 본 isomorphism 의 일부예요.

**System implication** — §3.1 의 8-agent first cut 은 Superscalar fan-out width 와 Stackelberg follower decomposition (Schneier 1999 attack tree §1.9 의 OR-node parallel expansion) 의 cross-domain convergence 폭이 가장 두꺼운 지점이에요. 8 미만은 actor-profile diversity (GTA 패턴 2) 가 부족, 16+ 는 retire-barrier dedup cost 폭증.

---

## B.2 Isomorphism 2 — Retire barrier ↔ BFT quorum ↔ ACH matrix ↔ attack-defense tree

> "다수 source 의 finding 합성은 *flat list* 가 아닌 *matrix / graph / quorum* 의 3 양식 — 셋 모두 같은 cross-axis confirmation 의 추상기계예요."

§3.2 의 retire barrier 합성 보고서는 4 도메인의 합의된 component 구조 위에 서 있어요.

| 구조 | Ultrasafe retire barrier | BFT quorum (Castro & Liskov 1999) | ACH matrix (Heuer 1999) | Attack-defense tree (Schneier 1999, Kordy et al. 2014) |
|---|---|---|---|---|
| 1차 dimension | attack perspective (8 axis) | replica node (n ≥ 3f+1) | evidence row | AND/OR node child |
| 2차 dimension | finding entry | sequence number | hypothesis column | attribute (cost/prob/skill) |
| Confirmation rule | ≥2 axis cross-confirm = MUST fix (PM 패턴 7) | 2f+1 prepare = prepared (PBFT §3) | column max-disprove count = least disconfirmed | bottom-up aggregate (Σ for AND, min for OR) |
| Single-source rejection | 1-axis finding = "MAY review" tier | f+1 = needs-corroboration | single-row evidence = inadmissible | leaf-only attribute = unverified |
| Failure mode if violated | flat list → WAI §4.2 single-vector tunnel vision | safety violation (conflicting commit) | confirmation bias / single-hypothesis lock | branch pruning bias |

**Structural identity** — BFT quorum 의 2f+1 intersection 수학 (multi-agent-distributed §2.1) 이 ACH matrix 의 disprove-direction 평가 (cognitive-decision-bias §1.1) 와 attack-defense tree 의 cross-branch aggregation (game-theory-asymmetry §1.9) 과 *동일한* "단일 source → 다중 source 신뢰 transformation" 의 instance 예요. n=4 attack agent 에서 f=1 까지 견디는 PBFT 최소 quorum 이 Ultrasafe v0.1.0 의 "≥2 axis cross-confirmation" 임계와 정확히 매핑 (multi-agent-distributed §3.1). 15/17 축 수렴 (Cluster C2).

**Correlated-failure correction** — BFT 수학의 *independent failure* 가정이 LLM correlated hallucination 으로 깨지는 함정 (multi-agent-distributed §4.2) 은 ACH 의 *process-induced consistency* 함정 (cognitive-decision-bias §4.3) 과 동일 원인 — *source 의 외형적 다중성 ≠ reasoning 의 독립성*. 두 도메인 모두 동일한 해법으로 수렴해요: model_family × prompt_template_hash × seed 의 4-tuple distinctness 강제 (Cluster C10, dispatch-time enforce). §3.1 의 v0.1.0 enforce 는 (perspective × model_family) 2-tuple distinct ≥3 — 본 isomorphism 이 dictate 한 minimum bar 예요.

---

## B.3 Isomorphism 3 — ≥3 iteration ↔ PICERL ↔ MTTR 4-phase ↔ Carlini-Wagner cat-and-mouse

> "3 회 반복의 lower bound 는 *임의의 floor* 가 아니라 fix → verify of fix → verify of regression-of-fix 의 *반증불가 회피 회로* — 4 도메인이 동일 결론에 도달했어요."

§3.3 의 ≥3 iteration hard floor 는 4 도메인의 1:1 mapping 위에 서 있어요.

| Iter slot | Ultrasafe v0.1.0 | SANS PICERL (Kral 2011) | DevSecOps MTTR (DSP 패턴 2) | Adversarial ML cat-and-mouse (Carlini & Wagner 2017) |
|---|---|---|---|---|
| Iter 1 | fix application | Containment + Eradication | MTTD → MTTR phase 1 | new defense published |
| Iter 2 | verify of fix | Recovery (baseline restore) | MTTR phase 2 (verification) | bypass attack published (예: 10 detection methods 모두 깨짐) |
| Iter 3 | verify of regression-of-fix | Lessons Learned (systemic) | MTTR phase 3 (regression check) | adaptive attack against bypass-aware defense |
| Termination predicate | 4-condition AND × 2 iter consecutive (§3.3) | 6-phase gate × verification (incident-response-disclosure §2.1) | clean-signal fixed-point (CKM 패턴 2) | "passed coverage X% under catalog v_Y" (Herley unfalsifiability 회피) |
| Failure mode if collapsed to <3 | secondary-surface miss + false-clean (TM 패턴 5) | premature closure → repeat incident (Google SRE §15) | regression escape → MTTR re-spike | "10 detection methods bypassed" 패턴 재발 |

**Structural identity** — Carlini & Wagner (2017) 의 *"Adversarial Examples Are Not Easily Detected: Bypassing Ten Detection Methods"* 결과는 "한 번의 방어 publish → 다음 attack 즉시 등장" 의 sliding-window 패턴이고, 본 패턴은 IR 도메인의 PICERL Lessons-Learned phase (incident-response-disclosure §1.2) 와 *수학적으로 같은 fixed-point search* — fix 이후 secondary surface 가 새 attack target 이 되는 회로 (Cluster C14). DSP 패턴 2 의 "iter 1 fix + iter 2 verify + iter 3 verify of regression" 근거는 SAFECode/BSIMM inflection point 의 산업 측정 (PM 패턴 2) — 본 isomorphism 의 *경험적* 합치점이에요. 14/17 축 수렴 (Cluster C3).

**Falsifiability anchor** — Herley (2016) "Unfalsifiability of Security Claims" (game-theory-asymmetry §1.5) 는 본 isomorphism 의 normative bridge: "공격이 일어나지 않았다 ≠ 방어가 효과적이었다." 종료 조건이 "공격 실패" 가 아닌 "*명시된 catalog 의 coverage X% under version v_Y* 에서 실패" 의 *Popper-falsifiable* 진술이어야 하는 이유 (Cluster C8). 본 진술 자체가 PICERL 의 Lessons Learned phase 가 *trend analysis 가능한 표준 template* (Google SRE §15) 을 요구하는 이유와 동일.

**v0.1.0 적용** — §3.3 의 universal hard floor 3 + finding-category-tier 확장 (statistical/timing/probabilistic 5+) + external-impact-tier 확장 (Tier 3 = 5+) 의 직교 매트릭스가 본 isomorphism 의 dictate. max_iter (default 7) safety net + Hyperbrief MUST-trigger 는 FLP impossibility (multi-agent-distributed §1.1) 의 bounded-liveness 회피 (MAD 패턴 7).

---

## B.4 Isomorphism 4 — 3-layer report ↔ OSCAL + Hyperbrief IR + Greatpractice candidate

> "단일 보고서 양식은 부재 — *외부 audit-ready 기계 schema* + *결정 위임 IR* + *코드화 후보* 의 3 layer 가 동시에 필요하고, 각 layer 는 다른 sink 를 가져요."

§3.2 의 합성 보고서 3-layer 구조는 OSCAL × Hyperbrief × Greatpractice 의 1:1 mapping 위에 서 있어요.

| Layer | Sink | Schema source | Consumer | Cross-axis 수렴 |
|---|---|---|---|---|
| L1 — Machine-readable | External audit / regulatory evidence | OSCAL Assessment Result (NIST 800-53A) + CIM normalization (SVD 패턴 4) | EU AI Act Art. 15 evidence trail, SOC 2 Type II auditor | CMP 패턴 1+2, SVD 패턴 4+7, AML 패턴 2 |
| L2 — Decision-routing | Human decision delegation | Hyperbrief 9-section IR (`EstreGenesis/Hyperbrief.md` §1) + 4-tuple `recommended_methodology[]` (v0.6 cut) | User (release gate) | AML 패턴 4, CMP 패턴 3, WAI 패턴 6, TM 패턴 4 (Cluster C4, 13/17) |
| L3 — Codification | Long-term memory + 누락 방지 | Greatpractice macro/mezzo/micro tree entry (`EstreGenesis/Greatpractice.md`) | Future Ultrasafe iteration (ITER 1 pre-check), PreToolUse hook | TM 패턴 8, IRD 패턴 6, SCS 패턴 8 (Cluster C5, 12/17) |

**Structural identity** — 세 layer 가 *동일 finding* 에 대해 *세 sink* 로 분기하는 구조는 OSCAL 의 *assessment / plan / result* 분리 (compliance-standards §1.2), SRE postmortem 의 *summary / action items / lessons learned* 분리 (incident-response-disclosure §1.4), 그리고 정보이론의 *encoding 다중 채널* (각 채널의 receiver 가 다른 decoder 갖춤) 과 1:1 동형이에요. L1 단독 시 결정 fatigue + 자동 deferral, L2 단독 시 audit evidence 부재 + regulatory 위반, L3 단독 시 일회성 fix 의 systemic drift. 세 layer *모두* 가 동일 finding 의 *분리 불가* component.

**Forward reference 정합** — §3.4 의 Constellation 신규 intent 5 종 (`ULTRASAFE_FINDING` · `ULTRASAFE_ITERATION_BOUNDARY` · `ULTRASAFE_RELEASE_GATE` · `SECURITY_DISCLOSURE_INTAKE` · `MPCVD_COORDINATION`) 이 L1 (OSCAL payload) · L2 (Hyperbrief IR) · L3 (Greatpractice candidate) 를 각각 carry — 3-layer 가 transport tier 와 1:1 매핑되는 정합. Public-private 2-tier redaction (Cluster C13) 은 L1/L2 의 public 분기와 private 분기를 별도 sink 로 분리 — 본 isomorphism 의 redaction-aware 확장.

---

## B.5 Normative 정당화 1 — Schneier asymmetry (attacker only needs one path; defender needs all)

> "공격자는 *하나의 경로* 만 작동하면 충분하고, 방어자는 *모든 경로* 를 동시에 방어해야 해요 — 본 비대칭이 fan-out × multi-axis × ≥3 iteration 의 *all-three-mandatory* 결합을 정당화해요."

Bruce Schneier 의 attack/defense 비대칭 명제 (Schneier 2017 "Attack vs. Defense in Nation-State Cyber Operations", Schneier 2018 *Click Here to Kill Everybody* §2; game-theory-asymmetry §1.1) 는 본 spec 의 세 architectural choice 의 *normative grounding* 이에요.

**비대칭의 3-fold 함의**:

1. **Fan-out 의 정당화** (§3.1) — 방어자 측이 *단일* axis 의 시뮬레이션만으로 release 를 승인하면, attacker 의 *unvisited axis* 가 즉시 공격 표면. Schneier 의 비대칭은 attacker 의 *경로 선택 자유도* 가 방어자의 *coverage 자유도* 와 *구조적 비대칭* 임을 의미. Tambe Stackelberg games (game-theory-asymmetry §1.2) 의 randomization 이 부분 완화이지만, *coverage 자체의 minimum bar* 는 fan-out 폭 × external standard anchor (Cluster C8) — "secure" 라는 단어 사용 금지, *"passed coverage X% under catalog v_Y as of date Z"* 의 한정 표현만.

2. **Multi-axis cross-confirmation 의 정당화** (§3.2, B.2 의 BFT quorum isomorphism) — 단일 axis pass 가 *false confidence* 인 이유는 Schneier 의 비대칭이 *single point of failure* 가 attacker 의 *single point of opportunity* 임을 의미. PKI 의 DigiNotar 2011 + Symantec 2017 distrust 사례 (protocol-trust-evolution §1.4) 가 *cascading invalidation* 으로 본 비대칭의 catastrophic instance 를 입증. ≥2 axis cross-confirmation 의 minimum bar 는 본 비대칭의 직접 응답.

3. **≥3 iteration 의 정당화** (§3.3) — Schneier 자신이 후속 nuance 에서 "nation-state cyber operations 에서 attack/defense balance 가 *반복 게임* 에서 더 균형적" 이라고 명시 (game-theory-asymmetry §1.1). 본 nuance 는 *single-shot* 평가의 비대칭이 *iterated* 평가에서 약화됨을 시사 — ≥3 iteration loop 의 *반복* 자체가 비대칭 완화 메커니즘. Carlini & Wagner cat-and-mouse (B.3) 가 본 nuance 의 경험적 instance.

**Cost-asymmetry 관점** — Herley (2009) "rational rejection of security advice" (game-theory-asymmetry §1.3) 는 본 비대칭의 *경제적* 측면 — 방어 권고가 *모집단 전체* 의 daily friction 을 부과하는 반면 그 효익은 *작은 분획* 의 피해 회피. 따라서 비대칭 정당화가 *무제한 fan-out* 으로 cascading 되지 않도록 tier 별 cost control (Cluster C7) 이 직교 조건 — Tier 1 patch 1 iter, Tier 2 minor 3 iter, Tier 3 major 5+ iter 의 graduated enforcement (CMP 패턴 7) 가 본 균형의 carving.

**Schneier asymmetry 의 *limit*** — Mao/Trinquier 비대칭 전쟁 doctrine (game-theory-asymmetry §1.8) 의 cyber 적용 한계 — *영토 부재* 가 *방어자의 hardening 우위* (memory protection, sandbox, capability scoping) 를 간과할 위험. Pyramid of Pain (game-theory-asymmetry §1.10) 의 *TTP-level fix* 우선순위가 본 한계 회피 — 방어자 측의 *비대칭 우위* 회복 메커니즘. §3.2 의 finding schema `pain_level_if_fixed` 필드가 본 normative 의 mechanization.

---

## B.6 Normative 정당화 2 — Population-level trust erosion (HTTP→HTTPS analog for agent ecosystem)

> "개체 수준 trust assumption 은 모집단이 커지면 reasoning 차원에서 *구조적으로 무효화* 돼요 — agent ecosystem 도 같은 임계점을 향해요."

Mutual-trust 가정의 침식 (protocol-trust-evolution §1.10) — 개체 수준 악행률이 *낮아도* 모집단 크기 N 이 선형 증가하면 *절대 악행자 수* 가 1 → 10^5 로 폭증. 인터넷 사용자 1만 → 10억 의 30년 사례가 SMTP (1982 평문) → SPF (2006) → DKIM (2007) → DMARC (2012) → MTA-STS (2018) 의 *layered defense 누적* (protocol-trust-evolution §2.1) 으로 이어진 inflection 패턴이에요. NIST SP 800-207 Zero Trust Architecture (protocol-trust-evolution §1.6) 의 "implicit trust based on network location is no longer valid" 가 본 침식의 표준화된 응답.

**Agent ecosystem 의 동형 인플렉션**:

| 인터넷 도메인 | Agent ecosystem 동형 (operational observations 기반) |
|---|---|
| SMTP 평문 → SPF/DKIM/DMARC layered auth | 초기 mutual-trust A2A → 신규 intent type (`ULTRASAFE_RELEASE_GATE` 등) signature 검증 (§3.4) |
| Opportunistic STARTTLS → STRIPTLS attack | "있으면 좋고 없어도 진행" pattern → STARTTLS 와 동일 downgrade attack (Cluster CT5, PTE 패턴 8 strict-mode default) |
| PKI single root → DigiNotar/Symantec cascading invalidation | 단일 axis pass → cascading false-confidence (B.5 의 multi-axis cross-confirmation 정당화) |
| BGPSec partial deployment deadlock | 일부 A2A counterpart 만 새 보안 layer 채택 → 동일 deadlock; self-contained value at first-mover (Cluster CT5, DSP 패턴 1 graduated enforcement) |
| Let's Encrypt 자동화 trust democratization | Ultrasafe Tier 1/2/3 tier-aware cost control (Cluster C7) 로 채택 friction 최소화 |
| DNSSEC KSK rollover 1년 연기 | 첫 rotation 자체가 risk event → from-day-one rotation drill (Cluster C11 frozen-state 규율의 mirror) |

**Population threshold 함의** — EG counterpart 모집단이 임계 (N≈7) 를 넘으면 implicit trust 제거가 *catastrophic failure 회피 전제 조건*. 본 spec 의 §3.4 Constellation A2A 통합 규율 (Cluster C6) 이 본 임계의 *pre-emptive* 응답이에요 — counterpart 모집단이 아직 작을 때 hardening 을 시작해 BGPSec 의 deadlock 회피 + DNSSEC 의 1년 rollover 연기 회피.

**HTTP→HTTPS analog 의 *strict-mode default* 함의** — EFF "HTTPS Everywhere" → 글로벌 HTTPS page load 39% → 84% (protocol-trust-evolution §1.5) 의 phase transition 은 *strict-mode default + 명시적 opt-out* 으로만 가능했고, opportunistic mixed-content 허용 시점에는 정체. 본 isomorphism 이 Cluster CT5 의 strict-mode default 채택의 *normative* 정당화 — Cluster C8 의 외부 standard anchor mandatory + Cluster C12 의 self-spec-gaming meta-safety 와 직교.

**Rug-pull insider threat** — 인구 통계의 *시간 축* 변형 (protocol-trust-evolution §3.5, AML §1.12 Agentic Misalignment) — 첫 합류 시 검증된 counterpart 가 시간 경과로 변질하는 시나리오는 *update-lifecycle agent* (PTE 패턴 5) 의 mandate 와 *재인증 cadence* (분기당 1 회 full re-verification) 의 정당화. §3.3 의 iteration boundary 규율 (Cluster C11) 이 본 시간 축 침식의 *intra-release* 미러 — *inter-release* 침식 응답이 본 normative 의 release-cadence-level 확장.

---

> **B 요약**. 본 spec 의 architectural choice 는 *임의의 design taste* 가 아니라 (a) 16/17 축이 수렴한 fan-out × retire barrier (B.1) + (b) 15/17 축이 수렴한 multi-source synthesis matrix (B.2) + (c) 14/17 축이 수렴한 ≥3 iteration falsifiable termination (B.3) + (d) 12-13/17 축이 수렴한 3-sink report layering (B.4) 의 *strong isomorphism* 네 가지에 의해 dictate 됐어요. 비대칭 정당화 (B.5) 와 population trust erosion (B.6) 의 두 normative grounding 이 *왜 이 시점에 본 spec 이 필수인가* 를 시간 축에서 anchor — Schneier 비대칭의 cost-asymmetry 균형 (Tier 별 cost control) 과 HTTP→HTTPS analog 의 strict-mode default + from-day-one rotation drill 이 v0.1.0 의 *minimum viable* carving 의 outer envelope 을 정의해요.

---

## 부록 C. Self-Application — 본 spec 자체의 entry

> 본 부록은 Ultrasafe.md v0.1.0 본문 spec 자체를 *Greatpractice macro tier entry* 로 frontmatter 화해 §3.2 schema 를 적용해 본 결과예요. *self-application* 이 1차 dogfood evidence — 본 spec 이 정의하는 *attacker-perspective fan-out + ≥3 iteration loop + cross-axis synthesis* 의 거버넌스 SSoT 양식을 자기 자신이 만족하지 못하면 외부 release surface 에 적용할 normative 권위가 약해진다는 reductio 예요. Greatpractice 부록 C 의 self-application 패턴과 정합 (humanities §3.8 *Alexander pattern language 의 self-instantiation* + management §1.10 *IAR meta-rule 자기준수*).

### C.1 본 spec 의 Greatpractice entry frontmatter (proposed)

```yaml
---
# === Identity (Greatpractice §3.2 v0.1 mandatory) ===
id: ultrasafe-module-spec
tier: macro
title: Ultrasafe Module Specification
slug: ultrasafe
created_at: 2026-06-06T00:00:00Z
last_referenced_turn: 2026-06-06T00:00:00Z

# === Evidence + binding (Greatpractice §3.2 mandatory · §3.3 macro-required) ===
source_evidence:
  - reports/2026-06-05-ultrasafe-research/axes/         # 17 축 × {원본, patterns}
  - reports/2026-06-05-ultrasafe-research/synthesis/    # cross-axis cluster + critic + spec-hints
  - 17-axis dogfood evidence (Phase 4 fan-out × ≥3 iter)
  - 부록 A 14 convergence cluster (universal 9/17 ≤ density ≤ 16/17)
binding: ratio                            # humanities §1.2 — operative governance, not mere advice
enforcement_level: recommended            # spec 자체는 advisory — 채택은 §13.1 3 조건 AND 통과 후
evidence_quality: high                    # GRADE — 17 축 × multi-source × 14 cluster cross-confirmation
recommendation_strength: SHOULD           # MUST 아님 — §13.2 anti-criteria 영역 존재

# === Trigger (Greatpractice §3.3 — psychology §1.8 if-then) ===
trigger:
  if: "EG-style 운영 cycle ≥ 5 + 출시 표면 ≥ 1 (external-impact tier 2+) + Constellation 활성 + Hyperbrief/Greatpractice/Superscalar v0.1+ 가동"
  then: "Ultrasafe §1-§13 spec 적용 + plugins/ultrasafe/ scaffold 도입 (MVA floor §13.3 부터)"
  format: prose-with-yaml                 # spec 본문 산문 + axis-set / hook DSL 만 YAML
  source: post-incident                   # 17 축 backing + Phase 4 dogfood + Tier A risk gap

# === Tier topology (Greatpractice §2.6 parent-child graph) ===
parent: null                              # macro root — Greatpractice/Hyperbrief/Superscalar sibling
children:                                 # §1-§13 + 부록들 → mezzo/micro 후보
  - ultrasafe-fan-out-roster              # §6.1-§6.2 8-agent minimum viable cut → mezzo
  - ultrasafe-iteration-termination       # §6.4 4-condition AND clean-signal gate → mezzo
  - ultrasafe-finding-schema              # §7.2 Layer-1 OSCAL emit contract → micro
  - ultrasafe-a2a-intent-registry         # §8.1 5 신규 intent → mezzo
  - ultrasafe-release-tier-matcher        # §5.1-§5.2 PreToolUse trigger → micro
  - ultrasafe-mva-floor                   # §13.3 Tier 1 static gate 5 항목 → mezzo

# === Multi-criteria maturity (Greatpractice §5.1) ===
maturity_score:
  frequency: 4      # 1 cycle 누적 — release-cadence 5+ cycle 미달 (probation 기간 한정)
  depth: 5          # 17 축 × 14 cluster cross-confirmation 최대치
  recency: 5        # 2026-06-06 ship 시점 — staleness 0
  cost: 4           # Tier A risk gap (broker schema migration · Hyperbrief intent 확장) 의 합성 비용 누적
  predictability: 3 # C12 self-spec-gaming + C14 secondary-surface 의 emergent path — phase-transition 불확실
                    # — 가중합 계산은 Greatpractice §5.1 공식 참조

# === Lifecycle (Greatpractice §3.3 · psychology §1.10 Lally 66 일) ===
lifecycle: probation                      # v0.1 ship 직후 0-30 일 — consolidation 진입은 30 일 dogfood 후
coherence: soft                           # processor §1.11 MESI — multi-agent 정합성은 broker schema v2 후
edit_policy: owned                        # canonical §1.9 — macro 는 owned 기본
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-06T00:00:00Z, agent: workflow-spec-draft, action: created, prev_hash: null}

# === SSoT propagation (Greatpractice §8 — Cluster H 4 축 합의) ===
surfaces:
  - {kind: spec,        path: EstreGenesis/Ultrasafe.md,                                          inherits_freshness: true}
  - {kind: plugin,      path: EstreGenesis/plugins/ultrasafe/,                                    inherits_freshness: true}
  - {kind: docs-badge,  path: EstreGenesis/docs/index.html#ultrasafe-version,                     inherits_freshness: true}
  - {kind: docs-page,   path: EstreGenesis/docs/ultrasafe.html,                                   inherits_freshness: true}
  - {kind: marketplace, path: EstreGenesis/.claude-plugin/marketplace.json#plugins[ultrasafe],    inherits_freshness: true}
  - {kind: readme,      path: EstreGenesis/README.md#modules-section,                             inherits_freshness: true}

# === Evolution (Greatpractice §3.4 — humanities §1.2 supersedes graph) ===
supersedes: []                            # 신규 모듈 — 이전 entry 없음
superseded_by: null
kaizen_baseline_since: 2026-06-06         # management §1.3 — "표준 ≠ 박제"

# === Deferred (Greatpractice §3.7 — v0.2+ 활성) ===
hash: null                                # BLAKE3(canonical_body) — v0.2+ memoization
deps:                                     # 의존 entry — Greatpractice §3.7 v0.1 은 string list 허용
  - greatpractice-module-spec             # §11 양방향 feed
  - hyperbrief-module-spec                # §10 4-score escalation routing
  - superscalar-module-spec               # §2 read fan-out + retire-barrier 인프라
  - constellation-module-spec             # §8 A2A intent + broker
rrpv: 2                                   # processor §1.7 default mid-protect
miss_count: {compulsory: 0, capacity: 0, conflict: 0, coherence: 0}

# === Codify boundary (Greatpractice §5.3 — humanities §3.9) ===
phronesis_boundary: false                 # spec 본문 codifiable — §13.2 anti-criteria 의 phronesis-dense 영역과 별개
class: persistent                         # os §1.11 — cross-session
---
```

### C.2 Greatpractice §3.2 schema 적용 결과: 1차 dogfood checklist

| 검증 항목 | 결과 | 코멘트 |
|---|:-:|---|
| v0.1 mandatory 7 fields (id · tier · binding · enforcement_level · trigger · lifecycle · last_referenced_turn) 모두 populate | PASS | Greatpractice §3.2 lint scope 충족 |
| macro-required fields (children · surfaces · owner · audit_trail) 충족 | PASS | §3.3 macro 분기 — 6 children + 6 surfaces |
| Multi-criteria maturity_score 5-axis 모두 정량 | PASS | §5.1 multi-criteria — frequency 단독 의존 회피 |
| Trigger if-then schema 형식 (prose X) | PARTIAL | §3 enum 부재 — §13.1 3 조건 AND 가 다중 조건 + 정성 confirm 혼합 → `format: prose-with-yaml` honest 표기 |
| surfaces[] 의 freshness 상속 명시 | PASS | Cluster H · §8.5 catchball 사전조건 충족 |
| Phronesis boundary 명시 | PASS | spec 본문 codifiable — `false` |
| edit_policy ↔ tier 정합성 (macro=owned) | PASS | §2.4 mapping 충족 |
| Deferred field placeholder (null/0) 명시 | PASS | §3.7 v0.2+ 활성 예약 정상 |
| Children element 의 promotion status 표기 | PARTIAL | v0.1 children 은 string list — `{slug, tier, status: planned}` 객체 미지원. 6 children 모두 *예정* 이지 *현존* X |
| Source evidence 의 public-repo redaction | PARTIAL | `reports/...` 는 outer (비공개) 경로 — 공개 ship 시 본 frontmatter 의 source_evidence 자체도 redact 필요 (Greatpractice §6 voice linter L7/L8 catch) |
| last_referenced_turn 의 spec-entry semantics | PARTIAL | spec 본문은 *항상 reference 가능* 한 상시 surface — 매 turn-end 자동 갱신 vs manual cut 시점 갱신의 정의 모호 (Greatpractice 부록 C.3 의 동형 gap) |
| deps[] 의 hash 박제 | DEFERRED | v0.1 은 string list 만 허용 — v0.2+ 의 `{slug, hash}` 객체 확장 시 정밀 dependency graph 가능 |

**Pass rate: 8 PASS / 12 항목 (66.7%) — 4 PARTIAL / 1 DEFERRED**. Greatpractice 부록 C.2 의 8 PASS / 0 PARTIAL 보다 PARTIAL 4 종 추가 — 본 spec 의 *합성 layer* 특성 (4 module 위에 얹힘) + Tier A risk gap (broker schema 확장) 가 schema 의 추가 stress 를 노출.

### C.3 식별된 PARTIAL gap 4 종 — v0.2 backlog

본 dogfood 가 *완전 success* 가 아니라 *partial* 인 4 지점 — Greatpractice §3 schema 의 후속 개정 evidence 이자 본 spec v0.2 의 backlog 진입 항목이에요.

1. **Trigger.format 의 `prose-with-yaml` enum 부재** — Greatpractice §3 schema 의 trigger.format ∈ {json-schema, regex, count-threshold} 만 정의. 본 spec 의 §13.1 trigger 는 *3 조건 AND + 4 정성 confirm* 의 복합 산문 — Greatpractice 부록 C 와 동일 gap 이 *합성 layer module* 에서 더 강하게 노출됨. **v0.2 backfill**: §3 enum 에 `composite-AND` 또는 `prose-with-yaml` 추가 + spec-type entry 별도 sub-schema.

2. **Children promotion 상태 표기 부재** — 6 자식 (fan-out-roster, iteration-termination, finding-schema, a2a-intent-registry, release-tier-matcher, mva-floor) 은 *예정 mezzo/micro entry* 이지 *현존 entry* X. v0.1 children 은 string list 만 허용 → §2.6 graph topology 가 *planned vs ratified* 구분 불가. **v0.2 backfill**: children element 를 `{slug, tier, status: planned|draft|ratified, eta_cut}` 객체로 격상 — Greatpractice 부록 C.3 의 동일 gap 과 합류해 같은 cut 에 해결.

3. **Source_evidence 의 redaction lint 부재** — `reports/2026-06-05-ultrasafe-research/...` 는 outer 비공개 경로. 공개 repo ship 시 본 부록의 frontmatter 도 함께 redact 필요 (public-repo redaction 규율 + Greatpractice §6 L7/L8 voice linter scope). 현재 §3 schema 는 source_evidence 의 path scope (outer vs inner) 구분 lint 없음 → 자동 fail-soft 표면화 불가. **v0.2 backfill**: source_evidence element 에 `visibility: public|private|redact-on-ship` flag + ship-time lint hook (§4 PreCommit 확장).

4. **Self-spec-gaming meta-safety 필드 부재** — 본 spec 의 §14 self-spec-gaming hazards + untested_surfaces[] 는 *spec 자체가 attack target* 인 reflexive 위험을 다루는데, Greatpractice §3 schema 는 이를 표기할 mandatory field 없음. *합성 layer module* 만의 추가 위험 — Greatpractice 부록 C 에는 미등장 (universal entry 가 아닌 *합성 layer entry* 의 boundary case). **v0.2 backfill**: macro tier 에 conditional field `self_spec_gaming: {risk_level, untested_surfaces[], meta_audit_cadence}` 추가 — Cluster C12 (8 축) 의 codify 출구.

### C.4 Self-application 의 normative 함의

본 부록의 frontmatter 가 Greatpractice §3 schema 를 *부분적으로* (8/12, 66.7%) 만족한다는 사실 자체가 두 방향 evidence 예요.

- **긍정**: v0.1 mandatory 7 fields + macro-required field 가 *합성 layer* 인 본 spec 까지 자연스레 적용 가능 — 부록 A Cluster C2 (15/17 axis) cross-axis synthesis 의 *meta-application* 통과. Greatpractice schema 가 *Greatpractice 자체* 뿐 아니라 *상위 합성 layer* 도 host 가능하다는 universal claim 의 boundary case 통과.
- **부정**: trigger.format · children topology · source_evidence redaction · self_spec_gaming 4 지점에서 schema 가 *합성 layer module* 을 정확히 host 못 함. v0.2 backfill 필수 — Greatpractice 부록 C.3 의 4 gap 중 2 종 (trigger.format · children topology) 이 동일 패턴으로 재발견된 점은 *합성 layer 가 universal entry 보다 schema stress 가 강함* 의 evidence (Powell-DiMaggio 1983 normative isomorphism 의 *2-차 적용*).

본 부록 자체가 Ultrasafe 의 *self-trust* 시작점이자 §11 self-spec-gaming meta-safety 의 *첫 audit pass* 예요. v0.2+ 의 본 spec 각 cut 마다 본 부록을 *재실행* — maturity_score · lifecycle · audit_trail 갱신 + 4 PARTIAL gap 의 해소 여부 표기. v0.5+ 에 PARTIAL → PASS 전환 완료 시 본 부록은 *macro tier ratified entry* + *합성 layer reference exemplar* 로 격상 가능 (Greatpractice §5.4-§5.6 promotion path 와 동형).

---

## Revision History

### v0.2.0 — 2026-06-06 (runtime activation cut, advisory mode)

**Summary**: v0.1.0 의 *minimum-viable spec scaffold* → v0.2.0 의 *runtime activation cut*. 8 attacker SKILL.md + 2 hooks (PreToolUse `ultrasafe-trigger.cjs` + Stop `ultrasafe-clean-signal.cjs`) + MCP server (5 tools over stdio JSON-RPC) + Constellation §13.16 5 신규 A2A intent 통합 + Workflow fan-out 적용 evidence. **본 cut 의 모든 출력은 advisory** — finding report-only, publish 차단 없음.

**v0.2.0 신규 surface (5)**:
1. 8 attacker SKILL.md (`plugins/ultrasafe/skills/ultrasafe-{ai-llm,web-api,supply-chain,crypto,social-eng,methodology,threat-model,synthesizer}/SKILL.md`) — 각 attacker 의 input/output/tools/when-to-fire/severity rubric 명시 (§15).
2. PreToolUse hook `ultrasafe-trigger.cjs` — publish-equivalent command 7 종 매처 + advisory mode emit (§17.1).
3. Stop hook `ultrasafe-clean-signal.cjs` — cycle-end clean-signal check + advisory stderr alert (§17.2).
4. MCP server `mcp/server.cjs` — 5 tools (`ultrasafe_run_fanout` / `ultrasafe_finding_aggregate` / `ultrasafe_clean_signal_check` / `ultrasafe_report_generate` / `ultrasafe_release_gate`) over stdio JSON-RPC (§16).
5. Constellation §13.16 5 신규 A2A intent 통합 (`ULTRASAFE_FINDING` / `ULTRASAFE_ITERATION_BOUNDARY` / `ULTRASAFE_RELEASE_GATE` / `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION`) — ack_tier 적용 + payload schema + Spotlighting wrapper + 라이브보드 카드 surface (§18).

**본문 확장 §** (v0.1.0 §1-§13 + 부록 A/B/C 본문 전부 보존):
- §14 Runtime Architecture (v0.2.0) — 5 surface topology + 5-stage operational pipeline 의 wire activation + runtime 디렉토리 트리 + advisory mode 명시.
- §15 8-Agent Fan-Out Runtime Detail (v0.2.0) — 8 attacker 각각의 SKILL.md detail (input/output/tools/when-to-fire/severity rubric) + 9 절 (8 agent + dispatch sequence).
- §16 MCP Server Tools (v0.2.0) — 5 tools 의 input/output schema + tool-level deterministic guarantee + MCP server entry skeleton (`server.cjs`).
- §17 Hooks Spec — PreToolUse + Stop (v0.2.0) — registration + condition + action + hooks.json + implementation skeleton.
- §18 Constellation 통합 — 5 신규 intent runtime wire (v0.2.0) — 각 intent 의 payload schema + ack_tier + Spotlighting wrapper + 라이브보드 카드 surface + §13.16 등록부.
- §19 Advisory vs Blocking Mode (v0.2.0) — v0.2.x advisory mode 운영 의미 + v0.3+ blocking 전환 3-AND 조건 + blocking mode 운영 의미 + 전환 결정 자체의 Hyperbrief gate + self-application 함의.

**Workflow fan-out 적용 evidence**: orchestrator (`plugins/ultrasafe/runtime/orchestrator.cjs`) 가 7 attacker 를 *병렬* dispatch (Superscalar §3 read fan-out 패턴) + retire-barrier 에서 synthesizer 의 단일 sink 합성 — v0.1.0 design 의 *single-thread serial* 가정에서 v0.2.0 의 *parallel fan-out* 으로 runtime upgrade (§15.9).

**Advisory mode 명시 강제**:
- 모든 MCP tool return 의 `output.advisory_mode: true` mandatory.
- 모든 Constellation intent emit 의 `value.advisory: true` mandatory.
- 2 hook 의 exit code 0 fixed — *어떤 finding 도 publish 차단 안 함*.
- 모든 attestation text 의 *"ADVISORY MODE"* prefix mandatory.

**v0.1.0 forward reference 의 backward resolve**:
- §8 의 5 신규 A2A intent → §18 의 runtime wire spec 로 resolve.
- §10 의 PreToolUse hook → §17.1 의 hook spec 으로 resolve.
- §13.5 의 advisory-only mode → §19 의 mode transition 으로 resolve.

**Constellation §13.16 등록 mandatory** (같은 cut N-way sync):
- Constellation.md §13.16.9 A2A-intent allowlist 에 5 name 추가.
- AGENTS.md §5.8 N-way sync 등록부에 항목 추가 (Ultrasafe 모듈 버전 + 5 신규 intent 등록).
- plugin manifest (`plugins/ultrasafe/.claude-plugin/plugin.json`) v0.2.0 bump.

**Blocking mode (v0.3+) deferred**: clean-signal-gate 4-condition AND-gate 도달 + user gate 통과 + ≥3 iteration consecutive clean 의 3-AND 조건 후 전환. 전환 결정 자체가 Hyperbrief 4-score gate dispatch target (§19.4).

### v0.1.0 — 2026-06-06 (initial design draft cut)

**Summary**: 17-axis cross-domain synthesis backing + 8-agent v0.1.0 minimum fan-out + ≥3 iteration multi-condition AND termination + 3-layer synthesis report (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate) + 5 new Constellation A2A intents 설계 + dual pre-release trigger (PreToolUse hook + /ultrasafe skill) + Tier A 5 critic patches absorbed inline. Advisory-only v0.1.x → blocking v0.2.x (당시 design intent — v0.2.0 cut 에서 *runtime activation = advisory mode 유지*, blocking 은 v0.3+ 로 재조정).

**v0.1.0 본문 (§1-§13 + 부록 A/B/C)**:
- §1 Concept — Ultrasafe 의 정체 + 4 가지 흔한 오독 차단 + 5-stage operational pipeline + Three backbones + advisory-only boundary.
- §2 Module Shape — 8-agent v0.1.0 minimum fan-out + GTA/DSP cross-cutting + diversity invariant + self-spec-gaming hazard 회피.
- §3 Fan-out Matrix — taxonomy × methodology × actor-profile 직교 + 13-axis dispatch matrix + Stackelberg commit-aware 2-phase.
- §4 Finding Output Contract — 공격 에이전트 발견 schema.
- §5 Synthesis Report 3-Layer — OSCAL + Hyperbrief IR + Greatpractice candidate.
- §6 ≥3 Iteration Loop — multi-condition AND clean signal + coverage definition + regression baseline.
- §7 Hyperbrief 4-score Routing — strict-mode reconciliation.
- §8 Constellation A2A — 5 신규 intent (design schema) + Spotlighting wrapper + outbox 정적 마커 스캔 + broker compromise surface analysis + 라이브보드 카드 stream.
- §9 Greatpractice Tree 통합.
- §10 Pre-release Trigger + Tier — PreToolUse hook 매처 + /ultrasafe skill + 3-tier 분류 + axis-set 차등 + iteration minimum + bypass mechanism.
- §11 Self-Spec-Gaming Hazard.
- §12 Untested Surfaces + Known Gaps + schema evolution policy.
- §13 Adoption Thresholds — 3 조건 AND + anti-criteria + Tier 1 static gate floor + plugin 의존성 분리 + Tier A risk warning + advisory-only mode.
- 부록 A Cross-Axis Convergence Cluster Catalog — 14 cluster.
- 부록 B 4 Strong Isomorphism + Normative 정당화.
- 부록 C Self-Application — 본 spec 자체의 Greatpractice macro entry frontmatter.

**Backing research**: 17-axis cross-domain 딥리서치 (`reports/2026-06-05-ultrasafe-research/` 91 파일) — harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution.

---
