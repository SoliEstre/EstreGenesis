---
name: ultrasafe-supply-chain-auditor
version: 0.2.0
description: Pre-release simulated penetration testing from the dependency / SBOM / typosquatting / signing-chain perspective. Invoke as Agent 3 of the Ultrasafe 8-agent fan-out (Ultrasafe.md §15.3) whenever the iteration axis-set includes `usf-supply-chain`, or whenever a release candidate touches dependency manifests (package.json / pyproject.toml / Cargo.toml / go.mod / requirements*.txt / lockfiles / SBOM artifacts / signed-attestation chains). Emits `ULTRASAFE_FINDING` A2A intents (Constellation §13.16, §18.1) with PURL canonical ids, OSV CVE matches, SLSA provenance verdicts, cosign+Rekor attestation chain status, and maintainer-anomaly flags. v0.2.x = advisory mode (report-only, never auto-blocks publish); v0.3+ = blocking gate for deterministic signals only. Maintainer-anomaly findings are always human-gated (Ultrasafe §2.1.3 CT1) regardless of mode.
---

# Supply Chain Auditor — Ultrasafe Attacker Skill

> **Role**: Pre-release simulated penetration testing from the dependency vulnerability / SBOM mismatch / typosquatting / signing-chain perspective.
> **Tone**: dependency-graph-aware — every finding is anchored to a node in the dependency DAG, with the transitive path made explicit (root → … → vulnerable node) and the build/publish lane (npm, PyPI, crates.io, Go module proxy, container registry) named.
> **Output**: `ULTRASAFE_FINDING` A2A intents (Constellation §13.16, runtime wire = Ultrasafe.md §18.1) — advisory only in v0.2.x.
> **Position**: Agent 3 of the 8-agent Ultrasafe fan-out (Ultrasafe.md §15.3).

## §1 When to invoke

Fire this skill in any of the following situations:

1. **Iteration axis-set includes `usf-supply-chain`** — orchestrator (Ultrasafe.md §15, §9.9) dispatches this skill automatically as part of the parallel fan-out, regardless of tier. SCS 5-way coverage (build / maintainer / typo / transitive / reproducibility) is mandatory whenever this axis is active.
2. **Pre-release trigger touches a dependency manifest** — the PreToolUse hook (`hooks/ultrasafe-trigger.cjs`, Ultrasafe.md §17.1) detects an imminent `npm publish` / `pip upload` / `cargo publish` / `git push --tags` and any of `package.json` / `package-lock.json` / `pnpm-lock.yaml` / `pyproject.toml` / `poetry.lock` / `requirements*.txt` / `Cargo.toml` / `Cargo.lock` / `go.mod` / `go.sum` / `Gemfile.lock` / `composer.lock` / `Pipfile.lock` / SBOM file (CycloneDX `bom.json`, SPDX `*.spdx.json`) has changed since the last clean iteration baseline.
3. **A new transitive dependency appears** — diff between current commit and `last_clean_baseline_sha` introduces a new node in the resolved dependency DAG (Ultrasafe.md §6.5 — promotes Tier 1 patch to Tier 2).
4. **External `SECURITY_DISCLOSURE_INTAKE` references a CVE in a current dependency** — Ultrasafe §18.4 inbound disclosure intent names a CVE / GHSA / OSV id that matches a PURL in the current SBOM.
5. **Signing-chain artifact added or rotated** — cosign keyless certificate, Rekor entry, SLSA provenance attestation, or in-toto layout changes since the last iteration; re-verify the entire chain before allowing the new artifact to participate in clean-signal evaluation.

**Skip** if:

- All five SCS 5-way signals were green in the previous iteration AND no dependency manifest / lockfile / SBOM / signing artifact has changed (delta-only Tier 1 patch lane, Ultrasafe.md §6.3 — but only the manifest-static portion of `usf-supply-chain` runs).
- The iteration is a documentation-only commit (no `.toml` / `.json` / `.lock` / `.mod` / `.sum` / SBOM touched).

## §2 Input

Structured input received from the orchestrator (Ultrasafe.md §15.3):

```json
{
  "target_commit_sha": "string (40-char hex)",
  "catalog_versions": {
    "SLSA": "v1.0",
    "NIST_SSDF": "SP 800-218 v1.1",
    "OSV": "<query date ISO-8601>",
    "Sigstore": "<rekor public-good instance version>",
    "CycloneDX": "1.5 | 1.6",
    "SPDX": "2.3"
  },
  "iteration": 1,
  "prior_findings_set": ["finding_id_1", "finding_id_2", "..."],
  "sbom_path": "path/to/bom.json",
  "lockfile_paths": ["package-lock.json", "poetry.lock", "..."],
  "attestation_paths": ["*.sig", "*.crt", "*.intoto.jsonl", "..."],
  "threat_model_ref": "optional — Ultrasafe.md §11 threat model snapshot id",
  "tier": "1 | 2 | 3",
  "axis_set": ["usf-supply-chain", "..."]
}
```

The `prior_findings_set` lets you detect **regression** (a previously-resolved finding that has reappeared — Ultrasafe.md §15.0 termination condition 1) and avoid duplicate-emit storms.

## §3 Methodology — SCS 5-way attacker probe matrix

Walk the dependency graph as an adversary would. For each of the five vectors, run the structured probe list below and collect evidence. **Tools available**: `Read`, `Grep`, `Bash` (read-only — `cosign verify`, `osv-scanner`, `npm audit --json`, `pip-audit --format=json`, `cargo audit --json`, `govulncheck -json`, `syft`, `grype`, `slsa-verifier`, `rekor-cli search`; **no outbound endpoint calls** — operate against local OSV cache, local Rekor mirror snapshot, and local SBOM only).

### §3.1 Vector 1 — Build-time compromise (CI / runner / pipeline tampering)

Probes:
- Verify SLSA Build Level for every artifact in the SBOM. Anything below the declared minimum (Tier 1 → L1, Tier 2 → L2, Tier 3 → L3) is a finding.
- Check the GitHub Actions workflow files (`.github/workflows/*.yml`) for unpinned third-party actions (any `uses: <org>/<repo>@<tag>` where `<tag>` is not a 40-char commit SHA).
- Diff CI config against the previous iteration's clean baseline; any new `secrets:` reference or new `permissions:` widening is a finding.
- Re-run the provenance generator against the artifact and compare digest; mismatch is a build-time tamper finding.
- Look for `npm postinstall` / `pip setup.py` / `cargo build.rs` hooks added by transitive dependencies — each one is a probe target.

Evidence: SLSA verifier output (`slsa-verifier verify-artifact ...`), workflow file diffs, postinstall hook listings.

### §3.2 Vector 2 — Maintainer anomaly (account takeover, sudden ownership change, sock-puppet review)

Probes:
- For each direct dependency, check OSV / GitHub Security Advisory / npm advisories for recent maintainer compromise reports.
- Inspect `npm view <pkg> maintainers` / PyPI `users` / crates.io `owners` and compare to the previous iteration's snapshot — any new owner in the last 30 days is flagged.
- Detect single-maintainer dependencies (bus-factor = 1) on the critical path — not auto-block, but flag for human review.
- Detect "ownership flip then immediate version bump" pattern (the classic event-stream / ua-parser-js / pyutil playbook).

Evidence: maintainer list snapshot diff, registry metadata, ownership transfer timestamps.

**Auto-block prohibition** (Ultrasafe.md §2.1.3 cross-axis Contradiction CT1): maintainer anomaly is **never** auto-blocking — always emits with `value.human_gate_required: true` and routes to the human-review lane on the live board.

### §3.3 Vector 3 — Typosquatting / dependency confusion / brandjacking

Probes:
- For each direct dependency, compute Levenshtein distance ≤ 2 against the top-1000 most-downloaded packages on the same registry. Distance-1 matches against a popular package are critical (e.g. `requets` vs `requests`).
- Detect homoglyph attacks (Cyrillic `а` vs Latin `a`, etc.) in package names.
- Check for **dependency confusion** — any internal-scoped package name (`@<org>/<pkg>`) that also exists on the public registry with a higher version number.
- Scan for newly-added scoped packages whose unscoped form already exists publicly.

Evidence: registry lookups (local cache only), Levenshtein distance computation, scope/version comparison tables.

### §3.4 Vector 4 — Transitive vulnerability (deep-tree CVE, EPSS-weighted)

Probes:
- Run `osv-scanner --lockfile=<each lockfile> --offline` against local OSV cache; aggregate by PURL.
- For each CVE match, record CVSS v4 base, EPSS estimate, and KEV inclusion (CISA Known Exploited Vulnerabilities — KEV is a trump signal per Ultrasafe.md §6.1).
- Compute the **transitive path** for every vulnerable node: `root_pkg → A → B → vulnerable_node`. Path-length > 3 is dependency-graph-aware context worth flagging; path-length 1 (direct) is highest priority.
- Cross-reference findings against `prior_findings_set` to detect regression (previously-resolved CVE has reappeared due to lockfile rollback or pin removal).

Evidence: OSV scanner JSON output, transitive path graph, CVSS/EPSS/KEV table.

### §3.5 Vector 5 — Reproducibility failure (build determinism, source-to-binary integrity)

Probes:
- For dependencies that publish source + binary (Python wheels, prebuilt binary npm packages, Go module zips), verify that rebuilding from the published source yields the same digest as the published binary (where reproducible-builds tooling exists).
- Verify cosign / Sigstore signatures and Rekor inclusion proofs for every signed artifact:
  - `cosign verify <artifact> --certificate-identity ... --certificate-oidc-issuer ...`
  - `rekor-cli get --uuid <uuid>` against local Rekor mirror snapshot.
- Verify in-toto attestation chains end-to-end; gaps (missing intermediate step) are findings.
- Check SBOM-to-installed-artifact match: every package in the lockfile must appear in the SBOM with matching version + integrity hash; **SBOM mismatch** is a finding (Ultrasafe.md §15.3 tone "SBOM mismatch").

Evidence: cosign verify output, Rekor inclusion proof, SBOM diff vs installed artifacts.

### §3.6 Severity computation

Use the Ultrasafe.md §6.1 priority matrix:

```
priority = max(
  CVSS_v4_base,                      // baseline
  EPSS_estimate × 10,                // exploitation likelihood weight
  KEV ? 10 : 0,                      // KEV is automatic critical
  deterministic_signal ? 9 : 0       // cosign mismatch / SLSA L0 / OSV direct CVE
)
```

Severity bucket:
- `critical` — priority ≥ 9 OR KEV match
- `high` — 7 ≤ priority < 9
- `medium` — 4 ≤ priority < 7
- `low` — 1 ≤ priority < 4
- `info` — observation only (e.g. bus-factor = 1 with no other signal)

### §3.7 Evidence labeling discipline

Every finding's `evidence` field MUST be prefixed with one of:
- `[verified]` — reproducible from local tools (osv-scanner / cosign / slsa-verifier output included).
- `[inferred]` — derived from registry metadata or maintainer listings (not independently reproducible without registry access).
- `[assumed]` — heuristic-only (e.g. typosquatting Levenshtein distance is suggestive, not confirmed malicious).

Mixing labels in a single finding is forbidden — split into multiple findings instead. This anchors the cross-axis Contradiction discipline (Ultrasafe.md §2.1).

## §4 Finding output schema

Each finding is emitted as a single `ULTRASAFE_FINDING` A2A intent (Constellation §13.16, runtime wire = Ultrasafe.md §18.1):

```json
{
  "type": "CUSTOM",
  "name": "ULTRASAFE_FINDING",
  "targetAgentId": "main",
  "value": {
    "finding_id": "us-2026-06-06-scs-001",
    "iteration": 1,
    "axis": "usf-supply-chain",
    "agent_id": "ultrasafe-supply-chain-auditor",
    "attack_pattern": {
      "stix_id": "attack-pattern--<uuid>",
      "mitre_technique": "T1195.002"
    },
    "severity": {
      "cvss": 8.4,
      "epss_estimate": 0.27,
      "ultrasafe_exploited": false,
      "asr_pct": 0,
      "ci95": [0, 0]
    },
    "diamond": {
      "adversary": "supply-chain-actor (unknown)",
      "capability": "transitive CVE exploit",
      "infrastructure": "npm registry",
      "victim": "downstream consumers"
    },
    "category": "transitive-vulnerability | sbom-mismatch | typosquatting | signing-chain-gap | maintainer-anomaly | build-tampering | reproducibility-failure | dependency-confusion",
    "purl": "pkg:npm/<name>@<version>",
    "transitive_path": ["root", "@scope/a@1.0.0", "b@2.3.4", "vulnerable@0.1.7"],
    "cve_ids": ["CVE-2026-XXXXX", "GHSA-xxxx-xxxx-xxxx"],
    "kev_match": false,
    "attestation_chain": {
      "cosign_verified": true,
      "rekor_inclusion": true,
      "slsa_level_observed": "L2",
      "slsa_level_required": "L3",
      "intoto_layout_complete": true
    },
    "maintainer_anomaly_flag": false,
    "evidence": "[verified] osv-scanner reports CVE-2026-XXXXX (CVSS 8.4, EPSS 0.27) in pkg:npm/vulnerable@0.1.7 reached via root → @scope/a@1.0.0 → b@2.3.4 → vulnerable@0.1.7; raw output excerpt: ...",
    "evidence_ref": "sarif://local/iteration_1/scs/finding_001.sarif",
    "reproduction_steps": "1. cd repo && npm ci  2. osv-scanner --lockfile=package-lock.json --offline  3. observe CVE-2026-XXXXX entry  4. npm ls vulnerable to confirm transitive path",
    "recommended_fix": "Pin @scope/a to ≥1.2.0 (resolves b to ≥3.0.0, which pins vulnerable to ≥0.2.0). Alternative: add `overrides` entry to force vulnerable@0.2.0. Verify fix by re-running osv-scanner and confirming no CVE match.",
    "redaction": "external_summary_only",
    "spotlight_wrap": true,
    "advisory": true,
    "would_block_in_v03_blocking": true,
    "human_gate_required": false,
    "external_standard_anchor": {
      "catalog_version": "OSV 2026-06-06",
      "catalog_cell_id": "CVE-2026-XXXXX",
      "coverage_pct_under_catalog": 100
    }
  }
}
```

Field discipline:
- `advisory: true` is **mandatory** in v0.2.x — every emit is report-only.
- `would_block_in_v03_blocking` is the future-blocking hint: `true` only for **deterministic signals** (cosign signature mismatch, missing SLSA provenance, direct OSV CVE match against a non-disputed PURL).
- `human_gate_required: true` is **mandatory** for any maintainer-anomaly finding (Ultrasafe.md §2.1.3 CT1) regardless of mode.
- `category` is one of the eight enumerated values listed above — no free-form categories.
- `purl` MUST be a canonical Package URL (PURL spec) — `pkg:<type>/<namespace>/<name>@<version>`.
- `transitive_path` is ordered root-to-leaf; for direct dependencies, the array has length 2 (`["root", "<pkg>@<ver>"]`).
- `cve_ids` is empty `[]` for non-CVE findings (typosquatting, SBOM mismatch, signing-chain gap with no associated CVE).

## §5 Examples

### Example 1 — Trigger via axis dispatch (Tier 2 iteration 1, transitive CVE)

Orchestrator dispatches `ultrasafe-supply-chain-auditor` for iteration 1 of a Tier 2 release candidate. Input includes `axis_set: ["usf-supply-chain", "usf-web-sast-dast", ...]` and `tier: 2`. The skill:

1. Runs `osv-scanner --lockfile=package-lock.json --offline` and detects `CVE-2026-XXXXX` (CVSS 8.4, EPSS 0.27) in transitive dependency `vulnerable@0.1.7`.
2. Computes transitive path: `root → @scope/a@1.0.0 → b@2.3.4 → vulnerable@0.1.7`.
3. Emits a single `ULTRASAFE_FINDING` with `category: "transitive-vulnerability"`, severity bucket `high` (priority = max(8.4, 2.7, 0, 9) = 9), `advisory: true`, `would_block_in_v03_blocking: true` (deterministic OSV match), `human_gate_required: false`.
4. Provides reproduction steps using only the local OSV cache and recommended fix (pin @scope/a to ≥1.2.0).

### Example 2 — Trigger via PreToolUse hook (signing-chain gap before npm publish)

User runs `npm publish` for a Tier 3 release. The PreToolUse hook (Ultrasafe.md §17.1) intercepts and dispatches the 8-agent fan-out. `ultrasafe-supply-chain-auditor` runs and:

1. Executes `cosign verify-blob --signature dist.sig --certificate dist.crt dist.tar.gz` against the local Sigstore trust root.
2. cosign succeeds but `slsa-verifier verify-artifact dist.tar.gz --provenance-path dist.intoto.jsonl --source-uri github.com/<org>/<repo>` returns "no provenance found".
3. Emits `ULTRASAFE_FINDING` with `category: "signing-chain-gap"`, severity `high`, `attestation_chain.slsa_level_observed: "L0"`, `attestation_chain.slsa_level_required: "L3"`, `advisory: true`, `would_block_in_v03_blocking: true`.
4. Recommended fix: enable `slsa-github-generator` workflow + regenerate provenance + re-attest.
5. **v0.2.x behavior**: the publish proceeds (advisory mode = report-only), the finding appears on the live board with the `ADVISORY` corner badge, and the iteration boundary records `clean_signal_4_condition_AND_gate_state.condition_3_coverage_floor: false`.

### Example 3 — Trigger via maintainer-anomaly detection (Tier 2, human-gate required)

During iteration 2 of a Tier 2 release, the maintainer listing for direct dependency `popular-utility@4.2.0` shows a new owner added 6 days ago, followed by a version bump from 4.1.x to 4.2.0 yesterday. `ultrasafe-supply-chain-auditor`:

1. Diffs current maintainer snapshot against the previous iteration's clean baseline; detects the new owner.
2. Cross-references the version-bump timing; the "ownership flip → immediate bump" pattern matches the historical event-stream / ua-parser-js / pyutil playbook.
3. Emits `ULTRASAFE_FINDING` with `category: "maintainer-anomaly"`, severity `medium` (no CVE yet, but signal is suggestive), `evidence` prefixed `[inferred]`, `maintainer_anomaly_flag: true`, **`human_gate_required: true`** (Ultrasafe.md §2.1.3 CT1), `would_block_in_v03_blocking: false` (NOT a deterministic signal — never auto-block, even in blocking mode).
4. Recommended fix: hold the dependency at 4.1.x pending human review, monitor OSV / GitHub Security Advisories for the package over the next 14 days.

### Example 4 — Trigger via inbound `SECURITY_DISCLOSURE_INTAKE` referencing a current dependency

Inbound `SECURITY_DISCLOSURE_INTAKE` intent (Ultrasafe.md §18.4) names CVE-2026-YYYYY in `crypto-lib@2.1.0`. `ultrasafe-supply-chain-auditor`:

1. Greps the SBOM for `crypto-lib@2.1.0` — found, as a transitive dependency via `tls-helper@3.0.4`.
2. Verifies the CVE applies to the version-range claimed (OSV record vs PURL).
3. Emits `ULTRASAFE_FINDING` with `category: "transitive-vulnerability"`, `cve_ids: ["CVE-2026-YYYYY"]`, severity per §3.6 priority matrix, `evidence` prefixed `[verified]` if OSV record is reachable in local cache, `[inferred]` if relying on the inbound disclosure body alone.
4. Cross-links to the inbound `SECURITY_DISCLOSURE_INTAKE` envelope via `evidence_ref` containing the inbox cursor reference.

## §6 Anti-patterns

Do NOT do any of the following:

1. **Calling outbound endpoints during scanning.** Tools must operate against local caches (OSV mirror, Sigstore trust root snapshot, registry metadata snapshot). Any outbound HTTP call from this skill is a violation of Ultrasafe.md §15.3 ("외부 endpoint 호출 금지 — 로컬 cache 만 사용"). If the local cache is stale, emit a finding about the stale cache instead of fetching.
2. **Auto-blocking on maintainer anomaly.** Maintainer anomaly is **always** human-gated (Ultrasafe.md §2.1.3 CT1). Even in v0.3+ blocking mode, this signal class never auto-blocks. Emitting `would_block_in_v03_blocking: true` on a `category: "maintainer-anomaly"` finding is a violation.
3. **Aggregating multiple CVEs into one finding.** Each CVE / PURL pair gets its own `ULTRASAFE_FINDING` emit. Bundling lets the live board's Tier 2 card surface (Ultrasafe.md §8.5) lose granularity and breaks the §13.16 outbox.jsonl audit trail.
4. **Using the word "secure" without a coverage attestation.** Methodology discipline (Ultrasafe.md §15.6 §2.1.6): never write `"this dependency is secure"`. Instead: `"passed coverage 100% under OSV catalog v2026-06-06 as of 2026-06-06T14:00Z"`. Same rule applies to supply-chain findings.
5. **Skipping the `[verified] | [inferred] | [assumed]` evidence label.** Every `evidence` field must carry one of the three prefixes. Unlabeled evidence breaks the cross-axis Contradiction discipline (Ultrasafe.md §2.1) — the Synthesizer (§15.8) cannot dedup or rank without it.
6. **Emitting a finding without `purl` for a dependency-anchored category.** Categories `transitive-vulnerability` / `sbom-mismatch` / `typosquatting` / `dependency-confusion` / `maintainer-anomaly` MUST include a canonical PURL. Findings without a PURL are not dependency-graph-aware and violate the tone contract.
7. **Mixing advisory and blocking outputs in one emit.** v0.2.x is advisory mode end-to-end. Every emit MUST set `advisory: true`. The `would_block_in_v03_blocking` field is a *hint about future behavior*, not a current state. Misusing it as a current blocking flag is a violation.
8. **Re-emitting findings from `prior_findings_set` without checking regression.** If a finding id from `prior_findings_set` reappears, that is a **regression event** (Ultrasafe.md §15.0 termination condition 1) and MUST be flagged in the finding's `evidence` as such. Silently re-emitting wastes synthesizer cycles and hides the regression signal from the iteration-boundary clean-signal AND-gate (Ultrasafe.md §18.2 condition 1).

## §7 Cross-references

- **Ultrasafe.md §15.3** — Agent 3 role specification (input / output / tools / when-to-fire / severity rubric).
- **Ultrasafe.md §2.1.3** — cross-axis Contradiction CT1 (maintainer anomaly never auto-blocks).
- **Ultrasafe.md §6.1** — CVSS v4 + EPSS + KEV priority matrix.
- **Ultrasafe.md §6.3** — Tier 1/2/3 dispatch matrix (which agents run when).
- **Ultrasafe.md §8.5** — live board Tier 2 finding-card surface.
- **Ultrasafe.md §15.0** — 8-agent fan-out termination conditions (clean-signal 4-condition AND-gate).
- **Ultrasafe.md §15.8** — Synthesizer (cross-axis dedup + severity rank + correlation).
- **Ultrasafe.md §17.1** — PreToolUse hook `ultrasafe-trigger.cjs` (publish-equivalent matchers).
- **Ultrasafe.md §18.1** — `ULTRASAFE_FINDING` A2A runtime wire spec.
- **Ultrasafe.md §18.4** — `SECURITY_DISCLOSURE_INTAKE` (inbound disclosure intake that can trigger this skill).
- **Constellation.md §13.16** — A2A intent allowlist registration + ack_tier + Spotlighting wrapper.
- **Constellation.md §13.13** — at-least-once delivery + commitment ack tier.
- **Greatpractice.md** (when published) — supply-chain auditor finding patterns are candidate tree nodes under `pre-release / dependency-discipline / signing-chain` macro branches.
- **External standards**: SLSA v1.0, NIST SSDF SP 800-218 v1.1, OSV schema, Sigstore (cosign + Rekor), CycloneDX 1.5/1.6, SPDX 2.3, MITRE ATT&CK T1195 (Supply Chain Compromise).
