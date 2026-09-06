# Generated — do not hand-edit

`plugin.json` here is projected from `../.claude-plugin/plugin.json` by
`node codex/gen-codex-adapter.cjs --write` (a verify-nway axis fails on drift).
It exists because codex-cli 0.153.4 substitutes no placeholder in `mcpServers`, but honors
`cwd: "."` relative to the installed plugin directory; Claude Code needs the absolute
`${CLAUDE_PLUGIN_ROOT}` form and ignores `cwd`. Same plugin, one manifest per host.
