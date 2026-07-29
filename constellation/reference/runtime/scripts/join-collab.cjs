#!/usr/bin/env node
'use strict';
/**
 * scripts/join-collab.cjs — collab / peer 합류 레퍼런스 클라이언트 (deps-0, v2.4.108).
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
 * 사용 (권장 — 감시 셸 없이):
 *   하네스/서비스가 이 node 프로세스를 **직접 소유**하는 백그라운드 태스크로 띄우세요. 이 클라이언트는
 *   close 에서 스스로 재연결하니 감시 셸 루프가 애초에 불필요하고, 소유자가 프로세스면 §5 의 고아 경로가
 *   **성립하지 않아요** (채택 실측: 폭주의 기제가 정확히 «셸만 죽고 node 가 남는» 것이었어요).
 *     WS_AGENT_ID=my-agent COLLAB_KEY=ck-… COLLAB_HOST=host:27878 node scripts/join-collab.cjs
 *
 * 사용 (차선 — 셸이 스포너일 수밖에 없을 때):
 *     WS_AGENT_ID=my-agent COLLAB_KEY_FILE=./my.key WS_ROLE=peer PARENT_PID=<Windows pid> node scripts/join-collab.cjs
 *   ⚠ Git Bash/MSYS 에서 `$$` 는 **MSYS pid** 라 Windows pid 와 달라요 — 그대로 넘기면 부모가 멀쩡한데
 *     고아로 오판해요. `ps -W` 의 **WINPID** 열을 넘기세요 (아래 §5 가 시작 시 1회 검사해 이름을 대요).
 *
 * env:
 *   WS_AGENT_ID*    합류 agentId (필수)
 *   COLLAB_KEY      키 문자열 · 또는 COLLAB_KEY_FILE 로 파일 경로 (ck- / pk- / uk-)
 *   COLLAB_HOST     host:port (기본 localhost:7878) · 또는 CONSTELLATION_WS_URL 전체 URL
 *   WS_ROLE         collab | peer  (기본 collab — 키 접두사로도 추론)
 *   WS_AGENT_NAME   표시명 (기본 WS_AGENT_ID)
 *   COLLAB_OUTBOX   발신 큐 파일 (기본 <dir>/<agentId>-outbox.jsonl) — §6 참조
 *   COLLAB_STORE    수신 저장 파일 (기본 <dir>/<agentId>-inbox.log) — §7 참조
 *   COLLAB_OUT_CURSOR  발신 커서 파일 (기본 <outbox>.cursor) — §6.1 참조
 *   COLLAB_SHARED_OUTBOX_OK=1  두 보드가 발신 큐를 공유하는 배치를 **의도적으로** 허용 (§6.1 기본은 거부)
 *   PARENT_PID      이 pid 가 사라지면 스스로 종료 (§5 고아 방지 — 위 «권장» 구성이면 불필요)
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
if (!KIND) { console.error('[join-collab] 키 접두사를 알 수 없어요 (ck- / pk- / uk- 기대) — 받은 값의 접두: ' + String(key).split('-')[0] + '-'); process.exit(1); }
const ROLE = process.env.WS_ROLE || (KIND === 'upstream' ? 'upstream' : KIND);
const PARAM = KIND === 'peer' ? 'peerKey' : KIND === 'upstream' ? 'upstreamKey' : 'key';

// v2.4.111 — 보드 지정이 **둘 다 있는데 어긋나면 거부**해요. 종전엔 `CONSTELLATION_WS_URL` 이 조건 없이
//   이겼는데, 그건 호출자가 인자로 **명시한** COLLAB_HOST 보다 **환경에 떠 있는** 값이 세다는 뜻이에요.
//   실측: 격리 보드를 띄우고 COLLAB_HOST 로 지목한 스모크가 세션 환경에 있던 URL 때문에 **운영 보드에**
//   붙어 시험 메시지를 거기 남겼어요. 여기서도 증상은 오류가 아니라 «엉뚱한 수신자» 라 조용해요 —
//   §6.1 의 공유 발신 큐와 같은 부류라 같은 처방(추측하지 말고 멈추기)을 씁니다.
const _URL_ENV = process.env.CONSTELLATION_WS_URL || '';
const _HOST_ENV = process.env.COLLAB_HOST || '';
if (_URL_ENV && _HOST_ENV) {
  let _u = null; try { _u = new URL(_URL_ENV); } catch {}
  if (_u && _u.host && _u.host !== _HOST_ENV) {
    console.error('[join-collab] 보드 지정이 둘인데 서로 달라요 — 어느 쪽을 뜻하는지 추측하지 않고 멈춰요.');
    console.error(`[join-collab]   CONSTELLATION_WS_URL=${_URL_ENV}   (host=${_u.host})`);
    console.error(`[join-collab]   COLLAB_HOST=${_HOST_ENV}`);
    console.error('[join-collab]   하나만 두세요. 스크립트가 COLLAB_HOST 로 지목했는데 환경에 URL 이 떠 있으면 조용히 다른 보드로 갑니다.');
    process.exit(1);
  }
}
const HOST = _HOST_ENV || ('localhost:' + (process.env.PORT || '7878'));
const BASE = _URL_ENV || ('ws://' + HOST + '/ws');
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

// ── §6.1 발신 커서 — **OUTBOX 를 따라가요** (채택 실측 ME-CST-13) ─────────────
// 종전엔 넷 중 커서만 `DIR + agentId` 파생이라 env 로 못 옮겼어요. 그래서 OUTBOX 를 보드별로 갈라도
//   **커서는 공유**됐고, 두 클라이언트가 같은 파일을 1.5초마다 read-modify-write 했어요.
// 기본값을 OUTBOX 에서 파생하면 갈라짐이 따라와요. 단 경로가 바뀌면 새 커서가 없어 **0 으로 읽히고
//   outbox 전체가 재발신**돼요 — 이 파일에서 가장 비싼 실패라, 레거시 경로를 한 번 읽어 승계해요.
const OUT_CURSOR_DEFAULT = OUTBOX + '.cursor';
const OUT_CURSOR = process.env.COLLAB_OUT_CURSOR || OUT_CURSOR_DEFAULT;
const OUT_CURSOR_LEGACY = path.join(DIR, '.' + AGENT_ID + '-outbox-cursor');   // v2.4.107 이전 기본값

// §6.1 — «락만 갈라지고 상태는 공유» 배치 거부. §4 락은 (agentId × 보드) 단위라 같은 agentId 로 두 보드에
//   붙는 정상 구성에서 **두 인스턴스가 나란히 뜨는데**, COLLAB_DIR 이 하나면 OUTBOX 도 하나예요. 그러면
//   A 보드로 보내려던 줄을 B 보드 클라이언트가 먼저 드레인해요 — **수신자가 바뀌는데 아무 신호가 없어요.**
//   락 단위가 두 보드를 전제하면서 상태 파일 기본값이 보드를 구분하지 않는 게 원인이고, 그 배치를 흡수하면
//   그 지점이 영구히 조용해져요. 그래서 감지하면 이름을 대고 멈춰요.
if (!process.env.COLLAB_OUTBOX && process.env.COLLAB_SHARED_OUTBOX_OK !== '1') {
  const { pidAlive } = require('../single-instance.cjs');
  const prefix = `.join-collab.${AGENT_ID}.`, mine = `${prefix}${boardTag}.pid`;
  let clash = null;
  let entries = []; try { entries = fs.readdirSync(DIR); } catch {}
  for (const f of entries) {
    if (f === mine || !f.startsWith(prefix) || !f.endsWith('.pid')) continue;
    let pid = 0; try { pid = parseInt(fs.readFileSync(path.join(DIR, f), 'utf8').trim(), 10); } catch {}
    if (pid && pidAlive(pid)) { clash = { file: f, pid, board: f.slice(prefix.length, -4) }; break; }
  }
  if (clash) {
    console.error(`[join-collab] 같은 agentId(${AGENT_ID}) 가 다른 보드(${clash.board}, pid=${clash.pid})에 이미 붙어 있는데`);
    console.error(`[join-collab]   발신 큐가 기본값이라 **공유**돼요: ${OUTBOX}`);
    console.error('[join-collab]   그러면 이 보드로 보내려던 줄을 저쪽 클라이언트가 먼저 가져가요 — 수신자가 조용히 바뀌어요.');
    console.error('[join-collab]   보드별로 COLLAB_DIR 을 나누거나, COLLAB_OUTBOX(+COLLAB_STORE) 를 명시하세요.');
    console.error('[join-collab]   공유가 의도라면 COLLAB_SHARED_OUTBOX_OK=1 로 명시하세요.');
    process.exit(1);
  }
}

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
let outCursor = (() => {
  const read = (p) => { try { const v = parseInt(fs.readFileSync(p, 'utf8').trim(), 10); return Number.isFinite(v) && v >= 0 ? v : null; } catch { return null; } };
  const v = read(OUT_CURSOR);
  if (v !== null) return v;
  // 새 경로가 없을 때만 레거시를 봐요 — 명시 지정(COLLAB_OUT_CURSOR)에는 끼어들지 않아요.
  if (OUT_CURSOR === OUT_CURSOR_DEFAULT) {
    const legacy = read(OUT_CURSOR_LEGACY);
    if (legacy !== null) {
      console.error(`[join-collab] 발신 커서를 레거시 경로에서 승계했어요: ${OUT_CURSOR_LEGACY} → ${OUT_CURSOR} (${legacy}). outbox 전체 재발신을 막았어요.`);
      return legacy;
    }
  }
  return 0;
})();
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
  console.log(`[join-collab] connecting ${WS_URL.replace(key, '<key>')} (agentId=${AGENT_ID} role=${ROLE} kind=${KIND})`);
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
// v2.4.108 (채택 실측 ME-CST-13) — 그런데 **넘어온 값이 이 프로세스에서 의미가 없을 수도** 있어요.
//   Git Bash/MSYS 의 `$$` 는 MSYS pid 라 Windows pid 와 다르고, 문서가 `PARENT_PID=$$` 를 처방했어요.
//   그러면 부모가 멀쩡히 살아있는데 첫 5초 tick 이 「사라짐」을 찍고 종료해요 — 고아 방지가 **정상 세션을
//   죽이는** 쪽으로 뒤집혀요. 게다가 문구가 부모를 의심하게 만들어서 원인(pid 공간 불일치)에 단서가 없었어요.
//   그래서 「처음부터 안 보임」과 「돌다가 사라짐」을 **다른 사건으로** 말해요. 앞의 것은 보호를 걸 수 없다는
//   뜻이라 조용히 계속하지 않고 멈춰요 — 꺼진 보호를 켜진 것처럼 두는 게 이 파일이 막으려는 결함이에요.
if (PARENT_PID) {
  const { pidAlive } = require('../single-instance.cjs');
  if (!pidAlive(PARENT_PID)) {
    console.error(`[join-collab] PARENT_PID=${PARENT_PID} 가 이 프로세스에서 **처음부터 보이지 않아요** (사라진 게 아니에요).`);
    console.error('[join-collab]   ① 이미 종료됐거나, ② pid 공간이 달라요 — Git Bash/MSYS 의 `$$` 는 MSYS pid 예요.');
    console.error('[join-collab]   MSYS 라면 `ps -W` 의 **WINPID** 열을 넘기세요. 예: PARENT_PID=$(ps -W | awk -v m=$$ \'$1==m{print $4}\')');
    console.error('[join-collab]   더 나은 답: 감시 셸을 없애고 하네스가 이 node 프로세스를 직접 소유하게 하세요 — 고아 경로가 성립하지 않아요.');
    process.exit(1);
  }
  setInterval(() => {
    if (!pidAlive(PARENT_PID)) {
      console.error(`[join-collab] PARENT_PID=${PARENT_PID} 사라짐 (시작 시엔 살아 있었어요) — 고아로 남지 않기 위해 종료해요.`);
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
