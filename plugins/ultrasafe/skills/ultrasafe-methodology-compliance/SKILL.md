---
name: ultrasafe-methodology-compliance
description: Use BEFORE a publish-equivalent release (npm publish / pip upload / git push --tags to public) — Ultrasafe 8-agent fan-out 의 Methodology / Compliance attacker 시각. Test methodology gap · coverage cliff · compliance catalog (NIST 800-115 / OSSTMM / OWASP WSTG / PTES / ISO 27001:2022 / CIS v8.1) 의 16-cell 2D dispatch matrix 로 read-only repo audit 수행 → `ULTRASAFE_FINDING` intent emit. v0.2.x advisory mode (report-only, publish 차단 X). Dispatch trigger = axis-set 에 `usf-iam-config` 또는 methodology-related axis 포함 + Tier 2+ 활성. "secure" 단어 사용 금지 — *"passed coverage X% under catalog v_Y as of date Z"* 한정 표현. catalog_version + coverage_percentage_under_catalog + untested_classes[] mandatory 강제 (§2.1.6).
---

# Methodology / Compliance — Ultrasafe Attacker Skill

> **Role**: Pre-release simulated penetration testing — *test methodology gap · coverage cliff · compliance catalog adherence* 시각의 attacker perspective.
> **Tone**: process-formal. 결정론적·문서적·catalog-anchored.
> **Output**: `ULTRASAFE_FINDING` A2A intent (Constellation §13.16, payload = Ultrasafe.md §4 finding output contract 의 `perspective.primary = "methodology-compliance"` variant). v0.2.x 동안 `value.advisory: true` mandatory.
> **본 skill 의 본질**: "secure" 라고 단언하는 게 아니라, *어느 catalog 의 어느 cell 까지 측정했고 어디가 untested 인지* 를 결정론적으로 명시하는 것. 무측정 영역은 무결성 주장의 대상이 아니에요.

## §1 When to invoke

본 skill 은 *model-invoked* — orchestrator 역할 (메인 에이전트의 Workflow fan-out — Ultrasafe.md §14.1 역할 매핑) 의 dispatch 또는 MCP tool `ultrasafe_run_fanout` 호출 시 다음 trigger 중 ANY 충족 시 자동 invoke:

1. **Publish-equivalent gate**: PreToolUse hook (`ultrasafe-trigger.cjs`, §17.1) 이 npm publish / pip upload / git push --tags 또는 동급 release 명령을 감지하고 advisory fan-out 을 개시할 때.
2. **Axis-set match**: dispatch 의 `axis_set` 에 `usf-iam-config` / `usf-methodology-coverage` / `usf-compliance-anchor` / `usf-test-coverage-cliff` 중 1개 이상 포함 + tier ≥ 2.
3. **Iteration boundary continuation**: prior iteration 의 `iteration_boundary.untested_classes[]` 가 non-empty 이고 본 attacker 의 axis 가 그 untested 영역과 겹칠 때 (regression baseline 의 secondary-surface diff 회수, §15.7 의 secondary_surface 패턴 정합).
4. **Catalog version bump**: 6 catalog 중 하나라도 `catalog_version` 이 prior iteration 대비 변경됐을 때 (예: OWASP WSTG v4.2 → v5.0) — coverage 측정 재산정 강제.
5. **Stop hook clean-signal verify**: cycle-end Stop hook (`ultrasafe-clean-signal.cjs`, §17.2) 이 4-condition AND-gate (regression-free + monotonic + coverage-floor + consecutive-2-iter) 의 *coverage-floor* condition 측정을 위해 본 skill 에 coverage 재산정 요청 시.

**Skip 조건**: tier == 1 (Tier 1 patch 는 sensitivity 낮음, methodology gap audit 비활성) — 단, 1번 trigger (publish-equivalent gate) 는 tier 무관 항상 활성.

## §2 Input

```jsonc
{
  "target_commit_sha": "string (40-char hex SHA-1)",
  "catalog_versions": {
    "NIST_800-115": "Rev.1 (2008-09) or future bump",
    "OSSTMM": "v3.02 (2010-12) or future bump",
    "OWASP_WSTG": "v4.2 (2020-12) or future bump (v5.0 in draft)",
    "PTES": "v1.0 (2014-08)",
    "ISO_27001_2022": "2022-10 (Annex A 4-theme reorg)",
    "CIS_v8.1": "v8.1 (2024-06)"
  },
  "iteration": "integer (≥ 1)",
  "prior_findings_set": "Finding[] (직전 iteration F_{N-1}, secondary-surface diff 계산용)",
  "test_artifact_snapshot": {
    "coverage_report_paths": "string[] (LCOV / Cobertura / JaCoCo / coverage.py 등)",
    "ci_log_paths": "string[] (GitHub Actions / GitLab CI / Jenkins 로그)",
    "iam_config_snapshot": "string (path) — IAM 정책 파일 (Cognito / IAM JSON / RBAC YAML)"
  },
  "axis_set": "string[] — orchestrator 가 본 attacker 에 dispatch 할 axis 부분집합",
  "agent_roster_snapshot_hash": "string (sha256 hex) — diversity 4-tuple 박제용"
}
```

본 skill 은 **read-only** — `target_commit_sha` 기준으로 `Read` / `Grep` / `Bash (read-only)` 만 사용. mutation 금지 (§3.2 Stackelberg leader observation 준수).

## §3 Methodology

### §3.1 16-cell 2D dispatch matrix

(catalog × test-class) 의 2D — 행: 6 catalog (NIST 800-115 / OSSTMM / OWASP WSTG / PTES / ISO 27001 / CIS v8.1), 열: 4 test-class (planning / discovery / exploitation / reporting). 본 matrix 의 *각 cell* 에 대해 coverage 측정 + finding emit:

| catalog \ test-class | planning | discovery | exploitation | reporting |
|---|---|---|---|---|
| **NIST 800-115** | scope · ROE · rules of engagement 명시 여부 | 4-phase 의 Identification 완료도 | controlled-exploit attempt 의 evidence chain | technical report 의 structure 정합 |
| **OSSTMM** | OPSEC + audit boundary 명시 | RAV input vector (visibility/access/trust) 측정 | controls verification (10-dimension) | RAV score + delta report |
| **OWASP WSTG** | testing categories 12개 매핑 | active vs passive coverage | per-control test evidence | WSTG-ID 별 finding format |
| **PTES** | pre-engagement interactions | intelligence gathering + threat modeling | vulnerability analysis + exploitation | post-exploitation + reporting |
| **ISO 27001:2022** | Annex A 4-theme scope 정의 | control catalog (93 controls) mapping | control effectiveness sampling | management review evidence |
| **CIS v8.1** | IG1/IG2/IG3 tier 결정 | 18 control families mapping | safeguards (153) sampling | metric reporting |

각 cell 의 산출물 = `methodology_anchor` + `iso_theme` (해당 시) + `rav_score` (OSSTMM 의 경우) + `cis_control_id` (CIS 의 경우) + `catalog_version` + `coverage_percentage_under_catalog` + `untested_classes[]`.

### §3.2 Coverage 측정의 결정론적 정의 (§2.1.6 + §6.3 흡수)

```
coverage_percentage_under_catalog = (탐색된 catalog cell 수 / 해당 catalog 전체 cell 수) × 100
```

- **탐색된 cell**: 본 iteration 에서 *증거 첨부* 된 cell — 단순 "발견 0" 은 탐색 X (ambiguous "clean" 회피).
- **untested_classes[]**: 명시적으로 *측정 안 한* cell 의 ID list (예: `["OWASP_WSTG/v4.2/WSTG-AUTHN-04", "ISO_27001_2022/A.5.7"]`). non-empty 시 release gate 의 *coverage-floor* condition 평가 input 으로 직접 전달.
- **catalog_version 박제**: 매 finding 의 `catalog_version` field mandatory — OWASP WSTG v4.2 vs v5.0 의 cell 정의 차이가 coverage 산정에 직접 영향, version 박제 없는 finding 은 invalid (synthesizer 의 dedup 단계에서 reject).

### §3.3 Probe list — methodology gap attacker 의 결정론적 case set

본 attacker 가 *항상 시도* 하는 case (deterministic guarantee, §16.1 의 tool-level guarantee 정합):

1. **Test scope vs threat model gap**: `threat_model.md` (또는 동급 doc) 의 attack surface enumeration 과 *실제 test suite 의 file 단위 coverage* 의 차이 — surface 가 명시됐는데 그 surface 의 test 가 0인 경우 = `methodology_gap.finding`.
2. **Coverage cliff detection**: file 단위 coverage % 분포에서 `> 80%` 와 `< 20%` 가 공존하는 *bimodal* 분포 — cliff edge 의 untested file list 추출. 단순 평균 coverage 는 cliff 를 가려요.
3. **Catalog cell skip**: 6 catalog 의 각 cell 에 대해 "본 repo 에서 측정 시도 됐는가" 를 cell-level 로 확인 — 측정 시도 0 인 cell 은 `untested_classes[]` 에 등록.
4. **CI log evidence gap**: CI log 에서 *test execution 의 명시적 evidence chain* (test name × pass/fail × time × environment fingerprint) 부재 시 = `evidence_chain_break.finding`.
5. **IAM 정책 가설 ≠ 실제 권한 그래프**: `iam_config_snapshot` 의 declared role × policy 와 *실제 권한 그래프* (resource-action 매트릭스) 의 차이 — declared 가 가설, 실제가 ground truth. 차이 있으면 `iam_assumption_drift.finding`.
6. **Compliance anchor staleness**: `external_standard_anchor.catalog_version` 이 prior iteration 대비 *오래된 catalog* 를 참조하면 (예: OWASP WSTG v4.0 vs 현재 v4.2 release) = `catalog_staleness.finding`.
7. **Sampling completeness**: ISO 27001 Annex A 93 control 중 *measurement evidence* 가 attached 된 control 비율 < 80% 면 = `sampling_incomplete.finding`.
8. **"secure" 단어 사용 검출** (§2.1.6 의 결정론적 anti-pattern): 본 repo 의 doc / spec / commit message 에 `\bsecure\b` (case-insensitive) 가 *unqualified* 로 출현하면 (qualifier 없이 "X is secure" 형식) = `unqualified_secure_claim.finding` — 본 attacker 의 직접 의무 검출.

### §3.4 Evidence collection

각 finding 은 verifiable proof 동반:

- **File-line reference**: `path:line` 형식 (예: `src/auth/login.ts:42`). LLM-inferred conclusion 은 `evidence_tier: "inferred"` 표시.
- **Coverage data citation**: LCOV / Cobertura 의 line/branch 단위 hit count, file 단위 평균이 아니라 cell 단위.
- **Catalog cell ID 명시**: 위반된 cell 의 표준 ID — `WSTG-AUTHN-04` / `ISO_27001_2022/A.5.7` / `CIS_v8.1/16.1` 형식.
- **Reproduction steps**: 동일 결과를 다른 agent / 다른 iteration 에서 도출하는 결정론적 절차 (random seed 박제 시).

evidence tier 3-level:
- `verified` — file 직접 read + line-grounded.
- `inferred` — pattern 매칭 + cross-reference, 단일 file 단위 grounding 부족.
- `assumed` — context 추정, 실제 read 안 함 (avoid; synthesizer 가 dedup 단계에서 down-weight).

## §4 Finding output schema

본 attacker 의 finding 은 `ULTRASAFE_FINDING` A2A intent envelope (Constellation §13.16, §18.1) 의 `value` body 로 emit. Ultrasafe.md §4 finding output contract 의 `perspective.primary = "methodology-compliance"` variant (schema 파일은 v0.2.x 미출하 — §14.3 노트).

```jsonc
{
  "type": "CUSTOM",
  "name": "ULTRASAFE_FINDING",
  "targetAgentId": "main",
  "value": {
    "finding_id": "us-2026-06-06-mc-0001",
    "iteration": 2,
    "axis": "usf-methodology-coverage",
    "attacker_id": "methodology-compliance",
    "perspective": { "primary": "methodology-compliance", "secondary": null },
    "severity": {
      "tier": "critical|high|medium|low|info",
      "score_tuple": {
        "scope": "single-file|module|cross-module|system",
        "reversibility": "full|partial|none",
        "external_impact": "none|internal-only|public-disclosure-risk",
        "methodology_weight": "0.0-1.0"
      },
      "hyperbrief_routing": "bool — 4-score sum >= 4 시 true"
    },
    "category": "methodology_gap|coverage_cliff|catalog_skip|evidence_chain_break|iam_assumption_drift|catalog_staleness|sampling_incomplete|unqualified_secure_claim",
    "methodology_anchor": {
      "catalog": "NIST_800-115|OSSTMM|OWASP_WSTG|PTES|ISO_27001_2022|CIS_v8.1",
      "catalog_version": "string — mandatory, 박제",
      "cell_id": "string — 위반 cell 의 catalog-native ID",
      "iso_theme": "Organizational|People|Physical|Technological — ISO 27001 의 경우",
      "rav_score": "number — OSSTMM 의 경우",
      "cis_control_id": "string — CIS v8.1 의 경우"
    },
    "coverage_attestation": {
      "coverage_percentage_under_catalog": "number (0.0-100.0)",
      "untested_classes": "string[] — mandatory, empty 가능하나 field 자체는 mandatory",
      "tested_classes_count": "integer",
      "total_classes_under_catalog": "integer"
    },
    "evidence": {
      "tier": "verified|inferred|assumed",
      "file_line_refs": "string[] — 'path:line' 형식",
      "coverage_data_citation": "string — LCOV/Cobertura 데이터 location",
      "ci_log_ref": "string|null",
      "reproduction_steps": "string"
    },
    "recommended_fix": {
      "summary": "string — 1줄",
      "detailed_steps": "string[]",
      "estimated_effort": "trivial|small|medium|large",
      "permanent_manual": "bool — auto-apply 금지 여부 (§2.1.4)"
    },
    "advisory": true,
    "would_block_in_v03": "bool — v0.3+ blocking mode 진입 시 차단 후보 여부",
    "schema_version": "0.2.0",
    "_sig": "string — Ed25519 signature (§8.1 v0.1.0 인증 layer, advisory 에서도 권장)"
  }
}
```

**Mandatory field**: `methodology_anchor.catalog_version` + `coverage_attestation.coverage_percentage_under_catalog` + `coverage_attestation.untested_classes` + `advisory: true` + `schema_version`. missing 시 synthesizer (agent 8) 가 dedup 단계에서 reject.

## §5 Examples

### Example 1 — Coverage cliff detection (trigger 2 + probe 2)

**Context**: tier = 2, axis_set 에 `usf-methodology-coverage` 포함, iteration = 1. `coverage_report_paths` 의 LCOV 파일 분석.

**Probe 실행**: file 단위 coverage % 분포 산출 — `src/auth/login.ts: 92%`, `src/auth/refresh.ts: 95%`, `src/api/user.ts: 88%`, `src/api/admin.ts: 12%`, `src/api/billing.ts: 8%`, `src/util/log.ts: 78%`. bimodal 분포 (> 80% 와 < 20%) 의 cliff 검출.

**Finding emit**:
```json
{
  "finding_id": "us-2026-06-06-mc-0001",
  "iteration": 1,
  "axis": "usf-methodology-coverage",
  "attacker_id": "methodology-compliance",
  "category": "coverage_cliff",
  "methodology_anchor": {
    "catalog": "OWASP_WSTG",
    "catalog_version": "v4.2",
    "cell_id": "WSTG-APIT-01"
  },
  "coverage_attestation": {
    "coverage_percentage_under_catalog": 62.5,
    "untested_classes": ["src/api/admin.ts (12%)", "src/api/billing.ts (8%)"],
    "tested_classes_count": 4,
    "total_classes_under_catalog": 6
  },
  "severity": { "tier": "high", "hyperbrief_routing": true },
  "evidence": {
    "tier": "verified",
    "file_line_refs": ["src/api/admin.ts:1", "src/api/billing.ts:1"],
    "coverage_data_citation": "coverage/lcov.info:23-47",
    "reproduction_steps": "1) target_commit_sha 의 coverage/lcov.info parse, 2) file 단위 평균 < 20% 추출, 3) admin + billing 의 line coverage 검증"
  },
  "recommended_fix": {
    "summary": "admin / billing endpoint 의 negative + auth-bypass test 추가",
    "estimated_effort": "medium",
    "permanent_manual": false
  },
  "advisory": true,
  "would_block_in_v03": true,
  "schema_version": "0.2.0"
}
```

### Example 2 — Unqualified "secure" claim (probe 8)

**Context**: tier = 3, doc 검사 axis. `README.md` 와 `docs/security.md` Grep.

**Probe 실행**: `\bsecure\b` (case-insensitive) Grep → `README.md:14`: "Our auth flow is secure by design." → unqualified (catalog/version/coverage % 명시 없음).

**Finding emit**: severity = `medium`, category = `unqualified_secure_claim`, `recommended_fix.summary` = "*'passed coverage X% under catalog v_Y as of date Z'* 형식으로 재기술", `permanent_manual: true` (문구 결정은 human gate).

### Example 3 — Catalog staleness + IAM assumption drift 복합 (probe 5 + 6)

**Context**: iteration = 3, prior finding set 에 IAM 관련 finding 잔존. `iam_config_snapshot` + `external_standard_anchor.catalog_version` 동시 검사.

**Probe 실행**:
- IAM declared role `admin-readonly` 의 policy 가 `s3:GetObject` 만 허용 명시.
- 실제 권한 그래프 (boto3 simulate-principal-policy 결과 fixture) 가 `s3:ListBucket` + `s3:GetObject` 둘 다 허용 → drift.
- `external_standard_anchor.catalog_version`: ISO 27001:2013 참조 중. 현재 ISO 27001:2022 (Annex A 4-theme reorg) release 된 지 4년.

**Finding emit** (2 finding, 동일 envelope batch):
- Finding A: category = `iam_assumption_drift`, severity = `high`, `would_block_in_v03: true`, `permanent_manual: false` (IAM policy fix 는 코드).
- Finding B: category = `catalog_staleness`, severity = `medium`, `methodology_anchor.catalog_version = "2013"` (현 stale), recommended = "ISO 27001:2022 로 anchor migrate + Annex A 4-theme 재매핑", `permanent_manual: true` (catalog migration 은 governance decision).

## §6 Anti-patterns

본 skill 사용 시 다음 패턴은 **금기** — 검출 시 synthesizer reject 또는 broker meta-safety hit.

1. **"Secure" 단언 자체** — 본 attacker 의 finding 본문에서 `\bsecure\b` 단어를 *qualifier 없이* 사용 금지. 모든 표현은 *"passed coverage X% under catalog v_Y as of date Z"* 형식 한정. 본 attacker 가 anti-pattern 검출자인 동시에 본 anti-pattern 의 직접 강제 대상.
2. **Catalog version 미기재 finding** — `methodology_anchor.catalog_version` 미명시 시 finding 은 invalid. OWASP WSTG v4.2 vs v5.0 의 cell 정의가 다르면 coverage % 의미 자체가 달라요. version 박제는 falsifiability anchor (§12.4 Cluster C8 정합).
3. **단순 평균 coverage 만 보고** — file 단위 평균 coverage 80% 라도 bimodal cliff (90% file + 20% file 혼재) 가 숨어있어요. cell 단위 + cliff detection 미포함 finding 은 down-weight.
4. **외부 compliance scanner 호출 시도** — 본 attacker 는 read-only. `Bash` tool 로 외부 endpoint (compliance API · vendor scanner) 호출 금지. 로컬 file 분석 + git log + 정적 catalog reference 만.
5. **"Coverage 100%" 단언** — 무측정 영역 (untested_classes[]) 가 empty 라고 단언하는 것은 결정론적 위반. 모든 catalog 의 모든 cell 을 측정하는 건 불가능 — *어떤 cell 을 measurement scope 에서 제외했는지* 명시가 본 attacker 의 의무.
6. **Hyperbrief escalation 없이 high+ severity finding emit** — `score_tuple` 의 4-tuple 합 ≥ 4 인데 `hyperbrief_routing: false` 면 invalid. severity 와 routing decision 은 결정론적으로 묶여요 (§7 Severity rubric).
7. **prior_findings_set 무시** — iteration N 의 finding 이 iteration N-1 의 finding 과 *완전 동일* 인데 (regression) `secondary_surface_diff` 미명시 시 synthesizer dedup 단계 에서 reject. 본 attacker 는 *그 diff 의 결정론적 산출* 책임 있음.
8. **Auto-block 시도** — v0.2.x advisory mode 에서 본 attacker 의 finding 이 `would_block_in_v03: true` 라도 *현 cycle 의 publish 차단 안 함*. 차단 시도 자체가 advisory mode 위반. blocking mode (v0.3+) 진입 후에도 차단 결정 주체는 release-gate 단계, attacker 가 아님.

## §7 Severity rubric

본 attacker 의 4-tuple severity 산정:

| category | base severity | scope weight | reversibility weight | external_impact weight |
|---|---|---|---|---|
| `methodology_gap` | medium | +1 if cross-module | +1 if none | +1 if public-disclosure-risk |
| `coverage_cliff` | high | +1 if system | +1 if partial+ | +1 if public-disclosure-risk |
| `catalog_skip` | medium | +1 if cross-module | 0 | +1 if public-disclosure-risk |
| `evidence_chain_break` | high | +1 if module+ | +1 if none | 0 |
| `iam_assumption_drift` | critical | always +1 | always +1 | +1 if public-disclosure-risk |
| `catalog_staleness` | low | 0 | 0 | 0 |
| `sampling_incomplete` | medium | +1 if cross-module | 0 | 0 |
| `unqualified_secure_claim` | low | 0 | 0 | +1 if public-disclosure-risk |

**Hyperbrief routing trigger**: `severity.tier ∈ {high, critical}` OR `score_tuple` 4-tuple 합 ≥ 4 → `hyperbrief_routing: true` mandatory. routing true 시 synthesizer (agent 8) 가 `value.layer_2_hyperbrief` 에 9-section IR 후보 자동 생성 (§15.8).

## §8 Cross-references

- **Ultrasafe.md §2.1.6** — catalog version + coverage % + untested_classes mandatory 강제 origin.
- **Ultrasafe.md §3.1** — 13-axis matrix 의 `usf-iam-config` / `usf-methodology-coverage` / `usf-compliance-anchor` axis 정의.
- **Ultrasafe.md §6.3** — coverage definition 결정론적 명시 (cell 단위, 무측정 영역 명시).
- **Ultrasafe.md §15.6** — 본 agent 의 roster shape (8-agent fan-out 의 agent 6 position).
- **Ultrasafe.md §15.8** — synthesizer (agent 8) 의 본 finding aggregation + dedup + 3-layer report 합성.
- **Ultrasafe.md §15.9** — Workflow fan-out dispatch sequence (orchestrator → 7 attacker 병렬 → retire-barrier → synthesizer).
- **Ultrasafe.md §17.1** — PreToolUse hook `ultrasafe-trigger.cjs` (publish-equivalent gate, 본 skill invoke trigger).
- **Ultrasafe.md §17.2** — Stop hook `ultrasafe-clean-signal.cjs` (cycle-end coverage 재산정 요청).
- **Ultrasafe.md §16.1** — MCP tool `ultrasafe_run_fanout` (본 skill 의 dispatch 진입점).
- **Constellation.md §13.16.9** — `ULTRASAFE_FINDING` intent 의 A2A-intent allowlist 등재 + 4-group routing.
- **Constellation.md §13.16.10** — pre-send cursor-tail probe (본 skill 의 outbound emit 전 inbox 확인 의무).
- **Constellation.md §8.1** — `ULTRASAFE_FINDING` wire format canonical schema + `_sig` Ed25519 인증.
- **Constellation.md §8.2** — A2A inbound Spotlighting wrapper (본 skill 이 prior_findings_set 수신 시 wrapper 적용).
- **Hyperbrief.md §1** — score ≥ 4 finding 의 9-section IR routing 양식.
- **Hyperbrief.md §2** — 4-score escalation + 5 MUST-trigger rubric (severity → routing 결정).
- **Greatpractice.md** — 본 attacker 의 *unqualified secure claim* + *catalog version 박제* anti-pattern 이 micro tree 의 자식 노드 후보.
- **Superscalar.md §3** — Workflow fan-out 의 read-only lane 분류 (본 skill 은 read-only 이므로 speculative lane 가능).
- **Ultrasafe.md §4 finding output contract** — 본 skill 의 output 계약 정본 (schema 파일은 v0.2.x 미출하).
- **`memory/feedback_outbox_json_validation.md`** — outbox emit 시 single-line JSON 검증 + roundtrip parse 강제 (본 skill 도 emit 측 invariant 적용).
- **`memory/feedback_pre_send_inbound_check.md`** — outbox push 전 inbox cursor-tail probe (본 skill 의 emit 전 의무 routine).
- **`memory/feedback_public_repo_redaction.md`** — finding body 의 redaction discipline (verbatim chat / governance attribution 0).
