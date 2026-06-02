// docs/promo/shared/i18n.js — bilingual toggle (en ↔ ko)

(function () {
  const KEY = 'eg-promo-lang';
  const FALLBACK = 'en';

  function detectBrowserLang() {
    const langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ''];
    for (const l of langs) {
      if (typeof l === 'string' && l.toLowerCase().startsWith('ko')) return 'ko';
    }
    return FALLBACK;
  }

  function getLang() {
    return localStorage.getItem(KEY) || detectBrowserLang();
  }

  function setLang(lang) {
    localStorage.setItem(KEY, lang);
    applyLang(lang);
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-en]').forEach((el) => {
      el.textContent = lang === 'ko' ? (el.dataset.ko || el.dataset.en) : el.dataset.en;
    });
    document.querySelectorAll('[data-en-html]').forEach((el) => {
      el.innerHTML = lang === 'ko' ? (el.dataset.koHtml || el.dataset.enHtml) : el.dataset.enHtml;
    });
    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    if (window.EG_REDRAW_CHARTS) window.EG_REDRAW_CHARTS();
  }

  window.EG_I18N = { getLang, setLang, applyLang };

  document.addEventListener('DOMContentLoaded', () => {
    const lang = getLang();
    applyLang(lang);
    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });
  });
})();
