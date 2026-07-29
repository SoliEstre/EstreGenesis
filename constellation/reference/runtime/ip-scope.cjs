'use strict';
// ip-scope.cjs — 「어디서 온 연결인가」를 **사설 대역의 어휘**로 판정해요.
//
// 이 부품이 있는 이유는 판정이 틀렸던 게 아니라 **어휘가 틀렸기** 때문이에요. 종전 허용목록은
// `null` 을 «전체 허용» 으로 읽었어요. 그래서 보드를 노출한 순간 아무 주소나 통과했고, 실측에서
// 비-loopback 주소가 키도 HELLO 도 없이 에이전트 명부와 대화 이력을 받았어요.
// 「인터넷에 노출하지 않는다」가 전제라면, **「전체 IP 허용」은 적을 수 있는 값이면 안 돼요** —
// 설정 한 줄로 뒤집히는 전제는 전제가 아니라 희망이에요.
//
// 그래서 여기서 공개 주소는 **설정으로 열 수 있는 값이 아니에요.** 밖에서 닿아야 하면 오버레이
// 망(Tailscale 등 — CGNAT 100.64/10)을 쓰고, 인터넷에 내놔야 하면 리버스 프록시가 TLS 를 맡아요.
// 두 경우 다 **서버가 보는 주소는 사설**이에요 — 그러니 공개 주소를 받아들일 이유가 애초에 없어요.
//
// 남는 위험은 그 다음 층이고 이 부품이 못 닫아요: 프록시를 앞에 두면 원격이 전부 loopback 으로
// 보여서 IP 기반 신뢰가 통째로 뒤집혀요. 그건 «신원» 문제라 대역으로는 답이 안 나와요.
// 이 파일이 할 수 있는 건 **그 상황을 알아채는 것까지**예요 (`forwardedPresent` 참조).

// 이름 있는 대역. 운영자가 고를 수 있는 단위이고, 이 목록 밖은 «공개» 예요.
const RANGES = {
  loopback: ['127.0.0.0/8', '::1/128'],
  private: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],   // RFC1918
  cgnat: ['100.64.0.0/10'],                                      // RFC6598 — Tailscale 등 오버레이 망
  linklocal: ['169.254.0.0/16', 'fe80::/10'],
  ula: ['fc00::/7'],                                             // RFC4193 IPv6 사설
};
const GROUP_NAMES = Object.keys(RANGES);
const ALL_PRIVATE = 'all-private';
// 기본값 = 사설 전부. 종전 기본값(`null` = 전체 IP)에서 **좁아지는** 변경이에요. 넓은 쪽을
// 기본으로 두면 «설정을 안 한 상태» 가 가장 위험한 상태가 되는데, 그건 거꾸로예요.
const DEFAULT_GROUPS = GROUP_NAMES.slice();

function normIp(ip) {
  if (!ip) return '';
  let s = String(ip).trim();
  if (s.startsWith('[')) s = s.slice(1, s.indexOf(']') > 0 ? s.indexOf(']') : undefined);
  s = s.replace(/%.*$/, '');                    // zone id (fe80::1%eth0)
  s = s.replace(/^::ffff:/i, '');               // IPv4-mapped IPv6
  if (s === 'localhost') s = '127.0.0.1';
  return s;
}

/** IP 를 {v, n:BigInt} 로. 못 읽으면 null — **못 읽은 건 «허용» 이 아니에요.** */
function parseIp(s) {
  s = normIp(s);
  if (!s) return null;
  if (s.indexOf(':') < 0) {
    const p = s.split('.');
    if (p.length !== 4) return null;
    let n = 0n;
    for (const x of p) {
      if (!/^\d{1,3}$/.test(x)) return null;
      const v = Number(x);
      if (v > 255) return null;
      n = (n << 8n) | BigInt(v);
    }
    return { v: 4, n };
  }
  // IPv6 — `::` 한 번 전개, 끝자리 IPv4 표기 허용
  const dbl = s.split('::');
  if (dbl.length > 2) return null;
  const toWords = (part) => {
    if (!part) return [];
    const out = [];
    for (const h of part.split(':')) {
      if (h.indexOf('.') >= 0) {                // 마지막 32비트가 점 표기
        const v4 = parseIp(h);
        if (!v4 || v4.v !== 4) return null;
        out.push(Number((v4.n >> 16n) & 0xffffn), Number(v4.n & 0xffffn));
        continue;
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(h)) return null;
      out.push(parseInt(h, 16));
    }
    return out;
  };
  const head = toWords(dbl[0]), tail = dbl.length === 2 ? toWords(dbl[1]) : [];
  if (head === null || tail === null) return null;
  const fill = 8 - head.length - tail.length;
  if (dbl.length === 2 ? fill < 0 : fill !== 0) return null;
  const words = dbl.length === 2 ? head.concat(new Array(fill).fill(0), tail) : head;
  if (words.length !== 8) return null;
  let n = 0n;
  for (const w of words) n = (n << 16n) | BigInt(w);
  return { v: 6, n };
}

/** CIDR 또는 정확-IP 표기를 {v, base:BigInt, bits} 로. */
function parseCidr(entry) {
  const s = String(entry).trim();
  if (!s) return null;
  const slash = s.lastIndexOf('/');
  const ipPart = slash > 0 ? s.slice(0, slash) : s;
  const ip = parseIp(ipPart);
  if (!ip) return null;
  const width = ip.v === 4 ? 32 : 128;
  let bits = width;
  if (slash > 0) {
    const b = Number(s.slice(slash + 1));
    if (!Number.isInteger(b) || b < 0 || b > width) return null;
    bits = b;
  }
  const shift = BigInt(width - bits);
  return { v: ip.v, base: (ip.n >> shift) << shift, bits, width };
}

function inCidr(c, ip) {
  if (!c || !ip || c.v !== ip.v) return false;
  const shift = BigInt(c.width - c.bits);
  return (ip.n >> shift) === (c.base >> shift);
}

const _compiled = {};
for (const g of GROUP_NAMES) _compiled[g] = RANGES[g].map(parseCidr);

/** 주소가 속한 대역 이름. 사설 어디에도 안 들면 'public', 못 읽으면 'unknown'. */
function scopeOf(ip) {
  const p = parseIp(ip);
  if (!p) return 'unknown';
  for (const g of GROUP_NAMES) if (_compiled[g].some((c) => inCidr(c, p))) return g;
  return 'public';
}

function isPrivateScope(scope) { return GROUP_NAMES.indexOf(scope) >= 0; }

/**
 * 허용목록을 «사설 대역 목록» 으로 정규화해요.
 *
 * 받는 형태: 이름(loopback/private/cgnat/linklocal/ula/all-private) 또는 CIDR·정확-IP.
 * **거부되는 형태는 조용히 버리지 않고 사유와 함께 돌려줘요** — 아무도 안 보는 자리를
 * 만들면 「적어 뒀는데 안 먹는다」가 무증상으로 남아요.
 */
function normalizeAllowlist(list) {
  if (list == null) return { groups: DEFAULT_GROUPS.slice(), cidrs: [], rejected: [], defaulted: true };
  const arr = Array.isArray(list) ? list : [list];
  const groups = [], cidrs = [], rejected = [];
  for (const raw of arr) {
    const s = String(raw).trim();
    if (!s) continue;
    const low = s.toLowerCase();
    if (low === ALL_PRIVATE || low === 'all' || low === '*') { for (const g of GROUP_NAMES) if (groups.indexOf(g) < 0) groups.push(g); continue; }
    if (GROUP_NAMES.indexOf(low) >= 0) { if (groups.indexOf(low) < 0) groups.push(low); continue; }
    const c = parseCidr(s);
    if (!c) { rejected.push({ entry: s, why: '주소·대역으로 읽을 수 없어요' }); continue; }
    // 대역 전체가 사설 안에 들어야 해요. base 만 보면 `10.0.0.0/4` 같은 게 통과하는데
    // 그건 사설에서 시작해 공개까지 삼키는 대역이에요.
    const lo = c.base, hi = c.base | ((1n << BigInt(c.width - c.bits)) - 1n);
    const covered = (n) => { const g = scopeOf(fromInt(c.v, n)); return isPrivateScope(g); };
    if (!covered(lo) || !covered(hi)) {
      rejected.push({ entry: s, why: '사설 대역 밖을 포함해요 — 공개 주소는 설정으로 열 수 없어요 (밖에서 닿아야 하면 오버레이 망, 인터넷 노출이면 리버스 프록시)' });
      continue;
    }
    cidrs.push(c);
  }
  if (!groups.length && !cidrs.length && !rejected.length) return { groups: [], cidrs: [], rejected, defaulted: false };
  return { groups, cidrs, rejected, defaulted: false };
}

function fromInt(v, n) {
  if (v === 4) return [24n, 16n, 8n, 0n].map((s) => Number((n >> s) & 0xffn)).join('.');
  const w = [];
  for (let i = 7; i >= 0; i--) w.push(Number((n >> BigInt(i * 16)) & 0xffffn).toString(16));
  return w.join(':');
}

/**
 * 최종 판정. @returns {{ok:boolean, scope:string, why:string}}
 * boolean 하나로 안 돌려주는 게 요점이에요 — 거절 사유가 없으면 「왜 안 붙지」가 무증상이에요.
 */
function decide(list, ip) {
  const scope = scopeOf(ip);
  if (scope === 'unknown') return { ok: false, scope, why: `주소를 읽을 수 없어요 (${String(ip).slice(0, 40)}) — 못 읽은 건 허용이 아니에요` };
  if (scope === 'public') return { ok: false, scope, why: '공개 주소예요 — 보드는 인터넷에 노출되지 않는 전제로 서 있어요 (오버레이 망 또는 리버스 프록시를 쓰세요)' };
  // 로컬은 목록과 무관하게 통과해요. 안 그러면 빈 목록(`[]`)이 **자기 기계에서도 못 붙는** 상태가
  // 되고, 그러면 운영자가 설정을 되돌릴 통로까지 닫혀요. 그래서 `[]` 는 «loopback 만» 을 뜻해요 —
  // 「전부 닫기」가 표현 가능한 값이면서 자기 발을 쏘지는 않는 자리예요.
  if (scope === 'loopback') return { ok: true, scope, why: '로컬은 항상 통과' };
  const n = normalizeAllowlist(list);
  if (n.groups.indexOf(scope) >= 0) return { ok: true, scope, why: `${scope} 대역 허용${n.defaulted ? ' (기본값 = 사설 전부)' : ''}` };
  const p = parseIp(ip);
  if (n.cidrs.some((c) => inCidr(c, p))) return { ok: true, scope, why: `허용 대역에 포함 (${scope})` };
  return { ok: false, scope, why: `${scope} 대역이 허용목록에 없어요` };
}

/**
 * 프록시가 앞에 있는지. 있으면 **loopback 이라는 사실이 아무 뜻이 없어요** — 원격이 전부
 * 로컬로 보이니까요(Ultrasafe 회차 2 `tml-10`: 코드 주석이 스스로 인정하던 그 구멍).
 * 이 부품은 대역으로 신원을 만들 수 없어서 닫지는 못하고, **알아채는 것까지** 해요.
 */
function forwardedPresent(headers) {
  if (!headers) return false;
  for (const h of ['x-forwarded-for', 'x-real-ip', 'forwarded', 'x-forwarded-host', 'x-client-ip']) {
    if (headers[h]) return true;
  }
  return false;
}

module.exports = {
  RANGES, GROUP_NAMES, ALL_PRIVATE, DEFAULT_GROUPS,
  normIp, parseIp, parseCidr, inCidr, scopeOf, isPrivateScope,
  normalizeAllowlist, decide, forwardedPresent,
};
