---
name: eg-interview
description: "Structure a vague or high-stakes request into a delegable brief by interviewing the requester — press for purpose, constraints and success criteria in few high-yield rounds, then hand downstream agents a brief instead of a guess. For the human-facing (upstream) agent; alias /eggrill."
---

# /eg-interview — interview-strategy intake (grill-me lineage)

The top-of-funnel discipline for the *human-facing* agent: before decomposing or delegating a request, extract what the requester actually needs — by asking, not by assuming. The output is a **delegable brief** that travels with every downstream delegation, so worker agents execute a confirmed intent instead of an upstream guess.

## 1. When to run (and when not to)

Run when a request is **broad, ambiguous, or high-stakes** and will fan out — a program-scale ask, a "make X better" with no criteria, work that commits resources or publishes externally. Do NOT run for requests that are already specific and cheap to redo: interviewing a clear request is over-questioning, which costs requester patience for zero information gain. Rule of thumb: if you can state the purpose, the deliverable, and the success check in one sentence each *and* would bet on being right, skip the interview and confirm inline instead.

## 2. What to press for (the six extraction targets)

1. **Purpose** — why this, why now; what changes for the requester when it lands. The stated task is often a means; the purpose is what survives redesign.
2. **Deliverable shape** — what artifact/state counts as the output (a document? a running service? a decision?).
3. **Constraints** — deadline, budget/effort ceiling, technology or policy boundaries, do-not-touch zones.
4. **Success criteria** — how the requester will judge it done; what verification they'd accept.
5. **Scope edges** — what is explicitly in and out; the adjacent work they do *not* want started.
6. **Priority trade-offs** — when speed, completeness, and cost collide, which yields first.

## 3. Question discipline

- **Batch few, high-yield** — 2–4 questions per round, at most ~2 rounds. Each question must change what you'd do next; drop any whose every answer leads to the same plan.
- **Default-and-confirm over open-ended** — where an answer is inferable, state the inferred default and ask for correction ("기본값 X 로 진행할게요 — 아니면 알려주세요") instead of asking from zero.
- **Structured choices where the host supports them** — present options with costs/benefits and a recommendation. Compose with Hyperbrief for the presentation register: default the option prose to the plain-language levels (L1.1.1–L1.2.2) and honor an "explain more simply" fallback — the requester picking an option must actually understand it.
- **Stop on diminishing returns** — when the remaining unknowns are cheaper to resolve by doing (a reversible probe) than by asking, stop interviewing and mark them as assumptions.

## 4. Output — the delegable brief

Produce a compact structured brief: **purpose · deliverable · constraints · success criteria · scope in/out · assumptions (explicitly marked, each with what would confirm it) · suggested decomposition**. Register it where downstream readers actually look — the board entry's detail, the track document, or the delegation payload itself — and keep it short enough to travel whole (a brief that gets summarized on the way down stops being the brief).

## 5. Downstream handoff

Every delegation cites the brief. Unanswered questions ride along as **named assumptions with revisit markers** — never as silent guesses; if a worker's result invalidates an assumption, that is an escalation trigger back to the requester, not a local re-guess. When the requester later answers a parked question, re-run only the affected slice (late steering, not restart).
