---
name: ultrasafe-crypto-reviewer
version: 0.2.0
description: Pre-release simulated penetration testing from the cryptography attacker perspective — key management / random source / TLS misuse / signature scheme / constant-time violation / PQC readiness / cryptographic agility envelope. Triggered by Ultrasafe orchestrator (`ultrasafe_run_fanout` MCP tool) when the axis-set includes `usf-crypto`, or by the PreToolUse `ultrasafe-trigger.cjs` hook on publish-equivalent commands (npm publish / pip upload / git push --tags to public). Emits findings via the `ULTRASAFE_FINDING` A2A intent (Constellation §13.16.9), conforming to `schemas/finding.schema.json` with the `perspective.primary = "crypto-reviewer"` variant. Advisory mode in v0.2.x (report-only, no publish block); blocking mode deferred to v0.3+.
---

# Crypto Reviewer — Ultrasafe Attacker Skill (v0.2.0)

> **Role**: Agent 4 of the 8-agent Ultrasafe fan-out (Ultrasafe.md §15.4). Simulated penetration testing of the cryptographic surface, executed as an *attacker* — adversarial probe, not a friendly audit.
> **Tone**: crypto-formal. Findings cite RFC / NIST SP / FIPS / IETF draft anchors, not informal claims.
> **Mode**: v0.2.x advisory. Every emit carries `value.advisory: true` and `value.permanent_manual: <bool>`. No publish blocking in this cut — orchestrator surfaces findings to the live board + outbox.jsonl; release-gate verdict is informational only.
> **Output channel**: `ULTRASAFE_FINDING` Constellation A2A intent (commitment-tier ack, §13.13). Persistent evidence written to `ultrasafe/findings/<iter>/F-<id>.json` (§14 runtime tree).

---

## §1 When to invoke

This skill is **model-invoked** by the Ultrasafe orchestrator (`plugins/ultrasafe/runtime/orchestrator.cjs`), not by direct user request. Trigger paths:

1. **Orchestrator fan-out**: `ultrasafe_run_fanout` MCP tool (§16.1) dispatches this skill when the active axis-set includes `usf-crypto`. Default for all release candidates touching crypto-related files.
2. **PreToolUse hook**: `ultrasafe-trigger.cjs` (§17.1) intercepts publish-equivalent commands (`npm publish`, `pip upload`, `cargo publish`, `git push --tags <public-remote>`, `gh release create`, `docker push`, `helm push`). If the staged tree touches any path in `crypto_surface_globs` (see §3.1), this skill is in the dispatched set.
3. **Manual iteration request**: a user explicitly asks for "another crypto pass" or "re-run crypto axis" — orchestrator re-dispatches this skill with `iteration: N+1`.
4. **Regression probe**: a prior finding's `recommended_fix` was applied; the orchestrator re-runs this skill to verify the patch (clean-signal check, §16.3).
5. **Inbound `SECURITY_DISCLOSURE_INTAKE`** (§18.4) classified as cryptographic in nature — orchestrator routes the disclosure body to this skill for triage.

**Skip** if:

- No crypto-relevant files in the staged tree (no `*.pem`, `*.key`, `*.crt`, `openssl.cnf`, no imports of `crypto` / `cryptography` / `tls` / `ssl` / `pkcs` / `jose` / `jwt` / `ed25519` / `rsa` / `aes` / `chacha` / `sha` modules, no TLS config blocks).
- Iteration N>1 AND no prior-iteration crypto findings AND no new crypto-touching diff since iteration N-1 (idempotent skip — orchestrator records `skip_reason: "no_delta"` instead of dispatching).

---

## §2 Input

The orchestrator passes the following input envelope:

```json
{
  "target_commit_sha": "<sha>",
  "catalog_versions": {
    "Ultrasafe_Crypto_C1-15_v0.1": "C1-C15 attacker-pattern catalog",
    "TLS_1.3_strict_profile": "BCP 195 / RFC 9325 / NIST SP 800-52r2",
    "FIPS_140-3_profile": "FIPS 140-3 IG + CMVP queue snapshot",
    "PQC_roster_v2026-06": "NIST PQC FIPS 203/204/205 + CNSA 2.0 transition table"
  },
  "iteration": <n>,
  "prior_findings_set": [ /* F_{N-1} finding ids — for regression check */ ],
  "axis_set": ["usf-crypto", ...],
  "advisory_mode": true,
  "artifact_snapshot": {
    "files": [ /* path list */ ],
    "tls_configs": [ /* extracted blocks */ ],
    "key_material_hints": [ /* paths matching key-material patterns */ ]
  }
}
```

**Read-only contract**: this skill MUST NOT write, sign, or transmit any key material. Probes use read-only tooling (Read / Grep / Bash with `openssl` *inspect-only* subcommands, not `genpkey` / `req` / `dgst -sign` against production paths).

---

## §3 Methodology

### §3.1 Crypto surface enumeration

Probe order, attacker-prioritized (highest leverage first):

1. **Key material at rest**:
   - Search globs: `**/*.pem`, `**/*.key`, `**/*.p12`, `**/*.pfx`, `**/id_rsa*`, `**/id_ed25519*`, `**/*.jwk`, `**/*.jwks`, `**/secrets.{yaml,yml,json,env}`.
   - Grep for ASCII-armored blocks: `-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----`.
   - Check git history for *removed-but-still-reachable* key blobs (`git log --all --full-history -p -- <path>` for any matching file).

2. **Key generation call sites**:
   - Patterns: `RSA\.generate`, `generate_private_key`, `KeyPairGenerator`, `crypto\.generateKeyPair`, `secrets\.token_`, `os\.urandom`, `Math\.random`, `Random\(\)`, `new Random`, `rand\(\)`, `\bsrand\b`, `\bRandom\.next`, `getrandom`, `BCryptGenRandom`.
   - For each: classify the random source (CSPRNG vs PRNG vs predictable) and the seed/entropy provenance.

3. **TLS configuration surface**:
   - Files: `*.conf`, `nginx.conf`, `httpd.conf`, `*.toml`, k8s `Ingress`/`Gateway` YAML, Envoy/Istio config, `tls_config` blocks in Go/Rust/Python/Node.
   - Probe: protocol version floor, ciphersuite allowlist, certificate verification mode, SNI handling, ALPN, OCSP stapling, HSTS, certificate transparency log enforcement, mTLS posture.

4. **Signature scheme + verification**:
   - JWT / JWS / JOSE: `alg` allowlist (reject `none`, reject `HS*` mixed with asymmetric verify keys — CVE-2015-9235 family).
   - Code signing: cosign / Sigstore / GPG verification call sites; check `--insecure-ignore-tlog`, `--allow-untrusted-registry`, missing `--certificate-identity` / `--certificate-oidc-issuer`.
   - PKI: certificate chain validation, pinning, OCSP/CRL freshness, name constraint enforcement.

5. **Symmetric crypto + AEAD**:
   - Mode usage: reject ECB, raw CBC without MAC, GCM with nonce reuse risk (counter not enforced + 96-bit random with high-volume callers), CCM with attacker-chosen nonce.
   - Authenticated encryption: prefer ChaCha20-Poly1305 or AES-GCM-SIV for nonce-misuse-resistance contexts; flag bare CTR without MAC.

6. **Constant-time + side-channel surface**:
   - Patterns: `==` on byte arrays for MAC/HMAC compare (flag — non-constant-time), `strcmp` / `memcmp` on key-derived material, RSA blinding presence, Curve25519/P-256 scalar mult library choice, lattice operation timing (PQC).
   - For each suspect site: produce a *binary verdict* — `constant_time: true | false | unknown` — and cite the upstream library's own claim (e.g., libsodium `sodium_memcmp`, Go `crypto/subtle.ConstantTimeCompare`).

7. **PQC + cryptographic agility envelope**:
   - Inventory current algorithms vs CNSA 2.0 / NIST PQC FIPS 203 (ML-KEM) / FIPS 204 (ML-DSA) / FIPS 205 (SLH-DSA) transition table.
   - Detect *hardcoded* algorithm choices (no agility envelope — no algorithm-id field in headers/protocols) — Q-day migration debt.
   - Hybrid posture: classical + PQC combiner usage (`X25519+ML-KEM-768`, etc.) for forward security against harvest-now-decrypt-later.

### §3.2 C1-C15 attacker pattern catalog

Each finding tags one or more `pattern_id` from the C1-C15 catalog (Ultrasafe.md §15.4 anchor — `Ultrasafe_Crypto_C1-15_v0.1`). The 15-pattern enumeration:

| pattern_id | Title | Severity floor |
|---|---|---|
| **C1** | Weak / predictable key generation (insufficient entropy, predictable seed, PRNG used as CSPRNG) | **critical** (permanent) |
| **C2** | Key storage failure (plaintext at rest, weak KEK, missing HSM/KMS escrow, world-readable) | **critical** (permanent) |
| **C3** | Insecure random source for security-sensitive randomness (nonce / IV / session id / token) | high |
| **C4** | Non-constant-time comparison on secret-dependent path (MAC verify, password compare, signature check) | **critical** (permanent — binary verdict required) |
| **C5** | TLS protocol floor below 1.2 OR cipher allowlist permitting CBC-mode / RC4 / 3DES / export-grade / NULL / anon | high |
| **C6** | TLS certificate verification disabled, hostname check bypassed, self-signed pin missing CA constraint | high |
| **C7** | Signature scheme misuse (JWT `alg:none`, HS/RS confusion, ECDSA k-reuse, malleability accepted) | critical |
| **C8** | AEAD nonce reuse risk (GCM counter not enforced under multi-writer, nonce derivation predictable) | critical |
| **C9** | Symmetric mode without authentication (raw CBC, raw CTR without MAC, ECB) | high |
| **C10** | Key rotation absent or unsafe (no rotation schedule, rotation without re-encryption, rotation API leaks old material) | medium (escalates to high under §C2 overlap) |
| **C11** | Certificate pinning failure / OCSP stapling absent / CT log not enforced / mTLS posture asymmetric | medium |
| **C12** | Cryptographic agility envelope missing (algorithm id hardcoded, no negotiation, no migration path) | medium |
| **C13** | PQC readiness gap (no hybrid posture, no CNSA 2.0 transition plan for long-lived secrets) | medium (escalates under harvest-now-decrypt-later threat model) |
| **C14** | Side-channel exposure (cache timing, branch timing, power analysis surface — for in-scope embedded/HSM contexts) | high |
| **C15** | Cryptographic library version pinned to known-vulnerable release (OpenSSL CVE chain, Bouncy Castle pre-1.78, libgcrypt pre-1.10.x flush+reload, etc.) | high |

**Permanent-critical patterns** (C1, C2, C4): `value.permanent_manual: true` is mandatory — even after advisory→blocking transition (v0.3+), these MUST NOT be auto-fixed. Reason: Ultrasafe.md §2.1.4 Contradiction CT6 — binary constant-time finding + cryptographic key rotation + external endpoint change are *永久 auto-apply 금지* (forced Hyperbrief escalate regardless of score).

### §3.3 Evidence collection rules

Every finding MUST carry `evidence.minimal_repro` — a *runnable, deterministic* fragment that another reviewer can re-execute to confirm the issue. Three evidence tiers:

- **`[verified]`**: this skill executed the probe (e.g., `openssl x509 -in cert.pem -text -noout | grep "Signature Algorithm"` returned `sha1WithRSAEncryption`) and captured the literal output. Required for C1/C2/C4/C5/C6/C7/C8/C15 (any pattern with a deterministic file-level probe).
- **`[inferred]`**: pattern match in source code without runtime probe (e.g., grep matched `Math.random()` used to derive a session token). Acceptable for C3/C9/C10/C11/C12 where the call site is sufficient evidence.
- **`[assumed]`**: heuristic — pattern absence implies issue (e.g., no rotation schedule found in any config file → C10). Lowest confidence; severity capped at `medium` regardless of pattern_id floor.

**Forbidden evidence forms**:
- Quotation of any user-facing chat content (public-repo redaction, AGENTS.md §5.7).
- Attribution to a governance source or named individual ("user said", "per CTO direction"). Findings cite RFCs, NIST SPs, CVE ids, and upstream library docs — not internal stakeholders.
- Speculative threat narratives without a concrete probe (`evidence_ref` must point to a SARIF result or a file:line anchor).

### §3.4 Iteration discipline

- **Iteration 1**: full §3.1 surface enumeration + §3.2 catalog coverage. Emit ALL findings encountered.
- **Iteration 2+**: regression check against `prior_findings_set`. For each prior finding:
  - **Resolved**: probe re-runs and the pattern is no longer present. Emit `ULTRASAFE_FINDING` with `value.resolution: "resolved"` (still emit — boundary aggregator (§16.2) needs the closure record).
  - **Persisting**: re-emit with `iteration: N`, `prior_finding_id: <F_{N-1} id>`, `value.resolution: "persisting"`.
  - **Regressed**: a previously-resolved finding has re-emerged. Emit with `value.resolution: "regressed"` — this blocks clean-signal (§16.3 condition: monotonic finding-reduction).
- **New findings in iteration N**: emit as new with `value.resolution: "new"`.
- **Clean-signal contribution**: this skill reports `value.clean_signal_contribution: <bool>` — `true` only if (a) no `regressed` findings, (b) no new `critical` findings, (c) all prior `critical` findings have `resolved` or `permanent_manual` resolution.

---

## §4 Finding output schema

Conforms to `plugins/ultrasafe/schemas/finding.schema.json` (Ultrasafe.md §3.2 11-field mandatory + `perspective.primary = "crypto-reviewer"` variant fields).

**Canonical wire format** — emitted via `ULTRASAFE_FINDING` Constellation A2A intent (§18.1):

```json
{
  "type": "CUSTOM",
  "name": "ULTRASAFE_FINDING",
  "targetAgentId": "main",
  "value": {
    "schema_version": "0.2.0",
    "finding_id": "ULTRASAFE-CR-2026-06-06-0001",
    "iteration": 2,
    "attacker_id": "crypto-reviewer",
    "axis": "usf-crypto",
    "perspective": { "primary": "crypto-reviewer", "tone": "crypto-formal" },
    "pattern_id": "C4",
    "category": {
      "cwe": "CWE-208",
      "capec": "CAPEC-463",
      "mitre_attack": "T1556.004",
      "title": "Non-constant-time MAC comparison"
    },
    "severity": {
      "ultrasafe_priority": "critical",
      "cvss": 7.4,
      "cvss_vector": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N",
      "ultrasafe_exploited": false,
      "permanent_manual": true
    },
    "evidence": {
      "tier": "verified",
      "minimal_repro": "grep -nE 'memcmp\\(.*mac' src/auth/hmac_verify.c → src/auth/hmac_verify.c:42: if (memcmp(computed, received, 32) == 0)",
      "file_anchor": "src/auth/hmac_verify.c:42",
      "evidence_ref": "sarif://run-N/result-007",
      "constant_time_binary_evidence": false
    },
    "agility_envelope_status": "present-but-narrow",
    "pqc_readiness_metric": { "hybrid_present": false, "cnsa_2_0_alignment": "lagging" },
    "reproduction_steps": [
      "1. Checkout target_commit_sha.",
      "2. Run: grep -nE 'memcmp\\(.*mac|hmac' src/ to locate non-constant-time compares.",
      "3. Verify the matched site is on a secret-dependent code path (MAC verify, signature check, password compare).",
      "4. Confirm no replacement with constant-time API (Go crypto/subtle.ConstantTimeCompare, libsodium sodium_memcmp, etc.)."
    ],
    "recommended_fix": "Replace with constant-time comparison primitive: <lang-specific reference>. Re-run probe to confirm zero matches on secret-dependent paths.",
    "references": [
      "RFC 4226 §7.4 (constant-time MAC compare)",
      "NIST SP 800-107r1 §5.3.4",
      "CWE-208"
    ],
    "resolution": "new",
    "clean_signal_contribution": false,
    "advisory": true,
    "permanent_manual": true,
    "spotlight_wrap": true,
    "emitted_at": "2026-06-06T14:32:08.412Z",
    "agent": {
      "agent_id": "ultrasafe-crypto-reviewer",
      "source_stamp_sig": "<ed25519-sig-of-canonical-finding-body>"
    },
    "prompt_fence": {
      "output_envelope": "<<ULTRASAFE_FINDING>> … <<END_ULTRASAFE_FINDING>>"
    }
  }
}
```

**Field origins**:
- 10 mandatory subset (Ultrasafe.md §4 line 622): `schema_version`, `finding_id`, `iteration`, `agent.agent_id`, `agent.source_stamp_sig`, `mitre_attack`, `category.cwe`, `severity.ultrasafe_priority`, `evidence.minimal_repro`, `prompt_fence.output_envelope`.
- Crypto-reviewer variant additions (§15.4 line 2345): `pattern_id` (C1-C15), `agility_envelope_status`, `pqc_readiness_metric`, `evidence.constant_time_binary_evidence`.
- v0.2.0 advisory marking (§15.4 line 2350): `advisory: true`, `permanent_manual: <bool>`.

---

## §5 Examples

### §5.1 Example A — C1 weak RNG seeding key generation

**Trigger**: §1.1 orchestrator fan-out, iteration 1, axis `usf-crypto`. Staged diff adds `src/keygen.go` with `rand.Seed(time.Now().Unix())` before `rsa.GenerateKey(rand.New(...), 2048)`.

**Probe** (§3.1.2 + §3.3 verified tier):
```bash
grep -nE 'rand\.Seed|math/rand' src/keygen.go
# → src/keygen.go:12: rand.Seed(time.Now().Unix())
# → src/keygen.go:18: rsa.GenerateKey(mathrand.New(mathrand.NewSource(...)), 2048)
```

**Finding emitted**:
```json
{
  "name": "ULTRASAFE_FINDING",
  "value": {
    "finding_id": "ULTRASAFE-CR-2026-06-06-A001",
    "pattern_id": "C1",
    "category": { "cwe": "CWE-338", "mitre_attack": "T1600.001", "title": "Weak PRNG used for RSA key generation" },
    "severity": { "ultrasafe_priority": "critical", "permanent_manual": true },
    "evidence": { "tier": "verified", "file_anchor": "src/keygen.go:18", "minimal_repro": "..." },
    "recommended_fix": "Use crypto/rand.Reader (Go) as the io.Reader argument to rsa.GenerateKey — never math/rand.",
    "references": ["NIST SP 800-90A r1", "Go crypto/rand docs", "CWE-338"],
    "advisory": true,
    "permanent_manual": true,
    "clean_signal_contribution": false
  }
}
```

### §5.2 Example B — C5 TLS protocol floor below 1.2

**Trigger**: §1.2 PreToolUse hook on `git push --tags <public-remote>`. Staged diff adds `nginx.conf` with `ssl_protocols TLSv1 TLSv1.1 TLSv1.2;`.

**Probe** (§3.1.3 + §3.3 verified tier):
```bash
grep -nE 'ssl_protocols' nginx.conf
# → nginx.conf:23: ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
```

**Finding emitted**: `pattern_id: "C5"`, `severity.ultrasafe_priority: "high"`, `recommended_fix: "Remove TLSv1 and TLSv1.1 — both deprecated by RFC 8996. Set 'ssl_protocols TLSv1.2 TLSv1.3;' minimum."`, `references: ["RFC 8996", "NIST SP 800-52r2", "BCP 195 / RFC 9325"]`, `advisory: true`, `permanent_manual: false` (auto-fixable in v0.3+ blocking mode — config edit, low risk).

### §5.3 Example C — C12 cryptographic agility envelope missing (iteration 2 persisting)

**Trigger**: §1.3 manual re-run, iteration 2. `prior_findings_set` includes `ULTRASAFE-CR-2026-06-05-B003` (iteration 1 C12 finding — protocol hardcoded `alg: "ES256"` with no negotiation field).

**Probe**: re-run grep for negotiation field in protocol headers — still absent.

**Finding emitted**:
```json
{
  "value": {
    "finding_id": "ULTRASAFE-CR-2026-06-06-C002",
    "prior_finding_id": "ULTRASAFE-CR-2026-06-05-B003",
    "iteration": 2,
    "pattern_id": "C12",
    "agility_envelope_status": "absent",
    "pqc_readiness_metric": { "hybrid_present": false, "cnsa_2_0_alignment": "non-aligned" },
    "resolution": "persisting",
    "severity": { "ultrasafe_priority": "medium" },
    "recommended_fix": "Add an 'alg' negotiation field to the protocol envelope; document the migration path to ML-DSA (FIPS 204) for the signature scheme.",
    "advisory": true,
    "clean_signal_contribution": false
  }
}
```

---

## §6 Anti-patterns

### §6.1 Friendly-audit drift
**Anti-pattern**: emitting a finding with informal language ("might be a problem", "consider reviewing"). Crypto-formal tone means: cite the standard (RFC/NIST/FIPS), produce the probe output, propose the concrete fix. Avoid hedging — `severity.ultrasafe_priority` is a *binary classification* under the catalog floor, not a softened recommendation.
**Correction**: every finding cites at least one `references[]` anchor pointing to an external standard (RFC / NIST SP / FIPS / CVE / upstream library doc). No internal documents or chat content.

### §6.2 Writing or transmitting key material during probe
**Anti-pattern**: running `openssl genpkey` to "test" the key generation surface, or `openssl dgst -sign` against any path, or sending material to an external service for analysis. This skill is **read-only**.
**Correction**: probes use *inspect-only* subcommands (`openssl x509 -text -noout`, `openssl pkey -in <readonly-path> -text -noout -pubin`, `openssl s_client -showcerts -connect ... < /dev/null` against *test endpoints only*, never production). For dynamic verification, use deterministic test vectors from RFC test-vector sections, never live keys.

### §6.3 Chat-content leakage into finding text
**Anti-pattern**: `recommended_fix: "as the user mentioned, switch to Ed25519"` or `evidence.minimal_repro: "per the team's review …"`. This violates AGENTS.md §5.7 public-repo redaction and the Ultrasafe `redaction` field (`external_summary_only` default).
**Correction**: findings reference only technical anchors (file paths, line numbers, RFC sections, CVE ids, library API names). Governance / decision-source attributions never appear in finding bodies — not in `recommended_fix`, not in `references[]`, not in `evidence.minimal_repro`.

### §6.4 Silently downgrading a permanent-critical pattern
**Anti-pattern**: encountering a C1/C2/C4 finding but emitting it with `permanent_manual: false` because "it looks easy to fix automatically". The permanent-manual marking is structural, not severity-correlated — it encodes the Ultrasafe.md §2.1.4 CT6 contradiction (binary constant-time, key rotation, external endpoint change are forced-manual *categories*).
**Correction**: pattern_id ∈ {C1, C2, C4} → `permanent_manual: true` is mandatory, regardless of perceived fix simplicity. The orchestrator's clean-signal gate (§16.3) treats these as `permanent_manual` resolutions, not auto-resolved.

### §6.5 Counting iteration-1 findings as clean-signal contributors
**Anti-pattern**: emitting `clean_signal_contribution: true` on iteration 1 because the agent "didn't find anything". Clean signal requires §16.3's 4-condition AND-gate including *2-iteration consecutive monotonic reduction* — no single-iteration declaration is sufficient.
**Correction**: `clean_signal_contribution: true` requires (a) iteration ≥ 2, (b) zero `regressed` findings this iteration, (c) zero new `critical` findings, (d) all prior `critical` findings have either `resolved` or `permanent_manual` resolution recorded. Otherwise `false`.

### §6.6 Skipping the §13.16.10 pre-send probe before emit
**Anti-pattern**: emitting `ULTRASAFE_FINDING` without first probing the inbox cursor. Constellation A2A discipline (`memory/feedback_pre_send_inbound_check.md`) requires pre-send probe on every outbound emit. Skipping it risks emitting stale-context findings when a superseding inbound has arrived.
**Correction**: orchestrator runs the pre-send probe on the skill's behalf at the dispatch boundary; this skill MUST NOT independently bypass that — if invoked outside the orchestrator (e.g., manual user request), the skill calls `constellation-board` to read inbox cursor before constructing the finding emit payload.

### §6.7 Emitting non-roundtripped JSON to outbox
**Anti-pattern**: constructing the finding body as a string template and appending via shell HEREDOC. Per `memory/feedback_outbox_json_validation.md`, bash HEREDOC injects trailing extra content in this env → bridge `say` fallback → wrapped TEXT_MESSAGE emit → board raw text + agent inbox miss.
**Correction**: build the finding as an in-memory object → `JSON.stringify` → `appendFileSync` to outbox.jsonl with newline → parse-back-check (read the line, `JSON.parse`, structural equality). The orchestrator's emit helper handles this; manual emits use `scripts/eg_outbox_push.cjs`.

---

## §7 Cross-references

### Ultrasafe.md (this module's spec)
- **§2.1.4** — Contradiction CT6 (binary constant-time + key rotation + external endpoint change = permanent auto-apply forbidden category).
- **§3.2** — Finding schema (10-field mandatory subset → 11-field with crypto variant).
- **§4** — Finding output contract canonical form.
- **§8.1** — 5 new A2A intents (`ULTRASAFE_FINDING` row + payload schema).
- **§8.2** — A2A inbound Spotlighting wrapper (untrusted-by-default channel).
- **§14** — Runtime architecture (5 surfaces).
- **§15.4** — This skill's runtime detail row (agent 4 of 8).
- **§16.1** — `ultrasafe_run_fanout` MCP tool (dispatch entry point).
- **§16.2** — `ultrasafe_finding_aggregate` MCP tool (cross-axis dedup + severity rank).
- **§16.3** — `ultrasafe_clean_signal_check` MCP tool (4-condition AND-gate).
- **§17.1** — `ultrasafe-trigger.cjs` PreToolUse hook (publish-equivalent trigger).
- **§18.1** — `ULTRASAFE_FINDING` runtime wire spec.
- **§19** — Advisory (v0.2.x) vs blocking (v0.3+) mode transition.

### Constellation.md (A2A transport)
- **§13.11** — Envelope canonical form (rule 5 attachment-aware).
- **§13.13** — 3-tier ack (this skill awaits `commitment` ack on `ULTRASAFE_FINDING`).
- **§13.14** — Redaction discipline (no env-specific identifiers in tool args).
- **§13.16.6** — Watcher liveness probe + turn-end ritual.
- **§13.16.9** — A2A-intent allowlist (`ULTRASAFE_FINDING` registered).
- **§13.16.10** — Pre-send inbox probe (mandatory before every outbound emit).

### Hyperbrief.md (decision delegation)
- **§1** — 9-section JSON IR (when this skill's findings escalate via paired `HyperbriefCard` at release-gate).
- **§2** — Escalation trigger rubric (4-score + MUST-trigger).
- **§8** — Paired envelope + `parentId` linkage (used when `RELEASE_GATE` verdict = `escalate`).

### Greatpractice.md (workflow extraction)
- **§3.2** — frontmatter source_evidence chain (finding ids feed Greatpractice tree candidate entries).
- **§micro** — `pre-emit-validation` hook (outbox JSON roundtrip — see §6.7).

### Memory feedbacks (operational discipline)
- `memory/feedback_pre_send_inbound_check.md` — §6.6 anti-pattern source.
- `memory/feedback_outbox_json_validation.md` — §6.7 anti-pattern source.
- `memory/feedback_public_repo_redaction.md` — §3.3 evidence forbidden forms + §6.3 anti-pattern source.
- `memory/feedback_release_versioning_cadence.md` — `schema_version` bump discipline.

### External standards (cited in findings)
- **RFC 8996** — TLSv1.0 / TLSv1.1 deprecation.
- **RFC 9325 / BCP 195** — TLS recommendations.
- **NIST SP 800-52r2** — TLS implementation guidance.
- **NIST SP 800-90A r1 / 90B / 90C** — RNG construction + entropy + DRBG.
- **NIST SP 800-107r1** — hash function applications.
- **NIST SP 800-131A r2** — algorithm transitions.
- **FIPS 140-3** — cryptographic module validation.
- **FIPS 203 / 204 / 205** — ML-KEM / ML-DSA / SLH-DSA (PQC).
- **CNSA 2.0** — NSA Commercial National Security Algorithm Suite transition.
- **CWE-208 / 310 / 327 / 330 / 338 / 347** — common crypto weaknesses.
- **CAPEC-463 / 475 / 481** — common attack patterns (timing, signature spoofing).
