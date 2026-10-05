'use strict';
// webauthn-verify.cjs — OperatorCommand 의 증명(proof) 한 종류: WebAuthn «assertion» 검증 (+ 등록용 최소 CBOR/COSE 파서).
//
// **이 파일의 몫.** opcmd.cjs 가 1~4단계(형식 · audience · 시간 · nonce)를 소유하고, 이 파일은 그 사이에 끼는
//   6~10단계를 소유해요. 5단계(verb × proof-kind 정책)는 이후 모듈 몫이라 번호만 비워 뒀어요.
//     6 proof 모양 + 이 보드에 «등록된» 자격증명인가
//     7 clientDataJSON — type · challenge(= 명령 해시) · origin · cross-origin 표지
//     8 authenticatorData — rpIdHash · UP · UV · AT/ED · 길이
//     9 signCount — 복제 의심(역행)
//    10 서명 — authenticatorData || SHA-256(clientDataJSON) 위의 서명, 등록된 알고리즘으로만
//   **nonce 는 이 모든 검사를 통과한 «뒤에» 소비돼요** (opcmd.cjs 머리말과 같은 규율). 그래서 이 파일은 nonce 원장을
//   만지지 않고, signCount 도 «갱신하지 않아요» — 검증은 읽기 전용이에요. 새 signCount 는 결과에 실어 돌려줘요.
//   검증이 저장까지 하면 «거절된 명령»이 카운터를 올려서 정당한 다음 명령을 역행으로 만들 수 있어요(공격자가 카운터를
//   미리 소모시키는 길) — 그래서 저장은 «검증을 통과한 뒤» 호출자가 해요.
//
// **신선도(freshness)는 이 파일이 주지 않아요 — 호출자 의무.** challenge 는 보드가 새로 낸 난수가 아니라 «발행자가 쓴
//   명령 텍스트(nonce 포함)의 해시» 예요. 그래서 같은 proof 로 verifyAssertion 을 두 번 부르면 «두 번 다 ok» 가
//   나와요(읽기 전용이라 상태가 없어요). 재전송을 막는 건 전부 호출자 쪽이에요:
//     1) opcmd 의 시간(3단계)과 nonce(4단계)를 거치고,
//     2) 이 함수가 ok 를 낸 뒤 consumeNonce 와 «같은 임계구역에서» signCount 를 저장해요.
//        저장은 «읽었던 저장값과 같을 때만 쓰는» 비교-후-교체(CAS)로 해요 — 같은 카운터 +1 을 가진 두 서명이 동시에
//        검증을 통과해도 하나만 저장에 성공해요. 명령 «실행» 뒤로 미루면 실행 실패 사이에 두 번째가 통과해요.
//     3) nonce 원장은 재시작을 넘어 남아야 해요(opcmd 의 NonceLedger 는 줄마다 fsync). 원장이 시간 창 안에서 사라지면
//        붙잡아 둔 봉투가 다시 통과해요 — 이 파일은 그걸 막을 수 없어요.
//
// **규격보다 «엄격한» 자리(독립 구현이 같은 판정을 하려면 이 목록을 따라야 해요).**
//   · clientDataJSON 맨 앞의 UTF-8 BOM 은 거절해요(일부 디코더는 조용히 벗겨요 — 서명자가 본 바이트와 해석이 갈라지는 자리).
//   · authenticatorData 의 예약 플래그 비트(0x02·0x20)와 «BS(0x10)인데 BE(0x08) 아님» 은 bad-auth-data 예요(L3 §7.2 의 BS/BE 규칙).
//     BE 가 «등록 때 기록한 값과 같은가» 는 보지 않아요 — 레코드에 backupEligible 필드가 없어요.
//   · RSA 키는 모듈러스 2048..8192 비트·홀수, 지수는 홀수·≥3·8바이트 이하예요. «어느 저장 표기(COSE·SPKI·KeyObject)로
//     들어오든» 같은 규칙이에요 — 지수 1 이면 서명 자리에 패딩된 해시를 그대로 적은 위조가 통과해요.
//   · Ed25519 공개키는 «작은 위수» 점(위수 1·2·4·8)과 비정준 철자(y ≥ 2^255-19)를 거절해요 — 그런 키는 어떤 메시지에도
//     통과하는 서명이 개인키 없이 만들어져요. 등록(COSE·attested)과 검증(레코드 해석) 양쪽이 같은 함수를 써요.
//   · 올바른 종류인데 곡선·크기가 틀린 키(P-384 + alg -7, RSA-1024 + alg -257)는 unsupported-key 이고, 종류 자체가
//     다른 키(EC 키 + alg -257 등)는 alg-mismatch 예요.
//   · 검사 순서(6 → 7 → 8 → 9 → 10)도 규범이에요: 여러 결함이 겹친 입력의 «코드와 단계» 는 가장 이른 단계의 것이에요.
//
// **신뢰 경계.** 공개키는 «이 보드 로컬에서 사람이 등록한 것» 만 믿어요(ctx.credentials). 중계 서비스가 보내온 키·알고리즘·
//   자격증명 메타는 어디에서도 읽지 않아요. 알고리즘도 proof 가 아니라 «등록 레코드» 에서 와요 — proof 가 알고리즘을
//   고르게 두면 서명자가 검증 방식을 고르는 거라서요.
//
// **UV 는 항상 필수예요.** OperatorCommand 는 «사람이 그 자리에서 확인했다» 가 전제라서, 레코드의 uvRequired 같은 완화 표지를
//   읽지 않아요(그런 필드는 무시돼요). 존재 확인(UP)만으로는 «기기를 훔친 사람» 과 구별되지 않아요.
//
// **가산 규율.** 서버 코드를 require 하지 않는 휴면 라이브러리예요(deps-0, node 내장만). 시계를 읽지 않고, 파일·네트워크도
//   안 써요. 입력 탓의 실패는 던지지 않고 {ok:false, code, step} 로 돌려줘요. 던지는 건 «호출자 코드의 잘못»(ctx 모양)뿐이에요.
//   등록 도우미(decodeCbor · coseToKeyObject · parseAttestedCredentialData)는 이 파일에 같이 둬요 — 설치본에서 파일 하나가
//   빠져 «검증은 되는데 등록이 안 되는» 배치가 생기지 않게요. attestation statement 검증은 범위 밖이에요(보드에서의 등록은
//   사람이 로컬에서 하는 행위라 attestation 'none' 을 받아요). 등록 의식(ceremony) 배선은 별도 모듈 몫이고 여기엔 파서만 있어요.

const crypto = require('crypto');

const STEP = Object.freeze({ PROOF: 6, CLIENT_DATA: 7, AUTH_DATA: 8, COUNTER: 9, SIGNATURE: 10 });

const MAX_CLIENT_DATA = 2048;      // 바이트 — 브라우저가 만드는 clientDataJSON 은 수백 바이트예요
const MAX_AUTH_DATA = 4096;        // 바이트 — 확장(ED)이 있어도 이 안이에요
const MAX_FIELD_CHARS = 16384;     // proof 필드 하나(base64url 문자열)의 길이 상한 — 디코드 «전에» 재요
const MAX_CRED_ID = 1023;          // WebAuthn 상한
const MAX_UINT32 = 0xffffffff;

const FLAG_UP = 0x01;
const FLAG_RFU1 = 0x02;
const FLAG_UV = 0x04;
const FLAG_BE = 0x08;
const FLAG_BS = 0x10;
const FLAG_RFU5 = 0x20;
const FLAG_AT = 0x40;
const FLAG_ED = 0x80;

const ALG_ES256 = -7;
const ALG_EDDSA = -8;
const ALG_RS256 = -257;
const ALGS = Object.freeze([ALG_ES256, ALG_EDDSA, ALG_RS256]);

// 모든 거절 코드의 정본. WebauthnError 는 이 표에 없는 코드를 만들지 못해요(생성자가 던져요) — «적지 않은 코드가
//   던져지는» 드리프트를 구조로 막고, 반대 방향(적었는데 아무도 안 내는 코드)은 검사가 양방향으로 재요.
const REJECT_CODES = Object.freeze({
  'bad-proof': 'proof 의 키 집합·kind·base64url 표기(패딩·비정준·허용 밖 문자)가 규격과 달라요',
  'credential-not-enrolled': '이 보드에 등록된 자격증명이 아니에요 (본인 키만 조회 — 프로토타입 키 불가)',
  'bad-credential-record': '보드 로컬 등록 레코드가 손상됐어요 (알고리즘·signCount·공개키 형식) — 입력이 아니라 저장소 탓이라 닫힌 채 실패',
  'bad-client-data': 'clientDataJSON 이 2048 바이트를 넘거나 UTF-8·JSON 이 아니거나 같은 키가 두 번 나와요',
  'bad-type': 'clientData.type 이 webauthn.get 이 아니에요',
  'challenge-mismatch': 'clientData.challenge 가 이 명령의 해시와 달라요 (또는 정준 base64url 이 아니에요)',
  'origin-mismatch': 'clientData.origin 이 허용 목록의 어느 값과도 «정확히» 같지 않아요',
  'cross-origin': 'crossOrigin 이 true 이거나 false 가 아닌 값이거나 topOrigin 이 있어요',
  'bad-auth-data': 'authenticatorData 의 길이·플래그(AT·예약 비트·BS)·확장 CBOR 이 규격과 달라요',
  'rpid-mismatch': 'authenticatorData 의 rpIdHash 가 이 보드의 rpId 해시와 달라요',
  'user-not-present': 'UP(사용자 존재) 플래그가 꺼져 있어요',
  'user-not-verified': 'UV(사용자 검증) 플래그가 꺼져 있어요 — OperatorCommand 는 UV 필수',
  'counter-regression': 'signCount 가 저장된 값 이하로 되돌아갔어요 (복제 의심)',
  'alg-mismatch': '등록된 알고리즘과 공개키 종류(또는 COSE 가 말하는 알고리즘)가 안 맞아요',
  'unsupported-key': '지원하지 않는 키예요 (곡선·RSA 2048 미만·COSE 형식 오류·곡선 위의 점 아님)',
  'bad-signature': '서명이 DER/길이 형식이 아니거나 검증에 실패했어요',
  'bad-cbor': 'CBOR 이 지원 부분집합 밖이거나 손상됐어요 (부정 길이·중복 키·부동소수·태그·깊이·항목 수·잘림)',
});

class WebauthnError extends Error {
  constructor(code, detail, step) {
    if (!Object.prototype.hasOwnProperty.call(REJECT_CODES, code)) {
      throw new TypeError('WebauthnError: REJECT_CODES 에 없는 코드 ' + String(code));
    }
    super(detail ? code + ': ' + detail : code);
    this.name = 'WebauthnError';
    this.code = code;
    this.step = step;
  }
}
const reject = (code, detail) => new WebauthnError(code, detail);
const fail = (code, step) => ({ ok: false, code, step });

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// «본인 키» 읽기 — Object.prototype 이 오염돼도(어딘가에서 .alg 가 생겨도) 레코드·clientData 판정이 안 흔들려요.
const own = (o, k) => (o !== null && typeof o === 'object' && hasOwn(o, k) ? o[k] : undefined);

function isPlainObject(v) {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const p = Object.getPrototypeOf(v);
  return p === Object.prototype || p === null;
}

const sha256 = (...parts) => { const h = crypto.createHash('sha256'); for (const p of parts) h.update(p); return h.digest(); };

// 길이를 «먼저» 비교하고 같은 길이일 때만 timingSafeEqual 을 불러요(길이가 다르면 던져요). challenge 는 비밀은 아니지만
//   «어디까지 맞았나» 를 시간으로 흘릴 이유가 없어서 같은 함수로 통일해요.
function ctEqual(a, b) {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ─────────────────────────────────────────────────────────────────────────────
// base64url — 엄격
// ─────────────────────────────────────────────────────────────────────────────

const B64URL_RE = /^[A-Za-z0-9_-]*$/;

// 허용 문자만 · 패딩 없음 · «다시 인코딩하면 같은 글자». 마지막 글자의 남는 비트나 길이 4n+1 같은 비정준 철자가
//   «같은 바이트의 다른 이름» 이 되면 자격증명 조회와 challenge 비교가 철자 수만큼 우회돼요.
function b64urlDecodeStrict(s) {
  if (typeof s !== 'string' || s.length > MAX_FIELD_CHARS || !B64URL_RE.test(s)) return null;
  const b = Buffer.from(s, 'base64url');
  return b.toString('base64url') === s ? b : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CBOR (WebAuthn 이 쓰는 부분집합) — 엄격 디코더
// ─────────────────────────────────────────────────────────────────────────────

const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const CBOR_UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

// 지원: 부호 없는/음의 정수(크기 ≤ 2^53-1) · 바이트열 · 텍스트(UTF-8 엄격) · 배열 · 맵(정의된 길이만, 중복 키 거절,
//   키는 정수/텍스트만) · false/true/null. 거절: 부정 길이 · 부동소수 · 태그 · undefined · 그 밖의 simple · 예약된 추가 정보.
//   값은 Map(맵) · Buffer(바이트열) · Number · string · Array · true/false/null 로 돌려줘요. Map 을 쓰는 이유: COSE 키는
//   정수 키를 쓰는데 평범한 객체는 키를 문자열로 바꾸고 «__proto__» 같은 이름을 특별 취급해요.
// 적대적 입력 방어: 선언 길이는 «남은 바이트 수» 와 먼저 비교해서(원소는 최소 1바이트) 거대한 선언이 할당·반복을 못
//   일으키게 하고, 깊이는 «재귀하기 전에» 재고, 항목 수 상한이 총량을 막아요.
function decodeCbor(buf, opts) {
  if (!(buf instanceof Uint8Array)) throw reject('bad-cbor', 'input is not bytes');
  const o = opts || {};
  const maxDepth = o.maxDepth === undefined ? 8 : o.maxDepth;
  const maxItems = o.maxItems === undefined ? 4096 : o.maxItems;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 1 || maxDepth > 64) throw new TypeError('decodeCbor: maxDepth 는 1..64 의 정수예요');
  if (!Number.isSafeInteger(maxItems) || maxItems < 1) throw new TypeError('decodeCbor: maxItems 는 양의 정수예요');
  const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = 0;
  let items = 0;

  const need = (n) => { if (!(n <= b.length - pos)) throw reject('bad-cbor', 'truncated'); };

  function readArg(info) {
    if (info < 24) return info;
    if (info === 24) { need(1); return b[pos++]; }
    if (info === 25) { need(2); const v = b.readUInt16BE(pos); pos += 2; return v; }
    if (info === 26) { need(4); const v = b.readUInt32BE(pos); pos += 4; return v; }
    if (info === 27) {
      need(8);
      const hi = b.readUInt32BE(pos);
      const lo = b.readUInt32BE(pos + 4);
      pos += 8;
      if (hi > 0x1fffff) throw reject('bad-cbor', 'integer beyond 2^53-1');
      return hi * 4294967296 + lo;
    }
    // 28..30 예약, 31 = 부정 길이/break — 둘 다 받지 않아요(부정 길이는 같은 값의 다른 바이트열을 만들고 길이 검사를 우회해요)
    throw reject('bad-cbor', info === 31 ? 'indefinite length' : 'reserved additional info');
  }

  function item(depth) {
    if (++items > maxItems) throw reject('bad-cbor', 'too many items');
    need(1);
    const head = b[pos++];
    const major = head >> 5;
    const info = head & 0x1f;
    switch (major) {
      case 0: return readArg(info);
      case 1: {
        const n = readArg(info);
        if (n > MAX_SAFE - 1) throw reject('bad-cbor', 'integer beyond 2^53-1');
        return -1 - n;
      }
      case 2: {
        const len = readArg(info);
        need(len);
        const v = Buffer.from(b.subarray(pos, pos + len));
        pos += len;
        return v;
      }
      case 3: {
        const len = readArg(info);
        need(len);
        let s;
        try { s = CBOR_UTF8.decode(b.subarray(pos, pos + len)); } catch (_) { throw reject('bad-cbor', 'invalid UTF-8'); }
        pos += len;
        return s;
      }
      case 4: {
        if (depth + 1 > maxDepth) throw reject('bad-cbor', 'too deep');
        const n = readArg(info);
        need(n);                                   // 원소는 최소 1바이트
        const arr = [];
        for (let i = 0; i < n; i++) arr.push(item(depth + 1));
        return arr;
      }
      case 5: {
        if (depth + 1 > maxDepth) throw reject('bad-cbor', 'too deep');
        const n = readArg(info);
        need(n * 2);                               // 키 1 + 값 1 최소 2바이트
        const map = new Map();
        for (let i = 0; i < n; i++) {
          const k = item(depth + 1);
          if (typeof k !== 'number' && typeof k !== 'string') throw reject('bad-cbor', 'map key must be an integer or text');
          if (map.has(k)) throw reject('bad-cbor', 'duplicate map key');
          map.set(k, item(depth + 1));
        }
        return map;
      }
      case 6: throw reject('bad-cbor', 'tags are not supported');
      default: {                                   // major 7
        if (info === 20) return false;
        if (info === 21) return true;
        if (info === 22) return null;
        throw reject('bad-cbor', 'floats / undefined / other simple values are not supported');
      }
    }
  }

  const value = item(0);
  return { value, end: pos };
}

// ─────────────────────────────────────────────────────────────────────────────
// COSE 공개키 → KeyObject
// ─────────────────────────────────────────────────────────────────────────────

const unsupported = (detail) => reject('unsupported-key', detail);

function bitLength(buf) {
  let i = 0;
  while (i < buf.length && buf[i] === 0) i++;
  if (i === buf.length) return 0;
  return (buf.length - i) * 8 - (Math.clz32(buf[i]) - 24);
}

function bytesArg(m, k, name) {
  const v = m.get(k);
  if (!Buffer.isBuffer(v)) throw unsupported(name + ' is missing or not a byte string');
  return v;
}

// RSA 규칙 한 벌 — COSE 로 들어온 키와 SPKI/KeyObject 로 저장된 키가 «같은 규칙» 을 받아요. 한쪽에만 두면 같은 불변식이
//   저장 표기에 따라 다른 판정을 내요(지수 1 은 Node 가 기꺼이 만들어 주고, 그 키의 «서명» 은 패딩된 해시 그 자체예요).
function assertRsaParams(n, e) {
  const bits = bitLength(n);
  if (bits < 2048 || bits > 8192) throw unsupported('RSA modulus must be 2048..8192 bits');
  if ((n[n.length - 1] & 1) === 0) throw unsupported('RSA modulus must be odd');
  if (e.length < 1 || e.length > 8 || (e[e.length - 1] & 1) === 0 || bitLength(e) < 2) throw unsupported('RSA exponent must be odd and >= 3 (up to 8 bytes)');
}

// Ed25519 공개키 한 벌 — 32 바이트 little-endian 에서 맨 위 비트(x 의 부호)를 떼고 y 만 봐요.
//   · y ≥ p(=2^255-19) 는 같은 점의 «다른 철자» 라서 거절해요(정준 철자만).
//   · y ∈ {0, 1, p-1, y8a, y8b} 는 작은 위수 점이에요: 위수 4(y=0) · 1(y=1) · 2(y=p-1) · 8(y8a, y8b — 부호 둘씩).
//     이 점 A 에서는 [S]B = R + [k]A 가 R=항등원·S=0 으로 («[k]A = 항등원» 이 되는) 메시지마다 성립해서, 개인키 없이 서명이
//     만들어져요. OpenSSL 은 이 키를 그대로 받아요. y8a/y8b 는 8·P = 항등원 인 두 점의 y 예요(독립 검산은 생성기에 있어요).
const ED_P = (1n << 255n) - 19n;
const ED_SMALL_Y = new Set([
  0n, 1n, ED_P - 1n,
  0x05fc536d880238b13933c6d305acdfd5f098eff289f4c345b027b2c28f95e826n,
  0x7a03ac9277fdc74ec6cc392cfa53202a0f67100d760b3cba4fd84d3d706a17c7n,
]);
function assertEd25519Point(raw) {
  if (!Buffer.isBuffer(raw) || raw.length !== 32) throw unsupported('Ed25519 key must be 32 bytes');
  let y = 0n;
  for (let i = 31; i >= 0; i--) y = (y << 8n) | BigInt(i === 31 ? raw[i] & 0x7f : raw[i]);
  if (y >= ED_P) throw unsupported('Ed25519 key is not in canonical form');
  if (ED_SMALL_Y.has(y)) throw unsupported('Ed25519 key has small order');
}

// 알고리즘은 COSE 안의 alg(3) 를 «필수»로 읽어요 — 키 종류가 곧 알고리즘을 정해 주지만(P-256 → ES256) alg 가 없거나
//   다르면 «다른 알고리즘으로 쓰일 키» 라는 신호라서 거절해요. 곡선 위의 점인지는 createPublicKey 가 확인해요.
function coseToKeyObject(cose) {
  if (!(cose instanceof Map)) throw unsupported('COSE key must be a map');
  const kty = cose.get(1);
  const alg = cose.get(3);
  let jwk;
  if (kty === 2) {
    if (alg !== ALG_ES256) throw unsupported('EC2 key needs alg -7');
    if (cose.get(-1) !== 1) throw unsupported('only P-256 (crv 1) is supported');
    const x = bytesArg(cose, -2, 'x');
    const y = bytesArg(cose, -3, 'y');
    if (x.length !== 32 || y.length !== 32) throw unsupported('P-256 coordinates must be 32 bytes');
    jwk = { kty: 'EC', crv: 'P-256', x: x.toString('base64url'), y: y.toString('base64url') };
  } else if (kty === 1) {
    if (alg !== ALG_EDDSA) throw unsupported('OKP key needs alg -8');
    if (cose.get(-1) !== 6) throw unsupported('only Ed25519 (crv 6) is supported');
    const x = bytesArg(cose, -2, 'x');
    assertEd25519Point(x);
    jwk = { kty: 'OKP', crv: 'Ed25519', x: x.toString('base64url') };
  } else if (kty === 3) {
    if (alg !== ALG_RS256) throw unsupported('RSA key needs alg -257');
    const n = bytesArg(cose, -1, 'n');
    const e = bytesArg(cose, -2, 'e');
    assertRsaParams(n, e);
    jwk = { kty: 'RSA', n: n.toString('base64url'), e: e.toString('base64url') };
  } else {
    throw unsupported('unsupported kty');
  }
  let key;
  try { key = crypto.createPublicKey({ key: jwk, format: 'jwk' }); } catch (_) { throw unsupported('key rejected by the crypto library (point not on curve?)'); }
  return { key, alg };
}

// ─────────────────────────────────────────────────────────────────────────────
// 등록 authenticatorData (AT) 파서
// ─────────────────────────────────────────────────────────────────────────────

// 확장 CBOR(ED)은 «끝까지 정확히» 파싱돼야 하고 맵이어야 해요. assertion 과 registration 이 같은 함수를 써요.
function checkExtensions(rest) {
  let dec;
  try { dec = decodeCbor(rest); } catch (e) {
    if (e instanceof WebauthnError) throw reject('bad-auth-data', 'extensions: ' + e.message);
    throw e;
  }
  if (dec.end !== rest.length) throw reject('bad-auth-data', 'trailing bytes after extensions');
  if (!(dec.value instanceof Map)) throw reject('bad-auth-data', 'extensions must be a map');
}

// 등록 authData = rpIdHash(32) | flags(1) | signCount(4) | aaguid(16) | credIdLen(2) | credId | COSE 공개키 [| 확장].
//   attestation statement 는 여기 없어요(attestationObject 바깥 층이고 이 보드는 'none' 을 받아요). rpIdHash·UP·UV 의
//   판정은 호출자 몫이에요 — 이 함수는 «구조를 읽는 것» 만 해요.
function parseAttestedCredentialData(authData) {
  if (!(authData instanceof Uint8Array)) throw reject('bad-auth-data', 'not bytes');
  const a = Buffer.from(authData.buffer, authData.byteOffset, authData.byteLength);
  if (a.length < 55) throw reject('bad-auth-data', 'too short for attested credential data');
  const flags = a[32];
  if (!(flags & FLAG_AT)) throw reject('bad-auth-data', 'AT flag not set');
  const credIdLen = a.readUInt16BE(53);
  if (credIdLen < 1 || credIdLen > MAX_CRED_ID || 55 + credIdLen > a.length) throw reject('bad-auth-data', 'credentialId length');
  const credentialId = Buffer.from(a.subarray(55, 55 + credIdLen));
  const coseStart = 55 + credIdLen;
  const dec = decodeCbor(a.subarray(coseStart));          // 잘림·중복 키 등은 bad-cbor 로 그대로 나가요
  const after = coseStart + dec.end;
  if (flags & FLAG_ED) checkExtensions(a.subarray(after));
  else if (after !== a.length) throw reject('bad-auth-data', 'trailing bytes after COSE key');
  const { key, alg } = coseToKeyObject(dec.value);
  return {
    rpIdHash: Buffer.from(a.subarray(0, 32)),
    flags,
    signCount: a.readUInt32BE(33),
    aaguid: Buffer.from(a.subarray(37, 53)),
    credentialId,
    cosePublicKey: dec.value,
    coseBytes: Buffer.from(a.subarray(coseStart, after)),
    key,
    alg,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ctx 검증 — 호출자 코드의 잘못은 던져요 (입력 탓 실패와 구분)
// ─────────────────────────────────────────────────────────────────────────────

function assertCtx(ctx, needs) {
  if (!ctx || typeof ctx !== 'object') throw new TypeError('ctx 가 필요해요');
  for (const k of needs) {
    const v = ctx[k];
    let okv;
    if (k === 'rpId') okv = typeof v === 'string' && v.length > 0;
    else if (k === 'origins') okv = Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.length > 0);
    else if (k === 'credentials') okv = v instanceof Map || (v !== null && typeof v === 'object' && !Array.isArray(v));
    else if (k === 'expectedChallenge') okv = v instanceof Uint8Array && v.length > 0;
    else okv = false;
    if (!okv) throw new TypeError('ctx.' + k + ' 가 올바르지 않아요');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6단계 — proof 모양 + 등록된 자격증명
// ─────────────────────────────────────────────────────────────────────────────

const PROOF_KEYS = ['authenticatorData', 'clientDataJSON', 'credentialId', 'kind', 'signature'];

function parseProofOrThrow(proof) {
  if (!isPlainObject(proof)) throw reject('bad-proof', 'not a plain object');
  if (Object.getOwnPropertySymbols(proof).length) throw reject('bad-proof', 'symbol key');
  const keys = Object.keys(proof).sort();
  if (keys.length !== PROOF_KEYS.length || keys.some((k, i) => k !== PROOF_KEYS[i])) throw reject('bad-proof', 'keys');
  const vals = {};
  for (const k of keys) {
    const d = Object.getOwnPropertyDescriptor(proof, k);
    if (!d || !('value' in d)) throw reject('bad-proof', 'accessor property');   // 읽을 때마다 달라질 수 있는 값은 안 받아요
    vals[k] = d.value;
  }
  if (vals.kind !== 'webauthn') throw reject('bad-proof', 'kind');
  const out = {};
  for (const k of ['credentialId', 'authenticatorData', 'clientDataJSON', 'signature']) {
    const b = b64urlDecodeStrict(vals[k]);
    if (!b) throw reject('bad-proof', k + ' is not canonical base64url');
    out[k] = b;
  }
  return {
    credentialId: vals.credentialId,            // 정준 철자 그대로 (위에서 왕복 확인됨)
    authData: out.authenticatorData,
    clientData: out.clientDataJSON,
    signature: out.signature,
  };
}

function storeGet(store, id) {
  if (store instanceof Map) return store.get(id);
  return hasOwn(store, id) ? store[id] : undefined;     // 본인 키만 — 'toString'·'constructor' 가 레코드로 읽히지 않게
}

function validateRecord(rec) {
  if (rec === null || typeof rec !== 'object' || Array.isArray(rec) || rec instanceof Map) throw reject('bad-credential-record', 'record is not an object');
  const alg = own(rec, 'alg');
  const signCount = own(rec, 'signCount');
  if (!ALGS.includes(alg)) throw reject('bad-credential-record', 'alg');
  if (!Number.isSafeInteger(signCount) || signCount < 0 || signCount > MAX_UINT32) throw reject('bad-credential-record', 'signCount');
  const publicKey = own(rec, 'publicKey');
  if (publicKey === undefined || publicKey === null) throw reject('bad-credential-record', 'publicKey');
  return { alg, signCount, publicKey };
}

function wrapStep(step, fn) {
  try { return Object.assign({ ok: true }, fn()); } catch (e) {
    if (e instanceof WebauthnError) return fail(e.code, step);
    throw e;
  }
}

// proof → {ok, credentialId, authData, clientData, signature}
function parseProof(proof) {
  return wrapStep(STEP.PROOF, () => parseProofOrThrow(proof));
}

// 정준 base64url 철자로 조회 → {ok, record:{alg, signCount, publicKey}}
function checkCredential(credentialId, ctx) {
  assertCtx(ctx, ['credentials']);
  return wrapStep(STEP.PROOF, () => {
    const rec = storeGet(ctx.credentials, credentialId);
    if (rec === undefined || rec === null) throw reject('credential-not-enrolled');
    return { record: validateRecord(rec) };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7단계 — clientDataJSON
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

// JSON.parse 는 중복 키에서 «마지막 것이 이긴다» 로 조용히 삼켜요 — 서명자가 본 바이트와 해석된 값이 갈라지는 자리라
//   중복은 거절해요. 이미 JSON.parse 가 성공한 «유효한 JSON» 위에서 토큰만 훑어요(재귀 없음 — 중첩 2048 겹도 안전).
function hasDuplicateKeys(text) {
  const stack = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      const top = stack[stack.length - 1];
      if (top && top.obj && top.expectKey) {
        const key = JSON.parse(text.slice(i, j + 1));
        if (top.keys.has(key)) return true;
        top.keys.add(key);
      }
      i = j + 1;
      continue;
    }
    if (c === '{') stack.push({ obj: true, keys: new Set(), expectKey: true });
    else if (c === '[') stack.push({ obj: false });
    else if (c === '}' || c === ']') stack.pop();
    else if (c === ',') { const top = stack[stack.length - 1]; if (top && top.obj) top.expectKey = true; }
    else if (c === ':') { const top = stack[stack.length - 1]; if (top && top.obj) top.expectKey = false; }
    i++;
  }
  return false;
}

function checkClientDataOrThrow(clientData, ctx) {
  if (clientData.length === 0 || clientData.length > MAX_CLIENT_DATA) throw reject('bad-client-data', 'size');
  let text;
  try { text = CLIENT_UTF8.decode(clientData); } catch (_) { throw reject('bad-client-data', 'invalid UTF-8'); }
  let obj;
  try { obj = JSON.parse(text); } catch (_) { throw reject('bad-client-data', 'invalid JSON'); }
  if (!isPlainObject(obj)) throw reject('bad-client-data', 'not an object');
  if (hasDuplicateKeys(text)) throw reject('bad-client-data', 'duplicate key');

  if (own(obj, 'type') !== 'webauthn.get') throw reject('bad-type');
  const chal = own(obj, 'challenge');
  const chalBytes = typeof chal === 'string' ? b64urlDecodeStrict(chal) : null;
  if (!chalBytes || !ctEqual(chalBytes, Buffer.from(ctx.expectedChallenge))) throw reject('challenge-mismatch');
  const origin = own(obj, 'origin');
  if (typeof origin !== 'string' || !ctx.origins.includes(origin)) throw reject('origin-mismatch');   // 정확 일치 — 접두·대소문자·슬래시 불가
  if (hasOwn(obj, 'crossOrigin') && obj.crossOrigin !== false) throw reject('cross-origin');
  if (hasOwn(obj, 'topOrigin')) throw reject('cross-origin', 'topOrigin present');
  return {};
}

function checkClientData(clientData, ctx) {
  assertCtx(ctx, ['origins', 'expectedChallenge']);
  return wrapStep(STEP.CLIENT_DATA, () => checkClientDataOrThrow(clientData, ctx));
}

// ─────────────────────────────────────────────────────────────────────────────
// 8단계 — authenticatorData
// ─────────────────────────────────────────────────────────────────────────────

function checkAuthDataOrThrow(authData, ctx) {
  if (authData.length < 37 || authData.length > MAX_AUTH_DATA) throw reject('bad-auth-data', 'length');
  const expectHash = sha256(Buffer.from(ctx.rpId, 'utf8'));
  if (!ctEqual(authData.subarray(0, 32), expectHash)) throw reject('rpid-mismatch');
  const flags = authData[32];
  if (!(flags & FLAG_UP)) throw reject('user-not-present');
  if (!(flags & FLAG_UV)) throw reject('user-not-verified');
  if (flags & FLAG_AT) throw reject('bad-auth-data', 'AT flag in an assertion');
  // 예약 비트(bit1, bit5)와 «BS 인데 BE 아님»은 규격상 존재할 수 없는 조합이에요. 정상 기기는 안 내고, 내면 구현 결함이라 닫아요.
  if (flags & (FLAG_RFU1 | FLAG_RFU5)) throw reject('bad-auth-data', 'reserved flag bit');
  if ((flags & FLAG_BS) && !(flags & FLAG_BE)) throw reject('bad-auth-data', 'BS without BE');
  if (flags & FLAG_ED) checkExtensions(authData.subarray(37));
  else if (authData.length !== 37) throw reject('bad-auth-data', 'trailing bytes without ED');
  return { flags, signCount: authData.readUInt32BE(33) };
}

function checkAuthData(authData, ctx) {
  assertCtx(ctx, ['rpId']);
  return wrapStep(STEP.AUTH_DATA, () => checkAuthDataOrThrow(authData, ctx));
}

// ─────────────────────────────────────────────────────────────────────────────
// 9단계 — signCount
// ─────────────────────────────────────────────────────────────────────────────

// 저장값이 0 보다 크면 «엄격히 증가» 해야 해요(같아도 역행 — 복제된 기기가 같은 값을 다시 낼 수 있어요).
//   저장 0 + 새 0 은 허용해요: 동기화 패스키는 카운터를 아예 안 올려요. 이 판정은 저장소를 갱신하지 않아요.
function checkCounter(storedSignCount, newSignCount) {
  if (!Number.isSafeInteger(storedSignCount) || !Number.isSafeInteger(newSignCount)) throw new TypeError('checkCounter: 정수가 필요해요');
  if (storedSignCount > 0 && newSignCount <= storedSignCount) return fail('counter-regression', STEP.COUNTER);
  return { ok: true, newSignCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10단계 — 서명
// ─────────────────────────────────────────────────────────────────────────────

// ECDSA DER: SEQUENCE { INTEGER r, INTEGER s } — 최소 길이 · 양수 · 정확히 끝남. OpenSSL 도 재인코딩 비교를 하지만
//   «DER 이어야 한다» 를 라이브러리의 현재 동작에 맡기지 않고 여기서 못박아요.
function isStrictDerEcdsa(sig) {
  if (sig.length < 8 || sig.length > 72 || sig[0] !== 0x30 || sig[1] !== sig.length - 2) return false;
  let i = 2;
  for (let part = 0; part < 2; part++) {
    if (i + 2 > sig.length || sig[i] !== 0x02) return false;
    const len = sig[i + 1];
    i += 2;
    if (len === 0 || len > 33 || i + len > sig.length) return false;
    if (sig[i] & 0x80) return false;                                   // 음수
    if (len > 1 && sig[i] === 0x00 && !(sig[i + 1] & 0x80)) return false;   // 불필요한 선행 0
    i += len;
  }
  return i === sig.length;
}

function resolveKey(record) {
  const pk = record.publicKey;
  if (pk instanceof crypto.KeyObject) {
    if (pk.type !== 'public') throw reject('bad-credential-record', 'publicKey is not a public KeyObject');
    return { key: pk, coseAlg: null };
  }
  if (pk instanceof Map) {
    const r = coseToKeyObject(pk);
    return { key: r.key, coseAlg: r.alg };
  }
  if (pk instanceof Uint8Array) {
    try { return { key: crypto.createPublicKey({ key: Buffer.from(pk), format: 'der', type: 'spki' }), coseAlg: null }; } catch (_) {
      throw reject('bad-credential-record', 'publicKey is not SPKI DER');
    }
  }
  throw reject('bad-credential-record', 'publicKey form');
}

const KEY_TYPE_OF_ALG = { [ALG_ES256]: 'ec', [ALG_EDDSA]: 'ed25519', [ALG_RS256]: 'rsa' };

function checkSignatureOrThrow(record, authData, clientData, signature) {
  // 알고리즘은 «등록 레코드» 의 것이에요. COSE 키가 자기 알고리즘을 말하면 그건 레코드와 «일치해야» 하는 교차 확인이지
  //   알고리즘을 고르는 입력이 아니에요.
  const alg = record.alg;
  const { key, coseAlg } = resolveKey(record);
  if (coseAlg !== null && coseAlg !== alg) throw reject('alg-mismatch', 'COSE alg differs from the enrolled alg');
  if (key.asymmetricKeyType !== KEY_TYPE_OF_ALG[alg]) throw reject('alg-mismatch', 'key type differs from the enrolled alg');
  const details = key.asymmetricKeyDetails || {};
  if (alg === ALG_ES256 && details.namedCurve !== 'prime256v1') throw reject('unsupported-key', 'only P-256');
  // 저장 표기가 SPKI/KeyObject 여도 COSE 와 «같은 규칙» 을 받아요 — 키의 원시 값을 JWK 로 꺼내서 같은 함수로 재요
  if (alg === ALG_RS256 || alg === ALG_EDDSA) {
    let jwk;
    try { jwk = key.export({ format: 'jwk' }); } catch (_) { throw unsupported('key cannot be exported'); }
    if (alg === ALG_EDDSA) assertEd25519Point(Buffer.from(String(jwk.x), 'base64url'));
    else assertRsaParams(Buffer.from(String(jwk.n), 'base64url'), Buffer.from(String(jwk.e), 'base64url'));
  }

  const data = Buffer.concat([authData, sha256(clientData)]);
  let good = false;
  try {
    if (alg === ALG_ES256) {
      good = isStrictDerEcdsa(signature) && crypto.verify('sha256', data, { key, dsaEncoding: 'der' }, signature);
    } else if (alg === ALG_EDDSA) {
      good = signature.length === 64 && crypto.verify(null, data, key, signature);
    } else {
      good = signature.length === details.modulusLength / 8
        && crypto.verify('sha256', data, { key, padding: crypto.constants.RSA_PKCS1_PADDING }, signature);
    }
  } catch (_) { good = false; }
  if (!good) throw reject('bad-signature');
  return {};
}

function checkSignature(record, authData, clientData, signature) {
  return wrapStep(STEP.SIGNATURE, () => checkSignatureOrThrow(validateRecord(record), authData, clientData, signature));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6~10단계 합성
// ─────────────────────────────────────────────────────────────────────────────

// 성공 {ok:true, credentialId, newSignCount, userVerified:true}. 저장소는 건드리지 않아요 — newSignCount 는 명령이 실제로
//   실행된 «뒤에» 호출자가 저장해요. 호출자는 1~3 → 이 함수 → consumeNonce 순서로 조립해요(opcmd.cjs 머리말).
function verifyAssertion(proof, ctx) {
  assertCtx(ctx, ['rpId', 'origins', 'credentials', 'expectedChallenge']);
  const p = parseProof(proof);
  if (!p.ok) return p;
  const c = checkCredential(p.credentialId, ctx);
  if (!c.ok) return c;
  const cd = checkClientData(p.clientData, ctx);
  if (!cd.ok) return cd;
  const ad = checkAuthData(p.authData, ctx);
  if (!ad.ok) return ad;
  const ct = checkCounter(c.record.signCount, ad.signCount);
  if (!ct.ok) return ct;
  const sg = checkSignature(c.record, p.authData, p.clientData, p.signature);
  if (!sg.ok) return sg;
  return { ok: true, credentialId: p.credentialId, newSignCount: ad.signCount, userVerified: true };
}

module.exports = {
  STEP,
  ALGS,
  REJECT_CODES,
  WebauthnError,
  b64urlDecodeStrict,
  parseProof,
  checkCredential,
  checkClientData,
  checkAuthData,
  checkCounter,
  checkSignature,
  verifyAssertion,
  decodeCbor,
  coseToKeyObject,
  parseAttestedCredentialData,
};
