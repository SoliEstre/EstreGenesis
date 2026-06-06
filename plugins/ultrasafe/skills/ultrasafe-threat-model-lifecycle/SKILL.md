---
name: ultrasafe-threat-model-lifecycle
description: Pre-release simulated penetration testing from the threat modeling (STRIDE/PASTA) + incident lifecycle + disclosure timing attacker perspective. Invoke as one of 8 attackers in Ultrasafe fan-out runtime when a publish-equivalent action (npm publish / pip upload / git push --tags to public / release-gate trigger) is approaching, OR when orchestrator dispatches ULTRASAFE_RUN_FANOUT with role=threat-model-lifecycle, OR when SECURITY_DISCLOSURE_INTAKE/MPCVD_COORDINATION inbound requires lifecycle-timing review. Emits ULTRASAFE_FINDING via Constellation §13.16 (advisory mode in v0.2.x — report-only, no publish blocking). Output tone is lifecycle-systematic — every finding traces to a named threat-model element (STRIDE letter or PASTA stage) and an incident-lifecycle phase (prepare/detect/contain/eradicate/recover/lessons).
---

# Threat Model / Lifecycle — Ultrasafe Attacker Skill

> **Role**: Pre-release simulated penetration testing from the threat modeling (STRIDE/PASTA) + incident lifecycle + disclosure timing perspective.
> **Tone**: lifecycle-systematic — every claim binds to a named threat element + lifecycle phase + (where applicable) a disclosure-timing milestone.
> **Output**: Findings emitted via `ULTRASAFE_FINDING` A2A intent (Constellation §13.16) — **advisory mode** in v0.2.x (report-only; no publish blocking).
> **Position in fan-out**: 1 of 8 attacker agents. Sibling roles: ai-llm / web-api / supply-chain / crypto / social-eng / methodology-compliance / synthesizer-cross-axis. See `Ultrasafe.md §15` for full topology.

---

## §1 When to invoke

Run this skill when **any** of the following triggers fire:

1. **Fan-out dispatch**: Orchestrator (`plugins/ultrasafe/runtime/orchestrator.cjs`) emits `ULTRASAFE_RUN_FANOUT` with `role ∈ {threat-model-lifecycle, all}`. This is the primary entry path during a release-gate cycle.
2. **PreToolUse hook trigger**: `ultrasafe-trigger.cjs` matches a publish-equivalent command (`npm publish`, `pip upload`, `twine upload`, `git push --tags <public-remote>`, `gh release create`, container registry push to public registry, `gcloud functions deploy --allow-unauthenticated`). The 8-agent fan-out runs; this skill is one branch.
3. **Iteration boundary**: An `ULTRASAFE_ITERATION_BOUNDARY` was just emitted with `clean_signal=false` AND prior iteration's threat-model-lifecycle findings included `severity ∈ {critical, high}`. Re-run for regression check on this axis.
4. **Inbound disclosure**: `SECURITY_DISCLOSURE_INTAKE` arrives with a vulnerability disclosure timeline question (e.g. "is our 90-day public-disclosure clock correctly anchored?"), OR `MPCVD_COORDINATION` arrives needing multi-party timing review.
5. **Manual analyst invocation**: User explicitly requests `/ultrasafe threat-model` or analogous (rare — primary path is automated fan-out).

**Skip** if:

- The artifact is purely a documentation-only change (no code, no config, no infrastructure descriptor) AND the change has no impact on the documented threat model or disclosure policy.
- Clean-signal (≥3 iterations with monotonic finding-reduction + coverage-floor + regression-free + 2-iter-consecutive zero-critical) has already been reached **for this release candidate** AND no new dispatch trigger has fired since.
- An identical artifact_path + content_hash + iteration_count tuple has already produced a finding-set in this release cycle (deterministic memoization — see `Ultrasafe.md §16.3` clean-signal-check tool).

---

## §2 Input

The orchestrator passes (and this skill consumes):

| Field | Type | Required | Description |
|---|---|---|---|
| `artifact_path` | string (abs path) | Yes | The file, directory, or repo root under review. For a release candidate this is typically the package root. |
| `artifact_kind` | enum | Yes | `repo` / `package` / `service` / `infra-descriptor` / `disclosure-doc`. Drives which STRIDE+PASTA lenses apply. |
| `threat_model` | object \| null | No | Existing threat model (if any) — STRIDE element list, PASTA stage outputs, data-flow diagram refs. If null, this skill will reconstruct a working threat model in §3.1. |
| `iteration_count` | integer | Yes | Current iteration number in the ≥3 multi-iteration AND-gate cycle. Findings from prior iterations on this axis are accessible at `runtime/findings/iter-<n-1>/threat-model-lifecycle.jsonl`. |
| `prior_findings_ref` | string \| null | No | Path to prior iterations' findings on this axis for regression-check comparison. |
| `disclosure_context` | object \| null | No | If invoked from `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION`: contains `{report_id, reporter, severity_claim, embargo_until, coordinator_list}`. |
| `release_window` | object \| null | No | `{planned_publish_at, freeze_at, advisory_publish_at}` — needed for disclosure-timing checks. |
| `coverage_floor_state` | object | Yes | Output of prior coverage-floor check — which threat-model surfaces have been reviewed. Enables monotonic-coverage tracking. |

---

## §3 Methodology

This skill executes a **3-pass lifecycle-systematic sweep**. Each pass binds findings to named threat elements and lifecycle phases — no free-floating intuition-only claims.

### 3.1 Pass A — STRIDE per element

For each architectural element (process, data store, data flow, trust boundary) extracted from the artifact, walk all six STRIDE letters and record applicability:

| Letter | Property violated | Concrete probe cases (this skill iterates each) |
|---|---|---|
| **S**poofing | Authentication | Identity-claim surfaces without crypto binding; weak/missing token validation at trust boundaries; impersonation via cookie/session reuse; service-to-service auth that trusts caller-asserted identity. |
| **T**ampering | Integrity | Mutable data crossing a trust boundary without signature/HMAC; client-supplied state that the server uses without revalidation; config files with no integrity check; in-flight artifact mutation (CI cache poisoning, registry mirror MITM). |
| **R**epudiation | Non-repudiation | Critical actions without authenticated audit log; logs that can be redacted by the actor being audited; clock-skew that defeats temporal ordering; missing causality chain (no request-id / trace-id). |
| **I**nformation Disclosure | Confidentiality | Verbose error messages on auth/crypto failure; cache-key leakage; timing side-channel on equality compare; log lines that capture secrets; backup/snapshot exposure; debug endpoint left enabled. |
| **D**enial of Service | Availability | Unbounded recursion / quadratic algorithms reachable from input; resource-allocation without quota; no rate limit on expensive operations; lock contention on hot path; SLO-incompatible retry storm. |
| **E**levation of Privilege | Authorization | Trust-boundary crossings where the inner principal is not re-derived; "forgot to check role" in a new code path; SUID-equivalent surfaces; sandbox escape via reflection / dynamic require; role inheritance bugs. |

For each `(element, letter)` cell that applies, attempt to reach the violation from a realistic attacker position. Record verifiable evidence or mark `[inferred]` / `[assumed]`.

### 3.2 Pass B — PASTA stage walk-through

Apply the 7-stage Process for Attack Simulation and Threat Analysis. Findings here often catch what STRIDE-per-element misses because they bind to **business-level objectives** and **adversary capability**:

| Stage | Question this skill answers | Finding shape |
|---|---|---|
| 1. Business objectives | What does the release protect? (revenue / data / availability / reputation / safety) | Mismatch between stated guarantee and runtime control. |
| 2. Tech scope | Does the SBOM + service inventory match what's actually deployed? | Drift findings — "documented as X, actually runs Y". |
| 3. App decomposition | Are trust boundaries actually enforced where the design shows them? | Boundary-bypass paths. |
| 4. Threat analysis | Which threat actors are credible? (script kiddie / commodity botnet / targeted criminal / nation-state) | Capability-tier mismatch (control assumes lower tier than threat). |
| 5. Vulnerability analysis | Of the credible attacker capabilities, which weaknesses are reachable? | Reachability-confirmed CVE/CWE mapping (not just "lib X has CVE Y"). |
| 6. Attack modeling | Concrete attack trees that chain weaknesses to objective compromise. | Multi-step chain findings (often higher severity than individual links). |
| 7. Risk + impact | Quantified blast radius given the org's actual data + customer set. | Severity-justification anchors. |

### 3.3 Pass C — Incident lifecycle + disclosure timing

Walk the NIST 800-61 / ISO 27035 lifecycle and ask: **if the worst credible finding from Pass A or B materializes**, can this org execute each phase?

| Phase | Probe cases |
|---|---|
| **Prepare** | Is there a documented IR runbook for this product? Are on-call rotations aware of this release's failure modes? Are forensics tools deployed? Are tabletop exercises current (<12 months)? |
| **Detect** | Telemetry coverage for each STRIDE+PASTA finding's exploitation signature. Alert routing. MTTD baseline. |
| **Contain** | Kill-switch / feature-flag / blocklist mechanisms reachable from incident command. Network segmentation. Credential rotation primitives. |
| **Eradicate** | Patch-cut + emergency-release path. Backport-window. Compromised-artifact recall mechanism (yank, signed revocation, advisory). |
| **Recover** | Restore-from-known-good (backups validated, RPO/RTO met). Customer notification automation. SLO impact accounting. |
| **Lessons learned** | Post-incident review template. Greatpractice / Ultrasafe finding feedback loop. Regression test added before close. |
| **Disclosure timing** | 90-day default clock anchored at correct event? Embargo conflicts with concurrent disclosures? MPCVD coordinator list complete? CVE reservation in motion? Advisory draft reviewed? Customer pre-notification window respected? |

**Disclosure-timing sub-checks** (when `disclosure_context` is non-null):

- Does `embargo_until` collide with another known disclosure on the same component (use MPCVD coordinator log)?
- Is the `release_window.advisory_publish_at` synchronized with the fix availability (no advisory-before-fix leak window)?
- For multi-party coordination: every party in `coordinator_list` has acknowledged the timeline (Constellation `MPCVD_COORDINATION` ack trace)?
- Is the reporter's preferred disclosure mode (full-disclosure / coordinated / silent-patch) honored within policy bounds?

### 3.4 Evidence collection discipline

For every finding emitted, evidence is tagged with one of:

- `[verified]` — Attacker reproduction succeeded in a controlled environment, with reproduction_steps captured.
- `[inferred]` — Strong static analysis or threat-model gap is documented, but no live reproduction (e.g. code path is reachable per call-graph but the test harness can't exercise it).
- `[assumed]` — Threat-model-level concern that the artifact's documentation does not contradict but which couldn't be confirmed. Lowest weight in synthesizer aggregation.

Synthesizer (cross-axis) attacker downweights `[assumed]`-only findings unless ≥2 attacker axes converge on the same concern.

---

## §4 Finding output schema

Each finding is emitted as one JSON line to `runtime/findings/iter-<n>/threat-model-lifecycle.jsonl`. The orchestrator wraps the batch into a single `ULTRASAFE_FINDING` A2A message per iteration.

```json
{
  "type": "ULTRASAFE_FINDING",
  "attacker_id": "threat-model-lifecycle",
  "iteration": 2,
  "artifact_path": "c:/Dev/EstreGenesis/EstreGenesis",
  "artifact_content_hash": "sha256:...",
  "advisory_mode": true,
  "findings": [
    {
      "id": "tm-lc-0007",
      "severity": "high",
      "category": "stride-elevation-of-privilege",
      "threat_element": "process:api-gateway -> process:order-service (trust boundary B2)",
      "lifecycle_phase": "prepare|detect|contain|eradicate|recover|lessons|disclosure-timing|not-applicable",
      "pasta_stage": 6,
      "evidence": "[verified] Replayed JWT issued to role=customer reaches admin endpoint /v1/admin/refund because the order-service re-derives principal from header X-User-Role (caller-asserted) instead of validating signature against gateway's public key. Reproduction: see reproduction_steps.",
      "reproduction_steps": "1. Obtain customer JWT via normal login.\n2. POST /v1/admin/refund with header `X-User-Role: admin` and the customer JWT in Authorization.\n3. Observe 200 + refund issued.",
      "blast_radius": "All customers (refund issuance without authorization).",
      "credible_actor_tier": "commodity-criminal",
      "recommended_fix": "Remove X-User-Role trust at order-service ingress. Re-derive principal from JWT signature validation. Add integration test that issues a customer JWT and asserts /v1/admin/* returns 403.",
      "constellation_intent_emitted": "ULTRASAFE_FINDING",
      "confidence": 0.92,
      "regression_check": {
        "appeared_in_iteration": [1, 2],
        "trend": "persistent"
      },
      "cross_axis_correlations": ["web-api:auth-bypass-0003"]
    }
  ],
  "coverage_floor_delta": {
    "stride_cells_visited": 42,
    "stride_cells_total": 54,
    "pasta_stages_completed": [1, 2, 3, 4, 5, 6, 7],
    "lifecycle_phases_probed": ["prepare", "detect", "contain", "eradicate", "recover", "lessons", "disclosure-timing"]
  },
  "iteration_summary": {
    "findings_count_by_severity": {"critical": 0, "high": 1, "medium": 3, "low": 5, "info": 2},
    "delta_from_prior_iteration": {"new": 2, "persistent": 7, "resolved": 4},
    "monotonic_reduction": true
  }
}
```

**Severity rubric** (calibrated against Pass B Stage 7 risk + impact):

- `critical` — Reachable from unauthenticated attacker AND blast radius is cross-customer AND no kill-switch exists.
- `high` — Reachable from low-privilege authenticated actor OR cross-customer blast with contain-mechanism present.
- `medium` — Requires elevated position OR blast radius is single-customer OR mitigations partially effective.
- `low` — Defense-in-depth gap; no direct exploitation path identified this iteration.
- `info` — Threat-model documentation drift, no current security impact.

---

## §5 Examples

### Example 1 — STRIDE Spoofing × Detect-phase gap

**Context**: API service preparing for v3.0 public release. Iteration 2 of fan-out.

**Probe**: At trust boundary "edge → internal", does any element accept caller-asserted identity?

**Finding emitted**:
```json
{
  "id": "tm-lc-0001",
  "severity": "high",
  "category": "stride-spoofing",
  "threat_element": "process:edge-proxy -> process:billing-service",
  "lifecycle_phase": "detect",
  "pasta_stage": 3,
  "evidence": "[verified] billing-service trusts header X-Original-User from edge-proxy without validating that the connection actually originated from edge-proxy (no mTLS, no signed header). Spoofable from any node with network reachability to billing-service. Additionally, no detection alert exists for X-Original-User from non-edge source IPs — incident detect-phase gap compounds the spoofing finding.",
  "reproduction_steps": "1. From an internal-network host (simulated lateral movement), curl billing-service directly with X-Original-User: <victim>. 2. Observe operations executed as victim. 3. Check siem-alert dashboard: no alert.",
  "recommended_fix": "(1) Enforce mTLS or signed-header (HMAC with rotating key) between edge-proxy and billing-service. (2) Add SIEM rule: any X-Original-User-bearing request from source IP outside edge-proxy CIDR → high-severity alert. (3) Tabletop the spoofing scenario in next IR exercise.",
  "credible_actor_tier": "targeted-criminal"
}
```

### Example 2 — PASTA Stage 5 reachability × disclosure-timing collision

**Context**: `SECURITY_DISCLOSURE_INTAKE` inbound. Reporter claims CVE in dependency `libfoo@2.1.4`. Embargo proposed 30 days.

**Probe**: Is libfoo CVE reachable in this codebase? Does the proposed embargo collide with libfoo upstream's planned disclosure window?

**Finding emitted**:
```json
{
  "id": "tm-lc-0002",
  "severity": "medium",
  "category": "pasta-stage5-vulnerability-analysis",
  "threat_element": "dependency:libfoo@2.1.4 (used by service:report-renderer)",
  "lifecycle_phase": "disclosure-timing",
  "pasta_stage": 5,
  "evidence": "[verified] libfoo's vulnerable function `parseUnsafe()` is called from report-renderer's PDF export path (call-graph: report-renderer.exportPDF -> libfoo.parseUnsafe). [inferred] Upstream libfoo maintainer has publicly stated a 14-day disclosure window in their SECURITY.md, conflicting with reporter's 30-day embargo proposal. MPCVD coordination needed.",
  "reproduction_steps": "1. Static call-graph extraction: see attached artifact reproduction_artifacts/tm-lc-0002-callgraph.json. 2. Embargo collision: cross-reference reporter-proposed embargo_until (2026-07-06) with libfoo upstream SECURITY.md disclosure window (T+14 days from upstream patch availability, currently 2026-06-20).",
  "recommended_fix": "(1) Open MPCVD_COORDINATION with libfoo upstream + reporter to align embargo end date. (2) Pin libfoo to fixed version when available; if no fix in 14d, ship internal patch + advisory. (3) Add reachability regression test that asserts parseUnsafe is not invoked from any user-input path.",
  "credible_actor_tier": "commodity-criminal"
}
```

### Example 3 — Lifecycle Recover-phase gap × no detection signature

**Context**: Iteration 3, second-to-last before clean-signal. Most STRIDE-per-element findings closed. Pass C probe.

**Probe**: If the worst credible Pass B finding materializes (mass customer data exfiltration via tm-lc-0007 chain), can the org recover within stated RTO?

**Finding emitted**:
```json
{
  "id": "tm-lc-0003",
  "severity": "high",
  "category": "lifecycle-recover-gap",
  "threat_element": "incident-response-plan -> recover-phase",
  "lifecycle_phase": "recover",
  "pasta_stage": 7,
  "evidence": "[inferred] Stated RTO for customer-facing surface is 4h. However, no documented procedure exists for rotating the API signing key (would be required after a tm-lc-0007 chain compromise) — manual key rotation in this codebase is estimated at 6-12h based on the runbook's referenced step count, and the runbook itself references a deprecated KMS path (kms-v1, replaced by kms-v2 in 2026-Q1). [assumed] No tabletop exercise has rehearsed mass key rotation in the last 12 months.",
  "reproduction_steps": "1. Tabletop dry-run: assume tm-lc-0007 exploited at T0. 2. Time-box each Recover-phase step per runbook v3.2. 3. Sum times; observe > stated RTO.",
  "recommended_fix": "(1) Update IR runbook to kms-v2 key rotation procedure. (2) Add automation: `scripts/rotate-api-signing-key.sh` with verified 4h end-to-end execution. (3) Schedule tabletop exercise for Q3-2026 covering mass key rotation. (4) Update SLO documentation if RTO needs revision.",
  "credible_actor_tier": "targeted-criminal"
}
```

---

## §6 Anti-patterns

What this skill must **not** do:

1. **Anti-pattern: Pure vibe-based "this feels insecure"**
   - Wrong: Emitting a finding "the auth flow looks suspicious" with no STRIDE letter, no PASTA stage, no lifecycle phase, no reproduction.
   - Right: Every finding binds to a named threat-model element + lifecycle phase + evidence tier. If the only basis is intuition, it goes in a `[assumed]`-tier finding with explicit caveat, and synthesizer will downweight it.

2. **Anti-pattern: STRIDE-per-element without trust-boundary anchoring**
   - Wrong: Walking the six letters on a single in-memory function call with no trust boundary crossed.
   - Right: STRIDE is applied at **trust boundaries**. Intra-trust-boundary STRIDE findings are usually category errors (the threat model assumed mutual trust within the boundary; if that's wrong, the finding is "trust boundary mis-drawn", not "tampering in function X").

3. **Anti-pattern: Disclosure-timing recommendations without MPCVD coordination**
   - Wrong: Recommending "extend embargo to 60 days" without checking that all other affected parties (upstream, downstream consumers, other reporters of the same class) are coordinated.
   - Right: Disclosure-timing changes require `MPCVD_COORDINATION` A2A round-trip with every coordinator in `disclosure_context.coordinator_list` before recommendation is finalized.

4. **Anti-pattern: Severity inflation under time pressure**
   - Wrong: Marking a finding `critical` because the release is imminent and a critical finding might block it. (In v0.2.x advisory mode it would not block anyway — but the precedent corrupts the rubric.)
   - Right: Severity rubric in §4 is mechanical. If unreachable from unauthenticated, it cannot be `critical` regardless of cycle pressure. Cycle pressure is `methodology-compliance` attacker's concern, not this skill's.

5. **Anti-pattern: Ignoring prior-iteration findings**
   - Wrong: Re-discovering the same finding in iteration N+1 without referencing iteration N's entry, breaking the regression-check + monotonic-reduction signals.
   - Right: Read `prior_findings_ref` first. Every persistent finding gets `regression_check.appeared_in_iteration: [n-1, n]` and `trend: "persistent"` (or `worsened` if severity increased, `improving` if scope narrowed).

6. **Anti-pattern: Free-form lifecycle commentary**
   - Wrong: A finding that says "incident response could be better" with no specific phase, no probe case, no missing artifact.
   - Right: Lifecycle findings name a **specific phase** + a **specific missing/broken artifact** (runbook step, alert rule, tabletop exercise, backup test). If nothing specific is missing, no finding.

7. **Anti-pattern: Cross-axis stealing**
   - Wrong: Emitting an SQL-injection finding (web-api attacker's domain) under this skill's `findings[]` array.
   - Right: Stay in lane. If a probe surfaces something that belongs to web-api / crypto / supply-chain etc., emit a low-severity `info` finding noting "cross-axis observation — referred to <attacker_id>" and let synthesizer correlate. Don't double-count.

---

## §7 Cross-references

- `Ultrasafe.md §14` — Runtime architecture overview (where this skill fits in the 5-surface topology).
- `Ultrasafe.md §15` — 8-agent fan-out runtime detail (sibling attacker roles + dispatch sequence).
- `Ultrasafe.md §16.1` — `ultrasafe_run_fanout` MCP tool (dispatch entry point for this skill).
- `Ultrasafe.md §16.2` — `ultrasafe_finding_aggregate` MCP tool (where this skill's findings get cross-axis dedup + severity ranking).
- `Ultrasafe.md §16.3` — `ultrasafe_clean_signal_check` MCP tool (4-condition AND-gate that consumes this skill's coverage + monotonic-reduction signals).
- `Ultrasafe.md §17` — Hooks spec (`ultrasafe-trigger.cjs` PreToolUse + `ultrasafe-clean-signal.cjs` Stop) — the upstream trigger paths.
- `Ultrasafe.md §18` — Constellation 통합: `ULTRASAFE_FINDING` / `ULTRASAFE_ITERATION_BOUNDARY` / `ULTRASAFE_RELEASE_GATE` / `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION` intent payload schemas.
- `Ultrasafe.md §19` — Advisory vs blocking mode (v0.2.x advisory = report-only; v0.3+ blocking transition conditions).
- `Constellation.md §13.16` — A2A intent registry (the 5 new Ultrasafe intents).
- `Constellation.md §13.18` — Self-execution rule (this skill never asks the user; emits finding and continues).
- `Hyperbrief.md §1` — 9-section IR (used by synthesizer for layer-2 of the 3-layer report; this skill's findings populate Section 5 "현황 + 진단").
- `Greatpractice.md` — Tree candidate emission (synthesizer collects this skill's persistent-resolved findings as Greatpractice macro/mezzo/micro candidates).
- `Superscalar.md §1-§5` — Fan-out dispatch primitives (orchestrator uses Superscalar for parallel attacker invocation).
- External: NIST SP 800-61 Rev 2 (incident response lifecycle), ISO/IEC 27035 (information security incident management), OWASP Threat Modeling, Microsoft STRIDE, VerSprite PASTA, CERT/CC MPCVD guidance, FIRST CVSS v4.0 (severity calibration cross-check).

