# X (Twitter) draft posts — EstreGenesis launch

Three angles drafted: launch / Superscalar deep / Constellation deep. Each carries the same shipped artifact (the site you're reading is the proof). Capture screenshots from `superscalar.html` (A/B chart + B-only callout) and `constellation.html` (5-PR chart + protocol cards) for the visual.

---

## Angle 1 — launch (one tweet · landing page)

**EN**:
```
EstreGenesis — a public seed of agentic-coding patterns for Claude Code.

Two graduated modules (Apache-2.0):
• Superscalar — execution-scheduling discipline (issue_width + retire + consistency gate)
• Constellation — live multi-agent orchestration (WebSocket + A2A + MCP)

31 ships · 5 e2e PRs · 0 violations in 24h.

https://soliestre.github.io/EstreGenesis/
```

**KO**:
```
EstreGenesis — Claude Code용 agentic-coding 패턴 공개 시드.

두 graduated 모듈 (Apache-2.0):
• Superscalar — 실행 스케줄링 규율 (issue_width + retire + consistency gate)
• Constellation — 실시간 multi-agent 오케스트레이션 (WebSocket + A2A + MCP)

24시간 dogfood: 31 ship · 5 e2e PR · 0 위반.

https://soliestre.github.io/EstreGenesis/
```

---

## Angle 2 — Superscalar deep (thread · with A/B chart)

**Tweet 1 (with A/B chart screenshot)**:
```
Parallelism is not sufficient.

A 9-dim payment-backend audit, both arms parallelised. Only orchestration discipline (design-freeze → consume → cross-cut → in-order retire) varied.

Discipline ON vs OFF:
• grounding (crossRefs): +118%
• speculation: −40%
• cost: 2.65× wall-clock, +8% tokens

🧵
```

**Tweet 2**:
```
Both arms found both halves of a real auth-hash contradiction (foundation: declared algorithm vs consumer: production algorithm).

Only the discipline-ON arm's consistency gate paired them and resolved it.

The OFF arm left it as a silent quality defect downstream.
```

**Tweet 3**:
```
The 2.65× wall-clock is the cost of phase serialisation (freeze → consume → cross-cut → retire), NOT parallel inefficiency.

In-phase parallelism is identical in both arms. The discipline serialises phases, adds a retire stage, and trades wall-clock for cross-lane consistency.
```

**Tweet 4 (close)**:
```
For fast first-pass recon: naïve parallel wins.
For handover-grade audits + cross-dim consistency: discipline wins.

The trade-off is now numerically anchored.

Full Entry 06 + dogfood ledger:
https://soliestre.github.io/EstreGenesis/superscalar.html

Spec: https://github.com/SoliEstre/EstreGenesis/blob/main/Superscalar.md
```

---

## Angle 3 — Constellation deep (thread · with 5-PR chart)

**Tweet 1 (with 5-PR chart screenshot)**:
```
A2A PR system — cross-repo Pull Requests over the agent-to-agent messaging layer.

24h dogfood result: 5 end-to-end PRs, 415 mirror insertions, 0 redaction violations, 0 merge failures.

Two merge paths validated: canonical PR_LIVE chain (PRs #1-3) + Manual fast-path (PRs #4-5).

🧵
```

**Tweet 2**:
```
PR #4 + #5 stressed an idea: for "trusted-mirror" PRs (single-file append-section, pre-authorised path), the 8-envelope PR_LIVE chain adds nothing the dry-run already validated.

So we collapsed 8 envelopes → 2 (PRRequest dry-run → PRMergeAck).
Codified at RRP §10B (v2.5.14).
```

**Tweet 3**:
```
What kept fast-path safe = one load-bearing invariant:

dry-run draftRef consistency gate — PRMergeAck.draftRef MUST match PRDraftReady.draftRef from the dry-run. Without it, fast-path is an unauthenticated merge claim.

The check is verifiable from inbox.log alone.
```

**Tweet 4 (close)**:
```
Five e2e PRs in 24h. Three relay-drop incidents triggered a §13.13.2 RRP (at-least-once relay) — server pending queue + redelivery + idempotent receiver dedup. Reference impl: v2.5.15.

Full 24h ship timeline + protocol additions:
https://soliestre.github.io/EstreGenesis/constellation.html
```

---

## Capture instructions

Open the promo site → pick the theme you want (the three themes look quite different — recommend trying all three locally to see which captures best for X) → take screenshots of:

1. `index.html` hero section (landing — for Angle 1)
2. `superscalar.html` A/B chart + B-only callout (for Angle 2 tweet 1)
3. `superscalar.html` quantitative table (optional secondary visual)
4. `constellation.html` 5-PR chart (for Angle 3 tweet 1)
5. `constellation.html` protocol additions card grid (optional)

X allows up to 4 images per tweet, so threads with 1 image per tweet work well. Landscape captures (16:9 ratio) display best.
