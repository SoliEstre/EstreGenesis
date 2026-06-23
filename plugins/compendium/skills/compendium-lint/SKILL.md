---
name: compendium-lint
version: 0.2.4
description: Use to gardening-check a Compendium-style controlled-vocabulary store before committing or publishing it — verifying pointer integrity, register discipline, and store health. Invoke after adding/editing entries, on a cadence, or before a release that touches the vocabulary store. Runs the deterministic `lint.cjs` if the runtime is present (`node plugins/compendium/lint.cjs [--reindex]`); otherwise applies the same six checks by inspection. Portable: the checks are defined over plain markdown+frontmatter, so they hold for any vault (a dashboard store, an Obsidian vault, a provider memory directory). Pairs with `compendium-curate` (curate first, then lint).
---

# Compendium Lint — gardening checks for the vocabulary store

A controlled-vocabulary store degrades silently: a renamed heading orphans a pointer, a copied definition drifts, a superseded term keeps getting cited. These checks make that degradation **computable**, like a build's verify pass. Two **hard** (build-failing) + four **soft** (gardening signal).

## If the runtime is present (preferred)

```
node plugins/compendium/lint.cjs            # check only
node plugins/compendium/lint.cjs --reindex  # check + regenerate INDEX.md / index.json + the viewer-agnostic [[id]] projection
node plugins/compendium/lint.cjs --quiet    # exit code only (CI)
```
Exit `1` on any **hard** failure; `0` otherwise. Hard failures must be fixed before commit; soft warnings are a gardening worklist.

## If no runtime — apply the checks by inspection

**HARD (must fix):**
1. **broken-link** — every id in `links:` resolves to an existing entry id. A dangling peer link is a hard failure.
2. **pointer-resolution** — `owner_spec` is of the form `<file>#<slug>`, the file exists, and the slug is an **actual heading** in that file (GitHub-style slug: lowercase, spaces→`-`, punctuation dropped). A pointer to a heading that no longer exists is the most common rot.
3. **no-competing-full-def** — an `internal`-register entry's `definition.text` stays under the one-line cap; a long restatement = a competing SSoT (the pointer-not-paraphrase violation).
4. **redaction** — a conversation-sourced term carries no leaked private/governance content (only settled technical vocabulary reaches a published store).

**SOFT (gardening worklist):**
5. **orphan** — an entry with zero inbound `links` that is not an index: confirm it is genuinely cross-cutting, or wire it in.
6. **duplicate-concept** — two `active` entries sharing a concept/title-slug that contradict: merge, or supersede one (`status: superseded` + `superseded_by`).
7. **stale** — `audit.updated` lags behind a superseding note elsewhere.

## After linting clean

If you changed entries, run `--reindex` so the computed MOC (`INDEX.md`), the machine export (`index.json`), and the viewer-agnostic projection (per-entry `[[id]]` peer edges + `owner_spec` pointer) all match the frontmatter. The frontmatter is the typed SSoT; everything else is derived — never hand-edit the generated artifacts.

> Lint definitions + rationale: **Compendium.md §9** (the four gardening lints + pointer-resolution). This skill points; it does not paraphrase.
