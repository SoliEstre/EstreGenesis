'use strict';
// keyset.cjs — 보드 로컬 키 등록부(uplink-keys.json)를 «쓰는» 한 곳. CLI(cli.cjs)와 서명된 등록 명령(exec.cjs)이 같은 함수로 써요.
//
// **왜 한 곳인가.** 읽기는 items.cjs 의 KeyReader 가 맡고(보드가 «사람이 등록한 것만» 믿는 경계), 쓰기는 지금까지 «사람이 손으로 파일을 고치는 것» 이었어요.
//   쓰는 길이 둘(터미널 CLI · 서명된 명령)로 늘면 «검증 규칙 · 잠금 · 원자 교체 · 권한» 을 따로 적게 되고, 그 사본들은 신호 없이 서로 달라져요(한쪽은 작은 위수 점을 받고 한쪽은 안 받는 식).
//   그래서 키 모양 검사(webauthn-verify.checkEnrollKey · seal.kidOf)와 파일 쓰기를 여기 한 벌로 두고 두 길이 같이 불러요.
//
// **신뢰 경계.** 이 파일의 모든 함수는 «보드 로컬 사람(터미널) 또는 이미 등록된 passkey 의 서명» 이 호출한다는 전제예요. 중계가 준 값을 «등록» 으로 바꾸는 함수는 없어요 —
//   중계가 준 것은 normalize* 를 거쳐 «제안» 이 될 뿐이고, 등록부에 앉는 건 사람의 확인(CLI)이나 서명(명령) 뒤예요.
//
// **쓰기 규율.** 같은 파일을 고치는 프로세스가 둘(실행 중인 보드 · CLI)일 수 있어서 ① 파일 잠금(opcmd.acquireFileLock — 형제 모듈과 같은 잠금) ② 읽고-고치고-쓰기를 잠금 «안에서» ③ 임시 파일(0600)에 쓰고
//   fsync 뒤 rename(도중에 죽어도 원본이 온전하거나 새것) ④ 쓴 뒤 권한 재측정이에요. 읽기 쪽(KeyReader)은 mtime+크기로 캐시하니 교체하면 다음 명령부터 새 등록부를 봐요(재시작 불필요).
//   keysVersion 은 쓸 때마다 +1 인 «사람이 보는» 카운터예요(보드는 읽지 않아요 — 봉인 수신자 집합의 버전은 KeyReader 가 따로 계산해요).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OP = require('./opcmd.cjs');
const SEAL = require('./seal.cjs');
const WA = require('./webauthn-verify.cjs');

const MAX_DEVICES = 16;          // items.cjs KeyReader 의 상한과 같아요 — 넘게 쓰면 읽는 쪽이 조용히 잘라 버려서 «등록했는데 없는» 상태가 돼요
const MAX_CREDENTIALS = 64;
const CRED_ID_RE = /^[A-Za-z0-9_-]{1,1400}$/;
const DEVICE_ID_RE = /^[A-Za-z0-9._:@-]{1,64}$/;
const SPKI_P256_PREFIX = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex');

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 사람 눈앞(터미널)이나 파일에 들어가는 이름은 «깨끗한 글자» 만 — 제어문자·ESC 시퀀스·방향 제어·«보이지 않는 서식 문자»(폭 0 공백 · 단어 결합자 · 아랍 문자 표시 U+061C …) · 사설 영역 · 미배정 코드포인트가 든 문장은 거절해요.
//   블록리스트(범위 목록)가 아니라 유니코드 «범주» 로 막는 이유: 범위 목록은 목록 밖의 서식 문자를 놓치고, 눈에 같게 보이는 두 이름이 «다른 계정·다른 키» 처럼 지문 옆에 서는 길이 돼요.
//   (Cc 제어 · Cf 서식 · Cs 단독 서로게이트 · Co 사설 · Cn 미배정 · Zl/Zp 줄·문단 구분자. 한글 · 가나 · 한자 · 라틴 · 일반 공백(Zs)은 통과해요.)
const DIRTY_RE = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}]/u;
const isDirty = (s) => DIRTY_RE.test(s);
const cleanText = (s, min, max) => typeof s === 'string' && s.length >= min && s.length <= max && !isDirty(s);

// 거절 — 코드가 곧 영수증 사유(서명된 등록 명령)이자 CLI 의 메시지 열쇠예요.
class KeysetRefusal extends Error {
  constructor(code, detail) { super(code); this.code = code; this.detail = detail || ''; }
}

// ── 키 모양 ──────────────────────────────────────────────────────────────────────────────────────────────
// 정준 SPKI — P-256 은 91바이트 비압축(opcmd.boardKeyFingerprint · seal.normPublic 과 같은 표기: 압축점으로 들어온 같은 키가 다른 지문을 갖지 않게), 그 밖은 라이브러리의 DER.
function canonSpki(key) {
  if (key.asymmetricKeyType === 'ec') {
    const jwk = key.export({ format: 'jwk' });
    const pad = (s) => { const b = Buffer.from(String(s), 'base64url'); if (b.length > 32) throw new Error('coord'); return Buffer.concat([Buffer.alloc(32 - b.length), b]); };
    return Buffer.concat([SPKI_P256_PREFIX, Buffer.from([0x04]), pad(jwk.x), pad(jwk.y)]);
  }
  return key.export({ type: 'spki', format: 'der' });
}

// 자격증명 지문 = base64url(SHA-256(정준 SPKI)) 앞 22자. 보드 키 지문(boardKeyFingerprint)과 같은 식이라 사람이 «같은 눈» 으로 대조해요. 항상 «로컬에서 계산» — 중계가 준 지문 문자열은 어디에서도 읽지 않아요.
function keyFingerprint(spkiDer) {
  return crypto.createHash('sha256').update(spkiDer).digest('base64url').slice(0, 22);
}
// 사람이 읽는 표기 — 4자씩 묶어요("abcd-efgh-…"). 앞 두 묶음이 짧은 형태("abcd-efgh")예요.
function groupFp(fp) { return String(fp).match(/.{1,4}/g).join('-'); }

const strictB64u = (s, maxChars) => typeof s === 'string' && s.length >= 1 && s.length <= maxChars && /^[A-Za-z0-9_-]+$/.test(s) && Buffer.from(s, 'base64url').toString('base64url') === s;

// 공개키 표기 셋(SPKI · JWK · COSE) 중 «정확히 하나» 를 정준 SPKI 로 — 중계가 어느 표기로 줘도 이후의 지문·저장은 같은 바이트예요.
function keyFromProposal(p) {
  const forms = ['publicKeySpki', 'publicKeyJwk', 'coseKey'].filter((k) => p[k] !== undefined);
  if (forms.length !== 1) return { ok: false, why: '공개키 표기는 publicKeySpki · publicKeyJwk · coseKey 중 정확히 하나여야 해요' };
  let key; let coseAlg = null;
  try {
    if (forms[0] === 'publicKeySpki') {
      if (!strictB64u(p.publicKeySpki, 2048)) return { ok: false, why: 'publicKeySpki 표기' };
      key = crypto.createPublicKey({ key: Buffer.from(p.publicKeySpki, 'base64url'), format: 'der', type: 'spki' });
    } else if (forms[0] === 'publicKeyJwk') {
      const j = p.publicKeyJwk;
      if (!isPlain(j)) return { ok: false, why: 'publicKeyJwk 모양' };
      for (const k of ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k']) if (j[k] !== undefined) return { ok: false, why: 'publicKeyJwk 에 개인키 칸이 있어요' };
      key = crypto.createPublicKey({ key: j, format: 'jwk' });
    } else {
      if (!strictB64u(p.coseKey, 2048)) return { ok: false, why: 'coseKey 표기' };
      const dec = WA.decodeCbor(new Uint8Array(Buffer.from(p.coseKey, 'base64url')));
      if (dec.end !== Buffer.from(p.coseKey, 'base64url').length) return { ok: false, why: 'coseKey 뒤에 남는 바이트' };
      const r = WA.coseToKeyObject(dec.value);
      key = r.key; coseAlg = r.alg;
    }
  } catch (_) { return { ok: false, why: '공개키를 읽을 수 없어요' }; }
  if (key.type !== 'public') return { ok: false, why: '공개키가 아니에요' };
  let spki;
  try { spki = canonSpki(key); } catch (_) { return { ok: false, why: '공개키 정준화 실패' }; }
  return { ok: true, spki, coseAlg };
}

// 자격증명 «제안/요청» 한 건 → {ok, credentialId, alg, spki(b64url), fp, name} | {ok:false, why}. 키 규칙은 검증 쪽(WA.checkEnrollKey)과 같은 함수예요.
function normalizeCredential(p) {
  if (!isPlain(p)) return { ok: false, why: '자격증명 항목이 객체가 아니에요' };
  if (!strictB64u(p.credentialId, 1400) || Buffer.from(p.credentialId, 'base64url').length > 1023) return { ok: false, why: 'credentialId 표기' };
  if (![-7, -8, -257].includes(p.alg)) return { ok: false, why: 'alg 는 -7 · -8 · -257 이어야 해요' };
  if (p.name !== undefined && !cleanText(p.name, 0, 64)) return { ok: false, why: 'name 이 깨끗한 64자 이하 글이 아니에요' };
  const k = keyFromProposal(p);
  if (!k.ok) return k;
  if (k.coseAlg !== null && k.coseAlg !== p.alg) return { ok: false, why: 'COSE alg 와 alg 가 달라요' };
  const chk = WA.checkEnrollKey(p.alg, new Uint8Array(k.spki));
  if (!chk.ok) return { ok: false, why: '이 알고리즘으로 받을 수 없는 키예요(' + chk.code + ')' };
  return { ok: true, credentialId: p.credentialId, alg: p.alg, spki: k.spki.toString('base64url'), fp: keyFingerprint(k.spki), name: typeof p.name === 'string' ? p.name : '' };
}

// 기기(봉인 수신자) «제안/요청» 한 건 → {ok, deviceId, jwk:{kty,crv,x,y}, kid(= 지문), name}. 봉인 키는 P-256 공개키만(seal.cjs 규칙) — 개인키 칸이 있으면 거절.
function normalizeDevice(p) {
  if (!isPlain(p)) return { ok: false, why: '기기 항목이 객체가 아니에요' };
  if (typeof p.deviceId !== 'string' || !DEVICE_ID_RE.test(p.deviceId)) return { ok: false, why: 'deviceId 표기' };
  if (p.name !== undefined && !cleanText(p.name, 0, 64)) return { ok: false, why: 'name 이 깨끗한 64자 이하 글이 아니에요' };
  const j = p.sealPublicJwk;
  if (!isPlain(j) || j.kty !== 'EC' || j.crv !== 'P-256' || typeof j.x !== 'string' || typeof j.y !== 'string') return { ok: false, why: 'sealPublicJwk 는 P-256 공개키여야 해요' };
  for (const k of ['d', 'p', 'q', 'dp', 'dq', 'qi', 'k']) if (j[k] !== undefined) return { ok: false, why: 'sealPublicJwk 에 개인키 칸이 있어요' };
  let kid;
  try { kid = SEAL.kidOf(crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }, format: 'jwk' })); } catch (_) { return { ok: false, why: 'sealPublicJwk 를 키로 읽을 수 없어요' }; }
  return { ok: true, deviceId: p.deviceId, jwk: { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }, kid, name: typeof p.name === 'string' ? p.name : '' };
}

// ── 파일 쓰기 ────────────────────────────────────────────────────────────────────────────────────────────
// 임시 파일(처음부터 0600) → 전부 쓰기 → fsync → rename. 실패하면 임시 파일을 치워요(깨진 흔적이 남지 않게). rename 은 «호출 시점에» fs 에서 찾아 불러요(시험이 순서를 관찰하려고 끼워 넣을 수 있게).
function writeAtomic(file, text, mode) {
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  const buf = Buffer.from(text, 'utf8');
  let fd;
  try {
    fd = fs.openSync(tmp, 'wx', mode === undefined ? 0o600 : mode);
    let off = 0;
    while (off < buf.length) {
      const w = fs.writeSync(fd, buf, off, buf.length - off);
      if (!(w > 0)) throw new Error('no progress');
      off += w;
    }
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(tmp, file);
  } catch (e) {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* noop */ } }
    try { fs.unlinkSync(tmp); } catch (_) { /* noop */ }
    throw e;
  }
}

const sleepSync = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (_) { /* noop */ } };

// 비정상 종료(SIGKILL · 정전)가 남긴 임시 파일 — 임시 이름은 <파일>.tmp-<pid>-<8hex> 라서 pid 가 죽었으면 주인 없는 흔적이에요. 키 파일의 임시본에는 «보드 개인키» 가 들어 있을 수 있어서 남겨 두면 안 되고
//   (윈도우에선 권한도 못 좁혀요), 지우는 건 «pid 가 죽은 것만» 이에요(살아 있는 다른 CLI 가 쓰는 중인 임시 파일은 건드리지 않아요 — 못 지운 것은 status 가 계속 말해요).
const pidAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return !!(e && e.code === 'EPERM'); } };
function tmpLeftovers(dir, bases) {
  const out = [];
  let names;
  try { names = fs.readdirSync(dir); } catch (_) { return out; }
  for (const n of names) {
    for (const b of bases) {
      if (!n.startsWith(b + '.tmp-')) continue;
      const m = /^\.tmp-(\d+)-[0-9a-f]{8}$/.exec(n.slice(b.length));
      if (!m) continue;
      const pid = Number(m[1]);
      out.push({ path: path.join(dir, n), name: n, pid, alive: pid === process.pid ? true : pidAlive(pid) });
    }
  }
  return out;
}
function sweepTmp(dir, bases) {
  const removed = [];
  for (const l of tmpLeftovers(dir, bases)) {
    if (l.alive) continue;
    try { fs.unlinkSync(l.path); removed.push(l.name); } catch (_) { /* 못 지우면 다음 기회 */ }
  }
  return removed;
}

// 읽고-고치고-쓰기를 잠금 «안에서». mutator(raw) 는 파싱된 원본 객체를 «제자리에서» 고쳐요(모르는 칸은 그대로 보존) — 거절하려면 KeysetRefusal 을 던져요.
//   잠금은 비차단이라(opcmd.acquireFileLock) 잠깐 짧게 다시 시도해요(보드와 CLI 가 동시에 쓰는 드문 경우). 끝내 못 얻으면 KeysetRefusal('keys-locked').
//   o.initial — 파일이 «없을 때» 의 시작 객체(대기열 파일처럼 처음엔 없는 것). o.bump === false 면 keysVersion 을 올리지 않아요(키 등록부가 아닌 파일).
function updateJsonFile(file, mutator, o) {
  const opt = o || {};
  const lock = path.resolve(file) + '.lock';
  let held = false;
  for (let i = 0; i < (opt.lockTries || 40); i++) {
    try { OP.acquireFileLock(lock); held = true; break; } catch (_) { sleepSync(50); }
  }
  if (!held) throw new KeysetRefusal('keys-locked');
  try {
    sweepTmp(path.dirname(path.resolve(file)), [path.basename(file)]);
    let raw;
    try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
      if (e && e.code === 'ENOENT' && typeof opt.initial === 'function') raw = opt.initial();
      else throw new KeysetRefusal('keys-unreadable');
    }
    if (!isPlain(raw)) throw new KeysetRefusal('keys-unreadable');
    mutator(raw);
    if (opt.bump !== false) raw.keysVersion = (Number.isSafeInteger(raw.keysVersion) && raw.keysVersion >= 0 ? raw.keysVersion : 0) + 1;
    writeAtomic(file, JSON.stringify(raw, null, 2) + '\n', 0o600);
    return raw;
  } finally {
    try { OP.releaseFileLock(lock); } catch (_) { /* noop */ }
  }
}
const updateKeys = (file, mutator, o) => updateJsonFile(file, mutator, o);

// ── 등록 변경 한 벌 (CLI 와 서명된 명령이 같이 불러요) ─────────────────────────────────────────────────────
const iso = (ms) => new Date(ms).toISOString();

// 자격증명 추가 — 같은 id 이거나 «같은 키» 가 이미 있으면 거절(중복). 상한도 읽는 쪽과 같아요.
function addCredential(raw, c, acct, via, nowMs, confirmedBy) {
  const list = Array.isArray(raw.credentials) ? raw.credentials : (raw.credentials = []);
  if (list.length >= MAX_CREDENTIALS) throw new KeysetRefusal('keys-full');
  for (const x of list) {
    if (isPlain(x) && (x.credentialId === c.credentialId || x.publicKeySpki === c.spki)) throw new KeysetRefusal('credential-already-enrolled');
  }
  const rec = { credentialId: c.credentialId, alg: c.alg, publicKeySpki: c.spki, signCount: 0, acct };
  if (c.name) rec.name = c.name;
  rec.enrolledVia = via;
  rec.enrolledAt = iso(nowMs);
  if (confirmedBy) rec.confirmedBy = confirmedBy;
  list.push(rec);
}

function addDevice(raw, d, via, nowMs, confirmedBy) {
  const list = Array.isArray(raw.devices) ? raw.devices : (raw.devices = []);
  if (list.length >= MAX_DEVICES) throw new KeysetRefusal('keys-full');
  for (const x of list) {
    if (!isPlain(x)) continue;
    let kid = null;
    try { const j = x.sealPublicJwk; kid = SEAL.kidOf(crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }, format: 'jwk' })); } catch (_) { /* 읽을 수 없는 기존 항목은 중복 판정에서 빠져요 */ }
    if (x.deviceId === d.deviceId || kid === d.kid) throw new KeysetRefusal('device-already-enrolled');
  }
  const rec = { deviceId: d.deviceId, sealPublicJwk: d.jwk };
  if (d.name) rec.name = d.name;
  rec.enrolledVia = via;
  rec.enrolledAt = iso(nowMs);
  if (confirmedBy) rec.confirmedBy = confirmedBy;
  list.push(rec);
}

// 자격증명 제거 — 마지막 하나는 «서명된 명령» 으로 못 지워요(passkey 동사가 전부 잠겨서 보드가 서명 경로로 다시 열 수 없어요). 로컬 사람(CLI)은 allowLast 로 지울 수 있어요 —
//   터미널 앞의 사람은 enroll 로 다시 등록할 수 있어서 잠기지 않아요.
function removeCredential(raw, credentialId, allowLast) {
  const list = Array.isArray(raw.credentials) ? raw.credentials : [];
  const i = list.findIndex((x) => isPlain(x) && x.credentialId === credentialId);
  if (i < 0) throw new KeysetRefusal('credential-not-found');
  if (!allowLast && list.length <= 1) throw new KeysetRefusal('last-credential');
  list.splice(i, 1);
}

function removeDevice(raw, deviceId) {
  const list = Array.isArray(raw.devices) ? raw.devices : [];
  const i = list.findIndex((x) => isPlain(x) && x.deviceId === deviceId);
  if (i < 0) throw new KeysetRefusal('device-not-found');
  list.splice(i, 1);
}

// ── 서명된 등록의 «대기열» ─────────────────────────────────────────────────────────────────────────────────────
// **서명된 등록 동사는 키를 «등록» 하지 않고 «대기열(uplink-pending.json)» 에 올려요.** passkey 서명은 «명령 해시» 하나에 대한 것이고, 그 해시가 어떤 화면에서 나왔는지(사람이 «이 키를 등록한다» 를 읽었는지)는 인증기가
//   보여 주지 않아요 — 해시로 바꿔 주는 페이지는 중계가 서빙해요. 그래서 서명만으로 키가 «영구히» 등록부에 앉으면, 중계가 «결정 승인» 으로 보이는 화면에서 한 번 탭을 받아 자기 키를 영구 서명자로(혹은 자기 기기를
//   봉인 수신자로) 만들 수 있어요. 대기열은 그 길을 닫아요: 서명은 «이 키를 후보로 올리는 것» 까지고, 등록부에 넣는 건 보드 터미널 앞의 사람이 지문을 보고 y 를 친 뒤(cli.cjs enroll)예요.
//   폐기(credential.revoke)는 접근을 «좁히기만» 해서 대기열 없이 서명만으로 돼요.
const PENDING_FILE = 'uplink-pending.json';
const MAX_PENDING = 8;       // 한 종류당 — 중계가 탭을 모아 대기열을 가득 채워도 사람이 볼 수 있는 크기로 묶어요
const pendingPath = (keysFile) => path.join(path.dirname(path.resolve(keysFile)), PENDING_FILE);
const pendingInitial = () => ({ version: 1, credentials: [], devices: [] });

function readJsonSafe(file) {
  try { const j = JSON.parse(fs.readFileSync(file, 'utf8')); return isPlain(j) ? j : null; } catch (_) { return null; }
}
function kidOfJwk(j) {
  try { return SEAL.kidOf(crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }, format: 'jwk' })); } catch (_) { return null; }
}

// 대기열 → 모양을 «다시» 검증해 읽어요(파일은 로컬 사용자도 만질 수 있고, 이 값에서 사람 눈앞의 지문이 계산돼요 — 항상 바이트에서 다시). 규격 밖 항목은 세지만(skipped) 보이지 않아요.
function readPending(keysFile) {
  const out = { credentials: [], devices: [], skipped: 0, exists: false };
  const j = readJsonSafe(pendingPath(keysFile));
  if (!j) return out;
  out.exists = true;
  for (const p of (Array.isArray(j.credentials) ? j.credentials : []).slice(0, MAX_PENDING)) {
    const n = isPlain(p) ? normalizeCredential(p) : { ok: false };
    if (!n.ok || typeof p.acct !== 'string' || !/^[A-Za-z0-9._@:-]{1,128}$/.test(p.acct) || typeof p.via !== 'string' || !/^signed:[0-9a-f]{8}$/.test(p.via)) { out.skipped++; continue; }
    out.credentials.push(Object.assign(n, { acct: p.acct, via: p.via, queuedAt: typeof p.queuedAt === 'string' ? p.queuedAt : '' }));
  }
  for (const p of (Array.isArray(j.devices) ? j.devices : []).slice(0, MAX_PENDING)) {
    const n = isPlain(p) ? normalizeDevice(p) : { ok: false };
    if (!n.ok || typeof p.via !== 'string' || !/^signed:[0-9a-f]{8}$/.test(p.via)) { out.skipped++; continue; }
    out.devices.push(Object.assign(n, { via: p.via, queuedAt: typeof p.queuedAt === 'string' ? p.queuedAt : '' }));
  }
  return out;
}

// 서명된 자격증명 등록 → 대기열. 이미 «등록부에» 있으면 credential-already-enrolled · 대기열에 있으면 credential-already-pending · 가득 차면 pending-full.
function queueCredential(keysFile, c, acct, via, nowMs) {
  const keys = readJsonSafe(keysFile);
  if (!keys) throw new KeysetRefusal('keys-unreadable');
  const enrolled = Array.isArray(keys.credentials) ? keys.credentials : [];
  if (enrolled.some((x) => isPlain(x) && (x.credentialId === c.credentialId || x.publicKeySpki === c.spki))) throw new KeysetRefusal('credential-already-enrolled');
  updateJsonFile(pendingPath(keysFile), (p) => {
    const list = Array.isArray(p.credentials) ? p.credentials : (p.credentials = []);
    if (list.some((x) => isPlain(x) && (x.credentialId === c.credentialId || x.publicKeySpki === c.spki))) throw new KeysetRefusal('credential-already-pending');
    if (list.length >= MAX_PENDING) throw new KeysetRefusal('pending-full');
    const rec = { credentialId: c.credentialId, alg: c.alg, publicKeySpki: c.spki };
    if (c.name) rec.name = c.name;
    rec.acct = acct; rec.via = via; rec.queuedAt = iso(nowMs);
    list.push(rec);
  }, { initial: pendingInitial, bump: false });
}
function queueDevice(keysFile, d, via, nowMs) {
  const keys = readJsonSafe(keysFile);
  if (!keys) throw new KeysetRefusal('keys-unreadable');
  const enrolled = Array.isArray(keys.devices) ? keys.devices : [];
  if (enrolled.some((x) => isPlain(x) && (x.deviceId === d.deviceId || (isPlain(x.sealPublicJwk) && kidOfJwk(x.sealPublicJwk) === d.kid)))) throw new KeysetRefusal('device-already-enrolled');
  updateJsonFile(pendingPath(keysFile), (p) => {
    const list = Array.isArray(p.devices) ? p.devices : (p.devices = []);
    if (list.some((x) => isPlain(x) && (x.deviceId === d.deviceId || (isPlain(x.sealPublicJwk) && kidOfJwk(x.sealPublicJwk) === d.kid)))) throw new KeysetRefusal('device-already-pending');
    if (list.length >= MAX_PENDING) throw new KeysetRefusal('pending-full');
    const rec = { deviceId: d.deviceId, sealPublicJwk: d.jwk };
    if (d.name) rec.name = d.name;
    rec.via = via; rec.queuedAt = iso(nowMs);
    list.push(rec);
  }, { initial: pendingInitial, bump: false });
}
// 사람이 확인(등록)했거나 버린 항목을 대기열에서 빼요. 파일이 없으면 할 일 없음.
function dropPending(keysFile, kind, id) {
  if (!fs.existsSync(pendingPath(keysFile))) return;
  const key = kind === 'credential' ? 'credentials' : 'devices';
  const idKey = kind === 'credential' ? 'credentialId' : 'deviceId';
  updateJsonFile(pendingPath(keysFile), (p) => {
    if (Array.isArray(p[key])) p[key] = p[key].filter((x) => !(isPlain(x) && x[idKey] === id));
  }, { initial: pendingInitial, bump: false });
}

// ── 권한 ─────────────────────────────────────────────────────────────────────────────────────────────────
// operator-auth 의 harden 과 같은 접근: 시도한 뒤 «다시 재요». 안 바뀌었으면 그 플랫폼이 이 권한을 표현 못 하는 것 — 「고쳤다」와 「고칠 수 없다」를 같은 침묵으로 두지 않고 호출자가 «한 번» 말해요.
//   (Windows 에서 실측: 파일이 0666 으로 읽히고 chmod 가 반영되지 않아요.) 반환 {gaveUp, modes} — gaveUp 이면 파일 권한으로는 이 비밀을 못 지켜요.
function hardenFiles(files) {
  let gaveUp = false;
  const modes = {};
  for (const p of files) {
    try {
      const before = fs.statSync(p).mode & 0o777;
      if (before & 0o077) {
        try { fs.chmodSync(p, 0o600); } catch (_) { /* 표현 못 하는 플랫폼 — 아래 재측정이 말해요 */ }
      }
      const after = fs.statSync(p).mode & 0o777;
      modes[p] = after;
      if (after & 0o077) gaveUp = true;
    } catch (_) { /* 없으면 할 일 없음 */ }
  }
  return { gaveUp, modes };
}

module.exports = {
  MAX_DEVICES, MAX_CREDENTIALS, CRED_ID_RE, DEVICE_ID_RE,
  KeysetRefusal, cleanText, canonSpki, keyFingerprint, groupFp,
  normalizeCredential, normalizeDevice,
  PENDING_FILE, MAX_PENDING, pendingPath, readPending, queueCredential, queueDevice, dropPending,
  tmpLeftovers, sweepTmp,
  writeAtomic, updateJsonFile, updateKeys, addCredential, addDevice, removeCredential, removeDevice, hardenFiles,
};
