'use strict';
// operator-auth.cjs — 보드 운영자 계정 층 (Constellation v2.4.136 §13.25.17, deps-0).
//
// **왜 필요한가.** 운영자 판정이 지금은 «주소» 예요 — 이 기계에서 온 접속이면 보드를 넘겨요. 리버스
// 프록시 뒤에서는 원격이 전부 이 기계처럼 보이니 그 판정이 뒤집혀요. 직전 컷은 전달 헤더를 보고 그
// 경우를 **거절**하는 데까지 갔는데, 거절은 알아챈 것이지 길을 낸 게 아니에요. 주소는 «어디서» 를 답하고
// «누구» 를 못 답해요 — 그 자리에 필요한 건 계정이에요.
//
// **가산 규율 (이 파일의 계약).** 계정이 하나도 없으면 이 층은 **완전히 꺼져 있어요** — 판정도, 쿠키도,
// 화면도 종전과 비트 단위로 같아요. 도입 여부가 «계정을 만들었는가» 하나로 정해지는 게 운영자 결정이고,
// access.json 이 이미 쓰는 가산 패턴과 같은 모양이에요(부재 = 무변화). 그래서 이 파일이 존재하는 것만으로는
// 아무 배포도 바뀌지 않아요.
//
// **저장.** operators.json (서버 옆, gitignore — key.json·access.json 과 같은 급의 비밀 파일).
//   { operators: [{ id, name, salt, hash, iter, createdAt, lastLoginAt }] }
//   비밀번호는 scrypt 로만 저장해요. 평문·가역 암호화는 이 파일에 절대 안 들어가요.
//
// **세션.** 메모리 전용이에요. 서버가 재기동하면 전원 재로그인 — 이게 옳아요: 세션을 디스크에 두면
//   그 파일이 비밀 하나 더가 되고, 재기동은 드물고, 재로그인 비용은 몇 초예요.

const fs = require('fs');
const crypto = require('crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;      // 12시간 — 근무 하루를 덮되 무기한은 아니게
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 8;                        // 창당 실패 상한 (id 별 · 느린 해시와 합쳐 대입 방어)

function createOperatorAuth(opts) {
  const FILE = opts.file;
  const log = opts.log || (() => {});
  let store = { operators: [] };
  const sessions = new Map();                     // token → { id, name, exp }
  const fails = new Map();                        // id → { n, until }

  // 이 파일은 암호 해시를 담아요. 종전엔 **기본 권한으로 쓰고 그 다음 chmod** 했는데, 그 사이에
  //   창이 열려요 — umask 에 따라 같은 호스트의 다른 사용자가 읽을 수 있는 상태로 잠깐 존재해요.
  //   그리고 `mode` 는 **새로 만들 때만** 적용되니, 이미 느슨한 파일을 덮어쓰면 권한이 그대로예요.
  //   그래서 셋을 함께 해요: ⓐ 적재 시 경화(기존 파일 구제) ⓑ 임시 파일을 0600 으로 만들어
  //   원자적 교체(창 제거 + 부분 쓰기 방지) ⓒ 교체 후 한 번 더 확인.
  // 시도한 뒤 **다시 재요.** 안 바뀌었으면 그 플랫폼이 이 권한을 표현하지 못하는 것이고, 그때는
  //   매 적재마다 조용히 같은 시도를 반복하는 대신 **한 번 말하고 그만해요** — 수렴하지 않는 교정은
  //   「고쳤다」와 「고칠 수 없다」를 같은 침묵으로 만들어요. (Windows 에서 실측: 0644 로 읽히고
  //   chmod 가 반영되지 않아요. 배포 대상인 리눅스에서는 정상 동작해요.)
  let _hardenGaveUp = false;
  function harden(p) {
    try {
      const before = fs.statSync(p).mode & 0o777;
      if (!(before & 0o077)) return;
      fs.chmodSync(p, 0o600);
      const after = fs.statSync(p).mode & 0o777;
      if (!(after & 0o077)) { log('[operator-auth] crypto-03 권한 경화 ' + before.toString(8) + ' → ' + after.toString(8)); return; }
      if (!_hardenGaveUp) {
        _hardenGaveUp = true;
        log('[operator-auth] ⚠ crypto-03 권한을 이 플랫폼이 표현하지 못해요 (' + before.toString(8) + ' 유지). 파일 권한으로는 이 비밀을 못 지켜요 — 이 경고는 한 번만.');
      }
    } catch { /* 없으면 할 일 없음 */ }
  }
  function load() {
    harden(FILE);
    try {
      const j = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      store = { operators: Array.isArray(j && j.operators) ? j.operators : [] };
    } catch { store = { operators: [] }; }
    return store;
  }
  function save() {
    // 원자적 교체 — 임시 파일을 처음부터 0600 으로 만들고 rename 해요. rename 은 권한을 보존해요.
    const tmp = FILE + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
    try { fs.chmodSync(tmp, 0o600); } catch {}   // umask 가 mode 를 깎는 플랫폼 대비
    fs.renameSync(tmp, FILE);
    harden(FILE);                                 // 되돌림 확인 (관측 불가는 통과가 아니에요)
  }
  load();
  try { fs.watchFile(FILE, { interval: 2000 }, () => load()); } catch {}

  // 계정 0 = 층 자체가 꺼짐. 이 술어가 가산 계약의 전부예요.
  const enabled = () => store.operators.length > 0;

  function hash(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.scrypt(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p },
        (e, dk) => (e ? reject(e) : resolve(dk.toString('hex'))));
    });
  }

  async function addOperator(id, name, password) {
    id = String(id || '').trim();
    if (!/^[a-zA-Z0-9._-]{2,32}$/.test(id)) throw new Error('id 는 영숫자·._- 2~32자');
    if (String(password || '').length < 8) throw new Error('비밀번호는 8자 이상');
    if (store.operators.some((o) => o.id === id)) throw new Error('이미 있는 id');
    const salt = crypto.randomBytes(16).toString('hex');
    // 해시를 **push 전에** 계산해요. await 를 push 인자 안에 두면 `store.operators` 를 await 전에
    //   읽어 놓고, await 동안 watchFile 의 load() 가 `store` 를 새 객체로 갈아치우면 push 는 옛
    //   배열에 가고 save() 는 빈 새 store 를 써요(계정이 조용히 사라져요). 비동기 경계 사이의
    //   read-modify-write 라, 경계를 걷어내 store 를 push 시점에 읽게 해요.
    const h = await hash(password, salt);
    store.operators.push({ id, name: String(name || id).slice(0, 64), salt, hash: h, kdf: 'scrypt', createdAt: new Date().toISOString(), lastLoginAt: null });
    save();
    log('[auth] 운영자 계정 추가 id=%s (총 %d)', id, store.operators.length);
    return { id, name };
  }

  function removeOperator(id) {
    const before = store.operators.length;
    store.operators = store.operators.filter((o) => o.id !== id);
    if (store.operators.length === before) return false;
    for (const [tok, s] of sessions) if (s.id === id) sessions.delete(tok);   // 지운 계정의 세션은 즉시 무효
    save();
    log('[auth] 운영자 계정 제거 id=%s (남은 %d%s)', id, store.operators.length, store.operators.length ? '' : ' — 로그인 층 꺼짐');
    return true;
  }

  async function verify(id, password) {
    const now = Date.now();
    const f = fails.get(id);
    if (f && f.until > now && f.n >= LOGIN_MAX_FAILS) return { ok: false, error: 'too-many-attempts', retryAfterMs: f.until - now };
    const op = store.operators.find((o) => o.id === id);
    // 없는 id 에도 같은 비용을 치러요 — 응답 시간으로 계정 존재 여부가 새지 않게.
    const salt = op ? op.salt : crypto.randomBytes(16).toString('hex');
    const got = Buffer.from(await hash(password, salt), 'hex');
    const want = Buffer.from(op ? op.hash : got.toString('hex'), 'hex');
    const same = op && got.length === want.length && crypto.timingSafeEqual(got, want);
    if (!same) {
      const cur = (f && f.until > now) ? f : { n: 0, until: now + LOGIN_WINDOW_MS };
      cur.n++; fails.set(id, cur);
      log('[auth] 로그인 실패 id=%s (창 내 %d/%d)', id, cur.n, LOGIN_MAX_FAILS);
      return { ok: false, error: 'bad-credentials' };
    }
    fails.delete(id);
    op.lastLoginAt = new Date().toISOString(); save();
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { id: op.id, name: op.name, exp: now + SESSION_TTL_MS });
    return { ok: true, token, operator: { id: op.id, name: op.name } };
  }

  function sessionOf(token) {
    if (!token) return null;
    const s = sessions.get(token);
    if (!s) return null;
    if (s.exp <= Date.now()) { sessions.delete(token); return null; }
    return s;
  }
  function logout(token) { return sessions.delete(token); }

  // §9 재인증(step-up) — 이미 로그인한 세션에 «셸 권한» 을 비밀번호로 한 번 더 확인해요. 지금
  //   운영자 세션은 «상태 읽기» 를 위해 발급된 거라, 그걸 그대로 셸 권한으로 쓰면 이미 나가 있는
  //   쿠키 전부가 소급해 셸 권한이 돼요(Pantty §9). 통과하면 그 세션에 시각을 찍고, 창 안에선
  //   재진입·새 탭이 안 물어요. **새 세션을 만들지 않아요** — 기존 세션에 step-up 시각만 얹어요.
  //   같은 scrypt 경로 + 실패 throttle 을 verify 와 공유해요.
  async function reauth(token, password) {
    const s = sessionOf(token);
    if (!s) return { ok: false, error: 'no-session' };
    const now = Date.now();
    const f = fails.get(s.id);
    if (f && f.until > now && f.n >= LOGIN_MAX_FAILS) return { ok: false, error: 'too-many-attempts', retryAfterMs: f.until - now };
    const op = store.operators.find((o) => o.id === s.id);
    if (!op) return { ok: false, error: 'no-account' };
    const got = Buffer.from(await hash(password, op.salt), 'hex');
    const want = Buffer.from(op.hash, 'hex');
    if (!(got.length === want.length && crypto.timingSafeEqual(got, want))) {
      const cur = (f && f.until > now) ? f : { n: 0, until: now + LOGIN_WINDOW_MS };
      cur.n++; fails.set(s.id, cur);
      return { ok: false, error: 'bad-credentials' };
    }
    fails.delete(s.id);
    s.reauthAt = now;
    return { ok: true };
  }
  // 이 토큰이 windowMs 안에 step-up 을 통과했는가. requireReauth=false 면 호출부가 이걸 안 봐요
  //   — 그 «안 봄» 이 「운영자 세션 = 셸 권한」 을 명시로 받아들이는 선택이고, 그 선택은 설정에 남아요.
  function reauthValidFor(token, windowMs) {
    const s = sessionOf(token);
    return !!(s && typeof s.reauthAt === 'number' && (Date.now() - s.reauthAt) < Number(windowMs || 0));
  }

  // 쿠키 파싱 — 요청 헤더에서 세션 토큰만 꺼내요.
  const COOKIE = 'eg_board_sid';
  function tokenFromReq(req) {
    const raw = (req && req.headers && req.headers.cookie) || '';
    for (const part of raw.split(';')) {
      const i = part.indexOf('=');
      if (i > 0 && part.slice(0, i).trim() === COOKIE) return decodeURIComponent(part.slice(i + 1).trim());
    }
    return null;
  }
  function operatorOfReq(req) { const s = sessionOf(tokenFromReq(req)); return s ? { id: s.id, name: s.name } : null; }
  // Secure 는 https 일 때만 — loopback http 개발 배치에서 Secure 를 붙이면 쿠키가 아예 저장되지 않아요.
  function setCookieHeader(token, secure) {
    return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure ? '; Secure' : ''}`;
  }
  function clearCookieHeader() { return `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`; }

  return {
    enabled, addOperator, removeOperator, verify, logout, reauth, reauthValidFor,
    operatorOfReq, tokenFromReq, sessionOf, setCookieHeader, clearCookieHeader,
    list: () => store.operators.map((o) => ({ id: o.id, name: o.name, createdAt: o.createdAt, lastLoginAt: o.lastLoginAt })),
    count: () => store.operators.length,
    COOKIE,
  };
}

module.exports = { createOperatorAuth, SESSION_TTL_MS };
