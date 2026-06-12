---
id: bin-file-exists-check
tier: micro
trigger:
  if: "bin-path-prefix-strip pass 직후, npm publish (또는 --dry-run) 실행 직전"
  then: "각 bin 경로 repo root 기준 fs.existsSync 확인 + publish artifact (files[] 또는 dry-run file list) 포함 확인 — 둘 다 통과해야 publish proceed; 실패 시 block + fix-then-retry."
  format: command-check-decision
  source: post-tool-use-hook
source_evidence:
  - greatpractice/mezzo/bin-entry-validate.md §2 (bin-file-exists-check 행) + §5.2 PostToolUse hook spec
  - greatpractice/mezzo/bin-entry-validate.md §1 surface 2 — bin 경로 file 미포함 시 install 후 CLI 호출 ENOENT
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Bin File Exists Check

> mezzo `bin-entry-validate` 의 executable atom #2. (command + check + decision) 3-tuple. `bin-path-prefix-strip` pass 후 sequential 진입.

## Command

```shell
# publish artifact file list 확보 (bin path 포함 여부 확인용)
npm publish --dry-run 2>&1
```

## Check

```javascript
// (a) repo root 기준 file 실존 + (b) publish artifact 포함
function checkBinFilesExist(pkg, repoRoot, dryRunFileList) {
  const missing = Object.entries(pkg.bin || {}).filter(
    ([, p]) => !fs.existsSync(path.resolve(repoRoot, p))
  );
  const excluded = Object.entries(pkg.bin || {}).filter(
    ([, p]) => !dryRunFileList.includes(p)
  );
  return { ok: missing.length === 0 && excluded.length === 0, missing, excluded };
}
```

## Decision

```javascript
const { ok, missing, excluded } = checkBinFilesExist(pkg, repoRoot, dryRunFileList);
if (!ok) {
  if (missing.length) console.error('[bin-file-exists-check] FAIL: file 미존재 →', missing.map(([n, p]) => p).join(', '));
  if (excluded.length) console.error('[bin-file-exists-check] FAIL: artifact 미포함 →', excluded.map(([n, p]) => p).join(', '));
  process.exit(2); // block publish + fix (files[] 추가 or build 산출물 path 수정 or bin 경로 정정)
}
// pass → bin 검증 완료, parent macro §2.1 EG #6 통과 → #7 (link-integrity) 진입
```

## Invariants

- 모든 bin 경로는 repo root 기준 resolve 시 실존 file
- 모든 bin 경로는 publish artifact file list (files[] 화이트리스트 또는 dry-run output) 에 등장
- bin 필드 없으면 (library-only package) skip-conditional
- Failure → `exit(2)` (block publish — fix 경로: files[] 추가 / build path 수정 / bin 경로 정정)

## Used By

- greatpractice/mezzo/bin-entry-validate.md §5.2 PostToolUse hook `bin-file-exists-gate` (v0.2.1 구현 예정)
