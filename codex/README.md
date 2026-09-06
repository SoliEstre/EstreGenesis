# EstreGenesis × OpenAI Codex

Use the EstreGenesis modules from **OpenAI Codex** (CLI / IDE), not just Claude Code.

EstreGenesis ships its seven plugins — the kit + six modules — as Claude Code plugins (`plugins/<name>/`). Codex in 2026 converged on the same three customization surfaces EG already speaks — **Agent Skills** (`SKILL.md`), **MCP servers**, and **`AGENTS.md`** — so the modules port with almost no transformation. This directory is the Codex adapter: a **projection**, not a fork.

> **Why a projection and not a copy.** The canonical `SKILL.md` files under `plugins/*/skills/*/` are *already* valid Codex skills (Codex reads the same `name` + `description` frontmatter). Duplicating them here would be exactly the drift-prone surface the [Migration-B dogfood](../reports/) warned against. Instead, `gen-codex-adapter.cjs` materializes the skills on demand into a Codex discovery path and regenerates only the Codex-specific derived surfaces (`config.toml.example` + the inventory below). A `verify-nway` axis gates that inventory against the live plugin set. This *is* the north-star bet — the **discipline/vocabulary** travels across hosts even when the host-specific automation (Claude Code's lifecycle hooks) does not.

## What ports, and how

| EG surface | Codex surface | Fidelity |
| --- | --- | --- |
| `SKILL.md` (full set — exact count in the inventory below) | Agent Skills (`.agents/skills/`) | **Full** — same frontmatter, same procedure |
| MCP servers (4) | `config.toml` `[mcp_servers.*]` | **Full** — MCP is cross-vendor; self-contained stdio servers (each runs from its plugin directory alone) |
| `AGENTS.md` | `AGENTS.md` | **Native** — Codex's own durable-guidance file |
| Lifecycle hooks (6) | *(no Codex equivalent)* | **Manual** — invoke the paired skill at the documented moment; see [`AGENTS.md`](AGENTS.md) |

## Install

**Fastest path — the plugin marketplace (codex-cli ≥ 0.153).** Codex reads this repository's existing Claude Code marketplace manifest (`.claude-plugin/marketplace.json`) as-is, so there is nothing EG-specific to generate or copy:

```sh
codex plugin marketplace add SoliEstre/EstreGenesis          # owner/repo[@ref], HTTPS or SSH URL, or a local path
codex plugin add estregenesis@estregenesis-plugins            # the kit (/egboot, /egmig, /egup, /egmem, /egrich)
codex plugin add superscalar@estregenesis-plugins             # any of the eight modules, one per line
codex plugin list                                             # shows every EG plugin with its version and cache path
codex plugin marketplace upgrade                              # refresh the Git snapshot after a new EG release
```

Measured 2026-09-05 on codex-cli 0.153.4: all eight EG plugins install and enable from that manifest with no adapter step, and Codex substitutes `${CLAUDE_PLUGIN_ROOT}` in the `mcpServers` declarations itself, so the four MCP servers start from the plugin cache without any `config.toml` stanza. (Installed copies of the servers from v2.6.58 to v2.6.121 exited before their first JSON-RPC line — Codex showed «MCP startup failed: connection closed: initialize response» for all four — because the servers reached outside their plugin directory for a shared file; fixed in v2.6.122, so upgrade the marketplace snapshot if you see that message.) The manual path below remains for older Codex builds and for project-local copies.

**1. Skills** — materialize the plugin skills into a Codex discovery path (`$HOME/.agents/skills` by default):

```sh
node codex/gen-codex-adapter.cjs --install          # symlinks (POSIX) / copies (Windows)
node codex/gen-codex-adapter.cjs --install --dest ./.agents/skills --copy   # project-local copies
```

Codex loads a skill's full `SKILL.md` only when it decides to use it (progressive disclosure), so installing the full set costs almost no context.

**2. MCP servers** — no install step. Each server runs from its plugin directory alone: `hyperbrief` carries its one dependency (`ajv`) in-tree under `plugins/hyperbrief/node_modules/` (generated from `vendor.manifest.json`, not hand-maintained), `constellation` uses the WebSocket client built into Node ≥ 22, and `compendium` / `ultrasafe` are deps-0. Copy the stanzas you want from [`config.toml.example`](config.toml.example) into `~/.codex/config.toml` (global) or a trusted project's `.codex/config.toml`, replacing `__EG_REPO_ROOT__` with your checkout's absolute path.

**3. Guidance** — point Codex at [`AGENTS.md`](AGENTS.md) (or merge its module map + hook-replacement procedures into your project's `AGENTS.md`).

## Regenerate (maintainers)

After adding/removing a skill or MCP server, refresh the committed surfaces:

```sh
node codex/gen-codex-adapter.cjs --write     # regenerates config.toml.example + the inventory below
node scripts/verify-nway-version.cjs         # the codex-adapter axis gates drift (outer repo)
```

## Inventory

<!-- BEGIN AUTO-INVENTORY (gen-codex-adapter.cjs --write) -->

**Skills projected: 46** across 8 modules · **MCP servers: 4**

### Agent Skills (→ `.agents/skills/<dir>/SKILL.md`)

| Module | Skill dir | Skill name |
| --- | --- | --- |
| compendium | `compendium-curate` | compendium-curate |
| compendium | `compendium-lint` | compendium-lint |
| constellation | `before-compact` | before-compact |
| constellation | `boardsweep` | boardsweep |
| constellation | `constellation-a2a-emit` | constellation-a2a-emit |
| constellation | `constellation-board` | constellation-board |
| constellation | `constellation-start` | constellation-start |
| constellation | `drillnow` | drillnow |
| constellation | `echo-mode` | echo-mode |
| constellation | `roundloop` | roundloop |
| constellation | `roundnext` | roundnext |
| constellation | `roundtable` | roundtable |
| corporate | `corperate` | corperate |
| corporate | `corporate` | corporate |
| corporate | `corporate-status` | corporate-status |
| corporate | `corporate-sweep` | corporate-sweep |
| estregenesis | `eg-bootstrap` | eg-bootstrap |
| estregenesis | `eg-interview` | eg-interview |
| estregenesis | `eg-memsync` | eg-memsync |
| estregenesis | `eg-migration` | eg-migration |
| estregenesis | `eg-upgrade` | eg-upgrade |
| estregenesis | `egboot` | egboot |
| estregenesis | `eggrill` | eggrill |
| estregenesis | `egmem` | egmem |
| estregenesis | `egmig` | egmig |
| estregenesis | `egrich` | egrich |
| estregenesis | `egup` | egup |
| estregenesis | `feeda` | feeda |
| estregenesis | `talka` | talka |
| greatpractice | `routinize` | routinize |
| hyperbrief | `hyperbrief` | hyperbrief |
| hyperbrief | `hyperbrief-revisit` | hyperbrief-revisit |
| hyperbrief | `hyperbrief-trigger-check` | hyperbrief-trigger-check |
| superscalar | `context-caching` | context-caching |
| superscalar | `ooo` | ooo |
| superscalar | `speculation` | speculation |
| superscalar | `subscaler` | subscaler |
| superscalar | `superscalar` | superscalar |
| ultrasafe | `ultrasafe-ai-llm-redteam` | ultrasafe-ai-llm-redteam |
| ultrasafe | `ultrasafe-crypto-reviewer` | ultrasafe-crypto-reviewer |
| ultrasafe | `ultrasafe-methodology-compliance` | ultrasafe-methodology-compliance |
| ultrasafe | `ultrasafe-social-engineer` | ultrasafe-social-engineer |
| ultrasafe | `ultrasafe-supply-chain-auditor` | ultrasafe-supply-chain-auditor |
| ultrasafe | `ultrasafe-synthesizer` | ultrasafe-synthesizer |
| ultrasafe | `ultrasafe-threat-model-lifecycle` | ultrasafe-threat-model-lifecycle |
| ultrasafe | `ultrasafe-web-api-attacker` | ultrasafe-web-api-attacker |

### MCP servers (→ `config.toml` `[mcp_servers.*]`)

| Server | source | deps (as installed — plugin directory alone) |
| --- | --- | --- |
| `compendium` | `plugins/compendium/mcp/server.cjs` | — (deps-0) |
| `constellation` | `plugins/constellation/mcp/server.cjs` | ws (optional — platform built-in used when absent) |
| `hyperbrief` | `plugins/hyperbrief/mcp/server.cjs` | ajv (carried in-tree) |
| `ultrasafe` | `plugins/ultrasafe/mcp/server.cjs` | — (deps-0) |

<!-- END AUTO-INVENTORY -->
