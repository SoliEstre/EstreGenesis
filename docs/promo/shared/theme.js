// docs/promo/shared/theme.js — theme switcher (technical / marketing / academic)

(function () {
  const KEY = 'eg-promo-theme';
  const DEFAULT = 'marketing';
  const THEMES = ['marketing', 'technical', 'academic'];

  function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = DEFAULT;
    localStorage.setItem(KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle button').forEach((b) => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  }

  window.EG_THEME = { apply: applyTheme, get: () => localStorage.getItem(KEY) || DEFAULT };

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem(KEY) || DEFAULT);
    document.querySelectorAll('.theme-toggle button').forEach((b) => {
      b.addEventListener('click', () => applyTheme(b.dataset.theme));
    });
  });
})();
