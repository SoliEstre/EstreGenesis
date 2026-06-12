---
id: dry-run-file-list-review
tier: micro
trigger:
  if: "package publish 직전 (npm/pip/cargo/등) — preceding 9-item checklist 전부 pass 후"
  then: "run `npm publish --dry-run` (or ecosystem equivalent) → verify exit 0 + file list == files[] whitelist + size within expected range + 0 unexpected items → proceed/block/escalate/skip-conditional"
  format: command-check-decision
  source: "cross-axis-inheritance (hook candidate: pre-publish-dry-run-gate PreToolUse, v0.2+)"
source_evidence:
  - greatpractice/mezzo/dry-run-smoke-test.md §2 (micro atom row 1 — dry-run-file-list-review)
  - greatpractice/mezzo/dry-run-smoke-test.md §6 (files[] ground truth = mezzo package-files-validate)
  - greatpractice/mezzo/dry-run-smoke-test.md §1 (EstreUX 0.4.0 instance — 19 files / 118.4KB 사전 확인)
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Dry-Run File List Review

> mezzo `dry-run-smoke-test` 의 executable atom 1/2. Publish 명령 실행 전, 실제 packaged 될 파일 list + 총 크기를 dry-run 으로 사전 출력해 files[] 화이트리스트와 대조하는 final-gate atom 이에요.

## Command

```bash
# npm (대표) — 다른 ecosystem 은 동등 명령으로 치환:
#   pip:   pip wheel . && unzip -l dist/*.whl
#   cargo: cargo package --list
npm publish --dry-run 2>&1 | tee /tmp/dryrun-output.txt
echo "exit=$?"
```

## Check

```javascript
// node check — npm pack --dry-run --json 으로 기계 판독 가능한 동일 file list 획득
const { execSync } = require('child_process');
const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
const [report] = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8' }));
const files = report.files.map(f => f.path);

const UNEXPECTED = /(^|\/)(\.DS_Store|node_modules\/|test\/fixtures\/|\.env|.*\.pem|.*\.key)$/;
const checks = {
  // (a) exit 0 — execSync 가 throw 하지 않았으면 통과
  exit0: true,
  // (b) 모든 파일이 files[] 화이트리스트 (+ npm 자동 포함분) 범위 내
  whitelistMatch: files.every(f =>
    /^(package\.json|README(\..*)?|LICENSE(\..*)?|NOTICE(\..*)?)$/i.test(f) ||
    (pkg.files || []).some(w => f === w || f.startsWith(w.replace(/\/?$/, '/')))),
  // (c) 총 크기 예상 범위 — PREV_SIZE_BYTES = 직전 release 크기 (수동 기입)
  sizeInRange: report.size <= Number(process.env.PREV_SIZE_BYTES || Infinity) * 2,
  // (d) 의외 항목 0건
  noUnexpected: files.filter(f => UNEXPECTED.test(f)).length === 0,
};
console.log(JSON.stringify({ checks, fileCount: files.length, size: report.size }, null, 2));
```

## Decision

```javascript
if (!checks.exit0 || !checks.whitelistMatch || !checks.noUnexpected) {
  // BLOCK: files[] 또는 .npmignore 수정 후 dry-run 재실행
  console.error('[dry-run-file-list-review] BLOCK: unexpected/off-whitelist item or dry-run failure');
  process.exit(2);
}
if (!checks.sizeInRange) {
  // ESCALATE: 크기가 직전 release ×2 초과 — user gate
  console.error('[dry-run-file-list-review] ESCALATE: size > prev ×2 — user review required');
  process.exit(3);
}
// skip-conditional: package manifest 없는 source-only release 는 본 atom 자체가 N/A (실행 전 분기)
console.log('[dry-run-file-list-review] PROCEED');
```

## Invariants

- 본 atom 은 preceding checklist (특히 mezzo `package-files-validate` 의 files[] 화이트리스트) pass 를 전제 — files[] 가 ground truth 예요.
- PROCEED 후에만 atom 2 (`smoke-import-invoke-exit0`) 로 진행.
- BLOCK 해소 후에는 dry-run 부터 재실행 (수정 후 stale 출력 재사용 금지).

## Used By

- (v0.2+) `pre-publish-dry-run-gate` PreToolUse hook — mezzo §5 spec candidate
