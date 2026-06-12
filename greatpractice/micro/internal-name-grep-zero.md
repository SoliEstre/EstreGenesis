---
id: internal-name-grep-zero
tier: micro
trigger:
  if: "public-distribution publish 명령 직전 (npm publish / pip upload / git push --tags to public remote)"
  then: "internal-name blocklist SSoT load → 코드 (src/, dist/, lib/) + 문서 (*.md, *.html, README, package.json description) 전체 grep → 총 hit count 산출 → 0 이면 publish proceed, 1+ 이면 publish block + redact-then-recheck-loop 진입. exit 2 on block."
  format: command-check-decision
  source: pre-tool-use-hook
source_evidence:
  - greatpractice/mezzo/naming-hygiene-grep.md §2 (표 1행) + §5.1
  - "greatpractice/macro/release-cadence.md §2.2 EG #10 (Hub ⑥ naming)"
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Internal-Name Grep Zero-Hit Gate

> mezzo `naming-hygiene-grep` §2 표 1행의 executable atom. (command + check + decision) 3-tuple — fixed-value rule, judgement 0 이에요.

## Command

```bash
# blocklist SSoT (mezzo §5.1 Stage 1 — 미존재 시 본 atom 발화 불가 → 먼저 SSoT 정의)
BLOCKLIST=".greatpractice/blocklist/internal-names.txt"
[ -f "$BLOCKLIST" ] || { echo "[internal-name-grep-zero] FAIL: blocklist SSoT missing"; exit 2; }

# 코드 + 문서 cross-surface grep (blocklist 모든 항목 동시)
HITS=$(grep -rInF -f "$BLOCKLIST" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --include='*.js' --include='*.cjs' --include='*.mjs' --include='*.ts' \
  --include='*.md' --include='*.html' --include='*.json' \
  . 2>/dev/null | tee /tmp/internal-name-hits.txt | wc -l)
echo "hits=$HITS"
```

## Check

```bash
# zero-hit fixed-value gate: 모든 blocklist 항목이 동시에 0건이어야 통과예요
[ "$HITS" -eq 0 ]
```

## Decision

```bash
if [ "$HITS" -eq 0 ]; then
  echo "[internal-name-grep-zero] PASS: publish proceed"
  exit 0
else
  echo "[internal-name-grep-zero] BLOCK: ${HITS} hit(s) — see /tmp/internal-name-hits.txt"
  echo "→ greatpractice/micro/redact-then-recheck-loop.md 진입"
  exit 2
fi
```

## Invariants

- Conditional applicability: public-distribution surface 만 발화 (private repo / internal-only release 는 skip — mezzo §2 표)
- blocklist SSoT 부재 = FAIL (silent pass 금지 — false-negative 방지)
- hit count 는 *모든 항목 합산* — 단일 항목이라도 1+ 이면 block
- Block → `exit(2)` (publish 명령 차단, recovery 는 `redact-then-recheck-loop` 로 위임)

## Used By

- mezzo §5.1 PreToolUse hook (v0.2+ 구현 예정) 의 1단계 logic
