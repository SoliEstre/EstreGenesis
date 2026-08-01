---
name: talka
description: "Talk-about elicitation — hold a relaxed, topic-anchored conversation that progressively draws out the requester's tacit knowledge needed for an upcoming review or judgment call. The gentle sibling of /eg-interview: same goal (real intent, real constraints, real criteria), opposite pace — one thread per turn, statements offered for correction instead of question batteries. For the human-facing agent."
---

# /talka — talk-about elicitation (conversational knowledge intake)

`/eg-interview` presses a request into a delegable brief in a few batched rounds. `/talka` covers the cases where that press fails or harms: the knowledge is **tacit** (the requester knows more than they can answer directly), the topic is **early** (no concrete request exists yet to brief), or the relationship cost of interrogation exceeds the information gain. The output is not a brief — it is **accumulated judgment material**, materialized at the end.

## 1. When to run (and when not to)

Run when a review or judgment is coming up whose quality depends on what the requester knows — domain constraints, history, taste, unstated red lines — and direct questioning would under-extract it. Do NOT run when a concrete request already exists (that is `/eg-interview`'s job), when the decision is already framed (that is Hyperbrief's job), or when the needed facts are measurable from the workspace (measure instead of asking — a question answerable by reading a file is not a conversation topic).

## 2. Conversation discipline

- **Topic anchor, loose leash.** Name the topic once at the start. Drift is allowed — tangents are where tacit knowledge lives — but return to the anchor when a tangent stops yielding.
- **At most one question per turn**, often zero. Prefer contributions: state an observation, a hypothesis, or a tentative reading of the situation, and let *correction* do the extraction. People correct a wrong statement more readily — and more precisely — than they answer an open question. This is `/eg-interview`'s default-and-confirm, slowed to conversational pace.
- **Follow the requester's energy.** Deepen where they lean in; the thing they volunteer unprompted is usually the thing the checklist would have missed.
- **Mirror periodically.** Restate what you heard in your own words ("그러니까 X 라는 말씀이죠") — mishearing surfaces immediately instead of surviving into the judgment.
- **Contribute genuinely.** Never feign ignorance to farm answers; a conversation where one side is performing curiosity reads as an interrogation with extra steps.

## 3. The elicitation ledger

Keep a running ledger — not surfaced every turn — of what has been extracted: *fact · the turn it came from · confidence (stated outright vs inferred from a correction) · what judgment it changes*. The ledger is what distinguishes elicitation from chat: every entry must matter to the upcoming review; an entry that changes nothing gets dropped, not hoarded.

## 4. Exit and materialization

Stop when the pending judgment is materially better informed, or when returns diminish (the last several turns added no ledger entries). Close by **summarizing what was learned and confirming it** — the summary is the last, largest correction opportunity. Then materialize the confirmed ledger to a durable surface: an agent-memory note, a Compendium entry where adopted, the context section of a coming decision brief, or the board entry the judgment belongs to. A talka whose ledger evaporates with the session was chat.

## 5. Composition

- **→ `/eg-interview`**: a talka may end by pivoting — once the topic has firmed into a request, press it into a delegable brief.
- **→ Hyperbrief**: ledger entries become §1 context-horizon and §4 hidden-assumption inputs, tagged by their confidence class (stated vs inferred).
- **→ `/feeda`**: when the requester hands over an external document mid-conversation, that artifact routes to feed-analysis; talka resumes with its verdicts as material.
