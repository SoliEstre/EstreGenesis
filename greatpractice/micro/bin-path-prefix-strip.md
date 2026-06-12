---
id: bin-path-prefix-strip
tier: micro
trigger:
  if: "package.json bin 필드 작성/변경 (CLI tool 배포 package)"
  then: "bin 값 전수에 /^\\.\\// 정규식 lint — 매칭 시 ./prefix 제거 후 retry, 통과 시 bin-file-exists-check 진입. fail 상태로 publish proceed 금지."
  format: command-check-decision
  source: pre-tool-use-hook
source_evidence:
  - greatpractice/mezzo/bin-entry-validate.md §2 (bin-path-prefix-strip 행) + §5.1 PreToolUse hook spec
  - EstreUX 0.3.0 publish incident (2026-06-04) — ./prefix → npm 이 CLI 매핑 조용히 제거, publish 성공 but 명령 인식 실패
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Bin Path Prefix Strip

> mezzo `bin-entry-validate` 의 executable atom #1. (command + check + decision) 3-tuple.

## Command

```javascript
// package.json bin 값에서 ./ 접두 제거
function stripBinPrefix(pkg) {
  for (const [name, p] of Object.entries(pkg.bin || {})) {
    if (p.startsWith('./')) pkg.bin[name] = p.slice(2);
  }
  return pkg;
}
```

## Check

```javascript
// ./prefix 잔존 여부 lint — 정규식 /^\.\// 매칭 시 fail
function checkNoBinPrefix(pkg) {
  const bad = Object.entries(pkg.bin || {}).filter(([, p]) => /^\.\//.test(p));
  return { ok: bad.length === 0, bad };
}
```

## Decision

```javascript
const { ok, bad } = checkNoBinPrefix(pkg);
if (!ok) {
  console.error('[bin-path-prefix-strip] FAIL: ./prefix 잔존 →', bad.map(([n, p]) => `${n}: ${p}`).join(', '));
  process.exit(2); // block publish + fix-then-retry
}
// pass → bin-file-exists-check 진입
```

## Invariants

- `bin` 필드의 모든 값은 `./` 접두 없는 relative path
- bin 필드 자체가 없으면 (library-only package) 본 atom 전체 skip-conditional
- fail 상태에서 publish proceed 금지 — fix-then-retry 만 허용

## Used By

- greatpractice/mezzo/bin-entry-validate.md §5.1 PreToolUse hook `bin-path-prefix-lint` (v0.2.0 구현 예정)
