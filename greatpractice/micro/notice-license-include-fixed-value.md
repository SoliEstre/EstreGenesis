---
id: notice-license-include-fixed-value
tier: micro
trigger:
  if: "package.json files[] 또는 동등 manifest (MANIFEST.in / Cargo.toml include) 작성/수정 시점"
  then: "files[] 에 \"NOTICE\" + \"LICENSE\" 두 항목 fixed-value 존재 확인 + repo root 파일 실존 확인. 매치 누락 → block + 사용자 escalation, 파일 부재 → block + 라이선스 결정 escalation."
  format: command-check-decision
  source: pre-tool-use-hook
source_evidence:
  - greatpractice/mezzo/package-files-validate.md §2 (notice-license-include-fixed-value row)
  - greatpractice/mezzo/package-files-validate.md §5.1 (PreToolUse hook spec)
  - EstreUX 0.3.0 publish incident (2026-06-04) — files[] NOTICE/LICENSE 누락 → npm tarball NOTICE 부재 + 링크 깨짐
  - EstreUX 0.4.0 publish (2026-06-05) — post-codify N=1, files[] 명시 + NOTICE 378B 사전 검출 → 0 omissions
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: NOTICE / LICENSE Include Fixed-Value

> mezzo `package-files-validate` 의 executable atom #1. inclusion 화이트리스트는 explicit-or-omit — 명시 안 한 파일은 publish 에서 빠져요.

## Command

```javascript
// files[] 에 NOTICE + LICENSE 두 항목 fixed-value 강제 (이미 있으면 no-op)
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.files = Array.from(new Set([...(pkg.files || []), 'NOTICE', 'LICENSE']));
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
```

## Check

```bash
# 1. manifest 매치 — 두 항목 모두 explicit 명시
grep -q '"NOTICE"' package.json && grep -q '"LICENSE"' package.json || exit 2
# 2. repo root 파일 실존
test -f NOTICE && test -f LICENSE || exit 3
```

## Decision

```text
exit 0 (매치 + 실존 모두 통과)  → proceed (publish path 계속)
exit 2 (manifest 매치 누락)     → block + 사용자 escalation — fixed-value inject 옵션 제시
exit 3 (NOTICE/LICENSE 파일 부재) → block + 라이선스 결정 escalation (Apache-2.0 NOTICE = legal-killer)
```

## Invariants

- `files[]` 화이트리스트 manifest 에서 NOTICE / LICENSE 는 fixed-value — glob 에 의존하지 않고 literal 항목으로 존재해야 해요
- Apache-2.0 사용 시 NOTICE 누락 = license 의무 위반 가능성 → 어떤 분기에서도 silent-skip 금지
- conditional applicability: public-distribution manifest 에만 적용 (git-only consumption / internal workspace package 는 skip)
