#!/usr/bin/env node
// scripts/join-local.cjs — v2.4.1 local 워커 합류 helper (reference impl).
// 사용: LOCAL_KEY_FILE=local-keys/<label>.key WS_AGENT_ID=<label> node scripts/join-local.cjs
// 메인이 KeyIssue{kind:'local', label, roleDescription} 발급 → 서버가 local-keys/<label>.key 에 키 저장
// → 본 스크립트가 파일에서 키 읽어 ws 합류. 키 자체는 외부 wire 안 노출.

'use strict';
const fs = require('fs');
const redactUrl = (u) => String(u).replace(/([?&](?:key|peerKey|upstreamKey|collabKey|token)=)[^&#\s]*/gi, '$1<redacted>');   // v2.4.165 — 로그에 찍는 주소는 자격증명 파라미터를 **모든 출현**에서 가려요(첫 출현만 가리던 .replace(key) · 접두 자르기 대신)
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
// ── §13.25.13 발신은 **서버 판정** 뒤에만 (v2.4.166 — local-bridge.cjs 와 같은 규약) ─────────────
// 수락 증거(거절이 아닌 첫 서버 프레임)만으로 발신을 열면, 판정 전에 명단을 방송하는 서버 계열에서 그 방송이 곧
//   «증거» 가 돼요. 그러면 거절 직전 창에 AgentHello·EchoModeState·보류 줄·자동 ack 가 **거절될 연결로** 나가고,
//   보류 줄은 커서만 전진한 채 사라져요(대본 서버로 재현). 그래서 상태를 둘로 갈라요:
//     accepted — 거절도 SERVER_HELLO 도 아닌 첫 서버 프레임을 받았다. backoff 리셋은 여기서만.
//     admitted — 발신해도 된다. ConnectionInfo(서버가 HELLO 관문을 전부 통과시킨 **뒤에만** 보내요)를 받았거나,
//                그걸 안 보내는 서버 계열이면 수락이 ADMIT_HOLD_MS 동안 뒤집히지 않았다.
//   판정 전에 받은 프레임은 기록도 ack 도 하지 않고 쥐고 있다가, 판정이 나면 처리하고 거절이면 버려요(버린 수는 남겨요).
const ADMIT_HOLD_MS = +(process.env.JOIN_ADMIT_HOLD_MS || 3000);
const REFUSED_CLOSE_MS = 1000;   // 거절 뒤 서버가 안 닫으면 이만큼 기다렸다가 스스로 닫아요 — 거절된 소켓에 머무르면 재시도가 영영 안 와요
const HELD_MAX = 500;            // 판정 전 보류 상한 — 넘치면 가장 오래된 것부터 버려요(판정은 몇 초 안에 나요)
let accepted = false;          // 이번 연결이 «수락» 증거를 받았나 (open 은 증거가 아니에요)
let admitted = false;          // 이번 연결이 «발신 허가» 판정을 받았나 (위 설명)
let held = [];                 // 판정 전에 받은 프레임 (admit 때 순서대로 처리 · 거절이면 버림)
let refusedThisConn = false;   // 이 연결은 서버가 거절했다 — 닫힐 때까지 거절이에요(뒤이은 방송이 수락으로 뒤집지 못하게)
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
  if (!connected || !accepted || !admitted) return;   // 판정 전엔 비우지 않아요 — 거절될 연결로 보내면 커서만 전진하고 줄은 사라져요(수락 증거만으론 부족해요)
  let data = ''; try { data = fs.readFileSync(OUTBOX, 'utf8'); } catch { return; }
  const lines = data.split('\n').filter(Boolean);
  for (let i = outCursor; i < lines.length; i++) {
    let m; try { m = JSON.parse(lines[i]); } catch { log({ ev: 'outbox-parse-fail', line: i }); continue; }
    send(m.type || 'CUSTOM', m);   // send() 가 id/seq/threadId/timestamp/source/agentId 보강
  }
  if (outCursor !== lines.length) { outCursor = lines.length; saveOutCursor(); }
}

// 자기 공지 2종 — **발신 허가 뒤에만**. 종전엔 수락 증거에서 100/300ms 타이머로 나가서, 판정 전 방송 서버에선
//   거절될 연결로도 나갔어요(agenthello-sent 165,424회 실측은 그보다 앞선 open 직후 판이었어요).
function announce() {
  send('CUSTOM', { name: 'AgentHello', targetAgentId: MAIN, value: { agentId: AGENT_ID, env: 'local worker @ ' + DIR, role: 'local', idle: true, note: 'Local worker 합류 — Delegate 대기 standby.' } });
  log({ ev: 'agenthello-sent', to: MAIN });
  // v2.4.58 — §13.26.4 EchoModeState 공지: (재)접속마다 멱등 재공지 (무타깃 브로드캐스트 —
  // commitment-ack 비대상). 대시보드가 에코 배지 + 채널 대화 승격에 사용.
  const e2 = echoEntry();
  send('CUSTOM', { name: 'EchoModeState', value: { agentId: AGENT_ID, level: e2.level, provenance: e2.provenance || 'agent-spawned' } });
  log({ ev: 'echomodestate-sent', level: e2.level });
}
function dropHeld(why) {
  if (!held.length) return;
  log({ ev: 'held-dropped', n: held.length, why });   // 판정 없이 끝난 연결의 수신분 — 기록도 ack 도 하지 않고 버려요
  held = [];
}
// 발신 허가. 판정 전에 쥐고 있던 프레임을 순서대로 처리하고, 인사한 다음, 보류 줄을 비워요.
function admit(sock, why) {
  if (admitted || ws !== sock || refusedThisConn || !accepted) return;
  admitted = true;
  log({ ev: 'admitted', why, held: held.length });
  const q = held; held = [];
  for (const m of q) handleInbound(m);
  announce();
  drainOutbox();
}

// 판정이 난 연결의 수신 처리 — 기록 + commitment ack.
function handleInbound(m) {
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
}

function connect() {
  console.log(`[join-local] connecting ${redactUrl(WS_URL)} (agentId=${AGENT_ID})`);
  // 핸들러는 **자기 소켓**에만 반응해요 — 판정 유예·거절 뒤 닫기 타이머가 새 연결의 상태를 건드리지 않게.
  const sock = new WebSocket(WS_URL);
  ws = sock;
  sock.onopen = () => {
    if (ws !== sock) return;
    // backoff 를 여기서 되돌리지 않아요 — open 은 «TCP 가 붙었다» 지 «서버가 받아줬다» 가 아니에요.
    // 거절은 open **뒤에** 프레임으로 오니까, 여기서 리셋하면 지수 백오프가 매 사이클 무효화돼요
    // (그게 2Hz × 19만 회의 기제였어요). 리셋은 수락 증거를 받은 onmessage 쪽에서 해요.
    connected = true; accepted = false; admitted = false; refusedThisConn = false; held = [];
    send('HELLO', { clientId: AGENT_ID + '-1', agentName: AGENT_NAME, role: 'local', protocolVersion: '0.3', runId: null, capabilities: { inbound: ['UserPrompt', 'Command', 'Cancel', 'Delegate', 'OnboardAck', 'WorkerAck'], outbound: ['CUSTOM'] } });
    console.log(`[join-local] connected; HELLO sent (role=local). 서버 판정 대기 → 메인(${MAIN}) Delegate 대기.`);
    log({ ev: 'connected' });
  };
  sock.onmessage = (e) => {   // v2.4.7: CUSTOM/A2A 는 full msg 로깅 (워커가 Delegate value 등 본문 read 가능), History/AgentList 노이즈는 요약
    if (ws !== sock) return;
    let m; try { m = JSON.parse(e.data); } catch { return; }
    // ── 수락/거절 판정 — 인사보다 먼저예요 ──────────────────────────────────────
    // 거절 프레임은 일반 inbound 로 적지 않아요: 종전엔 ev:'inbound' 로 쌓여서 워커가 매 30건을
    //   모델 턴으로 집어 «키 만료 지속» 을 서사했어요. 진단은 ev:'rejected' 줄로 충분하고,
    //   해소 경로는 서버의 KeyExpiringSoon(3중 표면) + main 의 갱신 직무예요.
    // **거절은 언제 오든 거절이에요 — `!accepted` 로 가두면 안 돼요.** 참조 서버는 연결을 등록한
    //   직후 **인가 판정 전에** SERVER_HELLO 를 무조건 보내요(게이트 통과 지점은 HELLO 처리 뒤예요).
    //   그래서 아래 «거절이 아닌 첫 서버 프레임 = 수락» 이 SERVER_HELLO 로 켜지고, 뒤이어 오는
    //   ConnectionRejected 는 이 가드에 막혀 재시도 간격을 **아예 못 걸어요**. URL 키 만료만
    //   업그레이드 단계에서 미리 끊겨 우연히 안 걸렸을 뿐, 정체 불일치·키 요구·허용목록 거절은
    //   전부 이 방어 밖이었어요 — 한 사유만 막고 나머지엔 무효인 상태였어요 (2026-08-25 실측).
    // 서버가 낸 것만 거절이에요 — 서버는 에이전트가 보낸 같은 이름의 프레임도 중계해요(source 'agent').
    if (m && m.name === 'ConnectionRejected' && m.source === 'server') {
      refusedThisConn = true;
      accepted = false; admitted = false;                 // 수락으로 세었던 걸 되돌려요 (증거가 뒤집혔어요)
      rejectedUntilRetry = Date.now() + REJECT_RETRY_MS;
      log({ ev: 'rejected', code: m.value && m.value.code, label: m.value && m.value.label, retryInMs: REJECT_RETRY_MS });
      dropHeld('rejected');
      console.error(`[join-local] 서버가 합류를 거절했어요 (${(m.value && m.value.code) || '?'}) — ${Math.round(REJECT_RETRY_MS / 60000)}분 뒤 재시도. 빨리 두드려서 풀리는 종류가 아니에요.`);
      // 거절 뒤 서버가 안 닫으면 스스로 닫아요 — 닫혀야 재시도가 예약돼요(대기 간격은 위 rejectedUntilRetry 가 정해요).
      setTimeout(() => { if (ws === sock && sock.readyState === 1) { log({ ev: 'refused-local-close' }); try { sock.close(1000, 'refused'); } catch {} } }, REFUSED_CLOSE_MS);
      return;
    }
    // SERVER_HELLO 는 «붙었다» 지 «받아줬다» 가 아니에요 — 서버가 인가 전에 보내니 수락 증거에서 빼요.
    //   다만 **더 좁히지는 않아요**(허용목록 방식으로 «이 이름만 수락» 을 만들면, HELLO 뒤에 아무
    //   프레임도 안 보내는 서버 판에서 인사가 영영 안 나가 워커가 조용한 유령이 돼요).
    // 거절된 연결로 온 나머지는 쓰지 않아요 — 여기서 인사하거나 ack 하면 거절된 소켓으로 발신이 나가요.
    if (refusedThisConn) return;
    if (!accepted && m && m.type !== 'SERVER_HELLO') {
      // 거절이 아닌 첫 서버 프레임 = 수락 증거. 여기서만 backoff 를 되돌려요. 인사는 여기서 **하지 않아요** —
      //   판정 전에 명단을 방송하는 서버 계열에선 이 증거가 거절보다 먼저 와요. ConnectionInfo 를 안 보내는
      //   서버 계열 대비로, 수락이 ADMIT_HOLD_MS 동안 뒤집히지 않으면 그걸 판정으로 봐요.
      accepted = true; rejectedUntilRetry = 0; backoff = 500;
      setTimeout(() => admit(sock, 'accepted-held-' + ADMIT_HOLD_MS + 'ms'), ADMIT_HOLD_MS);
    }
    // SERVER_HELLO 는 서버 자신의 인사라(피어 내용도 ack 대상도 아니에요) 보류하지 않고 메타 한 줄로 바로 남겨요 —
    //   «판정 전에 서버와 말이 오갔다» 는 진단 흔적이라, 거절된 연결에서도 남아야 해요.
    if (m && m.type === 'SERVER_HELLO') { handleInbound(m); return; }
    if (!admitted) {
      // 판정 전 — 기록도 ack 도 미뤄요. 거절이면 통째로 버려요.
      held.push(m);
      if (held.length > HELD_MAX) { held.shift(); log({ ev: 'held-overflow', max: HELD_MAX }); }
      if (m && m.type === 'CUSTOM' && m.name === 'ConnectionInfo' && m.source === 'server') admit(sock, 'ConnectionInfo');
      return;
    }
    handleInbound(m);
  };
  // 재연결은 error·close **양쪽에서** 예약해요 — 일부 런타임(Node 22 / undici 6.27)은 error 뒤 close 를 안 내요
  //   (join-collab.cjs · local-bridge.cjs 와 같은 규약). 중복은 소켓 세대 확인이 흡수해요.
  sock.onerror = (err) => {
    if (ws !== sock) return;
    log({ ev: 'ws-error', e: String((err && err.message) || err) });
    try { if (sock.readyState === 1) sock.close(); } catch {}
    scheduleReconnect(sock, 'error', undefined);
  };
  sock.onclose = (ev) => { scheduleReconnect(sock, 'close', ev && ev.code); };
}

function scheduleReconnect(sock, why, code) {
  if (ws !== sock) return;   // 이 소켓의 끝은 한 번만 처리해요
  const wasAdmitted = admitted;
  connected = false; accepted = false; admitted = false; ws = null;
  dropHeld('closed-before-verdict');
  // 거절 프레임 없이 4003/4403 으로 닫혀도 서버 판정 거절이에요(프레임을 싣지 않던 옛 서버 · 프레임 유실).
  //   발신 허가 뒤의 4003(열쇠 폐기로 끊김)은 여기 안 걸려요 — 다음 접속이 거절 프레임으로 다시 말해 줘요.
  if (!wasAdmitted && (code === 4003 || code === 4403) && !(rejectedUntilRetry > Date.now())) {
    rejectedUntilRetry = Date.now() + REJECT_RETRY_MS;
    log({ ev: 'rejected', code: 'close-' + code, retryInMs: REJECT_RETRY_MS });
  }
  // 거절당한 연결의 재시도는 지수 사다리가 아니라 REJECT_RETRY_MS 예요 — 사다리의 상한(8초)이
  // 거절 대기(5분)를 도로 깎아내리면 안 되니까, 두 경우를 섞지 않고 갈라요.
  const wait = rejectedUntilRetry > Date.now() ? Math.max(rejectedUntilRetry - Date.now(), 1000) : backoff;
  log({ ev: 'closed', code, why, retryInMs: wait });
  setTimeout(connect, wait);
  backoff = Math.min(backoff * 2, 8000);
}

connect();
setInterval(drainOutbox, 1500);   // v2.4.7 워커 outbox drain
process.on('SIGINT', () => { try { ws && ws.close(); } catch {} process.exit(0); });
process.on('SIGTERM', () => { try { ws && ws.close(); } catch {} process.exit(0); });
