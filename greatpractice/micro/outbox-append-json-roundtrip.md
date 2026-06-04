---
id: outbox-append-json-roundtrip
tier: micro
trigger:
  if: "outbox.jsonl append operation initiated"
  then: "JSON.stringify(input) → appendFileSync(path, line + '\\n') → readback → JSON.parse → assert deep_equal(input, readback). exit 2 on any failure."
  format: command-check-decision
  source: stop-hook
source_evidence:
  - greatpractice/mezzo/outbox-json-validation.md §2.2
  - memory/feedback_outbox_json_validation.md
last_referenced_turn: 2026-06-04T13:00:00Z
class: persistent
---

# Atom: Outbox Append JSON Roundtrip

> mezzo `outbox-json-validation` 의 executable atom. (command + check + decision) 3-tuple.

## Command

```javascript
function appendOutboxLine(payloadObj, outboxPath) {
  const line = JSON.stringify(payloadObj);
  fs.appendFileSync(outboxPath, line + '\n', 'utf8');
  return line;
}
```

## Check

```javascript
function verifyRoundtrip(payloadObj, line, outboxPath) {
  // re-read last line
  const lastLine = fs.readFileSync(outboxPath, 'utf8').trimEnd().split('\n').pop();
  const parsed = JSON.parse(lastLine);
  // deep equal via canonical re-stringify
  return JSON.stringify(parsed) === line;
}
```

## Decision

```javascript
if (!verifyRoundtrip(payloadObj, line, outboxPath)) {
  console.error('[outbox-append-json-roundtrip] FAIL: roundtrip mismatch');
  process.exit(2);
}
return { ok: true };
```

## Invariants

- `line` MUST NOT contain interior newline (only trailing `\n` from append)
- `JSON.parse(line)` MUST succeed
- `JSON.stringify(JSON.parse(line))` MUST equal `line` byte-for-byte
- Failure → `exit(2)` (no recovery — propagate)

## Used By

- `plugins/greatpractice/hooks/contact/outbox-json-validate.cjs`
- `scripts/eg_outbox_push.cjs`
