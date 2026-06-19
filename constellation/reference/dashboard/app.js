'use strict';
/* Constellation reference dashboard — vanilla DOM master copy (v2.2.0 design draft)
 * Part of EstreGenesis 2.2 (reference master copy).
 * Generalized from a private PM-board dashboard implementation.
 * The §2 A2A bridge interface (Constellation.md) is the only invariant; the rest may be re-skinned per stack.
 */
// Live 대시보드 v2 — state.json 을 SSE 로 받아 렌더. 피드백/우선순위조정은 POST /api/feedback (서버 로그 → 에이전트 검토).

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// URL 스킴 allowlist (XSS) — javascript:/data:text/html/vbscript: 등 실행 스킴 차단. http(s)/blob/mailto/data:image + 상대경로만 허용, 그 외 '#'. iframe src·window.open URL sink 에 적용.
const wsSafeUrl = (u) => { if (typeof u !== 'string') return '#'; const s = u.trim(); const m = s.match(/^([a-z][a-z0-9+.-]*):/i); if (m) { const sch = m[1].toLowerCase(); if (sch === 'http' || sch === 'https' || sch === 'blob' || sch === 'mailto') return s; if (sch === 'data' && /^data:image\//i.test(s)) return s; return '#'; } return s; };
// 인라인 비주얼 강조: [역할]·✓(완료)·→(변화)·커밋해시·버전 을 색/monospace 로.
const decoDetail = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<b class="em">$1</b>')
  .replace(/\[([^\]]{1,14})\]/g, '<span class="role">[$1]</span>')
  .replace(/✓/g, '<span class="ok">✓</span>')
  .replace(/→/g, '<span class="arr">→</span>')
  .replace(/\b([0-9a-f]{7})\b/g, '<code>$1</code>')
  .replace(/(?<![\w.])(v?\d+\.\d+\.\d+)(?![\w.])/g, '<code>$1</code>');
// 'label: body' → 라벨 강조 분리
const dsLabel = (b) => { const m = b.match(/^([^:：]{1,18})[:：]\s+(.+)$/s); return m ? { label: `<span class="lbl">${esc(m[1])}:</span> `, body: m[2] } : { label: '', body: b }; };
// 3개↑ 나열(·, /)은 칩, 아니면 인라인 비주얼
const dsBody = (body) => { const parts = body.split(/\s+·\s+|\s+\/\s+/).map(s => s.trim()).filter(Boolean); return parts.length >= 3 ? '<span class="chips">' + parts.map(p => `<span class="chip">${decoDetail(p)}</span>`).join('') + '</span>' : decoDetail(body); };
// done/planned detail — 문장(마침표/✓ 뒤) 단위 줄바꿈(▸), CSS columns 로 폭 넓으면 자동 2열(반응형).
function fmtDetail(text) {
  if (!text) return '';
  const blocks = String(text).split(/\s*\n\s*|(?<=\.)\s+(?=\S)/).map(s => s.trim()).filter(Boolean);
  return '<div class="ds ds-cols">' + blocks.map(b => { const { label, body } = dsLabel(b); return `<div class="ds-line">${label}${dsBody(body)}</div>`; }).join('') + '</div>';
}
// unblock(해제 단계)·피드백 note — 줄(\n) 단위 유지 + 비주얼(①②③ 자체 마커라 ▸ 없이 1열).
function fmtLines(text) {
  if (!text) return '';
  return '<div class="ds">' + String(text).split(/\s*\n\s*|(?<=\.)\s+(?=\S)/).map(l => l.trim()).filter(Boolean).map(l => { const { label, body } = dsLabel(l); return `<div class="ds-step">${label}${dsBody(body)}</div>`; }).join('') + '</div>';
}

const ui = {
  tab: 'dashboard',
  panes: ['dashboard'],       // 표시 중 탭들 (2개면 분할 뷰). boot 에서 복원
  splitFrac: 0.5,             // 분할 좌측 비율 (비율 모드)
  splitFixed: null,           // { side:'left'|'right', px } 고정폭 모드
  adhoc: [],                  // 예정작업 즉석 피드백 카드 [{plannedId, title, text, atts}]
  filter: new Set(),          // 비어있으면 전체. Ctrl+클릭으로 다중 선택
  open: new Set(),            // 펼친(고정) 카드 ids
  seenDefaults: new Set(),    // 기본 펼침을 이미 적용한 ids (사용자 토글 보존)
  prevIds: new Set(),         // 이전 렌더의 ids (신규 항목 진입 애니메이션용)
  atHome: true,               // 홈(중앙) 위치 유지 중인가 (사용자가 스크롤하면 false)
  tlCentered: true,           // 타임라인 가로: active stage 중앙 유지 중인가
  state: null,
  localOrder: null,           // 낙관적 planned 순서 (ids)
};
const DRAFT_KEY = (id) => `constellation-dash-draft:${id}`;
const NEAR = 3;               // 현재 작업 인접 N개 기본 펼침

// ---- data ----
function applyState(s) {
  ui.state = s;
  ui.localOrder = null;       // 새 state 오면 서버 순서 채택
  renderAll();
}
let _es = null;
function connect() {
  if (_es) { try { _es.close(); } catch {} }   // 중복 연결 방지
  const ev = _es = new EventSource('/api/events');
  ev.addEventListener('state', (e) => { try { applyState(JSON.parse(e.data)); setConn(true); } catch {} });
  ev.onopen = () => setConn(true);
  // 끊김 시: CLOSED(영구 끊김 — 서버 재시작 등)면 3초 후 재연결. CONNECTING(0)이면 EventSource 자동 재연결 중이라 둠.
  ev.onerror = () => { setConn(false); if (ev.readyState === EventSource.CLOSED) setTimeout(() => { if (_es === ev) connect(); }, 3000); };
}
// 백그라운드/슬립 후 탭 복귀 시 끊긴 SSE 를 즉시 재연결 (장시간 열어둔 탭 stale 방지)
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (!_es || _es.readyState === 2)) connect(); });
let _sseOk = false;
function setConn(ok) { _sseOk = ok; updateConnDisplay(); }
// conn 표시 = SSE 연결 + 에이전트 모니터 상태 결합
function updateConnDisplay() {
  const c = $('#conn'); if (!c) return;
  const monitor = (ui.state && ui.state.monitor) || 'idle';
  if (!_sseOk) { c.textContent = '○ 연결 끊김(재시도)'; c.className = 'conn off'; }
  else if (monitor === 'active') { c.textContent = '● 작업 중 · 모니터링'; c.className = 'conn active'; }      // 작업 진행 중 (녹색)
  else if (monitor === 'watching') { c.textContent = '● 피드백 대기 중'; c.className = 'conn watching'; }   // 무한 대기 (노랑)
  else { c.textContent = '○ 프롬프트 대기 중'; c.className = 'conn idle'; }                                   // 일단락 (회색)
  updateStandbyToggle();
}
function updateStandbyToggle() {
  const b = $('#standby-toggle'); if (!b) return;
  b.hidden = false;
  const standby = !!(ui.state && ui.state.standby);
  const monitor = (ui.state && ui.state.monitor) || 'idle';
  b.textContent = standby ? '⏸ 대기 종료' : '▶ 대기 시작';
  b.classList.toggle('on', standby);
  b.disabled = (monitor === 'idle');   // 일단락(에이전트 부재) → 비활성, 채팅으로만 재개
  b.title = monitor === 'idle' ? '대기 종료됨 — 채팅 프롬프트로 재개' : (standby ? '무한 대기 종료 (작업 끝나면 일단락)' : '무한 대기 시작');
}
function setupStandbyToggle() {
  const b = $('#standby-toggle'); if (!b) return;
  b.onclick = () => {
    if (b.disabled) return;
    const cur = !!(ui.state && ui.state.standby);
    postFeedback({ kind: 'mode', standby: !cur, at: new Date().toISOString() });
    if (ui.state) ui.state.standby = !cur;   // 낙관적 반영
    updateStandbyToggle();
  };
}
async function postFeedback(entry) {
  try { await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }); return true; }
  catch { return false; }
}

// ---- project / filter helpers ----
function projOf(id) { return (ui.state.projects || []).find(p => p.id === id); }
function projChip(id) { const p = projOf(id); return p ? `<span class="proj-chip" style="background:${esc(p.color)}">${esc(p.name)}</span>` : ''; }
function isAll() { return ui.filter.size === 0; }
function dimClass(projectId) { return (!isAll() && !ui.filter.has(projectId)) ? ' dim' : ''; }

// ---- open-state helpers ----
function applyDefaultOpen(id, shouldOpen) {
  if (ui.seenDefaults.has(id)) return;
  ui.seenDefaults.add(id);
  if (shouldOpen) ui.open.add(id); else ui.open.delete(id);
}
function toggleOpen(id, card) {
  if (ui.open.has(id)) { ui.open.delete(id); card.classList.remove('open'); }
  else { ui.open.add(id); card.classList.add('open'); }
}

// ---- render ----
function renderAll() {
  if (!ui.state) return;
  $('#updated').textContent = '갱신 ' + (ui.state.updatedAt ? new Date(ui.state.updatedAt).toLocaleString('ko-KR') : '');
  updateConnDisplay();   // monitor/standby 상태 반영

  renderFilters();
  renderDone();
  renderCurrent();
  renderPlanned();
  renderDecisions();
  renderFreeRequest();
  setCurHeight();   // 예정 섹션 헤더가 현재 밴드 아래에 고정되도록 높이 노출
  // 홈 위치 유지·초기 센터링은 setupHomeTracking 의 ResizeObserver 가 콘텐츠 크기 변화에 맞춰 처리
  ui.prevIds = collectIds();
}
function setCurHeight() {
  const cur = $('#current-anchor');
  if (cur) document.documentElement.style.setProperty('--cur-h', cur.offsetHeight + 'px');
}
window.addEventListener('resize', setCurHeight);
// 현재 작업 밴드를 화면 중앙으로 두는 scrollTop.
// 주의: #current-anchor 는 sticky 라 offsetTop 이 stuck 위치를 따라가 불안정 → 그 앞의 비-sticky
// 마커(#home-marker) offsetTop 으로 현재 밴드의 자연 위치를 안정적으로 측정한다.
function homeScrollTop() {
  const pane = $('#tab-dashboard'); const marker = $('#home-marker'); const cur = $('#current-anchor');
  if (!pane || !marker || !cur) return 0;
  return Math.max(0, marker.offsetTop - Math.max(0, (pane.clientHeight - cur.offsetHeight) / 2));
}
// 홈(중앙) 위치 부근인가
function isAtHome() {
  const pane = $('#tab-dashboard');
  return !pane || Math.abs(pane.scrollTop - homeScrollTop()) <= 6;
}
// 프로그램적 홈 스크롤 (lock 동안 scroll 리스너가 atHome 을 끄지 않게)
let _homeLock = false;
function applyHome(smooth) {
  const pane = $('#tab-dashboard'); if (!pane) return;
  _homeLock = true;
  pane.scrollTo({ top: homeScrollTop(), behavior: smooth ? 'smooth' : 'auto' });
  clearTimeout(applyHome._t);
  applyHome._t = setTimeout(() => { _homeLock = false; }, smooth ? 450 : 90);
}
function centerCurrent(smooth = true) { ui.atHome = true; applyHome(smooth); }   // 홈 버튼
// 콘텐츠 크기 변화(초기 정착·항목 추가 등)마다 홈이었으면 재적용, 사용자가 스크롤했으면 보존
function setupHomeTracking() {
  const pane = $('#tab-dashboard'); const flow = $('.flow');
  if (!pane) return;
  pane.addEventListener('scroll', () => { if (!_homeLock) ui.atHome = isAtHome(); }, { passive: true });
  if (flow && 'ResizeObserver' in window) new ResizeObserver(() => { if (ui.atHome) applyHome(false); }).observe(flow);
  // 현재 밴드(타임라인) 폭 변동 → active 재중앙 (분할 토글·분리선 드래그·창 변동 모두 커버)
  const cur = $('#current');
  if (cur && 'ResizeObserver' in window) new ResizeObserver(() => { if (ui.tlCentered && !_tlLock) centerActiveStage(false); }).observe(cur);
  window.addEventListener('resize', () => { if (ui.atHome) applyHome(false); if (ui.tlCentered) centerActiveStage(false); });
}

// ---- 타임라인 가로: active stage 중앙 (세로 home 과 같은 패턴) ----
let _tlLock = false;
function timelineCenterLeft(tl, act) {
  return Math.max(0, act.offsetLeft - Math.max(0, (tl.clientWidth - act.offsetWidth) / 2));   // .timeline position:relative → offsetLeft 안정
}
function centerActiveStage(smooth) {
  const tl = $('#current .timeline'); const act = tl && tl.querySelector('.stage.active');
  if (!tl || !act) return;
  _tlLock = true;
  tl.scrollTo({ left: timelineCenterLeft(tl, act), behavior: smooth ? 'smooth' : 'auto' });
  clearTimeout(centerActiveStage._t);
  centerActiveStage._t = setTimeout(() => { _tlLock = false; }, smooth ? 450 : 90);
}

// fixed 상단바 높이 → --topbar-h (메인 스크롤 영역을 그만큼 아래로 → 콘텐츠·스크롤바 안 가림)
function setupTopbar() {
  const tb = $('.topbar'); if (!tb) return;
  const m = () => {
    document.documentElement.style.setProperty('--topbar-h', tb.offsetHeight + 'px');
    if (ui.atHome) applyHome(false);   // 상단바 높이 변동(모바일 줄바꿈 등) 시 홈 재정렬
  };
  m();
  if ('ResizeObserver' in window) new ResizeObserver(m).observe(tb);
}
function collectIds() {
  const ids = new Set();
  (ui.state.done || []).forEach((_, i) => ids.add('done-' + i));
  (ui.state.planned || []).forEach(p => ids.add(p.id));
  return ids;
}
function isNew(id) { return ui.prevIds.size > 0 && !ui.prevIds.has(id); }

function renderFilters() {
  const box = $('#filters'); box.innerHTML = '';
  const allBtn = el('button', 'fbtn' + (isAll() ? ' active' : ''), '전체');
  allBtn.onclick = () => { ui.filter.clear(); renderAll(); };
  box.append(allBtn);
  (ui.state.projects || []).forEach(p => {
    const on = ui.filter.has(p.id);
    const b = el('button', 'fbtn' + (on ? ' active' : ''));
    b.style.color = on && p.color ? p.color : '';
    b.innerHTML = `<span class="swatch" style="background:${esc(p.color)}"></span>` + esc(p.name);
    b.onclick = (e) => {
      if (e.ctrlKey || e.metaKey) {              // 다중 토글
        if (ui.filter.has(p.id)) ui.filter.delete(p.id); else ui.filter.add(p.id);
      } else {                                    // 단일 선택 (다시 누르면 전체)
        if (ui.filter.size === 1 && ui.filter.has(p.id)) ui.filter.clear();
        else { ui.filter.clear(); ui.filter.add(p.id); }
      }
      renderAll();
    };
    box.append(b);
  });
  requestAnimationFrame(layoutTopbar);
}
// 필터 가로 스크롤 인디케이터 — 좌/우 더 있으면 ‹ › 표시, 클릭 시 페이지 단위 스무스 스크롤
function updateFilterNav() {
  const f = $('#filters'); if (!f) return;
  const max = f.scrollWidth - f.clientWidth;
  const l = $('.fnav-l'), r = $('.fnav-r');
  if (l) l.hidden = f.scrollLeft <= 1;
  if (r) r.hidden = f.scrollLeft >= max - 1;
}
function setupFilterNav() {
  const f = $('#filters'), l = $('.fnav-l'), r = $('.fnav-r');
  if (!f) return;
  const page = (dir) => f.scrollBy({ left: dir * Math.max(120, f.clientWidth * 0.8), behavior: 'smooth' });
  if (l) l.onclick = () => page(-1);
  if (r) r.onclick = () => page(1);
  f.addEventListener('scroll', updateFilterNav, { passive: true });
  window.addEventListener('resize', layoutTopbar);
}
// 상단바 단계 줄내림 — 형제 폭 측정 (필터 가용<360 → 필터 둘째줄 / 첫줄 넘침 → 탭 둘째줄 / 탭+필터 같은 줄 가능하면 합침)
function layoutTopbar() {
  const tb = $('.topbar'); if (!tb) return;
  const brand = tb.querySelector('.brand'), tabs = tb.querySelector('.tabs'),
        status = tb.querySelector('.status'), theme = $('#theme-btn');
  if (!brand || !tabs) return;
  tb.classList.remove('filters-stacked', 'tabs-stacked', 'tabs-filters-row');   // reset 후 자연폭 측정
  const cs = getComputedStyle(tb);
  const gap = parseFloat(cs.columnGap) || 16;
  const W = tb.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
  // tabs 는 grow(flex:1)라 scrollWidth/offsetWidth 가 늘어난 폭 → 버튼 합으로 자연폭 측정
  const tabBtns = [...tabs.querySelectorAll('.tab')];
  const tabsGap = parseFloat(getComputedStyle(tabs).columnGap) || 6;
  const wB = brand.offsetWidth;
  const wT = tabBtns.reduce((s, b) => s + b.offsetWidth, 0) + Math.max(0, tabBtns.length - 1) * tabsGap;
  const wS = status ? status.offsetWidth : 0, wTh = theme ? theme.offsetWidth : 0;
  // 1) 필터 자리(W − 나머지) ≥ 360 → 전부 한 줄
  if (W - (wB + wT + wS + wTh + gap * 4) >= 360) { requestAnimationFrame(updateFilterNav); return; }
  // 2) 필터 둘째 줄
  tb.classList.add('filters-stacked');
  if (wB + wT + wS + wTh + gap * 3 <= W) { requestAnimationFrame(updateFilterNav); return; }   // 첫줄(필터 제외) 들어감 → 탭 첫줄 유지
  // 3) 탭도 둘째 줄. 둘째 줄에 탭+필터(360) 들어가면 같은 줄로 합침
  tb.classList.add('tabs-stacked');
  if (wT + 360 + gap <= W) tb.classList.add('tabs-filters-row');
  requestAnimationFrame(updateFilterNav);
}

function cardEl(id, projectId, titleHtml, metaHtml, detailHtml, extra) {
  const p = projOf(projectId);
  const expandable = !!(detailHtml && String(detailHtml).trim());
  const c = el('div', 'card'
    + (expandable && ui.open.has(id) ? ' open' : '')
    + (expandable ? ' expandable' : '')
    + (isNew(id) ? ' enter' : '')
    + dimClass(projectId) + (extra || ''));
  if (p) c.style.setProperty('--proj', p.color);
  c.dataset.id = id; c.dataset.project = projectId || '';
  const expBtn = expandable ? `<button class="exp" type="button" tabindex="-1" aria-label="상세 토글"><span class="chev"></span></button>` : '';
  c.innerHTML = `${expBtn}<div class="body"><div class="row">${titleHtml}${metaHtml || ''}</div>`
    + (expandable ? `<div class="detail">${detailHtml}</div>` : '') + `</div>`;
  if (expandable) {
    c.querySelector('.row').addEventListener('click', (e) => { if (e.target.closest('button')) return; toggleOpen(id, c); });
    c.querySelector('.exp').addEventListener('click', (e) => { e.stopPropagation(); toggleOpen(id, c); });
  }
  return c;
}

function renderDone() {
  const box = $('#done'); box.innerHTML = '';
  // done 은 최신순. 화면은 오래된 것 위 → 최신 아래(현재 인접). 인접 NEAR 개 기본 펼침.
  const items = (ui.state.done || []).map((d, i) => ({ d, i })).reverse();
  items.forEach(({ d, i }, pos) => {
    const id = 'done-' + i;
    applyDefaultOpen(id, pos >= items.length - NEAR);
    const when = d.at ? new Date(d.at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : (d.when || '');
    const c = cardEl(id, d.project,
      `<span class="title">${esc(d.title)}</span>`,
      `${projChip(d.project)}<span class="when">${esc(when)}</span>`,
      `${fmtDetail(d.detail)}${d.ref ? `<div class="ds-ref"><span class="ref">${esc(d.ref)}</span></div>` : ''}${attChips('done-' + i, d.att)}`);
    const fb = el('button', 'pln-fb', '💬 피드백'); fb.title = '이 완료 항목에 피드백 — 검토사안에 입력 카드 추가';
    fb.onclick = (e) => { e.stopPropagation(); openContextFeedback('done', id, d.title); };
    c.querySelector('.row').append(fb);
    box.append(c);
  });
  if (!box.children.length) box.innerHTML = '<div class="empty">완료 항목 없음</div>';
}

// current = 단일 객체(하위호환) / 배열(여러 작업 동시) — 상위 작업은 상하 구분, 같은 상위의 하위는 수평 분리.
// 상위 진행 블로커가 하위 항목이면(blockedBy = 하위 index/id) 시각 연결(⛔·연결선) 표시.
function renderCurrent() {
  const cur = ui.state.current; const box = $('#current'); box.innerHTML = '';
  const items = Array.isArray(cur) ? cur : (cur ? [cur] : []);   // 멀티(배열) / 단일(객체) / 없음
  if (!items.length) { box.innerHTML = '<div class="empty">현재 작업 없음</div>'; return; }
  const single = items.length === 1 && !(items[0].sub && items[0].sub.length);   // 단일·하위없음 = 기존 중앙정렬 경로
  let firstTl = null;
  items.forEach((top, ti) => {
    if (ti > 0) box.append(el('div', 'cur-sep'));                 // 상위 작업 간 상하 구분선
    // blockedBy 가 실제 하위와 매칭될 때만 has-blocker (범위초과 → dangling 연결선 방지, codex P2 검증)
    const subMatched = !!(top.sub && top.sub.some((s, si) => top.blockedBy === si || (s.id != null && top.blockedBy === s.id)));
    const card = el('div', 'cur-top' + (subMatched ? ' has-blocker' : ''));
    const ct = el('div', 'ctitle', `${projChip(top.project)} ${esc(top.title)} ${top.ref ? `<span class="ref">${esc(top.ref)}</span>` : ''}`);
    const cfb = el('button', 'pln-fb ctx-fb', '💬 피드백'); cfb.title = '이 작업에 피드백 — 검토사안에 입력 카드 추가';
    cfb.onclick = () => openContextFeedback('current', 'current-' + ti, top.title);
    ct.append(cfb); card.append(ct);
    if (top.att && top.att.length) card.insertAdjacentHTML('beforeend', attChips('current-' + ti, top.att));
    const tl = el('div', 'timeline');
    (top.stages || []).forEach(s => {
      const st = el('div', 'stage ' + (s.status || 'pending'));
      st.innerHTML = `<div class="slabel">${esc(s.label)}</div><div class="sstat">${esc(s.status || 'pending')}</div>`;
      tl.append(st);
    });
    card.append(tl);
    if (ti === 0) firstTl = tl;
    // 하위 작업 — 같은 상위 내 수평 분리
    if (top.sub && top.sub.length) {
      const row = el('div', 'cur-sub-row');
      top.sub.forEach((sub, si) => {
        const blocks = (top.blockedBy === si || (sub.id != null && top.blockedBy === sub.id));
        const sc = el('div', 'cur-sub' + (blocks ? ' blocker' : ''));
        sc.innerHTML = `<div class="sub-title">${blocks ? '⛔ ' : ''}${projChip(sub.project || top.project)} ${esc(sub.title)}</div>`;
        if (sub.stages && sub.stages.length) {
          const stl = el('div', 'timeline mini');
          sub.stages.forEach(s => { const st = el('div', 'stage ' + (s.status || 'pending')); st.innerHTML = `<div class="slabel">${esc(s.label)}</div>`; stl.append(st); });
          sc.append(stl);
        }
        row.append(sc);
      });
      card.append(row);
    }
    box.append(card);
  });
  // 가로 타임라인 중앙 추적은 단일 상위(하위 없음)일 때만 (멀티는 카드별 독립이라 생략)
  if (single && firstTl) {
    firstTl.addEventListener('wheel', (e) => { if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) ui.tlCentered = false; }, { passive: true });
    firstTl.addEventListener('touchmove', () => { ui.tlCentered = false; }, { passive: true });
    const activeLabel = (items[0].stages || []).find(s => (s.status || '') === 'active')?.label || null;
    const activeChanged = activeLabel !== ui._prevActive;
    ui._prevActive = activeLabel;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (activeChanged) { ui.tlCentered = true; centerActiveStage(true); }
      else if (ui.tlCentered) centerActiveStage(false);
    }));
  }
}

function plannedOrdered() {
  const list = (ui.state.planned || []).slice();
  if (ui.localOrder) list.sort((a, b) => ui.localOrder.indexOf(a.id) - ui.localOrder.indexOf(b.id));
  else list.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  return list;
}
function renderPlanned() {
  const box = $('#planned'); box.innerHTML = '';
  const list = plannedOrdered();
  list.forEach((p, idx) => {
    applyDefaultOpen(p.id, idx < NEAR);   // 최우선(상단=현재 인접) 기본 펼침
    const title = `<span class="prio">${idx + 1}</span><span class="title">${esc(p.title)}</span>`;
    // blocked 아니면 진행 가능 → 진행 버튼 항상 표시. waiting(자율 대기)는 대기↔진행 호버 swap, 그 외는 바로 진행.
    const proceed = p.blocked ? '' : (p.waiting
      ? '<button class="badge-wait" type="button" title="자율 대기 중 — 클릭하면 진행"><span class="wlbl">⏸ 대기</span><span class="glbl">▶ 진행</span></button>'
      : '<button class="badge-wait go" type="button" title="진행 가능 — 클릭하면 착수">▶ 진행</button>');
    const meta = `${projChip(p.project)}${p.blocked ? '<span class="badge-blocked">blocked</span>' : proceed}`;
    const unblockHtml = p.blocked && p.unblock ? `<div class="unblock"><b>🔧 해제하려면</b>${fmtLines(p.unblock)}</div>` : '';
    const c = cardEl(p.id, p.project, title, meta, unblockHtml + fmtDetail(p.detail) + attChips('planned-' + p.id, p.att));
    // blocked 사유는 제목 줄이 좁아지지 않게 제목 바로 아래 별도 줄로 (▲▼ 덕에 세로 여유 있음)
    if (p.blocked && p.blockReason) c.querySelector('.row').insertAdjacentElement('afterend', el('div', 'block-reason-row', `🔒 ${esc(p.blockReason)}`));
    const wb = c.querySelector('.badge-wait');
    if (wb) wb.onclick = (e) => {
      e.stopPropagation();
      if (p.proceedNote) openContextFeedback('planned', p.id, p.title, p.proceedNote);   // 추가 입력 필요 → 설명 포함 피드백 카드
      else proceedPlanned(p.id, p.title, wb);                                            // 바로 진행 신호
    };
    // reorder controls
    const rc = el('div', 'reorder');
    const up = el('button', null, '▲'); up.title = '위로'; up.onclick = (e) => { e.stopPropagation(); move(p.id, -1); };
    const dn = el('button', null, '▼'); dn.title = '아래로'; dn.onclick = (e) => { e.stopPropagation(); move(p.id, +1); };
    rc.append(up, dn);
    const fb = el('button', 'pln-fb', p.blocked ? '🔓 블록 해제 피드백' : '💬 피드백');
    fb.title = p.blocked ? '블록 사유 확인 + 해제 상황 피드백' : '이 예정 작업에 피드백 — 검토사안에 입력 카드 추가';
    fb.onclick = (e) => {
      e.stopPropagation();
      const note = p.blocked
        ? `🔒 블록 사유: ${p.blockReason || ''}\n\n🔧 해제하려면:\n${p.unblock || ''}\n\n이 단계가 끝났거나 해제할 상황이면 알려주세요 — 진행하겠습니다.`
        : null;
      openContextFeedback('planned', p.id, p.title, note);
    };
    c.querySelector('.row').append(fb, rc);   // 피드백 버튼을 우선순위(▲▼) 왼쪽에
    // drag
    c.draggable = true;
    c.addEventListener('dragstart', () => { c.classList.add('dragging'); ui._drag = p.id; });
    c.addEventListener('dragend', () => c.classList.remove('dragging'));
    c.addEventListener('dragover', (e) => e.preventDefault());
    c.addEventListener('drop', (e) => { e.preventDefault(); dropOn(p.id); });
    box.append(c);
  });
  if (!box.children.length) box.innerHTML = '<div class="empty">예정 항목 없음</div>';
}
function currentOrderIds() { return plannedOrdered().map(p => p.id); }
function move(id, delta) {
  const ids = currentOrderIds(); const i = ids.indexOf(id); const j = i + delta;
  if (j < 0 || j >= ids.length) return;
  ids.splice(j, 0, ids.splice(i, 1)[0]);
  commitOrder(ids);
}
function dropOn(targetId) {
  const ids = currentOrderIds(); const from = ids.indexOf(ui._drag); const to = ids.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return;
  ids.splice(to, 0, ids.splice(from, 1)[0]);
  commitOrder(ids);
}
function commitOrder(ids) {
  ui.localOrder = ids; renderPlanned();
  postFeedback({ kind: 'reorder', tab: 'planned', order: ids, at: new Date().toISOString() });
}

// ---- decisions ----
const decisionAtts = {};   // 결정별 첨부 (메모리 — 비영속, 전송 시 동봉)
function decisionDraft(d) { const raw = localStorage.getItem(DRAFT_KEY(d.id)); return raw ? JSON.parse(raw) : {}; }
// 검토 반영 후 입력 비우기 — 단 작성 중(포커스)이거나 검토 시점 내용과 현재 입력이 다르면 보존
// 이미 전송+처리(reviewedText)된 부분만 제거하고 그 뒤 추가/변동분은 보존.
// 전체 일치 → 전부 비움. 처리분이 입력 앞부분(prefix)이면 그만큼만 제거(나머지=새 미전송 내용).
// prefix 가 아니면(중간 수정 등) 안전하게 보존. _removed = 제거 길이(커서 보정용). 포커스 무관 적용.
function clearedIfReviewed(d, draft, isFocused) {
  if (!d.reviewedAt || !draft || !draft.submittedAt) return draft;   // 처리 기준(전송됨+reviewedAt) 없으면 그대로
  const rt = (d.reviewedText || ''), txt = (draft.text || '');
  const sameChoice = (draft.choice || null) === (d.reviewedChoice || null);
  if (txt === rt && sameChoice) {                                    // 전체 처리됨 → 비움
    if (!isFocused) localStorage.removeItem(DRAFT_KEY(d.id));
    return isFocused ? { text: '', _removed: txt.length } : {};
  }
  if (rt && txt.startsWith(rt)) {                                    // 처리분이 앞부분 → 제거, 나머지 보존
    const rest = txt.slice(rt.length).replace(/^\s*\r?\n/, '');      // 경계 개행 1개 정리
    const nd = { text: rest, choice: draft.choice, _removed: txt.length - rest.length };   // submittedAt 제거(나머지=미전송 새 내용)
    if (!isFocused) saveDraft(d.id, { text: rest, choice: draft.choice });
    return nd;
  }
  return draft;                                                      // prefix 아님 → 보존
}
// ---- tier-1 알림 (#3a — 설정 + 항목별 토글; 연결중 showNotification) ----
const WS_NOTIF_KEY = 'constellation-notif-prefs';
let wsNotifPrefs = (() => { const d = { master: false, decision: true, a2a: true, abort: true }; try { return Object.assign(d, JSON.parse(localStorage.getItem(WS_NOTIF_KEY) || '{}')); } catch { return d; } })();
let wsNotifSeenDec = null;   // null=미초기화(첫 렌더 알림 억제 — 기존 검토요청에 안 울림)
function wsSaveNotifPrefs() { try { localStorage.setItem(WS_NOTIF_KEY, JSON.stringify(wsNotifPrefs)); } catch {} }
function wsNotify(kind, title, body) {
  if (!wsNotifPrefs.master || !wsNotifPrefs[kind]) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try { const n = new Notification(title, { body: (body || '').slice(0, 140), icon: '/icon-192.png', tag: 'constellation-' + kind }); n.onclick = () => { try { window.focus(); } catch {} n.close(); }; } catch {}
}
function wsNotifHint() {
  const h = $('#notif-hint'); if (!h) return;
  if (typeof Notification === 'undefined') { h.textContent = '이 브라우저는 알림 미지원'; return; }
  if (!wsNotifPrefs.master) { h.textContent = '알림 꺼짐'; return; }
  h.textContent = Notification.permission === 'granted' ? '✓ 알림 켜짐' : (Notification.permission === 'denied' ? '브라우저에서 차단됨 (사이트 설정에서 허용)' : '권한 대기 중');
}
function setupWsNotif() {
  const btn = $('#ws-notif-btn'), panel = $('#ws-notif-panel');
  const cbs = { master: $('#notif-master'), decision: $('#notif-decision'), a2a: $('#notif-a2a'), abort: $('#notif-abort') };
  if (!btn || !panel) return;
  for (const k in cbs) if (cbs[k]) cbs[k].checked = !!wsNotifPrefs[k];
  wsNotifHint();
  btn.onclick = (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; if (!panel.hidden) wsNotifHint(); };
  document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('.ws-notif-wrap')) panel.hidden = true; });
  if (cbs.master) cbs.master.onchange = () => {
    wsNotifPrefs.master = cbs.master.checked; wsSaveNotifPrefs();
    if (wsNotifPrefs.master && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().then(() => wsNotifHint());
    else wsNotifHint();
  };
  for (const k of ['decision', 'a2a', 'abort']) if (cbs[k]) cbs[k].onchange = () => { wsNotifPrefs[k] = cbs[k].checked; wsSaveNotifPrefs(); };
}

function renderDecisions() {
  const box = $('#decisions');
  // 재렌더가 입력을 방해하지 않도록 포커스/캐럿 보존 (decision did 또는 ad-hoc plannedId)
  const active = document.activeElement;
  const fc = (active && active.tagName === 'TEXTAREA') ? active.closest('.dcard') : null;
  const focusKey = fc ? (fc.dataset.did ? 'did:' + fc.dataset.did : (fc.dataset.adhoc ? 'adhoc:' + fc.dataset.adhoc : null)) : null;
  const focusedDid = (fc && fc.dataset.did) || null;
  const caret = focusKey ? [active.selectionStart, active.selectionEnd] : null;
  let focusedRemoved = 0;   // 포커스 카드에서 처리완료분 제거 길이(커서 보정)

  box.innerHTML = '';
  ui.adhoc.forEach(item => box.append(buildAdhocCard(item)));   // 예정작업 즉석 피드백 카드 (최상단)
  const list = (ui.state.decisions || []).slice().sort((a, b) => (a.priority || 99) - (b.priority || 99));
  try {   // tier-1 알림: 신규 미해결 검토요청 (#3a) — 첫 렌더는 억제, 이후 새 id 만
    const _unres = list.filter(d => d.status !== 'resolved');
    if (wsNotifSeenDec) { for (const d of _unres) if (!wsNotifSeenDec.has(d.id)) wsNotify('decision', '검토요청: ' + (d.title || d.id), d.detail || ''); }
    wsNotifSeenDec = new Set(_unres.map(d => d.id));
  } catch {}
  { const _decCount = list.filter(d => d.status !== 'resolved').length + ui.adhoc.length; const _decBadge = $('#decisions-badge'); if (_decBadge) { _decBadge.textContent = _decCount; _decBadge.hidden = (_decCount === 0); } }   // 검토사안 0이면 뱃지만 숨김(탭 유지) — EstreUF parity

  const buildCard = (d) => {
    const draft = clearedIfReviewed(d, decisionDraft(d), focusedDid === d.id);
    if (focusedDid === d.id) focusedRemoved = draft._removed || 0;
    const card = el('div', 'dcard' + dimClass(d.project));
    card.dataset.did = d.id;
    const reviewed = d.reviewedAt ? `<span class="dreviewed-at" data-at="${esc(d.reviewedAt)}">${esc(fmtDateTime(d.reviewedAt))} <span class="rel">(${esc(relTime(d.reviewedAt))})</span></span><span class="dreviewed" title="검토 시점 ${esc(new Date(d.reviewedAt).toLocaleString('ko-KR'))}">✓ 최근 피드백 반영됨</span>` : '';
    // detail = 텍스트 필드 → esc (done/planned 의 detail 과 동일 정책; 검토사안만 raw 였던
    // 비대칭 해소). 의도적 시각화는 previewHtml/previewUrl 슬롯으로 분리 — operator-작성
    // viz 채널이라 raw 유지하되, 검토사안 등재 권한 자체가 신뢰 경계.
    card.innerHTML = `<div class="row"><span class="q">${esc(d.question)}</span> ${projChip(d.project)}${reviewed}</div>
      <div class="ddetail">${esc(d.detail || '').replace(/\n/g, '<br>')}</div>
      ${d.status !== 'resolved' ? `<button type="button" class="dfallback" title="이 브리핑을 한 단계 더 쉬운 말로 다시 써달라고 요청해요">${esc((d.fallback && d.fallback.label) || '🙋 더 쉽게 설명해줘')}</button>` : ''}
      ${d.previewUrl ? `<iframe src="${esc(wsSafeUrl(d.previewUrl))}" sandbox loading="lazy"></iframe>` : ''}
      ${d.previewHtml ? `<div class="dviz">${d.previewHtml}</div>` : ''}${attChips('decision-' + d.id, d.att)}`;
    const fbBtn = card.querySelector('.dfallback');
    if (fbBtn) fbBtn.onclick = async () => {
      fbBtn.disabled = true;
      const ok = await postFeedback({ kind: 'fallback-rerender', id: d.id, question: d.question || d.title || '', label: fbBtn.textContent, at: new Date().toISOString() });
      fbBtn.textContent = ok ? '요청 전송됨 — 더 쉬운 설명으로 갱신 예정' : '전송 실패 — 잠시 후 다시';
      if (!ok) fbBtn.disabled = false;
    };
    if (d.kind === 'choice') {
      const ch = el('div', 'choices');
      (d.options || []).forEach(opt => {
        const b = el('button', 'choice' + (draft.choice === opt ? ' picked' : ''), esc(opt));
        b.onclick = () => { draft.choice = opt; saveDraft(d.id, draft); renderDecisions(); };
        ch.append(b);
      });
      card.append(ch);
    }
    const ta = el('textarea'); ta.placeholder = '메모/입력 (선택) · 이미지·파일 붙여넣기/드롭 가능'; ta.value = draft.text || '';
    ta.addEventListener('input', () => { draft.text = ta.value; saveDraft(d.id, draft); });
    card.append(ta);
    const attList = el('div', 'att-list'); attList.hidden = true; card.append(attList);
    const fileInput = el('input'); fileInput.type = 'file'; fileInput.multiple = true; fileInput.hidden = true; card.append(fileInput);
    const atts = decisionAtts[d.id] || (decisionAtts[d.id] = []);
    const bar = el('div', 'dsubmit');
    const btn = el('button', null, draft.submittedAt ? '다시 전송' : '피드백 전송');
    const attBtn = el('button', 'attach-btn', '📎 첨부'); attBtn.type = 'button';
    btn.onclick = async () => {
      const n = atts.length;
      const ok = await postFeedback({ kind: 'decision', id: d.id, question: d.question, choice: draft.choice || null, text: draft.text || '', atts: atts.slice(), at: new Date().toISOString() });
      draft.submittedAt = new Date().toISOString(); saveDraft(d.id, draft);
      if (ok) atts.length = 0;
      renderDecisions();
      bar.querySelector('.saved').textContent = ok ? `전송됨${n ? ` (첨부 ${n})` : ''} — 검토 전까지 수정 가능` : '전송 실패(재시도)';
    };
    attachable({ dropEl: card, textarea: ta, fileBtn: attBtn, fileInput, listEl: attList, atts, persist: () => {} });
    autoGrow(ta);
    onCtrlEnter(ta, () => btn.click());
    const saved = el('span', 'saved', draft.submittedAt
      ? `전송됨 ${new Date(draft.submittedAt).toLocaleString('ko-KR')} — 검토 전까지 수정 가능`
      : (d.reviewedAt && !draft.text && !draft.choice ? '↑ 이전 피드백 반영됨 · 새 입력 가능' : (draft.choice || draft.text ? '초안 저장됨(미전송)' : '')));
    bar.append(btn, attBtn, saved);
    // 권고/권장이 정해진 사안 → 맨 우측 "권고대로 진행" 버튼 (코멘트 없어도 진행, 있으면 함께 전송)
    if (d.recommend && d.status !== 'resolved') {
      const rec = el('button', 'rec-btn', '✓ 권고대로 진행');
      rec.type = 'button'; rec.title = '권고: ' + d.recommend;
      rec.onclick = async () => {
        const n = atts.length;
        const ok = await postFeedback({ kind: 'decision', id: d.id, question: d.question, choice: d.recommendChoice || draft.choice || null, text: draft.text || '', accept: 'recommended', atts: atts.slice(), at: new Date().toISOString() });
        draft.submittedAt = new Date().toISOString(); saveDraft(d.id, draft);
        if (ok) atts.length = 0;
        renderDecisions();
        const sv = document.querySelector(`.dcard[data-did="${(window.CSS && CSS.escape) ? CSS.escape(d.id) : d.id}"] .saved`);
        if (sv) sv.textContent = ok ? `✓ 권고대로 진행 요청됨${n ? ` (첨부 ${n})` : ''} — 검토 전까지 수정 가능` : '전송 실패(재시도)';
      };
      bar.append(rec);
    }
    card.append(bar);
    box.append(card);
  };
  // 진행 중(open)은 펼쳐 표시, 완료(resolved/closed)는 종결 처리해 접어 둠 — 토글로 펼침
  const isClosed = d => d.status === 'resolved' || d.status === 'closed';
  list.filter(d => !isClosed(d)).forEach(buildCard);
  const closedList = list.filter(isClosed);
  if (closedList.length) {
    const tg = el('button', 'closed-toggle'); tg.type = 'button';
    tg.textContent = `✓ 종결된 검토사안 ${closedList.length}건 ${ui.showClosed ? '▾ 접기' : '▸ 보기'}`;
    tg.onclick = () => { ui.showClosed = !ui.showClosed; renderDecisions(); };
    box.append(tg);
    if (ui.showClosed) closedList.forEach(buildCard);
  }
  if (!box.children.length) box.innerHTML = '<div class="empty">검토 사안 없음</div>';

  // 포커스/캐럿 복원 (decision/ad-hoc 공통)
  if (focusKey) {
    const i = focusKey.indexOf(':'), kind = focusKey.slice(0, i), val = focusKey.slice(i + 1);
    const attr = kind === 'did' ? 'data-did' : 'data-adhoc';
    const ta = box.querySelector(`.dcard[${attr}="${(window.CSS && CSS.escape) ? CSS.escape(val) : val}"] textarea`);
    if (ta) {
      ta.focus();
      if (caret) {
        const rm = kind === 'did' ? focusedRemoved : 0;   // 처리완료분 제거 길이만큼 커서 앞당김
        const s = Math.max(0, Math.min(caret[0] - rm, ta.value.length)), e = Math.max(0, Math.min(caret[1] - rm, ta.value.length));
        try { ta.setSelectionRange(s, e); } catch {}
      }
    }
  }
}
// 항목 컨텍스트 즉석 피드백 카드 (ui.adhoc 항목) — 완료/현재/예정 공통
const CTX_LABEL = { planned: '예정 작업', done: '완료 내역', current: '현재 작업' };
function buildAdhocCard(item) {
  item.atts = item.atts || [];
  const label = CTX_LABEL[item.ctx] || '항목';
  const card = el('div', 'dcard dadhoc');
  card.dataset.adhoc = item.refId;
  const detailHtml = item.note
    ? `<div class="ddetail adhoc-note"><b>진행하려면 다음이 필요합니다</b>${fmtLines(item.note)}</div>`
    : `<div class="ddetail">이 ${esc(label)} 항목에 대한 의견·요청 — 에이전트가 검토합니다.</div>`;
  card.innerHTML = `<div class="row"><span class="q">💬 ${esc(label)} 피드백</span> <span class="adhoc-target">${esc(item.title)}</span><button class="adhoc-close" type="button" title="닫기" aria-label="닫기">✕</button></div>
    ${detailHtml}`;
  card.querySelector('.adhoc-close').onclick = () => { ui.adhoc = ui.adhoc.filter(a => a !== item); renderDecisions(); };
  const ta = el('textarea'); ta.placeholder = '이 항목에 대한 의견·요청 입력… (이미지·파일 첨부, Ctrl+Enter 전송)'; ta.value = item.text || '';
  ta.addEventListener('input', () => { item.text = ta.value; });
  card.append(ta);
  const attList = el('div', 'att-list'); attList.hidden = true; card.append(attList);
  const fileInput = el('input'); fileInput.type = 'file'; fileInput.multiple = true; fileInput.hidden = true; card.append(fileInput);
  const bar = el('div', 'dsubmit');
  const btn = el('button', null, '피드백 전송');
  const attBtn = el('button', 'attach-btn', '📎 첨부'); attBtn.type = 'button';
  const saved = el('span', 'saved', '');
  btn.onclick = async () => {
    const n = item.atts.length;
    const ok = await postFeedback({ kind: 'context-feedback', ctx: item.ctx, refId: item.refId, title: item.title, text: item.text || '', atts: item.atts.slice(), at: new Date().toISOString() });
    saved.textContent = ok ? `전송됨${n ? ` (첨부 ${n})` : ''} — 검토 예정` : '전송 실패(재시도)';
    if (ok) { ui.adhoc = ui.adhoc.filter(a => a !== item); setTimeout(renderDecisions, 700); }
  };
  bar.append(btn, attBtn, saved);
  card.append(bar);
  attachable({ dropEl: card, textarea: ta, fileBtn: attBtn, fileInput, listEl: attList, atts: item.atts, persist: () => {} });
  autoGrow(ta); onCtrlEnter(ta, () => btn.click());
  return card;
}
function openContextFeedback(ctx, refId, title, note) {
  if (!ui.panes.includes('decisions')) {                                  // 검토사안 보이게
    if (ui.panes.length === 2 || innerWidth >= WIDE_W) setPanes('decisions', true); else setPanes('decisions', false);
  }
  const ex = ui.adhoc.find(a => a.ctx === ctx && a.refId === refId);
  if (ex) { if (note) ex.note = note; } else ui.adhoc.unshift({ ctx, refId, title, text: '', atts: [], note: note || '' });
  renderDecisions();
  requestAnimationFrame(() => {
    const sel = `.dcard[data-adhoc="${(window.CSS && CSS.escape) ? CSS.escape(refId) : refId}"]`;
    const card = document.querySelector(sel);
    if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); const ta = card.querySelector('textarea'); if (ta) ta.focus(); }
  });
}
// 대기 항목 바로 진행 신호 (추가 입력 불필요한 경우)
async function proceedPlanned(pid, title, btn) {
  if (btn) { btn.disabled = true; }
  const ok = await postFeedback({ kind: 'proceed', plannedId: pid, title, at: new Date().toISOString() });
  if (btn) { btn.classList.toggle('requested', ok); btn.innerHTML = ok ? '✓ 진행 요청됨' : '전송 실패(재시도)'; if (!ok) btn.disabled = false; }
}
function saveDraft(id, draft) { localStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft)); }

// ---- 자유 추가 요청 (검토사안 최상단) — 에이전트 채팅 프롬프트와 동일 처리 ----
const FREE_KEY = 'constellation-free-req';
function renderFreeRequest() {
  const ta = $('#free-req'); if (!ta) return;
  const fr = (ui.state && ui.state.freeRequest) || {};
  let draft; try { draft = JSON.parse(localStorage.getItem(FREE_KEY) || '{}'); } catch { draft = {}; }
  const focused = document.activeElement === ta;
  const caretS = focused ? ta.selectionStart : null, caretE = focused ? ta.selectionEnd : null;
  // 처리완료(reviewedText)분만 제거하고 추가/변동분은 보존. 전체 일치 → 비움 / prefix → 그만큼만.
  let removed = 0;
  if (fr.reviewedAt && draft.submittedAt) {
    const rt = fr.reviewedText || '', txt = draft.text || '';
    if (txt === rt) { localStorage.removeItem(FREE_KEY); draft = {}; removed = txt.length; }
    else if (rt && txt.startsWith(rt)) {
      const rest = txt.slice(rt.length).replace(/^\s*\r?\n/, '');
      removed = txt.length - rest.length;
      draft = { text: rest }; localStorage.setItem(FREE_KEY, JSON.stringify(draft));   // 나머지=미전송 새 내용
    }
  }
  const newVal = draft.text || '';
  if (ta.value !== newVal) { ta.value = newVal; if (ta._fit) ta._fit(); }
  if (focused && caretS != null) {
    const s = Math.max(0, Math.min(caretS - removed, ta.value.length)), e = Math.max(0, Math.min(caretE - removed, ta.value.length));
    try { ta.setSelectionRange(s, e); } catch {}
  }
  const saved = $('#free-req-saved');
  if (saved) saved.textContent = draft.submittedAt
    ? `전송됨 ${new Date(draft.submittedAt).toLocaleString('ko-KR')} — 검토 전까지 수정 가능`
    : (fr.reviewedAt && !draft.text ? '↑ 이전 요청 반영됨 · 새 요청 가능' : '');
}
const freeAtts = [];   // 자유요청 첨부 (메모리 — data URL 은 localStorage quota 회피 위해 비영속)
function setupFreeRequest() {
  const ta = $('#free-req'), btn = $('#free-req-send'); if (!ta || !btn) return;
  ta.addEventListener('input', () => { let d; try { d = JSON.parse(localStorage.getItem(FREE_KEY) || '{}'); } catch { d = {}; } d.text = ta.value; localStorage.setItem(FREE_KEY, JSON.stringify(d)); });
  attachable({ dropEl: $('#free-req-card'), textarea: ta, fileBtn: $('#free-req-attach'), fileInput: $('#free-req-file'), listEl: $('#free-req-atts'), atts: freeAtts, persist: () => {} });
  ta._fit = autoGrow(ta);
  onCtrlEnter(ta, () => btn.click());
  btn.onclick = async () => {
    let d; try { d = JSON.parse(localStorage.getItem(FREE_KEY) || '{}'); } catch { d = {}; }
    d.text = ta.value; d.submittedAt = new Date().toISOString(); localStorage.setItem(FREE_KEY, JSON.stringify(d));
    const n = freeAtts.length;
    const ok = await postFeedback({ kind: 'request', id: 'free-request', text: ta.value, atts: freeAtts.slice(), at: new Date().toISOString() });
    if (ok) { freeAtts.length = 0; renderComposeAtts($('#free-req-atts'), freeAtts, () => {}); }
    renderFreeRequest();
    if ($('#free-req-saved')) $('#free-req-saved').textContent = ok ? `전송됨${n ? ` (첨부 ${n})` : ''} — 검토 전까지 수정 가능` : '전송 실패(재시도)';
  };
}

// ---- 첨부 (코드/mermaid/html/img/link) — 칩 → 팝업 다이얼로그 → 별 탭 ----
// 항목 att: [{ t:'code'|'mermaid'|'html'|'img'|'link', title, body?, src?, lang? }]
function attChips(key, atts) {
  if (!atts || !atts.length) return '';
  const icon = { code: '𝄜', mermaid: '◈', html: '▤', img: '🖼', link: '🔗' };
  return '<div class="att-row">' + atts.map((a, i) =>
    `<button class="att-chip" type="button" data-att="${esc(key)}:${i}">${icon[a.t] || '📎'} ${esc(a.title || a.t)}</button>`).join('') + '</div>';
}
function findAtt(key) {
  const ci = key.lastIndexOf(':'); const item = key.slice(0, ci); const idx = +key.slice(ci + 1);
  let atts = null;
  if (item.startsWith('done-')) { const d = (ui.state.done || [])[+item.slice(5)]; atts = d && d.att; }
  else if (item.startsWith('planned-')) { const p = (ui.state.planned || []).find(x => x.id === item.slice(8)); atts = p && p.att; }
  else if (item.startsWith('decision-')) { const d = (ui.state.decisions || []).find(x => x.id === item.slice(9)); atts = d && d.att; }
  else if (item === 'current') atts = ui.state.current && ui.state.current.att;
  return atts ? atts[idx] : null;
}
let _mermaid;
async function ensureMermaid() {
  if (_mermaid) return _mermaid;
  const mod = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
  _mermaid = mod.default;
  _mermaid.initialize({ startOnLoad: false, theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark' });
  return _mermaid;
}
async function openAttachment(a) {
  const dlg = $('#att-dialog'), body = $('#att-body'); if (!dlg) return;
  $('#att-title').textContent = a.title || a.t;
  dlg._att = a;
  // 먼저 연다 — mermaid/dagre 는 보이는(레이아웃 가능한) 컨테이너에서만 노드 치수를 잰다.
  // 닫힌 <dialog>(display:none)에서 run 하면 getBBox=NaN → translate(undefined,NaN) 빈 SVG.
  if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  if (a.t === 'code') body.innerHTML = `<pre class="att-code"><code>${esc(a.body)}</code></pre>`;
  else if (a.t === 'mermaid') {
    body.innerHTML = '<div class="mermaid"></div>'; body.querySelector('.mermaid').textContent = a.body;   // v2.4.12 보안: raw body 를 textContent 로 주입 (innerHTML 시 <img onerror>/<script> 가 mermaid 파싱 전 same-origin 실행). mermaid.run 은 element textContent 를 다이어그램 소스로 읽으므로 동작 동일
    try { const m = await ensureMermaid(); await m.run({ nodes: body.querySelectorAll('.mermaid') }); }
    catch (e) { body.innerHTML = `<pre class="att-code">${esc(a.body)}</pre><div class="empty">mermaid 렌더 실패: ${esc(String(e && e.message || e))}</div>`; }
  }
  else if (a.t === 'html') body.innerHTML = `<iframe class="att-frame" sandbox srcdoc="${esc(a.body)}"></iframe>`;   // v2.4.12 보안: sandbox(빈 값=스크립트·동일출처 차단) — 첨부 HTML 의 same-origin JS 실행 방지 (peer 가 A2A 로 보낸 첨부 stored-XSS 차단)
  else if (a.t === 'img') body.innerHTML = `<img class="att-img" src="${esc(a.src)}" alt="${esc(a.title || a.name || '')}">`;
  else if (a.t === 'link') body.innerHTML = `<iframe class="att-frame" sandbox src="${esc(wsSafeUrl(a.src))}"></iframe>`;   // v2.4.12 sandbox 정적 프리뷰 + v2.4.33 스킴 allowlist (javascript:/data:text/html 차단)
  else if (a.t === 'file') body.innerHTML = `<div class="att-fileinfo">📄 ${esc(a.name || a.title || '파일')}<div class="empty">미리보기 미지원 형식 — '새 탭'으로 열어 확인하세요${a.mime ? ` (${esc(a.mime)})` : ''}.</div></div>`;
}
function attNewTab(a) {
  let url;
  if (a.t === 'img' || a.t === 'link' || a.t === 'file') url = wsSafeUrl(a.src);   // v2.4.33 스킴 allowlist — window.open(javascript:/data:text/html) same-origin 실행 차단
  else {
    let doc;
    if (a.t === 'code') doc = `<!doctype html><meta charset="utf-8"><title>${esc(a.title || 'code')}</title><style>body{margin:0;background:#0f1115;color:#e7e9ea;font:13px/1.5 ui-monospace,monospace}pre{padding:18px;white-space:pre-wrap;word-break:break-word}</style><pre>${esc(a.body)}</pre>`;
    else if (a.t === 'mermaid') doc = `<!doctype html><meta charset="utf-8"><title>${esc(a.title || 'diagram')}</title><body style="margin:0;background:#0f1115;display:flex;justify-content:center;padding:24px"><pre class="mermaid">${esc(a.body)}</pre><script type="module">import m from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';m.initialize({startOnLoad:true,theme:'dark'});<\/script>`;   // v2.4.33 보안: esc(a.body) — raw 시 새탭 blob same-origin XSS (mermaid 는 textContent 디코딩본을 읽어 렌더 동일)
    else doc = `<!doctype html><meta charset="utf-8"><body style="margin:0"><iframe sandbox srcdoc="${esc(a.body || '')}" style="border:0;width:100vw;height:100vh"></iframe>`;   // v2.4.33 보안: html 첨부 새탭도 sandbox iframe (raw blob same-origin XSS 차단; in-dialog 와 동일 정책)
    url = URL.createObjectURL(new Blob([doc], { type: 'text/html' }));
  }
  window.open(url, '_blank', 'noopener');
}
function setupAttachments() {
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.att-chip'); if (!chip) return;
    const a = findAtt(chip.dataset.att); if (a) openAttachment(a);
  });
  const dlg = $('#att-dialog'); if (!dlg) return;
  if ($('#att-close')) $('#att-close').onclick = () => dlg.close();
  if ($('#att-newtab')) $('#att-newtab').onclick = () => dlg._att && attNewTab(dlg._att);
  dlg.addEventListener('click', (e) => {   // backdrop 클릭 닫기
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
}

// ---- 요청 입력 첨부 (클립보드 붙여넣기 · 첨부 버튼 · 드래그앤드롭) — 모든 요청 입력란 공용 ----
// 첨부 모델: img{src dataURL} · code{body,lang,title} · file{src dataURL,name,mime}. 전송 시 atts[] 로 동봉.
const MAX_ATT_BYTES = 12 * 1024 * 1024;   // 단일 첨부 상한 (로컬 신뢰 입력)
const TEXT_RE = /\.(eux|md|markdown|txt|log|js|mjs|cjs|ts|tsx|jsx|json|jsonc|css|scss|html|htm|svg|xml|yml|yaml|toml|ini|sh|bash|zsh|py|rb|go|rs|java|kt|c|h|cpp|cs|php|sql|csv)$/i;
function fmtBytes(n) { return n < 1024 ? n + 'B' : n < 1048576 ? (n / 1024).toFixed(0) + 'KB' : (n / 1048576).toFixed(1) + 'MB'; }
function readFileAsAtt(file) {
  return new Promise((resolve) => {
    if (file.size > MAX_ATT_BYTES) return resolve({ error: `${file.name}: 너무 큼 (${fmtBytes(file.size)} > ${fmtBytes(MAX_ATT_BYTES)})` });
    const r = new FileReader();
    const isImg = /^image\//.test(file.type);
    const isText = /^text\//.test(file.type) || TEXT_RE.test(file.name) || (!file.type && file.size < 256 * 1024);
    if (isImg) { r.onload = () => resolve({ t: 'img', name: file.name, mime: file.type, src: r.result, size: file.size }); r.readAsDataURL(file); }
    else if (isText) { r.onload = () => resolve({ t: 'code', title: file.name, lang: (file.name.split('.').pop() || '').toLowerCase(), body: r.result, size: file.size }); r.readAsText(file); }
    else { r.onload = () => resolve({ t: 'file', name: file.name, mime: file.type || 'application/octet-stream', src: r.result, size: file.size }); r.readAsDataURL(file); }
    r.onerror = () => resolve({ error: `${file.name}: 읽기 실패` });
  });
}
async function addFilesToAtts(files, atts) {
  const errs = [];
  for (const f of files) { if (!f) continue; const a = await readFileAsAtt(f); if (a.error) errs.push(a.error); else atts.push(a); }
  return errs;
}
function renderComposeAtts(listEl, atts, onChange, errs) {
  if (!listEl) return;
  const icon = { code: '𝄜', img: '🖼', file: '📄', mermaid: '◈', html: '▤', link: '🔗' };
  const errHtml = (errs && errs.length) ? `<span class="att-err">${esc(errs.join(' · '))}</span>` : '';
  if (!atts.length) { listEl.innerHTML = errHtml; listEl.hidden = !errHtml; return; }
  listEl.hidden = false;
  listEl.innerHTML = atts.map((a, i) =>
    `<span class="att-pill" data-i="${i}" title="클릭하면 미리보기">${icon[a.t] || '📎'} <span class="att-name">${esc(a.title || a.name || a.t)}</span>${a.size ? ` <span class="att-sz">${fmtBytes(a.size)}</span>` : ''}<button class="att-rm" type="button" data-rm="${i}" aria-label="제거">✕</button></span>`).join('') + errHtml;
  listEl.querySelectorAll('.att-rm').forEach(b => b.onclick = (e) => { e.stopPropagation(); atts.splice(+b.dataset.rm, 1); onChange(); });
  listEl.querySelectorAll('.att-pill').forEach(p => p.onclick = () => { const a = atts[+p.dataset.i]; if (a) openAttachment(a); });
}
// textarea/카드에 붙여넣기·드롭·버튼 첨부를 연결. atts 배열을 in-place 변경, persist 로 저장.
function attachable({ dropEl, textarea, fileBtn, fileInput, listEl, atts, persist }) {
  const refresh = (errs) => { renderComposeAtts(listEl, atts, () => { persist(); refresh(); }, errs); };
  refresh();
  if (textarea) textarea.addEventListener('paste', async (e) => {
    const files = [...(e.clipboardData?.items || [])].filter(it => it.kind === 'file').map(it => it.getAsFile()).filter(Boolean);
    if (!files.length) return;                       // 텍스트 붙여넣기는 기본 동작 유지
    e.preventDefault();
    const errs = await addFilesToAtts(files, atts); persist(); refresh(errs);
  });
  if (fileBtn && fileInput) {
    fileBtn.onclick = () => fileInput.click();
    fileInput.onchange = async () => { const errs = await addFilesToAtts([...fileInput.files], atts); fileInput.value = ''; persist(); refresh(errs); };
  }
  if (dropEl) {
    const hot = (on) => dropEl.classList.toggle('drop-hot', on);
    ['dragenter', 'dragover'].forEach(ev => dropEl.addEventListener(ev, (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); hot(true); } }));
    ['dragleave', 'dragend'].forEach(ev => dropEl.addEventListener(ev, (e) => { if (!dropEl.contains(e.relatedTarget)) hot(false); }));
    dropEl.addEventListener('drop', async (e) => { if (!e.dataTransfer?.files?.length) return; e.preventDefault(); hot(false); const errs = await addFilesToAtts([...e.dataTransfer.files], atts); persist(); refresh(errs); });
  }
}

// ---- 입력란 공용: auto-grow(내용만큼 확장) + Ctrl+Enter 전송 + 상대시간 ----
function autoGrow(ta) {
  const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  ta.style.overflowY = 'hidden';
  ta.addEventListener('input', fit);
  requestAnimationFrame(fit);   // DOM 삽입·값 복원 후 초기 맞춤
  return fit;
}
function onCtrlEnter(ta, fn) {
  ta.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); fn(); } });
}
function fmtDateTime(iso) { try { return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } }
function relTime(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 0) return '방금';
  if (s < 60) return '방금 전';
  if (s < 3600) return Math.floor(s / 60) + '분 전';
  if (s < 86400) return Math.floor(s / 3600) + '시간 전';
  if (s < 2592000) return Math.floor(s / 86400) + '일 전';
  return Math.floor(s / 2592000) + '개월 전';
}

// ---- theme (자동 / 라이트 / 다크) ----
const THEME_KEY = 'constellation-theme-pref';
const themeMql = matchMedia('(prefers-color-scheme: dark)');
const SUN_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.3"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>`;
const MOON_SVG = `<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" stroke="none"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
const AUTO_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>`;
function themePref() { return localStorage.getItem(THEME_KEY) || 'auto'; }
function resolveTheme(pref) { return pref === 'auto' ? (themeMql.matches ? 'dark' : 'light') : pref; }
function applyTheme() {
  const pref = themePref();
  document.documentElement.setAttribute('data-theme', resolveTheme(pref));
  const b = $('#theme-btn');
  if (b) {
    const icon = { auto: AUTO_SVG, light: SUN_SVG, dark: MOON_SVG }[pref];
    const label = { auto: '자동(시스템)', light: '라이트', dark: '다크' }[pref];
    b.innerHTML = icon;
    b.title = `테마: ${label} (클릭하여 전환)`;
  }
}
function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  localStorage.setItem(THEME_KEY, order[(order.indexOf(themePref()) + 1) % order.length]);
  applyTheme();
}
themeMql.addEventListener('change', () => { if (themePref() === 'auto') applyTheme(); });
$('#theme-btn').onclick = cycleTheme;
applyTheme();

// ---- tabs / 분할 뷰 (대시보드 ⇆ 검토사안) ----
const PANES_KEY = 'constellation-panes', SPLIT_FRAC_KEY = 'constellation-split-frac', SPLIT_FIXED_KEY = 'constellation-split-fixed';
const WIDE_W = 1600;   // 이 폭 이상이면 자동 분할
function loadPanes() {
  try { const p = JSON.parse(localStorage.getItem(PANES_KEY)); if (Array.isArray(p) && p.length) { const f = p.filter(x => x === 'dashboard' || x === 'decisions'); if (f.length) return [...new Set(f)]; } } catch {}
  return innerWidth >= WIDE_W ? ['dashboard', 'decisions'] : ['dashboard'];
}
function savePanes() { localStorage.setItem(PANES_KEY, JSON.stringify(ui.panes)); }
function loadSplitFrac() { const v = parseFloat(localStorage.getItem(SPLIT_FRAC_KEY)); return (v >= 0.2 && v <= 0.8) ? v : 0.5; }
function loadSplitFixed() { try { const f = JSON.parse(localStorage.getItem(SPLIT_FIXED_KEY)); if (f && (f.side === 'left' || f.side === 'right') && f.px > 120) return f; } catch {} return null; }
function applySplitSizing() {
  const main = $('main'), fx = ui.splitFixed;
  if (fx) main.style.setProperty('--split-cols', fx.side === 'left' ? `${fx.px}px 12px minmax(0,1fr)` : `minmax(0,1fr) 12px ${fx.px}px`);
  else { const f = ui.splitFrac; main.style.setProperty('--split-cols', `${f}fr 12px ${1 - f}fr`); }
  requestAnimationFrame(positionHomeFabs);
}
function applyPanes() {
  const split = ui.panes.length === 2, main = $('main');
  main.classList.toggle('split', split);
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', ui.panes.includes(b.dataset.tab)));
  document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('active', ui.panes.includes(p.id.replace('tab-', ''))));
  if (typeof syncMobileTabbar === 'function') syncMobileTabbar();   // 하단 탭바 active 동기 (모바일)
  const dv = $('#pane-divider'); if (dv) dv.hidden = !split;
  document.querySelectorAll('.pin-handle').forEach(h => h.hidden = !split);
  if (split) { applySplitSizing(); updatePinHandles(); }
  const hb = $('#home-btn'), hd = $('#home-btn-dec');
  if (hb) hb.hidden = !ui.panes.includes('dashboard');
  if (hd) hd.hidden = !ui.panes.includes('decisions');
  positionHomeFabs();
  ui.tab = ui.panes[ui.panes.length - 1];   // 호환 (마지막 = 주 탭)
  // 분할 토글로 대시보드 pane 폭이 바뀌므로(창 resize 아님) 홈·타임라인 중앙 재적용
  if (ui.panes.includes('dashboard')) requestAnimationFrame(() => { if (ui.atHome) applyHome(false); if (ui.tlCentered) centerActiveStage(false); });
}
function positionHomeFabs() {
  const hb = $('#home-btn'), hd = $('#home-btn-dec'), dv = $('#pane-divider');
  if (ui.panes.length === 2 && dv && !dv.hidden) {
    const r = dv.getBoundingClientRect();
    if (hb) hb.style.right = Math.round(innerWidth - r.left + 14) + 'px';   // 대시보드 FAB → 좌측(대시보드) 영역 우하단
    if (hd) hd.style.right = '';                                            // 검토 FAB → 화면 우하단(=우측 영역)
  } else { if (hb) hb.style.right = ''; if (hd) hd.style.right = ''; }
}
function setPanes(name, ctrl) {
  let panes = ui.panes.slice();
  if (ctrl) {
    if (panes.includes(name)) { if (panes.length === 2) panes = panes.filter(p => p !== name); }   // 양쪽 활성 → 제외(토글)
    else panes = ['dashboard', 'decisions'];                                                       // 추가 → 분할 (좌:대시보드 고정)
  } else panes = [name];                                                                           // 일반 클릭 → 단일
  ui.panes = panes; savePanes(); applyPanes();
}
document.querySelectorAll('.tab').forEach(t => t.onclick = (e) => setPanes(t.dataset.tab, e.ctrlKey || e.metaKey));

function updatePinHandles() {
  const fx = ui.splitFixed;
  document.querySelectorAll('.pin-handle').forEach(h => h.classList.toggle('pinned', !!fx && fx.side === h.dataset.side));
}
function setupSplit() {
  const main = $('main'), dv = $('#pane-divider');
  // 분리선 드래그 = 좌우 비율 (고정폭 해제)
  if (dv) {
    let drag = false;
    const move = (e) => {
      if (!drag) return;
      const r = main.getBoundingClientRect(), cx = e.touches ? e.touches[0].clientX : e.clientX;
      let f = (cx - r.left) / r.width; f = Math.max(0.2, Math.min(0.8, f));
      ui.splitFrac = f; ui.splitFixed = null; localStorage.removeItem(SPLIT_FIXED_KEY);
      localStorage.setItem(SPLIT_FRAC_KEY, String(f.toFixed(4))); applySplitSizing(); updatePinHandles();
    };
    const up = () => { if (drag) { drag = false; dv.classList.remove('dragging'); document.body.style.userSelect = ''; if (ui.atHome) applyHome(false); if (ui.tlCentered) centerActiveStage(false); } };
    dv.addEventListener('mousedown', (e) => { drag = true; dv.classList.add('dragging'); document.body.style.userSelect = 'none'; e.preventDefault(); });
    dv.addEventListener('touchstart', () => { drag = true; dv.classList.add('dragging'); }, { passive: true });
    dv.addEventListener('dblclick', () => { ui.splitFrac = 0.5; ui.splitFixed = null; localStorage.removeItem(SPLIT_FIXED_KEY); localStorage.setItem(SPLIT_FRAC_KEY, '0.5'); applySplitSizing(); updatePinHandles(); });
    window.addEventListener('mousemove', move); window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up); window.addEventListener('touchend', up);
    // pane 안쪽 고정-px 핸들 (iOS 손잡이) — divider 양옆에 배치
    ['left', 'right'].forEach(side => {
      const h = el('div', 'pin-handle pin-' + side, '<span class="ph-bars"></span>');
      h.dataset.side = side; h.hidden = true; h.title = (side === 'left' ? '좌측' : '우측') + '을 고정 폭으로 — 드래그 (더블클릭 해제)';
      dv.appendChild(h);
      let pdrag = false;
      const pmove = (e) => {
        if (!pdrag) return;
        const r = main.getBoundingClientRect(), cx = e.touches ? e.touches[0].clientX : e.clientX;
        let px = side === 'left' ? cx - r.left : r.right - cx;
        px = Math.max(200, Math.min(r.width - 260, px));
        ui.splitFixed = { side, px: Math.round(px) }; localStorage.setItem(SPLIT_FIXED_KEY, JSON.stringify(ui.splitFixed));
        applySplitSizing(); updatePinHandles();
      };
      const pup = () => { if (pdrag) { pdrag = false; h.classList.remove('dragging'); document.body.style.userSelect = ''; if (ui.atHome) applyHome(false); if (ui.tlCentered) centerActiveStage(false); } };
      h.addEventListener('mousedown', (e) => { pdrag = true; h.classList.add('dragging'); document.body.style.userSelect = 'none'; e.preventDefault(); e.stopPropagation(); });
      h.addEventListener('dblclick', (e) => { e.stopPropagation(); ui.splitFixed = null; localStorage.removeItem(SPLIT_FIXED_KEY); applySplitSizing(); updatePinHandles(); });
      window.addEventListener('mousemove', pmove); window.addEventListener('mouseup', pup);
    });
  }
  // 폭이 1600 을 상향 교차하면 자동 분할 (사용자 토글은 그 위에서 자유)
  ui._wasWide = innerWidth >= WIDE_W;
  window.addEventListener('resize', () => {
    const wide = innerWidth >= WIDE_W;
    if (wide && !ui._wasWide && ui.panes.length === 1) setPanes(ui.panes[0] === 'dashboard' ? 'decisions' : 'dashboard', true);
    ui._wasWide = wide;
    if (ui.panes.length === 2) applySplitSizing();
  });
}
$('#home-btn').innerHTML = `<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 10.6 12 3.2l9 7.4"/><path d="M5.2 9.3V20.4h13.6V9.3"/><path d="M9.6 20.4v-6.1h4.8v6.1"/></svg>`;
$('#home-btn').onclick = () => {
  if (!ui.panes.includes('dashboard')) setPanes('dashboard', false);
  centerCurrent(true);
};
$('#home-btn-dec').innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.4h14"/><path d="M12 20.4V8.2"/><path d="M5.6 13.6 12 7.2l6.4 6.4"/></svg>`;
$('#home-btn-dec').onclick = () => {
  if (!ui.panes.includes('decisions')) setPanes('decisions', false);
  const pane = $('#tab-decisions'); if (pane) pane.scrollTo({ top: 0, behavior: 'smooth' });
  const fr = $('#free-req'); if (fr) fr.focus({ preventScroll: true });
};

// ---- Compendium wiki tab (v0.2-d) — static /compendium.json export, dual-register + click-to-define cross-links ----
let wikiData = null, wikiReg = localStorage.getItem('eg-wiki-reg') || 'plain', wikiQuery = '';
function wikiSpecUrl(sp) {
  if (!sp) return null;
  const h = sp.indexOf('#'); const f = h < 0 ? sp : sp.slice(0, h), s = h < 0 ? '' : sp.slice(h + 1);
  return 'https://github.com/SoliEstre/EstreGenesis/blob/main/' + f + (s ? '#' + s : '');
}
function renderWiki() {
  const body = $('#wiki-body'); if (!body || !wikiData) return;
  const q = wikiQuery.trim().toLowerCase();
  const all = wikiData.entries || [];
  const byId = Object.fromEntries(all.map((e) => [e.id, e]));
  const list = all.filter((e) => !q || (e.id + ' ' + (e.title || '') + ' ' + (e.definition || '')).toLowerCase().includes(q));
  body.innerHTML = list.map((e) => {
    const gloss = (e.glosses || []).find((g) => g.register === wikiReg);
    const text = gloss ? gloss.text : (e.definition || '');
    const reg = e.register_class === 'internal' ? '<span class="wiki-tag int">내부어</span>' : '<span class="wiki-tag gen">일반어</span>';
    const st = e.status && e.status !== 'active' ? ' <span class="wiki-tag sup">' + esc(e.status) + '</span>' : '';
    const sp = wikiSpecUrl(e.owner_spec);
    const ptr = sp
      ? '<a class="wiki-ptr" href="' + esc(wsSafeUrl(sp)) + '" target="_blank" rel="noopener">정의 원본 → ' + esc(e.owner_spec) + '</a>'
      : '<span class="wiki-ptr gen">일반어 — Compendium 이 정의 소유</span>';
    const xlinks = (e.links || []).filter((id) => byId[id]).map((id) => '<a class="wiki-xlink" href="#wiki-' + esc(id) + '" data-wiki-jump="' + esc(id) + '">' + esc(byId[id].title || id) + '</a>').join('');
    return '<article class="wiki-entry" id="wiki-' + esc(e.id) + '">'
      + '<h3 class="wiki-e-title">' + esc(e.title || e.id) + reg + st + '</h3>'
      + '<p class="wiki-def">' + esc(text) + '</p>'
      + '<div class="wiki-meta">' + ptr + (xlinks ? '<span class="wiki-rel">관련: ' + xlinks + '</span>' : '') + '</div>'
      + '</article>';
  }).join('') || '<div class="empty">검색 결과 없음.</div>';
  // click-to-define: cross-link jump highlights the target entry (§8.1 — anchors over the escaped DOM, never raw HTML)
  body.querySelectorAll('[data-wiki-jump]').forEach((a) => { a.onclick = (ev) => {
    ev.preventDefault();
    const t = document.getElementById('wiki-' + a.dataset.wikiJump);
    if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.add('wiki-flash'); setTimeout(() => t.classList.remove('wiki-flash'), 1200); }
  }; });
}
function setupWiki() {
  document.querySelectorAll('.wiki-reg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.reg === wikiReg);
    b.onclick = () => { wikiReg = b.dataset.reg; localStorage.setItem('eg-wiki-reg', wikiReg);
      document.querySelectorAll('.wiki-reg-btn').forEach((x) => x.classList.toggle('active', x.dataset.reg === wikiReg)); renderWiki(); };
  });
  const s = $('#wiki-search'); if (s) s.oninput = () => { wikiQuery = s.value; renderWiki(); };
  fetch('compendium.json', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
    wikiData = d; const cnt = $('#wiki-count'); if (cnt) cnt.textContent = (d.count || (d.entries || []).length) + ' terms'; renderWiki();
  }).catch((e) => { const body = $('#wiki-body'); if (body) body.innerHTML = '<div class="empty">Compendium 데이터 로드 실패 (' + esc(String(e && e.message || e)) + ').</div>'; });
}

// ---- boot ----
ui.panes = loadPanes(); ui.splitFrac = loadSplitFrac(); ui.splitFixed = loadSplitFixed();
setupTopbar();         // fixed 상단바 높이 → --topbar-h (메인 패딩)
setupSplit();          // 분할 뷰 분리선/핸들 + 폭 1600 자동 분할
applyPanes();          // 복원된 panes 로 단일/분할 레이아웃 적용
setupFilterNav();      // 필터 가로 스크롤 인디케이터 (‹ ›)
setupFreeRequest();    // 검토사안 최상단 자유 추가 요청
setupAttachments();    // 항목 첨부(코드/mermaid/시각) 칩 → 팝업 → 별 탭
setupStandbyToggle();  // 무한 대기 모드 토글 (conn 왼쪽)
setupHomeTracking();   // 콘텐츠 크기 변화에 맞춰 홈 위치 유지 (초기 센터링 포함)
setupWiki();           // Compendium 위키 탭 (v0.2-d) — /compendium.json fetch + dual-register 렌더
fetch('/api/state').then(r => r.json()).then(applyState).catch(() => {});
connect();
// 검토 반영 시각의 상대시간 실시간 갱신
setInterval(() => {
  document.querySelectorAll('.dreviewed-at').forEach(s => { const at = s.dataset.at, rel = s.querySelector('.rel'); if (at && rel) rel.textContent = '(' + relTime(at) + ')'; });
}, 30000);

// ==== WS 실시간 채널 (WS-PROTOCOL.md v0.2 multi-agent) — 대시보드 = board 클라이언트 ====
// ⚠ 대시보드는 HELLO 미송신. server 가 SERVER_HELLO + CUSTOM/AgentList(연결된 에이전트 목록) push.
//    agent outbound(agentId 태그) → 채널별 분류·표시. 입력은 활성 채널의 targetAgentId 로 송신.
const wsState = {
  ws: null, open: false, retry: null, popOpen: false,
  channels: new Map(),    // agentId → { name, rows:[], unseen, agentSeen, runId, seq, msgBuf }
  active: null,           // 활성 채널 agentId
  present: new Set(),     // 현재 연결된 agentId (AgentList 기준)
  replaying: false,       // 서버 History 재생 중 (렌더·뱃지 억제)
  debugOpen: false,       // raw 이벤트 debug drawer 표시 여부 (timeline 과 전환)
  textareas: new Map(),   // 채널키 → 별도 textarea (탭별 독립 입력)
  taH: 54,                // 전 채널 입력란 통일 높이(최대값)
};
const wsAtts = [];        // WS 입력 첨부 (전송 시 동봉, 비영속)

// ---- 채널 탭별 입력란: 별도 textarea·내용 유지·영속·auto-grow·전탭 최대높이 일괄 통일 (사용자 #166) ----
const WS_DRAFTS = 'constellation-ws-drafts';
const WS_TA_MIN = 54, WS_TA_MAX = 240;
let wsDrafts = {};        // { 채널키: 입력텍스트 } — 새로고침 영속
function wsLoadDrafts() { try { const o = JSON.parse(localStorage.getItem(WS_DRAFTS) || 'null'); if (o) { wsDrafts = o.drafts || {}; if (o.taH) wsState.taH = Math.min(WS_TA_MAX, Math.max(WS_TA_MIN, o.taH)); } } catch {} }
function wsSaveDrafts() { try { const d = { ...wsDrafts }; for (const [k, ta] of wsState.textareas) { if (ta.value) d[k] = ta.value; else delete d[k]; } wsDrafts = d; localStorage.setItem(WS_DRAFTS, JSON.stringify({ drafts: d, taH: wsState.taH })); } catch {} }   // loaded drafts baseline 에 materialized 만 merge — 비활성(미생성) 채널 draft 소실 방지 (codex P2)
// 활성 textarea 필요높이 측정 → 전 채널 최대값으로 모든 입력란 일괄 높이(탭 전환 시 위치 불변)
function wsRecalcTaH() {
  const a = wsState.active, ta = a && wsState.textareas.get(a);
  if (ta && ta.classList.contains('active')) { const p = ta.style.height; ta.style.height = 'auto'; ta._h = Math.min(WS_TA_MAX, Math.max(WS_TA_MIN, ta.scrollHeight)); ta.style.height = p; }
  let max = WS_TA_MIN; for (const t of wsState.textareas.values()) max = Math.max(max, t._h || WS_TA_MIN);
  wsState.taH = max;
  for (const t of wsState.textareas.values()) t.style.height = max + 'px';
}
function wsTextareaFor(key) {
  let ta = wsState.textareas.get(key); if (ta) return ta;
  ta = el('textarea'); ta.className = 'ws-ta'; ta.dataset.chan = key; ta._h = WS_TA_MIN;
  ta.placeholder = '진행 중인 에이전트에게 바로 전달… (이미지·파일 붙여넣기/드롭 가능)';
  ta.value = wsDrafts[key] || '';
  ta.addEventListener('input', () => { wsRecalcTaH(); wsSaveDrafts(); });
  onCtrlEnter(ta, wsSendPrompt);
  attachable({ textarea: ta, atts: wsAtts, persist: () => {}, listEl: $('#ws-atts'), dropEl: null, fileBtn: null, fileInput: null });   // paste(파일) 첨부만
  const stack = $('#ws-text-stack'); if (stack) stack.appendChild(ta);
  wsState.textareas.set(key, ta); return ta;
}
let wsRoTa = null;        // 그룹·모니터(읽기 전용) 안내 입력란(공유)
function wsRoTextarea() { if (wsRoTa) return wsRoTa; wsRoTa = el('textarea'); wsRoTa.className = 'ws-ta'; wsRoTa.disabled = true; wsRoTa.placeholder = '모니터·그룹 뷰는 읽기 전용 — 개별 에이전트 탭에서 입력하세요'; wsRoTa.style.height = WS_TA_MIN + 'px'; const stack = $('#ws-text-stack'); if (stack) stack.appendChild(wsRoTa); return wsRoTa; }
function wsActiveTextarea() {
  const a = wsState.active;
  if (!a || wsIsMon(a)) return null;   // 모니터 = 읽기전용
  if (wsIsGroup(a)) { const rep = wsGroupRep(a); return rep ? wsTextareaFor(rep) : null; }   // 그룹 = 대표 워커 입력란
  return wsTextareaFor(a);
}
function wsShowTextarea(key) {
  const stack = $('#ws-text-stack'); if (!stack) return;
  for (const t of wsState.textareas.values()) t.classList.remove('active');
  if (wsRoTa) wsRoTa.classList.remove('active');
  if (!key) return;
  if (wsIsMon(key)) { wsRoTextarea().classList.add('active'); return; }   // 모니터 = 읽기전용
  if (wsIsGroup(key)) {
    const rep = wsGroupRep(key);
    if (rep) { const ta = wsTextareaFor(rep); ta.classList.add('active'); wsRecalcTaH(); if (wsState.popOpen) ta.focus({ preventScroll: true }); }
    else { wsRoTextarea().classList.add('active'); }   // 그룹 멤버 없으면 읽기전용 fallback
    return;
  }
  const ta = wsTextareaFor(key); ta.classList.add('active'); wsRecalcTaH(); if (wsState.popOpen) ta.focus({ preventScroll: true });
}
function wsURL() { return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`; }
function connectWS() {
  try { if (wsState.ws) { wsState.ws.onclose = null; wsState.ws.close(); } } catch {}
  let ws;
  try { ws = wsState.ws = new WebSocket(wsURL()); } catch { scheduleWSReconnect(); return; }
  ws.onopen = () => { wsState.open = true; updateWsConn(); };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onWsEvent(m); };
  ws.onerror = () => {};
  ws.onclose = () => { if (wsState.ws === ws) { wsState.open = false; wsState.ws = null; wsState.present = new Set(); updateWsConn(); wsRenderTabs(); scheduleWSReconnect(); } };
}
function scheduleWSReconnect() {
  if (wsState.retry) return;
  wsState.retry = setTimeout(() => { wsState.retry = null; connectWS(); }, 3000);
}
// 탭 복귀 시 끊긴 WS 즉시 재연결 (SSE 와 동일 정책)
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (!wsState.ws || wsState.ws.readyState > 1)) connectWS(); });

function nowHM() { return new Date().toTimeString().slice(0, 8); }
// 발신 시각 보존 (EstreUF parity) — 새로고침·History replay 후에도 원본 발신 시각 고정. 우선순위: m.timestamp(epoch ms) → m.at(ISO) → null.
function wsMsgEpoch(m) {
  if (m && typeof m.timestamp === 'number' && isFinite(m.timestamp)) return m.timestamp;
  if (m && m.at) { const e = Date.parse(m.at); if (!isNaN(e)) return e; }
  return null;
}
function wsRowTime(m) { const e = wsMsgEpoch(m); return e != null ? new Date(e).toTimeString().slice(0, 8) : nowHM(); }
function wsFmtVal(v) { if (v == null) return ''; if (typeof v === 'string') return v; try { return JSON.stringify(v); } catch { return String(v); } }
function wsTrunc(s, n = 220) { s = wsFmtVal(s); return s.length > n ? s.slice(0, n) + '…' : s; }
function wsOutcome(o) { return !o ? '' : (o.type === 'cancelled' ? `취소됨${o.reason ? ' · ' + o.reason : ''}` : (o.type || 'success')); }

// ---- 채널 ----
// 채널 scoping(§4): 키 = channelId(있으면, threadId 다르면 :threadId) 우선, 없으면 agentId.
// routeId = 사용자 입력 라우팅용 agentId(server 는 agentId 로 등록 → channelId 키여도 routeId 로 송신).
function wsChanKey(m) {
  // 채널 = 에이전트 단위(agentId). channelId/threadId 는 채널을 쪼개지 않고 row 출처 뱃지로 표시
  return m.agentId || m.targetAgentId || m.channelId;
}
function wsChanLabel(m) {   // row 출처 뱃지 — 에이전트 통합 채널 안에서 대화 출처(channelId/threadId) 구분, 길면 축약
  const cid = m.channelId; if (!cid) return '';
  const tid = m.threadId;
  if (!tid || tid === cid) return cid;
  const segs = String(tid).split(':').filter((s) => s && s !== 'agent' && s !== 'main').map((s) => /^-?\d+$/.test(s) ? s.slice(-4) : s);
  return cid + '·' + segs.slice(-3).join(':');
}
function wsChanFull(m) { return (m.channelId && m.threadId && m.threadId !== m.channelId) ? m.channelId + ':' + m.threadId : (m.channelId || ''); }
function wsChanEl(row) { const c = el('span', 'ws-chan'); c.textContent = row.chan; if (row.chanFull) c.title = row.chanFull; return c; }
function wsSrcEl(row) {   // A2A 방향 뱃지 — 각 에이전트 이름을 role 색(업스트림 주황·메인 보라·로컬 녹색)으로
  const s = el('span', 'ws-src');
  const mk = (id) => { const sp = el('span', 'r-' + wsRoleOf(id)); sp.textContent = wsName(id); return sp; };
  s.append(mk(row.src.from), document.createTextNode(' → '), mk(row.src.to));
  s.title = wsName(row.src.from) + ' → ' + wsName(row.src.to);
  return s;
}
function wsChannel(key, name, meta) {
  let ch = wsState.channels.get(key);
  if (!ch) {
    ch = { name: name || key, rows: [], unseen: 0, agentSeen: false, runId: null, seq: null, msgBuf: Object.create(null), toolBuf: Object.create(null), debug: [], routeId: key, channelId: null, threadId: null, projectName: '', githubRepo: '', connStatus: '', hidden: wsLoadHidden().indexOf(key) >= 0 };
    wsState.channels.set(key, ch);
    if (!wsState.active && !ch.hidden && !wsState.replaying) wsState.active = key;   // 재생 중엔 active 고정 안 함 → 재생 후 메인 우선 선택(wsReplayHistory)
    if (!wsState.replaying) wsRenderTabs();
  } else if (name && name !== key && ch.name !== name) { ch.name = name; if (!wsState.replaying) wsRenderTabs(); }
  if (meta) {   // project/channel scoped 메타 갱신(§4·§6)
    if (meta.routeId) ch.routeId = meta.routeId;
    if (meta.channelId != null) ch.channelId = meta.channelId;
    if (meta.threadId != null) ch.threadId = meta.threadId;
    if (meta.projectName) ch.projectName = meta.projectName;
    if (meta.githubRepo) ch.githubRepo = meta.githubRepo;
  }
  return ch;
}
function wsSyncAgents(agents) {
  wsState.present = new Set(agents.map(a => a.agentId));
  let anyUnhidden = false;
  for (const a of agents) {
    const c = wsChannel(a.agentId, a.agentName);
    c.role = (wsBackends[a.agentId] && wsBackends[a.agentId].role) || a.role || 'local';   // §13.1 role; C1: backends.json overlay 가 board-worker 등 선언 role 우선
    if (c.hidden) { c.hidden = false; anyUnhidden = true; }   // FIX: agent 가 AgentList 에 present 면 닫힌 탭에서 자동 복원 (새로고침 후 업스트림 등이 archived stub 으로 처리됐다가 실제 연결돼 있을 때)
  }
  if (anyUnhidden) { wsSaveHidden(); wsRenderArchived(); }
  if (!wsState.active && agents.length) wsState.active = agents[0].agentId;
  wsRenderTabs(); updateWsConn();
}

// ---- 미니 마크다운 렌더 (deps0, esc 선행 — 대화(text/user)에만 적용) ----
function wsMd(src) {
  if (!src) return '';
  const cb = [];
  let s = String(src).replace(/```[^\n]*\n?([\s\S]*?)```/g, function (_, code) { cb.push(code.replace(/\n+$/, '')); return '@@CB' + (cb.length - 1) + 'BC@@'; });
  s = esc(s);
  s = s.replace(/`([^`\n]+)`/g, '<code class="ws-code">$1</code>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = s.split('\n'); const out = []; let inList = false;
  const closeList = function () { if (inList) { out.push('</ul>'); inList = false; } };
  for (const ln of lines) {
    const mH = ln.match(/^(#{1,6})\s+(.*)$/);
    const mL = ln.match(/^\s*[-*]\s+(.*)$/);
    if (mH) { closeList(); out.push('<div class="ws-md-h">' + mH[2] + '</div>'); }
    else if (mL) { if (!inList) { out.push('<ul class="ws-md-ul">'); inList = true; } out.push('<li>' + mL[1] + '</li>'); }
    else { closeList(); out.push(ln); }
  }
  closeList();
  s = out.join('\n');
  s = s.replace(/@@CB(\d+)BC@@/g, function (_, i) { return '<pre class="ws-pre"><code>' + esc(cb[+i]) + '</code></pre>'; });
  s = s.replace(/\n/g, '<br>');
  s = s.replace(/(<\/(?:pre|ul|div)>)<br>/g, '$1').replace(/<br>(<(?:pre|ul|div|li))/g, '$1');
  return s;
}

// ---- 대화 기록 = 서버 보관. 접속 시 History(active full + cold/archived stub) → 재생 복원, 나머지는 lazy ----
function wsReplayHistory(events, cold, archived) {
  const keep = new Map(); for (const [id, c] of wsState.channels) keep.set(id, { role: c.role, name: c.name });   // AgentList(먼저 수신)로 설정된 role/name 보존 — a2a 모니터 분류(§13.5)가 role 참조
  wsState.channels.clear(); wsState.active = null;
  for (const t of wsState.textareas.values()) t.remove(); wsState.textareas.clear();   // 채널 입력란 리셋(draft 는 localStorage 유지·재생성 시 복원)
  wsState.replaying = true;
  for (const [id, mt] of keep) { const c = wsChannel(id, mt.name); if (mt.role) c.role = mt.role; }   // 선복원 → 재생 중 wsRoleOf 정확(모니터 Up↔Main/Main↔Local 분류)
  for (const ev of (events || [])) { try { onWsEvent(ev); } catch {} }
  // C(lazy): cold(끊긴)·archived(닫은) 채널은 stub 만 생성 — 탭/드롭다운 표시, 내용은 탭 클릭·복원 시 on-demand
  // role 부여(탭 그룹 byRole 분류용) — server 는 끊긴 채널 role 미보유 → 채널키 기반 기본(local-ide=main, 그 외 local)
  for (const c of (cold || [])) { const ch = wsChannel(c.key); ch._cold = true; ch._loaded = false; ch._count = c.count; if (!ch.role) ch.role = wsRoleOf(c.key); }
  for (const c of (archived || [])) { const ch = wsChannel(c.key); ch._cold = true; ch._loaded = false; ch._count = c.count; ch.hidden = true; if (!ch.role) ch.role = wsRoleOf(c.key); }
  wsState.replaying = false;
  if (archived && archived.length) wsSaveHidden();
  if (wsState.channels.size) {
    let saved = null; try { saved = localStorage.getItem(WS_ACTIVE_KEY); } catch {}   // 새로고침 시 마지막 탭 복원 (탭별 draft 는 wsSaveDrafts 가 별도 영속). FIX: saved 가 valid 면 wsChannel() 자동 active 무시하고 saved 우선 적용.
    const savedOk = saved && (
      (wsState.channels.has(saved) && !wsState.channels.get(saved).hidden) ||
      (wsIsGroup(saved) && wsGroupMembers(saved).length)
    );
    if (savedOk) wsState.active = saved;
    else if (!wsState.active) {
      if (wsState.channels.has(WS_LOCAL) && !wsState.channels.get(WS_LOCAL).hidden) wsState.active = WS_LOCAL;   // 기본 활성 = 메인(로컬 IDE) 우선
      else { for (const [id, c] of wsState.channels) { if (!c.hidden && !wsIsMon(id)) { wsState.active = id; break; } } if (!wsState.active) wsState.active = wsState.channels.keys().next().value; }
    }
  }
  wsRenderTabs(); wsRenderActiveStream(); updateWsConn(); updateWsBadge();
  if (wsState.active) wsShowTextarea(wsState.active);   // FIX: 새로고침 복원 시 활성 채널의 textarea 생성·표시·draft 적용 (wsTextareaFor 가 wsDrafts[key] 에서 값 가져옴). 기존엔 wsSetActive 만 wsShowTextarea 호출 → wsReplayHistory 복원 경로에서 textarea 누락.
  if (wsState.debugOpen) wsRenderDebug();
  if (wsState.active) wsMaybeRequestHistory(wsState.active);   // active 가 cold stub 이면 즉시 내용 로드
}
function wsMaybeRequestHistory(id) {   // C: cold stub 채널을 처음 열 때 server 에 내용 on-demand 요청
  if (!id || wsIsGroup(id) || wsIsMon(id)) return;
  const ch = wsState.channels.get(id);
  if (!ch || !ch._cold || ch._loaded || ch.rows.length) return;
  const ws = wsState.ws; if (!ws || ws.readyState !== 1) return;
  ch._loaded = true;
  try { ws.send(JSON.stringify({ ...wsCommon(), type: 'CUSTOM', name: 'RequestChannelHistory', value: { channelKey: ch.routeId || id } })); } catch { ch._loaded = false; }
}
function wsReplayChannelHistory(channelKey, events) {   // C: on-demand 로 받은 한 채널 내용 재생(D: cold 복원도 이 경로)
  if (!channelKey) return;
  const ch = wsState.channels.get(channelKey);
  if (ch) { ch.rows = []; ch.debug = []; ch._cold = false; ch._loaded = true; }
  wsState.replaying = true;
  for (const ev of (events || [])) { try { onWsEvent(ev); } catch {} }
  wsState.replaying = false;
  wsRenderTabs();
  const a = wsState.active;
  if (a === channelKey || (wsIsGroup(a) && wsGroupMembers(a).indexOf(channelKey) >= 0)) wsRenderActiveStream();
  updateWsConn(); updateWsBadge();
  if (wsState.debugOpen) wsRenderDebug();
}
// ✕ 닫기 = 아카이브(숨김). 대화 내역은 서버 history 에 유지(닫아도 사라지지 않음·재연결 복원). "닫은 세션" 드롭다운으로 복원.
const WS_HIDDEN = 'constellation-ws-hidden';
function wsLoadHidden() { try { const a = JSON.parse(localStorage.getItem(WS_HIDDEN) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }
function wsSaveHidden() { try { localStorage.setItem(WS_HIDDEN, JSON.stringify([...wsState.channels.entries()].filter(([, c]) => c.hidden).map(([id]) => id))); } catch {} }
function wsCloseChannel(id) {
  const ch = wsState.channels.get(id); if (!ch) return;
  ch.hidden = true;
  // D: server 에 아카이브 통지 → active 파일을 archived/(cold)로 이동(active 스캔·cap 제외). 모니터·그룹은 대상 아님
  if (!wsIsMon(id) && !wsIsGroup(id)) { const ws = wsState.ws; if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify({ ...wsCommon(), type: 'CUSTOM', name: 'ArchiveChannel', value: { agentId: ch.routeId || id } })); } catch {} } }
  if (wsState.active === id) wsState.active = [...wsState.channels.keys()].find((k) => k !== id && !wsState.channels.get(k).hidden && !wsIsMon(k)) || null;
  wsSaveHidden();
  wsRenderTabs(); wsRenderArchived(); wsRenderActiveStream(); updateWsConn(); updateWsBadge();
}
function wsRestoreChannel(id) {
  const ch = wsState.channels.get(id); if (!ch) return;
  ch.hidden = false; wsSaveHidden();
  const menu = $('#ws-arch-menu'); if (menu) menu.hidden = true;
  wsSetActive(id);   // 복원하며 활성화(렌더 포함)
  wsRenderArchived();
}
function wsRenderArchived() {   // "닫은 세션" 버튼 + 드롭다운 — 닫은(hidden) 채널 목록, 선택 시 복원
  const btn = $('#ws-arch-btn'), menu = $('#ws-arch-menu'); if (!btn || !menu) return;
  const hidden = [...wsState.channels.entries()].filter(([id, c]) => c.hidden && !wsIsMon(id));
  btn.hidden = false;   // v2.3.23: 항상 표시 (닫은 세션 0개일 때도 카운터 보임 — 사용자 발견성 향상)
  btn.textContent = '📂 ' + hidden.length;
  menu.innerHTML = '';
  if (!hidden.length) {
    const empty = el('div', 'ws-arch-empty'); empty.textContent = '닫은 세션이 없어요';
    menu.appendChild(empty); return;
  }
  for (const [id, c] of hidden) {
    const item = el('div', 'ws-arch-item');
    const present = wsState.present.has(c.routeId || id);   // 현재 연결 여부 — 닫힌 세션도 에이전트가 다시 붙어 있으면 표시
    const dot = el('span', 'ws-arch-dot' + (present ? ' on' : ''));
    dot.title = present ? '현재 연결됨' : '연결 끊김(닫힌 세션)';
    const lbl = el('span', 'ws-arch-lbl'); lbl.textContent = (c.name || id) + (c.role && c.role !== 'local' ? ' · ' + c.role : '');
    lbl.title = '복원: ' + id; lbl.onclick = () => wsRestoreChannel(id);
    const del = el('span', 'ws-arch-del'); del.textContent = '🗑'; del.title = '이 세션 기록 영구 삭제';
    del.onclick = (e) => { e.stopPropagation(); wsDeleteChannel(id, c.name || id); };
    item.append(dot, lbl, del);
    menu.appendChild(item);
  }
  const all = el('div', 'ws-arch-all');
  const ab = el('button', 'ws-arch-allbtn'); ab.type = 'button'; ab.textContent = '🗑 전체 삭제 (' + hidden.length + ')';
  ab.onclick = (e) => { e.stopPropagation(); wsDeleteAllChannels(); };
  all.appendChild(ab); menu.appendChild(all);
}
async function wsDeleteChannel(id, name) {   // 개별 기록 삭제 — wsConfirm 후 server 통지 + 로컬 채널 제거
  if (!(await wsConfirm(`'${name}' 세션 기록을 영구 삭제할까요? 복원할 수 없어요.`, { title: '세션 기록 삭제', danger: true, okLabel: '삭제' }))) return;
  const ws = wsState.ws; if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify({ ...wsCommon(), type: 'CUSTOM', name: 'DeleteChannelHistory', value: { agentId: id } })); } catch {} }
  wsState.channels.delete(id);
  if (wsState.active === id) wsState.active = [...wsState.channels.keys()].find((k) => !wsState.channels.get(k).hidden && !wsIsMon(k)) || null;
  wsSaveHidden(); wsRenderTabs(); wsRenderArchived(); wsRenderActiveStream(); updateWsConn(); updateWsBadge();
}
async function wsDeleteAllChannels() {   // 전체삭제 — 닫은 세션 전부 영구 삭제 (wsConfirm)
  const hidden = [...wsState.channels.entries()].filter(([id, c]) => c.hidden && !wsIsMon(id));
  if (!hidden.length) return;
  if (!(await wsConfirm(`닫은 세션 ${hidden.length}개 기록을 모두 영구 삭제할까요? 복원할 수 없어요.`, { title: '전체 세션 기록 삭제', danger: true, okLabel: '전체 삭제' }))) return;
  const ws = wsState.ws; if (ws && ws.readyState === 1) { for (const [id] of hidden) { try { ws.send(JSON.stringify({ ...wsCommon(), type: 'CUSTOM', name: 'DeleteChannelHistory', value: { agentId: id } })); } catch {} } }
  for (const [id] of hidden) { if (wsState.active === id) wsState.active = null; wsState.channels.delete(id); }
  if (!wsState.active) wsState.active = [...wsState.channels.keys()].find((k) => !wsState.channels.get(k).hidden && !wsIsMon(k)) || null;
  wsSaveHidden(); wsRenderTabs(); wsRenderArchived(); wsRenderActiveStream(); updateWsConn(); updateWsBadge();
  const menu = $('#ws-arch-menu'); if (menu) menu.hidden = true;
}

// ---- TOOL_CALL aggregate 카드 (toolCallId 기준 start/args/end/result 한 카드) ----
// display.kind/status/title/subtitle/summary/compact + argsPreview/resultPreview 우선 렌더(핸드오프 §3)
const WS_TOOL_ICON = { read: '📖', write: '✏️', edit: '✏️', search: '🔍', grep: '🔍', shell: '⌨️', bash: '⌨️', web: '🌐', fetch: '🌐', file: '📄' };
function wsToolStat(s) {
  s = (s || 'running').toLowerCase();
  if (s === 'error' || s === 'failed' || s === 'denied') return ['err', '⚠ ' + (s === 'denied' ? '거부됨' : '실패')];
  if (s === 'running' || s === 'pending' || s === 'in_progress' || s === 'started') return ['running', '● 실행 중'];
  return ['done', '✓ 완료'];
}
// ---- A2A-intent CUSTOM 카드 (Report·BlockerManifest·ReviewSLAAck·PR* / Deadlock* family — §13.16.9 allowlist) ----
// 이전엔 ✦ <name> 단일 text row(+hover full)로 흘러 "raw/TEXT" 로 보였다. 이제 아이콘 + envelope summary + 펼침 details 카드.
// raw JSON 은 timeline 에 직접 노출하지 않음(§1) — 의미 필드만 key/value 로, 전체 원본은 debug drawer.
const WS_A2A_INTENT = {   // name → { icon, label, summaryKeys[] } (summaryKeys: 한 줄 요약 후보, 앞에서부터 첫 비어있지 않은 값)
  Report:            { icon: '📄', label: 'Report',        sum: ['re', 'subject', 'summary', 'status'] },
  BlockerManifest:   { icon: '🚧', label: 'Blocker',       sum: ['re', 'subject', 'summary', 'reason', 'status'] },
  BlockerNudge:      { icon: '🚧', label: 'Blocker nudge', sum: ['re', 'subject', 'reason', 'summary', 'status'] },
  ReviewSLAAck:      { icon: '⏱', label: 'SLA ack',        sum: ['re', 'subject', 'kind', 'commitment', 'status'] },
  PRRequest:         { icon: '🔀', label: 'PR 요청',       sum: ['re', 'subject', 'title', 'summary', 'sourceRepo'] },
  PRMergeRequest:    { icon: '🔀', label: 'PR 머지 요청',  sum: ['re', 'subject', 'title', 'summary', 'targetRepo'] },
  PRDraftReady:      { icon: '🔀', label: 'PR draft',      sum: ['re', 'subject', 'draftRef', 'summary', 'status'] },
  PRRequestRejected: { icon: '🚫', label: 'PR 반려',       sum: ['reason', 're', 'subject', 'suggest', 'status'] },
  PRMergeAck:        { icon: '✅', label: 'PR 머지 ack',   sum: ['re', 'subject', 'status', 'prUrl', 'summary'] },
  PRMergeRejected:   { icon: '🚫', label: 'PR 머지 반려',  sum: ['reason', 're', 'subject', 'status'] },
  PRStatusUpdate:    { icon: '🔃', label: 'PR 상태',       sum: ['status', 're', 'subject', 'prUrl', 'summary'] },
  DeadlockProbe:     { icon: '🔁', label: 'Deadlock probe', sum: ['reason', 're', 'trigger', 'subject', 'status'] },
  PreemptRequest:    { icon: '🔁', label: 'Preempt 요청',  sum: ['re', 'subject', 'reason', 'target', 'status'] },
  PreemptForce:      { icon: '🔁', label: 'Preempt 강제',  sum: ['re', 'subject', 'reason', 'target', 'status'] },
  MediationProposal: { icon: '⚖️', label: 'Mediation 제안', sum: ['re', 'subject', 'proposal', 'summary', 'status'] },
  MediationAck:      { icon: '⚖️', label: 'Mediation ack', sum: ['re', 'subject', 'status', 'summary'] },
  EscalationRequest: { icon: '⚠️', label: 'Escalation 요청', sum: ['re', 'subject', 'reason', 'tier', 'status'] },
  EscalationSurfaced:{ icon: '⚠️', label: 'Escalation', sum: ['re', 'subject', 'reason', 'tier', 'decisionId', 'status'] },
  // 코디네이션 메시지 — 이전엔 text/user/ok row 였으나 카드로 통일 (카드 미표시 항목도 카드화). re > summary 우선.
  Delegate:          { icon: '📋', label: '위임',     sum: ['re', 'subject', 'summary', 'reason', 'task', 'notice'] },
  WorkerReport:      { icon: '📤', label: '보고',     sum: ['re', 'subject', 'summary', 'done', 'status', 'note', 'notice'] },
  WorkerAck:         { icon: '📥', label: 'ack',      sum: ['re', 'subject', 'ack', 'summary', 'note', 'notice'] },
  OnboardAck:        { icon: '🤝', label: '온보딩',   sum: ['re', 'welcome', 'guide', 'summary', 'policy'] },
  AgentHello:        { icon: '👋', label: '합류',     sum: ['agentName', 'note', 'agentId', 'env'] },
};
function wsA2aSummary(spec, v) {   // summary 1줄 — spec.sum 키 순서대로 첫 비어있지 않은 문자열
  if (v == null) return '';
  if (typeof v === 'string') return v;
  for (const k of (spec.sum || [])) { const s = v[k]; if (s != null && String(s).trim() !== '' && (typeof s === 'string' || typeof s === 'number')) return String(s); }
  return '';
}
// §13.16.12 Pattern 7 fallback — 미정합 adopter 가 A2A Report 를 envelope 대신 TEXT_MESSAGE.text 에
// [자연어 + ```json{...}``` ] 직렬화로 보낼 때 코드블록 JSON 을 파싱해 A2A-intent 면 a2acard 로 승격(raw text 깨짐 방지).
function wsExtractA2aReport(text) {
  if (!text || typeof text !== 'string') return null;
  const m = text.match(/```(?:json)?\s*\n?(\{[\s\S]*?\})\s*```/);
  if (!m) return null;
  let obj; try { obj = JSON.parse(m[1]); } catch { return null; }
  if (!obj || typeof obj !== 'object') return null;
  const name = (obj.name && obj.name !== 'CUSTOM') ? obj.name : obj.type;   // structured CUSTOM wrapper {type:"CUSTOM",name:"Report"} 도 잡음 + {type:"Report"} fallback
  if (!name || !WS_A2A_INTENT[name]) return null;
  const prefix = text.slice(0, m.index).replace(/\[A2A Report[^\]]*\]/gi, '').trim();
  return { name, value: obj, prefix };
}
function wsA2aCardEl(row) {
  const a = row.a2a || {};
  const spec = a.spec || { icon: '✦', label: a.name || 'CUSTOM', sum: [] };
  const v = a.value || {};
  const card = el('div', 'ws-a2a');
  const head = el('div', 'ws-a2a-h');
  const ic = el('span', 'ws-a2a-ic'); ic.textContent = spec.icon || '✦';
  const nm = el('span', 'ws-a2a-name'); nm.textContent = spec.label || a.name || 'CUSTOM';
  const sm = el('span', 'ws-a2a-sum'); sm.textContent = a.summary || '';
  head.append(ic, nm, sm);
  card.append(head);
  // details — value 의 의미 필드 key/value (요약으로 이미 보인 키 포함, 전체 envelope 의 가독 뷰). raw 원본은 debug drawer.
  // 헤더 hover/클릭은 wsRowHover(미리보기 + 단독 플로팅 창) 전용 — collapse 는 최우측 별도 ▸/▾ 버튼으로만(충돌 방지: 버튼 onclick 에서 e.stopPropagation).
  const fields = (v && typeof v === 'object' && !Array.isArray(v)) ? Object.entries(v).filter(([k]) => k !== 'type') : null;
  if (fields && fields.length) {
    const body = el('div', 'ws-a2a-body');
    for (const [k, val] of fields) {
      const r = el('div', 'ws-a2a-row');
      const kk = el('span', 'ws-a2a-k'); kk.textContent = k;
      const vv = el('span', 'ws-a2a-v');
      vv.textContent = (val == null) ? '' : (typeof val === 'string' ? val : (Array.isArray(val) ? val.map(z => typeof z === 'string' ? z : JSON.stringify(z)).join('\n') : JSON.stringify(val, null, 2)));
      r.append(kk, vv); body.append(r);
    }
    card.append(body);
    { const _atts = wsAttachments(row.full); if (_atts.length) { const ab = el('div', 'ws-att-row'); for (const a of _atts) ab.appendChild(wsAttChipEl(a)); card.append(ab); } }   // A2A 카드 첨부 칩(접힘 무관 항상 표시)
    const expanded = !!row._expanded;
    body.hidden = !expanded;
    const tg = el('button', 'ws-a2a-toggle'); tg.type = 'button';
    tg.textContent = '◀'; tg.classList.toggle('expanded', expanded);
    tg.title = expanded ? '접기' : '펼치기'; tg.setAttribute('aria-label', tg.title); tg.setAttribute('aria-expanded', String(expanded));
    tg.onclick = (ev) => {
      ev.stopPropagation(); ev.preventDefault();
      row._expanded = body.hidden; body.hidden = !body.hidden;
      tg.classList.toggle('expanded', !body.hidden);
      tg.title = body.hidden ? '펼치기' : '접기'; tg.setAttribute('aria-label', tg.title); tg.setAttribute('aria-expanded', String(!body.hidden));
    };
    head.append(tg);
  }
  return card;
}
function wsToolMergeDisplay(tool, d) {
  if (!d) return;
  if (d.kind != null) tool.dkind = d.kind;
  if (d.status != null) tool.status = d.status;
  if (d.title != null) tool.title = d.title;
  if (d.subtitle != null) tool.subtitle = d.subtitle;
  if (d.summary != null) tool.summary = d.summary;
  if (d.compact != null) tool.compact = !!d.compact;
}
function wsToolKV(k, txt) {
  const kv = el('div', 'ws-tool-kv');
  const lab = el('span', 'ws-tool-kk'); lab.textContent = k;
  const pre = el('pre', 'ws-tool-pre'); pre.textContent = wsTrunc(txt, 600);
  kv.append(lab, pre); return kv;
}
function wsToolCardEl(row) {
  const tl = row.tool;
  const [scls, slabel] = wsToolStat(tl.status);
  const card = el('div', 'ws-tool ' + scls + (tl.compact ? ' compact' : ''));
  const head = el('div', 'ws-tool-h');
  const ic = el('span', 'ws-tool-ic'); ic.textContent = WS_TOOL_ICON[(tl.dkind || tl.name || '').toLowerCase()] || '🔧';
  const ti = el('span', 'ws-tool-title'); ti.textContent = (tl.title || tl.name || tl.toolCallId || 'tool');
  const st = el('span', 'ws-tool-st ' + scls); st.textContent = slabel;
  head.append(ic, ti, st);
  card.append(head);
  if (tl.subtitle) { const sub = el('div', 'ws-tool-sub'); sub.textContent = tl.subtitle; card.append(sub); }
  if (tl.summary) { const sm = el('div', 'ws-tool-sum'); sm.textContent = tl.summary; card.append(sm); }
  const argTxt = tl.argsPreview || (tl.args != null ? wsFmtVal(tl.args) : '');
  const resTxt = tl.resultPreview || (tl.result != null ? wsFmtVal(tl.result) : '');
  if (argTxt || resTxt) {
    const body = el('div', 'ws-tool-body');
    if (argTxt) body.append(wsToolKV('args', argTxt));
    if (resTxt) body.append(wsToolKV('result', resTxt));
    card.append(body);
    // compact 면 기본 접힘 — 헤더 클릭으로 펼침(상태는 row._expanded 에 보존)
    const expanded = tl.compact ? !!row._expanded : true;
    body.hidden = !expanded;
    if (tl.compact) {
      const cv = el('span', 'ws-tool-cv'); cv.textContent = expanded ? '⌄' : '›'; head.append(cv);
      head.style.cursor = 'pointer';
      head.onclick = () => { row._expanded = body.hidden; body.hidden = !body.hidden; cv.textContent = body.hidden ? '›' : '⌄'; };
    }
  }
  return card;
}
function wsUpdateTool(row) {
  if (wsState.replaying) return;
  if (!row._card || !row._card.parentNode) return;   // 활성·팝업 열림일 때만 in-place(아니면 row.tool 데이터만 갱신, 활성화 시 재렌더)
  const fresh = wsToolCardEl(row); row._card.replaceWith(fresh); row._card = fresh;
  const s = $('#ws-stream'); if (s) s.scrollTop = s.scrollHeight;
}

// ---- CUSTOM/Attachment 수신 카드 (image/audio/video/file, mock 선구현 — 핸드오프 §6) ----
// 보안: raw local path 는 절대 노출 안 함. url+available 일 때만 로드, blocked/failed 는 안전 표시.
const WS_ATT_ICON = { image: '🖼', audio: '🎵', video: '🎬', file: '📄' };
function wsAttachCardEl(row) {
  const v = row.att || {};
  const kind = String(v.kind || 'file').toLowerCase();
  const status = String(v.status || 'available').toLowerCase();
  const ok = status === 'available' && !!v.url;   // url 있고 available 일 때만 미디어 로드(허용 목록 통과 가정)
  const card = el('div', 'ws-att ' + kind + ' ' + (ok ? 'ok' : status));
  const head = el('div', 'ws-att-h');
  const ic = el('span', 'ws-att-ic'); ic.textContent = WS_ATT_ICON[kind] || '📄';
  const nm = el('span', 'ws-att-name'); nm.textContent = (v.filename || v.attachmentId || 'attachment');
  head.append(ic, nm);
  if (v.mimeType) { const mt = el('span', 'ws-att-mime'); mt.textContent = v.mimeType; head.append(mt); }
  if (!ok) { const st = el('span', 'ws-att-st ' + status); st.textContent = status === 'blocked' ? '🔒 차단됨' : status === 'failed' ? '⚠ 실패' : '대기'; head.append(st); }
  card.append(head);
  if (ok) {
    const body = el('div', 'ws-att-body');
    if (kind === 'image') { const img = el('img', 'ws-att-img'); img.src = v.url; img.alt = v.filename || ''; img.loading = 'lazy'; body.append(img); }
    else if (kind === 'audio') { const a = el('audio'); a.controls = true; a.src = v.url; a.preload = 'none'; body.append(a); }
    else if (kind === 'video') { const vd = el('video', 'ws-att-video'); vd.controls = true; vd.src = v.url; vd.preload = 'none'; body.append(vd); }
    else { const lk = el('a', 'ws-att-link'); lk.href = v.url; lk.target = '_blank'; lk.rel = 'noopener noreferrer'; lk.textContent = '⬇ 열기 / 다운로드'; body.append(lk); }
    card.append(body);
  } else {
    const safe = el('div', 'ws-att-safe'); safe.textContent = status === 'blocked' ? '허용 목록 밖 파일 — 미리보기 차단됨' : status === 'failed' ? '전송 실패' : '미리보기를 사용할 수 없어요';
    card.append(safe);
  }
  if (v.caption) { const cap = el('div', 'ws-att-cap'); cap.textContent = v.caption; card.append(cap); }
  return card;
}

// ---- A2A/대화 row hover 팝업 (커서 4분면 방향, full value 보기 좋게 렌더) ----
let wsPopEl = null, wsPopPinned = false;
function wsFullHtml(label, v, pinned) {
  const xb = pinned ? '<button class="ws-pop-x" title="닫기" aria-label="닫기">✕</button>' : '';
  const head = `<div class="ws-pop-h">${xb}${esc(label || '')}</div>`;
  if (v == null) return head;
  if (typeof v === 'string') return head + `<div class="ws-pop-v">${esc(v)}</div>`;
  const rows = Object.entries(v).map(([k, val]) => {
    const s = (val == null) ? '' : (typeof val === 'string' ? val : (Array.isArray(val) ? val.map(z => typeof z === 'string' ? z : JSON.stringify(z)).join('\n') : JSON.stringify(val, null, 2)));
    return `<div class="ws-pop-row"><span class="ws-pop-k">${esc(k)}</span><span class="ws-pop-val">${esc(s)}</span></div>`;
  }).join('');
  return head + rows;
}
function wsHoverPop(label, full, x, y, pin) {
  if (!wsPopEl) { wsPopEl = el('div', 'ws-hover-pop'); document.body.appendChild(wsPopEl); }
  wsPopPinned = !!pin;
  wsPopEl.classList.toggle('pinned', wsPopPinned);
  wsPopEl.innerHTML = wsFullHtml(label, full, wsPopPinned);
  if (wsPopPinned) { const xb = wsPopEl.querySelector('.ws-pop-x'); if (xb) xb.addEventListener('click', (ev) => { ev.stopPropagation(); wsHidePop(); }); const hh = wsPopEl.querySelector('.ws-pop-h'); if (hh) wsPopDragSetup(hh); }
  wsPopEl.style.visibility = 'hidden'; wsPopEl.style.display = 'block'; wsPopEl.style.left = '0px'; wsPopEl.style.top = '0px';
  const r = wsPopEl.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  const right = x > vw / 2, bottom = y > vh / 2;   // 커서 4분면 → 팝업을 반대 방향(가림 방지)
  let px = right ? (x - r.width - 14) : (x + 14);
  let py = bottom ? (y - r.height - 14) : (y + 14);
  px = Math.max(6, Math.min(px, vw - r.width - 6));
  py = Math.max(6, Math.min(py, vh - r.height - 6));
  wsPopEl.style.left = px + 'px'; wsPopEl.style.top = py + 'px'; wsPopEl.style.visibility = 'visible';
}
function wsHidePop() { if (wsPopEl) { wsPopEl.style.display = 'none'; wsPopEl.classList.remove('pinned'); } wsPopPinned = false; }
// 고정(창 상태) 팝업: 헤더 드래그로 이동 (닫기 ✕ 은 드래그 제외, 뷰포트 clamp)
function wsPopDragSetup(handle) {
  handle.addEventListener('mousedown', (ev) => {
    if (ev.button !== 0 || (ev.target && ev.target.closest && ev.target.closest('.ws-pop-x'))) return;
    ev.preventDefault();
    const r = wsPopEl.getBoundingClientRect();
    const offX = ev.clientX - r.left, offY = ev.clientY - r.top;
    const move = (e) => {
      let px = e.clientX - offX, py = e.clientY - offY;
      px = Math.max(6, Math.min(px, innerWidth - wsPopEl.offsetWidth - 6));
      py = Math.max(6, Math.min(py, innerHeight - wsPopEl.offsetHeight - 6));
      wsPopEl.style.left = px + 'px'; wsPopEl.style.top = py + 'px';
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
}
function wsRowHover(e, row) {
  e.classList.add('ws-has-pop');
  e.addEventListener('mouseenter', (ev) => { if (!wsPopPinned) wsHoverPop(row.label, row.full, ev.clientX, ev.clientY, false); });   // hover: 미고정일 때만 미리보기
  e.addEventListener('mouseleave', () => { if (!wsPopPinned) wsHidePop(); });   // 고정 상태면 mouseleave 무시
  e.addEventListener('click', (ev) => { ev.stopPropagation(); wsHoverPop(row.label, row.full, ev.clientX, ev.clientY, true); });   // 클릭 = 고정(pin) — 닫기(✕) 로만 해제
}

// ---- row 렌더 (활성 채널만 DOM, 그 외 데이터+뱃지) ----
function wsRowEl(row, showChan = true) {   // showChan: 출처 뱃지 표시 여부(전체 보기=true, 개별 채널 필터=false)
  if (row.kind === 'toolcard') {
    const wrap = el('div', 'ws-ev ws-toolrow');
    const t = el('span', 'ws-t'); t.textContent = row.t;
    const c = wsToolCardEl(row); row._card = c;
    wrap.append(t); if (row.src) wrap.append(wsSrcEl(row)); if (row.chan && showChan) wrap.append(wsChanEl(row)); wrap.append(c); return wrap;
  }
  if (row.kind === 'attach') {
    const wrap = el('div', 'ws-ev ws-attrow');
    const t = el('span', 'ws-t'); t.textContent = row.t;
    wrap.append(t); if (row.src) wrap.append(wsSrcEl(row)); if (row.chan && showChan) wrap.append(wsChanEl(row)); wrap.append(wsAttachCardEl(row)); return wrap;
  }
  if (row.kind === 'a2acard') {   // A2A-intent CUSTOM 카드(Report·Blocker·PR*·Deadlock* — §13.16.9)
    const wrap = el('div', 'ws-ev ws-a2arow');
    const t = el('span', 'ws-t'); t.textContent = row.t;
    wrap.append(t); if (row.src) wrap.append(wsSrcEl(row)); if (row.chan && showChan) wrap.append(wsChanEl(row)); wrap.append(wsA2aCardEl(row));
    if (row.full) wsRowHover(wrap, row);   // 다른 A2A row 와 동일: hover→미리보기, 클릭→단독 플로팅 창(최우측 토글 버튼은 stopPropagation 으로 제외)
    return wrap;
  }
  if (row.kind === 'selection') {   // #406 UI6 SelectionPrompt chip 카드
    const wrap = el('div', 'ws-ev ws-selrow');
    const t = el('span', 'ws-t'); t.textContent = row.t;
    wrap.append(t); if (row.chan && showChan) wrap.append(wsChanEl(row)); const c = wsSelectionCardEl(row); row._sel = c; wrap.append(c); return wrap;
  }
  const e = el('div', 'ws-ev' + (row.kind === 'user' ? ' ws-userline' : '') + (row.kind === 'status' ? ' ws-statusline' : ''));
  const t = el('span', 'ws-t'); t.textContent = row.t;
  const k = el('span', 'ws-k ' + row.kind); k.textContent = row.label;
  const md = row.kind === 'text' || row.kind === 'user';   // 대화 내용만 마크다운 렌더
  const b = el('span', 'ws-body' + (row.dim ? ' dim' : '') + (md ? ' ws-md' : ''));
  if (md) b.innerHTML = wsMd(row.body || ''); else b.textContent = row.body || '';
  e.append(t); if (row.src) e.append(wsSrcEl(row)); if (row.chan && showChan) e.append(wsChanEl(row)); e.append(k, b);
  { const _atts = wsAttachments(row.full); if (_atts.length) { const ab = el('div', 'ws-att-row'); for (const a of _atts) ab.appendChild(wsAttChipEl(a)); e.append(ab); } }   // 일반 A2A row 첨부 칩
  row._b = b; row._md = md;
  if (row.full) wsRowHover(e, row);   // 요약 가능한 A2A 메시지(WorkerReport·Delegate 등): hover 시 커서 4분면 팝업에 전체 렌더
  return e;
}
// ---- 날짜 변경선 (A2A 대화 stream 안 일자 구분, sticky top:0) ----
function wsDayKey(ts) { if (!ts) return ''; const d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function wsDayLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
  const base = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  return d.toDateString() === now.toDateString() ? base + ' · 오늘'
       : d.toDateString() === y.toDateString()   ? base + ' · 어제'
       : base;
}
function wsDatelineEl(ts) {
  const dl = el('div', 'ws-dateline');
  const dt = el('span', 'ws-dl-date'); dt.textContent = wsDayLabel(ts);
  dl.append(el('span', 'ws-dl-wave'), dt, el('span', 'ws-dl-wave'));
  return dl;
}
// ---- A2A row 안 첨부(value 의 attachments[]/atts/files/attachment/zip/file 추출 + 칩) — Attachment kind 와 별개(저건 단일 첨부 카드) ----
function wsAttachments(v) {
  if (!v || typeof v !== 'object') return [];
  let list = v.attachments || v.atts || v.files || (v.attachment ? [v.attachment] : (v.zip ? [v.zip] : (v.file ? [v.file] : [])));
  if (!Array.isArray(list)) list = [list];
  return list.filter(a => a && typeof a === 'object' && (a.filename || a.name || a.url || a.dataUrl));
}
function wsAttIcon(mime, name) {
  const m = (mime || '') + ' ' + (name || '');
  if (/image\//.test(mime) || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name || '')) return '🖼';
  if (/zip|tar|gz|7z|rar/i.test(m)) return '🗜';
  if (/pdf/i.test(m)) return '📕';
  if (/audio\//.test(mime)) return '🎵';
  if (/video\//.test(mime)) return '🎬';
  if (/json|javascript|text\/|\.(md|txt|js|ts|json|csv|log|cjs|mjs|html|css|ya?ml)$/i.test(m)) return '📄';
  return '📎';
}
function wsAttChipEl(a) {
  const name = a.filename || a.name || 'file';
  const mime = a.mime || a.type || '';
  const data = a.dataUrl || a.url || null;
  const chip = el('div', 'ws-att-chip');
  const ic = el('span', 'ws-att-ic'); ic.textContent = wsAttIcon(mime, name);
  const info = el('span', 'ws-att-info'); info.textContent = name + (a.size != null ? ' · ' + fmtBytes(a.size) : '');
  if (a.sha256) info.title = 'sha256: ' + a.sha256;
  chip.append(ic, info);
  const isImg = /image\//.test(mime) || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
  const isText = /json|text\/|javascript/.test(mime) || /\.(md|txt|js|ts|json|csv|log|cjs|mjs|html|css|ya?ml)$/i.test(name);
  if (data) {
    if (isImg || isText) { const pv = el('button', 'ws-att-pv'); pv.type = 'button'; pv.textContent = '👁'; pv.title = '미리보기'; pv.onclick = (e) => { e.stopPropagation(); wsAttPreview(name, data, isImg ? 'image' : 'text'); }; chip.append(pv); }
    const dl = el('a', 'ws-att-dl'); dl.textContent = '⬇'; dl.href = data; dl.download = name; dl.title = '다운로드'; dl.onclick = (e) => e.stopPropagation(); chip.append(dl);
  } else { const no = el('span', 'ws-att-no'); no.textContent = a.localPath ? '메타만(원격)' : '데이터 없음'; no.title = a.localPath || '데이터(dataUrl/url) 미동봉'; chip.append(no); }
  return chip;
}
function wsAttPreview(name, data, kind) {
  let modal = document.getElementById('ws-att-modal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'ws-att-modal'; modal.className = 'ws-att-modal'; modal.onclick = (e) => { if (e.target === modal) modal.hidden = true; }; document.body.appendChild(modal); }
  modal.innerHTML = ''; modal.hidden = false;
  const box = el('div', 'ws-att-box');
  const hd = el('div', 'ws-att-mhead'); const tt = el('b'); tt.textContent = name; const x = el('button', 'ws-att-mx'); x.type = 'button'; x.textContent = '✕'; x.onclick = () => { modal.hidden = true; }; hd.append(tt, x);
  const body = el('div', 'ws-att-mbody');
  if (kind === 'image') { const img = el('img'); img.src = data; img.alt = name; body.append(img); }
  else { const pre = el('pre'); pre.textContent = '불러오는 중…'; fetch(data).then(r => r.text()).then(t => { pre.textContent = t.length > 40000 ? t.slice(0, 40000) + '\n…(생략)' : t; }).catch(() => { pre.textContent = '(미리보기 불가)'; }); body.append(pre); }
  box.append(hd, body); modal.append(box);
}
// ---- #406 UI6 SelectionPrompt chip 카드 (에이전트 발 선택지 → 사용자 답/취소 → board→server) ----
function wsSelectionCardEl(row) {
  const s = row.sel || {};
  const answered = s.state === 'ANSWERED', cancelled = s.state === 'CANCELLED';
  const done = answered || cancelled;
  const card = el('div', 'ws-sel ' + (done ? (answered ? 'answered' : 'cancelled') : 'issued'));
  const head = el('div', 'ws-sel-h');
  const ic = el('span', 'ws-sel-ic'); ic.textContent = answered ? '✅' : cancelled ? '✖️' : '❔';
  const txt = el('span', 'ws-sel-text'); txt.textContent = s.text || '선택해 주세요';
  head.append(ic, txt); card.append(head);
  if (cancelled) { const note = el('div', 'ws-sel-note'); note.textContent = '취소됨' + (s.reason ? ' · ' + s.reason : ''); card.append(note); return card; }
  const picked = new Set(s.picked || []);
  const chips = el('div', 'ws-sel-chips');
  for (const o of s.options) {
    const label = o && typeof o === 'object' ? o.label : String(o);
    const chip = el('button', 'ws-sel-chip' + (picked.has(label) ? ' sel' : '') + (answered && (s.picked || []).indexOf(label) >= 0 ? ' chosen' : ''));
    chip.type = 'button'; chip.textContent = label;
    if (o && o.description) chip.title = o.description;
    chip.disabled = done;
    if (!done) chip.onclick = () => {
      if (s.multiSelect) { if (picked.has(label)) picked.delete(label); else picked.add(label); s.picked = [...picked]; const fresh = wsSelectionCardEl(row); row._sel.replaceWith(fresh); row._sel = fresh; }
      else { wsAnswerSelection(row, [label], ''); }
    };
    chips.append(chip);
  }
  card.append(chips);
  if (!done && (s.allowFreeText || s.multiSelect)) {
    const foot = el('div', 'ws-sel-foot');
    let ftInp = null;
    if (s.allowFreeText) { ftInp = el('input', 'ws-sel-ft'); ftInp.placeholder = '직접 입력…'; ftInp.value = s.freeText || ''; ftInp.oninput = () => { s.freeText = ftInp.value; }; foot.append(ftInp); }
    const submit = el('button', 'ws-sel-submit'); submit.type = 'button'; submit.textContent = '답변';
    submit.onclick = () => wsAnswerSelection(row, [...picked], ftInp ? ftInp.value.trim() : '');
    const dismiss = el('button', 'ws-sel-dismiss'); dismiss.type = 'button'; dismiss.textContent = '취소'; dismiss.title = '응답하지 않고 닫기';
    dismiss.onclick = () => wsCancelSelection(row, 'user-dismiss');
    foot.append(submit, dismiss); card.append(foot);
  } else if (!done) {
    const foot = el('div', 'ws-sel-foot');
    const dismiss = el('button', 'ws-sel-dismiss'); dismiss.type = 'button'; dismiss.textContent = '취소';
    dismiss.onclick = () => wsCancelSelection(row, 'user-dismiss');
    foot.append(dismiss); card.append(foot);
  }
  return card;
}
function wsAnswerSelection(row, selectedLabels, freeText) {
  const s = row.sel || {};
  if ((!selectedLabels || !selectedLabels.length) && !(freeText && freeText.trim())) return;   // §3.2 빈 답 금지
  const value = { promptId: s.promptId, selectedLabels: selectedLabels || [], answeredAt: Date.now() };
  if (freeText && freeText.trim()) value.freeText = freeText.trim();
  if (wsSendOrch({ type: 'CUSTOM', name: 'SelectionAnswer', value })) { s.state = 'ANSWERED'; s.picked = selectedLabels || []; wsRefreshSelectionCard(row); }
}
function wsCancelSelection(row, reason) {
  const s = row.sel || {};
  if (wsSendOrch({ type: 'CUSTOM', name: 'SelectionCancel', value: { promptId: s.promptId, reason: reason || 'user-dismiss' } })) { s.state = 'CANCELLED'; s.reason = reason; wsRefreshSelectionCard(row); }
}
function wsRefreshSelectionCard(row) {   // chip 카드 in-place 재렌더(현 DOM 에 있으면)
  if (row._sel && row._sel.parentNode) { const fresh = wsSelectionCardEl(row); row._sel.replaceWith(fresh); row._sel = fresh; }
}
function wsResolveSelection(promptId, resolution, reason) {   // SelectionResolved(다른 board 답) → 모든 채널 row 검색해 해당 chip dim
  if (!promptId) return;
  for (const ch of wsState.channels.values()) {
    for (const row of ch.rows) {
      if (row.kind === 'selection' && row.sel && row.sel.promptId === promptId && row.sel.state === 'ISSUED') {
        row.sel.state = (resolution === 'answered') ? 'ANSWERED' : 'CANCELLED';
        if (reason) row.sel.reason = reason;
        wsRefreshSelectionCard(row);
      }
    }
  }
}
function wsRenderRow(row) {
  const s = $('#ws-stream'); if (!s) return;
  const empty = s.querySelector('.ws-empty'); if (empty) empty.remove();
  const dk = wsDayKey(row.ts); if (dk && s._lastDay !== dk) { s.appendChild(wsDatelineEl(row.ts)); s._lastDay = dk; }   // 날짜 바뀌면 변경선 삽입
  s.appendChild(wsRowEl(row));
  while (s.children.length > 300) s.removeChild(s.firstChild);
  s.scrollTop = s.scrollHeight;
}
function wsRenderActiveStream() {
  wsRenderChanFilter();   // 대화 위 출처(채널) 필터 탭 동기 (활성 기준)
  if (wsPagerOn()) { wsSyncPager(); return; }   // 모바일: 페이저가 그룹 페이지별로 렌더 (#ws-stream 숨김)
  wsRenderStreamInto($('#ws-stream'), wsState.active);
}
// item = 채널 id 또는 group key. 지정 컨테이너에 스트림 렌더 (데스크탑=#ws-stream, 모바일 페이저=각 .ws-page-stream).
// #3a (B): 페이지 재사용 위해 컨테이너 인자형. 출처 필터 탭(#ws-chan-filter)은 호출측에서 활성 기준으로만 동기.
function wsRenderStreamInto(s, item) {
  if (!s) return;
  s.innerHTML = ''; s._lastDay = null;
  if (wsIsGroup(item)) {   // §13.6 그룹 병합: 멤버 채널 rows 를 ts 정렬, 출처 라벨 (멤버 체크박스 필터 적용)
    const merged = [];
    const _hidden = wsGrpHidden(item);
    for (const cid of wsGroupMembers(item)) { if (_hidden.has(cid)) continue; const c = wsState.channels.get(cid); if (c) for (const row of c.rows) merged.push({ row, src: c.name || cid }); }
    merged.sort((a, b) => (a.row.ts || 0) - (b.row.ts || 0));
    if (!merged.length) { s.innerHTML = '<div class="ws-empty">' + (_hidden.size ? '표시할 멤버를 선택하세요.' : '이 그룹에 아직 수신한 이벤트가 없어요.') + '</div>'; return; }
    let lastDay = null;
    for (const { row, src } of merged) {
      const dk = wsDayKey(row.ts); if (dk && dk !== lastDay) { s.appendChild(wsDatelineEl(row.ts)); lastDay = dk; }
      const e = wsRowEl(row); const sp = el('span', 'ws-src'); sp.textContent = src; e.insertBefore(sp, e.firstChild ? e.firstChild.nextSibling : null); s.appendChild(e);
    }
    s._lastDay = lastDay;
    s.scrollTop = s.scrollHeight;
    return;
  }
  const ch = item && wsState.channels.get(item);
  if (!ch || !ch.rows.length) { s.innerHTML = '<div class="ws-empty">아직 수신한 이벤트가 없어요. 에이전트가 연결되면 여기에 표시됩니다.</div>'; return; }
  const f = ch._chanFilter || '*';            // 출처 필터 (* = 전체)
  const showChan = (f === '*');               // 전체 보기일 때만 출처 뱃지(개별 채널은 이미 필터됨)
  let n = 0, lastDay = null;
  for (const row of ch.rows) {
    if (f !== '*' && (row.chan || '') !== f) continue;
    const dk = wsDayKey(row.ts); if (dk && dk !== lastDay) { s.appendChild(wsDatelineEl(row.ts)); lastDay = dk; }
    s.appendChild(wsRowEl(row, showChan)); n++;
  }
  s._lastDay = lastDay;
  if (!n) { s.innerHTML = '<div class="ws-empty">이 출처에 표시할 이벤트가 없어요.</div>'; return; }
  s.scrollTop = s.scrollHeight;
}
// ---- 대화 위 출처(채널) 필터 탭 — 에이전트 통합 탭 안에서 channelId/threadId 출처별 필터. [전체]=모두+뱃지 ----
function wsGrpHidden(gkey) { wsState.grpFilter = wsState.grpFilter || {}; if (!wsState.grpFilter[gkey]) wsState.grpFilter[gkey] = new Set(); return wsState.grpFilter[gkey]; }   // 그룹별 병합뷰에서 숨긴 멤버 id Set (기본 비어있음=전체 표시)
function wsRenderChanFilter() {
  const bar = $('#ws-chan-filter'); if (!bar) return;
  const a = wsState.active;
  if (wsIsGroup(a)) {   // 그룹 선택 시 멤버별 체크박스(기본 전체 표시) — 병합뷰 포함 멤버 필터 (데스크탑 공통, C)
    const members = wsGroupMembers(a);
    if (members.length < 2) { bar.hidden = true; bar.innerHTML = ''; return; }   // 멤버 1개면 필터 불필요
    bar.hidden = false; bar.innerHTML = '';
    const hidden = wsGrpHidden(a);
    const lab = el('span', 'ws-cf-lab'); lab.textContent = '표시'; bar.appendChild(lab);
    for (const cid of members) {
      const on = !hidden.has(cid);
      const t = el('button', 'ws-cf ws-cf-chk' + (on ? ' on' : '')); t.textContent = (on ? '☑ ' : '☐ ') + wsName(cid); t.title = cid;
      t.onclick = () => { if (hidden.has(cid)) hidden.delete(cid); else hidden.add(cid); wsRenderActiveStream(); };
      bar.appendChild(t);
    }
    return;
  }
  const ch = (a && !wsIsGroup(a) && !wsIsMon(a)) ? wsState.channels.get(a) : null;
  if (!ch) { bar.hidden = true; bar.innerHTML = ''; return; }
  const chans = []; const seen = new Set(); let hasEmpty = false;
  for (const r of ch.rows) { const c = r.chan || ''; if (!c) { hasEmpty = true; continue; } if (!seen.has(c)) { seen.add(c); chans.push(c); } }
  if (chans.length + (hasEmpty ? 1 : 0) < 2) { bar.hidden = true; bar.innerHTML = ''; return; }   // 출처 1개 이하면 필터 불필요
  bar.hidden = false; bar.innerHTML = '';
  const cur = ch._chanFilter || '*';
  const mk = (key, label, title) => { const t = el('button', 'ws-cf' + (cur === key ? ' on' : '')); t.textContent = label; t.title = title || label; t.onclick = () => { ch._chanFilter = key; wsRenderActiveStream(); }; return t; };
  bar.appendChild(mk('*', '전체', '모든 출처 + 출처 뱃지'));
  if (hasEmpty) bar.appendChild(mk('', '기본', '출처(channelId/threadId) 없는 메시지'));
  for (const c of chans) bar.appendChild(mk(c, c, c));
}
// ---- raw 이벤트 debug drawer (핸드오프 §1: 기본 timeline 엔 raw JSON 미노출, raw 는 여기서만) ----
function wsPushDebug(agentId, m) {
  const ch = wsChannel(agentId);
  ch.debug.push({ t: nowHM(), seq: (typeof m.seq === 'number' ? m.seq : null), type: m.type, name: m.name || '', raw: m });
  while (ch.debug.length > 200) ch.debug.shift();
  if (!wsState.replaying && wsState.debugOpen && agentId === wsState.active) wsRenderDebug();
}
function wsDbgJson(o) { try { let s = JSON.stringify(o, null, 2); if (s.length > 4000) s = s.slice(0, 4000) + '\n… (잘림)'; return s; } catch { return String(o); } }
function wsRenderDebug() {
  const d = $('#ws-debug'); if (!d) return;
  d.innerHTML = '';
  const ch = wsState.active && wsState.channels.get(wsState.active);
  if (!ch || !ch.debug.length) { d.innerHTML = '<div class="ws-empty">raw 이벤트 없음</div>'; return; }
  for (const e of ch.debug) {
    const row = el('div', 'ws-dbg-row');
    const h = el('div', 'ws-dbg-h'); h.textContent = `${e.t} · ${e.type}${e.name ? ' / ' + e.name : ''}${e.seq != null ? ' · #' + e.seq : ''}`;
    const pre = el('pre', 'ws-dbg-pre'); pre.textContent = wsDbgJson(e.raw);
    row.append(h, pre); d.appendChild(row);
  }
  d.scrollTop = d.scrollHeight;
}
function wsToggleDebug() {
  wsState.debugOpen = !wsState.debugOpen;
  const s = $('#ws-stream'), d = $('#ws-debug'), btn = $('#ws-dbg-btn'), pg = $('#ws-pager');
  if (s) s.hidden = wsState.debugOpen;
  if (pg) pg.style.display = wsState.debugOpen ? 'none' : '';   // 모바일 페이저는 raw drawer 열면 숨김 (display='' → CSS 복귀)
  if (d) { d.hidden = !wsState.debugOpen; if (wsState.debugOpen) wsRenderDebug(); }
  if (btn) btn.classList.toggle('on', wsState.debugOpen);
}
function wsPushRow(agentId, row) {
  const ch = wsChannel(agentId);
  if (!row.ts) row.ts = Date.now();   // 그룹 병합 뷰 시간순 정렬용
  ch.rows.push(row);
  while (ch.rows.length > 300) ch.rows.shift();
  if (wsState.replaying) return;   // 재생 중엔 데이터만 적재, 렌더·뱃지는 재생 끝나고 일괄
  // tier-1 알림 (#3a) — 라이브 행만(재생 제외): a2acard=meaningful A2A, err=RUN_ERROR 중단·오류
  if (row.kind === 'a2acard') wsNotify('a2a', 'A2A 수신: ' + (row.label || ''), (row.a2a && (row.a2a.summary || row.a2a.name)) || '');
  else if (row.kind === 'err') wsNotify('abort', '작업 오류·중단', row.body || row.label || '');
  const active = wsState.active;
  const pagerOn = wsPagerOn();
  const sameGroup = wsGroupKeyOf(agentId) === wsGroupKeyOf(active);
  const inView = pagerOn ? sameGroup : (agentId === active || (wsIsGroup(active) && wsGroupMembers(active).indexOf(agentId) >= 0));
  if (wsState.popOpen) {
    if (pagerOn) { if (sameGroup) wsSyncPager(); else wsPagerEnsureSet(); }   // 모바일: active 그룹 행=갱신(하단 스크롤), 타 그룹 행=페이지 집합만 보장(active 페이지 안 흔듦)
    else if (inView) { if (wsIsGroup(active)) wsRenderActiveStream(); else wsRenderRow(row); }   // 그룹 뷰면 병합 재렌더
  }
  if (!inView) ch.unseen++;
  wsRenderTabs(); updateWsBadge();
}

function wsName(id) { const c = wsState.channels.get(id); return (c && c.name) || id; }
// v0.3 오케스트레이션 — 모니터 3채널(Up↔Main / Main↔Local / Main↔Collab) + 탭 그룹
const WS_MON_UP = '__mon_up__';        // 🔀 업스트림 ↔ 메인
const WS_MON_LOCAL = '__mon_local__';  // 🔀 메인 ↔ 로컬
const WS_MON_COLLAB = '__mon_collab__';  // 🔀 메인 ↔ 협업(collab peer, §13.9 — collab/upstream = peer not worker)
const WS_MON_BOARD = '__mon_board__';  // 🔀 메인 ↔ 보드 (board-worker A2A 별도 모니터 — C1 backends.json overlay)
let wsBackends = {};   // C1 backend registry overlay (backends.json): agentId → {role, model, connection, board}. 부재 시 {} → graceful (board-worker 는 local 로 접힘, badge 없음)
function wsLoadBackends() {
  fetch('backends.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(reg => {
    if (!reg) return;
    if (reg.boardTitle) { const bn = $('#board-name'); if (bn) bn.textContent = reg.boardTitle; document.title = reg.boardTitle + ' 라이브 보드'; }   // 보드 타이틀 커스텀 (deployment 별)
    if (!Array.isArray(reg.agents)) return;
    const m = {}; for (const a of reg.agents) if (a && a.agentId) m[a.agentId] = a;
    wsBackends = m;
    for (const [id, c] of wsState.channels) { const b = m[id]; if (b && b.role) c.role = b.role; }   // 이미 연결된 채널 role 재분류
    wsRenderTabs();
  }).catch(() => {});   // 부재/오류 = graceful no-op
}
let WS_LOCAL = 'main-agent';           // placeholder; updated dynamically from AgentList (the agentId whose role==='main') — §2 role model
function wsRoleOf(id) { const c = wsState.channels.get(id); return (c && c.role) || (id === WS_LOCAL ? 'main' : 'local'); }
function wsMonChannel(src, dst) {
  const sr = wsRoleOf(src), dr = wsRoleOf(dst);
  if (sr === 'upstream' || dr === 'upstream') return WS_MON_UP;
  if (sr === 'collab' || dr === 'collab') return WS_MON_COLLAB;   // §13.9 collab peer: Main↔Collab 별도 모니터
  if (sr === 'board-worker' || dr === 'board-worker') return WS_MON_BOARD;   // C1: board-worker A2A → Main↔Board 별도 모니터
  return WS_MON_LOCAL;
}
function wsMonName(id) { return id === WS_MON_UP ? '🔀 Up↔Main' : id === WS_MON_COLLAB ? '🔀 Main↔Collab' : id === WS_MON_BOARD ? '🔀 Main↔Board' : '🔀 Main↔Local'; }
function wsIsMon(id) { return id === WS_MON_UP || id === WS_MON_LOCAL || id === WS_MON_COLLAB || id === WS_MON_BOARD; }
function wsIsGroup(id) { return typeof id === 'string' && id.indexOf('group:') === 0; }
function wsGroupMembers(gkey) {
  const r = gkey === 'group:up' ? 'upstream' : gkey === 'group:main' ? 'main' : gkey === 'group:collab' ? 'collab' : gkey === 'group:board-worker' ? 'board-worker' : 'local';
  const mem = [...wsState.channels.entries()].filter(([id, c]) => c.role === r && !wsIsMon(id)).map(([id]) => id);
  if (gkey === 'group:up' && wsState.channels.has(WS_MON_UP)) mem.push(WS_MON_UP);
  if (gkey === 'group:main' && wsState.channels.has(WS_MON_LOCAL)) mem.push(WS_MON_LOCAL);
  if (gkey === 'group:main' && wsState.channels.has(WS_MON_COLLAB)) mem.push(WS_MON_COLLAB);   // group:main 병합에 Main↔Collab 취합(§13.9 collab peer)
  if (gkey === 'group:board-worker' && wsState.channels.has(WS_MON_BOARD)) mem.push(WS_MON_BOARD);   // C1: board-worker 그룹 병합에 Main↔Board 취합
  return mem;
}
function wsGroupRep(gkey) {
  // 그룹 탭의 *대표 워커* — group:up→업스트림 / group:main→메인 으로 입력·라우팅 한 화면에서. group:main 이면 WS_LOCAL(메인) 우선, 그 외 그룹은 비-모니터 첫 멤버.
  if (gkey === 'group:main' && wsState.channels.has(WS_LOCAL)) return WS_LOCAL;
  for (const cid of wsGroupMembers(gkey)) { if (!wsIsMon(cid)) return cid; }
  return null;
}
function onWsEvent(m) {
  const t = m.type;
  const _ts = wsMsgEpoch(m);   // 발신 시각 epoch ms (정렬·날짜변경선용·고정) — 없으면 null
  const _t = wsRowTime(m);     // 발신 시각 HH:MM:SS (client 로컬 TZ·고정) — 없으면 nowHM() fallback
  if (t === 'SERVER_HELLO') {
    wsState.open = true; updateWsConn();
    // post-handshake assertion (envelope-drift catch): 5s after SERVER_HELLO,
    //   if an AgentList was seen but no channel populated → almost certainly an envelope mismatch
    //   (e.g. a brewed server emitting bare-type instead of CUSTOM-wrapped).  Warn loudly — silence here is the foot-gun.
    setTimeout(() => {
      if (wsState.open && wsState._agentListSeen && wsState.channels.size === 0) {
        try { console.warn('[Constellation] AgentList frame received but channels not populated — likely envelope mismatch. Expected CUSTOM/AgentList/value.agents per server.eux envelope_convention; if the server brew emits bare top-level, the compat shim below should have caught it. See constellation/server.eux @intent.'); } catch {}
      }
    }, 5000);
    return;
  }
  // ── Envelope compat shim (transition-period safety net) ──────────────────────────
  // server.cjs / server.eux v2.2.x onward pin CUSTOM-wrapped (envelope_convention).
  // A brewed server from v2.1.0 (when the .eux did NOT pin envelope shape) may legitimately
  // emit AgentList / History / ChannelHistory at bare top-level. Accept both shapes so a
  // brewed-runtime drift never silently empties the dashboard. Remove once the ecosystem is on v2.2.x+.
  if (t === 'AgentList' || (t === 'CUSTOM' && m.name === 'AgentList')) {
    wsState._agentListSeen = true;
    const agents = (t === 'AgentList') ? (m.agents || []) : ((m.value && m.value.agents) || []);
    for (const a of agents) { if (a.role === 'main' && a.agentId) { WS_LOCAL = a.agentId; break; } }
    wsSyncAgents(agents); return;
  }
  if (t === 'History' || (t === 'CUSTOM' && m.name === 'History')) {
    // CUSTOM-wrapped (canonical): value.events is the flat per-event list, each event carrying its own agentId.
    // bare top-level legacy: m.channels[] grouped by key — flatten and inject channel.key as agentId for any event that lacks one
    //   (older brewed JSONL stored TEXT_MESSAGE without explicit agentId, relying on filename grouping).
    const v = (t === 'History') ? m : (m.value || {});
    let events;
    if (Array.isArray(v.events)) {
      events = v.events;
    } else if (Array.isArray(v.channels)) {
      events = [];
      for (const ch of v.channels) {
        if (!Array.isArray(ch.events)) continue;
        for (const ev of ch.events) {
          if (ch.key && !ev.agentId) ev.agentId = ch.key;
          events.push(ev);
        }
      }
    } else { events = []; }
    wsReplayHistory(events, v.cold, v.archived); return;
  }
  if (t === 'ChannelHistory' || (t === 'CUSTOM' && m.name === 'ChannelHistory')) {
    const v = (t === 'ChannelHistory') ? m : (m.value || {});
    const channelKey = v.channelKey || v.channel;
    wsReplayChannelHistory(channelKey, v.events); return;
  }
  if (t === 'CUSTOM' && m.name === 'ServerNotice') {   // 브릿지/서버 재시작 등 시스템 공지 → 활성 채널 status 카드
    const v = m.value || {}; const icon = ({ restarting: '🔄', offline: '🔌', online: '🟢' })[v.kind] || 'ℹ️';
    const a = wsState.active;
    if (a && !wsIsGroup(a)) wsPushRow(a, { kind: 'status', label: icon + ' 서버 공지', body: v.text || ((v.target || 'server') + ' ' + (v.kind || '')), dim: false, t: _t, ts: _ts });
    return;
  }
  if (t === 'CUSTOM' && m.name === 'CloseChannel') {   // 다른 클라/✕ 로 채널 닫힘 → 동기
    const id = m.value && m.value.agentId;
    if (id && wsState.channels.has(id)) { wsState.channels.delete(id); if (wsState.active === id) wsState.active = wsState.channels.keys().next().value || null; if (!wsState.replaying) { wsRenderTabs(); wsRenderActiveStream(); updateWsConn(); updateWsBadge(); } }
    return;
  }
  if (t === 'CUSTOM' && m.name === 'DeleteChannelHistory') {   // 다른 board 가 채널 영구삭제(🗑) → 동기 제거 (EstreUF parity)
    const id = m.value && m.value.agentId;
    if (id && wsState.channels.has(id)) { if (wsState.active === id) wsState.active = wsState.channels.keys().next().value || null; wsState.channels.delete(id); wsSaveHidden(); if (!wsState.replaying) { wsRenderTabs(); wsRenderArchived(); wsRenderActiveStream(); updateWsConn(); updateWsBadge(); } }
    return;
  }
  if (t === 'CUSTOM' && m.name === 'HistoryCleared') {   // 다른 board 가 전체삭제 → 닫은 세션 동기 제거 (EstreUF #406 UI3 parity)
    for (const [id, c] of [...wsState.channels.entries()]) if (c.hidden && !wsIsMon(id)) { if (wsState.active === id) wsState.active = null; wsState.channels.delete(id); }
    wsSaveHidden(); if (!wsState.replaying) { wsRenderTabs(); wsRenderArchived(); updateWsConn(); updateWsBadge(); }
    return;
  }
  if (t === 'CUSTOM' && m.name === 'UpstreamKeyIssued') {   // transitional alias (RegisterUpstreamKey 응답) — UI 는 setupWsKeyMgmt 의 setIssued 로 통합
    if (wsKeyMgmt) wsKeyMgmt.setIssued(m.value || {});
    return;
  }
  if (t === 'CUSTOM' && m.name === 'KeyIssued') {   // v2.4.0 canonical KeyIssue 응답 → 키 관리 패널 issued
    if (wsKeyMgmt) wsKeyMgmt.setIssued(m.value || {});
    return;
  }
  if (t === 'CUSTOM' && m.name === 'KeyListResult') {   // v2.4.0 KeyList 응답 → 모달 목록 갱신
    if (wsKeyMgmt) wsKeyMgmt.setList((m.value || {}).keys || []);
    return;
  }
  if (t === 'CUSTOM' && (m.name === 'KeyRevoked' || m.name === 'KeyLabeled' || m.name === 'KeyRevokePending')) {   // v2.4.0 키 상태 변경 → 모달 목록 새로고침
    if (wsKeyMgmt) wsKeyMgmt.onMutated();
    return;
  }
  if (t === 'CUSTOM' && m.name === 'KeyError') {   // v2.4.0 KEY-MGMT 에러 → 패널 표시
    if (wsKeyMgmt) wsKeyMgmt.setError(m.value || {});
    return;
  }
  if (t === 'CUSTOM' && m.name === 'AgentNameChanged') {   // v2.4.0 §3.5 라벨 변경 broadcast
    return;
  }
  if (t === 'CUSTOM' && m.name === 'CollabKeyIssued') {   // v2.4.2 통합: RegisterCollabKey transitional alias 응답 → wsKeyMgmt 로 통합 (kind=collab 명시 fallback)
    if (wsKeyMgmt) { const v = m.value || {}; if (!v.kind) v.kind = 'collab'; wsKeyMgmt.setIssued(v); }
    return;
  }
  // #406 UI6 SelectionResolved — 다른 board 가 답/취소 → 이 board 의 해당 chip dim. agentId 없는 라우팅-무관 서버 직접 reply 로 와도 처리(EstreUF parity — agent-outbound 가드 앞에서 조기 처리)
  if (t === 'CUSTOM' && m.name === 'SelectionResolved') { const v = m.value || {}; wsResolveSelection(v.promptId, v.resolution, v.reason); return; }
  // board/사용자 입력(에코 또는 History 재생) → 해당 채널에 user row (대화기록 복원)
  if ((m.source === 'user' || m.source === 'board') && t === 'CUSTOM' && m.targetAgentId) {
    const ukey = wsChanKey(m);   // §4: 사용자 입력도 channelId 우선 scoped 키
    wsChannel(ukey, undefined, { routeId: m.targetAgentId, channelId: m.channelId, threadId: m.threadId });   // routeId(라우팅 agentId) 보장
    wsPushDebug(ukey, m);
    const nm = m.name, v = m.value || {};
    const label = nm === 'UserPrompt' ? '🙋 UserPrompt' : nm === 'Command' ? '⌘ Command' : nm === 'Cancel' ? '⏹ Stop' : '✦ ' + (nm || 'CUSTOM');
    // raw JSON 은 timeline 에 노출하지 않음(§1) — 의미 필드만, 전체 원본은 debug drawer 에서
    const body = nm === 'UserPrompt' ? (v.text || '') : nm === 'Command' ? (v.name || '') : nm === 'Cancel' ? '작업 중단 요청' : (typeof v === 'string' ? v : (v.text || v.message || v.summary || v.label || ''));
    wsPushRow(ukey, { kind: 'user', label, body, dim: false, t: _t, ts: _ts, chan: wsChanLabel(m), chanFull: wsChanFull(m) });
    return;
  }
  const agentId = m.agentId; if (!agentId) return;       // agent outbound 는 agentId 필수
  // A2A: 에이전트가 다른 에이전트에게 보낸 메시지(targetAgentId=타 agent) → 모니터 채널로 분리.
  // ── source-stamp 죽은 조건 회피(upstream Report 2 Finding 1): server.cjs 의 wsToBoards 는 frame 에 source role 을
  //    stamp 하지 않으므로 기존 `m.source === 'agent'` 조건은 항상 false → A2A 영구 미분류였음.
  //    agentId(발신) + targetAgentId(수신) 만으로 판정하고, malformed sender(=value.targetAgentId 중첩, Finding 2 케이스)도 tolerate.
  const _a2aTgt = m.targetAgentId || (m.value && m.value.targetAgentId) || null;
  const a2a = !!(_a2aTgt && _a2aTgt !== agentId);
  const chId = a2a ? wsMonChannel(agentId, _a2aTgt) : wsChanKey(m);   // §13.5 모니터 2채널(role 기반) / §4 channelId scoped 키
  const _src = a2a ? { from: agentId, to: _a2aTgt } : null;   // A2A 방향(src→dst, 각 이름 role 색) — 본문이 아닌 별도 뱃지
  // §6 project metadata: 공통 필드 또는 AgentHandoffStart/ProjectMetadata value 에서 추출
  const meta = a2a ? null : { routeId: agentId, channelId: m.channelId, threadId: m.threadId };
  if (meta) {
    if (m.projectName) meta.projectName = m.projectName;
    if (m.githubRepo) meta.githubRepo = m.githubRepo;
    const pm = m.projectMetadata || ((m.type === 'CUSTOM' && (m.name === 'AgentHandoffStart' || m.name === 'ProjectMetadata')) ? m.value : null);
    if (pm) { if (pm.projectName) meta.projectName = pm.projectName; if (pm.githubRepo) meta.githubRepo = pm.githubRepo; }
  }
  const ch = wsChannel(chId, a2a ? wsMonName(chId) : undefined, meta);
  if (a2a) ch.role = 'monitor';
  ch.agentSeen = true;
  wsPushDebug(chId, m);   // 모든 agent outbound 원본을 debug drawer 에 적재(timeline 과 별도)
  if (typeof m.seq === 'number') ch.seq = m.seq;
  if (m.runId) ch.runId = m.runId;
  const _chan = a2a ? '' : wsChanLabel(m), _chanFull = a2a ? '' : wsChanFull(m);   // 출처 뱃지(에이전트 통합 채널 내 대화 구분). 모니터(a2a)는 _src 뱃지
  // 발신 시각(_t/_ts)은 onWsEvent 최상단에서 wsMsgEpoch/wsRowTime 로 도출 (m.timestamp → m.at ISO → fallback). replay 후에도 원본 고정.
  const push = (kind, label, body, dim, full) => wsPushRow(chId, { kind, label, body: body || '', dim, t: _t, ts: _ts, chan: _chan, chanFull: _chanFull, src: _src, full: (full && typeof full === 'object') ? full : null });
  switch (t) {
    case 'RUN_STARTED': push('run', '▶ RUN_STARTED', m.runId || '', true); break;
    case 'RUN_FINISHED': push('ok', '✓ RUN_FINISHED', wsOutcome(m.outcome), true); break;
    case 'RUN_ERROR': push('err', '⚠ RUN_ERROR', (m.code ? `[${m.code}] ` : '') + (m.message || ''), false); break;
    case 'STEP_STARTED': push('step', '◆ STEP', m.stepName || '', true); break;
    case 'STEP_FINISHED': push('step', '◇ STEP done', m.stepName || '', true); break;
    case 'TEXT_MESSAGE_START': { const row = { kind: 'text', label: '💬 TEXT', body: '', dim: false, t: _t, ts: _ts, chan: _chan, chanFull: _chanFull, src: _src }; ch.msgBuf[m.messageId || '_'] = row; wsPushRow(chId, row); break; }
    case 'TEXT_MESSAGE_CONTENT': {
      const row = ch.msgBuf[m.messageId || '_'];
      if (row) { row.body = (row.body || '') + (m.delta || ''); if (row._b) { if (row._md) row._b.innerHTML = wsMd(row.body); else row._b.textContent = row.body; const s = $('#ws-stream'); if (s) s.scrollTop = s.scrollHeight; } }
      else push('text', '💬 TEXT', m.delta || '', false);
      break;
    }
    case 'TEXT_MESSAGE_END': delete ch.msgBuf[m.messageId || '_']; break;
    case 'TEXT_MESSAGE': {   // History 재생: 압축 완성형 메시지 1건. §13.16.12 Pattern 7 — text 직렬화 A2A Report 면 a2acard 로 승격
      const rep = wsExtractA2aReport(m.text);
      if (rep) {
        const spec = WS_A2A_INTENT[rep.name]; const v = rep.value;
        const sum = (rep.prefix && rep.prefix.length <= 200 ? rep.prefix : '') || wsA2aSummary(spec, v);
        wsPushRow(chId, { kind: 'a2acard', a2a: { name: rep.name, spec, value: v, summary: sum }, _expanded: false, label: (spec.label || rep.name), full: v, src: _src, chan: _chan, chanFull: _chanFull, t: _t, ts: _ts });
      } else push('text', '💬 TEXT', m.text || '', false);
      break;
    }
    case 'TOOL_CALL_START': {
      const id = m.toolCallId || ('_t' + (ch.seq || 0));
      const row = { kind: 'toolcard', toolCallId: id, src: _src, chan: _chan, chanFull: _chanFull, t: _t, ts: _ts, _expanded: false,
        tool: { toolCallId: id, name: m.toolCallName || '', title: '', subtitle: '', summary: '', compact: false, dkind: '', status: 'running', args: undefined, argsPreview: m.argsPreview || '', result: undefined, resultPreview: '' } };
      wsToolMergeDisplay(row.tool, m.display);
      if (!row.tool.title) row.tool.title = m.toolCallName || id;
      ch.toolBuf[id] = row;
      wsPushRow(chId, row);
      break;
    }
    case 'TOOL_CALL_ARGS': {
      const row = ch.toolBuf[m.toolCallId];
      if (row) {
        if (m.argsPreview != null) row.tool.argsPreview = m.argsPreview;
        if (m.args != null) row.tool.args = m.args;
        else if (m.delta != null) row.tool.args = (typeof row.tool.args === 'string' ? row.tool.args : '') + m.delta;
        wsToolMergeDisplay(row.tool, m.display);
        wsUpdateTool(row);
      }
      break;
    }
    case 'TOOL_CALL_END': {
      const row = ch.toolBuf[m.toolCallId];
      if (row) { wsToolMergeDisplay(row.tool, m.display); if (!m.display || m.display.status == null) { if ((row.tool.status || '').toLowerCase() === 'running') row.tool.status = 'done'; } wsUpdateTool(row); }
      break;
    }
    case 'TOOL_CALL_RESULT': {
      const row = ch.toolBuf[m.toolCallId];
      if (row) {
        if (m.resultPreview != null) row.tool.resultPreview = m.resultPreview;
        else if (m.content != null || m.delta != null) row.tool.result = m.content ?? m.delta;
        wsToolMergeDisplay(row.tool, m.display);
        if ((!m.display || m.display.status == null) && (row.tool.status || '').toLowerCase() === 'running') row.tool.status = 'done';
        wsUpdateTool(row);
        delete ch.toolBuf[m.toolCallId];
      } else push('tool', '🔧 result', wsTrunc(m.content ?? m.delta), true);   // START 못 본 경우 폴백
      break;
    }
    case 'TOOL_CALL': {   // History 재생: 압축 완성형 tool 1건 → aggregate 카드
      const id = m.toolCallId || ('_t' + (ch.seq || 0));
      const row = { kind: 'toolcard', toolCallId: id, src: _src, chan: _chan, chanFull: _chanFull, t: _t, ts: _ts, _expanded: false,
        tool: { toolCallId: id, name: m.toolCallName || '', title: '', subtitle: '', summary: '', compact: false, dkind: '', status: 'done', args: m.args, argsPreview: '', result: m.result, resultPreview: '' } };
      wsToolMergeDisplay(row.tool, m.display);
      if (!row.tool.title) row.tool.title = m.toolCallName || id;
      wsPushRow(chId, row);
      break;
    }
    case 'CUSTOM':
      if (m.name === 'UserPromptAccepted') push('ok', '✓ Accepted', (m.value && m.value.promptId) ? `queued · ${m.value.promptId}` : 'queued', true);
      else if (m.name === 'UserPrompt') push('user', '🙋 발화', (m.value && m.value.text) || '', false);   // A2A 발화(에이전트 간) — raw 이름(✦ UserPrompt) 대신 대화로 렌더
      else if (m.name === 'Command') push('user', '⌘ Command', (m.value && m.value.name) || '', false);
      else if (m.name === 'Cancel') push('user', '⏹ Stop', '작업 중단 요청', false);
      // AgentHello·OnboardAck·Delegate·WorkerReport·WorkerAck 는 WS_A2A_INTENT 카드 분기로 통일 (전용 text/user/ok row 제거 — 카드 미표시 항목 카드화)
      else if (m.name === 'Ack') { const v = m.value || {}; push('ok', '✅ delivered', [v.kind, v.ackFor].filter(Boolean).join(' · ') || (v.re || v.summary || v.notice || ''), true, v); }   // §13.13 server delivered ack — board 미표시(alarm fatigue 게이팅), hidden=true로 hover/drawer만 접근
      else if (m.name === 'AckProcessed') { const v = m.value || {}; push('ok', '✅ processed', [v.kind || 'processed', v.ackFor].filter(Boolean).join(' · ') || (v.re || v.summary || v.notice || ''), true, v); }   // §13.13 agent processed ack(WILCO) — board 미표시
      else if (m.name === 'AckCumulative') { const v = m.value || {}; push('ok', '✅ cumulative', 'upToSeq=' + (v.upToSeq != null ? v.upToSeq : '?'), true, v); }   // §13.13 telemetry 누적 ack — board 미표시
      else if (m.name === 'Ping') { const v = m.value || {}; push('text', '🛰 ping', (v.re ? 're=' + v.re : '') + (v.ttl != null ? ' · ttl=' + v.ttl : '') + (v.notice ? ' · ' + v.notice : ''), true, v); }   // §13.13 liveness probe(RFC1122 보수적 multi-probe, 재전송 도구 아님) — board 미표시
      else if (m.name === 'Pong') { const v = m.value || {}; push('text', '🛰 pong', (v.re ? 're=' + v.re : '') + (v.notice ? ' · ' + v.notice : ''), true, v); }   // §13.13 liveness 응답(application-layer, transport keepalive 아님) — board 미표시
      else if (m.name === 'ConnectionRestored') {   // /restart 후 게이트웨이 재연결 공지(§5) — dedup 후 status 카드
        const v = m.value || {};
        const key = String(v.sessionId || v.session || v.at || m.timestamp || '');
        if (!(key && ch._lastRestoreKey === key)) {   // 같은 복원 중복(broadcast·재수신) 무시
          ch._lastRestoreKey = key;
          ch.connStatus = 'restored';
          const info = v.sessionId ? `세션 ${String(v.sessionId).slice(0, 8)} 재연결` : (v.reason || v.text || '게이트웨이 재연결');
          push('status', '🔄 연결 복원됨', info, false);
        }
      }
      else if (m.name === 'Attachment') { wsPushRow(chId, { kind: 'attach', src: _src, att: m.value || {}, t: _t, ts: _ts, chan: _chan, chanFull: _chanFull }); }   // §6 첨부 카드(image/audio/video/file)
      else if (m.name === 'SelectionPrompt') {   // #406 UI6 — 에이전트 발 선택지 → 인라인 chip 카드(답/취소 시 board→server)
        const v = m.value || {};
        wsPushRow(chId, { kind: 'selection', sel: { promptId: v.promptId, text: v.text || '', options: Array.isArray(v.options) ? v.options : [], allowFreeText: !!v.allowFreeText, multiSelect: !!v.multiSelect, state: 'ISSUED', routeId: agentId }, t: _t, ts: _ts, chan: _chan, chanFull: _chanFull });
      }
      // SelectionResolved 는 onWsEvent 상단에서 라우팅-무관 조기 처리 (agent-outbound 가드 앞) — 여기 중복 분기 제거
      else if (WS_A2A_INTENT[m.name]) {   // §13.16.9 A2A-intent allowlist(Report·BlockerManifest·ReviewSLAAck·PR* / Deadlock* family) → 카드 form(아이콘+요약+펼침 details), NOT raw/TEXT fallback
        const spec = WS_A2A_INTENT[m.name]; const v = m.value || {};
        wsPushRow(chId, { kind: 'a2acard', a2a: { name: m.name, spec, value: v, summary: wsA2aSummary(spec, v) }, _expanded: false, label: (spec.label || m.name || 'CUSTOM'), full: (v && typeof v === 'object') ? v : (v != null ? { value: v } : null), src: _src, chan: _chan, chanFull: _chanFull, t: _t, ts: _ts });
      }
      else {   // 미분류 CUSTOM 도 카드로 통일 (카드 미표시 항목 카드화). 객체값 → a2acard(generic spec, re > summary 우선 fallback), 비-객체 → text row.
        const v = m.value;
        if (v != null && typeof v === 'object') {
          const spec = { icon: '✦', label: m.name || 'CUSTOM', sum: ['re', 'text', 'message', 'notice', 'summary', 'label', 'ask', 'body', 'detail'] };
          wsPushRow(chId, { kind: 'a2acard', a2a: { name: m.name, spec, value: v, summary: wsA2aSummary(spec, v) }, _expanded: false, label: (m.name || 'CUSTOM'), full: v, src: _src, chan: _chan, chanFull: _chanFull, t: _t, ts: _ts });
        } else {
          push('text', `✦ ${m.name || 'CUSTOM'}`, (v == null ? '' : String(v)), true, v);
        }
      }
      break;
    case 'STATE_SNAPSHOT': case 'STATE_DELTA': push('step', `≡ ${t}`, m.scope || '', true); break;
    default: push('text', t || '?', '', true);
  }
  updateWsConn();
}

// ---- 탭 편집 모드 (드래그 순서 변경 + 초기화) ----
const WS_TABORDER_KEY = 'constellation-ws-taborder';
let wsTabEdit = false;
let wsTabOrder = (() => { try { return JSON.parse(localStorage.getItem(WS_TABORDER_KEY) || '{}') || {}; } catch { return {}; } })();   // { groups:[key], tabs:{ [groupKey]:[id] } }
let wsLastGroupKeys = [], wsLastTabKeys = {};   // 직전 렌더 순서 — reorder 기준
function wsSaveTabOrder() { try { localStorage.setItem(WS_TABORDER_KEY, JSON.stringify(wsTabOrder)); } catch {} }
function wsResetTabOrder() { wsTabOrder = {}; try { localStorage.removeItem(WS_TABORDER_KEY); } catch {} wsRenderTabs(); }
// 저장 순서 우선 + 미저장 항목은 원순서 유지(decorate-sort-undecorate 안정정렬)
function wsApplyOrder(items, saved, keyFn) {
  if (!saved || !saved.length) return items;
  const idx = new Map(saved.map((k, i) => [k, i]));
  return items.map((it, i) => [it, i]).sort((a, b) => {
    const ka = idx.has(keyFn(a[0])) ? idx.get(keyFn(a[0])) : 1e9 + a[1];
    const kb = idx.has(keyFn(b[0])) ? idx.get(keyFn(b[0])) : 1e9 + b[1];
    return ka - kb;
  }).map((x) => x[0]);
}
function wsMakeDraggable(node, kind, id, groupKey) {   // kind='grp'(헤더) | 'tab' — MIME 분리로 그룹/탭 드래그 충돌 차단
  node.draggable = true; node.classList.add('ws-draggable');
  const vis = () => (kind === 'grp' ? (node.closest('.grp') || node) : node);   // 삽입 인디케이터 대상 (그룹=.grp, 탭=.ws-tab)
  const clearAll = () => { const bar = $('#ws-tabs'); if (bar) bar.querySelectorAll('.ws-drop-before, .ws-drop-after').forEach((n) => { n.classList.remove('ws-drop-before', 'ws-drop-after'); delete n.dataset.dropSide; }); };
  node.addEventListener('dragstart', (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/x-ws-' + kind, JSON.stringify({ id, groupKey })); node.classList.add('ws-dragging'); });
  node.addEventListener('dragend', () => { node.classList.remove('ws-dragging'); clearAll(); });
  node.addEventListener('dragover', (e) => {
    if (![...e.dataTransfer.types].includes('text/x-ws-' + kind)) return;
    e.preventDefault(); clearAll();   // flicker 방지 — 매 dragover 전체 클리어 후 현재 대상에만 삽입바 표시
    const v = vis(); const r = v.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;   // 커서가 대상 오른쪽 절반 = 뒤에 삽입
    v.classList.add(after ? 'ws-drop-after' : 'ws-drop-before'); v.dataset.dropSide = after ? 'after' : 'before';
  });
  node.addEventListener('drop', (e) => {
    const v = vis(); const side = v.dataset.dropSide || 'before'; clearAll();
    if (![...e.dataTransfer.types].includes('text/x-ws-' + kind)) return;
    e.preventDefault();
    let src; try { src = JSON.parse(e.dataTransfer.getData('text/x-ws-' + kind)); } catch { return; }
    if (kind === 'grp') wsReorderGroup(src.id, id, side);
    else wsReorderTab(src.groupKey, src.id, id, side);   // 탭은 같은 그룹 내에서만 (다른 그룹 드롭 = no-op)
  });
}
function wsReorderGroup(srcKey, dstKey, side) {
  if (srcKey === dstKey) return;
  const order = (wsTabOrder.groups && wsTabOrder.groups.length ? wsTabOrder.groups.slice() : wsLastGroupKeys.slice());
  for (const k of wsLastGroupKeys) if (!order.includes(k)) order.push(k);   // 신규 그룹 보강
  if (order.indexOf(srcKey) < 0 || order.indexOf(dstKey) < 0) return;
  order.splice(order.indexOf(srcKey), 1);
  let to = order.indexOf(dstKey); if (side === 'after') to += 1;   // 커서 위치 따라 앞/뒤
  order.splice(to, 0, srcKey);
  wsTabOrder.groups = order; wsSaveTabOrder(); wsRenderTabs();
}
function wsReorderTab(groupKey, srcId, dstId, side) {
  if (srcId === dstId) return;
  wsTabOrder.tabs = wsTabOrder.tabs || {};
  const cur = (wsLastTabKeys[groupKey] || []).slice();
  const base = (wsTabOrder.tabs[groupKey] && wsTabOrder.tabs[groupKey].length ? wsTabOrder.tabs[groupKey].slice() : cur);
  for (const k of cur) if (!base.includes(k)) base.push(k);
  if (base.indexOf(srcId) < 0 || base.indexOf(dstId) < 0) return;   // 다른 그룹 탭에 드롭 = 무시
  base.splice(base.indexOf(srcId), 1);
  let to = base.indexOf(dstId); if (side === 'after') to += 1;   // 커서 위치 따라 앞/뒤
  base.splice(to, 0, srcId);
  wsTabOrder.tabs[groupKey] = base; wsSaveTabOrder(); wsRenderTabs();
}
function wsToggleTabEdit() {
  wsTabEdit = !wsTabEdit;
  const tb = $('#ws-tabedit-btn'), rb = $('#ws-tabreset-btn');
  if (tb) tb.classList.toggle('on', wsTabEdit);
  if (rb) rb.hidden = !wsTabEdit;
  wsRenderTabs();
}

// ---- 채널 탭 ----
// §13.6 계층 탭 그룹 (업스트림/메인/보드워커/로컬/협업). 그룹 헤더=병합 토글, 탭=단독. 편집 모드 시 드래그 재정렬.
// §13.6 그룹 계산 (업스트림/메인/보드워커/로컬/협업) — 탭바·모바일 페이저(#3a B)가 동일 집합·순서 사용. 빈 그룹 포함(호출측 필터).
function wsComputeGroups() {
  const byRole = (r) => [...wsState.channels.entries()].filter(([id, c]) => c.role === r && !wsIsMon(id) && !c.hidden).map(([id]) => id);
  const has = (id) => wsState.channels.has(id);
  let groups = [
    { key: 'group:up', cls: 'up', label: '업스트림', tabs: byRole('upstream').concat(has(WS_MON_UP) ? [WS_MON_UP] : []) },
    { key: 'group:main', cls: 'main', label: '메인', tabs: byRole('main').concat(has(WS_MON_LOCAL) ? [WS_MON_LOCAL] : []).concat(has(WS_MON_COLLAB) ? [WS_MON_COLLAB] : []) },
    { key: 'group:board-worker', cls: 'board-worker', label: '보드워커', tabs: byRole('board-worker').concat(has(WS_MON_BOARD) ? [WS_MON_BOARD] : []) },
    { key: 'group:local', cls: 'local', label: '로컬', tabs: byRole('local') },
    { key: 'group:collab', cls: 'collab', label: '협업', tabs: byRole('collab') },
  ];
  groups = wsApplyOrder(groups, wsTabOrder.groups, (g) => g.key);   // 사용자 지정 그룹 순서
  for (const g of groups) g.tabs = wsApplyOrder(g.tabs, (wsTabOrder.tabs || {})[g.key], (id) => id);   // 그룹 내 탭 순서
  return groups;
}
function wsRenderTabs() {
  const bar = $('#ws-tabs'); if (!bar) return;
  bar.innerHTML = '';
  bar.classList.toggle('tab-edit', wsTabEdit);
  const groups = wsComputeGroups();
  wsLastGroupKeys = groups.map((g) => g.key);
  wsLastTabKeys = {};
  for (const g of groups) {
    if (!g.tabs.length) continue;   // 빈 그룹 숨김
    wsLastTabKeys[g.key] = g.tabs.slice();
    const grp = el('div', 'grp ' + g.cls + (wsState.active === g.key ? ' sel' : '')); grp.dataset.gkey = g.key;
    const gh = el('div', 'ghead' + (wsState.active === g.key ? ' sel' : ''));
    gh.innerHTML = `<span class="gmerge">▦</span>${esc(g.label)}<span class="gcnt">${g.tabs.length}</span>`;
    if (wsTabEdit) { gh.title = g.label + ' 그룹 — 드래그하여 그룹 순서 변경'; wsMakeDraggable(gh, 'grp', g.key, g.key); }
    else { gh.title = g.label + ' 그룹 — 클릭 시 그룹 전체 시간순 병합 보기'; gh.onclick = () => wsSetActive(g.key); }
    grp.append(gh);
    const tabs = el('div', 'tabs');
    const grpSel = wsState.active === g.key;   // 그룹 탭 선택 시 멤버 이름에 그룹 색상 (EstreUF UI2 parity)
    for (const id of g.tabs) {
      const ch = wsState.channels.get(id);
      const mon = wsIsMon(id);
      const present = mon ? true : wsState.present.has(ch.routeId || id);
      const tab = el('div', 'ws-tab ' + g.cls + (id === wsState.active ? ' active' : '') + (present ? ' on' : ''));
      tab.title = (ch.routeId || id) + (present ? '' : ' · 연결 끊김');
      const dot = el('span', 'tdot' + (present ? '' : ' off'));
      const nm = el('span', 'nm' + (grpSel ? ' ' + g.cls : '')); nm.textContent = ch.name || id;   // 그룹 선택 시 이름에 그룹 색상
      const bg = el('span', 'ubadge'); bg.textContent = ch.unseen > 99 ? '99+' : String(ch.unseen); bg.hidden = !ch.unseen || id === wsState.active;
      tab.append(dot, nm);
      const bk = wsBackends[id]; if (bk && bk.model && !mon) { const mb = el('span', 'mbadge ' + g.cls); mb.textContent = bk.model; mb.title = '선언 모델 · backends.json (C1)'; tab.append(mb); }   // C1 role/model badge
      tab.append(bg);
      if (!mon && !wsTabEdit) { const x = el('span', 'ws-tab-x', '✕'); x.title = '탭 닫기'; x.onclick = (e) => { e.stopPropagation(); wsCloseChannel(id); }; tab.append(x); }
      if (wsTabEdit) wsMakeDraggable(tab, 'tab', id, g.key); else tab.onclick = () => wsSetActive(id);
      tabs.append(tab);
    }
    grp.append(tabs);
    bar.appendChild(grp);
  }
  wsRenderArchived();   // 닫은 세션 버튼·드롭다운 동기
}
const WS_ACTIVE_KEY = 'constellation-ws-active';   // 새로고침 시 마지막 선택 탭 복원용 (탭별 입력 draft 와 별개; §13.14 generic key)
function wsSetActive(id) {
  wsState.active = id;
  try { localStorage.setItem(WS_ACTIVE_KEY, id || ''); } catch {}   // 영속 — wsReplayHistory 초기 active 결정부에서 복원
  if (wsIsGroup(id)) { for (const cid of wsGroupMembers(id)) { const c = wsState.channels.get(cid); if (c) c.unseen = 0; wsMaybeRequestHistory(cid); } }
  else { const ch = wsState.channels.get(id); if (ch) ch.unseen = 0; wsMaybeRequestHistory(id); }   // C: cold stub 이면 내용 on-demand 로드
  wsRenderTabs(); wsRenderActiveStream(); updateWsConn(); updateWsBadge();
  if (wsState.debugOpen) wsRenderDebug();
  wsShowTextarea(id);   // 채널별 입력란 스위칭(활성만 표시·포커스, 높이 통일)
  if (wsPagerOn()) wsScrollToActive(true);   // #3a B: 탭 탭 → 페이저 내용영역 자동 수평 스크롤 + 탭바 동기
}

// ---- 모바일 그룹 페이저 (#3a B) — 실시간 내용영역을 그룹별 가로 scroll-snap 페이지로. swipe=그룹전환(탭선택·탭바스크롤 동기), 탭=페이저 자동 스크롤. 데스크탑 미사용(#ws-stream 그대로). ----
const WS_MOBILE_MQ = matchMedia('(max-width: 560px)');
let wsPagerKeys = [];        // 현재 페이저 그룹 key 순서 (집합 변경 감지)
let wsPagerProg = false;     // 프로그램 스크롤 중 — settle 핸들러가 재선택 안 하게
let wsPagerSettleT = null;
function wsPagerOn() { try { return !!wsState.popOpen && WS_MOBILE_MQ.matches; } catch { return false; } }   // TDZ/부재 가드 (v2.4.32 교훈)
function wsGroupKeyOf(id) {   // 채널/모니터 id → 소속 그룹 key (또는 group key 그대로)
  if (wsIsGroup(id)) return id;
  if (id === WS_MON_UP) return 'group:up';
  if (id === WS_MON_LOCAL || id === WS_MON_COLLAB) return 'group:main';
  if (id === WS_MON_BOARD) return 'group:board-worker';
  const ch = wsState.channels.get(id); const role = ch && ch.role;
  return role === 'upstream' ? 'group:up' : role === 'main' ? 'group:main' : role === 'board-worker' ? 'group:board-worker' : role === 'collab' ? 'group:collab' : 'group:local';
}
function wsPagerGroupKeys() { return wsComputeGroups().filter((g) => g.tabs.length).map((g) => g.key); }   // 비어있지 않은 그룹 = 탭바와 동일 집합
function wsBuildPager() {
  const pager = $('#ws-pager'); if (!pager) return;
  const groups = wsComputeGroups().filter((g) => g.tabs.length);
  wsPagerKeys = groups.map((g) => g.key);
  pager.innerHTML = '';
  for (const g of groups) {
    const page = el('div', 'ws-page ' + g.cls); page.dataset.gkey = g.key;
    const ind = el('div', 'ws-page-ind ' + g.cls); ind.innerHTML = `<span class="gmerge">▦</span>${esc(g.label)}<span class="gcnt">${g.tabs.length}</span>`;
    const st = el('div', 'ws-stream ws-page-stream'); st.dataset.gkey = g.key;
    page.append(ind, st);
    pager.appendChild(page);
    wsRenderStreamInto(st, g.key);   // eager 초기 렌더 (≤5 그룹 — drag 중 이웃 그룹 내용 보이도록)
  }
  if (!pager._wired) {   // settle 감지 (debounced scroll) — 1회만 등록
    pager.addEventListener('scroll', () => { if (wsPagerSettleT) clearTimeout(wsPagerSettleT); wsPagerSettleT = setTimeout(wsPagerSettle, 120); }, { passive: true });
    pager._wired = true;
  }
  wsMarkPagerSel(); wsRenderPageDots();
}
function wsPagerEnsureSet() {   // 그룹 집합 변경 시에만 재빌드. 반환: 재빌드 여부
  const pager = $('#ws-pager'); if (!pager) return false;
  const keys = wsPagerGroupKeys();
  if (keys.join('|') !== wsPagerKeys.join('|') || pager.children.length !== keys.length) { wsBuildPager(); return true; }
  return false;
}
function wsRenderActivePageFresh() {   // active 그룹 페이지만 state 로 재렌더 (라이브 catch-up)
  const gkey = wsGroupKeyOf(wsState.active);
  const sel = (window.CSS && CSS.escape) ? CSS.escape(gkey) : gkey;
  const st = document.querySelector('#ws-pager .ws-page-stream[data-gkey="' + sel + '"]');
  if (st) wsRenderStreamInto(st, gkey);
}
function wsSyncPager() {   // 페이저 빌드/갱신 — 스크롤은 안 함 (라이브 행이 페이저 위치 안 흔들도록)
  if (!wsPagerEnsureSet()) wsRenderActivePageFresh();   // 재빌드면 전체 렌더됨, 아니면 active 만 갱신
  wsMarkPagerSel(); wsRenderPageDots();
}
function wsMarkPagerSel() {
  const pager = $('#ws-pager'); if (!pager) return;
  const gk = wsGroupKeyOf(wsState.active);
  pager.querySelectorAll('.ws-page').forEach((p) => p.classList.toggle('sel', p.dataset.gkey === gk));
}
function wsPagerSettle() {   // 사용자 swipe 종료 → 정착 그룹 활성화
  const pager = $('#ws-pager'); if (!pager || !wsPagerOn()) return;
  if (wsPagerProg) { wsPagerProg = false; return; }   // 프로그램 스크롤 = 이미 active 설정됨
  const w = pager.clientWidth || 1; const idx = Math.round(pager.scrollLeft / w);
  const gkey = wsPagerKeys[Math.max(0, Math.min(wsPagerKeys.length - 1, idx))];
  if (gkey) wsActivateFromSwipe(gkey);
}
function wsActivateFromSwipe(gkey) {   // swipe=그룹단위 전환: 그룹 병합 active + 탭선택·탭바스크롤 동기 (페이저는 이미 그 위치라 스크롤 안 함)
  if (wsGroupKeyOf(wsState.active) === gkey) { wsScrollTabToActive(); wsMarkPagerSel(); wsRenderPageDots(); return; }
  wsState.active = gkey;
  try { localStorage.setItem(WS_ACTIVE_KEY, gkey); } catch {}
  for (const cid of wsGroupMembers(gkey)) { const c = wsState.channels.get(cid); if (c) c.unseen = 0; wsMaybeRequestHistory(cid); }
  wsRenderTabs(); wsRenderChanFilter(); updateWsConn(); updateWsBadge(); wsShowTextarea(gkey);
  if (wsState.debugOpen) wsRenderDebug();
  wsRenderActivePageFresh(); wsMarkPagerSel(); wsScrollTabToActive(); wsRenderPageDots();
}
function wsScrollToActive(smooth) {   // 탭 탭/열기 → 페이저를 active 그룹 페이지로 + 탭바 동기
  const pager = $('#ws-pager'); if (!pager) return;
  const idx = wsPagerKeys.indexOf(wsGroupKeyOf(wsState.active));
  if (idx >= 0) {
    wsPagerProg = true;
    pager.scrollTo({ left: idx * (pager.clientWidth || 0), behavior: smooth ? 'smooth' : 'auto' });
    if (!smooth) setTimeout(() => { wsPagerProg = false; }, 60);   // instant 스크롤은 scroll 이벤트 안 날 수도 → 플래그 안전 해제
  }
  wsScrollTabToActive(); wsMarkPagerSel(); wsRenderPageDots();
}
function wsScrollTabToActive() {   // 탭바를 active 탭/그룹헤더가 보이게 가로 스크롤 (바만 — 조상 스크롤 영향 없음)
  const bar = $('#ws-tabs'); if (!bar) return;
  const gk = wsGroupKeyOf(wsState.active);
  const sel = (window.CSS && CSS.escape) ? CSS.escape(gk) : gk;
  const target = bar.querySelector('.ws-tab.active') || bar.querySelector('.grp[data-gkey="' + sel + '"]');
  if (!target) return;
  const r = target.getBoundingClientRect(), br = bar.getBoundingClientRect();
  const delta = (r.left + r.width / 2) - (br.left + br.width / 2);
  if (Math.abs(delta) > 4) { try { bar.scrollBy({ left: delta, behavior: 'smooth' }); } catch { bar.scrollLeft += delta; } }
}
function wsRenderPageDots() {   // 그룹 위치 인디케이터 (점 strip) — 현재 그룹 강조
  const strip = $('#ws-page-dots'); if (!strip) return;
  if (!wsPagerOn() || wsPagerKeys.length < 2) { strip.hidden = true; strip.innerHTML = ''; return; }
  const gk = wsGroupKeyOf(wsState.active);
  strip.hidden = false; strip.innerHTML = '';
  wsPagerKeys.forEach((k) => { const d = el('span', 'ws-pd' + (k === gk ? ' on' : '')); strip.appendChild(d); });
}

// ---- 입력 송신 (활성 채널 targetAgentId) ----
function wsCommon() { return { id: 'b-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), source: 'board', timestamp: Date.now() }; }
function wsSend(obj) {
  const ws = wsState.ws; if (!ws || ws.readyState !== 1 || !wsState.active) return false;
  if (wsIsMon(wsState.active)) return false;   // 모니터 = 읽기 전용
  let routeKey = wsState.active;
  if (wsIsGroup(routeKey)) { const rep = wsGroupRep(routeKey); if (!rep) return false; routeKey = rep; }   // 그룹 = 대표 워커로 라우팅 (group:up→업스트림 대표 · group:main→메인)
  const ch = wsState.channels.get(routeKey);
  const route = (ch && ch.routeId) || routeKey;   // §4: 채널 키가 channelId 여도 라우팅은 routeId(agentId)
  const extra = {};
  if (ch && ch.channelId) extra.channelId = ch.channelId;   // 에코·history 가 같은 채널키로 복원되도록
  if (ch && ch.threadId) extra.threadId = ch.threadId;
  try { ws.send(JSON.stringify({ ...wsCommon(), targetAgentId: route, ...extra, ...obj })); return true; } catch { return false; }
}
function wsLocalRow(kind, label, body) {
  const a = wsState.active; if (!a || wsIsMon(a)) return;
  let pushKey = a;
  if (wsIsGroup(a)) { const rep = wsGroupRep(a); if (!rep) return; pushKey = rep; }   // 그룹 = 대표에 push (그룹 뷰가 대표 워커 행을 보여줌)
  wsPushRow(pushKey, { kind, label, body, dim: false, t: nowHM() });
}
function wsSendPrompt() {
  const ta = wsActiveTextarea(); if (!ta) return;
  const text = ta.value.trim(); if (!text && !wsAtts.length) return;
  const promptId = 'p-' + Date.now().toString(36);
  const atts = wsAtts.map(a => ({ ...a }));
  if (wsSend({ type: 'CUSTOM', name: 'UserPrompt', value: { promptId, text, atts } })) {
    wsLocalRow('user', '🙋 UserPrompt', text + (atts.length ? `  📎${atts.length}` : ''));
    ta.value = ''; ta._h = WS_TA_MIN; wsRecalcTaH(); wsSaveDrafts(); wsAtts.length = 0; renderComposeAtts($('#ws-atts'), wsAtts, () => {}, null);
  } else wsLocalRow('err', '⚠ 미전송', wsState.active ? 'WS 연결 안 됨' : '채널(에이전트) 없음');
}
function wsSendCommand(name) { if (wsSend({ type: 'CUSTOM', name: 'Command', value: { name } })) wsLocalRow('user', '⌘ Command', name); else wsLocalRow('err', '⚠ 미전송', `command ${name}`); }
// stop 버튼 → 프로토콜상 표준 Cancel(cooperative). 표시만 Stop.
function wsSendCancel() { if (wsSend({ type: 'CUSTOM', name: 'Cancel', value: { reason: '사용자 중단(stop)' } })) wsLocalRow('user', '⏹ Stop', '작업 중단 요청'); else wsLocalRow('err', '⚠ 미전송', 'stop'); }
// 오케스트레이션 CUSTOM — 서버가 직접 처리(wsHandleOrch)하는 라우팅 무관 메시지. 활성 채널·그룹 상태에 비의존. #168 RegisterCollabKey 등.
function wsSendOrch(obj) { const ws = wsState.ws; if (!ws || ws.readyState !== 1) return false; try { ws.send(JSON.stringify({ ...wsCommon(), ...obj })); return true; } catch { return false; } }

// ---- #168 외부 협업 초대 (ws-collab-invite.eux 인라인 구현) — RegisterCollabKey 송신 / CollabKeyIssued 수신 → 키·접속 URL ----
// @machine status: idle → issuing → issued (→ reset → idle). 컨트롤러는 onWsEvent 가 setIssued 로 깨운다.
let wsInvite = null;
let wsKeyMgmt = null;   // v2.4.0 — 업스트림 키 발급(UI4) + 키 관리 모달(UI5) 통합 컨트롤러 (RegisterUpstreamKey transitional alias + canonical KeyIssue 둘 다 수용)
// setupWsCollab 제거됨 (v2.4.22 가지치기) — v2.4.2 에서 setupWsKeyMgmt 로 통합된 뒤 미호출 dead code 였음 (E2b 146-심볼 검증에서 확인).

// ---- v2.4.0 #406 UI4/UI5 업스트림 키 관리 (WS-PROTOCOL-KEY-MGMT.md v0.2) ----
// UI4: 🔑 발행 버튼 (협업 🔗 왼쪽) → KeyIssue → KeyIssued{key, joinUrl} 패널 (협업과 동일 패턴)
// UI5: 키 관리 모달 — KeyList 테이블 (라벨 · 연결 상태 · 마지막 에이전트), 삭제 (즉시 / 세션 유지), 라벨 수정 (KeyLabel)
// 호환: 발급 패널은 transitional alias RegisterUpstreamKey/UpstreamKeyIssued 와 canonical KeyIssue/KeyIssued 둘 다 setIssued() 수용
function setupWsKeyMgmt() {
  const head = $('#ws-pop-head'); if (!head || $('#ws-key-wrap')) return;
  const wrap = document.createElement('span'); wrap.id = 'ws-key-wrap'; wrap.className = 'ws-collab-wrap';
  const btn = document.createElement('button'); btn.id = 'ws-key-btn'; btn.className = 'ws-arch-btn'; btn.type = 'button';
  btn.title = '키 발행 + 관리 (업스트림 / 로컬워커 / 외부협업 통합)'; btn.textContent = '🔑';   // v2.4.2: 통합 버튼은 열쇠 이모지, 모달 안 업스트림 선택 항목은 ⬆ 화살표로 차별화
  const panel = document.createElement('div'); panel.id = 'ws-key-panel'; panel.className = 'ws-collab-panel'; panel.hidden = true;
  wrap.appendChild(btn); wrap.appendChild(panel);
  const collabWrap = head.querySelector('#ws-collab-wrap');
  if (collabWrap) head.insertBefore(wrap, collabWrap); else { const archWrap = head.querySelector('.ws-arch-wrap'); if (archWrap) head.insertBefore(wrap, archWrap); else head.appendChild(wrap); }

  let status = 'idle', key = '', joinUrl = '', label = '', kind = 'local', roleDescription = '', joinHint = '', joinFile = '';   // v2.4.2: 기본값 local
  function render() {
    panel.textContent = '';
    const h = document.createElement('div'); h.className = 'ws-invite-h'; h.textContent = '🔑 키 발행 (UI4)'; panel.appendChild(h);
    if (status === 'idle' || status === 'error') {
      // v2.4.2 kind 선택 순서: 업스트림 (⬆) / 로컬워커 (🏠) / 외부협업 (🔗) + 기본값 local + 선택 시 label input 포커스
      const kindRow = document.createElement('div'); kindRow.className = 'ws-invite-kindrow';
      const KIND_DEFS = [
        { v: 'upstream', icon: '⬆', label: '업스트림' },
        { v: 'local',    icon: '🏠', label: '로컬워커' },
        { v: 'collab',   icon: '🔗', label: '외부협업' },
      ];
      KIND_DEFS.forEach((kd) => {
        const lab = document.createElement('label'); lab.className = 'ws-invite-kindopt' + (kind === kd.v ? ' active' : '');
        const rd = document.createElement('input'); rd.type = 'radio'; rd.name = 'ws-key-kind'; rd.value = kd.v; rd.checked = kind === kd.v;
        rd.onchange = () => { kind = kd.v; render(); setTimeout(() => { const li = panel.querySelector('.ws-invite-label'); if (li) li.focus(); }, 0); };
        const txt = document.createElement('span'); txt.className = 'ws-invite-kindopt-txt'; txt.textContent = kd.icon + ' ' + kd.label;
        lab.append(rd, txt); kindRow.append(lab);
      });
      panel.appendChild(kindRow);
      const inp = document.createElement('input'); inp.className = 'ws-invite-label';
      inp.placeholder = kind === 'local' ? '워커 라벨 (alphanumeric, 예: worker-1)' : '키 라벨 (예: phone-claude)';
      inp.value = label;
      panel.appendChild(inp);
      const rdInp = document.createElement('textarea'); rdInp.className = 'ws-invite-roledesc'; rdInp.placeholder = '역할 설명 — 합류할 에이전트에게 전달 (선택)'; rdInp.rows = 2; rdInp.value = roleDescription;
      panel.appendChild(rdInp);
      const b = document.createElement('button'); b.className = 'ws-invite-btn'; b.type = 'button'; b.textContent = '키 발급';
      b.onclick = () => { label = inp.value.trim(); roleDescription = rdInp.value.trim(); issue(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); label = inp.value.trim(); roleDescription = rdInp.value.trim(); issue(); } });
      panel.appendChild(b);
      if (status === 'error') { const e = document.createElement('div'); e.className = 'ws-invite-meta'; e.style.color = '#e0455e'; e.textContent = '⚠ ' + (key || '발급 실패'); panel.appendChild(e); }
      const mg = document.createElement('button'); mg.className = 'ws-invite-new'; mg.type = 'button'; mg.textContent = '🔐 키 관리'; mg.onclick = () => { panel.hidden = true; openManager(); };
      panel.appendChild(mg);
    } else if (status === 'issuing') {
      const b = document.createElement('button'); b.className = 'ws-invite-btn'; b.type = 'button'; b.textContent = '발급 중…'; b.disabled = true;
      panel.appendChild(b);
    } else {   // issued
      const kindIcon = kind === 'collab' ? '🔗' : kind === 'local' ? '🏠' : '🔑';
      const meta = document.createElement('div'); meta.className = 'ws-invite-meta'; meta.textContent = kindIcon + ' ' + (label || kind) + (kind === 'local' ? '' : ' · ' + key.slice(0, 14) + '…');
      panel.appendChild(meta);
      if (roleDescription) { const rdEl = document.createElement('div'); rdEl.className = 'ws-invite-roledesc-show'; rdEl.textContent = '🎭 ' + roleDescription; panel.appendChild(rdEl); }
      if (kind === 'local') {
        const hintEl = document.createElement('div'); hintEl.className = 'ws-invite-url'; hintEl.textContent = joinHint || ('LOCAL_KEY_FILE=' + joinFile + ' WS_AGENT_ID=' + label + ' node scripts/join-local.cjs'); panel.appendChild(hintEl);
        const note = document.createElement('div'); note.className = 'ws-invite-meta'; note.style.fontSize = '.7rem'; note.style.color = 'var(--muted)'; note.textContent = '키는 ' + joinFile + ' 파일에 저장됨 (외부 wire 미전달).'; panel.appendChild(note);
        const row = document.createElement('div'); row.className = 'ws-invite-row';
        const cpHint = document.createElement('button'); cpHint.className = 'ws-invite-copy'; cpHint.type = 'button'; cpHint.textContent = '명령 복사'; cpHint.onclick = () => copy(cpHint, joinHint);
        const nw = document.createElement('button'); nw.className = 'ws-invite-new'; nw.type = 'button'; nw.textContent = '새 키'; nw.onclick = () => { status = 'idle'; key = ''; joinUrl = ''; joinHint = ''; joinFile = ''; roleDescription = ''; render(); };
        const mg = document.createElement('button'); mg.className = 'ws-invite-new'; mg.type = 'button'; mg.textContent = '🔐 관리'; mg.onclick = () => { panel.hidden = true; openManager(); };
        row.appendChild(cpHint); row.appendChild(nw); row.appendChild(mg);
        panel.appendChild(row);
      } else {
        const urlEl = document.createElement('div'); urlEl.className = 'ws-invite-url'; urlEl.textContent = joinUrl || key;
        const row = document.createElement('div'); row.className = 'ws-invite-row';
        const cpUrl = document.createElement('button'); cpUrl.className = 'ws-invite-copy'; cpUrl.type = 'button'; cpUrl.textContent = 'URL 복사'; cpUrl.onclick = () => copy(cpUrl, joinUrl || key);
        const cpKey = document.createElement('button'); cpKey.className = 'ws-invite-copy'; cpKey.type = 'button'; cpKey.textContent = '키만 복사'; cpKey.onclick = () => copy(cpKey, key);
        const nw = document.createElement('button'); nw.className = 'ws-invite-new'; nw.type = 'button'; nw.textContent = '새 키'; nw.onclick = () => { status = 'idle'; key = ''; joinUrl = ''; roleDescription = ''; render(); };
        const mg = document.createElement('button'); mg.className = 'ws-invite-new'; mg.type = 'button'; mg.textContent = '🔐 관리'; mg.onclick = () => { panel.hidden = true; openManager(); };
        row.appendChild(cpUrl); row.appendChild(cpKey); row.appendChild(nw); row.appendChild(mg);
        panel.appendChild(urlEl); panel.appendChild(row);
      }
    }
  }
  function issue() {   // v2.4.0 canonical KeyIssue + v2.4.1 kind + roleDescription
    const value = { label: label || undefined, kind, roleDescription: roleDescription || undefined };
    if (wsSendOrch({ type: 'CUSTOM', name: 'KeyIssue', value })) { status = 'issuing'; render(); }
    else { status = 'error'; key = 'WS 연결 안 됨 — 잠시 후 다시'; render(); }
  }
  function copy(b, text) {
    const done = () => { const o = b.textContent; b.textContent = '복사됨 ✓'; setTimeout(() => { b.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => { b.textContent = '복사 실패'; });
    else b.textContent = '복사 실패';
  }
  btn.onclick = (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; if (!panel.hidden) render(); };
  document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('#ws-key-wrap')) panel.hidden = true; });

  // ---- UI5 키 관리 모달 ----
  let modal = null, modalKeys = [], activeTab = 'all';   // v2.4.2 탭 필터
  function buildModal() {
    if (modal) return modal;
    modal = document.createElement('div'); modal.id = 'ws-key-modal'; modal.className = 'ws-key-modal'; modal.hidden = true;
    const box = document.createElement('div'); box.className = 'ws-key-box';
    const head2 = document.createElement('div'); head2.className = 'ws-key-mhead';
    const title = document.createElement('b'); title.textContent = '🔐 키 관리';
    const refresh = document.createElement('button'); refresh.className = 'ws-key-refresh'; refresh.type = 'button'; refresh.textContent = '↻'; refresh.title = '새로고침'; refresh.onclick = () => requestList();
    const x = document.createElement('button'); x.className = 'ws-key-mx'; x.type = 'button'; x.textContent = '✕'; x.onclick = () => closeManager();
    head2.append(title, refresh, x);
    // v2.4.2 탭 (전체 / 업스트림 / 로컬워커 / 외부협업)
    const tabs = document.createElement('div'); tabs.id = 'ws-key-tabs'; tabs.className = 'ws-key-tabs';
    const TAB_DEFS = [
      { v: 'all',      label: '전체' },
      { v: 'upstream', label: '⬆ 업스트림' },
      { v: 'local',    label: '🏠 로컬워커' },
      { v: 'collab',   label: '🔗 외부협업' },
    ];
    TAB_DEFS.forEach((td) => {
      const tb = document.createElement('button'); tb.className = 'ws-key-tab' + (activeTab === td.v ? ' active' : ''); tb.type = 'button'; tb.dataset.tab = td.v; tb.textContent = td.label;
      tb.onclick = () => { activeTab = td.v; modal.querySelectorAll('.ws-key-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === activeTab)); renderTable(); };
      tabs.appendChild(tb);
    });
    const tbl = document.createElement('div'); tbl.id = 'ws-key-tbl'; tbl.className = 'ws-key-tbl';
    box.append(head2, tabs, tbl); modal.append(box);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeManager(); });
    document.body.appendChild(modal);
    return modal;
  }
  const CONN_DOT = { connected: ['on', '연결됨'], disconnected: ['off', '끊김'], never: ['never', '미사용'] };
  const STATE_LABEL = { ISSUED: '발급됨', ACTIVE: '활성', REVOKED_PENDING: '폐기 대기', REVOKED: '폐기됨', DELETED: '삭제됨' };
  function renderTable() {
    const tbl = $('#ws-key-tbl'); if (!tbl) return;
    tbl.innerHTML = '';
    // v2.4.2 활성 탭 필터링
    const filtered = activeTab === 'all' ? modalKeys : modalKeys.filter((k) => (k.kind || 'upstream') === activeTab);
    if (!filtered.length) { tbl.innerHTML = '<div class="ws-key-empty">' + (activeTab === 'all' ? '발행된 키가 없어요. 🔑 발행 버튼으로 키를 만들어 보세요.' : '이 탭에 해당하는 키가 없어요.') + '</div>'; return; }
    for (const k of filtered) {
      const rowEl = document.createElement('div'); rowEl.className = 'ws-key-row state-' + (k.state || '').toLowerCase();
      const top = document.createElement('div'); top.className = 'ws-key-rtop';
      const [dotCls, connTxt] = CONN_DOT[k.connectionStatus] || CONN_DOT.never;
      const dot = document.createElement('span'); dot.className = 'ws-key-dot ' + dotCls; dot.title = connTxt;
      // v2.4.2 이모지 통일 — 발행 창 선택 항목과 동일 (⬆ 업스트림 / 🏠 로컬워커 / 🔗 외부협업)
      const kindIcon = document.createElement('span'); kindIcon.className = 'ws-key-kind'; kindIcon.textContent = k.kind === 'collab' ? '🔗' : k.kind === 'local' ? '🏠' : '⬆'; kindIcon.title = k.kind === 'collab' ? '외부협업 키' : k.kind === 'local' ? '로컬워커 키 (파일 경로 등록)' : '업스트림 키';
      const lab = document.createElement('span'); lab.className = 'ws-key-label'; lab.textContent = k.label || '(무라벨)';
      const st = document.createElement('span'); st.className = 'ws-key-state ' + (k.state || '').toLowerCase(); st.textContent = STATE_LABEL[k.state] || k.state;
      top.append(dot, kindIcon, lab, st);
      const sub = document.createElement('div'); sub.className = 'ws-key-sub';
      const ag = k.lastAgent ? ('에이전트: ' + k.lastAgent) : '미접속';
      const seen = k.lastSeenAt ? (' · ' + new Date(k.lastSeenAt).toLocaleString()) : '';
      const keyDisp = k.key ? (k.key.slice(0, 14) + '…') : (k.kind === 'local' ? 'local-keys/' + k.label + '.key (파일)' : '(no key)');
      sub.textContent = keyDisp + ' · ' + connTxt + ' · ' + ag + seen;
      if (k.roleDescription) { const rd = document.createElement('div'); rd.className = 'ws-key-roledesc'; rd.textContent = '🎭 ' + k.roleDescription; rowEl.append(top, sub, rd); }
      else { rowEl.append(top, sub); }
      const acts = document.createElement('div'); acts.className = 'ws-key-acts';
      const terminal = k.state === 'REVOKED' || k.state === 'DELETED';
      if (!terminal) {
        const ren = document.createElement('button'); ren.className = 'ws-key-act'; ren.type = 'button'; ren.textContent = '✏️ 라벨'; ren.onclick = () => relabel(k); acts.append(ren);
        const rvImm = document.createElement('button'); rvImm.className = 'ws-key-act danger'; rvImm.type = 'button'; rvImm.textContent = '🗑 즉시 삭제'; rvImm.title = '연결된 에이전트 즉시 차단'; rvImm.onclick = () => revoke(k, 'immediate'); acts.append(rvImm);
        if (k.connectionStatus === 'connected') { const rvEnd = document.createElement('button'); rvEnd.className = 'ws-key-act'; rvEnd.type = 'button'; rvEnd.textContent = '⏳ 세션 유지 삭제'; rvEnd.title = '현재 세션은 유지, 신규 접속 차단'; rvEnd.onclick = () => revoke(k, 'sessionEnd'); acts.append(rvEnd); }
      } else { const note = document.createElement('span'); note.className = 'ws-key-term'; note.textContent = STATE_LABEL[k.state] || k.state; acts.append(note); }
      rowEl.append(acts); tbl.append(rowEl);
    }
  }
  async function relabel(k) {
    const nv = await wsPrompt('새 라벨 (1~64자):', k.label || '', { title: '키 라벨 변경' }); if (nv == null) return;
    const v = nv.trim(); if (!v || v === k.label) return;
    wsSendOrch({ type: 'CUSTOM', name: 'KeyLabel', value: { key: k.key, newLabel: v } });
  }
  async function revoke(k, mode) {
    const msg = mode === 'immediate' ? `'${k.label || k.key.slice(0, 12)}' 키를 즉시 삭제할까요? 연결된 에이전트가 바로 차단돼요.` : `'${k.label || k.key.slice(0, 12)}' 키를 세션 유지 삭제할까요? 현재 세션은 끝까지 유지되고 신규 접속만 막아요.`;
    if (!(await wsConfirm(msg, { title: '키 삭제 확인', danger: true, okLabel: '삭제' }))) return;
    wsSendOrch({ type: 'CUSTOM', name: 'KeyRevoke', value: { key: k.key, mode } });
  }
  function requestList() { wsSendOrch({ type: 'CUSTOM', name: 'KeyList', value: { includeRevoked: true } }); }
  function openManager() { buildModal(); modal.hidden = false; renderTable(); requestList(); }   // v2.4.2 즉시 placeholder 렌더 (응답 대기 동안 빈 화면 방지)
  function closeManager() { if (modal) modal.hidden = true; }

  wsKeyMgmt = {
    openManager,
    openIssuePanel() { panel.hidden = false; render(); },   // 키 발행 패널 직접 열기 (우클릭 컨텍스트 메뉴용)
    setIssued(p) { p = p || {}; key = p.key || ''; joinUrl = p.joinUrl || ''; joinHint = p.joinHint || ''; joinFile = p.joinFile || ''; if (p.label != null) label = p.label; if (p.kind != null) kind = p.kind; if (p.roleDescription != null) roleDescription = p.roleDescription; status = 'issued'; panel.hidden = false; render(); },
    setError(p) { status = 'error'; key = (p && (p.message || p.code)) || '발급 실패'; render(); },
    setList(keys) { modalKeys = Array.isArray(keys) ? keys : []; if (modal && !modal.hidden) renderTable(); },
    onMutated() { if (modal && !modal.hidden) requestList(); },
  };
  render();
}

// ---- 상태 표시 ----
function updateWsBadge() {
  const b = $('#ws-badge'); if (!b) return;
  let total = 0; for (const ch of wsState.channels.values()) total += ch.unseen;
  b.textContent = total > 99 ? '99+' : String(total);
  b.hidden = total === 0 || wsState.popOpen;
}
function updateWsConn() {
  const active = wsState.active;
  const grp = wsIsGroup(active), mon = wsIsMon(active);
  const ch = (!grp && active) ? wsState.channels.get(active) : null;
  const present = mon || grp || (!!ch && wsState.present.has(ch.routeId || active));   // §4: routeId 연결로 판정
  const connected = wsState.open && (grp || !!ch) && present;
  const dot = $('#ws-conn-dot'), txt = $('#ws-conn-text'), agent = $('#ws-agent'), seq = $('#ws-seq'), hdot = $('#ws-head-dot'), meta = $('#ws-pop-meta');
  if (dot) dot.classList.toggle('on', connected);
  if (hdot) hdot.classList.toggle('off', !connected);
  const grpName = active === 'group:up' ? '업스트림 그룹' : active === 'group:main' ? '메인 그룹' : active === 'group:board-worker' ? '보드워커 그룹' : active === 'group:collab' ? '협업 그룹' : '로컬 그룹';
  if (agent) agent.textContent = grp ? grpName : ((ch && ch.name) || '에이전트');
  if (txt) txt.textContent = !wsState.open ? '서버 연결 끊김' : grp ? '그룹 병합 뷰(시간순)' : mon ? '모니터 (읽기 전용)' : (!ch ? '에이전트 없음' : (ch.connStatus === 'restored' ? '연결 복원됨' : (present ? '연결됨' : '연결 끊김')));
  if (seq) seq.textContent = (ch && ch.seq != null) ? `· seq ${ch.seq}` : '';
  // §6 project metadata: 프로젝트명 + GitHub repo 링크(없으면 채널키·runId)
  if (meta) {
    let html = '';
    if (ch && ch.projectName) html += `<span class="ws-proj">📁 ${esc(ch.projectName)}</span>`;
    if (ch && ch.githubRepo) { const r = String(ch.githubRepo).replace(/^https?:\/\/github\.com\//, ''); html += ` <a class="ws-repo" href="https://github.com/${encodeURI(r)}" target="_blank" rel="noopener noreferrer">⎇ ${esc(r)}</a>`; }
    if (!html && ch) html = [active, ch.runId].filter(Boolean).map(v => '· ' + esc(v)).join(' ');
    meta.innerHTML = html;
  }
  // 그룹/모니터 읽기 전용 입력란 전환은 wsShowTextarea(wsSetActive) 가 처리
}
// ---- 팝업 UI 상태(위치·크기·열림) 영속 — 클라별 UI 선호라 localStorage ----
// 위치 표현: 활성 anchor (preset) 기준 모서리 거리로 inline 4 좌표 표현. 화면/창 resize 시 그 모서리 거리 유지.
const WS_UI = 'constellation-ws-ui';
const WS_POS = 'constellation-ws-position';   // 'tl' | 'tr' | 'bl' | 'br' — 위치 anchor (기본 'br')
const WS_POS_VALID = ['tl', 'tr', 'bl', 'br'];
function wsCurrentAnchor() {
  const pop = $('#ws-pop'); if (!pop) return wsLoadPositionPref();
  for (const c of WS_POS_VALID) if (pop.classList.contains('pos-' + c)) return c;
  return wsLoadPositionPref();
}
function wsRectToAnchorPos(rect, anchor) {   // viewport rect → anchor 모서리 거리 (inline 4 좌표)
  const o = { left: 'auto', right: 'auto', top: 'auto', bottom: 'auto' };
  if (anchor === 'tl')      { o.left  = Math.round(rect.left) + 'px';                  o.top    = Math.round(rect.top) + 'px'; }
  else if (anchor === 'tr') { o.right = Math.round(innerWidth - rect.right) + 'px';    o.top    = Math.round(rect.top) + 'px'; }
  else if (anchor === 'bl') { o.left  = Math.round(rect.left) + 'px';                  o.bottom = Math.round(innerHeight - rect.bottom) + 'px'; }
  else                      { o.right = Math.round(innerWidth - rect.right) + 'px';    o.bottom = Math.round(innerHeight - rect.bottom) + 'px'; }
  return o;
}
function wsApplyAnchorPos(pop, pos) {   // 4 좌표 inline 적용 (auto 포함 — class 의 fallback 무력화)
  pop.style.left   = pos.left;
  pop.style.right  = pos.right;
  pop.style.top    = pos.top;
  pop.style.bottom = pos.bottom;
}
function wsSaveUI() {
  try {
    const pop = $('#ws-pop'); if (!pop) return;
    const s = pop.style;
    const o = { open: !!wsState.popOpen };
    // 사용자가 옮기거나 리사이즈했을 때만 inline 좌표/크기 영속 (4 좌표 중 하나라도 있거나 width/height inline)
    if (s.left || s.right || s.top || s.bottom || s.width || s.height) {
      o.pos = { left: s.left || '', right: s.right || '', top: s.top || '', bottom: s.bottom || '', width: s.width || '', height: s.height || '' };
    }
    localStorage.setItem(WS_UI, JSON.stringify(o));
  } catch {}
}
function wsLoadUI() {
  try {
    const o = JSON.parse(localStorage.getItem(WS_UI) || 'null') || {};
    const pop = $('#ws-pop'); if (!pop) return;
    // anchor class 먼저 적용 (preset 거리 fallback)
    const pref = wsLoadPositionPref();
    pop.classList.remove('pos-tl', 'pos-tr', 'pos-bl', 'pos-br');
    pop.classList.add('pos-' + pref);
    if (o.pos) {
      // 마이그레이션 — 구 형식 (left/top 절대좌표만, right/bottom 키 없음) 감지 시 현재 anchor 기준 거리로 재계산 + 영속 갱신
      const isLegacy = !('right' in o.pos) && !('bottom' in o.pos);
      if (isLegacy && o.pos.left) {
        const left  = parseInt(o.pos.left,   10) || 0;
        const top   = parseInt(o.pos.top,    10) || 0;
        const width = parseInt(o.pos.width,  10) || 645;
        const height= parseInt(o.pos.height, 10) || 540;
        const rect = { left, top, right: left + width, bottom: top + height };
        const ap = wsRectToAnchorPos(rect, pref);
        o.pos = { left: ap.left, right: ap.right, top: ap.top, bottom: ap.bottom, width: o.pos.width || '', height: o.pos.height || '' };
        try { localStorage.setItem(WS_UI, JSON.stringify(o)); } catch {}
      }
      // 사용자가 옮긴 4 좌표 + 크기 복원 (anchor 모서리 거리 그대로 — 화면 resize 시 거리 유지)
      pop.style.left   = o.pos.left   || '';
      pop.style.right  = o.pos.right  || '';
      pop.style.top    = o.pos.top    || '';
      pop.style.bottom = o.pos.bottom || '';
      if (o.pos.width)  pop.style.width  = o.pos.width;
      if (o.pos.height) pop.style.height = o.pos.height;
    }
    if (o.open) toggleWsPop(true);
  } catch {}
}
function wsLoadPositionPref() {
  try { const p = localStorage.getItem(WS_POS); if (WS_POS_VALID.includes(p)) return p; } catch {}
  return 'br';
}
function wsApplyPosition(p, opts) {
  const pop = $('#ws-pop'); if (!pop) return;
  opts = opts || {};
  // 'center' — 현재 활성 anchor 기준으로 가운데 정렬 (anchor 모서리 거리로 표현하여 화면 resize 시 거리 유지)
  if (p === 'center') {
    const anchor = wsCurrentAnchor();
    const r = pop.getBoundingClientRect();
    const tLeft = Math.max(0, (innerWidth - r.width) / 2);
    const tTop  = Math.max(0, (innerHeight - r.height) / 2);
    const tRect = { left: tLeft, top: tTop, right: tLeft + r.width, bottom: tTop + r.height };
    wsApplyAnchorPos(pop, wsRectToAnchorPos(tRect, anchor));
    wsSaveUI();
    return;
  }
  if (!WS_POS_VALID.includes(p)) p = 'br';
  pop.classList.remove('pos-tl', 'pos-tr', 'pos-bl', 'pos-br');
  pop.classList.add('pos-' + p);
  // preset 클릭 = 기본 거리 (22px / 88px) 로 정렬. inline 4 좌표 클리어 → class 가 anchor 모서리 거리 제공.
  pop.style.left = ''; pop.style.top = ''; pop.style.right = ''; pop.style.bottom = '';
  if (opts.persist !== false) {
    try { localStorage.setItem(WS_POS, p); } catch {}
    try { const o = JSON.parse(localStorage.getItem(WS_UI) || 'null') || {}; delete o.pos; localStorage.setItem(WS_UI, JSON.stringify(o)); } catch {}
  }
}
function toggleWsPop(show) {
  const pop = $('#ws-pop'); if (!pop) return;
  const open = show === undefined ? pop.hidden : show;
  pop.hidden = !open;
  wsState.popOpen = open;
  if (open) {
    const ch = wsState.active && wsState.channels.get(wsState.active); if (ch) ch.unseen = 0;
    wsRenderTabs(); wsRenderActiveStream(); updateWsConn();
    wsShowTextarea(wsState.active);   // 열 때 활성 채널 입력란 표시·포커스
    if (wsPagerOn()) wsScrollToActive(false);   // #3a B: 모바일 — 열 때 페이저를 active 그룹 페이지로 정렬
  }
  updateWsBadge();
  wsSaveUI();
  syncMobileTabbar();
}

// ---- 모바일 하단 탭바 (A — 최상위 탭전환; 실시간=팝업 풀스크린 pane, ≤560px) ----
function syncMobileTabbar() {
  const bar = document.getElementById('mobile-tabbar'); if (!bar) return;
  let popOpen, panes;
  try { popOpen = wsState.popOpen; panes = ui.panes; } catch (e) { return; }   // 초기 applyPanes 호출은 wsState(const, 하단 정의) 초기화 전 — TDZ 가드(이후 setupMobileTabbar/재호출에서 정상 동기)
  const active = popOpen ? 'realtime' : (panes && panes.includes('decisions') && !panes.includes('dashboard') ? 'decisions' : (panes && panes.includes('dashboard') ? 'dashboard' : null));
  bar.querySelectorAll('[data-mtab]').forEach((b) => b.classList.toggle('active', b.dataset.mtab === active));
}
function setupMobileTabbar() {
  const bar = document.getElementById('mobile-tabbar'); if (!bar) return;
  bar.querySelectorAll('[data-mtab]').forEach((b) => { b.onclick = () => {
    const t = b.dataset.mtab;   // 위키 = #4 Compendium 자리 (v0.2-d 구현 — else 분기에서 setPanes('wiki'))
    if (t === 'realtime') { if (!wsState.popOpen) toggleWsPop(true); }
    else { if (wsState.popOpen) toggleWsPop(false); setPanes(t, false); }
    syncMobileTabbar();
  }; });
  WS_MOBILE_MQ.addEventListener('change', () => {   // #3a B: 560px 경계 교차 — 페이저↔단일스트림 모드 전환 재렌더
    if (!wsState.popOpen) return;
    wsRenderTabs(); wsRenderActiveStream(); updateWsConn();   // wsRenderActiveStream 이 wsPagerOn 분기
    if (wsPagerOn()) wsScrollToActive(false);
  });
  syncMobileTabbar();
}

// ---- 8방향 리사이즈 (모든 면·모서리) ----
function setupWsResize(pop) {
  let rz = null;
  pop.querySelectorAll('.ws-rsz').forEach(h => {
    h.addEventListener('mousedown', (e) => {
      const r = pop.getBoundingClientRect();
      rz = { dir: h.dataset.dir, x: e.clientX, y: e.clientY, left: r.left, top: r.top, w: r.width, h: r.height, anchor: wsCurrentAnchor() };
      // 리사이즈 진행 중에는 left/top + width/height 로 작업, 종료 시 anchor 기준 정규화
      pop.style.left = r.left + 'px'; pop.style.top = r.top + 'px'; pop.style.right = 'auto'; pop.style.bottom = 'auto';
      e.preventDefault(); e.stopPropagation();
    });
  });
  window.addEventListener('mousemove', (e) => {
    if (!rz) return;
    const dx = e.clientX - rz.x, dy = e.clientY - rz.y, MIN = 320;
    let left = rz.left, top = rz.top, w = rz.w, h = rz.h;
    if (rz.dir.includes('e')) w = Math.max(MIN, rz.w + dx);
    if (rz.dir.includes('s')) h = Math.max(MIN, rz.h + dy);
    if (rz.dir.includes('w')) { const nw = Math.max(MIN, rz.w - dx); left = rz.left + (rz.w - nw); w = nw; }
    if (rz.dir.includes('n')) { const nh = Math.max(MIN, rz.h - dy); top = rz.top + (rz.h - nh); h = nh; }
    pop.style.left = left + 'px'; pop.style.top = top + 'px'; pop.style.width = w + 'px'; pop.style.height = h + 'px';
  });
  window.addEventListener('mouseup', () => {
    if (!rz) return;
    // 리사이즈 종료 — 현재 rect → active anchor 기준 모서리 거리로 정규화 (화면 resize 시 거리 유지)
    const r = pop.getBoundingClientRect();
    wsApplyAnchorPos(pop, wsRectToAnchorPos(r, rz.anchor));
    rz = null; wsSaveUI();
  });
}

// ---- 자체 confirm/prompt 다이얼로그 (브라우저 native 대체, Promise 기반) ----
// wsConfirm(message, opts?) → Promise<boolean>           — 사용자 OK=true / Cancel/ESC/backdrop=false
// wsPrompt(message, initial?, opts?) → Promise<string|null> — OK=입력값 / Cancel=null
// opts: { title?, okLabel?, cancelLabel?, danger?, placeholder? }
function wsConfirm(message, opts) {
  opts = opts || {};
  return new Promise((resolve) => {
    const modal = document.createElement('div'); modal.className = 'ws-confirm-modal';
    const box = document.createElement('div'); box.className = 'ws-confirm-box';
    if (opts.title) { const h = document.createElement('div'); h.className = 'ws-confirm-head'; h.textContent = opts.title; box.appendChild(h); }
    const body = document.createElement('div'); body.className = 'ws-confirm-body'; body.textContent = message; box.appendChild(body);
    const foot = document.createElement('div'); foot.className = 'ws-confirm-foot';
    const cancelBtn = document.createElement('button'); cancelBtn.type = 'button'; cancelBtn.className = 'ws-confirm-btn'; cancelBtn.textContent = opts.cancelLabel || '취소';
    const okBtn = document.createElement('button'); okBtn.type = 'button'; okBtn.className = 'ws-confirm-btn ' + (opts.danger ? 'danger' : 'primary'); okBtn.textContent = opts.okLabel || '확인';
    foot.append(cancelBtn, okBtn); box.appendChild(foot); modal.appendChild(box); document.body.appendChild(modal);
    const close = (result) => { modal.remove(); document.removeEventListener('keydown', onKey); resolve(result); };
    cancelBtn.onclick = () => close(false);
    okBtn.onclick = () => close(true);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(false); });
    const onKey = (e) => { if (e.key === 'Escape') close(false); else if (e.key === 'Enter') close(true); };
    document.addEventListener('keydown', onKey);
    setTimeout(() => okBtn.focus(), 50);
  });
}
function wsPrompt(message, initialValue, opts) {
  opts = opts || {};
  return new Promise((resolve) => {
    const modal = document.createElement('div'); modal.className = 'ws-confirm-modal';
    const box = document.createElement('div'); box.className = 'ws-confirm-box';
    if (opts.title) { const h = document.createElement('div'); h.className = 'ws-confirm-head'; h.textContent = opts.title; box.appendChild(h); }
    const body = document.createElement('div'); body.className = 'ws-confirm-body'; body.textContent = message; box.appendChild(body);
    const input = document.createElement('input'); input.className = 'ws-confirm-input'; input.type = 'text'; input.value = initialValue == null ? '' : String(initialValue);
    if (opts.placeholder) input.placeholder = opts.placeholder;
    box.appendChild(input);
    const foot = document.createElement('div'); foot.className = 'ws-confirm-foot';
    const cancelBtn = document.createElement('button'); cancelBtn.type = 'button'; cancelBtn.className = 'ws-confirm-btn'; cancelBtn.textContent = opts.cancelLabel || '취소';
    const okBtn = document.createElement('button'); okBtn.type = 'button'; okBtn.className = 'ws-confirm-btn primary'; okBtn.textContent = opts.okLabel || '확인';
    foot.append(cancelBtn, okBtn); box.appendChild(foot); modal.appendChild(box); document.body.appendChild(modal);
    const close = (result) => { modal.remove(); document.removeEventListener('keydown', onKey); resolve(result); };
    cancelBtn.onclick = () => close(null);
    okBtn.onclick = () => close(input.value);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(null); });
    const onKey = (e) => { if (e.key === 'Escape') close(null); else if (e.key === 'Enter' && document.activeElement === input) close(input.value); };
    document.addEventListener('keydown', onKey);
    setTimeout(() => { input.focus(); input.select(); }, 50);
  });
}

// ---- 실시간 창 설정 모달 (창 배치 등) ----
let wsSettings = null;
let wsAccessRefresh = null;   // #5a-2 접근 제어 섹션 GET 갱신 (설정 모달 open 시 호출)
function setupWsSettings() {
  const btn = $('#ws-settings-btn'); if (!btn) return;
  let modal = null;
  function build() {
    if (modal) return modal;
    modal = document.createElement('div'); modal.id = 'ws-settings-modal'; modal.className = 'ws-settings-modal'; modal.hidden = true;
    const box = document.createElement('div'); box.className = 'ws-settings-box';
    const head = document.createElement('div'); head.className = 'ws-settings-head';
    const title = document.createElement('b'); title.textContent = '⚙ 설정';
    const x = document.createElement('button'); x.className = 'ws-settings-mx'; x.type = 'button'; x.textContent = '✕'; x.onclick = close;
    head.append(title, x);
    const body = document.createElement('div'); body.className = 'ws-settings-body';
    // 창 배치 preset 4종
    const sec = document.createElement('div'); sec.className = 'ws-set-section';
    const h = document.createElement('h4'); h.textContent = '창 배치 기준'; sec.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'ws-pos-grid';
    const POS_DEFS = [
      { v: 'tl', arrow: '↖', name: '좌상' },
      { v: 'tr', arrow: '↗', name: '우상' },
      { v: 'bl', arrow: '↙', name: '좌하' },
      { v: 'br', arrow: '↘', name: '우하 (기본)' },
    ];
    const cur = wsLoadPositionPref();
    POS_DEFS.forEach((pd) => {
      const c = document.createElement('button'); c.type = 'button'; c.className = 'ws-pos-card' + (cur === pd.v ? ' active' : ''); c.dataset.pos = pd.v;
      const a = document.createElement('span'); a.className = 'ws-pos-arrow'; a.textContent = pd.arrow;
      const n = document.createElement('span'); n.className = 'ws-pos-name'; n.textContent = pd.name;
      c.append(a, n);
      c.onclick = () => {
        wsApplyPosition(pd.v);
        grid.querySelectorAll('.ws-pos-card').forEach((el) => el.classList.toggle('active', el.dataset.pos === pd.v));
      };
      grid.appendChild(c);
    });
    sec.appendChild(grid);
    const desc = document.createElement('div'); desc.className = 'ws-set-desc';
    desc.textContent = '선택한 모서리 기준 거리가 유지돼요 — 화면 / 창 크기가 변해도 그 모서리에서 같은 거리. 예: "우하" 선택 + 창을 우측 하단에 가깝게 놓으면 화면이 늘어나도 우하 모서리 거리 동일.';
    sec.appendChild(desc);
    const hint = document.createElement('div'); hint.className = 'ws-set-hint'; hint.textContent = '창을 드래그하면 그 위치가 새 거리로 자동 저장. 기본 거리로 되돌리려면 위 옵션 중 하나를 다시 클릭.';
    sec.appendChild(hint);
    body.appendChild(sec);

    // #5a-3 접속 제어 — 표면별(UI/agent/MCP) 기본 차단·허용 토글 + 키 요구 (server /api/access GET·POST)
    const asec = document.createElement('div'); asec.className = 'ws-set-section';
    const ahd = document.createElement('div'); ahd.className = 'ws-acc-hd';
    const ah = document.createElement('h4'); ah.textContent = '🔒 접속 제어'; ah.style.margin = '0';
    const astat = document.createElement('span'); astat.className = 'ws-acc-stat'; astat.textContent = '확인 중…';
    ahd.append(ah, astat); asec.appendChild(ahd);
    const aintro = document.createElement('div'); aintro.className = 'ws-set-hint'; aintro.textContent = '다른 기기(네트워크 IP)에서 각 표면에 접근하는 기본 정책 — 비-노출(loopback) 바인드면 무동작, 로컬은 항상 통과.';
    asec.appendChild(aintro);
    let _exposed = false;
    function updateWarn() {
      const danger = _exposed && sAgent.state.mode === 'allow' && !reqCb.checked;
      awarn.hidden = !danger;
      if (danger) awarn.textContent = '⚠ 네트워크에 열린 상태에서 에이전트가 키 없이 누구나 합류·보드 조작할 수 있어요. ‘에이전트 기본 차단’ 또는 ‘키 요구’를 권장.';
    }
    function mkSurface(key, label) {   // 라벨 + 차단/허용 세그먼트 + (차단 시) 허용 IP textarea
      const row = document.createElement('div'); row.className = 'ws-acc-surf';
      const top = document.createElement('div'); top.className = 'ws-acc-surf-top';
      const lab = document.createElement('span'); lab.className = 'ws-acc-surf-lab'; lab.textContent = label;
      const seg = document.createElement('div'); seg.className = 'ws-acc-seg';
      const bBlock = document.createElement('button'); bBlock.type = 'button'; bBlock.className = 'ws-acc-seg-b'; bBlock.textContent = '기본 차단';
      const bAllow = document.createElement('button'); bAllow.type = 'button'; bAllow.className = 'ws-acc-seg-b'; bAllow.textContent = '기본 허용';
      seg.append(bBlock, bAllow); top.append(lab, seg); row.appendChild(top);
      const ta = document.createElement('textarea'); ta.className = 'ws-acc-ta'; ta.rows = 2; ta.spellcheck = false; ta.placeholder = '허용할 IP/대역 — 한 줄에 하나 (예: 192.168.0.5 또는 192.168.0.0/24). 비우면 로컬만'; row.appendChild(ta);
      const state = { mode: 'allow' };
      function render() { bBlock.classList.toggle('active', state.mode === 'block'); bAllow.classList.toggle('active', state.mode === 'allow'); ta.style.display = state.mode === 'block' ? '' : 'none'; updateWarn(); }
      bBlock.onclick = () => { state.mode = 'block'; render(); };
      bAllow.onclick = () => { state.mode = 'allow'; render(); };
      asec.appendChild(row);
      return { key, state, set(al) { state.mode = Array.isArray(al) ? 'block' : 'allow'; ta.value = Array.isArray(al) ? al.join('\n') : ''; render(); }, get() { return state.mode === 'allow' ? null : ta.value.split('\n').map((s) => s.trim()).filter(Boolean); } };
    }
    const sUi = mkSurface('ui', '이 화면 (UI)');
    const sAgent = mkSurface('agent', '에이전트 (A2A)');
    const sMcp = mkSurface('mcp', '도구 연결 (MCP)');
    const reqWrap = document.createElement('label'); reqWrap.className = 'ws-acc-check';
    const reqCb = document.createElement('input'); reqCb.type = 'checkbox'; reqCb.onchange = () => updateWarn();
    reqWrap.append(reqCb, document.createTextNode(' 모르는 에이전트 막기 — /ws 합류에 키 요구'));
    asec.appendChild(reqWrap);
    const awarn = document.createElement('div'); awarn.className = 'ws-acc-warn'; awarn.hidden = true; asec.appendChild(awarn);
    const arow = document.createElement('div'); arow.className = 'ws-acc-row';
    const asave = document.createElement('button'); asave.type = 'button'; asave.className = 'ws-acc-save'; asave.textContent = '저장';
    const amsg = document.createElement('span'); amsg.className = 'ws-acc-msg'; arow.append(asave, amsg);
    asec.appendChild(arow);
    const adesc = document.createElement('div'); adesc.className = 'ws-set-desc'; adesc.textContent = '기본 허용 = 누구나 · 기본 차단 = 허용 IP/대역(CIDR) 목록만(비우면 로컬만). 저장(access.json)은 이 컴퓨터(로컬)에서만 — 즉시 반영. 실제 LAN 노출은 서버 기동 시 WS_BIND 로 따로 켜요.';
    asec.appendChild(adesc);
    wsAccessRefresh = () => {
      astat.textContent = '확인 중…'; astat.className = 'ws-acc-stat';
      fetch('/api/access').then((r) => r.json()).then((d) => {
        if (!d || !d.ok) { astat.textContent = '(서버 #5a 미지원)'; return; }
        _exposed = !!d.exposed;
        astat.textContent = d.exposed ? `🌐 네트워크 열림 (bind=${d.bind})` : '🔒 이 컴퓨터에서만';
        astat.className = 'ws-acc-stat' + (d.exposed ? ' exposed' : '');
        sUi.set(d.access.ui && d.access.ui.allowlist);
        sAgent.set(d.access.agent && d.access.agent.allowlist);
        sMcp.set(d.access.mcp && d.access.mcp.allowlist);
        reqCb.checked = !!(d.access.agent && d.access.agent.requireKey);
        updateWarn();
      }).catch(() => { astat.textContent = '(조회 실패)'; });
    };
    asave.onclick = () => {
      amsg.textContent = '저장 중…'; amsg.className = 'ws-acc-msg';
      const payload = { ui: { allowlist: sUi.get() }, agent: { allowlist: sAgent.get(), requireKey: reqCb.checked }, mcp: { allowlist: sMcp.get() } };
      fetch('/api/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then((r) => r.json().then((d) => ({ status: r.status, d })))
        .then(({ status, d }) => {
          if (status === 200 && d.ok) { amsg.textContent = '✓ 저장됨'; amsg.className = 'ws-acc-msg ok'; if (wsAccessRefresh) wsAccessRefresh(); }
          else if (status === 403) { amsg.textContent = '✗ 로컬에서만 저장 가능 (이 화면은 원격 접속)'; amsg.className = 'ws-acc-msg err'; }
          else { amsg.textContent = '✗ 저장 실패: ' + ((d && d.error) || status); amsg.className = 'ws-acc-msg err'; }
        }).catch(() => { amsg.textContent = '✗ 저장 실패 (네트워크)'; amsg.className = 'ws-acc-msg err'; });
    };
    body.appendChild(asec);

    box.append(head, body); modal.appendChild(box);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.body.appendChild(modal);
    return modal;
  }
  function open() {
    build(); modal.hidden = false;
    // re-sync active 상태 (외부에서 변경됐을 수도)
    const cur = wsLoadPositionPref();
    modal.querySelectorAll('.ws-pos-card').forEach((el) => el.classList.toggle('active', el.dataset.pos === cur));
    if (wsAccessRefresh) wsAccessRefresh();   // #5a-2 접근 제어 현재값 로드
  }
  function close() { if (modal) modal.hidden = true; }
  btn.onclick = (e) => { e.stopPropagation(); open(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && !modal.hidden) close(); });
  wsSettings = { open, close };
}

// ---- 토글 버튼 우클릭 컨텍스트 메뉴 (화면 가운데로 / 키 관리 / 설정) ----
function setupWsContextMenu() {
  const fab = $('#ws-fab'); if (!fab) return;
  let menu = null;
  function close() { if (menu) { menu.remove(); menu = null; } }
  fab.addEventListener('contextmenu', (e) => {
    e.preventDefault(); close();
    menu = document.createElement('div'); menu.className = 'ws-fab-ctx';
    const items = [
      { icon: '⊕', label: '화면 가운데로', act: () => { if (!wsState.popOpen) toggleWsPop(true); wsApplyPosition('center'); } },
      { icon: '🔑', label: '키 발행',      act: () => { if (!wsState.popOpen) toggleWsPop(true); if (wsKeyMgmt && wsKeyMgmt.openIssuePanel) wsKeyMgmt.openIssuePanel(); } },
      { icon: '🔐', label: '키 관리',      act: () => { if (!wsState.popOpen) toggleWsPop(true); if (wsKeyMgmt && wsKeyMgmt.openManager) wsKeyMgmt.openManager(); } },
      { icon: '⚙',  label: '설정',         act: () => { if (!wsState.popOpen) toggleWsPop(true); if (wsSettings) wsSettings.open(); } },
    ];
    items.forEach((it) => {
      const b = document.createElement('button'); b.className = 'ws-fab-ctx-item'; b.type = 'button';
      b.textContent = it.icon + '  ' + it.label;
      b.onclick = (ev) => { ev.stopPropagation(); close(); it.act(); };
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    const r = fab.getBoundingClientRect(), mr = menu.getBoundingClientRect();
    // fab 좌상단 기준으로 메뉴를 띄움 — 화면 안 들어가도록 clamp
    let left = r.left, top = r.top - mr.height - 6;
    if (top < 8) top = r.bottom + 6;
    if (left + mr.width > innerWidth - 8) left = innerWidth - mr.width - 8;
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = Math.max(8, top) + 'px';
  });
  document.addEventListener('click', (e) => { if (menu && !e.target.closest('.ws-fab-ctx')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('blur', close);
}

function setupWS() {
  const fab = $('#ws-fab'), pop = $('#ws-pop'), close = $('#ws-pop-close'), head = $('#ws-pop-head');
  if (!fab || !pop) return;
  fab.onclick = () => toggleWsPop();
  if (close) close.onclick = (e) => { e.stopPropagation(); toggleWsPop(false); };
  // 헤더 드래그 — 진행 중에는 left/top, 종료 시 active anchor 기준 모서리 거리로 정규화 (화면 resize 시 거리 유지)
  let drag = null;
  if (head) {
    head.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, select, textarea, a, .ws-collab-panel')) return;   // 인터랙티브 요소(close·collab 라벨 input·패널 등)는 드래그 제외 — 클릭/포커스 보존
      const r = pop.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, anchor: wsCurrentAnchor() };
      pop.style.left = r.left + 'px'; pop.style.top = r.top + 'px'; pop.style.right = 'auto'; pop.style.bottom = 'auto';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      pop.style.left = Math.max(0, Math.min(innerWidth - 80, drag.left + (e.clientX - drag.x))) + 'px';
      pop.style.top = Math.max(0, Math.min(innerHeight - 40, drag.top + (e.clientY - drag.y))) + 'px';
    });
    window.addEventListener('mouseup', () => {
      if (!drag) return;
      // 드래그 종료 — anchor 기준 정규화
      const r = pop.getBoundingClientRect();
      wsApplyAnchorPos(pop, wsRectToAnchorPos(r, drag.anchor));
      drag = null; wsSaveUI();
    });
  }
  setupWsResize(pop);
  wsLoadDrafts();   // 채널별 입력 draft·통일 높이 복원(새로고침 영속)
  // 첨부: 드롭·버튼은 공통(채널별 textarea 의 paste 첨부는 wsTextareaFor 가 연결)
  attachable({ dropEl: pop, textarea: null, fileBtn: $('#ws-attach'), fileInput: $('#ws-file'), listEl: $('#ws-atts'), atts: wsAtts, persist: () => {} });
  const send = $('#ws-send'); if (send) send.onclick = wsSendPrompt;
  const pause = $('#ws-pause'); if (pause) pause.onclick = () => wsSendCommand('pause');
  const resume = $('#ws-resume'); if (resume) resume.onclick = () => wsSendCommand('resume');
  const cancel = $('#ws-cancel'); if (cancel) cancel.onclick = wsSendCancel;
  const dbg = $('#ws-dbg-btn'); if (dbg) dbg.onclick = wsToggleDebug;
  const tedit = $('#ws-tabedit-btn'); if (tedit) tedit.onclick = wsToggleTabEdit;   // 탭 편집 토글
  const treset = $('#ws-tabreset-btn'); if (treset) treset.onclick = wsResetTabOrder;   // 탭 순서 초기화
  const arch = $('#ws-arch-btn'), archMenu = $('#ws-arch-menu');
  if (arch) arch.onclick = (e) => { e.stopPropagation(); if (archMenu) { wsRenderArchived(); archMenu.hidden = !archMenu.hidden; } };
  document.addEventListener('click', (e) => { if (archMenu && !archMenu.hidden && !e.target.closest('.ws-arch-wrap')) archMenu.hidden = true; });
  // v2.4.2 UI 통합: setupWsCollab (🔗 별도 버튼) 제거 — setupWsKeyMgmt 가 kind dropdown 으로 모든 종류 발행 통합
  setupWsKeyMgmt();                                   // v2.4.0 #406 UI4/UI5 업스트림 키 발행 🔑 + 키 관리 모달 🗂
  setupWsSettings();                                  // 실시간 창 설정 모달 (창 배치 preset 등) — 헤드 ⚙ 버튼
  setupWsNotif();                                     // tier-1 알림 설정 (🔔 — 항목별 토글 + 권한)
  setupMobileTabbar();                                // 모바일 하단 탭바 (≤560px — 최상위 탭전환 + 실시간 pane)
  setupWsContextMenu();                               // 🌐 fab 우클릭 → 화면 가운데로 / 키 관리 / 설정
  updateWsConn(); updateWsBadge(); wsRenderTabs();
  wsLoadBackends();                                   // C1 backend registry overlay (board-worker 분리 + model badge); 부재 시 graceful
  wsLoadUI();                                         // 팝업 위치·크기·열림 상태 복원
  connectWS();
}
setupWS();
