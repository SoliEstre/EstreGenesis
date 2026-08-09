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
  // §13.13.3 (v2.4.97) — a bridge-coalesced utterance. The raw TEXT_MESSAGE_* frames carry no
  //   `name`, so every name-gated consumer dropped them silently: measured 51 targeted text
  //   frames sitting in an inbox having never produced a single wake. Recorded is not surfaced.
  //   The bridge re-appends the coalesced utterance as a named CUSTOM envelope precisely so this
  //   allowlist can see it; omit it here and the bridge half accomplishes nothing.
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
  // v2.4.129 — **Ping·Pong 을 뺐어요.** 회수 계층에서 제외되는 것과 각성에서 흡수되는 건 다른 질문인데
  //   한 목록에 같이 있었어요. Ping 은 「상대가 **정말로** 처리 중인가」를 묻는 프로브고, 이 배포엔
  //   그걸 대신 답해 줄 층이 **없어요**(브릿지도 서버도 자동 Pong 을 안 해요 — 실측). 그래서 이름으로
  //   흡수하면 §13.13.1 사다리 2단계(“Ping 을 쏴라”)가 구조적으로 응답 불가가 돼요. 설령 전송층이
  //   대신 답하더라도 그 Pong 은 «전송이 살아 있다» 만 증명해요 — 워커가 나흘 죽어 있는 동안 깨끗한
  //   ack 가 오던 그 상태예요. 프로브의 답은 모델 층에서 나와야 뜻이 있어요. Pong 도 같은 이유로
  //   각성 대상이에요(발신자가 기다리는 답이라, 흡수되면 「죽었다」로 오판해요).
  'SERVER_HELLO', 'HELLO', 'Heartbeat', 'ArtifactChunk',
  // v2.4.155 — **선언 계열은 각성이 아니에요.** 규격은 이 부류를 「기계 소비 전용·사람에겐 소음」으로
  //   정하고 Web Push 와 워커 pending 분류기에서 빼는데(§13.23.4 4-소비자 필터), **이 probe 가
  //   다섯 번째 소비자인데 목록에 없었어요.** 그래서 워커가 에코 모드를 재선언할 때마다 발신 전
  //   probe 가 BLOCK 을 걸고(요청이 하나도 안 담긴 프레임인데) 사람 눈에도 매 턴 그 줄이 떴어요
  //   — 실측 2026-08-09: EchoModeState 하나로 하루 20건. 잃는 신호는 0이에요: 선언엔 답할 것이
  //   없고, 값의 정본은 서버의 latest-wins persist 맵이라 필요하면 언제든 읽어요.
  //   워커 쪽 목록엔 EchoModeState 가 이미 있었어요 — 같은 개념에 손 목록이 둘이라 생긴 비대칭이에요.
  'EchoModeState', 'CommandManifest', 'OpsState', 'CapabilityManifest', 'CorporateChart', 'RoleState', 'SeatTelemetry',
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
  // v2.4.129 — **본문 검사는 ack 계열 이름에만.** 첫 판이 이 검사를 흡수 목록 *전체*에 걸었는데,
  //   그 목록엔 AgentHello·AgentList·History·ConnectionInfo 처럼 **본문이 있는 게 정상**인 이름들이
  //   있어요. 그래서 필터가 사실상 «본문 없는 것만 흡수» 로 뒤집혔고, 합류 인사 하나가 세션을
  //   깨우는 걸 라이브에서 봤어요(발효 30분 내). 규범이 겨눈 건 «전송 계층 이름을 응용 내용이
  //   타는 것» 이고 그건 ack 계열 셋뿐이에요 — 규격이 이름 댄 경우를 넘겨 적용한 게 원인이에요.
  const ACK_TIER_NAMES = new Set(['Ack', 'AckProcessed', 'AckCumulative']);
  if (eff && EXCLUDE_NAMES.has(eff) && !ACK_TIER_NAMES.has(eff)) return null;   // 그 밖의 흡수 이름은 본문과 무관하게 흡수
  if (eff && EXCLUDE_NAMES.has(eff)) {
    const v = msg.value;
    // 전송 칸 목록은 **실측으로 늘어난 목록**이에요 — 첫 판이 tier/nonce 를 빠뜨려서, 상대의
    //   순수 전송 ack(AckProcessed{ackFor,tier})가 «본문 있음» 으로 읽혀 깨웠어요(발효 몇 분 만에).
    //   그쪽 보고서에 그 이름이 적혀 있었는데 옮기지 않은 게 원인이라, 협업 상대의 봉투 형태를
    //   받을 때마다 여기를 훑는 게 규율이에요. 과잉 각성도 흡수만큼 고장이에요.
    const TRANSPORT_ACK_KEYS = new Set(['ackFor', 'kind', 'tier', 'nonce', 'from', 'recipients', 'offline', 'dedupHit', 'msgId', 'targetAgentId', 'attemptCount', 'lastError']);
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
// 레지스트리 탐색 순서: AGENT_SESSIONS_PATH env → <cwd> → CLAUDE_PROJECT_DIR → INBOX_PATH 상위 디렉토리들.
//   cwd 단독 의존은 함정 — 에이전트가 nested repo (예: inner 공개 repo) 로 cd 한 채 turn 이 끝나면
//   레지스트리를 못 찾아 registry=none 레거시 경로(라우팅 보호 없음)로 떨어져, main hook 이 워커 소유
//   inbox 의 cursor 를 전진시키는 cursor-steal 이 재발한다 (2026-06-12 실측). fallback 사슬이 이를 봉합.
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
function resolveRegistryPath() {
  if (process.env.AGENT_SESSIONS_PATH) return path.resolve(process.env.AGENT_SESSIONS_PATH);
  const candidates = [path.join(process.cwd(), '.agent-sessions.json')];
  if (process.env.CLAUDE_PROJECT_DIR) candidates.push(path.join(process.env.CLAUDE_PROJECT_DIR, '.agent-sessions.json'));
  // INBOX_PATH 상위 디렉토리 사슬 — 워크스페이스 루트가 cwd 와 무관하게 inbox 경로에 내포돼 있음
  if (process.env.INBOX_PATH) {
    let dir = path.dirname(path.resolve(process.env.INBOX_PATH));
    for (let i = 0; i < 4; i++) {
      candidates.push(path.join(dir, '.agent-sessions.json'));
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
  }
  for (const c of candidates) { try { if (fs.existsSync(c)) return c; } catch { /* keep looking */ } }
  return candidates[0]; // 전부 부재 — 기존 동작 보존 (cwd 기준, registry=none 로 보고됨)
}
const REGISTRY_PATH = resolveRegistryPath();
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
