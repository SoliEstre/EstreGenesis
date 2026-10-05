'use strict';
// opcmd.cjs — OperatorCommand v1 (사람 기기가 서명한 명령을 신뢰할 수 없는 중계가 «바이트 그대로» 나르는 규격).
//
// **왜 이 부품이 먼저인가.** 서명이 걸리는 대상은 «사람이 본 것» 이 아니라 «바이트» 예요. 같은 명령이
//   두 구현에서 다른 바이트로 직렬화되면 서명이 통과하는 입력과 사람이 승인한 입력이 갈라져요. 그래서
//   이 파일은 서명·정책보다 앞선 층 — **정준 바이트(RFC 8785 부분집합) · 해시 도메인 · 봉투 모양 ·
//   audience/보드 키/시간 검사 · nonce 원장** — 만 소유해요. 브라우저 클라이언트와 중계 서비스가
//   같은 벡터(vectors/opcmd-v1.json)를 통과해야 «같은 바이트» 가 말뿐이 아니게 돼요.
//
// **전송 봉투.** {"v":1,"cmd":"<정준 JSON 텍스트(문자열)>","proof":{...}}. cmd 를 객체가 아니라 «문자열»로
//   싣는 이유: 중계가 파싱·재직렬화할 여지를 없애서, 서명자가 본 바이트와 보드가 해시하는 바이트가
//   같은 한 덩어리이게 하려는 거예요. proof 는 여기서 불투명(비-null 평범한 객체 + 문자열 kind 만 확인).
//
// **검증 파이프라인 중 이 파일의 몫은 1~4단계예요.**
//   1 형식 · 2 audience(+보드 키) · 3 시간 · 4 nonce.
//   5단계 이후(verb × proof-kind 정책, 등록된 자격증명, WebAuthn/TOTP 검증, 낡은 항목 판정 등)는
//   이후 모듈이 얹어요. **그래서 nonce 는 그 검사들까지 다 통과한 «뒤에» 소비돼야 해요** — 거절된 명령이
//   nonce 를 태우면 공격자가 정당한 명령의 nonce 를 미리 소모시켜 막을 수 있어요. 이 파일은 단계를
//   쪼개서 내보내요(checkFormat · checkAudience · checkTime · consumeNonce). verifyEnvelope 는 1~4를
//   이어 붙인 **편의 합성**일 뿐이고, 증명 검사가 생기면 호출자가 1~3 → 증명 → consume 순서로 직접 조립해요.
//
// **가산 규율.** 이 파일은 어떤 서버 코드도 require 하지 않는 휴면 라이브러리예요(deps-0, node 내장만).
//   시계는 검사 함수 안에서 읽지 않아요 — ctx.now 를 주입받아요(재현 가능한 판정). 가장 바깥 편의
//   진입점 verifyEnvelope 에서만 ctx.now 부재 시 기본값을 채워요.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_BYTES = 16384;      // 봉투·cmd·정준 입력 공통 상한 — 파싱 «전에» 재요
const MAX_DEPTH = 8;          // 최상위 컨테이너 = 깊이 1
const MAX_TTL_SEC = 300;
const SKEW_SEC = 60;
const COMPACT_EVERY = 256;
const TYP = 'eg-opcmd/v1';
const DOMAIN = 'eg-opcmd/v1\n';   // 해시 도메인 분리 — 다른 용도의 서명/해시와 섞이지 않게 접두로 못박아요

// 모든 거절 코드의 정본. OpcmdError 는 이 표에 없는 코드를 만들지 못해요(생성자가 던져요) —
//   «적지 않은 코드가 던져지는» 드리프트를 구조로 막고, 반대 방향(적었는데 아무 벡터도 안 내는 코드)은
//   검사가 양방향으로 재요.
const REJECT_CODES = Object.freeze({
  'too-large': '봉투 또는 텍스트가 16384 바이트를 넘어요 (파싱 전에 판정)',
  'bad-utf8': '유효한 UTF-8 이 아니에요',
  'bad-json': 'JSON 문법 오류 · BOM · 뒤따르는 잉여 텍스트',
  'duplicate-key': '같은 객체에 같은 키가 두 번 나와요 (__proto__ 포함)',
  'float': '정수가 아닌 수(소수점·지수·NaN·Infinity)는 허용되지 않아요',
  'unsafe-int': '안전 정수 범위(±(2^53-1)) 밖의 정수예요',
  'neg-zero': '-0 은 허용되지 않아요',
  'too-deep': '중첩 깊이가 8 을 넘어요',
  'lone-surrogate': '짝 없는 서로게이트(U+D800..U+DFFF)가 키나 값에 있어요',
  'non-canonical': '파싱은 되지만 정준 바이트와 다른 텍스트예요 (공백·키 순서·이스케이프 철자 등)',
  'bad-value': '정준화할 수 없는 값 종류예요 (undefined·함수·bigint·Date·클래스 인스턴스 등)',
  'bad-shape': '봉투/cmd 의 키 집합·필드 형식이 규격과 달라요 (문자열 길이 상한은 UTF-16 코드 유닛 수 기준 — 코드 포인트·바이트 아님)',
  'bad-version': '봉투 v 가 1 이 아니에요',
  'bad-typ': 'cmd.typ 이 eg-opcmd/v1 이 아니에요',
  'bad-nonce': 'nonce 가 16바이트의 base64url(패딩 없음, 정확히 22자)이 아니에요',
  'aud-mismatch': 'cmd.aud 가 이 보드(cstl-board:<boardId>)와 정확히 같지 않아요',
  'board-key-mismatch': 'cmd.boardKeyFp 가 이 보드의 공개키 지문과 달라요',
  'ttl-too-long': 'exp - iat 가 300초를 넘어요',
  'not-yet-valid': '아직 유효하지 않아요 (now < iat - 60)',
  'expired': '만료됐어요 (now > exp + 60)',
  'nonce-replayed': '이미 소비된 nonce 예요',
  'ledger-corrupt': 'nonce 원장이 손상됐어요 (잃은 nonce 는 재전송 창을 여니 닫힌 채로 실패)',
  'ledger-unavailable': 'nonce 원장을 읽거나 쓸 수 없어요 (기록 못 한 nonce 는 소비된 게 아니라서 거절)',
  'bad-key': '보드 공개키가 Ed25519 또는 P-256(ECDSA/ECDH) 공개키가 아니에요',
});

class OpcmdError extends Error {
  constructor(code, detail) {
    if (!Object.prototype.hasOwnProperty.call(REJECT_CODES, code)) {
      throw new TypeError('OpcmdError: REJECT_CODES 에 없는 코드 ' + String(code));
    }
    super(detail ? code + ': ' + detail : code);
    this.name = 'OpcmdError';
    this.code = code;
  }
}
const reject = (code, detail) => new OpcmdError(code, detail);

// ─────────────────────────────────────────────────────────────────────────────
// 정준 JSON (RFC 8785 부분집합)
// ─────────────────────────────────────────────────────────────────────────────

// 짝 없는 서로게이트. `u` 플래그를 일부러 안 써요 — 코드 유닛 단위로 봐야 \uD800 한 개가 잡혀요.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function canonString(s) {
  // JSON.stringify 는 ES2019 부터 짝 없는 서로게이트를 \uXXXX 로 «살려서» 내보내는데, 그건 서명 바이트에서
  //   구현마다 갈릴 수 있는 자리라 아예 받지 않아요.
  if (LONE_SURROGATE.test(s)) throw reject('lone-surrogate');
  return JSON.stringify(s);
}

function canonNumber(n) {
  if (!Number.isFinite(n)) throw reject('float', 'NaN/Infinity');
  if (Object.is(n, -0)) throw reject('neg-zero');
  if (!Number.isInteger(n)) throw reject('float');
  if (!Number.isSafeInteger(n)) throw reject('unsafe-int');
  return String(n);           // 안전 정수는 지수 표기가 없어요
}

function isPlainObject(v) {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const p = Object.getPrototypeOf(v);
  return p === Object.prototype || p === null;
}

// UTF-16 코드 유닛 순서 — 평범한 < 비교. localeCompare 는 로케일마다 달라서 쓰면 안 되고,
//   코드 포인트 순서와도 달라요(보충 평면 문자가 U+E000..U+FFFF 앞에 오는지가 갈려요).
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function canon(v, depth) {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'boolean': return v ? 'true' : 'false';
    case 'string': return canonString(v);
    case 'number': return canonNumber(v);
    case 'object': break;
    default: throw reject('bad-value', typeof v);
  }
  if (Array.isArray(v)) {
    if (Object.getPrototypeOf(v) !== Array.prototype) throw reject('bad-value', 'array subclass');
    if (depth + 1 > MAX_DEPTH) throw reject('too-deep');
    const parts = [];
    for (let i = 0; i < v.length; i++) {
      if (!(i in v)) throw reject('bad-value', 'sparse array');
      parts.push(canon(v[i], depth + 1));
    }
    return '[' + parts.join(',') + ']';
  }
  if (!isPlainObject(v)) throw reject('bad-value', 'non-plain object');
  if (depth + 1 > MAX_DEPTH) throw reject('too-deep');
  if (Object.getOwnPropertySymbols(v).length) throw reject('bad-value', 'symbol key');
  const keys = Object.keys(v).sort(byCodeUnit);
  const parts = [];
  for (const k of keys) parts.push(canonString(k) + ':' + canon(v[k], depth + 1));
  return '{' + parts.join(',') + '}';
}

function canonicalize(value) {
  return canon(value, 0);
}

// 엄격 파서. JSON.parse 를 안 쓰는 이유: 중복 키를 «마지막 것이 이긴다» 로 조용히 삼키고, 그 순간
//   서명자가 본 바이트와 해석된 값이 갈라져요. 깊이 한도는 «재귀하기 전에» 재서 10만 개의 '[' 가
//   스택을 터뜨리지 않게 해요.
// **다중 결함 입력의 코드 판정 규칙(구현 간 합의 지점).** 수 토큰 = 아래 정규식의 «가장 긴 일치»(앞자리 0 은
//   토큰 단계에선 받고 뒤의 정준 비교가 거절). 소수부·지수부가 있는 토큰은 float. neg-zero·unsafe-int 는 «토큰이
//   끝나는 시점» 에, 토큰 뒤에 무엇이 오는지 보기 전에 판정해요. 문법을 못 채운 소수부·지수부('1.', '1e', '1e+')는
//   토큰에 안 들어가서 뒤따르는 잉여 텍스트 → bad-json. 중복 키는 «키 토큰이 끝나는 시점» 에(뒤의 ':' 확인 전에)
//   판정해요. 결함이 둘 이상인 입력은 이 규칙 밖에선 ok/비-ok 만 일치하면 돼요.
const NUMBER_RE = /-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/y;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function parseText(text) {
  const n = text.length;
  let i = 0;

  const skipWs = () => {
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 0x20 || c === 0x0a || c === 0x0d || c === 0x09) i++; else break;
    }
  };

  function parseString() {
    i++;                                   // 여는 따옴표
    let out = '';
    for (;;) {
      if (i >= n) throw reject('bad-json', 'unterminated string');
      const c = text.charCodeAt(i);
      if (c === 0x22) { i++; break; }
      if (c < 0x20) throw reject('bad-json', 'control char in string');
      if (c === 0x5c) {
        const e = text[i + 1];
        i += 2;
        switch (e) {
          case '"': out += '"'; break;
          case '\\': out += '\\'; break;
          case '/': out += '/'; break;
          case 'b': out += '\b'; break;
          case 'f': out += '\f'; break;
          case 'n': out += '\n'; break;
          case 'r': out += '\r'; break;
          case 't': out += '\t'; break;
          case 'u': {
            const hex = text.slice(i, i + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw reject('bad-json', 'bad \\u escape');
            out += String.fromCharCode(parseInt(hex, 16));
            i += 4;
            break;
          }
          default: throw reject('bad-json', 'bad escape');
        }
      } else {
        out += text[i];
        i++;
      }
    }
    if (LONE_SURROGATE.test(out)) throw reject('lone-surrogate');
    return out;
  }

  function parseNumber() {
    NUMBER_RE.lastIndex = i;
    const m = NUMBER_RE.exec(text);
    if (!m) throw reject('bad-json', 'bad number');
    i += m[0].length;
    if (m[1] !== undefined || m[2] !== undefined) throw reject('float');
    const big = BigInt(m[0]);
    if (m[0][0] === '-' && big === 0n) throw reject('neg-zero');
    if (big > MAX_SAFE || big < -MAX_SAFE) throw reject('unsafe-int');
    return Number(big);
  }

  function parseArray(depth) {
    if (depth > MAX_DEPTH) throw reject('too-deep');
    i++;
    const arr = [];
    skipWs();
    if (text[i] === ']') { i++; return arr; }
    for (;;) {
      skipWs();
      arr.push(parseValue(depth));
      skipWs();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === ']') { i++; return arr; }
      throw reject('bad-json', 'expected , or ]');
    }
  }

  function parseObject(depth) {
    if (depth > MAX_DEPTH) throw reject('too-deep');
    i++;
    // 일반 객체에 defineProperty 로 담아요: "__proto__" 가 프로토타입을 바꾸지 않고 평범한 own 속성이
    //   되고, 결과는 다른 코드가 기대하는 «평범한 객체» 예요.
    const obj = {};
    const seen = new Set();
    skipWs();
    if (text[i] === '}') { i++; return obj; }
    for (;;) {
      skipWs();
      if (text[i] !== '"') throw reject('bad-json', 'expected key');
      const key = parseString();
      if (seen.has(key)) throw reject('duplicate-key');
      seen.add(key);
      skipWs();
      if (text[i] !== ':') throw reject('bad-json', 'expected :');
      i++;
      skipWs();
      const val = parseValue(depth);
      Object.defineProperty(obj, key, { value: val, enumerable: true, writable: true, configurable: true });
      skipWs();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '}') { i++; return obj; }
      throw reject('bad-json', 'expected , or }');
    }
  }

  function parseValue(depth) {
    if (i >= n) throw reject('bad-json', 'unexpected end');
    const c = text[i];
    if (c === '{') return parseObject(depth + 1);
    if (c === '[') return parseArray(depth + 1);
    if (c === '"') return parseString();
    if (c === '-' || (c >= '0' && c <= '9')) return parseNumber();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    throw reject('bad-json', 'unexpected token');
  }

  skipWs();
  const value = parseValue(0);
  skipWs();
  if (i < n) throw reject('bad-json', 'trailing data');
  return value;
}

// ignoreBOM: true — 기본값(false)은 선두 BOM 을 «조용히 떼어» 버려서 BOM 붙은 입력이 통과해요.
const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

function parseCanonical(input) {
  let text;
  if (typeof input === 'string') {
    if (Buffer.byteLength(input, 'utf8') > MAX_BYTES) throw reject('too-large');
    text = input;
  } else if (input instanceof Uint8Array) {
    if (input.length > MAX_BYTES) throw reject('too-large');
    try { text = UTF8.decode(input); } catch (_) { throw reject('bad-utf8'); }
  } else {
    throw reject('bad-json', 'input is neither string nor bytes');
  }
  const value = parseText(text);
  // 파싱이 성공했다는 건 «JSON 으로 읽힌다» 일 뿐이에요. 서명 바이트가 되려면 우리가 «쓸» 바이트와
  //   글자 하나까지 같아야 해요 — 공백·키 순서·A 같은 철자·앞자리 0 이 전부 여기서 걸려요.
  if (canonicalize(value) !== text) throw reject('non-canonical');
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// 해시 · 지문
// ─────────────────────────────────────────────────────────────────────────────

// SHA-256( utf8("eg-opcmd/v1\n") || utf8(cmdText) ) — 도메인 접두로 다른 용도의 해시와 값이 안 겹쳐요.
function cmdHash(cmdText) {
  if (typeof cmdText !== 'string') throw new TypeError('cmdHash: cmdText 는 문자열이에요');
  return crypto.createHash('sha256').update(DOMAIN, 'utf8').update(cmdText, 'utf8').digest();
}

// 사람이 화면에서 대조하는 짧은 코드 — "abcd-ef01".
function cmdFingerprint(hashBuf) {
  const hex = Buffer.from(hashBuf).toString('hex');
  return hex.slice(0, 4) + '-' + hex.slice(4, 8);
}

// 보드 공개키 지문 = base64url(SHA-256(정준 SPKI DER)) 앞 22자. 받는 키는 둘뿐이에요 — Ed25519(종전) 와 ECDSA/ECDH P-256(가산).
//   P-256 을 더한 이유: 보드 키는 «하나» 이고(봉인 서명 · 명령 영수증 서명 · 이 지문이 전부 같은 키), 폰 브라우저가 WebCrypto 의
//   기본 알고리즘만으로 검증하려면 P-256 이어야 해요(Ed25519 는 브라우저 지원이 고르지 않아요). 그 밖의 알고리즘/곡선이 같은 지문
//   자리에 앉으면 «어느 키로 검증하나» 가 모호해져서 거절해요.
//   P-256 은 seal.cjs 의 normPublic 과 같은 «정준 91바이트 비압축 SPKI»(30 59 … 03 42 00 04 ‖ x ‖ y)로 맞춰서 해시해요 — 입력이 압축점(59바이트)·
//   하이브리드 표기여도 같은 키는 같은 지문이고, 그래서 브라우저가 exportKey('spki') 로 계산한 값과 어긋나지 않아요(P-256 에선 seal.kidOf 와 같은 식이에요).
//   Ed25519 의 DER 은 종전 그대로 — 기존 벡터가 그대로 통과해요.
const SPKI_P256_PREFIX = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex');
function boardKeyFingerprint(publicKey) {
  let key;
  try {
    key = Buffer.isBuffer(publicKey)
      ? crypto.createPublicKey({ key: publicKey, format: 'der', type: 'spki' })
      : publicKey;
  } catch (_) { throw reject('bad-key', 'unparseable SPKI'); }
  if (!key || key.type !== 'public') throw reject('bad-key');
  let der;
  if (key.asymmetricKeyType === 'ed25519') {
    der = key.export({ type: 'spki', format: 'der' });   // 입력이 어떤 표기든 정준 DER 로 맞춰요
  } else if (key.asymmetricKeyType === 'ec' && key.asymmetricKeyDetails && key.asymmetricKeyDetails.namedCurve === 'prime256v1') {
    try {
      const jwk = key.export({ format: 'jwk' });
      const pad = (s) => { const b = Buffer.from(String(s), 'base64url'); if (b.length > 32) throw new Error('coord'); return Buffer.concat([Buffer.alloc(32 - b.length), b]); };
      der = Buffer.concat([SPKI_P256_PREFIX, Buffer.from([0x04]), pad(jwk.x), pad(jwk.y)]);
    } catch (_) { throw reject('bad-key', 'unparseable P-256'); }
  } else {
    throw reject('bad-key');
  }
  return crypto.createHash('sha256').update(der).digest('base64url').slice(0, 22);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1단계 형식 · 2단계 audience · 3단계 시간
// ─────────────────────────────────────────────────────────────────────────────

const CMD_REQUIRED = ['typ', 'aud', 'boardKeyFp', 'acct', 'verb', 'args', 'nonce', 'iat', 'exp'];
const CMD_OPTIONAL = ['ref'];
// 16바이트 = 128비트 → base64url 22자, 마지막 글자는 하위 4비트가 0 이어야 해요(A Q g w). 그렇지 않은
//   글자는 «같은 16바이트» 의 다른 철자라, 허용하면 한 nonce 가 철자 몇 개로 원장을 우회해요.
const NONCE_RE = /^[A-Za-z0-9_-]{21}[AQgw]$/;
const VERB_RE = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;

function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

function shapeOf(env) {
  if (!isPlainObject(env)) throw reject('bad-shape', 'envelope not an object');
  const keys = Object.keys(env).sort();
  if (keys.length !== 3 || keys[0] !== 'cmd' || keys[1] !== 'proof' || keys[2] !== 'v') {
    throw reject('bad-shape', 'envelope keys');
  }
}

function formatOrThrow(input) {
  const env = parseCanonical(input);           // 봉투 자체도 정준이어야 해요
  shapeOf(env);
  if (env.v !== 1) throw reject('bad-version');
  if (typeof env.cmd !== 'string') throw reject('bad-shape', 'cmd must be a string');
  const cmdText = env.cmd;
  const cmd = parseCanonical(cmdText);         // cmd 바이트도 정준 — 서명이 걸리는 건 이 문자열이에요
  if (!isPlainObject(cmd)) throw reject('bad-shape', 'cmd not an object');
  for (const k of Object.keys(cmd)) {
    if (!CMD_REQUIRED.includes(k) && !CMD_OPTIONAL.includes(k)) throw reject('bad-shape', 'unknown cmd key ' + k);
  }
  for (const k of CMD_REQUIRED) if (!hasOwn(cmd, k)) throw reject('bad-shape', 'missing cmd key ' + k);
  if (cmd.typ !== TYP) throw reject('bad-typ');
  if (typeof cmd.aud !== 'string') throw reject('bad-shape', 'aud');
  if (typeof cmd.boardKeyFp !== 'string') throw reject('bad-shape', 'boardKeyFp');
  // acct 길이 단위 = UTF-16 코드 유닛(JS String.length). 코드 포인트나 바이트로 세는 구현은 보충 평면·비ASCII
  //   문자열의 128 경계에서 갈라져요 — 다른 언어 구현은 UTF-16 유닛으로 환산해서 세어야 하고, 벡터가 그 경계를 고정해요.
  if (typeof cmd.acct !== 'string' || cmd.acct.length < 1 || cmd.acct.length > 128) throw reject('bad-shape', 'acct');
  if (typeof cmd.verb !== 'string' || cmd.verb.length > 64 || !VERB_RE.test(cmd.verb)) throw reject('bad-shape', 'verb');
  if (!isPlainObject(cmd.args)) throw reject('bad-shape', 'args');
  if (hasOwn(cmd, 'ref') && !isPlainObject(cmd.ref)) throw reject('bad-shape', 'ref');
  if (typeof cmd.nonce !== 'string') throw reject('bad-shape', 'nonce');
  if (!NONCE_RE.test(cmd.nonce)) throw reject('bad-nonce');
  if (!Number.isSafeInteger(cmd.iat) || !Number.isSafeInteger(cmd.exp)) throw reject('bad-shape', 'iat/exp');
  if (!(cmd.exp > cmd.iat)) throw reject('bad-shape', 'exp must be greater than iat');
  const proof = env.proof;
  if (!isPlainObject(proof) || typeof proof.kind !== 'string') throw reject('bad-shape', 'proof');
  return { cmd, cmdText, proof };
}

const fail = (code, step) => ({ ok: false, code, step });

// 1단계. 성공하면 {ok:true, cmd, cmdText, proof} — cmdText 가 해시·서명 대상 바이트예요.
function checkFormat(envelopeTextOrBuffer) {
  try {
    return Object.assign({ ok: true }, formatOrThrow(envelopeTextOrBuffer));
  } catch (e) {
    if (e instanceof OpcmdError) return fail(e.code, 1);
    throw e;
  }
}

function assertCtx(ctx, needs) {
  if (!ctx || typeof ctx !== 'object') throw new TypeError('ctx 가 필요해요');
  for (const k of needs) {
    const v = ctx[k];
    if (k === 'now' ? !Number.isSafeInteger(v) : (k === 'ledger' ? !v || typeof v.consume !== 'function' : typeof v !== 'string' || !v)) {
      throw new TypeError('ctx.' + k + ' 가 올바르지 않아요');
    }
  }
}

// 2단계. «접두 일치» 나 대소문자 접기를 하지 않아요 — 다른 보드의 이름이 이 보드 이름으로 시작해도
//   (board-a / board-ab) 다른 보드예요.
function checkAudience(cmd, ctx) {
  assertCtx(ctx, ['boardId', 'boardKeyFp']);
  if (cmd.aud !== 'cstl-board:' + ctx.boardId) return fail('aud-mismatch', 2);
  if (cmd.boardKeyFp !== ctx.boardKeyFp) return fail('board-key-mismatch', 2);
  return { ok: true };
}

// 3단계. 경계는 포함이에요: now == iat-60 통과, now == exp+60 통과. 시계 오차 ±60초를 흡수하되
//   수명(exp-iat) 자체는 300초를 못 넘겨요.
function checkTime(cmd, ctx) {
  assertCtx(ctx, ['now']);
  if (cmd.exp - cmd.iat > MAX_TTL_SEC) return fail('ttl-too-long', 3);
  if (ctx.now < cmd.iat - SKEW_SEC) return fail('not-yet-valid', 3);
  if (ctx.now > cmd.exp + SKEW_SEC) return fail('expired', 3);
  return { ok: true };
}

// 4단계. 별도 export — 증명 검사까지 끝난 «뒤에» 호출자가 불러요. 원장에 쓰는 유일한 단계예요.
function consumeNonce(cmd, ctx) {
  assertCtx(ctx, ['ledger', 'now']);
  try {
    ctx.ledger.consume(cmd.nonce, cmd.exp, ctx.now);
    return { ok: true };
  } catch (e) {
    if (e instanceof OpcmdError) return fail(e.code, 4);
    throw e;
  }
}

// 1~4단계의 «편의 합성». 5단계 이후(증명 검사)가 얹히면 이 합성은 쓰지 말고 단계 함수를 직접 이어서,
//   consumeNonce 를 증명 통과 뒤로 옮기세요. 입력 탓의 실패는 던지지 않고 {ok:false, code, step} 로 돌려줘요.
function verifyEnvelope(envelopeTextOrBuffer, ctx) {
  assertCtx(ctx, ['boardId', 'boardKeyFp', 'ledger']);
  const c = Object.assign({}, ctx, { now: ctx.now === undefined ? Math.floor(Date.now() / 1000) : ctx.now });
  assertCtx(c, ['now']);
  const f = checkFormat(envelopeTextOrBuffer);
  if (!f.ok) return f;
  const a = checkAudience(f.cmd, c);
  if (!a.ok) return a;
  const t = checkTime(f.cmd, c);
  if (!t.ok) return t;
  const n = consumeNonce(f.cmd, c);          // 마지막 — 앞의 어떤 검사에서든 걸린 명령은 원장을 안 건드려요
  if (!n.ok) return n;
  const hash = cmdHash(f.cmdText);
  return { ok: true, cmd: f.cmd, cmdText: f.cmdText, proof: f.proof, hash, fingerprint: cmdFingerprint(hash) };
}

// ─────────────────────────────────────────────────────────────────────────────
// nonce 원장 — 파일에 영속
// ─────────────────────────────────────────────────────────────────────────────

function parseLedgerLine(line) {
  let r;
  try { r = JSON.parse(line); } catch (_) { return null; }
  if (!isPlainObject(r) || typeof r.n !== 'string' || !r.n || !Number.isSafeInteger(r.until)) return null;
  return r;
}

// ── 단일 기록자 잠금 ────────────────────────────────────────────────────────
// **계약: 원장 파일 하나 = 한 시점에 열린 인스턴스 하나.** 인스턴스가 둘이면 각자 메모리 Map 만 믿고 판정해서
//   (a) 한쪽이 소비한 nonce 를 다른 쪽이 새것으로 수락하고, (b) compact 가 «자기 Map» 만 rename 으로 덮어써서
//   다른 쪽이 append 한 줄을 지워요 — 둘 다 재전송 창이에요. 그래서 파일 옆 `<파일>.lock` 에 pid 를 넣어 두고,
//   이미 잡혀 있으면 «열지 않아요»(ledger-unavailable, 닫힌 채 실패).
//   - 잠금 생성은 «내용이 찬 임시 파일을 hard link» 로 해요(EEXIST 면 이미 있음) — 생성과 내용 기록 사이에
//     죽어서 빈 잠금이 남는 일이 없어요.
//   - 잠금의 pid 가 죽어 있으면(ESRCH) 낡은 잠금이라 회수해요. 살아 있거나 내용을 못 읽으면 닫힌 채 실패해요
//     (pid 가 재사용되면 사람이 잠금 파일을 지워야 해요 — 열려 있는 쪽으로 틀리는 것보다 낫습니다).
//   - 회수는 rename 으로 «그 순간의 파일» 을 집어 내용을 다시 확인한 뒤 지워요. 확인 사이에 새 잠금이 끼어든
//     경우 되돌려 놓고 실패해요. (두 프로세스가 «정확히 같은 순간» 낡은 잠금을 회수하는 극히 좁은 경합은
//     남지만, 그 경우도 되돌림 단계가 한쪽을 막아요.)
const heldLocks = new Set();
let exitHookInstalled = false;
function installExitHook() {
  if (exitHookInstalled) return;
  exitHookInstalled = true;
  process.on('exit', () => { for (const l of heldLocks) { try { fs.unlinkSync(l); } catch (_) { /* 이미 없음 */ } } });
}

function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return !!(e && e.code === 'EPERM'); }
}

// 재부팅 전에 쓰인 잠금은 pid 가 살아 있어도 낡은 거예요 — 재부팅 뒤엔 그 번호를 무관한 프로세스가 받을 수
//   있어서(실측: 시스템 서비스가 옛 번호를 가져가 «이미 실행 중» 으로 영영 안 열림), «살아 있음» 만으로는
//   원장이 사람 손 없이는 다시 열리지 않아요. single-instance.cjs 의 writtenBeforeBoot 와 같은 판정이고,
//   이 파일은 다른 런타임 파일을 require 하지 않는 휴면 라이브러리라 한 줄을 복제해 둬요. 60초 여유는
//   uptime 해상도·시계 보정 흔들림 몫이에요.
function writtenBeforeBoot(p) {
  try { return fs.statSync(p).mtimeMs < Date.now() - require('os').uptime() * 1000 - 60000; } catch (_) { return false; }
}

// null = 잠금 없음, NaN = 읽을 수 없거나 형식이 아님(닫힌 채 실패), 숫자 = 기록된 pid
function readLockPid(lockPath) {
  let txt;
  try { txt = fs.readFileSync(lockPath, 'utf8'); } catch (e) { return e && e.code === 'ENOENT' ? null : NaN; }
  const m = /^(\d+)\n?$/.exec(txt);
  return m ? Number(m[1]) : NaN;
}

function acquireLock(lockPath) {
  const tmp = lockPath + '.' + process.pid + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  const tryLink = () => {
    try { fs.linkSync(tmp, lockPath); return true; } catch (e) {
      if (e && e.code === 'EEXIST') return false;
      throw reject('ledger-unavailable', 'lock');
    }
  };
  try {
    try { fs.writeFileSync(tmp, String(process.pid) + '\n', { flag: 'wx' }); } catch (_) { throw reject('ledger-unavailable', 'lock'); }
    if (tryLink()) return;
    const pid = readLockPid(lockPath);
    if (pid === null) { if (tryLink()) return; throw reject('ledger-unavailable', 'locked'); }   // 읽는 사이에 풀림 — 한 번만 재시도
    if (Number.isNaN(pid) || (pidAlive(pid) && !writtenBeforeBoot(lockPath))) throw reject('ledger-unavailable', 'locked');
    const aside = lockPath + '.stale.' + process.pid + '.' + crypto.randomBytes(4).toString('hex');
    try { fs.renameSync(lockPath, aside); } catch (_) { throw reject('ledger-unavailable', 'locked'); }
    if (readLockPid(aside) === pid) {
      try { fs.unlinkSync(aside); } catch (_) { /* 남아도 무해 */ }
      if (tryLink()) return;
      throw reject('ledger-unavailable', 'locked');
    }
    // 집은 파일이 방금 본 낡은 잠금이 아니었어요 — 다른 프로세스의 새 잠금을 건드린 것이니 되돌리고 물러나요.
    try { fs.linkSync(aside, lockPath); } catch (_) { /* 이미 다른 잠금이 앉았어요 */ }
    try { fs.unlinkSync(aside); } catch (_) { /* noop */ }
    throw reject('ledger-unavailable', 'locked');
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* noop */ }
  }
}

// 줄마다 {"n":nonce,"until":unixSec}. 메모리 전용이면 재시작이 곧 재전송 창이라서 «기록 후 반환» 이에요:
//   fsync 까지 끝난 뒤에만 consume 이 돌아가요(돌아가기 전에 죽으면 그 명령은 실행된 적이 없어요).
//
// 불변식: 항목의 until 은 «시간 검사가 받아들이는 마지막 초(exp + SKEW_SEC)» 이상이어야 해요. 그보다 짧으면
//   수락 창 안에서 원장은 이미 잊었는데 시간 검사는 아직 통과시키는 구간이 생겨요 — 그래서 graceSec >= SKEW_SEC.
class NonceLedger {
  constructor(filePath, opts) {
    if (typeof filePath !== 'string' || !filePath) throw new TypeError('NonceLedger: filePath 가 필요해요');
    const o = opts || {};
    const grace = o.graceSec === undefined ? SKEW_SEC : o.graceSec;
    if (!Number.isSafeInteger(grace) || grace < SKEW_SEC) {
      throw new TypeError('NonceLedger: graceSec 는 ' + SKEW_SEC + ' 이상의 안전 정수여야 해요 (시간 검사 창보다 짧으면 재전송 창이 열려요)');
    }
    this.file = path.resolve(filePath);
    this.graceSec = grace;
    this._live = new Map();                  // nonce → until
    this._sinceCompact = 0;
    this._closed = false;
    this._lock = this.file + '.lock';
    try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); } catch (_) { throw reject('ledger-unavailable', 'mkdir'); }
    acquireLock(this._lock);
    heldLocks.add(this._lock);
    installExitHook();
    try {
      this._load(o.now === undefined ? Math.floor(Date.now() / 1000) : o.now);
    } catch (e) {
      this.close();                           // 열기에 실패한 인스턴스가 잠금을 쥔 채 남지 않게
      throw e;
    }
  }

  // 잠금을 놓아요. 닫힌 인스턴스의 consume/compact 는 잠금 없이 쓰게 되니 거절해요.
  close() {
    if (this._closed) return;
    this._closed = true;
    if (readLockPid(this._lock) === process.pid) { try { fs.unlinkSync(this._lock); } catch (_) { /* noop */ } }
    heldLocks.delete(this._lock);
  }

  _load(now) {
    let raw;
    try { raw = fs.readFileSync(this.file, 'utf8'); } catch (e) {
      if (e && e.code === 'ENOENT') return;
      throw reject('ledger-unavailable', 'read');
    }
    const endsWithNewline = raw.length === 0 || raw.endsWith('\n');
    const lines = raw.split('\n');
    if (endsWithNewline) lines.pop();
    for (let idx = 0; idx < lines.length; idx++) {
      const rec = parseLedgerLine(lines[idx]);
      if (!rec) {
        // 줄바꿈 없이 끝난 «마지막» 줄만 크래시 중 쓰다 만 것으로 봐요 — 그 명령은 실행된 적이 없어요.
        //   그 밖의 깨진 줄은 잃어버린 nonce 가 있다는 뜻이라 열어 두지 않고 닫아요.
        if (idx === lines.length - 1 && !endsWithNewline) continue;
        throw reject('ledger-corrupt', 'line ' + (idx + 1));
      }
      if (rec.until >= now) {
        const prev = this._live.get(rec.n);
        if (prev === undefined || rec.until > prev) this._live.set(rec.n, rec.until);
      }
    }
    // 끝 줄바꿈이 없던 파일은 다음 append 가 그 줄 뒤에 «붙어서» 둘 다 깨뜨려요 — 정리해서 다시 써요.
    if (!endsWithNewline) this.compact(now);
  }

  has(nonce) { return this._live.has(nonce); }
  get size() { return this._live.size; }

  // 줄 전체가 쓰이고 fsync 까지 끝나야만 돌아가요. writeSync 는 «일부만» 쓰고 돌아올 수 있어서(디스크 가득 참·
  //   쿼터) 반환값을 세어 끝까지 반복하고, 진전이 없으면 실패해요. 실패하면 시작 오프셋으로 되돌려서 다음
  //   append 가 쓰다 만 줄 뒤에 붙어 «중간 손상» 이 되는 걸 막아요.
  _append(line) {
    if (this._closed) throw reject('ledger-unavailable', 'closed');
    const buf = Buffer.from(line, 'utf8');
    let fd;
    let startSize = -1;
    try {
      fd = fs.openSync(this.file, 'a');
      startSize = fs.fstatSync(fd).size;
      let off = 0;
      while (off < buf.length) {
        const w = fs.writeSync(fd, buf, off, buf.length - off);
        if (!(w > 0)) throw new Error('no progress');
        off += w;
      }
      fs.fsyncSync(fd);
    } catch (_) {
      // 되돌림은 «경로 기준» 이에요 — 추가 전용('a') 핸들의 ftruncate 는 플랫폼에 따라 거절돼요. 최선 노력이고,
      //   실패해도 다음 적재가 «끝 줄바꿈 없는 마지막 줄» 규칙으로 처리하니 닫힌 채 실패는 유지돼요.
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (__) { /* noop */ } fd = undefined; }
      if (startSize >= 0) { try { fs.truncateSync(this.file, startSize); } catch (__) { /* 되돌림은 최선 */ } }
      throw reject('ledger-unavailable', 'append');
    } finally {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (_) { /* 이미 실패 경로 */ } }
    }
  }

  consume(nonce, exp, now) {
    if (typeof nonce !== 'string' || !nonce) throw new TypeError('consume: nonce');
    if (!Number.isSafeInteger(exp) || !Number.isSafeInteger(now)) throw new TypeError('consume: exp/now');
    if (this._closed) throw reject('ledger-unavailable', 'closed');
    const cur = this._live.get(nonce);
    if (cur !== undefined && cur >= now) throw reject('nonce-replayed');
    const until = exp + this.graceSec;
    this._append(JSON.stringify({ n: nonce, until }) + '\n');   // 메모리에 올리기 «전에» 디스크에
    this._live.set(nonce, until);
    if (++this._sinceCompact >= COMPACT_EVERY) {
      this._sinceCompact = 0;
      try { this.compact(now); } catch (_) { /* 정리 실패는 무해 — 방금 consume 은 이미 영속됐어요 */ }
    }
  }

  // 살아 있는 항목만 임시 파일에 쓰고 rename 으로 교체해요 — 도중에 죽어도 원본은 온전하거나(rename 전)
  //   새것이에요(rename 후). 제자리 덮어쓰기는 쓰다 죽으면 두 상태가 아닌 «반쯤» 이 남아요.
  compact(now) {
    if (this._closed) throw reject('ledger-unavailable', 'closed');
    const t = now === undefined ? Math.floor(Date.now() / 1000) : now;
    const live = [];
    for (const [n, until] of this._live) if (until >= t) live.push([n, until]);
    const tmp = this.file + '.tmp';
    let fd;
    try {
      fd = fs.openSync(tmp, 'w');
      fs.writeSync(fd, live.map(([n, until]) => JSON.stringify({ n, until }) + '\n').join(''));
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(tmp, this.file);
    } catch (_) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (__) { /* noop */ } }
      try { fs.unlinkSync(tmp); } catch (__) { /* noop */ }
      throw reject('ledger-unavailable', 'compact');
    }
    this._live = new Map(live);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 단일 기록자 잠금의 «재사용 진입점» — 형제 모듈(totp.cjs 의 상태 파일)이 같은 잠금을 쓰게 해요.
// 잠금 회수 경합 처리(위 acquireLock)는 복제하면 두 벌이 따로 낡아 가요 — 그래서 복사하지 않고 «얇게 내보내요».
//   NonceLedger 는 이 둘을 거치지 않고 위의 내부 함수를 그대로 써요(검증된 경로를 건드리지 않으려고).
//   실패는 OpcmdError('ledger-unavailable') 로 던져요 — 호출자가 자기 코드로 옮겨 담아요.
// ─────────────────────────────────────────────────────────────────────────────
function acquireFileLock(lockPath) {
  if (typeof lockPath !== 'string' || !lockPath) throw new TypeError('acquireFileLock: lockPath');
  const p = path.resolve(lockPath);
  acquireLock(p);
  heldLocks.add(p);
  installExitHook();
  return p;
}

function releaseFileLock(lockPath) {
  const p = path.resolve(lockPath);
  // 내 pid 가 적힌 잠금만 지워요 — 남의 잠금을 지우면 단일 기록자 계약이 깨져요.
  if (readLockPid(p) === process.pid) { try { fs.unlinkSync(p); } catch (_) { /* noop */ } }
  heldLocks.delete(p);
}

module.exports = {
  DOMAIN,
  SKEW_SEC,
  MAX_TTL_SEC,
  MAX_BYTES,
  MAX_DEPTH,
  REJECT_CODES,
  OpcmdError,
  canonicalize,
  parseCanonical,
  cmdHash,
  cmdFingerprint,
  boardKeyFingerprint,
  checkFormat,
  checkAudience,
  checkTime,
  consumeNonce,
  verifyEnvelope,
  NonceLedger,
  acquireFileLock,
  releaseFileLock,
  _parseTextUnbounded: parseText,   // 검사 전용 — 크기 한도 없이 파서의 깊이 한도만 시험하려는 진입점
};
