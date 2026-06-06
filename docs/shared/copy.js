// v2.5.59 — 복사 버튼 (.copy-btn) click handler. 가장 가까운 <code> 또는 data-copy attribute 의 텍스트를 clipboard 에 복사.
(function () {
  function attachCopy(btn) {
    if (btn.dataset.copyBound) return;
    btn.dataset.copyBound = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      // 우선순위: 1) data-copy attribute / 2) 같은 .cmd-row 또는 .plugin-cmd-row 안 <code> / 3) 직전 sibling <pre>/<code>
      var text = btn.getAttribute('data-copy');
      if (!text) {
        var row = btn.closest('.cmd-row, .plugin-cmd-row, .ws-invite-row');
        var codeEl = row && row.querySelector('code, pre');
        if (codeEl) text = codeEl.textContent;
      }
      if (!text) {
        var prev = btn.previousElementSibling;
        if (prev && (prev.tagName === 'CODE' || prev.tagName === 'PRE')) text = prev.textContent;
      }
      if (!text) return;
      var ok = function () {
        var orig = btn.textContent;
        btn.textContent = btn.getAttribute('data-copied-label') || '복사됨 ✓';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok).catch(function () { btn.textContent = '복사 실패'; });
      } else {
        // fallback for older browsers
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (e) { btn.textContent = '복사 실패'; }
        document.body.removeChild(ta);
      }
    });
  }

  function scan() {
    var btns = document.querySelectorAll('.copy-btn');
    for (var i = 0; i < btns.length; i++) attachCopy(btns[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // 동적으로 추가되는 .copy-btn 도 잡기 위한 가벼운 observer
  if (window.MutationObserver) {
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType !== 1) continue;
          if (n.classList && n.classList.contains('copy-btn')) attachCopy(n);
          if (n.querySelectorAll) {
            var inner = n.querySelectorAll('.copy-btn');
            for (var k = 0; k < inner.length; k++) attachCopy(inner[k]);
          }
        }
      }
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
})();
