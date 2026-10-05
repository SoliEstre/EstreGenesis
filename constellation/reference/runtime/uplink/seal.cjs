'use strict';
// seal.cjs — 결정 맥락(질문·선택지 등)을 «봉인» 해서 중계 서비스는 암호문만 저장하고, 사람이 등록한 기기만 브라우저(WebCrypto)에서 열게 하는 봉투.
//
// **왜 이 형식인가.** 중계는 신뢰할 수 없는 운반자예요(opcmd.cjs 머리말과 같은 전제). 결정 맥락을 평문으로 올리면 중계가 «무엇을 묻는지» 를 알고,
//   더 나쁘게는 «다른 항목의 맥락을 이 항목에 붙이거나 맥락을 통째로 지어내서» 사람이 엉뚱한 질문에 답하게 만들 수 있어요. 그래서
//   ① 내용은 무작위 콘텐츠 키(CEK)로 AES-GCM 봉인하고(기밀성)
//   ② CEK 는 수신 기기마다 따로 «감싸요»(ECDH-ES 임시키 → HKDF → AES-GCM 키 래핑)
//   ③ «이 봉투가 어느 보드의 어느 항목의 몇 번째 판인가» 를 가리키는 aad 가 내용 봉인과 래핑 양쪽에 묶이고(옮겨 붙이기 방지)
//   ④ 봉투 전체를 보드의 ECDSA 키로 «서명» 해요(출처 인증). 알고리즘은 WebCrypto 가 «기본으로» 지원하는 것(ECDH P-256 · HKDF-SHA-256 · AES-GCM-256 ·
//   ECDSA P-256/SHA-256)만 써요 — 브라우저 쪽에 라이브러리를 싣지 않으려는 거예요. 같은 벡터(vectors/seal-v1.json)를 노드 구현과 WebCrypto 만으로 쓴
//   구현이 둘 다 통과해야 «브라우저가 열 수 있다» 가 말뿐이 아니에요.
//
// **서명이 없으면 위 ③ 은 반쪽이에요 — 왜 ④ 가 필요한가.** ECDH-ES 는 «익명 발신자» 방식이라 기밀성만 줘요. 수신 기기의 «공개키» 는 비밀이 아니고(등록 때 중계를
//   지나가요) 그것만 있으면 누구나 «기존 항목의 aad» 로 새 평문을 봉인해서 진짜와 구별되지 않는 봉투를 만들 수 있어요. aad 묶음은 «보드가 봉인한 암호문을 다른 항목으로
//   옮기는 것» 만 막지, «새 암호문을 지어내는 것» 은 못 막아요. 같은 이유로 수신자 중 한 명(CEK 를 아는 사람)이 내용을 다시 암호화하고 다른 수신자의 wk 는 그대로
//   두는 재작성도, 중계가 수신자 목록에서 기기를 빼는 것도 서명이 없으면 안 보여요. 그래서 sig 는 «sig 를 뺀 봉투 전체» 를 덮어요(ct · iv · aad · recipients 전부).
//   기기는 등록 때 보드의 서명 공개키를 «고정(pin)» 해 두고 열기 전에 검증해요 — 서명 키는 보드만 가지니 중계도, 수신자도, 공개키만 아는 제3자도 못 만들어요.
//
// **신선도(freshness)는 서명으로도 안 풀려요 — rev 와 «기대값의 출처».** 옛 봉투는 «진짜 서명» 이 붙어 있어서 항목의 맥락이 고쳐진 뒤에도 중계가 옛 판을 내밀 수 있어요.
//   그래서 aad 에 단조 증가하는 rev(정수)가 들어가고, 열기는 «호출자가 기대하는 rev» 가 든 aad 와 정준 바이트로 비교해요. 단 이 모듈은 기대 rev 가 «어디서 왔는지» 까지는
//   못 지켜요 — 중계가 준 값을 그대로 기대값으로 쓰면 아무것도 막지 못해요. 기대 rev 는 인증된 경로(보드가 서명한 항목 레코드)에서 오거나, 더 단단하게는 사용자의 서명된
//   답(opcmd args)이 contextHash(봉투) 를 실어 보내고 보드가 «자기가 그 항목에 봉인해 둔 봉투» 의 해시와 같을 때만 받아들이는 거예요(옛 판 · 지어낸 판 · 수신자 누락판을 한꺼번에 거절).
//
// **봉투(JSON 객체, 직렬화는 opcmd 의 canonicalize).**
//   { "v":1, "alg":"ECDH-ES+HKDF-SHA256+A256GCM",
//     "aad": {"boardId":..., "rev":<정수 ≥ 0>, "v":1, "itemId":...}  (itemId 대신 "seq":<정수> — 둘 중 «하나만»),
//     "iv": b64url(12), "ct": b64url(암호문 ‖ 태그16),
//     "recipients": [ {"kid": b64url(SHA-256(수신자 SPKI DER)) 앞 22자, "epk": b64url(비압축 P-256 점 65바이트),
//                      "iv": b64url(12), "wk": b64url(CEK 32 + 태그 16 = 48바이트)} … ],
//     "sig": b64url(ECDSA-P256-SHA256 서명, IEEE P1363 r‖s 64바이트 — WebCrypto sign/verify 의 출력 형식 그대로) }
//   내용   : AES-256-GCM(CEK, iv, additionalData = utf8(canonicalize(aad)))
//   래핑   : Z   = ECDH(임시 개인키, 수신자 공개키) (32바이트 x 좌표)
//            KEK = HKDF-SHA256(ikm=Z, salt=SHA-256(utf8(canonicalize(aad))), info = utf8("eg-seal/v1\n") ‖ epk(65) ‖ SHA-256(수신자 SPKI DER)(32), L=32)
//            wk  = AES-256-GCM(KEK, iv_r, CEK, additionalData = utf8(canonicalize(aad)))
//   서명   : sig = ECDSA(보드 개인키, SHA-256, utf8(canonicalize(봉투에서 sig 만 뺀 객체)))
//   수신자 SPKI DER 은 «정준 91바이트 비압축형»(30 59 … 03 42 00 04 ‖ x ‖ y)으로 맞춰서 kid · info 해시를 내요 — 입력 SPKI 가 압축점(02/03)이나 하이브리드(06/07)여도
//   같은 키는 같은 kid 라서, 기기가 WebCrypto exportKey('spki') 로 계산하는 kid 와 어긋나지 않고 «같은 기기를 두 표기로 넣어 중복 검사를 우회» 하는 길도 닫혀요.
//   aad 가 salt «와» 래핑 additionalData «양쪽에» 들어가는 이유: 래핑된 키를 다른 항목의 봉투로 옮기면 KEK 도 다르고 태그도 안 맞아요(이중 구속).
//   info 에 epk 와 수신자 키 해시가 들어가는 이유: 파생 키가 «이 임시키 · 이 수신자» 에 묶여서 다른 수신자 항목으로 옮겨 쓰는 길을 막아요.
//
// **열기의 검사 순서(규범 — 결함이 겹친 입력의 코드).** 구조(bad-seal: 키 집합·길이·표기·epk 가 곡선 위 · kid 중복) → aad 일치(aad-mismatch) →
//   수신자 키(bad-key) → 보드 공개키(bad-key) → 서명(bad-signature) → 내 kid 가 있나(not-a-recipient) → 복호(decrypt-failed). 모든 수신자의 epk 를 «전부» 곡선 위 점으로
//   검사해요(내 항목만 보면 남의 항목이 깨진 봉투를 구현마다 다르게 받아요). 서명이 복호보다 «먼저» 인 이유: 서명이 틀린 봉투의 암호문은 풀어 보지도 않아요.
//   호출자는 «자기가 그리려는 항목의 aad(rev 포함)» 를 넘겨요 — 봉투가 주장하는 aad 를 «믿고 열지» 않고 기대값과 정준 바이트로 비교해서, 다른 항목·다른 판의 봉투를 이 자리에 끼워 넣어도 열리지 않아요.
//   브라우저 구현자 주의(스펙 명확화): ① kid 는 «불투명 문자열» 이에요 — /^[A-Za-z0-9_-]{22}$/ 만 검사하고 디코드하지 마세요(22자는 해시 접두라서 정준 후행 비트 규칙을 지키지
//   않는 게 보통이에요). 22자(132비트)로 충돌이 나도 KEK 는 info 에 SPKI 전체 해시(32바이트)를 써서 kid 가 암호 바인딩에 쓰이지 않아요. ② epk 는 importKey 에 넣기 «전에»
//   길이 65 · 첫 바이트 0x04 를 명시 검사하세요 — WebCrypto importKey('raw') 는 압축점(33바이트)도 받아들이지만 이 형식은 비압축점만 허용해요.
//
// **난수와 IV.** CEK 는 봉인마다 새로 뽑고, KEK 는 «수신자마다 봉인마다» 새 임시키에서 나와요 — 같은 키로 IV 를 두 번 쓰는 일이 구조적으로 없어요.
//   운영 seal() 은 crypto.randomBytes «만» 써요 — 난수 주입(rng)은 «벡터를 바이트까지 재현하려는 시험 전용» _sealWithRng 로 따로 빼 놨어요(운영 진입점이 주입을 받으면
//   상수 rng 한 번으로 CEK·IV·임시키가 겹쳐 GCM nonce 재사용 → 평문 XOR 유출 + 인증키 노출이에요). 시험 진입점도 한 봉인 안에서 IV 가 겹치면 거절해요.
//   호출 순서(고정): CEK 32 → 내용 iv 12 → 수신자마다 [임시 스칼라 48 → 래핑 iv 12]. 임시 개인 스칼라는 48바이트를 [1, n-1] 로 접어서 만들어요
//   (384비트를 접으면 치우침이 2^-128 — 32바이트를 접으면 2^-32 라서 넉넉히 뽑아요). ECDSA 서명은 노드 crypto 의 «무작위 k» 라서 벡터의 sig 는 바이트 재현이 아니라
//   «검증» 으로 확인해요(생성기는 시험 키에 결정적 k 를 써서 파일을 안정시켜요).
//
// **가려지지 않는 것(문서화).** ① 평문 길이는 ct 길이(평문 + 16)로 그대로 보여요 — 패딩이 없어요. ② kid 는 기기 공개키의 결정적 해시라서 중계는 «어느 기기가 어느 항목을
//   받는지» 를 연결할 수 있어요(JOSE/HPKE 와 같은 수준; 수신자 집합이 항목마다 다르다는 사실 자체는 숨기지 않아요). ③ 항목 id · 보드 id · rev 는 aad 라서 평문이에요.
//
// **가산 규율.** 서버 코드를 require 하지 않는 휴면 라이브러리예요(deps-0, node 내장 + 형제 opcmd.cjs 의 canonicalize). 시계를 읽지 않고 파일·네트워크도 안 써요.
//   던지는 건 코드 달린 SealError 뿐이고(잘못된 인자 모양은 TypeError), 코드는 REJECT_CODES 에 있어요.

const crypto = require('crypto');
const OP = require('./opcmd.cjs');

const ALG = 'ECDH-ES+HKDF-SHA256+A256GCM';
const MAX_PLAINTEXT = 65536;          // 64 KB
const MIN_RECIPIENTS = 1;
const MAX_RECIPIENTS = 16;
const MAX_ID_CHARS = 128;             // boardId·itemId 길이 상한 — UTF-16 코드 유닛 수 (opcmd 의 acct 와 같은 단위)
const MAX_SEAL_TEXT = 131072;         // parseSeal 이 받는 직렬화 상한(바이트) — 64KB 평문의 봉투(≈ 87KB + 수신자 16명 + 서명)가 들어가요
const INFO_PREFIX = Buffer.from('eg-seal/v1\n', 'utf8');
const P256_N = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
const GCM_TAG = 16;
const SIG_BYTES = 64;                 // IEEE P1363 r ‖ s (각 32바이트)
const SPKI_P256_PREFIX = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex');   // 정준 91바이트 SPKI 의 앞 26바이트 (뒤에 04 ‖ x ‖ y)

const REJECT_CODES = Object.freeze({
  'bad-seal': '봉투 구조가 규격과 달라요 (키 집합·v·alg·표기·길이·epk 가 곡선 위가 아님·kid 중복·직렬화가 정준이 아님)',
  'aad-mismatch': '봉투의 aad 가 호출자가 기대한 항목·판(rev)의 aad 와 정준 바이트로 달라요',
  'bad-signature': '봉투 서명이 고정(pin)한 보드 공개키로 검증되지 않아요 — 보드가 봉인하지 않았거나 서명 뒤에 바뀐 봉투 (암호문은 풀어 보지도 않아요)',
  'decrypt-failed': 'AES-GCM 인증 실패 — 변조·다른 항목에서 옮긴 키·잘못된 수신자 키 (원인을 가르지 않아요)',
  'not-a-recipient': '이 키의 kid 가 봉투의 수신자 목록에 없어요',
  'bad-key': '키가 규격이 아니에요 — 수신자 공개키(봉인) · 수신자 개인키(열기) · 보드 서명 개인키(봉인) · 보드 서명 공개키(열기) 는 모두 P-256 이어야 해요',
  'too-large': '평문이 65536 바이트를 넘어요',
  'bad-recipients': '수신자가 1..16 명이 아니거나 같은 키(kid)가 두 번 들어 있어요',
  'bad-aad': 'aad 가 {boardId, rev, v:1, itemId|seq} 규격이 아니에요 (itemId 와 seq 는 하나만, rev 는 0 이상의 안전 정수)',
});

class SealError extends Error {
  constructor(code, detail) {
    if (!Object.prototype.hasOwnProperty.call(REJECT_CODES, code)) {
      throw new TypeError('SealError: REJECT_CODES 에 없는 코드 ' + String(code));
    }
    super(detail ? code + ': ' + detail : code);
    this.name = 'SealError';
    this.code = code;
  }
}
const reject = (code, detail) => new SealError(code, detail);

// ─────────────────────────────────────────────────────────────────────────────
// 작은 도구
// ─────────────────────────────────────────────────────────────────────────────

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const sha256 = (...parts) => { const h = crypto.createHash('sha256'); for (const p of parts) h.update(p); return h.digest(); };
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const sameKeys = (o, want) => { const k = Object.keys(o).sort(); const w = [...want].sort(); return k.length === w.length && k.every((x, i) => x === w[i]); };
const B64U_RE = /^[A-Za-z0-9_-]*$/;

// 엄격 base64url: 알파벳 · 패딩 없음 · «정준 철자»(다시 인코딩하면 같은 글자). 관대하게 받으면 같은 바이트가 여러 철자를 가져요.
// len 이 주어지면 «정확히 그 바이트 수».
function b64uDecode(s, len) {
  if (typeof s !== 'string' || !B64U_RE.test(s) || s.length % 4 === 1) return null;
  const b = Buffer.from(s, 'base64url');
  if (b.toString('base64url') !== s) return null;
  if (len !== undefined && b.length !== len) return null;
  return b;
}

// aad 검증 + 정준 바이트. errCode 는 호출자 aad 면 'bad-aad', 봉투 안의 aad 면 'bad-seal'.
function checkAad(aad, errCode) {
  if (!isPlain(aad)) throw reject(errCode, 'aad not an object');
  const withItem = sameKeys(aad, ['boardId', 'itemId', 'rev', 'v']);
  const withSeq = sameKeys(aad, ['boardId', 'rev', 'seq', 'v']);
  if (!withItem && !withSeq) throw reject(errCode, 'aad keys');      // itemId 와 seq 는 하나만, rev 필수, 그 밖의 키 금지
  if (aad.v !== 1) throw reject(errCode, 'aad.v');
  if (typeof aad.boardId !== 'string' || aad.boardId.length < 1 || aad.boardId.length > MAX_ID_CHARS) throw reject(errCode, 'aad.boardId');
  if (withItem && (typeof aad.itemId !== 'string' || aad.itemId.length < 1 || aad.itemId.length > MAX_ID_CHARS)) throw reject(errCode, 'aad.itemId');
  if (withSeq && !(Number.isSafeInteger(aad.seq) && aad.seq >= 0)) throw reject(errCode, 'aad.seq');
  if (!(Number.isSafeInteger(aad.rev) && aad.rev >= 0)) throw reject(errCode, 'aad.rev');
  let text;
  try { text = OP.canonicalize(aad); } catch (e) {
    if (e instanceof OP.OpcmdError) throw reject(errCode, 'aad ' + e.code);       // 짝 없는 서로게이트 등
    throw e;
  }
  return { text, bytes: Buffer.from(text, 'utf8') };
}

// ── 키 ──
const isEcP256 = (k) => k.asymmetricKeyType === 'ec' && k.asymmetricKeyDetails && k.asymmetricKeyDetails.namedCurve === 'prime256v1';

// P-256 공개키: KeyObject 또는 SPKI DER Buffer. «정준 91바이트 비압축 SPKI» 로 다시 지어서 kid·해시를 내요 — 입력 표기(압축 02/03 · 하이브리드 06/07 · 비압축)가 달라도
//   같은 키는 같은 kid 예요. 노드는 압축형 SPKI 를 읽고 «그 표기 그대로» 다시 내보내서(재내보내기 59바이트), DER 을 그대로 해시하면 기기의 WebCrypto kid 와 어긋나요.
function normPublic(k) {
  let key;
  try {
    if (k instanceof crypto.KeyObject) key = k;
    else if (k instanceof Uint8Array) key = crypto.createPublicKey({ key: Buffer.from(k), format: 'der', type: 'spki' });
  } catch (_) { throw reject('bad-key', 'unparseable'); }
  if (!key || key.type !== 'public' || !isEcP256(key)) throw reject('bad-key');
  let der;
  try {
    const jwk = key.export({ format: 'jwk' });
    const x = b64uDecode(jwk.x, 32);
    const y = b64uDecode(jwk.y, 32);
    if (!x || !y) throw new Error('coords');
    der = Buffer.concat([SPKI_P256_PREFIX, Buffer.from([0x04]), x, y]);
    key = crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });    // 정준 DER 에서 다시 읽어요 — 이후 모든 계산이 같은 표기를 써요
  } catch (_) { throw reject('bad-key', 'unparseable'); }
  const hash = sha256(der);
  return { key, der, hash, kid: b64u(hash).slice(0, 22) };
}

function normPrivate(k) {
  let key;
  try {
    if (k instanceof crypto.KeyObject) key = k;
    else if (k instanceof Uint8Array) key = crypto.createPrivateKey({ key: Buffer.from(k), format: 'der', type: 'pkcs8' });
  } catch (_) { throw reject('bad-key', 'unparseable'); }
  if (!key || key.type !== 'private' || !isEcP256(key)) throw reject('bad-key');
  return key;
}

// 수신자 kid (b64url(SHA-256(정준 SPKI DER)) 앞 22자) — 등록 모듈과 브라우저가 같은 식으로 내요.
function kidOf(publicKey) { return normPublic(publicKey).kid; }

// 65바이트 비압축 점 → 공개키. createPublicKey 가 점이 곡선 위인지 검증해요(밖이면 던져요).
function pointToKey(point) {
  try {
    return crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(point.subarray(1, 33)), y: b64u(point.subarray(33, 65)) }, format: 'jwk' });
  } catch (_) { return null; }
}

// ── AES-GCM · HKDF ──
function gcmSeal(key, iv, aadBytes, pt) {
  const c = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: GCM_TAG });
  c.setAAD(aadBytes);
  return Buffer.concat([c.update(pt), c.final(), c.getAuthTag()]);
}

function gcmOpen(key, iv, aadBytes, ctTag) {
  if (ctTag.length < GCM_TAG) throw reject('decrypt-failed', 'short');
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: GCM_TAG });
    d.setAAD(aadBytes);
    d.setAuthTag(ctTag.subarray(ctTag.length - GCM_TAG));
    return Buffer.concat([d.update(ctTag.subarray(0, ctTag.length - GCM_TAG)), d.final()]);
  } catch (_) { throw reject('decrypt-failed'); }
}

function deriveKek(z, aadBytes, epk, spkiHash) {
  const info = Buffer.concat([INFO_PREFIX, epk, spkiHash]);
  return Buffer.from(crypto.hkdfSync('sha256', z, sha256(aadBytes), info, 32));
}

// ── 서명 ──
// 서명 대상 = 정준 직렬화(sig 만 뺀 봉투). 객체가 같으면 키 순서가 달라도 같은 바이트예요(canonicalize 가 정렬).
const signedBytes = (envWithoutSig) => Buffer.from(OP.canonicalize(envWithoutSig), 'utf8');
function signEnvelope(envWithoutSig, signKey) {
  return b64u(crypto.sign('sha256', signedBytes(envWithoutSig), { key: signKey, dsaEncoding: 'ieee-p1363' }));
}
function verifyEnvelope(envWithoutSig, sig, boardKey) {
  try { return crypto.verify('sha256', signedBytes(envWithoutSig), { key: boardKey, dsaEncoding: 'ieee-p1363' }, sig); } catch (_) { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 봉인
// ─────────────────────────────────────────────────────────────────────────────

function drawer(rng) {
  if (typeof rng !== 'function') throw new TypeError('seal: rng 는 함수 (n) => Buffer(n) 예요');
  return (n) => {
    const b = rng(n);
    if (!(b instanceof Uint8Array) || b.length !== n) throw new TypeError('seal: rng(' + n + ') 는 정확히 ' + n + '바이트를 돌려줘야 해요');
    return Buffer.from(b);
  };
}

// 임시 개인 스칼라 — 48바이트(384비트)를 [1, n-1] 로 접어요.
function scalarFrom(bytes48) {
  const d = (BigInt('0x' + bytes48.toString('hex')) % (P256_N - 1n)) + 1n;
  return Buffer.from(d.toString(16).padStart(64, '0'), 'hex');
}

function sealCore(plaintext, aad, recipientPublicKeys, signKey, draw) {
  if (!(plaintext instanceof Uint8Array)) throw new TypeError('seal: plaintext 는 Buffer/Uint8Array 예요');
  const A = checkAad(aad, 'bad-aad');
  if (plaintext.length > MAX_PLAINTEXT) throw reject('too-large');
  if (!Array.isArray(recipientPublicKeys) || recipientPublicKeys.length < MIN_RECIPIENTS || recipientPublicKeys.length > MAX_RECIPIENTS) throw reject('bad-recipients', 'count');
  const rcps = recipientPublicKeys.map(normPublic);
  if (new Set(rcps.map((r) => r.kid)).size !== rcps.length) throw reject('bad-recipients', 'duplicate kid');
  const signer = normPrivate(signKey);

  const cek = draw(32);
  const contentIv = draw(12);
  const ivs = [contentIv.toString('hex')];
  const ct = gcmSeal(cek, contentIv, A.bytes, Buffer.from(plaintext));
  const recipients = rcps.map((r) => {
    const d = scalarFrom(draw(48));
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(d);
    const epk = ecdh.getPublicKey();                                      // 65바이트 비압축 점
    const eph = crypto.createPrivateKey({
      key: { kty: 'EC', crv: 'P-256', x: b64u(epk.subarray(1, 33)), y: b64u(epk.subarray(33, 65)), d: b64u(d) }, format: 'jwk',
    });
    const z = crypto.diffieHellman({ privateKey: eph, publicKey: r.key });   // 32바이트 x 좌표
    const kek = deriveKek(z, A.bytes, epk, r.hash);
    const wrapIv = draw(12);
    ivs.push(wrapIv.toString('hex'));
    const wk = gcmSeal(kek, wrapIv, A.bytes, cek);
    return { kid: r.kid, epk: b64u(epk), iv: b64u(wrapIv), wk: b64u(wk) };
  });
  if (new Set(ivs).size !== ivs.length) throw new TypeError('seal: 한 봉인 안에서 IV 가 겹쳤어요 (난수원이 같은 값을 돌려줬어요)');
  const body = {
    v: 1, alg: ALG,
    aad: JSON.parse(A.text),        // 정준 텍스트에서 다시 만들어 «호출자 객체의 여분 속성·프로토타입» 이 봉투로 새지 않아요
    iv: b64u(contentIv), ct: b64u(ct), recipients,
  };
  return Object.assign({}, body, { sig: signEnvelope(body, signer) });
}

// 운영 진입점 — 난수는 crypto.randomBytes «만». opts = {signKey}: 보드의 P-256 서명 개인키(KeyObject 또는 PKCS8 DER). 필수예요 —
//   서명 없는 봉투를 만드는 경로를 두지 않아요(서명 검증이 «선택» 이면 서명 없는 봉투가 곧 우회로가 돼요).
function seal(plaintext, aad, recipientPublicKeys, opts) {
  const o = opts || {};
  if (o.rng !== undefined) throw new TypeError('seal: rng 주입은 운영 진입점에서 받지 않아요 (시험 전용 _sealWithRng)');
  return sealCore(plaintext, aad, recipientPublicKeys, o.signKey, crypto.randomBytes);
}

// 시험 전용 — 벡터를 바이트까지 재현하려고 난수원을 주입해요. 운영 코드가 부르면 안 돼요(머리말 «난수와 IV»).
function _sealWithRng(plaintext, aad, recipientPublicKeys, opts) {
  const o = opts || {};
  return sealCore(plaintext, aad, recipientPublicKeys, o.signKey, drawer(o.rng));
}

// ─────────────────────────────────────────────────────────────────────────────
// 열기
// ─────────────────────────────────────────────────────────────────────────────

const ENVELOPE_KEYS = ['aad', 'alg', 'ct', 'iv', 'recipients', 'sig', 'v'];
const RECIPIENT_KEYS = ['epk', 'iv', 'kid', 'wk'];
const KID_RE = /^[A-Za-z0-9_-]{22}$/;     // kid 는 불투명 문자열 — 디코드하지 않아요(머리말)

function parseEnvelope(env) {
  const bad = (d) => reject('bad-seal', d);
  if (!isPlain(env) || !sameKeys(env, ENVELOPE_KEYS)) throw bad('envelope keys');
  if (env.v !== 1) throw bad('v');
  if (env.alg !== ALG) throw bad('alg');
  const A = checkAad(env.aad, 'bad-seal');
  const iv = b64uDecode(env.iv, 12);
  if (!iv) throw bad('iv');
  const ct = b64uDecode(env.ct);
  if (!ct || ct.length < GCM_TAG || ct.length > MAX_PLAINTEXT + GCM_TAG) throw bad('ct');
  const sig = b64uDecode(env.sig, SIG_BYTES);
  if (!sig) throw bad('sig');
  if (!Array.isArray(env.recipients) || env.recipients.length < MIN_RECIPIENTS || env.recipients.length > MAX_RECIPIENTS) throw bad('recipients count');
  const seen = new Set();
  const recipients = env.recipients.map((r) => {
    if (!isPlain(r) || !sameKeys(r, RECIPIENT_KEYS)) throw bad('recipient keys');
    if (typeof r.kid !== 'string' || !KID_RE.test(r.kid)) throw bad('kid');
    if (seen.has(r.kid)) throw bad('duplicate kid');
    seen.add(r.kid);
    const epk = b64uDecode(r.epk, 65);
    if (!epk || epk[0] !== 0x04) throw bad('epk');
    const epkKey = pointToKey(epk);
    if (!epkKey) throw bad('epk not on curve');
    const riv = b64uDecode(r.iv, 12);
    if (!riv) throw bad('recipient iv');
    const wk = b64uDecode(r.wk, 32 + GCM_TAG);
    if (!wk) throw bad('wk');
    return { kid: r.kid, epk, epkKey, iv: riv, wk };
  });
  const body = { v: env.v, alg: env.alg, aad: env.aad, iv: env.iv, ct: env.ct, recipients: env.recipients };   // sig 만 뺀 봉투 — 서명이 덮은 바이트의 원본
  return { aadText: A.text, iv, ct, sig, body, recipients };
}

// open(envelope, expectedAad, recipientPrivateKey, boardPublicKey)
//   expectedAad       호출자가 그리려는 항목·판의 aad (rev 포함 — 출처 주의는 머리말)
//   boardPublicKey    등록 때 고정(pin)해 둔 보드 서명 공개키 (KeyObject 또는 SPKI DER). 필수 — 생략하면 bad-key.
function open(envelope, expectedAad, recipientPrivateKey, boardPublicKey) {
  const exp = checkAad(expectedAad, 'bad-aad');
  const p = parseEnvelope(envelope);
  if (p.aadText !== exp.text) throw reject('aad-mismatch');         // 정준 바이트 비교 — 열 때 쓰는 aad 는 «호출자 기대값»이에요
  const priv = normPrivate(recipientPrivateKey);
  const board = normPublic(boardPublicKey);
  if (!verifyEnvelope(p.body, p.sig, board.key)) throw reject('bad-signature');   // 서명이 틀린 봉투의 암호문은 풀어 보지도 않아요
  const me = normPublic(crypto.createPublicKey(priv));
  const r = p.recipients.find((x) => x.kid === me.kid);
  if (!r) throw reject('not-a-recipient');
  let z;
  try { z = crypto.diffieHellman({ privateKey: priv, publicKey: r.epkKey }); } catch (_) { throw reject('decrypt-failed', 'ecdh'); }
  const kek = deriveKek(z, exp.bytes, r.epk, me.hash);
  const cek = gcmOpen(kek, r.iv, exp.bytes, r.wk);
  return gcmOpen(cek, p.iv, exp.bytes, p.ct);
}

// 직렬화: opcmd 의 정준 JSON. 파싱: 크기 상한(바이트) → 엄격 파서(중복 키·부동소수·BOM 거절) → 정준 바이트 일치. 봉투는 opcmd 의 16KB 한도보다
//   커서 opcmd.parseCanonical 을 못 써요 — 같은 엄격 파서의 «한도 없는 진입점» 을 쓰되 크기는 여기서 먼저 재요.
function serialize(envelope) { return OP.canonicalize(envelope); }

// 맥락 해시 — 사용자의 서명된 답(opcmd args)에 실어 보내고 보드가 «자기가 그 항목에 봉인해 둔 봉투» 의 해시와 비교하는 값(머리말 «신선도»). sig 까지 포함한
//   봉투 전체의 SHA-256(hex) 이라 옛 판 · 지어낸 판 · 수신자를 뺀 판이 전부 다른 값이에요.
function contextHash(envelope) { return sha256(Buffer.from(serialize(envelope), 'utf8')).toString('hex'); }

const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
function parseSeal(input) {
  let text;
  if (typeof input === 'string') {
    if (Buffer.byteLength(input, 'utf8') > MAX_SEAL_TEXT) throw reject('bad-seal', 'too large');
    text = input;
  } else if (input instanceof Uint8Array) {
    if (input.length > MAX_SEAL_TEXT) throw reject('bad-seal', 'too large');
    try { text = UTF8.decode(input); } catch (_) { throw reject('bad-seal', 'utf8'); }
  } else throw reject('bad-seal', 'input type');
  let value;
  try {
    value = OP._parseTextUnbounded(text);
    if (OP.canonicalize(value) !== text) throw reject('bad-seal', 'non-canonical');
  } catch (e) {
    if (e instanceof OP.OpcmdError) throw reject('bad-seal', e.code);
    throw e;
  }
  return value;
}

module.exports = {
  ALG,
  MAX_PLAINTEXT,
  MAX_RECIPIENTS,
  REJECT_CODES,
  SealError,
  kidOf,
  seal,
  _sealWithRng,
  open,
  serialize,
  contextHash,
  parseSeal,
};
