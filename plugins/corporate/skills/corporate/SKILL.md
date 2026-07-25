---
name: corporate
version: 0.1.0
description: "Use to stand up, inspect, or revise a durable-role agent organization — named seats with private desks, residency classes, and a reporting structure — per Corporate.md. Invoke when duties recur across sessions and a fan-out is no longer the right shape, or when asked to set up roles/an org/a team of agents for a project. Collects the four organization-form axes plus the resource and host inventory, derives candidate seats from the project's own practice record rather than from imagination, authors the roster, scaffolds desks and lockers, and declares the chart to a live board if one is present. Refuses to launch a seat whose harness the registry cannot resolve rather than guessing a flag. Pairs with corporate-status (declare current state) and corporate-sweep (the eviction pass a dynamic organization requires)."
---

# Corporate — stand up a durable-role organization

Spec SSoT: `Corporate.md`. Read it before acting; this skill is the procedure, not the contract. Where the two disagree the spec wins.

**Before anything else, run the rejection rubric (§15).** Two checks, in this order, and **declining is a normal, correct output of this skill** — not a failure to be worked around.

*Adoption thresholds* — all three must hold: two or three duties genuinely recur *across sessions* (evidenced, not intuited); the declared resources can fund the proposed seats **at their cheapest residency**; the coordination need outlives a session.

*Rejection conditions (§15.1)* — **any one firing means do not stand up an organization**: high dependency density (units of work editing interdependent parts of one codebase — the single worst-fitting case, route to one seat with context compression instead) · latency is the binding constraint on interactive work · coordination overhead exceeds the parallel gain at this scale · the available model tier is below the autonomy threshold for the duty.

If any check fails, say so plainly, name which one, and recommend the cheaper shape — a Superscalar fan-out plus a board, or a single seat. Standing up an organization the resources cannot run, or that has nothing recurring to do, is the failure this step prevents.

## 1. Collect the form (§4) — four axes, with costs

Ask about each; present options with their consequences rather than as a menu of words. Record the answers in the roster, because an undeclared organizational prior silently defaults to whatever was decided last.

- **Topology** — flat peer / hierarchical / mixed. Note the trade: a supervisor seat is itself a cost, and a flat organization pays coordination cost inside every seat instead.
- **Drive** — event-driven semi-autonomous / goal-driven autonomous / between. This decides *where human gates sit*, not how capable the organization is.
- **Variability** — static / dynamic. **If dynamic, §7.5 applies and is not optional**: the deployment must have a scheduled eviction sweep, human disposal on the gate surface, a declared seat ceiling, and a per-seat `createdFor` record. Say this at the moment the answer is given, not later.
- **Resources** — subscriptions and their tiers, metered API budget, local models, and **hosts**. This is a hard constraint on the roster, not a preference.

## 2. Inventory hosts (§2.5)

For each machine that will carry seats: identifier, reachable address if it will be shared, accelerator class, memory. Three constraints follow and should be stated once, here:

- a desk does not span hosts — moving a seat is an eviction plus a re-creation, not a path edit;
- cross-host coordination goes through the board or the wire, **never a remote filesystem mount**;
- the locker is the cross-host exchange, over the ordinary version-control path.

A local-model seat is only placeable on a host that can actually hold the model. If the inventory does not support a seat, leave the seat out and **say which one you left out and why** — silently proposing an unaffordable organization is the §4 failure.

## 3. Derive candidate seats from the practice record (§8.2)

Do this **before** proposing a roster from the reference table. A recorded practice is evidence that a seat is warranted: if work recurred enough to be codified, something recurring is being done by whoever happened to be available.

- Read the project's practice store if it has one (Greatpractice `INDEX.md` and entry frontmatter; otherwise the repo's own recurring-work artifacts — release runbooks, checklists, repeated commit shapes).
- Cluster by duty, not by file. Each cluster with two or more independent occurrences is a candidate seat; name the cluster's evidence.
- Only then reconcile against the §3 reference roster, which is a **menu, not a checklist**.
- Record each seat's justifying signal as `createdFor`. A seat whose reason cannot be restated is an eviction candidate by construction (§7.5-4).

## 4. Assign the required per-seat fields

Per seat, from §3's defaults, §7.1's classes, and §10.1's required-field table:

- **Residency defaults to `on-demand`** for everything except `main`, `liaison`, and `scribe`. `resident` is **T4 only** apart from `main`/`liaison`. Do not promote a residency class to make an organization feel more alive.
- **`main` does not take direct work** (§3.1) — if the proposed roster has `main` implementing anything, the roster is wrong.
- **`reviewer` must run on a different model family than `builder`** (§3). If the resources do not afford two families, say so and leave `reviewer` out rather than pairing a model with itself.
- **A verification seat is included by default** (§3.4). A roster with no seat whose duty is verification is a **lint warning** — missing verification is the largest observed failure class in multi-agent work, far ahead of anything role definitions address.
- **`owns[]` — the paths the seat may write — is required, and the union across seats must be disjoint** (§6.7). Two seats sharing a writable path is an overwrite waiting for a schedule. Check the disjointness explicitly; do not assume it.
- **`traceMode` is required with no default** (§6.6): `full-trace` or `result-only`. Decide it per seat by asking whether the receiver needs the sender's reasoning or only its conclusion. Leaving it unset is how a seat silently loses the decisions behind what it received.
- **`lane` is required, and the required thing is the *declaration*** (§9.1): `interactive` (the operator's own subscription, inside the vendor's own harness — **including resident and scheduled seats**), `automation` (metered key — work that must not consume a personal entitlement, or that serves requests which are not the operator's own), or `local` (an endpoint on the operator's machine — no entitlement question at all). Record a one-line rationale beside it. Do **not** refuse an interactive-lane resident seat: what the vendor terms prohibit is credential sharing, third-party sign-in, and proxying other people's requests — none of which a personal roster does, and every surveyed vendor ships a documented non-interactive mode in its own CLI. The intensity knob is `fanoutCeiling`, not the lane.
- **Prefer `local` for high-duty-cycle, low-judgment seats** where an endpoint is available. A continuously polling observer on a local model costs nothing per wake, which is what makes genuine continuity affordable (§7.4b). Verify tool-calling fitness per serving stack and per model, not per family, before assigning it work whose silent failure would go unnoticed.
- **Declare `fanoutCeiling`** on the organization with its rationale. "As wide as the machine allows" is not a policy.
- **Check the registry before assigning a harness.** If a harness sits in `caveats` rather than `harnesses`, the seat can be *declared* but **not launched** — state that explicitly instead of inventing a flag (§9 rule 1).

**Do not write richer role prose to make a seat better at its job** (§3.4). Role text is a delegation-selection signal and an attachment point for these fields — nothing more. The evidence on persona-based capability improvement is negative, and the budget belongs to verification, termination conditions, and the stall counter instead.

## 5. Scaffold desks and lockers (§2)

Per seat, create:

- **private desk** `.agent/workertables/<role>/` — gitignored. Contains the charter `AGENTS.md`, the harness bridge file if the harness uses one, `toggles.json` when the seat overrides anything, `memory/`, `.session/`, `scratch/`.
- **public locker** `.agent/<role>/` — tracked. `README.md` (the charter's public summary) plus `reports/`, `handoffs/`, `deliverables/`.
- Under a peer-hosted board, namespace both by peer name (§2.4).
- Add `.agent/workertables/` to `.gitignore` if it is not already ignored, and **verify the ignore actually matches** before writing anything into a desk — a desk that lands in version control is a privacy and noise regression that is tedious to undo.

**Charter contents (§8.1 + Constellation §13.27.5-2)**: scope, autonomy boundary (what the seat decides vs re-delegates upward), file contracts, reply obligations, the machine-count rule (any count the seat reports comes from executing a command, never from estimation), the board entry schema if the seat writes board updates, **and the obligation to consult its own practice record before starting work**. A charter without that obligation produces a practice store that is written and never read.

**Instruction load order (§2.2)**: the charter loads first, the project-common SSoT second. Use the harness's import syntax where the registry confirms one; otherwise open the charter with an instruction to read the project SSoT before working. Never rely on the harness auto-discovering the project root file *instead of* the charter — that inverts the specificity order.

## 6. Write the roster, then declare it

`.agent/corporate.json` is the SSoT: `org` (topology, drive, variability, `seatCeiling` when dynamic), `hosts[]`, `roles[]`, `links[]`, `groups[]`, `rooms[]`, `defaults`.

- **`links[]` is closed by default** (§6.1–6.2). Role-to-role conversation needs a declared edge with a stated reason; the reporting structure is the communication structure. Bulk sharing is a locker document plus its path (§6.3), not a message.
- Where a board is running, emit `CorporateChart` (Constellation §13.33.1) — the chart is a projection: no desk contents, no credentials, no filesystem paths. Then run `corporate-status` so each seat's state is declared rather than inferred.
- Board writes go through the `scribe`, not through `main` (§6.5).

## 7. Report honestly

State: the seats created, the seats **left out and why**, which harnesses can launch and which are declaration-only pending registry confirmation, the residency mix with its cost implication, and — if the organization is dynamic — whether §7.5's four eviction mechanisms exist yet. If any of the four is missing, that is an open gate, not a footnote: an organization that can create seats but not retire them is a one-way ratchet.

## Anti-patterns to refuse (§14)

A seat for work that happens once (that is a lane). Routing through a seat because it exists. A `main` that executes. Seats talking without a declared edge. A dynamic organization without automated eviction. Blanket path grants. A roster assembled on assumed credential permissions. Declaring an unresolved toggle layer to a board. Tidying the chart by deleting a retired seat's record.
