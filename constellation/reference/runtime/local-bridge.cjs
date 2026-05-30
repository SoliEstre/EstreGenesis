#!/usr/bin/env node
'use strict';
/**
 * local-bridge.cjs — turn-based local IDE 에이전트를 위한 WS 브릿지(레퍼런스 구현).
 *
 * 동기: turn-based(도구 호출 기반·턴 종료 시 idle) 로컬 IDE 에이전트는 작업 루프에서 WS 소켓을
 * 직접 쥐고 있지 못한다. 이 상주 프로세스가 transport 다리(raw gateway client) 역할을 대리한다:
 *   - 라이브보드/게이트웨이 inbound(UserPrompt/Command/Cancel/A2A) → inbox.jsonl append
 *       → 에이전트가 작업 루프 safe point 에서 tail 로 읽어 반영
 *   - outbox.jsonl 새 줄 → WS outbound 송신
 *       → 에이전트가 진행/응답을 append 하면 게이트웨이를 통해 보드/타 에이전트에 실시간 표시
 *
 * ▣ 2축 분담(gateway-client.eux 와 정합):
 *   Axis A — connection lifecycle: HELLO/재연결/backoff/graceful shutdown ← 본 브릿지 책임.
 *   Axis B — turn-held drain: inbox 소진·재처리·중복 방지·작업 재개 ← **IDE 에이전트(호스트) 책임**.
 *   브릿지는 transport 다리일 뿐이므로 메시지 의미 해석·재시도·dedupe 는 호스트에서 수행한다.
 *
 * ▣ 범위(보장/미보장):
 *   보장 — ① WS 접속/HELLO ② A2A(AgentHello·OnboardAck·Delegate) ③ inbound 큐(UserPrompt/Command/Cancel → inbox)
 *          ④ 에이전트가 outbox 에 **명시적으로 append** 한 이벤트의 outbound.
 *   미보장 — IDE/런타임의 **실제 tool call·실행을 자동 캡처하지 못한다**. 브릿지는 런타임 내부를 모르므로
 *            TOOL_CALL/RUN 이벤트는 **에이전트가 직접 outbox 로 미러링**해야 생긴다(자동 생성 아님).
 *   ⇒ 실시간 작업 모니터링이 필요하면: (a) 에이전트가 safe point 마다 진행을 outbox 로 명시 emit, 또는
 *      (b) 런타임 내 WS adapter(직접 WS 클라)로 tool loop 를 직접 계측.
 * ▣ 한계(준실시간): 에이전트가 '작업 중'(대화 턴 진행)일 때만 inbox 를 확인 → 유휴(턴 종료) 시 외부가
 *          에이전트를 깨우지 못해(self-wake-watcher 로 다음 턴 유도) 그 사이 inbox 는 다음 턴에 처리.
 *
 * ▣ Envelope CUSTOM-wrap convention:
 *   application 메시지 = {type:'CUSTOM', name, value}. transport framing(HELLO · RUN_* · TEXT_* · TOOL_*) = bare.
 *   본 브릿지는 inbound 에서 `type==='CUSTOM'` 만 inbox 에 적재하고(서버→보드 전용 CUSTOM 제외),
 *   outbound 에서는 outbox 한 줄을 bare framing 또는 CUSTOM 으로 자동 매핑한다(아래 emit 참조).
 *
 * ▣ telemetry filter: inbound 단계에서 server-internal CUSTOM(AgentList/History/CloseChannel) 을 drop.
 *   self-wake-watcher 의 NOISE blocklist(ServerNotice/Status/Heartbeat/Typing/OnboardAck …) 와 정합.
 *
 * ▣ silent-disable WARN: optional env(WS_INBOX/WS_OUTBOX/WS_TOKEN 등) 누락은 silent dead 가 아니라
 *   기동 시 WARN 한 줄을 발화한다(아래 startupWarn). self-wake-watcher.eux 의 derive 와 동일 정책.
 *
 * 실행: node local-bridge.cjs    (기본: ws://127.0.0.1:7878/ws, agentId=local-ide-agent)
 * 파일: 같은 디렉토리의 inbox.jsonl(읽기) / outbox.jsonl(쓰기) — gitignore 권장.
 *
 * outbox 한 줄 형식(JSON, 평문도 허용=say):
 *   {"say":"마크다운 텍스트"}      → TEXT_MESSAGE_*  (대화 표시, md 렌더)
 *   {"run":"start"}               → RUN_STARTED
 *   {"run":"finish"}              → RUN_FINISHED
 *   {"step":"단계명"}             → STEP_STARTED
 *   {"tool":"도구명"}             → TOOL_CALL_START
 *   {"type":"...", ...}           → raw 이벤트 그대로(bare framing)
 */
const fs = require('fs');
const path = require('path');

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:7878/ws';
const TOKEN = process.env.LIVE_BOARD_WS_TOKEN || process.env.WS_TOKEN || '';
const AGENT_ID = process.env.WS_AGENT_ID || 'local-ide-agent';
const AGENT_NAME = process.env.WS_AGENT_NAME || 'Local IDE Agent';
const THREAD_ID = process.env.WS_THREAD_ID || (AGENT_ID === 'local-ide-agent' ? 'local-ide' : AGENT_ID);
const DIR = __dirname;
// 기본은 단일 큐(__dirname). 멀티 에이전트 합류 시 WS_INBOX/WS_OUTBOX 로 별도 큐를 지정해 파일 충돌 회피.
const INBOX = process.env.WS_INBOX ? path.resolve(process.env.WS_INBOX) : path.join(DIR, 'inbox.jsonl');
const OUTBOX = process.env.WS_OUTBOX ? path.resolve(process.env.WS_OUTBOX) : path.join(DIR, 'outbox.jsonl');
const url = TOKEN ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(TOKEN)}` : WS_URL;

// silent-disable WARN — optional 설정 누락을 silent dead 가 아니라 한 줄 경고로 표면화.
function startupWarn() {
  if (!process.env.WS_TOKEN && !process.env.LIVE_BOARD_WS_TOKEN) {
    console.warn('[bridge][WARN] WS_TOKEN/LIVE_BOARD_WS_TOKEN 미지정 — 토큰 없이 접속 시도(게이트웨이가 거절할 수 있음).');
  }
  if (!process.env.WS_INBOX) {
    console.warn('[bridge][WARN] WS_INBOX 미지정 — 기본 경로 사용:', INBOX);
  }
  if (!process.env.WS_OUTBOX) {
    console.warn('[bridge][WARN] WS_OUTBOX 미지정 — 기본 경로 사용:', OUTBOX);
  }
  if (!process.env.WS_AGENT_ID) {
    console.warn('[bridge][WARN] WS_AGENT_ID 미지정 — 기본 agentId 사용:', AGENT_ID);
  }
}
startupWarn();

let ws = null, connected = false, backoff = 500, seq = 0, runId = null;
const now = () => Date.now();

function send(type, extra) {
  if (!ws || ws.readyState !== 1) return false;
  const msg = Object.assign({ type, id: 'l-' + now().toString(36) + '-' + (++seq), seq, runId, threadId: THREAD_ID, timestamp: now(), source: 'agent', agentId: AGENT_ID }, extra);
  try { ws.send(JSON.stringify(msg)); return true; } catch { return false; }
}

// echoHeader 헬퍼 — 짧은 응답(OnboardAck·UserPromptAccepted)을 인입 메시지의 context/parent 에 정렬.
// raw gateway 라 A2A 직접 응답은 거의 안 하지만 인입 식별자 echo 가 필요한 곳에서 사용.
function echoHeader(inMsg) {
  return {
    targetAgentId: (inMsg.value && inMsg.value.agentId) || inMsg.agentId,
    contextId: inMsg.contextId || inMsg.threadId,
    parentId: inMsg.id,
  };
}

// ---- inbound → inbox.jsonl (에이전트가 읽음) ----
function onInbound(m) {
  if (m.type === 'SERVER_HELLO') { console.log('[bridge] SERVER_HELLO proto', m.protocolVersion); return; }
  if (m.type !== 'CUSTOM') return;
  // telemetry filter — server→board 전용 CUSTOM 은 inbox 적재 전 drop(에이전트 깨우기 기준에서도 noise).
  if (m.name === 'AgentList' || m.name === 'History' || m.name === 'CloseChannel') return;
  const rec = { at: new Date().toISOString(), name: m.name, value: m.value, source: m.source };
  try { fs.appendFileSync(INBOX, JSON.stringify(rec) + '\n'); } catch (e) { console.log('[bridge] inbox write fail', String(e)); }
  console.log('[bridge] inbound', m.name, JSON.stringify(m.value || {}));
  if (m.name === 'UserPrompt' && m.value && m.value.promptId) {
    send('CUSTOM', Object.assign({ name: 'UserPromptAccepted', value: { promptId: m.value.promptId, mode: 'queued_for_next_safe_point' } }, echoHeader(m)));
  }
  // 메인 주도 온보딩(레퍼런스 정책): AgentHello 수신 → 정형 OnboardAck 자동 회신(welcome/guide/modes/policy).
  //   Delegate(위임)는 자동화하지 않는다 — inbox 에 그대로 남겨 host 가 워크리스트/state 보고 자율 판단.
  if (m.name === 'AgentHello') {
    const wid = (m.value && m.value.agentId) || m.agentId;
    let modes = {};
    try {
      const sp = path.join(DIR, 'state.json');   // 평탄 reference/runtime 레이아웃: bridge·state.json 동일 DIR
      delete require.cache[require.resolve(sp)];
      modes = (require(sp).modes) || {};
    } catch {
      console.warn('[bridge][WARN] state.json 로드 실패 — OnboardAck.modes 빈 객체로 회신.');
    }
    send('CUSTOM', Object.assign({
      name: 'OnboardAck',
      value: {
        welcome: '합류 환영 — 메인(' + AGENT_ID + ')이 온보딩합니다.',
        guide: 'AGENT-CONNECT.md · WS-PROTOCOL.md',
        modes,
        policy: '워커 자율착수 금지 — 메인의 위임(Delegate) 대기. 무한대기 유지.',
        auto: true,
      },
    }, echoHeader(m)));
    console.log('[bridge] AgentHello from', wid, '→ auto OnboardAck (위임은 host 판단 · inbox 보존)');
  }
}

// ---- outbox.jsonl 새 줄 → WS 송신 (에이전트가 append) ----
let outboxCursor = 0;
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
  else if (o.type) { send(o.type, o); }
}

// ---- 연결 + 자동 재연결 ----
function connect() {
  console.log('[bridge] connecting', url, 'as', AGENT_ID);
  ws = new WebSocket(url);
  ws.onopen = () => {
    connected = true; backoff = 500;
    send('HELLO', {
      clientId: AGENT_ID + '-bridge', agentName: AGENT_NAME, protocolVersion: '0.1', runId: null,
      capabilities: { inbound: ['UserPrompt', 'Command', 'Cancel', 'Priority'], outbound: ['RUN_STARTED', 'RUN_FINISHED', 'STEP_STARTED', 'STEP_FINISHED', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END', 'TOOL_CALL_START', 'CUSTOM'] },
    });
    console.log('[bridge] connected — HELLO as', AGENT_ID, '(' + AGENT_NAME + ')');
    send('CUSTOM', { name: 'Status', value: { text: '로컬 IDE 브릿지 온라인 — 에이전트 작업 중일 때 준실시간 응답' } });
    // 재연결 공지 → 모든 연결 broadcast (재시작 공지 정책).
    send('CUSTOM', { name: 'ServerNotice', value: { kind: 'online', target: 'bridge', agentId: AGENT_ID, text: AGENT_ID + ' 브릿지 온라인(재연결)' } });
  };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onInbound(m); };
  ws.onerror = () => {};
  ws.onclose = () => { connected = false; ws = null; console.log('[bridge] closed; reconnect in', backoff, 'ms'); setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 8000); };
}

try { if (fs.existsSync(OUTBOX)) outboxCursor = fs.statSync(OUTBOX).size; } catch {}   // 기존 outbox 는 이미 처리분으로 간주
setInterval(pollOutbox, 500);
connect();
// graceful shutdown — 종료 전 ServerNotice(offline) broadcast 로 연결 에이전트에 재시작 예고.
// SIGKILL(-Force)은 못 타므로 재시작 주체가 사전 ServerNotice(restarting)도 권장.
function gracefulExit(sig) {
  console.log('\n[bridge]', sig, '— ServerNotice offline → bye');
  try { send('CUSTOM', { name: 'ServerNotice', value: { kind: 'offline', target: 'bridge', agentId: AGENT_ID, text: AGENT_ID + ' 브릿지 종료(재시작 예정)' } }); } catch {}
  setTimeout(() => { try { ws && ws.close(); } catch {} process.exit(0); }, 300);   // send flush
}
process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));
