---
# === v0.1 lint-required ===
id: n-way-sync-registry
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "version bump committed (any surface) — release cut 작업 중 첫 surface bump 시점"
  then: "AGENTS.md §5.8 N-way sync 등록부 traversal — 등록부의 *모든* 표면 (badge / README Current EN+KO / CHANGELOG EN+KO / docs/index.html hero / docs/shared/data.js meta / marketplace.json plugins[] / plugin.json / package.json — applicable surfaces only) 을 같은 commit 안에 동시 갱신; 부분 누락 시 차단"
  format: command-check-decision
  source: cross-axis-inheritance
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: N-Way Sync Registry — Version Bump All-Surfaces Discipline
slug: n-way-sync-registry
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - greatpractice/macro/release-cadence.md §2.1 EG #1-4 (version + README + CHANGELOG + N-way sync registry traversal — 4 rows unified into one mezzo scope)
  - memory/feedback_release_versioning_cadence.md (EG phase_3 16+ docs/promo sync miss across cycles)
  - EstreUX 0.3.0 publish incident (2026-06-04) — version bump 누락 (package.json 0.2.0 그대로) + README stale + 부분 surface drift (4 omissions, 그 중 #1+#2+#3 본 mezzo scope)
  - EstreUX 0.4.0 publish (2026-06-05) — post-codify dogfood N=1, 0 omissions (9-item checklist 사전 적용, 본 mezzo scope 도 동시 통과)
  - hub release.md (cd5e6be) schema items ①version + ②changelog + ③readme (sister-surface, hub-validated)
  - AGENTS.md §5.8 N-way sync 등록부 (sync registry SSoT — EG 릴리스 버전 row + Hyperbrief 모듈 버전 row)

evidence_quality: high
recommendation_strength: SHOULD

maturity_score:
  frequency: 5
  depth: 5
  recency: 5
  cost: 5
  predictability: 4
  # sum: 24/25 ≥ 18 threshold ✓ (parent 23/25 inherit + depth +1 — 본 mezzo 가 multi-surface concurrent bump 의 핵심 강제 지점이라 depth 가중 합리)

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
  - {kind: external-anchor, path: AGENTS.md §5.8, inherits_freshness: false}
  - {kind: external-sister, path: "(hub-repo)/release.md", inherits_freshness: false}

parent:
  - greatpractice/macro/release-cadence
children:
  # Micro decomposition planned — v2.5.62+ batch ratification
  # - greatpractice/micro/version-bump-all-surfaces.md (pending — fixed-value check across all registered surfaces in one commit)
  # - greatpractice/micro/changelog-en-ko-pair.md (pending — EN + KO sections both updated, fixed-value check)
  # - greatpractice/micro/readme-current-line-sync.md (pending — README Current EN + KO + badge + version line same-commit sync)

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
  maturation_gate_score: 24/25
  post_codify_evidence:
    n_data_points: 1
    validation_status: 'inherited from parent macro at ratification (EstreUX 0.4.0 N=1, 4→0 omission reduction includes 본 mezzo scope items #1+#2+#3); own N=0/1 data points pending v2.5.62+ post-codify monitoring of EG-side release cycles'
  acknowledged_risk:
    - 'batch ratification at N=0 own data — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism backing (humanities §1.7 + sre §1.5 + management §1.10 + canonical §1.6 4축 convergence)'
    - 'AGENTS.md §5.8 N-way sync 등록부 자체가 SSoT — 등록부 stale 시 본 mezzo 의 traversal 도 stale (등록부 자체의 PostToolUse hook 으로 신규 surface 등재 강제 필요, v0.2+)'
    - 'micro decomposition (children 3 atom candidate) 아직 미작성 — v2.5.62+ batch'
---

# N-Way Sync Registry — Version Bump All-Surfaces Discipline

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger*). Promoted from parent macro `greatpractice/macro/release-cadence.md` 의 §2.3 mezzo decomposition candidate list 의 첫 항목으로, v2.5.61 batch ratification cycle 에 동시 진입. parent macro 의 EG #1-4 (version bump + README + CHANGELOG + N-way sync registry traversal) 4행을 본 mezzo 의 unified scope 로 통합. **Ratification acknowledgement**: 본 entry 는 own evidence N=0 상태에서 parent macro N=1 + 4축 cross-axis convergence inheritance 기반 batch ratification — 후속 EG release cycle 의 본 mezzo 적용 dogfood 로 own evidence 누적 예정.

## §1. Problem Surface

Release cut 시점 *첫 surface* (예: `package.json` version field) 를 bump 한 순간, AGENTS.md §5.8 N-way sync 등록부에 등재된 *모든 동조 surface* 가 같은 commit 안에 동시 갱신되어야 해요. 그러나 첫 surface bump 의 흥분 + 등록부 traversal 의 mechanical-but-tedious 특성 때문에 자주 부분 누락이 발생해요. 부분 누락은 npm/docs/marketplace 등 외부 표면이 stale 상태로 굳어 사용자가 잘못된 version 인상을 받게 만들어요.

**본 mezzo scope 의 narrow surface**:

- AGENTS.md §5.8 N-way sync 등록부 = sync registry SSoT (등록부에 새 표면 추가 시 본 mezzo 의 traversal 도 확장됨).
- 현 등록부 row 2개 — (a) EG 릴리스 버전 row: README badge + docs/index.html hero badge + docs/shared/data.js meta.version + CHANGELOG 신규 항목 (b) Hyperbrief 모듈 버전 row: Hyperbrief.md frontmatter + plugin.json + renderers/mcp package.json + marketplace.json plugins[] + docs/hyperbrief.html hero badge + meta + docs/index.html 카드 module-tag.
- parent macro EG #1 (version bump all surfaces) + #2 (README sync EN+KO Current 라인) + #3 (CHANGELOG EN+KO entry) + #4 (N-way sync registry traversal) 4행이 본 mezzo 의 통합 scope.

**Evidence accumulation**:

- **EG-side**: phase_3 cycle 동안 16+ docs/promo sync miss 누적 (memory/feedback_release_versioning_cadence.md). 매 cut 시 badge bump · CHANGELOG · docs/index.html hero · data.js meta · README Current 라인 의 동시 갱신이 본격적 cadence 정착 전에 빈번하게 부분 누락.
- **Hub-side (sister surface)**: 2026-06-04 EstreUX 0.3.0 npm 첫 publish 시 version bump 누락 (package.json 0.2.0 그대로) + README stale + CHANGELOG entry 누락 — 본 mezzo scope 의 3개 항목 (#1 + #2 + #3) 이 omissions 4개 중 3개를 차지. User 가 직접 catch + hub release.md commit cd5e6be 로 codify.
- **Post-codify N=1**: EstreUX 0.4.0 publish (2026-06-05) — 본 mezzo scope items 모두 통과 (version 0.3.0 → 0.4.0 전 surface 동시 bump + CHANGELOG entry + README version 라인 동기).
- **Cross-axis isomorphism**: parent macro 의 §6 reference (humanities §1.7 Gawande WHO Safe Surgery read-do checklist + sre §1.5 release-preflight + management §1.10 standard work + canonical §1.6 dual-mode-edit-policy) 4축 convergence inherit.

## §2. Practice Body — Command / Check / Decision 3-tuple

본 mezzo 의 §2 표가 micro atom 후보 enumeration. 각 행이 v2.5.62+ micro batch ratification 시 독립 entry 로 분해 예정.

| # | Micro Atom | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|---|
| 1 | version-bump-all-surfaces | 첫 version field 변경 시점 (예: package.json `"version"` 또는 README badge 라인 첫 bump) | AGENTS.md §5.8 등록부 traversal — EG 릴리스 버전 row 4 surface + (해당 시) Hyperbrief 모듈 버전 row 7 surface 모두 같은 commit 안에 fixed-value 동기 갱신 | git diff staged 에서 등록부 row 의 모든 surface path 가 staged 상태인지 확인 — `grep -l "<old_version>"` 으로 stale path 0건 확인 | proceed (모두 staged + stale 0건) / **block** (부분 누락 → 누락 path 명시 후 작업자 추가 stage 요구) / escalate (등록부 자체 stale 의심 시 — 새 surface 가 추가되었는데 등록부 미반영) |
| 2 | changelog-en-ko-pair | CHANGELOG.md 신규 entry 작성 시점 | EN section + KO section 양쪽에 같은 version + 같은 dense 1줄 변경 요약 (언어만 다름) 동시 추가 | git diff 에서 CHANGELOG.md 의 EN section + KO section 모두 신규 version heading 추가됨을 fixed-value 확인 — EN-only or KO-only 단편 commit 차단 | proceed (EN + KO 양쪽 entry 존재) / **block** (한쪽만 작성 → 누락쪽 추가 요구) / skip-conditional (EG-only-internal cut 으로 CHANGELOG 자체 미작성 결정 시 — 예: maint 패치 cut) |
| 3 | readme-current-line-sync | README.md Current 라인 또는 badge 라인 변경 시점 | README.md 의 (a) badge version 라인 + (b) "Current" EN 표기 라인 + (c) "Current" KO 표기 라인 모두 같은 version 으로 fixed-value 동기 갱신 | `grep "<old_version>"` README.md → 0 hits 확인 + `grep "<new_version>"` README.md → ≥ 3 hits (badge + EN + KO) 확인 | proceed (3 hits 이상 + stale 0건) / **block** (stale 잔존 시 — 잔존 위치 명시 후 작업자 갱신 요구) |

**§2 보충**: 위 3 atom 은 본 mezzo scope (parent #1 + #2 + #3) 의 강제 가능 layer. parent #4 (N-way sync registry traversal 자체) 는 atom #1 의 "AGENTS.md §5.8 등록부 traversal" 명령 안에 implicit 으로 포함 — 즉 §2 의 3 atom 이 §1 + §2 + §3 + §4 의 4행을 모두 cover. 별도 atom 미분리 (실효 atom = 3개, parent 의 4행을 3 atom 으로 압축).

## §3. Sister Surface / Cross-Reference

- **Parent macro** (`greatpractice/macro/release-cadence.md`): 본 mezzo 의 직속 부모. parent §2.1 EG #1-4 행이 본 mezzo §2 의 3 atom 으로 재구성됨. parent 의 23/25 evidence + cross-axis inheritance 가 본 mezzo 의 ratification 정당성 backing.
- **External anchor** (`AGENTS.md §5.8`): N-way sync 등록부 자체. 본 mezzo 의 traversal 명령은 본 등록부의 row enumeration 에 의존. 등록부 자체 stale 시 본 mezzo 도 stale — v0.2+ 에서 등록부 자체에 PostToolUse hook 부착 검토 (신규 surface 추가 시 본 mezzo 의 atom #1 표가 자동 갱신되도록).
- **External sister** (hub release.md cd5e6be): hub-side 9-item ratified checklist 의 ①version + ②changelog + ③readme 가 본 mezzo scope 와 isomorphic. Hub instance 는 "Schema only" 채택 (5-axis gate + 7-event hook 풀세트 도입 없이 checklist + memory 경량 반영, Greatpractice §10.4 Adoption Mode). 양방향 cross-link 는 hub owner 결정 영역.

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (parent inherit + own delta)

| Axis | Parent Score | Own Δ | Own Score | Rationale (own delta) |
|---|---|---|---|---|
| frequency | 5/5 | 0 | 5/5 | parent 동등 — 매 release cycle 마다 본 mezzo 도 trigger |
| depth | 4/5 | +1 | 5/5 | 본 mezzo 가 multi-surface concurrent bump 의 *핵심 강제 지점* — depth 가중 합리 (EG row 4 surface + Hyperbrief row 7 surface 동시 traversal) |
| recency | 5/5 | 0 | 5/5 | parent 동등 — 2026-06-06 batch ratification 현 시점 |
| cost | 5/5 | 0 | 5/5 | parent 동등 — sync miss × N surfaces × multi-cycle 누적 cost |
| predictability | 4/5 | 0 | 4/5 | parent 동등 — 체크리스트화 가능 + judgement-light, -1 = 등록부 자체 row 별 partial dependency |

**Sum: 24/25 ≥ 18 threshold ✓** (parent 23/25 + depth +1)

### §4.2 Notability gate 3-criterion (parent inherit)

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ✓ | parent inherit — EG 16+ instances + hub 1 explicit incident 중 본 mezzo scope (#1+#2+#3) 가 hub omissions 4개 중 3개를 차지 |
| independent_triggers ≥ 2 | ✓ | parent inherit — EG cycle ship phase + hub package publish phase, 다른 surface + 다른 environment + 다른 work-domain |
| verifiable effect | ✓ | parent inherit — `grep stale version` count 측정 가능, post-checklist hit/miss matrix 비교 가능 (EstreUX 0.3.0 → 0.4.0: 본 mezzo scope omissions 3 → 0) |

### §4.3 phronesis_boundary check

parent 와 동일 — rare ✗ + high-context ✗ + judgement-heavy ✗ → **phronesis_boundary 외, codify-eligible**.

## §5. Hook Spec Candidates (v0.2+)

본 mezzo 의 강제 가능 layer 가 hook 으로 자동화될 후보:

- **PreToolUse fixed-value (Edit/Write on version-bearing files)**: 작업자가 첫 version field 변경 시점에 발동. AGENTS.md §5.8 등록부 traversal 후 stale path 가 staged 가 아닐 시 차단. (atom #1 + #3 자동화)
- **PostToolUse hook (git commit)**: commit message 가 `chore(release):` 패턴 매칭 시 발동. 등록부의 모든 row 의 surface 가 commit diff 에 포함되었는지 fixed-value 확인. 누락 시 commit 직후 warning surface (revert 권고). (atom #1 + #2 자동화)
- **PostToolUse hook on AGENTS.md edit (§5.8 row 추가/수정)**: §5.8 등록부 자체 변경 시 발동 — 본 mezzo 의 §2 표 atom #1 traversal 명령이 새 surface 를 반영하도록 micro entry `version-bump-all-surfaces.md` 의 surfaces 목록 갱신 강제 (등록부와 mezzo 의 surface 목록 isomorphism 유지).

**구현 stage**: v0.2 단계에서 micro decomposition (children 3 atom) 완료 후, atom 별 hook spec 상세화 + Claude Code `.claude/settings.local.json` hooks 등재.

## §6. Surface Registry

본 entry 의 frontmatter `surfaces[]` 3개:

1. **parent** (`greatpractice/macro/release-cadence.md`) — inherits_freshness=true. parent 의 freshness_until 갱신 시 본 mezzo 도 freshness 연장.
2. **external-anchor** (`AGENTS.md §5.8`) — inherits_freshness=false. 본 mezzo 의 *데이터 원천*. 등록부 row 가 SSoT, 본 mezzo 의 §2 atom #1 명령이 그 SSoT 를 traversal.
3. **external-sister** (`(hub-repo)/release.md`) — inherits_freshness=false. hub-side own evolution path. 양방향 cross-link 는 hub owner 결정.

**N-way sync 관점**: 본 mezzo 자체가 parent macro AGENTS.md §5.8 등록부의 *EG 릴리스 버전 row + Hyperbrief 모듈 버전 row* 의 traversal 강제 entry. 즉 본 mezzo 는 등록부의 *meta-traversal* 역할 — 등록부의 모든 row 를 동시 적용하는 mezzo. 별도 row 가 추가될 때 본 mezzo 의 §2 atom #1 표가 자동 확장되도록 v0.2+ hook 설계.

**Parent §5.8 N-way sync registry 인용 (parent 의 §5.8 표 발췌)**:

> | 기능 | 표면 | sync 규율 |
> |---|---|---|
> | EG 릴리스 버전 | inner/README.md badge · inner/docs/index.html hero badge · inner/docs/shared/data.js meta.version · inner/CHANGELOG.md 신규 항목 | 같은 커밋에 모두 갱신 |
> | Hyperbrief 모듈 버전 | inner/Hyperbrief.md frontmatter · plugin.json · renderers/mcp package.json · marketplace.json plugins[] · docs/hyperbrief.html hero badge + meta + docs/index.html 카드 module-tag | 같은 cut 에 모두 bump |

본 mezzo 가 위 등록부 row 의 "같은 커밋/cut 에 모두 갱신" 규율의 *기계적 강제 entry*.

## §7. Acknowledged Risk + Future Work

**한계**:

- 본 mezzo 의 own evidence N=0 — parent macro 의 N=1 + 4축 cross-axis inheritance 에 의존. 후속 EG release cycle 의 본 mezzo 적용 dogfood 로 own N=1+ 누적 예정.
- AGENTS.md §5.8 등록부 자체가 SSoT — 등록부 stale 시 본 mezzo 의 traversal 도 stale. 등록부 자체의 PostToolUse hook (v0.2+) 으로 신규 surface 등재 강제 필요.
- 본 mezzo 가 등록부 row 의 *traversal* 만 강제, row 의 *정확성* (예: data.js meta.version 의 필드 이름이 정말 `meta.version` 인지) 은 강제 안 함. row 의 fixed-value 정확성은 micro atom layer 에서 강제.

**Micro decomposition 후보** (v2.5.62+ batch ratification):

- `greatpractice/micro/version-bump-all-surfaces.md` — atom #1 atomic entry. AGENTS.md §5.8 등록부 모든 row 의 모든 surface 를 같은 commit 에 fixed-value 동시 갱신, stale path grep 0건 확인 강제.
- `greatpractice/micro/changelog-en-ko-pair.md` — atom #2 atomic entry. CHANGELOG.md EN section + KO section 모두 신규 version heading 존재 fixed-value 확인.
- `greatpractice/micro/readme-current-line-sync.md` — atom #3 atomic entry. README.md badge + Current EN + Current KO 모두 같은 version, stale grep 0건 확인.

**v0.2+ hook 구현 stage**:

1. micro decomposition 완료 (v2.5.62+).
2. micro atom 별 hook spec 상세화 — PreToolUse + PostToolUse 패턴 결정.
3. Claude Code `.claude/settings.local.json` hooks 등재 + dogfood test (EG 자체 release cycle 에 적용).
4. dogfood N=2/N=3 evidence 누적 후 본 mezzo + 3 micro atom 의 `_ratified_state.post_codify_evidence.n_data_points` 갱신.
