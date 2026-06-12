---
id: readme-current-line-sync
tier: micro
trigger:
  if: "README.md badge version 라인 또는 Current/현재 라인 변경 시점"
  then: "badge + Current(EN) + 현재(KO) 3개 라인을 같은 version 으로 fixed-value 동기 갱신 → old grep 0건 + new grep ≥3 확인. stale 잔존 시 block."
  format: command-check-decision
  source: pre-commit
source_evidence:
  - "greatpractice/mezzo/n-way-sync-registry.md §2 atom #3"
  - greatpractice/mezzo/n-way-sync-registry.md §1 (EstreUX 0.3.0 publish incident — README stale 이 omissions 중 하나)
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: README Current Line Sync

> mezzo `n-way-sync-registry` 의 executable atom #3. (command + check + decision) 3-tuple.

## Command

README.md 의 version 표면 3개를 같은 commit 안에 같은 version 으로 갱신해요:

1. badge version 라인 (`img.shields.io/badge/version-...`)
2. `**Current**:` EN 표기 라인
3. `**현재**:` KO 표기 라인

## Check

```bash
OLD="v2.5.88"   # 직전 cut 버전
NEW="v2.5.89"   # 본 cut 버전

# 1) stale 0건
test "$(grep -cF "$OLD" README.md)" -eq 0

# 2) 신규 version ≥ 3 hits (badge + Current EN + 현재 KO)
test "$(grep -cF "$NEW" README.md)" -ge 3
```

## Decision

- **proceed** — new ≥ 3 hits + old 0건.
- **block** — stale 잔존 또는 hits < 3: 잔존/누락 위치를 라인 번호로 명시하고 갱신을 요구한 뒤 재검증해요.

## Invariants

- 3개 표면의 version 문자열은 byte-for-byte 동일해야 해요 (fixed-value).
- hit-count threshold(≥3) 는 표면이 추가되면 함께 올라가야 해요 — README 에 version-bearing 라인이 추가되면 본 atom 의 Check 상수도 같은 commit 에 갱신.
