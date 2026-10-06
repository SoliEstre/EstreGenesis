#!/usr/bin/env node
'use strict';
// cli.cjs — 보드 «호스트 안» 에서 도는 업링크 관리 도구 (node uplink/cli.cjs <명령> ...).
//
//   pair --relay <origin> --code XXXX-XXXX [--name <보드 이름>] [--dashboard-url <url>] [--dev]
//   keys [--json]                      중계가 «제안» 하는 키 ↔ 로컬 등록부 비교 (읽기 전용 — 아무것도 쓰지 않아요)
//   enroll [--pending] [--credential <id>|--device <id>]   서명된 명령이 대기열에 올린 키 · 중계가 제안한 키를 사람이 확인하고 등록부에 넣기
//   totp-init --acct <이름> [--force]  TOTP 비밀 생성 · 확인 코드 1회 · 등록부에 기록 · 상태 파일 초기화
//   revoke --credential <id> | --device <id> | --totp
//   audit [--tail N]                   uplink-audit.jsonl 을 표로 (읽기 전용)
//   status                             업링크 설정·등록 현황 (비밀은 안 찍어요)
//   공통: --dir <런타임 폴더>  (기본: 이 파일의 «한 단계 위» = server.cjs 가 있는 폴더)
//   종료 코드: 0 정상 · 1 거절/중단 · 2 사용법 오류
//
// **신뢰의 닻은 «보드 자신의 터미널 앞에 앉은 사람» 이에요.** 이 도구가 하는 모든 «등록» 은 사람이 화면의 지문을 보고 y 를 친 뒤에만 파일에 써져요. 중계는 «제안» 만 할 수 있어요 —
//   제안은 등록이 아니고(keys 는 쓰지 않아요), 중계가 응답에 실어 보낸 «지문 문자열» 이나 «rp 설정» 은 어디에서도 읽지 않아요: 지문은 받은 키 «바이트» 에서 여기서 다시 계산하고,
//   rp.id · origin 은 사람이 친 --relay 에서 «로컬로» 유도해요. (중계가 응답에 rp 를 실어 와도 무시해요 — 로컬이 정본이라는 config.cjs 의 약속이에요.)
//
// **페어링의 정직한 한계(TOFU).** 화면의 지문 대조가 막아 주는 건 «나중에 추가되는 키» 예요. 페어링 «그 순간» 에는 이 화면의 값과 폰이 보여 줄 값이 둘 다 중계에서 오므로, 중계가 처음부터 악의적이면
//   양쪽에 «서로 맞는» 값을 보여 줄 수 있어요(처음 본 키를 믿는 방식 = trust on first use). 그래서 이 도구는 이 점을 화면에 그대로 말하고, https 로 «사람이 직접 친 주소» 에만 붙어요.
//
// **쓰기 순서가 곧 안전이에요.** 활성화 스위치는 uplink.json 이에요(서버는 이 파일이 있을 때만 업링크를 켜요). 그래서 키 파일 → 토큰 → uplink.json «마지막» 순서로 원자적으로 써요 —
//   중간에 죽어도 보드는 «꺼진 채» 지 «반쯤 설정된 채» 가 아니에요. 사람이 거절하면 «아무 파일도» 만들지 않아요(임시 파일까지). 서버는 uplink.json 을 «기동 때만» 읽어요.
//
// **비밀은 안 찍어요.** 토큰 · 보드 개인키는 어떤 출력에도 없어요. 단 하나의 예외는 totp-init 이 «한 번» 보여 주는 TOTP 비밀이에요(인증 앱에 넣는 것이 그 명령의 목적이에요).

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const CONFIG = require('./config.cjs');
const OP = require('./opcmd.cjs');
const TOTP = require('./totp.cjs');
const { KeyReader } = require('./items.cjs');
const { VERBS, ACCT_RE } = require('./exec.cjs');
const { UPLINK_VERSION } = require('./uplink.cjs');
const KS = require('./keyset.cjs');

const BOARD_ID_RE = /^[\x21-\x7e]{1,128}$/;
const TOKEN_RE = /^[\x21-\x7e]{8,512}$/;
const CODE_RE = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/;
const HOST_RE = /^[A-Za-z0-9.-]{1,253}$/;
const MAX_RESP = 1024 * 1024;
const REQ_TIMEOUT_MS = 15000;
const ALG_NAME = { '-7': 'ES256', '-8': 'EdDSA', '-257': 'RS256' };
const TOTP_ISSUER = 'Constellation board';

const E = { OK: 0, REFUSED: 1, USAGE: 2 };
const say = (s) => process.stdout.write(String(s) + '\n');
const warn = (s) => process.stderr.write(String(s) + '\n');
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const printable = (s) => String(s).replace(/[^\x20-\x7e]/g, '?').slice(0, 120);   // 오류 메시지 속 «남이 준 글» 은 터미널에 안전한 ASCII 로만

// ── 입력: 줄 단위 (TTY 든 파이프든 같은 길 — 시험이 stdin 을 파이프로 먹여요) ───────────────────────────────
class Lines {
  constructor(stream) { this.stream = stream; this.q = []; this.waiter = null; this.ended = false; this.buf = ''; this.attached = false; }
  _wake() { if (this.waiter) { const w = this.waiter; this.waiter = null; w(); } }
  _attach() {
    if (this.attached) return;
    this.attached = true;
    this.stream.setEncoding('utf8');
    this.stream.on('data', (d) => {
      this.buf += d;
      let i;
      while ((i = this.buf.indexOf('\n')) >= 0) { this.q.push(this.buf.slice(0, i).replace(/\r$/, '')); this.buf = this.buf.slice(i + 1); }
      this._wake();
    });
    this.stream.on('end', () => { if (this.buf) { this.q.push(this.buf.replace(/\r$/, '')); this.buf = ''; } this.ended = true; this._wake(); });
    this.stream.on('error', () => { this.ended = true; this._wake(); });
  }
  async next() {
    this._attach();
    for (;;) {
      if (this.q.length) return this.q.shift();
      if (this.ended) return null;
      await new Promise((r) => { this.waiter = r; });
    }
  }
  close() {
    if (!this.attached) return;
    try { this.stream.removeAllListeners('data'); this.stream.pause(); } catch (_) { /* noop */ }
    try { if (typeof this.stream.unref === 'function') this.stream.unref(); } catch (_) { /* noop */ }
  }
}
const stdin = new Lines(process.stdin);

// y/N — «기본은 아니오». 입력이 끝났거나(EOF) 다른 글이면 아니오예요.
async function askYes(question) {
  process.stdout.write(question + ' [y/N] ');
  const line = await stdin.next();
  if (line === null) { say(''); say('(입력이 없어요 — 아니오로 처리해요)'); return false; }
  if (!process.stdin.isTTY) say(line);      // 파이프 입력은 화면에 에코가 없어서 «무슨 답을 받았는지» 를 남겨요
  return /^y(es)?$/i.test(line.trim());
}
async function askLine(question) {
  process.stdout.write(question + ' ');
  const line = await stdin.next();
  if (line === null) { say(''); return null; }
  if (!process.stdin.isTTY) say('(입력 받음)');      // 코드는 에코하지 않아요
  return line.trim();
}

// ── 인자 ─────────────────────────────────────────────────────────────────────────────────────────────────
// spec = {value:[이름…], bool:[이름…]} — 모르는 옵션 · 값 없는 옵션 · 남는 인자는 사용법 오류예요(조용히 무시하면 오타가 «기본값으로 도는» 일이 돼요).
function parseArgs(args, spec) {
  const o = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (typeof a !== 'string' || !a.startsWith('--')) return { error: '모르는 인자 «' + printable(a) + '»' };
    const name = a.slice(2);
    if (spec.bool.includes(name)) { o[name] = true; continue; }
    if (spec.value.includes(name)) {
      const v = args[i + 1];
      if (v === undefined || v.startsWith('--')) return { error: '--' + name + ' 에 값이 필요해요' };
      o[name] = v; i++; continue;
    }
    return { error: '모르는 옵션 --' + printable(name) };
  }
  return { o };
}
const usageError = (msg) => { warn('사용법 오류: ' + msg); warn('도움말: node uplink/cli.cjs help'); return E.USAGE; };

function resolveDir(o) {
  const d = path.resolve(o.dir || path.join(__dirname, '..'));
  try { if (!fs.statSync(d).isDirectory()) return null; } catch (_) { return null; }
  return d;
}

// ── 중계 호출 ────────────────────────────────────────────────────────────────────────────────────────────
// 리다이렉트는 «따라가지 않아요»(토큰이 다른 곳으로 가는 길) · 응답 크기 상한 · 시간 상한. 응답 본문은 오류에도 안 찍어요(상태 번호만) — 남이 준 글이 터미널로 오지 않게요.
function relayCall(method, url, opt) {
  return new Promise((resolve) => {
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    let u;
    try { u = new URL(url); } catch (_) { return fin({ ok: false, why: '주소를 읽을 수 없어요' }); }
    const mod = u.protocol === 'https:' ? https : http;
    const body = opt && opt.body !== undefined ? Buffer.from(JSON.stringify(opt.body), 'utf8') : null;
    const headers = { Accept: 'application/json', 'User-Agent': 'eg-uplink-cli/' + UPLINK_VERSION };
    if (opt && opt.token) headers.Authorization = 'Bearer ' + opt.token;      // 토큰은 헤더로만 — URL 에 안 넣어요
    if (body) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = body.length; }
    let req;
    try {
      req = mod.request(u, { method, headers, timeout: REQ_TIMEOUT_MS }, (res) => {
        const chunks = []; let n = 0; let over = false;
        res.on('data', (d) => { n += d.length; if (n > MAX_RESP) { over = true; res.destroy(); } else chunks.push(d); });
        res.on('error', () => fin({ ok: false, why: '응답을 끝까지 받지 못했어요' }));
        res.on('close', () => {
          if (over) return fin({ ok: false, why: '응답이 너무 커요' });
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400) return fin({ ok: false, status, why: '리다이렉트(HTTP ' + status + ') — 따라가지 않아요' });
          let json = null;
          try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (_) { json = null; }
          if (status < 200 || status >= 300) return fin({ ok: false, status, why: '중계가 거절했어요 (HTTP ' + status + ')' });
          fin({ ok: true, status, json });
        });
      });
    } catch (_) { return fin({ ok: false, why: '요청을 만들 수 없어요' }); }
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (e) => fin({ ok: false, why: '중계에 닿지 못했어요 (' + printable((e && (e.code || e.message)) || 'error') + ')' }));
    if (body) req.write(body);
    req.end();
  });
}

// ── 응답 검증 (엄격 — 모양이 어긋나면 «전부 버리고» 아무것도 안 써요) ─────────────────────────────────────────
function validateProposals(j) {
  const creds = []; const devs = [];
  if (!Array.isArray(j.proposedCredentials) || j.proposedCredentials.length > KS.MAX_CREDENTIALS) return { ok: false, why: 'proposedCredentials 는 ' + KS.MAX_CREDENTIALS + '개 이하의 배열이어야 해요' };
  if (!Array.isArray(j.proposedDevices) || j.proposedDevices.length > KS.MAX_DEVICES) return { ok: false, why: 'proposedDevices 는 ' + KS.MAX_DEVICES + '개 이하의 배열이어야 해요' };
  const seenC = new Set(); const seenD = new Set();
  for (const p of j.proposedCredentials) {
    const c = KS.normalizeCredential(p);
    if (!c.ok) return { ok: false, why: '제안된 자격증명 하나가 규격이 아니에요: ' + c.why };
    if (seenC.has(c.credentialId)) return { ok: false, why: '제안된 자격증명 id 가 겹쳐요' };
    seenC.add(c.credentialId);
    creds.push(c);
  }
  for (const p of j.proposedDevices) {
    const d = KS.normalizeDevice(p);
    if (!d.ok) return { ok: false, why: '제안된 기기 하나가 규격이 아니에요: ' + d.why };
    if (seenD.has(d.deviceId)) return { ok: false, why: '제안된 기기 id 가 겹쳐요' };
    seenD.add(d.deviceId);
    devs.push(d);
  }
  return { ok: true, credentials: creds, devices: devs };
}

function validatePairResponse(j) {
  if (!isPlain(j)) return { ok: false, why: '응답이 객체가 아니에요' };
  // 응답에 rp(또는 origin · 지문 문자열 따위)가 있어도 읽지 않아요 — 신뢰 설정은 로컬 유도값이 정본이에요.
  if (typeof j.boardId !== 'string' || !BOARD_ID_RE.test(j.boardId)) return { ok: false, why: 'boardId 가 규격이 아니에요' };
  if (typeof j.uplinkToken !== 'string' || !TOKEN_RE.test(j.uplinkToken)) return { ok: false, why: 'uplinkToken 이 규격이 아니에요' };
  if (typeof j.accountId !== 'string' || !ACCT_RE.test(j.accountId)) return { ok: false, why: 'accountId 가 규격이 아니에요' };
  if (!KS.cleanText(j.accountName, 1, 128)) return { ok: false, why: 'accountName 이 규격이 아니에요' };
  if (typeof j.serverTime !== 'number' || !Number.isFinite(j.serverTime) || j.serverTime < 0) return { ok: false, why: 'serverTime 이 규격이 아니에요' };
  const p = validateProposals(j);
  if (!p.ok) return p;
  return { ok: true, boardId: j.boardId, token: j.uplinkToken, accountId: j.accountId, accountName: j.accountName, credentials: p.credentials, devices: p.devices };
}

// ── 설정·키 읽기 ─────────────────────────────────────────────────────────────────────────────────────────
function loadConfig(dir) {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(path.join(dir, 'uplink.json'), 'utf8')); } catch (_) { return { ok: false, why: 'uplink.json 이 없거나 읽을 수 없어요 — 아직 페어링 전이에요 (pair)' }; }
  const v = CONFIG.validate(raw, { dir });
  if (!v.ok) return { ok: false, why: 'uplink.json 이 규격이 아니에요: ' + v.error };
  return { ok: true, cfg: v.cfg, raw };
}
function readToken(cfg) {
  try {
    const t = fs.readFileSync(cfg.tokenFile, 'utf8').trim();
    return TOKEN_RE.test(t) ? t : null;
  } catch (_) { return null; }
}
const readKeys = (cfg) => new KeyReader(cfg.keysFile, (m) => warn(m)).read();
function readKeysRaw(cfg) {
  try { const j = JSON.parse(fs.readFileSync(cfg.keysFile, 'utf8')); return isPlain(j) ? j : null; } catch (_) { return null; }
}

// 중계가 지금 «제안» 하는 키 — pair 응답과 같은 칸({proposedCredentials, proposedDevices})을 같은 검증으로 받아요. accountId 는 enroll 이 «이 키들이 어느 계정 소속인가» 로 써요.
async function fetchProposals(cfg) {
  const token = readToken(cfg);
  if (!token) return { ok: false, why: '토큰 파일을 읽을 수 없거나 규격이 아니에요' };
  const r = await relayCall('GET', cfg.relay + '/v1/uplink/keys', { token });
  if (!r.ok) return { ok: false, why: r.why };
  if (!isPlain(r.json)) return { ok: false, why: '중계 응답이 객체가 아니에요' };
  const v = validateProposals(r.json);
  if (!v.ok) return v;
  let accountId = null;
  if (r.json.accountId !== undefined) {
    if (typeof r.json.accountId !== 'string' || !ACCT_RE.test(r.json.accountId)) return { ok: false, why: 'accountId 가 규격이 아니에요' };
    accountId = r.json.accountId;
  }
  return { ok: true, credentials: v.credentials, devices: v.devices, accountId };
}

// 로컬 등록부의 자격증명 정준 SPKI(b64url) · 지문 — 제안과 «같은 식» 으로 계산해서 비교해요.
function localCredView(c) {
  let spki = null; let fp = null;
  try {
    const key = crypto.createPublicKey({ key: Buffer.from(c.publicKey), format: 'der', type: 'spki' });
    const der = KS.canonSpki(key);
    spki = der.toString('base64url'); fp = KS.keyFingerprint(der);
  } catch (_) { /* 읽을 수 없는 항목은 지문 없이 */ }
  return { credentialId: c.credentialId, alg: c.alg, acct: c.acct, spki, fp };
}

// 제안 ↔ 로컬. 같은 id 인데 «키가 다른» 것은 따로 «불일치» 로 잡아요 — id 만 대조하면 중계가 등록된 id 에 다른 키를 얹어 보내도 «이미 있음» 으로 지나가요.
function computeDiff(local, prop) {
  const lc = new Map(local.credentials.map((c) => [c.credentialId, localCredView(c)]));
  const ld = new Map(local.devices.map((d) => [d.deviceId, d]));
  const pc = new Map(prop.credentials.map((c) => [c.credentialId, c]));
  const pd = new Map(prop.devices.map((d) => [d.deviceId, d]));
  const diff = {
    proposedNotEnrolled: { credentials: [], devices: [] },
    enrolledNotProposed: { credentials: [], devices: [] },
    mismatched: { credentials: [], devices: [] },
    matching: { credentials: 0, devices: 0 },
  };
  for (const c of prop.credentials) {
    const l = lc.get(c.credentialId);
    if (!l) diff.proposedNotEnrolled.credentials.push(c);
    else if (l.spki !== c.spki || l.alg !== c.alg) diff.mismatched.credentials.push({ credentialId: c.credentialId, name: c.name, proposedFp: c.fp, enrolledFp: l.fp });
    else diff.matching.credentials++;
  }
  for (const [id, l] of lc) if (!pc.has(id)) diff.enrolledNotProposed.credentials.push({ credentialId: id, alg: l.alg, acct: l.acct, fp: l.fp });
  for (const d of prop.devices) {
    const l = ld.get(d.deviceId);
    if (!l) diff.proposedNotEnrolled.devices.push(d);
    else if (l.kid !== d.kid) diff.mismatched.devices.push({ deviceId: d.deviceId, name: d.name, proposedFp: d.kid, enrolledFp: l.kid });
    else diff.matching.devices++;
  }
  for (const [id, l] of ld) if (!pd.has(id)) diff.enrolledNotProposed.devices.push({ deviceId: id, name: l.name, fp: l.kid });
  return diff;
}

const fpText = (fp) => (fp ? KS.groupFp(fp) : '(계산 불가)');

// **지문 자리는 «이 기기가 계산한 값» 만 앉는 자리예요.** 중계가 붙인 «이름» 은 자유 글이라 거기에 다른 키의 지문 모양 글자를 심어 «지문 칸처럼» 보이게 할 수 있어요(이름 안에 따옴표를 닫고 «지문 …» 을 흉내 내면
//   한 줄에서 가짜 지문이 진짜 지문 앞에 서요). 그래서 ① 항목은 «여러 줄» 로 — 지문은 자기 줄(맨 앞 라벨 «지문»)에만, 이름은 «중계가 붙인 이름» 이라고 꼬리표를 단 «별도 줄» 에 ② 이름은 JSON 으로 이스케이프해서
//   따옴표가 줄을 못 닫게 ③ 지문처럼 생긴 글자 덩어리(4자씩 묶음이 3개 이상이거나 20자 넘는 이어진 글)가 든 이름은 아예 가려요(이름은 «식별 힌트» 일 뿐이고 대조는 지문으로 해요).
const FP_LIKE_RE = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{4}(?:-[A-Za-z0-9_-]{4}){2,}(?![A-Za-z0-9_-])|[A-Za-z0-9_-]{20,}/;
function nameText(name) {
  if (!name) return '(없음)';
  if (FP_LIKE_RE.test(name)) return '(지문과 비슷한 모양의 글이라 가렸어요)';
  return JSON.stringify(name);
}
const NAME_LABEL = '중계가 붙인 이름(검증된 값이 아니에요): ';
const credLines = (c) => [
  '자격증명 ' + c.credentialId.slice(0, 16) + (c.credentialId.length > 16 ? '…' : '') + '   (아래 지문은 받은 키로 이 기기가 계산한 값)',
  '  알고리즘 ' + (ALG_NAME[String(c.alg)] || c.alg),
  '  지문 ' + fpText(c.fp),
  '  ' + NAME_LABEL + nameText(c.name),
];
const devLines = (d) => [
  '기기 ' + d.deviceId + '   (아래 지문은 받은 봉인 키로 이 기기가 계산한 값)',
  '  지문 ' + fpText(d.kid),
  '  ' + NAME_LABEL + nameText(d.name),
];
const printItem = (head, lines) => { say(head + lines[0]); for (const l of lines.slice(1)) say('    ' + l); };

// ── 권한 경고: «한 번만» ───────────────────────────────────────────────────────────────────────────────────
let permWarned = false;
function checkPermissions(files) {
  const r = KS.hardenFiles(files);
  if (r.gaveUp && !permWarned) {
    permWarned = true;
    warn('⚠ 이 플랫폼은 파일 권한 0600 을 표현하지 못해요 — 토큰·키 파일이 같은 컴퓨터의 다른 사용자에게 읽힐 수 있어요. 파일 권한으로는 이 비밀을 못 지켜요(폴더 접근 제한 등 다른 수단을 쓰세요). 이 경고는 한 번만 말해요.');
  }
  return r;
}

// ── pair ─────────────────────────────────────────────────────────────────────────────────────────────────
function parseRelayOrigin(s, dev) {
  let u;
  try { u = new URL(String(s)); } catch (_) { return { ok: false, why: '--relay 를 URL 로 읽을 수 없어요' }; }
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/') return { ok: false, why: '--relay 는 origin(https://호스트[:포트]) 만 받아요 — 경로·쿼리·자격증명은 안 돼요' };
  const loopback = CONFIG.isLoopbackHost(u.hostname);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && dev && loopback)) return { ok: false, why: '--relay 는 https:// 여야 해요 (--dev 와 loopback 호스트(localhost · 127.0.0.1)일 때만 http 허용)' };
  let rpId = u.hostname;
  // IPv6 리터럴('[::1]')은 rp.id 가 될 수 없어요(rp.id 는 도메인 이름이고 설정 검증도 그 글자만 받아요). --dev 의 loopback 이면 rp.id 를 'localhost' 로 두고 origin 은 «친 그대로» 둬요 —
  //   개발 모드가 명시적으로 허용하는 rp.id 가 'localhost' 예요. (--dev 가 아니면 위에서 이미 loopback 자체가 거절돼요.)
  let rpNote = null;
  if (dev && loopback && rpId.startsWith('[')) { rpId = 'localhost'; rpNote = 'IPv6 주소는 rp.id 가 될 수 없어서 localhost 로 두었어요'; }
  if (!HOST_RE.test(rpId)) return { ok: false, why: 'rp.id 로 쓸 수 없는 호스트 표기예요' };
  // rp.id 는 «패스키가 묶이는 도메인» 이에요. 개발 모드가 아니면 loopback · IP · 점 없는 이름은 실제 폰의 패스키가 묶일 수 없는 값이라 거절해요.
  if (!dev && (loopback || net.isIP(rpId) !== 0 || !rpId.includes('.'))) return { ok: false, why: 'rp.id(= 호스트 ' + rpId + ')는 패스키가 묶일 수 있는 도메인이어야 해요 (localhost · IP 는 --dev 에서만)' };
  return { ok: true, origin: u.origin, rpId, rpNote };
}

function commitPair(dir, plan) {
  const files = { keys: path.join(dir, 'uplink-keys.json'), token: path.join(dir, 'uplink-token'), cfg: path.join(dir, 'uplink.json') };
  const written = [];
  // 커밋 «직전» 에 다시 확인해요(위 잠금 안이라 보통은 생길 수 없지만, 잠금을 모르는 손(수동 복사 · 다른 도구)이 그 사이 만든 설정을 rename 이 조용히 덮어쓰지 않게).
  const already = [files.keys, files.token, files.cfg].filter((f) => fs.existsSync(f));
  if (already.length) { const e = new Error('exists'); e.code = 'EEXIST'; throw e; }
  try {
    KS.writeAtomic(files.keys, JSON.stringify(plan.keys, null, 2) + '\n', 0o600); written.push(files.keys);
    KS.writeAtomic(files.token, plan.token + '\n', 0o600); written.push(files.token);
    KS.writeAtomic(files.cfg, JSON.stringify(plan.cfg, null, 2) + '\n', 0o600); written.push(files.cfg);
  } catch (e) {
    for (const f of written.reverse()) { try { fs.unlinkSync(f); } catch (_) { /* noop */ } }      // 이미 쓴 것도 걷어서 «꺼진 채» 로 돌려놔요
    throw e;
  }
  return files;
}

async function cmdPair(args) {
  const parsed = parseArgs(args, { value: ['relay', 'code', 'name', 'dashboard-url', 'dir'], bool: ['dev'] });
  if (parsed.error) return usageError(parsed.error);
  const o = parsed.o;
  if (!o.relay) return usageError('--relay 가 필요해요');
  if (!o.code) return usageError('--code 가 필요해요');
  if (!CODE_RE.test(o.code)) return usageError('--code 는 XXXX-XXXX 모양이어야 해요');
  const dev = o.dev === true;
  const rel = parseRelayOrigin(o.relay, dev);
  if (!rel.ok) { warn('거절: ' + rel.why); return E.REFUSED; }
  const dir = resolveDir(o);
  if (!dir) return usageError('--dir 이 폴더가 아니에요');
  let name = o.name;
  if (name !== undefined && !KS.cleanText(name, 1, 64)) return usageError('--name 은 깨끗한 1~64자 글이어야 해요');
  if (name === undefined) name = (os.hostname() || 'board').replace(/[^\x20-\x7e]/g, '?').slice(0, 64) || 'board';
  if (o['dashboard-url'] !== undefined) {
    const probe = CONFIG.validate({ relay: rel.origin, boardId: 'x', dashboardUrl: o['dashboard-url'] }, { dir });
    if (!probe.ok) return usageError('--dashboard-url: ' + probe.error);
  }
  // pair 는 «폴더 하나당 한 번에 하나» 예요 — 사람이 프롬프트 앞에서 기다리는 동안 다른 pair 가 끝까지 가서 설정을 만들어 놓으면, 기다리던 쪽이 «존재 확인 뒤» 에 그 파일들을 rename 으로 조용히 덮어써요
  //   (먼저 끝난 보드의 토큰 · 보드 키가 사라지고 중계에는 고아 등록이 남아요). 그래서 «존재 확인 전에» 폴더 잠금을 잡고 커밋이 끝날 때까지 쥐어요. 잠금은 pid 가 죽으면 다음 pair 가 인수해요.
  const lockPath = path.join(dir, 'uplink-pair.lock');
  try { OP.acquireFileLock(lockPath); } catch (_) {
    warn('거절: 이 폴더에서 다른 pair 가 진행 중이에요(또는 잠금 파일을 만들 수 없어요) — 끝난 뒤에 다시 하세요. 아무것도 쓰지 않았어요.');
    return E.REFUSED;
  }
  try { return await pairLocked(o, rel, dir, name, dev); } finally { try { OP.releaseFileLock(lockPath); } catch (_) { /* noop */ } }
}

const PAIR_FILES = ['uplink.json', 'uplink-token', 'uplink-keys.json'];
async function pairLocked(o, rel, dir, name, dev) {
  // 이전 pair 가 임시 파일을 쓰다 «죽은» 흔적(주인 pid 가 죽은 것)은 먼저 치워요 — 키 파일 임시본에는 보드 개인키가 들어 있어요. 살아 있는 주인의 것은 건드리지 않고 말만 해요.
  const swept = KS.sweepTmp(dir, PAIR_FILES);
  if (swept.length) say('(이전에 비정상 종료한 pair 가 남긴 임시 파일 ' + swept.length + '개를 지웠어요 — 보드 개인키가 들어 있을 수 있던 파일이에요)');
  const liveTmp = KS.tmpLeftovers(dir, PAIR_FILES);
  if (liveTmp.length) warn('주의: 다른 프로세스(pid ' + liveTmp.map((l) => l.pid).join(', ') + ')가 쓰는 임시 파일이 있어요 — 건드리지 않았어요.');
  // 이미 설정된 보드는 덮어쓰지 않아요 — 새 보드 키를 쓰면 «기존 등록·서명 영수증의 신원» 이 조용히 바뀌어요. 네트워크에 나가기 «전에» 막아요(일회용 코드가 헛되이 쓰이지 않게).
  const existing = PAIR_FILES.filter((f) => fs.existsSync(path.join(dir, f)));
  if (existing.length) {
    warn('거절: 이 폴더에 이미 ' + existing.join(' · ') + ' 이(가) 있어요 — 덮어쓰지 않아요.');
    warn('페어링을 풀려면: 보드를 멈추고, ' + dir + ' 의 uplink.json · uplink-token · uplink-keys.json 을 지운 뒤 (감사 기록 uplink-audit.jsonl 은 남겨도 돼요) 다시 pair 하세요.');
    return E.REFUSED;
  }
  if (dev) say('(--dev: loopback 개발용이에요 — 실제 운영 보드에는 쓰지 마세요)');
  if (rel.rpNote) say('(' + rel.rpNote + ')');

  // 보드 키(P-256)는 «메모리에서만» 만들어요 — 사람이 확인하기 전에는 디스크에 닿지 않아요.
  const kp = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const boardSpki = KS.canonSpki(kp.publicKey);
  const boardFp = OP.boardKeyFingerprint(kp.publicKey);
  const reqBody = { code: o.code, boardPubKey: boardSpki.toString('base64url'), boardName: name, runtimeVersion: process.env.EG_BOARD_VERSION || 'unknown', uplinkVersion: UPLINK_VERSION };
  if (o['dashboard-url'] !== undefined) reqBody.dashboardUrl = o['dashboard-url'];
  say('중계 ' + rel.origin + ' 에 페어링을 요청해요…');
  const r = await relayCall('POST', rel.origin + '/v1/pair', { body: reqBody });
  if (!r.ok) { warn('페어링 실패: ' + r.why + ' — 아무것도 쓰지 않았어요.'); return E.REFUSED; }
  const v = validatePairResponse(r.json);
  if (!v.ok) { warn('중계 응답이 규격이 아니에요 (' + v.why + ') — 아무것도 쓰지 않았어요.'); return E.REFUSED; }

  // 지문은 «전부 여기서 받은 바이트로 다시 계산한 값» 이에요(위 normalize* 가 계산) — 중계가 지문이라며 보낸 문자열은 읽지도 않았고 화면에도 안 나와요.
  say('');
  say('=== 페어링 확인 ===');
  say('중계      : ' + rel.origin + '   (rp.id = ' + rel.rpId + ' — 이 주소에서 로컬로 유도한 값이에요)');
  say('계정      : ' + nameText(v.accountName) + '  (id ' + v.accountId + ' — 이름은 중계가 붙인 글이에요)');
  say('보드 id   : ' + v.boardId);
  say('보드 키 지문(이 보드가 방금 만든 키, 폰 화면에 같은 값이 보여야 해요): ' + boardFp + '   (' + KS.groupFp(boardFp) + ')');
  say('');
  say('주의(정직한 한계): 지문 대조가 막아 주는 건 «나중에 추가되는 키» 예요. 지금 이 순간에는 이 화면의 값과 폰이 보여 줄 값이 둘 다 중계에서 오므로');
  say('(처음 본 키를 믿는 방식, TOFU) 중계가 처음부터 악의적이면 양쪽에 서로 맞는 값을 보여 줄 수 있어요. 직접 친 https 주소의 중계만 쓰세요.');
  say('');
  if (v.credentials.length) { say('중계가 제안하는 자격증명(패스키):'); v.credentials.forEach((c, i) => printItem('  [' + (i + 1) + '] ', credLines(c))); }
  if (v.devices.length) { say('중계가 제안하는 기기(결정 맥락을 봉인해서 받을 기기):'); v.devices.forEach((d, i) => printItem('  [' + (i + 1) + '] ', devLines(d))); }
  if (!v.credentials.length && !v.devices.length) say('중계가 제안하는 키가 없어요 — 나중에 enroll 로 등록할 수 있어요.');
  say('');
  const proceed = await askYes('계정과 보드 키 지문이 맞고, 이 계정에 이 보드를 묶을까요?');
  if (!proceed) { say('중단했어요 — 아무것도 쓰지 않았어요. (페어링 코드는 이미 쓰였으니 중계에서 새 코드를 받아야 해요)'); return E.REFUSED; }
  const accCreds = []; const accDevs = [];
  for (const c of v.credentials) { say(''); printItem('', credLines(c)); if (await askYes('이 자격증명을 등록할까요?')) accCreds.push(c); }
  for (const d of v.devices) { say(''); printItem('', devLines(d)); if (await askYes('이 기기를 등록할까요?')) accDevs.push(d); }
  if ((v.credentials.length || v.devices.length) && accCreds.length + accDevs.length === 0) {
    say('제안된 키를 전부 거절했어요 — 아무것도 쓰지 않았어요. (페어링 코드는 이미 쓰였으니 새 코드를 받아야 해요)');
    return E.REFUSED;
  }

  const now = Date.now();
  const iso = new Date(now).toISOString();
  const keys = {
    boardKey: { privateJwk: kp.privateKey.export({ format: 'jwk' }) },
    credentials: accCreds.map((c) => { const x = { credentialId: c.credentialId, alg: c.alg, publicKeySpki: c.spki, signCount: 0, acct: v.accountId }; if (c.name) x.name = c.name; x.enrolledVia = 'pair'; x.enrolledAt = iso; return x; }),
    devices: accDevs.map((d) => { const x = { deviceId: d.deviceId, sealPublicJwk: d.jwk }; if (d.name) x.name = d.name; x.enrolledVia = 'pair'; x.enrolledAt = iso; return x; }),
    keysVersion: 1,
  };
  // rp · origin 은 «여기서 친 --relay» 에서만 와요(응답의 rp 는 무시).
  const cfg = {
    relay: rel.origin, boardId: v.boardId, tokenFile: 'uplink-token', keysFile: 'uplink-keys.json', visibility: 'sealed',
    rp: { id: rel.rpId, origins: [rel.origin] },
    totp: { verbs: Object.keys(VERBS).filter((k) => VERBS[k].totp) },
    observation: { channels: [] },
  };
  if (o['dashboard-url'] !== undefined) cfg.dashboardUrl = o['dashboard-url'];
  const self = CONFIG.validate(cfg, { dir });
  if (!self.ok) { warn('내부 오류: 만든 설정이 규격에 안 맞아요 (' + self.error + ') — 아무것도 쓰지 않았어요.'); return E.REFUSED; }

  let files;
  try { files = commitPair(dir, { keys, token: v.token, cfg }); } catch (e) {
    warn('파일을 쓰지 못했어요 (' + printable((e && (e.code || e.message)) || 'error') + ') — 쓰던 것은 걷었어요. 보드는 설정되지 않은 채예요.');
    return E.REFUSED;
  }
  checkPermissions([files.keys, files.token, files.cfg]);
  say('');
  say('페어링 완료 — 등록: 자격증명 ' + accCreds.length + ' · 기기 ' + accDevs.length + '.');
  say('서버는 uplink.json 을 «기동 때만» 읽어요 — 보드를 재시작해야 업링크가 켜져요.');
  return E.OK;
}

// ── keys ─────────────────────────────────────────────────────────────────────────────────────────────────
async function cmdKeys(args) {
  const parsed = parseArgs(args, { value: ['dir'], bool: ['json'] });
  if (parsed.error) return usageError(parsed.error);
  const dir = resolveDir(parsed.o);
  if (!dir) return usageError('--dir 이 폴더가 아니에요');
  const c = loadConfig(dir);
  if (!c.ok) { warn(c.why); return E.REFUSED; }
  const local = readKeys(c.cfg);
  if (!local.ok) { warn('로컬 키 파일을 읽을 수 없어요 (' + local.reason + ')'); return E.REFUSED; }
  const prop = await fetchProposals(c.cfg);
  if (!prop.ok) { warn('중계의 키 목록을 받지 못했어요: ' + prop.why); return E.REFUSED; }
  // 이 명령은 «절대 쓰지 않아요» — 제안은 등록이 아니에요(등록은 enroll 의 사람 확인 뒤).
  const d = computeDiff(local, prop);
  if (parsed.o.json) {
    const cv = (c2) => ({ credentialId: c2.credentialId, alg: c2.alg, name: c2.name || '', fingerprint: c2.fp });
    const dv = (d2) => ({ deviceId: d2.deviceId, name: d2.name || '', fingerprint: d2.kid });
    const jp = KS.readPending(c.cfg.keysFile);
    say(JSON.stringify({
      proposedNotEnrolled: { credentials: d.proposedNotEnrolled.credentials.map(cv), devices: d.proposedNotEnrolled.devices.map(dv) },
      signedPending: { credentials: jp.credentials.map((x) => Object.assign(cv(x), { via: x.via, acct: x.acct })), devices: jp.devices.map((x) => Object.assign(dv(x), { via: x.via })) },
      enrolledNotProposed: d.enrolledNotProposed,
      mismatched: d.mismatched,
      matching: d.matching,
    }, null, 2));
    return E.OK;
  }
  say('중계 제안 ↔ 로컬 등록부 (이 명령은 아무것도 바꾸지 않아요)');
  say('');
  say('제안됐지만 등록 안 됨 — 지금은 보드에 아무 효력이 없어요 (등록은 enroll):');
  if (!d.proposedNotEnrolled.credentials.length && !d.proposedNotEnrolled.devices.length) say('  (없음)');
  for (const c2 of d.proposedNotEnrolled.credentials) printItem('  proposed, not enrolled  ', credLines(c2));
  for (const d2 of d.proposedNotEnrolled.devices) printItem('  proposed, not enrolled  ', devLines(d2));
  const pq = KS.readPending(c.cfg.keysFile);
  say('서명된 명령으로 «대기열» 에 올라 있음 — 아직 등록 아님, 보드 터미널의 사람이 enroll --pending 으로 확인해야 효력이 생겨요:');
  if (!pq.credentials.length && !pq.devices.length) say('  (없음)');
  for (const c2 of pq.credentials) printItem('  signed, pending  ', credLines(c2));
  for (const d2 of pq.devices) printItem('  signed, pending  ', devLines(d2));
  say('같은 id 인데 키가 달라요 — 중계가 등록된 id 에 다른 키를 내밀고 있을 수 있어요:');
  if (!d.mismatched.credentials.length && !d.mismatched.devices.length) say('  (없음)');
  for (const m of d.mismatched.credentials) say('  MISMATCH  자격증명 ' + m.credentialId.slice(0, 16) + '…  등록된 지문 ' + fpText(m.enrolledFp) + '  제안된 지문 ' + fpText(m.proposedFp));
  for (const m of d.mismatched.devices) say('  MISMATCH  기기 ' + m.deviceId + '  등록된 지문 ' + fpText(m.enrolledFp) + '  제안된 지문 ' + fpText(m.proposedFp));
  say('등록됐지만 중계가 제안하지 않음:');
  if (!d.enrolledNotProposed.credentials.length && !d.enrolledNotProposed.devices.length) say('  (없음)');
  for (const x of d.enrolledNotProposed.credentials) say('  enrolled, not proposed  자격증명 ' + x.credentialId.slice(0, 16) + '…  지문 ' + fpText(x.fp));
  for (const x of d.enrolledNotProposed.devices) say('  enrolled, not proposed  기기 ' + x.deviceId + '  지문 ' + fpText(x.fp));
  say('일치: 자격증명 ' + d.matching.credentials + ' · 기기 ' + d.matching.devices);
  return E.OK;
}

// ── enroll ───────────────────────────────────────────────────────────────────────────────────────────────
async function cmdEnroll(args) {
  const parsed = parseArgs(args, { value: ['credential', 'device', 'dir'], bool: ['pending'] });
  if (parsed.error) return usageError(parsed.error);
  const o = parsed.o;
  if (o.credential !== undefined && o.device !== undefined) return usageError('--credential 과 --device 는 같이 못 써요');
  const dir = resolveDir(o);
  if (!dir) return usageError('--dir 이 폴더가 아니에요');
  const c = loadConfig(dir);
  if (!c.ok) { warn(c.why); return E.REFUSED; }
  const local = readKeys(c.cfg);
  if (!local.ok) { warn('로컬 키 파일을 읽을 수 없어요 (' + local.reason + ')'); return E.REFUSED; }
  const keysFile = c.cfg.keysFile;

  // 후보의 «출처» 가 둘이에요. ① 대기열(uplink-pending.json) — 이미 등록된 passkey 가 서명한 enroll 명령이 «후보로 올려 둔» 것. 서명은 등록이 아니에요(exec.cjs 머리말): 여기서 사람이 y 를 쳐야 등록돼요.
  //   ② 중계 제안(GET /v1/uplink/keys) — 제안도 등록이 아니에요. 지정이 없으면 ①→② 순서로 «전부 하나씩» 물어요. --pending 이면 ① 만(네트워크 없이), --credential/--device 만 있으면 ② 만이에요.
  const useProposals = o.pending !== true;
  const usePending = o.pending === true || (o.credential === undefined && o.device === undefined);
  const wantC = o.credential; const wantD = o.device;
  const pend = [];
  const enrolledSpki = new Set(local.credentials.map((x) => localCredView(x).spki));
  const enrolledCredIds = new Set(local.credentials.map((x) => x.credentialId));
  const enrolledDevIds = new Set(local.devices.map((x) => x.deviceId));
  const enrolledKids = new Set(local.devices.map((x) => x.kid));

  if (usePending) {
    const pq = KS.readPending(keysFile);
    if (pq.skipped) warn('대기열에 규격 밖 항목 ' + pq.skipped + '개가 있어요 — 보이지 않고 등록되지 않아요.');
    for (const p of pq.credentials) {
      if (wantC !== undefined && p.credentialId !== wantC) continue;
      if (wantD !== undefined) continue;
      if (enrolledCredIds.has(p.credentialId) || enrolledSpki.has(p.spki)) { say('대기열의 자격증명이 이미 등록돼 있어요 — 대기열에서 치워요.'); try { KS.dropPending(keysFile, 'credential', p.credentialId); } catch (_) { /* noop */ } continue; }
      pend.push({ kind: 'credential', item: p, source: 'pending' });
    }
    for (const p of pq.devices) {
      if (wantD !== undefined && p.deviceId !== wantD) continue;
      if (wantC !== undefined) continue;
      if (enrolledDevIds.has(p.deviceId) || enrolledKids.has(p.kid)) { say('대기열의 기기가 이미 등록돼 있어요 — 대기열에서 치워요.'); try { KS.dropPending(keysFile, 'device', p.deviceId); } catch (_) { /* noop */ } continue; }
      pend.push({ kind: 'device', item: p, source: 'pending' });
    }
    if (o.pending === true && (wantC !== undefined || wantD !== undefined) && !pend.length) { warn('거절: 대기열에 그 id 가 없어요 (keys 로 확인하세요).'); return E.REFUSED; }
  }

  let prop = null;
  if (useProposals) {
    prop = await fetchProposals(c.cfg);
    if (!prop.ok) {
      // 지정 없이 돌린 경우 대기열 항목은 네트워크 없이도 처리할 수 있어요 — 그 쪽은 계속해요.
      if (pend.length && wantC === undefined && wantD === undefined) { warn('중계의 키 목록은 받지 못했어요(' + prop.why + ') — 대기열 항목만 확인해요.'); prop = null; }
      else { warn('중계의 키 목록을 받지 못했어요: ' + prop.why); return E.REFUSED; }
    }
  }
  if (prop) {
    const diff = computeDiff(local, prop);
    if (wantC !== undefined) {
      const p = prop.credentials.find((x) => x.credentialId === wantC);
      if (!p) { warn('거절: 이 자격증명 id 는 중계가 제안한 목록에 없어요 (keys 로 확인하세요).'); return E.REFUSED; }
      if (diff.mismatched.credentials.some((m) => m.credentialId === wantC)) { warn('거절: 같은 id 가 이미 «다른 키» 로 등록돼 있어요 — 중계가 다른 키를 내밀고 있어요.'); return E.REFUSED; }
      if (!diff.proposedNotEnrolled.credentials.includes(p)) { warn('거절: 이미 등록된 자격증명이에요 (중복).'); return E.REFUSED; }
      pend.push({ kind: 'credential', item: p, source: 'proposal' });
    } else if (wantD !== undefined) {
      const p = prop.devices.find((x) => x.deviceId === wantD);
      if (!p) { warn('거절: 이 기기 id 는 중계가 제안한 목록에 없어요 (keys 로 확인하세요).'); return E.REFUSED; }
      if (diff.mismatched.devices.some((m) => m.deviceId === wantD)) { warn('거절: 같은 id 가 이미 «다른 키» 로 등록돼 있어요 — 중계가 다른 키를 내밀고 있어요.'); return E.REFUSED; }
      if (!diff.proposedNotEnrolled.devices.includes(p)) { warn('거절: 이미 등록된 기기예요 (중복).'); return E.REFUSED; }
      pend.push({ kind: 'device', item: p, source: 'proposal' });
    } else {
      for (const p of diff.proposedNotEnrolled.credentials) pend.push({ kind: 'credential', item: p, source: 'proposal' });
      for (const p of diff.proposedNotEnrolled.devices) pend.push({ kind: 'device', item: p, source: 'proposal' });
    }
  }
  if (!pend.length) { say('등록할 새 항목이 없어요.'); return E.OK; }

  // 제안 출처 자격증명은 «중계가 말한 계정» 에 묶여요 — 이미 다른 계정의 자격증명이 있으면 거절. 대기열 출처는 «서명한 운영자 계정» 이에요(같은 계정 아래에서만 넓어져요).
  if (pend.some((x) => x.kind === 'credential' && x.source === 'proposal')) {
    if (!prop.accountId) { warn('거절: 중계 응답에 accountId 가 없어 자격증명을 어느 계정에 묶을지 몰라요.'); return E.REFUSED; }
    const other = local.credentials.find((x) => x.acct !== null && x.acct !== prop.accountId);
    if (other) { warn('거절: 중계가 말하는 계정(' + prop.accountId + ')이 이미 등록된 자격증명의 계정(' + other.acct + ')과 달라요.'); return E.REFUSED; }
  }
  let done = 0; let declined = 0;
  for (const p of pend) {
    // 지문은 «로컬 계산값» 이에요(위 normalize*). 이 화면의 값을 폰·다른 경로의 지문과 대조한 뒤에만 y 를 치세요.
    const lines = p.kind === 'credential' ? credLines(p.item) : devLines(p.item);
    say('');
    if (p.source === 'pending') say('서명된 명령(' + p.item.via + ')이 대기열에 올린 ' + (p.kind === 'credential' ? '자격증명(계정 ' + p.item.acct + ')' : '기기') + ' — 서명은 «후보 올리기» 까지예요. 여기서 y 를 쳐야 등록되고, 그때부터 이 키가 보드에 «효력» 을 가져요:');
    else say('중계가 제안한 ' + (p.kind === 'credential' ? '자격증명(계정 ' + prop.accountId + ')' : '기기') + ' — 등록하면 이 키가 보드에 «효력» 을 가져요:');
    printItem('  ', lines);
    const yes = await askYes('등록할까요?');
    if (!yes) {
      declined++; say('등록하지 않았어요.');
      if (p.source === 'pending' && await askYes('이 항목을 대기열에서도 지울까요?')) {
        try { KS.dropPending(keysFile, p.kind, p.kind === 'credential' ? p.item.credentialId : p.item.deviceId); say('대기열에서 지웠어요.'); } catch (e) { warn('대기열에서 지우지 못했어요: ' + printable((e && (e.code || e.message)) || 'error')); }
      }
      continue;
    }
    const via = p.source === 'pending' ? p.item.via : 'cli';
    const confirmedBy = p.source === 'pending' ? 'cli' : undefined;
    try {
      KS.updateKeys(keysFile, (raw) => {
        if (p.kind === 'credential') KS.addCredential(raw, p.item, p.source === 'pending' ? p.item.acct : prop.accountId, via, Date.now(), confirmedBy);
        else KS.addDevice(raw, p.item, via, Date.now(), confirmedBy);
      });
    } catch (e) {
      warn('등록하지 못했어요: ' + printable(e && e.code ? e.code : (e && e.message) || 'error'));
      return E.REFUSED;
    }
    if (p.source === 'pending') { try { KS.dropPending(keysFile, p.kind, p.kind === 'credential' ? p.item.credentialId : p.item.deviceId); } catch (_) { warn('(대기열에서 치우지 못했어요 — 다음 enroll 이 «이미 등록됨» 으로 치워요)'); } }
    done++;
    say('등록했어요 — 다음 명령부터 바로 적용돼요(재시작 불필요).');
  }
  checkPermissions([keysFile]);
  return done > 0 ? E.OK : E.REFUSED;
}

// ── totp-init ────────────────────────────────────────────────────────────────────────────────────────────
function codeMatches(secret, code, nowSec) {
  if (!/^\d{6}$/.test(code)) return false;
  const cur = TOTP.stepOf(nowSec);
  let ok = false;
  for (let d = -TOTP.WINDOW_STEPS; d <= TOTP.WINDOW_STEPS; d++) {
    if (cur + d < 0) continue;
    const want = TOTP.hotp(secret, cur + d);
    if (crypto.timingSafeEqual(Buffer.from(want), Buffer.from(code))) ok = true;      // 일부러 단락하지 않아요
  }
  return ok;
}

async function cmdTotpInit(args) {
  const parsed = parseArgs(args, { value: ['acct', 'dir'], bool: ['force'] });
  if (parsed.error) return usageError(parsed.error);
  const o = parsed.o;
  if (!o.acct) return usageError('--acct 가 필요해요');
  if (!ACCT_RE.test(o.acct)) return usageError('--acct 는 영숫자 · . _ @ : - 만, 1~128자예요 (운영자 도장·영수증·감사에 그대로 들어가는 이름이라 글자를 좁혀요)');
  const dir = resolveDir(o);
  if (!dir) return usageError('--dir 이 폴더가 아니에요');
  const c = loadConfig(dir);
  if (!c.ok) { warn(c.why); return E.REFUSED; }
  const raw = readKeysRaw(c.cfg);
  if (!raw) { warn('로컬 키 파일을 읽을 수 없어요'); return E.REFUSED; }
  if (raw.totp !== undefined && o.force !== true) {
    warn('거절: 이미 TOTP 가 등록돼 있어요. 바꾸려면 --force (이전 비밀은 즉시 못 쓰게 돼요).');
    return E.REFUSED;
  }
  // 상태 파일 잠금을 «비밀을 만들고 보여 주기 전에» 잡아요 — 실행 중인 보드가 TOTP 상태를 쥐고 있으면(TOTP 명령을 한 번이라도 처리했으면) 여기서 멈춰요. 순서가 거꾸로면(비밀 표시 → 코드 확인 → 잠금 시도)
  //   운영자가 이미 인증 앱에 «등록되지 않을 비밀» 을 넣어 버린 뒤에야 실패를 알아요. 잠금은 확인 · 기록 · 상태 초기화가 끝날 때까지 쥐어요(새 비밀 + 옛 상태가 짝지어지면 TotpStore 는 state-mismatch 로 «닫힌 채 실패» 해요).
  let store;
  try { store = new TOTP.TotpStore(path.join(dir, 'uplink-totp.json'), { now: Math.floor(Date.now() / 1000) }); } catch (e) {
    warn('TOTP 상태 파일(uplink-totp.json)을 열 수 없어요 (' + printable((e && e.code) || 'error') + ') — 보드가 쓰고 있을 수 있어요. 보드를 멈추고 다시 실행하세요. 비밀을 만들지도 않았고 아무것도 쓰지 않았어요.');
    return E.REFUSED;
  }
  try { return await totpInitLocked(o, dir, c, store); } finally { try { store.close(); } catch (_) { /* noop */ } }
}

async function totpInitLocked(o, dir, c, store) {
  const secret = TOTP.generateSecret();
  const b32 = TOTP.base32Encode(secret);
  const uri = TOTP.otpauthUri({ issuer: TOTP_ISSUER, account: o.acct, secret });
  say('TOTP 비밀을 만들었어요. 인증 앱에 아래 URI(또는 비밀)를 등록하세요 — 이 화면 «한 번» 만 보여 줘요.');
  say('otpauth URI : ' + uri);
  say('secret      : ' + b32);
  say('(계정 ' + o.acct + ' · SHA1 · 6자리 · 30초)');
  let confirmed = false;
  for (let attempt = 1; attempt <= 3 && !confirmed; attempt++) {
    const code = await askLine('인증 앱이 지금 보여 주는 6자리 코드를 입력하세요 (' + attempt + '/3):');
    if (code === null) break;
    if (codeMatches(secret, code, Math.floor(Date.now() / 1000))) confirmed = true;
    else say('코드가 맞지 않아요.');
  }
  if (!confirmed) { say('확인되지 않았어요 — 아무것도 쓰지 않았어요.'); return E.REFUSED; }

  // 기록 순서: 키 파일 → 상태 초기화(잠금은 위에서 이미 쥐고 있어요).
  try {
    KS.updateKeys(c.cfg.keysFile, (r2) => { r2.totp = { secretB32: b32, acct: o.acct }; });
  } catch (e) { warn('키 파일을 쓰지 못했어요 (' + printable((e && (e.code || e.message)) || 'error') + ') — 아무것도 바꾸지 않았어요.'); return E.REFUSED; }
  try { store.reset(); } catch (e) {
    warn('TOTP 비밀은 기록했지만 상태 초기화에 실패했어요 (' + printable((e && e.code) || 'error') + ') — TOTP 가 닫힌 채 실패할 수 있어요. 보드를 멈추고 totp-init --force 를 다시 실행하세요.');
    return E.REFUSED;
  }
  checkPermissions([c.cfg.keysFile]);
  say('TOTP 를 등록했어요(계정 ' + o.acct + ') — 이전의 잠금·사용한 단계 기록은 비웠어요. 다음 명령부터 바로 적용돼요.');
  return E.OK;
}

// ── revoke ───────────────────────────────────────────────────────────────────────────────────────────────
async function cmdRevoke(args) {
  const parsed = parseArgs(args, { value: ['credential', 'device', 'dir'], bool: ['totp'] });
  if (parsed.error) return usageError(parsed.error);
  const o = parsed.o;
  const n = (o.credential !== undefined ? 1 : 0) + (o.device !== undefined ? 1 : 0) + (o.totp === true ? 1 : 0);
  if (n !== 1) return usageError('--credential <id> | --device <id> | --totp 중 정확히 하나가 필요해요');
  const dir = resolveDir(o);
  if (!dir) return usageError('--dir 이 폴더가 아니에요');
  const c = loadConfig(dir);
  if (!c.ok) { warn(c.why); return E.REFUSED; }
  const local = readKeys(c.cfg);
  if (!local.ok) { warn('로컬 키 파일을 읽을 수 없어요 (' + local.reason + ')'); return E.REFUSED; }
  let question; let mutator;
  if (o.credential !== undefined) {
    const cr = local.credentials.find((x) => x.credentialId === o.credential);
    if (!cr) { warn('거절: 등록된 자격증명이 아니에요.'); return E.REFUSED; }
    const v = localCredView(cr);
    say('제거할 자격증명: ' + o.credential.slice(0, 16) + '…  알고리즘 ' + (ALG_NAME[String(cr.alg)] || cr.alg) + '  지문 ' + fpText(v.fp));
    if (local.credentials.length <= 1) say('경고: 마지막 자격증명이에요 — 제거하면 passkey 로 서명하는 명령이 전부 거절돼요 (enroll 로 다시 등록할 수 있어요).');
    question = '제거할까요?';
    mutator = (raw) => KS.removeCredential(raw, o.credential, true);      // 터미널 앞의 사람은 마지막 것도 지울 수 있어요(enroll 로 복구 가능 — 서명된 명령은 못 해요)
  } else if (o.device !== undefined) {
    const d = local.devices.find((x) => x.deviceId === o.device);
    if (!d) { warn('거절: 등록된 기기가 아니에요.'); return E.REFUSED; }
    printItem('제거할 ', devLines(d));
    question = '제거할까요? (이후 새 결정 맥락은 이 기기로 봉인되지 않아요)';
    mutator = (raw) => KS.removeDevice(raw, o.device);
  } else {
    if (!local.totp) { warn('거절: 등록된 TOTP 가 없어요.'); return E.REFUSED; }
    say('제거할 TOTP: 계정 ' + (local.totp.acct || '(없음)'));
    question = '제거할까요?';
    mutator = (raw) => { if (raw.totp === undefined) throw new KS.KeysetRefusal('totp-not-enrolled'); delete raw.totp; };
  }
  if (!(await askYes(question))) { say('제거하지 않았어요.'); return E.REFUSED; }
  try { KS.updateKeys(c.cfg.keysFile, mutator); } catch (e) { warn('제거하지 못했어요: ' + printable((e && (e.code || e.message)) || 'error')); return E.REFUSED; }
  say('제거했어요 — 다음 명령부터 바로 적용돼요.');
  return E.OK;
}

// ── audit ────────────────────────────────────────────────────────────────────────────────────────────────
async function cmdAudit(args) {
  const parsed = parseArgs(args, { value: ['tail', 'dir'], bool: [] });
  if (parsed.error) return usageError(parsed.error);
  let tail = 20;
  if (parsed.o.tail !== undefined) {
    if (!/^\d{1,5}$/.test(parsed.o.tail) || Number(parsed.o.tail) < 1) return usageError('--tail 은 양의 정수예요');
    tail = Number(parsed.o.tail);
  }
  const dir = resolveDir(parsed.o);
  if (!dir) return usageError('--dir 이 폴더가 아니에요');
  const file = path.join(dir, 'uplink-audit.jsonl');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (_) { say('감사 기록이 아직 없어요 (' + 'uplink-audit.jsonl' + ').'); return E.OK; }
  const rows = [];
  for (const l of text.split('\n')) {
    if (!l) continue;
    let j; try { j = JSON.parse(l); } catch (_) { rows.push(['(읽을 수 없는 줄)', '', '', '', '', '', '']); continue; }
    const f = (v) => (v === null || v === undefined ? '-' : printable(v).slice(0, 40));
    rows.push([f(j.at), f(j.verb), f(j.cmdHash8), f(j.proof), f(j.acct), f(j.status), f(j.reason)]);
  }
  const shown = rows.slice(-tail);
  const head = ['at', 'verb', 'cmdHash8', 'proof', 'acct', 'status', 'reason'];
  const w = head.map((h, i) => Math.max(h.length, ...shown.map((r) => r[i].length)));
  const fmt = (r) => r.map((x, i) => x.padEnd(w[i])).join('  ').trimEnd();
  say(fmt(head));
  for (const r of shown) say(fmt(r));
  say('(' + shown.length + '/' + rows.length + '줄)');
  return E.OK;
}

// ── status ───────────────────────────────────────────────────────────────────────────────────────────────
async function cmdStatus(args) {
  const parsed = parseArgs(args, { value: ['dir'], bool: [] });
  if (parsed.error) return usageError(parsed.error);
  const dir = resolveDir(parsed.o);
  if (!dir) return usageError('--dir 이 폴더가 아니에요');
  const c = loadConfig(dir);
  say('폴더      : ' + dir);
  const lo = KS.tmpLeftovers(dir, PAIR_FILES.concat([KS.PENDING_FILE]));
  if (lo.length) say('임시 파일 흔적 ' + lo.length + '개: ' + lo.map((l) => l.name + (l.alive ? '(쓰는 중?)' : '(주인 없음)')).join(', ') + ' — 비정상 종료의 잔해예요(키 파일 임시본에는 개인키가 들어 있을 수 있어요). 주인 없는 것은 다음 pair/등록 변경 때 자동으로 지워요.');
  if (!c.ok) { say('업링크    : 설정 안 됨 (' + c.why + ')'); return E.OK; }
  const cfg = c.cfg;
  say('업링크    : 설정됨 (서버는 기동 때 uplink.json 을 읽어요 — 바꿨다면 재시작해야 반영돼요)');
  say('boardId   : ' + cfg.boardId);
  say('relay     : ' + cfg.relay + '   visibility ' + cfg.visibility);
  say('rp        : ' + (cfg.rp ? cfg.rp.id + ' (' + cfg.rp.origins.join(', ') + ')' : '(없음 — passkey 명령은 거절돼요)'));
  const k = readKeys(cfg);
  const raw = readKeysRaw(cfg);
  if (!k.ok) say('키 파일   : 읽을 수 없어요 (' + k.reason + ')');
  else {
    say('보드 키 지문: ' + k.boardFp + '   (' + KS.groupFp(k.boardFp) + ')');
    say('등록      : 자격증명 ' + k.credentials.length + ' · 기기 ' + k.devices.length + ' · TOTP ' + (k.totp ? '있음(계정 ' + (k.totp.acct || '없음') + ')' : '없음'));
    say('keysVersion: ' + (raw && Number.isSafeInteger(raw.keysVersion) ? raw.keysVersion : '(없음)'));
  }
  const pq = KS.readPending(cfg.keysFile);
  say('대기열    : 서명된 enroll 명령이 올린 후보 — 자격증명 ' + pq.credentials.length + ' · 기기 ' + pq.devices.length + (pq.credentials.length + pq.devices.length ? '   (등록 전이에요 — enroll --pending 으로 사람이 확인해야 효력이 생겨요)' : '') + (pq.skipped ? '  · 규격 밖 ' + pq.skipped + '개' : ''));
  say('토큰      : ' + (readToken(cfg) ? '있음 (값은 안 보여 줘요)' : '없음 또는 규격 밖'));
  say('TOTP 허용 verb: ' + (cfg.totp ? cfg.totp.verbs.join(', ') || '(없음)' : '(설정 없음 = 고정 표 그대로)'));
  say('             (decision.answer 는 위에 있어도 «결정이 reversibility:two_way 를 선언한 경우에만» TOTP 로 열려요 — 그 밖엔 passkey 가 필요해요)');
  return E.OK;
}

const HELP = [
  '사용법: node uplink/cli.cjs <명령> [옵션]   (공통 옵션 --dir <런타임 폴더>)',
  '  pair --relay <origin> --code XXXX-XXXX [--name <이름>] [--dashboard-url <url>] [--dev]',
  '  keys [--json]                    중계 제안 ↔ 로컬 등록부 비교 (읽기 전용)',
  '  enroll [--pending] [--credential <id>|--device <id>]',
  '  totp-init --acct <이름> [--force]',
  '  revoke --credential <id> | --device <id> | --totp',
  '  audit [--tail N]',
  '  status',
  '종료 코드: 0 정상 · 1 거절/중단 · 2 사용법 오류',
];

async function main(argv) {
  const cmd = argv[0];
  const rest = argv.slice(1);
  const table = { pair: cmdPair, keys: cmdKeys, enroll: cmdEnroll, 'totp-init': cmdTotpInit, revoke: cmdRevoke, audit: cmdAudit, status: cmdStatus };
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') { for (const l of HELP) say(l); return E.OK; }
  if (!cmd || !Object.prototype.hasOwnProperty.call(table, cmd)) { for (const l of HELP) warn(l); return E.USAGE; }
  return table[cmd](rest);
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { stdin.close(); process.exitCode = code; }, (e) => {
    stdin.close();
    warn('내부 오류: ' + printable((e && e.message) || e));
    process.exitCode = E.REFUSED;
  });
}

module.exports = { main, parseRelayOrigin, validatePairResponse, computeDiff, codeMatches };
