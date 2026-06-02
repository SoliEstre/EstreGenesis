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

function probe(cursor) {
  if (!fs.existsSync(INBOX)) {
    console.error(`[probe] inbox.log not found at ${INBOX} (cursor=${cursor})`);
    return { total: 0, newCount: 0, meaningful: [] };
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
    const name = o?.msg?.name || o?.name;
    if (name && ALLOWLIST.has(name)) {
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

// ----- main -----

const CURSOR = readCursor();
const result = probe(CURSOR);

console.error(`[probe] mode=${REARM_MODE ? 'rearm' : 'pre-send'} cursor=${CURSOR} total=${result.total} new=${result.newCount} meaningful=${result.meaningful.length}`);

if (result.meaningful.length > 0) {
  for (const m of result.meaningful) {
    const v = m.body?.msg?.value || m.body?.value || {};
    console.error(`  - line ${m.idx} ${m.name}: ${JSON.stringify(v).slice(0, 400)}`);
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
