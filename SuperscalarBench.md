# Superscalar Bench — trust cost

> What one **verified** coding result costs, in money and minutes, per model × harness × effort — measured on a ladder of six tasks with hidden acceptance suites, across <!--bn:models-->20<!--/bn--> models in <!--bn:harnesses-->4<!--/bn--> harnesses. Vocabulary (aim, reach, one-shot, trust cost) is defined in [Superscalar.md §5.1.5](Superscalar.md); this page reports what was measured and how. **Single observer, private tasks** — read the [limits](#limits) before quoting a number. **The rows for <!--bn:n1ModelsEn-->Opus 4.8, Opus 5 and Sonnet 5<!--/bn--> are n=1 so far** (one run per task × effort); runs 2–3 are being measured and the figures will be updated.

[한국어](#한국어)

![Superscalar Bench — the six aims, one key image each, on the designed ladder](docs/assets/bench/trust-cost-aims-en.png)

## What is measured

- **Unit**: model × harness × effort. The same model behaves differently under different harnesses, and that is how it is used.
- **Result**: a run *reaches* when the task's hidden acceptance suite passes completely. No partial credit.
- **Rounds**: the first answer, then up to three refinement rounds (four rounds in all). Refinement feedback is what CI gives a person — failing test names and assertion messages, never the test code. A run that passes on the first answer is **one-shot**.
- **Trust cost / trust time** = mean cost / wall time over *all* attempts (refinement rounds included) ÷ reach rate. A model that is cheap per attempt but rarely reaches pays for its misses here. A combination that never reached has no trust cost.
- **Cost** is API-equivalent list price, not what a subscription costs: Claude Code and Grok Build report it; Codex and Antigravity runs are priced from token counts × published prices.
- **Repetitions**: <!--bn:nNoteEn-->n = 3 per cell; n = 1 for Opus 4.8, Opus 5 and Sonnet 5 (further runs being measured); Fable 5.1: one cell with n = 2<!--/bn-->. The numbers on this page, in the figures and in the tables all come from one snapshot of the run records.

## The aim ladder

Each aim is one task. Within an aim every model is judged by the same hidden suite. The aims form a ladder ordered by task scope, designed to get harder as it climbs (an aim itself is a result level, not a difficulty grade — §5.1.5):

<!--bn-block:aims-md-en-->
| | aim | task | hidden tests | reach | first answer | median trust time | median trust cost |
|---|---|---|---:|---:|---:|---:|---:|
| <img src="docs/assets/bench/keyart/aim1.png" width="56" alt="aim 1 key image"> | aim 1 | mechanical multi-file edit | 25 | 100% | 96% | 3.6 min | $0.40 |
| <img src="docs/assets/bench/keyart/aim2.png" width="56" alt="aim 2 key image"> | aim 2 | spec-complete implementation | 73 | 100% | 90% | 5.2 min | $0.57 |
| <img src="docs/assets/bench/keyart/aim3.png" width="56" alt="aim 3 key image"> | aim 3 | multi-step feature + schema migration | 49 | 100% | 99% | 6.5 min | $0.72 |
| <img src="docs/assets/bench/keyart/aim4.png" width="56" alt="aim 4 key image"> | aim 4 | diagnose-and-fix from a symptom report | 37 | 100% | 99% | 5.0 min | $0.53 |
| <img src="docs/assets/bench/keyart/aim5.png" width="56" alt="aim 5 key image"> | aim 5 | design + build a small language interpreter | 96 | 98% | 89% | 10.7 min | $1.06 |
| <img src="docs/assets/bench/keyart/aim6.png" width="56" alt="aim 6 key image"> | aim 6 | crash-safe transactional key-value store | 58 | 95% | 82% | 13.5 min | $1.10 |
<!--/bn-block-->

![The aim ladder — six tasks in designed order of difficulty, and what was measured](docs/assets/bench/trust-cost-ladder.png)

Key images: one wordless picture per aim, generated with Codex CLI's built-in image tool from published prompts ([how they were made](docs/assets/bench/keyart/README.md)); the sheet's text, numbers and ladder are drawn by code.

Medians are over the <!--bn:a1Combos-->89<!--/bn--> model × harness × effort combinations of each aim (<!--bn:nNoteEn-->n = 3 per cell; n = 1 for Opus 4.8, Opus 5 and Sonnet 5 (further runs being measured); Fable 5.1: one cell with n = 2<!--/bn-->). A combination that never reached on an aim has no trust cost and is left out of that aim's trust medians — this happens only on aim 6 (see finding 1).

**How to read it.** Aims 1–4 fall within <!--bn:a1Cost-->$0.40<!--/bn-->–<!--bn:a3Cost-->$0.72<!--/bn--> and <!--bn:a1Time-->3.6<!--/bn-->–<!--bn:a3Time-->6.5<!--/bn--> min per verified result without a steady rise — aim 2 trips the first answer more often than aims 3–4, and aim 4 is cheaper than aim 3. Aims 5 and 6 sit above that range: about twice the aims 1–4 median in cost, and two to nearly three times in time. They cost about the same at the median, but aim 6 takes longer and misses more; aims 5 and 6 are the only rungs where runs fail to reach. The order is the designed one; the table is what was measured, and it is not a smooth trend.

## Setup

| harness | models | effort levels |
|---|---|---|
| Claude Code (CLI 2.1.284) | Claude Sonnet 5.5 · Claude Opus 5.5 · Claude Fable 5.1 · Claude Fable 5 | low · medium · high · xhigh · max |
| | Claude Opus 5 · Claude Sonnet 5 · Claude Opus 4.8 — **n=1** | low · medium · high · xhigh · max |
| | Claude Haiku 4.5 | default |
| Claude Code (CLI 2.1.293, installed side by side) | Claude Haiku 5.5 | low · medium · high · xhigh · max |
| Codex | GPT-6.1 Sol · GPT-6 Sol · GPT-6 Astra · GPT-6 Luna · GPT-5.6 Sol · GPT-5.6 Terra · GPT-5.6 Luna | low · medium · high · xhigh · max |
| Grok Build | grok-4.7 · grok-4.6 | low · medium · high · xhigh |
| Antigravity | Gemini 3.8 Flash | low · medium · high |
| | Gemini 3.1 Pro | low · high |

- **<!--bn:combos-->89<!--/bn--> combinations × 6 aims (<!--bn:nNoteEn-->n = 3 per cell; n = 1 for Opus 4.8, Opus 5 and Sonnet 5 (further runs being measured); Fable 5.1: one cell with n = 2<!--/bn-->), less one invalid run that was not re-measured** (Claude Fable 5.1 at max on aim 2 — the [incident](#an-incident-empty-feedback-invites-probing) below): <!--bn:runs-->1,421<!--/bn--> valid runs (aims 1–5: <!--bn:runsAims1to5-->1,184<!--/bn-->, aim 6: <!--bn:runsAim6-->237<!--/bn-->), measured <!--bn:dateFirst-->2026-09-30<!--/bn--> → <!--bn:dateLast-->2026-10-09<!--/bn--> on one machine (all dates and times on this page are UTC). The rows for Claude Haiku 5.5, Opus 5, Sonnet 5, Opus 4.8 and GPT-5.6 Sol · Terra · Luna were measured after all the others.
- **n=1 rows.** <!--bn:n1ModelsEn-->Opus 4.8, Opus 5 and Sonnet 5<!--/bn--> have one run per task × effort so far. Runs 2–3 are being measured, and the figures and tables will be updated when they finish. Their rankings are mostly reliable, but read a gap under ~20% between two n=1 cells as a tie.
- Each run works in an isolated copy of the task repository. The model may run `node` there (a gate admits node commands only); other shell commands are denied. Plugin hooks are disabled in the Claude Code benchmark sessions from 2026-10-01 11:00 (earlier runs: see the defects table).
- Round budget 90 minutes of wall time. Claude Code's per-response output cap was kept at the harness default (64,000 tokens); see [limits](#limits).
- **Procedure vs §5.1.5.** This campaign ran every combination on all six aims instead of stopping at the first unreached aim, and reports API-equivalent cost only (no plan-quota figure). The aim list in §5.1.5 predates the sixth aim.
- **Harness prompts.** Claude Code sends each Claude model its own built-in system prompt — that is part of the harness, so a comparison between two Claude models is a comparison of model plus harness prompt, as it is under any harness.
- **Invalid runs are counted apart from unreached runs** (failing and breaking the rules are different outcomes). <!--bn:setAside-->141<!--/bn--> records were set aside: runs under measurement-condition defects that were fixed and re-measured, quota and entitlement refusals, harness sessions that did no work (0 tokens in every round), and one run whose submission inspected the grader.

## Findings

**1. The ladder separates on time, cost and the first answer before it separates on reach.** Every run of aims 1–4 reached. Aim 5 is the first rung with misses — <!--bn:a5Unreached-->5<!--/bn--> of <!--bn:a5Runs-->237<!--/bn--> runs did not reach — and aim 6 has the most: <!--bn:a6Unreached-->12<!--/bn--> of <!--bn:a6Runs-->237<!--/bn-->. The cells with misses (reached / runs):

| aim | harness · model · effort | reached |
|---|---|---|
| 5 | Codex · GPT-5.6 Luna · low | <!--bn:c_gpt56luna_low_a5_reach-->1/3<!--/bn--> |
| 5 | Codex · GPT-5.6 Terra · low | <!--bn:c_gpt56terra_low_a5_reach-->2/3<!--/bn--> |
| 5 | Codex · GPT-5.6 Terra · medium | <!--bn:c_gpt56terra_medium_a5_reach-->2/3<!--/bn--> |
| 5 | Codex · GPT-5.6 Terra · high | <!--bn:c_gpt56terra_high_a5_reach-->2/3<!--/bn--> |
| 6 | Claude Code · Haiku 4.5 · default | <!--bn:c_haiku45_default_a6_reach-->0/3<!--/bn--> |
| 6 | Codex · GPT-5.6 Luna · low | <!--bn:c_gpt56luna_low_a6_reach-->0/3<!--/bn--> |
| 6 | Codex · GPT-6 Luna · low | <!--bn:c_gpt6luna_low_a6_reach-->1/3<!--/bn--> |
| 6 | Antigravity · Gemini 3.1 Pro · low | <!--bn:c_gemini31pro_low_a6_reach-->2/3<!--/bn--> |
| 6 | Codex · GPT-5.6 Terra · medium | <!--bn:c_gpt56terra_medium_a6_reach-->2/3<!--/bn--> |
| 6 | Claude Code · Sonnet 5 · xhigh (n=1) | <!--bn:c_sonnet5_xhigh_a6_reach-->0/1<!--/bn--> |
| 6 | Claude Code · Sonnet 5 · max (n=1) | <!--bn:c_sonnet5_max_a6_reach-->0/1<!--/bn--> |

Most misses are at the model's lowest effort. For GPT-5.6 Luna, GPT-6 Luna and Gemini 3.1 Pro, one step up reached in every run (medium, medium, and high — Gemini 3.1 Pro's only other level). Claude Haiku 4.5 has a single effort level and never reached aim 6. Two exceptions run the other way: GPT-5.6 Terra missed at efforts above its lowest (finding 5), and Sonnet 5's misses at xhigh and max on aim 6 come from Claude Code's default output cap ending its responses mid-thought (finding 7) — a harness limit, kept as measured.

**2. The cheapest effort is almost always low or medium, and the top rung is a cost multiplier.** In all but a handful of the model × aim pairs that have more than one effort level, the cheapest effort per verified result is low or medium (the rest: high). On aims 1–4 higher effort bought no extra reach. On aims 5–6 it bought reach where the lowest effort missed (finding 1; GPT-5.6 Terra aside — finding 5) — and for Sonnet 5 on aim 6 the top two efforts lost reach to the output cap (finding 7). What max costs over low, as the geometric mean over aims of the trust-cost ratio max ÷ low:

| harness · model | max ÷ low |
|---|---|
| Claude Code · Haiku 5.5 | <!--bn:spread_haiku55-->19×<!--/bn--> |
| Claude Code · Sonnet 5.5 | <!--bn:spread_sonnet55-->15×<!--/bn-->* |
| Claude Code · Fable 5.1 | <!--bn:spread_fable51-->13×<!--/bn-->* |
| Claude Code · Opus 5.5 | <!--bn:spread_opus55-->9.37×<!--/bn--> |
| Claude Code · Fable 5 | <!--bn:spread_fable5-->3.90×<!--/bn--> |
| Claude Code · Opus 4.8 (n=1) | <!--bn:spread_opus48-->3.72×<!--/bn--> |
| Claude Code · Opus 5 (n=1) | <!--bn:spread_opus5-->3.70×<!--/bn--> |
| Claude Code · Sonnet 5 (n=1) | <!--bn:spread_sonnet5-->3.42×<!--/bn-->‡ |
| Codex · GPT-5.6 Terra | <!--bn:spread_gpt56terra-->2.70×<!--/bn--> |
| Codex · GPT-5.6 Luna | <!--bn:spread_gpt56luna-->2.60×<!--/bn-->‡ |
| Codex · GPT-6.1 Sol | <!--bn:spread_gpt61sol-->2.39×<!--/bn--> |
| Codex · GPT-6 Sol | <!--bn:spread_gpt6sol-->2.26×<!--/bn--> |
| Codex · GPT-6 Astra | <!--bn:spread_gpt6astra-->2.25×<!--/bn--> |
| Codex · GPT-5.6 Sol | <!--bn:spread_gpt56sol-->2.05×<!--/bn--> |
| Codex · GPT-6 Luna | <!--bn:spread_gpt6luna-->1.50×<!--/bn--> |

\* Lower bounds. Some max-effort runs reached but hit the round budget, which leaves no cost record (Fable 5.1 on aims 5 and 6, Sonnet 5.5 on aim 6); those cells' means use the runs whose cost is known, and the missing runs were the longest. ‡ Over aims 1–5 only: Sonnet 5 at max and GPT-5.6 Luna at low did not reach aim 6. Grok Build and Antigravity have no max level.

In Claude Code the newest versions spread far wider than the earlier ones — <!--bn:spread_opus55-->9.37×<!--/bn-->–<!--bn:spread_haiku55-->19×<!--/bn--> against <!--bn:spread_sonnet5-->3.42×<!--/bn-->–<!--bn:spread_fable5-->3.90×<!--/bn-->. The generation pairs in finding 4 show why: from one version to the next, low got much cheaper and max did not. Codex rows stay between <!--bn:spread_gpt6luna-->1.50×<!--/bn--> and <!--bn:spread_gpt56terra-->2.70×<!--/bn-->.

**Recommended effort by aim** — the ★ / ☆ marks in the figures. Four steps, per model and aim. (1) Eligible: efforts that reached on the first answer in every run. (2) Exception: an effort that needed refinement still qualifies if its cost or time per verified result is at most half that of the best eligible effort — far beyond the ~20% noise band. (3) Excluded: a lower effort that costs more than 20% more than some higher effort cannot get ★, and one that takes more than 20% longer cannot get ☆ — a lower effort that spends more must not look recommended. (4) Ranked: ★ on every remaining effort within 20% of the cheapest cost per verified result (the report's tie rule, so ties are all marked), ☆ on every remaining effort within 20% of the fastest that is not already ★. L · M · H · X = low · medium · high · xhigh (max is written Mx). — means no effort passed on the first answer in every run. A cell with a missing cost record gets no ★; Claude Haiku 4.5 has a single effort level and is not listed. **† = provisional**: marks on the n=1 rows are judged on their single run and will be re-judged after runs 2–3.

<!--bn-block:rec-md-->
| harness · model | aim 1 | aim 2 | aim 3 | aim 4 | aim 5 | aim 6 |
|---|---|---|---|---|---|---|
| Codex · GPT-5.6 Luna | L★ M★ | M★ | L★ M☆ | L★ | X★ | H★ X★ |
| Codex · GPT-5.6 Sol | L★ M★ | L★ | L★ M★ | L★ M☆ | L★ | M★ |
| Codex · GPT-5.6 Terra | L★ M★ H☆ | M★ | L★ M★ | L★ | X★ | L★ |
| Codex · GPT-6 Astra | L★ M★ | L★ M★ | L★ M★ | L★ M★ | L★ M★ | L★ M★ |
| Codex · GPT-6 Luna | L★ M★ H★ | H★ | L★ M★ | L★ M★ | M★ | H★ |
| Codex · GPT-6 Sol | L★ | L★ | L★ M★ | L★ | L★ | M★ H★ |
| Codex · GPT-6.1 Sol | L★ | L★ | L★ M★ | L★ | L★ M★ | L★ |
| Claude Code · Fable 5 | H★ | L★ | L★ | L★ | L★ | L★ |
| Claude Code · Fable 5.1 | L★ M★ H★ | L★ | L★ M★ | L★ | M★ | M★ |
| Claude Code · Haiku 5.5 | L★ | L★ | L★ | L★ | L★ | M★ |
| Claude Code · Opus 4.8 (n=1) | L★† M★† H★† | L★† | L★† M★† | L★† M☆† | L★† | L★† |
| Claude Code · Opus 5 (n=1) | L★† M★† | L★† M★† | L★† | L★† | L★† | L★† M☆† |
| Claude Code · Opus 5.5 | M★ | L★ | L★ M★ | L★ M★ | L★ | M★ |
| Claude Code · Sonnet 5 (n=1) | L★† M★† | M★† | L★† M★† | L★† M★† | L★† | M★† |
| Claude Code · Sonnet 5.5 | L★ M☆ | L★ M★ H☆ | L★ M★ | L★ M★ | H★ L☆ | L★ M★ |
| Grok Build · grok-4.6 | L★ | L★ | L★ | L★ | L★ | L★ |
| Grok Build · grok-4.7 | L★ | L★ | L★ | L★ | L★ | L★ |
| Antigravity · Gemini 3.1 Pro | L★ | — | H★ | L★ | — | — |
| Antigravity · Gemini 3.8 Flash | L★ | L★ | L★ | L★ M☆ | L★ | H★ |
<!--/bn-block-->

**3. Claude Haiku: the older small model was not cheap per verified result; Haiku 5.5 is the cheapest Claude row.** Claude Haiku 4.5 (one effort level) reached in <!--bn:m_haiku45_reached-->15<!--/bn--> of <!--bn:m_haiku45_runs-->18<!--/bn--> runs and passed on the first answer in <!--bn:m_haiku45_oneShot-->4<!--/bn--> of them; per verified result it cost more than Claude Sonnet 5.5 at Sonnet's cheapest effort on every aim it reached, and it did not reach aim 6. Claude Haiku 5.5 reached in every run (<!--bn:m_haiku55_reached-->90<!--/bn--> of <!--bn:m_haiku55_runs-->90<!--/bn-->) and passed on the first answer in <!--bn:m_haiku55_oneShot-->89<!--/bn--> — the exception is one run at low on aim 6, which is why its recommended effort is medium on aim 6 and low on aims 1–5. Its low effort was its cheapest on every aim, and cost less than half of Sonnet 5.5's cheapest effort on every aim (trust cost):

| aim | Haiku 4.5 · default | Haiku 5.5 · low | Sonnet 5.5 · cheapest effort |
|---|---|---|---|
| 1 | <!--bn:c_haiku45_default_a1_tc-->$0.37<!--/bn--> | <!--bn:c_haiku55_low_a1_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_low_a1_tc-->$0.26<!--/bn--> (low) |
| 2 | <!--bn:c_haiku45_default_a2_tc-->$1.06<!--/bn--> | <!--bn:c_haiku55_low_a2_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_low_a2_tc-->$0.23<!--/bn--> (low) |
| 3 | <!--bn:c_haiku45_default_a3_tc-->$0.46<!--/bn--> | <!--bn:c_haiku55_low_a3_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_medium_a3_tc-->$0.35<!--/bn--> (medium) |
| 4 | <!--bn:c_haiku45_default_a4_tc-->$0.62<!--/bn--> | <!--bn:c_haiku55_low_a4_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_medium_a4_tc-->$0.16<!--/bn--> (medium) |
| 5 | <!--bn:c_haiku45_default_a5_tc-->$1.26<!--/bn--> | <!--bn:c_haiku55_low_a5_tc-->$0.05<!--/bn--> | <!--bn:c_sonnet55_medium_a5_tc-->$0.36<!--/bn--> (medium) |
| 6 | not reached (<!--bn:c_haiku45_default_a6_reach-->0/3<!--/bn-->) | <!--bn:c_haiku55_low_a6_tc-->$0.26<!--/bn--> | <!--bn:c_sonnet55_medium_a6_tc-->$0.57<!--/bn--> (medium) |

Over all its cells, Haiku 5.5's median trust cost (<!--bn:m_haiku55_medTC-->$0.19<!--/bn-->) is the lowest of any Claude row (Sonnet 5.5: <!--bn:m_sonnet55_medTC-->$0.55<!--/bn-->, Haiku 4.5: <!--bn:m_haiku45_medTC-->$0.62<!--/bn-->); across all harnesses only GPT-6 Luna (<!--bn:m_gpt6luna_medTC-->$0.02<!--/bn-->) and GPT-5.6 Luna (<!--bn:m_gpt56luna_medTC-->$0.06<!--/bn-->) are lower. Time does not follow the same order: its median trust time (<!--bn:m_haiku55_medTT-->5.5<!--/bn--> min) is above Sonnet 5.5's (<!--bn:m_sonnet55_medTT-->3.4<!--/bn--> min), and its higher efforts are slow (max on aim 6: <!--bn:c_haiku55_max_a6_tt-->27.1<!--/bn--> min) — and its low→max cost spread is the widest measured (<!--bn:spread_haiku55-->19×<!--/bn-->, finding 2). Haiku 5.5 ran on a newer Claude Code version than the other Claude rows, and later in the window; the version control in [limits](#limits) compares re-runs of existing cells on 2.1.293 with their published means (cost is the axis to read there; time moves with machine load).

**4. Newer Claude and GPT generations: cheaper at low effort, not always at max — grok-4.7 is the exception.** Trust cost newer ÷ older by effort (geometric mean of per-aim ratios; below 1× = the newer version is cheaper per verified result):

| newer ÷ older | low | medium | high | xhigh | max |
|---|---|---|---|---|---|
| Claude Opus 5.5 ÷ Opus 5 (n=1) | <!--bn:pair_opus55_opus5_low-->0.39×<!--/bn--> | <!--bn:pair_opus55_opus5_medium-->0.34×<!--/bn--> | <!--bn:pair_opus55_opus5_high-->0.30×<!--/bn--> | <!--bn:pair_opus55_opus5_xhigh-->0.60×<!--/bn--> | <!--bn:pair_opus55_opus5_max-->1.00×<!--/bn--> |
| Claude Opus 5.5 ÷ Opus 4.8 (n=1) | <!--bn:pair_opus55_opus48_low-->0.40×<!--/bn--> | <!--bn:pair_opus55_opus48_medium-->0.35×<!--/bn--> | <!--bn:pair_opus55_opus48_high-->0.42×<!--/bn--> | <!--bn:pair_opus55_opus48_xhigh-->0.57×<!--/bn--> | <!--bn:pair_opus55_opus48_max-->1.00×<!--/bn--> |
| Claude Sonnet 5.5 ÷ Sonnet 5 (n=1) | <!--bn:pair_sonnet55_sonnet5_low-->0.52×<!--/bn--> | <!--bn:pair_sonnet55_sonnet5_medium-->0.48×<!--/bn--> | <!--bn:pair_sonnet55_sonnet5_high-->0.36×<!--/bn--> | <!--bn:pair_sonnet55_sonnet5_xhigh-->0.89×<!--/bn-->‡ | <!--bn:pair_sonnet55_sonnet5_max-->2.43×<!--/bn-->‡ |
| Claude Fable 5.1 ÷ Fable 5 | <!--bn:pair_fable51_fable5_low-->0.70×<!--/bn--> | <!--bn:pair_fable51_fable5_medium-->0.55×<!--/bn--> | <!--bn:pair_fable51_fable5_high-->0.62×<!--/bn--> | <!--bn:pair_fable51_fable5_xhigh-->1.06×<!--/bn--> | <!--bn:pair_fable51_fable5_max-->2.41×<!--/bn-->* |
| GPT-6.1 Sol ÷ GPT-6 Sol | <!--bn:pair_gpt61sol_gpt6sol_low-->0.73×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_medium-->0.64×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_high-->0.71×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_xhigh-->0.80×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_max-->0.77×<!--/bn--> |
| GPT-6.1 Sol ÷ GPT-5.6 Sol | <!--bn:pair_gpt61sol_gpt56sol_low-->0.29×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_medium-->0.29×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_high-->0.27×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_xhigh-->0.35×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_max-->0.34×<!--/bn--> |
| GPT-6 Luna ÷ GPT-5.6 Luna | <!--bn:pair_gpt6luna_gpt56luna_low-->0.35×<!--/bn-->‡ | <!--bn:pair_gpt6luna_gpt56luna_medium-->0.33×<!--/bn--> | <!--bn:pair_gpt6luna_gpt56luna_high-->0.23×<!--/bn--> | <!--bn:pair_gpt6luna_gpt56luna_xhigh-->0.35×<!--/bn--> | <!--bn:pair_gpt6luna_gpt56luna_max-->0.26×<!--/bn--> |
| grok-4.7 ÷ grok-4.6 | <!--bn:pair_grok47_grok46_low-->1.64×<!--/bn--> | <!--bn:pair_grok47_grok46_medium-->1.93×<!--/bn--> | <!--bn:pair_grok47_grok46_high-->1.87×<!--/bn--> | <!--bn:pair_grok47_grok46_xhigh-->2.03×<!--/bn--> | — |

\* Includes partial-cost Fable 5.1 cells (finding 2), so the true ratio is somewhat higher. ‡ Over aims 1–5 only: the older model did not reach aim 6 at that effort (Sonnet 5 at xhigh and max, GPT-5.6 Luna at low).

- **Claude Code.** From low to high every newer Claude version cost less per verified result than its predecessor — Opus 5.5 well under half of Opus 5 and Opus 4.8, Sonnet 5.5 about half or less of Sonnet 5, Fable 5.1 <!--bn:pair_fable51_fable5_medium-->0.55×<!--/bn-->–<!--bn:pair_fable51_fable5_low-->0.70×<!--/bn--> of Fable 5. The gap closes at the top: at max Opus 5.5 is level with both earlier Opus versions, and Sonnet 5.5 and Fable 5.1 cost more than their predecessors; at xhigh Sonnet and Fable are within the ~20% tie band. This is the other side of finding 2 — the newer versions got cheaper at low, not at max, so their low→max spread widened.
- **Codex.** GPT-6.1 Sol cost less than GPT-6 Sol at every effort and roughly a third of GPT-5.6 Sol; GPT-6 Luna cost about a quarter to a third of GPT-5.6 Luna. No reversal at max. GPT-5.6 Luna and Terra also missed runs on aim 5, where every GPT-6-generation row reached in every run (finding 5).
- **Grok Build.** grok-4.7 cost more than grok-4.6 at every effort and took longer (median trust time <!--bn:m_grok47_medTT-->22.5<!--/bn--> vs <!--bn:m_grok46_medTT-->10.9<!--/bn--> min); in return it passed on the first answer in every run (<!--bn:m_grok47_oneShotPct-->100%<!--/bn--> vs <!--bn:m_grok46_oneShotPct-->92%<!--/bn-->). Both reached in every run.
- **n=1.** The Opus 5, Opus 4.8 and Sonnet 5 sides rest on one run per cell. The direction of the large gaps is mostly reliable; ratios within ~20% of 1× are ties.

**5. Every aim 5 miss is GPT-5.6 Terra or Luna.** GPT-5.6 Luna missed only at low — on aim 5 (<!--bn:c_gpt56luna_low_a5_reach-->1/3<!--/bn--> reached) and aim 6 (<!--bn:c_gpt56luna_low_a6_reach-->0/3<!--/bn-->) — and reached in every run from medium up; because medium needed refinement on those aims (first answer <!--bn:c_gpt56luna_medium_a5_first-->1/3<!--/bn--> on aim 5, <!--bn:c_gpt56luna_medium_a6_first-->0/3<!--/bn--> on aim 6), its recommended effort there is xhigh (and high on aim 6). GPT-5.6 Terra missed at low, medium and high on aim 5 (<!--bn:c_gpt56terra_low_a5_reach-->2/3<!--/bn-->, <!--bn:c_gpt56terra_medium_a5_reach-->2/3<!--/bn-->, <!--bn:c_gpt56terra_high_a5_reach-->2/3<!--/bn-->) and at medium on aim 6 (<!--bn:c_gpt56terra_medium_a6_reach-->2/3<!--/bn-->), yet reached in every run at low on aim 6 — for Terra, reach did not rise steadily with effort. It reached in every run at xhigh and max, and xhigh is its recommended effort on aim 5. Its aim 6 mark at low comes through the exception rule: low needed refinement (first answer <!--bn:c_gpt56terra_low_a6_first-->1/3<!--/bn-->) but took less than half the time of its best one-shot effort. GPT-6 Luna, the successor, missed only at low on aim 6 (<!--bn:c_gpt6luna_low_a6_reach-->1/3<!--/bn-->); GPT-5.6 Sol and GPT-6.1 Sol reached in every run.

**6. Aim 6, model by model** — each model's cheapest effort on aim 6 (first answer = reached with no refinement round):

| harness · model | cheapest effort | reached | first answer | trust cost | trust time (min) |
|---|---|---|---|---|---|
| Codex · GPT-6 Luna | medium | <!--bn:c_gpt6luna_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt6luna_medium_a6_first-->1/3<!--/bn--> | <!--bn:c_gpt6luna_medium_a6_tc-->$0.02<!--/bn--> | <!--bn:c_gpt6luna_medium_a6_tt-->7.0<!--/bn--> |
| Codex · GPT-5.6 Luna | medium | <!--bn:c_gpt56luna_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt56luna_medium_a6_first-->0/3<!--/bn--> | <!--bn:c_gpt56luna_medium_a6_tc-->$0.08<!--/bn--> | <!--bn:c_gpt56luna_medium_a6_tt-->6.3<!--/bn--> |
| Codex · GPT-6.1 Sol | low | <!--bn:c_gpt61sol_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt61sol_low_a6_first-->3/3<!--/bn--> | <!--bn:c_gpt61sol_low_a6_tc-->$0.18<!--/bn--> | <!--bn:c_gpt61sol_low_a6_tt-->4.4<!--/bn--> |
| Claude Code · Haiku 5.5 | low | <!--bn:c_haiku55_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_haiku55_low_a6_first-->2/3<!--/bn--> | <!--bn:c_haiku55_low_a6_tc-->$0.26<!--/bn--> | <!--bn:c_haiku55_low_a6_tt-->7.0<!--/bn--> |
| Grok Build · grok-4.6 | low | <!--bn:c_grok46_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_grok46_low_a6_first-->1/3<!--/bn--> | <!--bn:c_grok46_low_a6_tc-->$0.31<!--/bn--> | <!--bn:c_grok46_low_a6_tt-->13.5<!--/bn--> |
| Codex · GPT-6 Sol | low | <!--bn:c_gpt6sol_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt6sol_low_a6_first-->2/3<!--/bn--> | <!--bn:c_gpt6sol_low_a6_tc-->$0.33<!--/bn--> | <!--bn:c_gpt6sol_low_a6_tt-->5.8<!--/bn--> |
| Codex · GPT-5.6 Terra | low | <!--bn:c_gpt56terra_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt56terra_low_a6_first-->1/3<!--/bn--> | <!--bn:c_gpt56terra_low_a6_tc-->$0.52<!--/bn--> | <!--bn:c_gpt56terra_low_a6_tt-->7.7<!--/bn--> |
| Grok Build · grok-4.7 | low | <!--bn:c_grok47_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_grok47_low_a6_first-->3/3<!--/bn--> | <!--bn:c_grok47_low_a6_tc-->$0.57<!--/bn--> | <!--bn:c_grok47_low_a6_tt-->21.1<!--/bn--> |
| Claude Code · Sonnet 5.5 | medium | <!--bn:c_sonnet55_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_sonnet55_medium_a6_first-->3/3<!--/bn--> | <!--bn:c_sonnet55_medium_a6_tc-->$0.57<!--/bn--> | <!--bn:c_sonnet55_medium_a6_tt-->4.4<!--/bn--> |
| Codex · GPT-5.6 Sol | low | <!--bn:c_gpt56sol_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt56sol_low_a6_first-->2/3<!--/bn--> | <!--bn:c_gpt56sol_low_a6_tc-->$0.83<!--/bn--> | <!--bn:c_gpt56sol_low_a6_tt-->6.1<!--/bn--> |
| Claude Code · Opus 5.5 | low | <!--bn:c_opus55_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_opus55_low_a6_first-->1/3<!--/bn--> | <!--bn:c_opus55_low_a6_tc-->$1.00<!--/bn--> | <!--bn:c_opus55_low_a6_tt-->4.2<!--/bn--> |
| Codex · GPT-6 Astra | low | <!--bn:c_gpt6astra_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt6astra_low_a6_first-->3/3<!--/bn--> | <!--bn:c_gpt6astra_low_a6_tc-->$1.04<!--/bn--> | <!--bn:c_gpt6astra_low_a6_tt-->5.5<!--/bn--> |
| Antigravity · Gemini 3.8 Flash | medium | <!--bn:c_gemini38flash_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_gemini38flash_medium_a6_first-->2/3<!--/bn--> | <!--bn:c_gemini38flash_medium_a6_tc-->$1.10<!--/bn--> | <!--bn:c_gemini38flash_medium_a6_tt-->6.9<!--/bn--> |
| Claude Code · Sonnet 5 (n=1) | medium | <!--bn:c_sonnet5_medium_a6_reach-->1/1<!--/bn--> | <!--bn:c_sonnet5_medium_a6_first-->1/1<!--/bn--> | <!--bn:c_sonnet5_medium_a6_tc-->$1.82<!--/bn--> | <!--bn:c_sonnet5_medium_a6_tt-->15.4<!--/bn--> |
| Claude Code · Fable 5.1 | medium | <!--bn:c_fable51_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_fable51_medium_a6_first-->3/3<!--/bn--> | <!--bn:c_fable51_medium_a6_tc-->$2.05<!--/bn--> | <!--bn:c_fable51_medium_a6_tt-->4.3<!--/bn--> |
| Claude Code · Opus 5 (n=1) | low | <!--bn:c_opus5_low_a6_reach-->1/1<!--/bn--> | <!--bn:c_opus5_low_a6_first-->1/1<!--/bn--> | <!--bn:c_opus5_low_a6_tc-->$3.35<!--/bn--> | <!--bn:c_opus5_low_a6_tt-->38.3<!--/bn--> |
| Antigravity · Gemini 3.1 Pro | high | <!--bn:c_gemini31pro_high_a6_reach-->3/3<!--/bn--> | <!--bn:c_gemini31pro_high_a6_first-->0/3<!--/bn--> | <!--bn:c_gemini31pro_high_a6_tc-->$4.20<!--/bn--> | <!--bn:c_gemini31pro_high_a6_tt-->8.3<!--/bn--> |
| Claude Code · Fable 5 | low | <!--bn:c_fable5_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_fable5_low_a6_first-->3/3<!--/bn--> | <!--bn:c_fable5_low_a6_tc-->$4.80<!--/bn--> | <!--bn:c_fable5_low_a6_tt-->8.1<!--/bn--> |
| Claude Code · Opus 4.8 (n=1) | low | <!--bn:c_opus48_low_a6_reach-->1/1<!--/bn--> | <!--bn:c_opus48_low_a6_first-->1/1<!--/bn--> | <!--bn:c_opus48_low_a6_tc-->$5.44<!--/bn--> | <!--bn:c_opus48_low_a6_tt-->18.9<!--/bn--> |
| Claude Code · Haiku 4.5 | default | <!--bn:c_haiku45_default_a6_reach-->0/3<!--/bn--> | <!--bn:c_haiku45_default_a6_first-->0/3<!--/bn--> | — | — |

Rows are ordered by the cheapest of each model's 2–5 effort cells, which favours models with more effort levels; neighbours within ~20% are ties, not a ranking. "Cheapest effort" is by trust cost, so it can be an effort that needed refinement in some runs. Misses at other efforts are in finding 1.

**7. Claude Code's default output cap ended some aim 6 rounds.** At xhigh and max on aim 6, Sonnet 5 and Opus 4.8 (both n=1) wrote responses that hit Claude Code's per-response output cap (64,000 tokens) while still thinking, which ended the round. Sonnet 5 did not reach in those cells; Opus 4.8 reached on a later round, which makes its two cells the slowest in the whole table (trust time <!--bn:c_opus48_xhigh_a6_tt-->164.7<!--/bn--> and <!--bn:c_opus48_max_a6_tt-->210.7<!--/bn--> min). The cap was kept at the harness default; the full account is under «Output cap» in [limits](#limits).

**8. Run-to-run spread is moderate.** Across the runs of a cell, the typical (median) coefficient of variation of cost and of time is about 20% or less in every harness, which is where the report's tie rule comes from: read a difference under ~20% between two cells as a tie. Some cells swing much more — when a refinement round appears in one run and not another, and sometimes when runs of the same length simply spend differently. The time axis also moves with machine load. An n=1 cell shows no spread at all, which is why its marks are provisional.

## Figures

One figure per aim: x = trust cost (log), y = trust time (log), each line one model in one harness, points = effort levels (mark shape = vendor: six-ray star Anthropic, hexagon OpenAI, four-point sparkle Google, bold X xAI; a filled mark reached on the first answer in every run, an outlined one needed a refinement round in some run or missed; n=1 models are drawn with a short, faint dashed line and labelled «n=1»; ★ / ☆ = recommended effort, see «Recommended effort by aim» under Findings, with † on n=1 rows). The legend tags a model's efforts that were not reached, have unknown cost or have partial cost. Lower-left is better. The marker at the top right shows the rung on the ladder.

![aim 1](docs/assets/bench/trust-cost-aim1.png)
![aim 2](docs/assets/bench/trust-cost-aim2.png)
![aim 3](docs/assets/bench/trust-cost-aim3.png)
![aim 4](docs/assets/bench/trust-cost-aim4.png)
![aim 5](docs/assets/bench/trust-cost-aim5.png)
![aim 6](docs/assets/bench/trust-cost-aim6.png)

## Measurement defects found and fixed

Most of these did not look like errors — the results came out normal. Each was fixed; the affected runs were re-measured (or, where noted, kept) and the old records were kept but marked superseded.

| defect | symptom | fix |
|---|---|---|
| Grok Build's node permission rule ended the turn on multi-line or chained node commands | refinement rounds reported as harness errors | bypass mode plus a node-only gate; re-measured |
| Antigravity's first gate rejected `;` even inside quotes | node commands refused | shared node-only gate; re-measured |
| 43 Claude Code runs started before 2026-10-01 11:00 (the first run of aims 1, 2, 3 and 5 for Sonnet 5.5, Opus 5.5 and Haiku 4.5, except Opus 5.5 at max on aim 5) loaded the machine's plugin hooks | an output-style instruction in the session, and hooks on every tool call that added seconds per call | hooks disabled; a 4-run clean re-measure fell within run-to-run spread, so those runs were kept — their time values are the least reliable |
| a 45-minute round budget | four slow combinations timed out | budget raised to 90 minutes; re-measured |
| Grok Build's exhausted usage balance came back as a well-formed error object, and an Antigravity server restart returned empty sessions | 53 zero-token runs (41 Grok Build, 12 Antigravity) counted as «did not reach» (signal: 0% cost spread) | error objects recognised; any run with 0 tokens in every round is invalid; re-measured |
| Claude Code's reported cost is cumulative across resumed sessions | refined runs over-counted | per-round differences recorded; past records corrected with originals kept |
| the grader returned «no tests executed» without a reason | the incident below | exit code, signal, output overflow and the last output lines are attached |

## An incident: empty feedback invites probing

In one run (Fable 5.1, max effort, aim 2) every round graded as «no tests executed», and the feedback ended without a reason. With nothing to go on, the model added diagnostic code to its module that recorded how the grader loaded it into the original work directory, where the next round could read it. The tamper scan flagged the fourth round and the run is invalid; re-graded afterwards outside the run, the final code passed all 73 tests. Two lessons: **when grading feedback is empty, the model investigates the evaluator** — feedback must always say what failed; and a tamper check has to catch looking at the grader, not only copying answers.

## Limits

- **Single observer, single machine.** Every measurement was run by a single observer on one Windows workstation. Nothing here has been reproduced independently.
- **Tasks and hidden suites are not published**, to keep them out of training data and out of reach of the runs. You cannot rerun this benchmark yet; treat it as a report, not a standard.
- **Repetitions differ by row.** <!--bn:nNoteEn-->n = 3 per cell; n = 1 for Opus 4.8, Opus 5 and Sonnet 5 (further runs being measured); Fable 5.1: one cell with n = 2<!--/bn-->. Three runs are enough to see the spread, not enough for fine rankings. The n=1 rows (<!--bn:n1ModelsEn-->Opus 4.8, Opus 5 and Sonnet 5<!--/bn-->) have one run per task × effort; runs 2–3 are being measured and the figures will be updated. Reading rule: n=1 rankings are mostly reliable, but read gaps under ~20% as ties, and treat their † marks as provisional.
- **Run order.** Grok Build's third runs on aims 1–5 (and one second run), and all its aim 6 runs, were measured on 2026-10-06, after the other rows of the first measurement. The rows added in this update (Claude Haiku 5.5, Opus 5, Sonnet 5, Opus 4.8, GPT-5.6 Sol · Terra · Luna) were measured after that, on different days and under different machine load.
- **Versions.** The Claude Code CLI version is recorded in the Claude transcripts (runs stopped at the round budget left none). For the other harnesses the version was recorded only in some of the most recent Codex runs. Model behaviour is as of the measurement dates.
- **Time is the weaker axis.** Wall time depends on machine load (how many chains ran at once), run order and the serving account. Two Claude accounts were used, switching on 2026-10-03; cost is unaffected, time may not be. The hook-era Claude runs (see the defects table) carry extra seconds per tool call.
- **Cost is API-equivalent.** It is what the tokens would cost at list price, not what a subscription plan charges.
- **Missing costs.** Some max-effort runs reached but hit the round budget (Fable 5.1 on aims 5 and 6, Sonnet 5.5 on aim 6); Claude Code writes no cost record for a stopped session, so those cells' means are over the remaining runs, are lower bounds, and are marked «partial cost» in the figures.

**CLI version control.**
<!--bn-block:cli-control-en-->
Claude Haiku 5.5 ran on Claude Code 2.1.293, installed side by side for it; every other Claude row ran on 2.1.284. To check the version itself, 12 existing cells were run again on 2.1.293 (one run each) and compared with their published n=3 means: Haiku 4.5 default — cost 1.08×, time 0.91× (geometric mean over 6 tasks; 3/6 within the ±20% tie band on cost, 2/6 on time); Sonnet 5.5 low — cost 1.02×, time 0.74× (geometric mean over 6 tasks; 5/6 within the ±20% tie band on cost, 3/6 on time). Cost is the axis to read here; time also moves with machine load (CPU busy before each round averaged 25% on the re-runs against 37% on the original runs of the same cells). Reach differed in 1 re-run: Haiku 4.5 default on aim 5 did not reach in 4 rounds where all 3 published runs had — one re-run cannot separate a version effect from run-to-run variation, so it is recorded here rather than averaged away.
<!--/bn-block-->

**Restored costs.**
<!--bn-block:restored-en-->
The cost of 2 runs was restored from the session log's last cumulative token count × published prices: GPT-5.6 Luna medium on aim 4, run 1 ($0.02 — the session finished its work and then returned a capacity error, so no final usage event reached the runner); GPT-5.6 Luna max on aim 5, run 3 ($0.19 — the round hit the 90-minute budget after the work was already done — the session log shows no events for its last 30 minutes, a stalled response stream, so the time recorded for this run includes that stall).
<!--/bn-block-->

**Output cap.**
<!--bn-block:cap-en-->
Claude Code's default output cap (64,000 tokens per response) ended 11 rounds in 4 cells: Opus 4.8 xhigh on aim 6 (2 of 3 rounds; reached on a later round), Opus 4.8 max on aim 6 (2 of 3 rounds; reached on a later round), Sonnet 5 xhigh on aim 6 (3 of 4 rounds; did not reach), Sonnet 5 max on aim 6 (4 of 4 rounds; did not reach). The responses ran out of room while still thinking. The cap was kept at the harness default, so these cells are measured as the harness ships — a cell that did not reach here says more about the default cap than about the model.
<!--/bn-block-->

## Where it is used

- [Superscalar.md §5.1.5](Superscalar.md) — how trust cost enters the choice of a model inside a tier.
- [`plugins/superscalar/model-registry.json`](plugins/superscalar/model-registry.json) — the effort guidance and each measured model's in-house entry cite these measurements.
- Web version: [docs/superscalar-bench.html](https://soliestre.github.io/EstreGenesis/superscalar-bench.html).

---

## 한국어

![Superscalar Bench — 여섯 aim, aim 마다 키 이미지 한 장, 설계한 사다리 위에](docs/assets/bench/trust-cost-aims-ko.png)

> **검증된** 코딩 결과 하나에 드는 돈과 시간 — 모델 × 하네스 × effort 마다, 숨긴 수용 시험이 있는 여섯 과제의 사다리 위에서, 하네스 <!--bn:harnesses-->4<!--/bn-->종의 모델 <!--bn:models-->20<!--/bn-->개를 쟀어요. 용어(aim · 도달 · 첫 답 · 신뢰비용)의 정의는 [Superscalar.md §5.1.5](Superscalar.md) 에 있고, 여기는 무엇을 어떻게 쟀는지만 적어요. **관측자 한 명 · 비공개 과제** — 숫자를 인용하기 전에 [한계](#한계)를 읽어 주세요. **<!--bn:n1ModelsKo-->Opus 4.8, Opus 5, Sonnet 5<!--/bn--> 행은 아직 n=1 이에요**(과제 × effort 마다 실행 한 번). 두 번째·세 번째 실행을 재는 중이고, 끝나면 수치를 갱신해요.

### 무엇을 재나

- **단위**: 모델 × 하네스 × effort. 같은 모델도 하네스마다 다르게 움직이고, 실제로 그렇게 쓰여요.
- **도달**: 과제의 숨긴 수용 시험이 전부 통과하면 도달이에요. 부분 점수는 없어요.
- **라운드**: 첫 답 뒤 보정 라운드 최대 세 번(모두 네 라운드). 보정 피드백은 CI 가 사람에게 주는 만큼 — 실패한 시험 이름과 단정 메시지뿐, 시험 코드는 안 보여 줘요. 첫 답에서 통과하면 **첫 답 통과**예요.
- **신뢰비용 · 신뢰시간** = 모든 시도(보정 라운드 포함)의 평균 비용·시간 ÷ 도달률. 시도당 싸도 자주 못 닿는 모델은 여기서 그 값을 치러요. 한 번도 못 닿은 조합은 신뢰비용이 없어요.
- **비용**은 API 정가 환산이에요(구독 요금이 아님). Claude Code·Grok Build 는 하네스가 보고하고, Codex·Antigravity 는 토큰 수 × 공개 단가로 계산해요.
- **반복**: <!--bn:nNoteKo-->칸마다 n = 3 · Opus 4.8, Opus 5, Sonnet 5 는 n = 1(다음 회차 측정 중) · Fable 5.1 1칸은 n = 2<!--/bn-->. 이 문서와 그림 · 표의 숫자는 모두 실행 기록의 스냅샷 하나에서 나왔어요.

### aim 사다리

aim 하나가 과제 하나예요. 같은 aim 안에서는 모든 모델이 같은 숨긴 시험으로 판정돼요. aim 은 과제 범위 순의 사다리이고, 위로 갈수록 어려워지게 설계했어요(aim 자체는 난도 등급이 아니라 결과 수준이에요 — §5.1.5).

<!--bn-block:aims-md-ko-->
| | aim | 과제 | 숨긴 시험 | 도달 | 첫 답 | 신뢰시간 중앙값 | 신뢰비용 중앙값 |
|---|---|---|---:|---:|---:|---:|---:|
| <img src="docs/assets/bench/keyart/aim1.png" width="56" alt="aim 1 key image"> | 1 | 여러 파일 기계적 수정 | 25 | 100% | 96% | 3.6분 | $0.40 |
| <img src="docs/assets/bench/keyart/aim2.png" width="56" alt="aim 2 key image"> | 2 | 사양서대로 구현 | 73 | 100% | 90% | 5.2분 | $0.57 |
| <img src="docs/assets/bench/keyart/aim3.png" width="56" alt="aim 3 key image"> | 3 | 여러 단계 기능 + 스키마 이전 | 49 | 100% | 99% | 6.5분 | $0.72 |
| <img src="docs/assets/bench/keyart/aim4.png" width="56" alt="aim 4 key image"> | 4 | 증상 보고에서 진단·수정 | 37 | 100% | 99% | 5.0분 | $0.53 |
| <img src="docs/assets/bench/keyart/aim5.png" width="56" alt="aim 5 key image"> | 5 | 작은 언어 인터프리터 설계·구현 | 96 | 98% | 89% | 10.7분 | $1.06 |
| <img src="docs/assets/bench/keyart/aim6.png" width="56" alt="aim 6 key image"> | 6 | 충돌에 안전한 트랜잭션 키-값 저장소 | 58 | 95% | 82% | 13.5분 | $1.10 |
<!--/bn-block-->

![aim 사다리 — 설계한 난도 순서의 여섯 과제와 잰 것](docs/assets/bench/trust-cost-ladder.png)

키 이미지: aim 마다 글자 없는 그림 한 장 — 공개한 프롬프트로 Codex CLI 의 내장 이미지 도구가 만들었어요([만든 방법](docs/assets/bench/keyart/README.md)). 시트의 글자 · 번호 · 사다리는 코드로 그려요.

중앙값은 aim 마다 모델 × 하네스 × effort 조합 <!--bn:a1Combos-->89<!--/bn-->개 위에서 냈어요(<!--bn:nNoteKo-->칸마다 n = 3 · Opus 4.8, Opus 5, Sonnet 5 는 n = 1(다음 회차 측정 중) · Fable 5.1 1칸은 n = 2<!--/bn-->). 어떤 aim 에서 한 번도 못 닿은 조합은 신뢰비용이 없어서 그 aim 의 신뢰 중앙값에서 빠져요 — 이런 조합은 aim 6 에만 있어요(찾은 것 1).

**읽는 법.** aim 1–4 는 검증된 결과당 <!--bn:a1Cost-->$0.40<!--/bn-->–<!--bn:a3Cost-->$0.72<!--/bn--> · <!--bn:a1Time-->3.6<!--/bn-->–<!--bn:a3Time-->6.5<!--/bn-->분 안에 있고 고르게 오르지 않아요 — aim 2 가 aim 3–4 보다 첫 답에서 더 자주 걸리고, aim 4 가 aim 3 보다 싸요. aim 5·6 은 그 범위 위에 있어요: 비용은 aim 1–4 중앙값의 대략 두 배, 시간은 두 배에서 세 배 가까이예요. 중앙값 비용은 둘이 비슷하지만 aim 6 이 더 오래 걸리고 더 많이 놓쳐요. 도달 못 한 실행이 나오는 단은 aim 5·6 뿐이에요. 순서는 설계한 그대로이고, 표는 잰 그대로예요 — 매끈한 추세가 아니에요.

### 설정

| 하네스 | 모델 | effort 단계 |
|---|---|---|
| Claude Code(CLI 2.1.284) | Claude Sonnet 5.5 · Claude Opus 5.5 · Claude Fable 5.1 · Claude Fable 5 | low · medium · high · xhigh · max |
| | Claude Opus 5 · Claude Sonnet 5 · Claude Opus 4.8 — **n=1** | low · medium · high · xhigh · max |
| | Claude Haiku 4.5 | default |
| Claude Code(CLI 2.1.293, 나란히 설치) | Claude Haiku 5.5 | low · medium · high · xhigh · max |
| Codex | GPT-6.1 Sol · GPT-6 Sol · GPT-6 Astra · GPT-6 Luna · GPT-5.6 Sol · GPT-5.6 Terra · GPT-5.6 Luna | low · medium · high · xhigh · max |
| Grok Build | grok-4.7 · grok-4.6 | low · medium · high · xhigh |
| Antigravity | Gemini 3.8 Flash | low · medium · high |
| | Gemini 3.1 Pro | low · high |

- **<!--bn:combos-->89<!--/bn--> 조합 × 6 aim(<!--bn:nNoteKo-->칸마다 n = 3 · Opus 4.8, Opus 5, Sonnet 5 는 n = 1(다음 회차 측정 중) · Fable 5.1 1칸은 n = 2<!--/bn-->)에서, 다시 재지 않은 무효 실행 하나를 뺀** 유효 실행 <!--bn:runs-->1,421<!--/bn-->회(aim 1–5: <!--bn:runsAims1to5-->1,184<!--/bn--> · aim 6: <!--bn:runsAim6-->237<!--/bn-->) — 빠진 하나는 Claude Fable 5.1 max 의 aim 2([아래 사건](#사건--빈-피드백이-탐색을-부른다)). <!--bn:dateFirst-->2026-09-30<!--/bn--> → <!--bn:dateLast-->2026-10-09<!--/bn-->, 기계 한 대(이 문서의 날짜·시각은 모두 UTC). Claude Haiku 5.5 · Opus 5 · Sonnet 5 · Opus 4.8 과 GPT-5.6 Sol · Terra · Luna 행은 나머지를 모두 잰 뒤에 쟀어요.
- **n=1 행.** <!--bn:n1ModelsKo-->Opus 4.8, Opus 5, Sonnet 5<!--/bn--> 는 과제 × effort 마다 아직 실행이 한 번이에요. 두 번째·세 번째 실행을 재는 중이고, 끝나면 그림과 표를 갱신해요. 순위는 대체로 믿을 만하지만, n=1 칸 둘의 차가 ~20% 안쪽이면 동률로 읽어 주세요.
- 실행마다 과제 저장소의 격리된 사본에서 일해요. 모델은 거기서 `node` 를 실행할 수 있고(node 명령만 통과시키는 게이트), 다른 셸 명령은 거부돼요. Claude Code 벤치 세션의 플러그인 훅은 2026-10-01 11:00 부터 껐어요(그 전 실행은 영어 절의 [결함 표](#measurement-defects-found-and-fixed) 참고).
- 라운드 예산은 벽시계 90분. Claude Code 의 응답당 출력 상한은 하네스 기본값(64,000 토큰) 그대로 뒀어요 — [한계](#한계) 참고.
- **§5.1.5 절차와 다른 점.** 이번 측정은 처음 못 닿은 aim 에서 멈추지 않고 모든 조합을 여섯 aim 전부에서 돌렸고, 비용은 API 정가 환산만 냈어요(플랜 할당량 수치 없음). §5.1.5 의 aim 목록은 여섯째 aim 보다 먼저 쓰였어요.
- **하네스 프롬프트.** Claude Code 는 Claude 모델마다 자기 내장 시스템 프롬프트를 보내요 — 하네스의 일부라서, Claude 모델 둘의 비교는 어느 하네스에서나처럼 «모델 + 하네스 프롬프트» 의 비교예요.
- **무효 실행은 미도달과 따로 셌어요**(실패와 규칙 위반은 다른 결과예요). <!--bn:setAside-->141<!--/bn-->건을 뺐어요: 고친 뒤 다시 잰 측정 조건 결함 아래의 실행, 할당량·자격 거절, 아무 일도 안 한 하네스 세션(모든 라운드 0토큰), 제출물이 채점기를 들여다본 실행 하나.

### 찾은 것

**1. 사다리는 도달보다 먼저 시간 · 비용 · 첫 답에서 갈려요.** aim 1–4 는 모든 실행이 도달했어요. 처음 놓친 단은 aim 5 — <!--bn:a5Runs-->237<!--/bn-->회 중 <!--bn:a5Unreached-->5<!--/bn-->회가 못 닿았어요 — 이고, 가장 많이 놓친 단은 aim 6 이에요: <!--bn:a6Runs-->237<!--/bn-->회 중 <!--bn:a6Unreached-->12<!--/bn-->회. 놓친 실행이 있는 칸(도달 / 실행):

| aim | 하네스 · 모델 · effort | 도달 |
|---|---|---|
| 5 | Codex · GPT-5.6 Luna · low | <!--bn:c_gpt56luna_low_a5_reach-->1/3<!--/bn--> |
| 5 | Codex · GPT-5.6 Terra · low | <!--bn:c_gpt56terra_low_a5_reach-->2/3<!--/bn--> |
| 5 | Codex · GPT-5.6 Terra · medium | <!--bn:c_gpt56terra_medium_a5_reach-->2/3<!--/bn--> |
| 5 | Codex · GPT-5.6 Terra · high | <!--bn:c_gpt56terra_high_a5_reach-->2/3<!--/bn--> |
| 6 | Claude Code · Haiku 4.5 · default | <!--bn:c_haiku45_default_a6_reach-->0/3<!--/bn--> |
| 6 | Codex · GPT-5.6 Luna · low | <!--bn:c_gpt56luna_low_a6_reach-->0/3<!--/bn--> |
| 6 | Codex · GPT-6 Luna · low | <!--bn:c_gpt6luna_low_a6_reach-->1/3<!--/bn--> |
| 6 | Antigravity · Gemini 3.1 Pro · low | <!--bn:c_gemini31pro_low_a6_reach-->2/3<!--/bn--> |
| 6 | Codex · GPT-5.6 Terra · medium | <!--bn:c_gpt56terra_medium_a6_reach-->2/3<!--/bn--> |
| 6 | Claude Code · Sonnet 5 · xhigh (n=1) | <!--bn:c_sonnet5_xhigh_a6_reach-->0/1<!--/bn--> |
| 6 | Claude Code · Sonnet 5 · max (n=1) | <!--bn:c_sonnet5_max_a6_reach-->0/1<!--/bn--> |

놓친 실행은 대부분 그 모델의 가장 낮은 effort 에서 나왔어요. GPT-5.6 Luna · GPT-6 Luna · Gemini 3.1 Pro 는 한 단 올리면 매번 닿았어요(각각 medium · medium · high — high 는 Gemini 3.1 Pro 의 유일한 다른 단계예요). Claude Haiku 4.5 는 effort 가 하나뿐이고 aim 6 에 한 번도 못 닿았어요. 반대 방향의 예외가 둘 있어요: GPT-5.6 Terra 는 가장 낮은 effort 보다 위에서도 놓쳤고(찾은 것 5), aim 6 의 Sonnet 5 xhigh · max 미도달은 Claude Code 의 기본 출력 상한이 생각 도중에 응답을 끊어서 생겼어요(찾은 것 7) — 하네스의 한계이고, 잰 그대로 뒀어요.

**2. 가장 싼 effort 는 거의 늘 low 나 medium 이고, 맨 윗단은 비용 배수예요.** effort 가 둘 이상인 모델 × aim 쌍 가운데 몇 쌍을 빼면, 검증된 결과당 가장 싼 effort 는 low 나 medium 이에요(나머지는 high). aim 1–4 에선 effort 를 올려도 도달이 늘지 않았어요. aim 5–6 에선 가장 낮은 effort 가 놓친 자리에서 도달을 샀고(찾은 것 1 · GPT-5.6 Terra 는 예외 — 찾은 것 5) — aim 6 의 Sonnet 5 는 오히려 위 두 effort 가 출력 상한 때문에 도달을 잃었어요(찾은 것 7). max 가 low 보다 얼마나 드는지 — aim 별 신뢰비용 비 max ÷ low 의 기하평균:

| 하네스 · 모델 | max ÷ low |
|---|---|
| Claude Code · Haiku 5.5 | <!--bn:spread_haiku55-->19×<!--/bn--> |
| Claude Code · Sonnet 5.5 | <!--bn:spread_sonnet55-->15×<!--/bn-->* |
| Claude Code · Fable 5.1 | <!--bn:spread_fable51-->13×<!--/bn-->* |
| Claude Code · Opus 5.5 | <!--bn:spread_opus55-->9.37×<!--/bn--> |
| Claude Code · Fable 5 | <!--bn:spread_fable5-->3.90×<!--/bn--> |
| Claude Code · Opus 4.8 (n=1) | <!--bn:spread_opus48-->3.72×<!--/bn--> |
| Claude Code · Opus 5 (n=1) | <!--bn:spread_opus5-->3.70×<!--/bn--> |
| Claude Code · Sonnet 5 (n=1) | <!--bn:spread_sonnet5-->3.42×<!--/bn-->‡ |
| Codex · GPT-5.6 Terra | <!--bn:spread_gpt56terra-->2.70×<!--/bn--> |
| Codex · GPT-5.6 Luna | <!--bn:spread_gpt56luna-->2.60×<!--/bn-->‡ |
| Codex · GPT-6.1 Sol | <!--bn:spread_gpt61sol-->2.39×<!--/bn--> |
| Codex · GPT-6 Sol | <!--bn:spread_gpt6sol-->2.26×<!--/bn--> |
| Codex · GPT-6 Astra | <!--bn:spread_gpt6astra-->2.25×<!--/bn--> |
| Codex · GPT-5.6 Sol | <!--bn:spread_gpt56sol-->2.05×<!--/bn--> |
| Codex · GPT-6 Luna | <!--bn:spread_gpt6luna-->1.50×<!--/bn--> |

\* 하한이에요. max 실행 일부가 도달했지만 라운드 예산에 걸려 비용 기록이 없어요(aim 5·6 의 Fable 5.1, aim 6 의 Sonnet 5.5). 그 칸의 평균은 비용을 아는 실행으로만 냈고, 빠진 건 가장 오래 걸린 실행이에요. ‡ aim 1–5 만: aim 6 에서 Sonnet 5 max 와 GPT-5.6 Luna low 가 못 닿았어요. Grok Build 와 Antigravity 에는 max 단계가 없어요.

Claude Code 에선 최신 버전들이 앞 버전보다 훨씬 넓게 벌어져요 — <!--bn:spread_opus55-->9.37×<!--/bn-->–<!--bn:spread_haiku55-->19×<!--/bn--> 대 <!--bn:spread_sonnet5-->3.42×<!--/bn-->–<!--bn:spread_fable5-->3.90×<!--/bn-->. 찾은 것 4 의 세대 비교가 그 이유를 보여 줘요: 한 버전에서 다음 버전으로 가며 low 는 크게 싸졌는데 max 는 아니었어요. Codex 행은 <!--bn:spread_gpt6luna-->1.50×<!--/bn-->와 <!--bn:spread_gpt56terra-->2.70×<!--/bn--> 사이에 머물러요.

**aim 별 권장 effort**(그림의 ★ / ☆)는 아래 표예요(영어 절의 «Recommended effort by aim» 표와 같아요). 모델 × aim 마다 네 단계예요. ① 자격: 모든 실행이 첫 답에서 통과한 effort. ② 예외: 보정이 필요했어도, 검증된 결과당 비용이나 시간이 자격 있는 최선의 절반 이하면 후보에 넣어요 — ~20% 잡음 띠보다 훨씬 큰 차이만. ③ 제외: 더 높은 effort 보다 비용이 20% 넘게 더 드는 하위 effort 는 ★ 를, 시간이 20% 넘게 더 드는 하위 effort 는 ☆ 를 못 받아요 — 더 쓰는 하위 effort 가 권장으로 보이면 안 되니까요. ④ 순위: 남은 후보 중 검증된 결과당 비용이 가장 싼 칸의 20% 안 전부에 ★(보고서 동률 규칙이라 동률은 함께 표시), 가장 빠른 칸의 20% 안이면서 ★ 가 아닌 것에 ☆. L · M · H · X = low · medium · high · xhigh(max 는 Mx). — 는 모든 실행이 첫 답에서 통과한 effort 가 없다는 뜻이에요. 비용 기록이 빠진 칸은 ★ 를 받지 않고, effort 가 하나뿐인 Claude Haiku 4.5 는 표에 없어요. **† = 잠정**: n=1 행의 표시는 실행 한 번으로 판정한 것이고, 두 번째·세 번째 실행 뒤에 다시 판정해요.

<!--bn-block:rec-md-->
| harness · model | aim 1 | aim 2 | aim 3 | aim 4 | aim 5 | aim 6 |
|---|---|---|---|---|---|---|
| Codex · GPT-5.6 Luna | L★ M★ | M★ | L★ M☆ | L★ | X★ | H★ X★ |
| Codex · GPT-5.6 Sol | L★ M★ | L★ | L★ M★ | L★ M☆ | L★ | M★ |
| Codex · GPT-5.6 Terra | L★ M★ H☆ | M★ | L★ M★ | L★ | X★ | L★ |
| Codex · GPT-6 Astra | L★ M★ | L★ M★ | L★ M★ | L★ M★ | L★ M★ | L★ M★ |
| Codex · GPT-6 Luna | L★ M★ H★ | H★ | L★ M★ | L★ M★ | M★ | H★ |
| Codex · GPT-6 Sol | L★ | L★ | L★ M★ | L★ | L★ | M★ H★ |
| Codex · GPT-6.1 Sol | L★ | L★ | L★ M★ | L★ | L★ M★ | L★ |
| Claude Code · Fable 5 | H★ | L★ | L★ | L★ | L★ | L★ |
| Claude Code · Fable 5.1 | L★ M★ H★ | L★ | L★ M★ | L★ | M★ | M★ |
| Claude Code · Haiku 5.5 | L★ | L★ | L★ | L★ | L★ | M★ |
| Claude Code · Opus 4.8 (n=1) | L★† M★† H★† | L★† | L★† M★† | L★† M☆† | L★† | L★† |
| Claude Code · Opus 5 (n=1) | L★† M★† | L★† M★† | L★† | L★† | L★† | L★† M☆† |
| Claude Code · Opus 5.5 | M★ | L★ | L★ M★ | L★ M★ | L★ | M★ |
| Claude Code · Sonnet 5 (n=1) | L★† M★† | M★† | L★† M★† | L★† M★† | L★† | M★† |
| Claude Code · Sonnet 5.5 | L★ M☆ | L★ M★ H☆ | L★ M★ | L★ M★ | H★ L☆ | L★ M★ |
| Grok Build · grok-4.6 | L★ | L★ | L★ | L★ | L★ | L★ |
| Grok Build · grok-4.7 | L★ | L★ | L★ | L★ | L★ | L★ |
| Antigravity · Gemini 3.1 Pro | L★ | — | H★ | L★ | — | — |
| Antigravity · Gemini 3.8 Flash | L★ | L★ | L★ | L★ M☆ | L★ | H★ |
<!--/bn-block-->

**3. Claude Haiku: 옛 소형 모델은 검증된 결과당 싸지 않았고, Haiku 5.5 는 가장 싼 Claude 행이에요.** Claude Haiku 4.5(effort 하나)는 <!--bn:m_haiku45_runs-->18<!--/bn-->회 중 <!--bn:m_haiku45_reached-->15<!--/bn-->회 도달했고, 그중 <!--bn:m_haiku45_oneShot-->4<!--/bn-->회가 첫 답 통과였어요. 도달한 모든 aim 에서 검증된 결과당 Sonnet 5.5 의 가장 싼 effort 보다 비쌌고, aim 6 에는 못 닿았어요. Claude Haiku 5.5 는 모든 실행이 도달했고(<!--bn:m_haiku55_runs-->90<!--/bn-->회 중 <!--bn:m_haiku55_reached-->90<!--/bn-->회) <!--bn:m_haiku55_oneShot-->89<!--/bn-->회가 첫 답 통과였어요 — 예외는 aim 6 low 의 한 실행이고, 그래서 권장 effort 가 aim 1–5 는 low, aim 6 은 medium 이에요. low 가 모든 aim 에서 자기 effort 중 가장 쌌고, 모든 aim 에서 Sonnet 5.5 의 가장 싼 effort 의 절반도 안 들었어요(신뢰비용):

| aim | Haiku 4.5 · default | Haiku 5.5 · low | Sonnet 5.5 · 가장 싼 effort |
|---|---|---|---|
| 1 | <!--bn:c_haiku45_default_a1_tc-->$0.37<!--/bn--> | <!--bn:c_haiku55_low_a1_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_low_a1_tc-->$0.26<!--/bn-->(low) |
| 2 | <!--bn:c_haiku45_default_a2_tc-->$1.06<!--/bn--> | <!--bn:c_haiku55_low_a2_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_low_a2_tc-->$0.23<!--/bn-->(low) |
| 3 | <!--bn:c_haiku45_default_a3_tc-->$0.46<!--/bn--> | <!--bn:c_haiku55_low_a3_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_medium_a3_tc-->$0.35<!--/bn-->(medium) |
| 4 | <!--bn:c_haiku45_default_a4_tc-->$0.62<!--/bn--> | <!--bn:c_haiku55_low_a4_tc-->$0.02<!--/bn--> | <!--bn:c_sonnet55_medium_a4_tc-->$0.16<!--/bn-->(medium) |
| 5 | <!--bn:c_haiku45_default_a5_tc-->$1.26<!--/bn--> | <!--bn:c_haiku55_low_a5_tc-->$0.05<!--/bn--> | <!--bn:c_sonnet55_medium_a5_tc-->$0.36<!--/bn-->(medium) |
| 6 | 못 닿음 (<!--bn:c_haiku45_default_a6_reach-->0/3<!--/bn-->) | <!--bn:c_haiku55_low_a6_tc-->$0.26<!--/bn--> | <!--bn:c_sonnet55_medium_a6_tc-->$0.57<!--/bn-->(medium) |

모든 칸을 통틀어 Haiku 5.5 의 신뢰비용 중앙값(<!--bn:m_haiku55_medTC-->$0.19<!--/bn-->)은 Claude 행 중 가장 낮아요(Sonnet 5.5: <!--bn:m_sonnet55_medTC-->$0.55<!--/bn-->, Haiku 4.5: <!--bn:m_haiku45_medTC-->$0.62<!--/bn-->). 하네스 전체로 봐도 더 낮은 건 GPT-6 Luna(<!--bn:m_gpt6luna_medTC-->$0.02<!--/bn-->)와 GPT-5.6 Luna(<!--bn:m_gpt56luna_medTC-->$0.06<!--/bn-->)뿐이에요. 시간은 같은 순서가 아니에요: 신뢰시간 중앙값(<!--bn:m_haiku55_medTT-->5.5<!--/bn-->분)이 Sonnet 5.5(<!--bn:m_sonnet55_medTT-->3.4<!--/bn-->분)보다 길고, 높은 effort 는 느려요(aim 6 max: <!--bn:c_haiku55_max_a6_tt-->27.1<!--/bn-->분). low→max 비용 폭도 잰 것 중 가장 넓어요(<!--bn:spread_haiku55-->19×<!--/bn-->, 찾은 것 2). Haiku 5.5 는 다른 Claude 행보다 새 Claude Code 버전에서, 측정 기간 후반에 쟀어요. [한계](#한계)의 버전 대조는 기존 칸을 2.1.293 으로 다시 잰 값을 공개된 평균과 비교해요(거기서 읽을 축은 비용 — 시간은 기계 부하와 함께 움직여요).

**4. 새 Claude·GPT 세대: low 에선 싸졌지만 max 에선 늘 그렇진 않아요 — grok-4.7 은 예외예요.** effort 별 신뢰비용 새 ÷ 옛(aim 별 비율의 기하평균 — 1× 아래면 새 버전이 검증된 결과당 더 싸요):

| 새 ÷ 옛 | low | medium | high | xhigh | max |
|---|---|---|---|---|---|
| Claude Opus 5.5 ÷ Opus 5 (n=1) | <!--bn:pair_opus55_opus5_low-->0.39×<!--/bn--> | <!--bn:pair_opus55_opus5_medium-->0.34×<!--/bn--> | <!--bn:pair_opus55_opus5_high-->0.30×<!--/bn--> | <!--bn:pair_opus55_opus5_xhigh-->0.60×<!--/bn--> | <!--bn:pair_opus55_opus5_max-->1.00×<!--/bn--> |
| Claude Opus 5.5 ÷ Opus 4.8 (n=1) | <!--bn:pair_opus55_opus48_low-->0.40×<!--/bn--> | <!--bn:pair_opus55_opus48_medium-->0.35×<!--/bn--> | <!--bn:pair_opus55_opus48_high-->0.42×<!--/bn--> | <!--bn:pair_opus55_opus48_xhigh-->0.57×<!--/bn--> | <!--bn:pair_opus55_opus48_max-->1.00×<!--/bn--> |
| Claude Sonnet 5.5 ÷ Sonnet 5 (n=1) | <!--bn:pair_sonnet55_sonnet5_low-->0.52×<!--/bn--> | <!--bn:pair_sonnet55_sonnet5_medium-->0.48×<!--/bn--> | <!--bn:pair_sonnet55_sonnet5_high-->0.36×<!--/bn--> | <!--bn:pair_sonnet55_sonnet5_xhigh-->0.89×<!--/bn-->‡ | <!--bn:pair_sonnet55_sonnet5_max-->2.43×<!--/bn-->‡ |
| Claude Fable 5.1 ÷ Fable 5 | <!--bn:pair_fable51_fable5_low-->0.70×<!--/bn--> | <!--bn:pair_fable51_fable5_medium-->0.55×<!--/bn--> | <!--bn:pair_fable51_fable5_high-->0.62×<!--/bn--> | <!--bn:pair_fable51_fable5_xhigh-->1.06×<!--/bn--> | <!--bn:pair_fable51_fable5_max-->2.41×<!--/bn-->* |
| GPT-6.1 Sol ÷ GPT-6 Sol | <!--bn:pair_gpt61sol_gpt6sol_low-->0.73×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_medium-->0.64×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_high-->0.71×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_xhigh-->0.80×<!--/bn--> | <!--bn:pair_gpt61sol_gpt6sol_max-->0.77×<!--/bn--> |
| GPT-6.1 Sol ÷ GPT-5.6 Sol | <!--bn:pair_gpt61sol_gpt56sol_low-->0.29×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_medium-->0.29×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_high-->0.27×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_xhigh-->0.35×<!--/bn--> | <!--bn:pair_gpt61sol_gpt56sol_max-->0.34×<!--/bn--> |
| GPT-6 Luna ÷ GPT-5.6 Luna | <!--bn:pair_gpt6luna_gpt56luna_low-->0.35×<!--/bn-->‡ | <!--bn:pair_gpt6luna_gpt56luna_medium-->0.33×<!--/bn--> | <!--bn:pair_gpt6luna_gpt56luna_high-->0.23×<!--/bn--> | <!--bn:pair_gpt6luna_gpt56luna_xhigh-->0.35×<!--/bn--> | <!--bn:pair_gpt6luna_gpt56luna_max-->0.26×<!--/bn--> |
| grok-4.7 ÷ grok-4.6 | <!--bn:pair_grok47_grok46_low-->1.64×<!--/bn--> | <!--bn:pair_grok47_grok46_medium-->1.93×<!--/bn--> | <!--bn:pair_grok47_grok46_high-->1.87×<!--/bn--> | <!--bn:pair_grok47_grok46_xhigh-->2.03×<!--/bn--> | — |

\* Fable 5.1 의 부분 비용 칸이 들어 있어서(찾은 것 2) 실제 비율은 조금 더 높아요. ‡ aim 1–5 만: 옛 모델이 그 effort 에서 aim 6 에 못 닿았어요(Sonnet 5 xhigh · max, GPT-5.6 Luna low).

- **Claude Code.** low 에서 high 까지는 새 Claude 버전이 모두 앞 버전보다 검증된 결과당 덜 들었어요 — Opus 5.5 는 Opus 5 · Opus 4.8 의 절반에 한참 못 미치고, Sonnet 5.5 는 Sonnet 5 의 절반 안팎이나 그 아래, Fable 5.1 은 Fable 5 의 <!--bn:pair_fable51_fable5_medium-->0.55×<!--/bn-->–<!--bn:pair_fable51_fable5_low-->0.70×<!--/bn--> 예요. 맨 위에선 차이가 닫혀요: max 에서 Opus 5.5 는 앞 Opus 두 버전과 같은 수준이고, Sonnet 5.5 와 Fable 5.1 은 앞 버전보다 더 들어요. xhigh 에선 Sonnet 과 Fable 이 ~20% 동률 띠 안이에요. 찾은 것 2 의 뒷면이에요 — 새 버전은 max 가 아니라 low 에서 싸져서 low→max 폭이 넓어졌어요.
- **Codex.** GPT-6.1 Sol 은 모든 effort 에서 GPT-6 Sol 보다 덜 들었고, GPT-5.6 Sol 의 대략 삼분의 일이에요. GPT-6 Luna 는 GPT-5.6 Luna 의 사분의 일에서 삼분의 일 정도예요. max 에서 뒤집히지 않아요. GPT-5.6 Luna 와 Terra 는 aim 5 에서도 놓친 실행이 있어요 — 같은 aim 에서 GPT-6 세대 행은 모든 실행이 도달했어요(찾은 것 5).
- **Grok Build.** grok-4.7 은 모든 effort 에서 grok-4.6 보다 더 들고 더 오래 걸렸어요(신뢰시간 중앙값 <!--bn:m_grok47_medTT-->22.5<!--/bn--> 대 <!--bn:m_grok46_medTT-->10.9<!--/bn-->분). 대신 모든 실행이 첫 답 통과였어요(<!--bn:m_grok47_oneShotPct-->100%<!--/bn--> 대 <!--bn:m_grok46_oneShotPct-->92%<!--/bn-->). 둘 다 모든 실행이 도달했어요.
- **n=1.** Opus 5 · Opus 4.8 · Sonnet 5 쪽은 칸마다 실행 한 번에 기대요. 큰 차이의 방향은 대체로 믿을 만하고, 1× 에서 ~20% 안쪽인 비율은 동률이에요.

**5. aim 5 에서 놓친 실행은 전부 GPT-5.6 Terra 나 Luna 예요.** GPT-5.6 Luna 는 low 에서만 놓쳤어요 — aim 5(<!--bn:c_gpt56luna_low_a5_reach-->1/3<!--/bn--> 도달)와 aim 6(<!--bn:c_gpt56luna_low_a6_reach-->0/3<!--/bn-->) — 그리고 medium 부터는 모든 실행이 닿았어요. 다만 그 aim 들에서 medium 은 보정이 필요했기 때문에(첫 답 aim 5 <!--bn:c_gpt56luna_medium_a5_first-->1/3<!--/bn--> · aim 6 <!--bn:c_gpt56luna_medium_a6_first-->0/3<!--/bn-->) 거기서 권장 effort 는 xhigh(aim 6 은 high 도)예요. GPT-5.6 Terra 는 aim 5 의 low · medium · high(<!--bn:c_gpt56terra_low_a5_reach-->2/3<!--/bn--> · <!--bn:c_gpt56terra_medium_a5_reach-->2/3<!--/bn--> · <!--bn:c_gpt56terra_high_a5_reach-->2/3<!--/bn-->)와 aim 6 의 medium(<!--bn:c_gpt56terra_medium_a6_reach-->2/3<!--/bn-->)에서 놓쳤는데, aim 6 의 low 에선 모든 실행이 닿았어요 — Terra 는 effort 를 올린다고 도달이 고르게 오르지 않았어요. xhigh 와 max 에선 모든 실행이 닿았고, aim 5 의 권장 effort 는 xhigh 예요. aim 6 의 low 표시는 예외 규칙으로 받은 거예요: low 는 보정이 필요했지만(첫 답 <!--bn:c_gpt56terra_low_a6_first-->1/3<!--/bn-->) 첫 답 통과한 최선의 effort 의 절반도 안 되는 시간이 걸렸어요. 후속 모델 GPT-6 Luna 는 aim 6 의 low 에서만 놓쳤고(<!--bn:c_gpt6luna_low_a6_reach-->1/3<!--/bn-->), GPT-5.6 Sol 과 GPT-6.1 Sol 은 모든 실행이 닿았어요.

**6. aim 6, 모델별** — 모델마다 aim 6 에서 가장 싼 effort(첫 답 = 보정 라운드 없이 도달):

| 하네스 · 모델 | 가장 싼 effort | 도달 | 첫 답 | 신뢰비용 | 신뢰시간(분) |
|---|---|---|---|---|---|
| Codex · GPT-6 Luna | medium | <!--bn:c_gpt6luna_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt6luna_medium_a6_first-->1/3<!--/bn--> | <!--bn:c_gpt6luna_medium_a6_tc-->$0.02<!--/bn--> | <!--bn:c_gpt6luna_medium_a6_tt-->7.0<!--/bn--> |
| Codex · GPT-5.6 Luna | medium | <!--bn:c_gpt56luna_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt56luna_medium_a6_first-->0/3<!--/bn--> | <!--bn:c_gpt56luna_medium_a6_tc-->$0.08<!--/bn--> | <!--bn:c_gpt56luna_medium_a6_tt-->6.3<!--/bn--> |
| Codex · GPT-6.1 Sol | low | <!--bn:c_gpt61sol_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt61sol_low_a6_first-->3/3<!--/bn--> | <!--bn:c_gpt61sol_low_a6_tc-->$0.18<!--/bn--> | <!--bn:c_gpt61sol_low_a6_tt-->4.4<!--/bn--> |
| Claude Code · Haiku 5.5 | low | <!--bn:c_haiku55_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_haiku55_low_a6_first-->2/3<!--/bn--> | <!--bn:c_haiku55_low_a6_tc-->$0.26<!--/bn--> | <!--bn:c_haiku55_low_a6_tt-->7.0<!--/bn--> |
| Grok Build · grok-4.6 | low | <!--bn:c_grok46_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_grok46_low_a6_first-->1/3<!--/bn--> | <!--bn:c_grok46_low_a6_tc-->$0.31<!--/bn--> | <!--bn:c_grok46_low_a6_tt-->13.5<!--/bn--> |
| Codex · GPT-6 Sol | low | <!--bn:c_gpt6sol_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt6sol_low_a6_first-->2/3<!--/bn--> | <!--bn:c_gpt6sol_low_a6_tc-->$0.33<!--/bn--> | <!--bn:c_gpt6sol_low_a6_tt-->5.8<!--/bn--> |
| Codex · GPT-5.6 Terra | low | <!--bn:c_gpt56terra_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt56terra_low_a6_first-->1/3<!--/bn--> | <!--bn:c_gpt56terra_low_a6_tc-->$0.52<!--/bn--> | <!--bn:c_gpt56terra_low_a6_tt-->7.7<!--/bn--> |
| Grok Build · grok-4.7 | low | <!--bn:c_grok47_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_grok47_low_a6_first-->3/3<!--/bn--> | <!--bn:c_grok47_low_a6_tc-->$0.57<!--/bn--> | <!--bn:c_grok47_low_a6_tt-->21.1<!--/bn--> |
| Claude Code · Sonnet 5.5 | medium | <!--bn:c_sonnet55_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_sonnet55_medium_a6_first-->3/3<!--/bn--> | <!--bn:c_sonnet55_medium_a6_tc-->$0.57<!--/bn--> | <!--bn:c_sonnet55_medium_a6_tt-->4.4<!--/bn--> |
| Codex · GPT-5.6 Sol | low | <!--bn:c_gpt56sol_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt56sol_low_a6_first-->2/3<!--/bn--> | <!--bn:c_gpt56sol_low_a6_tc-->$0.83<!--/bn--> | <!--bn:c_gpt56sol_low_a6_tt-->6.1<!--/bn--> |
| Claude Code · Opus 5.5 | low | <!--bn:c_opus55_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_opus55_low_a6_first-->1/3<!--/bn--> | <!--bn:c_opus55_low_a6_tc-->$1.00<!--/bn--> | <!--bn:c_opus55_low_a6_tt-->4.2<!--/bn--> |
| Codex · GPT-6 Astra | low | <!--bn:c_gpt6astra_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_gpt6astra_low_a6_first-->3/3<!--/bn--> | <!--bn:c_gpt6astra_low_a6_tc-->$1.04<!--/bn--> | <!--bn:c_gpt6astra_low_a6_tt-->5.5<!--/bn--> |
| Antigravity · Gemini 3.8 Flash | medium | <!--bn:c_gemini38flash_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_gemini38flash_medium_a6_first-->2/3<!--/bn--> | <!--bn:c_gemini38flash_medium_a6_tc-->$1.10<!--/bn--> | <!--bn:c_gemini38flash_medium_a6_tt-->6.9<!--/bn--> |
| Claude Code · Sonnet 5 (n=1) | medium | <!--bn:c_sonnet5_medium_a6_reach-->1/1<!--/bn--> | <!--bn:c_sonnet5_medium_a6_first-->1/1<!--/bn--> | <!--bn:c_sonnet5_medium_a6_tc-->$1.82<!--/bn--> | <!--bn:c_sonnet5_medium_a6_tt-->15.4<!--/bn--> |
| Claude Code · Fable 5.1 | medium | <!--bn:c_fable51_medium_a6_reach-->3/3<!--/bn--> | <!--bn:c_fable51_medium_a6_first-->3/3<!--/bn--> | <!--bn:c_fable51_medium_a6_tc-->$2.05<!--/bn--> | <!--bn:c_fable51_medium_a6_tt-->4.3<!--/bn--> |
| Claude Code · Opus 5 (n=1) | low | <!--bn:c_opus5_low_a6_reach-->1/1<!--/bn--> | <!--bn:c_opus5_low_a6_first-->1/1<!--/bn--> | <!--bn:c_opus5_low_a6_tc-->$3.35<!--/bn--> | <!--bn:c_opus5_low_a6_tt-->38.3<!--/bn--> |
| Antigravity · Gemini 3.1 Pro | high | <!--bn:c_gemini31pro_high_a6_reach-->3/3<!--/bn--> | <!--bn:c_gemini31pro_high_a6_first-->0/3<!--/bn--> | <!--bn:c_gemini31pro_high_a6_tc-->$4.20<!--/bn--> | <!--bn:c_gemini31pro_high_a6_tt-->8.3<!--/bn--> |
| Claude Code · Fable 5 | low | <!--bn:c_fable5_low_a6_reach-->3/3<!--/bn--> | <!--bn:c_fable5_low_a6_first-->3/3<!--/bn--> | <!--bn:c_fable5_low_a6_tc-->$4.80<!--/bn--> | <!--bn:c_fable5_low_a6_tt-->8.1<!--/bn--> |
| Claude Code · Opus 4.8 (n=1) | low | <!--bn:c_opus48_low_a6_reach-->1/1<!--/bn--> | <!--bn:c_opus48_low_a6_first-->1/1<!--/bn--> | <!--bn:c_opus48_low_a6_tc-->$5.44<!--/bn--> | <!--bn:c_opus48_low_a6_tt-->18.9<!--/bn--> |
| Claude Code · Haiku 4.5 | default | <!--bn:c_haiku45_default_a6_reach-->0/3<!--/bn--> | <!--bn:c_haiku45_default_a6_first-->0/3<!--/bn--> | — | — |

행 순서는 모델마다 2–5개 effort 칸 중 가장 싼 값 기준이라 effort 가 많은 모델에 유리하고, ~20% 안의 이웃은 순위가 아니라 동률이에요. «가장 싼 effort» 는 신뢰비용 기준이라, 일부 실행에서 보정이 필요했던 effort 일 수도 있어요. 다른 effort 의 미도달은 찾은 것 1 에 있어요.

**7. Claude Code 의 기본 출력 상한이 aim 6 의 몇 라운드를 끝냈어요.** aim 6 의 xhigh 와 max 에서 Sonnet 5 와 Opus 4.8(둘 다 n=1)이 쓴 응답이 생각하는 도중에 Claude Code 의 응답당 출력 상한(64,000 토큰)에 걸렸고, 그 라운드가 끝났어요. Sonnet 5 는 그 칸에서 못 닿았고, Opus 4.8 은 뒤 라운드에서 닿았어요 — 그래서 그 두 칸이 전체 표에서 가장 느려요(신뢰시간 <!--bn:c_opus48_xhigh_a6_tt-->164.7<!--/bn-->분 · <!--bn:c_opus48_max_a6_tt-->210.7<!--/bn-->분). 상한은 하네스 기본값 그대로 뒀어요. 자세한 내용은 [한계](#한계)의 «출력 상한» 에 있어요.

**8. 반복 간 흔들림은 중간 정도예요.** 한 칸의 실행들 사이에서 비용과 시간의 변동계수 중앙값은 모든 하네스에서 20% 안팎이나 그 아래예요 — 보고서의 동률 규칙이 여기서 나와요: 두 칸의 차가 ~20% 안쪽이면 동률로 읽어요. 어떤 칸은 훨씬 크게 흔들려요 — 보정 라운드가 한 실행엔 끼고 다른 실행엔 안 낄 때, 그리고 가끔은 같은 길이의 실행이 그냥 다르게 쓸 때요. 시간 축은 기계 부하에도 흔들려요. n=1 칸은 흔들림이 아예 안 보이고, 그래서 그 표시가 잠정이에요.

### 그림

aim 마다 그림 하나: x = 신뢰비용(로그), y = 신뢰시간(로그), 선 하나가 한 하네스의 한 모델, 점은 effort 단계예요(점 모양 = 공급사: 여섯 갈래 별 Anthropic · 육각형 OpenAI · 네 갈래 반짝임 Google · 굵은 X xAI · 채운 점은 모든 실행이 첫 답에서 도달, 외곽선만 있는 점은 보정 라운드가 필요했거나 못 닿은 실행이 있음 · n=1 모델은 옅은 짧은 점선과 «n=1» 표시 · ★ / ☆ = 권장 effort, 찾은 것 2 의 «aim 별 권장 effort» 참고, n=1 행은 †). 범례에는 도달 못 한 effort, 비용을 모르는 effort, 비용이 일부만 있는 effort 를 표시해요. 왼쪽 아래일수록 좋아요. 오른쪽 위 표시는 사다리의 단이에요.

![aim 1](docs/assets/bench/trust-cost-aim1.png)
![aim 2](docs/assets/bench/trust-cost-aim2.png)
![aim 3](docs/assets/bench/trust-cost-aim3.png)
![aim 4](docs/assets/bench/trust-cost-aim4.png)
![aim 5](docs/assets/bench/trust-cost-aim5.png)
![aim 6](docs/assets/bench/trust-cost-aim6.png)

### 찾아서 고친 측정 결함

목록은 영어 절의 [«Measurement defects found and fixed»](#measurement-defects-found-and-fixed) 표에 있어요. 대부분은 오류처럼 보이지 않았어요 — 결과가 정상으로 나왔거든요. 모두 고쳤고, 영향받은 실행은 다시 쟀어요(표에 적은 경우는 그대로 뒀어요). 옛 기록은 지우지 않고 대체됨으로 표시해 뒀어요.

### 사건 — 빈 피드백이 탐색을 부른다

한 실행(Fable 5.1 · max · aim 2)에서 모든 라운드가 «시험 0개 실행» 으로 채점됐고 피드백은 이유 없이 끝났어요. 단서가 없자 모델이 자기 모듈에 진단 코드를 넣어, 채점기가 모듈을 어떻게 불러오는지를 원래 작업 폴더에 기록했어요. 다음 라운드에서 읽을 수 있는 자리예요. 변조 검사가 네 번째 라운드를 잡아 이 실행은 무효예요(실행 밖에서 따로 다시 채점하니 최종 코드는 73개 시험 전부 통과). 교훈 둘: **채점 피드백이 비면 모델은 평가기를 조사해요** — 피드백은 늘 무엇이 틀렸는지를 담아야 해요. 그리고 변조 검사는 답 베끼기만이 아니라 채점기를 들여다보는 것도 잡아야 해요.

### 한계

- **관측자 한 명, 기계 한 대.** 측정은 전부 관측자 한 명이 Windows 워크스테이션 한 대에서 했어요. 독립 재현은 아직 없어요.
- **과제와 숨긴 시험은 공개하지 않아요** — 학습 데이터와 실행 중인 모델 양쪽에서 떼어 두려고요. 아직 다시 돌려 볼 수 없으니 표준이 아니라 보고서로 읽어 주세요.
- **반복 수가 행마다 달라요.** <!--bn:nNoteKo-->칸마다 n = 3 · Opus 4.8, Opus 5, Sonnet 5 는 n = 1(다음 회차 측정 중) · Fable 5.1 1칸은 n = 2<!--/bn-->. 실행 세 번은 흔들림을 볼 만큼이지 촘촘한 순위를 낼 만큼은 아니에요. n=1 행(<!--bn:n1ModelsKo-->Opus 4.8, Opus 5, Sonnet 5<!--/bn-->)은 과제 × effort 마다 실행이 한 번이에요 — 두 번째·세 번째 실행을 재는 중이고, 끝나면 수치를 갱신해요. 읽는 규칙: n=1 순위는 대체로 믿을 만하지만 ~20% 안쪽 차이는 동률로 읽고, † 표시는 잠정으로 보세요.
- **실행 순서.** Grok Build 의 aim 1–5 세 번째 실행(과 두 번째 실행 하나), 그리고 aim 6 실행 전부는 첫 측정의 다른 행보다 늦은 2026-10-06 에 쟀어요. 이번 갱신에 더한 행(Claude Haiku 5.5 · Opus 5 · Sonnet 5 · Opus 4.8, GPT-5.6 Sol · Terra · Luna)은 그 뒤에, 다른 날짜와 다른 기계 부하 아래에서 쟀어요.
- **버전.** Claude Code CLI 버전은 Claude 전사에 남아 있어요(라운드 예산에 걸려 멈춘 실행은 전사가 없어요). 다른 하네스는 가장 최근 Codex 실행 일부에만 버전이 기록됐어요. 모델 동작은 측정 날짜 기준이에요.
- **시간이 더 약한 축이에요.** 벽시계 시간은 기계 부하(동시에 돈 체인 수) · 실행 순서 · 서빙 계정에 따라 흔들려요. Claude 계정을 두 개 썼고 2026-10-03 에 바꿨어요 — 비용엔 영향이 없고 시간엔 있을 수 있어요. 훅 시기의 Claude 실행(결함 표)은 도구 호출마다 몇 초씩 더 걸렸어요.
- **비용은 API 정가 환산이에요.** 구독 요금제가 받는 값이 아니라 토큰을 정가로 샀을 때의 값이에요.
- **빠진 비용.** 일부 max 실행(aim 5·6 의 Fable 5.1, aim 6 의 Sonnet 5.5)은 도달했지만 라운드 예산에 걸렸고, Claude Code 는 멈춘 세션의 비용을 안 남겨요 — 그 칸의 평균은 나머지 실행으로 낸 하한이고, 그림에 «partial cost» 로 표시돼요.

**CLI 버전 대조.**
<!--bn-block:cli-control-ko-->
Claude Haiku 5.5 는 Claude Code 2.1.293 를 나란히 설치해 쟀어요. 나머지 Claude 행은 전부 2.1.284 예요. 버전 자체의 효과를 보려고 기존 칸 12개를 2.1.293 로 한 번씩 다시 재서 공개된 n=3 평균과 비교했어요: Haiku 4.5 default — 비용 1.08× · 시간 0.91×(과제 6개의 기하평균 · 비용은 6칸 중 3칸, 시간은 2칸이 ±20% 동률 띠 안); Sonnet 5.5 low — 비용 1.02× · 시간 0.74×(과제 6개의 기하평균 · 비용은 6칸 중 5칸, 시간은 3칸이 ±20% 동률 띠 안). 여기서 읽을 축은 비용이에요 — 시간은 기계 부하와 함께 움직여요(라운드 시작 전 CPU 사용률 평균이 다시 잰 실행 25%, 같은 칸의 원래 실행 37%). 도달이 공개 칸과 다르게 나온 재측정이 1건 있어요: aim 5 의 Haiku 4.5 default 는 공개된 3회가 다 닿았는데 라운드 4개를 쓰고도 못 닿았고 — 한 번씩 다시 잰 것으로는 버전 효과와 실행 간 흔들림을 가를 수 없어서, 평균에 묻지 않고 여기 기록해 둬요.
<!--/bn-block-->

**복원한 비용.**
<!--bn-block:restored-ko-->
실행 2회는 비용을 세션 기록의 마지막 누적 토큰 수 × 공개 가격으로 복원했어요: aim 4 의 GPT-5.6 Luna medium 1회차($0.02 — 세션이 작업을 마친 뒤 용량 오류를 돌려줘서 마지막 사용량 이벤트가 러너에 오지 않았어요); aim 5 의 GPT-5.6 Luna max 3회차($0.19 — 작업은 이미 끝났는데 라운드가 90분 예산에 걸렸어요 — 세션 기록의 마지막 30분에 이벤트가 없어요(응답 스트림 정체). 이 실행의 시간에는 그 정체가 들어 있어요).
<!--/bn-block-->

**출력 상한.**
<!--bn-block:cap-ko-->
Claude Code 의 기본 출력 상한(응답당 64,000 토큰)이 4칸에서 라운드 11개를 끝냈어요: aim 6 의 Opus 4.8 xhigh(라운드 3개 중 2개 · 뒤 라운드에서 도달), aim 6 의 Opus 4.8 max(라운드 3개 중 2개 · 뒤 라운드에서 도달), aim 6 의 Sonnet 5 xhigh(라운드 4개 중 3개 · 도달 못 함), aim 6 의 Sonnet 5 max(라운드 4개 중 4개 · 도달 못 함). 생각하는 도중에 응답 자리가 다 찼어요. 상한은 하네스 기본값 그대로 뒀어요 — 이 칸들은 하네스가 나오는 그대로 잰 값이고, 여기서 도달하지 못한 칸은 모델보다 기본 상한에 대해 더 많이 말해요.
<!--/bn-block-->

### 쓰이는 곳

- [Superscalar.md §5.1.5](Superscalar.md) — 티어 안에서 모델을 고를 때 신뢰비용이 어떻게 들어가는지.
- [`plugins/superscalar/model-registry.json`](plugins/superscalar/model-registry.json) — effort 안내와 잰 모델마다의 사내 측정 항목이 이 측정을 인용해요.
- 웹 버전: [docs/superscalar-bench.html](https://soliestre.github.io/EstreGenesis/superscalar-bench.html).
