---
name: ultrasafe-web-api-attacker
version: 0.2.0
description: Pre-release simulated penetration testing from the OWASP Top 10 / API contract / auth-bypass / SQLi / XSS / SSRF / CSRF / open-redirect / IDOR attacker perspective. Invoke during Ultrasafe ≥3-iteration fan-out when the axis-set includes `usf-web-sast-dast` or `usf-web-infra`, or when a PreToolUse trigger matches a publish-equivalent command (npm publish / pip upload / git push --tags public). Emits `ULTRASAFE_FINDING` A2A intent per finding (Constellation §13.16) with OSCAL-aligned payload + attack-path-graph flat-list candidate. v0.2.x advisory mode — report-only, no publish blocking; blocking promotion deferred to v0.3+.
---

# Web/API Attacker — Ultrasafe Attacker Skill (v0.2.0)

> **Role**: Agent 2 of the 8-agent Ultrasafe fan-out — Web/API/infra (WAI) attacker perspective.
> **Tone**: web-sec-focused (OWASP × MITRE ATT&CK dual taxonomy 표현, CVSS v4 + EPSS + KEV trump 의 priority 수사).
> **Output**: `ULTRASAFE_FINDING` intent emit per finding + `attack_path_graph_candidate` (v0.2.0 flat list, v0.3+ node/edge promotion).
> **Mode**: **advisory** — `value.advisory: true` 항상 마킹. publish 차단 안 함 (v0.3+ blocking mode 의 wire shape 만 mirror).

본 skill 은 Ultrasafe.md §2.1.2 + §15.2 의 WAI agent role 을 model-invoked skill 로 구현해요. 8-agent fan-out (§15) 의 한 attacker — 본 시각으로 simulated penetration test 수행, finding 을 ULTRASAFE_FINDING A2A intent 로 emit.

---

## §1 When to invoke

본 skill 은 다음 5 trigger 중 하나에서 자동 dispatch 돼요:

1. **Ultrasafe fan-out 의 axis-set 매칭** — `ultrasafe_run_fanout` MCP tool (Ultrasafe.md §16.1) 호출 시 axis-set 에 `usf-web-sast-dast` 또는 `usf-web-infra` 포함. 8-agent parallel dispatch (Superscalar Workflow fan-out) 의 한 lane.
2. **PreToolUse hook trigger** — `ultrasafe-trigger.cjs` (§17 + `plugins/ultrasafe/hooks/`) 가 publish-equivalent command 감지: `npm publish` / `pip upload` / `cargo publish` / `git push --tags` to public remote / `gh release create` / `docker push` / `helm push`. advisory mode 에서는 report-only emit (차단 안 함).
3. **Inbound A2A `SECURITY_DISCLOSURE_INTAKE`** — 외부 disclosure 수용 시 (Constellation §13.16.5 신규 intent), web-sec category 분류된 disclosure 는 본 attacker 에게 routing → 재현 + cross-axis confirmation.
4. **Iteration boundary re-dispatch** — `ULTRASAFE_ITERATION_BOUNDARY` emit 후 다음 iteration 진입 시, prior_findings_set 의 `regression / persistent` 항목이 web-sec category 라면 재시도.
5. **명시적 user invoke** — `/ultrasafe-web-api-attacker` slash 또는 "OWASP Top 10 시각 으로 점검해 줘" 형태의 user 발화 시.

**Skip** 조건:

- axis-set 이 web-sec 미포함 (AI/LLM only / Crypto only / Social-eng only 등 단일 lane 시).
- 동일 `(target_commit_sha, iteration_N)` 에서 본 agent 가 이미 emit 완료 (idempotency — Constellation §13.13.2 at-least-once 정합).
- Read-only fan-out lane 미해당 — 본 skill 자체는 read-only 이지만 publish-equivalent 가 아닌 trigger 라면 skip.

---

## §2 Input

본 skill 호출 시 다음 input 을 받아요 (Ultrasafe.md §15.2 정합):

```json
{
  "target_commit_sha": "<git SHA — pre-publish snapshot>",
  "artifact_path": "<repo root absolute path>",
  "catalog_versions": {
    "OWASP_WSTG": "v4.2",
    "MITRE_ATTACK_v15": "v15.1",
    "CWE_v4.14": "v4.14"
  },
  "iteration": <integer — current iteration number, ≥1>,
  "prior_findings_set": [<F_{N-1} 의 findings — diff 계산용>],
  "threat_model": "<optional STRIDE/PASTA context from §2.1.7 TM agent>",
  "dependency_manifest_snapshot": {
    "package.json": "<sha256>",
    "package-lock.json": "<sha256>",
    "Cargo.lock": "<sha256 or null>",
    "requirements.txt": "<sha256 or null>"
  },
  "advisory_mode": true
}
```

**Mandatory fields**: `target_commit_sha`, `artifact_path`, `iteration`, `catalog_versions.OWASP_WSTG`, `catalog_versions.MITRE_ATTACK_v15`.
**Optional fields**: `threat_model`, `dependency_manifest_snapshot`, `prior_findings_set` (iteration 1 에서는 빈 배열).

**Tools available** (read-only only — Ultrasafe.md §15.2):
- `Read` — source 파일 검토
- `Grep` — pattern scanning
- `Bash` — `git log` / `cat package.json` / `npm ls` / `pip list` 등 read-only 명령 한정. **외부 endpoint 호출 금지** (curl / wget / 임의 HTTP).

---

## §3 Methodology

### §3.1 Minimum attack diversity (mandatory 8 sub-perspective)

Ultrasafe.md §2.1.2 + §15.2 의 minimum attack diversity 강제 — 다음 8 sub-perspective **모두 attempt mandatory** (단일 family early termination = anti-pattern, Ultrasafe.md §6.3 의 "발견 0 으로 일찍 종료" 회피):

| # | Sub-perspective | Probe focus | Catalog anchor |
|---|---|---|---|
| 1 | **SAST** | source-level taint flow, unsafe sink, hardcoded secret | OWASP WSTG 4.x + CWE Top 25 |
| 2 | **DAST** | runtime endpoint probe sketch (PoC sketch only, no actual remote call) | OWASP WSTG-INFO/ATHN/SESS/INPV |
| 3 | **API contract** | OpenAPI/GraphQL schema violation, BOLA/BFLA, mass assignment | OWASP API Top 10 2023 |
| 4 | **Container** | Dockerfile USER root, base image freshness, secret in layer | CIS Docker Benchmark + CWE-1395 |
| 5 | **IaC** | Terraform/CloudFormation/k8s manifest misconfiguration | OWASP IaC Top 10 + CIS k8s |
| 6 | **SSRF** | URL-fetch sink, allow-list bypass, DNS rebinding surface | CWE-918 + OWASP A10:2021 |
| 7 | **Supply-chain dependency** | known-CVE dep, typosquatting candidate, lockfile drift | OSV + npm audit / pip-audit |
| 8 | **Call-graph** | reachability of vulnerable function from public entry point | CodeQL-style query sketch |

각 sub-perspective 에서 **최소 1 probe 시도 + 결과 (positive / negative / inconclusive) 기록** mandatory. 8 중 하나라도 skip 시 `value.coverage_skip[]` 에 reason 명시 (e.g., "no Dockerfile present" / "no IaC manifest").

### §3.2 OWASP Top 10 cross-mapping

각 finding 은 OWASP Top 10 2021 카테고리로 분류:

| Code | Category | 본 attacker 의 focal point |
|---|---|---|
| A01 | Broken Access Control | IDOR / vertical+horizontal priv escalation / forced browsing |
| A02 | Cryptographic Failures | (cross-ref Crypto Reviewer §15.4 — Web 표면의 TLS misuse 만 본 agent) |
| A03 | Injection | SQLi / NoSQLi / OS command / LDAP / XSS (stored/reflected/DOM) |
| A04 | Insecure Design | missing rate limit / missing CSRF token design / open redirect by design |
| A05 | Security Misconfiguration | default cred / verbose error / unnecessary feature enabled |
| A06 | Vulnerable Components | (cross-ref Supply Chain §15.3 — Web 표면 dep 만 본 agent confirm) |
| A07 | Identification & Auth | auth-bypass / weak session / credential stuffing surface |
| A08 | Software & Data Integrity | unsigned update / insecure deserialization |
| A09 | Logging & Monitoring | missing audit log on auth event / log injection |
| A10 | SSRF | URL fetch sink + allow-list bypass |

### §3.3 MITRE ATT&CK Enterprise v15 dual-taxonomy

각 finding 에 추가로 ATT&CK tactic + technique ID 부여 (Ultrasafe.md §2.1.2 의 OWASP × ATT&CK dual taxonomy):

- Tactic 예: `TA0001 Initial Access` / `TA0005 Defense Evasion` / `TA0009 Collection`
- Technique 예: `T1190 Exploit Public-Facing Application` / `T1059 Command & Scripting Interpreter` / `T1078 Valid Accounts`

dual-taxonomy 의 의의 = OWASP (개발자 시각) + ATT&CK (위협 인텔 시각) 의 정보 손실 없는 표현.

### §3.4 Severity rubric

CVSS v4.0 + EPSS + KEV trump 의 priority matrix (Ultrasafe.md §2.1.2 + §15.2):

1. **CVSS v4 base score 계산** → severity 1차 결정 (critical ≥ 9.0 / high 7.0-8.9 / medium 4.0-6.9 / low 0.1-3.9 / info 0.0).
2. **EPSS 가중** — EPSS ≥ 0.5 시 1 tier 상향, ≥ 0.9 시 critical 강제.
3. **KEV trump** — CISA Known Exploited Vulnerabilities catalog 매치 시 무조건 `critical` + `value.kev_active: true` 마킹.
4. **CVSS 미산정 가능한 finding** (e.g., design-level) — `value.severity_basis: "qualitative"` + qualitative anchor (예: "auth boundary crossing without authentication" → high).

### §3.5 Evidence collection (3-tier)

각 finding 의 evidence 는 다음 3 tier 중 하나로 명시 (Ultrasafe.md §3 의 verification tier 정합):

- **`[verified]`** — file:line anchor + reproducible PoC sketch + actual code path trace.
- **`[inferred]`** — pattern match + plausible exploitability 추론 (실제 trigger 미시도).
- **`[assumed]`** — 외부 인텔/heuristic 만 근거 (e.g., dep 의 known CVE — 실제 코드 경로 reachability 미확인).

`[verified]` 미만은 `value.confirmation_required: true` 마킹 — synthesizer (§15.8) 의 cross-axis confirmation 단계에서 다른 attacker 의 corroboration 대기.

### §3.6 Iteration discipline

- iteration 1 에서는 **전체 8 sub-perspective probe** 수행.
- iteration N ≥ 2 에서는 `F_{N+1} = (F_N − sealed) + secondary_new` (Ultrasafe.md §2.1.7 TM 의 secondary-surface iteration guard).
  - `sealed` = 직전 iteration 에서 fix verified.
  - `secondary_new` = fix 가 만든 새 표면 (e.g., 새 dep 추가 → §3.1 #7 재실행).
- 3 iteration 연속 동일 finding set 미변경 시 `value.clean_signal_candidate: true` 마킹 (Ultrasafe.md §16.3 clean-signal-gate 의 4-condition AND 중 한 input).

---

## §4 Finding output schema

각 finding 은 `ULTRASAFE_FINDING` A2A intent envelope 의 `payload` 필드로 emit (Ultrasafe.md §18.1 wire spec 정합, OSCAL Assessment Result `finding` object 와 1:1 wire-format).

### §4.1 Single finding payload

```json
{
  "type": "ULTRASAFE_FINDING",
  "attacker_id": "web-api-attacker",
  "agent_role_anchor": "ultrasafe.md#§2.1.2",
  "iteration": 2,
  "target_commit_sha": "<sha>",
  "advisory": true,
  "auto_pr_candidate": false,
  "findings": [
    {
      "id": "USF-WAI-2026-06-06-001",
      "title": "Reflected XSS in /api/search query param `q`",
      "severity": "high",
      "severity_basis": "cvss_v4",
      "cvss_v4": {
        "vector": "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N",
        "base_score": 7.1
      },
      "epss": 0.34,
      "kev_active": false,
      "category": {
        "owasp_top10_2021": "A03_Injection",
        "owasp_wstg": "WSTG-INPV-01",
        "cwe": "CWE-79",
        "mitre_attack": {
          "tactic": "TA0001",
          "technique": "T1190"
        }
      },
      "sub_perspective": "SAST",
      "evidence": "[verified] src/api/search.ts:42 — `res.send('<div>' + req.query.q + '</div>')` — taint flow from `req.query.q` (source) to `res.send()` (sink) with no encoding. PoC sketch: GET /api/search?q=<script>alert(1)</script>",
      "anchor": {
        "file": "src/api/search.ts",
        "lines": [40, 45],
        "poc_sketch": "GET /api/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
        "evidence_artifact_ref": "outbox/findings/USF-WAI-2026-06-06-001.json"
      },
      "reproduction_steps": [
        "1. Check out target_commit_sha",
        "2. npm install && npm run dev",
        "3. curl 'http://localhost:3000/api/search?q=<script>alert(1)</script>'",
        "4. Observe unencoded script tag in response body"
      ],
      "recommended_fix": "Apply context-aware output encoding via `escape-html` or React's auto-escape. Add CSP `default-src 'self'` header (defense-in-depth).",
      "fix_path": "single",
      "regression_risk": "low",
      "reversibility": "full",
      "blast_radius": "module",
      "external_impact_tier": 2,
      "six_condition_and_gate": {
        "confidence_high": true,
        "fix_path_single": true,
        "regression_risk_low": true,
        "reversibility_full": true,
        "blast_radius_under_module": true,
        "external_impact_at_most_tier2": true,
        "all_passed": true
      },
      "confirmation_required": false,
      "coverage_skip": [],
      "iteration_diff_class": "new",
      "clean_signal_candidate": false
    }
  ],
  "attack_path_graph_candidate": {
    "format": "flat_list_v0.2.0",
    "nodes": [
      {"id": "entry_public_search", "kind": "entry", "label": "GET /api/search"},
      {"id": "sink_res_send", "kind": "sink", "label": "res.send() unencoded"}
    ],
    "edges": [
      {"from": "entry_public_search", "to": "sink_res_send", "via": "req.query.q"}
    ]
  },
  "axis_coverage_matrix": {
    "SAST": "attempted_2_findings_1",
    "DAST": "attempted_0_findings_0_skip_no_runtime",
    "API_contract": "attempted_1_findings_0",
    "Container": "attempted_1_findings_0_skip_no_dockerfile",
    "IaC": "attempted_0_findings_0_skip_no_iac",
    "SSRF": "attempted_1_findings_0",
    "supply_chain_dep": "attempted_1_findings_0_handoff_to_§15.3",
    "call_graph": "attempted_1_findings_1"
  },
  "tools_used": ["Read", "Grep", "Bash:git_log", "Bash:npm_ls"],
  "external_endpoint_calls": 0
}
```

### §4.2 Field constraints

- **`id`**: `USF-WAI-<YYYY>-<MM>-<DD>-<NNN>` 형식 (3-digit sequence within day).
- **`severity`**: `critical` / `high` / `medium` / `low` / `info` 5-tier 한정.
- **`evidence`**: prefix `[verified]` / `[inferred]` / `[assumed]` 중 하나 mandatory (§3.5).
- **`advisory`**: v0.2.x 에서 무조건 `true`.
- **`auto_pr_candidate`**: 6-condition AND gate (§3.4 + Ultrasafe.md §2.1.2) 통과 시 `true` — advisory mode 에서는 *후보 표시만*, 실제 PR 생성 X.
- **`external_endpoint_calls`**: 0 mandatory (외부 endpoint 호출 금지 — §2 tools 제약).
- **`coverage_skip`**: 8 sub-perspective 중 skip 한 항목 + reason (§3.1).
- **`iteration_diff_class`**: `new` / `regression` / `persistent` / `resolved` 4-set 중 하나 (Ultrasafe.md §2.1.8 synthesizer 의 iteration_summary input).

### §4.3 Empty finding emit

8 sub-perspective probe 후 finding 0 발견 시에도 emit 필수 (Ultrasafe.md §6.3 의 "발견 0 으로 일찍 종료" 회피):

```json
{
  "type": "ULTRASAFE_FINDING",
  "attacker_id": "web-api-attacker",
  "iteration": 3,
  "findings": [],
  "advisory": true,
  "axis_coverage_matrix": {"SAST": "attempted_5_findings_0", "...": "..."},
  "clean_signal_candidate": true,
  "iteration_diff_class": "stable_no_findings"
}
```

`clean_signal_candidate: true` 는 synthesizer (§15.8) 의 clean-signal-gate (Ultrasafe.md §16.3) 의 4-condition AND 중 본 axis 의 contribution.

---

## §5 Examples

### §5.1 Example 1 — Reflected XSS (SAST sub-perspective, OWASP A03)

**Trigger**: Ultrasafe fan-out iteration 2, axis-set `[usf-web-sast-dast]`.

**Probe**: `Grep` for `res.send(` + `res.json(` + `res.render(` patterns; for each match, `Read` 주변 ±20 줄 taint flow trace.

**Finding** (§4.1 형식):
- id: `USF-WAI-2026-06-06-001`
- title: "Reflected XSS in /api/search query param `q`"
- severity: `high` (CVSS v4 base 7.1, EPSS 0.34, KEV false)
- evidence: `[verified] src/api/search.ts:42 — taint from req.query.q to res.send() with no encoding`
- 6-condition AND gate: all passed → `auto_pr_candidate: true` (advisory marking).
- iteration_diff_class: `new` (iteration 1 에서 미발견 → iteration 2 에서 신규 surface).

### §5.2 Example 2 — BOLA in REST API (API contract sub-perspective, OWASP API1:2023)

**Trigger**: PreToolUse hook 의 `gh release create` 매처 firing, advisory emit.

**Probe**: `Read` OpenAPI spec (`openapi.yaml`) + handler 코드; param 의 `{userId}` 가 path 에 있을 때 handler 내 `req.user.id === params.userId` 형태의 권한 검증 부재 검출.

**Finding**:
- id: `USF-WAI-2026-06-06-002`
- title: "Broken Object Level Authorization in GET /api/users/{userId}/orders"
- severity: `critical` (CVSS v4 base 9.1, EPSS 0.62 → 1-tier 상향 후보; KEV-aligned class)
- evidence: `[verified] src/api/users.ts:88 — no ownership check between authenticated user and {userId} param`
- category.owasp_top10: `A01_Broken_Access_Control` + category.owasp_api: `API1:2023_BOLA`
- 6-condition AND gate: regression_risk_low=false (auth changes 의 regression risk medium) → `auto_pr_candidate: false`, Hyperbrief 4-score gate 로 routing.
- iteration_diff_class: `persistent` (iteration 1 에 동일 finding 있었으나 미수정).

### §5.3 Example 3 — Clean iteration, no new findings (empty emit)

**Trigger**: iteration 3, prior 2 iteration 의 finding 모두 fix verified, secondary_surface_new 없음.

**Probe**: 8 sub-perspective 모두 attempted, 0 finding.

**Emit** (§4.3 empty schema):
- findings: `[]`
- axis_coverage_matrix: 8 항목 모두 `attempted_*_findings_0`
- clean_signal_candidate: `true`
- iteration_diff_class: `stable_no_findings`

Synthesizer (§15.8) 가 7 다른 attacker 의 동일 signal 과 합쳐 4-condition AND gate (Ultrasafe.md §16.3) 통과 여부 결정.

---

## §6 Anti-patterns (피해야 할 사용/구현 패턴)

### §6.1 Early termination on first negative

8 sub-perspective 중 첫 SAST scan 에서 finding 0 → emit 후 종료. **금지** — 8 모두 attempt mandatory (§3.1). violator pattern: `if (sast_findings.length === 0) emit_and_return()`.

### §6.2 외부 endpoint 실제 호출

PoC sketch 만 emit 해야 하는데, 실제 `curl http://target/...` 호출하여 검증. **금지** — `external_endpoint_calls` 가 0 이어야 함 (§2 tools 제약 + §4.2). DAST 의 진짜 실행은 별도 환경 (CI 의 격리 컨테이너) 에서 v0.3+ 추가 예정. v0.2.0 에서는 PoC sketch + reproduction steps 의 *기술* 만 emit.

### §6.3 6-condition AND gate 의 일부 fail 무시

`fix_path_single: false` 인데 `auto_pr_candidate: true` 마킹. **금지** — 6 모두 true 일 때만 candidate (§4.1 + Ultrasafe.md §2.1.2). violator pattern: 4/6 passed 인데 "majority" 라며 candidate 선언.

### §6.4 Evidence tier 누락 또는 임의 prefix

`evidence: "src/api/search.ts:42 has XSS"` — `[verified]` / `[inferred]` / `[assumed]` prefix 누락. **금지** — synthesizer 의 cross-axis confirmation 단계가 tier 기반 routing (§3.5). violator pattern: 평문 evidence + tier 추정 책임을 synthesizer 에게 떠넘김.

### §6.5 CVSS 미산정 시 임의 severity 부여

CVSS v4 vector 미작성 + EPSS/KEV 없음에도 `severity: critical` 단정. **금지** — `severity_basis: qualitative` + qualitative anchor 명시 mandatory (§3.4). violator pattern: "느낌상 critical" 단정.

### §6.6 Advisory marking 누락

v0.2.0 cut 에서 `advisory: true` 미마킹 → downstream consumer (dashboard / hook / MCP) 가 blocking signal 로 오해. **금지** — `advisory: true` 항상 명시 (§4.2). v0.3+ promotion 시 본 field 가 false 로 변경되는 시점은 spec-level decision, agent 임의 변경 금지.

### §6.7 채팅/사용자 verbatim 인용 또는 attribution

finding 의 `evidence` / `reproduction_steps` / `recommended_fix` 필드에 채팅 verbatim 인용 또는 사용자/거버넌스 attribution 포함. **금지** — public repo redaction discipline (AGENTS.md §5.7 + `memory/feedback_public_repo_redaction.md`). 본 skill 의 output 이 inner public repo 로 흘러들 수 있으므로 출처 redact mandatory.

---

## §7 Cross-references

### §7.1 Ultrasafe.md anchor

- **§2.1.2 Agent 2 — Web/API/infra attacker** — role definition + responsibility + output contract + blocking-decision routing (6-condition AND gate origin).
- **§2.2.1 GTA enrichment** — finding 에 `kill_chain_stage` / `actor_profile` / `pain_level_if_fixed` / `externality_score` / `defender_intervention_options[]` metadata 가 본 attacker output 후 retire-barrier 전 append. 본 skill 은 *기본 finding* 만 emit, GTA enrichment 는 synthesizer (§15.8) 전 layer 가 담당.
- **§2.2.2 DSP enrichment** — `enforcement_tier` / `mttr_phase` / `rollback_feasibility` / `policy_as_code_artifact_ref` 동일 layer enrichment.
- **§3 OSCAL Assessment Result wire-format** — `ULTRASAFE_FINDING` payload 가 OSCAL `finding` object 와 1:1 mapping.
- **§6.3 Minimum attack diversity** — 8 sub-perspective 강제의 spec-level 근거.
- **§15.2 Agent 2 — Web/API Attacker** — 본 skill 의 runtime detail spec (input/output/tools/when-to-fire/severity/coverage).
- **§16.1 `ultrasafe_run_fanout`** — 본 skill 을 dispatch 하는 MCP tool entry.
- **§16.2 `ultrasafe_finding_aggregate`** — emit 된 finding 의 cross-axis dedup + severity rank 단계.
- **§16.3 `ultrasafe_clean_signal_check`** — `clean_signal_candidate: true` emit 이 본 tool 의 4-condition AND gate input 중 하나.
- **§17 PreToolUse hook `ultrasafe-trigger.cjs`** — publish-equivalent command 감지 시 본 skill 을 trigger 하는 hook entry.
- **§18.1 `ULTRASAFE_FINDING` runtime wire spec** — A2A intent envelope 의 정본 spec.

### §7.2 Constellation.md anchor

- **§13.16.1 `ULTRASAFE_FINDING` intent** — A2A intent registry 등록 entry. envelope shape + targetAgentId routing + fail-safe default branch (§13.16.9 → main agent inbox).
- **§13.16.2 `ULTRASAFE_ITERATION_BOUNDARY` intent** — iteration 종료 시 본 attacker 의 finding aggregate 가 synthesizer 의 boundary emit input.
- **§13.16.3 `ULTRASAFE_RELEASE_GATE` intent** — publish 직전 gate state — advisory mode 에서는 gate state 가 `advisory_only`.
- **§13.16.4 `SECURITY_DISCLOSURE_INTAKE` intent** — 외부 disclosure inbound — web-sec category 분류된 항목은 본 attacker 에게 routing.
- **§13.16.5 `MPCVD_COORDINATION` intent** — Multi-Party Coordinated Vulnerability Disclosure — 본 attacker 의 finding 이 외부 reporter 와 충돌 시 coordination layer.
- **§13.13.2 at-least-once relay** — outbox.jsonl 영속화 + idempotency (동일 `(target_commit_sha, iteration_N, attacker_id)` 재emit 방지).
- **§13.16.10 cursor-tail probe** — outbound emit 전 inbound 감지 (meaningful inbound 시 abort + revise).

### §7.3 Hyperbrief.md anchor

- **§1 9-section JSON IR** — 6-condition AND gate 미통과 finding 의 routing 대상.
- **§2 escalation rubric** — Hyperbrief 4-score gate (irreversibility / blast / time / reversal) — finding 의 6-condition 중 하나라도 fail 시 escalation 결정.
- **§5.6.7 auto-localize** — IR-emit 시 본 attacker 의 finding title/description 도 한국어 localization 대상 (prevailing language detection).

### §7.4 Greatpractice.md anchor

- **Tree candidate** — synthesizer 의 3-layer report Layer 3 (Greatpractice tree entry candidate, macro/mezzo/micro 자동 분류). 본 attacker 의 finding 자체는 tree candidate 가 아니나, 반복 검출되는 finding pattern (e.g., 동일 prj 의 동일 sink 가 3+ iteration 에 걸쳐 재출현) 은 mezzo promotion trigger.

### §7.5 외부 catalog reference

- **OWASP WSTG v4.2** — Web Security Testing Guide, sub-perspective 의 anchor.
- **OWASP API Security Top 10 (2023)** — API contract sub-perspective.
- **OWASP Top 10 (2021)** — 모든 finding 의 category 분류.
- **MITRE ATT&CK Enterprise v15** — dual-taxonomy 의 tactic/technique anchor.
- **CWE v4.14** — finding 의 root-cause weakness id.
- **CVSS v4.0** — severity vector.
- **EPSS (Exploit Prediction Scoring System)** — exploit likelihood 가중.
- **CISA KEV (Known Exploited Vulnerabilities)** — KEV trump 의 catalog.
- **CIS Docker Benchmark** — Container sub-perspective.
- **OSV (Open Source Vulnerabilities)** — supply-chain dep sub-perspective (cross-handoff to §15.3).

---

## §8 Implementation notes

- **Tools usage discipline**: `Read` + `Grep` + `Bash` (read-only only). 외부 endpoint 호출 0 mandatory — DAST sub-perspective 는 *PoC sketch + reproduction steps* 만 emit, 실제 trigger 는 v0.3+ 격리 CI 환경에서.
- **Idempotency**: 동일 `(target_commit_sha, iteration_N, attacker_id)` 의 재emit 방지 — `outbox/findings/USF-WAI-<sha>-<N>.json` 존재 시 skip + 기존 file 재참조.
- **Emit channel**: `ULTRASAFE_FINDING` intent 는 `collab/outbox.jsonl` append → Constellation §13.13.2 at-least-once relay → main agent inbox + dashboard surface (Ultrasafe.md §13.x Tier 2 발견 카드). **단일 line JSON** mandatory (AGENTS.md §5.4 + `memory/feedback_outbox_json_validation.md` — bash HEREDOC 금지, node `scripts/eg_outbox_push.cjs` 또는 직접 `JSON.stringify` + `appendFileSync` + roundtrip parse 확인).
- **Cycle-end probe** (Constellation §13.16.10 v2.5.2 cycle-end extension): emit 전 cursor-tail probe → meaningful inbound 감지 시 abort + revise (`memory/feedback_pre_send_inbound_check.md`).
- **Advisory marking enforcement**: 본 skill 의 모든 emit 은 `advisory: true` — v0.2.x 의 invariant. v0.3+ promotion 은 spec-level decision (Ultrasafe.md §19 Advisory vs Blocking mode 전환 조건).

---

## §9 Versioning

- **v0.2.0** (2026-06-06): Initial activation — 8-agent fan-out 의 Agent 2 슬롯 채움. advisory mode only.
- **v0.3+ (deferred)**: Blocking mode 전환 — `advisory: false` 가능, publish 차단 가능, DAST sub-perspective 의 격리 CI 환경 실제 trigger 추가, attack_path_graph 의 node/edge graph promotion (현재 flat list 에서).
