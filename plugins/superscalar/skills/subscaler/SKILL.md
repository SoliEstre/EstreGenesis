---
name: subscaler
description: "Toggle tiered model composition — when the main agent runs a frontier reasoning model, delegate execution-shaped work (code writing/editing) to the strongest execution-tier model as subagents (one tier down, effort raised: Fable→Opus high / Sol→Terra high). Invoke as /subscaler on|off|status, or consult before a Workflow / parallel fan-out to decide which tier each lane runs on. Default OFF; recommended ON for fan-outs. Spec: Superscalar.md §5.1."
---

# /subscaler — tiered model composition toggle

Dispatch discipline (Superscalar §2) decides *what* fans out; this skill decides **which model tier it fans out to**. ON means: execution-shaped lanes run on the strongest execution-tier model with raised effort, while the frontier main keeps architecture, judgment, and review. The mechanism that makes this safe is **spec completion before offload** — a fully-specified lane loses little from one tier down; an underspecified one loses a lot.

## Toggle contract

- State = **one marker file**: `.agent/subscaler.json` — `{"on": true, "pair": "claude" | "gpt", "effort": "high"}`. Read it at invocation time; never mirror the state into other settings surfaces (duplicated per-role model bindings have shipped state-convergence bugs in production tools).
- `/subscaler on [claude|gpt]` writes the marker · `/subscaler off` removes it (or sets `"on": false`) · `/subscaler status` reads and reports it plus where it would apply next.
- **Default OFF.** Being ON is only recommended where fan-out already forfeits the shared prompt cache (a delegated subagent on a different model starts cache-cold — small, cache-hot, deep-context work loses money on delegation).

## When ON, apply at these surfaces

| Harness | Surface | Syntax |
|---|---|---|
| Claude Code | Agent tool call | `model: "opus"` (+ agent frontmatter `effort: high` where defined) |
| Claude Code | Workflow script | `agent(prompt, {model: 'opus', effort: 'high'})` |
| Codex CLI | Agent definition | `.codex/agents/executor.toml` with `model = "<terra-class>"` + `model_reasoning_effort = "high"` |
| Kimi Code | Agent tool call | per-invocation `"model"` parameter |

Do NOT reach for the global env pin (`CLAUDE_CODE_SUBAGENT_MODEL`): it overrides even per-invocation choices, applies to *all* subagents indiscriminately, and org-allowlist-excluded values fall back **silently** to the inherited model. Prefer per-invocation binding, and verify actual application when it matters (the fallback is silent by design).

## Delegation rubric (what goes down a tier, what stays)

- **Delegate to the execution tier**: spec-complete implementation · boilerplate · migrations · test scaffolding · mechanical multi-file edits · read-only exploration · summarization.
- **Retain on the main model**: architecture decisions · ambiguous-requirement interpretation · cross-cutting design · complex debugging · final review · deep shared-context coding (vendor guidance itself cautions that shared-context coding fits multi-agent decomposition poorly).
- Every delegated lane carries **explicit acceptance criteria + a test gate** authored by the orchestrator before dispatch. Spec completeness is the quality moderator — this line is what makes the tier drop safe.
- The §2 cost-benefit gate runs FIRST (spawn at all?); this skill only picks the tier of lanes that pass it. The §3.1 Hyperbrief interlock for write/deploy/send lanes is unchanged.

## Model pairs

| Family | Main | Sub (executor) | Effort |
|---|---|---|---|
| Claude | Fable-class | Opus-class | `high` default; `xhigh` selectively |
| GPT | Sol-class | Terra-class | `high` default; `xhigh` selectively |

Blanket-`xhigh` is not evidence-backed — effort→quality is non-monotonic and task-set-dependent. When choosing a non-default executor, weigh **edit-format compliance** as an independent selection axis: a split pair lives or dies on the editor emitting well-formed edits.

## Off-signals (turn it back OFF / leave it off)

- Single-file or deep-context work where the main's prompt cache is hot.
- Lanes needing repeated orchestrator↔executor negotiation (round-trip overhead eats the saving).
- Latency-sensitive interactive work.
- Executor output shows style/convention drift the review pass keeps correcting — the correction cost is the signal.

## After every toggle: re-declare

If this workspace is joined to a Constellation board, the toggle is not finished until the board knows: emit an updated `OpsState` declaration (Constellation §13.23.4 — change-triggered, latest-wins) carrying the new `subscaler {on, pair, effort}` alongside the measured model. The toggle and the announcement are one unit — a toggle without the announce leaves the board's status strip showing stale state. (EG-ops reference helper: `node scripts/emit-ops-state.cjs`; any equivalent single-line CUSTOM emit satisfies the contract.) Not board-joined → skip this step.

## Composition

- Superscalar §5.1 — normative spec (evidence base + boundary).
- Superscalar §2 cost-benefit gate · §3 budgets · §3.1 Hyperbrief interlock — all upstream of this toggle.
- Constellation §13.23.4 declaration events — the OpsState re-declaration duty above.
- Constellation §13.27.4 tier routing — resident unattended loops; separate jurisdiction, cross-linked.
