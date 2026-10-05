'use strict';
// items.cjs — 열린 결정 항목을 «봉인된 스냅샷» 으로 바꿔요 (기기 키는 uplink-keys.json, 봉인은 형제 seal.cjs).
//
// **무엇이 나가나.** state.json 의 decisions[] 중 status==='open' 인 항목마다 {itemId, status, rev, sealed?} 한 칸.
//   · **itemId 는 «가명» 이에요** — 'sd:' + HMAC(보드 로컬 비밀, 결정 id) 앞 24 hex. 결정 id 는 실제로 «주제가 담긴 글귀» 라서(설명하는 이름 모양) 그대로 싣으면 봉인 모드에서도 모든 결정의
//     주제가 중계에 보이고 envelope 모드의 «메타만» 이라는 약속이 깨져요. 진짜 id 는 «봉인된 평문 안» 에 들어 있어서 기기가 열어 보고 화면의 항목과 이어요(aad 의 itemId 는 가명).
//     같은 재료(tag)를 투영기가 DECISION_* 프레임의 meta.decision_id('h:'+tag)에도 써서, 중계는 «같은 결정» 임을 이어 볼 수 있어요(내용은 몰라도).
//   · visibility=sealed   — 맥락({question, detail, recommend, recommendChoice, options, kind})을 등록된 모든 기기의 공개키로 봉인해서 «sealed» 에 실어요(중계는 암호문만 봐요).
//   · visibility=envelope — 메타(itemId · status · rev)만. 맥락 자체가 안 나가요.
//   봉인할 수 없는 상황(키 파일 없음·기기 0대)에서 «평문으로 대신» 나가는 길은 없어요 — sealed 칸이 빠진 채 나가고 한 번 말해요(안전하게 틀려요).
//
// **rev — 항목별 단조 증가 정수, 로컬에 영속.** 내용이 바뀌면 +1 이에요. **새 항목(기록 없음)의 첫 rev 는 «시계 바닥» (epoch 밀리초)** 이에요 — 상태 파일을 잃거나 항목 기록이 사라져도 새 rev 가 옛 값 아래로
//   되감기지 않아서(되감기면 «나중 판이 이긴다» 를 믿는 기기·중계가 갱신된 항목을 낡은 판으로 읽어요) 별도 저장소 없이 단조성이 유지돼요. 기록이 있으면 늘 +1 이에요. 판별은 «내용 해시» 로 해요(상태 파일이 매번 통째로 다시 써져도 내용이 같으면 rev 는 안 올라요).
//   내용 해시에는 «수신 기기 집합 + 보드 키» 도 들어가요 — 기기가 늘거나 줄면 봉투가 달라져야 하고(새 기기가 열 수 있어야 하고 빠진 기기가 못 열어야 해요), 달라진 봉투는
//   같은 rev 로 두면 «같은 (aad) 에 두 암호문» 이 생겨서 사용자의 답이 가리키는 판(contextHash)이 모호해져요. 그래서 rev 가 같이 올라요.
//   봉투째 상태 파일에 보관해서, 재시작이 rev 를 되감지도(옛 판이 최신으로 보임) 불필요하게 올리지도 않아요.
//   rev 의 «출처» 는 이 모듈(보드)예요 — 중계가 준 값을 기대값으로 받는 경로는 없어요(seal.cjs 머리말 «신선도»).
//
// **상한.** 봉인 평문은 64KB 까지인데 한 배치(256KB)에 여러 항목이 들어가야 해서 칸마다 상한을 둬요(문자열 16000자 · 선택지 32개×500자). 넘치면 «잘라서» 봉인해요 — 이건
//   «나가도 되는 내용을 줄이는» 방향의 절단이라 안전하고, 사람이 보는 맥락의 끝이 잘릴 수 있다는 건 문서화된 한계예요.

const fs = require('fs');
const crypto = require('crypto');
const SEAL = require('./seal.cjs');
const OP = require('./opcmd.cjs');
const { tagOf, TAG_HEX } = require('./project.cjs');

const MAX_STR = 16000;
const MAX_OPTIONS = 32;
const MAX_OPTION_STR = 500;
const MAX_DEVICES = 16;
const MAX_CREDENTIALS = 64;
const MAX_ITEMS = 2000;                 // 상태 파일 속 항목 기록 상한 — 넘으면 «끝난 것» 부터 지워요
const ITEM_ID_RE = /^[^\x00-\x1f\x7f]{1,200}$/;    // 진짜 id 는 «봉인 평문» 으로만 가요 — 여기선 «내보낼 수 있는 모양인가» 정도만 봐요

const sha256hex = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// ── 키 파일 (읽기 전용 — 쓰기는 다음 레인의 페어링 도구 몫) ───────────────────────────────────────────────
class KeyReader {
  constructor(file, log) { this.file = file; this.log = log; this._sig = null; this._val = null; this._warned = new Set(); }

  _once(key, msg) { if (this._warned.has(key)) return; this._warned.add(key); this.log(msg); }

  // {ok:true, boardPriv, boardPub, boardFp, devices:[{deviceId, kid, pub, name}], credentials:[{credentialId, alg, publicKey(SPKI DER), signCount, acct}], totp:{secretB32, acct}|null, version} | {ok:false, reason, version:'none'}
  read() {
    let st;
    try { st = fs.statSync(this.file); } catch (_) { this._sig = null; this._val = { ok: false, reason: 'no-file', version: 'none' }; this._once('nofile', '[uplink] 키 파일이 없어요 (uplinkKeys) — 맥락을 봉인할 수 없어서 sealed 칸 없이 나가요'); return this._val; }
    const sig = st.mtimeMs + ':' + st.size;
    if (sig === this._sig && this._val) return this._val;
    this._sig = sig;
    this._val = this._parse();
    return this._val;
  }

  _parse() {
    const fail = (reason, msg) => { this._once('bad:' + reason, '[uplink] 키 파일을 쓸 수 없어요 (' + msg + ') — sealed 칸 없이 나가요'); return { ok: false, reason, version: 'none' }; };
    let j;
    try { j = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (_) { return fail('unreadable', '읽기/파싱 실패'); }
    if (!isPlain(j) || !isPlain(j.boardKey) || !isPlain(j.boardKey.privateJwk)) return fail('no-board-key', 'boardKey.privateJwk 없음');
    let boardPriv;
    let boardPub;
    try {
      const jwk = j.boardKey.privateJwk;
      if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || typeof jwk.d !== 'string') throw new Error('not P-256 private');
      boardPriv = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
      boardPub = crypto.createPublicKey(boardPriv);
    } catch (_) { return fail('bad-board-key', 'boardKey 가 P-256 개인키가 아니에요'); }
    let boardFp;
    try { boardFp = OP.boardKeyFingerprint(boardPub); } catch (_) { return fail('bad-board-key', 'boardKey 지문 계산 실패'); }
    const devices = [];
    const seen = new Set();
    const list = Array.isArray(j.devices) ? j.devices : [];
    for (const d of list.slice(0, MAX_DEVICES + 8)) {
      try {
        if (!isPlain(d) || typeof d.deviceId !== 'string' || !d.deviceId || d.deviceId.length > 64) throw new Error('deviceId');
        const jwk = d.sealPublicJwk;
        if (!isPlain(jwk) || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || jwk.d !== undefined) throw new Error('sealPublicJwk');   // d 가 있으면 «개인키가 공개키 자리에» — 거절
        const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, format: 'jwk' });
        const kid = SEAL.kidOf(pub);
        if (seen.has(kid)) continue;
        seen.add(kid);
        devices.push({ deviceId: d.deviceId, kid, pub, name: typeof d.name === 'string' ? d.name.slice(0, 64) : '' });
      } catch (_) { this._once('dev:' + String(d && d.deviceId), '[uplink] 키 파일의 기기 항목 하나가 규격이 아니라 건너뛰었어요'); }
    }
    if (devices.length > MAX_DEVICES) devices.length = MAX_DEVICES;
    // 명령 증명용 등록부 — 같은 파일의 «사람이 등록한» 칸이에요(보드는 읽기만 해요). 봉인 수신자 집합(devices)과 무관해서 아래 «version» 에 안 들어가요:
    //   자격증명·TOTP 를 등록해도 항목이 다시 봉인되거나 전체 스냅샷이 가지 않아요.
    const credentials = [];
    const credSeen = new Set();
    for (const c of (Array.isArray(j.credentials) ? j.credentials : []).slice(0, MAX_CREDENTIALS + 8)) {
      try {
        if (!isPlain(c) || typeof c.credentialId !== 'string' || !c.credentialId || c.credentialId.length > 1400) throw new Error('credentialId');
        if (Buffer.from(c.credentialId, 'base64url').toString('base64url') !== c.credentialId) throw new Error('credentialId 표기');
        if (credSeen.has(c.credentialId)) continue;
        if (![-7, -8, -257].includes(c.alg)) throw new Error('alg');
        if (typeof c.publicKeySpki !== 'string' || !c.publicKeySpki) throw new Error('publicKeySpki');
        const spki = Buffer.from(c.publicKeySpki, 'base64url');
        if (spki.toString('base64url') !== c.publicKeySpki || spki.length < 32 || spki.length > 1024) throw new Error('publicKeySpki 표기');
        const signCount = c.signCount === undefined ? 0 : c.signCount;
        if (!Number.isSafeInteger(signCount) || signCount < 0 || signCount > 0xffffffff) throw new Error('signCount');
        const acct = c.acct === undefined ? null : c.acct;
        if (acct !== null && (typeof acct !== 'string' || acct.length < 1 || acct.length > 128)) throw new Error('acct');
        credSeen.add(c.credentialId);
        credentials.push({ credentialId: c.credentialId, alg: c.alg, publicKey: new Uint8Array(spki), signCount, acct });
      } catch (_) { this._once('cred:' + String(c && c.credentialId).slice(0, 20), '[uplink] 키 파일의 자격증명 항목 하나가 규격이 아니라 건너뛰었어요'); }
    }
    if (credentials.length > MAX_CREDENTIALS) credentials.length = MAX_CREDENTIALS;
    let totp = null;
    if (isPlain(j.totp)) {
      const t = j.totp;
      if (typeof t.secretB32 === 'string' && t.secretB32 && t.secretB32.length <= 1024 && (t.acct === undefined || (typeof t.acct === 'string' && t.acct.length >= 1 && t.acct.length <= 128))) {
        totp = { secretB32: t.secretB32, acct: t.acct === undefined ? null : t.acct };
      } else this._once('totp', '[uplink] 키 파일의 totp 항목이 규격이 아니라 건너뛰었어요');
    }
    // 키 집합의 «버전» — 같은 기기들·같은 보드 키면 같은 값(순서 무관). 하트비트가 싣고, 바뀌면 전체 스냅샷을 다시 보내요.
    const version = sha256hex(boardFp + '\n' + devices.map((x) => x.kid).sort().join(',')).slice(0, 12);
    return { ok: true, boardPriv, boardPub, boardFp, devices, credentials, totp, version };
  }
}

// ── 결정 항목 동기 ────────────────────────────────────────────────────────────────────────────────────────
function contentOf(d) {
  const c = {};
  const s = (v) => (typeof v === 'string' ? (v.length > MAX_STR ? v.slice(0, MAX_STR) : v) : undefined);
  for (const k of ['id', 'question', 'detail', 'recommend', 'recommendChoice', 'kind']) { const v = s(d[k]); if (v !== undefined) c[k] = v; }
  if (Array.isArray(d.options)) c.options = d.options.filter((x) => typeof x === 'string').slice(0, MAX_OPTIONS).map((x) => (x.length > MAX_OPTION_STR ? x.slice(0, MAX_OPTION_STR) : x));
  return c;
}

class DecisionSync {
  constructor(o) {
    this.boardId = o.boardId;
    this.visibility = o.visibility;
    this.store = o.store;
    if (!o.store || typeof o.store.secret !== 'string') throw new Error('DecisionSync: store.secret 이 필요해요 (store.open() 뒤에 만드세요)');
    this.keys = o.keys;
    this.log = o.log;
    this.clock = o.clock || { now: () => Date.now() };
    this._warned = new Set();
    this.keysVersion = null;       // 마지막 동기 때 본 키 집합 버전
    this.openCount = 0;
  }

  _once(key, msg) { if (this._warned.has(key)) return; this._warned.add(key); this.log(msg); }

  // 상태 텍스트 → {changes, keysChanged, openCount} | null(파싱 불가 — 아무것도 바꾸지 않아요)
  run(stateText) {
    let st;
    try { st = JSON.parse(stateText); } catch (_) { return null; }
    // «상태를 못 읽었다» 와 «열린 결정이 없다» 는 달라요 — 서버가 파일이 없을 때 주는 {"error":...} 를 «전부 해소됨» 으로 읽으면 열린 항목 전부에 종결 통지가 나가요.
    if (!isPlain(st) || st.error !== undefined) return null;
    const decisions = st && Array.isArray(st.decisions) ? st.decisions : [];
    const keyInfo = this.visibility === 'sealed' ? this.keys.read() : { ok: true, version: 'envelope' };
    const keysChanged = this.keysVersion !== null && this.keysVersion !== keyInfo.version;
    this.keysVersion = keyInfo.version;
    const items = this.store.state.items;
    const changes = [];
    const openIds = new Set();
    for (const d of decisions) {
      if (!isPlain(d) || d.status !== 'open' || typeof d.id !== 'string' || !ITEM_ID_RE.test(d.id)) {
        if (isPlain(d) && d.status === 'open') this._once('id:' + String(d.id).slice(0, 40), '[uplink] 결정 항목 id 가 규격이 아니라(제어문자 없는 200자 이하) 내보내지 않아요');
        continue;
      }
      const itemId = 'sd:' + tagOf(this.store.secret, d.id);
      if (openIds.has(itemId)) continue;
      openIds.add(itemId);
      const content = contentOf(d);
      // boardId 도 내용의 일부예요 — 봉투의 aad 에 들어가는 값이라, 보드 id 가 바뀌면 «같은 내용» 이어도 새 aad 로 다시 봉인해야 기기가 열 수 있어요.
      const hash = sha256hex(JSON.stringify(content) + '\n' + this.visibility + '\n' + this.boardId + '\n' + (this.visibility === 'sealed' ? keyInfo.version : '-'));
      const rec = items[itemId];
      if (rec && rec.status === 'open' && rec.hash === hash) continue;
      const rev = rec ? rec.rev + 1 : Math.max(1, Math.floor(this.clock.now()));       // 시계 바닥(epoch 밀리초) — 초 단위면 «같은 초 안의 연속 변경» 이 바닥을 넘어 옛 값보다 작아질 수 있어요
      let sealed;
      if (this.visibility === 'sealed') {
        if (keyInfo.ok && keyInfo.devices.length) {
          try {
            sealed = SEAL.seal(Buffer.from(JSON.stringify(content), 'utf8'), { boardId: this.boardId, itemId, rev, v: 1 }, keyInfo.devices.map((x) => x.pub), { signKey: keyInfo.boardPriv });
          } catch (e) { this._once('seal:' + itemId, '[uplink] 봉인에 실패했어요(' + (e && e.code ? e.code : 'error') + ') — 이 항목은 sealed 칸 없이 나가요'); }
        } else if (keyInfo.ok) this._once('nodev', '[uplink] 등록된 기기가 없어서 맥락을 봉인할 수 없어요 — sealed 칸 없이 나가요');
      }
      items[itemId] = { rev, hash, status: 'open', sealed };
      changes.push(this._entry(itemId));
    }
    // 열린 목록에서 사라진 항목(resolved 로 바뀜 · 삭제됨) — 종결 통지. rev 를 올려서 «나중 것이 이긴다» 가 성립해요.
    for (const itemId of Object.keys(items)) {
      const rec = items[itemId];
      if (rec.status !== 'open' || openIds.has(itemId)) continue;
      rec.rev += 1;
      rec.status = 'resolved';
      delete rec.sealed;
      changes.push({ itemId, status: 'resolved', rev: rec.rev });
    }
    // 기록 상한 — 끝난 항목부터 지워요(열린 항목의 rev 를 잃으면 되감겨요).
    const ids = Object.keys(items);
    if (ids.length > MAX_ITEMS) {
      for (const id of ids) { if (Object.keys(items).length <= MAX_ITEMS) break; if (items[id].status !== 'open') delete items[id]; }
    }
    this.openCount = openIds.size;
    if (changes.length) this.store.save();
    return { changes, keysChanged, openCount: this.openCount };
  }

  _entry(itemId) {
    const rec = this.store.state.items[itemId];
    const e = { itemId, status: rec.status, rev: rec.rev };
    if (rec.status === 'open' && rec.sealed) e.sealed = rec.sealed;
    return e;
  }

  // 열린 항목 전부(재접속·키 변경 때의 full 스냅샷 재료).
  fullEntries() {
    const out = [];
    for (const itemId of Object.keys(this.store.state.items)) if (this.store.state.items[itemId].status === 'open') out.push(this._entry(itemId));
    return out;
  }
}

module.exports = { KeyReader, DecisionSync, contentOf, ITEM_ID_RE, TAG_HEX };
