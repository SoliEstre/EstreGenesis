<!-- part-of: EstreGenesis 2.5.x; kind: operational guide (kit-level, constellation-scoped); version: v0.1; date: 2026-07-19; license: Apache-2.0 -->

# Constellation Bootstrap — hub-main + local worker + dev agents, from zero

> **What this is.** The start-to-finish operational path for standing up the extreme-operability topology: a **resident hub-main** (gateway-class harness), **local workers** (daemon-class harnesses and headless turn runners), and **dev agents** (IDE/CLI coding agents joining as collaborators). It composes contracts that live elsewhere — onboarding flows (Constellation §13.32), duty profiles (§13.9.3), the loop contract (§13.27.4), and the harness-adapter contract (`plugins/HARNESS-ADAPTER-CONTRACT.md`, §7-§8 candidate maps) — into one ordered guide.
>
> **Honesty rule.** Steps that depend on a candidate host's `deferred` surfaces (contract §8) are marked **[gate]**: they become assertable only after the §8.2 measurement gate records a real command · input · observed-output triplet on that host. Until then, treat them as the *intended* path, not a verified one.

## 1. Topology

Three layers, hub-and-spoke: a **hub-main** owns boundaries, delegates, and fronts human channels; **local workers** execute delegated turns headlessly and report; **dev agents** join boards as peers/collaborators for the projects they own. One project = one board; whoever owns the project surface runs its board, everyone else joins (§13.32.2 — the rubric is ownership, not capability). The reference deployment (self-board + board-observer worker + IDE main) is a working single-machine instance of all three layers. The intended candidate placement — a resident gateway as hub-main, a messaging daemon as local worker — is the program target; running *both* gateway classes side by side has no published precedent and is treated as pioneering, verified conservatively.

## 2. Profiles & boundaries

Give every boundary (client, project, persona) its **own profile**: separate home directory, credentials, and service registrations. Know the limit: profile isolation observed on candidate hosts is home-directory-level, **not process isolation** — a compromised turn still runs as the same OS account **[gate]**. Lock messaging-bot tokens to one profile each (a token reachable from two boundaries is a cross-boundary bridge you didn't design). On the worker side, pairing/node tokens and loopback bind are the boundary primitives **[gate]**. Boards follow §13.25: loopback-first, keys on the agent surface, allowlists before any exposure — exposure is a later, separate step (§13.32.4), never part of first-run.

## 3. Messaging-group roundtable (3+ participants)

In group channels the default is **silence**: speak only when mentioned or when the room's rules grant the floor — mention-gating is the observed daemon default and matches Constellation's room conduct (§13.30, D1-D9). Give the agent *minimal* group context and make "do I speak" an explicit decision, not a completion reflex. For three or more parties, project the §13.30 floor vocabulary (voice, moderator, addressee, soft-yield, autoHop caps) onto the group surface — negotiated floor for 3+ agents in messaging groups has no published precedent; the room contract is the vocabulary EG stakes there. Real-bot verification on a live messaging group is an open gate (needs a bot token + a test group).

## 4. Timeouts & speculative pre-execution

Adopt the verified **polarity**: *loose on clarification* — a clarifying question waits long (reference: 3600 s), then a sentinel lets the agent proceed on its best understanding; *strict on risk* — a dangerous-action approval waits short (reference: 60 s), then **fails closed** (deny). Never mix the poles: self-proceeding on an un-answered risk approval is the one inversion this chapter exists to forbid. On top, compose Superscalar speculation: while a clarification waits, pre-execute the leading option in a discardable lane and accept **late steering** (a reply after the sentinel redirects, not errors). The timeout×speculation composition has no direct published precedent (near precedents exist); treat it as EG-staked vocabulary, log speculative lanes visibly (Andon), and keep them cheap to discard.

## 5. Model / effort / fast orchestration

Keep two axes apart: **priority** (fast/interactive-latency modes) and **tier** (model size × reasoning effort). Low tier is for *standing observation*: a cheap resident observer (small-model, low effort) watches streams and only escalates to a frontier tier on signal — the reference board-observer (small-model headless turns, charter-scoped) is the working precedent, and `/subscaler` covers the inverse (a frontier main delegating execution-shaped work down). Reserve fast/priority modes for the human-facing interactive lead where response latency is the product. Rule of thumb: escalation is *evidence-triggered* (a finding, a failed check), never schedule-triggered.

## 6. Skill infrastructure & the supply-chain gate

Distribute skills from **one canonical source** (this repo, contract §2) through multi-target installers to each host's skill path (contract §5.4) — both candidate hosts read the same `SKILL.md` standard (verified). Every *inbound* third-party skill passes a **supply-chain gate** before install: reputation/installs heuristics, an independent audit layer where available, and a cooldown delay — measured registry compromise rates in skill ecosystems are the justification, and installer ecosystems observed so far carry **no version pinning**, so record the installed revision yourself (lockfile or commit ref). A skill that wants network, credentials, or shell beyond its stated purpose fails the gate by default.

## 7. Continuous updating (dual policy)

Update the stack — harnesses, MCP servers, skills, plugins — on a **dual cadence**: security fixes immediately, feature updates after a cooldown with a weekly review floor. Unattended cron self-update is outside every observed host's official recommendation and can bypass the very delay defenses chapter 6 installs — don't automate what you haven't gated. The agent may *propose* updates from its own stack scan; a human (or an explicitly delegated gate) approves the apply step.

## 8. The interview-strategy skill (upstream intake)

The top-of-funnel discipline: before a hub-main decomposes and delegates, an **interview-strategy** pass extracts what the requester actually needs — pressing questions that surface purpose, constraints, and success criteria, then structuring the answers into a delegable brief. This ships as an EG kit skill (see the kit's skill roster; the chapter here is its operational slot in the topology: it runs on the *human-facing* agent, upstream of delegation, composing with Hyperbrief for the choices that surface back to the human).

## Cross-links

Constellation §13.32 (onboarding flows this guide walks) · §13.9.3 / §13.27.4 (duty + loop contracts for the resident layers) · §13.30 (room conduct projected in ch. 3) · §13.25 (access control behind ch. 2's ordering) · `plugins/HARNESS-ADAPTER-CONTRACT.md` §8 (candidate surface maps + the measurement gate that clears this guide's **[gate]** marks) · Superscalar §4 (speculative lanes in ch. 4) · `/subscaler` (tiered delegation in ch. 5).
