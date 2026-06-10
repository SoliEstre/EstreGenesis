# Greatpractice — Claude Code Plugin (v0.2.x)

Reference implementation of the Greatpractice module spec (`Greatpractice.md` v0.2.x) for Claude Code. Plugin ship surface 는 v0.1.0 cut 이후 변동 없음 (3 schemas + 1 contact hook — 아래 목록); spec 본문과 canonical entry corpus 는 v0.2.x 로 진행. Greatpractice is a memory-triggered practice-codification discipline: it targets the "quiet omission" failure surface — small obligations that should accompany the work but gradually slip through as memory notes accumulate and get read less. agent-workspace memory feedback (`memory/feedback_*.md` or equivalent) is the input trigger; raw signals route through a multi-criteria maturation gate into a 3-tier macro/mezzo/micro hierarchy; ratified entries are enforced via lifecycle hooks rather than relying on the model to keep the obligation in working memory.

## What this plugin ships (v0.1.0 cut 이후 동일)

- **3 JSON schemas** (`schemas/`)
  - `entry-frontmatter.schema.json` — Greatpractice.md §3.2 의 7 lint-required + extended warn fields
  - `hook-spec.schema.json` — Greatpractice.md §4.2 의 hook DSL (event, matcher, condition, action, enforcement_level)
  - `voice-rules.schema.json` — Greatpractice.md §6.3 의 blameless voice linter rule structure (placeholder, v0.2+ active)
- **1 PreToolUse contact hook** (`hooks/contact/`)
  - `outbox-json-validate.cjs` — `outbox.jsonl` direct append 차단 + JSON roundtrip 검증 (mandatory enforcement_level, exit 2 on fail)

## What's deferred to v0.2+

- 4 runtime cjs (`runtime/`): lint, promote, voice-check, freshness probe, build-index
- 4 additional hooks: motion-step pre-send-inbound, SessionStart bridge-verify (blocking), fixed-value n-way-sync, contact workspace-path
- 5 skills: greatpractice-author, greatpractice-promote, greatpractice-fault, practice-toil-score, voice-check
- 3 entry templates: macro / mezzo / micro
- `manifest.json` content-addressed hash index
- `renderers/` package (entry → derived surface generation)

## How to invoke

The hook fires automatically on `Write`/`Bash` tool calls that target `outbox.jsonl`. To install:

```jsonc
// .claude/settings.local.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Bash",
        "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/contact/outbox-json-validate.cjs" }]
      }
    ]
  }
}
```

Or use Claude Code's plugin install: `/plugin install greatpractice@estregenesis-plugins`.

## Reference

- Spec: `Greatpractice.md` (v0.2.x)
- Canonical tree: `greatpractice/{macro,mezzo,micro}/`
- Research backing: `reports/2026-06-04-greatpractice-research/` (9 axes × research + patterns + 3 synthesis files)

## License

Apache-2.0
