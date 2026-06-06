---
# === v0.1 lint-required ===
id: link-integrity-check
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "public-distribution package (npm / PyPI / homebrew / 등 외부 렌더링 페이지 동반) publish 직전 — README + NOTICE + LICENSE 의 markdown link 가 포함된 surface"
  then: "모든 markdown link 가 절대 경로 (GitHub absolute URL 또는 외부 https://) 인지 검증 — 상대 경로 발견 시 차단 + 예외 (# anchor + same-doc relative) 만 허용"
  format: command-check-decision
  source: cross-axis-inheritance

lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Link Integrity Check — README/NOTICE/LICENSE 절대 경로 검증
slug: link-integrity-check
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - "greatpractice/macro/release-cadence.md §2.1 EG #7 — README/NOTICE/LICENSE link integrity (publish 직전 npm 페이지 렌더링 가정 시 모든 링크 valid / 절대 경로 / GitHub absolute URL — 상대 경로는 npm 렌더 시 깨짐)"
  - "EG phase_3 cycle docs/promo sync miss observations — link breakage 관찰 (상대 경로 surface 가 외부 렌더링 페이지에서 broken)"
  - "hub release.md (cd5e6be) — EG-add 항목으로 link integrity 명시 (hub 9-item core 외 EG-side 일반화 시 추가된 surface)"
  - "memory/feedback_release_versioning_cadence.md — N-way sync 누락 패턴의 한 부분으로 link integrity 인접"
  - "reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight-checklist — pre-publish artifact validation)"

evidence_quality: medium
recommendation_strength: SHOULD

maturity_score:
  frequency: 3
  depth: 3
  recency: 4
  cost: 4
  predictability: 5
  # sum: 19/25 ≥ 18 threshold ✓
  # parent 23/25 inherit base; own delta: frequency -2 (link breakage 가 release 마다 발생하지 않고 surface 가 markdown link 포함 시에만 conditional), depth -1 (단일 표면 카테고리 — markdown link 만), cost -1 (npm 렌더 broken link 가 첫인상 손상이지만 unpublish-tier cost 미만), predictability +1 (fixed-value regex check 로 기계화 완전 가능)

last_validated_at: 2026-06-06T00:00:00Z
validation_cadence_days: 180
freshness_until: 2026-12-03T00:00:00Z
freshness_inherits_from: greatpractice/macro/release-cadence

coherence: soft
edit_policy: owned
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-06T00:00:00Z, agent: claude-opus-4-7, action: create, prev_hash: null}
  - {ts: 2026-06-06T00:00:00Z, agent: claude-opus-4-7, action: ratify, prev_hash: null}

supersedes: []
superseded_by: null
revision_history:
  - {ts: 2026-06-06T00:00:00Z, type: created, by: claude-opus-4-7, cost_tier: null}
  - {ts: 2026-06-06T00:00:00Z, type: ratify, by: claude-opus-4-7, cost_tier: null, note: "v2.5.61 — batch decomposition of ratified macro release-cadence; mezzo entries 8개 동시 ratify, parent §2.3 decomposition candidates 활성화"}

surfaces:
  - {kind: parent, path: greatpractice/macro/release-cadence.md, inherits_freshness: true}

parent:
  - greatpractice/macro/release-cadence
children:
  # Micro decomposition candidates (실제 micro 파일 작성은 v2.5.62+ 후속 batch)
  # - greatpractice/micro/markdown-link-absolute-check.md (pending — 모든 markdown link 가 절대 URL 인지 fixed-value regex check)
  # - greatpractice/micro/internal-anchor-allowance.md (pending — 예외: # anchor + same-doc relative 허용 rule)

phronesis_boundary: false
class: persistent

hash: null
deps: []
rrpv: 2
miss_count:
  compulsory: 0
  capacity: 0
  conflict: 0
  coherence: 0

_ratified_state:
  origin_cycle: v2.5.61
  revision_cycle: v2.5.61
  ratification_cycle: v2.5.61
  ratification_trigger: "user_steering (Greatpractice §5.4 routing path b — batch decomposition of ratified macro greatpractice/macro/release-cadence at v2.5.61)"
  notability_gate: pass
  maturation_gate_score: 19/25
  post_codify_evidence:
    n_data_points: 0
    validation_status: 'inherited from parent macro at ratification; own N=0 data points pending v2.5.62+ post-codify monitoring (link breakage recurrence-rate baseline 측정 + post-codify 0 breakage 검증 필요)'
  acknowledged_risk:
    - 'batch ratification at N=0 own data — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism (sre release-preflight + canonical link integrity convention) backing'
    - 'conditional applicability — public-distribution + 외부 렌더링 페이지 존재 시에만 적용. internal-only docs (예: outer maintenance workspace 의 .agent/ docs) 는 not applicable → 적용 범위 좁아 evidence 누적 느림 → own maturation N=1 도달까지 시간 더 걸림'
    - 'micro decomposition (children) 아직 미작성 — v2.5.62+ batch (markdown-link-absolute-check + internal-anchor-allowance 2 atom 예정)'
    - 'fixed-value regex check 의 false-positive 가능성 — 예: code block 내부 link-like 문자열 (예: `[example]: path/to/file`) 이 link 가 아닌 경우. micro 단계에서 markdown parser 사용 권장'
---

# Link Integrity Check — README/NOTICE/LICENSE 절대 경로 검증

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger, batch decomposition*). Parent macro `greatpractice/macro/release-cadence.md` §2.1 EG #7 행의 specific surface 로 narrow 된 mezzo entry 예요. v2.5.61 cycle 에서 parent 의 8 decomposition candidates 와 함께 동시 ratify. **Conditional applicability**: public-distribution + 외부 렌더링 페이지 (npm/PyPI/등) 존재 시에만 적용 — §3 참조.

## §1. Problem Surface

Release cut 의 사전 검증 항목 중 link integrity 는 **외부 패키지 레지스트리 (npm / PyPI / homebrew / 등) 의 README 렌더링** 상황에서만 surfaced 되는 specific failure mode 예요. GitHub 상에서는 상대 경로 링크가 정상 작동하지만, npm 또는 PyPI 페이지에서 동일 README 가 렌더링될 때 상대 경로 base URL 이 사라져 broken link 로 표시돼요.

**EG #7 narrow scope** (parent §2.1 의 11 항목 중 본 entry 가 cover 하는 1 행):

- **Trigger**: publish 직전 (자동 검증 통과 후 user gate 직전)
- **Then**: npm 페이지 렌더링 가정 시 모든 링크 valid — 절대 경로 또는 GitHub absolute URL — 상대 경로는 npm 렌더 시 깨짐

**Evidence accumulation**:

- **EG-side**: phase_3 cycle 의 docs/promo sync miss 안에 link breakage 관찰 사례 다수 — 특히 `./README.md` 또는 `../LICENSE` 형태의 상대 경로 link 가 외부 surface 에 그대로 노출돼 broken (관찰 instance N≈3 across phase_3).
- **Hub-side**: hub release.md (cd5e6be) 가 link integrity 항목을 EG-add 로 명시 — hub 9-item core 외 EG-side 일반화 시 추가된 surface. Hub instance 의 dogfood evidence 는 본 항목에 한해 N=1 미만 (hub 가 명시만 하고 incident 발생 사례 별도 documented 안 됨).
- **Cross-axis isomorphism**: sre §1.5 release-preflight-checklist 의 pre-publish artifact validation pattern 이 본 entry 의 fixed-value gate 형태와 isomorphic.

본 entry 는 parent macro 23/25 evidence inheritance + 본 surface 의 own delta 적용 (frequency -2, depth -1, cost -1, predictability +1 = 19/25 ≥ 18 threshold ✓).

## §2. Practice Body — Command / Check / Decision 3-tuple

본 §2 가 micro decomposition 의 source 표예요. 각 행 = micro atom candidate (v2.5.62+ 후속 batch 에서 atomic micro 로 분리 예정).

| Micro atom candidate | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|
| `markdown-link-absolute-check` | publish 직전 (dry-run 통과 후, user gate 직전) | README.md / NOTICE / LICENSE 의 모든 markdown link `[text](url)` 패턴 추출 — `grep -oE '\[([^\]]+)\]\(([^)]+)\)'` 또는 markdown parser (`marked`, `remark`) 사용 | 추출된 각 url 이 (a) `https?://` 로 시작 OR (b) `#` (same-doc anchor) 로 시작 OR (c) `mailto:` / 기타 absolute scheme — 셋 중 하나에 매치하는지 fixed-value regex check | 매치 실패 (= 상대 경로 detected) 시 **block** — broken link surface 명시 + 절대 경로 권장 URL (예: `https://github.com/SoliEstre/EstreGenesis/blob/main/...`) 제시. 매치 성공 시 **proceed** to next pre-publish item |
| `internal-anchor-allowance` | 위 check 와 동일 시점 (markdown-link-absolute-check 의 exception branch) | 상대 경로 detected 시 추가 분류 — `#` prefix (same-doc heading anchor) 또는 same-doc fragment (예: `#section-1`) 인지 확인 | 해당 anchor 가 (a) `#` 로 시작 AND (b) 현재 파일 내부 heading 과 매치 (markdown heading 의 GitHub-style slug 규칙: lowercase + hyphenated) 인지 검증 | (a)+(b) 충족 시 **skip-conditional** (exception 허용, proceed) — `markdown-link-absolute-check` 의 block 결정을 override. 미충족 시 원래 **block** 유지 |

**총 micro atom 후보 수**: 2 (markdown-link-absolute-check + internal-anchor-allowance).

**메커니즘 정합**: 본 표의 2 행이 parent macro §2.1 EG #7 단일 행을 atomic 으로 분해. micro atom 단계에서는 각 행이 1 file × 1 PreToolUse hook fixed-value spec 으로 1:1 대응.

## §3. Conditional Applicability

본 entry 는 **conditional** — 적용 범위가 좁아 frontmatter evidence_quality 가 'medium' (parent macro 의 'high' 보다 한 단계 낮음). 적용/비적용 표:

| Surface 카테고리 | 적용 여부 | 근거 |
|---|---|---|
| inner public repo 의 README.md (GitHub + npm/PyPI 동시 surface) | ✅ 적용 | GitHub 외 외부 레지스트리 렌더링 동반 |
| inner public repo 의 NOTICE (npm files[] 포함 시) | ✅ 적용 | npm 페이지에서 NOTICE link 클릭 시 broken 가능 |
| inner public repo 의 LICENSE (npm files[] 포함 시) | ✅ 적용 | 위와 동일 |
| inner public repo 의 module spec (Constellation.md / Hyperbrief.md / Superscalar.md) | ⚠️ 조건부 | GitHub 에서만 surface 시 not applicable; 향후 npm 패키지에 포함 시 적용 |
| outer maintenance workspace 의 `.agent/` docs | ❌ not applicable | internal-only, 외부 렌더링 없음 |
| outer maintenance workspace 의 AGENTS.md / CLAUDE.md | ❌ not applicable | private repo, 외부 렌더링 없음 |
| `/reports/` (outer only) | ❌ not applicable | outer-only, 외부 surface 없음 |

**Decision rule**: 본 entry 의 §2 check 를 적용할지 결정 시 위 표 참조 — applicable 표면만 검증 대상에 포함.

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (parent inherit + own delta)

| Axis | Parent score | Own delta | Final | Rationale |
|---|---|---|---|---|
| frequency | 5/5 | -2 | 3/5 | link breakage 가 release 마다 발생하지 않고 markdown link 포함 surface 가 외부 렌더링되는 conditional case 에서만 surfaced |
| depth | 4/5 | -1 | 3/5 | 단일 표면 카테고리 (markdown link) — parent 의 multi-surface depth 보다 좁음 |
| recency | 5/5 | -1 | 4/5 | 2026-06-04 phase_3 cycle 의 link breakage 관찰 — parent 와 유사 recency 이지만 본 entry 의 incident 사례 quantification 약함 |
| cost | 5/5 | -1 | 4/5 | npm 페이지 broken link 가 첫인상 손상 + 외부 신뢰도 하락이지만, unpublish-tier (72h 제한) cost 미만 |
| predictability | 4/5 | +1 | 5/5 | fixed-value regex check 로 기계화 완전 가능 — markdown parser 활용 시 false-positive 최소화 |

**Sum: 19/25 ≥ 18 threshold ✓**

### §4.2 Notability gate 3-criterion

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ✓ | EG phase_3 cycle 내 link breakage 관찰 N≈3 instances + hub release.md EG-add 명시 |
| independent_triggers ≥ 2 | ✓ | EG release ship phase + hub 9-item codify phase — 다른 surface, 다른 환경 |
| verifiable effect | ✓ | broken link 검출 가능 (npm 페이지 visual inspection 또는 fixed-value regex), pre/post 비교 가능 |

### §4.3 phronesis_boundary

| Criterion | Result |
|---|---|
| rare | ✗ — conditional 이지만 적용 surface 에서는 매 cut 발생 가능 |
| high-context | ✗ — markdown 표준 + npm/PyPI 렌더링 표준 = cross-environment isomorphic |
| judgement-heavy | ✗ — 기계적 검증 가능 (fixed-value regex) |

**phronesis_boundary = false. Codify-eligible.**

## §5. Hook Spec Candidates

v0.2+ Greatpractice hook 구현 stage 에서 본 entry 의 자동화 가능 항목:

- **PreToolUse hook (Bash, npm publish or pip upload 직전)**: applicable surfaces (README.md / NOTICE / LICENSE 등 frontmatter `surfaces[]` 또는 `package.json files[]` 에 포함된 markdown 파일) 의 모든 markdown link 추출 → §2 표 micro atom 1 (markdown-link-absolute-check) regex 적용 → §2 표 micro atom 2 (internal-anchor-allowance) exception 분류 → 상대 경로 발견 시 hook 가 publish 명령 차단 + 상대 경로 list 출력.
- **PostToolUse hook (commit 후)**: applicable surfaces 변경 commit 후 동일 검증 수행 → 결과를 commit 로그에 attach (warning only, non-blocking — release 시점이 아닌 commit 시점에는 warning 만).
- **Fixed-value regex (lint-time)**: `[text](url)` 패턴의 url 부분이 `^(https?://|#|mailto:|tel:)` 매치 — 미매치 시 lint error.

**구현 우선순위**: PreToolUse > Fixed-value lint > PostToolUse (publish 시점이 release cut 의 critical gate 이므로).

## §6. Surface Registry

본 entry 의 surfaces[] = parent macro 1 surface 만 (inherits_freshness=true). N-way sync 관점에서 본 entry 자체는 외부 표면 변경 시 cascade 영향 없음 (단방향 inherit) — parent 가 변경되면 본 entry 도 freshness recompute.

**Parent macro §5.8 N-way sync registry 연동**: parent §5.8 등록부 의 "EG 릴리스 버전" 행 (inner/README.md badge · inner/docs/index.html hero badge · inner/docs/shared/data.js meta.version · inner/CHANGELOG.md 신규 항목) — 본 entry 는 그 surfaces 각각의 *내부 markdown link* 가 절대 경로인지 검증하는 sub-rule. 즉, parent 의 surface 등록부 는 *어떤 파일* 이 동기화 대상인지, 본 entry 는 *그 파일들 내부 link* 의 형식 검증.

**Future surface 등록 후보** (v2.5.62+): inner module spec (Constellation.md / Hyperbrief.md / Superscalar.md) 가 npm 패키지에 포함되어 외부 surface 진입 시 본 entry 의 applicable 표 (§3) 에 ✅ 적용 행으로 추가.

## §7. Acknowledged Risk + Future Work

### §7.1 본 entry 한계

- **N=0 own data points** — parent macro 의 23/25 evidence inheritance 로 ratification 정당화. own dogfood instance 누적 (v2.5.62+ post-codify monitoring) 필요. 다음 release cut 에서 본 entry 의 §2 check 적용 후 link breakage 0 건 검증 시 N=1 도달.
- **Conditional applicability** — 적용 범위 좁아 (§3 표 의 ✅ applicable 행 만) own evidence 누적 느림. inner 의 외부 surface 진입이 npm/PyPI publish cycle 에 동반될 때만 instance 발생.
- **False-positive risk** — fixed-value regex 가 code block 내부 link-like 문자열 (예: 코드 예시 안의 `[label]: ./path`) 을 mismatch detect 할 가능성. micro 단계에서 markdown parser (remark / marked) 사용 권장 (regex fallback 만 사용 시 manual override exception list 필요).

### §7.2 Micro decomposition candidates (v2.5.62+ batch)

frontmatter children comment 와 일치:

1. **`greatpractice/micro/markdown-link-absolute-check.md`** — §2 표 1행. 모든 markdown link 의 url 이 absolute scheme (`https?://` / `mailto:` / 등) 또는 `#` anchor 인지 fixed-value regex check. PreToolUse hook 1:1 대응.
2. **`greatpractice/micro/internal-anchor-allowance.md`** — §2 표 2행. `#` prefix same-doc anchor 의 exception 허용 rule. markdown heading slug 규칙 (GitHub-style: lowercase + hyphenated) 검증.

### §7.3 Hook 구현 stage (v0.2+ post-spec)

- v0.2 (hook spec ratification) — §5 의 PreToolUse + PostToolUse + Fixed-value lint 3개 hook spec frontmatter 등록
- v0.3 (hook implementation) — npm publish / pip upload 직전 차단 hook 의 실 구현 + parent macro `release-cadence` 의 다른 mezzo (package-files-validate / dry-run-smoke-test) 와 hook chain composition
- v0.4 (post-codify N=2/N=3 monitoring) — own evidence 누적 + maturation_gate_score recompute (frequency axis 가 N=2/N=3 도달 시 +1 보정 가능)
