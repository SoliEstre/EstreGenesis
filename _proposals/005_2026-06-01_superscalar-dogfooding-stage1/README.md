# 005 · 2026-06-01 · superscalar-dogfooding-stage1

> Inbound proposal bundle from a downstream adopter (real-time chat-service microservices; full seed adoption incl. the Superscalar + Constellation modules; Burst pace mode, `issue_width` cap 6). Stage 1 Superscalar dogfooding telemetry after n=7 retired lanes — one actionable `issue_width` calibration signal (read/write lane-class cap asymmetry) plus policy confirmations and an honest unexercised-surface list. Feeds `Superscalar.md §11` dogfood log + `§5` adoption thresholds.
>
> **Staging note**: drafted in a neutral staging folder (`E:\WorkBase\temp`) by the adopter agent; move into `_proposals/005_2026-06-01_superscalar-dogfooding-stage1/` in the EstreGenesis repo to submit. Sequence number 005 assumes 004 is the current `_proposals/` tail — re-number if the maintainer has filed others in between.

## Bundle definition

The adopter ran Superscalar Stage 1 (OoO + worktree-isolated lanes + opt-in speculation) for ~3 days under Burst pace (`issue_width` cap 6), accumulating 7 real lane dispatches in a case-based ledger (measured values only, no synthetic numbers). Headline observation: a read-only research fan-out of **7 reader lanes exceeded the cap of 6 with zero downside**, because the cap's binding terms (Little's Law review throughput, Kanban WIP) model retire-merge contention that read-only lanes structurally don't have. The bundle proposes a lane-class-aware cap split (`P1`) and asks two clarifications (`R1`/`R2`) about the policy-cap vs runtime-concurrency-ceiling relationship. It also confirms several Stage-1 defaults and lists what the adopter has not yet exercised (worktree-isolation 0, speculation 0).

## Documents

| # | topic | en | ko | type |
|---|---|---|---|---|
| 001 | Superscalar Stage 1 dogfooding (n=7) — read/write lane-class cap asymmetry + `§5` threshold readout | [001_superscalar-dogfooding.en.md](001_superscalar-dogfooding.en.md) | [001_superscalar-dogfooding.ko.md](001_superscalar-dogfooding.ko.md) | calibration signal (P1) + 2 clarification requests (R1/R2) |

## Closure log

| date | status | note |
|---|---|---|
| 2026-06-01 | drafted (staging) | n=7 snapshot. Pending move to `_proposals/` + maintainer review for `§2`/`§5` lane-class cap split + `§2` policy-cap / runtime-ceiling relationship. No body change requested beyond `§2`/`§5`/`§11`. |

## Privacy

Reverse-reference redacted per `_proposals/` privacy default — no adopter service names, hosts, IPs, repo paths/URLs, or internal doc identifiers appear. The report concerns only `Superscalar.md` policy surface (`§2` issue_width formula, `§5` adoption thresholds, `§11` dogfood log) and generic lane-class mechanics. The adopter is identified only by generic role (real-time chat-service microservices, full seed adoption). No commit hashes are cited (none are needed for the calibration signal).
