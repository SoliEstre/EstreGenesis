---
id: version-bump-all-surfaces
tier: micro
trigger:
  if: "release cut 중 첫 version field 변경 staged (예: README badge 라인 또는 package.json \"version\" 첫 bump)"
  then: "AGENTS.md §5.8 등록부 traversal — 해당 axis 의 모든 surface 를 같은 commit 에 fixed-value 동시 갱신 → stale grep 0건 + staged path 전수 확인. 부분 누락 시 block."
  format: command-check-decision
  source: deterministic-verify
source_evidence:
  - "greatpractice/mezzo/n-way-sync-registry.md §2 atom #1 + §5.0 (결정론적 verify — v2.5.62 Hyperbrief plugin.json/renderers stale MISS 의 enforcement 교훈)"
  - AGENTS.md §5.8 N-way sync 등록부 (axis-별 surface 집합의 SSoT)
  - memory/feedback_release_versioning_cadence.md (phase_3 16+ docs/promo sync miss)
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Version Bump All Surfaces

> mezzo `n-way-sync-registry` 의 executable atom #1. (command + check + decision) 3-tuple.

## Command

```bash
# AGENTS.md §5.8 등록부의 해당 axis surface 전부를 같은 commit 에 fixed-value 동시 갱신해요.
# axis = "같은 버전 문자열을 공유해야 하는 표면 집합" — axis 를 잘못 묶으면 false-positive (mezzo §5.0).

# EG 릴리스 버전 axis (현 등록부 기준):
SURFACES="README.md docs/index.html docs/shared/data.js CHANGELOG.md"

# Hyperbrief 모듈 버전 axis (해당 cut 일 때만 추가):
# Hyperbrief.md plugins/hyperbrief/.claude-plugin/plugin.json \
# plugins/hyperbrief/renderers/package.json plugins/hyperbrief/mcp/package.json \
# .claude-plugin/marketplace.json docs/hyperbrief.html docs/index.html
```

## Check

```bash
OLD="v2.5.88"   # 직전 cut 버전
NEW="v2.5.89"   # 본 cut 버전

# 1) stale path 0건 — old version 이 axis surface 어디에도 잔존하지 않아야 해요
grep -lF "$OLD" $SURFACES          # 출력 0건이어야 함

# 2) staged 전수 — axis 의 모든 surface path 가 같은 commit 에 포함되어야 해요
git diff --cached --name-only      # SURFACES 의 모든 path 포함 확인

# 3) 결정론적 verify (수동 grep 의 skippable 함정 차단, mezzo §5.0 패턴):
#    axis 별로 각 표면의 버전 문자열을 read → 일치 assert → 불일치 시 목록 + exit 1.
#    EG 는 운영측 verify 스크립트로 기계화 — release cut 직후 반드시 실행.
```

## Decision

- **proceed** — stale 0건 + axis 의 모든 surface staged + 결정론적 verify exit 0.
- **block** — 부분 누락: 누락 path 를 명시하고 추가 stage 를 요구한 뒤 재검증해요. commit/push 진행 금지.
- **escalate** — 등록부 자체 stale 의심 (version-bearing 새 surface 가 존재하는데 §5.8 에 미등재): 등록부 row 갱신을 먼저 처리해요.

## Invariants

- axis 내 모든 surface 의 버전 문자열은 byte-for-byte 동일해야 해요 (fixed-value).
- Check 는 *수행 의존이면 무효* — practice 존재 ≠ enforcement (mezzo §5.0 v2.5.62 MISS 교훈). cut 직후 결정론적 verify 실행이 closure 조건.
- 다른 모듈의 별개 axis (예: 독립 버전 트랙) 를 같은 axis 로 묶지 않아요 — false-positive 원천.
