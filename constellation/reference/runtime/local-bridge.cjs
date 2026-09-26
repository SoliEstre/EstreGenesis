#!/usr/bin/env node
'use strict';
/**
 * local-bridge.cjs — turn-based local IDE 에이전트를 위한 WS 브릿지.
 *
 * "진짜 나"는 작업 루프에서 WS 소켓을 직접 들고 있지 못하므로(도구 호출 기반·턴 종료 시 멈춤),
 * 이 상주 프로세스가 대리한다:
 *   - 대시보드 '로컬 IDE' 채널 inbound(UserPrompt/Command/Cancel) → inbox.jsonl append
 *       → 에이전트가 작업 루프 safe point 에서 tail 로 읽어 반영
 *   - outbox.jsonl 새 줄 → WS outbound 송신
 *       → 에이전트가 진행/응답을 append 하면 대시보드 로컬 IDE 탭에 실시간 표시
 *
 * ⚠ 범위 = control/A2A bridge (2026-05-26 Codex 워커 피드백 D):
 *   보장 — ① WS 접속/HELLO ② A2A(AgentHello·OnboardAck·Delegate) ③ inbound 큐(UserPrompt/Command/Cancel → inbox)
 *          ④ 에이전트가 outbox 에 **명시적으로 append** 한 이벤트의 outbound.
 *   미보장 — 에이전트(IDE/런타임)의 **실제 tool call·실행을 자동 캡처하지 못한다**. 브릿지는 런타임 내부를 모르므로
 *            TOOL_CALL/RUN 이벤트는 **에이전트가 직접 outbox 로 미러링**해야 생긴다(자동 생성 아님).
 *   ⇒ 실시간 작업 모니터링이 필요하면: (a) 에이전트가 safe point 마다 진행을 outbox 로 명시 emit, 또는
 *      (b) 런타임 내 WS adapter(직접 WS 클라, examples/ws-agent-client.cjs 포팅)로 tool loop 를 직접 계측. (WS-PROTOCOL §13.11)
 * ⚠ 한계(준실시간): 에이전트가 '작업 중'(대화 턴 진행)일 때만 inbox 를 확인 → 유휴(턴 종료) 시 외부가
 *          에이전트를 깨우지 못해(self-wake watcher 로 다음 턴 유도) 그 사이 inbox 는 다음 턴에 처리. 브릿지는 큐만 유지.
 *
 * 실행: node local-bridge.cjs    (ws://127.0.0.1:7878/ws, agentId=main-agent 또는 env WS_AGENT_ID)
 * 파일: 같은 디렉토리의 inbox.jsonl(읽기) / outbox.jsonl(쓰기) — gitignore
 *
 * outbox 한 줄 형식(JSON, 평문도 허용=say):
 *   {"say":"마크다운 텍스트"}      → TEXT_MESSAGE_*  (대화 표시, md 렌더)
 *   {"run":"start"}               → RUN_STARTED
 *   {"run":"finish"}              → RUN_FINISHED
 *   {"step":"단계명"}             → STEP_STARTED
 *   {"tool":"도구명"}             → TOOL_CALL_START
 *   {"type":"...", ...}           → raw 이벤트 그대로
 */
const fs = require('fs');
const { stampRelayKey } = require('./relay-key.cjs');   // §13.13.2 회수 열쇠 부품 (공용)
const path = require('path');

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:7878/ws';
const TOKEN = process.env.LIVE_BOARD_WS_TOKEN || process.env.WS_TOKEN || '';
const AGENT_ID = process.env.WS_AGENT_ID || 'main-agent';   // generic default (server.cjs WS_PRIMARY_ID + dashboard WS_LOCAL 과 일관); 다운스트림 env 로 주입
const AGENT_NAME = process.env.WS_AGENT_NAME || 'Local IDE Agent';
const THREAD_ID = process.env.WS_THREAD_ID || (AGENT_ID === 'main-agent' ? 'main' : AGENT_ID);   // 메인 thread = 'main', 워커 thread = 자기 agentId
const DIR = __dirname;
// 기본은 메인 큐(__dirname). 워커는 WS_INBOX/WS_OUTBOX 로 별도 큐를 지정해 합류(메인과 파일 충돌 회피, §1.8 갭 보완).
const INBOX = process.env.WS_INBOX ? path.resolve(process.env.WS_INBOX) : path.join(DIR, 'inbox.jsonl');
const OUTBOX = process.env.WS_OUTBOX ? path.resolve(process.env.WS_OUTBOX) : path.join(DIR, 'outbox.jsonl');
const url0 = TOKEN ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(TOKEN)}` : WS_URL;
// §13.25.19 대기 중 갱신 요청 표지 (v2.4.167) — 주소에 열쇠가 실려 있으면 **항상** renew=1 을 함께 실어요.
//   «대기(standby)면 연장해 주세요» 는 늘 참인 요청이라, 켜 둔 보드(graceRenew)에선 만료 뒤 3일 안의 재접속이
//   운영자·에이전트 개입 없이 풀려요. 열쇠 없는 주소(자기 보드의 main)엔 연장할 게 없어서 안 실어요.
const URL_HAS_KEY = /[?&](?:key|peerKey|upstreamKey|collabKey)=/.test(url0);
const url = URL_HAS_KEY && !/[?&]renew=/.test(url0) ? url0 + '&renew=1' : url0;
const redactUrl = (u) => String(u).replace(/([?&](?:key|peerKey|upstreamKey|collabKey|token)=)[^&#\s]*/gi, '$1<redacted>');   // v2.4.165 — 로그에 찍는 주소는 자격증명 파라미터를 **모든 출현**에서 가려요(첫 출현만 가리던 .replace(key) · 접두 자르기 대신)

// --- single-instance guard (WS_AGENT_ID 당 브릿지 1개 — 중복 인스턴스 → flap 방지) ---
// 동일 agentId 브릿지가 2+ 이면 서버 register(HELLO) 의 prior-close + 각 브릿지 reconnect backoff 가
// 무한 flap(connect↔close)을 일으켜 ServerNotice 폭주 + 메인 연결 불안정(실측 incident 2026-05-30:
// 장시간 세션 + 재시작 orphan 누적으로 동일 agentId 브릿지 12개 → inbox 2538줄 노이즈).
// PID lockfile 로 단일화: 선행 생존 브릿지를 종료하고 락 획득, 프로세스 종료 시 해제(stale 락은 자가복구).
const LOCK = path.join(DIR, '.' + String(AGENT_ID).replace(/[^\w.-]/g, '_') + '-bridge.lock');
(function singleInstanceGuard() {
  try {
    if (fs.existsSync(LOCK)) {
      const prev = parseInt(String(fs.readFileSync(LOCK, 'utf8')).trim(), 10);
      if (prev && prev !== process.pid) {
        let alive = false;
        try { process.kill(prev, 0); alive = true; } catch {}   // signal 0 = 존재 확인(미생존이면 throw)
        if (alive) {
          console.warn('[bridge][WARN] 동일 agentId(' + AGENT_ID + ') 선행 브릿지 PID ' + prev + ' 생존 — 중복 flap 방지 위해 종료.');
          try { process.kill(prev); } catch {}
        }
      }
    }
    fs.writeFileSync(LOCK, String(process.pid));
  } catch (e) { console.warn('[bridge][WARN] single-instance lock 실패(무시):', String((e && e.message) || e)); }
})();
function releaseLock() { try { if (parseInt(String(fs.readFileSync(LOCK, 'utf8')).trim(), 10) === process.pid) fs.unlinkSync(LOCK); } catch {} }
process.on('exit', releaseLock);

let ws = null, connected = false, backoff = 500, seq = 0, runId = null;
// ── §13.25.13 열림 ≠ 수락 (v2.4.166 — scripts/join-collab.cjs · join-local.cjs 와 같은 규약) ──────────
// 서버는 소켓을 **연 다음에** 거절해요(ConnectionRejected + close 4003/4403). 종전엔 open 에서 backoff 를 되돌리고
//   online 을 공지하고 outbox 를 비웠어요. 그래서 열쇠가 만료되면 500ms 마다 재접속하고(채택자 실측 23분 2,609회),
//   거절 줄이 한 번씩 인박스에 적혀 워처가 그 속도로 깨고, 거절될 연결로 나간 발신은 커서만 전진한 채 사라졌어요.
//   상태는 셋으로 갈라요:
//     accepted  — 거절도 SERVER_HELLO 도 아닌 첫 서버 프레임을 받았다. backoff 리셋은 여기서만.
//     admitted  — 발신해도 된다. ConnectionInfo(서버가 HELLO 관문을 전부 통과시킨 **뒤에만** 보내요)를 받았거나,
//                 그걸 안 보내는 서버 계열이면 수락이 ADMIT_HOLD_MS 동안 뒤집히지 않았다. online 공지·outbox 는 여기서만.
//                 수락 증거만으로 열면 판정 전에 목록을 방송하는 서버 계열에서 거절 직전 창에 발신이 새요.
//     streak    — 같은 사유로 이어지는 거절 한 묶음. 인박스엔 묶음당 한 줄만 적고, 묶음은 수락이 STREAK_HOLD_MS 동안
//                 유지돼야 닫혀요(수락 증거만으로 닫으면 판정 전 방송 서버에서 재시도마다 새 묶음이 돼요).
const REJECT_RETRY_MS = +(process.env.BRIDGE_REJECT_RETRY_MS || process.env.JOIN_REJECT_RETRY_MS || 5 * 60 * 1000);
const ADMIT_HOLD_MS = +(process.env.BRIDGE_ADMIT_HOLD_MS || 3000);
const STREAK_HOLD_MS = +(process.env.BRIDGE_STREAK_HOLD_MS || 10000);
const REALERT_MS = +(process.env.BRIDGE_REFUSAL_REALERT_MS || 60 * 60 * 1000);   // 거절이 이어지면 이 간격으로 인박스에 다시 한 줄 — 한 번 알리고 영영 침묵하지 않게
// 휴면(dormant) 열쇠 거절의 재알림은 하루 — 푸는 사람이 보드 운영자라 한 시간마다 다시 알려도 풀리는 속도는 같고 소음만 늘어요.
const DORMANT_REALERT_MS = +(process.env.BRIDGE_DORMANT_REALERT_MS || 24 * 60 * 60 * 1000);
const OPERATOR_RENEW_ACTION = '보드 운영자가 🔑 창에서 연장하면 같은 키로 다시 붙어요 — 새 키는 필요 없어요';
// 열쇠 수명 단계(phase)를 실은 거절을 셋으로 갈라요 (§13.25.19):
//   quiet    — 대기(standby) + renewable:'request'. 다시 붙으면 저절로 풀려요(이 다리는 늘 갱신 요청 표지를 실어요) → 인박스에 안 적어요.
//   operator — 휴면(dormant), 또는 표지를 실었는데도 대기 거절인데 요청으로는 못 푼다는 경우(보드의 graceRenew 가 꺼짐) →
//              묶음당 한 줄 + 하루마다 재알림, 문구에 운영자 연장 안내.
//   legacy   — phase 없는 거절(옛 서버 · 다른 사유) → 종전대로.
function refusalClass(v) {
  if (!v || v.code !== 'key-expired' || !v.phase) return 'legacy';
  if (v.phase === 'standby' && v.renewable === 'request') return 'quiet';
  return 'operator';
}
const REFUSED_CLOSE_MS = 1500;   // 서버가 거절만 보내고 안 닫으면 이만큼 뒤 우리가 닫아요 — 거절된 소켓에 매달린 채 먹통이 되지 않게
let accepted = false, admitted = false;
let refusedThisConn = false;   // 이 연결은 서버가 거절했다 — 닫힐 때까지 거절이에요(뒤에 오는 방송이 수락으로 뒤집지 못하게)
let rejectedUntilRetry = 0;    // >now = 직전 연결이 서버 판정으로 거절됨 — 다음 재시도는 이 시각
let streak = null;             // { code, since, count, lastWritten }
let preVerdict = [];           // 판정 전에 받은 프레임 — 판정이 나면 처리, 거절되면 버려요(거절된 연결의 상태는 무효예요)
const PRE_VERDICT_MAX = 256;
const fmtMs = (ms) => ms >= 60000 ? Math.round(ms / 60000) + '분' : Math.round(ms / 1000) + '초';
// 거절 상태는 **디스크에도** 둬요. 감시자(watchdog)는 main 다리가 명단에 없으면 다시 띄우는데, 거절된 다리는 늘 명단에
//   없어서 명단이 바뀔 때마다 새 프로세스가 떴고, 메모리에만 있던 5분 대기와 묶음이 매번 0 이 됐어요(재접속 · 인박스 줄 반복).
const REFUSAL_FILE = path.join(DIR, '.' + String(AGENT_ID).replace(/[^\w.-]/g, '_') + '-bridge.refusal');
function saveRefusal() { try { if (streak || rejectedUntilRetry > Date.now()) fs.writeFileSync(REFUSAL_FILE, JSON.stringify({ until: rejectedUntilRetry, streak })); else fs.unlinkSync(REFUSAL_FILE); } catch {} }
(function loadRefusal() {
  try {
    const o = JSON.parse(fs.readFileSync(REFUSAL_FILE, 'utf8'));
    if (o && o.until > Date.now()) rejectedUntilRetry = o.until;
    if (o && o.streak && o.streak.code) streak = o.streak;
    if (rejectedUntilRetry || streak) console.log('[bridge] 직전 프로세스의 거절 상태를 이어받았어요 (' + (streak ? streak.code : '?') + (rejectedUntilRetry ? ' · ' + fmtMs(rejectedUntilRetry - Date.now()) + ' 뒤 재시도' : '') + ')');
  } catch {}
})();
function noteRefusal(v, source) {
  rejectedUntilRetry = Date.now() + REJECT_RETRY_MS;
  const code = (v && v.code) || '?';
  const cls = refusalClass(v);
  // 묶음 열쇠 = 사유 + 처방. 대기(quiet)에서 휴면(operator)으로 넘어가면 처방이 바뀌어서 새 묶음이에요 — 그때 처음으로 한 줄 적혀요.
  const skey = cls === 'legacy' ? code : code + ':' + cls;
  const fresh = !streak || (streak.key || streak.code) !== skey;   // 사유가 바뀌면 처방도 바뀌어서 새 묶음이에요
  if (fresh) streak = { code, key: skey, since: new Date().toISOString(), count: 0, lastWritten: 0 };
  streak.count++;
  if (cls === 'quiet') {
    // 대기 — 다시 붙을 때 실린 갱신 요청 표지로 서버가 연장해요. 에이전트·사람에게 알릴 일이 아니라 다리 로그에만 남겨요.
    console.log('[bridge] 열쇠가 대기(standby) 단계라 거절됐어요' + (v.label ? ' (' + v.label + ')' : '') + ' — ' + fmtMs(REJECT_RETRY_MS) + ' 뒤 갱신 요청을 싣고 다시 붙어요 · 인박스엔 안 적어요 · 이 묶음 ' + streak.count + '번째');
    saveRefusal();
    return;
  }
  const realert = cls === 'operator' ? DORMANT_REALERT_MS : REALERT_MS;
  console.error('[bridge] 서버가 합류를 거절했어요 (' + code + (v && v.phase ? ' · ' + v.phase : '') + (v && v.label ? ' · ' + v.label : '') + ') — ' + fmtMs(REJECT_RETRY_MS) + ' 뒤 재시도 · 이 묶음 ' + streak.count + '번째. 빨리 두드려서 풀리는 종류가 아니에요 — '
    + (cls === 'operator' ? OPERATOR_RENEW_ACTION + '.' : '열쇠 연장은 그 보드 운영자의 일이에요.'));
  // 에이전트에게 닿는 통로가 인박스뿐이라 **묶음당 한 번**은 적고, 거절이 이어지면 재알림 간격마다 한 번 더 적어요
  //   (같은 streakSince 라 깨우는 쪽은 같은 묶음으로 알아봐요). 아예 안 적으면 에이전트는 다리가 막힌 줄 몰라요.
  //   휴면 열쇠는 하루, 그 밖은 REALERT_MS 예요.
  if (fresh || Date.now() - (streak.lastWritten || 0) >= realert) {
    streak.lastWritten = Date.now();
    // targetAgentId = 자기 자신 — 이 줄은 다리가 **자기 에이전트에게** 쓰는 알림이에요. 턴 종료 probe 는 이름 목록에 없는 줄도
    //   «나에게 지목됨» 이면 올리는데(§13.16.9 합집합), 서버 거절 프레임엔 지목이 없어서 이 한 줄이 probe 에 안 보였어요.
    //   이름 목록에 넣지 않은 건, 줄마다 적는 옛 다리의 거절 폭주까지 probe 가 전부 올리게 되기 때문이에요.
    const bridge = { retryInMs: REJECT_RETRY_MS, streakSince: streak.since, attempts: streak.count, note: '같은 사유의 거절이 이어지는 동안은 ' + fmtMs(realert) + '마다 한 번만 적어요 — 회차는 다리 로그에 남아요' };
    if (cls === 'operator') bridge.action = OPERATOR_RENEW_ACTION;
    const rec = { at: new Date().toISOString(), name: 'ConnectionRejected', targetAgentId: AGENT_ID, value: v, source, bridge };
    try { fs.appendFileSync(INBOX, JSON.stringify(rec) + '\n'); } catch (e) { console.log('[bridge] inbox write fail', String(e)); }
  }
  saveRefusal();
}
function admit(sock, why) {
  if (admitted || ws !== sock || refusedThisConn || !accepted) return;
  admitted = true;
  console.log('[bridge] 수락 확인 (' + why + ') — online 공지 · outbox 발신 재개' + (preVerdict.length ? ' · 판정 전 수신 ' + preVerdict.length + '건 처리' : ''));
  send('CUSTOM', { name: 'ServerNotice', value: { kind: 'online', target: 'bridge', agentId: AGENT_ID, text: AGENT_ID + ' 브릿지 온라인(재연결)' } });   // 재연결 공지 → 모든 연결 broadcast (§재시작 공지) — 수락된 연결에서만
  const q = preVerdict; preVerdict = [];
  for (const m of q) if (m) onInbound(m);   // null = 상한 넘김 표지
}
// 재연결은 error·close **양쪽에서** 예약해요 (v2.4.83 adopter C10: Node 22/undici 6.27.0 은 error 뒤 close 를 안 내서
//   close 전용이면 재연결 체인이 조용히 끝나요 — 실측 2회·193초 무증상). 중복은 **소켓 세대**가 흡수해요: 먼저 온 쪽이
//   ws 를 비우면 나중 것은 «내 소켓이 아님» 으로 빠져요(종전 latch 는 늦게 도착한 옛 소켓 이벤트를 못 가렸어요).
function scheduleReconnect(sock, why, code) {
  if (ws !== sock) return;
  const wasAdmitted = admitted;
  connected = false; accepted = false; admitted = false; ws = null;
  // 거절 프레임 없이 4003/4403 으로 닫혀도 서버 판정 거절이에요(프레임을 싣지 않던 옛 서버 · 프레임 유실).
  //   발신 허가 뒤의 4003(열쇠 폐기로 끊김)은 여기 안 걸려요 — 다음 접속이 거절로 다시 말해 줘요.
  if (!wasAdmitted && (code === 4003 || code === 4403) && !(rejectedUntilRetry > Date.now())) noteRefusal({ code: 'close-' + code }, 'bridge');
  // 거절당한 연결의 재시도는 지수 사다리가 아니라 REJECT_RETRY_MS 예요 — 사다리 상한(8초)이 거절 대기를 깎지 않게.
  const wait = rejectedUntilRetry > Date.now() ? Math.max(rejectedUntilRetry - Date.now(), 1000) : backoff;
  console.log('[bridge] disconnected (' + why + (code ? ' ' + code : '') + '); reconnect in', wait, 'ms');
  setTimeout(connect, wait);
  backoff = Math.min(backoff * 2, 8000);
}
const now = () => Date.now();
// §13.13 A2A ack 계층 (client 측): 발신 msgId 부여(서버 delivered ack 대상·dedup 키) + 수신 dedup.
//   ping/pong·AckProcessed(이행) 는 에이전트 레벨 — bridge auto-pong 은 '연결 생존 ≠ turn 생존' false-alive 라 하지 않음.
const _BRIDGE_ACK_KINDS = new Set(['Ack', 'AckProcessed', 'AckCumulative', 'Ping', 'Pong']);

// §13.13.2 v0.4/v0.5 receiver-side dedup + inbox-append commitment.
//   v0.4: LRU 1024 entries / 1 hour TTL. Map(msgId → seen-ts). Map iteration is insertion-order
//         in JS so LRU eviction = delete first key. On duplicate: emit
//         `AckProcessed { ackFor, dedupHit: true }` immediately + discard body (do NOT append).
//   v0.5: on a successful inbox-append (non-duplicate, fresh msgId), emit
//         `AckProcessed { ackFor, tier: "delivered-persist" }` to the original sender on the
//         bridge's own authority — the inbox file IS the at-least-once anchor. This clears
//         the server's pending queue within milliseconds and eliminates the false-positive
//         RelayUnreachable{commitment-ack-absent} class. See onInbound below for the emit.
const _SEEN_LRU_MAX = 1024;
const _SEEN_TTL_MS = 60 * 60 * 1000;
const _seenMsgIds = new Map();   // msgId → ts (LRU + TTL evict per §13.13.2)
function _dedupCheck(msgId) {
  if (!msgId) return false;
  const now_ = Date.now();
  for (const [k, ts] of _seenMsgIds) { if (now_ - ts > _SEEN_TTL_MS) _seenMsgIds.delete(k); else break; }   // TTL evict from oldest (insertion-order)
  if (_seenMsgIds.has(msgId)) { _seenMsgIds.set(msgId, now_); return true; }   // refresh ts (LRU access)
  if (_seenMsgIds.size >= _SEEN_LRU_MAX) { const oldest = _seenMsgIds.keys().next().value; _seenMsgIds.delete(oldest); }
  _seenMsgIds.set(msgId, now_);
  return false;
}

// §13.13.3 (v2.4.96) — inbound text intake. A party that speaks without a `targetAgentId` used to
//   vanish here: `onInbound` returned on every non-CUSTOM frame, so an utterance the server had
//   relayed reached the board and stopped. The three-frame stream is coalesced into ONE inbox
//   record so the agent sees an utterance rather than fragments (one wake per utterance, matching
//   the server's own history aggregation). A CONTENT frame with no preceding START is appended
//   immediately as `partial` — a bridge that connects mid-utterance must not silently drop it,
//   which is the same store-immediately fallback the server's history buffer uses.
const _TEXT_FRAMES = new Set(['TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END']);
const _textBuf = new Map();       // messageId → { from, text, at }
const _TEXT_BUF_MAX = 64;         // bounded: a dropped END must not leak a buffer entry forever
function _textAppend(u) {
  const rec = { at: u.at, name: 'AgentText', value: { agentId: u.from, messageId: u.messageId, text: u.text, partial: u.partial || undefined }, source: u.source || 'agent' };
  try { fs.appendFileSync(INBOX, JSON.stringify(rec) + '\n'); } catch (e) { console.log('[bridge] inbox write fail', String(e)); }
  console.log('[bridge] inbound AgentText from', u.from, JSON.stringify(String(u.text).slice(0, 120)));
}
function _textInbound(m) {
  const key = String(m.messageId || m.id || '_');
  const from = m.agentId || m.source || 'unknown';
  if (m.type === 'TEXT_MESSAGE_START') {
    if (_textBuf.size >= _TEXT_BUF_MAX) _textBuf.delete(_textBuf.keys().next().value);   // evict oldest (insertion order)
    _textBuf.set(key, { from, text: '', at: new Date().toISOString() });
    return;
  }
  if (m.type === 'TEXT_MESSAGE_CONTENT') {
    const b = _textBuf.get(key);
    if (b) { b.text += String(m.delta || ''); return; }
    if (String(m.delta || '').trim()) _textAppend({ from, text: String(m.delta), at: new Date().toISOString(), messageId: key, partial: true, source: m.source });
    return;
  }
  const b = _textBuf.get(key);            // TEXT_MESSAGE_END
  if (!b) return;
  _textBuf.delete(key);
  if (!String(b.text).trim()) return;     // empty utterance = nothing said
  _textAppend({ from: b.from, text: b.text, at: b.at, messageId: key, source: m.source });
}

function send(type, extra) {
  if (!ws || ws.readyState !== 1) return false;
  // 판정 전엔 HELLO 말고 아무것도 안 나가요(§13.25.13) — 경로마다 가드를 두는 대신 소켓으로 나가는 길목에서 한 번.
  if (type !== 'HELLO' && !admitted) { console.warn('[bridge] 판정 전 발신 보류 —', type, (extra && extra.name) || ''); return false; }
  const msg = Object.assign({ type, id: 'l-' + now().toString(36) + '-' + (++seq), seq, runId, threadId: THREAD_ID, timestamp: now(), source: 'agent', agentId: AGENT_ID }, extra);
  // §13.13.2 — 회수 열쇠는 **소켓으로 나가는 길목에서 한 번**. 표면마다 손으로 넣으면 새 표면이
  //   생길 때마다 하나씩 빠지고, 빠진 자리는 오류가 아니라 «잘 보낸 것» 처럼 보여요(무음 유실).
  stampRelayKey(msg);
  try { ws.send(JSON.stringify(msg)); return true; } catch { return false; }
}

// ---- inbound → inbox.jsonl (에이전트가 읽음) ----
function onInbound(m) {
  if (m.type === 'SERVER_HELLO') { console.log('[bridge] SERVER_HELLO proto', m.protocolVersion); return; }
  if (_TEXT_FRAMES.has(m.type)) { _textInbound(m); return; }                                 // §13.13.3 — 텍스트 발화는 coalesce 후 AgentText 1건으로 적재
  if (m.type !== 'CUSTOM') return;
  if (m.name === 'AgentList' || m.name === 'History' || m.name === 'CloseChannel') return;   // server→board 용 — 브릿지 무시
  // §13.13.2 v0.4 receiver-side dedup with AckProcessed{dedupHit:true} emit.
  //   Phase 1 (v0.3): silently skip duplicates (set-add, no ack).
  //   Phase 2 (v0.4): emit `AckProcessed { ackFor, dedupHit: true }` so the sender's pending queue clears + body discard.
  if (m.msgId && _dedupCheck(m.msgId)) {
    console.log('[bridge] §13.13.2 dedup hit', m.msgId, '— emitting AckProcessed{dedupHit:true} + discard body');
    const srcAgent = m.agentId || (m.value && m.value.agentId);   // original sender (so server routes the AckProcessed back)
    if (srcAgent) send('CUSTOM', { name: 'AckProcessed', targetAgentId: srcAgent, value: { ackFor: m.msgId, dedupHit: true } });
    return;
  }
  const rec = { at: new Date().toISOString(), name: m.name, value: m.value, source: m.source };
  let appended = false;
  try { fs.appendFileSync(INBOX, JSON.stringify(rec) + '\n'); appended = true; } catch (e) { console.log('[bridge] inbox write fail', String(e)); }
  console.log('[bridge] inbound', m.name, JSON.stringify(m.value || {}));
  // §13.13.2 v0.5 — bridge inbox-append commitment.
  //   On successful inbox-append of a fresh (non-duplicate) inbound CUSTOM with a msgId, emit
  //   `AckProcessed { ackFor: msgId, tier: "delivered-persist" }` to the original sender on
  //   the bridge's own authority — the inbox file IS the at-least-once anchor, so the bridge
  //   has fulfilled its half of the commitment the moment the body is durably persisted.
  //   This clears the server's pending entry within milliseconds, eliminating the false-positive
  //   RelayUnreachable{commitment-ack-absent} class that v0.4 surfaced when the agent layer was
  //   idle / busy with unrelated work and never emitted an application-tier commitment ack.
  //   Skips _BRIDGE_ACK_KINDS (Ack / AckProcessed / Ping / Pong) — never ack-the-ack (would
  //   recursively burn msgIds + cancel the dedup chain). Application-tier outcome acks
  //   (Report / DONE / BLOCKED per §13.13) are preserved on the agent layer separately.
  //   GATE (v2.4.51, 2026-07-12 — default flipped to ON): the reference server runs the
  //   §13.13.2 redelivery scheduler *unconditionally* (setInterval on boot, no env gate), so
  //   an opt-in bridge ack meant the two reference halves were incoherent out of the box:
  //   every targeted msgId CUSTOM got redelivered 3× and closed with a false
  //   RelayUnreachable{commitment-ack-absent}. Measured on EG's own board — every delegation
  //   and every peer Report arrived in triplicate. The v2.5.19 opt-in was written for
  //   broker-forward workaround deployments whose server has no pending queue; those now
  //   opt *out* with RELAY_REDELIVERY=off. Server-with-redelivery is the default, so the
  //   commitment ack is the default.
  if (process.env.RELAY_REDELIVERY !== 'off' && appended && m.msgId && !_BRIDGE_ACK_KINDS.has(m.name)) {
    // v2.4.132 §13.13.2 — 발신 에이전트가 없어도 ack 는 보내요. 서버/보드 유래 릴레이 프레임
    //   (OperatorFeedback 등)엔 agentId 칸이 없는데, «수신처 있어야 ack» 술어는 그 부류를 조용히
    //   면제해서 3× 재전달로 실측됐어요. 수신처가 없으면 targetAgentId 를 아예 싣지 않고,
    //   서버가 무대상 약정 ack 를 clear 후 소비해요.
    const srcAgent = m.agentId || (m.value && m.value.agentId);
    const ack = { name: 'AckProcessed', value: { ackFor: m.msgId, tier: 'delivered-persist' } };
    if (srcAgent) ack.targetAgentId = srcAgent;
    send('CUSTOM', ack);
  }
  if (m.name === 'UserPrompt' && m.value && m.value.promptId) {
    send('CUSTOM', { name: 'UserPromptAccepted', value: { promptId: m.value.promptId, mode: 'queued_for_next_safe_point' } });
  }
  // §13.9 메인 주도 온보딩: AgentHello 수신 → 정형 OnboardAck 를 자동 회신(welcome/guide/modes/policy).
  //   위임(Delegate)은 자동화하지 않는다 — inbox 에 그대로 남겨 메인(PM)이 WORKLIST/STATE 보고 자율 판단.
  // v2.2.4 AgentHello broadened recognition (local-bridge.eux @behavior onInbound): name OR value?.type
  //   다운스트림 worker 의 첫 misread 방어 — value-nested 인식 시 WARN(silent-disable 원칙 정합).
  const _agentHelloByValue = m.name !== 'AgentHello' && m.value && m.value.type === 'AgentHello';
  if (_agentHelloByValue) console.warn('[bridge] WARN: AgentHello recognized from value.type (name 필드 누락) — client envelope shape mismatch');
  if (m.name === 'AgentHello' || _agentHelloByValue) {
    const wid = (m.value && m.value.agentId) || m.agentId;
    let modes = {};
    try { const sp = path.join(DIR, 'state.json'); delete require.cache[require.resolve(sp)]; modes = (require(sp).modes) || {}; } catch {}
    // §13.9 role 별 OnboardAck 분기 (2026-05-29): collab/upstream = 외부 프로젝트 메인/대등 협력자(peer) — 워커 아님.
    //   value.role = self-report hint (authoritative = server AgentList). 없으면 local(워커) 기본.
    const roleHint = (m.value && m.value.role) || 'local';
    const _peer = roleHint === 'collab' || roleHint === 'upstream';
    send('CUSTOM', {
      name: 'OnboardAck', targetAgentId: wid, contextId: m.contextId || m.threadId, parentId: m.id,
      value: {
        welcome: _peer
          ? ('협력 합류 환영 — 대등 협업(peer). 허브 메인(' + AGENT_ID + ')과 조율합니다.')
          : ('합류 환영 — 메인(' + AGENT_ID + ')이 온보딩합니다.'),
        guide: 'AGENT-CONNECT.md · WS-PROTOCOL.md',
        modes,
        role: roleHint,
        policy: _peer
          ? ('협력자(자기 프로젝트 메인) — 워커 아님. 자기 트랙 자율 진행, 허브 위임 대기 아님. 공유 계약·인터페이스 변경은 협업 요청/조율(_contracts·_questions). 무한대기는 선택(§1.8).')
          : ('워커 자율착수 금지 — 메인(PM)의 위임(Delegate) 대기. 무한대기 유지(§1.8).'),
        auto: true,
      },
    });
    console.log('[bridge] AgentHello from', wid, '(role=' + roleHint + ')', '→ auto OnboardAck', _peer ? '(peer 협력자 정책)' : '(worker 정책 · 위임은 메인 PM 판단)');
  }
}

// ---- outbox.jsonl 새 줄 → WS 송신 (에이전트가 append) ----
// init = EOF — pre-existing lines are skipped per local-bridge.eux @state.outboxCursor spec.
// 재spawn 시 outbox.jsonl 전체 replay 방지 (구 구현 outboxCursor=0 → bridge 재기동마다 누적 history 재송신 + §13.13.2 dedup 의존했음).
function initOutboxCursor() { try { return fs.statSync(OUTBOX).size; } catch { return 0; } }
let outboxCursor = initOutboxCursor();
function drainOutbox() {
  // v2.4.166 — 수락 전엔 비우지 않아요(§13.25.13): 거절될 연결로 보내면 커서만 전진하고 줄은 사라져요. 기준은 발신 허가(admitted).
  if (!connected || !accepted || !admitted) return;   // v2.4.84 — 미연결이면 outbox 를 아예 소비하지 않음 (커서 hold). 종전엔 미연결에도 읽어 커서를 EOF 로 전진시킨 뒤 emit 이 조용히 폐기 → 그 라인 영구 미발신·무증상(adopter 실측). 파일=durable 큐라 재연결 후 같은 커서부터 재개 = 유실 0, replay/중복 0 (in-memory 버퍼 아님 — hold-and-flush 의 순서/중복 위험 없음).
  let stat; try { stat = fs.statSync(OUTBOX); } catch { return; }   // 파일 없으면 대기
  if (stat.size < outboxCursor) outboxCursor = 0;                   // 파일 교체/축소 → 리셋
  if (stat.size <= outboxCursor) return;
  let chunk;
  try { const fd = fs.openSync(OUTBOX, 'r'); const buf = Buffer.alloc(stat.size - outboxCursor); fs.readSync(fd, buf, 0, buf.length, outboxCursor); fs.closeSync(fd); chunk = buf.toString('utf8'); }
  catch { return; }
  outboxCursor = stat.size;
  for (const line of chunk.split('\n')) { const s = line.trim(); if (s) emit(s); }
}
function emit(line) {
  if (!connected || !admitted) { console.warn('[bridge] emit while disconnected — dropped (drainOutbox 가드가 정상 경로를 막으므로 도달 불가여야 함):', String(line).slice(0, 80)); return; }   // v2.4.84 방어층 — 무증상 폐기 제거 (adopter 관측성 갭)
  let o; try { o = JSON.parse(line); } catch { o = { say: line }; }
  if (o.say != null) {
    const mid = 'm' + now().toString(36);
    send('TEXT_MESSAGE_START', { messageId: mid, role: 'assistant' });
    send('TEXT_MESSAGE_CONTENT', { messageId: mid, delta: String(o.say) });
    send('TEXT_MESSAGE_END', { messageId: mid });
  } else if (o.run === 'start') { runId = o.runId || ('run-' + now().toString(36)); send('RUN_STARTED', { runId }); }
  else if (o.run === 'finish') { send('RUN_FINISHED', { outcome: o.outcome || { type: 'success' } }); }
  else if (o.step) { send('STEP_STARTED', { stepName: o.step }); }
  else if (o.stepDone) { send('STEP_FINISHED', { stepName: o.stepDone }); }
  else if (o.tool) { send('TOOL_CALL_START', { toolCallId: 't' + now().toString(36), toolCallName: o.tool }); }
  else if (o.type) {
    if (o.type === 'CUSTOM' && o.msgId == null && o.name && !_BRIDGE_ACK_KINDS.has(o.name)) o.msgId = 'm-' + now().toString(36) + '-' + (++seq);   // §13.13 A2A application msgId (서버 delivered ack 대상·dedup 키), ack/ping류 제외
    send(o.type, o);
  }
}

// ---- 연결 + 자동 재연결 ----
function connect() {
  console.log('[bridge] connecting', redactUrl(url), 'as', AGENT_ID);
  // 핸들러는 **자기 소켓**에만 반응해요 — 늦게 도착한 옛 소켓의 이벤트가 새 연결 상태를 지우지 않게.
  const sock = new WebSocket(url);
  ws = sock;
  sock.onopen = () => {
    if (ws !== sock) return;
    // backoff 는 여기서 되돌리지 않고 online 도 여기서 공지하지 않아요 — open 은 «TCP 가 붙었다» 지 «서버가 받아줬다» 가 아니에요.
    connected = true; accepted = false; admitted = false; refusedThisConn = false; preVerdict = [];
    send('HELLO', Object.assign({
      clientId: AGENT_ID + '-bridge', agentName: AGENT_NAME, protocolVersion: '0.1', runId: null, pid: process.pid,
      capabilities: { inbound: ['UserPrompt', 'Command', 'Cancel', 'Priority'], outbound: ['RUN_STARTED', 'RUN_FINISHED', 'STEP_STARTED', 'STEP_FINISHED', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END', 'TOOL_CALL_START', 'CUSTOM'] },
    }, URL_HAS_KEY ? { renewRequest: true } : {}));   // §13.25.19 — HELLO 관문도 주소 열쇠를 다시 판정하니 본문에도 같은 표지를 실어요
    console.log('[bridge] connected — HELLO as', AGENT_ID, '(' + AGENT_NAME + ') · 서버 판정 대기');
    // [DISABLED 2026-06-01] Status auto-send removed — non-A2A intent (board 대화창 알림)이 server target-unspecified CUSTOM relay policy로 wsPrimaryAgent A2A inbox에도 들어가는 채널-혼선 발생. 재연결 broadcast 는 ServerNotice(online) 가 맡아요 — 수락 뒤 admit() 에서.
  };
  sock.onmessage = (e) => {
    if (ws !== sock) return;
    let m; try { m = JSON.parse(e.data); } catch { return; }
    // 거절은 언제 오든 거절이에요(서버는 SERVER_HELLO 를 인가 판정 **전에** 보내요). **서버가 낸 것만** 거절이에요 —
    //   서버는 에이전트가 보낸 같은 이름의 프레임도 중계하니(source 'agent'), 이름만 보면 아무 피어나 수락된 연결을 뒤집어요.
    if (m && m.name === 'ConnectionRejected' && m.source === 'server') {
      accepted = false; admitted = false; refusedThisConn = true;
      if (preVerdict.length) console.log('[bridge] 판정 전에 받은 ' + preVerdict.length + '건은 버려요 — 거절된 연결로 받은 상태는 무효예요');
      preVerdict = [];
      noteRefusal(m.value || {}, 'server');
      // 서버가 거절만 보내고 안 닫으면(닫힘 프레임 유실 · 닫지 않는 계열) 우리가 닫아요 — 안 그러면 거절된 소켓에 매달린 채
      //   수신은 버리고 발신은 막힌 먹통이 되고, 재연결도 안 걸려요(재연결은 close/error 에서만 예약돼요).
      setTimeout(() => { if (ws === sock && sock.readyState === 1) { console.log('[bridge] 거절 뒤 서버가 닫지 않아서 우리가 닫아요'); try { sock.close(); } catch {} } }, REFUSED_CLOSE_MS);
      return;
    }
    // 거절된 연결로 온 나머지는 쓰지 않아요 — 인박스 적재·자동 ack·OnboardAck 가 거절된 소켓으로 나가지 않게.
    if (refusedThisConn) return;
    // 거절이 아닌 첫 서버 프레임(SERVER_HELLO 제외) = 수락 증거. backoff 리셋은 여기서만.
    if (!accepted && m && m.type !== 'SERVER_HELLO') {
      accepted = true; rejectedUntilRetry = 0; backoff = 500;
      setTimeout(() => admit(sock, '수락 ' + fmtMs(ADMIT_HOLD_MS) + ' 유지'), ADMIT_HOLD_MS);   // ConnectionInfo 를 안 보내는 서버 계열 대비
      setTimeout(() => {
        if (ws !== sock || refusedThisConn || !streak) return;
        console.log('[bridge] 거절 묶음 종료 (' + streak.code + ' · ' + streak.count + '회, ' + streak.since + '부터) — 수락이 ' + fmtMs(STREAK_HOLD_MS) + ' 유지됐어요');
        streak = null; saveRefusal();
      }, STREAK_HOLD_MS);
    }
    if (m && m.type === 'CUSTOM' && m.name === 'ConnectionInfo' && m.source === 'server') admit(sock, 'ConnectionInfo');
    // 판정 전 수신은 보류해요 — 인박스 적재도 자동 ack·OnboardAck·UserPromptAccepted 도 판정 뒤에. 판정 전 명단을 방송하는
    //   서버 계열에선 그 창에 온 프레임에 ack 하면 곧 거절될 연결로 나가고, 인박스 줄은 재시도마다 워처를 깨워요.
    if (!admitted) {
      if (preVerdict.length < PRE_VERDICT_MAX) preVerdict.push(m);
      else if (preVerdict.length === PRE_VERDICT_MAX) { console.warn('[bridge] 판정 전 수신이 ' + PRE_VERDICT_MAX + '건을 넘었어요 — 이후는 버려요(서버가 재전달해요)'); preVerdict.push(null); }
      return;
    }
    onInbound(m);
  };
  sock.onerror = () => {   // v2.4.83 — error 경로 자체가 재연결을 스케줄 (close 미발화 런타임 대비); close() 는 OPEN 일 때만(CONNECTING 재진입 회피, adopter C10 (b))
    if (ws !== sock) return;
    console.warn('[bridge] ws error (readyState=' + sock.readyState + ') — scheduling reconnect');   // 무증상이 최악 성질이라 관측 1줄 필수
    try { if (sock.readyState === 1) sock.close(); } catch {}
    scheduleReconnect(sock, 'error', undefined);
  };
  sock.onclose = (ev) => { scheduleReconnect(sock, 'close', ev && ev.code); };
}

try { if (fs.existsSync(OUTBOX)) outboxCursor = fs.statSync(OUTBOX).size; } catch {}   // 기존 outbox 는 이미 처리분으로 간주
setInterval(drainOutbox, 500);
// 직전 프로세스가 거절 대기 중에 끝났으면(감시자 재기동 등) 그 대기를 지켜요 — 새 프로세스라고 곧바로 두드리지 않게.
if (rejectedUntilRetry > Date.now()) { console.log('[bridge] 거절 대기 이어받음 — ' + fmtMs(rejectedUntilRetry - Date.now()) + ' 뒤 첫 접속'); setTimeout(connect, rejectedUntilRetry - Date.now()); }
else connect();
// graceful shutdown — 종료 전 ServerNotice(offline) broadcast 로 연결 에이전트에 재시작 예고(§재시작 공지). SIGKILL(-Force)은 못 타므로 재시작 주체가 사전 ServerNotice(restarting)도 권장.
//   offline 은 **online 을 공지한 연결에서만** 보내요 — 거절됐거나 판정 전인 연결로 «종료» 를 알리면 공지 짝이 어긋나요.
function gracefulExit(sig) {
  console.log('\n[bridge]', sig, admitted ? '— ServerNotice offline → bye' : '— 수락 전 연결이라 offline 공지 없이 종료');
  if (admitted) { try { send('CUSTOM', { name: 'ServerNotice', value: { kind: 'offline', target: 'bridge', agentId: AGENT_ID, text: AGENT_ID + ' 브릿지 종료(재시작 예정)' } }); } catch {} }
  setTimeout(() => { try { ws && ws.close(); } catch {} process.exit(0); }, 300);   // send flush
}
process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));
