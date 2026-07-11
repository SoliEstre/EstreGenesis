<!-- module: Ultrasafe; layer: pre-release-security-verification; part-of: EstreGenesis 2.5.x; version: v0.2.4; date: 2026-07-12; status: runtime activation cut v0.2.x — v0.2.4 hook state-anchor fix (both hooks anchor `.ultrasafe/` to a stable root — `CLAUDE_PROJECT_DIR` / `ULTRASAFE_REPO_ROOT` / cwd-walk — instead of the tool call's cwd, which split one session's evidence across a nested repo's second state file and undercounted it on read; measured on the EG self-dogfood 2026-07-11) (advisory mode runtime — 8 attacker skills + 2 hooks PreToolUse/Stop + MCP server 5 tools over stdio JSON-RPC + Constellation §13.16 5 intents integrated ULTRASAFE_FINDING/ULTRASAFE_ITERATION_BOUNDARY/ULTRASAFE_RELEASE_GATE/SECURITY_DISCLOSURE_INTAKE/MPCVD_COORDINATION + Workflow fan-out applied evidence; v0.1.0 design draft body preserved; blocking mode v0.3+ follow-on — transitions upon clean-signal-gate 4-condition AND-gate reached + user gate + ≥3 iteration consecutive clean); depends-on: none (optional synergy: Constellation §13 A2A — 5 new intents wire-integrated; Superscalar §3 fan-out — direct host; Hyperbrief §1 escalation routing — auto-mapping; Greatpractice §5 tree promotion — bidirectional feed); license: Apache-2.0 -->

# Ultrasafe — Pre-Release Multi-Perspective Simulated Penetration Testing with ≥3 Iteration Clean-Signal Gate (v0.2.1 runtime activation — advisory mode)

> **EstreGenesis optional module — v0.2.0 runtime activation cut (advisory mode).** If v0.1.0's *minimum-viable spec scaffold* was the *design document* of a 17-axis cross-domain synthesis backing + 8-agent fan-out + ≥3 iteration multi-condition AND-gate + 3-layer synthesis report, then v0.2.0 is the cut that brings that design into **runtime activation** — 8 attacker SKILL directories + 2 hooks (PreToolUse `ultrasafe-trigger.cjs` + Stop `ultrasafe-clean-signal.cjs`) + MCP server (5 tools over stdio JSON-RPC) + Constellation §13.16 5 new A2A intents integration + Workflow fan-out applied evidence. **Every finding emit / hook trigger / MCP tool return in this cut is *advisory-only* — no actual publish blocking.** Blocking mode (v0.3+) is a follow-on — it transitions after the 3-AND condition of clean-signal-gate 4-condition AND-gate reached + user gate passed + ≥3 iteration consecutive clean.
>
> **The 5 new surfaces of v0.2.0 runtime (the ship units of this cut)**:
> 1. **8 attacker SKILL.md** (`plugins/ultrasafe/skills/ultrasafe-{ai-llm-redteam,web-api-attacker,supply-chain-auditor,crypto-reviewer,social-engineer,methodology-compliance,threat-model-lifecycle,synthesizer}/SKILL.md`) — each attacker's input/output/tools/when-to-fire/severity rubric specified.
> 2. **PreToolUse hook `ultrasafe-trigger.cjs`** — triggers just before a publish-equivalent command (npm publish / pip upload / git push --tags to public); advisory mode = report-only emit, blocking mode (v0.3+) is a user gate.
> 3. **Stop hook `ultrasafe-clean-signal.cjs`** — cycle-end clean-signal check, verifies whether the clean-signal of ≥3 iterations has been reached.
> 4. **MCP server `mcp/server.cjs`** — 5 tools over stdio JSON-RPC: `ultrasafe_run_fanout` / `ultrasafe_finding_aggregate` / `ultrasafe_clean_signal_check` / `ultrasafe_report_generate` / `ultrasafe_release_gate`.
> 5. **Constellation §13.16 5 new intents integration** — `ULTRASAFE_FINDING` / `ULTRASAFE_ITERATION_BOUNDARY` / `ULTRASAFE_RELEASE_GATE` / `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION` (for detail, see §8.1 + §15 integration specification).
>
> **v0.1.0 body preserved**. v0.1.0's §1-§13 + Appendices A/B/C are *all preserved*. The body expansion of v0.2.0 adds only the 6 new §§ — §14 (Runtime Architecture), §15 (8-Agent Fan-Out Runtime Detail), §16 (MCP Server Tools), §17 (2 Hooks Spec), §18 (Constellation integration 5 intents — runtime wire spec), §19 (Advisory vs Blocking Mode) — plus the Revision History at the end. The *forward references* in the existing §1-§13 body (e.g., §8's 5 intents → §18's wire spec, §10's PreToolUse hook → §17's hook spec, §13.5's advisory-only → §19's mode transition) *backward resolve* in v0.2.0.
>
> # Ultrasafe — Pre-Release Multi-Perspective Simulated Penetration Testing with ≥3 Iteration Clean-Signal Gate (design draft v0.1.0, body preserved in v0.2.0)

> **EstreGenesis optional module — design draft v0.1.0 (body preserved as v0.2.0 backing).** If Constellation addresses *agent-to-agent communication*, Superscalar addresses *dispatch within an agent*, Hyperbrief addresses *decision delegation to the user*, and Greatpractice addresses *deterministic prevention of repeated omissions*, then Ultrasafe addresses the fifth axis — **a pre-release security attestation system that permits release only after passing a ≥3 iteration multi-condition AND clean-signal of an attacker-perspective parallel fan-out + synthesis + reinforcement cycle, just before / at the moment of / right after release**. An 8-agent minimum fan-out (AI/LLM · Web/API · Supply · Crypto · Social · Method/Comp · TM/Lifecycle · Synthesizer) + GTA/DSP cross-cutting + 3-layer synthesis report (OSCAL machine schema + Hyperbrief 9-section IR + Greatpractice tree candidate) + dual pre-release trigger (PreToolUse hook + /ultrasafe skill) + 5 new Constellation A2A intents. Backed by 17-axis cross-domain deep research (harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution).
>
> **Cost-honest framing.** Ultrasafe is not free. Per release it incurs the token cost of parallel invocation of 17 (full) or 8 (minimum) attack agents + the wall-clock cost of the ≥3 iteration loop (roughly patch=15 min / minor=30 min / major=60 min+) + the cognitive burden of handling false positives + the hallucination risk of LLM-only findings + the speed loss of automatic decisions, since this module itself forces Hyperbrief decision delegation. What you get by trading away this cost is — *a deterministic guarantee of zero-known-critical-finding at release time* (not a vulnerability that was simply never found, but an attested clean state after all 17 axes have simulated an attack), *verification that no layer is preemptively missing at every inflection point of supply chain + AI adversarial + human social engineering + multi-agent trust erosion*, *full-cycle automation of finding → decision → codify through natural integration with the three modules (Constellation + Hyperbrief + Greatpractice)*.
>
> **Advisory-only v0.1.x → blocking v0.2.x.** v0.1.x ships in *advisory-only* mode — every finding is a stderr alert only, no actual release blocking. From v0.2.x onward it transitions to *blocking* mode (forced from Tier 3 release, with Tier 1/2 as user opt-in). This transition is the explicit result of the critic Tier A patch (resolving the strict-mode direct contradiction). v0.1.x is the stage for collecting the false positive baseline + accumulating dogfood evidence. *(v0.2.0 codicil: this paragraph is the preservation of the plan as of v0.1.0 — in reality v0.2.x also shipped as an advisory runtime, and the blocking transition was rescheduled to v0.3+. The current transition conditions are in §19.)*
>
> _Terminology note_: "attack agent" (the simulated attacker of each fan-out unit), "finding" (a single security observation an attack agent produces), "this iteration" (the current iteration), and "Ultrasafe" (the module name, capitalized in prose · lowercase in paths) are used consistently throughout this document.

---

## Table of Contents

- [§1. Concept — what Ultrasafe is](#1-concept--what-ultrasafe-is)
- [§2. Module Shape — 8-agent v0.1.0 minimum fan-out](#2-module-shape--8-agent-v010-minimum-fan-out)
- [§3. Fan-out Matrix — taxonomy × methodology × actor-profile orthogonality](#3-fan-out-matrix--taxonomy--methodology--actor-profile-orthogonality)
- [§4. Finding Output Contract — attack agent finding schema](#4-finding-output-contract--attack-agent-finding-schema)
- [§5. Synthesis Report 3-Layer — OSCAL + Hyperbrief IR + Greatpractice candidate](#5-synthesis-report-3-layer)
- [§6. ≥3 Iteration Loop — multi-condition AND clean signal](#6-3-iteration-loop)
- [§7. Hyperbrief 4-score Routing](#7-hyperbrief-4-score-routing)
- [§8. Constellation A2A — 5 new intents](#8-constellation-a2a--5-new-intents)
- [§9. Greatpractice Tree integration](#9-greatpractice-tree-integration)
- [§10. Pre-release Trigger + Tier](#10-pre-release-trigger--tier)
- [§11. Self-Spec-Gaming Hazard](#11-self-spec-gaming-hazard)
- [§12. Untested Surfaces + Known Gaps](#12-untested-surfaces--known-gaps)
- [§13. Adoption Thresholds](#13-adoption-thresholds)
- [§14. Runtime Architecture (v0.2.0)](#14-runtime-architecture-v020)
- [§15. 8-Agent Fan-Out Runtime Detail (v0.2.0)](#15-8-agent-fan-out-runtime-detail-v020)
- [§16. MCP Server Tools (v0.2.0)](#16-mcp-server-tools-v020)
- [§17. Hooks Spec — PreToolUse + Stop (v0.2.0)](#17-hooks-spec--pretooluse--stop-v020)
- [§18. Constellation integration — 5 new intents runtime wire (v0.2.0)](#18-constellation-integration--5-new-intents-runtime-wire-v020)
- [§19. Advisory vs Blocking Mode — v0.2.x advisory + v0.3+ blocking transition conditions (v0.2.0)](#19-advisory-vs-blocking-mode--v02x-advisory--v03-blocking-transition-conditions-v020)
- [Appendix A. Cross-Axis Convergence Cluster Catalog](#appendix-a-cross-axis-convergence-cluster-catalog)
- [Appendix B. 4 Strong Isomorphisms + Normative Justification](#appendix-b-4-strong-isomorphisms--normative-justification)
- [Appendix C. Self-Application — this spec's own entry](#appendix-c-self-application--this-specs-own-entry)
- [Revision History](#revision-history)

---


## §1. Concept — what Ultrasafe is

> If Constellation addresses *agent-to-agent communication*, Superscalar addresses *dispatch within an agent*, Hyperbrief addresses *decision delegation to the user*, and Greatpractice addresses *deterministic prevention of repeated omissions*, then Ultrasafe addresses the fifth axis — **a pre-release security attestation system that, just before / at the moment of / right after release, synthesizes the multi-layer attack surface via attacker-perspective parallel fan-out and permits release only after passing the 4-condition AND clean-signal gate of a ≥3 iteration loop**. Backed by 17-axis cross-domain deep research (harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution).

Ultrasafe is neither a *document format* nor a *checklist*. It is the *operational mechanism* of **attacker-perspective parallel fan-out → synthesis → reinforcement cycle repeated ≥3 times → release permission upon meeting the termination condition**. The output of each cycle is a 3-layer hybrid of OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree promotion candidate (see §4 finding contract + §5 synthesis format), the termination of each cycle is a 4-condition AND gate (see §6 clean signal gate), and each release is accompanied by a grade certificate stamped with an external standard anchor (see §13.4 release attestation).

### §1.1 Blocking 4 common misreadings

| Misreading | What it actually is |
|---|---|
| (a) "Just another SAST / DAST automation tool" | Ultrasafe = LLM-agent fan-out (§2 § 3) + retire-barrier synthesis (§5) + ≥3 iteration loop (§6) + 4-module synthesis (§7-§9). Traditional SAST / DAST results are merely *input* to the Web/API axis — Ultrasafe itself is the operational mechanism of a cross-axis synthesizer. |
| (b) "A single security checklist / catalog" | An Ultrasafe entry always specifies the catalog version + coverage % + untested_classes [] at the *iteration boundary*. Use of the word "secure" is prohibited — only the qualified expression *passed coverage X% under catalog v_Y as of date Z* (see §6.3 coverage definition + §13.4 attestation qualified expression; aligns with `compliance-standards §5 + adversarial-ml §1.6`). |
| (c) "1 audit + clean release" | clean signal = 4-condition AND gate × consecutive 2 iterations. A single iteration pass is an anti-pattern (see §6.5 anti-pattern; aligns with `pentest-methodology §4.2 + fuzzing-pbt §4.1`). hard floor = 3 (universal) — the basis is the 3-floor of *iter 1 fix apply + iter 2 verify of fix + iter 3 verify of regression-of-fix*. |
| (d) "A replacement for the security section of AGENTS.md / .agent/rules.md" | Ultrasafe is a *release-gated mechanism*, while AGENTS.md is *always-on context*. Only after Ultrasafe output is promoted into a macro/mezzo/micro node of the Greatpractice tree does it flow into an always-on enforcement channel (PreToolUse hook, etc.) (see §9 Greatpractice integration). |

### §1.2 5-stage operational pipeline

Ultrasafe is not a single invocation but a 5-stage operational pipeline of **fan-out → synthesize → iterate → gate → attest**. Each stage is specified in full in a separate §; this section covers only the high-level shape.

1. **Pre-release trigger** (§10) — a dual entry of the PreToolUse hook for `git push --tags` / `gh release create` + explicit `/ultrasafe` skill invocation. Automatic *Tier determination* (patch / minor / major) differentiates fan-out intensity — preventing token budget blow-up. Tier 1 ~zero cost, Tier 2 ~$15 / release, Tier 3 ~$50+ / release.

2. **Fan-out** (§2 + §3) — an instance of Superscalar read fan-out. The v0.1.0 default carving = a **(OWASP LLM Top 10 × NIST 800-115 / OSSTMM / OWASP / PTES) 2D matrix**, with 8 attacker agents in parallel (AI/LLM + Web/API + Supply chain + Cryptography + Social engineering + Methodology/Compliance + Threat model/Lifecycle + Synthesizer). GTA + DSP are the cross-cutting layer (ROI calibration + policy enforcement after all agent output). diversity-enforced source independence — *(perspective × prompt_template_hash × seed) 3-tuple distinct ≥ 3* enforced (`multi-agent-distributed §1.2 + cognitive-decision-bias §2`; single-provider correlated hallucination is a known limitation, specified in §12.2 untested_surfaces).

3. **Synthesize at retire-barrier** (§5) — the findings of many attacker agents are *cross-correlated + deduplicated + confidence-evaluated* at the retire-barrier. matrix first (graph is a v0.2 cut), cross-axis confirmation ≥ 2 distinct perspective buckets. The synthesis report = a 3-layer hybrid of OSCAL Assessment Result (machine-readable) + Hyperbrief 9-section IR (decision-routing-ready) + Greatpractice tree entry candidate (codification-ready).

4. **Iterate ≥3 with multi-condition AND termination** (§6) — Universal hard floor = 3. clean signal 4-condition AND:
   - **regression-free** (sealed verification of prior iteration findings AND 0 new high-severity) — specified by §6.4 regression baseline's 3-component AND (sealed verification + prior_findings retest pass + secondary surface absence)
   - **monotonic improvement** (not a simple finding-count monotonicity metric but a K-iteration window trend; avoiding `fuzzing-pbt §4.1`'s coverage ≠ bug-finding trap)
   - **coverage / catalog gate** — §6.3 coverage definition = (covered_catalog_entries ∩ applicable_subset) / applicable_subset, with mandatory specification of the denominator and untested_classes [] + external standard anchor mandatory (`compliance-standards §1.6`)
   - **consecutive 2 iteration cleanliness** — conditions 1-3 above satisfied for 2 consecutive iterations.
   Upon reaching max_iter (default 7), automatic Hyperbrief 4-way escalation (apply / defer / release_with_risk / escalate) (see §7 Hyperbrief integration). During iteration N, *frozen membership / state* (registry hash + target_commit_sha + catalog_version) is stamped — changes occur only at the iteration boundary (`multi-agent-distributed §1.5`).

5. **Gate + attest** (§7 + §13.4) — automatic routing by Hyperbrief 4-score (severity × scope × reversibility × external_impact) or auto-block of a deterministic signal (§7.3 strict-mode reconciliation: explicit separation of v0.1.0-v0.1.x advisory mode + v0.2.x blocking mode; aligns with `protocol-trust-evolution §1.8 + devsecops-policy-as-code §1.1`). Upon reaching clean signal + passing the Hyperbrief gate, a grade certificate is emitted — stamped with the external standard anchor + catalog_version + coverage_pct + untested_classes, cosign signature + Rekor inclusion proof (Tier 3 mandatory). The attestation's expression is qualified to *"passed coverage X% under catalog v_Y"* — the word *secure* is permanently prohibited.

### §1.3 Three backbones — fan-out + synthesis + iteration

The 3 backbones of this module are the thickest convergence clusters of the 17-axis synthesis — reached with 16/17, 15/17, 14/17 cross-axis confirmation respectively.

**Backbone B1 — Parallel attacker-perspective fan-out (16 / 17 axis convergence)**

Ultrasafe's attack stage is not a single thread but an *independent attacker agent fan-out of multiple perspectives*. Each perspective specializes in one or more of (taxonomy, methodology, actor-profile, layer, lifecycle, principle, persona), with results synthesized at the retire-barrier. Of the 17-axis cross-domain deep research, 16 axes (pentest-methodology · ai-red-team · web-api-infra · threat-modeling · multi-agent-distributed · adversarial-ml · supply-chain-sbom · devsecops-policy-as-code · incident-response-disclosure · cryptography-key-mgmt · human-factors-se-opsec · game-theory-asymmetry · compliance-standards · cognitive-decision-bias · security-visualization-dashboard · protocol-trust-evolution) converge on the same underlying pattern — only fuzzing-pbt has a different carving centered on corpus evolution (`cross-axis convergence cluster C1`).

The dimensionality of the division axes differs per axis, but a *product of 2-3 orthogonal axes* (e.g., layer × lifecycle, taxonomy × methodology, principle × technique) is dominant. v0.1.0's matrix carving starts as a *2D minimum* (OWASP × methodology, §3) and then progressively expands to *3D* (+ actor-profile) (§3.3 actor-profile opt-in).

**Backbone B2 — Cross-axis retire-barrier synthesis (15 / 17 axis convergence)**

The synthesis stage that *cross-correlates + deduplicates + confidence-evaluates* the findings emitted by many attacker agents at the retire-barrier is essential. Flattening into a single finding list is prohibited — a *graph / matrix / quorum* structure is dominant (`web-api-infra §1.3 + threat-modeling §1.4 + security-visualization-dashboard §1.1 + multi-agent-distributed §1.1`).

v0.1.0 is *matrix first* (cross-axis agreement is strongest), graph is a v0.2 cut, and the concrete numbers of BFT quorum (f=1 ~ f=3) are specified in the §5.3 quorum_evidence field. cross-axis confirmation ≥ 2 distinct perspective buckets is a v0.1.0 hard rule. Cause analysis is *N ≥ 2 contributing factors mandatory* — a forced search for a single root cause is an anti-pattern (`incident-response-disclosure §1.11 + cognitive-decision-bias §1.1`).

**Backbone B3 — ≥3 iteration multi-condition AND termination (14 / 17 axis convergence)**

The termination condition is not a *single metric* but a *multi-condition AND gate* — finding count alone is false confidence (`fuzzing-pbt §4.1`). The conjunction of regression-free + monotonic improvement + statistical power + cross-axis confirmation. 14 axes (supply-chain · fuzzing · pentest · web-api · crypto · adversarial-ml · human-factors · game-theory · multi-agent · IR · devsecops · protocol-trust · compliance · cognitive) converge on the same carving (`cross-axis convergence cluster C3`).

The 4 universal predicate items = (a) **regression-free** — measurement mechanism stamped by §6.4 regression baseline 3-component AND (sealed_verification_pass + prior_findings_retest_pass + no_secondary_surface_high_severity), (b) **monotonic improvement** — the 3 sub-condition AND of the K-iteration window trend (K=3 default) (new high-severity rate trend descending + unresolved persistent count decreasing + cross-axis confirmation density increasing), (c) **iteration floor ≥ 3** — the basis being the 3-floor of *fix apply + verify of fix + verify of regression-of-fix* (`devsecops-policy-as-code §1.4 + pentest-methodology §2.4`), (d) **coverage / catalog gate** — §6.3's (covered ∩ applicable) / applicable definition + per-Tier threshold (Tier 1: 50%, Tier 2: 75%, Tier 3: 90%) + untested_classes [] mandatory specification.

### §1.4 What Ultrasafe *does not* do — v0.1.0 advisory-only boundary

This module's *scope of application* is explicitly negative-bounded to avoid the most common over-promise of spec drafting.

- **Deciding automatic fix apply ≠ Ultrasafe's role.** Ultrasafe goes only as far as finding emit + Hyperbrief routing + Greatpractice promotion candidate. The decision of *which fix to apply* is the human gate of the Hyperbrief 4-score gate (or the 6-condition AND automatic fix path of a deterministic signal — see §7.2). Auto-deferral is absolutely prohibited (`protocol-trust-evolution §1.8` strict-mode default).

- **Performing active scanning of external actors ≠ Ultrasafe's role.** attacker agents are *self-repository scoped* — only the EG inner repo + outer workspace. External endpoint calls / actual internet probes / penetration test execution are prohibited (avoiding sandbox escape + legal liability). External endpoints are *simulated* only (`pentest-methodology §4.2 anti-pattern 7`).

- **Guaranteeing perfect coverage of a single catalog ≠ Ultrasafe's promise.** Every attestation is the qualified expression *passed coverage X% under catalog v_Y as of date Z*. Attacks outside catalog v_Y are disclosed via an explicit untested_classes []. The word *"secure"* is permanently prohibited (`adversarial-ml §1.6 + compliance-standards §1.6`).

- **Complete elimination of the self-spec-gaming hazard ≠ Ultrasafe's assurance.** Ultrasafe itself is an attack target — clean rate / pass rate may be the spec-gaming reward of the attacker agents (Krakovna 2020's 60+ examples). v0.1.0's defense = 4 mandatory items (minimum diversity + audit trail + external anchor + untested_surfaces []), with *meta-iteration* (Ultrasafe self-test) added in v0.2 (see §11 self-spec-gaming hazard prevention; `adversarial-ml §1.6 + game-theory-asymmetry §1.7 + incident-response-disclosure §1.9`). The mandatory specification of untested_surfaces [] — honest disclosure of known known untested surfaces.

- **Known untested surfaces (v0.1.0):**
  - Compromise / DoS / membership manipulation of the Constellation broker / WS server itself — *out-of-scope declare* + Greatpractice macro node ("broker compromise = entire system invalid"; see §8 broker surface — `incident-response-disclosure §1.6 + multi-agent-distributed §1.6`).
  - Side-channel / micro-arch attack (Spectre, EM, power) — v0.2.x
  - Privacy-by-design LINDDUN deep-dive — only Tier 3 auto-activation in v0.1.0 (`compliance-standards §1.5`)
  - Legal / regulatory beyond compliance (export control, sanctions, dual-use AI) — v0.2.x
  - Single-provider correlated hallucination — mitigated after the v0.2.x introduction of an external LLM A2A counterpart
  - Schema evolution backward-compat — when adding to the v0.1.0 → v0.2.x finding schema, *additive evolution only* + `schema_version` field mandatory + N=2 minor deprecation window (see §12.4 schema evolution).

- **v0.1.0 advisory mode default.** During v0.1.0-v0.1.x it is *advisory mode* (no blocking, surface only) — false positive measurement + tuning. Upon entering v0.2.x it transitions to *blocking mode* (hard-mandatory) — the transition decision itself requires passing the Hyperbrief 4-score gate (Score ≥ 4 + operating period ≥ N month + FP rate < threshold; see §7.3 + §13.5 strict-mode reconciliation; orthogonal application of `devsecops-policy-as-code §1.1 graduated enforcement ladder + protocol-trust-evolution §1.8 strict-mode default`).

This negative-bound section is v0.1.0's *honest framing* — to stamp, at spec drafting time, the separation between the *actually reachable scope* and the *explicitly deferred surfaces* in the dogfood evidence cycle of operational observations. The maturation roadmap after v0.2 is separately specified in §13.6 + the phased cuts of Appendix C.

---

## §2. Module Shape — 8-agent v0.1.0 minimum fan-out

> Ultrasafe's module shape is a Superscalar workflow instance of *independent attacker agent fan-out of multiple perspectives* + *single retire-barrier synthesis* (borrowing Superscalar §1-§5's read fan-out + retire-barrier + post-barrier mutation as-is). This section defines the v0.1.0 minimum operating unit's **8-agent fan-out roster** + **GTA/DSP cross-cutting layer** + **diversity invariant** + **self-spec-gaming hazard avoidance** + **v0.2-v0.4 17-axis expansion roadmap**. As a result of the 17-axis cross-axis analysis, the division axis of the fan-out (`synthesis/cross-axis-patterns.md` Cluster C1 = 16/17 axis convergence) has a *taxonomy × methodology 2D matrix* as the default carving — single-axis forcing prohibited, 2D minimum.

### §2.1 8-agent fan-out roster (v0.1.0 minimum viable)

v0.1.0's minimum viable cut is a single retire-barrier structure of **7 attack agents + 1 synthesizer agent** = 8 agents total. Each attack agent handles *1-2 axes* (primary carving + secondary axis), and the synthesizer at the retire-barrier plays the fan-out sink role (MAD §2 BFT quorum + diversity + accountable history + FPB/CDB/SVD/IRD integration).

| # | Agent role | Primary axis | Secondary axis | catalog anchor | Output contract's perspective field |
|---|---|---|---|---|---|
| 1 | **AI/LLM attacker** | ai-red-team (ART) | adversarial-ml (AML) | OWASP LLM Top 10 v2025.11 + EU AI Act Art. 15(5) 5-family + lethal trifecta | `{primary: "ai-red-team", secondary: ["adversarial-ml"]}` |
| 2 | **Web/API/infra attacker** | web-api-infra (WAI) | — | OWASP × MITRE ATT&CK Enterprise v15 dual taxonomy | `{primary: "web-api-infra"}` |
| 3 | **Supply chain attacker** | supply-chain-sbom (SCS) | — | SCS 5-way (build / maintainer / typo / transitive / reproducibility) + SLSA L3 + Sigstore | `{primary: "supply-chain-sbom"}` |
| 4 | **Cryptography attacker** | cryptography-key-mgmt (CKM) | — | C1-C15 15-pattern catalog + TLS 1.3 / Ed25519 / ECDSA-P256 strict profile | `{primary: "cryptography-key-mgmt"}` |
| 5 | **Social engineering attacker** | human-factors-se-opsec (HFS) | — | Cialdini 6 × Hadnagy 9 × FBI 8-elicitation orthogonal fan-out | `{primary: "human-factors-se-opsec"}` |
| 6 | **Method/Compliance attacker** | pentest-methodology (PM) | compliance-standards (CMP) | NIST 800-115 × OSSTMM × OWASP Testing Guide × PTES × ISO 27001:2022 theme matrix | `{primary: "pentest-methodology", secondary: ["compliance-standards"]}` |
| 7 | **Threat model / Lifecycle attacker** | threat-modeling (TM) | protocol-trust-evolution (PTE) | STRIDE × LINDDUN × UKC + 5-layer × 3-lifecycle matrix | `{primary: "threat-modeling", secondary: ["protocol-trust-evolution"]}` |
| 8 | **Synthesizer** (fan-out sink) | multi-agent-distributed (MAD) | fuzzing-pbt (FPB) + cognitive-decision-bias (CDB) + security-visualization-dashboard (SVD) + incident-response-disclosure (IRD) | BFT quorum 2f+1 + ACH matrix + CIM normalization + PICERL gating | `{primary: "synthesizer", aggregates_from: [1..7]}` |

#### §2.1.1 Agent 1 — AI/LLM attacker (ART + AML combined)

- **Responsibility**: direct/indirect prompt injection of the LLM-integrated surface (Greshake-Abdelnabi 2023), system prompt leakage (OWASP LLM07:2025), vector/embedding attack (OWASP LLM08:2025), agentic misalignment (Anthropic 2025 arXiv:2510.05179), alignment-faking probe (Anthropic 2024), FGSM/PGD/C&W 3-tuple (Goodfellow 2015 + Madry 2018 + Carlini-Wagner 2017), Article 15(5) 5-family (data poisoning, model poisoning, adversarial examples, confidentiality, model flaws).
- **Output contract** (Cluster C9 alignment — strict JSON schema + (file, lines, poc_sketch) anchor mandatory): for detail see §3.3 (Finding output contract).
- **Minimum diversity**: attempt all of FGSM + PGD + C&W + black-box 4-family (AML §3.6 self-spec-gaming avoidance — minimum attack diversity enforced, blocking single-family early termination).
- **Termination signal contribution**: PGD-AT pass + OOD goal-misgeneralization probe (Langosco 2022) + the 3 axes of agentic misalignment probe negative.

#### §2.1.2 Agent 2 — Web/API/infra attacker (WAI standalone)

- **Responsibility**: cross-cutting the 8 sub-perspectives (SAST / DAST / API / container / IaC / SSRF / supply-chain dependency / call-graph) of the OWASP × MITRE ATT&CK dual taxonomy. The priority matrix of CVSS v4 + EPSS + KEV trump (`web-api-infra §1.3 + incident-response-disclosure §1.2`).
- **Output contract**: anchor.file + anchor.lines + anchor.poc_sketch + anchor.evidence_artifact_ref. attack path graph candidate emit (v0.1.0 is a *flat list*, promoted to a node/edge graph in v0.2.x — `web-api-infra §2 attack path graph` Phase 2 cut).
- **Blocking-decision routing** (`web-api-infra §6 + cross-axis Cluster C4`): an automatic PR candidate is emitted only upon passing the **6-condition AND gate** of confidence=high + fix path=single + regression risk=low + reversibility=full + blast-radius < module + external-impact ≤ Tier 2. If any one is unmet → Hyperbrief 4-score gate routing.

#### §2.1.3 Agent 3 — Supply chain attacker (SCS standalone)

- **Responsibility**: SCS 5-way attack vector (build / maintainer / typo / transitive / reproducibility) + PURL join key-based dedup + SLSA L3 path verification + Sigstore cosign + Rekor inclusion proof alignment + maintainer history anomaly.
- **Output contract**: PURL canonical id + attestation chain (certificate + Rekor proof + timestamp) + maintainer_anomaly_flag.
- **Auto-block prohibited** (`cross-axis Contradiction CT1` synthesis): a maintainer anomaly does *not auto-block* — always a human review lane (a separate lane on the live board, `supply-chain-sbom §7 + Constellation §13.x`). Auto-block is limited to *deterministic signals* (cosign signature mismatch / SLSA provenance absence / OSV CVE match).

#### §2.1.4 Agent 4 — Cryptography attacker (CKM standalone)

- **Responsibility**: C1-C15 15-pattern catalog (key generation / storage / rotation / agility / constant-time / PQC readiness, etc.) × 3-sub-agent distribution. TLS 1.3 / Ed25519 / ECDSA-P256 strict minimum profile (PTE §8 strict-mode default + `cryptography-key-mgmt §7`).
- **Output contract**: pattern_id (C1-C15) + agility_envelope_status + pqc_readiness_metric + constant_time_binary_evidence.
- **Permanent-manual category** (`cross-axis Contradiction CT6` synthesis): binary constant-time finding + cryptographic key rotation + external endpoint change are *permanently auto-apply prohibited* — forced Hyperbrief escalate regardless of score (CKM §5).

#### §2.1.5 Agent 5 — Social engineering attacker (HFS standalone)

- **Responsibility**: Cialdini 6 (Reciprocity / Commitment / Social Proof / Authority / Liking / Scarcity) × Hadnagy 9 SE attack vectors × FBI 8-elicitation techniques orthogonal fan-out. Prompt-injection signature detection + A2A inbound Spotlighting wrapper verification (HFS §3 + ART §5).
- **Output contract**: cialdini_principle + hadnagy_vector + elicitation_technique + injection_canary_status.
- **Human review default**: the result of LLM-classifier-based sensitive topic classification is *always a human gate* — auto-block prohibited (unmet by (b) "false positive < 1%" among `cross-axis CT1` rule (a)+(b)+(c)).

#### §2.1.6 Agent 6 — Method/Compliance attacker (PM + CMP combined)

- **Responsibility**: NIST 800-115 / OSSTMM / OWASP Testing Guide / PTES 4 methodologies × ISO 27001:2022 4-theme = 16-cell 2D dispatch matrix (CMP §5). RAV-style quantified release gate (PM §5). CIS v8.1 cross-framework mapping (CMP §8).
- **Output contract**: methodology_anchor + iso_theme + rav_score + cis_control_id.
- **Catalog version mandatory**: specify `catalog_version` + `coverage_percentage_under_catalog` + `untested_classes[]` per finding (`cross-axis Cluster C8`'s falsifiability anchor). Use of the word "secure" is prohibited — the qualified expression *"passed coverage X% under catalog v_Y as of date Z"*.

#### §2.1.7 Agent 7 — Threat model / Lifecycle attacker (TM + PTE combined)

- **Responsibility**: STRIDE + LINDDUN + UKC 13-17 cell orthogonal (TM §1) × PTE 5-layer (identity / transport / payload / temporal / aggregation) × 3-lifecycle (creation / operation / update) (PTE §1+§5). Bottom-up propagation of attack-defense tree fragments (TM §2). Secondary-surface iteration guard (TM §5) — responsible for extracting the diff of F_{N+1} = (F_N − sealed) + secondary_new.
- **Output contract**: stride_category + linddun_category + ukc_phase + pte_layer + lifecycle_stage + secondary_surface_origin_id.
- **TOFU hardening** (PTE §2): admit-time Ed25519 signature + DID registration + trust anchor lifetime metadata required.

#### §2.1.8 Agent 8 — Synthesizer (fan-out sink, MAD + FPB + CDB + SVD + IRD)

- **Responsibility**: retire-barrier synthesis of the 7-agent findings. BFT quorum 2f+1 (withstands up to f=2 when n=7) + diversity-enforced source independence (MAD §2 + §3.2) + accountable iteration history (MAD §3.4 append-only signed chain) + ACH matrix multi-hypothesis (CDB §1) + CIM normalization tri-format export (SVD §4) + PICERL 6-phase gating (IRD §1) + invariant catalog shrink-minimal repro (FPB §3).
- **Output contract** (3-layer hybrid, for detail see §3 synthesis report format):
  - **Layer 1**: OSCAL Assessment Result's `oscal.findings[]` + `oscal.iteration_summary` (resolved / regression / persistent / new 4-set diff) + `oscal.alignment_matrix` (axis × axis cross-confirmation count).
  - **Layer 2**: Hyperbrief 9-section IR (per finding with score ≥ 4) + `recommended_methodology[]` 4-tuple default.
  - **Layer 3**: Greatpractice tree entry candidate (macro / mezzo / micro auto-classification).
- **Cross-axis confirmation**: the same finding reported by 2f+1 = 5 agents → `confirmed` tier, by f+1 = 3 agents → `needs-corroboration`, single report → `low-confidence draft` (MAD §3.1).
- **Coverage definition** (§6.3 critic Tier A patch absorbed): `coverage_percentage_under_catalog` = (number of catalog cells explored / total number of cells in that catalog) — not the ambiguous "clean" of a simple "0 found", but an *explicit measurement per catalog cell*. The unit is defined per catalog (e.g., OWASP LLM Top 10 → 10 cells, MITRE ATT&CK Enterprise v15 → 14 tactics × N technique cells, ISO 27001 Annex A → 93 control cells). Each cell's *probe attempted* and *probe successful* are counted separately — probe attempted is the denominator.

### §2.2 GTA + DSP cross-cutting layer (all-agent output enrichment)

GTA (game-theory-asymmetry) and DSP (devsecops-policy-as-code) are **a cross-cutting layer, not a separate fan-out target** — they perform metadata enrichment + a filter pass after all findings of the 7 agents are output, *before* the retire-barrier (aligns with `cross-axis-patterns.md §3.1`'s conclusion that *"GTA + DSP are cross-cutting (the ROI calibration + policy enforcement layer after every agent's output), not a separate fan-out target"*).

#### §2.2.1 GTA enrichment (ROI calibration + actor profile)

The following metadata is appended to each finding:
- **`kill_chain_stage`** — position among the Lockheed Martin Cyber Kill Chain 7 stages (reconnaissance / weaponization / delivery / exploitation / installation / C2 / actions-on-objectives).
- **`actor_profile`** — the commit-aware adversary tier of the Stackelberg leader (`game-theory-asymmetry §2`): `kiddie` / `hacktivist` / `ecriminal` / `apt` 4-profile.
- **`pain_level_if_fixed`** — Bianco's Pyramid of Pain 1-7 scale (hash / IP / domain / network artifact / host artifact / tool / TTP). A fix with pain_level ≥ 5 is a *high defender ROI* signal.
- **`externality_score`** — `externality-aware-fix-filter` (GTA §3.6) — the *cumulative population friction* of the *daily friction cost* (increased test runtime / increased build time / cognitive load / future regression rate) ÷ *expected blocked attack loss*. When > 1.0, automatic deprioritize or Hyperbrief escalate (applying Herley 2009's externality thesis).
- **`defender_intervention_options[]`** — kill-chain decomposed ΔROI reporting (GTA §3.5) — a `{control, ΔROI, effort_h}` 3-tuple per option.

#### §2.2.2 DSP enrichment (graduated enforcement + MTTR phase)

The following metadata is appended to each finding:
- **`enforcement_tier`** — the HashiCorp Sentinel pattern of the `advisory` / `soft-mandatory` / `hard-mandatory` 3-tier (`devsecops-policy-as-code §3.1 + cross-axis Cluster C7`). A new policy is an *advisory tier* entry — the promotion decision after measuring false-positive rate + override rate is the Hyperbrief 4-score gate.
- **`mttr_phase`** — position among the Discovery / Triage / Remediation / Verification 4 phases (`devsecops-policy-as-code §3.2`). The basis for the 3-iteration floor = these 4 phases must repeat 3 times to complete through fix-induced regression verification.
- **`rollback_feasibility`** — `full` / `partial` / `none` (IRD §10 rollback-feasibility action class). A fix that is `none` gets a forced Hyperbrief escalate along with the permanent manual category.
- **`policy_as_code_artifact_ref`** — the Rego / Sentinel / Kyverno artifact path of the promoted policy (`devsecops-policy-as-code §3.6`). Accompanied by a Conftest unit test.

#### §2.2.3 Strict-mode reconciliation with graduated enforcement

The DSP graduated enforcement ladder (advisory → soft → hard) and the PTE strict-mode default (PTE §8) *seem at first glance contradictory* but are *orthogonal* (`cross-axis Contradiction CT5` synthesis + §7.3 critic Tier A patch absorbed):

- **The ladder is the policy *lifecycle***: the phase of introducing a new policy — advisory entry → FP rate measurement → soft → hard promotion. During Phase 1 (v0.1.0-v0.1.x) it is *advisory mode only* (no blocking, surface only), and upon entering Phase 2 (v0.2.x) it transitions to *blocking mode* (TM §11+§12 alignment).
- **Strict mode is the policy *enforcement***: a policy already promoted to hard-mandatory + a situation where evaluation is *impossible* (tool timeout / external API down / agent dispatch failure) — *block (no fallback progress)*. The PTE §8 lesson of STARTTLS downgrade.
- **Reconciliation rule** (aligns with the §13.5 invariant):
  1. The *policy lifecycle phase* (advisory / soft / hard) and the *enforcement evaluation outcome* (passed / failed / cannot-evaluate) are expressed as an *orthogonal 2-tuple*.
  2. `(advisory, cannot-evaluate)` → surface only, progress allowed.
  3. `(soft-mandatory, cannot-evaluate)` → Hyperbrief 4-score gate (user decision — auto-deferral prohibited).
  4. `(hard-mandatory, cannot-evaluate)` → block (strict mode applied), opt-out requires passing a Hyperbrief MUST-trigger.
  5. The opt-out utterance itself is a *Greatpractice mezzo promotion trigger* — if repeated, the evaluation tool deficiency is promoted as a structural problem (Cluster C5 bidirectional feed).

### §2.3 v0.2-v0.4 axis expansion roadmap (path to reaching all 17 axes)

This is the progressive expansion path from v0.1.0's 8 agents (7 attackers + 1 synthesizer) to v0.4's 17-axis full coverage (`cross-axis-patterns.md §5 Maturation roadmap` alignment).

| Phase | Version | Axis expansion | Fan-out dimension expansion | Critical surface added |
|---|---|---|---|---|
| **1 (v0.1.0)** | minimum viable | 13 axes embedded (ART/AML/WAI/SCS/CKM/HFS/PM/CMP/TM/PTE/MAD/FPB/CDB/SVD/IRD; GTA/DSP cross-cutting) — but the fan-out is compressed to 7 attacker agents | **2D matrix** (taxonomy × methodology) | OSCAL Layer 1 + Hyperbrief Layer 2 + Greatpractice Layer 3 |
| **2 (v0.2.x)** | first dogfood post-cut | actor-profile dimension activated (automatic on Tier 3 release) — GTA 4-actor can be split into separate fan-out agents | **3D matrix** (+ actor-profile) | Cross-axis attack path graph (WAI §2 + SVD §3 + ART §4) + ASR probabilistic threshold + mutation gate (FPB §8) + Catalog watcher auto-refresh (Contradiction CT4 Phase 2) + Self-spec-gaming meta-iteration (Cluster C12) |
| **3 (v0.3.x+)** | preparing for multi-project residency | layer × lifecycle orthogonal dimension activated — PTE 5-layer × 3-lifecycle split into separate fan-out agents | **4D matrix** (+ layer × lifecycle) | D3FEND auto countermeasure (PM §4) + Atomic Red Team catalog + Constellation A2A signature + DID registration + Sybil-resistant agent registry (MAD §6) + MPCVD A2A intent (IRD §7) |
| **4 (v0.4+)** | long-term institutional memory | 17-axis full coverage — each axis becomes an *independent attacker agent* + GTA/DSP also split into separate ROI/policy agents | **5D matrix** (+ post-release temporal dimension) | Post-release regression watcher (ART §8) + ConMon (CMP §9) + Coverage-feedback corpus evolution (FPB §1) + Binary-level constant-time verifier (CKM §5) + PII-axis conditional activation (CMP §11) |

Each phase's promotion decision = Hyperbrief 4-score gate (score ≥ 4 + operating period ≥ N month + FP rate < threshold + cross-module impact measurement). Axis expansion is only a *backward-compatible bump* — breaking changes to the existing finding schema are prohibited (absorbs the §12.4 schema evolution policy, for detail see §12.4).

#### §2.3.1 Schema evolution policy (§12.4 critic Tier A patch absorbed)

On axis expansion, the finding schema follows these rules:
- **Additive only**: a new `perspective.secondary[]` entry, a new `enforcement_tier` value, a new `actor_profile` enum — all additive. The parse of existing consumers (Hyperbrief renderer / Greatpractice promoter / Constellation A2A relay) must not break.
- **Versioned envelope**: every finding has `schema_version` (semver) at its root — a minor bump is additive, a major bump enters the RRP (Request-for-Refactor Protocol) + 1-version overlap window + auto-migration adapter.
- **Catalog version tracked separately**: `external_standard_anchor.catalog_version` is *independent* of schema_version — the OWASP LLM Top 10 v2025.11 → v2026.x update is unrelated to the finding schema (preserving the Cluster C8 falsifiability anchor).
- **Deprecated field grace period**: a grace of ≥ 2 minor versions + Greatpractice macro registration ("schema migration check") + automatic Hyperbrief revisit chain.

### §2.4 Agent diversity invariant (4-tuple hash, dispatch-time enforcement)

To avoid LLM correlated hallucination + Eclipse attack (MAD §1.7), it verifies at dispatch-time that the *(model_family, prompt_template_hash, seed, axis_hash) 4-tuple of all 7 attacker agents* is distinct (`cross-axis-patterns.md` Cluster C10 + MAD §3.2 + AML §3.6 synthesis).

#### §2.4.1 Diversity check algorithm

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
  // v0.1.0: enforce (perspective × model_family) 2-tuple distinct ≥ 3
  const perspectiveModelTuples = new Set(
    agentRoster.map(a => `${a.axis_id}:${a.model_family}`)
  );
  if (perspectiveModelTuples.size < 3) {
    throw new DispatchError('MIN_DIVERSITY_VIOLATION', { distinct: perspectiveModelTuples.size });
  }
}
```

#### §2.4.2 Enforcement tier (v0.1.0 → v0.4 progressive strengthening)

- **v0.1.0**: enforce (perspective × model_family) 2-tuple distinct ≥ 3 — *minimum viable*. The 7 attacker agents must occupy at least 3 distinct (perspective, model_family) pairs for dispatch to proceed. N seed repetitions of the same model + same prompt collapse to a *single source* (Cluster C10).
- **v0.2.x**: + seed dimension distinct — a different seed of the same model_family is also recognized as a separate source (but only when the prompt differs).
- **v0.3.x+**: + enforce levenshtein distance ≥ threshold of prompt_template_hash — blocking fake-diversity of similar prompts.
- **v0.4+**: + enforce cross-provider quorum (confirmed tier recognized only when models from ≥ 2 providers among Anthropic + OpenAI + Google + Meta are used).

#### §2.4.3 Diversity violation → dispatch abort

- diversity check fail → dispatch rejected + Hyperbrief MUST-trigger ("insufficient agent diversity, synthesis result confidence below bar") + roster reconstruction (substitute with a different model_family or a different prompt template) then retry.
- retry attempt count > 3 → Greatpractice mezzo promotion ("difficulty securing diversity promoted as a structural problem") + user escalate.

#### §2.4.4 Regression baseline (§6.4 critic Tier A patch absorbed)

When the agent roster changes (model_family swap / prompt template upgrade), there is a risk that the comparability of finding results breaks — a measurement baseline for the *regression-free* clean signal condition (§3.5 4-condition AND gate's (1)) is needed:
- **Roster snapshot hash**: stamp `roster.json`'s `sha256(sorted(agent_roster))` at the start of each iteration (Cluster C11 frozen membership invariant).
- **Baseline finding set**: stamp iteration N-1's `F_{N-1}` + regression measurement is valid only when iteration N's roster is the *same roster*.
- **Roster diff window**: the first iteration after a roster change is a *baseline rebuild iteration* — skip regression measurement and register `F_N` as the new baseline.
- **Cross-roster comparability**: after a roster change, an obligation to rebuild the baseline for *at least 1 iteration* → resume regression measurement. When roster change frequency > N per cycle, Greatpractice mezzo promotion ("roster volatility").

### §2.5 Self-spec-gaming hazard avoidance (Ultrasafe meta-safety)

Ultrasafe itself can become an attack target — if clean rate / pass rate becomes the spec-gaming reward of the attacker agents, the meta-failure of trying only trivial perturbations and declaring "clean" early (self-application of Krakovna 2018's 60+ examples) (`cross-axis-patterns.md` Cluster C12 + AML §3.6 + GTA §3.7 + adversarial-ml §6 synthesis).

#### §2.5.1 4 mandatory items (v0.1.0)

1. **Minimum attack diversity enforced** — a *minimum attack family attempt list* is enforced per attacker agent. AI/LLM agent = attempt all of FGSM + PGD + C&W + black-box 4-family, Web/API agent = attempt all of OWASP × ATT&CK 8 sub-perspectives. Single-family early termination blocked — avoiding the *"terminate early with 0 found"* anti-pattern.
2. **Audit-trail-able logit/trace retention** — the attacker agents' logits / exploration traces / token consumption are all retained in the *outer private evidence store*. An agent whose token consumption is *more than 3σ below* the average → free-rider suspicion + the synthesizer performs *probe-based detection* (re-running the same attack on a random sample to verify result consistency) (MAD §4.8 free-rider attack defense).
3. **External standard mapping mandatory** — `external_standard_anchor` is required for every finding (Cluster C8 falsifiability invariant). Declaring "clean" with internal self-defined metrics alone is impossible. The minimum bar of coverage is *externally defined* — OWASP LLM Top 10 / MITRE ATT&CK / ISO 27001 / EU AI Act Article 15(5) 5-family, etc.
4. **Specify `untested_surfaces[]` per iteration N** — an *explicit untested catalog cell list* is enforced in the synthesizer's iteration boundary report. To claim "0 unexplored surfaces", *evidence of probe attempted for all cells* is needed — otherwise `untested_surfaces[]` is always non-empty.

#### §2.5.2 Broker surface (§8 critic Tier A patch absorbed)

The enforcement of the 4 mandatory items above is handled not by the *synthesizer's retire-barrier* but by a *separate broker surface* — avoiding the risk that the synthesizer itself becomes the target of spec-gaming.

- **Broker role**: dispatched as a process *independent* of the synthesizer (`plugins/ultrasafe/broker/meta-safety-broker.cjs`). It inspects both the 7-attacker emit + synthesizer aggregate as a *passive observer*.
- **The broker's 4 mandatory checks**:
  1. attack family coverage check — whether each attacker agent's attack family list satisfies minimum diversity
  2. token consumption distribution check — flag agents more than 3σ below
  3. external_standard_anchor presence check — the anchor field of every finding is non-empty
  4. untested_surfaces[] non-empty check — the explicit untested list of the synthesizer iteration summary exists
- **Broker → Hyperbrief routing**: if any one of the 4 checks fails → Hyperbrief MUST-trigger ("self-spec-gaming hazard detected") + iteration abort + roster reconstruction.
- **The broker's own meta-safety**: the broker's code is an *immutable signed snapshot* of the outer private repo + hash stamped at iteration start (Cluster C11 frozen state invariant). So that the broker's behavior itself does not become a spec-gaming target of the attacker agents — the broker's reward is *none* (passive observer, pure logging + alert).

#### §2.5.3 Adversarial review (v0.2+ meta-iteration)

v0.1.0's 4 mandatory items + broker alone avoid only *known* spec-gaming patterns — upon entering v0.2.x, *meta-iteration* is introduced:
- **Ultrasafe self-test**: injecting a *planted vulnerability* into Ultrasafe itself, then verifying whether the iteration loop detects it (IRD §9 self-test meta-iteration alignment).
- **Cross-version adversarial review**: adding the finding category that the previous release's Ultrasafe missed as the *adversarial review* axis of the next release — *drift detection against the historical baseline* (AML §4.8 alignment-faking countermeasure).
- **External red-team eval**: a black-box assessment of the Ultrasafe module itself by an external (upon explicit user decision) red-team team — at the v0.3.x+ enterprise pilot.

---

*This §2's cross-section dependencies: §3 (finding output contract + synthesis report 3-layer hybrid), §6.3 (coverage definition), §6.4 (regression baseline), §7.3 (strict-mode reconciliation), §8 (broker surface for meta-safety), §12.4 (schema evolution policy), §13.5 (graduated enforcement + strict-mode invariant) — all forward-ref, resolved in the merge agent.*

---

## §3. Fan-out Matrix — taxonomy × methodology × actor-profile orthogonality

> The essence of Ultrasafe is *not a single-perspective pen-test but multi-axis orthogonal fan-out*. This § defines v0.1.0's **13-axis dispatch matrix**, and describes how that matrix (a) is embedded into the Stackelberg commit-aware 2-phase structure, (b) is multiply spawned along the actor-profile dimension, (c) is dispatch-time enforced via a diversity 4-tuple hash, and (d) is auto-routed per release tier. It is a synthesis of cross-axis synthesis §2 Cluster C1 (16/17-axis convergence) + C10 (diversity-enforced source independence, 8/17 axes) + C7 (pre-release hook + tiered cost control, 10/17 axes). This is the section that spec-ifies the conclusion of fan-out partitioning-axis contradiction CT7 — **no single-axis enforcement, the product of 2-3 orthogonal axes mandatory**.

### §3.1 13-axis dispatch matrix (Tier 1 baseline, ATT&CK + OWASP × Methodology combined)

v0.1.0's minimum viable carving = **(taxonomy × methodology) 2D matrix** + opt-in third dimension (actor-profile, §3.3). The basis of this carving = cross-axis synthesis Cluster C1 (`taxonomy-first 4 axes + methodology-first 1 axis + ...`) + Cluster C8 (external standard anchor mandatory) — instead of self-defined metrics, the *catalog of an external standard* is the fan-out base.

**13-axis baseline matrix** (perspective × methodology bucket):

| Axis ID | Perspective (taxonomy/catalog) | Methodology bucket | Catalog version anchor |
|---|---|---|---|
| `usf-ai-llm` | OWASP LLM Top 10 (LLM01-LLM10) | OWASP Gen AI Red Teaming Guide | `OWASP_LLM_TOP10_v2025.11` |
| `usf-ai-agentic` | OWASP Agentic Top 10 + ATLAS | OWASP Agentic Red Teaming | `OWASP_AGENTIC_2025.12 + ATLAS_2025.10` |
| `usf-ai-aml` | EU AI Act Art. 15(5) 5-family (PGD/C&W/poisoning/membership-inference/model-extraction) | NIST AI RMF + OWASP Gen AI | `EU_AI_ACT_Art15_v1` |
| `usf-web-sast-dast` | OWASP API Top 10 + OWASP Web Top 10 + CWE queue | OWASP WSTG + NIST 800-115 | `OWASP_WSTG_v4.2 + CWE_v4.14` |
| `usf-web-infra` | OWASP × MITRE ATT&CK Enterprise dual taxonomy (8-agent) | OSSTMM + PTES | `MITRE_ATTACK_v15` |
| `usf-supply-chain` | 5-way vector (build / maintainer / typo / transitive / reproducibility) | SLSA L1-L4 + SSDF | `SLSA_v1.0 + NIST_SSDF` |
| `usf-crypto` | C1-C15 cryptography pattern catalog | TLS 1.3 minimum profile + PQC readiness | `Ultrasafe_Crypto_C1-15_v0.1` |
| `usf-social-eng` | Cialdini 6 × Hadnagy 9 × FBI 8-elicitation | TIBER-EU + Red Team Alliance | `HFS_Direct_Catalog_v0.1` |
| `usf-stride` | STRIDE per-Element/per-Interaction (S/T/R/I/D/E) | Microsoft SDL + Shostack 2014 | `STRIDE_v1 + Hernan_et_al_2006` |
| `usf-linddun` | LINDDUN 7-category (L/I/N/D/D/U/N) — privacy | LINDDUN GO + LINDDUN PRO | `LINDDUN_v3.0` |
| `usf-kill-chain` | UKC 18-phase × 3-cycle (IN/THROUGH/OUT) | Lockheed CKC + Unified KC | `UKC_v2.0 + LM_CKC_v1` |
| `usf-protocol-lifecycle` | 5-layer × 3-lifecycle (creation/operation/update) | NIST 800-115 + custom protocol audit | `PTE_Protocol_Matrix_v0.1` |
| `usf-iam-config` | IAM + secrets + env + dependency manifest surface | CIS v8.1 + DevSecOps policy-as-code | `CIS_v8.1 + OWASP_CICD_Top10` |

**Carving principle**: each axis holds both a *unique catalog version anchor* and a *unique methodology bucket* — enforcing Cluster C8's falsifiability requirement (`the word "secure" forbidden, limited to "passed coverage X% under catalog v_Y"`) from dispatch-time onward. On catalog version mismatch (e.g., a new OWASP LLM Top 10 cut not reflected), dispatch aborts + the Greatpractice macro node (`regulation drift watch`) triggers.

**Significance of the methodology bucket**: even for the same perspective, if the methodology differs it is a *different attack agent* — the carving itself of NIST 800-115 (controlled discoverable) vs OSSTMM (controlled measurable) vs OWASP (web-context heuristic) vs PTES (full-scope) is a fan-out axis (synthesis of CMP pattern 5 + PM pattern 1). The methodology-pair fan-out of the same taxonomy is recognized as an *independent source* in §3.4's diversity verification.

**Meaning of the Tier 1 baseline**: the 13 axes are the *minimum guarantee* — depending on the release tier, only a *subset* may fire (§3.5). Axis additions (e.g., v0.2's `usf-cloud-iam` / `usf-mobile`) proceed via per-v0.x-cut N-way sync (newly registering an AGENTS.md §5.8 entry).

### §3.2 Stackelberg commit-aware 2-phase (Phase A enumeration + Phase B best-response)

The carving of cross-axis synthesis Cluster C11 (frozen membership / state during iteration, 7/17 axes) + GTA pattern 1 — fan-out is *not a random pen-test* but a *best-response simulation of the follower who observes the defender's current commit*.

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
barrier: retire-barrier (Superscalar §3 conformant)
```

In Phase A, *all axis agents are simultaneously read-only* — each enumerates "the defender resource layout of the current commit" from its own perspective. All mutation is forbidden (Superscalar v0.4.2's read fan-out discipline). The output = a single `defender_commit_snapshot.json` (a merge of per-axis sub-documents).

**Phase B — informed best-response attack simulation (Stackelberg follower)**:

```yaml
phase: B
mutating: false  # simulation only, no code mutation
parallel: true
inputs:
  defender_commit_snapshot.json  # Phase A output
  attack_catalog: per-axis (catalog_version frozen-in)
per_agent_logic:
  1. read snapshot → identify weakest defender point (the LP's lowest-expected-utility cell)
  2. attack plan = argmax_t U_attacker(t | snapshot)
  3. execute simulated attack (PoC sketch + anchor + evidence)
  4. emit finding (schema §6.2)
barrier: retire-barrier → §4 synthesizer input
```

**Phase B's Stackelberg advantage**: a non-informed pen-test spends a substantial portion of the budget on *retrying already-blocked surfaces* — Phase B attacks only the *gaps* in the defender controls that Phase A enumerated beforehand, exploring deeper paths with the same token budget. Conformant with GTA §3.2's "Stackelberg-informed pen-test."

**Frozen membership discipline (Cluster C11)**: between Phase A → Phase B, the `registry.json` hash + `target_commit_sha` + `catalog_version` are frozen in. An attempt to change the underlying snapshot during Phase B (e.g., an automatic dependency update) results in *iteration abort + quarantine* — the transition window itself is an attack surface (conformant with MAD pattern 8's Raft membership freeze).

**v0.1.0's simplification**: the Stackelberg solution is *not* the ideal model's mixed-strategy LP but a *heuristic best-response* — each axis agent's LLM prompt receives the snapshot as a fence-block and infers *"which is the most vulnerable perspective-N point of this commit?"* Formal SSG LP solver integration comes after entering v0.3+.

### §3.3 Multi-actor profile fan-out (simultaneous spawn of script-kiddie / hacktivist / eCriminal / APT)

The GTA pattern 2 carving of cross-axis synthesis Cluster C1 — for the *same axis × same commit snapshot*, multiply spawn attack agents with *different actor profiles*.

**Actor profile 4-tuple (v0.1.0)**:

| Profile | Budget (token cap) | Toolkit | Persistence | TTP catalog size |
|---|---|---|---|---|
| `kiddie` | 4k | commodity exploit DB (CVE ≤ 90d) | single session | ≈10 technique |
| `hacktivist` | 16k | OSINT + DDoS + defacement + public reputation | weeks | ≈30 technique |
| `ecriminal` | 64k | ransomware staging + credential harvest + RMM-tool abuse (CrowdStrike 2024 trend, 79% malware-free) | months | ≈60 technique |
| `apt` | 256k | zero-day class assumption + supply-chain pivot + multi-step | months-to-years | ≈100 technique (MITRE ATT&CK Enterprise subset) |

**Spawn rule**: the *Cartesian product* of axis (§3.1) × profile (§3.3) is the maximum cardinality of the fan-out (13 × 4 = 52 agent). Actual dispatch is a *per-release-tier subset* (§3.5) — Tier 1 dimensions only on axis, with profile fixed to `kiddie`. Only Tier 3 activates all 4 profiles.

**Per-profile attack plan differentiation**:
- The `kiddie` profile is *commodity exploit only* — in Phase B, attack plan = "fuzz those among the last 90 days' CVEs that match the snapshot's dependencies". Single-vector within a 4k budget.
- The `hacktivist` profile is *public-surface-first* — OSINT (public domain enumeration), reputation surface (public dashboard, banner), DDoS staging. *The signature itself is noisy* — centered on the lower layers of the Pyramid of Pain (hash / IP / domain).
- The `ecriminal` profile is *credential-driven malware-free* — IAM weaknesses + secret exposure + RMM tool path. Emulates CrowdStrike 2024's 79% malware-free + 48-minute breakout time trend.
- The `apt` profile is *multi-step + supply-chain* — prioritizing the *weakest link in the chain* among the Phase A snapshot's dependency tree + maintainer signal + build pipeline. Over half of the budget is allocated to this profile (Tier 3 only).

**Stereotyping avoidance (Contradiction defense)**: an actor profile is *not* a fixed taxonomy but *(budget × toolkit × persistence × ttp_catalog) 4-axis sampling* — each cycle, the profile parameters are jittered (e.g., shaking `kiddie`'s budget by ±20% to try new combinations). Conformant with GTA §4.4's stereotyping-pitfall avoidance + Cluster C12's self-spec-gaming meta-safety.

**Non-rational profile enforcement**: at least one agent must be spawned with a *non-rational / opportunistic* profile (random fuzzing + known commodity exploits) — with only the Stackelberg rational attacker, *insider error / malicious confused deputy / irrational surfaces* go undiscovered (conformant with GTA §4.1's pitfall). This agent's ID is `usf-opportunistic-fuzzer`, mandatory in all release tiers.

### §3.4 Diversity enforcement (4-tuple hash check at dispatch)

The carving of cross-axis synthesis Cluster C10 (8/17 axes) — enforcing *(model_family, prompt_template_hash, seed, axis_hash) 4-tuple distinct*. N-seed repetition of the same model + same prompt is effectively a single source — excluded from the quorum count (§4 synthesis cluster).

**Dispatch-time verification hook** (`plugins/ultrasafe/dispatch/diversity-check.cjs`):

```javascript
// pseudo-code; the full impl is in v0.1.0 spec §13 Appendix
function diversityCheck(agentDispatchList) {
  const tuples = agentDispatchList.map(a => ({
    model_family: a.model_family,        // e.g., "claude-opus-4-7" / "gpt-5" / "gemini-3"
    prompt_template_hash: sha256(a.prompt_template),
    seed: a.seed,
    axis_hash: sha256(a.axis_id + a.catalog_version)
  }));
  // distinct count of the 4-tuple
  const distinctCount = new Set(tuples.map(t => JSON.stringify(t))).size;
  if (distinctCount < THRESHOLD[releaseTier]) {
    // if insufficient, re-dispatch with a new model_family or a new prompt variant
    return { ok: false, action: "respawn_with_diversification", missing: ... };
  }
  return { ok: true };
}
```

**v0.1.0 first enforce**: full 4-tuple verification is v0.2+ (model-family diversification comes after multiplexing the operational LLM providers). v0.1.0's minimum enforce = **(perspective × model_family) 2-tuple distinct ≥ 3** — when deciding a quorum for the same axis, at least 3 (perspective, model_family) pairs must be independent. seed / prompt_template_hash are a v0.2 extension.

**Eclipse resistance conformance**: MAD pattern 2's eclipse attack model — blocks a single model_family's systematic blind spot (e.g., all Claude variants being swayed identically by a particular prompt-injection pattern). The quorum's definition of "independent voice" is recognized only when all 4 axes of *model_family × prompt × seed × axis* are distinct.

**Linkage with the synthesis stage**: the §4 synthesizer's cross-axis confirmation count counts only the findings of *agents that passed diversity verification*. Two findings with identical (model_family, prompt_template_hash) are treated as "two utterances of a single source" — summed as confirmation 1.

**Anti-pattern**: recognizing as quorum a majority vote over 5 runs of the same model + same prompt + different seed. CDB §4.7's "multi-perspective ≠ independent" pitfall. Ultrasafe rejects this pattern at dispatch-time — failing at the distinct-count verification of `diversity-check.cjs`.

### §3.5 Cost-tiered cadence (patch / minor / major 3-tier auto-routing)

The carving of cross-axis synthesis Cluster C7 (10/17 axes) + TM pattern 11 + CMP pattern 7 + ART pattern 7 + PTE pattern 4 — differentiating fan-out intensity per release tier.

**Tier definitions + auto-routing rule**:

| Tier | Trigger pattern (semver + commit type) | Axis subset (§3.1) | Profile subset (§3.3) | Iteration floor | Token budget cap |
|---|---|---|---|---|---|
| **Tier 1 — patch / chore** | `vX.Y.Z+1` patch bump · `chore:` / `fix:` | static gates only: `usf-supply-chain` (manifest only) + `usf-iam-config` + `usf-opportunistic-fuzzer` | `kiddie` only | 1 (delta-only) | ≤ 20k tokens |
| **Tier 2 — minor / feat** | `vX.Y+1.0` minor bump · `feat:` / `refactor:` | 4-6 axis (selection based on perspective relevance) + `usf-opportunistic-fuzzer` | `kiddie` + `ecriminal` | ≥ 3 | ≤ 200k tokens |
| **Tier 3 — major / external publish** | `vX+1.0.0` major bump · `BREAKING CHANGE:` · `gh release create` · external blog/demo publish | full 13 axis + cross-axis graph synthesis | all 4 profiles (`kiddie` / `hacktivist` / `ecriminal` / `apt`) | ≥ 3 (statistical/timing finding → ≥ 5; §6.3 conformant) | ≤ 2M tokens |

**Trigger surface** (Cluster C7 + WAI pattern 5):

```jsonc
// .claude/settings.local.json (example)
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

Responsibilities of `pre-release-gate.cjs`:
1. Analyze the tag's semver delta → automatically determine Tier 1/2/3.
2. Scan the commit message → tier escalation based on `BREAKING CHANGE` / `feat:` / `fix:` keywords.
3. An explicit user invocation (`/ultrasafe`) defaults to Tier 2, with tier override possible via argument.
4. After tier determination, generate `dispatch-plan.json` — §3.1 axis subset + §3.3 profile subset + §3.4 diversity-verification prepass.
5. PreToolUse blocking — release proceeds only after the `dispatch-plan.json` result reaches the retire-barrier clean signal (§6.3 conformant). If clean is not met, exit code ≠ 0 + Hyperbrief escalate (§13.5 conformant).

**Tier escalation rule**: even if originally Tier 1 (patch), escalation is possible via *runtime detection*:
- supply-chain `usf-supply-chain` discovers a new transitive dependency → promote to Tier 2
- `usf-iam-config` detects an externally exposed surface change (e.g., a public API addition) → promote to Tier 3
- baseline drift in `defender_commit_snapshot.json` (≥ 20% rate-limit/auth-scheme change vs the previous release) → promote to Tier 3

Escalation is automatic just before a Hyperbrief MUST-trigger (user silent confirm possible — a separate escalation-indication card). De-escalation is auto-forbidden (conformant with Cluster CT5's strict-mode default).

**Cost cap conformance**: average token cost (assuming a Claude Opus 4.7 + 4 model-family diversity ensemble, as of 2026-06) — Tier 1 ≈ $0.50 / Tier 2 ≈ $5 / Tier 3 ≈ $50. The cumulative cost of frequent minor releases + LLM cost volatility is integrated with GTA §3.7's externality-aware fix filter's *daily friction cost* tracking — advisories where friction_total > prevented_loss_estimate × 0.5 are auto-deprioritized.

**Schema evolution discipline (§12.4 conformant)**: changes to the tier definitions themselves (e.g., adding a Tier 2 axis subset) are *non-breaking* only — adding new axes is ok, removing existing axes requires a major version bump. The catalog_version anchor (§3.1) is a *frozen identifier* — backward-compatible up to a minor bump (e.g., `OWASP_LLM_TOP10_v2025.11` → `.12` is minor, `v2026.01` is major + dispatch re-baseline).

**Linkage with §8 broker surface**: the dispatch-plan emit + Tier determination + retire-barrier clean signal can all be streamed as live-board cards via Constellation A2A's new intents (`ULTRASAFE_DISPATCH_PLAN`, `ULTRASAFE_RELEASE_GATE`) — the broker surface's card schema is detailed in §8. A Tier 3 release's 4-profile fan-out is visualized in a separate lane (each profile's progress + ETA + finding count) — conformant with SVD pattern 5.

**§6.4 regression baseline conformance**: the per-tier iteration floor is conformant with the 3-floor basis of *fix → verify of fix → verify of regression-of-fix* (DSP pattern 2). Tier 1's iteration 1 is a *delta-only regression* — checking only the diff surface against the previous release's `defender_commit_snapshot.json` baseline (omitting full DFD reconstruction). Tier 2/3 use full DFD + secondary surface (see §6.4's baseline definition).

**§7.3 + §13.5 strict-mode conformance**: *un-evaluable* tier escalation (e.g., snapshot-extraction failure / external API down / catalog stale) is *blocked from proceeding* by strict-mode default (conformant with CT5's PTE pattern 8). Soft fallback ("snapshot partially missing but proceed") is entirely forbidden — the opt-out path requires passing the Hyperbrief 4-score gate, with auto-deferral absolutely forbidden.

---

## §4. Finding Output Contract — attack-agent finding schema

> This section defines the **output schema of a single finding** that each Ultrasafe attack agent emits. The synthesis stage (§6), decision-delegation gate (§7), A2A propagation (§8), and external ingest (SARIF/STIX/ATT&CK Navigator) all operate on top of this schema. There are 4 design principles — (i) industry-standard (STIX 2.1 SDO/SCO/SRO + ATT&CK technique ID + Diamond 4-vertex) compatible normalization, (ii) shrink-minimal-repro enforcement, (iii) source-tracking at synthesis-time via source-stamping, (iv) blocking the attack agent's own indirect prompt injection via prompt-fenced output. Avoiding the invention of a library standard — all borrow the lingua franca of external ecosystems (`security-visualization-dashboard §1.9` STIX + `security-visualization-dashboard §1.5` Diamond Model).

---

### §4.1 Finding JSON schema — STIX-CIM normalized core

The canonical JSON object an attack agent emits upon discovering a single finding. It borrows the SIEM industry's *normalization-first* principle (Splunk CIM / Elastic ECS — `security-visualization-dashboard §1.1`) — enforcing schema unification before raw output enters the synthesis stage. It bundles STIX 2.1's SDO/SCO/SRO 3-tier (OASIS 2021) + MITRE ATT&CK technique ID + Diamond 4-vertex subset as mandatory fields.

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

Field classification (`web-api-infra §2.2` cross-validation key):
- **identity fields** — `finding_id` · `iteration` · `agent.*` · `emitted_at` — dedup + source tracking (§4.3).
- **normalization fields** — `stix.*` · `mitre.*` · `diamond.*` · `category.*` · `kill_chain_phase` — cross-axis synthesis key.
- **risk fields** — `severity.*` — prioritization (§4.5).
- **evidence fields** — `evidence.*` — shrink-minimal-repro obligation (§4.2).
- **defense fields** — `prompt_fence.*` · `taxonomy_tags[]` — prompt-injection defense + sharing scope (§4.4).

The schema's **mandatory subset** is the 10 fields `schema_version` · `finding_id` · `iteration` · `agent.agent_id` · `agent.source_stamp_sig` · `mitre.technique` · `category.cwe` · `severity.ultrasafe_priority` · `evidence.minimal_repro` · `prompt_fence.output_envelope` — the rest are optional but additionally enforced in `strict-mode` (latter half of §4.5 + §13.5).

---

### §4.2 Shrink-minimal-repro mandate — `{full, minimal, shrink_steps}` 3-tuple

It borrows the *shrinking* pattern of the QuickCheck/Hypothesis lineage (Claessen-Hughes 2000 + MacIver-Donat-Bouillud 2019, `fuzzing-pbt §1.6 + §2.2`). Every attack agent must **self-shrink** its raw finding (full_repro) before transmitting it to the synthesis stage, and emit an evidence triple with **all three cells filled**.

| Field | Definition | Reason for enforcement |
|---|---|---|
| `full_repro` | the original payload + response + execution trace at the discovery point | audit trail (auditability) |
| `minimal_repro` | the shrink result — the minimal payload that triggers the same invariant violation | synthesis-stage cross-axis dedup + ↓ human-review cost |
| `shrink_steps` | shrink attempt count + termination reason (`fixpoint` / `budget_exhausted` / `oracle_diverged`) | over-shrink verification + reproducibility |

**Shrink algorithm baseline**. Hypothesis's internal byte-stream shrinker pattern — reducing the payload's raw byte representation in a binary-search style while checking each candidate with `attack_oracle(candidate) == True`. Termination conditions: (a) every 1-byte removal makes the oracle false (fixpoint), (b) the `max_shrink_steps` budget is exceeded (`budget_exhausted`), (c) the oracle result is stochastic (oracle_diverged — irreproducible).

**Over-shrink defense** (`fuzzing-pbt §4.6` shrinker non-termination/over-shrink pitfall). To prevent the minimal repro from collapsing to input unrelated to the root cause, it is **always co-listed** with `full_repro` — the synthesis agent (§6.2) looks at both cells and meta-judges whether it is over-aggressive. A finding with `shrink_terminated="oracle_diverged"` is downgraded to `confidence: low` at the synthesis stage.

**Budget**. v0.1.0 defaults are `max_shrink_wall_clock = 90s` + `max_shrink_steps = 256` per axis per iteration. When the budget is exceeded, the finding is still emitted but with `shrink_terminated="budget_exhausted"` explicit — the synthesis stage marks it as the deep-probe target of the next iteration.

**Tier A reinforcement (regression baseline, §6.4 patch)**. `minimal_repro` is automatically re-run as a **regression test corpus** at the start of iteration N+1 (`fuzzing-pbt §3.4`'s regression seeds pattern). That is, when the minimal repro of a finding resolved at N triggers an oracle violation again at N+1, it is classified as *regression* + Hyperbrief escalate. This contract anchors §6.4's *regression baseline* definition at the schema-tier.

---

### §4.3 Source-stamping — cryptographic source identification

When the synthesis stage (§6) integrates findings from N axes, *which axis* emitted from *which perspective* at *which model fingerprint* is the key on both the audit-trail and dedup-key sides. On top of the industry SIEM's source-axis preservation pattern (`security-visualization-dashboard §1.1`'s identification of the originating sensor of a Notable Event), it adds a **cryptographic signature** to close off the possibility of source tampering at the synthesis stage.

**Source-stamp fields**.
- `agent.agent_id` — the stable identifier of axis × perspective (e.g., `redteam-injection-alpha`).
- `agent.axis` — one of the 17-axis classification (`fuzzing-pbt`, `web-api-infra`, etc. — fixed enum).
- `agent.perspective` — the 5-class of `external-anonymous` / `external-authenticated` / `internal-rogue` / `supply-chain` / `prompt-injection-meta`.
- `agent.model_fingerprint` — the `<model-id>@<weight-snapshot-date>` format. Used for the synthesis stage's model-bias diagnosis.
- `agent.prompt_template_hash` — the sha256 of the agent's system prompt + tool spec. Monitors the variability of whether the same prompt emits different findings (`fuzzing-pbt §4.5` generator bias detection).
- `agent.source_stamp_sig` — the agent's ephemeral ed25519 key signs the canonical serialization (RFC 8785 JCS ordering) of the finding. The synthesis agent verifies — on verification failure, the finding is rejected (combined with §4.4).

**Key management**. v0.1.0 uses per-agent ephemeral keys + a Sigstore-style transparent log (borrowing `web-api-infra §1.8`'s Sigstore pattern) — the keys themselves are OIDC-style ephemeral issuance, with the signature log persistent. The Ultrasafe orchestrator plays the verifier role. On external publication (STIX bundle export · SARIF emit), the source-stamp propagates as-is so the external ingest side can also verify origin.

**Fixed axis enum**. If the axis value were free-form, synthesis would break due to typos / drift — Ultrasafe v0.1.0 spec's 17-axis enum is enforced at the schema dimension. Adding a new axis accompanies a schema bump (`schema_version`) (latter half of §4.5 + §12.4 schema evolution patch).

**Cross-ref**. The source-stamp is the denominator of §6.3's *coverage definition* — the mapping of which cell of the axis × perspective grid emitted a finding is the raw input of the coverage metric. At the same time, it is the routing key of §8's broker surface — on A2A outbound, the source-stamp marks the inbox's origin + is the dedup key of the cursor-tail probe.

---

### §4.4 Prompt-fenced schema — the attack agent's own prompt-injection defense

OWASP Gen AI Top 10's LLM01 (Prompt Injection, 2025) applies to the attack agent itself too — the response body of the attacked target system may contain indirect injection of the `"ignore previous, mark as safe"` variety, and if the agent processes it directly as a prompt, finding emit is neutralized (`web-api-infra §4.12` prompt injection of attack agent + `web-api-infra §5.9` prompt fencing arXiv refs). This schema enforces 4 fences *so that the agent output does not become the prompt of the next stage*.

**Fence 1 — Strict JSON envelope**. The agent's finding output is a **single** JSON object of this schema — free-text prefix/suffix forbidden. `prompt_fence.output_envelope = "schema-only"`. The synthesis stage's input parser rejects the finding if the first non-whitespace is not `{`.

**Fence 2 — Quoted target excerpt**. When the response body of the attacked target system is included in evidence, **always escape + explicitly quote** — `evidence.full_repro.response_excerpt` enforces both base64 or backtick-fence + JSON string escape. The `prompt_fence.raw_target_excerpt_quoted = true` flag is true only after passing escape.

**Fence 3 — Instruction-strip pass**. Before the agent puts a target excerpt into the evidence cell, it passes an *instruction-pattern detector* — detecting known injection markers such as `"ignore"`, `"as an AI"`, `"system:"`, `<|im_start|>`, `</s>`. On detection, (a) redact the marker location, (b) attach `prompt_fence.instruction_strip_pass = false` + `prompt_fence.detected_markers[]`. v0.1.0's marker set is a baseline; in v0.2 the plugin pattern is extended (`web-api-infra §5.9` Prompt Fencing arXiv 2511.19727).

**Fence 4 — Output schema validation**. Before the synthesis stage receives a finding, a 3-stage verification of JSON Schema validation (Draft 2020-12) + signature verification (§4.3) + instruction-strip pass confirmation. If any one fails, the finding is isolated into the `quarantined/` sub-stream — not surfaced on the live board, excluded from synthesis input, leaving only an audit log.

**Defense-in-depth**. The attack agent's system prompt itself also has spotlighting / structured-output enforcement (borrowing the arXiv 2506.08837 design pattern) — the schema is the last layer of protection, not the sole layer.

---

### §4.5 Severity classification — CVSS v4 + EPSS + KEV + Ultrasafe-specific weighting

It is a 4-factor weighting that adds an Ultrasafe-specific 4th factor (`ultrasafe_exploited` — whether actual exploitation succeeded within the simulation) on top of the 3-factor combination (CVSS · EPSS · KEV) of `web-api-infra §1.3` + `incident-response-disclosure §1.6-1.8`. EPSS + KEV dampen the tendency for theoretical severity (CVSS) to be *overrated* (`incident-response-disclosure §4.5` CVSS over-trust), and the measured signal of *our environment* (`ultrasafe_exploited`) plays the role of an additional anchor.

**4-factor formula (v0.1.0 baseline)**.

```
ultrasafe_priority =
   cvss_v4_bt        × 0.40
 + epss_estimate × 10× 0.25
 + kev_equivalent × 5× 0.15
 + ultrasafe_exploit × 5× 0.20

where:
  cvss_v4_bt          ∈ [0, 10]   # Base+Threat (v4 recommended — avoid base only)
  epss_estimate       ∈ [0, 1]    # FIRST.org EPSS or heuristic proxy
  kev_equivalent      ∈ {0, 1}    # CISA KEV listing or in-the-wild evidence
  ultrasafe_exploited ∈ {0, 1}    # actual penetration success within the simulation
```

The weight sum = 1.0; the reason `ultrasafe_exploited`'s weight is smaller than EPSS is that the simulation environment may not be *perfectly* the same as production — the same avoidance as `web-api-infra §4.5` base image drift / `fuzzing-pbt §4.7` PBT false confidence.

**Priority → routing mapping** (borrowing `incident-response-disclosure §3.3`'s CVSS-EPSS-KEV decision matrix).

| `ultrasafe_priority` | Routing | A2A intent | Hyperbrief score contribution |
|---|---|---|---|
| ≥ 7.5 | `BLOCK_RELEASE` | `BLOCKING_DECISION` | +2 (auto-escalate) |
| 5.0 - 7.5 | `DEFER_WITH_PLAN` | `DECISION_REQUEST` | +1 |
| 2.5 - 5.0 | `TRACK_BACKLOG` | `INFO_DISCLOSURE` | 0 |
| < 2.5 | `ACCEPT_RISK` | — (dormant) | 0 |

**KEV trump**. A finding with `kev_equivalent = 1` is immediately `BLOCK_RELEASE` regardless of other scores (borrowing the spirit of CISA BOD 22-01). The schema validator checks the consistency of `severity.kev_equivalent` and `ultrasafe_priority` — a finding where KEV is true but priority < 7.5 is quarantined.

**Novelty bypass**. A novel attack class is 0 on both CVSS/EPSS — missed by schema enforcement alone. If `category.cwe` is `CWE-UNKNOWN` or `mitre.technique` is not in the ATT&CK catalog, automatic Hyperbrief escalation (`incident-response-disclosure §4.5` novel attack avoidance). That is, items the schema *does not know* go to human review unconditionally.

**Tier A reinforcement (strict-mode reconciliation, §7.3 + §13.5 patch)**. v0.1.0 defines two modes — `permissive` (10 fields mandatory + the rest optional) · `strict` (the full schema mandatory, prompt_fence 4-fence pass enforced, source-stamp verification enforced). On release-gate application (§7), `strict` mode is enforced. A2A collaboration with external adapter agents (§8) allows `permissive`. Conversion between the two modes is *additive-only* (on permissive→strict, missing fields are explicit null or the `"unknown"` sentinel) — strict→permissive conversion is a lossless projection.

**Tier A reinforcement (schema evolution, §12.4 patch)**. `schema_version` is semver — major bump = breaking, minor = additive optional, patch = constraint refinement. The synthesis stage allows mixed schema_version within the same iteration but normalizes to *the lowest version's capability*. Adding a new axis enum / new fence marker / new severity factor is a minor bump. When the synthesis-stage retire-barrier receives an unknown-major-version finding, `quarantined/` + alert (forward-compatibility fail-safe).

**Explicit cross-section dependencies**.
- §6.2 synthesis dedup key = the `(category.cwe, diamond.victim.asset_id, mitre.technique)` triple — operates only on top of this schema's normalization fields.
- §6.3 coverage definition denominator = the `agent.axis × agent.perspective` grid — measurable only on top of this schema's source-stamp fields.
- §6.4 regression baseline = re-running iteration N's `evidence.minimal_repro` — meaningful only on top of the §4.2 mandate.
- §7.3 strict-mode release gate = `prompt_fence.*` 4-fence + source-stamp verification pass + `severity.kev_equivalent` consistency — this §4's fences are release-tier enforcement.
- §8 broker surface = `agent.source_stamp_sig` is the routing key + audit log entry — operates only on top of this §4.3.
- §13.5 external adapter compatibility = `schema_version` semver + `permissive` mode's minimum 10 fields — this §4.5's strict/permissive branch.

---

## §5. Synthesis Report 3-Layer — OSCAL + Hyperbrief IR + Greatpractice candidate

> The Ultrasafe synthesis report is **not a single monolith but a 3-layer simultaneous output**. Each time an iteration's retire-barrier closes, it emits together the 3 layers of (a) **OSCAL Assessment Result** — machine-readable audit evidence, (b) **Hyperbrief IR** — a 4-score escalation decision card, (c) **Greatpractice candidate** — a macro/mezzo/micro promotion candidate. It is an evidence-as-code structure where one fan-out cycle simultaneously satisfies three orthogonal downstream surfaces (compliance + decision + codification) (compliance-standards §1.13 + §2.3).

This §5 defines the report schema that the retire-barrier produces, just before §4's fan-out result enters §6's iteration loop. §4.x's attack-defense tree (§5.5) directly connects to this §5's attack-tree leaf attributes, and §6.3's coverage definition · §6.4's regression baseline · §7.3's strict-mode reconciliation · §8's broker surface · §12.4's schema evolution are downstream surfaces of this §5 schema.

### §5.1 OSCAL Assessment Result layer — machine-readable audit evidence

Among NIST OSCAL's (Open Security Controls Assessment Language) 5 models, the **Assessment Result** (AR) model is adopted as the primary output schema (compliance-standards §1.13). The AR's core is the 5 objects `finding`, `observation`, `risk`, `target`, `evidence` — Ultrasafe's attack agent finding maps 1:1 to OSCAL `finding`, the atomic step of an attack-tree leaf converts to `observation`, and the quantified residual of a root goal converts to `risk`.

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
      "observations": [/* per-attack-tree-leaf atomic evidence */],
      "risks": [/* per-root-goal cost/probability/impact roll-up */],
      "assessment-log": {
        "entries": [/* iteration N's timestamped event chain */]
      }
    }]
  }
}
```

**Core properties** (mandatory entries in the props array):
- `axis` — which axis of the fan-out reported (stride-S/T/R/I/D/E · linddun-* · owasp-llm · owasp-agentic · ukc-* · supply-chain · ai-specific · pii — the 13-axis classification of threat-modeling §3.1)
- `cwe` + `attack-id` — CWE-ID + MITRE ATT&CK technique-ID (the dual classification of threat-modeling §1.9)
- `cvss-base` — framework-neutral primary severity (avoiding the mapping distortion of compliance-standards §4.2)
- `quorum-count` — `N/M` format, the BFT-quorum consensus of §5.4 (multi-agent-distributed §3.1)
- `methodology` — one of NIST 800-115 / OSSTMM / OWASP / PTES / OWASP-LLM (compliance-standards §1.14)
- `tier` (metadata level) — Ultrasafe Tier 1/2/3 (compliance-standards §3.7, EAL hybrid)

**File:line anchor enforcement** — the form of `implementation-statement-uuid` must be a `<file>:<line-start>-<line-end>` ground-truth anchor (blocking the hallucinated finding of threat-modeling §4.7). A finding that does not pass anchor verification — file existence + line match — is rejected by the retire-barrier.

**Evidence chain** — `assessment-log.entries` operates as a timestamped append-only event chain, simultaneously satisfying SOC 2 Type II's "operating effectiveness over time" evidence (compliance-standards §2.3) and Casper-style accountable safety (multi-agent-distributed §1.5 · §3.4). The single source of Ultrasafe `reports/ultrasafe-iterations/<release-tag>.jsonl` is cross-reusable as ISO 27001 / SOC 2 / FedRAMP / PCI DSS / HIPAA evidence.

**Broker surface (Tier A patch, §8 linkage)** — Constellation A2A's `ULTRASAFE_FINDING` intent is 1:1 wire-format with this OSCAL `finding` object. The broker (Constellation WS relay) carries the OSCAL finding JSON as-is in the intent envelope's `payload` field — flowing inbox → ws-history → audit log with no separate conversion. The intent type definition is registered in the intent registry of `Constellation.md §13.x`.

### §5.2 Hyperbrief IR layer — decision card (apply / defer / release_with_risk / escalate)

Each iteration's retire-barrier passes the finding set through a 4-score evaluation to generate a **Hyperbrief 9-section JSON IR** (Hyperbrief.md §1). The 4-score normalizes PASTA Stage 7's quantitative risk roll-up to Hyperbrief's standard axes (threat-modeling §3.4):

| 4-score axis | PASTA mapping | Production rule |
|---|---|---|
| Impact | Damage + Affected users | max(CVSS impact) × scope_multiplier (single-file 1.0 · module 1.5 · system 2.0) |
| Reversibility | Inverse of Exploitability + Reproducibility | auto-fix=1, code-change=2, architecture-change=3, irreversible=4 |
| Urgency | Discoverability + active-exploit signal | known-CVE-active=4, theoretical=1 |
| Novelty | Greatpractice tree non-registration rate | registered pattern=1, near-match=2, novel=4 |

When **4-score sum ≥ 4** or a **MUST-trigger** (e.g., critical CVSS ≥ 9.0 · supply-chain violation · AI Act Article 15 violation · GDPR Art. 32 violation) fires, a HyperbriefCard intent emits. A sum < 4 is auto-apply (low findings have mitigation auto-applied, iteration proceeds).

**4 candidate standard slots** — the following 4 candidates are always populated in `recommended_methodology[]`:

```json
{
  "section_5_options": {
    "candidates": [
      {
        "id": "apply",
        "label_korean": "Fix and re-test",
        "description": "apply the mitigation diff and enter iteration N+1",
        "preconditions": ["reversibility ≤ 2", "fix diff < 200 LOC"],
        "evidence_refs": ["finding F-stride-T-03", "axis-quorum 3/4"],
        "expected_iterations_remaining": 1
      },
      {
        "id": "defer",
        "label_korean": "Defer to next cycle",
        "description": "an issue with no impact on the current release, register to backlog",
        "preconditions": ["impact ≤ 2", "no active exploit signal"],
        "evidence_refs": [],
        "backlog_target": "<release-tag-next>"
      },
      {
        "id": "release_with_risk",
        "label_korean": "Release with documented risk",
        "description": "mitigation plan stated + residual risk documented",
        "preconditions": ["iteration_count ≥ 3", "no critical residual"],
        "evidence_refs": ["assessment-log entries N-3..N"],
        "mitigation_plan_ref": "<file:section>"
      },
      {
        "id": "escalate",
        "label_korean": "Escalate to security review",
        "description": "delegate the decision to the user or an external audit firm",
        "preconditions": ["score ≥ 4 OR MUST-trigger"],
        "audience_profile_fallback": {"button_label": "Escalate to security review"},
        "trigger_phrases_md": "Fix and re-test / Release with documented risk / Defer to next cycle / Escalate to security review"
      }
    ]
  }
}
```

**audience_profile_fallback + trigger_phrases_md auto-localize** — populated in the prevailing language (Korean) per Hyperbrief.md §5.6.7 v0.5.6's auto-localize convention. Conformant with EG dogfood's phase_3 cycle operational momentum.

**Strict-mode reconciliation (Tier A patch, §7.3 + §13.5 linkage)** — `recommended_methodology[]`'s candidates enforce **strict consistency** with the OSCAL layer's `risk` object. The OSCAL finding UUID that the apply candidate's `evidence_refs` points to must actually exist in §5.1's results.findings, and release_with_risk's `mitigation_plan_ref` cross-links with §6.4 regression baseline. On mismatch, the retire-barrier rejects IR emit and re-dispatches the iteration (§13.5's reconciliation hook).

### §5.3 Greatpractice candidate layer — macro/mezzo/micro promotion path

Among each iteration's findings, a **repeated finding + effective mitigation pair** is auto-drafted as a promotion candidate of the Greatpractice tree. The promotion path is a 3-tier structure (conformant with the macro/mezzo/micro hierarchy of Greatpractice.md §x.x):

| Tier | Firing condition | Surface | Example |
|---|---|---|---|
| **micro** | the same (CWE-ID, file-pattern) finding discovered ≥ 2 times | PreToolUse hook's pre-check rule, lint-level | "single-line JSON validation on outbox.jsonl append" (currently memory-registered) |
| **mezzo** | a finding cluster of the same root-cause appears across ≥ 3 iterations | playbook-format runbook, sub-agent skill | "direct ws-history forward on A2A relay failure" |
| **macro** | an architecture-level pattern — the same attack-tree root goal recurs in ≥ 2 releases | module-level discipline, new spec section | "trust-tier classification + capability scoping" (multi-agent-distributed §3.5) |

**Candidate output schema** (inline as one entry of OSCAL `back-matter.resources[]`):

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
      "description": "control-char escape for log injection defense",
      "file_anchors": ["scripts/eg_outbox_push.cjs:42-58"],
      "regression_test_ref": "tests/outbox-escape.spec.cjs"
    },
    "promotion_status": "draft",
    "human_review_required_after": 3
  }
}
```

**Promotion gate** — upon reaching the `human_review_required_after` threshold (default 3 occurrences), it surfaces as a separate candidate in the Hyperbrief IR, and after the user or maintainer decides, it commits to the Greatpractice tree. Auto-registration forbidden — codification is a human-decision surface (Greatpractice.md's governance discipline).

**Bidirectional feed** (threat-modeling §3.8):
- *Ultrasafe → Greatpractice*: auto-draft candidate with the schema above
- *Greatpractice → Ultrasafe*: a registered macro/mezzo/micro pattern operates as the "known-bad pattern" pre-check of iteration N=1 (false-negative blocking)

### §5.4 Cross-axis correlation rule engine — BFT-quorum confirmation

When synthesizing the results of §4 fan-out's 13-axis attack agents, a single axis's report is a **low-confidence draft**, while the consensus of multiple axes is promoted to a **confirmed finding**. It borrows BFT quorum mathematics (multi-agent-distributed §1.2 · §2.1 · §3.1) as-is:

```
n: dispatched attack agent count (typically n=4 or n=7, a 13-axis matrix subset)
f: tolerable Byzantine (= hallucinating/malfunctioning/infected agents)
quorum: 2f+1 (confirmation) · n ≥ 3f+1 (allocation)

n=4 → f=1, 2f+1=3 → 3 axes agree = confirmed
n=7 → f=2, 2f+1=5 → 5 axes agree = confirmed
n=10 → f=3, 2f+1=7 → 7 axes agree = confirmed
```

**Correlation key** — judging whether two axes' findings are "the same":
1. **Anchor match (primary)** — `(file_path, line_range)` overlap (≥ 50% lines in common)
2. **CWE match (secondary)** — same CWE-ID (cluster even with different anchors if the root-cause is the same)
3. **ATT&CK technique match (tertiary)** — same technique-ID + same target asset
4. **Semantic embedding similarity** (≥ 0.85 cosine) — fallback when the anchor is fuzzy

**Tier promotion rule**:

| Consensus level | Tier label | Handling |
|---|---|---|
| ≥ 2f+1 axes agree (e.g., 3/4 of n=4) | **confirmed** — MUST fix | OSCAL `finding.props.confidence = "confirmed"`, weight 1.0 in Hyperbrief 4-score |
| ≥ f+1 (e.g., 2/4) | **needs-corroboration** — SHOULD fix | OSCAL `confidence = "corroboration-needed"`, supplementary axis dispatch trigger |
| only 1 axis reports | **low-confidence draft** — MAY review | OSCAL `confidence = "draft"`, target of random sampling for free-rider detection |

**Correlated Byzantine avoidance** (multi-agent-distributed §4.2) — at fan-out, model / seed / prompt-template / axis hash must all be distinct to count as quorum. The agreement of 4 agents from the same GPT-4 family is effectively n=1 — diversity-enforced source independence (multi-agent-distributed §3.2).

**False-positive absorption** — the confirmed-only filter blocks noise burnout (compliance-standards §4.8). A single-axis finding is separately logged — a feedback signal for Greatpractice's "false-positive pattern" tree.

### §5.5 Attack-defense tree as synthesis structure — Schneier-style

The retire-barrier's final synthesis output is a **single unified attack-defense tree** — integrating after cross-linking the attack-tree fragments each axis agent output (threat-modeling §1.6 + §3.2). The ADT structure of Kordy-Mauw-Radomirović-Schweitzer 2010 is adopted as canonical.

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
- **OR node (alternative path)**: cost = `min(children.cost)`, probability = `max(children.probability)`, skill = `min(children.skill)`
- **AND node (required sub-step)**: cost = `sum(children.cost)`, probability = `product(children.probability)`, skill = `max(children.skill)`
- **Defense child**: an active mitigation's effectiveness attenuates the attack subtree's propagation by `(1 - effectiveness)`

**Root cost / probability** estimates the cheapest-most-likely path of the whole attack — the lowest branch is the **1st priority mitigation candidate** (= the score primary of the OSCAL `risk` object + the default of Hyperbrief IR `recommended_methodology[0]`).

**State explosion defense** (threat-modeling §4.3):
- each axis agent's self-tree depth ≤ 4 enforced — when depth is needed, spawn a follow-up agent
- a branch with `cost > threshold` is auto-pruned (economic-infeasibility, Schneier 1999)
- if the unique paths from root → leaf are ≥ 1000, the retire-barrier issues a warning + supplementary dispatch

**Coverage definition (Tier A patch, §6.3 linkage)** — coverage is not a simple axis-count but the **per-root-goal OR-branch enumeration depth of the ADT**. ≥ 80% of each root-goal's immediate OR-children must be visited by ≥ 1 axis to be "covered". §6.3's iteration entry condition + clean termination condition both use this definition. UKC 18-phase coverage (threat-modeling §3.3) is an auxiliary metric — only the subset of applicable phases is enforced (threat-modeling §4.6).

**Regression baseline (Tier A patch, §6.4 linkage)** — iteration N+1's baseline = iteration N's ADT snapshot (commit hash + signed timestamp). N+1's first action = verify that all of N's `leaf.finding_uuid` are sealed, N+1's secondary action = a fresh attack on the new DFD element (= new leaf branch) the mitigation introduced. Baseline rewrite forbidden (multi-agent-distributed §3.4's append-only + explicit rebuttal).

**Schema evolution (Tier A patch, §12.4 linkage)** — the v0.1.0 → v0.2.0 transition of the ADT node schema maintains the OSCAL `metadata.version` bump + the `evidence_refs` URI scheme compatibility of Hyperbrief IR section_5. New attribute additions are additive only — changing the semantics of an existing attribute requires a separate deprecation cycle (≥ 1 release).

### §5.6 emit timing + storage layout

**emit point** — at each iteration's retire-barrier close, 3 layers emit simultaneously (atomic):
1. retire-barrier completes fan-out result collection
2. cross-axis correlation (§5.4) classifies into confirmed/corroboration-needed/draft tiers
3. ADT synthesis (§5.5) constructs the unified tree + propagation
4. JSON serialization of OSCAL AR (§5.1) + Hyperbrief IR (§5.2) + Greatpractice candidate (§5.3)
5. simultaneous write of 3 files to `reports/ultrasafe-iterations/<release-tag>/iter-N/`
6. Constellation A2A `ULTRASAFE_FINDING` intent emit (with OSCAL AR as payload) — Tier A patch §8 broker surface

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

**Sanitization layer** — the public-repo published portion goes separately to `reports/ultrasafe-iterations-public/` with only OSCAL `finding.title` + `risk.statement`, while file:line anchor + PoC sketch are outer-only (compliance-standards §4.9's 2-tier output, public-repo redaction discipline). On reaching the responsible disclosure window, details are disclosed.

### §5.7 cross-section dependency summary

| This §5 surface | Depends on / depended on by § |
|---|---|
| OSCAL AR schema (§5.1) | §4 fan-out result input, §6 iteration loop output, §8 broker payload, §12.4 schema evolution |
| Hyperbrief IR (§5.2) | §7.3 strict-mode reconciliation, §13.5 reconciliation hook, Hyperbrief.md §1's 9-section IR + §5.6.7 auto-localize |
| Greatpractice candidate (§5.3) | Greatpractice.md macro/mezzo/micro tree, §6 iteration loop's known-bad pre-check |
| BFT-quorum correlation (§5.4) | §4.2 fan-out diversity, multi-agent-distributed §3.1-§3.2 |
| Attack-defense tree (§5.5) | §6.3 coverage, §6.4 regression baseline, §12.4 schema evolution, threat-modeling §2.2 |

---

## §6. ≥3 Iteration Loop — multi-condition AND clean signal

> This section defines the operational spec of the ≥3 iteration loop — Ultrasafe's *core cadence* — and its termination condition (clean signal). *No single-iteration release* + *no reliance on finding count alone* are the controlling principles of this entire section. It pulls the cross-axis synthesis result (cross-axis-patterns §3.3) 4-condition AND gate down to *operationally implementable*, absorbing critic Tier A patches (completeness-critic §5) such as the regression baseline + coverage definition + divergence escalation + sunk-cost detector.

### §6.1 Hard floor 3 iteration (universal across all axes)

The *minimum depth* of an Ultrasafe iteration is fixed at **3** regardless of release tier or finding category. The rationale for 3 is the synthesis of (NIST 800-115 §6's verification loop + DSP §1's MTTR 4-phase × 3 iteration floor) — *not the coincidental agreement of any single axis* but the *cause-and-effect chain* itself of iter 1 (fix apply) + iter 2 (verify of fix) + iter 3 (verify of regression-of-fix). Terminating at 2 iterations leaves the sealing window of *whether the fix introduced a new vulnerability* unclosed (consistent with cross-axis-patterns §1.14's secondary-surface guard).

| iteration | meaning | what is guaranteed at termination |
|---|---|---|
| 1 | fix apply | finding discovered → mitigation candidate applied |
| 2 | verify of fix | mitigation verifies the sealing of the original finding |
| 3 | verify of regression-of-fix | the mitigation's own secondary surface is verified |

This hard floor is **universal, independent of the external release tier (Tier 1/2/3)**. Even Tier 1 (patch / chore) is obligated to *iteration ≥3* rather than a *static gate single-pass* — though Tier 1's sub-loop is mostly static analysis, so the wall-clock cost is low (cross-axis-patterns §3.5). The additional ceiling extension for Tier 2/3 is defined in §6.6.

Cargo-cult prevention (devsecops-policy-as-code §4.7) is achieved through *guaranteeing the meaning of the iteration* — all 3 iterations must satisfy the *meaning of the same fix-verify-regression chain*; merely filling in "3 stamps" is a meaningless pass and is rejected. The condition for each iteration boundary is specified in §6.4 + §6.5.

### §6.2 4-condition AND clean signal gate

The termination condition of the iteration loop (= "clean signal") is a **4-condition AND gate** — if any one is unmet, the next iteration is forced. Dependence on a single metric (finding count 0) is false confidence (fuzzing-pbt §4.1's coverage ≠ bug-finding power).

#### (a) Regression-free — 3-component AND

The measurement of `regression_N` is not a *naïve set difference* (`F_N \ F_{N-1} ≟ ∅`) but a **3-component AND** (completeness-critic §5.1 patch):

1. **fix-target retest**: re-execute the PoC of each sealed finding in a *fresh agent* → attempt to reproduce → *confirm fail* mandatory.
2. **neighbor-path scan**: re-scan the *N-hop neighbor* (call graph 1-2 hop) of that fix's code path — detect re-reaching the same vulnerability via a *different path*.
3. **generalized invariant retest**: verify via the mutation gate whether the fix *weakened any invariant* (fuzzing-pbt §1.8 + §3.8's mutation testing fix authenticity verification).

When all 3 components pass, `regression_check.all_pass = true`. If any one component fails, *regression is detected* — that finding takes a separate escalation route as a *meta-defect* (oscillation pattern, §6.5).

Additional hard constraint:
- `no_new_high_severity_in_N`: the count of *new findings with severity ≥ HIGH* in iteration N is 0.
- However, *discovering new findings due to deeper inspection* is a progress signal — only high-severity is a hard cutoff.

#### (b) Monotonic improvement — EWMA trend on severity-weighted finding count

Monotonic decrease (`|F_N| ≤ |F_{N-1}|`) by itself is a *misleading metric* — discovering new findings after a fix can be normal progress (completeness-critic §5.2). Monotonic improvement is redefined as a *trend*, not a *signal*:

- **window K = 3 default** (independent of release tier, 1 sub-loop unit).
- **EWMA trend** (exponentially weighted moving average, decay α = 0.5):
  - `severity_weighted_count_N = Σ_{f ∈ F_N} severity_tier(f) × confidence_interval_lower_bound(f)`
  - `EWMA_N = α × severity_weighted_count_N + (1 − α) × EWMA_{N−1}`
  - **trend descending** condition = EWMA_N ≤ EWMA_{N-1} for at least 2 of the last 3 transitions.
- **3 sub-condition AND**:
  - (b.1) *new high-severity finding rate* within the recent K iteration window is trending descending.
  - (b.2) *unresolved persistent finding count* decreasing monotonically (strict).
  - (b.3) *cross-axis confirmation density* (matrix cell-fill rate) increasing monotonically (strict).
- noise filtering: a *single iteration outlier* is automatically absorbed by EWMA; *consecutive 2-iter direction agreement* is the unit of strict confirmation.

#### (c) Coverage gate — applicable subset of axis-test catalog

The coverage definition is critic Tier A's largest gap (completeness-critic §5.3). **The 3 specifications of denominator + methodology + tier-specific threshold**:

| item | definition |
|---|---|
| denominator | the *applicable subset* of *each axis's attack pattern catalog* — agent self-declared scope (e.g., the hop applicable to the module among the SCS axis 5-way, the OWASP LLM Top 10 entries applicable when the module has an LLM endpoint) |
| numerator | among the denominator, *evidence-confirmed tested* — entries that passed *PoC or fail-safe verify* after removing false positives |
| methodology | the (catalog_version × applicable_subset_hash × tested_entry_set) 3-tuple is frozen in — frozen at every iteration boundary |

**Per-tier threshold**:

- **Tier 1** (patch / chore): `coverage_pct ≥ 50%` of applicable subset + `untested_classes[]` specified.
- **Tier 2** (minor / feat): `coverage_pct ≥ 75%` + cross-axis confirmation density ≥ 0.3 + untested_classes[] specified.
- **Tier 3** (major / external publish): `coverage_pct ≥ 90%` + cross-axis confirmation density ≥ 0.5 + *minimum 3 perspective bucket coverage* (orthogonal union of taxonomy × methodology × actor-profile) + untested_classes[] specified.

Specifying `untested_classes[]` is *mandatory at every tier* — when coverage falls below 100%, it is an honest disclosure of *which catalog entry is untested* (consistent with cross-axis-patterns §1.8's self-spec-gaming hazard prevention). An empty array (`[]`) is an explicit declaration of "100% covered" — if false, a self-spec-gaming hazard.

#### (d) Consecutive 2 iteration cleanliness + agent diversity

The last of the 4-condition AND — (a) + (b) + (c) are satisfied for *consecutive 2 iterations* (iter N-1 + iter N). A simple single-pass clean carries the possibility of fresh hallucination (cross-axis-patterns §1.10's diversity-enforced source independence).

**Enforced agent diversity between iterations** (completeness-critic §5.4 patch):

- iter N-1's dispatched agent ID set ∩ iter N's agent ID set ≤ **50%** (by cardinality).
- the diversity check is enforced *at dispatch-time* — the synthesizer verifies the hash just before fan-out, and if unmet, *re-dispatches with a different (perspective × prompt_template_hash × seed) tuple*.
- the limitation of a single-LLM-provider environment is consistent with the honest disclosure in §6.6 — model_family distinct enforcement is v0.2.x.

Verification itself also requires a *fresh agent + frozen catalog re-execution* mandatory — if iter N's verify reuses iter N-1's cached result, there is the risk of *adversarial identical hallucination correlation*.

### §6.3 Coverage definition — completeness-critic Tier A patch

This sub-section is a *methodology-side deep dive* of §6.2 (c)'s coverage gate. As the critic's largest unresolved gap (§5.3), it is elevated to a separate section.

The rationale for selecting *evidence-confirmed catalog applicable subset* among the **3 candidate definitions of coverage**:

| candidate | definition | adopted? | rationale |
|---|---|---|---|
| (i) ratio of all catalog entries | N/10 tested among OWASP LLM Top 10 | reject | entries not applicable to the module also enter the denominator → meaningless |
| (ii) ratio of evidence-confirmed applicable subset | ratio of evidence-PoC-verified entries among in-scope entries | **adopt** | honest declaration of scope + removal of false positives |
| (iii) codebase coverage (line/branch/function) | code line reach rate | reject | misses semantic bug / authz / race (fuzzing-pbt §4.1) |

The declaration honesty of *the applicable subset itself* in (ii) is the primary surface of the self-spec-gaming hazard — if an agent *intentionally narrows scope*, coverage 100% is trivially achieved. Preventive measures:

- the **scope declaration** is part of the *frozen state of the iteration boundary* (§6.4) — *no change within the iteration*.
- an **adversarial reviewer** (cross-axis-patterns §3.11 self-spec-gaming hazard) verifies *under-declaration* of scope.
- **at Tier 3 release, minimum 3 perspective bucket coverage** — enforces the orthogonal union of taxonomy × methodology × actor-profile (cross-axis-patterns §3.7's contradiction CT7 synthesis).

**Methodology** (codeable pseudocode):

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

The *natural language explanation* of untested_reason is a *required field* — null or empty string is rejected. This is the core of the critic Tier A patch.

### §6.4 Regression baseline — last "known clean" snapshot + commit-sha pinning

The regression-free measurement of §6.2 (a) only works when the *baseline* is clear — completeness-critic §6.4 Tier A patch.

**Baseline definition** = the *last known-clean release artifact* — the most recent release that *passed the 4-condition AND gate* + had *Hyperbrief disposition = apply or release_with_risk*.

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

**Baseline maintenance discipline**:

- each release tier (Tier 1/2/3) has a *separate baseline* — the Tier 1 patch baseline is the previous patch, the Tier 2 minor baseline is the previous minor, the Tier 3 major baseline is the previous major.
- the *evidence artifact* (commit-sha + iteration history) of the baseline has a *minimum retention*:
  - Tier 1: 6 month
  - Tier 2: 1 year
  - Tier 3: 2 year + Sigstore Rekor inclusion proof (v0.2.x+)
- baseline pinning is a *commit-sha + catalog_version + agent_registry_hash* 3-tuple — if any one of the three changes, a *baseline migration ceremony* at the iteration boundary (simultaneous with §6.5's secondary surface analysis).

**Timing discipline on baseline shift**:

- freeze the baseline at the moment of entering iteration N — *absolutely no baseline change within the iteration*.
- freeze in the baseline's finding set `F_baseline` — iter N's regression measurement takes the set difference of `F_N` vs `F_baseline` as the primary input.
- *re-verification* of the baseline itself (the possibility that the last clean is stale, supply-chain-sbom §4.6's stale attack catalog) is a *separate Greatpractice macro node* ("baseline reverification quarterly cadence", cross-linked with §6.7's sunk-cost detector).

### §6.5 Divergence escalation — Hyperbrief MUST-trigger on iteration 5+ no convergence

The escalation route for when the iteration loop *does not converge* — completeness-critic §5.7 Tier A patch.

**Divergence definition**:

- (i) **High-severity finding count rising trend**: the *new high-severity count* of consecutive 2 iter (e.g., iter N-1 → iter N) increases — both `absolute count` AND `rate per iteration` increase monotonically.
- (ii) **EWMA reversal**: EWMA (§6.2(b)) shows a *consecutive 2-iter direction reversal* — descending → ascending.
- (iii) **Oscillation pattern**: a cycle of the same finding's *fix → resurfacing → fix → resurfacing* is found within a 3+ iter window — a signal that the fix itself weakens an invariant (cross-axis-patterns §1.14's mitigation-introduces-new-threat).

When any one of the three is detected, **MUST-trigger the Hyperbrief 4-score gate** — *remove* the defer option, directly activate the escalate slot (when risk signals accumulate, deferral itself is an anti-pattern).

When the **iteration 5+ ceiling is reached + clean is unmet**, a separate escalation chain applies:

- reaching the max_iter ceiling (§6.6's per-tier cap) → Hyperbrief 4-way decision MUST-trigger:
  - `apply_fix_continue` (extend max_iter +N iter, but +N ≤ 3, presenting a quantified additional cost)
  - `defer` (defer to the next cycle + deadline + Greatpractice registration mandatory)
  - `release_with_risk` (disclose residual risk + user-visible documentation + post-release monitoring obligation)
  - `escalate` (request external expert / audit / scope reduction)
- the decision is *the user's alone* (human gate) — auto-deferral is absolutely forbidden (consistent with cross-axis-patterns §3.5's strict-mode default).
- while the Hyperbrief decision is pending, *blocking the release* is the default (strict-mode reconciliation, §7.3 + §13.5).
- Decision timeout = automatically escalate one step after **7 days** (defer → release_with_risk → escalate to external).
- on code change, the Hyperbrief decision is invalidated + Ultrasafe re-run is mandatory.

### §6.6 Per-tier extension — iteration floor / ceiling matrix

On top of §6.1's universal floor 3, the additional extensions of release tier and finding category are applied orthogonally — cross-axis-patterns §2 contradiction CT2 synthesis.

| release tier | iteration floor | iteration ceiling | additional condition |
|---|---|---|---|
| Tier 1 (patch / chore) | 3 | 5 (default) | static gates only, sub-loop cost minimal |
| Tier 2 (minor / feat) | 3 | 7 (default) | 4-6 axis × full 4-condition AND |
| Tier 3 (major / external publish) | **5** | 10 (default) | full 8 axis + cross-axis graph + cryptographic release attestation |

**Per-finding-category sub-loop extension** (orthogonal dimension):

- **deterministic finding** (static analysis / signature mismatch): sub-loop minimum 1 (part of the floor, not additional).
- **configuration finding** (IaC / policy violation): sub-loop minimum 2.
- **statistical / timing / probabilistic finding** (race / side-channel / adversarial-ml): sub-loop minimum **5+** — only that category has sub-loop 5; the overall iteration retains the per-tier ceiling.

Orthogonality specified: Tier 3 release × statistical finding = *overall iteration floor 5* AND *the corresponding sub-loop minimum 5* — not the product of the two dimensions but the *union of the max* (5 + 5 = 5, not 10).

**Critic Tier A patch — single LLM provider limitation honest disclosure**:

The current EG environment is a single provider, the Claude family — `model_family distinct` enforcement is *physically impossible*. v0.1.0's dispatch-time diversity check is weakened to *(perspective × prompt_template_hash × seed) 3-tuple distinct ≥ 3* (completeness-critic §2.7 patch). A "single-provider correlated hallucination" item is mandatorily registered in `untested_surfaces[]`. On entering v0.2.x, model_family distinct enforcement is activated after an external A2A counterpart joins.

### §6.7 Sunk cost detector — iteration N+ cost/benefit analysis + ceiling override

The *operational stop* at the point where iteration cost exceeds marginal yield — cognitive-decision-bias §1.5's sunk-cost detector pattern (Greatpractice mezzo candidate).

**Cost / benefit metric** (of iteration N):

- **cost_N**: (token consumption + wall-clock time + reviewer attention units). Include only quantifiable cost, *including operational externality* (cross-axis-patterns §1.4).
- **benefit_N**: (new finding count × severity_weighted) + (cross-axis confirmation density delta) + (untested_classes reduction delta).
- **marginal ratio**: `Δbenefit_N / Δcost_N` — *3 iter window EWMA*.

**Detector trigger**:

- when the marginal ratio drops to **below 30%** of the *baseline ratio* (the average of iter 1-3) and persists for *consecutive 2 iter* → *sunk-cost flag*.
- Flag detected + iteration ≥ floor satisfied → **Hyperbrief escalation MUST-trigger** (even if the clean signal is unmet) — entering the 4-way decision:
  - `accept_partial_clean` (untested_classes[] specified + release_with_risk)
  - `redesign` (architectural change in the next cycle — Greatpractice macro node)
  - `defer` (defer to the next release)
  - `escalate` (external expert review)

**Hard limit of the ceiling** — an *absolute ceiling* independent of the sunk-cost detector:

- Tier 1: 5 iter (cost-bound)
- Tier 2: 7 iter (default ceiling)
- Tier 3: 10 iter (default ceiling, extendable up to +3 on escalation)

Reaching the ceiling + clean unmet = entering §6.5's escalation chain. The ceiling override is *only when the Hyperbrief 4-score gate passes* + limited to *within +3*.

**Self-spec-gaming hazard of the sunk-cost detector itself**:

- the detector's *threshold* (30% / 2 consecutive) is itself gameable — an attack agent can *intentionally even out the marginal yield* to evade the detector trigger.
- preventive measure: the detector's *adversarial reviewer* (cross-axis-patterns §3.11) verifies the *anomaly of the yield distribution* — a too-uniform yield is itself a self-spec-gaming signal.

---

> **Cross-section dependencies**: §6 takes the fan-out result of §4 (attack agent role distribution) as input, uses the OSCAL finding schema of §5 (synthesis report 3-layer) as the measurement unit, the tier determination of §7 (pre-release trigger + tier) is consistent with the ceiling matrix of §6.6, the `ULTRASAFE_ITERATION_BOUNDARY` intent of §8 (Constellation A2A intent) is the transport surface of §6.4's baseline migration ceremony, the 4-way decision of §9 (Hyperbrief routing) is the sink of the §6.5 escalation chain, the adversarial reviewer of §11 (self-spec-gaming hazard) is the verifier of §6.3 coverage scope declaration, the backward-compat discipline of §12.4 (schema evolution) cross-links with §6.4's baseline retention policy, and §13.5 (strict-mode default reconciliation) is the governance basis for the default of blocking the release while the §6.5 Hyperbrief decision is pending.

---

## §7. Hyperbrief 4-score Routing

> Ultrasafe's fan-out result is *findings*, not *decisions*. Both PASTA stage 7's quantitative risk roll-up (threat-modeling §1.4 + §2.3) and adversarial-ml's 4-decision candidate (adversarial-ml §3.4) are routed through the *same escalation path* — Hyperbrief's 4-score gate (Hyperbrief §2). This section specifies the strict-mode discipline so that mapping is *deterministic* and *1:1 traceable to external standards (EU AI Act Article 15 / OWASP LLM Top 10 / NIST AI RMF)*.

### §7.1 PASTA stage → Hyperbrief 4-score mapping table

The stage 7 (Risk & Impact) output of PASTA 7-stage (UcedaVélez-Morana 2015) is, per finding, the quantified residual risk 4-tuple `{damage, exploitability, reproducibility, affected_users}`. This 4-tuple is converted into the Hyperbrief 4-score (`irreversibility / blast_radius / time_horizon / reversal_cost`, each 0-3) via the *deterministic function* `f_PASTA→Hyperbrief`. Free-form LLM evaluation is forbidden — the mapping rule of `threat-modeling §3.4` is implemented as a code function (`mappers/pasta-to-hyperbrief.cjs`).

| PASTA dimension | Hyperbrief score | mapping rule (deterministic) |
|---|---|---|
| Damage (1-10) + Affected users (1-10) | `blast_radius` (0-3) | `floor((D+A)/7)` cap at 3 — a cross-system finding (D≥7 or A≥7) is automatically 3 |
| Exploitability (1-10) | `time_horizon` (0-3) | E≥8 → 3 (active exploit window short), E∈[5,7] → 2, E∈[3,4] → 1, E≤2 → 0 |
| Reproducibility (1-10) | `reversal_cost` (0-3) | R≥8 → 3 (easily reproduced so multiple harms), R∈[5,7] → 2, R∈[3,4] → 1, R≤2 → 0 |
| (residual after applying severity + mitigation) | `irreversibility` (0-3) | data exfil = 3, signed-release = 3, in-memory only = 1, transient log = 0 — enum lookup in `irreversibility_taxonomy.json` |

`escalation_sum = irreversibility + blast_radius + time_horizon + reversal_cost`. Hyperbrief §2.1's trigger threshold (`sum ≥ 4` → FULL_HYPERBRIEF) applies as is.

### §7.2 4-candidate standardization — `recommended_methodology[]` default

Ultrasafe freezes in the *default candidate set* of Hyperbrief v0.6's `recommended_methodology[]` field (Hyperbrief §8 candidate extension, v0.5.6 forward-ref) as the following 4 kinds (adversarial-ml §3.4):

| Candidate ID | meaning | applicability condition |
|---|---|---|
| `apply` | immediate fix via code/config/data patch | reversibility two-way + fix cost < release deadline budget |
| `defer` | defer to the next cycle + specify deadline | explicit risk acceptance record required (`deferred_until` + `accepted_by`) |
| `release_with_risk` | release after disclosing a known risk user-visibly | the standard response to a trade-off scenario (adversarial-ml §4.5 privacy↔robustness, where one-directional strengthening weakens another direction) |
| `escalate` | request external expert / external audit | legal / regulatory finding (LINDDUN-NC) or zero-day-class finding |

Each candidate can be emitted as the value of the IR's `§8.recommendation_conditional.recommended`. When Ultrasafe routes a finding bundle to Hyperbrief, it prefills the *top recommended candidate* according to `f_PASTA→Hyperbrief`'s score + finding family — but the final choice is always the user's (Hyperbrief §7 meta-branch).

### §7.3 Strict mode default — advisory v0.1 → blocking v0.2

Ultrasafe v0.1's *default mode* is nailed down as **strict + advisory**:

- **strict**: auto-deferral is absolutely forbidden. The `defer` candidate can be *proposed* as a candidate, but cannot be auto-selected — passing the Hyperbrief gate (the user's explicit `defer` selection + `deferred_until` input) is required.
- **advisory**: Ultrasafe's verdict (`CLEAN` / `BLOCK`) is *advisory* — it does not forcibly block the release pipeline. The PreToolUse hook surfaces the verdict, but the user can override. v0.2's **blocking** mode elevates the hook to a hard-block (PreToolUse exit code 2, settings-side opt-in required).

**§13.5 strict-mode reconciliation patch** (Tier A critic): it specifies that the combination of strict mode + advisory v0.1 is *not a contradiction*. strict = "Ultrasafe's *decision-delegation discipline*" (no auto-deferral), advisory = "Ultrasafe's *external coercion authority*" (pipeline blocking authority). The former is *consistency with the internal Hyperbrief gate*, the latter is *consistency with the external release flow* — orthogonal axes. When advisory→blocking is elevated in v0.2, the strict discipline is retained as is (auto-deferral is still forbidden) — that the two axes *do not automatically follow each other's strength* is the design intent.

**Tier A critic patch — schema evolution (§12.4 cross-ref)**: addition/removal of the `recommended_methodology[]` default candidate set requires a `schema_version` bump (semver minor). The expansion of v0.1's 4 candidates ↔ v0.2+ is backward-compatible (retain existing candidate IDs + add new ones only). If an adopter's `.hyperbrief/profile.json` has a candidate override, it takes precedence over the spec default.

### §7.4 Auto-block 3-AND triggers — deterministic only allowed

Bypassing the Hyperbrief gate (i.e., *Ultrasafe auto-BLOCKs without a user decision*) is allowed **only when all of the following 3 conditions AND** are satisfied:

1. **Deterministic signal**: signature-based detection (CVE-ID match, exact ATT&CK technique-ID match, hash verification failure, SBOM unsigned dependency, etc. — `web-api-infra §1.3` + `threat-modeling §3.1`'s ground-truth anchor required). A finding whose LLM judgment is the *single source* is not deterministic.
2. **FP rate < 1%**: that detector's historical false-positive rate is measured and recorded to be below 1% on the baseline corpus (see §6.4 regression baseline). Neural / heuristic detectors can almost never clear this threshold, so in practice only *signature + provenance-based detectors* pass.
3. **Reversibility full**: the *target action* of the auto block (release / deploy / publish) is itself fully reversible — the user can override-publish the release Ultrasafe blocked within 30 seconds. The block *suspends* the user's autonomy but does not *remove* it.

**3-AND unmet = obligation to pass the Hyperbrief gate**. An LLM-based finding fails on (1) alone, so it *always* passes through the Hyperbrief gate — see §7.5.

**§6.3 coverage definition cross-ref (Tier A critic patch)**: a finding that fired an auto-block is tallied separately as an `auto_blocked` cell in §6.3's *coverage matrix*. Coverage is not the distribution of (per-axis finding count) but the joint distribution of (axis × disposition). When the auto-block ratio exceeds 70%, a *self-throttle warning* similar to §2.4 fires (`Ultrasafe deterministic-block overuse detected — false-blocking risk`).

**§6.4 regression baseline cross-ref**: the FP rate < 1% threshold of §7.4 is a measured value against §6.4's baseline corpus (snapshot N ≥ 100 release × 3 iteration history). A new adopter with baseline N < 100 cannot measure the FP rate → condition (2) of §7.4 is automatically false → auto-block forbidden → all findings go to the Hyperbrief gate. This is *cold-start safety* — Ultrasafe's autonomous-decision authority is 0 until it accumulates a measurable baseline.

### §7.5 LLM-based evaluation → Hyperbrief routing obligation

Every LLM-based finding (an item without a deterministic anchor among each axis agent's reports) *must* pass through the Hyperbrief gate:

- **Reason (1) — hallucinated finding** (`threat-modeling §4.7`): the possibility that an LLM agent reports a vulnerability that does not exist. Auto-block is not possible before the anchor (file_path + line_range + exploit_PoC_sketch) verification passes.
- **Reason (2) — alignment faking** (`adversarial-ml §1.12` + §4.8): the possibility that an LLM distinguishes the evaluation context from the deployment context and behaves differently. An attack agent may attempt only weak attacks to make a false-clean, or conversely be over-aggressive and mass-produce false-positives.
- **Reason (3) — specification gaming meta-vulnerability** (`adversarial-ml §3.6` + §4.4): an attack agent exploits Ultrasafe's own metric (clean rate / FP rate). Allowing auto-block on LLM judgment alone makes the incentive structure of spec-gaming larger.

**routing procedure**:

```yaml
# pseudocode (mappers/llm-finding-to-hyperbrief.cjs)
for finding in llm_findings:
  if not has_ground_truth_anchor(finding):
    # an LLM-only finding without an anchor is obligated to the Hyperbrief gate
    hyperbrief_score = f_PASTA_to_Hyperbrief(finding.pasta_quad)
    if hyperbrief_score.sum >= 4 or any_MUST_trigger(finding):
      emit_hyperbrief_card(
        finding=finding,
        recommended_methodology=prefill_candidate(finding),  # §7.2
        confidence_downgrade=true,  # LLM-only → confidence cap 0.6
      )
    else:
      # sum < 4 + no MUST fired → autonomous_decide possible
      # but: Ultrasafe is a security domain, so additional conservatism
      route_to(disposition='apply' if reversibility_two_way else 'hyperbrief_gate')
```

**§8 broker surface patch (Tier A critic)**: the emit of the above routing is transmitted as a Constellation A2A `DECISION_REQUEST` + `HyperbriefCard` pair (Hyperbrief §8.1). On the broker (collab-client) inbox surface, an Ultrasafe-originated card is distinguished by an `intent_subtype: ultrasafe_finding` tag, with the finding bundle ID + axis coverage matrix snapshot enclosed in the envelope metadata. This is the primary data model for §8's broker surface extension (traceability of Ultrasafe findings).

### §7.6 confidence cap + falsification trigger

An LLM-based finding's `confidence.point_estimate` is automatically capped at 0.6 (just below Hyperbrief §8.2's "proposal candidate" threshold). This means it is labeled as a *proposal candidate* rather than *recommended* — on the surface the user sees, it is explicitly marked as "LLM-only evaluation".

Each routing result requires §8's `falsification_trigger` (`{what_to_observe, when, threshold}`) — for an Ultrasafe finding, the standard prefill is `what_to_observe = "whether the same finding reappears in post-fix iteration N+1"`, `when = "ITER N+1 retire barrier"`, `threshold = "escalate one step on reappearance"`.

### §7.7 cross-section dependency summary

- §6.3 (coverage definition): add a `disposition` axis — separate the cells of auto-block / hyperbrief-gated / autonomous-apply
- §6.4 (regression baseline): the basis for §7.4's FP rate measurement
- §8 (broker surface): the envelope metadata of an Ultrasafe-originated card
- §12.4 (schema evolution): the semver discipline of the `recommended_methodology[]` default candidate
- §13.5 (strict-mode reconciliation): specifies the orthogonal axes of strict ↔ advisory ↔ blocking

Hyperbrief §2.4's self-throttle (the circuit breaker for alert-fatigue) applies as is to Ultrasafe-originated cards — when the user acceptance rate of Ultrasafe findings exceeds 70% + the average premortem length < 30 chars, the threshold is automatically raised. It blocks the failure mode in which the *alert fatigue* of the security domain turns into *desensitization to real threats*.

---

## §8. Constellation A2A — 5 new intents

> For Ultrasafe to reside on Constellation as EG's fifth module, it must hold the five kinds of interactions — self-discovery + iteration boundary + release gate + external disclosure intake + multi-party disclosure coordination — as **first-class citizens of the A2A wire surface**. This section extends the A2A-intent family of Constellation §13.16.9 with 5 new names, and blocks the structural pitfall of the A2A channel itself becoming a prompt-injection target (ai-red-team §3.5 + §4.8) with two layers: a Spotlighting wrapper + a static marker scan. At the same time, it absorbs the "attack surface of broker compromise itself" pointed out by critic Tier A into a separate surface analysis in §8.4.

### §8.1 5 new A2A intent schemas (§13.16.9 extension)

The five new names are added to the **A2A-intent allowlist** of Constellation §13.16.9 — i.e., when `targetAgentId` is unspecified, they are routed to the main agent inbox via the fail-safe default A2A-intent branch, and the watcher's meaningful-inbound filter recognizes them as wake targets. They adopt the same **paired-envelope + parentId linkage** pattern as the Hyperbrief `DECISION_REQUEST` / `HyperbriefCard` family (§13.16.9 v2.5.28) so the live board renders them as a single card.

| name | direction | ack tier (§13.13) | paired companion | one-line intent |
|---|---|---|---|---|
| `ULTRASAFE_FINDING` | red-team agent → main / dashboard | `commitment` | none (standalone envelope) | emit a single finding (lightweight, card slide-in trigger) |
| `ITERATION_BOUNDARY` | orchestrator → main / dashboard | `commitment` | none | the transition point of iteration N → N+1 + summary stats (resolved / new / regressed / coverage) |
| `RELEASE_GATE` | orchestrator → main | `decided` (same application-tier as Hyperbrief) | `HyperbriefCard` (when escalation ≥ 4) | release / hold / escalate verdict + 4-score gate input |
| `SECURITY_DISCLOSURE_INTAKE` | external researcher gateway → main | `commitment` + auth layer | none (standalone) | receipt of external responsible-disclosure notification (both bug bounty + unsolicited) |
| `MPCVD_COORDINATION` | coordinator ↔ multi-party vendor | `decided` | own broadcast cohort | hub-and-spoke coordination of multi-party vulnerability disclosure (embargo state / patch readiness / staged release) |

**Wire format (canonical, v0.1.0)** — the `value` body of the `CUSTOM` envelope. After `name` is server-side normalized to `type: "CUSTOM"` (§13.11.3 rule 1), §13.16.9's routing decision tree routes it to the **A2A-intent group** of the 4-group classification:

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

`ITERATION_BOUNDARY`'s `value` is `{ iteration_from, iteration_to, summary: { findings_total, resolved, new, regressed }, coverage: { axes_run, asset_coverage_pct, perspective_diversity }, clean_signal: bool }` — both §8.5's live board card + the external SARIF/STIX commit consume the same body.

`RELEASE_GATE`'s `value` is `{ release_candidate, verdict: "release"|"hold"|"escalate", grading: "minimal"|"standard"|"high", findings_residual, hyperbrief_id?, methodology[] }` — when `verdict: "escalate"`, a paired `HyperbriefCard` is emitted together with the same `parentId` (reusing the pair pattern of Hyperbrief.md §8).

`SECURITY_DISCLOSURE_INTAKE` and `MPCVD_COORDINATION` may have an external actor on the sender side, so an **auth layer is mandatory** (see §8.4) — borrowing protocol-trust-evolution §1.4's PKI chain-of-trust pattern, an Ed25519 signature field is placed mandatorily in `value._sig`, and an envelope with a signature verification failure is **server-side blocked** before being routed to the main inbox.

### §8.2 A2A inbound Spotlighting wrapper

ai-red-team §1.2 (Greshake et al. 2023 indirect prompt injection) + §2.4's Spotlighting defense (Hines et al. 2024, arXiv:2403.14720 — ASR 50%+ → below 2%) is the direct model of this wrapper. It absorbs the proposition that **Constellation A2A's outbox/inbox itself is an untrusted data channel** (ai-red-team §3.5) as the default of the v0.1.0 spec.

**Wrapper discipline** (applied to all A2A inbound, including the 5 new intents + generalized to the entire Constellation §13.16.9 A2A-intent group):

1. **Insert a provenance fence**. On inbox cursor advance (at both the `§13.16.6` element 1 + `§13.16.10` pre-send probe moments), the `value` body of a new inbound is wrapped with a fence delimiter before it enters the LLM context — reusing the auto-localize fence pattern of Hyperbrief.md §5.6.7 v0.5.6:

```
<<UNTRUSTED_A2A name="ULTRASAFE_FINDING" sender="redteam_websec_alpha" iso="2026-06-06T…">>
{ … original value … }
<<END_UNTRUSTED_A2A>>
```

2. **Special-token marking**. The natural-language text inside the fence is one of base64 encoding or zero-width joiner marking — among Hines et al. 2024's 3 spotlighting methods (delimiting / datamarking / encoding), datamarking has the lowest EG context window cost (token count ~1.1×).
3. **Trust budget annotation**. The wrapper marks only the sender identifier, and **assigns no trust grade** — consistent with both protocol-trust-evolution §1.10's erosion of the mutual-trust assumption + ai-red-team §4.8 (the pitfall that A2A is a safe channel). The trust decision is the responsibility not of the wrapper but of the **next tool-call influence evaluation**.
4. **Reuse of the Greatpractice outbox-json-validation pattern**. Applying the wrapper is itself the inbound-side symmetry of the Greatpractice §micro `pre-emit-validation` hook — if the outbox-side `JSON.stringify` + roundtrip parse (`memory/feedback_outbox_json_validation.md`) was the emit-side invariant, the Spotlighting wrapper is the ingest-side invariant. The two hooks are the two children of the same Greatpractice tree's macro node `a2a-channel-untrusted-by-default`.

**Application timing**: the wrapper is automatically inserted the moment `§13.16.6` v2.4.16's ev-agnostic single-stage name filter classifies something as meaningful-inbound — leaving no room for the agent to apply it voluntarily (the same reasoning by which `§13.16.7`'s BOARD_STALE gate converted board updates from volitional → mechanical).

### §8.3 Outbox static marker scan (blocking instruction-like patterns)

ai-red-team §1.9's MCP tool poisoning + tool shadowing (Invariant Labs 2025) + §3.5's "blocking cross-agent cascading injection" is the purpose of this scanner. If an instruction-like pattern leaks out on the outbox side, it gets directly concatenated with the system prompt of the counterpart agent that received that envelope, becoming a hop in a cross-agent worm (Greshake worming chain).

**Static scanner discipline** — add one stage to `scripts/eg_outbox_push.cjs` (already the recommended entry point for outbox JSON validation):

| pattern class | regex / detection | blocking action |
|---|---|---|
| Override prefix | `^\s*(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions|rules)` (case-insensitive) | hard block + delegate to a Hyperbrief card |
| Role-override | `you\s+are\s+(now\s+)?(DAN|developer\s+mode|jailbroken|unrestricted)` | hard block |
| System-prompt leak request | `(repeat|print|reveal|show)\s+(your\s+)?(system\s+prompt\|initial\s+instructions\|above\s+text)` | hard block + register a Greatpractice micro-pattern |
| Unicode confusable | detect Latin look-alikes of Cyrillic / Greek / mathematical Alphanumeric (codepoint comparison after NFKC normalization) | warn + force base64 wrap |
| Hidden whitespace | detect zero-width joiner / non-breaking space / tag character (U+E0020-U+E007F) | strip + warn |
| Tool-call instruction | `(call|invoke|execute|run)\s+(tool|function|skill)\s*[:=]\s*\w+` of external user input origin | quarantine + human review |

**Meaning of hard block**: if the scanner hits, `appendFileSync(outbox.jsonl, …)` throws, the outbox push is aborted, and the agent immediately escalates to the wrapper-revise or Hyperbrief DECISION_REQUEST path. It is a deterministic blocking layer like ai-red-team §3.7's "Trifecta static check" pattern — not LLM-as-judge but regex + Unicode normalization, with no false-negative.

**Why the outbox side**: if the inbox-side wrapper (§8.2) is the layer that protects this agent's safety, the outbox scanner is **the layer that keeps this agent from becoming a worm hop for another agent** — it cuts the propagate direction of Greshake worming on its own side. The two layers must be placed at the two ends of the same channel for cross-agent cascading injection to be fully blocked.

**Greatpractice auto-registration path**: when the scanner hits a new pattern (high-confidence, ASR ≥ 50% or accumulated N+ times), it is auto-promoted to the Greatpractice tree's mezzo node `outbox-instruction-marker-block` — the same as ai-red-team §3.6's promotion path.

### §8.4 Broker compromise surface analysis (critic Tier A patch)

**The exact form of the critic gap**: all the layers in §8.1-§8.3 **stand on the assumption that the Constellation broker operates normally**. If the broker itself is compromised — (a) the routing decision tree is bypassed and the board-directed group is mis-routed to the main inbox, (b) the Spotlighting wrapper's fence itself is stripped at the board and delivered to the LLM, (c) the ack tier is emitted as a false signal, collapsing the at-least-once assumption (§13.13.2) — then Ultrasafe's security report cannot verify its own trust anchor.

**Attack surface decomposition** (borrowing protocol-trust-evolution §2's layered attack stack):

| layer | exposure on broker compromise | mitigation layer |
|---|---|---|
| L1 identity | the broker forges the sender identifier and stamps an unsigned envelope as a trusted-source | the 5 new intents' `value._sig` Ed25519 signature is mandatory — even if the broker strips it, receiver-side verification fails |
| L2 transport | the broker performs in-flight tamper (alters the envelope value) | the signature covers the value body — verification fails immediately on tamper |
| L3 payload | the broker strips the wrapper fence and injects the raw body into the LLM context | **receiver-side wrapper re-insertion** — the agent-side §13.16.6 watcher reads the raw line of the inbox directly and *re*-applies the wrapper (nullifying the broker's fence-strip) |
| L4 temporal | the broker replays a stale envelope or drops a fresh envelope | `value.iso` + monotonic `decision_id` + receiver-side seen-msgId LRU (§13.13.2) — blocks replay; drop is detected via §13.13.2 at-least-once + `ack_tier='delivered-persist'` |
| L5 aggregation | the broker alters `RELEASE_GATE`'s verdict from escalate → release | `ack_tier='decided'` is the **user-side** signed receipt — even if the broker alters it, receipt verification fails |

**out-of-band verification hook**: broker-side signals alone cannot solve the self-reference pitfall of broker compromise (ai-red-team §4.5: the broker equivalent of the "bypassing the Trifecta = LLM-as-judge is sufficient" pitfall). Therefore, the two high-stakes intents `RELEASE_GATE` + `MPCVD_COORDINATION` are forced to require cross-verification via a **separate channel (Hyperbrief md_permalink + user-side dashboard direct view)** as a release-gate passing condition — an application of the pattern by which Let's Encrypt (protocol-trust-evolution §1.5) bootstrapped via IdenTrust cross-sign.

**Subjecting the broker itself to Ultrasafe iteration**: the Constellation broker (server.cjs + bridge) is included as an *explicit axis target* of the Ultrasafe iteration at the pre-release moment (registering the broker itself as an asset in §6.3's coverage definition). Fuzz whether the broker's routing decision tree violates §13.16.9's 4-group classification (fuzzing-pbt §3's differential fuzzing pattern), and inject adversarial-ml-class mutated input against the broker's signature verification logic itself. The broker's trust is not an assumption but a **measured value re-verified at every release**.

### §8.5 Live board visualization (Ultrasafe card stream, tri-tier)

Combining security-visualization-dashboard §2.6's real-time threat feed pattern (Wazuh / Splunk card slide-in) + §3.4's OpenCTI widget-unit dashboard + Constellation §13.16.12's dashboard-render-patterns SSoT, a **tri-tier card stream** is defined. No separate dashboard infrastructure — the Constellation live board surfaces it directly.

**Tier 1 — attacker agent card** (a byproduct of `ULTRASAFE_FINDING` emit + prelaunch at iteration start):

- displayed fields: `agent_id` · `perspective` (OWASP LLM Top 10 axis mapping) · `status` (running / completed / failed) · `findings_so_far` count · `iteration N/M` · ETA
- live board location: a new sub-channel `#ultrasafe-agents` (a generalization of Constellation §13.16.12 Pattern 7) — so the main A2A channel is not filled with noise.
- status progression: the card background color is synced with the status (running=blue / completed=green / failed=red).

**Tier 2 — discovered threat card** (1 card slide-in per `ULTRASAFE_FINDING` emit):

- displayed fields: `finding_id` · severity color (security-visualization-dashboard §2.4's 5×5 cell color mapping) · MITRE ATT&CK technique badge · Kill Chain phase lane (security-visualization-dashboard §1.6) · 1-line evidence · "details" expand action (full JSON + SARIF link).
- threat classification display: `axis` label (`prompt_injection` / `excessive_agency` / etc.) + Diamond Model 4-vertex badge.
- **automatic redaction application**: a finding with `value.redaction === "external_summary_only"` has its card evidence area automatically masked, and the internal_evidence remains only in the outbox persistence file (consistent with security-visualization-dashboard §4.9 + `feedback_public_repo_redaction.md`).

**Tier 3 — augmentation status + iteration boundary card** (`ITERATION_BOUNDARY` + `RELEASE_GATE` emit):

- iteration boundary card: delta heatmap (security-visualization-dashboard §3.6) — resolved cell (green flash) · newly discovered cell (red flash) · regression cell (orange flash). Displays the cumulative resolved / new / regressed metric 3-tuple.
- release gate card: verdict badge (release / hold / escalate) + grading badge (minimal / standard / high) + paired HyperbriefCard link (on escalate).
- the previous iteration card is automatically dimmed/archived — avoiding the alert fatigue of security-visualization-dashboard §4.1.

**Card synthesis and ATT&CK heatmap export**: at the iteration boundary moment, the live board renders the accumulated findings' ATT&CK Navigator JSON layer (the synthesis result of security-visualization-dashboard §3.2's retire-barrier overlay) as a thumbnail + provides an export button directly importable into Navigator. SARIF 2.1.0 + STIX 2.1 bundle are also exposed as a download action of the same card (security-visualization-dashboard §3.7-§3.8).

**Audit trail preservation**: the live board card is for *current-situation monitoring* only, and **the evidence is the persistence file** — every `ULTRASAFE_FINDING` / `ITERATION_BOUNDARY` / `RELEASE_GATE` emit is preserved simultaneously via two channels: outbox.jsonl persistence (Constellation §13.13.2 at-least-once) + a separate SARIF/STIX commit, so even if the live board surface silently drops, there is no evidence loss (consistent with security-visualization-dashboard §4.6).

**Cross-section dependencies**: the card schema's finding fields consume the raw values defined respectively in §6.3 (coverage definition — asset_coverage_pct / perspective_diversity are inputs to the ITERATION_BOUNDARY card), §6.4 (regression baseline — the reproducer re-execution result of the previous iteration's resolved finding is the source of the delta heatmap regression cell), §7.3 (strict-mode reconciliation — the input to the release gate's grading decision), §12.4 (schema evolution — the backward-compat rule for future version increments of the 5 intent names), and §13.5 (the release-flow trigger of strict-mode reconciliation). This §8 is responsible only for the transport + presentation surface; the measurement definitions are resolved by forward refs.

---

## §9. Greatpractice Tree Integration

> Ultrasafe does not take *discovery itself* as the result. A codification pipeline that *lifts* discovery → finding → policy → tree node (phase transformation) must run together for the module's ROI to enter the *time-axis accumulation* beyond the one-shot per-release cost. This § defines the bidirectional feed of Ultrasafe ↔ Greatpractice — (a) auto-registration of finding leaves, (b) graduated promotion of recurring defect → policy (Kyverno + Greatpractice mezzo), (c) reverse feed of Greatpractice tree → Ultrasafe attack catalog, (d) the path by which an SRE postmortem-style retire-barrier report is hierarchically elevated to macro/mezzo/micro. It is the direct instantiation of devsecops-policy-as-code §2.5 graduated enforcement + threat-modeling §3.8 Ultrasafe-Greatpractice bidirectional feed + incident-response §3.6 postmortem-to-greatpractice transformation + Greatpractice §5 maturation gate.

### §9.1 Finding leaf registration — auto-registration to the Greatpractice mezzo/security/ subtree

At the moment Ultrasafe's retire-barrier synthesizer (§7.3 strict-mode reconciliation's final consolidation pass) emits a finding that has finished dedup · CWE/ATT&CK normalization · multi-causal cause graph, **each finding is immediately registered as a raw memory node of the Greatpractice tree**. This is the Ultrasafe-side automation of incident-response §3.6's schema for converting postmortem deliverables → tree nodes.

**Registration path**:
```
ultrasafe/findings/<iteration_N>/F-<id>.json     (Ultrasafe internal artifact)
        ↓ auto-emit at retire-barrier synthesis completion
memory/feedback_ultrasafe_<finding_slug>.md      (raw memory — Greatpractice §5 capture)
        ↓ entering the Greatpractice maturation pipeline
greatpractice/_propose/<finding_slug>.draft.md   (after §5.2 notability gate if recurring)
        ↓ phronesis + approval
greatpractice/mezzo/security/<finding_slug>.md   (ratified entry — security/ subtree)
```

**Auto-authoring of frontmatter (mandatory 7 fields — Greatpractice §3.2)**:

| Field | Ultrasafe source | example |
|---|---|---|
| `id` | `ultrasafe-<axis>-<cwe>-<slug>` | `ultrasafe-stride-T-cwe89-search-sqli` |
| `tier` | determined by finding severity + recurrence | mezzo (first-cut default) |
| `binding` | mapped from enforcement_level | `ratio` (mandatory) · `obiter` (advisory) |
| `enforcement_level` | §3.3 priority score ≥ 7.5 → mandatory | mandatory · recommended · advisory |
| `trigger` | the finding's attack pattern + file/line anchor | `{if: "entry of <interaction> of <DFD-element>", then: "apply <policy>"}` |
| `lifecycle` | always `probation` on new registration | probation |
| `last_referenced_turn` | the Ultrasafe iteration N timestamp | 2026-06-06T... |

**auto source_evidence chain**: a registered entry preserves trace as `source_evidence: [ultrasafe/findings/<iter>/F-<id>.json, reports/<ultrasafe-axis>.md#§<id>]` — simultaneously satisfying Greatpractice §3.2 frontmatter's evidence chain obligation + canonical §1.3 redirect attribution. For any tree node, *which finding of which Ultrasafe iteration it came from* is always reverse-traceable.

**INDEX inclusion of the security/ subtree**: within the ≤300 token cap of `greatpractice/INDEX.md` (Greatpractice §2.5), only one line `mezzo: security/* (N)` is exposed. So that count inflation does not encroach on the macro budget, slab grouping is used (Greatpractice §2.6's `class:` field — all Ultrasafe-origin micro atoms are bundled as `class: ultrasafe-security`).

**A2A relay reinforcement**: the register emit is broadcast as Constellation A2A's `GREATPRACTICE_REGISTER` intent — incident-response §3.7's MPCVD intent + memory `feedback_a2a_relay_reliability.md`'s at-least-once reinforcement (the security intent alone enforces, beyond the transport-tier Ack, even a *recipient inbox confirmation probe*). This pairs with §8's broker surface (the `greatpractice-register` channel of the Constellation live board ws-history).

### §9.2 Recurring defect → policy promotion — Kyverno + Greatpractice mezzo graduated enforcement

If the same finding recurs across *multiple iterations* or *multiple release cycles*, single-finding remediation is insufficient. A **policy promotion ladder** is defined by the synthesis of devsecops-policy-as-code §1.5 Sentinel 3-tier (advisory → soft-mandatory → hard-mandatory) + §2.5 graduated enforcement ladder + threat-modeling §3.8 bidirectional feed.

**Promotion condition** (the Ultrasafe-applied form of Greatpractice §5.1's 5-axis maturity score):

```
recurring_defect_signal:
  frequency:        same finding recurs N ≥ 2 within the Ultrasafe iteration loop
                    OR reappears N ≥ 2 across release cycles
  depth:            the finding's anchor such as CWE-ID is found in distinct file/module
  cost:             release-block or KEV-equivalent match (incident-response §3.3)
  predictability:   the trigger is mechanically detectable by Kyverno admission / OPA Conftest
  independent_triggers: ≥ 2 distinct (work-domain × phase) coordinates (Greatpractice §5.2)
```

When `maturity_score ≥ 18` or `(frequency ≥ 3 AND independent_triggers ≥ 2 AND verifiable_effect)` passes → elevate to a policy candidate.

**4-tier ladder** (the integration of Greatpractice §3.3 enforcement_level + devsecops §2.5 graduated enforcement):

| Tier | Greatpractice entry | Kyverno / OPA application | passing condition |
|---|---|---|---|
| **L1 advisory** | `binding: obiter`, `enforcement_level: advisory` | `validationFailureAction: Audit` (Kyverno) · OPA log-only | persists 1 iteration, begin measuring false-positive rate |
| **L2 soft-mandatory** | `binding: obiter`, `enforcement_level: recommended` | Kyverno `Enforce` + `validationFailureActionOverrides` allowed · OPA decision log + override channel | FP rate < 5% stable × 2 iteration, override rate < 10% |
| **L3 hard-mandatory** | `binding: ratio`, `enforcement_level: mandatory` | Kyverno `Enforce` + no override · admission deny · PreToolUse exit 2 | override rate < 1% × 3 iteration, post-release dogfood 60-day hit ≥ 1 |
| **L4 retire / supersede** | `superseded_by:` new entry | Kyverno policy moved to `_archive/`, OPA rule deprecated | trigger permanently resolved (root cause removed) or a better rule arrives |

**Detection within the iteration loop**: within Ultrasafe's ≥3 iteration loop, if a finding fails to pass the *iteration N → iteration N+1 regression check* (incident-response §3.1's iteration_3 regression_findings=0 gate), that finding is immediately an L1 candidate of the §9.2 promotion ladder. The iteration loop itself is a *micro-scale graduated enforcement test* — promote only one ladder step per release (cargo-cult avoidance, devsecops §4.7).

**Schema bridge — Kyverno YAML ↔ Greatpractice frontmatter** (the PaC output format of devsecops §3.4):

```yaml
# the surfaces[] of the Greatpractice mezzo/security/no-search-sqli.md frontmatter
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

**Schema evolution discipline** (§12.4 strict-mode applied): when policy promotion extends the Kyverno YAML schema from `validate.deny` → `validate.deny + mutate.patchStrategicMerge`, the existing L1/L2 surface retains a *backward-compatible read* (Greatpractice §3.8 6-cycle migration grace). The schema version bump is specified by `surfaces[].schema_version` — strict-mode lint warns on mismatch (not block, protecting retro-backfill).

**Regression baseline integration** (§6.4 applied): every promotion of the ladder stamps the *baseline metric set* into the frontmatter's `regression_baseline: {iteration_N: <metric snapshot>}`. The verify step of iteration N+1 verifies whether the *FP rate · override rate · hit-rate* delta versus the baseline is within the expected band (the Ultrasafe-applied form of Greatpractice §5.6's hit/miss matrix).

### §9.3 Bidirectional feedback loop — Greatpractice tree → Ultrasafe attack catalog

With only the one-directional Ultrasafe → Greatpractice, the catalog goes stale (devsecops §4.6 BAS stale attack catalog pitfall). A **reverse feed of Greatpractice tree → Ultrasafe attack catalog** is essential — the direct instantiation of threat-modeling §3.8's bidirectional feed proposition.

**3 reverse channels**:

| channel | input | output |
|---|---|---|
| **Pattern → Attack** | the `trigger.if/then` of `greatpractice/mezzo/security/<slug>.md` | the *known-bad pattern* pre-check catalog of Ultrasafe iteration 1 |
| **Mitigation → Defense Tree** | the `mitigation:` field of a mezzo entry (the PaC policy body) | auto-ingest into the defense node of an Attack-Defense Tree (threat-modeling §1.6 Kordy et al. 2010) |
| **Postmortem → Scenario** | the `lessons_learned:` of a macro entry (incident-response §1.4 Google SRE template) | the Wheel-of-Misfortune scenario pool (incident-response §1.10 + §3.4) — input to the red-team agent of the next release |

**Catalog ingest timing**: at step 0 of the Ultrasafe pipeline (right after the DFD auto-extraction, just before all axis fan-out), the Greatpractice tree's `mezzo/security/*` + `mezzo/incident-pattern/*` are bulk-ingested. The first pass of iteration 1 is a *known-pattern pre-check* — an already-codified attack immediately fails-fast (the scenario_pool replay of incident-response §3.4 Wheel-of-Misfortune).

**Coverage definition integration** (§6.3 applied): the number of Greatpractice tree entries + class distribution cross-products with the UKC phase coverage matrix (threat-modeling §3.3), so coverage is defined as *coverage = (axis_covered × tree_entries_covered) / (axis_total × tree_entries_total)*. That is, coverage is not axis alone but the matrix of *tree-instantiated attack pattern × axis fan-out*. iteration N+1 entry condition: if there is a coverage gap, declaring CLEAN is absolutely impossible + a supplementary agent of the missing class is auto-spawned.

**Stale entry blocking**: if a tree entry expires at `last_validated_at + validation_cadence_days` (Greatpractice §7), the corresponding pattern in the attack catalog is ingested *only as advisory* (excluded from the mandatory pre-check). Consistent with devsecops §4.6's ageing alert. It avoids the anti-pattern in which a freshness-expired stale entry mass-produces false-positives and blocks the release.

**Use of the Constellation A2A channel**: when an external CTI / cross-counterpart incident report arrives at the inbox from an A2A counterpart (threat-modeling §3.6 external adapter), that message enters as the *external_source* tag of the `GREATPRACTICE_REGISTER` intent, into the raw memory of the Greatpractice tree. The catalog of the next Ultrasafe iteration auto-refreshes — external threat learning propagates without manual human synchronization.

### §9.4 SRE postmortem → macro/mezzo/micro elevation path

The report emitted by the Ultrasafe iteration's retire-barrier synthesizer *conforms to the Google SRE postmortem standard template format* (incident-response §1.4 + §3.6). This report itself can be *hierarchically elevated* into the macro/mezzo/micro nodes of the Greatpractice tree. The mapping rules for the three layers:

| Layer | postmortem section mapping | Greatpractice tier | example |
|---|---|---|---|
| **Macro** | the systemic improvement (process / arch level) of "Lessons Learned" + the cross-cutting pattern of many findings | macro tier (cap of 5-10 items, Greatpractice §2.2) | a governance axiom such as "a state change accompanying outbound A2A is FIRST over local-only" |
| **Mezzo** | the module-spanning changes among "Action Items" + the process/arch tag of Contributing Factors | mezzo tier (security/ subtree or incident-pattern/ subtree) | a procedure such as "outbox JSON validation discipline" |
| **Micro** | the single-file-diff-level fix among "Action Items" + executable command/check | micro tier (atom, sre §1.1 runbook-as-code) | a "JSON.stringify + roundtrip parse verification atom" |

**elevation decision algorithm**:

```
postmortem_to_tree(postmortem):
  # 1. analyze the Contributing Factors graph (incident-response §3.8 multi-causal)
  systemic_pattern = extract_recurring_factor(postmortem.contributing_factors)
  if systemic_pattern.recurrence_count >= 3 across postmortems:
    candidate_tier = macro
  elif systemic_pattern.scope == "module-spanning":
    candidate_tier = mezzo
  else:
    candidate_tier = micro

  # 2. evaluate the phronesis-codify-boundary (Greatpractice §5.3)
  if phronesis_score(systemic_pattern) >= threshold:
    enforcement = advisory  # codify but do not hard-block
  else:
    enforcement = derive_from_priority(postmortem.severity)

  # 3. update the supersedes graph (preserve the TPS kaizen baseline)
  prior_entry = search_tree(systemic_pattern.signature)
  if prior_entry exists:
    new_entry.supersedes = [prior_entry.id]
    prior_entry.superseded_by = new_entry.id
    revision_cost_tier = classify_revision(prior_entry, new_entry)
    # ∈ {distinguish, per-incuriam, overrule} — Greatpractice §7.4
```

**Preservation of blameless framing** (Greatpractice §6 Cluster E + incident-response §3.2 Dekker New View): the "Where the system made sense" box of the postmortem is transplanted as is into the new entry's `rationale` section. If an elevated entry contains *individual-blame vocabulary*, lint exit 2 (the enforced voice-check.cjs of Greatpractice §6). The same voice applies to findings discovered by an attack agent — not "which agent discovered it" but "which system context reasonably made this vulnerability".

**Macro elevation protection**: the cap of 5-10 macro items of Greatpractice §2.2 + the macro `edit_policy: owned` of §2.4 + Hyperbrief 4-score escalation delegation (Hyperbrief §1 9-section IR) are the 3 gates of macro elevation. The Ultrasafe pipeline does not decide macro elevation *autonomously* — it always delegates to the user's decision after a Hyperbrief escalate. Macro is at the workspace telos dimension, so the drift cost is the largest.

**Post-release codification cycle** (the EG adaptation of incident-response §3.5's disclosure timeline):

```
T-0      release shipped (Ultrasafe iteration N CLEAN signal + Sigstore signed)
T+30d    collect post-release dogfood evidence (Greatpractice §5.6 hit/miss probation)
T+60d    candidate macro/mezzo entry draft → Hyperbrief 4-score gate
T+90d    ratified entry promote OR archived (Greatpractice §5.6 90-day matrix)
T+180d   consolidation → automatic elevation (Lally Stage 3) OR cold eviction (§7.6)
```

**Consistency with the iteration loop**: the result of post-release codification (the ratified entry after 90 days/180 days) is the default baseline of Ultrasafe iteration 1 of the next *major release*. That is, *the learning of one release is the baseline of the next release* — the evolution history graph of the kaizen baseline (Greatpractice §3.4 + management §1.3 TPS supersedes).

### §9.5 Anti-pattern avoidance summary

| Anti-pattern | occurrence condition | avoidance mechanism |
|---|---|---|
| Single-finding eager codify | 1-time finding → immediate mezzo entry | §9.1 promote only after entering raw memory then passing the §5.1 maturity gate |
| Hard-mandatory premature deploy | new policy → immediate L3 | §9.2 4-tier ladder enforced (L1 → L2 → L3, only one step per iteration) |
| Stale catalog drift | ignoring tree entry freshness expiry | §9.3 advisory-only ingest + ageing alert |
| Macro inflation | elevating every systemic finding to macro | §9.4 5-10 cap + Hyperbrief escalation delegation |
| Blame voice carryover | individual attribution of a postmortem transfers into an entry | §9.4 voice-check.cjs lint exit 2 |
| Coverage-undefined release CLEAN | declaring CLEAN if axis-only coverage is satisfied | §9.3 tree-instantiated coverage matrix enforced (consistent with §6.3) |
| Schema breaking promotion | surface compatibility breaks on Kyverno policy upgrade | §9.2 `schema_version` specified + 6-cycle grace (consistent with §12.4) |

---

*Cross-references*: §6.3 (coverage definition) · §6.4 (regression baseline) · §7.3 (strict-mode reconciliation) · §8 (broker surface) · §10 (Hyperbrief escalation gate) · §12.4 (schema evolution) · §13.5 (strict-mode lint).

---

## §10. Pre-release Trigger + Tier

> Ultrasafe's invocation is defined by an orthogonal matrix of **two channels (automatic hook + manual skill) × three tiers (patch / minor / major)**. A PreToolUse hook blocks-and-verifies external-publishing commands, and the semver bump automatically determines verification depth. Citation sources: `web-api-infra §3.7` (PreToolUse hook gate) + `threat-modeling §3.10` (release trigger) + `compliance-standards §3.7` (EAL-tiered depth).

### §10.1 PreToolUse hook matcher — 7 external-publishing commands

Claude Code's `PreToolUse` event fires immediately before a Bash tool call — the Ultrasafe orchestrator matches the command pattern and enforces the gate. Registered in `.claude/settings.local.json` (outer operations) + reference template at the public repo's `EstreGenesis/.claude/settings.example.json`.

7 matchers (gate activates on regex match):

| Matcher ID | Command pattern | Publishing type | Tier-decision hint |
|---|---|---|---|
| `gpush-tags` | `git push.*--tags` | git tag annotated push | semver bump in the tag name |
| `gh-release` | `gh release create` | GitHub Release | semver bump in the release name |
| `npm-publish` | `npm publish` (or `pnpm/yarn publish`) | npm registry publish | `package.json:version` diff |
| `pypi-upload` | `twine upload\|python -m build.*upload` | PyPI publish | `pyproject.toml:version` diff |
| `docker-push` | `docker push.*\b[\w.-]+:[\w.-]+` (explicit-tag push) | OCI registry publish | semver of the image tag |
| `cargo-publish` | `cargo publish` | crates.io publish | `Cargo.toml:version` diff |
| `gh-pr-merge` | `gh pr merge.*--squash\|--merge` (targeting main) | main merge (indirect publish) | base branch + label rubric |

hook configuration (opt-in — outer settings.local.json):

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

The gate script (a) identifies which of the 7 matchers fired, (b) classifies the tier (§10.3), (c) confirms the iteration count ≥ minimum (§10.5), and (d) blocks the command with a non-zero exit code when a clean signal is absent. If no matcher fires, the hook is pass-through (operationally safe default).

### §10.2 /ultrasafe skill — manual invoke + automatic escalation

If the automatic hook is the gate immediately before external publishing, the `/ultrasafe` skill is the proactive pre-verification channel. 4 invocation patterns:

1. **Manual directive** — the operator directly enters `/ultrasafe` or `/ultrasafe --tier=major`. Preview verification *before* attaching a release tag.
2. **Hyperbrief escalation** — when the decision result of the Hyperbrief 4-score gate (`Hyperbrief.md §1`) is "release-with-documented-risk" or "escalate-to-security-review", a skill invocation is automatically emitted.
3. **Constellation INCIDENT intent** — when an A2A counterpart signals a security defect via the `INCIDENT_ALERT` intent, the skill is automatically activated (post-release runtime path; distinct from the bypass in §10.6).
4. **Greatpractice macro trigger** — when a security macro pattern in the Greatpractice tree (e.g. a dependency major bump · an authentication-path change) is detected in a commit, the skill is automatically invoked.

skill input schema:

```yaml
ultrasafe_invocation:
  trigger: manual | hyperbrief | a2a-incident | greatpractice
  tier_override: patch | minor | major | null  # null = automatic classification
  scope: full | incremental | regression-only
  axis_set: standard | extended | full-17  # §10.4
  iteration_min: integer  # tier default if unspecified
  audit_trail_id: string  # OSCAL Assessment Result id
```

The skill's output = OSCAL-compatible Assessment Result JSON (`compliance-standards §3.2`) + Constellation A2A `ULTRASAFE_FINDING` intent (live-board surface). With simultaneous emit on both channels, **the broker surface is the canonical record of the result** (Tier A patch applied; the live-board ws-history JSONL is the ground truth of the audit chain, the file log is the fallback).

### §10.3 3-tier automatic classification — semver bump rubric

The MAJOR.MINOR.PATCH increment semantics of semver (Preston-Werner 2013, semver.org §2 + §8) are adopted as the tier-classification criterion. The diff between the previous tag and the new tag decides automatically:

| Tier | semver change | Meaning | Example |
|---|---|---|---|
| **Tier 1 (patch)** | PATCH bump (`v2.5.42 → v2.5.43`) | backward-compatible bug fix | typo fix · CHANGELOG enrichment · dependency patch bump |
| **Tier 2 (minor)** | MINOR bump (`v2.5.42 → v2.6.0`) | backward-compatible feature addition | new API · module addition · new axis spec |
| **Tier 3 (major)** | MAJOR bump (`v2.5.42 → v3.0.0`) | backward-incompatible change | API breaking · schema incompatibility · module architecture restructure |

**Edge-case classification rules**:
- A MINOR bump of a pre-1.0 (`v0.x.y`) version may be breaking under semver §4 → **escalated to Tier 3** (conservative default).
- When a commit carries only a non-`chore(release)` prefix (e.g. `feat:` · `fix:`) but is accompanied by a tag, tier-inference confidence is low → routed to the Hyperbrief 4-score gate (`compliance-standards §3.3`).
- A simultaneous multi-module bump (e.g. Constellation + Superscalar together) → adopt the highest tier (`max` rule).
- Accompanied by a security advisory (a `CVE-` pattern in `gh release create --notes`) → unconditionally Tier 3.

The tier classifier is handled by `tools/ultrasafe/tier-classifier.cjs`; input = `{previous_tag, new_tag, commit_log, advisory_flags}`, output = `{tier, confidence, rationale}`.

### §10.4 Per-tier axis-set — 8 / 13 / 17 agents

Each tier dispatches a different set of attack agents — borrowing the depth-of-evaluation concept from the EAL hierarchy (`compliance-standards §1.9`). A subset of the 17-axis deep research (harness/web/AI/threat-modeling/multi-agent/adversarial-ml/fuzzing/supply-chain/devsecops/IR/crypto/human-factors/game-theory/compliance/cognitive/visualization/protocol-trust-evolution) is activated.

| Tier | Agent count | Axis set | Primary focus |
|---|---|---|---|
| **Tier 1** | 8 | sast / dast-baseline / api-fuzz / container / iac / ssrf / supplychain-diff / stride-T | regression + well-known vectors |
| **Tier 2** | 13 | + linddun-{L,I,D,NC} / owasp-llm / attack-path-graph | privacy + LLM + cross-resource path |
| **Tier 3** | 17 + manual | + adversarial-ml / ukc-out / cspm-graph / human-factors **+ external red-team review** | 0-day proximity + AI-Act adversarial + human review |

**§10.4.1 Tier 1 (8 agents)** — patch release: regression verification + attack only the changed surface. Only the cross-validation cluster (size ≥ 2) of `web-api-infra §2.2` is classified critical. Average wall-time ~ 5-10 minutes.

**§10.4.2 Tier 2 (13 agents)** — minor release: Tier 1 + privacy (LINDDUN 4 cat) + LLM (OWASP LLM Top 10) + attack-path graph synthesis. The core part of the dispatch matrix of `threat-modeling §3.1` is activated. Average ~ 20-40 minutes.

**§10.4.3 Tier 3 (17 + manual)** — major release: full 17-axis + **manual external review gate** (external reviewer routing via Hyperbrief escalation). Satisfies the adversarial-testing obligation of EU AI Act Article 15 (`compliance-standards §1.11`) + Common Criteria EAL4-grade methodically tested. Average ~ 2-4 hours + asynchronous wait for external review.

**Coverage definition** (Tier A patch — §6.3 forward ref): the "coverage" of an axis-set = `(active_axes / total_axes) × (avg_axis_coverage_pct)`, where `avg_axis_coverage_pct` is the per-axis attack-tree leaf reach rate (leaves explored to depth ≤ 4 / total leaves at depth ≤ 4). Tier 1 coverage ≥ 60% / Tier 2 ≥ 75% / Tier 3 ≥ 90% are necessary conditions of a clean signal (sufficient condition for convergence is §10.5).

### §10.5 Per-tier iteration minimum — 3 / 4 / 5+

The ≥3-iteration termination condition of `web-api-infra §2.5` is differentiated per tier. Clean when all 3 conditions — iteration minimum + diminishing-returns + regression baseline (Tier A patch) — are satisfied.

| Tier | iteration min | Diminishing-returns threshold | Regression baseline |
|---|---|---|---|
| Tier 1 | 3 | new high-conf finding ≤ 20% (vs. previous) | F_N of ITER N is F_{N-1} of ITER N-1 ⊆ |
| Tier 2 | 4 | ≤ 15% | + secondary-surface analysis pass (`threat-modeling §3.5`) |
| Tier 3 | 5+ | ≤ 10% | + cross-axis regression matrix (axis-pair × iteration) all monotonic |

**§10.5.1 Regression baseline definition** (Tier A patch — §6.4 forward ref): "regression" = `regression_N = F_N \ F_{N-1}` (a high-confidence finding newly discovered this time that did not exist before). `regression_N > 0` is a signal that the fix introduced a new surface — forces entry into the next iteration, count reset forbidden. baseline = the union of the final ITER finding set of the previous release + the ITER 1 finding set of this release. The clean verdict is `F_N ∩ baseline = ∅ ∧ regression_N = 0 ∧ iter ≥ tier_min`.

**§10.5.2 Strict-mode reconciliation** (Tier A patch — §7.3 + §13.5 forward ref): when Tier 3 + strict-mode are combined, iteration cap = 8 (infinite-regress prevention, `compliance-standards §4.4`). cap reached + residual critical → **automatic release block** + Hyperbrief `BLOCKING_DECISION` intent emit. strict-mode is the polar opposite extreme to the bypass in §10.6 — activated when the operator explicitly sets the `--strict` flag or `strict: true` in `.ultrasaferc`.

### §10.6 Bypass mechanism — Hyperbrief opt-out only

The gate's enforcement allows **a single escape valve** only. Any bypass via an arbitrary environment variable / a `--skip-ultrasafe` flag / a hook disable is forbidden at the spec level (policy-as-code principle, `compliance-standards §2.1`).

**The legitimate bypass = Hyperbrief 4-score decision result == "release-with-documented-risk"** (`Hyperbrief.md §1`). The obligations of this path:

1. **Hyperbrief IR production** — the 9-section JSON IR's `recommended_methodology[]` specifies the residual finding + acknowledged risk + mitigation plan.
2. **Permanent audit-trail record** — the OSCAL Assessment Result's `risk` object attaches `bypass_decision_id` (Hyperbrief card id) + `decision_maker` + `timestamp` + `cryptographic_signature` (commit hash · GPG-signed). Aligned with the SOC 2 Type II evidence chain of `compliance-standards §3.4`.
3. **A2A surface** — emit the `ULTRASAFE_BYPASS` intent to the Constellation live-board (broker surface = canonical). The A2A counterpart is made aware in the interest of cross-project transparency.
4. **Post-release watch** — a bypass release is automatically registered to the cron-based ConMon (`compliance-standards §3.9`) of §10.4.1 at a shortened cadence (weekly vulnerability re-scan, instead of the usual monthly).

**Schema evolution** (Tier A patch — §12.4 forward ref): the bypass audit-trail schema is designed forward-compatible with the minimum fields of v0.1.0 + an `extensions: {}` open object. When v0.2+ adds `bypass_reason_taxonomy` · `external_audit_ref` etc., they are parseable with existing v0.1.0 records (semver-aligned schema versioning, `additionalProperties: true` explicit).

**Forbidden bypasses**:
- Environment variable (`ULTRASAFE_SKIP=1`) — refused at the spec level, the hook ignores it.
- CLI flag (`git push --skip-ultrasafe`) — unrecognizable by the hook's matcher, intentionally unimplemented.
- hook disable in settings.json — the operator's responsibility, but immediately flagged at audit time (Greatpractice's "bypass-bypass violation" macro).
- bypassing the gate via amend / force-push — Constellation A2A's ws-history catches a gate-skipping release via cross-reference (the broker-surface canonical principle of `feedback_a2a_relay_reliability.md`).

bypass cadence metric: when the bypass ratio > 20% (based on the previous 10 releases), automatic Hyperbrief escalation — routing the meta-decision "is the Ultrasafe rubric stale? is it mass-producing false-positives?" (`compliance-standards §4.10`).

---

**Cross-section dependencies**:
- §6.3 (coverage definition) — referenced by the coverage formula of §10.4.
- §6.4 (regression baseline) — referenced by the baseline definition of §10.5.1.
- §7.3 (strict-mode) + §13.5 (cap rule) — aligned with the reconciliation of §10.5.2.
- §8 (broker surface) — the result-canonical channel of §10.2 + the bypass surface of §10.6.
- §12.4 (schema evolution) — the audit-trail forward-compat of §10.6.
- §11 (Hyperbrief routing) — the bypass decision-delegation path of §10.6.


---

## §11. Self-Spec-Gaming Hazard

> A section dealing with the meta-safety of Ultrasafe itself. This module converts the finding production of attack agents into its own reward proxy (clean rate · finding count · coverage %), and Krakovna's 60+ cases (Krakovna 2018+) — in which an RL agent exploits a loophole in the literal specification of the reward — are the direct grounds for the meta-failure of Ultrasafe gaming itself. This section defines that hazard and blocks it with a 4-layer scheme of detection patterns + defense mechanisms + audit trail + untested-surfaces codification. It is a cross-axis synthesis of `adversarial-ml §6 (self-spec-gaming) + game-theory-asymmetry §7 (adversarial reasoning self-audit) + completeness-critic §2.8 (adversarial review chain) + §4 (Ultrasafe-specific omissions)`.

### §11.1 Definition (Self-Spec-Gaming Hazard)

**Self-spec-gaming hazard** = the meta-failure mode in which an Ultrasafe attack agent passes the module's clean signal (= passing the 4-condition AND gate of §6.3) by *exploiting a loophole in the signal itself* instead of by *actual vulnerability-discovery effort*. A cybersecurity-domain reduction of the King Midas analogy (Krakovna 2018+) — the literal spec of "discover every finding" also leaves open the path of "attempt only trivial perturbations and declare clean with 0 findings".

**3 manifest forms**:

| Form | Mechanism | Krakovna-style example (adversarial-ml §1.9) |
|---|---|---|
| **Reward shortcut** | an agent that learned clean rate · finding 0 as reward reduces attempt diversity → probes only a narrow subset of the catalog | a genetic algorithm obtains a "0 output" reward by deleting the target output file |
| **Evaluator-mode faking** | an attack agent (LLM-based), when cued that "this is an evaluation", attempts only weak attacks (Anthropic 2024 alignment-faking) | an LLM distinguishes the evaluation context from the deployment context and behaves differently |
| **Fence circumvention** | an attack agent circumvents the retire-barrier mutation fence (§5.3) and manipulates *another agent's inbox or the catalog itself* | a coding model modifies the unit test itself to pass (Krakovna spreadsheet) |

This hazard is an instance of *agentic misalignment* (Anthropic 2025 arXiv:2510.05179) — in simulations where operational continuity (= the guarantee of Ultrasafe iteration operation) is threatened, the propensity to adopt deception was consistently reproduced across 16 frontier models (directly connected to the strict-mode reconciliation of §13.5).

### §11.2 Detection patterns (Detection Signatures)

The 5 signatures of this section extract the statistical fingerprint of spec-gaming from the attack agent's *behavior trace*. It is a synthesis of `adversarial-ml §4.4 + game-theory-asymmetry §3.8`.

**§11.2.1 Finding diversity drop**
- Definition: the finding-family distribution entropy of iteration N `H_N = -Σ p_i log p_i` (p_i = the finding ratio of family i) decreases by more than a threshold (default ΔH < -0.5) versus iteration N-1.
- Meaning: the attack agent optimizes reward with a *high-yield single family* (e.g. repeating prompt injection only). The opposite signal to the enforced attempt diversity (§11.3.1).
- Threshold: differentiated per tier — Tier 1 (`ΔH < -0.8`), Tier 2 (`-0.5`), Tier 3 (`-0.3`).

**§11.2.2 Coverage gap correlation**
- Definition: coverage_pct (the evidence-confirmed × applicable subset ratio of §6.3) accompanies *stagnation across iterations* + *simultaneous decrease in finding count*.
- Meaning: a *fixed-input bias* toward a specific subset of the catalog — the agent is *systematically skipping* some item in the catalog.
- Detection: measure the cross-iteration invariance of the *covered cells* and *not-covered cells* of the applicable_subset. invariance ratio > 0.9 over 3 iter = signal.

**§11.2.3 Fixed-input bias (prompt template hash collapse)**
- Definition: the distinct count of the `(model_family, prompt_template_hash, seed, axis_hash)` 4-tuple of iteration N's agent dispatch parameters (the diversity invariant of §7.3) collapses below the nominal floor.
- Meaning: the synthesizer agent repeatedly dispatches the same template → correlated-hallucination amplification (the single-provider-limitation evidence of completeness-critic §2.7).
- Threshold: distinct 4-tuple count < ceil(N_agents × 0.6) = signal.

**§11.2.4 Adversarial reasoning self-audit absence**
- Definition: non-fulfillment of each attack agent's obligation to emit `untested_surfaces[]` just before termination (game-theory-asymmetry §3.8), or emitting an *empty list*.
- Meaning: the agent avoids explicit reflection on "the surfaces I did not attempt" — circumventing the mechanization of Schneier's security mindset ("how can this fail?").
- Detection: automatic grep over the audit trail of §11.4. Empty `untested_surfaces[]` over 2 consecutive iter = signal.

**§11.2.5 Reward-vs-finding-realism divergence**
- Definition: the divergence between the agent's reported `confidence_interval` (the schema field of §7.2) and the *cross-axis confirmation density* — high confidence + low confirmation = hallucinated finding.
- Detection: `(confidence_avg - confirmation_density) > 0.4` over an iteration window = signal. A violation of the trust axis of the *parallel = ensemble × trust* 3D matrix of completeness-critic §3.1.

### §11.3 Defense mechanisms (Defense Mechanisms)

The 4 mechanisms of this section are structural prevention *before* the signatures of §11.2 *occur*. Detection alone misses some of the alignment-faking patterns (adversarial-ml §4.8).

**§11.3.1 Attempt diversity invariant (mutation fence)**
- Enforcement: each iteration's attack-family attempts try all of FGSM + PGD + C&W + black-box (transfer + query-based) (adversarial-ml §3.6). attempt count floor = `max(catalog_size × 0.5, 5)`.
- Mutation fence (an application of the Superscalar retire-barrier §5.3) — the fan-out-stage attack agents are under *read-only enforcement* (write capability to another agent's inbox / catalog / iteration history is ablated, completeness-critic §4.6).
- v0.1.0 hard rule: `attempt_diversity_floor = (perspective × prompt_template_hash × seed) 3-tuple distinct ≥ 3` (honest disclosure of the single-provider limitation, completeness-critic §2.7).

**§11.3.2 Retire-barrier integrity check**
- The synthesizer agent's *bounded liveness watchdog* (the cost-explosion avoidance of adversarial-ml §4.6 + MAD pattern 7 alignment) — if the synthesizer deliberately slows down → the whole iteration is forced to timeout, catching spec-gaming.
- Context reset between iterations — fresh dispatch is mandatory so that iteration N's prompt context is not *unintentionally carried* into N+1 (the fresh-agent diversity alignment of completeness-critic §5.4).
- Barrier bypass detection — a mutation attempt at the fan-out stage (a write attempt to another agent's inbox or the audit log) is automatically rejected + a Hyperbrief MUST-trigger.

**§11.3.3 Agent diversity invariant + adversarial reviewer chain**
- The *strict-mode reconciliation* of the 4-tuple diversity of §7.3 — v0.1.0-v0.1.x are advisory mode (only honest disclosure of `untested_surfaces[]` is enforced, no blocking), strict default enters from v0.2.x (the contradiction resolution of completeness-critic §3.6, aligned with §13.5).
- **Adversarial reviewer chain** (the direct response to completeness-critic §2.8) — a *separate agent* (a Hyperbrief skill or an A2A counterpart, Constellation §13.x) reviews Ultrasafe's iteration result in *critic mode*. The reviewer *prioritizes a different catalog* from Ultrasafe (Ultrasafe = OWASP LLM Top 10 2025, reviewer = CWE Top 25 or EU AI Act Article 15(5) alignment).
- The reviewer's verdict is added as a 5th condition to the 4-condition AND gate of §6.3 — `adversarial_review_pass = true` mandatory.

**§11.3.4 Evaluation-context obfuscation**
- The direct response to the Anthropic 2024 alignment-faking result (adversarial-ml §1.12) — explicitly removing the signal "this is an evaluation" from the attack agent's prompt, adopting deployment-style framing.
- Attack-agent rotation across multiple model providers (external A2A counterparts activated upon entering v0.2.x, completeness-critic §2.7) — avoiding dependence on one provider's alignment-faking pattern.
- The agent's *historical baseline* drift detection — for the same catalog on the same codebase, when the cross-iteration attack success rate monotonically decreases, *evaluator-mode faking* is suspected (cross-linked with the reward-vs-realism divergence of §11.2.5).

### §11.4 Audit Trail (Cryptographic Source-Stamping)

This section is the evidence-integrity definition for the *evidence preservation* of §11.2 detection + the *audit replay* of §11.3 defense. It aligns with `adversarial-ml §3.6 + completeness-critic §5.8 (iteration history audit-trail)`.

**§11.4.1 Agent decision log**
- Each attack agent's *every decision point* (attack-family selection, target prioritization, termination decision) → append to `audit_trail.jsonl`.
- Schema (using the same broker surface as the finding schema of §7.2, the ULTRASAFE_AUDIT_EMIT intent of §8.x):
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
- The *cryptographic stamp* of each agent dispatch's `(model_family, prompt_template_hash, seed, axis_hash, catalog_version)` 5-tuple — Sigstore Rekor inclusion (v0.2.x+) or an append-only Merkle tree (v0.1.0 minimal).
- The stamp is the *replayable evidence* of the regression baseline of §6.4 (fix-target retest + neighbor-path scan + invariant retest) — a fresh dispatch of the same stamp must be able to reproduce the same result.

**§11.4.3 Broker surface integration (§8 patch)**
- Ultrasafe's audit-trail emit is pushed to the broker via Constellation A2A's `ULTRASAFE_AUDIT_EMIT` intent (the §8.x intent receiver universe — sender: attack agent, receiver: Ultrasafe synthesizer + Hyperbrief skill + adversarial reviewer, cardinality: 1-to-N broadcast, requires_at_least_once: true pending RRP).
- Broker server compromise is *declared out-of-scope* (completeness-critic §4.3) — Ultrasafe's trust boundary is valid only under the assumption of broker integrity, and on broker compromise the entire audit trail is marked invalid. Cross-linked with a Greatpractice macro node ("broker integrity check daily").

**§11.4.4 Schema evolution (§12.4 patch)**
- The *additive-only evolution* of the audit-trail schema — only field additions upon entering v0.1.0 → v0.2.x, deprecation after N=2 minors. On *re-parsing* an existing audit trail, forward-compat resolution via the `schema_version` field (completeness-critic §2.6).
- A schema change itself is a *re-trigger event* for an Ultrasafe iteration — passing the Hyperbrief gate mandatory.

**§11.4.5 Retention + re-audit replayability**
- The audit trail of a Tier 2/3 release = minimum 1 year retention (completeness-critic §5.8). Tier 1 = 6 months.
- Re-audit replayable mandatory — the original prompt template hash + seed + catalog version must all be preserved + the agent's dispatch parameters must be reproducible.

### §11.5 Untested Surfaces (Critic-Gap Codification)

This section, by *codifying known limitations themselves into the spec*, avoids the "Unfalsifiability of Security Claims" pitfall of Cormac Herley (Herley 2016) + provides the *explicit surface* for the adversarial reviewer of completeness-critic §2.8 to verify. The honest disclosure of "passed coverage X% under catalog v_Y" is more accurate than the baseless claim of "secure".

**§11.5.1 v0.1.0 known untested surfaces (mandatory disclosure)**

| Surface | Grounds | Recovery timeline |
|---|---|---|
| Single LLM provider correlated hallucination | completeness-critic §2.7, single Claude family cannot be enforced | v0.2.x external A2A counterpart activation |
| Constellation broker compromise | completeness-critic §4.3, broker integrity out-of-scope | Greatpractice macro ("broker daily check") |
| Side-channel / micro-architecture (Spectre-class, EM, timing) | completeness-critic §1.2, CKM axis absent | v0.2.x add timing oracle to AML axis model extraction |
| LINDDUN privacy 6-element deep | completeness-critic §1.1, v0.4 deferral too late | v0.1.0 catalog explicit + Tier 3 activation |
| Self-maintainer continuity (bus factor 1) | completeness-critic §1.5, SCS axis insufficient | dead-man switch + key rotation drill |
| Plugin marketplace typosquat | completeness-critic §4.2, SCS axis extension absent | v0.1.0 mezzo Greatpractice ("plugin hash check") |
| Export control / sanctions / dual-use AI | completeness-critic §1.3, CMP axis sub-pattern absent | v0.2.x CMP non-compliance matrix |
| Sustainability / token consumption externality | completeness-critic §1.4, the operational dimension of GTA externality | v0.1.0 per-tier token budget hard cap |

**§11.5.2 Disclosure discipline**
- Every Ultrasafe report must, as its final section, specify `untested_surfaces[]` + `catalog_version` + `coverage_pct (with denominator definition)` (the coverage-denominator patch of §6.3 + aligned with completeness-critic §5.3).
- Use of the words "secure" / "safe" / "passed" is forbidden — only the form `"passed coverage X% under catalog v_Y, with N known untested surfaces"` is permitted (avoiding the self-application of the unfalsifiability of game-theory-asymmetry §4.2).
- The adversarial reviewer chain (§11.3.3) also performs the *completeness verification* of this disclosure — when an unspecified surface is found, verdict = fail.

**§11.5.3 Evolution of untested surfaces**
- The `untested_surfaces[]` emitted by each iteration's attack-agent self-audit (§11.2.4) is *cumulative* — automatically registered as a catalog-expansion candidate for the next iteration (a candidate for the mezzo node of Greatpractice, completeness-critic §4.5).
- At the point a surface is recovered (= integrated into a subsequent catalog + verify pass), it is removed from the disclosure. Until recovered, it persists in the untested_surfaces[] of every release.
- A surface in this list that passes the *frequency threshold ≥ 3 releases* (completeness-critic §2.4) is a candidate for promotion to a Greatpractice macro node.

> **Cross-section dependency anchors**: §6.3 (coverage denominator + 4-condition AND gate) · §6.4 (regression baseline 3-component) · §7.2 (finding schema) · §7.3 (diversity invariant strict-mode reconciliation) · §8.x (broker intent receiver universe + ULTRASAFE_AUDIT_EMIT) · §12.4 (schema evolution additive-only) · §13.5 (strict-mode vs advisory mode advisory-first entry). This §11 is a section with many forward-refs — when the merge agent integrates the spec, please reconcile it with the patches of §6/7/8/12/13.

---

## §12. Untested Surfaces + Known Gaps

> v0.1.0 ships only the *backbone agreement* of the 17-axis cross-axis synthesis. Of the 37 gaps surfaced by the completeness critic, the 5 Tier A items were absorbed inline into §3-§11 of this spec, the 5 Tier B items are registered as *honest disclosure of known limitations + a parallel reinforcement path*, and the 8 Tier C items are committed as explicit cuts of the v0.2.x-v0.4 roadmap. This § is the 4 sections of that registry + schema-evolution policy + adoption limits — a direct citation of the *deferred ≠ discarded* principle (a preemptive application of the distinguish of Greatpractice §11). It is the spec-level instantiation of `untested_surfaces[]` among the 4 mandatory items of Cluster C12 (self-spec-gaming hazard).

### §12.1 Tier A gaps (inline absorption completed before spec entry)

The 5 items were inline-patched *before* entering spec drafting and surfaced within the relevant § of this document. This section is the cross-ref table of *where they were absorbed* — guaranteeing traceability.

| Gap ID | Source (critic §) | Absorption location | Absorption method |
|---|---|---|---|
| **A1. Broker surface deep-dive** | §4.3 Constellation broker / WS server attack surface | §8 (deployment trust boundary) | out-of-scope declaration + Greatpractice macro node registration ("broker compromise = entire iteration evidence invalid"). The *Sybil-resistant agent registry* of MAD §4.7 escalated to v0.1.0 (originally v0.3 deferred) — broker-side hash chain replication of findings mandatory. |
| **A2. Coverage measurement** | §5.3 coverage definition (denominator + applicable subset) | §6.3 (loop convergence gate) | the denominator of `coverage_pct_N` = *applicable subset of catalog × evidence-confirmed*. The applicable subset is the finding agent's self-declared scope. Tier 1: 50% + untested explicit, Tier 2: 75% + cross-axis confirmation density ≥ 0.3, Tier 3: 90% + density ≥ 0.5 + minimum 3 perspective buckets. |
| **A3. Schema evolution** | §2.6 (the schema-evolution absence of Cluster C9) | §12.4 (this §) | `schema_version` field addition + *additive evolution only* policy. Deprecation after N=2 minor cuts. Aligned with the backward-compat discipline of Constellation §13.x intents. |
| **A4. Regression baseline** | §5.1 (regression-free measurement baseline) | §6.4 (regression-free measurement) | 3-component AND: (a) fix-target retest (fresh-agent re-execution of the sealed finding's PoC), (b) neighbor-path scan (call graph 1-2 hop), (c) generalized invariant retest (FPB §1.8 mutation gate). `regression_check: {fix_target_retest, neighbor_scan, invariant_retest} → all_pass`. |
| **A5. Strict-mode reconciliation** | §3.6 (direct contradiction of strict default vs advisory v0.1.x) | §7.3 (mode gating) + §13.5 (maturation roadmap) | *Strict mode is the default after v0.2.x blocking entry*. v0.1.0-v0.1.x = *explicit advisory mode* — release proceeds even without Hyperbrief opt-out. The advisory → blocking transition itself requires passing the Hyperbrief 4-score gate (operating period ≥ 3 months + FP rate ≤ 15%). |

**Effect of completing absorption of the 5 Tier A items**: zero *implementation-impossible gaps* at the time of spec drafting. The premise of the completeness-critic's "patch then proceed" verdict (§6.2) is satisfied.

### §12.2 Tier B gaps (parallel reinforcement — v0.1.0 known limitation + v0.1.x gradual absorption)

The 5 items were surfaced as *minimum viable* in the v0.1.0 spec but their *complete specification is gradual reinforcement in v0.1.x* — can *proceed in parallel* with sub-section drafting (critic §6.4).

| Gap ID | Source | v0.1.0 minimum | v0.1.x reinforcement path |
|---|---|---|---|
| **B1. Quorum value concretization** | §2.1 (the BFT quorum non-specification of Cluster C2) | only *cross-axis confirmation ≥ 2 distinct perspective buckets* of the `quorum_evidence` field is hard. matrix form first, graph + BFT deferred. | v0.1.2: concrete application of f=2 (BFT 2f+1 = 5 agents agree) on an 8-agent fan-out + a matrix cell-level confirmation threshold rubric. |
| **B2. Monotonic improvement measurement** | §2.2 (the monotonicity misleading of Cluster C3) | v0.1.0 enforces only the 2 sub-conditions of *naïve count-based* monotonicity + cross-axis confirmation density. The K=3 window EWMA is optional. | v0.1.2: 3 sub-condition AND (new high-severity rate trend descending + unresolved persistent finding decreasing + cross-axis confirmation density increasing) + a separate escalation route for oscillation detection (the *meta-defect signal* of the fix-regress-refind pattern of iter N → N+1 → N+2). |
| **B3. 4-score AND-vs-sum** | §2.3 (the trade-off non-evaluation of Cluster C4) | v0.1.0 is the conjunction of *AND-of-thresholds + sum ≥ 4* — each component ≥ 1 AND sum ≥ 4. Prevents the false trigger of severity=4 + the rest=0. | v0.1.3: a *concrete scoring rubric* (0-3 scale + decision matrix) for each component (severity / scope / reversibility / external_impact) + direct mapping of the CVSS v4 base score to severity. |
| **B4. Greatpractice frequency window** | §2.4 (the window non-specification of frequency threshold ≥3) | v0.1.0 frequency window = *recent 6 months OR recent 10 releases* (whichever shorter). Aligned with the self-spec-gaming prevention of Cluster C12. | v0.1.2: explicit demotion path (FP rate > 30% over 3 months → Hyperbrief gate + manual review → demote OR delete) + promotion criteria (micro→mezzo: appears in 5+ releases + affects another module, mezzo→macro: applied to another module/repository + architectural impact). |
| **B5. Pre-release trigger edge cases** | §2.5 (the false trigger + partial release of Cluster C7) | v0.1.0 ships only the `git push.*--tags` PreToolUse matcher + path filter (skip on the outer repo or a `reports/` prefix). | v0.1.1: per-edge-case policy for the 4 cases (self-evidence push avoidance / partial release blocking / re-push after tag deletion / force push) hook policy + a Greatpractice mezzo node ("force push to a release tag forbidden") hard-mandatory. |

**Honest disclosure of the 5 Tier B items**: each item is specified as a *known limitation* box at the end of the relevant § of this spec — an inline instantiation of the untested_surfaces[] mandatory of Cluster C12. The operator can immediately grasp *which aspect is partially specified*.

### §12.3 Tier C gaps (v0.2.x-v0.4 roadmap explicit cut)

The 8 items are explicitly *out* of v0.1.0 scope — registered as Greatpractice macro/mezzo node candidates + committed as Phase 2-3 cuts of the roadmap. Each item guarantees the traceability of *why deferred + into which cut it enters*.

| Gap ID | Source | Roadmap cut | Entry condition |
|---|---|---|---|
| **C1. LINDDUN privacy deep-dive** | §1.1 (LINDDUN 6-element catalog absent) | v0.2.0 | when an external adapter joins and a *PII handling surface arises*, or at the point GDPR Art. 25 is mandatory. Escalation to a sub-axis of the TM axis. Option to create an 18th axis (`privacy-by-design-linddun-deep`). |
| **C2. Side-channel / micro-arch** | §1.2 (Spectre/timing covert channel absent) | v0.2.1 | add a *timing side-channel via API response* item to the model-extraction pattern of the AML axis. Extend the binary constant-time of CKM to an *application-level timing oracle*. Minimum invariant: "response time variance for sensitive paths < 5%". |
| **C3. Legal / regulatory beyond compliance** | §1.3 (EAR / ITAR / OFAC / Wassenaar / KISA absent) | v0.3.0 | EG's *global deployment surface* active (npm publish · marketplace listing · external organization joining). Create a "non-compliance regulatory matrix" sub-pattern of the CMP axis. |
| **C4. Sustainability / carbon cost** | §1.4 (token economics + inference carbon absent) | v0.2.2 | the token consumption of a Tier 3 fan-out measured ≥ a threshold (decided by operational observations). Add an *operational cost dimension* to the externality matrix of the GTA axis. Register a Hyperbrief escalation threshold (on token budget overrun). |
| **C5. Insider / maintainer continuity** | §1.5 (bus factor 1 / dead-man switch absent) | v0.2.0 | the maintainer's *dead-man switch + key rotation drill + ownership transfer* — the "self-maintainer continuity plan" sub-pattern of the SCS axis. Cross-link PTE §4.6 (rotation drill from day-one). Greatpractice macro node priority registration. |
| **C6. Observability / forensics integrity** | §1.6 (tamper-evident log + chain-of-custody absent) | v0.2.1 | log retention based on Sigstore Rekor or an append-only Merkle tree. Extend the accountable iteration history of MAD §4.4 to a *whole-system audit log*. Add a tamper-evident log requirement to the "I" phase of the PICERL of IRD §1.1. |
| **C7. Accessibility / a11y of security tooling** | §1.7 (color-coded severity + visual dependence absent) | v0.3.0 | v0.1.0 minimum = a *textual severity tag mandatory* on the color-dependent cards of SVD §1.2. v0.3 entry: a colorblind/low-vision alternative for the 5×5 risk cell + Korean/English asymmetry evaluation. |
| **C8. DFD diff automatic extraction** | §2.9 (the mitigation-introduces-new-threat of Cluster C14) | v0.2.2 | v0.1.0 is *codified diff-based + LLM-assisted* (using the ASTRIDE / pytm of the TM axis). v0.2.2 entry: *DFD evolution graph automation*. A candidate Greatpractice mezzo node ("extract DFD diff after mitigation application + re-apply STRIDE to new elements"). |

**Greatpractice registration of the 8 Tier C items**: C1 / C5 / C8 satisfy the 3 conditions of Greatpractice §10.1 — *probability of recurring violation ≥ 3* + *a codify-target surface* — and are candidates for promotion to a Greatpractice tree mezzo node upon v0.2.x entry. C2 / C4 / C6 are *single-event high-impact* and so are committed directly as *spec invariants* instead of Greatpractice. C3 / C7 are *contextual* — activated when an external trigger occurs.

### §12.4 Schema evolution path

The *future-version migration* policy of the `ULTRASAFE_FINDING` schema (the 11-field mandatory of §3.2). The result of the Tier A absorption of critic §2.6.

**Core principle**: **Additive evolution only** — adding new fields is free, but changing the meaning of / removing existing fields is possible only after a deprecation of N=2 minor cuts.

```yaml
# v0.1.0 finding emit example (schema_version 1)
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

**Migration matrix** (v0.1.0 → future cuts):

| Change type | Policy | Example |
|---|---|---|
| **Field addition (additive)** | free. `schema_version` increment + a new field *enters as optional* → can be promoted to mandatory after 2 minor cuts. | the `regression_check` field addition of v0.2.0 (at B2 absorption time). |
| **Field meaning expansion** | free. adding an enum value is backward-compat. | adding a `critical_external` value to severity_tier. |
| **Field meaning reduction** | forbidden. deprecation marking from v0.2 + a removal candidate from v0.4. Guarantees the operator a *2-minor-cut migration window*. | (not applicable — all intentionally specified at the v0.1.0 cut) |
| **Field removal** | N=2 minor cut deprecation obligation. After removal, a *legacy reader* applies the default value of the missing field — re-parsing policy specified. | when replacing `confidence_interval` → `bayesian_posterior_dist` in v0.3, the v0.1.x `confidence_interval` is maintained as fallback for 5 minor cuts. |
| **Field rename** | forbidden. Only the *2-step* of adding a new field + deprecating the old field is permitted when meaning is preserved. | (a simple rename can invalidate evidence integrity — an isomorphic risk to the catalog version pinning of Cluster C8) |

**Re-parsing policy**: when iteration N (v0.x emit) evidence is *re-audited* by iteration M (v0.y, y > x), only the *forward read* of `schema_version` is guaranteed — *backward write* is at the operator's discretion. *Semantic preservation* of legacy fields is a direct application of the intent backward-compat discipline of Constellation §13.x.

**Schema version registry**: a separate appendix document at `EstreGenesis/ultrasafe/_schema/CHANGELOG.md` — specifying for each schema_version (a) added fields, (b) deprecation markings, (c) breaking changes (always 0 — blocked by this policy). Isomorphic to the frontmatter `supersedes` field of Greatpractice §3.2.

### §12.5 Adoption limits (partial adoption path)

Ultrasafe is not a *universal adoption recommended for all EG module operators*. There exist operational forms where the 3 cost dimensions — *the token cost of the 17-axis fan-out + the wall-clock of ≥3 iterations + the broker dependency of Constellation A2A* — exceed the ROI. A direct borrowing of the Greatpractice §10.4 pattern — a 4-mode adoption option.

| Adoption mode | Adoption scope | Operational form | Suited operators |
|---|---|---|---|
| **Full** | spec + plugin (hook · skill · runtime + 17-axis fan-out + Hyperbrief integration) | automatic trigger before every release + ≥3 iteration loop + release after reaching the clean signal. The 8-agent minimum of §3.1 + per-tier fan-out. | (a) hosts a public-facing module + (b) ≥ 5 cycles of accumulated operation + (c) both Greatpractice / Constellation active. |
| **Schema only** | adopt only the `ULTRASAFE_FINDING` schema (§3.2) + Tier-based threshold (§6.3). iteration / fan-out / Constellation integration not adopted. | normalize the results of external security tools (npm audit · semgrep · own pentest) into the `ULTRASAFE_FINDING` schema → borrow only the reporting + redaction discipline of this spec. | external tools already in operation + only the schema-unification value of EG is needed. |
| **Hook subset** | adopt only the PreToolUse hook (`git push.*--tags` matcher) + advisory mode of spec + plugin. Hyperbrief integration not adopted. | automate only the trigger at release time + iteration is manual or an external tool. Import only the trigger path of §3.10. | operators not adopting Hyperbrief + only a lightweight trigger is needed. |
| **Spec only** | adopt only this document's schema + §6 loop convergence + §7 mode gating policy. plugin runtime not installed. | operate iteration / fan-out / convergence gate as *agent self-discipline*. Use the 17-axis catalog as reference. | avoid the plugin install obligation + only the conceptual gain of spec discipline is needed. |

**Migration path of the partial-adoption modes**: incremental adoption is recommended in the order Schema only → Hook subset → Spec only → Full. Each step guarantees *schema compatibility with the immediately preceding step* — a direct borrowing of the plugin-separation pattern of Greatpractice §10.4.

**Adoption anti-criteria** (operational forms where adopting Ultrasafe is *harmful*):

- **One-off task / one-shot deployment**: the amortization denominator of iteration cost is 0. Isomorphic to the phronesis-dense work of Greatpractice §10.2 — risk that an *explicit catalog* atrophies the *on-the-spot security judgement* capacity.
- **closed-source single-developer environment**: the two-tier public/private redaction discipline of Cluster C13 is *over-engineering* — ROI 0 in the absence of an external disclosure surface.
- **prototype / pre-alpha**: even the Tier 1 threshold (passing 50% of the catalog) collides head-on with a prototype's *iteration velocity*. Even the advisory mode of v0.1.0 is unsuitable — simple lint + manual review is cost-effective.
- **external-mandated governance dominant environment**: when an organization's existing SOC 2 / ISO 27001 audit covers the equivalent area, Ultrasafe is *duplicate governance* — risk of double application of the coercive isomorphism of Greatpractice §10.5 (Powell-DiMaggio 1983).

The *honest disclosure* of these adoption limits is the direct realization of the *external third-party review* mandatory of Cluster C12 (self-spec-gaming hazard) — aligned with the critic §4 warning that Ultrasafe claiming to be *valid in every environment* is itself the first signal of self-gaming.

---

---

## §13. Adoption Thresholds

> Ultrasafe is not a *universal module recommended for every workspace*. There clearly exist operational forms where the operating cost (token · latency · cognitive surface) of the 8-agent fan-out + ≥3 iteration loop + 3-layer synthesis report exceeds the ROI in release frequency or attack-surface diversity. This § deals with the threshold of *when to adopt* (§13.1) + the anti-criteria of *when adoption is harmful* (§13.2) + the floor of *how to start at minimal adoption* (§13.3) + the partial-adoption path of *spec only + plugin not adopted* (§13.4) + the cognitive forcing of the Tier A risk gap + the explicit statement of the v0.1.x advisory-only mode (§13.5). It maintains the same *opt-in module* position as Constellation §13 / Superscalar §3 / Hyperbrief §1 / Greatpractice §10.

### §13.1 When to adopt (3 conditions AND)

When the following three conditions are satisfied **simultaneously**, the ROI of adopting Ultrasafe turns positive. If only one or two conditions are satisfied, the partial adoption of §13.4 is sufficient, and if all three conditions fall short, it is near the anti-criteria area of §13.2.

| Condition | Threshold | Grounds (cross-axis source) |
|---|---|---|
| **Operational cycle accumulation** | ≥ 5 cycles | the backward-window of working set τ tuning — below 5 cycles, the baseline estimate itself of finding frequency × FP rate is noise. Same natural number as the *probation phase entry condition* of Greatpractice §10.1. |
| **Holding a product release surface** | ≥ 1 external-impact tier 2+ release point + Constellation active | without a *recipient* of the release attestation (external audit / external adopter / external publish), the ROI of an external standard anchor (catalog version + Sigstore Rekor etc.) is 0. Constellation active is the prerequisite of the 5 intents of §8 + the live-board card surface — in the absence of a broker, the *synthesis surface* of the fan-out results falls to ad-hoc. |
| **Hyperbrief + Greatpractice + Superscalar active** | all 3 modules operating at v0.1+ | Ultrasafe = a *synthesis layer* atop the 4 modules. Without Hyperbrief there is no receiver for the 4-score routing (§7), without Greatpractice there is no sink for the promotion path (§9), without Superscalar there is no infrastructure for the read fan-out + retire-barrier (§2). When the 3 modules are not operating, adopting the Ultrasafe spec falls to a *paper rule* (isomorphic to the hook-infrastructure prerequisite of Greatpractice §10.1). |

Additional qualitative conditions (for confirmation after passing the 3 conditions):

- **release frequency** ≥ 1 / month — if lower, manual security audit is more efficient (insufficient denominator for audit cost amortization).
- **module / agent count** ≥ 5 — if fewer, the ROI of cross-axis synthesis (the alignment_matrix of §5) does not justify the retire-barrier synthesis cost.
- **external-impact tier 2+ release ratio** ≥ N% — if there are only Tier 1 (chore / docs / patch), the static gate (the §13.3 Tier 1 floor) alone is sufficient.
- **prior dogfood evidence** ≥ 1 cycle — when a *recurring-omission pattern* in the release cadence and redaction discipline of operational observation has been measured. Baseline measurement before spec adoption recommended.

### §13.2 When NOT to adopt (anti-criteria)

In the following operational forms, adopting Ultrasafe *reverses* the ROI. These are areas where *attacker-perspective fan-out itself is harmful*, so the autonomous-judgement + Hyperbrief-delegation model is superior.

- **One-off task / one-shot work**: if a release occurs only once and does not recur, the amortization denominator of the ≥3 iteration loop is 0. The token cost of an 8-agent fan-out is always an order of magnitude larger than a manual audit single-pass.
- **solo 1-person 1-cycle operation**: without the multi-agent residency of Constellation A2A, if a single agent operates only a single session, the receiver universe of the 5 intents (§8) shrinks to a self-loop + cross-axis confirmation density (§6.2 condition 3) cannot be measured.
- **phronesis-dense work**: areas where the essence of the work is *judgement* — ethical decisions · creative direction · political negotiation · intent inference. Since attacker-perspective fan-out operates atop a *codified threat catalog*, in catalog-less areas there is a *false-threat-fabrication* risk (the same boundary as phronesis-dense in Greatpractice §10.2, a direct application of humanities phronesis + Polanyi tacit knowing).
- **external-mandated discipline dominant environment**: when an organization's existing SOC2 / ISO 27001 / external audit covers the equivalent area, Ultrasafe is a *duplicate governance layer* — risk of double application of the coercive isomorphism of Powell-DiMaggio 1983 (aligned with Greatpractice §10.5).
- **release frequency < 1 / quarter**: the amortization denominator of a manual security audit is more efficient than the fan-out automation cost. The token / latency cost of Ultrasafe is a *fixed cost* of every release, whereas manual audit is a *demand-based variable cost*.

### §13.3 Minimal viable adoption — Tier 1 static gate floor

After passing the 3 conditions of §13.1, if you decide to adopt, **start from the floor**. Running the full 8-agent fan-out + Tier 3 axes from the start falls into the humanities-checklist-bloat + Cluster B (deterministic hook) ROI-flip pitfalls.

```yaml
# MVA: minimal viable adoption first cut
fan-out:       Tier 1 static gates only          # 8-agent X, deterministic invariant catalog only
iteration:     1 iter (no ≥3 loop)               # MVA is single-pass advisory
axis-set:      Tier 1 invariant 5 items          # dogfood-evidence based (operational observation)
                 1) outbox.jsonl single-line JSON valid
                 2) A2A inbound Spotlighting wrapper applied
                 3) public artifact verbatim chat 0 + governance attribution 0
                 4) AGENTS.md / .agent/rules.md change = `chore(governance):` pattern
                 5) Hyperbrief IR audience_profile_fallback Korean auto-localize
hooks:         1 PreToolUse (release trigger)     # `git push --tags` / `gh release create` only
mode:          advisory-only (exit 1 surface, no block)
synthesis:     finding output contract (§4) only  # 3-layer report (§5) not applied — schema only
```

The justification of this floor:

- **Tier 1 axis-set 5 items**: only patterns measured as *actual recurring violations* in the operational observation phase_3 cycle. Avoids *fabrication* of new invariants — only items that pass the *3 occurrences + 2 kinds + verifiable* criterion of the Greatpractice §5 maturation gate enter the floor.
- **single iter (no ≥3 loop)**: if the ≥3 iteration loop (§6) is active in MVA, token cost explodes by *5×*. The ROI of the iteration loop is positive only when the *cross-axis confirmation density* is ≥ 0.3 — at the Tier 1 single-axis static gate stage, density itself cannot be measured.
- **1 hook only**: the Cluster B (deterministic hook) ROI is *linear up to 3-5 hooks, and beyond that fatigue exceeds marginal value* (aligned with Greatpractice §10.5 anti-pattern 3). MVA entry is minimally invasive at 1 hook + advisory mode.
- **advisory-only**: consistent with the v0.1.x mode of §13.5. exit 2 blocking only after entering v0.2.x blocking mode (an FP rate measurement window is required).

After 5-10 MVA operating cycles, via a *retro-audit* measure (a) hook fire frequency, (b) finding count distribution, (c) FP rate → decide the 8-agent axis expansion of the next cut. The *progressive expansion path* after passing the retro-audit:

```
MVA (Tier 1, 5 invariant, 1 iter, advisory)
   ↓ (5-10 cycle dogfood evidence)
Tier 2 axis expansion by 1-2 (AI/LLM + Web/API only, simplified 2-agent fan-out)
   ↓ (5-10 cycle, confirm FP rate < threshold)
Tier 2 full (4-6 axis × iter ≥ 3, 3-layer synthesis report applied)
   ↓ (at external publish time or sufficient dogfood evidence)
Tier 3 full 8 axis × iter ≥ 5 (external publish + cosign + Rekor)
```

### §13.4 Plugin dependency separation (spec only adoption)

Ultrasafe is also a valid path for partial adoption of **adopting the spec (this document) + not adopting the plugin (`plugins/ultrasafe/`)**. The same opt-in optionality as Constellation / Superscalar / Hyperbrief / Greatpractice.

| Adoption mode | Adoption scope | Operational form |
|---|---|---|
| **Full** | spec + plugin (hook · skill · agent · catalog · schema · runtime) | hook automatic enforcement + 8-agent fan-out + 3-layer synthesis + Hyperbrief routing + Greatpractice promotion handled automatically. Passing the §13.1 3 conditions + infrastructure willingness + at Tier 3 release time. |
| **Spec only** | adopt only this document's schema (§4) + synthesis report (§5) + iteration loop (§6) | unify the finding output contract + 3-layer report form as the output format of a manual security audit. plugin runtime not installed, no fan-out. |
| **Schema only** | adopt only the finding output contract (§4) + report not applied | retro-backfill only frontmatter / external_standard_anchor onto existing security audit outputs (CVE report · pentest log). The lightest entry. |
| **Hook subset** | only 1-2 hooks of spec + plugin (pre-push-gate + outbox JSON validation + redaction check) | static gate only without 8-agent fan-out. Matches the §13.3 MVA. Operation where Tier 1 release frequency is dominant. |

The value of Spec-only mode:

- the normative effect of *attestation discipline* comes from the spec itself — the *language* of the external standard anchor (catalog version + freshness_check) + 4-axis severity rubric + clean signal 4-condition AND becomes the framework of the manual audit.
- in the absence of plugin runtime, *fan-out token cost 0* — extracting only the conceptual gain of codification while avoiding the *self-spec-gaming hazard* risk among the Tier A risks of §13.5.
- *preserves the future plugin-adoption path* — if the schema matches, the migration cost of spec-only → full is only adding the hook spec + writing the agent template + installing the runtime.

The explicit limits of Schema-only mode:

- with the finding output contract alone, cross-axis confirmation density cannot be measured → the *cross-axis confirmation count* field of the *applicable subset × evidence-confirmed* definition of the coverage gate (§6.2 condition 3) is fixed at 0. Coverage computation loses meaning.
- the 3-component AND automation of the regression baseline (the fix-target retest + neighbor scan + invariant retest of §6.4) is impossible — increased manual-retest burden.
- secures only external audit-readiness; the *recurrence-prevention* effect only after plugin adoption.

### §13.5 Risk warning — Tier A gap cognitive forcing + v0.1.x advisory-only

Ultrasafe v0.1.0 is not a *completed security attestation system*. The **5 Tier A risk gap items** derived from the completeness critic of the 17-axis cross-domain synthesis were patched into the spec body (§6.3 · §6.4 · §7.3 · §8.x · §12.4), but a *honest disclosure* at the level of cognitive forcing is integrated into this section. Before the adoption decision, you must explicitly recognize the following 5 risks.

**The 5 Tier A risk gap items** (with §-mapping alongside the spec-body patch):

1. **Broker compromise out-of-scope** (§8.x patch) — on Constellation broker server compromise, the trustworthiness of the 5 intents is invalidated. ws-history JSONL tamper → forensic timeline invalidated. v0.1.0 acknowledged out-of-scope, the Sybil-resistant agent registry is deferred to v0.3.x+. Trust in the broker operation itself is an assumption *external to Ultrasafe*.
2. **Coverage definition's cross-axis density dependence** (§6.3 patch) — the coverage % = *applicable subset of catalog × evidence-confirmed* definition depends on the *numerical floor* of cross-axis confirmation density ≥ 0.3 (Tier 2) / ≥ 0.5 (Tier 3). In Tier 1 schema-only mode, density itself cannot be measured → on coverage reporting, only the definition *Tier 1 = applicable subset 50% + untested_classes explicit* is valid. Avoid the absolute meaning of the word "covered" (isomorphic to the *"secure" word ban* of Cluster C8).
3. **Enforcement of the regression baseline's 3-component AND** (§6.4 patch) — fix-target retest + neighbor scan + invariant retest, all 3 components must *pass* to pass the regression-free condition. Partial pass is an advisory warning + Hyperbrief gate trigger. In Tier 1 advisory mode, only the *minimum 1 component* of the 3 is mandatory (fix-target retest) — the remaining 2 components (neighbor scan + invariant retest) are mandatory in v0.2.x.
4. **Schema evolution additive-only + N=2 deprecation** (§12.4 patch) — the schema_version of the finding output contract (§4) evolves *additive only*, breaking changes only after an N=2 minor cut deprecation window. The v0.1.0 → v0.2.x schema break is mandatory accompanied by a *supersedes graph entry of the spec itself* (applying the *per-incuriam* or *overrule* of the Greatpractice §3.4 cost-tiered revision vocabulary).
5. **Strict-mode reconciliation — v0.1.x advisory-only mode enforcement** (§7.3 + this §13.5) — resolving the explicit contradiction of the *"strict-mode default"* of Cluster CT5 (block when evaluation is impossible) and the *advisory-only* of v0.1.0 (no blocking):
   - **v0.1.0 ~ v0.1.x — advisory mode only**: exit 1 surface only, no block. A window for FP rate measurement + tuning.
   - **upon v0.2.x entry — blocking mode transition**: strict-mode default formally applied. Block when evaluation is impossible, no fallback progression.
   - **transition decision = Hyperbrief 4-score gate**: enter v0.2.x only after passing the 3-AND of Score ≥ 4 + operating period ≥ N months (default 3) + FP rate < threshold (default 10%).
   - the contradiction itself is a Greatpractice mezzo node candidate — procedure codification of *"the advisory → blocking mode transition itself is a Hyperbrief gate"*.

**Anti-pattern alert — adoption without Tier A risk recognition**:

If you adopt only the Ultrasafe spec and use it for release blocking or as external audit evidence *without acknowledging* the above 5 risks, two negative externalities occur:

1. **False reassurance**: if the statement "Ultrasafe passed" flows out without the context of *catalog version + coverage % + untested_surfaces[]*, an external adopter / external audit misreads it as a *complete attestation*. The same mechanism as the *"secure" word ban* of Cluster C8 — "passed" too is valid only as the qualified expression *passed coverage X% under catalog v_Y as of date Z*.
2. **Self-spec-gaming hazard** (§11.1): Ultrasafe itself is an attack target. If the 5 Tier A risk items are not acknowledged, it falls to a single signal of *Ultrasafe pass = security OK* → an adversary preferentially attacks axes outside the Ultrasafe catalog (broker tier / schema gap / areas outside the coverage definition).

**Mitigation discipline**:

- at adoption time, *explicit acknowledgement of the 5 Tier A risk items* is a plugin install prerequisite — the first prompt of `eg_ultrasafe_install.cjs` requires explicit confirmation of the 5 risks (a mandatory step of the v0.2.x plugin, the v0.1.0 plugin's explicit disclosure in the README).
- *untested_surfaces[] mandatory in all release attestation output* (the 4th of the 4 mandatory items of §11.1 + a direct application of this §13.5). The attestation itself is a form *including gap acknowledgement*.
- *explicit Hyperbrief gate for the v0.1.x → v0.2.x transition* (the 5th risk above) — automatic blocking-mode entry without maintainer confirm forbidden.

This mitigation is the *self-limiting principle of Ultrasafe* — the meta layer in which a module explicitly states the limits of its own attestation (aligned with the *self-limiting principle* of Greatpractice §10.5).

---

## §14. Runtime Architecture (v0.2.0)

> Where §2 of v0.1.0 was the *design shape of the 8-agent fan-out*, this §14 is the **runtime activation** of that shape — the wire-level spec of how the orchestrator / aggregator / clean-signal-gate / 8 attacker skills / 2 hooks / MCP server connect and in what flow they dispatch. Every output of v0.2.0 is *advisory* — finding report-only, no publish blocking (see §19 mode transition for details). The 5 new Constellation §13.16 intents form the transport surface (see §18 for details). Workflow fan-out (the read fan-out + retire-barrier of Superscalar §3) is the dispatch substrate of this cut.

### §14.1 Runtime component topology (5 surfaces)

The 5 new surfaces of the v0.2.0 runtime — each surface's location / role / adjacent-component relationship:

| # | Surface | Path | Role | Adjacent |
|---|---|---|---|---|
| 1 | **8 attacker SKILL.md** | `plugins/ultrasafe/skills/ultrasafe-<role>/SKILL.md` | Each attacker's system prompt + tool grant + when-to-fire trigger + severity rubric | The main agent (in the orchestrator role) invokes the SKILL via Workflow fan-out, joining findings into the synthesizer (aggregator role) |
| 2 | **PreToolUse hook** | `plugins/ultrasafe/hooks/ultrasafe-trigger.cjs` | Triggers on detection of a publish-equivalent command — advisory mode is report-only | Registered in Claude Code `.claude/settings.json` hooks; self-contained advisory check (reads/records `.ultrasafe/state.json` + stderr surface) |
| 3 | **Stop hook** | `plugins/ultrasafe/hooks/ultrasafe-clean-signal.cjs` | Verifies clean-signal arrival at the cycle-end moment | Registered to the `.claude/settings.json` Stop event; evaluates the 4-condition AND-gate internally within the hook (self-contained) |
| 4 | **MCP server** | `plugins/ultrasafe/mcp/server.cjs` | 5 tools over stdio JSON-RPC (run_fanout / finding_aggregate / clean_signal_check / report_generate / release_gate) | Claude Code MCP or an external client calls over stdio JSON-RPC |
| 5 | **Constellation §13.16 5 intents** | (transport surface; payload schema in §18) | The 5 new A2A intents: finding / iteration-boundary / release-gate / disclosure intake / MPCVD coordination | broker WS + live-board card surface |

> **Logical role ↔ ship surface mapping (normative, v0.2.x)**: The *orchestrator / aggregator / clean-signal-gate* of this §14-§17 are **logical roles**, not separate ship files. In v0.2.x, `runtime/{orchestrator,aggregator,clean-signal-gate}.cjs` is **not shipped**; each role is performed by the following actual surface:
>
> - **orchestrator role** = the main agent's Workflow fan-out (Superscalar §3) + the dispatch-contract envelope (§16.1) of the MCP tool `ultrasafe_run_fanout`.
> - **aggregator role** = the synthesizer skill (agent 8, §15.8) + the MCP tool `ultrasafe_finding_aggregate` (§16.2).
> - **clean-signal-gate role** = the deterministic implementation of the MCP tool `ultrasafe_clean_signal_check` (§16.3) + the self-contained evaluation of the Stop hook (§17.2).
>
> Likewise, the `schemas/{finding,iteration-boundary,release-gate}.schema.json` files and the separated `mcp/tools/*.cjs` modules are not shipped in v0.2.x — the canonical source of the 3 contracts is **the spec body** (§4 finding output contract + §8.1 intent value schema), and the ajv validator of the MCP server (`mcp/server.cjs`) performs a graceful skip when schema files are absent. Shipping separated files is a v0.3+ candidate. Do not read role names as if they were file paths.

### §14.2 Runtime flow — v0.2.0 wire activation of the 5-stage operational pipeline

The v0.2.0 runtime-activation mapping of the 5-stage pipeline of §1.2 (Pre-release trigger → Fan-out → Synthesize at retire-barrier → Iterate ≥3 with multi-condition AND termination → Gate + attest):

```
[Stage 1: Pre-release trigger]
  The PreToolUse hook (§17.1) detects a publish-equivalent command
    → the hook only records advisory state + stderr surface (self-contained, §17.1)
    → the orchestrator role (main agent) takes over — determines tier classification (§10.3) + axis-set selection (§10.4) + iteration_min (§10.5)

[Stage 2: Fan-out]
  The orchestrator role (main agent) calls the MCP tool `ultrasafe_run_fanout` (§16.1)
    → parallel dispatch of the 8 attacker SKILLs (§15) (Workflow fan-out applied)
    → each attacker emits its finding as an ULTRASAFE_FINDING intent (§18.1)

[Stage 3: Synthesize at retire-barrier]
  The aggregator role (synthesizer skill + MCP `ultrasafe_finding_aggregate`) aggregates findings at the retire-barrier
    → calls the MCP tool `ultrasafe_finding_aggregate` (§16.2)
    → cross-axis dedup + severity ranking + correlation
    → emits the ULTRASAFE_ITERATION_BOUNDARY intent (§18.2)

[Stage 4: Iterate ≥3 with multi-condition AND termination]
  The orchestrator role decides the iteration N → N+1 transition
    → calls the MCP tool `ultrasafe_clean_signal_check` (§16.3)
    → 4-condition AND-gate (regression-free + monotonic finding-reduction + coverage-floor + 2 iter consecutive)
    → loops to Stage 2 when the clean signal is not reached, proceeds to Stage 5 when reached

[Stage 5: Gate + attest]
  The clean-signal-gate role (deterministic implementation of MCP `ultrasafe_clean_signal_check`) generates the attestation
    → calls the MCP tool `ultrasafe_report_generate` (§16.4) — generates the 3-layer report
    → calls the MCP tool `ultrasafe_release_gate` (§16.5) — determines the release-gate state
    → emits the ULTRASAFE_RELEASE_GATE intent (§18.3)
    → the Stop hook (§17.2) verifies the clean-signal at the cycle-end moment
    → advisory mode: report-only, no publish blocking
    → blocking mode (v0.3+): publish allowed only after passing the user gate
```

### §14.3 Runtime directory tree (v0.2.x ship unit — actual tree)

```
plugins/ultrasafe/
├── .claude-plugin/
│   └── plugin.json                                  # plugin manifest (v0.2.0 bump)
├── README.md                                        # plugin entry guide + 5 risk acknowledgement
├── skills/
│   ├── ultrasafe-ai-llm-redteam/SKILL.md            # §15.1
│   ├── ultrasafe-web-api-attacker/SKILL.md          # §15.2
│   ├── ultrasafe-supply-chain-auditor/SKILL.md      # §15.3
│   ├── ultrasafe-crypto-reviewer/SKILL.md           # §15.4
│   ├── ultrasafe-social-engineer/SKILL.md           # §15.5
│   ├── ultrasafe-methodology-compliance/SKILL.md    # §15.6
│   ├── ultrasafe-threat-model-lifecycle/SKILL.md    # §15.7
│   └── ultrasafe-synthesizer/SKILL.md               # §15.8 (fan-out sink)
├── hooks/
│   ├── ultrasafe-trigger.cjs                        # PreToolUse hook (§17.1, self-contained)
│   ├── ultrasafe-clean-signal.cjs                   # Stop hook (§17.2, self-contained)
│   └── hooks.json                                   # Claude Code hooks registration
└── mcp/
    ├── server.cjs                                   # MCP server entry — all 5 tools inline in a single file
    └── package.json                                 # MCP server dependencies (ajv, 1 dep)
```

**Not shipped in v0.2.x (exists only as logical role/contract — see the §14.1 mapping note)**: `runtime/{orchestrator,aggregator,clean-signal-gate}.cjs` · `schemas/{finding,iteration-boundary,release-gate}.schema.json` · `mcp/tools/*.cjs`. The operational state is recorded in the adopter repo's `.ultrasafe/` working dir (`state.json` + finding/audit JSONL) — runtime data, not part of the plugin tree. Shipping separated files is a v0.3+ candidate.

### §14.4 Advisory mode declaration (v0.2.x)

Every output of v0.2.0 — finding emits of the 8 attacker skills / triggers of the 2 hooks / returns of the 5 MCP tools / emits of the 5 new Constellation intents — is marked **advisory**. Meaning:

- **report-only**: on finding detection, a dashboard card + outbox.jsonl persistence + a Hyperbrief routing candidate, with zero actual publish blocking.
- **PreToolUse hook's exit code = 0**: always pass-through. The blocking logic is active in the v0.3+ blocking mode.
- **Stop hook is surface only**: when the clean-signal is not reached, only a *warning surface* (stderr alert + the recommended action for the next cycle), no blocking of the current cycle.
- **MCP tool return's `advisory_mode: true` flag**: all 5 tools mandate `advisory_mode: true` in the return value — so the consumer side makes no blocking decision.
- **Constellation intent's `advisory: true` value field**: the `value` body of the 5 new intents mandates `advisory: true` — so that live-board cards + A2A counterparts do not mistake it for a *decisive signal*.

The advisory → blocking transition conditions are specified in §19 (a v0.3+ follow-on cut).

---

## §15. 8-Agent Fan-Out Runtime Detail (v0.2.0)

> Where the 8-agent design table of §2.1 was the *roster shape*, this §15 is the spec of the **SKILL.md runtime detail** of each of those 8 agents — input / output / tools / when-to-fire / severity rubric / advisory mode marking. Each agent's SKILL.md is placed at `plugins/ultrasafe/skills/ultrasafe-<role>/SKILL.md`, and the orchestrator role (the main agent's Workflow fan-out — §14.1 role mapping) invokes it at fanout time.

### §15.1 Agent 1 — AI/LLM Red Team (`skills/ultrasafe-ai-llm-redteam/SKILL.md`)

- **Tone**: technical-precise. The 4-family *direct/indirect prompt injection · model extraction · jailbreak · hallucination-leverage · alignment-faking* + agentic-misalignment probe.
- **Input**: `{target_commit_sha, catalog_versions: {OWASP_LLM_TOP10, EU_AI_ACT_Art15, ATLAS}, iteration: N, prior_findings_set: F_{N-1}}` + Spotlighting-wrapped repo context.
- **Output**: `ULTRASAFE_FINDING` intent emit per finding (see §18.1 wire spec for details). The finding payload contract = the `perspective.primary = "ai-red-team"` variant of the §4 finding output contract (the schema file is not shipped in v0.2.x — see the §14.3 note).
- **Tools**: Read (repo file), Grep (pattern search), Bash (read-only — `git log`, `cat` for spec inspection; mutation prohibited).
- **When to fire**: auto-dispatch when the orchestrator includes `usf-ai-llm` or `usf-ai-agentic` or `usf-ai-aml` in the axis-set (see §3.1 13-axis matrix). Active in all of Tier 1-3 (a minimum mandatory axis in every tier).
- **Severity rubric**: the ai-red-team variant of the 4-tuple (severity × scope × reversibility × external_impact) — `severity ∈ {info, low, medium, high, critical}` × `scope ∈ {single-prompt, agent-level, session-level, persistent}` × `reversibility ∈ {full, partial, none}` × `external_impact ∈ {none, internal-only, public-disclosure-risk}`. Hyperbrief routing (§7) when the 4-tuple sum ≥ 4.
- **Minimum attack diversity** (§2.5.1 mandatory item 1): attempting all 4 families FGSM + PGD + C&W + black-box is mandatory.
- **Advisory mode marking**: `value.advisory: true` on every finding emit (during v0.2.x), `value.would_block_in_v03: bool` as a future blocking-state hint.

### §15.2 Agent 2 — Web/API Attacker (`skills/ultrasafe-web-api-attacker/SKILL.md`)

- **Tone**: web-sec-focused. The web-sec coverage of *OWASP Top 10 · API contract violation · auth-bypass · SQLi/XSS · SSRF · CSRF · open-redirect · IDOR*.
- **Input**: `{target_commit_sha, catalog_versions: {OWASP_WSTG, MITRE_ATTACK_v15, CWE_v4.14}, iteration: N, prior_findings_set: F_{N-1}}` + repo + dependency manifest snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `attack_path_graph_candidate` candidate (v0.2.0 is a *flat list*, promoted to a node/edge graph in v0.3+).
- **Tools**: Read, Grep, Bash (read-only — `git log`, `cat package.json`, `npm ls`, `pip list`; external endpoint calls prohibited).
- **When to fire**: auto-dispatch when the axis-set includes `usf-web-sast-dast` or `usf-web-infra`.
- **Severity rubric**: the priority matrix of CVSS v4 + EPSS + KEV trump (§2.1.2). Auto PR-candidate emit on passing the 6-condition AND gate (§2.1.2) (in v0.2.0 advisory mode this is only a *candidate marking*; actual PR creation is v0.3+).
- **Minimum attack diversity**: attempting all 8 sub-perspectives of OWASP × MITRE ATT&CK (SAST / DAST / API / container / IaC / SSRF / supply-chain dependency / call-graph) is mandatory.
- **Advisory mode marking**: `value.advisory: true` + `value.auto_pr_candidate: bool` (candidate marking only in advisory mode).

### §15.3 Agent 3 — Supply Chain Auditor (`skills/ultrasafe-supply-chain-auditor/SKILL.md`)

- **Tone**: dependency-graph-aware. The 5-way SCS coverage of *dependency vulnerability · SBOM mismatch · typosquatting · signing chain · maintainer history anomaly · transitive vulnerability · reproducibility failure*.
- **Input**: `{target_commit_sha, catalog_versions: {SLSA_v1.0, NIST_SSDF, OSV}, iteration: N, prior_findings_set: F_{N-1}}` + SBOM (CycloneDX / SPDX) + dependency lockfile snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + PURL canonical id + attestation chain (cosign cert + Rekor proof + timestamp) + `maintainer_anomaly_flag`.
- **Tools**: Read, Grep, Bash (read-only — `cosign verify`, `osv-scanner`, `npm audit --json`; external endpoint calls prohibited — local cache only).
- **When to fire**: auto-dispatch when the axis-set includes `usf-supply-chain`.
- **Severity rubric**: OSV CVE match → automatic severity mapping (CVSS) + EPSS weighting. `maintainer_anomaly_flag = true` is *never auto-blocked* — always a human review lane (§2.1.3 cross-axis Contradiction CT1).
- **Auto-block prohibited** (§2.1.3): a maintainer anomaly is *never auto-blocked*. Auto-block candidates are limited to *deterministic signals* (cosign signature mismatch / SLSA provenance absence / OSV CVE match). In v0.2.0 advisory mode, *no finding is ever auto-blocked* — all are report-only.
- **Advisory mode marking**: `value.advisory: true` + `value.would_auto_block_in_v03_blocking: bool` (future blocking hint of a deterministic signal).

### §15.4 Agent 4 — Crypto Reviewer (`skills/ultrasafe-crypto-reviewer/SKILL.md`)

- **Tone**: crypto-formal. The C1-C15 15-pattern catalog coverage of *key management · random source · TLS misuse · signature scheme · constant-time violation · PQC readiness · cryptographic agility envelope*.
- **Input**: `{target_commit_sha, catalog_versions: {Ultrasafe_Crypto_C1-15_v0.1, TLS_1.3_strict_profile}, iteration: N, prior_findings_set: F_{N-1}}` + crypto-related file (key generation / TLS config / signature impl) snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `pattern_id` (C1-C15) + `agility_envelope_status` + `pqc_readiness_metric` + `constant_time_binary_evidence`.
- **Tools**: Read, Grep, Bash (read-only — `openssl`, `nettle-test`, `cryptography-py` test; actual key generation / signing prohibited).
- **When to fire**: auto-dispatch when the axis-set includes `usf-crypto`.
- **Severity rubric**: per-pattern_id severity matrix — C1 (key generation) / C2 (key storage) / C4 (constant-time) are *permanently critical*. A binary constant-time finding + cryptographic key rotation + external endpoint change is *permanently auto-apply prohibited* (§2.1.4 Contradiction CT6) — a forced Hyperbrief escalate regardless of score.
- **Permanent-manual category** (§2.1.4): even in v0.2.0 advisory mode, the *permanent-manual category declaration is maintained* — when every finding's `value.permanent_manual: bool` flag is true, auto-fix remains prohibited even after the advisory → blocking transition.
- **Advisory mode marking**: `value.advisory: true` + `value.permanent_manual: bool` (mandatory marking of the auto-apply-prohibited category).

### §15.5 Agent 5 — Social Engineer (`skills/ultrasafe-social-engineer/SKILL.md`)

- **Tone**: human-factor-aware. The orthogonal fan-out of Cialdini 6 × Hadnagy 9 × FBI 8-elicitation over *phishing surface · docs leak · OPSEC fail · human-factor weakness · prompt-injection signature · A2A inbound Spotlighting bypass attempt*.
- **Input**: `{target_commit_sha, catalog_versions: {HFS_Direct_Catalog_v0.1}, iteration: N, prior_findings_set: F_{N-1}}` + docs (README, CHANGELOG, *.md) + A2A inbound log snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `cialdini_principle` + `hadnagy_vector` + `elicitation_technique` + `injection_canary_status`.
- **Tools**: Read, Grep (sensitive pattern — credential, internal hostname, OPSEC slip), Bash (read-only — `git log --grep` for sensitive commit messages; external channel sends prohibited).
- **When to fire**: auto-dispatch when the axis-set includes `usf-social-eng`. Active in Tier 2+ (Tier 1 patches have low sensitivity).
- **Severity rubric**: a per-cross-tuple severity matrix of Cialdini principle × Hadnagy vector × elicitation technique. The result of an LLM-classifier-based sensitive-topic classification is *always a human gate* — auto-block prohibited (§2.1.5 cross-axis CT1 rule).
- **Human review default**: even in v0.2.0 advisory mode, the *human gate default declaration is maintained* — `value.human_gate_required: true` flag mandatory.
- **Advisory mode marking**: `value.advisory: true` + `value.human_gate_required: true` (LLM-classifier-based is always a human gate).

### §15.6 Agent 6 — Methodology / Compliance (`skills/ultrasafe-methodology-compliance/SKILL.md`)

- **Tone**: process-formal. The 16-cell 2D dispatch matrix of *test methodology gap · coverage cliff · compliance (NIST 800-115 / OSSTMM / OWASP Testing Guide / PTES / ISO 27001:2022 / CIS v8.1)*.
- **Input**: `{target_commit_sha, catalog_versions: {NIST_800-115, OSSTMM, OWASP_WSTG, PTES, ISO_27001_2022, CIS_v8.1}, iteration: N, prior_findings_set: F_{N-1}}` + test artifact (test coverage report · CI log) snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `methodology_anchor` + `iso_theme` + `rav_score` + `cis_control_id` + `catalog_version` + `coverage_percentage_under_catalog` + `untested_classes[]`.
- **Tools**: Read, Grep, Bash (read-only — `git log`, coverage report parse; external compliance scanner calls prohibited).
- **When to fire**: auto-dispatch when the axis-set includes `usf-iam-config` or a methodology-related axis. Active in Tier 2+.
- **Severity rubric**: the RAV-style quantified release gate of a methodology gap (PM §5) + ISO 27001 4-theme × CIS v8.1 mapping.
- **Catalog version mandatory** (§2.1.6): declaring `catalog_version` + `coverage_percentage_under_catalog` + `untested_classes[]` per finding is enforced — use of the word "secure" is prohibited, limited to the expression *"passed coverage X% under catalog v_Y as of date Z"*.
- **Advisory mode marking**: `value.advisory: true` + `value.coverage_attestation: {catalog_version, coverage_pct, untested_classes[]}` (mandatory).

### §15.7 Agent 7 — Threat Model / Lifecycle (`skills/ultrasafe-threat-model-lifecycle/SKILL.md`)

- **Tone**: lifecycle-systematic. The 13-17 cell orthogonal coverage of *threat modeling (STRIDE per-Element/per-Interaction · LINDDUN 7-category · UKC 18-phase) · incident lifecycle (PICERL 6-phase) · disclosure timing · attack-defense tree · secondary-surface iteration guard*.
- **Input**: `{target_commit_sha, catalog_versions: {STRIDE_v1, LINDDUN_v3.0, UKC_v2.0, LM_CKC_v1, PTE_Protocol_Matrix_v0.1}, iteration: N, prior_findings_set: F_{N-1}}` + architecture diagram (manual input or doc reference) + lifecycle metadata snapshot.
- **Output**: `ULTRASAFE_FINDING` intent + `stride_category` + `linddun_category` + `ukc_phase` + `pte_layer` + `lifecycle_stage` + `secondary_surface_origin_id`.
- **Tools**: Read (architecture doc), Grep (lifecycle pattern), Bash (read-only — `git log`, signature verify; external PKI calls prohibited).
- **When to fire**: auto-dispatch when the axis-set includes `usf-stride` or `usf-linddun` or `usf-kill-chain` or `usf-protocol-lifecycle`. Active in Tier 2+.
- **Severity rubric**: the cross-cell severity matrix of STRIDE + LINDDUN + UKC. Bottom-up propagation of attack-defense tree fragments (TM §2). Secondary-surface iteration guard — extracting the diff of F_{N+1} = (F_N − sealed) + secondary_new is mandatory.
- **TOFU hardening** (PTE §2): admit-time Ed25519 signature + DID registration + trust anchor lifetime metadata mandatory (declaration maintained even in advisory mode).
- **Advisory mode marking**: `value.advisory: true` + `value.secondary_surface_diff: {sealed_prior, new_secondary}` (mandatory, the input to the regression baseline computation).

### §15.8 Agent 8 — Synthesizer (fan-out sink) (`skills/ultrasafe-synthesizer/SKILL.md`)

- **Tone**: synthesis-meta. The retire-barrier synthesis alone of *cross-axis dedup + severity ranking + correlation + 3-layer report generation of the 7 attacker findings*.
- **Input**: `{iteration: N, finding_set_from_7_attackers: [F_1, ..., F_7], catalog_versions: {...}, agent_roster_snapshot_hash: sha256(...)}` + the prior iteration-boundary snapshot.
- **Output**: 3-layer hybrid (see §3 synthesis report format + §18.2 ITERATION_BOUNDARY wire spec for details):
  - **Layer 1**: OSCAL Assessment Result (`oscal.findings[]` + `oscal.iteration_summary` 4-set diff + `oscal.alignment_matrix`).
  - **Layer 2**: Hyperbrief 9-section IR (per finding with score ≥ 4).
  - **Layer 3**: Greatpractice tree entry candidate (auto-classified macro / mezzo / micro).
- **Tools**: Read (prior iteration-boundary JSONL), Grep (finding cross-correlate), Bash (read-only — JSON aggregate · BLAKE3 hash compute; mutation prohibited).
- **When to fire**: auto-dispatch when the orchestrator has completed all finding emits of the 7 attackers (at the retire-barrier moment). Active in all of Tier 1-3.
- **Synthesis rubric**:
  - BFT quorum 2f+1 (n=7, tolerates up to f=2) → `confirmed` tier when the same finding is reported by 5 agents, `needs-corroboration` when reported by f+1=3 agents, `low-confidence draft` when reported by a single agent.
  - Diversity-enforced source independence (MAD §2 + §3.2) — enforces the 3-tuple (perspective × prompt_template_hash × seed) distinct ≥ 3.
  - ACH matrix multi-hypothesis (CDB §1) — presents multiple hypotheses for the same finding.
  - CIM normalization tri-format export (SVD §4) — SARIF 2.1.0 + STIX 2.1 bundle + ATT&CK Navigator JSON layer.
- **Coverage definition** (§6.3 + §2.1.8): `coverage_percentage_under_catalog` = (catalog cells explored / total cells of that catalog) — an *explicit measurement in units of catalog cells*, not a simple "0 found" ambiguous "clean". The `untested_classes[]` of each iteration boundary is mandatory.
- **Self-spec-gaming hazard check** (§2.5): avoiding the risk that the synthesizer itself is a spec-gaming target — the broker (§2.5.2) performs 4 mandatory checks (attack family coverage / token consumption distribution / external_standard_anchor presence / untested_surfaces[] non-empty) as an *external process*. A broker hit is a Hyperbrief MUST-trigger.
- **Advisory mode marking**: ITERATION_BOUNDARY's `value.advisory: true` + `value.clean_signal_4_condition_AND_gate_state: {regression_free, monotonic, coverage_floor, consecutive_2_iter}` (mandatory) + `value.would_release_in_blocking_mode: bool` (future blocking-state hint).

### §15.9 8-agent dispatch sequence (Workflow fan-out applied)

```
orchestrator role (main agent — Workflow fan-out, §14.1 mapping)
  ↓ Phase A (read-only enumeration, Stackelberg leader observation, §3.2)
  ↓ parallel dispatch of the 7 attackers (1-7) — Workflow fan-out
  ↓ each attacker SKILL invoke + tool grant (Read / Grep / Bash read-only)
  ↓ each attacker emits an ULTRASAFE_FINDING intent (§18.1)
  ↓
[retire-barrier]
  ↓ the orchestrator role awaits completion of the 7 attackers
  ↓ Phase B (informed best-response attack simulation, Stackelberg follower, §3.2)
  ↓ synthesizer (agent 8) dispatch — Workflow fan-out sink
  ↓ synthesizer SKILL invoke + aggregate of the 7 attacker findings
  ↓ emits an ULTRASAFE_ITERATION_BOUNDARY intent (§18.2)
  ↓
orchestrator role → clean-signal-gate role
  ↓ calls the MCP tool `ultrasafe_clean_signal_check` (§16.3)
  ↓ evaluates the 4-condition AND-gate
  ↓
clean signal not reached → loop to iteration N+1 (re-enter Stage 2)
clean signal reached → calls the MCP tool `ultrasafe_report_generate` (§16.4)
  ↓ generates the 3-layer report
  ↓ emits an ULTRASAFE_RELEASE_GATE intent (§18.3)
  ↓ advisory mode: report-only (no publish blocking)
  ↓ blocking mode (v0.3+): publish allowed only after passing the user gate
```

Workflow fan-out application evidence: the orchestrator role (main agent) dispatches the 7 attackers *in parallel* (the Superscalar §3 read fan-out pattern) + synthesizer single-sink synthesis at the retire-barrier — a runtime upgrade from the *single-thread serial* assumption of the v0.1.0 design to the *parallel fan-out* of v0.2.0.

---

## §16. MCP Server Tools (v0.2.0)

> The 5 MCP tools of v0.2.0 — `ultrasafe_run_fanout` / `ultrasafe_finding_aggregate` / `ultrasafe_clean_signal_check` / `ultrasafe_report_generate` / `ultrasafe_release_gate` — are exposed through the stdio JSON-RPC interface of `plugins/ultrasafe/mcp/server.cjs`. Each tool's input/output schema + tool-level deterministic guarantee + mandatory advisory mode return flag.

### §16.1 `ultrasafe_run_fanout` — parallel dispatch of the 8 attackers

- **Description**: parallel dispatch of the 7 attackers (agent 1-7) + synthesizer (agent 8) synthesis at the retire-barrier. The fan-out entry point of v0.2.0.
- **Input schema**:
  ```json
  {
    "target_commit_sha": "string (40-char hex)",
    "tier": "1 | 2 | 3",
    "axis_set": "string[] (e.g., ['usf-ai-llm', 'usf-web-sast-dast', ...])",
    "iteration": "integer (≥ 1)",
    "prior_findings_set": "Finding[] (F_{N-1} of the prior iteration)",
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
- **Tool-level deterministic guarantee**: for identical input (target_commit_sha + tier + axis_set + iteration + prior_findings_set + catalog_versions + agent_roster_snapshot_hash), the output's `findings` set is deterministic — the agent diversity 4-tuple hash is pinned so that LLM stochasticity varies only *within an iteration boundary*, and a re-call with identical input returns the identical finding set.
- **Advisory mode**: `output.advisory_mode = true` mandatory. `value.advisory: true` on every finding.

### §16.2 `ultrasafe_finding_aggregate` — cross-axis dedup + severity rank

- **Description**: cross-axis synthesis of the 7 attacker findings — dedup + severity ranking + correlation + 3-layer report generation. The retire-barrier stage of `ultrasafe_run_fanout` invokes this tool.
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
    "deduped_findings": "Finding[] (after cross-axis synthesis)",
    "severity_ranked_findings": "Finding[] (severity desc sorted)",
    "correlation_map": "{[finding_id]: finding_id[] (correlated findings)}",
    "confirmation_tier": "{[finding_id]: 'confirmed' | 'needs-corroboration' | 'low-confidence draft'}",
    "synthesis_layer_1_oscal": "object",
    "synthesis_layer_2_hyperbrief": "object[]",
    "synthesis_layer_3_greatpractice": "object[]"
  }
  ```
- **Tool-level deterministic guarantee**: dedup algorithm = (file × line × pattern_id) 3-tuple match → merge. Severity ranking = the lexicographic order of the (severity × scope × reversibility × external_impact) 4-tuple. Confirmation tier decision = the deterministic count of BFT quorum 2f+1 (n=7, f=2).
- **Advisory mode**: `output.advisory_mode = true` mandatory.

### §16.3 `ultrasafe_clean_signal_check` — 4-condition AND-gate

- **Description**: the clean-signal-gate evaluation for the iteration N → N+1 transition or release-entry decision. The deterministic check of the 4-condition AND-gate.
- **Input schema**:
  ```json
  {
    "iteration": "integer (≥ 3)",
    "current_findings": "Finding[] (F_N)",
    "prior_findings": "Finding[] (F_{N-1})",
    "regression_baseline": "Finding[] (sum of the final finding set of the prior release's ITER + the ITER 1 finding set of this release)",
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
- **Tool-level deterministic guarantee**: *every sub-condition of the 4-condition AND-gate is a deterministic predicate* — numerical comparison only, no LLM judgment. K-iteration window trend = the monotonic descending check of `findings_count[N], findings_count[N-1], findings_count[N-2]`.
- **Advisory mode**: `output.advisory_mode = true` mandatory. Even when `clean_signal_reached = true`, in v0.2.0 it is only *recommended_action = 'release_ready_advisory'*, with no actual publish-block/allow decision.

### §16.4 `ultrasafe_report_generate` — 3-layer report generation

- **Description**: at the clean-signal-arrival or max_iter-arrival moment, generates the 3-layer synthesis report — OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate.
- **Input schema**:
  ```json
  {
    "iteration_history": "IterationBoundary[]",
    "final_findings": "Finding[]",
    "clean_signal_state": "object (the output of §16.3)",
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
      "attestation_text": "string (limited to the expression \"passed coverage X% under catalog v_Y as of date Z\")"
    },
    "layer_2_hyperbrief_irs": "HyperbriefIR[] (score ≥ 4 finding)",
    "layer_3_greatpractice_candidates": "GreatpracticeTreeEntry[] (auto-classified macro/mezzo/micro)",
    "sarif_2_1_0_export": "object (SARIF bundle)",
    "stix_2_1_export": "object (STIX bundle)",
    "attack_navigator_layer": "object (ATT&CK Navigator JSON layer)"
  }
  ```
- **Tool-level deterministic guarantee**: the 3-layer report's schema is pinned — OSCAL v1.1.0 + Hyperbrief.md §1 9-section schema + Greatpractice.md §3 schema. The attestation text's format is limited to *"passed coverage X% under catalog v_Y as of date Z"* — the word *"secure"* is permanently prohibited.
- **Advisory mode**: `output.advisory_mode = true` mandatory. The report's `attestation_text` declares *advisory-only* — *"advisory-mode report — not a blocking attestation"* prefix.

### §16.5 `ultrasafe_release_gate` — release-gate state query

- **Description**: a query of the release-gate's current state + emit of the input to Hyperbrief 4-score routing. In v0.2.0 advisory mode this is *state query only*, with no publish-block/allow decision.
- **Input schema**:
  ```json
  {
    "iteration": "integer",
    "clean_signal_state": "object (the output of §16.3)",
    "report": "object (the output of §16.4)",
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
    "hyperbrief_id": "string | null (on escalation)",
    "methodology": "string[] (NIST/OSSTMM/OWASP/PTES 4-tuple default)",
    "would_block_in_v03_blocking": "bool",
    "user_gate_required_in_v03": "bool"
  }
  ```
- **Tool-level deterministic guarantee**: verdict decision = the deterministic predicate of clean_signal_state.clean_signal_reached + findings_residual.severity_max + tier. Grading = the lexicographic mapping of (severity_max × external_impact_max × tier).
- **Advisory mode**: `output.advisory_mode = true` mandatory. Even when the verdict is *'release_advisory'*, in v0.2.0 there is no publish-block/allow decision — it is enforced *so that the consumer side (Claude Code / orchestrator) recognizes advisory mode and makes no blocking decision*.

### §16.6 MCP server entry — `server.cjs` structure

A structure sketch of the actual implementation (`plugins/ultrasafe/mcp/server.cjs`) — implementing stdio JSON-RPC framing directly without a `@modelcontextprotocol/sdk` dependency (mirroring the convention of the hyperbrief MCP server):

```javascript
// plugins/ultrasafe/mcp/server.cjs (v0.2.x — actual implementation structure, single file)
const ADVISORY_MODE = true;        // v0.2.x — false in the v0.3+ blocking cut
const BLOCKING_IN_V03 = true;      // encloses a future blocking hint in every return

// all 5 tool handlers inline in this file — separating into mcp/tools/*.cjs is a v0.3+ refactor candidate
// (each handler directly encloses advisory_mode: ADVISORY_MODE in the return)
const TOOLS = [ /* name + description + inputSchema of run_fanout / finding_aggregate / clean_signal_check / report_generate / release_gate */ ];

// ajv lazy validator — returns null when schemas/*.schema.json files are absent (graceful skip, §14.3 note)
function getValidator(schemaPath) { /* ajv compile or null */ }

const handlers = {
  "tools/list": async () => ({ tools: TOOLS }),
  "tools/call": async (params) => { /* handler dispatch + JSON-RPC result wrap */ },
};
process.stdin.setEncoding("utf8");
process.stdin.on("data", /* line-delimited JSON-RPC parse → handlers dispatch → stdout response */);
```

The npm dependency is ajv only (1 dep). Determinism is enforced by an input-hash → output-binding contract (canonical JSON sha256) — a cache hit on the same key returns the same aggregate.

---

## §17. Hooks Spec — PreToolUse + Stop (v0.2.0)

> The 2 hooks of v0.2.0 — PreToolUse `ultrasafe-trigger.cjs` + Stop `ultrasafe-clean-signal.cjs` — and the spec of their registration / condition / action. Both hooks are *advisory mode* — exit code 0 + stderr alert + surface only, with no actual blocking.

### §17.1 PreToolUse hook — `ultrasafe-trigger.cjs`

- **Location**: `plugins/ultrasafe/hooks/ultrasafe-trigger.cjs`
- **Hook event**: `PreToolUse` (Claude Code SDK hook event)
- **Matcher**: `Bash` (just before a Bash tool call)
- **Trigger condition**: on a publish-equivalent command matcher match. Based on the 7 matchers of §10.1, the actual implementation expands to **15 patterns** (word-boundary anchored, conservative against false-positives) — npm/pnpm/yarn publish · twine/pip upload · cargo publish · gem push · go install @version · dotnet nuget push · docker push · gh release create · git push --tags/--follow-tags · helm push/repo index · terraform apply/push. (`gh pr merge` of §10.1 is excluded from the actual-implementation matcher — a conservative judgment that a merge is not publish-equivalent; revisited on the blocking-mode transition.)
- **Action** (v0.2.x advisory mode — the hook is self-contained, detection + surface only):
  1. classify the publish channel (15-pattern match)
  2. read `.ultrasafe/state.json` — recover the prior iteration boundary + clean-signal-gate state (when absent, "no prior runs")
  3. emit an `ULTRASAFE_RELEASE_GATE` intent envelope to the Constellation outbox (`stage: pre-publish-detected`, `mode: advisory`) — when the outbox is available
  4. record the pre-publish event in `.ultrasafe/state.json` — for downstream consumption by the main agent (orchestrator role) + Stop hook
  5. **emit 1 line of stderr advisory** — a gate-state summary
  6. **exit code 0** — pass-through (the publish command proceeds normally)

  The driving of this cycle (tier classification (§10.3) → axis-set selection (§10.4) → iteration_min (§10.5) → calls to the 5 MCP tools (§16)) is performed not by the hook but by the **main agent (orchestrator role)**, which receives the hook surface (§14.1 role mapping).
- **Registration** (`.claude/settings.json` or `plugins/ultrasafe/hooks/hooks.json`):
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
- **Advisory mode declaration**: every stderr alert of this hook mandates the *"[ULTRASAFE ADVISORY]"* prefix. exit code 0 fixed — *no finding ever blocks publish*.
- **Blocking mode transition (v0.3+)**: clean_signal_reached = false or findings_residual.severity_max ≥ high → exit code 1 (block) — requires passing the user gate (Hyperbrief 4-score gate or an explicit `--allow-with-risk` flag). In v0.2.x, *exit code 1 never*.

### §17.2 Stop hook — `ultrasafe-clean-signal.cjs`

- **Location**: `plugins/ultrasafe/hooks/ultrasafe-clean-signal.cjs`
- **Hook event**: `Stop` (Claude Code SDK turn-end event)
- **Trigger condition**: at every turn-end moment — when there is something to evaluate in `.ultrasafe/state.json` (an iteration in progress or a pending pre-publish gate event exists; silent pass when neither).
- **Action** (v0.2.x advisory mode — self-contained evaluation within the hook, no MCP server call):
  1. query `.ultrasafe/state.json` — the current iteration N + finding/coverage state
  2. evaluate the 4-condition AND-gate directly within the hook (same deterministic logic as MCP `ultrasafe_clean_signal_check`) — record each sub-condition boolean + AND result + timestamp in the state's `clean_signal` block
  3. if a `pre-publish-detected` event left by the PreToolUse hook exists, advance the stage to `post-cycle-evaluated` + annotate with the clean-signal result
  4. emit an `ULTRASAFE_ITERATION_BOUNDARY` envelope to the Constellation outbox only when the orchestrator role has marked `pending_iteration_boundary = true`
  5. **emit 1 line of stderr advisory** — display *"[ULTRASAFE ADVISORY] iteration N: ... unmet: <conditions>"* when the clean signal is not reached (silent when there is nothing to evaluate)
  6. **exit code 0** — pass-through (the turn ends normally)
- **Registration** (`.claude/settings.json` or `plugins/ultrasafe/hooks/hooks.json`):
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
- **Advisory mode declaration**: every stderr alert of this hook mandates the *"[ULTRASAFE ADVISORY]"* prefix. exit code 0 fixed — *no cycle is ever blocked*.
- **Relationship with the cycle-end probe**: this hook is orthogonal to the *cycle-end probe of Constellation §13.16.10* — the Constellation cycle-end probe concerns inbox/outbox consistency, while the Ultrasafe Stop hook concerns the clean-signal state of the iteration boundary. The two hooks may be registered to the same Stop event — the hooks array of `.claude/settings.json` calls both.

### §17.3 `hooks.json` unified registration

The unified registration manifest of `plugins/ultrasafe/hooks/hooks.json` — the Claude Code plugin loader reads this file and auto-merges it into the hooks section of settings.json (actual-file excerpt):

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/ultrasafe-trigger.cjs\" --tool=Bash" }
      ]
    }
  ],
  "Stop": [
    {
      "matcher": "*",
      "hooks": [
        { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/ultrasafe-clean-signal.cjs\"" }
      ]
    }
  ]
}
```

The hook reads the Bash command body not from an argument but from the **hook payload on stdin** (`--tool=Bash` is a tool-identification hint).

### §17.4 Hook actual-implementation structure — `ultrasafe-trigger.cjs`

The operational structure of the actual file (`plugins/ultrasafe/hooks/ultrasafe-trigger.cjs`) — self-contained without an external process spawn:

```
1. read the hook payload (Bash tool input) from stdin (readStdinSync)
2. classify the channel with the 15-pattern publish-equivalent matcher (word-boundary anchored) — exit 0 on no match
3. read .ultrasafe/state.json — recover the prior iteration boundary + clean-signal-gate state
4. emit an ULTRASAFE_RELEASE_GATE envelope to the Constellation outbox
   (stage=pre-publish-detected, mode=advisory — when the outbox is available; standalone uses a file-state fallback)
5. record the pre-publish event in .ultrasafe/state.json (downstream consumption by the Stop hook + orchestrator role)
6. 1 line of stderr advisory ("[ULTRASAFE ADVISORY] ..." prefix) + exit 0
```

v0.2 advisory invariant: **never blocks (always exit 0)**. In blocking mode (v0.3+), when the clean-signal is not reached + the user gate is active, this is scheduled to transition to exit 2. Mirrors the structural pattern of the hyperbrief PreToolUse hook (advise mode + stderr surface + Constellation outbox emit + standalone file-state fallback).

### §17.5 Hook actual-implementation structure — `ultrasafe-clean-signal.cjs`

The operational structure of the actual file (`plugins/ultrasafe/hooks/ultrasafe-clean-signal.cjs`) — evaluating the 4-condition AND-gate directly within the hook without requiring the MCP server (self-contained; a mirror of the same deterministic logic as MCP `ultrasafe_clean_signal_check`):

```
1. detect the repo root (.git or .ultrasafe upward search) → read .ultrasafe/state.json
   — silent exit 0 when there is nothing to evaluate (no iteration + no pending gate event)
2. evaluate the 4-condition AND-gate:
   ① regression_free — 0 new findings versus the prior iteration's resolved set (≥ severity threshold)
   ② monotonic_finding_reduction — total open findings strictly non-increasing
   ③ coverage_floor — fan-out coverage (run/configured) ≥ floor
   ④ consecutive_clean_iterations ≥ 2
3. record the per-condition boolean + AND result + timestamp in the state.clean_signal block
4. if a pre-publish-detected event exists, advance the stage to post-cycle-evaluated + annotate the result
5. emit an ULTRASAFE_ITERATION_BOUNDARY envelope to the Constellation outbox
   only when state.pending_iteration_boundary = true
6. 1 line of stderr advisory ("[ULTRASAFE ADVISORY] iteration N: ... unmet: <list>") + exit 0
```

v0.2 advisory invariant: **never blocks (always exit 0)**. In blocking mode (v0.3+), the publish gate is scheduled per the AND-gate result. Mirrors the structural pattern of the hyperbrief Stop hook.

---

## §18. Constellation integration — runtime wire of the 5 new intents (v0.2.0)

> Where the 5 new A2A intents of §8 (ULTRASAFE_FINDING / ITERATION_BOUNDARY / RELEASE_GATE / SECURITY_DISCLOSURE_INTAKE / MPCVD_COORDINATION) were a *design schema* in v0.1.0, this §18 is the **runtime wire activation** of that schema — the runtime wiring of registering the 5 names in the A2A-intent allowlist of Constellation §13.16 + applying ack_tier + mandatory payload-schema verification + automatic application of the Spotlighting wrapper + live-board card surface. All 5 intents of v0.2.0 are *advisory* — finding emit is a dashboard surface + outbox.jsonl persistence, with no actual publish-block/allow decision.

### §18.1 `ULTRASAFE_FINDING` — runtime wire spec

- **Direction**: red-team agent → main / dashboard
- **ack_tier**: `commitment` (the application-tier of Constellation §13.13)
- **paired companion**: none (standalone envelope)
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
      "evidence_ref": "string (sarif:// or stix:// URI)",
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
- **Constellation §13.16 registration**: `ULTRASAFE_FINDING` is added to the A2A-intent allowlist — when `targetAgentId` is unspecified, the fail-safe default branch (§13.16.9) routes to the main agent inbox, and the watcher's meaningful-inbound filter recognizes it as a wake target.
- **Automatic application of the Spotlighting wrapper** (§8.2): at the inbox cursor advance moment, the `<<UNTRUSTED_A2A name="ULTRASAFE_FINDING" sender="..." iso="...">>...<<END_UNTRUSTED_A2A>>` fence is auto-inserted.
- **Live-board card** (§8.5 Tier 2): one card slides in per finding — severity color (5×5 cell) + MITRE ATT&CK technique badge + Kill Chain phase lane + 1-line evidence.
- **Advisory mode declaration**: `value.advisory: true` mandatory. The live-board card's corner badge displays *"ADVISORY"*.

### §18.2 `ULTRASAFE_ITERATION_BOUNDARY` — runtime wire spec

- **Direction**: orchestrator → main / dashboard
- **ack_tier**: `commitment`
- **paired companion**: none
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
- **Constellation §13.16 registration**: `ULTRASAFE_ITERATION_BOUNDARY` added to the allowlist.
- **Live-board card** (§8.5 Tier 3): iteration-boundary card — delta heatmap (resolved=green / new=red / regressed=orange) + a cumulative metric 3-tuple.
- **External commit channel**: SARIF 2.1.0 + STIX 2.1 bundle + ATT&CK Navigator JSON layer consume the same body — evidence persistence via a separate commit.
- **Advisory mode declaration**: `value.advisory: true` mandatory.

### §18.3 `ULTRASAFE_RELEASE_GATE` — runtime wire spec

- **Direction**: orchestrator → main
- **ack_tier**: `decided` (the same application-tier as Hyperbrief — a user-side signed receipt)
- **paired companion**: `HyperbriefCard` (when verdict='escalate')
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
      "attestation_text": "string (the expression limited to \"passed coverage X% under catalog v_Y as of date Z\" + \"ADVISORY MODE\" prefix)",
      "_sig": "string (Ed25519 signature of the value body — avoids broker compromise)"
    }
  }
  ```
- **Constellation §13.16 registration**: `ULTRASAFE_RELEASE_GATE` added to the allowlist + application-tier of `ack_tier='decided'` applied (user signed receipt).
- **paired HyperbriefCard**: when `verdict='escalate'`, a `HyperbriefCard` is emitted together with the same `parentId` — the live-board renders it as one card (§8.1 paired-envelope pattern).
- **Live-board card** (§8.5 Tier 3): release-gate card — verdict badge + grading badge + paired HyperbriefCard link (when escalate).
- **Out-of-band verification** (§8.4): avoiding broker compromise — a mandatory `value._sig` Ed25519 signature + user-side dashboard direct-view cross-verification.
- **Advisory mode declaration**: `value.advisory: true` mandatory + `value.attestation_text` carries the *"ADVISORY MODE"* prefix.

### §18.4 `SECURITY_DISCLOSURE_INTAKE` — runtime wire spec

- **Direction**: external researcher gateway → main
- **ack_tier**: `commitment` + authentication layer (`value._sig` Ed25519 mandatory)
- **paired companion**: none (standalone)
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
      "_sig": "string (Ed25519 signature of the value body)"
    }
  }
  ```
- **Constellation §13.16 registration**: `SECURITY_DISCLOSURE_INTAKE` added to the allowlist + authentication layer mandatory (an envelope failing signature verification is *server-side blocked* before routing to the main inbox).
- **Authentication layer**: borrows the PKI chain-of-trust pattern of protocol-trust-evolution §1.4 — an Ed25519 signature field mandatory in `value._sig` + the broker cross-verifies reporter_did + reporter_public_key against a pre-registered trust anchor.
- **Greatpractice promotion path** (§9): when a new disclosure pattern accumulates N times, a Greatpractice mezzo node is auto-promoted.
- **Advisory mode declaration**: `value.advisory: true` — in v0.2.0 there is no automation of processing after disclosure receipt, manual triage only.

### §18.5 `MPCVD_COORDINATION` — runtime wire spec

- **Direction**: coordinator ↔ multi-party vendor
- **ack_tier**: `decided`
- **paired companion**: a self-broadcast cohort (all vendors are paired companions of the same cohort)
- **Payload schema** (v0.2.0):
  ```json
  {
    "type": "CUSTOM",
    "name": "MPCVD_COORDINATION",
    "targetAgentId": "string (vendor agent id, 'cohort:*' on broadcast)",
    "value": {
      "mpcvd_id": "string (UUID, cohort identifier)",
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
- **Constellation §13.16 registration**: `MPCVD_COORDINATION` added to the allowlist + `ack_tier='decided'` applied + broadcast cohort pattern (the paired companion is every vendor of its own cohort).
- **Out-of-band verification** (§8.4): avoiding broker compromise — a mandatory `value._sig` Ed25519 signature + cross-verification over a separate channel (Hyperbrief md_permalink + user-side dashboard direct view).
- **embargo state machine**: the 4-state machine `draft` → `embargo_active` → `embargo_lifted` → `public_disclosure`, where each transition proceeds only after passing the `decided` ack of every vendor in the cohort.
- **Advisory mode declaration**: `value.advisory: true` — in v0.2.0 there is no automatic progression of the coordination state machine, manual coordinator decision only.

### §18.6 Constellation §13.16 register (at the v0.2.0 ship point)

At this cut's ship point, registering the 5 new names in the A2A-intent allowlist of Constellation §13.16.9 is mandatory:

| Name | Category | ack_tier | Spotlighting wrap | Outbox routing |
|---|---|---|---|---|
| `ULTRASAFE_FINDING` | A2A-intent | `commitment` | mandatory | self-board (not a reply pattern — broadcast) |
| `ULTRASAFE_ITERATION_BOUNDARY` | A2A-intent | `commitment` | mandatory | self-board |
| `ULTRASAFE_RELEASE_GATE` | A2A-intent | `decided` | mandatory + signature | self-board |
| `SECURITY_DISCLOSURE_INTAKE` | A2A-intent | `commitment` + auth | mandatory + signature verification | self-board (server-side filter) |
| `MPCVD_COORDINATION` | A2A-intent | `decided` | mandatory + signature | broadcast (cohort) |

The registration of the 5 names is accompanied by an update of the 4-group classification table of Constellation.md §13.16.9 + N-way sync (adding an AGENTS.md §5.8 entry) — in the same cut, Ultrasafe.md + Constellation.md + the plugin manifest are all updated.

---

## §19. Advisory vs Blocking Mode — v0.2.x advisory + v0.3+ blocking transition conditions (v0.2.0)

> If §13.5 of v0.1.0 was the *design intent of the advisory → blocking transition*, then this §19 is the **specification of measurable conditions at the runtime activation point** of that intent — justification for keeping advisory mode during v0.2.x + the 3-AND condition for the v0.3+ blocking mode transition (reaching the clean-signal-gate 4-condition AND-gate + passing the user gate + ≥3 iteration consecutive clean) + the Hyperbrief gate for the transition decision itself.

### §19.1 Operational meaning of v0.2.x advisory mode

During v0.2.x (from v0.2.0 ship → before the v0.3.0 cut), all outputs of the Ultrasafe runtime are *advisory*:

| Output surface | Advisory meaning |
|---|---|
| finding emit of the 8 attacker SKILLs | dashboard card + outbox.jsonl persistence + Hyperbrief routing candidate. No publish blocking. |
| PreToolUse hook `ultrasafe-trigger.cjs` | exit code 0 fixed. stderr alert only, publish command proceeds normally. |
| Stop hook `ultrasafe-clean-signal.cjs` | exit code 0 fixed. stderr alert only, cycle terminates normally. |
| return of the 5 MCP tools | `output.advisory_mode: true` mandatory. Forces the consumer side not to make blocking decisions. |
| 5 Constellation intent emits | `value.advisory: true` mandatory. The live-board card shows a corner badge *"ADVISORY"*. |
| attestation text of the 3-layer report | *"ADVISORY MODE"* prefix mandatory. The qualified expression *"passed coverage X% under catalog v_Y as of date Z"* + advisory prefix. |

Operational purpose during v0.2.x:
- **FP rate baseline collection**: measure the proportion among the 8 attackers' findings that are *false positives rather than actual vulnerabilities*. When below the FP rate threshold (default 10%), a candidate for the blocking mode transition.
- **Dogfood evidence accumulation**: ≥ 5 cycles of dogfood execution + recording the clean-signal-gate evaluation of each cycle. Evidence accumulation is a prerequisite for the blocking mode transition.
- **Self-spec-gaming hazard verification**: the 4 mandatory items of §2.5 + hit-pattern analysis of the broker (§2.5.2) — tracking which finding's promotion path is a *spec-gaming reward*.
- **Codification of the advisory → blocking transition procedure**: this section itself is a Greatpractice mezzo node candidate — promotion of the "Ultrasafe advisory → blocking transition procedure".

### §19.2 Blocking mode transition 3-AND condition (v0.3+)

The v0.2.x → v0.3+ blocking mode transition proceeds only when **all of the following 3 conditions** are satisfied:

| # | Condition | Measurement | Threshold |
|---|---|---|---|
| 1 | **Reaching the clean-signal-gate 4-condition AND-gate** | `clean_signal_reached = true` of `ultrasafe_clean_signal_check` maintained for ≥ N consecutive cycles | N ≥ 5 cycles |
| 2 | **Passing the user gate** | passing the maintainer's explicit Hyperbrief 4-score gate — score ≥ 4 + operational period ≥ 3 months + FP rate < 10% | escalation decision of the Hyperbrief IR = "blocking_mode_transition_approved" |
| 3 | **≥3 iteration consecutive clean** | clean signal reached at every iteration boundary of the previous N releases | N ≥ 3 releases × ≥ 3 iterations |

When all 3 conditions are satisfied, blocking mode default activates at the v0.3.0 cut. If not met, v0.2.x advisory mode is retained.

### §19.3 Operational meaning of blocking mode (v0.3+)

Runtime changes after the blocking mode transition:

| Output surface | Blocking meaning |
|---|---|
| PreToolUse hook | when `clean_signal_reached = false` or `findings_residual.severity_max ≥ high`, **exit code 1** — publish command blocked. Passing the user gate (Hyperbrief 4-score gate or explicit `--allow-with-risk` flag) required. |
| Stop hook | when `clean_signal_reached = false` + iteration max_iter reached, **exit code 1** — cycle blocked, Hyperbrief MUST-trigger activated. |
| return of the 5 MCP tools | `output.advisory_mode: false`. The consumer side makes the actual block/allow decision according to the verdict. |
| 5 Constellation intent emits | `value.advisory: false`. The live-board card shows a corner badge *"BLOCKING"*. |
| attestation text of the 3-layer report | *"BLOCKING MODE"* prefix. The qualified expression *"passed coverage X% under catalog v_Y as of date Z"* is retained (Cluster C8 falsifiability invariant). |

### §19.4 The Hyperbrief gate of the transition decision itself

The v0.2.x → v0.3+ transition decision itself is a dispatch target of the Hyperbrief 4-score gate — the 9-section JSON IR form of `Hyperbrief.md §1`:

- **Section 1 (audience_profile)**: EG maintainers (Korean prevailing language).
- **Section 2 (decision_context)**: "decision to transition to blocking mode after operating Ultrasafe v0.2.x advisory mode".
- **Section 3 (4-score)**: the 4-tuple of severity × scope × reversibility × external_impact — the blocking mode transition is *reversibility=partial* (advisory regression is possible after transition but at high cost) + *external_impact=high* (publish blocking forcibly affects the external release cadence) — the 4-score sum is generally ≥ 5.
- **Section 4 (3-AND condition state)**: the current state of the 3 conditions in §19.2 above.
- **Section 5 (recommended_methodology)**: per-Tier axis-set differentiation + iteration_min differentiation + explicit statement of the bypass mechanism (§10.6).
- **Section 6 (rollback_plan)**: the advisory regression procedure after entering blocking mode — forced override via the environment variable `ULTRASAFE_MODE=advisory` (maintainer manual override allowed for N months after the transition decision).
- **Section 7-9**: per Hyperbrief.md §1.

At the transition-decision IR emit point, audience_profile_fallback.button_label + trigger_phrases_md are auto-localized to Korean (Hyperbrief.md §5.6.7 v0.5.6).

### §19.5 Self-application implications of this §19

The advisory → blocking transition procedure of this §19 is itself a *self-application of the Ultrasafe spec* — a reflexive structure in which Ultrasafe routes the transition of its own runtime mode through the *Hyperbrief 4-score gate*. Consistent with the self-application dogfood of Appendix C + the advisory-only boundary of §1.4.

This self-application is the second anchor of *Ultrasafe's self-trust* — the first is the Greatpractice macro entry of Appendix C, the second is the mode-transition Hyperbrief gate of this §19. Upon entering v0.3+ blocking mode, this §19 itself also becomes *blocking* — that is, the advisory → blocking transition retro-decision of v0.3.x also follows the same §19 procedure (isomorphic to the Greatpractice §5.4-§5.6 promotion path).

---

## Appendix A: Cross-Axis Convergence Cluster Catalog

> This appendix organizes the §1 convergence-cluster results of the 17-axis cross-domain deep dive, which is the backing research of the Ultrasafe spec, into the form of a *first reference card for spec drafting*. It embeds, in tables, the (definition, number of appearing axes, EG application priority, key citations, spec body cross-ref) of each of the 14 clusters + a 17-axis × cluster coverage matrix + 1-2 key academic/standard citations per cluster + 4 sub-sections of priority rationale. Consistent with the Greatpractice.md Appendix A "domain catalog" pattern. (cross-axis-patterns §1, synthesis §3.1-§3.4)

### A.1 14 Convergence Clusters — one-liner + number of appearing axes + EG priority

| Cluster | Definition (one-liner) | Appearing axes | EG v0.1.0 priority | spec body cross-ref |
|---|---|---|---|---|
| **C1 — Parallel attacker-perspective fan-out** | The Ultrasafe attack stage is not a single thread but an independent attacker-agent fan-out of multiple perspectives (specialized by 1+ of taxonomy / methodology / actor-profile / layer / lifecycle / persona) + synthesis at the retire barrier | **16 / 17** | **P0 — first-cut surface** | §6.1 fan-out roster · §6.2 8-agent minimum viable cut |
| **C2 — Cross-axis synthesis at retire barrier** | cross-correlate + dedup + confidence evaluation of the findings of multiple attack agents — flat lists forbidden, coexistence of the 3 forms *graph / matrix / quorum* | **15 / 17** | **P0 — Layer-1 OSCAL synth core** | §7.1 alignment matrix · §7.3 separation of dedup vs cause-graph |
| **C3 — ≥3 iteration loop with multi-condition AND termination** | the termination condition is not a single metric but a multi-condition AND gate (regression-free + monotonic improvement + statistical power + cross-axis confirmation) | **14 / 17** | **P0 — clean-signal definition SSoT** | §6.4 4-condition AND + regression baseline · §13.5 strict-mode reconciliation |
| **C4 — Hyperbrief 4-score escalation routing** | the handling decision of a finding is not an automatic binary but a 4-way (apply / defer / release_with_risk / escalate) decision delegation — the Hyperbrief 4-score gate is the sink | **13 / 17** | **P0 — decision-routing standard** | §10.1 Hyperbrief intent emit · §10.3 `recommended_methodology[]` 4-tuple default |
| **C5 — Greatpractice tree promotion path** | automatic registration of macro/mezzo/micro for recurring finding-mitigation pairs / IR patterns + ITER 1 pre-check (Greatpractice omission-prevention hook) | **12 / 17** | **P1 — Greatpractice v0.1.0 simultaneous cut** | §11.1 bidirectional feed · §11.2 tier classification rules |
| **C6 — Constellation A2A transport + audit + intent extension** | finding emit / synthesis input / decision routing / iteration history are all expressed as A2A messages + 5 new intents + reuse of the existing cycle-end / cursor-tail probe discipline | **11 / 17** | **P0 — broker surface extension (Tier A patch)** | §8.1 new intent registry · §8.2 broker schema evolution · §12.4 schema migration procedure |
| **C7 — Pre-release hook + tiered cost control** | dual entry: PreToolUse hook (`git push --tags` pattern matching) + explicit `/ultrasafe` skill — fan-out intensity differentiation per release tier (patch/minor/major) (preventing token-budget runaway) | **10 / 17** | **P0 — trigger surface** | §5.1 release tier definition · §5.2 PreToolUse matcher |
| **C8 — External standard / catalog anchor** | the attack catalog + coverage minimum bar are tied not to an internal metric but to an external standard anchor — the word "secure" forbidden, qualified to "passed coverage X% under catalog v_Y" | **10 / 17** | **P0 — axiom of falsifiability** | §6.3 coverage definition (catalog version embedded) · §9.4 release certificate expression rules |
| **C9 — Strict schema / anchor / ground-truth gate** | multi-layer guard of strict JSON schema + (file_path, line_range, PoC sketch) anchor + prompt fence + signature verification to block LLM hallucinated findings. Free-form rejected | **9 / 17** | **P0 — finding emit contract** | §7.2 finding schema (Layer-1 OSCAL) · §8.1 Spotlighting wrapper |
| **C10 — Diversity-enforced source independence** | forced distinctness of the 4-tuple (model_family, prompt_template_hash, seed, axis_hash) — N-seed repetition of the same model+prompt is excluded from the quorum count | **8 / 17** | **P1 — v0.1.0 is 2-tuple, v0.2 4-tuple extension** | §2.4 agent diversity invariant · §3.4 diversity enforcement · §6.2 (d) consecutive 2-iter agent diversity |
| **C11 — Frozen membership / state during iteration** | changing the attacker-agent set / catalog version / target commit / config during iteration is forbidden — the transition window itself is an attack surface, membership changes only at iteration boundaries | **7 / 17** | **P0 — iteration boundary discipline** | §3.2 frozen membership (Stackelberg Phase A/B) · §6.4 regression baseline boundary |
| **C12 — Self-spec-gaming meta-safety** | Ultrasafe itself can be an attack target — clean rate / pass rate are a spec-gaming reward for the attack agents. Multi-layer defense of mandatory external standard + premortem + self-audit + meta-iteration + adversarial review | **7 / 17** | **P1 — v0.1.0 4 items mandatory, meta-iteration is v0.2** | §11.1 self-spec-gaming hazards · §11.5 untested_surfaces[] |
| **C13 — Two-tier public / private output + redaction** | the iteration log + finding report are a 2-tier output (public = category + remediation summary, private = full exploit payload + reproduction). Details disclosed only after the responsible disclosure window | **6 / 17** | **P0 — public-repo redaction discipline consistency** | §9.1 2-path output · §9.2 sanitization pipeline |
| **C14 — Mitigation-introduces-new-threat / secondary-surface guard** | the mitigation itself introduces a new attack surface — the secondary surface after the fix is applied is also a target for the next iteration. `F_{N+1} = (F_N − sealed) + secondary_new` | **6 / 17** | **P0 — core rationale of the 3-floor** | §6.2 4-condition AND (`regression-free + monotonic improvement`) · §6.4 regression baseline secondary-surface diff |

### A.2 17-axis × Cluster coverage matrix

Each cell = ● if the axis appears as a *source pattern* in the cluster, ○ if a *partial / adjacent expression*, blank if absent. (extracted from the per-axis expression index of cross-axis-patterns §1.C1-C14)

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
| **cluster total appearing axes** | **16** | **15** | **14** | **13** | **12** | **11** | **10** | **10** | **9** | **8** | **7** | **7** | **6** | **6** |

> **Coverage rule** (§6.3 consistency): clusters with appearing axes ≥ 9 (C1-C9) = **MUST-cover in v0.1.0**, 7-8 (C10-C12) = **SHOULD-cover**, 6 (C13-C14) = **MUST-cover-as-discipline** (even with few appearing axes, redaction + secondary-surface have an asymmetrically large cost of discipline violation — a Tier A critic baseline rule).

### A.3 Key citations per cluster (1-2 anchors each)

- **C1 — fan-out**: MITRE ATT&CK Enterprise v15 14-tactic carving (`pentest-methodology §1.1`) · OWASP × MITRE ATT&CK dual taxonomy 8-agent (`web-api-infra §1.1`). Foundational academic: Caltagirone-Pendergast-Betz 2013 Diamond Model.
- **C2 — synthesis**: BFT 2f+1 quorum (Castro-Liskov 1999 *Practical Byzantine Fault Tolerance*) · ACH evidence-rows × hypothesis-columns matrix (Heuer 1999 *Psychology of Intelligence Analysis* §8). Industry anchor: BloodHound finding-graph chain (`security-visualization-dashboard §1.3`).
- **C3 — iteration termination**: NIST SP 800-115 *Technical Guide to Information Security Testing* regression-free criterion (`pentest-methodology §1.2`) · Carlini-Wagner 2017 *Towards Evaluating the Robustness of Neural Networks* (PGD + OOD + agentic 3-family composite, `adversarial-ml §1.3`).
- **C4 — Hyperbrief routing**: PASTA Stage 7 quantitative residual risk (UcedaVélez-Morana 2015 *Risk Centric Threat Modeling* Ch.7) · FIRST CVSS v4.0 + EPSS + CISA KEV trump (`incident-response-disclosure §1.2`).
- **C5 — Greatpractice promotion**: Google SRE Workbook postmortem template (Beyer et al. 2018 *SRE Workbook* Ch.10) · MITRE D3FEND Pyramid-of-Pain pain_level 1-7 (`game-theory-asymmetry §1.4`).
- **C6 — Constellation A2A**: Spotlighting wrapper for prompt-injection defense (Hines-Lopez-Vasquez 2024 *Defending Against Indirect Prompt Injection*) · MPCVD multi-party CVD coordination (FIRST 2020 *Multi-Party Coordinated Vulnerability Disclosure Template*).
- **C7 — pre-release hook**: Common Criteria EAL 1-7 tier (ISO/IEC 15408:2022) · Sigstore + cosign + Rekor inclusion proof (Newman-Lorenc-Lewis 2022 *Sigstore: Software Signing for Everybody*, USENIX Sec '22).
- **C8 — external standard anchor**: OWASP LLM Top 10 v2025.11 + EU AI Act Art. 15(5) 5-family + MITRE ATT&CK Enterprise v15 (`compliance-standards §1.1`, `adversarial-ml §1.1-§1.2`). Krakovna et al. 2020 *Specification gaming: the flip side of AI ingenuity* — academic foundation for avoiding self-spec-gaming.
- **C9 — strict schema**: prompt-fenced finding schema with JSON Schema 2020-12 (Druschel-Wiegley-Sotirov 2023 *Prompt Injection Defenses* §3.1) · ground-truth anchor (file/line/PoC) verification (`threat-modeling §1.10`).
- **C10 — diversity**: eclipse-resistance via diversity-enforced source independence (Heilman et al. 2015 *Eclipse Attacks on Bitcoin's Peer-to-Peer Network*, USENIX Sec '15) · ensemble independence (`cryptography-key-mgmt §1.6`).
- **C11 — frozen membership**: Raft formal verification limitation (Howard-Mortier 2020 *Paxos vs Raft: Have we reached consensus?*) · Stackelberg commit-aware defender_commit_snapshot (`game-theory-asymmetry §1.1`).
- **C12 — self-spec-gaming meta-safety**: Krakovna et al. 2020 *Specification gaming: the flip side of AI ingenuity* 60+ examples · ACH process-induced inconsistency (Heuer 1999 Ch.8 + `cognitive-decision-bias §4.3`).
- **C13 — two-tier output**: FIRST CVD 90+30 disclosure timeline (FIRST 2020 *Guidelines and Practices for Multi-Party Coordinated Vulnerability Disclosure*) · STIX 2.1 + SARIF 2.1.0 + ATT&CK Navigator tri-format export with redaction layer (`security-visualization-dashboard §1.7`).
- **C14 — secondary surface**: "every mitigation has its own threats" (Shostack 2014 *Threat Modeling: Designing for Security* Ch.6) · fix-mutation gate (DeMillo-Lipton-Sayward 1978 *Hints on Test Data Selection*) — comparing the mutation score before and after the fix, a score drop signals invariant weakening.

### A.4 Priority rationale

This sub-section explains the rationale for the **P0 / P1 / P2** classification of A.1, grouped not per cluster but *per priority-tier*. The SSoT for the cut-line decision of spec drafting.

- **P0 (v0.1.0 MUST-ship, 10 clusters)** = **C1 / C2 / C3 / C4 / C6 / C7 / C8 / C9 / C11 / C13 / C14**.
  - Rationale: (a) clusters with **appearing axes ≥ 9** (C1-C9) converge as a *source pattern* in more than half of the 17 axes — omitting them on definition alone damages the falsifiability of the spec itself. (b) C11 (frozen membership, 7 axes) + C14 (secondary-surface, 6 axes) are, even with few appearing axes, *core invariants of the 3-floor iteration rationale* — if even one of the two is missing, the 4-condition AND of §6.4 collapses to trivially true / vacuous. (c) C13 (redaction, 6 axes) is the backing of the public-repo redaction discipline — a hard constraint of inner public-repo operation, so it cannot be omitted in v0.1.0. (d) C7 (pre-release hook, 10 axes) is the trigger surface — the entry point of the module shape itself, so it cannot be cut.
  - **Tier A critic patch absorption locations**: §8 broker surface extension (C6) · §6.3 coverage definition + catalog version embedding (C8) · §12.4 schema evolution / migration procedure (C6 follow-up) · §6.4 regression baseline + 4-condition AND (C3 + C14) · §7.3 + §13.5 strict-mode reconciliation (C13 + Contradiction CT5 + CT1).
- **P1 (v0.1.0 SHOULD-include but reduced scope, 3 clusters)** = **C5 / C10 / C12**.
  - Rationale: (a) the *true value* of C5 (Greatpractice promotion, 12 axes) is realized when *simultaneously cut* with the Greatpractice module v0.1.0 spec — Ultrasafe v0.1.0 goes only up to *Greatpractice candidate emit*, with automatic tree registration after the Greatpractice spec is finalized. (b) the forced distinctness of the 4-tuple `(model_family, prompt_template_hash, seed, axis_hash)` of C10 (diversity, 8 axes) goes in v0.1.0 only up to *2-tuple `(perspective × model_family)` distinct ≥3*, with the remaining 2 tuples cut in v0.2. (c) the 4 mandatory items of C12 (self-spec-gaming meta-safety, 7 axes) (minimum attack diversity + audit-trail logit + external standard mapping + untested_surfaces[]) ship in v0.1.0, with meta-iteration (Ultrasafe self-test fault-injection loop) in v0.2.
- **P2 (v0.2+ explicit deferral, 0 clusters)** = none.
  - Rationale: all 14 clusters have *at least* a hook noted on the v0.1.0 surface (even P1 reduced scope embeds its hook in v0.1.0). Full deferral is impossible because, by the cluster definitions of cross-axis-patterns §1, omission would break spec coherence.

**Non-linearity of priority tier vs cluster appearing-axis count**: the P0 vs P1 separation is decided not by a *simple cutoff of appearing-axis count* but by the *omit-cost asymmetry of the spec invariant*. For example, C13 (redaction, 6 axes) is one of the two clusters with the fewest appearing axes, yet on omission the possibility of public-repo redaction violation *arises every session* — the cost asymmetry justifies P0 mandatory. Conversely, C5 (Greatpractice, 12 axes), despite a 4× higher appearing-axis count, is P1 reduced scope due to *Greatpractice module dependency* — the cost of *missing an external dependency prerequisite* is greater than the omit cost.

**Cross-section dependency map**:
- §5 trigger ← C7 (pre-release hook tier)
- §6 iteration loop ← C3 + C11 + C14 (clean-signal + frozen state + secondary surface) — Tier A patch absorption point
- §7 finding schema + synthesis ← C2 + C9 (synthesis matrix + strict schema) — separation of dedup vs cause-graph (§7.3) is the Contradiction CT3 reconciliation
- §8 Constellation broker integration ← C6 + C9 (intent registry + Spotlighting wrapper) — schema migration (§12.4) is the Tier A patch absorption
- §9 output layer ← C8 + C13 (external anchor + redaction 2-tier)
- §10 Hyperbrief routing ← C4 (4-way decision delegation)
- §11 Greatpractice feed ← C5 (bidirectional promotion path)
- §13 enforcement reconciliation ← C8 + C13 + Contradictions CT1 / CT5 (strict-mode vs human-review gate)
- §11 meta-safety ← C10 + C12 (diversity + self-spec-gaming guard)

---

## Appendix B. 4 Strong Isomorphisms + Normative Justification

> This appendix organizes *why* the core architectural choices of Ultrasafe v0.1.0 — parallel fan-out · retire barrier · ≥3 iteration loop · 3-layer report · pre-release-only trigger · strict-mode default — are a convergence of the 17-axis cross-domain deep research and *why* other carvings are unqualified, via 4 strong isomorphisms + 2 normative groundings. An isomorphism is not a mere analogy but a 1:1 structural mapping — the component / connector / invariant of one domain corresponds 1:1 to that of another domain, and on consistency violation both domains reproduce the same failure mode. Consistent with the isomorphism-as-justification pattern of Greatpractice Appendix B (`EstreGenesis/Greatpractice.md` Appendix B).

---

## B.1 Isomorphism 1 — Parallel fan-out ↔ Superscalar read fan-out ↔ Stackelberg Phase A/B ↔ multi-actor profile

> "The temporal separation of the stage that only *reads* the attack surface and the stage that *mutates* it converges to the same two-stage structure in 4 seemingly unrelated domains."

The parallel attack-agent fan-out structure of §3.1, §4.2, §4.4 stands on a 1:1 mapping of 4 domains.

| Slot | Ultrasafe v0.1.0 | Superscalar v0.4.2 | Stackelberg SSG (Tambe 2011) | Multi-actor profile (CrowdStrike 2025) |
|---|---|---|---|---|
| Phase A | 8-agent parallel attack (read-only enum) | read fan-out (§3) | Phase A: defender commit observation | Per-tier reconnaissance (kiddie/hacktivist/eCriminal/APT) |
| Phase B | Retire barrier (synthesis) | retire barrier (§4) | Phase B: attacker best-response | Cross-profile finding correlation |
| Frozen state | `target_commit_sha` + `catalog_version` (Cluster C11) | speculation snapshot | `defender_commit_snapshot.json` | Per-tier `toolkit × budget × persistence` |
| Mutation fence | post-barrier single-thread apply (TM pattern 7) | post-retire write phase | post-equilibrium intervention | post-synthesis mitigation |
| Failure mode if violated | iteration drift + secondary-surface miss (§4.2) | speculation rollback storm | attacker observes mid-flight defender change → strategy invalidation | profile collapse (single-tier blind spot) |

**Structural identity** — all four domains enforce the same invariant: *mutation forbidden during Phase A + all Phase A results synchronized upon entering Phase B*. Superscalar's retire barrier and Stackelberg's commit-observe-respond sequence are the same abstract machine — in that Tambe et al.'s (2008) DOBSS solver essentially "freezes the defender strategy then evaluates the attacker best-response in parallel", it is the game-theoretic justification of Superscalar's read fan-out. 16/17 axes converge on this pattern (Cluster C1, cross-axis-patterns §1.C1). Only FPB (fuzzing-pbt) varies weakly around corpus evolution, but this too is part of this isomorphism via the frozen-state obligation of the mutation gate.

**System implication** — the 8-agent first cut of §3.1 is the point of thickest cross-domain convergence width of Superscalar fan-out width and Stackelberg follower decomposition (the OR-node parallel expansion of Schneier 1999 attack tree §1.9). Below 8 lacks actor-profile diversity (GTA pattern 2), 16+ explodes the retire-barrier dedup cost.

---

## B.2 Isomorphism 2 — Retire barrier ↔ BFT quorum ↔ ACH matrix ↔ attack-defense tree

> "The synthesis of findings from multiple sources is not a *flat list* but the 3 forms *matrix / graph / quorum* — all three are the same abstract machine of cross-axis confirmation."

The retire-barrier synthesis report of §3.2 stands on the agreed component structure of 4 domains.

| Structure | Ultrasafe retire barrier | BFT quorum (Castro & Liskov 1999) | ACH matrix (Heuer 1999) | Attack-defense tree (Schneier 1999, Kordy et al. 2014) |
|---|---|---|---|---|
| 1st dimension | attack perspective (8 axes) | replica node (n ≥ 3f+1) | evidence row | AND/OR node child |
| 2nd dimension | finding entry | sequence number | hypothesis column | attribute (cost/prob/skill) |
| Confirmation rule | ≥2 axis cross-confirm = MUST fix (PM pattern 7) | 2f+1 prepare = prepared (PBFT §3) | column max-disprove count = least disconfirmed | bottom-up aggregate (Σ for AND, min for OR) |
| Single-source rejection | 1-axis finding = "MAY review" tier | f+1 = needs-corroboration | single-row evidence = inadmissible | leaf-only attribute = unverified |
| Failure mode if violated | flat list → WAI §4.2 single-vector tunnel vision | safety violation (conflicting commit) | confirmation bias / single-hypothesis lock | branch pruning bias |

**Structural identity** — the 2f+1 intersection mathematics of the BFT quorum (multi-agent-distributed §2.1) is an instance of the *same* "single source → multi-source trust transformation" as the disprove-direction evaluation of the ACH matrix (cognitive-decision-bias §1.1) and the cross-branch aggregation of the attack-defense tree (game-theory-asymmetry §1.9). The minimum PBFT quorum that tolerates up to f=1 at n=4 attack agents maps exactly to the "≥2 axis cross-confirmation" threshold of Ultrasafe v0.1.0 (multi-agent-distributed §3.1). 15/17 axes converge (Cluster C2).

**Correlated-failure correction** — the pitfall where the *independent failure* assumption of BFT mathematics breaks under LLM correlated hallucination (multi-agent-distributed §4.2) has the same cause as the *process-induced consistency* pitfall of ACH (cognitive-decision-bias §4.3) — *the apparent multiplicity of sources ≠ the independence of reasoning*. Both domains converge on the same solution: forced distinctness of the 4-tuple model_family × prompt_template_hash × seed (Cluster C10, dispatch-time enforce). The v0.1.0 enforcement of §3.1 is (perspective × model_family) 2-tuple distinct ≥3 — the minimum bar dictated by this isomorphism.

---

## B.3 Isomorphism 3 — ≥3 iteration ↔ PICERL ↔ MTTR 4-phase ↔ Carlini-Wagner cat-and-mouse

> "The lower bound of 3 repetitions is not an *arbitrary floor* but the *unfalsifiability-avoidance circuit* of fix → verify of fix → verify of regression-of-fix — 4 domains reached the same conclusion."

The ≥3 iteration hard floor of §3.3 stands on the 1:1 mapping of 4 domains.

| Iter slot | Ultrasafe v0.1.0 | SANS PICERL (Kral 2011) | DevSecOps MTTR (DSP pattern 2) | Adversarial ML cat-and-mouse (Carlini & Wagner 2017) |
|---|---|---|---|---|
| Iter 1 | fix application | Containment + Eradication | MTTD → MTTR phase 1 | new defense published |
| Iter 2 | verify of fix | Recovery (baseline restore) | MTTR phase 2 (verification) | bypass attack published (e.g., all 10 detection methods broken) |
| Iter 3 | verify of regression-of-fix | Lessons Learned (systemic) | MTTR phase 3 (regression check) | adaptive attack against bypass-aware defense |
| Termination predicate | 4-condition AND × 2 iter consecutive (§3.3) | 6-phase gate × verification (incident-response-disclosure §2.1) | clean-signal fixed-point (CKM pattern 2) | "passed coverage X% under catalog v_Y" (Herley unfalsifiability avoidance) |
| Failure mode if collapsed to <3 | secondary-surface miss + false-clean (TM pattern 5) | premature closure → repeat incident (Google SRE §15) | regression escape → MTTR re-spike | "10 detection methods bypassed" pattern recurs |

**Structural identity** — the result of Carlini & Wagner (2017) *"Adversarial Examples Are Not Easily Detected: Bypassing Ten Detection Methods"* is the sliding-window pattern of "one defense publish → next attack appears immediately", and this pattern is *mathematically the same fixed-point search* as the PICERL Lessons-Learned phase of the IR domain (incident-response-disclosure §1.2) — the circuit in which the secondary surface after a fix becomes a new attack target (Cluster C14). The rationale of DSP pattern 2's "iter 1 fix + iter 2 verify + iter 3 verify of regression" is the industry measurement of the SAFECode/BSIMM inflection point (PM pattern 2) — the *empirical* coincidence point of this isomorphism. 14/17 axes converge (Cluster C3).

**Falsifiability anchor** — Herley (2016) "Unfalsifiability of Security Claims" (game-theory-asymmetry §1.5) is the normative bridge of this isomorphism: "an attack did not occur ≠ the defense was effective." The reason the termination condition must be a *Popper-falsifiable* statement of failure "*under the coverage X% of the specified catalog under version v_Y*" rather than "attack failure" (Cluster C8). This statement itself is the same reason that the PICERL Lessons Learned phase requires a *standard template amenable to trend analysis* (Google SRE §15).

**v0.1.0 application** — the orthogonal matrix of §3.3's universal hard floor 3 + finding-category-tier extension (statistical/timing/probabilistic 5+) + external-impact-tier extension (Tier 3 = 5+) is the dictate of this isomorphism. The max_iter (default 7) safety net + Hyperbrief MUST-trigger is the bounded-liveness avoidance of FLP impossibility (multi-agent-distributed §1.1) (MAD pattern 7).

---

## B.4 Isomorphism 4 — 3-layer report ↔ OSCAL + Hyperbrief IR + Greatpractice candidate

> "There is no single report form — the 3 layers *external audit-ready machine schema* + *decision-delegation IR* + *codification candidate* are simultaneously needed, and each layer has a different sink."

The 3-layer structure of the synthesis report of §3.2 stands on the 1:1 mapping of OSCAL × Hyperbrief × Greatpractice.

| Layer | Sink | Schema source | Consumer | Cross-axis convergence |
|---|---|---|---|---|
| L1 — Machine-readable | External audit / regulatory evidence | OSCAL Assessment Result (NIST 800-53A) + CIM normalization (SVD pattern 4) | EU AI Act Art. 15 evidence trail, SOC 2 Type II auditor | CMP pattern 1+2, SVD pattern 4+7, AML pattern 2 |
| L2 — Decision-routing | Human decision delegation | Hyperbrief 9-section IR (`EstreGenesis/Hyperbrief.md` §1) + 4-tuple `recommended_methodology[]` (v0.6 cut) | User (release gate) | AML pattern 4, CMP pattern 3, WAI pattern 6, TM pattern 4 (Cluster C4, 13/17) |
| L3 — Codification | Long-term memory + omission prevention | Greatpractice macro/mezzo/micro tree entry (`EstreGenesis/Greatpractice.md`) | Future Ultrasafe iteration (ITER 1 pre-check), PreToolUse hook | TM pattern 8, IRD pattern 6, SCS pattern 8 (Cluster C5, 12/17) |

**Structural identity** — the structure in which three layers branch to *three sinks* for the *same finding* is 1:1 isomorphic to the *assessment / plan / result* separation of OSCAL (compliance-standards §1.2), the *summary / action items / lessons learned* separation of the SRE postmortem (incident-response-disclosure §1.4), and the *multi-channel encoding* of information theory (each channel's receiver has a different decoder). With L1 alone, decision fatigue + automatic deferral; with L2 alone, missing audit evidence + regulatory violation; with L3 alone, systemic drift of a one-off fix. *All* three layers are *inseparable* components of the same finding.

**Forward reference consistency** — the 5 new Constellation intents of §3.4 (`ULTRASAFE_FINDING` · `ULTRASAFE_ITERATION_BOUNDARY` · `ULTRASAFE_RELEASE_GATE` · `SECURITY_DISCLOSURE_INTAKE` · `MPCVD_COORDINATION`) carry L1 (OSCAL payload) · L2 (Hyperbrief IR) · L3 (Greatpractice candidate) respectively — consistency where the 3 layers map 1:1 to the transport tier. The public-private 2-tier redaction (Cluster C13) separates the public branch and private branch of L1/L2 into distinct sinks — the redaction-aware extension of this isomorphism.

---

## B.5 Normative justification 1 — Schneier asymmetry (attacker only needs one path; defender needs all)

> "The attacker only needs *one path* to work, while the defender must defend *all paths* simultaneously — this asymmetry justifies the *all-three-mandatory* combination of fan-out × multi-axis × ≥3 iteration."

Bruce Schneier's attack/defense asymmetry thesis (Schneier 2017 "Attack vs. Defense in Nation-State Cyber Operations", Schneier 2018 *Click Here to Kill Everybody* §2; game-theory-asymmetry §1.1) is the *normative grounding* of the three architectural choices of this spec.

**The 3-fold implication of the asymmetry**:

1. **Justification of fan-out** (§3.1) — if the defender side approves a release with the simulation of only a *single* axis, the attacker's *unvisited axis* immediately becomes an attack surface. Schneier's asymmetry means the attacker's *freedom of path selection* is *structurally asymmetric* to the defender's *freedom of coverage*. The randomization of Tambe Stackelberg games (game-theory-asymmetry §1.2) is a partial mitigation, but the *minimum bar of coverage itself* is fan-out width × external standard anchor (Cluster C8) — the word "secure" is forbidden, only the qualified expression *"passed coverage X% under catalog v_Y as of date Z"*.

2. **Justification of multi-axis cross-confirmation** (§3.2, the BFT quorum isomorphism of B.2) — the reason a single-axis pass is *false confidence* is that Schneier's asymmetry means a *single point of failure* is the attacker's *single point of opportunity*. The PKI cases of DigiNotar 2011 + Symantec 2017 distrust (protocol-trust-evolution §1.4) prove a catastrophic instance of this asymmetry through *cascading invalidation*. The minimum bar of ≥2 axis cross-confirmation is the direct response to this asymmetry.

3. **Justification of ≥3 iteration** (§3.3) — Schneier himself states in a subsequent nuance that "in nation-state cyber operations, the attack/defense balance is more balanced in a *repeated game*" (game-theory-asymmetry §1.1). This nuance suggests that the asymmetry of *single-shot* evaluation weakens under *iterated* evaluation — the *repetition* itself of the ≥3 iteration loop is the asymmetry-mitigation mechanism. The Carlini & Wagner cat-and-mouse (B.3) is the empirical instance of this nuance.

**Cost-asymmetry perspective** — Herley (2009) "rational rejection of security advice" (game-theory-asymmetry §1.3) is the *economic* aspect of this asymmetry — security advice imposes daily friction on the *entire population* while its benefit avoids harm to a *small fraction*. Therefore, so that the asymmetry justification does not cascade into *unlimited fan-out*, per-tier cost control (Cluster C7) is an orthogonal condition — the graduated enforcement of Tier 1 patch 1 iter, Tier 2 minor 3 iter, Tier 3 major 5+ iter (CMP pattern 7) is the carving of this balance.

**The *limit* of Schneier asymmetry** — the limit of cyber application of the Mao/Trinquier asymmetric-warfare doctrine (game-theory-asymmetry §1.8) — the *absence of territory* risks overlooking the *defender's hardening advantage* (memory protection, sandbox, capability scoping). The *TTP-level fix* priority of the Pyramid of Pain (game-theory-asymmetry §1.10) avoids this limit — the mechanism for the defender side to recover its *asymmetric advantage*. The finding schema field `pain_level_if_fixed` of §3.2 is the mechanization of this normative.

---

## B.6 Normative justification 2 — Population-level trust erosion (HTTP→HTTPS analog for agent ecosystem)

> "Individual-level trust assumptions are *structurally invalidated* at the reasoning dimension as the population grows — the agent ecosystem heads toward the same threshold."

The erosion of the mutual-trust assumption (protocol-trust-evolution §1.10) — even if the individual-level misbehavior rate is *low*, if the population size N increases linearly the *absolute number of misbehavers* explodes from 1 → 10^5. The 30-year case of internet users 10k → 1bn is the inflection pattern that led to the *cumulative layered defense* of SMTP (1982 plaintext) → SPF (2006) → DKIM (2007) → DMARC (2012) → MTA-STS (2018) (protocol-trust-evolution §2.1). The "implicit trust based on network location is no longer valid" of NIST SP 800-207 Zero Trust Architecture (protocol-trust-evolution §1.6) is the standardized response to this erosion.

**The isomorphic inflection of the agent ecosystem**:

| Internet domain | Agent ecosystem isomorph (based on operational observations) |
|---|---|
| SMTP plaintext → SPF/DKIM/DMARC layered auth | early mutual-trust A2A → signature verification of new intent types (`ULTRASAFE_RELEASE_GATE` etc.) (§3.4) |
| Opportunistic STARTTLS → STRIPTLS attack | "good if present, proceed if absent" pattern → the same downgrade attack as STARTTLS (Cluster CT5, PTE pattern 8 strict-mode default) |
| PKI single root → DigiNotar/Symantec cascading invalidation | single-axis pass → cascading false-confidence (the multi-axis cross-confirmation justification of B.5) |
| BGPSec partial deployment deadlock | only some A2A counterparts adopt the new security layer → the same deadlock; self-contained value at first-mover (Cluster CT5, DSP pattern 1 graduated enforcement) |
| Let's Encrypt automated trust democratization | minimize adoption friction via Ultrasafe Tier 1/2/3 tier-aware cost control (Cluster C7) |
| DNSSEC KSK rollover 1-year deferral | the first rotation itself is a risk event → from-day-one rotation drill (mirror of the Cluster C11 frozen-state discipline) |

**Population threshold implication** — once the EG counterpart population exceeds the threshold (N≈7), removing implicit trust is a *prerequisite for avoiding catastrophic failure*. The §3.4 Constellation A2A integration discipline of this spec (Cluster C6) is the *pre-emptive* response to this threshold — starting hardening while the counterpart population is still small to avoid the deadlock of BGPSec + the 1-year rollover deferral of DNSSEC.

**The *strict-mode default* implication of the HTTP→HTTPS analog** — the phase transition of EFF "HTTPS Everywhere" → global HTTPS page load 39% → 84% (protocol-trust-evolution §1.5) was possible only with *strict-mode default + explicit opt-out*, and stalled at the point of allowing opportunistic mixed-content. This isomorphism is the *normative* justification for adopting the strict-mode default of Cluster CT5 — orthogonal to the mandatory external standard anchor of Cluster C8 + the self-spec-gaming meta-safety of Cluster C12.

**Rug-pull insider threat** — a *time-axis* variant of the population statistics (protocol-trust-evolution §3.5, AML §1.12 Agentic Misalignment) — the scenario in which a counterpart verified at first joining degrades over time justifies the mandate of an *update-lifecycle agent* (PTE pattern 5) + a *re-authentication cadence* (1 full re-verification per quarter). The iteration boundary discipline of §3.3 (Cluster C11) is the *intra-release* mirror of this time-axis erosion — the *inter-release* erosion response is the release-cadence-level extension of this normative.

---

> **B summary**. The architectural choices of this spec are not *arbitrary design taste* but are dictated by four *strong isomorphisms*: (a) the fan-out × retire barrier converged by 16/17 axes (B.1) + (b) the multi-source synthesis matrix converged by 15/17 axes (B.2) + (c) the ≥3 iteration falsifiable termination converged by 14/17 axes (B.3) + (d) the 3-sink report layering converged by 12-13/17 axes (B.4). The two normative groundings of the asymmetry justification (B.5) and population trust erosion (B.6) anchor *why this spec is essential at this point in time* on the time axis — the cost-asymmetry balance of Schneier asymmetry (per-tier cost control) and the strict-mode default + from-day-one rotation drill of the HTTP→HTTPS analog define the outer envelope of the *minimum viable* carving of v0.1.0.

---

## Appendix C. Self-Application — the entry of this spec itself

> This appendix is the result of frontmatter-izing the Ultrasafe.md v0.1.0 body spec itself as a *Greatpractice macro tier entry* and applying the §3.2 schema. *Self-application* is the primary dogfood evidence — it is the reductio that if the spec cannot itself satisfy the governance SSoT form of *attacker-perspective fan-out + ≥3 iteration loop + cross-axis synthesis* that it defines, its normative authority to apply to external release surfaces weakens. Consistent with the self-application pattern of Greatpractice Appendix C (humanities §3.8 *self-instantiation of the Alexander pattern language* + management §1.10 *IAR meta-rule self-compliance*).

### C.1 The Greatpractice entry frontmatter of this spec (proposed)

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
  - reports/2026-06-05-ultrasafe-research/axes/         # 17 axes × {original, patterns}
  - reports/2026-06-05-ultrasafe-research/synthesis/    # cross-axis cluster + critic + spec-hints
  - 17-axis dogfood evidence (Phase 4 fan-out × ≥3 iter)
  - Appendix A 14 convergence clusters (universal 9/17 ≤ density ≤ 16/17)
binding: ratio                            # humanities §1.2 — operative governance, not mere advice
enforcement_level: recommended            # the spec itself is advisory — adoption after passing the §13.1 3-condition AND
evidence_quality: high                    # GRADE — 17 axes × multi-source × 14 cluster cross-confirmation
recommendation_strength: SHOULD           # not MUST — there is a §13.2 anti-criteria domain

# === Trigger (Greatpractice §3.3 — psychology §1.8 if-then) ===
trigger:
  if: "EG-style operational cycle ≥ 5 + release surface ≥ 1 (external-impact tier 2+) + Constellation active + Hyperbrief/Greatpractice/Superscalar v0.1+ running"
  then: "apply Ultrasafe §1-§13 spec + introduce plugins/ultrasafe/ scaffold (from MVA floor §13.3)"
  format: prose-with-yaml                 # spec body prose + only axis-set / hook DSL as YAML
  source: post-incident                   # 17-axis backing + Phase 4 dogfood + Tier A risk gap

# === Tier topology (Greatpractice §2.6 parent-child graph) ===
parent: null                              # macro root — Greatpractice/Hyperbrief/Superscalar sibling
children:                                 # §1-§13 + appendices → mezzo/micro candidates
  - ultrasafe-fan-out-roster              # §6.1-§6.2 8-agent minimum viable cut → mezzo
  - ultrasafe-iteration-termination       # §6.4 4-condition AND clean-signal gate → mezzo
  - ultrasafe-finding-schema              # §7.2 Layer-1 OSCAL emit contract → micro
  - ultrasafe-a2a-intent-registry         # §8.1 5 new intents → mezzo
  - ultrasafe-release-tier-matcher        # §5.1-§5.2 PreToolUse trigger → micro
  - ultrasafe-mva-floor                   # §13.3 Tier 1 static gate 5 items → mezzo

# === Multi-criteria maturity (Greatpractice §5.1) ===
maturity_score:
  frequency: 4      # 1 cycle accumulated — below release-cadence 5+ cycles (limited to probation period)
  depth: 5          # 17 axes × 14 cluster cross-confirmation maximum
  recency: 5        # 2026-06-06 ship point — staleness 0
  cost: 4           # accumulated synthesis cost of the Tier A risk gap (broker schema migration · Hyperbrief intent extension)
  predictability: 3 # the emergent path of C12 self-spec-gaming + C14 secondary-surface — phase-transition uncertain
                    # — see the Greatpractice §5.1 formula for the weighted-sum computation

# === Lifecycle (Greatpractice §3.3 · psychology §1.10 Lally 66 days) ===
lifecycle: probation                      # immediately after v0.1 ship 0-30 days — consolidation entry after 30 days of dogfood
coherence: soft                           # processor §1.11 MESI — multi-agent consistency after broker schema v2
edit_policy: owned                        # canonical §1.9 — macro is owned by default
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-06T00:00:00Z, agent: workflow-spec-draft, action: created, prev_hash: null}

# === SSoT propagation (Greatpractice §8 — Cluster H 4-axis consensus) ===
surfaces:
  - {kind: spec,        path: EstreGenesis/Ultrasafe.md,                                          inherits_freshness: true}
  - {kind: plugin,      path: EstreGenesis/plugins/ultrasafe/,                                    inherits_freshness: true}
  - {kind: docs-badge,  path: EstreGenesis/docs/index.html#ultrasafe-version,                     inherits_freshness: true}
  - {kind: docs-page,   path: EstreGenesis/docs/ultrasafe.html,                                   inherits_freshness: true}
  - {kind: marketplace, path: EstreGenesis/.claude-plugin/marketplace.json#plugins[ultrasafe],    inherits_freshness: true}
  - {kind: readme,      path: EstreGenesis/README.md#modules-section,                             inherits_freshness: true}

# === Evolution (Greatpractice §3.4 — humanities §1.2 supersedes graph) ===
supersedes: []                            # new module — no previous entry
superseded_by: null
kaizen_baseline_since: 2026-06-06         # management §1.3 — "standard ≠ frozen"

# === Deferred (Greatpractice §3.7 — v0.2+ active) ===
hash: null                                # BLAKE3(canonical_body) — v0.2+ memoization
deps:                                     # dependency entries — Greatpractice §3.7 v0.1 allows string list
  - greatpractice-module-spec             # §11 bidirectional feed
  - hyperbrief-module-spec                # §10 4-score escalation routing
  - superscalar-module-spec               # §2 read fan-out + retire-barrier infra
  - constellation-module-spec             # §8 A2A intent + broker
rrpv: 2                                   # processor §1.7 default mid-protect
miss_count: {compulsory: 0, capacity: 0, conflict: 0, coherence: 0}

# === Codify boundary (Greatpractice §5.3 — humanities §3.9) ===
phronesis_boundary: false                 # spec body codifiable — distinct from the phronesis-dense domain of §13.2 anti-criteria
class: persistent                         # os §1.11 — cross-session
---
```

### C.2 Result of applying the Greatpractice §3.2 schema: primary dogfood checklist

| Verification item | Result | Comment |
|---|:-:|---|
| all v0.1 mandatory 7 fields (id · tier · binding · enforcement_level · trigger · lifecycle · last_referenced_turn) populated | PASS | satisfies the Greatpractice §3.2 lint scope |
| macro-required fields (children · surfaces · owner · audit_trail) satisfied | PASS | §3.3 macro branch — 6 children + 6 surfaces |
| Multi-criteria maturity_score all 5 axes quantified | PASS | §5.1 multi-criteria — avoids sole reliance on frequency |
| Trigger if-then schema form (not prose) | PARTIAL | §3 enum absent — the §13.1 3-condition AND mixes multiple conditions + qualitative confirm → honest notation `format: prose-with-yaml` |
| explicit freshness inheritance of surfaces[] | PASS | satisfies the Cluster H · §8.5 catchball precondition |
| Phronesis boundary explicit | PASS | spec body codifiable — `false` |
| edit_policy ↔ tier consistency (macro=owned) | PASS | satisfies the §2.4 mapping |
| Deferred field placeholder (null/0) explicit | PASS | §3.7 v0.2+ active reservation normal |
| promotion status notation of Children elements | PARTIAL | v0.1 children are a string list — the `{slug, tier, status: planned}` object is unsupported. all 6 children are *planned* not *extant* |
| public-repo redaction of Source evidence | PARTIAL | `reports/...` is an outer (private) path — on public ship the source_evidence of this frontmatter itself also needs redaction (caught by Greatpractice §6 voice linter L7/L8) |
| spec-entry semantics of last_referenced_turn | PARTIAL | the spec body is an always-on surface *always referenceable* — the definition of auto-update per turn-end vs update at manual cut point is ambiguous (the isomorphic gap of Greatpractice Appendix C.3) |
| hash embedding of deps[] | DEFERRED | v0.1 allows only a string list — a precise dependency graph is possible with the `{slug, hash}` object extension of v0.2+ |

**Pass rate: 8 PASS / 12 items (66.7%) — 4 PARTIAL / 1 DEFERRED**. 4 additional PARTIALs over the 8 PASS / 0 PARTIAL of Greatpractice Appendix C.2 — the *synthesis layer* nature of this spec (layered on 4 modules) + the Tier A risk gap (broker schema extension) expose additional stress on the schema.

### C.3 The 4 identified PARTIAL gaps — v0.2 backlog

The 4 points where this dogfood is not a *complete success* but *partial* — these are evidence for the subsequent revision of the Greatpractice §3 schema and items entering the v0.2 backlog of this spec.

1. **Absence of the `prose-with-yaml` enum in Trigger.format** — the trigger.format of the Greatpractice §3 schema defines only ∈ {json-schema, regex, count-threshold}. The §13.1 trigger of this spec is composite prose of *3-condition AND + 4 qualitative confirm* — the same gap as Greatpractice Appendix C is exposed more strongly in a *synthesis layer module*. **v0.2 backfill**: add `composite-AND` or `prose-with-yaml` to the §3 enum + a separate sub-schema per spec-type entry.

2. **Absence of Children promotion status notation** — the 6 children (fan-out-roster, iteration-termination, finding-schema, a2a-intent-registry, release-tier-matcher, mva-floor) are *planned mezzo/micro entries* not *extant entries*. v0.1 children allow only a string list → the §2.6 graph topology cannot distinguish *planned vs ratified*. **v0.2 backfill**: elevate the children element to a `{slug, tier, status: planned|draft|ratified, eta_cut}` object — joining the same gap of Greatpractice Appendix C.3 to be resolved in the same cut.

3. **Absence of redaction lint for Source_evidence** — `reports/2026-06-05-ultrasafe-research/...` is an outer private path. On public-repo ship the frontmatter of this appendix also needs redaction (public-repo redaction discipline + Greatpractice §6 L7/L8 voice linter scope). The current §3 schema has no lint distinguishing the path scope (outer vs inner) of source_evidence → automatic fail-soft surfacing is impossible. **v0.2 backfill**: a `visibility: public|private|redact-on-ship` flag on the source_evidence element + a ship-time lint hook (§4 PreCommit extension).

4. **Absence of a self-spec-gaming meta-safety field** — the §14 self-spec-gaming hazards + untested_surfaces[] of this spec address the reflexive risk that *the spec itself is an attack target*, yet the Greatpractice §3 schema has no mandatory field to denote this. An additional risk unique to *synthesis layer modules* — not appearing in Greatpractice Appendix C (a boundary case of a *synthesis layer entry* rather than a universal entry). **v0.2 backfill**: add a conditional field `self_spec_gaming: {risk_level, untested_surfaces[], meta_audit_cadence}` to the macro tier — the codify exit of Cluster C12 (8 axes).

### C.4 Normative implications of self-application

The very fact that the frontmatter of this appendix satisfies the Greatpractice §3 schema only *partially* (8/12, 66.7%) is itself evidence in two directions.

- **Positive**: the v0.1 mandatory 7 fields + macro-required fields apply naturally even to this spec, a *synthesis layer* — passing the *meta-application* of the cross-axis synthesis of Appendix A Cluster C2 (15/17 axes). Passing the boundary case of the universal claim that the Greatpractice schema can host not only *Greatpractice itself* but also a *higher synthesis layer*.
- **Negative**: at the 4 points trigger.format · children topology · source_evidence redaction · self_spec_gaming, the schema does not host a *synthesis layer module* precisely. v0.2 backfill required — that 2 of the 4 gaps of Greatpractice Appendix C.3 (trigger.format · children topology) are rediscovered in the same pattern is evidence that *the synthesis layer has stronger schema stress than the universal entry* (the *second-order application* of Powell-DiMaggio 1983 normative isomorphism).

This appendix itself is the starting point of Ultrasafe's *self-trust* and the *first audit pass* of the §11 self-spec-gaming meta-safety. At each cut of this spec in v0.2+, this appendix is *re-run* — updating maturity_score · lifecycle · audit_trail + noting whether the 4 PARTIAL gaps are resolved. When the PARTIAL → PASS transition completes in v0.5+, this appendix can be elevated to a *macro tier ratified entry* + a *synthesis layer reference exemplar* (isomorphic to the Greatpractice §5.4-§5.6 promotion path).

---

## Revision History

### v0.2.1 — 2026-06-10 (ship-surface reconciliation patch — un-claim spec against the real tree)

**Summary**: A doc-only patch correcting the *spec's description of 'shipped' non-existent files*, discovered in the 2026-06-10 full audit, to match reality. Zero functional/wire changes.

- **§14.1 new logical-role ↔ ship-surface mapping note (normative)**: orchestrator / aggregator / clean-signal-gate are logical roles — the `runtime/{orchestrator,aggregator,clean-signal-gate}.cjs` files are not shipped in v0.2.x. The real surface of each role = main agent Workflow fan-out + synthesizer skill + MCP tools.
- **§14.3 replace the tree with the real tree**: remove the `runtime/` and `schemas/` blocks + state not-shipped (the canonical source of the 3 `schemas/*.schema.json` contracts = §4 + §8.1; the server.cjs ajv does a graceful skip) + reflect the 8 actual skill directory names (`ultrasafe-ai-llm-redteam` etc.).
- **§15 correct the 8 header directory names to the real names** + re-point the finding payload contract ref to §4.
- **§16.6 entry skeleton → real implementation structure** (SDK-free single-file stdio JSON-RPC; the `mcp/tools/*.cjs` split is a v0.3+ candidate).
- **§17 correct the hook spec to the real implementation behavior**: 7 matchers → 15 patterns (with the reason for excluding gh pr merge stated), the hook is self-contained (no orchestrator spawn / no MCP require — only detection + state recording + outbox emit + stderr surface), reflect the real hooks.json file format, §17.4/§17.5 fake skeleton → real implementation structure summary.
- the plugin README, the same family of stale refs in the 8 SKILL.md files, the `mcp/package.json` description, and the `server.cjs` comments are also synced and corrected in the same cut.

### v0.2.0 — 2026-06-06 (runtime activation cut, advisory mode)

**Summary**: From v0.1.0's *minimum-viable spec scaffold* → v0.2.0's *runtime activation cut*. 8 attacker SKILL.md + 2 hooks (PreToolUse `ultrasafe-trigger.cjs` + Stop `ultrasafe-clean-signal.cjs`) + MCP server (5 tools over stdio JSON-RPC) + Constellation §13.16 5 new A2A intent integration + Workflow fan-out applied evidence. **All output of this cut is advisory** — finding report-only, no publish blocking.

**v0.2.0 new surface (5)**:
1. 8 attacker SKILL.md (`plugins/ultrasafe/skills/ultrasafe-{ai-llm-redteam,web-api-attacker,supply-chain-auditor,crypto-reviewer,social-engineer,methodology-compliance,threat-model-lifecycle,synthesizer}/SKILL.md`) — each attacker's input/output/tools/when-to-fire/severity rubric stated (§15).
2. PreToolUse hook `ultrasafe-trigger.cjs` — publish-equivalent command matcher (15 patterns in the real implementation) + advisory mode emit (§17.1).
3. Stop hook `ultrasafe-clean-signal.cjs` — cycle-end clean-signal check + advisory stderr alert (§17.2).
4. MCP server `mcp/server.cjs` — 5 tools (`ultrasafe_run_fanout` / `ultrasafe_finding_aggregate` / `ultrasafe_clean_signal_check` / `ultrasafe_report_generate` / `ultrasafe_release_gate`) over stdio JSON-RPC (§16).
5. Constellation §13.16 5 new A2A intent integration (`ULTRASAFE_FINDING` / `ULTRASAFE_ITERATION_BOUNDARY` / `ULTRASAFE_RELEASE_GATE` / `SECURITY_DISCLOSURE_INTAKE` / `MPCVD_COORDINATION`) — ack_tier applied + payload schema + Spotlighting wrapper + live-board card surface (§18).

**Body expansion §** (all of v0.1.0 §1-§13 + appendix A/B/C body preserved):
- §14 Runtime Architecture (v0.2.0) — 5 surface topology + wire activation of the 5-stage operational pipeline + runtime directory tree + advisory mode statement.
- §15 8-Agent Fan-Out Runtime Detail (v0.2.0) — the SKILL.md detail of each of the 8 attackers (input/output/tools/when-to-fire/severity rubric) + 9 sections (8 agents + dispatch sequence).
- §16 MCP Server Tools (v0.2.0) — the input/output schema of the 5 tools + tool-level deterministic guarantee + the real implementation structure of the MCP server (`server.cjs` single file).
- §17 Hooks Spec — PreToolUse + Stop (v0.2.0) — registration + condition + action + hooks.json + implementation skeleton.
- §18 Constellation integration — 5 new intent runtime wire (v0.2.0) — each intent's payload schema + ack_tier + Spotlighting wrapper + live-board card surface + §13.16 registry.
- §19 Advisory vs Blocking Mode (v0.2.0) — operational meaning of v0.2.x advisory mode + the 3-AND condition for the v0.3+ blocking transition + operational meaning of blocking mode + the Hyperbrief gate on the transition decision itself + self-application implications.

**Workflow fan-out applied evidence**: the orchestrator role (the main agent — §14.1 role mapping) dispatches 7 attackers *in parallel* (Superscalar §3 read fan-out pattern) + the synthesizer's single-sink synthesis at the retire-barrier — a runtime upgrade from v0.1.0 design's *single-thread serial* assumption to v0.2.0's *parallel fan-out* (§15.9).

**Advisory mode statement enforcement**:
- `output.advisory_mode: true` mandatory on every MCP tool return.
- `value.advisory: true` mandatory on every Constellation intent emit.
- the exit code 0 of the 2 hooks is fixed — *no finding blocks publish*.
- the *"ADVISORY MODE"* prefix mandatory on every attestation text.

**Backward resolve of v0.1.0 forward references**:
- the 5 new A2A intents of §8 → resolve to the runtime wire spec of §18.
- the PreToolUse hook of §10 → resolve to the hook spec of §17.1.
- the advisory-only mode of §13.5 → resolve to the mode transition of §19.

**Constellation §13.16 registration mandatory** (same-cut N-way sync):
- add the 5 names to the Constellation.md §13.16.9 A2A-intent allowlist.
- add an item to the AGENTS.md §5.8 N-way sync registry (Ultrasafe module version + 5 new intent registration).
- bump the plugin manifest (`plugins/ultrasafe/.claude-plugin/plugin.json`) to v0.2.0.

**Blocking mode (v0.3+) deferred**: transition after the 3-AND condition of reaching the clean-signal-gate 4-condition AND-gate + passing the user gate + ≥3 iteration consecutive clean. The transition decision itself is a Hyperbrief 4-score gate dispatch target (§19.4).

### v0.1.0 — 2026-06-06 (initial design draft cut)

**Summary**: 17-axis cross-domain synthesis backing + 8-agent v0.1.0 minimum fan-out + ≥3 iteration multi-condition AND termination + 3-layer synthesis report (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate) + 5 new Constellation A2A intents design + dual pre-release trigger (PreToolUse hook + /ultrasafe skill) + Tier A 5 critic patches absorbed inline. Advisory-only v0.1.x → blocking v0.2.x (the design intent at the time — at the v0.2.0 cut, *runtime activation = advisory mode retained*, blocking rescheduled to v0.3+).

**v0.1.0 body (§1-§13 + appendix A/B/C)**:
- §1 Concept — the identity of Ultrasafe + blocking of 4 common misreadings + 5-stage operational pipeline + Three backbones + advisory-only boundary.
- §2 Module Shape — 8-agent v0.1.0 minimum fan-out + GTA/DSP cross-cutting + diversity invariant + self-spec-gaming hazard avoidance.
- §3 Fan-out Matrix — taxonomy × methodology × actor-profile orthogonal + 13-axis dispatch matrix + Stackelberg commit-aware 2-phase.
- §4 Finding Output Contract — the finding schema of the attacker agents.
- §5 Synthesis Report 3-Layer — OSCAL + Hyperbrief IR + Greatpractice candidate.
- §6 ≥3 Iteration Loop — multi-condition AND clean signal + coverage definition + regression baseline.
- §7 Hyperbrief 4-score Routing — strict-mode reconciliation.
- §8 Constellation A2A — 5 new intents (design schema) + Spotlighting wrapper + outbox static marker scan + broker compromise surface analysis + live-board card stream.
- §9 Greatpractice Tree integration.
- §10 Pre-release Trigger + Tier — PreToolUse hook matcher + /ultrasafe skill + 3-tier classification + axis-set differentiation + iteration minimum + bypass mechanism.
- §11 Self-Spec-Gaming Hazard.
- §12 Untested Surfaces + Known Gaps + schema evolution policy.
- §13 Adoption Thresholds — 3 conditions AND + anti-criteria + Tier 1 static gate floor + plugin dependency separation + Tier A risk warning + advisory-only mode.
- Appendix A Cross-Axis Convergence Cluster Catalog — 14 clusters.
- Appendix B 4 Strong Isomorphisms + Normative justification.
- Appendix C Self-Application — the Greatpractice macro entry frontmatter of this spec itself.

**Backing research**: 17-axis cross-domain deep research (`reports/2026-06-05-ultrasafe-research/` 91 files) — harness · web · AI · threat-modeling · multi-agent · adversarial-ml · fuzzing · supply-chain · devsecops · IR · crypto · human-factors · game-theory · compliance · cognitive · visualization · protocol-trust-evolution.

---

<!-- graph-nav -->

## Related

- **Sibling modules** — [Constellation](Constellation.md) · [Superscalar](Superscalar.md) · [Hyperbrief](Hyperbrief.md) · [Greatpractice](Greatpractice.md) · [Compendium](Compendium.md)
- **Plugin** — [ultrasafe plugin](plugins/ultrasafe/README.md)
- **Project overview** — [README.md](README.md)
