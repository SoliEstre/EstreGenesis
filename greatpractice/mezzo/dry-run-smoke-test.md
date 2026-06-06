---
# === v0.1 lint-required ===
id: dry-run-smoke-test
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "package publish 직전 (npm/pip/cargo/등 distribution manifest 가 있는 release cut)"
  then: "execute dry-run command for file list + size pre-check, then run minimal import + invoke 1회 against the dist artifact, confirm exit 0"
  format: command-check-decision
  source: cross-axis-inheritance
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Dry-Run + Smoke Test — Pre-Publish Final Gate
slug: dry-run-smoke-test
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - greatpractice/macro/release-cadence.md §2.1 EG #8 (hub ⑦ dryrun)
  - EstreUX 0.4.0 publish (2026-06-05) — post-codify dogfood N=1, `npm publish --dry-run` 19 files / 118.4KB 사전 확인 (publish 전 final gate)
  - hub release.md (cd5e6be) — Pre-publish 9-item ratified checklist 항목 ⑦ dryrun
  - reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight-checklist — dry-run as canary precursor)
  - reports/2026-06-04-greatpractice-research/axes/humanities.md §1.7 (Gawande WHO Safe Surgery — final pause point before irreversible step)

evidence_quality: high
recommendation_strength: SHOULD

maturity_score:
  frequency: 3
  depth: 4
  recency: 5
  cost: 4
  predictability: 5
  # sum: 21/25 ≥ 18 threshold ✓
  # frequency -2 from parent 5/5: conditional applicability (package publish only — source-only release N/A)
  # depth -0: 2-stage gate (file list review + smoke import) 자체가 mezzo-적정 depth
  # recency =5: 0.4.0 post-codify N=1 직접 instance
  # cost -1: dry-run miss 의 cost 가 macro-tier 보다 작음 (publish 직전 final gate 의 last-line-of-defense; preceding checklist 항목들이 1차 필터)
  # predictability +1: 100% 기계화 가능 (--dry-run exit code + smoke import exit 0)

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
  # Micro decomposition planned — scheduled v2.5.62+ ratification batch
  # - greatpractice/micro/dry-run-file-list-review.md (pending — --dry-run 출력의 파일 list user review)
  # - greatpractice/micro/smoke-import-invoke-exit0.md (pending — dist artifact import + 1 invoke + exit 0 check)

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
  maturation_gate_score: 21/25
  post_codify_evidence:
    n_data_points: 1
    validation_status: 'inherited from parent macro at ratification (EstreUX 0.4.0 dry-run 19 files / 118.4KB 사전 확인 + post-publish smoke verified); own N=1 data point applied via parent dogfood instance; N=2/N=3 pending v2.5.62+ post-codify monitoring'
  acknowledged_risk:
    - 'batch ratification at N=1 own data (parent dogfood instance inherited) — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism (sre release-preflight + humanities WHO final pause) backing'
    - 'conditional applicability — package publish (npm/pip/cargo/등) 만 적용, source-only release (docs deploy / spec cut / 내부 tool) 는 skip. 적용 범위 좁아 own evidence 누적 느림 — maturation N=2/N=3 도달까지 추가 publishing 이벤트 필요'
    - 'micro decomposition (children: dry-run-file-list-review + smoke-import-invoke-exit0) 아직 미작성 — v2.5.62+ batch'
    - 'smoke test 의 "minimal usage" 범위가 dist artifact 별 다양 (CLI bin vs library import vs Python entry point vs npm package main) — case-by-case judgement 일부 잔존, 완전 기계화는 micro 단에서 더 명세 필요'
---

# Dry-Run + Smoke Test — Pre-Publish Final Gate

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger*). Promoted as part of v2.5.61 batch decomposition of parent macro `greatpractice/macro/release-cadence.md`. **Ratification acknowledgement**: 본 entry 는 parent macro 의 23/25 evidence (EstreUX 0.3.0 → 0.4.0, 4 → 0 omission reduction) 와 cross-axis isomorphism (sre §1.5 release-preflight + humanities §1.7 Gawande final pause) 를 inherit 한 상태에서 own N=1 (0.4.0 dry-run 19 files / 118.4KB instance) 으로 batch ratified. Conditional applicability (package publish 한정) 으로 own evidence 누적 속도는 parent 보다 느려요. Micro 분해 (2 atom — `dry-run-file-list-review` + `smoke-import-invoke-exit0`) v2.5.62+ batch 로 예정.

## §1. Problem Surface

Package publish 직전 마지막 gate. Preceding 9-item checklist (version + README + CHANGELOG + N-way sync + files[] + bin + link integrity) 가 모두 pass 했더라도, *실제 배포되는 artifact 의 모양* 이 의도와 일치하는지 publish 명령 실행 전 한 번 더 확인하는 last-line-of-defense 예요. Publish 후의 정정 cost (npm unpublish 72h 제한 + cache 잔존 + 사용자 첫 인상 고착) 가 비대칭으로 크기 때문에, dry-run + smoke 의 비용 (수십 초 ~ 1-2 분) 이 압도적으로 정당화돼요.

**Specific surface (parent §2.1 EG #8 narrow)**:

- **File list pre-confirmation**: `npm publish --dry-run` 류 명령으로 실제 packaged 될 파일 list + 총 크기 사전 출력. files[] 화이트리스트 (EG #5 의 mezzo `package-files-validate`) 가 의도한 set 과 일치하는지 user 가 직접 review. 의외 항목 (test fixture / .DS_Store / node_modules 잔재) 포함 시 차단.
- **Smoke import + invoke**: dist artifact 의 minimal happy-path usage (예: CLI bin `--version` / library `require()` + 1 method call / Python `import` + entry point invoke) 를 별도 환경 (tarball 또는 임시 install) 에서 1회 실행, exit code 0 확인. Build artifact 의 packaging structure (entry point 경로 / 의존 누락 / bundling 실패) 가 dev 환경에서는 통과해도 packaged form 에서 깨질 수 있어요 (post-build / pre-publish 간극).

**Evidence accumulation**:

- **EG-side own instance (N=1)**: EstreUX 0.4.0 publish (2026-06-05) — `npm publish --dry-run` 사전 실행 → 19 files / 118.4KB 출력 → files[] 화이트리스트 (NOTICE 378B + LICENSE + bin + dist) 의도 일치 확인 → publish 명령 진행. 0 omissions 달성에 기여.
- **Hub-side (sister)**: hub release.md (cd5e6be) Pre-publish 9-item ratified checklist 항목 ⑦ dryrun — 동일 trigger/then schema.
- **Cross-axis isomorphism**: sre §1.5 release-preflight-checklist (dry-run as canary precursor — irreversible step 전의 reversible mirror) + humanities §1.7 Gawande WHO Safe Surgery (final pause point before incision — read-do checklist 의 last item).

## §2. Practice Body — Command / Check / Decision 3-tuple

| Micro atom | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|
| **dry-run-file-list-review** | package publish 직전 (npm/pip/cargo/등) — preceding 9-item checklist 전부 pass 후 | `npm publish --dry-run` 또는 동등 (`pip wheel . && unzip -l`, `cargo package --list`, etc.) | (a) exit code 0, (b) 출력된 파일 list 가 files[] 화이트리스트와 일치, (c) 총 크기가 예상 범위 (이전 release ± reasonable delta), (d) 예상 외 항목 (test fixture / `.DS_Store` / `node_modules` 잔재 / 비밀 키 잔재) 0건 | proceed (전부 통과) / **block** (의외 항목 발견 — files[] 또는 .npmignore 수정 후 재실행) / escalate (크기 예상 범위 ×2 이상 — user gate) / skip-conditional (source-only release — package manifest N/A) |
| **smoke-import-invoke-exit0** | dry-run-file-list-review 통과 후, publish 명령 실행 직전 | tarball pack (`npm pack`) → 별도 임시 디렉토리 install → entry point 실행 (CLI: `--version` 또는 `--help`; library: `require()` + 1 method call; Python: `import` + entry point invoke 1회) | (a) install 단계 exit 0, (b) entry point 실행 exit 0, (c) stderr 에 의존 누락/경로 에러 없음, (d) 출력이 expected smoke surface (버전 문자열 / help 메시지 / 1 method 정상 반환) 와 일치 | proceed (전부 통과) / **block** (install 또는 invoke 실패 — packaging structure 또는 의존 누락 수정 후 dry-run 부터 재실행) / escalate (CLI 가 아닌 복합 artifact — smoke surface 정의 user judgement 필요) / skip-conditional (entry point 없는 pure data package — smoke 비적용) |

각 micro atom = v2.5.62+ batch 의 분해 단위. 본 mezzo 의 §5 hook spec candidates 가 이 2 atom 을 PreToolUse / PostToolUse 로 강제 가능한 형태.

## §3. Sister Surface / Cross-Reference

**Hub release.md (cd5e6be) 항목 ⑦ dryrun** — 본 mezzo 의 hub-scale 경량 instance. Hub 9-item schema 와 본 EG mezzo 의 trigger/then 정합 (parent macro §2.1 EG #8 = Hub ⑦ cross-mapping). Hub instance 가 sister surface 로 parent macro 의 `surfaces[]` external-sister 항목에 이미 등재 — 본 mezzo 는 parent 를 통한 transitive cross-link, own surfaces[] 에 직접 hub 항목 추가하지 않음 (mezzo 의 coupling minimal 화).

**Cross-axis convergence** (parent §6 inherit, 본 entry 특화 narrow):

- **sre §1.5** release-preflight-checklist — dry-run 을 *canary deployment* 의 precursor 로 위치시킴. Irreversible step (publish) 전에 reversible mirror (dry-run) 로 실재 효과를 사전 관찰.
- **humanities §1.7** Gawande WHO Safe Surgery — *final pause point* before incision. Read-do checklist 의 last item 으로 "do we proceed?" 명시. 본 mezzo 가 §5.1 gate (a) loss/external publish 의 직전 stage 와 정합.

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (parent inherit + own delta)

| Axis | Parent | Own | Rationale |
|---|---|---|---|
| frequency | 5/5 | **3/5** | parent 의 매 release cycle frequency 에서 *package publish 한정* 으로 narrow. EG side 의 모든 release 가 package publish 는 아님 (대부분 spec/docs cut). −2 |
| depth | 4/5 | **4/5** | 2-stage gate (file list review + smoke import) 자체가 mezzo-적정 depth. 동등 |
| recency | 5/5 | **5/5** | 0.4.0 post-codify N=1 직접 instance, parent 와 동일 cycle |
| cost | 5/5 | **4/5** | dry-run miss 의 cost 가 macro-tier 의 cumulative N-surface miss 보다 작음 — publish 직전 final gate 의 last-line-of-defense 로, preceding 8개 항목이 1차 필터 후의 잔여 risk 만 catch. −1 |
| predictability | 4/5 | **5/5** | 100% 기계화 가능 (`--dry-run` exit code + smoke `exit 0`) — judgement 잔존 없음 (parent 의 surface 별 partial dependency 가 본 mezzo 단에서는 conditional applicability frontmatter 로 흡수). +1 |

**Sum: 21/25 ≥ 18 threshold ✓**

### §4.2 Notability gate 3-criterion

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | ✓ | EG 0.4.0 own instance + hub release.md ⑦ instance + sre/humanities cross-axis coverage |
| independent_triggers ≥ 2 | ✓ | EG package publish phase + hub package publish phase + sre canary phase + humanities surgical pause — 다양 work-domain |
| verifiable effect | ✓ | dry-run exit code + smoke exit 0 = binary verifiable, post-codify hit/miss 측정 가능 |

### §4.3 phronesis_boundary check

| Boundary criterion | Result |
|---|---|
| rare | ✗ — package publish 시 매회 적용 |
| high-context | ✗ — 모든 package manifest 환경에서 isomorphic |
| judgement-heavy | ✗ — 100% 기계 검증 가능 (judgement 잔여는 conditional applicability 로 frontmatter 흡수) |

**phronesis_boundary 외 영역. Codify-eligible.**

## §5. Hook Spec Candidates (v0.2+ 구현 예정)

본 mezzo 가 강제 가능한 hook 사양 — Claude Code `.claude/settings.local.json` 의 PreToolUse / PostToolUse 등록 후보.

| Hook | Stage | Trigger pattern | Action | Block on |
|---|---|---|---|---|
| **pre-publish-dry-run-gate** | PreToolUse | Bash command 매칭 `^(npm\|yarn\|pnpm) publish(?!.*--dry-run)` 또는 `pip upload` / `twine upload` / `cargo publish` | (a) 직전 N turns 내 동일 cwd 에서 `--dry-run` 실행 흔적 검사, (b) 흔적 없으면 dry-run 자동 선행 실행 + 출력 surface, (c) user 검토 wait | dry-run 미실행 또는 exit code ≠ 0 |
| **post-build-smoke-invoke** | PostToolUse | Bash command 매칭 build/pack 완료 (`npm pack` / `python -m build` / `cargo build --release`) | dist artifact entry point 자동 smoke invoke (`--version` 또는 `--help` 등 minimal), exit code 확인 | smoke exit code ≠ 0 또는 stderr 에 의존 누락 패턴 |

**구현 시점**: v0.2 hook 사양 confirm + plugins/greatpractice/hooks/ 디렉토리 정착 후. 본 v0.1 단계에서는 spec candidate 로만 명시 — 강제는 §2 의 user-driven check + decision 으로.

## §6. Surface Registry

본 mezzo 의 `surfaces[]` = parent macro 1개만 (`kind: parent`, `inherits_freshness: true`). 본 mezzo 가 own freshness 갱신 시 parent 의 `freshness_until` 도 inherit 갱신.

**Parent macro §5.8 N-way sync registry 항목과의 연동**: parent macro 의 §5.8 등록부에 "EG 릴리스 버전" 행이 있어요 (`inner/README.md` badge · `inner/docs/index.html` hero · `inner/docs/shared/data.js` meta · `inner/CHANGELOG.md` 신규 항목). 본 mezzo 의 dry-run 단계가 그 registry 의 *files[] 화이트리스트* 와 directly 연동 — dry-run 출력의 파일 list 가 files[] manifest 와 일치하는지 §2 의 micro atom 1 (dry-run-file-list-review) 의 check (b) 가 검증.

**Cross-mezzo dependency**: 본 mezzo 가 의존하는 선행 mezzo 들 (parent §2.3 의 list):

- `package-files-validate` (EG #5) — files[] 화이트리스트가 본 mezzo 의 check (b) 의 ground truth
- `bin-entry-validate` (EG #6) — bin 경로 valid 가 본 mezzo 의 smoke invoke 의 entry point ground truth
- `link-integrity-check` (EG #7) — README/NOTICE link 가 본 mezzo dry-run 의 packaged content 정합성 확인 대상

이 선행 mezzo 들이 통과한 상태에서 본 mezzo 가 *최종 검증* 으로 동작.

## §7. Acknowledged Risk + Future Work

**한계**:

- Own evidence N=1 (EstreUX 0.4.0 single instance, parent 의 dogfood 와 동일 cycle). Conditional applicability (package publish 한정) 로 EG side 의 모든 release 가 본 mezzo 적용 대상은 아님 — own maturation N≥2-3 도달까지 추가 publishing 이벤트 (다음 EstreUX cut / 신규 npm package 출시) 필요해요.
- Smoke test 의 "minimal usage" 정의가 dist artifact 종류 (CLI bin / library / Python entry point / npm package main) 별로 다양. 본 v0.1 mezzo 는 case 별 judgement 일부 잔존 — 완전 기계화는 micro 단에서 entry point 종류별 template 화 필요.
- Hook 구현 미완 — v0.1 에서는 §2 의 user-driven check + decision 으로 강제. v0.2 PreToolUse / PostToolUse 도입 시 자동화.

**Micro decomposition 후보 (children, v2.5.62+ batch)**:

1. **`dry-run-file-list-review`** — `--dry-run` 출력의 파일 list + 크기 user review atom. Check: files[] 화이트리스트 일치 + 의외 항목 0건 + 크기 예상 범위. Decision: proceed / block / escalate.
2. **`smoke-import-invoke-exit0`** — dist artifact tarball pack + 임시 install + entry point invoke + exit 0 atom. Check: install exit 0 + invoke exit 0 + stderr clean + expected output. Decision: proceed / block / escalate.

각 micro atom 이 v0.2 hook spec 의 PreToolUse / PostToolUse 와 1:1 mapping 가능 — micro 단에서 hook trigger pattern 정밀화.

**v0.2+ hook 구현 stage**:

- Stage 1 (v0.2): `pre-publish-dry-run-gate` PreToolUse 구현 + npm/pip/cargo publish 패턴 매칭 + dry-run 선행 자동화
- Stage 2 (v0.3): `post-build-smoke-invoke` PostToolUse 구현 + entry point 종류별 smoke template (CLI/library/Python)
- Stage 3 (v0.4): 본 mezzo 의 children micro 와 hook 의 1:1 binding, miss_count 자동 추적 + freshness_until 갱신
