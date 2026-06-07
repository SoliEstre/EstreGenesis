#!/usr/bin/env node
// pre-send-probe.cjs — cursor-tail probe per feedback_pre_send_inbound_check.md
//
// Usage:
//   LAST_SURFACED_CURSOR=<n> node pre-send-probe.cjs           # outbound-A2A pre-send probe (§13.16.10)
//   node pre-send-probe.cjs --rearm                            # cycle-end probe + watcher rearm (§13.16.10 v2.5.2 ext)
//
// Exit codes:
//   0 = clean (no meaningful since cursor)
//   2 = meaningful inbound surfaced (caller MUST inspect + decide; do not emit blindly)

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const REARM_MODE = process.argv.includes('--rearm');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// v2.5.8 env-var override form — share one script across EG / main-upstream / Hermes / future adopters
//   INBOX_PATH       → override inbox file (default: assets/collab/inbox.log)
//   CURSOR_FILE_PATH → override cursor file (default: assets/collab/.last-surfaced-cursor)
//   WATCHER_SCRIPT   → override watcher fallback path (default: assets/scripts/watcher-rearm.cjs)
//   LAST_SURFACED_CURSOR → override the cursor value itself (already supported)
const INBOX = process.env.INBOX_PATH
  ? path.resolve(process.env.INBOX_PATH)
  : path.resolve(__dirname, '..', 'collab', 'inbox.log');
const CURSOR_FILE = process.env.CURSOR_FILE_PATH
  ? path.resolve(process.env.CURSOR_FILE_PATH)
  : path.resolve(__dirname, '..', 'collab', '.last-surfaced-cursor');
const WATCHER_SCRIPT_PATH = process.env.WATCHER_SCRIPT
  ? path.resolve(process.env.WATCHER_SCRIPT)
  : path.resolve(__dirname, 'watcher-rearm.cjs');

// §13.16.9 A2A-intent allowlist (v2.5.2 4-group classification: meaningful = A2A-intent only)
// transport / liveness / handshake / notice / board-directed UX residual all filtered out
// v2.5.20 extensions:
//   - Request/Reply: generic ask/respond envelopes (cross-agent S4-style coordination)
//   - Attachment: standalone attachment metadata envelope (Hermes 2026-06-01 11:09-11:11 UTC pattern)
//   - ArtifactManifest/ArtifactComplete: chunked transfer (§13.11 rule 5) anchor + close
//     (ArtifactChunk intentionally excluded — high-volume reassembly state, not meaningful at agent layer)
const ALLOWLIST = new Set([
  'Delegate', 'UserPrompt', 'WorkerReport', 'WorkerAck',
  'Report', 'BlockerManifest', 'BlockerNudge',
  'PRRequest', 'PRDraftReady', 'PRReviewAck',
  'PRMergeRequest', 'PRMergeAck', 'PRStatusUpdate',
  'PRRequestRejected',
  // AgentHello reclassified to handshake group (v2.5.2) — agent layer does not wake on it
  'Handoff', 'HandoffRequested', 'HandoffReady',
  'Command', 'Priority', 'Cancel',
  'DeadlockProbe', 'ReviewSLAAck', 'PreemptRequest',
  'PreemptForce', 'MediationProposal', 'MediationAck',
  'EscalationRequest',
  // v2.5.20 extensions — generic coordination + attachment / chunked-transfer anchors
  'Request', 'Reply',
  'Attachment',
  'ArtifactManifest', 'ArtifactComplete',
]);

function readCursor() {
  if (process.env.LAST_SURFACED_CURSOR) {
    return Number(process.env.LAST_SURFACED_CURSOR);
  }
  if (fs.existsSync(CURSOR_FILE)) {
    return Number(fs.readFileSync(CURSOR_FILE, 'utf8').trim()) || 0;
  }
  return 0;
}

function writeCursor(n) {
  try {
    fs.writeFileSync(CURSOR_FILE, String(n));
  } catch (e) {
    console.error(`[probe] WARN cursor file write failed: ${e.message}`);
  }
}

// ---- runaway 보호 (2026-06-07 incident 후속) ----
// inbox.log 가 비정상적으로 폭증하면 (예: 합류 중복 → reconnect loop → AgentHello/transport 이벤트 폭주)
// readFileSync 가 메모리 폭발 + surface 가 context 폭발 → API Usage Policy block.
// 임계 size 넘으면: streaming line count → cursor advance to tail → surface skip → 사용자에 alarm.
const RUNAWAY_BYTES = parseInt(process.env.PROBE_RUNAWAY_BYTES || '', 10) || 32 * 1024 * 1024;   // 32 MiB default
const MAX_MEANINGFUL_SURFACE = 50;                                                                // probe 당 surface 항목 상한
function countLinesStream(file) {
  const buf = Buffer.alloc(64 * 1024);
  let fd; try { fd = fs.openSync(file, 'r'); } catch { return 0; }
  let count = 0, read;
  while ((read = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
    for (let i = 0; i < read; i++) if (buf[i] === 0x0A) count++;
  }
  fs.closeSync(fd);
  return count;
}
function probe(cursor) {
  if (!fs.existsSync(INBOX)) {
    console.error(`[probe] inbox.log not found at ${INBOX} (cursor=${cursor})`);
    return { total: 0, newCount: 0, meaningful: [] };
  }
  // runaway guard — 임계 size 넘으면 readFileSync 안 함 + cursor 를 tail 로 advance + alarm
  const st = fs.statSync(INBOX);
  if (st.size > RUNAWAY_BYTES) {
    const tail = countLinesStream(INBOX);
    console.error(`[probe] ⚠ RUNAWAY DETECTED — inbox.log size=${st.size} bytes (${(st.size / 1048576).toFixed(1)} MiB) exceeds cap=${RUNAWAY_BYTES}. Likely duplicate-client reconnect loop or transport-event flood. Skipping surface + advancing cursor ${cursor} → ${tail} (tail). Investigate bridge state + rotate inbox.log manually.`);
    writeCursor(tail);
    return { total: tail, newCount: 0, meaningful: [], runaway: true };
  }
  const raw = fs.readFileSync(INBOX, 'utf8');
  const realLines = raw.split('\n').filter(Boolean);
  const totalCount = realLines.length;
  const newLines = realLines.slice(cursor);
  const meaningful = [];
  for (let i = 0; i < newLines.length; i++) {
    const l = newLines[i];
    let o;
    try { o = JSON.parse(l); } catch { continue; }
    // v2.5.44: skip self-emission echoes. The bridge logs both outbound (ev:"sent")
    // and inbound (ev:"inbound") to the same inbox.log file. Self-emissions carry
    // application-tier names (Report / Delegate / WorkerReport / etc.) that match
    // the §13.16.9 A2A-intent allowlist, so without this gate every outbox push
    // gets echo-surfaced to the agent as if it were inbound — pure context noise.
    // Note: v2.4.16 dropped a pure ev-gate because some adopter bridges write
    // inbound without the ev marker; this is a per-line ev:"sent" SKIP, not an
    // ev:"inbound" REQUIRE, so adopters without ev annotations still see their
    // inbound surfaced normally.
    if (o?.ev === 'sent') continue;
    // v2.5.20: also check value.name for doubly-wrapped envelopes where outer
    // name field carries the literal "CUSTOM" instead of the MessageName
    // (observed in 2026-06-02 Hermes meta-ack at inbox 22856 — Hermes-side
    // envelope construction stamps type literal at outer name level + actual
    // MessageName at value.name). Without the fallback the probe misses these.
    const outerName = o?.msg?.name || o?.name;
    const innerName = o?.msg?.value?.name || o?.value?.name;
    const name = (outerName && ALLOWLIST.has(outerName)) ? outerName
               : (innerName && ALLOWLIST.has(innerName) && (outerName === 'CUSTOM' || !outerName)) ? innerName
               : null;
    if (name) {
      meaningful.push({ idx: cursor + i + 1, name, body: o });
    }
  }
  return { total: totalCount, newCount: newLines.length, meaningful };
}

function isWatcherAlive() {
  // v2.5.8 alive gate — main-upstream hardening (2026-06-01) — prevents spawn-leak
  // (every turn-close spawning a fresh watcher without checking creates a stack of
  // background processes). Cross-platform: tries `pgrep -f` first (POSIX), falls back
  // to `tasklist` (Windows). If neither tool is available (e.g., bare Windows without
  // git-bash), returns null = "unknown" — caller treats as "skip spawn; agent-side
  // rearm is canonical" rather than blind spawn.
  const { spawnSync } = require('child_process');
  const PGREP_PATTERN = path.basename(WATCHER_SCRIPT_PATH);
  try {
    const r = spawnSync('pgrep', ['-f', PGREP_PATTERN], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim().length > 0) return true;
    if (r.status === 1) return false; // pgrep ran, no match
  } catch (_) { /* pgrep not present */ }
  try {
    const r = spawnSync('tasklist', ['/V', '/FO', 'CSV'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.includes(PGREP_PATTERN)) return true;
    if (r.status === 0) return false;
  } catch (_) { /* tasklist not present */ }
  return null; // unknown
}

function spawnWatcher(base) {
  // Best-effort: spawn detached background watcher script if one exists.
  // The agent layer is the canonical watcher per §13.16.6; this is a fallback
  // for the Stop hook surface where the agent has already exited the turn.
  // v2.5.8: alive gate prevents leak — if a watcher is already running, skip spawn.
  if (!fs.existsSync(WATCHER_SCRIPT_PATH)) {
    console.error(`[probe] no watcher-rearm.cjs found at ${WATCHER_SCRIPT_PATH} (skip spawn; agent-side rearm is canonical)`);
    return null;
  }
  const alive = isWatcherAlive();
  if (alive === true) {
    console.error(`[probe] watcher already alive (alive gate); skip spawn`);
    return null;
  }
  if (alive === null) {
    console.error(`[probe] watcher alive-check unavailable (no pgrep / tasklist); skip spawn — agent-side rearm is canonical`);
    return null;
  }
  // alive === false → safe to spawn
  try {
    const child = spawn(process.execPath, [WATCHER_SCRIPT_PATH, '--base', String(base)], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    return child.pid || null;
  } catch (e) {
    console.error(`[probe] watcher spawn failed: ${e.message}`);
    return null;
  }
}

// ---- v2.4.7 session-aware routing (단일 워크스페이스 멀티에이전트) — register-all + fail-safe ----
// 두 Claude 세션이 같은 워크스페이스를 공유하면 동일 Stop hook 을 실행 → 동일 cursor 경쟁
// (worker 세션이 main 의 cursor 를 먼저 advance → main surfacing 이 clean 으로 보여 죽음).
// 별도 워크스페이스 분리(확장 중복 로딩 + 맥락 단절 비용)를 피하면서 per-session env(CLAUDE_CODE_SESSION_ID,
// Claude Code 가 hook 프로세스에 주입 — src=env 확인)로 분기.
//
// register-all 모델 (v2.4.7): 모든 세션이 자기 소유 inbox 를 레지스트리에 선언. 각 hook 실행은
// SELF 가 소유한 inbox 만 처리하고 나머지는 즉시 skip(exit 0, cursor 미advance).
//   - 레지스트리 비활성(없음/빈 workers) → legacy default (단일 세션 워크스페이스, 기존과 동일 처리) [back-compat]
//   - 레지스트리 활성 시:
//       · 미등록/식별불가 세션 → 전부 skip (FAIL-SAFE: 절대 타 세션 surface 가로채지 않음. main 보호를 규율이 아닌 메커니즘으로 보장)
//       · 타 세션 소유 inbox    → skip
//       · 소유자 없는 inbox     → skip (register-all: 명시적 소유 필요 — 누락은 loud 경고)
//       · 자기 소유 inbox       → 정상 처리
// session_id source: CLAUDE_CODE_SESSION_ID env → 없으면 stdin payload(.session_id).
// 레지스트리: AGENT_SESSIONS_PATH env || <cwd>/.agent-sessions.json.
//   형식: { workers: { "<session_id>": { role, ownInboxes:[path,...] } } } (main 도 role='main' 로 등록 — boot 의례 first-action).
function resolveSelfSession() {
  if (process.env.CLAUDE_CODE_SESSION_ID) return { id: process.env.CLAUDE_CODE_SESSION_ID, src: 'env' };
  try {
    if (!process.stdin.isTTY) {
      const data = fs.readFileSync(0, 'utf8');
      if (data && data.trim()) { const j = JSON.parse(data); if (j && j.session_id) return { id: j.session_id, src: 'stdin' }; }
    }
  } catch (_) { /* no stdin payload */ }
  return { id: null, src: 'none' };
}
const SELF = resolveSelfSession();
const REGISTRY_PATH = process.env.AGENT_SESSIONS_PATH
  ? path.resolve(process.env.AGENT_SESSIONS_PATH)
  : path.join(process.cwd(), '.agent-sessions.json');
function loadAgentRegistry() {
  try { const j = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')); return (j && typeof j === 'object') ? j : null; }
  catch { return null; }
}
{
  const norm = (p) => { const r = path.resolve(p); return process.platform === 'win32' ? r.toLowerCase() : r; };   // win32 대소문자 무시 + 구분자 정규화
  const reg = loadAgentRegistry();
  const workers = (reg && reg.workers && typeof reg.workers === 'object') ? reg.workers : null;
  const active = !!(workers && Object.keys(workers).length > 0);
  console.error(`[probe] session=${SELF.id ? SELF.id.slice(0, 8) : 'none'} src=${SELF.src} cwd=${process.cwd()} registry=${active ? 'active' : (reg ? 'empty' : 'none')} inbox=${path.basename(INBOX)}`);
  if (active) {
    const self = SELF.id ? workers[SELF.id] : null;
    const ownerOf = new Map();
    for (const [sid, w] of Object.entries(workers)) {
      for (const ib of (Array.isArray(w.ownInboxes) ? w.ownInboxes : [])) ownerOf.set(norm(ib), sid);
    }
    const owner = ownerOf.get(norm(INBOX)) || null;
    if (!self) {
      console.error(`[probe] session-route SKIP-ALL — session ${SELF.id ? SELF.id.slice(0, 8) : 'unknown'} not registered (registry active). FAIL-SAFE: no cursor advance, no surface steal. Register via register-session.cjs to enable this session's probes.`);
      process.exit(0);
    }
    if (owner !== SELF.id) {
      const why = owner ? `owned by ${owner.slice(0, 8)}(role=${workers[owner].role || '?'})` : 'no registered owner (register-all requires explicit ownership — add to a session ownInboxes)';
      console.error(`[probe] session-route SKIP — inbox ${path.basename(INBOX)} ${why}; this session=${SELF.id.slice(0, 8)}(role=${self.role || '?'}). No cursor advance.`);
      process.exit(0);
    }
    console.error(`[probe] session-route OWN — session ${SELF.id.slice(0, 8)}(role=${self.role || '?'}) owns ${path.basename(INBOX)}; processing.`);
  }
}

// ----- main -----

const CURSOR = readCursor();
const result = probe(CURSOR);

console.error(`[probe] mode=${REARM_MODE ? 'rearm' : 'pre-send'} cursor=${CURSOR} total=${result.total} new=${result.newCount} meaningful=${result.meaningful.length}`);

if (result.meaningful.length > 0) {
  // runaway 보호 — meaningful 폭주 시 surface 상한 (2026-06-07 incident 후속). cap 초과분은 count 만 요약.
  const surfaceCount = Math.min(result.meaningful.length, MAX_MEANINGFUL_SURFACE);
  for (let i = 0; i < surfaceCount; i++) {
    const m = result.meaningful[i];
    const v = m.body?.msg?.value || m.body?.value || {};
    console.error(`  - line ${m.idx} ${m.name}: ${JSON.stringify(v).slice(0, 400)}`);
  }
  if (result.meaningful.length > MAX_MEANINGFUL_SURFACE) {
    console.error(`[probe] … +${result.meaningful.length - MAX_MEANINGFUL_SURFACE} more meaningful items truncated (cap=${MAX_MEANINGFUL_SURFACE}). Inspect inbox.log directly or raise PROBE_RUNAWAY_BYTES if intentional.`);
  }
  if (REARM_MODE) {
    // Cycle-end probe found meaningful — log for next-turn agent review.
    // Do NOT block (the agent has already emitted user-facing text by the time
    // Stop hook fires); the rearm + log is the agent's catch surface next turn.
    console.error(`[probe] REARM mode: ${result.meaningful.length} meaningful inbound landed pre-close — surface on next turn`);
    const pid = spawnWatcher(result.total);
    if (pid) console.error(`[probe] watcher spawned pid=${pid} base=${result.total}`);
    // v2.5.8: ADVANCE cursor even when meaningful found in REARM mode.
    // Rationale (main-upstream hardening, 2026-06-01): without advance, the next
    // turn-close re-detects the SAME meaningful inbound and exit-2 blocks
    // indefinitely. By advancing, the meaningful is logged once (stderr → agent
    // sees on next turn), and subsequent probes start clean. The agent's
    // turn-start cursor-tail probe (§13.16.6 element 1) is the canonical
    // surface — Stop hook's job is to LOG + advance, not to block forever.
    writeCursor(result.total);
    process.exit(2);
  }
  // Pre-send mode: signal caller to inspect + decide (probe-then-inspect-or-abort).
  // Cursor NOT advanced here — the caller must surface + decide + advance after emit.
  process.exit(2);
}

console.error(`[probe] CLEAN — advance cursor to ${result.total} after emit`);
if (REARM_MODE) {
  // Cycle-end clean: rearm watcher unconditionally per §13.16.6 element 2.
  const pid = spawnWatcher(result.total);
  if (pid) console.error(`[probe] watcher spawned pid=${pid} base=${result.total}`);
  // Advance cursor (clean cycle-end → cursor matches inbox total).
  writeCursor(result.total);
}
process.exit(0);
