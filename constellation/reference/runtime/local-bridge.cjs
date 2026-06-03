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
const url = TOKEN ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(TOKEN)}` : WS_URL;

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

function send(type, extra) {
  if (!ws || ws.readyState !== 1) return false;
  const msg = Object.assign({ type, id: 'l-' + now().toString(36) + '-' + (++seq), seq, runId, threadId: THREAD_ID, timestamp: now(), source: 'agent', agentId: AGENT_ID }, extra);
  try { ws.send(JSON.stringify(msg)); return true; } catch { return false; }
}

// ---- inbound → inbox.jsonl (에이전트가 읽음) ----
function onInbound(m) {
  if (m.type === 'SERVER_HELLO') { console.log('[bridge] SERVER_HELLO proto', m.protocolVersion); return; }
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
  //   v2.5.19 GATE: only emit when RELAY_REDELIVERY=on. With redelivery disabled the server's
  //   pending queue is dormant (no entry to clear), so a delivered-persist emit is pure board
  //   noise. Mirrors main's bridge gate (process.env.RELAY_REDELIVERY === 'on'); deployments
  //   running the redelivery scheduler turn the gate on, deployments running broker-forward
  //   workaround mode leave it off and skip the emit cleanly.
  if (process.env.RELAY_REDELIVERY === 'on' && appended && m.msgId && !_BRIDGE_ACK_KINDS.has(m.name)) {
    const srcAgent = m.agentId || (m.value && m.value.agentId);
    if (srcAgent) {
      send('CUSTOM', { name: 'AckProcessed', targetAgentId: srcAgent, value: { ackFor: m.msgId, tier: 'delivered-persist' } });
    }
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
function pollOutbox() {
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
  if (!connected) return;
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
  console.log('[bridge] connecting', url, 'as', AGENT_ID);
  ws = new WebSocket(url);
  ws.onopen = () => {
    connected = true; backoff = 500;
    send('HELLO', {
      clientId: AGENT_ID + '-bridge', agentName: AGENT_NAME, protocolVersion: '0.1', runId: null, pid: process.pid,
      capabilities: { inbound: ['UserPrompt', 'Command', 'Cancel', 'Priority'], outbound: ['RUN_STARTED', 'RUN_FINISHED', 'STEP_STARTED', 'STEP_FINISHED', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END', 'TOOL_CALL_START', 'CUSTOM'] },
    });
    console.log('[bridge] connected — HELLO as', AGENT_ID, '(' + AGENT_NAME + ')');
    // [DISABLED 2026-06-01] Status auto-send removed — non-A2A intent (board 대화창 알림)이 server target-unspecified CUSTOM relay policy로 wsPrimaryAgent A2A inbox에도 들어가는 채널-혼선 발생. ServerNotice (아래 line) 로 재연결 broadcast 유지하고 Status auto-send는 비활성.
    // send('CUSTOM', { name: 'Status', value: { text: '로컬 IDE 브릿지 온라인 — 에이전트 작업 중일 때 준실시간 응답' } });
    send('CUSTOM', { name: 'ServerNotice', value: { kind: 'online', target: 'bridge', agentId: AGENT_ID, text: AGENT_ID + ' 브릿지 온라인(재연결)' } });   // 재연결 공지 → 모든 연결 broadcast (§재시작 공지)
  };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onInbound(m); };
  ws.onerror = () => {};
  ws.onclose = () => { connected = false; ws = null; console.log('[bridge] closed; reconnect in', backoff, 'ms'); setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 8000); };
}

try { if (fs.existsSync(OUTBOX)) outboxCursor = fs.statSync(OUTBOX).size; } catch {}   // 기존 outbox 는 이미 처리분으로 간주
setInterval(pollOutbox, 500);
connect();
// graceful shutdown — 종료 전 ServerNotice(offline) broadcast 로 연결 에이전트에 재시작 예고(§재시작 공지). SIGKILL(-Force)은 못 타므로 재시작 주체가 사전 ServerNotice(restarting)도 권장.
function gracefulExit(sig) {
  console.log('\n[bridge]', sig, '— ServerNotice offline → bye');
  try { send('CUSTOM', { name: 'ServerNotice', value: { kind: 'offline', target: 'bridge', agentId: AGENT_ID, text: AGENT_ID + ' 브릿지 종료(재시작 예정)' } }); } catch {}
  setTimeout(() => { try { ws && ws.close(); } catch {} process.exit(0); }, 300);   // send flush
}
process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));
