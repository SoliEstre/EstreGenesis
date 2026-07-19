/**
 * Constellation Web Push (#3b tier-2) — deps-0 VAPID tickle 발송 모듈.
 *
 * 설계 (의존성-zero: node 내장 crypto/https 만, web-push 라이브러리 불요):
 *  - VAPID 키쌍: node crypto P-256(prime256v1) 자체 생성, .vapid.json(gitignore)에 private JWK 영속.
 *    applicationServerKey = uncompressed EC point(0x04||X||Y, 65B) b64url.
 *  - 서명: ES256(ECDSA P-256 + SHA-256), JWS raw r||s 64B = crypto.sign(..., {dsaEncoding:'ieee-p1363'}).
 *  - 발송: tickle(페이로드 없는 VAPID 푸시) — RFC8291 페이로드 암호화를 회피해 서버 의존성 0.
 *    SW 가 push 이벤트 때 GET /api/push/latest 로 본문 fetch → showNotification.
 *  - 트리거: server.cjs wsToBoards 통과 의미있는 A2A CUSTOM(noise blocklist 제외) → pushAll.
 *  - 만료 구독(404/410) 자동 정리.
 */
'use strict';
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

let _dir = __dirname;
let _vapidFile = '';
let _subsFile = '';
let _jwk = null;             // private JWK {kty,crv,x,y,d}
let _appKey = '';            // applicationServerKey b64url (파생 캐시)
let _subject = 'mailto:admin@constellation.local';   // VAPID 'sub' claim (init 로 덮어쓰기 가능)
const _subs = new Map();     // endpoint → PushSubscription JSON
let _latest = { title: 'Constellation', body: '', at: 0, name: '' };

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBuf(s) {
  let t = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return Buffer.from(t, 'base64');
}

function _deriveAppKey(jwk) {
  const x = b64urlToBuf(jwk.x), y = b64urlToBuf(jwk.y);
  return b64url(Buffer.concat([Buffer.from([4]), x, y]));   // 0x04 || X(32) || Y(32) = 65B
}

function _loadOrGenVapid() {
  try {
    const j = JSON.parse(fs.readFileSync(_vapidFile, 'utf8'));
    if (j && j.privateJwk && j.privateJwk.d) { _jwk = j.privateJwk; _appKey = _deriveAppKey(_jwk); return; }
  } catch {}
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  _jwk = privateKey.export({ format: 'jwk' });   // {kty:'EC',crv:'P-256',x,y,d}
  _appKey = _deriveAppKey(_jwk);
  try { fs.writeFileSync(_vapidFile, JSON.stringify({ privateJwk: _jwk, publicKey: _appKey, createdAt: new Date().toISOString() }, null, 2) + '\n'); } catch (e) { console.warn('[push] .vapid.json 저장 실패:', e.message); }
  console.log('[push] VAPID 키쌍 신규 생성 → %s (publicKey %s…)', path.basename(_vapidFile), _appKey.slice(0, 16));
}

function _loadSubs() {
  try {
    const arr = JSON.parse(fs.readFileSync(_subsFile, 'utf8'));
    if (Array.isArray(arr)) for (const s of arr) if (s && s.endpoint) _subs.set(s.endpoint, s);
  } catch {}
}
function _saveSubs() {
  try { fs.writeFileSync(_subsFile, JSON.stringify([..._subs.values()], null, 2) + '\n'); }
  catch (e) { console.warn('[push] subs 저장 실패:', e.message); }
}

function init(dir, opts) {
  _dir = dir || __dirname;
  _vapidFile = (opts && opts.vapidFile) || path.join(_dir, '.vapid.json');
  _subsFile = (opts && opts.subsFile) || path.join(_dir, '.push-subs.json');
  if (opts && opts.subject) _subject = opts.subject;
  _loadOrGenVapid();
  _loadSubs();
  console.log('[push] #3b webpush init — subs=%d, publicKey=%s…', _subs.size, _appKey.slice(0, 16));
  return { publicKey: _appKey, subs: _subs.size };
}

function publicKey() { return _appKey; }
function latest() { return _latest; }
function count() { return _subs.size; }

function subscribe(sub) {
  if (!sub || !sub.endpoint) return { ok: false, error: 'no endpoint' };
  _subs.set(sub.endpoint, sub);
  _saveSubs();
  return { ok: true, count: _subs.size, vapidPublicKey: _appKey };
}
function unsubscribe(endpoint) {
  const removed = _subs.delete(endpoint);
  if (removed) _saveSubs();
  return { ok: true, removed, count: _subs.size };
}

// ES256 VAPID JWT (aud = push endpoint origin). origin 별 캐시는 호출부에서.
function _signVapid(audience) {
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;   // ≤24h (RFC8292)
  const payload = b64url(JSON.stringify({ aud: audience, exp, sub: _subject }));
  const signingInput = header + '.' + payload;
  const key = crypto.createPrivateKey({ key: _jwk, format: 'jwk' });
  const sig = crypto.sign('SHA256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
  return signingInput + '.' + b64url(sig);
}

function _sendTickle(endpoint, jwt) {
  return new Promise((resolve) => {
    let u; try { u = new URL(endpoint); } catch { return resolve({ status: 0, gone: true }); }
    const opts = {
      method: 'POST', hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      headers: { TTL: '86400', Urgency: 'normal', Authorization: `vapid t=${jwt}, k=${_appKey}`, 'Content-Length': 0 },
    };
    const req = https.request(opts, (res) => { res.resume(); resolve({ status: res.statusCode, gone: res.statusCode === 404 || res.statusCode === 410 }); });
    req.on('error', () => resolve({ status: 0, gone: false }));
    req.setTimeout(8000, () => { try { req.destroy(); } catch {} resolve({ status: 0, gone: false }); });
    req.end();
  });
}

async function pushAll(p) {
  _latest = { title: (p && p.title) || 'Constellation', body: (p && p.body) || '', at: Date.now(), name: (p && p.name) || '' };
  if (!_subs.size || !_jwk) return { sent: 0, dead: 0 };
  const jwtByOrigin = new Map();
  const dead = [];
  let sent = 0;
  for (const sub of [..._subs.values()]) {
    let u; try { u = new URL(sub.endpoint); } catch { dead.push(sub.endpoint); continue; }
    const origin = `${u.protocol}//${u.host}`;
    let jwt = jwtByOrigin.get(origin);
    if (!jwt) { try { jwt = _signVapid(origin); } catch (e) { console.warn('[push] VAPID 서명 실패:', e.message); break; } jwtByOrigin.set(origin, jwt); }
    const r = await _sendTickle(sub.endpoint, jwt);
    if (r.gone) dead.push(sub.endpoint); else if (r.status >= 200 && r.status < 300) sent++;
  }
  for (const ep of dead) _subs.delete(ep);
  if (dead.length) _saveSubs();
  return { sent, dead: dead.length };
}

// wsToBoards 통과 메시지 중 push 대상 판정 — 제어/transient/ack/run·stream 제외, 의미있는 A2A intent 만.
const NOISE = new Set([
  'Heartbeat', 'PersistentAdapterSmoke', 'Typing', 'AgentList', 'ServerNotice', 'Ack', 'AckProcessed',
  'OnboardAck', 'MainChanged', 'KeyRevoked', 'KeyRevokePending', 'KeyRevokeRequest', 'CollabKeyIssued',
  'RegisterCollabKey', 'RegisterUpstreamKey', 'RevokeUpstreamKey', 'SetMain', 'HandoffReady', 'DeadlockProbe',
  'ConnectionRestored', 'CloseChannel', 'DeleteChannelHistory', 'RequestChannelHistory', 'ChannelHistory',
  'ArchiveChannel', 'History', 'KeyRevokePending',
  'EchoModeState', 'WorkflowStatus', 'SubagentStatus',   // v2.4.64 — 활동 모니터/에코 스냅샷 (15s 하트비트급 — PWA 알림 과빈발 사용자 보고로 제외)
  'CommandManifest', 'OpsState',   // v2.4.71 — 선언-갱신 이벤트 (변경-트리거·기계 소비 전용 — 사람 알림 가치 0)
]);

function maybePush(msg) {
  if (!_subs.size) return;                              // 구독 0 → 발송 안 함
  if (!msg || msg.type !== 'CUSTOM') return;            // 의미있는 A2A intent(CUSTOM)만 — RUN/STEP/TEXT delta/TOOL 스트림 제외
  const name = msg.name || '';
  if (!name || NOISE.has(name)) return;
  const v = (msg.value && typeof msg.value === 'object') ? msg.value : {};
  const who = msg.agentName || msg.agentId || msg.source || 'agent';
  const title = `${who} · ${name}`;
  const bodyRaw = v.re || v.summary || v.text || v.title || v.context || msg.text || name;
  const body = String(bodyRaw || '').slice(0, 140);
  pushAll({ title, body, name: who }).catch(() => {});
}

module.exports = { init, publicKey, latest, count, subscribe, unsubscribe, pushAll, maybePush };
