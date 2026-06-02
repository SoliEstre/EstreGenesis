// docs/shared/charts.js — Chart.js wrapper for Superscalar A/B + Constellation timeline
// Depends on: Chart.js (CDN), data.js, i18n.js

(function () {
  const charts = {};
  // All themes anchored to banner palette: amber-orange (A side) + teal (B side).
  // Arm A uses muted/warm tones; Arm B (winner highlight) uses teal; highlight uses amber.
  const themeColors = {
    technical: {
      a: '#fb923c', b: '#2dd4bf', highlight: '#fbbf24', text: '#e6e8ec', grid: '#1f2a3f',
    },
    marketing: {
      a: '#ea580c', b: '#0d9488', highlight: '#f59e0b', text: '#1e293b', grid: '#e2e8f0',
    },
    academic: {
      a: '#d97706', b: '#0f766e', highlight: '#b45309', text: '#2c2825', grid: '#e7e2d8',
    },
  };

  function getThemeColors() {
    const t = (window.EG_THEME && window.EG_THEME.get()) || 'technical';
    return themeColors[t];
  }

  function getLang() {
    return (window.EG_I18N && window.EG_I18N.getLang()) || 'en';
  }

  function getAud() {
    return (window.EG_AUDIENCE && window.EG_AUDIENCE.get()) || 'general';
  }

  function tr(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = getLang();
    if (obj.general || obj.dev || obj.expert) {
      const aud = getAud();
      const inner = obj[aud] || obj.dev || obj.general;
      if (!inner) return '';
      if (typeof inner === 'string') return inner;
      return inner[lang] || inner.en || '';
    }
    return obj[lang] || obj.en || '';
  }

  const ARM_A_LABEL = {
    general: { en: 'Way A (simple parallel)', ko: '방식 A (단순 병렬)' },
    dev: { en: 'Arm A (Superscalar OFF)', ko: 'Arm A (Superscalar OFF)' },
    expert: { en: 'Arm A (Superscalar OFF)', ko: 'Arm A (Superscalar OFF)' },
  };
  const ARM_B_LABEL = {
    general: { en: 'Way B (disciplined)', ko: '방식 B (규율 적용)' },
    dev: { en: 'Arm B (Superscalar ON)', ko: 'Arm B (Superscalar ON)' },
    expert: { en: 'Arm B (Superscalar ON)', ko: 'Arm B (Superscalar ON)' },
  };

  function drawSuperscalarABBar(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const colors = getThemeColors();
    const data = window.EG_DATA.superscalarEntry06.metrics.filter((m) => ['endpoints', 'crossrefs', 'assumptions', 'wallclock'].includes(m.key));
    const labels = data.map((m) => tr(m.label));
    const aValues = data.map((m) => m.a);
    const bValues = data.map((m) => m.b);
    const title = tr({
      general: { en: 'The four key measurements compared across both approaches', ko: '두 방식 비교 — 네 가지 핵심 측정값' },
      dev: { en: 'Entry 06 — Superscalar OFF vs ON (9-dim audit)', ko: 'Entry 06 — Superscalar OFF vs ON (9차원 audit)' },
      expert: { en: 'Entry 06 — Superscalar OFF vs ON (9-dimension production audit)', ko: 'Entry 06 — Superscalar OFF vs ON (9차원 프로덕션 audit)' },
    });
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: tr(ARM_A_LABEL), data: aValues, backgroundColor: colors.a, borderColor: colors.a, borderWidth: 1 },
          { label: tr(ARM_B_LABEL), data: bValues, backgroundColor: colors.b, borderColor: colors.b, borderWidth: 1 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: title, color: colors.text, font: { size: 14 } },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const m = data[ctx.dataIndex];
                if (m.delta && ctx.dataset.label.toLowerCase().includes('b')) return `Δ ${m.delta}`;
                return null;
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
          y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true },
        },
      },
    });
  }

  function drawGroundingChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const colors = getThemeColors();
    const a = window.EG_DATA.superscalarEntry06.metrics.find((m) => m.key === 'crossrefs');
    const b = window.EG_DATA.superscalarEntry06.metrics.find((m) => m.key === 'assumptions');
    const groundingLabel = tr({
      general: { en: 'Sourced citations (more is better ↑)', ko: '근거 인용 수 (많을수록 좋음 ↑)' },
      dev: { en: 'crossRefs (grounding ↑)', ko: 'crossRefs (grounding ↑)' },
      expert: { en: 'crossRefs (grounding ↑)', ko: 'crossRefs (grounding ↑)' },
    });
    const speculationLabel = tr({
      general: { en: 'Speculative statements (fewer is better ↓)', ko: '추측에 의존한 진술 (적을수록 좋음 ↓)' },
      dev: { en: 'Assumptions (speculation ↓)', ko: 'Assumptions (추측 ↓)' },
      expert: { en: 'Speculative claims (↓)', ko: '추측성 진술 (↓)' },
    });
    const title = tr({
      general: { en: "What Way B got right — more sourced facts, fewer guesses", ko: '방식 B의 우위 — 근거는 더 많이, 추측은 더 적게' },
      dev: { en: "B's headline — grounding +118% / speculation −40%", ko: 'B의 핵심 우위 — grounding +118% / 추측 −40%' },
      expert: { en: "Arm B's principal advantage — grounded cross-references +118%, speculative claims −40%", ko: 'Arm B의 주된 우위 — grounded cross-reference +118% / 추측성 진술 −40%' },
    });
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [groundingLabel, speculationLabel],
        datasets: [
          { label: tr(ARM_A_LABEL), data: [a.a, b.a], backgroundColor: colors.a },
          { label: tr(ARM_B_LABEL), data: [a.b, b.b], backgroundColor: colors.highlight },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: title, color: colors.text, font: { size: 14 } },
        },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true },
          y: { ticks: { color: colors.text }, grid: { color: colors.grid } },
        },
      },
    });
  }

  function drawCostBenefitChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const colors = getThemeColors();
    const wc = window.EG_DATA.superscalarEntry06.metrics.find((m) => m.key === 'wallclock');
    const wallclockLabel = tr({
      general: { en: 'Time taken (minutes)', ko: '걸린 시간 (분)' },
      dev: { en: 'Wall-clock (min)', ko: 'Wall-clock (min)' },
      expert: { en: 'Wall-clock (min)', ko: 'Wall-clock (min)' },
    });
    const tokensLabel = tr({
      general: { en: 'Tokens used (millions)', ko: '사용한 토큰 (백만 단위)' },
      dev: { en: 'Tokens (M)', ko: 'Tokens (M)' },
      expert: { en: 'Tokens (M)', ko: 'Tokens (M)' },
    });
    const title = tr({
      general: { en: "What Way B costs — 2.65× longer, 8% more tokens (the price of agreement-first)", ko: '방식 B의 비용 — 2.65배 더 오래 걸리고 토큰은 8% 더 사용 (형상 합의의 비용)' },
      dev: { en: "B's cost — wall-clock 2.65× / tokens +8% (phase serialisation cost)", ko: 'B의 비용 — wall-clock 2.65× / 토큰 +8% (phase 직렬화 비용)' },
      expert: { en: "Arm B's cost profile — wall-clock 2.65×, tokens +8% (attributable to phase serialisation)", ko: 'Arm B의 비용 프로파일 — wall-clock 2.65×, 토큰 +8% (phase 직렬화에 귀속됨)' },
    });
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [wallclockLabel, tokensLabel],
        datasets: [
          { label: tr(ARM_A_LABEL), data: [wc.a, 1.24], backgroundColor: colors.a },
          { label: tr(ARM_B_LABEL), data: [wc.b, 1.34], backgroundColor: colors.b },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: title, color: colors.text, font: { size: 14 } },
        },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
          y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true },
        },
      },
    });
  }

  function drawConstellationPRsChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const colors = getThemeColors();
    const prs = window.EG_DATA.constellationPRs;
    const labels = prs.map((p) => `PR #${p.num}`);
    const data = prs.map((p) => p.ins);
    const bg = prs.map((p) => (p.path === 'Manual fast-path' ? colors.highlight : colors.b));
    const datasetLabel = tr({
      general: { en: 'Lines of content delivered', ko: '전달된 내용 줄 수' },
      dev: { en: 'Hub mirror insertions', ko: 'Hub mirror insertions' },
      expert: { en: 'Hub mirror insertions', ko: 'Hub mirror insertions' },
    });
    const title = tr({
      general: { en: '5 Pull Requests handled by AI agents in 24 hours · 415 lines delivered · zero security leaks · zero merge failures', ko: '24시간 동안 AI 에이전트가 처리한 Pull Request 5건 · 총 415줄 전달 · 보안 누출 0건 · 머지 실패 0건' },
      dev: { en: '5 e2e A2A PRs in ~24h · 415 hub ins · 0 redaction violations · 0 merge failures', ko: '5 e2e A2A PRs in ~24h · 415 hub ins · 0 redaction violations · 0 머지 실패' },
      expert: { en: 'Five end-to-end A2A pull requests in ~24h · 415 hub-mirror insertions · zero redaction violations · zero merge failures', ko: '24시간 내 종단 간 A2A pull request 5건 · 415건의 hub mirror insertion · redaction 위반 0건 · 머지 실패 0건' },
    });
    const yAxisTitle = tr({
      general: { en: 'Lines added', ko: '추가된 줄 수' },
      dev: { en: 'Insertions', ko: 'Insertions' },
      expert: { en: 'Insertions', ko: 'Insertions' },
    });
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: datasetLabel, data, backgroundColor: bg }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: title, color: colors.text, font: { size: 14 } },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const pr = prs[ctx.dataIndex];
                return [`commit: ${pr.commit}`, `sections: ${pr.sections}`, `path: ${pr.path}`];
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
          y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true, title: { display: true, text: yAxisTitle, color: colors.text } },
        },
      },
    });
  }

  window.EG_CHARTS = { drawSuperscalarABBar, drawGroundingChart, drawCostBenefitChart, drawConstellationPRsChart };

  window.EG_REDRAW_CHARTS = function () {
    if (document.getElementById('superscalar-ab-bar')) drawSuperscalarABBar('superscalar-ab-bar');
    if (document.getElementById('superscalar-grounding')) drawGroundingChart('superscalar-grounding');
    if (document.getElementById('superscalar-costbenefit')) drawCostBenefitChart('superscalar-costbenefit');
    if (document.getElementById('constellation-prs')) drawConstellationPRsChart('constellation-prs');
  };
})();
