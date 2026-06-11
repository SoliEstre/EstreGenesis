# Hyperbrief — Six-Axis Deep Research

> Foundation document for the Hyperbrief module. Six independent disciplinary axes were probed for what each contributes to the question: *"What discipline must a decision-delegation briefing follow so that it stops being a sycophantic consent-extraction device and becomes a legitimate delegation ritual?"* Each axis returns its own core insights, prompting implications, structural recommendations, pitfalls, concrete rules, and the cross-axis connections it depends on. The next document (002) synthesizes these into the 8-section spec and the module design.

The axes:

1. **AI Harness** — how to make the LLM produce a brief that withstands sycophancy bias and reasoning-collapse.
2. **Humanities** — the communicative legitimacy of an AI asking a human to decide (Habermas / Gadamer / Arendt / Ihde / Sennett / Floridi).
3. **Psychology** — the cognitive biases the brief's form itself induces (anchoring / framing / IKEA effect / availability / alert fatigue).
4. **Management** — sixty years of decision-quality literature (Bezos Type 1/2 / Drucker boundary conditions / Saaty AHP / Klein pre-mortem / Snowden Cynefin / Annie Duke decision journal / Bain RAPID / Real Options).
5. **Philosophy** — the normative grounds for what counts as "important" and the epistemic-humility devices the brief must embed (Jonas / Toulmin / Bayesian calibration / Popper / Aristotle's phronesis / Rawls / precautionary principle).
6. **Long-Horizon Development** — what the same decision costs us six months later (Bezos one-way doors in code terms / Hyrum's law / Fowler technical-debt quadrants / Lehman's evolution laws / Postel's law critique / ADR + decision lineage / observability cost).

---

## Axis 1 — AI Harness

### Lens

The "information asymmetry → coerced consent" pattern that AI agents produce when delegating decisions is fundamentally caused by **the absence of forcing functions in the prompt and system-prompt design**. Hyperbrief is not "write a better report" — it is a meta-level gating mechanism that *makes it impossible for the LLM to request a decision without satisfying the schema*.

### Core insights

**1. Decision delegation must be explicitly classified as a "decision-request action" and gated by the system prompt's forcing function.** Any "what should I do?" buried inside free-form prose must be classified as invalid output.

*Evidence.* Anthropic's prompt-engineering best practices establish the "explicit instruction + structured output" principle; OpenAI function-calling-style schema-enforced output is the parallel mechanism. Inside free-form prose, the LLM exhibits a well-documented sycophancy bias — it pushes the decision back to the user while omitting the supporting material (InstructGPT's reported helpfulness-overconfidence pattern). Locking the output format itself to a schema turns *every missing field into invalid output*, which forces the model to self-reinforce.

*Implication.* Hyperbrief is not a markdown style guide — it is a **two-stage pipeline**: the LLM first emits a JSON-schema intermediate representation (IR), and a deterministic renderer produces the MD/HTML on top. Sections 1–8 are each *required fields*; an empty field means the render itself fails.

**2. LLMs leak the boundary between what they know and what they don't piecemeal**, so the "why" and "expected outcome" sections must carry an **evidence-grounding meta-field** — a four-tier epistemic tag (verified / inferred / assumed / unknown) on every assertion.

*Evidence.* Anthropic's Constitutional AI self-critique loop plus the calibrated-uncertainty literature (Lin et al., 2022, *Teaching Models to Express Their Uncertainty in Words*) show that models only achieve meaningful calibration when *explicitly instructed to emit a confidence label*. In free prose, epistemic status is flattened into the same declarative tone, injecting false certainty into the reader.

*Implication.* Every claim must carry an inline `[verified | inferred | assumed | unknown]` tag — color-coded in HTML, emoji-free text marker in MD. The user can then quickly opt to defer when the proportion of `assumed` crosses a threshold.

**3. Placing the recommendation last (§8) produces an anchoring effect that lets users skim §1–§7 perfunctorily and act on §8 alone.** The recommendation must instead be *derived from §7 as a function*, with a structural dependency the schema enforces.

*Evidence.* Anthropic's "chain-of-thought before answer" principle and Self-Refine (Madaan et al., 2023) both show that committing to a conclusion first switches reasoning into *justification mode*: the LLM selects evidence to defend the pre-committed conclusion. The structural fix is `§8 = f(§7)`.

*Implication.* §8 cannot be free-form prose. It must reference specific node IDs from the §7 decision tree along with weights — `recommendation = aggregate(node_id_subset, weights)`. A recommendation sentence without a node-ID citation is invalid.

**4. The agent's "what is sufficient from my perspective" and the user's "what is sufficient for me to decide" are structurally asymmetric.** Immediately after generating the brief, a **self-elicitation** step must force the model to list "the three most likely pieces of information the receiver will be unable to ask about" and incorporate them.

*Evidence.* Self-Refine + Reflexion (Shinn et al., 2023): single-shot generation carries strong ego-centric bias, which makes the sender's information advantage flow through unchanged. An explicit devil's-advocate prompt is required to surface the receiver-perspective gap.

*Implication.* The pipeline becomes: hidden draft → self-critique ("what three questions can the receiver not even formulate?") → revise → final output (visible). The self-critique log is retained for debugging.

**5. The "brief summary (§1)" and the "three-line summary (§6)" overlap in function; LLMs tend to copy near-identical sentences into both.** The roles must be cleanly separated — one as **situation frame**, the other as **decision prompt**.

*Evidence.* Prompt-engineering's "redundant instruction → diluted compliance" pattern. When two sections share a purpose, the model puts real information in one and treats the other with surface paraphrase. Anthropic's "one job per section" principle.

*Implication.* §1 = "situation frame (why is the decision necessary now, deadlines, constraints)"; §6 = "decision prompt (the precise question the user must answer + a one-line summary of each option)". A cosine-similarity check between §1 and §6 should auto-flag drift back into redundancy.

**6. Letting the model judge what's "important" produces both false negatives (important things just decided autonomously) and false positives (trivia briefed every time).** A **trigger rubric** must be hardcoded into the system prompt with operational, not adjectival, criteria.

*Evidence.* Anthropic's "criterion-based gating" pattern. "Report important decisions" — adjectival criteria drift across models and sessions. *Reversibility, blast radius, time-to-detect, irreversible resource consumption* — operational criteria are stable.

*Implication.* The trigger rubric is the module's SSoT — five conditions (irreversibility / blast radius / external notification / resource threshold / supersession of prior decision), each yes/no. One or more `yes` → Hyperbrief required; zero `yes` → autonomous decision + post-notify.

**7. The LLM tends to narrow the option set to 2–3 of its own choosing**, infringing the user's substantive choice rights. A "**user free-input option**" plus "**deliberately pruned options + reasoning**" must be mandatory fields.

*Evidence.* Tversky & Kahneman on option framing and anchoring. In helpful-mode, LLMs prefer "clean 2–3 options" — which imposes a false dichotomy. Self-elicitation that surfaces "pruned options + why" lets the user reach back and revive a branch.

*Implication.* §7 gets a `pruned_branches` sub-section. §8 adjacent free-input prompt: "if you want something else, what additional information do you need?" HTML provides a `show pruned` toggle.

**8. Generating MD and HTML separately produces drift.** A single IR must deterministically render both. If the LLM generates both formats free-form, information will diverge subtly even when describing the same decision.

*Evidence.* The stochastic-sampling nature of LLM output plus the general "multiple generation = inconsistency" principle. Aligns with Constellation's attachment transport-mode discipline (§13.11): identical material in multiple representations must not have its source-of-truth split.

*Implication.* Pipeline: `LLM → Hyperbrief JSON (IR) → MD renderer / HTML renderer (both deterministic code)`. The LLM produces only JSON. Mermaid diagrams and chart.js data are JSON data fields; the renderer emits the code.

**9. Constellation card embedding must use a dedicated `DECISION_REQUEST` A2A message type** with ack semantics `decision-recorded`. Embedding as plain text loses both decision traceability and redelivery guarantees.

*Evidence.* Constellation §13.13.2 at-least-once relay + §13.11 attachment-mode principles. A decision is a stateful event; the sender agent must remain `pending` until the user's ack (= the decision) arrives. A free-text card cannot carry that ack semantic.

*Implication.* Hyperbrief cards use a distinct `DECISION_REQUEST` A2A message; ack tiers extend to three (`received` / `acknowledged` / `decided`). The user's response returns as `DECISION_RESPONSE` and drains the sender's pending queue.

**10. Long briefings suffer LLM "reasoning collapse" in their later sections.** The 8 sections must not be generated in one turn — they must be split into staged generation with merging.

*Evidence.* Multiple reports on long-context generation degradation plus Anthropic's "decompose complex tasks into subtasks" principle. Generating all 8 sections in one turn makes the later ones (recommendation, decision tree) hand-wave-y. Self-Refine-style per-section subtasking holds quality consistent.

*Implication.* Internal pipeline: (a) trigger-rubric judgment → (b) write §1 · §6 (frame + decision prompt) → (c) write §2 · §3 · §4 (what / how / why) → (d) write §5 (consequences with epistemic tags) → (e) write §7 (decision tree) → (f) derive §8 = f(§7) → (g) self-critique → (h) finalize IR → (i) render. The user sees only the final result.

### Prompting implications

- Place a **decision-delegation gating rule** at the top of the system prompt: any output asking the user for a decision must pass through Hyperbrief IR; questions embedded in free prose are invalid output.
- Hardcode the 5-condition trigger rubric (irreversibility / blast radius / external notification / resource threshold / supersession) as an explicit checklist; force the model to emit five yes/no judgments before every decision request. One or more `yes` → Hyperbrief fires.
- After writing each section, instruct the model to attach `[verified | inferred | assumed | unknown]` as inline annotations. Untagged sentences are rejected by the validator.
- Compel the self-critique stage: "draft → identify the three most likely information gaps that would prevent the receiver from deciding → reinforce body → final output". The three stages are declared as a hidden chain in the system prompt.
- When writing §8, require explicit citation of §7 node IDs. Recommendations without node-ID citations are invalid.
- When constructing options, require both `presented_options` and `pruned_options + exclusion reasons`. Block the helpful-mode default of arbitrarily narrowing the option set.
- Lock the LLM output format to IR (JSON) only. Mermaid and chart.js code are emitted by the deterministic renderer.
- Recognize `DECISION_REQUEST` / `DECISION_RESPONSE` as A2A message types at the prompt level. Falling back to plain text loses decision traceability.
- Explicit anti-sycophancy instruction: "Before asking the user for a decision, decide yourself and post-notify if the matter is within your scope. *Asking is not the default.*"
- If briefing generation fails after a trigger fires (e.g., insufficient information), escalate via "briefing impossible → further investigation required → ask user only for investigation approval". Requesting a decision in an under-informed state is the worst failure mode.

### Structural recommendations

- Rearrange the original 8 sections: (1) situation frame [why now?] → (6 → second position) decision prompt [the question + one-line option summaries] → what / how / why → consequences (with epistemic tags) → decision tree → recommendation. The roles of "brief overview" and "three-line summary" are cleanly split.
- Display the trigger-rubric result (5 yes/no) as a meta-box at the top of the brief so the user can immediately verify why this counts as a delegated decision.
- Show an epistemic-tag distribution mini-chart (chart.js doughnut) beside each section so "this brief is 70% verified, 20% assumed, 10% unknown" is visible at a glance.
- Render the §7 decision tree as a mermaid flowchart with a checkbox + node ID on each leaf; render §8 as a mapping table from "checked node-ID combination → recommended result".
- Add a collapsible Pruned Options section, folded by default. Click "are there other options?" to expand. The user can recover branches the model arbitrarily closed.
- Show decision deadline (time-to-decide) and irreversibility metric as badges at the top: e.g., "decision required within 24h, irreversibility 8/10".
- Constellation card embedding exposes only a collapsed header (situation frame + decision prompt + deadline + irreversibility); the body unfolds on "expand to brief" click. Prevents inbox flooding.
- MD output uses GitHub-flavored standard + mermaid blocks only. HTML output is self-contained (inline CSS/JS) and embeddable / archivable.
- Embed a decision-response form at the bottom of the HTML: radio for options + free input + "brief insufficient — request further investigation" — three choices. Responses auto-convert into `DECISION_RESPONSE` A2A messages.
- Surface the self-critique log in a separate collapsed footer as "agent's own uncertainty notes" so the user can see the model's doubts about its own answer.

### Pitfalls

- **Schema-cosplay** — the LLM generates free-form prose and applies the 8-section headers superficially. Only field-by-field type / required / relation constraints in the validator prevent this.
- **Sycophancy-driven over-delegation** — all decisions tossed back to the user. Without a trigger rubric, Hyperbrief becomes a decision-avoidance device.
- **Calibration collapse** — the model marks everything as `[assumed]` as a safety blanket. Few-shot examples and tag-distribution monitoring needed.
- **Motivated reasoning** — the LLM pre-commits to a §8 recommendation and back-fills §1–§7 to justify it. Only staged generation and the `§8 = f(§7)` dependency block this.
- **MD ↔ HTML information drift** — generating both free-form risks divergent recommendations for the same decision.
- **Attention collapse** — the user skips the decision tree and reads only the recommendation. Without node-ID citations, the user can leapfrog the tree.
- **A2A type fallback** — embedding as `TEXT_MESSAGE` loses decision traceability and redelivery. Need graceful degradation for adopters that don't know `DECISION_REQUEST`.
- **Reasoning collapse late in long briefs** — the tree and recommendation hand-wave. Only staged generation mitigates.
- **Vague trigger conditions** — false positives produce alarm fatigue. Operational definitions matter intensely.
- **Empty pruned-options passing validation** — false dichotomy enforced silently. The validator cannot distinguish "truly 0 pruned" from "model didn't declare". Force the model to *explicitly declare 0* when none.

### Concrete rules

- **MUST**: every output that asks the user for a decision passes through Hyperbrief JSON IR. Free-form interrogative requests for decisions are invalid output.
- **MUST**: emit yes/no judgments on the 5-condition trigger rubric before firing Hyperbrief. One or more `yes` → fire; zero → autonomous decide + post-notify.
- **MUST**: every fact assertion and prediction carries an inline 4-tier epistemic tag `[verified | inferred | assumed | unknown]`. Untagged sentences are invalid.
- **MUST**: the §8 recommendation must cite at least one node ID from the §7 decision tree. Uncited recommendations are invalid.
- **MUST**: the LLM generates only the Hyperbrief IR (JSON). MD/HTML rendering is the responsibility of the deterministic renderer. The LLM is forbidden from generating MD/HTML directly.
- **SHOULD**: the generation pipeline runs the 3-stage hidden chain (draft → self-critique "identify 3 gaps" → revise).
- **SHOULD**: option lists contain both `presented_options` and `pruned_options + exclusion reasons`. When `pruned` is empty, the model must explicitly declare it.
- **SHOULD**: Constellation card embedding uses the `DECISION_REQUEST` / `DECISION_RESPONSE` A2A message types; when falling back to `TEXT_MESSAGE`, at minimum the transport tier carries a `decision response required` metadata flag.

### Cross-axis connections

- **Psychology**: epistemic tags and the trigger rubric are simultaneously cognitive-bias-mitigation devices. AI Harness handles "how do we make the model produce these tags?"; Psychology handles "what cognitive influence does the tag distribution have on the user's decision?"
- **Philosophy**: the 5 trigger conditions (irreversibility / blast radius) must be derived from the normative philosophy axis (rules for grave matters); AI Harness translates them into an LLM-operable yes/no checklist.
- **Management**: the functional derivation pattern `§8 = f(§7)` depends on decision-making methodology (decision matrix, weighted scoring). AI Harness enforces the model honestly applying that function via prompting discipline.
- **Humanities**: the premise that the user's decision sovereignty must be protected belongs to humanities; AI Harness translates that premise into a system-prompt-level forcing function.
- **Long-horizon Development**: the IR (JSON) → MD/HTML two-stage pipeline design and the new Constellation card A2A types are direct long-development decisions; AI Harness provides the non-functional requirement of "guaranteed LLM output determinism".

---

## Axis 2 — Humanities

### Lens

Hyperbrief addresses the semantics of *the very act of an AI asking a human to decide*. This axis checks the humanistic prerequisites under which that act qualifies as legitimate delegation — Habermas's validity claims (truth / rightness / sincerity / comprehensibility), Gadamer's pre-understandings made explicit, Ihde's tool-mediation made visible, Arendt's restoration of agential subjectivity — so the module functions as a **genuine delegation ritual**, not a "consent-coercion device".

### Core insights

**1. A decision-delegation request is a communicative action and must satisfy all four of Habermas's validity claims (truth / rightness / sincerity / comprehensibility) to count as legitimate delegation.**

*Evidence.* Habermas, *Theory of Communicative Action* (1981) — every speech act carries a fourfold validity claim. When one fails, the outcome is not consensus but strategic action (concealed coercion).

*Implication.* The 8 sections must map onto the four claims: "what / how" (truth) / "why / expected consequences" (rightness) / "recommendation + self-interest disclosure" (sincerity) / "three-line summary + checkboxes" (comprehensibility). The original 8-section spec **lacks the sincerity axis** — an "agent self-disclosure" section is required (the agent's preferences, confidence, blind spots).

**2. The absence of an ideal speech situation under time pressure and information asymmetry turns the decision request into "consent in form, coercion in substance".**

*Evidence.* Habermas's conditions for the ideal speech situation: equal opportunity, possibility of objection, freedom from external coercion. An AI → human decision delegation is structurally asymmetric (the agent controls information, time, and framing) and unintentionally becomes coercive.

*Implication.* Hyperbrief must structurally guarantee the *possibility of objection*: (a) explicit "limits and likely omissions of this brief" section, (b) a reverse-question guide "if you want to know more, what should you ask?", (c) "defer / postpone" presented with equal weight to the recommendation. Sole emphasis on the recommendation operates as external coercion.

**3. Without hermeneutic pre-understanding (Vorverständnis), presented information does not give the user a "horizon for judgment" — facts listed are not understanding.**

*Evidence.* Gadamer, *Truth and Method* (1960) — understanding does not begin from a blank slate; it starts in pre-understanding (prejudice / horizon) and fuses with the horizon of the text (Horizontverschmelzung). Without pre-understanding, information lands meaninglessly.

*Implication.* The "brief overview" section is not a one-line summary — it must articulate the *horizon* from which the user should view the decision (context, history, continuity with prior decisions). Format: "this is part of decision X, rests on assumption Y, presupposes prior decision Z". Context-less decisions are not decisions but guesses.

**4. The agent's recommendation is already a Gadamerian interpretation. If the interpretation's premises (pre-understandings / framing) are not made transparent, the user mistakes the agent's horizon for their own.**

*Evidence.* The hermeneutic circle: understanding the part depends on the whole, and the whole on the part. A recommendation is always "a partial recommendation within some implicit whole".

*Implication.* §8 must always be accompanied by "three premises this recommendation rests on". Conditional form: "if premise A is false, the recommendation reverses". Hermeneutically honest is *naming the defeaters*, not just the grounds.

**5. The invisibility of technological mediation — AI briefings do not let users see the world directly; users see *through* the AI. When the thickness of this mediation is hidden, users mistake the AI's frame for their own judgment.**

*Evidence.* Don Ihde, *Technology and the Lifeworld* (1990) — embodiment relations strengthen as the tool becomes transparent; the user assimilates the tool's frame. AI briefings are the most powerful embodiment tool.

*Implication.* Each section must leave mediation traces (source / inference step / uncertainty level): how was this information produced? Provenance tagging — `[observed]` / `[inferred]` / `[external citation]` / `[agent assumption]` — is mandatory. Without visible mediation, the briefing turns the user into an extension of the AI.

**6. A decision is an Arendtian initium — a public act of beginning. The decider bears the irreversibility and unpredictability of the act. A human receiving a delegated decision from an AI has the right to know that burden's precise contour.**

*Evidence.* Arendt, *The Human Condition* (1958) — action's essence is beginning, irreversibility, unpredictability. Only the actor reveals the "who" of action. Delegating a decision delegates that "who".

*Implication.* §5 (expected consequences) is not just a probability list — it must distinguish *degree of irreversibility (rollback feasibility)*, *blast radius (who/what is affected)*, *clarity of responsibility attribution*. "Is this reversible or irreversible?" must be displayed visually first.

**7. In Sennett's sense, good collaboration is *dialogic*, not *dialectic* — it sustains difference without coercing consensus. A single recommendation is dialectic (convergence to synthesis) and kills dialogue.**

*Evidence.* Sennett, *Together* (2012) — the craftsperson's collaboration maintains *subjunctive* mood ("what if we did this?"). Declaratives end collaboration.

*Implication.* §8 should not be "the recommendation" but "several legitimate paths and each one's trade-offs" — one recommendation plus *explicit reasons for rejecting* alternatives. The text structure must grammatically reserve a space for "I see it differently".

**8. The right to refuse the question is the prerequisite for delegation to count as delegation. In information ethics, "consent" presupposes the possibility of refusal.**

*Evidence.* Floridi, *The Ethics of Information* (2013) — informational agents' autonomy includes "the freedom not to respond". Coerced response is autonomy in form only. Corresponds to "voluntariness" among the four medical-ethics requirements of informed consent.

*Implication.* Hyperbrief must include — as top-level branches of §7 — `reject the framing` / `defer` / `request more investigation`. Presenting only yes/no/which-option is already framing-coerced.

**9. The original §1–§8 ordering produces a "cognitive slide toward the recommendation". When the recommendation comes last, §1–§7 collapse into justification machinery, and the user effectively assents.**

*Evidence.* The rhetorical-disposition tradition — placing the conclusion last is a persuasion technique. In decision delegation, this must *not* be persuasion.

*Implication.* §8 should be positioned for "post-judgment verification", or it must be paired with "the strongest argument against the recommendation". A pre-mortem ("if this recommendation is wrong six months from now, why?") is mandatory inside §8.

**10. The three-line summary (§6) is hermeneutically the most dangerous section — compression is always interpretation, and what the summarizer saw is assimilated as what the decider saw.**

*Evidence.* Gadamer's Wirkungsgeschichte (history of effect) — a text means only within the history of how it has been received. The three-line summary pre-determines that future history.

*Implication.* The three-line summary takes the structure: (a) one line of fact + (b) one line of contested point + (c) one line of "what this summary misses". Or: present a two-pair structure of "agent's view summary" and "opposing view summary". A single summary is hermeneutic violence.

### Prompting implications

- Before writing the recommendation, the agent must self-disclose: "I see this through the lens of [pre-understanding made explicit]". System-prompt clause: "pre-understanding disclosure before recommendation".
- Recommendations must always be accompanied by "three conditions under which the recommendation reverses (defeaters)". "I recommend X, but if any of A · B · C is true, the recommendation is void".
- Force provenance tags on every fact assertion: `[observed]` / `[inferred]` / `[external: URL]` / `[agent assumption]`. Untagged statements are forbidden. The user must perceive the thickness of mediation visually.
- Hardcode `reject-this-framing` / `defer` / `request-deeper-investigation` meta-options at the top of §7 (decision tree).
- When the agent uses words like "urgent" / "critical" / "must decide now", Hyperbrief automatically inserts a meta-section asking "what grounds this urgency — external deadline, or agent estimation?"
- The three-line summary requires both "agent view" and "imagined opponent view" pairs. A single summary is forbidden.
- Mandate a one-paragraph pre-mortem immediately before the recommendation: "Six months from now, if this decision turns out to have failed, what is the most likely reason?". A blank or perfunctory response rejects the briefing.

### Structural recommendations

- Rename §1 (brief overview) to **Context Horizon** — articulate the prior decisions, assumptions, and historical continuity the decision rests on. A single one-line summary is Gadamer-insufficient.
- Add a new §0 **Agent Self-Disclosure** section — (a) the brief's information limits, (b) the agent's stake / preference in this decision, (c) explicit naming of what the agent doesn't know. Satisfies Habermas's sincerity claim.
- §5 (expected consequences) introduces an irreversibility-metric visualization — traffic-light "rollback possible (green) / partial (yellow) / irreversible (red)" + an Arendtian *range of affected actors* diagram.
- §7 decision tree's top level mandates a meta-branch — `accept decision / defer / reject framing / request more investigation`. A yes/no-only tree is *de facto* coercion.
- §8 (recommendation) splits into `recommendation + defeater conditions + premortem` — three blocks. A solitary recommendation is forbidden.
- Each section gets a **provenance footer** — a horizontal bar chart of where this section's information came from (`[observed / inferred / external / assumed]` proportions, rendered with chart.js).
- In HTML, the §8 "opposing arguments toggle" defaults to *expanded*. Collapsed-by-default is a rhetorical bias.
- The three-line summary becomes a two-column table contrasting "agent view vs. imagined opponent view". This is more hermeneutically honest than a simple mermaid flowchart.
- The MD/HTML headers must carry a mandatory notice: "You have the right to refuse this brief (you don't have to answer the question)". Floridi's voluntariness — made visible.

### Pitfalls

- Sole emphasis on the recommendation → users assent formally; the brief decays into a *ritual decision* where §1–§7 are mere justification.
- Fact-listing without pre-understanding/context disclosure → users *feel* they have decided, but in reality reproduce the agent's framing. Hermeneutic self-alienation.
- Missing provenance/mediation marks → agent inference and external facts appear with equal visual weight; users don't perceive the thickness of mediation. Ihde's embodiment relation rendered invisible.
- Only yes/no/option-A/B branches provided → no `reject-framing` → no meta-refusal possible. Every response is already inside the agent-set frame.
- Uncritical acceptance of urgency vocabulary → as soon as the agent declares "urgent", the ideal-speech-situation condition of *freedom from external coercion* collapses. Time pressure is the most common coercion mechanism.
- Single-perspective three-line summary → the agent pre-determines the future Wirkungsgeschichte. Forgets that compression is always interpretation.
- Irreversibility not differentiated → reversible and irreversible decisions presented identically; Arendt's burden of action is flattened. Grave irreversible decisions get processed like everyday ones.
- Agent self-interest undisclosed → violates Habermas's sincerity. The user doesn't see the efficiency / completion reward the agent gains from a specific recommendation.
- Missing recommendation defeaters → the recommendation presents as an unconditional assertion; the part-whole structure of the hermeneutic circle is concealed. The user assents not knowing the recommendation's cancellation conditions.
- Hyperbrief-stamped decisions trigger a *"brief received, responsibility transferred"* effect → exploited as a formal alibi for responsibility, *weakening* delegation ethics. Inflation of ritual consent.

### Concrete rules

- **MUST**: every brief includes §0 (Agent Self-Disclosure: information limits + stake + what is not known) as a header.
- **MUST**: every fact statement carries a provenance tag (`[observed]` / `[inferred]` / `[external:source]` / `[assumed]`). Untagged statements invalidate the brief.
- **MUST**: the top of §7 includes the meta-branches `reject-framing / defer / request-investigation`.
- **MUST**: §8 follows the three-block structure `recommendation + 3 defeater conditions + premortem`. A solitary recommendation is forbidden.
- **SHOULD**: §1 is named "Context Horizon" with (a) preconditions, (b) continuity from prior decisions, (c) scope of impact in three subsections.
- **SHOULD**: §5 includes the irreversibility traffic light (rollback possible / partial / impossible) and an affected-actors diagram.
- **SHOULD**: the §6 three-line summary follows either the "agent view vs. opposing view" two-column or the "fact / contested point / what the summary misses" three-block structure.
- **MUST**: a notice — "you don't have to answer — refuse / defer / reframe options are in §7's meta-branches" — appears at the top of the brief.

### Cross-axis connections

- **Psychology**: the "cognitive slide" of the recommendation ordering directly engages anchoring / framing bias. Humanities argues *why* that order is a problem of power; Psychology supplies *which cognitive biases* are thereby activated as mechanisms.
- **Philosophy**: the `reject the framing` meta-option and irreversibility visualization meet decision rules for grave matters (precautionary principle, reversibility heuristic). Humanistic autonomy protection can be formalized as philosophical decision rules.
- **Management**: mandating a pre-mortem (Klein) is a confluence of humanistic sincerity (Habermas) and management decision methodology — both axes demand the same artifact through different justifications.
- **AI Harness**: provenance tag enforcement and agent self-disclosure require structural coercion at the system-prompt level — AI Harness translates the humanistic norm into prompting meta.
- **Long-horizon Development**: the irreversibility traffic light connects directly to a decision's "rollback cost" and aligns with long-development decision criteria (Bezos type-1/type-2). Arendtian action-irreversibility becomes operationalized as a development-decision classification.

---

## Axis 3 — Psychology

### Lens

The axis models how the user's attention, working memory, and System 1 automatic responses distort or bypass the brief, and ensures the brief's form / order / visuals / defaults *themselves* do not induce cognitive bias. Hyperbrief is not merely information delivery — it is a **cognitive tool that intervenes directly in the user's decision system**.

### Core insights

**1. Forcing the user to read all 8 sections linearly exceeds the cognitive-load ceiling — the user effectively reads only the §6 three-line summary and the §8 recommendation, turning the module into an anchoring engine for the recommendation.**

*Evidence.* Sweller's cognitive load theory (intrinsic + extraneous + germane load); working-memory chunk limits (Cowan 4 ± 1, Miller 7 ± 2). Eight sections + a decision tree + a mermaid diagram push extraneous load past the threshold.

*Implication.* The 8 sections must be redesigned around **progressive disclosure** (overview → 3-line → detail on demand), not "read all at once". Default view: §1 + §6 + §7 only; others collapsible. §7 (the action-forcing point) is always expanded.

**2. Placing the recommendation last makes users read §1–§7 as "justifications for §8" — anchoring and confirmation bias simultaneously active.**

*Evidence.* Tversky-Kahneman anchoring + Wason confirmation bias. Kahneman/Sibony/Sunstein, *Noise*, on the trap of "sequential information": a conclusion seen first biases interpretation of subsequent information. Heath, *Decisive*, WRAP's "Widen options" critique of single-recommendation framing.

*Implication.* §8 collapses by default; it expands only after the user passes through §7. Or restructure §8 from a single recommendation into "2–3 competing options + each one's trade-offs + recommended choice + what you'd lose by adopting the recommendation". Weaken the word "recommendation" to "AI estimate".

**3. Checkbox-based decision trees (§7) drag the user toward "conclusions consistent with what was checked" — IKEA effect + consistency drive simultaneously. The tree stops being a decision tool and becomes a decision-rationalization tool.**

*Evidence.* Norton-Mochon-Ariely IKEA effect (over-valuing the result of one's own effort) + Festinger cognitive-dissonance avoidance + Cialdini commitment-consistency.

*Implication.* The checkbox tree is replaced by "user reorders priorities" rather than "user answers AI-set criteria", *and* both the conclusion implied by what was checked *and its opposite* are shown. Immediately after a check, the user is forced to write a one-line pre-mortem: "if this choice fails six months from now, what's the most likely cause?"

**4. §5 (consequences) is a direct hit from the framing effect — gain-frame and loss-frame alone reverse preferences on the same matter.**

*Evidence.* Tversky-Kahneman prospect theory + the Asian disease problem (the same outcome described as save/lose reverses preference). Loss aversion coefficient ≈ 2.0–2.5.

*Implication.* §5 must be structured as a **2×2 matrix** (choice × {gain, loss}) — no single narrative allowed. To counter status-quo bias, "do nothing" must be explicitly included as a 5th quadrant.

**5. The AI's recommendation operates as a *default effect* — unless the user explicitly refuses, it becomes the adopted choice, *reinforcing* the original problem.**

*Evidence.* Johnson-Goldstein on organ donation defaults + Thaler-Sunstein, *Nudge*, on default architecture. Default-adoption rates reach 60–90 % due to cognitive-effort avoidance.

*Implication.* The AI recommendation requires three pieces of metadata: confidence + "what I don't know" + "scenarios in which this recommendation could be wrong". To adopt, the user types one sentence — "I accept this recommendation because of X" — instead of clicking an "accept AI recommendation" button (active choice → IKEA effect inverted as a de-biasing device).

**6. The order of §3 (how) before §4 (why) primes sunk cost — once "how" is read, cognitive investment in execution procedures has begun; if §4 raises doubt, the doubt no longer carries weight.**

*Evidence.* Arkes-Blumer sunk-cost effect + cognitive entrenchment. Aligns with *Decisive* WRAP's warning against putting the *reality test* last.

*Implication.* Recommended order: 1 (overview) → 2 (what) → 4 (why) → 5 (consequences) → 7 (decision tree) → 3 (how) → 6 (three-line) → 8 (recommendation). "Why" and "consequences" must precede "how" so essential doubt has room before procedural details consume cognition.

**7. Maximizing mermaid / chart.js visualization induces the processing-fluency illusion — the user *feels* understanding while critical thinking actually drops.**

*Evidence.* Alter-Oppenheimer fluency-as-validity + Reber-Schwarz "feels true" heuristic. The better-designed the chart, the less the user doubts the data.

*Implication.* Every visualization carries a mandatory caption: "what this diagram simplifies / what it doesn't show". Charts default to a 3-scenario toggle (optimistic / neutral / pessimistic), not a single view. Beautiful diagrams intentionally bear a small "incompleteness mark (?)" to block fluency.

**8. The essential problem of decision delegation is not lack of information — it is the *timing*: the AI delegates at the last step, when the user is already distant from context.**

*Evidence.* Mayer Cognitive Theory of Multimedia Learning's context-preactivation principle + Endsley situation awareness (perception → comprehension → projection). Decisions made in a context-absent state are processed by System 1 heuristics.

*Implication.* Insert a section before §1: "§0: context so far (summary of last N turns + why this branch arose)". The user must be able to first reconstruct "why am I being asked to decide this *now*?"

**9. §6 (three-line summary) strongly triggers the availability heuristic — after deciding, the user recalls only the three-line summary and forgets the other seven sections. The wording of the three-line summary becomes the circuit of post-hoc justification.**

*Evidence.* Tversky-Kahneman availability + Schacter's *7 sins of memory* (misattribution). Combined with Loewenstein-Schkade affective forecasting errors, post-hoc regret/satisfaction is also distorted.

*Implication.* The three-line summary is not "3 lines written by the AI" but "3 chosen by the user from 5–7 candidates the AI presented". Or display two alternative versions of the same three-line summary alongside to expose framing diversity.

**10. The more the user employs this module, the more alert fatigue + auto-approval patterns form, neutralizing the module itself.**

*Evidence.* Cvach on medical-field alarm fatigue + Skinner's intermittent-reinforcement reverse effects. Routine invocation drives System 2 delegation back into System 1.

*Implication.* Hyperbrief must not fire on every branch. The module itself requires invocation-trigger metadata (gravity / hard-to-reverse / external influence), and below a metadata-score threshold the invocation is blocked. The module tracks user decision statistics (acceptance rate, average decision time, recommendation-adoption rate); if "recommendation auto-adoption > 70 %", a self-warning is issued to the user.

### Prompting implications

- The AI agent must, when writing the recommendation, simultaneously and at equal length produce: "counter-recommendation" + "reasons my confidence is low" + "scenarios in which this recommendation doesn't work". Asymmetric length itself is an anchoring signal.
- The AI must always write §5 as "gain frame 1 paragraph + loss frame 1 paragraph + status-quo (no-action) frame 1 paragraph". Writing only one frame fails schema validation.
- Immediately before delegating the decision, the AI compels a pre-mortem question: "If this decision is a clear failure six months from now, what's the most likely information you're currently missing?" The next step cannot proceed without the user's answer.
- Confidence is written not as a single number but as a brittleness statement: "if assumption X breaks, the recommendation flips". A single confidence number becomes an anchor.
- Immediately before writing its own recommendation, the agent self-prompts: "How many similar decisions have I recommended to this user, with what adoption rate?" — a self-warning against pattern formation.
- §7 decision tree's checkboxes consist *only* of value / preference questions the user must judge, not factual statements. Facts go to §4 (why); value judgments go to §7. Mixing fact and value lets the user escape value judgment by fleeing to facts.
- Every visualization output mandatorily carries three meta-captions: "showing / hiding / oversimplifying". Standalone visualizations are forbidden.
- The agent meta-evaluates the legitimacy of the decision request itself before generating the brief: "does this really require a user decision, or is autonomous decision + post-notify enough?" Below threshold, do not invoke Hyperbrief.

### Structural recommendations

- Linear-order reordering: [0 context → 1 overview → 2 what → 4 why → 5 consequences (2×2 framing matrix) → 7 decision tree + pre-mortem → 3 how → 6 three-line (user-selected) → 8 option comparison + AI estimate]. "Why" and "consequences" *must* precede "how".
- Default view exposes only 0 + 1 + 5 + 7; others are progressive disclosure. To press the decision button, the user must have expanded §4 and §8 at least once (soft gate). "No approval without reading".
- §5 forbids narrative; it forces a 2×2 matrix (accept/reject × gain/lose) plus "no-action" as a 5th quadrant. Use mermaid `quadrantChart`.
- §7 is not checkboxes but a *ranked list the user reorders by dragging* + each entry shows in real-time "what conclusion follows if this is your top priority". Block the auto-conclusion circuit after checking.
- Rename and restructure §8 from "recommendation (singular)" to "option comparison (plural) + AI estimate (1 option) + brittleness statement". Avoid the strong default vocabulary "AI recommendation".
- All visualizations mandatorily caption "what the AI simplified / what it didn't show". Charts default to a 3-scenario toggle (optimistic / neutral / pessimistic).
- A mandatory "pre-mortem 1-sentence input" widget immediately before decision. Without text the user typed, the decision cannot be confirmed. (Active choice → IKEA inverted as a de-biasing tool.)
- HTML output offers "automatic retrospective notification after a delay". When embedded as a Constellation card, decision time + user's pre-mortem + actual outcome are paired for later review. Corrects affective-forecasting errors.
- When embedding as a Constellation card, the "above-the-fold" view exposes the **pre-mortem question + 2×2 outcome matrix**, *not* the recommendation. The recommendation appears only after expansion.

### Pitfalls

- §8 (recommendation) most visually prominent → users read only §1 + §6 + §8 → the module degenerates into a recommendation-adoption module. Hyperbrief worsens the original problem.
- Checkbox decision tree (§7) operates via IKEA effect → the user accepts only conclusions consistent with their input — a rationalization tool.
- Forcing all 8 sections → cognitive overload → users either avoid the module or form an "approve without reading" habit (alert fatigue).
- §5 as single narrative → framing effect produces different decisions on the same matter each time. The user's decision depends on the AI's tone of the day.
- Mermaid / chart.js visual richness → processing-fluency illusion → users feel they "understand" but criticism falls.
- AI confidence exposed as a single number → strong anchor; the user weights confidence without independent assessment.
- Invoking the same module on every branch → routinization → System 2 delegated to System 1 → the module becomes a formal signing ritual.
- User emotion/context at decision time (fatigue, time pressure, multitasking) ignored — effects of emotion on decisions (Loewenstein hot/cold empathy gap) overlooked.
- No post-hoc verification circuit → the module short-term produces "I delegated to the AI well" feeling, but affective-forecasting errors persist → no long-term decision-quality improvement.
- Recommendation worded as "AI recommendation" → status-quo bias + authority bias combine; default-adoption rates explode.

### Concrete rules

- **MUST**: §5 is a 2×2 outcome matrix (accept × {gain, loss}) + no-action quadrant. A single narrative fails schema validation.
- **MUST**: §8 is not a single recommendation but an option comparison + AI estimate (one) + brittleness statement (what assumption breaks flips the estimate).
- **MUST**: before finalizing the decision, ≥ 1 sentence of user pre-mortem free-input is mandatory (active choice gate).
- **SHOULD**: default view exposes 0 (context) + 1 (overview) + 5 (outcome matrix) + 7 (decision tree); 3 / 4 / 6 / 8 are progressive disclosure.
- **SHOULD**: every visualization carries "showing / hiding / oversimplifying" three captions.
- **MUST**: AI confidence is forbidden as a single number; it is expressed only as a brittleness statement ("if X assumption breaks, the conclusion flips").
- **SHOULD**: if the invocation-trigger metadata score (gravity / hard-to-reverse / external influence) is below threshold, Hyperbrief invocation itself is blocked and replaced by a normal report.
- **SHOULD**: cumulative statistics (recommendation adoption rate, average decision time, pre-mortem-non-entry rate) tracked + when thresholds exceed, send a self-warning card to the user.

### Cross-axis connections

- **AI Harness**: hardcoding "gain/loss/no-action all three frames", "brittleness statement enforcement", "auto-generated pre-mortem question" rules into the system prompt is concrete prompt-engineering — AI Harness territory.
- **Humanities**: ethical scrutiny of whether "the AI delegating a decision" itself erodes user autonomy via responsibility-diffusion is humanities axis. Psychology only handles the cognitive mechanisms inside that.
- **Management**: applying decision-governance frameworks like pre-mortem (Klein), WRAP (Heath), Noise (Kahneman/Sibony/Sunstein decision hygiene), Doerr OKR, RAPID/RACI is management axis. Psychology supplies the cognitive mechanisms by which these frameworks work.
- **Philosophy**: judgment of "grave matters" — what is reversible/irreversible, what is a one-way door (Bezos) — is philosophy. Psychology designs the interface that keeps the user from avoiding that judgment.
- **Long-horizon Development**: implementation calls — progressive-disclosure UI, collapsible sections, cumulative-statistics tracking, Constellation card embedding — are development axis. Psychology supplies "why this implementation is cognitively grounded".

---

## Axis 4 — Management

### Lens

Management has systematized for seventy years "*who*, decides *what*, with *what information*, at *what reversible cost*". Hyperbrief is not merely an information package — it *is* a delegation decision in itself, so the management-style decision-governance skeleton (decision-type classification → information-sufficiency criteria → responsibility attribution → post-hoc verification loop) must be transplanted in full.

### Core insights

**1. Applying an 8-section brief uniformly to every decision is cost/benefit asymmetric — briefing depth must dynamically adjust to the decision's type.**

*Evidence.* Bezos's Type 1 (one-way door, irreversible) vs. Type 2 (two-way door, reversible) decisions — Amazon 1997 shareholder letter & 2015 letter. Type 2 has intrinsic value in speed; forcing Type-1-level analysis costs organizational velocity more than mis-tuning the decision.

*Implication.* Hyperbrief must pass a **door-type classifier** at entry. Type 2 (reversible) decisions: mandatory §1 · §3 · §6 · §8 only, the rest optional. Type 1 (irreversible, high-rollback): all 8 sections + §5 must list rollback cost · rollback latency · point-of-no-return. The classification is exposed in the brief header.

**2. The current 8 sections implicitly throw "who decides" entirely onto the user, violating the management distinction between decision authority, advice, and execution.**

*Evidence.* Bain's RAPID framework (Recommend · Agree · Perform · Input · Decide). Recommender, Decider, and Performer must be explicitly separated; ambiguous responsibility collapses post-hoc attribution. In AI-user collaboration, the agent may be Recommender/Performer, the user is Decider, other agents may be Input.

*Implication.* §0 (header) requires RAPID role tagging: `Recommender: <agent_id>, Decider: user, Performer: <agent_id or system>, Input-contributors: [<other_agents>], Agree (veto-holders): [optional]`. §8 recommendation states the recommender's confidence or dissent.

**3. §4 (why) is too free-form for the user to grasp the decision's boundary conditions — Drucker's "boundary conditions" are missing.**

*Evidence.* Peter Drucker, "The Effective Decision" (HBR 1967): the second of five steps in an effective decision is defining boundary conditions (the minimum spec this decision must satisfy — "if this is unmet, the decision itself is moot"). Without explicit statement, must-haves get quietly bartered away in post-decision trade-off negotiations.

*Implication.* Redefine §4 as "why + boundary conditions". Three tiers: must-have (decision void if violated), should-have (negotiable but costly), nice-to-have. §5 expected consequences must match these boundaries: "Option A misses 1 of 2 must-haves" — verifiable.

**4. §5 cannot be compared by qualitative narrative alone — MCDA (Multi-Criteria Decision Analysis) structure is required.**

*Evidence.* Thomas Saaty's AHP (Analytic Hierarchy Process, 1980) and weighted scoring's basic principle: multi-alternative comparison requires (a) explicit criteria, (b) per-criterion weights, (c) per-alternative scores, (d) weighted sum — all four. Qualitative narrative collapses into "A feels better".

*Implication.* §5 mandates a table: rows = alternatives, columns = evaluation criteria (derived from boundary conditions), cells = quantitative or 5-point scale + one-line rationale. Weights are adjustable sliders in HTML (chart.js radar/bar). Last column: expected value or worst-case regret.

**5. §5 must split "rollback cost" and "reversal window" into separate fields — they are the core variables for decision-type classification and post-hoc adaptation.**

*Evidence.* Real Options theory (Dixit & Pindyck, 1994, *Investment under Uncertainty*): the value of decisions under uncertainty includes "the option value of re-deciding later with better information". Option value depends on (a) length of the reversal window, (b) probability of new information arriving, (c) rollback cost. Without these three variables, "wait-and-see" stays an invisible comparison.

*Implication.* §5 adds a `reversibility` subsection: rollback cost (time / money / relational capital), reversal window (until this date, no-cost retreat is possible), trigger to revisit (what signal forces re-decision). `do nothing / defer N days` is always presented as an explicit option in §8.

**6. §7 (decision-criteria tree, checkboxes) is excellent in idea, but without prior Cynefin domain classification it forces the wrong tree on the wrong domain.**

*Evidence.* Dave Snowden's Cynefin framework (2007 HBR, "A Leader's Framework for Decision Making"): decision contexts are Clear, Complicated (expert judgment), Complex (probe + pattern), Chaotic (act first), Confused. Decision trees are valid in Clear/Complicated, but in Complex "probe-sense-respond" is correct and a decision tree creates false confidence.

*Implication.* Mandatory Cynefin domain judgment before entering §7. Clear/Complicated: deterministic decision tree. Complex: auto-switch to "3 safe-to-fail probe candidates + observation indicators". Chaotic: block the decision tree, force the "act now + retrospect later" template.

**7. If Hyperbrief offers only decision-time information without closing the post-decision learning loop, the same agent falls into the same trap repeatedly — decision-journal integration is necessary.**

*Evidence.* Ron Howard's decision-analysis school and Annie Duke's *Thinking in Bets* (2018) decision journal: to separate decision quality from outcome quality, record (a) the decision-time information, assumptions, and predictions, (b) the actual outcome, (c) the outcome-quality vs. decision-quality retrospective. The "Observe" of OODA (John Boyd) does not rotate without post-data either.

*Implication.* Hyperbrief cards automatically capture "expected outcome (probability distribution or scenarios) + revisit date" after decision. Constellation accumulates them in a "decision ledger" index. When the revisit date arrives, an "actual-outcome prompt + decision-quality vs. outcome-quality retrospective" card automatically fires. Without this, the §6 three-line summary never becomes a learning asset.

**8. §8 (recommendation) must be expressed as a **conditional recommendation**, not a single recommendation, so the user can adapt it to their circumstances.**

*Evidence.* Strategy consulting (McKinsey MECE pyramid principle, Barbara Minto) recommendation structure: "Given assumption A and constraint B, we recommend X; if A doesn't hold, fall back to Y; if B tightens, switch to Z." A single recommendation immediately voids when context shifts; a conditional one can be translated into the user's own context.

*Implication.* §8 structure: "Primary recommendation: X (assumes <a>, <b>); If <a> fails → Y; If user prioritizes <c> over <d> → Z." Specify the recommendation's effective assumptions. When the user negates an assumption, alternative paths auto-route.

**9. The brief must include a pre-mortem element in §5 or as a separate subsection — it is the strongest tool for minimizing post-hoc regret.**

*Evidence.* Gary Klein's pre-mortem (HBR 2007, "Performing a Project Premortem"): the ritual of imagining the decision has failed in a year and reasoning backward about why. Klein's research finds prospective hindsight improves failure-cause identification by 30 %.

*Implication.* §5 or §5b mandates two pre-mortem scenarios: (a) if the recommendation is a clear failure six months from now, what's the most likely failure path? (b) what is that path's early warning signal? These connect directly to the "go-back-to-revisit" trigger in the §7 decision tree.

**10. §1 (brief overview) must specify decision cost and deadline pressure in the header — it is the user's first decision: should I read this brief at all?**

*Evidence.* Herbert Simon's bounded rationality (1957) and satisficing: deciders cannot process all information; they stop at a "good enough" threshold. Without telling the user the stake (time budget to spend on this decision) up front, they over- or under-invest in the brief.

*Implication.* §1 header has four mandatory fields: (a) decision-type (Type 1 / Type 2), (b) deadline (absolute time or 'no rush'), (c) stake (estimated financial / reputational / tech-debt impact), (d) recommended reading time (time the user should invest in this brief). The user can then read only §1 and route (defer / escalate / proceed).

### Prompting implications

- Before writing the brief, force the agent to run a **door-type classifier** in the system prompt: "Before writing the brief, classify this decision: (a) Is rollback cost > N hours? (b) Are there third-party irrevocable commitments? (c) Is data destruction involved? If any yes → Type 1, full 8 sections required. Else → Type 2, minimal brief (§1 · §3 · §6 · §8) acceptable."
- When writing §4, "List boundary conditions (must-have / should-have / nice-to-have) BEFORE writing rationale. If you cannot list at least 2 must-haves, the decision is underspecified — request clarification from the user instead of generating the brief."
- When generating the §5 table: "Each row (alternative) must score on every criterion (column). Missing cells must be marked UNKNOWN with cost-to-investigate estimate. Do NOT fabricate scores to fill the table."
- In §8: "State your confidence (0–100 %) and the top 2 reasons your recommendation could be wrong. If confidence < 60 %, recommend deferral or smaller experiment instead of the alternative."
- Compel the agent to self-identify RAPID roles: "You are the Recommender. The user is the Decider. Identify Performer and Input contributors explicitly. If you are also the Performer, flag potential conflict of interest in §4."
- Cynefin self-judgment prompt: "Before §7, classify: cause-effect relationship is (a) self-evident (Clear), (b) requires expertise (Complicated), (c) only knowable in retrospect (Complex), (d) no time to analyze (Chaotic). Adapt §7 format accordingly."
- Compel pre-mortem: "Before finalizing §8, imagine the recommendation has failed catastrophically 6 months later. Write 2 failure narratives with early warning signals. Include these as §5b."
- Auto-register a post-decision revisit trigger: when generating the brief: "Set a revisit-date or revisit-trigger (e.g., when metric X crosses threshold Y). Without this, the decision is fire-and-forget and will not accumulate learning." The system auto-registers the schedule.
- When the agent writes "I recommend" in declarative form, force an "assuming <condition>" clause. Unconditional recommendations are forbidden.

### Structural recommendations

- New §0 header: decision-type, deadline, stake, recommended-reading-time, RAPID roles, Cynefin domain. Always above the 8-section body. In HTML, instant identification via color codes (red = Type 1 / Chaotic, yellow = Complex, green = Type 2 / Clear).
- Expand §4 (why) to "why + boundary-conditions table". Must / should / nice three tiers visually distinguished by weight and color. The §5 alternative-comparison table directly borrows boundary conditions as columns to preserve coherence.
- §5 is a three-layer structure of qualitative narrative + MCDA table + visualization. Mermaid for causal flow (cause → outcome nodes); chart.js for per-alternative multi-criteria scores (radar), expected value (bar), per-scenario distribution (box plot). Interactive sliders (HTML only) let the user adjust weights.
- New `reversibility panel` in §5: rollback cost, reversal window countdown (D − N days), trigger-to-revisit list.
- New `§5b pre-mortem` subsection: 2 failure scenarios for the recommendation + early warning signals. Short (3–5 lines per scenario).
- The §7 decision tree auto-switches format by Cynefin domain: Clear/Complicated → mermaid decision tree (checkbox leaves), Complex → mermaid probe-sense-respond diagram (parallel probes + observation indicators), Chaotic → "act-now card + 24h-retrospective scheduled" single card.
- §8 is conditional: "Primary X (assumes A, B) / If A fails → Y / If B tightens → Z". Confidence number and "top 2 reasons I could be wrong" displayed alongside.
- New §9 `decision capture`: post-decision fields capturing which option the user chose, revisit date, expected outcome. Accumulated in Constellation's decision-ledger index, forming the post-hoc learning loop.
- When embedded as a Constellation card, only §0, §6, §8 are exposed on the card surface (collapsed); others expand on the "expand brief" interaction. Satisficing users route quickly; deep-dive users access the full brief.
- HTML sidebar: meta-control "this brief was auto-classified as Type N / Cynefin <domain>. If you disagree, reclassify here." — surfacing that classification *is* the decision's first step.

### Pitfalls

- Forcing 8 sections uniformly on every decision: Type 2 (reversible) decisions' brief-generation cost exceeds the decision cost itself; users start ignoring the brief → the module decays. Without decision-type classification, unavoidable.
- §5 expected-consequences filled with qualitative narrative alone: users fall into "A feels better" and explicit negotiation of weights / criteria disappears. Without MCDA structure, §5 is a rationalization tool dressed as decision support.
- Missing boundary conditions: must-haves quietly bartered away in post-decision negotiation; the decision's very purpose collapses — Drucker's most frequent failure mode.
- Missing reversibility info: users misclassify Type 1 as Type 2 and proceed without sufficient deliberation → irreversible loss. Conversely, misclassifying Type 2 as Type 1 accumulates delay cost.
- Missing RAPID roles: post-hoc responsibility ping-pong ("the AI recommended" vs. "the user decided") leaves the learning loop unclosed.
- Forcing a decision tree on Cynefin Complex: produces false confidence, betting on a single path in a domain that calls for probe-and-learn.
- Missing pre-mortem: §8 falls into overconfidence — on average, recommenders don't spontaneously generate their own recommendation's failure scenarios (Klein research).
- Missing decision journal / revisit trigger: the same agent repeats the same traps — when the brief is a one-off output, organizational learning fails to occur.
- Single-recommendation format: when the user's context (assumptions / constraints) shifts, the recommendation immediately becomes useless. The user discards the whole brief with "this recommendation doesn't fit my situation".
- Missing stake / deadline header: users over-invest in trivial decisions or under-invest in critical ones — from Simon's bounded-rationality view, undifferentiated briefs misallocate the decider's resource.

### Concrete rules

- **MUST**: every brief's §0 header carries 5 fields — decision-type (Type 1 / Type 2), deadline, stake, RAPID roles, Cynefin domain. Missing fields invalidate the brief.
- **MUST**: Type 1 decisions get all 8 sections + §5 rollback cost, reversal window, point-of-no-return. Type 2 decisions accept the minimal set (§1 · §3 · §6 · §8).
- **MUST**: §4 names boundary conditions in three tiers (must-have / should-have / nice-to-have). If must-haves are fewer than 2, return a specification question to the user instead of generating the brief.
- **MUST**: §5 includes an alternative-comparison table; every cell is a quantitative value or 5-point scale + one-line rationale. Unknown cells = UNKNOWN + investigation-cost estimate. Empty cells forbidden.
- **MUST**: §5 always includes `do nothing / defer N days` as one of the comparison alternatives (preserves real-options value).
- **SHOULD**: §5b pre-mortem subsection — 2 failure scenarios for the recommendation + early warning signals. Mandatory in Type 1.
- **MUST**: §7 decision tree switches format by Cynefin domain. Deterministic decision trees are forbidden in Complex.
- **MUST**: §8 recommendation is conditional — "X assuming A, B / fallback Y if A fails / switch Z if B tightens" + confidence number + "top 2 reasons I could be wrong".

### Cross-axis connections

- **Psychology**: Type 1 / Type 2 classification ties directly to System 1 / System 2 activation — Psychology's "cognitive load / bias" supplies the psychological grounding for differentiating brief depth by decision type.
- **Philosophy**: boundary-conditions' must-haves meet "non-negotiable" decision rules — Philosophy's value priorities / deontological constraints supply the derivation rules for must-haves.
- **AI Harness**: door-type classifier and Cynefin domain classifier are implemented at the prompting meta-layer — this axis defines the classification rules; AI Harness handles their injection into the system prompt.
- **Humanities**: RAPID's responsibility attribution and decision-journal post-hoc retrospective connect with the humanities premise of "narrative responsibility for decisions".
- **Long-horizon Development**: the concept of "reversibility / rollback cost" maps directly to software's migration / feature flag / canary-deploy practices — the development axis can define tech-specific reversibility-measurement tools.
- **Psychology**: pre-mortem is the cognitive technique of prospective hindsight — Psychology supplements its mechanism and facilitation ritual.

---

## Axis 5 — Philosophy

### Lens

The philosophy axis normatively defines what counts as "grave", identifies escalation thresholds via the decision-rules of irreversibility / scale / time horizon / responsibility attribution, and embeds Toulmin / Bayes / virtue-epistemology epistemic humility as the brief's honesty devices (qualifier, rebuttal, calibration). In short, it grounds Hyperbrief's "why should this matter rise to a user decision?" and "what must the agent not pretend to know?"

### Core insights

**1. Hyperbrief's firing condition (escalation trigger) must be formalized via Jonas's asymmetry of responsibility. "Grave" is defined not as average expected value but as minimax across four axes: (a) irreversibility, (b) scale of impact, (c) time horizon, (d) reversal cost.**

*Evidence.* Hans Jonas, *Das Prinzip Verantwortung* (1979) — heuristic of fear: reversible and irreversible harm must be treated asymmetrically even at equal expected value; "listen to the bad prophecy more seriously than the good". The core mechanism is the refusal of expected-utility calculation against unbounded downside, plus lexicographic priority (irreversibility comes lexically before all other criteria).

*Implication.* A meta-section "Escalation Justification" before §1 makes the agent self-diagnose, on the four indicators (irreversibility / scale / time horizon / reversal cost), why the matter was delegated to the user. If all four are "low", the brief is overkill and the agent should decide. This blocks both *brief inflation (false escalation)* and *brief omission (false autonomy)*.

**2. §5 (expected consequences) must be decomposed into Toulmin's six argument elements to become a refutable argument rather than a mere pros/cons list.**

*Evidence.* Stephen Toulmin, *The Uses of Argument* (1958) — claim / grounds / warrant / backing / qualifier / rebuttal. Mechanism: presenting only the claim leaves the user unable to verify; separating grounds (evidence) from warrant (inference rule) makes weak points identifiable. The qualifier ("generally", "probability X") and rebuttal ("except in case Y") embed epistemic humility in the structure.

*Implication.* For each option's outcome prediction, force {prediction, grounds, inference rule, confidence qualifier, rebuttal condition}. When mermaid graphs option → outcome branches, label each arrow with a qualifier (probability / condition). Forbid "certain". Treat "rebuttal: none" as plausibility-check failure.

**3. §8 (recommendation) must simultaneously state its epistemic limits — otherwise the brief becomes "consent extraction", not "decision delegation".**

*Evidence.* Linda Zagzebski, *Virtues of the Mind* (1996) — intellectual humility as honestly marking one's epistemic position is an epistemic virtue. Goldman's veritistic value theory: a recommendation's epistemic value is measured not only by accuracy but by the listener's justification possibility (justification transfer). Recommendation without its grounds, counter-examples, and confidence reduces epistemic value because the listener trusts without verification.

*Implication.* Expand §8 to "Recommendation + Epistemic Profile": {recommendation, confidence (0–1), three conditions in which it shakes, what the agent doesn't know, why other rational agents could reach different conclusions}. Below 0.7 confidence, downgrade "recommendation" to "proposal candidate".

**4. The §7 decision tree is not a checkbox but a tool for identifying the Minimal Information Set (MIS) genuinely sufficient for the decision.**

*Evidence.* Aristotle, *Nicomachean Ethics* VI, *phronesis* (practical wisdom) — the mediation between universal principle and individual situation, whose core mechanism is judging "what is relevant *here*". Information irrelevant to the decision is epistemic noise that paralyzes the user's phronesis. Plus Herbert Simon's bounded rationality: adding information doesn't always improve decision quality; past a threshold it decreases it.

*Implication.* Every node in the decision tree must pass a decision-relevance test: "does the answer to this question make the user choose a different option?" Nodes that fail are removed. Tree depth > 3 triggers a user cognitive-load warning. §7 is redefined as a *relevance filter*.

**5. Confidence must be enforced as explicit probability intervals + calibration records, not natural-language ("probably", "generally").**

*Evidence.* Bayesian epistemology (especially Tetlock's *Superforecasting* and Brier-score tradition) — natural-language probability scatters across listeners with 20–80 % interpretation spread (Sherman Kent's NIE study), making post-hoc calibration impossible. Mechanism: forcing probability intervals makes the agent measure its uncertainty honestly, and accumulated brief accuracy calibrates the user's trust weighting.

*Implication.* Every prediction / recommendation mandates {point estimate, 90 % credible interval, the most plausible scenario in which this estimate misses}. "High / medium / low" alone fails lint. HTML uses chart.js confidence-interval bars. Cumulative module operation enables retrospective calibration.

**6. §5's expected consequences should apply a *reversed* Rawlsian veil of ignorance once — restate from the perspective of the actor most heavily affected.**

*Evidence.* John Rawls, *A Theory of Justice* (1971) — the veil of ignorance was originally for deriving justice principles, but its core mechanism (ignorance of one's position → adopting the worst-off perspective) applies to impact assessment. The decider (user) is easily trapped in their own perspective and underestimates the decision's externalities. Forced one-time restatement from the most-affected stakeholder's perspective surfaces externality awareness.

*Implication.* Add a "Most-Affected Stakeholder perspective" subsection to §5: identify the actor who will bear this decision's largest cost (future self, collaborating agents, code maintainers, humans other than the user) and restate the outcome in one line from their perspective. If unidentifiable, that itself is a warning signal.

**7. Embed Popper's falsifiability as the brief's self-check mechanism — a brief that cannot state "what would show this recommendation wrong?" is unqualified for decision delegation.**

*Evidence.* Karl Popper, *Logik der Forschung* (1934) / *Conjectures and Refutations* (1963) — assertions without falsifiability have no epistemic content. Mechanism: stating falsification conditions in advance enables post-hoc "right/wrong" judgment → cumulative learning + blocking irresponsible recommendation. AI agent hallucination essentially appears as unfalsifiable assertion.

*Implication.* §8 mandates a "Falsification trigger" alongside the recommendation: "if X is observed within N days, this recommendation must be rejected". §5 expected consequences also names a falsifier per scenario. "Falsifier: none" entries are marked vacuous and weighted 0 in the recommendation.

**8. The precautionary principle must operate as an explicit tie-breaking rule in §8 — when an irreversible and a reversible option have the same expected value, the reversible option is lexically prior.**

*Evidence.* 1992 Rio Declaration Principle 15 + Sunstein's critical formalization in *Laws of Fear* (2005) — weak precautionary principle: uncertainty is not a reason to defer action, but facing irreversible-harm possibility makes EV calculation unreliable, so reversibility becomes the meta-criterion. Mechanism: map the option space to (reversible, irreversible) × (low-cost, high-cost) 2×2 and treat irreversible × high-cost specially.

*Implication.* §8 adds a "Reversibility check": rollback cost of the recommendation (time / resources / recoverability) on a 0–3 scale. Score 3 (irreversible) forces an extra explicit confirmation step (checkbox in §7: "I accept irreversibility"). When a reversible alternative exists, it always sits atop §7's tree.

**9. Much of what agents call "decisions" are in fact "adoption of one option's unstated assumptions" — the brief must include a transcendental-analysis step that surfaces these hidden assumptions.**

*Evidence.* Collingwood, *An Essay on Metaphysics* (1940) on absolute presupposition analysis + Kant's transcendental argument form — trace back what must be true for an assertion to be meaningful. Mechanism: Options A and B differ often because of different background assumptions (architectural assumptions, user-intent inferences, time-horizon assumptions). The assumption *is* the decision's real branch point.

*Implication.* Between §3 (how) and §4 (why), a "Hidden assumptions" subsection: list at least three explicit premises the agent adopted to decompose this matter into options (e.g., "assuming the user prioritizes X", "assuming the system is in state Y"). If the assumption is wrong, the option space itself is void — visible to the user immediately.

**10. §6 (three-line summary) functions not as cognitive compression but as the "minimum information sufficient for decision" honesty test — reading only these three lines should yield the same conclusion as the full brief.**

*Evidence.* Aristotle's enthymeme (omitted syllogism) + the charitable-reading principle in analytic philosophy — a good summary is not information loss but core preservation. Mechanism: if the three-line summary alone leads to a different conclusion, either the brief includes information irrelevant to the decision (or misleading information) or the summary omits the core. Bidirectional coherence check.

*Implication.* §6 forces a coherence self-check: after writing the brief, the agent self-checks "can the recommendation be derived from the three-line summary alone?" If not, the brief is incoherent and must be rewritten. Each of the three lines fills a slot — (essence of the matter / core trade-off / recommendation with confidence).

### Prompting implications

- System-prompt principle: "You are not deciding; you are equipping the user to decide". When the agent expresses a recommendation, force "I recommend X with confidence 0.X because Y; this would be wrong if Z" — not "should/must".
- Force an escalation self-diagnosis before the brief: 0–3 score on each of the 4 indicators (irreversibility / scale / time horizon / reversal cost) with one-line grounds. Below threshold sum, stop brief generation and have the agent decide.
- Forbid natural-language probability; require numeric intervals. "might / could / possibly" are lint-rejected and re-written explicitly.
- Mark a brief as incomplete when the falsification trigger is missing — a brief that cannot answer "what would show this recommendation wrong?" cannot be submitted.
- Forbid "none" as an answer in the Hidden Assumption section — assumption-less option decomposition is impossible; "none" signals self-deception.
- A brief with a single option is itself inappropriate — not a real branch but a notice; route to a different channel (notification).
- Vocabulary-level separation of recommendation and decision: the brief has only a "Recommendation" section; the "Decision" section is an empty slot only the user fills.
- Cumulative calibration log: track each brief's confidence and post-hoc result to derive per-agent Brier score → auto-correct future confidence.
- The brief must maintain quality under time pressure (e.g., build in progress); guarantee at system level that work pauses during brief writing (blocks decision-forcing while brief is being written).

### Structural recommendations

- New section 0 (Escalation Justification) before §1: 4-indicator scores + one-line "why the agent did not decide autonomously". Without this, the brief is reduced to "an AI tool for shifting responsibility".
- Restructure §5 as "Toulmin-based outcome argumentation": for each option, force 5 fields {prediction claim, grounds, warrant, qualifier, rebuttal}. In mermaid, label arrows with qualifiers (probabilities); attach rebuttal nodes to each leaf.
- The §7 decision tree is pruned on the Minimal Information Set principle: questions whose answers don't change the option choice are removed. Each node carries a one-line label of "how this question affects the decision".
- Expand §8 to "Recommendation + Epistemic Profile": {recommendation, confidence 0–1, falsification trigger, reversibility score 0–3, reasons rational dissenters could reach a different conclusion}. HTML uses chart.js gauge for confidence, color scale (green/yellow/red) for reversibility.
- Between §3 and §4, a "Hidden Assumptions" mini-section: ≥ 3 premises the agent adopted to construct the options, as bullets. If the assumption is wrong from the user's perspective, the whole brief is void — stated explicitly.
- §6 three-line summary forces a slot format: (1) essence of the matter (2) core trade-off (3) recommendation with confidence. Free-form forbidden.
- HTML output adds a "Decision Receipt" area: on selection, the chosen option, the brief's confidence at the time, the falsification trigger, and the follow-up review date are auto-recorded as input for retrospective calibration.
- Mermaid diagrams mark an "irreversible boundary" as a visual line (red dashed) alongside option branches — options crossing that line require an extra confirmation step.

### Pitfalls

- If recommendation intensity and confidence are not separated, the brief becomes a tool where the AI effectively decides and the user rubber-stamps. The system must block strong tone + low confidence.
- Treating irreversibility as a single boolean misclassifies "hard but possible to reverse" as reversible, evading the precautionary check. A 0–3 scale and explicit "rollback cost" are essential.
- Falsification triggers filled perfunctorily (e.g., "if everything goes wrong") — without three verifiable components (observation point, target, threshold), it's invalid.
- Filling Hidden Assumptions with "none" is self-deception — assumption-less option decomposition is logically impossible; "none" must be lint-rejected.
- Prompting framing failure where the option space is limited to what the agent presented — a meta-question "could options exist that this brief doesn't present?" must always be visible to the user (at §7's root).
- Natural-language probability prevents calibration + 80 % interpretation variance between users (Sherman Kent). Failure to enforce numeric form invalidates the module's epistemic value.
- Average-EV trap: calculating an irreversible catastrophic option and a reversible minor option at the same EV violates Jonas's responsibility asymmetry. Without lexicographic ordering, the brief can justify dangerous recommendations.
- Self-reinforcement of the recommendation: the agent's written brief selects grounds toward justifying its recommendation — motivated reasoning. Cannot be avoided without explicit devil's-advocate sections.
- Quality drift under time pressure where confidence / falsifier / assumption get omitted. Quality gates must be time-pressure-independent; under shortage, refuse to generate and recommend deferral.
- Briefs functioning as "consent extraction" while wearing the form of "decision delegation" — the user's path to *reject* the recommendation (a "what to do if you reject the recommendation" branch in §7) must always be explicit.

### Concrete rules

- **MUST**: every brief's section 0 scores irreversibility / scale / time-horizon / reversal-cost on 0–3 and Hyperbrief fires only at sum ≥ 4. Below, the agent decides.
- **MUST**: the recommendation (§8) must include confidence (0–1 numeric) and a falsification trigger (3 components: observation target, time, threshold). Missing → invalid.
- **MUST**: briefs with a single option are forbidden — they are notices, routed elsewhere.
- **MUST**: when the recommendation's reversibility score is 3 (impossible), an explicit "I accept irreversibility" checkbox is forced in §7, and a reversible alternative of similar effect, if it exists, sits above the recommendation.
- **SHOULD**: each option's outcome in §5 fills Toulmin's 5 fields (claim / grounds / warrant / qualifier / rebuttal); "rebuttal: none" raises a plausibility warning.
- **SHOULD**: the Hidden Assumptions section between §3 and §4 lists ≥ 3 explicit premises; "none" lint-fails.
- **SHOULD**: natural-language probability ("probably", "likely", "generally") is forbidden in body text and auto-rewritten as numeric intervals.
- **SHOULD**: the §6 three-line summary follows slot format (essence / core trade-off / recommendation + confidence) and reading the summary alone must reach the same recommendation (self-coherence test).

### Cross-axis connections

- **AI Harness**: enforcement of falsification trigger / confidence / hidden assumption is implemented at prompting / linting / output-schema levels — AI Harness handles enforcement.
- **Psychology**: precautionary principle and reversibility lexicographic ordering interact with the user's loss aversion / status-quo bias — Psychology handles bias correction; Philosophy supplies normative justification.
- **Management**: Toulmin / Bayesian calibration converge with management's decision-quality frameworks (Howard, Russo) — Philosophy is the normative ground, management the operational method, with clean division of labor.
- **Humanities**: where humanities handles user / culture-specific value dimensions in defining "grave", Philosophy supplies the formal decision rules (irreversibility / responsibility attribution) that cut across value dimensions.
- **Long-horizon Development**: reversibility scores connect to "reversible vs one-way door" (Bezos) distinctions in code / architecture decisions — development provides domain-specific reversibility criteria; Philosophy justifies the meta-principle.
- **Psychology · Humanities**: enforcing "Most-Affected Stakeholder perspective" is a perspective-taking cognitive task overlapping psychology; identifying *who* the stakeholder is requires humanities social analysis.

---

## Axis 6 — Long-Horizon Development

### Lens

From the perspective of software's long evolution, the question is: *"where will this decision tie us down six months from now?"* Beyond a decision's immediate coherence, the axis surfaces time-axis costs — reversibility, blast radius, coupling surface, Hyrum-exposure — so short-term rationality does not accumulate into long-term irrationality.

### Core insights

**1. A decision's essential cost is not "execution cost" but "rollback cost × accumulated coupling until the failure is discovered". The original §5 treats cost as a single-point scalar; without a reversibility dimension, one-way doors get treated like two-way doors — a structural error.**

*Evidence.* Bezos's Type 1 / Type 2 classification + the reversibility principle settled in Amazon's API mandate retrospective. One-way decisions must raise the evidence threshold by an order of magnitude compared to two-way; treating both classes under the same protocol under-vets Type 1 and over-vets Type 2 — both slow the organization.

*Implication.* §5 strengthens with a required "Reversibility Classification" field: `{two_way / one_way / one_way_with_migration_path}` × `{undo_cost: estimated time/effort/relational cost}` × `{decay_horizon: window in which reversal is still possible}`. If classified `one_way`, a "Type 1 — additional evidence required" warning badge is forced next to §8.

**2. The "recommendation" almost always under-represents the blast radius. Without explicit specification of where the change surface spreads — code / data / contracts / external dependents / operational procedures — the user assents to "a global change that looks local".**

*Evidence.* Google SRE Workbook's *change blast radius* concept + Hyrum's law (with enough users, every observable behavior has dependents). API-visible one-line changes triggering silent breakage downstream are standardized incident patterns.

*Implication.* §2 (what) adds a `blast radius surface`: `{touched_modules, touched_contracts, touched_data_at_rest, touched_external_consumers, touched_operational_runbooks}`. Empty slots must be `verified empty`; `unknown` is an explicit red flag.

**3. ADRs (Architecture Decision Records) deliver maximum value when written at decision-*request* time, not after. The original §4 ("why") risks post-hoc rationalization — "why are we doing this now?" and "why are we rejecting alternatives?" must be separated.**

*Evidence.* Michael Nygard, *Documenting Architecture Decisions* (2011), standard form: Context / Decision / Status / Consequences. The core is the *Considered Alternatives* section; without it, six months later "why didn't we do X?" gets re-litigated, paying the same decision cost twice.

*Implication.* Split §4 (why) into two subsections: (a) Decision Driver — what forces this decision now (forcing function), (b) Rejected Alternatives — at least 2 alternatives + each one's rejection reason. One or zero alternatives flag false dichotomy in red.

**4. Technical debt is not single-dimensional. Without Fowler's four-quadrant model (deliberate/inadvertent × prudent/reckless), "pragmatic shortcuts" (deliberate-prudent debt) and "we'll fix it later" (deliberate-reckless debt) get bundled into the same recommendation; the user mistakes the latter for the former.**

*Evidence.* Fowler, *Technical Debt Quadrant* (2009) + Kelly Sutton's *tech-debt as inventory* model. Reckless debt accrues interest non-linearly; statistical patterns in post-mortems show forced full-module rewrites 6–12 months later.

*Implication.* §5 adds a `Debt Profile`: `{quadrant: deliberate_prudent / deliberate_reckless / inadvertent_prudent / inadvertent_reckless, repayment_trigger: when due, interest_model: linear / compounding / cliff}`. Cliff debt (free until a threshold, then explodes) gets a blocking warning in the recommendation.

**5. Coupling is the hidden cost of the recommendation. The original lacks a section asking "what couplings does this decision create / break", so decisions that increase coupling surface are reported as "simple additions".**

*Evidence.* Ousterhout, *Philosophy of Software Design*, "deep module" principle + Hickey's *Simple Made Easy* definition of *complect*. Changes that degrade the interface-width / implementation-depth ratio function, but permanently raise the marginal cost of every future change.

*Implication.* §2 (what) adds a `Coupling Delta`: `{new_dependencies, new_consumers, interface_surface_delta: +N methods / +M fields, depth_to_interface_ratio_change}`. When interface width grows without depth growth, a "shallow module growth" warning fires.

**6. Agent recommendations almost never present incremental migration paths like strangler fig / branch-by-abstraction; they present a big-bang alternative only. The absence of incremental paths is the most common cause of "irreversible decisions".**

*Evidence.* Fowler, *StranglerFigApplication* (2004) + *BranchByAbstraction* (2007). In large refactor / replacement decisions, the rollback-feasibility gap between teams that mandated incremental-path review and those that didn't shows up consistently in post-mortems.

*Implication.* §8 forces an `Incremental Path Check`: if the recommendation is big-bang, explicitly answer (a) why strangler fig is impossible, (b) why branch-by-abstraction is impossible, (c) why feature-flag splitting is impossible — without these three, the "recommended" label cannot be issued.

**7. Lehman's laws of evolution: "the system, as it is used, accumulates change pressure; without change, satisfaction falls". The original decision model is static and treats "do nothing" as a cost-free baseline, but do-nothing is actually a *cost-accumulating active choice*.**

*Evidence.* Lehman's 8 laws of software evolution (especially I. Continuing Change, II. Increasing Complexity, VI. Continuing Growth). The most authoritative empirical statement of "no decision is a decision".

*Implication.* §5 adds a required `Null Option Cost` slot: if the decision is deferred or rejected, estimate costs at `{30d / 90d / 1y}` horizons. A null-option reported at zero cost auto-flags red — Lehman violation.

**8. Decisions accompany an "observability cost". New features / new couplings / new data flows create gray zones where "if not observed, debugging is impossible" even if they work. The original lacks this dimension.**

*Evidence.* Charity Majors, *Observability Engineering*, + Google SRE's classification of "unknown unknowns". 30–40 % of new decisions are identified as "observability gaps" only after an incident — a standard finding in production system post-mortems.

*Implication.* §2 or §5 specifies `Observability Cost`: `{new_signals_needed: metrics / logs / traces to add, debuggability_delta: change in estimated diagnosis time}`. When new couplings / data flows exist with zero observability increment, a "silent failure risk" warning fires.

**9. Recommendations that uncritically apply Postel's law (be strict in what you send, liberal in what you accept) explode Hyrum exposure. The original treats "compatibility" as a monotonic line, but liberal reception trades short-term compatibility for long-term coupling.**

*Evidence.* Postel's robustness principle (RFC 760) + subsequent critique (Eric Allman 2011, Martin Thomson IETF draft *The Harmful Consequences of the Robustness Principle*, 2019). Liberal parsers silently accept non-standard input, and that behavior itself becomes a new de facto standard — a lock-in.

*Implication.* When §8 implies "be liberal in what you accept", force a `Hyrum exposure check`: what non-standard behaviors risk becoming de facto contracts? Is there a strictness toggle to block them?

**10. The original §7 (decision-criteria tree) only enforces tree structure, not the *information value* of nodes. A good decision tree starts with the *cheapest discriminator* — the question that, at lowest information cost, splits the largest decision space — at the root.**

*Evidence.* Decision-tree learning's information-gain principle + Cynefin (Snowden) on domain-specific decision approaches. Trees that ask the "most expensive question" first explode user cognitive load and never actually get traversed.

*Implication.* §7's root node is fixed as `reversibility check` (is this 2-way?). The next level is `blast radius check` (local or global?). The next, `time pressure check` (must we decide now?). Domain-specific questions sit from level 4 onward. This ordering implements the cheapest-discriminator principle.

**11. The original 8 sections lack `Decision Provenance` tracking (from which prior decision this request derived). Without explicit statement that follow-on decisions inherit prior assumptions, when a prior is discarded the follow-on becomes a zombie decision.**

*Evidence.* ADR's `Supersedes / Superseded by / Relates to` links + the RDBMS foreign-key cascade model. Teams maintaining a decision graph vs. teams using only one-off ADRs show repeated coherence-gap reports in enterprise architecture literature at the 6-month mark.

*Implication.* §1 header gains a `Decision Lineage` meta-slot: `{parent_decisions: [id1, id2], assumed_invariants: [...]}`. When a parent is discarded / changed, the dependent decision auto-enters the re-review queue.

**12. AI-agent-written hyperbriefs tend to fail at surfacing "what the agent doesn't know". The original lacks slots for `confidence` and `epistemic gap`, so guesses are printed at the same weight as facts.**

*Evidence.* The standard "known unknowns vs. unknown unknowns" classification in post-incident review + calibrated-forecasting research (Tetlock, *Superforecasting*). Strong positive correlation between unmoderated confidence entering decisions and downstream error rates.

*Implication.* Every section requires an `epistemic tag`: `{verified / inferred / assumed / unknown}`. When the inferred-or-higher proportion in §5 and §8 crosses a threshold (e.g., 40 %), a "low-confidence briefing — additional reconnaissance recommended" header is auto-added.

### Prompting implications

- Embed Type 1 / Type 2 reversibility classification as a hard requirement in the system prompt: every brief's precondition. Briefs without classification cannot output.
- Force the agent to provide "Rejected Alternatives ≥ 2". Fewer than 2 triggers brief regeneration in self-check. "No alternatives" must be justified by an explicit N-sentence "why the forcing function closes the option space".
- Before outputting a big-bang recommendation, the internal checklist asks: strangler-fig possible? branch-by-abstraction possible? feature-flag split possible? Without explicit answers, downgrade "recommended" to "tentative".
- Instruct the agent to compute `Null Option Cost` (do-nothing cost) as a separate slot in every brief. Cost-zero reports fail the Lehman-law check and re-roll.
- `Hyrum exposure check` prompting: if the recommended change touches externally visible behavior (API, output format, timing, even error-message strings), explicitly output which dependents could lock in to that behavior.
- Force epistemic tagging: every claim output as fact must bear one of `{verified | inferred | assumed | unknown}` — else fail sanity check.
- The recommendation's "cost" estimate must separate three dimensions: time (person-day) + reversibility (rollback cost in person-day) + debt (quadrant).
- When the agent references a prior decision, force `decision_id` linking. Vague "as decided before" is forbidden — superseded tracking fails.
- If the user says "just do it", instead of skipping the brief, downgrade to `Express Brief` (sections 1 + 5 + 7 only; reversibility *must* remain). Reversibility can never be omitted, in any mode.

### Structural recommendations

- New `Decision Header` meta block above original §1: `{reversibility: 2way / 1way / 1way+migration, blast_radius: local / module / system / cross_system, time_pressure: now / this_week / this_month / none, decision_lineage: parent_ids[]}`. The user must grasp the decision grade in 30 seconds.
- Split original §4 (why) into two sub-sections: 4a Decision Driver (forcing function — why now?), 4b Rejected Alternatives (≥ 2 + each rejection reason). Empty 4b = brief incomplete.
- Restructure original §5 (consequences) as a table: rows = {recommendation, alternative-1, alternative-2, do_nothing}, columns = {30d cost, 90d cost, 1y cost, rollback cost, debt quadrant, blast radius}. Empty cells are visually identifiable instantly.
- Standardize original §7's root 3 nodes: (1) reversibility, (2) blast radius, (3) time pressure. Domain questions from level 4. Render with mermaid flowchart; root 3 nodes differentiated by color / weight.
- HTML adds a `Decision Cost Surface` radar chart: axes = {feature cost, reversal cost, coupling cost, debt cost, observability cost, Hyrum cost}. Overlay recommendation and alternatives on the same chart — see *cost shape*, not a single point.
- HTML adds a `Decision Graph` mini-view: shows current decision node and parent / sibling / likely-children decision nodes to visualize prior-assumption dependencies. Lite version of an ADR graph.
- When embedded as a Constellation card, the top-left of the header forces a reversibility badge (green / yellow / red). One card-line must communicate "Type 1 — careful review required" visually.
- Every section's footer carries a `last_verified` timestamp. Briefs more than 24 hours old display "re-verification recommended" to the user — Lehman's law at brief-level.
- MD output aligns section IDs to ADR-compatible headers (Title / Status / Context / Decision / Consequences) for 1:1 mapping, so the brief can settle as an archived ADR.
- §8 (recommendation) outputs `Recommended path` and `Reversible fallback` as a pair. Recommendations without a fallback are forbidden — structurally blocking "non-reversible recommendations".

### Pitfalls

- Without reversibility classification, all decisions hit the same threshold → Type 1 gets processed at Type 2 speed; one-way doors close inadvertently. "Why did we do that?" incidents six months later.
- Treating "do nothing" as zero-cost baseline → Lehman violation. Deferring / rejecting also generates active cost, but if the brief hides that, the user misreads it as the "safe choice".
- Big-bang recommendations only, no incremental-path review → decisions where strangler-fig / branch-by-abstraction were possible become one-way. Rollback options excised at decision time.
- Missing Rejected Alternatives → six months later "why didn't we consider X?" re-litigation costs the same decision twice (ADR-absence pattern).
- Blast radius expressed only as line-count → Hyrum violation. Fails to surface that a one-line change is global to external dependents.
- Missing Coupling Delta → decisions that grow coupling surface report as "simple additions". The marginal cost of every future change rises permanently, but cumulative cost is invisible in the brief.
- Single-dimensional technical debt → deliberate-prudent and inadvertent-reckless bundled into the same recommendation. The user approves "pragmatic shortcut" but actually consents to cliff debt.
- Missing decision lineage → discarded parents leave children as zombies. The most common systemic cause of coherence collapse.
- Missing epistemic tagging → agent guesses output at the same weight as facts. The user can't distinguish confidence levels and makes one-way decisions on guesses.
- Missing observability cost → new couplings / data flows create silent-failure zones that aren't visible in the brief. Debugging-impossible zones come bundled with the decision for free.

### Concrete rules

- **MUST**: every brief outputs the Decision Header (reversibility / blast_radius / time_pressure / decision_lineage) *before* §1. Missing → brief is "incomplete" and cannot be submitted as a recommendation.
- **MUST**: §4 includes both (a) Decision Driver and (b) ≥ 2 Rejected Alternatives. ≤ 1 alternative requires explicit "why the forcing function closes the alternative space".
- **MUST**: §8 recommendation always paired with a `Reversible Fallback`. Fallback == "no fallback possible" auto-classifies reversibility as `one_way` and forces a red badge.
- **MUST**: §5 consequences includes `do nothing` as a separate row, estimated at non-zero. Zero estimate flags Lehman violation.
- **SHOULD**: every fact claim bears an epistemic tag `{verified / inferred / assumed / unknown}`. Inferred-or-higher proportion > 40 % → header banner "low-confidence".
- **SHOULD**: before outputting a big-bang recommendation, state the impossibility reasons for strangler-fig / branch-by-abstraction / feature-flag — three reasons. Without them, downgrade to "tentative".
- **SHOULD**: §7 decision tree's root 3 nodes are fixed as (reversibility, blast radius, time pressure). Domain questions from the next level.
- **MUST**: Constellation card embedding's header top-left has a reversibility badge (green / yellow / red). Decision grade must be visually identifiable from one card line.

### Cross-axis connections

- **Psychology**: the reversibility badge isn't merely an information label but a visual device blocking sunk-cost / commitment-escalation bias. Where psychology handles "post-decision change difficulty", development supplements with "pre-decision reversibility surfacing".
- **Management**: Type 1 / Type 2 classification connects directly to Bezos's decision classification, but development concretizes it into a technical-judgment criterion at the code / contract / data layer. Management handles "what kind of decision"; development handles "what makes it that kind in code terms".
- **Philosophy**: "higher evidence threshold for irreversible decisions" coheres with philosophy's asymmetric-risk principle; development translates it into an operational definition of one-way / two-way doors.
- **AI Harness**: epistemic tagging combines directly with LLM hallucination-blocking meta-prompting. AI Harness handles "how to make the agent report confidence"; development provides the rationale for why verified vs. inferred vs. assumed distinctions affect decision thresholds.
- **Humanities**: ADR's "Considered Alternatives" is a form of record-keeping culture, connected to humanities' tradition of "memory and justification of decisions". Development operationalizes it as a `parent_decisions` graph.
- **Management**: `Null Option Cost` (do-nothing cost) aligns directly with management's opportunity-cost concept; development strengthens the quantification rationale via Lehman's laws.

---

## Closing remark

Six axes were chosen because each one *independently* arrived at the diagnosis that **the briefing's form itself is the failure mode**. AI Harness sees prompt-level forcing-function absence; Humanities sees Habermas-style coerced consent; Psychology sees anchoring + IKEA effect + alert fatigue; Management sees uniform-depth briefs decoupled from decision type; Philosophy sees epistemic-humility devices absent; Long-horizon Development sees reversibility blindness. The convergence is the document 002's starting point — it cannot be a coincidence that six unrelated disciplinary literatures, applied to the same artifact, all return *"the briefing's form, not its content, is what needs the rule."*
