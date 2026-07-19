/**
 * Constellation Live Dashboard server — 에이전트 작업의 실시간 미션 컨트롤 (deps-0 HTTP + WS router + integration-docs whitelist).
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
const push = require('./push.cjs');                 // #3b webpush (tier-2) — deps-0 VAPID tickle

const DIR = __dirname;
const PUBLIC = path.join(DIR, 'public');
const STATE = path.join(DIR, 'state.json');
const FEEDBACK = path.join(DIR, 'feedback.jsonl');
const ATT_DIR = path.join(DIR, 'feedback-atts');   // 첨부 data-URL 추출 보관 (gitignore)
const PORT = Number(process.env.PORT) || 7878;
const MAX_BODY = 32 * 1024 * 1024;                  // 첨부(이미지 등) 허용 위해 상향
push.init(DIR, { subject: 'mailto:admin@constellation.local' });   // #3b VAPID 키쌍 로드/생성(.vapid.json) + 구독 로드(.push-subs.json)

// ── #5a 표면별 접근 제어 + 노출 (Constellation §13.25) ─────────────────────────────────────
// access.json (server 옆, gitignore) = { expose:bool, ui:{allowlist}, agent:{allowlist,requireKey}, mcp:{allowlist} }.
//   - allowlist: null/미배열 = 전체 허용(기본). 배열이면 그 IP/CIDR 만 통과. loopback 은 항상 통과.
//   - 비-노출(loopback bind) 환경에선 IP 게이트 전체 무동작 (로컬 전용이라 의미 없음).
//   - agent.requireKey: true 면 노출 환경에서 무키/무효키 /ws 연결 거부 (v2.4.11 무인증 board 벡터 차단). 기본 false.
//   - expose (#5a-4): true 면 WS_BIND 미지정 시 0.0.0.0(LAN 노출) 로 bind. WS_BIND env 가 있으면 그게 우선. 변경은 /api/restart 로 적용(bind-time).
// 순수 가산: access.json 부재 시 동작 무변화(loopback + 전체 허용). (UI=HTTP 표면 · agent/MCP=WS 표면, MCP 는 HELLO capabilities 로 식별.)
const ACCESS = process.env.ACCESS_FILE || path.join(DIR, 'access.json');
const _accessDefault = () => ({ expose: false, ui: { allowlist: null }, agent: { allowlist: null, requireKey: false }, mcp: { allowlist: null } });
let accessCfg = _accessDefault();
function loadAccess() {
  try {
    const j = JSON.parse(fs.readFileSync(ACCESS, 'utf8'));
    accessCfg = {
      expose: !!(j && j.expose),
      ui: { allowlist: Array.isArray(j && j.ui && j.ui.allowlist) ? j.ui.allowlist.map(String) : null },
      agent: { allowlist: Array.isArray(j && j.agent && j.agent.allowlist) ? j.agent.allowlist.map(String) : null, requireKey: !!(j && j.agent && j.agent.requireKey) },
      mcp: { allowlist: Array.isArray(j && j.mcp && j.mcp.allowlist) ? j.mcp.allowlist.map(String) : null },
    };
  } catch { accessCfg = _accessDefault(); }   // 파일 부재/파손 = 기본(비노출 + 전체 허용) (fail-open: 보안 게이트는 명시 opt-in)
}
loadAccess();
try { fs.watchFile(ACCESS, { interval: 1000 }, () => loadAccess()); } catch {}   // allowlist/requireKey hot-reload (expose 변경은 /api/restart 로 bind 재적용)

// v2.4.11 secure-by-default 바인드. WS_BIND env 우선, 없으면 access.json 의 expose 로 결정 (#5a-4 — 그래서 access block 뒤에 정의).
const WS_BIND = process.env.WS_BIND || (accessCfg.expose ? '0.0.0.0' : '127.0.0.1');
const _isLoopback = WS_BIND === '127.0.0.1' || WS_BIND === '::1' || WS_BIND === 'localhost';
function normIp(ip) { return ip ? String(ip).replace(/^::ffff:/, '') : ''; }   // IPv4-mapped IPv6 prefix 제거
function isLoopbackIp(ip) { ip = normIp(ip); return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('127.'); }
function ip4ToInt(s) { const p = String(s).split('.'); if (p.length !== 4) return null; let n = 0; for (const x of p) { if (!/^\d{1,3}$/.test(x)) return null; const v = Number(x); if (v > 255) return null; n = (n * 256) + v; } return n >>> 0; }
// allowlist 항목 매칭 — 정확-IP(IPv4/IPv6) 또는 IPv4 CIDR(a.b.c.d/n). ip 는 normIp 적용값. (IPv6 CIDR 미지원 — 정확-IPv6 는 매칭됨.)
function ipMatch(entry, ip) {
  entry = String(entry).trim(); if (!entry) return false;
  if (entry === ip) return true;
  const slash = entry.indexOf('/');
  if (slash > 0) {
    const base = ip4ToInt(entry.slice(0, slash)), cand = ip4ToInt(ip), bits = Number(entry.slice(slash + 1));
    if (base == null || cand == null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
    const mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
    return (base & mask) === (cand & mask);
  }
  return false;
}
function surfaceAllowed(surface, ip) {
  if (_isLoopback) return true;                       // 비-노출 = 게이트 무동작
  if (isLoopbackIp(ip)) return true;                  // 로컬은 항상 통과
  const al = accessCfg[surface] && accessCfg[surface].allowlist;
  if (!Array.isArray(al)) return true;                // null = 전체 허용(기본)
  const _ip = normIp(ip); return al.some((e) => ipMatch(e, _ip));   // 정확-IP 또는 CIDR 대역 매칭
}

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

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon' };
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
  // /BREW.md — EstreUX brew guide. Standalone-deployment fallback: serve the vendored copy alongside server.cjs
  // when present (any of "BREW.md" / "estreux-engine/BREW.md") so a downstream adopter that vendored EstreUX via
  // giget gets the endpoint working out-of-the-box; the historical sibling layout (..\..\..\EstreUX\BREW.md) is
  // tried last for repo-internal in-tree development. Bundle 007 F1: previously hard-coded to the sibling path,
  // which 404'd in every standalone deployment.
  '/BREW.md': { file: ['BREW.md', path.join('estreux-engine', 'BREW.md'), path.join('..', '..', '..', 'EstreUX', 'BREW.md')], type: 'text/markdown; charset=utf-8', optional: true },
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

  // #5a UI 표면 IP allowlist — 대시보드·state·events·feedback·정적. /join·연동문서는 키-게이트 agent-facing 이라 제외.
  if (!(url.startsWith('/join/') || INTEGRATION_DOCS[url])) {
    if (!surfaceAllowed('ui', req.socket.remoteAddress)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 — UI 접근 거부: 이 IP 는 ui allowlist 에 없어요. (로컬에서 access.json 의 ui.allowlist 에 추가하거나, 비워서 전체 허용)');
      return;
    }
  }

  if (url === '/api/access') {   // #5a 접근 제어 설정 — GET=조회(UI 게이트 통과분) · POST=loopback 전용(운영자 로컬 관리)
    if (req.method === 'GET') return sendJson(res, 200, { ok: true, access: accessCfg, exposed: !_isLoopback, bind: WS_BIND });
    if (req.method === 'POST') {
      if (!isLoopbackIp(req.socket.remoteAddress)) return sendJson(res, 403, { ok: false, error: 'access.json 변경은 로컬(loopback)에서만 가능해요.' });
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
      req.on('end', () => {
        let next; try { next = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'bad json' }); }
        const clean = {
          expose: !!(next && next.expose),
          ui: { allowlist: Array.isArray(next && next.ui && next.ui.allowlist) ? next.ui.allowlist.map(String) : null },
          agent: { allowlist: Array.isArray(next && next.agent && next.agent.allowlist) ? next.agent.allowlist.map(String) : null, requireKey: !!(next && next.agent && next.agent.requireKey) },
          mcp: { allowlist: Array.isArray(next && next.mcp && next.mcp.allowlist) ? next.mcp.allowlist.map(String) : null },
        };
        try { fs.writeFileSync(ACCESS, JSON.stringify(clean, null, 2) + '\n'); loadAccess(); sendJson(res, 200, { ok: true, access: accessCfg }); }
        catch (e) { sendJson(res, 500, { ok: false, error: String(e) }); }
      });
      return;
    }
    res.writeHead(405); res.end('405'); return;
  }

  if (url === '/api/restart' && req.method === 'POST') {   // #5a-4 self-restart — 저장한 expose(bind) 적용. loopback 전용.
    if (!isLoopbackIp(req.socket.remoteAddress)) return sendJson(res, 403, { ok: false, error: '재시작은 로컬(loopback)에서만 가능해요.' });
    sendJson(res, 200, { ok: true, restarting: true });
    console.log('[server] #5a-4 /api/restart — restart-self-board.ps1 스폰 후 self-exit (새 서버가 access.json expose 로 bind)');
    try {
      const ps = path.join(DIR, 'restart-self-board.ps1');
      if (fs.existsSync(ps) && process.platform === 'win32') {
        // Windows 완전 분리: cmd /c start (detached spawn 단독은 부모 self-exit 시 child 가 안 살아남음 — 실측 확인). start "" /min 로 독립 프로세스.
        const _ch = require('child_process').spawn('cmd.exe', ['/c', 'start', '', '/min', 'powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps], { detached: true, stdio: 'ignore', windowsHide: true });
        _ch.on('error', (e) => console.warn('[server] restart spawn error:', e.message));
        _ch.unref();
      } else { console.warn('[server] restart-self-board.ps1 부재 또는 비-Windows — 자동 재시작 불가, 수동 재기동 필요'); }
    } catch (e) { console.warn('[server] restart spawn 실패:', e.message); }
    setTimeout(() => process.exit(0), 700);
    return;
  }

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

  // ── #3b Web Push (tier-2) — VAPID tickle 구독/발송 엔드포인트 (deps-0, push.cjs). UI 표면이라 #5a ui allowlist 게이트 적용. ──
  if (url === '/api/push/vapid-public-key') { return sendJson(res, 200, { key: push.publicKey() }); }
  if (url === '/api/push/latest') { return sendJson(res, 200, push.latest()); }
  if (url === '/api/push/subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on('end', () => { let sub; try { sub = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'bad json' }); } sendJson(res, 200, push.subscribe(sub)); });
    return;
  }
  if (url === '/api/push/unsubscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on('end', () => { let b; try { b = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'bad json' }); } sendJson(res, 200, push.unsubscribe(b && b.endpoint)); });
    return;
  }

  // #168 외부협업 온보딩 + v2.3.23 upstream 확장 — /join/<group>?key= → 동적 온보딩 md(키 검증, URL 하나로 합류)
  if (url.startsWith('/join/')) {
    const group = url.split('?')[0].slice('/join/'.length);   // 'collab' | 'upstream'
    const key = new URL(req.url, 'http://x').searchParams.get('key');
    const keyRole = wsKeyRole(key);
    if (group === 'collab') {
      if (!key || keyRole !== 'collab') { res.writeHead(403, { 'Content-Type': 'text/markdown; charset=utf-8' }); res.end('# 접속 거부\n\n유효한 협업 키가 필요합니다. (URL 형식: `/join/collab?key=ck-…`)'); return; }
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      res.end(wsCollabOnboardMd(req.headers.host || ('localhost:' + PORT), key));
      return;
    }
    if (group === 'upstream') {
      if (!key || keyRole !== 'upstream') { res.writeHead(403, { 'Content-Type': 'text/markdown; charset=utf-8' }); res.end('# 접속 거부\n\n유효한 업스트림 키가 필요합니다. (URL 형식: `/join/upstream?key=uk-…`)'); return; }
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      res.end(wsUpstreamOnboardMd(req.headers.host || ('localhost:' + PORT), key));
      return;
    }
    if (group === 'peer') {   // v2.4.52 — peer-main 온보딩 (§13.9.3; 자율 upstream 과 구분)
      if (!key || keyRole !== 'peer') { res.writeHead(403, { 'Content-Type': 'text/markdown; charset=utf-8' }); res.end('# 접속 거부\n\n유효한 피어 키가 필요합니다. (URL 형식: `/join/peer?key=pk-…`)'); return; }
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      res.end(wsPeerOnboardMd(req.headers.host || ('localhost:' + PORT), key));
      return;
    }
    if (group === 'local') {   // v2.4.1 §3.6 — label 만 받음 (키는 URL 노출 안 함)
      const label = new URL(req.url, 'http://x').searchParams.get('label');
      if (!label || !keyValidateLabelSafe(label)) { res.writeHead(400, { 'Content-Type': 'text/markdown; charset=utf-8' }); res.end('# 잘못된 라벨\n\n로컬 키 라벨은 `[a-zA-Z0-9_-]+` 패턴이어야 해요. (URL 형식: `/join/local?label=worker-1`)'); return; }
      const k = keyStore.keys.find((x) => x.kind === 'local' && x.label === label && x.state !== 'REVOKED' && x.state !== 'DELETED');
      if (!k) { res.writeHead(404, { 'Content-Type': 'text/markdown; charset=utf-8' }); res.end(`# 알 수 없는 로컬 키\n\n라벨 \`${label}\` 의 활성 로컬 키가 없어요.`); return; }
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
      res.end(wsLocalOnboardMd(req.headers.host || ('localhost:' + PORT), label, k.roleDescription));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/markdown; charset=utf-8' }); res.end('# 알 수 없는 그룹\n\n지원: `/join/collab` · `/join/upstream` · `/join/peer` · `/join/local`'); return;
  }

  // 연동 문서 (화이트리스트) — 상대 에이전트가 ws://host:7878 와 같은 호스트에서 가이드/레퍼런스를 바로 받아볼 수 있게
  // doc.file이 string이면 단일 경로; array이면 순차 탐색(첫 번째 존재 파일 사용); doc.optional=true이면 모두 부재 시 404 graceful.
  if (INTEGRATION_DOCS[url]) {
    const doc = INTEGRATION_DOCS[url];
    const candidates = Array.isArray(doc.file) ? doc.file : [doc.file];
    const tryNext = (i) => {
      if (i >= candidates.length) {
        // optional: graceful 404 with note instead of bare 404 so the operator can see it was a documented endpoint
        if (doc.optional) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 — ' + url + ' not vendored in this deployment (optional)'); }
        else { res.writeHead(404); res.end('404'); }
        return;
      }
      fs.readFile(path.join(DIR, candidates[i]), (e, buf) => {
        if (e) { tryNext(i + 1); return; }
        res.writeHead(200, { 'Content-Type': doc.type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
        res.end(buf);
      });
    };
    tryNext(0);
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

// §13.13.2 v0.4 at-least-once relay reliability — server-side pending queue + redelivery scheduler.
//   Per targeted CUSTOM with msgId, retain a pending entry until commitment-tier AckProcessed arrives.
//   Redeliver if first-attempt-ts exceeds threshold + attempt-count < max + recipient AgentList-present.
//   After max attempts → emit RelayUnreachable to sender + clear pending.
//   Provisional defaults per §13.13.2 (queue cap 256 · 5min prod / 30s dogfood threshold · max 3 attempts).
const _RELAY_PENDING_MAX = Number(process.env.RELAY_PENDING_MAX || 256);     // per-target FIFO cap
const _RELAY_THRESHOLD_MS = Number(process.env.RELAY_THRESHOLD_MS || 30 * 1000);   // 30s dogfood default; 5*60*1000 for prod
const _RELAY_MAX_ATTEMPTS = Number(process.env.RELAY_MAX_ATTEMPTS || 3);
const _RELAY_SCAN_INTERVAL_MS = 10 * 1000;   // scheduler tick
const _relayPending = new Map();                                            // targetAgentId → Array<{ msgId, payload, firstAt, attempts, hasEmbeddedAttachment }>
function _hasEmbeddedAttachment(msg) {
  const atts = msg && msg.value && (msg.value.attachments || (msg.value.attachment && [msg.value.attachment]) || msg.value.files);
  if (!Array.isArray(atts)) return false;
  return atts.some((a) => a && (a.source === 'embedded' || a.dataUrl));
}
function _relayPendingAdd(tgt, msg) {
  if (!msg || !msg.msgId) return;                                            // §13.13.2: only msgId-bearing envelopes are tracked
  let q = _relayPending.get(tgt);
  if (!q) { q = []; _relayPending.set(tgt, q); }
  if (q.length >= _RELAY_PENDING_MAX) q.shift();                            // FIFO eviction on cap
  q.push({ msgId: msg.msgId, payload: msg, firstAt: Date.now(), attempts: 1, hasEmbeddedAttachment: _hasEmbeddedAttachment(msg) });
}
function _relayPendingClear(tgt, msgId) {
  const q = _relayPending.get(tgt);
  if (!q) return false;
  const i = q.findIndex((e) => e.msgId === msgId);
  if (i < 0) return false;
  q.splice(i, 1);
  if (!q.length) _relayPending.delete(tgt);
  return true;
}
function _relayUnreachableEmit(senderAgentId, entry, targetAgentId, lastError) {
  const sender = wsAgents.get(senderAgentId);
  if (!sender || !sender.alive) return;
  const ev = wscore.event('CUSTOM', { name: 'RelayUnreachable', value: { msgId: entry.msgId, targetAgentId, attemptCount: entry.attempts, lastError: lastError || 'max-attempts-exceeded' } });
  ev.targetAgentId = senderAgentId; ev.source = 'server';
  sender.send(ev);
}
function _relayScheduleTick() {
  const now_ = Date.now();
  for (const [tgt, q] of _relayPending) {
    const d = wsAgents.get(tgt);
    const recipientPresent = d && d.alive;
    for (let i = q.length - 1; i >= 0; i--) {
      const e = q[i];
      if (now_ - e.firstAt < _RELAY_THRESHOLD_MS) continue;                  // not yet due
      const maxForEntry = e.hasEmbeddedAttachment ? Math.ceil(_RELAY_MAX_ATTEMPTS / 2) : _RELAY_MAX_ATTEMPTS;
      if (e.attempts >= maxForEntry) {
        const senderId = (e.payload.agentId) || null;
        if (senderId) _relayUnreachableEmit(senderId, e, tgt, recipientPresent ? 'commitment-ack-absent' : 'recipient-absent');
        q.splice(i, 1);
        continue;
      }
      if (!recipientPresent) continue;                                       // defer redelivery until reconnect
      try { d.send(e.payload); e.attempts++; e.firstAt = now_; } catch {}
    }
    if (!q.length) _relayPending.delete(tgt);
  }
}
setInterval(_relayScheduleTick, _RELAY_SCAN_INTERVAL_MS).unref();
function wsIsTelemetry(msg) { return msg && (msg.threadId === 'codex-watch' || msg.runId === 'codex-watch' || (msg.type === 'STATE_SNAPSHOT' && msg.scope === 'codex-watch')); }   // watcher telemetry 는 A2A reply-window 에 묶지 않음
const _WS_ACK_KINDS = new Set(['Ack', 'AckProcessed', 'AckCumulative', 'Ping', 'Pong']);   // §13.13 ack/ping류 — 이것 자체는 delivered ack 안 함(ACK storm 방지)
function wsIsAckable(msg) {   // §13.13 A2A delivered ack 대상: ack/ping류·telemetry 제외, msgId 있을 때만(하위호환 — 클라가 msgId 붙이기 전엔 ack 미발생)
  if (!msg || wsIsTelemetry(msg)) return false;
  if (msg.type === 'CUSTOM' && _WS_ACK_KINDS.has(msg.name)) return false;
  return !!(msg.msgId || msg.messageId);
}
// 메인(main) 에이전트 — 대상(targetAgentId) 미지정 inbound/CUSTOM 의 우선 수신자(오케스트레이터). 핸드오프로 변경 가능.
let WS_PRIMARY_ID = process.env.WS_PRIMARY_AGENT || 'main-agent';   // generic default (dashboard WS_LOCAL 과 일관); 다운스트림이 자기 환경 메인 agentId 를 env 로 주입
function wsPrimaryAgent() { const p = wsAgents.get(WS_PRIMARY_ID); if (p && p.alive) return p; for (const c of wsAgents.values()) if (c.alive) return c; return null; }
function wsAgentRole(c) { return c.meta.collab ? 'collab' : (c.meta.peer ? 'peer' : (c.meta.upstream ? 'upstream' : (c.meta.agentId === WS_PRIMARY_ID ? 'main' : 'local'))); }   // v0.3 오케스트레이션 role (+collab #168, +peer v2.4.52 — peer-main ≠ 자율 upstream)
// 업스트림 등록키 레지스트리 (영속, gitignore). 메인이 발급 → 사용자 경유 업스트림에 전달 → 그 키로 upstream role.
const crypto = require('crypto');
const WS_KEYS = path.join(DIR, 'ws-keys.json');
let wsKeys = [];
try { const k = JSON.parse(fs.readFileSync(WS_KEYS, 'utf8')); if (Array.isArray(k)) wsKeys = k; } catch {}
function wsSaveKeys() { try { fs.writeFileSync(WS_KEYS, JSON.stringify(wsKeys)); } catch {} }
function wsIssueKey(label, role) { const r = role || 'upstream'; const prefix = r === 'collab' ? 'ck-' : r === 'local' ? 'lk-' : r === 'peer' ? 'pk-' : 'uk-'; const key = prefix + crypto.randomBytes(12).toString('hex'); wsKeys.push({ key, label: label || r, role: r, createdAt: new Date().toISOString() }); wsSaveKeys(); return key; }   // #168 role 메타(collab=ck- / upstream=uk- / v2.4.1 local=lk- / v2.4.52 peer=pk-)
function wsValidKey(key) { return !!key && wsKeys.some((k) => k.key === key); }
function wsKeyRole(key) { const k = wsKeys.find((x) => x.key === key); return k ? (k.role || 'upstream') : null; }   // #168 키 role 조회(collab/upstream)
function wsRevokeKey(key) { const n = wsKeys.length; wsKeys = wsKeys.filter((k) => k.key !== key); if (wsKeys.length !== n) wsSaveKeys(); }
function wsJoinUrl(group, key, host) { return `http://${host || process.env.WS_PUBLIC_HOST || ('localhost:' + PORT)}/join/${group}?key=${encodeURIComponent(key)}`; }   // #168 그룹별 접속 URL(키 포함 → /join 온보딩 md)
// === KEY-MGMT (v2.4.0 — WS-PROTOCOL-KEY-MGMT.md v0.2 구현 · 본격 #406 patch parity) ===
// keyStore = key.json (5-state machine + TTL + lastAgent/lastSeenAt + connectionStatus 매타 영속).
// 레거시 ws-keys.json (role lookup, HELLO/upgrade 판정) 와 dual-layer 운영 — 레거시 entry 가 정본 role, keyStore 가 정본 metadata.
const KEY_JSON = path.join(DIR, 'key.json');
const KEY_TTL_DEFAULT = 1209600000;   // §3.1 기본 14일 (msec)
const KEY_MAX_ACTIVE = Number(process.env.WS_KEY_MAX_ACTIVE) || 32;   // §3.1 활성 키 캡
const KEY_REVOKE_PENDING_GRACE_MS = Number(process.env.WS_KEY_REVOKE_PENDING_GRACE_MS) || 300000;   // §4 grace 5분 (sessionEnd live conn 후)
let keyStore = { version: 1, updatedAt: 0, keys: [] };
try { const j = JSON.parse(fs.readFileSync(KEY_JSON, 'utf8')); if (j && Array.isArray(j.keys)) keyStore = j; }
catch (e) { try { if (fs.existsSync(KEY_JSON)) fs.renameSync(KEY_JSON, KEY_JSON + '.corrupt-' + Date.now()); } catch {} }   // §6 손상 파일 보존(forensic), fresh 시작
const _keyGraceTimers = new Map();   // key → grace setTimeout (REVOKED_PENDING)
function keySave() {   // §6 atomic write + fsync
  keyStore.updatedAt = Date.now();
  try { const tmp = KEY_JSON + '.tmp'; const fd = fs.openSync(tmp, 'w'); fs.writeSync(fd, JSON.stringify(keyStore)); fs.fsyncSync(fd); fs.closeSync(fd); fs.renameSync(tmp, KEY_JSON); } catch {}
}
function keyFind(k) { return keyStore.keys.find((x) => x.key === k); }
function keyIsExpired(k) { return k.ttl > 0 && Date.now() > k.issuedAt + k.ttl; }   // §4.1 lazy
function keyConnStatus(k) {   // §3.2 connected/disconnected/never
  for (const c of wsAgents.values()) if (c.alive && c.meta.upstreamKey === k.key) return 'connected';
  return k.lastSeenAt ? 'disconnected' : 'never';
}
function keyEffectiveState(k) {   // §4.1 read-time invariant: TTL 만료는 즉시 REVOKED 노출(쓰기는 lazy)
  if ((k.state === 'ISSUED' || k.state === 'ACTIVE' || k.state === 'REVOKED_PENDING') && keyIsExpired(k)) return 'REVOKED';
  return k.state;
}
function keyValidate(label) { return typeof label === 'string' && label.length > 0 && label.length <= 64 && !/[\x00-\x1f]/.test(label); }   // §3.1 >0 ≤64 no-ctrl
function keyValidateRoleDesc(rd) { return rd == null || (typeof rd === 'string' && rd.length <= 256 && !/[\x00-\x08\x0e-\x1f]/.test(rd)); }   // v2.4.1 roleDescription validation
function keyValidateLabelSafe(label) { return /^[a-zA-Z0-9_-]{1,64}$/.test(label); }   // v2.4.1 local-keys/<label>.key 파일명 safe
function keyActiveCount() { return keyStore.keys.filter((k) => { const s = keyEffectiveState(k); return s === 'ISSUED' || s === 'ACTIVE' || s === 'REVOKED_PENDING'; }).length; }
function keyTransition(k, to) {   // 상태 전이 + revokedAt 스탬프 + persist
  k.state = to;
  if ((to === 'REVOKED_PENDING' || to === 'REVOKED') && !k.revokedAt) k.revokedAt = Date.now();
  if (to === 'DELETED') k.deletedAt = Date.now();
  keySave();
}
function keyError(conn, msg, code, message) { const ev = wscore.event('CUSTOM', { name: 'KeyError', value: { code, message: message || code, re_msgId: msg && (msg.msgId || msg.messageId) } }); ev.source = 'server'; if (conn.meta.agentId) ev.targetAgentId = conn.meta.agentId; conn.send(ev); }
function keyObserveHello(key, agentId) {   // §3.2/§4: HELLO 가 키 들고오면 lastAgent/lastSeenAt + ISSUED→ACTIVE
  if (!key) return; const k = keyFind(key); if (!k) return;
  k.lastAgent = agentId || k.lastAgent; k.lastSeenAt = Date.now();
  if (k.state === 'ISSUED') k.state = 'ACTIVE';   // §4 invariant 1: 일방
  keySave();
}
function keyAgentNameChanged(key, oldLabel, newLabel) {   // §3.5 라벨 변경 → 해당 키 보유 live conn 에 unicast 통보
  for (const c of wsAgents.values()) {
    if (c.alive && c.meta.upstreamKey === key) {
      const ev = wscore.event('CUSTOM', { name: 'AgentNameChanged', value: { key, oldLabel, newLabel } });
      ev.source = 'server'; ev.targetAgentId = c.meta.agentId; c.send(ev);
    }
  }
}
function keyKickConns(key, closeReason) {   // §3.3 immediate: 해당 키 live conn 전부 close(4003)
  let n = 0;
  for (const c of [...wsAgents.values()]) if (c.alive && c.meta.upstreamKey === key) { try { c.close(4003, closeReason || 'key revoked'); } catch {} n++; }
  return n;
}
function keyOnConnClose(conn) {   // §4: REVOKED_PENDING 키의 마지막 live conn 닫히면 REVOKED 확정 + 두 번째 KeyRevoked
  const key = conn.meta && conn.meta.upstreamKey; if (!key) return;
  const k = keyFind(key); if (!k || k.state !== 'REVOKED_PENDING') return;
  for (const c of wsAgents.values()) if (c !== conn && c.alive && c.meta.upstreamKey === key) return;   // 다른 live conn 존재
  const t = _keyGraceTimers.get(key); if (t) { clearTimeout(t); _keyGraceTimers.delete(key); }
  keyTransition(k, 'REVOKED');
  const m = wsPrimaryAgent();   // 두 번째 KeyRevoked → 메인
  if (m && m.alive) { const ev = wscore.event('CUSTOM', { name: 'KeyRevoked', value: { key, mode: 'sessionEnd', agentsDisconnected: 1, agentsNotified: 1 } }); ev.source = 'server'; ev.targetAgentId = m.meta.agentId; m.send(ev); }
}
function wsKeyReply(conn, name, value, ackForMsg) { const ev = wscore.event('CUSTOM', { name, value }); ev.source = 'server'; if (ackForMsg && (ackForMsg.msgId || ackForMsg.messageId)) ev.value.re_msgId = ackForMsg.msgId || ackForMsg.messageId; if (conn.meta.agentId) ev.targetAgentId = conn.meta.agentId; conn.send(ev); }
function wsKeyIssue(conn, msg, v) {   // §3.1 + v2.4.1 §3.6 — kind 분기 (upstream/collab/local/peer) + roleDescription
  const kind = (v.kind === 'local' || v.kind === 'collab' || v.kind === 'upstream' || v.kind === 'peer') ? v.kind : 'upstream';
  const label = (v.label != null && v.label !== '') ? String(v.label) : kind;
  if (!keyValidate(label)) return keyError(conn, msg, 'INVALID_LABEL', 'label must be 1..64 chars, no control chars');
  if (kind === 'local' && !keyValidateLabelSafe(label)) return keyError(conn, msg, 'INVALID_LABEL', 'local key label must match /^[a-zA-Z0-9_-]+$/ (used as filename)');
  const roleDescription = v.roleDescription != null ? String(v.roleDescription) : null;
  if (!keyValidateRoleDesc(roleDescription)) return keyError(conn, msg, 'INVALID_ROLE_DESC', 'roleDescription must be ≤256 chars, no control chars (except \\n\\t)');
  let ttl = (v.ttl == null) ? KEY_TTL_DEFAULT : Number(v.ttl);
  if (!Number.isFinite(ttl) || ttl < 0) return keyError(conn, msg, 'INVALID_TTL', 'ttl must be >= 0');
  if (keyActiveCount() >= KEY_MAX_ACTIVE) return keyError(conn, msg, 'LIMIT_EXCEEDED', `too many active keys (max ${KEY_MAX_ACTIVE})`);
  const key = wsIssueKey(label, kind);   // 레거시 ws-keys.json + prefix 별 키
  const issuedAt = Date.now();
  keyStore.keys.push({ key, label, state: 'ISSUED', kind, issuedAt, ttl, roleDescription, lastAgent: null, lastSeenAt: null, revokedAt: null, deletedAt: null });
  keySave();
  if (kind === 'local') {   // v2.4.1 §3.6 — wire 응답에 키 자체 안 보냄
    const dirPath = path.join(DIR, 'local-keys');
    try { fs.mkdirSync(dirPath, { recursive: true }); } catch {}
    const filePath = path.join(dirPath, label + '.key');
    try { const fd = fs.openSync(filePath, 'w'); fs.writeSync(fd, key); fs.fsyncSync(fd); fs.closeSync(fd); } catch (e) { return keyError(conn, msg, 'LOCAL_FILE_WRITE', 'failed to write local key file: ' + String(e.message || e)); }
    const relFile = path.relative(DIR, filePath).replace(/\\/g, '/');
    const joinHint = `LOCAL_KEY_FILE=${relFile} WS_AGENT_ID=${label} node scripts/join-local.cjs`;
    wsKeyReply(conn, 'KeyIssued', { kind: 'local', label, roleDescription, ttl, issuedAt, joinFile: relFile, joinScript: 'scripts/join-local.cjs', joinHint }, msg);
    return;
  }
  const urlParam = kind === 'collab' ? 'key' : kind === 'peer' ? 'peerKey' : 'upstreamKey';   // v2.4.52 peer 전용 파라미터 — upstream 파라미터에 편승 금지 (kind 혼동 방지)
  const joinUrl = `ws://${process.env.WS_PUBLIC_HOST || ('localhost:' + PORT)}/ws?${urlParam}=${encodeURIComponent(key)}`;
  wsKeyReply(conn, 'KeyIssued', { key, joinUrl, label, kind, roleDescription, ttl, issuedAt }, msg);
}
function wsKeyList(conn, msg, v) {   // §3.2 전체 키 enumerate (상태 + connectionStatus + lastAgent + TTL)
  const incRevoked = !!v.includeRevoked, incDeleted = !!v.includeDeleted;
  const keys = [];
  for (const k of keyStore.keys) {
    const state = keyEffectiveState(k);
    if (state === 'DELETED' && !incDeleted) continue;
    if (state === 'REVOKED' && !incRevoked) continue;
    const isLocal = (k.kind || 'upstream') === 'local';
    keys.push({ key: isLocal ? null : k.key, label: k.label, kind: k.kind || 'upstream', roleDescription: k.roleDescription || null, lastAgent: k.lastAgent || null, lastSeenAt: k.lastSeenAt || null, connectionStatus: keyConnStatus(k), ttl: k.ttl, issuedAt: k.issuedAt, state });   // v2.4.1 local 키는 wire 응답에 키 자체 미포함, roleDescription 포함
  }
  wsKeyReply(conn, 'KeyListResult', { keys }, msg);
}
function wsKeyRevoke(conn, msg, v) {   // §3.3 immediate(즉시 kick) / sessionEnd(세션 유지 후 폐기)
  const k = keyFind(v.key); if (!k) return keyError(conn, msg, 'KEY_NOT_FOUND', 'unknown key');
  const eff = keyEffectiveState(k);
  if (eff === 'REVOKED' || eff === 'DELETED') return keyError(conn, msg, 'ALREADY_REVOKED', 'key already revoked');
  const mode = v.mode === 'sessionEnd' ? 'sessionEnd' : (v.mode === 'immediate' ? 'immediate' : null);
  if (!mode) return keyError(conn, msg, 'INVALID_MODE', 'mode must be immediate|sessionEnd');
  const hasLive = [...wsAgents.values()].some((c) => c.alive && c.meta.upstreamKey === k.key);
  if (mode === 'immediate' || !hasLive) {   // immediate, 또는 sessionEnd 인데 live conn 없음 → 즉시 REVOKED
    wsRevokeKey(k.key);
    const n = mode === 'immediate' ? keyKickConns(k.key, 'key revoked') : 0;
    keyTransition(k, 'REVOKED');
    wsKeyReply(conn, 'KeyRevoked', { key: k.key, mode, agentsDisconnected: n, agentsNotified: n }, msg);
  } else {   // sessionEnd + live conn → REVOKED_PENDING
    wsRevokeKey(k.key);
    keyTransition(k, 'REVOKED_PENDING');
    let notified = 0;
    for (const c of wsAgents.values()) if (c.alive && c.meta.upstreamKey === k.key) { const ev = wscore.event('CUSTOM', { name: 'KeyRevokePending', value: { key: k.key, mode: 'sessionEnd' } }); ev.source = 'server'; ev.targetAgentId = c.meta.agentId; c.send(ev); notified++; }
    if (!_keyGraceTimers.has(k.key)) _keyGraceTimers.set(k.key, setTimeout(() => { _keyGraceTimers.delete(k.key); if (keyFind(k.key) && keyFind(k.key).state === 'REVOKED_PENDING') { keyKickConns(k.key, 'key revoke pending grace expired'); } }, KEY_REVOKE_PENDING_GRACE_MS));
    wsKeyReply(conn, 'KeyRevoked', { key: k.key, mode: 'sessionEnd', agentsDisconnected: 0, agentsNotified: notified }, msg);
  }
}
function wsKeyLabel(conn, msg, v) {   // §3.4 라벨 변경 + AgentNameChanged 통보
  const k = keyFind(v.key); if (!k) return keyError(conn, msg, 'KEY_NOT_FOUND', 'unknown key');
  const eff = keyEffectiveState(k);
  if (eff === 'REVOKED' || eff === 'DELETED') return keyError(conn, msg, 'KEY_NOT_FOUND', 'key terminal');
  const newLabel = String(v.newLabel == null ? '' : v.newLabel);
  if (!keyValidate(newLabel)) return keyError(conn, msg, 'INVALID_LABEL', 'label must be 1..64 chars, no control chars');
  const oldLabel = k.label;
  if (newLabel === oldLabel) return keyError(conn, msg, 'NOOP_LABEL', 'label unchanged');
  k.label = newLabel; keySave();
  const lk = wsKeys.find((x) => x.key === k.key); if (lk) { lk.label = newLabel; wsSaveKeys(); }   // 레거시 라벨 동기화
  wsKeyReply(conn, 'KeyLabeled', { key: k.key, oldLabel, newLabel }, msg);
  keyAgentNameChanged(k.key, oldLabel, newLabel);
}
// v2.3.23 — 메시지 채널 구분 (A2A relay vs 보드 broadcast) 공용 가이드. 합류 에이전트가 라우팅 의도 명시하도록 안내.
function wsChannelGuideMd() {
  return [
    '## 메시지 채널 구분 — A2A vs 보드 (사용자 탭)',
    '',
    '합류한 에이전트가 메시지 보낼 때 **라우팅 의도를 명시**해야 의도하지 않은 사용자 노출 / 메시지 누락을 막을 수 있어요.',
    '',
    '### 4 케이스 분류',
    '',
    '| 의도 | 채널 | 발신 방식 |',
    '|---|---|---|',
    '| **다른 에이전트에게 1:1 메시지** (인사 · 보고 · 결정 요청 · 작업 협의 · ack) | A2A relay | `{type:"CUSTOM", name:"<intent>", targetAgentId:"<수신자 agentId>", value:{...}}` |',
    '| **사용자에게 직접 보일 진행 상황** (대시보드 표시) | 보드 (메인 경유) | 합류 에이전트는 **직접 안 함** — A2A 로 메인에게 보고 → 메인이 `state.json` 갱신 또는 `wsToBoards` 호출 |',
    '| **시스템 이벤트** (자기 telemetry · heartbeat · presence) | 보드 broadcast (작은 영역) | `wsCore` 의 telemetry 표시 layer — 보통 자동 처리 |',
    '| **그 외 모르겠을 때** | A2A (메인 우선) | `targetAgentId: "<메인 agentId>"` 명시 — 안 지정하면 fallback 으로 메인 inbox 로 가지만 의도 모호 |',
    '',
    '### 권장 룰',
    '',
    '1. **합류 직후 첫 메시지** (인사 · `AgentHello` 등) 는 **반드시 `targetAgentId` 지정** — 안 지정하면 server fallback 으로 메인 inbox 로 가는데, 그게 메인 탭 (사용자가 봄) 에 표시돼서 의도가 1:1 협의였더라도 "사용자에게 broadcast 한 듯" 보일 수 있어요.',
    '2. **작업 진행 보고** (`name:"Report"` · `WorkerAck` · `STEP_FINISHED` 등) 는 `targetAgentId` 지정 — 보통 메인에게.',
    '3. **사용자 직접 표시 의도** = 합류 에이전트가 직접 안 함. A2A 로 메인에게 보고 → 메인이 보드 갱신 (`state.json.current/done/planned/decisions` 등).',
    '4. **여러 에이전트에게 같은 메시지** = 각각 별도 A2A 로 (loop). 보드 broadcast 는 시스템 이벤트 용도.',
    '',
    '### 잘못된 패턴 (anti-pattern)',
    '',
    '- `targetAgentId` 없이 CUSTOM 송신 → server fallback 으로 메인 한 명에게 가요. 의도가 broadcast 였다면 어긋남, 의도가 메인 직접이었다면 OK 지만 *명시 권장*.',
    '- "보드에 알린다" 의도로 임의 broadcast 시도 → 일반 에이전트는 `wsToBoards` 호출 불가 (server 가 시스템 이벤트만 broadcast).',
    '- 합류 에이전트가 `state.json` 직접 갱신 → schema 상 main 만 작성 권장 (state-schema.md §1). A2A 로 메인에게 보고 → 메인이 보드 갱신.',
    '',
  ].join('\n');
}
function wsCollabOnboardMd(host, key) {   // #168 외부협업 온보딩 md 동적 생성(키·host 임베드, 유형 분기); v2.3.23 채널 가이드 inline.
  return [
    '# 🤝 Constellation 라이브보드 — 외부 협업(collab) 합류',
    '', '환영합니다. 이 보드에 **외부 협업 에이전트**로 합류하는 안내입니다.', '',
    '## 접속 (한 줄)', '```', `ws://${host}/ws?key=${key}`, '```',
    '위 키로 접속하면 **collab role · group:collab** 으로 자동 분류됩니다.', '',
    wsChannelGuideMd(),
    '## 에이전트 유형별 운영',
    '### IDE/CLI 에이전트 (Claude Code · Codex · Copilot 등)',
    `- 무한대기 운영 방법론: [AGENT-CONNECT §1.9](http://${host}/AGENT-CONNECT.md) — bridge·monitor·watchdog 역할 분리, turn-held / self-wake 2패턴, 합류·상주 체크리스트`,
    `- 레퍼런스 클라(포팅용): [ws-agent-client.cjs](http://${host}/examples/ws-agent-client.cjs)`,
    '### 자율 에이전트 (API·게이트웨이 기반)',
    `- 게이트웨이 채널 구성: [WS-PROTOCOL §13.11](http://${host}/WS-PROTOCOL.md) — 런타임 WS adapter(자기 런타임에 WS 클라 두고 키 접속·HELLO·A2A·이벤트 emit)`,
    '- (향후) EstreGenesis eux 게이트웨이 클라 — 증류 예정', '',
    '## 온보딩 프롬프트 (첫 지시문 복붙)', '```',
    `이 Constellation 라이브보드에 외부 협업(collab)으로 합류해줘. 접속: ws://${host}/ws?key=${key} (HELLO 시 agentName 지정). collab role·group:collab 으로 붙고, **모든 발신 메시지는 targetAgentId 명시** (메인=${WS_PRIMARY_ID}; 인사·보고·결정 요청 모두 A2A 로). 사용자 보일 진행 상황은 메인에게 A2A 로 보고 → 메인이 보드 갱신. IDE/CLI 면 AGENT-CONNECT §1.9 무한대기로 운영(bridge·self-wake watcher), 메인 위임 대기. 자율 런타임이면 WS-PROTOCOL §13.11 게이트웨이 클라로 접속·이벤트 emit.`,
    '```', '',
    `_발급 키: ${key} · 호스트: ${host} · 문의: 보드 메인 에이전트_`, '',
  ].join('\n');
}
function wsLocalOnboardMd(host, label, roleDescription) {   // v2.4.1 §3.6 — local 키 온보딩 (파일 경로 + 스크립트 호출 안내, 키 자체 비공개)
  const filePath = `local-keys/${label}.key`;
  const cmd = `LOCAL_KEY_FILE=${filePath} WS_AGENT_ID=${label} node scripts/join-local.cjs`;
  return [
    '# 🏠 Constellation 라이브보드 — 로컬(local) 워커 합류',
    '', `환영합니다. 로컬 워커 \`${label}\` 로 본 보드에 합류하는 안내예요.`, '',
    '## 합류 명령 (한 줄)', '```', cmd, '```',
    '키 자체는 외부로 전달되지 않아요 — 메인 에이전트가 발급 시 로컬 파일에 저장하고, 본 스크립트가 해당 파일을 읽어서 합류합니다. (보안 + 사용성)', '',
    roleDescription ? `## 역할 (메인이 부여한 의도)\n\n> ${roleDescription.split('\n').map(l => l.trim()).filter(Boolean).join('\n> ')}\n\n위 역할에 맞춰 작동해주세요.\n` : '',
    '## 작동 방식',
    `- 파일 \`${filePath}\` 에 발급된 키 (\`lk-…\`) 저장 완료. 메인 에이전트가 발급 시 자동 생성.`,
    `- 스크립트 \`scripts/join-local.cjs\` 가 \`LOCAL_KEY_FILE\` 환경변수로 파일 경로 받음 → 파일에서 키 읽기 → \`ws://${host}/ws\` 합류.`,
    `- \`WS_AGENT_ID\` 환경변수가 본인의 agentId. 메인 (\`${WS_PRIMARY_ID}\`) 의 \`Delegate\` 메시지를 기다림 (role:local 표준 standby).`,
    '',
    wsChannelGuideMd(),
    '## 온보딩 프롬프트 (첫 지시문 복붙)', '```',
    `이 Constellation 보드에 로컬 워커로 합류해줘. 합류 명령: ${cmd}. agentId=${label}, role=local. ${roleDescription ? '역할 의도: ' + roleDescription + '. ' : ''}메인(${WS_PRIMARY_ID}) 의 Delegate 를 기다리며 standby, 작업 받으면 처리하고 Report 로 보고. 모든 발신은 targetAgentId 명시.`,
    '```', '',
    `_라벨: ${label} · 호스트: ${host} · 파일: ${filePath} · 문의: 보드 메인 에이전트_`, '',
  ].filter(Boolean).join('\n');
}
function wsPeerOnboardMd(host, key) {   // v2.4.52 — peer-main 온보딩 md (§13.9.3 duty profile; 자율 upstream 과 구분)
  return [
    '# 🤝 Constellation 라이브보드 — 피어(peer-main) 합류',
    '', '환영합니다. 이 보드에 **peer-main** (자기 프로젝트의 main 에이전트가 타 보드에 피어로 합류) 으로 붙는 안내입니다.', '',
    '## 접속 (한 줄)', '```', `ws://${host}/ws?peerKey=${key}`, '```',
    '위 키로 접속하면 **peer role** 로 자동 분류돼요 — 자기 프로젝트에선 orchestrator-main, 이 보드에선 피어 (§13.9.3).', '',
    '## peer vs upstream vs collab — 차이 한 줄',
    '- **peer** = 타 프로젝트의 main (key prefix `pk-`). 프로젝트 간 대등 협의 채널. Delegate-wait 없음, SetMain 자격 없음.',
    '- **upstream** = 자율 외부 에이전트 / 거버넌스 layer (key prefix `uk-`). 결정을 아래로 내릴 수 있는 방향성.',
    '- **collab** = 외부 협업 worker/어댑터 (key prefix `ck-`). 메인 위임 수신 + 보고.',
    '',
    wsChannelGuideMd(),
    '## 운영 규약',
    '- **모든 발신 메시지는 `targetAgentId` 명시** (이 보드의 메인 = `' + WS_PRIMARY_ID + '`).',
    '- 응답 라우팅: **응답은 요청이 들어온 채널로** (received-channel). 자기 보드 사안은 자기 보드에.',
    '- 이 보드의 메인이 board 갱신을 워커에 위임해 운용 중이면, 보드 등재 요청은 메인에게 — 직접 state 편집 금지.',
    '',
    '## 온보딩 프롬프트 (첫 지시문 복붙)', '```',
    `이 Constellation 라이브보드에 peer-main 으로 합류해줘. 접속: ws://${host}/ws?peerKey=${key} (HELLO 시 agentName 지정 + role 힌트 'peer'). 너는 네 프로젝트의 main 이고 이 보드에선 피어야 — 대등 협의 채널로 쓰고, 모든 발신에 targetAgentId 명시 (메인=${WS_PRIMARY_ID}). IDE/CLI 면 AGENT-CONNECT §1.9 무한대기로 운영.`,
    '```', '',
    `_발급 키: ${key} · 호스트: ${host} · 문의: 보드 메인 에이전트_`, '',
  ].join('\n');
}
function wsUpstreamOnboardMd(host, key) {   // v2.3.23 — 업스트림 온보딩 md (collab 패턴 + upstream 특화)
  return [
    '# ⬆ Constellation 라이브보드 — 업스트림(upstream) 합류',
    '', '환영합니다. 이 보드에 **업스트림 에이전트** (다른 main 후보 · 자율 런타임 · peer 거버넌스 layer) 로 합류하는 안내입니다.', '',
    '## 접속 (한 줄)', '```', `ws://${host}/ws?upstreamKey=${key}`, '```',
    '위 키로 접속하면 **upstream role** 으로 자동 분류돼요. 메인(`' + WS_PRIMARY_ID + '`) 과 peer 관계로 협업 (collab 의 worker 관계와 다름).', '',
    '## upstream vs collab — 차이 한 줄',
    '- **upstream** = main 후보 / peer 거버넌스 layer (key prefix `uk-` 또는 `u-`). 메인과 1:1 협의, SetMain / Handoff 자격.',
    '- **collab** = 외부 협업 worker (key prefix `ck-`). 메인 위임 수신 + 보고. SetMain 자격 없음.',
    '',
    wsChannelGuideMd(),
    '## 에이전트 유형별 운영',
    '### IDE/CLI 에이전트',
    `- 무한대기 운영 방법론: [AGENT-CONNECT §1.9](http://${host}/AGENT-CONNECT.md)`,
    `- 레퍼런스 클라(포팅용): [ws-agent-client.cjs](http://${host}/examples/ws-agent-client.cjs)`,
    '### 자율 에이전트',
    `- 게이트웨이 채널 구성: [WS-PROTOCOL §13.11](http://${host}/WS-PROTOCOL.md)`,
    '',
    '## 온보딩 프롬프트 (첫 지시문 복붙)', '```',
    `이 Constellation 라이브보드에 업스트림(upstream)으로 합류해줘. 접속: ws://${host}/ws?upstreamKey=${key} (HELLO 시 agentName 지정). upstream role 로 붙고, **모든 발신 메시지는 targetAgentId 명시** (메인=${WS_PRIMARY_ID}). 메인과 peer 관계 — SetMain / Handoff 가능. 사용자 보일 진행 상황은 메인에게 A2A 로 보고 → 메인이 보드 갱신. IDE/CLI 면 AGENT-CONNECT §1.9 무한대기로 운영, 자율 런타임이면 WS-PROTOCOL §13.11 게이트웨이 클라로 접속.`,
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
  if (n === 'RegisterUpstreamKey') { const key = wsIssueKey(v.label); const joinUrl = wsJoinUrl('upstream', key); conn.send(wscore.event('CUSTOM', { name: 'UpstreamKeyIssued', value: { key, label: v.label || 'upstream', joinUrl } })); return true; }   // v2.3.23 transitional alias — KeyIssue 가 canonical, RegisterUpstreamKey 는 §3.1 retirement schedule 따라 zero-traffic gate 후 제거
  if (n === 'RegisterCollabKey') { const key = wsIssueKey(v.label, 'collab'); const clabel = v.label || 'collab'; const joinUrl = wsJoinUrl('collab', key); keyStore.keys.push({ key, label: clabel, state: 'ISSUED', kind: 'collab', issuedAt: Date.now(), ttl: KEY_TTL_DEFAULT, lastAgent: null, lastSeenAt: null, revokedAt: null, deletedAt: null }); keySave(); conn.send(wscore.event('CUSTOM', { name: 'CollabKeyIssued', value: { key, label: clabel, joinUrl } })); return true; }   // #168 외부협업 키+접속 URL (v2.4.0 KEY-MGMT 통합: keyStore 등록 kind=collab)
  if (n === 'RevokeCollabKey' || n === 'RevokeUpstreamKey') { wsRevokeKey(v.key); return true; }
  // === KEY-MGMT (v2.4.0 — WS-PROTOCOL-KEY-MGMT.md v0.2) ===
  if (n === 'KeyIssue' || n === 'KeyList' || n === 'KeyRevoke' || n === 'KeyLabel') {
    const isAgent = conn.meta.role === 'agent';
    if (isAgent && wsAgentRole(conn) !== 'main') { keyError(conn, msg, 'PERMISSION_DENIED', 'only main may manage keys'); return true; }
    if (n === 'KeyIssue') wsKeyIssue(conn, msg, v);
    else if (n === 'KeyList') wsKeyList(conn, msg, v);
    else if (n === 'KeyRevoke') wsKeyRevoke(conn, msg, v);
    else if (n === 'KeyLabel') wsKeyLabel(conn, msg, v);
    return true;
  }
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
function wsMsgChan(m) { if (m && m.roomId) return 'room:' + String(m.roomId); return String((m && (m.agentId || m.targetAgentId || m.channelId)) || '_'); }   // 채널 = 에이전트 단위(agentId 우선). §13.30 room 메시지는 room:<id> 자체 채널. channelId 는 출처 뱃지로만
function wsHistFile(ck) { return path.join(HISTDIR, ck.replace(/[^a-zA-Z0-9_.@:-]/g, '_').slice(0, 80) + '.jsonl'); }
function wsBufFor(ck) { let b = wsBuf.get(ck); if (!b) { b = { msg: new Map(), tool: new Map() }; wsBuf.set(ck, b); } return b; }
function wsSaveChan(ck) {
  if (_histT.has(ck)) return;
  _histT.set(ck, setTimeout(() => { _histT.delete(ck); try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(wsHistFile(ck), (wsHistByChan.get(ck) || []).map((e) => JSON.stringify(e)).join('\n') + '\n'); } catch {} }, 1000));
}
// v2.4.60 — timestamp 정규화: 일부 발신 경로가 ISO 문자열로 스탬프(또는 누락) → 숫자-전제 소비자
// (대시보드 wsMsgEpoch·부팅 sort 의 `timestamp || 0`)가 오동작해 매 새로고침 현재시간 표시되던 버그.
// 저장·적재 경계에서 epoch 숫자로 통일 (문자열→Date.parse, 누락→서버 수신시각).
function wsNormTs(ev) {
  if (!ev || typeof ev !== 'object') return ev;
  if (typeof ev.timestamp === 'string') { const e = Date.parse(ev.timestamp); if (!isNaN(e)) ev.timestamp = e; }
  if (ev.timestamp == null) ev.timestamp = Date.now();
  return ev;
}
function wsStore(ck, ev) {
  wsNormTs(ev);
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
  if (msg.type === 'CUSTOM' && msg.name === 'CommandManifest') wsCmdManifestNote(msg.agentId, msg.value);   // v2.4.67 자동완성 매니페스트 캡처 (저장도 계속 — replay 이중화)
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
// v2.4.59 — 채널별 role 영속 (그룹 오분류 fix): cold/archived 스텁엔 role 이 없어 대시보드가
// 키-형태 기반 기본값(local)으로 추락 — upstream/collab/peer 가 끊기면 로컬 그룹에 표시되던 버그.
// HELLO 시점의 판정 role 을 채널키별로 기록·영속해 스텁에 동봉한다 (room:* 은 고정 roundtable).
const CHANROLES = path.join(HISTDIR, '.chan-roles.json');
const wsChanRoles = new Map();
try { const _cr = JSON.parse(fs.readFileSync(CHANROLES, 'utf8')); for (const k of Object.keys(_cr)) wsChanRoles.set(k, _cr[k]); } catch {}
let _chanRolesT = null;
function wsChanRoleNote(ck, role) {
  if (!ck || !role || wsChanRoles.get(ck) === role) return;
  wsChanRoles.set(ck, role);
  if (_chanRolesT) return;
  _chanRolesT = setTimeout(() => { _chanRolesT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(CHANROLES, JSON.stringify(Object.fromEntries(wsChanRoles), null, 1)); } catch {} }, 1000);
}
function wsChanRoleOf(ck) { return ck && String(ck).startsWith('room:') ? 'roundtable' : (wsChanRoles.get(ck) || null); }
// v2.4.67 — 에이전트별 슬래시 명령 매니페스트 영속 (주입행 자동완성 데이터): CommandManifest CUSTOM
// (value.commands[{name,desc}]) 를 agentId 별 latest-wins 로 기록·영속, History payload 에 동봉.
// 하네스 무관 data-plane 이벤트 — 어댑터가 자기 호스트의 명령을 스스로 선언하므로 Claude Code/Codex/
// Hermes/OpenClaw 어디서든 같은 경로로 호환. 값 검증: name 은 '/' 시작 필수, 개수·길이 캡.
const CMDMANIFESTS = path.join(HISTDIR, '.cmd-manifests.json');
const wsCmdManifests = new Map();
try { const _cm = JSON.parse(fs.readFileSync(CMDMANIFESTS, 'utf8')); for (const k of Object.keys(_cm)) wsCmdManifests.set(k, _cm[k]); } catch {}
let _cmdManT = null;
function wsCmdManifestNote(agentId, v) {
  if (!agentId || !v || !Array.isArray(v.commands)) return;
  const cmds = v.commands.slice(0, 200)
    .map((c) => ({ name: String((c && c.name) || '').slice(0, 64), desc: String((c && c.desc) || '').slice(0, 160) }))
    .filter((c) => c.name.startsWith('/') && c.name.length > 1);
  if (!cmds.length) return;
  wsCmdManifests.set(String(agentId), { commands: cmds, updatedAt: Date.now() });
  if (_cmdManT) return;
  _cmdManT = setTimeout(() => { _cmdManT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(CMDMANIFESTS, JSON.stringify(Object.fromEntries(wsCmdManifests), null, 1)); } catch {} }, 1000);
}

const ARCHDIR = path.join(HISTDIR, 'archived');   // D: 닫은(아카이브) 채널 cold 보관(active 스캔 제외)
function wsArchFile(ck) { return path.join(ARCHDIR, ck.replace(/[^a-zA-Z0-9_.@:-]/g, '_').slice(0, 80) + '.jsonl'); }
function wsArchivedList() {   // archived/ 채널 stub 메타(키·건수·마지막 ts) — 내용은 복원 시 lazy
  const out = [];
  try { fs.mkdirSync(ARCHDIR, { recursive: true }); for (const f of fs.readdirSync(ARCHDIR)) { if (!f.endsWith('.jsonl')) continue; try { const evs = fs.readFileSync(path.join(ARCHDIR, f), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); if (!evs.length) continue; const _k = wsMsgChan(evs[0]); out.push({ key: _k, count: evs.length, lastTs: evs[evs.length - 1].timestamp || 0, role: wsChanRoleOf(_k) }); } catch {} } } catch {}
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
    else cold.push({ key: ck, count: a.length, lastTs: a[a.length - 1].timestamp || 0, role: wsChanRoleOf(ck) });   // v2.4.59 role 동봉 — 그룹 오분류 fix
  }
  events.sort((x, y) => (x.timestamp || 0) - (y.timestamp || 0));
  return { events, cold, archived: wsArchivedList(), manifests: Object.fromEntries(wsCmdManifests) };   // v2.4.67 자동완성 매니페스트 동봉
}
function wsLoadChannel(ck) {   // RequestChannelHistory 응답용 — 메모리(active) 우선, 없으면 archived(cold)에서 로드 + active 복귀
  let a = wsHistByChan.get(ck);
  if (a && a.length) return a;
  try { const af = wsArchFile(ck); if (fs.existsSync(af)) { const evs = fs.readFileSync(af, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); evs.forEach(wsNormTs); wsHistByChan.set(ck, evs); try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(wsHistFile(ck), evs.map((e) => JSON.stringify(e)).join('\n') + '\n'); fs.unlinkSync(af); } catch {} return evs; } } catch {}   // D: cold → active 복귀 (v2.4.60 ts 정규화 포함)
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
    for (const f of files) { try { const evs = fs.readFileSync(path.join(HISTDIR, f), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); for (const ev of evs) { wsNormTs(ev); const ck = wsMsgChan(ev); let a = wsHistByChan.get(ck); if (!a) { a = []; wsHistByChan.set(ck, a); } a.push(ev); } } catch {} }   // v2.4.60 적재 시 ts 정규화 → 아래 재저장에서 영구 반영
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

// §13.19.10 Q3 board-adapter deadlock detector — OPT-IN (도입측이 필요할 때만). 기본 OFF (서버↔application 결합 회피 — Constellation.md §13.19.3 의 canonical 검출은 에이전트측 turn-start wait-edge DFS).
//   _a2aPending 는 reply-pairing(응답 에이전트 → {from=요청자}) 이라 wait-edge 의 lightweight 근사: pending.get(B).from===A ⟺ A 가 B 응답 대기(A→B). 2-cycle(A↔B) 이 threshold 초과 지속 시 DeadlockProbe 를 board 로 emit.
//   활성화: WS_DEADLOCK_DETECT=1 (+ 선택 WS_DEADLOCK_PROBE_MS, 기본 120000). 검출은 근사(strict 2-cycle만) — quasi-deadlock(behavioral, cycle 없음)은 에이전트측 §13.19.4 SLA 규율 담당.
const WS_DEADLOCK_DETECT = /^(1|true|on)$/i.test(process.env.WS_DEADLOCK_DETECT || '');
const WS_DEADLOCK_PROBE_MS = Number(process.env.WS_DEADLOCK_PROBE_MS) || 120000;
const _deadlockSeen = new Set();   // 이미 probe emit 한 cycle key (해소 시 정리 → 재발 재emit)
function wsDeadlockScan() {
  const now = Date.now();
  for (const [node, rec] of _a2aPending) {
    const other = rec.from; if (!other) continue;
    const ro = _a2aPending.get(other);
    if (ro && ro.from === node) {   // node→other(ro) AND other→node(rec) = strict 2-cycle
      if ((now - rec.at) < WS_DEADLOCK_PROBE_MS || (now - ro.at) < WS_DEADLOCK_PROBE_MS) continue;   // 둘 다 threshold 초과해야 (healthy 대기 오탐 방지)
      const key = [node, other].sort().join('::');
      if (_deadlockSeen.has(key)) continue;
      _deadlockSeen.add(key);
      const ev = wscore.event('CUSTOM', { name: 'DeadlockProbe', value: { cycleMembers: [node, other].sort(), waitEdges: [{ from: node, to: other }, { from: other, to: node }], class: 'strict', summary: `2-cycle ${node} ↔ ${other} (board-adapter detect, 양측 ≥${WS_DEADLOCK_PROBE_MS}ms)`, proposedResolution: 'priority-leader override (§13.19.5) 또는 §13.17 decisions 에스컬레이션' } });
      ev.source = 'server';
      wsToBoards(ev);
      console.error(`[ws DEADLOCK] strict 2-cycle ${node} ↔ ${other} → DeadlockProbe emitted to boards (opt-in detector)`);
    }
  }
  for (const key of [..._deadlockSeen]) { const [x, y] = key.split('::'); const rx = _a2aPending.get(x), ry = _a2aPending.get(y); if (!(rx && ry && rx.from === y && ry.from === x)) _deadlockSeen.delete(key); }   // cycle 해소 → key 정리 (재발 시 재emit 허용)
}
if (WS_DEADLOCK_DETECT) { setInterval(wsDeadlockScan, Math.min(WS_DEADLOCK_PROBE_MS, 30000)).unref(); console.log(`[server] WS_DEADLOCK_DETECT on — board-adapter strict 2-cycle detector (probe ≥${WS_DEADLOCK_PROBE_MS}ms, §13.19.10 Q3 opt-in; quasi-deadlock 은 에이전트측 SLA 규율 담당)`); }
// ── §13.30 roundtable — multi-party topic rooms (v2.4.53, R2 server core) ─────────────────
// 이층 분리의 서버층: 결정론 floor 만 여기서 강제(fan-out·autoHop 파킹·rate/연속 상한·stall·human soft-yield·
// notice 표면화·advisory floor queue). 발화 판단·요약은 에이전트 규율(/roundtable 스킬) 소관 — 서버는 절대 대신 말하지 않음.
const WS_ROOMS_FILE = path.join(DIR, 'rooms.json');
let wsRooms = new Map();                                     // roomId → room object (§13.30.2)
try { for (const r of JSON.parse(fs.readFileSync(WS_ROOMS_FILE, 'utf8'))) if (r && r.roomId && !r.closedAt) wsRooms.set(r.roomId, r); } catch {}
function wsRoomsSave() { try { const tmp = WS_ROOMS_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify([...wsRooms.values()], null, 2)); fs.renameSync(tmp, WS_ROOMS_FILE); } catch (e) { console.warn('[room] persist fail:', e.message); } }
const WS_ROOM_BUDGET_DEFAULTS = { maxConsecutive: 2, ratePerMin: 10, maxAutoHop: 6, stallRounds: 3 };   // maxAutoHop = D4 self-cap 상단(5)+1 — floor 가 규율 준수자를 먼저 걸면 안 됨 (피어 리뷰 반영)
function wsRoomEvent(name, value) { const ev = wscore.event('CUSTOM', { name, value }); ev.source = 'server'; return ev; }
function wsRoomBroadcast(room, ev) {                         // room 이벤트 → 참여 에이전트 전원 + board 전체 (기록 포함)
  ev.roomId = room.roomId;
  for (const pid of room.participants.map((p) => p.agentId)) { const c = wsAgents.get(pid); if (c && c.alive) c.send(ev); }
  wsToBoards(ev); wsRecord(ev);
}
function wsRoomFind(id) { const r = wsRooms.get(String(id || '')); return r && !r.closedAt ? r : null; }
function wsRoomArt(room) {                                   // artifacts lazy-init + 단일 version 카운터 (§13.30.5 — ack-by-reference 의 참조 대상)
  if (!room.artifacts || typeof room.artifacts !== 'object') room.artifacts = { header: null, decisions: [], summary: null };
  if (!Array.isArray(room.artifacts.decisions)) room.artifacts.decisions = [];
  if (typeof room.artifacts._version !== 'number') room.artifacts._version = 0;
  return room.artifacts;
}
function wsRoomGuardNotify(conn, room, rule, msg, action) {  // 가드 발동 통보 — silent drop 금지 (§13.30.4-2)
  const ev = wsRoomEvent('RoomGuard', { roomId: room.roomId, rule, action, msgId: msg && (msg.msgId || msg.messageId), agentId: conn.meta.agentId });
  if (conn.meta.role === 'agent') { ev.targetAgentId = conn.meta.agentId; conn.send(ev); }
  wsToBoards(ev); wsRecord(ev);
}
function wsRoomOp(conn, msg) {                               // RoomCreate/RoomJoin/RoomLeave/RoomClose — agent·board 양쪽 허용(v1 관대, 가드가 방을 지킴)
  if (!msg || msg.type !== 'CUSTOM') return false;
  const v = msg.value || {};
  if (msg.name === 'RoomCreate') {
    const roomId = 'rt-' + crypto.randomBytes(6).toString('hex');
    const ids = [...new Set((Array.isArray(v.participants) ? v.participants : []).filter((x) => typeof x === 'string' && x.trim()))];
    const room = {
      roomId, topic: String(v.topic || '(no topic)').slice(0, 200), mode: v.mode === 'persistent' ? 'persistent' : 'temporary',
      moderated: !!v.moderated,
      participants: ids.map((id) => ({ agentId: id, role: id === v.moderator ? 'moderator' : 'participant', voice: true, speakerClass: 'agent' })),
      floor: { holder: null, queue: [] },
      budgets: Object.assign({}, WS_ROOM_BUDGET_DEFAULTS, (typeof v.budgets === 'object' && v.budgets) || {}),
      artifacts: { header: v.header || null, decisions: [], summary: null },
      parked: [], _autoHop: 0, _lastSpeaker: null, _consec: 0, _noProgress: 0, _rate: {}, _notices: [],
      createdBy: conn.meta.agentId || 'board', createdAt: new Date().toISOString(), closedAt: null,
    };
    wsRooms.set(roomId, room); wsRoomsSave();
    wsRoomBroadcast(room, wsRoomEvent('RoomCreated', { roomId, topic: room.topic, mode: room.mode, participants: ids, createdBy: room.createdBy }));
    console.log('[room] created %s "%s" participants=%s by=%s', roomId, room.topic.slice(0, 40), ids.join(','), room.createdBy);
    return true;
  }
  const NEED_ROOM = ['RoomJoin', 'RoomLeave', 'RoomClose', 'RequestRoomArtifacts', 'RoomArtifactsUpdate'];
  const room = wsRoomFind(v.roomId); if (!room && NEED_ROOM.includes(msg.name)) { wsRoomGuardNotify(conn, { roomId: String(v.roomId || '?'), participants: [] }, 'no-such-room', msg, 'ignored'); return true; }
  if (msg.name === 'RoomJoin') {
    const id = String(v.agentId || conn.meta.agentId || ''); if (!id) return true;
    if (!room.participants.some((p) => p.agentId === id)) { room.participants.push({ agentId: id, role: 'participant', voice: !room.moderated, speakerClass: 'agent' }); wsRoomsSave(); }
    wsRoomBroadcast(room, wsRoomEvent('RoomJoined', { roomId: room.roomId, agentId: id })); return true;
  }
  if (msg.name === 'RoomLeave') {
    const id = String(v.agentId || conn.meta.agentId || '');
    room.participants = room.participants.filter((p) => p.agentId !== id); wsRoomsSave();
    wsRoomBroadcast(room, wsRoomEvent('RoomLeft', { roomId: room.roomId, agentId: id })); return true;
  }
  if (msg.name === 'RoomClose') {
    room.closedAt = new Date().toISOString(); wsRoomsSave();
    wsRoomBroadcast(room, wsRoomEvent('RoomClosed', { roomId: room.roomId, reason: String(v.reason || 'closed').slice(0, 200) })); return true;
  }
  if (msg.name === 'RequestRoomArtifacts') {                 // §13.30.5 fetch — RequestChannelHistory 와 대칭 (WS-only, 요청자에게만 회신·기록 없음)
    const a = wsRoomArt(room);
    const ev = wsRoomEvent('RoomArtifacts', { roomId: room.roomId, artifacts: { header: a.header, decisions: a.decisions, summary: a.summary }, version: a._version });
    ev.roomId = room.roomId;
    if (conn.meta.role === 'agent') ev.targetAgentId = conn.meta.agentId;
    conn.send(ev); return true;
  }
  if (msg.name === 'RoomArtifactsUpdate') {                  // §13.30.5 갱신 — 참여자·board 만. 변경 전파 = invalidation + delta (전문 재공지 아님)
    const editor = conn.meta.role === 'agent' ? conn.meta.agentId : 'board';
    if (editor !== 'board' && !room.participants.some((p) => p.agentId === editor)) { wsRoomGuardNotify(conn, room, 'not-participant', msg, 'ignored'); return true; }
    const a = wsRoomArt(room); const delta = {}; const at = new Date().toISOString();
    if (v.header && typeof v.header.text === 'string') { a.header = { text: v.header.text.slice(0, 4000), version: ((a.header && a.header.version) || 0) + 1, updatedBy: editor, updatedAt: at }; delta.header = a.header; }
    if (v.decision && typeof v.decision.text === 'string') { const d = { id: 'rd-' + (a.decisions.length + 1), text: v.decision.text.slice(0, 2000), supersedes: v.decision.supersedes || null, by: editor, at }; a.decisions.push(d); delta.decision = d; }
    if (v.summary && typeof v.summary.text === 'string') { a.summary = { text: v.summary.text.slice(0, 8000), covers_until: v.summary.covers_until || null, version: ((a.summary && a.summary.version) || 0) + 1, updatedBy: editor, updatedAt: at }; delta.summary = a.summary; }
    if (!Object.keys(delta).length) return true;
    a._version++; wsRoomsSave();
    wsRoomBroadcast(room, wsRoomEvent('RoomArtifacts', { roomId: room.roomId, delta, version: a._version }));
    return true;
  }
  return false;
}
function wsRoomMessage(conn, msg) {                          // roomId 실린 CUSTOM — 가드 통과 시 참여자 fan-out (§13.30.4)
  const room = wsRoomFind(msg.roomId);
  if (!room) { wsRoomGuardNotify(conn, { roomId: String(msg.roomId), participants: [] }, 'no-such-room', msg, 'dropped'); return; }
  const fromBoard = conn.meta.role !== 'agent';
  const sender = fromBoard ? 'board' : conn.meta.agentId;
  msg.speakerClass = fromBoard ? 'human-operator' : 'agent'; // 서버가 스탬프 — 클라 주장 불신 (§13.30.4-5 authority 전제)
  if (!fromBoard && !room.participants.some((p) => p.agentId === sender)) { wsRoomGuardNotify(conn, room, 'not-participant', msg, 'parked'); room.parked.push({ msgId: msg.msgId, from: sender, at: Date.now(), rule: 'not-participant' }); if (room.parked.length > 20) room.parked.shift(); return; }
  if (fromBoard) {                                           // human soft-yield — autoHop 리셋 + yield 이벤트 (§13.30.4-5)
    room._autoHop = 0; room._noProgress = 0;
    wsRoomBroadcast(room, wsRoomEvent('RoomYield', { roomId: room.roomId, msgId: msg.msgId || null }));
  } else {
    // 가드 1: rate (per-agent per-room, 60s 창)
    const now = Date.now(); const rl = room._rate[sender] = (room._rate[sender] || []).filter((t) => now - t < 60000);
    if (rl.length >= room.budgets.ratePerMin) { wsRoomGuardNotify(conn, room, 'rate', msg, 'parked'); room.parked.push({ msgId: msg.msgId, from: sender, at: now, rule: 'rate' }); if (room.parked.length > 20) room.parked.shift(); return; }
    rl.push(now);
    // 가드 2: 연속 발화 상한 (allow_repeat_speaker 일반화)
    if (room._lastSpeaker === sender) { room._consec++; } else { room._lastSpeaker = sender; room._consec = 1; }
    if (room._consec > room.budgets.maxConsecutive) { wsRoomGuardNotify(conn, room, 'consecutive', msg, 'parked'); room.parked.push({ msgId: msg.msgId, from: sender, at: now, rule: 'consecutive' }); if (room.parked.length > 20) room.parked.shift(); room._consec = room.budgets.maxConsecutive; return; }
    // floor intent 는 파킹 여부와 무관하게 먼저 등재 — "체인이 막혀도 손은 들 수 있다" (§13.30.4-6; autoHop 파킹이 request 를 삼키면 재개 신호가 사라짐)
    const _fi = msg.floorIntent; const _fiIntent = _fi && (typeof _fi === 'string' ? _fi : _fi.intent);
    if (_fiIntent === 'request') { room.floor.queue = room.floor.queue.filter((q) => q.agentId !== sender); room.floor.queue.push({ agentId: sender, bid: Number((typeof _fi === 'object' && _fi.bid) || 0) || 0, at: now }); room.floor.queue.sort((a, b) => (b.bid - a.bid) || (a.at - b.at)); wsRoomBroadcast(room, wsRoomEvent('RoomFloor', { roomId: room.roomId, queue: room.floor.queue })); }
    else if (_fiIntent === 'release' || _fiIntent === 'yield') { room.floor.queue = room.floor.queue.filter((q) => q.agentId !== sender); }
    // 가드 3: autoHop — 인간 개입 없는 agent 체인 깊이. 상한 도달 시 파킹 + RoomStall (silent drop 금지)
    room._autoHop++; msg.autoHop = room._autoHop;
    if (room._autoHop > room.budgets.maxAutoHop) {
      room.parked.push({ msgId: msg.msgId, from: sender, at: now, rule: 'autoHop' }); if (room.parked.length > 20) room.parked.shift();
      wsRoomBroadcast(room, wsRoomEvent('RoomStall', { roomId: room.roomId, reason: 'autoHop-cap', parkedMsgId: msg.msgId || null, from: sender, hint: 'human/moderator 입력이 체인을 리셋해요' }));
      room._autoHop = room.budgets.maxAutoHop; return;
    }
    // 가드 4: stall — addressee 없는 agent 발화 연속 (무진전 신호)
    if (Array.isArray(msg.addressee) && msg.addressee.length) room._noProgress = 0; else room._noProgress++;
    if (room._noProgress >= room.budgets.stallRounds) { room._noProgress = 0; wsRoomBroadcast(room, wsRoomEvent('RoomStall', { roomId: room.roomId, reason: 'no-addressee-progress', hint: '지목 없는 발화가 연속 — 규율 D2/D3 점검' })); }
    // notice 클래스 위반 표면화 (§13.30.4-7) — notice 메시지에 대한 agent reply
    if (msg.replyTo && room._notices.includes(msg.replyTo)) wsRoomGuardNotify(conn, room, 'notice-reply', msg, 'warned');
    if (!_fiIntent) room.floor.queue = room.floor.queue.filter((q) => q.agentId !== sender);   // 통과한 일반 발화 = floor 소비 (request 등재는 위에서 선처리)
  }
  if (msg.notice === true && msg.msgId) { room._notices.push(msg.msgId); if (room._notices.length > 50) room._notices.shift(); }
  if (msg.agentId == null && !fromBoard) msg.agentId = sender;
  if (msg.source == null) msg.source = fromBoard ? 'board' : 'agent';
  // fan-out: 참여자 전원(발신자 제외) — 기존 1:1 relay 기계(pending/재전달/AckProcessed) 계승 (§13.30.4-1)
  let delivered = 0, offline = [];
  for (const p of room.participants) {
    if (p.agentId === sender) continue;
    const d = wsAgents.get(p.agentId);
    if (d && d.alive) { const copy = Object.assign({}, msg, { targetAgentId: p.agentId }); d.send(copy); if (wsIsAckable(copy)) _relayPendingAdd(p.agentId, copy); delivered++; }
    else offline.push(p.agentId);
  }
  if (!fromBoard && wsIsAckable(msg) && conn.alive) {         // 발신자에게 단일 요약 delivered ack (수신자별 N 개 소음 대신)
    const ackEv = wsRoomEvent('Ack', { ackFor: msg.msgId || msg.messageId, kind: 'delivered', from: 'room:' + room.roomId, recipients: delivered, offline });
    ackEv.targetAgentId = sender; conn.send(ackEv);
  }
  wsToBoards(msg); wsRecord(msg);                             // 대시보드 관찰 + room:<id> 채널 영속 (wsMsgChan roomId 분기)
  try { push.maybePush(msg); } catch {}
}
// ──────────────────────────────────────────────────────────────────────────────────────────
server.on('upgrade', (req, socket) => {
  if (req.url.split('?')[0] !== '/ws') { socket.destroy(); return; }
  // #5a-3 upgrade 사전검사 — 노출 환경에서 agent·MCP 둘 다 차단된 IP 는 handshake 전 거부 (접속 직후 보내는 History/AgentList 누수 차단).
  //   둘 중 하나라도 허용이면 통과 후 HELLO 에서 표면별(agent/MCP) 정밀 판정 + requireKey 검사. loopback/비-노출은 면제.
  { const _ip = req.socket.remoteAddress;
    if (!_isLoopback && !isLoopbackIp(_ip) && !(surfaceAllowed('agent', _ip) || surfaceAllowed('mcp', _ip))) {
      console.warn('[ws upgrade] #5a-3 차단 IP 거부 (agent·MCP 둘 다 allowlist 밖) ip=%s', _ip || '?'); socket.destroy(); return;
    } }
  const conn = wscore.handleUpgrade(req, socket);
  if (!conn) return;
  try { const u = new URL(req.url, 'http://x').searchParams; const k = u.get('key') || u.get('peerKey') || u.get('upstreamKey') || u.get('collabKey'); conn.meta._urlKey = k; const kr = wsKeyRole(k); if (kr === 'collab') { conn.meta.collab = true; conn.meta.upstreamKey = k; } else if (kr === 'peer') { conn.meta.peer = true; conn.meta.upstreamKey = k; } else if (kr === 'upstream' || wsValidKey(u.get('upstreamKey'))) { conn.meta.upstream = true; conn.meta.upstreamKey = k; } if (k != null) console.log('[ws upgrade] key=%s role=%s', String(k).slice(0, 14) + '…', kr); } catch {}   // #168 키 role 판정 · v2.4.0 upstreamKey 보관 (KEY-MGMT 매칭) · v2.4.52 peer(pk-) 분기
  wsConns.add(conn);
  conn.send(wscore.event('SERVER_HELLO', { sessionId: conn.id, protocolVersion: '0.3', serverTime: new Date().toISOString() }));
  conn.send(wscore.event('CUSTOM', { name: 'AgentList', value: { agents: wsAgentList() } }));   // 먼저 role/이름 — 모니터 a2a 분류(§13.5)·History 재생이 role 을 참조하므로
  { const _h = wsHistoryPayload(); if (_h.events.length || _h.cold.length || _h.archived.length || Object.keys(_h.manifests).length) conn.send(wscore.event('CUSTOM', { name: 'History', value: _h })); }   // C(lazy): active 채널 events + cold/archived stub(내용은 탭 클릭·복원 시 on-demand)
  conn.onclose = () => {
    wsConns.delete(conn);
    keyOnConnClose(conn);                                       // v2.4.0 §4 REVOKED_PENDING 마지막 conn 종료 시 REVOKED 확정
    if (conn.meta.role === 'agent' && conn.meta.agentId && wsAgents.get(conn.meta.agentId) === conn) {
      wsAgents.delete(conn.meta.agentId);
      wsPushAgentList();                                        // 해제 알림 → 대시보드 탭 갱신
    }
  };
  conn.onmessage = (msg) => {
    if (msg && msg.type === 'HELLO') {                          // 에이전트 등록 (agentId 별, 동일 id 재접속 시 기존 대체)
      conn.meta.role = 'agent';
      const _hadId = !!(msg.agentId && String(msg.agentId).trim());   // agentId 명시 여부 — 누락(익명)은 매 재연결 새 탭 폭증(아래 랜덤 fallback)이라 등록 거부
      conn.meta.anonymous = !_hadId;
      conn.meta.agentId = _hadId ? msg.agentId : ('agent-' + conn.id.slice(0, 4));
      conn.meta.clientId = msg.clientId;
      conn.meta.agentName = msg.agentName || conn.meta.agentId;
      { const k = msg.key || msg.peerKey || msg.upstreamKey || msg.collabKey; const kr = wsKeyRole(k); if (kr === 'collab') { conn.meta.collab = true; conn.meta.upstreamKey = k; } else if (kr === 'peer') { conn.meta.peer = true; conn.meta.upstreamKey = k; } else if (kr === 'upstream' || (msg.upstreamKey && wsValidKey(msg.upstreamKey))) { conn.meta.upstream = true; conn.meta.upstreamKey = k; } }   // #168 HELLO 키 role 판정 · v2.4.0 upstreamKey 보관 (KEY-MGMT 매칭) · v2.4.52 peer(pk-) 분기
      conn.meta.roleHint = msg.role || '';                       // local/upstream 힌트(최종 판정은 키·main)
      // #5a-3 표면별 접근 판정 — HELLO 에서 agent/MCP 구분(capabilities mcp-proxy) 후 그 표면의 IP allowlist + (둘 다) requireKey 적용.
      { const _ip = conn.remoteAddr;
        const _surface = (Array.isArray(msg.capabilities) && msg.capabilities.includes('mcp-proxy')) ? 'mcp' : 'agent';
        if (!surfaceAllowed(_surface, _ip)) {
          console.warn('[ws HELLO] #5a-3 %s 거부 (IP allowlist 밖) ip=%s agent=%s', _surface, _ip || '?', conn.meta.agentId);
          try { conn.close(); } catch {} return;
        }
        if (accessCfg.agent.requireKey && !_isLoopback && !isLoopbackIp(_ip)) {
          const _k = msg.key || msg.peerKey || msg.upstreamKey || msg.collabKey || conn.meta._urlKey;
          if (!wsValidKey(_k)) { console.warn('[ws HELLO] #5a-3 무키/무효키 거부 ip=%s agent=%s', _ip || '?', conn.meta.agentId); try { conn.close(); } catch {} return; }
        }
      }
      console.log('[ws HELLO]%s agent=%s ip=%s ua=%s upstreamKey=%s → role=%s', _hadId ? '' : ' [ANON]', conn.meta.agentId, conn.remoteAddr || '?', (conn.ua || '').slice(0, 50) || '-', msg.upstreamKey ? String(msg.upstreamKey).slice(0, 14) + '…' : '(none)', wsAgentRole(conn));   // role 전환 audit + 출처(ip/ua)
      if (!_hadId) { console.log('[ws HELLO][ANON] 익명 HELLO 등록 거부(AgentList/relay/탭 제외) raw=%s', JSON.stringify(msg).slice(0, 240)); return; }   // 익명(agentId 누락) = 보드 탭 미생성·relay 제외, 출처 로깅만
      const prev = wsAgents.get(conn.meta.agentId);
      if (prev && prev !== conn) { try { prev.close(); } catch {} }
      wsAgents.set(conn.meta.agentId, conn);
      wsChanRoleNote(conn.meta.agentId, wsAgentRole(conn));   // v2.4.59 — 채널 role 영속 (끊긴 뒤에도 스텁이 그룹 유지)
      wsPushAgentList();
      if (conn.meta.upstreamKey) keyObserveHello(conn.meta.upstreamKey, conn.meta.agentId);   // v2.4.0 §3.2/§4 lastAgent·lastSeenAt + ISSUED→ACTIVE
      return;
    }
    if (conn.meta.role === 'agent') {                           // 에이전트 outbound
      if (conn.meta.anonymous) return;                           // 익명 클라(agentId 누락) 메시지 무시 — relay/기록/탭 일절 안 함
      if (wsHandleOrch(conn, msg)) return;                       // 오케스트레이션 CUSTOM(RegisterUpstreamKey/RevokeUpstreamKey/SetMain/HandoffReady)
      if (msg && msg.type === 'CUSTOM' && (msg.name === 'Heartbeat' || msg.name === 'PersistentAdapterSmoke' || msg.name === 'Typing')) return;   // liveness/transient — relay·board·기록 안 함
      if (msg && msg.agentId == null) msg.agentId = conn.meta.agentId;
      if (msg && msg.source == null) msg.source = 'agent';        // v2.2.4 source_stamp_truth (server.eux derive) — client-set 우선, server 폴백(backward compat)
      if (msg && msg.type === 'CUSTOM' && msg.name === 'ServerNotice') { wsToAll(msg); wsRecord(msg); return; }   // 재시작/오프라인/온라인 공지 → 모든 연결(에이전트+board) broadcast
      if (msg && msg.type === 'CUSTOM' && ['RoomCreate', 'RoomJoin', 'RoomLeave', 'RoomClose', 'RequestRoomArtifacts', 'RoomArtifactsUpdate'].includes(msg.name)) { if (wsRoomOp(conn, msg)) return; }   // §13.30 room lifecycle (agent 측)
      if (msg && msg.type === 'CUSTOM' && msg.roomId) { wsRoomMessage(conn, msg); return; }                        // §13.30 room 메시지 — 가드 + fan-out
      // v2.2.4 targetFallback + WARN (silent-disable 원칙 정합): top-level 누락 시 value.targetAgentId 폴백, 발견 통보
      if (msg && msg.targetAgentId == null && msg.value && msg.value.targetAgentId) {
        msg.targetAgentId = msg.value.targetAgentId;
        console.warn('[ws] WARN: targetAgentId fallback from value.targetAgentId (agent outbound from %s) — client envelope shape mismatch', conn.meta.agentId);
      }
      const tgt = msg && msg.targetAgentId;                      // A2A: 다른 에이전트 대상이면 상대에게 relay
      // §13.13.2 v0.4/v0.5: AckProcessed inbound → clear sender's pending entry for the ackFor msgId.
      //   BUG FIX (v2.5.19): the queue key MUST be conn.meta.agentId (the AckProcessed *sender* =
      //   original *recipient* of the message being acked = pending queue key), NOT tgt
      //   (which is AckProcessed.targetAgentId = the original *sender*, wrong queue). Pre-fix the
      //   lookup ran against the wrong queue and silently missed every commitment-tier clear,
      //   surfaced as redelivery → false RelayUnreachable{commitment-ack-absent} on the 2026-06-02
      //   dogfood; main found + fixed the equivalent line on its own server first, EG reference
      //   bug confirmed by code review and shipped here.
      if (msg && msg.type === 'CUSTOM' && msg.name === 'AckProcessed' && msg.value && msg.value.ackFor && tgt) {
        _relayPendingClear(conn.meta.agentId, msg.value.ackFor);
      }
      if (tgt && wsAgents.has(tgt)) {
        const d = wsAgents.get(tgt); if (d && d.alive) {
          d.send(msg);
          if (wsIsAckable(msg) && conn.alive) {   // §13.13 서버 delivered ack — relay 성공 시 발신자에게 자동 회신(전달 계층, board 미표시=과확인 피로 게이팅). 재기동 시 발효.
            const _ackEv = wscore.event('CUSTOM', { name: 'Ack', value: { ackFor: msg.msgId || msg.messageId, kind: 'delivered', from: tgt } });
            _ackEv.targetAgentId = conn.meta.agentId; _ackEv.source = 'server';
            conn.send(_ackEv);
          }
          // §13.13.2 v0.4: register pending entry for msgId-bearing targeted CUSTOM (excludes ack/ping kinds via wsIsAckable check above)
          if (wsIsAckable(msg)) _relayPendingAdd(tgt, msg);
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
      try { push.maybePush(msg); } catch {}                      // #3b webpush — 의미있는 A2A(noise 제외)면 구독자에게 tickle (탭 닫혀도 도달)
      return;
    }
    // 오케스트레이션 (board/사용자발 SetMain·RegisterUpstreamKey 등)
    if (wsHandleOrch(conn, msg)) return;
    // §13.30 room lifecycle + room 메시지 (board/사용자 측 — human soft-yield 경로)
    if (msg && msg.type === 'CUSTOM' && ['RoomCreate', 'RoomJoin', 'RoomLeave', 'RoomClose', 'RequestRoomArtifacts', 'RoomArtifactsUpdate'].includes(msg.name)) { if (wsRoomOp(conn, msg)) return; }
    if (msg && msg.type === 'CUSTOM' && msg.roomId) { wsRoomMessage(conn, msg); return; }
    // ✕ 닫기 → 해당 채널 기록 삭제 + 모든 board 갱신
    if (msg && msg.type === 'CUSTOM' && msg.name === 'CloseChannel') { wsCloseChannelHist(msg.value && msg.value.agentId); wsToBoards(msg); return; }
    if (msg && msg.type === 'CUSTOM' && msg.name === 'DeleteChannelHistory') { wsCloseChannelHist(msg.value && msg.value.agentId); wsToBoards(msg); return; }   // 🗑 영구삭제 — history 파일 제거(persist) + 다른 board 동기 (EstreUF parity)
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

// v2.4.11 보안: 기본 바인드 = loopback(127.0.0.1). board(대시보드) 연결은 인증 없이 키 발급·SetMain 을
// 할 수 있는 trusted-operator 전제라, 네트워크 노출은 명시 opt-in 이어야 함 (secure-by-default).
// LAN/원격 노출이 필요하면 WS_BIND=0.0.0.0 (또는 특정 인터페이스 IP) 를 명시 주입 + 그땐 token 게이트 권장.
// (WS_BIND/_isLoopback 정의는 상단 config 블록으로 이동 — #5a access-gating 이 모듈 로드시 노출 판정을 사용.)
server.listen(PORT, WS_BIND, () => {
  console.log(`Constellation live dashboard → http://localhost:${PORT}/  (state: ${STATE})  [WS: /ws]  [bind: ${WS_BIND}]`);
  console.log(`[server] WS_PRIMARY_ID=${WS_PRIMARY_ID}  (메인 role 로 분류될 agentId — WS_PRIMARY_AGENT env 로 주입)`);
  if (!_isLoopback) {   // v2.4.11 — 비-loopback 바인드는 무인증 board 표면(키관리·SetMain)을 네트워크에 노출. 운영자 인지 필수.
    console.warn(`[server] ⚠⚠ WS_BIND=${WS_BIND} (비-loopback) — board 연결은 무인증이라 같은 네트워크의 누구나 키 발급/조회/SetMain 이 가능합니다. 신뢰 네트워크에서만 사용하거나 reverse-proxy + 인증을 앞단에 두세요. (기본값은 127.0.0.1 — 노출은 의도적 opt-in.)`);
    const _f = (al) => Array.isArray(al) ? al.length + ' IPs' : 'all';   // #5a-3 노출 시 표면별 접근 정책 1줄 표시
    console.log(`[server] #5a access — ui:${_f(accessCfg.ui.allowlist)} · agent:${_f(accessCfg.agent.allowlist)}(requireKey:${accessCfg.agent.requireKey}) · mcp:${_f(accessCfg.mcp.allowlist)}  (access.json — 비우면 전체 허용)`);
  }
  if (WS_PRIMARY_ID === 'main-agent') {   // generic default — 다운스트림은 자기 환경 메인 agentId 를 WS_PRIMARY_AGENT 로 주입해야 그 세션이 main 으로 분류됨 (미설정 시 모든 비-키 에이전트가 local). 재기동 시 env 누락 주의.
    console.warn(`[server] ⚠ WS_PRIMARY_AGENT 미설정 — WS_PRIMARY_ID 가 generic default 'main-agent' 입니다. 메인 세션의 agentId 와 다르면 그 세션이 local 로 분류돼요. 기동/재기동 시 WS_PRIMARY_AGENT=<main agentId> 주입 권장 (SetMain 핸드오프로도 전환 가능).`);
  }
});
