# Superscalar plugin (v0.5.31)

Wraps EstreGenesis's `Superscalar.md` (v0.16.9) as a Claude Code plugin so the discipline is available as model-invoked skills in any session that installs this plugin.

## What this plugin gives you

- **Skill: `superscalar`** (`skills/superscalar/SKILL.md`) — `/superscalar always|auto|off|status` dispatch-aggressiveness toggle plus the checklist the agent consults before parallel sub-agent dispatch. Frontmatter `description` triggers on fan-out / Workflow.parallel / multi-lane Edit contexts.
- **Skill: `subscaler`** — tiered model composition (§5.1): model tier and effort per lane, read from `model-registry.json`.
- **Skill: `ooo`** — out-of-order question scoreboard for the main lane (§5.3).
- **Skill: `speculation`** — speculation-authorization mode toggle (§4).
- **Skill: `context-caching`** — context-cache discipline (§5.4); volatile vendor numbers live in `cache-registry.json`.

## Install

### Option A — community marketplace (recommended once approved)

If the plugin has been accepted into the [Anthropic community marketplace](https://code.claude.com/docs/en/discover-plugins), it can be installed directly without adding any marketplace first:

```bash
# In a Claude Code session:
/plugin install superscalar@claude-community
```

### Option B — self-hosted EstreGenesis marketplace

The plugin is also distributed from its source repository's self-hosted marketplace at `github.com/SoliEstre/EstreGenesis`. This path is always available and tracks the latest commit on `main` rather than a pinned release SHA:

```bash
# In a Claude Code session:
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install superscalar@estregenesis-plugins
```

## What's in v0.5.31

The five skills above, plus:
- `model-registry.json` — the dated model registry `/subscaler` routes by (tiers, rows, harness binding, measured routing)
- `bench-cells.json` — the Superscalar Bench grid the registry's measured fields point to
- `cache-registry.json` — the dated per-vendor context-cache figures `context-caching` reads (§5.4)
- `reference/lane-model-guard.cjs` — a PreToolUse guard that refuses `Agent` / `Workflow` lanes without a model binding while the main runs a T1 model (§5.1.4; wired by the adopter)

## Source spec

Full Superscalar specification + dogfood ledger lives at the EG repo:
https://github.com/SoliEstre/EstreGenesis/blob/main/Superscalar.md

The plugin's skills are condensed checklists; the spec is the authoritative source.

## License

Apache-2.0.

<!-- graph-nav -->

## Related

- **Module spec** — [Superscalar.md](../../Superscalar.md)
- **Skills** — [superscalar](skills/superscalar/SKILL.md) · [subscaler](skills/subscaler/SKILL.md) · [ooo](skills/ooo/SKILL.md) · [speculation](skills/speculation/SKILL.md) · [context-caching](skills/context-caching/SKILL.md)
- **Other plugins** — [constellation](../constellation/README.md) · [hyperbrief](../hyperbrief/README.md) · [greatpractice](../greatpractice/README.md) · [ultrasafe](../ultrasafe/README.md) · [compendium](../compendium/README.md) · [corporate](../corporate/README.md)
- **Project overview** — [README.md](../../README.md)
