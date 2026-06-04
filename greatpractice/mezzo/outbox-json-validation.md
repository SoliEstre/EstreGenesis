---
# === v0.1 lint-required (block on missing) ===
id: outbox-json-validation
tier: mezzo
binding: ratio
enforcement_level: mandatory
trigger:
  if: "outbox.jsonl 에 append 직전 OR JSON 직접 작성 직전 (PreToolUse on Write/Bash with target=outbox.jsonl)"
  then: "scripts/eg_outbox_push.cjs 경유 + JSON.stringify(object) + appendFileSync + readback + JSON.parse + assert deep_equal(input, readback). bash HEREDOC 금지."
  format: json-schema
  source: post-incident
lifecycle: probation
last_referenced_turn: 2026-06-04T13:00:00Z

# === v0.1 lint-warn (warn on missing, 6-cycle grace) ===
title: Outbox JSON Validation Discipline
slug: outbox-json-validation
created_at: 2026-06-04T13:00:00Z
source_evidence:
  - memory/feedback_outbox_json_validation.md
  - reports/2026-06-04-greatpractice-research/axes/sre.md
  - phase_3 cycle observation — 3 outbox drops attributable to bash HEREDOC injection

evidence_quality: high
recommendation_strength: MUST

maturity_score:
  frequency: 3
  depth: 4
  recency: 5
  cost: 4
  predictability: 5
  # threshold = sum ≥ 18 (현재 21) OR (frequency ≥ 3 AND independent_triggers ≥ 2 AND verifiable_effect)
  # 자세한 5-axis 공식 = Greatpractice.md §5.1

last_validated_at: 2026-06-04T13:00:00Z
validation_cadence_days: 90
freshness_until: 2026-09-02T13:00:00Z
freshness_inherits_from: null

coherence: strict
edit_policy: owned
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-04T13:00:00Z, agent: claude-opus-4-7, action: promote, prev_hash: null}

supersedes:
  - memory/feedback_outbox_json_validation.md
superseded_by: null
kaizen_baseline_since: 2026-06-04
revision_history:
  - {ts: 2026-06-04T13:00:00Z, type: created, by: claude-opus-4-7, cost_tier: null}

surfaces:
  - {kind: hook, path: plugins/greatpractice/hooks/contact/outbox-json-validate.cjs, inherits_freshness: true}
  - {kind: schema, path: plugins/greatpractice/schemas/hook-spec.schema.json#outbox-json-validation, inherits_freshness: true}
  - {kind: memory_stub, path: memory/feedback_outbox_json_validation.md, inherits_freshness: false}

parent:
  - greatpractice/macro/communication-discipline.md
children:
  - greatpractice/micro/outbox-append-json-roundtrip.md

phronesis_boundary: false
class: persistent

# === v0.2+ deferred (Greatpractice.md §3.7) ===
hash: null
deps: []
rrpv: 2
miss_count:
  compulsory: 0
  capacity: 0
  conflict: 0
  coherence: 0
---

# Outbox JSON Validation Discipline

> 모든 `outbox.jsonl` append 작업은 (a) `scripts/eg_outbox_push.cjs` 경유 + (b) `JSON.stringify(object)` 단일행 변환 + (c) 작성 직후 readback + parse + (d) 원본 object 과 parsed object 의 `deep_equal` 검증을 충족해야 해요. bash HEREDOC (`cat >> file << EOF ... EOF`) 직접 append 는 금지 — 본 Windows + PowerShell 환경에서 trailing extra content injection 패턴이 phase_3 cycle 내 3 회 관측됐어요.

## §1. Problem Surface

Constellation A2A relay 는 single-line JSON 전제 wire format 이에요. `outbox.jsonl` 에 multi-line JSON 또는 invalid JSON 이 append 되면:

1. `local-bridge` 의 `say` fallback path 진입 → TEXT_MESSAGE 로 wrapper 됨
2. 라이브보드에 raw text 로 표시됨 + targetAgent inbox 에 의도된 CUSTOM payload 미도달
3. silent failure — write 자체는 성공하므로 호출자가 인지 못 함

본 패턴은 phase_3 cycle 에 3 회 관측됐고 매번 hub agent 가 ws-history forward 로 복구 (memory/feedback_a2a_relay_reliability.md). 본 entry 는 그 *근본 원인* 인 JSON 형식 위반을 PreToolUse 차단으로 zero-recurrence 보장.

## §2. Enforcement Mechanism

### §2.1 Contact-type PreToolUse hook

`plugins/greatpractice/hooks/contact/outbox-json-validate.cjs` 가 다음 조건 시 fire:

- `Write` tool 호출 + `file_path` ends with `outbox.jsonl`
- `Bash` tool 호출 + `command` matches `outbox\.jsonl` regex

Fire 시 검증:

1. tool input 의 작성 내용이 valid single-line JSON 인지 (`JSON.parse(...)` 통과)
2. 작성 내용에 newline 이 한 줄 끝 (trailing `\n`) 외에 없는지 (multi-line block 차단)
3. command path 가 `scripts/eg_outbox_push.cjs` 경유인지 (direct append 차단 — bash HEREDOC 회피)

3 검사 중 하나라도 실패 시 `exit(2)` + error message:

```
[greatpractice/outbox-json-validation] BLOCKED — outbox.jsonl direct append detected.
Reason: <invalid JSON | multi-line content | non-script direct write>
Action: use scripts/eg_outbox_push.cjs(payloadObj) for outbox emit.
Reference: greatpractice/mezzo/outbox-json-validation.md
```

### §2.2 Recommended Pattern (in-place)

```javascript
// scripts/eg_outbox_push.cjs (canonical helper)
const fs = require('fs');
const path = require('path');

function pushOutbox(payloadObj, outboxPath = 'c:/Dev/EstreGenesis/collab/outbox.jsonl') {
  // (1) stringify
  const line = JSON.stringify(payloadObj);
  // (2) sanity: no newline in interior
  if (line.includes('\n')) throw new Error('JSON.stringify produced interior newline');
  // (3) append + readback
  fs.appendFileSync(outboxPath, line + '\n', 'utf8');
  // (4) roundtrip verify
  const lastLine = fs.readFileSync(outboxPath, 'utf8').trimEnd().split('\n').pop();
  const parsed = JSON.parse(lastLine);
  // (5) deep equal (structural)
  if (JSON.stringify(parsed) !== line) {
    throw new Error('[outbox-push] roundtrip mismatch: ' + JSON.stringify({input: payloadObj, readback: parsed}));
  }
  return { ok: true, msgId: payloadObj.msgId, bytes: line.length + 1 };
}

module.exports = { pushOutbox };
```

## §3. Atom Decomposition

다음 micro atom 으로 분해 — 각 atom 은 본 mezzo entry 의 `children` 에 등록 + 독립 hook payload 로 호출 가능:

- `greatpractice/micro/outbox-append-json-roundtrip.md` — (1)-(5) 단계의 atomic primitive

## §4. Validation Cadence

- v2.5.50 ship 직후부터 30-day rolling window 의 *drop count* 추적
- pre-codify recurrence-rate baseline = 3 drops / 60 days (phase_3 cycle baseline)
- post-codify success criteria = ≤ 1 drop / 30 days (66% reduction floor)
- 90-day probation 후 `lifecycle: consolidation` 격상 — `revision_history` 에 cost_tier 명시 시점에 maturity_score `predictability` 재평가

## §5. Anti-patterns to Avoid

- ❌ `bash -c "cat >> outbox.jsonl << EOF ... EOF"` — trailing newline injection 패턴
- ❌ multi-line Write tool content 가 newline 이 포함된 JSON 시도 — parser 통과해도 wire format 위반
- ❌ `outbox.jsonl` 의 *수정* (update existing line) — append-only 가정 위반, log integrity 손상
- ❌ direct `node -e "fs.appendFileSync(...)"` 등 helper 우회 — roundtrip 검증 skip

## §6. Relation to Other Entries

- `parent`: `greatpractice/macro/communication-discipline.md` (A2A · bridge · outbox · cursor 계열 macro)
- `composes`: `greatpractice/micro/outbox-append-json-roundtrip.md`
- `related`: `greatpractice/mezzo/pre-send-inbound-check.md` (v2.5.51+ ship) — outbound emit 순서 강제 sequence
- `related`: `greatpractice/mezzo/a2a-relay-reliability-forward.md` (v2.5.51+ ship) — at-most-once relay 의 forward 복구 패턴

## §7. Promoted From

- `memory/feedback_outbox_json_validation.md` — v2.5.50 ship 시점에 redirect stub 으로 전환 (canonical merge-redirect, Greatpractice.md §5.5)
