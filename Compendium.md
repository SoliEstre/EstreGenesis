<!-- module: Compendium; layer: vocabulary-substrate; part-of: EstreGenesis 3.0 (milestone); version: v0.2.0; date: 2026-06-15; status: v0.2.0 runtime foundation (v0.1 design draft + the first runtime increment — a 7-entry content store under compendium/ [5 glossary + 2 concept, owner_spec slugs reconciled to real headings] + plugins/compendium/lint.cjs implementing the §9.1 four gardening lints and the §9.2 pointer-resolution check as a verify-nway axis [owner_spec heading-slug grep-resolution + no-competing-full-def + redaction + broken-link]; the MCP runtime §10, dashboard surfaces §11, click-to-define components, and full ~25-term seeding remain deferred v0.2.x/v0.3 prunable units. The v0.1 baseline was a right-sized first cut — concept-anchored dual-register model + frontmatter schema + content-boundary charter [pointer-not-paraphrase, one-directional authority Compendium→spec] + ~25-term EG seed vocabulary catalog [exemplar entries authored inline, full seeding to follow] + 4 gardening lints + pointer-resolution check [verify-nway 13th axis form fixed]. Automatic promotion is reduced to the single gate 'count→queue Hyperbrief brief, human disposes' — hysteresis/debounce/flapping machinery is explicitly deferred to the v0.3 gate. a11y component detail, multi-tab split, dashboard runtime, and promotion-queuing overflow are deferred to v0.2+. The research narrative is delegated to the _proposals/ archive — this spec carries decisions only); depends-on: none (optional synergy: Constellation §6/§13 board surfaces + cross-link rendering; Hyperbrief §5.6 inline-gloss → click-to-define absorption; Greatpractice §7.7 retire-axis parallel for deprecation; Superscalar fan-out for spec-drafting/lint); license: Apache-2.0 -->

# Compendium — Concept-Anchored Dual-Register Vocabulary Substrate (v0.2.0 — runtime foundation)

> **EstreGenesis optional module — design draft v0.1.0.** Where Constellation governs *agent-to-agent communication*, Superscalar governs *dispatch within an agent*, Hyperbrief governs *decision-delegation back to the user*, and Greatpractice governs *the codification of recurring work*, Compendium governs the sixth axis — **a vocabulary substrate that organizes cross-cutting vocabulary into a concept-anchored dual-register model and casts one-directional pointers into the module specs**. Where the other five modules produce vocabulary *as a by-product of doing something else* (Constellation produces A2A intent names while moving messages, Hyperbrief produces the 9-section IR + L`a`.`b`.`c` tone vocabulary while gating decisions), Compendium is the only module whose *output is the vocabulary substrate itself* — "zero code, pure vocabulary/decomposition".
>
> **Owns nothing normative.** Every glossary entry and concept page in Compendium is a *pointer* that resolves into the module spec that *owns* the term (Constellation / Superscalar / Hyperbrief / Greatpractice / Ultrasafe = SSoT). There is exactly one exception — general-register vocabulary that *no module owns* (owner_spec=null). For that alone, Compendium is the legitimate SSoT of the full definition (the general half of the dual glossary exists precisely for this purpose). Compendium's authority is *one-directional* — the spec never depends on Compendium being correct (§2).
>
> **The purest expression of north-star axis-2.** What gets absorbed into the substrate is the *category* (a curated, cross-linked, dual-register agent-coordination glossary), not the runtime — which is why a module that decomposes, names, and inter-relates vocabulary outlives the runtime that produced it. At the same time it is the relocation home for axis-3 (eviction as first-class) — deprecated vocabulary is not silently dropped but relocated here as `status: superseded` + a `superseded_by` redirect. And this module *models its own eviction* (§12.4) — a module that puts eviction forward as its product, if it fails to model its own eviction, becomes the very "standard that cannot prune" the north-star warns against.
>
> **Right-sized.** v0.1 ships only *what is cheap and durable* — the model, the charter, the seed exemplars, the lints. The expensive runtime (promotion automation, a11y components, multi-tab split, dashboard surfaces) is deferred to v0.2+ as *named prunable units* (§13). Because the normative surface it owns is thin, the spec is thin too — this is a self-consistency requirement of a pointer-layer module.
>
> **Self-sufficient.** This file is the SSoT. Everything an adopter needs to build a Compendium-conformant vocabulary substrate is in this document. The reference implementation in `plugins/compendium/` is a runtime adapter for the Claude Code harness — other harnesses can adopt this spec directly.
>
> _Terminology note_: "concept" (a single register-neutral meaning node — the unit of an entry), "register" (the audience axis of expert/internal vs plain/general), "term" (a surface word mapped to a concept), "gloss" (a paraphrase of one definition tuned to an audience — not a rival definition), "internal-register" (jargon owned by EG/the project — pointer-only), "general-register" (a general word that no module owns — Compendium is the full-definition SSoT), "pointer" (a one-directionally resolvable link to `owner_spec`) are used consistently within this document.

---

## Table of Contents

- [§1. Concept — What Compendium Is](#1-concept--what-compendium-is)
- [§2. Content Boundary — the pointer-not-paraphrase charter](#2-content-boundary--the-pointer-not-paraphrase-charter)
- [§3. Wiki Architecture — atomic markdown + immutable id + computed MOC](#3-wiki-architecture--atomic-markdown--immutable-id--computed-moc)
- [§4. Entry Schema — frontmatter as governance SSoT](#4-entry-schema--frontmatter-as-governance-ssot)
- [§5. Dual-Register Glossary — concept-anchored model](#5-dual-register-glossary--concept-anchored-model)
- [§6. Definition-Quality Gate](#6-definition-quality-gate)
- [§7. Promotion — count→queue, human disposes](#7-promotion--countqueue-human-disposes)
- [§8. Cross-Link & Click-to-Define — v0.1 invariants only](#8-cross-link--click-to-define--v01-invariants-only)
- [§9. Gardening Lints — 4 lint + pointer-resolution (verify-nway 13th axis)](#9-gardening-lints--4-lint--pointer-resolution-verify-nway-13th-axis)
- [§10. MCP Surface](#10-mcp-surface)
- [§11. Constellation Board Surfaces](#11-constellation-board-surfaces)
- [§12. Deprecation, Eviction & Self-Eviction](#12-deprecation-eviction--self-eviction)
- [§13. v0.1.0 Cut Scope — the prunable-unit list](#13-v010-cut-scope--the-prunable-unit-list)
- [§14. Adoption Thresholds](#14-adoption-thresholds)
- [§15. Interactions](#15-interactions)
- [§16. Implementation Notes + Split Storage](#16-implementation-notes--split-storage)
- [Appendix A. EG Seed Vocabulary Catalog — exemplar entries](#appendix-a-eg-seed-vocabulary-catalog--exemplar-entries)
- [Appendix B. Self-Application — this spec as a Compendium entry](#appendix-b-self-application--this-spec-as-a-compendium-entry)

---

## §1. Concept — What Compendium Is

> Compendium is *not* a second memory store, *not* a documentation restatement, *not* a tab in Constellation, and *not* an SSoT. It is the cross-cutting **Reference + Explanation layer** (Diátaxis) that the agent maintains — (1) a markdown wiki of cross-module concept pages, (2) a concept-anchored dual-register glossary, and (3) a cross-link/click-to-define system that linkifies known terms in live-dashboard / decision · review bodies. This § defines that identity and forecloses four common misreadings.

### §1.1 Four common misreadings and the actual identity

| Misreading | Actual identity |
|---|---|
| (a) **"a second memory store"** — an extension of `memory/feedback_*.md` | Compendium is not *the capture of experiential signal* (memory's job) but *the curation of settled cross-cutting vocabulary*. Memory is a one-shot, chronological, private operational signal; Compendium is a cross-linked index of controlled vocabulary. The input source merely overlaps — the output differs (§2.2 redaction gate). |
| (b) **"a documentation restatement"** — a summary copy of the 5 specs | Compendium does *not restate* spec content. An internal-register entry carries only *a one-line orientation gloss + an owner_spec pointer* — a normative restatement would create a second SSoT and drift (§2.3). Pointer-not-paraphrase is the core of the charter. |
| (c) **"a tab in Constellation"** — one dashboard feature | Compendium is a *distinct sixth module* — it owns the content store + MCP + lints. Constellation provides only *the board surfaces* (exactly the Superscalar §6 precedent). The module owns the logic, Constellation the scoreboard (§11). |
| (d) **"yet another SSoT"** — the authority source for term definitions | Compendium is a *source of information*, not a *source of truth*. Authority is one-directional (Compendium→spec). The sole exception = general-register (owner_spec=null) — for that alone Compendium is the full-definition SSoT (no spec competes, zero conflict). |

In short, Compendium = **"navigates and synthesizes the 5 specs without restating their normative content — a source of information, not a source of truth."** This one-line charter aligns every design choice in §2.

### §1.2 What it uniquely owns (and what it does not)

**What Compendium uniquely owns** (found nowhere else):

1. **the dual-register glossary as controlled vocabulary** — an internal-register entry = a one-line orientation gloss + an owner_spec pointer (e.g. "ack tier → `Constellation.md` §13.13"); a general-register entry = a full definition (owned by no spec).
2. **cross-module relation/wiki pages** — Explanation-tier connective tissue for module *seams* (how Hyperbrief §3 gates Superscalar retire; how Ultrasafe emits a Greatpractice tree candidate; how all of these ride the Constellation A2A bus) — content with no single module home.
3. **orientation/index surfaces** — term→spec lookup, module-at-a-glance, reverse cross-module integration index.
4. **thin "what is…" concept primers** — one paragraph, ending in a pointer.
5. **click-to-define rendering of L2.2.2 glosses** (§8).
6. **deprecated-vocabulary redirects** — the eviction relocation home (§12).

**What Compendium never holds** (a copy that rots): a restated algorithm, schema, score formula, §-numbered normative rule, A2A intent payload shape, or copied version stamp. (The v2.5.108 docs-meta version-drift bug is exactly the failure that an undisciplined Compendium would amplify — Compendium says "for the current version, see the module frontmatter" and *never writes down a copied number*.)

---

## §2. Content Boundary — the pointer-not-paraphrase charter

> The boundary is drawn by *subtraction* — the 5 module specs remain the SSoT of each term's normative definition, and Compendium is the cross-cutting index/glossary/wiki that *points back* to them. This § states the four no-duplication rules + the redaction gate as a *correctness requirement* (not an aspiration).

### §2.1 One-directional authority — Compendium→spec

- **one-directional authority**: Compendium→spec. The spec *never depends* on Compendium being correct. Delete the entire Compendium folder and the spec is unharmed — the content layer is cleanly evictable (§12.4).
- **pointer not paraphrase**: anything normative is a *link* — the link is load-bearing. If an internal-register entry restates the owner_spec definition, that becomes a second SSoT that drifts.
- **general-register exception**: only owner_spec=null terms have Compendium hold the full definition — since no spec competes, conflict is zero. Automatic promotion (§7) also applies only to general-register (internal entries are authored by the owning module spec).
- **eviction-first**: when a spec absorbs content Compendium was holding, or a term is renamed, the entry is retired/redirected (`status: superseded` + alias) — never left as a stale copy.

### §2.2 Redaction gate — blocking conversation→public-glossary leakage (a correctness requirement)

READing conversations for frequency signal is permitted (term_frequency_scan, §10). But when a collected term becomes a *public-repo entry*, it must pass the *same redaction gate as any public commit* (AGENTS.md §5.7). This is not a fork but a correctness requirement:

- the scan *may READ* a conversation *for frequency signal*.
- when a harvested term *enters a public-repo entry* = zero verbatim chat quotation + zero governance/decision-source attribution (same discipline as §5.7).
- project-private internal entries reside in the adopter workspace (outer) — they do not enter the public repo (§16 split storage).
- this gate applies at every hop of the data-flow from a term_frequency_scan result to entry authoring. A candidate whose provenance.source is conversation is blocked from public upsert without a redaction-pass marker (§9 lint).

### §2.3 Standards are inspiration, not a conformance target

ISO 1087 / ISO 704 / TBX-TMF / SKOS are cited only as inspiration sources for the concept-anchoring *idea* (one concept, register-tagged term/gloss) — they are **not a conformance target**. Binding four terminology-management ISO standards normatively to a ~25-entry agent glossary is an altitude mismatch (a self-application of the Confluence-overkill lesson). Accordingly, v0.1 **drops** the SKOS relation hierarchy (`broader`/`narrower`/`related`) + the `genus_id` circularity-check — a 25-node graph needs no formal subsumption hierarchy or circularity detection. Only the concept-anchoring decision is borrowed; the standards-conformance obligation is zero.

---

## §3. Wiki Architecture — atomic markdown + immutable id + computed MOC

> An atomic-note + computed-MOC + lint pattern (Karpathy LLM-wiki / Obsidian MOC / TiddlyWiki — precedents suited to a small agent-maintained markdown KB). Neither an enforced page tree (Confluence — the wrong altitude) nor freeform blocks (Notion — maximum rot).

### §3.1 Entry/page model — strong decisions (kept)

- **1 markdown file = 1 concept/page**, under `compendium/`. Same physical format as the existing `memory/*.md` (YAML frontmatter + body).
- **immutable opaque id = link anchor**: a `[[id]]` link binds to an *immutable opaque slug* — not the title/path. The id is never changed, reused, or deleted → rename-safety. The title is mutable and is never a link target.
- **backlinks are COMPUTED, never stored**: who references an id is computed by file scan — since it is not stored, it cannot drift.
- **aliases-as-field**: collapse the MediaWiki redirect page into a frontmatter `aliases:` field — structurally eliminating the double-redirect/broken-redirect bug class.
- **computed MOC**: `compendium/INDEX.md` is a *computed* MOC regenerated from frontmatter — not hand-maintained (the sole rot risk of the current `MEMORY.md` setup). An append-only `compendium/log.md` records ops (`## [YYYY-MM-DD] op | title`).

### §3.2 Namespaces — coarse ~4 types

The `type` frontmatter splits a coarse namespace (no hierarchical category tree — a single registry of a flat controlled tag vocabulary):

| type | role |
|---|---|
| `concept` | cross-module wiki page |
| `glossary` | dual-register entry |
| `index` | computed MOC |
| `runbook` | procedure page (optional) |

`register_class` (internal vs general) splits the glossary; `type` splits wiki vs glossary vs index.

---

## §4. Entry Schema — frontmatter as governance SSoT

> Frontmatter is the governance SSoT. v0.1 keeps it *thin* — befitting a pointer-layer module, the schema is thin too. The following is the normative definition of the ConceptEntry frontmatter.

### §4.1 ConceptEntry frontmatter (v0.1)

```yaml
id: <stable opaque slug>        # immutable — never change/reuse/delete. link + rename-safety anchor
title: <human-facing label>      # mutable. never a link target
type: concept | glossary | index | runbook
register_class: internal | general
  # internal = EG/project-owned jargon (pointer-only)
  # general  = owned by no module (Compendium is the full-definition SSoT)
owner_spec: <file>#<heading-slug> | null
  # machine-checkable pointer (§9.2). null = general-register only
subject_field: [a2a, scheduling, decision, codification, safety, ...]
status: active | candidate | superseded | archived
superseded_by: <id> | null       # skos:replacedBy — eviction first-class
aliases: [...]                    # collapse the redirect page into a field (eliminates a bug class)
definition:
  text: <ONE intensional genus+differentia, substitution-test-passing>
  # internal-register: one-line orientation gloss (owner_spec pointer is load-bearing)
  # general-register : full definition (owned by no spec)
glosses:
  - { register: expert | plain, text: <audience-tuned PARAPHRASE of the one definition> }
  # no rival definition — register is presentation over a single concept
terms:
  - { text: <surface word>, register: expert | plain | colloquial,
      role: preferred | admitted | hidden_search_only,
      provenance: { source, first_seen, occurrence_count, distinct_sources } }
  # role: hidden_search_only = MATCH messy input (jargon/abbrev/deprecated) without surfacing it
links: [<id>...]                  # outbound [[id]] mirror (for lint). backlinks are COMPUTED
audit: { created, updated, last_reviewed }
```

### §4.2 Key commitments (drift-trap defenses)

1. **register is a property of the TERM and the GLOSS** — *never* a property of the concept/canonical definition. Forking the definition per register is the #1 trap (register silently drifts into two concepts). The expert↔plain mapping is *implicit* inside the shared concept — not stored as a brittle term-A↔term-B link.
2. **`role: hidden_search_only`** (SKOS hiddenLabel) — the agent MATCHes messy jargon/abbrev/deprecated forms in the input without surfacing them.
3. **internal vs general asymmetry**: an internal-register entry's `definition.text` is a one-line gloss + owner_spec pointer (zero normative restatement); general-register carries a full definition (owned by no spec).
4. **deprecation first-class**: `status` + `superseded_by` — at both the concept and term levels, not deletion.

> _Deferred_: provenance's `confidence`, `term_type` (fullForm/acronym/abbrev), `relations{broader,narrower,related}`, and `genus_id` are **dropped** in v0.1 (§2.3 — 25 nodes need no formal hierarchy). Backfill in v0.2 if dogfooding shows a need.

---

## §5. Dual-Register Glossary — concept-anchored model

> The single most load-bearing decision — the glossary is *concept-anchored*, not *word-anchored*. One concept node carries one register-neutral canonical definition + register-tagged terms + register-tagged glosses. The expert↔plain mapping is implicit inside the shared `id`, not stored as a brittle term link.

### §5.1 The model

- **one concept = one definition** + per-audience paraphrases (glosses). A gloss is *not a rival definition* but a presentation over the one definition.
- **internal-register** (register_class=internal, owner_spec≠null): definition.text = a one-line orientation gloss, with the owner_spec pointer as the canonical source. Compendium does *not hold* the full definition (pointer-only). Entry is authored by the owning module spec (not a target for automatic promotion — §7).
- **general-register** (register_class=general, owner_spec=null): definition.text = the full definition. Compendium is the legitimate SSoT (no spec competes). This is the *only* half to which automatic promotion (§7) applies.

### §5.2 Absorbing the L2.2.2 convention

Hyperbrief's inline-gloss convention is *elevated* from *re-rendered parentheses* to a *click-to-define glossary lookup* — the parenthetical text `term(short description)` is preserved as a *data source* but detached from the reading line (restoring reading flow) and replaced with a styled term + on-demand reveal. The render invariants are in §8.

---

## §6. Definition-Quality Gate

> The mechanical check that runs when a general-register full definition is upserted (ISO 704 *inspiration*, not conformance — §2.3). An internal-register entry holds no definition, so it is exempt from the substitution/genus check; instead it must pass owner_spec pointer resolution (§9.2).

| Check | Rule |
|---|---|
| **substitution** | The definition can substitute for the definiendum in a sentence (intensional genus+differentia). |
| **single-concept** | A term does not resolve into multiple concept clusters (the polysemy trap — the same signal as promotion's mono-sense gate). |
| **part-of-speech** | The definition is the same part of speech as the definiendum. |
| **no-competing-full-def** (internal-register) | An internal entry carries no full definition that competes with the owner_spec definition (enforced by the §9.2 13th axis). |

> _Deferred_: the `genus_id` circularity-check is dropped in v0.1 (§2.3).

---

## §7. Promotion — count→queue, human disposes

> *How* a general-register term is promoted from a harvested candidate to a canonical entry. The v0.1 answer is **a single sentence** — frequency proposes, human disposes. Not an elaborate control loop.

### §7.1 The v0.1 promotion rule (in full)

```
occurrence_count ≥ N  AND  distinct_sources ≥ S  AND  mono-sense
  → queue a Hyperbrief brief to the Constellation decisions panel
  → a human disposes (approve → canonical upsert / reject → keep as candidate)
```

That's it. `distinct_sources ≥ S` defends against single-prolific-source skew. mono-sense defends against the polysemy trap. No other machinery. A candidate with provenance.source=conversation must pass the redaction gate (§2.2) before queuing.

Defaults (corpus-scaled, tunable): N=10, S≥3. **But, stated honestly** — at EG's actual scale (~25 active terms) this gate *almost never fires*. In a solo-operated project it is rare for one term to be used 10+ times across 3+ distinct sources — single-digit promotions per year, or zero. So at EG scale **promotion is effectively human-queued**, and the automation is dead code until dogfood evidence justifies it.

### §7.2 Explicitly deferred to the v0.3 gate (a prunable unit)

The following are explicitly deferred to the **v0.3 gate**, conditional on "if dogfooding shows the promotion volume justifies automation":

- Stage-0 normalization (case/whitespace/morphology fold)
- hysteresis dead-band (T_demote = 0.5·T_promote) + Azure-style flapping pre-check
- 30-day × D-period debounce + cool-down window
- tiered auto-vs-review split (N ≥ 2·T_promote auto-promotes)
- reversible alias↔master demotion object

This 6-stage machine solves high-frequency oscillation (oscillation under load), a problem that is *structurally impossible* at this corpus's velocity. Wholesale-importing a distributed-systems anti-flapping control loop into a single-operator markdown glossary was the primary over-design. v0.1 is count→queue only, with automation only when measured promotion volume justifies it — and *stated so explicitly to make it prunable* (a by-construction satisfaction of the axis-3 eviction discipline).

### §7.3 Internal-register is not a frequency-promotion target

Internal-register terms do *not ride* the frequency pipeline. The owning module spec carries the owner_spec pointer when they enter (authored). Auto-promoting an internal term by frequency risks fabricating a glossary definition that competes with the owning spec — exactly the SSoT-drift the boundary forbids (§2.1).

---

## §8. Cross-Link & Click-to-Define — v0.1 invariants only

> The click-to-define runtime is deferred to v0.2 (§13). The v0.1 spec nails down only *one load-bearing invariant* + *one principle* — the component detail (the WCAG 1.4.13 trio, role mapping, bottom-sheet, dwell-delay, focus management, throttling) belongs to the v0.2 runtime cut. Front-loading it now would bloat the spec and drift from the actual dashboard implementation.

### §8.1 Invariant (load-bearing — nailed down in v0.1)

**A post-escape DOM pass, never raw-HTML injection.** A decision/review detail is rendered only via escaped-text + `\n→<br>` (no raw HTML). So linkification must be a *post-escape DOM pass over the rendered text nodes*, and raw-HTML injection is never allowed — it respects the real v2.5.104 XSS boundary `esc()`. Violating this invariant is an XSS regression.

### §8.2 Principle (single a11y principle — nailed down in v0.1)

**The tooltip-vs-dialog distinction.** A text-only gloss = tooltip semantics (`role=tooltip` + `aria-describedby`). A gloss that *contains* a cross-link = dialog/disclosure (`aria-haspopup=dialog`), and `role=tooltip` is never allowed — a tooltip cannot contain focusable content. This is the single load-bearing a11y distinction. The remaining component detail is v0.2.

### §8.3 Throttle principle

Linkify only the first occurrence per section, de-emphasize repeats — avoiding a sea-of-links. (Implementation is v0.2.)

---

## §9. Gardening Lints — 4 lint + pointer-resolution (verify-nway 13th axis)

> Gardening lints modeled on the defense-in-depth of verify-nway-version.cjs. This § nails down the *form* of the 4 lints + pointer-resolution in v0.1 (implementation may ride along with the v0.2 runtime; the form is fixed now).

### §9.1 The 4 gardening lints

| lint | check |
|---|---|
| **broken-link** | Whether `[[id]]` resolves to an existing entry id. |
| **orphan** | Zero inbound + not an index → orphan. |
| **duplicate-concept** | Two active entries that share a tag-set and contradict each other. |
| **stale** | Active but whose `updated` lags behind a superseding note. |

### §9.2 Pointer-resolution — verify-nway 13th axis (form nailed down)

The 13th verify-nway axis asserts that *every owner_spec pointer resolves to a real section, and no internal-register entry carries a competing full definition*. The mechanism, made explicit:

1. **machine-checkable pointer form**: owner_spec is of the form `<file>#<heading-slug>` (e.g. `Constellation.md#1313-key-rotation`). Not a prose anchor (`§13.13`) but a greppable heading slug.
2. **resolution check**: the axis greps the target file for that heading slug to confirm *the heading actually exists*. A miss = lint fail.
3. **no-competing-full-def check**: if a register_class=internal entry carries a full definition exceeding a one-line gloss (a substitution-test-passing genus+differentia), it fails — this is where the drift risk of a second SSoT lives.
4. **redaction check**: if a public entry with provenance.source=conversation exists without a redaction-pass marker, it fails (the lint enforcement of the §2.2 gate).

> The heading-slug form is nailed down in v0.1, but the axis's *implementation* (added to verify-nway-version.cjs) may ride along with the v0.2 runtime — since the form is fixed, the implementation cannot drift.

---

## §10. MCP Surface

> A greenfield standalone MCP — there is no existing 'project-content MCP' to extend (the roadmap's phrasing is aspirational; greenfield is accurate). It inherits the MCP discipline of Constellation §8 (single-line JSON, pre-send probe, etc.). v0.1 defines the tool *signatures*; the runtime is v0.2.

| Tool | Role |
|---|---|
| `wiki_read(slug)` | Fetch a wiki page / glossary entry (MD + frontmatter). |
| `wiki_search(query)` | Full-text/alias/hidden-label search (matches hidden_search_only labels — messy-input recall). |
| `wiki_upsert(slug, body, frontmatter)` | Author/update an entry (the agent also authors). Validate frontmatter + the §6 definition-quality gate + the §2.2 redaction gate. |
| `term_define(term, register?)` | term→concept definition + register-targeted gloss (click-to-define backend; register choice expert\|plain, neutral-definition fallback). |
| `term_frequency_scan(scope)` | General-register frequency + distinct_sources count (promotion signal; scope=conversation\|docs\|board\|review). **conversation scope is READ-only — entry authoring follows passage of the §2.2 redaction gate.** |
| `term_promote(term)` | Run the §7.1 count→queue gate → queue a Hyperbrief brief to the decisions panel. (The v0.3 automation stages are not included.) |
| `compendium_backlinks(id)` | Compute inbound references (never stored, always derived). |
| `compendium_lint(scope?)` | Run the 4 lints + pointer-resolution of §9. |

---

## §11. Constellation Board Surfaces

> Compendium owns the content store + MCP + lints, and Constellation provides only *the board surfaces* — the Superscalar §6 precedent ("the module owns the logic, Constellation optionally visualizes the scoreboard"). v0.1 records only *what goes into which slot* — the render runtime is v0.2.

| Surface | Deferred? | Notes |
|---|---|---|
| **Wiki tab** | Surface reserved (recorded in v0.1) / render v0.2 | The existing bottom fixed tab bar `[Dashboard / Review / (wiki=#4 slot) / Live]` — the v2.4.31 mobile restructure already *reserved the #4 slot* ("(wiki=#4 slot)" is literally the Compendium position). |
| **cross-link side panel** | v0.2 | A non-modal complementary landmark. Post-escape linkify over scanned body text nodes (the §8.1 invariant). |
| **multi-tab simultaneous display (split)** | **v0.2 deferred (prunable)** | Plans to reuse the v2.4.36 container-parameterized renderer (`wsRenderStreamInto(container)` + `wsComputeGroups`). Not included in v0.1. |
| **click-to-define (L2.2.2 sourced)** | v0.2 | Only the §8 invariant + principle in v0.1; the components are v0.2. |

---

## §12. Deprecation, Eviction & Self-Eviction

> Compendium is the relocation home for deprecated vocabulary (axis-3 eviction as first-class) and *also models its own eviction*. A module that puts eviction forward as its product, if it fails to model its own eviction, becomes the very "standard that cannot prune" the north-star warns against.

### §12.1 Term eviction (the relocation home)

- On term rename / spec absorption: redirect the entry with `status: superseded` + `superseded_by: <id>`, and add the old surface to `aliases:`. Never a silent drop.
- archived: no longer active but preserved for backward-compat lookup (`status: archived`).
- Isomorphic with the Greatpractice §7.7 retire-axis — the 3-state active/superseded/archived.

### §12.2 Self-eviction — when does Compendium retire

When a provider-native glossary/cross-link substrate *absorbs the category* (when the agent default provides cross-module vocabulary lookup + click-to-define natively):

1. **migrate the content layer**: migrate the markdown entries + 4 lints of `compendium/` to the native surface — since the entries are merely markdown pointers, they move cleanly. Thanks to one-directional authority (§2.1), the spec is unharmed.
2. **the bespoke spec prunes first**: this Compendium.md spec + the MCP runtime are the *first pruning target*. The vocabulary (the vocabulary + concept-anchored model) survives; the runtime/spec is evicted.
3. **prune order**: content (preserve · migrate) → lints (preserve · migrate) → MCP runtime (evict) → spec (evict). Exactly as axis-2 predicted, "the candidate the provider-native version replaces first" = the runtime, and the most durable value = the decomposition/naming.

This is how Compendium passes its own thesis — the content layer is clean-evictable (markdown pointers, deleting the folder leaves the spec unharmed), and the spec/machinery carry an explicit sunset path.

---

## §13. v0.1.0 Cut Scope — the prunable-unit list

> v0.1 ships only *what is cheap and durable*. The expensive runtime is deferred as *named prunable units* — since each deferred block is an evictable unit, it satisfies axis-3 eviction by construction. v0.1 vs deferred, as an explicit list.

### §13.1 In scope — v0.1.0 ship surface

**Spec body** (`EstreGenesis/Compendium.md`):

- §1-§16 + Appendices A-B.
- ① the concept-anchored dual-register model + frontmatter schema (§4-§5).
- ② the content-boundary charter — pointer-not-paraphrase, one-directional authority Compendium→spec, redaction gate (§2).
- ③ the EG seed vocabulary catalog (~25 items — representative exemplars actually authored in Appendix A to demonstrate the model; full seeding to follow).
- ④ the 4 gardening lints + pointer-resolution check form — the verify-nway 13th axis form nailed down (§9).

**Plugin manifest** (`EstreGenesis/plugins/compendium/`):

- `.claude-plugin/plugin.json` — name=compendium, version=0.1.0, depends-on stated (none required, optional synergy).
- MCP tool signatures (§10) defined. (Runtime implementation is v0.2.)

**N-way sync registration** (AGENTS.md §5.8 + verify-nway-version.cjs):

- Add the Compendium module-version row. README "5 optional modules"/"five"→6, add a docs/index.html card, add marketplace.json plugins[].

### §13.2 Deferred — prunable units (named)

| prunable unit | deferred to | reason |
|---|---|---|
| **promotion-automation stages** (hysteresis/debounce/flapping/tiered split/alias↔master) | **v0.3 gate** | Only when dogfooding shows the promotion volume justifies automation. At EG scale it almost never fires (§7.2). |
| **the full click-to-define a11y components** (WCAG 1.4.13 trio · role-mapping detail · bottom-sheet · dwell-delay · focus management) | **v0.2** | v0.1 has only invariant 1 + principle 1 (§8). The components are a runtime cut. |
| **multi-tab split** (wsRenderStreamInto multi-container) | **v0.2** | Reuses the v2.4.36 renderer — a runtime surface (§11). |
| **dashboard runtime** (wiki-tab render · cross-link side-panel render) | **v0.2** | Only the surface slot is recorded in v0.1; the render is a runtime cut. |
| **MCP runtime implementation** | **v0.2** | Signatures are v0.1 (§10), implementation is a runtime cut. |
| **jargon-dict-tech.json (general-register seed)** | **a separate follow-on** | Gated on the blocked v0.7 entry-condition (external consensus OR 1+ adopter contribution), not yet present. *Excluded* from the v0.1 deliverable. The dictionary-building methodology is a separate sub-project (§16.3). |
| **SKOS relations hierarchy + genus_id circularity** | **v0.2 (if needed)** | 25 nodes need no formal subsumption (§2.3). If dogfooding shows a need. |
| **research narrative** (the 5-dimension "precedent synthesis", etc.) | **delegated to the _proposals/ archive** | The spec carries decisions only (§16.4). |

### §13.3 v0.1 DONE definition (deterministic — cut-closure discipline)

v0.1 is DONE when all of the following are met:

1. The §1-§16 + Appendix A-B body exists with zero open forks.
2. Appendix A has the ~25 EG seed-term model + ≥4 exemplar entries actually authored (a model demonstration).
3. plugin.json (version=0.1.0) + the MCP tool signatures defined.
4. N-way sync: README/docs/marketplace 5→6 + the Compendium module-version axis added to verify-nway-version.cjs (the *form* of the 13th pointer-resolution axis is fixed in this spec, the *implementation* rides along in v0.2).
5. verify-nway-version.cjs all-axes PASS.

v0.2 (runtime) ships the MCP server + dashboard surfaces + lint implementation + 13th-axis implementation + click-to-define components.

---

## §14. Adoption Thresholds

> Compendium is *not a universal module recommended for every workspace*. Adopt it only when cross-cutting vocabulary has accumulated enough to make cross-surface drift cost real — not on day 1 (isomorphic with the Greatpractice §10 / Superscalar thresholds).

### §14.1 When to adopt (all must hold)

- **(a)** ≥ 2 module specs / large surfaces overlap, or nomenclature is ambiguous (same-word-different-meaning OR different-word-same-concept) — the controlled-vocabulary problem is real.
- **(b)** ≥ ~25 cross-referenced concept/jargon terms are in active circulation — below this, a hand-maintained MEMORY.md-style MOC suffices (Compendium's governance overhead exceeds the corpus — the Confluence-overkill lesson).
- **(c)** there is a live dashboard (Constellation) where readers meet terms outside the spec context — the value of click-to-define.
- **(d)** recurring evidence of vocabulary drift (rename, inconsistent restatement, stale entries).

### §14.2 Negative ROI (do not adopt)

A single-doc project, a solo 1-cycle task, no live board, vocabulary stable and small — in these cases the existing inline L2.2.2 parentheses + a flat MEMORY.md index are the answer, and Compendium is over-engineering.

### §14.3 EG eligibility

EG qualifies: 5 module specs (~8,500 spec lines) + dense cross-module vocabulary + a live Constellation board + documented rename events (channel-unification → routing-by-direction; synthesize → reconvergence-mode). EG is the dictionary's 1st-adopter (though jargon-dict-tech.json itself is a separate follow-on, §13.2).

---

## §15. Interactions

> Compendium has an *absorption/parallel* relationship with adjacent modules. Only the boundary of each relationship is stated — detailed integration is v0.2 runtime.

- **Hyperbrief**: absorbs the §5.6 inline-gloss convention into click-to-define (§5.2). A promotion brief is queued to the decisions panel in the Hyperbrief IR form (§7.1).
- **Greatpractice**: deprecation is isomorphic with the §7.7 retire-axis (active/superseded/archived) (§12.1). Codification and vocabulary are distinct axes — Greatpractice is *procedure*, Compendium is *vocabulary*.
- **Superscalar**: parallelizes spec-drafting / lint via fan-out (optional synergy).
- **Constellation**: provides the §6/§13 board surfaces (§11). Delivers promotion briefs over the A2A bus. Content/MCP/lints are Compendium-owned; only the surfaces are Constellation's.
- **Ultrasafe**: one source for the cross-module seam pages (a seam such as Ultrasafe → Greatpractice tree candidate) (§1.2-2).

---

## §16. Implementation Notes + Split Storage

> The plugin = an optional adapter — adopting the spec alone is also valid. This § states the content-store layout + the split-storage decision + N-way sync registration + the dictionary follow-on separation.

### §16.1 Content store layout

```
compendium/
  INDEX.md            # computed MOC (regenerated from frontmatter, no hand-maintenance)
  log.md              # append-only op log (## [YYYY-MM-DD] op | title)
  glossary/           # type: glossary entry (internal + general)
  concept/            # type: concept (cross-module wiki page)
  runbook/            # type: runbook (optional)
plugins/compendium/
  .claude-plugin/plugin.json   # name=compendium, version=0.1.0
  mcp/                # MCP tools (signatures v0.1, runtime v0.2)
```

### §16.2 Split-storage decision (not an open fork — settled)

Physical residence is *split*:

- **inner public repo** (`/EstreGenesis/`): the Compendium.md spec, the reference plugin/MCP, the *general (framework) vocabulary seed*, and *EG's non-sensitive module vocabulary* (general-register + non-sensitive internal). Dogfood evidence + reuse patterns.
- **adopter workspace (outer/private)**: project-private internal entries. The adopter supplies its own dictionary (the Hyperbrief term_pairing placeholder pattern). EG's project-private internal vocabulary lives in the outer.

This is a direct consequence of the §5.7 public-repo redaction discipline + the §2.2 redaction gate — not a fork but a correctness requirement.

### §16.3 Dictionary follow-on separation

jargon-dict-tech.json (the general-register tech-jargon dictionary) is **excluded** from the v0.1 deliverable — a not-yet-present artifact gated on the blocked v0.7 entry-condition (external-source consensus OR 1+ adopter domain-vocabulary contribution). Building the dictionary (sourcing / license / schema / seeding corpus) is itself a separate sub-project. v0.1 runs *without* the dictionary — the EG seed terms are hand-authored in Appendix A.

### §16.4 Research-narrative delegation

The research sources of this spec drafting (the deep-research synthesis + adversarial critique + precedent synthesis) are *not carried in the spec body* — they are delegated to the inner `_proposals/` archive. The spec carries *decisions only*.

### §16.5 N-way sync registration (AGENTS.md §5.8)

| Surface | sync discipline |
|---|---|
| Compendium module version | `Compendium.md` frontmatter · `plugins/compendium/.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` plugins[] · `docs/index.html` card module-tag | bump all in the same cut |
| EG module count | README badge "5→6" / "five→six" · `docs/index.html` card added · `docs/shared/data.js` meta | same commit |

---

## Appendix A. EG Seed Vocabulary Catalog — exemplar entries

> This appendix demonstrates the §4-§5 model with a catalog of ~25 EG cross-module vocabulary items + the *actual authoring* of representative exemplar entries. Full seeding is a follow-on (v0.1 is the model demonstration + ≥4 exemplars). The exemplars demonstrate both internal-register (pointer-only) and general-register (full def).

### A.1 ~25-item catalog (per-module term family)

| # | term | register | owner_spec (heading-slug) | subject_field |
|---|---|---|---|---|
| 1 | ack tier | internal | `Constellation.md#3-key-management` | a2a |
| 2 | A2A intent family | internal | `Constellation.md#1316-a2a-intent-families` | a2a |
| 3 | routing by direction | internal | `Constellation.md#self-board-vs-hub-board` | a2a |
| 4 | pre-send probe | internal | `Constellation.md#1316-cycle-end-probe` | a2a |
| 5 | collab key (ck-) | internal | `Constellation.md#2-a2a-bridge-interface` | a2a |
| 6 | board worker | internal | `Constellation.md#1323-backend-registry` | orchestration |
| 7 | deadlock resolution | internal | `Constellation.md#1319-deadlock-resolution` | orchestration |
| 8 | blocker tracking | internal | `Constellation.md#1320-blocker-tracking` | orchestration |
| 9 | issue width | internal | `Superscalar.md#issue-width` | scheduling |
| 10 | divergence-reconvergence | internal | `Superscalar.md#reconvergence-mode` | scheduling |
| 11 | speculation gate | internal | `Superscalar.md#speculation` | scheduling |
| 12 | 9-section IR | internal | `Hyperbrief.md#1-ir-format` | decision |
| 13 | L`a`.`b`.`c` tone | internal | `Hyperbrief.md#56-tone-vocabulary` | decision |
| 14 | 4-score escalation | internal | `Hyperbrief.md#2-trigger-rubric` | decision |
| 15 | two-lens GA rubric | internal | `Hyperbrief.md#115-readiness-rubric` | decision |
| 16 | macro/mezzo/micro tier | internal | `Greatpractice.md#2-tier-hierarchy` | codification |
| 17 | maturation gate | internal | `Greatpractice.md#5-maturation-gate` | codification |
| 18 | phronesis boundary | internal | `Greatpractice.md#53-phronesis-codify-boundary` | codification |
| 19 | deterministic hook | internal | `Greatpractice.md#4-hook-mechanism` | codification |
| 20 | retire axis | internal | `Greatpractice.md#77-retire-axis` | codification |
| 21 | XSS boundary (esc) | internal | `Constellation.md#dashboard-xss-hardening` | safety |
| 22 | superseded_by | general | null | vocabulary |
| 23 | computed MOC | general | null | vocabulary |
| 24 | atomic note | general | null | vocabulary |
| 25 | controlled vocabulary | general | null | vocabulary |

> 1-21 = internal-register (pointer-only, the owner_spec heading-slug is grep-verified by the §9.2 13th axis). 22-25 = general-register (Compendium full-def SSoT). The heading-slugs are an example form — to be reconciled in v0.2 against the actual owner spec's heading anchors (the §9.2 axis catches mismatches).

### A.2 Exemplar 1 — internal-register (pointer-only)

```yaml
id: ack-tier
title: Ack Tier
type: glossary
register_class: internal
owner_spec: Constellation.md#3-key-management
subject_field: [a2a]
status: active
superseded_by: null
aliases: [ack-level, acknowledgment-tier]
definition:
  text: "The tier distinction in A2A message acknowledgment — a transport-tier Ack is separate from the message body arriving in the recipient inbox. See owner_spec for detail."
  # one-line orientation gloss + the pointer is load-bearing (full definition is owned by Constellation.md)
glosses:
  - { register: expert, text: "transport-tier Ack ≠ recipient inbox body arrival (at-most-once relay)" }
  - { register: plain,  text: "a signal that a message was delivered does not mean the other side actually read it" }
terms:
  - { text: ack tier, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-05, occurrence_count: 12, distinct_sources: 3 } }
  - { text: ack level, register: expert, role: hidden_search_only,
      provenance: { source: conversation, first_seen: 2026-06, occurrence_count: 4, distinct_sources: 2 } }
links: [a2a-relay-reliability, pre-send-probe]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
```

### A.3 Exemplar 2 — general-register (full def, Compendium = SSoT)

```yaml
id: computed-moc
title: Computed MOC
type: glossary
register_class: general
owner_spec: null
subject_field: [vocabulary]
status: active
superseded_by: null
aliases: [computed-map-of-content, regenerated-index]
definition:
  text: "A map-of-content index auto-regenerated from frontmatter metadata — a navigation node that cannot drift because it is never hand-maintained."
  # full definition — owned by no module spec (Compendium is the legitimate SSoT)
glosses:
  - { register: expert, text: "a derived view that removes the rot risk of a hand-maintained MOC — source = frontmatter, INDEX.md is the projection" }
  - { register: plain,  text: "a way to rebuild the table of contents automatically from file information instead of editing it by hand" }
terms:
  - { text: computed MOC, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 6, distinct_sources: 2 } }
links: [atomic-note]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
```

### A.4 Exemplar 3 — deprecation redirect (eviction home)

```yaml
id: channel-unification
title: Channel Unification (superseded)
type: glossary
register_class: internal
owner_spec: Constellation.md#self-board-vs-hub-board
subject_field: [a2a]
status: superseded
superseded_by: routing-by-direction
aliases: [channel-unify, single-channel-policy]
definition:
  text: "Single-channel unification for the hub→EG direction (v2.5.55-57). The EG→hub direction is replaced by routing-by-direction — see superseded_by."
glosses:
  - { register: plain, text: "old policy: merge into one channel. now changed to per-direction routing." }
terms:
  - { text: channel unification, register: expert, role: admitted,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 3, distinct_sources: 1 } }
links: [routing-by-direction]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
```

### A.5 Exemplar 4 — concept page (cross-module seam)

```yaml
id: decision-to-schedule-seam
title: How Hyperbrief Gates Superscalar Retire
type: concept
register_class: general
owner_spec: null
subject_field: [decision, scheduling]
status: active
superseded_by: null
aliases: []
definition:
  text: "How Hyperbrief's decision gate conditions entry into Superscalar's retire queue — an Explanation-tier link for a cross-module seam that has no single-module home."
glosses:
  - { register: plain, text: "the linking relationship where the decision-delegation module must pass an item before the work-cleanup module can retire it" }
terms:
  - { text: decision-schedule seam, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 2, distinct_sources: 1 } }
links: [9-section-ir, retire-axis]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
```

> The body is a thin primer ending in a pointer + a seam explanation (one paragraph) — zero normative-algorithm restatement. It links to `Hyperbrief.md` §3 and the `Superscalar.md` retire axis without *copying* their content.

---

## Appendix B. Self-Application — this spec as a Compendium entry

> This appendix is the result of treating the Compendium.md v0.1.0 spec itself as a *concept entry* and applying the §4 schema — self-consistency is the primary dogfood evidence. If the spec cannot satisfy the frontmatter form it defines, that is a reductio that the §4 schema is inapplicable to external entries.

### B.1 This spec's entry frontmatter (proposed)

```yaml
id: compendium-module-spec
title: Compendium Module Specification
type: concept
register_class: internal
owner_spec: Compendium.md#1-concept--what-compendium-is
subject_field: [vocabulary, a2a, decision, codification]
status: active
superseded_by: null
aliases: [compendium-spec, vocabulary-substrate-module]
definition:
  text: "The spec of a cross-cutting vocabulary substrate that navigates and synthesizes the 5 specs but does not restate their normative content — a source of information, not a source of truth."
glosses:
  - { register: expert, text: "concept-anchored dual-register glossary + a pointer-not-paraphrase charter + computed-MOC wiki + 4 lints, one-way authority Compendium→spec" }
  - { register: plain,  text: "a glossary module that organizes terms from several modules in one place but only points to each module's document for the original explanation" }
terms:
  - { text: Compendium, register: expert, role: preferred,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 1, distinct_sources: 1 } }
  - { text: vocabulary substrate, register: plain, role: admitted,
      provenance: { source: spec, first_seen: 2026-06, occurrence_count: 1, distinct_sources: 1 } }
links: [content-boundary-charter, dual-register-glossary, computed-moc]
audit: { created: 2026-06-15, updated: 2026-06-15, last_reviewed: 2026-06-15 }
```

### B.2 §4 schema application result

| Verification item | Result | Comment |
|---|:-:|---|
| v0.1 mandatory (id · title · type · register_class · status · definition.text) populated | PASS | §4.1 satisfied |
| owner_spec machine-checkable (`<file>#<slug>`) form | PASS | the §9.2 13th-axis grep-verified form |
| internal-register is a one-line gloss + pointer (no full restatement) | PASS | the spec self-pointer is a self-referential edge case — not a full def |
| register is a property of the gloss (no concept-definition fork) | PASS | §4.2 #1 |
| no-competing-full-def (internal) | PASS | definition.text is a one-line orientation, zero normative restatement |
| deprecation first-class (status + superseded_by) | PASS | §4.2 #4 |

### B.3 Discovered edge cases (v0.2 backfill candidates)

1. **the owner_spec self-pointer of the spec-self entry** — Compendium.md pointing at Compendium.md, a self-reference, trivially passes the §9.2 grep check but is a subtle circularity in the sense that *an internal entry is the SSoT of its own definition*. Consider a separate register sub-class for the spec-self entry in v0.2.
2. **occurrence_count=1** — as a new module the frequency signal is weak. This is unrelated to the promotion gate (§7.1) (internal-register is not a frequency-promotion target — §7.3), so it is normal.

This appendix is itself the starting point of Compendium's self-trust — because the spec satisfies its own frontmatter form, it holds the authority to apply it to external entries.
