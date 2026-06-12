---
id: markdown-link-absolute-check
tier: micro
trigger:
  if: "public-distribution publish 직전 (dry-run 통과 후, user gate 직전) — README.md / NOTICE / LICENSE 등 외부 렌더링 markdown surface"
  then: "모든 markdown link [text](url) 추출 → 각 url 이 absolute scheme (https?:// / mailto: / tel:) 또는 # anchor 인지 fixed-value regex check → 상대 경로 detected 시 block + 권장 absolute URL 제시"
  format: command-check-decision
  source: pre-publish-gate
source_evidence:
  - greatpractice/mezzo/link-integrity-check.md §2 (micro atom candidate 1행) + §7.2
  - "greatpractice/macro/release-cadence.md §2.1 EG #7"
  - memory/feedback_release_versioning_cadence.md
last_referenced_turn: 2026-06-12T19:50:00Z
class: persistent
---

# Atom: Markdown Link Absolute Check

> mezzo `link-integrity-check` 의 executable atom 1/2. (command + check + decision) 3-tuple.

## Command

```javascript
function extractMarkdownLinks(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  // code block 내부 false-positive 방지: fenced block 제거 후 추출 (mezzo §7.1 권고)
  const stripped = src.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const links = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(stripped)) !== null) links.push({ text: m[1], url: m[2] });
  return links;
}
```

## Check

```javascript
const ABSOLUTE_OK = /^(https?:\/\/|#|mailto:|tel:)/;

function checkLinks(links) {
  return links.filter(l => !ABSOLUTE_OK.test(l.url)); // 위반 (= 상대 경로) 만 반환
}
```

## Decision

```javascript
const violations = checkLinks(extractMarkdownLinks(filePath));
if (violations.length > 0) {
  // 단, # anchor 분류는 ABSOLUTE_OK 가 이미 통과시킴 — 여기 도달한 건 순수 상대 경로.
  // exception 재분류는 atom 2 (internal-anchor-allowance) 가 담당.
  for (const v of violations) {
    console.error(`[markdown-link-absolute-check] BLOCK: ${filePath} — [${v.text}](${v.url})`);
    console.error(`  권장: https://github.com/SoliEstre/EstreGenesis/blob/main/${v.url.replace(/^\.\//, '')}`);
  }
  process.exit(2); // publish 차단
}
// 위반 0 건 → proceed to next pre-publish item
```

## Invariants

- 검증 대상 = mezzo §3 applicable 표의 ✅ 행만 (npm files[] / 외부 레지스트리 렌더링 동반 surface)
- url 이 `^(https?://|#|mailto:|tel:)` 미매치 = 상대 경로 = block (exit 2)
- fenced/inline code block 내부 link-like 문자열은 추출 대상에서 제외 (false-positive 방지)
- block 시 위반 link 목록 + 절대 경로 권장 URL 을 반드시 함께 출력

## Used By

- mezzo `link-integrity-check` §5 PreToolUse hook spec (npm publish / pip upload 직전 차단)
