# EstreGenesis promotional site

Static HTML/CSS/JS site for EstreGenesis — the seed, the seven installable modules and the specification-only module (Pantty) — published through GitHub Pages from `/docs`.

## Structure

```
docs/
  index.html           ← landing (seed tiers + module overview)
  docs.html            ← install + usage hub
  modules.html         ← every module card + the kit plugin + skill roster
  superscalar.html     ← A/B charts + Entry 06 metrics + model-profile status (generated block)
  hyperbrief.html  greatpractice.html  ultrasafe.html  constellation.html
  compendium.html  corporate.html  pantty.html      ← one page per module
  llms.txt             ← machine-readable index of the normative files
  shared/
    data.js            ← metrics SSoT (release version is written by the cut script)
    i18n.js · audience.js · theme.js · charts.js · copy.js · shared.css · themes.css
```

What keeps these pages current: the release cut writes the version badge and `data.js` meta; module badges and meta descriptions are gated by the maintenance checker's N-way axes; the Superscalar model-profile status block is generated from `plugins/superscalar/model-registry.json` by `node scripts/sync-registry-status.mjs --write` and gated by `--check`. Prose outside those surfaces is hand-written and dated by its commit.

## Themes (pick by clicking the `tech / market / paper` toggle in the header)

- **technical** — dark / mono / metric-forward · developer audience
- **marketing** — light / gradient / bold · wider audience
- **academic** — serif / numbered / restrained · research community

## Publish via GitHub Pages

1. GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/docs`
4. Save

Pages publishes at `https://soliestre.github.io/EstreGenesis/` (note: GitHub Pages URLs are lowercase).

## Local preview

Open `docs/index.html` directly in a browser, or serve over HTTP:

```bash
cd docs
python3 -m http.server 8080
# Open http://localhost:8080
```

## Charts dependency

Chart.js loaded from CDN (`cdn.jsdelivr.net/npm/chart.js@4.4.0`). Single external dependency, deliberately scoped to the promo site (the rest of EstreGenesis is deps-0).

## Data SSoT

All numbers in `shared/data.js`. Verifiable in the EstreGenesis repo:

- Superscalar Entry 06 → `Superscalar.md` §11
- Constellation 5 PRs → git log + CHANGELOG.md
- Ship timeline → CHANGELOG.md (a historical snapshot of the 2026-06 24h dogfood, v2.4.5 → v2.5.15 — not a live release list)
- Superscalar model-profile status → `plugins/superscalar/model-registry.json` (generated block, see above)
- §13.x protocol additions → Constellation.md

## License

Apache-2.0 (same as parent repo).
