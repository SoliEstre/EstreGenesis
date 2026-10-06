'use strict';
// exec.cjs — 명령 실행 레인: 롱폴로 받은 «사람 기기가 서명한 명령» 을 검증하고, 통과한 것만 «고정된 실행기» 로 보드에 넣어요.
//
//   createExecutor({cfg, dir, keys, store, getState, selections, inject, now, audit, log}) → {handle(c) → {status, reason, receipt}, close()}
//
// **신뢰 경계 — 이 파일이 믿는 것과 안 믿는 것.** 중계는 신뢰할 수 없는 운반자예요. 중계가 «준» 것 중 어떤 것도 판정 재료로 안 써요: 자격증명·TOTP 비밀은 «이 보드 로컬»
//   uplink-keys.json 에 사람이 등록한 것만, rpId·origin 은 로컬 uplink.json 만, audience(boardId)·보드 키 지문은 로컬 값만이에요. 중계가 «이런 키가 있다» 며 내미는 자격증명은
//   등록부에 없으니 credential-not-enrolled 로 끝나요(등록은 사람이 보드에서 하는 행위예요).
//
// **파이프라인(번호는 opcmd/webauthn-verify/totp 머리말의 단계 번호와 같아요).**
//   0 멱등성 — 이 cmdHash 의 영수증이 이미 있으면 «그것을 그대로» 다시 내보내고 끝(응답이 사라진 재전달이 «실행됐는데 거절됐다» 로 보이지 않게). 형식을 못 읽으면 bad-format(저장 없음).
//   1~3 형식 · audience(+보드 키 지문) · 시간 — opcmd 의 단계 함수를 그대로 이어요.
//   5  verb 정책(코드 안의 고정 표 — 설정으로 «넓힐» 수 없어요) · 인자 모양(밖의 칸은 bad-args) · 증명 종류별 허용(TOTP 는 낮은 위험의 선택만) · 등록 여부 · 항목 매핑(가명 → 진짜 id).
//   6~10 증명 — WebAuthn(챌린지 = cmdHash) 또는 TOTP(장부). 읽기 전용 단계예요(TOTP 만 단계를 소비).
//   11 낡은 항목 — 참조한 항목이 «지금» 아직 열려 있는가.
//   12 커밋 + 실행 — nonce 소비 → signCount 비교-후-교체(둘 다 디스크에 확정) → «그 다음에» 고정 실행기 호출 → 영수증 영속 → 감사 → 결과 회신(전송층).
//
// **nonce 는 «실행 전에» 소비돼요 — 크래시 창이 «이중 실행» 이 아니라 «실행 안 됨» 쪽으로 열려요.** 실행 후에 소비하면 실행기가 던지거나 프로세스가 죽는 순간 «실행됐는데 nonce 가 살아 있는» 창이 생겨서
//   같은 봉투가 재전달되면 한 번 더 실행돼요(사람이 «한 번 눌렀는데 두 번 적용»). 반대 방향의 대가(소비 후 실행 전에 죽으면 명령이 안 일어남 — at-most-once)는 사람이 새 명령을 내면 풀려요.
//
// **TOTP 와 nonce 의 정확한 순서 — ledger.has(검사만) → TOTP 검증(단계 소비) → … → consumeNonce.** TotpStore.verify 는 성공하면 그 시간 단계를 «소비» 해요. 이미 소비된 nonce 의 봉투가
//   TOTP 검증을 먼저 통과해 버리면(재전달·중계의 재주입) «새 코드의 단계» 가 아무 일도 안 한 명령에 타 버려요 — 그래서 검증 «전에» 원장을 읽기만 하는 has() 로 걸러요(상태 변화 없음).
//   consume 은 증명 «뒤에» 해요(거절된 명령이 nonce 를 태우면 공격자가 정당한 명령의 nonce 를 미리 소모시켜요 — opcmd 머리말). TOTP 가 ok 를 낸 뒤 consume 이 일시 장애로 실패하면 그 단계는 탄 채예요
//   (TotpStore 의 계약 — «다음 코드를 쓰세요»).
//
// **낡은 항목 판정의 자리 — 증명 «뒤», 커밋 «안»(소비하고 거절).** 참조 항목이 이미 닫혔으면 실행하지 않되 nonce 와 signCount 는 «소비해요»: 해소된 결정은 닫힌 채 남지만 같은 id 가 «다시 열리면»
//   (같은 가명 itemId) 아직 시간 창 안의 옛 서명이 새 질문에 적용될 수 있고, 소비하지 않으면 재전달이 그때마다 같은 판정을 반복하며 창이 열려 있어요. 소비하면 영수증(stale-item)이 남아 재전달도
//   같은 답을 해요. 증명 «전» 에는 하지 않아요 — 증명 없는 입력(중계)이 nonce 를 태우지 못하게요. 항목이 «아예 흔적 없음» 인 unknown-item 은 증명 전에 거절해요(상태 변화가 없고 영영 못 하는 명령이 TOTP 단계를 태우지 않게).
//
// **영수증은 «소비된 명령» 의 결과만 저장해요(exec-state.cjs).** 소비 전 거절(일시 장애 포함)은 저장하지 않고 같은 봉투의 재시도를 열어 둬요. 서명은 모든 거절에도 붙어서 폰이 «보드가 거절했다: <사유>» 를 보여줄 수 있어요.
//   **서명된 거절은 «최종인지» 를 스스로 말해요 — `final`(서명 대상 칸).** 소비 전 거절은 중계가 «고친 증명으로 같은 명령을 다시 내밀 수» 있어서(틀린 서명 → 올바른 서명) 서명된 «거절» 과 서명된 «수락» 이 같은 cmdHash 로 공존할 수 있어요.
//   폰이 서명된 거절을 «끝난 일» 로 믿으면 중계는 «거절됐다» 를 보여 주고 나중에 실행할 수 있고(exp+60초까지), 사람이 다시 내리면 이중 실행이에요. 그래서:
//     final:true  = 이 cmdHash 는 «영원히» 이 결과예요(수락 · 소비된 뒤의 거절 · 명령 «글자만으로» 정해지는 거절 — 증명을 바꿔도 못 뒤집어요). retryableUntil:null.
//     final:false = 아직 실행될 수 있어요. retryableUntil(초, = exp+60 — 시간 검사가 받아들이는 마지막 초)까지는 같은 명령이 수락될 수 있고, 그 뒤엔 어떤 증명으로도 못 해요. 폰은 «아직 실행 안 됨 — <시각>까지 실행될 수도 있음» 으로 보여야 해요.
//   최종인 사유(FINAL_REASONS): aud-mismatch · board-key-mismatch · ttl-too-long · expired · verb-not-allowed · 스키마 bad-args · bad-acct + 소비 뒤 결과(accepted · stale-item · execution-failed · commit-failed · counter-regression).
//   최종이 «아닌» 사유: 증명이 정하는 것(bad-signature · totp-invalid · proof-too-weak · credential-not-enrolled · bad-proof …) · 시각이 정하는 것(not-yet-valid) · 상태가 정하는 것(unknown-item · 항목 값의 bad-args · issuer-conflict) · 일시 장애(*-unavailable) · nonce-replayed.
//   nonce-replayed 가 «최종이 아닌» 이유: 그 nonce 를 «이 명령 자신» 이 이미 소비했을 수도 있어요(영수증 장부 쓰기가 실패했거나 장부를 잃은 뒤의 재전달) — 그때 최종 거절을 서명하면 같은 cmdHash 에 수락 영수증과 final:true 거절이 공존해요.
//   소비 전의 «글자만으로 정해지는» 최종 거절도 장부엔 저장하지 않아요(선택): 저장하면 중계가 «글자만 다른 명령» 을 쏟아내 디스크 쓰기(fsync)를 건당 일으켜요. 대신 같은 봉투를 다시 받으면 «같은 사유의 새 서명(시각만 다름)» 이 나가고 final:true 라 폰에겐 같은 결론이에요.
//
// **실행기는 «고정» 이에요.** inject 는 verb 마다 하나씩, 열쇠 집합이 정확히 INJECTORS 와 같아야만 받아요 — 프레임 하나를 통째로 받는 범용 hook 은 없어요(있으면 이 레인이 «아무 프레임이나 운영자 이름으로 내는» 통로가 돼요).
//   각 실행기는 «검증된 칸만» 받아요(이 파일이 칸별로 새 객체를 지어 넘겨요). 서버 쪽 구현도 칸별로 프레임을 지어요.
//
// 이 파일의 파이프라인은 6단계부터 커밋까지 «동기» 예요(await 없음) — 같은 프로세스 안에서 두 명령이 끼어들 수 없어서 그 구간이 그대로 임계구역이에요. 프로세스 사이는 파일 잠금이 지켜요(nonce 원장 · TOTP 상태 · uplink-exec.lock).

const path = require('path');
const crypto = require('crypto');
const OP = require('./opcmd.cjs');
const WA = require('./webauthn-verify.cjs');
const TOTP = require('./totp.cjs');
const { tagOf } = require('./project.cjs');
const { ExecState } = require('./exec-state.cjs');
const KS = require('./keyset.cjs');

const MAX_CMD_TEXT = 20000;
const SKEW = OP.SKEW_SEC;
// 계정 표기 — 영수증·감사·운영자 도장에 들어가는 «사람이 읽는 이름» 이라 글자 집합을 좁게 못 박아요(줄바꿈·공백이 든 문장을 «운영자» 칸에 실을 수 없게).
const ACCT_RE = /^[A-Za-z0-9._@:-]{1,128}$/;
// 최종인 «소비 전» 거절 사유(머리말) — 스키마 bad-args 는 호출 자리에서 따로 final 로 불러요(항목 값의 bad-args 는 상태에 달려서 최종이 아니에요).
const FINAL_REASONS = new Set(['aud-mismatch', 'board-key-mismatch', 'ttl-too-long', 'expired', 'verb-not-allowed', 'bad-acct']);
const MAX_TEXT = 8000;
const MAX_NOTE = 4000;
const MAX_LABEL = 500;
const MAX_SELECTED = 32;
const TAG_RE = /^[0-9a-f]{24}$/;
const ID_RE = /^[A-Za-z0-9._:@-]{1,64}$/;
const BRANCHES = Object.freeze(['accept', 'defer', 'reject_framing', 'request_investigation']);
// 실행기 열쇠 집합 — 서버가 넘기는 inject 의 열쇠는 «정확히» 이거여야 해요(모자라도 남아도 거절).
const INJECTORS = Object.freeze(['decisionDefer', 'hyperbriefRespond', 'operatorDecision', 'selectionAnswer', 'userPrompt']);

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

class Reject extends Error {
  constructor(code) { super(code); this.code = code; }
}
const no = (code) => new Reject(code);

// ── 인자 모양 ─────────────────────────────────────────────────────────────────────────────────────────────
// 칸 집합이 «정확히» 맞아야 해요(밖의 칸은 bad-args) — 읽지 않는 칸이 통과한다는 건 «서명된 칸 중 일부만 실행에 쓰인다» 는 뜻이라서요.
function shape(args, req, opt) {
  if (!isPlain(args)) throw no('bad-args');
  for (const k of Object.keys(args)) if (!req.includes(k) && !opt.includes(k)) throw no('bad-args');
  for (const k of req) if (!hasOwn(args, k)) throw no('bad-args');
}
const strIn = (v, min, max) => typeof v === 'string' && v.length >= min && v.length <= max;

// 각 스키마는 «새 객체» 와 weak(자유 서술을 담았나 — TOTP 로는 못 하는 것)를 돌려줘요.
function schemaDecisionAnswer(a) {
  shape(a, ['itemId'], ['choice', 'text', 'accept']);
  if (typeof a.itemId !== 'string' || !/^sd:[0-9a-f]{24}$/.test(a.itemId)) throw no('bad-args');
  if (hasOwn(a, 'choice') && !strIn(a.choice, 1, MAX_LABEL)) throw no('bad-args');
  if (hasOwn(a, 'text') && !strIn(a.text, 0, MAX_TEXT)) throw no('bad-args');
  // accept 의 값 도메인은 문자열 'recommended' «하나» 예요(대시보드의 결정 답과 같은 값) — true 같은 불리언은 bad-args. 클라이언트는 추측하지 말고 이 값을 보내야 해요.
  if (hasOwn(a, 'accept') && a.accept !== 'recommended') throw no('bad-args');
  const text = hasOwn(a, 'text') ? a.text : '';
  const choice = hasOwn(a, 'choice') ? a.choice : null;
  const accept = hasOwn(a, 'accept') ? 'recommended' : null;
  if (choice === null && text === '' && accept === null) throw no('bad-args');     // 빈 답은 답이 아니에요
  return { args: { itemId: a.itemId, choice, text, accept }, weak: text !== '' };
}
function schemaDecisionDefer(a) {
  shape(a, ['itemId'], []);
  if (typeof a.itemId !== 'string' || !/^sd:[0-9a-f]{24}$/.test(a.itemId)) throw no('bad-args');
  return { args: { itemId: a.itemId }, weak: false };
}
function schemaHyperbrief(a) {
  shape(a, ['decisionId', 'branch'], ['note']);
  if (typeof a.decisionId !== 'string' || !/^(sd|h):[0-9a-f]{24}$/.test(a.decisionId)) throw no('bad-args');
  if (typeof a.branch !== 'string' || !BRANCHES.includes(a.branch)) throw no('bad-args');
  if (hasOwn(a, 'note') && !strIn(a.note, 0, MAX_NOTE)) throw no('bad-args');
  const note = hasOwn(a, 'note') ? a.note : '';
  return { args: { decisionId: a.decisionId, branch: a.branch, note }, weak: a.branch !== 'defer' || note !== '' };
}
function schemaSelection(a) {
  shape(a, ['promptId', 'selected'], []);
  if (typeof a.promptId !== 'string' || !/^h:[0-9a-f]{24}$/.test(a.promptId)) throw no('bad-args');
  if (!Array.isArray(a.selected) || a.selected.length < 1 || a.selected.length > MAX_SELECTED) throw no('bad-args');
  const seen = new Set();
  for (const s of a.selected) {
    if (!strIn(s, 1, MAX_LABEL) || seen.has(s)) throw no('bad-args');
    seen.add(s);
  }
  return { args: { promptId: a.promptId, selected: a.selected.slice() }, weak: false };
}
function schemaPrompt(a) {
  shape(a, ['text'], ['target']);
  if (!strIn(a.text, 1, MAX_TEXT)) throw no('bad-args');
  if (hasOwn(a, 'target') && (typeof a.target !== 'string' || !ID_RE.test(a.target))) throw no('bad-args');
  return { args: { target: hasOwn(a, 'target') ? a.target : null, text: a.text }, weak: false };   // TOTP 로 못 여는 건 «표의 totp:false» 하나가 막아요(자유 서술이라는 이유와 겹치지 않게 — 두 가드가 서로를 가리지 않아야 각각 시험돼요)
}

// ── 서명된 «등록» 동사 3종 — 보드 로컬 키 등록부(uplink-keys.json)를 고치는 동사예요. **passkey 전용**이에요(표의 totp:false 가 막아요).
//   이유: TOTP 는 «명령에 묶이지 않는 증명» 이라(totp.cjs 머리말) 중계가 새 코드를 다른 명령에 붙일 수 있어요. 등록 동사에 그게 통하면 비밀 6자리 하나로 «내 키를 등록부에 넣기» 가 되고,
//   그 순간 중계가 만든 키가 이후 모든 passkey 동사를 서명해요. 그래서 이 동사들은 «이미 등록된 passkey» 가 명령 해시(챌린지)에 서명한 경우에만 열려요.
//   **그래도 서명은 «등록» 이 아니라 «후보 올리기» 예요.** passkey 는 명령 해시에 서명할 뿐 «사람이 무엇을 읽고 눌렀는지» 는 보여 주지 않아요(해시로 바꿔 주는 화면은 중계가 서빙해요) — 서명만으로 키가 영구 등록되면
//   중계가 «결정 승인» 으로 보이는 탭 한 번에 자기 키를 영구 서명자로 만들 수 있어요. 그래서 enroll 동사는 대기열(uplink-pending.json)에 올리기만 하고, 보드 터미널 앞의 사람이 지문을 보고 y 를 친 뒤(cli.cjs enroll)에야
//   등록부에 들어가요. 수락(accepted)의 뜻은 «대기열에 올렸다» 예요. 폐기(credential.revoke)는 접근을 좁히기만 해서 서명만으로 바로 적용돼요.
//   주입기(inject)가 아니에요 — 메인으로 가는 프레임이 없고 서버 실행기 열쇠 집합(정확히 5개)은 그대로예요. 보드 «로컬» 파일만 바꿔요(keyset.cjs — CLI 와 같은 함수).
//   인자는 «글자만으로» 검증해요(키 모양·알고리즘 규칙은 검증 쪽 checkEnrollKey 와 같은 함수) — 틀린 키가 서명된 명령으로 와도 등록부에 앉지 못해요.
function schemaCredentialEnroll(a) {
  shape(a, ['credentialId', 'alg', 'publicKeySpki'], ['name']);
  const c = KS.normalizeCredential({ credentialId: a.credentialId, alg: a.alg, publicKeySpki: a.publicKeySpki, name: hasOwn(a, 'name') ? a.name : undefined });
  if (!c.ok) throw no('bad-args');
  return { args: { credentialId: c.credentialId, alg: c.alg, spki: c.spki, name: c.name }, weak: false };
}
function schemaDeviceEnroll(a) {
  shape(a, ['deviceId', 'sealPublicJwk'], ['name']);
  const d = KS.normalizeDevice({ deviceId: a.deviceId, sealPublicJwk: a.sealPublicJwk, name: hasOwn(a, 'name') ? a.name : undefined });
  if (!d.ok) throw no('bad-args');
  return { args: { deviceId: d.deviceId, jwk: d.jwk, kid: d.kid, name: d.name }, weak: false };
}
function schemaCredentialRevoke(a) {
  shape(a, ['credentialId'], []);
  if (typeof a.credentialId !== 'string' || !KS.CRED_ID_RE.test(a.credentialId) || Buffer.from(a.credentialId, 'base64url').toString('base64url') !== a.credentialId) throw no('bad-args');
  return { args: { credentialId: a.credentialId }, weak: false };
}
// 서명된 등록 동사가 «소비 뒤에» 낼 수 있는 도메인 거절 — 그 밖의 실패(잠금 · 파일 읽기/쓰기)는 execution-failed 예요.
const ENROLL_REFUSALS = new Set(['credential-already-enrolled', 'device-already-enrolled', 'credential-already-pending', 'device-already-pending', 'pending-full', 'credential-not-found', 'last-credential', 'keys-full']);

// ── verb 정책 표 — **고정**이에요. 설정(uplink.json totp.verbs)은 «좁히기만» 해요(교집합) — 이 표에 없는 verb 를 TOTP 로 열 수 없어요.
//   passkey(WebAuthn)는 표에 있는 모든 verb 를 해요. TOTP 는 «명령에 묶이지 않는 증명» 이라(totp.cjs 머리말 — 중계가 새 코드를 다른 명령에 붙일 수 있어요) 자유 서술이 없는 선택·보류에만 허용해요.
const VERBS = Object.freeze({
  'decision.answer': Object.freeze({ totp: true, item: 'decision', injector: 'operatorDecision', schema: schemaDecisionAnswer }),
  'decision.defer': Object.freeze({ totp: true, item: 'decision', injector: 'decisionDefer', schema: schemaDecisionDefer }),
  'hyperbrief.respond': Object.freeze({ totp: true, item: 'decision', injector: 'hyperbriefRespond', schema: schemaHyperbrief }),
  'selection.answer': Object.freeze({ totp: true, item: 'selection', injector: 'selectionAnswer', schema: schemaSelection }),
  'prompt.send': Object.freeze({ totp: false, item: null, injector: 'userPrompt', schema: schemaPrompt }),
  // 등록 동사(위 머리말) — passkey 전용 · 주입기 없음(local = 보드 로컬 등록부 변경)
  'credential.enroll': Object.freeze({ totp: false, item: null, injector: null, local: 'credential.enroll', schema: schemaCredentialEnroll }),
  'device.enroll': Object.freeze({ totp: false, item: null, injector: null, local: 'device.enroll', schema: schemaDeviceEnroll }),
  'credential.revoke': Object.freeze({ totp: false, item: null, injector: null, local: 'credential.revoke', schema: schemaCredentialRevoke }),
});

// ── 선택지 추적 — 서버가 «열린 선택지» 의 보기를 따로 안 쥐고 있어서(타임아웃을 선언한 것만 pending 추적) 보드로 가는 프레임에서 직접 봐요.
//   답을 낸 뒤·만료된 뒤엔 닫아요. 한계(문서화): 다른 보드(대시보드)가 낸 답은 이 탭에 안 보여서, 서버가 추적하는(타임아웃 선언) 프롬프트는 serverState 가 «done» 으로 알려 주고 나머지는 열린 채로 보여요.
class SelectionTracker {
  constructor(o) {
    this.secret = o.secret;
    this.serverState = o.serverState || null;        // (promptId) => 'done' | 'pending' | null
    this.serverIssuer = o.serverIssuer || null;      // (promptId) => 서버가 «라우팅에 쓸» 발급자 agentId | null — 이 탭이 검증한 보기의 주인과 같아야 해요
    this.max = 256;
    this.m = new Map();                              // tag → {promptId, labels|null, multi, issuer, open}
  }

  note(msg) {
    if (!isPlain(msg) || msg.type !== 'CUSTOM' || typeof msg.name !== 'string' || !isPlain(msg.value)) return;
    const v = msg.value;
    if (typeof v.promptId !== 'string' || v.promptId.length < 1 || v.promptId.length > 200) return;
    if (msg.name === 'SelectionPrompt') {
      let labels = null;
      if (Array.isArray(v.options)) {
        labels = v.options.map((o) => (typeof o === 'string' ? o : (isPlain(o) ? o.label : undefined))).filter((s) => typeof s === 'string' && s.length > 0 && s.length <= MAX_LABEL).slice(0, 64);
        if (labels.length === 0) labels = null;
      }
      const tag = tagOf(this.secret, v.promptId);
      const issuer = typeof msg.agentId === 'string' && ID_RE.test(msg.agentId) ? msg.agentId : null;
      // **보기는 «처음 낸 발급자» 의 것이에요.** 열려 있는 프롬프트와 같은 promptId 를 «다른 에이전트» 가 다시 내면 보기(라벨)를 덮어써서, 메인이 낸 질문에 «메인이 내지 않은 보기» 로 검증된 답이
      //   운영자 도장을 달고 메인에게 가요. 덮어쓰지 않고 «충돌» 로 표시해서 그 프롬프트는 닫힌 채 막아요(누가 진짜 발급자인지 이 탭이 판정할 수 없어요). 같은 발급자의 재발급은 그대로 갱신해요.
      const prev = this.m.get(tag);
      if (prev && prev.open && (prev.conflict || prev.issuer !== issuer)) { prev.conflict = true; return; }
      this.m.delete(tag);
      this.m.set(tag, { promptId: v.promptId, labels, multi: v.multiSelect === true, issuer, open: true, conflict: false });
      while (this.m.size > this.max) this.m.delete(this.m.keys().next().value);
    } else if (msg.name === 'SelectionResolved' || msg.name === 'SelectionExpired' || msg.name === 'SelectionAnswer' || msg.name === 'SelectionCancel') {
      this.close(v.promptId);
    }
  }

  close(promptId) { const e = this.m.get(tagOf(this.secret, promptId)); if (e) e.open = false; }

  find(tag) {
    const e = this.m.get(tag);
    if (!e) return null;
    let open = e.open;
    if (open && this.serverState) { try { if (this.serverState(e.promptId) === 'done') open = false; } catch (_) { /* 서버 조회 실패는 «모름» — 열린 채로 둬요 */ } }
    let conflict = e.conflict === true;
    // 서버가 라우팅에 쓸 발급자(pending · tombstone)를 알고, 그게 이 탭이 보기를 검증한 발급자와 다르면 — 검증한 보기와 답이 가는 곳이 어긋나요.
    if (!conflict && open && this.serverIssuer) { try { const si = this.serverIssuer(e.promptId); if (si && si !== e.issuer) conflict = true; } catch (_) { /* 조회 실패는 «모름» */ } }
    return { promptId: e.promptId, labels: e.labels, multi: e.multi, issuer: e.issuer, open, conflict };
  }
}

const kindOfProof = (p) => (isPlain(p) && (p.kind === 'webauthn' || p.kind === 'totp') ? p.kind : (isPlain(p) && typeof p.kind === 'string' ? 'other' : null));

class Executor {
  constructor(o) {
    this.cfg = o.cfg;
    this.dir = o.dir;
    this.keys = o.keys;
    this.store = o.store;
    this.getState = o.getState;
    this.selections = o.selections;
    this.now = o.now || (() => Date.now());
    this.auditFn = o.audit || (() => {});
    this.log = o.log || (() => {});
    this._warned = new Set();
    this._totp = null;
    this.injectError = null;
    this.inject = null;
    this._idx = null;                                // {text, map} — 결정 가명 색인 캐시(아래 _decisionIndex)
    this._snap = null;                               // 한 번의 명령 처리 안에서 «상태를 한 번만» 읽기 위한 스냅샷(handle 이 비움)
    if (!o.inject || typeof o.inject !== 'object') this.injectError = 'no-injectors';
    else {
      const ks = Object.keys(o.inject).sort();
      if (ks.length !== INJECTORS.length || ks.some((k, i) => k !== INJECTORS[i]) || INJECTORS.some((k) => typeof o.inject[k] !== 'function')) this.injectError = 'bad-injector-set';
      else this.inject = o.inject;
    }
    if (this.injectError) this._once('inject', '[uplink] 명령 실행기가 규격이 아니에요(' + this.injectError + ') — 받은 명령은 전부 거절해요');
    this.state = new ExecState(this.dir, this.log, o.stateOpts);
    this.state.open();
    try {
      this.ledger = new OP.NonceLedger(path.join(this.dir, 'uplink-nonces.jsonl'), { now: Math.floor(this.now() / 1000) });
    } catch (e) { this.state.close(); throw e; }
  }

  _once(k, msg) { if (this._warned.has(k)) return; this._warned.add(k); this.log(msg); }

  close() {
    try { this.ledger.close(); } catch (_) { /* noop */ }
    try { this.state.close(); } catch (_) { /* noop */ }
    if (this._totp) { try { this._totp.close(); } catch (_) { /* noop */ } this._totp = null; }
  }

  // ── 진입점 ──
  handle(c) {
    const meta = { cmdId: c.cmdId, verb: null, cmdHash8: 'unparsed', proof: kindOfProof(c.proof), acct: null };
    let out;
    this._snap = null;
    try { out = this._decide(c, meta); } catch (e) {
      this._once('internal', '[uplink] 명령 처리 중 내부 오류: ' + String((e && e.message) || e).slice(0, 120));
      out = { status: 'rejected', reason: 'internal-error', receipt: null };
    }
    this._snap = null;
    try {
      this.auditFn({ at: new Date(this.now()).toISOString(), cmdId: meta.cmdId, verb: meta.verb, cmdHash8: meta.cmdHash8, proof: meta.proof, acct: meta.acct, status: out.status, reason: out.reason });
    } catch (e) { this._once('audit', '[uplink] 감사 로그를 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ')'); }
    return out;
  }

  // 서명된 영수증 한 장. 키가 없으면 영수증 없이 사유만(폰은 «보드가 거절했다» 를 서명 없이 못 믿으니 영수증 칸이 비어요).
  //   final · retryableUntil 은 «서명 대상» 이에요(머리말) — 폰이 한 칸만 바꿔도 서명이 깨져서 «최종» 표시를 중계가 못 고쳐요. 최종이면 retryableUntil 은 null.
  _receipt(c, hashHex, status, reason, key, fin, until) {
    if (!key || !key.ok || !hashHex) return null;
    const isFinal = fin !== false || !Number.isSafeInteger(until);        // 실행될 수 있는 «기한» 을 모르면 «아직 가능» 이라고 주장할 수 없어요 — 최종으로 둬요(명령이 읽히지 않는 경우뿐)
    const fields = { boardId: this.cfg.boardId, cmdId: c.cmdId, cmdHash: hashHex, status, reason, executedAt: this.now(), final: isFinal, retryableUntil: isFinal ? null : until };
    const sig = crypto.sign('sha256', Buffer.from(OP.canonicalize(fields), 'utf8'), { key: key.boardPriv, dsaEncoding: 'ieee-p1363' }).toString('base64url');
    return Object.assign({}, fields, { sig });
  }

  // 소비 «전» 의 거절 — 저장하지 않아요(같은 봉투 재시도가 열려 있어요).
  //   fin 을 안 주면 사유 표(FINAL_REASONS)로 정해요. until = exp + SKEW — 시간 검사가 받아들이는 마지막 초.
  _pre(c, hashHex, key, reason, fin, until) {
    const f = fin === undefined ? FINAL_REASONS.has(reason) : fin;
    return { status: 'rejected', reason, receipt: this._receipt(c, hashHex, 'rejected', reason, key, f, until) };
  }

  // 소비 «후» 의 결과 — 영속해요(저장 못 해도 응답은 나가요; 재전달 멱등성만 약해져요).
  _spent(c, hashHex, key, status, reason) {
    const receipt = this._receipt(c, hashHex, status, reason, key, true, null);      // 소비된 명령의 결과는 언제나 최종
    if (receipt) {
      try { this.state.putReceipt(hashHex, receipt, this.now()); } catch (e) { this._once('rcpt', '[uplink] 영수증을 디스크에 쓰지 못했어요 (' + (e && e.code ? e.code : e && e.message) + ') — 재전달 멱등성이 약해져요'); }
    }
    return { status, reason, receipt };
  }

  _decide(c, meta) {
    const nowMs = this.now();
    const sec = Math.floor(nowMs / 1000);
    // 0. 형식을 못 읽으면 영수증 장부를 만지지 않고 거절 — 읽히는 것만 해시가 «명령의 신원» 이에요.
    if (typeof c.cmd !== 'string' || c.cmd.length > MAX_CMD_TEXT) return { status: 'rejected', reason: 'bad-format', receipt: null };
    const hashBuf = OP.cmdHash(c.cmd);
    const hashHex = hashBuf.toString('hex');
    let parsedCmd;
    try { parsedCmd = OP.parseCanonical(c.cmd); } catch (_) {
      // 글자가 읽히지 않는 명령은 증명을 바꿔도 영원히 읽히지 않아요 — 최종
      return { status: 'rejected', reason: 'bad-format', receipt: this._receipt(c, hashHex, 'rejected', 'bad-format', this.keys.read(), true, null) };
    }
    meta.cmdHash8 = hashHex.slice(0, 8);
    let until = null;       // 이 명령이 «아직 실행될 수 있는» 마지막 초(exp + SKEW) — 소비 전 거절 영수증의 retryableUntil
    if (isPlain(parsedCmd)) {
      if (typeof parsedCmd.verb === 'string') meta.verb = parsedCmd.verb.slice(0, 64);
      if (typeof parsedCmd.acct === 'string' && ACCT_RE.test(parsedCmd.acct)) meta.acct = parsedCmd.acct;       // 감사에는 «규격 안의 이름» 만 — 중계가 정한 문장이 감사 줄에 실리지 않게
      if (Number.isSafeInteger(parsedCmd.exp)) until = parsedCmd.exp + SKEW;
    }
    // 멱등성 — 소비된 명령의 영수증이 있으면 그대로(재서명하지 않아요: 같은 바이트여야 «같은 영수증»).
    const cached = this.state.getReceipt(hashHex);
    if (cached) return { status: cached.status, reason: cached.reason, receipt: cached, replayed: true };

    const key = this.keys.read();
    if (!key || !key.ok) return { status: 'rejected', reason: 'board-key-unavailable', receipt: null };
    const rej = (reason, fin) => this._pre(c, hashHex, key, reason, fin, until);

    if (this.injectError) return rej('exec-unavailable');
    if (!isPlain(c.proof)) return rej('bad-proof');
    let envText;
    try { envText = OP.canonicalize({ v: 1, cmd: c.cmd, proof: c.proof }); } catch (_) { return rej('bad-format'); }

    // 1~3. 형식 · audience · 시간
    const f = OP.checkFormat(envText);
    if (!f.ok) return rej(f.code);
    const cmd = f.cmd;
    meta.verb = cmd.verb;
    meta.acct = ACCT_RE.test(cmd.acct) ? cmd.acct : null;
    const au = OP.checkAudience(cmd, { boardId: this.cfg.boardId, boardKeyFp: key.boardFp });
    if (!au.ok) return rej(au.code);
    const tm = OP.checkTime(cmd, { now: sec });
    if (!tm.ok) return rej(tm.code);
    if (!ACCT_RE.test(cmd.acct)) return rej('bad-acct', true);

    // 5. verb 정책 · 인자 · 증명 종류 · 등록 · 항목
    if (!hasOwn(VERBS, cmd.verb)) return rej('verb-not-allowed');
    const policy = VERBS[cmd.verb];
    let norm;
    try { norm = policy.schema(cmd.args); } catch (e) { if (e instanceof Reject) return rej(e.code, true); throw e; }       // 스키마는 «글자만» 으로 정해져요 — 최종
    const kind = f.proof.kind;
    if (kind !== 'webauthn' && kind !== 'totp') return rej('bad-proof');
    if (kind === 'totp' && (!this._totpAllowed(cmd.verb) || norm.weak)) return rej('proof-too-weak');
    let secret = null;
    if (kind === 'webauthn') {
      if (!this.cfg.rp || !key.credentials || key.credentials.length === 0) return rej('proof-not-enrolled');
      if (this.state.counterError) return rej(this.state.counterError);
    } else {
      // TOTP 는 명령에 묶이지 않아서 cmd.acct 는 «중계가 고른 글자» 예요 — 운영자 도장의 이름은 «로컬 등록값» 이어야 해요. 그래서 등록에 acct 가 없는 TOTP 는 받지 않아요.
      if (!key.totp || key.totp.acct === null || !ACCT_RE.test(key.totp.acct)) return rej('proof-not-enrolled');
      try { secret = TOTP.base32Decode(key.totp.secretB32); } catch (_) { return rej('proof-not-enrolled'); }
    }
    let ref;
    try { ref = this._lookup(policy, norm.args); if (!ref.found) throw no('unknown-item'); if (ref.open) this._checkAgainstItem(cmd.verb, norm.args, ref); } catch (e) { if (e instanceof Reject) return rej(e.code); throw e; }
    // 소비 «전» 에 읽기만 하는 nonce 확인 — TOTP 단계가 이미 쓰인 명령에 타지 않게(머리말).
    if (this.ledger.has(cmd.nonce)) return rej('nonce-replayed');

    // 6~10. 증명
    let wa = null;
    if (kind === 'webauthn') {
      const p = WA.parseProof(f.proof);
      if (!p.ok) return rej(p.code);
      const credMap = new Map();
      let enrolledRec = null;
      for (const cr of key.credentials) {
        const stored = this.state.storedCount(cr.credentialId, cr.signCount);
        credMap.set(cr.credentialId, { alg: cr.alg, signCount: stored, publicKey: cr.publicKey });
        if (cr.credentialId === p.credentialId) enrolledRec = { enrolled: cr.signCount, stored, acct: cr.acct };
      }
      if (enrolledRec && enrolledRec.acct !== null && enrolledRec.acct !== cmd.acct) return rej('acct-mismatch');
      const v = WA.verifyAssertion(f.proof, { rpId: this.cfg.rp.id, origins: this.cfg.rp.origins, credentials: credMap, expectedChallenge: hashBuf });
      if (!v.ok) return rej(v.code);
      wa = { credentialId: v.credentialId, enrolled: enrolledRec.enrolled, stored: enrolledRec.stored, next: v.newSignCount, acct: enrolledRec.acct };
    } else {
      if (key.totp.acct !== cmd.acct) return rej('acct-mismatch');
      let store;
      try { store = this._totpStore(sec); } catch (e) { return rej(e && e.code ? e.code : 'state-unavailable'); }
      const r = store.verifyProof(f.proof, hashBuf, { now: sec, secret });
      if (!r.ok) return rej(r.code);
    }

    // 11. 낡은 항목 — «지금» 의 상태로 다시 봐요(위의 조회는 증명 전의 것). 닫혔어도 아래 커밋은 해요(머리말).
    let cur;
    try { cur = this._lookup(policy, norm.args); } catch (e) { if (e instanceof Reject) return rej(e.code); throw e; }
    const stale = !cur.found || !cur.open;

    // 12. 커밋 — nonce 소비 → signCount CAS. 둘 다 디스크에 확정된 «뒤에만» 실행해요.
    const cn = OP.consumeNonce(cmd, { ledger: this.ledger, now: sec });
    if (!cn.ok) return rej(cn.code);                       // 못 쓴 nonce 는 소비된 게 아니에요 — 저장 없이 거절(재시도 열림)
    if (wa) {
      let swapped = false;
      try { swapped = this.state.commitCount(wa.credentialId, wa.enrolled, wa.stored, wa.next); } catch (_) { return this._spent(c, hashHex, key, 'rejected', 'commit-failed'); }
      if (!swapped) return this._spent(c, hashHex, key, 'rejected', 'counter-regression');
    }
    if (stale) return this._spent(c, hashHex, key, 'rejected', 'stale-item');
    // 운영자 이름: TOTP 는 «로컬 등록값», passkey 는 등록된 자격증명의 acct(없으면 사람이 서명한 cmd.acct) — 둘 다 ACCT_RE 를 통과한 글자예요.
    const opAcct = kind === 'totp' ? key.totp.acct : (wa && wa.acct !== null ? wa.acct : cmd.acct);
    const prov = { via: 'uplink', cmdHash: hashHex, proof: kind, operator: 'acct:' + opAcct };
    try { this._execute(cmd.verb, policy, norm.args, cur, prov, nowMs); } catch (e) {
      if (e instanceof KS.KeysetRefusal && ENROLL_REFUSALS.has(e.code)) return this._spent(c, hashHex, key, 'rejected', e.code);      // 소비된 뒤의 도메인 거절 — 최종
      this._once('exec:' + cmd.verb, '[uplink] 명령 실행기가 실패했어요 (' + cmd.verb + '): ' + String((e && e.message) || e).slice(0, 120));
      return this._spent(c, hashHex, key, 'rejected', 'execution-failed');
    }
    return this._spent(c, hashHex, key, 'accepted', null);
  }

  // TOTP 로 열 수 있는 verb — 고정 표 ∩ 설정(좁히기만). 설정이 없으면 표 그대로예요.
  _totpAllowed(verb) {
    const p = hasOwn(VERBS, verb) ? VERBS[verb] : null;
    if (!p || !p.totp) return false;
    const t = this.cfg.totp;
    return t ? t.verbs.includes(verb) : true;
  }

  _totpStore(sec) {
    if (!this._totp) this._totp = new TOTP.TotpStore(path.join(this.dir, 'uplink-totp.json'), { now: sec });
    return this._totp;
  }

  // ── 항목 매핑: 가명 → 진짜 항목 ──
  // 결정: state.json 의 decisions[] 에서 «가명이 같은» 항목을 찾아요(HMAC 이라 되돌릴 수는 없고 모든 항목의 가명을 계산해 대조해요). 읽을 수 없으면 일시 장애(state-unavailable).
  // 선택지: 보드로 간 SelectionPrompt 프레임을 본 추적기.
  _lookup(policy, args) {
    if (policy.item === 'decision') {
      const pseudo = hasOwn(args, 'itemId') ? args.itemId : args.decisionId;
      const tag = pseudo.slice(-24);
      if (!TAG_RE.test(tag)) throw no('bad-args');
      const d = this._decisionIndex().get(tag);
      if (d) return { found: true, open: d.status === 'open', d };
      const rec = this.store.state.items['sd:' + tag];
      return rec ? { found: true, open: false, d: null } : { found: false, open: false, d: null };
    }
    if (policy.item === 'selection') {
      const e = this.selections ? this.selections.find(args.promptId.slice(-24)) : null;
      return e ? { found: true, open: e.open, sel: e } : { found: false, open: false, sel: null };
    }
    return { found: true, open: true };      // 항목이 없는 verb(prompt.send)
  }

  // 결정 가명 색인 — 상태 텍스트가 «같으면» 해석(파싱 + 결정마다 HMAC)을 재사용하고, 한 번의 명령 처리 안에서는 «한 번만» 읽어요(증명 전 조회와 11단계의 «지금» 조회가 같은 스냅샷 —
  //   그 사이는 동기라 끼어드는 쓰기가 없어요). 중계가 존재하지 않는 항목을 쏟아낼 때 명령 하나가 «상태 전체 파싱 + HMAC 전수 + (조회 두 번)» 이던 것을 «문자열 비교 + Map 조회» 로 줄여요
  //   (실측: 결정 2000개 · 중계가 존재하지 않는 항목 명령을 50개씩 쏟아내는 동안 GET /api/state p50 468ms → 5ms — 전송층의 배치 시간 예산과 함께). 읽을 수 없으면 state-unavailable(일시 장애 — 캐시 안 해요).
  _decisionIndex() {
    if (this._snap) return this._snap.map;
    let text;
    try { text = this.getState(); } catch (_) { throw no('state-unavailable'); }
    if (typeof text !== 'string') throw no('state-unavailable');
    if (!this._idx || this._idx.text !== text) {
      let st;
      try { st = JSON.parse(text); } catch (_) { throw no('state-unavailable'); }
      if (!isPlain(st) || st.error !== undefined) throw no('state-unavailable');
      const map = new Map();
      for (const d of (Array.isArray(st.decisions) ? st.decisions : [])) {
        if (!isPlain(d) || typeof d.id !== 'string') continue;
        const tag = tagOf(this.store.secret, d.id);
        if (!map.has(tag)) map.set(tag, d);          // 같은 가명이 둘이면 앞의 것(원래 순회와 같은 규칙)
      }
      this._idx = { text, map };
    }
    this._snap = this._idx;
    return this._snap.map;
  }

  // 열린 항목에 대해서만 — 인자가 «그 항목이 허용하는 값» 인가(증명 전에 거절해야 값이 나쁜 명령이 TOTP 단계를 안 태워요).
  _checkAgainstItem(verb, args, ref) {
    if (verb === 'decision.answer') {
      const opts = Array.isArray(ref.d.options) ? ref.d.options.filter((x) => typeof x === 'string') : [];
      if (args.choice !== null && !opts.includes(args.choice)) throw no('bad-args');
      if (args.choice === null && args.accept === 'recommended' && !(typeof ref.d.recommendChoice === 'string' && ref.d.recommendChoice)) throw no('bad-args');
    } else if (verb === 'selection.answer') {
      const s = ref.sel;
      if (s.conflict) throw no('issuer-conflict');
      // 보기가 «없는» 프롬프트(자유 입력 · options 생략)는 labels 가 null 이에요 — null 을 «검사 생략» 으로 읽으면 어떤 글이든 «보기에서 고른 것» 으로 통과해서(TOTP 포함) 운영자 도장을 단 자유 서술이 되어요.
      //   그래서 null 은 «빈 집합» 이에요: 보기 없는 프롬프트에 uplink 로는 답할 수 없어요(자유 서술 답이 필요하면 passkey 전용 별도 칸으로 — 지금은 없음).
      const labels = s.labels || [];
      if (!args.selected.every((x) => labels.includes(x))) throw no('bad-args');
      if (!s.multi && args.selected.length > 1) throw no('bad-args');
    }
  }

  // 실행 — 각 실행기에 «칸별로 새로 지은» 객체를 넘겨요(요청 객체를 통째로 넘기지 않아요).
  // 보드 로컬 등록 동사 — 프레임을 만들지 않고 «보드 로컬 파일» 만 고쳐요(잠금 안의 읽고-고치고-쓰기 · 원자 교체는 keyset.cjs). enroll 동사는 키 등록부가 아니라 «대기열» 에 올려요(위 머리말) —
  //   출처 표기 via = 'signed:<cmdHash 앞 8자>' 가 대기열 항목에 붙고, 사람이 확인하면 그대로 등록부의 enrolledVia 가 돼요(파일만 보고도 명령(감사 줄의 cmdHash8)까지 거슬러 올라가게요).
  //   새 자격증명의 acct 는 «서명한 운영자 계정» 이에요(같은 계정 아래에서만 넓어져요).
  //   마지막 자격증명의 폐기는 거절(last-credential) — 서명 경로가 스스로를 잠그는 길을 닫아요. 이 검사는 «잠금 안» 에서 해서 두 폐기 명령이 동시에 와도 한쪽만 통과해요.
  _local(verb, args, prov, nowMs) {
    const via = 'signed:' + prov.cmdHash.slice(0, 8);
    const acct = prov.operator.slice('acct:'.length);
    const file = this.cfg.keysFile;
    if (typeof file !== 'string' || !file) throw new Error('keysFile 이 없어요');
    switch (verb) {
      case 'credential.enroll':
        KS.queueCredential(file, { credentialId: args.credentialId, alg: args.alg, spki: args.spki, name: args.name }, acct, via, nowMs);
        return;
      case 'device.enroll':
        KS.queueDevice(file, { deviceId: args.deviceId, jwk: args.jwk, kid: args.kid, name: args.name }, via, nowMs);
        return;
      case 'credential.revoke':
        KS.updateKeys(file, (raw) => KS.removeCredential(raw, args.credentialId, false));
        return;
      default:
        throw new Error('no local executor for verb');
    }
  }

  _execute(verb, policy, args, cur, prov, nowMs) {
    if (policy.local) return this._local(verb, args, prov, nowMs);
    const at = new Date(nowMs).toISOString();
    const inj = this.inject[policy.injector];
    const p = { via: prov.via, cmdHash: prov.cmdHash, proof: prov.proof, operator: prov.operator };
    switch (verb) {
      case 'decision.answer': {
        const d = cur.d;
        const choice = args.choice !== null ? args.choice : (args.accept === 'recommended' ? d.recommendChoice : null);
        inj({ id: d.id, question: typeof d.question === 'string' ? d.question : '', choice, text: args.text, accept: args.accept, at }, p);
        return;
      }
      case 'decision.defer':
        inj({ id: cur.d.id, question: typeof cur.d.question === 'string' ? cur.d.question : '', at }, p);
        return;
      case 'hyperbrief.respond':
        inj({ decisionId: cur.d.id, branch: args.branch, note: args.note, at }, p);
        return;
      case 'selection.answer':
        inj({ promptId: cur.sel.promptId, selectedLabels: args.selected.slice(), issuer: cur.sel.issuer, at }, p);
        if (this.selections) this.selections.close(cur.sel.promptId);
        return;
      case 'prompt.send':
        inj({ target: args.target, text: args.text, at }, p);
        return;
      default:
        throw new Error('no executor for verb');
    }
  }
}

// 업링크가 «실행기를 못 세웠을» 때 — 받은 명령을 «전부 거절 + 감사» 해요(안전하게 틀려요).
function unavailableExecutor(auditFn, now, reason) {
  return {
    handle(c) {
      const out = { status: 'rejected', reason: reason || 'exec-unavailable', receipt: null };
      try { auditFn({ at: new Date(now()).toISOString(), cmdId: c.cmdId, verb: null, cmdHash8: 'unparsed', proof: kindOfProof(c.proof), acct: null, status: out.status, reason: out.reason }); } catch (_) { /* noop */ }
      return out;
    },
    close() {},
  };
}

// 던지지 않아요 — 못 세우면 한 줄 말하고 «전부 거절» 실행기를 돌려줘요.
function createExecutor(o) {
  try { return new Executor(o); } catch (e) {
    try { (o.log || (() => {}))('[uplink] 명령 실행 레인을 켜지 못했어요 — 받은 명령은 전부 거절해요: ' + String((e && e.message) || e).slice(0, 140)); } catch (_) { /* noop */ }
    return unavailableExecutor(o.audit || (() => {}), o.now || (() => Date.now()), 'exec-unavailable');
  }
}

module.exports = { createExecutor, Executor, SelectionTracker, VERBS, INJECTORS, BRANCHES, ACCT_RE };
