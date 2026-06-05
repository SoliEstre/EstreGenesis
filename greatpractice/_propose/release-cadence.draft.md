---
# === v0.1 lint-required ===
id: release-cadence
tier: macro
binding: ratio
enforcement_level: recommended
trigger:
  if: "release cut about to ship (version tag, package publish, deploy)"
  then: "execute pre-publish ratified checklist (9 items below) + N-way sync registry covering every surface in AGENTS.md §5.8"
  format: command-check-decision
  source: post-incident
lifecycle: probation
last_referenced_turn: 2026-06-05T10:05:00Z

# === lint-warn ===
title: Release Cadence — Pre-Publish Ratified Checklist + N-Way Sync Discipline (DRAFT)
slug: release-cadence
created_at: 2026-06-05T10:05:00Z
source_evidence:
  - memory/feedback_release_versioning_cadence.md
  - hub release.md (cd5e6be) — Pre-publish 9-item ratified checklist (sister surface, hub-scale instance)
  - EstreUX 0.3.0 publish incident (2026-06-04) — version bump 누락 + README stale + NOTICE 누락 + bin invalid (user direct catch)
  - phase_3 cycle observation — 16x docs/promo sync miss accumulated across cuts
  - reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight-checklist)
  - reports/2026-06-04-greatpractice-research/axes/humanities.md §1.7 (Gawande WHO Safe Surgery read-do checklist)
  - reports/2026-06-04-greatpractice-research/axes/management.md §1.10 (standard work + IAR escape)
  - reports/2026-06-04-greatpractice-research/axes/canonical.md §1.6 (dual-mode-edit-policy)

evidence_quality: high
recommendation_strength: SHOULD

maturity_score:
  frequency: 5
  depth: 4
  recency: 5
  cost: 5
  predictability: 4
  # sum: 23/25 ≥ 18 threshold ✓

last_validated_at: null
validation_cadence_days: 180
freshness_until: null
freshness_inherits_from: null

coherence: soft
edit_policy: owned
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-05T10:05:00Z, agent: claude-opus-4-7, action: create, prev_hash: null}

supersedes: []
superseded_by: null
revision_history:
  - {ts: 2026-06-05T10:05:00Z, type: created, by: claude-opus-4-7, cost_tier: null}

surfaces:
  - {kind: external-sister, path: "(hub-repo)/release.md", inherits_freshness: false}
  - {kind: memory_stub, path: memory/feedback_release_versioning_cadence.md, inherits_freshness: false}
  - {kind: macro-future, path: greatpractice/macro/release-cadence.md, inherits_freshness: true}

parent: []
children: []

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

_propose_state:
  stage: draft
  origin_cycle: v2.5.51
  promotion_target: v2.5.5X (timing TBD)
  notability_gate: pass
  maturation_gate_score: 23/25
  blocking_items:
    - 'hub release.md 9-item detail (currently summarized — full schema strengthens evidence)'
    - 'children decomposition (mezzo + micro atoms — version-bump-discipline / n-way-sync-registry / package-files-validate / bin-entry-validate / readme-current-state / changelog-entry-append / etc.)'
    - 'user steering for ratification timing'
---

# Release Cadence — Pre-Publish Ratified Checklist + N-Way Sync Discipline (DRAFT)

> **State**: `_propose/draft` — Greatpractice §5.4 routing rule 의 notability gate (3-criterion) + maturation gate (5-axis ≥ 18) 통과한 candidate. Promotion to `greatpractice/macro/release-cadence.md` 는 user steering 또는 추가 evidence 누적 후 v2.5.5X cut.

## §1. Problem Surface

Release cut (version tag + package publish + docs deploy) 발생 시점마다 동반되어야 하는 자잘한 약속들이 자연스럽게 형성되지만 자주 누락돼요. 이 entry 는 그 누락 패턴의 maturation candidate 예요.

**Evidence accumulation**:

- **EG-side**: phase_3 cycle 동안 16+ docs/promo sync miss 누적 (memory/feedback_release_versioning_cadence.md). 매 cut 시 badge bump · CHANGELOG · docs/index.html hero · data.js meta · README Current line 의 동시 갱신이 본격적 cadence 정착 전에 종종 부분 누락.
- **Hub-side (sister surface)**: 2026-06-04 EstreUX 0.3.0 npm 첫 publish 시 version bump 누락 (phase_3 산출 다 마쳤지만 package.json 0.2.0 그대로) + README stale (npm 첫인상 굳음) + NOTICE 누락 (files[] 미포함 → 링크 깨짐) + bin invalid (./prefix → CLI 매핑 제거). user 가 직접 catch + hub release.md Pre-publish 9-item ratified checklist (commit cd5e6be) 로 codify.
- **Cross-axis isomorphism** (cf. reports/2026-06-04-greatpractice-research/): sre §1.5 release-preflight-checklist + humanities §1.7 Gawande WHO read-do checklist + management §1.10 standard work + canonical §1.6 dual-mode-edit-policy 4축 convergence.

이 evidence 들이 maturation gate 의 multi-criteria 통과 (frequency 5 + depth 4 + recency 5 + cost 5 + predictability 4 = 23/25 ≥ 18) + notability gate 3-criterion 통과 (significant coverage / independent triggers across EG & hub / verifiable effect via sync miss recurrence rate).

## §2. Practice Candidate Body — 9-item Pre-Publish Checklist

각 항목 = sub-mezzo decomposition candidate. ratification 후 mezzo + micro 로 분해 예정.

| # | Item | Trigger | Action |
|---|---|---|---|
| 1 | **Version bump (all surfaces)** | release cut about to commit | 모듈 spec frontmatter + README badge + plugin.json + marketplace.json + package.json + data.js meta — 모두 동시 갱신, 부분 누락 시 차단 |
| 2 | **README Current line** | version bump committed | EN + KO Current 라인 신규 version 의 변경 사항 dense 1줄 (16x prior pattern: KO 빠짐 또는 EN stale 누락) |
| 3 | **CHANGELOG entry (EN + KO)** | version bump committed | EN section + KO section 양쪽 신규 entry, 핵심 변경 dense 1줄 (multi-paragraph 회피, single-line per entry 정착 cadence) |
| 4 | **N-way sync registry traversal** | version bump committed | AGENTS.md §5.8 등록부의 매 표면 (badge / docs/index.html hero / data.js meta / marketplace.json / 등) 동시 갱신 — entry frontmatter surfaces[] 자동 검증 (Greatpractice §8 SSoT inversion) |
| 5 | **Package files inclusion** | package publish about to happen | npm/pip/등 package 의 files[] (또는 동등 manifest) 에 NOTICE / LICENSE / bin / dist 모두 포함 확인 |
| 6 | **Bin entry validation** | package publish about to happen | package.json bin (또는 동등) 의 경로 valid — ./prefix invalid pattern 차단, file 실존 확인 |
| 7 | **README/NOTICE/LICENSE link integrity** | package publish about to happen | npm 페이지 렌더링 가정 시 모든 링크 valid (절대 경로 / GitHub absolute URL — 상대 경로는 npm 렌더 시 깨짐) |
| 8 | **Smoke test** | package publish about to happen | dist artifact 의 minimal usage (import + invoke 1 회) 실행, exit 0 확인 |
| 9 | **Pre-publish review** | release cut + package publish 동시 시 | major surfaces (README + CHANGELOG + version) 변경 PR review (또는 owner self-review) — 본 cycle 의 EG-side 패턴: user 가 commit 전 검토하는 pause point |

## §3. Sister Surface — Hub release.md (Hub-Scale Instance)

Hub release.md (cd5e6be commit) = 본 entry 의 hub-scale 경량 instance. Greatpractice §10.4 Adoption Mode 표의 "Schema only" 또는 "Hook subset" 채택 (hub 가 5-axis gate + 7-event hook 전체 도입 없이 release 관행 체크리스트 + feedback memory 경량 반영). 정합 + 권장 — adopter 별 적정 깊이 선택의 v0.1 spec 의도 부합.

**Cross-reference 정합 (proposal)**:

- 본 entry 의 surfaces[] 에 hub release.md 가 `external-sister` kind 로 등재 (inherits_freshness=false — sister 가 own evolution).
- Hub release.md → EG Greatpractice entry cross-link 추가 (hub owner 결정 영역, minimal coupling 권장).
- 양방향 isomorphism 명시 시 향후 collaboration cycle 에서 evidence 양방향 누적 path 명료해짐.

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (Greatpractice §5.1)

| Axis | Score | Rationale |
|---|---|---|
| frequency | 5/5 | 매 release cycle × phase_3 동안 16+ EG instances + hub instance |
| depth | 4/5 | 다중 surface (badge / Current EN+KO / docs hero / data.js meta / CHANGELOG EN+KO / marketplace / package files / NOTICE / bin) |
| recency | 5/5 | 2026-06-05 진행 중 — 본 cycle 의 hub dogfood evidence 가 최신 |
| cost | 5/5 | npm 페이지 영구성 (unpublish 72h 제한) + sync miss × N surfaces × multi-cycle 누적 cost |
| predictability | 4/5 | 체크리스트화 가능, judgement-light — phronesis_boundary 외. -1 = surface 별 partial dependency (예: package 없는 release 의 경우 § 5/6/7/8 skip) |

**Sum: 23/25 ≥ 18 threshold ✓**

### §4.2 Notability gate 3-criterion (Greatpractice §5.2)

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ✓ | EG side 16+ × multi-cycle + hub side 1 explicit incident |
| independent_triggers ≥ 2 (work-domain × phase × time-of-day) | ✓ | EG cycle ship phase + hub package publish phase — 다른 surface, 다른 환경, 다른 work-domain |
| verifiable effect | ✓ | sync miss recurrence rate 측정 가능, post-checklist hit/miss matrix 비교 가능 |

### §4.3 phronesis_boundary check (Greatpractice §5.3)

| Boundary criterion | Result |
|---|---|
| rare (frequency low + context unique) | ✗ — 빈번 + 표준화 가능 |
| high-context (cross-context applicability low) | ✗ — cross-environment isomorphic |
| judgement-heavy | ✗ — 기계적 검증 가능 |

**phronesis_boundary 외 영역. Codify-eligible.**

## §5. Ratification Path

본 draft 가 `greatpractice/macro/release-cadence.md` 로 promote 되는 시점:

1. **Additional evidence accumulation** — 다음 EG release 에서 본 9-item 체크리스트 활용 후 sync miss recurrence rate 감소 입증 (post-codify hit-rate ≥ pre-codify recurrence-rate 의 §7.3 validation criterion 적용).
2. **또는 user steering** — "ratify 진행" 명시 후 v2.5.5X cut 진입.
3. **또는 hub-side release.md 양방향 reference 등재 trigger** — sister surface 강화 시점.

**Promotion 시 후속 작업** (v2.5.5X cut scope):

- `greatpractice/macro/release-cadence.md` 본문 작성 (full frontmatter ratified + 9-item canonical body)
- Mezzo decomposition: `greatpractice/mezzo/n-way-sync-registry.md` · `version-bump-discipline.md` · `package-files-validate.md` · `bin-entry-validate.md` 등 (4-6 mezzo entries)
- Micro atom: 각 mezzo 의 command/check/decision 3-tuple (10+ micro atoms)
- Hook 등록: PreToolUse fixed-value (badge bump 시 surfaces 모두 갱신 검증) + PostToolUse (commit 후 npm package 의 files[] 검증)
- `memory/feedback_release_versioning_cadence.md` 의 redirect stub 전환 (canonical Wikipedia Merge — original path 에 `# Promoted → greatpractice/macro/release-cadence.md` 1줄)

## §6. Cross-Axis Convergence Reference

- **humanities §1.7** Gawande *Checklist Manifesto* WHO Safe Surgery — 4-principle read-do checklist + pause point + killer-items-only + fatigue budget 60-90s
- **sre §1.5** Google SRE *Production Readiness Review* — release-preflight checklist + canary deployment + error budget
- **management §1.10** Toyota Production System *standard work* + Wikipedia 5 pillars IAR escape — kaizen baseline + ad-hoc override path
- **canonical §1.6** Wikipedia *dual-mode-edit-policy* — bold edit vs revert vs discuss tiered strictness
- **processor §1.7** RRIP saturation counter — 신규 practice 의 default 단명 (rrpv=2 본 entry)

## §7. Status Tracker

| Item | State |
|---|---|
| Notability gate (3-criterion) | ✅ pass |
| Maturation gate (5-axis ≥ 18) | ✅ pass (23/25) |
| Phronesis boundary check | ✅ outside (judgement-light) |
| 9-item body capture | ✅ initial draft |
| Children decomposition draft | 🔄 in progress (sub-mezzo enumerate, not yet written) |
| Hub release.md 9-item detail | ⏳ summarized, full detail strengthens evidence |
| User steering for ratification | ⏳ waiting |
| Promotion to greatpractice/macro/ | ⏳ pending (v2.5.5X) |
