---
# === v0.1 lint-required ===
id: release-cadence
tier: macro
binding: ratio
enforcement_level: recommended
trigger:
  if: "release cut about to ship (version tag, package publish, deploy)"
  then: "execute pre-publish ratified checklist (11 items below — 9 hub-validated + 2 conditional) + N-way sync registry covering every surface in AGENTS.md §5.8"
  format: command-check-decision
  source: post-incident
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Release Cadence — Pre-Publish Ratified Checklist + N-Way Sync Discipline
slug: release-cadence
created_at: 2026-06-05T10:05:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - memory/feedback_release_versioning_cadence.md
  - hub release.md (cd5e6be) — Pre-publish 9-item ratified checklist (sister surface, hub-scale instance)
  - hub 9-item schema detail (m-hub-gp-040-evidence-1780653318567) — trigger/then schema per item
  - EstreUX 0.3.0 publish incident (2026-06-04) — version bump 누락 + README stale + NOTICE 누락 + bin invalid (user direct catch, 4 omissions)
  - EstreUX 0.4.0 publish (2026-06-05) — post-codify dogfood N=1, 0 omissions (9-item checklist 사전 적용 + dry-run 19 files / 118.4KB + NOTICE 378B + files/bin 검출)
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

last_validated_at: 2026-06-06T00:00:00Z
validation_cadence_days: 180
freshness_until: 2026-12-03T00:00:00Z
freshness_inherits_from: null

coherence: soft
edit_policy: owned
owner: EG-maintainers
audit_trail:
  - {ts: 2026-06-05T10:05:00Z, agent: claude-opus-4-7, action: create, prev_hash: null}
  - {ts: 2026-06-05T19:00:00Z, agent: claude-opus-4-7, action: revise, prev_hash: null}
  - {ts: 2026-06-06T00:00:00Z, agent: claude-opus-4-7, action: ratify, prev_hash: null}

supersedes:
  - memory/feedback_release_versioning_cadence.md
  - greatpractice/_propose/release-cadence.draft.md
superseded_by: null
revision_history:
  - {ts: 2026-06-05T10:05:00Z, type: created, by: claude-opus-4-7, cost_tier: null}
  - {ts: 2026-06-05T19:00:00Z, type: distinguish, by: claude-opus-4-7, cost_tier: distinguish, note: "v2.5.52 — integrated hub 9-item schema detail + 0.4.0 post-codify N=1 evidence (4→0 omission reduction); no rule change, evidence detail enhancement only"}
  - {ts: 2026-06-06T00:00:00Z, type: ratify, by: claude-opus-4-7, cost_tier: null, note: "v2.5.55 — user steering trigger (Greatpractice §5.4 routing path b); promoted _propose/draft → macro/ratified at N=1 evidence (user override of N≥2-3 recommendation); decomposition mezzo (§2.3 candidates list) scheduled v2.5.56+"}

surfaces:
  - {kind: external-sister, path: "(hub-repo)/release.md", inherits_freshness: false}
  - {kind: memory_stub, path: memory/feedback_release_versioning_cadence.md, inherits_freshness: false}
  - {kind: redirect-stub, path: greatpractice/_propose/release-cadence.draft.md, inherits_freshness: false}

parent: []
children:
  # Mezzo decomposition planned (see §2.3) — scheduled v2.5.56+ ratification batch
  # - greatpractice/mezzo/n-way-sync-registry.md (pending)
  # - greatpractice/mezzo/package-files-validate.md (pending — conditional, public-distribution)
  # - greatpractice/mezzo/bin-entry-validate.md (pending — conditional)
  # - greatpractice/mezzo/link-integrity-check.md (pending)
  # - greatpractice/mezzo/dry-run-smoke-test.md (pending — conditional)
  # - greatpractice/mezzo/pre-publish-user-gate.md (pending)
  # - greatpractice/mezzo/naming-hygiene-grep.md (pending — conditional)
  # - greatpractice/mezzo/auth-2fa-discipline.md (pending — conditional)

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
  origin_cycle: v2.5.51
  revision_cycle: v2.5.52
  ratification_cycle: v2.5.55
  ratification_trigger: user_steering (Greatpractice §5.4 routing path b — user override of N≥2-3 recommendation at N=1)
  notability_gate: pass
  maturation_gate_score: 23/25
  post_codify_evidence:
    n_data_points: 1
    baseline_recurrence_rate: '4 omissions per release (EstreUX 0.3.0)'
    post_codify_rate: '0 omissions per release (EstreUX 0.4.0)'
    reduction_pct: 100
    validation_status: 'criterion §7.3 met at N=1; continued monitoring N=2/N=3 in subsequent publishing releases'
  acknowledged_risk:
    - 'N=1 single-data-point ratification — standard statistical confidence requires N≥3; user steering overrode this'
    - 'children decomposition (8 mezzo candidates per §2.3) pending — scheduled v2.5.56+ ratification batch'
    - 'hub bidirectional cross-link not yet established (hub owner decision)'
---

# Release Cadence — Pre-Publish Ratified Checklist + N-Way Sync Discipline

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger*). Promoted from `_propose/release-cadence.draft.md` to `greatpractice/macro/release-cadence.md` at v2.5.55 cycle. **Ratification acknowledgement**: 본 entry 는 N=1 evidence (EstreUX 0.3.0 → 0.4.0, 4 → 0 omission reduction) 에서 *사용자 직접 steering* 으로 ratified — 표준 통계 신뢰도 (N≥3) 미만 상태에서 user override 결정. 후속 release 의 추가 evidence 누적 (N=2/N=3) 으로 maturation 보강 예정. Mezzo 분해 (8 candidates per §2.3) v2.5.56+ batch 로 예정.

## §1. Problem Surface

Release cut (version tag + package publish + docs deploy) 발생 시점마다 동반되어야 하는 자잘한 약속들이 자연스럽게 형성되지만 자주 누락돼요. 이 entry 는 그 누락 패턴의 maturation candidate 예요.

**Evidence accumulation**:

- **EG-side**: phase_3 cycle 동안 16+ docs/promo sync miss 누적 (memory/feedback_release_versioning_cadence.md). 매 cut 시 badge bump · CHANGELOG · docs/index.html hero · data.js meta · README Current line 의 동시 갱신이 본격적 cadence 정착 전에 종종 부분 누락.
- **Hub-side (sister surface)**: 2026-06-04 EstreUX 0.3.0 npm 첫 publish 시 version bump 누락 (phase_3 산출 다 마쳤지만 package.json 0.2.0 그대로) + README stale (npm 첫인상 굳음) + NOTICE 누락 (files[] 미포함 → 링크 깨짐) + bin invalid (./prefix → CLI 매핑 제거). user 가 직접 catch + hub release.md Pre-publish 9-item ratified checklist (commit cd5e6be) 로 codify.
- **Cross-axis isomorphism** (cf. reports/2026-06-04-greatpractice-research/): sre §1.5 release-preflight-checklist + humanities §1.7 Gawande WHO read-do checklist + management §1.10 standard work + canonical §1.6 dual-mode-edit-policy 4축 convergence.

이 evidence 들이 maturation gate 의 multi-criteria 통과 (frequency 5 + depth 4 + recency 5 + cost 5 + predictability 4 = 23/25 ≥ 18) + notability gate 3-criterion 통과 (significant coverage / independent triggers across EG & hub / verifiable effect via sync miss recurrence rate).

## §2. Practice Candidate Body — Pre-Publish Checklist

각 항목 = sub-mezzo decomposition candidate. ratification 후 mezzo + micro 로 분해 예정.

본 §2 는 hub release.md 가 dogfood-validated 9-item schema (m-hub-gp-040-evidence-1780653318567 으로 공유) 를 EG-side 일반화 + 확장 형태로 통합. Hub instance 의 항목 번호 (①-⑨) 와 EG canonical 항목 번호 (1-11) cross-mapping 함께 표기.

### §2.1 Core 9 items (hub-validated)

| EG # | Hub # | Item | Trigger | Then |
|---|---|---|---|---|
| 1 | ① version | **Version bump (all surfaces)** | release cut 작업 완료 시점 (다 해놓고 미bump 가 최빈 누락) | 모듈 spec frontmatter + README badge + plugin.json + marketplace.json + package.json + data.js meta — *모두 동시* 갱신, 부분 누락 시 차단 |
| 2 | ③ readme | **README sync** | 기능/링크/version 변경 시 (npm 첫인상 고착 — package publish 후 README 수정해도 npm 페이지 캐싱) | EN + KO Current 라인 동시 갱신 + badge + 신규 version 의 변경 dense 1줄 |
| 3 | ② changelog | **CHANGELOG entry (EN + KO)** | 기능/변경 추가 시 | EN section + KO section 양쪽 신규 entry, 핵심 변경 dense 1줄 |
| 4 | (EG-add) | **N-way sync registry traversal** | version bump committed | AGENTS.md §5.8 등록부의 매 표면 (badge / docs/index.html hero / data.js meta / marketplace.json / 등) 동시 갱신 — entry frontmatter surfaces[] 자동 검증 (Greatpractice §8 SSoT inversion) |
| 5 | ④ files | **Package files inclusion + NOTICE** | 배포파일 화이트리스트 작성 시 (Apache-2.0 NOTICE 가 자동 미포함 — 누락 시 npm 페이지 링크 깨짐) | npm/pip/등 package 의 files[] 또는 동등 manifest 에 NOTICE + LICENSE + bin + dist 모두 명시 포함 |
| 6 | ⑤ bin | **Bin entry validation** | package.json bin 경로 작성 시 (./prefix 가 npm CLI 매핑 제거의 sneaky failure mode) | bin 경로 valid 확인 — ./prefix 제거, file 실존 확인 |
| 7 | (EG-add) | **README/NOTICE/LICENSE link integrity** | publish 직전 | npm 페이지 렌더링 가정 시 모든 링크 valid (절대 경로 / GitHub absolute URL — 상대 경로는 npm 렌더 시 깨짐) |
| 8 | ⑦ dryrun | **Dry-run / smoke test** | publish 직전 | `npm publish --dry-run` 또는 동등 명령으로 *파일 list + 크기* 사전 확인. 추가로 dist artifact 의 minimal usage (import + invoke 1회) — exit 0 확인 |
| 9 | ⑨ gate | **Pre-publish user gate** | publish 직전 — 모든 자동 검증 통과 후 | major surfaces (README + CHANGELOG + version + files[]) 변경 PR/diff user 검토 → user 명시 승인 시 publish (autonomous-execution 의 §5.1 gate (a) loss/external publish) |

### §2.2 Hub-shared additional items (public-distribution surface)

Hub 9-item schema 가 추가로 명시한 2 항목 — public-distribution surface 의 specific gate. EG-side 일반화 시 publishing context (npm / pip / homebrew / 등) 진입 시 적용. 본 EG-side 일반 release (npm 미포함) 에는 해당 안 될 수 있어요 (conditional applicability).

| EG # | Hub # | Item | Trigger | Then |
|---|---|---|---|---|
| 10 | ⑥ naming | **Naming hygiene** | 공개 배포 시 (npm/등) | 실서비스명/내부 코드명/실제 deployment 이름 0건 게이트 — 코드/문서 grep 으로 사전 제거 |
| 11 | ⑧ auth | **Auth discipline (2FA)** | npm 또는 동등 publish 명령 실행 시 | 2FA TTY 직접 입력 — non-TTY Bash 환경에서는 EOTP 실패 발생 (failure mode 인지) — interactive shell 또는 OTP env var 사용 |

### §2.3 Mezzo decomposition candidates (post-ratification)

본 §2 의 11 항목 (9 core + 2 conditional) 가 macro entry promote 시 분해될 mezzo candidates:

- `n-way-sync-registry` (covers EG #1, #2, #3, #4 — version + README + CHANGELOG + surfaces 통합)
- `package-files-validate` (covers EG #5 — files[] + NOTICE + LICENSE inclusion)
- `bin-entry-validate` (covers EG #6 — package.json bin 경로 valid)
- `link-integrity-check` (covers EG #7 — README + NOTICE + LICENSE 절대 경로 검증)
- `dry-run-smoke-test` (covers EG #8 — `--dry-run` + import smoke)
- `pre-publish-user-gate` (covers EG #9 — user 승인 gate, §5.1 gate (a))
- `naming-hygiene-grep` (covers EG #10, conditional — public-distribution only)
- `auth-2fa-discipline` (covers EG #11, conditional — interactive-publish only)

각 mezzo entry 가 1-3 micro atom 으로 추가 분해 (command/check/decision 3-tuple). 전체 ratified shape 추정 = 1 macro + 8 mezzo + 12-20 micro + 2 hook (PreToolUse fixed-value on version bump + PostToolUse on publish command).

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

### §4.4 Post-Codify Evidence Accumulation Log

본 sub-section 은 promotion gate criterion (a) — post-codify hit-rate ≥ pre-codify recurrence-rate (§7.3 validation) 의 누적 데이터 로그. macro promotion 정당화의 quantitative backing.

**Baseline (pre-codify)**: EstreUX 0.3.0 first npm publish (2026-06-04) — 9-item checklist 미적용 상태, 4 omissions observed (①version bump 누락 + ③README stale + ④files NOTICE 누락 + ⑤bin ./prefix invalid). User-direct catch + hub codified into release.md cd5e6be.

**N=1 (post-codify)**: EstreUX 0.4.0 publish (2026-06-05) — 9-item checklist *적용 후* publish:

| Hub item | Status | Detail |
|---|---|---|
| ① version | ✓ pass | bump 적용 0.3.0 → 0.4.0 (전 surface 동시) |
| ② changelog | ✓ pass | CHANGELOG entry 추가 |
| ③ readme | ✓ pass | README 동기화 (version + 변경 사항) |
| ④ files | ✓ pass | files[] 화이트리스트 + NOTICE 378B 사전 검출 + dry-run 19 files / 118.4KB |
| ⑤ bin | ✓ pass | bin 경로 valid 확인 |
| ⑥ naming | ✓ pass | 실서비스명 0건 게이트 통과 |
| ⑦ dryrun | ✓ pass | `npm publish --dry-run` 19 files / 118.4KB 사전 확인 |
| ⑧ auth | ✓ pass | 2FA TTY 직접 입력 (interactive shell) |
| ⑨ gate | ✓ pass | publish 사용자 게이트 통과 |

**Aggregate**: 9/9 items pass, **0 omissions** (vs baseline 4 omissions). **Recurrence-rate reduction: 4 → 0 (100% reduction, N=1 data point)**.

**Confidence assessment**: N=1 single-data-point reduction. Standard statistical confidence for "intervention effective" claim typically requires N≥3 — additional release cycles maintaining 0 omissions strengthen ratification justification. Current state: §7.3 validation criterion *met for N=1*, *insufficient for high-confidence promotion*. 권장 N ≥ 2-3 release before promotion to `greatpractice/macro/release-cadence.md`.

| Data Point | Release | Date | Omissions | Recurrence Δ |
|---|---|---|---|---|
| baseline | EstreUX 0.3.0 | 2026-06-04 | 4 | — |
| N=1 | EstreUX 0.4.0 | 2026-06-05 | 0 | −4 (100%) |
| N=2 | (pending) | — | — | — |
| N=3 | (pending) | — | — | — |

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
| Body capture (11 items = 9 core + 2 conditional) | ✅ v2.5.52 — hub schema integrated |
| Children decomposition draft (mezzo candidates) | ✅ §2.3 sub-mezzo enumeration (post-ratification target shape) |
| Hub release.md 9-item detail | ✅ RESOLVED v2.5.52 — hub-shared trigger/then schema integrated into §2.1 |
| Hub instance cross-reference | ✅ surfaces[] external-sister entry; bidirectional cross-link optional (hub owner) |
| Post-codify evidence (N=1) | ✅ EstreUX 0.4.0 — 0 omissions (4→0, 100% reduction) |
| Post-codify evidence (N=2, N=3) | ⏳ pending — N≥2-3 recommended for high-confidence promotion |
| User steering for ratification | ⏳ waiting (or N=2/N=3 accumulation auto-trigger) |
| Promotion to greatpractice/macro/ | ⏳ pending (v2.5.5X or v2.6.0) |
