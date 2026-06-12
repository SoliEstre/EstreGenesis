---
id: diff-surface-summary
tier: micro
trigger:
  if: "publish-equivalent command 직전 — parent macro §2.1 EG #1-#8 자동 검증 전부 통과 후"
  then: "major surfaces (README + CHANGELOG + version surfaces + files[]) diff 요약 생성 → N-way sync registry 와 cross-check → 누락 0 이면 user-approval-prompt 로 proceed, 누락 감지 시 block + registry traversal 재실행"
  format: command-check-decision
  source: pre-tool-use-hook
source_evidence:
  - greatpractice/mezzo/pre-publish-user-gate.md §2 (diff-surface-summary row)
  - greatpractice/mezzo/pre-publish-user-gate.md §6 (N-way sync registry traversal 의 terminal-node 전제)
  - AGENTS.md §5.8 N-way sync 등록부
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Diff Surface Summary

> mezzo `pre-publish-user-gate` 의 executable atom #1. publish gate 발동의 전제 조건 — 변경된 major surfaces 의 user-readable diff 요약이에요.

## Command

```javascript
// registrySurfaces: N-way sync 등록부 (AGENTS.md §5.8) 에서 가져온 major surface 경로 배열
// 예: ['README.md', 'CHANGELOG.md', 'docs/index.html', 'docs/shared/data.js', 'package.json']
function buildDiffSurfaceSummary(registrySurfaces) {
  const { execSync } = require('child_process');
  const changed = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  return registrySurfaces.map(path => ({
    path,
    changed: changed.includes(path),
    // user-readable 핵심 1-2줄 (file path + 변경 요약)
    summary: changed.includes(path)
      ? execSync(`git diff HEAD~1 HEAD --stat -- "${path}"`, { encoding: 'utf8' }).trim()
      : '(unchanged)'
  }));
}
```

## Check

```javascript
// summary 가 모든 major surface 를 누락 없이 포함하는지 — registry 와 cross-check
function verifySummaryComplete(summaryRows, registrySurfaces) {
  const covered = new Set(summaryRows.map(r => r.path));
  const missing = registrySurfaces.filter(p => !covered.has(p));
  return { complete: missing.length === 0, missing };
}
```

## Decision

```javascript
const { complete, missing } = verifySummaryComplete(rows, registrySurfaces);
if (!complete) {
  console.error('[diff-surface-summary] BLOCK: registry surface 누락 —', missing.join(', '));
  // parent macro 의 N-way sync registry traversal 재실행 후 본 atom 재진입
  process.exit(2);
}
// complete → user-approval-prompt atom 으로 proceed (summary rows 전달)
return { ok: true, rows };
```

## Invariants

- summary 는 registry 의 모든 행을 포함해야 함 (changed 여부와 무관 — unchanged 도 명시)
- 각 행은 user-readable (file path + 변경 핵심 1-2줄)
- 누락 surface 감지 시 publish 진행 절대 금지 — block 후 registry traversal 재실행

## Used By

- mezzo §5.1 PreToolUse hook (publish-pattern intercept 시 본 atom 호출, v0.2+)
- `greatpractice/micro/user-approval-prompt.md` (본 atom 의 출력이 입력)
