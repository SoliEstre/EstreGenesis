<!-- part-of: EstreGenesis 2.5.x; kind: kit-level contract (not a module); version: v0.3; date: 2026-07-19; license: Apache-2.0 -->

# Harness Adapter Contract v0.3

> **What this is.** EstreGenesis ships one set of disciplines — skills, hooks, MCP servers — authored once against a canonical source format, and *projected* onto AI coding hosts through **adapters**. The Codex adapter (`codex/gen-codex-adapter.cjs`, Stage 1) proved the shape in practice; this document promotes that practice to a contract, so the next host (a self-hosted personal-AI environment with a local-LLM loop, a future provider-native runtime, anything that can read markdown) implements a written agreement instead of reverse-engineering a generator script. Per the project's north star, the longest-lived layer here is the *decomposition* — source-of-truth, projection surfaces, degradation, verification — not any generator's code.

## 1. Definitions

- **Harness core** — the host-independent substance: skill procedure bodies (`SKILL.md`), module specs (`*.md`), MCP server implementations (stdio JSON-RPC), and the **Asterism** wire contract (⁂ — Constellation §2-§13; named 2026-07-20). The core never imports host-specific APIs.
- **Host** — a runtime that executes an agent loop and offers extension surfaces (skill/command registration, lifecycle hooks, tool servers). Claude Code is the reference host; Codex is the first adapted host.
- **Adapter** — the projection from core to one host: a mapping definition plus (optionally) a deterministic generator that materializes host-side configuration. An adapter owns *no substance* — if an adapter contains procedure text that does not exist in the core, that is a contract violation (drift by copy).

## 2. Source-of-truth assumptions (what an adapter MAY rely on)

1. **Skills** are directories `plugins/<plugin>/skills/<name>/` containing a `SKILL.md` with YAML frontmatter (`name`, `description` — double-quoted when containing `: ` or ` #`) followed by a markdown procedure body. The body is host-neutral prose; host-specific tool names, when unavoidable, appear as *examples*, not as required calls.
2. **MCP servers** are declared in each plugin's `plugin.json` under the `mcpServers` key (command + args, stdio transport, dependency-light).
3. **Hooks** are declared in `plugins/<plugin>/hooks/hooks.json` under a top-level `hooks` key, keyed by lifecycle event names.
4. **Aliases** are pointer skills — a `SKILL.md` whose body instructs reading a sibling canonical skill. Adapters MUST project the pointer as a pointer (or resolve it at generation time), never by duplicating the canonical body.
5. The **version SSoT** is the repo `CHANGELOG.md`; an adapter surfaces version identity by reference, never by independent numbering of the projected content.

## 3. Projection surfaces

An adapter declares, per surface, one of: **native** (host has an equivalent surface), **emulated** (approximated through another mechanism), or **absent** (see §4).

| Core surface | Meaning | Claude Code (reference) | Codex (Stage 1) |
|---|---|---|---|
| user-invocable skill | human types `/name` | plugin skill | prompt-library entry in `codex/README.md` inventory |
| model-invoked skill | agent self-triggers on condition | skill description trigger | emulated — instruction block in projected guidance |
| lifecycle hook | run at turn/session boundaries | `hooks.json` events | absent (declared) |
| MCP server | tools over stdio | `mcpServers` | native — `[mcp_servers.*]` stanzas in `config.toml.example` |
| agent loop | the LLM call loop itself | host-provided | host-provided |

The agent-loop row is deliberately out of adapter scope: loops conform to the **loop contract** (Constellation §13.27.4) instead. An adapter for a host that *owns its loop* (a local-LLM environment, a headless worker runtime) composes both contracts: the loop contract governs when the agent runs; this contract governs what disciplines it runs with.

Additionally, an adapted host that joins a Constellation board SHOULD emit the **declaration-event triple** (Constellation §13.23.4): **`CommandManifest`** (v2.4.67 — the slash commands the agent can *actually honor when they arrive as prompt text*), **`OpsState`** (v2.4.71 — measured operational state: model, subscaler, fast; omit what the host cannot measure), and **`CapabilityManifest`** (v2.4.76 — which wire-contract surfaces the host implements, the opt-in negotiation channel a live adapter exercised for the selection facility). The declaration rule mirrors §4's honesty principle across all three: declare only what executes / what is measured / what is implemented; re-emit on every covered state transition and on every (re)connect (latest-wins makes the reconnect announce idempotent). Generic verbs the host cannot honor stay in the board's labeled fallback.

## 4. Degradation rules (absent surfaces)

1. **Declared, never silent** — an adapter MUST enumerate absent surfaces in its projected output (the Codex adapter's inventory table is the reference form). A user of the adapted host can always answer "what does the reference host do that mine doesn't?" from the projection alone.
2. **No half-projections** — a surface is projected whole or declared absent. Projecting a hook's *description* without its *execution* is worse than absence (it reads as active).
3. **Substance survives surface loss** — when a skill's trigger surface is absent (e.g. no model-invocation), the skill body itself MUST still be reachable (readable) from the adapted host, because the procedure text is the value; the trigger is convenience.

## 5. Generation & verification

1. Adapters SHOULD be **generated, not hand-maintained**: a deterministic script reads the source-of-truth surfaces (§2) and rewrites the projection in place (`--write`), with a `--check` mode that exits non-zero on drift.
2. Every adapter registers a **verification axis** in the repo's N-way version check (the `codex-adapter` axis is the reference: projected inventory ↔ live plugin set, machine-compared per cut). An adapter without a check axis is decorative.
3. Generation is **pure remap** — the generator MUST NOT commit copies of skill bodies into the projection (pointer or path reference only), keeping single-source truth (§1 "drift by copy").
4. **Distribution path** — where a host consumes the AgentSkills `SKILL.md` ecosystem, skills MAY be delivered through a multi-target skill installer (one canonical source, per-host target flags) instead of a bespoke generator; the canonical source remains this repo (§2), and the installer is a *transport*, not a second authority. Installer ecosystems observed so far carry no version pinning — an adapter relying on one MUST record the installed revision itself (lockfile or commit reference) to keep §5.2's drift check meaningful.

## 6. Conformance levels

- **Stage 1 — read-only projection**: the host consumes generated configuration + inventory; humans wire anything the host cannot auto-load. (Codex today.)
- **Stage 2 — native registration**: the projection is installable through the host's own extension mechanism (marketplace, plugin registry) without manual wiring.
- **Stage 3 — loop-composed**: the host also implements the loop contract (§13.27.4), so EG disciplines run unattended on that host's own agent loop. This is the declared target for **[Estrelle](https://github.com/SoliEstre/Estrelle)** — a self-hosted personal-AI OS running user-owned models (local LLMs included) whose vision names EG as its agent harness; the third adapter, contract-first.

## 7. Existing implementations & candidates

| Adapter | Level | Artifacts |
|---|---|---|
| Claude Code | reference host (no adapter needed) | `plugins/*` load natively |
| Codex | Stage 1 | `codex/gen-codex-adapter.cjs` · `codex/config.toml.example` · `codex/README.md` inventory · verify axis `codex-adapter` |
| [Estrelle](https://github.com/SoliEstre/Estrelle) (personal-AI OS, local-LLM loop) | planned — target Stage 3 | contract-first: this document + §13.27.4 precede any code; mutual entry-point links (Estrelle vision ↔ this repo) |
| Hermes agent (resident gateway; hub-main candidate) | candidate — target Stage 2; **§8 surface map fully measured (2026-07-19)** | measurement gate passed on all Hermes rows (remote-measured, archived); a persistent Live Board connector joined a live board with zero core patches and passed a wire-compatibility round-trip the same day. Remaining Stage-2 substance is distribution/registration, not capability. Intended duty: Constellation hub-main (§13.9.3) with per-boundary profiles, joining boards as peer-main |
| OpenClaw (messaging-gateway daemon; local-worker candidate) | candidate — target Stage 2 | surface map §8; measurement gate (§8.2) pending. Intended duty: Constellation local worker (§13.23) + messaging-group roundtable projection (§13.30) |

## 8. Candidate-host surface maps (research-verified drafts)

Both candidate rows in §7 come from a 2026-07-19 five-axis research pass (96 sources, claims adversarially verified). The map below records, per core-contract element, the **observed** host surface and a **verdict**: `verified` (assertable now) · `deferred` (documented but not independently cross-confirmed — must pass the §8.2 gate before an adapter asserts it) · `mixed` (per-host split). This table is itself an instance of §4's honesty rule applied to *pre-implementation* claims.

| Contract element | Hermes agent (observed) | OpenClaw (observed) | Verdict |
|---|---|---|---|
| instruction file | cwd `AGENTS.md` auto-injected (marker round-trip measured) | injects workspace instruction/identity docs into the session | **Hermes verified** · OpenClaw deferred |
| skills | AgentSkills `SKILL.md`; self-generation from conversation; hub scan | AgentSkills `SKILL.md`; materializes Claude Code plugins when driving a claude-cli backend | **verified** |
| hooks | shell hooks, stdin JSON in / stdout JSON out, `pre_tool_call` gate with `{action:"block"}` measured | skill gating + backend hook surface | **Hermes verified** · OpenClaw deferred |
| MCP | stdio MCP connect + in-process hot reload (`/reload-mcp`) measured | MCP registry validates namespace ownership only | **Hermes verified** · OpenClaw deferred |
| headless turn | ACP check + OpenAI-compatible HTTP one-shot turn (marker round-trip) measured | single-shot channel-less exec subcommand | **Hermes verified** · OpenClaw deferred |
| profile / boundary | per-profile home-dir isolation measured (inode-distinct config/state/sessions per profile) — **not process/sandbox isolation**, same OS account | pairing + node tokens + loopback bind | **Hermes verified (with stated limit)** · OpenClaw deferred |
| timeout policy | clarifying-question 3600 s → sentinel → self-proceed; risk approval 60 s → fail-closed deny | resident daemon; group mention-gating silent default | **Hermes verified** |
| model / effort / fast | fast-priority toggle; 8-level reasoning effort (default medium) | 60+ providers incl. local low-tier models | **verified** |

**The Hermes column is now fully measured** (v0.3): every formerly-deferred Hermes cell passed the §8.2 gate on 2026-07-19 against an operator-owned dedicated instance (Hermes v0.18.2, Python 3.11.15), self-measured and relayed over live A2A, archived verbatim in the maintenance workspace's adapter-evidence ledger. The profile row's promotion carries its honest limit forward: isolation is home-directory-level, not a sandbox. The OpenClaw column remains deferred pending its own install + measurements.

### 8.2 Measurement gate

A `deferred`/`mixed` row is promoted to `verified` only by an **on-host measurement**: a recorded triplet of *command · input · observed output* against a real installation, kept with the adapter artifacts. Until promotion, host-facing projections (README inventories, onboarding text) MUST phrase the capability as unconfirmed or omit it — a candidate map row is a research citation, not a capability claim. A failed measurement stays in the map as a counterexample (same anti-fabrication rule the module specs follow).

Remote measurement is admissible: the measured host's **own agent** may run the triplets and relay them over A2A, provided the record is archived verbatim with provenance (who measured, on what instance/version, over which channel) — the 2026-07-19 Hermes pass is the exemplar (five axes, four-tuple records including the harness version, plus a cleanup manifest restoring the instance's prior state).
