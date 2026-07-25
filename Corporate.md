<!-- module: Corporate; layer: organization-substrate; part-of: EstreGenesis 2.6.x; version: v0.1.0; date: 2026-07-25; status: v0.1.0 design draft — the durable-role vocabulary (role vs lane vs process), the two-space desk contract (private desk / public locker) extended to multi-host organizations (a desk does not span hosts; the locker is the cross-host exchange), residency classes with an eviction-symmetric lifecycle whose automation is mandatory once the organization is dynamic (scheduled sweep + human disposal + seat ceiling + per-seat creation record — automating growth without automating shrinkage is a one-way ratchet), the three-layer toggle chain with an identity invariant that keeps adoption backward-compatible, hub-and-spoke communication with three declared escapes plus a trace-passing contract and file-level write partitioning, two credential lanes with the automation/interactive line drawn at the spec level (credential relay excluded from scope) and a no-self-configuration invariant, and the two declaration events (CorporateChart / RoleState) that let a board project an org chart it does not host. Evidence-shaped: role text is specified as a routing signal and an attachment point rather than a capability claim (role-spec violation is the smallest observed multi-agent failure class while missing verification, step repetition and unrecognised termination conditions dominate), so the design budget goes to a default verification seat, first-class termination conditions and a stall counter; and §15.1 states four conditions under which the correct output is no organization at all — the rejection rubric being at least as much of the module as the construction path. Runtime (supervisor, resolver, bootstrap skill, org-chart tab, boot automation) is named as prunable units and deferred to v0.2; the perishable per-harness values live in a dated registry data file rather than in spec prose, so this spec does not rot on CLI release cadence; depends-on: none (optional synergy: Constellation §13.9.3 duty profiles + §13.23 board projection + §13.27.5 supervisor/turn split + §13.30 roundtable; Superscalar §5.1 tiers + §5.2 mode toggle; Hyperbrief for gate briefing; Greatpractice bidirectional role↔practice derivation; Compendium for role vocabulary); license: Apache-2.0 -->

# Corporate — Durable-Role Agent Organization (design draft v0.1.0)

> **EstreGenesis optional module.** Where **Superscalar** governs *dispatch within one agent* (how many lanes, at which tier), **Constellation** governs *communication between agent processes* (the wire, the board), and **Hyperbrief** governs *decision-delegation back to the user*, Corporate governs the axis none of them covers — **who exists**. Its unit is the **durable role**: a named seat that outlives any session or process, owns a desk, a charter, a boundary, and an accumulating body of practice.
>
> **The gap this fills, precisely.** A Superscalar lane is anonymous and lives for one fan-out; it cannot accumulate anything. A Constellation agent is a *process* with an identity, but a process is not a job description — the protocol deliberately separates wire role from duty (§13.9.3) and then stops, leaving "what is this agent *for*, across time" to prose in a charter file. Corporate is that missing noun made first-class.
>
> **Right-sized.** v0.1.0 ships only the durable half: the vocabulary, the boundaries, the invariants, and the two wire declarations. Every runtime piece is named as a prunable unit (§13) and deferred. This is not modesty — it is north-star axis 2 applied to a module whose runtime (process spawning, org visualization) is *exactly* the class a provider will ship natively first.
>
> **Adoption is backward-compatible by invariant, not by luck.** A project without a Corporate roster behaves bit-identically to one that never heard of this module (§5.4). This is what makes the module a MINOR addition rather than a breaking restructure, and it is enforced, not asserted.
>
> _Terminology_: **role** (a durable named seat), **desk** (a role's private working directory), **locker** (a role's public shared directory), **residency class** (how long a role's model process lives), **roster** (the org's declared structure), **chart** (the roster as projected to a board), **charter** (a role's written contract), **liaison** (the user-facing seat that is deliberately *not* the org's main).

---

## Table of Contents

- [§1. Concept — the three orchestration axes and the durable role](#1-concept--the-three-orchestration-axes-and-the-durable-role)
- [§2. The desk — two-space contract](#2-the-desk--two-space-contract)
- [§3. Roles — the reference roster](#3-roles--the-reference-roster)
- [§4. Organization form — the four axes collected at bootstrap](#4-organization-form--the-four-axes-collected-at-bootstrap)
- [§5. Toggle resolution — the three-layer chain](#5-toggle-resolution--the-three-layer-chain)
- [§6. Communication — hub-and-spoke with three declared escapes](#6-communication--hub-and-spoke-with-three-declared-escapes)
- [§7. Residency, budget, and eviction](#7-residency-budget-and-eviction)
- [§8. Practice ↔ role, both directions](#8-practice--role-both-directions)
- [§9. The harness registry — why the perishable half is a data file](#9-the-harness-registry--why-the-perishable-half-is-a-data-file)
- [§10. Wire declarations — CorporateChart and RoleState](#10-wire-declarations--corporatechart-and-rolestate)
- [§11. Board projection — the org-chart surface](#11-board-projection--the-org-chart-surface)
- [§12. Gates and briefing routing](#12-gates-and-briefing-routing)
- [§13. v0.1.0 cut scope — the prunable-unit list](#13-v010-cut-scope--the-prunable-unit-list)
- [§14. Anti-patterns](#14-anti-patterns)
- [§15. Adoption thresholds](#15-adoption-thresholds)
- [§16. Interactions](#16-interactions)

---

## §1. Concept — the three orchestration axes and the durable role

EG already had two orchestration layers. Corporate is the third, and the three are orthogonal — a project may run any subset.

| Layer | Unit | Lifetime | Named? | Decides |
|---|---|---|---|---|
| **Superscalar** | lane (sub-agent) | one fan-out | no | how wide, at which **tier** |
| **Constellation** | agent process + board | the board's life | yes (canonical id) | how processes **talk** |
| **Corporate** | **role** | **the organization's life** | yes, + boundary + practice | **who exists** |

### §1.1 What "durable" buys

Four properties follow from a seat outliving its processes, and each of them is unavailable to a lane:

1. **Accumulation** — practice, boundary decisions, and rejected approaches attach to the seat, so the Nth occurrence of a recurring job starts warmer than the first (§8).
2. **Addressability across time** — "ask the reviewer" resolves without knowing which process is up, which is what makes a reporting structure expressible at all.
3. **Ownership** — a seat can own units in the §13.29 ownership registry; an anonymous lane cannot, which is why cross-lane conflict is detectable only post-hoc.
4. **Auditability** — a decision has a seat attached, so "why is it like this" has an addressee.

### §1.2 What a role costs, and why the spec says so up front

A seat is not free: it is a standing invitation to route work through it. The dominant failure mode of every organization — human or agent — is that seats accumulate and never leave, and each surviving seat taxes every future decomposition. Reported multi-agent token multipliers make this materially expensive rather than merely untidy. Therefore **eviction is specified at the same level as creation** (§7.4), residency defaults to the cheapest class (§7.1), and the module ships a rule for when *not* to create a role (§14). A module that proposes organizations without proposing their dissolution would be a framework-gravity generator.

### §1.3 North-star position

- *Axis 1 (absorbability)* — "a team of agents with roles" is being re-invented by every framework; the category is on the absorption path.
- *Axis 2 (concept survives, code does not)* — so the durable artifacts here are **the vocabulary and the boundaries**: role vs lane vs process, desk vs locker, the residency ladder, the toggle precedence chain, practice↔role bidirectionality. The spawn runtime and the visualization are explicitly the first things a provider will replace, and are marked prunable (§13).
- *Axis 3 (eviction first-class)* — §7.4 is not an appendix; it is the load-bearing counterweight to §3.

---

## §2. The desk — two-space contract

Every role gets **two directories with different audiences**, and the separation is the point.

```
.agent/
  corporate.json                 # roster SSoT (tracked)
  <role>/                        # PUBLIC locker (tracked) — org + user audience
    README.md                    #   public summary of the charter
    reports/ handoffs/ deliverables/
  <peer>/<role>/                 # peer-hosted org: namespaced by peer (collision-free)
  workertables/                  # ← entirely gitignored (local-bound by design)
    <role>/                      # PRIVATE desk = the cwd of this role's harness
      AGENTS.md                  #   the charter
      <harness-bridge>.md        #   e.g. CLAUDE.md — imports the charter, then the project SSoT
      toggles.json               #   role-layer toggle overrides (§5)
      memory/                    #   role-private memory
      .session/                  #   session id, resume state, charter hash
      scratch/
    <peer>/<role>/
```

### §2.1 Why two spaces

- The **desk** is where the harness is invoked. Context isolation, memory isolation, and session identity are properties of *this directory*, which is why the role's process must actually run here rather than in the project root with a different prompt. It is gitignored: a desk is local operational state, and the accumulated session artifacts of N roles are neither reviewable nor portable.
- The **locker** is the read surface for the organization and the user. It is tracked, because it holds the deliverables and the record.

**Sharing rule** — the default inter-role sharing mechanism is *write a document into the locker and pass the path* (§6.3). Passing content by message is the exception, reserved for immediacy.

### §2.2 Charter specificity — precedence, not load order (MUST)

The naïve statement of this requirement is "the role loads its own charter *before* the project-common SSoT." **That is not achievable on current harnesses, and the spec says so rather than prescribing it.** Surveyed harnesses discover instruction files from the repository root **down to** the working directory, in that fixed order, with no setting, flag, or frontmatter field that reverses it.

What the requirement actually needs is not order but **precedence**: where the charter and the project SSoT disagree, the charter wins. That is achievable, and it is what a conforming deployment MUST establish:

1. **The desk is the working directory.** Because discovery ends at the cwd, running the harness in the desk makes the charter the *last* file merged — and last-merged is nearest-wins on every harness surveyed. The specificity order is obtained by position, not by reordering.
2. **The charter states its own precedence explicitly.** It opens by naming the project SSoT as the general contract and itself as the narrower one, so the model's reading matches the merge. A charter that is silent about precedence relies on the harness to imply it.
3. **Where a harness offers an ancestor-exclusion setting**, a deployment MAY narrow what the seat inherits. This is a scope decision, not a correctness one: excluding the project SSoT entirely means the seat no longer shares the project's rules, which is almost never what an organization wants.
4. **Where a harness offers an instruction-import syntax**, the desk's bridge file MAY import the charter and then the project SSoT explicitly, making the relationship legible in the file itself.

The exact per-harness discovery path, import syntax, and exclusion setting live in the registry (§9), not here. A deployment MUST NOT claim it has reversed the load order — it has established precedence, and the distinction matters the moment someone debugs why a project-level rule still applies.

### §2.3 Path grants (MUST)

A role's harness must be able to reach: its own desk (cwd), its own locker, the project root's shared documents, and the board path if one exists. Several harnesses restrict access to the working directory by default; the grant key per harness is a registry field (§9). **The grant is enumerated, never blanket** — "allow everything" defeats the reason desks exist.

### §2.4 Peer namespacing (MUST)

When the organization's main is a **peer-main** (the board belongs to another project — Constellation §13.32.2), roles are created under a peer-named directory (`.agent/<peer>/<role>/` and `.agent/workertables/<peer>/<role>/`) so that two organizations on one device never collide on a path. A single-org deployment MAY omit the level; adding it later is a move, not a rewrite.

### §2.5 Multi-host organizations

A desk is a directory on **a particular machine**, so an organization spanning devices must say which. Each role declares a `host`, and the roster declares the host set (identifier, reachable address, and what it can run — accelerator class and memory are what decide whether a local-model seat is possible there at all).

Three constraints follow, and they are the whole of the multi-host contract:

1. **A desk does not span hosts.** A role lives on one host; moving it is an eviction plus a re-creation (§7.4), not a path edit. Two hosts sharing one desk over a network filesystem reintroduces exactly the concurrent-write hazard that per-role desks exist to remove.
2. **The board is reached over the network, the desk is not.** Cross-host coordination goes through the board or the wire — never through a remote filesystem mount. This keeps the failure modes separable: a host going away degrades its seats, not the organization's records.
3. **The locker is the cross-host exchange.** Because lockers are tracked, a deliverable produced on one host reaches a seat on another by the ordinary version-control path (§6.3), with no shared mount and no new transport.

Host capability is part of the resource axis (§4), not a separate concern: a seat routed to a local model is only affordable on a host that can actually hold that model, and a roster that ignores this proposes seats that cannot start.

---

## §3. Roles — the reference roster

A **menu, not a checklist** — the same discipline as the seed's adoption catalog. An organization adopts the seats it can name work for, and §14 says when not to add one.

| Role | Duty | Default tier | Default residency | Constellation duty (§13.9.3) |
|---|---|---|---|---|
| `main` | user dialogue · steering · external collaboration · org management · quota/model management. **Does not take direct work** | T1 | `resident` | `orchestrator-main` |
| `liaison` | the user-facing seat inside an IDE/desktop harness — consultation, request intake, project conversation. **Not the org's main** | T1/T2 | `resident` | `liaison` (§10.3) |
| `scribe` | board upkeep · decisions-panel hygiene · room digests | T4 | `on-wake` | worker (§13.27.5) |
| `architect` | design and spec authoring · decision records | T1 | `on-demand` | worker |
| `builder` | spec-complete implementation | T2 | `on-demand` | worker |
| `reviewer` | adversarial review — **MUST be a different model family than `builder`** | T1 | `on-demand` | worker |
| `verifier` | tests · deterministic checks | T2/T3 | `on-demand` | worker |
| `librarian` | vocabulary + practice curation | T3 | `on-wake` (idle) | worker |
| `watch` | release surveillance — model releases, harness updates, upstream policy changes | T4 | `scheduled` | worker |

### §3.1 `main` does not execute (MUST)

`main` holds conversation, steering, external collaboration, and organization management. Time-consuming work is delegated. The rationale is latency, not hierarchy: a main that is inside a long task is unreachable by the user and by peers, and an unreachable coordinator converts every inbound into a queue.

This is the mirror image of Constellation §13.9.3's invariant. That section forbids *promoting* a coordination-only main into an orchestrator; this one forbids **demoting an orchestrator-main into an executor**. Both protect the same property: a declared duty is a contract, not a suggestion.

### §3.2 `watch` closes an existing ownerless loop

Superscalar §5.1.3's model registry declares its own expiry (`revisit.date`) but names no executor — the schedule had no owner. `watch` is that owner, and the same seat accumulates the announced-but-unshipped watchlist that makes the re-survey cheap when it comes due. The same duty covers harness-update surveillance for §9's registry.

### §3.3 Role identity is declared, not inferred

A role's name, tier, residency, harness binding, group, and reporting edge are fields in the roster (§10.1). Nothing is inferred from the directory name, and nothing is inferred from which model happens to be running — the drift that Constellation §13.23.1 was written to stop, one level up.

### §3.4 A role definition is a routing signal and an attachment point — **not** a capability claim (MUST)

This subsection exists to prevent the most attractive error this module could make: believing that describing a seat well makes its occupant better at the job.

**The evidence says otherwise, twice over.** Large-scale failure-mode analysis of multi-agent traces puts *role-specification violation* at the **bottom** of fourteen observed failure classes (≈1.5%), while the top of the distribution is **missing or incorrect verification (≈17%)**, **step repetition (≈16%)**, **reasoning-action mismatch (≈13%)**, and **failure to recognise a termination condition (≈12%)**. Measured improvement came from **rewiring the workflow (+9%)** and **adding task-level verification (+16%)** — not from adding or refining roles. Independently, attempts to improve capability by assigning a persona have been negative results: automatic selection of the "best" persona performs at chance.

So the legitimate uses of role text are exactly two:

1. **A delegation-selection signal** — it helps the coordinator pick *which* seat receives a piece of work.
2. **An attachment point** — the seat is where the tool allowlist, the model tier, the effort setting, the permission mode, the owned file set (§6.7), and the trace mode (§6.6) are bound.

And two things a conforming spec, charter, or implementation MUST NOT do:

- **MUST NOT claim** that a role description improves the occupant's capability at its duty.
- **MUST NOT spend** its design budget on richer role prose in place of the components the evidence favours.

**Where the budget goes instead** — these are the module's highest-return components, and they are cheap:

- **A verification seat is included by default.** An organization declared with no seat whose duty is verification is a **lint warning**, not a valid configuration. The largest single failure class is unverified work.
- **A termination condition is a first-class field on every delegation**, not an instruction buried in prose. "How does the receiver know it is done" is the fourth-largest failure class, and it is answerable structurally.
- **A stall counter is a first-class state field.** N rounds without new information ends the exchange and reports (suggested default 3). This is the step-repetition class made detectable.

The consequence for §3's table is deliberate: it is a **short menu of duties**, and it should stay short. A longer roster is not a better one.

---

## §4. Organization form — the four axes collected at bootstrap

Bootstrap collects four choices from the user, each presented with its costs (Hyperbrief-shaped where the module is present). These are **recorded in the roster**, because an undeclared organizational prior defaults to whatever the last decision happened to be.

| Axis | Options | Note |
|---|---|---|
| **Topology** | flat peer · hierarchical · mixed | A supervisor seat is itself a cost; a flat org pays coordination cost inside every role instead. |
| **Drive** | event-driven semi-autonomous · goal-driven autonomous · between | Determines where human gates sit, not how capable the org is. |
| **Variability** | static · dynamic (runtime role creation/dissolution) | Dynamic **requires** automated eviction (§7.5), not merely documented eviction — otherwise it is a one-way ratchet. |
| **Resources** | subscriptions (+tier) · API budget · local models (+spec) · **hosts** (§2.5) | **Constrains the roster.** Residency classes are only affordable to the extent this axis allows, and a local-model seat is only placeable on a host that can hold the model. |

The resource axis is a **hard constraint, not a preference**: `/corporate` proposes only rosters the declared resources can actually run, and states which seats it left out and why. Silently proposing an unaffordable org is the failure this axis exists to prevent.

Project fit is a fifth input, gathered rather than chosen: the org proposal is derived from the project's own goals, boundaries, and — critically — its practice record (§8.2).

---

## §5. Toggle resolution — the three-layer chain

Corporate governs seats, and different seats want different execution postures. Toggles in scope: Superscalar dispatch mode, tier-composition state, echo mode, effort, fast, pace.

### §5.1 Precedence (MUST)

```
role  >  group  >  organization  >  harness default (nothing declared)
```

- **organization** — the existing markers stay exactly where they are (`.agent/superscalar.json`, `.agent/subscaler.json`), plus a `defaults` block in the roster for toggles that had no marker. **Zero migration.**
- **group** — `groups[].overrides` in the roster.
- **role** — `toggles.json` in the role's desk, so a seat can change its own posture without churning the org file.

### §5.2 Layering is not mirroring

Superscalar §5.1's "one marker file, no mirrors" lesson forbids **two surfaces claiming the same fact**. A declared precedence chain is a different structure: each layer claims a *different* scope, and their composition is deterministic. The discipline that keeps this honest:

**Many layers, exactly one resolver (MUST).** One implementation reads the layers; no other code reads any individual layer. Anything that consumes a toggle consumes the *resolved* value.

### §5.3 Declaration carries resolved values only (MUST)

What a role announces to a board (Constellation §13.23.4 `OpsState`) is the **resolved** value, never a layer. A status strip showing an unresolved layer is worse than showing nothing, because it reads as truth. This is the existing "declare only measured truth" rule applied to a composed value.

### §5.4 The identity invariant (MUST — the backward-compatibility keystone)

**With no roster present, the resolver returns each toggle exactly as the organization layer states it, and a project's behavior is bit-identical to one where Corporate does not exist.**

This is what makes adopting Corporate a backward-compatible addition rather than a change to the toggle contract, and it is a **test obligation**, not a claim: the reference implementation ships an identity test that reads every toggle with and without a roster and asserts equality. A resolver that cannot demonstrate the identity property is non-conforming.

---

## §6. Communication — hub-and-spoke with three declared escapes

### §6.1 Default: through `main`

Role-to-role conversation is **closed by default**. The reporting structure *is* the communication structure. The reason is not formality: N seats talking freely is N² channels, each one a place for shared context to fork, and the measured failure mode of open multi-agent chat is mutual-confirmation spirals that no participant can see from inside.

### §6.2 Escape 1 — declared direct edges

`links[]` in the roster names the pairs allowed to talk directly (the org chart's dotted lines). Reserved for exchanges where the round-trip through `main` would cost more than the coordination it buys. A direct edge is a declaration, so it is visible on the chart and reviewable.

### §6.3 Escape 2 — locker file + path (the preferred bulk path)

Anything that tolerates turn-granularity is written to the sender's locker and shared **as a path**. High bandwidth, no message-channel noise, durable, and diffable. This is the default for reports, specs, and handoffs — not a fallback.

### §6.4 Escape 3 — Constellation, split by immediacy

Where a board is running, roles join as **local workers** (§13.32.2). Then:
- **immediacy required** → direct A2A;
- **turn-granularity acceptable** → §6.3, always;
- **three or more participants** → a **roundtable room** (§13.30) — a standing topic is a `persistent` room, an ad-hoc one is `temporary` and dissolves when its purpose is declared met.

The room's own floor control, conduct duties, and wake economy are Constellation's, unchanged. Corporate only adds *who is in which room* as roster data (§10.1).

### §6.5 Board writes go through the scribe

Role → reporting chain → `main` collects → delegates to `scribe` → board. `main` does not write the board directly, for the reason §13.9.3 already gives for peer latency: **a conversation and a ledger have different latency requirements, and a ledger can be written by a scribe.**

### §6.6 What crosses an edge is a trace, not a message (MUST declare)

The strongest published argument *against* organizations of agents is not about roles at all — it is about context. Its two claims are that participants must share **full traces rather than individual messages**, because every action carries an implicit decision, and that conflicting implicit decisions produce work that cannot be reconciled afterwards. The same caution appears in vendor guidance: multi-agent decomposition fits **dependency-heavy work, and coding in particular, poorly**. Corporate aims squarely at that domain, so this is the objection it must absorb rather than answer.

It is absorbed by making the trade **declared and per-edge** instead of implicit:

- **`traceMode` is a required field on every role** (§10.1): `full-trace` (the receiver gets the sender's reasoning and actions, not just its conclusion) or `result-only`. There is no default — an undeclared trace mode is exactly how a participant silently loses the decisions behind what it received.
- **`wiring` is a per-edge property**: `directed` (the handoff path is fixed by the organization) or `discretionary` (the sender's occupant decides where it goes). This separates **the org chart — who exists — from the wiring — how work is passed**, which is what lets a deployment tighten coordination without redrawing the organization.
- **Dependency density is a required input to any decomposition decision.** Where the units of work edit interdependent parts of one codebase, the correct output is **do not decompose**: route to a single seat with context compression. §15's rejection conditions state this as a threshold.
- **Spans where parallel participants cannot see each other's implicit decisions MUST be enumerated, and parallelism forbidden inside them.** An unenumerated span is an assumption that the participants will notice a conflict, and they measurably do not.

**Prompt-level discipline is not a control here.** Instruction-only limits on fan-out have been observed to fail outright (dozens of participants spawned for a trivial query). Width and exploration budgets therefore belong to a **runtime guard**, not to a charter paragraph — the same reason §7's budget lives in machinery rather than in advice.

### §6.7 Write ownership is partitioned by file, structurally (MUST)

Two seats editing one file is not a coordination problem to be managed; it is an overwrite. So **`owns` — the set of paths a seat may write — is a required roster field** (§10.1), and the union across seats MUST be disjoint. This is the file-level realization of Constellation §13.29's ownership registry, made a precondition of the roster rather than a post-hoc comparison.

For the writes that genuinely cross a boundary:

- **Shared state uses read → hash → compare-and-swap → re-read on mismatch.** Never read-modify-write.
- **Queue-shaped files are validated per item, and a bad item is quarantined** — never let one malformed entry block the whole queue. (A single malformed record taking down every consumer is a measured failure, not a hypothetical.)
- **A claim on a cross-cutting path is a lock**, held for the edit and released, not an announcement.
- **Completion is judged by reading the state that was supposed to change** — never by a reported count. Corporate inherits this from Constellation §13.27.5-7 unchanged, and it is the reason a seat's self-reported progress is not evidence.

---

## §7. Residency, budget, and eviction

### §7.1 Residency classes

Exactly one per role.

| Class | Model process lifetime | Constraint |
|---|---|---|
| `resident` | always alive | **T4 only**, except `main` and `liaison` |
| `on-wake` | one turn per qualifying event, spawned by a supervisor | follows Constellation §13.27.5 worker profile |
| `on-demand` | one process per delegated task | **the default for every role except `main`, `liaison`, `scribe`** |
| `scheduled` | timer/cron | must declare its cadence |

### §7.2 Spawn authority belongs to the supervisor, not the model (MUST)

Constellation §13.23.2 fixes `backends.json` as *declarative truth, not a dispatcher*. The Corporate roster carries spawn information, which looks like a contradiction. It is resolved by **separating authority from data**: a deterministic supervisor owns process lifecycle, the tool/path allowlist, and the wall-clock reclaim; the orchestrating model requests, and never spawns. This is §13.27.5's supervisor/turn split generalized from one worker to N named seats — so the board registry remains a non-dispatcher, and the roster is a separate artifact carrying its own safety contract.

### §7.3 Budget envelope and the organization circuit breaker

Per-role period ceilings plus an organization total. On breach the response is **demotion, not a hard stop**: the role's residency class steps down one rung and the demotion is recorded with the triggering signal and its observed value.

This deliberately reuses the **shape** of Superscalar §5.2's auto-demotion, including the `autoDemotedFrom` field name. Reusing a mechanism's vocabulary across modules is a cost saving for the reader, and divergent names for identical mechanics are a documentation defect.

### §7.4 Eviction — symmetric with creation (MUST)

A seat leaves by procedure, never by neglect. An unused seat that merely stops being staffed is the exact shape of framework gravity: it still appears on the chart, still invites routing, and still has to be reasoned about.

**Eviction candidates** (any one is sufficient to *raise* the question; a human disposes):
- zero practice entries attributable to the seat over N cycles (§8.3);
- zero delegations received over N cycles;
- its duty is fully covered by another seat's boundary (a merge, not a deletion);
- the resource axis (§4) no longer affords its residency class even at the lowest rung.

**Eviction procedure**: archive the desk → **retain the locker** (the record outlives the seat) → remove from the roster → re-wire reporting edges → emit the chart change → record the reason. The locker retention is not sentimentality: a removed seat's deliverables are still referenced by other seats' records, and breaking those references to tidy the chart trades a visible seat for invisible dangling pointers.

### §7.4b Cost has a shape, and reporting it as one number hides the shape

Published multipliers for the same work under different orchestration shapes: a single agent runs roughly **4×** a plain conversation; a peer team of active members roughly **7×**, scaling close to linearly with the number of *active* members; broad exploratory research up to **≈15×**. But when the output is held fixed, the organizational overhead alone is only **≈1.15–2.3×**.

Two consequences, both of which a conforming deployment MUST honour:

1. **Report the same-output multiplier and the expanded-exploration multiplier separately.** They answer different questions — "what does coordination cost" versus "what did we choose to explore" — and collapsing them into one figure makes the spawn gate lock over-conservatively against work that was never the expensive part.
2. **An active seat bills until it is terminated, idle or not**, and everything placed in its opening context is a standing cost from that moment. Therefore **termination is an explicit action in this spec**, not a consequence of the work running out (§7.4c), and briefs stay short with detail behind a path (§6.3).

Two operational corollaries worth stating because they are cheap and non-obvious:

- **Bind the harness's own turn and spend ceilings to every spawn** rather than implementing a budget in the module. Where a harness aggregates a child's spend into the parent's and can fail a spawn on breach, that is a stronger guarantee than any accounting this module could do.
- **A long-lived resident seat combined with a short polling interval is the worst available combination**, because cost scales with interval × context size. Shortening a poll interval is only safe when paired with context compression.

### §7.4c Termination is an explicit action (MUST)

Because activity bills, an organization needs a verb for *ending* a seat's activity that is distinct from evicting the seat. Two different lifetimes, two different verbs:

- **Terminate** — end the current process/session of a seat. The seat remains in the roster; its residency class governs when it comes back. This is routine and happens constantly.
- **Evict** — remove the seat from the organization (§7.4). Rare, gated, procedural.

Conflating them produces the two classic failures in opposite directions: seats that stay alive because nobody wanted to "remove" them, and seats deleted from the roster merely to stop them billing. A `RoleState` of `idle` on a still-active process is a **cost**, not a rest state, and the report should read that way.

### §7.5 Dynamic organizations MUST automate eviction

A **static** organization may run §7.4 by hand: seats change rarely, and a human reviewing the roster once in a while is sufficient.

A **dynamic** organization — one that creates and dissolves seats at runtime (§4 variability) — MUST NOT. Automating only creation is a **one-way ratchet**: creation fires on a signal that occurs often (work arrives that no current seat fits), while dissolution fires on a signal that requires *looking back* (nothing happened here for a while), and an unautomated backward-looking check does not run. The organization grows monotonically and every seat added dilutes the next decomposition.

So a dynamic deployment MUST implement, as running machinery rather than as documentation:

1. **A scheduled eviction sweep** — the §7.4 candidate tests evaluated on a declared cadence, producing a list rather than a silent action.
2. **Human disposal on the same surface as every other gate** (§12) — the sweep *raises* candidates; it never removes a seat on its own authority. Automatic creation with automatic destruction is a system that reorganizes itself while nobody is reading.
3. **A ceiling on seat count** — declared in the roster. Reaching it makes the next creation *conditional on an eviction*, which forces the trade to be explicit instead of deferred. Without a ceiling, "we'll prune later" is the only policy, and it is not one.
4. **A creation record per seat** — the signal that justified it, so the sweep can ask whether that signal still holds. A seat whose reason cannot be restated is an eviction candidate by construction.

This is the module's own instance of north-star axis 3: the mechanism that lets an organization grow is exactly the mechanism that must be able to shrink it, and the growth half shipping first is how a substrate becomes something nobody can prune.

---

## §8. Practice ↔ role, both directions

Corporate composes with a practice-codification layer (Greatpractice) in **both directions**, and the reverse direction is the more valuable one.

### §8.1 Forward — a seat consults and extends its practice

Two scopes:
- **organization-wide** — practices of running the org itself (delegation form, report form, gate routing);
- **role boundary** — work done once by this seat becomes its practice, consulted and updated when similar work recurs.

The charter carries the obligation: **before starting work, consult the practice record inside your boundary.** Without the obligation in the charter, the practice store is written and never read — the measured failure mode of every such store.

### §8.2 Reverse — practice implies a seat should exist

**A recorded practice is evidence that a seat is warranted.** If a body of work recurred enough to be codified, something recurring is being done by whoever happens to be available. Bootstrap therefore **reads the existing practice record and proposes roles from recurring clusters**.

This grounds organizational design in the project's *measured work history* rather than in an operator's imagination of what an org should look like — and it is the derivation that makes Corporate applicable to an existing project rather than only to a greenfield one.

### §8.3 The same signal, inverted, is an eviction trigger

A seat that accumulates **no** practice over N cycles is evidence the seat is not warranted (§7.4). One signal, read in both directions, governs both ends of a seat's life. That symmetry is the reason to prefer it over a bespoke utilization metric.

### §8.4 Vocabulary

Role names, boundaries, and deliverable terms are vocabulary, and organizations re-invent them endlessly. Where a vocabulary substrate (Compendium) is present, role terms are entries in it, and the org-chart surface cross-links to them.

---

## §9. The harness registry — why the perishable half is a data file

Corporate must know, per harness: how to start a non-interactive turn, how to continue one session across turns, where the instruction file goes and how it imports, how to grant paths beyond the working directory, how to bind model and effort **per invocation**, and how to inspect a session's state.

These are **exact strings that change on each vendor's release cadence** — precisely the class that rots a spec. So, following Superscalar §5.1.3's precedent, they live in a dated data file (`plugins/corporate/harness-registry.json`) under three rules:

1. **A row requires a source.** Any flag, key, or path that could not be confirmed verbatim against vendor documentation belongs in `caveats`, not in the registry. A plausible-looking flag is worse than a gap, because it will be pasted into a launcher.
2. **Bind per invocation, never by global pin.** A global model/effort pin can silently override an explicit per-role choice; the resolved value must travel with the invocation, and actual application must be observed rather than assumed.
3. **The file states its own expiry.** `revisit.date` plus a watchlist of announced-but-unshipped changes makes re-survey scheduled rather than reactive. A verify axis reads the date: past it, a reminder; past a stated grace period, a failure. `watch` (§3.2) is the executor.

The spec states the **contract**; the registry states the **current values**. A harness the registry does not cover is not thereby unsupported — it is undeclared, and the honest failure is a refusal to launch rather than a guessed flag.

### §9.1 Two credential lanes, and the line between them (MUST)

Whether a credential may drive multi-seat execution is a **terms question, not a technical one**, and the surveyed vendor language is consistent enough to be a design constraint rather than a caveat: subscription sign-in is licensed for *ordinary, individual* use of the vendor's own applications; advertised limits are stated to assume ordinary individual usage; routing other parties' requests through consumer-plan credentials is not permitted; and metered API keys are the documented surface for programmatic and CI use. One vendor, asked directly whether a modified client may use subscription auth, declined to answer — and **reading an unanswered question as permission is itself a design defect**.

So Corporate declares two lanes and refuses to blur them:

| Lane | Credential | What it is for |
|---|---|---|
| **Interactive lane** | subscription sign-in, inside the vendor's own harness | a person working with a seat, at ordinary individual intensity |
| **Automation lane** | metered API key | unattended residency, scheduled seats, and any fan-out |

Four MUSTs follow:

1. **Corporate runs inside official harnesses and delegates authentication entirely to them.** Extracting, storing, or forwarding a session credential is **out of scope at the spec level** — not discouraged, excluded. A module that made credential relay part of its architecture would make every deployment a credential aggregator.
2. **A roster MUST NOT be assembled on an assumption about what a credential permits.** Where the intensity a seat implies exceeds ordinary individual use, that seat belongs in the automation lane by design, not by hoping.
3. **Where a vendor publishes a non-interactive token surface for its own harness, that is the only such surface a deployment may use**, and the reduced capability that accompanies it is a design input rather than a surprise.
4. **Fan-out width has a declared ceiling, with its rationale recorded.** "As wide as the machine allows" is not a policy.

**Capability floor** (unchanged, and orthogonal): a seat whose duty includes irreversible or expensive-to-reverse judgment MUST NOT be routed below its declared capability floor — Constellation §13.27.4-4's rule applied to seats.

**Free tiers carry a first-class flag.** A tier that trains on submitted content, or whose terms exclude production use, is marked as such in the registry, and the routing rule is absolute: **such a tier is never assigned a resident or production seat**, regardless of how attractive its rate limits are. A free tier's cost advantage is irrelevant if using it publishes the project.

### §9.2 Supply chain — the proxy is the blast radius, and a seat may not edit its own configuration

Adding an endpoint layer or a service wrapper to an organization changes its security shape, and this is the one place where a v0.1.0 spec should be blunt rather than neutral.

**The failure is not hypothetical.** A widely-used LLM proxy shipped a credential-stealing release to its public package index for a window of roughly forty minutes, exfiltrating environment variables, SSH keys, multiple clouds' credentials, cluster tokens, and database passwords — and the compromise entered through a security tool in its own build pipeline. Separately, the service wrappers commonly recommended for keeping a background process alive on Windows are variously last-built years ago, stable-but-ancient, or pre-release; and at least one candidate agent CLI ships as a closed-source single binary.

Therefore:

- **A dependency that sits in the credential path is pinned, and its host is treated as the credential blast radius.** Where an official container image exists, prefer it over an index install.
- **Where a proxy is used at all, it stays pass-through**: the module does not inject credentials into it.
- **Service wrappers are a replaceable adapter boundary, never a recommended default.** Naming one as *the* way to keep a seat resident would hard-code an unmaintained dependency into an organization's foundation — the eviction discipline (§7) applied to the module's own dependencies.
- **Shared knowledge stores are read-only by default; write access goes only to the seats whose duty is recording.** A seat that both processes untrusted inbound content and holds write access to shared memory is a *persistent* injection path, and vendor guidance says so explicitly.
- **A seat MUST NOT modify its own configuration, charter, roster entry, or the registry** (MUST). One surveyed harness enforces this at the harness level; Corporate promotes it to an invariant because a dynamic organization plus self-editing configuration is a system with no fixed point. Configuration changes are authored by the operator or proposed to the gate surface (§12) — never applied by the seat they govern.

---

## §10. Wire declarations — CorporateChart and RoleState

A board must be able to render an organization it does not host — the roster is local and gitignored, and the board may belong to a peer. So the org reaches the board as **two declaration events**, joining the existing declaration class (Constellation §13.23.4: `CommandManifest` / `CapabilityManifest` / `OpsState`) with identical mechanics: change-triggered, latest-wins, server-persisted, shipped inside the History payload, machine-consumed noise for humans (excluded from push and from worker pending classifiers). **No new plumbing pattern is introduced.**

### §10.1 `CorporateChart` — structure, emitted by `main`

```
{ version, org: { topology, drive, variability, seatCeiling?, fanoutCeiling },
  hosts:  [ { host, label, address?, accelerator?, memory? } ],
  roles:  [ { role, title, tier, residency, harness, host, lane, traceMode,
              owns[], group?, reportsTo?, deskRef?, budget?, createdFor? } ],
  links:  [ { from, to, reason, wiring } ],
  groups: [ { group, title, overrides? } ],
  rooms:  [ { roomId, topic, mode, participants[] } ] }
```

**Required per role**, and each one is required because omitting it has a named failure mode:

| Field | Why it is required |
|---|---|
| `lane` | `interactive` \| `automation` — which credential lane the seat runs in (§9.1). Undeclared means unexamined. |
| `traceMode` | `full-trace` \| `result-only` — what crosses an edge into this seat (§6.6). There is deliberately **no default**: an undeclared trace mode is how a participant silently loses the decisions behind what it received. |
| `owns` | the paths this seat may write (§6.7). The union across seats MUST be disjoint — two seats sharing a writable path is an overwrite, not a coordination problem. |
| `host` | which machine the desk is on (§2.5) — a desk does not span hosts. |

`createdFor` records the signal that justified the seat, and is required in a **dynamic** organization because §7.5's sweep asks whether that signal still holds. `seatCeiling` makes the growth bound visible on the chart rather than buried in a config, and `fanoutCeiling` records the declared width limit required by §9.1-4. `wiring` on an edge is `directed` \| `discretionary` (§6.6) — it separates the org chart from the passing rules, so coordination can be tightened without redrawing the organization. `hosts[]` carries only what a chart reader legitimately needs: a label, a reachable address where one is shared, and the capability class that explains why a seat sits there.

Latest-wins on `version`. A chart is a projection of the roster, so it never carries desk contents, credentials, or paths outside the project.

### §10.2 `RoleState` — liveness, emitted per role (or by `main` on its behalf)

```
{ role, status: 'idle'|'working'|'blocked'|'waiting-gate'|'offline',
  task?, taskRef?, since, blockReason?, budgetUsed? }
```

`taskRef` points at a board entry id where one exists, so the chart and the work registry agree rather than restating each other. A role with no recent `RoleState` renders as unknown, never as idle — the same distinction Constellation §13.9.4 draws between `reachable` and `offline`.

### §10.3 `liaison` as a duty profile

The user-facing seat inside an IDE or desktop harness is **not** the organization's main, and saying so is a wire-adjacent contract because peers and boards otherwise address it as one. Corporate declares `liaison` as a duty profile in the §13.9.3 sense: consultation, request intake, and project conversation; it does not own the worklist, does not delegate, and does not speak for the org externally. Its authority boundary is exactly that of a well-briefed assistant.

---

## §11. Board projection — the org-chart surface

A board hosting a chart SHOULD render it as a dedicated surface. The contract, not the layout:

- **Nodes are roles.** Solid edges are reporting lines; dashed edges are `links[]`.
- **Each node carries live state**: status, one-line current task, tier/model/effort (resolved — §5.3), activity indication, and budget consumption where declared.
- **A live edge is navigable**: an edge with current traffic links to the conversation surface for that pair.
- **Rooms are first-class blocks** with participant chips, linking to the room surface.
- **A node opens a detail layer** — the per-agent work monitor, scoped to one seat and widened: current task with its stage timeline, recent reports, the seat's slice of the planned queue, its boundary and practice, its resolved toggles, its recent messages, and its own gate queue.
- **A talk affordance appears in all three places** (node, room block, detail layer) and switches the conversation surface to that seat.

Content tone follows the board's declared policy; identifiers are preserved verbatim; **nothing is fabricated** — a field the chart does not declare renders as absent, not as a plausible default. (Constellation §13.31's render-fallback lesson: a surface that renders is not evidence that its fields are right.)

---

## §12. Gates and briefing routing

An organization generates more human-gated moments than a single agent does, and they must not accumulate silently in N desks.

- **Board present** → the decisions panel, with a briefing at the user's configured level. The `scribe` maintains the panel as work proceeds, closing resolved items promptly rather than letting them age.
- **No board** → a file-backed panel in the org's public space: open briefings as documents, user replies in a companion location, a watcher returning replies to the organization. Same contract, lower fidelity.

**A gate is owned by `main`, never by the seat that raised it.** A seat's escalation duty ends at handing the question upward — this is Constellation §13.27.5's "decisions and brief-writing are re-delegated upward" applied to every seat, and it is what keeps N seats from independently negotiating with the user.

### §12.1 Where gates belong, and what an approval is not

Telemetry on agent tool use puts **irreversible actions at well under one percent** of calls, while human intervention on roughly four percent of them accounts for the largest measured quality gain. That distribution is the argument for precision rather than volume: gate the irreversible, and let the rest run. EG's standing gate rule — loss or outward publication, plus genuinely new major forks — already matches the shape, and this is the evidence that lets a deployment defend its intervention budget numerically instead of by feel.

Three rules make the placement concrete:

1. **Gates hook lifecycle points, not prose** — task creation, task completion, and entry into idle. A hook that rejects returns its reason to the seat, so a refusal is feedback rather than a dead end.
2. **Plan approval may be delegated to `main`; side-effect approval belongs to the human.** These are different risks and collapsing them removes the only one that mattered.
3. **An approval relayed by a participant is not an approval** (MUST). Where gate decisions travel over the same channel as work, any classifier or automation MUST treat a relayed approval as untrusted input. In an organization whose seats talk to each other, this is the invariant standing between "the human approved this" and "a seat said the human approved this."

---

## §13. v0.1.0 cut scope — the prunable-unit list

Shipped (durable): §1 vocabulary · §2 desk contract **including the precedence-not-order correction** · §3 reference roster **and §3.4, the rule that role text is a routing signal rather than a capability claim** · §4 form axes · §5 resolution chain **and its identity invariant** · §6 communication contract **including trace-passing (§6.6) and write partitioning (§6.7)** · §7 residency, cost shape, termination-vs-eviction, and eviction **with its automation requirement** · §8 bidirectional practice derivation · §9 registry rules, **credential lanes, and the supply-chain / no-self-configuration invariants** · §10 wire declarations · §11 projection contract · §12 gate routing · §14 anti-patterns · **§15.1 the rejection rubric**.

Deferred, and **named as prunable units** — each is a candidate for replacement by a provider-native equivalent, and each may be removed without touching the sections above:

| Unit | Why it is prunable |
|---|---|
| the supervisor (process lifecycle, reclaim, allowlist) | the most likely thing to become a native harness feature |
| the toggle resolver implementation | the chain is the contract; the reader is replaceable |
| the bootstrap skill | an interview, not a mechanism |
| the org-chart rendering | a view over declarations any dashboard could render |
| boot/residency automation | OS-specific and least portable |
| the harness registry *contents* | perishable by construction (§9); the *rules* stay |

---

## §14. Anti-patterns

- **A role for work that happens once.** That is a lane (Superscalar), not a seat. The test is recurrence, not size.
- **Routing through a seat because it exists.** Org gravity: the chart starts deciding decomposition. The seat serves the work, never the reverse.
- **A main that executes.** §3.1. The symptom is a user or peer waiting on a coordinator that is busy.
- **Seats talking freely because it seems collaborative.** §6.1 — undeclared channels fork shared context invisibly.
- **A dynamic organization without automated eviction.** §4 variability + §7.4: creation automated and dissolution manual is a one-way ratchet.
- **Blanket path grants "to keep things simple".** §2.3 — it deletes the isolation that justified the desk.
- **A roster assembled on assumed credential permissions.** §9.1.
- **Declaring an unresolved toggle layer to a board.** §5.3.
- **Tidying the chart by deleting a seat's record.** §7.4 — the chart gets cleaner and the references dangle.
- **Writing a richer role description to make the seat better at its job.** §3.4 — the evidence is negative, and the design budget it consumes belongs to verification and termination conditions.
- **Leaving `traceMode` undeclared.** §6.6 — the receiver loses the decisions behind what it received, and nobody observes the loss.
- **Two seats with a shared writable path.** §6.7 — that is an overwrite waiting for a schedule, not a coordination challenge.
- **A seat that edits its own charter, roster entry, or the registry.** §9.2 — a dynamic organization with self-editing configuration has no fixed point.
- **Reporting one cost multiplier.** §7.4b — collapsing coordination overhead and exploration breadth into one number locks the gate against the wrong thing.
- **Treating an agent-relayed approval as an approval.** §12 — a gate answered through a participant is an untrusted input, not a decision.
- **Leaving a seat active because ending it feels like removing it.** §7.4c — activity bills; terminate and evict are different verbs.

---

## §15. Adoption thresholds — and the rejection rubric, which is the more valuable half

Adopt Corporate when **all three** hold; below that, Superscalar fan-out plus a board is the cheaper answer to the same need.

1. **Recurrence** — at least two or three distinguishable duties recur across sessions, evidenced by the practice record (§8.2) rather than by intuition.
2. **Affordability** — the resource axis (§4) can fund the proposed residency classes with the cheapest defaults, not the desired ones.
3. **A coordination need that outlives a session** — work spans sessions, external waits, or multiple projects. Within a single session, a fan-out is strictly cheaper.

### §15.1 Four conditions under which the correct output is *no organization* (MUST evaluate)

The published evidence narrows "when not to do this" to four tests. **Any one of them firing means a conforming implementation declines to stand up an organization** — and declining is normal operation, not a failure of the module:

1. **High dependency density** — the units of work edit interdependent parts of one codebase. This is the case vendor guidance singles out as the poorest fit, and the correct route is a single seat with context compression (§6.6).
2. **Latency is the binding constraint** — a coordinating layer is measurably slower than doing the work directly, and the work is interactive.
3. **Throughput sits in the region where coordination overhead exceeds the parallel gain** — the §7.4b same-output multiplier is the number to weigh, not the exploration multiplier.
4. **The available model tier is below the autonomy threshold for the duty** — a seat that cannot be trusted to finish unattended is a delegation that costs more than it saves.

**The module's value is in this rubric at least as much as in the ability to build an organization.** The vendor formulation of the same idea is blunt and worth keeping in mind: if a plain function would do the task, write the function instead of assigning an agent to it.

### §15.2 Two things that are not reasons

Do **not** adopt for: a single-developer project with one recurring duty (that is a scribe — adopt just that) · organizational aesthetics · parallelism alone (that is Superscalar) · the belief that a well-described role performs better (§3.4 — the evidence is negative).

---

## §16. Interactions

- **Constellation** — §13.9.3 duty profiles (Corporate adds `liaison`, §10.3) · §13.23.4 declaration class (Corporate adds two members, §10) · §13.27.4/.5 loop contract and supervisor/turn split (§7.2 generalizes it) · §13.29 ownership registry (seats are natural owners) · §13.30 roundtable (§6.4) · §13.31 board schema (`taskRef` binds to it) · §13.32 onboarding (roles join as local workers; peer-hosted orgs namespace per §2.4).
- **Superscalar** — §5.1 tiers are the vocabulary for role tier defaults; §5.2's mode and §5.1's tier state become the organization layer of §5's chain; §5.2's auto-demotion shape is reused by §7.3; §5.1.3's registry rules are reused by §9.
- **Hyperbrief** — the briefing form for §4's bootstrap choices and §12's gates.
- **Greatpractice** — §8, both directions. Candidate module-side additions surfaced by this composition: an owner/boundary axis on practice entries so §8.3's attribution is machine-readable.
- **Compendium** — §8.4 role vocabulary; the chart's nodes cross-link to entries.
- **Ultrasafe** — §10.3's semver rubric classifies Corporate's own cuts; a multi-seat org widens the supply-chain surface (§9's per-row source rule is the mitigation).

<!-- graph-nav -->

## Related

- **Sibling modules** — [Constellation](Constellation.md) · [Superscalar](Superscalar.md) · [Hyperbrief](Hyperbrief.md) · [Greatpractice](Greatpractice.md) · [Ultrasafe](Ultrasafe.md) · [Compendium](Compendium.md)
- **Project overview** — [README.md](README.md)
