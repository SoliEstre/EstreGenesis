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

// ── §13.16.9 CLASSIFY BEGIN — 사본 간 **바이트 동일**해야 해요 (verify-meaningful-set-parity 가 단정) ──
// 열거된 이름만 의미 있다고 보면 어댑터가 발명한 이름은 «없는 메시지» 예요. 실측: hermes 의
// `Handshake` 1건이 실제 작업 요청인데 걸러졌고, 방에서 우리를 이름으로 호명한 `Say` 8건도
// 보이지 않았어요. 그래서 판정은 **합집합**이에요 — 열거는 하한으로 남고, 그 위에
// «나에게 왔고 전송/telemetry 가 아니면 의미 있음» 이 더해져요.
//
// 대체가 아니라 합집합인 게 핵심이에요. 반전만으로 갈아치우면 60일 창 실측 **-16%** 였고, 잃는 것
// 안에 `Report` 148 · `UserPrompt` 57 · `RelayUnreachable` 22 가 있었어요 — 마지막 것은
// v2.6.25 가 정확히 그걸 잃지 않으려고 넣은 이름이에요.
//
// 「에이전트-작성」 술어는 쓰지 않아요. 와이어의 `source` 는 `agent` 만이 아니라 `board`(사용자
// 발화 — `UserPrompt`) · `server`(전달 실패 — `RelayUnreachable`) 로도 와요. 그 둘이 **가장 조치
// 가능한 작성자**예요. 기준은 누가 썼는지가 아니라 **나에게 온 것인지**예요.
//
// 실측 비용: 60.2일 창에서 +10건 (하루 0.17건, +2%) — 9건이 실질. 수치 문턱은 두지 않아요:
// 재보지 않은 값을 규칙에 넣으면 그게 계약이 돼요 (문턱 「회당 10건」은 그렇게 만들려던 값이었어요).
const SELF_AGENT_ID = process.env.SELF_AGENT_ID || process.env.CONSTELLATION_AGENT_ID || null;
const EXCLUDE_NAMES = new Set([
  'Ack', 'AckProcessed', 'AgentHello', 'AgentList', 'History', 'ConnectionInfo',
  'SERVER_HELLO', 'HELLO', 'Heartbeat', 'Ping', 'Pong', 'ArtifactChunk',
  'StateSync', 'StateUpdate', 'BoardState', 'CursorAdvance', 'Presence',
  'OnboardAck',            // 합류 환영 + 가이드 + 모드 선언 (실측 139건, 전부 우리 앞) — 의례
  'UserPromptAccepted',    // promptId + 큐 모드만 (실측 19건) — telemetry
]);
const EXCLUDE_TYPE_PREFIX = ['TEXT_MESSAGE_', 'RUN_', 'STEP_', 'TOOL_CALL_'];
let _selfIdentityWarned = false;
function classifyMeaningful(o) {
  // v2.5.44 자기 발신 에코 제외 — 브릿지는 outbound(ev:"sent")도 같은 파일에 적어요. 사본 두 벌에
  //   이 게이트가 **없었고**(플러그인 사본 포함), 이름 집합만 대조하던 검사는 그걸 통과시켰어요.
  if (o && o.ev === 'sent') return null;
  const msg = (o && o.msg) || o || {};
  // v2.5.20 이중 봉투 — 바깥 name 에 리터럴 "CUSTOM", 실제 MessageName 이 value.name 에 오는 형태.
  const outerName = msg.name || null;
  const innerName = (msg.value && msg.value.name) || null;
  const listed = (outerName && ALLOWLIST.has(outerName)) ? outerName
               : (innerName && ALLOWLIST.has(innerName) && (outerName === 'CUSTOM' || !outerName)) ? innerName
               : null;
  if (listed) return { name: listed, why: 'listed' };
  // 정체를 모르면 «나에게 왔는가» 를 판정할 수 없어요. 그때는 두 번째 가지를 끄되 **조용히 끄지
  //   않아요** — 관측 불가를 통과로 세지 않는 규율의 런타임 판이에요.
  if (!SELF_AGENT_ID) {
    if (!_selfIdentityWarned) {
      _selfIdentityWarned = true;
      console.error('[probe] NOTE: SELF_AGENT_ID / CONSTELLATION_AGENT_ID unset — the addressed-envelope branch is INACTIVE, so only enumerated names can wake this agent. Set it to enable §13.16.9 union classification.');
    }
    return null;
  }
  // 지목은 그 자체로 근거. 1:1 지목과 방 안의 호명(value.addressee[]) 둘 다 — 방 발화는
  //   targetAgentId 만 보면 안 보여요.
  const addressed = msg.targetAgentId === SELF_AGENT_ID
    || (msg.value && Array.isArray(msg.value.addressee) && msg.value.addressee.includes(SELF_AGENT_ID));
  if (!addressed) return null;
  const eff = (outerName && outerName !== 'CUSTOM') ? outerName : (innerName || outerName);
  // v2.4.128 — **본문 실린 ack 는 흡수하지 않아요.** ack 이름을 이름만 보고 버리면, 그 봉투에
  //   실질 회신을 담아 보낸 상대의 말이 조용히 사라지고 커서가 그 위로 전진해요(채택자 실측
  //   2026-08-01: 재기동 종결 보고가 그렇게 삼켜졌고, 커서 점프를 눈으로 본 관례가 겨우 잡았어요).
  //   뿌리는 §13.13 의 3계층이 **wire 에서 같은 이름을 쓰는 것**이에요 — 전송 계층 ack 와
  //   응용 계층 회신이 둘 다 'Ack' 로 와요. 그래서 이름이 아니라 **본문 모양**으로 갈라요:
  //   전송 ack 는 정해진 몇 칸만 채우고, 그 밖의 칸이 있으면 사람이 읽으라고 쓴 글이에요.
  //   (발신 쪽 규율은 반대 방향이에요 — 실질 회신을 ack 이름에 실지 말 것. ack 계열은 회수
  //    계층에서 **구조적으로 제외**돼서(§13.13.2) 재전달도 미전달 통지도 없거든요.)
  if (eff && EXCLUDE_NAMES.has(eff)) {
    const v = msg.value;
    const TRANSPORT_ACK_KEYS = new Set(['ackFor', 'kind', 'from', 'recipients', 'offline', 'dedupHit', 'msgId', 'targetAgentId', 'attemptCount', 'lastError']);
    const bodyKeys = (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v) : [];
    const carriesBody = bodyKeys.some((k) => !TRANSPORT_ACK_KEYS.has(k));
    if (!carriesBody) return null;
    return { name: eff, why: 'ack-with-body' };
  }
  if (msg.type && EXCLUDE_TYPE_PREFIX.some((p) => String(msg.type).startsWith(p))) return null;
  return { name: eff || ('(unnamed type=' + (msg.type || '?') + ')'), why: 'addressed' };
}
// ── §13.16.9 CLASSIFY END ──

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
    const hit = classifyMeaningful(o);
    if (hit) {
      meaningful.push({ idx: cursor + i + 1, name: hit.name, why: hit.why, body: o });
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
