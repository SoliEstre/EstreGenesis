---
id: post-approval-publish-trigger
tier: micro
trigger:
  if: "user-approval-prompt 의 명시 승인 응답 직후"
  then: "publish command 실행 + audit_trail 항목 append (ts + approval response + command + exit code) → exit 0 + post-publish smoke check 성공 시 done; 실패 시 user 에게 즉시 surface (retry/abort 는 user 영역)"
  format: command-check-decision
  source: post-tool-use-hook
source_evidence:
  - greatpractice/mezzo/pre-publish-user-gate.md §2 (post-approval-publish-trigger row)
  - greatpractice/mezzo/pre-publish-user-gate.md §5.2 (PostToolUse hook — publish command audit_trail)
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Post-Approval Publish Trigger

> mezzo `pre-publish-user-gate` 의 executable atom #3. 승인 후 publish 실행 + audit_trail 기록 + post-publish 확인이에요.

## Command

```javascript
function executePublish(publishCommand, approvalResponse) {
  const { execSync } = require('child_process');
  const fs = require('fs');
  let exitCode = 0;
  try {
    execSync(publishCommand, { stdio: 'inherit' });
  } catch (e) {
    exitCode = e.status == null ? 1 : e.status;
  }
  // audit_trail append-only 기록 (mezzo §5.2 storage spec)
  const entry = {
    ts: new Date().toISOString(),
    approval_response: approvalResponse, // verbatim, redaction 후
    publish_command: publishCommand,
    exit_code: exitCode
  };
  fs.appendFileSync('greatpractice/_audit/publish-trail.jsonl',
    JSON.stringify(entry) + '\n', 'utf8');
  return exitCode;
}
```

## Check

```javascript
// exit code 0 + 외부 surface 의 publication 확인 (post-publish smoke check)
// 예: npm registry 에 신규 버전 visible / GitHub Releases 에 tag 존재
function postPublishSmokeCheck(exitCode, smokeCommand) {
  if (exitCode !== 0) return false;
  // smokeCommand 예: `npm view <pkg> version` === 기대 버전,
  //                  `gh release view <tag>` exit 0
  try {
    require('child_process').execSync(smokeCommand, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
```

## Decision

```javascript
if (postPublishSmokeCheck(exitCode, smokeCommand)) {
  // done — audit_trail commit 포함하여 cycle close
  return { ok: true };
}
// exit ≠ 0 또는 smoke check 실패 → user 에게 즉시 surface
// retry vs abort 결정은 user 영역 — 자동 retry 금지
console.error('[post-approval-publish-trigger] FAIL: publish 실패 또는 publication 미확인 — user surface 필요');
process.exit(2);
```

## Invariants

- publish command 실행은 반드시 명시 승인 응답 *직후* — 승인 없는 실행 경로 없음
- audit_trail 항목은 exit code 와 무관하게 항상 append (실패도 기록)
- audit_trail 은 append-only (`greatpractice/_audit/publish-trail.jsonl`)
- 실패 시 자동 retry 금지 — retry/abort 분기는 user 영역

## Used By

- mezzo §5.2 PostToolUse hook (audit_trail jsonl append, v0.3+)
- mezzo §7.3 v0.4 cross-cycle audit_trail review (autonomy violation rate 측정)
