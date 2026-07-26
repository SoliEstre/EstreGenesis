---
name: eg-bootstrap
description: "Bootstrap a NEW project onto the EstreGenesis AI-native standard — fetch the right seed tier, install it as the project's operating charter, and run the seed's Bootstrap mode (AGENTS.md SSoT + bridges + .agent/ scaffold). Invoke on a fresh or near-empty project when the user says bootstrap / start / set up an AI-native project / EG seed, or via /egboot. Removes the copy-the-URL step: the canonical seed locations are baked in here. For an EXISTING project with its own rule files use eg-migration; for a project already on the seed use eg-upgrade."
---

# /eg-bootstrap (`/egboot`) — start a new project on the EG standard

Bootstrap mode **B** of the seed. The point of this skill is that you no longer hunt for a GitHub URL and paste a seed by hand — the tier table below *is* the pointer, and the seed itself remains the single normative source (this skill never restates the seed's rules).

## 0.0 If you are an autonomous agent and someone just handed you EG

Read this first, because the natural mistake is to treat EG as a task. **It is not something to build; it is the layer you operate on.** An autonomous agent (a resident gateway, a messaging-attached assistant, a long-lived worker) that receives the seed should install it as its own operating charter and then **stop** — production work waits for an actual request. Building something to demonstrate EG is the failure mode: you would be producing an artifact nobody asked for while the charter that governs how you record work is still not in place.

Reception, in order:

1. **Install the charter** — steps 1-3 below. This is what makes `AGENTS.md` the single source of truth for how you work here.
2. **Mount the defaults** — step 4a. Skills and conduct only; nothing that runs a process.
3. **Say what is available but not on** — step 4b, one line. Do not enable any of it yet.
4. **Then wait.** The next move belongs to the user.

If the seed is handed to you inside a **shared space with other participants** (a group chat, a bridged channel), the conduct defaults in step 4a are already in force before you finish reading — in particular, do not answer messages you were not addressed in. See §13.30.9 / `/roundtable` D10-D12.

## 0.1 Bootstrap comes before the first deliverable — including non-code projects

When a project has no charter yet and a work request arrives, **bootstrap first**, then do the work. The reason is ordering, not ceremony: the charter decides where decisions are recorded, how versions are cut, and what the agent may do without asking. Doing the work first means the first decisions land nowhere and get reconstructed later from memory.

Proceed without asking permission for the setup itself — announce it in one line and continue (`"이 프로젝트에 아직 운영 규약이 없어서 EG 부트스트랩부터 할게요 — 1분 걸려요"`), because this is the agent's own operating setup, not a change to the user's product. Two hard exceptions: **ask first** if the directory is someone else's project you were given read access to, and **stop** if step 0's guard routes you to migration or upgrade instead.

**The seed is not code-specific.** A research project, a writing project, an operations runbook, a business-planning workspace all take the same charter — the tier choice does not change and the phases do not change; only what fills them does. Do not skip bootstrap on the grounds that "this isn't a software project". The parts that carry over are the ones non-code projects most often lack: a decision record, an explicit autonomy boundary, and a place where in-flight state survives a context reset.

## 0. Guard — is this really a new project?

Look at the target directory. Route away if it isn't a bootstrap:

| What you find | Route to |
|---|---|
| `.agent/seed_prompt.md` already present | **`/eg-upgrade`** (seed version delta) — stop here |
| No seed, but `CLAUDE.md` / `.cursor/rules/` / `.github/copilot-instructions.md` / an existing `AGENTS.md` | **`/eg-migration`** (Migration A or C) — stop here |
| Empty repo, or source code but zero agent-rule files | continue below |

Say which route you took in one line. Do not scaffold before the mode is settled (seed §역할/Your role).

## 1. Pick the tier + language

Default to **Lite** in the user's prevailing language. Ask (one question, `AskUserQuestion`) only if the choice is genuinely open. Present the choice per Hyperbrief's **setup-flow choice default** (§5.6.9): plain floor band L1.1.1–L1.2.2, per-option costs/benefits + a recommendation, and an "explain more simply" fallback — the reader at bootstrap time has not adopted EG vocabulary yet.

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

## 4. Split the module layer: what mounts by default, what waits to be asked

The seed bootstraps the standard itself (`AGENTS.md` SSoT + bridges + `.agent/`). Everything else divides on one rule:

> **Mount by default what is pure discipline. Require an explicit request for anything that runs a process, opens a port, spends money, or claims authority.**

Discipline costs nothing to have and is wrong to withhold — an agent that could have avoided a misattribution and did not is worse for having waited to be asked. A process, a port, a bill, or an authority claim is the user's to grant.

### 4a. Default-mounted — do this now, no request needed

- **The skills bundle.** Install the module plugins' skills so they are *invocable*. Installing a skill does not run anything.
- **Conduct defaults, effective immediately.** These bind the agent's own behaviour and need no infrastructure:
  - **Addressing and monitoring** (§13.30.9, `/roundtable` D10-D12) — in force the moment there are **three or more participants** in any shared space, *including one with no Constellation board at all*: a Telegram or Slack group, a bridged channel, a room. Resolve the addressee before deciding what to say; an unaddressed message is not for you; as a non-participant, monitor and interject only on a named trigger. This is the default because the failure it prevents — answering a question that was handed to someone else — happens on the very first multi-party message, long before any board exists.
  - **Autonomy boundary + gate list** from the seed (loss, external publish, new major fork, restart timing).
  - **Decision recording** — where a decision goes when it needs a human.
  - **Handoff survival** — the in-flight state file, so a context reset does not lose procedure detail.
- **Say what you mounted in one line.** Not a list of features — a statement of what the agent will and will not now do on its own.

### 4b. Opt-in — name them, enable none

State availability in one line each and **wait for a request**. The parenthesis is the cost that makes it opt-in, and it belongs in the sentence:

| Available on request | Why it waits |
|---|---|
| **Constellation** board server | Runs a process and binds a port; network exposure is a security decision (§13.32.4 loopback-first) |
| **Constellation** peer-join (someone else hosts) | Joins an existing board — the owner's invitation, not yours to assume (§13.32.2) |
| **Corporate** organization | Creates seats and a roster, and claims authority over who does what. §15.1 lists the conditions under which *not* setting one up is the right answer — read it before offering |
| **Ultrasafe** blocking mode | Can stop a release. Advisory mode is the default for exactly this reason |
| Web push / notifications | Reaches the user's device outside the session |
| Scheduled or resident loops | Consumes budget while nobody is watching |

If the user wants everything wired at once, hand off to **`/egrich`** — and even then, keep 4b's costs in the offer rather than enabling silently.

## 5. Report

Four lines: tier + language installed · what the seed created · **what mounted by default** (skills + conduct, in one clause) · what is available but off, and how to turn it on. If you are an autonomous agent following §0.0, end there and wait — do not propose a first project.
