#!/usr/bin/env node
// ultrasafe Stop hook — v0.2.0 (advisory mode).
//
// Fires at turn-end (cycle-end). Reads `.ultrasafe/state.json` and evaluates
// the 4-condition AND-gate clean-signal:
//
//   1) regression_free
//      — current iteration introduced 0 new findings ≥ severity threshold
//        compared to the prior iteration's resolved set.
//   2) monotonic_finding_reduction
//      — total open findings strictly non-increasing across the last N iters.
//   3) coverage_floor
//      — fan-out coverage (attackers run / attackers configured) ≥ floor.
//   4) consecutive_clean_iterations ≥ 2
//      — the prior two iteration boundaries both reported clean.
//
// Outputs:
//   - Updates `.ultrasafe/state.json` clean_signal block with the evaluated
//     per-condition booleans + AND-gate result + timestamp.
//   - If a pre-publish detection event is still in "pre-publish-detected"
//     stage from a recent PreToolUse fire, advance it to "post-cycle-evaluated"
//     and record the clean-signal result alongside.
//   - Emits a ULTRASAFE_ITERATION_BOUNDARY envelope to Constellation outbox
//     (if available) ONLY when an actual iteration boundary was crossed this
//     cycle (orchestrator marks state.pending_iteration_boundary = true).
//   - Prints a single advisory stderr summary line (or stays silent when
//     there's nothing to evaluate — no iterations yet + no pending gate events).
//
// v0.2 advisory mode invariant: NEVER blocks (always exits 0). Blocking mode
// (v0.3+) will gate publish on the AND-gate result.
//
// Per Ultrasafe.md v0.2.0 §14 (runtime topology) + §17 (hooks spec) +
// §18 (Constellation §13.16 5-intent integration) + §19 (advisory→blocking
// transition conditions). Mirrors hyperbrief Stop hook structural pattern.

"use strict";

const fs = require("fs");
const path = require("path");

// ─── Repo root + state dir ───────────────────────────────────────────────────

function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 16; i++) {
    if (
      fs.existsSync(path.join(dir, ".git")) ||
      fs.existsSync(path.join(dir, ".ultrasafe"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

// v0.2.4 — same stable-root anchoring as the PreToolUse trigger: a hook must not
// let the tool call's cwd decide which `.ultrasafe/` it reads/writes, or the Stop
// hook evaluates a different state file than the one the trigger appended to.
const REPO_ROOT =
  process.env.CLAUDE_PROJECT_DIR ||
  process.env.ULTRASAFE_REPO_ROOT ||
  findRepoRoot(process.cwd());
const STATE_DIR = process.env.ULTRASAFE_STATE_DIR || path.join(REPO_ROOT, ".ultrasafe");
const STATE_PATH = path.join(STATE_DIR, "state.json");

// ─── Floors / thresholds (overridable via env) ───────────────────────────────

const COVERAGE_FLOOR = parseFloat(process.env.ULTRASAFE_COVERAGE_FLOOR || "0.85"); // 85%
const MONOTONIC_WINDOW = parseInt(process.env.ULTRASAFE_MONOTONIC_WINDOW || "3", 10);
const CONSECUTIVE_CLEAN_MIN = parseInt(process.env.ULTRASAFE_CONSECUTIVE_CLEAN_MIN || "2", 10);

// ─── State read/write ────────────────────────────────────────────────────────

function readState() {
  if (!fs.existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch (_) {
    return null;
  }
}

function writeState(state) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    const tmp = STATE_PATH + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tmp, STATE_PATH);
    return true;
  } catch (e) {
    process.stderr.write(`[ultrasafe] state write 실패 (${e.message}); advisory 계속.\n`);
    return false;
  }
}

// ─── 4-condition AND-gate evaluation ─────────────────────────────────────────

function evaluateCleanSignal(state) {
  const iters = Array.isArray(state.iterations) ? state.iterations : [];
  if (iters.length === 0) {
    return {
      achieved: false,
      conditions: {
        regression_free: null,
        monotonic_finding_reduction: null,
        coverage_floor: null,
        consecutive_clean_iterations: 0
      },
      reason: "no iterations run yet"
    };
  }

  const latest = iters[iters.length - 1] || {};
  const prior = iters[iters.length - 2] || null;

  // Condition 1: regression_free
  //   latest.new_findings_above_threshold === 0 (orchestrator-supplied)
  const newAboveThresh = (latest.new_findings_above_threshold == null)
    ? null
    : Number(latest.new_findings_above_threshold);
  const regressionFree = newAboveThresh == null ? null : (newAboveThresh === 0);

  // Condition 2: monotonic_finding_reduction over last MONOTONIC_WINDOW
  let monotonic = null;
  if (iters.length >= 2) {
    const window = iters.slice(-MONOTONIC_WINDOW);
    let ok = true;
    for (let i = 1; i < window.length; i++) {
      const prev = window[i - 1].open_findings;
      const cur = window[i].open_findings;
      if (typeof prev !== "number" || typeof cur !== "number") { ok = null; break; }
      if (cur > prev) { ok = false; break; }
    }
    monotonic = ok;
  }

  // Condition 3: coverage_floor
  //   latest.coverage = attackers_run / attackers_configured ∈ [0, 1]
  const coverage = (latest.coverage == null) ? null : Number(latest.coverage);
  const coverageOk = coverage == null ? null : (coverage >= COVERAGE_FLOOR);

  // Condition 4: consecutive_clean_iterations
  //   count contiguous trailing iterations where iter.clean === true.
  let consecutiveClean = 0;
  for (let i = iters.length - 1; i >= 0; i--) {
    if (iters[i] && iters[i].clean === true) consecutiveClean += 1;
    else break;
  }
  const consecutiveOk = consecutiveClean >= CONSECUTIVE_CLEAN_MIN;

  // AND-gate (treat null as not-yet-evaluable → not achieved).
  const achieved =
    regressionFree === true &&
    monotonic === true &&
    coverageOk === true &&
    consecutiveOk === true;

  const failed = [];
  if (regressionFree !== true) failed.push("regression_free");
  if (monotonic !== true)      failed.push("monotonic_finding_reduction");
  if (coverageOk !== true)     failed.push("coverage_floor");
  if (!consecutiveOk)          failed.push("consecutive_clean_iterations");

  return {
    achieved,
    conditions: {
      regression_free: regressionFree,
      monotonic_finding_reduction: monotonic,
      coverage_floor: coverageOk,
      consecutive_clean_iterations: consecutiveClean
    },
    metrics: {
      latest_new_findings_above_threshold: newAboveThresh,
      latest_open_findings: typeof latest.open_findings === "number" ? latest.open_findings : null,
      latest_coverage: coverage,
      coverage_floor: COVERAGE_FLOOR,
      monotonic_window: MONOTONIC_WINDOW,
      consecutive_clean_min: CONSECUTIVE_CLEAN_MIN
    },
    failed_conditions: failed
  };
}

// ─── Constellation detection ─────────────────────────────────────────────────

function detectConstellation() {
  if (!process.env.CONSTELLATION_WS_URL) return { available: false, outboxPath: null };

  const candidates = [
    process.env.CONSTELLATION_OUTBOX_PATH,
    path.join(REPO_ROOT, "collab", "outbox.jsonl"),
    path.join(REPO_ROOT, "assets", "collab", "outbox.jsonl"),
    path.join(REPO_ROOT, ".constellation", "outbox.jsonl"),
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      const dir = path.dirname(p);
      if (fs.existsSync(dir)) return { available: true, outboxPath: p };
    } catch (_) { /* skip */ }
  }
  return { available: false, outboxPath: null };
}

// ─── Constellation: emit ULTRASAFE_ITERATION_BOUNDARY envelope ───────────────

function emitIterationBoundary(outboxPath, state, evaluation) {
  const target = process.env.CONSTELLATION_BOARD_AGENT || "board";
  const iters = Array.isArray(state.iterations) ? state.iterations : [];
  const latest = iters[iters.length - 1] || {};
  const envelope = {
    type: "CUSTOM",
    name: "ULTRASAFE_ITERATION_BOUNDARY",
    targetAgentId: target,
    value: {
      type: "ULTRASAFE_ITERATION_BOUNDARY",
      schema: "ultrasafe-iteration-boundary/v0.2.0",
      origin: "ultrasafe-stop-hook",
      mode: "advisory",
      boundary_at: new Date().toISOString(),
      iteration_index: iters.length,
      latest_iteration: {
        open_findings: latest.open_findings == null ? null : latest.open_findings,
        new_findings_above_threshold:
          latest.new_findings_above_threshold == null ? null : latest.new_findings_above_threshold,
        coverage: latest.coverage == null ? null : latest.coverage,
        clean: latest.clean === true
      },
      clean_signal: evaluation,
      advisory_message:
        "v0.2 advisory mode — release gate 차단 안 함. clean-signal 결과는 보고용. " +
        "blocking 은 v0.3+ 에서."
    }
  };
  const line = JSON.stringify(envelope);
  if (line.indexOf("\n") !== -1) throw new Error("envelope contains newline");
  fs.mkdirSync(path.dirname(outboxPath), { recursive: true });
  fs.appendFileSync(outboxPath, line + "\n", "utf8");
  // Roundtrip parse check (per workspace AGENTS.md §5.4 outbox JSON validation).
  try {
    JSON.parse(line);
  } catch (e) {
    throw new Error(`envelope roundtrip parse failed: ${e.message}`);
  }
}

// ─── Advance any pending pre-publish gate events ─────────────────────────────

function advancePendingGateEvents(state, evaluation) {
  if (!Array.isArray(state.release_gate_events)) return 0;
  let advanced = 0;
  const nowIso = new Date().toISOString();
  for (const ev of state.release_gate_events) {
    if (ev && ev.stage === "pre-publish-detected" && !ev.post_cycle_evaluated_at) {
      ev.stage = "post-cycle-evaluated";
      ev.post_cycle_evaluated_at = nowIso;
      ev.clean_signal_post_cycle = !!evaluation.achieved;
      ev.failed_conditions = evaluation.failed_conditions.slice();
      advanced += 1;
    }
  }
  return advanced;
}

// ─── Advisory summary ────────────────────────────────────────────────────────

function buildAdvisoryLine(state, evaluation, boundaryEmitted, gateAdvanced) {
  const iters = Array.isArray(state.iterations) ? state.iterations.length : 0;
  if (iters === 0 && gateAdvanced === 0) {
    return null; // silent
  }

  const parts = [];
  if (iters > 0) {
    const status = evaluation.achieved
      ? "ACHIEVED"
      : `미달 (failed: ${evaluation.failed_conditions.join(", ") || "n/a"})`;
    parts.push(`clean-signal ${status} (iterations=${iters})`);
  }
  if (boundaryEmitted) {
    parts.push("ITERATION_BOUNDARY emit");
  }
  if (gateAdvanced > 0) {
    parts.push(`pre-publish gate event ${gateAdvanced}건 post-cycle evaluate`);
  }
  parts.push("v0.2 advisory — 차단 없음");

  return `[ultrasafe] ${parts.join(" · ")}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const state = readState();
  if (!state) {
    // No state file → nothing run yet. Silent skip.
    process.exit(0);
  }

  const evaluation = evaluateCleanSignal(state);

  // Update clean_signal block.
  state.clean_signal = {
    achieved: evaluation.achieved,
    last_check: new Date().toISOString(),
    conditions: evaluation.conditions,
    metrics: evaluation.metrics,
    failed_conditions: evaluation.failed_conditions
  };

  // Advance any pending pre-publish gate events to post-cycle stage.
  const gateAdvanced = advancePendingGateEvents(state, evaluation);

  // Emit ULTRASAFE_ITERATION_BOUNDARY only when orchestrator flagged a real
  // iteration boundary crossed this cycle.
  let boundaryEmitted = false;
  const constellation = detectConstellation();
  if (state.pending_iteration_boundary === true && constellation.available) {
    try {
      emitIterationBoundary(constellation.outboxPath, state, evaluation);
      boundaryEmitted = true;
      state.pending_iteration_boundary = false;
      state.latest_iteration_boundary = new Date().toISOString();
    } catch (e) {
      process.stderr.write(
        `[ultrasafe] ULTRASAFE_ITERATION_BOUNDARY emit 실패 (${e.message}); state 갱신은 유지.\n`
      );
    }
  }

  writeState(state);

  const line = buildAdvisoryLine(state, evaluation, boundaryEmitted, gateAdvanced);
  if (line) {
    process.stderr.write(line + "\n");
  }

  // v0.2 advisory mode invariant — NEVER block.
  process.exit(0);
}

main();
