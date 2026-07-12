---
name: eg-bootstrap
description: "Bootstrap a NEW project onto the EstreGenesis AI-native standard — fetch the right seed tier, install it as the project's operating charter, and run the seed's Bootstrap mode (AGENTS.md SSoT + bridges + .agent/ scaffold). Invoke on a fresh or near-empty project when the user says bootstrap / start / set up an AI-native project / EG seed, or via /egboot. Removes the copy-the-URL step: the canonical seed locations are baked in here. For an EXISTING project with its own rule files use eg-migration; for a project already on the seed use eg-upgrade."
---

# /eg-bootstrap (`/egboot`) — start a new project on the EG standard

Bootstrap mode **B** of the seed. The point of this skill is that you no longer hunt for a GitHub URL and paste a seed by hand — the tier table below *is* the pointer, and the seed itself remains the single normative source (this skill never restates the seed's rules).

## 0. Guard — is this really a new project?

Look at the target directory. Route away if it isn't a bootstrap:

| What you find | Route to |
|---|---|
| `.agent/seed_prompt.md` already present | **`/eg-upgrade`** (seed version delta) — stop here |
| No seed, but `CLAUDE.md` / `.cursor/rules/` / `.github/copilot-instructions.md` / an existing `AGENTS.md` | **`/eg-migration`** (Migration A or C) — stop here |
| Empty repo, or source code but zero agent-rule files | continue below |

Say which route you took in one line. Do not scaffold before the mode is settled (seed §역할/Your role).

## 1. Pick the tier + language

Default to **Lite** in the user's prevailing language. Ask (one question, `AskUserQuestion`) only if the choice is genuinely open:

| Tier | Pick it when |
|---|---|
| **Lite** (default) | Normal case — full patterns, readable, no inline script bodies |
| **Compact** | The author already knows the AI-native pattern and wants the minimum viable checklist |
| **Master** | Every inline template + full script sources wanted in one self-contained file (offline/air-gapped friendly) |

**One tier per repo.** Mixing tiers produces dead links between them.

## 2. Fetch the seed (the URL you no longer have to look up)

Base: `https://raw.githubusercontent.com/SoliEstre/EstreGenesis/main/`

| Tier | English | 한국어 |
|---|---|---|
| Master | `AI_Native_Project_Master_Seed_Prompt.md` | `AI_Native_프로젝트_마스터_시드_프롬프트.md` |
| Lite | `AI_Native_Project_Seed_Prompt_Lite.md` | `AI_Native_프로젝트_시드_프롬프트_Lite.md` |
| Compact | `AI_Native_Project_Seed_Prompt_Compact.md` | `AI_Native_프로젝트_시드_프롬프트_Compact.md` |

Fetch the chosen file (WebFetch, or `curl -fsSL <base><file>`) and write it verbatim to **`.agent/seed_prompt.md`** in the target project. Keep the header comment intact — its `version:` marker is what `/eg-upgrade` diffs against later; a seed without its marker cannot be upgraded mechanically.

If the network is unavailable and the user has a local clone, read the file from there instead (`<clone>/AI_Native_*.md`). If neither is possible, stop and say so — do **not** reconstruct the seed from memory.

## 3. Run the seed

Read `.agent/seed_prompt.md` and execute it in **mode B (Bootstrap)**. The seed owns the actual procedure (phases, file layout, question cadence, principles) — follow it, do not paraphrase it here. Honor its human-decision cadence: options numbered, 2-3 questions per turn, no scaffolding before the phase decision.

## 4. Offer the optional module layer

The seed bootstraps the standard itself (`AGENTS.md` SSoT + bridges + `.agent/`). The six optional modules are a separate, additive layer. When the bootstrap lands, offer them in one line — and if the user wants everything wired at once, hand off to **`/egrich`**.

## 5. Report

Three lines: tier + language installed · what the seed created · what was deliberately left out (modules, board, hooks) and how to add it (`/egrich`).
