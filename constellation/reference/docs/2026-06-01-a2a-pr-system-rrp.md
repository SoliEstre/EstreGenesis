# A2A PR System — Cross-repo Pull Request orchestration via the A2A messaging layer (RRP v0.2 DRAFT)

> **DRAFT v0.2 — Phase 1 Level 2 shipped, Level 1 path pending.**
> Phase 1 prototype (Level 2 — provider-mediated Github PR path) shipped upstream as commit `2213a14`: `server.cjs` `_PR_CUSTOM` 5-type observer set + `wsPrMergeReject` strict `role==main` gate + `PRStatusUpdate` observer; `local-bridge` `handlePrRequest` (trusted-mirror validate → β′ mirror branch on target repo → `gh pr create` → `PRDraftReady`) + `handlePrMergeRequest` (`gh pr merge` → `PRMergeAck`); `state.json.pr_system.trusted_mirrors` registry. Dry-run default: `CONSTELLATION_PR_LIVE` env OFF (opt-in to live PR creation). Priority open questions Q1/Q2/Q3 are resolved by the Phase 1 ship (see §11).
> EG 1차지식 perspective (Constellation orchestration domain, downstream-of-main per §13.9 peer role).
> **Still NOT a unilateral spec** — the v0.2 additions (Level 1 abstraction, β′ topology articulation, Phase 1b sub-phase) layer on top of the Phase 1 form and remain open to refinement at joint formalization. Items marked "(open for main review)" continue to be load-bearing.
> Targeted as a new sub-section in `Constellation.md` (proposed slot: §13.22, immediately after §13.21 fresh-context-defer; number to be confirmed at joint-formalization time).

---

## 1. Status & provenance

- **Version**: v0.2 DRAFT (Phase 1 Level 2 shipped, Level 1 path pending). Predecessor: v0.1 (initial RRP, 2026-06-01).
- **Date**: 2026-06-01 (v0.2 patch same day as v0.1 cut; reflects Phase 1 ship `2213a14` arriving same day).
- **Context**: Companion to the §13.14 / §13.15 mirror gap (these two sections currently exist in this repo's `Constellation.md` but are NOT mirrored in the `<hub-repo>` `WS-PROTOCOL.md` — the manual-PR tax described in §1 below is the immediate driver, and the same §13.14/§13.15 mirror PR is the canonical dogfood case described in §9).
- **Authoring lane**: EG (per §13.9 peer/upstream role with respect to the `<hub-repo>` main; this RRP is one half of a coordinated proposal — the other half is whatever the `<hub-repo>` main wants to add at joint formalization time).
- **Joint-formalization workflow**: this draft → main upstream review (`<hub-repo>` side; comments via outbox `Delegate` or live-board `decisions` panel per §13.17) → reconciled merge → committed as new `§13.22` (or whichever number main assigns) in `Constellation.md`. The dogfood PR (§9) is the *forcing function*: landing the §13.22 protocol allows the §13.14/§13.15 mirror PR itself to be the first PR routed through the new system, proving the protocol works at the moment it lands.
- **Sensitivity**: every concrete design decision in §3–§8 is marked "(open for main review)". The §9 open questions enumerate the specific decisions where main's reaction is most load-bearing.
- **Redaction discipline (§13.14)**: this document uses `<hub-repo>` / `<main-prod>` placeholders for the user's private production hub. The EG repo (`SoliEstre/EstreGenesis`) is named explicitly because it is public-shipped. No real production org/repo paths appear inline.

---

## 2. Problem statement

### 2.1 The manual-PR tax

Constellation evolves at v2.4.x cadence with sub-day patches (the recent §13.13~§13.21 chain landed across ~3 days, with multiple §13.x sub-section additions per day at peak). Each spec update that is *load-bearing on the cross-repo wire vocabulary* (e.g., §13.13 ack layer, §13.14 redaction discipline, §13.15 build-time gate, §13.19 deadlock resolution, §13.20 blocker tracking) needs to be mirrored to the `<hub-repo>`'s `WS-PROTOCOL.md` for the downstream readers to see the same contract the upstream is shipping. Today, the *only* path for that mirror is:

1. EG-side agent drafts the mirror body (content already reviewed in EG repo, distilled-to-public per §13.14 redaction gate, syntax-gated per §13.15).
2. Outbox `Delegate` push to main carrying the mirror payload (the *content* is delivered via A2A).
3. **USER manually creates the PR in the `<hub-repo>`** — opens the GitHub UI, copies the body, picks the target branch, adds labels/reviewers, opens the PR.
4. USER (or main agent on hub side) reviews + merges.

Step 3 is the coordination tax this RRP exists to eliminate. The tax is small per-event but scales linearly with the number of cross-repo spec parity events. At current Constellation cadence (~2-5 spec updates per day, of which ~1-2 need cross-repo mirroring), that is 5-10 manual PR creations per week sitting on the user's plate — a recurring chore whose cost is *attention*, not just clicks. The §13.20 blocker-tracking discipline catches *external work that does not progress*, but it does not address *the manual step in the middle of an otherwise-automated pipeline* that this section names.

### 2.2 The §13.14 / §13.15 parity gap (the immediate use case)

Concretely, as of 2026-06-01:

- `Constellation.md §13.14` (env-token redaction discipline before public ship) is present in this repo. The `<hub-repo>`'s `WS-PROTOCOL.md` does **not** carry an equivalent section. Downstream adopters of the hub spec who do not also read EG `Constellation.md` miss this discipline.
- `Constellation.md §13.15` (reference-build syntax gate; `node --check` pre-commit + CI) is present in this repo. The `<hub-repo>`'s `WS-PROTOCOL.md` does **not** carry an equivalent section. Same gap.

Both sections were authored EG-side in response to real upstream-shipped incidents (a JSDoc syntax trap in a v2.2.x reference; a quoted-token meta-grep leak in a NOTES file). They are *load-bearing on downstream safety*: skipping §13.14 risks env-token leaks; skipping §13.15 risks loading-broken reference builds. The mirror is therefore not a nice-to-have — it is a parity-of-safety-discipline gap, and it has been pending across multiple Constellation versions because step 3 of §2.1 has not been performed.

The shape of the §13.14/§13.15 mirror PR — content already reviewed EG-side, target `<hub-repo>` `WS-PROTOCOL.md`, scope a single doc file — is **also** the canonical shape for *most* future cross-repo spec mirror PRs. Solving it generally (this RRP's §3-§8) is the same as solving the §13.14/§13.15 case specifically; the §9 dogfood plan is therefore not an exemplar of the system, it *is* the system's first production use.

### 2.3 Why a protocol, not just a script

A naive alternative — "write a `gh pr create` wrapper, call it from a TodoWrite task" — does not address the problem this RRP is scoped to:

- The wrapper would have to be triggered manually by the user or by the EG agent's foreground turn; the A2A layer would not see the PR lifecycle, the live board would not surface PR state alongside other agent state, and §13.13 ack discipline would not apply (a PR is an *application-tier* artifact; treating it as opaque external state outside the protocol re-introduces the silent-stall failure mode §13.20 exists to prevent).
- A wrapper has no answer for *cross-repo* coordination — when the PR target is `<hub-repo>` and the requester is the EG agent, the wrapper has to live somewhere with credentials to *both* repos, has to surface its state somewhere the user can observe, and has to integrate with the orchestration tree (§13.9) for review authority. None of these is a wrapper concern; all of them are protocol concerns.
- The §13.19 deadlock and §13.20 blocker-tracking sections already cover *internal* coordination friction; a PR that sits unreviewed in a foreign repo is the cross-repo instance of the same friction. Building this RRP's protocol within the §13.x family allows the existing deadlock / blocker primitives to compose over PR lifecycle (see §8.4 below).

The RRP therefore proposes a **wire vocabulary + agent topology + state machine** treatment, not a script.

### 2.4 Two-level abstraction — Level 1 (virtual PR, A2A-only) vs Level 2 (Github PR, provider-mediated)

A core v0.2 refinement: the same wire vocabulary (§4) and state machine (§9) describe two distinct physical realizations of a "PR." Which one applies in a given case is a function of *who operates the source and target sides* and *what file-system access the receiving side holds*.

**Level 1 — Virtual PR (A2A-only path)**. The PR exists *only* as an A2A message exchange between the source agent and the target-owner agent; no actual provider-side (GitHub / GitLab / Gitea) PR object is created. Applicable when:

- Source and target sides share an operator (same person or team operates both ends), AND
- Both sides have direct repo-level file-system access (the receiving side can clone, edit, commit, and push to the target repo locally).

In Level 1, the receiving side (= the side that holds commit-push authority on the target repo) reads the `sourceContentRef` carried by `PRRequest`, applies the change directly to its local checkout of the target repo, commits, and pushes — using A2A envelopes only for review / ack signaling. The `gh pr create` step is skipped entirely. Review happens in-band on the A2A wire; merge equals "commit to the target repo's integration branch and push."

**Level 2 — Github PR (provider-mediated path)**. The existing Phase 1 form per ship `2213a14`. `handlePrRequest` calls `gh pr create` against the target repo provider; the PR exists as a real GitHub / GitLab / Gitea object; review and merge flow through the provider's UI / API, with A2A envelopes mirroring state. Applicable when:

- Source and target sides are operated by different parties, OR
- The PR is cross-org, OR
- The target repo's integration policy requires a provider-side PR object (e.g., for required-status-checks, for audit trail at the provider tier, for compatibility with downstream Constellation adopters' provider-mediated workflows).

**Selection rule** (also encoded in the permission table §8 and reflected in §6 approval discipline). If `category == "trusted_mirror"` AND `operator-shares-target` AND `target-repo-direct-access` conditions both hold, **Level 1 is the default**. Otherwise Level 2. The selection is carried as an explicit payload field `level: 1 | 2` on `PRRequest`; the receiving side validates against its capability matrix and rejects mismatches (e.g., if `level == 1` is requested but the receiver has no direct push authority on the target repo, the receiver rejects with a capability-mismatch reason and the sender may retry with `level: 2`).

**Backward compatibility**: `PRRequest.level` defaults to `2` if absent, matching the Phase 1 ship's existing behavior. Pre-v0.2 senders continue to function unchanged.

**Wire vocabulary across both levels** — the five `CUSTOM` types from §4 (`PRRequest` / `PRDraftReady` / `PRReviewAck` / `PRMergeRequest`+`PRMergeAck` / `PRStatusUpdate`) cover *both* levels; semantics adapt per level. Per-type adaptations are documented inline at each type in §4, summarized here:

| Type | Level 1 (virtual PR) | Level 2 (Github PR) |
|------|----------------------|---------------------|
| `PRRequest.level` | `1` | `2` (default if absent) |
| `PRDraftReady.draftRef` | commit-sha on the staged target branch | provider PR number |
| `PRMergeRequest` | "commit the staged change to the target's integration branch" | "call `gh pr merge`" |
| `PRMergeAck` | reports commit SHA + push success | reports merged-PR state per provider |
| `PRStatusUpdate.state` | level-1 state machine (DRAFT → IN_REVIEW → APPROVED / CHANGES_REQUESTED → MERGED, where MERGED ≡ commit pushed to integration branch) | level-2 state machine (the §9 5-state machine as originally specified) |

The §9 state machine is `level`-discriminated; both levels traverse the same 5 logical states, but the transition triggers and the MERGED-state realization differ per level.

**Phase 1 ship status**: the current Phase 1 prototype (`2213a14`) implements Level 2 only. Phase 1b (§13) extends to Level 1.

---

## 3. Goals & non-goals

### 3.1 Goals

- **G1**. Eliminate the user's manual step in the cross-repo spec mirror loop for *trusted-category* PRs (defined in §5).
- **G2**. Surface the full PR lifecycle (draft → open → review → approved/merged) as A2A wire vocabulary, so the live board and §13.13 ack discipline can see and react to PR state.
- **G3**. Compose cleanly with existing §13.x discipline: §13.9 (peer / authority roles), §13.13 (ack layer), §13.17 (decisions panel), §13.19 (deadlock resolution), §13.20 (blocker tracking). Reuse existing vocabulary where the PR lifecycle maps onto it (the §8 state machine reuses §13.19's `ReviewSLAAck` and §13.20's `BlockerNudge` for review-pending states).
- **G4**. Keep the *authority surface* tight — only main-role agents on the target repo may `PRMergeRequest`; the autonomous-execution principle's external-publish gate remains for any non-trusted-category PR.
- **G5**. Dogfood: the §13.14 / §13.15 mirror PR (§9) is the FIRST PR routed through the new system, landing immediately after §13.22 lands. No "wait for a future use case to validate" — the validation IS the landing event.

### 3.2 Non-goals

- **NG1**. This RRP does NOT propose CI/CD automation, automated merging on green checks, or any policy that lands code without a human (or main-role agent) in the loop. The autonomous-execution principle's gates (a) loss, (b) external publish, (c) catastrophic action — apply unchanged; this RRP supplies the *mechanism* for some PR categories to bypass manual user intervention, not the *policy* for what merges autonomously.
- **NG2**. This RRP does NOT propose a general-purpose GitHub/GitLab integration layer. The scope is "PRs between repos in the Constellation deployment" — specifically EG ↔ `<hub-repo>`, and any other repo pair where both sides have an A2A peer presence. PRs to truly third-party repos (e.g., an upstream OSS dependency) remain manual.
- **NG3**. This RRP does NOT change the §13.13 ack vocabulary, the §13.9 role model, or the §13.11 board-emission discipline. The new vocabulary in §4 sits **on top of** those layers; it does not modify them.
- **NG4**. This RRP does NOT propose a credential-management subsystem (key rotation, OIDC integration, etc.). It assumes whichever topology (§5) is adopted has access to credentials by some means external to this protocol — either the user's local `gh` CLI (topology b) or a deployment-time configured token store (topology a). The protocol carries no credentials on the wire.
- **NG5**. This RRP does NOT cover PR-review *content* generation (e.g., automated review comments from an LLM). Review is performed by an agent at the human's direction (or by the human directly via the board); the protocol carries the review *envelope* (the `PRReviewAck` ack), not the review *body*.

---

## 4. Wire vocabulary — proposed new `CUSTOM` message types

Five new `CUSTOM` types are proposed, all layered above §13.13 (server-stamped `msgId`, server-emitted `Ack{delivered}`, recipient-agent `AckProcessed`). All are application-tier emissions per §13.13's three-grade model — none are server-auto-emitted; all originate from an agent at the application layer. **All five types apply to both Level 1 and Level 2** (§2.4); per-type fields with level-discriminated semantics are flagged inline below.

| Name | Direction | Purpose | Required fields | Optional fields |
|------|-----------|---------|-----------------|-----------------|
| `PRRequest` | Any agent → PR-bot agent OR direct to repo-owner agent | Initiate a new PR | `sourceRepo`, `sourceContentRef` (branch ref OR inline filesDiff), `targetRepo`, `targetBranch`, `title`, `body`, `level: 1 \| 2` (default `2`) | `labels[]`, `reviewers[]`, `category: 'trusted-mirror' \| 'standard' \| 'emergency'`, `slaEta` |
| `PRDraftReady` | PR-bot agent (Level 2) OR receiving-side agent (Level 1) → requester | Acknowledge PR creation OR target-branch staging; carry draftRef | `for: msgId`, `draftRef` (commit-sha for Level 1; pr-number for Level 2), `checksPending[]` | `prUrl` (Level 2), `repoOwner`, `repoName`, `headBranch` |
| `PRReviewAck` | Reviewer-role agent → requester | Application-tier review ack (approve / request-changes / comment) | `for: draftRef`, `verdict: 'approve' \| 'request-changes' \| 'comment'`, `reviewBody` | `inlineComments[]`, `slaEta` (if `request-changes`), `reviewedAt` |
| `PRMergeRequest` / `PRMergeAck` | Merge-authority agent → PR-bot / receiving-side agent; back to requester | Trigger and confirm merge | `for: draftRef`, `mergeStrategy: 'merge' \| 'squash' \| 'rebase'` (Level 2 only — Level 1 always equivalent to fast-forward / direct commit to integration branch) | `commitTitle`, `commitBody`, `deleteSourceBranch: bool` |
| `PRStatusUpdate` | PR-bot agent OR receiving-side agent → all watchers (broadcast or targeted) | Periodic state push | `draftRef`, `level`, `state: 'draft' \| 'open' \| 'changes_requested' \| 'approved' \| 'merged' \| 'closed'`, `checks: {...}` (Level 2 only), `reviewState: {...}` | `lastEventAt`, `nextSlaCheckAt` |

### 4.1 `PRRequest`

The sender is any agent that has determined a PR is the appropriate next step. The target is either:

- A dedicated **PR-bot agent** (topology a in §5) — the bot holds provider credentials and creates the real PR on the provider's API surface, OR
- A **repo-owner agent** that delegates to the local bridge's `createPR` port (topology b in §5, the form adopted by Phase 1 ship `2213a14`).

The `category` field is the *trusted-mirror* gate from §6: `trusted-mirror` PRs are auto-approved for creation per the deployment policy in `state.json.pr_system.trusted_mirrors` (§13.14/§13.15 pair as shipped); `standard` PRs follow per-PR user opt-in; `emergency` PRs (e.g., a hotfix mirror) carry an out-of-band approval reference.

**`level` field** (v0.2 addition; default `2` for backward compatibility with Phase 1 ship). `1` selects the Level 1 virtual-PR path (A2A-envelope-only; receiving side commits + pushes directly to the integration branch; no `gh pr create`); `2` selects the Level 2 Github-PR path (provider-mediated; `gh pr create` against the target repo). The receiving side validates the requested level against its capability matrix (does it hold direct push access to `targetRepo`? does it share an operator with the sender?) and rejects mismatches; the sender may retry with the other level.

The `sourceContentRef` field carries either a branch ref (per §7 option β / β′ — the standard form) or an inline `filesDiff` for small diffs (§7 option α). The `slaEta` field is the requester's *expected review SLA*, composing with §13.19.7 `ReviewSLAAck` discipline — if the reviewer cannot meet the ETA, the existing renegotiate-SLA path applies.

### 4.2 `PRDraftReady`

In **Level 2**, the PR-bot agent's commit ack that the PR has been created on the provider. `draftRef` carries the provider PR number; `prUrl` carries the provider URL for human follow-through; `checksPending[]` carries the initial CI / required-status-checks set the PR must wait on before review is meaningful.

In **Level 1**, the receiving-side agent's commit ack that the source content has been applied to a staged target branch (typically a local branch on the receiving side's checkout, not yet pushed to the integration branch). `draftRef` carries the commit SHA of the staged commit; `prUrl` is absent; `checksPending[]` is absent (Level 1 has no provider-side CI by construction; if the receiving side runs local pre-commit checks, those are flagged as `localChecks[]` instead).

This is **NOT** a §13.13 `AckProcessed` — it is a richer application-tier ack that confirms the PR (in either level's sense) exists AND surfaces the data the rest of the lifecycle depends on. (Open for main review: should this be modeled as `AckProcessed` with a structured `summary`, or as a distinct type? The proposal here is a distinct type because the data shape diverges enough that conflation would force every consumer of `AckProcessed` to handle a special case.)

### 4.3 `PRReviewAck` (layered above §13.13 ack discipline)

This is the critical type for the §9 dogfood case. The reviewer (typically the `<hub-repo>` main-role agent, or a designated reviewer per the §13.20 manifest) emits this on review completion. The three-grade `verdict` matches GitHub's review verdicts (`approve` / `request-changes` / `comment`); the `inlineComments[]` array carries line-level comments mapped to file + position; the optional `slaEta` on `request-changes` re-arms the §13.20 blocker cadence pointing at the requester (the requester now owes a follow-up commit on the PR branch within the stated SLA).

**Layering above §13.13** (open for main review): the proposal is that `PRReviewAck` IS the §13.13 `AckProcessed` for the `PRRequest` — a single application-tier ack carries both the "processed" semantics and the review verdict. Alternative: emit `AckProcessed` first (on PR-bot inbound parse) and `PRReviewAck` second (on actual review completion); this preserves the §13.13 transport-vs-commitment-vs-completion three-ack stratification cleanly. The two-ack alternative is cleaner taxonomically but doubles wire traffic; the single-ack proposal is leaner but conflates two layers. Recommended for v0.1: **two-ack alternative** — `AckProcessed` from the PR-bot when the request is parsed and PR creation is queued, then `PRReviewAck` from the reviewer when review actually completes. Main upstream review may steer this differently.

### 4.4 `PRMergeRequest` / `PRMergeAck` (authority gated; strict gate confirmed by Phase 1 ship)

Per §13.20-style authority discipline, only an agent with `role == main` for the target repo may emit `PRMergeRequest`. The receiving side's response is `PRMergeAck` carrying the merge result.

**Level 2**: the PR-bot agent (or local-bridge per topology b) invokes `gh pr merge` against the provider; `PRMergeAck` reports the provider's merged-PR state (success / blocked-by-failing-check / blocked-by-conflict). The `mergeStrategy` field (`merge` / `squash` / `rebase`) defaults to `squash` for mirror PRs (single-commit history is cleaner for spec mirror diff readability); deployment may override per-target-repo policy.

**Level 1**: the receiving side commits the staged change (referenced by the `for: draftRef` commit SHA) to the target repo's integration branch (typically `main` / default branch) and pushes. `PRMergeAck` reports the resulting commit SHA on the integration branch + push success. `mergeStrategy` is ignored for Level 1 (the operation is conceptually a fast-forward / direct apply); if multiple commits were staged, the receiving side may squash or replay per local policy, but the wire envelope reports only the final integration-branch commit SHA.

**Authority gate**: the **strict gate** (only `role == main` on the target repo may emit `PRMergeRequest`) is confirmed adopted by Phase 1 ship `2213a14` — the server's `wsPrMergeReject` path rejects emissions from non-`main` roles with a logged `decisions` panel entry. This is independent of provider ACL drift; the protocol's authority chain is deterministic and does not delegate to external ACL state. The strict reading composes cleanly with §13.9's role-coordination tree.

### 4.5 `PRStatusUpdate`

Periodic state push from the PR-bot to all watchers. Cadence parallels §13.20.4's `BlockerNudge` cadence — once per agent-active-corrected rearm cycle, or on event (a new commit, a new review, a CI status flip). This is the data feeding the live-board PR panel (open for main review: §8.4 below proposes the panel; the implementation is a separate `app.js`/`server.cjs`/`style.css` ask).

The broadcast-vs-targeted decision is per-PR: a `trusted-mirror` PR's status pushes broadcast (so all interested agents see the lifecycle); a `standard` PR's status pushes targeted to the requester + reviewer only (per §13.11 board-emission economy — only the relevant agents).

---

## 5. Agent topology — three options, recommendation

The PR-bot role can be realized in three ways. The trade-off is between *credential isolation*, *implementation complexity*, and *coupling to the user's local environment*.

### 5.a Dedicated A2A agent (topology a)

A long-running agent (e.g., `agentId: pr-bot`) that holds GitHub/GitLab/Gitea credentials (token-store or OIDC), hears `PRRequest` messages on the A2A wire, and creates real PRs via the provider API. Same shape as any other Constellation agent — same §13.13 ack discipline, same §13.11 board emission, same §13.9 role classification (proposed: `role: worker` per the §13.9 worker-pattern, since the PR-bot's lane is bounded to PR-lifecycle ops and it takes `Delegate` from main-role agents).

**Trade-offs**:

- **Pros**: clean separation; no special privileges in the user's local env; can be deployed once and serve multiple requester agents; credentials are isolated to one agent's lane; auditable (every PR ops emission goes through the A2A wire and is recorded in `ws-history`).
- **Cons**: needs a credential store (token rotation, secret-management hygiene); needs a deployment surface (a hosted process, or a long-running local one); duplicates auth that the user already has in their local `gh` CLI; the user has to commission and maintain the agent.

### 5.b Local-bridge command (topology b)

Extend `local-bridge.eux` with a `cmd: createPR(spec)` port. The local bridge runs in the user's IDE alongside their `gh`/`git` CLI authentication — no separate credentials, reuses what the user already has.

The shape (open for main review):

```text
agent emits: PRRequest { ... }
       ↓ (A2A to local-bridge)
local-bridge invokes: gh pr create --base <targetBranch> --head <sourceBranch> --title <...> --body <...>
       ↓ (provider API call)
local-bridge emits: PRDraftReady { prUrl, prNumber, ... }
       ↓ (A2A back to requester)
```

**Trade-offs**:

- **Pros**: no separate credentials; no separate process; reuses the user's existing `gh` CLI auth (which the user has already accepted the trust posture of); simplest possible impl (one new bridge command, one provider CLI invocation); composes naturally with the existing bridge's emission discipline.
- **Cons**: requires the user's local bridge to be running (no cross-machine PR creation); ties PR creation to the local-bridge process lifecycle (if the bridge is down, PR creation is too); the bridge process holds *additional* authority (it can now create PRs on the user's behalf, expanding the bridge's blast radius — relevant to §13.16 lockfile / single-instance discipline).

### 5.c Hybrid (topology c)

Dedicated PR-bot for cross-repo paths where credentials must be explicit (e.g., a `<hub-repo>` ↔ `<main-prod>` PR where neither side is in the user's local env); local-bridge `createPR` for same-org / same-user-auth repos where the user is already authenticated locally.

**Trade-offs**:

- **Pros**: each path uses the simplest surface for its credential profile; the policy of which path to use is per-deployment.
- **Cons**: two implementations to maintain; the requester has to know which path to address (which the §4.1 `PRRequest` target field implicitly carries, but the user has to configure correctly); the protocol surface area is wider.

### 5.d Recommendation — topology b adopted by Phase 1 ship

**Topology b (local-bridge command) is adopted** by Phase 1 ship `2213a14`. The local-bridge runs in the operator's IDE process and uses the operator's `gh` CLI authentication; no separate credential store is required for v0.1 / Phase 1 / Phase 1b scope. Topology a / c remain as phase-2/3 expansions per §13 migration plan when cross-machine or separate-identity requirements appear.

Rationale (retained from v0.1; confirmed by Phase 1 ship):

- The §10 dogfood case (EG → `<hub-repo>`) uses the user's local `gh` CLI authentication directly — the user has `gh` auth for both repos, no separate credential plumbing is needed. Topology b lands in one bridge change (the Phase 1 `handlePrRequest` + `handlePrMergeRequest` handlers).
- Topology a's credential-store requirements (rotation, secret hygiene, leak-grep per §13.14) are non-trivial; deferring them lets §13.22 ship without dragging in a credential-management RRP.
- Topology c is a natural superset of b — adding a separate PR-bot agent for cross-machine paths is additive, not a re-architecture.

**Level 1 fit**: topology b is *also* the natural home for Level 1 (§2.4). The local-bridge already holds direct repo-level file-system access on both source and target sides (when they share an operator); Level 1's "receiving side commits + pushes directly" path is one additional `handlePrRequest` branch (`if request.level === 1 → apply diff to target checkout, commit, push, emit PRDraftReady{draftRef: commitSha}` ) on top of the existing Level 2 handler. Phase 1b (§13) adds this branch.

---

## 6. Approval discipline — trusted-mirror category + per-PR opt-in default

The autonomous-execution principle's gate (b) external-publish is the canonical reference: a PR to an *external repo* (any repo other than the current one the agent is operating in) is an external publish, and external publish requires user opt-in *unless* a pre-authorized policy specifies otherwise.

This RRP proposes three PR categories with different opt-in profiles:

### 6.1 `trusted-mirror` (pre-authorized policy)

A spec-mirror PR between two repos where the diff content is *already reviewed in the source repo* and the target is *the deterministic mirror surface* (a specific file in a specific repo). Example: EG `Constellation.md §13.14/§13.15` → `<hub-repo>` `WS-PROTOCOL.md` new section.

The pre-authorization lives in `state.json` (or a per-deployment policy file) as a list of source→target pairings:

```jsonc
{
  "pr_system": {
    "trusted_mirrors": [
      // open for main review — exact path format TBD
      "SoliEstre/EstreGenesis:Constellation.md§13.14-§13.15 → <hub-repo>:WS-PROTOCOL.md"
    ]
  }
}
```

The match key is `(sourceRepo, sourceContentRef) → (targetRepo, targetContentRef)`. When a `PRRequest` carries `category: 'trusted-mirror'` and the source→target pair matches an entry in this list, the PR is created without per-PR user prompt.

**Opt-in shape**: the user adds an entry to the trusted-mirror list once; subsequent PRs in that pairing flow without prompts. The user can revoke entries; removed pairings fall back to `standard` opt-in. Per-deployment policy may also rate-limit (e.g., "at most one trusted-mirror PR per source→target pair per 24h" to catch a runaway automation).

### 6.2 `standard` (per-PR user opt-in, the default)

Any PR not matching a trusted-mirror entry. The agent emits `PRRequest`, and the PR-bot's first action is to surface the request to the user via the live board's `decisions` panel (per §13.17 — decisions panel is the canonical user-attention surface for structured choices). The user explicitly approves; on approval, the PR is created.

This is the autonomous-execution gate (b) external-publish default — the user remains in the loop for any PR not pre-authorized via trusted-mirror.

### 6.3 `emergency` (out-of-band approval reference)

For hotfix PRs (e.g., a security patch that needs to mirror within the hour, faster than the user can respond on the board), the `PRRequest` carries an `emergency: true` flag *and* an `outOfBandApprovalRef` field (e.g., a board `decisions` panel message id the user has already approved out-of-band).

The PR-bot validates the `outOfBandApprovalRef` against the live board's `decisions` panel persistence (the approval must exist and must match the PR scope). If valid, the PR is created immediately; if invalid, the request is rejected with a `decisions`-panel surfacing for the user.

**Open question for main review** (§10 Q3): should `emergency` exist at all in v0.1, or should hotfix PRs route through the `standard` flow with an accelerated user-prompt cadence?

### 6.4 Where the line goes (open for main review)

The proposal: **for v0.1, only `trusted-mirror` and `standard` ship; `emergency` is deferred to phase 3.** Reasoning:

- `trusted-mirror` is the §9 dogfood requirement — it must ship.
- `standard` is the safe fallback that preserves the autonomous-execution gate semantics — it must ship.
- `emergency` is a power-user feature whose security model needs more design (out-of-band approval has a TOCTOU-style risk surface that's not worth dragging into v0.1).

Main upstream may steer the boundary.

---

## 7. Cross-repo content sourcing — three options

How does the PR-bot agent get the bytes for the PR diff? Three options:

### 7.α Inline diff in `PRRequest` payload

The requester computes the diff (against the target branch's HEAD) and sends the unified-diff bytes as part of `PRRequest.filesDiff`. The PR-bot reconstructs a temporary branch in the target repo, applies the diff, and creates the PR from that branch.

**Trade-offs**:

- **Pros**: simplest semantics — the wire carries the whole PR content; no separate repo access needed beyond the PR-bot's target-repo push permission.
- **Cons**: breaks at scale. The §13.13 / §2 wire is fine for small messages but the W20/W22 outbox split-delivery pattern surfaces at ~80KB+ payloads. A multi-file spec mirror (e.g., touching `Constellation.md` + `_lessons/*` + `seeds/*` in one PR) easily exceeds that. Suitable only for small diffs; not a general solution.

### 7.β Source-branch ref on source repo (initial v0.1 form)

The requester pushes a branch to the *source* repo (e.g., EG's `mirror/§13.14-§13.15-to-hub` branch) and sends the branch ref in `PRRequest.sourceContentRef`. The PR-bot reads the branch contents via the provider's git API (or `git fetch`) and either creates the PR from that branch directly, or pushes the branch contents to a target-side branch and creates the PR from there.

**Trade-offs**:

- **Pros**: works at any diff scale; reuses standard git/provider mechanisms.
- **Cons**: requires push access to the source repo (the requester has that for EG; needs to be checked for any other source-repo case); requires the PR-bot to have read access to the source repo (token scope expansion); the cross-repo provider-side authorization for "PR from source-repo branch into target repo" introduces complications when source and target are different orgs.

### 7.β′ Mirror branch on TARGET repo (Phase 1 ship form, adopted)

A variant of β: instead of pushing the branch to the source repo and having the PR-bot fetch cross-repo, the local-bridge pushes the source content directly to a `mirror/...` branch on the **target** repo, then opens the PR from that target-side mirror branch into the target's integration branch. The PR is effectively intra-repo at the provider level; no cross-repo provider authorization is required.

This is the form adopted by Phase 1 ship `2213a14`. Concretely, `handlePrRequest` (Level 2 path):

1. Reads the source content from the local-bridge's checkout of the source repo.
2. Pushes a `mirror/<topic>` branch to the *target* repo (using the operator's `gh` / `git` credentials for the target).
3. Invokes `gh pr create --repo <targetRepo> --base <targetBranch> --head mirror/<topic> ...`.
4. Emits `PRDraftReady` with the resulting PR number.

**Trade-offs**:

- **Pros**: avoids cross-repo provider-side authorization (the PR is intra-target at the provider tier); cleaner audit trail on the target repo (the mirror branch lives where the PR lives); works for any source/target org pairing; reuses the operator's existing target-repo credentials.
- **Cons**: requires push access to the target repo (the operator's `gh` credentials must cover the target); the mirror branch is a transient artifact on the target repo (cleanup policy needed — Phase 1 ship leaves the branch in place after merge, relying on provider auto-delete-head-branch settings).

### 7.γ Fork-based (standard GitHub workflow)

The requester pushes to their own fork of the target repo (a user-account fork of `<hub-repo>` or whatever the target is) and the PR-bot creates the PR from fork → target. Standard GitHub cross-repo PR workflow.

**Trade-offs**:

- **Pros**: matches the provider's intended workflow; no special permissions on the target repo beyond fork (which is open); audit trail is clean (fork owner is identified).
- **Cons**: requires the requester (or the requester's principal) to maintain a fork of every target repo; adds a sync step (the fork must be kept up to date with the upstream); more moving parts.

### 7.δ Recommendation — β′ primary (Phase 1 ship), α small-diff fallback

**Phase 1 ship `2213a14` adopted β′ as the primary Level 2 content-sourcing form.** This supersedes the v0.1 "β with α fallback" recommendation. Updated v0.2 recommendation:

- **Level 2: β′ as primary**; α fallback only for small Level 2 diffs (< ~50 KB) where direct payload transfer is simpler than mirror-branch push. β (source-repo branch) and γ (fork-based) are not used in Phase 1 / Phase 1b scope.
- **Level 1**: content sourcing is implicit — the receiving side reads from the source-content payload (either an inline `filesDiff` or a fetched source-repo ref the receiving side already has access to as part of its operator-shared filesystem). No mirror branch on the target repo is needed (the change goes straight to the integration branch on commit).

Rationale (β′ vs β): cross-repo provider authorization complications inherent to β (the PR-bot needs read access to the source repo's branch at the provider tier) are avoided by β′ (the source content lands on the target repo's own branch before `gh pr create`, making the PR intra-target at the provider level).

---

## 8. Authority + permission table extension to §13.20

The §13.20 permission table covers blocker tracking + nudge cadence. This RRP extends it with PR-lifecycle ops. Proposed additions (slot into the existing §13.20.5 table at joint formalization):

| Message type | Who may emit | Server filter / authority gate |
|--------------|--------------|--------------------------------|
| `PRRequest` | Any role (`main` / `collab` / `upstream` / `local`) | Server validates `sourceRepo` and `targetRepo` are in the deployment's known-repo registry; rejects targets outside the registry. For `level == 1`, server additionally validates the receiving side's capability matrix (direct push to target + operator-shared). |
| `PRDraftReady` | PR-bot agent (Level 2) OR receiving-side agent with target-repo push capability (Level 1) | Server validates the `for: msgId` references an actual `PRRequest` from a registered requester |
| `PRReviewAck` | Any agent with reviewer-role authority on the target repo (per §13.9 role table for that repo) | Server validates the emitter's role against the per-repo reviewer policy |
| `PRMergeRequest` | **Only** `role == main` for the target repo | Strict — server rejects emissions from non-main roles (Phase 1 ship `2213a14` `wsPrMergeReject` path); logged to `decisions` panel for audit on rejection |
| `PRMergeAck` | PR-bot agent (Level 2) OR receiving-side agent (Level 1) | Server validates `for: msgId` references an actual `PRMergeRequest` |
| `PRStatusUpdate` | PR-bot agent (Level 2) OR receiving-side agent (Level 1) | Server validates the emitter against the bot identity registry (Level 2) or the receiving-side capability matrix (Level 1) |

### 8.1 Cross-repo role mapping (open for main review)

A subtle case: when EG (whose `role == main` for the EG repo) issues a `PRMergeRequest` against `<hub-repo>` (where EG is a `peer/upstream` per §13.9, NOT `main`), the request must be **rejected** because EG is not `main` for the target. The merge authority on `<hub-repo>` rests with the `<hub-repo>` main-role agent (typically named `hub` or `main-prod` in the orchestration tree).

The cross-repo role mapping table (per-repo `role` value, not per-deployment):

| Repo | EG agent role | `<hub-repo>` main agent role |
|------|---------------|------------------------------|
| EG (`SoliEstre/EstreGenesis`) | `main` | `peer/upstream` |
| `<hub-repo>` | `peer/upstream` | `main` |

The role is **per-repo, not per-deployment**. This composes with §13.9's role-branching but adds a dimension: an agent's role is a function of (agent identity, target repo), not just (agent identity). The §13.22 permission table must encode this.

**Open question for main review** (§10 Q4): is per-repo role the right model, or should the protocol require a `PRRequest` to specify which agent on the target repo holds `main` and route `PRMergeRequest` to that agent explicitly?

---

## 9. State machine — 5-state PR lifecycle (level-discriminated)

The PR lifecycle is modeled as a 5-state machine. Both Level 1 and Level 2 traverse the same five logical states; transition triggers differ per level.

**Level 2** (the form shipped in Phase 1): transitions are driven by provider events (translated by the PR-bot / local-bridge into `PRStatusUpdate` emissions) and by review-authority emissions (`PRReviewAck`, `PRMergeRequest`). MERGED ≡ `gh pr merge` succeeded and the provider reports the PR as merged.

**Level 1** (Phase 1b path): transitions are driven entirely by A2A envelope events; there is no provider state to translate. `PRDraftReady` carries the staged commit SHA on the target checkout; `PRReviewAck` carries the verdict; `PRMergeRequest` triggers the receiving side to commit the staged change to the target's integration branch and push; MERGED ≡ the push succeeded and the integration-branch commit SHA is reported in `PRMergeAck`. CHANGES_REQUESTED in Level 1 loops back to the source agent updating its `sourceContentRef` (a new commit on the source side, communicated via a follow-up `PRRequest` with `for: previousDraftRef` linkage, or via an out-of-band update mechanism the v0.2 RRP leaves open for refinement).

```text
       PRRequest received
              │
              ▼
          DRAFT ──────────────────────────────────┐
              │                                   │
              │ (PR-bot creates PR on provider)   │ (request rejected — invalid /
              │                                   │  not authorized / fork failure)
              ▼                                   ▼
           OPEN                                CLOSED
              │
              │ (first reviewer engages)
              ▼
        IN_REVIEW ────────────────────────────┐
              │                                │
              │ (PRReviewAck approve)          │ (PRReviewAck request-changes)
              ▼                                ▼
         APPROVED ◄───────────────────── CHANGES_REQUESTED
              │                                │
              │                                │ (requester pushes follow-up commit;
              │                                │  PRStatusUpdate signals re-review needed)
              │                                ↑
              │                                └────────── (loop back to IN_REVIEW)
              │
              │ (PRMergeRequest from role==main + PRMergeAck success)
              ▼
          MERGED
```

Side paths: from any state, the PR can transition to CLOSED (closed without merge — e.g., superseded by another PR, or explicitly withdrawn by the requester).

### 9.1 Composition with §13.19 deadlock detection

A PR that stays in `IN_REVIEW` or `CHANGES_REQUESTED` beyond an SLA threshold without progress is a **quasi-deadlock candidate** per §13.19.2:

- `IN_REVIEW` for longer than the `PRRequest.slaEta` (or the deployment's default review SLA, ~24h-2-cycle per §13.19.4) without a `PRReviewAck` → the requester emits `BlockerNudge` per §13.20.4 targeting the reviewer (subject: reviewer agent id; reason: "PR #N awaiting review").
- `CHANGES_REQUESTED` for longer than the requester's stated follow-up SLA → the reviewer emits `BlockerNudge` targeting the requester.

Both directions reuse the §13.20 ladder (polite → explicit → deadline → human). A PR that escalates to §13.20 tier-4 routes to the board `decisions` panel (per §13.17) with `class: 'pr-stalled'` (extending §13.20.6's `EscalationRequest.class` enum).

### 9.2 Composition with §13.13 ack layer

Every PR-lifecycle emission gets server-auto `Ack{delivered}` per §13.13. The PR-bot's `PRDraftReady` IS the `AckProcessed` for the originating `PRRequest` (or, per §4.3 open question, `AckProcessed` is emitted first and `PRDraftReady` follows). `PRReviewAck` is the application-tier ack for the review request implied by the PR being in `IN_REVIEW`. The §13.13 conservative multi-probe + human-escalation tail applies if a `PRDraftReady` does not arrive within expected window — the requester `Ping`s the PR-bot, and if no `Pong`, escalates via `decisions` panel.

### 9.3 Live-board PR panel (open for main review — implementation ask)

Parallel to §13.20.7's blocker-manifest panel ask, this RRP proposes a **PR panel** on the live board surfacing the active PRs:

- Per-PR row: PR number · target repo · title · state (DRAFT/OPEN/IN_REVIEW/CHANGES_REQUESTED/APPROVED/MERGED) · age · last status update · current reviewer · escalation tier (if §13.20 ladder fired).
- Visual treatment matches §13.20.7: tier 1 neutral, tier 2 attention, tier 3 warning, tier 4 alert.
- Data source: the `PRStatusUpdate` snapshot stream from the PR-bot; the server persists the latest per PR; the panel reads from a new endpoint (`GET /api/prs` or equivalent).

Same sequencing rule as §13.20.7: the wire vocabulary lands first; the panel is the visualization upgrade. Until the panel ships, the human can observe PR state via `ws-history` directly.

---

## 10. Dogfood plan — §13.14 / §13.15 mirror as canonical first use case

The §13.22 protocol's **first production use** is the §13.14 / §13.15 mirror PR itself. This is explicit and non-negotiable: there is no "validate on a toy PR first" intermediate step.

**Level selection for the dogfood PR** (v0.2 addition): the dogfood PR is operated end-to-end by the same operator who runs both the EG repo and the `<hub-repo>`; both repos are directly accessible from the operator's local checkout. This satisfies the §2.4 Level 1 selection rule. Once Phase 1b ships the Level 1 path on the local-bridge, the dogfood PR is targeted as a **Level 1 mirror PR** — A2A envelopes only, receiving (= hub) side commits the §13.14/§13.15 mirror directly to the hub `WS-PROTOCOL.md` and pushes to the integration branch, no `gh pr create` involved. Until Phase 1b ships, the dogfood remains targeted as Level 2 (Phase 1 ship's existing path), at the cost of one extra provider-side PR object that will be merged through the provider's UI / API per the Level 2 sequence below.

### 10.1 Canonical first PR specification

- **Source repo**: `SoliEstre/EstreGenesis` (this repo — public).
- **Source content**: the bodies of `Constellation.md §13.14` (Reference-build redaction discipline) + `§13.15` (Reference-build syntax gate). Distilled per §13.14 itself (no env-token leaks); syntax-gated per §13.15 (no JSDoc traps).
- **Source branch**: `mirror/13.14-13.15-to-hub` (pushed to EG repo as the source-branch ref per §7.β).
- **Target repo**: `<hub-repo>` (the user's production hub — placeholder; real path lives in deployment policy).
- **Target branch**: `<hub-repo>`'s default branch (typically `main`).
- **Target content**: a new section in `<hub-repo>` `WS-PROTOCOL.md` mirroring the §13.14 + §13.15 bodies. The section number on the hub side is whatever the hub WS-PROTOCOL currently shows as the next-available (the hub may use a different numbering scheme than EG; the *content* is mirrored, not the section number).
- **Title**: `WS-PROTOCOL: add §X.Y/X.Z — Reference-build redaction + syntax gate (mirror from EG §13.14/§13.15)`.
- **Body**: provenance link back to EG `Constellation.md §13.14` + §13.15 commits; rationale (parity-of-safety-discipline gap); diff summary.
- **Labels**: `mirror`, `from-eg`, `protocol`.
- **Reviewers**: `<hub-repo>` main-role agent.
- **Category**: `trusted-mirror`.

### 10.2 Trusted-mirror policy entry

Before the dogfood PR fires, the user adds the trusted-mirror entry to `state.json` (or equivalent deployment policy file):

```jsonc
{
  "pr_system": {
    "trusted_mirrors": [
      "SoliEstre/EstreGenesis:Constellation.md§13.14-§13.15 → <hub-repo>:WS-PROTOCOL.md"
    ]
  }
}
```

This is a one-time setup; subsequent EG → `<hub-repo>` spec mirror PRs in the same pairing flow without per-PR prompts.

### 10.3 Sequence

1. EG agent confirms §13.14/§13.15 are in EG `Constellation.md` and passes the §13.14 redaction grep + §13.15 `node --check` gates.
2. EG agent pushes `mirror/13.14-13.15-to-hub` branch to EG repo with the mirror diff staged on top of the `<hub-repo>`'s `WS-PROTOCOL.md` HEAD.
3. EG agent emits `PRRequest { sourceRepo: EG, sourceBranch: mirror/13.14-13.15-to-hub, targetRepo: <hub-repo>, targetBranch: main, title, body, category: 'trusted-mirror', reviewers: [<hub-main>] }`.
4. Local-bridge (topology b) receives the `PRRequest`, validates the trusted-mirror entry, invokes `gh pr create` against `<hub-repo>`, emits `PRDraftReady { prNumber, prUrl, ... }` back to EG.
5. `<hub-repo>` main-role agent (or the user, if no hub-main is online) reviews the PR. On completion: `PRReviewAck { verdict: 'approve', ... }` to EG.
6. `<hub-repo>` main-role agent (or the user) emits `PRMergeRequest { mergeStrategy: 'squash' }`. Local-bridge invokes `gh pr merge`; `PRMergeAck { success: true }` flows back.
7. `PRStatusUpdate { state: 'merged' }` broadcast to all watchers; live-board PR panel reflects merged state; EG's deferred work parked on this blocker (per §13.20) clears.

### 10.4 Success criterion

The PR is created via the §13.22 A2A PR System protocol (not by manual user action in the GitHub UI), reviewed via `PRReviewAck`, merged via `PRMergeRequest` / `PRMergeAck`. The user's role is limited to: (a) one-time trusted-mirror policy entry (§10.2), (b) optionally observing the live board PR panel during the lifecycle, (c) being available if the §13.19 / §13.20 escalation tiers fire (which, for a clean dogfood pass, they should not).

If any step requires manual user PR-UI interaction, the dogfood has not validated the protocol. Iteration is expected; the §12 phase 1 prototype is the right place for iteration; the §12 phase 2 dedicated PR-bot is the right place for the steady-state.

### 10.5 Failure modes the dogfood will surface

(Listed so they are looked for, not hidden):

- Topology-b authentication scope mismatch (`gh` CLI authed for EG but not `<hub-repo>`, or scoped to a token that lacks PR-create permission).
- `PRRequest` payload size (the §13.14 + §13.15 bodies are ~3KB combined — small enough to use option α inline-diff per §7, or option β with branch ref — but the mirror PR may also touch related files that grow the diff).
- `<hub-repo>` `WS-PROTOCOL.md`'s exact section-numbering policy (the hub may need a manual section-number assignment that the trusted-mirror automation does not know about).
- Cross-repo role mapping (§8.1) edge cases — does the EG agent's `role == main` on EG correctly demote to `peer/upstream` when issuing `PRRequest` against `<hub-repo>`?

Each surfaced failure becomes a §13.22 sub-section refinement or a §10 open question's resolved answer.

---

## 11. Open questions (main upstream review required)

Items where the EG-side draft has a working position but main upstream's reaction is load-bearing. The top 3 are flagged as **priority** — these are the questions where main's answer most shapes the rest of the protocol.

### Q1. **(priority — RESOLVED)** Topology — local-bridge `cmd:createPR` accepted

**Resolved**: Phase 1 ship `2213a14` adopted topology (b) — local-bridge runs in the operator's IDE process and uses the operator's `gh` CLI authentication. PRs created under the operator's `gh` CLI identity are accepted as legitimate by the cross-repo target. No separate bot identity is required for Phase 1 / Phase 1b scope.

**Downstream effect**: §5.d recommendation confirmed as the adopted form. Credential-management RRP deferred to phase 2 (only needed if cross-machine or separate-identity requirements appear).

### Q2. **(priority — RESOLVED)** Content-sourcing — β′ adopted (mirror branch on target repo)

**Resolved**: Phase 1 ship `2213a14` adopted β′ (a variant of β: the local-bridge pushes the source content to a `mirror/...` branch on the **target** repo, not the source repo). Rationale: cross-repo provider-side authorization complications inherent to β (the PR-bot needs read access to the source repo's branch at the provider tier) are sidestepped by β′ — the source content lands on the target repo's own branch before `gh pr create`, making the PR intra-target at the provider level.

**Downstream effect**: §7 updated — β′ is the primary Level 2 form; α remains a small-diff fallback; β and γ are not used in Phase 1 / Phase 1b scope.

### Q3. **(priority — RESOLVED)** Authority model — strict `role == main` gate adopted

**Resolved**: Phase 1 ship `2213a14` adopted the strict gate. The server's `wsPrMergeReject` path enforces "only `role == main` on the target repo may emit `PRMergeRequest`" — emissions from non-`main` roles are rejected at the server with a logged `decisions` panel entry. The protocol's authority chain is deterministic and independent of provider ACL drift.

**Downstream effect**: §4.4 wire vocabulary, §8 permission table, and §10 dogfood step 6 (Level 2 path) all confirmed as the strict-gate form. The per-repo role model (Q4 below) remains the open dimension; the strict-gate decision composes either way.

### Q4. Per-repo role vs per-deployment role

§8.1 proposes per-repo role (an agent's role is a function of agent identity AND target repo). The alternative is per-deployment role (an agent has one role globally, and cross-repo authority is encoded separately as ACL). The per-repo model composes more naturally with §13.9 but expands the role-table dimensionality.

**Main's answer steers**: §13.9 cross-link in §13.22; whether the §13.9 role table itself needs an extension or only §13.22's table.

### Q5. `emergency` category — does v0.1 include it?

§6.4 recommends deferring `emergency` to phase 3. The alternative is to include it now with a tighter security model (e.g., require the `outOfBandApprovalRef` to be cryptographically signed). If `<hub-repo>` operations have any hotfix scenarios that v0.1 needs to support, `emergency` may be forced into v0.1 scope.

**Main's answer steers**: §6 categories; §12 phase scope.

### Q6. Two-ack vs one-ack on `PRReviewAck` (§4.3 open question)

§4.3 recommends two-ack (`AckProcessed` from PR-bot on request parse + `PRReviewAck` from reviewer on completion). The alternative is one-ack (`PRReviewAck` carries both semantics). The two-ack proposal preserves §13.13's three-grade taxonomy cleanly; the one-ack proposal is leaner on the wire.

**Main's answer steers**: §4.3 vocabulary; §13.13 cross-link semantics in §13.22.

### Q7. Live-board PR panel — separate panel or extension of existing panels?

§9.3 proposes a separate PR panel parallel to §13.20.7's blocker-manifest panel. The alternative is to fold PR rows into the blocker panel (since a stalled PR IS a blocker per §9.1). Folding reduces panel proliferation; separating gives PR state its own visual surface.

**Main's answer steers**: live-board UX; `app.js` impl scope.

### Q8. Trusted-mirror policy path format

§6.1 sketches the trusted-mirror entry format (`source-repo:source-content-ref → target-repo:target-content-ref`). The exact path format (file-level? section-level? line-range?) is open. Section-level is what the §10 dogfood needs; line-range may be overkill; file-level may be too coarse.

**Main's answer steers**: `state.json` schema; §6.1 wire shape.

---

## 12. Acceptance criteria — when does §13.22 ship?

The §13.22 protocol is considered shipped when:

### 12.1 Spec criteria

- **AC-spec-1**: §13.22 sub-section authored in `Constellation.md`, cross-linked to §13.9 / §13.11 / §13.13 / §13.17 / §13.19 / §13.20, passes §13.14 redaction grep + §13.15 syntax gate.
- **AC-spec-2**: Permission table in §13.22 (parallel to §13.20.5's table format) covers all five `CUSTOM` types from §4 with explicit who-may-emit + server-filter columns.
- **AC-spec-3**: Open questions §11 Q1-Q3 (priority) have resolved answers from main upstream review; non-priority Q4-Q8 may be deferred to follow-on RRPs.

### 12.2 Implementation criteria

- **AC-impl-1**: Local-bridge `createPR` command implemented (topology b per §5.d) — adds one new command to `local-bridge.eux`, one provider CLI invocation, emits `PRDraftReady` per §4.2.
- **AC-impl-2**: Server-side validation of the five `CUSTOM` types per the §8 permission table — server rejects emissions from unauthorized roles, logs to `decisions` panel for `PRMergeRequest` rejections per §4.4.
- **AC-impl-3**: `state.json` schema extended with `pr_system.trusted_mirrors[]` per §6.1.
- **AC-impl-4**: PR state machine (§9) implemented in the local-bridge — `PRStatusUpdate` emissions cadence-matched to §13.20.4 cycle threshold; §13.19 / §13.20 escalation paths fire correctly on SLA breach.

### 12.3 Dogfood criteria

- **AC-dogfood-1**: The §10 §13.14/§13.15 mirror PR is created via `PRRequest` (not via manual GitHub UI action by the user). User involvement limited to §10.4's three roles (trusted-mirror policy entry; live-board observation; escalation availability).
- **AC-dogfood-2**: The PR is reviewed via `PRReviewAck` (not via a manual GitHub UI review by the user).
- **AC-dogfood-3**: The PR is merged via `PRMergeRequest` / `PRMergeAck` (not via a manual GitHub UI merge by the user).
- **AC-dogfood-4**: §13.14 + §13.15 land in `<hub-repo>` `WS-PROTOCOL.md` (the actual parity-gap closure — the protocol's value is realized).
- **AC-dogfood-5**: A retrospective writeup (this doc's `<scope-root>/_lessons/`) catalogs any failure modes surfaced in §10.5 with each one's resolution path.
- **AC-dogfood-6 (Level 1)**: The first Level 1 mirror PR (EG → `<hub-repo>` `WS-PROTOCOL.md` §13.14/§13.15 mirror) succeeds end-to-end via A2A envelopes only — receiving (= hub) side directly applies the change to its local checkout of the target repo, commits, pushes to the integration branch, and reports the resulting commit SHA in `PRMergeAck`. No `gh pr create` is involved. Phase 1b dependency.

### 12.4 Composition criteria

- **AC-compose-1**: A PR stalled in `IN_REVIEW` correctly fires §13.20 `BlockerNudge` cadence (verified by intentionally stalling a test PR past SLA and observing the nudges).
- **AC-compose-2**: A PR escalating to §13.20 tier 4 correctly routes to the `decisions` panel with `class: 'pr-stalled'`.
- **AC-compose-3**: A `PRMergeRequest` from a non-main role is rejected by the server and logged to `decisions` panel per §4.4.

All criteria must be met for §13.22 to be considered shipped. Partial completion (e.g., spec + impl but no dogfood) is an *interim* state, not a ship — the dogfood is the validation, not an afterthought.

---

## 13. Migration path — phased rollout

### Phase 0 — RRP review (current state)

- This document published at `constellation/reference/docs/2026-06-01-a2a-pr-system-rrp.md`.
- Main upstream review requested via outbox `Delegate` carrying this doc's reference + the §11 priority open questions.
- Joint formalization step: §11 Q1-Q3 answers resolve; §13.22 number assigned; the doc moves from RRP to spec.

**Exit criterion for phase 0**: §11 Q1-Q3 have answers from main; the joint-spec draft of §13.22 is ready for `Constellation.md` insertion.

### Phase 1 — Prototype (Level 2, local-bridge `createPR`) — DONE

**Shipped: commit `2213a14`** (Phase 1 upstream main ship).

Components delivered:

- `server.cjs`: `_PR_CUSTOM` 5-type observer set covering all five `CUSTOM` types from §4; `wsPrMergeReject` strict `role==main` gate (§8 permission table); `PRStatusUpdate` observer.
- `local-bridge`: `handlePrRequest` (trusted-mirror validate → β′ mirror branch push to target repo → `gh pr create` against target → `PRDraftReady` with PR number); `handlePrMergeRequest` (`gh pr merge` → `PRMergeAck` with provider state).
- `state.json`: `pr_system.trusted_mirrors` registry extended per §6.1.
- Dry-run default: `CONSTELLATION_PR_LIVE` env knob OFF — Phase 1 ships with PR creation gated behind explicit opt-in; turning the env knob ON enables live provider-side PR creation. This is the autonomous-execution external-publish gate (b) instantiated as an env-level safety.

Phase 1 implements **Level 2 only**. Level 1 path is the Phase 1b add-on.

### Phase 1b — Level 1 path (virtual PR via A2A envelopes) — PENDING

- Extend `local-bridge` `handlePrRequest` with a Level 1 branch: when `PRRequest.level == 1`, skip `gh pr create`; instead apply the source diff to the target repo's local checkout, stage a commit, and emit `PRDraftReady` with `draftRef: <commit-sha>`.
- Extend `handlePrMergeRequest` with a Level 1 branch: when the originating `PRRequest.level == 1`, the merge operation is "push the staged commit to the integration branch on the target repo's local clone and emit `PRMergeAck` with the integration-branch commit SHA + push success."
- Server-side: validate `PRRequest.level` field; for `level == 1`, validate the receiving side's capability matrix (direct push to target + operator-shared).
- Dogfood: re-run the §10 §13.14/§13.15 mirror PR as a Level 1 PR. This sub-phase ends when AC-dogfood-6 passes.

**Exit criterion for phase 1b**: Level 1 dogfood PR succeeds end-to-end via A2A envelopes only; no `gh pr create` invoked; receiving side reports integration-branch commit SHA in `PRMergeAck`.

### Phase 2 — Dedicated PR-bot agent (topology a, optional)

- If §11 Q1's answer is "yes, separate bot identity required," this phase activates immediately after phase 1.
- Implement a dedicated `pr-bot` agent with its own credential store (token rotation, secret-management hygiene per a separate credential-RRP that is a prerequisite for this phase).
- Migrate the §10 dogfood pairings to the dedicated agent; the local-bridge `createPR` becomes a fallback for local-only PRs (topology c hybrid).

**Exit criterion for phase 2**: cross-machine PR creation works (the user's local machine is not required to be online for a PR to flow); credential rotation has been exercised at least once.

### Phase 3 — Full §13.20 integration + advanced features

- §6 `emergency` category if main's §11 Q5 answer requires it.
- Live-board PR panel implementation (§9.3 ask routed to `app.js` / `server.cjs` / `style.css`).
- §7 option γ (fork-based) support if needed for repos beyond `<hub-repo>`.
- Cross-link audit: every §13.x section that touches "external work" or "review" should mention §13.22 if applicable; the §13.20 blocker-manifest UI surfaces PR-stalled blockers with first-class treatment.

**Exit criterion for phase 3**: the §13.22 protocol is the *default* path for cross-repo PRs in the Constellation deployment; manual PR creation is the exception, not the rule.

---

## 14. Cross-links to existing §13 sections

- **§13.9 (OnboardAck role branching — collab/upstream are peers)** — the §4 wire vocabulary's authority gates (especially `PRMergeRequest` strictness) depend on per-repo role mapping (§8.1). The per-repo role model proposed here is an extension to §13.9's per-deployment role; main upstream review of Q4 decides whether §13.9 itself gets the extension or only §13.22's local interpretation.
- **§13.11 (Board emission discipline)** — every PR-lifecycle emission is a board "safe point" and MUST be emitted to the board, not bilateral-only. `PRStatusUpdate` is the periodic emission; the §13.11.2 autonomous-heartbeat ban does NOT apply (same exception class as §13.19 / §13.20 — emissions fire on actual lifecycle events).
- **§13.13 (A2A ack layer)** — the substrate. Every §13.22 emission gets server-auto `Ack{delivered}`; the §4.2 `PRDraftReady` / §4.3 `PRReviewAck` either compose with §13.13's `AckProcessed` (two-ack proposal, Q6) or absorb it (one-ack proposal). The §13.13 conservative multi-probe + escalation tail applies to all §13.22 wait windows.
- **§13.14 (Reference-build redaction discipline)** — this RRP follows §13.14 in its own text (no env-token leaks; `<hub-repo>` placeholder for the production repo). The §10 dogfood PR is the *first artifact* the §13.22 protocol mirrors per §13.14 discipline, closing the parity gap §2.2 names.
- **§13.15 (Reference-build syntax gate)** — the §10 dogfood PR is the *second artifact* the §13.22 protocol mirrors. Together with §13.14, this is the canonical pairing.
- **§13.17 (Main-chat structured-choice prompts FORBIDDEN — route via board)** — `PRRequest` of category `standard` surfaces user-approval via the `decisions` panel (§13.17 path), NOT via inline `AskUserQuestion`. Tier-4 PR-stalled escalations (§9.1) also route via `decisions`.
- **§13.18 (Non-branching choices — recommend + proceed)** — the §9 state-machine transitions are non-branching for the typical case. An agent receiving `PRReviewAck { verdict: 'request-changes' }` does NOT ask the user "should I address the feedback?" — addressing the feedback IS the recommendation; the agent proceeds and pivots only if the user steers.
- **§13.19 (Deadlock resolution)** — a PR stuck in `IN_REVIEW` past SLA is a §13.19.2 quasi-deadlock candidate. The §13.19.7 `ReviewSLAAck` is the correct response shape (the reviewer commits to an ETA); the §13.19.6 resolution ladder applies if the SLA is not met.
- **§13.20 (Blocker tracking + periodic nudge discipline)** — a PR-stalled blocker IS a §13.20 blocker. The `BlockerManifest` entry carries `subject: <reviewer-agentId>`, `reason: "PR #N awaiting review"`, `eg_side_action_waiting: "follow-up work parked behind this merge"`. The §13.20 nudge ladder applies directly; tier-4 escalations carry `class: 'pr-stalled'`.
- **§13.21 (Fresh-context defer is an anti-pattern)** — a PR-creation task does NOT get deferred to "next session." When the §13.16.6 turn-end ritual identifies a PR-creation task as progressable, the agent emits `PRRequest` in the current turn.

---

## 15. Tone & invariants

This is a **discipline + mechanism** proposal, not a rule of nature. The Constellation A2A wire + §13.13 ack layer + §13.9 role model together make cross-repo PR coordination *possible*; §13.22 is the discipline + wire vocabulary that makes it *operative* at the cross-repo coordination layer. The mechanism (the five `CUSTOM` types, the state machine, the PR panel) is the *what*; the discipline (trusted-mirror category, per-PR opt-in default, §13.19 / §13.20 escalation composition) is the *how*.

The §13.22 protocol does NOT:

- Land code without a human (or main-role agent) in the loop.
- Bypass the autonomous-execution principle's external-publish gate (gate (b) — instead, it provides a structured way for some PR categories to be pre-authorized once and flow without per-PR prompts).
- Replace `gh` / git / provider tooling — it composes with them.

The §13.22 protocol DOES:

- Eliminate the user's manual PR-UI step for trusted-category PRs.
- Surface PR lifecycle as A2A wire vocabulary so the live board + ack discipline + deadlock detection + blocker tracking all compose over PR state.
- Make cross-repo spec parity (the §13.14/§13.15 gap and its successors) a low-friction lane instead of a per-event chore.

---

*End of v0.2 DRAFT. Priority open questions Q1 (topology) / Q2 (content-sourcing) / Q3 (authority model) resolved by Phase 1 upstream ship `2213a14` (Level 2 path — local-bridge `cmd:createPR`, β′ mirror branch on target repo, strict `role==main` merge gate). Phase 1b (Level 1 virtual-PR path on local-bridge) pending main implementation; AC-dogfood-6 is the Level 1 dogfood acceptance criterion. Non-priority Q4-Q8 remain open. Joint-formalization target: §13.22 sub-section in `Constellation.md`, number to be confirmed at merge time.*
