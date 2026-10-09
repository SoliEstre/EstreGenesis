/*
 * bench-chart.js — interactive trust-cost chart for docs/superscalar-bench.html.
 *
 * Progressive enhancement: the page ships static PNG figures; this script loads docs/assets/bench/bench-cells.json,
 * builds the interactive chart in #bench-ix and only then hides the static per-aim figures. If the data cannot be
 * loaded, the static figures stay and a quiet notice says so.
 *
 * Depends on: shared/bench-glyphs.js (vendor marks), shared/bench-labels.js (model-name placement).
 * Reads the axis values only through bench-cells.json `axes.x.key` / `axes.y.key`. Optional per-aim `conditions_en` /
 * `conditions_ko` (the full run-condition line for that aim) replace the generic run-condition line under the chart and in
 * exports; without them the generic line points readers to the page's Limits section.
 * Filter state lives in the URL hash (#chart?aim=…&v=…&t=…&from=…&to=…&ud=0&cur=1&hide=…) so a view can be shared.
 * No libraries, no network beyond the JSON and these scripts.
 */
(function () {
  'use strict';
  var BG = window.BenchGlyphs, BL = window.BenchLabels;
  var mount = document.getElementById('bench-ix');
  if (!mount) return;

  var ORDER = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra', 'default'];
  var ABBR = { low: 'L', medium: 'M', high: 'H', xhigh: 'X', max: 'Mx', ultra: 'U', default: 'D' };
  var TIERS = ['T1', 'T1.5', 'T2', 'T3', 'T4'];
  var HARNESS = { claude: 'Claude Code', codex: 'Codex', grok: 'Grok Build', agy: 'Antigravity' };
  var FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  var GLYPH = 6.5;
  var N1_DASH = '2 2';

  var STR = {
    en: {
      tablist: 'Aims', aim: 'aim', hiddenTests: '{n} hidden tests',
      filters: 'Filters', filtersOn: 'filtered',
      vendor: 'Vendor', tier: 'Tier', release: 'Release date',
      from: 'Released on or after', to: 'Released on or before',
      ticks: 'Model releases. Arrow keys move between them; Enter moves the nearest handle to that date.',
      unknownDate: 'Unknown release date', none: 'none', unknown: 'unknown',
      current: 'Current generation only', reset: 'Reset filters',
      count: '{n} of {m} models shown',
      legend: 'Models — select one to hide or show it',
      shown: 'shown', hidden: 'hidden',
      notReached: 'not reached', notReachedList: 'not reached: {list}', partialList: 'partial cost: {list}',
      tierUnknown: 'tier unknown', dateUnknown: 'release date unknown', released: 'released {d}',
      log: ' (log)',
      key: [
        'Each line is one model through its effort levels (L low · M medium · H high · X xhigh · Mx max · D default). Lower-left is better.',
        'Mark shape = vendor · colour = model · filled = reached on the first answer in every run · outline = needed a refinement round or did not reach.',
        '★ = lowest trust cost after the eligibility steps · ☆ = fastest within the time band (shown only when it differs from ★) · † = provisional (n=1). A solid ring around a point marks ★, a dashed ring ☆; the text tag sits beside it where there is room.',
        'Short pale dashes = n=1 (one run per effort so far); the other dash patterns tell models of one colour apart, as in the static figures.',
      ],
      conditions: 'Run conditions: each point is the mean over its runs · each run works in an isolated copy of the task repository and may run node there · first answer + up to 3 refinement rounds within a 90-minute round budget. Claude accounts, plugin hooks, CLI versions and run order differ by row.',
      limitsLink: 'See Limits', seeLimits: 'see «Limits» on the source page',
      notesExport: 'Notes', partialMark: '* = partial cost (lower bound)',
      effort: 'effort', runs: 'runs', reached: 'reached', oneShot: 'one-shot', yes: 'yes', no: 'no',
      trustCost: 'trust cost', trustTime: 'trust time', meanCost: 'mean cost', meanTime: 'mean time',
      recStar: '★ recommended: lowest trust cost', recHollow: '☆ fastest within the time band', provisional: '† provisional (n=1)',
      minutes: '{v} min',
      exportHead: 'Export the current view', dlSvg: 'Download SVG', dlPng: 'Download PNG', scale: 'PNG scale', withLegend: 'Include the legend',
      notice: 'The interactive chart could not load its data, so the static figures below are shown.',
      noModels: 'No model matches the filters.',
      tableCaption: '{aim} — values behind the chart as currently filtered ({count}).',
      cols: ['Model', 'Effort', 'Runs', 'Reached', 'One-shot', 'Trust cost', 'Trust time', 'Mark', 'Notes'],
      chartLabel: 'Trust-cost chart, {aim}. {count}. Tab to a point, then use the arrow keys: left and right move along a model, up and down move between models.',
      notesHead: 'Notes on cells in this view',
      sumVendors: 'vendors', sumTiers: 'tiers', all: 'all', sumReleased: 'released {a} – {b}',
      sumUnknownIn: 'unknown dates included', sumUnknownOut: 'unknown dates excluded', sumCurrent: 'current generation only', sumHidden: 'hidden: {list}',
      snapshot: 'data snapshot {s}', source: 'source: {u}', title: 'Superscalar Bench — trust cost',
    },
    ko: {
      tablist: 'aim', aim: 'aim', hiddenTests: '숨긴 시험 {n}개',
      filters: '필터', filtersOn: '걸림',
      vendor: '공급사', tier: '티어', release: '출시일',
      from: '이 날짜 이후 출시', to: '이 날짜 이전 출시',
      ticks: '모델 출시일. 화살표 키로 옮겨 다니고, Enter 를 누르면 가까운 손잡이가 그 날짜로 가요.',
      unknownDate: '출시일 모름', none: '없음', unknown: '모름',
      current: '현행 세대만', reset: '필터 초기화',
      count: '모델 {m}개 중 {n}개 표시',
      legend: '모델 — 눌러서 숨기거나 보이기',
      shown: '보임', hidden: '숨김',
      notReached: '미도달', notReachedList: '미도달: {list}', partialList: '비용 일부: {list}',
      tierUnknown: '티어 모름', dateUnknown: '출시일 모름', released: '출시 {d}',
      log: ' (로그)',
      key: [
        '선 하나 = 한 모델의 effort 단계(L low · M medium · H high · X xhigh · Mx max · D default). 왼쪽 아래일수록 좋아요.',
        '점 모양 = 공급사 · 색 = 모델 · 채움 = 모든 실행이 첫 답에서 도달 · 외곽선 = 보정 라운드가 필요했거나 미도달.',
        '★ = 자격 단계를 거친 뒤 신뢰비용이 가장 낮은 effort · ☆ = 시간 띠 안에서 가장 빠른 effort(★ 와 다를 때만) · † = 잠정(n=1). 점 둘레의 실선 고리 = ★ · 점선 고리 = ☆ 이고, 글자 표지는 자리가 있을 때 옆에 붙어요.',
        '짧고 옅은 점선 = n=1(아직 effort 마다 한 번) · 그 밖의 점선 모양은 정적 그림처럼 같은 색 모델을 갈라요.',
      ],
      conditions: '실행 조건: 점 하나 = 그 칸 실행들의 평균 · 실행마다 과제 저장소의 격리된 사본에서 작업하고 거기서 node 를 돌릴 수 있어요 · 첫 답 + 보정 라운드 최대 3번, 라운드 예산 90분. Claude 계정 · 플러그인 훅 · CLI 버전 · 실행 순서는 행마다 달라요.',
      limitsLink: '«한계» 보기', seeLimits: '출처 페이지의 «한계» 참고',
      notesExport: '각주', partialMark: '* = 비용 일부(하한)',
      effort: 'effort', runs: '실행', reached: '도달', oneShot: '첫 답 도달', yes: '예', no: '아니요',
      trustCost: '신뢰비용', trustTime: '신뢰시간', meanCost: '평균 비용', meanTime: '평균 시간',
      recStar: '★ 권장: 신뢰비용 최저', recHollow: '☆ 시간 띠 안에서 가장 빠름', provisional: '† 잠정(n=1)',
      minutes: '{v}분',
      exportHead: '지금 보이는 그대로 내보내기', dlSvg: 'SVG 내려받기', dlPng: 'PNG 내려받기', scale: 'PNG 배율', withLegend: '범례 포함',
      notice: '인터랙티브 그림의 데이터를 불러오지 못해서 아래 정적 그림을 보여 드려요.',
      noModels: '필터에 맞는 모델이 없어요.',
      tableCaption: '{aim} — 지금 필터로 보이는 그림의 값({count}).',
      cols: ['모델', 'effort', '실행', '도달', '첫 답 도달', '신뢰비용', '신뢰시간', '표시', '각주'],
      chartLabel: '신뢰비용 그림, {aim}. {count}. Tab 으로 점에 들어간 뒤 화살표 키: 왼쪽·오른쪽은 한 모델의 effort 를, 위·아래는 모델 사이를 옮겨 다녀요.',
      notesHead: '이 화면의 칸에 붙은 각주',
      sumVendors: '공급사', sumTiers: '티어', all: '전체', sumReleased: '출시 {a} – {b}',
      sumUnknownIn: '출시일 모름 포함', sumUnknownOut: '출시일 모름 제외', sumCurrent: '현행 세대만', sumHidden: '숨김: {list}',
      snapshot: '데이터 스냅샷 {s}', source: '출처: {u}', title: 'Superscalar Bench — 신뢰비용',
    },
  };

  // ── small helpers ──────────────────────────────────────────────────────────
  function lang() { return document.documentElement.getAttribute('lang') === 'ko' ? 'ko' : 'en'; }
  function T(k, vars) {
    var s = STR[lang()][k]; if (s == null) s = STR.en[k];
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, function (_, v) { return vars[v] != null ? vars[v] : ''; });
    return s;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function dayOf(s) { if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; var t = Date.parse(s + 'T00:00:00Z'); return isNaN(t) ? null : Math.round(t / 864e5); }
  function dateOf(d) { return new Date(d * 864e5).toISOString().slice(0, 10); }
  function usd(v) { return v == null ? '—' : '$' + (v < 0.1 ? v.toFixed(3) : v < 10 ? v.toFixed(2) : v.toFixed(1)); }
  function mins(v) { return v == null ? '—' : T('minutes', { v: v < 10 ? f1(v) : Math.round(v) }); }
  function tickUsd(v) { return v >= 1 ? '$' + (+v.toPrecision(3)) : v >= 0.1 ? '$' + v.toFixed(1) : v >= 0.01 ? '$' + v.toFixed(2) : '$' + v.toFixed(3); }
  function tickMin(v) { var s = v >= 10 ? v.toFixed(0) : String(+v.toFixed(1)); return lang() === 'ko' ? s + '분' : s + ' min'; }

  var measureCtx = null;
  function textW(text, size, weight) {
    if (!measureCtx) { try { measureCtx = document.createElement('canvas').getContext('2d'); } catch (e) { measureCtx = null; } }
    if (!measureCtx) return String(text).length * size * 0.6;
    measureCtx.font = (weight || 400) + ' ' + size + 'px ' + FONT;
    return measureCtx.measureText(String(text)).width;
  }

  // colour: parse, luminance, contrast-adjust toward the readable side of the background
  function parseColor(s) {
    s = String(s || '').trim();
    var m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) { var h = m[1]; if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    m = s.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function lum(c) { var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function contrast(a, b) { var la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
  function hex(c) { return '#' + c.map(function (v) { var h = Math.round(Math.max(0, Math.min(255, v))).toString(16); return h.length < 2 ? '0' + h : h; }).join(''); }
  var adjCache = {};
  function readable(color, target) {
    var key = color + '|' + target + '|' + P.bg;
    if (adjCache[key]) return adjCache[key];
    var c = parseColor(color), bg = parseColor(P.bg) || [255, 255, 255];
    if (!c) return (adjCache[key] = '#6b7280');
    var toward = lum(bg) < 0.4 ? [255, 255, 255] : [0, 0, 0], out = c;
    for (var t = 0; t <= 1.0001 && contrast(out, bg) < target; t += 0.05) out = c.map(function (v, i) { return v + (toward[i] - v) * t; });
    return (adjCache[key] = hex(out));
  }

  var P = {};
  function readPalette() {
    var cs = getComputedStyle(mount);
    var g = function (n, d) { var v = cs.getPropertyValue(n).trim(); var c = parseColor(v); return c ? hex(c) : d; };
    P = {
      bg: g('--color-card-bg', '#ffffff'), page: g('--color-bg', '#ffffff'), text: g('--color-text', '#222222'), muted: g('--color-text-muted', '#555555'),
      heading: g('--color-heading', '#111111'), grid: g('--color-border', '#e5e7eb'), accent: g('--color-accent', '#0d9488'),
    };
    P.dark = lum(parseColor(P.bg) || [255, 255, 255]) < 0.4;
    P.muted = readable(P.muted, 4.5);
    adjCache = {};
  }

  // ── data + state ───────────────────────────────────────────────────────────
  var D = null, XK = null, YK = null;
  var MODELS = [], MODEL = {}, VENDOR_LIST = [], TIER_LIST = [], SPAN = null, EXPORT = { scale: 2, legend: true };
  var S = null, userTouched = false;

  function vendorOf(m) { return m.vendor || BG.vendorOf(m.id); }
  function tierOf(m) { return m.tier || 'unknown'; }

  function prepare(json) {
    if (!json || !json.axes || !json.axes.x || !json.axes.y || !json.axes.x.key || !json.axes.y.key || !Array.isArray(json.cells) || !Array.isArray(json.models) || !Array.isArray(json.aims)) throw new Error('bench-cells.json: unexpected shape');
    D = json; XK = json.axes.x.key; YK = json.axes.y.key;
    // numbers are coerced before use: an aim or cell whose counts are not numbers is dropped, so no data string
    // ever reaches markup unescaped through a numeric slot (ids, attributes, the hidden table, the tooltip)
    var num = function (v) { var n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN); return isFinite(n) ? n : null; };
    json.aims = json.aims.filter(function (a) { if (!a) return false; var n = num(a.aim); if (n == null || n !== Math.floor(n) || n < 0) return false; a.aim = n; return true; });
    if (!json.aims.length) throw new Error('bench-cells.json: no aims');
    json.cells = json.cells.filter(function (c) {
      if (!c || c.model == null) return false;
      var aim = num(c.aim), n = num(c.n), reached = num(c.reached);
      if (aim == null || n == null || reached == null) return false;
      c.aim = aim; c.n = n; c.reached = reached; c.model = String(c.model); c.effort = String(c.effort);
      [XK, YK, 'meanCostUsd', 'meanWallMin'].forEach(function (k) { c[k] = c[k] == null ? null : num(c[k]); });
      if (!Array.isArray(c.notes)) c.notes = [];
      return true;
    });
    MODELS = json.models.filter(function (m) { return m && m.id != null; }).map(function (m) { m.id = String(m.id); return m; }); MODEL = {};
    MODELS.forEach(function (m) { MODEL[m.id] = m; });
    // a cell whose model is missing from `models` is still shown, under an «unknown» tier and date
    json.cells.forEach(function (c) {
      if (!MODEL[c.model]) { var m = { id: c.model, name: c.model, vendor: BG.vendorOf(c.model), harness: null, tier: null, tierName: null, releaseDate: null, generation: null, color: '#6b7280', dash: null }; MODEL[c.model] = m; MODELS.push(m); }
    });
    var vids = (json.vendors || []).map(function (v) { return v.id; });
    MODELS.forEach(function (m) { var v = vendorOf(m); if (vids.indexOf(v) < 0) vids.push(v); });
    VENDOR_LIST = vids.map(function (id) { var v = (json.vendors || []).filter(function (x) { return x.id === id; })[0]; return { id: id, name: v ? v.name : (BG.VENDORS.filter(function (x) { return x.id === id; })[0] || { name: id }).name }; });
    TIER_LIST = TIERS.slice();
    MODELS.forEach(function (m) { if (m.tier && TIER_LIST.indexOf(m.tier) < 0) TIER_LIST.push(m.tier); });
    if (MODELS.some(function (m) { return !m.tier; })) TIER_LIST.push('unknown');
    var days = MODELS.map(function (m) { return dayOf(m.releaseDate); }).filter(function (d) { return d != null; });
    SPAN = days.length ? { min: Math.min.apply(null, days), max: Math.max.apply(null, days) } : null;
    MODELS.sort(function (a, b) {
      var va = VENDOR_LIST.findIndex(function (v) { return v.id === vendorOf(a); }), vb = VENDOR_LIST.findIndex(function (v) { return v.id === vendorOf(b); });
      return va - vb || String(a.name).localeCompare(String(b.name));
    });
  }

  function defaults(aim) {
    return {
      aim: aim || D.aims[0].aim,
      vendors: VENDOR_LIST.map(function (v) { return v.id; }),
      tiers: TIER_LIST.slice(),
      from: SPAN ? SPAN.min : 0, to: SPAN ? SPAN.max : 0,
      unknown: true, current: false, hidden: [],
    };
  }
  function resetFilters() { var a = S.aim; S = defaults(a); }
  function selectAim(a) {
    S.aim = a;
    userTouched = true;
    render();
  }

  // URL hash ↔ state
  function sameSet(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }
  function encodeHash() {
    var d = defaults(S.aim), p = [];
    p.push('aim=' + S.aim);
    if (!sameSet(S.vendors, d.vendors)) p.push('v=' + S.vendors.map(encodeURIComponent).join(','));
    if (!sameSet(S.tiers, d.tiers)) p.push('t=' + S.tiers.map(encodeURIComponent).join(','));
    if (SPAN && S.from !== SPAN.min) p.push('from=' + dateOf(S.from));
    if (SPAN && S.to !== SPAN.max) p.push('to=' + dateOf(S.to));
    if (!S.unknown) p.push('ud=0');
    if (S.current) p.push('cur=1');
    if (S.hidden.length) p.push('hide=' + S.hidden.map(encodeURIComponent).join(','));
    return '#chart?' + p.join('&');
  }
  // A shared link may arrive with ',' turned into %2C, or cut short inside a %-escape. Items that do not decode are
  // dropped; a list that had items but none recognised falls back to the default (all) rather than an empty chart.
  // An empty list (v=) stays empty: that is what the page itself writes when every chip is off. Never throws.
  function decodeHash(h) {
    if (!h || h.indexOf('#chart') !== 0) return null;
    try {
      var q = h.split('?')[1] || '', st = defaults(S ? S.aim : null);
      var dec = function (s) { try { return decodeURIComponent(s); } catch (e) { return null; } };
      var list = function (v, ok, dflt) {
        if (v === '') return [];
        var items = v.split(/,|%2C/i).filter(function (x) { return x !== ''; }).map(dec).filter(function (x) { return x != null; });
        var good = items.filter(ok);
        return good.length || dflt === undefined ? good : dflt;
      };
      q.split('&').forEach(function (kv) {
        if (!kv) return;
        var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
        if (k === 'aim') { var a = +v; if (D.aims.some(function (x) { return x.aim === a; })) st.aim = a; }
        else if (k === 'v') st.vendors = list(v, function (x) { return VENDOR_LIST.some(function (y) { return y.id === x; }); }, st.vendors);
        else if (k === 't') st.tiers = list(v, function (x) { return TIER_LIST.indexOf(x) >= 0; }, st.tiers);
        else if (k === 'from' && SPAN) { var f = dayOf(dec(v)); if (f != null) st.from = Math.max(SPAN.min, Math.min(SPAN.max, f)); }
        else if (k === 'to' && SPAN) { var t = dayOf(dec(v)); if (t != null) st.to = Math.max(SPAN.min, Math.min(SPAN.max, t)); }
        else if (k === 'ud') st.unknown = v !== '0';
        else if (k === 'cur') st.current = v === '1';
        else if (k === 'hide') st.hidden = list(v, function (x) { return !!MODEL[x]; });
      });
      if (st.from > st.to) { var tmp = st.from; st.from = st.to; st.to = tmp; }
      return st;
    } catch (e) { return null; }
  }
  function writeHash() {
    if (!userTouched) return;
    var h = encodeHash();
    if (location.hash !== h) { try { history.replaceState(null, '', location.pathname + location.search + h); } catch (e) { location.hash = h; } }
  }

  // ── view ───────────────────────────────────────────────────────────────────
  function passes(m) {
    if (S.vendors.indexOf(vendorOf(m)) < 0) return false;
    if (S.tiers.indexOf(tierOf(m)) < 0) return false;
    if (S.current && m.generation !== 'current') return false;
    var d = dayOf(m.releaseDate);
    if (d == null) return S.unknown;
    return d >= S.from && d <= S.to;
  }
  function plottable(c) { return c[XK] != null && c[YK] != null && c[XK] > 0 && c[YK] > 0; }
  function effIdx(e) { var i = ORDER.indexOf(e); return i < 0 ? ORDER.length : i; }

  function computeView() {
    var byModel = {};
    D.cells.forEach(function (c) { if (c.aim === S.aim && c.n > 0) (byModel[c.model] = byModel[c.model] || []).push(c); });
    var present = MODELS.filter(function (m) { return byModel[m.id]; });
    var passing = present.filter(passes);
    var visible = passing.filter(function (m) { return S.hidden.indexOf(m.id) < 0; });
    var series = visible.map(function (m) {
      var cells = byModel[m.id].slice().sort(function (a, b) { return effIdx(a.effort) - effIdx(b.effort); });
      return { m: m, cells: cells, pts: cells.filter(plottable), miss: cells.filter(function (c) { return !plottable(c); }), n1: cells.every(function (c) { return c.n === 1; }) };
    });
    var aim = D.aims.filter(function (a) { return a.aim === S.aim; })[0] || { aim: S.aim };
    return { aim: aim, byModel: byModel, present: present, passing: passing, visible: visible, series: series };
  }
  function aimText(a) { return T('aim') + ' ' + a.aim + (a['title_' + lang()] || a.title_en ? ' — ' + (a['title_' + lang()] || a.title_en) : ''); }
  function countText(v) { return T('count', { n: v.visible.length, m: v.present.length }); }
  function effLabel(e) { return ABBR[e] || e; }
  function cellMark(c) { return (c.rec === 'star' ? '★' : c.rec === 'hollow' ? '☆' : '') + (c.rec && c.provisional ? '†' : ''); }
  function modelLabel(s) { return s.m.name + (s.n1 ? ' · n=1' : ''); }
  function lineColor(m) { return readable(m.color || '#6b7280', 3); }
  function textColor(m) { return readable(m.color || '#6b7280', 4.5); }
  function footText(k) { var f = D.footnotes && D.footnotes[k]; return f ? (f[lang()] || f.en) : k; }

  // ── chart SVG (screen and export share this) ───────────────────────────────
  function ticks(lo, hi, maxN) {
    var gen = function (ms) { var o = []; for (var e = Math.floor(lo) - 1; e <= Math.ceil(hi) + 1; e++) ms.forEach(function (m) { var v = +(m * Math.pow(10, e)).toPrecision(3), lv = Math.log10(v); if (lv >= lo && lv <= hi) o.push(v); }); return o.sort(function (a, b) { return a - b; }); };
    var a = gen([1, 2, 5]); if (a.length < 5) a = gen([1, 1.5, 2, 3, 5, 7]);
    if (a.length > maxN) { var step = Math.ceil(a.length / maxN); a = a.filter(function (_, i) { return i % step === 0; }); }
    return a;
  }

  function chartBody(view, box, mode) {
    var narrow = box.w < 560, out = [], pts = [];
    var M = { l: narrow ? 54 : 62, r: narrow ? 8 : 16, t: 12, b: narrow ? 40 : 46 };
    var fs = narrow ? 11 : 12, lfs = narrow ? 11 : 12;
    var pl = box.x + M.l, pr = box.x + box.w - M.r, pt = box.y + M.t, pb = box.y + box.h - M.b;
    var xs = [], ys = [];
    view.series.forEach(function (s) { s.pts.forEach(function (c) { xs.push(Math.log10(c[XK])); ys.push(Math.log10(c[YK])); }); });
    if (!xs.length) { xs = [-1, 1]; ys = [0, 2]; }
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (x1 - x0 < 0.2) { x0 -= 0.15; x1 += 0.15; }
    if (y1 - y0 < 0.2) { y0 -= 0.15; y1 += 0.15; }
    var dx = x1 - x0, dy = y1 - y0; x0 -= dx * 0.06; x1 += dx * 0.06; y0 -= dy * 0.08; y1 += dy * 0.08;
    var X = function (v) { return pl + ((Math.log10(v) - x0) / (x1 - x0)) * (pr - pl); };
    var Y = function (v) { return pb - ((Math.log10(v) - y0) / (y1 - y0)) * (pb - pt); };

    // grid + axes
    ticks(x0, x1, Math.max(3, Math.floor((pr - pl) / 62))).forEach(function (v) {
      var x = X(v).toFixed(1);
      out.push('<line x1="' + x + '" y1="' + pt + '" x2="' + x + '" y2="' + pb + '" stroke="' + P.grid + '" stroke-width="1"/>');
      out.push('<text x="' + x + '" y="' + (pb + fs + 5) + '" text-anchor="middle" fill="' + P.muted + '" font-size="' + fs + '">' + esc(tickUsd(v)) + '</text>');
    });
    ticks(y0, y1, Math.max(3, Math.floor((pb - pt) / 34))).forEach(function (v) {
      var y = Y(v).toFixed(1);
      out.push('<line x1="' + pl + '" y1="' + y + '" x2="' + pr + '" y2="' + y + '" stroke="' + P.grid + '" stroke-width="1"/>');
      out.push('<text x="' + (pl - 6) + '" y="' + (+y + 4) + '" text-anchor="end" fill="' + P.muted + '" font-size="' + fs + '">' + esc(tickMin(v)) + '</text>');
    });
    out.push('<rect x="' + pl + '" y="' + pt + '" width="' + (pr - pl) + '" height="' + (pb - pt) + '" fill="none" stroke="' + P.grid + '"/>');
    var ax = D.axes;
    out.push('<text x="' + ((pl + pr) / 2).toFixed(1) + '" y="' + (box.y + box.h - 6) + '" text-anchor="middle" fill="' + P.text + '" font-size="' + fs + '">' + esc((ax.x['label_' + lang()] || ax.x.label_en || XK) + T('log')) + '</text>');
    var ylx = box.x + 10, yly = (pt + pb) / 2;
    out.push('<text x="' + ylx + '" y="' + yly.toFixed(1) + '" transform="rotate(-90 ' + ylx + ' ' + yly.toFixed(1) + ')" text-anchor="middle" fill="' + P.text + '" font-size="' + fs + '">' + esc((ax.y['label_' + lang()] || ax.y.label_en || YK) + T('log')) + '</text>');

    if (!view.series.some(function (s) { return s.pts.length; })) {
      out.push('<text x="' + ((pl + pr) / 2).toFixed(1) + '" y="' + ((pt + pb) / 2).toFixed(1) + '" text-anchor="middle" fill="' + P.muted + '" font-size="' + (fs + 1) + '">' + esc(view.visible.length ? T('notReached') : T('noModels')) + '</text>');
      return { svg: out.join(''), points: pts, M: M };
    }

    // lines + markers, one group per model
    var lab = [], lpts = [], markers = [];
    view.series.forEach(function (s, si) {
      var col = lineColor(s.m), g = ['<g data-model="' + esc(s.m.id) + '">'];
      if (s.pts.length > 1) {
        var dash = s.n1 ? N1_DASH : s.m.dash;
        g.push('<polyline fill="none" stroke="' + col + '" stroke-width="2"' + (dash ? ' stroke-dasharray="' + esc(dash) + '"' : '') + ' stroke-opacity="' + (s.n1 ? 0.5 : 0.85) + '" stroke-linejoin="round" points="' + s.pts.map(function (c) { return X(c[XK]).toFixed(1) + ',' + Y(c[YK]).toFixed(1); }).join(' ') + '"/>');
      }
      s.pts.forEach(function (c, ei) {
        var x = X(c[XK]), y = Y(c[YK]);
        var st = BG.style(c.oneShotAll ? 'filled' : 'outline', col, GLYPH);
        var fill = c.oneShotAll ? st.fill : P.bg;
        var d = BG.path(vendorOf(s.m), GLYPH, x, y);
        var mark = '<path d="' + d + '" fill="' + fill + '" stroke="' + st.stroke + '" stroke-width="' + st.strokeWidth.toFixed(2) + '" stroke-linejoin="round"' + (c.n === 1 ? ' fill-opacity="0.85"' : '') + '/>';
        // ★ / ☆ also as a ring on the marker itself: it costs no space, so the recommendation stays legible where the text tag has no room
        if (c.rec === 'star' || c.rec === 'hollow') mark = '<circle class="bix-rec" data-rec="' + c.rec + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (GLYPH + 3.5) + '" fill="none" stroke="' + col + '" stroke-width="' + (c.rec === 'star' ? 1.8 : 1.4) + '"' + (c.rec === 'hollow' ? ' stroke-dasharray="2.5 2"' : '') + '/>' + mark;
        var k = pts.length;
        pts.push({ k: k, si: si, ei: ei, model: s.m.id, effort: c.effort, x: x, y: y, cell: c, m: s.m });
        if (mode === 'screen') {
          g.push('<g class="bix-pt" data-k="' + k + '" tabindex="' + (k === 0 ? 0 : -1) + '" role="img" aria-label="' + esc(pointAria(s.m, c)) + '">' +
            '<circle class="bix-ring" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="11" fill="transparent" stroke="none"/>' + mark + '</g>');
        } else g.push(mark);
        lpts.push({ model: s.m.id, effort: c.effort, x: x, y: y });
        var mr = c.rec ? GLYPH + 4.5 : 8;   // a ringed point keeps its ring clear too
        markers.push({ x0: x - mr, y0: y - mr, x1: x + mr, y1: y + mr });
      });
      g.push('</g>');
      out.push(g.join(''));
      if (s.pts.length) { var t = modelLabel(s); lab.push({ model: s.m.id, w: Math.ceil(textW(t, lfs, 600)) + 6, h: lfs + 5, text: t, s: s }); }
    });

    // model names, placed by the shared function
    var t0 = (window.performance && performance.now()) || 0;
    var placed = BL.place({ points: lpts, labels: lab.map(function (l) { return { model: l.model, w: l.w, h: l.h }; }), bounds: { x0: pl + 2, y0: pt + 2, x1: pr - 2, y1: pb - 2 }, avoid: [], opts: narrow ? { markerR: 8, gap: 2, rings: [0, 8, 20, 36, 56, 80, 110, 140] } : { markerR: 8, gap: 2 } });   // phones: look further out before covering a marker
    API.lastLabelMs = ((window.performance && performance.now()) || 0) - t0;
    var labelBoxes = [], labelOut = [];
    placed.forEach(function (r, i) {
      if (r.x == null) return;
      var l = lab[i], col = textColor(l.s.m);
      labelBoxes.push({ x0: r.x, y0: r.y, x1: r.x + l.w, y1: r.y + l.h, model: l.model, leader: r.leader, anchorEffort: r.anchorEffort });
      if (r.leader) {
        var a = l.s.pts.filter(function (c) { return c.effort === r.anchorEffort; })[0];
        if (a) {
          var axp = X(a[XK]), ayp = Y(a[YK]);
          var bx = Math.max(r.x, Math.min(axp, r.x + l.w)), by = Math.max(r.y, Math.min(ayp, r.y + l.h));
          labelOut.push('<line x1="' + axp.toFixed(1) + '" y1="' + ayp.toFixed(1) + '" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '" stroke="' + lineColor(l.s.m) + '" stroke-width="0.9" stroke-opacity="0.7"/>');
        }
      }
      labelOut.push('<text data-label-model="' + esc(l.model) + '" data-anchor="' + esc(r.anchorEffort) + '" data-leader="' + (r.leader ? 1 : 0) + '" x="' + (r.x + 3).toFixed(1) + '" y="' + (r.y + l.h - 4).toFixed(1) + '" font-size="' + lfs + '" font-weight="600" fill="' + col + '" stroke="' + P.bg + '" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' + esc(l.text) + '</text>');
    });

    // effort tags (abbreviation + ★/☆/†): only where a free spot exists — recommended ones first. A tag is never forced onto
    // an occupied spot (that piled them up on phones); the ring drawn on the marker carries ★/☆ when the text has no room.
    var tagOut = [], taken = labelBoxes.concat(markers);
    var hit = function (b) { for (var i = 0; i < taken.length; i++) { var o = taken[i]; if (b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) return true; } return false; };
    var tags = [];
    pts.forEach(function (p) { var mk = cellMark(p.cell); tags.push({ p: p, text: effLabel(p.effort) + mk, must: !!mk }); });
    tags.sort(function (a, b) { return (b.must - a.must) || (a.p.k - b.p.k); });
    var tfs = narrow ? 10 : 10.5;
    tags.forEach(function (tg) {
      if (narrow && !tg.must) return;
      var w = textW(tg.text, tfs, 600) + 2, h = tfs + 4, x = tg.p.x, y = tg.p.y;   // h covers the glyphs' ascent + descent
      var q = tg.p.cell.rec ? GLYPH + 4.5 : 8;
      var cands = [[q, -h - 3], [q, 3], [-q - w, -h - 3], [-q - w, 3], [-w / 2, -h - q - 1], [-w / 2, q + 1], [q + 3, -h / 2], [-q - 3 - w, -h / 2]];
      var pick = null;
      for (var i = 0; i < cands.length; i++) {
        var b = { x0: x + cands[i][0], y0: y + cands[i][1] }; b.x1 = b.x0 + w; b.y1 = b.y0 + h;
        if (b.x0 < pl || b.x1 > pr || b.y0 < pt || b.y1 > pb) continue;
        if (!hit(b)) { pick = b; break; }
      }
      if (!pick) return;
      taken.push(pick);
      tagOut.push('<text x="' + (pick.x0 + 1).toFixed(1) + '" y="' + (pick.y1 - 3).toFixed(1) + '" font-size="' + tfs + '" font-weight="600" fill="' + textColor(tg.p.m) + '" stroke="' + P.bg + '" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' + esc(tg.text) + '</text>');
    });
    out.push('<g data-layer="tags">' + tagOut.join('') + '</g>');
    out.push('<g data-layer="labels">' + labelOut.join('') + '</g>');
    return { svg: out.join(''), points: pts, labels: labelBoxes, M: M };
  }

  function pointAria(m, c) {
    var parts = [m.name, T('effort') + ' ' + c.effort];
    if (plottable(c)) parts.push(T('trustCost') + ' ' + usd(c[XK]), T('trustTime') + ' ' + mins(c[YK]));
    parts.push(T('reached') + ' ' + c.reached + '/' + c.n, T('oneShot') + ' ' + (c.oneShotAll ? T('yes') : T('no')));
    if (c.rec === 'star') parts.push(T('recStar')); else if (c.rec === 'hollow') parts.push(T('recHollow'));
    if (c.rec && c.provisional) parts.push(T('provisional'));
    parts.push(T('meanCost') + ' ' + usd(c.meanCostUsd), T('meanTime') + ' ' + mins(c.meanWallMin));
    // the same footnotes the tooltip shows (a partial cost is a lower bound — a screen reader must hear that too)
    (c.notes || []).forEach(function (k) { parts.push(footText(k)); });
    return parts.join(', ');
  }

  // ── DOM ────────────────────────────────────────────────────────────────────
  var ui = {};
  // chip glyphs are drawn in currentColor: they follow the chip's text colour through theme switches without a rebuild
  function glyphSvg(vendor) {
    return '<svg class="bix-glyph" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="' + BG.path(vendor, 5.5, 8, 8) + '" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  // what a rebuild (language switch) must carry over: the filter disclosure's open state and the focused control
  function focusSelector(el) {
    if (!el || !mount.contains(el)) return null;
    var d = el.dataset || {}, q = window.CSS && CSS.escape ? CSS.escape : function (s) { return s; };
    if (el.id) return '#' + q(el.id);
    var keys = ['vendor', 'tier', 'toggle', 'model', 'export', 'day'];
    for (var i = 0; i < keys.length; i++) if (d[keys[i]] != null) return '[data-' + keys[i] + '="' + q(d[keys[i]]) + '"]';
    var cls = ['bix-reset', 'bix-from', 'bix-to', 'bix-scale', 'bix-withlegend'];
    for (var j = 0; j < cls.length; j++) if (el.classList.contains(cls[j])) return '.' + cls[j];
    if (el.tagName === 'SUMMARY' && el.parentElement && el.parentElement.classList.contains('bix-filters')) return '.bix-filters > summary';
    return null;
  }
  var filtersOpen = null;
  function build() {
    readPalette();
    var L = lang();
    var narrow = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
    var oldDetails = mount.querySelector('.bix-filters');
    if (oldDetails) filtersOpen = oldDetails.open;
    var refocus = focusSelector(document.activeElement);
    var h = [];
    h.push('<div class="bix" lang="' + L + '">');
    h.push('<div class="bix-tabs" role="tablist" aria-label="' + esc(T('tablist')) + '">');
    D.aims.forEach(function (a) {
      var sel = a.aim === S.aim;
      h.push('<button type="button" role="tab" class="bix-tab" id="bix-tab-' + esc(a.aim) + '" data-aim="' + esc(a.aim) + '" aria-selected="' + sel + '" aria-controls="bix-panel" tabindex="' + (sel ? 0 : -1) + '" title="' + esc(a['title_' + L] || a.title_en || '') + '">' + esc(T('aim') + ' ' + a.aim) + '</button>');
    });
    h.push('</div>');
    h.push('<div class="bix-panel" role="tabpanel" id="bix-panel" aria-labelledby="bix-tab-' + esc(S.aim) + '">');
    h.push('<p class="bix-aimtitle" id="bix-aimtitle"></p>');
    h.push('<details class="bix-filters"' + ((filtersOpen == null ? !narrow : filtersOpen) ? ' open' : '') + '><summary><span>' + esc(T('filters')) + '</span> <span class="bix-filters-on" hidden>· ' + esc(T('filtersOn')) + '</span></summary>');
    h.push('<div class="bix-frow"><span class="bix-flabel" id="bix-lv">' + esc(T('vendor')) + '</span><div class="bix-chips" role="group" aria-labelledby="bix-lv">');
    VENDOR_LIST.forEach(function (v) { h.push('<button type="button" class="bix-chip bix-excl" data-vendor="' + esc(v.id) + '" aria-pressed="true">' + glyphSvg(v.id) + '<span>' + esc(v.name) + '</span></button>'); });
    h.push('</div></div>');
    h.push('<div class="bix-frow"><span class="bix-flabel" id="bix-lt">' + esc(T('tier')) + '</span><div class="bix-chips" role="group" aria-labelledby="bix-lt">');
    TIER_LIST.forEach(function (t) {
      var nm = t === 'unknown' ? T('unknown') : t;
      var full = t === 'unknown' ? T('tierUnknown') : ((MODELS.filter(function (m) { return m.tier === t && m.tierName; })[0] || {}).tierName || t);
      h.push('<button type="button" class="bix-chip bix-excl" data-tier="' + esc(t) + '" aria-pressed="true" title="' + esc(full) + '" aria-label="' + esc(full) + '"><span>' + esc(nm) + '</span></button>');
    });
    h.push('</div></div>');
    // release date range
    h.push('<div class="bix-frow bix-daterow"><span class="bix-flabel" id="bix-ld">' + esc(T('release')) + '</span><div class="bix-date">');
    h.push('<output class="bix-dateout" id="bix-dateout" aria-live="polite"></output>');
    if (SPAN) {
      var span = Math.max(1, SPAN.max - SPAN.min);
      h.push('<div class="bix-range"><div class="bix-track"><div class="bix-sel"></div></div>');
      h.push('<input type="range" class="bix-from" min="' + SPAN.min + '" max="' + SPAN.max + '" step="1" value="' + S.from + '" aria-label="' + esc(T('from')) + '">');
      h.push('<input type="range" class="bix-to" min="' + SPAN.min + '" max="' + SPAN.max + '" step="1" value="' + S.to + '" aria-label="' + esc(T('to')) + '">');
      // tick buttons are laid out by renderTicks(): it needs the drawn width to merge releases that sit too close to tap apart
      h.push('</div><div class="bix-ticks" role="group" aria-label="' + esc(T('ticks')) + '"></div>');
    }
    var unk = MODELS.filter(function (m) { return dayOf(m.releaseDate) == null; });
    h.push('<div class="bix-chips"><button type="button" class="bix-chip bix-excl" data-toggle="unknown" aria-pressed="true"' + (unk.length ? ' title="' + esc(unk.map(function (m) { return m.name; }).join(', ')) + '"' : '') + '><span>' + esc(T('unknownDate')) + ' (' + (unk.length ? unk.length : esc(T('none'))) + ')</span></button>');
    h.push('<button type="button" class="bix-chip" data-toggle="current" aria-pressed="false"><span>' + esc(T('current')) + '</span></button></div>');
    h.push('</div></div>');
    h.push('</details>');
    h.push('<div class="bix-status"><span class="bix-count" id="bix-count" aria-live="polite"></span> <button type="button" class="bix-btn bix-reset">' + esc(T('reset')) + '</button></div>');
    h.push('<div class="bix-chart" id="bix-chart"><div class="bix-svgwrap"></div><div class="bix-tip" role="tooltip" id="bix-tip" hidden></div></div>');
    h.push('<p class="bix-legend-head" id="bix-lgh">' + esc(T('legend')) + '</p><ul class="bix-legend" aria-labelledby="bix-lgh"></ul>');
    h.push('<div class="bix-key">' + T('key').map(function (k) { return '<p>' + esc(k) + '</p>'; }).join('') + '<p class="bix-cond"><span class="bix-cond-text"></span> <a href="#limits">' + esc(T('limitsLink')) + '</a></p></div>');
    h.push('<details class="bix-notes" hidden><summary>' + esc(T('notesHead')) + '</summary><ul></ul></details>');
    h.push('<div class="bix-export" role="group" aria-label="' + esc(T('exportHead')) + '"><button type="button" class="bix-btn" data-export="svg">' + esc(T('dlSvg')) + '</button> <button type="button" class="bix-btn" data-export="png">' + esc(T('dlPng')) + '</button>');
    h.push('<label class="bix-opt">' + esc(T('scale')) + ' <select class="bix-scale"><option value="2"' + (EXPORT.scale === 2 ? ' selected' : '') + '>2×</option><option value="3"' + (EXPORT.scale === 3 ? ' selected' : '') + '>3×</option></select></label>');
    h.push('<label class="bix-opt"><input type="checkbox" class="bix-withlegend"' + (EXPORT.legend ? ' checked' : '') + '> ' + esc(T('withLegend')) + '</label></div>');
    h.push('<div class="bix-sr" id="bix-sr"></div>');
    h.push('</div></div>');
    mount.innerHTML = h.join('');
    ui = {
      root: mount.querySelector('.bix'), tabs: [].slice.call(mount.querySelectorAll('.bix-tab')), panel: mount.querySelector('#bix-panel'),
      aimTitle: mount.querySelector('#bix-aimtitle'), count: mount.querySelector('#bix-count'), filtersOn: mount.querySelector('.bix-filters-on'),
      from: mount.querySelector('.bix-from'), to: mount.querySelector('.bix-to'), sel: mount.querySelector('.bix-sel'), dateOut: mount.querySelector('#bix-dateout'),
      ticks: [], tickBox: mount.querySelector('.bix-ticks'), chart: mount.querySelector('#bix-chart'), svgWrap: mount.querySelector('.bix-svgwrap'),
      tip: mount.querySelector('#bix-tip'), legend: mount.querySelector('.bix-legend'), notes: mount.querySelector('.bix-notes'), sr: mount.querySelector('#bix-sr'),
      cond: mount.querySelector('.bix-cond-text'), details: mount.querySelector('.bix-filters'),
    };
    tickLayoutKey = null;
    wire();
    render();
    if (refocus) { var el = mount.querySelector(refocus); if (el) el.focus(); }
  }

  // ── release ticks: one button per cluster of releases that would sit closer than a 24 px tap target ──────
  var TICK_HIT = 24, tickLayoutKey = null;
  function tickClusters(width) {
    var byDay = {};
    MODELS.forEach(function (m) { var d = dayOf(m.releaseDate); if (d != null) (byDay[d] = byDay[d] || []).push(m.name); });
    var span = Math.max(1, SPAN.max - SPAN.min), out = [];
    Object.keys(byDay).map(Number).sort(function (a, b) { return a - b; }).forEach(function (d) {
      var px = ((d - SPAN.min) / span) * width, last = out[out.length - 1];
      if (last && px - last.px1 < TICK_HIT + 2) { last.days.push(d); last.px1 = px; }
      else out.push({ days: [d], px0: px, px1: px });
    });
    out.forEach(function (c) { c.names = c.days.map(function (d) { return { d: d, names: byDay[d] }; }); });
    return out;
  }
  function renderTicks() {
    if (!SPAN || !ui.tickBox) return;
    var width = ui.tickBox.clientWidth;
    if (!width) return;                                    // filters collapsed: laid out when the disclosure opens
    var key = width + '|' + lang();
    if (key !== tickLayoutKey) {
      tickLayoutKey = key;
      var had = ui.ticks.indexOf(document.activeElement) >= 0 ? +document.activeElement.dataset.day : null;
      var h = [];
      tickClusters(width).forEach(function (c, i) {
        var left = c.px0 - TICK_HIT / 2, w = c.px1 - c.px0 + TICK_HIT;
        var mid = (c.px0 + c.px1) / 2 / width;
        var edge = mid < 0.15 ? ' bix-edge-l' : mid > 0.85 ? ' bix-edge-r' : '';
        var lines = c.days.map(function (d) { return '<span class="bix-tick-line" data-line-day="' + d + '" style="left:' + ((((d - SPAN.min) / Math.max(1, SPAN.max - SPAN.min)) * width) - left - 1).toFixed(1) + 'px"></span>'; }).join('');
        var label = c.names.map(function (n) { return n.names.join(', ') + ' — ' + dateOf(n.d); }).join('; ');
        var tip = c.names.map(function (n) { return '<span>' + esc(n.names.join(', ') + ' · ' + dateOf(n.d)) + '</span>'; }).join('');
        h.push('<button type="button" class="bix-tick' + edge + '" data-day="' + c.days[0] + '" data-day-max="' + c.days[c.days.length - 1] + '" style="left:' + left.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px" tabindex="' + (i === 0 ? 0 : -1) + '" aria-label="' + esc(label) + '">' + lines + '<span class="bix-tick-tip" aria-hidden="true">' + tip + '</span></button>');
      });
      ui.tickBox.innerHTML = h.join('');
      ui.ticks = [].slice.call(ui.tickBox.querySelectorAll('.bix-tick'));
      if (had != null) {
        var t = ui.ticks.filter(function (b) { return had >= +b.dataset.day && had <= +b.dataset.dayMax; })[0];
        if (t) { ui.ticks.forEach(function (b) { b.tabIndex = b === t ? 0 : -1; }); t.focus(); }
      }
    }
    [].forEach.call(ui.tickBox.querySelectorAll('.bix-tick-line'), function (l) { var d = +l.dataset.lineDay; l.classList.toggle('bix-in', d >= S.from && d <= S.to); });
  }

  // ── render ─────────────────────────────────────────────────────────────────
  var lastView = null, lastPoints = [], focusKey = null;
  function render() {
    var t0 = (window.performance && performance.now()) || 0;
    var v = computeView(); lastView = v;
    ui.tabs.forEach(function (b) { var sel = +b.dataset.aim === S.aim; b.setAttribute('aria-selected', sel); b.tabIndex = sel ? 0 : -1; });
    ui.panel.setAttribute('aria-labelledby', 'bix-tab-' + S.aim);
    ui.aimTitle.textContent = aimText(v.aim) + (v.aim.hiddenTests ? ' · ' + T('hiddenTests', { n: v.aim.hiddenTests }) : '');
    [].forEach.call(mount.querySelectorAll('[data-vendor]'), function (b) { b.setAttribute('aria-pressed', S.vendors.indexOf(b.dataset.vendor) >= 0); });
    [].forEach.call(mount.querySelectorAll('[data-tier]'), function (b) { b.setAttribute('aria-pressed', S.tiers.indexOf(b.dataset.tier) >= 0); });
    mount.querySelector('[data-toggle="unknown"]').setAttribute('aria-pressed', S.unknown);
    mount.querySelector('[data-toggle="current"]').setAttribute('aria-pressed', S.current);
    if (SPAN) {
      ui.from.value = S.from; ui.to.value = S.to;
      ui.from.setAttribute('aria-valuetext', dateOf(S.from)); ui.to.setAttribute('aria-valuetext', dateOf(S.to));
      var span = Math.max(1, SPAN.max - SPAN.min);
      ui.sel.style.left = ((S.from - SPAN.min) / span) * 100 + '%'; ui.sel.style.right = (100 - ((S.to - SPAN.min) / span) * 100) + '%';
      ui.dateOut.textContent = dateOf(S.from) + ' – ' + dateOf(S.to);
      // when the handles meet, the one with room to move goes on top (both at the latest date → «from» must be grabbable)
      ui.from.classList.toggle('bix-top', (S.from - SPAN.min) > (SPAN.max - S.to));
      renderTicks();
    } else ui.dateOut.textContent = T('unknown');
    ui.cond.textContent = v.aim['conditions_' + lang()] || v.aim.conditions_en || T('conditions');
    var d = defaults(S.aim);
    ui.filtersOn.hidden = sameSet(S.vendors, d.vendors) && sameSet(S.tiers, d.tiers) && S.from === d.from && S.to === d.to && S.unknown && !S.current && !S.hidden.length;
    ui.count.textContent = countText(v);
    renderChart(v);
    renderLegend(v);
    renderNotes(v);
    renderTable(v);
    writeHash();
    API.lastRenderMs = ((window.performance && performance.now()) || 0) - t0;
  }

  function renderChart(v) {
    var w = Math.max(280, Math.floor(ui.chart.clientWidth || mount.clientWidth || 800));
    // phones: a taller plot gives ~20 model names room to sit by their own points instead of on leader lines
    var hgt = Math.round(w < 560 ? Math.max(460, Math.min(640, w * 1.75)) : Math.max(300, Math.min(600, w * 0.62)));
    var body = chartBody(v, { x: 0, y: 0, w: w, h: hgt }, 'screen');
    lastPoints = body.points;
    var keep = focusKey;
    ui.svgWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="bix-svg" viewBox="0 0 ' + w + ' ' + hgt + '" width="' + w + '" height="' + hgt + '" role="group" aria-label="' + esc(T('chartLabel', { aim: aimText(v.aim), count: countText(v) })) + '" font-family="' + esc(FONT) + '"><rect width="100%" height="100%" fill="' + P.bg + '"/>' + body.svg + '</svg>';
    hideTip();
    if (keep) {
      var p = lastPoints.filter(function (q) { return q.model + '|' + q.effort === keep; })[0];
      var all = ui.svgWrap.querySelectorAll('.bix-pt');
      if (p && all[p.k]) { [].forEach.call(all, function (g) { g.setAttribute('tabindex', '-1'); }); all[p.k].setAttribute('tabindex', '0'); if (document.activeElement === document.body || !document.activeElement || ui.svgWrap.contains(document.activeElement) || keepFocusOnPoint) { all[p.k].focus(); } }
    }
    keepFocusOnPoint = false;
  }
  var keepFocusOnPoint = false;

  function renderLegend(v) {
    var active = document.activeElement && document.activeElement.closest && document.activeElement.closest('.bix-lg');
    var focusModel = active && ui.legend.contains(active) ? active.dataset.model : null;
    var h = [];
    v.passing.forEach(function (m) {
      var shown = S.hidden.indexOf(m.id) < 0;
      var cells = v.byModel[m.id] || [];
      var n1 = cells.length && cells.every(function (c) { return c.n === 1; });
      var miss = cells.filter(function (c) { return !plottable(c); }).sort(function (a, b) { return effIdx(a.effort) - effIdx(b.effort); }).map(function (c) { return effLabel(c.effort); });
      var part = partialTags(cells);
      var tags = [HARNESS[m.harness] || m.harness || '', m.tierName || (m.tier ? m.tier : T('tierUnknown')), m.releaseDate ? T('released', { d: m.releaseDate }) : T('dateUnknown')];
      if (n1) tags.push('n=1');
      if (miss.length) tags.push(T('notReachedList', { list: miss.join(', ') }));
      if (part.length) tags.push(T('partialList', { list: part.join(', ') }));
      var col = lineColor(m), dash = n1 ? N1_DASH : m.dash;
      var sample = '<svg class="bix-sample" width="34" height="16" viewBox="0 0 34 16" aria-hidden="true" focusable="false"><line x1="1" y1="8" x2="33" y2="8" stroke="' + col + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="' + esc(dash) + '"' : '') + (n1 ? ' stroke-opacity="0.6"' : '') + '/><path d="' + BG.path(vendorOf(m), 5, 17, 8) + '" fill="' + col + '" stroke="' + col + '" stroke-width="1.4" stroke-linejoin="round"/></svg>';
      h.push('<li><button type="button" class="bix-lg" data-model="' + esc(m.id) + '" aria-pressed="' + shown + '"><span class="bix-lg-check" aria-hidden="true">' + (shown ? '✓' : '') + '</span>' + sample +
        '<span class="bix-lg-text"><span class="bix-lg-name"' + (shown ? ' style="color:' + textColor(m) + '"' : '') + '>' + esc(m.name) + '</span> <span class="bix-lg-meta">· ' + esc(tags.filter(Boolean).join(' · ')) + '</span></span></button></li>');
    });
    ui.legend.innerHTML = h.join('');
    if (focusModel) { var b = ui.legend.querySelector('[data-model="' + (window.CSS && CSS.escape ? CSS.escape(focusModel) : focusModel) + '"]'); if (b) b.focus(); }
  }

  // footnotes used by the visible cells: { key: ['Model Eff', ...] } in first-use order (screen notes and the export share it)
  function usedNotes(v) {
    var used = {};
    v.series.forEach(function (s) { s.cells.forEach(function (c) { (c.notes || []).forEach(function (k) { (used[k] = used[k] || []).push(s.m.name + ' ' + effLabel(c.effort)); }); }); });
    return used;
  }
  function partialTags(cells) {
    return cells.filter(function (c) { return plottable(c) && (c.notes || []).indexOf('partialCost') >= 0; }).sort(function (a, b) { return effIdx(a.effort) - effIdx(b.effort); }).map(function (c) { return effLabel(c.effort) + '*'; });
  }
  function renderNotes(v) {
    var used = usedNotes(v);
    var keys = Object.keys(used);
    ui.notes.hidden = !keys.length;
    ui.notes.querySelector('ul').innerHTML = keys.map(function (k) { return '<li><strong>' + esc(used[k].join(', ')) + '</strong> — ' + esc(footText(k)) + '</li>'; }).join('');
  }

  function renderTable(v) {
    var c = T('cols'), h = ['<table><caption>' + esc(T('tableCaption', { aim: aimText(v.aim), count: countText(v) })) + '</caption><thead><tr>' + c.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>'];
    v.series.forEach(function (s) {
      s.cells.forEach(function (cell) {
        var ok = plottable(cell);
        h.push('<tr><th scope="row">' + esc(s.m.name + (s.m.releaseDate ? '' : ' (' + T('dateUnknown') + ')') + (s.m.tier ? '' : ' (' + T('tierUnknown') + ')')) + '</th><td>' + esc(cell.effort) + '</td><td>' + esc(cell.n) + '</td><td>' + esc(cell.reached + '/' + cell.n) + '</td><td>' + esc(cell.oneShotAll ? T('yes') : T('no')) +
          '</td><td>' + esc(ok ? usd(cell[XK]) : T('notReached')) + '</td><td>' + esc(ok ? mins(cell[YK]) : T('notReached')) + '</td><td>' + esc(cellMark(cell)) + '</td><td>' + esc((cell.notes || []).map(footText).join(' ')) + '</td></tr>');
      });
    });
    if (!v.series.length) h.push('<tr><td colspan="9">' + esc(T('noModels')) + '</td></tr>');
    h.push('</tbody></table>');
    ui.sr.innerHTML = h.join('');
  }

  // ── tooltip ────────────────────────────────────────────────────────────────
  function showTip(k) {
    var p = lastPoints[k]; if (!p) return;
    var c = p.cell, m = p.m, mk = cellMark(c);
    var rows = [
      '<strong style="color:' + textColor(m) + '">' + esc(m.name) + '</strong> <span class="bix-tip-sub">' + esc([HARNESS[m.harness] || m.harness, m.tierName || T('tierUnknown')].filter(Boolean).join(' · ')) + '</span>',
      esc(T('effort')) + ': <b>' + esc(c.effort) + '</b> (' + esc(effLabel(c.effort)) + ')' + (mk ? ' ' + esc(mk) : ''),
      esc(T('runs') + ' n=' + c.n + ' · ' + T('reached') + ' ' + c.reached + '/' + c.n) + ' · ' + esc(T('oneShot')) + ': ' + esc(c.oneShotAll ? T('yes') : T('no')),
      esc(T('trustCost')) + ' <b>' + esc(usd(c[XK])) + '</b> · ' + esc(T('trustTime')) + ' <b>' + esc(mins(c[YK])) + '</b>',
      esc(T('meanCost')) + ' ' + esc(usd(c.meanCostUsd)) + ' · ' + esc(T('meanTime')) + ' ' + esc(mins(c.meanWallMin)),
    ];
    if (c.rec === 'star') rows.push(esc(T('recStar'))); else if (c.rec === 'hollow') rows.push(esc(T('recHollow')));
    if (c.rec && c.provisional) rows.push(esc(T('provisional')));
    (c.notes || []).forEach(function (k2) { rows.push('<span class="bix-tip-note">' + esc(footText(k2)) + '</span>'); });
    ui.tip.innerHTML = rows.map(function (r) { return '<div>' + r + '</div>'; }).join('');
    ui.tip.hidden = false;
    var svg = ui.svgWrap.querySelector('svg'), cw = ui.chart.clientWidth;
    var scale = svg ? svg.getBoundingClientRect().width / (+svg.getAttribute('width') || 1) : 1;
    var tw = ui.tip.offsetWidth, th = ui.tip.offsetHeight;
    var x = p.x * scale + 14, y = p.y * scale - th - 10;
    if (x + tw > cw) x = Math.max(0, p.x * scale - tw - 14);
    if (y < 0) y = p.y * scale + 14;
    ui.tip.style.left = Math.max(0, Math.min(x, cw - tw)) + 'px'; ui.tip.style.top = y + 'px';
  }
  function hideTip() { if (ui.tip) ui.tip.hidden = true; }

  // ── events ─────────────────────────────────────────────────────────────────
  var rafPending = false;
  function touch() { userTouched = true; if (rafPending) return; rafPending = true; (window.requestAnimationFrame || setTimeout)(function () { rafPending = false; render(); }); }
  function toggleIn(list, x) { var i = list.indexOf(x); if (i >= 0) list.splice(i, 1); else list.push(x); }

  function wire() {
    ui.root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !ui.root.contains(b)) return;
      if (b.classList.contains('bix-tab')) { selectAim(+b.dataset.aim); return; }
      if (b.dataset.vendor) { toggleIn(S.vendors, b.dataset.vendor); userTouched = true; render(); return; }
      if (b.dataset.tier) { toggleIn(S.tiers, b.dataset.tier); userTouched = true; render(); return; }
      if (b.dataset.toggle === 'unknown') { S.unknown = !S.unknown; userTouched = true; render(); return; }
      if (b.dataset.toggle === 'current') { S.current = !S.current; userTouched = true; render(); return; }
      if (b.classList.contains('bix-reset')) { resetFilters(); userTouched = true; render(); return; }
      if (b.classList.contains('bix-lg')) { toggleIn(S.hidden, b.dataset.model); userTouched = true; render(); return; }
      if (b.classList.contains('bix-tick')) { moveNearest(+b.dataset.day, +b.dataset.dayMax); return; }
      if (b.dataset.export === 'svg') { exportSvg(); return; }
      if (b.dataset.export === 'png') { exportPng(); return; }
    });
    // tabs: arrow keys move + activate
    mount.querySelector('.bix-tabs').addEventListener('keydown', function (e) {
      var i = ui.tabs.findIndex(function (t) { return t === document.activeElement; }); if (i < 0) return;
      var n = ui.tabs.length, j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (j < 0) return; e.preventDefault();
      selectAim(+ui.tabs[j].dataset.aim); ui.tabs[j].focus();
    });
    if (SPAN) {
      var onRange = function (which) {
        return function () {
          var a = +ui.from.value, b = +ui.to.value;
          if (which === 'from' && a > b) { a = b; ui.from.value = a; }
          if (which === 'to' && b < a) { b = a; ui.to.value = b; }
          S.from = a; S.to = b; touch();
        };
      };
      ui.from.addEventListener('input', onRange('from'));
      ui.to.addEventListener('input', onRange('to'));
      ui.details.addEventListener('toggle', function () { if (ui.details.open) renderTicks(); });
      ui.tickBox.addEventListener('keydown', function (e) {
        var i = ui.ticks.indexOf(document.activeElement); if (i < 0) return;
        var n = ui.ticks.length, j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? Math.min(n - 1, i + 1) : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? Math.max(0, i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
        if (j < 0) return; e.preventDefault();
        ui.ticks.forEach(function (t, k) { t.tabIndex = k === j ? 0 : -1; }); ui.ticks[j].focus();
      });
    }
    // chart points: hover + keyboard focus show the tooltip; arrow keys move between points
    ui.svgWrap.addEventListener('pointerover', function (e) { var g = e.target.closest && e.target.closest('.bix-pt'); if (g) showTip(+g.dataset.k); });
    ui.svgWrap.addEventListener('pointerout', function (e) { var g = e.target.closest && e.target.closest('.bix-pt'); if (g && !g.contains(e.relatedTarget) && document.activeElement !== g) hideTip(); });
    ui.svgWrap.addEventListener('focusin', function (e) { var g = e.target.closest && e.target.closest('.bix-pt'); if (g) { var p = lastPoints[+g.dataset.k]; focusKey = p ? p.model + '|' + p.effort : null; showTip(+g.dataset.k); } });
    ui.svgWrap.addEventListener('focusout', function () { setTimeout(function () { if (!ui.svgWrap.contains(document.activeElement)) { hideTip(); focusKey = null; } }, 0); });
    ui.svgWrap.addEventListener('keydown', function (e) {
      var g = e.target.closest && e.target.closest('.bix-pt'); if (!g) return;
      if (e.key === 'Escape') { hideTip(); return; }
      var p = lastPoints[+g.dataset.k]; if (!p) return;
      var nx = null;
      if (e.key === 'ArrowRight') nx = lastPoints.filter(function (q) { return q.si === p.si && q.ei === p.ei + 1; })[0];
      else if (e.key === 'ArrowLeft') nx = lastPoints.filter(function (q) { return q.si === p.si && q.ei === p.ei - 1; })[0];
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var dir = e.key === 'ArrowDown' ? 1 : -1, si = p.si + dir;
        while (!nx && lastPoints.some(function (q) { return dir > 0 ? q.si >= si : q.si <= si; })) {
          var row = lastPoints.filter(function (q) { return q.si === si; });
          if (row.length) nx = row[Math.min(p.ei, row.length - 1)];
          si += dir;
        }
      } else if (e.key === 'Home') nx = lastPoints[0];
      else if (e.key === 'End') nx = lastPoints[lastPoints.length - 1];
      if (!nx) return;
      e.preventDefault();
      var all = ui.svgWrap.querySelectorAll('.bix-pt');
      [].forEach.call(all, function (x) { x.setAttribute('tabindex', '-1'); });
      all[nx.k].setAttribute('tabindex', '0'); all[nx.k].focus();
    });
    mount.querySelector('.bix-scale').addEventListener('change', function (e) { EXPORT.scale = +e.target.value === 3 ? 3 : 2; });
    mount.querySelector('.bix-withlegend').addEventListener('change', function (e) { EXPORT.legend = !!e.target.checked; });
  }
  // a tick (or a cluster of close releases d..dMax) moves the nearest handle so the range takes the whole cluster in
  function moveNearest(d, dMax) {
    if (!SPAN) return;
    if (!(dMax >= d)) dMax = d;
    var mid = (d + dMax) / 2;
    if (Math.abs(mid - S.from) <= Math.abs(mid - S.to) && !(mid > S.to)) S.from = d; else S.to = dMax;
    if (S.from > S.to) { var t = S.from; S.from = S.to; S.to = t; }
    userTouched = true; render();
  }

  // ── export ─────────────────────────────────────────────────────────────────
  function filterSummary(v) {
    var d = defaults(S.aim), parts = [];
    parts.push(T('sumVendors') + ': ' + (sameSet(S.vendors, d.vendors) ? T('all') : (S.vendors.length ? VENDOR_LIST.filter(function (x) { return S.vendors.indexOf(x.id) >= 0; }).map(function (x) { return x.name; }).join(', ') : T('none'))));
    parts.push(T('sumTiers') + ': ' + (sameSet(S.tiers, d.tiers) ? T('all') : (S.tiers.length ? TIER_LIST.filter(function (t) { return S.tiers.indexOf(t) >= 0; }).map(function (t) { return t === 'unknown' ? T('unknown') : t; }).join(', ') : T('none'))));
    if (SPAN) parts.push(T('sumReleased', { a: dateOf(S.from), b: dateOf(S.to) }));
    parts.push(S.unknown ? T('sumUnknownIn') : T('sumUnknownOut'));
    if (S.current) parts.push(T('sumCurrent'));
    if (S.hidden.length) parts.push(T('sumHidden', { list: S.hidden.map(function (id) { return (MODEL[id] || { name: id }).name; }).join(', ') }));
    parts.push(countText(v));
    return parts.join(' · ');
  }
  function sourceUrl() {
    var og = document.querySelector('meta[property="og:url"]');
    var base = og ? og.getAttribute('content') : location.href.split('#')[0];
    return base + encodeHash();
  }
  function wrapText(text, maxW, size, weight) {
    var words = String(text).split(' '), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (cur && textW(t, size, weight) > maxW) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }
  function buildExportSvg() {
    readPalette();
    var v = computeView(), W = 1200, pad = 28, y = 0, out = [];
    var title = T('title') + ' · ' + aimText(v.aim) + (v.aim.hiddenTests ? ' · ' + T('hiddenTests', { n: v.aim.hiddenTests }) : '');
    out.push('<text x="' + pad + '" y="36" font-size="20" font-weight="700" fill="' + P.heading + '">' + esc(title) + '</text>');
    y = 52;
    var chartH = 660, body = chartBody(v, { x: pad - 8, y: y, w: W - 2 * pad + 8, h: chartH }, 'export');
    out.push(body.svg);
    y += chartH + 18;
    if (EXPORT.legend) {
      var colW = (W - 2 * pad) / 2, rows = [];
      v.series.forEach(function (s) {
        var miss = s.miss.map(function (c) { return effLabel(c.effort); });
        var meta = [HARNESS[s.m.harness] || s.m.harness || '', s.m.tierName || T('tierUnknown'), s.m.releaseDate || T('dateUnknown')];
        if (s.n1) meta.push('n=1');
        if (miss.length) meta.push(T('notReachedList', { list: miss.join(', ') }));
        var part = partialTags(s.cells);
        if (part.length) meta.push(T('partialList', { list: part.join(', ') }));
        rows.push({ s: s, meta: meta.filter(Boolean).join(' · ') });
      });
      rows.forEach(function (r, i) {
        var cx = pad + (i % 2) * colW, cy = y + Math.floor(i / 2) * 20, col = lineColor(r.s.m), dash = r.s.n1 ? N1_DASH : r.s.m.dash;
        out.push('<g data-legend-model="' + esc(r.s.m.id) + '"><line x1="' + cx + '" y1="' + (cy - 4) + '" x2="' + (cx + 26) + '" y2="' + (cy - 4) + '" stroke="' + col + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="' + esc(dash) + '"' : '') + (r.s.n1 ? ' stroke-opacity="0.6"' : '') + '/>' +
          '<path d="' + BG.path(vendorOf(r.s.m), 5, cx + 13, cy - 4) + '" fill="' + col + '" stroke="' + col + '" stroke-width="1.4"/>' +
          '<text x="' + (cx + 34) + '" y="' + cy + '" font-size="12.5" fill="' + textColor(r.s.m) + '" font-weight="600">' + esc(r.s.m.name) + '<tspan font-weight="400" fill="' + P.muted + '"> · ' + esc(r.meta) + '</tspan></text></g>');
      });
      y += Math.ceil(rows.length / 2) * 20 + 10;
      T('key').forEach(function (k) { wrapText(k, W - 2 * pad, 12).forEach(function (ln) { out.push('<text x="' + pad + '" y="' + y + '" font-size="12" fill="' + P.muted + '">' + esc(ln) + '</text>'); y += 16; }); });
      y += 6;
    }
    y = exportNotes(v, out, pad, W, y);
    out.push('<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" stroke="' + P.grid + '"/>');
    y += 20;
    var cap = [aimText(v.aim), filterSummary(v), T('snapshot', { s: D.snapshotAt || '?' }), T('source', { u: sourceUrl() })];
    cap.forEach(function (c, i) { wrapText(c, W - 2 * pad, 12.5, i === 0 ? 600 : 400).forEach(function (ln) { out.push('<text class="caption" x="' + pad + '" y="' + y + '" font-size="12.5"' + (i === 0 ? ' font-weight="600"' : '') + ' fill="' + (i === 0 ? P.heading : P.text) + '">' + esc(ln) + '</text>'); y += 17; }); });
    var H = Math.ceil(y + 14);
    var svg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="' + esc(FONT) + '" lang="' + lang() + '">' +
      '<title>' + esc(title) + '</title><desc>' + esc(filterSummary(v) + ' · ' + T('snapshot', { s: D.snapshotAt || '?' })) + '</desc>' +
      '<rect width="100%" height="100%" fill="' + P.bg + '"/>' + out.join('') + '</svg>\n';
    return { svg: svg, w: W, h: H };
  }
  // the image travels without the page: what qualifies its numbers (partial costs are lower bounds, run conditions) goes with it
  function exportNotes(v, out, pad, W, y) {
    var used = usedNotes(v), lines = [];
    lines.push((v.aim['conditions_' + lang()] || v.aim.conditions_en || T('conditions')) + ' — ' + T('seeLimits'));
    Object.keys(used).forEach(function (k) { lines.push(used[k].join(', ') + ' — ' + footText(k)); });
    if (Object.keys(used).indexOf('partialCost') >= 0) lines.push(T('partialMark'));
    out.push('<text class="notes-head" x="' + pad + '" y="' + y + '" font-size="12" font-weight="600" fill="' + P.heading + '">' + esc(T('notesExport')) + '</text>');
    y += 17;
    lines.forEach(function (t) { wrapText(t, W - 2 * pad, 11.5).forEach(function (ln) { out.push('<text class="note" x="' + pad + '" y="' + y + '" font-size="11.5" fill="' + P.muted + '">' + esc(ln) + '</text>'); y += 15; }); y += 2; });
    return y + 6;
  }
  function fileName(ext) {
    var day = String(D.snapshotAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    return 'superscalar-bench-aim' + S.aim + '-' + lang() + '-' + day + '.' + ext;
  }
  function save(blob, name) {
    var a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function exportSvg() { var e = buildExportSvg(); save(new Blob([e.svg], { type: 'image/svg+xml' }), fileName('svg')); }
  function exportPng() {
    var e = buildExportSvg(), scale = EXPORT.scale, url = URL.createObjectURL(new Blob([e.svg], { type: 'image/svg+xml' }));
    var img = new Image();
    img.onload = function () {
      var cv = document.createElement('canvas'); cv.width = e.w * scale; cv.height = e.h * scale;
      var ctx = cv.getContext('2d'); ctx.scale(scale, scale); ctx.drawImage(img, 0, 0, e.w, e.h);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) { if (b) save(b, fileName('png')); }, 'image/png');
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;
  }

  // ── boot ───────────────────────────────────────────────────────────────────
  var API = window.BenchChart = { ready: false, lastRenderMs: null, lastLabelMs: null };
  function fail() {
    mount.hidden = false;
    mount.innerHTML = '<p class="bix-notice" role="status" data-en="' + esc(STR.en.notice) + '" data-ko="' + esc(STR.ko.notice) + '">' + esc(T('notice')) + '</p>';
    API.failed = true;
  }
  function staticFigures() {
    return [].slice.call(document.querySelectorAll('figure.bench-fig img')).filter(function (i) { return /trust-cost-aim\d+\.png$/.test(i.getAttribute('src') || ''); }).map(function (i) { return i.closest('figure'); });
  }
  if (!BG || !BL || !window.fetch || !document.querySelector) { fail(); return; }
  fetch(mount.getAttribute('data-src') || 'assets/bench/bench-cells.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      prepare(json);
      S = defaults();
      var fromHash = decodeHash(location.hash);      // never throws; a malformed hash just keeps the defaults
      if (fromHash) S = fromHash;
      mount.hidden = false;
      build();
      staticFigures().forEach(function (f) { f.classList.add('bix-replaced'); });
      // the paragraph right above the mount describes the static figures' encoding (ladder marker etc.) — the chart's own key replaces it
      var prev = mount.previousElementSibling;
      if (prev && prev.tagName === 'P') prev.classList.add('bix-replaced');
      API.ready = true;
      // a shared #chart?… link names no element, so the browser stays at the top: bring the chart into view
      if (fromHash && mount.scrollIntoView) { try { mount.scrollIntoView({ block: 'start' }); } catch (e) { mount.scrollIntoView(); } }
      API.state = function () { return JSON.parse(JSON.stringify(S)); };
      API.exportSvg = function () { return buildExportSvg().svg; };
      API.view = function () { var v = computeView(); return { present: v.present.map(function (m) { return m.id; }), visible: v.visible.map(function (m) { return m.id; }), passing: v.passing.map(function (m) { return m.id; }) }; };
      // language and theme follow the page controls
      new MutationObserver(function (muts) {
        var relang = muts.some(function (m) { return m.attributeName === 'lang'; });
        if (relang) build(); else { readPalette(); render(); }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-theme'] });
      window.addEventListener('hashchange', function () { var st = decodeHash(location.hash); if (st) { S = st; render(); } });   // decodeHash never throws
      var lastW = ui.chart.clientWidth;
      var onResize = function () { renderTicks(); var w = ui.chart.clientWidth; if (w && w !== lastW) { lastW = w; renderChart(lastView || computeView()); } };
      if (window.ResizeObserver) new ResizeObserver(function () { (window.requestAnimationFrame || setTimeout)(onResize); }).observe(mount);
      else window.addEventListener('resize', onResize);
    })
    .catch(function (e) { if (window.console && console.info) console.info('bench chart: static figures kept (' + e.message + ')'); fail(); });
})();
