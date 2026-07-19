#!/usr/bin/env node
// context-watch.cjs — Stop-hook context-threshold handoff guard (Constellation v2.4.68).
//
// Mode: once context usage crosses a threshold (default 75%), require the compact-handoff
// card to be updated every turn until compaction — the /before-compact discipline becomes
// continuous instead of a single pre-compact moment, so an auto-compact can never land on a
// stale card. Registered as a Claude Code Stop hook; other harnesses implement the same
// contract at their turn-end hook point.
//
// Measurement: the harness does not expose context% to hooks, but the session transcript
// (JSONL) carries per-assistant-turn API usage. Context size = input_tokens +
// cache_read_input_tokens + cache_creation_input_tokens + output_tokens of the LAST
// non-sidechain assistant entry (sidechain = subagent context, not the main window).
// Window = max(declared window, session max observed context) — the observed max is a hard
// lower bound of the true window (context can never exceed it), which self-corrects an
// under-declared window on large-context models; the observed floor resets per session id
// (a new session may run a smaller-window model).
//
// Behavior at each Stop:
//   ratio < threshold           → disarm silently (compaction naturally disarms the mode).
//   ratio ≥ threshold:
//     stop_hook_active          → never re-block in the same stop chain (loop guard);
//                                 advance the turn baseline, note the mode in systemMessage.
//     handoff updated this turn → pass (mtime newer than previous turn-end baseline).
//     else                      → block ONCE with instructions: first crossing asks for the
//                                 full /before-compact pass, later turns ask for the turn's
//                                 delta only. Soft-strong: exactly one nudge per turn.
//
// Config (optional): .agent/context-watch.json under CLAUDE_PROJECT_DIR (override path via
// CONTEXT_WATCH_FILE): { enabled, threshold (0.75), window (200000), handoffPath
// (.agent/compact-handoff.md) }. Absent file = defaults (registering the hook is the opt-in).
// State: .agent/.context-watch-state.json (git-ignore it) — armed flag, turn baseline,
// per-session observed max.
'use strict';
const fs = require('fs');
const path = require('path');

let input = {};
try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch {}

const projDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const cfgPath = process.env.CONTEXT_WATCH_FILE || path.join(projDir, '.agent', 'context-watch.json');
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
if (cfg.enabled === false) process.exit(0);
const threshold = Number(cfg.threshold) > 0 ? Number(cfg.threshold) : 0.75;
const cfgWindow = Number(cfg.window) > 0 ? Number(cfg.window) : 200000;
const handoffRel = cfg.handoffPath || '.agent/compact-handoff.md';
const handoffPath = path.resolve(projDir, handoffRel);
const statePath = path.join(projDir, '.agent', '.context-watch-state.json');

const tPath = input.transcript_path;
if (!tPath || !fs.existsSync(tPath)) process.exit(0);

// Tail-read the transcript (last 1 MB is plenty for the latest turns).
let tail = '';
try {
  const st = fs.statSync(tPath);
  const want = Math.min(st.size, 1024 * 1024);
  const fd = fs.openSync(tPath, 'r');
  const buf = Buffer.alloc(want);
  fs.readSync(fd, buf, 0, want, st.size - want);
  fs.closeSync(fd);
  tail = buf.toString('utf8');
  if (want < st.size) tail = tail.slice(tail.indexOf('\n') + 1);   // drop the partial first line
} catch { process.exit(0); }

let lastCtx = 0, localMax = 0;
for (const l of tail.split('\n')) {
  if (!l || l.indexOf('"usage"') < 0) continue;
  let o; try { o = JSON.parse(l); } catch { continue; }
  if (o.type !== 'assistant' || o.isSidechain || !o.message || !o.message.usage) continue;
  const u = o.message.usage;
  const c = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0);
  lastCtx = c; if (c > localMax) localMax = c;
}
if (!lastCtx) process.exit(0);

let state = {};
try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch {}
if (state.sessionId !== input.session_id) state = { sessionId: input.session_id, maxCtx: 0 };   // observed floor is per-session (model/window may differ)
state.maxCtx = Math.max(state.maxCtx || 0, localMax);

const window = Math.max(cfgWindow, state.maxCtx);
const ratio = lastCtx / window;
const pct = Math.round(ratio * 100);
const thrPct = Math.round(threshold * 100);
const now = Date.now();

function save(patch) {
  try { fs.mkdirSync(path.dirname(statePath), { recursive: true }); fs.writeFileSync(statePath, JSON.stringify({ ...state, ...patch, lastRatio: Number(ratio.toFixed(4)), updatedAt: now }, null, 1)); } catch {}
}
function out(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0); }

if (ratio < threshold) { save({ armed: false, lastStopTs: now }); process.exit(0); }

if (input.stop_hook_active) {
  save({ armed: true, lastStopTs: now });
  out({ systemMessage: `[handoff-guard] 컨텍스트 ${pct}% ≥ ${thrPct}% — compact 전 모드 유지 (이번 턴 nudge 완료)` });
}

let handoffMtime = 0;
try { handoffMtime = fs.statSync(handoffPath).mtimeMs; } catch {}
const updatedThisTurn = state.lastStopTs && handoffMtime > state.lastStopTs;
const firstArm = !state.armed;

if (updatedThisTurn) {
  save({ armed: true, lastStopTs: now });
  out({ systemMessage: `[handoff-guard] 컨텍스트 ${pct}% — handoff 카드 이번 턴 갱신 확인 (compact 전 모드 계속)` });
}

save({ armed: true, lastNudgeTs: now });   // lastStopTs 미갱신 — 턴이 아직 안 끝났으므로 다음 평가 기준 유지
const reason = firstArm
  ? `[handoff-guard] 컨텍스트 사용률 ${pct}% — 임계 ${thrPct}% 도달, compact 전 모드 진입. /before-compact 절차(관행화 → 휘발 디테일 스캔 → 상시 카드 갱신 → durable 승격)를 지금 수행해 ${handoffRel} 를 갱신한 뒤 턴을 마치세요. 이후 compact 까지 매 턴 진행분을 카드에 반영해야 통과해요.`
  : `[handoff-guard] 컨텍스트 ${pct}% (compact 전 모드). 이번 턴 진행분이 handoff 카드에 아직 반영되지 않았어요 — ${handoffRel} 상시 카드에 이번 턴 델타(진행 상태·새 결정·활성 리소스)를 반영한 뒤 턴을 마치세요.`;
out({ decision: 'block', reason });
