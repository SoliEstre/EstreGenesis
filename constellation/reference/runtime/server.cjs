/**
 * Live Dashboard server — 에이전트 작업의 실시간 미션 컨트롤.
 *
 * - 정적 프론트(public/) 서빙
 * - GET  /api/state      → state.json (라이브 작업 보드; 에이전트가 갱신)
 * - GET  /api/events     → SSE. state.json 변경(fs.watch) 시 'state' 이벤트 푸시 (실시간 반영)
 * - POST /api/feedback   → 사용자 피드백/결정/우선순위조정을 feedback.jsonl 에 append (에이전트가 검토)
 *
 * 고정 로컬 서버(백그라운드 상주). state.json 은 마크다운 WORKLIST/PM(기록 SSoT)을 보완하는 라이브 뷰.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const PUBLIC = path.join(DIR, 'public');
const STATE = path.join(DIR, 'state.json');
const FEEDBACK = path.join(DIR, 'feedback.jsonl');
const ATT_DIR = path.join(DIR, 'feedback-atts');   // 첨부 data-URL 추출 보관 (gitignore)
const PORT = Number(process.env.PORT) || 7878;
const MAX_BODY = 32 * 1024 * 1024;                  // 첨부(이미지 등) 허용 위해 상향

const EXT_BY_MIME = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'application/pdf': '.pdf', 'text/plain': '.txt', 'application/json': '.json' };
function attExt(mime, name) {
  const fromName = name && /\.[a-z0-9]{1,8}$/i.test(name) ? name.slice(name.lastIndexOf('.')) : '';
  return EXT_BY_MIME[mime] || fromName || '.bin';
}
// data-URL 첨부는 디스크로 추출 → feedback.jsonl 은 가볍게(경로 참조) 유지, 에이전트가 파일로 열람.
// 코드/텍스트 body 는 인라인 유지(읽기 편함).
function storeAtt(att) {
  try {
    if (att && typeof att.src === 'string' && /^data:/.test(att.src)) {
      const m = /^data:([^;,]*?)(;base64)?,([\s\S]*)$/.exec(att.src);
      if (m) {
        const mime = att.mime || m[1] || 'application/octet-stream';
        const buf = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]));
        fs.mkdirSync(ATT_DIR, { recursive: true });
        const fname = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${attExt(mime, att.name)}`;
        fs.writeFileSync(path.join(ATT_DIR, fname), buf);
        const { src, ...rest } = att;
        return { ...rest, mime, bytes: buf.length, stored: `feedback-atts/${fname}` };
      }
    }
  } catch (e) { return { ...att, src: undefined, storeError: String(e) }; }
  return att;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
// 연동 문서 — public/ 밖이지만 상대 에이전트(개발자)가 URL 로 받아볼 수 있게 화이트리스트로만 노출.
// (WS-PROTOCOL.md = 공개 계약 SSoT, 레퍼런스 클라 = 포팅용. WS-INTEGRATION-AGREEMENT.md 등은 절대 노출 X)
const INTEGRATION_DOCS = {
  '/WS-PROTOCOL.md': { file: 'WS-PROTOCOL.md', type: 'text/markdown; charset=utf-8' },
  '/AGENT-CONNECT.md': { file: 'AGENT-CONNECT.md', type: 'text/markdown; charset=utf-8' },
  '/examples/ws-agent-client.cjs': { file: path.join('examples', 'ws-agent-client.cjs'), type: 'text/plain; charset=utf-8' },
  // #168/시드2.0: EstreGenesis·업스트림 증류 자료(대표 .eux + EstreUX brew 가이드) — 화이트리스트 명시 파일만
  '/eux/ws-conn-bar.eux': { file: path.join('eux', 'ws-conn-bar.eux'), type: 'text/plain; charset=utf-8' },
  '/eux/ws-tool-card.eux': { file: path.join('eux', 'ws-tool-card.eux'), type: 'text/plain; charset=utf-8' },
  '/eux/ws-collab-invite.eux': { file: path.join('eux', 'ws-collab-invite.eux'), type: 'text/plain; charset=utf-8' },
  '/BREW.md': { file: path.join('..', '..', '..', 'EstreUX', 'BREW.md'), type: 'text/markdown; charset=utf-8' },
};
const sseClients = new Set();

function readState() {
  try { return fs.readFileSync(STATE, 'utf8'); } catch { return '{"error":"no state.json yet"}'; }
}
function broadcastState() {
  const data = readState();
  for (const res of sseClients) {
    try { res.write(`event: state\ndata: ${data.replace(/\n/g, ' ')}\n\n`); } catch {}
  }
}
// state.json 변경 실시간 감지
try {
  fs.watchFile(STATE, { interval: 500 }, () => broadcastState());
} catch {}

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(readState());
    return;
  }

  if (url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
      Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*',
    });
    res.write(`event: state\ndata: ${readState().replace(/\n/g, ' ')}\n\n`);
    sseClients.add(res);
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 20000);
    req.on('close', () => { clearInterval(ping); sseClients.delete(res); });
    return;
  }

  if (url === '/api/feedback' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on('end', () => {
      let entry;
      try { entry = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'bad json' }); }
      entry.receivedAt = new Date().toISOString();
      if (Array.isArray(entry.atts)) entry.atts = entry.atts.map(storeAtt);   // 첨부 data-URL → 디스크 추출
      try {
        fs.appendFileSync(FEEDBACK, JSON.stringify(entry) + '\n');
        sendJson(res, 200, { ok: true });
      } catch (e) { sendJson(res, 500, { ok: false, error: String(e) }); }
    });
    return;
  }

  // #168 외부협업 온보딩 — /join/<group>?key= → 동적 온보딩 md(키 검증, URL 하나로 합류)
  if (url.startsWith('/join/')) {
    const key = new URL(req.url, 'http://x').searchParams.get('key');
    if (!key || wsKeyRole(key) !== 'collab') { res.writeHead(403, { 'Content-Type': 'text/markdown; charset=utf-8' }); res.end('# 접속 거부\n\n유효한 협업 키가 필요합니다. (URL 형식: `/join/collab?key=ck-…`)'); return; }
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end(wsCollabOnboardMd(req.headers.host || ('localhost:' + PORT), key));
    return;
  }

  // 연동 문서 (화이트리스트) — 상대 에이전트가 ws://host:7878 와 같은 호스트에서 가이드/레퍼런스를 바로 받아볼 수 있게
  if (INTEGRATION_DOCS[url]) {
    const doc = INTEGRATION_DOCS[url];
    fs.readFile(path.join(DIR, doc.file), (e, buf) => {
      if (e) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': doc.type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      res.end(buf);
    });
    return;
  }

  // static
  let file = path.join(PUBLIC, url === '/' ? 'index.html' : url);
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
});

// ---- WS 실시간 채널 (WS-PROTOCOL.md v0.2 multi-agent routing) — deps0 raw WS ----
// 다중 에이전트: agentId 별 등록. 대시보드(board) inbound 는 targetAgentId 로 라우팅,
// agent outbound 는 모든 board 에 broadcast(agentId 태그 → 대시보드가 채널별 구분).
const wscore = require('./ws-core.cjs');
const wsConns = new Set();
const wsAgents = new Map();                    // agentId → conn
const _a2aPending = new Map();                 // §13.8 A2A reply 페어링: 응답 에이전트 agentId → { from, contextId, parentId, at } (요청 기억)
const A2A_WINDOW = 120000;                     // reply-window(ms) — 응답 adapter 가 envelope echo 못할 때 fallback
function wsIsTelemetry(msg) { return msg && (msg.threadId === 'codex-watch' || msg.runId === 'codex-watch' || (msg.type === 'STATE_SNAPSHOT' && msg.scope === 'codex-watch')); }   // watcher telemetry 는 A2A reply-window 에 묶지 않음
const _WS_ACK_KINDS = new Set(['Ack', 'AckProcessed', 'AckCumulative', 'Ping', 'Pong']);   // §13.13 ack/ping류 — 이것 자체는 delivered ack 안 함(ACK storm 방지)
function wsIsAckable(msg) {   // §13.13 A2A delivered ack 대상: ack/ping류·telemetry 제외, msgId 있을 때만(하위호환 — 클라가 msgId 붙이기 전엔 ack 미발생)
  if (!msg || wsIsTelemetry(msg)) return false;
  if (msg.type === 'CUSTOM' && _WS_ACK_KINDS.has(msg.name)) return false;
  return !!(msg.msgId || msg.messageId);
}
// 메인(main) 에이전트 — 대상(targetAgentId) 미지정 inbound/CUSTOM 의 우선 수신자(오케스트레이터). 핸드오프로 변경 가능.
let WS_PRIMARY_ID = process.env.WS_PRIMARY_AGENT || 'local-ide-agent';
function wsPrimaryAgent() { const p = wsAgents.get(WS_PRIMARY_ID); if (p && p.alive) return p; for (const c of wsAgents.values()) if (c.alive) return c; return null; }
function wsAgentRole(c) { return c.meta.collab ? 'collab' : (c.meta.upstream ? 'upstream' : (c.meta.agentId === WS_PRIMARY_ID ? 'main' : 'local')); }   // v0.3 오케스트레이션 role (+collab #168)
// 업스트림 등록키 레지스트리 (영속, gitignore). 메인이 발급 → 사용자 경유 업스트림에 전달 → 그 키로 upstream role.
const crypto = require('crypto');
const WS_KEYS = path.join(DIR, 'ws-keys.json');
let wsKeys = [];
try { const k = JSON.parse(fs.readFileSync(WS_KEYS, 'utf8')); if (Array.isArray(k)) wsKeys = k; } catch {}
function wsSaveKeys() { try { fs.writeFileSync(WS_KEYS, JSON.stringify(wsKeys)); } catch {} }
function wsIssueKey(label, role) { const r = role || 'upstream'; const key = (r === 'collab' ? 'ck-' : 'uk-') + crypto.randomBytes(12).toString('hex'); wsKeys.push({ key, label: label || r, role: r, createdAt: new Date().toISOString() }); wsSaveKeys(); return key; }   // #168 role 메타(collab=ck- / upstream=uk-)
function wsValidKey(key) { return !!key && wsKeys.some((k) => k.key === key); }
function wsKeyRole(key) { const k = wsKeys.find((x) => x.key === key); return k ? (k.role || 'upstream') : null; }   // #168 키 role 조회(collab/upstream)
function wsRevokeKey(key) { const n = wsKeys.length; wsKeys = wsKeys.filter((k) => k.key !== key); if (wsKeys.length !== n) wsSaveKeys(); }
function wsJoinUrl(group, key, host) { return `http://${host || process.env.WS_PUBLIC_HOST || ('localhost:' + PORT)}/join/${group}?key=${encodeURIComponent(key)}`; }   // #168 그룹별 접속 URL(키 포함 → /join 온보딩 md)
function wsCollabOnboardMd(host, key) {   // #168 외부협업 온보딩 md 동적 생성(키·host 임베드, 유형 분기)
  return [
    '# 🤝 Constellation 라이브보드 — 외부 협업(collab) 합류',
    '', '환영합니다. 이 보드에 **외부 협업 에이전트**로 합류하는 안내입니다.', '',
    '## 접속 (한 줄)', '```', `ws://${host}/ws?key=${key}`, '```',
    '위 키로 접속하면 **collab role · group:collab** 으로 자동 분류됩니다.', '',
    '## 에이전트 유형별 운영',
    '### IDE/CLI 에이전트 (Claude Code · Codex · Copilot 등)',
    `- 무한대기 운영 방법론: [AGENT-CONNECT §1.9](http://${host}/AGENT-CONNECT.md) — bridge·monitor·watchdog 역할 분리, turn-held / self-wake 2패턴, 합류·상주 체크리스트`,
    `- 레퍼런스 클라(포팅용): [ws-agent-client.cjs](http://${host}/examples/ws-agent-client.cjs)`,
    '### 자율 에이전트 (API·게이트웨이 기반)',
    `- 게이트웨이 채널 구성: [WS-PROTOCOL §13.11](http://${host}/WS-PROTOCOL.md) — 런타임 WS adapter(자기 런타임에 WS 클라 두고 키 접속·HELLO·A2A·이벤트 emit)`,
    '- (향후) EstreGenesis eux 게이트웨이 클라 — 증류 예정', '',
    '## 온보딩 프롬프트 (첫 지시문 복붙)', '```',
    `이 Constellation 라이브보드에 외부 협업(collab)으로 합류해줘. 접속: ws://${host}/ws?key=${key} (HELLO 시 agentName 지정). collab role·group:collab 으로 붙고, IDE/CLI 면 AGENT-CONNECT §1.9 무한대기로 운영(bridge·self-wake watcher), 메인(local-ide-agent) 위임을 대기해. 자율 런타임이면 WS-PROTOCOL §13.11 게이트웨이 클라로 접속·이벤트 emit.`,
    '```', '',
    `_발급 키: ${key} · 호스트: ${host} · 문의: 보드 메인 에이전트_`, '',
  ].join('\n');
}
// 메인 graceful 핸드오프 (SetMain → HandoffRequested → HandoffReady/10초 타임아웃 → 전환)
let _pendingMain = null, _pendingTimer = null;
function wsCommitMain(agentId) { if (!wsAgents.has(agentId)) return; WS_PRIMARY_ID = agentId; wsPushAgentList(); wsToBoards(wscore.event('CUSTOM', { name: 'MainChanged', value: { agentId } })); }
function wsSetMain(agentId, reason) {
  if (!agentId || !wsAgents.has(agentId) || agentId === WS_PRIMARY_ID) return;
  const cur = wsPrimaryAgent();
  if (cur && cur.meta.agentId !== agentId && cur.alive) cur.send(wscore.event('CUSTOM', { name: 'HandoffRequested', value: { to: agentId, reason: reason || '' } }));
  _pendingMain = agentId;
  if (_pendingTimer) clearTimeout(_pendingTimer);
  _pendingTimer = setTimeout(() => { const m = _pendingMain; _pendingMain = null; _pendingTimer = null; if (m) wsCommitMain(m); }, 10000);
}
function wsHandoffReady() { if (_pendingMain) { if (_pendingTimer) clearTimeout(_pendingTimer); const m = _pendingMain; _pendingMain = null; _pendingTimer = null; wsCommitMain(m); } }
// 오케스트레이션 CUSTOM 처리 (agent/board 공통). 처리하면 true.
function wsHandleOrch(conn, msg) {
  if (!msg || msg.type !== 'CUSTOM') return false;
  const n = msg.name, v = msg.value || {};
  if (n === 'RegisterUpstreamKey') { const key = wsIssueKey(v.label); conn.send(wscore.event('CUSTOM', { name: 'UpstreamKeyIssued', value: { key, label: v.label || 'upstream' } })); return true; }
  if (n === 'RegisterCollabKey') { const key = wsIssueKey(v.label, 'collab'); const joinUrl = wsJoinUrl('collab', key); conn.send(wscore.event('CUSTOM', { name: 'CollabKeyIssued', value: { key, label: v.label || 'collab', joinUrl } })); return true; }   // #168 외부협업 키+접속 URL
  if (n === 'RevokeCollabKey' || n === 'RevokeUpstreamKey') { wsRevokeKey(v.key); return true; }
  if (n === 'SetMain') { wsSetMain(v.agentId, v.reason); return true; }
  if (n === 'HandoffReady') { wsHandoffReady(); return true; }
  return false;
}
// === 채널 대화 기록 (v2 — 채널별 파일 + 저장 압축: 델타/조각→완성형 1건, 채널당 cap) ===
const HISTORY = path.join(DIR, 'ws-history.json');   // 레거시 단일 파일(마이그레이션 원본)
const HISTDIR = path.join(DIR, 'ws-history');        // 채널별 .jsonl 디렉토리
const HIST_CAP = 200;                                // 채널당 보관 이벤트 수
const wsHistByChan = new Map();                      // 채널키 → events[]
const wsBuf = new Map();                             // 채널키 → { msg:Map, tool:Map } 스트리밍 누적 버퍼
const _histT = new Map();                            // 채널키 → debounce 타이머
function wsMsgChan(m) { return String((m && (m.agentId || m.targetAgentId || m.channelId)) || '_'); }   // 채널 = 에이전트 단위(agentId 우선). channelId 는 출처 뱃지로만(사용자 결정 2026-05-26)
function wsHistFile(ck) { return path.join(HISTDIR, ck.replace(/[^a-zA-Z0-9_.@:-]/g, '_').slice(0, 80) + '.jsonl'); }
function wsBufFor(ck) { let b = wsBuf.get(ck); if (!b) { b = { msg: new Map(), tool: new Map() }; wsBuf.set(ck, b); } return b; }
function wsSaveChan(ck) {
  if (_histT.has(ck)) return;
  _histT.set(ck, setTimeout(() => { _histT.delete(ck); try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(wsHistFile(ck), (wsHistByChan.get(ck) || []).map((e) => JSON.stringify(e)).join('\n') + '\n'); } catch {} }, 1000));
}
function wsStore(ck, ev) {
  if (ev && typeof ev === 'object') {   // 저장 용량 절감: 큰 result/content/text 는 truncate (실시간 relay 는 full)
    if (typeof ev.result === 'string' && ev.result.length > 2000) ev = Object.assign({}, ev, { result: ev.result.slice(0, 2000) + '…(truncated)' });
    if (typeof ev.content === 'string' && ev.content.length > 2000) ev = Object.assign({}, ev, { content: ev.content.slice(0, 2000) + '…(truncated)' });
    if (typeof ev.text === 'string' && ev.text.length > 8000) ev = Object.assign({}, ev, { text: ev.text.slice(0, 8000) + '…(truncated)' });
  }
  let a = wsHistByChan.get(ck); if (!a) { a = []; wsHistByChan.set(ck, a); } a.push(ev); if (a.length > HIST_CAP) wsHistByChan.set(ck, a.slice(-HIST_CAP)); wsSaveChan(ck);
}
function wsRecord(msg) {
  if (!msg || !msg.type || msg.type === 'HELLO' || msg.type === 'SERVER_HELLO') return;
  if (msg.type === 'CUSTOM' && (msg.name === 'AgentList' || msg.name === 'Heartbeat' || msg.name === 'PersistentAdapterSmoke' || msg.name === 'Typing')) return;   // 제어/transient 제외
  const ck = wsMsgChan(msg), buf = wsBufFor(ck), t = msg.type;
  // 저장 압축: 스트리밍 델타/조각은 버퍼 누적, 완성 시점에 1건만 저장 (런타임 relay 는 불변)
  if (t === 'TEXT_MESSAGE_START') { buf.msg.set(msg.messageId || '_', { type: 'TEXT_MESSAGE', messageId: msg.messageId, role: msg.role, text: '', agentId: msg.agentId, channelId: msg.channelId, threadId: msg.threadId, targetAgentId: msg.targetAgentId, source: msg.source, seq: msg.seq, timestamp: msg.timestamp }); return; }
  if (t === 'TEXT_MESSAGE_CONTENT') { const b = buf.msg.get(msg.messageId || '_'); if (b) b.text += (msg.delta || ''); else wsStore(ck, { type: 'TEXT_MESSAGE', messageId: msg.messageId, text: msg.delta || '', agentId: msg.agentId, channelId: msg.channelId, targetAgentId: msg.targetAgentId, source: msg.source, timestamp: msg.timestamp }); return; }
  if (t === 'TEXT_MESSAGE_END') { const k = msg.messageId || '_', b = buf.msg.get(k); if (b) { wsStore(ck, b); buf.msg.delete(k); } return; }
  if (t === 'TOOL_CALL_START') { buf.tool.set(msg.toolCallId || '_', { type: 'TOOL_CALL', toolCallId: msg.toolCallId, toolCallName: msg.toolCallName, args: msg.argsPreview, result: undefined, display: msg.display, agentId: msg.agentId, channelId: msg.channelId, threadId: msg.threadId, targetAgentId: msg.targetAgentId, source: msg.source, seq: msg.seq, timestamp: msg.timestamp }); return; }
  if (t === 'TOOL_CALL_ARGS') { const b = buf.tool.get(msg.toolCallId || '_'); if (b) { if (msg.argsPreview != null) b.args = msg.argsPreview; else if (msg.args != null) b.args = msg.args; if (msg.display) b.display = Object.assign(b.display || {}, msg.display); } return; }
  if (t === 'TOOL_CALL_END') { const b = buf.tool.get(msg.toolCallId || '_'); if (b && msg.display) b.display = Object.assign(b.display || {}, msg.display); return; }
  if (t === 'TOOL_CALL_RESULT') { const k = msg.toolCallId || '_', b = buf.tool.get(k); if (b) { b.result = (msg.resultPreview != null ? msg.resultPreview : (msg.content != null ? msg.content : msg.delta)); if (msg.display) b.display = Object.assign(b.display || {}, msg.display); wsStore(ck, b); buf.tool.delete(k); } else wsStore(ck, msg); return; }
  wsStore(ck, msg);   // 그 외(RUN/STEP/CUSTOM 등) 원형 저장
}
function wsCloseChannelHist(agentId) {   // 영구 삭제 — 채널 파일·메모리 제거
  const ck = String(agentId);
  if (_histT.has(ck)) { clearTimeout(_histT.get(ck)); _histT.delete(ck); }   // debounce 저장 취소 — 삭제 후 빈 파일 재생성 방지
  wsHistByChan.delete(ck); wsBuf.delete(ck);
  try { fs.unlinkSync(wsHistFile(ck)); } catch {}
}
const ARCHDIR = path.join(HISTDIR, 'archived');   // D: 닫은(아카이브) 채널 cold 보관(active 스캔 제외)
function wsArchFile(ck) { return path.join(ARCHDIR, ck.replace(/[^a-zA-Z0-9_.@:-]/g, '_').slice(0, 80) + '.jsonl'); }
function wsArchivedList() {   // archived/ 채널 stub 메타(키·건수·마지막 ts) — 내용은 복원 시 lazy
  const out = [];
  try { fs.mkdirSync(ARCHDIR, { recursive: true }); for (const f of fs.readdirSync(ARCHDIR)) { if (!f.endsWith('.jsonl')) continue; try { const evs = fs.readFileSync(path.join(ARCHDIR, f), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); if (!evs.length) continue; out.push({ key: wsMsgChan(evs[0]), count: evs.length, lastTs: evs[evs.length - 1].timestamp || 0 }); } catch {} } } catch {}
  return out;
}
function wsPresentIds() { const s = new Set(); for (const [id, c] of wsAgents) if (c && c.alive) s.add(id); return s; }
function wsChanActive(ck, present) {   // C: 접속 시 즉시 보낼 채널 — 메인·연결 중 에이전트가 관여하는 채널만
  if (ck === WS_PRIMARY_ID || present.has(ck)) return true;
  const a = wsHistByChan.get(ck); if (a && a.length) { const e = a[a.length - 1]; if (present.has(e.agentId) || present.has(e.targetAgentId)) return true; }
  return false;
}
function wsHistoryPayload() {   // C(lazy load): active 채널 events full + cold/archived stub(키·건수만, 내용은 on-demand)
  const present = wsPresentIds(), events = [], cold = [];
  for (const [ck, a] of wsHistByChan) {
    if (!a.length) continue;
    if (wsChanActive(ck, present)) { for (const e of a) events.push(e); }
    else cold.push({ key: ck, count: a.length, lastTs: a[a.length - 1].timestamp || 0 });
  }
  events.sort((x, y) => (x.timestamp || 0) - (y.timestamp || 0));
  return { events, cold, archived: wsArchivedList() };
}
function wsLoadChannel(ck) {   // RequestChannelHistory 응답용 — 메모리(active) 우선, 없으면 archived(cold)에서 로드 + active 복귀
  let a = wsHistByChan.get(ck);
  if (a && a.length) return a;
  try { const af = wsArchFile(ck); if (fs.existsSync(af)) { const evs = fs.readFileSync(af, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); wsHistByChan.set(ck, evs); try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(wsHistFile(ck), evs.map((e) => JSON.stringify(e)).join('\n') + '\n'); fs.unlinkSync(af); } catch {} return evs; } } catch {}   // D: cold → active 복귀
  return a || [];
}
function wsArchiveChannel(ck) {   // D: active → archived(cold) 이동 — 메모리 제거 + 파일 이동(active cap 제외, 복원 가능)
  if (!ck) return;
  if (_histT.has(ck)) { clearTimeout(_histT.get(ck)); _histT.delete(ck); }   // debounce 저장 취소 — 이동 후 active 빈 파일 재생성 방지
  const a = wsHistByChan.get(ck);
  try {
    fs.mkdirSync(ARCHDIR, { recursive: true });
    if (a && a.length) { fs.writeFileSync(wsArchFile(ck), a.map((e) => JSON.stringify(e)).join('\n') + '\n'); try { fs.unlinkSync(wsHistFile(ck)); } catch {} }
    else { try { fs.renameSync(wsHistFile(ck), wsArchFile(ck)); } catch {} }   // 메모리에 없고 파일만 있는 경우
  } catch {}
  wsHistByChan.delete(ck); wsBuf.delete(ck);
}
function wsLoadAll() {   // 부팅: ws-history/ 채널 파일 → 메모리(내용 기반 채널키 재계산) + 정규화(에이전트 단위 통합·시간순·orphan 정리)
  try {
    fs.mkdirSync(HISTDIR, { recursive: true });
    const files = fs.readdirSync(HISTDIR).filter((f) => f.endsWith('.jsonl'));
    for (const f of files) { try { const evs = fs.readFileSync(path.join(HISTDIR, f), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); for (const ev of evs) { const ck = wsMsgChan(ev); let a = wsHistByChan.get(ck); if (!a) { a = []; wsHistByChan.set(ck, a); } a.push(ev); } } catch {} }
    const valid = new Set();   // 채널키별 1파일로 재저장(통합 결과) + 옛 channelId 파일(orphan) 제거 — agentId 우선 전환 1회 정규화
    for (const [ck, a] of wsHistByChan) {
      a.sort((x, y) => (x.timestamp || 0) - (y.timestamp || 0));
      if (a.length > HIST_CAP) wsHistByChan.set(ck, a.slice(-HIST_CAP));
      const fn = wsHistFile(ck);
      try { fs.writeFileSync(fn, wsHistByChan.get(ck).map((e) => JSON.stringify(e)).join('\n') + '\n'); valid.add(path.basename(fn)); } catch {}
    }
    for (const f of files) if (!valid.has(f)) { try { fs.unlinkSync(path.join(HISTDIR, f)); } catch {} }
  } catch {}
}
function wsMigrate() {   // 1회: 레거시 ws-history.json → 채널별 압축 분리(+원본 .bak)
  let legacy = [];
  try { const h = JSON.parse(fs.readFileSync(HISTORY, 'utf8')); if (Array.isArray(h)) legacy = h; } catch { try { fs.mkdirSync(HISTDIR, { recursive: true }); } catch {} return; }
  for (const m of legacy) wsRecord(m);   // 재생 → 압축·채널분리(메모리)
  for (const [ck, b] of wsBuf) { for (const [, ev] of b.msg) if (ev.text) wsStore(ck, ev); for (const [, ev] of b.tool) wsStore(ck, ev); }   // 미완성 flush
  wsBuf.clear();
  try { fs.mkdirSync(HISTDIR, { recursive: true }); for (const [ck, a] of wsHistByChan) fs.writeFileSync(wsHistFile(ck), a.map((e) => JSON.stringify(e)).join('\n') + '\n'); fs.renameSync(HISTORY, HISTORY + '.bak'); } catch {}
  console.log('[ws migrate] ws-history.json(%d evts) → ws-history/ 압축 분리(%d ch)', legacy.length, wsHistByChan.size);
}
if (fs.existsSync(HISTDIR)) wsLoadAll(); else wsMigrate();
function wsAgentList() {
  return [...wsAgents.entries()].filter(([, c]) => c.alive).map(([id, c]) => ({ agentId: id, agentName: c.meta.agentName || id, role: wsAgentRole(c) }));
}
function wsToBoards(msg) { for (const c of wsConns) if (c.meta.role !== 'agent' && c.alive) c.send(msg); }
function wsToAll(msg) { for (const c of wsConns) if (c.alive) c.send(msg); }   // 시스템 공지(ServerNotice 등) — 에이전트+board 전체
function wsPushAgentList() { wsToBoards(wscore.event('CUSTOM', { name: 'AgentList', value: { agents: wsAgentList() } })); }
server.on('upgrade', (req, socket) => {
  if (req.url.split('?')[0] !== '/ws') { socket.destroy(); return; }
  const conn = wscore.handleUpgrade(req, socket);
  if (!conn) return;
  try { const u = new URL(req.url, 'http://x').searchParams; const k = u.get('key') || u.get('upstreamKey') || u.get('collabKey'); const kr = wsKeyRole(k); if (kr === 'collab') conn.meta.collab = true; else if (kr === 'upstream' || wsValidKey(u.get('upstreamKey'))) conn.meta.upstream = true; if (k != null) console.log('[ws upgrade] key=%s role=%s', String(k).slice(0, 14) + '…', kr); } catch {}   // #168 키 role 판정(collab/upstream)
  wsConns.add(conn);
  conn.send(wscore.event('SERVER_HELLO', { sessionId: conn.id, protocolVersion: '0.3', serverTime: new Date().toISOString() }));
  conn.send(wscore.event('CUSTOM', { name: 'AgentList', value: { agents: wsAgentList() } }));   // 먼저 role/이름 — 모니터 a2a 분류(§13.5)·History 재생이 role 을 참조하므로
  { const _h = wsHistoryPayload(); if (_h.events.length || _h.cold.length || _h.archived.length) conn.send(wscore.event('CUSTOM', { name: 'History', value: _h })); }   // C(lazy): active 채널 events + cold/archived stub(내용은 탭 클릭·복원 시 on-demand)
  conn.onclose = () => {
    wsConns.delete(conn);
    if (conn.meta.role === 'agent' && conn.meta.agentId && wsAgents.get(conn.meta.agentId) === conn) {
      wsAgents.delete(conn.meta.agentId);
      wsPushAgentList();                                        // 해제 알림 → 대시보드 탭 갱신
    }
  };
  conn.onmessage = (msg) => {
    if (msg && msg.type === 'HELLO') {                          // 에이전트 등록 (agentId 별, 동일 id 재접속 시 기존 대체)
      conn.meta.role = 'agent';
      conn.meta.agentId = msg.agentId || ('agent-' + conn.id.slice(0, 4));
      conn.meta.clientId = msg.clientId;
      conn.meta.agentName = msg.agentName || conn.meta.agentId;
      { const k = msg.key || msg.upstreamKey || msg.collabKey; const kr = wsKeyRole(k); if (kr === 'collab') conn.meta.collab = true; else if (kr === 'upstream' || (msg.upstreamKey && wsValidKey(msg.upstreamKey))) conn.meta.upstream = true; }   // #168 HELLO 키 role 판정(collab/upstream)
      conn.meta.roleHint = msg.role || '';                       // local/upstream 힌트(최종 판정은 키·main)
      console.log('[ws HELLO] agent=%s upstreamKey(hello)=%s → role=%s', conn.meta.agentId, msg.upstreamKey ? String(msg.upstreamKey).slice(0, 14) + '…' : '(none)', wsAgentRole(conn));   // role 전환 audit
      const prev = wsAgents.get(conn.meta.agentId);
      if (prev && prev !== conn) { try { prev.close(); } catch {} }
      wsAgents.set(conn.meta.agentId, conn);
      wsPushAgentList();
      return;
    }
    if (conn.meta.role === 'agent') {                           // 에이전트 outbound
      if (wsHandleOrch(conn, msg)) return;                       // 오케스트레이션 CUSTOM(RegisterUpstreamKey/RevokeUpstreamKey/SetMain/HandoffReady)
      if (msg && msg.type === 'CUSTOM' && (msg.name === 'Heartbeat' || msg.name === 'PersistentAdapterSmoke' || msg.name === 'Typing')) return;   // liveness/transient — relay·board·기록 안 함
      if (msg && msg.agentId == null) msg.agentId = conn.meta.agentId;
      if (msg && msg.source == null) msg.source = 'agent';        // v2.2.4 source_stamp_truth (server.eux derive) — client-set 우선, server 폴백(backward compat)
      if (msg && msg.type === 'CUSTOM' && msg.name === 'ServerNotice') { wsToAll(msg); wsRecord(msg); return; }   // 재시작/오프라인/온라인 공지 → 모든 연결(에이전트+board) broadcast
      // v2.2.4 targetFallback + WARN (silent-disable 원칙 정합): top-level 누락 시 value.targetAgentId 폴백, 발견 통보
      if (msg && msg.targetAgentId == null && msg.value && msg.value.targetAgentId) {
        msg.targetAgentId = msg.value.targetAgentId;
        console.warn('[ws] WARN: targetAgentId fallback from value.targetAgentId (agent outbound from %s) — client envelope shape mismatch', conn.meta.agentId);
      }
      const tgt = msg && msg.targetAgentId;                      // A2A: 다른 에이전트 대상이면 상대에게 relay
      if (tgt && wsAgents.has(tgt)) {
        const d = wsAgents.get(tgt); if (d && d.alive) {
          d.send(msg);
          if (wsIsAckable(msg) && conn.alive) {   // §13.13 서버 delivered ack — relay 성공 시 발신자에게 자동 회신(전달 계층, board 미표시=과확인 피로 게이팅). 재기동 시 발효.
            const _ackEv = wscore.event('CUSTOM', { name: 'Ack', value: { ackFor: msg.msgId || msg.messageId, kind: 'delivered', from: tgt } });
            _ackEv.targetAgentId = conn.meta.agentId; _ackEv.source = 'server';
            conn.send(_ackEv);
          }
        }
        _a2aPending.set(tgt, { from: conn.meta.agentId, contextId: msg.contextId || msg.threadId, parentId: msg.messageId || msg.id, at: Date.now() });   // §13.8 A2A 요청 기억(응답 페어링용)
      } else {
        const rp = _a2aPending.get(conn.meta.agentId);            // §13.8 reply-window fallback: 최근 A2A 요청을 받았으면 board 응답을 원 요청자에게 A2A 로 페어링(응답 adapter 가 envelope echo 못할 때)
        if (rp && Date.now() - rp.at < A2A_WINDOW && !wsIsTelemetry(msg) && !(msg.type === 'CUSTOM' && msg.name === 'ConnectionRestored')) {
          if (msg.targetAgentId == null) msg.targetAgentId = rp.from;
          if (msg.contextId == null && rp.contextId) msg.contextId = rp.contextId;
          if (msg.parentId == null && rp.parentId) msg.parentId = rp.parentId;
          const d = wsAgents.get(rp.from); if (d && d.alive && d !== conn) d.send(msg);   // 원 요청자에게도 A2A relay
          if (msg.type === 'RUN_FINISHED') _a2aPending.delete(conn.meta.agentId);          // 응답 완료 → 페어링 종료
        } else if (msg && !wsIsTelemetry(msg) && msg.type === 'CUSTOM' && msg.name !== 'ConnectionRestored') { const p = wsPrimaryAgent(); if (p && p !== conn && p.alive) p.send(msg); }   // 대상 미지정 CUSTOM(핸드오프 등) → 메인 우선. watcher telemetry 는 board broadcast 만.
      }
      wsToBoards(msg);                                           // 모니터링: 항상 board 로 broadcast (A2A 도 대시보드가 관찰)
      wsRecord(msg);                                             // 대화 기록 영속
      return;
    }
    // 오케스트레이션 (board/사용자발 SetMain·RegisterUpstreamKey 등)
    if (wsHandleOrch(conn, msg)) return;
    // ✕ 닫기 → 해당 채널 기록 삭제 + 모든 board 갱신
    if (msg && msg.type === 'CUSTOM' && msg.name === 'CloseChannel') { wsCloseChannelHist(msg.value && msg.value.agentId); wsToBoards(msg); return; }
    // C(lazy): 탭 클릭·세션 복원 시 채널 내용 on-demand 요청 → 해당 채널 events 응답
    if (msg && msg.type === 'CUSTOM' && msg.name === 'RequestChannelHistory') { const ck = String((msg.value && msg.value.channelKey) || ''); conn.send(wscore.event('CUSTOM', { name: 'ChannelHistory', value: { channelKey: ck, events: wsLoadChannel(ck) } })); return; }
    // D: ✕ 닫기 = 아카이브 → 해당 채널을 archived/(cold)로 이동(active 스캔·cap 제외, 복원 시 cold 로드)
    if (msg && msg.type === 'CUSTOM' && msg.name === 'ArchiveChannel') { wsArchiveChannel(String((msg.value && msg.value.agentId) || (msg.value && msg.value.channelKey) || '')); return; }
    // 첨부 data-URL → 디스크 추출(feedback-atts), 경량 경로 참조로 (history·relay 가벼움)
    if (msg && msg.type === 'CUSTOM' && msg.name === 'UserPrompt' && msg.value && Array.isArray(msg.value.atts) && msg.value.atts.length) msg.value.atts = msg.value.atts.map(storeAtt);
    // v2.2.4 source_stamp_truth (server.eux derive) — board/사용자/협업 폴백
    if (msg && msg.source == null) msg.source = conn.meta.collab ? 'collab' : 'board';
    // v2.2.4 targetFallback + WARN (silent-disable 정합) — board inbound 측
    if (msg && msg.targetAgentId == null && msg.value && msg.value.targetAgentId) {
      msg.targetAgentId = msg.value.targetAgentId;
      console.warn('[ws] WARN: targetAgentId fallback from value.targetAgentId (board inbound) — client envelope shape mismatch');
    }
    // 대시보드/사용자 inbound → targetAgentId 라우팅 (없으면 에이전트 1개일 때 그쪽)
    const target = msg && msg.targetAgentId;
    const dst = target ? wsAgents.get(target) : wsPrimaryAgent();   // 대상 미지정 → 메인 에이전트 우선
    if (dst && dst.alive) dst.send(msg);
    for (const c of wsConns) if (c !== conn && c.meta.role !== 'agent' && c.alive) c.send(msg);   // 다른 board 에도 표시(멀티 board·외부 발신 입력 동기) — 보낸 board 는 로컬 표시라 제외
    wsRecord(msg);                                               // 사용자 입력도 기록 영속
  };
});

server.listen(PORT, () => console.log(`Live dashboard → http://localhost:${PORT}/  (state: ${STATE})  [WS: /ws]`));
