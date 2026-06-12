---
id: internal-anchor-allowance
tier: micro
trigger:
  if: "markdown-link-absolute-check 의 block 분기 도달 — url 이 # prefix same-doc anchor 인 경우의 exception 분류 시점"
  then: "# 로 시작 AND 현재 파일 내부 heading 의 GitHub-style slug (lowercase + hyphenated) 와 매치 시 skip-conditional (block override, proceed); 미충족 시 원래 block 유지"
  format: command-check-decision
  source: pre-publish-gate
source_evidence:
  - greatpractice/mezzo/link-integrity-check.md §2 (micro atom candidate 2행) + §7.2
  - "greatpractice/macro/release-cadence.md §2.1 EG #7"
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Internal Anchor Allowance

> mezzo `link-integrity-check` 의 executable atom 2/2. atom 1 (`markdown-link-absolute-check`) 의 exception branch — same-doc anchor 허용 rule 이에요.

## Command

```javascript
function githubSlug(heading) {
  // GitHub-style slug: lowercase + 공백→hyphen + 비-단어문자 제거
  return heading.trim().toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-');
}

function collectHeadingSlugs(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const slugs = new Set();
  for (const m of src.matchAll(/^#{1,6}\s+(.+)$/gm)) slugs.add(githubSlug(m[1]));
  return slugs;
}
```

## Check

```javascript
function isAllowedAnchor(url, filePath) {
  if (!url.startsWith('#')) return false;            // (a) # prefix 필수
  const slugs = collectHeadingSlugs(filePath);
  return slugs.has(url.slice(1).toLowerCase());      // (b) 현재 파일 내부 heading slug 매치
}
```

## Decision

```javascript
if (isAllowedAnchor(link.url, filePath)) {
  // (a)+(b) 충족 → skip-conditional: markdown-link-absolute-check 의 block 을 override
  return { ok: true, exception: 'same-doc-anchor' };
}
// 미충족 (dangling anchor 또는 # 아님) → 원래 block 유지
console.error(`[internal-anchor-allowance] BLOCK 유지: ${filePath} — (${link.url}) 매치되는 heading 없음`);
process.exit(2);
```

## Invariants

- exception 허용 조건은 (a) `#` 시작 AND (b) same-doc heading slug 매치 — 둘 다 충족해야만 override
- cross-doc relative + anchor (예: `./other.md#section`) 는 exception 아님 — atom 1 의 block 대상
- dangling anchor (# 이지만 매치 heading 없음) 는 block 유지 (silent pass 금지)

## Used By

- mezzo `link-integrity-check` §5 PreToolUse hook spec — atom 1 과 chain (atom 1 block 분기 → atom 2 exception 분류)
