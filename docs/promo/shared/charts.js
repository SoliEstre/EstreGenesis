// docs/promo/shared/charts.js — Chart.js wrapper for Superscalar A/B + Constellation timeline
// Depends on: Chart.js (CDN), data.js, i18n.js

(function () {
  const charts = {};
  const themeColors = {
    technical: {
      a: '#94a3b8', b: '#22d3ee', highlight: '#f97316', text: '#cbd5e1', grid: '#334155',
    },
    marketing: {
      a: '#cbd5e1', b: '#8b5cf6', highlight: '#f43f5e', text: '#1e293b', grid: '#e2e8f0',
    },
    academic: {
      a: '#94a3b8', b: '#0f172a', highlight: '#0369a1', text: '#1e293b', grid: '#cbd5e1',
    },
  };

  function getThemeColors() {
    const t = (window.EG_THEME && window.EG_THEME.get()) || 'technical';
    return themeColors[t];
  }

  function getLang() {
    return (window.EG_I18N && window.EG_I18N.getLang()) || 'en';
  }

  function tr(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[getLang()] || obj.en || '';
  }

  function drawSuperscalarABBar(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (charts[canvasId]) charts[canvasId].destroy();
    const colors = getThemeColors();
    const lang = getLang();
    const data = window.EG_DATA.superscalarEntry06.metrics.filter((m) => ['endpoints', 'crossrefs', 'assumptions', 'wallclock'].includes(m.key));
    const labels = data.map((m) => tr(m.label));
    const aValues = data.map((m) => m.a);
    const bValues = data.map((m) => m.b);
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Arm A (Superscalar OFF)', data: aValues, backgroundColor: colors.a, borderColor: colors.a, borderWidth: 1 },
          { label: 'Arm B (Superscalar ON)', data: bValues, backgroundColor: colors.b, borderColor: colors.b, borderWidth: 1 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: lang === 'ko' ? 'Entry 06 — Superscalar OFF vs ON (9차원 audit)' : 'Entry 06 — Superscalar OFF vs ON (9-dim audit)', color: colors.text, font: { size: 14 } },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const m = data[ctx.dataIndex];
                if (m.delta && ctx.dataset.label.includes('B')) return `Δ ${m.delta}`;
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
    const lang = getLang();
    const a = window.EG_DATA.superscalarEntry06.metrics.find((m) => m.key === 'crossrefs');
    const b = window.EG_DATA.superscalarEntry06.metrics.find((m) => m.key === 'assumptions');
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [lang === 'ko' ? 'crossRefs (grounding ↑)' : 'crossRefs (grounding ↑)', lang === 'ko' ? 'Assumptions (추측 ↓)' : 'Assumptions (speculation ↓)'],
        datasets: [
          { label: 'Arm A', data: [a.a, b.a], backgroundColor: colors.a },
          { label: 'Arm B', data: [a.b, b.b], backgroundColor: colors.highlight },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: lang === 'ko' ? 'B-only 우위 — grounding +118% / 추측 −40%' : "B's headline — grounding +118% / speculation −40%", color: colors.text, font: { size: 14 } },
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
    const lang = getLang();
    const wc = window.EG_DATA.superscalarEntry06.metrics.find((m) => m.key === 'wallclock');
    const tk = window.EG_DATA.superscalarEntry06.metrics.find((m) => m.key === 'tokens');
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [lang === 'ko' ? 'Wall-clock (min)' : 'Wall-clock (min)', lang === 'ko' ? 'Tokens (M)' : 'Tokens (M)'],
        datasets: [
          { label: 'Arm A', data: [wc.a, 1.24], backgroundColor: colors.a },
          { label: 'Arm B', data: [wc.b, 1.34], backgroundColor: colors.b },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: lang === 'ko' ? 'B의 비용 — wall-clock 2.65× / 토큰 +8% (phase 직렬화 비용)' : "B's cost — wall-clock 2.65× / tokens +8% (phase serialisation cost)", color: colors.text, font: { size: 14 } },
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
    const lang = getLang();
    const prs = window.EG_DATA.constellationPRs;
    const labels = prs.map((p) => `PR #${p.num}`);
    const data = prs.map((p) => p.ins);
    const bg = prs.map((p) => (p.path === 'Manual fast-path' ? colors.highlight : colors.b));
    charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: lang === 'ko' ? 'Hub mirror insertions' : 'Hub mirror insertions', data, backgroundColor: bg }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: colors.text } },
          title: { display: true, text: lang === 'ko' ? '5 e2e A2A PRs in ~24h · 415 hub ins · 0 redaction violations · 0 머지 실패' : '5 e2e A2A PRs in ~24h · 415 hub ins · 0 redaction violations · 0 merge failures', color: colors.text, font: { size: 14 } },
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
          y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true, title: { display: true, text: 'Insertions', color: colors.text } },
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
