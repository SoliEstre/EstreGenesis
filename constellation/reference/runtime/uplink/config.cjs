'use strict';
// config.cjs — uplink.json 을 «엄격하게» 읽어요.
//
// **왜 엄격한가.** 이 파일은 보드가 «밖으로 무엇을, 어디로» 내보내는지를 정해요. 오타 하나(`visbility`)가 조용히 무시되면 설정을 쓴 쪽은
//   «sealed 로 적었다» 고 믿는데 실제로는 기본값으로 도는 일이 생기고, 그 방향이 하필 «더 많이 나가는» 쪽일 수 있어요. 그래서 모르는 키는 «무시» 가
//   아니라 «이 업링크는 안 켠다» 예요(서버는 업링크 없이 그대로 돌아요 — 한 줄만 말해요).
//   그리고 이 설정은 **로컬이 정본**이에요: 중계 서비스가 응답으로 설정을 바꾸는 경로는 없어요(여기엔 «받아서 반영» 하는 코드가 없고, 앞으로도 두지 않아요).
//
// 반환은 {ok:true, cfg} | {ok:false, error}. 던지지 않아요 — 호출자(서버 기동 길목)가 try/catch 를 한 겹 더 두긴 하지만, 설정 오류는 «입력 탓» 이라 값으로 돌려줘요.

const path = require('path');

const TOP_KEYS = ['relay', 'boardId', 'tokenFile', 'keysFile', 'visibility', 'dashboardUrl', 'observation', 'rp', 'totp'];
const VISIBILITY = ['sealed', 'envelope'];
const OBS = ['observed', 'unobserved', 'unknown'];
const CHANNEL_ID_RE = /^[A-Za-z0-9._:@*-]{1,64}$/;
const BOARD_ID_RE = /^[\x21-\x7e]{1,128}$/;       // 인쇄 가능 ASCII(공백 제외) — seal 의 aad.boardId 로도 쓰여요
const HOST_RE = /^[A-Za-z0-9.-]{1,253}$/;
const VERB_RE = /^[A-Za-z0-9._-]{1,64}$/;

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
// 로그에 찍을 키 이름은 «짧은 식별자 모양» 일 때만 — 설정 파일이 길고 이상한 키를 가졌다고 그걸 그대로 로그로 내보내진 않아요.
const keyLabel = (k) => (/^[A-Za-z0-9_.-]{1,40}$/.test(k) ? k : '(이름 부적합)');
const bad = (msg) => ({ ok: false, error: msg });

function isLoopbackHost(h) {
  const x = String(h || '').toLowerCase();
  return x === 'localhost' || x === '127.0.0.1' || x === '[::1]' || x === '::1' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(x);
}

// https:// 이거나 «loopback 호스트의 http://» (시험용). 자격증명·쿼리·해시는 금지 — 토큰이 URL 로 새는 길을 설정 단계에서 닫아요.
function checkUrl(s, what, { allowPath }) {
  if (typeof s !== 'string' || s.length < 1 || s.length > 512) return bad(what + ' 은 문자열 URL 이어야 해요');
  let u;
  try { u = new URL(s); } catch (_) { return bad(what + ' 을 URL 로 읽을 수 없어요'); }
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && isLoopbackHost(u.hostname))) return bad(what + ' 은 https:// 여야 해요 (loopback 만 http 허용)');
  if (u.username || u.password) return bad(what + ' 에 자격증명을 넣을 수 없어요');
  if (u.search || u.hash) return bad(what + ' 에 쿼리·해시를 넣을 수 없어요');
  if (!allowPath && u.pathname !== '/') return bad(what + ' 은 origin 만 받아요');
  const base = u.origin + (u.pathname === '/' ? '' : u.pathname.replace(/\/+$/, ''));
  return { ok: true, url: base, origin: u.origin, protocol: u.protocol, hostname: u.hostname, port: u.port };
}

function validate(raw, ctx) {
  const dir = ctx && ctx.dir;
  if (!isPlain(raw)) return bad('최상위가 객체가 아니에요');
  for (const k of Object.keys(raw)) if (!TOP_KEYS.includes(k)) return bad('모르는 키 «' + keyLabel(k) + '»');
  if (raw.relay === undefined) return bad('relay 가 없어요');
  const rel = checkUrl(raw.relay, 'relay', { allowPath: true });
  if (!rel.ok) return rel;
  if (typeof raw.boardId !== 'string' || !BOARD_ID_RE.test(raw.boardId)) return bad('boardId 는 1~128자의 인쇄 가능 ASCII(공백 제외)여야 해요');
  const tokenFile = raw.tokenFile === undefined ? 'uplink-token' : raw.tokenFile;
  const keysFile = raw.keysFile === undefined ? 'uplink-keys.json' : raw.keysFile;
  for (const [n, v] of [['tokenFile', tokenFile], ['keysFile', keysFile]]) {
    if (typeof v !== 'string' || !v || v.length > 260 || /[\x00-\x1f]/.test(v)) return bad(n + ' 은 파일 경로 문자열이어야 해요');
  }
  const visibility = raw.visibility === undefined ? 'sealed' : raw.visibility;   // 기본은 «적게 나가는» 쪽 — 맥락이 봉인돼요
  if (!VISIBILITY.includes(visibility)) return bad('visibility 는 sealed | envelope 이어야 해요');
  let dashboardUrl = null;
  if (raw.dashboardUrl !== undefined) {
    const d = checkUrl(raw.dashboardUrl, 'dashboardUrl', { allowPath: true });
    if (!d.ok) return d;
    dashboardUrl = d.url;
  }
  const channels = [];
  if (raw.observation !== undefined) {
    const o = raw.observation;
    if (!isPlain(o) || Object.keys(o).some((k) => k !== 'channels')) return bad('observation 은 {channels:[...]} 만 받아요');
    if (!Array.isArray(o.channels) || o.channels.length > 64) return bad('observation.channels 는 64개 이하의 배열이어야 해요');
    const seen = new Set();
    for (const c of o.channels) {
      if (!isPlain(c) || Object.keys(c).some((k) => k !== 'id' && k !== 'obs')) return bad('observation.channels 항목은 {id, obs} 만 받아요');
      if (typeof c.id !== 'string' || !CHANNEL_ID_RE.test(c.id)) return bad('observation.channels[].id 가 식별자 모양이 아니에요');
      if (!OBS.includes(c.obs)) return bad('observation.channels[].obs 는 observed | unobserved | unknown 이어야 해요');
      if (seen.has(c.id)) return bad('observation.channels 에 같은 id 가 두 번 있어요');
      seen.add(c.id);
      channels.push({ id: c.id, obs: c.obs });
    }
  }
  // rp · totp 는 이 레인(전송)에선 쓰지 않아요 — 다음 레인(명령 실행)이 읽어요. 그래서 지금은 «모양만» 엄격히 확인해 두고,
  //   그 레인이 켜질 때 처음 터지는 오타가 되지 않게 해요.
  let rp = null;
  if (raw.rp !== undefined) {
    const r = raw.rp;
    if (!isPlain(r) || Object.keys(r).some((k) => k !== 'id' && k !== 'origins')) return bad('rp 는 {id, origins} 만 받아요');
    if (typeof r.id !== 'string' || !HOST_RE.test(r.id)) return bad('rp.id 가 호스트 이름 모양이 아니에요');
    if (!Array.isArray(r.origins) || r.origins.length < 1 || r.origins.length > 8) return bad('rp.origins 는 1~8개의 배열이어야 해요');
    const origins = [];
    for (const s of r.origins) {
      const c = checkUrl(s, 'rp.origins[]', { allowPath: false });
      if (!c.ok) return c;
      origins.push(c.origin);
    }
    rp = { id: r.id, origins };
  }
  let totp = null;
  if (raw.totp !== undefined) {
    const t = raw.totp;
    if (!isPlain(t) || Object.keys(t).some((k) => k !== 'verbs')) return bad('totp 는 {verbs:[...]} 만 받아요');
    if (!Array.isArray(t.verbs) || t.verbs.length > 32 || t.verbs.some((v) => typeof v !== 'string' || !VERB_RE.test(v))) return bad('totp.verbs 는 식별자 32개 이하의 배열이어야 해요');
    totp = { verbs: t.verbs.slice() };
  }
  const resolve = (p) => path.resolve(dir || '.', p);
  return {
    ok: true,
    cfg: {
      relay: rel.url, relayProtocol: rel.protocol, relayHost: rel.hostname, boardId: raw.boardId,
      tokenFile: resolve(tokenFile), keysFile: resolve(keysFile), visibility, dashboardUrl,
      channels, rp, totp,
    },
  };
}

module.exports = { validate, isLoopbackHost, TOP_KEYS, OBS, VISIBILITY };
