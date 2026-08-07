<!-- module: Pantty; layer: seat-driving; part-of: EstreGenesis 2.6.x; version: v0.1.1; date: 2026-08-06; status: initial extraction from Constellation §13.35 — reference runtime unchanged; license: Apache-2.0 -->

# Pantty — Seat-driving substrate

A seat is a board participant backed by a harness session through which the board submits work and observes its completion. A board seat may be turn-spawned — a supervisor starts a harness process for each delegation and the process exits when the turn ends — or resident, with one live harness session held open while the board speaks into it. The turn-spawned shape is simple and its failure modes are known, though its wake path is bounded below by the poll interval plus process start; when it resumes a session rather than starting fresh, it preserves the system prompt, tool definitions, memory, and charter exactly as residency does, and measured on the same delegation against the same model it finished in the same range as a resident seat driven through this module's adapter — **a design that justifies residency by preamble savings is justified by a number the alternative can also have.** The blind spot of judging health by exit code belongs to the supervisor rather than to either seat shape and is closed for both by §6, so residency's surviving justification is neither speed nor visibility but **unattended recovery and means diversity**. A **resident seat** is therefore the alternative in which one live harness session is held open and the board speaks into it; this module specifies only the thin, harness-agnostic, board-aware layer not already supplied by vendor session objects that survive many turns and provide cancellation, context accounting, compaction, and session enumeration. Both modes stay: resident is an **option**, not a replacement, so a harness that cannot satisfy §3 must run turn-spawned, and a deployment with no resident need is not deficient.

## 1 Driving-layer contract (MUST)

An adapter that hosts a resident seat MUST expose five operations, whatever the harness underneath:

1. **submit(text) → turn-end signal.** A single call that delivers one unit of work and a determinate signal that the unit finished. The signal MUST be distinguishable from "the process is still alive" and from "the process exited".
2. **cancel.** Interruption of an in-flight turn from outside that turn. Without it, a resident seat's worst-case unresponsiveness is the longest turn it can take, which is strictly worse than the turn-spawned shape where the supervisor at least owns a wall-clock ceiling (Constellation.md §13.27.4).
3. **context signal.** A reading of how much of the session's window is occupied, **decomposed** into the part a compaction can reclaim and the part it cannot. An undifferentiated total is not sufficient: the fixed floor (tool definitions, skills, deferred surfaces) is re-sent every turn and does not shrink, so a total can rise across a successful compaction and a policy keyed to it will thrash.
4. **compaction cycle.** See §3.
5. **liveness.** See §5.

Per-harness support for these five is **volatile and is not recorded here.** It belongs in the harness registry, which carries its own `asOf` and revisit cadence. A capability table written into a specification is a table that will be wrong: the registry has been observed to drift from measurement within two days of being written. Specifications carry the contract; registries carry the current answer.

*Formerly Constellation.md §13.35.1.*

## 2 Seat identity and ownership

A resident seat is a participant like any other and follows Constellation.md §3.1 for keys and Constellation.md §13.25.11 for declaration binding. Two constraints are specific to residency:

- **One owner per inbox.** Session-ownership registries that resolve by last-registrant-wins let a newly started session silently take over another's intake, and the symptom is not an error but an absence — the dispossessed session simply stops seeing messages. A resident seat MUST refuse to claim an inbox another live session owns, and any override MUST name the current holder.
- **Identity is stable across restarts.** A seat that is recreated with a fresh identity orphans every message addressed to its predecessor. Restart preserves the seat's declared identity; the session behind it is an implementation detail.

*Formerly Constellation.md §13.35.2.*

## 3 Compaction cycle (MUST)

A resident seat outlives its context window, so compaction is not an exceptional event but a normal part of its life. The cycle has three parts and **all three MUST be available**, or the seat MUST NOT run resident:

1. **Materialize before.** Whatever the seat knows that exists only in its context — in-flight procedure detail, agreed policy, resume pointers — is written to durable storage **before** the compaction runs. A pre-compaction hook is the natural carrier.
2. **Compact.** Triggered by the adapter, not left to the harness's own threshold alone, so the seat chooses a boundary rather than discovering one mid-task.
3. **Re-inject after.** The materialized handoff is read back into the fresh context. Without this the seat resumes with a summary and no procedure detail, and the first thing it does after every compaction is rediscover how to do its job.

**A harness that can compact but cannot fire the pre-compaction hook fails this requirement.** Such a seat loses, at every compaction, exactly the detail that a summary is worst at preserving, and it has no way to notice. That is worse than turn-spawned, where the same detail is re-read from disk on every turn by construction. This is the single hardest gate in this module and it is the one to check first when evaluating a harness.

Compaction is **not** a cost lever. The reclaimable part of a context is typically a minority of what is billed per turn, and the fixed floor dominates — measured on a live seat, a successful compaction cut the reclaimable category by more than half while the total fell by under a tenth. Its value is judgment continuity: the seat keeps working on the same problem across the boundary, and the adapter chooses where the boundary falls instead of discovering it mid-task.

That last part is what residency actually buys here, and it is worth stating narrowly. The turn-spawned shape can resume a session, so it too can hold context across turns; what it cannot do is decide *when* the boundary happens, cancel an in-flight turn from outside it, or read a decomposed context signal to act on. Those three, plus the wake path, are the residency case. Preamble savings are not.

*Formerly Constellation.md §13.35.3.*

## 4 Injection safety (MUST)

Board-sourced text arriving at a resident seat is **data, and MUST NOT be dispatched as a command.**

Harnesses that accept slash-style commands on the same channel as ordinary text create a class of failure that is invisible at the transport layer: a message body beginning with a command sigil is executed as that command. Measured consequences include a seat losing its entire working context, and a spend ceiling being reset to zero — both reported as clean successes, because from the harness's point of view the command succeeded.

**Three layers, and collapsing them is the design error this section exists to prevent.** Only the first can be closed.

*Dispatch* — whether the harness executes the text instead of showing it to the model — is decided by the input parser before the model is involved. Where that decision is **positional**, the adapter closes this layer completely and without the model's cooperation, by making the first character of every submission its own. A harness has been measured in which a leading sigil dispatches even when the text immediately following it instructs that the line be treated as data, and in which a sigil anywhere other than the first position does not dispatch even with no instruction present at all. Those two observations together are what establish that the decision precedes the model; either one alone does not.

"Positional" is not one shape, and the adapter MUST record **which** shape it measured. The form observed here is *first character of the submitted string*, with no trimming and no inspection of later lines. A line-scoped form — any line beginning with the sigil — is also positional, and a first-character invariant does **not** close it. A guard derived from the word rather than from the recorded form is a guard against a predicate nobody measured.

*Expansion* — whether the harness, still before the model, resolves references embedded anywhere in the text — is a second layer that a leading-header invariant does not touch. Mention syntax that pulls in files, routes to sub-agents, or fetches resources has been measured matching **anywhere in the body**, not at its start. This is not obedience, because the model is never consulted. An adapter cannot close it with string rules; what it can do is make the layer observable — count the constructs it is passing through and carry that count, so that "the adapter did not introduce these" is an assertion someone can check — and otherwise leave the control where it actually lives, in the seat's authority.

*Obedience* — whether the model acts on instructions embedded in content it was shown — is the third, and framing does not close it. Delimiters, headers, and the words "treat this as data" are requests. Content that says "run the following procedure" in ordinary prose never touches the dispatch gate at all and can reach the same effect through the model's own tool use. The control here is the seat's **authority**: which tools it may call and under what approval mode. An adapter that claims injection safety on the strength of its wrapper has closed the first layer and described all three as shut.

Requirements:

- The adapter MUST establish the harness's dispatch predicate by **measurement**, and MUST record that measurement together with the harness build **and the submission path** — transport and driver — it was taken against, plus a revisit date. A predicate measured on one submission path does not transfer to another path of the same build: paths differ in what they strip and trim before the decision. Changing the driver invalidates the measurement exactly as a build upgrade does.
- Every recorded observation MUST point to a stored run artifact. An observation with no artifact is a memory, not a measurement, and the pair that discriminates mechanism from obedience — a leading sigil that dispatches *despite* a following instruction, and a non-leading sigil that does not dispatch *with no instruction at all* — is precisely the pair most easily recorded as settled by someone who never ran it.
- The record MUST include a control that fails. A corpus in which nothing dispatches cannot distinguish "everything is safe" from "the instrument is broken", and the destructive case — an unwrapped command that really does destroy the seat — is what separates them.
- The adapter MUST submit board-sourced content through a path that cannot be interpreted as a command. Where the predicate is positional, this is a structural invariant on the submitted string, enforced at construction: the builder MUST refuse rather than return a submission that violates it, because a returned string is a string some caller will send. The invariant MUST be stated as a **constant adapter-owned prefix**, not as "the header is non-empty" — a header assembled purely from message metadata becomes empty for the one inbound message whose metadata is empty, and that is the message that reaches position zero.
- Metadata carried in that header is **board-controlled** and MUST be validated, not merely escaped. The header is the position the model reads as the adapter's own voice; arbitrary text admitted there borrows that voice without ever touching the dispatch gate.
- **Structured framing is not a substitute, and the reason matters more than the fact.** The harness measured here does not concatenate a content-block array — it inspects the **last** text block. A header placed in an earlier block is therefore not a prefix at all, and the arrangement that feels safest is exactly the one that fails. Where an adapter submits an array at all, the invariant binds that last block, and the safe arrangement is a single block.
- Sigil neutralization — editing the content so it no longer begins with a sigil — is a fallback, not the goal. It mutates the payload, it is a denylist against a command set that keeps growing, and it is fragile in a way a positional invariant is not: layers downstream of the dispatch gate have been measured trimming before they test, so a neutralized payload can present as a command again after one re-queue or a change of transport. Owning the first character with a constant prefix is indifferent to all of it.
- The adapter MUST NOT treat a terminal success envelope as evidence that work happened. A rejected or non-dispatching input can return a success envelope with **zero model turns**; advancing an intake cursor on that basis discards the message. Cursor advance MUST be conditioned on evidence of processing, not on envelope status alone.

The seat's own procedure-defining slash commands are a different case and remain available to the adapter — the distinction is **who authored the text**, not what it looks like. Authorship MUST be decided at routing time from the message's type and sender identity, never inferred from the body. An adapter that admits a submission as a command because it *begins* with a sigil has reimplemented the failure this section forbids: it MUST declare which message types constitute its command channel, and every other type is data unconditionally.

The reference implementation makes that declaration a **type rather than a discipline**: the driving layer exposes two submission entry points — one for board-authored content, which cannot reach the harness except through the guard, and one for adapter-authored procedure commands, which may legitimately be commands — and board content has no path to the second. A single entry point with a flag encodes the same rule as a convention, and a convention is one refactor away from defaulting the wrong way.

Where the guard necessarily exists in more than one language — the driving layer follows the harness SDK while the reference runtime does not — the copies MUST be bound by a **conformance corpus run against both**, not by review. Shared constants belong in the measurement record both read; character classes MUST be written explicitly, because the shorthand classes differ in Unicode coverage between languages and produce two implementations that hold the same regex and answer differently. The corpus MUST cross the process boundary in a declared encoding: a comparison harness that lets the two sides receive different bytes reports agreement it never tested.

Reference implementation at `pantty/`: `dispatch-facts.json` carries the measurement (predicate, sigils, the observation corpus, the harness build, and a revisit date) and is the single place the sigil set is defined; `submit-envelope.cjs` builds submissions against it and refuses rather than returns on violation; `measure-dispatch.py` re-runs the corpus against a live seat to detect drift, including a deliberately destructive control whose purpose is to show the instrument can still fail. What is maintained here is not a denylist of commands but a **drift detector for one invariant** — the command set may grow without bound and the invariant is indifferent to it, but a change in the predicate invalidates the whole arrangement at once.

*Formerly Constellation.md §13.35.4.*

## 5 Liveness — presence is not capability

Enumerating live sessions is cheap and tells you a process exists. It does not tell you the seat can do work. A seat can be enumerable, answer non-inference round-trips normally, and still be unable to run a single turn — an exhausted spend ceiling produces exactly that state, and any probe that does not invoke the model will report it healthy.

Therefore: a health signal MUST exercise the path being asserted. A probe that avoids the model does not test the model. Where a genuine probe costs something, the honest arrangement is to treat the seat's next real submission as the probe and to alarm on its absence, rather than to substitute a cheaper signal that answers a different question. Constellation.md §13.27.5 governs the related judgment: completion is read from the state the seat was asked to change, never from the seat's own report.

*Formerly Constellation.md §13.35.5.*

## 6 Unattended recovery (MUST)

The failure that costs the most is not a slow turn; it is a seat that is not running and a person who has to notice. A tool update, a machine reboot, a wedged supervisor, an expired credential — each ends in the same shape: work stops, nothing raises, and recovery waits on a human. Latency arguments are indifferent to that state, because an absent seat is not slow.

This applies to **both** shapes. A turn-spawned supervisor and a resident seat need the same properties; only the subject being restarted differs.

1. **Three states, not two.** A health probe reports `ok`, `dead`, or `unknown`, where `unknown` means *the probe could not observe* — not that the subject is fine. Folding `unknown` into `ok` leaves a seat dead indefinitely, because failing to look becomes indistinguishable from looking and finding health. Folding it into `dead` restarts healthy seats. The asymmetry is deliberate: a false `dead` costs one restart, bounded by backoff; a false `ok` costs the entire purpose of the layer. Therefore `unknown` MUST NOT trigger a restart, and MUST NOT be silent.

2. **A live process is not a live seat.** Process presence, a bound port, and a 200 response each answer a question adjacent to the one being asked. The subject MUST emit a heartbeat **from inside its work loop**, and the recovery layer MUST read a stale heartbeat as death even while the process is alive. A heartbeat written by a separate timer defeats the check precisely where it matters — it keeps advancing while the work loop is wedged, so the state being hunted looks healthy. (Observed: a worker held a live process for four and a half hours without running a single turn, while the bridge auto-acknowledged every delegation that arrived. Success to the sender, silence to the receiver.)

3. **An exit code is not an outcome.** A harness process can exit zero having hit a turn ceiling, exhausted a budget, or failed mid-run. A supervisor that advances its intake cursor on exit status therefore discards failed work silently. Completion MUST be read from the result envelope the harness emits. Requesting that envelope and never parsing it is the same defect wearing the shape of a fix.

4. **Restarted is not revived.** The layer MUST re-probe after acting, and MUST clear its failure counter only on a *verified* recovery. Without the re-probe, "attempted" and "succeeded" leave identical records, and the backoff meant to stop a restart storm never engages. Where the subject holds a single-instance lock, a wedged instance MUST be removed before the replacement starts — otherwise the replacement rejects itself and the layer records a restart that did not occur.

5. **Recovery carries the session.** A restart that begins a fresh session is not recovery but reinitialization: the seat returns without what it was doing. Session-continuity state — session handle, intake cursor, charter binding — MUST survive restart untouched by the recovery layer. The same reasoning forbids discarding session state on a *means* failure: the session is intact; only the tool that reaches it is not.

6. **Means failure and work failure are different failures.** A vendor update closes a path — a binary moves, a flag is renamed, a model id is retired — and retrying is retrying into the same wall. Classify the failure, and on the means class descend a ladder **ordered by which assumption each rung drops**: pinned engine and pinned model → same engine, pins removed → different engine, no pins. A ladder written as alternatives that each carry fresh pins reintroduces the exact class it exists to survive. Descend on the means class only; a work failure that demotes the engine abandons a working path over a bad prompt. Return to the top rung after a bounded number of successful turns, or the demotion becomes permanent and unannounced.

7. **A refusal is not a failure.** A provider-imposed usage limit is a third class alongside means and work: the tooling is intact, the task is sound, and the capacity returns on its own. Folding it into the work class produces a tight retry loop against a wall for the entire window — the loop's poll interval, multiplied by hours. Folding it into the means class corrupts the counter that governs demotion. It therefore MUST be classified separately, MUST NOT increment the means-failure counter, and MUST leave session-continuity state untouched under requirement 5.

   The ladder is nonetheless the right instrument here, for a different reason than requirement 6: **quota pools are per-provider**, so a rung on another engine is usable at the moment the current one is refused. This is where the ladder pays for itself most, and it is also where a naive implementation stalls — because the two positions on the ladder are not the same value. The **demotion floor** is a means judgment: sticky, persisted, moved down by accumulated means failures and back up by a bounded count of successful turns. The **running rung** is the first rung at or below that floor whose engine is not currently refused: derived per turn from the block map and never persisted. Collapsing them yields a layer that descends on a *clock* and returns on a *turn count* — two different units — so a seat that switches away during a limit never switches back. Deriving the rung instead of storing it makes the return automatic, because there is no position to restore.

   When no rung is available, the layer MUST wait until the **earliest** unblock rather than the latest, and the wait MUST be visible. A waiting seat keeps its heartbeat, so it reports healthy while doing nothing for hours — the mirror image of a failure disguised as absence, and equally undetectable by asking whether the layer is running. Work that does not draw on the exhausted pool — transport upkeep, bridge liveness — MUST continue through the wait; suspending it means inbound traffic is lost while waiting and the backlog appears empty on waking.

   **The reset time MUST NOT be a precondition.** Vendors express it inconsistently (an epoch, a retry-after interval, a timestamp, a relative duration, a wall-clock hour) and the expression changes without notice, so a layer that only resumes when it can parse the deadline is a layer that stops permanently the first time the wording moves. Parse opportunistically, and when parsing fails, re-probe on a bounded fixed interval: this rediscovers the reset within one interval and removes the great majority of the wasted attempts without knowing anything. Any parsed deadline MUST also be capped, since a misparse that yields a distant future silences the seat indefinitely — the same permanent-and-unannounced failure requirement 6 guards against. Detection of the refusal itself should be broad, but MUST be evaluated only on a turn that already failed; a successful turn whose output merely discusses limits is not a refusal, and a false positive costs hours of idleness against a false negative's single wasted attempt.

**The recovery layer's own parent MUST be something that does not die with the workspace** — an OS scheduler, a service manager, an init system. A supervisor supervised by another supervisor only relocates the question. That layer MUST also be **non-destructive when healthy**, so it can run on a short interval: a bring-up script that reclaims a port and rotates logs is correct at boot and wrong on a timer, and conflating the two turns the recovery layer into a periodic outage.

Finally, **the recovery scripts are themselves part of the surface being checked.** A script that cannot be executed fails as an absence rather than an error: recovery simply never happens, and nothing reports it. (Observed: the script owning reboot registration could not be parsed at all, because the host read a BOM-less UTF-8 file in the system ANSI codepage and some characters became syntax. Registration, status query, and removal were all unavailable, and the only symptom was that nobody had run it.) Whatever makes recovery scripts loadable on the target host MUST be asserted mechanically, not assumed.

*Formerly Constellation.md §13.35.6.*

## 7 Deprecation posture

This module is expected to **shrink**. Session residency, cancellation, context accounting, compaction, and session enumeration are all surfaces that harness vendors have been absorbing, and each absorption should remove text here rather than accumulate a parallel implementation beside it. The durable content is the contract in §1 and the two hard requirements in §3 and §4 — the parts that are about the board's relationship to a seat rather than about any harness's mechanics.

An adapter layer that grows past this boundary — reimplementing lifecycle a vendor already provides, or accumulating harness-specific behavior that belongs in the registry — has stopped being the minimum layer this module describes, and that growth is the signal to remove it rather than to document it.

*Formerly Constellation.md §13.35.7.*

## 8 Seat telemetry — derived, never declared

A board that shows a seat's state — which model it is on, at what effort, how much of its window is occupied, whether a tool is in flight — must **derive** those values from what the harness recorded, never from what someone declared. The distinction is not pedantic. Measured 2026-08-01: a model switch was issued twice and confirmed twice by the harness's own command output, the board was told the new model, and every actual turn ran on the old one. The declaration was the surface a human read; the record was the surface nobody read; and the reason for the switch went unapplied for the length of a working day because nothing compared them. Any indicator built on a declared value reproduces this, and reproduces it *silently* — a wrong indicator and a right one look identical.

Three properties make a telemetry reader trustworthy, and each corresponds to a way this has already failed here:

1. **Derived.** The reader carries no model names, no effort names, no defaults for either. Every value comes out of the harness's transcript. A literal in the reader is a place where a declaration can quietly outrank a measurement.
2. **Absence is not zero.** No record → `unknown` with null values; a record older than the staleness bound → `stale`. Never `idle`, and never `0`. A zero is a claim that something is empty, so writing zero for "not observed" measures the instrument instead of the seat — the same trap Corporate.md §8.2 names for vacuous assertions, and the same one a freshness invariant already guards on the org surface.
3. **Free by construction, and therefore ungated.** The reader spawns nothing and calls nothing over the network; it reads a file the harness already wrote. This is what separates telemetry from *echo*: echo makes the model speak an extra time and costs tokens, so it is legitimately switchable. Telemetry costs no model tokens at all, so binding it to the echo switch produces a capability that is free and off — the worst of both. Telemetry MUST NOT sit behind the echo gate.

Emission is change-triggered and latest-wins, like any other declaration event (Constellation.md §13.23.4): quantize continuously-moving values before comparing, or a per-tick indicator becomes a per-tick broadcast. What the reader extracts is a floor, not a ceiling — model, effort, context occupancy, in-flight tool, last activity, harness version — and the extraction is **per-harness volatile**, so which fields exist for which harness belongs in the registry with its own `asOf`, not in this module.

**Boundary (what this is not).** Telemetry reads; it does not drive. Operator commands into a live seat are §4's jurisdiction and keep its constraints — with one deliberate asymmetry worth stating, because it looks like a contradiction. Section 4 treats a leading slash as a hazard, since board-authored *data* must never dispatch. An operator button (a compaction request, for instance) wants exactly that dispatch. The resolution is not to weaken §4 but to separate the doors: board-authored data keeps the header that occupies the first character, while operator commands travel a distinct path with an explicit allow-list of commands. The discriminator is the door, not the payload.

*Formerly Constellation.md §13.35.8.*

## Cross-links

Constellation.md §13.16.6 (watcher and cycle discipline the turn-spawned shape rests on) · Constellation.md §13.23 (board-worker projection — the charter is where a seat's procedure lives) · Constellation.md §13.25.11 (declaration binding) · Constellation.md §13.27 (residency, wall-clock ceilings, and completion-by-state) · Constellation.md §13.31 (board state schema and the compact-survival guard) · Constellation.md §3.1 (key management for seat identity) · reference implementation: `pantty/`.

*Formerly Constellation.md §13.35.9.*
