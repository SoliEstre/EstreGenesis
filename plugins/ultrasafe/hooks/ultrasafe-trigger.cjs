#!/usr/bin/env node
// ultrasafe PreToolUse hook — v0.2.0 (advisory mode).
//
// Fires before publish-equivalent Bash commands (npm publish / pip upload /
// twine upload / cargo publish / gh release create / git push --tags to public
// remote / docker push / etc.). Performs a non-blocking advisory check:
//
//   1) Detect a publish-equivalent command from the Bash tool input.
//   2) Read `.ultrasafe/state.json` to retrieve the latest iteration boundary
//      + clean-signal-gate status from prior runs (orchestrator/aggregator write
//      this; if absent → "unknown" / "no prior runs").
//   3) Emit a ULTRASAFE_RELEASE_GATE A2A intent envelope to the Constellation
//      outbox (if available) with stage=pre-publish-detected, mode=advisory.
//   4) Update `.ultrasafe/state.json` with the detected pre-publish event for
//      orchestrator + Stop hook downstream consumption.
//   5) Print a single advisory stderr line summarizing the gate state.
//
// v0.2 advisory mode invariant: NEVER blocks (always exits 0). Blocking mode
// (v0.3+) will exit 2 when clean-signal not achieved + user gate prompt active.
//
// Per Ultrasafe.md v0.2.0 §14 (runtime topology) + §17 (hooks spec) +
// §18 (Constellation §13.16 5-intent integration) + §19 (advisory→blocking
// transition conditions). Mirrors hyperbrief PreToolUse hook structural
// pattern (advise mode, stderr surface, outbox emit on Constellation,
// fallback file state on standalone).

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ─── Arg parsing ─────────────────────────────────────────────────────────────

function getArg(name) {
  const prefix = `--${name}=`;
  for (const a of process.argv) {
    if (a === `--${name}`) return true;
    if (a.startsWith(prefix)) return a.slice(prefix.length);
  }
  return null;
}

const TOOL = getArg("tool") || "Bash";

// ─── Publish-equivalent matcher list ─────────────────────────────────────────

// Anchored to whole-word boundaries; covers the most common public-distribution
// channels. Conservative on false positives — better to skip than spuriously
// fire (advisory hook still emits when the orchestrator's own publish path is
// reached via dedicated tooling).
const PUBLISH_PATTERNS = [
  { re: /\bnpm\s+publish\b/,                      channel: "npm" },
  { re: /\bpnpm\s+publish\b/,                     channel: "pnpm" },
  { re: /\byarn\s+publish\b/,                     channel: "yarn" },
  { re: /\b(python\s+-m\s+)?twine\s+upload\b/,    channel: "pypi-twine" },
  { re: /\bpip\s+upload\b/,                       channel: "pypi-pip" },
  { re: /\bcargo\s+publish\b/,                    channel: "cargo" },
  { re: /\bgem\s+push\b/,                         channel: "rubygems" },
  { re: /\bgo\s+install\s+.+@/,                   channel: "go-modules" },
  { re: /\bdotnet\s+nuget\s+push\b/,              channel: "nuget" },
  { re: /\bdocker\s+push\b/,                      channel: "docker-registry" },
  { re: /\bgh\s+release\s+create\b/,              channel: "github-release" },
  { re: /\bgit\s+push\s+.*--tags\b/,              channel: "git-tags" },
  { re: /\bgit\s+push\s+.*--follow-tags\b/,       channel: "git-tags" },
  { re: /\bhelm\s+(push|repo\s+index)\b/,         channel: "helm" },
  { re: /\bterraform\s+(apply|push)\b/,           channel: "terraform" },
];

function detectPublishChannel(cmdString) {
  if (typeof cmdString !== "string" || cmdString.length === 0) return null;
  for (const p of PUBLISH_PATTERNS) {
    if (p.re.test(cmdString)) return p.channel;
  }
  return null;
}

// ─── Event id ────────────────────────────────────────────────────────────────

function generateGateEventId() {
  const t = new Date();
  const date =
    `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}` +
    `${String(t.getUTCDate()).padStart(2, "0")}`;
  const rand = crypto.randomBytes(4).toString("hex").slice(0, 6);
  return `us-gate-${date}-${rand}`;
}

// ─── Repo root + state dir ───────────────────────────────────────────────────

// v0.2.12 — 해소 규칙은 `lib/state-root.cjs` 한 곳에 있어요. 아래 주석이 적어둔 그 사고를
// 훅에서는 v0.2.4 로 고쳤는데 **MCP 서버 사본은 그 수정을 못 받았어요** — 걷는 함수는 같고
// 우선순위 사슬만 달라서, 훅은 프로젝트 루트에 쓰고 MCP 는 호출 cwd 를 따라갔어요. 사본이
// 셋이면 «같아야 한다» 는 주석은 규율이지 기제가 아니에요.
//
// (원 기록) 훅은 도구 호출이 실어온 cwd 로 발화하므로, 중첩 저장소로 cd 한 세션은 자기
// 이벤트를 *두 번째* `.ultrasafe/` 에 써요. 그러면 증거가 두 파일로 갈리고 한 파일만 읽는
// 쪽은 과소집계해요 (2026-07-11 실측: 5건 보임 / 실제 11건).
const stateRoot = require("../lib/state-root.cjs");
const REPO_ROOT = stateRoot.repoRoot(process.cwd());
const STATE_DIR = stateRoot.stateDir(process.cwd());
const STATE_PATH = stateRoot.statePath(process.cwd());

// ─── Secret masking ──────────────────────────────────────────────────────────
// The publish command is recorded into state.json for advisory context, but a
// publish line often carries a secret inline (`npm publish --otp=123456`,
// `NPM_TOKEN=… npm publish`, `twine upload -p <pass>`). Mask those before they
// land on disk — state.json may be committed (and .ultrasafe/ is gitignored as a
// second layer). Conservative: redact the VALUE, keep the flag/var name visible.
// Bare credential literals, recognised by issuer prefix. Shape rules below need a
// *name* next to the value (`--token=`, `FOO_SECRET=`); these forms carry none —
// the token stands alone in the line, which is the ordinary case for a URL-embedded
// PAT or an `Authorization` value. Prefix matching is the only signal available.
//
// The last entry is this project's own connection-key shape (Constellation §3.1:
// role prefix + hex). A scanner that catches every vendor's tokens and not its own
// is the shape that lets a publish line carrying a live board key through.
const SECRET_LITERALS = [
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,          // GitHub PAT / OAuth / user / server / refresh
  /\bglpat-[A-Za-z0-9_-]{16,}/g,            // GitLab
  /\bsk-ant-[A-Za-z0-9_-]{16,}/g,
  /\bsk-[A-Za-z0-9]{20,}/g,
  /\bnpm_[A-Za-z0-9]{20,}/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,        // Slack
  /\bAKIA[0-9A-Z]{16}\b/g,                  // AWS access key id
  /\b(?:ck|uk|pk|lk)-[a-f0-9]{12,}/g,       // this project's board keys
];

function maskSecrets(s) {
  // Two kinds of rule, deliberately separate.
  //
  //   ① **Shape rules** — a name sits beside the value, so the value can be redacted
  //      while the name stays readable (the preview keeps its advisory worth).
  //   ② **Literal rules** — no name anywhere; recognised by issuer prefix (above).
  //
  // Shape rules run first so the name survives; literal rules then sweep whatever
  // stood alone. Single-letter flags like `-p` are still NOT matched — too ambiguous
  // (docker/ssh/grep all use it for something else).
  //
  // Measured gaps this closes (Ultrasafe iteration 2, `crypto-13`/`crypto-14`/`meth-11`):
  // a PAT inside a push URL, an `Authorization: Bearer` value, an npmrc `:_authToken=`,
  // and this project's own key format all passed through unchanged. The npmrc case is
  // worth naming — the env-var rule below was case-*sensitive*, so `TOKEN` was caught
  // and `_authToken` was not, which is a distinction no attacker respects.
  return String(s)
    // ① flags: `--token=…` / `--password …`
    .replace(/(--?(?:otp|token|password|passwd|pass|secret|auth|api[-_]?key)[=\s]+)\S+/gi, "$1[redacted]")
    // ① named values: `NPM_TOKEN=…`, `//registry.npmjs.org/:_authToken=…` (case-insensitive)
    .replace(/\b([A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API[-_]?KEY|_KEY|_PASS)[A-Za-z0-9_]*)=\S+/gi, "$1=[redacted]")
    // ① URL userinfo: `https://user:secret@host` — redact the password half only
    .replace(/([a-z][a-z0-9+.-]*:\/\/[^\s:/@]+):[^\s@/]+@/gi, "$1:[redacted]@")
    // ① URL userinfo with no username — a lone credential standing in for one
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[A-Za-z0-9_-]{20,}@/gi, "$1[redacted]@")
    // ① auth header value, however the scheme is spelled
    .replace(/(Authorization\s*:\s*(?:Bearer|Basic|Token|Digest)?\s*)[A-Za-z0-9._~+/=-]{12,}/gi, "$1[redacted]")
    // ② bare literals recognised by issuer prefix
    .replace(new RegExp(SECRET_LITERALS.map((r) => r.source).join("|"), "g"), "[redacted]");
}

// ─── State read/write ────────────────────────────────────────────────────────

function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return {
      schema: "ultrasafe-state/v0.2.0",
      mode: "advisory",
      iterations: [],
      latest_iteration_boundary: null,
      clean_signal: {
        achieved: false,
        last_check: null,
        conditions: {
          regression_free: null,
          monotonic_finding_reduction: null,
          coverage_floor: null,
          consecutive_clean_iterations: 0
        }
      },
      release_gate_events: []
    };
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch (_) {
    // Malformed → reset to safe defaults (advisory; never blocks).
    return {
      schema: "ultrasafe-state/v0.2.0",
      mode: "advisory",
      iterations: [],
      latest_iteration_boundary: null,
      clean_signal: {
        achieved: false,
        last_check: null,
        conditions: {
          regression_free: null,
          monotonic_finding_reduction: null,
          coverage_floor: null,
          consecutive_clean_iterations: 0
        }
      },
      release_gate_events: [],
      _recovered_from_malformed: new Date().toISOString()
    };
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
    process.stderr.write(`[ultrasafe] state write 실패 (${e.message}); advisory 계속 진행.\n`);
    return false;
  }
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

// ─── Constellation: emit ULTRASAFE_RELEASE_GATE envelope ─────────────────────

function emitReleaseGateToOutbox(outboxPath, eventId, channel, state) {
  const target = process.env.CONSTELLATION_BOARD_AGENT || "board";
  const envelope = {
    type: "CUSTOM",
    name: "ULTRASAFE_RELEASE_GATE",
    targetAgentId: target,
    value: {
      type: "ULTRASAFE_RELEASE_GATE",
      schema: "ultrasafe-release-gate/v0.2.0",
      gate_event_id: eventId,
      origin: "ultrasafe-pretooluse-hook",
      mode: "advisory",
      stage: "pre-publish-detected",
      detected_channel: channel,
      detected_at: new Date().toISOString(),
      clean_signal: {
        achieved: !!(state.clean_signal && state.clean_signal.achieved),
        last_check: (state.clean_signal && state.clean_signal.last_check) || null,
        consecutive_clean_iterations:
          (state.clean_signal &&
            state.clean_signal.conditions &&
            state.clean_signal.conditions.consecutive_clean_iterations) || 0
      },
      latest_iteration_boundary: state.latest_iteration_boundary || null,
      iterations_run: Array.isArray(state.iterations) ? state.iterations.length : 0,
      advisory_message:
        "v0.2 advisory mode — publish 차단 안 함. clean-signal 미달 시에도 경고만 emit. " +
        "blocking mode 는 v0.3+ 에서 enabled."
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

// ─── stdin (tool input) ──────────────────────────────────────────────────────

function readStdinSync() {
  try { return fs.readFileSync(0, "utf8"); } catch { return ""; }
}

function parseToolInput(raw) {
  if (!raw || !raw.trim()) return {};
  try { return JSON.parse(raw); } catch { return { _raw: raw }; }
}

// ─── Advisory summary line ───────────────────────────────────────────────────

function buildAdvisoryLine(channel, eventId, state, constellationOn) {
  const cs = state.clean_signal || {};
  const conds = cs.conditions || {};
  const iters = Array.isArray(state.iterations) ? state.iterations.length : 0;

  const csStatus = cs.achieved
    ? "achieved"
    : iters === 0
      ? "미실행 (no prior iteration)"
      : "미달";
  const csDetail = iters === 0
    ? ""
    : ` (consecutive_clean=${conds.consecutive_clean_iterations || 0}, iterations=${iters})`;

  const surface = constellationOn ? "보드 emit" : "state.json 만 기록";

  return (
    `[ultrasafe] publish-equivalent 감지 (${channel}) — clean-signal ${csStatus}${csDetail}. ` +
    `v0.2 advisory — publish 차단 안 함. gate_event=${eventId}, ${surface}. ` +
    `blocking 전환은 v0.3+ 에서.`
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (TOOL !== "Bash") {
    // Only Bash invocations carry publish commands. Silent skip.
    process.exit(0);
  }

  const raw = readStdinSync();
  const input = parseToolInput(raw);
  const cmd = (input && (input.command || (input.tool_input && input.tool_input.command))) || "";

  const channel = detectPublishChannel(cmd);
  if (!channel) {
    // Non-publish Bash call — silent skip (most Bash is routine).
    process.exit(0);
  }

  const eventId = generateGateEventId();
  const state = readState();

  // Record this pre-publish detection event into state.
  if (!Array.isArray(state.release_gate_events)) state.release_gate_events = [];
  state.release_gate_events.push({
    gate_event_id: eventId,
    detected_at: new Date().toISOString(),
    detected_channel: channel,
    mode: "advisory",
    stage: "pre-publish-detected",
    clean_signal_at_detection: !!(state.clean_signal && state.clean_signal.achieved),
    command_preview: maskSecrets(cmd.length > 200 ? cmd.slice(0, 200) + "…" : cmd)
  });
  // Trim to last 50 events to bound state file growth.
  if (state.release_gate_events.length > 50) {
    state.release_gate_events = state.release_gate_events.slice(-50);
  }
  writeState(state);

  const constellation = detectConstellation();
  if (constellation.available) {
    try {
      emitReleaseGateToOutbox(constellation.outboxPath, eventId, channel, state);
    } catch (e) {
      process.stderr.write(
        `[ultrasafe] ULTRASAFE_RELEASE_GATE emit 실패 (${e.message}); state.json 기록은 유지. advisory 계속.\n`
      );
    }
  }

  process.stderr.write(buildAdvisoryLine(channel, eventId, state, constellation.available) + "\n");

  // v0.2 advisory mode invariant — NEVER block.
  process.exit(0);
}

main();
