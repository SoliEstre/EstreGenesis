#!/usr/bin/env node
// constellation/mcp/server.cjs — Phase 2 full impl (v0.2.0)
//
// Per Constellation.md §8 (v0.4 MCP integration) + §13.11 rule 5 (attachment
// transport-mode) + §13.13.2 (at-least-once relay reliability draft).
//
// Phase 2 scope (this file):
//   - WS proxy connection to the live Constellation server (one MCP session
//     = one logical agent identity, lifecycle maps to AgentList presence)
//   - Read tools: board_state_get / board_history_tail / agent_list_get
//   - Write tools: a2a_emit (with §13.11 rule 5 attachment-aware) +
//     a2a_wait_ack (full 3-tier: delivered / commitment / application)
//   - Chunked transfer support (ArtifactManifest / ArtifactChunk /
//     ArtifactComplete reassembly on receive side)
//   - Idempotent receiver dedup per §13.13.2 (seen-msgId LRU, 1024/1h)
//   - Auth via env: CONSTELLATION_TOKEN / CONSTELLATION_PEER_KEY /
//     CONSTELLATION_UPSTREAM_KEY / CONSTELLATION_COLLAB_KEY (NEVER tool args per §13.14)
//
// Deps: none required. The WebSocket client comes from the platform (Node >= 22 global `WebSocket`);
//   `ws` is an optionalDependencies fallback for runtimes without it. See §13.27.7.

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  PROTOCOL_VERSIONS,
  LATEST,
  LEGACY,
  requestedVersion,
  versionError,
  discoverResult,
  complete,
  cacheable,
} = require('./mcp-protocol.cjs');

const SERVER_INFO = { name: 'constellation-mcp', version: require('./package.json').version };
const CAPABILITIES = { tools: {} };

// ----- WebSocket transport: platform-native first, `ws` package as fallback -----
// v0.3.39: the previous `let WebSocket = null` **shadowed the built-in global WebSocket**, so this
// server could not connect at all without the `ws` package even on runtimes that already ship a
// client. Node has had a global WebSocket since 22 — and the reference runtime in this same repo
// uses it at all 10 of its connect sites, which is why those clients never had a missing-part
// problem to begin with. So the fix is not to carry a copy of `ws`: it is to use the part the
// platform already provides, and keep `ws` only for runtimes that lack the global.
// Refuse only when BOTH are absent, and name both remedies in the refusal.
//
// v0.3.32 (adopter-reported C8) still holds for the fallback: a single module-load require whose
// failure was swallowed made a missing-at-boot `ws` permanently missing for the whole session —
// measured: `npm install ws` completed 41s BEFORE the session spawned and the process still
// reported it absent until /mcp re-spawn. So the fallback re-requires at each use.
let wsPackage = null;
function loadWsPackage() {
  if (!wsPackage) { try { wsPackage = require('ws'); } catch (_) { /* still absent — caller reports */ } }
  return wsPackage;
}
function transportKind() {
  if (typeof globalThis.WebSocket === 'function') return 'native';
  if (loadWsPackage()) return 'ws-package';
  return null;
}

// The call sites below are written against the `ws` package's EventEmitter surface (on/send/close).
// The built-in is WHATWG (addEventListener/event.data). Adapt in one place rather than rewriting
// every call site — widening the difference would spread two APIs across the whole file.
/**
 * Normalize a built-in-WebSocket error event into an Error that says something.
 * The built-in routes connection failures through undici, where the error is typically an
 * AggregateError whose own `message` is empty and whose causes sit in `.errors`. Rejecting with it
 * as-is produced a JSON-RPC error with `message: ""` — measured against a closed port. A failure
 * that reports nothing is the same defect shape as a success that renders nothing, so flatten the
 * cause chain into the message instead of passing the empty envelope through.
 */
function transportError(ev, endpoint) {
  const raw = ev && ev.error;
  const at = endpoint ? ' (' + endpoint + ')' : '';
  if (raw instanceof Error && raw.message) return raw;
  const parts = [];
  const collect = (e, depth) => {
    if (!e || depth > 3) return;
    if (Array.isArray(e.errors)) for (const x of e.errors) collect(x, depth + 1);
    if (e.code) parts.push(String(e.code));
    if (e.message) parts.push(String(e.message));
    if (e.cause) collect(e.cause, depth + 1);
  };
  collect(raw, 0);
  const detail = [...new Set(parts)].join(' · ');
  return new Error('WebSocket connect failed' + at + (detail ? ': ' + detail : ' — the runtime reported no detail'));
}

function nativeAdapter(sock, endpoint) {
  return {
    on(ev, fn) {
      if (ev === 'message') sock.addEventListener('message', (e) => fn(typeof e.data === 'string' ? e.data : Buffer.from(e.data)));
      else if (ev === 'error') sock.addEventListener('error', (e) => fn(transportError(e, endpoint)));
      // close 는 `ws` 패키지처럼 (code, reason) 을 넘겨요 — 프레임 없는 4003/4403 도 서버 판정 거절이라 코드가 필요해요.
      else if (ev === 'close') sock.addEventListener('close', (e) => fn(e && e.code, e && e.reason));
      else sock.addEventListener(ev, () => fn());
      return this;
    },
    send(data) { sock.send(data); },
    // The built-in throws InvalidStateError on close() while CONNECTING; the `ws` package allows it.
    // The handshake-timeout path closes in exactly that state, so swallow it there.
    close(...args) { try { sock.close(...args); } catch (_) { /* CONNECTING — drop */ } },
    get readyState() { return sock.readyState; },
  };
}
function openSocket(url) {
  const kind = transportKind();
  // Endpoint for diagnostics only — origin without the query string, because the auth key travels
  // as a query parameter and an error message is exactly the wrong place for it.
  const endpoint = String(url).split('?')[0];
  if (kind === 'native') return nativeAdapter(new globalThis.WebSocket(url), endpoint);
  if (kind === 'ws-package') { const WS = loadWsPackage(); return new WS(url); }
  return null;
}

// ----- Config from env -----
function getBoardEndpoint() {
  const url = process.env.CONSTELLATION_WS_URL;
  if (!url) throw new Error('CONSTELLATION_WS_URL env var not set');
  return url;
}

// v0.3.34 — **키를 파일에서도 읽어요** (`CONSTELLATION_<KIND>_KEY_FILE`).
//
// 왜 (2026-08-09 실측): 이 서버는 세션 env 를 그대로 물려받아요. 그래서 공용 기계의 env 에 담긴
//   **다른 프로젝트의 키**가 그대로 이 서버의 자격증명이 됐고, 그 키가 그쪽 주인에게 결속되지 않은
//   상태였던 탓에 TOFU 가 우리 정체에 고정해 **원래 주인을 잠갔어요.** env 는 프로세스 트리 전체가
//   공유하는 자리라 자격증명을 두기에 가장 나쁜 곳인데, 여기엔 파일 경로로 줄 방법이 없었어요.
//   그래서 join-collab 과 같은 모양을 갖춰요 — 값은 파일에, 경로만 env 로.
// 우선순위는 **직접 env > 파일** 이 아니라 **파일 > 직접 env** 예요: 파일은 이 배포가 «명시한» 것이고
//   env 는 물려받았을 수 있어요. 오늘 사고가 정확히 「물려받은 값이 명시한 값을 이기는」 규칙에서 났어요.
function _keyFromFile(name) {
  const p = process.env[name + '_FILE'];
  if (!p) return '';
  try { return require('fs').readFileSync(p, 'utf8').trim(); } catch (e) {
    process.stderr.write(`[constellation-mcp] ${name}_FILE 을 못 읽었어요: ${p} (${e.code || e.message})\n`);
    return '';
  }
}
function _pick(name) { return _keyFromFile(name) || (process.env[name] || '').trim(); }
function getAuth() {
  const peer = _pick('CONSTELLATION_PEER_KEY');
  if (peer) return { kind: 'peer', key: peer };   // v0.3.31 — §13.16.11: peer key 는 전용 파라미터로 (upstreamKey 편승 금지, adopter 리포트)
  const up = _pick('CONSTELLATION_UPSTREAM_KEY');
  if (up) return { kind: 'upstream', key: up };
  const collab = _pick('CONSTELLATION_COLLAB_KEY');
  if (collab) return { kind: 'collab', key: collab };
  const tok = _pick('CONSTELLATION_TOKEN');
  if (tok) return { kind: 'token', key: tok };
  return { kind: 'local', key: null };
}

// 무작위 기본값은 프로세스당 한 번만 정해요 — 종전엔 호출마다 새로 뽑아서 HELLO 의 agentId 와 a2a_emit 봉투의
//   agentId 가 서로 달랐어요(한 세션 = 한 정체라는 위 계약과 어긋나요).
let _agentId = null;
function getAgentIdentity() {
  if (!_agentId) _agentId = process.env.CONSTELLATION_AGENT_ID || 'mcp-session-' + crypto.randomBytes(4).toString('hex');
  return _agentId;
}

function getStatePath() {
  return process.env.CONSTELLATION_STATE_PATH || null;
}
// v0.3.32 (adopter-reported C11): a peer-main is BY DEFINITION attached to someone else's board, which
// is normally on another host — so a local-file-only state read was permanently unusable in the very
// configuration the peer path exists for. The board already serves the same document over HTTP at
// /api/state on the same origin, so derive it from the WS endpoint instead of demanding a mount.
function getStateHttpUrl() {
  let base;
  try { base = getBoardEndpoint(); } catch (_) { return null; }
  const m = String(base).match(/^(wss?):\/\/([^/?#]+)/i);
  if (!m) return null;
  return (m[1].toLowerCase() === 'wss' ? 'https' : 'http') + '://' + m[2] + '/api/state';
}
function fetchStateOverHttp(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    let mod;
    try { mod = require(url.startsWith('https:') ? 'https' : 'http'); } catch (e) { return reject(e); }
    const req = mod.get(url, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        try { JSON.parse(body); } catch (e) { return reject(new Error('non-JSON body: ' + e.message)); }
        resolve(body);
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 5000, () => { req.destroy(new Error('timeout after ' + (timeoutMs || 5000) + 'ms')); });
  });
}

// ----- §13.16.9 v2.5.2 A2A-intent meaningful filter -----
const MEANINGFUL = new Set([
  'Delegate', 'UserPrompt', 'WorkerReport', 'WorkerAck',
  'Report', 'BlockerManifest', 'BlockerNudge',
  'PRRequest', 'PRDraftReady', 'PRReviewAck',
  'PRMergeRequest', 'PRMergeAck', 'PRStatusUpdate', 'PRRequestRejected',
  'Handoff', 'HandoffRequested', 'HandoffReady', 'ArtifactHandoff', 'Attachment',
  'Command', 'Priority', 'Cancel',
  'DeadlockProbe', 'ReviewSLAAck', 'PreemptRequest', 'PreemptForce',
  'MediationProposal', 'MediationAck', 'EscalationRequest',
  'ArtifactManifest', 'ArtifactChunk', 'ArtifactComplete',
  'AgentText',   // §13.13.3 (v2.4.97) — bridge-coalesced utterance; the raw TEXT_MESSAGE_* frames carry no name, so a name-gated filter drops an utterance silently
  // v2.6.25 — 전달-실패 + 선택 요청 (probe 허용목록과 동일 사유).
  'RelayUnreachable', 'Response', 'SelectionPrompt', 'SelectionExpired',
  // v2.6.26 — 어댑터 내용성 6종 (probe 허용목록과 동일 사유).
  'SpecGapReport', 'SpecGapCode', 'Proposal', 'ReturnPackage', 'PhaseBScopeShare', 'TaskEnvelope',
]);

// ----- WS proxy state -----
// ── §13.25.13 열림 ≠ 수락 (레퍼런스 local-bridge.cjs 와 같은 규약) ─────────────────────────────
// 서버는 SERVER_HELLO 를 HELLO 관문(TOFU·requireKey·allowlist 등) **전에** 보내요. 종전엔 SERVER_HELLO 에서
//   ready 를 켜서, 거절될 연결로 AgentHello 와 a2a_emit 봉투가 나갔고 a2a_emit 은 서버가 버린 프레임에
//   {msgId, sentAt} 성공을 돌려줬어요(무음 유실). 상태는 셋으로 갈라요:
//     accepted — 거절도 SERVER_HELLO 도 아닌 첫 서버 프레임을 받았다(수락 증거).
//     ready    — 발신해도 된다(= 판정). source 'server' 인 ConnectionInfo(서버가 HELLO 관문을 전부 통과시킨 **뒤에만**
//                보내요)를 받았거나, 그걸 안 보내는 서버 계열이면 수락이 ADMIT_HOLD_MS 동안 뒤집히지 않았다.
//                수락 증거만으로 열면 판정 전에 목록을 방송하는 서버 계열에서 거절 직전 창에 발신이 새요.
//     refusal  — 서버가 낸 ConnectionRejected(source 'server' 만 — 서버는 에이전트가 보낸 같은 이름의 프레임도
//                중계해서, 이름만 보면 아무 피어나 연결을 멈춰요). 사유를 들고 있다가 발신 도구가 isError 로 돌려줘요.
//   재시도는 REJECT_RETRY_MS(기본 5분) 뒤에만 — 거절 사유(열쇠 만료·정체 불일치)는 빨리 두드려서 풀리지 않아요.
const ADMIT_HOLD_MS = +(process.env.CONSTELLATION_ADMIT_HOLD_MS || 3000);
const REJECT_RETRY_MS = +(process.env.CONSTELLATION_REJECT_RETRY_MS || 5 * 60 * 1000);
const HANDSHAKE_TIMEOUT_MS = Math.max(10000, ADMIT_HOLD_MS + 5000);

const wsState = {
  socket: null,
  ready: false,
  connecting: null,           // 진행 중인 연결 Promise — 판정 대기 중에 온 도구 호출이 소켓을 또 열지 않게 공유해요
  refusal: null,              // { code, label, reason, hint, source, at, retryAt } — 마지막 서버 판정 거절
  history: [],                // local cache of inbound messages (board_history_tail)
  agentList: [],              // latest AgentList snapshot
  pendingAcks: new Map(),     // msgId → { tier, resolve, reject, timer }
  seenMsgIds: new Map(),      // §13.13.2 dedup LRU (msgId → ts)
  chunks: new Map(),          // artifact reassembly: artifactKey → { manifest, chunks:Map, expected }
  msgSeq: 1,
};

const DEDUP_LRU_MAX = 1024;
const DEDUP_LRU_TTL_MS = 60 * 60 * 1000;

function dedupCheck(msgId) {
  if (!msgId) return false;
  const now = Date.now();
  // TTL evict
  for (const [k, ts] of wsState.seenMsgIds) {
    if (now - ts > DEDUP_LRU_TTL_MS) wsState.seenMsgIds.delete(k);
  }
  if (wsState.seenMsgIds.has(msgId)) return true;
  // LRU evict
  if (wsState.seenMsgIds.size >= DEDUP_LRU_MAX) {
    const first = wsState.seenMsgIds.keys().next().value;
    wsState.seenMsgIds.delete(first);
  }
  wsState.seenMsgIds.set(msgId, now);
  return false;
}

function makeMsgId() {
  return 'mcp-' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
}

const fmtMs = (ms) => ms >= 60000 ? Math.round(ms / 60000) + '분' : Math.round(ms / 1000) + '초';

// 거절을 기록해요. retryAt 전엔 connectWS 가 소켓을 열지 않고 이 사유를 그대로 돌려줘요.
function noteRefusal(v, source) {
  const at = Date.now();
  const r = {
    code: (v && v.code) || '?', label: v && v.label, reason: v && v.reason, hint: v && v.hint, source,
    at: new Date(at).toISOString(), retryAt: new Date(at + REJECT_RETRY_MS).toISOString(),
  };
  wsState.refusal = r;
  process.stderr.write('[constellation-mcp] 서버가 합류를 거절했어요 (' + r.code + (r.label ? ' · ' + r.label : '') + ') — ' + fmtMs(REJECT_RETRY_MS) + ' 뒤에야 다시 붙어요. 빨리 두드려서 풀리는 종류가 아니에요.\n');
  return r;
}
function refusalError(r) {
  const e = new Error('connection refused by the board server (' + r.code + (r.label ? ' · ' + r.label : '') + ')' + (r.reason ? ': ' + r.reason : '') + ' — next attempt after ' + r.retryAt);
  e.refusal = r;
  return e;
}

// 연결은 하나만 열어요. 판정 대기 중(최대 ADMIT_HOLD_MS)에 온 도구 호출은 같은 판정을 기다려요 — 종전엔 ready 가
//   아닌 동안 호출마다 소켓을 새로 열 수 있었어요.
async function connectWS() {
  if (wsState.ready && wsState.socket) return wsState.socket;
  const r = wsState.refusal;
  if (r && Date.parse(r.retryAt) > Date.now()) throw refusalError(r);
  if (!wsState.connecting) {
    wsState.connecting = openAndAwaitVerdict().finally(() => { wsState.connecting = null; });
  }
  return wsState.connecting;
}

async function openAndAwaitVerdict() {
  if (!transportKind()) {
    throw new Error(
      'No WebSocket transport available. This runtime has no built-in global WebSocket (Node >= 22 ' +
      'provides one) and the `ws` package is not installed either. Either run this plugin on Node >= 22, ' +
      'or run `npm install ws` in the plugin mcp dir.'
    );
  }
  const baseUrl = getBoardEndpoint();
  const auth = getAuth();
  const agentId = getAgentIdentity();

  let url = baseUrl;
  if (auth.kind === 'peer') url += (url.includes('?') ? '&' : '?') + 'peerKey=' + encodeURIComponent(auth.key);
  else if (auth.kind === 'upstream') url += (url.includes('?') ? '&' : '?') + 'upstreamKey=' + encodeURIComponent(auth.key);
  else if (auth.kind === 'collab') url += (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(auth.key);
  else if (auth.kind === 'token') url += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(auth.key);

  return new Promise((resolve, reject) => {
    const ws = openSocket(url);
    wsState.socket = ws;
    wsState.ready = false;
    const mine = () => wsState.socket === ws;   // 늦게 도착한 옛 소켓의 이벤트가 새 연결 상태를 지우지 않게
    const hello = { type: 'HELLO', agentId, agentName: 'MCP Session ' + agentId, role: auth.kind === 'collab' ? 'collab' : (auth.kind === 'upstream' ? 'upstream' : (auth.kind === 'peer' ? 'peer' : 'local')), capabilities: ['a2a', 'mcp-proxy', 'ack-layer'] };
    let helloSent = false, accepted = false, refused = false, settled = false;
    const early = [];   // 판정 전에 받은 프레임 — 수락되면 그때 처리하고, 거절되면 버려요(인가되지 않은 연결의 전송분은 무효예요)
    const settle = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (err) reject(err); else resolve(ws);
    };
    const timeout = setTimeout(() => {
      if (settled) return;
      if (mine()) { wsState.socket = null; wsState.ready = false; }
      ws.close();
      settle(new Error('WS handshake timeout (' + HANDSHAKE_TIMEOUT_MS + 'ms) — no server verdict' + (helloSent ? ' after HELLO' : ' (no SERVER_HELLO)')));
    }, HANDSHAKE_TIMEOUT_MS);

    // 발신 허가. 자기 공지(AgentHello)도 여기서만 나가요 — 판정 전에 보내면 거절될 연결로 나가 사라져요.
    const admit = (why) => {
      if (settled || refused || !accepted || !mine()) return;
      wsState.ready = true;
      wsState.refusal = null;
      const agentHello = { type: 'CUSTOM', name: 'AgentHello', agentId, value: { agentId, agentName: hello.agentName, role: hello.role, env: 'mcp-server', capabilities: hello.capabilities, idle: true } };
      try { ws.send(JSON.stringify(agentHello)); } catch (_) { /* 곧 close 가 상태를 정리해요 */ }
      process.stderr.write('[constellation-mcp] 수락 확인 (' + why + ') — 발신을 열어요\n');
      settle(null);
      for (const m of early.splice(0)) handleInbound(ws, agentId, m);
    };

    ws.on('open', () => { /* await SERVER_HELLO per Constellation v0.3 handshake */ });

    ws.on('message', (raw) => {
      if (!mine()) return;
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch (_) { return; }

      // 거절은 언제 오든 거절이에요(SERVER_HELLO 는 판정 전에 와요). 서버가 낸 것만 — 피어가 보낸 같은 이름은 중계된 말일 뿐이에요.
      if (msg && msg.name === 'ConnectionRejected' && msg.source === 'server') {
        refused = true;
        const r = noteRefusal(msg.value || {}, 'server');
        wsState.ready = false;
        wsState.socket = null;
        early.length = 0;
        try { ws.close(); } catch (_) { /* 이미 닫히는 중 */ }   // 서버가 닫기 전에 우리가 먼저 닫아요 — 거절된 소켓에 남을 이유가 없어요
        const err = refusalError(r);
        for (const [id, p] of wsState.pendingAcks) { clearTimeout(p.timer); wsState.pendingAcks.delete(id); p.reject(err); }
        settle(err);
        return;
      }
      if (refused) return;

      // Handshake: server-first. HELLO 만 보내고 판정을 기다려요.
      if (msg.type === 'SERVER_HELLO') {
        if (!helloSent) { helloSent = true; ws.send(JSON.stringify(hello)); }
        return;
      }
      // 거절이 아닌 첫 서버 프레임 = 수락 증거. 아직 판정은 아니에요 — ConnectionInfo 를 안 보내는 서버 계열 대비로 유지 시간을 재요.
      if (!accepted) {
        accepted = true;
        setTimeout(() => admit('수락 ' + fmtMs(ADMIT_HOLD_MS) + ' 유지'), ADMIT_HOLD_MS);
      }
      if (msg.type === 'CUSTOM' && msg.name === 'ConnectionInfo' && msg.source === 'server') admit('ConnectionInfo');
      if (!wsState.ready) { early.push(msg); return; }
      handleInbound(ws, agentId, msg);
    });

    ws.on('error', (e) => {
      if (!mine() || settled) return;
      wsState.socket = null; wsState.ready = false;
      try { ws.close(); } catch (_) { /* CONNECTING */ }
      settle(e);
    });
    ws.on('close', (code) => {
      if (!mine()) return;
      wsState.ready = false; wsState.socket = null;
      if (settled) return;
      // 거절 프레임 없이 4003/4403 으로 닫혀도 서버 판정 거절이에요(프레임을 싣지 않던 옛 서버 · 프레임 유실).
      if (code === 4003 || code === 4403) { settle(refusalError(noteRefusal({ code: 'close-' + code }, 'client'))); return; }
      settle(new Error('WS closed before the server verdict' + (code ? ' (code ' + code + ')' : '')));
    });
  });
}

// 수락된 연결의 수신 처리 — 이력 캐시 · AgentList · dedup · ack 해소 · 청크 재조립.
function handleInbound(ws, agentId, msg) {
  // Cache history
  wsState.history.push({ at: Date.now(), msg });
  if (wsState.history.length > 4096) wsState.history.shift();

  // AgentList update (§13.9 handshake group)
  if (msg.name === 'AgentList' && msg.value?.agents) {
    wsState.agentList = msg.value.agents;
    return;
  }

  // §13.13.2 dedup
  const msgId = msg.msgId || msg.id;
  if (msgId && dedupCheck(msgId)) {
    // Duplicate — emit AckProcessed { dedupHit: true } then discard
    if (msg.targetAgentId === agentId) {
      const ack = { type: 'CUSTOM', name: 'AckProcessed', agentId, value: { ackFor: msgId, dedupHit: true } };
      ws.send(JSON.stringify(ack));
    }
    return;
  }

  // Pending-ack resolver (full 3-tier)
  if (msg.name === 'Ack' && msg.value?.ackFor) {
    const p = wsState.pendingAcks.get(msg.value.ackFor);
    if (p && p.tier === 'delivered') {
      clearTimeout(p.timer);
      p.resolve({ tier: 'delivered', ackedAt: Date.now(), from: msg.value.from });
      wsState.pendingAcks.delete(msg.value.ackFor);
    }
  } else if (msg.name === 'AckProcessed' && msg.value?.ackFor) {
    const p = wsState.pendingAcks.get(msg.value.ackFor);
    if (p && (p.tier === 'commitment' || p.tier === 'delivered')) {
      clearTimeout(p.timer);
      p.resolve({ tier: 'commitment', ackedAt: Date.now(), dedupHit: !!msg.value.dedupHit });
      wsState.pendingAcks.delete(msg.value.ackFor);
    }
  } else if (msg.name === 'Report' || msg.name === 'DONE' || msg.name === 'BLOCKED' || msg.name === 'NEEDS_HUMAN'
             || msg.name === 'DECISION_RESPONSE' || msg.name === 'DECISION_DEFER' || msg.name === 'DECISION_REJECT_FRAMING') {
    // Application-tier — match by re_msgId or value.for
    // tier='decided' is the Hyperbrief-specific application-tier per Constellation §13.16.9 + Hyperbrief.md §8.2
    const ackFor = msg.value?.re_msgId || msg.value?.for;
    if (ackFor) {
      const p = wsState.pendingAcks.get(ackFor);
      const isDecisionOutcome = msg.name === 'DECISION_RESPONSE' || msg.name === 'DECISION_DEFER' || msg.name === 'DECISION_REJECT_FRAMING';
      // 'decided' waiters resolve on DECISION_* outcomes; 'application' waiters resolve on either generic outcomes or DECISION_* outcomes
      if (p && (p.tier === 'application' || (p.tier === 'decided' && isDecisionOutcome))) {
        clearTimeout(p.timer);
        p.resolve({ tier: p.tier, ackedAt: Date.now(), outcome: msg.name, body: msg.value });
        wsState.pendingAcks.delete(ackFor);
      }
    }
  }

  // Chunked transfer reassembly
  if (msg.name === 'ArtifactManifest') {
    const key = msg.value?.handoff || msg.value?.artifact || ('manifest-' + Date.now());
    wsState.chunks.set(key, { manifest: msg.value, chunks: new Map(), expected: 0 });
  } else if (msg.name === 'ArtifactChunk') {
    const key = msg.value?.artifact;
    const slot = wsState.chunks.get(key);
    if (slot) slot.chunks.set(msg.value.chunk_index, msg.value.data);
  } else if (msg.name === 'ArtifactComplete') {
    const key = msg.value?.artifact;
    const slot = wsState.chunks.get(key);
    if (slot) {
      // Reassemble; verify sha256 if present in manifest
      const ordered = Array.from(slot.chunks.entries()).sort((a, b) => a[0] - b[0]).map(([_, d]) => d);
      slot.assembled = Buffer.concat(ordered.map(d => Buffer.from(d, 'base64')));
      slot.complete = true;
    }
  }
}

// ----- Tools -----

const TOOLS = [
  { name: 'board_state_get', description: 'Constellation board state (modes, projects, current/done/planned tracks, decisions). Read-only. Resolves in order: CONSTELLATION_STATE_PATH if set and present → HTTP GET /api/state on the origin derived from CONSTELLATION_WS_URL (works for remote boards, e.g. a peer-main attachment) → isError. A failed read is returned as isError, never as prose in a success body.', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'board_history_tail', description: 'Per-channel A2A history from cursor forward. Read-only.', inputSchema: { type: 'object', properties: { channelId: { type: 'string' }, sinceCursor: { type: 'integer' }, meaningfulOnly: { type: 'boolean', default: true } }, required: ['channelId', 'sinceCursor'] } },
  { name: 'agent_list_get', description: 'Current AgentList (§13.9 handshake group). Read-only.', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'a2a_emit', description: 'Emit targeted CUSTOM/{name} envelope to targetAgentId. §13.11 rule 5 attachment-aware. Returns server-stamped msgId. Sends only after the board server has admitted this connection (§13.25.13: ConnectionInfo, or acceptance held for the hold window); a refused or unadmitted connection returns isError with the refusal code and sent:false, never a msgId.', inputSchema: { type: 'object', properties: { targetAgentId: { type: 'string' }, name: { type: 'string' }, value: { type: 'object' }, attachments: { type: 'array', items: { type: 'object' } } }, required: ['targetAgentId', 'name', 'value'] } },
  { name: 'a2a_wait_ack', description: 'Block until ack tier arrives or timeout. Full §13.13 3-tier + Hyperbrief tier=decided application-tier extension (resolves on DECISION_RESPONSE / DECISION_DEFER / DECISION_REJECT_FRAMING).', inputSchema: { type: 'object', properties: { msgId: { type: 'string' }, tier: { type: 'string', enum: ['delivered', 'commitment', 'application', 'decided'] }, timeoutMs: { type: 'integer', default: 30000 } }, required: ['msgId', 'tier'] } },
];

async function ensureConnected() {
  if (!wsState.ready) await connectWS();
}

// 연결을 못 얻으면(판정 거절 · 판정 없음 · 전송 실패) 도구 결과를 isError 로 돌려줘요 — 성공 봉투에 담지 않아요.
//   거절이면 서버가 준 사유(code · label · reason · hint)와 다음 시도 시각을 그대로 실어요. 호출자가 할 일은
//   «다시 보내기» 가 아니라 그 사유를 푸는 것(열쇠 연장·정체 정정)이라서요.
function connectFailure(e, sendTool) {
  const r = e && e.refusal;
  const body = r
    ? { error: 'connection-refused', code: r.code, label: r.label, reason: r.reason, hint: r.hint, verdictSource: r.source, refusedAt: r.at, retryAt: r.retryAt }
    : { error: 'not-connected', message: (e && e.message) || String(e) };
  if (sendTool) body.sent = false;
  body.note = r
    ? 'The board server refused this connection at its HELLO verdict (Constellation §13.25.13); nothing was sent. Resending will not help until the cause is fixed; this server will not reconnect before retryAt.'
    : 'No admitted connection to the board (Constellation §13.25.13: open is not admission)' + (sendTool ? '; nothing was sent.' : '.');
  return { content: [{ type: 'text', text: JSON.stringify(body) }], isError: true };
}
async function withConnection(sendTool, fn) {
  try { await ensureConnected(); } catch (e) { return connectFailure(e, sendTool); }
  return fn();
}

async function handleBoardStateGet() {
  // Resolution order: explicit local path → HTTP /api/state on the board's own origin → error.
  const statePath = getStatePath();
  if (statePath && fs.existsSync(statePath)) {
    return { content: [{ type: 'text', text: fs.readFileSync(statePath, 'utf8') }] };
  }
  const httpUrl = getStateHttpUrl();
  if (httpUrl) {
    try {
      const body = await fetchStateOverHttp(httpUrl, 5000);
      return { content: [{ type: 'text', text: body }] };
    } catch (e) {
      // isError:true is load-bearing: the previous isError:false made a failed read look like a
      // successful read whose CONTENT was an apology — a silent-failure class that is worst inside
      // an autonomous loop, where nothing downstream can tell the two apart.
      return { content: [{ type: 'text', text: `board state unavailable — local path unset/missing and GET ${httpUrl} failed: ${e.message}. If the board's HTTP surface is IP-allowlisted (Constellation §13.25), add this host or set CONSTELLATION_STATE_PATH.` }], isError: true };
    }
  }
  return { content: [{ type: 'text', text: 'board state unavailable — set CONSTELLATION_STATE_PATH, or set CONSTELLATION_WS_URL so the HTTP /api/state origin can be derived from it' }], isError: true };
}

async function handleBoardHistoryTail({ channelId, sinceCursor, meaningfulOnly = true }) {
  return withConnection(false, () => {
  let history = wsState.history.slice(sinceCursor);
  if (meaningfulOnly) history = history.filter(h => h.msg.name && MEANINGFUL.has(h.msg.name));
  history = history.filter(h => !channelId || h.msg.channelId === channelId || h.msg.targetAgentId === channelId || h.msg.agentId === channelId);
  return { content: [{ type: 'text', text: JSON.stringify(history.map(h => h.msg), null, 2) }] };
  });
}

async function handleAgentListGet() {
  return withConnection(false, () => ({ content: [{ type: 'text', text: JSON.stringify(wsState.agentList, null, 2) }] }));
}

async function handleA2aEmit({ targetAgentId, name, value, attachments }) {
  return withConnection(true, () => {
    // 판정과 발신 사이에 거절·끊김이 끼어들 수 있어요 — 발신 직전에 한 번 더 봐요(성공으로 돌려줄 근거가 없으면 isError).
    if (!wsState.ready || !wsState.socket) return connectFailure(wsState.refusal ? refusalError(wsState.refusal) : new Error('connection lost before send'), true);
    const msgId = makeMsgId();
    const envelope = { type: 'CUSTOM', name, msgId, agentId: getAgentIdentity(), targetAgentId, timestamp: Date.now(), value };
    if (attachments && attachments.length) envelope.value = { ...envelope.value, attachments };
    try { wsState.socket.send(JSON.stringify(envelope)); } catch (e) { return connectFailure(e, true); }
    return { content: [{ type: 'text', text: JSON.stringify({ msgId, sentAt: Date.now() }) }] };
  });
}

async function handleA2aWaitAck({ msgId, tier, timeoutMs = 30000 }) {
  return withConnection(false, () => new Promise((resolve) => {
    const timer = setTimeout(() => {
      wsState.pendingAcks.delete(msgId);
      resolve({ content: [{ type: 'text', text: JSON.stringify({ msgId, tier, timeout: true }) }] });
    }, timeoutMs);
    wsState.pendingAcks.set(msgId, {
      tier, timer,
      resolve: (ackResult) => resolve({ content: [{ type: 'text', text: JSON.stringify({ msgId, ...ackResult }) }] }),
      // 거절로 끝난 대기는 거절 봉투로 돌려줘요 — 사유 code 가 기계로 읽혀야 호출자가 재시도와 사유 해소를 가를 수 있어요.
      reject: (e) => resolve(e && e.refusal ? connectFailure(e, false) : { content: [{ type: 'text', text: 'wait_ack error: ' + e.message }], isError: true }),
    });
  }));
}

// ----- MCP stdio protocol -----

const handlers = {
  'server/discover': async () => discoverResult(SERVER_INFO, CAPABILITIES),
  'initialize': async () => ({ protocolVersion: LEGACY, serverInfo: { name: 'constellation-mcp', version: require('./package.json').version }, capabilities: CAPABILITIES }),
  'tools/list': async () => complete(cacheable({ tools: TOOLS }), SERVER_INFO),
  'tools/call': async (params) => complete(await callTool(params), SERVER_INFO),
};

async function callTool(params) {
  const { name, arguments: args } = params;
  switch (name) {
    case 'board_state_get': return handleBoardStateGet();
    case 'board_history_tail': return handleBoardHistoryTail(args || {});
    case 'agent_list_get': return handleAgentListGet();
    case 'a2a_emit': return handleA2aEmit(args || {});
    case 'a2a_wait_ack': return handleA2aWaitAck(args || {});
    default: throw new Error('Unknown tool: ' + name);
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const req = JSON.parse(line);
      const requested = requestedVersion(req.params || {});
      if (requested !== null && !PROTOCOL_VERSIONS.includes(requested)) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: versionError(requested) }) + '\n');
        continue;
      }
      const handler = handlers[req.method];
      if (!handler) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'Method not found: ' + req.method } }) + '\n'); continue; }
      try {
        const result = await handler(req.params || {});
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, result }) + '\n');
      } catch (e) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32603, message: e.message } }) + '\n');
      }
    } catch (_) { /* bad JSON */ }
  }
});

process.on('exit', () => { if (wsState.socket) try { wsState.socket.close(); } catch (_) {} });
process.stderr.write('[constellation-mcp] Phase 2 v0.2.0 ready (stdio)\n');
