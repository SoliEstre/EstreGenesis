'use strict';
// totp.cjs — OperatorCommand 의 두 번째 증명(proof) 종류: 보드 쪽 TOTP (RFC 6238 / RFC 4226).
//
// **왜 «서명» 이 아니라 «장부» 인가.** TOTP 는 명령을 서명하지 못해요 — 코드는 «비밀 + 시각» 의 함수지 «이 명령» 의 함수가
//   아니에요. 그래서 WebAuthn 처럼 challenge=명령 해시로 묶을 수 없고, 묶음은 장부가 해요: 코드가 받아들여지면 그 시간 단계(step)를
//   «소비» 하고 (step → cmdHash) 를 적어 둬요. 의미는 «이 한 단계의 코드는 정확히 이 한 명령에 쓰였다» 이고, 같은 코드를 훔쳐 다른
//   명령에 붙이는 길은 단조(monotonic) 규칙이 막아요(아래). WebAuthn 보다 약한 증명이에요 — 코드를 «실시간으로» 가로채 «다른 명령에
//   먼저» 쓰면 막지 못해요(그래서 호출자가 verb × proof-kind 정책에서 TOTP 를 «낮은 위험 verb» 에만 허용하는 게 맞아요).
//
// **위협 모델 한 줄 — 중계는 TOTP 경로에서 명령 무결성을 깰 수 있어요.** 코드는 평문으로 중계를 지나가고 명령에 묶여 있지 않아서, 중계가 사용자의 «새» 코드를
//   보고 사용자 명령을 붙잡아 둔 채 «같은 코드를 자기가 고른 cmdHash 에 붙여» 먼저 내밀면 그게 이겨요(사용자의 진짜 명령은 totp-replayed 로 떨어져요).
//   장부는 «사후 감사» 일 뿐 막아 주지 않아요. 이 모듈이 줄 수 있는 건 막이 아니라 «확인 재료» 예요 — ledgerFor(step) 이 «그 단계가 어느 명령에 쓰였나» 를
//   (그리고 totp-replayed 거절은 같은 정보를 {step, usedBy} 로 바로 실어요 — 호출자가 «이 코드는 다른 명령에 쓰였다» 를 한 번에 알아서 탐지·경보를 걸 수 있게요: 정당한 명령이 totp-replayed 로 떨어지는 건
//   중계가 코드를 가로채 자기 명령에 먼저 쓴 «흔적» 일 수 있어요.)
//   돌려주니, 호출자는 ① TOTP 를 저위험 verb 에만 허용하고 ② 수락 직후 (step → cmdHash) 를 보드가 서명·봉인해 사용자에게 되돌려 보여 주는 확인 루프를 두거나
//   ③ 보드가 cmdHash 요약을 봉인해 보내고 사용자가 그걸 확인한 «뒤에» 코드를 입력하게 하는 2단계로 가야 해요(이 라이브러리 밖의 프로토콜 몫).
//
// **비밀은 보드에서만 만들고 보드에만 둬요.** 중계 서비스는 비밀도 코드 검증 결과도 만들지 못해요(중계는 코드를 «나를» 뿐).
//   비밀 파일의 권한·저장은 등록 의식(enrolment) 모듈 몫이고, 여기엔 순수 함수와 «상태 파일» 뿐이에요 — 비밀은 ctx.secret 으로 받아요.
//
// **가산 규율.** 서버 코드를 require 하지 않는 휴면 라이브러리예요(deps-0, node 내장 + 형제 opcmd.cjs). 시계는 읽지 않고 ctx.now 를
//   주입받아요. 입력 탓의 실패는 던지지 않고 {ok:false, code} 로 돌려줘요. 던지는 건 «호출자 코드의 잘못»(ctx 모양) 과
//   «상태 파일을 열 수 없음»(생성자) 뿐이에요.
//
// **단조 규칙 — 같은 단계는 «같은 명령이어도» 재사용 불가.** 받아들인 단계(step) 이하의 코드는 전부 totp-replayed 예요. 같은 cmdHash 로
//   같은 단계를 한 번 더 내미는 것도 재전송이에요: 첫 제시가 이미 단계를 소비했고, 두 번째 제시는 정의상 «같은 증명을 또 쓰는 것» 이라서
//   성공시킬 이유가 없어요(정당한 재시도는 nonce 층이 아니라 «새 코드» 로 해요 — 다음 단계까지 최대 30초). 예외를 허용하면 «같은 해시일 때만
//   통과» 라는 분기가 생기고, 그 분기는 해시를 아는 쪽(중계)이 임의로 열 수 있어요.
//
// **창(window) = {cur-1, cur, cur+1}.** 시계 오차·입력 지연을 흡수하는 대가로 한 코드가 최대 90초 유효해요. 상수 시간 비교는 «후보 셋을 전부
//   비교한 뒤» 합쳐요(첫 일치에서 빠져나가면 몇 번째 후보에 걸렸는지가 시간으로 새요).
//
// **잠금(lockout).** 연속 5번 틀리면 900초 잠가요. 잠긴 동안은 «코드를 평가조차 하지 않아요» — 맞는 코드에도 같은 totp-locked 라서 잠금이
//   «맞았는지» 의 신탁이 되지 않고, 카운터를 올리지도 잠금을 늘리지도 않아요(공격자가 시도를 계속 보내 정당한 사용자를 영영 잠가 두는 길을 막아요).
//   잠금이 풀린 뒤에도 카운터는 «성공할 때까지» 그대로라서 한 번만 더 틀리면 곧바로 다시 잠겨요(풀린 직후 새 5회를 주면 15분마다 5번씩 추측이 가능해요).
//   성공하면 카운터가 0 으로 돌아가요.
//   **잠금은 걸릴 때마다 «두 배»(900·1800·3600 … 최대 24시간), 10번째 잠금 뒤엔 하드 비활성(totp-disabled).** 풀린 뒤 1회 추측이 영원히 허용되면 한 해에 3만 5천 번
//   (창 3단계 × 10^-6 → 약 10%)이 가능해서 잠금이 «속도 제한» 일 뿐 «상한» 이 못 돼요. 두 배 증가에 상한을 두면 하루 1회(연 365회 ≈ 0.1%)로 줄고, 하드 비활성은
//   누적 오답을 14번(5 + 9)으로 «영구히» 묶어요(성공 없이 이 숫자를 넘길 수 없어요). 하드 비활성은 보드 로컬 reset() 으로만 풀려요 — 그 대가로 중계가 쓰레기 «6자리»
//   를 흘려 TOTP 를 꺼 버릴 수 있지만, 중계가 명령을 버릴 수 있다는 건 이미 위협 모델 안이고 TOTP 는 보조 증명이라 주 증명(서명형)은 영향이 없어요. 오답·잠금 횟수는
//   snapshot() 의 lockouts 로 보이니, 사용자 알림은 호출자가 이 값을 보고 걸 수 있어요.
//
// **bad-proof(모양이 틀린 증명)는 실패 횟수에 «세지 않아요».** 판단 근거: ① 6자리 숫자가 아닌 입력은 «추측» 이 아니에요 — 비밀에 대해 아무 정보도
//   주지 못하니 무차별 대입 방어(잠금)가 지켜야 할 대상이 아니에요. ② 세면 «쓰레기를 보내기만 해도» 잠겨요. 중계가 명령을 버릴 수 있다는 건 위협 모델
//   안이라 중계 DoS 는 새 위험이 아니지만, 중계 «인증 구멍» 으로 임의 호출자가 쓰레기를 보내는 경우까지 잠금 DoS 가 되는 건 불필요한 확대예요.
//   ③ 모양 검사는 상태를 «읽지도 쓰지도 않아서» 쓰레기 폭주가 fsync 폭주가 되지 않아요(세면 쓰레기마다 디스크에 써야 해요). 틀린 «6자리» 만 세요.
//   totp-replayed 도 세지 않아요 — 이미 쓰인(진짜였던) 코드의 재제시는 새로운 추측이 아니고, 정당한 클라이언트의 재시도(네트워크 재전송)가 잠금을 부르면 안 돼요.
//
// **상태 파일 = 매번 통째로 다시 쓰는 JSON 하나(원자적 교체).** 줄 추가형(JSONL) 대신 이걸 고른 이유: 상태는 «기록» 이 아니라 «값»(lastAcceptedStep ·
//   failures · lockedUntil 이 계속 바뀌어요) 이라 줄 추가형이면 매번 «재생 순서» 의미를 정해야 하고, 쓰다 만 마지막 줄 같은 규칙이 필요해요. 통째 교체는
//   tmp 에 쓰고 fsync 한 뒤 rename — 도중에 죽어도 «옛 상태» 아니면 «새 상태» 예요(반쯤은 없어요). 상태가 작아서(장부는 24시간치 ≤ 2880항목) 비용도 문제 안 돼요.
//   그리고 «쓰기는 곧 compact» 라서 24시간 보존 정리(prune)가 공짜로 따라와요. ok 는 파일이 교체된 «뒤에만» 돌려줘요 — 기록 못 한 단계는 소비된 게 아니에요.
//   rename 은 «디렉터리 항목» 의 변경이라 POSIX(ext4·xfs)에선 부모 디렉터리를 fsync 해야 정전 뒤에도 남아요 — 안 하면 방금 ok 를 낸 단계가 옛 상태로 돌아가 재전송 창과
//   잠금 카운터 초기화가 다시 열려요(opcmd 의 장부는 «추가 + fsync» 라 이 노출이 없어요; compact 의 rename 이 되돌아가도 옛 파일이 더 «많은» nonce 를 담을 뿐이라 안전해요).
//   Windows 는 디렉터리를 파일처럼 열 수 없어서 건너뛰어요 — 그 플랫폼에선 이 보장을 «못 준다» 는 걸 감추지 않아요.
//   단일 기록자 잠금(`<파일>.lock`)은 opcmd.cjs 의 것을 그대로 써요(복사하지 않아요 — 회수 경합 처리가 두 벌로 낡아 가지 않게).
//   손상(JSON 아님·키 집합/형식 위반)은 열지 않고 닫힌 채 실패해요: 잃은 상태는 «재전송 창 + 잠금 초기화» 라서요.
//
// **비밀·주기·알고리즘을 바꾸면(재등록) 상태 파일도 새로 시작해야 해요 — 그리고 잊으면 «조용히» 가 아니라 «시끄럽게» 실패해요.** 단계 번호는 주기에 의존하고(30초 → 60초로
//   바꾸면 옛 lastAcceptedStep 을 60초 단계가 지나려면 56년이 걸려요), 이전 비밀의 lastAcceptedStep 은 새 비밀에 의미가 없어요. 그래서 상태 파일이 «어떤 설정으로 쓰였는지»
//   (cfg = {period, algorithm, fp: HMAC-SHA256(비밀, 'eg-totp-state/v1') 앞 16바이트})를 같이 적고, 다른 설정으로 부르면 totp-replayed 로 둔갑하지 않고 state-mismatch 를
//   돌려줘요. 의도한 재등록은 보드 로컬 reset() 이에요(등록 모듈 몫). fp 는 비밀의 HMAC 이라 상태 파일이 새도 비밀 자체는 안 새요.
//
// **시계를 믿지 않아요 — 못 믿는 시계는 «진단 가능한 실패» 로.** ctx.now 가 2^40(약 3만 4천 년)을 넘으면 호출자 오류(TypeError)예요(lockedUntil 이 안전 정수를 넘어 상태 파일이
//   «자기가 쓴 걸 자기가 못 읽는» 일을 막아요; 쓰기 직전 parseState 로 자체 점검도 해요). 상태의 lastAcceptedStep 이 지금 창(cur+1)보다 «앞» 이면 state-ahead —
//   틀린 시계에서 한 번 성공하면 진짜 시각이 따라잡을 때까지 TOTP 가 totp-replayed 로 죽는데, 그게 재전송이 아니라 시계 문제라는 걸 가려 내라는 거예요(오답 횟수에도 안 세요).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OP = require('./opcmd.cjs');

const ALGORITHMS = Object.freeze(['sha1', 'sha256', 'sha512']);
const PROOF_DIGITS = 6;
const PROOF_PERIOD = 30;
const PROOF_ALGORITHM = 'sha1';
const WINDOW_STEPS = 1;               // cur-1 .. cur+1
const MAX_FAILURES = 5;
const LOCK_SEC = 900;                 // 첫 잠금 길이 — 걸릴 때마다 두 배
const MAX_LOCK_SEC = 86400;           // 두 배 증가의 상한 (24시간)
const HARD_LOCK_AFTER = 10;           // 성공 없이 이만큼 잠기면 하드 비활성 (누적 오답 5 + 9 = 14회가 영구 상한)
const MAX_NOW = 2 ** 40;              // ctx.now 상한 — 약 3만 4천 년. lockedUntil 이 안전 정수를 넘어 상태 파일이 읽히지 않게 되는 길을 닫아요
const MAX_STATE_SEC = 2 ** 41;        // 상태 파일 속 시각 필드(lockedUntil · at)의 상한 — MAX_NOW + MAX_LOCK_SEC 보다 커요
const RETENTION_SEC = 86400;          // 장부 보존 — 24시간
const MIN_SECRET_BYTES = 16;          // RFC 4226 §4 R6: 128비트 이상 (160비트 권장)
const MAX_SECRET_BYTES = 128;
const MIN_PERIOD = 15;
const MAX_PERIOD = 120;               // 한 코드의 유효 구간 = 3 × period — 상한 6분으로 묶어요
const CODE_RE = /^[0-9]{6}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// 모든 거절 코드의 정본. TotpError 는 이 표에 없는 코드를 만들지 못해요(생성자가 던져요).
const REJECT_CODES = Object.freeze({
  'bad-proof': 'proof 의 키 집합·kind 가 규격과 다르거나 code 가 정확히 6자리 ASCII 숫자가 아니에요 (실패 횟수에 세지 않고 상태를 만지지 않아요)',
  'totp-invalid': '6자리 코드가 {cur-1, cur, cur+1} 어느 단계와도 맞지 않아요 (실패 횟수에 셈 — 5번째가 900초 잠금을 걸어요)',
  'totp-replayed': '맞는 코드지만 이미 소비된 단계(또는 그 이전 단계)예요 — 같은 cmdHash 여도 거절 (실패 횟수에 세지 않아요)',
  'totp-locked': '연속 실패로 잠겨 있어요 (잠금은 걸릴 때마다 두 배, 최대 24시간) — 맞는 코드도 평가하지 않고 거절하며 카운터·잠금 시각을 건드리지 않아요',
  'totp-disabled': '성공 없이 10번 잠겨서 TOTP 가 하드 비활성이에요 — 보드 로컬 reset() 으로만 풀려요 (코드를 평가하지 않고 상태를 건드리지 않아요)',
  'state-mismatch': '상태 파일이 다른 설정(주기·알고리즘·비밀)으로 쓰였어요 — 재등록이면 보드 로컬 reset() 이 필요해요 (totp-replayed 로 둔갑시키지 않아요)',
  'state-ahead': '상태의 마지막 수락 단계가 지금 창보다 앞이에요 — 보드 시계가 한 번 크게 틀렸던 흔적일 가능성이 커요 (재전송이 아니라 시계 진단 대상; 코드를 평가하지 않고 세지 않아요)',
  'bad-config': '보드 로컬 TOTP 설정(알고리즘·자릿수·주기·비밀 길이)이 규격 밖이에요 — 입력이 아니라 저장소 탓이라 닫힌 채 실패',
  'bad-encoding': 'base32(RFC 4648, 대문자·패딩 없음·비트 정준) 표기가 아니에요',
  'state-corrupt': 'TOTP 상태 파일이 손상됐어요 (잃은 상태는 재전송 창과 잠금 초기화를 열어서 닫힌 채 실패)',
  'state-unavailable': 'TOTP 상태 파일을 열거나 쓸 수 없어요 (기록 못 한 단계는 소비된 게 아니라서 거절)',
});

class TotpError extends Error {
  constructor(code, detail) {
    if (!Object.prototype.hasOwnProperty.call(REJECT_CODES, code)) {
      throw new TypeError('TotpError: REJECT_CODES 에 없는 코드 ' + String(code));
    }
    super(detail ? code + ': ' + detail : code);
    this.name = 'TotpError';
    this.code = code;
  }
}
const reject = (code, detail) => new TotpError(code, detail);

// ─────────────────────────────────────────────────────────────────────────────
// RFC 4226 HOTP · RFC 6238 TOTP — 순수 함수
// ─────────────────────────────────────────────────────────────────────────────

function hotp(secret, counter, opts) {
  const o = opts || {};
  const algorithm = o.algorithm === undefined ? 'sha1' : o.algorithm;
  const digits = o.digits === undefined ? 6 : o.digits;
  if (!Buffer.isBuffer(secret) || secret.length === 0) throw new TypeError('hotp: secret 은 비어 있지 않은 Buffer 예요');
  if (!ALGORITHMS.includes(algorithm)) throw new TypeError('hotp: algorithm 은 ' + ALGORITHMS.join('|'));
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) throw new TypeError('hotp: digits 는 6..8');
  let c;
  if (typeof counter === 'bigint') c = counter;
  else if (Number.isSafeInteger(counter)) c = BigInt(counter);
  else throw new TypeError('hotp: counter 는 안전 정수 또는 bigint');
  if (c < 0n || c > 0xffffffffffffffffn) throw new TypeError('hotp: counter 범위(0..2^64-1)');
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(c);                                       // 8바이트 빅엔디언
  const mac = crypto.createHmac(algorithm, secret).update(msg).digest();
  const off = mac[mac.length - 1] & 0x0f;                         // 동적 절단 (RFC 4226 §5.3)
  const bin = ((mac[off] & 0x7f) * 0x1000000) + (mac[off + 1] << 16) + (mac[off + 2] << 8) + mac[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

function stepOf(timeSec, period, t0) {
  const p = period === undefined ? PROOF_PERIOD : period;
  const z = t0 === undefined ? 0 : t0;
  if (!Number.isSafeInteger(timeSec) || timeSec < z) throw new TypeError('stepOf: timeSec 는 T0 이상의 안전 정수');
  if (!Number.isSafeInteger(p) || p < 1) throw new TypeError('stepOf: period 는 양의 정수');
  return Math.floor((timeSec - z) / p);
}

function totpAt(secret, timeSec, opts) {
  const o = opts || {};
  const step = stepOf(timeSec, o.period, o.t0);
  return hotp(secret, step, { algorithm: o.algorithm, digits: o.digits });
}

function generateSecret(bytes) {
  const n = bytes === undefined ? 20 : bytes;
  if (!Number.isInteger(n) || n < MIN_SECRET_BYTES || n > MAX_SECRET_BYTES) throw new TypeError('generateSecret: bytes 는 ' + MIN_SECRET_BYTES + '..' + MAX_SECRET_BYTES);
  return crypto.randomBytes(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// base32 (RFC 4648 §6) — 출력은 패딩 없음
// ─────────────────────────────────────────────────────────────────────────────

function base32Encode(buf) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('base32Encode: Buffer 가 필요해요');
  let out = '';
  let bits = 0;
  let acc = 0;
  for (const b of buf) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) { out += B32[(acc >>> (bits - 5)) & 31]; bits -= 5; }
    acc &= (1 << bits) - 1;
  }
  if (bits > 0) out += B32[(acc << (5 - bits)) & 31];
  return out;
}

// 디코드는 «대문자·패딩 없음·비트 정준» 만 받아요. 소문자·'='·공백을 «관대하게» 받으면 같은 비밀이 여러 철자를 갖게 되고, 철자가 다르면
//   비교·해시·지문이 갈라져요(같은 비밀을 두 번 «다른 비밀로» 등록). 붙여넣기 중 깨진 글자(0/O · 1/I 혼동은 알파벳 밖이라 어차피 걸려요)가
//   조용히 다른 비밀이 되는 것도 막아요. 남는 하위 비트가 0 이 아닌 철자('MZ')는 같은 바이트의 «다른 철자» 라서 거절해요(opcmd 의 nonce 철자 규칙과 같은 이유).
const B32_RE = /^[A-Z2-7]*$/;
const MAX_B32_CHARS = 1024;
function base32Decode(text) {
  if (typeof text !== 'string' || text.length > MAX_B32_CHARS || !B32_RE.test(text)) throw reject('bad-encoding');
  const rem = text.length % 8;
  if (rem === 1 || rem === 3 || rem === 6) throw reject('bad-encoding', 'length');   // 5비트 묶음으로 바이트가 안 나뉘는 길이
  const out = [];
  let bits = 0;
  let acc = 0;
  for (const ch of text) {
    acc = (acc << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) { out.push((acc >>> (bits - 8)) & 0xff); bits -= 8; }
    acc &= (1 << bits) - 1;
  }
  if (acc !== 0) throw reject('bad-encoding', 'non-canonical trailing bits');
  return Buffer.from(out);
}

// 등록용 otpauth:// URI (Key URI Format). 인증 앱이 지원하는 건 SHA1/6자리/30초라서 «고정값을 명시» 해서 내보내요 —
//   앱 기본값에 맡기면 앱마다 다른 값을 가정할 수 있어요. issuer·account 는 퍼센트 인코딩(RFC 3986 예약 문자 전부).
const pct = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
function otpauthUri(o) {
  if (!o || typeof o !== 'object') throw new TypeError('otpauthUri: 인자 객체가 필요해요');
  const { issuer, account, secret } = o;
  const okText = (s, max) => typeof s === 'string' && s.length >= 1 && s.length <= max && !/[\u0000-\u001f\u007f]/.test(s);
  if (!okText(issuer, 64) || !okText(account, 128)) throw reject('bad-config', 'issuer/account');
  if (!Buffer.isBuffer(secret) || secret.length < MIN_SECRET_BYTES || secret.length > MAX_SECRET_BYTES) throw reject('bad-config', 'secret length');
  let ei; let ea;
  try { ei = pct(issuer); ea = pct(account); } catch (_) { throw reject('bad-config', 'unencodable text'); }   // 짝 없는 서로게이트
  return 'otpauth://totp/' + ei + ':' + ea + '?secret=' + base32Encode(secret) + '&issuer=' + ei +
    '&algorithm=SHA1&digits=6&period=30';
}

// ─────────────────────────────────────────────────────────────────────────────
// proof 모양
// ─────────────────────────────────────────────────────────────────────────────

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

// 정확히 {kind:'totp', code:'<6자리>'}. 키가 더 있거나 적으면 거절 — 여분 필드는 «이 검증이 읽지 않는 필드가 통과된다» 는 뜻이라서요.
function parseProof(proof) {
  if (!isPlain(proof)) return { ok: false, code: 'bad-proof' };
  const keys = Object.keys(proof).sort();
  if (keys.length !== 2 || keys[0] !== 'code' || keys[1] !== 'kind') return { ok: false, code: 'bad-proof' };
  if (proof.kind !== 'totp' || typeof proof.code !== 'string' || !CODE_RE.test(proof.code)) return { ok: false, code: 'bad-proof' };
  return { ok: true, code: proof.code };
}

// ─────────────────────────────────────────────────────────────────────────────
// 상태 파일
// ─────────────────────────────────────────────────────────────────────────────

const freshState = () => ({ v: 1, lastAcceptedStep: -1, failures: 0, lockouts: 0, lockedUntil: 0, cfg: null, ledger: [] });
const STATE_KEYS = ['cfg', 'failures', 'lastAcceptedStep', 'ledger', 'lockedUntil', 'lockouts', 'v'];
const CFG_KEYS = ['algorithm', 'fp', 'period'];
const ENTRY_KEYS = ['at', 'cmdHashHex', 'step'];
const HEX32_RE = /^[0-9a-f]{32}$/;
const sameKeys = (o, want) => { const k = Object.keys(o).sort(); return k.length === want.length && k.every((x, i) => x === want[i]); };

function parseState(text) {
  let s;
  try { s = JSON.parse(text); } catch (_) { throw reject('state-corrupt', 'not json'); }
  const bad = (d) => reject('state-corrupt', d);
  if (!isPlain(s) || !sameKeys(s, STATE_KEYS)) throw bad('keys');
  if (s.v !== 1) throw bad('version');
  if (!Number.isSafeInteger(s.lastAcceptedStep) || s.lastAcceptedStep < -1) throw bad('lastAcceptedStep');
  if (!Number.isSafeInteger(s.failures) || s.failures < 0) throw bad('failures');
  if (!Number.isSafeInteger(s.lockedUntil) || s.lockedUntil < 0 || s.lockedUntil > MAX_STATE_SEC) throw bad('lockedUntil');
  if (!Number.isSafeInteger(s.lockouts) || s.lockouts < 0 || s.lockouts > HARD_LOCK_AFTER) throw bad('lockouts');
  if (s.cfg !== null) {
    if (!isPlain(s.cfg) || !sameKeys(s.cfg, CFG_KEYS)) throw bad('cfg keys');
    if (!ALGORITHMS.includes(s.cfg.algorithm) || !Number.isSafeInteger(s.cfg.period) || s.cfg.period < MIN_PERIOD || s.cfg.period > MAX_PERIOD ||
        typeof s.cfg.fp !== 'string' || !HEX32_RE.test(s.cfg.fp)) throw bad('cfg');
  }
  if (!Array.isArray(s.ledger)) throw bad('ledger');
  let prev = -1;
  for (const e of s.ledger) {
    if (!isPlain(e) || !sameKeys(e, ENTRY_KEYS)) throw bad('ledger entry keys');
    if (!Number.isSafeInteger(e.step) || e.step < 0 || !Number.isSafeInteger(e.at) || e.at < 0 || e.at > MAX_STATE_SEC || typeof e.cmdHashHex !== 'string' || !HEX64_RE.test(e.cmdHashHex)) throw bad('ledger entry');
    if (e.step <= prev || e.step > s.lastAcceptedStep) throw bad('ledger order');   // 단조 규칙이 장부 모양으로도 드러나요
    prev = e.step;
  }
  return s;
}

function serializeState(s) {
  // 키 순서를 고정해 써요 — 같은 상태는 같은 바이트(검사·비교 용이)
  return JSON.stringify(plainState(s)) + '\n';
}
// 상태의 «값» 복사 (키 순서 고정) — serializeState · snapshot · 다음 상태 조립이 같은 모양을 쓰게 한 곳에 모았어요
function plainState(s) {
  return {
    v: 1, lastAcceptedStep: s.lastAcceptedStep, failures: s.failures, lockouts: s.lockouts, lockedUntil: s.lockedUntil,
    cfg: s.cfg === null ? null : { period: s.cfg.period, algorithm: s.cfg.algorithm, fp: s.cfg.fp },
    ledger: s.ledger.map((e) => ({ step: e.step, cmdHashHex: e.cmdHashHex, at: e.at })),
  };
}
const lockSecFor = (lockouts) => Math.min(LOCK_SEC * 2 ** (lockouts - 1), MAX_LOCK_SEC);
const cfgOf = (secret, algorithm, period) => ({
  period, algorithm,
  fp: crypto.createHmac('sha256', secret).update('eg-totp-state/v1').digest('hex').slice(0, 32),
});
const sameCfg = (a, b) => a.period === b.period && a.algorithm === b.algorithm && a.fp === b.fp;
// 시각 인자 검사 — 호출자 오류(TypeError). 상한을 두는 이유는 머리말(시계)에.
const checkNow = (n, label) => { if (!Number.isSafeInteger(n) || n < 0 || n > MAX_NOW) throw new TypeError(label + ': now 는 0..2^40 의 안전 정수'); };

const pruned = (ledger, now) => ledger.filter((e) => e.at >= now - RETENTION_SEC);

// rename 의 내구화: 부모 디렉터리 fsync. process.platform 은 호출 때마다 읽어요(검사가 플랫폼을 바꿔 끼워 두 갈래를 다 밟을 수 있게).
function syncDir(dir) {
  if (process.platform === 'win32') return;      // 디렉터리를 파일처럼 열 수 없어요 — 이 보장은 그 플랫폼에선 못 줘요(머리말)
  const fd = fs.openSync(dir, 'r');
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

class TotpStore {
  constructor(filePath, opts) {
    if (typeof filePath !== 'string' || !filePath) throw new TypeError('TotpStore: filePath 가 필요해요');
    const o = opts || {};
    this.file = path.resolve(filePath);
    this._lock = this.file + '.lock';
    this._closed = false;
    this._state = freshState();
    try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); } catch (_) { throw reject('state-unavailable', 'mkdir'); }
    try { OP.acquireFileLock(this._lock); } catch (e) {
      if (e instanceof OP.OpcmdError) throw reject('state-unavailable', 'lock');
      throw e;
    }
    try {
      this._load();
      if (o.now !== undefined) {
        checkNow(o.now, 'TotpStore');
        this._state.ledger = pruned(this._state.ledger, o.now);       // 메모리에서만 — 디스크는 다음 쓰기(=compact)가 정리해요
      }
    } catch (e) {
      this.close();                  // 열기에 실패한 인스턴스가 잠금을 쥔 채 남지 않게
      throw e;
    }
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    OP.releaseFileLock(this._lock);
  }

  _load() {
    let raw;
    try { raw = fs.readFileSync(this.file, 'utf8'); } catch (e) {
      if (e && e.code === 'ENOENT') return;                           // 처음 — 빈 상태
      throw reject('state-unavailable', 'read');
    }
    this._state = parseState(raw);    // 0바이트·잘린 파일도 손상이에요: 원자 교체라서 정상 경로에선 생길 수 없어요
  }

  // 임시 파일에 «전부» 쓰고 fsync 한 뒤 rename. writeSync 는 일부만 쓰고 돌아올 수 있어서(디스크 가득 참) 반환값을 세어 끝까지 반복해요.
  _persist(next) {
    if (this._closed) throw reject('state-unavailable', 'closed');
    const text = serializeState(next);
    try { parseState(text); } catch (_) { throw reject('state-corrupt', 'refusing to write a state the reader would reject'); }   // 쓰는 쪽과 읽는 쪽이 어긋나면 «자기가 쓴 걸 자기가 못 여는» 파일이 생겨요
    const buf = Buffer.from(text, 'utf8');
    const tmp = this.file + '.tmp';
    let fd;
    try {
      fd = fs.openSync(tmp, 'w');
      let off = 0;
      while (off < buf.length) {
        const w = fs.writeSync(fd, buf, off, buf.length - off);
        if (!(w > 0)) throw new Error('no progress');
        off += w;
      }
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(tmp, this.file);
    } catch (_) {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch (__) { /* noop */ } }
      try { fs.unlinkSync(tmp); } catch (__) { /* noop */ }
      throw reject('state-unavailable', 'write');
    }
    this._state = next;               // 파일이 교체된 «뒤에만» 메모리를 바꿔요 (디렉터리 fsync 가 실패해도 파일은 이미 새 상태라 메모리가 따라가야 어긋나지 않아요)
    try { syncDir(path.dirname(this.file)); } catch (_) { throw reject('state-unavailable', 'dir fsync'); }   // 내구화 못 한 ok 는 내지 않아요
  }

  // 읽기 전용 사본 (등록 모듈·검사용)
  snapshot() { return plainState(this._state); }

  // 그 단계가 어느 명령에 쓰였나 (hex) — 호출자가 «확인 루프» 를 만들 재료예요(머리말 위협 모델). 장부 보존(24시간) 밖이면 null.
  ledgerFor(step) {
    const e = this._state.ledger.find((x) => x.step === step);
    return e ? e.cmdHashHex : null;
  }

  // 이 코드가 «이미 쓰인 단계» 에 맞는가 — **읽기 전용 엿보기**예요. 상태를 쓰지 않고(실패 횟수 · 잠금 · 단계 소비 모두 안 건드려요) {step, usedBy(hex)} 또는 null 을 돌려줘요.
  //   왜 있나: 명령이 «증명 단계에 닿기 전에» 정책(결정이 사라짐 · 알 수 없는 항목 · 값이 나쁜 인자)으로 거절되면 verify 가 불리지 않아서, 그 코드가 다른 명령에 쓰였다는 흔적을 못 봐요.
  //   호출자가 거절 직전에 이걸 불러서 바꿔치기 의심을 «정책 거절 뒤에도» 알아챌 수 있게요. ctx = {now, secret}(verify 와 같은 의미). 모양이 틀리면 null(던지지 않아요).
  spentBy(code, ctx) {
    if (this._closed || !ctx || typeof ctx !== 'object' || !Buffer.isBuffer(ctx.secret) || !Number.isSafeInteger(ctx.now) || ctx.now < 0) return null;
    if (typeof code !== 'string' || !CODE_RE.test(code)) return null;
    if (ctx.secret.length < MIN_SECRET_BYTES || ctx.secret.length > MAX_SECRET_BYTES) return null;
    const cur = Math.floor(ctx.now / PROOF_PERIOD);
    const given = Buffer.from(code, 'ascii');
    let found = null;
    for (let s = cur - WINDOW_STEPS; s <= cur + WINDOW_STEPS; s++) {
      if (s < 0) continue;
      const want = Buffer.from(hotp(ctx.secret, s), 'ascii');
      if (crypto.timingSafeEqual(given, want)) {
        const by = this.ledgerFor(s);
        if (by !== null) found = { step: s, usedBy: by };       // 큰 단계가 이겨요(verify 의 totp-replayed 와 같은 규칙)
      }
    }
    return found;
  }

  // 재등록(비밀·주기·알고리즘 교체) 또는 하드 비활성 해제 — 상태를 처음으로 되돌려요. «보드 로컬 코드만» 부를 것(중계 입력으로 닿으면 잠금이 무의미해져요).
  reset() {
    this._persist(freshState());
  }

  // 24시간 보존 정리 — 쓰기가 곧 compact 라서 평소엔 따로 부를 일이 없어요. 입력 탓 실패는 없고 파일 문제만 던져요.
  compact(now) {
    checkNow(now, 'compact');
    const next = plainState(this._state);
    next.ledger = pruned(next.ledger, now);
    this._persist(next);
  }

  // proof 객체를 받는 편의 진입점 — 모양 검사(bad-proof)는 상태를 만지지 않아요.
  verifyProof(proof, cmdHashBuf, ctx) {
    const p = parseProof(proof);
    if (!p.ok) return { ok: false, code: 'bad-proof' };
    return this.verify(p.code, cmdHashBuf, ctx);
  }

  // ctx = {now, secret, algorithm?, digits?, period?}. 성공이면 {ok:true, step}, 아니면 {ok:false, code[, lockedUntil]}.
  // 이 함수는 «증명 검사» 예요 — nonce 소비(opcmd consumeNonce)는 호출자가 이게 ok 를 낸 «뒤에» 해요. 반대로 nonce 가 걸러진 명령은 이 함수를
  //   부르지 않아야 코드 단계가 안 타요. (이 함수가 ok 를 낸 뒤 nonce 단계가 실패하면 그 단계는 이미 소비됐어요 — 다음 코드를 쓰세요.)
  verify(code, cmdHashBuf, ctx) {
    if (!ctx || typeof ctx !== 'object') throw new TypeError('ctx 가 필요해요');
    checkNow(ctx.now, 'ctx');
    if (!Buffer.isBuffer(ctx.secret)) throw new TypeError('ctx.secret 은 Buffer 예요');
    if (!Buffer.isBuffer(cmdHashBuf) || cmdHashBuf.length !== 32) throw new TypeError('cmdHash 는 32바이트 Buffer 예요');
    if (this._closed) return { ok: false, code: 'state-unavailable' };
    const now = ctx.now;

    // 1) 모양 — 상태를 읽지도 쓰지도 않아요
    if (typeof code !== 'string' || !CODE_RE.test(code)) return { ok: false, code: 'bad-proof' };

    // 2) 보드 로컬 설정 — 증명 경로는 6자리 고정(와이어 모양이 6자리라서). 알고리즘·주기만 레코드로 바꿀 수 있어요.
    const algorithm = ctx.algorithm === undefined ? PROOF_ALGORITHM : ctx.algorithm;
    const digits = ctx.digits === undefined ? PROOF_DIGITS : ctx.digits;
    const period = ctx.period === undefined ? PROOF_PERIOD : ctx.period;
    if (!ALGORITHMS.includes(algorithm) || digits !== PROOF_DIGITS || !Number.isSafeInteger(period) || period < MIN_PERIOD || period > MAX_PERIOD ||
        ctx.secret.length < MIN_SECRET_BYTES || ctx.secret.length > MAX_SECRET_BYTES) {
      return { ok: false, code: 'bad-config' };
    }

    // 3) 상태 ↔ 이번 호출의 일관성 — 코드를 «평가하기 전에» 끊어요(신탁이 안 되고 아무것도 세지 않아요)
    const st = this._state;
    const cfg = cfgOf(ctx.secret, algorithm, period);
    if (st.cfg !== null && !sameCfg(st.cfg, cfg)) return { ok: false, code: 'state-mismatch' };
    const cur = Math.floor(now / period);
    if (st.lastAcceptedStep > cur + WINDOW_STEPS) return { ok: false, code: 'state-ahead' };
    if (st.lockouts >= HARD_LOCK_AFTER) return { ok: false, code: 'totp-disabled' };

    // 4) 잠금 — 맞는 코드에도 같은 답이라 신탁이 안 돼요
    if (now < st.lockedUntil) return { ok: false, code: 'totp-locked', lockedUntil: st.lockedUntil };

    // 5) 후보 셋 전부를 상수 시간으로 비교한 뒤 합쳐요 (첫 일치에서 빠져나가지 않아요)
    const given = Buffer.from(code, 'ascii');
    const cands = [];
    for (let s = cur - WINDOW_STEPS; s <= cur + WINDOW_STEPS; s++) {
      if (s < 0) continue;                                            // T0=0 이전 단계는 없어요
      const want = Buffer.from(hotp(ctx.secret, s, { algorithm, digits }), 'ascii');
      cands.push({ step: s, eq: crypto.timingSafeEqual(given, want) });
    }
    const matched = cands.filter((c) => c.eq);
    const eligible = matched.filter((c) => c.step > st.lastAcceptedStep);   // 엄격히 큰 단계만 — 같은 단계는 재전송
    if (eligible.length > 0) {
      const step = Math.min(...eligible.map((c) => c.step));          // 우연히 두 단계가 같은 값이면 작은 쪽만 소비해요(미래 단계를 덜 태워요)
      const next = {
        v: 1, lastAcceptedStep: step, failures: 0, lockouts: 0, lockedUntil: 0, cfg: st.cfg === null ? cfg : st.cfg,
        ledger: pruned(st.ledger, now).concat([{ step, cmdHashHex: cmdHashBuf.toString('hex'), at: now }]),
      };
      try { this._persist(next); } catch (e) {
        if (e instanceof TotpError) return { ok: false, code: e.code };
        throw e;
      }
      return { ok: true, step };
    }
    if (matched.length > 0) {
      // 맞는 코드지만 소비된 단계 — 세지 않아요. 그 단계가 장부에 남아 있으면 «어느 명령에 쓰였나» 도 같이 돌려줘요(큰 단계부터 — 장부 보존(24시간) 밖이면 null 이라 생략).
      const res = { ok: false, code: 'totp-replayed' };
      for (let i = matched.length - 1; i >= 0; i--) {
        const by = this.ledgerFor(matched[i].step);
        if (by !== null) { res.step = matched[i].step; res.usedBy = by; break; }
      }
      return res;
    }

    // 6) 틀린 6자리 — 센다. 기록 못 하면 «틀렸다» 도 말하지 않고 닫힌 채 실패해요.
    const failures = st.failures + 1;
    let lockedUntil = st.lockedUntil;
    let lockouts = st.lockouts;
    if (failures >= MAX_FAILURES) { lockouts = st.lockouts + 1; lockedUntil = now + lockSecFor(lockouts); }   // 걸릴 때마다 두 배
    try {
      this._persist({ v: 1, lastAcceptedStep: st.lastAcceptedStep, failures, lockouts, lockedUntil, cfg: st.cfg === null ? cfg : st.cfg, ledger: st.ledger });
    } catch (e) {
      if (e instanceof TotpError) return { ok: false, code: e.code };
      throw e;
    }
    const res = { ok: false, code: 'totp-invalid' };
    if (lockedUntil > now) res.lockedUntil = lockedUntil;
    return res;
  }
}

module.exports = {
  ALGORITHMS,
  PROOF_DIGITS,
  PROOF_PERIOD,
  WINDOW_STEPS,
  MAX_FAILURES,
  LOCK_SEC,
  MAX_LOCK_SEC,
  HARD_LOCK_AFTER,
  MAX_NOW,
  RETENTION_SEC,
  REJECT_CODES,
  TotpError,
  hotp,
  stepOf,
  totpAt,
  generateSecret,
  base32Encode,
  base32Decode,
  otpauthUri,
  parseProof,
  TotpStore,
};
