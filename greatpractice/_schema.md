<!-- spec: greatpractice/entry-frontmatter; layer: practice-codification/governance; part-of: Greatpractice v0.3.0; status: v0.1 lint scope = 7 mandatory fields, 6-cycle migration grace; canonical: Greatpractice.md §3 -->

# `greatpractice/_schema.md` — Entry Frontmatter Spec (v0.1.0)

> 본 문서는 `greatpractice/{macro,mezzo,micro}/*.md` 각 entry 의 YAML frontmatter 스키마 의 *최소 정합 spec* 이에요. 완전한 정의·근거·tier-conditional rule 은 `Greatpractice.md §3` 이 SSoT. 본 파일은 lint runtime 이 직접 참조하는 운영용 요약본이에요.

---

## 1. v0.1 lint scope (block 7 mandatory + warn extended)

### 1.1 `BLOCK` (lint exit 2) — 7 mandatory fields

모든 tier 에서 누락 시 `eg_greatpractice_lint.cjs` 가 exit 2 + error.

| Field | Type | Domain | 근거 |
|---|---|---|---|
| `id` | string | kebab-case slug | entry identification |
| `tier` | enum | `macro` \| `mezzo` \| `micro` | tier-conditional loading |
| `binding` | enum | `ratio` \| `obiter` \| `illustration` | humanities §1.1 Stare Decisis — binding rule vs advisory commentary vs example |
| `enforcement_level` | enum | `mandatory` \| `recommended` \| `advisory` | management §1.10 — exit 2 vs warning vs inject only |
| `trigger` | object | `{if, then, format, source}` | psychology §1.8 — format 자체 효과 d≈0.65 |
| `lifecycle` | enum | `probation` \| `consolidation` \| `automatic` | psychology §1.10 Lally 66-day model |
| `last_referenced_turn` | ISO-8601 | UTC datetime | os §1.1 Denning backward-window |

### 1.2 `WARN` (lint warning, 6-cycle grace) — extended fields

`Greatpractice.md §3.2` 전체 YAML example 의 나머지 field. 누락 시 warning + grace period 카운터 누적. v0.1 grace = 6 cycle (= 6 commits since entry creation OR 6 weeks, whichever sooner). Grace 만료 후 grace lapsed state 진입 — lint promote to `BLOCK` per-entry.

핵심 warn fields: `title`, `slug`, `created_at`, `source_evidence[]`, `evidence_quality`, `recommendation_strength`, `maturity_score{}`, `last_validated_at`, `validation_cadence_days`, `freshness_until`, `freshness_inherits_from`, `coherence`, `edit_policy`, `owner` (if owned), `audit_trail[]`, `supersedes[]`, `superseded_by`, `kaizen_baseline_since`, `revision_history[]`, `surfaces[]`, `phronesis_boundary`, `class`, `status` (v0.3.0 retire 축 — `active`(default)|`probation`|`retired`, Greatpractice.md §7.7), `retire_reason` (status=retired 시 의무).

### 1.3 `SILENT` (micro-permissive mode) — 4 fields only

`tier: micro` 인 atom 은 위 7 BLOCK 중 `binding` + `enforcement_level` + `lifecycle` + `last_referenced_turn` 누락이 warning 도 아닌 silent. 단 `id` + `tier` + `trigger` + `source_evidence[]` 4 field 는 micro 에서도 BLOCK. 근거: runbook atom = command/check/decision (sre §1.1) — governance metadata 부재가 *기본 상태* 라야 atom 비대화 회피.

---

## 2. Tier-conditional required fields

`Greatpractice.md §3.3` 의 tier 별 schema 강도 표 참조. 요약:

| Tier | BLOCK 추가 | WARN 추가 | 권장 분량 |
|---|---|---|---|
| micro | (위 SILENT permissive) | (없음) | ≤30 줄 |
| mezzo | (BLOCK 7 전체) | `evidence_quality`, `recommendation_strength`, `surfaces[]`, `edit_policy`, `owner` | 80-200 줄 |
| macro | mezzo + `parent` 또는 root marker, `children[]`, `telos_alignment`, `coherence: strict` (default) | mezzo 전체 | 100-300 줄 |

---

## 3. v0.2+ deferred fields

placeholder 로 v0.1 entry 에 `null` 또는 `0` 으로 둠 — v0.2 활성화 시 lint 가 warn 으로 promote.

- `hash`: BLAKE3(canonical_body) — memoization §1.8 content-addressed identity
- `deps[]`: 의존 entry hash 목록 — memoization §1.4 dependency-tracked invalidation
- `rrpv`: 0-3 — processor §1.7 RRIP
- `miss_count{compulsory, capacity, conflict, coherence}` — processor §3.8 3C grid

---

## 4. SSoT reference

본 spec 의 *완전한 정의* 는 항상 `Greatpractice.md §3` 가 정본. 본 파일과 mismatch 시 spec 본문이 우선해요 (§7.5 freshness 상속 — derived surface 가 master 의 정의를 상속).

본 파일은 lint runtime (`plugins/greatpractice/runtime/eg_greatpractice_lint.cjs`) 이 직접 참조 — schema 변경 시 본 파일 update + `plugins/greatpractice/schemas/entry-frontmatter.schema.json` 동시 update (N-way sync).
