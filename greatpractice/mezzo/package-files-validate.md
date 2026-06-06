---
# === v0.1 lint-required ===
id: package-files-validate
tier: mezzo
binding: ratio
enforcement_level: conditional
trigger:
  if: "public-distribution package manifest 작성/수정 시점 (npm package.json files[] · pip MANIFEST.in · homebrew formula files 등)"
  then: "manifest 의 inclusion 화이트리스트가 NOTICE + LICENSE + bin + dist 모두 explicit 명시 — 누락 시 publish 차단 + 사용자 escalation"
  format: command-check-decision
  source: cross-axis-inheritance
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Package Files Validate — Manifest Inclusion of NOTICE / LICENSE / bin / dist
slug: package-files-validate
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - greatpractice/macro/release-cadence.md §2.1 EG #5 (hub item ④ files) — parent macro 의 항목 발췌
  - EstreUX 0.3.0 publish incident (2026-06-04) — Apache-2.0 NOTICE 자동 미포함 → files[] 누락 → npm 페이지 NOTICE 링크 깨짐 (4 omissions 중 1건)
  - EstreUX 0.4.0 publish (2026-06-05) — post-codify dogfood N=1, files[] 화이트리스트 + NOTICE 378B 사전 검출 + dry-run 19 files / 118.4KB 확인 → 0 omissions
  - hub release.md (cd5e6be) ④ files 항목 — sister surface 의 hub-validated schema
  - reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight-checklist) — cross-axis 정합
  - reports/2026-06-04-greatpractice-research/axes/humanities.md §1.7 (Gawande WHO Safe Surgery read-do killer-items) — NOTICE / LICENSE = legal-killer item

evidence_quality: medium
recommendation_strength: SHOULD

maturity_score:
  frequency: 3
  depth: 4
  recency: 5
  cost: 5
  predictability: 5
  # sum: 22/25 ≥ 18 threshold ✓
  # parent 23/25 inherit; -2 frequency (단일 surface 좁힘) +1 predictability (mechanical check)

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
  - {kind: external-sister, path: "(hub-repo)/release.md ④ files", inherits_freshness: false}

parent:
  - greatpractice/macro/release-cadence
children:
  # Micro decomposition planned (see §7) — scheduled v2.5.62+ ratification batch
  # - greatpractice/micro/notice-license-include-fixed-value.md (pending — files[] 에 NOTICE + LICENSE 두 항목 fixed-value 강제)
  # - greatpractice/micro/dist-bin-inclusion-check.md (pending — dist + bin 경로 manifest 포함 확인)

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
  ratification_trigger: user_steering (Greatpractice §5.4 routing path b — batch decomposition of ratified macro greatpractice/macro/release-cadence at v2.5.61)
  notability_gate: pass
  maturation_gate_score: 22/25
  post_codify_evidence:
    n_data_points: 1
    validation_status: 'inherited from parent macro at ratification (EstreUX 0.4.0 N=1, files[] 화이트리스트 + NOTICE 378B 검출 → 0 omissions); own N=1 data point covers files-specific surface; further accumulation pending v2.5.62+ post-codify monitoring'
  acknowledged_risk:
    - 'batch ratification at N=1 own data — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism backing (humanities Gawande killer-items + sre preflight)'
    - 'conditional applicability (public-distribution only) — private internal package 또는 git-only consumption 에는 not applicable, evidence 누적 범위 좁음 → own maturation N=2/N=3 도달까지 시간 더 걸림'
    - 'micro decomposition (children — notice-license-include-fixed-value + dist-bin-inclusion-check) 아직 미작성 — v2.5.62+ batch'
    - 'manifest schema diversity (npm files[] · pip MANIFEST.in · homebrew formula files · cargo include · 등) — entry 는 npm files[] 우선 + 타 ecosystem 일반화 — ecosystem-specific micro 분해 시 정밀도 보강 필요'
---

# Package Files Validate — Manifest Inclusion of NOTICE / LICENSE / bin / dist

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger* at v2.5.61 batch decomposition of ratified macro `greatpractice/macro/release-cadence`). Conditional applicability — public-distribution surface (npm / pip / homebrew / 등) 진입 시에만 적용. parent macro 의 23/25 evidence inheritance + own N=1 data point (EstreUX 0.4.0 files[] 검출) 기반 ratify.

## §1. Problem Surface

Public-distribution package (npm / pip / homebrew / cargo / 등) 의 publish manifest 가 **inclusion 화이트리스트** 방식일 때 (npm package.json `files[]` · pip `MANIFEST.in` · homebrew formula `files` 등), **법적/문서적 핵심 파일** 들이 자동 미포함되는 sneaky failure mode 가 빈번해요. 본 entry 는 그 누락의 specific surface = NOTICE + LICENSE + bin + dist 4종 inclusion 검증의 mezzo-level practice 예요.

**Failure mode 핵심**: Apache-2.0 license 의 NOTICE 파일은 license 자체가 요구하는 attribution 표면이지만, npm `files[]` 화이트리스트 방식 + npm 의 기본 `LICENSE` auto-include 만 적용 → **NOTICE 는 자동 미포함**. 결과: npm 페이지의 README 가 NOTICE 를 링크해도 publish 된 tarball 에 NOTICE 부재 → 링크 깨짐 + license 의무 위반 가능성.

**Evidence accumulation**:

- **EG-side (own N=1)**: EstreUX 0.3.0 first npm publish (2026-06-04) — package.json `files[]` 가 `dist/` + `bin/` 만 포함, NOTICE + LICENSE 명시 누락. npm publish 후 NOTICE 미포함 발견 → user-direct catch. EstreUX 0.4.0 publish (2026-06-05) 에서 `files[]` 에 NOTICE + LICENSE 명시 추가 + `npm publish --dry-run` 으로 19 files / 118.4KB / NOTICE 378B 사전 검출 → 0 omissions.
- **Sister surface (hub)**: hub release.md (cd5e6be) ④ files 항목 = 본 entry 의 hub-validated schema. trigger ("배포파일 화이트리스트 작성 시") + then ("files[] 또는 동등 manifest 에 NOTICE + LICENSE + bin + dist 모두 명시 포함") 동일.
- **Cross-axis isomorphism**: humanities §1.7 Gawande *Checklist Manifesto* WHO Safe Surgery 의 **killer-items-only** 원칙 — NOTICE / LICENSE 누락 = legal/attribution killer item, 자동 검증 가능. sre §1.5 release-preflight-checklist 의 inclusion 화이트리스트 검증 패턴.

## §2. Practice Body — Command / Check / Decision 3-Tuple

본 §2 = micro atom decomposition candidates. 각 행이 v2.5.62+ batch 에서 micro entry 로 분해 예정.

| Micro Atom Candidate | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|
| **notice-license-include-fixed-value** | package.json `files[]` 또는 동등 manifest 작성/수정 시점 | `files[]` 에 `"NOTICE"` + `"LICENSE"` 두 항목 fixed-value 추가 (entry 가 hook 으로 강제하면 PreToolUse 가 자동 inject) | 1. `grep "NOTICE" package.json` + `grep "LICENSE" package.json` 모두 매치 / 2. repo root 에 NOTICE + LICENSE 파일 실존 (`test -f NOTICE && test -f LICENSE`) | (a) 모두 match + 실존 → proceed / (b) 매치 누락 → block + 사용자 escalation (fixed-value 강제 hook 적용 권장) / (c) 파일 자체 부재 → block + 라이선스 결정 escalation |
| **dist-bin-inclusion-check** | package.json `files[]` 또는 동등 manifest 작성/수정 시점 | `files[]` 에 `dist/` (또는 빌드 output 경로) + `bin/` (있는 경우) 추가 | 1. `npm publish --dry-run` 출력의 file list 에 dist artifact + bin script 포함 확인 / 2. package.json `bin` 필드 경로가 `files[]` glob 에 포함됨을 확인 | (a) 둘 다 포함 → proceed / (b) dist 누락 → block (publish 시 실용성 0) / (c) bin 누락 + package.json bin 필드 존재 → block (CLI 매핑 부재) / (d) bin 필드 없음 (라이브러리-only) → skip-conditional |

**핵심 원칙** (3-tuple 공통):

1. **Inclusion 화이트리스트 = explicit-or-omit** — 명시 안 한 파일은 publish 누락. 따라서 fixed-value 강제 (NOTICE + LICENSE) + 빌드 output (dist + bin) 명시 둘 다 manifest 에 박힘.
2. **Dry-run 으로 사전 검출** — `npm publish --dry-run` (또는 동등) 의 file list + 크기 출력이 inclusion 검증의 ground truth. parent macro §2.1 EG #8 (dry-run-smoke-test) 와 paired execution.
3. **Apache-2.0 NOTICE = legal-killer** — Apache-2.0 license 사용 시 NOTICE 누락은 license 의무 위반 가능성. MIT 등 NOTICE 미요구 license 라도 attribution 문서 면에서 명시 권장.

## §3. Conditional Applicability — 적용 범위 표

본 entry 는 **public-distribution surface** 진입 시에만 적용돼요. frontmatter `enforcement_level: conditional` 의 풀이.

| 적용 컨텍스트 | Applicability | Rationale |
|---|---|---|
| npm public publish | ✓ Applicable (required) | `files[]` 화이트리스트 + Apache-2.0 NOTICE auto-omit failure mode 의 origin surface |
| pip public publish (PyPI) | ✓ Applicable (required) | `MANIFEST.in` 의 동등 화이트리스트 — `include NOTICE` + `include LICENSE` 명시 필요 |
| homebrew formula | ✓ Applicable (recommended) | `files` 또는 `install do` block 의 inclusion 명시 |
| cargo crate (crates.io) | ✓ Applicable (recommended) | `Cargo.toml` `include` 필드 또는 default include 규칙 확인 |
| 기타 public package manager (gem / nuget / 등) | ✓ Applicable (recommended) | ecosystem-specific manifest 패턴 적용 |
| private npm registry / 사내 distribution | ◐ Recommended | 법적 attribution 의무는 same, 사용자 편의는 reduced — 적용 권장하나 강제 아님 |
| git-only consumption (e.g., `npm install github:org/repo`) | ✗ Not Applicable | publish manifest 자체 부재, repo 의 모든 파일이 자동 포함 |
| internal monorepo workspace package | ✗ Not Applicable | publish 단계 없음 |

**Frontmatter `enforcement_level: conditional` 의미**: applicability=Applicable 시 SHOULD (block-or-escalate), Not Applicable 시 skip. owner 측 hook 등록 시 ecosystem detection 선행 (`package.json` 존재 → npm path / `setup.py` 또는 `pyproject.toml` → pip path / 등).

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (parent inherit + own delta)

| Axis | Score | Parent (release-cadence) | Δ | Rationale |
|---|---|---|---|---|
| frequency | 3/5 | 5 | −2 | 단일 surface (files[]) 좁힘 — 매 release 가 아닌 매 publish 시 (publishing 이 아닌 release cut 은 skip) |
| depth | 4/5 | 4 | 0 | NOTICE + LICENSE + bin + dist 4종 inclusion 동시 검증 = 다중 sub-surface |
| recency | 5/5 | 5 | 0 | 2026-06-04/05 EstreUX 0.3.0→0.4.0 incident + post-codify, 본 cycle 의 최신 evidence |
| cost | 5/5 | 5 | 0 | npm unpublish 72h 제한 + license 의무 위반 가능성 → 영구성 high cost |
| predictability | 5/5 | 4 | +1 | npm publish --dry-run 으로 100% mechanical 검증 가능 — phronesis 0 |

**Sum: 22/25 ≥ 18 threshold ✓** (parent 23/25 inherit, single-surface 좁힘 + 검증 mechanical 보강 net −1)

### §4.2 Notability gate 3-criterion

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ◐ Soft pass | EG side 1 explicit incident (0.3.0) + post-codify 1 (0.4.0) + hub side schema 통합 = 3 instances 중 2개 EG-own. parent macro 의 broader evidence inheritance 로 보강 |
| independent_triggers ≥ 2 | ✓ | npm publish (EstreUX 0.3.0) + post-codify dry-run (0.4.0) — 다른 work phase, 다른 publish cycle |
| verifiable effect | ✓ | dry-run file list 출력의 NOTICE / LICENSE / dist / bin 존재 binary check, recurrence rate 측정 가능 |

### §4.3 phronesis_boundary check

| Boundary criterion | Result |
|---|---|
| rare | ✗ — public publish 마다 발생 |
| high-context | ◐ partial — ecosystem-specific 이지만 isomorphic 패턴 |
| judgement-heavy | ✗ — 기계 검증 가능 (dry-run + grep) |

**phronesis_boundary 외 영역. Codify-eligible.**

## §5. Hook Spec Candidates (v0.2+ 구현 예정)

본 entry 의 강제 수단 후보. v0.1 = ratified spec, v0.2+ = hook 자동화.

### §5.1 PreToolUse hook — manifest write/edit 검증

**Trigger**: `Edit` / `Write` tool 의 `file_path` 가 `package.json` / `MANIFEST.in` / `Cargo.toml` / 등 매치 + 변경 영역에 `files` / `include` 필드 포함 시.

**Action**: 
1. 변경 후 manifest 의 inclusion 화이트리스트 parse.
2. NOTICE + LICENSE 두 항목 fixed-value 존재 확인 (없으면 inject 또는 block).
3. dist / bin 경로 inclusion 확인 (package.json `bin` 필드 존재 시).

**Decision**: 
- 모두 통과 → allow.
- NOTICE/LICENSE 누락 → block + 사용자 surface (fixed-value inject 옵션 제시).
- dist/bin 누락 → block (publish 시 실용성 0 또는 CLI 매핑 부재).

### §5.2 PostToolUse hook — publish 명령 사전 차단

**Trigger**: `Bash` tool 의 command 가 `npm publish` (dry-run 아님) / `twine upload` / `cargo publish` / 등 매치 시.

**Action**: 
1. `--dry-run` 등가 명령 사전 실행 (예: `npm publish --dry-run`).
2. 출력의 file list 에 NOTICE + LICENSE + dist + bin 모두 포함 확인.
3. 누락 시 publish 명령 자체를 block.

**Decision**: 
- dry-run 출력에 4종 모두 포함 → allow publish 진행.
- 누락 → block + 사용자에게 manifest 수정 surface.

**구현 stage**: v0.2 (parent macro 의 ratification 후 hook 자동화 batch 의 일부, ecosystem detector + manifest parser 의존).

## §6. Surface Registry — N-way Sync 관점

본 entry 의 frontmatter `surfaces[]` 의 풀이:

| Surface | Kind | inherits_freshness | Note |
|---|---|---|---|
| `greatpractice/macro/release-cadence.md` | parent | true | parent macro 의 validation cadence 상속 (180일) |
| hub release.md ④ files (cd5e6be) | external-sister | false | sister 가 own evolution — hub owner 결정 영역 |

**parent macro §5.8 N-way sync registry 와의 관계**: parent 의 §5.8 등록부는 release cut 시 동시 갱신 surfaces (badge / docs hero / data.js meta / marketplace.json / 등). 본 entry 의 §2 micro atom 들 (notice-license-include-fixed-value · dist-bin-inclusion-check) 은 그 등록부의 **package.json files[]** 표면 (현재 등록부에 없음 — v2.5.62+ 등록부 확장 candidate) 의 atomic validation gate.

**향후 등록부 확장 후보** (parent §5.8 갱신 시 추가):

| 기능 | 표면 | sync 규율 |
|---|---|---|
| 배포 manifest inclusion | `inner/package.json` files[] · `inner/MANIFEST.in` · `inner/Cargo.toml` include | publish 직전 본 mezzo entry 의 §2 micro atom 통과 — NOTICE + LICENSE + bin + dist 4종 명시 |

## §7. Acknowledged Risk + Future Work

### §7.1 본 entry 의 한계

- **N=1 own data**: parent macro 의 23/25 evidence inheritance + 본 entry 의 own EstreUX 0.4.0 N=1 data 만 — own N=2/N=3 도달까지 evidence 보강 필요. parent macro 의 후속 release cycle 에서 본 mezzo atom 적용 hit/miss 추적 필요.
- **Conditional applicability 좁힘**: public-distribution 만 적용 → private/internal package 의 evidence 누적 0. ecosystem-specific (npm vs pip vs homebrew) variation 의 isomorphism 검증 아직 부족.
- **Manifest schema diversity**: 본 entry 는 npm `files[]` 우선 + 타 ecosystem 일반화 — pip `MANIFEST.in` 의 `recursive-include` 패턴 / homebrew formula DSL / cargo `include` glob 등 ecosystem-specific 정밀도 보강은 micro 분해 후속 작업.
- **License-specific 의무 차이**: Apache-2.0 NOTICE 가 핵심 trigger 였지만 MIT / BSD / GPL 별 attribution 의무 패턴 다름 — license-specific micro atom 분해 가능성 (v0.3+).

### §7.2 Micro decomposition candidates (v2.5.62+ batch)

본 entry 의 §2 표가 micro atom 분해의 직접 source. 후속 batch 에서 2개 micro entry 작성:

1. **`greatpractice/micro/notice-license-include-fixed-value.md`** — files[] 에 NOTICE + LICENSE 두 항목 fixed-value 강제 (PreToolUse hook 의 target). evidence = EstreUX 0.3.0 NOTICE 누락 + 0.4.0 post-codify 추가.
2. **`greatpractice/micro/dist-bin-inclusion-check.md`** — dist + bin 경로 manifest 포함 확인 (dry-run 출력 비교). evidence = EstreUX 0.4.0 dry-run 19 files / 118.4KB 검출.

각 micro 의 frontmatter = command/check/decision 3-tuple 의 atomic spec + 본 mezzo entry parent 등재 + own maturation score (parent inherit + 추가 좁힘).

### §7.3 Hook 구현 stage (v0.2+)

- **v0.2**: §5.1 PreToolUse hook (manifest write/edit 시 NOTICE/LICENSE/dist/bin 검증) + ecosystem detector (package.json / MANIFEST.in / Cargo.toml 인식).
- **v0.3**: §5.2 PostToolUse hook (publish 명령 사전 차단) + license-specific NOTICE 의무 차등 적용.
- **v0.4+**: 타 ecosystem 정밀도 보강 (pip recursive-include / homebrew DSL / cargo glob).

### §7.4 후속 evidence 누적 path

다음 EG 또는 sister project (EstreUX / hub / 등) 의 public publish 마다 본 entry 의 §2 micro atom hit/miss 기록 → parent macro §4.4 post-codify table 의 항목 추가 + 본 entry 자체의 own N=2/N=3 도달 추적. own N≥3 도달 시 `recommendation_strength` SHOULD → MUST 승격 검토 가능.
