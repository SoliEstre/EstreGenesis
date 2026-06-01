# promotion-decisions/

Operator-written artifacts that record Mode B → Mode C promotion decisions for the Constellation DB P2 dual-write rollout. Each artifact is committed to git history so the decision is durably reviewable.

## Artifact types

| File pattern | Phase | Owner |
|---|---|---|
| `mode-b-entry-<YYYY-MM-DD>.md` | Mode A → B entry baseline | EG agent + operator |
| `mode-b-weekly-<YYYY-MM-DD>.md` | Mode B operating-week snapshot (cadence: every 7 days) | Operator |
| `promotion-decision-<YYYY-MM-DD>.md` | Mode B → C promotion (when gates pass) | Operator |
| `rollback-rehearsal-<YYYY-MM-DD>.md` | Mode B → A rollback rehearsal log | Operator |
| `rollback-<YYYY-MM-DD>.md` | Mode B → A unplanned rollback in production | Operator |

## Reference

- `constellation/reference/docs/DB-P2-Guide.md` — overall DB P2 architecture, modes A/B/C/D
- `constellation/reference/docs/DB-P2-Mode-B-Entry-Runbook.md` — Mode B entry preconditions + procedure
- `constellation/reference/docs/DB-P2-Benchmark-Framework.md` — §6 promotion decision framework (correctness + effectiveness gates) + §6.3 artifact schema

## Promotion is operator-only

Per `DB-P2-Benchmark-Framework.md §6.4`, promotion is NEVER automated. Even when all §6.1 quantitative gates PASS, the operator must read the metrics, write the artifact, and flip `state.json.modes.historyBackend = "sqlite"` by hand. The artifact is the precondition for a useful post-mortem if the promotion turns out to have been premature.

## Cadence

- **Mode B entry baseline** — one-shot, written at Mode B entry (operator runs the entry runbook + EG agent records initial baseline).
- **Mode B weekly snapshot** — every 7 days during Mode B operation. Captures running gate outcomes + qualitative operator notes. Recommended ≥ 4 weekly snapshots (~30 days = one operational cycle per `DB-P2-Guide §6.3`) before promotion decision.
- **Promotion decision** — when operator decides; references the weekly snapshots and the final benchmark window.
- **Rollback rehearsal** — at least once before promotion (per `DB-P2-Benchmark-Framework §6.2`); rehearsal log is a §6.2 qualitative gate.
- **Unplanned rollback** — if `_autoRevert` fires in production (Mode B → A); operator writes the artifact within 24 hours of the event.
