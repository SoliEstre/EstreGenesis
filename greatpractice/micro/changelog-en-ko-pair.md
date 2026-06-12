---
id: changelog-en-ko-pair
tier: micro
trigger:
  if: "CHANGELOG.md 신규 version entry 작성 시점"
  then: "EN section + KO section 양쪽에 같은 version heading + 같은 dense 1줄 요약(언어만 다름) 동시 추가 → 양쪽 grep 각 ≥1 확인. 한쪽만 작성 시 block."
  format: command-check-decision
  source: pre-commit
source_evidence:
  - "greatpractice/mezzo/n-way-sync-registry.md §2 atom #2"
  - memory/feedback_release_versioning_cadence.md (CHANGELOG 항목 부분 누락 누적)
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Changelog EN-KO Pair

> mezzo `n-way-sync-registry` 의 executable atom #2. (command + check + decision) 3-tuple.

## Command

CHANGELOG.md 의 EN section 과 KO section *양쪽* 에 같은 version 의 신규 entry 를 동시에 추가해요 — 같은 version 문자열 + 같은 날짜 + 같은 dense 1줄 변경 요약 (언어만 다름).

## Check

```bash
NEW="v2.5.89"

# KO section 시작 라인 (anchor 기준 분할)
KO_START=$(grep -n '<a id="한국어">' CHANGELOG.md | cut -d: -f1)

# EN side: anchor 이전 구간에 신규 heading ≥ 1
head -n "$KO_START" CHANGELOG.md | grep -cF "**$NEW**"   # ≥ 1 이어야 함

# KO side: anchor 이후 구간에 신규 heading ≥ 1
tail -n +"$KO_START" CHANGELOG.md | grep -cF "**$NEW**"  # ≥ 1 이어야 함
```

## Decision

- **proceed** — EN + KO 양쪽 모두 신규 version heading 존재 (각 ≥1).
- **block** — 한쪽만 작성된 단편 commit: 누락쪽 section 에 entry 추가를 요구한 뒤 재검증해요.
- **skip-conditional** — 해당 cut 이 CHANGELOG 자체를 작성하지 않기로 결정된 internal maint 패치일 때만 skip — 이때도 한쪽만 쓰는 건 허용되지 않아요 (양쪽 다 쓰거나 양쪽 다 안 쓰거나).

## Invariants

- EN entry 와 KO entry 의 version 문자열 + 날짜는 byte-for-byte 동일해야 해요.
- EN-only / KO-only 단편 상태로 commit 이 통과하면 안 돼요 — 외부 독자 한쪽 언어권이 stale 인상을 받는 surface drift 예요.
