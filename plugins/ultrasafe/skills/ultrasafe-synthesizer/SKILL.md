---
name: ultrasafe-synthesizer
version: 0.2.0
description: Pre-release security testing — retire-barrier fan-out sink. Aggregate the 7 attacker agents' findings (ai-llm / web-api / supply-chain / crypto / social-eng / methodology / threat-model) via BFT quorum 2f+1 cross-axis confirmation, diversity-enforced source independence (perspective × prompt_template_hash × seed 3-tuple distinct ≥ 3), ACH multi-hypothesis matrix, CIM tri-format export (SARIF 2.1.0 + STIX 2.1 + ATT&CK Navigator), then emit 3-layer hybrid synthesis report (OSCAL Assessment Result Layer 1 + Hyperbrief 9-section IR Layer 2 + Greatpractice tree candidate Layer 3) along with the iteration boundary record (resolved / regression / persistent / new 4-set diff + untested_classes[] coverage). Fires automatically at retire-barrier after all 7 attacker findings emit complete. v0.2.x advisory mode — report-only, publish 차단 없음.
---

# Synthesizer (cross-axis) — Ultrasafe Attacker Skill v0.2.0

> **Role**: Pre-release simulated penetration testing의 retire-barrier 합성 단독. 7 attacker (agent 1-7) finding 의 cross-axis dedup + severity ranking + correlation + 3-layer report 생성 perspective.
> **Tone**: synthesis-meta. *합성 결과의 정확성 > 합성 속도* — BFT quorum 미달 finding 은 `low-confidence draft` tier 로 강등, fabricate 금지.
> **Position in fan-out**: Agent 8 (sink). Phase A (7 attacker 병렬 dispatch) 의 retire-barrier 직후 Phase B 의 informed best-response 단계 (Stackelberg follower, Ultrasafe §3.2) 로 진입.
> **Output**: `ULTRASAFE_ITERATION_BOUNDARY` A2A intent emit (Constellation §13.16) + 3-layer report (OSCAL + Hyperbrief IR + Greatpractice candidate) + `clean_signal_4_condition_AND_gate_state` evaluation. v0.2.x **advisory mode** — `value.advisory: true` flag mandatory.

---

## §1 When to invoke

### §1.1 Primary triggers

본 skill 은 orchestrator 역할 (메인 에이전트의 Workflow fan-out + MCP `ultrasafe_run_fanout` — Ultrasafe.md §14.1 역할 매핑) 이 자동 dispatch — 사용자/다른 agent 가 직접 호출하지 않는 게 원칙이에요. 단 다음 시점에 발화:

1. **Retire-barrier auto-fire**: 7 attacker (agent 1-7) 모두 `ULTRASAFE_FINDING` emit 완료 + orchestrator 가 finding bag 을 finalize 한 직후. Tier 1-3 모든 release tier 에서 활성.
2. **Iteration boundary close**: 현재 iteration N 의 모든 finding 이 수렴 (각 attacker 의 dispatch timeout 도달 또는 explicit `done` signal) — clean-signal-gate 역할 (MCP `ultrasafe_clean_signal_check`) 호출 직전 단계.
3. **Re-synthesis on patch**: iteration N 에서 fix 적용 후 iteration N+1 진입 시점 — *직전 boundary snapshot 과 비교한 resolved / regression / persistent / new 4-set diff* 계산 강제.
4. **Forced re-synthesis** (Hyperbrief MUST-trigger): meta-safety-broker (Ultrasafe §2.5.2) 가 4 mandatory check 중 하나 hit → broker 가 synthesizer 강제 재실행 요청 (단, broker 자체 hit 결과는 synthesizer 가 *외부 fact* 로 reference, 합성 결과에 inline 하지 않음 — self-spec-gaming 회피).
5. **Catalog version change**: OWASP LLM Top 10 / MITRE ATT&CK Enterprise / ISO 27001 Annex A 등 reference catalog 의 version bump 감지 시 (`catalog_versions` diff). 기존 boundary 의 `coverage_percentage_under_catalog` 재계산 필요.

### §1.2 Skip conditions

- 7 attacker 중 하나라도 `ULTRASAFE_FINDING` emit 안 한 상태 (orchestrator 의 finalize 전): **skip**. retire-barrier 위반 = 합성 자체가 spec-gaming 위험.
- diversity 3-tuple distinct < 3 (즉 *single template* finding 만 누적된 상태): **skip + re-dispatch** request orchestrator 로 emit. correlated hallucination 증폭 회피 (Ultrasafe §3.2.2 + MAD §3.2).
- finding bag 이 *완전히* empty (모든 agent timeout 또는 error): **skip + emit `ULTRASAFE_ITERATION_BOUNDARY` with `value.synthesis_skipped: true, reason: "empty_finding_bag"`**. 빈 합성 = ambiguous clean signal.

### §1.3 Adjacent skill boundary

| Adjacent skill | 본 skill 과의 boundary |
|---|---|
| `ultrasafe-ai-llm` (agent 1) | agent 1 = AI/LLM perspective finding *생성*. 본 skill = agent 1-7 finding *합성*. agent 1 의 raw finding 을 합성 input 으로 받되, 본 skill 이 agent 1 의 perspective 를 재실행 하지 않음. |
| `ultrasafe-methodology` (agent 6) | methodology = coverage cliff / NIST 800-115 단계 ordering / OSSTMM section ordering perspective finding. 본 skill 의 *coverage definition* 와 별개 — methodology 가 catalog cell 추가 / 제거 권고, 본 skill 은 권고를 reflect 한 coverage 계산. |
| `hyperbrief` (decision delegation) | Layer 2 IR 생성 후 score ≥ 4 finding 은 자동으로 `hyperbrief` skill 에 forward — 본 skill 은 IR scaffold *생성*만 담당, 결정 escalation 은 hyperbrief 위임. |
| `meta-safety-broker` (외부 process) | broker 는 본 skill 의 합성을 *passive observer* 로 inspect — 본 skill 은 broker 의 verdict 를 *모름* (broker 가 hit 시 별도 channel 로 Hyperbrief MUST-trigger 발화). self-spec-gaming 회피 위한 *intentional information asymmetry*. |

---

## §2 Input

### §2.1 Required input

```json
{
  "iteration": 3,
  "finding_set_from_7_attackers": [
    {
      "attacker_id": "ai-llm",
      "iteration": 3,
      "findings": [ /* attacker 1 finding[] */ ],
      "perspective_hash": "blake3:...",
      "prompt_template_hash": "blake3:...",
      "seed": "uuid-v4",
      "token_consumption": 12453,
      "external_standard_anchor": ["OWASP-LLM-2025-LLM01", "MITRE-ATLAS-AML.T0051"]
    },
    /* ...agent 2-7 동일 schema... */
  ],
  "catalog_versions": {
    "owasp_llm_top10": "2025-v1.1",
    "mitre_attack_enterprise": "v15.1",
    "iso_27001_annex_a": "2022-v1.0",
    "owasp_top10": "2021-v1.0",
    "owasp_asvs": "4.0.3"
  },
  "agent_roster_snapshot_hash": "blake3:...",
  "prior_iteration_boundary": { /* iteration N-1 의 boundary record, iteration=1 일 땐 null */ },
  "untested_surfaces_carry_over": ["..."]
}
```

### §2.2 Optional input

- `synthesis_focus_axes[]`: 특정 axis cross-confirmation 만 강조 (default = all 17 axis).
- `severity_floor`: 본 iteration 합성에서 carry 할 최소 severity tier (default = `info`).
- `force_oscal_v2`: OSCAL Assessment Result schema version 강제 (default = `1.1.2`).

### §2.3 Input validation

- `finding_set_from_7_attackers.length === 7` 강제. ≠ 7 일 때 `skip` + orchestrator 에 retire-barrier violation 보고.
- `attacker_id` 의 중복 없음 (set distinct: {ai-llm, web-api, supply-chain, crypto, social-eng, methodology, threat-model}).
- `(perspective × prompt_template_hash × seed)` 3-tuple distinct count ≥ 3 강제. < 3 일 때 §1.2 skip rule 발동.
- `external_standard_anchor[]` 의 평균 ≥ 0.5 anchor / finding — 단순 LLM 환각 보고 가능성 감지 (Ultrasafe §2.5.2 의 broker check 와 별개).

---

## §3 Methodology

### §3.1 Phase B — informed best-response synthesis (Stackelberg follower)

본 skill 은 Phase A (7 attacker 의 read-only enumeration, Stackelberg leader observation) 직후 retire-barrier 에서 *Phase B* 의 단독 sink 로 발화. Phase A 의 finding 은 *attacker 의 first-move commit* — 본 skill 은 7 first-move 를 모두 본 후 *informed best-response* 로 합성 (Ultrasafe §3.2 game-theory framing).

### §3.2 Synthesis pipeline (6 단계)

#### 단계 1 — Diversity audit (먼저)

- (perspective × prompt_template_hash × seed) 3-tuple 의 distinct count 계산.
- distinct < 3 → §1.2 skip rule, re-dispatch request emit.
- 통과 시 단계 2 진입.

#### 단계 2 — Cross-axis dedup (BFT quorum 2f+1)

- 모든 7 attacker 의 finding 을 *fingerprint* 로 정규화: `blake3(category + reproduction_steps_canonical + affected_artifact_id)`.
- 동일 fingerprint 의 attacker count 집계:
  - **5 이상** (2f+1 with n=7, f=2) → `confidence_tier: "confirmed"`.
  - **3 이상 4 이하** (f+1 = 3) → `confidence_tier: "needs-corroboration"`.
  - **1 또는 2** → `confidence_tier: "low-confidence-draft"`.
- 동일 fingerprint 의 *evidence* 는 union (각 attacker 의 verifiable proof 모두 보존). severity 는 *max* (가장 높은 attacker 평가 채택, 단 evidence_tier 가 `assumed` 인 경우 한 단계 강등).

#### 단계 3 — Severity ranking (CVSS 4.0 base + GTA enrichment)

- 각 finding 의 raw severity ∈ {critical, high, medium, low, info}.
- CVSS 4.0 base vector 계산 (AV/AC/AT/PR/UI/VC/VI/VA/SC/SI/SA) — 가능한 경우. anchor 부재 시 attacker-provided severity 유지.
- GTA enrichment metadata 후추가 (Ultrasafe §2.2.1): `kill_chain_stage`, `actor_profile`, `pain_level_if_fixed`, `externality_score`, `defender_intervention_options[]`.
- DSP enrichment 후추가 (Ultrasafe §2.2.2): `enforcement_tier`, `mttr_phase`, `rollback_feasibility`, `policy_as_code_artifact_ref`.
- `externality_score > 1.0` 인 finding 은 *별도 list* 로 분리 (auto-deprioritize candidate, Herley 2009 외부성 명제).

#### 단계 4 — Correlation (ACH multi-hypothesis matrix)

- 동일 finding cluster 의 *다중 hypothesis* 명시 (CDB §1):
  - H1: 의도적 attack surface (defender knowingly exposed).
  - H2: 우발적 misconfiguration (regression / patch oversight).
  - H3: spec gap (catalog cell 부재로 정의 자체가 모호).
  - H4: false positive (attacker hallucination, evidence_tier = assumed).
- 각 hypothesis 별 *evidence weight* 표시 (consistency / inconsistency / unknown 3-tier).
- 단일 hypothesis 채택 금지 — *최소 2 hypothesis* 동시 보존 (single-narrative bias 회피).

#### 단계 5 — CIM tri-format normalization (SVD §4)

- **SARIF 2.1.0**: `runs[].results[]` 의 `ruleId` = finding fingerprint, `level` = severity, `locations[]` = affected artifact path.
- **STIX 2.1 bundle**: `vulnerability` SDO + `attack-pattern` SDO + `relationship` SRO (`exploits` / `mitigates`).
- **ATT&CK Navigator JSON layer**: `techniques[]` 의 `techniqueID` + `color` (severity gradient) + `comment` (finding id).
- 3 format 모두 *동일 finding bag* 의 view — 정합성 검증 (각 format 의 finding count 일치 확인).

#### 단계 6 — Iteration boundary diff (4-set)

직전 boundary (`prior_iteration_boundary`) 와 비교:

- **resolved**: 직전 boundary 의 finding 중 현 iteration 에서 fingerprint 부재.
- **regression**: 더 이전 boundary (N-2 이하) 에서 resolved 였으나 현 iteration 에서 fingerprint 재등장.
- **persistent**: 직전 boundary + 현 iteration 모두 fingerprint 존재.
- **new**: 직전 boundary 부재, 현 iteration 신규 fingerprint.

각 set 의 cardinality + finding list (fingerprint 기준) 표시. 4-set 의 *union* = 현 iteration 의 total observable finding bag.

### §3.3 Coverage measurement (Ultrasafe §6.3 + §2.1.8 정합)

`coverage_percentage_under_catalog` 의 명시적 계산:

```
coverage_percentage_under_catalog[catalog_name] = (probe_attempted_cell_count / total_cell_count[catalog_name]) * 100
```

- `total_cell_count` 의 reference: OWASP LLM Top 10 = 10, MITRE ATT&CK Enterprise v15 = 14 tactic × N technique cell (cell = tactic × technique unique pair), ISO 27001 Annex A 2022 = 93 control.
- `probe_attempted_cell_count`: 본 iteration 의 7 attacker 중 *최소 하나* 가 evidence_tier ∈ {verified, inferred} 로 보고한 cell 수. attacker 가 *시도했으나* finding 없음 (clean) 도 attempted 로 카운트 (단, evidence_tier = `null` 일 땐 시도 자체 없음으로 처리).
- `untested_classes[]`: probe_attempted = false 인 모든 cell 의 list. mandatory non-empty unless catalog 의 모든 cell 에 evidence 가 attached.

### §3.4 Audit trail emit

본 skill 의 합성 결과는 *append-only signed chain* 으로 audit log 에 emit (`.ultrasafe/audit-log/iteration-N.jsonl` — adopter-repo working dir, Ultrasafe.md §14.3):

- 각 entry = `{ts, iteration, attacker_findings_hash, synthesis_output_hash, agent_roster_snapshot_hash, broker_independence_signature}`.
- chain hash = `blake3(prev_entry || current_entry_canonical)`.
- broker 의 *independence signature* — broker process 가 본 skill 의 합성 결과를 *외부에서* sign (synthesizer 가 자기 audit log 를 변조 불가, MAD §3.4 정합).

---

## §4 Finding output schema

### §4.1 Per-finding schema (Layer 1 — OSCAL Assessment Result `findings[]` entry)

```json
{
  "type": "ULTRASAFE_FINDING_SYNTHESIZED",
  "attacker_id": "synthesizer",
  "iteration": 3,
  "findings": [
    {
      "id": "ULTRASAFE-FND-2026-06-06-0001",
      "fingerprint": "blake3:...",
      "severity": "high",
      "confidence_tier": "confirmed",
      "cross_axis_confirmation_count": 5,
      "contributing_attackers": ["ai-llm", "web-api", "supply-chain", "methodology", "threat-model"],
      "category": "supply-chain.signing-chain.unsigned-transitive-dep",
      "evidence": "[verified] npm package `foo@1.2.3` resolves transitive dep `bar@0.4.1` which lacks Sigstore attestation; SBOM-attached attestation chain breaks at depth 2. Verified via `cosign verify-blob` returning `Error: no matching signatures found`.",
      "evidence_tier": "verified",
      "reproduction_steps": "1. `npm install foo@1.2.3 --dry-run`\n2. `syft packages dir:. -o spdx-json > sbom.json`\n3. `cosign verify-blob --bundle bar-attest.json bar-0.4.1.tgz`\n4. observe `no matching signatures found`",
      "recommended_fix": "pin transitive dep `bar` to ≥0.4.2 (first signed release) OR add explicit allowlist exception with documented threat acceptance",
      "external_standard_anchor": [
        "NIST-SSDF-PS.3.1",
        "CISA-SBOM-MIN-ELEMENTS-2021",
        "SLSA-v1.0-PROVENANCE-L3"
      ],
      "cvss_4_0_base_vector": "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:L/SC:H/SI:H/SA:L",
      "cvss_4_0_base_score": 8.6,
      "kill_chain_stage": "delivery",
      "actor_profile": ["ecriminal", "apt"],
      "pain_level_if_fixed": 6,
      "externality_score": 0.34,
      "defender_intervention_options": [
        {"control": "pin-version", "delta_roi": 0.78, "effort_h": 0.5},
        {"control": "allowlist-exception-with-monitoring", "delta_roi": 0.41, "effort_h": 2.0}
      ],
      "enforcement_tier": "soft-mandatory",
      "mttr_phase": "remediation",
      "rollback_feasibility": "full",
      "ach_hypotheses": [
        {"id": "H1", "label": "transitive dep not yet adopting Sigstore", "evidence_consistency": "high"},
        {"id": "H2", "label": "package owner abandoned signing", "evidence_consistency": "medium"},
        {"id": "H3", "label": "SBOM tool bug masking valid signature", "evidence_consistency": "low"}
      ],
      "cim_export_refs": {
        "sarif_2_1_0_result_index": 17,
        "stix_2_1_vulnerability_sdo_id": "vulnerability--...",
        "attack_navigator_technique_id": "T1195.002"
      },
      "advisory": true,
      "would_block_in_blocking_mode": false
    }
  ]
}
```

### §4.2 Iteration boundary schema (Layer 1 — OSCAL Assessment Result `iteration_summary`)

```json
{
  "type": "ULTRASAFE_ITERATION_BOUNDARY",
  "attacker_id": "synthesizer",
  "iteration": 3,
  "value": {
    "advisory": true,
    "would_release_in_blocking_mode": false,
    "iteration_summary": {
      "resolved": [ /* fingerprint[] */ ],
      "regression": [ /* fingerprint[] */ ],
      "persistent": [ /* fingerprint[] */ ],
      "new": [ /* fingerprint[] */ ]
    },
    "alignment_matrix": {
      "ai-llm × web-api": 3,
      "ai-llm × supply-chain": 1,
      "supply-chain × threat-model": 4,
      "...": "..."
    },
    "coverage_percentage_under_catalog": {
      "owasp_llm_top10": 80.0,
      "mitre_attack_enterprise": 42.3,
      "iso_27001_annex_a": 23.7
    },
    "untested_classes": [
      {"catalog": "mitre_attack_enterprise", "cell": "TA0011.T1095"},
      {"catalog": "iso_27001_annex_a", "cell": "A.5.34"}
    ],
    "clean_signal_4_condition_AND_gate_state": {
      "regression_free": true,
      "monotonic_finding_reduction": true,
      "coverage_floor": false,
      "consecutive_2_iter": false
    },
    "hyperbrief_must_trigger_count": 2,
    "greatpractice_candidates": [
      {"layer": "mezzo", "id": "GP-2026-06-06-001", "description": "..."}
    ],
    "audit_log_chain_hash": "blake3:..."
  }
}
```

### §4.3 3-layer hybrid report (synthesis 의 최종 산출물)

- **Layer 1 — OSCAL Assessment Result** (machine schema, 본 §4.1 + §4.2 의 합본).
- **Layer 2 — Hyperbrief 9-section IR** (escalation_sum ≥ 4 OR MUST-trigger 발화 finding 마다 1 IR). 본 skill 은 IR *scaffold* 생성, escalation 결정은 `hyperbrief` skill 위임.
- **Layer 3 — Greatpractice tree entry candidate**:
  - **macro**: 본 iteration 전반의 패턴 (예: "supply-chain signing chain 결손이 6+ axis 에 걸쳐 반복").
  - **mezzo**: 특정 finding cluster (예: "Sigstore attestation 미adopt transitive dep").
  - **micro**: 개별 finding 의 reproduction + fix 절차 (위 §4.1 의 reproduction_steps + recommended_fix).
  - 자동 분류 rule: cross_axis_confirmation_count ≥ 5 → macro 후보, 3-4 → mezzo, 1-2 → micro.

### §4.4 Constellation A2A intent wiring (Ultrasafe §18.2)

본 skill 의 emit 은 `ULTRASAFE_ITERATION_BOUNDARY` intent payload 로 wrap:

```json
{
  "type": "CUSTOM/ULTRASAFE_ITERATION_BOUNDARY",
  "value": { /* §4.2 의 value 전체 */ },
  "ack_required": "commitment",
  "broadcast": ["meta-safety-broker", "clean-signal-gate", "release-gate"]
}
```

emit 직전 cursor-tail probe (Constellation §13.16.10) 강제 — inbound 발견 시 abort + revise.

---

## §5 Examples

### §5.1 Example A — 7 attacker 모두 fingerprint 일치 (confirmed tier)

**Trigger**: orchestrator retire-barrier auto-fire (§1.1.1). iteration=2. 7 attacker 모두 동일 finding fingerprint `blake3:abc...` 를 보고 (supply chain signing chain break in `bar@0.4.1`).

**합성 결과**:
- `cross_axis_confirmation_count: 7` (max).
- `confidence_tier: "confirmed"` (≥ 5 quorum).
- severity = max (high, anchor: NIST-SSDF-PS.3.1).
- `ach_hypotheses`: 3 (transitive dep not yet adopting / package owner abandoned / SBOM tool bug). 단일 narrative 채택 금지.
- Layer 3 macro 후보 entry 생성 (≥ 5 quorum 이므로).

**emit**: `ULTRASAFE_ITERATION_BOUNDARY` with `iteration_summary.new: [fingerprint]`, `advisory: true`.

### §5.2 Example B — fingerprint 분산 (low-confidence draft)

**Trigger**: iteration=4. 7 attacker 가 finding 36 건 emit, fingerprint distinct count = 28 (대부분 단일 attacker 보고).

**합성 결과**:
- 28 finding 중 `confirmed` tier = 2 건 (≥ 5 quorum), `needs-corroboration` = 6 건, `low-confidence-draft` = 20 건.
- low-confidence draft 는 *별도 review queue* 로 분리 + 다음 iteration 의 attacker dispatch 시 `synthesis_focus_axes[]` 로 cross-confirmation 요청.
- coverage_percentage_under_catalog 계산 — 28 distinct finding 이 catalog cell 의 몇 %? 측정 후 `untested_classes[]` 명시.

**emit**: `ULTRASAFE_ITERATION_BOUNDARY` with `clean_signal_4_condition_AND_gate_state.coverage_floor: false` (대다수 low-confidence 이므로 coverage_floor 미달 가능성).

### §5.3 Example C — regression 감지

**Trigger**: iteration=5. 직전 boundary (iteration=4) 에서 `resolved: [fp_X]` 였으나, iteration=5 에서 `fp_X` 재등장.

**합성 결과**:
- `iteration_summary.regression: [fp_X]` 표시.
- `clean_signal_4_condition_AND_gate_state.regression_free: false` 강제.
- `would_release_in_blocking_mode: false` (regression 1 건 이상이면 blocking mode 에서 release 불가).
- Hyperbrief MUST-trigger 발화 — fix 가 regression 유발한 *근본 원인* 분석 필요 (mezzo Greatpractice 후보).

**emit**: regression 이 *fix 의 side effect* 인지 / *다른 axis 의 동일 root cause* 인지 ACH multi-hypothesis 로 명시. broker 가 이 emit 을 inspect 하여 spec-gaming 의심 시 별도 Hyperbrief MUST-trigger 추가.

### §5.4 Example D — diversity 미달 (skip + re-dispatch)

**Trigger**: iteration=1. 7 attacker 의 (perspective × prompt_template_hash × seed) 3-tuple distinct count = 2 (대부분 동일 template 사용).

**합성 결과**:
- §1.2 skip rule 발동.
- emit: `ULTRASAFE_ITERATION_BOUNDARY` with `value.synthesis_skipped: true, value.reason: "diversity_below_threshold", value.diversity_distinct_count: 2`.
- orchestrator 에 re-dispatch request emit — 다음 iteration 에서 다른 prompt_template_hash 강제.

### §5.5 Example E — broker forced re-synthesis

**Trigger**: §1.1.4. meta-safety-broker 가 `attack_family_coverage` check 에서 hit (7 attacker 중 crypto 만 finding 0 emit, broker 가 *crypto axis 의 spec-gaming 의심* 판정) — orchestrator 가 본 skill 에 *재실행* 요청.

**합성 결과**:
- broker 의 verdict 자체는 inline 하지 않음 (self-spec-gaming 회피 — synthesizer 가 broker check 통과를 *목표* 로 합성하면 broker 의 독립성 무력화).
- crypto axis 의 *raw finding bag* (= 0) 을 그대로 합성 + `untested_classes[]` 에 crypto 의 catalog cell 전체 추가.
- broker 가 별도 channel 로 Hyperbrief MUST-trigger 발화 — 본 skill 은 그 사실을 *모르고* 합성 유지.

---

## §6 Anti-patterns

### §6.1 Anti-pattern A — 단일 narrative 강제 합성

**잘못된 패턴**: 7 attacker 의 conflicting finding 을 *합의된 단일 hypothesis* 로 강제 통합 (예: "H1 만 채택, H2/H3 폐기"). 이는 single-narrative bias (CDB §1) 의 직접 instantiation.

**올바른 패턴**: ACH multi-hypothesis matrix 강제 — 최소 2 hypothesis 동시 보존, 각각의 evidence_consistency 표시 (§3.2 단계 4).

### §6.2 Anti-pattern B — diversity 미달 무시한 채 합성 진행

**잘못된 패턴**: (perspective × prompt_template_hash × seed) 3-tuple distinct < 3 임에도 합성 진행 → correlated hallucination 증폭 (single-template 의 hallucination 이 7-agent 합의로 amplified, MAD §3.2 + Ultrasafe §3.2.2).

**올바른 패턴**: §1.2 skip rule 강제 — diversity 미달 시 skip + re-dispatch request emit. orchestrator 가 다른 prompt_template_hash 로 재dispatch 후 본 skill 재발화.

### §6.3 Anti-pattern C — 합성 결과의 broker 통과 *목표* 화

**잘못된 패턴**: meta-safety-broker 의 4 mandatory check 통과를 *합성의 목표* 로 삼아 — broker 가 검출 못 하도록 결과 조작 (예: token consumption 평균 맞추기 위해 의도적으로 attacker dispatch 추가). spec-gaming 의 textbook 사례 (Ultrasafe §2.5.2).

**올바른 패턴**: broker 의 verdict 를 *모르고* 합성 — broker 는 본 skill 의 합성 결과를 외부에서 inspect, 본 skill 은 broker 의 check criteria 를 *목표 함수* 로 사용 금지. 합성은 finding bag 의 *진실한 reflection* 만.

### §6.4 Anti-pattern D — coverage 측정 없이 "clean" 보고

**잘못된 패턴**: 7 attacker 의 finding bag 이 empty 일 때 `clean signal 통과` 보고. 이는 "발견 0 = clean" 의 ambiguous interpretation — 실제로는 *catalog cell 의 몇 %를 probe attempted 했는지* 측정 필수 (Ultrasafe §6.3).

**올바른 패턴**: `coverage_percentage_under_catalog` + `untested_classes[]` mandatory 계산 (§3.3). probe attempted = 0 인 catalog cell 이 있으면 clean signal 불가, `coverage_floor: false`.

### §6.5 Anti-pattern E — 직전 iteration boundary 무시한 합성

**잘못된 패턴**: 현 iteration 의 finding bag 만 보고 합성 — `resolved / regression / persistent / new` 4-set diff 계산 누락. 이는 *fix-induced regression* 검출 실패 (Ultrasafe §6.1 의 3-iteration floor 근거 무력화).

**올바른 패턴**: `prior_iteration_boundary` mandatory input 으로 받아 4-set diff 계산 (§3.2 단계 6). iteration=1 일 땐 `prior = null` 명시, iteration ≥ 2 에서는 reference 누락 시 skip.

### §6.6 Anti-pattern F — Hyperbrief IR 생성 시 결정 inline

**잘못된 패턴**: Layer 2 의 Hyperbrief 9-section IR 생성하면서 본 skill 이 *결정 자체* 를 inline (예: "fix priority = critical, deploy 즉시"). 이는 hyperbrief skill 의 escalation 역할 침범.

**올바른 패턴**: 본 skill 은 IR *scaffold* (9 section 의 input data) 만 생성, escalation 결정은 `hyperbrief` skill 위임. 본 skill 의 output 에는 `hyperbrief_must_trigger_count` 만 표시 (count, 결정 X).

### §6.7 Anti-pattern G — token consumption *3σ 미만* attacker 무시

**잘못된 패턴**: 7 attacker 중 token consumption 이 평균 대비 3σ 미만 인 attacker 가 있어도 본 skill 이 그 finding 을 동등 가중치 합성. 이는 free-rider attack (MAD §4.8) 의 직접 instantiation — *최소 노력으로 합의 일조* 한 attacker 의 finding 이 confirmed tier 합의에 기여하면 cross-axis confirmation 의 신뢰 무력화.

**올바른 패턴**: `token_consumption` 의 distribution 측정 → 3σ 미만 attacker 의 finding 은 *별도 flag* (`free_rider_suspected: true`) — broker 가 외부에서 probe-based detection 수행. 본 skill 은 flag 만 emit, 가중치 조정은 broker 의 verdict 위임.

---

## §7 Cross-references

### §7.1 Ultrasafe.md 내부

- `§2.1.8` — Agent 8 Synthesizer responsibility + output contract 정의 (본 skill 의 design source).
- `§2.5.2` — meta-safety-broker 의 4 mandatory check + 본 skill 의 self-spec-gaming hazard 회피.
- `§3.2` — game-theory framing (Stackelberg leader / follower) — 본 skill 은 follower (Phase B).
- `§3.2.2` — diversity-enforced source independence (3-tuple distinct ≥ 3).
- `§6.1` — 3-iteration floor + 4-condition AND-gate 의 근거 (clean signal evaluation).
- `§6.3` — coverage definition (catalog cell 기준 명시적 측정).
- `§15.8` — Agent 8 Synthesizer SKILL.md 의 spec source (본 파일의 1차 source).
- `§15.9` — 8-agent dispatch sequence (Workflow fan-out 적용).
- `§16.2` — `ultrasafe_finding_aggregate` MCP tool 의 backing logic.
- `§16.3` — `ultrasafe_clean_signal_check` MCP tool 과의 wiring.
- `§16.4` — `ultrasafe_report_generate` MCP tool 과의 3-layer report 통합.
- `§18.2` — `ULTRASAFE_ITERATION_BOUNDARY` A2A intent payload schema.

### §7.2 Constellation.md

- `§13.16.10` — pre-send cursor-tail probe 의무 (본 skill 의 emit 직전 강제).
- `§13.16.9` — A2A intent allowlist (`ULTRASAFE_*` 5 신규 intent 포함).
- `§13.13` — ack 3-tier (transport / commitment / application) — 본 skill 은 commitment tier ack 요구.
- `§13.11.3` — envelope normalisation.
- `§13.18` — 자율 실행 (라인 1) — 본 skill 은 orchestrator 의 자동 dispatch 로 invoke, 사용자 게이트 없음.

### §7.3 Hyperbrief.md

- `§1` — 9-section JSON IR 양식 (본 skill 의 Layer 2 scaffold).
- `§2` — 4-score escalation rubric + 5 MUST-trigger 조건 (본 skill 의 `hyperbrief_must_trigger_count` 계산).
- `§5.6.7` — auto-localize (audience_profile_fallback.button_label 의 prevailing 언어 populate).

### §7.4 Greatpractice (모듈 plan)

- `memory/greatpractice_module_plan.md` — Greatpractice tree 의 macro / mezzo / micro 자동 분류 (본 skill 의 Layer 3 산출물).

### §7.5 Superscalar.md

- `§3` — read fan-out 패턴 (본 skill 의 Phase A 의 7 attacker 병렬 dispatch backing).
- `§5` — retire-barrier 합성 sink (본 skill 의 위치).

### §7.6 External standards

- OSCAL Assessment Result v1.1.2 (NIST) — Layer 1 machine schema.
- SARIF 2.1.0 (OASIS) — CIM tri-format export 의 첫 번째 view.
- STIX 2.1 (OASIS) — CIM tri-format export 의 두 번째 view.
- MITRE ATT&CK Navigator JSON layer schema — CIM tri-format export 의 세 번째 view.
- CVSS 4.0 (FIRST) — severity ranking 의 base vector.
- BFT quorum 2f+1 (Castro & Liskov 1999) — cross-axis confirmation tier 의 수학적 backing.
- ACH (Analysis of Competing Hypotheses, Heuer 1999) — multi-hypothesis matrix 의 방법론 source.

---

**v0.2.0 advisory mode 명시**: 본 skill 의 모든 output (3-layer report + ITERATION_BOUNDARY emit + Greatpractice candidate) 은 `value.advisory: true` flag 동반. publish 차단 없음 — report-only. blocking mode (v0.3+) 진입 시 `clean_signal_4_condition_AND_gate_state` 의 4 조건 AND 미달 finding 이 release-gate 차단 trigger 로 작동 예정.
