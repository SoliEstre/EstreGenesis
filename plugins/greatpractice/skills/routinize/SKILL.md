---
name: routinize
description: "Codify a recurring work pattern into a durable practice (\"관행화\"). Invoke when the same task pattern has recurred and should stop being re-remembered by hand — automatically when you notice a repeat, or explicitly via /routinize. Prime trigger — before-compact time, when the session's accumulated context (the raw material) is about to be compacted away. Follows Greatpractice's capture-eager / promote-deferred discipline (Greatpractice.md §5.4): captures the pattern to memory immediately, but never auto-ratifies a blocking practice — promotion to an enforced entry is user-gated. Skips phronesis-heavy work (judgement-heavy / rare-context) by design."
---

# /routinize — codify a recurring practice (관행화)

Turn "work I keep doing the same way" into a durable Greatpractice entry — without over-codifying. This is the model-invoked front door to Greatpractice's **capture → mature → codify** pipeline (Greatpractice.md §1.2). The full normative model — tiers, maturity score, notability gate, phronesis boundary — lives in `Greatpractice.md`; this skill is the actionable procedure, not a restatement.

**Core discipline — capture is immediate, promotion is deferred** (§5.4). A single session's repetition is usually the *same* trigger coordinate (§5.2), so most invocations end at capture/accumulate; only genuinely independent recurrence produces a draft. The skill never registers an enforcing hook on its own authority — that is a user decision.

## Procedure

1. **Scan for recurrence** — over the recent context, find work patterns that repeated: the same fix applied ≥2×, the same multi-step sequence run again, a "when X, also do Y" coupling, a mistake made → corrected → nearly repeated. Name each candidate pattern in one line.

2. **Phronesis gate — what NOT to codify** (§1.4 / §5.3). Drop any candidate that is *judgement-heavy* (outcome doesn't reduce to one metric), *rare-context* (long-tail work phase), or *high-context-dependent* (the same surface behavior means different things by context). These stay in the agent's instinct — codifying them causes phronesis atrophy. Keep a borderline-but-worth-capturing candidate, but mark `phronesis_boundary: true` (advisory only, never blocking).

3. **Route each surviving candidate** (§5.4):
   - **New pattern** → write `memory/feedback_<slug>.md`: minimal frontmatter (`trigger`, timestamp, `trigger_source`), `lifecycle: probation`, blameless voice (state the pattern, not blame). Eager capture — cost 0, no approval needed.
   - **Already captured** → append this occurrence to the existing feedback's illustration section + record its `(work-domain × phase × time-of-day)` coordinate; bump the significant-coverage counter (substantive appends only).
   - **Notability gate met** — *only* if the pattern now has ≥3 substantive occurrences across **≥2 distinct coordinates** (3× at the same coordinate = 1 trigger, does not qualify) AND a verifiable effect is definable (§5.2) → draft `greatpractice/_propose/<slug>.draft.md` with the full §3 frontmatter, a tier guess (§2: macro governance / mezzo procedure / micro atom — most are mezzo), and the phronesis verdict.

4. **Route ratification to the user — never self-approve** (§5.4 gate 3). A draft becoming an enforced entry — promoted to `greatpractice/{tier}/` with a registered lifecycle hook that will block or warn on future tool calls — is a durable behavioral change. Surface the draft + a one-line recommendation (tier · enforcement_level · why) and let the user decide. If Hyperbrief is adopted and the call is non-trivial, route it through a decision brief.

5. **Report** — 1–3 lines: N captured / N accumulated / N drafted-awaiting-approval / N skipped-as-phronesis. If nothing recurred enough to act on, say so — that is a valid and common outcome (capture-eager does not mean codify-eager).

## Non-goals

- **Not auto-enforcement.** Never registers a blocking hook on its own authority — ratification is user-gated (§5.4 gate 3).
- **Not a summarizer.** It captures *reusable procedure*, not a recap of what happened (that is the compaction summarizer's job — and `/before-compact`'s, which this skill pairs with).
- **Not for one-offs.** A pattern seen once is a memory note at most, not a practice (§5.4 "1 time = raw capture").
