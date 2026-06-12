---
id: redact-then-recheck-loop
tier: micro
trigger:
  if: "internal-name-grep-zero gate 에서 1+ hit 발견 (publish blocked 상태)"
  then: "발견 위치별 redact (rename / placeholder 치환 / 비공개 처리) → commit → grep 재실행 → 0건 연속 달성까지 loop. 연속 0건 → proceed, 반복 미달 (blocklist vs 의도된 사용 충돌) → pre-publish-user-gate 로 escalate."
  format: command-check-decision
  source: pre-tool-use-hook
source_evidence:
  - greatpractice/mezzo/naming-hygiene-grep.md §2 (표 2행) + §5.1 block-then-retry path
  - greatpractice/mezzo/naming-hygiene-grep.md §7.1 (false-positive escalation 경로)
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Redact-Then-Recheck Loop

> mezzo `naming-hygiene-grep` §2 표 2행의 executable atom. `internal-name-grep-zero` block path 의 recovery loop 예요 — clean signal until zero.

## Command

hit 목록 (`/tmp/internal-name-hits.txt`) 의 각 위치별로 redact 를 수행해요 — 기계 규칙:

1. 코드 식별자 → 중립 이름으로 rename
2. 문서 언급 → placeholder (`<service>`, `<deployment>`) 치환
3. 파일 자체가 비공개 대상 → 공개 surface 에서 제거 (.npmignore / gitignore / 파일 이동)

redact 완료 후 commit + grep 재실행:

```bash
git add -A && git commit -m "chore: redact internal names pre-publish"
BLOCKLIST=".greatpractice/blocklist/internal-names.txt"
HITS=$(grep -rInF -f "$BLOCKLIST" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --include='*.js' --include='*.cjs' --include='*.mjs' --include='*.ts' \
  --include='*.md' --include='*.html' --include='*.json' \
  . 2>/dev/null | wc -l)
echo "hits=$HITS"
```

## Check

```bash
# 1회 통과만으로 부족 — commit 후 재grep 으로 *연속* 0건 달성해야 통과예요 (mezzo §2 표 2행)
# loop invariant: 직전 iteration HITS_PREV 와 이번 HITS 가 모두 0
[ "$HITS" -eq 0 ] && [ "${HITS_PREV:-1}" -eq 0 ]
```

## Decision

```bash
MAX_ITER=5
if [ "$HITS" -eq 0 ] && [ "${HITS_PREV:-1}" -eq 0 ]; then
  echo "[redact-then-recheck-loop] PASS: 연속 0건 — internal-name-grep-zero proceed path 합류"
  exit 0
elif [ "$ITER" -ge "$MAX_ITER" ]; then
  echo "[redact-then-recheck-loop] ESCALATE: ${MAX_ITER}회 반복 후에도 0건 미달"
  echo "→ blocklist 항목 vs 의도된 사용 충돌 — pre-publish-user-gate (user 결정 영역) 로 escalate"
  exit 2
else
  HITS_PREV=$HITS; ITER=$((ITER + 1))
  echo "[redact-then-recheck-loop] CONTINUE: iteration ${ITER}, hits=${HITS} — redact 후 재grep"
fi
```

## Invariants

- redact 없이 grep 만 재실행하는 iteration 금지 — 매 iteration 에 최소 1건 redact 또는 escalate
- 연속 0건 (commit 사이에 둔 2회 grep) 이 통과 조건 — 1회 0건은 false-negative 방지 차원에서 불충분
- escalation 은 silent skip 이 아니라 `pre-publish-user-gate` 의 user 결정으로 surface (mezzo §7.1)
- publish 는 본 loop 통과 전까지 계속 blocked 상태 유지

## Used By

- mezzo §5.1 PreToolUse hook (v0.2+ 구현 예정) 의 block-then-retry path
- `greatpractice/micro/internal-name-grep-zero.md` 의 block decision 분기 대상
