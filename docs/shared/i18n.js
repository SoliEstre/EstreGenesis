// docs/shared/i18n.js — bilingual toggle (en ↔ ko)

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

  // Apply immediately. This script lives at end of body, so every [data-en]
  // element above the tag has already been parsed and is queryable. Running
  // synchronously here (rather than on DOMContentLoaded) lets us swap text
  // content before the initial paint completes, minimising the EN→KO flash
  // that a deferred apply would produce for Korean visitors and reducing the
  // window in which Chrome could decide to offer machine translation.
  applyLang(getLang());

  document.querySelectorAll('.lang-toggle button').forEach((b) => {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });
})();
