---
id: nested-repo-write-routing
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "a workspace contains a nested repository (or two overlapping write targets) and a command writes without naming its target explicitly"
  then: "name the target in the command itself (git -C <abs>, absolute script paths) and let a hook reject the wrong-target commit shape"
  format: if-then
  source: measured-incident
lifecycle: probation
last_referenced_turn: 2026-07-27T04:10:00Z
title: "Route writes by naming the target, not by remembering where you are"
slug: nested-repo-write-routing
created_at: 2026-07-27T04:10:00Z
class: procedure
status: active
source_evidence:
  - "14+ occurrences in one workspace across 3 coordinates: relative script/file paths (explicit ENOENT), inherited PATH snapshot (plausible 'tool not installed'), and repository routing (silent write to the wrong valid target)"
  - "2026-07-27: a release commit intended for the nested public repo succeeded in the private outer repo — including a version tag pushed to the wrong remote — because both repos had stageable changes and the shell's cwd was the outer one"
evidence_quality: measured-single-workspace
recommendation_strength: strong-for-nested-layouts
maturity_score:
  occurrences: 14
  coordinates: 3
  independent_recurrence: true
surfaces:
  - "git invocations"
  - "script invocations from a shell whose cwd persists between calls"
  - "commit-msg hook (mechanical enforcement)"
edit_policy: append-illustrations
phronesis_boundary: false
validation_cadence_days: 90
---

# Route writes by naming the target, not by remembering where you are

## The rule

When a workspace has **more than one place a write can land** — a nested repository, a deployment copy beside a source master, two boards on different ports — a command must **name its target in the command itself**. Not by the shell's current directory, not by a `cd` earlier in the chain, and not by the author's memory of where they are.

Concretely: `git -C <absolute-path> …` rather than `cd <path> && git …`. Absolute script paths rather than relative ones. And where a wrong target produces a *valid-looking* result, add a mechanical rejection rather than a reminder.

## Why the usual mitigation is not enough

The obvious mitigation — "remember to `cd` first" — was written down, followed most of the time, and still failed repeatedly. That is not a discipline problem; it is a **shape** problem. `cd` sets state that outlives the command, so every later invocation inherits a decision made earlier, and a chain that fails in the middle leaves the state wrong for whatever runs next. `-C` re-establishes the target on every call and cannot be inherited.

## The failure mode that justifies mechanical enforcement

The cheap version of this mistake announces itself: a relative path points at nothing and the command errors. Those cost a retry.

The expensive version **succeeds**. With two overlapping repositories that both have stageable changes, `git add -A && git commit` in the wrong one is a *normal successful commit*. Measured consequences from a single occurrence:

- a commit carrying the nested repo's release-message convention landed in the outer repo, where that convention is wrong;
- a version tag was created and **pushed** to the wrong remote;
- the intended changes stayed uncommitted, so the next cut's edits landed on the same files and the two releases could no longer be separated — they had to be folded into one commit with both tags pointing at it.

Nothing in the tool output indicated a problem. It surfaced only because an independent check asserted that every changelog release marker has a corresponding tag, and one did not.

That asymmetry is the argument: when the wrong target is *also valid*, no amount of care produces a signal, so the signal has to be manufactured.

## Mechanical part

A `commit-msg` hook in the repository that must **not** receive a given commit shape, rejecting that shape and naming the correct route:

- outer/private repo rejects the nested repo's release-commit format and prints the `git -C <nested>` invocation to use instead.

This is deliberately one-directional and shape-based rather than clever. It does not try to infer intent; it encodes the one fact that is stable — *these two repositories have different commit conventions, so a message in the other's format is evidence of a misroute.*

Pair it with a check that release markers and tags agree (the detection that caught this one). Prevention and detection are separate jobs and both are cheap here.

## Applies to more than git

The same shape appears wherever a nested or derived write target exists: editing a deployment copy instead of the source master, writing to a board on the wrong port, patching a plugin cache instead of the repository. The rule generalizes to: **if two valid targets exist, the command must name one.**

## Non-goals

- Not a ban on `cd`. Interactive exploration is fine; the rule is about *writes*.
- Not an inference engine. The hook checks a message shape, not intent, and stays silent on anything else.
