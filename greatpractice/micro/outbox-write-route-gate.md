---
id: outbox-write-route-gate
tier: micro
trigger:
  if: "PreToolUse — Write tool 의 file_path 가 outbox.jsonl 로 끝나거나, Bash command 가 /outbox\\.jsonl/ 에 match"
  then: "scripts/eg_outbox_push.cjs 경유 여부 + HEREDOC/direct-append 패턴 부재 검사. 위반 시 exit 2 block (Write 직접 작성은 무조건 차단)."
  format: command-check-decision
  source: post-incident
source_evidence:
  - greatpractice/mezzo/outbox-json-validation.md §2.1
  - greatpractice/mezzo/outbox-json-validation.md §5
  - memory/feedback_outbox_json_validation.md
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Outbox Write Route Gate

> mezzo `outbox-json-validation` §2.1 검사 (3) 의 executable atom — outbox.jsonl 을 향하는 tool call 이 canonical helper (`scripts/eg_outbox_push.cjs`) 를 경유하는지 PreToolUse 시점에 판정하고, direct append (bash HEREDOC 포함) 를 사전 차단해요. 기존 atom `outbox-append-json-roundtrip` 이 *작성 후* 검증이라면, 본 atom 은 *작성 전* 경로 게이트예요.

## Command

```javascript
// PreToolUse input 에서 outbox.jsonl 타겟 여부 감지
function targetsOutbox(toolName, toolInput) {
  if (toolName === 'Write') return /outbox\.jsonl$/.test(toolInput.file_path || '');
  if (toolName === 'Bash') return /outbox\.jsonl/.test(toolInput.command || '');
  return false;
}
```

## Check

```javascript
// helper 경유 + 금지 패턴 부재일 때만 통과
function isAllowedRoute(toolName, toolInput) {
  if (toolName === 'Write') return false; // outbox.jsonl 직접 Write 는 무조건 차단
  const cmd = toolInput.command || '';
  const viaHelper = /scripts[\/\\]eg_outbox_push\.cjs/.test(cmd);
  const heredoc = /<<\s*-?\s*['"]?\w+/.test(cmd) || /cat\s+>>/.test(cmd);
  return viaHelper && !heredoc;
}
```

## Decision

```javascript
if (targetsOutbox(toolName, toolInput) && !isAllowedRoute(toolName, toolInput)) {
  console.error('[greatpractice/outbox-json-validation] BLOCKED — outbox.jsonl direct append detected.');
  console.error('Reason: non-script direct write (HEREDOC / cat >> / direct Write)');
  console.error('Action: use scripts/eg_outbox_push.cjs(payloadObj) for outbox emit.');
  console.error('Reference: greatpractice/mezzo/outbox-json-validation.md');
  process.exit(2);
}
```

## Invariants

- outbox.jsonl 에 닿는 `Write` tool 호출은 내용 무관 차단 (helper 경유만 허용)
- `Bash` 호출은 `scripts/eg_outbox_push.cjs` 경유 + HEREDOC / `cat >>` 패턴 부재일 때만 통과
- 차단 시 `exit(2)` + mezzo §2.1 포맷 error message (no recovery — propagate)
- 본 gate 통과 후의 JSON 정합은 `outbox-append-json-roundtrip` atom 이 담당 (2-단 defense)

## Used By

- `plugins/greatpractice/hooks/contact/outbox-json-validate.cjs`
