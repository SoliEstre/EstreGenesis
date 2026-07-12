---
name: eg-upgrade
description: "Upgrade a project that already runs on EstreGenesis — bring its seed up to the current release (Migration B numbered delta, additive only), refresh the installed EG plugins from the marketplace, and report what actually moved. Invoke when a new EG release lands, when the project's seed marker is behind, or via /egup. Requires .agent/seed_prompt.md with its version marker intact; a project without one goes to eg-bootstrap or eg-migration."
---

# /eg-upgrade (`/egup`) — bring seed + plugins + skills up to date

Mode **M2** (the seed's Migration B) plus the plugin/skill layer the seed does not cover.

## 0. Read the marker (this is the whole basis of the diff)

Read `.agent/seed_prompt.md` and pull its header comment:

```
<!-- seed-tier: <Master|Lite|Compact>; language: <…>; version: v2.5.x; date: …; counterpart: … -->
```

- **No file** → not an upgrade: route to `/eg-bootstrap` (new) or `/eg-migration` (existing rules). Stop.
- **File but no version marker** → the seed was hand-edited or truncated. Say so, and offer a re-install of the same tier as the recovery path — do not guess a version.

Record `(tier, language, from_version)`.

## 1. Compute the delta from the upstream changelog

The changelog is the SSoT for what changed between releases (the seed files carry only a marker, deliberately):

- `https://raw.githubusercontent.com/SoliEstre/EstreGenesis/main/CHANGELOG.md`

Fetch it, find the current release, and collect every entry newer than `from_version`. Two axes move at different rates — keep them separate:

- **Seed marker** (`v2.5.x` on the seed files) — bumps only when the seed *content* changes. Most releases do not touch it.
- **Release version** (the repo's `vX.Y.Z`) — bumps every meaningful cut, including module-only cuts that do not affect the seed at all.

If the seed marker did not move, say that plainly: the project's charter is already current and only the module/plugin layer needs attention. That is the common case and it is not a failure.

## 2. Present the delta as a numbered menu (additive only)

Run the seed's **Migration B**: present the changes as a numbered menu and let the human pick. The discipline that makes this safe:

- **Additive only.** Nothing the project already wrote is overwritten by the upgrade. Deltas add sections, add registry rows, add rules.
- **Per-item choice.** The user takes items individually — a delta menu is not an all-or-nothing patch.
- **Local edits win.** Where the project diverged from the seed on purpose, the divergence stands; note it and move on.

Apply the accepted items, then rewrite `.agent/seed_prompt.md` to the new tier file (same tier, same language) so its marker matches what was applied.

## 3. Refresh the plugin + skill layer

The seed marker says nothing about plugins — they version independently and this is where most releases actually land.

```
/plugin marketplace update estregenesis-plugins
```

Then, for each EG plugin the project actually has installed, update it and report the version move (`0.3.4 → 0.3.5`). Do not install plugins the project never adopted — an upgrade does not widen the surface. (Widening is `/egrich`'s job, and it is the user's call.)

Installed EG plugins live under the `estregenesis-plugins` marketplace: `estregenesis` · `constellation` · `superscalar` · `hyperbrief` · `greatpractice` · `ultrasafe` · `compendium`.

## 4. Verify + report

Verify by inspection: the seed marker now matches the tier file that was written · accepted delta items are present in the project's files · plugin versions match what the marketplace reports.

Report in a few lines: `from_version → to_version` (seed) · which delta items were taken and which were declined · plugin version moves · anything skipped and why. If nothing moved, say *why* nothing moved — that is signal, not silence.
