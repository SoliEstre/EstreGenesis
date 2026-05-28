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
  $('#decisions-badge').textContent = list.filter(d => d.status !== 'resolved').length + ui.adhoc.length;

  const buildCard = (d) => {
    const draft = clearedIfReviewed(d, decisionDraft(d), focusedDid === d.id);
    if (focusedDid === d.id) focusedRemoved = draft._removed || 0;
    const card = el('div', 'dcard' + dimClass(d.project));
    card.dataset.did = d.id;
    const reviewed = d.reviewedAt ? `<span class="dreviewed-at" data-at="${esc(d.reviewedAt)}">${esc(fmtDateTime(d.reviewedAt))} <span class="rel">(${esc(relTime(d.reviewedAt))})</span></span><span class="dreviewed" title="검토 시점 ${esc(new Date(d.reviewedAt).toLocaleString('ko-KR'))}">✓ 최근 피드백 반영됨</span>` : '';
    // detail/previewHtml 은 에이전트 작성(신뢰) → HTML 그대로 렌더 (시각화 적극 사용)
    card.innerHTML = `<div class="row"><span class="q">${esc(d.question)}</span> ${projChip(d.project)}${reviewed}</div>
      <div class="ddetail">${d.detail || ''}</div>
      ${d.previewUrl ? `<iframe src="${esc(d.previewUrl)}" loading="lazy"></iframe>` : ''}
      ${d.previewHtml ? `<div class="dviz">${d.previewHtml}</div>` : ''}${attChips('decision-' + d.id, d.att)}`;
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
    body.innerHTML = `<div class="mermaid">${a.body}</div>`;   // mermaid 문법은 esc 금지
    try { const m = await ensureMermaid(); await m.run({ nodes: body.querySelectorAll('.mermaid') }); }
    catch (e) { body.innerHTML = `<pre class="att-code">${esc(a.body)}</pre><div class="empty">mermaid 렌더 실패: ${esc(String(e && e.message || e))}</div>`; }
  }
  else if (a.t === 'html') body.innerHTML = `<iframe class="att-frame" srcdoc="${esc(a.body)}"></iframe>`;
  else if (a.t === 'img') body.innerHTML = `<img class="att-img" src="${esc(a.src)}" alt="${esc(a.title || a.name || '')}">`;
  else if (a.t === 'link') body.innerHTML = `<iframe class="att-frame" src="${esc(a.src)}"></iframe>`;
  else if (a.t === 'file') body.innerHTML = `<div class="att-fileinfo">📄 ${esc(a.name || a.title || '파일')}<div class="empty">미리보기 미지원 형식 — '새 탭'으로 열어 확인하세요${a.mime ? ` (${esc(a.mime)})` : ''}.</div></div>`;
}
function attNewTab(a) {
  let url;
  if (a.t === 'img' || a.t === 'link' || a.t === 'file') url = a.src;
  else {
    let doc;
    if (a.t === 'code') doc = `<!doctype html><meta charset="utf-8"><title>${esc(a.title || 'code')}</title><style>body{margin:0;background:#0f1115;color:#e7e9ea;font:13px/1.5 ui-monospace,monospace}pre{padding:18px;white-space:pre-wrap;word-break:break-word}</style><pre>${esc(a.body)}</pre>`;
    else if (a.t === 'mermaid') doc = `<!doctype html><meta charset="utf-8"><title>${esc(a.title || 'diagram')}</title><body style="margin:0;background:#0f1115;display:flex;justify-content:center;padding:24px"><pre class="mermaid">${a.body}</pre><script type="module">import m from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';m.initialize({startOnLoad:true,theme:'dark'});<\/script>`;
    else doc = a.body || '';
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
function wsActiveTextarea() { const a = wsState.active; return (a && !wsIsGroup(a) && !wsIsMon(a)) ? wsTextareaFor(a) : null; }
function wsShowTextarea(key) {
  const stack = $('#ws-text-stack'); if (!stack) return;
  for (const t of wsState.textareas.values()) t.classList.remove('active');
  if (wsRoTa) wsRoTa.classList.remove('active');
  if (key && (wsIsGroup(key) || wsIsMon(key))) { wsRoTextarea().classList.add('active'); }
  else if (key) { const ta = wsTextareaFor(key); ta.classList.add('active'); wsRecalcTaH(); if (wsState.popOpen) ta.focus({ preventScroll: true }); }
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
function wsFmtVal(v) { if (v == null) return ''; if (typeof v === 'string') return v; try { return JSON.stringify(v); } catch { return String(v); } }
function wsTrunc(s, n = 220) { s = wsFmtVal(s); return s.length > n ? s.slice(0, n) + '…' : s; }
function wsOutcome(o) { return !o ? '' : (o.type === 'cancelled' ? `취소됨${o.reason ? ' · ' + o.reason : ''}` : (o.type || 'success')); }

// ---- 채널 ----
// 채널 scoping(§4): 키 = channelId(있으면, threadId 다르면 :threadId) 우선, 없으면 agentId.
// routeId = 사용자 입력 라우팅용 agentId(server 는 agentId 로 등록 → channelId 키여도 routeId 로 송신).
function wsChanKey(m) {
  // 채널 = 에이전트 단위(agentId). channelId/threadId 는 채널을 쪼개지 않고 row 출처 뱃지로 표시(사용자 결정 2026-05-26)
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
  for (const a of agents) { const c = wsChannel(a.agentId, a.agentName); c.role = a.role || 'local'; }   // §13.1 role 보관(탭 그룹·모니터 분류)
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
  if (!wsState.active && wsState.channels.size) {
    if (wsState.channels.has(WS_LOCAL) && !wsState.channels.get(WS_LOCAL).hidden) wsState.active = WS_LOCAL;   // 기본 활성 = 메인(로컬 IDE) 우선
    else { for (const [id, c] of wsState.channels) { if (!c.hidden && !wsIsMon(id)) { wsState.active = id; break; } } if (!wsState.active) wsState.active = wsState.channels.keys().next().value; }
  }
  wsRenderTabs(); wsRenderActiveStream(); updateWsConn(); updateWsBadge();
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
  btn.hidden = hidden.length === 0;
  btn.textContent = '🗂 ' + hidden.length;
  menu.innerHTML = '';
  if (!hidden.length) { menu.hidden = true; return; }
  for (const [id, c] of hidden) {
    const item = el('div', 'ws-arch-item');
    item.textContent = (c.name || id) + (c.role && c.role !== 'local' ? ' · ' + c.role : '');
    item.title = '복원: ' + id;
    item.onclick = () => wsRestoreChannel(id);
    menu.appendChild(item);
  }
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
  const e = el('div', 'ws-ev' + (row.kind === 'user' ? ' ws-userline' : '') + (row.kind === 'status' ? ' ws-statusline' : ''));
  const t = el('span', 'ws-t'); t.textContent = row.t;
  const k = el('span', 'ws-k ' + row.kind); k.textContent = row.label;
  const md = row.kind === 'text' || row.kind === 'user';   // 대화 내용만 마크다운 렌더
  const b = el('span', 'ws-body' + (row.dim ? ' dim' : '') + (md ? ' ws-md' : ''));
  if (md) b.innerHTML = wsMd(row.body || ''); else b.textContent = row.body || '';
  e.append(t); if (row.src) e.append(wsSrcEl(row)); if (row.chan && showChan) e.append(wsChanEl(row)); e.append(k, b); row._b = b; row._md = md;
  if (row.full) wsRowHover(e, row);   // 요약 가능한 A2A 메시지(WorkerReport·Delegate 등): hover 시 커서 4분면 팝업에 전체 렌더
  return e;
}
function wsRenderRow(row) {
  const s = $('#ws-stream'); if (!s) return;
  const empty = s.querySelector('.ws-empty'); if (empty) empty.remove();
  s.appendChild(wsRowEl(row));
  while (s.children.length > 300) s.removeChild(s.firstChild);
  s.scrollTop = s.scrollHeight;
}
function wsRenderActiveStream() {
  const s = $('#ws-stream'); if (!s) return;
  s.innerHTML = '';
  wsRenderChanFilter();   // 대화 위 출처(채널) 필터 탭 동기
  if (wsIsGroup(wsState.active)) {   // §13.6 그룹 병합: 멤버 채널 rows 를 ts 정렬, 출처 라벨
    const merged = [];
    for (const cid of wsGroupMembers(wsState.active)) { const c = wsState.channels.get(cid); if (c) for (const row of c.rows) merged.push({ row, src: c.name || cid }); }
    merged.sort((a, b) => (a.row.ts || 0) - (b.row.ts || 0));
    if (!merged.length) { s.innerHTML = '<div class="ws-empty">이 그룹에 아직 수신한 이벤트가 없어요.</div>'; return; }
    for (const { row, src } of merged) { const e = wsRowEl(row); const sp = el('span', 'ws-src'); sp.textContent = src; e.insertBefore(sp, e.firstChild ? e.firstChild.nextSibling : null); s.appendChild(e); }
    s.scrollTop = s.scrollHeight;
    return;
  }
  const ch = wsState.active && wsState.channels.get(wsState.active);
  if (!ch || !ch.rows.length) { s.innerHTML = '<div class="ws-empty">아직 수신한 이벤트가 없어요. 에이전트가 연결되면 여기에 표시됩니다.</div>'; return; }
  const f = ch._chanFilter || '*';            // 출처 필터 (* = 전체)
  const showChan = (f === '*');               // 전체 보기일 때만 출처 뱃지(개별 채널은 이미 필터됨)
  let n = 0;
  for (const row of ch.rows) { if (f !== '*' && (row.chan || '') !== f) continue; s.appendChild(wsRowEl(row, showChan)); n++; }
  if (!n) { s.innerHTML = '<div class="ws-empty">이 출처에 표시할 이벤트가 없어요.</div>'; return; }
  s.scrollTop = s.scrollHeight;
}
// ---- 대화 위 출처(채널) 필터 탭 — 에이전트 통합 탭 안에서 channelId/threadId 출처별 필터. [전체]=모두+뱃지 ----
function wsRenderChanFilter() {
  const bar = $('#ws-chan-filter'); if (!bar) return;
  const a = wsState.active;
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
  const s = $('#ws-stream'), d = $('#ws-debug'), btn = $('#ws-dbg-btn');
  if (s) s.hidden = wsState.debugOpen;
  if (d) { d.hidden = !wsState.debugOpen; if (wsState.debugOpen) wsRenderDebug(); }
  if (btn) btn.classList.toggle('on', wsState.debugOpen);
}
function wsPushRow(agentId, row) {
  const ch = wsChannel(agentId);
  if (!row.ts) row.ts = Date.now();   // 그룹 병합 뷰 시간순 정렬용
  ch.rows.push(row);
  while (ch.rows.length > 300) ch.rows.shift();
  if (wsState.replaying) return;   // 재생 중엔 데이터만 적재, 렌더·뱃지는 재생 끝나고 일괄
  const active = wsState.active;
  const inView = agentId === active || (wsIsGroup(active) && wsGroupMembers(active).indexOf(agentId) >= 0);
  if (inView && wsState.popOpen) { if (wsIsGroup(active)) wsRenderActiveStream(); else wsRenderRow(row); }   // 그룹 뷰면 병합 재렌더
  else ch.unseen++;
  wsRenderTabs(); updateWsBadge();
}

function wsName(id) { const c = wsState.channels.get(id); return (c && c.name) || id; }
// v0.3 오케스트레이션 — 모니터 2채널 + 탭 그룹
const WS_MON_UP = '__mon_up__';        // 🔀 업스트림 ↔ 메인
const WS_MON_LOCAL = '__mon_local__';  // 🔀 메인 ↔ 로컬
let WS_LOCAL = 'main-agent';           // placeholder; updated dynamically from AgentList (the agentId whose role==='main') — §2 role model
function wsRoleOf(id) { const c = wsState.channels.get(id); return (c && c.role) || (id === WS_LOCAL ? 'main' : 'local'); }
function wsMonChannel(src, dst) { return (wsRoleOf(src) === 'upstream' || wsRoleOf(dst) === 'upstream') ? WS_MON_UP : WS_MON_LOCAL; }
function wsMonName(id) { return id === WS_MON_UP ? '🔀 Up↔Main' : '🔀 Main↔Local'; }
function wsIsMon(id) { return id === WS_MON_UP || id === WS_MON_LOCAL; }
function wsIsGroup(id) { return typeof id === 'string' && id.indexOf('group:') === 0; }
function wsGroupMembers(gkey) {
  const r = gkey === 'group:up' ? 'upstream' : gkey === 'group:main' ? 'main' : gkey === 'group:collab' ? 'collab' : 'local';
  const mem = [...wsState.channels.entries()].filter(([id, c]) => c.role === r && !wsIsMon(id)).map(([id]) => id);
  if (gkey === 'group:up' && wsState.channels.has(WS_MON_UP)) mem.push(WS_MON_UP);
  if (gkey === 'group:main' && wsState.channels.has(WS_MON_LOCAL)) mem.push(WS_MON_LOCAL);
  return mem;
}
function onWsEvent(m) {
  const t = m.type;
  if (t === 'SERVER_HELLO') { wsState.open = true; updateWsConn(); return; }
  if (t === 'CUSTOM' && m.name === 'AgentList') { const agents = (m.value && m.value.agents) || []; for (const a of agents) { if (a.role === 'main' && a.agentId) { WS_LOCAL = a.agentId; break; } } wsSyncAgents(agents); return; }
  if (t === 'CUSTOM' && m.name === 'History') { const v = m.value || {}; wsReplayHistory(v.events, v.cold, v.archived); return; }   // 서버 기록 재생 복원(active full + cold/archived stub)
  if (t === 'CUSTOM' && m.name === 'ChannelHistory') { const v = m.value || {}; wsReplayChannelHistory(v.channelKey, v.events); return; }   // C: on-demand 채널 내용
  if (t === 'CUSTOM' && m.name === 'ServerNotice') {   // 브릿지/서버 재시작 등 시스템 공지 → 활성 채널 status 카드
    const v = m.value || {}; const icon = ({ restarting: '🔄', offline: '🔌', online: '🟢' })[v.kind] || 'ℹ️';
    const a = wsState.active;
    if (a && !wsIsGroup(a)) wsPushRow(a, { kind: 'status', label: icon + ' 서버 공지', body: v.text || ((v.target || 'server') + ' ' + (v.kind || '')), dim: false, t: nowHM() });
    return;
  }
  if (t === 'CUSTOM' && m.name === 'CloseChannel') {   // 다른 클라/✕ 로 채널 닫힘 → 동기
    const id = m.value && m.value.agentId;
    if (id && wsState.channels.has(id)) { wsState.channels.delete(id); if (wsState.active === id) wsState.active = wsState.channels.keys().next().value || null; if (!wsState.replaying) { wsRenderTabs(); wsRenderActiveStream(); updateWsConn(); updateWsBadge(); } }
    return;
  }
  if (t === 'CUSTOM' && m.name === 'CollabKeyIssued') {   // #168 서버 협업 키 발급 응답(라우팅 무관 직접 reply) → 초대 패널 issued
    if (wsInvite) wsInvite.setIssued(m.value || {});
    return;
  }
  // board/사용자 입력(에코 또는 History 재생) → 해당 채널에 user row (대화기록 복원)
  if ((m.source === 'user' || m.source === 'board') && t === 'CUSTOM' && m.targetAgentId) {
    const ukey = wsChanKey(m);   // §4: 사용자 입력도 channelId 우선 scoped 키
    wsChannel(ukey, undefined, { routeId: m.targetAgentId, channelId: m.channelId, threadId: m.threadId });   // routeId(라우팅 agentId) 보장
    wsPushDebug(ukey, m);
    const nm = m.name, v = m.value || {};
    const label = nm === 'UserPrompt' ? '🙋 UserPrompt' : nm === 'Command' ? '⌘ Command' : nm === 'Cancel' ? '⏹ Stop' : '✦ ' + (nm || 'CUSTOM');
    // raw JSON 은 timeline 에 노출하지 않음(§1) — 의미 필드만, 전체 원본은 debug drawer 에서
    const body = nm === 'UserPrompt' ? (v.text || '') : nm === 'Command' ? (v.name || '') : nm === 'Cancel' ? '작업 중단 요청' : (typeof v === 'string' ? v : (v.text || v.message || v.summary || v.label || ''));
    wsPushRow(ukey, { kind: 'user', label, body, dim: false, t: nowHM(), chan: wsChanLabel(m), chanFull: wsChanFull(m) });
    return;
  }
  const agentId = m.agentId; if (!agentId) return;       // agent outbound 는 agentId 필수
  // A2A: 에이전트가 다른 에이전트에게 보낸 메시지(source agent + targetAgentId=타 agent) → 모니터 채널로 분리
  const a2a = (m.source === 'agent' && m.targetAgentId && m.targetAgentId !== agentId);
  const chId = a2a ? wsMonChannel(agentId, m.targetAgentId) : wsChanKey(m);   // §13.5 모니터 2채널(role 기반) / §4 channelId scoped 키
  const _src = a2a ? { from: agentId, to: m.targetAgentId } : null;   // A2A 방향(src→dst, 각 이름 role 색) — 본문이 아닌 별도 뱃지
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
  const push = (kind, label, body, dim, full) => wsPushRow(chId, { kind, label, body: body || '', dim, t: nowHM(), chan: _chan, chanFull: _chanFull, src: _src, full: (full && typeof full === 'object') ? full : null });
  switch (t) {
    case 'RUN_STARTED': push('run', '▶ RUN_STARTED', m.runId || '', true); break;
    case 'RUN_FINISHED': push('ok', '✓ RUN_FINISHED', wsOutcome(m.outcome), true); break;
    case 'RUN_ERROR': push('err', '⚠ RUN_ERROR', (m.code ? `[${m.code}] ` : '') + (m.message || ''), false); break;
    case 'STEP_STARTED': push('step', '◆ STEP', m.stepName || '', true); break;
    case 'STEP_FINISHED': push('step', '◇ STEP done', m.stepName || '', true); break;
    case 'TEXT_MESSAGE_START': { const row = { kind: 'text', label: '💬 TEXT', body: '', dim: false, t: nowHM(), chan: _chan, chanFull: _chanFull, src: _src }; ch.msgBuf[m.messageId || '_'] = row; wsPushRow(chId, row); break; }
    case 'TEXT_MESSAGE_CONTENT': {
      const row = ch.msgBuf[m.messageId || '_'];
      if (row) { row.body = (row.body || '') + (m.delta || ''); if (row._b) { if (row._md) row._b.innerHTML = wsMd(row.body); else row._b.textContent = row.body; const s = $('#ws-stream'); if (s) s.scrollTop = s.scrollHeight; } }
      else push('text', '💬 TEXT', m.delta || '', false);
      break;
    }
    case 'TEXT_MESSAGE_END': delete ch.msgBuf[m.messageId || '_']; break;
    case 'TEXT_MESSAGE': push('text', '💬 TEXT', m.text || '', false); break;   // History 재생: 압축 완성형 메시지 1건
    case 'TOOL_CALL_START': {
      const id = m.toolCallId || ('_t' + (ch.seq || 0));
      const row = { kind: 'toolcard', toolCallId: id, src: _src, chan: _chan, chanFull: _chanFull, t: nowHM(), _expanded: false,
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
      const row = { kind: 'toolcard', toolCallId: id, src: _src, chan: _chan, chanFull: _chanFull, t: nowHM(), _expanded: false,
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
      else if (m.name === 'AgentHello') { const v = m.value || {}; push('user', '👋 합류', (v.agentName || v.agentId || '') + (v.env ? ' · ' + v.env : '') + (v.idle ? ' · 대기' : ''), false, v); }   // 신규 워커 self-intro(§13.9)
      else if (m.name === 'OnboardAck') { const v = m.value || {}; push('ok', '🤝 온보딩', [v.welcome, v.guide, v.policy].filter(Boolean).join(' · '), false, v); }   // 메인 온보딩 응답
      else if (m.name === 'Delegate') { const v = m.value || {}; push('user', '📋 위임', (v.task ? '[' + v.task + '] ' : '') + (v.summary || v.reason || ''), false, v); }   // 메인 → 워커 작업 위임
      else if (m.name === 'WorkerReport') { const v = m.value || {}; push('text', '📤 보고', (v.from ? v.from + ' · ' : '') + (v.re || v.done || v.summary || v.note || ''), false, v); }   // 워커 → 메인 진행 보고
      else if (m.name === 'WorkerAck') { const v = m.value || {}; push('ok', '📥 ack', (v.re || v.ack || v.summary || v.note || ''), false, v); }   // 워커/메인 수용 응답
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
      else if (m.name === 'Attachment') { wsPushRow(chId, { kind: 'attach', src: _src, att: m.value || {}, t: nowHM(), chan: _chan, chanFull: _chanFull }); }   // §6 첨부 카드(image/audio/video/file)
      else { const v = m.value; const disp = (v == null) ? '' : (typeof v === 'string' ? v : (v.text || v.message || v.summary || v.label || '')); push('text', `✦ ${m.name || 'CUSTOM'}`, disp, true, v); }   // raw JSON 미노출(§1) — 원본은 hover 팝업 + debug drawer
      break;
    case 'STATE_SNAPSHOT': case 'STATE_DELTA': push('step', `≡ ${t}`, m.scope || '', true); break;
    default: push('text', t || '?', '', true);
  }
  updateWsConn();
}

// ---- 채널 탭 ----
// §13.6 계층 탭 3그룹 (G1 업스트림+Up↔Main · G2 메인+Main↔Local · G3 로컬). 그룹 헤더=병합 토글, 탭=단독.
function wsRenderTabs() {
  const bar = $('#ws-tabs'); if (!bar) return;
  bar.innerHTML = '';
  const byRole = (r) => [...wsState.channels.entries()].filter(([id, c]) => c.role === r && !wsIsMon(id) && !c.hidden).map(([id]) => id);
  const has = (id) => wsState.channels.has(id);
  const groups = [
    { key: 'group:up', cls: 'up', label: '업스트림', tabs: byRole('upstream').concat(has(WS_MON_UP) ? [WS_MON_UP] : []) },
    { key: 'group:main', cls: 'main', label: '메인', tabs: byRole('main').concat(has(WS_MON_LOCAL) ? [WS_MON_LOCAL] : []) },
    { key: 'group:local', cls: 'local', label: '로컬', tabs: byRole('local') },
    { key: 'group:collab', cls: 'collab', label: '협업', tabs: byRole('collab') },
  ];
  for (const g of groups) {
    if (!g.tabs.length) continue;   // 빈 그룹 숨김
    const grp = el('div', 'grp ' + g.cls + (wsState.active === g.key ? ' sel' : ''));
    const gh = el('div', 'ghead' + (wsState.active === g.key ? ' sel' : ''));
    gh.innerHTML = `<span class="gmerge">▦</span>${esc(g.label)}<span class="gcnt">${g.tabs.length}</span>`;
    gh.title = g.label + ' 그룹 — 클릭 시 그룹 전체 시간순 병합 보기';
    gh.onclick = () => wsSetActive(g.key);
    grp.append(gh);
    const tabs = el('div', 'tabs');
    for (const id of g.tabs) {
      const ch = wsState.channels.get(id);
      const mon = wsIsMon(id);
      const present = mon ? true : wsState.present.has(ch.routeId || id);
      const tab = el('div', 'ws-tab ' + g.cls + (id === wsState.active ? ' active' : '') + (present ? ' on' : ''));
      tab.title = (ch.routeId || id) + (present ? '' : ' · 연결 끊김');
      const dot = el('span', 'tdot' + (present ? '' : ' off'));
      const nm = el('span', 'nm'); nm.textContent = ch.name || id;
      const bg = el('span', 'ubadge'); bg.textContent = ch.unseen > 99 ? '99+' : String(ch.unseen); bg.hidden = !ch.unseen || id === wsState.active;
      tab.append(dot, nm, bg);
      if (!mon) { const x = el('span', 'ws-tab-x', '✕'); x.title = '탭 닫기'; x.onclick = (e) => { e.stopPropagation(); wsCloseChannel(id); }; tab.append(x); }
      tab.onclick = () => wsSetActive(id);
      tabs.append(tab);
    }
    grp.append(tabs);
    bar.appendChild(grp);
  }
  wsRenderArchived();   // 닫은 세션 버튼·드롭다운 동기
}
function wsSetActive(id) {
  wsState.active = id;
  if (wsIsGroup(id)) { for (const cid of wsGroupMembers(id)) { const c = wsState.channels.get(cid); if (c) c.unseen = 0; wsMaybeRequestHistory(cid); } }
  else { const ch = wsState.channels.get(id); if (ch) ch.unseen = 0; wsMaybeRequestHistory(id); }   // C: cold stub 이면 내용 on-demand 로드
  wsRenderTabs(); wsRenderActiveStream(); updateWsConn(); updateWsBadge();
  if (wsState.debugOpen) wsRenderDebug();
  wsShowTextarea(id);   // 채널별 입력란 스위칭(활성만 표시·포커스, 높이 통일)
}

// ---- 입력 송신 (활성 채널 targetAgentId) ----
function wsCommon() { return { id: 'b-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), source: 'board', timestamp: Date.now() }; }
function wsSend(obj) {
  const ws = wsState.ws; if (!ws || ws.readyState !== 1 || !wsState.active) return false;
  if (wsIsGroup(wsState.active) || wsIsMon(wsState.active)) return false;   // 그룹·모니터 = 읽기 전용
  const ch = wsState.channels.get(wsState.active);
  const route = (ch && ch.routeId) || wsState.active;   // §4: 채널 키가 channelId 여도 라우팅은 routeId(agentId)
  const extra = {};
  if (ch && ch.channelId) extra.channelId = ch.channelId;   // 에코·history 가 같은 채널키로 복원되도록
  if (ch && ch.threadId) extra.threadId = ch.threadId;
  try { ws.send(JSON.stringify({ ...wsCommon(), targetAgentId: route, ...extra, ...obj })); return true; } catch { return false; }
}
function wsLocalRow(kind, label, body) { const a = wsState.active; if (a && !wsIsGroup(a) && !wsIsMon(a)) wsPushRow(a, { kind, label, body, dim: false, t: nowHM() }); }
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
function setupWsCollab() {
  const head = $('#ws-pop-head'); if (!head || $('#ws-collab-wrap')) return;
  const wrap = document.createElement('span'); wrap.id = 'ws-collab-wrap'; wrap.className = 'ws-collab-wrap';
  const btn = document.createElement('button'); btn.id = 'ws-collab-btn'; btn.className = 'ws-arch-btn'; btn.type = 'button';
  btn.title = '외부 협업 초대 — 협업 키 발급·접속 URL (#168)'; btn.textContent = '🔗';
  const panel = document.createElement('div'); panel.id = 'ws-collab-panel'; panel.className = 'ws-collab-panel'; panel.hidden = true;
  wrap.appendChild(btn); wrap.appendChild(panel);
  const archWrap = head.querySelector('.ws-arch-wrap');
  if (archWrap) head.insertBefore(wrap, archWrap); else head.appendChild(wrap);

  let status = 'idle', key = '', joinUrl = '', label = '';
  function render() {
    panel.textContent = '';
    const h = document.createElement('div'); h.className = 'ws-invite-h'; h.textContent = '🔗 외부 협업 초대'; panel.appendChild(h);
    if (status === 'idle') {
      const inp = document.createElement('input'); inp.className = 'ws-invite-label'; inp.placeholder = '협업 대상 라벨'; inp.value = label;
      const b = document.createElement('button'); b.className = 'ws-invite-btn'; b.type = 'button'; b.textContent = '키 발급';
      b.onclick = () => { label = inp.value.trim(); register(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { label = inp.value.trim(); register(); } });
      panel.appendChild(inp); panel.appendChild(b);
    } else if (status === 'issuing') {
      const b = document.createElement('button'); b.className = 'ws-invite-btn'; b.type = 'button'; b.textContent = '발급 중…'; b.disabled = true;
      panel.appendChild(b);
    } else {   // issued
      const meta = document.createElement('div'); meta.className = 'ws-invite-meta'; meta.textContent = (label || 'collab') + ' · ' + key.slice(0, 12) + '…';
      const url = document.createElement('div'); url.className = 'ws-invite-url'; url.textContent = joinUrl;
      const row = document.createElement('div'); row.className = 'ws-invite-row';
      const cp = document.createElement('button'); cp.className = 'ws-invite-copy'; cp.type = 'button'; cp.textContent = '복사'; cp.onclick = () => copy(cp);
      const nw = document.createElement('button'); nw.className = 'ws-invite-new'; nw.type = 'button'; nw.textContent = '새 키'; nw.onclick = () => { status = 'idle'; key = ''; joinUrl = ''; render(); };
      row.appendChild(cp); row.appendChild(nw);
      panel.appendChild(meta); panel.appendChild(url); panel.appendChild(row);
    }
  }
  function register() {
    if (wsSendOrch({ type: 'CUSTOM', name: 'RegisterCollabKey', value: { label } })) { status = 'issuing'; render(); }
    else { const e = document.createElement('div'); e.className = 'ws-invite-url'; e.textContent = '⚠ WS 연결 안 됨 — 잠시 후 다시'; panel.appendChild(e); }
  }
  function copy(b) {
    const done = () => { const o = b.textContent; b.textContent = '복사됨 ✓'; setTimeout(() => { b.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(joinUrl).then(done).catch(() => { b.textContent = '복사 실패'; });
    else b.textContent = '복사 실패';
  }
  btn.onclick = (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; if (!panel.hidden) render(); };
  document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('#ws-collab-wrap')) panel.hidden = true; });
  wsInvite = {
    setIssued(p) { p = p || {}; key = p.key || ''; joinUrl = p.joinUrl || ''; if (p.label != null) label = p.label; status = 'issued'; panel.hidden = false; render(); },
    get status() { return status; }, get joinUrl() { return joinUrl; },
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
  const grpName = active === 'group:up' ? '업스트림 그룹' : active === 'group:main' ? '메인 그룹' : '로컬 그룹';
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
const WS_UI = 'constellation-ws-ui';
function wsSaveUI() {
  try {
    const pop = $('#ws-pop'); if (!pop) return;
    const o = { open: !!wsState.popOpen };
    if (pop.style.left && pop.style.left !== 'auto') o.pos = { left: pop.style.left, top: pop.style.top, width: pop.style.width, height: pop.style.height };
    localStorage.setItem(WS_UI, JSON.stringify(o));
  } catch {}
}
function wsLoadUI() {
  try {
    const o = JSON.parse(localStorage.getItem(WS_UI) || 'null'); if (!o) return;
    const pop = $('#ws-pop'); if (!pop) return;
    if (o.pos && o.pos.left) { pop.style.left = o.pos.left; pop.style.top = o.pos.top; pop.style.width = o.pos.width; pop.style.height = o.pos.height; pop.style.right = 'auto'; pop.style.bottom = 'auto'; }
    if (o.open) toggleWsPop(true);
  } catch {}
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
  }
  updateWsBadge();
  wsSaveUI();
}

// ---- 8방향 리사이즈 (모든 면·모서리) ----
function setupWsResize(pop) {
  let rz = null;
  pop.querySelectorAll('.ws-rsz').forEach(h => {
    h.addEventListener('mousedown', (e) => {
      const r = pop.getBoundingClientRect();
      rz = { dir: h.dataset.dir, x: e.clientX, y: e.clientY, left: r.left, top: r.top, w: r.width, h: r.height };
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
  window.addEventListener('mouseup', () => { if (rz) { rz = null; wsSaveUI(); } });
}

function setupWS() {
  const fab = $('#ws-fab'), pop = $('#ws-pop'), close = $('#ws-pop-close'), head = $('#ws-pop-head');
  if (!fab || !pop) return;
  fab.onclick = () => toggleWsPop();
  if (close) close.onclick = (e) => { e.stopPropagation(); toggleWsPop(false); };
  // 헤더 드래그 — left/top 기준 (리사이즈와 좌표계 통일)
  let drag = null;
  if (head) {
    head.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, select, textarea, a, .ws-collab-panel')) return;   // 인터랙티브 요소(close·collab 라벨 input·패널 등)는 드래그 제외 — 클릭/포커스 보존
      const r = pop.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, left: r.left, top: r.top };
      pop.style.left = r.left + 'px'; pop.style.top = r.top + 'px'; pop.style.right = 'auto'; pop.style.bottom = 'auto';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      pop.style.left = Math.max(0, Math.min(innerWidth - 80, drag.left + (e.clientX - drag.x))) + 'px';
      pop.style.top = Math.max(0, Math.min(innerHeight - 40, drag.top + (e.clientY - drag.y))) + 'px';
    });
    window.addEventListener('mouseup', () => { if (drag) { drag = null; wsSaveUI(); } });
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
  const arch = $('#ws-arch-btn'), archMenu = $('#ws-arch-menu');
  if (arch) arch.onclick = (e) => { e.stopPropagation(); if (archMenu) { wsRenderArchived(); archMenu.hidden = !archMenu.hidden; } };
  document.addEventListener('click', (e) => { if (archMenu && !archMenu.hidden && !e.target.closest('.ws-arch-wrap')) archMenu.hidden = true; });
  setupWsCollab();                                    // #168 외부 협업 초대(🔗) 토글·패널 마운트
  updateWsConn(); updateWsBadge(); wsRenderTabs();
  wsLoadUI();                                         // 팝업 위치·크기·열림 상태 복원
  connectWS();
}
setupWS();
