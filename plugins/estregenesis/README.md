# estregenesis — the EG kit plugin

EstreGenesis itself, delivered as skills instead of a URL you have to go find and paste.

Before this plugin, adopting the seed on a new project meant: open GitHub → pick the right tier among six files → copy the raw content → paste it into the target project → remember which migration section applies. That is four steps of clerical work standing in front of the actual value. This plugin collapses them into one command.

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins
```

## The five procedures

| Skill | Alias | Use it when |
|---|---|---|
| `eg-bootstrap` | `/egboot` | **New project.** Picks the seed tier, installs it as `.agent/seed_prompt.md`, runs the seed's Bootstrap mode (`AGENTS.md` SSoT + bridges + `.agent/` scaffold). |
| `eg-migration` | `/egmig` | **Existing project with its own rule files** (`CLAUDE.md`, `.cursor/rules/`, copilot-instructions…). Audits them, classifies the migration mode, promotes every rule into `AGENTS.md` or records why it was dropped, and rewrites the per-tool files as thin bridges. |
| `eg-upgrade` | `/egup` | **Already seeded.** Reads the seed's version marker, diffs it against the upstream changelog, presents an additive numbered delta menu, then refreshes the installed EG plugins. |
| `eg-memsync` | `/egmem` | **Memory and docs have drifted apart.** Sweeps the agent's per-project memory against `AGENTS.md` / `.agent/rules.md` in both directions — fixes whichever side went stale, surfaces genuine contradictions instead of guessing, and promotes memory-only durable policy into the docs. |
| `egrich` | — | **Full arm.** The seed plus all six optional modules, their plugins, hooks and MCP servers — wired and verified, with the cheap discipline-only subset named up front so "everything" stays a choice. |

Each skill routes to the right sibling if you pick the wrong one: a bootstrap on a seeded project becomes an upgrade, an upgrade on a bare project becomes a bootstrap. You do not have to know the taxonomy to start.

## What it does not do

- **It does not restate the seed.** The seed remains the single normative source for the actual procedure; these skills fetch it and run it. When the seed changes, the skills do not go stale — a copy would have.
- **The aliases are pointers, not copies.** `/egboot`, `/egmig`, `/egup` and `/egmem` each read their canonical sibling and execute it — [Compendium](../../Compendium.md)'s pointer-not-paraphrase discipline applied to this plugin's own surface. Two names, one procedure, zero drift.
- **It never reconstructs the seed from memory.** If the seed cannot be fetched (offline, no local clone), the skill stops and says so rather than producing a plausible-looking approximation of your project's charter.
- **It ships no runtime.** No hooks, no MCP server, no npm dependencies. This plugin is procedure.

## Where things live

- Seeds — 3 tiers (Master / Lite / Compact) × 2 languages, at the [repository root](https://github.com/SoliEstre/EstreGenesis). One tier per repo; mixing tiers produces dead links between them.
- Release history — [`CHANGELOG.md`](../../CHANGELOG.md) is the SSoT for what moved between versions. The seed files carry only a version marker, which is what `/eg-upgrade` diffs against; keep it intact.
- The optional module layer — [`Constellation`](../../Constellation.md) · [`Superscalar`](../../Superscalar.md) · [`Hyperbrief`](../../Hyperbrief.md) · [`Greatpractice`](../../Greatpractice.md) · [`Ultrasafe`](../../Ultrasafe.md) · [`Compendium`](../../Compendium.md).

## Related

- [`Compendium.md`](../../Compendium.md) — the pointer-not-paraphrase discipline the aliases apply to themselves.
- [`README.md`](../../README.md) — the seed library itself: tiers, what the standard is, why `AGENTS.md` is the SSoT.
