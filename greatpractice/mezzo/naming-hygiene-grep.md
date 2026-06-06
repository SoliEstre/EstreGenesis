---
# === v0.1 lint-required ===
id: naming-hygiene-grep
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "public-distribution release cut (npm/pip/homebrew/GitHub public release) about to ship"
  then: "grep code + docs for predefined internal-name blocklist (real service names / internal codenames / actual deployment names) — zero-hit gate; if 1+ found, redact-then-recheck loop until clean"
  format: command-check-decision
  source: cross-axis-inheritance
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Naming Hygiene — Internal-Name Grep Zero-Hit Gate (Public Distribution)
slug: naming-hygiene-grep
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - greatpractice/macro/release-cadence.md §2.2 EG #10 (Hub ⑥ naming)
  - hub release.md (cd5e6be) — Pre-publish 9-item ratified checklist, ⑥ naming hygiene 항목
  - EstreUX 0.4.0 publish (2026-06-05) — naming hygiene 0건 게이트 통과 (실서비스명 0건 확인)
  - reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight-checklist)
  - reports/2026-06-04-greatpractice-research/axes/humanities.md §1.7 (Gawande WHO Safe Surgery — killer-items-only)

evidence_quality: medium
recommendation_strength: SHOULD

maturity_score:
  frequency: 2
  depth: 3
  recency: 4
  cost: 5
  predictability: 5
  # sum: 19/25 ≥ 18 threshold ✓ — low frequency (public-distribution only) offset by high cost (leak irreversible)

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
  - {kind: external-sister, path: "(hub-repo)/release.md", inherits_freshness: false}

parent:
  - greatpractice/macro/release-cadence
children:
  # Micro decomposition planned (see §7 — children comment 와 일치) — v2.5.62+ batch
  # - greatpractice/micro/internal-name-grep-zero.md (pending — 사전 정의 internal name blocklist grep, 0건 fixed-value)
  # - greatpractice/micro/redact-then-recheck-loop.md (pending — 1+ 발견 시 redact 후 재grep, clean signal until zero)

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
  ratification_trigger: 'user_steering (Greatpractice §5.4 routing path b — batch decomposition of ratified macro greatpractice/macro/release-cadence at v2.5.61)'
  notability_gate: pass
  maturation_gate_score: 19/25
  post_codify_evidence:
    n_data_points: 1
    validation_status: 'inherited from parent macro at ratification (EstreUX 0.4.0 — naming 0건 게이트 통과); own N=1 data point present (parent dogfood instance applies to ⑥ naming), additional N=2/N=3 pending v2.5.62+ post-codify monitoring'
  acknowledged_risk:
    - 'batch ratification at N=1 own data — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism backing (hub release.md ⑥ naming)'
    - 'conditional applicability — public-distribution (npm/pip/homebrew/GitHub public release) 만 적용. private repo 또는 internal-only release 에는 not applicable → 적용 범위 좁아 own evidence 누적 felony rate 낮음 → own maturation N≥3 도달까지 시간 더 걸림'
    - 'micro decomposition (children: internal-name-grep-zero, redact-then-recheck-loop) 아직 미작성 — v2.5.62+ batch'
    - 'internal-name blocklist 의 SSoT 미정의 — 본 entry 는 "사전 정의 blocklist" 를 전제하지만 그 SSoT (config file / env var / hardcoded list) 의 location + 갱신 cadence 가 후속 micro 또는 hook spec 에서 정의 필요'
---

# Naming Hygiene — Internal-Name Grep Zero-Hit Gate (Public Distribution)

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger, batch decomposition of ratified macro greatpractice/macro/release-cadence at v2.5.61*). 본 entry 는 parent macro 의 §2.2 EG #10 (Hub ⑥ naming) 행 의 mezzo-tier 구체화 — public-distribution release cut 의 사전 zero-hit grep gate 사양. **Conditional applicability**: public-distribution surface (npm/pip/homebrew/GitHub public release) 만 적용. Private repo / internal-only release 에는 not applicable.

## §1. Problem Surface

공개 배포 (npm publish, pip release, homebrew tap, GitHub public release) 직전, 코드 + 문서에 *실서비스명 · 내부 코드명 · 실제 deployment 이름* 이 0건임을 확인해야 해요. 비공개 정보 (배포 인프라 이름, 내부 codename, 실제 customer/service identifier) 가 공개 surface 에 leak 되면 *unpublish 72h 제한* + *npm 캐싱* + *GitHub fork/clone propagation* 으로 인해 *되돌릴 수 없어요*.

본 mezzo 는 parent macro `release-cadence.md` §2.2 EG #10 (Hub ⑥ naming) 행 의 narrow scope:

- **Trigger**: 공개 배포 시 (npm/pip/homebrew/GitHub public release).
- **Practice**: 실서비스명/내부 코드명/실제 deployment 이름 0건 게이트 — 코드/문서 grep 으로 사전 제거.

**Evidence accumulation**:

- **Hub-side (sister surface)**: hub release.md (commit cd5e6be) 의 9-item Pre-publish ratified checklist 에 ⑥ naming 항목 명시. Hub instance 가 own dogfood cycle 에서 명시 codify.
- **EG-side**: EstreUX 0.4.0 publish (2026-06-05) 시 9-item checklist 적용 — ⑥ naming 항목 *0건 게이트 통과* (실서비스명 0건 확인). EG repo 가 처음부터 public-clean 으로 시작했기 때문에 EG-side own 누적 incident 적음 — 그러나 hub instance 와 의 cross-axis isomorphism backing 으로 N=1 own + parent N=1 inheritance.
- **Cross-axis convergence**: sre §1.5 release-preflight-checklist (pre-publish zero-defect gate) + humanities §1.7 Gawande WHO Safe Surgery (killer-items-only — irreversible-leak 가 killer item).

본 entry 는 parent macro 의 evidence inheritance (23/25) + own incremental evidence (19/25) 로 ratified.

## §2. Practice Body — Command / Check / Decision 3-tuple

각 행 = micro atom decomposition candidate (§7 children comment 와 일치).

| Micro atom candidate | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|
| `internal-name-grep-zero` | 공개 배포 cut 의 publish 명령 직전 (예: `npm publish` 또는 `git push --tags` to public remote) | 사전 정의 internal name blocklist 의 각 항목을 코드 (src/ + dist/) + 문서 (*.md, *.html, package.json description) 에 grep — fixed-value rule (hook v0.2+ 구현 예정) | grep result count = 0 (모든 blocklist 항목 동시 0건) | **0건 → proceed** (publish 명령 진입 허용) / **1+ → block** (publish 명령 차단, `redact-then-recheck-loop` 진입) |
| `redact-then-recheck-loop` | 위 grep 에서 1+ 발견 시 | 발견 위치별 redact (rename / placeholder 치환 / 또는 비공개 처리) 후 grep 재실행 — clean signal until zero | grep result count = 0 이 *연속 달성* (1회 통과만으로 부족 — false-negative 방지 차원에서 commit + 재grep 권장) | **0건 연속 달성 → proceed** (위 atom 의 통과 path 와 합류) / **반복 0건 미달 → escalate** (blocklist 항목 vs 의도된 사용 충돌 — `pre-publish-user-gate` mezzo 의 user 결정 영역으로 escalate) |

**Conditional applicability 표 (frontmatter enforcement_level 조정 기준)**:

| Context | Applicable? | enforcement_level |
|---|---|---|
| npm publish (public) | ✓ Yes | recommended (SHOULD) |
| pip publish (PyPI public) | ✓ Yes | recommended (SHOULD) |
| homebrew tap (public) | ✓ Yes | recommended (SHOULD) |
| GitHub public release / public repo push | ✓ Yes | recommended (SHOULD) |
| private repo internal push | ✗ No | not applicable — skip |
| internal-only deployment (CI/CD to internal infra) | ✗ No | not applicable — skip |
| EG outer (private) repo 작업 | ✗ No | not applicable — skip (single-repo level, not cross-surface) |

본 entry 의 `enforcement_level: recommended` 는 *applicable* context 한정. Not-applicable context 에서는 본 entry 의 trigger 자체가 발화 안 함.

## §3. Sister Surface / Cross-Reference

Hub release.md (cd5e6be commit) 의 9-item Pre-publish ratified checklist 의 ⑥ naming 항목이 본 entry 의 hub-scale sister instance. Hub-side 가 own release 의 일부로 naming hygiene 항목 codify (자세히는 parent macro `release-cadence.md` §3 참조).

**Cross-axis isomorphism**:

- **Hub instance**: release.md ⑥ naming 항목 — own dogfood cycle 에서 hub repo 의 internal-name leak 사전 차단 (own SSoT, own blocklist).
- **EG instance**: 본 mezzo + 후속 micro — EG 의 public-distribution surface (npm 향후 publish 시 + GitHub public repo 본 자체) 에 적용. EG SSoT 의 blocklist 는 후속 micro 에서 정의 필요 (현재 acknowledged risk).

본 isomorphism 이 19/25 own maturity score 보강 + parent 23/25 inheritance 와 합해 ratification 정당화.

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (Greatpractice §5.1) — own + inherited

| Axis | Own Score | Parent Inherit | Rationale |
|---|---|---|---|
| frequency | 2/5 | 5/5 | own: public-distribution 만 적용 → 빈도 낮음. inherit: parent macro 가 모든 release 적용 |
| depth | 3/5 | 4/5 | own: code + docs 2개 surface grep. inherit: parent 가 9-surface multi-aspect |
| recency | 4/5 | 5/5 | own: parent dogfood (EstreUX 0.4.0) 의 일부로 N=1 검증, 2026-06-05 |
| cost | 5/5 | 5/5 | leak irreversible — npm 페이지 unpublish 72h + GitHub fork/clone propagation, sister 와 동일 cost 등급 |
| predictability | 5/5 | 4/5 | own: 기계적 grep, judgement 0 → +1 vs parent. fixed-value blocklist 정의 시 결정 미발생 |

**Own sum: 19/25 ≥ 18 threshold ✓** (낮은 frequency 가 높은 cost + predictability 로 상쇄)

**Parent inherit sum: 23/25** (frontmatter freshness_inherits_from + parent surfaces[] 활용)

### §4.2 Notability gate 3-criterion (Greatpractice §5.2)

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ⚠ partial | EG own = 1 (EstreUX 0.4.0 통과 instance) + hub = 1 (release.md codify) + cross-axis 2 (sre + humanities) = 4 total. EG-only 누적 N≥3 미달 → parent inheritance + cross-axis 로 보강 통과 |
| independent_triggers ≥ 2 | ✓ pass | EG cycle public publish trigger + hub release cycle trigger — 다른 surface, 다른 work-domain |
| verifiable effect | ✓ pass | grep result count 측정 가능, post-check hit/miss matrix 비교 가능 |

### §4.3 phronesis_boundary check (Greatpractice §5.3)

| Boundary criterion | Result |
|---|---|
| rare (frequency low + context unique) | ✗ — public-distribution context 에서 표준화 가능 |
| high-context | ✗ — cross-environment isomorphic (hub + EG 양쪽 적용) |
| judgement-heavy | ✗ — 기계적 grep + fixed-value blocklist, judgement 0 |

**phronesis_boundary 외 영역. Codify-eligible.** (frontmatter `phronesis_boundary: false`)

## §5. Hook Spec Candidates

본 entry 의 강제 가능 사양 — v0.2+ 구현 예정. Greatpractice §8 hook system 표준 따름.

### §5.1 PreToolUse hook (fixed-value, publish-blocking)

**Trigger**: Bash tool 의 `npm publish` 또는 `pip upload` 또는 `git push --tags` (to public remote) 명령 detection.

**Logic**:

1. Internal-name blocklist 의 SSoT load (예: `.greatpractice/blocklist/internal-names.txt` 또는 entry 의 frontmatter 부속).
2. blocklist 의 각 항목을 *코드* (src/, dist/, lib/) + *문서* (*.md, *.html, README, package.json description) 에 grep.
3. 총 hit count > 0 → tool call block + redact-then-recheck-loop micro atom 안내 surface.
4. hit count = 0 → tool call pass.

**Failure mode 인지**: blocklist SSoT 자체가 outdated 또는 incomplete 시 false-negative 발생 가능 → blocklist 갱신 cadence 가 별도 entry (또는 본 entry 의 후속 revision) 에서 정의 필요.

### §5.2 PostToolUse hook (optional, double-check)

**Trigger**: `npm publish` 또는 동등 명령 *완료 직후*.

**Logic**: 방금 publish 된 artifact (예: npm tarball 의 unpacked content) 에 동일 blocklist grep 재실행 — file packaging step 에서 누락된 ignore 가 leak 발생시켰는지 사후 검증 (PreToolUse 의 source-tree grep 과 *packaged artifact grep* 의 불일치 catch).

**Decision**: hit count > 0 → unpublish window (npm 72h) 내 즉시 unpublish + 사후 incident report.

## §6. Surface Registry

본 entry 의 frontmatter surfaces[] 표면 풀이:

| kind | path | inherits_freshness | 역할 |
|---|---|---|---|
| parent | `greatpractice/macro/release-cadence.md` | true | 상위 macro 의 §2.2 EG #10 행 의 mezzo 구체화. parent freshness 상속 (validation_cadence_days 180 / freshness_until 2026-12-03 동기) |
| external-sister | `(hub-repo)/release.md` | false | hub-scale sister instance — own evolution path, freshness 독립 |

**N-way sync 관점**: parent macro `release-cadence.md` §5.8 AGENTS.md surfaces 등록부 의 항목 중 *public-distribution 발화 시점* 에 본 entry trigger 가 발화. 본 entry 가 enforce 하는 surface 는 *코드 + 문서* (소스 트리 전체) — 단일 surface registry 가 아닌 *cross-surface grep* — 따라서 본 entry 는 §5.8 registry 의 *gate* 역할 (registry sync 가 완료된 후, publish 직전 마지막 zero-hit 게이트).

## §7. Acknowledged Risk + Future Work

### §7.1 본 entry 의 한계

- **Conditional applicability** — public-distribution context 만 적용. Private repo / internal-only release 에는 trigger 발화 안 함 → own evidence 누적 felony rate 낮음 (frequency 2/5 의 본질적 이유) → own maturation N≥3 도달까지 시간 더 걸림.
- **Internal-name blocklist SSoT 미정의** — 본 entry 는 "사전 정의 blocklist" 를 전제하지만 그 SSoT 의 location + format + 갱신 cadence 가 후속 micro 또는 hook spec 에서 정의 필요. 임시 fallback = 사용자 ad-hoc 추가 (hook PreToolUse 의 첫 발화 시 사용자 prompt 로 blocklist 항목 누적).
- **False-negative 위험** — blocklist 가 outdated 시 leak 검출 실패. PostToolUse double-check + 정기 blocklist 갱신 cadence 가 보완.
- **False-positive 위험** — blocklist 항목이 의도된 사용 (예: 공개 announce 대상 서비스명) 과 충돌 시 redact-then-recheck-loop 반복 무한 — `pre-publish-user-gate` mezzo 의 user 결정 영역으로 escalate.

### §7.2 Micro decomposition 후보 (v2.5.62+ batch)

frontmatter children comment 와 일치:

- **`greatpractice/micro/internal-name-grep-zero.md`** — §2 표 1번째 행 의 micro atom 화. 사전 정의 internal name blocklist 의 fixed-value grep, 0건 fixed-value gate. PreToolUse hook §5.1 의 1단계 logic 대응.
- **`greatpractice/micro/redact-then-recheck-loop.md`** — §2 표 2번째 행 의 micro atom 화. 1+ 발견 시 redact + 재grep 의 clean signal until zero loop. PreToolUse hook §5.1 의 block-then-retry path 대응.

### §7.3 v0.2+ hook 구현 stage

| Stage | 항목 | 도구 |
|---|---|---|
| Stage 1 | blocklist SSoT 정의 (`.greatpractice/blocklist/internal-names.txt` 또는 entry frontmatter 부속) | manual |
| Stage 2 | PreToolUse hook spec (§5.1) implementation | Claude Code hook system |
| Stage 3 | PostToolUse hook spec (§5.2) implementation | Claude Code hook system |
| Stage 4 | Micro atom entries 작성 (§7.2 두 micro) | greatpractice batch |
| Stage 5 | Hub release.md 와 의 bidirectional cross-link 강화 (hub owner 결정 영역) | A2A coordination |

### §7.4 Future evidence accumulation

- 다음 EG public-distribution release (npm publish 시점) 에서 본 entry 의 §2 표 적용 → own N=2 데이터 누적.
- Hub-side 의 추가 release instance 에서 ⑥ naming 항목 codify 강화 시 sister evidence 누적.
- 두 경로 합산으로 own maturity score frequency 항목 (현재 2/5) 의 미래 상향 조정 가능.
