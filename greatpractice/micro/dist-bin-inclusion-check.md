---
id: dist-bin-inclusion-check
tier: micro
trigger:
  if: "package.json files[] 또는 동등 manifest 작성/수정 시점 (publish 직전 dry-run 페어 실행)"
  then: "files[] 에 dist/(빌드 output) + bin/(있는 경우) 명시 → npm publish --dry-run file list 로 포함 확인. dist 누락 → block, bin 필드 존재 + bin 누락 → block, bin 필드 없음 → skip-conditional."
  format: command-check-decision
  source: post-tool-use-hook
source_evidence:
  - greatpractice/mezzo/package-files-validate.md §2 (dist-bin-inclusion-check row)
  - greatpractice/mezzo/package-files-validate.md §5.2 (publish 명령 사전 차단 hook spec)
  - EstreUX 0.4.0 publish (2026-06-05) — npm publish --dry-run 19 files / 118.4KB 사전 검출 → 0 omissions
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: dist / bin Inclusion Check

> mezzo `package-files-validate` 의 executable atom #2. dry-run file list 출력이 inclusion 검증의 ground truth 예요.

## Command

```javascript
// files[] 에 빌드 output + bin 경로 추가 (bin 필드 존재 시에만 bin/)
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const adds = ['dist/'];
if (pkg.bin) adds.push('bin/');
pkg.files = Array.from(new Set([...(pkg.files || []), ...adds]));
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
```

## Check

```bash
# ground truth = dry-run 의 실제 file list (manifest grep 이 아님)
npm publish --dry-run > /tmp/dryrun.out 2>&1
grep -q 'dist/' /tmp/dryrun.out || exit 2          # dist artifact 포함
if node -e "process.exit(require('./package.json').bin ? 0 : 1)"; then
  grep -q 'bin/' /tmp/dryrun.out || exit 3         # bin 필드 존재 시 bin script 포함
fi
```

## Decision

```text
exit 0 (dist + bin 모두 포함, 또는 bin 필드 없음 + dist 포함) → proceed (publish 진행)
exit 2 (dist 누락)                  → block — publish 시 실용성 0
exit 3 (bin 필드 존재 + bin 누락)   → block — CLI 매핑 부재
bin 필드 없음 (라이브러리-only)     → bin check skip-conditional, dist check 만 적용
```

## Invariants

- 검증의 ground truth 는 manifest 텍스트가 아니라 `npm publish --dry-run` 의 file list 출력이에요 (glob 해석 결과 기준)
- parent macro 의 dry-run-smoke-test 항목과 paired execution — publish 명령 직전 게이트
- conditional applicability: public-distribution manifest 에만 적용
