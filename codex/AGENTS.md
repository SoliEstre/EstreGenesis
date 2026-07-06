# AGENTS.md — EstreGenesis modules under Codex

Durable guidance for an OpenAI Codex agent working in a repo that has adopted the EstreGenesis modules. Merge the relevant parts into your project's own `AGENTS.md`, or point Codex at this file.

## Module map

EstreGenesis is a bootstrap of agentic-coding patterns plus six optional modules. Each module's full spec is one markdown file at the repo root; each ships as an Agent Skill (and, for four of them, an MCP server).

| Module | Governs | Spec | Skills | MCP |
| --- | --- | --- | --- | --- |
| **Constellation** | agent-to-agent communication (live board + A2A) | `Constellation.md` | board · a2a-emit · start · roundnext · drillnow · before-compact · echo-mode | ✅ `constellation` |
| **Superscalar** | dispatch within an agent (parallel fan-out policy) | `Superscalar.md` | superscalar | — |
| **Hyperbrief** | decision-delegation back to the user | `Hyperbrief.md` | hyperbrief · hyperbrief-trigger-check · hyperbrief-revisit | ✅ `hyperbrief` |
| **Greatpractice** | codification of recurring work | `Greatpractice.md` | *(schemas + hook; no model-invoked skill)* | — |
| **Ultrasafe** | pre-release security attestation | `Ultrasafe.md` | 8 attacker skills (`ultrasafe-*`) | ✅ `ultrasafe` |
| **Compendium** | shared cross-module vocabulary | `Compendium.md` | compendium-curate · compendium-lint | ✅ `compendium` |

The skills are self-describing (Codex triggers them from their `description`); this file only adds what a skill's frontmatter can't: the **hook-replacement discipline**.

## Hook-replacement discipline (the important part)

Under Claude Code these modules install **lifecycle hooks** — scripts the host fires automatically at turn-end, before a tool call, before compaction. **Codex has no lifecycle-hook equivalent.** The automation does not port; the *discipline* does. Where Claude Code fired a hook for you, invoke the paired skill (or run the script) yourself at the same moment:

| Claude Code hook (auto) | When it fired | Codex replacement (manual) |
| --- | --- | --- |
| `constellation/hooks/pre-send-probe.cjs` (Stop `--rearm`) | every turn-end + before every A2A emit | Before emitting any A2A message, run `node plugins/constellation/hooks/pre-send-probe.cjs` (or use the `constellation-a2a-emit` skill, which honors the §13.16.10 pre-send probe). Codex won't auto-rearm the inbox watcher — check the inbox yourself before replying. |
| `hyperbrief/hooks/trigger-advise.cjs` · `tone-estimate.cjs` · `revisit-scan.cjs` | before decision-asks / on tone commands | Before asking the user for any decision, approval, or choice, invoke the `hyperbrief-trigger-check` skill. It is a pure rubric — fully portable. |
| `ultrasafe/hooks/ultrasafe-trigger.cjs` (PreToolUse Bash) | before a publish-equivalent command (`npm publish`, `git push --tags`, …) | Before a publish/release, invoke the relevant `ultrasafe-*` attacker skill(s). No auto-trigger fires — make the pre-publish check a manual step in your release checklist. |
| `ultrasafe/hooks/ultrasafe-clean-signal.cjs` (Stop) | at cycle-end, to evaluate the 4-condition clean-signal gate | Evaluate the clean-signal gate manually via the `ultrasafe-synthesizer` skill after an iteration. |

**Framing:** losing the hooks is not losing the module. Ultrasafe's value is the 8-perspective attack decomposition, not the `PreToolUse` wiring; Hyperbrief's value is the escalation rubric, not the `Stop` timing. In Codex you keep the vocabulary and the decomposition and pay for it with a manual invocation — which is precisely the EG thesis that what survives across hosts is the *category*, not the *runtime*.

## MCP notes

- The four MCP servers are deps-0 stdio servers except for their one npm dependency (`ws` for Constellation, `ajv` for Hyperbrief/Ultrasafe; Compendium is deps-0). Run `npm install` in each server's `mcp/` directory before declaring it in `config.toml`. See [`README.md`](README.md).
- Constellation's MCP server is a **client** — it needs a Constellation WebSocket board actually running to be useful (`constellation-start` skill, or the reference `constellation/reference/runtime/server.cjs`). Without a board it loads but its tools return "not connected".
- Project-scoped `.codex/config.toml` MCP servers run only in **trusted** projects — Codex gates untrusted repos from auto-launching servers.

## Redaction

These modules follow a public-repo redaction discipline (`Compendium.md` / the module specs are the SSoT; no chat-verbatim, no governance attribution). If you extend a spec, keep it technical.
