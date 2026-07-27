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
  // v2.6.25 — 전달-실패와 선택-요청이 여기 없었어요. **드러난 방식이 성격을 말해줘요**: 어댑터가
  //   «회신이 오지 않았다» 고 알려줘서 찾았고, 그 시점에 서버가 이미 보낸
  //   `RelayUnreachable{msgId,targetAgentId,attemptCount,lastError}` 22건이 수신함에 **읽히지 않은 채**
  //   쌓여 있었어요. 내 발신이 끝내 닿지 않았다는 통지는 인바운드 중 **가장 조치 가능한** 것인데
  //   «의미 없음» 으로 걸러졌어요 — 통지가 와도 읽는 경로가 없으면 통지가 없는 것과 같아요.
  //   `Reply`(와이어 실측 0건)는 있는데 실제로 오는 `Response`(3건)가 빠져 있던 것도 같은 계열이에요:
  //   아무도 보내지 않는 이름을 지키는 가드는 작동하는 가드와 구분이 안 돼요.
  'RelayUnreachable',
  'Response',
  'SelectionPrompt', 'SelectionExpired',
  // v2.6.26 — 직전 컷(v2.6.25)이 4종만 넣고 **후보를 남겼어요.** 그 결과가 같은 세션 안에서 나왔어요:
  //   어댑터의 `SpecGapReport`(와이어 실측 11건 — 스펙 갭 리포트, 제품 제안 포함)가 걸러져서,
  //   미처리 제안이 수신함에 있는 동안 turn-end probe 는 «의미 있는 것 없음» 이라고 답했어요.
  //   불완전한 수정은 고치지 않은 것과 같은 자리에서 다시 물어요. 아래는 전부 **와이어 실측 근거**예요.
  'SpecGapReport', 'SpecGapCode',     // 어댑터가 보고하는 스펙 갭 + 그에 딸린 코드 근거
  'Proposal',                          // 피어가 우리에게 내는 제안
  'ReturnPackage',                     // 위탁 산출물의 반환
  'PhaseBScopeShare',                  // 협업 단계의 범위 공유
  'TaskEnvelope',                      // 우리에게 넘어온 작업 봉투
  // v2.5.20 extensions — generic coordination + attachment / chunked-transfer anchors
  'Request', 'Reply',
  'Attachment',
  // §13.13.3 (v2.4.97) — a bridge-coalesced utterance (see the reference copy for the measurement).
  'AgentText',
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
