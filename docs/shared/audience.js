// docs/shared/audience.js — audience-level switcher (general / dev)

(function () {
  const KEY = 'eg-promo-audience';
  const DEFAULT = 'general';
  const LEVELS = ['general', 'dev'];

  function applyAudience(aud) {
    if (aud === 'expert') aud = 'dev'; // legacy stored preference
    if (!LEVELS.includes(aud)) aud = DEFAULT;
    localStorage.setItem(KEY, aud);
    document.documentElement.setAttribute('data-audience', aud);
    document.querySelectorAll('.aud-toggle button').forEach((b) => {
      b.classList.toggle('active', b.dataset.audBtn === aud);
    });
    if (window.EG_REDRAW_CHARTS) window.EG_REDRAW_CHARTS();
  }

  window.EG_AUDIENCE = { apply: applyAudience, get: () => localStorage.getItem(KEY) || DEFAULT };

  document.addEventListener('DOMContentLoaded', () => {
    applyAudience(localStorage.getItem(KEY) || DEFAULT);
    document.querySelectorAll('.aud-toggle button').forEach((b) => {
      b.addEventListener('click', () => applyAudience(b.dataset.audBtn));
    });
  });
})();
