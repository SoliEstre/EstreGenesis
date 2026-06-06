---
# === v0.1 lint-required ===
id: pre-publish-user-gate
tier: mezzo
binding: lex
enforcement_level: required
trigger:
  if: "publish-equivalent command about to execute (npm publish / pip upload / git push --tags to public / deploy trigger) after all automated checks pass"
  then: "surface diff summary of major surfaces (README + CHANGELOG + version + files[]) + wait for user explicit approval — never auto-proceed (AGENTS.md §5.1 autonomous-execution gate (a) loss/external publish)"
  format: command-check-decision
  source: cross-axis-inheritance
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Pre-Publish User Gate — Autonomy Boundary Mechanism for External-Publish Actions
slug: pre-publish-user-gate
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - greatpractice/macro/release-cadence.md §2.1 EG #9 (hub ⑨ gate) — pre-publish user gate canonical row
  - AGENTS.md §5.1 autonomous-execution gate (a) — loss / external publish (push · deploy · send · delete) 명시적 인간 게이트
  - EstreGenesis/Hyperbrief.md §2 trigger rubric — escalation ≥ 4 또는 MUST-trigger 시 human decision delegation (decision-boundary 정합)
  - EstreUX 0.3.0 publish incident (2026-06-04) — 자동화 만으로 4 omissions 누설; user 직접 catch 가 final-line defense 였음 (인간 게이트의 backstop 가치)
  - EstreUX 0.4.0 publish (2026-06-05) — 9-item checklist 통과 후 user 명시 승인 → publish, 0 omissions (게이트 정상 동작)
  - phase_3 cycle observation — 모든 inner public-repo release cut (EG seed v2.4.x 부터 v2.5.x 까지) 100% user-approved before push tag/publish
  - reports/2026-06-04-greatpractice-research/axes/humanities.md §1.7 (Gawande WHO Safe Surgery — pause point + final human sign-off)
  - reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight — human approval as final gate before production deploy)

evidence_quality: high
recommendation_strength: SHOULD

maturity_score:
  frequency: 5
  depth: 5
  recency: 5
  cost: 5
  predictability: 4
  # sum: 24/25 ≥ 18 threshold ✓ (highest priority — autonomy boundary critical)

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
  - {kind: spec, path: AGENTS.md, inherits_freshness: false}
  - {kind: spec, path: EstreGenesis/Hyperbrief.md, inherits_freshness: false}

parent:
  - greatpractice/macro/release-cadence
children:
  # Micro decomposition planned (see §7) — scheduled v2.5.62+ ratification batch
  # - greatpractice/micro/diff-surface-summary.md (pending) — publish 직전 변경된 surfaces 요약 표시
  # - greatpractice/micro/user-approval-prompt.md (pending) — 명시 승인 wait (AskUserQuestion / confirm)
  # - greatpractice/micro/post-approval-publish-trigger.md (pending) — 승인 후 publish 명령 실행 + audit_trail 기록

phronesis_boundary: true
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
    validation_status: 'inherited from parent macro at ratification (EstreUX 0.4.0 publish 의 ⑨ gate 통과 데이터 포함); own N=1 backed by parent dogfood instance, additional N=2/N=3 pending v2.5.62+ post-codify monitoring'
  acknowledged_risk:
    - 'batch ratification at N=1 own data — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism backing (humanities Gawande pause point + sre human-approval gate)'
    - 'phronesis_boundary true — user 승인의 judgement 자체는 codify 불가능; 본 entry 는 gate 의 mechanism (surface diff summary + wait + post-approval trigger) 만 codify, decision 영역은 user reserve'
    - 'mechanism codification 의 한계 — surface diff summary 의 "완전성" 자체는 자동 검증이 어려움 (어떤 surface 가 major 인지 판단 자체에 phronesis 잔존); §5 hook spec 의 PreToolUse fixed-value 로 일부 보강 가능하나 완전 자동화 불가'
    - 'micro decomposition (children) 아직 미작성 — v2.5.62+ batch'
---

# Pre-Publish User Gate — Autonomy Boundary Mechanism for External-Publish Actions

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger*). v2.5.61 cycle 의 parent macro `greatpractice/macro/release-cadence.md` decomposition batch 의 일부로 ratified. **Ratification acknowledgement**: 본 entry 는 parent macro 의 23/25 evidence inheritance + own N=1 data point (EstreUX 0.4.0 ⑨ gate 통과) backing. **phronesis_boundary true** — 본 entry 가 codify 하는 것은 *gate 의 mechanism* (surface diff summary + wait + post-approval trigger) 만이고, *user 의 승인 결정 자체* 는 codify 불가능한 phronesis 영역이에요. autonomy boundary 의 정형화 — 다른 mezzo entry 들이 자동 검증으로 끝나는 vs 본 entry 가 마지막 human gate.

## §1. Problem Surface

External-publish action (npm publish · pip upload · git push --tags to public · deploy trigger 등) 은 AGENTS.md §5.1 autonomous-execution rule 의 gate (a) 에 해당해요 — *loss / external publish (push · deploy · send · delete)*. 본 gate 항목들은 자동 진행이 금지된 영역이고, user 명시 승인 없이 진행 시 **autonomy boundary violation** 으로 간주돼요.

본 entry 는 이 gate 의 *mechanism* 을 정형화해요 — 무엇을 surface 하고 (diff summary), 어떻게 wait 하고 (AskUserQuestion / explicit confirm), 승인 후 무엇을 trigger 하는지 (publish command + audit_trail 기록). user 의 *승인 결정 자체* 는 phronesis_boundary 안쪽 (시점/맥락 사용자 결정 영역) — 본 entry 는 그 결정의 *조건* 만 setup.

**Evidence accumulation (본 entry 의 specific surface 로 narrow)**:

- **EG-side**: phase_3 의 모든 inner public-repo release cut (EG seed v2.4.x 부터 v2.5.x 까지) 100% user-approved before push tag/publish — 매 cut 시 변경 surfaces 표시 + user 명시 승인 후 push 의 cadence 가 자연스럽게 형성됨. 본 entry 는 그 cadence 의 formal codification.
- **Hub-side (sister surface)**: EstreUX 0.4.0 publish (2026-06-05) — 9-item checklist 의 ① version ~ ⑧ auth 자동 검증 통과 후 ⑨ gate 에서 user 명시 승인 wait → publish. 본 항목이 final-line defense 로 작동, 자동화 통과한 잠재 omission 의 backstop.
- **Baseline (gate 미적용)**: EstreUX 0.3.0 publish (2026-06-04) — 자동화 만으로 진행 시 4 omissions 누설, user 직접 catch 가 final-line defense 였음. 본 entry 의 mechanism 정형화가 이 catch 를 systematic 으로 전환.
- **Cross-axis isomorphism**: humanities §1.7 Gawande WHO Safe Surgery 의 *pause point + final human sign-off* + sre §1.5 release-preflight 의 *human approval as final gate before production deploy* — 양축 convergence 가 mechanism 의 universal applicability backing.

## §2. Practice Body — Command / Check / Decision 3-tuple

본 §2 표는 micro atom candidates 3개 (diff-surface-summary, user-approval-prompt, post-approval-publish-trigger) 의 command/check/decision 3-tuple decomposition. 각 행이 v2.5.62+ micro entry 의 prototype 이에요.

**중요한 특수성**: 본 entry 의 모든 행의 **Decision 열이 "사용자 명시 승인 대기"** 또는 그 prerequisite — 다른 mezzo entry 들이 자동 검증 (proceed vs block) 으로 끝나는 vs 본 entry 가 마지막 human gate. Decision 의 final-line 은 항상 user 영역.

| Micro atom (candidate) | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|
| **diff-surface-summary** | publish-equivalent command 직전 — 모든 자동 검증 (parent macro 의 §2.1 EG #1-#8) 통과 후 | 변경된 major surfaces 의 diff 요약 생성 — README (EN+KO Current 라인) + CHANGELOG (EN+KO 신규 entry) + version (badge + frontmatter + plugin.json + marketplace.json + package.json + data.js meta) + files[] (npm package manifest) | summary 가 모든 major surface 의 변경을 누락 없이 포함 (frontmatter surfaces[] N-way sync registry 와 cross-check); diff 가 user-readable 형식 (file path + 변경 핵심 1-2줄) | summary 완전 시 proceed to user-approval-prompt; 누락 surface 감지 시 block + parent macro 의 N-way sync registry traversal 재실행 |
| **user-approval-prompt** | diff-surface-summary 완료 후 | user 에게 surface diff summary + publish command preview (예: `npm publish` 또는 `git push --tags`) 표시 + 명시 승인 요청 (AskUserQuestion 또는 동등 confirm mechanism) | user 의 응답이 **명시 승인** (예: "publish", "go", "승인", "진행") — 묵시적/모호한 응답 ("ok", "음...") 은 승인 미간주; user 가 추가 변경 요청 시 abort + revise loop | **승인 응답** → proceed to post-approval-publish-trigger; **abort 응답** (예: "wait", "no", "잠깐") → block + return to revise loop; **모호/무응답** → re-prompt (timeout 없음 — user 영역) |
| **post-approval-publish-trigger** | user-approval-prompt 의 명시 승인 응답 직후 | publish command 실행 (npm publish / git push --tags / 등) + audit_trail 항목 추가 (ts + user approval response + publish command + exit code) | publish command 의 exit code 0 + 외부 surface (예: npm registry / GitHub Releases) 의 publication 확인 (post-publish smoke check) | **exit 0 + 확인 성공** → done, audit_trail commit; **exit ≠ 0 또는 확인 실패** → user 에게 즉시 surface (retry vs abort 결정 user 영역) |

**phronesis_boundary 의 표면화**: 위 표의 모든 Decision 열의 final-line 이 user 영역에 의존 — diff summary 의 "완전성" 판단, 승인 응답의 "명시성" 판단, retry 결정 등. 본 entry 는 mechanism 의 frame 만 codify, decision boundary 자체는 phronesis 잔존.

## §3. Sister Surface / Cross-Reference

**Hub-side**: hub release.md (cd5e6be) 의 ⑨ gate 항목이 본 entry 의 sister surface. EstreUX 0.4.0 publish 의 ⑨ gate 통과 instance 가 own N=1 data point. hub-shared trigger/then schema:

- trigger: "publish 직전 — 모든 자동 검증 통과 후"
- then: "major surfaces (README + CHANGELOG + version + files[]) 변경 PR/diff user 검토 → user 명시 승인 시 publish"

본 entry 는 hub 의 ⑨ gate 항목을 EG-side mechanism 로 narrow + formal frame 추가 (3-tuple decomposition + phronesis_boundary 명시).

**Cross-axis convergence** (parent macro §6 inherit):

- **humanities §1.7** Gawande *Checklist Manifesto* WHO Safe Surgery — pause point + final human sign-off (수술 직전 환자/부위 confirm 의 isomorphism)
- **sre §1.5** Google SRE *Production Readiness Review* — human approval as final gate before production deploy
- **canonical §1.6** Wikipedia *dual-mode-edit-policy* — bold edit vs revert vs discuss 의 tiered strictness; 본 entry 는 most-strict tier (publish 는 revert 불가에 가까움 — npm unpublish 72h 제한 등)

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (parent inherit + own delta)

| Axis | Parent (23/25) | Own | Rationale (own delta) |
|---|---|---|---|
| frequency | 5/5 | 5/5 | 모든 release cut 에 적용 — 100% applicability (parent score 그대로 inherit) |
| depth | 4/5 | 5/5 | autonomy boundary critical — gate violation 시 cost 가 다른 항목 (e.g., naming hygiene) 보다 의미론적으로 깊음; +1 |
| recency | 5/5 | 5/5 | parent 와 동일 cycle 의 evidence |
| cost | 5/5 | 5/5 | external publish 의 영구성 + autonomy violation 의 trust cost (parent score inherit) |
| predictability | 4/5 | 4/5 | mechanism 정형화 가능하나 phronesis_boundary 의 user decision 영역 잔존 — parent 와 동일 -1 |

**Sum: 24/25 ≥ 18 threshold ✓** (parent 23/25 대비 +1, depth axis 의 autonomy boundary critical 반영)

### §4.2 Notability gate 3-criterion

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ✓ | EG side phase_3 모든 cut + hub ⑨ gate + AGENTS.md §5.1 spec 명시 |
| independent_triggers ≥ 2 | ✓ | EG cycle ship phase + hub package publish phase — 다른 surface, 다른 환경 |
| verifiable effect | ✓ | autonomy violation rate 측정 가능 (gate-skip count = 0 maintained across all cuts) |

### §4.3 phronesis_boundary check

**phronesis_boundary: true** — 본 entry 의 특수성. parent macro 와 다르게 *true*. Codify 가능한 영역 (mechanism: surface diff summary + wait + post-approval trigger) 과 codify 불가능한 영역 (user decision: 승인 결정 자체) 의 경계를 명시.

| Boundary criterion | Result | Detail |
|---|---|---|
| rare | ✗ | 빈번 (모든 release cut 적용) |
| high-context | △ partial | mechanism 은 universal, decision 은 user context 의존 |
| judgement-heavy | ✓ | user 의 승인 판단 자체는 judgement-heavy — 시점/맥락/risk-tolerance 사용자 결정 |

**Codify-eligible (mechanism only). Decision boundary preserved as phronesis.**

## §5. Hook Spec Candidates (v0.2+)

본 entry 가 강제 가능한 hook 사양 — v0.2+ 구현 예정.

### §5.1 PreToolUse hook — publish-equivalent command intercept

- **Trigger**: Bash tool call 의 command 가 publish-equivalent pattern 매칭 시 (regex: `npm publish|pip upload|twine upload|git push.*--tags|git push.*\bmaster\b.*--tags|gh release create`)
- **Action**: tool call 차단 (block) + parent macro 의 §2.1 EG #1-#8 자동 검증 status 확인 + diff-surface-summary 생성 (micro atom #1) + user-approval-prompt 발화 (micro atom #2)
- **Bypass condition**: user 가 명시 승인 응답 시 동일 command 재시도 시 통과 (post-approval flag)

### §5.2 PostToolUse hook — publish command audit_trail

- **Trigger**: publish-equivalent command 의 exit 직후
- **Action**: audit_trail 항목 추가 — ts + user approval response (verbatim, redaction 후) + publish command + exit code + post-publish smoke check 결과
- **Storage**: greatpractice/_audit/publish-trail.jsonl (append-only)

### §5.3 Hook 한계 acknowledgement

- diff-surface-summary 의 "완전성" 검증은 부분 자동화만 가능 — frontmatter surfaces[] N-way sync registry 와 cross-check 까지는 가능하나, "어떤 surface 가 major 인지" 판단 자체에 phronesis 잔존.
- AskUserQuestion mechanism 의 timeout 없음 — user 영역 우선.
- bypass condition 의 post-approval flag 가 stateful — race condition 가능성 (예: 동시 publish 명령). 단일 release cycle 가정 시 무시 가능.

## §6. Surface Registry — N-Way Sync Perspective

본 entry 의 frontmatter surfaces[] 풀이:

| surfaces[] kind | path | inherits_freshness | rationale |
|---|---|---|---|
| parent | greatpractice/macro/release-cadence.md | true | parent macro 의 freshness window (2026-12-03) inherit; 본 entry 의 own validation cadence (180d) 와 동일 |
| spec | AGENTS.md | false | autonomous-execution gate (a) 의 canonical spec — 본 entry 는 그 mechanism 의 mezzo decomposition |
| spec | EstreGenesis/Hyperbrief.md | false | escalation ≥ 4 / MUST-trigger 시 human decision delegation 의 cross-reference |

**parent macro 의 §5.8 N-way sync registry 적용 관점**: 본 entry 자체는 N-way sync registry 의 행이 아니라 (surface 가 아닌 mechanism), parent macro 의 등록부 traversal 의 **terminal node** — N-way sync 가 완전 갱신된 후 본 gate 발동. 본 entry 가 등록부의 추가 항목을 정의하지 않고, 등록부 완전성 자체를 *전제 조건* 으로 함.

## §7. Acknowledged Risk + Future Work

### §7.1 본 entry 의 한계

- **phronesis_boundary true 의 fundamental limit**: mechanism 정형화로 user decision 자체를 대체할 수 없음. 본 entry 는 *조건* (무엇을 surface 하고 어떻게 wait 할지) 만 codify, *판단* (승인 vs 거절 vs 추가 요청) 은 user 영역. mechanism 의 codification 이 user judgement 의 quality 를 보장하지는 않음.
- **N=1 own evidence at ratification**: parent macro 의 23/25 inheritance + cross-axis isomorphism backing 으로 v2.5.61 batch ratification. 자체 N=2/N=3 누적은 v2.5.62+ post-codify monitoring.
- **surface diff summary 의 "완전성" 자동 검증 한계**: §5.3 에서 명시 — major surface 판단 자체에 phronesis 잔존.

### §7.2 Micro decomposition candidates (v2.5.62+)

§2 표의 3개 micro atom candidate 가 v2.5.62+ batch 의 children entry:

- `greatpractice/micro/diff-surface-summary.md` — surface 변경 diff 의 user-readable summary 생성 (frontmatter surfaces[] cross-check + file path + 변경 핵심 1-2줄)
- `greatpractice/micro/user-approval-prompt.md` — AskUserQuestion / explicit confirm mechanism + 명시 승인 응답 detection (모호 응답 re-prompt loop)
- `greatpractice/micro/post-approval-publish-trigger.md` — publish command 실행 + audit_trail 기록 + post-publish smoke check

### §7.3 Hook 구현 stage (v0.2+)

- v0.2: §5.1 PreToolUse hook prototype (publish-pattern regex intercept + parent macro 자동 검증 status 확인)
- v0.3: §5.2 PostToolUse hook + audit_trail jsonl append
- v0.4: cross-cycle audit_trail review (autonomy violation rate 측정, gate-skip count = 0 maintained 확인)

### §7.4 Future evidence accumulation path

- N=2: 다음 EG cut publish (v2.5.62+) 의 ⑨ gate 통과 instance
- N=3: 추가 cut 또는 hub-side publish instance (cross-surface accumulation)
- N≥3 도달 시 high-confidence validation status 갱신 (parent macro 의 §4.4 post-codify evidence accumulation log 와 동일 형식)
