#!/usr/bin/env node
'use strict';
/**
 * Constellation reference — WS gateway client (Node, deps-0)
 * 라이브 보드(:7878 /ws)에 "에이전트(primary)"로 붙는 최소 동작 예제. deps 0, node 내장 WebSocket(node ≥ 22).
 *
 * 목적: 외부 에이전트 런타임(tool-calling conversation loop 류)이 이 패턴을 자국어로 포팅하면
 *       "작업 중 사용자 프롬프트 주입(준실시간)"이 그대로 실현된다.
 *
 *   ① 연결 직후 HELLO 송신 → 서버가 primary agent 로 등록
 *   ② 작업 진행을 AG-UI outbound 이벤트(RUN/STEP/TEXT/TOOL)로 push (대시보드가 실시간 표시)
 *   ③ inbound(CUSTOM: UserPrompt/Command/Cancel)는 큐에 적재만,
 *      작업 루프의 safe point(여기선 turn 경계)에서 drain → 반영      ← "준실시간 주입"
 *   ④ Cancel/stop 은 interrupt 플래그로 협조적 중단(다음 safe point)
 *
 * 2축 동작 모델(gateway-client.eux @machine 정합):
 *   축 A — Connection lifecycle: DISCONNECTED → CONNECTING → CONNECTED_HELLO → READY (재연결 exp backoff).
 *   축 B — turn-held drain (15s/turn-경계 윈도우): inbox 큐 적재(transport) ↔ drainInbox safe point(application).
 *   ※ 이 어댑터는 transport 계층만 책임진다. *turn-held drain*(누적·배치 처리)은 호스트 application
 *     (이 파일에선 demoRun 의 safe point) 책임 — gateway/hermes/README.md §3 분담과 동일.
 *
 * Envelope convention:
 *   application 메시지 = `{type:'CUSTOM', name, value:{...}}` (wrap).
 *   transport framing  = `{type:'HELLO'|'SERVER_HELLO', ...}` (bare).
 *   (server.cjs `wscore.event('CUSTOM', {name, value})` builder 와 일관.)
 *
 * 매핑 가이드(WS-PROTOCOL.md §13 참조):
 *   UserPrompt   → 작업 루프의 inbound 큐 → 다음 turn 컨텍스트에 병합
 *   Command/pause·resume → 루프 pause 플래그
 *   Cancel(=UI stop) → interrupt 플래그(예: Hermes 의 set_interrupt())
 *
 * 실행:
 *   node ws-agent-client.cjs                 (기본 ws://127.0.0.1:7878/ws, 상시 데모 루프)
 *   WS_URL=ws://host:7878/ws LIVE_BOARD_WS_TOKEN=*** node ws-agent-client.cjs
 *   node ws-agent-client.cjs --once          (데모 1회 run 후 종료 — CI/스모크용)
 */

const path = require('path');
const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:7878/ws';
const TOKEN = process.env.LIVE_BOARD_WS_TOKEN || process.env.WS_TOKEN || '';
const AGENT_ID = process.env.WS_AGENT_ID || 'ref-agent';

// single-instance 가드 (2026-06-07 incident 후속): 같은 agentId 로 중복 spawn 차단.
// lock 파일은 caller 가 실행하는 디렉토리 기준 — agentId 별 분리로 다른 agentId 는 동시 운영 가능.
require('../../runtime/single-instance').acquire(
  path.join(process.cwd(), `.ws-agent-client.${AGENT_ID}.pid`),
  'ws-agent-client',
);
const UPSTREAM_KEY = process.env.WS_UPSTREAM_KEY || '';   // v0.3: 설정 시 upstream role 로 접속(메인 발급 키)
const ROLE = process.env.WS_ROLE || 'local';              // role 힌트(local/upstream) — 서버 최종 판정
const ONCE = process.argv.includes('--once');
// telemetry threadId 제외 가드 (gateway-client.eux derive.routable). 콤마 분리 환경변수.
const TELEMETRY_THREAD_IDS = new Set((process.env.WS_TELEMETRY_THREADS || '').split(',').map((s) => s.trim()).filter(Boolean));

// silent-disable 원칙(Constellation.md §4): optional auth 누락 시 의도와 다른 silent 폴백을 막기 위해 WARN 1줄.
if (!TOKEN && !UPSTREAM_KEY) console.warn('[ws] LIVE_BOARD_WS_TOKEN / WS_UPSTREAM_KEY 미설정 — 무인증 접속 (dev 기본). 의도면 무시, 아니면 환경변수 설정.');
let url = TOKEN ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(TOKEN)}` : WS_URL;
if (UPSTREAM_KEY) url += `${url.includes('?') ? '&' : '?'}upstreamKey=${encodeURIComponent(UPSTREAM_KEY)}`;

const THREAD_ID = 'ref-thread';
let ws = null;
let connected = false;
let backoff = 500;
let seq = 0;
let runSeq = 0;
let currentRunId = null;
let paused = false;
let interrupted = false;
let demoRunning = false;
const inbox = [];          // 수신 inbound 큐 (safe point 에서만 drain)

const now = () => Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function send(type, extra) {
  if (!ws || ws.readyState !== 1) return false;
  const msg = Object.assign(
    { type, id: 'a-' + now().toString(36) + '-' + (++seq), seq, runId: currentRunId, threadId: THREAD_ID, timestamp: now(), source: 'agent', agentId: AGENT_ID },
    extra,
  );
  try { ws.send(JSON.stringify(msg)); return true; } catch { return false; }
}

// ---- outbound 헬퍼 (AG-UI UPPER_SNAKE_CASE) ----
const out = {
  runStarted(runId) { currentRunId = runId; send('RUN_STARTED', { runId }); },
  runFinished(outcome) { send('RUN_FINISHED', { outcome: outcome || { type: 'success' } }); },
  runError(message, code) { send('RUN_ERROR', { message, code }); },
  step(name, done) { send(done ? 'STEP_FINISHED' : 'STEP_STARTED', { stepName: name }); },
  text(messageId, delta, phase) {
    if (phase === 'start') send('TEXT_MESSAGE_START', { messageId, role: 'assistant' });
    else if (phase === 'end') send('TEXT_MESSAGE_END', { messageId });
    else send('TEXT_MESSAGE_CONTENT', { messageId, delta });
  },
  say(textStr) { const m = 'm-' + now().toString(36) + Math.random().toString(36).slice(2, 5); out.text(m, '', 'start'); out.text(m, textStr); out.text(m, '', 'end'); },
  tool(id, name, result) { if (result === undefined) send('TOOL_CALL_START', { toolCallId: id, toolCallName: name }); else send('TOOL_CALL_RESULT', { toolCallId: id, content: result }); },
  accepted(promptId) { send('CUSTOM', { name: 'UserPromptAccepted', value: { promptId, mode: 'queued_for_next_safe_point' } }); },
  handoffReady(summary) { send('CUSTOM', { name: 'HandoffReady', value: { summary: summary || 'in-flight 정리 완료 — 메인 인계 준비됨' } }); },   // §13.3 메인 핸드오프 협조
  // A2A 응답 헬퍼 — inbound envelope 의 id/threadId/contextId/agentId 를 자동 echo
  // (gateway-client.eux derive.echoHeader). 서버 reply-window pairing 이 시간 heuristic 으로
  // 떨어지지 않게 host code 가 응답 보낼 때 send() 대신 이걸 사용 권장.
  replyTo(inbound, name, value) {
    return send('CUSTOM', {
      name,
      value: value || {},
      parentId: inbound.id,
      threadId: inbound.threadId || THREAD_ID,
      contextId: inbound.contextId || inbound.threadId || THREAD_ID,
      targetAgentId: inbound.agentId || inbound.source,
    });
  },
};

// ---- inbound 처리: 큐 적재만 (작업 루프를 직접 인터럽트하지 않음) ----
function onInbound(msg) {
  if (msg.type === 'SERVER_HELLO') { console.log('[server] SERVER_HELLO session=%s proto=%s', msg.sessionId, msg.protocolVersion); return; }
  // telemetry threadId/runId 제외 가드 (gateway-client.eux derive.routable) — host inbox/drain 오염 방지
  if (TELEMETRY_THREAD_IDS.size && (TELEMETRY_THREAD_IDS.has(msg.threadId) || TELEMETRY_THREAD_IDS.has(msg.runId))) return;
  if (msg.type !== 'CUSTOM') return;
  const name = msg.name, val = msg.value || {};
  if (name === 'Cancel') { interrupted = true; console.log('[inbound] Cancel/stop:', val.reason || ''); return; }   // 협조적 중단
  if (name === 'Command') {
    if (val.name === 'pause') paused = true;
    else if (val.name === 'resume') paused = false;
    console.log('[inbound] Command:', val.name);
    return;
  }
  if (name === 'UserPrompt') {
    console.log('[inbound] UserPrompt:', val.text);
    if (val.promptId) out.accepted(val.promptId);          // 수신 확인 → 대시보드에 ✓ Accepted
    inbox.push({ kind: 'prompt', text: val.text });        // safe point 에서 반영
  }
  if (name === 'HandoffRequested') {                       // §13.3 메인 인계 요청 → drain 후 HandoffReady
    console.log('[inbound] HandoffRequested → %s. in-flight 정리 후 HandoffReady 회신', val.to);
    out.handoffReady();                                    // (실 런타임은 진행 중 작업 drain 후 회신)
  }
}

// ---- safe point: turn 경계에서 큐 비우기 ----
function drainInbox() {
  const items = inbox.splice(0, inbox.length);
  return items.filter((x) => x.kind === 'prompt').map((x) => x.text);
}

// ---- 데모 작업 루프 (tool-calling conversation loop 모사) ----
async function demoRun() {
  if (demoRunning || !connected) return;
  demoRunning = true; interrupted = false;
  out.runStarted('run-' + (++runSeq));
  out.say('작업 시작 — **단계별**로 진행할게요. 예: `do_step_0` 호출 · *경과 보고* · [문서](https://example.com)');
  const tasks = ['프로젝트 컨텍스트 점검', '구현 계획 수립', '코드 작성', '테스트 실행', '결과 정리'];
  for (let i = 0; i < tasks.length; i++) {
    // ── safe point: 매 turn 경계에서 주입/중단/일시정지 확인 (= 준실시간 주입 지점) ──
    if (interrupted) { out.say('⏹ 중단 요청 수신 — 다음 safe point에서 정리하고 종료합니다.'); break; }
    while (paused) { await sleep(300); if (interrupted) break; }
    const injected = drainInbox();
    for (const text of injected) out.say(`🙋 사용자 주입 반영: "${text}" — 이후 단계 계획에 병합했어요.`);
    // ── 작업 단계 ──
    out.step(tasks[i], false);
    out.say(`${tasks[i]} 진행 중…`);
    out.tool('t' + i, `do_step_${i}`);
    await sleep(1500);
    out.tool('t' + i, undefined, `${tasks[i]} 완료`);
    out.step(tasks[i], true);
    await sleep(700);
  }
  out.runFinished(interrupted ? { type: 'cancelled', reason: 'stop 요청' } : { type: 'success' });
  demoRunning = false;
  if (ONCE) setTimeout(() => process.exit(0), 300);
}

// ---- 연결 + 자동 재연결(backoff) ----
function connect() {
  console.log('[ws] connecting', url);
  ws = new WebSocket(url);
  ws.onopen = () => {
    connected = true; backoff = 500;
    send('HELLO', {
      clientId: AGENT_ID + '-1', agentName: 'Reference (' + AGENT_ID + ')', role: UPSTREAM_KEY ? 'upstream' : ROLE, protocolVersion: '0.3', runId: null,
      capabilities: {
        inbound: ['UserPrompt', 'Command', 'Cancel', 'Priority'],
        outbound: ['RUN_STARTED', 'RUN_FINISHED', 'RUN_ERROR', 'STEP_STARTED', 'STEP_FINISHED', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END', 'TOOL_CALL_START', 'TOOL_CALL_RESULT', 'CUSTOM'],
      },
    });
    console.log('[ws] connected — HELLO sent as %s (primary agent)', AGENT_ID);
    demoRun();
  };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onInbound(m); };
  ws.onerror = () => {};
  ws.onclose = () => {
    connected = false; ws = null;
    if (ONCE) return;
    console.log('[ws] closed — reconnect in %dms', backoff);
    setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 8000);
  };
}

// 상시 모드: 데모 run 이 끝나면 잠시 후 재시작(언제든 프롬프트 주입 시연 가능)
if (!ONCE) setInterval(() => { if (connected && !demoRunning) demoRun(); }, 4000);

connect();
process.on('SIGINT', () => { console.log('\n[ws] bye'); try { ws && ws.close(); } catch {} process.exit(0); });
