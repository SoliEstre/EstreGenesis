// login.js — 보드 운영자 로그인 표면 (Constellation v2.4.136 §13.25.17, deps-0).
//
// 가산 규율의 화면 쪽 절반: 계정이 0이면 **아무것도 그리지 않아요.** 이 파일이 로드된 것만으로는
//   보드가 달라지지 않고, 계정이 생긴 순간부터 로그인 막이 나타나요. 서버의 `/api/whoami` 하나가
//   그 판정의 유일한 출처예요 — 화면이 자체로 «로그인 필요» 를 추측하지 않아요(추측하면 서버와 갈라져요).
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const j = async (url, opt) => {
    const r = await fetch(url, opt);
    let b = null; try { b = await r.json(); } catch {}
    return { code: r.status, body: b };
  };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  // 계정 표시 이름은 **운영자가 자유롭게 적는 값**이에요 — id 와 달리 서버 정규식이 없어요(64자 자르기만).
  //   그대로 마크업에 넣으면 저장형 XSS 가 되고, 다중 운영자 배치에서는 한 운영자가 다른 운영자를 쳐요.
  //   목록은 자기 것만 보는 화면이 아니라서 «내가 쓴 값이니 안전» 이 성립하지 않아요.
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let state = { loginRequired: false, operator: null, operatorCount: 0 };

  async function refresh() {
    const r = await j('/api/whoami');
    if (r.code === 200 && r.body) state = r.body;
    render();
    return state;
  }

  // ── 로그인 막 ──────────────────────────────────────────────────────────────
  function render() {
    const need = state.loginRequired && !state.operator;
    let g = $('#eg-login-gate');
    if (!need) { if (g) g.remove(); document.body.classList.remove('eg-login-locked'); return; }
    if (g) return;                                  // 이미 떠 있으면 다시 만들지 않아요 (입력 중 날림 방지)
    document.body.classList.add('eg-login-locked');
    g = el('div', 'eg-login-gate');
    g.id = 'eg-login-gate';
    g.innerHTML = `<form class="eg-login-card" autocomplete="on">
      <div class="eg-login-h">보드 로그인</div>
      <div class="eg-login-sub">이 보드는 운영자 계정으로 들어가요.</div>
      <label>아이디<input name="id" autocomplete="username" required></label>
      <label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label>
      <div class="eg-login-err" hidden></div>
      <button type="submit">들어가기</button>
    </form>`;
    const form = g.querySelector('form'), err = g.querySelector('.eg-login-err');
    form.onsubmit = async (e) => {
      e.preventDefault();
      err.hidden = true;
      const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = '확인 중…';
      const r = await j('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id.value, password: form.password.value }) });
      btn.disabled = false; btn.textContent = '들어가기';
      if (r.code === 200) { form.password.value = ''; await refresh(); location.reload(); return; }   // 소켓이 쿠키를 물고 다시 붙어야 해서 새로고침
      err.hidden = false;
      err.textContent = r.body && r.body.error === 'too-many-attempts'
        ? '시도가 너무 잦아요 — 잠시 뒤에 다시 해주세요.'
        : (r.body && r.body.error === 'no-operators' ? '이 보드엔 계정이 없어요 (로그인 층 꺼짐).' : '아이디나 비밀번호가 맞지 않아요.');
    };
    document.body.appendChild(g);
    setTimeout(() => { try { form.id.focus(); } catch {} }, 50);
  }

  // ── 설정 패널 (계정 관리) ─────────────────────────────────────────────────
  // 계정이 0일 때는 «로그인 켜기» 안내로, 있으면 목록 + 추가/삭제로 보여요.
  async function openPanel() {
    await refresh();
    let p = $('#eg-login-panel');
    if (p) { p.remove(); return; }
    p = el('div', 'eg-login-panel'); p.id = 'eg-login-panel';
    const ops = state.loginRequired ? (await j('/api/operators')).body : null;
    const list = (ops && ops.operators) || [];
    p.innerHTML = `<div class="eg-lp-h">운영자 계정 <button class="eg-lp-x" type="button">✕</button></div>
      <div class="eg-lp-note">${state.loginRequired
        ? '계정이 있으면 보드 조작 권한은 <b>주소가 아니라 계정</b>으로 판정돼요. 마지막 계정을 지우면 다시 주소 판정으로 돌아가요.'
        : '지금은 <b>계정이 없어서</b> 로그인 층이 꺼져 있어요 — 보드 조작 권한은 접속 주소로 판정돼요. 리버스 프록시 뒤에 두면 원격이 전부 로컬로 보이니, 그 배치라면 계정을 만드세요.'}</div>
      ${list.length ? '<ul class="eg-lp-list">' + list.map((o) => `<li><b>${esc(o.id)}</b> <span class="eg-lp-dim">${esc(o.name)}</span>${state.operator && state.operator.id === o.id ? ' <span class="eg-lp-me">나</span>' : ''}<button class="eg-lp-del" data-id="${esc(o.id)}" type="button">삭제</button></li>`).join('') + '</ul>' : ''}
      <form class="eg-lp-add" autocomplete="off">
        <div class="eg-lp-sub">${state.loginRequired ? '계정 추가' : '첫 계정 만들기 — 만드는 즉시 로그인이 필요해져요'}</div>
        <input name="id" placeholder="아이디 (영숫자·._- 2~32자)" required>
        <input name="name" placeholder="표시 이름 (선택)">
        <input name="password" type="password" placeholder="비밀번호 (8자 이상)" autocomplete="new-password" required>
        <div class="eg-lp-err" hidden></div>
        <button type="submit">${state.loginRequired ? '추가' : '만들기'}</button>
      </form>
      ${state.operator ? '<button class="eg-lp-logout" type="button">로그아웃</button>' : ''}`;
    p.querySelector('.eg-lp-x').onclick = () => p.remove();
    const lo = p.querySelector('.eg-lp-logout');
    if (lo) lo.onclick = async () => { await j('/api/logout', { method: 'POST' }); location.reload(); };
    p.querySelectorAll('.eg-lp-del').forEach((b) => {
      b.onclick = async () => {
        if (!confirm(`계정 «${b.dataset.id}» 을 지울까요?`)) return;
        const r = await j('/api/operators', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.dataset.id }) });
        if (r.code !== 200) alert((r.body && r.body.hint) || '삭제하지 못했어요.');
        p.remove(); openPanel();
      };
    });
    const f = p.querySelector('.eg-lp-add'), fe = p.querySelector('.eg-lp-err');
    f.onsubmit = async (e) => {
      e.preventDefault(); fe.hidden = true;
      const r = await j('/api/operators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id.value, name: f.name.value, password: f.password.value }) });
      if (r.code === 200) { f.password.value = ''; p.remove(); await refresh(); if (r.body && r.body.bootstrap) location.reload(); else openPanel(); return; }
      fe.hidden = false; fe.textContent = (r.body && r.body.error) || '만들지 못했어요.';
    };
    document.body.appendChild(p);
  }

  window.egLogin = { refresh, openPanel, state: () => state };
  document.addEventListener('DOMContentLoaded', refresh);
  if (document.readyState !== 'loading') refresh();
})();
