#!/usr/bin/env node
'use strict';
/**
 * scripts/join-collab.cjs — collab / peer 합류 레퍼런스 클라이언트 (deps-0, v2.4.107).
 *
 * 왜 있나: `join-local.cjs` 는 **local 워커용** 레퍼런스인데, **collab/peer 합류용은 없었어요.**
 * 그래서 어댑터는 스펙만 보고 클라이언트를 손으로 만들었고, 채택 사례 하나에서 **프로토콜 계약
 * 5개를 동시에 빠뜨렸습니다.** 빠뜨린 것과 실제 결과(전부 실측):
 *
 *   1. `AckProcessed` (commitment-tier) 미회신
 *        → 그 에이전트 앞 targeted 메시지가 **전부** 3회 재전달 후
 *          `RelayUnreachable{commitment-ack-absent}` 로 종결. 수신은 됐는데 발신자에겐 미전달.
 *   2. HELLO 의 `clientId`/`agentName`/`protocolVersion`/`capabilities` 누락 → 정상 참가자 미등재.
 *   3. `AgentHello` 자기소개 생략 — 스펙의 «재방송 노이즈 금지» 문구를 **반대로 읽어서** 의도적으로
 *        뺐어요. 문구가 반대로 읽힐 수 있으면 그건 읽은 쪽 잘못이 아니라 문구의 실패예요.
 *   4. single-instance 가드 없음 → 상위 셸이 죽고 node 자식이 고아로 남아, 같은 agentId 다수가
 *        **초당 1회 서로 kick** 하는 폭주(로그 1,379줄/수분, 운용자 개입 필요).
 *   5. 수신 History 를 저장소에 그대로 append → inbox **594MB**(1,425줄 중 1,414줄이 History),
 *        도구가 파일을 못 읽는 지경.
 *
 * `join-local.cjs` 에는 1·2·3·4 가 이미 있었어요. **그 파일을 늦게 발견한 게 유일한 차이**였습니다.
 * 그래서 이 파일은 새 발명이 아니라 **local 레퍼런스의 계약을 collab/peer 표면으로 옮긴 것**이고,
 * 5·6·7·8(아래)을 더한 것이에요.
 *
 * 사용:
 *   WS_AGENT_ID=my-agent COLLAB_KEY=ck-… COLLAB_HOST=host:27878 node scripts/join-collab.cjs
 *   WS_AGENT_ID=my-agent COLLAB_KEY_FILE=./my.key WS_ROLE=peer PARENT_PID=$$ node scripts/join-collab.cjs
 *
 * env:
 *   WS_AGENT_ID*    합류 agentId (필수)
 *   COLLAB_KEY      키 문자열 · 또는 COLLAB_KEY_FILE 로 파일 경로 (ck- / pk- / uk-)
 *   COLLAB_HOST     host:port (기본 localhost:7878) · 또는 CONSTELLATION_WS_URL 전체 URL
 *   WS_ROLE         collab | peer  (기본 collab — 키 접두사로도 추론)
 *   WS_AGENT_NAME   표시명 (기본 WS_AGENT_ID)
 *   COLLAB_OUTBOX   발신 큐 파일 (기본 <dir>/<agentId>-outbox.jsonl) — §6 참조
 *   COLLAB_STORE    수신 저장 파일 (기본 <dir>/<agentId>-inbox.log) — §7 참조
 *   PARENT_PID      이 pid 가 사라지면 스스로 종료 (§5 고아 방지 — 켜는 걸 권장)
 */
const fs = require('fs');
const path = require('path');

const DIR = process.env.COLLAB_DIR ? path.resolve(process.env.COLLAB_DIR) : path.resolve(__dirname, '..');
const AGENT_ID = process.env.WS_AGENT_ID;
const AGENT_NAME = process.env.WS_AGENT_NAME || AGENT_ID;
const THREAD_ID = process.env.WS_THREAD_ID || AGENT_ID;
const PARENT_PID = process.env.PARENT_PID ? parseInt(process.env.PARENT_PID, 10) : null;

if (!AGENT_ID) { console.error('[join-collab] WS_AGENT_ID env required'); process.exit(1); }

// ── 키 ──────────────────────────────────────────────────────────────────────
let key = process.env.COLLAB_KEY || '';
if (!key && process.env.COLLAB_KEY_FILE) {
  const kf = path.isAbsolute(process.env.COLLAB_KEY_FILE) ? process.env.COLLAB_KEY_FILE : path.join(DIR, process.env.COLLAB_KEY_FILE);
  try { key = fs.readFileSync(kf, 'utf8').trim(); }
  catch (e) { console.error('[join-collab] key file read fail:', kf, String(e.message || e)); process.exit(1); }
}
if (!key) { console.error('[join-collab] COLLAB_KEY 또는 COLLAB_KEY_FILE 이 필요해요 (무키 연결은 수락되지만 targeted A2A 가 조용히 사라져요 — §13.25.11)'); process.exit(1); }

// 키 접두사 ↔ 질의 파라미터. 서버는 key/peerKey/upstreamKey/collabKey 를 모두 읽지만, 종별 파라미터를
//   쓰면 «어느 종으로 붙으려 했는가» 가 서버 로그와 거부 메시지에 남아요 (오진 비용이 줄어요).
const KIND = /^pk-/.test(key) ? 'peer' : /^uk-/.test(key) ? 'upstream' : /^ck-/.test(key) ? 'collab' : null;
if (!KIND) { console.error('[join-collab] 키 접두사를 알 수 없어요 (ck- / pk- / uk- 기대): ' + key.slice(0, 6) + '…'); process.exit(1); }
const ROLE = process.env.WS_ROLE || (KIND === 'upstream' ? 'upstream' : KIND);
const PARAM = KIND === 'peer' ? 'peerKey' : KIND === 'upstream' ? 'upstreamKey' : 'key';

const HOST = process.env.COLLAB_HOST || ('localhost:' + (process.env.PORT || '7878'));
const BASE = process.env.CONSTELLATION_WS_URL || ('ws://' + HOST + '/ws');
const WS_URL = BASE + (BASE.includes('?') ? '&' : '?') + PARAM + '=' + encodeURIComponent(key);

// ── §4 single-instance — agentId **×  보드** 단위 ────────────────────────────
// agentId 만으로 잠그면 «같은 에이전트가 두 보드에 붙는» 정상 구성을 막아요. 반대로 보드만으로
//   잠그면 서로 다른 에이전트가 못 붙어요. 충돌하는 건 (agentId, 보드) 짝이에요 — 같은 짝으로
//   둘이 붙으면 서버가 중복을 close(1005) 하고 양쪽이 backoff 재접속하며 서로를 kick 해요.
const boardTag = (BASE.replace(/^wss?:\/\//, '').replace(/[^A-Za-z0-9._-]/g, '_')).slice(0, 40);
require('../single-instance.cjs').acquire(path.join(DIR, `.join-collab.${AGENT_ID}.${boardTag}.pid`), 'join-collab');

const STORE = process.env.COLLAB_STORE || path.join(DIR, AGENT_ID + '-inbox.log');
const UNDELIVERED = process.env.COLLAB_UNDELIVERED || path.join(DIR, AGENT_ID + '-undelivered.jsonl');
const OUTBOX = process.env.COLLAB_OUTBOX || path.join(DIR, AGENT_ID + '-outbox.jsonl');
const OUT_CURSOR = path.join(DIR, '.' + AGENT_ID + '-outbox-cursor');

const ACK_KINDS = new Set(['Ack', 'AckProcessed', 'AckCumulative', 'Ping', 'Pong']);   // §13.13 — 서버 pending 비추적이라 여기에 ack 하면 스톰이 돼요

// ── §7 저장 시 메타 제외 ────────────────────────────────────────────────────
// History 는 **재접속마다 전체 이력**이 다시 와요. 그대로 append 하면 저장소가 이력의 세대 수만큼
//   곱해져 커져요(실측: 어댑터 594MB / 이 저장소 바이트의 81%). 메타는 «왔다» 는 한 줄로만 남겨요.
const META_NAMES = new Set(['History', 'AgentList', 'ConnectionInfo', 'SERVER_HELLO', 'Heartbeat', 'Typing', 'Pong', 'Ping', 'AgentHello', 'OnboardAck', 'EchoModeState', 'SubagentStatus']);
// ── §8 미전달 통지 — 기본 노출 ──────────────────────────────────────────────
// 「내 발신이 끝내 닿지 않았다」는 통지는 인바운드 중 가장 조치 가능한 것인데, 이름 기반 필터에서
//   빠지기 쉬워요(실측: 22건이 읽히지 않고 쌓임 · 상대가 알려줘서 발견). 그래서 이 클라이언트는
//   저장소와 **별도 파일**에 남기고 **stderr 로도** 올려요 — 조용할 수 없게.
const UNDELIVERED_NAMES = new Set(['RelayUnreachable']);

let ws = null, connected = false, seq = 0, backoff = 500;
let selfIntroSent = false;   // §2 — **연결당 1회**. AgentList 는 갱신마다 오므로 매번 보내면 인사 폭주가 돼요.

function log(obj) { try { fs.appendFileSync(STORE, JSON.stringify(Object.assign({ t: Date.now() }, obj)) + '\n'); } catch {} }
function send(type, extra) {
  if (!ws || ws.readyState !== 1) return false;
  const msg = Object.assign({
    type, id: 'a-' + Date.now().toString(36) + '-' + (++seq), seq,
    threadId: THREAD_ID, timestamp: Date.now(), source: 'agent', agentId: AGENT_ID,
  }, extra);
  try { ws.send(JSON.stringify(msg)); log({ ev: 'sent', name: msg.name || msg.type }); return true; }
  catch (e) { log({ ev: 'send-fail', e: String(e) }); return false; }
}

// ── §6 outbox drain — 발신도 **상주 연결 재사용** ───────────────────────────
// 발신마다 새 연결을 여는 one-shot 방식은 같은 agentId 라 상주 리스너를 kick 하고, 리스너가 backoff
//   재접속하며 발신자를 되받아 kick 해요. 그 사이 고정 지연 송신이 **죽은 소켓으로 나가 무음 유실**
//   돼요(실측). 파일 append → 상주 연결이 drain 하면 그 레이스가 **성립하지 않아요.**
let outCursor = (() => { try { return parseInt(fs.readFileSync(OUT_CURSOR, 'utf8'), 10) || 0; } catch { return 0; } })();
function drainOutbox() {
  if (!connected) return;
  let data = ''; try { data = fs.readFileSync(OUTBOX, 'utf8'); } catch { return; }
  const lines = data.split('\n').filter(Boolean);
  for (let i = outCursor; i < lines.length; i++) {
    let m; try { m = JSON.parse(lines[i]); } catch { log({ ev: 'outbox-parse-fail', line: i }); continue; }
    send(m.type || 'CUSTOM', m);
  }
  if (outCursor !== lines.length) { outCursor = lines.length; try { fs.writeFileSync(OUT_CURSOR, String(outCursor)); } catch {} }
}

function connect() {
  console.log(`[join-collab] connecting ${WS_URL.replace(key, key.slice(0, 8) + '…')} (agentId=${AGENT_ID} role=${ROLE} kind=${KIND})`);
  ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    connected = true; backoff = 500; selfIntroSent = false;
    // §2 HELLO 전체 필드. capabilities 는 «내가 무엇을 받을 수 있는가» 라 서버·상대가 라우팅에 써요.
    send('HELLO', {
      clientId: AGENT_ID + '-' + process.pid, agentName: AGENT_NAME, role: ROLE, protocolVersion: '0.3', runId: null,
      capabilities: { inbound: ['UserPrompt', 'Command', 'Cancel', 'Delegate', 'Report', 'Request', 'Response', 'SelectionPrompt', 'RelayUnreachable'], outbound: ['CUSTOM'] },
    });
    log({ ev: 'connected', role: ROLE, kind: KIND });
  };
  ws.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    const name = m && (m.name || m.type);

    // §7 — 메타는 한 줄 요약만. 본문을 남기지 않는 게 요점이에요.
    if (META_NAMES.has(name) || m.type === 'History' || m.type === 'AgentList' || m.type === 'SERVER_HELLO') {
      const n = (m.value && Array.isArray(m.value.events) && m.value.events.length) ||
                (m.value && Array.isArray(m.value.agents) && m.value.agents.length) || undefined;
      log({ ev: 'inbound-meta', name, items: n });
    } else {
      log({ ev: 'inbound', msg: m });
    }

    // §8 — 미전달 통지는 별도 파일 + stderr. 조용히 지나갈 수 없게 두 곳에 남겨요.
    if (m && m.type === 'CUSTOM' && UNDELIVERED_NAMES.has(m.name)) {
      const v = m.value || {};
      try { fs.appendFileSync(UNDELIVERED, JSON.stringify({ t: Date.now(), msg: m }) + '\n'); } catch {}
      console.error(`[join-collab] ⚠ UNDELIVERED — 내 발신이 닿지 않았어요: msgId=${v.msgId} target=${v.targetAgentId} attempts=${v.attemptCount} reason=${v.lastError}`);
    }

    // §2 자기소개 — AgentList 에서 main 을 찾은 **뒤** 1회. main 이 없으면 보내지 않고 이유를 남겨요
    //   (무타깃 인사는 메인 탭에 broadcast 처럼 보여요 — §13.16.9 주석).
    if (!selfIntroSent && m && m.type === 'CUSTOM' && m.name === 'AgentList') {
      const agents = (m.value && m.value.agents) || [];
      const main = agents.find((a) => a && a.role === 'main');
      if (main) {
        selfIntroSent = true;   // 먼저 세워요 — 실패해도 재시도로 폭주하지 않게. 재시도는 다음 «연결» 에서.
        send('CUSTOM', { name: 'AgentHello', targetAgentId: main.agentId, value: { agentId: AGENT_ID, agentName: AGENT_NAME, role: ROLE, idle: true, note: 'collab 합류 — A2A 수신 대기.' } });
        log({ ev: 'agenthello-sent', to: main.agentId });
      } else {
        log({ ev: 'agenthello-deferred', reason: 'AgentList 에 role=main 없음', agents: agents.length });
      }
    }

    // §1 commitment-tier ack — 이게 없으면 상대의 targeted 메시지가 3회 재전달 후 미전달로 종결돼요.
    if (m && m.type === 'CUSTOM' && m.msgId && m.targetAgentId === AGENT_ID && m.agentId
        && m.source !== 'server' && !ACK_KINDS.has(m.name)) {
      send('CUSTOM', { name: 'AckProcessed', targetAgentId: m.agentId, value: { ackFor: m.msgId } });
      log({ ev: 'ackprocessed-sent', ackFor: m.msgId, to: m.agentId });
    }
  };
  ws.onerror = (err) => { log({ ev: 'ws-error', e: String((err && err.message) || err) }); };
  ws.onclose = (ev) => {
    connected = false; ws = null;
    log({ ev: 'closed', code: ev && ev.code });
    // close(1005) 가 반복되면 거의 항상 **같은 agentId 중복 접속**이에요 — §4 가드가 있으면 여기까지 안 와요.
    if (ev && ev.code === 1005) console.error('[join-collab] close(1005) — 같은 agentId 중복 접속일 가능성이 높아요. 다른 인스턴스를 먼저 정리하세요.');
    setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 8000);
  };
}

// ── §5 고아 방지 ────────────────────────────────────────────────────────────
// 상위 셸만 죽고 node 자식이 남는 게 폭주의 실제 기제였어요. 그런데 **부모 pid 생존을 스스로 보고
//   판단하면 안 돼요** — 셸 파이프라인은 중간 프로세스가 먼저 빠져서 «정상 자식» 도 부모가 죽은 것처럼
//   보여요(Windows 실측). 그래서 추측하지 않고 **스포너가 자기 pid 를 PARENT_PID 로 넘기게** 해요.
//   넘어오지 않으면 이 보호는 꺼진 상태이고, 그 사실을 시작할 때 말해요.
if (PARENT_PID) {
  const { pidAlive } = require('../single-instance.cjs');
  setInterval(() => {
    if (!pidAlive(PARENT_PID)) {
      console.error(`[join-collab] PARENT_PID=${PARENT_PID} 사라짐 — 고아로 남지 않기 위해 종료해요.`);
      log({ ev: 'parent-gone', parentPid: PARENT_PID });
      try { ws && ws.close(); } catch {}
      process.exit(0);
    }
  }, 5000).unref?.();
} else {
  console.error('[join-collab] PARENT_PID 미설정 — 고아 방지가 꺼져 있어요. 스포너가 자기 pid 를 넘기면 상위가 죽을 때 함께 종료해요.');
}

connect();
setInterval(drainOutbox, 1500);
process.on('SIGINT', () => { try { ws && ws.close(); } catch {} process.exit(0); });
process.on('SIGTERM', () => { try { ws && ws.close(); } catch {} process.exit(0); });
