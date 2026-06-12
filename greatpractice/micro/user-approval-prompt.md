---
id: user-approval-prompt
tier: micro
trigger:
  if: "diff-surface-summary 완료 직후 (publish-equivalent command 대기 상태)"
  then: "surface diff summary + publish command preview 표시 → 명시 승인 응답만 통과 (모호 응답 re-prompt, abort 응답 block + revise loop) — timeout 없음, 자동 진행 절대 금지"
  format: command-check-decision
  source: pre-tool-use-hook
source_evidence:
  - greatpractice/mezzo/pre-publish-user-gate.md §2 (user-approval-prompt row)
  - greatpractice/mezzo/pre-publish-user-gate.md §4.3 (phronesis_boundary — 승인 결정 자체는 user 영역)
  - AGENTS.md §5.1 autonomous-execution gate (a) — loss / external publish 명시적 인간 게이트
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: User Approval Prompt

> mezzo `pre-publish-user-gate` 의 executable atom #2. 마지막 human gate — 승인 *판단* 은 phronesis 영역이고, 본 atom 은 응답 분류의 mechanism 만 codify 해요.

## Command

user 에게 다음을 표시하고 명시 승인을 요청 (AskUserQuestion 또는 동등 confirm mechanism):

1. `diff-surface-summary` atom 의 출력 (major surfaces 변경 요약 전체)
2. 실행 예정 publish command preview (예: `npm publish`, `git push --tags`)

## Check

```javascript
// user 응답의 명시성 분류 — 묵시/모호 응답은 승인 미간주
function classifyApprovalResponse(text) {
  const t = text.trim().toLowerCase();
  const APPROVE = ['publish', 'go', '승인', '진행', 'approve', 'ship'];
  const ABORT = ['wait', 'no', '잠깐', 'stop', '중단', 'abort'];
  if (APPROVE.some(k => t === k || t.startsWith(k))) return 'approve';
  if (ABORT.some(k => t === k || t.startsWith(k))) return 'abort';
  return 'ambiguous'; // "ok", "음..." 등 — 승인 아님
}
```

## Decision

```javascript
switch (classifyApprovalResponse(userResponse)) {
  case 'approve':
    // → post-approval-publish-trigger atom 으로 proceed (응답 verbatim 을 audit 용으로 전달)
    return { ok: true, approval: userResponse };
  case 'abort':
    // block + revise loop 으로 복귀 — 추가 변경 요청 반영 후 diff-surface-summary 부터 재진입
    process.exit(2);
  case 'ambiguous':
    // re-prompt — timeout 없음 (user 영역), 자동 진행 절대 금지
    return { ok: false, action: 're-prompt' };
}
```

## Invariants

- 명시 승인 없이 publish-equivalent command 실행 = autonomy boundary violation (AGENTS.md §5.1 gate (a))
- 모호 응답 ("ok", "음...") 은 승인이 아님 — re-prompt
- re-prompt 에 timeout 없음 — 승인 판단은 user 의 phronesis 영역
- user 가 추가 변경 요청 시 abort 처리 + revise loop

## Used By

- mezzo §5.1 PreToolUse hook (bypass condition 의 post-approval flag 설정 지점, v0.2+)
- `greatpractice/micro/post-approval-publish-trigger.md` (본 atom 의 승인 응답이 입력)
