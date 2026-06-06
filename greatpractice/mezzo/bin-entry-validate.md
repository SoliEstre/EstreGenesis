---
# === v0.1 lint-required ===
id: bin-entry-validate
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "package.json (또는 동등 manifest) 의 bin 필드 작성/변경 시점 — CLI tool 배포 package"
  then: "bin 경로 (a) ./prefix 없음 확인 + (b) file 실존 확인 — 둘 다 통과해야 publish proceed; 실패 시 block + fix-then-retry"
  format: command-check-decision
  source: cross-axis-inheritance
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Bin Entry Validation — package.json bin 경로 ./prefix 제거 + file 실존 확인
slug: bin-entry-validate
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - greatpractice/macro/release-cadence.md §2.1 EG #6 (parent macro)
  - hub release.md (cd5e6be) — Pre-publish 9-item schema item ⑤ bin (sister surface)
  - EstreUX 0.3.0 publish incident (2026-06-04) — bin invalid (./prefix → CLI 매핑 sneakily 제거, publish 성공 but CLI 명령 인식 실패)
  - EstreUX 0.4.0 publish (2026-06-05) — post-codify dogfood N=1, bin 경로 valid 확인 통과
  - reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight-checklist — fixed-value validation 정합)
  - reports/2026-06-04-greatpractice-research/axes/canonical.md §1.6 (dual-mode-edit-policy — manifest 정합)

evidence_quality: medium
recommendation_strength: SHOULD

maturity_score:
  frequency: 2
  depth: 3
  recency: 5
  cost: 4
  predictability: 5
  # sum: 19/25 ≥ 18 threshold ✓ (barely passes; high cost prevention + high predictability driver)

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
  # Micro decomposition planned (see §7) — scheduled v2.5.62+ batch
  # - greatpractice/micro/bin-path-prefix-strip.md (pending — ./prefix 제거 fixed-value check)
  # - greatpractice/micro/bin-file-exists-check.md (pending — bin 경로 file 실존 check)

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
  maturation_gate_score: 19/25
  post_codify_evidence:
    n_data_points: 1
    validation_status: 'inherited from parent macro at ratification (EstreUX 0.4.0 N=1 bin pass); own N=1 data point pending v2.5.62+ post-codify monitoring across additional CLI-tool publishing releases'
  acknowledged_risk:
    - 'batch ratification at N=1 own data — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism (sre + canonical) backing'
    - 'conditional applicability — bin 필드 있는 CLI-tool package 만 적용; library-only package 는 not applicable, evidence 누적 felé 좁아 maturation N=2/N=3 도달까지 시간 더 걸림'
    - 'micro decomposition (children 2 atom) 아직 미작성 — v2.5.62+ batch 예정'
---

# Bin Entry Validation — package.json bin 경로 ./prefix 제거 + file 실존 확인

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger*, batch decomposition of parent macro `greatpractice/macro/release-cadence.md` at v2.5.61 cycle). Parent macro 의 §2.1 EG #6 행 1개를 narrow-scope mezzo entry 로 분리. **Conditional applicability**: bin 필드 있는 package (CLI tool 배포) 만 적용 — library-only package 는 skip-conditional.

## §1. Problem Surface

CLI tool 을 npm (또는 동등 registry) 으로 배포할 때 `package.json` 의 `bin` 필드가 CLI 명령 ↔ entry script 매핑을 정의해요. 이 매핑이 sneakily 실패하는 두 가지 패턴이 본 entry 의 specific surface 예요:

1. **`./prefix` 매핑 제거**: `"bin": {"my-cli": "./bin/cli.js"}` 처럼 `./` 접두 작성 시 npm 이 매핑을 *조용히 제거*. publish 자체는 성공 — registry 페이지에 package 등재 + version 정상 — but `npm install -g <pkg>` 후 `my-cli` 명령 인식 안 됨. 사용자 first install 경험에서 즉시 실패.
2. **file 실존 실패**: `"bin": {"my-cli": "bin/cli.js"}` 작성했지만 `bin/cli.js` file 자체가 `files[]` 화이트리스트 누락 또는 build 산출물 path 불일치로 publish artifact 에 미포함. install 후 `my-cli` 호출 시 ENOENT.

**Evidence accumulation**:

- **Hub-side (sister surface)**: 2026-06-04 EstreUX 0.3.0 npm 첫 publish 시 bin invalid 발생 — `./prefix` 형태로 작성 → publish 성공 but CLI 매핑 제거. 사용자 직접 catch + hub release.md Pre-publish 9-item ratified checklist 의 ⑤ bin 항목 (commit cd5e6be) 로 codify. EstreUX 0.4.0 publish (2026-06-05) 시 본 entry 의 fixed-value check 사전 적용 — bin 경로 valid 확인 통과 (post-codify N=1).
- **EG-side**: EG inner package 가 현재 CLI tool 미배포 (collab client 는 별도 cjs script, npm bin 매핑 미사용) — own evidence 누적 felé 좁아요. parent macro 의 23/25 + cross-axis isomorphism (sre release-preflight + canonical manifest hygiene) 이 본 entry 의 maturation backing.
- **Cross-axis** (cf. reports/2026-06-04-greatpractice-research/): sre §1.5 release-preflight-checklist 의 fixed-value validation 패턴 + canonical §1.6 manifest dual-mode-edit-policy 가 본 entry 의 mechanical-check 정합.

**Maturation gate**: 5-axis sum 19/25 ≥ 18 threshold ✓ (frequency 2 + depth 3 + recency 5 + cost 4 + predictability 5). cost 4 + predictability 5 가 driver — npm CLI 첫인상 영구성 (unpublish 72h 제한 + 명령 인식 실패는 사용자 install 첫 1분 경험 직격) + 기계적 fixed-value check 가능 (정규식 + fs.existsSync 두 줄 코드).

## §2. Practice Body — Command / Check / Decision 3-tuple

각 행 = micro atom decomposition candidate (§7 children comment 와 일치). Trigger → Command (수행) → Check (검증) → Decision (분기).

| Micro atom | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|
| **bin-path-prefix-strip** | package.json bin 필드 작성/변경 시 (CLI tool 배포 진입 시) | `bin` 필드의 각 값에서 `./` 접두 *제거* — `"my-cli": "./bin/cli.js"` → `"my-cli": "bin/cli.js"`. 또는 lint 가 ./prefix 존재 시 fail | 정규식 `/^\.\//` 매칭 시 fail. node script: `Object.values(pkg.bin || {}).every(p => !p.startsWith('./'))` | **fail** → block publish + fix-then-retry (./prefix 제거). **pass** → proceed to bin-file-exists-check |
| **bin-file-exists-check** | bin-path-prefix-strip pass 직후 (publish 직전) | 각 bin 경로 file 실존 확인 — repo root 기준 path resolve 후 `fs.existsSync(resolvedPath)`. 추가로 publish artifact 에 포함되는지 확인 — `files[]` 화이트리스트 매칭 또는 `npm publish --dry-run` 의 file list 에 등장 | `Object.entries(pkg.bin || {}).every(([name, p]) => fs.existsSync(path.resolve(repoRoot, p)))`. dry-run 시 file list 에 bin path 등장 확인 | **fail** → block publish + fix (files[] 추가 or build 산출물 path 수정 or bin 경로 정정). **pass** → bin 검증 완료, parent macro §2.1 EG #6 통과로 §2.1 EG #7 (link-integrity) 진입 |

**Conditional skip**: package 의 bin 필드 자체가 *없는* 경우 (library-only package) → 본 entry 전체 skip-conditional. Decision branch 의 **skip** path 명시.

**Note**: 양 micro atom 은 단일 mezzo entry 의 sequential 2-step check 로 구현 가능 — micro 분리 의무는 hook spec (v0.2+) 시점에 PreToolUse trigger 분리 가능성 (예: bin-path-prefix-strip 은 IDE 작성 시점 lint, bin-file-exists-check 는 publish 직전 gate) 기준. 본 ratification 시점은 단일 mezzo 로 충분.

## §3. Sister Surface / Cross-Reference

**Hub release.md (cd5e6be)** ⑤ bin 항목이 본 entry 의 hub-scale 경량 instance — Greatpractice §10.4 Adoption Mode 표의 "Schema only" 채택. 정합 + 권장.

**Conditional applicability 표** (본 entry 가 적용되는 범위):

| Package shape | Applicability | Detail |
|---|---|---|
| CLI tool (npm/등 bin 필드 사용) | **applicable** | 본 entry 양 micro atom 적용 — fixed-value check + file exists check |
| Library-only (bin 필드 없음) | not applicable | skip-conditional — 본 entry 전체 우회 |
| Hybrid (library + 동봉 CLI) | applicable | bin 필드 있는 부분만 적용 |
| Monorepo workspace | applicable per-package | 각 workspace package 별 독립 평가 |

**EG inner side**: 현재 EG inner public repo 가 CLI tool 미배포 (collab client cjs script 는 별도 직접 실행, npm bin 매핑 미사용) — 본 entry own evidence 누적은 EstreUX 등 향후 CLI publishing package 에 적용 시 누적 예정.

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (inherit from parent macro + own delta)

| Axis | Parent macro | This mezzo | Rationale (own delta) |
|---|---|---|---|
| frequency | 5/5 | **2/5** | bin 필드 작성 시점만 — release cycle 의 매 cut 마다는 아님 (initial CLI bin 설계 + 변경 시점) |
| depth | 4/5 | **3/5** | 단일 manifest 표면 (package.json bin) — parent 의 multi-surface 보다 좁음 |
| recency | 5/5 | **5/5** | 2026-06-04 incident → 2026-06-05 fix → 2026-06-06 ratify, parent 와 동일 cycle |
| cost | 5/5 | **4/5** | npm CLI 첫인상 영구성 + 명령 인식 실패 직격 — parent 의 multi-surface 누적 cost 보다 1단계 낮음 |
| predictability | 4/5 | **5/5** | 기계적 fixed-value check + fs.existsSync — judgement-zero, parent 의 partial dependency 보다 명확 |

**Sum: 19/25 ≥ 18 threshold ✓** (barely passes; predictability 5 + cost 4 driver)

### §4.2 Notability gate 3-criterion

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ✓ (inherit) | parent macro 의 16+ EG instances + hub instance backing — 본 entry 의 specific surface 는 hub 1 instance + post-codify N=1 (0.4.0) |
| independent_triggers ≥ 2 | ✓ (inherit) | EG cycle ship phase + hub package publish phase — parent 와 동일 backing |
| verifiable effect | ✓ | bin invalid → CLI 명령 인식 실패 (직접 측정 가능, install 후 `which <cmd>` 또는 exit code) |

### §4.3 phronesis_boundary check

| Boundary criterion | Result |
|---|---|
| rare | ✗ — CLI tool 배포 시 매번 |
| high-context | ✗ — cross-package isomorphic |
| judgement-heavy | ✗ — 기계적 fixed-value + fs.existsSync |

**phronesis_boundary 외 영역. Codify-eligible.**

## §5. Hook Spec Candidates (v0.2+ 구현 예정)

본 entry 의 fixed-value + fs check 는 hook 자동화에 적합해요.

### §5.1 PreToolUse hook — bin-path-prefix-lint

- **Trigger**: Edit/Write tool 이 `package.json` 의 `bin` 필드 작성/수정 시
- **Check**: 정규식 `/^\.\//` 매칭 시 fail — `Object.values(pkg.bin || {}).find(p => p.startsWith('./'))`
- **Action**: warn + suggest fix (./prefix 제거) — strict mode 옵션 시 block

### §5.2 PostToolUse hook — bin-file-exists-gate

- **Trigger**: Bash tool 이 `npm publish` (또는 `npm publish --dry-run`) 실행 직전
- **Check**: `Object.entries(pkg.bin || {}).every(([name, p]) => fs.existsSync(path.resolve(repoRoot, p)))` + dry-run output file list 에 bin path 등장
- **Action**: fail 시 block publish + surface 명령 결과 (어떤 bin 경로가 누락인지)

**Hook 구현 stage**: v0.2+ batch — 본 ratification 시점 (v0.1) 은 spec 만 명시, 실제 hook code 는 후속.

## §6. Surface Registry

본 entry frontmatter `surfaces[]` 의 풀이:

| Surface | Kind | Inherits freshness | Detail |
|---|---|---|---|
| greatpractice/macro/release-cadence.md | parent | ✓ true | parent macro 의 freshness_until 2026-12-03 상속 |
| (hub-repo)/release.md | external-sister | ✗ false | hub own evolution — bin ⑤ 항목 cross-link, 양방향 reference 권장 (hub owner 결정 영역) |

**N-way sync 관점**: parent macro AGENTS.md §5.8 N-way sync registry 의 직접 항목 없음 — 본 entry 는 *package.json bin* 단일 표면 검증 entry 라 sync 대상 multi-surface 가 아님. publish 시점의 single-manifest gate.

**부수 surface** (frontmatter 미등재, comment 만):
- EG-inner `EstreGenesis/package.json` (현재 bin 필드 없음 — applicability skip)
- 향후 EstreUF/등 추가 CLI-tool package 진입 시 own evidence accumulation surface 추가 가능

## §7. Acknowledged Risk + Future Work

### §7.1 한계 (acknowledged risk)

- **N=1 own data**: 본 entry 의 own evidence 는 EstreUX 0.4.0 N=1 single data point (parent 의 23/25 + cross-axis backing 으로 inherit ratification). 추가 CLI publishing release (EstreUX 0.5+, 또는 향후 EG inner CLI package) 에서 N=2/N=3 누적 시 maturation 보강.
- **Conditional applicability scope 좁음**: bin 필드 있는 package 만 — EG inner 가 현재 CLI tool 미배포라 own evidence 누적 felé 느림. parent macro 의 18-month freshness_until 동안 N=2 도달 못 할 수 있음.
- **Hook 미구현**: §5 spec 만 ratified, 실제 PreToolUse / PostToolUse hook code 는 v0.2+ batch 예정. ratification 시점 enforcement 는 *수동 체크리스트* (parent macro §2.1 EG #6 항목 사람 확인).
- **Sister cross-link 미확립**: hub release.md ⑤ bin 항목 ↔ 본 entry 양방향 reference 는 hub owner 결정 영역 — 단방향 surfaces[] 등재만 ratification 시점에 확립.

### §7.2 Micro decomposition candidates (v2.5.62+ batch)

§2 표의 2 행이 micro atom candidates — children comment 와 일치:

1. **bin-path-prefix-strip** (micro): ./prefix 제거 fixed-value check — 정규식 `/^\.\//` 매칭 lint. PreToolUse hook 대상.
2. **bin-file-exists-check** (micro): bin 경로 file 실존 + publish artifact 포함 확인 — `fs.existsSync` + dry-run file list 매칭. PostToolUse hook 대상.

각 micro entry 는 ~150줄 frontmatter + 본문 (command/check/decision 3-tuple narrow surface) 으로 v2.5.62+ batch 작성 예정.

### §7.3 Hook 구현 stage (v0.2+)

- **v0.2.0**: §5.1 PreToolUse `bin-path-prefix-lint` 구현 — Edit/Write tool intercept + package.json bin 필드 검출 + 정규식 검증
- **v0.2.1**: §5.2 PostToolUse `bin-file-exists-gate` 구현 — Bash tool `npm publish` intercept + fs.existsSync 검증
- **v0.3.0**: strict mode 옵션 추가 — warn → block 전환

본 hook stage 는 Greatpractice 모듈 전반의 hook 아키텍처 (PreToolUse / PostToolUse / Stop / SubagentStop 등) 정착 후 batch 구현.
