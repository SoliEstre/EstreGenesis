#!/usr/bin/env node
// scripts/join-local.cjs — v2.4.1 local 워커 합류 helper (reference impl).
// 사용: LOCAL_KEY_FILE=local-keys/<label>.key WS_AGENT_ID=<label> node scripts/join-local.cjs
// 메인이 KeyIssue{kind:'local', label, roleDescription} 발급 → 서버가 local-keys/<label>.key 에 키 저장
// → 본 스크립트가 파일에서 키 읽어 ws 합류. 키 자체는 외부 wire 안 노출.

'use strict';
const fs = require('fs');
const { stampRelayKey } = require('../relay-key.cjs');   // §13.13.2 회수 열쇠 부품 (공용)
const path = require('path');

const DIR = path.resolve(__dirname, '..');
const KEY_FILE = process.env.LOCAL_KEY_FILE;
const AGENT_ID = process.env.WS_AGENT_ID;
const HOST = process.env.COLLAB_HOST || ('localhost:' + (process.env.PORT || '7878'));
const AGENT_NAME = process.env.WS_AGENT_NAME || (AGENT_ID || 'local-worker');
const MAIN = process.env.WS_MAIN || 'main-agent';
const THREAD_ID = process.env.WS_THREAD_ID || AGENT_ID || 'local-worker';

if (!KEY_FILE) { console.error('[join-local] LOCAL_KEY_FILE env required'); process.exit(1); }
if (!AGENT_ID) { console.error('[join-local] WS_AGENT_ID env required'); process.exit(1); }

// single-instance 가드 (2026-06-07 incident 후속): 같은 agentId 로 중복 spawn 차단.
require('../single-instance.cjs').acquire(path.join(DIR, `.join-local.${AGENT_ID}.pid`), 'join-local');   // v2.4.82 — 확장자 명시 (watchdog 과 동일 클래스 — 리포트는 1곳이라 했으나 전수 grep 이 2곳째 검출)

const resolvedKeyFile = path.isAbsolute(KEY_FILE) ? KEY_FILE : path.join(DIR, KEY_FILE);
let key;
try { key = fs.readFileSync(resolvedKeyFile, 'utf8').trim(); }
catch (e) { console.error('[join-local] key file read fail:', resolvedKeyFile, String(e.message || e)); process.exit(1); }
if (!/^lk-[a-f0-9]+$/.test(key)) { console.error('[join-local] key file does not contain valid local key (lk- prefix)'); process.exit(1); }

const WS_URL = `ws://${HOST}/ws?key=${encodeURIComponent(key)}`;
const LOG = path.join(DIR, 'local-' + AGENT_ID + '.log');
const OUTBOX = process.env.LOCAL_OUTBOX || path.join(DIR, 'local-' + AGENT_ID + '-outbox.jsonl');   // v2.4.7: 워커 세션이 append → drain 송신 (gateway-client 패턴). 워커 emit 경로.
const OUT_CURSOR = path.join(DIR, '.local-' + AGENT_ID + '-outbox-cursor');

const ACK_KINDS = new Set(['Ack', 'AckProcessed', 'AckCumulative', 'Ping', 'Pong']);
const seenMsgIds = new Set();   // v2.4.132 §13.13.2 멱등 수신 — 재전달된 동일 msgId 의 본문 재기록 방지 (모듈 수명 = 재접속을 넘어 유지)   // §13.13 ack/ping류 — commitment-ack 대상 아님 (서버 pending 도 비추적)

// v2.4.58 — §13.26.3 provenance default: join-local 은 agent-spawned 합류 경로이므로,
// .echo-mode 마커에 이 agentId 항목이 없으면 { level:'on', provenance:'agent-spawned' } 로 시딩.
// 이미 있는 항목(인간 명시 토글 포함)은 절대 덮지 않음 — 명시 설정이 provenance 기본값에 항상 우선.
const ECHO_FILE = process.env.ECHO_MODE_FILE || path.join(DIR, '.echo-mode');
function echoEntry() {
  let m = {};
  try { m = JSON.parse(fs.readFileSync(ECHO_FILE, 'utf8')) || {}; } catch {}
  if (m[AGENT_ID] === undefined) {
    m[AGENT_ID] = { level: 'on', provenance: 'agent-spawned' };
    try { fs.writeFileSync(ECHO_FILE, JSON.stringify(m, null, 2)); log({ ev: 'echo-default-seeded', level: 'on' }); }
    catch (e) { log({ ev: 'echo-seed-fail', e: String(e.message || e) }); }
  }
  const e = m[AGENT_ID];
  return typeof e === 'string' ? { level: e } : { level: e.level || (e.on ? 'on' : 'off'), provenance: e.provenance };
}
let ws = null, connected = false, seq = 0, backoff = 500;
// ── 결정론적 거절의 재시도 간격 (2026-08-22 실측 후속) ─────────────────────────
// TCP/WS 연결은 **성립**하고 서버가 프레임으로 거절하는 경우(ConnectionRejected — key-expired 등),
// 종전 코드는 onopen 에서 backoff 를 500ms 로 되돌려서 지수 백오프가 매 사이클 무효화됐어요.
// 실측: 만료 키 하나로 **192,346회** 재접속(~2Hz), 거절 프레임이 워커 편지함에 그대로 쌓여
// 모델 턴 660+ 회가 «키 만료 지속» 서사에 태워졌어요. 결정론적 거절은 빨리 두드려서 풀리지
// 않아요 — 재시도의 유일한 목적은 «갱신되면 알아차리는 것» 이라 5분이면 충분해요.
// 수락 증거(거절이 아닌 서버 첫 프레임) 없이는 backoff 를 되돌리지 않아요.
const REJECT_RETRY_MS = +(process.env.JOIN_REJECT_RETRY_MS || 5 * 60 * 1000);
let accepted = false;          // 이번 연결이 «수락» 증거를 받았나 (open 은 증거가 아니에요)
let rejectedUntilRetry = 0;    // >now = 직전 연결이 서버 판정으로 거절됨 — 다음 재시도는 이 시각
function log(obj) { try { fs.appendFileSync(LOG, JSON.stringify({ t: Date.now(), ...obj }) + '\n'); } catch {} }
function send(type, extra) {
  if (!ws || ws.readyState !== 1) return false;
  const msg = Object.assign({ type, id: 'a-' + Date.now().toString(36) + '-' + (++seq), seq, threadId: THREAD_ID, timestamp: Date.now(), source: 'agent', agentId: AGENT_ID }, extra);
  // §13.13.2 — 회수 열쇠는 **소켓으로 나가는 길목에서 한 번**. 표면마다 손으로 넣으면 새 표면이
  //   생길 때마다 하나씩 빠지고, 빠진 자리는 오류가 아니라 «잘 보낸 것» 처럼 보여요(무음 유실).
  stampRelayKey(msg);
  try { ws.send(JSON.stringify(msg)); log({ ev: 'sent', name: msg.name || msg.type }); return true; } catch (e) { log({ ev: 'send-fail', e: String(e) }); return false; }
}
function loadOutCursor() { try { return parseInt(fs.readFileSync(OUT_CURSOR, 'utf8'), 10) || 0; } catch { return 0; } }
function saveOutCursor() { try { fs.writeFileSync(OUT_CURSOR, String(outCursor)); } catch {} }
let outCursor = loadOutCursor();
// 워커 세션(IDE/CLI 에이전트)이 OUTBOX 에 append 한 줄을 connected 이후 drain 송신.
// 줄 형식: 완성된 envelope (type/name/targetAgentId/value …) — agentId/seq/timestamp 는 send() 가 보강.
function drainOutbox() {
  if (!connected) return;
  let data = ''; try { data = fs.readFileSync(OUTBOX, 'utf8'); } catch { return; }
  const lines = data.split('\n').filter(Boolean);
  for (let i = outCursor; i < lines.length; i++) {
    let m; try { m = JSON.parse(lines[i]); } catch { log({ ev: 'outbox-parse-fail', line: i }); continue; }
    send(m.type || 'CUSTOM', m);   // send() 가 id/seq/threadId/timestamp/source/agentId 보강
  }
  if (outCursor !== lines.length) { outCursor = lines.length; saveOutCursor(); }
}

function connect() {
  console.log(`[join-local] connecting ${WS_URL.replace(key, '<key>')} (agentId=${AGENT_ID})`);
  ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    // backoff 를 여기서 되돌리지 않아요 — open 은 «TCP 가 붙었다» 지 «서버가 받아줬다» 가 아니에요.
    // 거절은 open **뒤에** 프레임으로 오니까, 여기서 리셋하면 지수 백오프가 매 사이클 무효화돼요
    // (그게 2Hz × 19만 회의 기제였어요). 리셋은 수락 증거를 받은 onmessage 쪽에서 해요.
    connected = true; accepted = false;
    send('HELLO', { clientId: AGENT_ID + '-1', agentName: AGENT_NAME, role: 'local', protocolVersion: '0.3', runId: null, capabilities: { inbound: ['UserPrompt', 'Command', 'Cancel', 'Delegate', 'OnboardAck', 'WorkerAck'], outbound: ['CUSTOM'] } });
    console.log(`[join-local] connected; HELLO sent (role=local). 메인(${MAIN}) Delegate 대기.`);
    log({ ev: 'connected' });
  };
  ws.onmessage = (e) => {   // v2.4.7: CUSTOM/A2A 는 full msg 로깅 (워커가 Delegate value 등 본문 read 가능), History/AgentList 노이즈는 요약
    let m; try { m = JSON.parse(e.data); } catch { return; }
    // ── 수락/거절 판정 — 인사보다 먼저예요 ──────────────────────────────────────
    // 거절 프레임은 일반 inbound 로 적지 않아요: 종전엔 ev:'inbound' 로 쌓여서 워커가 매 30건을
    //   모델 턴으로 집어 «키 만료 지속» 을 서사했어요. 진단은 ev:'rejected' 줄로 충분하고,
    //   해소 경로는 서버의 KeyExpiringSoon(3중 표면) + main 의 갱신 직무예요.
    if (!accepted && m && m.name === 'ConnectionRejected') {
      rejectedUntilRetry = Date.now() + REJECT_RETRY_MS;
      log({ ev: 'rejected', code: m.value && m.value.code, label: m.value && m.value.label, retryInMs: REJECT_RETRY_MS });
      console.error(`[join-local] 서버가 합류를 거절했어요 (${(m.value && m.value.code) || '?'}) — ${Math.round(REJECT_RETRY_MS / 60000)}분 뒤 재시도. 빨리 두드려서 풀리는 종류가 아니에요.`);
      return;
    }
    if (!accepted) {
      // 거절이 아닌 첫 서버 프레임 = 수락 증거. 여기서만 backoff 를 되돌리고, 인사도 여기서 해요 —
      // 종전엔 인사 2종이 open 직후 타이머로 나가서, 거절당하는 연결에서도 매 사이클 발사됐어요
      // (agenthello-sent 165,424회 실측).
      accepted = true; rejectedUntilRetry = 0; backoff = 500;
      setTimeout(() => { send('CUSTOM', { name: 'AgentHello', targetAgentId: MAIN, value: { agentId: AGENT_ID, env: 'local worker @ ' + DIR, role: 'local', idle: true, note: 'Local worker 합류 — Delegate 대기 standby.' } }); log({ ev: 'agenthello-sent', to: MAIN }); }, 100);
      // v2.4.58 — §13.26.4 EchoModeState 공지: (재)접속마다 멱등 재공지 (무타깃 브로드캐스트 —
      // commitment-ack 비대상). 대시보드가 에코 배지 + 채널 대화 승격에 사용.
      setTimeout(() => { const e2 = echoEntry(); send('CUSTOM', { name: 'EchoModeState', value: { agentId: AGENT_ID, level: e2.level, provenance: e2.provenance || 'agent-spawned' } }); log({ ev: 'echomodestate-sent', level: e2.level }); }, 300);
    }
    // v2.4.132 — §13.13.2 멱등 수신: 같은 msgId 재전달은 본문을 다시 적지 않아요(마커만). 단 ack 는
    //   중복에도 다시 보내요 — 재전달이 왔다는 건 서버가 내 ack 를 못 받았다는 뜻이라, 여기서 접으면
    //   재전달 루프를 스스로 연장해요.
    let isDup = false;
    if (m && m.msgId) {
      if (seenMsgIds.has(m.msgId)) isDup = true;
      else {
        seenMsgIds.add(m.msgId);
        if (seenMsgIds.size > 400) { const it = seenMsgIds.values(); for (let i = 0; i < 100; i++) seenMsgIds.delete(it.next().value); }
      }
    }

    if (isDup) log({ ev: 'inbound-dedup', msgId: m.msgId, name: m.name });
    else if (m.type === 'History' || m.type === 'AgentList' || m.type === 'SERVER_HELLO') log({ ev: 'inbound-meta', type: m.type });
    else log({ ev: 'inbound', msg: m });
    // v2.4.50 — §13.13.2 commitment-tier ack. 서버의 at-least-once pending 은 수신자의
    // AckProcessed{ackFor} 로만 clear 됨. 미회신 시 매 targeted CUSTOM 이 바운드 재전달(동일
    // msgId 3×) 후 발신자에게 RelayUnreachable{commitment-ack-absent} 로 종결되는 소음이
    // 매 위임마다 발생 (2026-07-04~11 실측). ack/ping 류는 서버 pending 비추적이라 제외(스톰 방지).
    // v2.4.132 — 발신 에이전트가 없어도 ack (서버/보드 유래 릴레이 프레임엔 agentId 가 없어요 —
    //   «수신처 있어야 ack» 술어가 그 부류를 조용히 면제해 3× 재전달로 실측). 무대상이면 칸을 아예
    //   싣지 않고 서버가 clear 후 소비해요.
    if (m && m.type === 'CUSTOM' && m.msgId && m.targetAgentId === AGENT_ID
        && m.source !== 'server' && !ACK_KINDS.has(m.name)) {
      const ack = { name: 'AckProcessed', value: { ackFor: m.msgId } };
      if (m.agentId) ack.targetAgentId = m.agentId;
      send('CUSTOM', ack);
      log({ ev: 'ackprocessed-sent', ackFor: m.msgId, to: m.agentId || '(server-consumed)' });
    }
  };
  ws.onerror = (err) => { log({ ev: 'ws-error', e: String((err && err.message) || err) }); };
  ws.onclose = (ev) => {
    connected = false; ws = null;
    // 거절당한 연결의 재시도는 지수 사다리가 아니라 REJECT_RETRY_MS 예요 — 사다리의 상한(8초)이
    // 거절 대기(5분)를 도로 깎아내리면 안 되니까, 두 경우를 섞지 않고 갈라요.
    const wait = rejectedUntilRetry > Date.now() ? Math.max(rejectedUntilRetry - Date.now(), 1000) : backoff;
    log({ ev: 'closed', code: ev && ev.code, retryInMs: wait });
    setTimeout(connect, wait);
    backoff = Math.min(backoff * 2, 8000);
  };
}

connect();
setInterval(drainOutbox, 1500);   // v2.4.7 워커 outbox drain
process.on('SIGINT', () => { try { ws && ws.close(); } catch {} process.exit(0); });
process.on('SIGTERM', () => { try { ws && ws.close(); } catch {} process.exit(0); });
