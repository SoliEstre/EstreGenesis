#!/usr/bin/env node
// hyperbrief PreToolUse advise hook — v0.5.3 (bundle 008/dogfood Entry 03).
//
// Fires before AskUserQuestion / Bash (write/deploy/send whitelist) tool calls.
// Detects a decision-question intent, registers a pending review item, and emits
// an advisory stderr message. NEVER blocks (exit 0 always).
//
// Routing:
//   1) Constellation running (CONSTELLATION_WS_URL set + local outbox.jsonl reachable)
//      → emit a DECISION_REQUEST envelope to the outbox (local-bridge relays to board).
//        stderr: "review item posted to board (id: <hb-id>), defer or generate full brief."
//   2) Standalone, auto_generate_review_doc = "on"
//      → write a pending-review placeholder to .hyperbrief/pending-reviews/<id>.md.
//        stderr: file path + advise.
//   3) Standalone, auto_generate_review_doc = "ask" (default)
//      → advise to set preference; no file emitted.
//   4) Standalone, auto_generate_review_doc = "off"
//      → simple stderr alert only.
//
// Config sources (first wins):
//   - HYPERBRIEF_AUTO_GENERATE_REVIEW_DOC env (on | off | ask)
//   - .hyperbrief/config.json {auto_generate_review_doc: "on"|"off"|"ask"}
//   - default = "ask"
//
// v0.8.0 — brief tier floor (Hyperbrief.md §2.5). Every route below now names the RESOLVED FLOOR
// instead of offering a full brief, because the offer was the two-valued vocabulary this release
// replaced. Sources (first wins):
//   - HYPERBRIEF_BRIEF_TIER env (off | summary | full)
//   - .hyperbrief/config.json {brief_tier: "off"|"summary"|"full"}
//   - default = "summary"
// Unreadable file / unrecognized value → "summary" AND the reason is stated, never silently coerced.
//
// Per Hyperbrief.md §11.1 v0.5.3 and Constellation §13.16.9 (DECISION_REQUEST family
// already in the A2A allowlist since v2.5.27).

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

const TOOL = getArg("tool") || "";

// ─── Bash danger-list ────────────────────────────────────────────────────────

const BASH_DANGER_PATTERNS = [
  /\bgit\s+push\b/,
  /\bgh\s+release\b/,
  /\bgh\s+pr\s+create\b/,
  /\bgh\s+pr\s+merge\b/,
  /\bnpm\s+publish\b/,
  /\bpnpm\s+publish\b/,
  /\byarn\s+publish\b/,
  /\bcurl\s+.*\s-X\s*(POST|PUT|DELETE)\b/,
  /\bkubectl\s+(apply|delete|create)\b/,
  /\bdocker\s+push\b/,
  /\bterraform\s+apply\b/,
  /\bgcloud\s+.*deploy\b/,
  /\baws\s+(s3|deploy|lambda|cloudformation)\s+(cp|sync|update|deploy|create-stack)\b/,
];

function isDangerousCommand(cmdString) {
  if (typeof cmdString !== "string" || cmdString.length === 0) return false;
  return BASH_DANGER_PATTERNS.some((re) => re.test(cmdString));
}

// ─── Decision id ────────────────────────────────────────────────────────────

function generateDecisionId() {
  // hb-YYYYMMDD-<6 alphanum> matching Hyperbrief.md decision_id pattern.
  const d = process.env.HB_TS || ""; // optional inject for testing
  let date;
  if (/^\d{8}$/.test(d)) {
    date = d;
  } else {
    const t = new Date();
    date = `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}${String(t.getUTCDate()).padStart(2, "0")}`;
  }
  const rand = crypto.randomBytes(4).toString("hex").slice(0, 6);
  return `hb-${date}-${rand}`;
}

// ─── Config resolution ──────────────────────────────────────────────────────

function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 16; i++) {
    if (fs.existsSync(path.join(dir, ".git")) || fs.existsSync(path.join(dir, ".hyperbrief"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

const REPO_ROOT = findRepoRoot(process.cwd());

function readAutoGeneratePref() {
  const env = process.env.HYPERBRIEF_AUTO_GENERATE_REVIEW_DOC;
  if (env === "on" || env === "off" || env === "ask") return env;

  const configPath = path.join(REPO_ROOT, ".hyperbrief", "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const v = cfg && cfg.auto_generate_review_doc;
      if (v === "on" || v === "off" || v === "ask") return v;
    } catch (_) { /* malformed → default */ }
  }
  return "ask";
}

// ─── Brief tier (v0.8.0 — Hyperbrief.md §2.5) ───────────────────────────────
//
// This is the toggle's only mechanical enforcement point. Every route below used to end by
// telling the agent it could "request a full brief" — the two-valued vocabulary of §2.1, spoken
// at exactly the moment the agent decides what to emit. Naming the resolved FLOOR instead is the
// difference between a policy and a suggestion: a floor that lives only in the spec is applied
// when the agent remembers to.
//
// Precedence (session-level HB.<tier> commands are resolved by the skill, not visible here):
//   HYPERBRIEF_BRIEF_TIER env  →  .hyperbrief/config.json {brief_tier}  →  "summary"
//
// A malformed file or unrecognized value resolves to the default AND says so. Silent coercion is
// indistinguishable from the setting having been honored, which matters most to the operator who
// pinned "full" and never got it.

const TIERS = ["off", "summary", "full"];

function readBriefTier() {
  const env = process.env.HYPERBRIEF_BRIEF_TIER;
  if (TIERS.includes(env)) return { tier: env, source: "env", note: null };

  const configPath = path.join(REPO_ROOT, ".hyperbrief", "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const v = cfg && cfg.brief_tier;
      if (TIERS.includes(v)) return { tier: v, source: "config", note: null };
      if (v !== undefined) {
        return { tier: "summary", source: "default", note: `config.json 의 brief_tier 값 ${JSON.stringify(v)} 을 못 알아봤어요 (off|summary|full)` };
      }
    } catch (e) {
      return { tier: "summary", source: "default", note: `config.json 을 읽지 못했어요 (${e.message})` };
    }
  }
  return { tier: "summary", source: "default", note: null };
}

// One sentence naming the floor, appended to whichever route fires.
function briefTierAdvice() {
  const { tier, source, note } = readBriefTier();
  const src = { env: "env", config: ".hyperbrief/config.json", default: "기본값" }[source] || source;
  let line;
  if (tier === "full") {
    line = `브리핑 바닥: full (${src}) — 이 결정은 escalation 점수와 무관하게 9섹션 전체 브리핑이에요.`;
  } else if (tier === "summary") {
    line = `브리핑 바닥: summary (${src}) — 하한 미달이어도 최소 요약 브리핑이에요 (1줄 통보 아님). 되돌릴 수 없는 결정은 이 설정과 무관하게 계속 전체 브리핑이에요.`;
  } else {
    line = `브리핑 바닥: off (${src}) — 하한 미달이면 1줄 통보예요 (v0.7.x 거동). 요약을 기본으로 켜려면 .hyperbrief/config.json 에 "brief_tier": "summary".`;
  }
  return note ? `${line} ⚠ ${note} — summary 로 진행해요.` : line;
}

// ─── Constellation detection ────────────────────────────────────────────────

function detectConstellation() {
  // Heuristics, all non-blocking:
  // (a) CONSTELLATION_WS_URL env set, AND
  // (b) local outbox.jsonl path reachable (assets/collab/outbox.jsonl or similar)
  if (!process.env.CONSTELLATION_WS_URL) return { available: false, outboxPath: null };

  const candidates = [
    process.env.CONSTELLATION_OUTBOX_PATH,
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

// ─── Constellation: emit DECISION_REQUEST to outbox ─────────────────────────

function emitDecisionRequestToOutbox(outboxPath, decisionId, tool, toolInput) {
  const target = process.env.CONSTELLATION_BOARD_AGENT || "board";
  const envelope = {
    type: "CUSTOM",
    name: "DECISION_REQUEST",
    targetAgentId: target,
    value: {
      type: "DECISION_REQUEST",
      decision_id: decisionId,
      origin: "hyperbrief-hook",
      pending: true, // placeholder — full HyperbriefCard follows when agent generates the brief
      detected_tool: tool,
      detected_intent: tool === "AskUserQuestion" ? "user-facing decision question" : "write/deploy/send command",
      ack_tier_required: "decided",
      stage: "pending-review",
      re: `[hyperbrief] 결정 시점 감지 — ${tool}. 검토 사안 등록 (전체 브리핑은 에이전트가 생성 시 보강).`
    }
  };
  // §13.13.2 회수 열쇠 — 이 봉투는 targeted A2A 라, 열쇠가 없으면 서버가 delivered ack 도 pending
  //   등재도 하지 않아요(상대 재시작 창에서 무증상 유실). 플러그인은 마켓플레이스로 **단독 설치**돼서
  //   constellation 의 relay-key.cjs 가 옆에 없어요 — 그래서 자격 규칙을 여기 적어요(정본은 그 파일).
  if (envelope.targetAgentId && !envelope.msgId) envelope.msgId = "hb-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  const line = JSON.stringify(envelope);
  if (line.indexOf("\n") !== -1) throw new Error("envelope contains newline");
  fs.mkdirSync(path.dirname(outboxPath), { recursive: true });
  fs.appendFileSync(outboxPath, line + "\n", "utf8");
}

// ─── Standalone: write pending-review placeholder ───────────────────────────

function writeStandaloneReviewPlaceholder(decisionId, tool, toolInput) {
  const dir = path.join(REPO_ROOT, ".hyperbrief", "pending-reviews");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${decisionId}.md`);
  const md = [
    `# Pending review · ${decisionId}`,
    "",
    `> Created by hyperbrief PreToolUse hook (v0.5.3, advise mode).`,
    `> Tool detected: \`${tool}\``,
    `> Created at: ${new Date().toISOString()}`,
    "",
    "## Detected intent",
    "",
    tool === "AskUserQuestion" ? "에이전트가 사용자에게 결정을 물으려는 시점이 감지되었습니다." : "위험 명령어 사용 시점이 감지되었습니다 (write/deploy/send 화이트리스트 매치).",
    "",
    "## Tool input (raw)",
    "",
    "```json",
    JSON.stringify(toolInput || {}, null, 2).slice(0, 4000),
    "```",
    "",
    "## Next steps",
    "",
    "1. 결정을 지금 검토하려면 → 에이전트에게 \"이 결정에 대한 전체 hyperbrief 브리핑을 만들어줘\" 요청.",
    "2. 나중에 검토하려면 → 본 파일을 그대로 두고 다른 작업 진행. 본 파일이 검토 큐 역할.",
    "3. 검토 완료 후 → 본 파일을 `.hyperbrief/pending-reviews/_archive/` 로 이동 또는 삭제.",
    "",
    "## Status",
    "",
    "- [ ] reviewed",
    "- [ ] decision recorded in `.agent/_decisions/hyperbrief-ledger.jsonl`",
    ""
  ].join("\n");
  fs.writeFileSync(file, md, "utf8");
  return file;
}

// ─── stdin (tool input) ─────────────────────────────────────────────────────

function readStdinSync() {
  try { return fs.readFileSync(0, "utf8"); } catch { return ""; }
}

function parseToolInput(raw) {
  if (!raw || !raw.trim()) return {};
  try { return JSON.parse(raw); } catch { return { _raw: raw }; }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const raw = readStdinSync();
  const input = parseToolInput(raw);

  if (TOOL === "Bash") {
    const cmd = (input && (input.command || input.tool_input?.command)) || "";
    if (!isDangerousCommand(cmd)) {
      // Silent skip — most Bash calls are routine.
      process.exit(0);
    }
  } else if (TOOL !== "AskUserQuestion") {
    // Unknown tool — silent skip rather than spurious alert.
    process.exit(0);
  }

  const decisionId = generateDecisionId();
  const constellation = detectConstellation();

  if (constellation.available) {
    try {
      emitDecisionRequestToOutbox(constellation.outboxPath, decisionId, TOOL, input);
      process.stderr.write(
        `[hyperbrief] 결정 시점 감지 (${TOOL}) — 검토 사안이 Constellation 보드에 등록되었습니다 (id: ${decisionId}). ` +
        `보드의 검토 사안 패널에서 확인 가능. ${briefTierAdvice()}\n`
      );
    } catch (e) {
      process.stderr.write(`[hyperbrief] 알림 emit 실패 (${e.message}); fallback 알림: ${TOOL} 호출 직전 결정 시점 감지.\n`);
    }
    process.exit(0);
  }

  // Constellation off → standalone
  const pref = readAutoGeneratePref();
  if (pref === "on") {
    try {
      const file = writeStandaloneReviewPlaceholder(decisionId, TOOL, input);
      const relFile = path.relative(REPO_ROOT, file);
      process.stderr.write(
        `[hyperbrief] 결정 시점 감지 (${TOOL}) — 검토 사안 문서 자동 생성됨: ${relFile}. ${briefTierAdvice()}\n`
      );
    } catch (e) {
      process.stderr.write(`[hyperbrief] 검토 사안 문서 생성 실패 (${e.message}); fallback 알림: ${TOOL} 호출 직전 결정 시점 감지.\n`);
    }
  } else if (pref === "ask") {
    process.stderr.write(
      `[hyperbrief] 결정 시점 감지 (${TOOL}). ` +
      `검토 사안 문서 자동 생성을 켜시려면 .hyperbrief/config.json의 auto_generate_review_doc를 "on"으로 설정하세요. ` +
      `현재 설정: "ask" (Constellation 사용 시 자동 보드 등록). ${briefTierAdvice()}\n`
    );
  } else {
    process.stderr.write(`[hyperbrief] 결정 시점 감지 (${TOOL}). (auto_generate_review_doc=off) ${briefTierAdvice()}\n`);
  }

  process.exit(0);
}

main();
