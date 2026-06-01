# Superscalar plugin — Phase 1 prototype (v0.1.0)

Wraps EstreGenesis's `Superscalar.md` (v0.4) as a Claude Code plugin so the discipline is available as a model-invoked skill in any session that installs this plugin.

## What this plugin gives you

- **Skill: `superscalar`** (`skills/superscalar/SKILL.md`) — model-invoked checklist the agent consults before parallel sub-agent dispatch. Frontmatter `description` triggers on fan-out / Workflow.parallel / multi-lane Edit contexts.

## Install (Phase 1 — repo-based)

```bash
# In Claude Code session, add the EG marketplace:
/plugin marketplace add SoliEstre/EstreGenesis

# Install the superscalar plugin:
/plugin install superscalar@estregenesis-plugins
```

## What's in v0.1.0 (Phase 1 prototype)

Just the skill. Phase 2 will add:
- A workflow validator (checks fan-out shape against issue_width before dispatch)
- Hooks integration with the cost-benefit gate
- Telemetry collector for dogfood-log Entry 07+

## Source spec

Full Superscalar specification + dogfood ledger lives at the EG repo:
https://github.com/SoliEstre/EstreGenesis/blob/main/Superscalar.md

The plugin's skill is a condensed checklist; the spec is the authoritative source.

## License

Apache-2.0.
