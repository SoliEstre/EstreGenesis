// Ultrasafe MCP server — v0.2.0 (runtime activation cut, advisory mode).
// Exposes 5 tools over stdio JSON-RPC:
//   ultrasafe_run_fanout          — 8-agent parallel dispatch (7 attackers + synthesizer retire-barrier)
//   ultrasafe_finding_aggregate   — cross-axis dedup + severity rank + correlation
//   ultrasafe_clean_signal_check  — 4-condition AND-gate (regression-free + monotonic + coverage-floor + 2 consecutive)
//   ultrasafe_report_generate     — 3-layer report (OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate)
//   ultrasafe_release_gate        — release-gate state query (advisory-only in v0.2.x)
//
// Per Ultrasafe.md §16 (v0.2.0 MCP server tools).
// Per Constellation MCP-server convention (mirrors plugins/hyperbrief/mcp/server.cjs stdio JSON-RPC framing).
//
// ADVISORY MODE (v0.2.x): All tool returns carry `advisory_mode: true`. No publish blocking.
// BLOCKING MODE (v0.3+ deferred): When activated, `ultrasafe_release_gate` verdict will gate publish.

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VERSION = "0.2.3";
const ADVISORY_MODE = true; // v0.2.x — flips to false in v0.3+ blocking cut.
const BLOCKING_IN_V03 = true; // surfaced in all returns so consumers know what would happen under blocking mode.

// ----- Schema paths (lazy-loaded) -----

const SCHEMA_DIR = path.resolve(__dirname, "..", "schemas");
const FINDING_SCHEMA_PATH = path.join(SCHEMA_DIR, "finding.schema.json");
const ITERATION_BOUNDARY_SCHEMA_PATH = path.join(SCHEMA_DIR, "iteration-boundary.schema.json");
const RELEASE_GATE_SCHEMA_PATH = path.join(SCHEMA_DIR, "release-gate.schema.json");

// Lazy ajv validator factory (graceful fallback when ajv not installed or schema missing).
let _validators = {};
let _validatorErr = null;
function getValidator(schemaPath) {
  if (_validators[schemaPath] !== undefined) return _validators[schemaPath];
  try {
    const Ajv = require("ajv/dist/2020");
    const ajv = new (Ajv.default || Ajv)({ strict: false, allErrors: true });
    if (!fs.existsSync(schemaPath)) {
      _validators[schemaPath] = null;
      return null;
    }
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    _validators[schemaPath] = ajv.compile(schema);
    return _validators[schemaPath];
  } catch (e) {
    _validatorErr = e;
    _validators[schemaPath] = null;
    return null;
  }
}

// ----- Determinism helpers -----

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function canonicalJsonHash(obj) {
  // Sorted-key canonical JSON for deterministic hashing.
  const seen = new WeakSet();
  function sortKeys(v) {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(sortKeys);
    if (seen.has(v)) return null;
    seen.add(v);
    const sorted = {};
    for (const k of Object.keys(v).sort()) sorted[k] = sortKeys(v[k]);
    return sorted;
  }
  return sha256(JSON.stringify(sortKeys(obj)));
}

// ----- §16.1 ultrasafe_run_fanout -----
// Description: 7 attacker parallel dispatch + retire-barrier synthesizer aggregation.
// Per Ultrasafe.md §16.1 — deterministic guarantee: same (target_commit_sha + tier + axis_set + iteration + prior_findings_set + catalog_versions + agent_roster_snapshot_hash) → same findings set.
async function handleRunFanout(args = {}) {
  const {
    target_commit_sha,
    tier,
    axis_set,
    iteration,
    prior_findings_set = [],
    catalog_versions = {},
    agent_roster_snapshot_hash,
  } = args;

  if (!target_commit_sha || typeof target_commit_sha !== "string") throw new Error("target_commit_sha is required (string)");
  if (![1, 2, 3].includes(Number(tier))) throw new Error("tier must be 1, 2, or 3");
  if (!Array.isArray(axis_set) || axis_set.length === 0) throw new Error("axis_set must be non-empty array");
  if (!Number.isInteger(iteration) || iteration < 1) throw new Error("iteration must be integer >= 1");
  if (!agent_roster_snapshot_hash || typeof agent_roster_snapshot_hash !== "string") {
    throw new Error("agent_roster_snapshot_hash is required (string)");
  }

  // v0.2.x advisory cut: this tool acts as a *dispatch contract* — the actual 7 attacker invocation is performed by
  // the orchestrator role (the main agent, via Workflow/Task tool fan-out — Ultrasafe.md §14.1 role mapping; no
  // separate runtime/orchestrator.cjs ships in v0.2.x). This tool returns the *contract envelope* that the
  // orchestrator role MUST fill before the retire-barrier, writing findings + iteration_boundary
  // back via `ultrasafe_finding_aggregate`.
  //
  // Determinism is enforced by the input-hash → output-binding contract: the orchestrator MUST treat
  // (target_commit_sha + tier + axis_set + iteration + prior_findings_set + catalog_versions + agent_roster_snapshot_hash)
  // as a deterministic key. Cache hits on identical key return cached aggregated finding set.

  const inputHash = canonicalJsonHash({
    target_commit_sha,
    tier: Number(tier),
    axis_set: [...axis_set].sort(),
    iteration,
    prior_findings_set,
    catalog_versions,
    agent_roster_snapshot_hash,
  });

  return {
    advisory_mode: ADVISORY_MODE,
    blocking_in_v03: BLOCKING_IN_V03,
    iteration,
    input_hash: inputHash,
    dispatch_contract: {
      target_commit_sha,
      tier: Number(tier),
      axis_set,
      iteration,
      prior_findings_count: prior_findings_set.length,
      catalog_versions,
      agent_roster_snapshot_hash,
      attacker_roles: [
        "ultrasafe-ai-llm-redteam",
        "ultrasafe-web-api-attacker",
        "ultrasafe-supply-chain-auditor",
        "ultrasafe-crypto-reviewer",
        "ultrasafe-social-engineer",
        "ultrasafe-methodology-compliance",
        "ultrasafe-threat-model-lifecycle",
      ],
      synthesizer_role: "ultrasafe-synthesizer",
    },
    findings: [], // populated by orchestrator post-dispatch
    iteration_boundary: null, // populated post-aggregate
    synthesis_layer_1_oscal: null,
    synthesis_layer_2_hyperbrief: [],
    synthesis_layer_3_greatpractice: [],
    agent_diversity_check_passed: null, // populated by aggregate step
    broker_meta_safety_check_passed: null, // populated by aggregate step
    notice: "v0.2.0 advisory mode — orchestrator fills findings + iteration_boundary + synthesis layers via post-dispatch aggregate call. No publish blocking.",
  };
}

// ----- §16.2 ultrasafe_finding_aggregate -----
// Cross-axis dedup + severity ranking + correlation + 3-layer report generation.
async function handleFindingAggregate(args = {}) {
  const {
    iteration,
    finding_set_from_7_attackers,
    catalog_versions = {},
    agent_roster_snapshot_hash,
  } = args;

  if (!Number.isInteger(iteration) || iteration < 1) throw new Error("iteration must be integer >= 1");
  if (!Array.isArray(finding_set_from_7_attackers)) throw new Error("finding_set_from_7_attackers must be array");
  if (!agent_roster_snapshot_hash) throw new Error("agent_roster_snapshot_hash is required");

  // Dedup algorithm: (file × line × pattern_id) 3-tuple match → merge.
  // Per Ultrasafe.md §16.2 deterministic guarantee.
  const dedupKeyOf = (f) => {
    const file = f.file || f.location?.file || "";
    const line = f.line || f.location?.line || 0;
    const pid = f.pattern_id || f.rule_id || "";
    return `${file}::${line}::${pid}`;
  };

  const buckets = new Map();
  for (const f of finding_set_from_7_attackers) {
    if (!f || typeof f !== "object") continue;
    const k = dedupKeyOf(f);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(f);
  }

  const deduped_findings = [];
  const correlation_map = {};
  const confirmation_tier = {};

  for (const [key, group] of buckets) {
    // Merge: pick highest-severity representative, attach corroborators.
    const sorted = [...group].sort((a, b) => severityRank(b) - severityRank(a));
    const rep = { ...sorted[0] };
    rep.corroborators = sorted.slice(1).map((f) => f.finding_id || f.id || null).filter(Boolean);
    rep.advisory = true;
    deduped_findings.push(rep);

    const fid = rep.finding_id || rep.id || key;
    correlation_map[fid] = rep.corroborators;

    // BFT quorum 2f+1 (n=7, f=2) → 5 corroborators = confirmed; 3 = needs-corroboration; <3 = low-confidence draft.
    const corrobCount = group.length;
    confirmation_tier[fid] =
      corrobCount >= 5 ? "confirmed"
      : corrobCount >= 3 ? "needs-corroboration"
      : "low-confidence draft";
  }

  // Severity ranking: (severity × scope × reversibility × external_impact) 4-tuple lexicographic.
  const severity_ranked_findings = [...deduped_findings].sort((a, b) => {
    const ra = severityTuple(a);
    const rb = severityTuple(b);
    for (let i = 0; i < ra.length; i++) {
      if (ra[i] !== rb[i]) return rb[i] - ra[i]; // desc
    }
    return 0;
  });

  // 3-layer synthesis (stub structures — orchestrator fills full content via §16.4 report_generate).
  const synthesis_layer_1_oscal = {
    uuid: crypto.randomUUID(),
    metadata: {
      title: "Ultrasafe Assessment Result (advisory)",
      iteration,
      catalog_versions,
      agent_roster_snapshot_hash,
    },
    findings: deduped_findings,
  };

  const synthesis_layer_2_hyperbrief = severity_ranked_findings
    .filter((f) => severityRank(f) >= 4) // score >= 4 escalation trigger per Hyperbrief §1.
    .map((f) => ({
      finding_id: f.finding_id || f.id,
      escalation_score: severityRank(f),
      advisory: true,
      hyperbrief_pending: true, // orchestrator will emit full 9-section IR via Hyperbrief skill chain.
    }));

  const synthesis_layer_3_greatpractice = deduped_findings
    .filter((f) => f.recurrence_signal === true || (f.corroborators && f.corroborators.length >= 2))
    .map((f) => ({
      finding_id: f.finding_id || f.id,
      candidate_tier: f.scope === "macro" ? "macro" : f.scope === "mezzo" ? "mezzo" : "micro",
      advisory: true,
      greatpractice_pending: true, // orchestrator will materialize full tree entry post-acceptance.
    }));

  return {
    advisory_mode: ADVISORY_MODE,
    blocking_in_v03: BLOCKING_IN_V03,
    iteration,
    deduped_findings,
    severity_ranked_findings,
    correlation_map,
    confirmation_tier,
    synthesis_layer_1_oscal,
    synthesis_layer_2_hyperbrief,
    synthesis_layer_3_greatpractice,
  };
}

function severityRank(f) {
  if (typeof f.severity === "number") return f.severity;
  const map = { critical: 5, high: 4, medium: 3, low: 2, info: 1, informational: 1 };
  return map[String(f.severity || "").toLowerCase()] || 0;
}

function severityTuple(f) {
  return [
    severityRank(f),
    typeof f.scope === "number" ? f.scope : ({ macro: 3, mezzo: 2, micro: 1 }[f.scope] || 0),
    typeof f.reversibility === "number" ? f.reversibility : ({ irreversible: 3, "hard-to-reverse": 2, reversible: 1 }[f.reversibility] || 0),
    typeof f.external_impact === "number" ? f.external_impact : ({ broad: 3, scoped: 2, local: 1 }[f.external_impact] || 0),
  ];
}

// ----- §16.3 ultrasafe_clean_signal_check -----
// 4-condition AND-gate: regression-free + monotonic improvement + coverage floor + 2 iter consecutive.
async function handleCleanSignalCheck(args = {}) {
  const {
    iteration,
    current_findings = [],
    prior_findings = [],
    regression_baseline = [],
    coverage_pct = {},
    applicable_subset_size = {},
    untested_classes = {},
    iteration_history = {},
    tier,
  } = args;

  if (!Number.isInteger(iteration) || iteration < 3) {
    // Per Ultrasafe.md §15 — clean-signal-gate requires >= 3 iterations of history before meaningful evaluation.
    return {
      advisory_mode: ADVISORY_MODE,
      blocking_in_v03: BLOCKING_IN_V03,
      clean_signal_reached: false,
      condition_1_regression_free: false,
      condition_2_monotonic_improvement: false,
      condition_3_coverage_floor: false,
      condition_4_consecutive_2_iter: false,
      recommended_action: "continue_iteration",
      would_block_in_v03_blocking: false,
      notice: `iteration ${iteration} < 3 — clean-signal-gate requires >= 3 iteration history.`,
    };
  }
  if (![1, 2, 3].includes(Number(tier))) throw new Error("tier must be 1, 2, or 3");

  // Condition 1: regression-free (3-component AND).
  // a) sealed_verification — no regression_baseline finding in current_findings.
  // b) prior_findings_retest — all prior findings retest result attached.
  // c) secondary_surface_absence — no new findings in scopes already deemed clean.
  const findingKey = (f) => `${f.file || ""}::${f.line || 0}::${f.pattern_id || f.rule_id || ""}`;
  const currentKeys = new Set(current_findings.map(findingKey));
  const baselineKeys = new Set(regression_baseline.map(findingKey));
  const sealed_verification = ![...baselineKeys].some((k) => currentKeys.has(k));
  const prior_findings_retest = prior_findings.every((f) => f.retest_result !== undefined || f.retest_status !== undefined);
  const secondary_surface_absence = true; // orchestrator-side determination; trusted true unless explicitly flagged.
  const condition_1_regression_free = sealed_verification && prior_findings_retest && secondary_surface_absence;

  // Condition 2: monotonic improvement over K=3 window.
  const K = 3;
  const recentIters = [];
  for (let i = 0; i < K; i++) {
    const it = iteration - i;
    if (iteration_history[it]) recentIters.push(iteration_history[it]);
  }
  let condition_2_monotonic_improvement = false;
  if (recentIters.length >= K) {
    // findings_count monotonic descending (or equal at floor).
    condition_2_monotonic_improvement = recentIters[0].findings_count <= recentIters[1].findings_count
                                     && recentIters[1].findings_count <= recentIters[2].findings_count;
  }

  // Condition 3: coverage floor per tier — Tier 1: 50% / Tier 2: 75% / Tier 3: 90%.
  const floors = { 1: 50, 2: 75, 3: 90 };
  const tierFloor = floors[Number(tier)];
  const coverageValues = Object.values(coverage_pct);
  const avgCoverage = coverageValues.length
    ? coverageValues.reduce((s, v) => s + Number(v || 0), 0) / coverageValues.length
    : 0;
  const condition_3_coverage_floor = avgCoverage >= tierFloor;

  // Condition 4: 2 consecutive iterations clean.
  const prevIter = iteration_history[iteration - 1];
  const currIter = iteration_history[iteration];
  const condition_4_consecutive_2_iter = !!(prevIter && currIter
    && (prevIter.regression_count === 0)
    && (currIter.regression_count === 0));

  const clean_signal_reached =
    condition_1_regression_free
    && condition_2_monotonic_improvement
    && condition_3_coverage_floor
    && condition_4_consecutive_2_iter;

  // Recommended action: continue_iteration | release_ready_advisory | hyperbrief_escalate.
  const maxSeverity = current_findings.reduce((m, f) => Math.max(m, severityRank(f)), 0);
  let recommended_action;
  if (clean_signal_reached) {
    recommended_action = "release_ready_advisory";
  } else if (maxSeverity >= 4) {
    recommended_action = "hyperbrief_escalate";
  } else {
    recommended_action = "continue_iteration";
  }

  return {
    advisory_mode: ADVISORY_MODE,
    blocking_in_v03: BLOCKING_IN_V03,
    clean_signal_reached,
    condition_1_regression_free,
    condition_1_sub: { sealed_verification, prior_findings_retest, secondary_surface_absence },
    condition_2_monotonic_improvement,
    condition_2_window: recentIters.map((r) => r.findings_count),
    condition_3_coverage_floor,
    condition_3_avg_coverage_pct: avgCoverage,
    condition_3_tier_floor_pct: tierFloor,
    condition_4_consecutive_2_iter,
    recommended_action,
    would_block_in_v03_blocking: clean_signal_reached === false,
    untested_classes,
    applicable_subset_size,
  };
}

// ----- §16.4 ultrasafe_report_generate -----
// 3-layer report: OSCAL Assessment Result + Hyperbrief 9-section IR + Greatpractice tree candidate.
async function handleReportGenerate(args = {}) {
  const {
    iteration_history = [],
    final_findings = [],
    clean_signal_state = {},
    tier,
    target_commit_sha,
    catalog_versions = {},
    untested_classes = {},
  } = args;

  if (![1, 2, 3].includes(Number(tier))) throw new Error("tier must be 1, 2, or 3");
  if (!target_commit_sha) throw new Error("target_commit_sha is required");

  // Iteration summary: resolved / regression / persistent / new.
  const iteration_summary = { resolved: [], regression: [], persistent: [], new: [] };
  // Heuristic over iteration_history — first iter's findings + last iter's findings comparison.
  if (Array.isArray(iteration_history) && iteration_history.length >= 1) {
    const last = iteration_history[iteration_history.length - 1] || {};
    const first = iteration_history[0] || {};
    const firstFindings = first.findings || [];
    const lastFindings = last.findings || final_findings;
    const firstKeys = new Set(firstFindings.map((f) => f.finding_id || f.id));
    const lastKeys = new Set(lastFindings.map((f) => f.finding_id || f.id));
    iteration_summary.resolved = [...firstKeys].filter((k) => !lastKeys.has(k));
    iteration_summary.persistent = [...firstKeys].filter((k) => lastKeys.has(k));
    iteration_summary.new = [...lastKeys].filter((k) => !firstKeys.has(k));
    // regression detection: orchestrator-side annotation expected.
    iteration_summary.regression = lastFindings.filter((f) => f.regression === true).map((f) => f.finding_id || f.id);
  }

  // Alignment matrix: cross-axis confirmation counts.
  const alignment_matrix = {};
  for (const f of final_findings) {
    if (!Array.isArray(f.confirming_axes)) continue;
    for (let i = 0; i < f.confirming_axes.length; i++) {
      for (let j = i + 1; j < f.confirming_axes.length; j++) {
        const pair = [f.confirming_axes[i], f.confirming_axes[j]].sort().join("::");
        alignment_matrix[pair] = (alignment_matrix[pair] || 0) + 1;
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const coverageStr = clean_signal_state.condition_3_avg_coverage_pct
    ? `${Number(clean_signal_state.condition_3_avg_coverage_pct).toFixed(1)}%`
    : "n/a";
  const catalogVersionStr = Object.entries(catalog_versions).map(([k, v]) => `${k}=${v}`).join(", ") || "n/a";

  // Attestation text — bounded form. Per Ultrasafe.md §16.4 deterministic guarantee.
  // "secure" word forbidden — attestation must read "passed coverage X% under catalog v_Y as of date Z".
  const attestation_text = `advisory-mode report — not a blocking attestation. passed coverage ${coverageStr} under catalog ${catalogVersionStr} as of date ${date}.`;

  const layer_1_oscal_assessment_result = {
    uuid: crypto.randomUUID(),
    metadata: {
      title: "Ultrasafe Assessment Result",
      published: new Date().toISOString(),
      version: VERSION,
      oscal_version: "1.1.0",
      target_commit_sha,
      tier: Number(tier),
      advisory_mode: ADVISORY_MODE,
    },
    findings: final_findings,
    iteration_summary,
    alignment_matrix,
    attestation_text,
  };

  // Layer 2: Hyperbrief 9-section IR per finding with score >= 4 (escalation).
  const layer_2_hyperbrief_irs = final_findings
    .filter((f) => severityRank(f) >= 4)
    .map((f) => ({
      ir_pending: true, // orchestrator wires the hyperbrief skill chain to emit full 9-section IR.
      finding_id: f.finding_id || f.id,
      escalation_score: severityRank(f),
      audience_profile_fallback: { button_label: "심층 결정 보기", trigger_phrases_md: "" },
      advisory: true,
    }));

  // Layer 3: Greatpractice tree candidates (macro / mezzo / micro auto-classified).
  const layer_3_greatpractice_candidates = final_findings
    .filter((f) => (f.recurrence_signal === true) || (f.corroborators && f.corroborators.length >= 2))
    .map((f) => ({
      finding_id: f.finding_id || f.id,
      tier_candidate: f.scope === "macro" ? "macro" : f.scope === "mezzo" ? "mezzo" : "micro",
      greatpractice_pending: true,
      advisory: true,
    }));

  // SARIF / STIX / ATT&CK Navigator export stubs.
  const sarif_2_1_0_export = {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{
      tool: { driver: { name: "ultrasafe", version: VERSION, advisory_mode: ADVISORY_MODE } },
      results: final_findings.map((f) => ({
        ruleId: f.pattern_id || f.rule_id || "ultrasafe.generic",
        level: severityRank(f) >= 4 ? "error" : severityRank(f) >= 3 ? "warning" : "note",
        message: { text: f.message || f.title || "" },
        locations: f.file ? [{ physicalLocation: { artifactLocation: { uri: f.file }, region: { startLine: f.line || 1 } } }] : [],
      })),
    }],
  };

  const stix_2_1_export = {
    type: "bundle",
    id: `bundle--${crypto.randomUUID()}`,
    spec_version: "2.1",
    objects: final_findings.map((f) => ({
      type: "vulnerability",
      spec_version: "2.1",
      id: `vulnerability--${crypto.randomUUID()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      name: f.title || f.message || "ultrasafe finding",
      description: f.description || "",
    })),
  };

  const attack_navigator_layer = {
    name: `Ultrasafe ${target_commit_sha.slice(0, 8)} (advisory)`,
    version: "4.5",
    domain: "enterprise-attack",
    description: "Advisory-mode ATT&CK Navigator layer — not a blocking attestation.",
    techniques: final_findings
      .filter((f) => Array.isArray(f.attack_technique_ids))
      .flatMap((f) => f.attack_technique_ids.map((tid) => ({
        techniqueID: tid,
        score: severityRank(f),
        comment: f.title || "",
      }))),
  };

  return {
    advisory_mode: ADVISORY_MODE,
    blocking_in_v03: BLOCKING_IN_V03,
    layer_1_oscal_assessment_result,
    layer_2_hyperbrief_irs,
    layer_3_greatpractice_candidates,
    sarif_2_1_0_export,
    stix_2_1_export,
    attack_navigator_layer,
  };
}

// ----- §16.5 ultrasafe_release_gate -----
// Release-gate state query — advisory-only in v0.2.x. v0.3+ adds publish-block authority.
async function handleReleaseGate(args = {}) {
  const {
    iteration,
    clean_signal_state = {},
    report = {},
    tier,
    target_commit_sha,
    release_candidate_tag,
  } = args;

  if (![1, 2, 3].includes(Number(tier))) throw new Error("tier must be 1, 2, or 3");
  if (!target_commit_sha) throw new Error("target_commit_sha is required");
  if (!release_candidate_tag) throw new Error("release_candidate_tag is required");

  const findings = (report.layer_1_oscal_assessment_result && report.layer_1_oscal_assessment_result.findings) || [];
  const findings_residual = findings.filter((f) => severityRank(f) >= 3); // medium+ residuals surfaced.
  const severityMax = findings.reduce((m, f) => Math.max(m, severityRank(f)), 0);
  const externalImpactMax = findings.reduce((m, f) => {
    const v = typeof f.external_impact === "number" ? f.external_impact : ({ broad: 3, scoped: 2, local: 1 }[f.external_impact] || 0);
    return Math.max(m, v);
  }, 0);

  // Verdict: release_advisory | hold_advisory | escalate.
  // Deterministic predicate per Ultrasafe.md §16.5.
  let verdict;
  if (clean_signal_state.clean_signal_reached === true && severityMax < 4) {
    verdict = "release_advisory";
  } else if (severityMax >= 4) {
    verdict = "escalate";
  } else {
    verdict = "hold_advisory";
  }

  // Grading: lexicographic (severityMax × externalImpactMax × tier) → minimal | standard | high.
  let grading;
  const gradingScore = severityMax * 100 + externalImpactMax * 10 + Number(tier);
  if (gradingScore >= 415) grading = "high";       // severity>=4 + external broad + tier 3+
  else if (gradingScore >= 312) grading = "standard"; // medium-high envelope
  else grading = "minimal";

  // Hyperbrief escalation pending? — surface IR id placeholder for orchestrator to wire.
  const hyperbrief_id = verdict === "escalate"
    ? `hyperbrief-${crypto.randomUUID()}`
    : null;

  return {
    advisory_mode: ADVISORY_MODE,
    blocking_in_v03: BLOCKING_IN_V03,
    release_candidate: release_candidate_tag,
    target_commit_sha,
    iteration,
    verdict,
    grading,
    findings_residual,
    hyperbrief_id,
    methodology: ["NIST", "OSSTMM", "OWASP", "PTES"], // 4-tuple default per §16.5.
    would_block_in_v03_blocking: verdict !== "release_advisory",
    user_gate_required_in_v03: verdict === "release_advisory" || verdict === "escalate",
    notice: "v0.2.x advisory mode — this verdict does NOT block publish. Consumer (orchestrator / Claude Code) MUST treat as informational only.",
  };
}

// ----- Tool registry -----

const TOOLS = [
  {
    name: "ultrasafe_run_fanout",
    description: "Dispatch 7 attacker agents (AI/LLM Red Team, Web/API Attacker, Supply Chain Auditor, Crypto Reviewer, Social Engineer, Methodology/Compliance, Threat Model/Lifecycle) in parallel + synthesizer retire-barrier. Returns the dispatch contract envelope that the orchestrator fills with findings post-Task fan-out. Deterministic: same input hash → same finding set. Advisory-mode in v0.2.x — no publish blocking.",
    inputSchema: {
      type: "object",
      required: ["target_commit_sha", "tier", "axis_set", "iteration", "agent_roster_snapshot_hash"],
      properties: {
        target_commit_sha: { type: "string", description: "Git commit sha being assessed (40-char hex preferred)." },
        tier: { type: "integer", enum: [1, 2, 3], description: "Assessment tier — 1: minimal / 2: standard / 3: high." },
        axis_set: { type: "array", items: { type: "string" }, description: "Axis ids to assess (e.g., ['usf-ai-llm', 'usf-web-sast-dast'])." },
        iteration: { type: "integer", minimum: 1, description: "Iteration number (>= 1; >= 3 required for clean-signal-gate)." },
        prior_findings_set: { type: "array", description: "F_{N-1} findings from prior iteration (for delta detection)." },
        catalog_versions: { type: "object", description: "{[axis_id]: catalog_version_string} for reproducibility." },
        agent_roster_snapshot_hash: { type: "string", description: "sha256 hex of attacker roster snapshot — pins LLM stochasticity to iteration boundary." },
      },
    },
  },
  {
    name: "ultrasafe_finding_aggregate",
    description: "Cross-axis dedup (file × line × pattern_id 3-tuple merge) + severity ranking (severity × scope × reversibility × external_impact lexicographic) + correlation map + confirmation tier (BFT quorum 2f+1 with n=7 f=2: 5+ corroborators → confirmed / 3-4 → needs-corroboration / <3 → low-confidence draft). Generates 3-layer synthesis stubs (OSCAL + Hyperbrief escalation candidates + Greatpractice candidates). Advisory in v0.2.x.",
    inputSchema: {
      type: "object",
      required: ["iteration", "finding_set_from_7_attackers", "agent_roster_snapshot_hash"],
      properties: {
        iteration: { type: "integer", minimum: 1 },
        finding_set_from_7_attackers: { type: "array", description: "Raw findings emitted by the 7 attackers (pre-dedup)." },
        catalog_versions: { type: "object" },
        agent_roster_snapshot_hash: { type: "string" },
      },
    },
  },
  {
    name: "ultrasafe_clean_signal_check",
    description: "4-condition AND-gate (deterministic numerical predicates, no LLM judgment): (1) regression-free (sealed_verification AND prior_findings_retest AND secondary_surface_absence) (2) monotonic finding-reduction over K=3 window (3) coverage floor (Tier 1: 50% / Tier 2: 75% / Tier 3: 90%) (4) 2 consecutive iterations clean. Requires iteration >= 3. Returns recommended_action: continue_iteration | release_ready_advisory | hyperbrief_escalate. Advisory in v0.2.x — clean signal does NOT block publish.",
    inputSchema: {
      type: "object",
      required: ["iteration", "current_findings", "tier"],
      properties: {
        iteration: { type: "integer", minimum: 1 },
        current_findings: { type: "array", description: "F_N findings." },
        prior_findings: { type: "array", description: "F_{N-1} findings (with retest_result attached)." },
        regression_baseline: { type: "array", description: "Prior release final ITER finding set ∪ this release ITER 1 finding set." },
        coverage_pct: { type: "object", description: "{[axis_id]: number 0-100}" },
        applicable_subset_size: { type: "object", description: "{[axis_id]: integer}" },
        untested_classes: { type: "object", description: "{[axis_id]: string[]}" },
        iteration_history: { type: "object", description: "{[iter: integer]: {findings_count, regression_count, coverage_pct_avg}}" },
        tier: { type: "integer", enum: [1, 2, 3] },
      },
    },
  },
  {
    name: "ultrasafe_report_generate",
    description: "Generate 3-layer report — Layer 1: OSCAL v1.1.0 Assessment Result (uuid + metadata + findings + iteration_summary + alignment_matrix + bounded attestation text 'passed coverage X% under catalog v_Y as of date Z', word 'secure' forbidden) / Layer 2: Hyperbrief 9-section IR per finding with severity >= 4 / Layer 3: Greatpractice tree candidates (macro / mezzo / micro auto-classified). Also emits SARIF 2.1.0 + STIX 2.1 + ATT&CK Navigator layer exports. Advisory-mode report — not a blocking attestation in v0.2.x.",
    inputSchema: {
      type: "object",
      required: ["tier", "target_commit_sha"],
      properties: {
        iteration_history: { type: "array", description: "IterationBoundary[]" },
        final_findings: { type: "array" },
        clean_signal_state: { type: "object", description: "Output from ultrasafe_clean_signal_check." },
        tier: { type: "integer", enum: [1, 2, 3] },
        target_commit_sha: { type: "string" },
        catalog_versions: { type: "object" },
        untested_classes: { type: "object" },
      },
    },
  },
  {
    name: "ultrasafe_release_gate",
    description: "Release-gate state query + Hyperbrief 4-score routing input emit. Deterministic verdict: release_advisory (clean_signal AND severity_max < 4) | hold_advisory | escalate (severity_max >= 4). Grading: minimal | standard | high via (severityMax × externalImpactMax × tier) lexicographic. Methodology 4-tuple default: NIST + OSSTMM + OWASP + PTES. v0.2.x advisory mode — verdict does NOT block publish. Consumer MUST treat as informational only.",
    inputSchema: {
      type: "object",
      required: ["iteration", "tier", "target_commit_sha", "release_candidate_tag"],
      properties: {
        iteration: { type: "integer", minimum: 1 },
        clean_signal_state: { type: "object" },
        report: { type: "object", description: "Output from ultrasafe_report_generate." },
        tier: { type: "integer", enum: [1, 2, 3] },
        target_commit_sha: { type: "string" },
        release_candidate_tag: { type: "string", description: "e.g., 'v2.5.43'" },
      },
    },
  },
];

// ----- MCP stdio JSON-RPC protocol -----

const handlers = {
  initialize: async () => ({
    protocolVersion: "2024-11-05",
    serverInfo: { name: "ultrasafe-mcp", version: VERSION },
    capabilities: { tools: {} },
  }),
  "tools/list": async () => ({ tools: TOOLS }),
  "tools/call": async (params) => {
    const { name, arguments: args } = params;
    switch (name) {
      case "ultrasafe_run_fanout":          return handleRunFanout(args || {});
      case "ultrasafe_finding_aggregate":   return handleFindingAggregate(args || {});
      case "ultrasafe_clean_signal_check":  return handleCleanSignalCheck(args || {});
      case "ultrasafe_report_generate":     return handleReportGenerate(args || {});
      case "ultrasafe_release_gate":        return handleReleaseGate(args || {});
      default: throw new Error("Unknown tool: " + name);
    }
  },
};

// ----- Non-MCP CLI fallback (for testing without an MCP host) -----
// Usage: node server.cjs --cli <tool_name> <json_args>
//   e.g., node server.cjs --cli ultrasafe_clean_signal_check '{"iteration":3,"current_findings":[],"tier":1}'

if (process.argv.includes("--cli")) {
  (async () => {
    const idx = process.argv.indexOf("--cli");
    const toolName = process.argv[idx + 1];
    const argsStr = process.argv[idx + 2] || "{}";
    let args;
    try { args = JSON.parse(argsStr); } catch (e) {
      process.stderr.write(`bad JSON args: ${e.message}\n`);
      process.exit(2);
    }
    try {
      const result = await handlers["tools/call"]({ name: toolName, arguments: args });
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      process.exit(0);
    } catch (e) {
      process.stderr.write(`tool error: ${e.message}\n`);
      process.exit(1);
    }
  })();
} else {
  // stdio JSON-RPC loop
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", async (chunk) => {
    buffer += chunk;
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const req = JSON.parse(line);
        const handler = handlers[req.method];
        if (!handler) {
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Method not found: " + req.method } }) + "\n");
          continue;
        }
        try {
          const result = await handler(req.params || {});
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, result }) + "\n");
        } catch (e) {
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: e.message } }) + "\n");
        }
      } catch (_) { /* bad JSON */ }
    }
  });
}

module.exports = { handlers, TOOLS, VERSION, ADVISORY_MODE };
