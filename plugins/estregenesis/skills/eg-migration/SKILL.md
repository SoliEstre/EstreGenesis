---
name: eg-migration
description: "Migrate an EXISTING project onto the EstreGenesis AI-native standard — audit whatever rule files it already has (CLAUDE.md, .cursor/rules/, copilot-instructions, ad-hoc AGENTS.md), then run the seed's Migration A (scattered rules, no SSoT) or Migration C (custom + seed hybrid). Invoke when the user wants to adopt EG on a project that already has agent instructions, or via /egmig. A project with no rule files at all goes to eg-bootstrap; a project already seeded goes to eg-upgrade."
---

# /eg-migration (`/egmig`) — bring an existing project onto the EG standard

Migration modes **M1** (Migration A) and **M3** (Migration C) of the seed. Additive by construction: the project's existing rules are *extracted and promoted*, never bulldozed.

## 0. Audit first, classify second

Inventory what the project actually has — do not guess:

```
AGENTS.md · CLAUDE.md · GEMINI.md · .cursor/rules/ · .github/copilot-instructions.md
.windsurfrules · .clinerules · .agent/ · .claude/ (settings, skills, hooks)
```

Then classify:

| Finding | Mode | Route |
|---|---|---|
| `.agent/seed_prompt.md` present (any version) | **M2** | Stop — this is an upgrade, not a migration → **`/eg-upgrade`** |
| Rule files exist, but no `AGENTS.md` acting as SSoT | **M1** | Seed's **Migration A** — continue |
| An `AGENTS.md` exists but co-exists with divergent per-tool rules, or the project has heavy custom conventions worth keeping | **M3** | Seed's **Migration C** (hybrid) — continue |
| No rule files at all | — | → **`/eg-bootstrap`** |

State the mode and the evidence for it in one line before touching anything.

## 1. Fetch the seed

Same tier table as `/eg-bootstrap` — default **Lite**, user's prevailing language. One tier per repo.

Base: `https://raw.githubusercontent.com/SoliEstre/EstreGenesis/main/`

| Tier | English | 한국어 |
|---|---|---|
| Master | `AI_Native_Project_Master_Seed_Prompt.md` | `AI_Native_프로젝트_마스터_시드_프롬프트.md` |
| Lite | `AI_Native_Project_Seed_Prompt_Lite.md` | `AI_Native_프로젝트_시드_프롬프트_Lite.md` |
| Compact | `AI_Native_Project_Seed_Prompt_Compact.md` | `AI_Native_프로젝트_시드_프롬프트_Compact.md` |

Write it verbatim to `.agent/seed_prompt.md`, header marker intact (that marker is what `/eg-upgrade` diffs later).

## 2. Run the seed's migration section

Read `.agent/seed_prompt.md` and execute **Migration A** (M1) or **Migration C** (M3). The seed owns the procedure — follow it rather than re-deriving it. The invariants it enforces, and the reason they matter here:

- **Extract, don't discard.** Every existing rule becomes either a line in `AGENTS.md` (it was a real project rule) or a deliberate drop recorded with its reason (it was tool-specific noise). Nothing evaporates silently.
- **`AGENTS.md` becomes the SSoT.** Per-tool files (`CLAUDE.md`, `.cursor/rules/*`, …) are rewritten as thin bridges that import it — that is what ends the rule-file drift the project came here to fix.
- **Custom conventions survive (M3).** A hybrid project keeps its own conventions; the seed layers structure around them instead of replacing them.

## 3. Verify the migration actually took

Before reporting done, check by inspection: every bridge file points at `AGENTS.md` · no rule contradicts `AGENTS.md` · nothing that was in the old files is unaccounted for (promoted or explicitly dropped). Report anything you could not classify — an unclassified rule is a finding, not a rounding error.

## 4. Report + offer the module layer

Report: mode taken · rules promoted / dropped (with counts) · bridges rewritten · anything unresolved. Then offer the six optional modules in one line — `/egrich` wires all of it at once.
