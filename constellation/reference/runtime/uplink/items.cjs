'use strict';
// items.cjs — 열린 결정 항목을 «봉인된 스냅샷» 으로 바꿔요 (기기 키는 uplink-keys.json, 봉인은 형제 seal.cjs).
//
// **무엇이 나가나.** state.json 의 decisions[] 중 status==='open' 인 항목마다 {itemId, status, rev, sealed?} 한 칸.
//   · **itemId 는 «가명» 이에요** — 'sd:' + HMAC(보드 로컬 비밀, 결정 id) 앞 24 hex. 결정 id 는 실제로 «주제가 담긴 글귀» 라서(설명하는 이름 모양) 그대로 싣으면 봉인 모드에서도 모든 결정의
//     주제가 중계에 보이고 envelope 모드의 «메타만» 이라는 약속이 깨져요. 진짜 id 는 «봉인된 평문 안» 에 들어 있어서 기기가 열어 보고 화면의 항목과 이어요(aad 의 itemId 는 가명).
//     같은 재료(tag)를 투영기가 DECISION_* 프레임의 meta.decision_id('h:'+tag)에도 써서, 중계는 «같은 결정» 임을 이어 볼 수 있어요(내용은 몰라도).
//   · visibility=sealed   — 맥락({question, detail, recommend, recommendChoice, options, kind})을 등록된 모든 기기의 공개키로 봉인해서 «sealed» 에 실어요(중계는 암호문만 봐요).
//   · visibility=envelope — 메타(itemId · status · rev)만. 맥락 자체가 안 나가요.
//   · **reversibility(결정 항목이 선언한 «되돌릴 수 있나»)는 봉인 «밖» 메타예요** — 두 모드 모두 같은 칸으로 나가요. 중계·폰이 «이 항목은 TOTP 로 못 답한다 — 패스키가 필요하다» 를 사람이 코드를 치기 «전에»
//     보여 줄 수 있게요(보드는 어차피 명령 때 다시 판정하니 이 칸은 안내일 뿐 권한이 아니에요). 선언이 없거나 어휘 밖이면 칸 자체가 빠지고, 빠진 칸은 «one_way» 로 읽혀요(project.cjs reversibilityOf).
//     값이 바뀌면 내용 해시가 달라져 rev 가 올라요 — 봉인 평문은 그대로여도 «판» 이 바뀐 거라서요.
//   봉인할 수 없는 상황(키 파일 없음·기기 0대)에서 «평문으로 대신» 나가는 길은 없어요 — sealed 칸이 빠진 채 나가고 한 번 말해요(안전하게 틀려요).
//
// **rev — 항목별 단조 증가 정수, 로컬에 영속.** 내용이 바뀌면 +1 이에요. **새 항목(기록 없음)의 첫 rev 는 «시계 바닥» (epoch 밀리초)** 이에요 — 상태 파일을 잃거나 항목 기록이 사라져도 새 rev 가 옛 값 아래로
//   되감기지 않아서(되감기면 «나중 판이 이긴다» 를 믿는 기기·중계가 갱신된 항목을 낡은 판으로 읽어요) 별도 저장소 없이 단조성이 유지돼요. 기록이 있으면 늘 +1 이에요. 판별은 «내용 해시» 로 해요(상태 파일이 매번 통째로 다시 써져도 내용이 같으면 rev 는 안 올라요).
//   내용 해시에는 «수신 기기 집합 + 보드 키» 도 들어가요 — 기기가 늘거나 줄면 봉투가 달라져야 하고(새 기기가 열 수 있어야 하고 빠진 기기가 못 열어야 해요), 달라진 봉투는
//   같은 rev 로 두면 «같은 (aad) 에 두 암호문» 이 생겨서 사용자의 답이 가리키는 판(contextHash)이 모호해져요. 그래서 rev 가 같이 올라요.
//   봉투째 상태 파일에 보관해서, 재시작이 rev 를 되감지도(옛 판이 최신으로 보임) 불필요하게 올리지도 않아요.
//   rev 의 «출처» 는 이 모듈(보드)예요 — 중계가 준 값을 기대값으로 받는 경로는 없어요(seal.cjs 머리말 «신선도»).
//
// **항목 기록 서명 (v2.4.178) — 모든 스냅샷 칸은 보드 키로 «서명된 기록» 을 달고 나가요.** 위의 메타(rev · status · reversibility)는 봉인 aad 에 안 들어가거나(reversibility) envelope 모드에선 서명이 아예 없어서,
//   중계(또는 업링크 토큰만 쥔 쪽)가 «two_way» 를 써 넣거나 큰 rev 로 항목을 얼릴 수 있었어요. 그래서 칸마다 `kind` · `v` · `sig` 를 더해요(기존 칸은 그대로 — 옛 소비자는 새 칸을 무시해요):
//     entry = {itemId, status, rev, sealed?, reversibility?, kind, v:1, sig}
//     sig   = 보드 P-256 키 · ECDSA/SHA-256 · IEEE-P1363 · base64url, 서명 바이트 = utf8(canonicalize({boardId, itemId, rev, status, kind, reversibility | null, v:1}))   (canonicalize = 영수증과 같은 opcmd.canonicalize)
//     kind  = 항목 종류 — 'state_decision' (itemId 'sd:<tag>' 의 종류. 중계가 접두로 정하는 것과 같은 낱말). reversibility 는 «열린 항목의 선언값», 없거나 닫힌 항목이면 null.
//   폰·중계는 이미 핀해 둔 보드 키로 «WebCrypto 만으로» 검증해요. boardId 는 칸에 안 실려요 — 검증자가 «이 업링크가 말하는 보드» 의 id 를 써요(다른 보드의 기록을 이 보드 것으로 못 내밀어요).
//   한 칸만 바꿔도(rev · status · reversibility 의 추가/삭제/변경) 서명이 깨져요. 보드 키가 없으면 sig 칸 없이 나가고 한 번 말해요(서명을 못 한 것이지 «서명이 필요 없다» 가 아니에요 — 검증자는 sig 없는 칸을 «미확인» 으로 다뤄요).
//   서명은 (itemId, rev, status, kind, reversibility, 키) 가 같으면 프로세스 안에서 «같은 바이트» 로 재사용해요 — **비용 절약이지 약속이 아니에요**(ECDSA 는 매번 다른 서명을 내서 수천 항목을 전체 스냅샷마다 새로 서명하면 비싸요).
//   재시작하면 캐시가 비어서 «같은 기록» 도 다른 서명 바이트로 나가요(둘 다 검증돼요). 그래서 **검증자는 «서명된 칸» 을 비교하지 서명 바이트를 비교하지 않아요** — 같은 칸에 다른 유효 서명은 변조가 아니라 무해한 재서명이고,
//   변조는 «검증이 깨지는 것» 으로 드러나요(서명 바이트가 같다/다르다 는 증거가 아니에요).
//
// **검증자 규칙 (v2.4.178) — 서명은 «받는 쪽이 어떻게 읽을 때» 만 막아 줘요.** 아래가 빠지면 서명이 있어도 얼리기·거짓 닫힘이 남아요.
//   ① **서명 없는(또는 검증 실패한) 칸은 rev 순서 겨루기에 끼지 않아요** — 저장된 rev 를 올리지도, 서명된 기록을 밀어내지도 못해요(서명 없는 칸의 rev 를 «나중 것이 이긴다» 에 쓰면 먼 미래의 rev 하나로 진짜 개정이
//      전부 낡은 것이 돼요). 이 보드의 서명이 한 번이라도 검증된 뒤에는 그 보드의 서명 없는 칸을 받지 않아요. 같은 rev 에서 «서명된 칸» 은 저장된 «서명 없는 행» 을 대체해요(내용이 같을 때).
//   ② **닫힘의 근거는 «서명된 닫는 기록(status=resolved, 더 큰 rev)» 뿐이에요.** «전체 스냅샷(full·final)에 안 나온 항목 = 닫힘» 은 서명이 덮지 못하는 추론이라(full · final 도, «무엇이 언급됐나» 도 서명 밖) 토큰만 가진 쪽이
//      빈 전체 스냅샷으로 열린 항목을 전부 «닫을» 수 있어요 — 그래서 부재로 닫은 것은 «미확인 닫힘» 으로 두고, 서명된 닫는 기록이 오면 확정하고, 서명된 «더 큰 rev 의 open» 이 오면 되살려요.
//      보드는 닫는 기록을 «변경» 으로 한 번 내보낼 뿐 아니라 전체 스냅샷에도 «최근 7일 · 최대 64건» 다시 실어서(fullEntries) 닫는 통지가 전송 전에 사라져도 확정할 길이 남아요.
//   ③ **서명된 첫 판은 새 rev 예요** — 서명 없이 나갔던 rev 를 서명만 붙여 같은 rev 로 다시 내지 않아요(아래 run() 의 signedFp). 업그레이드 직후·envelope 모드에서 키가 나중에 생긴 때 열린 항목은 rev 가 한 번 올라요.
//   (보드가 «전체 스냅샷 목록(manifest)» 자체에 서명해서 부재를 증명하게 하는 길은 일부러 안 냈어요 — 닫는 기록을 다시 싣는 쪽이 중계의 기존 «큰 rev 만» 규칙과 맞고, 서명 없는 부재 추론은 «미확인» 으로 남는 것이 정직해요.)
//
// **맥락 묶음 (v2.4.179) — 남아 있던 신선도 구멍이 닫힌 방식.** 위 서명으로 기기는 «진짜 판» 을 알아보지만, 새 판을 못 본 기기는 옛 판(서명이 진짜)과 지금 판을 못 가르고 중계는 옛 판을 다시 내밀 수 있었어요.
//   이제 맥락에 기대는 답 명령(decision.answer · hyperbrief.respond)이 «사람이 본 판» 을 서명된 인자로 실어요 — rev(이 스냅샷 칸의 rev, 서명된 기록에서 읽어요)와, 칸에 sealed 가 있으면
//   기기가 연 그 봉투의 seal.contextHash. 보드는 «자기가 내보낸» 이 모듈의 기록(store.state.items — rev · 봉투째 상태 파일에 영속)과 비교해서 다르면 stale-context 로 거절해요(exec.cjs «맥락 묶음»).
//   **새로 판정에 쓰이게 된 «서명 밖» 칸은 없어요.** rev 는 서명 대상이고, contextHash 는 기기가 «서명된 봉투» 에서 스스로 계산해요. 칸에 sealed 가 «있는지» 는 서명 밖이지만 해시가 필요한지는 보드가 자기 기록으로 정해요 —
//   중계가 sealed 를 빼면 기기는 해시 없이 답하고 보드는 bad-args 로 거절하고, 옛 봉투로 바꿔 끼우면 기기의 열기가 aad-mismatch(서명된 rev 로 지은 aad)이거나 해시가 달라 stale-context 예요(어느 쪽도 «받아들여짐» 이 아니에요).
//   기록을 잃으면(상태 파일 손상 · 깨진 봉투 기록을 버림) 항목은 시계 바닥의 새 rev 로 다시 나가서 옛 판에 묶인 답은 거절돼요 — 묶음을 잃는 쪽은 «거절» 로만 틀려요.
//   이게 성립하려면 «내보낸 판 ⊆ 디스크에 있는 판» 이어야 해요 — 저장이 실패한 동기는 메모리의 기록을 되돌리고 던져서(run()) 저장 안 된 rev 가 스냅샷에 실리지도 판정에 쓰이지도 않아요.
//   안 그러면 재시작 뒤 같은 rev 가 다른 내용에 다시 붙어서 옛 판에 묶인 답이 «같은 rev» 로 통과해요. 조립부(index.cjs)도 «동기에 성공한 텍스트» 만 동기된 것으로 쳐서, 실패하면 실행기의 다음 읽기가 다시 동기하고(그때도 실패면 state-unavailable) 감시의 다음 주기가 같은 변경을 다시 내보내요.
//
// **상한.** 봉인 평문은 64KB 까지인데 한 배치(256KB)에 여러 항목이 들어가야 해서 칸마다 상한을 둬요(문자열 16000자 · 선택지 32개×500자). 넘치면 «잘라서» 봉인해요 — 이건
//   «나가도 되는 내용을 줄이는» 방향의 절단이라 안전하고, 사람이 보는 맥락의 끝이 잘릴 수 있다는 건 문서화된 한계예요.

const fs = require('fs');
const crypto = require('crypto');
const SEAL = require('./seal.cjs');
const OP = require('./opcmd.cjs');
const { tagOf, TAG_HEX, reversibilityDeclared } = require('./project.cjs');

const MAX_STR = 16000;
const MAX_OPTIONS = 32;
const MAX_OPTION_STR = 500;
const MAX_DEVICES = 16;
const MAX_CREDENTIALS = 64;
const ITEM_KIND = 'state_decision';            // itemId 'sd:<tag>' 의 항목 종류 — 서명 대상 칸(머리말 «항목 기록 서명»). 중계가 접두로 정하는 종류 낱말과 같아요
const MAX_ITEMS = 2000;                 // 상태 파일 속 항목 기록 상한 — 넘으면 «끝난 것» 부터 지워요
const CLOSED_RESEND_MS = 7 * 24 * 3600 * 1000;      // 전체 스냅샷에 «최근에 닫힌 항목의 서명된 닫는 기록» 을 함께 싣는 기간 — 중계가 «조용한 보드» 를 놓아주는 창(7일)과 같은 길이
const MAX_CLOSED_RESEND = 64;           // 그 개수 상한 — 전체 스냅샷이 닫힌 기록으로 부풀지 않게
const ITEM_ID_RE = /^[^\x00-\x1f\x7f]{1,200}$/;    // 진짜 id 는 «봉인 평문» 으로만 가요 — 여기선 «내보낼 수 있는 모양인가» 정도만 봐요

const sha256hex = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// ── 키 파일 (이 클래스는 읽기 전용 — 쓰기는 keyset.cjs 한 곳: 보드 호스트 CLI(cli.cjs)와 서명된 등록 명령이 같은 함수로 써요) ──────────────
class KeyReader {
  constructor(file, log) { this.file = file; this.log = log; this._sig = null; this._val = null; this._warned = new Set(); }

  _once(key, msg) { if (this._warned.has(key)) return; this._warned.add(key); this.log(msg); }

  // {ok:true, boardPriv, boardPub, boardFp, devices:[{deviceId, kid, pub, name}], credentials:[{credentialId, alg, publicKey(SPKI DER), signCount, acct}], totp:{secretB32, acct}|null, version} | {ok:false, reason, version:'none'}
  //   quiet — envelope 모드가 «서명 키만» 보려고 읽을 때예요. 봉인 모드 전용 문구를 내지 않아요(호출자가 자기 말을 해요).
  read(quiet) {
    let st;
    try { st = fs.statSync(this.file); } catch (_) { this._sig = null; this._val = { ok: false, reason: 'no-file', version: 'none' }; if (!quiet) this._once('nofile', '[uplink] 키 파일이 없어요 (uplinkKeys) — 맥락을 봉인할 수 없어서 sealed 칸 없이 나가요'); return this._val; }
    const sig = st.mtimeMs + ':' + st.size;
    if (sig === this._sig && this._val) return this._val;
    this._sig = sig;
    this._val = this._parse(quiet);
    return this._val;
  }

  _parse(quiet) {
    const fail = (reason, msg) => { if (!quiet) this._once('bad:' + reason, '[uplink] 키 파일을 쓸 수 없어요 (' + msg + ') — sealed 칸 없이 나가요'); return { ok: false, reason, version: 'none' }; };
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
    this._sigCache = new Map();    // itemId → {priv, rev, status, kind, rv, sig} — 같은 기록은 같은 서명 바이트로(머리말)
  }

  _once(key, msg) { if (this._warned.has(key)) return; this._warned.add(key); this.log(msg); }

  // 서명에 쓸 보드 키 — 봉인 모드의 키 읽기와 «같은» 판독기를 거치되 envelope 모드에선 조용히(자기 말은 아래에서 한 번만).
  _signKey() {
    if (!this.keys || typeof this.keys.read !== 'function') return null;
    let k = null;
    try { k = this.keys.read(this.visibility !== 'sealed'); } catch (_) { k = null; }
    return k && k.ok && k.boardPriv ? k : null;
  }

  // 보드 키의 지문 — «이 키로 서명된 첫 판» 을 가리는 표지(rec.signedFp)예요. 키 판독기가 안 주면(시험용 대역) 개인키에서 직접 구해요.
  _fpOf(key) {
    if (typeof key.boardFp === 'string' && key.boardFp) return key.boardFp;
    try { return OP.boardKeyFingerprint(crypto.createPublicKey(key.boardPriv)); } catch (_) { return null; }
  }

  // 항목 기록 서명(머리말) — 서명 바이트의 «정의» 는 이 한 함수예요. 키가 없으면 null.
  _signRecord(itemId, rec, rv, key) {
    const kind = ITEM_KIND;
    if (this._sigCache.size > MAX_ITEMS + 64) this._sigCache.clear();       // 지워진 항목의 서명이 쌓이지 않게 — 비워도 다음에 다시 지어요
    const c = this._sigCache.get(itemId);
    if (c && c.priv === key.boardPriv && c.rev === rec.rev && c.status === rec.status && c.rv === rv) return c.sig;
    const fields = { boardId: this.boardId, itemId, rev: rec.rev, status: rec.status, kind, reversibility: rv, v: 1 };
    const sig = crypto.sign('sha256', Buffer.from(OP.canonicalize(fields), 'utf8'), { key: key.boardPriv, dsaEncoding: 'ieee-p1363' }).toString('base64url');
    this._sigCache.set(itemId, { priv: key.boardPriv, rev: rec.rev, status: rec.status, rv, sig });
    return sig;
  }

  // 상태 텍스트 → {changes, keysChanged, openCount} | null(파싱 불가 — 아무것도 바꾸지 않아요)
  run(stateText) {
    let st;
    try { st = JSON.parse(stateText); } catch (_) { return null; }
    // «상태를 못 읽었다» 와 «열린 결정이 없다» 는 달라요 — 서버가 파일이 없을 때 주는 {"error":...} 를 «전부 해소됨» 으로 읽으면 열린 항목 전부에 종결 통지가 나가요.
    if (!isPlain(st) || st.error !== undefined) return null;
    const decisions = st && Array.isArray(st.decisions) ? st.decisions : [];
    const keyInfo = this.visibility === 'sealed' ? this.keys.read() : { ok: true, version: 'envelope' };
    const keysChanged = this.keysVersion !== null && this.keysVersion !== keyInfo.version;
    const prevKeysVersion = this.keysVersion;
    this.keysVersion = keyInfo.version;
    const items = this.store.state.items;
    // **디스크에 없는 판은 없는 판이에요.** 바꾸기 «전» 의 기록을 적어 두고, 저장(store.save)이 실패하면 메모리를 그대로 되돌린 뒤 던져요.
    //   되돌리지 않으면 «저장 안 된 새 rev» 가 메모리에 남아 전체 스냅샷으로 서명돼 나가는데(디스크엔 옛 rev), 재시작하면 같은 rev 가 «다른 내용» 에 다시 붙어요 —
    //   그 rev 에 묶인 답이 새 내용에 적용돼요(envelope 모드엔 해시가 없어서 rev 가 유일한 묶음이에요). 변경분 목록도 버려지면 다음 주기가 같은 텍스트에서 «바뀐 게 없다» 로 읽어 새 판이 영영 안 나가요.
    //   되돌리면 다음 동기가 같은 변경을 처음부터 다시 계산해서 저장 · 통지해요. 키 버전도 되돌려요(키 변경의 전체 스냅샷 요청이 사라지지 않게).
    const undo = new Map();
    const touch = (id) => { if (!undo.has(id)) undo.set(id, Object.prototype.hasOwnProperty.call(items, id) ? Object.assign({}, items[id]) : undefined); };
    const changes = [];
    const openIds = new Set();
    // «서명된 첫 판은 새 판(rev)» — 서명 없이 나갔던 rev 를 서명만 붙여 «같은 rev» 로 다시 내면, «큰 rev 만 받는» 중계가 낡은 것으로 버려서 서명이 영영 안 닿아요
    //   (업그레이드 직후의 열린 항목 · envelope 모드에서 키가 나중에 생긴 항목). 그래서 이 키(지문)로 서명된 적 없는 열린 항목은 내용이 같아도 rev 를 한 번 올려 «새 판» 으로 내보내요.
    //   키가 «지금 없는» 동안엔 비교하지 않아요 — 키 파일이 잠깐 못 읽히는 틈(쓰는 중)에 rev 가 오르락내리락하지 않게.
    const signKey = this._signKey();
    const signFp = signKey ? this._fpOf(signKey) : null;
    const now = Math.max(1, Math.floor(this.clock.now()));
    let dirty = false;
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
      const rv = reversibilityDeclared(d);
      // 선언이 있을 때만 해시에 넣어요 — 없는 항목의 해시는 이 칸이 생기기 전과 같아서, 업그레이드가 열린 항목 전부를 다시 봉인(rev 증가 + 전체 스냅샷)하지 않아요.
      const hash = sha256hex(JSON.stringify(content) + '\n' + this.visibility + '\n' + this.boardId + '\n' + (this.visibility === 'sealed' ? keyInfo.version : '-') + (rv ? '\nreversibility:' + rv : ''));
      const rec = items[itemId];
      const needsSignedRev = signFp !== null && !!rec && rec.signedFp !== signFp;
      if (rec && rec.status === 'open' && rec.hash === hash && !needsSignedRev) continue;
      const rev = rec ? rec.rev + 1 : now;       // 시계 바닥(epoch 밀리초) — 초 단위면 «같은 초 안의 연속 변경» 이 바닥을 넘어 옛 값보다 작아질 수 있어요
      let sealed;
      if (this.visibility === 'sealed') {
        if (keyInfo.ok && keyInfo.devices.length) {
          try {
            sealed = SEAL.seal(Buffer.from(JSON.stringify(content), 'utf8'), { boardId: this.boardId, itemId, rev, v: 1 }, keyInfo.devices.map((x) => x.pub), { signKey: keyInfo.boardPriv });
          } catch (e) { this._once('seal:' + itemId, '[uplink] 봉인에 실패했어요(' + (e && e.code ? e.code : 'error') + ') — 이 항목은 sealed 칸 없이 나가요'); }
        } else if (keyInfo.ok) this._once('nodev', '[uplink] 등록된 기기가 없어서 맥락을 봉인할 수 없어요 — sealed 칸 없이 나가요');
      }
      touch(itemId);
      items[itemId] = { rev, hash, status: 'open', sealed };
      if (rv) items[itemId].reversibility = rv;
      if (signFp !== null) items[itemId].signedFp = signFp;
      changes.push(this._entry(itemId));
    }
    // 열린 목록에서 사라진 항목(resolved 로 바뀜 · 삭제됨) — 종결 통지. rev 를 올려서 «나중 것이 이긴다» 가 성립해요.
    //   닫은 때(closedAt)를 적어 둬요 — 전체 스냅샷이 «최근에 닫힌 항목의 서명된 닫는 기록» 을 함께 싣는 근거예요(fullEntries). 시각이 없는 옛 닫힌 기록(업그레이드 전)은 처음 본 때를 닫은 때로 쳐요.
    for (const itemId of Object.keys(items)) {
      const rec = items[itemId];
      if (rec.status !== 'open') {
        if (!Number.isSafeInteger(rec.closedAt)) { touch(itemId); rec.closedAt = now; dirty = true; }
        continue;
      }
      if (openIds.has(itemId)) continue;
      touch(itemId);
      rec.rev += 1;
      rec.status = 'resolved';
      rec.closedAt = now;
      delete rec.sealed;
      changes.push(this._entry(itemId));
    }
    // 기록 상한 — 끝난 항목부터 지워요(열린 항목의 rev 를 잃으면 되감겨요).
    const ids = Object.keys(items);
    if (ids.length > MAX_ITEMS) {
      for (const id of ids) { if (Object.keys(items).length <= MAX_ITEMS) break; if (items[id].status !== 'open') { touch(id); delete items[id]; } }
    }
    if (changes.length || dirty) {
      try { this.store.save(); } catch (e) {
        for (const [id, prev] of undo) { if (prev === undefined) delete items[id]; else items[id] = prev; }
        this.keysVersion = prevKeysVersion;
        throw e;
      }
    }
    this.openCount = openIds.size;
    return { changes, keysChanged, openCount: this.openCount };
  }

  _entry(itemId) {
    const rec = this.store.state.items[itemId];
    const e = { itemId, status: rec.status, rev: rec.rev };
    if (rec.status === 'open' && rec.sealed) e.sealed = rec.sealed;
    const rv = rec.status === 'open' ? reversibilityDeclared(rec) : null;       // 디스크에서 읽은 기록도 같은 검증을 거쳐요
    if (rv) e.reversibility = rv;
    // 서명된 항목 기록 — 칸 «전부»(열린 것 · 닫는 통지 · 전체 스냅샷의 재료)가 이 한 자리를 지나요. 키가 없으면 서명 없이 나가고 한 번 말해요.
    const key = this._signKey();
    if (key) {
      // 서명을 «칸 하나가» 못 만들어도(예: 손으로 고친 상태 파일의 소수 rev — canonicalize 가 던져요) 스냅샷 «전체» 가 막히지 않게 그 칸만 서명 없이 내보내고 한 번 말해요 —
      //   던지게 두면 전송층이 같은 던짐을 백오프로 반복해서 대기 중인 봉투와 하트비트까지 영영 못 나가요(상태 파일 읽기에서도 이런 rev 는 걸러요 — store.cjs).
      try { e.sig = this._signRecord(itemId, rec, rv, key); e.kind = ITEM_KIND; e.v = 1; }
      catch (err) { delete e.sig; delete e.kind; delete e.v; this._once('signfail:' + itemId, '[uplink] 항목 기록 하나를 서명하지 못했어요(' + String((err && (err.code || err.message)) || err).slice(0, 60) + ') — 그 칸만 서명 없이 나가요'); }
    } else this._once('nosign', '[uplink] 보드 키가 없어서 항목 기록에 서명할 수 없어요 — 서명 칸(sig) 없이 나가요(받는 쪽은 미확인으로 다뤄야 해요)');
    return e;
  }

  // 전체 스냅샷(재접속·키 변경·시작 때)의 재료 = 열린 항목 전부 + «최근에 닫힌 항목의 서명된 닫는 기록» (최근 7일 · 최대 64건 · 닫은 지 얼마 안 된 것부터).
  //   닫는 통지는 «변경» 으로 한 번 나가는데 전송층의 메모리에만 있어서, 나가기 전에 보드가 재시작하거나 전송이 실패하면 사라져요. 받는 쪽이 «서명된 닫는 기록» 만 닫힘의 근거로 삼는다면(머리말 «검증자 규칙»)
  //   그 항목은 영영 열린 채라서, 닫는 기록도 전체 스냅샷에 다시 실어요(디스크의 항목 기록에서 — 같은 rev · 같은 서명 대상이라 중복 전달은 무해해요).
  fullEntries() {
    const items = this.store.state.items;
    const out = [];
    const closed = [];
    const floor = Math.floor(this.clock.now()) - CLOSED_RESEND_MS;
    for (const itemId of Object.keys(items)) {
      const rec = items[itemId];
      if (rec.status === 'open') out.push(this._entry(itemId));
      else if (!Number.isSafeInteger(rec.closedAt) || rec.closedAt >= floor) closed.push(itemId);
    }
    closed.sort((a, b) => (items[b].closedAt || 0) - (items[a].closedAt || 0));
    for (const itemId of closed.slice(0, MAX_CLOSED_RESEND)) out.push(this._entry(itemId));
    return out;
  }
}

module.exports = { KeyReader, DecisionSync, contentOf, ITEM_ID_RE, TAG_HEX };
