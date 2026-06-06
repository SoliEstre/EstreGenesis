---
# === v0.1 lint-required ===
id: auth-2fa-discipline
tier: mezzo
binding: ratio
enforcement_level: recommended
trigger:
  if: "publish command about to execute on a registry that enforces 2FA (npm/pypi/등) in an agent-driven (non-TTY) shell context"
  then: "verify TTY interactivity before invocation OR pre-fetch OTP into an explicit flag/env var; do not blindly invoke publish from non-TTY Bash — EOTP fails silently from the agent's perspective and the publish step gets retried in a broken state"
  format: command-check-decision
  source: cross-axis-inheritance
lifecycle: consolidation
last_referenced_turn: 2026-06-06T00:00:00Z

# === lint-warn ===
title: Auth Discipline — 2FA OTP Routing for Non-TTY Publish Contexts
slug: auth-2fa-discipline
created_at: 2026-06-06T00:00:00Z
ratified_at: 2026-06-06T00:00:00Z
source_evidence:
  - greatpractice/macro/release-cadence.md §2.2 EG #11 (Hub ⑧ auth) — 2FA TTY 직접 입력 / non-TTY EOTP failure mode
  - hub release.md (cd5e6be) — Pre-publish 9-item ratified checklist item ⑧ auth (sister surface, hub-validated)
  - hub 9-item schema detail (m-hub-gp-040-evidence-1780653318567) — trigger/then schema per item ⑧
  - EstreUX 0.4.0 publish (2026-06-05) — 2FA TTY 직접 입력 사용 (interactive shell, post-codify N=1 in parent macro)
  - reports/2026-06-04-greatpractice-research/axes/sre.md §1.5 (release-preflight-checklist) — auth gate as preflight criterion

evidence_quality: medium
recommendation_strength: MAY

maturity_score:
  frequency: 2
  depth: 2
  recency: 3
  cost: 5
  predictability: 5
  # sum: 17/25 — below 18 threshold; notability gate backing (criteria 2/3) + parent inheritance carries ratification

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
  # Micro decomposition planned (see §7) — scheduled v2.5.62+ ratification batch
  # - greatpractice/micro/tty-publish-check.md (pending — TTY 환경 확인 precondition)
  # - greatpractice/micro/otp-env-fallback.md (pending — non-TTY 시 NPM_OTP env var / OTP 사전 발급 fallback)

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
  maturation_gate_score: 17/25
  post_codify_evidence:
    n_data_points: 1
    validation_status: 'inherited from parent macro at ratification (EstreUX 0.4.0 publish 2FA TTY 직접 입력 통과 instance); own N=1 data point pending v2.5.62+ post-codify monitoring across next 2FA-enabled publish cuts'
  acknowledged_risk:
    - 'batch ratification at N=0 own data — parent macro 의 23/25 evidence inheritance + cross-axis isomorphism backing'
    - 'maturation_gate_score 17/25 < 18 threshold — notability gate backing (criteria 2/3) + parent inheritance 로 ratified, own N=1 evidence 누적 시 promote 검토'
    - 'conditional applicability — 2FA 활성화 + publish 명령 실행 환경에만 해당; 2FA 미활성화 또는 source-only release 는 not-applicable, 적용 범위 좁아 evidence 누적 느림'
    - 'micro decomposition (children: tty-publish-check, otp-env-fallback) 아직 미작성 — v2.5.62+ batch'
---

# Auth Discipline — 2FA OTP Routing for Non-TTY Publish Contexts

> **State**: **ratified** (Greatpractice §5.4 routing rule, path b — *user steering trigger*, batch decomposition). Promoted from parent macro `greatpractice/macro/release-cadence.md` §2.2 EG #11 (Hub ⑧) row at v2.5.61 cycle as part of 8-entry mezzo batch. **Conditional applicability**: 본 entry 는 2FA 활성화 + publish 명령 실행 환경에서만 발동 — 2FA 미활성화 registry 또는 source-only (tag-only, npm/pypi publish 미동반) release 에는 적용 안 돼요. **Ratification acknowledgement**: own evidence N=0 + maturation gate 17/25 (< 18 threshold) — notability gate 보충 통과 + parent macro inheritance 로 ratified, own data point 누적은 v2.5.62+ post-codify monitoring.

## §1. Problem Surface

npm 또는 동등 registry 가 2FA (Two-Factor Authentication) 강제하는 계정 / package 에서 `npm publish` 명령 실행 시 OTP (One-Time Password) 입력이 요구돼요. 이 OTP 입력 prompt 가 **TTY (terminal interactivity) 직접 입력 path** 를 요구 — Claude Code 의 Bash tool 같은 non-TTY shell 환경에서는 prompt 자체가 표출 안 되고 `EOTP` (OTP 누락 / 인증 실패) error 로 publish 가 실패해요.

**Failure mode 의 sneaky 한 점**:

- agent 입장에서는 `npm publish` 명령이 *실행은 됐는데 OTP 입력 단계에서 멎은 것처럼 보임* — 실제로는 EOTP error 가 즉시 반환되지만 stdout/stderr 의 형태가 agent 의 success signal pattern 과 어긋나서 retry / no-op 으로 흡수되기 쉬워요.
- npm 의 EOTP 응답은 transient error 처럼 보일 수 있어 agent 가 retry 로직으로 같은 명령 재시도 → 그래도 같은 결과 → cycle 의 publish step 이 "완료" 로 잘못 marked.
- TTY 가 있는 interactive shell 로 동일 명령 실행 시에는 prompt 가 정상 표출 → user 가 6자리 OTP 입력 → publish 성공. 즉 **환경 차이로만 발생하는 failure mode** 라 reproducibility 가 환경 의존적.

**Evidence accumulation**:

- **EG-side**: 공개 publish 자체가 아직 적어 own instance 누적 N=0 (own data points 0). parent macro 의 EstreUX 0.4.0 (2026-06-05) publish 가 2FA TTY 직접 입력으로 통과한 instance 1건 — own evidence 로는 미진.
- **Hub-side (sister surface)**: hub release.md 9-item ratified checklist 의 ⑧ auth 가 본 entry 의 hub-scale instance. hub 측 publish 사이클에서 동일 failure mode 인지 + codify.
- **Cross-axis backing**: sre.md §1.5 release-preflight-checklist 의 auth gate criterion (publish 직전 인증 path 확인). non-TTY EOTP 는 일반화된 *agent-environment vs interactive-environment* 차이 sub-case.

**왜 binding=ratio 인지**: 본 entry 는 *machine-checkable* 한 강제 (PreToolUse hook 으로 TTY 검증 또는 OTP env var presence 검증) 가능. 그러나 적용 범위 (2FA-enabled + publish-context) 가 좁아 enforcement_level=recommended (not required) + recommendation_strength=MAY (conditional). 적용 가능 context 에서는 ratio 적 강제 의미가 명확.

## §2. Practice Body — Command / Check / Decision 3-Tuple

본 mezzo entry 는 2 micro atom 으로 decomposition 후보:

| Micro atom (candidate) | Trigger | Command (수행) | Check (검증) | Decision (분기) |
|---|---|---|---|---|
| **tty-publish-check** | `npm publish` (또는 동등 명령) about to execute, target registry 가 2FA 강제 환경 | invocation 전에 현재 shell context 의 TTY 여부 사전 확인 — `process.stdout.isTTY` (node 환경) / `[ -t 0 ]` (bash, agent 환경에서 검사 불가) / agent tool 의 environment hint (Claude Code Bash = non-TTY 기본) | TTY 가 있으면 publish 명령을 direct 로 invoke (OTP prompt 가 정상 표출됨). TTY 가 없으면 **block + escalate**: 다음 micro atom (otp-env-fallback) 또는 user gate (interactive shell 로 user 가 직접 실행) 로 route. | **TTY present** → proceed direct. **TTY absent** → fallback path. **2FA disabled** → skip (not applicable). |
| **otp-env-fallback** | tty-publish-check 가 non-TTY 판정 + 본 micro atom 으로 route | publish 명령에 `--otp=<6-digit>` flag 명시 또는 `NPM_CONFIG_OTP` env var pre-set. OTP 는 사전 발급 — TOTP authenticator app 에서 user 가 직접 추출 후 agent 에 1회용으로 제공 (autonomous-execution §5.1 gate (a) — loss/external-publish gate 와 자연 합류). | OTP 가 30초 (TOTP) 또는 60초 (HOTP) window 내 valid 한지 확인. invocation 후 EOTP 가 아닌 success exit 0 + tarball uploaded 응답 확인. | **OTP valid + publish 성공** → proceed. **EOTP 반환** → OTP expired/invalid; user 에게 재발급 요청 + retry. **2회 연속 EOTP** → abort + user steering 요청 (interactive shell 로 user 가 직접 실행 권장). |

**합쳐서**: 본 mezzo 의 decision policy 는 "**TTY 있으면 직접, 없으면 OTP flag 명시, 그것도 어려우면 user 가 interactive shell 로 직접**" — 3-step fallback chain. parent macro 의 §5.1 autonomous-execution gate (a) (loss/external-publish gate) 와 자연 합류 — publish 자체가 user gate 필요한 외부 발행 action 이라 user 의 OTP 제공 또는 user 의 interactive 실행은 gate 위배 아님.

## §3. Sister Surface / Cross-Reference

**Hub release.md ⑧ auth** (cd5e6be commit) = 본 entry 의 hub-scale 경량 instance. hub 측 publish 사이클에서도 동일 failure mode 인지 + 9-item checklist 에 codify. **Cross-axis isomorphism**: agent-driven CI 환경 vs interactive developer-shell 환경의 capability 차이를 명시적으로 다루는 일반 패턴 — non-TTY 환경에서의 인증 flow 일반화 (cf. GitHub Actions secrets / npm CI tokens / 등 일반 industry practice).

**Cross-reference 정합 (proposal)**:

- 본 entry 의 surfaces[] 에 hub release.md 가 `external-sister` kind 등재 (inherits_freshness=false).
- parent (`greatpractice/macro/release-cadence.md`) 가 `parent` kind + inherits_freshness=true 등재 — freshness 가 parent 의 cadence (180 days) 를 자연 inherit.
- 향후 EG-side 의 own publish 누적 (N=1, N=2) 시 본 entry 의 own evidence 채워짐.

## §4. Maturation Gate Status

### §4.1 5-axis multi-criteria (Greatpractice §5.1) — own delta from parent

| Axis | Parent (release-cadence) | This entry (auth-2fa-discipline) | Rationale (delta) |
|---|---|---|---|
| frequency | 5/5 | **2/5** | parent 는 매 release cut 마다 동반 (16+ instances), 본 entry 는 2FA-enabled publish 에만 (own N=0, parent inherit 1) |
| depth | 4/5 | **2/5** | parent 는 multi-surface (badge / docs / data.js / package files / 등), 본 entry 는 단일 auth surface (OTP flow) |
| recency | 5/5 | **3/5** | parent 는 2026-06-05 진행 중 cycle 의 evidence, 본 entry 는 parent inherit + own data point 미누적 |
| cost | 5/5 | **5/5** | EOTP failure 시 cycle publish step 잘못 marked + retry loop + user 직접 개입 필요 — high cost. parent 와 동일 |
| predictability | 4/5 | **5/5** | TTY presence 는 binary check (있/없), OTP valid 여부도 binary — judgement-light, parent 보다 더 mechanical |

**Sum: 17/25 — *below 18 threshold***. 본 entry 의 own maturation gate 는 보통 promote criterion 미충족이지만 v2.5.61 batch ratification context 에서 **notability gate 보충 통과** + **parent macro inheritance** 로 ratified.

### §4.2 Notability gate 3-criterion (Greatpractice §5.2)

| Criterion | Result | Detail |
|---|---|---|
| significant coverage ≥ 3 | △ partial | EG side own instances 0, parent macro 의 1 instance (EstreUX 0.4.0) + hub side 1 codified instance — 합쳐서 2, threshold 미달이지만 hub-scale isomorphism 으로 보충 |
| independent_triggers ≥ 2 | ✓ | EG-side agent publish context + hub-side publish context — 다른 environment, 다른 work-domain |
| verifiable effect | ✓ | EOTP error 발생률 / TTY pre-check pass rate / OTP valid rate 등 측정 가능 |

**2/3 criterion 통과** — borderline. parent inheritance 로 보충.

### §4.3 phronesis_boundary check (Greatpractice §5.3)

| Boundary criterion | Result |
|---|---|
| rare (frequency low + context unique) | △ partial — 적용 빈도 낮지만 context unique 아님 (일반화된 환경 차이 패턴) |
| high-context (cross-context applicability low) | ✗ — cross-environment isomorphic (npm / pypi / homebrew 등 어디서나 적용) |
| judgement-heavy | ✗ — 기계적 검증 가능 (TTY check + OTP valid check binary) |

**phronesis_boundary 외 영역. Codify-eligible.**

## §5. Hook Spec Candidates (v0.2+ 구현 예정)

본 entry 가 강제 가능한 사양 — Greatpractice §8 hook layer 의 candidate:

### §5.1 PreToolUse hook — TTY presence check on publish command

**Trigger**: Bash tool invocation 의 command pattern 이 `npm publish` / `yarn publish` / `pnpm publish` / `pip upload` / `twine upload` / 등 publish 명령 match 시.

**Check**: 현재 tool execution context 가 TTY 인지 확인 — Claude Code Bash tool 의 environment hint (non-TTY 기본) 검사.

**Decision**:

- **TTY present** (interactive shell context, rare in agent env) → proceed.
- **TTY absent + command 에 `--otp=` flag 명시 안 됨 + `NPM_CONFIG_OTP` env var 미설정** → **block + warn**: "non-TTY publish 환경에서 OTP routing 미명시 — EOTP failure 가능성 높음. otp-env-fallback path 또는 user interactive shell 실행 권장."
- **TTY absent + OTP routing 명시됨** → proceed (단, EOTP 발생 시 fallback).

### §5.2 PostToolUse hook — EOTP detection + retry containment

**Trigger**: publish 명령 실행 후 stdout/stderr 에 `EOTP` / `One-time pass.*required` / `npm error code EOTP` 패턴 match 시.

**Check**: error message 의 pattern 정확히 EOTP 인지 (다른 transient error 와 구분).

**Decision**:

- **EOTP confirmed** → **block retry loop**: agent 가 같은 명령 재시도 시 같은 결과. user steering 요청 (interactive shell 또는 OTP env var 명시).
- **다른 error** → 통상 retry / 진단 path.

**구현 stage**: v0.2+ post-ratification batch — 본 entry 의 own evidence N=1+ 누적 후 hook 강제 강도 결정. 현재 v0.1 spec 에서는 recommendation 만 명시, 강제 hook 미등록.

## §6. Surface Registry

본 entry 의 frontmatter `surfaces[]` 풀이:

- **parent** (`greatpractice/macro/release-cadence.md`, inherits_freshness=true): 본 entry 의 source — parent macro 의 §2.2 EG #11 행에서 narrow 된 specific surface. freshness 가 parent cadence (180 days) inherit.
- **external-sister** (`(hub-repo)/release.md`, inherits_freshness=false): hub 측 9-item checklist 의 ⑧ auth — own evolution.

**N-way sync 관점** — parent macro 의 §5.8 N-way sync registry 표 에는 본 entry 가 직접 등재되어 있지 않아요. 본 entry 가 강제하는 sync 는 "**publish 명령 invocation site 에 OTP routing path 명시**" — release-cut 시 매 publish 명령에 동일 검사 적용 (single surface, N-way 가 아닌 1-surface gate). parent macro 의 N-way sync 와는 결이 달라 별도 registry 항목 미신설.

향후 child micro atom (tty-publish-check / otp-env-fallback) 작성 시 본 entry 의 surfaces[] 에 `child` kind 등재 검토.

## §7. Acknowledged Risk + Future Work

### §7.1 Acknowledged Risk

- **own evidence N=0 ratified**: batch decomposition 시점에서 own data point 미누적, parent macro 의 23/25 evidence inheritance + cross-axis isomorphism 으로 보충. own N=1 누적은 v2.5.62+ post-codify monitoring 으로 진행.
- **maturation gate 17/25 < 18 threshold**: notability gate 2/3 criterion 통과 + parent inheritance 로 ratified. 표준 maturation criterion 의 borderline state — own N=1 evidence 누적 시 promote 검토 (frequency / depth axis 의 own score 재평가).
- **conditional applicability — 적용 범위 좁음**: 2FA 활성화 + publish 명령 실행 환경에만 발동. 2FA 미활성화 registry / source-only release / publish-frequency 낮은 cycle 에서는 not-applicable. 적용 범위 좁아 own evidence 누적 felt slow — own maturation N=1 도달까지 multiple release cycle 필요할 수 있음.
- **micro decomposition (children) 미작성**: tty-publish-check + otp-env-fallback 2 micro atom 후보 명시했으나 실제 파일 작성은 v2.5.62+ batch — 본 entry 단독으로는 command/check/decision 3-tuple 의 §2 표가 micro-grained guidance 의 정본 역할 임시 수행.
- **PostToolUse hook 미구현**: EOTP retry containment hook 은 v0.2+ — 현재는 agent 가 EOTP 응답 시 자동 retry loop 진입 가능성 잔존, user 가 즉시 catch + redirect 해야 함.

### §7.2 Future Work

- **Micro atom decomposition (v2.5.62+ batch)**:
  - `greatpractice/micro/tty-publish-check.md` — TTY 환경에서 publish 실행 확인 precondition
  - `greatpractice/micro/otp-env-fallback.md` — non-TTY 시 NPM_CONFIG_OTP env var 또는 `--otp=` flag 명시 fallback
- **Hook implementation (v0.2+ Greatpractice spec)**:
  - PreToolUse: publish 명령 detect + TTY/OTP routing presence check + non-routing 시 block
  - PostToolUse: EOTP detection + retry containment
- **Own evidence accumulation**:
  - 다음 2FA-enabled publish cycle 에서 본 entry 의 §2 3-tuple 적용 → EOTP 발생률 측정 → N=1 data point 누적 → maturation gate 17 → 18+ 재평가
- **Hub bidirectional cross-link**: hub release.md 의 ⑧ auth row 가 본 EG mezzo entry 를 sister-of reference 로 등재 (hub owner 결정 영역).

---

**End of entry.**
