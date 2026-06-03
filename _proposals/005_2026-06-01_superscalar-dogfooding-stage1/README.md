# 005 · 2026-06-01 · superscalar-dogfooding-stage1

> Inbound proposal bundle from a downstream adopter (real-time chat-service microservices; full seed adoption incl. the Superscalar + Constellation modules; Burst pace mode, `issue_width` cap 6). Stage 1 Superscalar dogfooding telemetry after n=8 retired lanes — two actionable signals (read/write lane-class cap asymmetry; worktree-isolation limitation on nested independent repos) plus policy confirmations and an honest unexercised-surface list. Feeds `Superscalar.md §11` dogfood log + `§2`/`§3`/`§5`.
>
> **Staging note**: drafted in a neutral staging folder (`E:\WorkBase\temp`) by the adopter agent; move into `_proposals/005_2026-06-01_superscalar-dogfooding-stage1/` in the EstreGenesis repo to submit. Sequence number 005 assumes 004 is the current `_proposals/` tail — re-number if the maintainer has filed others in between.

## Bundle definition

The adopter ran Superscalar Stage 1 (OoO + worktree-isolated lanes + opt-in speculation) for ~3 days under Burst pace (`issue_width` cap 6), accumulating 8 real lane dispatches in a case-based ledger (measured values only, no synthetic numbers). Two headline signals:

1. **Read/write lane-class cap asymmetry** (`P1`, from n=7): a read-only research fan-out of **7 reader lanes exceeded the cap of 6 with zero downside**, because the cap's binding terms (Little's Law review throughput, Kanban WIP) model retire-merge contention that read-only lanes structurally don't have. Proposes a lane-class-aware cap split, plus two clarifications (`R1`/`R2`) on policy-cap vs runtime-concurrency-ceiling.
2. **Worktree-isolation limitation on nested independent repos** (`R3`, new in case 8 — the adopter's first worktree write-lane dispatch): `isolation:"worktree"` worktrees the parent repo but does **not** span a nested *independent* git repo inside it, silently degrading the `§3` ROB isolation to branch-level (the lanes worked on separate branches in the shared nested repo). No conflict here only because the lanes touched disjoint files; a same-file write would have produced a real WAW hazard despite the honored worktree request. Relevant to `§3` (ROB = worktree boundary).

It also confirms several Stage-1 defaults (latency-hiding, FM-1.3=0, in-order retire, speculation off-by-default) and records a secondary verification-depth lesson (presence-verify ≠ behavioral-verify, adjacent to MAST FM-2.6). Speculation remains 0/8.

## Documents

| # | topic | en | ko | type |
|---|---|---|---|---|
| 001 | Superscalar Stage 1 dogfooding (n=8) — read/write cap asymmetry + nested-repo worktree limitation + `§5` threshold readout | [001_superscalar-dogfooding.en.md](001_superscalar-dogfooding.en.md) | [001_superscalar-dogfooding.ko.md](001_superscalar-dogfooding.ko.md) | calibration/correctness signals (P1) + 3 requests (R1/R2/R3) |

## Closure log

| date | status | note |
|---|---|---|
| 2026-06-01 | drafted (staging, n=7) | n=7 snapshot. read/write cap asymmetry (P1) + R1/R2. |
| 2026-06-01 | updated (staging, n=8) | case 8 (first worktree write-lane) added → new finding §2b + request R3 (worktree isolation does not span nested independent repos, `§3`). Pending move to `_proposals/` + maintainer review for `§2`/`§3`/`§5`. |

## Privacy

Reverse-reference redacted per `_proposals/` privacy default — no adopter service names, hosts, IPs, repo paths/URLs, or internal doc identifiers appear. The report concerns only `Superscalar.md` policy surface (`§2` issue_width formula, `§3` worktree/ROB isolation, `§5` adoption thresholds, `§11` dogfood log) and generic lane-class mechanics. The adopter is identified only by generic role (real-time chat-service microservices, full seed adoption). No commit hashes are cited.
