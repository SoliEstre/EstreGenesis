---
name: eg-memsync
description: "Reconcile agent memory with the project's governance docs — find where memory and AGENTS.md / .agent/rules.md contradict each other or went stale, fix the losing side, and promote memory-only durable policy into the docs. Invoke on a cadence, after a run of feedback-heavy sessions, or via /egmem. Requires a per-project agent memory store (memory/*.md or the harness equivalent) and an AGENTS.md-pattern project."
---

# /eg-memsync (`/egmem`) — reconcile agent memory ↔ project docs

Agent memory and project docs drift apart in **both directions**, and each direction is a real failure mode. Memory absorbs corrections faster than docs do — so a doc keeps stating a policy that a dated memory has since revised, sometimes while citing that very memory file by name. And docs (plus the repo itself) move on while memory keeps stale state — a memory still "waiting" on a gate that was resolved dozens of releases ago, or an index whose one-line summaries no longer match the files they index. Either way the next session inherits a contradiction and has to guess. This skill is the periodic true-up.

## 0. Locate the two corpora

- **Memory** — the per-project agent memory store: on Claude Code, the project's auto-memory directory (`memory/*.md` plus its index file); otherwise the workspace's `memory/feedback_*.md` convention or the harness equivalent. **No memory store → nothing to reconcile.** Say so and stop — do not invent one.
- **Docs** — the project's governance surfaces: `AGENTS.md` (the SSoT), `.agent/rules.md` (operational detail), and the per-tool bridge files (`CLAUDE.md` and friends). A project not on the AGENTS.md pattern routes to `/eg-migration` first; a project with no seed at all routes to `/eg-bootstrap`.

Read both corpora fully before judging anything — drift detection on a partial read produces false confidence.

## 1. Detect drift — five kinds

Sweep every memory file against every doc section (and the memory index against its own files):

- **(a) memory supersedes doc** — a doc states a policy that a dated memory has since revised. The strongest tell: the doc cites the memory file by name while carrying the pre-revision content.
- **(b) dangling references** — a doc cites a memory file, directory, or convention that does not exist (or no longer does); a memory wikilink points at a renamed or missing target; a placeholder link was never filled in.
- **(c) memory-only durable policy** — an operating rule (a restart procedure's required environment, a deploy-drift caveat, a content-tone standard, a routing rule) that lives only in memory with no doc surface. These are the promotion candidates.
- **(d) duplicated content where one copy went stale** — the same fact stated in both places with different values. The memory index counts: an index entry that summarizes an older revision of its own file is this kind.
- **(e) outdated identifiers** — versions, dates, paths, counts that one side visibly outgrew. Internal contradictions inside a single doc (two sections quoting two different versions of the same thing) count too.

## 2. Resolve — the direction of authority

- A **dated, explicitly-anchored memory beats undated doc prose** — the doc gets updated.
- **Repo reality beats stale state-tracking memory** — a memory that records pending gates, in-flight tracks, or "current" state that the repo has since resolved gets a closure/STATUS banner (or is deleted, if its own lifecycle says so). Never leave a resolved "waiting" memory looking live.
- **A genuine contradiction** — both sides plausible, nothing to arbitrate by — is **not yours to settle**. Do not pick a winner; surface it for a human call (the project's decisions panel where a live board exists, otherwise the closing report) with both readings quoted precisely.

## 3. Promote memory-only durables into docs — four boundaries

Kind (c) findings move into the docs, under these rules:

1. **Lifecycle** — do not promote a memory still marked probational/immature by its own lifecycle metadata. Early capture is the memory layer's job; promotion is for content that has held.
2. **Practice vs charter** — a *recurring work pattern* belongs to the practice-codification pipeline (Greatpractice's `/routinize` and its maturation gates), not to the docs; a *charter-grade workspace rule* (what this project is, how its infrastructure is operated) belongs to the docs. One destination per item, never both — double-promotion creates the next drift.
3. **Seed boundary** — sections that came from the seed are upgraded against upstream by `/eg-upgrade`, not rewritten from memory. When both are due, run `/egup` first, then reconcile.
4. **Definitions** — point, don't paraphrase (Compendium's discipline): a promoted definition is a pointer to its owning spec plus a one-line gloss, not a second full copy.

**Redaction gate**: before promoted content lands in any doc that is committed to a **public** repo, strip it to pure technical content — no chat quotations, no decision-source attributions (dates are fine; provenance is not). Docs in a private workspace are exempt, but check which kind you are writing into before you write.

## 4. Apply + report

- Fix kinds (a), (b), (d), (e) directly — they have a determinable right answer. Update the memory index whenever a memory file changed. Genuine contradictions from step 2 are surfaced, not edited.
- Report in a few lines: docs corrected N · memories closed/corrected N · promoted N (and to where) · contradictions surfaced N · references repaired N. A sweep that changes nothing should say **why** it found nothing — that is a healthy corpus, and it is signal, not silence.
