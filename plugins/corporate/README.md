# corporate — EstreGenesis plugin

Durable-role agent organization. Wraps [`Corporate.md`](../../Corporate.md) v0.1.0.

Where **Superscalar** decides how many lanes and at which tier (anonymous, one fan-out) and **Constellation** decides how agent processes talk, Corporate decides **who exists** — the *durable role*: a named seat that outlives any session or process, and can therefore accumulate practice, be addressed across time, own units, and give a decision an addressee. An anonymous lane can do none of those.

## What ships in v0.1.0

| Surface | What it is |
|---|---|
| `skills/corporate` | Stand up, inspect, or revise an organization: adoption threshold → four form axes → host inventory → **roles derived from the project's own practice record** → desks + lockers + charters → roster → chart declaration |
| `skills/corporate-status` | Resolve the toggle chain through the single resolver, then declare `CorporateChart` / `RoleState`. Reports absence as *unknown*, never as idle |
| `skills/corporate-sweep` | The eviction sweep — raises seats that no longer justify themselves to the human gate surface. **Required machinery for a dynamic organization** |
| `skills/corperate` | Pointer alias for the common misspelling |
| `resolve.cjs` | The **only** reader of the three toggle layers (role > group > organization), carrying the §5.4 identity invariant as an executable test |
| `harness-registry.json` | The perishable per-harness values, dated, with a per-row source requirement and a self-declared expiry |

0 npm dependencies. No MCP server in this cut.

## The identity invariant, and why it is a test

Corporate layers toggle resolution three deep. That could have been a breaking change to how every consumer reads `.agent/superscalar.json` and `.agent/subscaler.json` — so §5.4 requires that **with no roster present, resolution returns the organization layer verbatim**, making a non-adopting project bit-identical to one where this module does not exist.

That is checked, not asserted:

```
node plugins/corporate/resolve.cjs --selftest
```

The test builds fixtures in a temp directory (never the caller's project) and asserts identity as two independent properties against the *raw marker files* — nothing dropped or altered, nothing invented — plus the precedence chain, object-valued merge, and the rule that a `defaults` block never displaces a legacy marker.

Everyday use:

```
node plugins/corporate/resolve.cjs                    # organization layer
node plugins/corporate/resolve.cjs --role builder     # one seat, with provenance
node plugins/corporate/resolve.cjs --role builder --json
```

`provenance` names the winning layer per toggle, so a caller can explain *why* a value holds without reading a layer itself. **Nothing but this file reads a layer** — many layers, exactly one resolver.

## Two directories per seat

```
.agent/<role>/                      # public locker  (tracked)   — what the org and the user read
.agent/workertables/<role>/         # private desk   (gitignored) — the cwd the harness runs in
```

The desk holds the charter, the seat's own memory, and its session state; the locker holds deliverables and the record. The default sharing mechanism between seats is **write a document into the locker and pass the path** — high bandwidth, no message noise, diffable.

A desk does **not** span hosts. Cross-host coordination goes through the board or the wire, never a remote filesystem mount; the locker is the cross-host exchange over the ordinary version-control path.

## Eviction is not a footnote

The reason this module ships a sweep skill in its first cut: creation fires on a frequent signal (work arrives that no seat fits) while dissolution fires on a backward-looking one (nothing happened here for a while), and an unautomated backward-looking check does not run. Automating growth without automating shrinkage is a one-way ratchet. A **dynamic** organization must therefore have a scheduled sweep, human disposal on the gate surface, a declared seat ceiling, and a per-seat record of the signal that justified it.

The sweep raises candidates; a human disposes. Automatic creation with automatic destruction is a system that reorganizes itself while nobody is reading.

## When not to install this

Below all three adoption thresholds — duties recurring across sessions, resources that fund the seats at their cheapest residency, and a coordination need that outlives a session — a **Superscalar fan-out plus a board is cheaper** and does the same job. A single-developer project with one recurring duty wants a scribe, not an organization.

## Status

v0.1.0 is a design-draft cut: the vocabulary, boundaries, invariants, and wire declarations. The supervisor (process lifecycle, reclaim, allowlists), the org-chart rendering, bootstrap automation, and boot residency are **named prunable units** deferred to v0.2 — each is a candidate for replacement by a provider-native equivalent, and each can be removed without touching the spec sections above.

`harness-registry.json` currently carries every harness in `caveats` rather than in `harnesses`, because no invocation string in it has been confirmed verbatim against vendor documentation in this cut. A seat whose harness is unresolved can be **declared but not launched** — the honest failure is a refusal, not a guessed flag.

## Links

- Spec: [`Corporate.md`](../../Corporate.md)
- Wire contract: [`Constellation.md`](../../Constellation.md) §13.33
- Tier vocabulary: [`Superscalar.md`](../../Superscalar.md) §5.1
- License: Apache-2.0
