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
const os = require('os');                            // v2.4.85 — 접속 URL 후보 host 열거 (다중 NIC/IP)
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
//   - allowlist 의 정의역은 **사설 대역**이에요 (v2.4.125). 항목은 이름(loopback/private/cgnat/
//     linklocal/ula/all-private) 또는 사설 CIDR·정확-IP. null/미배열 = **사설 전부**(종전 «전체 IP»
//     에서 좁혀짐). 빈 배열 = loopback 만. loopback 은 목록과 무관하게 통과.
//     **공개 주소는 설정으로 열 수 없어요** — 적으면 사유와 함께 무시돼요. 밖에서 닿아야 하면
//     오버레이 망(Tailscale 등 CGNAT), 인터넷 노출이면 리버스 프록시가 TLS 를 맡아요.
//   - 비-노출(loopback bind) 환경에선 IP 게이트 전체 무동작 (로컬 전용이라 의미 없음).
//   - agent.requireKey: true 면 노출 환경에서 무키/무효키 /ws 연결 거부 (v2.4.11 무인증 board 벡터 차단). 기본 false.
//   - expose (#5a-4): true 면 WS_BIND 미지정 시 0.0.0.0(LAN 노출) 로 bind. WS_BIND env 가 있으면 그게 우선. 변경은 /api/restart 로 적용(bind-time).
// 순수 가산: access.json 부재 시 동작 무변화(loopback + 전체 허용). (UI=HTTP 표면 · agent/MCP=WS 표면, MCP 는 HELLO capabilities 로 식별.)
const ACCESS = process.env.ACCESS_FILE || path.join(DIR, 'access.json');
// v2.4.136 §13.25.17 — 운영자 계정 층. **계정 0 = 완전 비활성**(가산 규율): 이 줄이 있는 것만으로는
//   어떤 배포도 바뀌지 않아요. 파일은 key.json·access.json 과 같은 급의 비밀이라 gitignore + 0600.
const operatorAuth = require('./operator-auth.cjs').createOperatorAuth({
  file: process.env.OPERATORS_FILE || path.join(DIR, 'operators.json'),
  log: (...a) => console.log(...a),
});
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
try { fs.watchFile(ACCESS, { interval: 1000 }, () => { loadAccess(); reportAccessRejects(); }); } catch {}   // allowlist/requireKey hot-reload (expose 변경은 /api/restart 로 bind 재적용)

// v2.4.11 secure-by-default 바인드. WS_BIND env 우선, 없으면 access.json 의 expose 로 결정 (#5a-4 — 그래서 access block 뒤에 정의).
const WS_BIND = process.env.WS_BIND || (accessCfg.expose ? '0.0.0.0' : '127.0.0.1');
const _isLoopback = WS_BIND === '127.0.0.1' || WS_BIND === '::1' || WS_BIND === 'localhost';
// v2.4.125 §13.25.15 — 접속 판정을 `ip-scope.cjs` 한 곳으로. **바뀐 건 판정이 아니라 어휘예요**:
//   종전엔 `allowlist: null` 이 «전체 IP 허용» 이었고, 그래서 보드를 노출한 순간 아무 주소나
//   통과했어요(실측: 비-loopback 주소가 키·HELLO 없이 명부와 이력 수신). 보드가 인터넷에
//   노출되지 않는다는 게 전제라면 «전체 허용» 은 **적을 수 있는 값이면 안 돼요** — 설정 한 줄로
//   뒤집히는 전제는 전제가 아니에요. 이제 허용목록의 정의역은 **사설 대역**이고, 공개 주소는
//   설정으로 열 수 없어요. 밖에서 닿아야 하면 오버레이 망(CGNAT 100.64/10), 인터넷 노출이면
//   리버스 프록시 — 둘 다 서버가 보는 주소는 사설이에요.
const ipScope = require('./ip-scope.cjs');
const normIp = ipScope.normIp;
function isLoopbackIp(ip) { return ipScope.scopeOf(ip) === 'loopback'; }
function ipMatch(entry, ip) { return ipScope.decide([entry], ip).ok; }   // 판정처는 하나 — 사본은 반드시 갈라져요
/** 사유까지 필요한 호출부용. boolean 만 돌려주면 「왜 안 붙지」가 무증상이 돼요. */
function surfaceDecide(surface, ip) {
  if (_isLoopback) return { ok: true, scope: 'loopback', why: '비-노출 bind — 게이트 무동작' };
  return ipScope.decide(accessCfg[surface] && accessCfg[surface].allowlist, ip);
}
function surfaceAllowed(surface, ip) { return surfaceDecide(surface, ip).ok; }
// 거부된 허용목록 항목은 **매 로드마다 출력**해요. 조용히 버리면 「적어 뒀는데 안 먹는다」가
// 무증상으로 남고, 그건 설정이 있다는 착각을 만들어요.
function reportAccessRejects() {
  for (const surface of ['ui', 'agent', 'mcp']) {
    const al = accessCfg[surface] && accessCfg[surface].allowlist;
    if (al == null) continue;
    const n = ipScope.normalizeAllowlist(al);
    for (const r of n.rejected) console.warn('[access] %s.allowlist 항목 무시 «%s» — %s', surface, r.entry, r.why);
    if (!n.groups.length && !n.cidrs.length) console.warn('[access] %s.allowlist 가 비어요 — loopback 만 통과해요', surface);
  }
}
reportAccessRejects();

// `tml-10` — **프록시가 앞에 있으면 loopback 이라는 사실이 아무 뜻이 없어요.** 원격이 전부 로컬로
//   보여서 아래의 host-local 신뢰가 통째로 뒤집혀요(종전 코드 주석이 스스로 인정하던 구멍).
//   대역으로는 신원을 만들 수 없으니 여기서 하는 건 **알아채고 신뢰를 취소하는 것**이에요 —
//   전달 헤더가 붙어 온 요청은 「로컬」로 세지 않아요. 프록시 뒤에서 사람을 가려내는 건 다음 층
//   (로그인)의 몫이고, 그건 결정 대기예요.
function reqIsHostLocal(req) {
  if (!req) return false;
  if (ipScope.forwardedPresent(req.headers)) return false;
  return isLoopbackIp(req.socket && req.socket.remoteAddress);
}

// **loopback 은 방어층이지 신원이 아니에요.** 위 함수는 프록시 경유를 걸러내지만(tml-10), 걸러낸
//   뒤에 남는 건 «같은 호스트의 누군가» 예요 — 어느 로컬 프로세스든 통과해요. 그리고 이 게이트가
//   지키는 엔드포인트 중 하나(/api/access POST)는 **bind 주소를 넓히는** 것이라, 로컬 비권한
//   프로세스가 보드를 전체 주소로 뒤집을 수 있는 권한 상승 경로가 됩니다.
// 그래서 관리 엔드포인트는 **loopback + 운영자 세션** 둘을 요구해요. 다만 §13.25.17 의 가산 계약을
//   지켜요 — 계정이 0이면 그 층은 «존재하지 않는» 것이고, 없는 것을 요구하면 그 배포는 재시작
//   엔드포인트를 잃어요. 그래서 계정이 있을 때만 세션을 요구하고, **노출된 상태에서 계정이 0이면
//   그 사실을 매번 말해요** — 강제할 수 없는 자리를 조용히 두지 않는 게 요점이에요.
// **로그인 화면이 오버레이일 뿐이면 로그인이 아니에요.** 실측(2026-08-07): 계정이 1개 있고
//   `loginRequired:true` 인 상태에서 쿠키 없이 `/api/state` 를 부르면 보드 전체 상태가 그대로
//   돌아왔어요 — 예정·완료·검토사안·프로젝트 전부. 개발자 도구로 레이어를 걷을 필요도 없고
//   `curl` 한 줄이면 됐어요. 화면은 가렸는데 데이터는 안 가렸던 자리예요.
// 가산 계약은 여기서도 같아요 — 계정이 0이면 그 층은 존재하지 않으니 요구할 수 없어요.
//   그때는 통과시키되, 노출 상태면 그 사실을 말해요(조용히 열어두지 않아요).
let _readGateWarned = false;
function readGate(req, res, what) {
  if (!operatorAuth.enabled()) {
    if (accessCfg.expose && !_readGateWarned) {
      _readGateWarned = true;
      console.warn('[server] ⚠ %s — 노출 상태인데 운영자 계정이 0이라 인증 없이 보드 상태를 읽을 수 있어요. 계정을 만드세요 (이 경고는 한 번만).', what);
    }
    return true;
  }
  if (operatorAuth.operatorOfReq(req)) return true;
  sendJson(res, 401, { ok: false, error: 'login-required', hint: what + ' 은 운영자 로그인이 필요해요.' });
  return false;
}

function adminGate(req, res, what) {
  if (!reqIsHostLocal(req)) { sendJson(res, 403, { ok: false, error: what + ' 은 로컬(loopback)에서만 가능해요.' }); return false; }
  if (operatorAuth.enabled()) {
    if (!operatorAuth.operatorOfReq(req)) { sendJson(res, 401, { ok: false, error: 'login-required', hint: what + ' 은 운영자 로그인이 필요해요 (loopback 만으로는 신원이 아니에요).' }); return false; }
    return true;
  }
  if (accessCfg.expose) {
    console.warn('[server] ⚠ %s — 노출(expose=true) 상태인데 운영자 계정이 0이라 loopback 만으로 통과했어요. 같은 호스트의 어느 프로세스든 이 엔드포인트를 쓸 수 있어요. 계정을 만드세요.', what);
  }
  return true;
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

// v2.4.78 — LLM 이 직접 쓰는 파일엔 기계 게이트 (adopter C6 실장애: trailing comma 하나 → /api/state 가
// 깨진 텍스트를 200 으로 서빙 → 대시보드 전 패널 blank → 백업이 깨진 SSoT commit. 파싱 검증 + last-good 폴백.)
let _lastGoodState = null;
function readState() {
  try {
    const raw = fs.readFileSync(STATE, 'utf8');
    JSON.parse(raw);   // 검증만 — 서빙은 원문 그대로
    _lastGoodState = raw;
    return raw;
  } catch (e) {
    if (_lastGoodState) { console.warn('[state] state.json 손상/부재 — last-good 폴백 서빙 (%s)', (e && e.message) || e); return _lastGoodState; }
    return '{"error":"no state.json yet"}';
  }
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
// v2.4.99 §13.25.11 (Ultrasafe it-1 web-01) — 상태변경 POST 의 CSRF 가드. 종전 게이트는 isLoopbackIp() **단독**이었고,
//   그 조건은 «같은 기계의 브라우저» 도 만족해요 — 어느 페이지의 JS 가 쐈든 무관하게. 그래서 운영자가 방문한 임의의
//   페이지가 access.json 을 다시 쓰고(allowlist 비우기 · requireKey 해제) 곧바로 /api/restart 로 적용까지 할 수
//   있었어요: «loopback 바인드라 기본 안전» 이 무인증 키관리 표면으로 뒤집히는 경로.
//   원칙 — 브라우저가 보내는 출처 신호(Sec-Fetch-Site · Origin)가 «다른 출처» 라고 말하면 거부. 신호가 아예 없으면
//   비-브라우저 클라이언트(curl · node · 스크립트)이므로 통과해요. 브라우저는 이 두 헤더를 억제할 수 없으니 이
//   완화가 CSRF 를 되열지 않아요 — 반대로 여기서 Origin 부재를 거부하면 운영 스크립트가 전부 깨져요.
function sameOriginPost(req) {
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return false;   // 최신 브라우저: cross-site/same-site 거부
  const origin = req.headers.origin;
  if (!origin) return true;                                              // 비-브라우저
  if (origin === 'null') return false;                                   // opaque origin(sandbox iframe·data:)
  let h; try { h = new URL(origin).host; } catch { return false; }
  return !!h && h === String(req.headers.host || '');
}
const CSRF_403 = { ok: false, error: '거부 — 이 요청의 출처(Origin/Sec-Fetch-Site)가 보드와 달라요. 상태를 바꾸는 POST 는 대시보드 자신 또는 비-브라우저 클라이언트에서만 받아요. (Constellation §13.25.11)' };

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
      if (!adminGate(req, res, 'access.json 변경')) return;
      if (!sameOriginPost(req)) { console.warn('[server] §13.25.11 /api/access POST cross-origin 거부 origin=%s host=%s', req.headers.origin || '-', req.headers.host || '-'); return sendJson(res, 403, CSRF_403); }
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
    if (!adminGate(req, res, '재시작')) return;
    if (!sameOriginPost(req)) { console.warn('[server] §13.25.11 /api/restart POST cross-origin 거부 origin=%s host=%s', req.headers.origin || '-', req.headers.host || '-'); return sendJson(res, 403, CSRF_403); }
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
    if (!readGate(req, res, '보드 상태 조회')) return;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(readState());
    return;
  }

  if (url === '/api/events') {
    if (!readGate(req, res, '보드 상태 스트림')) return;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      // v2.4.99 (Ultrasafe it-1 web-03) — `Access-Control-Allow-Origin: '*'` 제거. 이 스트림은 보드 **전체 상태**
      //   (예정·완료·검토사안·프로젝트)를 밀어주는데, ACAO:* 는 아무 제3자 페이지의 JS 가 그걸 **읽게** 해줬어요
      //   (web-01 과 합치면 읽고 **다시 쓰기**까지). 대시보드는 같은 서버가 서브하므로 same-origin — 헤더가 필요 없어요.
    });
    res.write(`event: state\ndata: ${readState().replace(/\n/g, ' ')}\n\n`);
    sseClients.add(res);
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 20000);
    req.on('close', () => { clearInterval(ping); sseClients.delete(res); });
    return;
  }

  // ── v2.4.136 §13.25.17 운영자 계정 엔드포인트 ─────────────────────────────────
  // 계정이 0이면 whoami 가 `loginRequired:false` 를 돌려주고 화면은 종전 그대로 떠요. 첫 계정 생성은
  //   «아직 아무도 없을 때만» 열려 있어요(부트스트랩) — 계정이 생긴 뒤의 추가·삭제는 로그인한 운영자만.
  if (url === '/api/whoami') {
    return sendJson(res, 200, { loginRequired: operatorAuth.enabled(), operator: operatorAuth.enabled() ? operatorAuth.operatorOfReq(req) : null, operatorCount: operatorAuth.count() });
  }
  if (url === '/api/login' && req.method === 'POST') {
    if (!sameOriginPost(req)) return sendJson(res, 403, CSRF_403);
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', async () => {
      let b; try { b = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'bad json' }); }
      if (!operatorAuth.enabled()) return sendJson(res, 409, { ok: false, error: 'no-operators', hint: '계정이 없어요 — 로그인 층이 꺼져 있어요.' });
      const r = await operatorAuth.verify(String(b.id || ''), String(b.password || ''));
      if (!r.ok) return sendJson(res, 401, { ok: false, error: r.error, retryAfterMs: r.retryAfterMs });
      res.setHeader('Set-Cookie', operatorAuth.setCookieHeader(r.token, !_isLoopback));
      sendJson(res, 200, { ok: true, operator: r.operator });
    });
    return;
  }
  if (url === '/api/logout' && req.method === 'POST') {
    if (!sameOriginPost(req)) return sendJson(res, 403, CSRF_403);
    operatorAuth.logout(operatorAuth.tokenFromReq(req));
    res.setHeader('Set-Cookie', operatorAuth.clearCookieHeader());
    return sendJson(res, 200, { ok: true });
  }
  if (url === '/api/operators') {
    if (req.method === 'GET') {
      if (operatorAuth.enabled() && !operatorAuth.operatorOfReq(req)) return sendJson(res, 401, { ok: false, error: 'login-required' });
      return sendJson(res, 200, { ok: true, operators: operatorAuth.list() });
    }
    if (req.method === 'POST' || req.method === 'DELETE') {
      if (!sameOriginPost(req)) return sendJson(res, 403, CSRF_403);
      // 첫 계정만 무인증 — 그 순간 이후로는 로그인이 문지기예요. 이 예외가 없으면 아무도 시작할 수 없어요.
      const bootstrap = req.method === 'POST' && !operatorAuth.enabled();
      if (!bootstrap && operatorAuth.enabled() && !operatorAuth.operatorOfReq(req)) return sendJson(res, 401, { ok: false, error: 'login-required' });
      if (!bootstrap && !operatorAuth.enabled()) return sendJson(res, 409, { ok: false, error: 'no-operators' });
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy(); });
      req.on('end', async () => {
        let b; try { b = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'bad json' }); }
        if (req.method === 'DELETE') {
          const me = operatorAuth.operatorOfReq(req);
          if (me && me.id === b.id && operatorAuth.count() === 1) return sendJson(res, 400, { ok: false, error: 'last-operator', hint: '마지막 계정은 지울 수 없어요 — 지우면 로그인 층이 꺼져 주소 판정으로 돌아가요. 의도한 것이면 파일을 직접 비우세요.' });
          return sendJson(res, operatorAuth.removeOperator(String(b.id || '')) ? 200 : 404, { ok: true });
        }
        try { const o = await operatorAuth.addOperator(b.id, b.name, b.password); sendJson(res, 200, { ok: true, operator: o, bootstrap }); }
        catch (e) { sendJson(res, 400, { ok: false, error: String((e && e.message) || e) }); }
      });
      return;
    }
  }
  if (url === '/api/feedback' && req.method === 'POST') {
    if (!sameOriginPost(req)) { console.warn('[server] §13.25.11 /api/feedback POST cross-origin 거부 origin=%s host=%s', req.headers.origin || '-', req.headers.host || '-'); return sendJson(res, 403, CSRF_403); }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on('end', () => {
      let entry;
      try { entry = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'bad json' }); }
      entry.receivedAt = new Date().toISOString();
      if (Array.isArray(entry.atts)) entry.atts = entry.atts.map(storeAtt);   // 첨부 data-URL → 디스크 추출
      try {
        fs.appendFileSync(FEEDBACK, JSON.stringify(entry) + '\n');
        wsRelayOperatorFeedback(entry);   // v2.4.131 §13.13.4 — 파일은 기록이고, 릴레이가 기상이에요. append 만 하면 «적혔는데 아무도 모름» (실측: 운영자 결정 답변 5건 무음)
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
      // v2.4.99 §13.25.11 (Ultrasafe it-1 후속 실측, 2026-07-26) — 이 엔드포인트는 **호스트-로컬 전용**이에요.
      //   /join/* 는 «키-게이트 agent-facing» 이라는 이유로 UI IP allowlist 에서 통째로 제외돼 있는데(위 §5a 가드),
      //   `local` 분기만은 **키를 안 받아요** — 라벨만 맞으면 200. 그리고 응답 본문에 WS_PRIMARY_ID 가 두 번,
      //   메인이 워커에 부여한 roleDescription 이 그대로 실려요. 즉 라벨(`board-observer` 처럼 추측 가능한 이름)
      //   하나로 **무인증 원격** 당사자가 «끊기지 않는 사슬» 1단계(정찰)를 공짜로 얻었어요 — 라이브 보드에서 실측
      //   (200 / 4.6KB / agentId 노출 확인). local 워커는 정의상 호스트-로컬이라 원격이 이 문서를 받을 이유가 없어요.
      // 여기는 `adminGate` 를 쓰지 **않아요** — 의도예요. 이 엔드포인트의 당사자는 로컬 워커(에이전트)고
      //   운영자가 아니라, 로그인을 요구하면 워커가 조인 문서를 못 받아요. 위험 모형도 달라요: 여기서
      //   막는 건 «원격 정찰» 이고 그건 loopback 판정으로 닫혀요. 반면 adminGate 가 붙은 둘은 상태를
      //   **바꾸는** 엔드포인트라 «같은 호스트의 누군가» 로는 부족해요. 세 자리 중 둘만 바꾼 게 누락이
      //   아니라는 걸 여기 적어 둬요.
      if (!reqIsHostLocal(req)) {
        console.warn('[server] §13.25.11 /join/local 원격 거부 ip=%s label=%s', normIp(req.socket.remoteAddress) || '?', label);
        res.writeHead(403, { 'Content-Type': 'text/markdown; charset=utf-8' });
        res.end('# 접속 거부\n\n로컬(local) 워커 온보딩은 보드를 띄운 호스트 자신에서만 조회할 수 있어요. (Constellation §13.25.11)');
        return;
      }
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
const wsPtySessions = new Map();               // Pantty §9 — sessionId → 연 board 연결. relay 바이트(TerminalData)를 «연 운영자» 연결에만 보내요(방송 시 다른 board 도 수신 = 셸 출력 유출).
const A2A_WINDOW = 120000;                     // reply-window(ms) — 응답 adapter 가 envelope echo 못할 때 fallback
const _telFillWarn = new Set();                // v2.4.138 — 되돌림이 빈 수신자를 채운 (발신자|이름|수신자) 조합, 조합당 1회만 경고

// §13.13.2 v0.4 at-least-once relay reliability — server-side pending queue + redelivery scheduler.
//   Per targeted CUSTOM with msgId, retain a pending entry until commitment-tier AckProcessed arrives.
//   Redeliver if first-attempt-ts exceeds threshold + attempt-count < max + recipient AgentList-present.
//   After max attempts → emit RelayUnreachable to sender + clear pending.
//   Provisional defaults per §13.13.2 (queue cap 256 · 5min prod / 30s dogfood threshold · max 3 attempts).
const _RELAY_PENDING_MAX = Number(process.env.RELAY_PENDING_MAX || 256);     // per-target FIFO cap
const _RELAY_THRESHOLD_MS = Number(process.env.RELAY_THRESHOLD_MS || 30 * 1000);   // 30s dogfood default; 5*60*1000 for prod
const _RELAY_MAX_ATTEMPTS = Number(process.env.RELAY_MAX_ATTEMPTS || 3);
const _RELAY_ABSENT_MAX_MS = Number(process.env.RELAY_ABSENT_MAX_MS || 10 * 60 * 1000);   // v2.4.127 부재 상한 — 돌아오지 않는 수신자 앞 항목을 무한 대기시키지 않아요
const _RELAY_SCAN_INTERVAL_MS = 10 * 1000;   // scheduler tick
const _relayPending = new Map();                                            // targetAgentId → Array<{ msgId, payload, firstAt, attempts, hasEmbeddedAttachment }>
function _hasEmbeddedAttachment(msg) {
  const atts = msg && msg.value && (msg.value.attachments || (msg.value.attachment && [msg.value.attachment]) || msg.value.files);
  if (!Array.isArray(atts)) return false;
  return atts.some((a) => a && (a.source === 'embedded' || a.dataUrl));
}
function _relayPendingAdd(tgt, msg) {
  // v2.4.127 §13.13.2 — 자격 판정은 **wsRelayKey 한 곳**에서만 나와요. 종전엔 이 함수가 `msg.msgId` 만,
  //   wsIsAckable() 은 `(msgId || messageId)` 를 봐서 두 문턱이 어긋났어요. 그 틈이 가장 나쁜 변종을 만들어요:
  //   발신자는 delivered ack 를 받아 «닿았다» 고 읽는데 그 프레임은 재전달 대상이 아니라, 끝내 안 닿아도
  //   미전달 통지가 안 나가요 — **건강해 보이는 무음 유실**. 한쪽 이름을 맞추는 게 아니라 술어를 합쳐요.
  const key = wsRelayKey(msg);
  if (!key) return;
  let q = _relayPending.get(tgt);
  if (!q) { q = []; _relayPending.set(tgt, q); }
  if (q.length >= _RELAY_PENDING_MAX) q.shift();                            // FIFO eviction on cap
  q.push({ msgId: key, payload: msg, firstAt: Date.now(), attempts: 1, hasEmbeddedAttachment: _hasEmbeddedAttachment(msg) });
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
      if (!recipientPresent) {
        // v2.4.127 — 재접속까지 재전달을 미루는 건 그대로예요(짧은 재기동을 유실로 만들지 않으려고).
        //   다만 종전엔 여기서 **그냥 continue** 라 attempts 가 영영 안 올라가서, 돌아오지 않는 수신자 앞
        //   항목은 통지도 없이 큐에 남았어요 — 발신자는 「보냈다」만 쥔 채 끝나요(부재로 위장한 고장).
        //   그래서 부재에도 **상한 시각**을 둬요: 그 시각을 넘기면 미전달로 종결하고 발신자에게 알려요.
        if (now_ - e.firstAt >= _RELAY_ABSENT_MAX_MS) {
          const senderId = (e.payload.agentId) || null;
          if (senderId) _relayUnreachableEmit(senderId, e, tgt, 'recipient-absent');
          q.splice(i, 1);
        }
        continue;
      }
      try { d.send(e.payload); e.attempts++; e.firstAt = now_; } catch {}
    }
    if (!q.length) _relayPending.delete(tgt);
  }
}
setInterval(_relayScheduleTick, _RELAY_SCAN_INTERVAL_MS).unref();
// v2.4.138 — 판정은 `frame-class.cjs` 한 곳에서. 종전엔 이 자리가 `codex-watch` **한 워처의 이름**
//   이었고, 규격이 「is tagged」라고만 해서 그게 곧 태그였어요. 그래서 나중에 생긴 좌석 계측이
//   규격상 telemetry 인데 제외되지 못했고, 응답창 되돌림이 그걸 협업 상대에게 부쳤어요.
const wsIsTelemetry = require('./frame-class.cjs').isTelemetryFrame;   // watcher telemetry 는 A2A reply-window 에 묶지 않음
const _WS_ACK_KINDS = require('./relay-key.cjs').ACK_KINDS;   // v2.4.127 — 목록은 클라와 **한 곳**에서 (relay-key.cjs). 두 벌로 들면 어긋난 날 ack 스톰이나 무음 유실이 돼요.   // §13.13 ack/ping류 — 이것 자체는 delivered ack 안 함(ACK storm 방지)
const _wsStampRelayKey = require('./relay-key.cjs').stampRelayKey;   // v2.4.131 — 회수 열쇠 발급도 같은 부품에서 (OperatorFeedback 릴레이가 사용)
// v2.4.127 §13.13.2 — **회수 자격을 정하는 단 하나의 술어.** ack 문턱(delivered 회신)과 pending 문턱(재전달
//   등재)이 각자 조건을 들고 있으면 반드시 어긋나요 — 실제로 어긋나 있었고, 그 틈이 「ack 은 오는데 재전달은
//   안 되는」 상태를 만들었어요. 열쇠를 **돌려주는** 형태로 둔 건 등재 항목의 키까지 같은 곳에서 나오게 하려고예요
//   (문턱만 합치고 키를 따로 읽으면 같은 드리프트가 한 칸 옆에서 재발해요).
//   `messageId` 는 레거시 철자예요 — 받아주되 회수 열쇠로 정규화해요. 무시하면 그 어댑터는 조용히 회수 불가가 돼요.
function wsRelayKey(msg) {
  if (!msg || wsIsTelemetry(msg)) return null;
  if (msg.type === 'CUSTOM' && _WS_ACK_KINDS.has(msg.name)) return null;    // ack/ping 류에 ack 를 붙이면 서로 되먹여 스톰이 돼요
  return msg.msgId || msg.messageId || null;
}
function wsIsAckable(msg) { return wsRelayKey(msg) != null; }   // §13.13 delivered ack 대상 = 회수 등재 대상 (같은 술어)
// 메인(main) 에이전트 — 대상(targetAgentId) 미지정 inbound/CUSTOM 의 우선 수신자(오케스트레이터). 핸드오프로 변경 가능.
let WS_PRIMARY_ID = process.env.WS_PRIMARY_AGENT || 'main-agent';   // generic default (dashboard WS_LOCAL 과 일관); 다운스트림이 자기 환경 메인 agentId 를 env 로 주입
function wsPrimaryAgent() { const p = wsAgents.get(WS_PRIMARY_ID); if (p && p.alive) return p; for (const c of wsAgents.values()) if (c.alive) return c; return null; }
// v2.4.99 §13.25.11 (Ultrasafe it-1 tml-01/se-01) — `main` 은 **호스트-로컬** 지위예요. 종전엔 `agentId === WS_PRIMARY_ID`
//   **문자열 일치** 하나로 main 이 됐고(선언과 제시된 키 사이에 아무 결속이 없음), main 은 곧 wsOperatorAuthz()=true —
//   키 발급·폐기·SetMain·§13.33.4 조직 선언 권한 전부. 그래서 `local` 종 키 하나만 있으면(collab/peer/upstream 플래그가
//   안 서는 유일한 종) 원격 당사자가 HELLO 한 줄로 진짜 main 을 evict 하고 그 자리를 차지할 수 있었어요 — 측정된
//   «끊기지 않는 사슬». WS_PRIMARY_ID 는 비밀이 아니고 온보딩 텍스트에 그대로 실려요(아래 /join/local 참고).
//   main 은 정의상 보드를 띄운 호스트의 오케스트레이터이므로, 원격 연결은 어떤 선언을 해도 main 이 되지 않아요.
//   지원되는 원격 «다른 프로젝트의 main» 은 `peer` 종(pk-)이고 그 경로는 이 분기를 타지 않아요.
// host-local = «이 기계에서 온 연결». 프록시가 앞에 있으면 원격이 전부 loopback 으로 보여서 이
//   판정이 통째로 뒤집혀요 — main role(제어면)이 그 위에 얹혀 있어요. 그래서 전달 헤더를 본
//   연결은 **loopback 이어도 로컬로 안 세요** (`tml-10`, v2.4.125).
function wsConnIsHostLocal(c) {
  if (!c) return false;
  if (c.meta && c.meta.fwd) return false;
  return !!(isLoopbackIp(c.remoteAddr) || isLoopbackIp(c.meta && c.meta.ip));
}
function wsAgentRole(c) { return c.meta.collab ? 'collab' : (c.meta.peer ? 'peer' : (c.meta.upstream ? 'upstream' : ((c.meta.agentId === WS_PRIMARY_ID && wsConnIsHostLocal(c)) ? 'main' : 'local'))); }   // v0.3 오케스트레이션 role (+collab #168, +peer v2.4.52 — peer-main ≠ 자율 upstream · v2.4.99 main=호스트-로컬)
// §13.13.3 (v2.4.96) — target-unspecified *text* intake. An external party that speaks with no
//   `targetAgentId` is addressing the room, and the main is the room's orchestrator: it must hear
//   it. Pre-fix the untargeted fallback below was CUSTOM-only, so such an utterance reached the
//   boards + history and stopped there — measured twice, worst case six hours of a peer's
//   substantive replies visible on the dashboard while the main sat silent until the operator
//   said "check it". Gated on the sender's **declared role**, not on frame shape: a `local`
//   sender (own workers, echo-mode mirror) reflects our own content back, and relaying that to
//   main is the false-wake flood already measured on the worker's own log (fixed 2026-07-04 with
//   a CUSTOM-only guard on the poller — the guard stays; this opens only the external lane).
const _WS_TEXT_FRAMES = new Set(['TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END']);
const _WS_EXTERNAL_ROLES = new Set(['collab', 'peer', 'upstream']);   // parties whose untargeted speech is genuinely inbound (never 'local'/'main')
// v2.4.87 §13.25.9 — 키 관리·SetMain 권한 판정. 에이전트 표면은 main 만. board 연결(무-HELLO 대시보드/운영자
// 클라이언트)은 loopback 이거나 **ui 표면 allowlist** 를 통과하는 주소만 — 대시보드 HTTP 를 여는 권한과 보드를
// 조작하는 권한을 같은 경계로 묶는다. access.json 부재/allowlist 없음 = 종전 fail-open 유지(파괴적 변경 회피)이며,
// 그 조합은 기동 로그가 명시적으로 경고한다.
function wsOperatorAuthz(conn) {
  if (conn.meta.role === 'agent') return wsAgentRole(conn) === 'main';
  // v2.4.136 §13.25.17 — **계정이 하나라도 있으면 주소가 아니라 계정이 판정해요.** 주소는 «어디서» 를
  //   답하지 «누구» 를 못 답하고, 프록시 뒤에서는 그 «어디서» 마저 전부 같아 보여요. 계정이 0이면 이
  //   갈래는 존재하지 않는 것과 같아요(가산 규율) — 종전 판정 그대로 내려가요.
  if (operatorAuth.enabled()) return !!conn.meta.operator;
  if (conn.meta.fwd) return false;
  const ip = conn.meta.ip || '';
  if (_isLoopback || isLoopbackIp(ip)) return true;
  return surfaceAllowed('ui', ip);
}
// 업스트림 등록키 레지스트리 (영속, gitignore). 메인이 발급 → 사용자 경유 업스트림에 전달 → 그 키로 upstream role.
const crypto = require('crypto');

// v2.4.118 (Ultrasafe crypto-06) — 로그에 찍는 키 지문. 상관(correlation)에는 쓸모 있고 비밀은 안 새요.
//   종전엔 키 앞 14자를 그대로 찍었어요. 키는 «역할 접두 + 24 hex» 라 그 14자가 96비트 중 약 44비트예요.
//   그리고 그게 **발급 때가 아니라 접속마다** stdout·로그파일로 나갔어요. 접두를 6~8자로 줄이는 방법도
//   있지만 그건 같은 종류의 누출을 «조금» 하는 거예요 — 해시는 그 부류를 없애요.
//   역할 접두(`ck-`·`pk-`·`lk-`)는 비밀이 아니라 그대로 남겨요. 그게 로그를 읽는 사람에게 쓸모 있는 부분이고,
//   접두만으로는 어떤 키도 좁혀지지 않아요.
function keyFp(k) {
  if (k == null || k === '') return '(none)';
  const s = String(k);
  const dash = s.indexOf('-');
  const pre = dash > 0 && dash <= 3 ? s.slice(0, dash + 1) : '';
  return pre + 'fp:' + crypto.createHash('sha256').update(s).digest('hex').slice(0, 8);
}


// v2.4.119 (Ultrasafe se-03) — 표시 이름 입구 검증.
//   v2.4.110 이 «매 메시지의 agentName 을 접속 시 값으로 못박기» 를 넣었는데, 못박는 대상인 그 값 자체는
//   검증 없이 들어왔어요. 못박기는 위조를 막는 게 아니라 **일관되게 위조된 이름**을 보장할 뿐이에요.
//   이 이름은 대시보드 탭 라벨과 **기기 푸시 알림의 발신자 줄**로 가요 — 운영자가 화면만 보고 신뢰를
//   판단하는 자리라, 여기서 통과시킨 문자열이 그대로 권위처럼 보여요.
//   세 가지를 봐요: ① 보이지 않는 문자(제어·폭 0·방향 뒤집기)로 다른 이름처럼 보이게 만들기
//   ② 남의 식별자를 자기 이름으로 선언하기(§13.25.11 이 키↔정체를 묶는 것과 같은 결)
//   ③ 서버·운영자를 자칭해서 «시스템이 하는 말» 처럼 보이게 하기.
//   거절은 조용히 하지 않고 **자기 식별자로 되돌리고 로그에 남겨요** — 위조된 값을 남기는 것보다
//   이름이 밋밋한 게 정확하고, 시도가 있었다는 사실은 보여야 해요.
const NAME_MAX = 80;   // 실측 최장 정상 이름 54자 (2026-07-29)
const NAME_RESERVED = /^(system|server|constellation|board|operator|admin|root|security|notice|alert|\uc6b4\uc601\uc790|\uad00\ub9ac\uc790|\uc2dc\uc2a4\ud15c|\uacbd\uace0|\uc54c\ub9bc)(?![\p{L}\p{N}_])/iu;
function safeAgentName(raw, selfId, peerIds) {
  let v = String(raw == null ? '' : raw);
  v = v.replace(/[\u0000-\u001f\u007f]/g, '')                                   // 제어문자
       .replace(/[\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g, '')  // 폭 0 · 방향 뒤집기
       .replace(/\s+/g, ' ')
       .trim();
  if (v.length > NAME_MAX) v = v.slice(0, NAME_MAX);
  if (!v) return { name: selfId, why: null };
  const norm = v.toLowerCase();
  for (const id of (peerIds || [])) {
    if (id !== selfId && String(id).toLowerCase() === norm) return { name: selfId, why: '다른 접속의 식별자를 자기 이름으로 선언' };
  }
  if (NAME_RESERVED.test(v)) return { name: selfId, why: '예약된 시스템·운영자 이름' };
  return { name: v, why: null };
}
const WS_KEYS = path.join(DIR, 'ws-keys.json');
let wsKeys = [];
try { const k = JSON.parse(fs.readFileSync(WS_KEYS, 'utf8')); if (Array.isArray(k)) wsKeys = k; } catch {}
// v2.4.100 (Ultrasafe it-1 crypto-03, critical) — 키 저장소는 소유자 전용 모드. ws-keys.json 은 A2A 키 문자열
//   원문이고 key.json 은 그 메타이며 local-keys/*.key 는 워커 키 원문이에요. 셋 다 umask 에만 의존했어요.
//   mode 는 **생성 시에만** 적용되므로 chmod 를 함께 걸어요 — 이미 0644 로 존재하는 파일은 덮어써도 안 좁혀져요.
function wsWriteSecret(file, data) {
  fs.writeFileSync(file, data, { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch {}
}
function wsSaveKeys() { try { wsWriteSecret(WS_KEYS, JSON.stringify(wsKeys)); } catch {} }
function wsIssueKey(label, role) { const r = role || 'upstream'; const prefix = r === 'collab' ? 'ck-' : r === 'local' ? 'lk-' : r === 'peer' ? 'pk-' : 'uk-'; const key = prefix + crypto.randomBytes(12).toString('hex'); wsKeys.push({ key, label: label || r, role: r, createdAt: new Date().toISOString() }); wsSaveKeys(); return key; }   // #168 role 메타(collab=ck- / upstream=uk- / v2.4.1 local=lk- / v2.4.52 peer=pk-)
// v2.4.99 (Ultrasafe it-1 crypto-04) — 키 비교는 상수시간. 종전 `===` 는 첫 불일치 바이트에서 조기 반환해요.
function wsKeyEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a), B = Buffer.from(b);
  if (A.length !== B.length) return false;              // 길이는 어차피 관측 가능(프리픽스+16진 고정폭)
  try { return crypto.timingSafeEqual(A, B); } catch { return false; }
}
function wsValidKey(key) { return !!key && wsKeys.some((k) => wsKeyEq(k.key, key)); }
// v2.4.110 crypto-04 재시험 — wsValidKey 만 상수시간으로 바뀌어 있었고 **이 함수는 `===` 였어요**.
//   여기가 /join/collab|upstream|peer 의 유일한 게이트이고, upgrade 와 HELLO 양쪽에서 권한을 정해요.
//   조기 반환을 버려요: 일치를 찾아도 순회를 끝까지 돌아야 «몇 번째에서 갈렸는가» 가 새지 않아요.
function wsKeyRole(key) {
  if (typeof key !== 'string' || !key) return null;
  let role = null;
  for (const x of wsKeys) if (wsKeyEq(x.key, key)) role = x.role || 'upstream';
  return role;
}
function wsRevokeKey(key) { const n = wsKeys.length; wsKeys = wsKeys.filter((k) => k.key !== key); if (wsKeys.length !== n) wsSaveKeys(); }
function wsJoinUrl(group, key, host) { return `http://${host || process.env.WS_PUBLIC_HOST || ('localhost:' + PORT)}/join/${group}?key=${encodeURIComponent(key)}`; }   // #168 그룹별 접속 URL(키 포함 → /join 온보딩 md)
// v2.4.85 §13.25.8 — 접속 URL 후보 host 전수 열거. 다중 NIC/IP 호스트에서 "어느 주소로 붙어야 하나"를 발급자가 추측하지 않게, 서버가 아는 주소를 모두 싣는다.
// 순서 = 명시 공개호스트 → loopback → LAN IPv4 → 전역 IPv6 (link-local fe80:: 제외). reachable 은 bind 실측 기반 (loopback bind 면 LAN 주소는 지금 도달 불가).
function wsHostCandidates() {
  const seen = new Set(), out = [];
  const add = (host, scope, iface) => { if (!host || seen.has(host)) return; seen.add(host); out.push({ host, scope, iface }); };
  if (process.env.WS_PUBLIC_HOST) add(process.env.WS_PUBLIC_HOST, 'public', 'WS_PUBLIC_HOST');
  add('localhost:' + PORT, 'loopback', 'loopback');
  let ifaces = {};
  try { ifaces = os.networkInterfaces() || {}; } catch {}
  for (const name of Object.keys(ifaces)) {
    for (const a of (ifaces[name] || [])) {
      if (!a || a.internal) continue;
      const fam = String(a.family);
      if (fam === 'IPv4' || fam === '4') add(a.address + ':' + PORT, 'lan', name);
      else if ((fam === 'IPv6' || fam === '6') && !/^fe80:/i.test(a.address)) add('[' + a.address + ']:' + PORT, 'lan6', name);
    }
  }
  return out.slice(0, 12);   // 가상 NIC 다수 환경(WSL/Docker/VPN) 상한 — 목록이 UI 를 삼키지 않게
}
function wsJoinUrls(make) { return wsHostCandidates().map((c) => ({ host: c.host, scope: c.scope, iface: c.iface, url: make(c.host), reachable: c.scope === 'loopback' ? true : !_isLoopback })); }
// === KEY-MGMT (v2.4.0 — WS-PROTOCOL-KEY-MGMT.md v0.2 구현 · 본격 #406 patch parity) ===
// keyStore = key.json (5-state machine + TTL + lastAgent/lastSeenAt + connectionStatus 매타 영속).
// 레거시 ws-keys.json (role lookup, HELLO/upgrade 판정) 와 dual-layer 운영 — 레거시 entry 가 정본 role, keyStore 가 정본 metadata.
const KEY_JSON = path.join(DIR, 'key.json');
const KEY_TTL_DEFAULT = 1209600000;   // §3.1 기본 14일 (msec)
const KEY_MAX_ACTIVE = Number(process.env.WS_KEY_MAX_ACTIVE) || 32;   // §3.1 활성 키 캡
const KEY_REVOKE_PENDING_GRACE_MS = Number(process.env.WS_KEY_REVOKE_PENDING_GRACE_MS) || 300000;   // §4 grace 5분 (sessionEnd live conn 후)
const KEY_EXPIRY_WARN_MS = Number(process.env.WS_KEY_EXPIRY_WARN_MS) || 259200000;        // v2.4.103 §13.25.12 만료 3일 전부터 경고
const KEY_EXPIRY_SWEEP_MS = Number(process.env.WS_KEY_EXPIRY_SWEEP_MS) || 21600000;       // 6시간마다 훑기 (unref — 프로세스를 붙잡지 않아요)
const KEY_EXPIRY_WARN_REPEAT_MS = Number(process.env.WS_KEY_EXPIRY_WARN_REPEAT_MS) || 86400000;   // 같은 키는 하루 1회까지 (경고가 소음이 되면 안 읽혀요)
let keyStore = { version: 1, updatedAt: 0, keys: [] };
try { const j = JSON.parse(fs.readFileSync(KEY_JSON, 'utf8')); if (j && Array.isArray(j.keys)) keyStore = j; }
catch (e) { try { if (fs.existsSync(KEY_JSON)) fs.renameSync(KEY_JSON, KEY_JSON + '.corrupt-' + Date.now()); } catch {} }   // §6 손상 파일 보존(forensic), fresh 시작
const _keyGraceTimers = new Map();   // key → grace setTimeout (REVOKED_PENDING)
// v2.4.87 (adopter-reported C9a — remediation half): 레거시 ws-keys.json 에만 사는 키를 기동 시 keyStore 로 입양.
// 그 파일이 wsValidKey() 의 정본이므로 그런 키는 **와이어에서 여전히 유효**한데, keyFind() 가 못 봐서 canonical
// KeyList/KeyRevoke 로는 보이지도 폐기되지도 않았다 — 관리 불가능한 유효 크레덴셜. 발급 시점 등록(위)은 앞으로를
// 막고, 이 입양은 이미 생긴 것을 관리 표면으로 끌어온다. 상태는 ISSUED 로 두고 adoptedFromLegacy 로 출처를 남긴다
// (자동 폐기하지 않음 — 폐기는 운용자 판단이고, 조용한 크레덴셜 무효화가 더 나쁜 실패다).
// v2.4.101 (Ultrasafe it-1 crypto-03 나머지 절반) — 기동 시 **이미 존재하는** 비밀 파일의 권한을 좁혀요.
//   v2.4.100 은 쓰기 경로에만 mode/chmod 를 걸었는데, 이 파일들은 자주 안 써져요(키 변경 시에만).
//   그래서 이미 0644/0666 으로 있는 배포는 다음 키 변경까지 그대로 열려 있었어요 — 재기동 후
//   실측으로 확인(4파일 전부 종전 모드). 발견 권고의 "on first run, also chmodSync" 가 이 부분이에요.
//   존재하지 않는 파일은 조용히 넘어가고, chmod 를 무시하는 플랫폼(Windows)에서도 실패하지 않아요.
function keySecretsHardenAtRest() {
  const targets = [WS_KEYS, KEY_JSON, path.join(DIR, '.vapid.json'), path.join(DIR, '.push-subs.json')];
  try { const d = path.join(DIR, 'local-keys');
    if (fs.existsSync(d)) { try { fs.chmodSync(d, 0o700); } catch {} for (const f of fs.readdirSync(d)) if (f.endsWith('.key')) targets.push(path.join(d, f)); } } catch {}
  let n = 0;
  for (const f of targets) { try { if (fs.existsSync(f)) { fs.chmodSync(f, 0o600); n++; } } catch {} }
  if (n) console.log('[server] §13.25.11 crypto-03 — 기존 비밀 파일 %d 개 권한 0600 확인', n);
}
try { keySecretsHardenAtRest(); } catch {}

function keyAdoptLegacy() {
  const have = new Set(keyStore.keys.map((k) => k.key));
  let added = 0;
  for (const lk of wsKeys) {
    if (!lk || !lk.key || have.has(lk.key)) continue;
    const kind = lk.role === 'collab' ? 'collab' : lk.role === 'local' ? 'local' : lk.role === 'peer' ? 'peer' : 'upstream';
    const issuedAt = Date.parse(lk.createdAt || '') || Date.now();
    keyStore.keys.push({ key: lk.key, label: lk.label || kind, state: 'ISSUED', kind, issuedAt, ttl: 0, lastAgent: null, lastSeenAt: null, revokedAt: null, deletedAt: null, adoptedFromLegacy: true });
    added++;
  }
  if (added) { keySave(); console.log(`[server] KEY-MGMT: 레거시 키 ${added}건 입양 (ws-keys.json → keyStore, state=ISSUED ttl=0 adoptedFromLegacy) — canonical KeyList/KeyRevoke 로 관리 가능해졌어요`); }
  return added;
}
function keySave() {   // §6 atomic write + fsync
  for (const k of keyStore.keys) if (!k.ref) k.ref = keyNewRef();   // v2.4.103 §13.25.12 — ref 부여는 여기 한 곳(신규·소급 공통)
  keyStore.updatedAt = Date.now();
  try { const tmp = KEY_JSON + '.tmp'; const fd = fs.openSync(tmp, 'w', 0o600); fs.writeSync(fd, JSON.stringify(keyStore)); fs.fsyncSync(fd); fs.closeSync(fd); fs.renameSync(tmp, KEY_JSON); try { fs.chmodSync(KEY_JSON, 0o600); } catch {} } catch {}   // v2.4.100 crypto-03 — tmp 를 좁게 만들어 rename 하고, 기존 파일 대비 chmod 도 걸어요
}
// v2.4.110 crypto-04 — keyFind 도 접속 승인 경로예요(keyExpiredRefusal / keyPinViolation 이 이걸 씀).
//   같은 이유로 조기 반환 없는 상수시간 조회로 바꿔요.
function keyFind(k) {
  if (typeof k !== 'string' || !k) return undefined;
  let found;
  for (const x of keyStore.keys) if (wsKeyEq(x.key, k)) found = x;
  return found;
}
// v2.4.103 §13.25.12 — keyRef: 비밀이 아닌 안정 핸들. **local 종 키를 관리 표면에서 지목할 수 있게** 해요.
//   왜 필요한가: §3.6 설계상 local 키는 wire 응답에 키 문자열을 안 실어요(KeyList 가 `key: null`). 그래서
//   대시보드는 그 키를 폐기·라벨변경·연장 어느 것도 **지목할 수 없었어요** — v2.4.87 이 고친 «관리 불가능한
//   유효 크레덴셜» 과 같은 부류가 kind 하나에 남아 있었던 거예요(실측: 이 보드에서 유효기간이 35일 지난 키가
//   바로 그 local 종이라, 갱신 절차를 만들어도 손이 닿지 않았어요). ref 는 무작위라 비밀을 유도할 수 없어요.
function keyNewRef() { return 'kr-' + crypto.randomBytes(6).toString('hex'); }
function keyEnsureRefs() {   // 기존 항목 소급 부여 — 실제 할당은 keySave() 가 하고 여기선 보고만 (writer 는 한 곳)
  const n = keyStore.keys.filter((k) => !k.ref).length;
  if (n) { keySave(); console.log('[server] §13.25.12 keyRef %d 건 소급 부여 — local 종 키도 관리 표면에서 지목 가능해졌어요', n); }
  return n;
}
function keyResolve(v) {   // keyRef 우선, key 는 하위호환 (기존 클라이언트 무변경 동작)
  if (!v) return null;
  if (v.keyRef) return keyStore.keys.find((x) => x.ref === v.keyRef) || null;
  if (v.key) return keyFind(v.key) || null;
  return null;
}
// v2.4.103 §13.25.12 — 만료의 기준점이 «발급» 에서 «현재 창의 시작» 으로 바뀌어요 (갱신 도입).
//   issuedAt 은 불변으로 남겨요: 처음 언제 발급됐는지는 사후 추적에 필요한 사실이고, 갱신이 그걸 덮어쓰면
//   «이 크레덴셜이 얼마나 오래 살아 있었나» 를 더 이상 물을 수 없어요. 그래서 renewedAt 을 따로 둡니다.
//   **소비자 주의**: 만료 시각을 `issuedAt + ttl` 로 다시 계산하면 갱신된 키에서 틀린 값이 나와요 —
//   keyExpiresAt() 또는 KeyList 가 실어주는 expiresAt 을 쓰세요. (파생 계산이 조용히 뒤처지는 부류라
//   KeyList 에 expiresAt 을 실어 보내는 이유가 이거예요: 클라이언트가 다시 계산할 필요를 없앰.)
function keyWindowStart(k) { return (k.renewedAt && k.renewedAt > k.issuedAt) ? k.renewedAt : k.issuedAt; }
function keyExpiresAt(k) { return k.ttl > 0 ? keyWindowStart(k) + k.ttl : 0; }   // 0 = 만료 없음
function keyIsExpired(k) { const e = keyExpiresAt(k); return e > 0 && Date.now() > e; }   // §4.1 lazy
function keyMsRemaining(k) { const e = keyExpiresAt(k); return e > 0 ? e - Date.now() : Infinity; }
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
  if (!k.boundAgent && agentId) k.boundAgent = agentId;   // v2.4.99 TOFU — 최초 사용 시 정체 고정(아래 keyPinViolation 가 판정)
  if (k.state === 'ISSUED') k.state = 'ACTIVE';   // §4 invariant 1: 일방
  keySave();
}
// v2.4.99 §13.25.11 (Ultrasafe it-1 se-01) — **선언은 결속되기 전엔 신뢰할 수 없어요.** §13.30.9 의 지목 불변식
//   («정체는 선언으로 결속되고, 닮음으로는 결속되지 않는다») 은 그 선언이 진실하다고 **말없이 가정**했어요.
//   가정은 틀렸고 — HELLO 의 agentId 는 제시된 키와 아무 관계가 없었어요 — 그래서 사다리는 «정확하게 위조자에게»
//   해소됐어요. 불변식이 틀린 게 아니라 **불완전**했고, 빠진 층이 이거예요: 결속되기 전에 선언이 인증돼야 한다.
//   구현은 TOFU(trust-on-first-use): 키는 처음 쓴 agentId 에 고정되고, 이후 다른 정체가 같은 키로 오면 거부.
//   §3.6 의 로컬 키 설계가 이미 라벨 1:1 이고 실측상 어느 키도 두 정체를 오간 적이 없어요(공유 키는 오설정).
// v2.4.104 §13.25.13 — 제시된 키가 유효기간이 지났는지 «허용 판단 자리에서» 물어봐요. 지금까지는
//   선언만 있고 아무도 묻지 않아서, 관리 화면은 «폐기됨» 이라 그리는데 와이어는 통과시켰어요.
//   lazy write: 지나간 사실을 여기서 상태에 굳혀요(read-time 파생과 저장 상태의 어긋남을 남기지 않게).
//   명시 폐기(revokedAt)는 이미 wsValidKey 단계에서 걸러지므로 여기서 다루는 건 «기간» 뿐이에요.
function keyExpiredRefusal(key) {
  if (!key) return null;
  const k = keyFind(key); if (!k) return null;   // keyStore 밖의 키(레거시 입양 전)는 ttl 개념이 없어요
  if (!keyIsExpired(k)) return null;
  if (k.state === 'ISSUED' || k.state === 'ACTIVE' || k.state === 'REVOKED_PENDING') {
    k.state = 'REVOKED'; if (!k.revokedAt) k.expiredAt = k.expiredAt || Date.now();   // revokedAt 은 «운용자가 폐기함» 의 뜻이라 안 찍어요 — 연장 가능성 판정이 그 필드에 걸려 있어요
    keySave();
    console.warn('[server] §13.25.13 키 «%s» 유효기간 경과 — 접속 거부 (만료 %s)', k.label, new Date(keyExpiresAt(k)).toISOString());
  }
  return { label: k.label, expiresAt: keyExpiresAt(k) };
}
function keyPinViolation(key, agentId) {
  if (!key || !agentId) return null;
  const k = keyFind(key); if (!k || !k.boundAgent) return null;
  return k.boundAgent === agentId ? null : k.boundAgent;
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
const KEY_KINDS = new Set(['local', 'collab', 'upstream', 'peer']);   // §3.1 KEY-MGMT v0.5 — 닫힌 열거
function wsKeyIssue(conn, msg, v) {   // §3.1 + v2.4.1 §3.6 — kind 분기 (upstream/collab/local/peer) + roleDescription
  // **«미지정» 과 «미지의 값» 을 갈라요.** 종전엔 한 삼항의 else 로 둘 다 upstream 이 됐어요 —
  //   즉 `pk-` 를 명시적으로 요청한 클라이언트가 **조용히 uk- 를 받았어요.** 요청은 성공으로
  //   보이고 종만 달라져서, 어디서도 오류가 안 나요.
  //   §3.1 이 「모르는 kind 는 등록 경계에서 거부, 기본값으로 강제 금지」라고 규범으로 적고 있는데
  //   그걸 인용한 이쪽 구현이 위반하고 있었어요. 협업 상대가 자기 서버에서 같은 형태를 찾아
  //   알려줘서 이쪽도 대조하다 발견했어요 (2026-07-29).
  //   왜 위험한가는 §3.1 이 직접 말해요 — 못 알아본 kind 가 collab 으로 흘러가면 그 접속에
  //   `group:collab` 이 붙어서 collab 그룹 소속이 비-collab 에이전트에게 새요.
  if (v.kind != null && v.kind !== '' && !KEY_KINDS.has(v.kind)) {
    return keyError(conn, msg, 'UNKNOWN_KIND', `kind must be one of ${[...KEY_KINDS].join('/')} — 모르는 값은 기본값으로 강제하지 않고 거부해요 (§3.1)`);
  }
  const kind = (v.kind == null || v.kind === '') ? 'upstream' : v.kind;   // 미지정만 기본값
  const label = (v.label != null && v.label !== '') ? String(v.label) : kind;
  if (!keyValidate(label)) return keyError(conn, msg, 'INVALID_LABEL', 'label must be 1..64 chars, no control chars');
  if (kind === 'local' && !keyValidateLabelSafe(label)) return keyError(conn, msg, 'INVALID_LABEL', 'local key label must match /^[a-zA-Z0-9_-]+$/ (used as filename)');
  const roleDescription = v.roleDescription != null ? String(v.roleDescription) : null;
  if (!keyValidateRoleDesc(roleDescription)) return keyError(conn, msg, 'INVALID_ROLE_DESC', 'roleDescription must be ≤256 chars, no control chars (except \\n\\t)');
  let ttl = (v.ttl == null) ? KEY_TTL_DEFAULT : Number(v.ttl);
  if (!Number.isFinite(ttl) || ttl < 0) return keyError(conn, msg, 'INVALID_TTL', 'ttl must be >= 0');
  if (keyActiveCount() >= KEY_MAX_ACTIVE) return keyError(conn, msg, 'LIMIT_EXCEEDED', `too many active keys (max ${KEY_MAX_ACTIVE})`);
  // v2.4.158 §13.25.11 — **발급 시 주인을 적을 수 있어요** (`boundAgent`). 안 적으면 종전대로 TOFU 예요.
  //
  // 왜 (2026-08-09 실측): 운영자가 어떤 협업자를 **위해** 키를 발급했는데, 그 키가 공용 기계의 env 로
  //   새어 다른 프로세스가 **먼저** 붙었어요. TOFU 는 「처음 쓴 정체」에 고정하니 결속이 엉뚱한 쪽으로
  //   갔고, 원래 주인은 자기 키로 못 들어오게 됐어요(fail-closed) — 즉 이 사고는 정체 도용이 아니라
  //   **선착순 결속**이 만든 거예요. 의도한 주인을 발급자가 아는데 적을 자리가 없던 게 빈 자리였어요.
  //   강제 층은 새로 안 만들어요: `keyObserveHello` 는 비어 있을 때만 채우고 `keyPinViolation` 이
  //   불일치를 거부하니, 미리 채워 두면 **첫 사용부터** 그 판정을 받아요.
  const boundAgent = (v.boundAgent != null && v.boundAgent !== '') ? String(v.boundAgent) : null;
  if (boundAgent && !/^[A-Za-z0-9._-]{1,64}$/.test(boundAgent)) {
    return keyError(conn, msg, 'INVALID_BOUND_AGENT', 'boundAgent must match /^[A-Za-z0-9._-]{1,64}$/ (agentId 형식)');
  }
  const key = wsIssueKey(label, kind);   // 레거시 ws-keys.json + prefix 별 키
  const issuedAt = Date.now();
  keyStore.keys.push({ key, label, state: 'ISSUED', kind, issuedAt, ttl, roleDescription, boundAgent, lastAgent: null, lastSeenAt: null, revokedAt: null, deletedAt: null });
  keySave();
  const keyRef = (keyFind(key) || {}).ref || null;   // v2.4.103 §13.25.12 — 발급자가 이후 연장·폐기로 지목할 핸들
  if (kind === 'local') {   // v2.4.1 §3.6 — wire 응답에 키 자체 안 보냄
    const dirPath = path.join(DIR, 'local-keys');
    // v2.4.100 crypto-03 — 디렉터리도 소유자 전용(0700). 종전엔 0755 로 만들어져 목록 열람이 열려 있었고,
    //   라벨을 알면 그 자체가 키 파일 경로였어요. 발견에는 이 두 경로(디렉터리 + *.key)가 없었는데,
    //   같은 부류를 훑으라는 권고를 따라 찾은 지점이에요.
    try { fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 }); } catch {}
    try { fs.chmodSync(dirPath, 0o700); } catch {}
    const filePath = path.join(dirPath, label + '.key');
    try { const fd = fs.openSync(filePath, 'w', 0o600); fs.writeSync(fd, key); fs.fsyncSync(fd); fs.closeSync(fd); try { fs.chmodSync(filePath, 0o600); } catch {} } catch (e) { return keyError(conn, msg, 'LOCAL_FILE_WRITE', 'failed to write local key file: ' + String(e.message || e)); }
    const relFile = path.relative(DIR, filePath).replace(/\\/g, '/');
    const joinHint = `LOCAL_KEY_FILE=${relFile} WS_AGENT_ID=${label} node scripts/join-local.cjs`;
    wsKeyReply(conn, 'KeyIssued', { kind: 'local', label, roleDescription, boundAgent, ttl, issuedAt, keyRef, expiresAt: keyExpiresAt(keyFind(key) || { ttl: 0, issuedAt }), joinFile: relFile, joinScript: 'scripts/join-local.cjs', joinHint }, msg);
    return;
  }
  const urlParam = kind === 'collab' ? 'key' : kind === 'peer' ? 'peerKey' : 'upstreamKey';   // v2.4.52 peer 전용 파라미터 — upstream 파라미터에 편승 금지 (kind 혼동 방지)
  const mkWs = (host) => `ws://${host}/ws?${urlParam}=${encodeURIComponent(key)}`;
  const joinUrls = wsJoinUrls(mkWs);   // v2.4.85 §13.25.8 — 주소별 전수. joinUrl 은 종전 의미(공개호스트 우선, 없으면 loopback) 그대로 유지 = 무변경 소비자 호환.
  const joinUrl = (joinUrls.find((u) => u.scope === 'public') || joinUrls[0] || {}).url || mkWs('localhost:' + PORT);
  wsKeyReply(conn, 'KeyIssued', { key, joinUrl, joinUrls, bind: WS_BIND, exposed: !_isLoopback, label, kind, roleDescription, boundAgent, ttl, issuedAt, keyRef, expiresAt: keyExpiresAt(keyFind(key) || { ttl: 0, issuedAt }) }, msg);
}
function wsKeyList(conn, msg, v) {   // §3.2 전체 키 enumerate (상태 + connectionStatus + lastAgent + TTL)
  const incRevoked = !!v.includeRevoked, incDeleted = !!v.includeDeleted;
  const keys = [];
  for (const k of keyStore.keys) {
    const state = keyEffectiveState(k);
    if (state === 'DELETED' && !incDeleted) continue;
    if (state === 'REVOKED' && !incRevoked) continue;
    const isLocal = (k.kind || 'upstream') === 'local';
    keys.push({ key: isLocal ? null : k.key, keyRef: k.ref || null, expiresAt: keyExpiresAt(k), renewedAt: k.renewedAt || null, renewCount: k.renewCount || 0, revokedAt: k.revokedAt || null, lapsed: (keyIsExpired(k) && !k.revokedAt), label: k.label, kind: k.kind || 'upstream', roleDescription: k.roleDescription || null, lastAgent: k.lastAgent || null, lastSeenAt: k.lastSeenAt || null, connectionStatus: keyConnStatus(k), ttl: k.ttl, issuedAt: k.issuedAt, state, adoptedFromLegacy: !!k.adoptedFromLegacy });   // v2.4.1 local 키는 wire 응답에 키 자체 미포함, roleDescription 포함 · v2.4.87 adoptedFromLegacy 출처 표기(입양 키는 발급 이력이 레거시 파일뿐)
  }
  wsKeyReply(conn, 'KeyListResult', { keys }, msg);
}
function wsKeyRevoke(conn, msg, v) {   // §3.3 immediate(즉시 kick) / sessionEnd(세션 유지 후 폐기)
  const k = keyResolve(v); if (!k) return keyError(conn, msg, 'KEY_NOT_FOUND', 'unknown key');
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
  const k = keyResolve(v); if (!k) return keyError(conn, msg, 'KEY_NOT_FOUND', 'unknown key');
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
// v2.4.103 §13.25.12 — 열쇠 «연장». TTL 강제(§13.25.13)를 켜기 **전에** 이게 있어야 해요: 검사를 먼저 켜면
//   이미 기간이 지난 키를 쥔 상대가 예고 없이 끊기고, 보안 수정이 장애로 읽혀요. 실측 근거 — 이 보드에서
//   TTL 검사를 그냥 켰다면 그 순간 유효기간이 지난 키 3개(자기 보드 워커 1 + 협업 상대 2)가 함께 끊겼어요.
//   **불변식은 그대로예요**: 명시적 폐기는 여전히 종단이에요. 연장이 되살릴 수 있는 건 «기간이 지나서»
//   REVOKED 로 읽히는 키뿐이고(revokedAt == null), 운용자가 «이 키는 끝» 이라고 말한 것을 되살리는 문은
//   만들지 않아요. 그 문이 열리면 폐기가 폐기가 아니게 되고, 그건 TTL 이 안 걸리는 것보다 나쁜 결함이에요.
function wsKeyRenew(conn, msg, v) {
  const k = keyResolve(v); if (!k) return keyError(conn, msg, 'KEY_NOT_FOUND', 'unknown key');
  if (k.state === 'DELETED' || k.deletedAt) return keyError(conn, msg, 'NOT_RENEWABLE', 'key deleted');
  if (k.revokedAt) return keyError(conn, msg, 'NOT_RENEWABLE', 'explicitly revoked keys stay terminal — 새로 발급하세요');
  if (!(k.ttl > 0)) return keyError(conn, msg, 'NO_EXPIRY', 'key has no expiry (ttl=0) — 연장할 기간이 없어요');
  const ttl = (v.ttl == null) ? k.ttl : Number(v.ttl);
  if (!Number.isFinite(ttl) || ttl <= 0) return keyError(conn, msg, 'INVALID_TTL', 'ttl must be > 0 (0 은 «만료 없음» 이라 연장이 아니라 보호 해제예요)');
  const wasLapsed = keyIsExpired(k);
  const prevExpiresAt = keyExpiresAt(k);
  k.renewedAt = Date.now(); k.ttl = ttl;
  k.renewCount = (k.renewCount || 0) + 1;
  k.lastExpiryWarnAt = null;   // 새 창 → 만료 경고 재무장
  keySave();
  const expiresAt = keyExpiresAt(k);
  console.log('[server] §13.25.12 KeyRenew label=%s kind=%s wasLapsed=%s 만료 %s → %s (누적 %d회)',
    k.label, k.kind || 'upstream', wasLapsed, new Date(prevExpiresAt).toISOString(), new Date(expiresAt).toISOString(), k.renewCount);
  wsKeyReply(conn, 'KeyRenewed', { key: (k.kind === 'local' ? null : k.key), keyRef: k.ref, label: k.label, kind: k.kind || 'upstream', ttl, issuedAt: k.issuedAt, renewedAt: k.renewedAt, expiresAt, wasLapsed, renewCount: k.renewCount }, msg);
  for (const c of wsAgents.values()) {   // 보유자에게도 통보 (KeyRevokePending 선례 — 상대가 자기 기간을 알 수 있게)
    if (c.alive && c !== conn && c.meta.upstreamKey === k.key) {
      const ev = wscore.event('CUSTOM', { name: 'KeyRenewed', value: { keyRef: k.ref, label: k.label, expiresAt, ttl, wasLapsed } });
      ev.source = 'server'; ev.targetAgentId = c.meta.agentId; c.send(ev);
    }
  }
}
// v2.4.103 §13.25.12 — 만료 임박 경고. A안(«갱신 절차를 먼저 만들고 그다음 켜기») 의 나머지 절반이에요:
//   연장할 수 있게 만드는 것만으론 부족하고, 만료가 다가온다는 사실이 **누가 화면을 보고 있지 않아도**
//   드러나야 해요. 세 표면으로 내보내요 — 서버 로그(재기동 때 눈에 들어오는 자리) · ServerNotice 브로드캐스트
//   (ws-history 에 남아 채널에서 되짚을 수 있음) · 보유자에게 직접 unicast(협업 상대가 스스로 갱신을 요청할 수
//   있게). 대시보드 행 배지는 별도(관리 창).
//   **일부러 안 한 것**: main 에이전트를 깨우지 않아요. §13.16.9 의 4-군 분류에서 이건 notice 군이고
//   (ServerNotice 와 같은 자리), 그 군은 meaningful 에서 제외돼요 — 여기에 슬쩍 끼워 넣으면 그 분류가
//   무의미해져요. 운용자 표면은 로그 + 관리 창이에요.
function keyExpirySweep() {
  const now = Date.now();
  const due = [];
  for (const k of keyStore.keys) {
    if (k.deletedAt || k.revokedAt) continue;                 // 종단 키는 대상 아님
    if (!(k.ttl > 0)) continue;                                // 만료 없음
    const rem = keyMsRemaining(k);
    if (rem > KEY_EXPIRY_WARN_MS) continue;                    // 창 밖
    if (k.lastExpiryWarnAt && now - k.lastExpiryWarnAt < KEY_EXPIRY_WARN_REPEAT_MS) continue;   // 하루 1회 상한
    k.lastExpiryWarnAt = now; due.push({ k, rem });
  }
  if (!due.length) return 0;
  keySave();
  for (const d of due) {
    const k = d.k, rem = d.rem;
    const days = Math.round(Math.abs(rem) / 86400000 * 10) / 10;
    const lapsed = rem < 0;
    const kindTxt = k.kind || 'upstream';
    const text = lapsed
      ? ('열쇠 «' + k.label + '» (' + kindTxt + ') 의 유효기간이 ' + days + '일 지났어요 — 🔑 관리 창에서 연장하거나 새로 발급하세요.')
      : ('열쇠 «' + k.label + '» (' + kindTxt + ') 이 ' + days + '일 뒤 만료돼요 — 🔑 관리 창에서 연장할 수 있어요.');
    console.warn('[server] §13.25.12 %s', text);
    const notice = wscore.event('CUSTOM', { name: 'ServerNotice', value: { kind: 'key-expiry', text, label: k.label, keyKind: kindTxt, keyRef: k.ref, expiresAt: keyExpiresAt(k), lapsed } });
    notice.source = 'server';
    wsToAll(notice); wsRecord(notice);
    for (const c of wsAgents.values()) {
      if (c.alive && c.meta.upstreamKey === k.key) {
        const ev = wscore.event('CUSTOM', { name: 'KeyExpiringSoon', value: { keyRef: k.ref, label: k.label, expiresAt: keyExpiresAt(k), msRemaining: rem, lapsed } });
        ev.source = 'server'; ev.targetAgentId = c.meta.agentId; c.send(ev);
      }
    }
  }
  return due.length;
}
setTimeout(() => { try { keyExpirySweep(); } catch (e) { console.warn('[server] key expiry sweep 실패: %s', e && e.message); } }, 5000).unref();
setInterval(() => { try { keyExpirySweep(); } catch (e) { console.warn('[server] key expiry sweep 실패: %s', e && e.message); } }, KEY_EXPIRY_SWEEP_MS).unref();
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
  // === 키 관리 / main 이양 authz 게이트 (v2.4.87, §13.25.9) ===
  // 어댑터 리포트(C9b)는 "deprecated 별칭이 게이트 위에 있어 아무 agent 나 폐기 가능"을 지적했다. 실측 검증에서
  // 더 넓은 구멍이 드러났다: 게이트가 `conn.meta.role === 'agent'` 로 판정하는데 그 값은 **HELLO 를 보낸 연결에만**
  // 세팅된다 → HELLO 를 아예 안 보내는 연결은 board(운영자)로 취급돼 canonical 게이트조차 통과했다. 노출된 보드에서는
  // 도달 가능한 누구나 무-HELLO 연결로 키 발급/폐기·SetMain 이 가능했던 것(requireKey 도 HELLO 시점 검사라 무효).
  // 판정을 "무엇을 안 보냈나"가 아니라 "어느 표면의 신뢰된 운영자인가"로 바꾼다.
  const KEY_VERBS = ['RegisterUpstreamKey', 'RegisterCollabKey', 'RevokeCollabKey', 'RevokeUpstreamKey', 'KeyIssue', 'KeyList', 'KeyRevoke', 'KeyLabel', 'KeyRenew', 'SetMain'];
  if (KEY_VERBS.includes(n) && !wsOperatorAuthz(conn)) {
    const why = conn.meta.role === 'agent' ? 'only main may manage keys' : 'operator surface not permitted from this address (Constellation §13.25 ui allowlist)';
    keyError(conn, msg, 'PERMISSION_DENIED', why);
    console.warn('[ws authz] %s 거부 — role=%s ip=%s', n, conn.meta.role === 'agent' ? wsAgentRole(conn) : 'board', conn.meta.ip || '?');
    return true;
  }
  if (n === 'RegisterUpstreamKey') {   // v2.3.23 transitional alias — KeyIssue 가 canonical, §3.1 retirement schedule 따라 zero-traffic gate 후 제거
    const key = wsIssueKey(v.label); const ulabel = v.label || 'upstream'; const joinUrl = wsJoinUrl('upstream', key);
    // v2.4.87 (C9a): 바로 아래 RegisterCollabKey 는 keyStore 에 등록하는데 이쪽만 누락돼 있었다 — 레거시 파일에만
    // 사는 키는 keyFind() 가 못 봐서 canonical KeyList/KeyRevoke/KeyLabel 에 안 보이고, 폐기하려면 authz 없는
    // deprecated 경로밖에 없었다(= C9b 와 맞물려 서로를 필요악으로 만든 짝). 발급 시점에 등록해 짝을 끊는다.
    keyStore.keys.push({ key, label: ulabel, state: 'ISSUED', kind: 'upstream', issuedAt: Date.now(), ttl: KEY_TTL_DEFAULT, lastAgent: null, lastSeenAt: null, revokedAt: null, deletedAt: null }); keySave();
    conn.send(wscore.event('CUSTOM', { name: 'UpstreamKeyIssued', value: { key, label: ulabel, joinUrl, joinUrls: wsJoinUrls((h) => wsJoinUrl('upstream', key, h)), bind: WS_BIND, exposed: !_isLoopback } })); return true;
  }
  if (n === 'RegisterCollabKey') { const key = wsIssueKey(v.label, 'collab'); const clabel = v.label || 'collab'; const joinUrl = wsJoinUrl('collab', key); keyStore.keys.push({ key, label: clabel, state: 'ISSUED', kind: 'collab', issuedAt: Date.now(), ttl: KEY_TTL_DEFAULT, lastAgent: null, lastSeenAt: null, revokedAt: null, deletedAt: null }); keySave(); conn.send(wscore.event('CUSTOM', { name: 'CollabKeyIssued', value: { key, label: clabel, joinUrl, joinUrls: wsJoinUrls((h) => wsJoinUrl('collab', key, h)), bind: WS_BIND, exposed: !_isLoopback } })); return true; }   // #168 외부협업 키+접속 URL (v2.4.0 KEY-MGMT 통합: keyStore 등록 kind=collab)
  if (n === 'RevokeCollabKey' || n === 'RevokeUpstreamKey') { wsRevokeKey(v.key); const _k = keyFind(v.key); if (_k) { keyTransition(_k, 'REVOKED'); } return true; }   // v2.4.87: 레거시 경로도 keyStore 상태를 함께 내린다 (두 스토어 분기 방지)
  // === KEY-MGMT (v2.4.0 — WS-PROTOCOL-KEY-MGMT.md v0.2) ===
  if (n === 'KeyIssue' || n === 'KeyList' || n === 'KeyRevoke' || n === 'KeyLabel' || n === 'KeyRenew') {
    if (n === 'KeyIssue') wsKeyIssue(conn, msg, v);
    else if (n === 'KeyList') wsKeyList(conn, msg, v);
    else if (n === 'KeyRevoke') wsKeyRevoke(conn, msg, v);
    else if (n === 'KeyLabel') wsKeyLabel(conn, msg, v);
    else if (n === 'KeyRenew') wsKeyRenew(conn, msg, v);   // v2.4.103 §13.25.12
    return true;
  }
  if (n === 'SetMain') { wsSetMain(v.agentId, v.reason); return true; }
  if (n === 'HandoffReady') { wsHandoffReady(); return true; }
  return false;
}
// === 채널 대화 기록 (v2 — 채널별 파일 + 저장 압축: 델타/조각→완성형 1건, 채널당 cap) ===
const HISTORY = path.join(DIR, 'ws-history.json');   // 레거시 단일 파일(마이그레이션 원본)
const HISTDIR = path.join(DIR, 'ws-history');        // 채널별 .jsonl 디렉토리
// v2.4.156 — 200 → 1000. **얕은 링은 대화를 지우는 장치예요.** 실측 2026-08-09: 한 채널의 200줄이
//   선언 80 + 합류 57 + ack 58 로 채워져 그날 대화 전부가 링 밖으로 밀려났어요(운영자가 「비A2A
//   대화 내역도 사라졌다」로 발견 — 다리측 append-only 로그로 복구). 1차 처방은 소음 제외(아래
//   wsRecord 층 + history-store 의 floor), 이건 2차 안전여유예요.
//   **접속 비용은 안 올라가요**: 초기 전송은 HISTORY_INITIAL_PER_CHAN(기본 150)으로 따로 잘라
//   보내고 나머지는 RequestChannelHistory 로 이어받아요 — 깊이는 디스크·메모리만 써요.
//   ⚠ 같은 정책이 `history-store.cjs` 에도 있어요(모듈 floor). 두 값이 갈라지면 검사가 잡아요
//     (`verify-history-policy-parity`) — 이 파일이 라이브 경로고 그 파일이 채택자 경로예요.
const HIST_CAP = Number(process.env.HIST_CAP || 1000);   // 채널당 보관 이벤트 수
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
// v2.4.130 — **미래 시각은 받지 않아요.** 발신자가 적은 시각은 선언이고, 우리가 받은 시각은 실측이에요.
//   받은 시점보다 뒤인 시각은 **증명 가능하게 틀려요** — 아직 오지 않은 순간에 도착한 프레임은 없으니까요.
//   그런 값은 목록 맨 위에 눌러앉아서, 진짜 시간이 따라잡을 때까지 실시간 흐름을 계속 어긋나게 해요.
//   실측 2026-08-01: 협업 상대의 프레임 둘이 `15:20:00.000` · `14:15:00.000` — 초·밀리초가 0 으로
//   딱 떨어지는 건 기계 시계가 아니라 **지어낸 값**의 서명이에요(이 저장소도 워커에게 시계를 안 주고
//   시각을 요구해 +11h19m 미래를 받은 전례가 있어요 — 같은 부류라 같은 처방을 씁니다).
//   시계 오차는 정상이라 여유를 두되, 그 밖은 수신 시각으로 눌러요. **조용히 고치지 않아요** — 원본을
//   `declaredTs` 로 남기고 한 줄 경고를 찍어요. 안 그러면 «시각이 왜 다르지» 를 아무도 못 추적해요.
const WS_TS_SKEW_MS = Number(process.env.WS_TS_SKEW_MS || 2 * 60 * 1000);
function wsNormTs(ev) {
  if (!ev || typeof ev !== 'object') return ev;
  if (typeof ev.timestamp === 'string') { const e = Date.parse(ev.timestamp); if (!isNaN(e)) ev.timestamp = e; }
  const now = Date.now();
  if (ev.timestamp == null) ev.timestamp = now;
  else if (typeof ev.timestamp === 'number' && ev.timestamp > now + WS_TS_SKEW_MS) {
    if (ev.declaredTs == null) {
      ev.declaredTs = ev.timestamp;
      console.warn('[ws] 미래 시각 보정 — from=%s name=%s declared=%s → %s',
        ev.agentId || '?', ev.name || ev.type || '?', new Date(ev.timestamp).toISOString(), new Date(now).toISOString());
    }
    ev.timestamp = now;
  }
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
  if (msg.type === 'CUSTOM' && (msg.name === 'AgentList' || msg.name === 'AgentHello' || msg.name === 'ConnectionInfo' || msg.name === 'Ack' || msg.name === 'AckProcessed' || msg.name === 'AckCumulative' || msg.name === 'Heartbeat' || msg.name === 'PersistentAdapterSmoke' || msg.name === 'Typing' || msg.name === 'AgentActivity' || msg.name === 'TerminalData' || msg.name === 'TerminalExit')) return;   // 제어/transient 제외 (AgentActivity=고빈도 활성 스트림 · Terminal*=relay 바이트 §9 세 번째 문 — 방송만·이력 미저장; 스크롤백은 자격증명 표준 형태라 마스킹 전엔 기본 미저장)
  if (msg.type === 'CUSTOM' && msg.name === 'CommandManifest') wsCmdManifestNote(msg.agentId, msg.value);   // v2.4.67 자동완성 매니페스트 캡처 (저장도 계속 — replay 이중화)
  if (msg.type === 'CUSTOM' && msg.name === 'OpsState') wsOpsStateNote(msg.agentId, msg.value);   // v2.4.71 상태 스트립 선언 캡처
  if (msg.type === 'CUSTOM' && msg.name === 'SeatTelemetry') wsSeatTelNote(msg.value);   // v2.4.153 §13.35.8 좌석 계측 latest-wins 캡처 (선언 5종과 같은 배관 — 아래 주석에 왜 이게 빠져 있었는지)
  if (msg.type === 'CUSTOM' && msg.name === 'CapabilityManifest') wsCapManifestNote(msg.agentId, msg.value);   // v2.4.76 계약-표면 능력 선언 캡처
  if (msg.type === 'CUSTOM' && msg.name === 'CorporateChart') wsCorpChartNote(msg.agentId, msg.value);   // v2.4.90 §13.33 조직 구조 선언 캡처 (권한 게이트는 inbound 경계에서 — wsCorpDeclAuthz)
  if (msg.type === 'CUSTOM' && msg.name === 'RoleState') wsRoleStateNote(msg.agentId, msg.value);   // v2.4.90 §13.33 좌석별 생사 선언 캡처
  if (msg.type === 'CUSTOM' && msg.name === 'SelectionPrompt') wsSelPendNote(msg);   // v2.4.74 선택지 타임아웃 추적
  if (msg.type === 'CUSTOM' && (msg.name === 'SelectionAnswer' || msg.name === 'SelectionCancel') && msg.value) wsSelPendClear(msg.value.promptId);   // v2.4.74 응답/취소 = pending 해제
  // v2.4.154 — **포착한 뒤 저장은 안 해요** (위 제외 목록과 다른 자리인 이유: 그 목록은 포착보다
  //   먼저 return 해서, 여기 이름을 넣으면 persist 자체가 끊겨요). 이 셋은 전용 persist 맵 + 접속
  //   페이로드가 **정본**이라 이력에 또 담는 건 순수 중복이고, 이력 링은 유한해서 그 중복이
  //   **실제 대화를 밀어내요.** 실측 2026-08-09: 좌석 상태 판정 결함으로 선언이 tick 속도로
  //   진동해 두 보드 채널에 198건이 쌓였어요 — 그날의 대화가 그만큼 링에서 밀렸어요.
  //   매니페스트류(CommandManifest 등)는 「replay 이중화」로 저장을 **의도**해 둔 항목이라 건드리지
  //   않아요 — 여기 셋은 payload 경로가 실증돼 있어서 빼도 새로 연 클라이언트가 잃는 게 없어요.
  if (msg.type === 'CUSTOM' && (msg.name === 'CorporateChart' || msg.name === 'RoleState' || msg.name === 'SeatTelemetry')) return;
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
// v2.4.71 — 에이전트별 운용 상태 선언 영속 (입력줄 상태 스트립 데이터): OpsState CUSTOM.
// CommandManifest 와 같은 클래스 — 변경-트리거 선언(주기 스냅샷 아님)·latest-wins·History 동봉.
// 선언 규율: 실측 가능한 값만 (model/effort/fast/subscaler), controls[] = 이 에이전트가
// 프롬프트 텍스트로 이행 가능한 제어 항목(예: 'subscaler').
const OPSSTATES = path.join(HISTDIR, '.ops-states.json');
const wsOpsStates = new Map();
try { const _os = JSON.parse(fs.readFileSync(OPSSTATES, 'utf8')); for (const k of Object.keys(_os)) wsOpsStates.set(k, _os[k]); } catch {}
let _opsT = null;
function wsOpsStateNote(agentId, v) {
  if (!agentId || !v || typeof v !== 'object') return;
  const o = {};
  if (typeof v.model === 'string' && v.model) o.model = v.model.slice(0, 64);
  if (typeof v.effort === 'string' && v.effort) o.effort = v.effort.slice(0, 16);
  if (typeof v.fast === 'boolean') o.fast = v.fast;
  if (v.subscaler && typeof v.subscaler === 'object') o.subscaler = { on: !!v.subscaler.on, pair: String(v.subscaler.pair || '').slice(0, 32), effort: String(v.subscaler.effort || '').slice(0, 16) };
  if (Array.isArray(v.controls)) o.controls = v.controls.slice(0, 8).map((c) => String(c).slice(0, 24));
  if (!Object.keys(o).length) return;
  o.updatedAt = Date.now();
  wsOpsStates.set(String(agentId), o);
  if (_opsT) return;
  _opsT = setTimeout(() => { _opsT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(OPSSTATES, JSON.stringify(Object.fromEntries(wsOpsStates), null, 1)); } catch {} }, 1000);
}
// v2.4.153 §13.35.8 — 좌석 계측 latest-wins 영속: SeatTelemetry CUSTOM.
//
// 왜 뒤늦게 생겼나 (2026-08-09 실측): 이 선언 계열 5종(CommandManifest·OpsState·CapabilityManifest·
//   CorporateChart·RoleState)은 다 persist 맵이 있는데 좌석 계측만 없었어요. 발신기(workflow-mirror)는
//   **변경-트리거**로만 보내니, 한가한 좌석의 마지막 스냅샷은 이력 링에서 밀려나는 순간 **새로 연
//   대시보드에는 영원히 안 보여요.** 그 결과가 「선언된 좌석 전부가 계측을 보고한다」 검사의 빨강이었고,
//   그 좌석이 우연히 턴을 돌면 초록으로 돌아가서 **유휴와 고장이 같은 모양**이었어요. 여기 한 맵이
//   없어서 화면은 «없음» 을 말했지만 정직한 답은 «오래됨 + 그 시각» 이에요.
//   짝이 되는 규율: 발신기는 **재접속 때 dedup 기억을 비워** 전량 재선언해요 (§13.23.4 latest-wins).
const SEATTELS = path.join(HISTDIR, '.seat-telemetry.json');
const wsSeatTels = new Map();
try { const _st = JSON.parse(fs.readFileSync(SEATTELS, 'utf8')); for (const k of Object.keys(_st)) wsSeatTels.set(k, _st[k]); } catch {}
let _seatTelT = null;
function wsSeatTelNote(v) {
  if (!v || typeof v !== 'object') return;
  const seat = (typeof v.seat === 'string') ? v.seat.slice(0, 64) : '';
  if (!seat) return;                                    // 좌석 이름 없는 계측은 «누구의» 를 답할 수 없어서 안 실어요
  const o = {};
  try { const s = JSON.stringify(v); if (s.length <= 8192) Object.assign(o, JSON.parse(s)); else return; } catch { return; }
  o.persistedAt = Date.now();                           // 저장 시각 — 렌더가 «얼마나 오래됐나» 를 말할 수 있게 (lastActivityAt 과 다른 축이에요)
  wsSeatTels.set(seat, o);
  while (wsSeatTels.size > 64) wsSeatTels.delete(wsSeatTels.keys().next().value);
  if (_seatTelT) return;
  _seatTelT = setTimeout(() => { _seatTelT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(SEATTELS, JSON.stringify(Object.fromEntries(wsSeatTels), null, 1)); } catch {} }, 1000);
}
// v2.4.76 — 에이전트별 계약-표면 능력 선언 영속: CapabilityManifest CUSTOM. CommandManifest/OpsState 와
// 같은 클래스 — 변경-트리거 선언·latest-wins·History 동봉. 슬래시 명령(무엇을 이행하나)·운용 상태(어떤
// 설정인가)와 달리 이건 "어느 계약 표면을 구현했나" (예: selection §13.16.12, roundtable §13.30) —
// 이종 하네스 어댑터가 opt-in 전에 지원 여부를 기계-판독 가능하게 광고하는 경로.
const CAPMANIFESTS = path.join(HISTDIR, '.capability-manifests.json');
const wsCapManifests = new Map();
try { const _cp = JSON.parse(fs.readFileSync(CAPMANIFESTS, 'utf8')); for (const k of Object.keys(_cp)) wsCapManifests.set(k, _cp[k]); } catch {}
let _capManT = null;
function wsCapManifestNote(agentId, v) {
  if (!agentId || !v || !Array.isArray(v.capabilities)) return;
  const caps = v.capabilities.slice(0, 64).map((c) => {
    if (!c || typeof c !== 'object' || !c.name) return null;
    const o = { name: String(c.name).slice(0, 64) };
    if (typeof c.version === 'string' && c.version) o.version = c.version.slice(0, 32);
    if (typeof c.enabled === 'boolean') o.enabled = c.enabled;
    if (c.params && typeof c.params === 'object') { try { const s = JSON.stringify(c.params); if (s.length <= 512) o.params = c.params; } catch {} }
    return o;
  }).filter(Boolean);
  if (!caps.length) return;
  wsCapManifests.set(String(agentId), { capabilities: caps, updatedAt: Date.now() });
  if (_capManT) return;
  _capManT = setTimeout(() => { _capManT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(CAPMANIFESTS, JSON.stringify(Object.fromEntries(wsCapManifests), null, 1)); } catch {} }, 1000);
}
// v2.4.90 §13.33 — 조직 투영 선언 2종 영속: CorporateChart(구조) + RoleState(좌석별 생사).
// CommandManifest/OpsState/CapabilityManifest 와 **같은 선언 클래스**이고 배관도 그대로예요 — 변경-트리거
// (주기 스냅샷 아님)·latest-wins·서버 persist·History 동봉·사람에겐 소음(Web Push·워커 pending 분류기 제외).
// 새 패턴은 하나도 안 만들어요. 보드가 조직을 렌더하려면 조직이 **선언으로 도달**해야 하거든요 (Corporate 의
// roster 는 로컬·gitignore 이고, 보드는 peer 가 호스팅할 수도 있어서 파일로 읽을 수가 없어요).
// 서버 측 규율 3가지:
//   ① 차트는 projection — desk 내용·크레덴셜·프로젝트 밖 경로를 담지 않고 deskRef 는 불투명 라벨이에요.
//   ② 선언된 필드만 싣어요 (§13.33.3-2). 빈 값은 키 자체를 만들지 않아 렌더가 "부재"로 보게 해요.
//   ③ 없는 좌석 상태를 서버가 만들어내지 않아요 (§13.33.3-1 부재 ≠ 유휴). 차트에만 있고 RoleState 가 없는
//      좌석은 정상 transient(선언은 됐고 아직 안 채워진 조직)이며 오류가 아니에요 (§13.33.4).
// tier/model/effort 는 이미 resolved 된 값이 오는 것이고, 서버는 토글 체인을 해석하지 않아요 (§13.33.3-4).
const CORPCHART = path.join(HISTDIR, '.corporate-chart.json');    // 단일 객체 (latest-wins)
const ROLESTATES = path.join(HISTDIR, '.role-states.json');       // role → state 맵 (role 별 latest-wins)
const CORP_MAX = { roles: 200, links: 400, hosts: 32, groups: 64, rooms: 64, owns: 64, participants: 64, str: 4000, bytes: 262144 };   // 보수적 캡 (기존 선언 이벤트의 개수·길이 캡 관행과 같은 수준)
const CORP_STATUS = new Set(['idle', 'working', 'blocked', 'waiting-gate', 'offline']);   // 이 5개 외의 status 는 싣지 않아요 — 미정의 값을 idle 로 접는 게 §13.33.3-1 위반이에요
let wsCorpChart = null;
const wsRoleStates = new Map();
try { const _cc = JSON.parse(fs.readFileSync(CORPCHART, 'utf8')); if (_cc && typeof _cc === 'object' && !Array.isArray(_cc)) wsCorpChart = _cc; } catch {}
try { const _rs = JSON.parse(fs.readFileSync(ROLESTATES, 'utf8')); for (const k of Object.keys(_rs)) wsRoleStates.set(k, _rs[k]); } catch {}
let _corpChartT = null, _roleStT = null;
function _corpS(x, n) { if (typeof x === 'number' && isFinite(x)) x = String(x); if (typeof x !== 'string') return ''; return x.slice(0, Math.min(n, CORP_MAX.str)).trim(); }
function _corpN(x) { const n = Number(x); return (typeof x !== 'boolean' && x !== '' && x != null && isFinite(n) && n >= 0) ? n : null; }
function _corpPut(o, k, v) { if (v !== '' && v != null) o[k] = v; }   // 선언된 필드만 — 빈 값이면 키를 안 만들어요
function _corpObj(x, cap) { if (!x || typeof x !== 'object') return null; try { const s = JSON.stringify(x); if (s.length <= cap) return JSON.parse(s); } catch {} return null; }
function _corpArr(x, cap) { return Array.isArray(x) ? x.slice(0, cap) : []; }
// 룸 참여자 — §13.30.2 는 객체({agentId, role, voice, speakerClass}) 이고 문자열 축약도 실전에서 옵니다.
// 문자열만 통과시키면 persist 후 객체형 참여자가 사라져요(라이브에선 보이고 재기동 뒤 없어지는 종류의 결함).
function _corpParticipants(x) {
  const out = [];
  for (const p of _corpArr(x, CORP_MAX.participants)) {
    if (typeof p === 'string' || typeof p === 'number') { const s = _corpS(p, 64); if (s) out.push({ agentId: s }); continue; }
    if (!p || typeof p !== 'object') continue;
    const id = _corpS(p.agentId || p.agent || p.id, 64); if (!id) continue;
    const e = { agentId: id };
    _corpPut(e, 'role', _corpS(p.role, 32));
    _corpPut(e, 'speakerClass', _corpS(p.speakerClass, 32));
    if (typeof p.voice === 'boolean') e.voice = p.voice;
    out.push(e);
  }
  return out;
}
function _corpStrArr(x, cap, n) { return _corpArr(x, cap).map((e) => _corpS(e, n)).filter(Boolean); }
function wsCorpChartSan(v) {   // 와이어 → 저장형 정규화 (누락 필드는 부재로, 초과분은 캡으로)
  const o = {};
  _corpPut(o, 'version', _corpS(v.version, 64));
  if (v.org && typeof v.org === 'object') {
    const g = {};
    _corpPut(g, 'topology', _corpS(v.org.topology, 64));
    _corpPut(g, 'drive', _corpS(v.org.drive, 64));
    _corpPut(g, 'variability', _corpS(v.org.variability, 64));
    const _sc = _corpN(v.org.seatCeiling); if (_sc != null) g.seatCeiling = _sc;
    const _fc = _corpN(v.org.fanoutCeiling); if (_fc != null) g.fanoutCeiling = _fc;
    if (Object.keys(g).length) o.org = g;
  }
  const hosts = [];
  for (const h of _corpArr(v.hosts, CORP_MAX.hosts)) {
    if (!h || typeof h !== 'object') continue;
    const id = _corpS(h.host, 64); if (!id) continue;
    const e = { host: id };
    _corpPut(e, 'label', _corpS(h.label, 160));
    _corpPut(e, 'address', _corpS(h.address, 200));
    _corpPut(e, 'accelerator', _corpS(h.accelerator, 120));   // 능력 class — 인벤토리가 아니에요 (§13.33.2)
    _corpPut(e, 'memory', _corpS(h.memory, 64));
    hosts.push(e);
  }
  if (hosts.length) o.hosts = hosts;
  const roles = [];
  for (const r of _corpArr(v.roles, CORP_MAX.roles)) {
    if (!r || typeof r !== 'object') continue;
    const id = _corpS(r.role, 64); if (!id) continue;
    const e = { role: id };
    _corpPut(e, 'title', _corpS(r.title, 160));
    _corpPut(e, 'tier', _corpS(r.tier, 64));            // resolved 값 그대로 (서버는 체인 해석 안 함)
    _corpPut(e, 'residency', _corpS(r.residency, 32));
    _corpPut(e, 'harness', _corpS(r.harness, 64));
    _corpPut(e, 'agentId', _corpS(r.agentId, 120));    // 선택 — 이 좌석을 채우는 에이전트의 canonical id. 있으면 좌석↔채널 해석이 추측이 아니라 선언이 돼요.
    _corpPut(e, 'host', _corpS(r.host, 64));
    _corpPut(e, 'lane', _corpS(r.lane, 32));            // interactive | automation — 미정의 값도 원문 보존(렌더가 부재/원문으로 판단)
    _corpPut(e, 'traceMode', _corpS(r.traceMode, 32));  // full-trace | result-only — 기본값 없음(§10.1)
    const owns = _corpStrArr(r.owns, CORP_MAX.owns, 240); if (owns.length) e.owns = owns;
    _corpPut(e, 'group', _corpS(r.group, 64));
    _corpPut(e, 'reportsTo', _corpS(r.reportsTo, 64));
    _corpPut(e, 'deskRef', _corpS(r.deskRef, 160));     // 불투명 라벨 — 파일시스템 경로 아님
    if (r.budget != null) _corpPut(e, 'budget', (typeof r.budget === 'object') ? _corpObj(r.budget, 512) : (typeof r.budget === 'number' ? _corpN(r.budget) : _corpS(r.budget, 120)));
    _corpPut(e, 'createdFor', _corpS(r.createdFor, 400));
    roles.push(e);
  }
  if (!roles.length) return null;   // 좌석 0 = 조직이 아님 → 차트로 채택하지 않아요
  o.roles = roles;
  const links = [];
  for (const l of _corpArr(v.links, CORP_MAX.links)) {
    if (!l || typeof l !== 'object') continue;
    const f = _corpS(l.from, 64), t = _corpS(l.to, 64); if (!f || !t) continue;
    const e = { from: f, to: t };
    _corpPut(e, 'reason', _corpS(l.reason, 400));
    _corpPut(e, 'wiring', _corpS(l.wiring, 32));        // directed | discretionary — 조직도와 전달 규칙을 분리하는 축
    links.push(e);
  }
  if (links.length) o.links = links;
  const groups = [];
  for (const g of _corpArr(v.groups, CORP_MAX.groups)) {
    if (!g || typeof g !== 'object') continue;
    const id = _corpS(g.group, 64); if (!id) continue;
    const e = { group: id };
    _corpPut(e, 'title', _corpS(g.title, 160));
    const ov = _corpObj(g.overrides, 512); if (ov) e.overrides = ov;
    groups.push(e);
  }
  if (groups.length) o.groups = groups;
  const rooms = [];
  for (const r of _corpArr(v.rooms, CORP_MAX.rooms)) {
    if (!r || typeof r !== 'object') continue;
    const id = _corpS(r.roomId, 64); if (!id) continue;
    const e = { roomId: id };
    _corpPut(e, 'topic', _corpS(r.topic, 200));
    _corpPut(e, 'mode', _corpS(r.mode, 32));
    const ps = _corpParticipants(r.participants); if (ps.length) e.participants = ps;
    rooms.push(e);
  }
  if (rooms.length) o.rooms = rooms;
  return o;
}
function wsCorpChartNote(agentId, v) {
  if (!agentId || !v || typeof v !== 'object') return;
  const o = wsCorpChartSan(v);
  if (!o) { console.warn('[ws corp] CorporateChart from %s — roles[] 가 비어 채택 안 함 (좌석 없는 차트는 조직이 아님)', agentId); return; }
  let s; try { s = JSON.stringify(o); } catch { return; }
  if (s.length > CORP_MAX.bytes) { console.warn('[ws corp] CorporateChart from %s — %d bytes > cap %d, drop', agentId, s.length, CORP_MAX.bytes); return; }
  o.declaredBy = String(agentId); o.updatedAt = Date.now();
  wsCorpChart = o;
  if (_corpChartT) return;
  _corpChartT = setTimeout(() => { _corpChartT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(CORPCHART, JSON.stringify(wsCorpChart, null, 1)); } catch {} }, 1000);
}
function wsRoleStateNote(agentId, v) {
  if (!agentId || !v || typeof v !== 'object') return;
  const role = _corpS(v.role, 64);
  if (!role) { console.warn('[ws corp] RoleState from %s — value.role 누락, drop', agentId); return; }
  const o = { role };
  const st = _corpS(v.status, 32);
  if (st && CORP_STATUS.has(st)) o.status = st;
  else if (st) console.warn('[ws corp] RoleState "%s" from %s — 미정의 status "%s" 는 싣지 않아요 (부재 ≠ 유휴)', role, agentId, st);
  _corpPut(o, 'task', _corpS(v.task, 400));
  _corpPut(o, 'taskRef', _corpS(v.taskRef, 120));   // §13.31 보드 항목 id — 차트와 작업 등록부는 참조로 일치시켜요(재기술 금지)
  const _since = (typeof v.since === 'number') ? v.since : (typeof v.since === 'string' ? Date.parse(v.since) : NaN);
  if (isFinite(_since) && _since > 0) o.since = _since;   // epoch 정규화 (wsNormTs 와 같은 규율 — ISO 문자열도 숫자로)
  _corpPut(o, 'blockReason', _corpS(v.blockReason, 400));
  if (v.budgetUsed != null) _corpPut(o, 'budgetUsed', (typeof v.budgetUsed === 'object') ? _corpObj(v.budgetUsed, 256) : (typeof v.budgetUsed === 'number' ? _corpN(v.budgetUsed) : _corpS(v.budgetUsed, 64)));
  o.declaredBy = String(agentId); o.updatedAt = Date.now();   // 좌석 귀속 + 신선도 — 렌더가 stale 을 판정할 수 있게(부재 ≠ 유휴의 시간축)
  wsRoleStates.set(role, o);
  while (wsRoleStates.size > CORP_MAX.roles * 2) wsRoleStates.delete(wsRoleStates.keys().next().value);   // 좌석 맵 무한 성장 차단
  if (_roleStT) return;
  _roleStT = setTimeout(() => { _roleStT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(ROLESTATES, JSON.stringify(Object.fromEntries(wsRoleStates), null, 1)); } catch {} }, 1000);
}
// §13.33.4 권한 — CorporateChart 는 main 만(차트 = 조직 전체에 대한 주장), RoleState 는 그 좌석 본인 또는
// main 대행만. 차트가 좌석↔agentId 매핑을 싣지 않으니 "본인"은 (a) 식별자 정합(agentId/agentName 정규화 비교)
// 또는 (b) 그 좌석을 직전에 선언한 게 자기 자신인 경우로 판정해요. fail-closed + 거부 로그 (조용한 무시 금지).
function _corpNorm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function wsCorpSeatOwn(conn, seat) {
  const me = conn.meta.agentId;
  if (!me) return false;
  // ① 차트가 좌석↔agentId 를 선언했으면 그것이 권위 — 추측 앞에 둡니다.
  const decl = (wsCorpChart && Array.isArray(wsCorpChart.roles)) ? wsCorpChart.roles.find((r) => r && r.role === seat) : null;
  if (decl && decl.agentId) return decl.agentId === me;   // 선언이 있으면 그것만 인정 (fail-closed — 이름이 닮았다는 이유로 통과시키지 않아요)
  // ② 선언이 없을 때만 식별자 정규화 휴리스틱
  const n = _corpNorm(seat);
  if (n && [me, conn.meta.agentName, String(me).replace(/-(agent|worker|bot|session)$/i, '')].some((c) => c && _corpNorm(c) === n)) return true;
  const cur = wsRoleStates.get(seat);
  return !!(cur && cur.declaredBy === me);
}
function wsCorpDeclAuthz(conn, msg) {
  const v = (msg && msg.value && typeof msg.value === 'object') ? msg.value : {};
  const isAgent = conn.meta.role === 'agent';
  const arole = isAgent ? wsAgentRole(conn) : null;
  const asMain = isAgent ? (arole === 'main') : wsOperatorAuthz(conn);   // board 표면은 §13.25.9 운영자 게이트(loopback/allowlist)로 판정
  const who = conn.meta.agentId || conn.meta.ip || '?';
  if (msg.name === 'CorporateChart') {
    if (asMain) return true;
    console.warn('[ws corp] CorporateChart 거부 — %s (role=%s) 는 main 이 아니에요 (§13.33.4: 차트는 조직 전체에 대한 주장이라 main 전용)', who, arole || conn.meta.role);
    return false;
  }
  if (asMain) return true;
  const seat = _corpS(v.role, 64);
  if (seat && wsCorpSeatOwn(conn, seat)) return true;
  console.warn('[ws corp] RoleState 거부 — %s (role=%s) 가 좌석 "%s" 를 대신 선언했어요 (§13.33.4: 본인 좌석 또는 main 대행만)', who, arole || conn.meta.role, seat || '(role 누락)');
  return false;
}
const WS_CORP_DECL = new Set(['CorporateChart', 'RoleState']);   // 권한 게이트 + push 소음 제외 대상. 정본 push blocklist 는 push.cjs NOISE — 여기 가드는 그 목록이 낡은 배포에서도 tickle 이 새지 않게 하는 서버측 이중화예요.
// v2.4.74 — SelectionPrompt 타임아웃 (§13.16.12 확장, Superscalar §4.1 극성 채택).
// 발신 에이전트가 value.timeout{kind:'clarify'|'approval', seconds?} (+선택 expiresAt) 를 스탬프하면
// 서버가 pending 을 영속 추적하고, 만료 시 SelectionExpired 를 보드 브로드캐스트 + 발신자에게 msgId 부여
// 타깃 발신(§13.13.2 at-least-once — 턴-기반 에이전트도 인바운드로 기상). 기본: clarify=3600s(만료=발신자
// 자체진행 sentinel, 늦은 답=steering) / approval=60s(만료=fail-closed 거부). timeout 미선언 = 종전 무기한.
const PENDSEL = path.join(HISTDIR, '.pending-selections.json');
const wsSelPend = new Map();
const _selTimers = new Map();
try { const _sp = JSON.parse(fs.readFileSync(PENDSEL, 'utf8')); for (const k of Object.keys(_sp)) wsSelPend.set(k, _sp[k]); } catch {}
let _selPersistT = null;
function wsSelPersist() { if (_selPersistT) return; _selPersistT = setTimeout(() => { _selPersistT = null; try { fs.mkdirSync(HISTDIR, { recursive: true }); fs.writeFileSync(PENDSEL, JSON.stringify(Object.fromEntries(wsSelPend), null, 1)); } catch {} }, 500); }
function wsSelArm(promptId) {
  const e = wsSelPend.get(promptId); if (!e) return;
  if (_selTimers.has(promptId)) clearTimeout(_selTimers.get(promptId));
  _selTimers.set(promptId, setTimeout(() => wsSelExpire(promptId), Math.max(0, e.expiresAt - Date.now())));
}
function wsSelPendNote(msg) {
  const v = (msg && msg.value) || {};
  if (!v.promptId || !v.timeout || !v.timeout.kind) return;
  const kind = v.timeout.kind === 'approval' ? 'approval' : 'clarify';
  const secs = Number(v.timeout.seconds) > 0 ? Number(v.timeout.seconds) : (kind === 'approval' ? 60 : 3600);
  const expiresAt = Number(v.expiresAt) > 0 ? Number(v.expiresAt) : (Date.now() + secs * 1000);
  wsSelPend.set(String(v.promptId), { agentId: msg.agentId, kind, expiresAt });
  wsSelPersist(); wsSelArm(String(v.promptId));
}
const wsSelDone = new Map();   // v2.4.77 — promptId→agentId tombstone (post-clear late answer 의 §13.16.12 스티어링 라우팅용; 메모리-only, cap 200)
function wsSelTomb(promptId, agentId) { if (!agentId) return; wsSelDone.set(promptId, agentId); if (wsSelDone.size > 200) wsSelDone.delete(wsSelDone.keys().next().value); }
function wsSelPendClear(promptId) {
  if (!promptId || !wsSelPend.has(String(promptId))) return;
  const _e = wsSelPend.get(String(promptId)); if (_e) wsSelTomb(String(promptId), _e.agentId);
  wsSelPend.delete(String(promptId)); wsSelPersist();
  const t = _selTimers.get(String(promptId)); if (t) { clearTimeout(t); _selTimers.delete(String(promptId)); }
}
function wsSelExpire(promptId) {
  const e = wsSelPend.get(promptId); if (!e) return;
  wsSelPendClear(promptId);
  const resolution = e.kind === 'approval' ? 'denied-fail-closed' : 'proceed-default';
  const ev = wscore.event('CUSTOM', { name: 'SelectionExpired', value: { promptId, kind: e.kind, resolution, expiredAt: Date.now() } });
  ev.source = 'server';
  wsToBoards(ev); wsRecord(ev);
  if (e.agentId) {
    const tv = Object.assign({}, ev, { targetAgentId: e.agentId, msgId: 'sel-exp-' + promptId });
    const conn = wsAgents.get(e.agentId);
    if (conn && conn.alive) conn.send(tv);
    _relayPendingAdd(e.agentId, tv);   // at-least-once — 브릿지 delivered-persist ack 가 clear
  }
}
setTimeout(() => { for (const k of [...wsSelPend.keys()]) wsSelArm(k); }, 3000);   // 재기동 재무장 (기한 경과분 즉시 만료; 3s 지연 = 브릿지 재접속 여유)

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
// v2.4.129 — **활성 채널도 최근분만 보내요.** 종전엔 활성 채널의 events 를 전량 실었고, 오래 도는
//   보드에서 그게 첫 페인트를 눌렀어요(운영자 보고 2026-08-01: 「row 가 너무 많아졌다」). 상한을
//   두되 **조용히 자르지 않아요** — 잘린 사실·건수·가장 오래된 시각을 scope 에 실어야 클라이언트가
//   «더 있다» 를 알고 이어서 요청할 수 있어요. 축약을 신호 없이 하던 게 정확히 v2.4.89 에서 오진을
//   유발한 그 부류예요(그때 scope 를 만든 이유).
const HISTORY_INITIAL_PER_CHAN = Number(process.env.HISTORY_INITIAL_PER_CHAN || 150);
function wsHistoryPayload() {   // C(lazy load): active 채널 최근분 + cold/archived stub(키·건수만, 내용은 on-demand)
  const present = wsPresentIds(), events = [], cold = [], truncated = [];
  for (const [ck, a] of wsHistByChan) {
    if (!a.length) continue;
    if (wsChanActive(ck, present)) {
      const slice = a.length > HISTORY_INITIAL_PER_CHAN ? a.slice(-HISTORY_INITIAL_PER_CHAN) : a;
      if (slice.length < a.length) {
        truncated.push({ key: ck, sent: slice.length, total: a.length, oldestSentTs: slice[0].timestamp || 0 });
      }
      for (const e of slice) events.push(e);
    }
    else cold.push({ key: ck, count: a.length, lastTs: a[a.length - 1].timestamp || 0, role: wsChanRoleOf(ck) });   // v2.4.59 role 동봉 — 그룹 오분류 fix
  }
  events.sort((x, y) => (x.timestamp || 0) - (y.timestamp || 0));
  // v2.4.89 (adopter observation C11b-부수): History 는 **활성 채널의 events + cold/archived 스텁**이라는 정책적 축약본인데,
  // 축약되었다는 신호가 없어 "이 보드 History 는 A2A 를 담지 않는다"는 오진을 유발했다. 정책을 페이로드에 명시한다.
  const scope = { policy: 'active-channels-recent+stubs', activeEvents: events.length, coldChannels: cold.length, archivedChannels: wsArchivedList().length, perChannelLimit: HISTORY_INITIAL_PER_CHAN, truncated, note: 'cold/archived 채널 내용은 RequestChannelHistory 로 on-demand — 부재 ≠ 미기록. 활성 채널도 최근 perChannelLimit 건만 — truncated[] 의 채널은 beforeTs 를 실어 RequestChannelHistory 로 이어 받으세요'};
  return { events, cold, archived: wsArchivedList(), scope, manifests: Object.fromEntries(wsCmdManifests), opsStates: Object.fromEntries(wsOpsStates), capManifests: Object.fromEntries(wsCapManifests), corporateChart: wsCorpChart || null, roleStates: Object.fromEntries(wsRoleStates), seatTelemetry: Object.fromEntries(wsSeatTels) };   // v2.4.67 매니페스트 + v2.4.71 운용상태 + v2.4.76 능력선언 + v2.4.89 scope + v2.4.90 §13.33 조직 차트/좌석 상태 동봉
}
// v2.4.140 (독립 구현 parity 이식이 원본 감사로 되돌아온 건): History 발송 여부를 payload 에서 **파생**해요.
//   종전 가드는 payload 키를 손으로 다시 열거했고, v2.4.71(opsStates)·v2.4.76(capManifests) 추가를 못 따라가
//   «대화·매니페스트·조직 선언 없이 OpsState/CapabilityManifest 만 있는 신생 서버» 에서 History 가 조용히
//   빠졌어요 — v2.4.90(«선언만 있어도 History 가 나가야»)이 막으려던 바로 그 부류가 가드 자신에서 재발한 거예요.
//   scope 는 항상 차 있는 메타라 제외하고, 나머지는 어떤 필드든 내용이 있으면 보낼 이유예요. 저장소 키가 또
//   늘어도(payload 에 싣는 순간) 이 가드는 수정 없이 따라와요 — 열거는 파생으로만.
function wsHistoryHasContent(h) {
  return Object.entries(h).some(([k, v]) => k !== 'scope' && (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v));
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
// v2.4.129 — **방송 전에 시각을 정규화해요.** wsNormTs 는 여태 «저장·적재 경계» 에만 있었는데,
//   디스패치는 `wsToBoards(msg); wsRecord(msg);` 순서라 대시보드는 **정규화 전** 프레임을 받아요.
//   그래서 시각 없는 프레임이 라이브에서는 엉뚱한 자리에 뜨고(소비자가 `timestamp || 0` 을 쓰니
//   1970년 자리), 새로고침하면 저장분이 정상 시각을 갖고 있어 제자리로 돌아와요 — 「일부 줄이 제
//   시간이 아닌 위치에」라는 운영자 보고(2026-08-01)의 정확한 모양이에요. 발신자를 고치는 것만으론
//   부족해요: 시각을 안 싣는 어댑터가 하나만 있어도 같은 증상이 돌아오거든요. 경계에서 막아요.
// v2.4.131 §13.13.4 — 대시보드 피드백(POST /api/feedback)은 **적재만으로 끝나면 안 돼요.**
//   feedback.jsonl 은 기록(log-of-record)이고, 도착을 아는 층은 따로 있어야 해요. 실측: 운영자가 결정 답변
//   5건을 넣었는데 어떤 소비자도 그 파일을 보지 않아 에이전트가 못 들었고, 하필 «wake 가 안 된다» 는 신고까지
//   같은 구멍에 빠졌어요. 파일을 지켜보라고 소비자마다 가르치는 대신, 서버가 기존 파이프라인으로 릴레이해요:
//   메인 지정 + 회수 열쇠(부재 창 재전달, §13.13.2) + board 미러 + history 영속 + webpush. HTTP 유래라
//   conn 이 없어서 board-inbound 꼬리를 여기 축약해요.
function wsRelayOperatorFeedback(entry) {
  const ev = wscore.event('CUSTOM', { name: 'OperatorFeedback', value: entry });
  ev.source = 'board';
  ev.targetAgentId = WS_PRIMARY_ID;
  _wsStampRelayKey(ev, 'opfb');                    // 열쇠 없는 프레임은 «보냈다≠닿았다» 부류 (v2.4.127)
  wsNormTs(ev);
  const d = wsAgents.get(WS_PRIMARY_ID);
  if (d && d.alive) d.send(ev);
  _relayPendingAdd(WS_PRIMARY_ID, ev);             // 부재 시 재접속 재전달; 상한 초과는 로그 (HTTP 발신자에겐 회신 채널 없음)
  wsToBoards(ev);
  wsRecord(ev);
  try { push.maybePush(ev); } catch {}
}
function wsToBoards(msg) { wsNormTs(msg); for (const c of wsConns) if (c.meta.role !== 'agent' && c.alive) c.send(msg); }
function wsToAll(msg) { wsNormTs(msg); for (const c of wsConns) if (c.alive) c.send(msg); }   // 시스템 공지(ServerNotice 등) — 에이전트+board 전체
// v2.4.88 (adopter question → measured defect): AgentList 갱신이 board 로만 나가고 있었다. 에이전트는 upgrade 직후
// 스냅샷 1장만 받는데 그 시점은 자기 HELLO **이전**이라, 그 캐시는 자기 자신도 없고 이후 합류자도 영구히 반영되지 않는다
// (어댑터가 "자기 자신이 목록에 없다"로 관측 — 의도된 self-필터가 아니라 stale 캐시였다). 프레즌스는 에이전트에게도
// 1급 데이터(§13.9.4 tri-state·§13.13.2 재전달의 recipient-present 판정)이므로 board 와 함께 에이전트에게도 push.
function wsPushAgentList() { wsToAll(wscore.event('CUSTOM', { name: 'AgentList', value: { agents: wsAgentList() } })); }

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
// v2.4.111 §13.25.14 — 보드 상태 1회 전달. 접속 직후(무키) 또는 HELLO 통과 직후(유키) 중 **한 번만** 불려요.
//   `_stateSent` 이 그 «한 번» 을 지켜요 — 재호출이 History 를 두 벌 보내면 어댑터 저장소가 다시 곱해져요(§7).
function wsSendInitialState(conn) {
  if (!conn || conn.meta._stateSent) return;
  conn.meta._stateSent = true;
  conn.send(wscore.event('CUSTOM', { name: 'AgentList', value: { agents: wsAgentList() } }));   // 먼저 role/이름 — 모니터 a2a 분류(§13.5)·History 재생이 role 을 참조하므로
  { const _h = wsHistoryPayload(); if (wsHistoryHasContent(_h)) conn.send(wscore.event('CUSTOM', { name: 'History', value: _h })); }   // C(lazy): active 채널 events + cold/archived stub(내용은 탭 클릭·복원 시 on-demand). v2.4.90 취지(선언만 있어도 History 발송) 그대로, v2.4.140 부터 판정은 손 열거가 아니라 payload 파생 — opsStates·capManifests 누락 드리프트의 재발 방지
}
// ──────────────────────────────────────────────────────────────────────────────────────────
server.on('upgrade', (req, socket) => {
  if (req.url.split('?')[0] !== '/ws') { socket.destroy(); return; }
  // #5a-3 upgrade 사전검사 — 노출 환경에서 agent·MCP 둘 다 차단된 IP 는 handshake 전 거부 (접속 직후 보내는 History/AgentList 누수 차단).
  //   둘 중 하나라도 허용이면 통과 후 HELLO 에서 표면별(agent/MCP) 정밀 판정 + requireKey 검사. loopback/비-노출은 면제.
  { const _ip = req.socket.remoteAddress;
    const _a = surfaceDecide('agent', _ip), _m = surfaceDecide('mcp', _ip);
    if (!_isLoopback && !isLoopbackIp(_ip) && !(_a.ok || _m.ok)) {
      // **사유를 찍어요.** 종전엔 «allowlist 밖» 한 문구뿐이라 「공개 주소라 거절」과 「대역을 안 열어서
      //   거절」이 구분되지 않았어요 — 앞은 설계고 뒤는 설정이라 운영자가 할 일이 정반대예요.
      console.warn('[ws upgrade] #5a-3 거부 ip=%s scope=%s — agent: %s / mcp: %s', normIp(_ip) || '?', _a.scope, _a.why, _m.why);
      socket.destroy(); return;
    } }
  // v2.4.112 §13.25.15 (Ultrasafe 회차 2 — web-09 / se-09 / tml-09, critical) — **CSWSH.**
  //   upgrade 는 Origin 을 아예 안 봤어요. HTTP POST 면에는 CSRF 게이트를 걸어뒀는데(web-01 에서
  //   닫은 그 계열) 훨씬 강한 WS 면에는 없었어요. 결과: 운영자가 브라우저로 여는 **아무 페이지**나
  //   이 보드에 붙을 수 있고, 무키 연결은 HELLO 없이 «대시보드» 로 분류돼 AgentList + History 전체를
  //   즉시 받아요(v2.4.111 이 남겨둔 무키 표면). 거기서 KeyList·SetMain·이력 삭제·메인 프롬프트
  //   주입까지 이어져요. `requireKey:true` 도 HELLO 시점 검사라 **HELLO 를 안 보내면 안 걸려요.**
  //
  //   판정 기준은 «브라우저가 보냈는가» 예요. Origin 은 브라우저만 붙여요 — ws 라이브러리로 붙는
  //   에이전트·MCP 클라이언트는 안 보내요. 그래서 **Origin 이 있으면 같은 출처여야 하고, 없으면
  //   비-브라우저로 보고 통과**시켜요(그 뒤 키/HELLO 게이트가 종전대로 걸려요). 반대로 하면
  //   — 없을 때 거부 — 모든 에이전트가 끊겨요.
  { const origin = req.headers.origin;
    if (origin) {
      let allowed = false;
      try {
        const o = new URL(origin);
        // 같은 출처: 대시보드는 이 서버가 서빙해요. LAN 노출 배포에서 LAN 주소로 열어도 host 가 같아요.
        if (req.headers.host && o.host === req.headers.host) allowed = true;
        // v2.4.126 — **loopback 페이지 예외를 뺐어요.** 여기 있던 「포트가 다른 로컬 개발 서버는 명시 허용」이
        //   이 배포에서 **프록시 없이도 열려 있던 유일한 문**이었어요. 이 기계의 아무 localhost 포트에서
        //   서빙되는 페이지의 JS 가 이 엔드포인트를 열면, 그 소켓은 키도 HELLO 도 없어 conn.meta.role 이
        //   undefined 로 남고 **board(=운영자) 갈래**로 분류돼요. 그 뒤로 KeyList(키 원문)·SetMain·
        //   이력 비가역 삭제·메인 에이전트 프롬프트 주입까지 열려요.
        //   **결정적 진단자**: 같은 위협에 같은 저자가 쓴 HTTP 쌍둥이 sameOriginPost 에는 이 예외가 없어요.
        //   독립 판단 둘이 같은 자리에서 갈리면 취향이 아니라 규격의 빈 자리예요 — §13.25.15 가
        //   「or be a loopback page」로 명시 허용하고 있었고, 그 문장이 틀렸어요.
        //   대시보드는 이 서버가 서빙하니 위 host-일치 갈래로 통과해요. 정당한 타-출처 배포는 아래
        //   WS_ALLOWED_ORIGINS 가 덮어요 — 그건 «명시 선언» 이라 이 예외와 성질이 달라요.
      } catch { /* 파싱 불가 Origin → 거부 */ }
      // 운영자가 별도 출처를 쓰는 배포용 탈출구. 비우면 위 두 규칙만 적용돼요.
      if (!allowed) {
        const extra = String(process.env.WS_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (extra.includes(origin)) allowed = true;
      }
      if (!allowed) {
        console.warn('[ws upgrade] CSWSH 거부 — 교차출처 Origin=%s (host=%s)', origin, req.headers.host || '?');
        socket.destroy(); return;
      }
      // 같은 출처까지 통과했으면 이제 «누가» 를 물어요. 여기까지 온 Origin 은 브라우저이고,
      //   브라우저 갈래(대시보드)는 키도 HELLO 도 없이 AgentList + History 전체를 받아요. HTTP 쪽
      //   readGate 만 걸고 이 소켓을 열어두면 같은 데이터가 옆문으로 그대로 나가요.
      if (operatorAuth.enabled() && !operatorAuth.operatorOfReq(req)) {
        console.warn('[ws upgrade] §13.25.17 미인증 브라우저 거부 — Origin=%s (계정 %d개, 세션 없음)', origin, operatorAuth.count());
        socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
        socket.destroy(); return;
      }
    } }
  const conn = wscore.handleUpgrade(req, socket);
  if (!conn) return;
  conn.meta.ip = normIp(req.socket.remoteAddress);   // v2.4.87 — 운영자 authz(§13.25.9) 가 주소를 봐야 하므로 upgrade 시 보관
  // `tml-10` — 전달 헤더가 붙어 왔으면 이 주소는 **프록시의 것**이라 loopback 이어도 로컬이 아니에요.
  //   upgrade 때만 헤더를 볼 수 있으니 여기서 표시해 두고, host-local 판정이 그걸 봐요.
  conn.meta.fwd = ipScope.forwardedPresent(req.headers);
  // v2.4.136 §13.25.17 — 쿠키의 세션을 소켓에 붙여요. 계정이 0이면 항상 null 이라 아무 갈래도 안 바뀌어요.
  //   upgrade 때만 헤더를 볼 수 있으니 fwd 와 같은 자리에서 한 번만 읽어요.
  conn.meta.operator = operatorAuth.enabled() ? operatorAuth.operatorOfReq(req) : null;
  try { const u = new URL(req.url, 'http://x').searchParams; const k = u.get('key') || u.get('peerKey') || u.get('upstreamKey') || u.get('collabKey'); conn.meta._urlKey = k; const kr = wsKeyRole(k); if (kr === 'collab') { conn.meta.collab = true; conn.meta.upstreamKey = k; } else if (kr === 'peer') { conn.meta.peer = true; conn.meta.upstreamKey = k; } else if (kr === 'upstream' || wsValidKey(u.get('upstreamKey'))) { conn.meta.upstream = true; conn.meta.upstreamKey = k; } else if (kr === 'local') { conn.meta.localKey = true; conn.meta.upstreamKey = k; }   /* v2.4.101 — local(lk-) 분기가 **이 자리에도** 없었어요. v2.4.99 는 HELLO 본문 경로만 고쳤는데, 레퍼런스 join-local 은 키를 URL 로만 보내요(?key=). 그래서 (a) 그 키는 관측되지 않아 state/lastAgent 가 초기값에 머물고 (b) 원격 local 키 거부 가드가 발동하지 않았어요 — 재기동 후 실측으로 드러난 구멍. 스모크가 두 경로에 다 키를 실어서 URL-only 경로를 시험하지 않았던 것도 같이 고쳤어요. */ if (k != null) console.log('[ws upgrade] key=%s role=%s', keyFp(k), kr); } catch {}   // #168 키 role 판정 · v2.4.0 upstreamKey 보관 (KEY-MGMT 매칭) · v2.4.52 peer(pk-) 분기
  // v2.4.104 §13.25.13 — 기간 지난 키는 여기서 끊어요. 아래 SERVER_HELLO/AgentList/History 보다
  //   **앞**이어야 해요: URL 로 키를 싣는 클라이언트는 HELLO 를 보내기 전에 이미 보드 내용을 받으니까요
  //   (v2.4.41 이 IP 차단에 대해 같은 이유로 잡아둔 순서와 동일한 근거).
  { const _exp = keyExpiredRefusal(conn.meta._urlKey);
    if (_exp) {
      try { conn.send(wscore.event('CUSTOM', { name: 'ConnectionRejected', value: { code: 'key-expired', reason: 'the presented key is past its validity window', label: _exp.label, expiresAt: _exp.expiresAt, hint: 'Constellation §13.25.12 — 보드 운용자가 🔑 관리 창에서 연장하면 같은 키로 다시 접속돼요(열쇠 문자열은 바뀌지 않아요).' } })); } catch {}
      try { conn.close(4003, 'key expired'); } catch {}
      return;
    } }
  wsConns.add(conn);
  conn.send(wscore.event('SERVER_HELLO', { sessionId: conn.id, protocolVersion: '0.3', serverTime: new Date().toISOString() }));
  // v2.4.111 §13.25.14 (adopter-reported ME-CST-13) — **보드 상태는 정체 판정 뒤에.** 종전엔 여기서 무조건
  //   나갔는데, TOFU 위반 거부(key-identity-mismatch)는 HELLO 에서야 나요. 그래서 **유출된 키를 든 쪽이
  //   거부되기 전에 AgentList 와 History 전체를 받았어요** — 어댑터가 자기 보조 도구로 실측 확인해줬어요
  //   («도구는 결과를 다 얻어요»). TOFU 는 se-01 보안 수정이었는데 targeted relay 만 지키고 보드 내용은
  //   못 지킨 거예요. v2.4.104 가 key-expired 에 대해 세운 순서 규칙(거부는 상태 전송 앞)을 TOFU 는 지킬 수
  //   **없어요** — 판정에 필요한 agentId 가 HELLO 에만 있으니까요. 그래서 위치를 옮기는 대신 상태를 미뤄요.
  //   가르는 기준은 **IP 가 아니라 키 제시 여부**예요: 역프록시 뒤에서는 원격도 전부 loopback 으로 보여서
  //   IP 기준은 조용히 무력화돼요. 무키 연결(대시보드 — HELLO 를 아예 안 보내요)은 종전 그대로예요.
  if (!conn.meta._urlKey) wsSendInitialState(conn);
  conn.onclose = () => {
    wsConns.delete(conn);
    for (const [sid, c] of wsPtySessions) if (c === conn) {   // Pantty §9 — 연 board 이탈 시 세션 정리 + pty-host 에 종료 지시(고아 셸 방지)
      wsPtySessions.delete(sid);
      const host = wsAgents.get('pty-host'); if (host && host.alive) { try { host.send({ type: 'CUSTOM', name: 'PtyClose', value: { sessionId: sid } }); } catch {} }
    }
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
      {
        const _an = safeAgentName(msg.agentName, conn.meta.agentId, [...wsAgents.keys()]);
        conn.meta.agentName = _an.name;
        if (_an.why) console.warn('[ws HELLO] 표시 이름 거부(%s) agent=%s ip=%s — 자기 식별자로 되돌림', _an.why, conn.meta.agentId, normIp(conn.remoteAddr) || '?');
      }
      { const k = msg.key || msg.peerKey || msg.upstreamKey || msg.collabKey; const kr = wsKeyRole(k); if (kr === 'collab') { conn.meta.collab = true; conn.meta.upstreamKey = k; } else if (kr === 'peer') { conn.meta.peer = true; conn.meta.upstreamKey = k; } else if (kr === 'upstream' || (msg.upstreamKey && wsValidKey(msg.upstreamKey))) { conn.meta.upstream = true; conn.meta.upstreamKey = k; } else if (kr === 'local') { conn.meta.localKey = true; conn.meta.upstreamKey = k; } }   // #168 HELLO 키 role 판정 · v2.4.0 upstreamKey 보관 (KEY-MGMT 매칭) · v2.4.52 peer(pk-) 분기 · v2.4.99 local(lk-) 분기 신설 — 아래 참조
      conn.meta.roleHint = msg.role || '';                       // local/upstream 힌트(최종 판정은 키·main)
      // #5a-3 표면별 접근 판정 — HELLO 에서 agent/MCP 구분(capabilities mcp-proxy) 후 그 표면의 IP allowlist + (둘 다) requireKey 적용.
      { const _ip = conn.remoteAddr;
        const _surface = (Array.isArray(msg.capabilities) && msg.capabilities.includes('mcp-proxy')) ? 'mcp' : 'agent';
        // v2.4.89 (adopter-reported C11b): 거부는 **말해주고** 끊는다. 종전엔 사유 없는 close 뿐이라, 같은 버스트에
        // 파이프라인된 후속 프레임이 전송 계층에서 사라지고 클라이언트는 "SERVER_HELLO 받고 정상 종료 = 전송 성공"으로
        // 오인했다 (어댑터가 리포트를 보냈다고 믿었는데 보드에 없던 실사례). ConnectionRejected 이벤트 + close code 4403.
        const _reject = (code, reason, hint) => {
          // v2.4.99 — `code` 를 **본문에도** 싣습니다. 종전엔 기계가 읽을 코드가 close frame(4403, code) 에만 있어서,
          //   ConnectionRejected 를 받은 어댑터는 사람용 문장을 문자열 매칭하는 수밖에 없었어요. 거부 사유에 따라
          //   분기(키 재발급 vs 로컬에서 재시도 vs 다른 종 키)해야 하는데 그 분기를 코드로 쓸 수가 없었던 거예요.
          // v2.4.111 §13.25.14 — «이 연결로 이미 받은 상태는 무효» 를 **기계가 읽을 수 있게** 실어요 (adopter 제안 ME-CST-13).
          //   유키 연결은 이제 상태를 HELLO 뒤로 미루니 보통 false 지만, 키를 URL 이 아니라 HELLO 본문으로만
          //   보내는 클라이언트는 접속 시점에 키가 안 보여서 상태가 이미 나가 있어요 — 그 경우를 숨기지 않아요.
          //   (그래서 키는 URL 파라미터로 싣는 게 권장이에요 — 서버가 상태 전송 전에 판단할 수 있어요.)
          try { conn.send(wscore.event('CUSTOM', { name: 'ConnectionRejected', value: { code, reason, surface: _surface, ip: normIp(_ip), agentId: conn.meta.agentId, hint, priorStateDelivered: !!conn.meta._stateSent, priorStateHint: conn.meta._stateSent ? '이 연결로 앞서 받은 AgentList/History 는 무효예요 — 인가되지 않은 연결의 전송분이라 버리세요.' : undefined } })); } catch {}
          setTimeout(() => { try { conn.close(4403, code); } catch {} }, 50);   // 이벤트가 flush 될 틈을 준 뒤 close
        };
        if (!surfaceAllowed(_surface, _ip)) {
          console.warn('[ws HELLO] #5a-3 %s 거부 (IP allowlist 밖) ip=%s agent=%s', _surface, _ip || '?', conn.meta.agentId);
          _reject('ip-not-allowlisted', `${_surface} surface: address not in allowlist`, 'Constellation §13.25 — access.json 의 ' + _surface + '.allowlist 에 이 주소를 추가하세요.');
          return;
        }
        // v2.4.104 §13.25.13 — 본문으로 키를 싣는 경로. URL 경로는 upgrade 에서 이미 끊겨요. 종별 거부보다
        //   앞에 둬요: 기간이 지난 키는 어느 종이든 무효라, 종을 먼저 따지면 «왜 거부됐나» 가 흐려져요.
        { const _exp = keyExpiredRefusal(conn.meta.upstreamKey);
          if (_exp) {
            _reject('key-expired', 'the presented key is past its validity window', 'Constellation §13.25.12 — 보드 운용자가 🔑 관리 창에서 연장하면 같은 키로 다시 접속돼요(열쇠 문자열은 바뀌지 않아요).');
            return;
          } }
        // v2.4.99 §13.25.11 (Ultrasafe it-1 se-01 도달범위) — `local` 종 키를 **원격에서** 제시하면 거부.
        //   `lk-` 는 호스트-로컬 워커용인데, 그 종만 collab/peer/upstream 플래그를 안 세워서 위의 main 분기로
        //   흘러들 수 있는 유일한 종이었어요(측정된 사슬의 권한 획득 단계). 원격에서 온 «local» 은 범주 오류예요.
        //   위의 main=호스트-로컬 가드와 이중 방어 — 둘 중 하나만 남아도 사슬이 끊기게.
        if (conn.meta.localKey && !isLoopbackIp(_ip)) {
          console.warn('[ws HELLO] §13.25.11 원격 local 키 거부 ip=%s agent=%s', normIp(_ip) || '?', conn.meta.agentId);
          _reject('local-key-remote', 'a local-kind key (lk-) may only be presented from the board host itself', 'Constellation §13.25.11 — 원격 합류는 collab(ck-) · peer(pk-) · upstream(uk-) 키를 쓰세요. 이 연결로 보낸 후속 메시지는 relay 되지 않아요.');
          return;
        }
        // v2.4.99 §13.25.11 (se-01) — 키↔정체 TOFU 결속 위반 거부. 키는 처음 쓴 agentId 의 것이에요.
        { const _pinK = conn.meta.upstreamKey; const _bound = keyPinViolation(_pinK, conn.meta.agentId);
          if (_bound) {
            console.warn('[ws HELLO] §13.25.11 키-정체 불일치 거부 key=%s bound=%s claimed=%s ip=%s', keyFp(_pinK), _bound, conn.meta.agentId, normIp(_ip) || '?');
            // v2.4.111 — hint 교정 (adopter 질문 ME-CST-13 §3). 종전 문구(«워커마다 별도 키를 발급하세요»)가
            //   **별도 키를 기본값처럼** 읽히게 했어요. 별도 키는 «정체가 실제로 다를 때» 의 답이에요 — 로스터에
            //   따로 서고 독립적으로 폐기하고 싶은 워커. 읽기 전용 보조 도구는 정체가 다른 게 아니라 **같은 정체의
            //   다른 창구**라서, 키를 더 발급하면 로스터에 유령이 서고 폐기면만 늘어요. §6 이 발신에 대해 세운
            //   규율(«새 연결을 열지 말고 상주 큐를 드레인») 이 수신에도 그대로 적용돼요.
            _reject('key-identity-mismatch', 'this key is bound to a different agentId', 'Constellation §13.25.11 — 키는 최초 사용 시 그 agentId 에 결속돼요(TOFU). 보조 도구·워커가 **같은 정체**의 다른 창구라면 키를 더 발급하지 말고 상주 연결(그 클라이언트의 저장소/발신 큐)을 재사용하세요. 로스터에 따로 서야 하는 **다른 정체**일 때만 별도 키를 발급하세요. 결속을 바꾸려면 운영자가 키를 폐기하고 재발급해야 해요.');
            return;
          } }
        if (accessCfg.agent.requireKey && !_isLoopback && !isLoopbackIp(_ip)) {
          const _k = msg.key || msg.peerKey || msg.upstreamKey || msg.collabKey || conn.meta._urlKey;
          if (!wsValidKey(_k)) {
            console.warn('[ws HELLO] #5a-3 무키/무효키 거부 ip=%s agent=%s', _ip || '?', conn.meta.agentId);
            _reject('key-required', 'agent surface requires a valid key (agent.requireKey=true)', 'Constellation §13.25.3 — 유효한 키를 ?key=/?peerKey=/?upstreamKey= 또는 HELLO 에 실어 주세요. 이 연결로 보낸 후속 메시지는 relay 되지 않아요.');
            return;
          }
        }
      }
      console.log('[ws HELLO]%s agent=%s ip=%s ua=%s upstreamKey=%s → role=%s', _hadId ? '' : ' [ANON]', conn.meta.agentId, conn.remoteAddr || '?', (conn.ua || '').slice(0, 50) || '-', keyFp(msg.upstreamKey), wsAgentRole(conn));   // role 전환 audit + 출처(ip/ua)
      if (!_hadId) { console.log('[ws HELLO][ANON] 익명 HELLO 등록 거부(AgentList/relay/탭 제외) raw=%s', JSON.stringify(msg).slice(0, 240)); return; }   // 익명(agentId 누락) = 보드 탭 미생성·relay 제외, 출처 로깅만
      const prev = wsAgents.get(conn.meta.agentId);
      if (prev && prev !== conn) { try { prev.close(); } catch {} }
      wsAgents.set(conn.meta.agentId, conn);
      wsChanRoleNote(conn.meta.agentId, wsAgentRole(conn));   // v2.4.59 — 채널 role 영속 (끊긴 뒤에도 스텁이 그룹 유지)
      wsPushAgentList();
      if (conn.meta.upstreamKey) keyObserveHello(conn.meta.upstreamKey, conn.meta.agentId);   // v2.4.0 §3.2/§4 lastAgent·lastSeenAt + ISSUED→ACTIVE
      // v2.4.89 (adopter proposal C11b-2): 등록 성공 시 **자기 권한을 알려준다**. 클라이언트가 "나는 지금 어떤 role 이고
      // 무엇이 허용되는가"를 추측하지 않아도 되게 — 권한을 모르면 무효 발신을 성공으로 오인하는 경로가 다시 생긴다.
      try {
        const _role = wsAgentRole(conn);
        conn.send(wscore.event('CUSTOM', { name: 'ConnectionInfo', value: {
          agentId: conn.meta.agentId, role: _role, surface: (Array.isArray(msg.capabilities) && msg.capabilities.includes('mcp-proxy')) ? 'mcp' : 'agent',
          mayManageKeys: _role === 'main', mayRelayTargeted: true, keyed: !!conn.meta.upstreamKey,
          historyScope: 'active-channels+stubs',
        } }));
      } catch {}
      // v2.4.111 §13.25.14 — 유키 연결은 여기까지 와야 보드 상태를 받아요 (위 upgrade 핸들러의 유예분).
      //   여기 도달 = TOFU·requireKey·allowlist·local-key-remote 게이트를 전부 통과했다는 뜻이에요.
      //   `_stateSent` 가드 덕에 무키 연결(접속 시 이미 받음)에는 두 번 나가지 않아요.
      wsSendInitialState(conn);
      return;
    }
    if (conn.meta.role === 'agent') {                           // 에이전트 outbound
      if (conn.meta.anonymous) return;                           // 익명 클라(agentId 누락) 메시지 무시 — relay/기록/탭 일절 안 함
      if (wsHandleOrch(conn, msg)) return;                       // 오케스트레이션 CUSTOM(RegisterUpstreamKey/RevokeUpstreamKey/SetMain/HandoffReady)
      if (msg && msg.type === 'CUSTOM' && (msg.name === 'Heartbeat' || msg.name === 'PersistentAdapterSmoke' || msg.name === 'Typing')) return;   // liveness/transient — relay·board·기록 안 함
      // v2.4.99 §13.25.11 (Ultrasafe it-1 se-02/se-04) — envelope 의 `agentId`·`source` 는 **인증된 연결 정체로
      //   덮어써요.** 종전엔 `== null` 일 때만 채웠고 값이 있으면 **검증 없이 통과**시켜, 남의 이름으로 보낸 메시지가
      //   그대로 relay 되고 ws-history 에 영속됐어요. `source` 는 더 나빴어요 — 주석이 "client-set 우선" 이라
      //   에이전트가 `source:'server'` 를 claim 하면 보드가 **시스템 권위 공지**로 렌더했어요(ServerNotice 위조).
      //   서버가 스스로 만드는 이벤트는 이 경로를 안 타니(wscore.event + ev.source='server') 강제해도 안전하고,
      //   실측상 정상 클라이언트 3종(collab-client ×2 · local-bridge)은 이미 전부 `source:'agent'` 를 보내요.
      //   이 두 줄이 아래의 개별 정정(SelectionPrompt · 조직 선언)을 일반화해요 — 그 셋은 같은 결함의 지역 처방이었어요.
      if (msg && typeof msg === 'object') {
        // v2.4.110 (Ultrasafe it-1 se-05 재시험) — `agentName` 도 함께 못박아요. `agentId`·`source` 만
        //   덮어쓰던 동안 **표시 이름은 여전히 클라이언트 선언값**이었고, 기기 푸시 알림의 제목이
        //   그 이름을 우선 사용해서(`agentName || agentId || source`) 남의 이름으로 알림을 띄울 수
        //   있었어요. 인증된 이름이 없으면 필드를 **지워요** — 위조된 값을 남기는 것보다 없는 게 정확해요.
        if (conn.meta.agentName) { if (msg.agentName !== conn.meta.agentName) msg.agentName = conn.meta.agentName; }
        else if (msg.agentName != null) delete msg.agentName;
        if (msg.agentId !== conn.meta.agentId) {
          if (msg.agentId != null) console.warn('[ws] §13.25.11 envelope agentId %s → 인증된 %s 로 정정 (type=%s name=%s)', msg.agentId, conn.meta.agentId, msg.type, msg.name || '-');
          msg.agentId = conn.meta.agentId;
        }
        if (msg.source !== 'agent') {
          if (msg.source != null) console.warn('[ws] §13.25.11 envelope source %s → agent 로 정정 (agent 연결은 server/board 를 claim 할 수 없어요) agent=%s name=%s', msg.source, conn.meta.agentId, msg.name || '-');
          msg.source = 'agent';   // v2.2.4 source_stamp_truth — v2.4.99 부터 client-set 을 **신뢰하지 않아요**
        }
      }
      // v2.4.77 — Selection reserved-name 가드 (§13.16.12, 어댑터 리뷰 지적): Expired/Resolved = 서버
      // 전용 발신, Answer = 사람(board) 전용 → agent 발신은 전부 위조로 drop. Cancel 은 인증된
      // 발신자 자신의 pending 프롬프트에 한해 허용 (남의 선택지 철회/응답 위조 차단).
      if (msg && msg.type === 'CUSTOM' && ['SelectionExpired', 'SelectionResolved', 'SelectionAnswer'].includes(msg.name)) { console.warn('[ws sel] reserved-name %s from agent %s — drop', msg.name, conn.meta.agentId); return; }
      if (msg && msg.type === 'CUSTOM' && msg.name === 'SelectionCancel') {
        const _pid = msg.value && String(msg.value.promptId || '');
        const _iss = _pid && ((wsSelPend.get(_pid) || {}).agentId || wsSelDone.get(_pid));
        if (_iss !== conn.meta.agentId) { console.warn('[ws sel] SelectionCancel from %s (issuer 아님) — drop', conn.meta.agentId); return; }
      }
      // v2.4.77 — SelectionPrompt issuer 는 인증된 connection identity 로 기록 (envelope agentId 신뢰 금지 — 만료 타깃 하이재킹 차단)
      if (msg && msg.type === 'CUSTOM' && msg.name === 'SelectionPrompt' && msg.agentId !== conn.meta.agentId) { console.warn('[ws sel] SelectionPrompt agentId %s → authenticated %s 로 정정', msg.agentId, conn.meta.agentId); msg.agentId = conn.meta.agentId; }
      // v2.4.90 §13.33.4 — 조직 선언 권한 게이트. envelope agentId 대신 **인증된 connection identity** 로 판정하고
      // (위조 차단), 미달이면 relay·board·기록 전에 drop + 로그. room 태깅 우회를 막으려 room 분기보다 앞에 둬요.
      if (msg && msg.type === 'CUSTOM' && WS_CORP_DECL.has(msg.name)) {
        if (msg.agentId !== conn.meta.agentId) { console.warn('[ws corp] %s agentId %s → authenticated %s 로 정정', msg.name, msg.agentId, conn.meta.agentId); msg.agentId = conn.meta.agentId; }
        if (!wsCorpDeclAuthz(conn, msg)) return;
      }
      // v2.4.99 §13.25.11 (Ultrasafe it-1 se-04) — ServerNotice 는 role 로 막지 않아요: 워커 브릿지의 online/offline
      //   공지도 정당한 용도라(local-bridge.cjs 재연결 broadcast) main 전용으로 좁히면 어댑터가 깨져요. 위조를
      //   가능케 한 건 verb 가 아니라 `source` 를 claim 할 수 있었다는 것이고, 그건 위에서 닫혔어요. 여기서는
      //   **인증된 발신자를 본문에 못박아** 보드가 "누가 말했나" 를 잃지 않게 해요(대시보드가 라벨을 그에 맞춰 렌더).
      if (msg && msg.type === 'CUSTOM' && msg.name === 'ServerNotice') {
        if (!msg.value || typeof msg.value !== 'object') msg.value = {};
        msg.value.agentId = conn.meta.agentId; msg.value.senderRole = wsAgentRole(conn);
        wsToAll(msg); wsRecord(msg); return;
      }   // 재시작/오프라인/온라인 공지 → 모든 연결(에이전트+board) broadcast
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
      if (msg && msg.type === 'CUSTOM' && msg.name === 'AckProcessed' && msg.value && msg.value.ackFor) {
        _relayPendingClear(conn.meta.agentId, msg.value.ackFor);
        // v2.4.132 §13.13.2 — **무대상 약정 ack 는 서버가 소비해요.** 서버/보드 유래 릴레이 프레임
        //   (OperatorFeedback 등)엔 발신 에이전트가 없어서 ack 이 갈 곳이 없는데, 종전엔 ① 브릿지가
        //   «수신처 없음 → ack 생략» 으로 응답을 아예 접었고(4개 구현 전부 — 같은 자리에서 넷이 막히면
        //   규격의 빈 자리예요) ② 무대상으로 보내면 아래 «대상 미지정 폴백» 이 그 ack 를 **메인에게
        //   배달**했어요. clear 가 목적의 전부이므로 여기서 흡수해요(기록만 남기고 return).
        if (!tgt) { wsRecord(msg); return; }
      }
      // v2.4.127 §13.13.2 — **«대상 미지정» 과 «지정됐는데 지금 없음» 을 가릅니다.** 종전 조건은
      //   `tgt && wsAgents.has(tgt)` 라, 대상 이름이 명부에 없으면 아래 else 로 흘러 «대상 미지정 폴백» 을
      //   탔어요. 결과는 한 봉투에 결함 둘이에요: 발신자는 미전달을 못 듣고(무음 유실), 메인은 **자기 앞이
      //   아닌 메시지를 받아요**(오배달·유출). 지정된 이름은 그 자체가 «메인에게 주라» 가 아니에요 —
      //   폴백은 «받을 사람을 안 적었을 때» 의 규칙이에요.
      if (tgt) {
        const d = wsAgents.get(tgt);
        if (d && d.alive) {
          d.send(msg);
          if (wsIsAckable(msg) && conn.alive) {   // §13.13 서버 delivered ack — relay 성공 시 발신자에게 자동 회신(전달 계층, board 미표시=과확인 피로 게이팅). 재기동 시 발효.
            const _ackEv = wscore.event('CUSTOM', { name: 'Ack', value: { ackFor: wsRelayKey(msg), kind: 'delivered', from: tgt } });
            _ackEv.targetAgentId = conn.meta.agentId; _ackEv.source = 'server';
            conn.send(_ackEv);
          }
          // §13.13.2 v0.4: register pending entry for key-bearing targeted CUSTOM (ack/ping kinds excluded inside wsRelayKey)
          // v2.4.136 — **자기 자신 앞 프레임은 회수 대상이 아니에요.** 받는 이가 보낸 이면 이미 도착한
          //   것이고, 게다가 수신 다리는 자기 echo 를 ack 하지 않아요(그래야 ack 이 자기를 반사하지 않아요).
          //   그래서 이 항목은 **구조적으로 절대 안 지워져요** — 3회 재전달 뒤 반드시 거짓 RelayUnreachable
          //   로 끝나요. 실측: 메인 다리의 AgentHello 가 자기 자신을 가리켜(WS_MAIN 기본값 = 자기 id)
          //   접속마다 이 경로를 탔어요. 「보냈는데 못 닿았다」는 통지가 실은 「나에게 보냈다」였어요.
          if (tgt !== conn.meta.agentId) _relayPendingAdd(tgt, msg);
        } else if (wsRelayKey(msg)) {
          // 회수 열쇠가 있으면 얹어요 — 재접속하면 재전달되고, 부재 상한을 넘기면 발신자에게 RelayUnreachable.
          //   «한 번도 접속한 적 없는 이름» 도 여기로 와요: 오타든 아직 안 뜬 동료든, 판정은 같아요(지금 못 닿음).
          _relayPendingAdd(tgt, msg);
          console.warn('[ws] relay 보류 — target=%s 부재(미접속/미상) from=%s key=%s', tgt, conn.meta.agentId, wsRelayKey(msg));
        } else if (conn.alive) {
          // 열쇠가 없으면 추적할 수 없어요. 그래도 **조용히 사라지면 안 돼요** — 발신자에게 즉시 알려요.
          const _ev = wscore.event('CUSTOM', { name: 'RelayUnreachable', value: { msgId: null, targetAgentId: tgt, attemptCount: 0, lastError: 'recipient-absent-untracked' } });
          _ev.targetAgentId = conn.meta.agentId; _ev.source = 'server';
          conn.send(_ev);
          console.warn('[ws] relay 불가 — target=%s 부재 + 회수 열쇠 없음 from=%s', tgt, conn.meta.agentId);
        }
        // v2.4.152 §13.8 — **직접 회신은 응답창을 닫아요.** 응답창은 「응답 adapter 가 envelope echo 를
        //   못 할 때」의 폴백이에요. 그 에이전트가 방금 원 요청자를 **명시로 지목해** 답한 순간 그 전제가
        //   반증돼요 — 지목할 수 있다는 걸 방금 보여 줬으니까요. 그런데 종전엔 RUN_FINISHED 만 창을
        //   닫아서, 지목해 답한 뒤에도 **120초 동안 무대상 프레임 전부**가 그 상대에게 부쳐졌어요.
        //   실측(2026-08-09): 좌석이 피어에게 정식 보고를 targeted 로 보낸 7초 뒤, **운영자에게 낼 답**과
        //   진행·비용 줄이 그 피어에게 갔고 운영자 채널엔 아무것도 안 남았어요. 밖에서 보이는 증상은
        //   「나한테 보내야 할 걸 A2A 로 보낸다」 였어요 — 폴백이 자기 성공 조건을 못 알아본 형태예요.
        const _rpSelf = _a2aPending.get(conn.meta.agentId);
        if (_rpSelf && _rpSelf.from === tgt) _a2aPending.delete(conn.meta.agentId);
        _a2aPending.set(tgt, { from: conn.meta.agentId, contextId: msg.contextId || msg.threadId, parentId: msg.messageId || msg.id, at: Date.now() });   // §13.8 A2A 요청 기억(응답 페어링용)
      } else {
        const rp = _a2aPending.get(conn.meta.agentId);            // §13.8 reply-window fallback: 최근 A2A 요청을 받았으면 board 응답을 원 요청자에게 A2A 로 페어링(응답 adapter 가 envelope echo 못할 때)
        if (rp && Date.now() - rp.at < A2A_WINDOW && !wsIsTelemetry(msg) && !(msg.type === 'CUSTOM' && msg.name === 'ConnectionRestored')) {
          // v2.4.138 — 빈 수신자를 채우는 순간은 **한 번은 말해요.** 조용히 채우면 「응답을 짝지음」과
          //   「남의 계측을 부침」이 완전히 같은 모양이라, 분류에서 빠진 상시 스트림이 상대 세션을
          //   깨우는 동안에도 이쪽엔 아무 신호가 없어요(실측: 그렇게 165건이 나갔어요).
          if (msg.targetAgentId == null) {
            const _k = conn.meta.agentId + '|' + (msg.name || msg.type) + '|' + rp.from;
            if (!_telFillWarn.has(_k)) {
              _telFillWarn.add(_k);
              console.warn('[ws] 응답창 되돌림 — 무대상 %s(from=%s)의 수신자를 %s 로 채웠어요. 관측용 프레임이면 발신 길목에서 telemetry:true 를 찍으세요 (frame-class.cjs).', msg.name || msg.type, conn.meta.agentId, rp.from);
            }
            msg.targetAgentId = rp.from;
          }
          if (msg.contextId == null && rp.contextId) msg.contextId = rp.contextId;
          if (msg.parentId == null && rp.parentId) msg.parentId = rp.parentId;
          const d = wsAgents.get(rp.from); if (d && d.alive && d !== conn) d.send(msg);   // 원 요청자에게도 A2A relay
          if (msg.type === 'RUN_FINISHED') _a2aPending.delete(conn.meta.agentId);          // 응답 완료 → 페어링 종료
        } else if (msg && !wsIsTelemetry(msg) && (
          (msg.type === 'CUSTOM' && msg.name !== 'ConnectionRestored')                                  // 대상 미지정 CUSTOM(핸드오프 등) → 메인 우선. watcher telemetry 는 board broadcast 만.
          || (_WS_TEXT_FRAMES.has(msg.type) && _WS_EXTERNAL_ROLES.has(wsAgentRole(conn)))                // §13.13.3 대상 미지정 텍스트 — 외부 당사자(collab/peer/upstream)만. local 미러는 제외(false-wake)
        )) { const p = wsPrimaryAgent(); if (p && p !== conn && p.alive) p.send(msg); }
      }
      if (msg && msg.type === 'CUSTOM' && (msg.name === 'TerminalData' || msg.name === 'TerminalExit')) {   // Pantty §9 세션 스코핑 — relay 바이트는 «연 운영자» 에게만. 방송하면 다른 board 도 셸 출력을 받아요(렌더 안 해도 수신 = 유출).
        const owner = msg.value && wsPtySessions.get(msg.value.sessionId);
        if (owner && owner.alive) owner.send(msg);
        if (msg.name === 'TerminalExit' && msg.value) wsPtySessions.delete(msg.value.sessionId);
        return;                                                  // wsToBoards/wsRecord/push 건너뜀 — 스코핑 + 이력 미저장
      }
      wsToBoards(msg);                                           // 모니터링: 항상 board 로 broadcast (A2A 도 대시보드가 관찰) — 선언 이벤트의 라이브 갱신 경로도 여기
      wsRecord(msg);                                             // 대화 기록 영속
      if (!(msg && msg.type === 'CUSTOM' && WS_CORP_DECL.has(msg.name))) { try { push.maybePush(msg); } catch {} }   // #3b webpush — 의미있는 A2A(noise 제외)면 구독자에게 tickle (탭 닫혀도 도달). v2.4.90: §13.33 선언 2종은 기계 소비 전용이라 사람 알림 가치 0 → 제외
      return;
    }
    // 오케스트레이션 (board/사용자발 SetMain·RegisterUpstreamKey 등)
    if (wsHandleOrch(conn, msg)) return;
    // v2.4.90 §13.33.4 — board 표면발 조직 선언도 같은 게이트(운영자 authz). 미달이면 relay·다른 board·기록 전에 drop + 로그.
    if (msg && msg.type === 'CUSTOM' && WS_CORP_DECL.has(msg.name) && !wsCorpDeclAuthz(conn, msg)) return;
    // §13.30 room lifecycle + room 메시지 (board/사용자 측 — human soft-yield 경로)
    if (msg && msg.type === 'CUSTOM' && ['RoomCreate', 'RoomJoin', 'RoomLeave', 'RoomClose', 'RequestRoomArtifacts', 'RoomArtifactsUpdate'].includes(msg.name)) { if (wsRoomOp(conn, msg)) return; }
    if (msg && msg.type === 'CUSTOM' && msg.roomId) { wsRoomMessage(conn, msg); return; }
    // ✕ 닫기 → 해당 채널 기록 삭제 + 모든 board 갱신
    if (msg && msg.type === 'CUSTOM' && msg.name === 'CloseChannel') { wsCloseChannelHist(msg.value && msg.value.agentId); wsToBoards(msg); return; }
    if (msg && msg.type === 'CUSTOM' && msg.name === 'DeleteChannelHistory') { wsCloseChannelHist(msg.value && msg.value.agentId); wsToBoards(msg); return; }   // 🗑 영구삭제 — history 파일 제거(persist) + 다른 board 동기 (EstreUF parity)
    // C(lazy): 탭 클릭·세션 복원 시 채널 내용 on-demand 요청 → 해당 채널 events 응답
    // v2.4.129 — `beforeTs` 를 실으면 그 시각 **이전** 구간을 최근순으로 limit 건 돌려줘요(이어받기).
    //   안 실으면 종전대로 전량 — cold 채널 복원 경로가 그걸 쓰고 있어서 계약을 안 바꿔요.
    //   `more` 는 «더 있다» 를 명시해요: 빈 배열과 «여기서 끝» 이 같은 모양이면 클라가 영원히 더 물어요.
    if (msg && msg.type === 'CUSTOM' && msg.name === 'RequestChannelHistory') {
      const ck = String((msg.value && msg.value.channelKey) || '');
      const all = wsLoadChannel(ck);
      const beforeTs = Number((msg.value && msg.value.beforeTs) || 0);
      if (!beforeTs) { conn.send(wscore.event('CUSTOM', { name: 'ChannelHistory', value: { channelKey: ck, events: all } })); return; }
      const limit = Math.min(Math.max(Number((msg.value && msg.value.limit) || HISTORY_INITIAL_PER_CHAN), 1), 1000);
      const older = all.filter((e) => (e.timestamp || 0) < beforeTs);
      const slice = older.slice(-limit);
      conn.send(wscore.event('CUSTOM', { name: 'ChannelHistory', value: {
        channelKey: ck, events: slice, prepend: true,
        more: older.length > slice.length, remaining: older.length - slice.length,
        oldestSentTs: slice.length ? (slice[0].timestamp || 0) : 0,
      } }));
      return;
    }
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
    // v2.4.77 — target-less SelectionAnswer/Cancel 은 pending(또는 tombstone) issuer 로 라우팅
    // (§13.16.12, 어댑터 리뷰 지적: 이전엔 wsPrimaryAgent() 로 흘러 비-main 발신자의 선택지 답 미도달).
    // msgId 스탬프 = §13.13.2 at-least-once — 턴-기반 발신자도 확실히 기상.
    if (msg && msg.type === 'CUSTOM' && (msg.name === 'SelectionAnswer' || msg.name === 'SelectionCancel') && !msg.targetAgentId && msg.value && msg.value.promptId) {
      const _pid = String(msg.value.promptId);
      const _iss = (wsSelPend.get(_pid) || {}).agentId || wsSelDone.get(_pid);
      if (_iss) { msg.targetAgentId = _iss; if (!msg.msgId) msg.msgId = 'sel-ans-' + _pid + '-' + Date.now(); }
    }
    // 대시보드/사용자 inbound → targetAgentId 라우팅 (없으면 에이전트 1개일 때 그쪽)
    const target = msg && msg.targetAgentId;
    const dst = target ? wsAgents.get(target) : wsPrimaryAgent();   // 대상 미지정 → 메인 에이전트 우선
    if (dst && dst.alive) dst.send(msg);
    if (msg && msg.type === 'CUSTOM' && msg.value && msg.value.sessionId && (msg.name === 'PtyOpen' || msg.name === 'PtyData' || msg.name === 'PtyResize' || msg.name === 'PtyClose')) {   // Pantty §9 — Pty* 는 연 운영자→pty-host 전용: 소유 기록, 다른 board·이력 제외(셸 키스트로크는 사적)
      if (msg.name === 'PtyOpen') wsPtySessions.set(msg.value.sessionId, conn);
      else if (msg.name === 'PtyClose') wsPtySessions.delete(msg.value.sessionId);
      return;
    }
    if (msg && msg.type === 'CUSTOM' && (msg.name === 'SelectionAnswer' || msg.name === 'SelectionCancel') && msg.targetAgentId && msg.msgId) _relayPendingAdd(msg.targetAgentId, msg);   // v2.4.77 at-least-once — 브릿지 delivered-persist ack 가 clear
    for (const c of wsConns) if (c !== conn && c.meta.role !== 'agent' && c.alive) c.send(msg);   // 다른 board 에도 표시(멀티 board·외부 발신 입력 동기) — 보낸 board 는 로컬 표시라 제외
    wsRecord(msg);                                               // 사용자 입력도 기록 영속
  };
});

// v2.4.11 보안: 기본 바인드 = loopback(127.0.0.1). board(대시보드) 연결은 인증 없이 키 발급·SetMain 을
// 할 수 있는 trusted-operator 전제라, 네트워크 노출은 명시 opt-in 이어야 함 (secure-by-default).
// LAN/원격 노출이 필요하면 WS_BIND=0.0.0.0 (또는 특정 인터페이스 IP) 를 명시 주입 + 그땐 token 게이트 권장.
// (WS_BIND/_isLoopback 정의는 상단 config 블록으로 이동 — #5a access-gating 이 모듈 로드시 노출 판정을 사용.)
keyEnsureRefs();    // v2.4.103 §13.25.12 — 기존 키에 관리 핸들 소급 부여 (멱등)
keyAdoptLegacy();   // v2.4.87 — 기동 시 레거시-only 키를 keyStore 로 입양 (멱등: 이미 있으면 무동작)
server.listen(PORT, WS_BIND, () => {
  console.log(`Constellation live dashboard → http://localhost:${PORT}/  (state: ${STATE})  [WS: /ws]  [bind: ${WS_BIND}]`);
  console.log(`[server] WS_PRIMARY_ID=${WS_PRIMARY_ID}  (메인 role 로 분류될 agentId — WS_PRIMARY_AGENT env 로 주입)`);
  if (!_isLoopback) {   // v2.4.11 — 비-loopback 바인드는 board 표면(키관리·SetMain)을 네트워크에 노출. 운영자 인지 필수.
    // v2.4.87 §13.25.9 — board 연결의 키관리/SetMain 은 이제 ui allowlist 로 게이트된다. 단 allowlist 미설정(=전체 허용)이면
    // 종전과 동일하게 열린 상태이므로, 그 조합만 별도로 경고한다 (fail-open 유지 + 닫는 방법 명시).
    if (Array.isArray(accessCfg.ui.allowlist) && accessCfg.ui.allowlist.length) {
      console.log(`[server] §13.25.9 운영자 authz — board 연결의 키관리·SetMain 은 ui allowlist(${accessCfg.ui.allowlist.length} 항목) + loopback 만 허용됩니다.`);
    } else {
      console.warn(`[server] ⚠⚠ WS_BIND=${WS_BIND} (비-loopback) + ui allowlist 미설정 — 도달 가능한 누구나 board 연결로 키 발급/조회/폐기·SetMain 이 가능합니다. access.json 의 ui.allowlist 에 운영자 IP/대역을 넣으면 §13.25.9 게이트가 닫힙니다. (기본값은 127.0.0.1 — 노출은 의도적 opt-in.)`);
    }
    const _f = (al) => Array.isArray(al) ? al.length + ' IPs' : 'all';   // #5a-3 노출 시 표면별 접근 정책 1줄 표시
    console.log(`[server] #5a access — ui:${_f(accessCfg.ui.allowlist)} · agent:${_f(accessCfg.agent.allowlist)}(requireKey:${accessCfg.agent.requireKey}) · mcp:${_f(accessCfg.mcp.allowlist)}  (access.json — 비우면 전체 허용)`);
  }
  if (WS_PRIMARY_ID === 'main-agent') {   // generic default — 다운스트림은 자기 환경 메인 agentId 를 WS_PRIMARY_AGENT 로 주입해야 그 세션이 main 으로 분류됨 (미설정 시 모든 비-키 에이전트가 local). 재기동 시 env 누락 주의.
    console.warn(`[server] ⚠ WS_PRIMARY_AGENT 미설정 — WS_PRIMARY_ID 가 generic default 'main-agent' 입니다. 메인 세션의 agentId 와 다르면 그 세션이 local 로 분류돼요. 기동/재기동 시 WS_PRIMARY_AGENT=<main agentId> 주입 권장 (SetMain 핸드오프로도 전환 가능).`);
  }
});
