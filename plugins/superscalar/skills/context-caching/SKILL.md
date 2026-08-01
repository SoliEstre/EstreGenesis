---
name: context-caching
description: "Context-cache discipline — the memory-hierarchy borrowing: keep the prompt-cache prefix stable the way a CPU keeps its working set hot. Three modes (off / self / agent): self applies the discipline in-session (pin model+effort at session head, compact at boundaries, rewind over compact for abandoned paths, account for cache-cold subagents, measure with the cache counters); agent delegates the watching to a resident. Volatile vendor numbers live in cache-registry.json, never in this skill."
---

# /context-caching — context-cache discipline (memory-hierarchy borrowing)

Superscalar borrows processor architecture: superscalar issue (§2), out-of-order execution (§2, §5.3), speculation (§4), tier composition (§5.1). This skill adds the **memory hierarchy**: the prompt cache is the L1 the whole session runs against — reads cost ~0.1× and writes cost 1.25–2×, so the discipline is the same as a CPU's: **keep the working set hot, and know exactly which operations flush it.**

Normative spec: `Superscalar.md §5.4`. Volatile facts (vendor multipliers, TTLs, invalidator lists) live in **`plugins/superscalar/cache-registry.json`** — dated, source-anchored, with its own revisit cadence. Never recall a number from memory; read the registry, and treat it as expired when its `revisit.date` has passed.

## 1. Toggle contract

- State = one marker file: `.agent/context-caching.json` — `{"mode": "self" | "agent" | "off"}`. Absent ⇒ `off`. No mirrors (§5.1's state-convergence lesson).
- `/context-caching self|agent|off` writes it · `/context-caching status` reads it back plus the session's cache counters where available.
- **Default OFF** — modern harnesses already automate the substrate (TTL selection, breakpoint placement, prefix ordering). The skill's jurisdiction is only what the harness does NOT do for you: *when* to hit a boundary, *whether* a mutation is worth its flush, and *how* fan-out changes the accounting. What the harness absorbs over time leaves this skill's scope — that shrinkage is expected, not a defect.

## 2. `self` mode — the in-session discipline

1. **Pin at the session head.** Model and effort are each part of the cache key — switching either mid-session recomputes the entire history. Pick both at the top; a mid-task switch is a paid decision, not a free preference. Need another model for a side question? That is what a subagent is for.
2. **Boundary discipline.** Compaction rebuilds the conversation layer by design — so choose *when*: at natural task boundaries, not mid-task via auto-compact. To abandon a path, prefer **rewinding** to an earlier turn over compacting: a rewind returns to a prefix that is already cached; a compact builds a new one.
3. **Prefetch at the boundary.** The OS-prefetch analogy: right *after* a boundary (post-compact, post-clear), load the context the next task will need — the reads land at the front of the new stable prefix and stay cheap for the rest of the task. The wrong time to do bulk reading is right *before* a boundary, where it is about to be thrown away.
4. **Fan-out accounting.** A subagent starts cache-cold on its own prefix (and on some harnesses at a shorter TTL), while the parent's cache is untouched. Delegation is therefore cheapest exactly where §5.1 already routes it: self-contained lanes and parallel fan-outs that have forfeited the shared cache anyway. A cache-hot, deep-context single edit loses money on delegation — same rule, cache-side reasoning.
5. **Know the flush list.** Before any mid-session environment mutation — connecting/disconnecting an MCP server, denying a whole tool, toggling a speed mode — check the registry's invalidator list for the current harness. Some flushes happen *without you*: a server process dying and reconnecting is a flush on harnesses that load tool definitions into the prefix.
6. **Measure, never declare.** Cache health is two counters the API already reports (cache-read vs cache-write tokens). High write turn after turn means the prefix is churning — go find what changed. A claimed hit-rate that nobody read from the counters is a declaration, and declarations are how this repository got burned before.

## 3. `agent` mode — the resident watcher

Delegates §2's watching to a resident observer (Constellation §13.27 residency + §13.35.8 seat telemetry, where adopted):

- The resident reads **derived** telemetry — context occupancy, cache counters, last activity — from what the harness recorded; it never asks the model to self-report (telemetry, not echo: zero model tokens).
- It **advises**: flags approaching context pressure with the *boundary* framing ("natural break soon — compact then, not mid-task"), and flags cache-breaking operations it observes.
- It does **not** execute compaction or mutations on its own authority — operator-command paths stay behind their own gates. Advice is a board/notification surface, not a control channel.
- Not board-joined ⇒ `agent` mode degrades to `self` with a one-line notice.

## 4. Cross-vendor portability

The discipline is vendor-neutral; only the constants move. The registry carries per-vendor rows (opt-in vs automatic, multipliers, TTLs, minimums, storage-rent models) and per-harness invalidator/keeper lists, each with a `confirmedBy` URL and single-source marks where second-source confirmation is still pending. When binding a lane on another vendor, read that vendor's row — e.g. an hourly-storage explicit cache changes the break-even from "reads per TTL" to "reads per hour", which flips some caching decisions entirely.

## 5. Composition

- **§5.1 `/subscaler`** — tier composition already carries the two cache rules this skill generalizes (model switch = cache loss; effort is a caching decision). Tier routing decides *who* runs a lane; this skill prices *what the lane's spawn does to the cache*.
- **§5.2 `/superscalar`** — dispatch aggressiveness opens lanes; each lane's cache accounting comes from §2.4 here.
- **§5.3 `/ooo`** — a parked item resumed later re-enters a still-warm prefix if the queue kept running (the scoreboard's bypass is also a cache strategy: stalling lets the TTL clock run down with nothing read).
- **§4 speculation** — a squashed speculative slice wastes its own tokens but leaves the main prefix intact; cache cost is not a reason to avoid squashing a wrong branch.
