---
name: egrich
description: "Arm a project with everything EstreGenesis offers — the seed charter plus all six optional modules (Constellation, Superscalar, Hyperbrief, Greatpractice, Ultrasafe, Compendium), their plugins, hooks and MCP servers, wired and verified. Invoke when the user wants the full EG stack rather than the lean default, or via /egrich. Installs on top of a bootstrapped or migrated project; if the project has no seed yet, it runs that step first."
---

# /egrich — full arm

The seed alone is deliberately lean: `AGENTS.md` SSoT + bridges + `.agent/`, file-based coordination, no modules. `/egrich` is the opposite end — everything EG ships, wired and checked.

**Say the cost out loud before you start.** The full stack adds always-on hooks, background processes (a live board server + bridges), and MCP servers. That is the right trade for a project running several agents in parallel; it is overkill for a solo repo. If the user has not clearly asked for "everything", name the cheap subset (§5) and let them choose.

## 1. Ensure the charter exists

If `.agent/seed_prompt.md` is absent, run `/eg-bootstrap` (new project) or `/eg-migration` (existing rules) first, and continue only after it lands. If it is present but behind, run `/eg-upgrade` first — arming a stale charter just bakes the staleness in.

## 2. Install the plugin set

```
/plugin marketplace add SoliEstre/EstreGenesis
/plugin install estregenesis@estregenesis-plugins
/plugin install constellation@estregenesis-plugins
/plugin install superscalar@estregenesis-plugins
/plugin install hyperbrief@estregenesis-plugins
/plugin install greatpractice@estregenesis-plugins
/plugin install ultrasafe@estregenesis-plugins
/plugin install compendium@estregenesis-plugins
```

## 3. What each module gives the project — and what it costs

Register each one in `AGENTS.md` (the module registry table) as you enable it, so the charter stays the SSoT of what is actually on.

| Module | What it does | What it costs |
|---|---|---|
| **Constellation** | Live board + agent-to-agent messaging: agents coordinate over a shared board instead of stepping on each other | A board server + a bridge process per agent; the heaviest piece |
| **Superscalar** | Bounds parallel fan-out: how many agents at once, what may run speculatively, what must wait for a write barrier | Discipline only — no runtime |
| **Hyperbrief** | Decision delegation: when a call is the human's, the agent produces a structured brief instead of a vague question | A hook + an MCP server |
| **Greatpractice** | Turns recurring work into durable practice (`/routinize`), with promotion user-gated so nothing over-codifies | A memory folder + optional hooks |
| **Ultrasafe** | Pre-release security fan-out: attacker-perspective agents run before a publish-equivalent command | A pre-publish hook; advisory in v0.2.x (never blocks) |
| **Compendium** | Controlled vocabulary: one definition per concept, plain + expert registers, pointing at the owning spec instead of copying it | A markdown store + a lint |

Modules are independent. Skipping any of them leaves the rest working.

## 4. Wire the runtime pieces (only the ones the project wants)

- **Hooks** — each module's hooks are declared in its plugin; confirm they loaded (`/hooks`) rather than assuming. A hook that silently failed to register is the classic quiet failure here.
- **Constellation board** — start it only if the project actually runs multiple agents. `/constellation-start` brings up the server + bridge; a solo project should skip it.
- **Compendium store** — create the content store and run its lint once, so the vocabulary starts clean rather than accumulating drift.
- **MCP servers** — the plugins declare them; verify each one is up before relying on it.

## 5. The cheap subset (recommend this when "everything" is not clearly wanted)

Discipline-only, no processes: **Superscalar + Greatpractice + Compendium**. They add rules and a lint, nothing that runs in the background. Constellation is the one to defer until the project genuinely has concurrent agents; Ultrasafe until it publishes something; Hyperbrief until decisions actually need escalating.

## 6. Verify, then report

Verify rather than claim: plugins installed (list versions) · hooks registered · MCP servers responding · `AGENTS.md` registry lists exactly what is on. Report the stack as it *is*, including anything that failed to wire — a half-armed stack reported as full is worse than a lean one.
