# EstreGenesis promotional site

Static HTML/CSS/JS landing for EstreGenesis + Superscalar + Constellation, suitable for X (Twitter) sharing.

## Structure

```
docs/promo/
  index.html           ← landing (3 module cards)
  superscalar.html     ← A/B charts + Entry 06 metrics + dogfood ledger
  constellation.html   ← 5 e2e A2A PRs + §13.x protocol family + plugin install
  shared/
    data.js            ← single source of truth (SSoT) for all metrics
    i18n.js            ← bilingual EN ↔ KO toggle
    theme.js           ← theme switcher (technical / marketing / academic)
    charts.js          ← Chart.js wrapper for Superscalar A/B + Constellation timeline
    shared.css         ← theme-agnostic base layout
    themes.css         ← three theme presets (CSS variables)
```

## Themes (pick by clicking the `tech / market / paper` toggle in the header)

- **technical** — dark / mono / metric-forward · developer audience
- **marketing** — light / gradient / bold · wider audience
- **academic** — serif / numbered / restrained · research community

## Publish via GitHub Pages

1. GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/docs`
4. Save

Pages publishes at `https://soliestre.github.io/EstreGenesis/promo/` (note: GitHub Pages URLs are lowercase).

## Local preview

Open `docs/promo/index.html` directly in a browser, or serve over HTTP:

```bash
cd docs/promo
python3 -m http.server 8080
# Open http://localhost:8080
```

## Charts dependency

Chart.js loaded from CDN (`cdn.jsdelivr.net/npm/chart.js@4.4.0`). Single external dependency, deliberately scoped to the promo site (the rest of EstreGenesis is deps-0).

## Data SSoT

All numbers in `shared/data.js`. Verifiable in the EstreGenesis repo:

- Superscalar Entry 06 → `Superscalar.md` §11
- Constellation 5 PRs → git log + CHANGELOG.md
- Ship timeline → CHANGELOG.md
- §13.x protocol additions → Constellation.md

## License

Apache-2.0 (same as parent repo).
