'use strict';
// project.cjs — 보드 프레임을 «밖으로 나가도 되는 봉투» 로 줄이는 **화이트리스트 투영**.
//
// **왜 «걸러내기» 가 아니라 «골라 담기» 인가.** 블랙리스트(본문 필드를 지운다)는 새 프레임이 새 본문 필드를 달고 오는 날 조용히 뚫려요 —
//   「없던 이름이 와서 통과했다」 는 오류가 아니라 «잘 보냈다» 로 보여서 가장 늦게 발견돼요. 그래서 여기엔 «지울 목록» 이 없고 «담을 칸» 만 있어요:
//   봉투는 아래 고정 칸(ts type name msgId parentId from to source class channel obs meta)이고, meta 는 **프레임 이름별 고정 칸** 만이에요.
//   표에 없는 값은 «무엇이든» 못 나가요(TEXT_MESSAGE 의 text · Report/WorkerReport 의 본문 · 이력 재생 · 모르는 value 필드 전부).
//
// **적대적 에이전트를 가정해요.** msgId · from · to 같은 «식별자 칸» 에 본문을 숨겨 보내는 길이 있어요(칸마다 타입·길이·문자 집합이 있어야 막혀요). 선택:
//   · 가명은 **키 있는 HMAC** 이에요(`h:` + HMAC-SHA256(보드 로컬 비밀, 값) 앞 24 hex) — 키 없는 해시는 «값의 공간이 작으면» (코드·이름·짧은 문장) 중계가 사전 대입으로
//     되돌려요(실측: 6자리 코드 100만 개를 1초 안에). 비밀은 보드 밖으로 안 나가니 중계는 되돌릴 수 없고, 같은 값은 같은 가명이라 보드 안의 상관은 그대로예요.
//   · 메시지 id(msgId · parentId) · 약속 id(meta 의 decision_id · promptId): **항상** 가명 — 중계에 필요한 건 «같은 것이다» 라는 상관뿐이고, 평문을 허용하면 칸당 128자가
//     그대로 «숨은 전송로» 가 돼요(프레임 수가 무제한이라 긴 본문도 수십 프레임이면 나가요).
//   · 채널: 설정에 «선언된» 채널만 평문(정확히 일치하면 그 id, 접두 선언(`desk:*`)에 걸리면 «선언 id 그대로» — 접미를 싣지 않아요). 선언 밖이면 가명.
//   · 프레임 이름: 분류표(frame-class)에 있는 이름만 싣고, 모르는 이름은 name=null · class='other' — «활동이 있었다» 만 나가요(이름 자체가 칸당 64자의 전송로라서).
//   · 식별자(from · to · agent id): /^[A-Za-z0-9._:@-]{1,64}$/ 를 만족하면 그대로, 아니면 가명 — «잘라서 보내기» 는 하지 않아요(앞부분에 비밀이 있으면 잘린 앞부분이 곧 유출이라서).
//   · 이름 모양 자체가 식별자가 아니면(name) 프레임 전체를 안 보내요.  · meta 값: 칸마다 타입·길이 검사, 어긋나면 그 칸만 빠져요.
//   남는 한계(문서화): from/to 는 사람이 읽는 에이전트 id 라 평문을 허용하므로 칸당 ≤64자의 «짧은 데이터» 를 실어 나르는 건 막지 못해요. 프레임 빈도 제한도 두지 않아요 —
//   빈도 제한은 «프레임당 비트» 가 아니라 «프레임 수» 만 줄이고, 타이밍·건수 자체가 전송로인 건 어떤 메타데이터 채널에서도 못 없애요. 에이전트는 열쇠로 인증된 주체이고
//   이 수준이 «본문 전송» 이 되진 않아요 — 막는 건 «본문 크기» 의 유출이에요.
//
// **빠지는 것(통째로).** ① 키 관리 프레임 — 이름에 key(대소문자 무관)가 들어간 것 전부 + Register* · Revoke* (서버의 KEY_VERBS·KeyIssued 계열·CollabKeyIssued·UpstreamKeyIssued 를
//   목록 없이 한 규칙으로 덮어요 — 목록은 새 키 프레임이 생기는 날 뒤처져요). ② push.cjs 의 NOISE 집합(그 부품의 판정 함수 isNoise 로 물어요 — 복사본도, 살아 있는 Set 도 안 쥐어요).
//   ③ 텔레메트리 프레임(frame-class.isTelemetryFrame — 관측 스트림이라 하트비트가 대신 말해요) ④ Pty* (터미널 바이트가 오가는 프레임). ⑤ 타입이 허용 집합 밖인 것
//   (TEXT_MESSAGE_CONTENT 같은 델타 스트림 · TOOL_CALL_* · STATE_* — 본문이거나 본문 조각이라서).
//   바깥 이름과 value.name(이중 봉투) **둘 다** 에 같은 규칙을 걸어요 — 한쪽만 보면 반대쪽에 진짜 이름을 숨겨요.
//
// 순수 함수예요: 시계·파일·네트워크 없음(비밀은 만들 때 주입). ts 는 프레임이 가진 값을 «검사해서» 쓰고, 없으면 null(전송 층이 채워요).

const crypto = require('crypto');
const FC = require('../frame-class.cjs');
const PUSH = require('../push.cjs');

const ID_RE = /^[A-Za-z0-9._:@-]{1,64}$/;
const NAME_RE = /^[A-Za-z0-9_.-]{1,64}$/;
const ENUM_RE = /^[A-Za-z0-9_.-]{1,32}$/;
const RESOLUTION_RE = /^[A-Za-z0-9_.:-]{1,64}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;
const SOURCES = new Set(['agent', 'board', 'server', 'collab', 'bridge', 'peer', 'upstream', 'local', 'system']);
const OBS_VALUES = new Set(['observed', 'unobserved', 'unknown']);
// 와이어 «타입» 허용 집합 — CUSTOM(이름으로 분류) + 본문 없는 수명 신호들. 델타·도구·상태 스트림은 «본문 조각» 이라 목록에 없어요.
//   TEXT_MESSAGE_START/CHUNK 는 «발화가 있었다» 는 사실만 실어요(text 는 어떤 경로로도 안 나가요). END 는 START 와 중복이라 뺐어요.
const TYPES = new Set(['CUSTOM', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CHUNK', 'RUN_STARTED', 'RUN_FINISHED', 'RUN_ERROR']);
const TAG_HEX = 24;                    // 96 비트 — 한 보드 안의 충돌은 무시할 수 있어요. 결정 항목의 itemId(sd:<tag>)도 같은 재료예요

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 키 있는 가명 재료 — 비밀은 보드 로컬(store.secret)이고 어디로도 안 나가요. 4096자 너머는 앞부분만 먹여요(가명이라 내용은 안 나가요).
function secretBuf(secret) {
  const b = Buffer.isBuffer(secret) ? secret : (typeof secret === 'string' ? Buffer.from(secret, 'utf8') : null);
  if (!b || b.length < 16) throw new Error('uplink projector: secret 이 필요해요 (16바이트 이상)');
  return b;
}
const tagOf = (secret, s) => crypto.createHmac('sha256', secretBuf(secret)).update('eg-uplink-id/v1\n').update(String(s).slice(0, 4096), 'utf8').digest('hex').slice(0, TAG_HEX);
const pseudoOf = (secret, s) => 'h:' + tagOf(secret, s);

const enumStr = (v) => (typeof v === 'string' && ENUM_RE.test(v) ? v : undefined);
const when = (v) => {
  if (Number.isSafeInteger(v) && v > 0) return v;
  if (typeof v === 'string' && v.length <= 40 && ISO_RE.test(v)) return v;
  return undefined;
};
const score = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000 ? Math.round(v * 1000) / 1000 : undefined);
function pick(o) { const out = {}; for (const k of Object.keys(o)) if (o[k] !== undefined) out[k] = o[k]; return out; }

// 프레임 이름별 meta — **여기가 «고정 칸» 의 전부예요.** 값은 msg.value 의 최상위 칸만 읽어요(중첩 탐색 없음).
//   약속 id 칸(decision_id · promptId)은 `pid(값)` 로 가명이 돼요 — 결정 항목의 itemId(sd:<tag>)와 같은 재료라 중계가 «같은 결정» 을 이어 볼 수 있어요.
const metaTable = (pid) => {
  const res = (v) => (typeof v.resolution === 'string' && RESOLUTION_RE.test(v.resolution) ? v.resolution : undefined);
  return {
    DECISION_REQUEST: (v) => pick({
      decision_id: pid(v.decision_id), reversibility_class: enumStr(v.reversibility_class), deadline: when(v.deadline),
      escalation_sum: score(v.escalation_sum), ack_tier_required: enumStr(v.ack_tier_required),
    }),
    SelectionPrompt: (v) => pick({ promptId: pid(v.promptId), timeoutKind: isPlain(v.timeout) ? enumStr(v.timeout.kind) : undefined, expiresAt: when(v.expiresAt) }),
    SelectionResolved: (v) => pick({ promptId: pid(v.promptId), resolution: res(v) }),
    SelectionExpired: (v) => pick({ promptId: pid(v.promptId), resolution: res(v) }),
    DECISION_RESPONSE: (v) => pick({ decision_id: pid(v.decision_id) }),
    DECISION_DEFER: (v) => pick({ decision_id: pid(v.decision_id) }),
    REJECT_FRAMING: (v) => pick({ decision_id: pid(v.decision_id) }),
    DECISION_REJECT_FRAMING: (v) => pick({ decision_id: pid(v.decision_id) }),   // 규격상 이름은 이쪽이고, 위쪽은 지시에 적힌 짧은 이름 — 둘 다 같은 칸
  };
};
const META_NAMES = new Set(Object.keys(metaTable(() => undefined)));

const KEYISH = /key/i;
const EXCLUDED_PREFIX = /^(Register|Revoke|Pty)/;
function excludedName(n) {
  return typeof n === 'string' && (PUSH.isNoise(n) || KEYISH.test(n) || EXCLUDED_PREFIX.test(n));
}
// 분류표에 있거나 meta 표에 있는 이름만 «이름으로» 나가요 — 나머지는 name=null(활동만).
const knownName = (n) => FC.groupOfName(n) !== 'other' || META_NAMES.has(n);

// 이중 봉투(바깥 name 이 'CUSTOM' 이고 진짜 이름이 value.name) 를 푼 «유효 이름». 바깥·안쪽 중 하나라도 제외 규칙에 걸리면 프레임 전체가 빠져요.
function namesOf(msg) {
  const outer = typeof msg.name === 'string' ? msg.name : null;
  const inner = isPlain(msg.value) && typeof msg.value.name === 'string' ? msg.value.name : null;
  const eff = (outer && outer !== 'CUSTOM') ? outer : (inner || outer);
  return { outer, inner, eff };
}

function observation(channels) {
  const exact = new Map();
  const prefixes = [];
  for (const c of channels || []) {
    if (c.id.endsWith('*')) prefixes.push([c.id.slice(0, -1), c.obs]); else exact.set(c.id, c.obs);
  }
  // 돌려주는 값 = {id, obs} | null(선언에 없음). id 는 «선언된 id 그대로» 예요 — 접두 선언에 걸린 채널의 접미(에이전트가 고른 글자)는 싣지 않아요.
  //   선언이 없는 채널의 obs 는 'unknown' 이에요 — 「관측하지 않는다」 가 아니라 「모른다」 (부재를 idle 로 읽지 않는 규율과 같은 뿌리).
  return (channel) => {
    if (typeof channel !== 'string') return null;
    if (exact.has(channel)) return { id: channel, obs: exact.get(channel) };
    for (const [p, o] of prefixes) if (channel.startsWith(p)) return { id: p + '*', obs: o };
    return null;
  };
}

function createProjector(opts) {
  const o = opts || {};
  const secret = secretBuf(o.secret);
  const obsOf = observation(o.channels || []);
  const pseudo = (s) => pseudoOf(secret, s);
  // 문자열이고 규칙을 만족하면 그대로, 문자열인데 어긋나면 가명, 문자열이 아니면 null(숫자·객체를 문자열로 바꿔서 싣지 않아요).
  const ident = (v, re) => {
    if (typeof v !== 'string' || v.length === 0) return null;
    return re.test(v) ? v : pseudo(v);
  };
  const alwaysPseudo = (v) => (typeof v === 'string' && v.length > 0 ? pseudo(v) : null);
  const pid = (v) => (typeof v === 'string' && v.length > 0 ? pseudo(v) : undefined);
  const META = metaTable(pid);

  /** 프레임 → 봉투(seq 제외) | null(보내지 않음). */
  function project(msg) {
    if (!isPlain(msg)) return null;
    if (typeof msg.type !== 'string' || !TYPES.has(msg.type)) return null;
    if (FC.isTelemetryFrame(msg)) return null;
    let name = null;
    let meta = {};
    if (msg.type === 'CUSTOM') {
      const n = namesOf(msg);
      if (excludedName(n.outer) || excludedName(n.inner)) return null;
      if (typeof n.eff !== 'string' || !NAME_RE.test(n.eff)) return null;    // 이름 모양이 식별자가 아니면 «거부» — 가명이 무의미해요
      if (knownName(n.eff)) {
        name = n.eff;
        const f = META[name];
        meta = f && isPlain(msg.value) ? f(msg.value) : {};
      }
    }
    const ch = obsOf(msg.channel);
    return {
      ts: Number.isSafeInteger(msg.timestamp) && msg.timestamp > 0 ? msg.timestamp : null,
      type: msg.type,
      name,
      msgId: alwaysPseudo(msg.msgId !== undefined ? msg.msgId : msg.messageId),
      parentId: alwaysPseudo(msg.parentId),
      from: ident(msg.agentId !== undefined ? msg.agentId : msg.from, ID_RE),
      to: ident(msg.targetAgentId !== undefined ? msg.targetAgentId : msg.to, ID_RE),
      source: typeof msg.source === 'string' && SOURCES.has(msg.source) ? msg.source : null,
      class: name ? FC.groupOfName(name) : 'other',
      channel: ch ? ch.id : alwaysPseudo(msg.channel),
      obs: ch ? ch.obs : 'unknown',
      meta,
    };
  }
  return { project, ident, pseudo, tag: (s) => tagOf(secret, s) };
}

module.exports = { createProjector, ID_RE, NAME_RE, TYPES, tagOf, pseudoOf, OBS_VALUES, TAG_HEX };
