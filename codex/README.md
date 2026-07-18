# EstreGenesis × OpenAI Codex

Use the EstreGenesis modules from **OpenAI Codex** (CLI / IDE), not just Claude Code.

EstreGenesis ships its seven plugins — the kit + six modules — as Claude Code plugins (`plugins/<name>/`). Codex in 2026 converged on the same three customization surfaces EG already speaks — **Agent Skills** (`SKILL.md`), **MCP servers**, and **`AGENTS.md`** — so the modules port with almost no transformation. This directory is the Codex adapter: a **projection**, not a fork.

> **Why a projection and not a copy.** The canonical `SKILL.md` files under `plugins/*/skills/*/` are *already* valid Codex skills (Codex reads the same `name` + `description` frontmatter). Duplicating them here would be exactly the drift-prone surface the [Migration-B dogfood](../reports/) warned against. Instead, `gen-codex-adapter.cjs` materializes the skills on demand into a Codex discovery path and regenerates only the Codex-specific derived surfaces (`config.toml.example` + the inventory below). A `verify-nway` axis gates that inventory against the live plugin set. This *is* the north-star bet — the **discipline/vocabulary** travels across hosts even when the host-specific automation (Claude Code's lifecycle hooks) does not.

## What ports, and how

| EG surface | Codex surface | Fidelity |
| --- | --- | --- |
| `SKILL.md` (full set — exact count in the inventory below) | Agent Skills (`.agents/skills/`) | **Full** — same frontmatter, same procedure |
| MCP servers (4) | `config.toml` `[mcp_servers.*]` | **Full** — MCP is cross-vendor; deps-0 stdio servers |
| `AGENTS.md` | `AGENTS.md` | **Native** — Codex's own durable-guidance file |
| Lifecycle hooks (6) | *(no Codex equivalent)* | **Manual** — invoke the paired skill at the documented moment; see [`AGENTS.md`](AGENTS.md) |

## Install

**1. Skills** — materialize the plugin skills into a Codex discovery path (`$HOME/.agents/skills` by default):

```sh
node codex/gen-codex-adapter.cjs --install          # symlinks (POSIX) / copies (Windows)
node codex/gen-codex-adapter.cjs --install --dest ./.agents/skills --copy   # project-local copies
```

Codex loads a skill's full `SKILL.md` only when it decides to use it (progressive disclosure), so installing the full set costs almost no context.

**2. MCP servers** — three of the four servers need their dependency installed first:

```sh
cd plugins/constellation/mcp && npm install   # ws
cd plugins/hyperbrief/mcp   && npm install    # ajv
cd plugins/ultrasafe/mcp    && npm install    # ajv
# compendium: deps-0, nothing to install
```

Then copy the stanzas you want from [`config.toml.example`](config.toml.example) into `~/.codex/config.toml` (global) or a trusted project's `.codex/config.toml`, replacing `__EG_REPO_ROOT__` with your checkout's absolute path.

**3. Guidance** — point Codex at [`AGENTS.md`](AGENTS.md) (or merge its module map + hook-replacement procedures into your project's `AGENTS.md`).

## Regenerate (maintainers)

After adding/removing a skill or MCP server, refresh the committed surfaces:

```sh
node codex/gen-codex-adapter.cjs --write     # regenerates config.toml.example + the inventory below
node scripts/verify-nway-version.cjs         # the codex-adapter axis gates drift (outer repo)
```

## Inventory

<!-- BEGIN AUTO-INVENTORY (gen-codex-adapter.cjs --write) -->

**Skills projected: 34** across 7 modules · **MCP servers: 4**

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
| constellation | `roundnext` | roundnext |
| constellation | `roundtable` | roundtable |
| estregenesis | `eg-bootstrap` | eg-bootstrap |
| estregenesis | `eg-memsync` | eg-memsync |
| estregenesis | `eg-migration` | eg-migration |
| estregenesis | `eg-upgrade` | eg-upgrade |
| estregenesis | `egboot` | egboot |
| estregenesis | `egmem` | egmem |
| estregenesis | `egmig` | egmig |
| estregenesis | `egrich` | egrich |
| estregenesis | `egup` | egup |
| greatpractice | `routinize` | routinize |
| hyperbrief | `hyperbrief` | hyperbrief |
| hyperbrief | `hyperbrief-revisit` | hyperbrief-revisit |
| hyperbrief | `hyperbrief-trigger-check` | hyperbrief-trigger-check |
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

| Server | source | npm dep |
| --- | --- | --- |
| `compendium` | `plugins/compendium/mcp/server.cjs` | — (deps-0) |
| `constellation` | `plugins/constellation/mcp/server.cjs` | ws |
| `hyperbrief` | `plugins/hyperbrief/mcp/server.cjs` | ajv |
| `ultrasafe` | `plugins/ultrasafe/mcp/server.cjs` | ajv |

<!-- END AUTO-INVENTORY -->
